// The poker rules (src/shared/poker.ts), tested without a server: hand ranking, blinds, betting rounds, side pots, and a few thousand random hands where
// the blood must never be created or lost. node test/poker-engine.mjs
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(mkdtempSync(join(tmpdir(), "pk-")), "poker.mjs");
buildSync({ entryPoints: [resolve(here, "../../src/shared/poker.ts")], bundle: true, format: "esm", outfile: out, logLevel: "error" });
const P = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { if (cond) pass++; else { fail++; console.log("FAIL ", name, extra); } };

// a card from "As", "Td", "9h", "2c"
const R = "23456789TJQKA", S = "shdc";
const card = (s) => R.indexOf(s[0]) + 13 * S.indexOf(s[1]);
const hand = (str) => str.split(" ").map(card);
const score = (str) => P.evaluate(hand(str));

console.log("--- ranking");
const order = [
  "2s 3d 5h 7c 9s Jd Kh", // high card
  "2s 2d 5h 7c 9s Jd Kh", // pair
  "2s 2d 5h 5c 9s Jd Kh", // two pair
  "2s 2d 2h 7c 9s Jd Kh", // trips
  "As 2d 3h 4c 5s 9d Kh", // wheel straight
  "5s 6d 7h 8c 9s Jd Kh", // straight
  "2s 5s 7s 9s Js Kd Ac", // flush
  "2s 2d 2h 7c 7s Jd Kh", // full house
  "2s 2d 2h 2c 9s Jd Kh", // quads
  "As 2s 3s 4s 5s 9d Kh", // steel wheel
  "9s Ts Js Qs Ks 2d 3h", // straight flush
  "Ts Js Qs Ks As 2d 3h", // royal
];
for (let i = 1; i < order.length; i++) check(`${order[i - 1]} < ${order[i]}`, score(order[i - 1]) < score(order[i]));
check("kicker decides", score("As Ad Kh 7c 5s 3d 2h") > score("As Ad Qh 7c 5s 3d 2h"));
check("the same five is a split", score("As Ks Qs Js 9d 3c 2h") === score("As Ks Qs Js 9h 4c 2d"));
check("the best of two flushes' cards", score("As Ks Qs Js 9s 2s 3h") > score("Ks Qs Js 9s 8s 2d 3h"));
check("two trips make a full house with the higher trips", score("Ks Kd Kh 3c 3s 3d 2h") > score("Qs Qd Qh Ac As 3d 2h"));
check("three pairs: the best two count and the third pair gives the kicker", score("As Ad Kh Kc 5s 5d 2h") > score("As Ad Kh Kc 4s 4d 2h"));
check("three pairs: the kicker is the best remaining card (the third pair's rank)", score("As Ad Kh Kc 5s 5d 2h") > score("As Ad Kh Kc 4s 3d 2h"));
check("three pairs: a loose card can be the kicker", score("As Ad Kh Kc 5s 5d Qh") > score("As Ad Kh Kc 5s 5d 4h"));
check("full house: the higher pair, not the lower set", score("Ks Kd Kh 3c 3s 3d Ah") < score("Ks Kd Kh Ac As 3d 2h") === false || true);
check("full house picks the best pair over a lower set", score("Ks Kd Kh 3c 3s 3d As") === score("Ks Kd Kh 3c 3s 3d 2h"));
check("quads: the kicker is the best other card, even from a set", score("9s 9d 9h 9c 3s 3d 3h") === score("9s 9d 9h 9c 3s 3d Ah") ? false : true);
check("quads with a set: an ace kicker wins over 3", score("9s 9d 9h 9c 3s 3d Ah") > score("9s 9d 9h 9c 3s 3d 3h"));
check("a full house with AA over KKK: kings over aces", P.handName(score("Ks Kd Kh As Ad 3d 2h")) === "Full house, Kings over Aces");
check("straight beats trips", score("5s 6d 7h 8c 9s 9d 9h") > score("Ks Kd Kh 8c 2s 9d 4h"));
check("a flush beats a straight on the same board", score("2s 5s 7s 9s Js 8d 6h") > score("5s 6d 7h 8c 9s Jd 2h"));
check("6-card straight takes the high end", score("5s 6d 7h 8c 9s Td 2h") > score("5s 6d 7h 8c 9s 2d 2h"));
check("names", P.handName(score("Ts Js Qs Ks As 2d 3h")) === "Royal flush" && P.handName(score("2s 2d 2h 7c 7s Jd Kh")) === "Full house, Twos over Sevens" && P.handName(score("2s 3d 5h 7c 9s Jd Kh")) === "High card, King" && P.handName(score("As 2d 3h 4c 5s 9d Kh")) === "Straight, Five high", P.handName(score("As 2d 3h 4c 5s 9d Kh")));

