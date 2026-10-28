// Pure item data and rules shared by the browser and the server (src/items.ts adds the pictures and texts on top).
// Nothing here may import the browser, Firebase or anything with a picture in it.
import { furniPrice, SHOP_KIND_PREFIX, SHOP_PIECES } from "./furniture";
import { WOOD_PRICE } from "./mines";

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
  "shroomspore", "shroom", "weakshroom", "dmt",
  // the mystery CDs (yellow, green, blue) and the full album (red), bought with real money from the record player in the shop
  "cd", "cd_yellow", "cd_green", "cd_blue", "cd_album", "cd_ogep", "cd_blodig", "cd_lykk", "cd_roulette", "cd_dipdip",
  // hash (ass weed + kodimagnyl), hash mix (hash + cigarette) and the hash joint (hash mix + joint paper)
  "hash", "hashmix", "joint_hash",
  // chud mix (shroom + weed, rolled like weed): the chud joint and chud blunt
  "chudmix", "joint_chud", "blunt_chud",
  // troldmand mix (hash + weed) and its joint and blunt, LSD (shroom + pill), and the plain chud joint (ass weed + cigarette)
  "trollmix", "joint_troll", "blunt_troll", "lsd", "joint_chudname",
  // tobacco (2 cigarette butts) and the cigar (tobacco rolled in blunt paper)
  "tobacco", "cigar",
  // the mines: iron you mine, wood from 6ixty (or the floor), and the tools made from them
  "iron", "wood", "pickaxe", "machete",
  // the dice (pay2win machine, for blood): hold it, press Roll, and a number from 1 to 6 shows over your head
  "dice",
  // bagmand (a visiting vendor, see shared/bagmand.ts): poppy seeds grow into opium, which is mixed into the heavy stuff; his own blue weed and the special weeds you roll from them
  "poppyseed", "opium", "heroin", "ketamine", "percs", "twocb", "caliweed", "pinkweed", "brownweed", "natryger", "loudpack", "fentcn",
  "joint_cali", "blunt_cali", "joint_pink", "blunt_pink", "joint_brown", "blunt_brown", "joint_nat", "blunt_nat", "joint_loud", "blunt_loud",
  // the streets (see shared/streets.ts): the elevator ticket (one per player), and the bandage that heals 3 hit points in a knife fight
  "elevator_ticket", "bandage",
  // the loudspeaker: a message on every screen for 10 seconds, once every 6 hours (see shared/loudspeaker.ts)
  "loudspeaker",
  // the puff-bar: a vape you puff once a minute (Ducky machine for 20 kr, or from a mystery box): see VAPE_* in shared/ducky.ts
  "puffbar",
  // mystery boxes and keys (see shared/cases.ts), and the unusuals the boxes give: a hat with particle effects, worn from the pocket
  "mysterycase", "casekey", "walkman", "ipod", "knife_tt", "waterer", "mixerchip", "mixerchip2", "gun", "rocket", "unusual_flame", "unusual_star", "unusual_heart", "unusual_snow", "unusual_bubble", "unusual_bolt", "unusual_rainbow", "unusual_ember", "unusual_galaxy", "unusual_sakura", "unusual_toxic", "unusual_sparks",
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
  /** a laced thing remembers who handed it over (a trade, a gift, a pick-up off the floor): if it kills you while you have a bounty, the giver is paid it. Not set when you made it yourself. */
  giver?: string;
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
      inv[slot] = { item: v.item, qty: v.qty ?? 1, ...(v.inPlayer ? { inPlayer: typeof v.inPlayer === "string" ? v.inPlayer : true } : {}), ...(typeof v.lit === "number" ? { lit: v.lit } : {}), ...(v.ass ? { ass: true } : {}), ...(typeof v.giver === "string" && /^[A-Za-z0-9]{1,40}$/.test(v.giver) ? { giver: v.giver } : {}) };
    }
  }
  return inv;
}

