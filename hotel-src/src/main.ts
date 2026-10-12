import { onAuthStateChanged, User } from "firebase/auth";
import { ref, remove } from "firebase/database";
import { auth, db, firebaseReady, useEmulator } from "./firebase";
import { authState, friendlyError, isAdminUser, login, logout, register } from "./auth";
import { createProfile, loadProfile, Profile } from "./db";
import { avatarsReady } from "./avatarService";
import { loadCatalog } from "./catalog";
import { h, toast } from "./ui/dom";
import { lockTime, statusBar } from "./ui/ios";
import { topBar, TopBarApi } from "./ui/topbar";
import { mountEditor } from "./ui/editor";
import { mountRoom, RoomApi } from "./ui/room";
import { mountShop } from "./ui/shop";
import { mountMessenger } from "./ui/messenger";
import { mountAdmin } from "./ui/admin";
import { runOnboarding } from "./ui/onboarding";
import { trackKeyboard } from "./ui/keyboard";
import { ensureBasementArt, ensureDoorArt } from "./roomRender";
import { watchIdle } from "./idle";
import { player } from "./music";
import { fetchMeta, LOBBY_ID, ownRoomId } from "./rooms";
import { logAction } from "./logger";
import { watchShopConfig } from "./shopConfig";
import { watchDesigns } from "./designs";
import { watchFurni } from "./furniDefs";
import { publishProfile, social, startPresence, stopPresence } from "./social";

export const APP_NAME = "6ixPlanet";
export const STAFF_NOTICE = "Staff can see chat, private messages and activity on 6ixPlanet.";

export type View = "room" | "customize" | "shop" | "admin" | "npc";

export interface NavOpts {
  /** which room to open when view is "room" (defaults to the last room you were in, at first your own) */
  roomId?: string;
  /** how you come into a room: through the door (default) or standing by your bed (login) */
  arrival?: "door" | "bed";
  /** play the first-time wake-up in bed */
  intro?: boolean;
}

export interface Ctx {
  profile: Profile;
  navigate(view: View, opts?: NavOpts): void;
  refreshHeader(): void;
  /** tell the room you're standing in that your look changed */
  lookChanged(): void;
}

const app = document.getElementById("app")!;
trackKeyboard();
/** things that live as long as you're signed in (messenger, presence, friends listeners) */
let shellCleanup: (() => void) | null = null;

function clear(): void {
  shellCleanup?.();
  shellCleanup = null;
  app.replaceChildren();
}

// ---- screens -----------------------------------------------------------------

function showSetup(): void {
  clear();
  app.append(
    h("div", { class: "center-screen" },
      h("div", { class: "panel auth" },
        h("h1", {}, "Almost there"),
        h("p", {}, "6ixPlanet needs a Firebase project. Add your config to ", h("code", {}, "src/firebaseConfig.ts"), ":"),
        h("ol", {},
          h("li", {}, "Firebase console → create a project → add a Web app, copy its config"),
          h("li", {}, "Build → Authentication → enable the Email/Password provider (usernames are mapped onto it; no real emails are used)"),
          h("li", {}, "Build → Realtime Database → create a database"),
          h("li", {}, "Publish database.rules.json as its rules")),
        h("p", { class: "muted" }, "Or run the local emulators: ", h("code", {}, "npm run emulators"), " + ", h("code", {}, "npm run dev:emu")))));
}

function showLoading(msg: string): void {
  clear();
  app.append(h("div", { class: "center-screen" }, h("div", { class: "loading" }, msg)));
}

