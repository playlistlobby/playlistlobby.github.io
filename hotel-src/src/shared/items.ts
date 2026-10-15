// Pure item data and rules shared by the browser and the server (src/items.ts adds the pictures and texts on top).
// Nothing here may import the browser, Firebase or anything with a picture in it.
import { furniPrice } from "./furniture";

/** every ordinary item (furniture pieces are items too, with ids "f_..." / "x_...") */
export const ITEM_ID_LIST = [
  "weedseed", "weed", "mix", "jointpaper", "bluntwrap", "joint", "blunt", "wateringcan", "wateringcan_full",
  "burger", "pill", "syringe", "cd", "cigarette", "cigbutt", "lighter", "knife",
  // the mixer's results, and the joints and blunts rolled from them
  "midweed", "thca", "researchchem",
  "joint_mid", "joint_thca", "joint_chem", "blunt_mid", "blunt_thca", "blunt_chem",
  // kodimagnyl (vending machine, the bins), and what is made from it: the lean ("codeine") and the super pill
  "kodimagnyl", "codeine", "superpill",
  // shrooms (grown from spores found in the bins) let you into any room; a shroom pressed into a pill is DMT
  "shroomspore", "shroom", "dmt",
  // the mystery CDs (yellow, green, blue) and the full album (red), bought with real money from the record player in the shop
  "cd_yellow", "cd_green", "cd_blue", "cd_album",
  // hash (ass weed + kodimagnyl), hash mix (hash + cigarette) and the hash joint (hash mix + joint paper)
  "hash", "hashmix", "joint_hash",
  // tobacco (2 cigarette butts) and the cigar (tobacco rolled in blunt paper)
  "tobacco", "cigar",
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
export const NO_DROP: ReadonlySet<string> = new Set(["knife", "cd_yellow", "cd_green", "cd_blue", "cd_album"]); // (the CDs bought with real money stay with the one who bought them)

/** First slot holding `item`. Items that are loaned out (inPlayer) don't count as available. */
export const findSlot = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item && !s.inPlayer);
/** Same, but counts loaned-out copies too (for "do I own one at all"). */
export const findSlotAny = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item);

/** What 6ixty sells, in shelf order. The admin can still switch an item off or change its price (Admin > Shop > Items). */
export const SIXTY_STOCK = ["cigarette", "pill", "kodimagnyl"];
export const DEFAULT_ITEM_PRICE = 5;
/** Default shop entry for items that start on sale (everything else starts off). */
export const ITEM_DEFAULTS: Record<string, { on: boolean; price: number }> = {
  cigarette: { on: true, price: 2 },
  pill: { on: true, price: 3 },
  cd: { on: true, price: 2 }, // the Freakme CD, sold at the record player in the shop: one per player, once (see buyRecord)
  kodimagnyl: { on: true, price: 4 }, // sold by 6ixty (the growing kit moved to the vending machine)
  // sold in the shop room's vending machine (not by 6ixty): the admin can still change these prices
  lighter: { on: false, price: 2 },
  jointpaper: { on: false, price: 1 },
  bluntwrap: { on: false, price: 2 },
  wateringcan: { on: false, price: 2 },
};
/** What the vending machine in the shop room sells. */
export const VENDING_STOCK: Array<{ id: string; item: string; qty: number; label: string; fixedPrice?: number }> = [
  { id: "lighter", item: "lighter", qty: 1, label: "Lighter" },
  { id: "jointpaper", item: "jointpaper", qty: 1, label: "Joint paper" },
  { id: "bluntwrap", item: "bluntwrap", qty: 1, label: "Blunt wrap" },
  { id: "wateringcan", item: "wateringcan", qty: 1, label: "Watering can" },
  { id: "mixer", item: "f_mixer", qty: 1, label: "Mixer", fixedPrice: 10 },
  { id: "planter", item: "f_planter", qty: 1, label: "Growing kit", fixedPrice: 6 },
];
/**
 * Things you can light, and what finishing one does: for a while, a stab is worth more blood.
 * `kind` is how it looks in the mouth (cigarette / joint / blunt); `speedMs` = you walk twice as fast for that long; `chemMs` = you flash and smoke
 * pours off you for that long.
 */
