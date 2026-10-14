// Talks to the Realtime Database with full (admin) rights: reads, and one atomic multi-path write per action.
// Production: a Google OAuth token made from the service-account key. Emulator: the "owner" bypass token.
import { Env, isEmulator } from "./env";

const b64url = (b: ArrayBuffer | string): string => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let token: { value: string; exp: number } | null = null;

async function accessToken(env: Env): Promise<string> {
  if (token && token.exp - Date.now() > 120_000) return token.value;
  if (!env.FIREBASE_SA_JSON) throw new Error("the server has no service-account key (FIREBASE_SA_JSON)");
  const sa = JSON.parse(env.FIREBASE_SA_JSON) as { client_email: string; private_key: string; token_uri?: string };
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${body}`));
  const r = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${body}.${b64url(sig)}` }),
  });
  if (!r.ok) throw new Error(`couldn't get a database token (${r.status})`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.value;
}

export class Rtdb {
  constructor(private env: Env) {}

  private async request(path: string, init: RequestInit & { query?: string } = {}): Promise<Response> {
    const emu = isEmulator(this.env);
    const q = [emu ? `ns=${this.env.DB_NS ?? "demo-hotel-default-rtdb"}` : "", init.query ?? ""].filter(Boolean).join("&");
    const url = `${this.env.DB_URL}/${path.replace(/^\/+/, "")}.json${q ? `?${q}` : ""}`;
    const auth = emu ? "owner" : await accessToken(this.env);
    const r = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${auth}`, "content-type": "application/json" } });
    if (!r.ok) throw new Error(`database ${init.method ?? "GET"} ${path} failed (${r.status})`);
    return r;
  }

  /** The value at `path`, or null. */
  async get<T = any>(path: string): Promise<T | null> {
    return (await (await this.request(path)).json()) as T | null;
  }

  /** Which child keys exist under `path` (cheap: no values). */
  async keys(path: string): Promise<string[]> {
    const v = (await (await this.request(path, { query: "shallow=true" })).json()) as Record<string, true> | null;
    return v ? Object.keys(v) : [];
  }

  /** One atomic write: every key is a full path, null deletes. */
  async patch(updates: Record<string, unknown>): Promise<void> {
    if (!Object.keys(updates).length) return;
    await this.request("", { method: "PATCH", body: JSON.stringify(updates) });
  }
}
