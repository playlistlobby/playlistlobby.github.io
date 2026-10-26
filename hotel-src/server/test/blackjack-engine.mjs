// The blackjack rules (src/shared/blackjack.ts) without a server: hand values, a round by hand, the payouts, and a few thousand random rounds where the blood must never
// be made or lost. node test/blackjack-engine.mjs
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(mkdtempSync(join(tmpdir(), "bj-")), "bj.mjs");
buildSync({ entryPoints: [resolve(here, "../../src/shared/blackjack.ts")], bundle: true, format: "esm", outfile: out, logLevel: "error" });
const B = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { if (cond) pass++; else { fail++; console.log("FAIL ", name, extra); } };
const R = "23456789TJQKA", S = "shdc";
const card = (s) => R.indexOf(s[0]) + 13 * S.indexOf(s[1]);
const hand = (str) => str.split(" ").map(card);

console.log("--- hand values");
check("two cards", B.bjValue(hand("Ts 9d")).total === 19);
check("ace is 11", B.bjValue(hand("As 6d")).total === 17 && B.bjValue(hand("As 6d")).soft);
check("ace drops to 1", B.bjValue(hand("As 6d Kh")).total === 17 && !B.bjValue(hand("As 6d Kh")).soft);
check("two aces", B.bjValue(hand("As Ad")).total === 12);
check("three aces and a nine", B.bjValue(hand("As Ad Ah 9c")).total === 12);
check("faces are 10", B.bjValue(hand("Ks Qd Jh")).total === 30);
check("blackjack", B.isBlackjack(hand("As Kd")) && B.isBlackjack(hand("Th Ac")) && !B.isBlackjack(hand("7s 7d 7h")) && !B.isBlackjack(hand("As 5d 5h")));

const deckOf = (...cards) => { const rest = []; for (let c = 0; c < 52; c++) if (!cards.includes(c)) rest.push(c); return [...rest, ...cards.slice().reverse()]; }; // the first listed is dealt first
const mk = (bank, players) => {
  const t = B.newBjTable();
  t.dealer = { uid: "d", name: "dealer" }; t.bank = bank;
  players.forEach((uid, i) => { if (uid) t.seats[i] = { uid, name: uid, bet: 0, cards: [], state: "wait" }; });
  return t;
};
const worth = (t, pockets) => t.bank + t.seats.reduce((n, s) => n + (s ? s.bet : 0), 0) + Object.values(pockets).reduce((a, b) => a + b, 0);

console.log("--- one round by hand");
{
  const t = mk(2000, ["a", "b", "c", null, null]);
  const ctx = { deck: deckOf(card("Ts"), card("9s"), card("As"), card("8d"), card("8h"), card("Kd"), card("7c"), card("6c"), card("Jc")), hole: null, now: 1000 };
  // deal order: seat0 c1, seat0 c2, seat1 c1 ... the engine deals two to each in turn: a: Ts 9s? (see below)
  check("no round before the dealer opens", B.deal(t, ctx) !== null);
  check("open", B.openRound(t, 1000) === null && t.phase === "betting");
  check("bets must be in range", B.placeBet(t, 0, 5, 1000) !== null && B.placeBet(t, 0, 251, 1000) !== null);
  check("a bets 100", B.placeBet(t, 0, 100, 1000) === null);
  check("one bet only", B.placeBet(t, 0, 50, 1000) !== null);
  check("b bets 50", B.placeBet(t, 1, 50, 1000) === null);
  check("an empty seat can't bet", B.placeBet(t, 3, 50, 1000) !== null);
  check("c doesn't bet: sits out", t.seats[2].bet === 0);
  check("the bank must cover: 2 x stakes <= bank", B.placeBet(t, 2, 250, 1000) === null && B.bjStakes(t) === 400);
  const ok2 = mk(300, ["a"]); B.openRound(ok2, 0);
  check("a small bank refuses a big bet", B.placeBet(ok2, 0, 200, 0) !== null && B.placeBet(ok2, 0, 150, 0) === null);
  check("deal", B.deal(t, ctx) === null && t.phase === "players");
  check("everybody with a bet has two cards, the dealer one face up and one hidden", t.seats[0].cards.length === 2 && t.seats[1].cards.length === 2 && t.seats[2].cards.length === 2 && t.dealerCards.length === 1 && t.hole && ctx.hole != null);
  check("a turn", t.turn >= 0 && t.seats[t.turn].state === "play");
}

