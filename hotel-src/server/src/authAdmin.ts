// Firebase Auth, with admin rights: changing the address an account signs in with (a rename: the username is the address, see src/auth.ts toEmail).
// Production: a token made from the service-account key. Emulator: the "owner" bypass token, against the Auth emulator.
import { Env, isEmulator } from "./env";
import { accessToken } from "./rtdb";

/** Makes `email` the sign-in address of `uid`. Resolves false if another account already has that address. */
export async function setSignInEmail(env: Env, uid: string, email: string): Promise<boolean> {
  const emu = isEmulator(env);
  const base = emu ? `${env.AUTH_EMU_URL ?? "http://127.0.0.1:9099"}/identitytoolkit.googleapis.com` : "https://identitytoolkit.googleapis.com";
  const r = await fetch(`${base}/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts:update`, {
    method: "POST",
    headers: { authorization: `Bearer ${emu ? "owner" : await accessToken(env)}`, "content-type": "application/json" },
    body: JSON.stringify({ localId: uid, email }),
  });
  if (r.ok) return true;
  const j = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (j?.error?.message?.includes("EMAIL_EXISTS")) return false;
  throw new Error(`couldn't change the sign-in address (${r.status} ${j?.error?.message ?? ""})`);
}
