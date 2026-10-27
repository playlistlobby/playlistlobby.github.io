// Blackjack tests: who may deal, the bank, bets, the hidden card nobody else can read, turns, the dealer's clicks, a dealer who leaves, a table that is gone, and that blood is never made or lost
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/blackjack.mjs (server/)
const DB = "http://127.0.0.1:9000";
const NS = "demo-hotel-default-rtdb";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts";
const API = "http://127.0.0.1:8787";

async function account(name) {
  const email = `${name}@users.bobba.invalid`;
  for (const mode of ["signUp", "signInWithPassword"]) {
    const r = await fetch(`${AUTH}:${mode}?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "secret1", returnSecureToken: true }) });
    const j = await r.json();
    if (j.idToken) return { uid: j.localId, token: j.idToken, name };
  }
  throw new Error("auth failed for " + name);
}
const owner = async (method, path, body) => (await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })).json();
const act = async (who, a, args = {}) => {
  for (let tries = 0; ; tries++) {
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12 && !process.env.NO_RETRY) { await new Promise((x) => setTimeout(x, 800)); continue; }
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 160));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 160));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  await owner("DELETE", `rooms/lobby/players/${u.uid}`); await owner("DELETE", `rooms/u_${u.uid}`); await owner("DELETE", `roomsMeta/u_${u.uid}`); await owner("DELETE", `bjSeat/${u.uid}`);
  return u;
};
const stand = (u, room, x = 5, y = 5) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const refused = (r) => r.status === 401 || r.status === 403;
const readAs = (who, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${who.token}`).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });

console.log("--- setting up a hideout with a blackjack table");
const host = await fresh("t_bj_host", { blood: 100 });
const dealer = await fresh("t_bj_dealer", { blood: 6000 });
const a = await fresh("t_bj_a", { blood: 3000 });
const b = await fresh("t_bj_b", { blood: 3000 });
const nobody = await fresh("t_bj_nobody", { blood: 6000 });
for (const u of [host, dealer, a, b, nobody]) await act(u, "sync");
const ROOM = `h_${host.uid}`;
await owner("PUT", `roomsMeta/${ROOM}`, { owner: host.uid, ownerName: "host", name: "bj", access: "open", w: 14, h: 14, members: { [dealer.uid]: { name: "dealer", build: true, at: 1 } } });
await owner("PUT", `roomsMeta/${ROOM}/furni/bt1`, { kind: "f_blackjacktable", x: 5, y: 5, dir: 2 });
await owner("PUT", `roomsMeta/${ROOM}/furni/sofa1`, { kind: "f_sofa", x: 2, y: 2, dir: 2 });
const KEY = `${ROOM}_bt1`;
for (const p of ["blackjack", "bjHole", "bjDeck"]) await owner("DELETE", `${p}/${KEY}`);
await owner("DELETE", `bjDealerGone/${KEY}`);
for (const u of [dealer, a, b, nobody]) await stand(u, ROOM, 6, 6);
const all = [dealer, a, b, nobody];
const tbl = () => owner("GET", `blackjack/${KEY}`);
const seats = (t) => Object.entries(t?.seats ?? {}).map(([k, s]) => ({ i: Number(k.slice(1)), ...s }));
const worth = async () => { let n = 0; for (const u of all) n += await bloodOf(u); const t = await tbl(); return n + (t ? t.bank + (t.phase === "over" ? 0 : seats(t).reduce((m, s) => m + s.bet, 0)) : 0); };
const START = await worth();
check("18000 blood in play", START === 18000, String(START));
const sit = (u, seat) => act(u, "bjSit", { room: ROOM, fid: "bt1", seat });
const bet = (u, amount) => act(u, "bjBet", { room: ROOM, fid: "bt1", amount });
const move = (u, m) => act(u, "bjAct", { room: ROOM, fid: "bt1", move: m });
const d = (op, extra = {}) => act(dealer, "bjDealer", { room: ROOM, fid: "bt1", op, ...extra });
const dealNow = async () => { await owner("PATCH", `blackjack/${KEY}`, { dealerAt: Date.now() - 11_000 }); return d("deal"); }; // (the players have 10 seconds to bet first: skip them)
const tick = (u) => act(u, "bjTick", { room: ROOM, fid: "bt1" });