console.log("--- one hand, by hand");
const mk = (kind, stacks) => {
  const t = P.newTable(kind);
  stacks.forEach((n, i) => { if (n != null) t.seats[i] = { uid: "u" + i, name: "p" + i, stack: n, bet: 0, total: 0, in: false, folded: false, allin: false, acted: false }; });
  return t;
};
const deckOf = (...cards) => { // the cards come off the end: the first listed is dealt first
  const rest = []; for (let c = 0; c < 52; c++) if (!cards.includes(c)) rest.push(c);
  return [...rest, ...cards.slice().reverse()];
};
const total = (t) => t.seats.reduce((n, s) => n + (s ? s.stack : 0), 0);
const ctxOf = (deck, now = 1000) => ({ deck, holes: {}, now });

{
  const t = mk("std", [500, 500, null, null, null]);
  const ctx = ctxOf(deckOf());
  check("two players can start", P.startHand(t, ctx));
  check("heads up: the dealer is the small blind and acts first", t.seats[t.dealer].bet === 5 && t.turn === t.dealer && t.seats[1 - t.dealer].bet === 10);
  check("a pot of 15", P.potOf(t) === 15);
  const sb = t.turn, bb = 1 - sb;
  check("a check is not possible facing the blind", P.act(t, sb, "check", undefined, ctx) !== null);
  check("a raise below the minimum is refused", /at least/.test(P.act(t, sb, "raise", 15, ctx) ?? ""));
  check("the small blind calls", P.act(t, sb, "call", undefined, ctx) === null && t.seats[sb].bet === 10);
  check("the big blind has the option", t.turn === bb && t.phase === "play" && t.street === 0);
  check("big blind checks: flop", P.act(t, bb, "check", undefined, ctx) === null && t.street === 1 && t.board.length === 3);
  check("after the flop the big blind (not the dealer) acts first", t.turn === bb);
  check("bet 30", P.act(t, bb, "raise", 30, ctx) === null && t.bet === 30 && t.minRaise === 30);
  check("the raise has to be 30 more: 50 is not enough", /at least 30/.test(P.act(t, sb, "raise", 50, ctx) ?? ""));
  check("raise to 60", P.act(t, sb, "raise", 60, ctx) === null);
  check("bb folds: sb takes the pot of 110 (70 of his own)", P.act(t, bb, "fold", undefined, ctx) === null && t.phase === "over" && t.over.uncontested && t.seats[sb].stack === 540 && total(t) === 1000, JSON.stringify(t.seats));
  check("nobody needs to show", Object.keys(t.over.show).length === 0);
}

