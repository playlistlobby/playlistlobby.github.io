// Texas hold'em for up to 5 players around a poker table: the rules, the hand ranking and the table's state. Pure: the server plays the hands with it
// (server/src/actions/poker.ts) and the browsers only read what the server writes (poker/<table>) and show it.
// Blood on the table is the players' stacks: buying in takes it from their pockets, standing up gives it back, the winner of a pot takes the pot. Nothing is made or lost.

export const POKER_SEATS = 5;
export type PokerKind = "std" | "hi";
export interface PokerKindInfo { label: string; min: number; max: number; sb: number; bb: number; /** the most the owner's cut of one pot can be */ rakeCap: number }
/** the two tables: the normal one (buy in for 25 to 300, blinds 5/10: 2.5 to 30 big blinds) and the high stakes one (500 to 2000, blinds 20/40: 12.5 to 50 big blinds) */
export const POKER_KINDS: Record<PokerKind, PokerKindInfo> = {
  std: { label: "Poker table", min: 25, max: 300, sb: 5, bb: 10, rakeCap: 5 },
  hi: { label: "High stakes poker table", min: 500, max: 2000, sb: 20, bb: 40, rakeCap: 15 },
};
/**
 * What the table pays whoever owns the room it stands in (the owner of the hideout, or of the player room): a fee of 1% of every buy-in, charged ON TOP of the buy-in
 * (the stack and the pot are not touched), and 1% of every pot that saw a flop (no flop, no drop), at most `rakeCap` a pot. Blood only moves from the players to the owner.
 */
export const POKER_FEE_PCT = 1;
export const POKER_RAKE_PCT = 1;
/** the buy-in fee for a buy-in (at least 1 blood) */
export const pokerFee = (buy: number): number => Math.max(1, Math.ceil((buy * POKER_FEE_PCT) / 100));
/** who owns a table in this room: the owner of the hideout (h_<uid>) or of the player room (u_<uid>); null for any other room */
export const pokerOwnerOf = (room: string): string | null => (/^[hu]_[A-Za-z0-9]{1,40}$/.test(room) ? room.slice(2) : null);
/** the furniture piece (kind id) that is a poker table, and which one */
export const pokerKindOf = (furniKind: string | undefined): PokerKind | null => (furniKind === "f_pokertable" ? "std" : furniKind === "f_pokertablehi" ? "hi" : null);

export const POKER_TURN_MS = 25_000;
/** how long the winner(s) are shown after a showdown / after everybody else folded, before the next hand is dealt */
export const POKER_RESULT_MS = 7_500;
export const POKER_FOLDWIN_MS = 3_800;
/** the pause between the streets when nobody can bet any more (everybody is all in) */
export const POKER_RUNOUT_MS = 1_700;
/** the pause from the second player sitting down to the first hand */
export const POKER_START_MS = 3_500;
/** a player who is gone from the room (a refresh, a log out, a dead connection) is stood up (and their blood given back) after this */
export const POKER_GONE_MS = 20_000;

// ---- cards: 0..51. rank = card % 13 (0 = two ... 12 = ace), suit = floor(card / 13) (0 spades, 1 hearts, 2 diamonds, 3 clubs) ------------------
export const rankOf = (c: number): number => c % 13;
export const suitOf = (c: number): number => Math.floor(c / 13);
export const RANK_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_WORD = ["Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King", "Ace"];
const RANK_PLURAL = ["Twos", "Threes", "Fours", "Fives", "Sixes", "Sevens", "Eights", "Nines", "Tens", "Jacks", "Queens", "Kings", "Aces"];
export const SUIT_NAMES = ["♠", "♥", "♦", "♣"];

