// The browser never writes what you own (blood, pocket, toolbox, drops, trades...): it asks the game server, which checks and writes it.
import { auth, useEmulator } from "./firebase";
import { API_URL } from "./apiConfig";
import type { Snapshot } from "./shared/economy";
import { trServer } from "./daRuntime";
import { showMaintenance } from "./maintenance";

/** A random id for this browser (kept in its storage): the server uses it, with the network address, to tell which accounts share a device or a connection. */
function deviceId(): string {
  try {
    let id = localStorage.getItem("sixplanet.device");
    if (!id) { id = (crypto.randomUUID?.() ?? String(Math.random()).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9-]/g, ""); localStorage.setItem("sixplanet.device", id); }
    return id;
  } catch { return ""; }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const base = (): string => {
  const url = useEmulator ? "http://127.0.0.1:8787" : (import.meta.env.VITE_API_URL as string | undefined) || API_URL;
  if (!url) throw new ApiError("The game server isn't set up yet.", 0);
  return url.replace(/\/+$/, "");
};

async function call(action: string, args: object, forceToken: boolean): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new ApiError("Please log in again.", 401);
  const token = await user.getIdToken(forceToken);
  try {
    return await fetch(`${base()}/act`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-device": deviceId() }, body: JSON.stringify({ a: action, args }) });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Can't reach the game server. Check your connection.", 0);
  }
}

/** Starts paying real money for a CD: resolves with the address of the payment page (Stripe), where the player is sent. */
export async function startPayment(product: string, params: { color?: string; name?: string } = {}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new ApiError("Please log in again.", 401);
  let r: Response;
  try {
    r = await fetch(`${base()}/pay/checkout`, { method: "POST", headers: { authorization: `Bearer ${await user.getIdToken()}`, "content-type": "application/json" }, body: JSON.stringify({ product, ...params }) });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Can't reach the game server. Check your connection.", 0);
  }
  const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; url?: string } | null;
  if (!j || !j.ok || !j.url) throw new ApiError(trServer(j?.error ?? "The server had a problem. Try again."), r.status);
  return j.url;
}

/** Asks the server to do something. Resolves with the player's new state; rejects with a message that can be shown to the player. */
export async function act<T = Record<string, any>>(action: string, args: object = {}): Promise<{ state?: Snapshot; data: T }> {
  let r = await call(action, args, false);
  if (r.status === 401) r = await call(action, args, true); // the login token may just have expired
  const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; state?: Snapshot; data?: T; maintenance?: boolean } | null;
  if (j?.maintenance && j.error) showMaintenance(j.error); // (the game is closed for now)
  if (!j || !j.ok) throw new ApiError(trServer(j?.error ?? "The server had a problem. Try again."), r.status); // (an answer without a state is fine: the action just didn't touch the player)
  const data = (j.data ?? {}) as Record<string, unknown>;
  if (typeof data.note === "string") data.note = trServer(data.note); // the server writes its notes in English
  return { ...(j.state ? { state: j.state } : {}), data: data as T };
}
