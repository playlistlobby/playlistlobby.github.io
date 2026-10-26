// Blackjack at a hideout's blue table: up to 5 players against a dealer who is a member of the hideout. The dealer does the clicks (open the round, deal, turn the
// hidden card, draw, pay) but not the rules: the server checks every click (the dealer must draw below 17 and may not above, pays what the rules say).
// The dealer has a bank of their own blood: what players lose goes into it and what they win comes out of it, so nothing is made or lost.
// Pure: the server plays with it (server/src/actions/blackjack.ts) and the browsers show what it writes (blackjack/<table>).

export const BJ_SEATS = 5;
export const BJ_BET_MIN = 10;
export const BJ_BET_MAX = 250;
export const BJ_BANK_MIN = 500;
export const BJ_BANK_MAX = 5000;
/** a player has this long to hit or stand */
export const BJ_TURN_MS = 25_000;
/** the result stays on the table this long */
export const BJ_RESULT_MS = 7_000;
/** a dealer who does nothing for this long has the next click made for them (so the table never hangs) */
export const BJ_DEALER_IDLE_MS = 45_000;
/** a player who is gone from the room is stood up after this */
export const BJ_GONE_MS = 20_000;

// cards are 0..51 like poker: rank = card % 13 (0 = two ... 12 = ace), suit = floor(card / 13)
export const bjRank = (c: number): number => c % 13;
export const bjSuit = (c: number): number => Math.floor(c / 13);
const cardPoints = (c: number): number => { const r = bjRank(c); return r === 12 ? 11 : r >= 8 ? 10 : r + 2; };

/** the best total of a hand (an ace is 11 until that busts), and whether an ace still counts 11 */
export function bjValue(cards: readonly number[]): { total: number; soft: boolean } {
  let total = 0, aces = 0;
  for (const c of cards) { total += cardPoints(c); if (bjRank(c) === 12) aces++; }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0 };
}
export const isBlackjack = (cards: readonly number[]): boolean => cards.length === 2 && bjValue(cards).total === 21;

export type BjSeatState = "wait" | "bet" | "play" | "stand" | "bust" | "bj";
export type BjResult = "win" | "lose" | "push" | "bj";
export interface BjSeat {
  uid: string;
  name: string;
  figure?: string;
  /** the blood on the table for this round (it left their pocket when they bet it) */
  bet: number;
  cards: number[];
  state: BjSeatState;
  doubled?: boolean;
  /** how the round went and what they got back (the bet included) */
  result?: BjResult;
  back?: number;
  /** since when they have not been in the room (server time) */
  gone?: number;
  /** stood up in the middle of a round: the hand is played out and paid, then the seat is cleared */
  left?: boolean;
}
export interface BjDealer { uid: string; name: string; figure?: string }
export interface BjTable {
  dealer: BjDealer | null;
  /** the dealer's blood on the table: it pays the winners and takes the losers' bets */
  bank: number;
  seats: (BjSeat | null)[];
  /** idle: no round (the dealer may open one) · betting: players put blood down · players: they hit and stand · dealer: the dealer's turn · over: the result is shown */
  phase: "idle" | "betting" | "players" | "dealer" | "over";
  /** the dealer's cards that can be seen; `hole` says one more is face down (only the dealer can read it) */
  dealerCards: number[];
  hole: boolean;
  /** has the hidden card been turned? */
  revealed: boolean;
  turn: number;
  turnAt: number;
  /** when the dealer last did something (server time): the server plays on for a dealer who is idle */
  dealerAt: number;
  /** when the result goes away */
  nextAt: number;
  round: number;
  seq: number;
  lastAct?: { seat: number; act: string; at: number };
}

export const newBjTable = (): BjTable => ({ dealer: null, bank: 0, seats: new Array<BjSeat | null>(BJ_SEATS).fill(null), phase: "idle", dealerCards: [], hole: false, revealed: false, turn: -1, turnAt: 0, dealerAt: 0, nextAt: 0, round: 0, seq: 0 });

export interface BjCtx { deck: number[]; /** the dealer's hidden card */ hole: number | null; now: number }

