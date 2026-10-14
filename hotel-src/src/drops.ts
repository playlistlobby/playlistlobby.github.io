// Things lying on the floor. A drop lives at rooms/<room>/drops/<x>_<y>: the key is the tile, so a tile holds one pile at most (the rules
// refuse a second one). Public rooms (basement, shop, the introduction's copy) clear their drops after 5 minutes, or after 1 minute once
// the same player has 5 or more of theirs on the floor; player rooms keep every drop until somebody picks it up.
import { onValue, ref, remove, runTransaction, set, update, serverTimestamp, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { addToInv, commitInv, serverNow, takeQtyFrom } from "./db";
import type { Profile } from "./db";

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

export const DROP_LIFE_MS = 5 * 60_000;
export const DROP_LIFE_BULK_MS = 60_000;
/** this many of your own drops on the floor at once: they all go down to the short life */
export const BULK_AT = 5;

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

/** Anybody in the room clears what has run out. */
export function sweepExpired(roomId: string, drops: Iterable<Drop>): void {
  const patch: Record<string, null> = {};
  for (const d of drops) if (isExpired(d)) patch[`rooms/${roomId}/drops/${d.key}`] = null;
  if (Object.keys(patch).length) void update(ref(db), patch).catch(() => undefined);
}

/** Why something can't be put on the floor (null = it can). */
export function whyNotDrop(s: { lit?: number; inPlayer?: boolean } | null | undefined): string | null {
  if (!s) return "You aren't carrying that.";
  if (s.lit) return "Let it burn out first.";
  if (s.inPlayer) return "That's in the player right now.";
  return null;
}

/**
 * Takes `qty` of the item in `slot` out of the pocket and puts it on `tile`, in one write. `mine` = this player's drops already in the room
 * (a public room shortens all of them to the short life once there are 5 or more).
 */
export async function dropItem(p: Profile, roomId: string, slot: number, qty: number, tile: { x: number; y: number }, mine: Drop[]): Promise<void> {
  const s = p.inventory[slot];
  const why = whyNotDrop(s);
  if (why || !s) throw new Error(why ?? "You aren't carrying that.");
  const take = Math.max(1, Math.min(Math.floor(qty) || 1, s.qty));
  const key = dropKey(tile.x, tile.y);
  const pub = isPublicDropRoom(roomId);
  const live = mine.filter((d) => !isExpired(d));
  const bulk = pub && live.length + 1 >= BULK_AT;
  const now = serverNow();
  const exp = pub ? now + (bulk ? DROP_LIFE_BULK_MS : DROP_LIFE_MS) : undefined;
  const extra: Record<string, unknown> = {
    [`rooms/${roomId}/drops/${key}`]: {
      item: s.item, qty: take, ...(s.ass ? { ass: true } : {}), x: tile.x, y: tile.y, by: p.uid, byName: p.name, at: serverTimestamp(), ...(exp !== undefined ? { exp } : {}),
    },
  };
  if (bulk) for (const d of live) if ((d.exp ?? Infinity) > now + DROP_LIFE_BULK_MS) extra[`rooms/${roomId}/drops/${d.key}/exp`] = now + DROP_LIFE_BULK_MS;
  await commitInv(p, takeQtyFrom(p.inventory, slot, take), extra);
}

/** Picks a drop up: the first player to remove it wins (a transaction); then it goes into the pocket. */
export async function pickUpDrop(p: Profile, roomId: string, d: Drop): Promise<Drop> {
  const give = (x: Drop) => ({ item: x.item, qty: x.qty, ...(x.ass ? { ass: true } : {}) });
  if (!addToInv(p.inventory, give(d))) throw new Error("Your inventory is full.");
  const r = ref(db, `rooms/${roomId}/drops/${d.key}`);
  let got: unknown = null;
  await runTransaction(r, (cur) => { got = cur; return null; }); // the last run is the one that counted
  const won = parse(d.key, got);
  if (!won) throw new Error("Somebody else got it first.");
  const next = addToInv(p.inventory, give(won));
  if (!next) {
    await set(r, got).catch(() => undefined); // no room after all: put it back
    throw new Error("Your inventory is full.");
  }
  try {
    await commitInv(p, next);
  } catch (err) {
    await set(r, got).catch(() => undefined);
    throw err;
  }
  return won;
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

export { remove as removeDropRef };
