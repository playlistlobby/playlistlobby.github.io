// Blackjack at the blue table (a piece of furniture in a hideout or a player room). Up to 5 players sit down and bet against a dealer: a member of the hideout (in a
// player's own room: the owner) who sits down as the dealer with a bank of their own blood. The dealer does the clicks (open a round, deal, turn the hidden card, draw, pay),
// the server checks every one of them (src/shared/blackjack.ts has the rules).
//   blackjack/<table>   = the table everybody watches                                [readable by all, written only here]
//   bjHole/<table>      = the dealer's face-down card                                 [readable by the dealer only]
//   bjDeck/<table>      = the rest of the shuffled deck                               [nobody can read it]
//   bjSeat/<uid>        = where you sit (as a player or the dealer) {room, fid, dealer?}
// <table> is "<room>_<piece id>". Time is kept lazily: anybody watching calls bjTick when a deadline has passed.
import { Action, cheb, ID_RE, int, requireHideoutMember, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import {
  bankCovers, bjSeatOfUid, bjStakes, bjTick, bjToDb, BJ_AUTO_OPEN, BJ_BANK_MAX, BJ_BANK_MIN, BJ_GONE_MS, BJ_SEATS, dealerDraw, deal, newBjTable, openRound, parseBj, placeBet, playerMove, reveal, settle, voidRound,
  type BjCtx, type BjTable,
} from "../../../src/shared/blackjack";
import { isHideoutId } from "../../../src/shared/hideout";
import { isEmulator } from "../env";

const ROOM_RE = /^(u|h)_[A-Za-z0-9]{1,40}$/;

function roll(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}
const shuffled = (): number[] => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = roll(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };

interface Loaded { room: string; fid: string; key: string; t: BjTable | null; ctx: BjCtx; before: Set<string>; phase: BjTable["phase"] }
const keyOf = (room: string, fid: string): string => `${room}_${fid}`;
const uidsOf = (t: BjTable | null): string[] => (t ? [...(t.dealer ? [t.dealer.uid] : []), ...t.seats.flatMap((s) => (s && !s.left ? [s.uid] : []))] : []);

async function pointerOf(c: Ctx, uid: string): Promise<{ room: string; fid: string; dealer?: boolean } | null> {
  const p = await c.db.get<{ room?: string; fid?: string; dealer?: boolean }>(`bjSeat/${uid}`);
  return p && typeof p.room === "string" && typeof p.fid === "string" && ROOM_RE.test(p.room) && ID_RE.test(p.fid) ? { room: p.room, fid: p.fid, ...(p.dealer ? { dealer: true } : {}) } : null;
}

async function load(c: Ctx, room: string, fid: string): Promise<Loaded> {
  const key = keyOf(room, fid);
  const t = parseBj(await c.db.get(`blackjack/${key}`));
  const ctx: BjCtx = { deck: [], hole: null, now: c.now };
  if (t) {
    const hole = await c.db.get<number>(`bjHole/${key}`);
    ctx.hole = typeof hole === "number" ? hole : null;
    const deck = await c.db.get<number[]>(`bjDeck/${key}`);
    ctx.deck = Array.isArray(deck) ? deck.filter((x) => typeof x === "number") : [];
  }
  return { room, fid, key, t, ctx, before: new Set(uidsOf(t)), phase: t?.phase ?? "idle" };
}

function save(c: Ctx, L: Loaded): void {
  const t = L.t!;
  const now = new Set(uidsOf(t));
  for (const uid of L.before) if (!now.has(uid)) c.extra[`bjSeat/${uid}`] = null;
  if (!t.dealer && !t.seats.some((s) => !!s)) {
    c.extra[`blackjack/${L.key}`] = null; c.extra[`bjHole/${L.key}`] = null; c.extra[`bjDeck/${L.key}`] = null;
    return;
  }
  c.extra[`blackjack/${L.key}`] = bjToDb(t);
  c.extra[`bjHole/${L.key}`] = L.ctx.hole != null && t.hole ? L.ctx.hole : null;
  c.extra[`bjDeck/${L.key}`] = L.ctx.deck.length ? L.ctx.deck : null;
}

const tableLocks = async (c: Ctx, a: any): Promise<string[]> => {
  let room = a?.room, fid = a?.fid;
  if (typeof room !== "string" || typeof fid !== "string") { const p = await pointerOf(c, c.uid); if (!p) return []; room = p.room; fid = p.fid; }
  if (!ROOM_RE.test(room) || !ID_RE.test(fid)) return [];
  const t = parseBj(await c.db.get(`blackjack/${keyOf(room, fid)}`));
  return [`bj:${keyOf(room, fid)}`, ...[...(t?.dealer ? [t.dealer.uid] : []), ...(t?.seats ?? []).flatMap((s) => (s ? [s.uid] : []))].map((u) => `user:${u}`)]; // (a player who stood up mid-round is still paid)
};

const figureOf = (w: { raw: any }): string => String(w.raw?.figure ?? "").slice(0, 200);
const nameOf = (w: { raw: any }): string => String(w.raw?.name ?? "?").slice(0, 30);

async function pieceOf(c: Ctx, room: string, fid: string): Promise<{ x: number; y: number } | null> {
  const row = await c.db.get<{ kind?: string; x?: number; y?: number }>(`roomsMeta/${room}/furni/${fid}`);
  return row?.kind === "f_blackjacktable" && typeof row.x === "number" && typeof row.y === "number" ? { x: row.x, y: row.y } : null;
}
async function pay(c: Ctx, uid: string, amt: number): Promise<void> {
  if (amt <= 0) return;
  const w = await c.user(uid);
  w.s.blood += amt;
}
/** the dealer of a table in a hideout is one of its members; in a player's own room, that player */
async function requireMayDeal(c: Ctx, room: string): Promise<void> {
  if (isHideoutId(room)) await requireHideoutMember(c, room);
  else if (room !== `u_${c.uid}` && !c.isAdmin) fail("Only the owner of the room can deal here.");
}

/** when the round has just ended (the dealer paid, or the server did): everybody gets what the rules say */
async function payOut(c: Ctx, L: Loaded): Promise<void> {
  const t = L.t!;
  if (L.phase === "over" || t.phase !== "over") return;
  for (const s of t.seats) if (s && (s.back ?? 0) > 0) await pay(c, s.uid, s.back!);
  L.phase = "over";
}
/** plays out the time that has passed (a fresh deck when a round may be dealt) */
async function advance(c: Ctx, L: Loaded): Promise<boolean> {
  const t = L.t!;
  const saved = L.ctx.deck;
  if (t.phase === "betting") L.ctx.deck = shuffled();
  const changed = bjTick(t, L.ctx);
  if (t.phase !== "players" && t.phase !== "dealer" && t.phase !== "over") L.ctx.deck = saved.length ? saved : L.ctx.deck;
  await payOut(c, L);
  return changed;
}

/** a player sits down at a seat */
export const bjSit: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const pos = await requireInRoom(c, room);
    const piece = await pieceOf(c, room, fid);
    if (!piece) fail("There's no blackjack table there.");
    if (pos && cheb(pos, piece!) > 4) fail("Walk up to the table first.");
    const seat = int(a.seat, 0, BJ_SEATS - 1, "seat");
    const where = await pointerOf(c, c.uid);
    if (where) {
      const other = await load(c, where.room, where.fid);
      if (other.t && (other.t.dealer?.uid === c.uid || bjSeatOfUid(other.t, c.uid) >= 0)) fail("You're at a table already: leave it first.");
      c.extra[`bjSeat/${c.uid}`] = null;
    }
    const L = await load(c, room, fid);
    if (!L.t) L.t = newBjTable();
    if (L.t.dealer?.uid === c.uid) fail("You are the dealer here.");
    await advance(c, L);
    if (L.t.seats[seat]) fail("That seat is taken.");
    const w = await c.user();
    L.t.seats[seat] = { uid: c.uid, name: nameOf(w), ...(figureOf(w) ? { figure: figureOf(w) } : {}), bet: 0, cards: [], state: "wait" };
    L.t.seq++;
    save(c, L);
    c.extra[`bjSeat/${c.uid}`] = { room, fid };
    return { seat };
  },
};