/** Things that can never be put on the floor, given or traded (the knife stays with you). */
export const NO_DROP: ReadonlySet<string> = new Set(["loudspeaker", "knife", "pickaxe", "machete", "cd_yellow", "cd_green", "cd_blue", "cd_album", "f_mixer", "f_planter", "f_beatshop"]); // (the CDs bought with real money stay with the one who bought them; the mixer and the growing kit stay too: new accounts were collecting them from the vending machine and selling them on)

/** First slot holding `item`. Items that are loaned out (inPlayer) don't count as available. */
export const findSlot = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item && !s.inPlayer);
/** Same, but counts loaned-out copies too (for "do I own one at all"). */
export const findSlotAny = (inv: Inventory, item: string): number => inv.findIndex((s) => s?.item === item);

/** What 6ixty sells, in shelf order. The admin can still switch an item off or change its price (Admin > Shop > Items). */
export const SIXTY_STOCK = ["cigarette", "pill", "kodimagnyl", "bandage"];
export const DEFAULT_ITEM_PRICE = 5;
/** Default shop entry for items that start on sale (everything else starts off). */
export const ITEM_DEFAULTS: Record<string, { on: boolean; price: number }> = {
  cigarette: { on: true, price: 2 },
  pill: { on: true, price: 3 },
  walkman: { on: true, price: 100 }, // a portable CD player (the record shop sells it)
  casekey: { on: true, price: 300 }, // a key for a mystery box (6ixty sells them; the Ducky machine sells 5 for 30 kr, or 1 for 10 kr)
  cd_ogep: { on: true, price: 20 }, // the OG community EP (the four player songs on one CD): the record player sells it, one per player
  cd_blodig: { on: true, price: 5 }, // the Blodig oktober CD, sold at the record player in the shop: one per player (see buyRecord)
  cd_lykk: { on: true, price: 5 }, // leolegit - blodoktober (prod. Lykk), the same shop and rules
  cd_roulette: { on: true, price: 5 }, // yungxware - russisk roulette, the same shop and rules
  cd_dipdip: { on: true, price: 5 }, // lemonade - Dip Dip, the same shop and rules
  cd: { on: true, price: 2 }, // the Freakme CD, sold at the record player in the shop: one per player, once (see buyRecord)
  wood: { on: true, price: WOOD_PRICE }, // sold by 6ixty in the mines (see buySixty)
  bandage: { on: true, price: 12 }, // sold by 6ixty: heals 3 hit points in the streets (a test item)
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
export interface SmokeDef { mult: number; boostMs: number; kind: "cigarette" | "joint" | "blunt" | "hashjoint" | "chudjoint" | "chudblunt"; /** a shroom's trip too: every door open for this long (chud) */ shroomMs?: number; /** your name shows as "chud" for this long (and nothing else happens) */ chudNameMs?: number; speedMs?: number; chemMs?: number; /** how many times faster (default 2) */ speedMult?: number; /** how you look to everybody for this long (see LOOKS in shared/bagmand.ts) */ look?: { kind: string; ms: number }; /** deadly stabs: `n` of them, which can be used for `ms` (see deadlyStab) */ deadly?: { n: number; ms: number };  /** how long it burns before the effect starts (default SMOKE_MS) */ smokeMs?: number }
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
  // troldmand: a strong smoke (like a hash joint without the hearts) and you walk twice as fast for the same time
  joint_troll: { mult: 3, boostMs: 120_000, kind: "joint", speedMs: 120_000 },
  blunt_troll: { mult: 4, boostMs: 180_000, kind: "blunt", speedMs: 180_000 },
  // the plain chud joint: no effect at all, except that your name reads "chud" over your head for 30 seconds
  joint_chudname: { mult: 2, boostMs: 0, kind: "joint", chudNameMs: 30_000 },
  // chud: the weed effect and the shroom effect together, from a joint or a blunt with spots on it and green smoke
  joint_chud: { mult: 3, boostMs: 120_000, kind: "chudjoint", shroomMs: 3 * 60_000 },
  blunt_chud: { mult: 4, boostMs: 180_000, kind: "chudblunt", shroomMs: 3 * 60_000 },
  blunt_chem: { mult: 2, boostMs: 90_000, kind: "blunt", speedMs: 90_000, chemMs: 90_000, smokeMs: 5_000 },
  // bagmand's weeds. natryger (blue weed): you hover over the ground in a blue glow and walk twice as fast for 4 minutes
  joint_nat: { mult: 2, boostMs: 240_000, kind: "joint", speedMs: 240_000, look: { kind: "blue", ms: 240_000 } },
  blunt_nat: { mult: 2, boostMs: 240_000, kind: "blunt", speedMs: 240_000, look: { kind: "blue", ms: 240_000 } },
  // cali weed: a stronger smoke that shines gold
  joint_cali: { mult: 4, boostMs: 150_000, kind: "joint", look: { kind: "gold", ms: 150_000 } },
  blunt_cali: { mult: 5, boostMs: 210_000, kind: "blunt", look: { kind: "gold", ms: 210_000 } },
  // pink weed (2cb + weed): a strong smoke, hearts and a pink glow, and you walk twice as fast
  joint_pink: { mult: 3, boostMs: 150_000, kind: "joint", speedMs: 150_000, look: { kind: "pink", ms: 150_000 } },
  blunt_pink: { mult: 4, boostMs: 210_000, kind: "blunt", speedMs: 210_000, look: { kind: "pink", ms: 210_000 } },
  // brown weed (heroin + weed): the heaviest plain stab bonus, in a brown haze
  joint_brown: { mult: 4, boostMs: 180_000, kind: "joint", look: { kind: "brown", ms: 180_000 } },
  blunt_brown: { mult: 5, boostMs: 240_000, kind: "blunt", look: { kind: "brown", ms: 240_000 } },
  // the loudpack (natryger + cali weed): sparkles, twice as fast for a minute and 2 deadly stabs (they can be used for 3 minutes)
  joint_loud: { mult: 3, boostMs: 60_000, kind: "joint", speedMs: 60_000, look: { kind: "sparkle", ms: 60_000 }, deadly: { n: 2, ms: 180_000 } },
  blunt_loud: { mult: 3, boostMs: 60_000, kind: "blunt", speedMs: 60_000, look: { kind: "sparkle", ms: 60_000 }, deadly: { n: 2, ms: 180_000 } },
};
/**
 * Things you swallow that aren't fentanyl, LSD, DMT, shrooms or the lean (those have their own code in `consume`): bagmand's drugs.
 * `nodMs` = the screen goes dark for that long (heroin), `rushMs` = 10x run speed with the LSD spin at 3x for that long, before everything else (the 芬太尼).
 */
