// A pet is an item (like an unusual hat): it sits in the pocket, a tap lets it out to follow you, a tap on it in the room puts it back in the pocket.
// Its id says what it is: "pet_<type>_<colour>" ("pet_cat_5"), and an unusual pet from a mystery box also has its particle effect: "pet_cat_5_flames".
import { PET_COLORS, PET_TYPES } from "./pets";
import { isUnusualFx, UnusualEffect } from "./unusualFx";

export interface PetItem { type: string; palette: number; fx?: UnusualEffect }
export const petItemId = (p: PetItem): string => `pet_${p.type}_${p.palette}${p.fx ? `_${p.fx}` : ""}`;
export function parsePetItem(id: unknown): PetItem | null {
  if (typeof id !== "string") return null;
  const m = /^pet_([a-z]{3,20})_(\d{1,2})(?:_([a-z]{3,12}))?$/.exec(id);
  if (!m || !PET_TYPES.includes(m[1])) return null;
  const palette = Number(m[2]);
  if (palette >= Math.max(1, PET_COLORS[m[1]] ?? 0)) return null;
  if (m[3] !== undefined && !isUnusualFx(m[3])) return null;
  return { type: m[1], palette, ...(m[3] ? { fx: m[3] as UnusualEffect } : {}) };
}
export const isPetItem = (id: unknown): boolean => parsePetItem(id) !== null;
/** what the room's presence says about the pet that walks with you: the same as the item id without "pet_" ("cat:5", "cat:5:flames") */
export const petLookOf = (p: PetItem): string => `${p.type}:${p.palette}${p.fx ? `:${p.fx}` : ""}`;
export function parsePetLook(look: unknown): PetItem | null {
  if (typeof look !== "string") return null;
  const [type, pal, fx] = look.split(":");
  return parsePetItem(`pet_${type}_${pal}${fx ? `_${fx}` : ""}`);
}
/** the name shown for a pet */
export const petLabel = (type: string): string => type.replace(/baby$/, " baby").replace(/^./, (c) => c.toUpperCase());

// ---- what pets bih has: four pets at a time, a new four every 6 hours (the same for everybody: it only depends on the clock) ----
export const PET_STOCK_COUNT = 4;
export const PET_STOCK_MS = 6 * 60 * 60 * 1000;
/** the four pets on sale at this time, picked by a shuffle seeded with the 6-hour period we are in */
export function petStock(now: number): string[] {
  let seed = Math.floor(now / PET_STOCK_MS) + 12345;
  const rand = (): number => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pool = [...PET_TYPES];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, PET_STOCK_COUNT);
}
/** when the pets on sale are swapped for the next four (ms) */
export const petStockEnds = (now: number): number => (Math.floor(now / PET_STOCK_MS) + 1) * PET_STOCK_MS;
