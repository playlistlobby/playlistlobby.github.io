// The streets (the update after SoundCloud): an event every day at 20:00 Danish time, reached by the elevator in the basement with a ticket.
//   elevator (basement) -> arrival room (safe, the size of a medium player room) -> the streets (night, a road with cars, bins, customers, knife fights)
// Pure: the browser and the server both use it. Nothing here is published until STREETS_OPEN is true (the emulator and the admin's test switch always work).

/** the streets by day (true) or at night (false: the first version, still in the code) */
export const STREETS_DAY = true;
/** grass on the sidewalks: [x, y, w, h] in tiles (painted on the floor; you can walk on it) */
export const GRASS_BEDS: Array<[number, number, number, number]> = [[0, 11, 25, 1]];
export const STREETS_OPEN = false;
export const ARRIVAL_ID = "arrival";
export const STREETS_ID = "streets";
export const isStreetsRoom = (id: string): boolean => id === ARRIVAL_ID || id === STREETS_ID;
/** the arrival room is as big as a medium player room; the streets are 25 tiles down to the right and 12 down to the left */
export const ARRIVAL_SIZE = 11;
export const STREETS_W = 25;
export const STREETS_H = 12;

// ---- when the elevator runs ------------------------------------------------------------------------------------------
export const EVENT_TZ = "Europe/Copenhagen";
export const EVENT_HOUR = 20;
export const EVENT_HOURS = 1;
/** clock parts in Danish time */
export function danishParts(now: number): { y: number; m: number; d: number; h: number; mi: number; s: number } {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: EVENT_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(now))) if (p.type !== "literal") o[p.type] = Number(p.value);
  return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}
export const danishDayKey = (now: number): string => { const p = danishParts(now); return `${p.y}${String(p.m).padStart(2, "0")}${String(p.d).padStart(2, "0")}`; };
/** is the elevator running, and until when? (`forceUntil` is the admin's test switch: the elevator runs until then whatever the clock says) */
export function elevatorRuns(now: number, forceUntil = 0): { open: boolean; endsAt: number; nextAt: number } {
  if (forceUntil > now) return { open: true, endsAt: forceUntil, nextAt: now };
  const p = danishParts(now);
  const into = (p.h - EVENT_HOUR) * 3600 + p.mi * 60 + p.s;
  if (into >= 0 && into < EVENT_HOURS * 3600) return { open: true, endsAt: now + (EVENT_HOURS * 3600 - into) * 1000, nextAt: now };
  const wait = into < 0 ? -into : 24 * 3600 - into;
  return { open: false, endsAt: 0, nextAt: now + wait * 1000 };
}
export const fmtWhen = (ms: number): string => { const m = Math.max(1, Math.round(ms / 60000)); return m >= 90 ? `${Math.round(m / 60)} hours` : `${m} min`; };

// ---- the ticket --------------------------------------------------------------------------------------------------------
export const TICKET_ITEM = "elevator_ticket";
export const TICKET_PRICE = 50;
/** tickets on sale per day (the stock fills up again every day) */
export const TICKET_STOCK = 50;
export const holdsTicket = (inv: ReadonlyArray<{ item: string } | null>): boolean => inv.some((s) => s?.item === TICKET_ITEM);