/** how good a hand of 5 to 7 cards is: a bigger number beats a smaller one, the same number is a split pot. category * 13^5 + the ranks that matter, most important first. */
export function evaluate(cards: readonly number[]): number {
  const counts = new Array<number>(13).fill(0);
  const bySuit: number[][] = [[], [], [], []];
  for (const c of cards) { counts[rankOf(c)]++; bySuit[suitOf(c)].push(rankOf(c)); }
  const pack = (r: number[]): number => { let v = 0; for (let i = 0; i < 5; i++) v = v * 13 + (r[i] ?? 0); return v; };
  const straightHigh = (has: (r: number) => boolean): number => { // the top rank of the best straight (3 = the five-high wheel), or -1
    for (let top = 12; top >= 4; top--) { let ok = true; for (let k = 0; k < 5; k++) if (!has(top - k)) { ok = false; break; } if (ok) return top; }
    return has(12) && has(0) && has(1) && has(2) && has(3) ? 3 : -1;
  };
  const flushSuit = bySuit.findIndex((s) => s.length >= 5);
  if (flushSuit >= 0) {
    const set = new Set(bySuit[flushSuit]);
    const sf = straightHigh((r) => set.has(r));
    if (sf >= 0) return 8 * 13 ** 5 + pack([sf]);
  }
  const kick = (excl: number[], k: number): number[] => { const o: number[] = []; for (let r = 12; r >= 0 && o.length < k; r--) if (counts[r] > 0 && !excl.includes(r)) o.push(r); return o; }; // the best cards that are left over
  const ranksWith = (n: number): number[] => { const o: number[] = []; for (let r = 12; r >= 0; r--) if (counts[r] >= n) o.push(r); return o; };
  const quads = ranksWith(4), trips = ranksWith(3);
  if (quads.length) return 7 * 13 ** 5 + pack([quads[0], ...kick([quads[0]], 1)]);
  const pairsAll = ranksWith(2);
  if (trips.length) { const p = pairsAll.filter((r) => r !== trips[0]); if (p.length) return 6 * 13 ** 5 + pack([trips[0], p[0]]); } // (a second set of three counts as the pair)
  if (flushSuit >= 0) return 5 * 13 ** 5 + pack(bySuit[flushSuit].slice().sort((a, b) => b - a).slice(0, 5));
  const st = straightHigh((r) => counts[r] > 0);
  if (st >= 0) return 4 * 13 ** 5 + pack([st]);
  if (trips.length) return 3 * 13 ** 5 + pack([trips[0], ...kick([trips[0]], 2)]);
  if (pairsAll.length >= 2) return 2 * 13 ** 5 + pack([pairsAll[0], pairsAll[1], ...kick([pairsAll[0], pairsAll[1]], 1)]);
  if (pairsAll.length === 1) return 1 * 13 ** 5 + pack([pairsAll[0], ...kick([pairsAll[0]], 3)]);
  return pack(kick([], 5));
}

/** "Full house, Aces over Kings" for a score from evaluate() */
export function handName(score: number): string {
  const cat = Math.floor(score / 13 ** 5);
  let rest = score % 13 ** 5;
  const r: number[] = [];
  for (let i = 0; i < 5; i++) { r.unshift(rest % 13); rest = Math.floor(rest / 13); }
  switch (cat) {
    case 8: return r[0] === 12 ? "Royal flush" : `Straight flush, ${RANK_WORD[r[0]]} high`;
    case 7: return `Four of a kind, ${RANK_PLURAL[r[0]]}`;
    case 6: return `Full house, ${RANK_PLURAL[r[0]]} over ${RANK_PLURAL[r[1]]}`;
    case 5: return `Flush, ${RANK_WORD[r[0]]} high`;
    case 4: return `Straight, ${RANK_WORD[r[0]]} high`;
    case 3: return `Three of a kind, ${RANK_PLURAL[r[0]]}`;
    case 2: return `Two pair, ${RANK_PLURAL[r[0]]} and ${RANK_PLURAL[r[1]]}`;
    case 1: return `Pair of ${RANK_PLURAL[r[0]]}`;
    default: return `High card, ${RANK_WORD[r[0]]}`;
  }
}