export interface UseDef { mult?: number; boostMs?: number; speedMs?: number; speedMult?: number; shroomMs?: number; chemMs?: number; lean?: boolean; look?: { kind: string; ms: number }; nodMs?: number; rushMs?: number }
export const DRUG_USE: Record<string, UseDef> = {
  heroin: { mult: 4, boostMs: 180_000, look: { kind: "brown", ms: 180_000 }, nodMs: 10_000 }, // you nod off for 10 seconds, then stab for 4x
  percs: { mult: 3, boostMs: 180_000, speedMs: 180_000, look: { kind: "purple", ms: 180_000 } },
  twocb: { mult: 2, boostMs: 180_000, speedMs: 180_000, shroomMs: 180_000, look: { kind: "rainbow", ms: 180_000 } }, // doors open and the colours shift
  ketamine: { speedMs: 60_000, look: { kind: "horse", ms: 60_000 } }, // a horse's head for a minute
  fentcn: { mult: 4, boostMs: 180_000, speedMs: 180_000, shroomMs: 180_000, chemMs: 180_000, lean: true, look: { kind: "horse", ms: 60_000 }, rushMs: 10_000 }, // 10 s at 10x, then all of it
};
/**
 * The psychedelics: shrooms, LSD, DMT and 2cb. One time in ten one of them gives you a bad trip (see the room: you say things for 30 seconds, and for the last 15 you are naked and run around at
 * four times your speed, then you fall asleep for 4 seconds and wake up in your room).
 */
