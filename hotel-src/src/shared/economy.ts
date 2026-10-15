// The economy's numbers and pure helpers, shared by the browser (to show things) and the server (to decide them).
// Nothing here may import the browser or Firebase.
import { emptyInventory, findSlotAny, GROW_MS, InvItem, Inventory, INV_SIZE, parseInventoryWith, SMOKABLE, SMOKE_MS, STACKABLE, START_BLOOD, WATER_MS } from "./items";

export const DAY_MS = 86_400_000;
/** Furniture everybody starts with, waiting in their toolbox's storage (given once, to new players and to everybody who played before). */
export const STARTER_FURNITURE = ["f_sofa"];
/** Nobody starts with anything: 6ixty gives the knife and (after the lighter job) the syringe. */
export const STARTER_ITEMS: string[] = [];

/** each garbage can can be searched once every 10 minutes; one weighted pick per search */
export const DUMPSTER_MS = 600_000;
export const DUMPSTER_DROPS: Array<{ item: string; chance: number; label: string }> = [
  // percentages (they add up to 100): a third spores, two thirds weed seeds, and now and then a lighter (kodimagnyl is sold by 6ixty now)
  { item: "weedseed", chance: 66, label: "weed seed" },
  { item: "shroomspore", chance: 33, label: "shroom spores" },
  { item: "lighter", chance: 1, label: "lighter" },
];
/** the super pill: 4x walking speed for a minute */
export const SUPERPILL_MS = 60_000;
/** DMT: patterns on the screen and your character lying down for this long */
export const DMT_MS = 10_000;
/** after the colours: a shroom lets you into any room for 3 minutes; DMT does it for 4 and doubles your walking speed */
export const SHROOM_MS = 3 * 60_000;
/** harvesting: a 25% chance of getting one seed (or spores, from shrooms) back */
export const SEED_BACK_CHANCE = 0.25;
export const DMT_TRIP_MS = 4 * 60_000;
export const SUPERPILL_MULT = 4;
/** the lean (codeine): for an hour, garbage cans give twice as much and can be searched twice as often. You hold the cup for the first 2 minutes. */
export const LEAN_MS = 3_600_000;
export const LEAN_CUP_MS = 2 * 60_000;
/** Now and then something turns up on the floor of the public room (the basement): every 10 minutes, a 25% chance, never more than 2 lying there at once. */
export const FLOOR_SPAWN_MS = 10 * 60_000;
export const FLOOR_SPAWN_CHANCE = 0.25;
export const FLOOR_SPAWN_MAX = 2;
export const FLOOR_SPAWN_ITEMS = ["weedseed", "cigarette", "shroomspore"];
export const SYRINGE_BLOOD = 1;
/** the syringe draws 1 drop from yourself and 1 from a body bag, each once every 20 minutes */
export const SYRINGE_CD_MS = 20 * 60_000;
/** the first stab pays 5 drops; the lighter job pays the price of a lighter, then 5 more with the syringe */
export const FIRST_BLOOD = 5;
export const JOB_REWARD = 5;
/** 6ixty's second job comes this long after the first stab */
export const JOB_DELAY_MS = 10 * 60_000;
/** Flappy Bird: at least this long between two drops of blood */
export const FLAPPY_GAP_MS = 12_000;
/** things on the floor of a public room vanish after 5 minutes, or 1 minute once the same player has 5+ of theirs there */
export const DROP_LIFE_MS = 5 * 60_000;
export const DROP_LIFE_BULK_MS = 60_000;
export const BULK_AT = 5;
export const MAX_FURNI = 40;
/** The landlord's three room upgrades, in the order they must be bought: the room becomes size x size for this many drops. Every player room starts at 8 x 8. */
export const ROOM_UPGRADES: Array<{ size: number; price: number }> = [{ size: 10, price: 25 }, { size: 12, price: 50 }, { size: 14, price: 80 }];
export const BASE_ROOM_SIZE = 8;
/** Changing the colour of your floor, your walls or your carpet at the landlord costs this many drops each. */
export const RECOLOR_PRICE = 2;
/** a little lighter: the second colour of the chequered floor */
export const lighterHex = (hex: string, by = 9): string => "#" + [1, 3, 5].map((i) => Math.min(255, parseInt(hex.slice(i, i + 2), 16) + by).toString(16).padStart(2, "0")).join("");
export const roomSizeAt = (level: number): number => (level > 0 ? ROOM_UPGRADES[Math.min(level, ROOM_UPGRADES.length) - 1].size : BASE_ROOM_SIZE);
/** the mixer works for this long on every batch */
export const MIX_MS = 10 * 60_000;
export const STORAGE_MAX_PIECES = 99;
export const STORAGE_MAX_ITEMS = 9999;

