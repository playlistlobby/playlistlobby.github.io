// Texas hold'em at a poker table (a piece of furniture in a player room or a hideout). Up to 5 sit around it; anybody in the room can sit down and buy in,
// and anybody can stand up and take what is in front of them. The server deals and decides everything (the rules are src/shared/poker.ts):
//   poker/<table>          = the table everybody watches (seats, stacks, bets, the board, whose turn it is)  [readable by all, written only here]
//   pokerHole/<table>/<uid> = your two cards (readable only by you, until the showdown shows them in the table)
//   pokerDeck/<table>      = the rest of the shuffled deck (nobody can read it)
//   pokerSeat/<uid>        = where you are sitting {room, fid} (so a refresh or a log in can stand you up from anywhere)
// <table> is "<room>_<piece id>". Time is kept lazily: anybody watching the table calls pokerTick when a deadline has passed (a player who took too long folds, the
// next street comes, the next hand is dealt, a player who is gone from the room is stood up).
import { Action, cheb, ID_RE, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import {
  act as playMove, leaveSeat, newTable, parsePoker, pokerKindOf, pokerToDb, POKER_GONE_MS, POKER_KINDS, POKER_SEATS, seatOfUid, startHand, tick as tickTable,
  type PokerCtx, type PokerMove, type PokerTable,
} from "../../../src/shared/poker";

const ROOM_RE = /^(u|h)_[A-Za-z0-9]{1,40}$/;

/** a fair whole number from 0 to n-1 */
function roll(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}
const shuffled = (): number[] => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = roll(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };

interface Loaded { room: string; fid: string; key: string; t: PokerTable | null; ctx: PokerCtx; before: Set<string> }
const keyOf = (room: string, fid: string): string => `${room}_${fid}`;

/** where the caller is sitting, from their pointer (null: nowhere) */
async function pointerOf(c: Ctx, uid: string): Promise<{ room: string; fid: string } | null> {
  const p = await c.db.get<{ room?: string; fid?: string }>(`pokerSeat/${uid}`);
  return p && typeof p.room === "string" && typeof p.fid === "string" && ROOM_RE.test(p.room) && ID_RE.test(p.fid) ? { room: p.room, fid: p.fid } : null;
}

/** the table as the database has it, with everybody's cards and the deck */
async function load(c: Ctx, room: string, fid: string): Promise<Loaded> {
  const key = keyOf(room, fid);
  const t = parsePoker(await c.db.get(`poker/${key}`));
  const ctx: PokerCtx = { deck: [], holes: {}, now: c.now };
  if (t) {
    const holes = (await c.db.get<Record<string, number[]>>(`pokerHole/${key}`)) ?? {};
    t.seats.forEach((s, i) => { const h = s ? holes[s.uid] : undefined; if (h && Array.isArray(h)) ctx.holes[i] = h.filter((x) => typeof x === "number"); });
    const deck = await c.db.get<number[]>(`pokerDeck/${key}`);
    ctx.deck = Array.isArray(deck) ? deck.filter((x) => typeof x === "number") : [];
  }
  return { room, fid, key, t, ctx, before: new Set((t?.seats ?? []).flatMap((s) => (s && !s.left ? [s.uid] : []))) };
}

/** writes the table back (and clears everything of an empty one); stands up whoever is no longer in it */
function save(c: Ctx, L: Loaded): void {
  const t = L.t!;
  const now = new Set(t.seats.flatMap((s) => (s && !s.left ? [s.uid] : [])));
  const any = t.seats.some((s) => !!s);
  for (const uid of L.before) if (!now.has(uid)) c.extra[`pokerSeat/${uid}`] = null;
  if (!any) {
    c.extra[`poker/${L.key}`] = null; c.extra[`pokerDeck/${L.key}`] = null; c.extra[`pokerHole/${L.key}`] = null;
    return;
  }
  c.extra[`poker/${L.key}`] = pokerToDb(t);
  c.extra[`pokerDeck/${L.key}`] = L.ctx.deck.length ? L.ctx.deck : null;
  const byUid: Record<string, number[]> = {};
  t.seats.forEach((s, i) => { if (s && L.ctx.holes[i]) byUid[s.uid] = L.ctx.holes[i]; });
  c.extra[`pokerHole/${L.key}`] = Object.keys(byUid).length ? byUid : null;
}

/** a hand needs a shuffled deck: give the context one whenever a hand may start */
const withDeck = (L: Loaded): void => { L.ctx.deck = shuffled(); };
/** plays out the time that has passed. A new hand starts with a fresh deck. */
function advance(L: Loaded): boolean {
  const t = L.t!;
  const before = t.hand;
  const saved = L.ctx.deck;
  if (t.phase === "over" || t.phase === "idle") withDeck(L); // (a new hand may start in here)
  const changed = tickTable(t, L.ctx);
  if (t.hand === before && t.phase !== "play") L.ctx.deck = saved; // no new hand came: the deck stays as it was
  return changed;
}

const tableLocks = async (c: Ctx, a: any): Promise<string[]> => {
  let room = a?.room, fid = a?.fid;
  if (typeof room !== "string" || typeof fid !== "string") { const p = await pointerOf(c, c.uid); if (!p) return []; room = p.room; fid = p.fid; }
  if (!ROOM_RE.test(room) || !ID_RE.test(fid)) return [];
  const t = parsePoker(await c.db.get(`poker/${keyOf(room, fid)}`));
  return [`poker:${keyOf(room, fid)}`, ...(t?.seats ?? []).flatMap((s) => (s ? [`user:${s.uid}`] : []))];
};

const figureOf = (w: { raw: any }): string => String(w.raw?.figure ?? "").slice(0, 200);
const nameOf = (w: { raw: any }): string => String(w.raw?.name ?? "?").slice(0, 30);

/** the table piece in that room: which kind, and where it stands */
async function pieceOf(c: Ctx, room: string, fid: string): Promise<{ kind: "std" | "hi"; x: number; y: number } | null> {
  const row = await c.db.get<{ kind?: string; x?: number; y?: number }>(`roomsMeta/${room}/furni/${fid}`);
  const kind = pokerKindOf(row?.kind);
  return row && kind && typeof row.x === "number" && typeof row.y === "number" ? { kind, x: row.x, y: row.y } : null;
}

/** blood back to somebody who stands up */
async function pay(c: Ctx, uid: string, amt: number): Promise<void> {
  if (amt <= 0) return;
  const w = await c.user(uid);
  w.s.blood += amt;
}

/** Sit down at an empty seat and buy in (the blood leaves your pocket and sits in front of you). */
export const pokerSit: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const pos = await requireInRoom(c, room);
    const piece = await pieceOf(c, room, fid);
    if (!piece) fail("There's no poker table there.");
    if (pos && cheb(pos, piece!) > 4) fail("Walk up to the table first.");
    const info = POKER_KINDS[piece!.kind];
    const seat = int(a.seat, 0, POKER_SEATS - 1, "seat");
    const buy = int(a.buy, info.min, info.max, "buy-in");
    const where = await pointerOf(c, c.uid);
    if (where) {
      const other = await load(c, where.room, where.fid);
      if (other.t && seatOfUid(other.t, c.uid) >= 0) fail(where.room === room && where.fid === fid ? "You're sitting at this table already." : "You're sitting at another table: stand up from it first.");
      c.extra[`pokerSeat/${c.uid}`] = null; // (an old pointer to a table you are no longer at)
    }
    const L = await load(c, room, fid);
    if (!L.t) L.t = newTable(piece!.kind);
    if (L.t.kind !== piece!.kind) fail("That table has changed.");
    advance(L);
    if (L.t.seats[seat]) fail("That seat is taken.");
    const w = await c.user();
    if (w.s.blood < buy) fail(`You need ${buy - w.s.blood} more blood.`);
    w.s.blood -= buy;
    L.t.seats[seat] = { uid: c.uid, name: nameOf(w), ...(figureOf(w) ? { figure: figureOf(w) } : {}), stack: buy, bet: 0, total: 0, in: false, folded: false, allin: false, acted: false };
    L.t.seq++;
    advance(L); // (the second player at an empty table starts the countdown to the first hand)
    save(c, L);
    c.extra[`pokerSeat/${c.uid}`] = { room, fid };
    c.note = `${piece!.kind} ${buy}`;
    return { seat };
  },
};

