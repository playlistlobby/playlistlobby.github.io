// Furniture that ships with the game, and how the shop room's daily four are picked and priced. Pure: the browser and the server both use it.
/** Furniture that ships with the game and is sold in the shop room (10-25 drops). Each file is in public/furni/f_<id>.nitro. */
export interface ShopPiece { id: string; label: string; icon: string; price: number; w: number; h: number; height: number; flat?: boolean; seat?: boolean; seatHeight?: number; /** the facing it has on its display platform in the shop */ showDir: number }
export const SHOP_PIECES: ShopPiece[] = [
  { id: "bloodfloor", label: "Blood streak", icon: "🩸", price: 10, w: 1, h: 3, height: 3, flat: true, showDir: 2 },
  { id: "toastfriend", label: "Toast friend", icon: "🍞", price: 10, w: 1, h: 1, height: 30, showDir: 2 },
  { id: "bodybag", label: "Body bag", icon: "🧳", price: 12, w: 2, h: 1, height: 20, showDir: 4 },
  { id: "bench", label: "Grunge bench", icon: "🪑", price: 14, w: 3, h: 1, height: 36, seat: true, seatHeight: 14, showDir: 4 },
  { id: "sofa", label: "Old sofa", icon: "🛋️", price: 16, w: 2, h: 1, height: 44, seat: true, seatHeight: 16, showDir: 4 },
  { id: "cardtable", label: "Card table", icon: "🃏", price: 18, w: 3, h: 2, height: 34, showDir: 2 },
  { id: "torturebed", label: "Restraint bed", icon: "⛓️", price: 20, w: 1, h: 3, height: 42, showDir: 2 },
  { id: "fountain", label: "Fountain", icon: "⛲", price: 22, w: 2, h: 2, height: 50, showDir: 2 },
  // the second batch (from Swf/Furniture/New)
  { id: "nokiaphone", label: "Nokia phone", icon: "📱", price: 10, w: 1, h: 1, height: 10, showDir: 4 },
  { id: "telephone", label: "Telephone", icon: "☎️", price: 11, w: 1, h: 1, height: 30, showDir: 2 },
  { id: "phonecam", label: "Phone cam", icon: "📷", price: 12, w: 1, h: 1, height: 34, showDir: 4 },
  { id: "creepydoll", label: "Creepy doll", icon: "🪆", price: 12, w: 1, h: 1, height: 30, showDir: 4 },
  { id: "saintta", label: "Saint Ta", icon: "🎅", price: 13, w: 1, h: 1, height: 30, showDir: 4 },
  { id: "shark", label: "Shark", icon: "🦈", price: 14, w: 1, h: 1, height: 30, showDir: 2 },
  { id: "horse", label: "Horse", icon: "🐴", price: 16, w: 1, h: 1, height: 70, showDir: 4 },
  { id: "prizemoney", label: "Prize money", icon: "💰", price: 15, w: 1, h: 1, height: 3, flat: true, showDir: 2 },
  { id: "label", label: "Shuffi", icon: "🏷️", price: 10, w: 1, h: 1, height: 3, flat: true, showDir: 2 },
  { id: "ritualcircle", label: "Ritual circle", icon: "⭕", price: 17, w: 2, h: 2, height: 3, flat: true, showDir: 2 },
  { id: "bloodbath", label: "Blood bath", icon: "🛁", price: 19, w: 1, h: 1, height: 86, showDir: 2 },
  { id: "norjasofa", label: "Norja couch", icon: "🛋️", price: 18, w: 2, h: 1, height: 32, seat: true, seatHeight: 14, showDir: 4 },
  { id: "collsofa", label: "Collector sofa", icon: "🛋️", price: 21, w: 2, h: 1, height: 45, seat: true, seatHeight: 16, showDir: 4 },
  { id: "lounger", label: "Red chaise", icon: "🛋️", price: 17, w: 2, h: 1, height: 32, showDir: 4 },
  { id: "jetsettub", label: "Jetset tub", icon: "🛁", price: 20, w: 1, h: 2, height: 34, showDir: 2 },
  { id: "gargoyle", label: "Gargoyle fountain", icon: "⛲", price: 23, w: 2, h: 1, height: 96, showDir: 2 },
  { id: "floatbed", label: "Float bed", icon: "🛏️", price: 19, w: 2, h: 1, height: 20, showDir: 2 },
  { id: "bunnybed", label: "Big bunny bed", icon: "🐰", price: 22, w: 1, h: 3, height: 51, showDir: 2 },
  { id: "hotdogbed", label: "Hot dog bed", icon: "🌭", price: 22, w: 1, h: 3, height: 42, showDir: 2 },
  { id: "melodybed", label: "My Melody bed", icon: "🎀", price: 25, w: 2, h: 3, height: 64, showDir: 2 },
  { id: "royalbed", label: "Canopy bed", icon: "🛏️", price: 25, w: 2, h: 3, height: 51, showDir: 2 },
];
export const SHOP_KIND_PREFIX = "f_";


