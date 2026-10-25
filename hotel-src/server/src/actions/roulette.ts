// Russian roulette at the basement's table: one player sits down and puts blood on the table, a second one sits down and matches it, and they take turns
// pulling the trigger of a six-chamber revolver with one bullet. Every pull is a roll (1 in 6, then 1 in 5 ... the sixth is a sure thing). Whoever the bullet
// finds is dead; the other one takes both stakes. The blood of a game sits on the table (taken from the players when they sit down), so nothing is ever created or lost.
//   rooms/lobby/roulette = RouletteState (src/shared/roulette.ts): the browsers watch it and play every pull, the shot, the blood and the winnings off it.
// The stakes count against the same 24 hour limit as trades (TRADE_BLOOD_CAP), so two accounts can't use the table to pass blood around it.
import { Action, int, requireInRoom } from "./util";
import { Ctx, fail } from "../ctx";
import { TRADE_BLOOD_CAP, TRADE_BLOOD_WINDOW_MS, tradeBloodLeft } from "../../../src/shared/economy";
import { parseRoulette, rouletteExpired, rouletteHas, ROULETTE_CHAMBERS, ROULETTE_GONE_MS, ROULETTE_MAX, ROULETTE_TURN_MS, type RouletteState } from "../../../src/shared/roulette";

const PATH = "rooms/lobby/roulette";

/** counts a stake against the player's 24 hour blood limit (or says no) */
function useLimit(c: Ctx, w: { s: { tradeCap: { at: number; n: number }; noTradeLimit?: boolean } }, stake: number): void {
  const left = tradeBloodLeft(w.s, c.now);
  if (stake > left) fail(`You can only put ${left} more blood into trades and games for now (the limit is ${TRADE_BLOOD_CAP} per 24 hours).`);
  const fresh = c.now - w.s.tradeCap.at >= TRADE_BLOOD_WINDOW_MS;
  if (!w.s.noTradeLimit) w.s.tradeCap = { at: fresh ? c.now : w.s.tradeCap.at, n: (fresh ? 0 : w.s.tradeCap.n) + stake };
}

/** a fair whole number from 0 to n-1 */
function roll(n: number): number {
  if (n <= 1) return 0;
  const limit = Math.floor(0x1_0000_0000 / n) * n; // (throw away the top sliver so every number is equally likely)
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}

/** the table as it is now (a finished game that has been shown long enough is cleared away) */
async function table(c: Ctx): Promise<RouletteState | null> {
  const st = parseRoulette(await c.db.get(PATH));
  if (st && rouletteExpired(st, c.now)) { c.extra[PATH] = null; return null; }
  return st;
}

/** what a player looks like, for the chair they leave behind if they are disconnected */
const figureOf = (w: { raw: any }): string => String(w.raw?.figure ?? "").slice(0, 200);

/** in the basement and sitting down? */
async function seated(c: Ctx, uid: string): Promise<boolean> {
  const node = await c.db.get<{ sit?: boolean }>(`rooms/lobby/players/${uid}`);
  return !!node && node.sit === true;
}

/** the game is over: the winner takes both stakes (the loser's was taken when they sat down) */
async function finish(c: Ctx, st: RouletteState, winner: string, rest: Partial<RouletteState>): Promise<void> {
  const w = await c.user(winner);
  w.s.blood += st.stake * 2;
  c.note = String(st.stake); // (the blood ledger says how much was on the table)
  const { turn: _turn, turnAt: _turnAt, gone: _gone, ...keep } = st;
  c.extra[PATH] = { ...keep, status: "over", winner, at: c.now, endAt: c.now, seq: st.seq + 1, ...rest };
}

/** one pull of the trigger by `by` (their own, or the server's when they took too long) */
async function pull(c: Ctx, st: RouletteState, by: string): Promise<{ dead: boolean }> {
  const other = st.a.uid === by ? st.b!.uid : st.a.uid;
  const k = st.shots + 1;
  const dead = roll(ROULETTE_CHAMBERS - st.shots) === 0; // (on the sixth pull there is one chamber left: it is always the bullet)
  const last = { by, dead, k, at: c.now };
  if (dead) await finish(c, st, other, { dead: by, shots: k, last });
  else c.extra[PATH] = { ...st, shots: k, turn: other, turnAt: c.now, seq: st.seq + 1, last, gone: undefined };
  return { dead };
}

/** somebody got up (or is gone): a waiting stake goes back to its owner, a game in progress is lost by whoever left */
async function walkAway(c: Ctx, st: RouletteState, uid: string): Promise<void> {
  if (st.status === "waiting") {
    (await c.user(st.a.uid)).s.blood += st.stake;
    c.extra[PATH] = null;
  } else if (st.status === "playing") {
    const winner = st.a.uid === uid ? st.b!.uid : st.a.uid;
    await finish(c, st, winner, { forfeit: true });
  }
}

const tableLocks = async (c: Ctx): Promise<string[]> => {
  const st = parseRoulette(await c.db.get(PATH));
  return ["roulette", ...(st ? [`user:${st.a.uid}`, ...(st.b ? [`user:${st.b.uid}`] : [])] : [])];
};