export interface SmokeDef { mult: number; boostMs: number; kind: "cigarette" | "joint" | "blunt" | "hashjoint"; speedMs?: number; chemMs?: number; /** how long it burns before the effect starts (default SMOKE_MS) */ smokeMs?: number }
export const SMOKABLE: Record<string, SmokeDef> = {
  cigarette: { mult: 2, boostMs: 120_000, kind: "cigarette" },
  cigar: { mult: 2, boostMs: 120_000, kind: "blunt" }, // a cigar smokes like a cigarette (and looks like a little blunt)
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
  // hash: the same stab bonus as a joint, and hearts float over your head while you smoke it
  joint_hash: { mult: 3, boostMs: 120_000, kind: "hashjoint" },
  blunt_chem: { mult: 2, boostMs: 90_000, kind: "blunt", speedMs: 90_000, chemMs: 90_000, smokeMs: 5_000 },
};
/** Items that pile up in one slot (everything else gets a slot of its own). */
export const STACKABLE: ReadonlySet<string> = new Set(["cigarette", "jointpaper", "bluntwrap", "weedseed", "weed", "mix", "midweed", "thca", "researchchem", "kodimagnyl", "shroomspore", "shroom", "hash", "hashmix", "cigbutt", "tobacco"]);
/** Weed grows for 20 minutes, shrooms for 25. The water bar runs dry after 5: water it once, any time while it grows (even before the bar is empty), or the harvest turns out poor. */
export const GROW_MS = 20 * 60_000;
export const GROW_MS_SHROOM = 25 * 60_000;
/** how long what is planted takes to grow */
export const growMsOf = (crop?: string): number => (crop === "shroom" ? GROW_MS_SHROOM : GROW_MS);
export const WATER_MS = 5 * 60_000;
export const SMOKE_MS = 60_000;
/** How long this smokable burns before it's finished. */
export const smokeMsOf = (item: string): number => SMOKABLE[item]?.smokeMs ?? SMOKE_MS;

/** A drop of blood is the hotel's currency. */
export const START_BLOOD = 0; // you start with nothing: the first stab (in the introduction) pays your first 5 drops
export const MUSIC_ACCESS_KEY = "access_music";
export const MUSIC_ACCESS_PRICE = 4;

/** Everything you can roll: good weed, and what the mixer makes from it. */
export const ROLLABLE: ReadonlySet<string> = new Set(["weed", "mix", "midweed", "thca", "researchchem", "hashmix"]);

/** What a rolled joint / blunt is called, by what went into it. (Good weed and weed mix both make the plain one.) */
const ROLL_SUFFIX: Record<string, string> = { weed: "", mix: "", midweed: "_mid", thca: "_thca", researchchem: "_chem", hashmix: "_hash" };

/** Rolling, in the pocket: weed (or mix, mid weed, thc-a, research chemical) + joint paper or a blunt wrap. The order you clicked them in doesn't matter. Null if they don't go together. */
export function combine(a: InvItem, b: InvItem): { give: InvItem; note: string; back?: InvItem } | null {
  // tobacco rolls in joint paper to a cigarette, and in blunt paper to a cigar
  const tob = [a, b].find((x) => x.item === "tobacco"), paper = [a, b].find((x) => x.item === "jointpaper" || x.item === "bluntwrap");
  if (tob && paper && tob !== paper) return paper.item === "jointpaper" ? { give: { item: "cigarette", qty: 1 }, note: "You roll a cigarette." } : { give: { item: "cigar", qty: 1 }, note: "You roll a cigar." };
  const w = [a, b].find((x) => ROLLABLE.has(x.item));
  const o = w === a ? b : w === b ? a : undefined;
  if (!w || !o || w === o) return null;
  const ass = w.ass && w.item === "weed" ? { ass: true as const } : {};
  const suffix = ROLL_SUFFIX[w.item] ?? "";
  if (o.item === "jointpaper") return { give: { item: `joint${suffix}`, qty: 1, ...ass }, note: "You roll a joint." };
  if (o.item === "bluntwrap" && w.item !== "hashmix") return { give: { item: `blunt${suffix}`, qty: 1, ...ass }, note: "You roll a blunt." };
  return null;
}

