import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseReady, useEmulator } from "./firebase";
import { authState, friendlyError, isAdminUser, login, logout, register } from "./auth";
import { createProfile, loadProfile, Profile } from "./db";
import { avatarsReady } from "./avatarService";
import { loadCatalog } from "./catalog";
import { h, toast } from "./ui/dom";
import { lockTime, navBar, statusBar } from "./ui/ios";
import { mountEditor } from "./ui/editor";
import { mountRoom } from "./ui/room";
import { mountShop } from "./ui/shop";
import { mountWardrobe } from "./ui/wardrobe";
import { mountNavigator } from "./ui/navigator";
import { mountMessenger } from "./ui/messenger";
import { mountAdmin } from "./ui/admin";
import { BLOOD_ICON } from "./items";
import { player } from "./music";
import { LOBBY_ID } from "./rooms";
import { assetUrl } from "./assetUrl";
import { FEATURES } from "./features";
import { logAction } from "./logger";
import { watchShopConfig } from "./shopConfig";
import { publishProfile, social, startPresence, stopPresence } from "./social";

export const APP_NAME = "6ixPlanet";
export const STAFF_NOTICE = "Staff can see chat, private messages and activity on 6ixPlanet.";

export type View = "home" | "room" | "rooms" | "customize" | "wardrobe" | "shop" | "admin";

export interface NavOpts {
  /** which room to open when view is "room" (defaults to the lobby; other rooms only exist when FEATURES.rooms is on) */
  roomId?: string;
  onboarding?: boolean;
}

export interface Ctx {
  profile: Profile;
  navigate(view: View, opts?: NavOpts): void;
  refreshHeader(): void;
}

const TITLES: Record<View, string> = { home: APP_NAME, room: "Lobby", rooms: "Rooms", customize: "Character", wardrobe: "Wardrobe", shop: "Shop", admin: "Admin" };

const app = document.getElementById("app")!;
let cleanup: (() => void) | null = null;
/** things that live as long as you're signed in (messenger, presence, friends listeners) */
let shellCleanup: (() => void) | null = null;

