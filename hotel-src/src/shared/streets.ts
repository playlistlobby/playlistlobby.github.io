// The streets (the update after SoundCloud): an event every day at 20:00 Danish time, reached by the elevator in the basement with a ticket.
//   elevator (basement) -> arrival room (safe, the size of a medium player room) -> the streets (night, a road with cars, bins, customers, knife fights)
// Pure: the browser and the server both use it. Players only get in once the admin has switched the streets on (config/streetsOpen); the staff can always test with /test1.

/** the streets by day (true) or at night (false: the first version, still in the code) */
export const STREETS_DAY = true;
/** grass on the sidewalks: [x, y, w, h] in tiles (painted on the floor; you can walk on it) */
export const GRASS_BEDS: Array<[number, number, number, number]> = [[0, 11, 25, 1]];
/** what /test1 gives the staff: a pass for this long, so they can test the fights and the customers while the streets are closed */
export const STAFF_TEST_PASS_MS = 2 * 3_600_000;
export const ARRIVAL_ID = "arrival";
export const STREETS_ID = "streets";
export const isStreetsRoom = (id: string): boolean => id === ARRIVAL_ID || id === STREETS_ID;
/** the arrival room is as big as a medium player room; the streets are 25 tiles down to the right and 12 down to the left */
export const ARRIVAL_SIZE = 11;
export const STREETS_W = 50;
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
/** the days that have an extra run besides the usual one at 20 (Danish day key -> the hours it starts) */
export const EXTRA_RUNS: Record<string, number[]> = { "20261028": [17] };
/** the hours the elevator starts on the Danish day of `now` (each run is EVENT_HOURS long) */
export const runHoursOn = (now: number): number[] => [...(EXTRA_RUNS[danishDayKey(now)] ?? []), EVENT_HOUR].sort((x, y) => x - y);
const pad2 = (n: number): string => String(n).padStart(2, "0");
/**
 * Is the elevator running, and until when? Every day from 20 to 21 (and on the days in EXTRA_RUNS at the extra hours too). `windowKey` names the run that is on now, or the next one:
 * the tickets for sale are counted for it (50 for each run). `forceUntil` is the admin's test switch: the elevator runs until then whatever the clock says.
 */
export function elevatorRuns(now: number, forceUntil = 0): { open: boolean; endsAt: number; nextAt: number; windowKey: string } {
  if (forceUntil > now) return { open: true, endsAt: forceUntil, nextAt: now, windowKey: `f${forceUntil}` };
  const p = danishParts(now);
  const day = danishDayKey(now);
  const sec = p.h * 3600 + p.mi * 60 + p.s;
  const hours = runHoursOn(now);
  for (const h of hours) {
    const start = h * 3600, end = start + EVENT_HOURS * 3600;
    if (sec >= start && sec < end) return { open: true, endsAt: now + (end - sec) * 1000, nextAt: now, windowKey: `${day}${pad2(h)}` };
  }
  const later = hours.find((h) => h * 3600 > sec);
  if (later !== undefined) return { open: false, endsAt: 0, nextAt: now + (later * 3600 - sec) * 1000, windowKey: `${day}${pad2(later)}` };
  const tomorrow = now + 24 * 3600 * 1000;
  const first = runHoursOn(tomorrow)[0];
  return { open: false, endsAt: 0, nextAt: now + (24 * 3600 - sec + first * 3600) * 1000, windowKey: `${danishDayKey(tomorrow)}${pad2(first)}` };
}
export const fmtWhen = (ms: number): string => { const m = Math.max(1, Math.round(ms / 60000)); return m >= 90 ? `${Math.round(m / 60)} hours` : `${m} min`; };

// ---- the ticket --------------------------------------------------------------------------------------------------------
export const TICKET_ITEM = "elevator_ticket";
export const TICKET_PRICE = 50;
/** tickets on sale for each run of the elevator (the stock fills up again for the next run) */
export const TICKET_STOCK = 50;
export const holdsTicket = (inv: ReadonlyArray<{ item: string } | null>): boolean => inv.some((s) => s?.item === TICKET_ITEM);

