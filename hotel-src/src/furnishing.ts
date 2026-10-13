// Moving furniture around your room, and the storage that holds what you aren't using.
// Everything here is one atomic database write, so a piece is never in two places (or none) if the connection drops.
import { push, ref, update } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";
import { directionsOf, nitroIfReady } from "./nitro";
import { BAG_ID, BED_ID, FURNI_KINDS, footprint, isDoorTile, MAX_FURNI, PlacedFurni, RoomDef, TOOLBOX_ID } from "./rooms";

/** The pieces that are always in your room: movable, never removable. */
export const FIXED_IDS = new Set([BED_ID, BAG_ID, TOOLBOX_ID]);
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
  const taken = new Set<string>();
  for (const f of def.furni) {
    if (f.id === ignoreId || FURNI_KINDS[f.kind]?.flat) continue;
    const q = footprint(f.kind, f.dir);
    for (let i = 0; i < q.w; i++) for (let j = 0; j < q.h; j++) taken.add(key(f.x + i, f.y + j));
  }
  for (let i = 0; i < fp.w; i++) {
    for (let j = 0; j < fp.h; j++) {
      const x = spot.x + i, y = spot.y + j;
      if (isDoorTile(x, y, def.doorX)) return "Keep the doorway clear.";
      if (!k.flat && taken.has(key(x, y))) return "Something is already there.";
      if (!k.flat && occupied.has(key(x, y))) return "Someone is standing there.";
    }
  }
  return null;
}

export const freeSlots = (p: Profile): number => p.inventory.filter((s) => s === null).length;
export const storedCount = (p: Profile, kind: string): number => p.storage[kind] ?? 0;
export const placedCount = (def: RoomDef): number => def.furni.filter((f) => !isFixedPiece(f.id)).length;

const roomRef = (roomId: string) => `roomsMeta/${roomId}`;

/** The inventory with `slot` emptied and everything after it moved up (no gaps), as database paths plus the new array. */
function withoutSlot(p: Profile, slot: number): { patch: Record<string, unknown>; after: Profile["inventory"] } {
  const before = p.inventory;
  const kept = before.filter((s, i) => s && i !== slot) as NonNullable<Profile["inventory"][number]>[];
  const after = before.map((_, i) => kept[i] ?? null);
  const patch: Record<string, unknown> = {};
  for (let i = 0; i < before.length; i++) if (JSON.stringify(after[i]) !== JSON.stringify(before[i])) patch[`users/${p.uid}/inventory/${i}`] = after[i];
  return { patch, after };
}

/** Puts a piece you carry down in your room. */
export async function placeFromInventory(p: Profile, roomId: string, slot: number, spot: Spot): Promise<void> {
  const s = p.inventory[slot];
  if (!s) throw new Error("You aren't carrying that.");
  const id = push(ref(db, `${roomRef(roomId)}/furni`)).key!;
  const { patch, after } = withoutSlot(p, slot);
  await update(ref(db), { ...patch, [`${roomRef(roomId)}/furni/${id}`]: { kind: s.item, x: spot.x, y: spot.y, ...(spot.dir ? { dir: spot.dir } : {}) } });
  for (let i = 0; i < after.length; i++) p.inventory[i] = after[i];
}

/** Puts a piece from storage down in your room. */
export async function placeFromStorage(p: Profile, roomId: string, kind: string, spot: Spot): Promise<void> {
  const n = storedCount(p, kind);
  if (n < 1) throw new Error("There's none of that in storage.");
  const id = push(ref(db, `${roomRef(roomId)}/furni`)).key!;
  await update(ref(db), {
    [`users/${p.uid}/storage/${kind}`]: n > 1 ? n - 1 : null,
    [`${roomRef(roomId)}/furni/${id}`]: { kind, x: spot.x, y: spot.y, ...(spot.dir ? { dir: spot.dir } : {}) },
  });
  if (n > 1) p.storage[kind] = n - 1; else delete p.storage[kind];
}

/** Moves or turns a piece that is already in the room (the bed, bag and toolbox live under their own names). */
export async function movePiece(roomId: string, f: PlacedFurni, spot: Spot): Promise<void> {
  const path = f.id === BED_ID ? `${roomRef(roomId)}/bed` : f.id === BAG_ID ? `${roomRef(roomId)}/bag` : f.id === TOOLBOX_ID ? `${roomRef(roomId)}/toolbox` : `${roomRef(roomId)}/furni/${f.id}`;
  const dir = f.id === BED_ID ? 2 : spot.dir;
  await update(ref(db, path), { x: spot.x, y: spot.y, dir });
}

/** Takes a piece out of the room into storage. */
export async function storeFromRoom(p: Profile, roomId: string, f: PlacedFurni): Promise<void> {
  if (isFixedPiece(f.id)) throw new Error("That one stays in your room.");
  const n = storedCount(p, f.kind);
  if (n >= 99) throw new Error("Storage is full of those.");
  await update(ref(db), { [`${roomRef(roomId)}/furni/${f.id}`]: null, [`users/${p.uid}/storage/${f.kind}`]: n + 1 });
  p.storage[f.kind] = n + 1;
}

/** Moves a carried piece into storage. */
export async function storeFromInventory(p: Profile, slot: number): Promise<void> {
  const s = p.inventory[slot];
  if (!s) return;
  const n = storedCount(p, s.item);
  if (n >= 99) throw new Error("Storage is full of those.");
  const { patch, after } = withoutSlot(p, slot);
  await update(ref(db), { ...patch, [`users/${p.uid}/storage/${s.item}`]: n + 1 });
  p.storage[s.item] = n + 1;
  for (let i = 0; i < after.length; i++) p.inventory[i] = after[i];
}

/** Takes a stored piece back into your pocket. */
export async function takeFromStorage(p: Profile, kind: string): Promise<void> {
  const n = storedCount(p, kind);
  if (n < 1) return;
  const free = p.inventory.findIndex((s) => s === null);
  if (free < 0) throw new Error("Your inventory is full.");
  await update(ref(db), { [`users/${p.uid}/storage/${kind}`]: n > 1 ? n - 1 : null, [`users/${p.uid}/inventory/${free}`]: { item: kind, qty: 1 } });
  if (n > 1) p.storage[kind] = n - 1; else delete p.storage[kind];
  p.inventory[free] = { item: kind, qty: 1 };
}

export { MAX_FURNI };
