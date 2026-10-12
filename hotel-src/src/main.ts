import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseReady, useEmulator } from "./firebase";
import { authState, friendlyError, login, logout, register } from "./auth";
import { createProfile, loadProfile, Profile } from "./db";
import { avatarsReady } from "./avatarService";
import { loadCatalog } from "./catalog";
import { h, toast } from "./ui/dom";
import { mountEditor } from "./ui/editor";
import { mountRoom } from "./ui/room";
import { mountShop } from "./ui/shop";
import { mountWardrobe } from "./ui/wardrobe";
import { mountNavigator } from "./ui/navigator";
import { mountMessenger } from "./ui/messenger";
import { BLOOD_ICON } from "./items";
import { player } from "./music";
import { LOBBY_ID } from "./rooms";
import { publishProfile, social, startPresence, stopPresence } from "./social";

export type View = "room" | "rooms" | "customize" | "wardrobe" | "shop";

export interface NavOpts {
  /** which room to open when view is "room" (defaults to the lobby) */
  roomId?: string;
  onboarding?: boolean;
}

export interface Ctx {
  profile: Profile;
  navigate(view: View, opts?: NavOpts): void;
  refreshHeader(): void;
}

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
        h("p", {}, "This demo needs a Firebase project. Add your config to ", h("code", {}, "src/firebaseConfig.ts"), ":"),
        h("ol", {},
          h("li", {}, "Firebase console → create a project → add a Web app, copy its config"),
          h("li", {}, "Build → Authentication → enable the Email/Password provider (usernames are mapped onto it; no real emails are used)"),
          h("li", {}, "Build → Realtime Database → create a database"),
          h("li", {}, "Paste database.rules.json into the database Rules tab and publish")),
        h("p", { class: "muted" }, "Or run the local emulators: ", h("code", {}, "npm run emulators"), " + ", h("code", {}, "npm run dev:emu")))));
}

function showLoading(msg: string): void {
  clear();
  app.append(h("div", { class: "center-screen" }, h("div", { class: "loading" }, msg)));
}

function showAuth(): void {
  clear();
  player.stop();
  let registering = false;
  const err = h("div", { class: "form-error" });
  const name = h("input", { type: "text", placeholder: "Username", autocomplete: "username", maxLength: 16, required: true });
  const pass = h("input", { type: "password", placeholder: "Password", autocomplete: "current-password", required: true });
  const submit = h("button", { class: "btn primary", type: "submit" }, "Log in");
  const toggle = h("button", { class: "link", type: "button" }, "No account? Register");

  function sync(): void {
    submit.textContent = registering ? "Create account" : "Log in";
    toggle.textContent = registering ? "Have an account? Log in" : "No account? Register";
    pass.placeholder = registering ? "Password (6+ characters)" : "Password";
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
  }, h("label", {}, name), h("label", {}, pass), err, submit, toggle);

  app.append(
    h("div", { class: "center-screen" },
      h("div", { class: "panel auth" },
        h("div", { class: "logo" }, "Bobba Hotel"),
        h("p", { class: "muted" }, "Log in, build your character, and hang out in the lobby."),
        form,
        useEmulator ? h("p", { class: "muted" }, "(running against local Firebase emulators)") : null)));
}

// ---- shell ---------------------------------------------------------------------

async function showHotel(user: User): Promise<void> {
  showLoading("Loading your character…");
  let profile: Profile | null;
  try {
    await Promise.all([avatarsReady, loadCatalog()]);
    profile = await loadProfile(user.uid);
    if (!profile) {
      // Account exists but profile is missing (e.g. interrupted registration); create one so the user isn't locked out.
      profile = await createProfile(user.uid, (user.email ?? "").split("@")[0].slice(0, 16).padEnd(3, "_"));
    }
  } catch (ex) {
    clear();
    app.append(h("div", { class: "center-screen" }, h("div", { class: "panel auth" },
      h("h1", {}, "Couldn't load"), h("p", {}, friendlyError(ex)),
      h("button", { class: "btn", onclick: () => location.reload() }, "Retry"),
      h("button", { class: "btn", onclick: () => logout() }, "Log out"))));
    return;
  }
  const p = profile;

  clear();
  const coins = h("span", { class: "coins" });
  const nav = h("nav", {});
  const main = h("main", {});

  /** Leave cleanly: take your avatar and presence out of the room *before* signing out (afterwards the rules would refuse). */
  const doLogout = async () => {
    cleanup?.();
    cleanup = null;
    await new Promise((r) => setTimeout(r, 300));
    stopPresence(p);
    await new Promise((r) => setTimeout(r, 150));
    await logout();
  };

  const header = h("header", {},
    h("div", { class: "logo small" }, "Bobba Hotel"),
    nav,
    h("div", { class: "me" }, h("span", { class: "who" }, p.name), coins, h("button", { class: "btn small", onclick: () => void doLogout() }, "Log out")));
  const shell = h("div", { class: "shell" }, header, main);
  app.append(shell);

  const ctx: Ctx = {
    profile: p,
    navigate: (v, opts) => go(v, opts),
    refreshHeader() {
      coins.replaceChildren(h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "drops of blood" }), ` ${p.blood}`);
      coins.title = "Drops of blood";
    },
  };

  // Social: friends, requests, DMs, invites and who's online are live for the whole session.
  void publishProfile(p).catch((err) => console.warn("couldn't publish profile", err));
  social.start(p);
  startPresence(p);
  const stopMessenger = mountMessenger(shell, ctx);
  shellCleanup = () => {
    stopMessenger();
    social.stop();
  };

  let current: View = "room";
  const labels: Array<[View, string]> = [["room", "Lobby"], ["rooms", "Rooms"], ["customize", "Character"], ["wardrobe", "Wardrobe"], ["shop", "Shop"]];

  function go(view: View, opts: NavOpts = {}): void {
    cleanup?.();
    cleanup = null;
    main.replaceChildren();
    current = view;
    nav.replaceChildren(...labels.map(([v, label]) =>
      h("button", { class: "navbtn" + (v === current ? " on" : ""), disabled: !!opts.onboarding, onclick: () => go(v) }, label)));
    ctx.refreshHeader();
    if (view === "room") cleanup = mountRoom(main, ctx, opts.roomId ?? LOBBY_ID);
    else if (view === "rooms") cleanup = mountNavigator(main, ctx);
    else if (view === "customize") cleanup = mountEditor(main, ctx, "customize", !!opts.onboarding);
    else if (view === "shop") cleanup = mountShop(main, ctx);
    else cleanup = mountWardrobe(main, ctx);
  }

  // New players go through the customizer first, everyone else lands in the lobby.
  if (!p.figure) go("customize", { onboarding: true });
  else go("room");
}

// ---- boot ----------------------------------------------------------------------

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
