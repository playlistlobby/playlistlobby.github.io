import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { auth } from "./firebase";
import { createProfile, Profile } from "./db";
import { logAction } from "./logger";

const NAME_RE = /^[A-Za-z0-9_.-]{3,16}$/;

// Firebase Auth identifies users by email, so a username is mapped to an internal, never-shown address.
// ".invalid" is a reserved TLD that can never receive mail. Trade-off: no email-based password reset.
const toEmail = (username: string) => `${username.toLowerCase()}@users.bobba.invalid`;

/** The admin is the account with username "adminsidia". database.rules.json and the server recognise it by this same address. */
export const ADMIN_USERNAME = "adminsidia";
export const ADMIN_EMAIL = toEmail(ADMIN_USERNAME);
export const isAdminUser = (user: { email?: string | null } | null): boolean => !!user && user.email === ADMIN_EMAIL;
const RESERVED = new Set([ADMIN_USERNAME, "admin", "administrator", "moderator", "staff", "6ixplanet"]);

export function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Wrong username or password.",
    "auth/wrong-password": "Wrong username or password.",
    "auth/user-not-found": "Wrong username or password.",
    "auth/email-already-in-use": "That username is taken.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Usernames can only use letters, numbers, . _ -",
    "auth/too-many-requests": "Too many attempts, try again in a moment.",
    "auth/network-request-failed": "Can't reach Firebase. Check your connection / config.",
  };
  return map[code] ?? (err as Error)?.message ?? "Something went wrong.";
}

/** While true, the auth-state listener in main.ts holds off routing so it doesn't race the profile creation. */
export const authState = { registering: false };

export async function register(username: string, password: string): Promise<Profile> {
  if (!NAME_RE.test(username)) throw new Error("Username must be 3-16 characters: letters, numbers, . _ -");
  if (RESERVED.has(username.toLowerCase())) throw new Error("That username is reserved.");
  authState.registering = true;
  try {
    // Auth rejects a duplicate address, which is what makes usernames unique.
    const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password);
    try {
      const profile = await createProfile(cred.user.uid, username);
      logAction(profile, "register", "created the account");
      return profile;
    } catch (err) {
      // Don't leave a half-registered account behind.
      await deleteUser(cred.user).catch(() => undefined);
      throw err;
    }
  } finally {
    authState.registering = false;
  }
}

// Against guessing passwords: after 4 wrong tries in a row this browser has to wait (30 seconds, then twice as long after each further miss, at most 15 minutes).
// (This only slows down someone using the game's own page; Firebase itself also slows down repeated wrong tries on its side.)
const FAIL_KEY = "sixplanet.loginFails";
const WRONG_CODES = new Set(["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"]);
function failState(): { n: number; until: number } {
  try { const v = JSON.parse(localStorage.getItem(FAIL_KEY) ?? "null"); if (v && typeof v.n === "number" && typeof v.until === "number") return v; } catch { /* no storage */ }
  return { n: 0, until: 0 };
}
const saveFails = (v: { n: number; until: number }): void => { try { localStorage.setItem(FAIL_KEY, JSON.stringify(v)); } catch { /* no storage */ } };

export async function login(username: string, password: string): Promise<void> {
  const st = failState();
  const left = Math.ceil((st.until - Date.now()) / 1000);
  if (left > 0) throw new Error("Too many wrong tries. Wait " + (left > 90 ? Math.ceil(left / 60) + " minutes" : left + " seconds") + " and try again.");
  try {
    await signInWithEmailAndPassword(auth, toEmail(username.trim()), password);
    saveFails({ n: 0, until: 0 });
  } catch (err) {
    if (WRONG_CODES.has((err as { code?: string })?.code ?? "")) {
      const n = st.n + 1;
      saveFails({ n, until: n >= 4 ? Date.now() + Math.min(15 * 60_000, 30_000 * 2 ** (n - 4)) : 0 });
    }
    throw err;
  }
}

/** Change the signed-in account's password (needs the current one again, like any sensible app). */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("You're not signed in.");
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}

export function logout(): Promise<void> {
  return signOut(auth);
}