/** Everything the server owns about a player (the browser only ever reads it). */
export interface Snapshot {
  blood: number;
  owned: Record<string, true>;
  inventory: Inventory;
  /** furniture and things kept in the toolbox: kind (or "ass_<item>") -> how many */
  storage: Record<string, number>;
  /** who this player has stabbed, and when: target uid -> start (ms, UTC midnight) of that day */
  stabs: Record<string, number>;
  /** when each garbage can was last searched (can id -> ms) */
  dumpsters: Record<string, number>;
  boostUntil: number;
  boostMult: number;
  /** walking twice as fast until this time (thc-a, research chemical) */
  speedUntil: number;
  /** how many times faster (2 thc-a / research chemical, 4 super pill) */
  speedMult: number;
  /** the lean (codeine) is in you until this time; you hold the cup until cupUntil */
  leanUntil: number;
  cupUntil: number;
  /** a shroom or DMT lets you walk into any room until this time */
  shroomUntil: number;
  /** flashing and smoking until this time (research chemical) */
  chemUntil: number;
  catsCarved: number;
  /** how many room upgrades are bought (0..3) */
  roomLevel: number;
  syringeSelfAt: number;
  syringeBagAt: number;
  flappyAt: number;
  /** the introduction and 6ixty's jobs: 0 woke up, 1 has the knife, 2 stabbed the guy, 3 has the pill, 4 intro done, 5 got lighter money, 6 brought the lighter back */
  tutorial: number;
  /** when the first stab happened (ms); 6ixty's next job comes a couple of hours later */
  questAt: number;
  sixty: { knifeAt: number; syringeGiven: boolean };
}

export const todayStartAt = (now: number): number => now - (now % DAY_MS);

/** The economy part of a player's database node as a Snapshot, with the defaults for older accounts. `valid` says which item ids exist. */
export function parseEconomy(v: any, valid: (id: string) => boolean, isAdmin: boolean): Snapshot {
  v = v ?? {};
  const inventory = parseInventoryWith(v.inventory, valid);
  const sixty = v.sixty
    ? { knifeAt: Number(v.sixty.knifeAt) || 0, syringeGiven: !!v.sixty.syringeGiven }
    : findSlotAny(inventory, "knife") >= 0 || findSlotAny(inventory, "syringe") >= 0
      ? { knifeAt: 1, syringeGiven: true }
      : { knifeAt: 0, syringeGiven: false };
  // The introduction is for players who never got 6ixty's knife. Players from before it have it: with a syringe they are done with every job (6), without one the lighter job is next (4).
  const tutorial = typeof v.tutorial === "number" ? Math.min(6, Math.max(0, v.tutorial)) : isAdmin || sixty.syringeGiven ? 6 : sixty.knifeAt > 0 ? 4 : 0;
  const nums = (o: unknown): Record<string, number> => Object.fromEntries(Object.entries((o ?? {}) as Record<string, unknown>).map(([k, n]) => [k, Number(n) || 0]));
  return {
    blood: Number(v.blood) || 0,
    owned: Object.fromEntries(Object.entries((v.owned ?? {}) as Record<string, unknown>).filter(([, x]) => x === true).map(([k]) => [k, true as const])),
    inventory,
    storage: Object.fromEntries(Object.entries(nums(v.storage)).filter(([, n]) => n > 0)),
    stabs: nums(v.stabs),
    dumpsters: nums(v.dumpsters),
    boostUntil: Number(v.boostUntil) || 0,
    boostMult: Math.min(4, Math.max(2, Number(v.boostMult) || 2)),
    speedUntil: Number(v.speedUntil) || 0,
    speedMult: Math.min(4, Math.max(2, Number(v.speedMult) || 2)),
    leanUntil: Number(v.leanUntil) || 0,
    cupUntil: Number(v.cupUntil) || 0,
    shroomUntil: Number(v.shroomUntil) || 0,
    chemUntil: Number(v.chemUntil) || 0,
    catsCarved: Number(v.catsCarved) || 0,
    roomLevel: Math.min(ROOM_UPGRADES.length, Math.max(0, Math.floor(Number(v.roomLevel) || 0))),
    syringeSelfAt: Number(v.syringeSelfAt) || 0,
    syringeBagAt: Number(v.syringeBagAt) || 0,
    flappyAt: Number(v.flappyAt) || 0,
    tutorial,
    questAt: Number(v.questAt) || 0,
    sixty,
  };
}

export const cloneSnapshot = (s: Snapshot): Snapshot => JSON.parse(JSON.stringify(s)) as Snapshot;