// ---- the customers: the server lets them turn up (see streetTick), and who they are (what they ask for, how they look) comes from their number -------------------
/** each player on the street brings this many customers a minute (they stay 7 minutes, so one player has about 4 around); there are never more than CAP on the street at once; one that is not served leaves after STAY */
export const CUSTOMERS_PER_PLAYER_PER_MIN = 0.6;
export const CUSTOMER_CAP = 15;
export const CUSTOMER_STAY_MS = 7 * 60_000;
/** the browser remembers that you are on the street (a time stamp, kept fresh while you are there): a refresh puts you right back instead of in your room */
export const STREET_RETURN_KEY = "6ix-on-street";
export const STREET_RETURN_MS = 90_000;
/** how often the browsers on the street ask the server to let customers turn up */
export const STREET_TICK_MS = 10_000;
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
/**
 * What the rich customers ask for: every drug there is, the common ones most often (the number is how often, out of the total).
 * They pay 3 times what the others do, and they are the only ones who buy the cali weed and the 芬太尼.
 */
export const RICH_WANTS: ReadonlyArray<readonly [string, number]> = [
  ["weed", 12], ["joint", 10], ["blunt", 8], ["mix", 8], ["midweed", 7], ["hash", 7], ["shroom", 7], ["superpill", 6],
  ["thca", 5], ["codeine", 4], ["ketamine", 5], ["percs", 5], ["heroin", 4], ["opium", 3], ["lsd", 4], ["dmt", 4], ["twocb", 4],
  ["joint_mid", 4], ["blunt_mid", 3], ["joint_thca", 3], ["joint_hash", 3], ["chudmix", 3], ["trollmix", 3],
  ["caliweed", 3], ["fentcn", 3], ["pinkweed", 2], ["brownweed", 2], ["natryger", 2], ["loudpack", 1],
  ["joint_cali", 2], ["blunt_cali", 1], ["joint_pink", 1], ["blunt_pink", 1], ["joint_brown", 1], ["blunt_brown", 1], ["joint_nat", 1], ["blunt_nat", 1], ["joint_loud", 1], ["blunt_loud", 1],
];
/** how many of the customers are rich (a hat, maybe a pet, 3x the price, any drug) */
export const RICH_CHANCE = 0.4;
const RICH_TOTAL = RICH_WANTS.reduce((n, [, w]) => n + w, 0);
export function richWant(roll: number): string {
  let left = roll * RICH_TOTAL;
  for (const [item, w] of RICH_WANTS) { left -= w; if (left < 0) return item; }
  return RICH_WANTS[0][0];
}
/** the pets a rich customer may have along (the rare ones) */
export const RICH_PETS = ["dragon", "curseddragon", "lion", "velociraptor", "demonmonkey", "dragondog", "rhino", "haloompa", "croco", "pigeonevil", "bunnyevil"] as const;
export const BIG_MULT = 3;
export const WALK_MULT = 2;

export interface Customer {
  k: number;
  kind: "walker" | "rich";
  /** when it turned up and when it leaves if nobody fills the order */
  at: number;
  until: number;
  want: Want;
  /** the sidewalk tile it stands on, and the side it came from (-1 = from the left end of the street, 1 = from the right) */
  x: number;
  y: number;
  from: 1 | -1;
  /** a number for the look (the clothes; a rich customer's hat and pet too) */
  look: number;
}
/** the rows the walking customers stand in (the two nearest the road) */
export const STREET_SIDEWALK_ROWS = [2, 9];
export const ROAD_ROWS = { first: 3, last: 8, lanes: [4, 7], curbs: [3, 8] };

/** a free sidewalk tile for a customer to stand on (not on a lamp or a tree) */
function spot(r: () => number, rich = false): { x: number; y: number } {
  // the rich customers stand on the front sidewalk (the bottom of the screen), in the half that is furthest from the door
  const rows = rich ? [9, 10] : STREET_SIDEWALK_ROWS;
  const lo = rich ? Math.floor(STREETS_W / 2) : 3, span = rich ? STREETS_W - 4 - lo : STREETS_W - 6;
  const pick = (): { x: number; y: number } => ({ x: lo + Math.floor(r() * span), y: rows[Math.floor(r() * rows.length)] });
  let p = pick();
  for (let tries = 0; tries < 30 && !isFreeTile(p.x, p.y); tries++) p = pick();
  return p;
}
/** the drugs worth 150 or more to the bagmand: a rich customer asks for fewer of them */
const BAGMAND_SELL_HINT: Record<string, number> = { heroin: 160, ketamine: 170, percs: 160, twocb: 180, caliweed: 255, fentcn: 330, pinkweed: 155, loudpack: 295, natryger: 200 };