/** Sit down first: name the stake. The blood goes on the table. */
export const rouletteOpen: Action = {
  locks: tableLocks,
  async run(c, a) {
    await requireInRoom(c, "lobby");
    if (!(await seated(c, c.uid))) fail("Sit down at the table first.");
    const stake = int(a.stake, 1, ROULETTE_MAX, "amount");
    const seat = int(a.seat ?? 0, 0, 1, "seat") as 0 | 1;
    const st = await table(c);
    if (st) fail(rouletteHas(st, c.uid) && st.status === "waiting" ? "You already have blood on the table." : "The table is in use.");
    const w = await c.user();
    if (w.s.blood < stake) fail("You don't have that much blood.");
    useLimit(c, w, stake);
    w.s.blood -= stake;
    c.extra[PATH] = { status: "waiting", stake, a: { uid: c.uid, name: String(w.raw?.name ?? "?").slice(0, 30), figure: figureOf(w), seat }, at: c.now, shots: 0, seq: 0 };
    return { stake };
  },
};

/** Sit down second and say yes: the same amount goes on the table and the game begins (the server picks who holds the gun first). */
export const rouletteJoin: Action = {
  locks: tableLocks,
  async run(c, a) {
    await requireInRoom(c, "lobby");
    if (!(await seated(c, c.uid))) fail("Sit down at the table first.");
    const st = await table(c);
    if (!st || st.status !== "waiting") fail("There's no game to join.");
    const open = st!;
    if (open.a.uid === c.uid) fail("That's your own stake.");
    const seat = int(a.seat ?? (open.a.seat === 0 ? 1 : 0), 0, 1, "seat") as 0 | 1;
    if (open.a.seat === seat) fail("That chair is taken.");
    if (!(await seated(c, open.a.uid))) { await walkAway(c, open, open.a.uid); return { gone: true }; } // the one who named the stake got up: their blood goes back
    const w = await c.user();
    if (w.s.blood < open.stake) fail("You don't have that much blood.");
    useLimit(c, w, open.stake);
    w.s.blood -= open.stake;
    const b = { uid: c.uid, name: String(w.raw?.name ?? "?").slice(0, 30), figure: figureOf(w), seat };
    const first = roll(2) === 0 ? open.a.uid : c.uid;
    c.extra[PATH] = { ...open, status: "playing", b, at: c.now, shots: 0, turn: first, turnAt: c.now, seq: open.seq + 1, gone: undefined };
    return { first };
  },
};

/** Stand up from the table: a stake nobody matched comes back, a game in progress is lost. */
export const rouletteLeave: Action = {
  locks: tableLocks,
  async run(c) {
    const st = await table(c);
    if (!st || !rouletteHas(st, c.uid) || st.status === "over") return {};
    if (st.status === "waiting" && st.a.uid !== c.uid) return {};
    await walkAway(c, st, c.uid);
    return { left: true };
  },
};

/** Your turn: pull the trigger. */
export const roulettePull: Action = {
  locks: tableLocks,
  async run(c) {
    const st = await table(c);
    if (!st || st.status !== "playing" || !st.b) fail("There's no game going.");
    const play = st!;
    if (play.turn !== c.uid) fail("It isn't your turn.");
    return pull(c, play, c.uid);
  },
};

/**
 * Anybody in the basement can call this now and then: it keeps the table honest. A stake whose owner is gone is given back, a game with somebody gone
 * for 12 seconds (a refresh, a log out: they can come back and are put in their chair again) is lost by them, and somebody who sits with the gun for 25 seconds has the trigger pulled for them.
 */
export const rouletteTick: Action = {
  locks: tableLocks,
  async run(c) {
    await requireInRoom(c, "lobby");
    const st = await table(c);
    if (!st || st.status === "over") return {};
    const gone: Record<string, number> = { ...(st.gone ?? {}) };
    let changed = false;
    let turnAt = st.turnAt ?? st.at;
    for (const uid of [st.a.uid, st.b?.uid]) {
      if (!uid) continue;
      const here = await seated(c, uid);
      if (!here && gone[uid] === undefined) { gone[uid] = c.now; changed = true; }
      else if (here && gone[uid] !== undefined) {
        delete gone[uid]; changed = true;
        if (st.turn === uid) turnAt = c.now; // somebody who came back to the gun gets its clock afresh
      }
    }
    for (const [uid, since] of Object.entries(gone)) {
      if (c.now - since >= ROULETTE_GONE_MS) { await walkAway(c, st, uid); return { cleared: true }; }
    }
    // nobody pulls the trigger for somebody who is away: they have their 12 seconds to come back first
    if (st.status === "playing" && st.turn && gone[st.turn] === undefined && c.now - turnAt >= ROULETTE_TURN_MS) return { auto: true, ...(await pull(c, st, st.turn)) };
    if (changed) c.extra[PATH] = { ...st, turnAt: st.status === "playing" ? turnAt : st.turnAt, gone: Object.keys(gone).length ? gone : undefined };
    return {};
  },
};