/** The lock screen: wallpaper, big clock, and the sign-in form. */
function showAuth(): void {
  clear();
  player.stop();
  let registering = false;
  const err = h("div", { class: "form-error" });
  const name = h("input", { type: "text", placeholder: "required", autocomplete: "username", maxLength: 16, required: true, autocapitalize: "none", spellcheck: false });
  const pass = h("input", { type: "password", placeholder: "required", autocomplete: "current-password", required: true });
  const submit = h("button", { class: "btn primary", type: "submit" }, "Log in");
  const toggle = h("button", { class: "link", type: "button" }, "No account? Register");

  function sync(): void {
    submit.textContent = registering ? "Create account" : "Log in";
    toggle.textContent = registering ? "Have an account? Log in" : "No account? Register";
    pass.placeholder = registering ? "6+ characters" : "required";
    pass.autocomplete = registering ? "new-password" : "current-password";
    err.textContent = "";
  }
  toggle.addEventListener("click", () => { registering = !registering; sync(); });

  const form = h("form", {
    class: "auth-form",
    onsubmit: async (e: Event) => {
      e.preventDefault();
      err.textContent = "";
      submit.disabled = true;
      try {
        if (registering) {
          await register(name.value.trim(), pass.value);
          route(auth.currentUser); // the auth listener skipped this sign-in while registering
        } else {
          await login(name.value, pass.value); // onAuthStateChanged takes it from here
        }
      } catch (ex) {
        err.textContent = friendlyError(ex);
        submit.disabled = false;
      }
    },
  },
  h("div", { class: "group" },
    h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Username"), name),
    h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Password"), pass)),
  err, submit, toggle);

  const now = new Date();
  app.append(
    h("div", { class: "shell" }, statusBar(),
      h("div", { class: "lock" },
        h("div", { class: "lock-clock" },
          h("div", { class: "t" }, lockTime(now)),
          h("div", { class: "d" }, now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }))),
        h("div", { class: "auth" },
          h("div", { class: "logo" }, APP_NAME),
          h("p", { class: "tagline" }, "Sign in to hang out."),
          form,
          h("p", { class: "notice" }, STAFF_NOTICE),
          useEmulator ? h("p", { class: "notice" }, "(running against local Firebase emulators)") : null))));
}

// ---- the signed-in app ------------------------------------------------------------------