export const PSYCHEDELICS: ReadonlySet<string> = new Set(["shroom", "weakshroom", "lsd", "dmt", "twocb"]);
export const BADTRIP_CHANCE = 0.1;
export const BADTRIP_MS = 30_000;
export const BADTRIP_RUN_MS = 15_000;
export const BADTRIP_SLEEP_MS = 4_000;
/** what you say on a bad trip (`{name}` is somebody else in the room) */
export const BADTRIP_LINES: readonly string[] = [
  'FUCK DIG "{name}"',
  "{name} ER EN DEMON {name} ER EN DEMON.",
  "Guys sorry min mor er lige blevet skudt real life skal lige spin back....",
  "Brb guys jeg har skidt ud over min stol",
  "IM STICKING RN AY IM STICKING RN AYY",
  "IM STICKING RIGH NAHHHHHHH",
  "67 57 57 57 SIX SEVEN GUYS",
  "yooooo jeg elsker isreal",
  "Der worms i min dih der worms i min idek broasdokfpælkj",
];
/** Items that pile up in one slot (everything else gets a slot of its own). */
export const STACKABLE: ReadonlySet<string> = new Set(["cigarette", "jointpaper", "bluntwrap", "weedseed", "weed", "mix", "midweed", "thca", "researchchem", "pill", "kodimagnyl", "shroomspore", "shroom", "weakshroom", "hash", "hashmix", "chudmix", "trollmix", "superpill", "dmt", "lsd", "cigbutt", "tobacco", "iron", "wood", "poppyseed", "opium", "heroin", "ketamine", "percs", "twocb", "caliweed", "pinkweed", "brownweed", "natryger", "loudpack", "fentcn", "mysterycase", "casekey"]);
/** Weed grows for 10 minutes, shrooms for 25. The water bar runs dry after 5: water it once, any time while it grows (even before the bar is empty), or the harvest turns out poor. */
export const GROW_MS = 10 * 60_000;
export const GROW_MS_SHROOM = 25 * 60_000;
/** how long what is planted takes to grow */
export const GROW_MS_POPPY = 4 * 3_600_000;
export const growMsOf = (crop?: string): number => (crop === "shroom" ? GROW_MS_SHROOM : crop === "poppy" ? GROW_MS_POPPY : GROW_MS);
export const WATER_MS = 5 * 60_000;
export const SMOKE_MS = 60_000;
/** How long this smokable burns before it's finished. */
export const smokeMsOf = (item: string): number => SMOKABLE[item]?.smokeMs ?? SMOKE_MS;

/** A drop of blood is the hotel's currency. */
export const START_BLOOD = 0; // you start with nothing: the first stab (in the introduction) pays your first 5 drops
export const MUSIC_ACCESS_KEY = "access_music";
export const MUSIC_ACCESS_PRICE = 4;

/** Everything you can roll: good weed, and what the mixer makes from it. */
export const ROLLABLE: ReadonlySet<string> = new Set(["weed", "mix", "midweed", "thca", "researchchem", "hashmix", "chudmix", "trollmix", "caliweed", "pinkweed", "brownweed", "natryger", "loudpack"]);

/** What a rolled joint / blunt is called, by what went into it. (Good weed and weed mix both make the plain one.) */
const ROLL_SUFFIX: Record<string, string> = { weed: "", mix: "", midweed: "_mid", thca: "_thca", researchchem: "_chem", hashmix: "_hash", chudmix: "_chud", trollmix: "_troll", caliweed: "_cali", pinkweed: "_pink", brownweed: "_brown", natryger: "_nat", loudpack: "_loud" };

/**
 * Fentanyl used on another drug laces it. A laced thing is its own item (its id is "laced_" + the plain id), so it never stacks with the clean one;
 * it looks exactly the same (same name, same picture) and using it kills you. Everything you can use or roll can be laced.
 */
