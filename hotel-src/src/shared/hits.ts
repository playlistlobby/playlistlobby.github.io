// Hits: a hideout puts blood on somebody's head (from the hitman site on the hideout computer), and anybody with a gun can claim it by shooting them. The gun is a one-use item
// (bagmand sells it, the bins and the boxes give it). Pure rules shared by the browser and the server (server/src/actions/hits.ts does the placing and the shooting).
//   hits/<id>          an open hit: { target, targetName, amount, by, byName, hideout, hideoutName, at } (readable by everybody: the wanted board and the heads show it; written only by the server)
//   hitLog/<target>    when hits were put on this player (the last few): a player can be the target of 3 hits a day
//   hitCool/<owner>    when a hideout last put a hit on somebody: a hideout can put one hit every 3 hours

export const HIT_MIN = 500;
export const HIT_MAX = 1500;
/** a hideout may put one hit on somebody's head this often */
export const HIT_HIDEOUT_COOLDOWN_MS = 3 * 3_600_000;
/** a player can be the target of this many hits in a day (24 hours) */
export const HIT_PERSON_MAX = 3;
export const HIT_PERSON_WINDOW_MS = 24 * 3_600_000;
/** what the gun costs at bagmand's (one per player per visit) */
export const GUN_PRICE = 250;
/** how far away (in tiles) somebody can be shot */
export const SHOT_RANGE = 8;

export interface Hit { id: string; target: string; targetName: string; amount: number; by: string; byName: string; hideout: string; hideoutName: string; at: number }

/**
 * What a shot costs the one who is hit, and how long they are dead for. With a hit on them: they drop 20 blood (100 with more than 1000, 200 with more than 5000) and are dead for a minute.
 * Without one: they drop 5 (10 / 25) and are dead for 10 seconds. The blood falls on the floor where they stood.
 */
export function shotLoss(blood: number, hasHit: boolean): { drop: number; secs: number } {
  const b = Math.max(0, Math.floor(blood));
  const want = hasHit ? (b > 5000 ? 200 : b > 1000 ? 100 : 20) : (b > 5000 ? 25 : b > 1000 ? 10 : 5);
  return { drop: Math.min(want, b), secs: hasHit ? 60 : 10 };
}

/** the open hits turned into a list per target: the biggest bounty (what a shot claims) and how many there are */
export function bountiesOf(hits: Iterable<Hit>): Map<string, { name: string; amount: number; count: number }> {
  const out = new Map<string, { name: string; amount: number; count: number }>();
  for (const h of hits) {
    const cur = out.get(h.target);
    if (!cur) out.set(h.target, { name: h.targetName, amount: h.amount, count: 1 });
    else { cur.count++; if (h.amount > cur.amount) cur.amount = h.amount; }
  }
  return out;
}

const str = (v: unknown, n = 40): string => String(v ?? "").slice(0, n);
export function parseHits(v: any): Hit[] {
  if (!v || typeof v !== "object") return [];
  const out: Hit[] = [];
  for (const [id, h] of Object.entries<any>(v)) {
    if (!h || typeof h.target !== "string" || typeof h.amount !== "number") continue;
    out.push({ id, target: h.target, targetName: str(h.targetName, 30), amount: h.amount, by: str(h.by), byName: str(h.byName, 30), hideout: str(h.hideout), hideoutName: str(h.hideoutName, 40), at: typeof h.at === "number" ? h.at : 0 });
  }
  return out.sort((a, b) => b.amount - a.amount || a.at - b.at);
}

/**
 * The rocket launcher (one player has it: Alex). It is not used up: it can be fired every 30 minutes. Whoever is hit is dead for 30 seconds, drops no blood, and says the line below in the chat.
 */
export const ROCKET_COOLDOWN_MS = 30 * 60_000;
export const ROCKET_SECS = 30;
export const ROCKET_LINE = "Jeg er en goy og alex er en chad";