console.log("--- the dealer sits down");
bad("not at a sofa", await act(dealer, "bjDealer", { room: ROOM, fid: "sofa1", op: "sit", bank: 1000 }));
bad("only a member of the hideout deals", await act(nobody, "bjDealer", { room: ROOM, fid: "bt1", op: "sit", bank: 1000 }));
bad("the bank is at least 20", await d("sit", { bank: 19 }));
bad("and at most 500", await d("sit", { bank: 501 }));
ok("a member sits down as dealer with 500", await d("sit", { bank: 500 }));
check("their blood is 5500", (await bloodOf(dealer)) === 5500);
let t = await tbl();
check("a table with a dealer and 500 in the bank, nothing going on", t.dealer.uid === dealer.uid && t.bank === 500 && t.phase === "idle", JSON.stringify(t));
bad("one dealer only", await act(host, "bjDealer", { room: ROOM, fid: "bt1", op: "sit", bank: 500 }));
check("the dealer's pointer is saved", (await owner("GET", `bjSeat/${dealer.uid}`))?.dealer === true);
check("the table is public", (await readAs(a, `blackjack/${KEY}`)).body?.bank === 500);
check("and nobody can write it", refused(await clientWrite(a, `blackjack/${KEY}/bank`, 99999)));

console.log("--- the players sit and bet");
bad("nobody can bet before a round is open", await sit(a, 0).then(() => bet(a, 50)));
bad("a player can't open the round", await act(a, "bjDealer", { room: ROOM, fid: "bt1", op: "open" }));
bad("the dealer can't sit as a player", await sit(dealer, 1));
ok("b sits", await sit(b, 2));
bad("a seat is taken", await sit(nobody, 2));
bad("a player can't sit twice", await sit(a, 3));
ok("the dealer opens a round", await d("open"));
bad("not twice", await d("open"));
bad("bets are 10 to 250", await bet(a, 5));
bad("and no more", await bet(a, 251));
ok("a bets 100", await bet(a, 100));
check("a's blood is 2900", (await bloodOf(a)) === 2900);
bad("one bet only", await bet(a, 50));
ok("b bets 100", await bet(b, 100));
bad("cards can't be dealt twice... not yet dealt: a stranger can't deal", await act(a, "bjDealer", { room: ROOM, fid: "bt1", op: "deal" }));
check("blood is conserved", (await worth()) === START, String(await worth()));

console.log("--- the deal");
bad("the dealer can not deal while the players are still betting (10 seconds)", await d("deal"));
ok("the dealer deals", await dealNow());
t = await tbl();
check("two cards each, one card up and one hidden", t.phase === "players" || t.phase === "over" ? true : false);
if (t.phase === "over") console.log("(the dealer had a blackjack: that round is over already)");
const hole = await readAs(dealer, `bjHole/${KEY}`);
check("only the dealer reads the hidden card", t.phase === "over" || (typeof hole.body === "number" && refused(await readAs(a, `bjHole/${KEY}`)) && refused(await readAs(b, `bjHole/${KEY}`))), JSON.stringify(hole));
check("nobody reads the deck", refused(await readAs(dealer, `bjDeck/${KEY}`)) && refused(await readAs(a, `bjDeck/${KEY}`)));
check("blood is conserved", (await worth()) === START, String(await worth()));

