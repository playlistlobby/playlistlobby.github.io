// Pure item data and rules shared by the browser and the server (src/items.ts adds the pictures and texts on top).
// Nothing here may import the browser, Firebase or anything with a picture in it.

/** every ordinary item (furniture pieces are items too, with ids "f_..." / "x_...") */
export const ITEM_ID_LIST = [
  "weedseed", "weed", "mix", "jointpaper", "bluntwrap", "joint", "blunt", "wateringcan", "wateringcan_full",
  "burger", "pill", "syringe", "cd", "cigarette", "cigbutt", "lighter", "deadcat", "knife",
  // the mixer's results, and the joints and blunts rolled from them
  "midweed", "thca", "researchchem",
  "joint_mid", "joint_thca", "joint_chem", "blunt_mid", "blunt_thca", "blunt_chem",
  // kodimagnyl (vending machine, the bins), and what is made from it: the lean ("codeine") and the super pill
  "kodimagnyl", "codeine", "superpill",
  // shrooms (grown from spores found in the bins) let you into any room; a shroom pressed into a pill is DMT
  "shroomspore", "shroom", "dmt",
] as const;
export type ItemId = (typeof ITEM_ID_LIST)[number];
export const ITEM_IDS: ReadonlySet<string> = new Set(ITEM_ID_LIST);

export const INV_SIZE = 28; // 4 columns x 7 rows, like the real thing
export const INV_COLS = 4;

export interface InvItem {
  item: string;
  qty: number;
  /** set while the item is loaned out (a CD playing in a boombox / the CD player): the id of the room it plays in (true in old saves). It can't be used until it's back */
  inPlayer?: boolean | string;
  /** a lit cigarette, joint or blunt: when it was lit (server time, ms) */
  lit?: number;
  /** bad weed ("ass weed", from a plant that ran dry): passes on to what you roll from it */
  ass?: boolean;
}
export type Inventory = Array<InvItem | null>;

export const emptyInventory = (): Inventory => Array.from({ length: INV_SIZE }, () => null);

/** Items that exist in the code but are switched off for now: nobody gets one and any already held are hidden (the data stays, so turning one back on restores it). */
export const DISABLED_ITEMS: ReadonlySet<string> = new Set(["burger"]);

/** Furniture is an inventory item too: its id is the furniture kind's id ("f_sofa" for pieces that ship with the game, "x_..." for Studio pieces). */
export const isFurniItem = (id: string): boolean => /^[fx]_[a-z0-9_]{1,30}$/.test(id);

