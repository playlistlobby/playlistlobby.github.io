// Poker tests: sitting down and buying in, the cards nobody else can read, turns and timeouts, leaving with your blood, a table that is gone, going bust, and that the blood is never made or lost
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/poker.mjs (server/)
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
const owner = async (method, path, body) => {
  const r = await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};
const act = async (who, a, args = {}) => {
  for (let tries = 0; ; tries++) {
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json", ...(who.device ? { "x-device": who.device } : {}) }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12 && !process.env.NO_RETRY) { await new Promise((x) => setTimeout(x, 800)); continue; } // the anti-spam limit: wait and go on
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 160));
const bad = (label, r, status) => check(label, r.ok === false && (!status || r.status === status), JSON.stringify(r).slice(0, 160));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  await owner("DELETE", `rooms/lobby/players/${u.uid}`); await owner("DELETE", `rooms/shop/players/${u.uid}`); await owner("DELETE", `rooms/tut_${u.uid}`); await owner("DELETE", `rooms/u_${u.uid}`); await owner("DELETE", `roomsMeta/u_${u.uid}`);
  return u;
};
const stand = (u, room, x = 5, y = 5) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROOM = (u) => `u_${u.uid}`;
const KEY = (u, fid) => `${ROOM(u)}_${fid}`;
const tbl = (u, fid) => owner("GET", `poker/${KEY(u, fid)}`);
const seatsOf = (t) => Object.entries(t?.seats ?? {}).map(([k, s]) => ({ i: Number(k.slice(1)), ...s }));
const readAs = (who, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${who.token}`).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const sit = (u, host, fid, seat, buy) => act(u, "pokerSit", { room: ROOM(host), fid, seat, buy });
const move = (u, host, fid, m, to) => act(u, "pokerAct", { room: ROOM(host), fid, move: m, ...(to !== undefined ? { to } : {}) });
const tick = (u, host, fid) => act(u, "pokerTick", { room: ROOM(host), fid });
const leave = (u, host, fid) => act(u, "pokerLeave", { room: ROOM(host), fid });
const turnUser = (t, who) => who.find((u) => seatsOf(t).find((s) => s.i === t.turn)?.uid === u.uid);

console.log("--- setting up a room with two poker tables");
const host = await fresh("t_pk_host", { blood: 100 });
const a = await fresh("t_pk_a", { blood: 3000 });
const b = await fresh("t_pk_b", { blood: 3000 });
const c = await fresh("t_pk_c", { blood: 3000 });
const far = await fresh("t_pk_far", { blood: 3000 });
for (const u of [host, a, b, c, far]) { await act(u, "sync"); await owner("DELETE", `pokerSeat/${u.uid}`); }
await owner("PUT", `roomsMeta/${ROOM(host)}`, { owner: host.uid, ownerName: "x", name: "r", access: "open", w: 14, h: 14 });
await owner("PUT", `roomsMeta/${ROOM(host)}/furni/pt1`, { kind: "f_pokertable", x: 5, y: 5, dir: 2 });
await owner("PUT", `roomsMeta/${ROOM(host)}/furni/pt2`, { kind: "f_pokertablehi", x: 9, y: 9, dir: 2 });
await owner("PUT", `roomsMeta/${ROOM(host)}/furni/sofa1`, { kind: "f_sofa", x: 2, y: 2, dir: 2 });
for (const f of ["pt1", "pt2"]) { await owner("DELETE", `poker/${KEY(host, f)}`); await owner("DELETE", `pokerDeck/${KEY(host, f)}`); await owner("DELETE", `pokerHole/${KEY(host, f)}`); }
for (const u of [a, b, c]) await stand(u, ROOM(host), 6, 6);
await stand(far, ROOM(host), 13, 0);
const everyone = [a, b, c];
const heads = [a, b];
const chipsOn = async (fid) => { const t = await tbl(host, fid); return seatsOf(t).reduce((n, s) => n + s.stack, 0) + (t && t.phase === "play" ? seatsOf(t).reduce((n, s) => n + s.total, 0) : 0); };
// (the owner of the room is paid the table fee and the rake: count them too)
const worth = async () => { let n = 0; for (const u of [host, a, b, c, far]) n += await bloodOf(u); return n + (await chipsOn("pt1")) + (await chipsOn("pt2")); };
const START = await worth();
check("12100 blood in play", START === 12100, String(START));

console.log("--- sitting down");
bad("not at a table that is not there", await sit(a, host, "nope", 0, 300));
bad("not at a sofa", await sit(a, host, "sofa1", 0, 300));
bad("not from outside the room", await (async () => { await owner("DELETE", `rooms/${ROOM(host)}/players/${far.uid}`); const r = await sit(far, host, "pt1", 0, 300); await stand(far, ROOM(host), 13, 0); return r; })());
bad("walk up to the table first", await sit(far, host, "pt1", 0, 300));
bad("25 is the least here", await sit(a, host, "pt1", 0, 24));
bad("300 is the most here", await sit(a, host, "pt1", 0, 301));
bad("the high table wants 500", await sit(a, host, "pt2", 0, 499));
bad("there are five seats", await sit(a, host, "pt1", 5, 300));
ok("a sits and buys in for 300", await sit(a, host, "pt1", 0, 300));
check("a's blood is 2697 (300 buy-in + 3 table fee)", (await bloodOf(a)) === 2697);
check("the owner got the 3 fee", (await bloodOf(host)) === 103);
let t = await tbl(host, "pt1");
check("a is at the table with 300, no hand yet", t && t.phase === "idle" && seatsOf(t).length === 1 && seatsOf(t)[0].stack === 300 && seatsOf(t)[0].uid === a.uid, JSON.stringify(t));
check("a points at the table", (await owner("GET", `pokerSeat/${a.uid}`))?.fid === "pt1");
bad("seat taken", await sit(b, host, "pt1", 0, 300));
bad("a can't sit twice", await sit(a, host, "pt1", 1, 300));
bad("or at the other table", await sit(a, host, "pt2", 0, 1000));
await owner("PUT", `users/${b.uid}/blood`, 100);
bad("not without the blood", await sit(b, host, "pt1", 1, 300));
await owner("PUT", `users/${b.uid}/blood`, 3000);
ok("b sits (seat 3, 300)", await sit(b, host, "pt1", 3, 300));
t = await tbl(host, "pt1");
check("a countdown to the first hand", t.phase === "idle" && t.nextAt > Date.now(), JSON.stringify([t.phase, t.nextAt]));
check("nothing happens before then", (await tick(a, host, "pt1")).ok && (await tbl(host, "pt1")).phase === "idle");

console.log("--- the first hand");
await sleep(3700);
ok("a tick starts the hand", await tick(b, host, "pt1"));
t = await tbl(host, "pt1");
check("a hand is on: preflop, a turn, blinds in", t.phase === "play" && t.street === 0 && t.turn >= 0 && t.hand === 1 && t.pot === 15, JSON.stringify(t));
const first = turnUser(t, heads);
const second = heads.find((u) => u !== first);
check("the cards: each sees their own two", (await readAs(a, `pokerHole/${KEY(host, "pt1")}/${a.uid}`)).body?.length === 2 && (await readAs(b, `pokerHole/${KEY(host, "pt1")}/${b.uid}`)).body?.length === 2);
check("nobody sees another's cards", refused(await readAs(a, `pokerHole/${KEY(host, "pt1")}/${b.uid}`)) && refused(await readAs(b, `pokerHole/${KEY(host, "pt1")}/${a.uid}`)));
check("nor the whole node", refused(await readAs(a, `pokerHole/${KEY(host, "pt1")}`)));
check("nor the deck", refused(await readAs(a, `pokerDeck/${KEY(host, "pt1")}`)));
check("the table itself is public", (await readAs(c, `poker/${KEY(host, "pt1")}`)).body?.hand === 1);
check("and can't be written by a player", refused(await clientWrite(a, `poker/${KEY(host, "pt1")}/pot`, 99999)) && refused(await clientWrite(a, `pokerHole/${KEY(host, "pt1")}/${a.uid}`, [0, 1])));
check("nobody can read the pointer of another", refused(await readAs(b, `pokerSeat/${a.uid}`)));
bad("it isn't the other one's turn", await move(second, host, "pt1", "call"));
bad("a stranger isn't in it", await move(c, host, "pt1", "fold"));
bad("a bad move", await move(first, host, "pt1", "dance"));
bad("no check facing the blind", await move(first, host, "pt1", "check"));
bad("a raise that is too small", await move(first, host, "pt1", "raise", 11));
ok("calls", await move(first, host, "pt1", "call"));
ok("the big blind checks: flop", await move(second, host, "pt1", "check"));
t = await tbl(host, "pt1");
check("the flop is on the table", t.street === 1 && t.board.length === 3, JSON.stringify(t.board));
check("blood is conserved", (await worth()) === START, String(await worth()));
const flopFirst = turnUser(t, heads);
ok("bets 40", await move(flopFirst, host, "pt1", "raise", 40));
const flopSecond = heads.find((u) => u !== flopFirst);
ok("the other folds", await move(flopSecond, host, "pt1", "fold"));
t = await tbl(host, "pt1");
check("the hand is over, nobody has to show", t.phase === "over" && t.over.uncontested === true, JSON.stringify(t.over));
check("blood is conserved", (await worth()) === START, String(await worth()));
check("the two stacks together are 600", seatsOf(t).reduce((n, s) => n + s.stack, 0) === 600);

console.log("--- the next hand, and a third player drops in");
ok("c sits down during the pause", await sit(c, host, "pt1", 1, 250));
await sleep(3900);
ok("a tick deals the next hand", await tick(c, host, "pt1"));
t = await tbl(host, "pt1");
check("hand 2 with three players, c is dealt in", t.phase === "play" && t.hand === 2 && seatsOf(t).filter((s) => s.in).length === 3, JSON.stringify(t.phase) + t.hand);
check("c sees only c's cards", (await readAs(c, `pokerHole/${KEY(host, "pt1")}/${c.uid}`)).body?.length === 2 && refused(await readAs(c, `pokerHole/${KEY(host, "pt1")}/${a.uid}`)));
check("the pot is 15", t.pot === 15 && t.dealer >= 0);

console.log("--- running out of time");
const slow = turnUser(t, everyone);
await owner("PATCH", `poker/${KEY(host, "pt1")}`, { turnAt: Date.now() - 30_000 });
ok("a tick: the one who took too long folds", await tick(a, host, "pt1"));
t = await tbl(host, "pt1");
check("they folded and it's the next one's turn", seatsOf(t).find((s) => s.uid === slow.uid).folded === true && turnUser(t, everyone) !== slow, JSON.stringify(seatsOf(t).map((s) => [s.uid === slow.uid, s.folded, s.last])));
check("no tick can do it too early", (await tick(a, host, "pt1")).ok && (await tbl(host, "pt1")).seq === t.seq);

console.log("--- standing up in the middle of a hand");
const before = await bloodOf(c);
const cSeat = seatsOf(t).find((s) => s.uid === c.uid);
ok("c leaves", await leave(c, host, "pt1"));
check("c took what was in front of them", (await bloodOf(c)) === before + cSeat.stack, `${await bloodOf(c)} vs ${before + cSeat.stack}`);
check("the pointer is gone", (await owner("GET", `pokerSeat/${c.uid}`)) === null);
check("blood is conserved", (await worth()) === START, String(await worth()));
bad("c isn't in the game now", await move(c, host, "pt1", "fold"));
ok("leaving twice does nothing", await leave(c, host, "pt1"));

console.log("--- all in, a showdown, and going bust");
let bust = false;
for (let round = 0; round < 14 && !bust; round++) {
  t = await tbl(host, "pt1");
  if (t.phase === "over" || t.phase === "idle") { await owner("PATCH", `poker/${KEY(host, "pt1")}`, { nextAt: Date.now() - 1 }); await tick(a, host, "pt1"); await tick(a, host, "pt1"); t = await tbl(host, "pt1"); }
  if (seatsOf(t).length < 2) break;
  let guard = 0;
  while (t.phase === "play" && guard++ < 20) {
    if (t.turn < 0) { await owner("PATCH", `poker/${KEY(host, "pt1")}`, { nextAt: Date.now() - 1 }); await tick(a, host, "pt1"); }
    else { const u = turnUser(t, heads); if (!u) break; const r = await move(u, host, "pt1", "allin"); if (!r.ok) { check("an all in is always possible", false, JSON.stringify(r)); break; } }
    t = await tbl(host, "pt1");
  }
  t = await tbl(host, "pt1");
  check(`all in round ${round}: the hand is over and blood is conserved`, t.phase === "over" && (await worth()) === START, `${t.phase} ${await worth()}`);
  if (t.over && !t.over.uncontested) check("everybody who was in shows their cards", Object.keys(t.over.show).length >= 2 && t.over.pots.every((p) => p.name));
  bust = seatsOf(t).some((s) => s.bust);
}
check("somebody went bust", bust);
t = await tbl(host, "pt1");
const busted = seatsOf(t).find((s) => s.bust);
check("the bust seat is flagged with no blood", busted && busted.stack === 0);
await owner("PATCH", `poker/${KEY(host, "pt1")}`, { nextAt: Date.now() - 1 });
await tick(a, host, "pt1");
t = await tbl(host, "pt1");
const bustUser = heads.find((u) => u.uid === busted.uid);
check("the busted player is cleared from the table", !seatsOf(t).some((s) => s.uid === busted.uid));
check("and their pointer too", (await owner("GET", `pokerSeat/${bustUser.uid}`)) === null);
const free = [0, 1, 2, 3, 4].find((i) => !seatsOf(t).some((s) => s.i === i));
ok("they can buy in again", await sit(bustUser, host, "pt1", free, 200));

console.log("--- the high stakes table");
await leave(a, host, "pt1"); await leave(b, host, "pt1");
await tick(a, host, "pt1");
check("the normal table is empty and gone", (await tbl(host, "pt1")) === null && (await owner("GET", `pokerDeck/${KEY(host, "pt1")}`)) === null && (await owner("GET", `pokerHole/${KEY(host, "pt1")}`)) === null, JSON.stringify(await tbl(host, "pt1")));
check("blood is conserved", (await worth()) === START, String(await worth()));
ok("a sits for 2000", await sit(a, host, "pt2", 0, 2000));
bad("not for 2001", await sit(b, host, "pt2", 1, 2001));
ok("b sits for 1000", await sit(b, host, "pt2", 1, 1000));
await sleep(3700);
await tick(a, host, "pt2");
t = await tbl(host, "pt2");
check("blinds 20/40", t.phase === "play" && t.pot === 60, JSON.stringify([t.phase, t.pot]));
check("blood is conserved", (await worth()) === START, String(await worth()));

console.log("--- someone gone from the room");
await owner("DELETE", `rooms/${ROOM(host)}/players/${b.uid}`);
ok("a tick notices", await tick(a, host, "pt2"));
const bSeat = seatsOf(await tbl(host, "pt2")).find((s) => s.uid === b.uid);
check("b is marked as gone", bSeat?.gone > 0, JSON.stringify(bSeat));
await owner("PATCH", `poker/${KEY(host, "pt2")}/seats/s${bSeat.i}`, { gone: Date.now() - 30_000 });
const bBefore = await bloodOf(b);
ok("20 seconds later they are stood up with their blood", await tick(a, host, "pt2"));
check("b has blood back", (await bloodOf(b)) > bBefore, `${await bloodOf(b)} vs ${bBefore}`);
check("blood is conserved", (await worth()) === START, String(await worth()));
t = await tbl(host, "pt2");
check("a wins the hand", t.phase === "over" && t.over?.uncontested === true, JSON.stringify(t.phase));
check("b's pointer is gone", (await owner("GET", `pokerSeat/${b.uid}`)) === null);

console.log("--- the table is picked up");
await stand(b, ROOM(host), 7, 7);
await owner("PATCH", `poker/${KEY(host, "pt2")}`, { nextAt: Date.now() - 1 });
await tick(a, host, "pt2");
ok("b sits down again", await sit(b, host, "pt2", 2, 1500));
check("blood is conserved", (await worth()) === START, String(await worth()));
await owner("DELETE", `roomsMeta/${ROOM(host)}/furni/pt2`);
const aBlood = await bloodOf(a), bBlood = await bloodOf(b);
ok("a tick: the piece is gone, everybody gets their blood", await tick(c, host, "pt2"));
check("no table, no pointers", (await tbl(host, "pt2")) === null && (await owner("GET", `pokerSeat/${a.uid}`)) === null && (await owner("GET", `pokerSeat/${b.uid}`)) === null);
check("the blood is in the pockets", (await worth()) === START && (await bloodOf(a)) > aBlood && (await bloodOf(b)) > bBlood, String(await worth()));

console.log("--- recovering from a refresh");
await owner("PUT", `roomsMeta/${ROOM(host)}/furni/pt2`, { kind: "f_pokertablehi", x: 9, y: 9, dir: 2 });
await stand(a, ROOM(host), 8, 8);
ok("a sits", await sit(a, host, "pt2", 0, 1200));
const mid = await bloodOf(a);
ok("a logs in again somewhere else and is stood up (no table named)", await act(a, "pokerLeave"));
check("a has the 1200 back", (await bloodOf(a)) === mid + 1200 && (await owner("GET", `pokerSeat/${a.uid}`)) === null && (await tbl(host, "pt2")) === null);
check("blood is conserved", (await worth()) === START, String(await worth()));

console.log("--- the owner's cut: a 1% table fee on top of the buy-in, 1% of pots that saw a flop (at most 5 here)");
{
  await owner("PUT", `roomsMeta/${ROOM(host)}/furni/pt3`, { kind: "f_pokertable", x: 3, y: 9, dir: 2 });
  await owner("DELETE", `poker/${KEY(host, "pt3")}`); await owner("DELETE", `pokerDeck/${KEY(host, "pt3")}`); await owner("DELETE", `pokerHole/${KEY(host, "pt3")}`);
  for (const u of [a, b, c]) { await leave(u, host, "pt1"); await leave(u, host, "pt2"); await owner("DELETE", `pokerSeat/${u.uid}`); await stand(u, ROOM(host), 4, 9); await owner("PUT", `users/${u.uid}/blood`, 3000); }
  await stand(host, ROOM(host), 4, 10);
  const h0 = await bloodOf(host);
  ok("a buys in for 100: fee 1", await sit(a, host, "pt3", 0, 100));
  check("a paid 101 and has 100 on the table", (await bloodOf(a)) === 2899 && seatsOf(await tbl(host, "pt3"))[0].stack === 100);
  check("the owner got 1", (await bloodOf(host)) === h0 + 1);
  ok("b buys in for 25: the fee is at least 1", await sit(b, host, "pt3", 3, 25));
  check("the owner got 1 more (25 still pays at least 1)", (await bloodOf(host)) === h0 + 2, String((await bloodOf(host)) - h0));
  await owner("PUT", `users/${host.uid}/blood`, 500);
  ok("the owner buys in at their own table", await sit(host, host, "pt3", 1, 100));
  check("and pays no fee", (await bloodOf(host)) === 400);
  await leave(host, host, "pt3"); await leave(a, host, "pt3"); await leave(b, host, "pt3");
  await owner("DELETE", `poker/${KEY(host, "pt3")}`); await owner("DELETE", `pokerDeck/${KEY(host, "pt3")}`); await owner("DELETE", `pokerHole/${KEY(host, "pt3")}`);
  for (const u of [host, a, b, c]) await owner("DELETE", `pokerSeat/${u.uid}`);
  await owner("PUT", `users/${a.uid}/blood`, 3000); await owner("PUT", `users/${b.uid}/blood`, 3000); await owner("PUT", `users/${host.uid}/blood`, 100);
  const W0 = await worth();
  ok("a sits (300)", await sit(a, host, "pt3", 0, 300));
  ok("b sits (300)", await sit(b, host, "pt3", 3, 300));
  check("the two fees of 3 went to the owner", (await bloodOf(host)) === 106, String(await bloodOf(host)));
  await sleep(3700);
  ok("a tick starts the hand", await tick(b, host, "pt3"));
  let t3 = await tbl(host, "pt3");
  const folder = turnUser(t3, heads);
  ok("the first to act folds before the flop", await move(folder, host, "pt3", "fold"));
  t3 = await tbl(host, "pt3");
  check("no flop, no rake: the owner got nothing", t3.phase === "over" && (await bloodOf(host)) === 106, `${t3.phase} ${await bloodOf(host)}`);
  await owner("PATCH", `poker/${KEY(host, "pt3")}`, { nextAt: Date.now() - 1 });
  await tick(a, host, "pt3"); await tick(a, host, "pt3");
  t3 = await tbl(host, "pt3");
  const stacksBefore = seatsOf(t3).reduce((n, s) => n + s.stack + s.total, 0);
  for (let g = 0; g < 20 && t3.phase === "play"; g++) {
    if (t3.turn < 0) { await owner("PATCH", `poker/${KEY(host, "pt3")}`, { nextAt: Date.now() - 1 }); await tick(a, host, "pt3"); }
    else { const u = turnUser(t3, heads); if (!u) break; const r = await move(u, host, "pt3", "allin"); if (!r.ok) { check("an all in is possible", false, JSON.stringify(r)); break; } }
    t3 = await tbl(host, "pt3");
  }
  check("everybody all in: a showdown", t3.phase === "over" && !t3.over?.uncontested, JSON.stringify(t3.over)?.slice(0, 120));
  check("the owner got 1% of the 600 pot, capped at 5", (await bloodOf(host)) === 111, String(await bloodOf(host)));
  check("the players share the pot less the 5", seatsOf(t3).reduce((n, s) => n + s.stack, 0) === stacksBefore - 5, `${seatsOf(t3).reduce((n, s) => n + s.stack, 0)} vs ${stacksBefore}`);
  check("blood is conserved in all (the owner included)", (await worth()) + (await chipsOn("pt3")) === W0, `${(await worth()) + (await chipsOn("pt3"))} vs ${W0}`);
  await leave(a, host, "pt3"); await leave(b, host, "pt3");
  await owner("DELETE", `roomsMeta/${ROOM(host)}/furni/pt3`);
}

console.log("--- in a hideout the owner's earnings wait on the computer until they are collected");
{
  const H = `h_${host.uid}`, HK = `${H}_pt9`;
  await owner("PUT", `roomsMeta/${H}`, { owner: host.uid, ownerName: "host", name: "hq", access: "open", w: 14, h: 14 });
  await owner("PUT", `roomsMeta/${H}/furni/pt9`, { kind: "f_pokertable", x: 5, y: 5, dir: 2 });
  for (const p of ["poker", "pokerDeck", "pokerHole"]) await owner("DELETE", `${p}/${HK}`);
  for (const u of [host, a, b, c]) { await owner("DELETE", `pokerSeat/${u.uid}`); await owner("DELETE", `rooms/${ROOM(host)}/players/${u.uid}`); await stand(u, H, 6, 6); await owner("PUT", `users/${u.uid}/blood`, 3000); }
  await owner("DELETE", `hideoutTill/${host.uid}`);
  const hsit = (u, seat, buy) => act(u, "pokerSit", { room: H, fid: "pt9", seat, buy });
  const hmove = (u, m) => act(u, "pokerAct", { room: H, fid: "pt9", move: m });
  const htick = (u) => act(u, "pokerTick", { room: H, fid: "pt9" });
  ok("a buys in for 300 in a hideout", await hsit(a, 0, 300));
  ok("b buys in for 300", await hsit(b, 3, 300));
  check("the owner's pocket is untouched (the fees wait)", (await bloodOf(host)) === 3000, String(await bloodOf(host)));
  let till = await owner("GET", `hideoutTill/${host.uid}`);
  check("6 in the till (two fees of 3)", till?.blood === 6 && till?.total === 6, JSON.stringify(till));
  check("only the owner reads the till", (await readAs(host, `hideoutTill/${host.uid}`)).status === 200 && refused(await clientWrite(host, `hideoutTill/${host.uid}/blood`, 99999)) && (await readAs(a, `hideoutTill/${host.uid}`)).status !== 200);
  await sleep(3700);
  ok("a tick starts the hand", await htick(b));
  let th = await owner("GET", `poker/${HK}`);
  for (let g = 0; g < 20 && th.phase === "play"; g++) {
    if (th.turn < 0) { await owner("PATCH", `poker/${HK}`, { nextAt: Date.now() - 1 }); await htick(a); }
    else { const u = seatsOf(th).find((q) => q.i === th.turn)?.uid === a.uid ? a : b; const r = await hmove(u, "allin"); if (!r.ok) { check("an all in is possible", false, JSON.stringify(r)); break; } }
    th = await owner("GET", `poker/${HK}`);
  }
  till = await owner("GET", `hideoutTill/${host.uid}`);
  check("the pot cut (5) joined the fees: 11 waiting", th.phase === "over" && till?.blood === 11 && till?.total === 11, `${th.phase} ${JSON.stringify(till)}`);
  check("still nothing in the owner's pocket", (await bloodOf(host)) === 3000);
  bad("a player can't collect it", await act(a, "hideoutTillCollect"));
  ok("the owner collects", await act(host, "hideoutTillCollect"));
  check("3011 in the pocket and the till is empty, the lifetime total stays", (await bloodOf(host)) === 3011 && (await owner("GET", `hideoutTill/${host.uid}/blood`)) === 0 && (await owner("GET", `hideoutTill/${host.uid}/total`)) === 11);
  bad("nothing left to collect", await act(host, "hideoutTillCollect"));
  await act(a, "pokerLeave", { room: H, fid: "pt9" }); await act(b, "pokerLeave", { room: H, fid: "pt9" });
  await owner("DELETE", `roomsMeta/${H}`); await owner("DELETE", `hideoutTill/${host.uid}`);
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