// ---- the table ----------------------------------------------------------------------------------------------------------------------------------
export interface PokerSeat {
  uid: string;
  name: string;
  figure?: string;
  /** the blood in front of them (not in the pot) */
  stack: number;
  /** what they have put in on this betting round, and in the whole hand */
  bet: number;
  total: number;
  /** dealt into this hand */
  in: boolean;
  folded: boolean;
  allin: boolean;
  /** has had a say since the bet last went up */
  acted: boolean;
  /** stood up in the middle of a hand (the blood they put in stays in the pot; the seat is cleared when the hand is over) */
  left?: boolean;
  /** lost their last blood in this hand */
  bust?: boolean;
  /** what they did last on this round ("Check", "Call 20", "Raise to 60", "All in"...) */
  last?: string;
  /** since when they have not been in the room (server time) */
  gone?: number;
}
export interface PokerPot { amt: number; win: number[]; name?: string }
export interface PokerOver {
  pots: PokerPot[];
  /** the cards of everybody who was in the showdown, by seat */
  show: Record<number, number[]>;
  /** everybody else folded: nobody needs to show anything */
  uncontested?: boolean;
  at: number;
}
export interface PokerTable {
  kind: PokerKind;
  seats: (PokerSeat | null)[];
  phase: "idle" | "play" | "over";
  /** 0 preflop, 1 flop, 2 turn, 3 river */
  street: 0 | 1 | 2 | 3;
  board: number[];
  /** the highest bet on this round, and how much the last raise was (the least a raise must add) */
  bet: number;
  minRaise: number;
  dealer: number;
  /** whose turn it is (-1: nobody), since when, and when the server does the next thing by itself (the next street when everybody is all in, the next hand...) */
  turn: number;
  turnAt: number;
  nextAt: number;
  hand: number;
  /** counts up with every change (the browsers play sounds and animations when it changes) */
  seq: number;
  over?: PokerOver;
  lastAct?: { seat: number; act: string; at: number };
  /** the owner's cut of the pots so far that is less than a whole blood, in hundredths of a blood (carried from hand to hand) */
  rakeH: number;
  /** blood the owner has earned that the server has not paid yet (it pays it after every action and sets this back to 0) */
  till: number;
}

export const newTable = (kind: PokerKind): PokerTable => ({
  kind, seats: new Array<PokerSeat | null>(POKER_SEATS).fill(null), phase: "idle", street: 0, board: [], bet: 0, minRaise: POKER_KINDS[kind].bb,
  dealer: -1, turn: -1, turnAt: 0, nextAt: 0, hand: 0, seq: 0, rakeH: 0, till: 0,
});

/** the owner's cut of a pot that saw a flop: 1% (capped), carried in hundredths so only whole blood moves. Returns the whole blood to take out of the pot. */
function takeRake(t: PokerTable, pot: number): number {
  t.rakeH += Math.min(pot * POKER_RAKE_PCT, POKER_KINDS[t.kind].rakeCap * 100);
  const whole = Math.floor(t.rakeH / 100);
  t.rakeH -= whole * 100;
  t.till += whole;
  return whole;
}

/** what the server needs to play: the rest of the shuffled deck (cards come off the end), everybody's hole cards by seat, and the time */
export interface PokerCtx { deck: number[]; holes: Record<number, number[]>; now: number }

export const seatsIn = (t: PokerTable, pred: (s: PokerSeat, i: number) => boolean = () => true): number[] => t.seats.flatMap((s, i) => (s && pred(s, i) ? [i] : []));
export const canAct = (s: PokerSeat | null): boolean => !!s && s.in && !s.folded && !s.allin;
export const potOf = (t: PokerTable): number => t.seats.reduce((n, s) => n + (s ? s.total : 0), 0);
export const seatOfUid = (t: PokerTable, uid: string): number => t.seats.findIndex((s) => s?.uid === uid && !s.left); // (a ghost who stood up mid-hand does not count)
/** the next seat clockwise after `from` that has somebody for whom `pred` holds (-1: none) */
function nextSeat(t: PokerTable, from: number, pred: (s: PokerSeat) => boolean): number {
  for (let k = 1; k <= POKER_SEATS; k++) { const i = (from + k + POKER_SEATS) % POKER_SEATS; const s = t.seats[i]; if (s && pred(s)) return i; }
  return -1;
}
const say = (t: PokerTable, seat: number, act: string, now: number): void => { const s = t.seats[seat]; if (s) s.last = act; t.lastAct = { seat, act, at: now }; };

/** puts blood from a stack onto the table (never more than they have: that is an all in) */
function commit(s: PokerSeat, amt: number): number {
  const n = Math.max(0, Math.min(amt, s.stack));
  s.stack -= n; s.bet += n; s.total += n;
  if (s.stack === 0) s.allin = true;
  return n;
}

/** can a hand be played (at least two with blood)? */
export const readyForHand = (t: PokerTable): boolean => seatsIn(t, (s) => s.stack > 0 && !s.left && !s.bust).length >= 2;

