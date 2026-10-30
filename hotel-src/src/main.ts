import { onAuthStateChanged, User } from "firebase/auth";
import { get, ref, remove, update } from "firebase/database";
import { SIXTY, watchSixtyLook } from "./npc";
import { loadEmojiFont } from "./emojiFont";
import { auth, db, firebaseReady, useEmulator } from "./firebase";
import { authState, friendlyError, isAdminUser, login, logout, register } from "./auth";
import { createProfile, loadProfile, Profile, watchEconomy } from "./db";
import { watchMyWanted } from "./bounty";
import { collectPaidCds } from "./payReturn";
import { checkRaffleAtLogin } from "./raffle";
import { startUpdateCheck } from "./updateCheck";
import { startMaintenanceWatch } from "./maintenance";
import { loadRole, watchMute } from "./roles";
import { watchBroadcast, watchKick, watchNotices, watchOwnName } from "./notices";
import { startPetLook } from "./pets";
import { startUnusual } from "./unusual";
import { mountModPage } from "./ui/modPage";
import { CHATMOD_NAME } from "./shared/mod";
import { publishPriceBook } from "./priceBook";
import { avatarsReady } from "./avatarService";
import { loadCatalog } from "./catalog";
import { h, toast } from "./ui/dom";
import { leaveLocked } from "./leaveLock";
import { lockTime, statusBar } from "./ui/ios";
import { topBar, TopBarApi } from "./ui/topbar";
import { mountEditor } from "./ui/editor";
import { forgetSleep, mountRoom, RoomApi } from "./ui/room";
import { mountShop } from "./ui/shop";
import { mountMessenger } from "./ui/messenger";
import { mountTrades } from "./ui/trade";
import { mountAdmin } from "./ui/admin";
import { runOnboarding } from "./ui/onboarding";
import { trackKeyboard } from "./ui/keyboard";
import { startIosEmoji } from "./ui/iosEmoji";
import { ensureBasementArt, ensureDoorArt } from "./roomRender";
import { startWalkman } from "./walkman";
import { startStreetsFlag } from "./streetsFlag";
import { watchTeleport } from "./notices";
import { watchIdle } from "./idle";
import { player } from "./music";
import { fetchMeta, LOBBY_ID, ownRoomId, STREETS_ID, tutRoomId } from "./rooms";
import { STREET_RETURN_KEY, STREET_RETURN_MS } from "./shared/streets";
import { logAction } from "./logger";
import { watchShopConfig } from "./shopConfig";
import { loadBundledDesigns, loadShopDesigns, loadStarterDesigns, watchDesigns } from "./designs";
import { watchFurni } from "./furniDefs";
import { watchFurniShop } from "./furniShop";
import { otherWindowOpen, publishProfile, releasePresence, social, startPresence, stopPresence, watchSession } from "./social";

startUpdateCheck(); // a phone that still runs an old copy reloads to the new one
startMaintenanceWatch(); // the game can be closed for a while (a message over everything)

export const APP_NAME = "Blodig oktober";

export type View = "room" | "customize" | "shop" | "admin" | "npc" | "mod";

export interface NavOpts {
  /** which room to open when view is "room" (defaults to the last room you were in, at first your own) */
  roomId?: string;
  /** how you come into a room: through the door (default) or standing by your bed (login) */
  arrival?: "door" | "bed" | "stage";
  /** play the first-time wake-up in bed */
  intro?: boolean;
  /** the room you came from: you appear in front of the door that leads back to it */
  from?: string;
  /** build the room again even if it is the one you are in (after a death in your own room: you wake up in bed, not on the floor) */
  force?: boolean;
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
startIosEmoji(); // (iPhone-style emoji on every device)
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
        h("p", {}, "Blodig oktober needs a Firebase project. Add your config to ", h("code", {}, "src/firebaseConfig.ts"), ":"),
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
          useEmulator ? h("p", { class: "notice" }, "(running against local Firebase emulators)") : null))));
}

