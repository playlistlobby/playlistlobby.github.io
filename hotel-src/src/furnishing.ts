// Moving furniture around your room, and the storage that holds what you aren't using.
// What you own (the pocket, the storage, the pieces in your room) is changed by the game server in one atomic write, so a piece is never
// in two places (or none). Only where the bed, bag, toolbox and sink stand is written here: that is looks, not belongings.
import { ref, update } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { itemDef, STACKABLE } from "./items";
import { directionsOf, nitroIfReady } from "./nitro";
import { BAG_ID, BED_ID, BOOMBOX_ID, SINK_ID, STASH_ID, FURNI_KINDS, footprint, isDoorTile, MAX_FURNI, PlacedFurni, RoomDef, TOOLBOX_ID } from "./rooms";

/** The pieces that are always in your room: movable, never removable. */
export const FIXED_IDS = new Set([BED_ID, BAG_ID, TOOLBOX_ID, SINK_ID, BOOMBOX_ID, STASH_ID]);
export const isFixedPiece = (id: string): boolean => FIXED_IDS.has(id);

/** Which way a piece can be turned: the bed only faces one way; everything else turns by a quarter. */
export const canTurn = (f: { id: string; kind: string }): boolean => f.id !== BED_ID && !!FURNI_KINDS[f.kind]?.rotatable;

/** The facings a piece really has art for (a piece with two pictures turns between those two, not through four facings that look alike). */
function artDirs(kind: string): number[] {
  const path = FURNI_KINDS[kind]?.nitro;
  const n = path ? nitroIfReady(path) : undefined;
  const d = n ? directionsOf(n) : [];
  return d.length ? d : [0, 2, 4, 6];
}
/** The next facing when you press Turn. */
export function nextDir(kind: string, dir: number): number {
  const have = artDirs(kind);
  if (have.length >= 4) return (dir + 2) % 8;
  const cur = have.includes(dir) ? dir : have.includes(dir % 4) ? dir % 4 : have[0];
  return have[(have.indexOf(cur) + 1) % have.length];
}
/** The facing a new piece starts with: one that shows its front to the room (4 or 2 when it has them). */
export function defaultDir(kind: string): number {
  const have = artDirs(kind);
  return have.includes(4) ? 4 : have.includes(2) ? 2 : have[0] ?? 0;
}

export type Spot = { x: number; y: number; dir: number };
const key = (x: number, y: number) => `${x},${y}`;

/** Why a piece can't stand here (null = it can). `ignoreId` is the piece being moved; `occupied` = tiles with people on them. */
export function whyNot(def: RoomDef, kind: string, spot: Spot, ignoreId: string | null, occupied: Set<string>): string | null {
  const k = FURNI_KINDS[kind];
  if (!k) return "That piece doesn't exist.";
  const fp = footprint(kind, spot.dir);
  if (spot.x < 0 || spot.y < 0 || spot.x + fp.w > def.w || spot.y + fp.h > def.h) return "That doesn't fit in the room.";
  if (k.wall && !((spot.dir === 4 && spot.y === 0) || (spot.dir === 2 && spot.x === 0))) return "That one hangs on a wall: put it against the back wall or the left wall.";
  if (k.wall) {
    // two things can't hang in the same place on a wall
    for (const f of def.furni) {
      if (f.id === ignoreId || !FURNI_KINDS[f.kind]?.wall) continue;
      const q = footprint(f.kind, f.dir);
      if ((f.dir ?? 4) === spot.dir && spot.x < f.x + q.w && f.x < spot.x + fp.w && spot.y < f.y + q.h && f.y < spot.y + fp.h) return "Something already hangs there.";
    }
  }
  // tables (pieces with a top) carry one small thing per tile; everything else needs the tile to itself
  const taken = new Set<string>(), tops = new Set<string>(), onTops = new Set<string>();
  for (const f of def.furni) {
    if (f.id === ignoreId || FURNI_KINDS[f.kind]?.flat) continue;
    const q = footprint(f.kind, f.dir);
    if (FURNI_KINDS[f.kind]?.surface) { for (let i = 0; i < q.w; i++) for (let j = 0; j < q.h; j++) tops.add(key(f.x + i, f.y + j)); }
  }
  for (const f of def.furni) {
    if (f.id === ignoreId || FURNI_KINDS[f.kind]?.flat) continue;
    const q = footprint(f.kind, f.dir);
    for (let i = 0; i < q.w; i++) for (let j = 0; j < q.h; j++) {
      const t = key(f.x + i, f.y + j);
      if (FURNI_KINDS[f.kind]?.surface) continue;
      if (FURNI_KINDS[f.kind]?.small && tops.has(t)) onTops.add(t); else taken.add(t);
    }
  }
  for (const t of tops) taken.add(t); // (the table's own tiles)
  for (let i = 0; i < fp.w; i++) {
    for (let j = 0; j < fp.h; j++) {
      const x = spot.x + i, y = spot.y + j;
      if (isDoorTile(x, y, def.doorX)) return "Keep the doorway clear.";
      const t = key(x, y);
      if (k.small && !k.flat && tops.has(t)) { // a small thing on a table top
        if (onTops.has(t)) return "Something already stands there.";
        continue;
      }
      if (!k.flat && (taken.has(t) || onTops.has(t))) return "Something is already there.";
      if (!k.flat && occupied.has(t)) return "Someone is standing there.";
    }
  }
  return null;
}