/** a new hand: the dealer button moves on, the blinds go in, everybody gets two cards. Returns false when there are not two players with blood. */
export function startHand(t: PokerTable, ctx: PokerCtx): boolean {
  for (let i = 0; i < POKER_SEATS; i++) { const s = t.seats[i]; if (s && (s.left || s.bust || s.stack <= 0)) t.seats[i] = null; } // the ones who stood up or lost it all are gone now
  const players = seatsIn(t);
  if (players.length < 2) { t.phase = "idle"; t.turn = -1; t.nextAt = 0; return false; }
  const info = POKER_KINDS[t.kind];
  for (const i of players) { const s = t.seats[i]!; s.bet = 0; s.total = 0; s.in = true; s.folded = false; s.allin = false; s.acted = false; s.last = undefined; delete s.bust; }
  t.dealer = nextSeat(t, t.dealer < 0 ? POKER_SEATS - 1 : t.dealer, () => true);
  const headsUp = players.length === 2;
  const sb = headsUp ? t.dealer : nextSeat(t, t.dealer, () => true);
  const bb = nextSeat(t, sb, () => true);
  commit(t.seats[sb]!, info.sb); say(t, sb, `Small blind ${t.seats[sb]!.bet}`, ctx.now);
  commit(t.seats[bb]!, info.bb); say(t, bb, `Big blind ${t.seats[bb]!.bet}`, ctx.now);
  t.bet = Math.max(t.seats[sb]!.bet, t.seats[bb]!.bet);
  t.minRaise = info.bb;
  t.board = []; t.street = 0; t.over = undefined; t.phase = "play"; t.nextAt = 0; t.hand++; t.seq++;
  ctx.holes = {};
  for (let k = 0; k < 2; k++) for (let n = 0; n < POKER_SEATS; n++) { const i = (sb + n) % POKER_SEATS; if (t.seats[i]?.in) (ctx.holes[i] ??= []).push(ctx.deck.pop()!); }
  t.turn = headsUp ? sb : nextSeat(t, bb, (s) => canAct(s));
  if (t.turn < 0 || !canAct(t.seats[t.turn])) { t.turn = -1; settle(t, ctx); return true; }
  t.turnAt = ctx.now;
  return true;
}

/** the betting round is over when everybody who can still bet has had a say and put in as much as the highest bet */
function roundDone(t: PokerTable): boolean {
  const actors = t.seats.filter((s): s is PokerSeat => canAct(s));
  if (actors.length === 0) return true;
  if (actors.length === 1) return actors[0].bet >= t.bet; // (the others are all in: there is nobody to bet against)
  return actors.every((s) => s.acted && s.bet === t.bet);
}

/** after every change: somebody wins because the others folded, the next street, the showdown, or just the next player's turn */
export function settle(t: PokerTable, ctx: PokerCtx, moved = true): void {
  const alive = seatsIn(t, (s) => s.in && !s.folded);
  if (alive.length <= 1) { awardUncontested(t, alive[0] ?? -1, ctx.now); return; }
  if (!roundDone(t)) {
    if (!moved && t.turn >= 0 && canAct(t.seats[t.turn])) return; // (somebody else stood up: the player whose turn it is keeps it)
    const from = t.turn >= 0 ? t.turn : t.dealer;
    t.turn = nextSeat(t, from, (s) => canAct(s) && (!s.acted || s.bet < t.bet));
    if (t.turn < 0) t.turn = nextSeat(t, from, (s) => canAct(s));
    t.turnAt = ctx.now;
    return;
  }
  nextStreet(t, ctx);
}

/** deals the next street (or goes to the showdown after the river). When nobody can bet any more it stops after each street, so everybody can watch it come. */
export function nextStreet(t: PokerTable, ctx: PokerCtx): void {
  if (t.street === 3) { showdown(t, ctx); return; }
  t.street = (t.street + 1) as 1 | 2 | 3;
  const n = t.street === 1 ? 3 : 1;
  for (let k = 0; k < n; k++) t.board.push(ctx.deck.pop()!);
  for (const s of t.seats) if (s) { s.bet = 0; s.acted = false; if (s.last && !s.allin) s.last = undefined; }
  t.bet = 0; t.minRaise = POKER_KINDS[t.kind].bb; t.seq++;
  const actors = t.seats.filter((s): s is PokerSeat => canAct(s));
  if (actors.length < 2) { t.turn = -1; t.nextAt = ctx.now + POKER_RUNOUT_MS; return; } // everybody is (nearly) all in: the cards come by themselves
  t.turn = nextSeat(t, t.dealer, (s) => canAct(s));
  t.turnAt = ctx.now; t.nextAt = 0;
}

