// Mystery boxes and keys (like cases and case keys in CS:GO): a box you find in the bins, a key you buy from 6ixty (200 blood) or in the Ducky machine
// (2 for 25 kr). A key opens one box. Pure data and rules: the browser (the opening window) and the server (the roll: server/src/actions/cases.ts) use it.
import { SHOP_PIECES } from "./furniture";
import { UNUSUAL_FX, type UnusualEffect } from "./unusualFx";
import { PET_COLORS, PET_TYPES } from "./pets";
import { petItemId } from "./petItems";
import { RAFFLE_POOL } from "./raffle";

export const CASE_ITEM = "mysterycase";
export const KEY_ITEM = "casekey";
/** what a key costs from 6ixty (blood), and what the Ducky machine sells (2 keys for 25 kr) */
export const CASE_KEY_PRICE = 200;
export const KEYS_PACK = { qty: 2, ore: 2500 };
/** the chance (in percent) that a search of a bin finds a box */
export const CASE_BIN_CHANCE = 5;

export type Tier = "junk" | "common" | "rare" | "unusual";
export interface CasePrize { id: string; chance: number; tier: Tier; label: string }
/**
 * What a box gives, in percent (they add up to 100). Half of them are junk or small: ass weed, a cigarette, tobacco, hash, a chud joint, seeds, an ordinary piece of furniture; a good quarter is the heavy stuff
 * (cali weed and the 芬太尼, which bagmand pays 150 and 200 for), and 12% is something special: a poppy seed, the loudspeaker, a rare piece of furniture or an unusual.
 * The prizes are worth about 107 blood on average to the one who opens it, against the 200 the key costs: the boxes never pay.
 */
export const CASE_TABLE: CasePrize[] = [
  { id: "junk", chance: 22, tier: "junk", label: "Junk" },
  { id: "furni", chance: 21, tier: "common", label: "Furniture" },
  { id: "caliweed", chance: 19, tier: "rare", label: "Cali weed" },
  { id: "fentcn", chance: 13, tier: "rare", label: "芬太尼" },
  { id: "poppyseed", chance: 10, tier: "rare", label: "Poppy seed" },
  { id: "loudspeaker", chance: 5, tier: "rare", label: "Loudspeaker" },
  { id: "unusual", chance: 5, tier: "unusual", label: "Unusual" },
  { id: "rarefurni", chance: 2, tier: "unusual", label: "Rare furniture" },
  { id: "unusualpet", chance: 2, tier: "unusual", label: "Unusual pet" },
  { id: "knifeskin", chance: 1, tier: "unusual", label: "Karambit | Tiger Tooth" },
];
/** what the junk slot gives: one of these, as likely as each other (the weed is the weak kind, "ass weed") */
export const CASE_JUNK: { item: string; ass?: true }[] = [
  { item: "weed", ass: true }, { item: "cigarette" }, { item: "tobacco" }, { item: "hash" }, { item: "joint_chudname" }, { item: "weedseed" }, { item: "shroomspore" },
];

/** roughly what each prize is worth in blood (the furniture's shop prices average about 39 sold back; an unusual is far more), to check the boxes don't pay */
export const CASE_VALUE: Record<string, number> = { junk: 5, furni: 39, caliweed: 150, fentcn: 200, poppyseed: 50, loudspeaker: 100, unusual: 600, rarefurni: 500, unusualpet: 450, knifeskin: 800 };
export const caseExpectedValue = (): number => CASE_TABLE.reduce((n, p) => n + (p.chance / 100) * (CASE_VALUE[p.id] ?? 0), 0);

/** the ordinary furniture a box can give (what the daily shop sells) and the rare pieces (the raffle's) */
export const CASE_FURNI: string[] = SHOP_PIECES.filter((p) => !p.rare && !p.hideout).map((p) => `f_${p.id}`);
export const CASE_RARE_FURNI: string[] = RAFFLE_POOL;

// ---- unusuals: a hat or headpiece with a particle effect of its own -----------------------------------------------------------
export type { UnusualEffect };
export interface Unusual { id: string; name: string; /** the figure part it puts on the head (a hat or a headpiece) */ part: string; effect: UnusualEffect; color: string }
export const UNUSUALS: Unusual[] = [
  { id: "unusual_flame", name: "Burning Icarus Crown", part: "ha-97015", effect: "flames", color: "#ff7a1a" },
  { id: "unusual_star", name: "Starry Loyalty Crown", part: "ha-97058", effect: "stars", color: "#ffd23a" },
  { id: "unusual_heart", name: "Lovestruck Cat Hat", part: "ha-97013", effect: "hearts", color: "#ff5c9a" },
  { id: "unusual_snow", name: "Frosted Lion Mask", part: "ha-97057", effect: "snow", color: "#bfe6ff" },
  { id: "unusual_bubble", name: "Bubbly Shark Head", part: "ha-97016", effect: "bubbles", color: "#5fd0e8" },
  { id: "unusual_bolt", name: "Electric Devil Horns", part: "he-97008", effect: "bolts", color: "#7fb6ff" },
  { id: "unusual_rainbow", name: "Rainbow Bear", part: "ha-97014", effect: "rainbow", color: "#c45bff" },
  { id: "unusual_ember", name: "Smoldering Gold Bandana", part: "ha-97055", effect: "embers", color: "#e8431f" },
  { id: "unusual_galaxy", name: "Cosmic Halo", part: "he-97007", effect: "galaxy", color: "#8f6bff" },
  { id: "unusual_sakura", name: "Blossom Frog Hat", part: "ha-97056", effect: "sakura", color: "#ff9fc4" },
  { id: "unusual_toxic", name: "Radioactive Watermelon", part: "ha-97059", effect: "toxic", color: "#6bff3a" },
  { id: "unusual_sparks", name: "Sparkler Headband", part: "he-97036", effect: "sparks", color: "#ffd23a" },
];
/** the unusual pets: any pet, in any of its colours, with any of the particle effects */
export function randomUnusualPet(rand: (n: number) => number): string {
  const type = PET_TYPES[rand(PET_TYPES.length)];
  const palette = rand(Math.max(1, PET_COLORS[type] ?? 0));
  return petItemId({ type, palette, fx: UNUSUAL_FX[rand(UNUSUAL_FX.length)] });
}
export const unusualOf = (id: unknown): Unusual | undefined => UNUSUALS.find((u) => u.id === id);
export const UNUSUAL_IDS: string[] = UNUSUALS.map((u) => u.id);
