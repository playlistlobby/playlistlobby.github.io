// The shop room's daily stock: 4 pieces picked from the pool, the same for everybody, changing at midnight UTC.
// The pick is a seeded shuffle of the day number, so every player sees the same four without anything being stored; the admin can
// swap pieces or change prices (Admin > Shop > Furniture), which is stored at config/furniShop and wins for that day.
import { onValue, ref, remove, set, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { FURNI_KINDS, SHOP_KIND_PREFIX, SHOP_PIECES } from "./rooms";
import { listFurni } from "./furniDefs";
import { todayStart } from "./db";

export const PICKS_PER_DAY = 4;
export const MIN_PRICE = 10;
export const MAX_PRICE = 25;

interface Config { day: number; picks: string[]; prices: Record<string, number> }
let cfg: Config = { day: 0, picks: [], prices: {} };
const listeners = new Set<() => void>();
export const onFurniShopChanged = (fn: () => void): (() => void) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Everything the shop can sell: the pieces that ship with the game, and Studio pieces the admin marked "players can place". */
export function shopPool(): string[] {
  return [...SHOP_PIECES.map((p) => SHOP_KIND_PREFIX + p.id), ...listFurni().filter((m) => m.players).map((m) => m.id)].filter((id) => FURNI_KINDS[id]);
}

const hash = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/** What a piece costs today: the admin's price if set, else the shipped price, else 10-25 by name for Studio pieces. */
export function priceOf(kind: string): number {
  const set = cfg.prices[kind];
  if (typeof set === "number" && set > 0) return Math.round(set);
  const shipped = SHOP_PIECES.find((p) => SHOP_KIND_PREFIX + p.id === kind);
  return shipped ? shipped.price : MIN_PRICE + (hash(kind) % (MAX_PRICE - MIN_PRICE + 1));
}

/** Seeded shuffle (mulberry32) so the same day always gives the same four. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** The random pick for a day (before any admin change). */
export function randomPicks(day: number, count = PICKS_PER_DAY): string[] {
  const pool = [...shopPool()].sort();
  const rnd = seeded(Math.floor(day / 86_400_000) * 2654435761);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Today's four pieces: the admin's choice if they made one for today, else the random pick. */
export function picksToday(): string[] {
  const day = todayStart();
  const mine = cfg.day === day ? cfg.picks.filter((id) => FURNI_KINDS[id]) : [];
  return mine.length ? mine.slice(0, PICKS_PER_DAY) : randomPicks(day);
}
export const isAdminPick = (): boolean => cfg.day === todayStart() && cfg.picks.length > 0;

export function watchFurniShop(): { ready: Promise<void>; stop: Unsubscribe } {
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  const stop = onValue(ref(db, "config/furniShop"), (snap) => {
    const v = (snap.val() ?? {}) as { today?: { day?: number; picks?: unknown }; prices?: Record<string, number> };
    const picks = Array.isArray(v.today?.picks) ? (v.today!.picks as unknown[]).filter((x): x is string => typeof x === "string") : v.today?.picks ? Object.values(v.today.picks as Record<string, string>).filter((x) => typeof x === "string") : [];
    cfg = { day: Number(v.today?.day) || 0, picks, prices: v.prices ?? {} };
    listeners.forEach((l) => l());
    resolve();
  }, () => resolve());
  return { ready, stop };
}

// ---- admin edits (Admin > Shop > Furniture) ----------------------------------------------------------------------
/** Pins today's pieces (the admin's own choice); it only applies for today's date. */
export const saveTodayPicks = (picks: string[]): Promise<void> => set(ref(db, "config/furniShop/today"), { day: todayStart(), picks });
/** Goes back to the random pick for today. */
export const clearTodayPicks = (): Promise<void> => remove(ref(db, "config/furniShop/today"));
export const savePrice = (kind: string, price: number): Promise<void> => set(ref(db, `config/furniShop/prices/${kind}`), Math.max(1, Math.min(999, Math.round(price))));
export const clearPrice = (kind: string): Promise<void> => remove(ref(db, `config/furniShop/prices/${kind}`));
