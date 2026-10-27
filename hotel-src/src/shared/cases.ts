// Mystery boxes and keys (like cases and case keys in CS:GO): a box you find in the bins, a key you buy from 6ixty (200 blood) or in the Ducky machine
// (3 for 25 kr). A key opens one box. Pure data and rules: the browser (the opening window) and the server (the roll: server/src/actions/cases.ts) use it.
import { SHOP_PIECES } from "./furniture";
import { UNUSUAL_FX, type UnusualEffect } from "./unusualFx";
import { PET_COLORS, PET_TYPES } from "./pets";
import { petItemId } from "./petItems";
import { RAFFLE_POOL } from "./raffle";

export const CASE_ITEM = "mysterycase";
export const KEY_ITEM = "casekey";
/** what a key costs from 6ixty (blood), and what the Ducky machine sells (3 keys for 25 kr) */
export const CASE_KEY_PRICE = 250;
export const KEYS_PACK = { qty: 3, ore: 2500 };
/** the chance (in percent) that a search of a bin finds a box */
export const CASE_BIN_CHANCE = 5;

export type Tier = "junk" | "common" | "rare" | "unusual";
export interface CasePrize { id: string; chance: number; tier: Tier; label: string }
/**
 * What a box gives, in percent (they add up to 100; the loudspeaker is 0.05, so the roll is out of 10000: see rollCase). Two thirds of them are junk or an ordinary piece of furniture;
 * cali weed and the 芬太尼 (which bagmand pays 225 and 300 for) are 9.5 and 6.5; the rare things (an unusual hat, rare furniture, an unusual pet, the knife skin) are 2.5, 1, 1 and 0.5.
 * The prizes are worth about 90 blood on average to the one who opens it, against the 200 the key costs: the boxes never pay.
 */
export const CASE_TABLE: CasePrize[] = [
  { id: "junk", chance: 35, tier: "junk", label: "Junk" },
  { id: "furni", chance: 31.95, tier: "common", label: "Furniture" },
  { id: "caliweed", chance: 9.5, tier: "rare", label: "Cali weed" },
  { id: "fentcn", chance: 6.5, tier: "rare", label: "芬太尼" },
  { id: "poppyseed", chance: 10, tier: "rare", label: "Poppy seed" },
  { id: "loudspeaker", chance: 0.05, tier: "rare", label: "Loudspeaker" },
  { id: "gun", chance: 2, tier: "rare", label: "Gun" },
  { id: "unusual", chance: 2.5, tier: "unusual", label: "Unusual" },
  { id: "rarefurni", chance: 1, tier: "unusual", label: "Rare furniture" },
  { id: "unusualpet", chance: 1, tier: "unusual", label: "Unusual pet" },
  { id: "knifeskin", chance: 0.5, tier: "unusual", label: "Karambit | Tiger Tooth" },
];
/** which prize a roll of 0..9999 is (every prize has its chance in hundredths of a percent) */
export function rollCase(r: number): CasePrize {
  let left = r;
  for (const p of CASE_TABLE) { const w = Math.round(p.chance * 100); if (left < w) return p; left -= w; }
  return CASE_TABLE[0];
}
export const CASE_ROLL_MAX = 10000;
/** what the junk slot gives: one of these, as likely as each other (the weed is the weak kind, "ass weed") */
export const CASE_JUNK: { item: string; ass?: true }[] = [
  { item: "weed", ass: true }, { item: "cigarette" }, { item: "tobacco" }, { item: "hash" }, { item: "joint_chudname" }, { item: "weedseed" }, { item: "shroomspore" },
];

/** roughly what each prize is worth in blood (the furniture's shop prices average about 39 sold back; an unusual is far more), to check the boxes don't pay */
export const CASE_VALUE: Record<string, number> = { junk: 5, furni: 39, caliweed: 225, fentcn: 300, poppyseed: 50, loudspeaker: 100, gun: 250, unusual: 600, rarefurni: 500, unusualpet: 450, knifeskin: 800 };
export const caseExpectedValue = (): number => CASE_TABLE.reduce((n, p) => n + (p.chance / 100) * (CASE_VALUE[p.id] ?? 0), 0);

/** the ordinary furniture a box can give (what the daily shop sells) and the rare pieces (the raffle's) */
export const CASE_FURNI: string[] = SHOP_PIECES.filter((p) => !p.rare && !p.hideout).map((p) => `f_${p.id}`);
export const CASE_RARE_FURNI: string[] = RAFFLE_POOL;

// ---- unusuals: a hat or headpiece with a particle effect of its own -----------------------------------------------------------
export type { UnusualEffect };
export interface Unusual { id: string; name: string; /** the figure part it puts on the head (a hat or a headpiece) */ part: string; effect: UnusualEffect; color: string }
export const UNUSUALS: Unusual[] = [
  { id: "unusual_flame", name: "Totem Eagle Crown", part: "ha-97015", effect: "totem", color: "#ffb43a" },
  { id: "unusual_star", name: "Untouchable Crown", part: "ha-97058", effect: "untouchable", color: "#ffd23a" },
  { id: "unusual_heart", name: "Lovestruck Cat Hat", part: "ha-97013", effect: "hearts", color: "#ff5c9a" },
  { id: "unusual_snow", name: "Snow Warrior Lion Mask", part: "ha-97057", effect: "snowwar", color: "#7fb6ff" },
  { id: "unusual_bubble", name: "Stormy Shark Head", part: "ha-97016", effect: "raincloud", color: "#9aa3ad" },
  { id: "unusual_bolt", name: "Electric Devil Horns", part: "he-97008", effect: "lightning", color: "#5fd0e8" },
  { id: "unusual_rainbow", name: "Easter Chick Bear", part: "ha-97014", effect: "chicks", color: "#ffd84a" },
  { id: "unusual_ember", name: "Mystic Gold Bandana", part: "ha-97055", effect: "mystic", color: "#8f6bff" },
  { id: "unusual_galaxy", name: "Firefly Halo", part: "he-97007", effect: "fireflies", color: "#e8c24a" },
  { id: "unusual_sakura", name: "Completely Confused Frog Hat", part: "ha-97056", effect: "confused", color: "#c9ced6" },
  { id: "unusual_toxic", name: "Buzzing Watermelon", part: "ha-97059", effect: "flies", color: "#6bff3a" },
  { id: "unusual_sparks", name: "Thumbs Up Headband", part: "he-97036", effect: "thumbsup", color: "#ffb43a" },
];
/** the unusual pets: any pet, in any of its colours, with any of the particle effects */
export function randomUnusualPet(rand: (n: number) => number): string {
  const type = PET_TYPES[rand(PET_TYPES.length)];
  const palette = rand(Math.max(1, PET_COLORS[type] ?? 0));
  return petItemId({ type, palette, fx: UNUSUAL_FX[rand(UNUSUAL_FX.length)] });
}
export const unusualOf = (id: unknown): Unusual | undefined => UNUSUALS.find((u) => u.id === id);
export const UNUSUAL_IDS: string[] = UNUSUALS.map((u) => u.id);