/** Your move: fold, check, call, raise (to a total bet), or all in. */
export const pokerAct: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const move = text(a.move, /^(fold|check|call|raise|allin)$/, "move") as PokerMove;
    const L = await load(c, room, fid);
    if (!L.t) fail("There's no game here.");
    const seat = seatOfUid(L.t!, c.uid);
    if (seat < 0) fail("You aren't sitting at this table.");
    advance(L);
    const err = playMove(L.t!, seat, move, a.to === undefined ? undefined : Number(a.to), L.ctx);
    if (err) fail(err);
    advance(L);
    save(c, L);
    return {};
  },
};

/** Stand up and take what is in front of you. In the middle of a hand you fold first (what you put into the pot stays there). Works from anywhere. */
export const pokerLeave: Action = {
  locks: tableLocks,
  async run(c, a) {
    let room: string, fid: string;
    if (typeof a?.room === "string" && typeof a?.fid === "string") { room = text(a.room, ROOM_RE, "room"); fid = text(a.fid, ID_RE, "table"); }
    else { const p = await pointerOf(c, c.uid); if (!p) return {}; room = p.room; fid = p.fid; }
    const L = await load(c, room, fid);
    const seat = L.t ? seatOfUid(L.t, c.uid) : -1;
    if (!L.t || seat < 0) { c.extra[`pokerSeat/${c.uid}`] = null; return {}; }
    advance(L);
    const s2 = seatOfUid(L.t, c.uid); // (the timers may have moved things: a seat that was cleared is no longer there)
    let take = 0;
    if (s2 >= 0) take = leaveSeat(L.t, s2, L.ctx);
    advance(L);
    const w = await c.user();
    w.s.blood += take;
    save(c, L);
    c.extra[`pokerSeat/${c.uid}`] = null;
    c.note = String(take);
    return { take };
  },
};