export const LACED_PREFIX = "laced_";
export const isLaced = (id: string): boolean => id.startsWith(LACED_PREFIX);
export const unlaced = (id: string): string => (isLaced(id) ? id.slice(LACED_PREFIX.length) : id);
export const LACEABLE: ReadonlySet<string> = new Set([
  ...ROLLABLE, ...Object.keys(SMOKABLE).filter((k) => k !== "cigarette" && k !== "cigar"), "pill", "codeine", "shroom", "weakshroom", "lsd", "dmt", ...Object.keys(DRUG_USE), "opium",
]);
for (const id of LACEABLE) {
  (ITEM_IDS as Set<string>).add(LACED_PREFIX + id);
  if (STACKABLE.has(id)) (STACKABLE as Set<string>).add(LACED_PREFIX + id);
  if (SMOKABLE[id]) SMOKABLE[LACED_PREFIX + id] = SMOKABLE[id];
}

/** Rolling, in the pocket: weed (or mix, mid weed, thc-a, research chemical) + joint paper or a blunt wrap. The order you clicked them in doesn't matter. Null if they don't go together. */
export function combine(a: InvItem, b: InvItem): { give: InvItem; note: string; back?: InvItem } | null {
  // tobacco rolls in joint paper to a cigarette, and in blunt paper to a cigar
  const tob = [a, b].find((x) => x.item === "tobacco"), paper = [a, b].find((x) => x.item === "jointpaper" || x.item === "bluntwrap");
  if (tob && paper && tob !== paper) return paper.item === "jointpaper" ? { give: { item: "cigarette", qty: 1 }, note: "You roll a cigarette." } : { give: { item: "cigar", qty: 1 }, note: "You roll a cigar." };
  // fentanyl on another drug: that one becomes laced (the plain fentanyl is used up)
  const fent = [a, b].find((x) => x.item === "superpill" && !x.lit && !x.inPlayer), target = fent === a ? b : fent === b ? a : undefined;
  if (fent && target && fent !== target) {
    if (!LACEABLE.has(target.item) || target.lit || target.inPlayer) return null;
    return { give: { item: LACED_PREFIX + target.item, qty: 1 }, note: "You lace it with fentanyl." };
  }
  const w = [a, b].find((x) => ROLLABLE.has(unlaced(x.item)));
  const o = w === a ? b : w === b ? a : undefined;
  if (!w || !o || w === o) return null;
  const lace = isLaced(w.item) ? LACED_PREFIX : ""; // what is rolled from a laced thing is laced too
  const base = unlaced(w.item);
  const ass = w.ass && base === "weed" ? { ass: true as const } : {};
  const suffix = ROLL_SUFFIX[base] ?? "";
  if (o.item === "jointpaper") return { give: { item: `${lace}joint${suffix}`, qty: 1, ...ass }, note: "You roll a joint." };
  if (o.item === "bluntwrap" && base !== "hashmix") return { give: { item: `${lace}blunt${suffix}`, qty: 1, ...ass }, note: "You roll a blunt." };
  return null;
}

