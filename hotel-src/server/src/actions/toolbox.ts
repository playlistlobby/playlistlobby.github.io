// The toolbox in your own room: storing things, and putting furniture down / moving it / taking it back. A piece exists in exactly one place
// (your pocket, your storage, or your room), so every change here moves it in one atomic write.
import { Action, ID_RE, int, requireInRoom, requireOwnRoom, roomSize, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv, MAX_FURNI, STORAGE_MAX_ITEMS, STORAGE_MAX_PIECES, takeQtyFrom } from "../../../src/shared/economy";
import { STACKABLE } from "../../../src/shared/items";
import { POSTER_KIND, posterImageOk, SHIPPED_DIMS, wallPlaceOk } from "../../../src/shared/furniture";

const isPiece = async (c: Ctx, key: string): Promise<boolean> => !!SHIPPED_DIMS[key] || !!(await c.furniMeta())[key];
const KEY_RE = /^[a-z0-9_]{1,30}$/;

/**
 * Which room a furnishing action is for: your own, or (for an account with the decorator power, see users/<uid>/decorator) another player's room that you
 * are standing in. In someone else's room you only place new pieces, and only move or take back the ones you put there yourself (they carry `by`).
 */
async function roomFor(c: Ctx, a: Record<string, unknown>): Promise<{ room: string; foreign: boolean }> {
  const own = `u_${c.uid}`;
  const want = a.room === undefined ? own : text(a.room, /^u_[A-Za-z0-9]{1,40}$/, "room");
  if (want === own) return { room: await requireOwnRoom(c), foreign: false }; // your own room: you have to be standing in it
  const w = await c.user();
  if (!(c.isAdmin || w.raw.decorator === true)) fail("That isn't your room.");
  if (!(await c.db.get(`roomsMeta/${want}/owner`))) fail("That room doesn't exist.");
  await requireInRoom(c, want);
  return { room: want, foreign: true };
}

/** What you carry goes into the toolbox: a piece of furniture, or `qty` of an item. Ass weed is kept apart as "ass_<item>". */
export const storeItem: Action = {
  async run(c, a) {
    await requireOwnRoom(c);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it) fail("You aren't carrying that.");
    if (it!.lit) fail("Wait for it to burn out first.");
    if (it!.inPlayer) fail("That's in the player right now.");
    const take = int(a.qty ?? 1, 1, 999, "amount");
    if (take > it!.qty) fail("You haven't got that many.");
    const key = it!.ass ? `ass_${it!.item}` : it!.item;
    if (!KEY_RE.test(key)) fail("That can't be stored.");
    const have = w.s.storage[key] ?? 0;
    if (have + take > ((await isPiece(c, key)) ? STORAGE_MAX_PIECES : STORAGE_MAX_ITEMS)) fail("Storage is full of those.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, take);
    w.s.storage[key] = have + take;
    return {};
  },
};

/** Takes things back out of the toolbox (stackable items share a slot, everything else needs one slot each). */
export const takeItem: Action = {
  async run(c, a) {
    await requireOwnRoom(c);
    const w = await c.user();
    const key = text(a.key, KEY_RE, "item");
    const have = w.s.storage[key] ?? 0;
    if (have < 1) fail("There's none of that in storage.");
    const take = Math.min(int(a.qty ?? 1, 1, 9999, "amount"), have);
    const ass = key.startsWith("ass_") && !(await isPiece(c, key));
    const item = ass ? key.slice(4) : key;
    if (!(await c.validItem())(item)) fail("That doesn't exist any more.");
    let inv = w.s.inventory;
    const parts = STACKABLE.has(item) ? [take] : Array.from({ length: take }, () => 1);
    for (const q of parts) {
      const next = addToInv(inv, { item, qty: q, ...(ass ? { ass: true } : {}) });
      if (!next) fail("Your inventory is full.");
      inv = next!;
    }
    w.s.inventory = inv;
    if (have - take > 0) w.s.storage[key] = have - take; else delete w.s.storage[key];
    return {};
  },
};

