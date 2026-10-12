import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { createProfile, Profile } from "./db";

const NAME_RE = /^[A-Za-z0-9_.-]{3,16}$/;

// Firebase Auth identifies users by email, so a username is mapped to an internal, never-shown address.
// ".invalid" is a reserved TLD that can never receive mail. Trade-off: no email-based password reset.
const toEmail = (username: string) => `${username.toLowerCase()}@users.bobba.invalid`;

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
  authState.registering = true;
  try {
    // Auth rejects a duplicate address, which is what makes usernames unique.
    const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password);
    try {
      return await createProfile(cred.user.uid, username);
    } catch (err) {
      // Don't leave a half-registered account behind.
      await deleteUser(cred.user).catch(() => undefined);
      throw err;
    }
  } finally {
    authState.registering = false;
  }
}

export async function login(username: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, toEmail(username.trim()), password);
}

export function logout(): Promise<void> {
  return signOut(auth);
}
