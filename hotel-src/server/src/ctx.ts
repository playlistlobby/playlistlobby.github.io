// What one action works with: the player(s) it touches (loaded once, changed in memory), the other writes it wants, and the shared
// settings (prices, daily stock, uploaded furniture). `commit()` turns the changes into ONE atomic database write.
import type { Caller } from "./auth";
import { Env } from "./env";
import { Rtdb } from "./rtdb";
import { cloneSnapshot, compactInv, parseEconomy, Snapshot, snapshotPatch } from "../../src/shared/economy";
import { DEFAULT_ITEM_PRICE, DISABLED_ITEMS, ITEM_DEFAULTS, ITEM_IDS } from "../../src/shared/items";
import { SHIPPED_DIMS } from "../../src/shared/furniture";

/** A mistake the player made (not enough blood, full pocket...): its text is shown to them. */
export class GameError extends Error {}
export const fail = (message: string): never => { throw new GameError(message); };

export interface ShopEntry { on: boolean; price: number; starter?: boolean }
export interface ShopConfig { clothing?: Record<string, ShopEntry>; emotes?: Record<string, ShopEntry>; items?: Record<string, ShopEntry>; music?: Record<string, ShopEntry> }
export interface FurniMetaLite { name: string; w: number; h: number; players: boolean; flat: boolean }
export interface PriceBookEntry { p: number; on: number }

/** Settings that rarely change are cached for a few seconds (they live in the Durable Object, shared by every action). */
const TTL = 20_000;
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export interface Work {
  uid: string;
  raw: any;
  before: Snapshot;
  s: Snapshot;
}

export class Ctx {
  now = Date.now();
  readonly works = new Map<string, Work>();
  readonly extra: Record<string, unknown> = {};

  constructor(readonly env: Env, readonly db: Rtdb, readonly caller: Caller) {}

  get uid(): string { return this.caller.uid; }
  get isAdmin(): boolean { return this.caller.isAdmin; }

  // ---- shared settings ------------------------------------------------------------------------------------------------
  shop(): Promise<ShopConfig> { return cached("shop", async () => (await this.db.get<ShopConfig>("config/shop")) ?? {}); }
  furniMeta(): Promise<Record<string, FurniMetaLite>> {
    return cached("furniMeta", async () => {
      const raw = (await this.db.get<Record<string, any>>("furni/meta")) ?? {};
      return Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, { name: String(v.name ?? id), w: Number(v.w) || 1, h: Number(v.h) || 1, players: !!v.players, flat: !!v.flat }]));
    });
  }
  async furniCfg(): Promise<{ day: number; picks: string[]; prices: Record<string, number> }> {
    return cached("furniCfg", async () => {
      const v = (await this.db.get<any>("config/furniShop")) ?? {};
      const picksRaw = v.today?.picks;
      const picks: string[] = Array.isArray(picksRaw) ? picksRaw : picksRaw ? Object.values(picksRaw) : [];
      return { day: Number(v.today?.day) || 0, picks: picks.filter((x) => typeof x === "string"), prices: (v.prices ?? {}) as Record<string, number> };
    });
  }
  /** What the admin's game published: every clothing item that isn't free, with its price and whether it's on sale. */
  priceBook(): Promise<Record<string, PriceBookEntry>> {
    return cached("priceBook", async () => (await this.db.get<Record<string, PriceBookEntry>>("config/priceBook/clothing")) ?? {});
  }

  /** A shop entry for an ordinary item or a piece sold by 6ixty / the vending machine (admin settings first, then the defaults). */
  async itemEntry(id: string): Promise<ShopEntry> {
    return (await this.shop()).items?.[id] ?? ITEM_DEFAULTS[id] ?? { on: false, price: DEFAULT_ITEM_PRICE };
  }

  /** Does this item id exist (an ordinary item, a shipped piece of furniture, or an uploaded one)? */
  async validItem(): Promise<(id: string) => boolean> {
    const meta = await this.furniMeta();
    return (id) => (ITEM_IDS.has(id) && !DISABLED_ITEMS.has(id)) || !!SHIPPED_DIMS[id] || !!meta[id];
  }
  /** Size of a piece of furniture a player may place, or null. */
  async placeableDims(kind: string): Promise<{ w: number; h: number } | null> {
    if (SHIPPED_DIMS[kind]) return SHIPPED_DIMS[kind];
    const m = (await this.furniMeta())[kind];
    return m && m.players ? { w: m.w, h: m.h } : null;
  }

  // ---- players --------------------------------------------------------------------------------------------------------
  /** Loads a player's economy once; the action changes `.s` and commit() writes the difference. */
  async user(uid: string = this.uid): Promise<Work> {
    const have = this.works.get(uid);
    if (have) return have;
    const raw = await this.db.get<any>(`users/${uid}`);
    if (!raw) fail("That player doesn't exist.");
    const valid = await this.validItem();
    const s = parseEconomy(raw, valid, uid === this.uid && this.isAdmin);
    const w: Work = { uid, raw, before: cloneSnapshot(s), s };
    this.works.set(uid, w);
    return w;
  }

  /** Writes everything in one atomic update; returns the acting player's new state. */
  async commit(): Promise<Snapshot | null> {
    const updates: Record<string, unknown> = { ...this.extra };
    for (const w of this.works.values()) {
      w.s.inventory = compactInv(w.s.inventory);
      Object.assign(updates, snapshotPatch(w.uid, w.before, w.s));
    }
    await this.db.patch(updates);
    return this.works.get(this.uid)?.s ?? null;
  }
}