/** The database changes (full paths under users/<uid>/) that turn `before` into `after`. Inventory is compared slot by slot, maps key by key. */
export function snapshotPatch(uid: string, before: Snapshot, after: Snapshot): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const base = `users/${uid}/`;
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const k of ["blood", "boostUntil", "boostMult", "speedUntil", "speedMult", "leanUntil", "cupUntil", "shroomUntil", "chemUntil", "catsCarved", "roomLevel", "syringeSelfAt", "syringeBagAt", "flappyAt", "tutorial", "questAt"] as const) {
    if (before[k] !== after[k]) patch[base + k] = after[k];
  }
  if (before.sixty.knifeAt !== after.sixty.knifeAt) patch[`${base}sixty/knifeAt`] = after.sixty.knifeAt;
  if (before.sixty.syringeGiven !== after.sixty.syringeGiven) patch[`${base}sixty/syringeGiven`] = after.sixty.syringeGiven;
  for (let i = 0; i < INV_SIZE; i++) if (!same(before.inventory[i] ?? null, after.inventory[i] ?? null)) patch[`${base}inventory/${i}`] = after.inventory[i] ?? null;
  for (const m of ["storage", "stabs", "dumpsters", "owned"] as const) {
    const b = before[m] as Record<string, unknown>, a = after[m] as Record<string, unknown>;
    for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) if (!same(b[k], a[k])) patch[`${base}${m}/${k}`] = k in a ? a[k] : null;
  }
  return patch;
}

// ---- inventory helpers -------------------------------------------------------------------------------------------------

/** A copy of the inventory with something put in it (stacking where the item stacks); null if there's no room. */
export function addToInv(inv: Inventory, give: InvItem): Inventory | null {
  const out: Inventory = inv.map((s) => (s ? { ...s } : null));
  if (STACKABLE.has(give.item) && !give.lit) {
    const t = out.findIndex((s) => s && s.item === give.item && !s.lit && !s.inPlayer && !!s.ass === !!give.ass && s.qty + give.qty <= 999);
    if (t >= 0) { out[t]!.qty += give.qty; return out; }
  }
  const f = out.findIndex((s) => s === null);
  if (f < 0) return null;
  out[f] = { ...give };
  return out;
}

/** A copy of the inventory with one of the item in `slot` used up. */
export function takeOneFrom(inv: Inventory, slot: number): Inventory {
  return takeQtyFrom(inv, slot, 1);
}

/** A copy of the inventory with `qty` of the item in `slot` used up (the slot empties when it's all gone). */
export function takeQtyFrom(inv: Inventory, slot: number, qty: number): Inventory {
  const out: Inventory = inv.map((s) => (s ? { ...s } : null));
  const s = out[slot];
  if (!s) return out;
  if (s.qty > qty) s.qty -= qty; else out[slot] = null;
  return out;
}

/** The inventory never has gaps: every item moves up to fill an empty slot before it. */
/** Puts stackable things of the same kind into one slot (items that only stack now, like cigarette butts, may have been lying about one to a slot). */
export function mergeStacks(inv: Inventory): Inventory {
  const out: Inventory = inv.map((s) => (s ? { ...s } : null));
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    if (!a || !STACKABLE.has(a.item) || a.lit || a.inPlayer) continue;
    for (let j = i + 1; j < out.length; j++) {
      const b = out[j];
      if (b && b.item === a.item && !!b.ass === !!a.ass && !b.lit && !b.inPlayer) { a.qty += b.qty; out[j] = null; }
    }
  }
  return compactInv(out);
}

export function compactInv(inv: Inventory): Inventory {
  const kept = inv.filter((s): s is InvItem => !!s);
  return inv.map((_, i) => kept[i] ?? null);
}

// ---- time based rules ----------------------------------------------------------------------------------------------------
/** What a stab is worth right now: 1 drop, or more for a while after you finished a cigarette (x2), joint (x3) or blunt (x4). */
export const stabGainAt = (s: Pick<Snapshot, "boostUntil" | "boostMult">, now: number): number => (s.boostUntil > now ? s.boostMult : 1);

export interface Plant { at: number; water: number; neglect: boolean }
export const plantProgressAt = (pl: Plant, now: number): number => Math.min(1, (now - pl.at) / GROW_MS);
/** It has had its water: watered at some point after getting thirsty (5 minutes in). One watering is enough. */
export const plantWatered = (pl: Plant): boolean => pl.water >= pl.at + WATER_MS;
/** Thirsty and not yet watered. */
export const plantThirsty = (pl: Plant, now: number): boolean => now >= pl.at + WATER_MS && !plantWatered(pl);
/** The water bar: it drains over the first 5 minutes; once it's empty the plant needs its one watering, which fills it for good. */
export const plantWaterAt = (pl: Plant, now: number): number => (plantWatered(pl) ? 1 : Math.max(0, 1 - (now - pl.at) / WATER_MS));

export { emptyInventory, SMOKABLE, SMOKE_MS, START_BLOOD };