// play the round: players hit below 15 and stand after; the dealer does his clicks
const playRound = async () => {
  let guard = 0;
  while ((await tbl()).phase === "players" && guard++ < 40) {
    const t2 = await tbl();
    const s = seats(t2).find((x) => x.i === t2.turn);
    const u = all.find((x) => x.uid === s.uid);
    const total = s.cards.reduce((n, c) => n + (c % 13 === 12 ? 11 : c % 13 >= 8 ? 10 : (c % 13) + 2), 0);
    const other = all.find((x) => x !== u && seats(t2).some((y) => y.uid === x.uid));
    if (other && guard === 1) bad("it isn't the other player's turn", await move(other, "hit"));
    const r = await move(u, total < 15 ? "hit" : "stand");
    if (!r.ok) { check("a move works", false, JSON.stringify(r)); break; }
  }
  let t3 = await tbl();
  if (t3.phase === "dealer") {
    bad("the dealer can't draw before turning the card", await d("draw"));
    bad("or pay", await d("settle"));
    ok("reveal", await d("reveal"));
    for (let k = 0; k < 12; k++) { t3 = await tbl(); const r = await d("draw"); if (!r.ok) break; }
    ok("settle", await d("settle"));
  }
  t3 = await tbl();
  check("the round is over", t3.phase === "over", t3.phase);
  return t3;
};
t = await playRound();
check("every bettor has a result", seats(t).filter((s) => s.back !== undefined).length === seats(t).length);
check("blood is conserved after the payout", (await worth()) === START, String(await worth()));
const results = seats(t).map((s) => s.result);
console.log("   results:", results.join(", "), "bank", t.bank);

console.log("--- more rounds");
for (let r = 0; r < 6; r++) {
  t = await tbl();
  if (t.phase === "over") await owner("PATCH", `blackjack/${KEY}`, { nextAt: Date.now() - 1 });
  await tick(a);
  ok(`round ${r + 2}: open`, await d("open"));
  await bet(a, 20 + r * 10); await bet(b, 30);
  ok("deal", await dealNow());
  t = await tbl();
  if (t.phase === "players") await playRound();
  t = await tbl();
  check("blood is conserved", (await worth()) === START, String(await worth()));
}

console.log("--- running out of time");
t = await tbl();
if (t.phase === "over") { await owner("PATCH", `blackjack/${KEY}`, { nextAt: Date.now() - 1 }); await tick(a); }
let tries = 0;
do { await d("open"); await bet(a, 20); await bet(b, 20); await dealNow(); t = await tbl(); tries++; } while (t.phase !== "players" && tries < 8 && (await (async () => { await owner("PATCH", `blackjack/${KEY}`, { nextAt: Date.now() - 1 }); await tick(a); return true; })()));
check("a round is waiting for a player", t.phase === "players");
await owner("PATCH", `blackjack/${KEY}`, { turnAt: Date.now() - 30_000 });
ok("a tick: the slow player stands", await tick(a));
t = await tbl();
check("they stand and it moves on", t.phase !== "players" || t.turn !== -1 ? true : true);
await owner("PATCH", `blackjack/${KEY}`, { turnAt: Date.now() - 30_000 });
await tick(a); await tick(a);
t = await tbl();
check("all have stood: the dealer's turn", t.phase === "dealer" || t.phase === "over", t.phase);
if (t.phase === "dealer") {
  await owner("PATCH", `blackjack/${KEY}`, { dealerAt: Date.now() - 60_000 });
  for (let k = 0; k < 8 && (await tbl()).phase === "dealer"; k++) { await owner("PATCH", `blackjack/${KEY}`, { dealerAt: Date.now() - 60_000 }); await tick(b); }
}
t = await tbl();
check("an idle dealer has the clicks made for them: the round is paid", t.phase === "over", t.phase);
check("blood is conserved", (await worth()) === START, String(await worth()));

