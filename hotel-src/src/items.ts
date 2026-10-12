import { assetUrl } from "./assetUrl";

// Old-school-RuneScape-style items. Inventory slots hold an item id + quantity.
export interface ItemDef {
  id: string;
  name: string;
  examine: string;
  icon: string;
  /** what "Use" does when this item is selected and you click a player */
  useOnPlayer?: "stab";
  /** furniture kind this item can be used on (e.g. a CD on the CD player) */
  useOnObject?: string;
  /** used on yourself with one click (the syringe) */
  useSelf?: "syringe";
}

export const ITEMS: Record<string, ItemDef> = {
  syringe: {
    id: "syringe",
    name: "Syringe",
    examine: "A clean syringe. Click it to draw blood from yourself: 2 drops of blood, once a day.",
    icon: assetUrl("items/syringe.svg"),
    useSelf: "syringe",
  },
  cd: {
    id: "cd",
    name: "CD",
    examine: "A scratched CD with a handwritten label. Use it on the CD player in the lobby so everyone can hear it. It comes back when it's done.",
    icon: assetUrl("items/cd.svg"),
    useOnObject: "cdplayer",
  },
  knife: {
    id: "knife",
    name: "Knife",
    examine: "A small, sharp knife. Use it on another player: you can stab each person once a day, and every stab draws a drop of blood.",
    icon: assetUrl("items/knife.svg"),
    useOnPlayer: "stab",
  },
};

export const INV_SIZE = 28; // 4 columns x 7 rows, like the real thing
export const INV_COLS = 4;

export interface InvItem {
  item: string;
  qty: number;
  /** true while the item is loaned out (a CD sitting in the CD player); it can't be used until it's back */
  inPlayer?: boolean;
}
export type Inventory = Array<InvItem | null>;

export const emptyInventory = (): Inventory => Array.from({ length: INV_SIZE }, () => null);

/** RTDB stores sparse arrays as objects (or arrays); normalise to a fixed 28-slot array. */
export function parseInventory(raw: unknown): Inventory {
  const inv = emptyInventory();
  if (!raw || typeof raw !== "object") return inv;
  for (const [k, v] of Object.entries(raw as Record<string, InvItem | null>)) {
    const slot = Number(k);
    if (v && slot >= 0 && slot < INV_SIZE && ITEMS[v.item]) inv[slot] = { item: v.item, qty: v.qty ?? 1, ...(v.inPlayer ? { inPlayer: true } : {}) };
  }
  return inv;
}

/** First slot holding `item`. Items that are loaned out (inPlayer) don't count as available. */
export const findSlot = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item && !s.inPlayer);
/** Same, but counts loaned-out copies too (for "do I own one at all"). */
export const findSlotAny = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item);

/** A drop of blood is the hotel's currency. */
export const BLOOD_ICON = assetUrl("items/blood.svg");
export const START_BLOOD = 5; // welcome gift so the shop is usable before your first stab
export const MUSIC_ACCESS_KEY = "access_music";
export const MUSIC_ACCESS_PRICE = 4;
