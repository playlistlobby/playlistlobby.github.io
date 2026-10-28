// Putting things on the floor and picking them up. Every pile lives at rooms/<room>/drops/<x>_<y>: the key is the tile, so a tile holds one pile.
import { Action, cheb, int, isPublicRoom, requireInRoom, roomSize, text } from "./util";
import { fail } from "../ctx";
import { isLaced, NO_DROP } from "../../../src/shared/items";
import { addToInv, BULK_AT, DROP_LIFE_BULK_MS, DROP_LIFE_MS, takeQtyFrom } from "../../../src/shared/economy";

interface DropRow { item: string; qty: number; ass?: boolean; x: number; y: number; by: string; byName?: string; at?: number; exp?: number }
const ROOM_RE = /^[A-Za-z0-9_-]{1,60}$/;

export const drop: Action = {
  locks: (c, a) => [`room:${a?.room}`],
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const stand = await requireInRoom(c, room);
    const size = await roomSize(c, room);
    const x = int(a.x, 0, size.w - 1, "spot"), y = int(a.y, 0, size.h - 1, "spot");
    if (stand && cheb(stand, { x, y }) > 3) fail("That's too far away to put it down.");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it) fail("You aren't carrying that.");
    if (NO_DROP.has(it!.item)) fail("You can't drop that.");
    if (it!.lit) fail("Let it burn out first.");
    if (it!.inPlayer) fail("That's in the player right now.");
    const take = int(a.qty ?? 1, 1, 999, "amount");
    if (take > it!.qty) fail("You haven't got that many.");
    const drops = (await c.db.get<Record<string, DropRow>>(`rooms/${room}/drops`)) ?? {};
    const live = (d: DropRow) => !d.exp || d.exp > c.now;
    const key = `${x}_${y}`;
    if (drops[key] && live(drops[key])) fail("Something is already lying there.");
    const pub = isPublicRoom(room);
    const mine = Object.entries(drops).filter(([k, d]) => k !== key && d.by === c.uid && live(d));
    const bulk = pub && mine.length + 1 >= BULK_AT;
    const exp = pub ? c.now + (bulk ? DROP_LIFE_BULK_MS : DROP_LIFE_MS) : undefined;
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, take);
    c.extra[`rooms/${room}/drops/${key}`] = { item: it!.item, qty: take, ...(it!.ass ? { ass: true } : {}), x, y, by: c.uid, byName: String(w.raw.name ?? "someone").slice(0, 16), at: c.now, ...(exp !== undefined ? { exp } : {}) };
    if (bulk) for (const [k, d] of mine) if ((d.exp ?? Infinity) > c.now + DROP_LIFE_BULK_MS) c.extra[`rooms/${room}/drops/${k}/exp`] = c.now + DROP_LIFE_BULK_MS;
    return {};
  },
};

/** What you lost to fentanyl lands on the floor where you go down (the browser asks 7 seconds after you took it, when you lie down): a pile of blood anybody can pick up. */
export const fentDrop: Action = {
  locks: (c, a) => [`room:${a?.room}`],
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const stand = await requireInRoom(c, room);
    const owed = await c.db.get<{ lost?: number; at?: number }>(`fentOwed/${c.uid}`);
    if (!owed || !(Number(owed.lost) > 0) || !owed.at) return { dropped: 0 };
    if (c.now - owed.at < 5000) fail("Not yet."); // (it falls when you go down, not before)
    c.extra[`fentOwed/${c.uid}`] = null;
    if (c.now - owed.at > 120_000) return { dropped: 0 }; // (too late: it is just gone)
    const w = await c.user();
    const qty = Math.floor(Number(owed.lost));
    return { dropped: (await bloodPile(c, room, stand, qty, c.uid, String(w.raw.name ?? "someone"))) ? qty : 0 };
  },
};

/** A pile of blood on the floor where somebody went down (or the nearest tile with nothing on it): anybody can pick it up. False if the room has no free tile. */
export async function bloodPile(c: import("../ctx").Ctx, room: string, at: { x: number; y: number } | null, qty: number, byUid: string, byName: string): Promise<boolean> {
  return (await floorPiles(c, room, at, [{ item: "blood", qty }], byUid, byName)) === 1;
}

/** Puts piles on the floor, each on the free tile nearest to `at` (a tile holds one pile). Returns how many found a tile. */
export async function floorPiles(c: import("../ctx").Ctx, room: string, at: { x: number; y: number } | null, piles: Array<{ item: string; qty: number; ass?: boolean }>, byUid: string, byName: string): Promise<number> {
  const size = await roomSize(c, room);
  const drops = (await c.db.get<Record<string, DropRow>>(`rooms/${room}/drops`)) ?? {};
  const live = (d: DropRow) => !d.exp || d.exp > c.now;
  const from = at ?? { x: Math.floor(size.w / 2), y: Math.floor(size.h / 2) };
  const used = new Set<string>();
  let placed = 0;
  for (const pile of piles) {
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (let y = 0; y < size.h; y++) for (let x = 0; x < size.w; x++) {
      const k = `${x}_${y}`;
      const d0 = drops[k];
      if (used.has(k) || (d0 && live(d0))) continue;
      const dist = Math.hypot(x - from.x, y - from.y);
      if (dist < bd) { bd = dist; best = { x, y }; }
    }
    if (!best) break;
    used.add(`${best.x}_${best.y}`);
    c.extra[`rooms/${room}/drops/${best.x}_${best.y}`] = { item: pile.item, qty: pile.qty, ...(pile.ass ? { ass: true } : {}), x: best.x, y: best.y, by: byUid, byName: byName.slice(0, 16), at: c.now, ...(isPublicRoom(room) ? { exp: c.now + DROP_LIFE_MS } : {}) };
    placed++;
  }
  return placed;
}

export const pickup: Action = {
  locks: (c, a) => [`room:${a?.room}`],
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const stand = await requireInRoom(c, room);
    const key = text(a.key, /^[0-9]{1,2}_[0-9]{1,2}$/, "spot");
    const path = `rooms/${room}/drops/${key}`;
    const d = await c.db.get<DropRow>(path);
    if (!d) return fail("Somebody else got it first.");
    if (d.exp && d.exp <= c.now) { await c.db.patch({ [path]: null }); return fail("It's gone."); }
    if (stand && cheb(stand, { x: d.x, y: d.y }) > 3) fail("It's too far away.");
    const w = await c.user();
    if (d.item === "blood") { // a pile of blood (somebody died of fentanyl): it goes straight to your blood
      const n = Math.max(1, Math.floor(Number(d.qty) || 1));
      w.s.blood += n;
      c.note = "blood on the floor";
      c.extra[path] = null;
      return { item: "blood", qty: n };
    }
    const next = addToInv(w.s.inventory, { item: d.item, qty: Math.max(1, Number(d.qty) || 1), ...(d.ass ? { ass: true } : {}), ...(isLaced(d.item) && typeof d.by === "string" && /^[A-Za-z0-9]{1,40}$/.test(d.by) && d.by !== c.uid ? { giver: d.by } : {}) }); // (a laced thing remembers who dropped it)
    if (!next) fail("Your inventory is full.");
    w.s.inventory = next!;
    c.extra[path] = null;
    return { item: d.item, qty: d.qty };
  },
};