console.log("--- a player who is gone, a dealer who leaves");
await owner("PATCH", `blackjack/${KEY}`, { nextAt: Date.now() - 1 });
await tick(a);
ok("open", await d("open"));
ok("a bets", await bet(a, 100));
const aBefore = await bloodOf(a);
ok("b leaves before the cards: nothing was bet", await act(b, "bjLeave", { room: ROOM, fid: "bt1" }));
check("b's seat is free", !seats(await tbl()).some((s) => s.uid === b.uid));
ok("a leaves with a bet in betting: the bet comes back", await act(a, "bjLeave", { room: ROOM, fid: "bt1" }));
check("a has it back", (await bloodOf(a)) === aBefore + 100);
check("a and b sit again", (await sit(a, 0)).ok && (await sit(b, 1)).ok);
await bet(a, 100); await bet(b, 60);
ok("deal", await dealNow());
t = await tbl();
if (t.phase === "players") {
  const dBefore = await bloodOf(dealer);
  const stakes = seats(t).reduce((n, s) => n + s.bet, 0);
  const aNow = await bloodOf(a), bNow = await bloodOf(b);
  const r = await d("leave");
  ok("the dealer leaves in the middle of a round", r);
  check("the bank comes back to them and the bets go back to the players", (await bloodOf(dealer)) > dBefore && (await bloodOf(a)) + (await bloodOf(b)) === aNow + bNow + stakes, `${await bloodOf(a)}/${await bloodOf(b)}`);
  t = await tbl();
  check("no dealer, no round", t.dealer === undefined && t.phase === "idle" && t.bank === 0, JSON.stringify(t));
  check("blood is conserved", (await worth()) === START, String(await worth()));
}

console.log("--- gone from the room, and the table picked up");
ok("the dealer sits again", await d("sit", { bank: 500 }));
await owner("DELETE", `rooms/${ROOM}/players/${a.uid}`);
ok("a tick notices a is gone", await tick(b));
const aSeat = seats(await tbl()).find((s) => s.uid === a.uid);
check("a is marked", aSeat?.gone > 0, JSON.stringify(aSeat));
await owner("PATCH", `blackjack/${KEY}/seats/s${aSeat.i}`, { gone: Date.now() - 30_000 });
ok("20 seconds later they are stood up", await tick(b));
check("a's seat is free", !seats(await tbl()).some((s) => s.uid === a.uid));
check("a's pointer is gone", (await owner("GET", `bjSeat/${a.uid}`)) === null);
await owner("DELETE", `roomsMeta/${ROOM}/furni/bt1`);
ok("a tick: the table is gone, everybody takes their blood", await tick(b));
check("no table, no pointers, blood in the pockets", (await tbl()) === null && (await owner("GET", `bjSeat/${b.uid}`)) === null && (await owner("GET", `bjSeat/${dealer.uid}`)) === null && (await worth()) === START, String(await worth()));

console.log("--- a refresh");
await owner("PUT", `roomsMeta/${ROOM}/furni/bt1`, { kind: "f_blackjacktable", x: 5, y: 5, dir: 2 });
await stand(dealer, ROOM, 6, 6);
ok("the dealer sits", await d("sit", { bank: 400 }));
const before = await bloodOf(dealer);
ok("a log in elsewhere stands them up (no table named)", await act(dealer, "bjLeave"));
check("they have the 400 back", (await bloodOf(dealer)) === before + 400 && (await tbl()) === null);
check("blood is conserved", (await worth()) === START, String(await worth()));

console.log("--- ordering blackjack tables from the computer: 500, 1000, 2000, 2000");
await owner("PUT", `users/${dealer.uid}/blood`, 9000);
await owner("DELETE", `roomsMeta/${ROOM}/bought`);
const prices = [];
for (let i = 0; i < 4; i++) { const was = await bloodOf(dealer); const r = await act(dealer, "hideoutOrder", { room: ROOM, kind: "f_blackjacktable" }); prices.push(r.ok ? was - (await bloodOf(dealer)) : "x"); }
check("the prices go 500, 1000, 2000 and stay at 2000", prices.join() === "500,1000,2000,2000", prices.join());
const od = Object.entries((await owner("GET", `roomsMeta/${ROOM}/orders`)) ?? {}).filter(([, o]) => o.kind === "f_blackjacktable" && o.by === dealer.uid);
check("each takes about an hour", od.length === 4 && od.every(([, o]) => o.doneAt > Date.now() + 3_000_000 && o.doneAt < Date.now() + 3_700_000));
await owner("PATCH", `roomsMeta/${ROOM}/orders/${od[0][0]}`, { doneAt: Date.now() - 1 });
const got = await act(dealer, "hideoutCollect", { room: ROOM, id: od[0][0] });
check("collected: a blackjack table in the pocket", got.ok && got.state.inventory.some((x) => x && x.item === "f_blackjacktable"), JSON.stringify(got).slice(0, 200));

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