export const bjSeatsIn = (t: BjTable, pred: (s: BjSeat, i: number) => boolean = () => true): number[] => t.seats.flatMap((s, i) => (s && pred(s, i) ? [i] : []));
export const bjSeatOfUid = (t: BjTable, uid: string): number => t.seats.findIndex((s) => s?.uid === uid && !s.left);
/** every bet on the table, doubles included */
export const bjStakes = (t: BjTable): number => t.seats.reduce((n, s) => n + (s ? s.bet : 0), 0);
/** the dealer's cards as a hand (the hidden one counts only when it is known: pass it in) */
export const bjDealerTotal = (t: BjTable, hole?: number | null): number => bjValue(hole != null && t.hole ? [...t.dealerCards, hole] : t.dealerCards).total;

const say = (t: BjTable, seat: number, act: string, now: number): void => { t.lastAct = { seat, act, at: now }; };

/** the bank must be able to pay every bet at the most it can win: double the bet (a doubled hand wins twice what was bet at first) */
export const bankCovers = (t: BjTable, stakes: number): boolean => stakes * 2 <= t.bank;

/** the dealer opens a round: players may bet */
export function openRound(t: BjTable, now: number): string | null {
  if (!t.dealer) return "There is no dealer.";
  if (t.phase !== "idle" && t.phase !== "over") return "A round is going.";
  for (let i = 0; i < BJ_SEATS; i++) { const s = t.seats[i]; if (s && s.left) t.seats[i] = null; else if (s) { s.bet = 0; s.cards = []; s.state = "wait"; s.doubled = undefined; s.result = undefined; s.back = undefined; } }
  t.dealerCards = []; t.hole = false; t.revealed = false; t.turn = -1;
  t.phase = "betting"; t.round++; t.dealerAt = now; t.nextAt = 0; t.seq++;
  return null;
}

/** a player's bet for this round (one bet, no changing it) */
export function placeBet(t: BjTable, seat: number, amount: number, now: number): string | null {
  const s = t.seats[seat];
  if (t.phase !== "betting" || !s) return "Betting isn't open.";
  if (s.bet > 0) return "You have bet already.";
  if (!Number.isInteger(amount) || amount < BJ_BET_MIN || amount > BJ_BET_MAX) return `Bet from ${BJ_BET_MIN} to ${BJ_BET_MAX}.`;
  if (!bankCovers(t, bjStakes(t) + amount)) return "The dealer's bank can't cover that bet.";
  s.bet = amount; s.state = "bet"; say(t, seat, `Bet ${amount}`, now); t.seq++;
  return null;
}

function nextPlayer(t: BjTable, from: number): number {
  for (let k = 1; k <= BJ_SEATS; k++) { const i = from + k; if (i >= BJ_SEATS) return -1; if (t.seats[i]?.state === "play") return i; }
  return -1;
}

/** the dealer deals: two cards each to everybody who has bet, two to the dealer (one face down). A dealer with blackjack ends the round on the spot. */
export function deal(t: BjTable, ctx: BjCtx): string | null {
  if (t.phase !== "betting") return "Open a round first.";
  const live = bjSeatsIn(t, (s) => s.bet > 0);
  if (!live.length) return "Nobody has bet yet.";
  for (const i of live) { const s = t.seats[i]!; s.cards = [ctx.deck.pop()!, ctx.deck.pop()!]; s.state = isBlackjack(s.cards) ? "bj" : "play"; }
  t.dealerCards = [ctx.deck.pop()!]; ctx.hole = ctx.deck.pop()!; t.hole = true; t.revealed = false;
  t.phase = "players"; t.turnAt = ctx.now; t.dealerAt = ctx.now; t.seq++;
  say(t, -1, "Dealt", ctx.now);
  if (bjValue([...t.dealerCards, ctx.hole]).total === 21) { // the dealer has blackjack: the cards are turned at once
    t.dealerCards.push(ctx.hole); ctx.hole = null; t.hole = false; t.revealed = true;
    settle(t, ctx.now);
    return null;
  }
  t.turn = nextPlayer(t, -1);
  if (t.turn < 0) t.phase = "dealer";
  return null;
}

