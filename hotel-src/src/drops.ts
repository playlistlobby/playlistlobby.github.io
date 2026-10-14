// Things lying on the floor. A drop lives at rooms/<room>/drops/<x>_<y>: the key is the tile, so a tile holds one pile at most.
// Public rooms (basement, shop, the introduction's copy) clear their drops after 5 minutes, or after 1 minute once the same player has
// 5 or more of theirs on the floor; player rooms keep every drop until somebody picks it up.
// The browser only shows them: putting something down and picking it up are done by the game server (src/api.ts).
import { onValue, ref, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { call, serverNow } from "./db";
import type { Profile } from "./db";
import { NO_DROP } from "./shared/items";

export interface Drop {
  key: string;
  item: string;
  qty: number;
  ass?: boolean;
  x: number;
  y: number;
  by: string;
  byName: string;
  at: number;
  /** when it disappears (server time, ms); only on public rooms */
  exp?: number;
}

export const isPublicDropRoom = (roomId: string): boolean => roomId === "lobby" || roomId === "shop" || roomId.startsWith("tut_");
export const dropKey = (x: number, y: number): string => `${x}_${y}`;

function parse(key: string, v: any): Drop | null {
  if (!v || typeof v.item !== "string" || typeof v.x !== "number" || typeof v.y !== "number") return null;
  return {
    key, item: v.item, qty: Math.max(1, Number(v.qty) || 1), ...(v.ass === true ? { ass: true } : {}), x: v.x, y: v.y,
    by: String(v.by ?? ""), byName: String(v.byName ?? "someone"), at: Number(v.at) || 0, ...(typeof v.exp === "number" ? { exp: v.exp } : {}),
  };
}

/** Follows the drops of a room; `cb` gets the whole set on every change. */
export function watchDrops(roomId: string, cb: (drops: Map<string, Drop>) => void): Unsubscribe {
  return onValue(
    ref(db, `rooms/${roomId}/drops`),
    (snap) => {
      const out = new Map<string, Drop>();
      const raw = (snap.val() ?? {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(raw)) { const d = parse(k, v); if (d) out.set(k, d); }
      cb(out);
    },
    () => cb(new Map())
  );
}

export const isExpired = (d: Drop): boolean => d.exp !== undefined && d.exp <= serverNow();

/** Anybody in the room clears what has run out (the rules only let an expired pile be deleted). */
export function sweepExpired(roomId: string, drops: Iterable<Drop>): void {
  const patch: Record<string, null> = {};
  for (const d of drops) if (isExpired(d)) patch[`rooms/${roomId}/drops/${d.key}`] = null;
  if (Object.keys(patch).length) void update(ref(db), patch).catch(() => undefined);
}

/** Why something can't be put on the floor (null = it can). */
export function whyNotDrop(s: { item?: string; lit?: number; inPlayer?: boolean } | null | undefined): string | null {
  if (!s) return "You aren't carrying that.";
  if (s.item && NO_DROP.has(s.item)) return "You can't drop that.";
  if (s.lit) return "Let it burn out first.";
  if (s.inPlayer) return "That's in the player right now.";
  return null;
}

/** Puts `qty` of the item in pocket slot `slot` on `tile`. The server takes it out of the pocket and creates the pile in one go. */
export async function dropItem(p: Profile, roomId: string, slot: number, qty: number, tile: { x: number; y: number }): Promise<void> {
  const why = whyNotDrop(p.inventory[slot]);
  if (why) throw new Error(why);
  await call(p, "drop", { room: roomId, slot, qty, x: tile.x, y: tile.y });
}

/** Picks a pile up: the server hands it to the first player to ask. */
export async function pickUpDrop(p: Profile, roomId: string, d: Drop): Promise<{ item: string; qty: number }> {
  const r = await call<{ item?: string; qty?: number }>(p, "pickup", { room: roomId, key: d.key });
  return { item: String(r.item ?? d.item), qty: Number(r.qty) || d.qty };
}

/** The tile for something you drop: where you stand if it's free, else the nearest free one (never a doorway). */
export function landingTile(from: { x: number; y: number }, ok: (x: number, y: number) => boolean, taken: (x: number, y: number) => boolean, w: number, h: number): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bd = Infinity;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ok(x, y) || taken(x, y)) continue;
    const d = Math.hypot(x - from.x, y - from.y);
    if (d < bd) { bd = d; best = { x, y }; }
  }
  return best;
}