/** Where a wall item goes when the pointer is on tile t: it snaps to the nearest wall (the back wall facing 4, the left wall facing 2) and slides along it. */
export function wallSpot(def: RoomDef, kind: string, t: { x: number; y: number }, prefer?: number): Spot {
  const onBack = prefer === 4 ? true : prefer === 2 ? false : t.y <= t.x; // (Turn picks the wall: 4 = the back wall, 2 = the left wall)
  const dir = onBack ? 4 : 2;
  const fp = footprint(kind, dir);
  return onBack ? { x: Math.max(0, Math.min(t.x, def.w - fp.w)), y: 0, dir } : { x: 0, y: Math.max(0, Math.min(t.y, def.h - fp.h)), dir };
}
/** Turning a wall item takes it round the corner to the other wall. */
export function turnedWallSpot(def: RoomDef, kind: string, f: { x: number; y: number; dir?: number }): Spot {
  const toLeft = (f.dir ?? 4) === 4;
  const dir = toLeft ? 2 : 4;
  const fp = footprint(kind, dir);
  return toLeft ? { x: 0, y: Math.max(0, Math.min(f.x, def.h - fp.h)), dir } : { x: Math.max(0, Math.min(f.y, def.w - fp.w)), y: 0, dir };
}

/** What the toolbox keeps: furniture, and everything else you carry (cigarettes, weed, a lighter...). Ass weed is kept apart as "ass_<item>". */
export const storeKeyOf = (s: { item: string; ass?: boolean }): string => (s.ass ? `ass_${s.item}` : s.item);
export function parseStoreKey(key: string): { item: string; ass?: boolean } {
  return key.startsWith("ass_") && itemDef(key.slice(4)) ? { item: key.slice(4), ass: true } : { item: key };
}
/** furniture pieces are placed from storage; everything else is just taken back out */
export const isFurnitureKey = (key: string): boolean => !!FURNI_KINDS[key];
/** things in your pocket that can go into the toolbox: not a lit smoke, not a CD that is in the player */
export const isStorable = (s: { lit?: number; inPlayer?: boolean | string } | null | undefined): boolean => !!s && !s.lit && !s.inPlayer;
export const STORAGE_MAX_PIECES = 99;
export const STORAGE_MAX_ITEMS = 9999;

export const freeSlots = (p: Profile): number => p.inventory.filter((s) => s === null).length;
export const storedCount = (p: Profile, kind: string): number => p.storage[kind] ?? 0;
export const placedCount = (def: RoomDef): number => def.furni.filter((f) => !isFixedPiece(f.id)).length;

const roomRef = (roomId: string) => `roomsMeta/${roomId}`;

/** Puts a piece you carry down in your room. */
export async function placeFromInventory(p: Profile, roomId: string, slot: number, spot: Spot, img?: string): Promise<void> {
  if (!p.inventory[slot]) throw new Error("You aren't carrying that.");
  await call(p, "furniPlace", { room: roomId, source: "inv", slot, x: spot.x, y: spot.y, dir: spot.dir, ...(img ? { img } : {}) });
}

/** Puts a piece from storage down in your room. */
export async function placeFromStorage(p: Profile, roomId: string, kind: string, spot: Spot, img?: string): Promise<void> {
  if (storedCount(p, kind) < 1) throw new Error("There's none of that in storage.");
  await call(p, "furniPlace", { room: roomId, source: "storage", kind, x: spot.x, y: spot.y, dir: spot.dir, ...(img ? { img } : {}) });
}

/** Moves or turns a piece that is already in the room. The bed, bag, toolbox and sink live under their own names (looks only); every other piece goes through the server. */
export async function movePiece(roomId: string, f: PlacedFurni, spot: Spot, p?: Profile): Promise<void> {
  if (isFixedPiece(f.id)) {
    const path = f.id === BED_ID ? `${roomRef(roomId)}/bed` : f.id === BAG_ID ? `${roomRef(roomId)}/bag` : f.id === TOOLBOX_ID ? `${roomRef(roomId)}/toolbox` : f.id === BOOMBOX_ID ? `${roomRef(roomId)}/boombox` : f.id === STASH_ID ? `${roomRef(roomId)}/stashbox` : `${roomRef(roomId)}/sink`;
    await update(ref(db, path), { x: spot.x, y: spot.y, dir: f.id === BED_ID ? 2 : spot.dir });
    return;
  }
  if (!p) throw new Error("Not signed in.");
  await call(p, "furniMove", { room: roomId, id: f.id, x: spot.x, y: spot.y, dir: spot.dir });
}

/** Takes a piece out of the room into storage. */
export async function storeFromRoom(p: Profile, roomId: string, f: PlacedFurni): Promise<void> {
  if (isFixedPiece(f.id) && f.id !== BOOMBOX_ID) throw new Error("That one stays in your room."); // (the boombox goes into storage, never into your pocket)
  if (f.plant) throw new Error("Harvest the plant first.");
  await call(p, "furniStore", { room: roomId, id: f.id });
}

/** Puts what you carry into the toolbox: a piece of furniture, or `qty` of an item (a whole stack of cigarettes, say). */
export async function storeFromInventory(p: Profile, slot: number, qty = 1): Promise<void> {
  const s = p.inventory[slot];
  if (!s) return;
  if (s.lit) throw new Error("Wait for it to burn out first.");
  if (s.inPlayer) throw new Error("That's in the player right now.");
  await call(p, "store", { slot, qty });
}

/** Takes things back out of the toolbox into your pocket (`qty` of them; stackable items share a slot, the rest need one slot each). */
export async function takeFromStorage(p: Profile, key: string, qty = 1): Promise<void> {
  if (storedCount(p, key) < 1) return;
  await call(p, "take", { key, qty });
}

export { MAX_FURNI };