/** a player's move: hit, stand, or double (one more card and that is it, for a second bet of the same size: the caller takes it from their blood) */
export function playerMove(t: BjTable, seat: number, move: "hit" | "stand" | "double", ctx: BjCtx): string | null {
  const s = t.seats[seat];
  if (t.phase !== "players" || !s || t.turn !== seat || s.state !== "play") return "It isn't your turn.";
  if (move === "double") {
    if (s.cards.length !== 2 || s.doubled) return "You can only double on your first two cards.";
    if (!bankCovers(t, bjStakes(t) + s.bet)) return "The dealer's bank can't cover a double.";
  }
  if (move === "stand") { s.state = "stand"; say(t, seat, "Stand", ctx.now); }
  else {
    if (move === "double") { s.bet *= 2; s.doubled = true; }
    s.cards.push(ctx.deck.pop()!);
    const v = bjValue(s.cards).total;
    if (v > 21) { s.state = "bust"; say(t, seat, "Bust", ctx.now); }
    else if (v === 21 || move === "double") { s.state = "stand"; say(t, seat, move === "double" ? "Double" : "21", ctx.now); }
    else say(t, seat, "Hit", ctx.now);
  }
  t.seq++;
  if (s.state !== "play") { t.turn = nextPlayer(t, seat); t.turnAt = ctx.now; if (t.turn < 0) { t.phase = "dealer"; t.dealerAt = ctx.now; } }
  else t.turnAt = ctx.now;
  return null;
}

/** is there a player hand the dealer still has to beat? (if everybody busted or has blackjack the dealer needn't draw) */
export const handsToBeat = (t: BjTable): boolean => t.seats.some((s) => s && s.state === "stand");

/** the dealer turns the hidden card */
export function reveal(t: BjTable, ctx: BjCtx): string | null {
  if (t.phase !== "dealer") return "The players are not done.";
  if (t.revealed) return "It is turned already.";
  if (ctx.hole != null) t.dealerCards.push(ctx.hole);
  ctx.hole = null; t.hole = false; t.revealed = true; t.dealerAt = ctx.now; t.seq++;
  say(t, -1, "Reveal", ctx.now);
  return null;
}

/** the dealer draws a card (only while they have less than 17, and only when somebody's hand is still alive) */
export function dealerDraw(t: BjTable, ctx: BjCtx): string | null {
  if (t.phase !== "dealer" || !t.revealed) return "Turn the hidden card first.";
  if (!handsToBeat(t)) return "Nobody is left to beat.";
  if (bjValue(t.dealerCards).total >= 17) return "The dealer stands on 17.";
  t.dealerCards.push(ctx.deck.pop()!); t.dealerAt = ctx.now; t.seq++;
  say(t, -1, "Draw", ctx.now);
  return null;
}

/** can the dealer pay out now? */
export const canSettle = (t: BjTable): boolean => t.phase === "dealer" && t.revealed && (!handsToBeat(t) || bjValue(t.dealerCards).total >= 17);

/** pays everybody: a win gives back twice the bet, blackjack two and a half times, a tie the bet; a loss goes to the bank. The caller credits each seat's `back`. */
export function settle(t: BjTable, now: number): string | null {
  if (t.phase !== "dealer" && t.phase !== "players") return "Nothing to pay.";
  if (t.phase === "dealer" && !canSettle(t)) return "The dealer isn't done.";
  const dv = bjValue(t.dealerCards).total;
  const dealerBj = isBlackjack(t.dealerCards) && t.revealed;
  for (const s of t.seats) {
    if (!s || s.bet <= 0) continue;
    const pv = bjValue(s.cards).total;
    let back = 0, result: BjResult;
    if (s.state === "bj") { if (dealerBj) { result = "push"; back = s.bet; } else { result = "bj"; back = s.bet + Math.floor(s.bet * 1.5); } }
    else if (s.state === "bust" || dealerBj) { result = "lose"; back = 0; }
    else if (dv > 21 || pv > dv) { result = "win"; back = s.bet * 2; }
    else if (pv === dv) { result = "push"; back = s.bet; }
    else { result = "lose"; back = 0; }
    s.result = result; s.back = back;
    t.bank += s.bet - back;
  }
  t.phase = "over"; t.turn = -1; t.nextAt = now + BJ_RESULT_MS; t.seq++;
  say(t, -1, "Paid", now);
  return null;
}

/** the table cannot go on (the dealer left, the piece was picked up): everybody gets their bet back. Returns the blood each seat gets. */
export function voidRound(t: BjTable): Record<number, number> {
  const back: Record<number, number> = {};
  t.seats.forEach((s, i) => { if (s && s.bet > 0 && !s.result) { back[i] = s.bet; s.bet = 0; } if (s) { s.cards = []; s.state = "wait"; s.doubled = undefined; s.result = undefined; s.back = undefined; } });
  t.dealerCards = []; t.hole = false; t.revealed = false; t.turn = -1; t.phase = "idle"; t.nextAt = 0; t.seq++;
  return back;
}

