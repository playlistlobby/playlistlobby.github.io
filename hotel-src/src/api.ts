// The browser never writes what you own (blood, pocket, toolbox, drops, trades...): it asks the game server, which checks and writes it.
import { auth, useEmulator } from "./firebase";
import { API_URL } from "./apiConfig";
import type { Snapshot } from "./shared/economy";

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
    return await fetch(`${base()}/act`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ a: action, args }) });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Can't reach the game server. Check your connection.", 0);
  }
}

/** Asks the server to do something. Resolves with the player's new state; rejects with a message that can be shown to the player. */
export async function act<T = Record<string, any>>(action: string, args: object = {}): Promise<{ state: Snapshot; data: T }> {
  let r = await call(action, args, false);
  if (r.status === 401) r = await call(action, args, true); // the login token may just have expired
  const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; state?: Snapshot; data?: T } | null;
  if (!j || !j.ok || !j.state) throw new ApiError(j?.error ?? "The server had a problem. Try again.", r.status);
  return { state: j.state, data: (j.data ?? {}) as T };
}