console.log("--- payouts");
const roundWith = (bank, bets, cards) => { // cards: for each bettor two, then the dealer's up and hole, then the draw cards
  const t = mk(bank, bets.map((b, i) => (b ? "p" + i : null)));
  B.openRound(t, 0);
  bets.forEach((b, i) => { if (b) B.placeBet(t, i, b, 0); });
  const ctx = { deck: deckOf(...cards.map(card)), hole: null, now: 0 };
  B.deal(t, ctx);
  return { t, ctx };
};
{ // the player has 20, the dealer 18: the player wins
  const { t, ctx } = roundWith(1000, [100], ["Ks", "Qd", "9h", "9c"]);
  check("player 20, dealer 18", t.phase === "players" && B.bjValue(t.seats[0].cards).total === 20);
  B.playerMove(t, 0, "stand", ctx);
  check("the dealer's turn", t.phase === "dealer");
  check("can't draw before turning the card", B.dealerDraw(t, ctx) !== null);
  check("can't pay before turning", B.settle(t, 0) !== null);
  check("reveal", B.reveal(t, ctx) === null && t.dealerCards.length === 2);
  check("the dealer has 18 and may not draw", B.dealerDraw(t, ctx) !== null && B.canSettle(t));
  check("pay", B.settle(t, 5) === null && t.phase === "over" && t.seats[0].result === "win" && t.seats[0].back === 200 && t.bank === 900, JSON.stringify([t.seats[0], t.bank]));
}
{ // the dealer must draw below 17 and busts
  const { t, ctx } = roundWith(1000, [100], ["Ts", "8d", "Kh", "6c", "Qs"]);
  B.playerMove(t, 0, "stand", ctx);
  B.reveal(t, ctx);
  check("the dealer has 16 and has to draw", !B.canSettle(t) && B.settle(t, 0) !== null);
  check("draw: 26 bust", B.dealerDraw(t, ctx) === null && B.bjValue(t.dealerCards).total === 26);
  B.settle(t, 0);
  check("the player wins against a bust", t.seats[0].result === "win" && t.bank === 900);
}
{ // push and lose
  const { t, ctx } = roundWith(1000, [100, 100], ["Ts", "8d", "Ks", "7d", "Qh", "8c"]);
  // the first player has Ts 8d? (dealt in turn: seat0 gets cards 1,2; seat1 cards 3,4)
  B.playerMove(t, t.turn, "stand", ctx); B.playerMove(t, t.turn, "stand", ctx);
  B.reveal(t, ctx);
  B.settle(t, 0);
  check("18 pushes with 18, 17 loses to 18", t.seats[0].result === "push" && t.seats[0].back === 100 && t.seats[1].result === "lose" && t.seats[1].back === 0 && t.bank === 1100, JSON.stringify(t.seats.filter(Boolean).map((s) => [s.result, s.back, s.cards])) + t.bank + JSON.stringify(t.dealerCards));
}
{ // blackjack pays 3 to 2; both blackjack: push; the dealer's blackjack ends it at once
  const a = roundWith(1000, [100], ["As", "Kd", "9h", "9c"]);
  check("a natural is paid at once? no: the player has 'bj' and the round goes on to the dealer", a.t.seats[0].state === "bj" && a.t.phase === "dealer");
  B.reveal(a.t, a.ctx); B.settle(a.t, 0);
  check("3 to 2: 250 back", a.t.seats[0].result === "bj" && a.t.seats[0].back === 250 && a.t.bank === 850);
  const b = roundWith(1000, [100, 100], ["Ts", "9d", "5s", "6d", "Ah", "Kc"]);
  check("the dealer's blackjack: over at once, hidden card shown", b.t.phase === "over" && b.t.revealed && !b.t.hole);
  check("players lose their bets", b.t.seats[0].result === "lose" && b.t.seats[1].result === "lose" && b.t.bank === 1200);
  const c = roundWith(1000, [100, 100], ["As", "Kd", "5s", "6d", "Ah", "Kc"]);
  check("a player's blackjack against the dealer's: a tie", c.t.seats[0].result === "push" && c.t.seats[0].back === 100 && c.t.seats[1].result === "lose" && c.t.bank === 1100, JSON.stringify(c.t.seats.filter(Boolean).map((s) => [s.result, s.back, s.cards, s.state])));
}
{ // bust, double
  const { t, ctx } = roundWith(1000, [100, 100], ["Ts", "6d", "5h", "6c", "9c", "9d", "Kh", "Qs", "Jd"]);
  // seat 0: Ts 6d (16), seat 1: 5h 6c (11), dealer 9c up, 9d hole
  check("seat 0 first", t.turn === 0);
  check("a hit: bust", B.playerMove(t, 0, "hit", ctx) === null && t.seats[0].state === "bust" && t.turn === 1, JSON.stringify(t.seats[0]));
  check("double needs the first two cards", B.playerMove(t, 1, "double", ctx) === null && t.seats[1].doubled && t.seats[1].bet === 200 && t.seats[1].cards.length === 3 && t.seats[1].state === "stand", JSON.stringify(t.seats[1]));
  check("then it is the dealer's turn", t.phase === "dealer");
  B.reveal(t, ctx); B.settle(t, 0);
  check("the doubled hand: 5 6 + Qs = 21 beats 18 and gets 400 back", t.seats[1].result === "win" && t.seats[1].back === 400, JSON.stringify(t.seats[1]));
  check("bank: +100 from the bust, -200 from the double", t.bank === 900, String(t.bank));
}
{ // when everybody busts the dealer need not draw
  const { t, ctx } = roundWith(1000, [100], ["Ts", "6d", "9c", "5d", "Kh"]);
  B.playerMove(t, 0, "hit", ctx);
  check("bust: the dealer's turn", t.phase === "dealer" && !B.handsToBeat(t));
  B.reveal(t, ctx);
  check("no need to draw, pay", B.canSettle(t) && B.dealerDraw(t, ctx) !== null && B.settle(t, 0) === null && t.bank === 1100);
}