/** The mixer: two things in, something new out. One of each goes in; the result is how many come out. The order doesn't matter. */
export interface MixRecipe { a: { item: string; ass?: boolean }; b: { item: string; ass?: boolean }; give: InvItem; note: string; /** something that comes straight back to you (the emptied watering can) */ back?: InvItem; /** how long it takes in the mixer (default MIX_MS, 10 minutes) */ ms?: number }
export const MIX_RECIPES: MixRecipe[] = [
  { a: { item: "weed" }, b: { item: "cigarette" }, give: { item: "mix", qty: 2 }, note: "You crumble the weed into the tobacco: 2 weed mix." },
  { a: { item: "weed" }, b: { item: "weed", ass: true }, give: { item: "midweed", qty: 2 }, note: "Good weed and bad weed, mixed up: 2 mid weed." },
  { a: { item: "pill" }, b: { item: "weed" }, give: { item: "thca", qty: 1 }, note: "The pill dissolves into the weed: 1 thc-a." },
  { a: { item: "pill" }, b: { item: "cigarette" }, give: { item: "researchchem", qty: 1 }, note: "You grind the pill into the tobacco: 1 research chemical." },
  { a: { item: "pill" }, b: { item: "kodimagnyl" }, give: { item: "superpill", qty: 1 }, note: "Two pills, pressed into one: 1 fentanyl." },
  { a: { item: "weed", ass: true }, b: { item: "kodimagnyl" }, give: { item: "hash", qty: 1 }, note: "Ass weed and kodimagnyl, pressed together: 1 hash." },
  { a: { item: "hash" }, b: { item: "cigarette" }, give: { item: "hashmix", qty: 2 }, note: "You crumble the hash into the tobacco: 2 hash mix." },
  { a: { item: "shroom" }, b: { item: "pill" }, give: { item: "dmt", qty: 1 }, note: "The shroom dissolves into the pill, which turns yellow: 1 DMT." },
  // the lean also works in the mixer: kodimagnyl + a full watering can (the can comes straight back, empty)
  { a: { item: "kodimagnyl" }, b: { item: "wateringcan_full" }, give: { item: "codeine", qty: 1 }, back: { item: "wateringcan", qty: 1 }, note: "You crush the kodimagnyl into the water. It turns purple: codeine. The can is empty again." },
];
// tobacco and the cigar mix exactly like a cigarette
for (const r of [...MIX_RECIPES]) if (r.b.item === "cigarette") for (const smoke of ["tobacco", "cigar"]) MIX_RECIPES.push({ ...r, b: { item: smoke } });
// two cigarette butts, picked apart, make tobacco (both from the same stack is fine)
MIX_RECIPES.push({ a: { item: "cigbutt" }, b: { item: "cigbutt" }, give: { item: "tobacco", qty: 1 }, note: "Two cigarette butts, picked apart: 1 tobacco." });
/** Minutes in the mixer, by what comes out: the dearer the result (and the more mixed things went into it), the longer it takes. 10 to 30. */
export const MIX_MINUTES: Record<string, number> = { tobacco: 10, mix: 10, midweed: 12, researchchem: 12, thca: 14, hash: 16, superpill: 18, hashmix: 22, dmt: 26, codeine: 30 };
for (const r of MIX_RECIPES) r.ms = (MIX_MINUTES[r.give.item] ?? 10) * 60_000;
const matches = (it: InvItem, m: { item: string; ass?: boolean }): boolean => it.item === m.item && !it.lit && !it.inPlayer && !!it.ass === !!m.ass;
export function mixRecipe(x: InvItem, y: InvItem): MixRecipe | null {
  return MIX_RECIPES.find((r) => (matches(x, r.a) && matches(y, r.b)) || (matches(y, r.a) && matches(x, r.b))) ?? null;
}
/** Things 6ixty only buys in bundles: the price of one of these is for the whole bundle (2 cigarette butts = 1 drop, 2 pills = 3 drops). */
export const SELL_BUNDLE: Record<string, number> = { cigbutt: 2, cigarette: 2, pill: 2 };

/** What he will never buy: the tools of the trade (the mixer, the growing kit, rolling paper, the watering cans and the knife) and the CDs bought with real money. */
export const NEVER_BOUGHT: ReadonlySet<string> = new Set([
  "f_mixer", "f_planter", "jointpaper", "bluntwrap", "wateringcan", "wateringcan_full", "knife",
  "cd_yellow", "cd_green", "cd_blue", "cd_album",
]);

/**
 * What 6ixty pays: furniture 75% of what it cost in the shop; the things that were bought for blood 50% of that; and everything you grow, mix or
 * find in the bins at a price made so that growing and mixing pay off (each step is worth more than what went into it). Null = he doesn't buy it.
 * Things in SELL_BUNDLE are paid per bundle. `furniPrices` = the admin's furniture prices (shared/furniture.ts furniPrice).
 */
export function sellPrice(item: string, ass?: boolean, furniPrices: Record<string, number> = {}): number | null {
  if (NEVER_BOUGHT.has(item)) return null;
  if (/^[fx]_/.test(item)) return Math.max(1, Math.floor(furniPrice(item, furniPrices) * 0.75)); // furniture: 75% of the shop price
  switch (item) {
    // bought for blood: half of it (the cigarette 1 and the pill 3 only come out whole in twos)
    case "cigarette": return 1; // per 2
    case "pill": return 3; // per 2
    case "cd": return 1; // the Freakme CD cost 2
    case "kodimagnyl": return 2; // cost 4 in the vending machine
    case "lighter": return 1; // cost 2 in the vending machine
    case "cigbutt": return 1; // per 2 butts
    case "tobacco": return 2; // from 2 butts (worth 1)
    case "cigar": return 2;
    // grown from seeds and spores (3 from each, so a seed is worth much less than what it grows into)
    case "weedseed": return 2;
    case "weed": return ass ? 4 : 6;
    case "shroomspore": return 3;
    case "shroom": return 14; // worth more than weed: 3 per kit and they open every door
    // mixed
    case "mix": return 5; // weed 6 + a cigarette -> 2
    case "midweed": return 7; // a good weed 6 + an ass weed 4 -> 2
    case "thca": return 12; // pill 3 + weed 6
    case "researchchem": return 9; // pill 3 + a cigarette
    case "hash": return 12; // ass weed 4 + kodimagnyl 4
    case "hashmix": return 8; // hash 12 + a cigarette -> 2
    case "codeine": return 8; // kodimagnyl 4 and water
    case "superpill": return 14; // pill 3 + kodimagnyl 4
    case "dmt": return 24; // shroom 14 + pill 3
    // rolled (paper 1, blunt wrap 2)
    case "joint": return 9;
    case "blunt": return 11;
    case "joint_mid": return 10;
    case "blunt_mid": return 12;
    case "joint_thca": return 15;
    case "blunt_thca": return 17;
    case "joint_chem": return 13;
    case "blunt_chem": return 15;
    case "joint_hash": return 13;
    case "syringe": return 1;
    default: return null;
  }
}