/** put your bet down for this round (the blood leaves your pocket) */
export const bjBet: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const L = await load(c, room, fid);
    if (!L.t) fail("There's no game here.");
    const seat = bjSeatOfUid(L.t!, c.uid);
    if (seat < 0) fail("You aren't sitting at this table.");
    const amount = int(a.amount, 1, 100000, "bet");
    const w = await c.user();
    if (w.s.blood < amount) fail("You don't have that much blood.");
    const err = placeBet(L.t!, seat, amount, c.now);
    if (err) fail(err);
    w.s.blood -= amount;
    save(c, L);
    c.note = String(amount);
    return {};
  },
};

/** hit, stand or double */
export const bjAct: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const move = text(a.move, /^(hit|stand|double)$/, "move") as "hit" | "stand" | "double";
    const L = await load(c, room, fid);
    if (!L.t) fail("There's no game here.");
    const seat = bjSeatOfUid(L.t!, c.uid);
    if (seat < 0) fail("You aren't sitting at this table.");
    await advance(c, L);
    const s = L.t!.seats[seat];
    const extra = move === "double" && s ? s.bet : 0;
    const w = await c.user();
    if (extra && w.s.blood < extra) fail("You don't have enough blood to double.");
    const err = playerMove(L.t!, seat, move, L.ctx);
    if (err) fail(err);
    w.s.blood -= extra;
    save(c, L);
    return {};
  },
};

