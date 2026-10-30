// The toolbox in your own room: storing things, and putting furniture down / moving it / taking it back. A piece exists in exactly one place
// (your pocket, your storage, or your room), so every change here moves it in one atomic write.
import { Action, hideoutAccess, ID_RE, int, requireHideoutMember, requireInRoom, requireOwnRoom, roomSize, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv, carryMsg, CARRY_MAX, MAX_FURNI, overCarry, ROOM_MAX_KITS, ROOM_MAX_MIXERS, STASH_PIECES, STORAGE_MAX_ITEMS, STORAGE_MAX_PIECES, takeQtyFrom } from "../../../src/shared/economy";
import { isFurniItem, STACKABLE } from "../../../src/shared/items";
const BOOMBOX_ID = "boombox";
import { nextFurniState, POSTER_KIND, posterImageOk, SHIPPED_DIMS, wallPlaceOk } from "../../../src/shared/furniture";
import { HIDEOUT_MAX_FURNI, HIDEOUT_MAX_KITS, HIDEOUT_MAX_MIXERS, HIDEOUT_ONLY, isHideoutId, levelOfSize } from "../../../src/shared/hideout";

const isPiece = async (c: Ctx, key: string): Promise<boolean> => !!SHIPPED_DIMS[key] || !!(await c.furniMeta())[key];
const KEY_RE = /^[a-z0-9_]{1,30}$/;

/** A boombox can't be taken while a CD is still playing in the room: take the CD out first. */
async function boomboxFree(c: Ctx, room: string): Promise<void> {
  const cd = await c.db.get<{ endsAt?: number }>(`rooms/${room}/cdplayer`);
  if (cd && typeof cd.endsAt === "number" && cd.endsAt > c.now) fail("A CD is playing. Stop it first.");
}

/**
 * Which room a furnishing action is for: your own, or (for an account with the decorator power, see users/<uid>/decorator) another player's room that you
 * are standing in. In someone else's room you only place new pieces, and only move or take back the ones you put there yourself (they carry `by`).
 */
/** the admin and the account "emil" build with every piece there is, in any room they may build in (/build) */
export const mayBuildAnywhere = (c: Ctx): boolean => c.isAdmin || c.caller.email.toLowerCase() === "emil@users.bobba.invalid";
async function roomFor(c: Ctx, a: Record<string, unknown>, needBuild = true): Promise<{ room: string; foreign: boolean; hideout: boolean; level: number; owner: boolean }> {
  const own = `u_${c.uid}`;
  const want = a.room === undefined ? own : text(a.room, /^[uh]_[A-Za-z0-9]{1,40}$/, "room");
  if (isHideoutId(want)) { // a hideout: members build there when they may (the owner always), and have to be standing in it
    const h = await hideoutAccess(c, want);
    if (!h.member) fail("You aren't in that hideout.");
    if (needBuild && !h.canBuild) fail(h.meta.lock ? "Building is locked in this hideout." : "You aren't allowed to build in this hideout.");
    await requireInRoom(c, want);
    return { room: want, foreign: false, hideout: true, level: levelOfSize(Number(h.meta.w) || 14), owner: h.owner };
  }
  if (want === own) return { room: await requireOwnRoom(c), foreign: false, hideout: false, level: 0, owner: true }; // your own room: you have to be standing in it
  const w = await c.user();
  if (!(mayBuildAnywhere(c) || w.raw.decorator === true)) fail("That isn't your room.");
  if (!(await c.db.get(`roomsMeta/${want}/owner`))) fail("That room doesn't exist.");
  await requireInRoom(c, want);
  return { room: want, foreign: true, hideout: false, level: 0, owner: false };
}

/** the room a furnishing action works on is locked while it runs (several members can build at the same time) */
const roomLock = (c: Ctx, a: Record<string, unknown>): string[] => [`room:${typeof a?.room === "string" ? a.room : `u_${c.uid}`}`];

/** how many pieces fit in the room */
const furniCap = (hideout: boolean, level: number): number => (hideout ? HIDEOUT_MAX_FURNI[Math.min(level, HIDEOUT_MAX_FURNI.length - 1)] : MAX_FURNI);

/** What you carry goes into the toolbox: a piece of furniture, or `qty` of an item. Ass weed is kept apart as "ass_<item>". */
/** where the toolbox is: your own room, or a hideout you are in (your toolbox storage is yours wherever you stand at one) */
async function storageRoom(c: Ctx, a: { room?: unknown }): Promise<string> {
  if (a?.room === undefined) return requireOwnRoom(c);
  const room = text(a.room, /^h_[A-Za-z0-9]{1,40}$/, "room");
  await requireHideoutMember(c, room);
  await requireInRoom(c, room);
  return room;
}