async function showHotel(user: User): Promise<void> {
  showLoading("Loading your character…");
  const isAdmin = isAdminUser(user);
  let profile: Profile | null;
  let stopShop: () => void = () => undefined;
  let stopDesigns: () => void = () => undefined;
  let stopFurni: () => void = () => undefined;
  try {
    const shop = watchShopConfig();
    stopShop = shop.stop;
    await Promise.all([avatarsReady, loadCatalog(), ensureDoorArt(), ensureBasementArt()]); // the door art too, so a room never draws without its door
    const designs = watchDesigns(isAdmin); // player-made clothes join the catalog (needs the base catalog first)
    stopDesigns = designs.stop;
    const furni = watchFurni(); // uploaded furniture becomes placeable kinds (rooms must know them before they draw)
    stopFurni = furni.stop;
    await Promise.all([shop.ready, designs.ready, furni.ready]); // the admin's prices land on real items
    profile = await loadProfile(user.uid, isAdmin);
    if (!profile) {
      // Account exists but profile is missing (e.g. interrupted registration); create one so the user isn't locked out.
      profile = await createProfile(user.uid, (user.email ?? "").split("@")[0].slice(0, 16).padEnd(3, "_"));
      profile.isAdmin = isAdmin;
    }
  } catch (ex) {
    stopShop();
    stopDesigns();
    stopFurni();
    clear();
    app.append(h("div", { class: "center-screen" }, h("div", { class: "panel auth" },
      h("h1", {}, "Couldn't load"), h("p", {}, friendlyError(ex)),
      h("div", { class: "row" },
        h("button", { class: "btn", onclick: () => location.reload() }, "Retry"),
        h("button", { class: "btn", onclick: () => logout() }, "Log out")))));
    return;
  }
  const p = profile;
  let bar: TopBarApi | null = null;
  let roomApi: RoomApi | null = null;
  let roomMounted = "";
  let lastRoomId = ownRoomId(p.uid);
  let pageCleanup: (() => void) | null = null;
  let offBadge: (() => void) | null = null;

  const ctx: Ctx = {
    profile: p,
    navigate: (v, opts) => go(v, opts),
    refreshHeader: () => bar?.refreshBlood(p.blood),
    lookChanged: () => roomApi?.figureChanged(),
  };

  // ---- first run: pick an avatar, then a room (skipped for players who already have both) ----
  let ownMeta = null as Awaited<ReturnType<typeof fetchMeta>>;
  try { ownMeta = await fetchMeta(ownRoomId(p.uid)); } catch { /* treated as "no room yet"; the room step will say if it can't write */ }
  const needAvatar = !p.figure;
  const needRoom = !ownMeta;
  let intro = false;
  if (needAvatar || needRoom) {
    clear();
    const host = h("div", { class: "onb-host" });
    app.append(h("div", { class: "shell" }, statusBar(), host));
    await runOnboarding(host, ctx, needAvatar, needRoom);
    intro = !p.seenDoor; // the wake-up plays once, for someone who has never opened the door
  }

  clear();
  const roomHost = h("div", { class: "room-host" });
  const pageHost = h("main", { class: "page", hidden: true });
  bar = topBar({
    appName: APP_NAME,
    isAdmin: p.isAdmin,
    onNav: (v) => go(v),
    onLogout: () => void doLogout(),
  });
  const shell = h("div", { class: "shell" }, statusBar(), bar.el, roomHost, pageHost);
  app.append(shell);
  ctx.refreshHeader();

  /** Leave cleanly: take your avatar and presence out of the room *before* signing out (afterwards the rules would refuse). */
  const doLogout = async () => {
    logAction(p, "logout", "logged out");
    roomApi?.dispose();
    roomApi = null;
    await new Promise((r) => setTimeout(r, 300));
    stopPresence(p);
    await social.clearRoomInvites();
    await new Promise((r) => setTimeout(r, 150));
    await logout();
  };

  // Social: friends, requests, DMs, knocks and who's online are live for the whole session.
  void publishProfile(p).catch((err) => console.warn("couldn't publish profile", err));
  social.start(p);
  social.armInviteCleanup();
  startPresence(p);
  // a crashed or reloaded earlier visit can leave a ghost of you standing in a room; clear those before walking in
  for (const room of [LOBBY_ID, ownRoomId(p.uid)]) void remove(ref(db, `rooms/${room}/players/${p.uid}`)).catch(() => undefined);
  logAction(p, "login", "opened 6ixPlanet");
  const stopMessenger = mountMessenger(shell, ctx);
  // 15 minutes without touching anything: marked idle (the door's room list says so) and sent home to your own room
  const stopIdle = watchIdle(p, () => {
    const own = ownRoomId(p.uid);
    if (roomMounted === own && pageHost.hidden) return;
    logAction(p, "visit", "went idle and was sent home");
    go("room", { roomId: own, arrival: "bed" });
  });
  offBadge = social.subscribe(() => bar?.setBadge(social.badgeCount));
  bar.setBadge(social.badgeCount);
  shellCleanup = () => {
    stopIdle();
    stopMessenger();
    stopShop();
    stopDesigns();
    stopFurni();
    offBadge?.();
    roomApi?.dispose();
    roomApi = null;
    pageCleanup?.();
    pageCleanup = null;
    social.stop();
  };

  function mountCharacter(host: HTMLElement, mode: "customize" | "npc" = "customize"): () => void {
    const body = h("div", { class: "char-body" });
    host.append(body);
    return mountEditor(body, ctx, mode);
  }

  function go(view: View, opts: NavOpts = {}): void {
    if ((view === "admin" || view === "npc") && !p.isAdmin) view = "room";
    if (view === "room") {
      const target = opts.roomId ?? lastRoomId;
      pageCleanup?.();
      pageCleanup = null;
      pageHost.replaceChildren();
      pageHost.hidden = true;
      roomHost.hidden = false;
      if (roomApi && roomMounted === target) {
        roomApi.show();
      } else {
        // a different room: leave the old one, walk into the new one
        roomApi?.dispose();
        roomHost.replaceChildren();
        roomMounted = target;
        lastRoomId = target;
        roomApi = mountRoom(roomHost, ctx, target, { arrival: opts.arrival, intro: opts.intro });
      }
      ctx.refreshHeader();
    } else {
      roomApi?.hide();
      roomHost.hidden = true;
      pageCleanup?.();
      pageCleanup = null;
      pageHost.replaceChildren();
      pageHost.hidden = false;
      pageHost.scrollTop = 0;
      if (view === "customize") pageCleanup = mountCharacter(pageHost);
      else if (view === "npc") pageCleanup = mountCharacter(pageHost, "npc");
      else if (view === "shop") pageCleanup = mountShop(pageHost, ctx);
      else if (view === "admin") pageCleanup = mountAdmin(pageHost, ctx);
      if (view === "shop" || view === "admin") {
        // no Room tab any more: these pages have a Go back button at the bottom, like the Character page
        pageHost.append(h("div", { class: "page-back" }, h("button", { class: "btn", onclick: () => go("room") }, "Go back")));
      }
    }
    bar?.setActive(view);
  }

  // Everyone starts in their own room, standing at the door.
  go("room", { roomId: ownRoomId(p.uid), arrival: "bed", intro });
}

// ---- boot ----------------------------------------------------------------------

document.title = APP_NAME;
if (!firebaseReady) {
  showSetup();
} else {
  showLoading("Connecting…");
  onAuthStateChanged(auth, (user) => {
    if (!authState.registering) route(user);
  });
}

let lastUid: string | null | undefined;
function route(user: User | null): void {
  if ((user?.uid ?? null) === lastUid) return;
  lastUid = user?.uid ?? null;
  // Only real hotel accounts (username + password) get in. Anonymous sessions belong to other apps sharing this project.
  if (user && (user.isAnonymous || !user.email)) {
    void logout();
    return showAuth();
  }
  if (user) showHotel(user).catch((ex) => toast(friendlyError(ex), "err"));
  else showAuth();
}

