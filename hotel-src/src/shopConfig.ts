import { onValue, ref, remove, set, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { applyClothingConfig } from "./catalog";
import { setEmoteOverrides } from "./emotes";
import { MUSIC_ACCESS_PRICE } from "./items";

/**
 * What's in the shop is decided by the admin (Admin app > Clothes & Items) and stored at config/shop.
 * Anything the admin hasn't touched keeps its default: clothes and emotes are on sale at their usual price,
 * the music pass is on sale, and physical items (knife, CD, syringe) are not sold.
 */
export interface ShopEntry {
  on: boolean;
  price: number;
}
export type ShopSection = "clothing" | "emotes" | "items" | "music";

export interface ShopConfig {
  clothing: Record<string, ShopEntry>;
  emotes: Record<string, ShopEntry>;
  items: Record<string, ShopEntry>;
  music: Record<string, ShopEntry>;
}

export const shopConfig: ShopConfig = { clothing: {}, emotes: {}, items: {}, music: {} };

export const DEFAULT_ITEM_PRICE = 5;
const listeners = new Set<() => void>();

/** The jukebox pass entry (stored as config/shop/music/pass). */
export const musicEntry = (): ShopEntry => shopConfig.music.pass ?? { on: true, price: MUSIC_ACCESS_PRICE };
/** A physical item (knife, CD, syringe). Not sold unless the admin turns it on. */
export const itemEntry = (id: string): ShopEntry => shopConfig.items[id] ?? { on: false, price: DEFAULT_ITEM_PRICE };

function apply(raw: Partial<ShopConfig> | null): void {
  shopConfig.clothing = raw?.clothing ?? {};
  shopConfig.emotes = raw?.emotes ?? {};
  shopConfig.items = raw?.items ?? {};
  shopConfig.music = raw?.music ?? {};
  applyClothingConfig(shopConfig.clothing);
  setEmoteOverrides(shopConfig.emotes);
  listeners.forEach((l) => l());
}

/** Starts listening to the settings. Resolves once the first copy has arrived, so the shop never flashes the wrong prices. */
export function watchShopConfig(): { ready: Promise<void>; stop: Unsubscribe } {
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  const stop = onValue(
    ref(db, "config/shop"),
    (snap) => {
      apply(snap.exists() ? (snap.val() as Partial<ShopConfig>) : null);
      resolve();
    },
    () => resolve() // if it can't be read, carry on with the defaults
  );
  return { ready, stop };
}

export function onShopConfig(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---- admin writes (the database rules only let the admin account do these) --------------------
export function saveShopEntry(section: ShopSection, key: string, entry: ShopEntry): Promise<void> {
  return set(ref(db, `config/shop/${section}/${key}`), { on: !!entry.on, price: Math.max(0, Math.min(999, Math.round(entry.price))) });
}
/** "Clear the shop": nothing is on sale any more (clothing default off, every entry switched off). Prices are kept so items can be turned back on. */
export async function clearShop(emotes: Array<{ id: string; price: number }>): Promise<void> {
  const updates: Record<string, unknown> = { "clothing/_default": { on: false, price: 0 } };
  for (const [section, entries] of Object.entries(shopConfig) as Array<[ShopSection, Record<string, ShopEntry>]>) {
    for (const [key, e] of Object.entries(entries)) if (e.on && key !== "_default") updates[`${section}/${key}`] = { on: false, price: e.price };
  }
  for (const e of emotes) if (shopConfig.emotes[e.id]?.on !== false) updates[`emotes/${e.id}`] = { on: false, price: shopConfig.emotes[e.id]?.price ?? e.price };
  updates["music/pass"] = { on: false, price: shopConfig.music.pass?.price ?? MUSIC_ACCESS_PRICE };
  await update(ref(db, "config/shop"), updates);
}

/** Back to how the shop started: everything the admin changed is forgotten. */
export function resetShop(): Promise<void> {
  return remove(ref(db, "config/shop"));
}

export function clearShopEntry(section: ShopSection, key: string): Promise<void> {
  return remove(ref(db, `config/shop/${section}/${key}`));
}
