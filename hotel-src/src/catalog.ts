import { imager, avatarsReady } from "./avatarService";

export type Gender = "M" | "F";

export interface Slot {
  id: string;
  label: string;
  /** true = render the thumbnail as head only */
  headOnly: boolean;
  /** required slots can't be removed */
  required: boolean;
}

// Order matters: this is also the order parts appear in the figure string.
export const SLOTS: Slot[] = [
  { id: "hd", label: "Face & skin", headOnly: true, required: true },
  { id: "hr", label: "Hair", headOnly: true, required: false },
  { id: "ha", label: "Hats", headOnly: true, required: false },
  { id: "he", label: "Head items", headOnly: true, required: false },
  { id: "ea", label: "Glasses", headOnly: true, required: false },
  { id: "fa", label: "Face items", headOnly: true, required: false },
  { id: "ch", label: "Shirts", headOnly: false, required: false },
  { id: "cc", label: "Jackets", headOnly: false, required: false },
  { id: "cp", label: "Prints", headOnly: false, required: false },
  { id: "ca", label: "Chest items", headOnly: false, required: false },
  { id: "lg", label: "Trousers", headOnly: false, required: false },
  { id: "sh", label: "Shoes", headOnly: false, required: false },
  { id: "wa", label: "Belts", headOnly: false, required: false },
];

export interface Item {
  type: string;
  id: string;
  gender: "M" | "F" | "U";
  /** how many colors this item takes (0 = not colorable) */
  colors: number;
  /** what it costs right now in drops of blood (0 = free, everyone owns it). The admin can change this. */
  price: number;
  key: string;
  /** the price before any admin changes */
  basePrice: number;
  /** free starter item (the default look and the data's "preselectable" sets): not for sale, everyone owns it */
  starter: boolean;
  /** sold in the shop right now (the admin decides) */
  shopOn: boolean;
  /** made in the admin's Studio (not part of the original avatar data) */
  custom?: boolean;
}

export interface Swatch {
  id: string;
  hex: string;
}

export interface FigurePart {
  id: string;
  colors: string[];
}
export type Parts = Record<string, FigurePart | undefined>;

export const DEFAULT_FIGURE: Record<Gender, string> = {
  M: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62",
  F: "hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68",
};