function clear(): void {
  cleanup?.();
  cleanup = null;
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
          h("p", { class: "tagline" }, "Sign in to hang out in the lobby."),
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
  try {
    const shop = watchShopConfig();
    stopShop = shop.stop;
    await Promise.all([avatarsReady, loadCatalog()]);
    await shop.ready; // after the catalog, so the admin's prices land on real items
    profile = await loadProfile(user.uid, isAdmin);
    if (!profile) {
      // Account exists but profile is missing (e.g. interrupted registration); create one so the user isn't locked out.
      profile = await createProfile(user.uid, (user.email ?? "").split("@")[0].slice(0, 16).padEnd(3, "_"));
      profile.isAdmin = isAdmin;
    }
  } catch (ex) {
    stopShop();
    clear();
    app.append(h("div", { class: "center-screen" }, h("div", { class: "panel auth" },
      h("h1", {}, "Couldn't load"), h("p", {}, friendlyError(ex)),
      h("div", { class: "row" },
        h("button", { class: "btn", onclick: () => location.reload() }, "Retry"),
        h("button", { class: "btn", onclick: () => logout() }, "Log out")))));
    return;
  }
  const p = profile;

  clear();
  const region = h("div", { style: { flex: "1", minHeight: "0", display: "flex", flexDirection: "column" } });
  const shell = h("div", { class: "shell", "data-view": "home" }, statusBar(), region);
  app.append(shell);

  /** Leave cleanly: take your avatar and presence out of the room *before* signing out (afterwards the rules would refuse). */
  const doLogout = async () => {
    logAction(p, "logout", "logged out");
    cleanup?.();
    cleanup = null;
    await new Promise((r) => setTimeout(r, 300));
    stopPresence(p);
    await new Promise((r) => setTimeout(r, 150));
    await logout();
  };

  const ctx: Ctx = {
    profile: p,
    navigate: (v, opts) => go(v, opts),
    refreshHeader() {
      document.querySelectorAll(".coins").forEach((el) => {
        el.replaceChildren(h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "drops of blood" }), ` ${p.blood}`);
        (el as HTMLElement).title = "Drops of blood";
      });
    },
  };

  // Social: friends, requests, DMs, invites and who's online are live for the whole session.
  void publishProfile(p).catch((err) => console.warn("couldn't publish profile", err));
  social.start(p);
  startPresence(p);
  logAction(p, "login", "opened 6ixPlanet");
  const stopMessenger = mountMessenger(shell, ctx);
  let offBadge: (() => void) | null = null;
  shellCleanup = () => {
    stopMessenger();
    stopShop();
    offBadge?.();
    social.stop();
  };

  // ---- home screen (springboard) ----
  function renderHome(): HTMLElement {
    interface App { id: string; label: string; icon: string; view?: View; run?: () => void; badge?: boolean }
    const apps: App[] = [
      { id: "room", label: "Lobby", icon: assetUrl("ios6/icon-door.png"), view: "room" },
      { id: "customize", label: "Character", icon: assetUrl("ios6/character.svg"), view: "customize" },
      { id: "wardrobe", label: "Wardrobe", icon: assetUrl("ios6/wardrobe.svg"), view: "wardrobe" },
      { id: "shop", label: "Shop", icon: assetUrl("ios6/icon-store.png"), view: "shop" },
      { id: "friends", label: "Friends", icon: assetUrl("ios6/icon-chat.png"), run: () => window.dispatchEvent(new CustomEvent("toggle-friends")), badge: true },
      ...(FEATURES.rooms ? [{ id: "rooms", label: "Rooms", icon: assetUrl("ios6/icon-settings.png"), view: "rooms" as View }] : []),
      ...(p.isAdmin ? [{ id: "admin", label: "Admin", icon: assetUrl("ios6/icon-admin.png"), view: "admin" as View }] : []),
      { id: "logout", label: "Log out", icon: assetUrl("ios6/icon-logout.svg"), run: () => void doLogout() },
    ];

    const board = h("div", { class: "springboard app-open" });
    const grid = h("div", { class: "sb-grid", role: "list" });
    for (const a of apps) {
      const icon = h("span", { class: "sb-icon", style: { backgroundImage: `url("${a.icon}")` } });
      const badge = a.badge ? h("span", { class: "sb-badge hidden", "data-friends-badge": "1" }) : null;
      if (badge) icon.append(badge);
      const btn = h("button", {
        class: "sb-app",
        role: "listitem",
        onclick: () => {
          if (a.run) return a.run();
          // zoom into the icon, then open the app (like iOS)
          const r = icon.getBoundingClientRect();
          board.style.setProperty("--ox", r.left + r.width / 2 + "px");
          board.style.setProperty("--oy", r.top + r.height / 2 - 64 + "px");
          board.classList.add("out");
          setTimeout(() => go(a.view!), 280);
        },
      }, icon, h("span", { class: "sb-label" }, a.label));
      grid.append(btn);
    }
    const updateBadge = () => {
      const n = social.totalUnread;
      document.querySelectorAll("[data-friends-badge]").forEach((el) => {
        el.textContent = String(n);
        el.classList.toggle("hidden", n === 0);
      });
    };
    offBadge?.();
    offBadge = social.subscribe(updateBadge);
    updateBadge();
    board.append(
      grid,
      h("div", { class: "sb-footer" }, `${APP_NAME} is open source (GPL-3.0): `, h("a", { href: "https://github.com/playlistlobby/playlistlobby.github.io/tree/main/hotel-src", target: "_blank", rel: "noopener" }, "source")),
      h("div", { class: "sb-dock", "aria-hidden": "true" }, h("div", { class: "sb-shelf" })));
    return board;
  }

  function go(view: View, opts: NavOpts = {}): void {
    cleanup?.();
    cleanup = null;
    region.replaceChildren();
    shell.dataset.view = view;
    if (view === "home") {
      region.append(renderHome());
      return;
    }
    const onboarding = !!opts.onboarding;
    const bar = navBar({
      title: TITLES[view],
      back: onboarding ? undefined : { label: "Home", onBack: () => go("home") },
      right: [h("span", { class: "barbtn blood-pill" }, h("span", { class: "coins" }))],
    });
    const main = h("main", { class: "app-open" });
    region.append(bar, main);
    ctx.refreshHeader();
    if (view === "room") cleanup = mountRoom(main, ctx, FEATURES.rooms ? opts.roomId ?? LOBBY_ID : LOBBY_ID);
    else if (view === "rooms" && FEATURES.rooms) cleanup = mountNavigator(main, ctx);
    else if (view === "customize") cleanup = mountEditor(main, ctx, "customize", onboarding);
    else if (view === "shop") cleanup = mountShop(main, ctx);
    else if (view === "admin" && p.isAdmin) cleanup = mountAdmin(main, ctx);
    else if (view === "wardrobe") cleanup = mountWardrobe(main, ctx);
    else go("home");
  }

  // New players go through the customizer first, everyone else starts on the home screen.
  if (!p.figure) go("customize", { onboarding: true });
  else go("home");
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