/** The customer number k that turned up at `at`: always the same one for the same k, so every browser and the server agree on who they are and what they ask for. */
export function customerAt(k: number, at = 0): Customer {
  const r = seeded(k * 7919 + 13);
  const rich = r() < RICH_CHANCE; // (every one that was rich before still is)
  if (rich) { // a rich customer: a hat and maybe a pet, a little of any drug, and 3 times the price
    const item = richWant(r());
    const dear = (BAGMAND_SELL_HINT[item] ?? 0) >= 150;
    const want: Want = { item, qty: dear ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3), mult: BIG_MULT };
    const { x, y } = spot(r, true);
    return { k, kind: "rich", at, until: at + CUSTOMER_STAY_MS, want, x, y, from: r() < 0.5 ? -1 : 1, look: Math.floor(r() * 100000) };
  }
  const roll = r();
  let want: Want;
  if (roll < 0.5) want = { item: COMMON_WANTS[Math.floor(r() * COMMON_WANTS.length)], qty: 1 + Math.floor(r() * 2), mult: WALK_MULT }; // half of them: 1 or 2 of the common stuff
  else if (roll < 0.86) want = { item: COMMON_WANTS[Math.floor(r() * COMMON_WANTS.length)], qty: 3 + Math.floor(r() * 2), mult: WALK_MULT }; // 3 or 4 of it
  else want = { item: RARE_WANTS[Math.floor(r() * RARE_WANTS.length)], qty: 1 + Math.floor(r() * 2), mult: WALK_MULT }; // a little of something rare
  const { x: wx, y: row } = spot(r);
  return { k, kind: "walker", at, until: at + CUSTOMER_STAY_MS, want, x: wx, y: row, from: r() < 0.5 ? -1 : 1, look: Math.floor(r() * 100000) };
}
/** what a filled order pays: unit price x qty x mult, rounded up (`unit` = what 6ixty pays for one) */
export const orderPay = (unit: number, w: Want): number => Math.ceil(unit * w.qty * w.mult);

// ---- the knife fights (RuneScape Classic's rules for a player fight: a roll to hit, a roll for how hard, one fight at a time) -----------------------------
export const PVP = {
  maxHp: 10,
  /** how long you have to wait between two swings (3 game ticks of 0.6 s): a bandage uses up a swing too */
  swingMs: 1800,
  /** after a swing, the two of you are locked in a fight for this long (nobody else can join it): no riding the elevator, no walking out of the room */
  combatMs: 10_000,
  /** nobody can touch you for this long after you walk in */
  spawnProtectMs: 8_000,
  /** one hit point comes back this often */
  regenMs: 20_000,
  /** you reach two tiles (diagonals too): somebody who runs is followed, and hit as soon as they are within reach */
  reach: 2,
  /** a gun on the street: one shot per gun (it is spent), 0 up to this many hit points, and the next one can be fired this long after, from this far away */
  gunMaxDmg: 5,
  gunCooldownMs: 30_000,
  gunRange: 6,
  /** after a death you are sent home at once: you are out of the street, and the elevator is shut for you, this long; the others see your body for bodyMs */
  deathCoolMs: 30_000,
  bodyMs: 5_000,
  /** the bandage heals this much and can be used again after this long */
  healItem: "bandage",
  healHp: 3,
  healCooldownMs: 6_000,
  /** what happens to what you carry when you die: the killer takes it all (what does not fit lies where you died), except what can't be dropped, and 25 blood lands on the floor */
  loseOnDeath: true,
  deathBlood: 25,
} as const;
/** `foe` is who you are locked in a fight with while `combatUntil` lasts */
export interface StreetCombat { hp: number; at: number; combatUntil: number; healAt: number; protectUntil: number; kills: number; deaths: number; foe?: string }

/**
 * RuneScape Classic's numbers. Everybody fights at the same levels (nobody trains anything here), so what separates two players is the weapon and the luck of the rolls.
 *   to hit:   a roll up to (attack + 8) x (weapon aim + 64) for you, up to (defense + 8) x (armour + 64) for them: you land the swing when yours is higher
 *   how hard: a landed swing does 0 to max, where max = (strength + 8) x (weapon power + 64) / 640, rounded
 */