/** The mixer: two things in, something new out. One of each goes in; the result is how many come out. The order doesn't matter. */
export interface MixRecipe { a: { item: string; ass?: boolean }; b: { item: string; ass?: boolean }; give: InvItem; note: string; /** something that comes straight back to you (the emptied watering can) */ back?: InvItem; /** how long it takes in the mixer (default MIX_MS, 10 minutes) */ ms?: number }
export const MIX_RECIPES: MixRecipe[] = [
  { a: { item: "weed" }, b: { item: "cigarette" }, give: { item: "mix", qty: 2 }, note: "You crumble the weed into the tobacco: 2 weed mix." },
  { a: { item: "weed" }, b: { item: "weed", ass: true }, give: { item: "midweed", qty: 2 }, note: "Good weed and bad weed, mixed up: 2 mid weed." },
  { a: { item: "pill" }, b: { item: "weed" }, give: { item: "thca", qty: 1 }, note: "The pill dissolves into the weed: 1 thc-a." },
  { a: { item: "pill" }, b: { item: "cigarette" }, give: { item: "researchchem", qty: 1 }, note: "You grind the pill into the tobacco: 1 research chemical." },
  { a: { item: "pill" }, b: { item: "kodimagnyl" }, give: { item: "superpill", qty: 1 }, note: "A pill and kodimagnyl, ground into a white powder: 1 fentanyl." },
  { a: { item: "weed", ass: true }, b: { item: "kodimagnyl" }, give: { item: "hash", qty: 1 }, note: "Ass weed and kodimagnyl, pressed together: 1 hash." },
  { a: { item: "hash" }, b: { item: "cigarette" }, give: { item: "hashmix", qty: 2 }, note: "You crumble the hash into the tobacco: 2 hash mix." },
  { a: { item: "shroom" }, b: { item: "weed" }, give: { item: "chudmix", qty: 2 }, note: "The shroom is chopped into the weed: 2 chud mix." },
  { a: { item: "shroom" }, b: { item: "kodimagnyl" }, give: { item: "dmt", qty: 1 }, note: "The shroom dissolves into the kodimagnyl, which turns yellow: 1 DMT." },
  { a: { item: "shroom" }, b: { item: "pill" }, give: { item: "lsd", qty: 1 }, note: "The shroom is ground into the pill, which comes out with a little pattern on it: 1 LSD." },
  { a: { item: "hash" }, b: { item: "weed" }, give: { item: "trollmix", qty: 2 }, note: "Hash crumbled into good weed: 2 troldmand mix." },
  { a: { item: "weed", ass: true }, b: { item: "cigarette" }, give: { item: "joint_chudname", qty: 1 }, note: "Ass weed and a cigarette, rolled together: 1 chud joint." },
  // the lean also works in the mixer: kodimagnyl + a full watering can (the can comes straight back, empty)
  { a: { item: "kodimagnyl" }, b: { item: "wateringcan_full" }, give: { item: "codeine", qty: 1 }, back: { item: "wateringcan", qty: 1 }, note: "You crush the kodimagnyl into the water. It turns purple: codeine. The can is empty again." },
  // bagmand's: opium (from poppies) mixed into the heavy stuff. These take hours (set per recipe), and what they make sells for about 3x what went in
  { a: { item: "opium" }, b: { item: "wateringcan_full" }, give: { item: "heroin", qty: 1 }, back: { item: "wateringcan", qty: 1 }, ms: 2 * 3_600_000, note: "The opium dissolves in the water and is boiled down: 1 heroin. The can is empty again." },
  { a: { item: "opium" }, b: { item: "codeine" }, give: { item: "ketamine", qty: 1 }, ms: 2 * 3_600_000, note: "Opium stirred into the lean: 1 ketamine." },
  { a: { item: "opium" }, b: { item: "pill" }, give: { item: "percs", qty: 1 }, ms: 2.5 * 3_600_000, note: "The opium is pressed into the pill: 1 percs." },
  { a: { item: "opium" }, b: { item: "shroom" }, give: { item: "twocb", qty: 1 }, ms: 3 * 3_600_000, note: "Opium and a shroom, ground together: 1 2cb." },
  { a: { item: "opium" }, b: { item: "weed" }, give: { item: "caliweed", qty: 1 }, ms: 3 * 3_600_000, note: "The weed is soaked in opium and comes out gold: 1 cali weed." },
  { a: { item: "opium" }, b: { item: "superpill" }, give: { item: "fentcn", qty: 1 }, ms: 4 * 3_600_000, note: "Opium and fentanyl, cut together: 1 芬太尼." },
  { a: { item: "twocb" }, b: { item: "weed" }, give: { item: "pinkweed", qty: 2 }, ms: 2 * 3_600_000, note: "2cb crumbled into weed turns it pink: 2 pink weed." },
  { a: { item: "heroin" }, b: { item: "weed" }, give: { item: "brownweed", qty: 2 }, ms: 2 * 3_600_000, note: "Heroin crumbled into weed turns it brown: 2 brown weed." },
  { a: { item: "natryger" }, b: { item: "caliweed" }, give: { item: "loudpack", qty: 1 }, ms: 3 * 3_600_000, note: "Blue weed and cali weed, packed together into one big bud: 1 loudpack." },
];
// tobacco and the cigar mix exactly like a cigarette
for (const r of [...MIX_RECIPES]) if (r.b.item === "cigarette") for (const smoke of ["tobacco", "cigar"]) MIX_RECIPES.push({ ...r, b: { item: smoke } });
// two cigarette butts, picked apart, make tobacco (both from the same stack is fine)
MIX_RECIPES.push({ a: { item: "cigbutt" }, b: { item: "cigbutt" }, give: { item: "tobacco", qty: 1 }, note: "Two cigarette butts, picked apart: 1 tobacco." });
/** Minutes in the mixer, by what comes out: the dearer the result (and the more mixed things went into it), the longer it takes. 10 to 30. */
export const MIX_MINUTES: Record<string, number> = { tobacco: 10, mix: 10, midweed: 12, researchchem: 12, thca: 14, hash: 16, superpill: 18, hashmix: 22, chudmix: 20, trollmix: 24, lsd: 24, joint_chudname: 12, dmt: 26, codeine: 22.5 };
/** what you can grow: a mix with none of these in it (pills, kodimagnyl, water, cigarettes, butts) takes twice as long */
const GROWN = new Set(["weed", "shroom", "hash"]); // (hash is made from ass weed, so it counts)
for (const r of MIX_RECIPES) if (r.ms === undefined) r.ms = (MIX_MINUTES[r.give.item] ?? 10) * 60_000 * (GROWN.has(r.a.item) || GROWN.has(r.b.item) ? 1 : 2);
const matches = (it: InvItem, m: { item: string; ass?: boolean }): boolean => it.item === m.item && !it.lit && !it.inPlayer && !!it.ass === !!m.ass;
export function mixRecipe(x: InvItem, y: InvItem): MixRecipe | null {
  return MIX_RECIPES.find((r) => (matches(x, r.a) && matches(y, r.b)) || (matches(y, r.a) && matches(x, r.b))) ?? null;
}
/** Things 6ixty only buys in bundles: the price of one of these is for the whole bundle (2 cigarette butts = 1 drop, 2 pills = 3 drops). */
export const SELL_BUNDLE: Record<string, number> = { cigbutt: 2, cigarette: 2, pill: 2 };