console.log("--- timers and a round that can't go on");
{
  const { t, ctx } = roundWith(1000, [100, 100], ["Ts", "6d", "5h", "6c", "9c", "9d", "Kh"]);
  ctx.now = 30_000;
  check("a player who took too long stands", B.bjTick(t, ctx) && t.seats[0].state === "stand" && t.turn === 1 || t.phase === "dealer");
  ctx.now = 90_000; B.bjTick(t, ctx);
  check("an idle dealer has the clicks made", t.phase === "over" || t.phase === "dealer");
  for (let k = 0; k < 6 && t.phase !== "over"; k++) { ctx.now += 50_000; B.bjTick(t, ctx); }
  check("it ends", t.phase === "over");
  ctx.now += 10_000; B.bjTick(t, ctx);
  check("and the table is idle again with empty hands", t.phase === "idle" && t.seats[0].cards.length === 0 && t.seats[0].bet === 0);
}
{
  const t = mk(1000, ["a", "b"]); B.openRound(t, 0); B.placeBet(t, 0, 100, 0); B.placeBet(t, 1, 50, 0);
  const back = B.voidRound(t);
  check("a voided round gives the bets back", back[0] === 100 && back[1] === 50 && t.phase === "idle" && B.bjStakes(t) === 0);
}

console.log("--- random rounds: blood is never made or lost");
let seed = 99;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x1_0000_0000; };
const shuffled = () => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };
let rounds = 0, wins = 0, losses = 0, pushes = 0, bjs = 0;
for (let game = 0; game < 300; game++) {
  const n = 1 + Math.floor(rnd() * 5);
  const t = mk(500 + Math.floor(rnd() * 4500), Array.from({ length: 5 }, (_, i) => (i < n ? "p" + i : null)));
  const pockets = Object.fromEntries(Array.from({ length: n }, (_, i) => ["p" + i, 1000]));
  const start = worth(t, pockets);
  let now = 1000;
  for (let r = 0; r < 25; r++) {
    const ctx = { deck: shuffled(), hole: null, now };
    if (B.openRound(t, now)) break;
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.8) { const amt = 10 + Math.floor(rnd() * 241); if (pockets["p" + i] >= amt && !B.placeBet(t, i, amt, now)) pockets["p" + i] -= amt; }
    }
    if (B.deal(t, ctx)) { B.voidRound(t); continue; } // (nobody bet: no round)
    rounds++;
    let steps = 0;
    while (t.phase === "players" && steps++ < 100) {
      const s = t.seats[t.turn];
      const v = B.bjValue(s.cards).total;
      const m = v < 12 ? (s.cards.length === 2 && pockets[s.uid] >= s.bet && rnd() < 0.3 ? "double" : "hit") : v < 17 && rnd() < 0.6 ? "hit" : "stand";
      if (m === "double") pockets[s.uid] -= s.bet;
      const before = s.bet;
      const err = B.playerMove(t, t.turn, m, ctx);
      if (err) { if (m === "double") pockets[s.uid] += before; B.playerMove(t, t.turn, "stand", ctx); }
      now += 1000; ctx.now = now;
    }
    if (t.phase === "dealer") {
      B.reveal(t, ctx);
      while (!B.canSettle(t) && steps++ < 200) { const e = B.dealerDraw(t, ctx); if (e) { check("the dealer can draw when it can't settle", false, e); break; } }
      check("the dealer ends on 17 or more, or nobody is left", B.canSettle(t));
      B.settle(t, now);
    }
    check("the round is over", t.phase === "over");
    for (const s of t.seats) if (s && s.bet > 0) { pockets[s.uid] += s.back; s.bet = 0; if (s.result === "win") wins++; else if (s.result === "lose") losses++; else if (s.result === "push") pushes++; else if (s.result === "bj") bjs++; }
    const now2 = worth(t, pockets);
    if (now2 !== start) { check("blood is constant after a round", false, `${now2} vs ${start}`); break; }
    if (t.bank < 0) { check("the bank never goes below zero", false, String(t.bank)); break; }
    now += 20_000; ctx.now = now; B.bjTick(t, ctx);
  }
  check("blood is constant at the end of the game", worth(t, pockets) === start, `${worth(t, pockets)} vs ${start}`);
}
check("rounds were played, with every kind of result", rounds > 1500 && wins > 300 && losses > 300 && pushes > 20 && bjs > 20, JSON.stringify({ rounds, wins, losses, pushes, bjs }));
console.log(`(${rounds} rounds: ${wins} wins, ${losses} losses, ${pushes} pushes, ${bjs} blackjacks)`);

console.log("--- the table survives the database");
{
  const { t } = roundWith(1000, [100, 50], ["Ts", "6d", "5h", "6c", "9c", "9d"]);
  const back = B.parseBj(JSON.parse(JSON.stringify(B.bjToDb(t))));
  check("the same table comes back", JSON.stringify(back.seats) === JSON.stringify(t.seats) && back.phase === t.phase && back.bank === t.bank && back.dealer.uid === "d" && back.hole === true && back.turn === t.turn);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