export const storeItem: Action = {
  async run(c, a) {
    await storageRoom(c, a);
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
    // the toolbox is for furniture only now: seeds, weed, pills and the like go in the stash box (which the landlord sells)
    if (!(await isPiece(c, key))) fail("The toolbox only takes furniture. Things like seeds, weed and pills go in your stash box.");
    const have = w.s.storage[key] ?? 0;
    if (have + take > STORAGE_MAX_PIECES) fail("Storage is full of those.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, take);
    w.s.storage[key] = have + take;
    return {};
  },
};

/** Takes things back out of the toolbox (stackable items share a slot, everything else needs one slot each). */
export const takeItem: Action = {
  async run(c, a) {
    await storageRoom(c, a);
    const w = await c.user();
    const key = text(a.key, KEY_RE, "item");
    if (key === "f_boombox") fail("The boombox can't be carried around: put it down in your room."); // it stays in the toolbox or in a room, never in a pocket (so it can't be traded or sold)
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

/** Your stash box is in your own room, and the remote bank in the arrival room opens the same one: you can reach it from either. */
async function requireStashAccess(c: Ctx): Promise<void> {
  if (await c.db.get(`rooms/arrival/players/${c.uid}`)) return;
  await requireOwnRoom(c);
}

/** Puts what you carry into the stash box (everybody has one): any thing, and pots and mixers; the rest of the furniture stays toolbox only. Ass weed is kept apart as "ass_<item>". */
export const stashStore: Action = {
  async run(c, a) {
    await requireStashAccess(c);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it) fail("You aren't carrying that.");
    if (it!.lit) fail("Wait for it to burn out first.");
    if (it!.inPlayer) fail("That's in the player right now.");
    const take = int(a.qty ?? 1, 1, 999, "amount");
    if (take > it!.qty) fail("You haven't got that many.");
    const piece = isFurniItem(it!.item);
    if (piece && !STASH_PIECES.has(it!.item)) fail("Only pots and mixers fit in the stash box. The rest of the furniture goes in the toolbox.");
    const key = it!.ass ? `ass_${it!.item}` : it!.item;
    if (!KEY_RE.test(key)) fail("That can't be stored.");
    const have = w.s.stash[key] ?? 0;
    if (CARRY_MAX[it!.item] === undefined && have + take > (piece ? STORAGE_MAX_PIECES : STORAGE_MAX_ITEMS)) fail("The stash box is full of those."); // (bandages and guns: as many as you like)
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, take);
    w.s.stash[key] = have + take;
    return {};
  },
};

/** Takes things back out of the stash box (stackable items share a slot, everything else needs one slot each). */
export const stashTake: Action = {
  async run(c, a) {
    await requireStashAccess(c);
    const w = await c.user();
    const key = text(a.key, KEY_RE, "item");
    const have = w.s.stash[key] ?? 0;
    if (have < 1) fail("There's none of that in the stash box.");
    const take = Math.min(int(a.qty ?? 1, 1, 9999, "amount"), have);
    const ass = key.startsWith("ass_");
    const item = ass ? key.slice(4) : key;
    if (overCarry(w.s.inventory, item, take)) fail(carryMsg(item));
    if (!(await c.validItem())(item)) fail("That doesn't exist any more.");
    let inv = w.s.inventory;
    const parts = STACKABLE.has(item) ? [take] : Array.from({ length: take }, () => 1);
    for (const q of parts) {
      const next = addToInv(inv, { item, qty: q, ...(ass ? { ass: true } : {}) });
      if (!next) fail("Your inventory is full.");
      inv = next!;
    }
    w.s.inventory = inv;
    if (have - take > 0) w.s.stash[key] = have - take; else delete w.s.stash[key];
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
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const { room, foreign, hideout, level } = await roomFor(c, a);
    let boxOwner: string | null = null; // (a piece taken from a hideout's box stays its owner's)
    const w = await c.user();
    const dir = int(a.dir ?? 0, 0, 6, "facing");
    if (!DIRS.includes(dir)) fail("Bad facing.");
    const size = await roomSize(c, room);
    const rows = (await c.db.get<Record<string, unknown>>(`roomsMeta/${room}/furni`)) ?? {};
    if (Object.keys(rows).length >= furniCap(hideout, level)) fail("The room is full of furniture.");
    let kind: string;
    if (a.source === "inv") {
      const slot = int(a.slot, 0, 27, "slot");
      const it = w.s.inventory[slot];
      if (!it) fail("You aren't carrying that.");
      kind = it!.item;
      const dims = await c.placeableDims(kind);
      if (!dims) fail("That can't be put down.");
      if (!fits(dims!, int(a.x, 0, 24, "spot"), int(a.y, 0, 24, "spot"), dir, size)) fail("That doesn't fit in the room.");
      w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1);
    } else if (a.source === "catalog") { // the admin has every piece there is: nothing is taken from storage
      if (!mayBuildAnywhere(c)) fail("Only the admin can do that.");
      kind = text(a.kind, KEY_RE, "piece");
      const dims = await c.placeableDims(kind);
      if (!dims) fail("That can't be put down.");
      if (!fits(dims!, int(a.x, 0, 24, "spot"), int(a.y, 0, 24, "spot"), dir, size)) fail("That doesn't fit in the room.");
    } else if (a.source === "box") { // from the hideout's shared box: anybody who may build can use anybody's piece
      if (!hideout) fail("There's no box here.");
      kind = text(a.kind, KEY_RE, "piece");
      boxOwner = text(a.owner, /^[A-Za-z0-9]{10,40}$/, "owner");
      const have = (await c.db.get<number>(`roomsMeta/${room}/box/${boxOwner}/${kind}`)) ?? 0;
      if (have < 1) fail("There's none of that in the box.");
      const dims = await c.placeableDims(kind);
      if (!dims) fail("That can't be put down.");
      if (!fits(dims!, int(a.x, 0, 24, "spot"), int(a.y, 0, 24, "spot"), dir, size)) fail("That doesn't fit in the room.");
      c.extra[`roomsMeta/${room}/box/${boxOwner}/${kind}`] = have > 1 ? have - 1 : null;
    } else {
      kind = text(a.kind, KEY_RE, "piece");
      if ((w.s.storage[kind] ?? 0) < 1) fail("There's none of that in storage.");
      const dims = await c.placeableDims(kind);
      if (!dims) fail("That can't be put down.");
      if (!fits(dims!, int(a.x, 0, 24, "spot"), int(a.y, 0, 24, "spot"), dir, size)) fail("That doesn't fit in the room.");
      if (w.s.storage[kind] > 1) w.s.storage[kind] -= 1; else delete w.s.storage[kind];
    }
    const autoPot = kind === "f_planter_auto"; // (a kit with its waterer: down in the room it is a kit marked `auto`)
    if (autoPot) kind = "f_planter";
    const mixUp = kind === "f_mixer_up" ? 1 : kind === "f_mixer_up2" ? 2 : 0; // (an upgraded mixer: down in the room it is a mixer marked `up`)
    if (mixUp) kind = "f_mixer";
    const kitCap = hideout ? HIDEOUT_MAX_KITS : ROOM_MAX_KITS, mixerCap = hideout ? HIDEOUT_MAX_MIXERS : ROOM_MAX_MIXERS; // (the growing kits and the mixers keep their limit)
    if (kind === "f_planter" && Object.values(rows as Record<string, { kind?: string }>).filter((r) => r?.kind === "f_planter").length >= kitCap) fail(`${hideout ? "A hideout" : "A room"} fits ${kitCap} growing kits.`);
    if (kind === "f_mixer" && Object.values(rows as Record<string, { kind?: string }>).filter((r) => r?.kind === "f_mixer").length >= mixerCap) fail(`${hideout ? "A hideout" : "A room"} fits ${mixerCap} mixers.`);
    // a poster only hangs on a wall, and carries the picture chosen when it is hung (it stays on it; a poster taken down goes back blank)
    let img: string | undefined;
    if (kind === POSTER_KIND) {
      if (!wallPlaceOk(Number(a.x), Number(a.y), dir)) fail("A poster hangs on a wall: the back wall or the left wall.");
      if (a.img !== undefined) {
        if (!posterImageOk(a.img)) fail("That picture can't be used.");
        if (await c.db.get(`posterMutes/${c.uid}`)) fail("You can't put pictures on posters any more.");
        img = a.img as string;
      }
    } else if (a.img !== undefined) fail("Only a poster carries a picture.");
    if (HIDEOUT_ONLY.has(kind) && !hideout) fail("That piece only fits in a hideout.");
    c.extra[`roomsMeta/${room}/furni/${newRowId(c.now)}`] = { kind, ...(autoPot ? { auto: true } : {}), ...(mixUp ? { up: mixUp } : {}), x: Number(a.x), y: Number(a.y), ...(dir ? { dir } : {}), ...(img ? { img } : {}), ...(foreign ? { by: c.uid } : hideout ? { by: boxOwner ?? c.uid } : {}) };
    return {};
  },
};