/** What he will never buy: the tools of the trade (the mixer, the growing kit, rolling paper, the watering cans and the knife), every CD, the dice and the starter sofa everybody is given. */
export const NEVER_BOUGHT: ReadonlySet<string> = new Set([
  "f_mixer", "f_planter", "f_boombox", "f_beatshop", "elevator_ticket", "bandage", "jointpaper", "bluntwrap", "wateringcan", "wateringcan_full", "knife",
  "cd", "cd_yellow", "cd_green", "cd_blue", "cd_album", "cd_ogep", "cd_blodig", "cd_lykk", "cd_roulette", "cd_dipdip", "pickaxe", "machete", "dice", "f_sofa",
  "puffbar", "loudspeaker", "mysterycase", "casekey", "walkman", "ipod", "knife_tt", "waterer", "mixerchip", "mixerchip2", "rocket", "unusual_flame", "unusual_star", "unusual_heart", "unusual_snow", "unusual_bubble", "unusual_bolt", "unusual_rainbow", "unusual_ember", "unusual_galaxy", "unusual_sakura", "unusual_toxic", "unusual_sparks",
  // bagmand only buys his own things back (see shared/bagmand.ts)
  "poppyseed", "opium", "heroin", "ketamine", "percs", "twocb", "caliweed", "pinkweed", "brownweed", "natryger", "loudpack", "fentcn",
  "joint_cali", "blunt_cali", "joint_pink", "blunt_pink", "joint_brown", "blunt_brown", "joint_nat", "blunt_nat", "joint_loud", "blunt_loud",
]);

/**
 * What 6ixty pays: furniture 75% of what it cost in the shop; the things that were bought for blood 50% of that; and everything you grow, mix or
 * find in the bins at a price made so that growing and mixing pay off (each step is worth more than what went into it). Null = he doesn't buy it.
 * Things in SELL_BUNDLE are paid per bundle. `furniPrices` = the admin's furniture prices (shared/furniture.ts furniPrice).
 */