// Prices below are in drops of blood. Raw values are scaled down in loadCatalog().
const BASE_PRICE: Record<string, number> = {
  hd: 20, hr: 40, ha: 60, he: 45, ea: 45, fa: 40, ch: 50, cc: 70, cp: 40, ca: 55, lg: 45, sh: 35, wa: 50,
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function itemKey(type: string, id: string): string {
  return `${type}_${id}`;
}

let items: Record<string, Item[]> | null = null;
const swatches: Record<string, Swatch[]> = {};

/** Builds the catalog from the figuredata.json that the avatar imager loads. */
export async function loadCatalog(): Promise<void> {
  await avatarsReady;
  if (items) return;
  const fd = imager.figuredata;
  items = {};
  // Whatever a brand-new character wears is free, on top of the figuredata's own "preselectable" starters.
  const defaultKeys = new Set(
    Object.values(DEFAULT_FIGURE).flatMap((f) => Object.entries(parseFigure(f)).map(([type, p]) => itemKey(type, p!.id)))
  );
  for (const slot of SLOTS) {
    const settype = fd.settype[slot.id];
    if (!settype) {
      items[slot.id] = [];
      continue;
    }
    const list: Item[] = [];
    for (const [id, set] of Object.entries<any>(settype.set)) {
      if (!set.selectable || set.club > 0) continue;
      const colors = Math.max(0, ...set.part.map((p: any) => p.colorindex || 0));
      const key = itemKey(slot.id, id);
      const starter = !!set.preselectable || defaultKeys.has(key);
      // Drops are scarce (one a day), so clothes cost 1-4 of them.
      const price = starter ? 0 : Math.max(1, Math.round((BASE_PRICE[slot.id] + (hash(slot.id + id) % 6) * 10) / 25));
      list.push({ type: slot.id, id, gender: set.gender, colors, price, key, basePrice: price, starter, shopOn: !starter });
    }
    list.sort((a, b) => a.price - b.price || Number(a.id) - Number(b.id));
    items[slot.id] = list;

    const palette = fd.palette[settype.paletteid] ?? {};
    swatches[slot.id] = Object.entries<any>(palette)
      .filter(([, c]) => c.club === 0 && c.selectable)
      .sort((a, b) => a[1].index - b[1].index)
      .map(([cid, c]) => ({ id: cid, hex: c.color }));
  }
}

/** Replaces the Studio-made items in the catalog (call after the registered designs change, then applyClothingConfig again). */
export function setCustomItems(defs: Array<{ slot: string; id: string; gender: "M" | "F" | "U"; colors: number }>): void {
  if (!items) return;
  for (const slot of Object.keys(items)) items[slot] = items[slot].filter((i) => !i.custom);
  for (const d of defs) {
    if (!items[d.slot]) continue;
    // free for everyone until the admin puts a price on it (see applyClothingConfig)
    items[d.slot].unshift({ type: d.slot, id: d.id, gender: d.gender, colors: d.colors, price: 0, key: itemKey(d.slot, d.id), basePrice: 0, starter: true, shopOn: false, custom: true });
  }
}

/** Applies the admin's shop settings (config/shop/clothing) to the catalog. Starter items are never changed. */
export function applyClothingConfig(cfg: Record<string, { on: boolean; price: number }>): void {
  for (const list of Object.values(items ?? {})) {
    for (const it of list) {
      if (it.custom) {
        // Studio items: no entry = free for everyone; an entry sets the price, and "on" decides whether it's for sale
        const e = cfg[it.key];
        it.price = e ? e.price : 0;
        it.starter = it.price === 0;
        it.shopOn = !!e && e.on && e.price > 0;
        continue;
      }
      if (it.starter) continue;
      const e = cfg[it.key];
      it.price = e ? e.price : it.basePrice;
      // "_default" is the admin's switch for everything without its own entry ("Clear the shop" turns it off)
      it.shopOn = e ? e.on : cfg._default ? cfg._default.on : true;
    }
  }
}

/** Every clothing item, grouped by slot (for the admin panel). */
export function allItemsBySlot(): Record<string, Item[]> {
  return items ?? {};
}

export function itemsFor(slot: string, gender: Gender): Item[] {
  return (items?.[slot] ?? []).filter((i) => i.gender === "U" || i.gender === gender);
}

export function swatchesFor(slot: string): Swatch[] {
  return swatches[slot] ?? [];
}

export function findItem(type: string, id: string): Item | undefined {
  return items?.[type]?.find((i) => i.id === id);
}

export function isOwned(item: Item, owned: Record<string, true>): boolean {
  return item.price === 0 || !!owned[item.key];
}

export function parseFigure(figure: string): Parts {
  const parts: Parts = {};
  for (const chunk of figure.split(".")) {
    const [type, id, ...colors] = chunk.split("-");
    if (type && id) parts[type] = { id, colors };
  }
  return parts;
}

export function figureToString(parts: Parts): string {
  return SLOTS.filter((s) => parts[s.id])
    .map((s) => [s.id, parts[s.id]!.id, ...parts[s.id]!.colors].join("-"))
    .join(".");
}

/** Picks colors for a newly selected item, keeping the previous item's colors where possible. */
export function defaultColors(item: Item, previous?: FigurePart): string[] {
  const sw = swatchesFor(item.type);
  const out: string[] = [];
  for (let i = 0; i < item.colors; i++) {
    const prev = previous?.colors[i];
    out.push(prev && sw.some((s) => s.id === prev) ? prev : sw[Math.min(i * 3, sw.length - 1)]?.id ?? "1");
  }
  return out;
}

/** How often a random look wears an optional slot (hair almost always, hats and glasses now and then). */
const RANDOM_CHANCE: Record<string, number> = { ch: 1, lg: 1, sh: 1, hr: 0.95, ha: 0.2, ea: 0.2, fa: 0.15, he: 0, cc: 0, cp: 0, ca: 0, wa: 0 };

/** A random look built only from free items (what everybody owns), in random colours. Used by the first-run avatar picker. */
export function randomFigure(gender: Gender): string {
  const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
  const parts: Parts = {};
  const defaults = parseFigure(DEFAULT_FIGURE[gender]);
  for (const slot of SLOTS) {
    const free = itemsFor(slot.id, gender).filter((i) => i.price === 0);
    if (!slot.required && Math.random() >= (RANDOM_CHANCE[slot.id] ?? 0)) continue;
    const item = free.length ? pick(free) : undefined;
    if (!item) {
      if (slot.required && defaults[slot.id]) parts[slot.id] = defaults[slot.id];
      continue;
    }
    const sw = swatchesFor(slot.id);
    parts[slot.id] = { id: item.id, colors: Array.from({ length: item.colors }, () => pick(sw)?.id ?? "1") };
  }
  return figureToString(parts);
}

/** Every item in a figure that costs coins and is not owned. Used to block wearing/saving unowned clothes. */
export function unownedItems(parts: Parts, owned: Record<string, true>): Item[] {
  const out: Item[] = [];
  for (const [type, part] of Object.entries(parts)) {
    if (!part) continue;
    const item = findItem(type, part.id);
    if (item && !isOwned(item, owned)) out.push(item);
  }
  return out;
}
