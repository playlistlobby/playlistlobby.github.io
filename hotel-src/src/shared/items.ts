// Pure item data and rules shared by the browser and the server (src/items.ts adds the pictures and texts on top).
// Nothing here may import the browser, Firebase or anything with a picture in it.

/** every ordinary item (furniture pieces are items too, with ids "f_..." / "x_...") */
export const ITEM_ID_LIST = [
  "weedseed", "weed", "mix", "jointpaper", "bluntwrap", "joint", "blunt", "wateringcan", "wateringcan_full",
  "burger", "pill", "syringe", "cd", "lockpick", "cigarette", "cigbutt", "lighter", "deadcat", "knife",
] as const;
export type ItemId = (typeof ITEM_ID_LIST)[number];
export const ITEM_IDS: ReadonlySet<string> = new Set(ITEM_ID_LIST);

export const INV_SIZE = 28; // 4 columns x 7 rows, like the real thing
export const INV_COLS = 4;

export interface InvItem {
  item: string;
  qty: number;
  /** true while the item is loaned out (a CD sitting in the CD player); it can't be used until it's back */
  inPlayer?: boolean;
  /** a lit cigarette, joint or blunt: when it was lit (server time, ms) */
  lit?: number;
  /** bad weed ("ass weed", from a plant that ran dry): passes on to what you roll from it */
  ass?: boolean;
}
export type Inventory = Array<InvItem | null>;

export const emptyInventory = (): Inventory => Array.from({ length: INV_SIZE }, () => null);

/** Items that exist in the code but are switched off for now: nobody gets one and any already held are hidden (the data stays, so turning one back on restores it). */
export const DISABLED_ITEMS: ReadonlySet<string> = new Set(["cd", "burger"]);

/** Furniture is an inventory item too: its id is the furniture kind's id ("f_sofa" for pieces that ship with the game, "x_..." for Studio pieces). */
export const isFurniItem = (id: string): boolean => /^[fx]_[a-z0-9_]{1,30}$/.test(id);

/** RTDB stores sparse arrays as objects (or arrays); normalise to a fixed 28-slot array. `valid` says which item ids exist. */
export function parseInventoryWith(raw: unknown, valid: (id: string) => boolean): Inventory {
  const inv = emptyInventory();
  if (!raw || typeof raw !== "object") return inv;
  for (const [k, v] of Object.entries(raw as Record<string, InvItem | null>)) {
    const slot = Number(k);
    if (v && slot >= 0 && slot < INV_SIZE && valid(v.item) && !DISABLED_ITEMS.has(v.item)) {
      inv[slot] = { item: v.item, qty: v.qty ?? 1, ...(v.inPlayer ? { inPlayer: true } : {}), ...(typeof v.lit === "number" ? { lit: v.lit } : {}), ...(v.ass ? { ass: true } : {}) };
    }
  }
  return inv;
}

/** Things that can never be put on the floor or traded (the knife stays with you). */
export const NO_DROP: ReadonlySet<string> = new Set(["knife"]);

/** First slot holding `item`. Items that are loaned out (inPlayer) don't count as available. */
export const findSlot = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item && !s.inPlayer);
/** Same, but counts loaned-out copies too (for "do I own one at all"). */
export const findSlotAny = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item);

/** What 6ixty sells, in shelf order. The admin can still switch an item off or change its price (Admin > Shop > Items). */
export const SIXTY_STOCK = ["lockpick", "cigarette", "pill", "f_planter"];
export const DEFAULT_ITEM_PRICE = 5;
/** Default shop entry for items that start on sale (everything else starts off). */
export const ITEM_DEFAULTS: Record<string, { on: boolean; price: number }> = {
  lockpick: { on: true, price: 4 },
  cigarette: { on: true, price: 1 },
  pill: { on: true, price: 3 },
  f_planter: { on: true, price: 6 }, // the growing kit
  // sold in the shop room's vending machine (not by 6ixty): the admin can still change these prices
  lighter: { on: false, price: 2 },
  jointpaper: { on: false, price: 1 },
  bluntwrap: { on: false, price: 2 },
  wateringcan: { on: false, price: 2 },
};
/** What the vending machine in the shop room sells. "cigpack" is 15 cigarettes in one go. */
export const VENDING_STOCK: Array<{ id: string; item: string; qty: number; label: string; fixedPrice?: number }> = [
  { id: "lighter", item: "lighter", qty: 1, label: "Lighter" },
  { id: "jointpaper", item: "jointpaper", qty: 1, label: "Joint paper" },
  { id: "bluntwrap", item: "bluntwrap", qty: 1, label: "Blunt wrap" },
  { id: "cigpack", item: "cigarette", qty: 15, label: "Cigarettes (15)", fixedPrice: 10 },
  { id: "wateringcan", item: "wateringcan", qty: 1, label: "Watering can" },
];
/** Things you can light, and what finishing one does: for a while, a stab is worth more blood. */
export const SMOKABLE: Record<string, { mult: number; boostMs: number }> = {
  cigarette: { mult: 2, boostMs: 120_000 },
  joint: { mult: 3, boostMs: 120_000 },
  blunt: { mult: 4, boostMs: 180_000 },
};
/** Items that pile up in one slot (everything else gets a slot of its own). */
export const STACKABLE: ReadonlySet<string> = new Set(["cigarette", "jointpaper", "bluntwrap", "weedseed", "weed", "mix"]);
/** A plant grows for 2 hours and is thirsty after 1 hour without water. */
export const GROW_MS = 2 * 3_600_000;
export const WATER_MS = 3_600_000;
export const SMOKE_MS = 60_000;

/** A drop of blood is the hotel's currency. */
export const START_BLOOD = 0; // you start with nothing: the first stab (in the introduction) pays your first 5 drops
export const MUSIC_ACCESS_KEY = "access_music";
export const MUSIC_ACCESS_PRICE = 4;

/** Two items used on each other (weed + paper = a joint, ...): what you get, or null if they don't go together. The order you clicked them in doesn't matter. */
export function combine(a: InvItem, b: InvItem): { give: InvItem; note: string } | null {
  const w = [a, b].find((x) => x.item === "weed" || x.item === "mix");
  const o = w === a ? b : w === b ? a : undefined;
  if (!w || !o || w === o) return null;
  const ass = w.ass ? { ass: true as const } : {};
  if (o.item === "jointpaper") return { give: { item: "joint", qty: 1, ...ass }, note: "You roll a joint." };
  if (o.item === "bluntwrap") return { give: { item: "blunt", qty: 1, ...ass }, note: "You roll a blunt." };
  if (o.item === "cigarette" && !o.lit && w.item === "weed") return { give: { item: "mix", qty: 2, ...ass }, note: "You crumble the weed into the cigarette: 2 mix." };
  return null;
}