/** the pots: the bets of everybody who is still in, level by level (a short all in can only win what each of the others put in up to that much) */
export function buildPots(t: PokerTable): { amt: number; elig: number[] }[] {
  const contrib = t.seats.map((s) => (s ? s.total : 0));
  const live = seatsIn(t, (s) => s.in && !s.folded);
  const levels = [...new Set(live.map((i) => contrib[i]))].filter((v) => v > 0).sort((a, b) => a - b);
  const pots: { amt: number; elig: number[] }[] = [];
  let prev = 0;
  for (const lvl of levels) {
    const amt = contrib.reduce((n, c) => n + Math.max(0, Math.min(c, lvl) - Math.min(c, prev)), 0);
    if (amt > 0) pots.push({ amt, elig: live.filter((i) => contrib[i] >= lvl) });
    prev = lvl;
  }
  const rest = contrib.reduce((n, c) => n + Math.max(0, c - prev), 0); // (a folded player who put in more than anybody who is left: it goes to the biggest pot)
  if (rest > 0 && pots.length) pots[pots.length - 1].amt += rest;
  else if (rest > 0 && live.length) pots.push({ amt: rest, elig: live });
  return pots;
}

function awardUncontested(t: PokerTable, winner: number, now: number): void {
  const gross = potOf(t);
  const total = gross - (winner >= 0 && t.street >= 1 ? takeRake(t, gross) : 0); // (no flop, no rake)
  if (winner >= 0) t.seats[winner]!.stack += total;
  t.over = { pots: [{ amt: total, win: winner >= 0 ? [winner] : [] }], show: {}, uncontested: true, at: now };
  endHand(t, now, POKER_FOLDWIN_MS);
}

function showdown(t: PokerTable, ctx: PokerCtx): void {
  const pots = buildPots(t);
  if (t.street >= 1) { // the owner's cut comes out of the first pots (the main pot) before anybody is paid
    let cut = takeRake(t, pots.reduce((n, p) => n + p.amt, 0));
    for (const p of pots) { const x = Math.min(cut, p.amt); p.amt -= x; cut -= x; }
  }
  const live = seatsIn(t, (s) => s.in && !s.folded);
  const score: Record<number, number> = {};
  for (const i of live) score[i] = evaluate([...(ctx.holes[i] ?? []), ...t.board]);
  const over: PokerOver = { pots: [], show: {}, at: ctx.now };
  for (const i of live) if (ctx.holes[i]) over.show[i] = ctx.holes[i];
  for (const p of pots) {
    const best = Math.max(...p.elig.map((i) => score[i]));
    const winners = p.elig.filter((i) => score[i] === best);
    const share = Math.floor(p.amt / winners.length);
    let odd = p.amt - share * winners.length;
    const order = winners.slice().sort((a, b) => ((a - t.dealer - 1 + 2 * POKER_SEATS) % POKER_SEATS) - ((b - t.dealer - 1 + 2 * POKER_SEATS) % POKER_SEATS)); // (the odd chips go to whoever is first left of the dealer)
    for (const i of order) { t.seats[i]!.stack += share + (odd > 0 ? 1 : 0); if (odd > 0) odd--; }
    over.pots.push({ amt: p.amt, win: winners, name: handName(best) });
  }
  t.over = over;
  endHand(t, ctx.now, POKER_RESULT_MS);
}

function endHand(t: PokerTable, now: number, pauseMs: number): void {
  t.phase = "over"; t.turn = -1; t.nextAt = now + pauseMs; t.seq++;
  for (const s of t.seats) if (s) { s.bet = 0; if (s.in && s.stack === 0 && !s.left) s.bust = true; }
}

export type PokerMove = "fold" | "check" | "call" | "raise" | "allin";
/** the least a raise to ... can be right now, and the most (all in) for a seat */
export function raiseRange(t: PokerTable, seat: number): { min: number; max: number } {
  const s = t.seats[seat];
  if (!s) return { min: 0, max: 0 };
  const max = s.bet + s.stack;
  return { min: Math.min(max, t.bet + t.minRaise), max };
}

