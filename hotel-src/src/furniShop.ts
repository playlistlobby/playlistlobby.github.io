// The shop room's daily stock: 4 pieces picked from the pool, the same for everybody, changing at midnight UTC.
// The pick is a seeded shuffle of the day number, so every player sees the same four without anything being stored; the admin can
// swap pieces or change prices (Admin > Shop > Furniture), which is stored at config/furniShop and wins for that day.
import { onValue, ref, remove, set, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { FURNI_KINDS, SHOP_KIND_PREFIX, SHOP_PIECES } from "./rooms";
import { furniPicksToday, furniPrice, MAX_PRICE, MIN_PRICE, PICKS_PER_DAY, randomFurniPicks } from "./shared/furniture";
export { MAX_PRICE, MIN_PRICE, PICKS_PER_DAY };
import { listFurni } from "./furniDefs";
import { todayStart } from "./db";


interface Config { day: number; picks: string[]; prices: Record<string, number> }
let cfg: Config = { day: 0, picks: [], prices: {} };
const listeners = new Set<() => void>();
export const onFurniShopChanged = (fn: () => void): (() => void) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Everything the shop can sell: the pieces that ship with the game, and Studio pieces the admin marked "players can place". */
export function shopPool(): string[] {
  return [...SHOP_PIECES.map((p) => SHOP_KIND_PREFIX + p.id), ...listFurni().filter((m) => m.players).map((m) => m.id)].filter((id) => FURNI_KINDS[id]);
}

/** What a piece costs today: the admin's price if set, else the shipped price, else 10-25 by name for Studio pieces. */
export const priceOf = (kind: string): number => furniPrice(kind, cfg.prices);

/** The random pick for a day (before any admin change). */
export const randomPicks = (day: number, count = PICKS_PER_DAY): string[] => randomFurniPicks(day, shopPool(), count);

/** Today's four pieces: the admin's choice if they made one for today, else the random pick. */
export const picksToday = (): string[] => furniPicksToday(todayStart(), cfg, shopPool(), (id) => !!FURNI_KINDS[id]);
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
