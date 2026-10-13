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
  /** used on yourself with one click (the syringe, a cigarette) */
  useSelf?: "syringe" | "smoke";
  /** can be dropped from the inventory (right-click > Drop) */
  droppable?: boolean;
  /** select the knife, then click this: it can be cut open for blood (the dead cat) */
  carvable?: boolean;
  /** picture while it's lit (the cigarette: the plain icon is the unlit one) */
  litIcon?: string;
}

/** What 6ixty sells, in shelf order. The admin can still switch an item off or change its price (Admin > Shop > Items). */
export const SIXTY_STOCK = ["lockpick", "cigarette"];
/** Default shop entry for items that start on sale (everything else starts off). */
export const ITEM_DEFAULTS: Record<string, { on: boolean; price: number }> = {
  lockpick: { on: true, price: 4 },
  cigarette: { on: true, price: 1 },
};
export const SMOKE_MS = 60_000;

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
    examine: "A scratched CD with a handwritten label. Use it on the CD player in the basement so everyone can hear it. It comes back when it's done.",
    icon: assetUrl("items/cd.svg"),
    useOnObject: "cdplayer",
  },
  lockpick: {
    id: "lockpick",
    name: "Lockpick",
    examine: "A bent piece of wire. It works once: it lets you into the room of someone who isn't your friend. Use it from the door menu.",
    icon: assetUrl("items/lockpick.svg"),
  },
  cigarette: {
    id: "cigarette",
    name: "Cigarette",
    examine: "A cigarette. Click it to light up: you hold it and smoke for a minute, then it's only a butt.",
    icon: assetUrl("items/cigarette.svg"),
    litIcon: assetUrl("items/cigarette-lit.svg"),
    useSelf: "smoke",
  },
  cigbutt: {
    id: "cigbutt",
    name: "Cigarette butt",
    examine: "What's left. Right-click it to drop it.",
    icon: assetUrl("items/cigbutt.svg"),
    droppable: true,
  },
  lighter: {
    id: "lighter",
    name: "Lighter",
    examine: "A cheap red lighter. It still works. It doesn't do anything yet, but everyone has one.",
    icon: assetUrl("items/lighter.svg"),
  },
  deadcat: {
    id: "deadcat",
    name: "Dead cat",
    examine: "Somebody threw it out. Its blood hasn't all gone cold yet. Select your knife, then click the cat.",
    icon: assetUrl("items/deadcat.svg"),
    carvable: true,
  },
  knife: {
    id: "knife",
    name: "Knife",
    examine: "A small, sharp knife. Use it on another player: you can stab each person once a day, and every stab draws a drop of blood.",
    icon: assetUrl("items/knife.png"), // Habbo's survival knife (catalog icon of survival_c26_knife.nitro), as crisp pixels
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
  /** a lit cigarette: when it was lit (server time, ms) */
  lit?: number;
}
export type Inventory = Array<InvItem | null>;

export const emptyInventory = (): Inventory => Array.from({ length: INV_SIZE }, () => null);

/** Items that exist in the code but are switched off for now: nobody gets one and any already held are hidden (the data stays, so turning one back on restores it). */
export const DISABLED_ITEMS = new Set(["cd"]);

/** RTDB stores sparse arrays as objects (or arrays); normalise to a fixed 28-slot array. */
export function parseInventory(raw: unknown): Inventory {
  const inv = emptyInventory();
  if (!raw || typeof raw !== "object") return inv;
  for (const [k, v] of Object.entries(raw as Record<string, InvItem | null>)) {
    const slot = Number(k);
    if (v && slot >= 0 && slot < INV_SIZE && ITEMS[v.item] && !DISABLED_ITEMS.has(v.item)) inv[slot] = { item: v.item, qty: v.qty ?? 1, ...(v.inPlayer ? { inPlayer: true } : {}), ...(typeof v.lit === "number" ? { lit: v.lit } : {}) };
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