// ---- the customers (the same for everybody: a customer is a function of the clock) ------------------------------------------
/** a new customer turns up this often; each one stays this long unless somebody fills the order */
export const CUSTOMER_EVERY_MS = 40_000;
export const CUSTOMER_STAY_MS = 120_000;
export const CAR_STAY_MS = 90_000;
/** the customers on the street at once: about STAY / EVERY (3) */
export function seeded(seed: number): () => number {
  let a = (seed ^ 0x9e3779b9) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** what they ask for. `unit` is what 6ixty pays for one (see sellPrice), `mult` what the street pays on top of that */
export interface Want { item: string; qty: number; mult: number }
/** the drugs people have most of (the cheap, common ones), and the ones that are rarer */
export const COMMON_WANTS = ["weed", "joint", "blunt", "mix", "midweed", "superpill", "hash", "shroom"] as const;
export const RARE_WANTS = ["thca", "codeine", "joint_mid", "blunt_mid", "joint_thca", "joint_hash", "chudmix", "dmt", "lsd", "trollmix"] as const;
/** the big orders at the cars (7-10 of one thing) */
export const BIG_WANTS = ["weed", "joint", "blunt", "mix", "superpill", "hash", "midweed", "shroom"] as const;
export const BIG_MULT = 3;
export const WALK_MULT = 2;

export interface Customer {
  k: number;
  kind: "walker" | "car";
  /** when it turned up and when it leaves if nobody fills the order */
  at: number;
  until: number;
  want: Want;
  /** where it stands: a sidewalk tile (a walker) or the curb lane it pulls over in (a car), the side it came from (-1 = from the left end of the street, 1 = from the right) */
  x: number;
  y: number;
  from: 1 | -1;
  /** a number for the look (a walker's clothes, a car's model and colour) */
  look: number;
}
/** the rows the walking customers stand in (the two nearest the road) */
export const STREET_SIDEWALK_ROWS = [2, 9];
export const ROAD_ROWS = { first: 3, last: 8, lanes: [4, 7], curbs: [3, 8] };

/** The customer number k (k = floor(time / CUSTOMER_EVERY_MS)): always the same one for the same k, so every browser and the server agree. */
export function customerAt(k: number): Customer {
  const r = seeded(k * 7919 + 13);
  const at = k * CUSTOMER_EVERY_MS;
  const car = r() < 0.2;
  if (car) {
    const lane = r() < 0.5 ? 0 : 1;
    const item = BIG_WANTS[Math.floor(r() * BIG_WANTS.length)];
    // the cars that pull over ask for a lot of one thing, or (less often) for a little of something rare
    const rare = r() < 0.3;
    const want: Want = rare
      ? { item: RARE_WANTS[Math.floor(r() * RARE_WANTS.length)], qty: 1 + Math.floor(r() * 3), mult: BIG_MULT }
      : { item, qty: 7 + Math.floor(r() * 4), mult: BIG_MULT };
    return { k, kind: "car", at, until: at + CAR_STAY_MS, want, x: 5 + Math.floor(r() * 14), y: lane === 0 ? ROAD_ROWS.curbs[0] : ROAD_ROWS.curbs[1], from: -1, look: Math.floor(r() * 1000) }; // (the street is one way: every car drives east, down to the right, because the car art only has the two views that look toward you)
  }
  const roll = r();
  let want: Want;
  if (roll < 0.5) want = { item: COMMON_WANTS[Math.floor(r() * COMMON_WANTS.length)], qty: 1 + Math.floor(r() * 2), mult: WALK_MULT }; // half of them: 1 or 2 of the common stuff
  else if (roll < 0.86) want = { item: COMMON_WANTS[Math.floor(r() * COMMON_WANTS.length)], qty: 3 + Math.floor(r() * 2), mult: WALK_MULT }; // 3 or 4 of it
  else want = { item: RARE_WANTS[Math.floor(r() * RARE_WANTS.length)], qty: 1 + Math.floor(r() * 2), mult: WALK_MULT }; // a little of something rare
  let row = STREET_SIDEWALK_ROWS[Math.floor(r() * STREET_SIDEWALK_ROWS.length)];
  let wx = 3 + Math.floor(r() * 19);
  for (let tries = 0; tries < 30 && !isFreeTile(wx, row); tries++) { row = STREET_SIDEWALK_ROWS[Math.floor(r() * STREET_SIDEWALK_ROWS.length)]; wx = 3 + Math.floor(r() * 19); } // (not on a lamp or a tree)
  return { k, kind: "walker", at, until: at + CUSTOMER_STAY_MS, want, x: wx, y: row, from: r() < 0.5 ? -1 : 1, look: Math.floor(r() * 100000) };
}
/** the customers that are on the street at this moment (before the filled ones are taken away) */
export function customersAt(now: number): Customer[] {
  const out: Customer[] = [];
  const last = Math.floor(now / CUSTOMER_EVERY_MS);
  for (let k = last; k > last - Math.ceil(CUSTOMER_STAY_MS / CUSTOMER_EVERY_MS) - 1; k--) {
    const c = customerAt(k);
    if (now >= c.at && now < c.until) out.push(c);
  }
  return out;
}
/** what a filled order pays: unit price x qty x mult, rounded up (`unit` = what 6ixty pays for one) */
export const orderPay = (unit: number, w: Want): number => Math.ceil(unit * w.qty * w.mult);

// ---- the knife fights (RuneScape's rules for bare-fist risk fights, for now only with knives) -----------------------------
export const PVP = {
  maxHp: 10,
  /** the hardest a knife can hit, and the chance a swing lands */
  maxHit: 3,
  hitChance: 0.7,
  /** how long you have to wait between two swings (4 game ticks of 0.6 s) */
  swingMs: 2400,
  /** after a hit, the two of you are in a fight for this long: no riding the elevator, no walking out of the room */
  combatMs: 10_000,
  /** the one who starts a fight is skulled for this long (a mark for the risk rules to come) */
  skullMs: 20_000,
  /** nobody can touch you for this long after you walk in */
  spawnProtectMs: 8_000,
  /** one hit point comes back this often */
  regenMs: 20_000,
  /** you reach one tile (diagonals too) */
  reach: 1,
  /** the bandage heals this much and can be used again after this long */
  healItem: "bandage",
  healHp: 3,
  healCooldownMs: 6_000,
  /** what happens to what you carry when you die: the whole pocket is lost */
  loseOnDeath: true,
} as const;
export interface StreetCombat { hp: number; at: number; combatUntil: number; skullUntil: number; healAt: number; protectUntil: number; kills: number; deaths: number }
/** hit points now, with the ones that have come back since `at` */
export function hpNow(c: Pick<StreetCombat, "hp" | "at">, now: number): number {
  return Math.min(PVP.maxHp, c.hp + Math.floor(Math.max(0, now - c.at) / PVP.regenMs));
}

/** Everything that stands on the street: [id, kind, x, y, dir] (x runs down to the right, y down to the left; the road is rows 3-8, the sidewalks 0-2 at the back and 9-11 in front) */
export const STREET_PIECES: Array<[string, string, number, number, number]> = [
  // the back sidewalk, against the shops: bins and cans, a dumpster, three market stalls, lamps and trees along the curb
  ["s_can1", "st_can", 5, 1, 4], ["s_bin1", "st_bin", 6, 1, 4], ["s_stall1", "st_stall1", 8, 1, 4], ["s_dump1", "st_dumpster", 11, 1, 4], ["s_can2", "st_can", 14, 1, 4],
  ["s_stall2", "st_stall2", 16, 1, 4], ["s_bin2", "st_bin", 19, 1, 4], ["s_stall3", "st_stall3", 21, 1, 4],
  ["s_lamp1", "st_lamp", 6, 2, 4], ["s_lamp2", "st_lamp", 14, 2, 4], ["s_lamp3", "st_lamp", 22, 2, 4],
  ["s_tree1", "st_tree_apple", 4, 2, 4], ["s_tree2", "st_tree_blossom", 10, 2, 4], ["s_tree3", "st_tree_orange", 18, 2, 4], ["s_hyd1", "st_hydrant", 20, 2, 4],
  // the road
  ["s_man1", "st_manhole", 8, 5, 0], ["s_man2", "st_manhole", 17, 6, 0],
  // the front sidewalk: a phone box, a cafe, the traffic light by the crossing, a bird bath, benches, a statue, and lamps
  ["s_phone1", "st_phonebox", 1, 9, 4], ["s_lampf1", "st_lamppost", 5, 9, 2], ["s_chair1", "st_cafechair", 6, 9, 2], ["s_table1", "st_cafetable", 7, 9, 0], ["s_chair2", "st_cafechair", 9, 10, 6],
  ["s_traf1", "st_traffic", 10, 9, 2], ["s_bin4", "st_bin", 10, 10, 2], ["s_bath", "st_birdbath", 12, 10, 0], ["s_lampf2", "st_lamppost", 15, 9, 2], ["s_can3", "st_can", 16, 10, 2],
  ["s_bench1", "st_bench", 4, 10, 2], ["s_bench2", "st_bench", 19, 10, 2], ["s_lampf3", "st_lamppost", 22, 9, 2], ["s_stat", "st_statue", 24, 10, 4], ["s_sign1", "st_signs", 24, 9, 2],
  // the grass strip along the front: trees, planters, bushes
  ["s_ft1", "st_tree_pear", 1, 11, 4], ["s_pl1", "st_planter", 3, 11, 2], ["s_pt1", "st_planttree", 6, 11, 0], ["s_pl2", "st_planter", 9, 11, 2], ["s_ft2", "st_tree_apple", 13, 11, 4],
  ["s_pl3", "st_planter", 16, 11, 2], ["s_pt2", "st_planttree", 19, 11, 0], ["s_pl4", "st_planter", 21, 11, 2], ["s_ft3", "st_tree_blossom", 24, 11, 4],
];
/** how many tiles each piece covers (a piece turned to face 2 or 6 swaps them): the customers don't stand where something is */
const PIECE_TILES: Record<string, [number, number]> = { st_stall1: [2, 1], st_stall2: [2, 1], st_stall3: [2, 1], st_dumpster: [2, 1], st_bench: [2, 1], st_cafetable: [2, 2] };
const BLOCKED = new Set<string>();
for (const [, kind, px, py, dir] of STREET_PIECES) {
  const [w, h] = PIECE_TILES[kind] ?? [1, 1];
  const [fw, fh] = dir === 2 || dir === 6 ? [h, w] : [w, h];
  if (kind === "st_manhole") continue;
  for (let dx = 0; dx < fw; dx++) for (let dy = 0; dy < fh; dy++) BLOCKED.add(`${px + dx},${py + dy}`);
}
export const isFreeTile = (tx: number, ty: number): boolean => !BLOCKED.has(`${tx},${ty}`);