/** stand up (a player between rounds or before the cards; the dealer takes the bank and goes, the round is called off and every bet comes back) */
async function leaveTable(c: Ctx, L: Loaded, uid: string): Promise<number> {
  const t = L.t!;
  let take = 0;
  if (t.dealer?.uid === uid) {
    if (t.phase === "betting" || t.phase === "players" || t.phase === "dealer") { // the round is called off: the bets go back
      const back = voidRound(t);
      for (const [i, amt] of Object.entries(back)) { const s = t.seats[Number(i)]; if (s) await pay(c, s.uid, amt); }
    }
    take = t.bank; t.bank = 0; t.dealer = null; t.auto = undefined; t.phase = t.phase === "over" ? "over" : "idle"; t.seq++;
    await pay(c, uid, take);
    return take;
  }
  const i = bjSeatOfUid(t, uid);
  if (i < 0) return 0;
  const s = t.seats[i]!;
  if (s.bet > 0 && (t.phase === "players" || t.phase === "dealer")) { // in the middle of a round: the hand is played on (they stand) and paid; the seat goes after
    s.left = true;
    if (t.turn === i) playerMove(t, i, "stand", L.ctx);
  } else {
    if (s.bet > 0 && t.phase === "betting") { await pay(c, uid, s.bet); }
    t.seats[i] = null;
  }
  t.seq++;
  return 0;
}

export const bjLeave: Action = {
  locks: tableLocks,
  async run(c, a) {
    let room: string, fid: string;
    if (typeof a?.room === "string" && typeof a?.fid === "string") { room = text(a.room, ROOM_RE, "room"); fid = text(a.fid, ID_RE, "table"); }
    else { const p = await pointerOf(c, c.uid); if (!p) return {}; room = p.room; fid = p.fid; }
    const L = await load(c, room, fid);
    if (!L.t || (L.t.dealer?.uid !== c.uid && bjSeatOfUid(L.t, c.uid) < 0)) { c.extra[`bjSeat/${c.uid}`] = null; return {}; }
    await advance(c, L);
    const take = await leaveTable(c, L, c.uid);
    await advance(c, L);
    save(c, L);
    c.extra[`bjSeat/${c.uid}`] = null;
    return { take };
  },
};

