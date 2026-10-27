// Bagmand: a vendor who visits the basement (next to the roulette table) for one hour at 01:00, 10:00 and 15:00 Danish time.
// He sells poppy seeds (a few per visit, the same stock for everybody) and his blue weed, and only buys back what the poppies and his weeds turn into.
// Pure data and rules: the browser and the server both use it (the server does the buying and selling: server/src/actions/bagmand.ts).
//   bagmand/<visitStart>/sold/<item>   how many of that limited item have been sold in the visit that began at <visitStart> (written only by the server)
//   bagmand/force                      emulator only: a visit start (ms) that is treated as open, for tests (the server only reads it in the local emulator)
import { copenhagenOffset } from "./raffle";
import type { InvItem } from "./items";

/** the hours (Danish time) a visit starts, and how long it lasts */
export const VISIT_HOURS = [1, 10, 15];
export const VISIT_MS = 3_600_000;
/** the room he stands in: the basement, by the roulette table (where on the floor: see BAGMAN in src/npc.ts) */
export const BAGMAN_ROOM = "lobby";

/** What he sells: price in blood each, and how many per visit in all (null = as many as you like). */
export const BAGMAND_BUY: Record<string, { price: number; stock: number | null; label: string }> = {
  poppyseed: { price: 50, stock: 5, label: "Poppy seed" },
  natryger: { price: 25, stock: null, label: "Bagmands natryger" },
  syringe: { price: 20, stock: null, label: "Syringe" },
  dice: { price: 500, stock: null, label: "Dice" }, // (they were sold at the pay2win machine before)
  gun: { price: 250, stock: 1, label: "Gun" }, // (one use: it shoots once and is gone; one per player per visit)
};
/**
 * What he pays (blood each), for only the things from him: opium from the poppies and what is mixed from it. The prices are about 1.6x what went into it
 * (a poppy seed 50 -> opium 80, then 110-265 once it is mixed: about 1.6x per step), so what you make from a seed pays more the more work you put in, and there is no
 * way to sell his things to anybody else. Weak opium (a poppy that was never watered) is worth half.
 */
export const BAGMAND_SELL: Record<string, number> = {
  opium: 80,
  heroin: 130,
  ketamine: 140,
  percs: 130,
  twocb: 150,
  caliweed: 225,
  fentcn: 300,
  pinkweed: 125,
  brownweed: 110,
  loudpack: 265,
  // what he sells he buys back for 90% (nothing is gained by buying his natryger and bringing it back; rolled into a joint or a blunt he does not buy it at all)
  natryger: Math.floor(BAGMAND_BUY.natryger.price * 0.9),
};
/** what he pays for this item (null = he doesn't buy it) */
export const bagmandPays = (it: Pick<InvItem, "item" | "ass">): number | null => {
  const base = it.item.startsWith("laced_") ? it.item.slice(6) : it.item;
  const p = BAGMAND_SELL[base];
  return p === undefined ? null : it.ass ? Math.floor(p / 2) : p;
};

/** every visit that starts in a window of days around `now` (ms, ascending) */
function visitStarts(now: number): number[] {
  const local = new Date(now + copenhagenOffset(now)); // (its UTC fields read as the Danish clock)
  const out: number[] = [];
  for (let day = -1; day <= 2; day++) {
    for (const hour of VISIT_HOURS) {
      const naive = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + day, hour);
      out.push(naive - copenhagenOffset(naive - copenhagenOffset(naive)));
    }
  }
  return out.sort((a, b) => a - b);
}
/** the start of the visit that is on right now, or null */
export const currentVisit = (now: number): number | null => visitStarts(now).find((s) => now >= s && now < s + VISIT_MS) ?? null;
/** the start of the next visit after `now` */
export const nextVisit = (now: number): number => visitStarts(now).find((s) => s > now) ?? now + 3_600_000;
/** "10:00" (Danish clock) */
export function clockText(ms: number): string {
  const l = new Date(ms + copenhagenOffset(ms));
  return `${String(l.getUTCHours()).padStart(2, "0")}:${String(l.getUTCMinutes()).padStart(2, "0")}`;
}

/** What 6ixty says (over his head, in the public room) once for each coming visit while bagmand is away. */
export const awayLine = (nextStart: number): string => `bagmanden besøger igen kl ${clockText(nextStart)}`;

/**
 * How you look while a drug or special weed works (presence `look` + `lookUntil`; everybody sees it). The pictures are drawn by the browser (src/ui/room.ts, drawLook).
 *  blue: hovering with a blue glow (natryger) · gold: golden shine (cali weed) · pink: pink glow and hearts · brown: a brown haze · purple: a purple haze
 *  rainbow: colours shifting (2cb) · sparkle: sparkles (loudpack) · horse: a horse's head (ketamine)
 */
export const LOOK_KINDS = ["blue", "gold", "pink", "brown", "purple", "rainbow", "sparkle", "horse"] as const;
export type LookKind = (typeof LOOK_KINDS)[number];
export const isLookKind = (k: unknown): k is LookKind => typeof k === "string" && (LOOK_KINDS as readonly string[]).includes(k);

/** the horse look's hat: a clothing design that ships with the game (public/designs/shop/97070.json) but is not for sale; it is only put on the figure while the look lasts */
export const HORSE_HAT_ID = "97070";
export const HORSE_HAT = `ha-${HORSE_HAT_ID}`;

/** the 10 seconds of the 芬太尼: 10x run speed, and the spin from the LSD at 3x */
export const RUSH_SPEED = 10;
export const RUSH_SPIN = 3;
/** how many players one loudpack can kill, and what each victim drops */
export const DEADLY_DROP = 10;