/**
 * Anybody watching the table can call this when a deadline has passed (it does nothing when no time is up): a player who took too long folds (or checks),
 * the next card comes, the next hand is dealt. A player who is not in the room any more (a refresh, a log out) is stood up after 20 seconds, with their blood.
 * A table whose piece was picked up gives everybody their blood back.
 */
export const pokerTick: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const L = await load(c, room, fid);
    if (!L.t) return {};
    const t = L.t;
    const piece = await pieceOf(c, room, fid);
    let changed = false;
    if (!piece || piece.kind !== t.kind) { // the table is gone: everybody takes their blood and goes
      for (let i = 0; i < POKER_SEATS; i++) {
        const s = t.seats[i];
        if (s) { await pay(c, s.uid, s.stack); s.stack = 0; t.seats[i] = null; }
      }
      save(c, L);
      return { closed: true };
    }
    for (let i = 0; i < POKER_SEATS; i++) { // who is gone
      const s = t.seats[i];
      if (!s || s.left) continue;
      const here = !!(await c.db.get(`rooms/${room}/players/${s.uid}`));
      if (here && s.gone !== undefined) { delete s.gone; changed = true; }
      else if (!here && s.gone === undefined) { s.gone = c.now; changed = true; }
      else if (!here && c.now - s.gone! >= POKER_GONE_MS) {
        const take = leaveSeat(t, i, L.ctx);
        await pay(c, s.uid, take);
        changed = true;
      }
    }
    if (advance(L)) changed = true;
    if (changed) save(c, L);
    return { changed };
  },
};