/** how big the pieces that ship with the game are (the growing kit too) */
export const SHIPPED_DIMS: Record<string, { w: number; h: number }> = {
  ...Object.fromEntries(SHOP_PIECES.map((p) => [SHOP_KIND_PREFIX + p.id, { w: p.w, h: p.h }])),
  f_planter: { w: 1, h: 1 },
  f_mixer: { w: 1, h: 1 },
  f_boombox: { w: 1, h: 1 }, // the room's boombox once it has been taken out and carried around
  f_poster: { w: 2, h: 1 },
};

// ---- the poster: a frame on the wall with a picture of the player's own in it ----------------------------------------
export const POSTER_KIND = "f_poster";
/** the shop sells a poster for blood; a poster's picture is chosen when it is hung and then stays on it */
export const POSTER_PRICE = 25;
/** the picture inside the frame is this many pixels (drawn twice as big in the game, so it comes out pixelated) */
export const POSTER_W = 25;
export const POSTER_H = 38;
/** A poster only hangs on a wall: the back wall facing 4 (y = 0) or the left wall facing 2 (x = 0). */
export const wallPlaceOk = (x: number, y: number, dir: number): boolean => (dir === 4 && y === 0) || (dir === 2 && x === 0);
/**
 * The picture a poster carries: a small PNG as a data address. Only a real PNG of exactly the right size, no bigger than ~9 KB, is accepted
 * (the server checks this before it is stored on the poster).
 */
export function posterImageOk(img: unknown): img is string {
  if (typeof img !== "string" || img.length > 12_000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(img)) return false;
  try {
    const bytes = atob(img.slice("data:image/png;base64,".length).slice(0, 48));
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (bytes.charCodeAt(i) !== sig[i]) return false;
    const u32 = (o: number): number => ((bytes.charCodeAt(o) << 24) | (bytes.charCodeAt(o + 1) << 16) | (bytes.charCodeAt(o + 2) << 8) | bytes.charCodeAt(o + 3)) >>> 0;
    return bytes.slice(12, 16) === "IHDR" && u32(16) === POSTER_W && u32(20) === POSTER_H;
  } catch { return false; }
}

export const PICKS_PER_DAY = 4;
export const MIN_PRICE = 10;
export const MAX_PRICE = 25;

export interface FurniShopCfg { day: number; picks: string[]; prices: Record<string, number> }

const hash = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/** What a piece costs: the admin's price if set, else the shipped price, else 10-25 by name for Studio pieces. */
export function furniPrice(kind: string, prices: Record<string, number>): number {
  const set = prices[kind];
  if (typeof set === "number" && set > 0) return Math.round(set);
  if (kind === "f_poster") return 25; // the poster has its own price (POSTER_PRICE): 6ixty pays 75% of that
  const shipped = SHOP_PIECES.find((p) => SHOP_KIND_PREFIX + p.id === kind);
  return shipped ? shipped.price : MIN_PRICE + (hash(kind) % (MAX_PRICE - MIN_PRICE + 1));
}

/** Seeded shuffle (mulberry32) so the same day always gives the same four. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** The random pick for a day (before any admin change). `pool` = every kind the shop can sell. */
export function randomFurniPicks(day: number, pool: string[], count = PICKS_PER_DAY): string[] {
  const list = [...pool].sort();
  const rnd = seeded(Math.floor(day / 86_400_000) * 2654435761);
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list.slice(0, Math.min(count, list.length));
}

/** Today's four pieces: the admin's choice if they made one for today, else the random pick. `known` says which kinds exist. */
export function furniPicksToday(dayStart: number, cfg: FurniShopCfg, pool: string[], known: (kind: string) => boolean): string[] {
  const mine = cfg.day === dayStart ? cfg.picks.filter(known) : [];
  return mine.length ? mine.slice(0, PICKS_PER_DAY) : randomFurniPicks(dayStart, pool);
}