/** Tapping a piece with several looks or animations (a TV, a fridge, candles ...): anyone standing in the room sends it on to the next one. */
export const furniState: Action = {
  async run(c, a) {
    const room = text(a.room, /^[uh]_[A-Za-z0-9]{1,40}$/, "room");
    await requireInRoom(c, room);
    if (isHideoutId(room) && !(await hideoutAccess(c, room)).member) fail("You aren't in that hideout.");
    const id = text(a.id, ID_RE, "piece");
    const row = await c.db.get<{ kind?: string; st?: number }>(`roomsMeta/${room}/furni/${id}`);
    if (!row?.kind) return fail("That piece isn't here.");
    const next = nextFurniState(row.kind, typeof row.st === "number" ? row.st : undefined);
    if (next === null) return fail("Nothing happens.");
    c.extra[`roomsMeta/${room}/furni/${id}/st`] = next;
    return { st: next };
  },
};

/** Moves or turns a piece that is already in your room. (The bed, bag, toolbox and sink have their own positions the browser sets.) */
export const furniMove: Action = {
  locks: (c, a) => roomLock(c, a),
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
    const x = int(a.x, 0, 24, "spot"), y = int(a.y, 0, 24, "spot");
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
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const { room, foreign, hideout, owner } = await roomFor(c, a);
    const id = text(a.id, ID_RE, "piece");
    if (id === BOOMBOX_ID) {
      if (hideout && !owner) fail("Only the owner can take the boombox."); // the room's own boombox goes into storage too (and can only come back out as a piece in the room, never into your pocket)
      if (foreign) fail("That isn't yours to take.");
      const gone = await c.db.get<boolean>(`roomsMeta/${room}/boombox/gone`);
      if (gone) fail("That piece isn't in your room.");
      await boomboxFree(c, room);
      const w = await c.user();
      if ((w.s.storage.f_boombox ?? 0) >= STORAGE_MAX_PIECES) fail("Storage is full of those.");
      w.s.storage.f_boombox = (w.s.storage.f_boombox ?? 0) + 1;
      c.extra[`roomsMeta/${room}/boombox`] = { gone: true };
      return {};
    }
    const row = await c.db.get<{ kind?: string; plantedAt?: number; mixJob?: unknown; by?: string; auto?: boolean; up?: number | boolean }>(`roomsMeta/${room}/furni/${id}`);
    if (!row?.kind) return fail("That piece isn't in your room.");
    if (foreign && row.by !== c.uid && !c.isAdmin) fail("That isn't yours to take.");
    const piece = row.kind === "f_planter" && row.auto ? "f_planter_auto" : row.kind === "f_mixer" && row.up ? (row.up === 2 ? "f_mixer_up2" : "f_mixer_up") : row.kind; // (the waterer goes into the pot: they are carried as one piece)
    if (typeof row.plantedAt === "number") fail("Harvest the plant first.");
    if (row.mixJob) fail("Collect what's in the mixer first.");
    if (row.kind === "f_boombox") await boomboxFree(c, room);
    if (a.to === "pocket") { // straight into your pocket (only a piece that is yours: in your own room everything is)
      if (hideout && row.by !== c.uid && !c.isAdmin) fail("That isn't yours to take.");
      if (!(await c.validItem())(piece)) fail("That can't be carried.");
      const w2 = await c.user();
      const next = addToInv(w2.s.inventory, { item: piece, qty: 1 });
      if (!next) fail("Your pockets are full.");
      w2.s.inventory = next!;
      c.extra[`roomsMeta/${room}/furni/${id}`] = null;
      return {};
    }
    if (hideout) { // a hideout's piece goes back into the shared box, still its owner's
      const by = typeof row.by === "string" ? row.by : c.uid;
      const inBox = (await c.db.get<number>(`roomsMeta/${room}/box/${by}/${piece}`)) ?? 0;
      if (inBox >= STORAGE_MAX_PIECES) fail("The box is full of those.");
      c.extra[`roomsMeta/${room}/box/${by}/${piece}`] = inBox + 1;
      c.extra[`roomsMeta/${room}/furni/${id}`] = null;
      return {};
    }
    const w = await c.user();
    const have = w.s.storage[piece] ?? 0;
    if (have >= STORAGE_MAX_PIECES) fail("Storage is full of those.");
    w.s.storage[piece] = have + 1;
    c.extra[`roomsMeta/${room}/furni/${id}`] = null;
    return {};
  },
};
