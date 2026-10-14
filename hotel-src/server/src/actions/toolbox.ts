// The toolbox in your own room: storing things, and putting furniture down / moving it / taking it back. A piece exists in exactly one place
// (your pocket, your storage, or your room), so every change here moves it in one atomic write.
import { Action, ID_RE, int, requireOwnRoom, roomSize, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv, MAX_FURNI, STORAGE_MAX_ITEMS, STORAGE_MAX_PIECES, takeQtyFrom } from "../../../src/shared/economy";
import { STACKABLE } from "../../../src/shared/items";
import { SHIPPED_DIMS } from "../../../src/shared/furniture";

const isPiece = async (c: Ctx, key: string): Promise<boolean> => !!SHIPPED_DIMS[key] || !!(await c.furniMeta())[key];
const KEY_RE = /^[a-z0-9_]{1,30}$/;

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
    const room = await requireOwnRoom(c);
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
    c.extra[`roomsMeta/${room}/furni/${newRowId(c.now)}`] = { kind, x: Number(a.x), y: Number(a.y), ...(dir ? { dir } : {}) };
    return {};
  },
};

/** Moves or turns a piece that is already in your room. (The bed, bag, toolbox and sink have their own positions the browser sets.) */
export const furniMove: Action = {
  async run(c, a) {
    const room = await requireOwnRoom(c);
    const id = text(a.id, ID_RE, "piece");
    const row = await c.db.get<{ kind?: string }>(`roomsMeta/${room}/furni/${id}`);
    if (!row?.kind) return fail("That piece isn't in your room.");
    const dims = SHIPPED_DIMS[row.kind] ?? (await c.furniMeta())[row.kind];
    if (!dims) fail("That piece doesn't exist any more.");
    const dir = int(a.dir ?? 0, 0, 6, "facing");
    if (!DIRS.includes(dir)) fail("Bad facing.");
    const x = int(a.x, 0, 15, "spot"), y = int(a.y, 0, 15, "spot");
    if (!fits(dims!, x, y, dir, await roomSize(c, room))) fail("That doesn't fit in the room.");
    c.extra[`roomsMeta/${room}/furni/${id}/x`] = x;
    c.extra[`roomsMeta/${room}/furni/${id}/y`] = y;
    c.extra[`roomsMeta/${room}/furni/${id}/dir`] = dir || null;
    return {};
  },
};

/** Takes a piece out of your room into storage. */
export const furniStore: Action = {
  async run(c, a) {
    const room = await requireOwnRoom(c);
    const id = text(a.id, ID_RE, "piece");
    const row = await c.db.get<{ kind?: string; plantedAt?: number; mixJob?: unknown }>(`roomsMeta/${room}/furni/${id}`);
    if (!row?.kind) return fail("That piece isn't in your room.");
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