const DIRS = [0, 2, 4, 6];
function fits(dims: { w: number; h: number }, x: number, y: number, dir: number, size: { w: number; h: number }): boolean {
  const swap = dir === 2 || dir === 6;
  const w = swap ? dims.h : dims.w, h = swap ? dims.w : dims.h;
  return x >= 0 && y >= 0 && x + w <= size.w && y + h <= size.h;
}
const newRowId = (now: number): string => `f${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Puts a piece down in your room, from your pocket or from storage. */
export const furniPlace: Action = {
  async run(c, a) {
    const { room, foreign } = await roomFor(c, a);
    const w = await c.user();
    const dir = int(a.dir ?? 0, 0, 6, "facing");
    if (!DIRS.includes(dir)) fail("Bad facing.");
    const size = await roomSize(c, room);
    const rows = (await c.db.get<Record<string, unknown>>(`roomsMeta/${room}/furni`)) ?? {};
    if (Object.keys(rows).length >= MAX_FURNI) fail("The room is full of furniture.");
    let kind: string;
    if (a.source === "inv") {
      const slot = int(a.slot, 0, 27, "slot");
      const it = w.s.inventory[slot];
      if (!it) fail("You aren't carrying that.");
      kind = it!.item;
      const dims = await c.placeableDims(kind);
      if (!dims) fail("That can't be put down.");
      if (!fits(dims!, int(a.x, 0, 15, "spot"), int(a.y, 0, 15, "spot"), dir, size)) fail("That doesn't fit in the room.");
      w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1);
    } else {
      kind = text(a.kind, KEY_RE, "piece");
      if ((w.s.storage[kind] ?? 0) < 1) fail("There's none of that in storage.");
      const dims = await c.placeableDims(kind);
      if (!dims) fail("That can't be put down.");
      if (!fits(dims!, int(a.x, 0, 15, "spot"), int(a.y, 0, 15, "spot"), dir, size)) fail("That doesn't fit in the room.");
      if (w.s.storage[kind] > 1) w.s.storage[kind] -= 1; else delete w.s.storage[kind];
    }
    // a poster only hangs on a wall, and carries the picture chosen when it is hung (it stays on it; a poster taken down goes back blank)
    let img: string | undefined;
    if (kind === POSTER_KIND) {
      if (!wallPlaceOk(Number(a.x), Number(a.y), dir)) fail("A poster hangs on a wall: the back wall or the left wall.");
      if (a.img !== undefined) { if (!posterImageOk(a.img)) fail("That picture can't be used."); img = a.img as string; }
    } else if (a.img !== undefined) fail("Only a poster carries a picture.");
    c.extra[`roomsMeta/${room}/furni/${newRowId(c.now)}`] = { kind, x: Number(a.x), y: Number(a.y), ...(dir ? { dir } : {}), ...(img ? { img } : {}), ...(foreign ? { by: c.uid } : {}) };
    return {};
  },
};

/** Moves or turns a piece that is already in your room. (The bed, bag, toolbox and sink have their own positions the browser sets.) */
export const furniMove: Action = {
  async run(c, a) {
    const { room, foreign } = await roomFor(c, a);
    const id = text(a.id, ID_RE, "piece");
    const row = await c.db.get<{ kind?: string; by?: string }>(`roomsMeta/${room}/furni/${id}`);
    if (!row?.kind) return fail("That piece isn't in your room.");
    if (foreign && row.by !== c.uid && !c.isAdmin) fail("That isn't yours to move.");
    const dims = SHIPPED_DIMS[row.kind] ?? (await c.furniMeta())[row.kind];
    if (!dims) fail("That piece doesn't exist any more.");
    const dir = int(a.dir ?? 0, 0, 6, "facing");
    if (!DIRS.includes(dir)) fail("Bad facing.");
    const x = int(a.x, 0, 15, "spot"), y = int(a.y, 0, 15, "spot");
    if (!fits(dims!, x, y, dir, await roomSize(c, room))) fail("That doesn't fit in the room.");
    if (row.kind === POSTER_KIND && !wallPlaceOk(x, y, dir)) fail("A poster hangs on a wall: the back wall or the left wall.");
    c.extra[`roomsMeta/${room}/furni/${id}/x`] = x;
    c.extra[`roomsMeta/${room}/furni/${id}/y`] = y;
    c.extra[`roomsMeta/${room}/furni/${id}/dir`] = dir || null;
    return {};
  },
};

/** Takes a piece out of your room into storage. */
export const furniStore: Action = {
  async run(c, a) {
    const { room, foreign } = await roomFor(c, a);
    const id = text(a.id, ID_RE, "piece");
    const row = await c.db.get<{ kind?: string; plantedAt?: number; mixJob?: unknown; by?: string }>(`roomsMeta/${room}/furni/${id}`);
    if (!row?.kind) return fail("That piece isn't in your room.");
    if (foreign && row.by !== c.uid && !c.isAdmin) fail("That isn't yours to take.");
    if (typeof row.plantedAt === "number") fail("Harvest the plant first.");
    if (row.mixJob) fail("Collect what's in the mixer first.");
    const w = await c.user();
    const have = w.s.storage[row.kind] ?? 0;
    if (have >= STORAGE_MAX_PIECES) fail("Storage is full of those.");
    w.s.storage[row.kind] = have + 1;
    c.extra[`roomsMeta/${room}/furni/${id}`] = null;
    return {};
  },
};
