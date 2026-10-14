// Checks the Firebase ID token the browser sends. In production the signature is verified against Google's public keys;
// with the Auth emulator (ENV=emulator) tokens are unsigned, so only their contents are read.
import { Env, isEmulator } from "./env";

export interface Caller {
  uid: string;
  email: string;
  isAdmin: boolean;
}

const b64urlToBytes = (s: string): Uint8Array => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const decodeJson = (s: string): any => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

let jwks: { keys: Array<JsonWebKey & { kid: string }>; at: number } | null = null;
async function keyFor(kid: string): Promise<CryptoKey> {
  if (!jwks || Date.now() - jwks.at > 3_600_000 || !jwks.keys.some((k) => k.kid === kid)) {
    const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
    if (!r.ok) throw new Error("couldn't fetch the signing keys");
    jwks = { keys: ((await r.json()) as { keys: Array<JsonWebKey & { kid: string }> }).keys, at: Date.now() };
  }
  const jwk = jwks.keys.find((k) => k.kid === kid);
  if (!jwk) throw new Error("unknown signing key");
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

/** Returns who is calling, or throws (the caller gets a 401). Only real username+password accounts count. */
export async function verifyToken(token: string, env: Env): Promise<Caller> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("bad token");
  const header = decodeJson(parts[0]);
  const claims = decodeJson(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (isEmulator(env)) {
    // the Auth emulator signs nothing: trust the contents (never enabled in production: ENV is only set by .dev.vars)
  } else {
    if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("bad token");
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", await keyFor(header.kid), b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!ok) throw new Error("bad signature");
    if (claims.aud !== env.FIREBASE_PROJECT_ID || claims.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`) throw new Error("wrong project");
    if (typeof claims.exp !== "number" || claims.exp < now) throw new Error("token expired");
    if (typeof claims.iat === "number" && claims.iat > now + 300) throw new Error("token from the future");
  }
  const uid = String(claims.user_id ?? claims.sub ?? "");
  const email = String(claims.email ?? "");
  const provider = claims.firebase?.sign_in_provider;
  if (!uid || !email || provider !== "password") throw new Error("not a hotel account");
  return { uid, email, isAdmin: email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase() };
}