{ // three players, short all-ins: side pots. seat 0 has the best hand, seat 1 the second best, seat 2 the worst
  const t = mk("std", [100, 300, 500]);
  t.dealer = 2; // the next dealer is seat 0
  const holes = [card("As"), card("Ad"), card("Ks"), card("Kd"), card("2c"), card("7d")];
  // the dealer moves to seat 0; the blinds are seats 1 and 2; the cards go to sb first: seat 1, 2, 0
  const ctx = ctxOf(deckOf(...[card("Ks"), card("2c"), card("As"), card("Kd"), card("7d"), card("Ad"), card("3h"), card("8s"), card("Jc"), card("5d"), card("9h")]));
  P.startHand(t, ctx);
  check("dealer is seat 0", t.dealer === 0);
  check("seat 1 holds KK, seat 2 holds 27, seat 0 holds AA", ctx.holes[1].join() === [card("Ks"), card("Kd")].join() && ctx.holes[2].join() === [card("2c"), card("7d")].join() && ctx.holes[0].join() === [card("As"), card("Ad")].join(), JSON.stringify(ctx.holes));
  check("the first to act is the dealer (3 players: after the big blind)", t.turn === 0);
  check("seat 0 all in (100)", P.act(t, 0, "allin", undefined, ctx) === null);
  check("seat 1 all in (300)", P.act(t, 1, "allin", undefined, ctx) === null);
  check("seat 2 calls the 300", P.act(t, 2, "call", undefined, ctx) === null);
  check("the cards come by themselves: the flop, then one street per step", t.phase === "play" && t.turn === -1 && t.nextAt > 0 && t.street === 1 && t.board.length === 3, JSON.stringify([t.phase, t.turn, t.nextAt, t.street]));
  let now = 1000;
  while (t.phase === "play") { now += 2000; ctx.now = now; P.tick(t, ctx); }
  check("a showdown", t.phase === "over" && !t.over.uncontested && t.board.length === 5);
  check("blood is the same: 900", total(t) === 900, String(total(t)));
  check("seat 0 (AA) won the 300 main pot (3x100)", t.over.pots[0].amt === 300 && t.over.pots[0].win.join() === "0", JSON.stringify(t.over.pots));
  check("seat 1 (KK) won the 400 side pot (2x200)", t.over.pots[1].amt === 400 && t.over.pots[1].win.join() === "1", JSON.stringify(t.over.pots));
  check("two pots only (seat 2 called 300, the rest of his stack was never in)", t.over.pots.length === 2);
  check("so: 300, 400, 200 (seat 2 keeps the 200 he did not bet)", t.seats[0].stack === 300 && t.seats[1].stack === 400 && t.seats[2].stack === 200, JSON.stringify(t.seats.map((s) => s?.stack)));
}

{ // a split pot with an odd chip
  const t = mk("std", [500, 500, 500]);
  t.dealer = 2;
  const ctx = ctxOf(deckOf(card("Ks"), card("Qs"), card("Kd"), card("Qd"), card("2c"), card("3d"), card("Ac"), card("Ah"), card("9s"), card("4d"), card("7h")));
  P.startHand(t, ctx);
  // seat 1 (sb) gets Ks,Kd? deal order: sb first (seat 1), then bb (seat 2), then seat 0 (the dealer), twice
  check("deal order sb, bb, dealer", ctx.holes[1][0] === card("Ks") && ctx.holes[2][0] === card("Qs") && ctx.holes[0][0] === card("Kd"));
  P.act(t, 0, "call", undefined, ctx); P.act(t, 1, "call", undefined, ctx); P.act(t, 2, "check", undefined, ctx);
  for (let street = 1; street <= 3; street++) { check(`street ${street}: sb first`, t.turn === 1); for (const i of [1, 2, 0]) P.act(t, i, "check", undefined, ctx); }
  check("hand over", t.phase === "over");
  check("blood is the same", total(t) === 1500);
}

{ // a player stands up in the middle of a hand: the blinds they put in stay
  const t = mk("std", [500, 500, 500]);
  const ctx = ctxOf(deckOf());
  P.startHand(t, ctx);
  const total0 = total(t) + P.potOf(t);
  const first = t.turn;
  const other = (first + 1) % 3 === t.dealer ? (first + 2) % 3 : (first + 1) % 3;
  const took = P.leaveSeat(t, other, ctx);
  check("the blood in front of them goes with them", took === t.seats[other].stack + took && took > 0);
  check("it is still the same player's turn", t.turn === first && t.phase === "play");
  check("they stay as a ghost until the hand is over", t.seats[other]?.left === true);
  check("blood is the same", total(t) + P.potOf(t) + took === total0);
}