/** An account is only played from one window at a time; this window is shut out. (No sign-out: the sign-in is shared with the other window.) */
function showLocked(why: "busy" | "taken"): void {
  clear();
  app.append(h("div", { class: "center-screen" }, h("div", { class: "panel auth" },
    h("h1", {}, "Already open"),
    h("p", {}, why === "busy"
      ? "This account is open in another window or device. Blodig oktober can only be played from one place at a time. Close it there, then try again."
      : "This account was opened in another window, so this one has been stopped. Blodig oktober can only be played from one place at a time."),
    h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => location.reload() }, "Try again")))));
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
    await Promise.all([avatarsReady, loadCatalog(), ensureDoorArt(), ensureBasementArt(), loadBundledDesigns(), loadStarterDesigns(), loadShopDesigns()]); // the door art too, so a room never draws without its door
    const designs = watchDesigns(isAdmin); // player-made clothes join the catalog (needs the base catalog first)
    stopDesigns = designs.stop;
    const furni = watchFurni(); // uploaded furniture becomes placeable kinds (rooms must know them before they draw)
    const fshop = watchFurniShop(); // today's four pieces in the shop room (the admin can change them)
    stopFurni = () => { furni.stop(); fshop.stop(); };
    await Promise.all([shop.ready, designs.ready, furni.ready, fshop.ready]); // the admin's prices land on real items
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
  await loadRole(p);
  if (p.isMod && p.name.toLowerCase() === CHATMOD_NAME) { // the chat mod login: no game, only the live chat and the moderation tools
    clear();
    const shell = h("div", { class: "shell modonly" }, h("header", { class: "navbar" }, h("div", { class: "nav-left" }, h("div", { class: "nav-logo" }, "🛡 Chat mod")), h("span", {}), h("div", { class: "nav-right" }, h("button", { class: "btn small", onclick: () => void logout() }, "Log out")))); // (logout from auth.ts: doLogout is made further down, after this early return)
    const host = h("main", { class: "page" });
    shell.append(host);
    app.append(shell);
    mountModPage(host, { profile: p } as unknown as Ctx);
    stopShop(); stopDesigns(); stopFurni();
    return;
  }
  const stopMute = watchMute(p);
  // (the "you are being watched" camera intro, src/watched.ts, is not shown to anybody any more)
  const stopNotices = watchNotices(p); // a warning or a message from a moderator
  const stopKick = watchKick(p, () => void doLogout()); // a moderator threw you out
  const stopName = watchOwnName(p, (name) => { toast(`Your name is ${name} now. The page reloads.`); window.setTimeout(() => window.location.reload(), 1600); }); // an admin renamed you
  const stopBroadcast = watchBroadcast(); // somebody used the loudspeaker
  const stopPetLook = startPetLook(p.uid); // the pet that walks with you (rooms tell everybody)
  const stopUnusual = startUnusual(p.uid); // the unusual you wear
  // one window per account: a second window can't get in while the first is open (two windows could drop the same item twice)
  if (await otherWindowOpen(p.uid)) {
    stopShop(); stopDesigns(); stopFurni();
    return showLocked("busy");
  }
  startPresence(p); // takes the seat right away
  const stopWanted = watchMyWanted(p.uid); // (a hit of bagmand's on me: then I must say which room I walk into)
  const stopEconomy = watchEconomy(p); // what the server writes about you (a trade finishing, ...) shows up at once
  const stopWalkman = startWalkman(p); // (the walkman plays in every room, until you sign out)
  const stopStreetsFlag = startStreetsFlag(); // (is the elevator to the streets switched on?)
  const stopTeleport = watchTeleport(p, (room, on) => go("room", { roomId: room, from: LOBBY_ID, force: true, ...(on ? { arrival: "stage" as const } : {}) })); // (a staff member sent you to the test area: /test1 <name>)
  const stopPriceBook = p.isAdmin ? publishPriceBook() : () => undefined; // the admin's game publishes the clothes price list the server charges from
  const stopSeatWatch = watchSession(p.uid, () => {
    // another window took the seat in the same moment: this one stops
    stopSeatWatch();
    shellCleanup?.();
    shellCleanup = null;
    roomApi?.dispose();
    roomApi = null;
    releasePresence(p.uid);
    stopWalkman();
    stopStreetsFlag();
    stopTeleport();
    stopShop(); stopDesigns(); stopFurni();
    showLocked("taken");
  });
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
    isMod: p.isMod,
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
    forgetSleep(); // the next login starts asleep in bed again
    await new Promise((r) => setTimeout(r, 300));
    stopPresence(p);
    await social.clearRoomInvites();
    await new Promise((r) => setTimeout(r, 150));
    await logout();
  };

  // Social: friends, requests, DMs, knocks and who's online are live for the whole session.
  void publishProfile(p).catch((err) => console.warn("couldn't publish profile", err));
  // The admin account IS 6ixty: its public look follows the one set for him, and the admin's room is his room.
  let stopSixtyLook: (() => void) | null = null;
  if (p.isAdmin) {
    stopSixtyLook = watchSixtyLook((l) => { void update(ref(db, `profiles/${p.uid}`), { name: SIXTY.name, figure: l.figure }).catch(() => undefined); });
    void fetchMeta(ownRoomId(p.uid)).then((m) => {
      if (m && (m.name !== "6ixty's room" || m.ownerName !== SIXTY.name)) void update(ref(db, `roomsMeta/${ownRoomId(p.uid)}`), { name: "6ixty's room", ownerName: SIXTY.name }).catch(() => undefined);
    }).catch(() => undefined);
  }
  social.armInviteCleanup();
  // refreshing the page on the street does not get you out of it: if you were there (and your elevator pass still holds), you are back on the street (read before the presence below says where you are now)
  let backToStreets = false;
  try {
    const stamp = Number(localStorage.getItem(STREET_RETURN_KEY)) || 0;
    if (stamp && Date.now() - stamp < STREET_RETURN_MS && p.tutorial >= 4) {
      const pass = await get(ref(db, `streetPass/${p.uid}`));
      backToStreets = Number(pass.val()) > Date.now() || p.isAdmin;
    }
  } catch { /* no street then */ }
  social.start(p);
  startPresence(p);
  // a crashed or reloaded earlier visit can leave a ghost of you standing in a room; clear those before walking in
  for (const room of [LOBBY_ID, ownRoomId(p.uid), tutRoomId(p.uid)]) void remove(ref(db, `rooms/${room}/players/${p.uid}`)).catch(() => undefined);
  logAction(p, "login", "opened Blodig oktober");
  const stopMessenger = mountMessenger(shell, ctx);
  void collectPaidCds(p); // back from the payment page, or an earlier payment still waiting: the CD is handed over
  checkRaffleAtLogin(p, () => window.dispatchEvent(new Event("pocket-changed"))); // a raffle draw that was due: asked for, and a win is announced
  const stopTrades = mountTrades(ctx);
  // 10 minutes without touching anything: marked idle (the door's room list says so) and sent home to your own room
  const stopIdle = watchIdle(p, () => {
    const own = ownRoomId(p.uid);
    if (roomMounted === own && pageHost.hidden) return;
    logAction(p, "visit", "went idle and was sent home");
    go("room", { roomId: own, arrival: "bed" });
  });
  offBadge = social.subscribe(() => bar?.setBadge(social.badgeCount));
  bar.setBadge(social.badgeCount);
  shellCleanup = () => {
    stopWanted();
    stopEconomy();
    stopMute();
    stopNotices();
    stopKick();
    stopName();
    stopBroadcast();
    stopPetLook();
    stopUnusual();
    stopPriceBook();
    stopWalkman();
    stopStreetsFlag();
    stopTeleport();
    stopSixtyLook?.();
    stopIdle();
    stopMessenger();
    stopTrades();
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

  // (testing in the emulator: window.__go("streets") jumps to a room)
  if (import.meta.env.MODE === "emulator") (window as unknown as { __go?: (roomId: string, o?: NavOpts) => void }).__go = (roomId, o) => go("room", { roomId, force: true, ...o });
  function go(view: View, opts: NavOpts = {}): void {
    if ((view === "admin" || view === "npc") && !p.isAdmin) view = "room";
    if (view === "mod" && !p.isMod) view = "room";
    if (view === "room") {
      let target = opts.roomId ?? lastRoomId;
      // until the introduction is over, the basement is the private copy (nobody else is in it)
      if (target === LOBBY_ID && p.tutorial < 4 && !p.isAdmin) target = tutRoomId(p.uid);
      if (roomApi && roomMounted !== target && !opts.force && leaveLocked()) { toast("You are in a fight. You can't leave yet.", "err"); return; } // (10 seconds after the last blow)
      pageCleanup?.();
      pageCleanup = null;
      pageHost.replaceChildren();
      pageHost.hidden = true;
      roomHost.hidden = false;
      if (roomApi && roomMounted === target && !opts.force) {
        roomApi.show();
      } else {
        // a different room: leave the old one, walk into the new one
        roomApi?.dispose();
        roomHost.replaceChildren();
        roomMounted = target;
        lastRoomId = target;
        roomApi = mountRoom(roomHost, ctx, target, { arrival: opts.arrival, intro: opts.intro, from: opts.from });
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
      else if (view === "mod") pageCleanup = mountModPage(pageHost, ctx);
      if (view === "shop" || view === "admin" || view === "mod") {
        // no Room tab any more: these pages have a Go back button at the bottom, like the Character page
        pageHost.append(h("div", { class: "page-back" }, h("button", { class: "btn", onclick: () => go("room") }, "Go back")));
      }
    }
    bar?.setActive(view);
  }

  // Everyone starts in their own room, standing at the door.
  if (backToStreets) go("room", { roomId: STREETS_ID, from: LOBBY_ID });
  else go("room", { roomId: ownRoomId(p.uid), arrival: "bed", intro });
}

// ---- boot ----------------------------------------------------------------------

document.title = APP_NAME;
if (!firebaseReady) {
  showSetup();
} else {
  showLoading("Connecting…");
  loadEmojiFont();
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