/** the things that happen by themselves when time has passed: a player who took too long stands, a dealer who is idle has the next click made, the result goes away */
export function bjTick(t: BjTable, ctx: BjCtx): boolean {
  let changed = false;
  for (let guard = 0; guard < 12; guard++) {
    if (t.phase === "players" && t.turn >= 0 && ctx.now >= t.turnAt + BJ_TURN_MS) { playerMove(t, t.turn, "stand", ctx); changed = true; continue; }
    if (t.phase === "betting" && bjSeatsIn(t, (s) => s.bet > 0).length && ctx.now >= t.dealerAt + BJ_DEALER_IDLE_MS) { deal(t, ctx); changed = true; continue; }
    if (t.phase === "dealer" && ctx.now >= t.dealerAt + BJ_DEALER_IDLE_MS) {
      if (!t.revealed) reveal(t, ctx);
      else if (!canSettle(t)) dealerDraw(t, ctx);
      else settle(t, ctx.now);
      t.dealerAt = ctx.now; changed = true; continue;
    }
    if (t.phase === "over" && ctx.now >= t.nextAt) {
      for (let i = 0; i < BJ_SEATS; i++) { const s = t.seats[i]; if (s?.left) t.seats[i] = null; else if (s) { s.bet = 0; s.cards = []; s.state = "wait"; s.doubled = undefined; s.result = undefined; s.back = undefined; } }
      t.dealerCards = []; t.hole = false; t.revealed = false;
      t.phase = "idle"; t.nextAt = 0; t.seq++; changed = true; continue;
    }
    break;
  }
  return changed;
}

// ---- what the database holds -----------------------------------------------------------------------------------------------------------------------
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const cardsOf = (v: unknown): number[] => (Array.isArray(v) ? v.filter((c): c is number => typeof c === "number") : []);

export function bjToDb(t: BjTable): Record<string, unknown> {
  const seats: Record<string, unknown> = {};
  t.seats.forEach((s, i) => { if (s) seats[`s${i}`] = { ...s, cards: s.cards }; });
  return {
    ...(t.dealer ? { dealer: t.dealer } : {}), bank: t.bank, seats, phase: t.phase, dealerCards: t.dealerCards, hole: t.hole, revealed: t.revealed, turn: t.turn, turnAt: t.turnAt,
    dealerAt: t.dealerAt, nextAt: t.nextAt, round: t.round, seq: t.seq, ...(t.lastAct ? { lastAct: t.lastAct } : {}),
  };
}

export function parseBj(v: any): BjTable | null {
  if (!v || typeof v !== "object" || typeof v.phase !== "string") return null;
  const t = newBjTable();
  if (v.dealer && typeof v.dealer.uid === "string") t.dealer = { uid: v.dealer.uid, name: String(v.dealer.name ?? "?").slice(0, 30), ...(typeof v.dealer.figure === "string" ? { figure: v.dealer.figure.slice(0, 200) } : {}) };
  t.bank = num(v.bank);
  for (let i = 0; i < BJ_SEATS; i++) {
    const s = v.seats?.[`s${i}`];
    if (s && typeof s.uid === "string") {
      const state = (["wait", "bet", "play", "stand", "bust", "bj"] as const).find((x) => x === s.state) ?? "wait";
      const result = (["win", "lose", "push", "bj"] as const).find((x) => x === s.result);
      t.seats[i] = {
        uid: s.uid, name: String(s.name ?? "?").slice(0, 30), ...(typeof s.figure === "string" ? { figure: s.figure.slice(0, 200) } : {}), bet: num(s.bet), cards: cardsOf(s.cards), state,
        ...(s.doubled === true ? { doubled: true } : {}), ...(result ? { result } : {}), ...(typeof s.back === "number" ? { back: s.back } : {}), ...(typeof s.gone === "number" ? { gone: s.gone } : {}), ...(s.left === true ? { left: true } : {}),
      };
    }
  }
  t.phase = (["idle", "betting", "players", "dealer", "over"] as const).find((x) => x === v.phase) ?? "idle";
  t.dealerCards = cardsOf(v.dealerCards); t.hole = v.hole === true; t.revealed = v.revealed === true;
  t.turn = num(v.turn, -1); t.turnAt = num(v.turnAt); t.dealerAt = num(v.dealerAt); t.nextAt = num(v.nextAt); t.round = num(v.round); t.seq = num(v.seq);
  if (v.lastAct && typeof v.lastAct.act === "string") t.lastAct = { seat: num(v.lastAct.seat, -1), act: v.lastAct.act, at: num(v.lastAct.at) };
  return t;
}