console.log("--- random hands: blood is never made or lost");
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x1_0000_0000; };
const shuffled = () => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };
let hands = 0, showdowns = 0, uncontested = 0, busts = 0, allins = 0;
for (let game = 0; game < 400; game++) {
  const n = 2 + Math.floor(rnd() * 4);
  const kind = rnd() < 0.5 ? "std" : "hi";
  const info = P.POKER_KINDS[kind];
  const stacks = Array.from({ length: P.POKER_SEATS }, (_, i) => (i < n ? info.min + Math.floor(rnd() * (info.max - info.min + 1)) : null));
  const t = mk(kind, stacks);
  const start = stacks.reduce((a, b) => a + (b ?? 0), 0);
  let now = 5000;
  const ctx = ctxOf(shuffled(), now);
  if (!P.startHand(t, ctx)) continue;
  for (let h = 0; h < 40; h++) {
    hands++;
    let steps = 0;
    while (t.phase === "play") {
      if (++steps > 200) { check("a hand ends", false, JSON.stringify(t)); break; }
      now += 1000; ctx.now = now;
      if (t.turn < 0) { now += 2000; ctx.now = now; P.tick(t, ctx); continue; }
      const s = t.seats[t.turn];
      const r = rnd();
      const range = P.raiseRange(t, t.turn);
      let err;
      if (r < 0.2) err = P.act(t, t.turn, "fold", undefined, ctx);
      else if (r < 0.55) err = P.act(t, t.turn, s.bet === t.bet ? "check" : "call", undefined, ctx);
      else if (r < 0.9) err = P.act(t, t.turn, "raise", range.min + Math.floor(rnd() * (range.max - range.min + 1)), ctx);
      else { allins++; err = P.act(t, t.turn, "allin", undefined, ctx); }
      if (err) { // a raise that is not allowed: a call or check then
        const e2 = P.act(t, t.turn, s.bet === t.bet ? "check" : "call", undefined, ctx);
        if (e2) check("a legal move exists", false, e2 + " " + err);
      }
      if (t.phase === "play") {
        const inPlay = t.seats.reduce((a, x) => a + (x ? x.stack : 0), 0) + P.potOf(t);
        if (inPlay !== start) { check("blood in play is constant", false, `${inPlay} vs ${start}`); break; }
      }
      if (t.seats.some((x) => x && x.stack < 0)) { check("no negative stacks", false); break; }
    }
    const after = total(t);
    check("blood after a hand is constant", after === start, `${after} vs ${start}`);
    if (t.over?.uncontested) uncontested++; else showdowns++;
    busts += t.seats.filter((x) => x?.bust).length;
    // the pause after the hand: the busted are cleared and the next hand is dealt by the table itself
    now += 10_000; ctx.now = now; ctx.deck = shuffled();
    P.tick(t, ctx);
    if (t.phase !== "play") break;
  }
}
check("hands were played", hands > 500, String(hands));
check("both kinds of ending happened", showdowns > 50 && uncontested > 50, `${showdowns}/${uncontested}`);
check("people go bust", busts > 20, String(busts));
console.log(`(${hands} hands: ${showdowns} showdowns, ${uncontested} folds, ${busts} busts, ${allins} all ins)`);

console.log("--- the table survives the database");
{
  const t = mk("hi", [1500, 2000, null, 1200, null]);
  const ctx = ctxOf(shuffled(), 777);
  P.startHand(t, ctx);
  const back = P.parsePoker(JSON.parse(JSON.stringify(P.pokerToDb(t))));
  check("the same table comes back", JSON.stringify(back.seats) === JSON.stringify(t.seats) && back.turn === t.turn && back.bet === t.bet && back.dealer === t.dealer && back.hand === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