export const COMBAT_LEVELS = { attack: 30, strength: 40, defense: 20 } as const;
/** no armour on the street (yet) */
export const ARMOUR_BONUS = 0;
export const WEAPONS: Record<string, { aim: number; power: number }> = { knife: { aim: 6, power: 10 }, machete: { aim: 10, power: 28 } };
/** the weapon in a pocket that fights best (a machete over a knife), or null */
export function bestWeapon(inv: Array<{ item: string } | null | undefined>): string | null {
  let best: string | null = null;
  for (const it of inv) if (it && WEAPONS[it.item] && (!best || WEAPONS[it.item].power > WEAPONS[best].power)) best = it.item;
  return best;
}
const attackRoll = (weapon: string): number => (COMBAT_LEVELS.attack + 8) * (WEAPONS[weapon].aim + 64);
const defenseRoll = (): number => (COMBAT_LEVELS.defense + 8) * (ARMOUR_BONUS + 64);
/** the hardest a landed swing with this weapon can hit */
export const maxHitOf = (weapon: string): number => Math.floor(0.5 + ((COMBAT_LEVELS.strength + 8) * (WEAPONS[weapon].power + 64)) / 640);
/** the chance that a swing with this weapon lands (two rolls from 0 up to the attack and the defence number: the chance that the first is the higher) */
export function hitChanceOf(weapon: string): number {
  const a = attackRoll(weapon), d = defenseRoll();
  return a >= d ? 1 - d / (2 * a) : a / (2 * d);
}
/** one swing: does it land, and how many hit points it takes (a landed swing can still do 0: the same splash as a miss) */
export function swingRoll(weapon: string, rng: () => number = Math.random): { landed: boolean; dmg: number } {
  const landed = rng() * attackRoll(weapon) > rng() * defenseRoll();
  return { landed, dmg: landed ? Math.floor(rng() * (maxHitOf(weapon) + 1)) : 0 };
}
/** hit points now, with the ones that have come back since `at` */
export function hpNow(c: Pick<StreetCombat, "hp" | "at">, now: number): number {
  return Math.min(PVP.maxHp, c.hp + Math.floor(Math.max(0, now - c.at) / PVP.regenMs));
}

/** Everything that stands on the street: [id, kind, x, y, dir] (x runs down to the right, y down to the left; the road is rows 3-8, the sidewalks 0-2 at the back and 9-11 in front). Drawn for 25 tiles first, then spread over the (twice as long) street: two tiles apart where they stood one tile apart */
const BASE_PIECES: Array<[string, string, number, number, number]> = [
  // the back sidewalk: bins and cans, a dumpster, three market stalls, lamps and trees along the curb
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
/** where a piece of the 25 tile street stands in the 50 tile one (the first tiles stay: the door and where you arrive) */
const spreadX = (x: number): number => (x <= 2 ? x : x * 2 - 2);
export const STREET_PIECES: Array<[string, string, number, number, number]> = [
  ...BASE_PIECES.map(([id, kind, x, y, dir]): [string, string, number, number, number] => [id, kind, spreadX(x), y, dir]),
  // the second half of the street: the second crossing with its traffic light, more lamps, a phone box and a bench by the shops
  ["s_traf2", "st_traffic", 38, 9, 2], ["s_lampf4", "st_lamppost", 34, 9, 2], ["s_lampf5", "st_lamppost", 45, 9, 2], ["s_lamp4", "st_lamp", 36, 2, 4], ["s_lamp5", "st_lamp", 47, 2, 4],
];
/** what the admin has changed in the street (streets/furni/<id>): a piece moved or added, or one of the built-in pieces taken away (`removed`) */
export interface StreetOverride { kind?: string; x?: number; y?: number; dir?: number; removed?: boolean }
/** the street as it stands: the built-in pieces, with the admin's changes put on top */
export function mergeStreetPieces(over: Record<string, StreetOverride> | null | undefined): Array<[string, string, number, number, number]> {
  const o = over ?? {};
  const out: Array<[string, string, number, number, number]> = [];
  const known = new Set<string>();
  for (const [id, kind, x, y, dir] of STREET_PIECES) {
    known.add(id);
    const v = o[id];
    if (v?.removed) continue;
    out.push(v && Number.isFinite(v.x) && Number.isFinite(v.y) ? [id, v.kind ?? kind, v.x!, v.y!, v.dir ?? 0] : [id, kind, x, y, dir]);
  }
  for (const [id, v] of Object.entries(o)) if (!known.has(id) && !v?.removed && typeof v?.kind === "string" && Number.isFinite(v.x) && Number.isFinite(v.y)) out.push([id, v.kind, v.x!, v.y!, v.dir ?? 0]);
  return out;
}
/** is this one of the pieces that are part of the street (not one the admin added)? */
export const isBuiltInStreetPiece = (id: string): boolean => STREET_PIECES.some(([pid]) => pid === id);
/** the zebra crossings: where each one starts (tiles along the street; each is about 2 wide) */
export const CROSSINGS = [20.1, 40.1];
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