export function sellPrice(item: string, ass?: boolean, furniPrices: Record<string, number> = {}): number | null {
  if (item.startsWith("pet_") || item.startsWith("cdp_")) return null; // (6ixty has no use for pets or pressed CDs: swap them with players)
  if (isLaced(item)) return sellPrice(unlaced(item), ass, furniPrices); // (it looks like the real thing, so he pays the same)
  if (NEVER_BOUGHT.has(item) || SHOP_PIECES.some((p) => p.rare && SHOP_KIND_PREFIX + p.id === item)) return null; // (the raffle's rare pieces are not for sale: not even to him)
  if (/^[fx]_/.test(item)) return Math.max(1, Math.floor(furniPrice(item, furniPrices) * 0.75)); // furniture: 75% of the shop price
  switch (item) {
    // bought for blood: half of it (the cigarette 1 and the pill 3 only come out whole in twos)
    case "cigarette": return 1; // per 2
    case "pill": return 3; // per 2
    case "kodimagnyl": return 2; // cost 4 in the vending machine
    case "lighter": return 1; // cost 2 in the vending machine
    case "cigbutt": return 1; // per 2 butts
    case "tobacco": return 2; // from 2 butts (worth 1)
    case "cigar": return 2;
    case "gun": return 240; // (the bagmand sells it for 250)
    // grown from seeds and spores (3 from each, so a seed is worth much less than what it grows into)
    case "weedseed": return 2;
    case "weed": return ass ? 4 : 6;
    case "shroomspore": return 3;
    case "weakshroom": return 14; // a badly watered shroom: the same price as a good one
    case "shroom": return 14; // worth more than weed: 3 per kit and they open every door
    // mixed
    case "mix": return 5; // weed 6 + a cigarette -> 2
    case "midweed": return 7; // a good weed 6 + an ass weed 4 -> 2
    case "thca": return 12; // pill 3 + weed 6
    case "researchchem": return 9; // pill 3 + a cigarette
    case "hash": return 12; // ass weed 4 + kodimagnyl 4
    case "hashmix": return 8; // hash 12 + a cigarette -> 2
    case "chudmix": return 12; // shroom 14 + weed 6 -> 2
    case "codeine": return 8; // kodimagnyl 4 and water
    case "superpill": return 11; // fentanyl: pill 3 + kodimagnyl 4
    case "dmt": return 28; // shroom 14 + kodimagnyl 4 (a bonus on top)
    case "lsd": return 30; // shroom 14 + pill 3 (a bonus on top)
    case "trollmix": return 11; // hash 12 + weed 6 -> 2
    case "joint_troll": return 16;
    case "blunt_troll": return 18;
    case "joint_chudname": return 4; // ass weed 4 + a cigarette
    // rolled (paper 1, blunt wrap 2)
    case "joint": return 9;
    case "blunt": return 9;
    case "joint_mid": return 10;
    case "blunt_mid": return 12;
    case "joint_thca": return 15;
    case "blunt_thca": return 17;
    case "joint_chem": return 13;
    case "blunt_chem": return 15;
    case "joint_hash": return 13;
    case "joint_chud": return 18;
    case "blunt_chud": return 20;
    case "syringe": return 1;
    // the mines: iron is dug out of the rock (it takes a while), wood costs 5 from 6ixty so he buys it back for 2
    case "iron": return 3;
    case "wood": return 2;
    default: return null;
  }
}

/** Dying from fentanyl: 1.5 x what the fentanyl is worth (plus the laced thing, if that is what killed you) in blood, or a quarter of what you have if that is less than the price. */
export function fentanylDeathCost(blood: number, laced?: string): number {
  const price = Math.ceil(((sellPrice("superpill") ?? 0) + (laced ? sellPrice(laced) ?? 0 : 0)) * 1.5);
  return blood >= price ? price : Math.floor(Math.max(0, blood) * 0.25);
}
