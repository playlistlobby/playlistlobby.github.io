// The landlord sells new looks for the two fixed pieces every player room has: the bed and the bag of clothes (which can become a wardrobe).
// A look is bought once (kept as an owned key) and can then be swapped for free. The server writes the chosen one to roomsMeta/<room>/skins/<part>.
export type SkinPart = "bed" | "bag";

export interface RoomSkin {
  id: string;
  label: string;
  /** drops, once */
  price: number;
  /** footprint in tiles when it faces 0 or 4 (it swaps when it faces 2 or 6) */
  w: number;
  h: number;
  /** drawn height in px */
  height: number;
  /** a wall item: it hangs on a wall (the back wall facing 4, the left wall facing 2) and doesn't stand on the floor */
  wall?: boolean;
  /** how far up the wall (64px pixels) a wall item hangs */
  lift?: number;
}

export const BED_SKINS: RoomSkin[] = [
  { id: "lodge", label: "Lodge bed", price: 20, w: 1, h: 3, height: 52 },
  { id: "bunny", label: "Bunny bed", price: 30, w: 1, h: 3, height: 46 },
  { id: "gold", label: "Gold bed", price: 40, w: 1, h: 3, height: 50 },
  { id: "gothic", label: "Gothic bed", price: 60, w: 2, h: 3, height: 60 },
];
export const BAG_SKINS: RoomSkin[] = [
  { id: "coatrack", label: "Coat rack", price: 10, w: 1, h: 1, height: 29, wall: true, lift: 52 },
  { id: "mess", label: "Mess wardrobe", price: 15, w: 2, h: 1, height: 29 },
  { id: "plain", label: "Wardrobe", price: 20, w: 2, h: 1, height: 90 },
  { id: "ducket", label: "Ducket wardrobe", price: 25, w: 2, h: 1, height: 90 },
];

export const skinsOf = (part: SkinPart): RoomSkin[] => (part === "bed" ? BED_SKINS : BAG_SKINS);
export const skinOf = (part: SkinPart, id: string | null | undefined): RoomSkin | undefined => (id ? skinsOf(part).find((s) => s.id === id) : undefined);
/** the key in `owned` once a look is bought */
export const skinOwnedKey = (part: SkinPart, id: string): string => `skin_${part}_${id}`;

/** What the plain bed (1 x 3) and the bag (1 x 1) cover, and where they stand until moved (the same numbers as BED / BAG in rooms.ts). */
export const BASE_SKIN_DIMS: Record<SkinPart, { w: number; h: number }> = { bed: { w: 1, h: 3 }, bag: { w: 1, h: 1 } };
export const DEFAULT_PIECE_POS: Record<SkinPart, { x: number; y: number; dir: number }> = { bed: { x: 3, y: 0, dir: 2 }, bag: { x: 7, y: 0, dir: 2 } };

/** Where the other fixed pieces stand until moved (the same numbers as TOOLBOX / SINK / BOOMBOX in rooms.ts); they cover one tile each. */
export const DEFAULT_FIXED_POS = { toolbox: { x: 6, y: 0 }, sink: { x: 0, y: 7 }, boombox: { x: 0, y: 3 } };

/**
 * The nearest spot for a floor piece of `w` x `h` (as it stands facing the room) against a wall, where nothing is in the way: along the back
 * wall (facing 4) or the left wall (facing 2, which turns the footprint). `taken` lists the tiles that are in use ("x,y"), `near` is where it was.
 * Falls back to the nearest free spot anywhere; null when the room has no space at all.
 */
export function nearestWallSpot(size: { w: number; h: number }, taken: Set<string>, dims: { w: number; h: number }, near: { x: number; y: number }, doorX = 1): { x: number; y: number; dir: number } | null {
  const free = (x: number, y: number, w: number, h: number): boolean => {
    if (x < 0 || y < 0 || x + w > size.w || y + h > size.h) return false;
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
      if (taken.has(`${x + i},${y + j}`)) return false;
      if (x + i === doorX && y + j <= 1) return false; // the door and the tile in front of it stay clear
    }
    return true;
  };
  let best: { x: number; y: number; dir: number } | null = null, bestD = Infinity;
  const consider = (x: number, y: number, dir: number, w: number, h: number): void => {
    if (!free(x, y, w, h)) return;
    const d = Math.abs(x - near.x) + Math.abs(y - near.y);
    if (d < bestD) { bestD = d; best = { x, y, dir }; }
  };
  for (let x = 0; x < size.w; x++) consider(x, 0, 4, dims.w, dims.h); // back wall
  for (let y = 0; y < size.h; y++) consider(0, y, 2, dims.h, dims.w); // left wall (turned)
  if (best) return best;
  for (let x = 0; x < size.w; x++) for (let y = 0; y < size.h; y++) consider(x, y, 4, dims.w, dims.h); // anywhere
  return best;
}

/** Tiles a piece covers given its look and facing (the bed always faces 2). */
export function skinFootprint(part: SkinPart, id: string | null | undefined, dir: number): { w: number; h: number } {
  const d = skinOf(part, id) ?? BASE_SKIN_DIMS[part];
  return dir === 2 || dir === 6 ? { w: d.h, h: d.w } : { w: d.w, h: d.h };
}