/** a player's move. Returns what is wrong with it, or null when it was played. `to` is the whole bet on this round a raise brings you to. */
export function act(t: PokerTable, seat: number, move: PokerMove, to: number | undefined, ctx: PokerCtx): string | null {
  const s = t.seats[seat];
  if (t.phase !== "play" || !s || t.turn !== seat || !canAct(s)) return "It isn't your turn.";
  if (move === "fold") { s.folded = true; say(t, seat, "Fold", ctx.now); }
  else if (move === "check") {
    if (s.bet !== t.bet) return "You can't check: there is a bet to call.";
    s.acted = true; say(t, seat, "Check", ctx.now);
  } else if (move === "call") {
    if (t.bet <= s.bet) return "There is nothing to call.";
    const n = commit(s, t.bet - s.bet); s.acted = true;
    say(t, seat, s.allin ? "All in" : `Call ${n}`, ctx.now);
  } else {
    const was = t.bet;
    let target = move === "allin" ? s.bet + s.stack : Math.floor(Number(to));
    if (!Number.isFinite(target)) return "Say how much.";
    const max = s.bet + s.stack;
    if (target >= max) target = max;
    if (target <= t.bet && target < max) return "That is not a raise.";
    if (target > t.bet) {
      const size = target - t.bet;
      if (size < t.minRaise && target < max) return `A raise must be at least ${t.minRaise} more.`;
      commit(s, target - s.bet);
      if (size >= t.minRaise) t.minRaise = size;
      t.bet = target;
      for (const o of t.seats) if (o && o !== s && canAct(o)) o.acted = false; // (everybody has to answer a raise)
      say(t, seat, s.allin ? "All in" : was === 0 ? `Bet ${target}` : `Raise to ${target}`, ctx.now);
    } else { // an all in that only calls (or is less than the call)
      commit(s, target - s.bet);
      say(t, seat, "All in", ctx.now);
    }
    s.acted = true;
  }
  t.seq++;
  settle(t, ctx);
  return null;
}

/** somebody who ran out of time: check when that is free, else fold */
export function autoAct(t: PokerTable, ctx: PokerCtx): void {
  const s = t.seats[t.turn];
  if (!s) return;
  act(t, t.turn, s.bet === t.bet ? "check" : "fold", undefined, ctx);
}

/**
 * Stands somebody up. In the middle of a hand they fold first (what they put in stays in the pot). Returns the blood they take with them.
 * The seat is cleared at once between hands, and when the hand ends otherwise.
 */
export function leaveSeat(t: PokerTable, seat: number, ctx: PokerCtx): number {
  const s = t.seats[seat];
  if (!s) return 0;
  const take = s.stack;
  s.stack = 0;
  if (t.phase === "play" && s.in && !s.folded) {
    s.left = true; s.folded = true; say(t, seat, "Fold", ctx.now);
    t.seq++;
    settle(t, ctx, t.turn === seat); // (when it was their turn, the next player is up)
  } else if (t.phase === "play") {
    s.left = true; // folded already: stays as a ghost until the hand is over
  } else {
    t.seats[seat] = null;
  }
  return take;
}

/** the things the server does by itself when time has passed: a player who took too long, the next street, the next hand. Returns true when something changed. */
export function tick(t: PokerTable, ctx: PokerCtx): boolean {
  let changed = false;
  for (let guard = 0; guard < 8; guard++) {
    if (t.phase === "play" && t.turn >= 0 && ctx.now >= t.turnAt + POKER_TURN_MS) { autoAct(t, ctx); changed = true; continue; }
    if (t.phase === "play" && t.turn < 0 && t.nextAt > 0 && ctx.now >= t.nextAt) { t.nextAt = 0; nextStreet(t, ctx); changed = true; continue; }
    if (t.phase === "over" && ctx.now >= t.nextAt) {
      for (let i = 0; i < POKER_SEATS; i++) { const s = t.seats[i]; if (s && (s.left || s.bust)) t.seats[i] = null; }
      if (readyForHand(t)) startHand(t, ctx); else { t.phase = "idle"; t.nextAt = 0; t.turn = -1; t.over = undefined; t.seq++; }
      changed = true; continue;
    }
    if (t.phase === "idle" && !readyForHand(t) && t.nextAt !== 0) { t.nextAt = 0; changed = true; }
    if (t.phase === "idle" && readyForHand(t)) {
      if (t.nextAt === 0) { t.nextAt = ctx.now + POKER_START_MS; changed = true; }
      else if (ctx.now >= t.nextAt) { startHand(t, ctx); changed = true; continue; }
    }
    break;
  }
  return changed;
}