/** RTDB stores sparse arrays as objects (or arrays); normalise to a fixed 28-slot array. `valid` says which item ids exist. */
export function parseInventoryWith(raw: unknown, valid: (id: string) => boolean): Inventory {
  const inv = emptyInventory();
  if (!raw || typeof raw !== "object") return inv;
  for (const [k, v] of Object.entries(raw as Record<string, InvItem | null>)) {
    const slot = Number(k);
    if (v && slot >= 0 && slot < INV_SIZE && valid(v.item) && !DISABLED_ITEMS.has(v.item)) {
      inv[slot] = { item: v.item, qty: v.qty ?? 1, ...(v.inPlayer ? { inPlayer: typeof v.inPlayer === "string" ? v.inPlayer : true } : {}), ...(typeof v.lit === "number" ? { lit: v.lit } : {}), ...(v.ass ? { ass: true } : {}) };
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
export const SIXTY_STOCK = ["cigarette", "cd", "pill", "f_planter"];
export const DEFAULT_ITEM_PRICE = 5;
/** Default shop entry for items that start on sale (everything else starts off). */
export const ITEM_DEFAULTS: Record<string, { on: boolean; price: number }> = {
  cigarette: { on: true, price: 1 },
  pill: { on: true, price: 3 },
  cd: { on: true, price: 1 }, // one per player, once (see buySixty)
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
  { id: "mixer", item: "f_mixer", qty: 1, label: "Mixer", fixedPrice: 10 },
  { id: "kodimagnyl", item: "kodimagnyl", qty: 1, label: "Kodimagnyl", fixedPrice: 4 },
];
/**
 * Things you can light, and what finishing one does: for a while, a stab is worth more blood.
 * `kind` is how it looks in the mouth (cigarette / joint / blunt); `speedMs` = you walk twice as fast for that long; `chemMs` = you flash and smoke
 * pours off you for that long.
 */
export interface SmokeDef { mult: number; boostMs: number; kind: "cigarette" | "joint" | "blunt"; speedMs?: number; chemMs?: number; /** how long it burns before the effect starts (default SMOKE_MS) */ smokeMs?: number }
export const SMOKABLE: Record<string, SmokeDef> = {
  cigarette: { mult: 2, boostMs: 120_000, kind: "cigarette" },
  joint: { mult: 3, boostMs: 120_000, kind: "joint" },
  blunt: { mult: 4, boostMs: 180_000, kind: "blunt" },
  // mid weed: a milder smoke than the real thing
  joint_mid: { mult: 2, boostMs: 120_000, kind: "joint" },
  blunt_mid: { mult: 2, boostMs: 120_000, kind: "blunt" },
  // thc-a: walk twice as fast and stab for double blood, both for 2 minutes
  joint_thca: { mult: 2, boostMs: 120_000, kind: "joint", speedMs: 120_000 },
  blunt_thca: { mult: 2, boostMs: 120_000, kind: "blunt", speedMs: 120_000 },
  // research chemical: it only burns for 5 seconds, then for a minute and a half you walk twice as fast, stab for double blood, flash and smoke pours off you
  joint_chem: { mult: 2, boostMs: 90_000, kind: "joint", speedMs: 90_000, chemMs: 90_000, smokeMs: 5_000 },
  blunt_chem: { mult: 2, boostMs: 90_000, kind: "blunt", speedMs: 90_000, chemMs: 90_000, smokeMs: 5_000 },
};
/** Items that pile up in one slot (everything else gets a slot of its own). */
export const STACKABLE: ReadonlySet<string> = new Set(["cigarette", "jointpaper", "bluntwrap", "weedseed", "weed", "mix", "midweed", "thca", "researchchem", "kodimagnyl", "shroomspore", "shroom"]);
/** A plant grows for 20 minutes. It gets thirsty after 5: water it once after that (and only then) or the weed turns out ass. */
export const GROW_MS = 20 * 60_000;
export const WATER_MS = 5 * 60_000;
export const SMOKE_MS = 60_000;
/** How long this smokable burns before it's finished. */
export const smokeMsOf = (item: string): number => SMOKABLE[item]?.smokeMs ?? SMOKE_MS;

/** A drop of blood is the hotel's currency. */
export const START_BLOOD = 0; // you start with nothing: the first stab (in the introduction) pays your first 5 drops
export const MUSIC_ACCESS_KEY = "access_music";
export const MUSIC_ACCESS_PRICE = 4;

/** Everything you can roll: good weed, and what the mixer makes from it. */
export const ROLLABLE: ReadonlySet<string> = new Set(["weed", "mix", "midweed", "thca", "researchchem"]);

/** What a rolled joint / blunt is called, by what went into it. (Good weed and weed mix both make the plain one.) */
const ROLL_SUFFIX: Record<string, string> = { weed: "", mix: "", midweed: "_mid", thca: "_thca", researchchem: "_chem" };

/** Rolling, in the pocket: weed (or mix, mid weed, thc-a, research chemical) + joint paper or a blunt wrap. The order you clicked them in doesn't matter. Null if they don't go together. */
export function combine(a: InvItem, b: InvItem): { give: InvItem; note: string; back?: InvItem } | null {
  // kodimagnyl + a can of water: codeine (the lean); the can is empty afterwards and comes back to you
  const water = [a, b].find((x) => x.item === "wateringcan_full"), kodi = [a, b].find((x) => x.item === "kodimagnyl");
  if (water && kodi && water !== kodi) return { give: { item: "codeine", qty: 1 }, back: { item: "wateringcan", qty: 1 }, note: "You crush the kodimagnyl into the water. It turns purple: codeine. The can is empty again." };
  const w = [a, b].find((x) => ROLLABLE.has(x.item));
  const o = w === a ? b : w === b ? a : undefined;
  if (!w || !o || w === o) return null;
  const ass = w.ass && w.item === "weed" ? { ass: true as const } : {};
  const suffix = ROLL_SUFFIX[w.item] ?? "";
  if (o.item === "jointpaper") return { give: { item: `joint${suffix}`, qty: 1, ...ass }, note: "You roll a joint." };
  if (o.item === "bluntwrap") return { give: { item: `blunt${suffix}`, qty: 1, ...ass }, note: "You roll a blunt." };
  return null;
}

/** The mixer: two things in, something new out. One of each goes in; the result is how many come out. The order doesn't matter. */
export interface MixRecipe { a: { item: string; ass?: boolean }; b: { item: string; ass?: boolean }; give: InvItem; note: string; /** something that comes straight back to you (the emptied watering can) */ back?: InvItem }
export const MIX_RECIPES: MixRecipe[] = [
  { a: { item: "weed" }, b: { item: "cigarette" }, give: { item: "mix", qty: 2 }, note: "You crumble the weed into the tobacco: 2 weed mix." },
  { a: { item: "weed" }, b: { item: "weed", ass: true }, give: { item: "midweed", qty: 2 }, note: "Good weed and bad weed, mixed up: 2 mid weed." },
  { a: { item: "pill" }, b: { item: "weed" }, give: { item: "thca", qty: 1 }, note: "The pill dissolves into the weed: 1 thc-a." },
  { a: { item: "pill" }, b: { item: "cigarette" }, give: { item: "researchchem", qty: 1 }, note: "You grind the pill into the tobacco: 1 research chemical." },
  { a: { item: "pill" }, b: { item: "kodimagnyl" }, give: { item: "superpill", qty: 1 }, note: "Two pills, pressed into one: 1 super pill." },
  { a: { item: "shroom" }, b: { item: "pill" }, give: { item: "dmt", qty: 1 }, note: "The shroom dissolves into the pill, which turns yellow: 1 DMT." },
  // the lean also works in the mixer: kodimagnyl + a full watering can (the can comes straight back, empty)
  { a: { item: "kodimagnyl" }, b: { item: "wateringcan_full" }, give: { item: "codeine", qty: 1 }, back: { item: "wateringcan", qty: 1 }, note: "You crush the kodimagnyl into the water. It turns purple: codeine. The can is empty again." },
];
const matches = (it: InvItem, m: { item: string; ass?: boolean }): boolean => it.item === m.item && !it.lit && !it.inPlayer && !!it.ass === !!m.ass;
export function mixRecipe(x: InvItem, y: InvItem): MixRecipe | null {
  return MIX_RECIPES.find((r) => (matches(x, r.a) && matches(y, r.b)) || (matches(y, r.a) && matches(x, r.b))) ?? null;
}
/** What 6ixty pays for one piece, or null if he doesn't buy it. */
export function sellPrice(item: string, ass?: boolean): number | null {
  switch (item) {
    case "weed": return ass ? 4 : 6;
    case "weedseed": return 2;
    case "midweed": return 4;
    case "thca": return 8;
    case "researchchem": return 10;
    case "codeine": return 8;
    case "superpill": return 12;
    default: return null;
  }
}