/** the dealer's clicks: sit (with a bank), open a round, deal, reveal the hidden card, draw, settle (pay), leave */
export const bjDealer: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const op = text(a.op, /^(sit|leave|open|deal|reveal|draw|settle|auto)$/, "click");
    if (op === "sit") {
      const pos = await requireInRoom(c, room);
      await requireMayDeal(c, room);
      const piece = await pieceOf(c, room, fid);
      if (!piece) fail("There's no blackjack table there.");
      if (pos && cheb(pos, piece!) > 4) fail("Walk up to the table first.");
      const bank = int(a.bank, BJ_BANK_MIN, BJ_BANK_MAX, "bank");
      const where = await pointerOf(c, c.uid);
      if (where) {
        const other = await load(c, where.room, where.fid);
        if (other.t && (other.t.dealer?.uid === c.uid || bjSeatOfUid(other.t, c.uid) >= 0)) fail("You're at a table already: leave it first.");
        c.extra[`bjSeat/${c.uid}`] = null;
      }
      const L = await load(c, room, fid);
      if (!L.t) L.t = newBjTable();
      if (L.t.dealer) fail("There is a dealer already.");
      if (bjSeatOfUid(L.t, c.uid) >= 0) fail("You're sitting as a player here.");
      const w = await c.user();
      if (w.s.blood < bank) fail("You don't have that much blood.");
      w.s.blood -= bank;
      L.t.dealer = { uid: c.uid, name: nameOf(w), ...(figureOf(w) ? { figure: figureOf(w) } : {}) };
      L.t.auto = undefined;
      L.t.bank = bank; L.t.phase = "idle"; L.t.dealerAt = c.now; L.t.seq++;
      save(c, L);
      c.extra[`bjSeat/${c.uid}`] = { room, fid, dealer: true };
      c.note = `bank ${bank}`;
      return {};
    }
    const L = await load(c, room, fid);
    if (!L.t || L.t.dealer?.uid !== c.uid) fail("You aren't the dealer here.");
    const t = L.t!;
    await advance(c, L);
    if (op === "leave") {
      const take = await leaveTable(c, L, c.uid);
      save(c, L);
      c.extra[`bjSeat/${c.uid}`] = null;
      return { take };
    }
    let err: string | null = null;
    if (op === "open") err = openRound(t, c.now);
    else if (op === "deal") { L.ctx.deck = shuffled(); err = deal(t, L.ctx); }
    else if (op === "reveal") err = reveal(t, L.ctx);
    else if (op === "draw") err = dealerDraw(t, L.ctx);
    else if (op === "settle") err = settle(t, c.now);
    else if (op === "auto") { // the auto-deal switch: the table plays the dealer's clicks itself (see bjTick), until it is switched off
      if (!BJ_AUTO_OPEN && !isEmulator(c.env)) fail("Unknown action.");
      t.auto = a.on === true ? true : undefined;
      t.seq++;
    }
    if (err) fail(err);
    if (op !== "auto") t.dealerAt = c.now;
    await payOut(c, L);
    save(c, L);
    return {};
  },
};

/** anybody watching: a player who took too long stands, an idle dealer has the next click made, the result goes away; people who left the room are stood up; a table whose piece is gone is closed */
export const bjTickAction: Action = {
  locks: tableLocks,
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const fid = text(a.fid, ID_RE, "table");
    const L = await load(c, room, fid);
    if (!L.t) return {};
    const t = L.t;
    let changed = false;
    const piece = await pieceOf(c, room, fid);
    if (!piece) { // the table is gone: the round is called off and everybody takes their blood
      if (t.dealer) await leaveTable(c, L, t.dealer.uid);
      for (let i = 0; i < BJ_SEATS; i++) { const s = t.seats[i]; if (s) { if (s.bet > 0 && !s.result) await pay(c, s.uid, s.bet); t.seats[i] = null; } }
      save(c, L);
      return { closed: true };
    }
    const check = [...t.seats.flatMap((s, i) => (s && !s.left ? [{ uid: s.uid, seat: i }] : [])), ...(t.dealer ? [{ uid: t.dealer.uid, seat: -1 }] : [])];
    for (const who of check) {
      const here = !!(await c.db.get(`rooms/${room}/players/${who.uid}`));
      const s = who.seat >= 0 ? t.seats[who.seat] : null;
      if (who.seat >= 0 && s) {
        if (here && s.gone !== undefined) { delete s.gone; changed = true; }
        else if (!here && s.gone === undefined) { s.gone = c.now; changed = true; }
        else if (!here && c.now - s.gone! >= BJ_GONE_MS) { await leaveTable(c, L, who.uid); changed = true; }
      } else if (who.seat < 0 && !here) { // (the dealer is not in the room: they have the same 20 seconds, kept in dealerAt's neighbour: bank is paid back when they are gone for good)
        const key = `bjDealerGone/${L.key}`;
        const since = await c.db.get<number>(key);
        if (typeof since !== "number") c.extra[key] = c.now;
        else if (c.now - since >= BJ_GONE_MS) { await leaveTable(c, L, who.uid); c.extra[key] = null; changed = true; }
      } else if (who.seat < 0 && here) c.extra[`bjDealerGone/${L.key}`] = null;
    }
    if (await advance(c, L)) changed = true;
    if (changed) save(c, L);
    return { changed };
  },
};
void bankCovers; void bjStakes;