// ---- what the database holds -------------------------------------------------------------------------------------------------------------------
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

export function pokerToDb(t: PokerTable): Record<string, unknown> {
  const seats: Record<string, unknown> = {};
  t.seats.forEach((s, i) => { if (s) seats[`s${i}`] = { ...s }; });
  return {
    kind: t.kind, seats, phase: t.phase, street: t.street, board: t.board, bet: t.bet, minRaise: t.minRaise, dealer: t.dealer, turn: t.turn, turnAt: t.turnAt,
    nextAt: t.nextAt, hand: t.hand, seq: t.seq, pot: potOf(t), rakeH: t.rakeH, till: t.till,
    ...(t.over ? { over: { pots: t.over.pots.map((p) => ({ amt: p.amt, win: p.win, ...(p.name ? { name: p.name } : {}) })), show: Object.fromEntries(Object.entries(t.over.show).map(([k, v]) => [`s${k}`, v])), ...(t.over.uncontested ? { uncontested: true } : {}), at: t.over.at } } : {}),
    ...(t.lastAct ? { lastAct: t.lastAct } : {}),
  };
}

export function parsePoker(v: any): PokerTable | null {
  if (!v || typeof v !== "object" || (v.kind !== "std" && v.kind !== "hi")) return null;
  const t = newTable(v.kind);
  for (let i = 0; i < POKER_SEATS; i++) {
    const s = v.seats?.[`s${i}`];
    if (s && typeof s.uid === "string") {
      t.seats[i] = {
        uid: s.uid, name: String(s.name ?? "?").slice(0, 30), ...(typeof s.figure === "string" ? { figure: s.figure.slice(0, 200) } : {}),
        stack: num(s.stack), bet: num(s.bet), total: num(s.total), in: s.in === true, folded: s.folded === true, allin: s.allin === true, acted: s.acted === true,
        ...(s.left === true ? { left: true } : {}), ...(s.bust === true ? { bust: true } : {}), ...(typeof s.last === "string" ? { last: s.last } : {}), ...(typeof s.gone === "number" ? { gone: s.gone } : {}),
      };
    }
  }
  t.phase = v.phase === "play" || v.phase === "over" ? v.phase : "idle";
  t.street = ([0, 1, 2, 3].includes(v.street) ? v.street : 0) as 0 | 1 | 2 | 3;
  t.board = Array.isArray(v.board) ? v.board.filter((c: unknown) => typeof c === "number") : [];
  t.bet = num(v.bet); t.minRaise = num(v.minRaise, POKER_KINDS[t.kind].bb); t.dealer = num(v.dealer, -1); t.turn = num(v.turn, -1);
  t.turnAt = num(v.turnAt); t.nextAt = num(v.nextAt); t.hand = num(v.hand); t.seq = num(v.seq); t.rakeH = num(v.rakeH); t.till = num(v.till);
  if (v.over && typeof v.over === "object") {
    const show: Record<number, number[]> = {};
    for (const [k, cards] of Object.entries<any>(v.over.show ?? {})) if (/^s\d$/.test(k) && Array.isArray(cards)) show[Number(k.slice(1))] = cards.filter((c) => typeof c === "number");
    t.over = {
      pots: (Array.isArray(v.over.pots) ? v.over.pots : []).map((p: any) => ({ amt: num(p?.amt), win: Array.isArray(p?.win) ? p.win.filter((n: unknown) => typeof n === "number") : [], ...(typeof p?.name === "string" ? { name: p.name } : {}) })),
      show, ...(v.over.uncontested === true ? { uncontested: true } : {}), at: num(v.over.at),
    };
  }
  if (v.lastAct && typeof v.lastAct.act === "string") t.lastAct = { seat: num(v.lastAct.seat), act: v.lastAct.act, at: num(v.lastAct.at) };
  return t;
}
