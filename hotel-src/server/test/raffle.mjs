// Raffle tests: buying tickets, the 20:00 draw (weighted by tickets), nobody bought, a full pocket, nobody can write the raffle
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: npm test (server/)
import { createHmac } from "node:crypto";
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
const state = async (u) => (await act(u, "sync")).state;
const total = (inv, item) => inv.reduce((n, s) => n + (s && s.item === item ? s.qty : 0), 0);

const inShop = async (u) => { await act(u, "sync"); await stand(u, "shop", 3, 3); };
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const clientRead = (u, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`);
const refused = (r) => r.status === 401 || r.status === 403;
const reset = async () => { await owner("DELETE", "raffle"); };
const dueNow = () => owner("PUT", "raffle/round/drawAt", Date.now() - 1000);
const FILLER = Object.fromEntries(Array.from({ length: 28 }, (_, i) => [i, { item: "wateringcan", qty: 1 }]));

console.log("--- the round, the tickets and the blood");
await reset();
const a = await fresh("t_raf_a", { blood: 3000 }), b = await fresh("t_raf_b", { blood: 3000 }), c = await fresh("t_raf_c", { blood: 100 });
bad("not from across the map", await act(a, "raffleBuy", { n: 1 })); // (not standing in the shop)
await inShop(a); await inShop(b); await inShop(c);
ok("buy 1 ticket", await act(a, "raffleBuy", { n: 1 }));
let round = await owner("GET", "raffle/round");
check("a round was opened: tomorrow or today at 20:00 Danish time, a prize from the pool", round && round.drawAt > Date.now() && round.drawAt - Date.now() <= 24 * 3_600_000 + 1000 && /^f_/.test(round.prize) && round.sold === 1, JSON.stringify(round));
const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(round.drawAt)).slice(0, 2));
const minute = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(round.drawAt)).slice(3, 5));
check("the draw is at exactly 20:00 Danish time", hour === 20 && minute === 0, `${hour}:${minute}`);
check("100 blood paid (2900 left)", (await state(a)).blood === 2900);
check("the ticket is on record", (await owner("GET", `raffle/tickets/${a.uid}`)) === 1);
bad("0 tickets", await act(a, "raffleBuy", { n: 0 }));
bad("51 tickets", await act(a, "raffleBuy", { n: 51 }));
bad("1.5 tickets", await act(a, "raffleBuy", { n: 1.5 }));
bad("not enough blood", await act(c, "raffleBuy", { n: 2 }));
check("(nothing was taken)", (await state(c)).blood === 100 && (await owner("GET", `raffle/tickets/${c.uid}`)) === null);
ok("25 more", await act(b, "raffleBuy", { n: 25 }));
check("b has 25, 3000 - 2500", (await owner("GET", `raffle/tickets/${b.uid}`)) === 25 && (await state(b)).blood === 500);
bad("more than are left", await act(b, "raffleBuy", { n: 25 })); // 26 sold, 24 left
ok("the last 24", await act(a, "raffleBuy", { n: 24 }));
const sold = Object.values((await owner("GET", "raffle/tickets"))).reduce((x, y) => x + y, 0);
check("50 sold", sold === 50, String(sold));
bad("sold out", await act(c, "raffleBuy", { n: 1 }));
check("the blood is gone for good: a paid 2500 in all, b paid 2500", (await state(a)).blood === 500 && (await state(b)).blood === 500);

console.log("--- nobody can write the raffle");
check("no client writes to the round", refused(await clientWrite(a, "raffle/round", { drawAt: 1, prize: "f_sofa", sold: 0 })));
check("or the tickets", refused(await clientWrite(a, `raffle/tickets/${a.uid}`, 50)));
check("or the last result", refused(await clientWrite(a, "raffle/last", { winner: a.uid })));
check("or a prize", refused(await clientWrite(a, `raffle/prizes/${a.uid}/1`, "f_sofa")));
check("but anybody can read the round", (await clientRead(a, "raffle/round")).status === 200);
check("and the tickets", (await clientRead(a, "raffle/tickets")).status === 200);
check("only you read your own prizes", (await clientRead(a, `raffle/prizes/${a.uid}`)).status === 200 && refused(await clientRead(a, `raffle/prizes/${b.uid}`)));

console.log("--- the draw");
await reset();
{
  const w1 = await fresh("t_raf_w1", { blood: 500 });
  await inShop(w1);
  ok("one ticket", await act(w1, "raffleBuy", { n: 1 }));
  const prize = (await owner("GET", "raffle/round")).prize;
  ok("not yet time: the tick does nothing", await act(w1, "raffleTick"));
  check("(still the same round)", (await owner("GET", "raffle/last")) === null);
  await dueNow();
  ok("the tick after 20:00 draws", await act(w1, "raffleTick"));
  const last = await owner("GET", "raffle/last");
  check("the only ticket wins for sure", last && last.winner === w1.uid && last.winnerName === "t_raf_w1" && last.prize === prize && last.sold === 1 && last.delivered === true, JSON.stringify(last));
  check("the piece is in the pocket", total((await state(w1)).inventory, prize) === 1);
  const nr = await owner("GET", "raffle/round");
  check("a new round: tomorrow, another prize, no tickets", nr.sold === 0 && nr.drawAt > Date.now() && nr.prize !== prize && (await owner("GET", "raffle/tickets")) === null, JSON.stringify(nr));
  ok("a second tick right away changes nothing", await act(w1, "raffleTick"));
  check("(no second winner)", (await owner("GET", "raffle/last")).drawAt === last.drawAt);
}

console.log("--- nobody bought anything");
await reset();
{
  const w = await fresh("t_raf_none", { blood: 0 });
  await inShop(w);
  await act(w, "raffleTick");
  const prize = (await owner("GET", "raffle/round")).prize;
  await dueNow();
  ok("the draw runs", await act(w, "raffleTick"));
  const last = await owner("GET", "raffle/last");
  check("no winner", last && last.none === true && !last.winner, JSON.stringify(last));
  const nr = await owner("GET", "raffle/round");
  check("the same prize stays for the next day", nr.prize === prize && nr.drawAt > Date.now(), JSON.stringify(nr));
}

console.log("--- a full pocket: it waits at the machine");
await reset();
{
  const w = await fresh("t_raf_full", { blood: 500, inventory: FILLER });
  await inShop(w);
  await act(w, "raffleBuy", { n: 1 });
  const prize = (await owner("GET", "raffle/round")).prize;
  await dueNow();
  await act(w, "raffleTick");
  const last = await owner("GET", "raffle/last");
  check("he won, but it did not fit", last && last.winner === w.uid && last.delivered === false, JSON.stringify(last));
  const waiting = await owner("GET", `raffle/prizes/${w.uid}`);
  check("the prize is waiting", waiting && Object.values(waiting)[0] === prize, JSON.stringify(waiting));
  bad("still full: nothing is collected", await act(w, "raffleCollect"));
  check("(it is still waiting)", !!(await owner("GET", `raffle/prizes/${w.uid}`)));
  await owner("PUT", `users/${w.uid}/inventory`, {});
  const got = await act(w, "raffleCollect");
  ok("with room it is handed over", got);
  check("in the pocket, and no longer waiting", total((await state(w)).inventory, prize) === 1 && (await owner("GET", `raffle/prizes/${w.uid}`)) === null);
  bad("nothing more to collect", await act(w, "raffleCollect"));
  const away = await fresh("t_raf_away", { blood: 0 });
  await act(away, "sync");
  bad("collecting needs the shop", await act(away, "raffleCollect"));
}

console.log("--- the odds: 5 tickets against 25 (5/30 and 25/30)");
{
  let few = 0, many = 0;
  const ROUNDS = 60;
  const f = await fresh("t_raf_few", { blood: 500 }), m = await fresh("t_raf_many", { blood: 2500 });
  await inShop(f); await inShop(m);
  for (let i = 0; i < ROUNDS; i++) {
    await owner("PUT", `users/${f.uid}/blood`, 500); await owner("PUT", `users/${m.uid}/blood`, 2500);
    await owner("PUT", `users/${f.uid}/inventory`, {}); await owner("PUT", `users/${m.uid}/inventory`, {});
    await reset();
    await act(f, "raffleBuy", { n: 5 });
    await act(m, "raffleBuy", { n: 25 });
    await dueNow();
    await act(f, "raffleTick");
    const last = await owner("GET", "raffle/last");
    if (last.winner === f.uid) few++; else if (last.winner === m.uid) many++;
    if (i === 0) check("the draw knew it was 30 tickets", last.sold === 30, JSON.stringify(last));
  }
  check(`everything was won by one of the two (${few} + ${many} of ${ROUNDS})`, few + many === ROUNDS);
  // the expected number for the 5 ticket player is 10 of 60 (sd about 2.9): 1 to 22 leaves no doubt that it is not 50-50 or 0
  check(`the 5 ticket player won about 5/30 (${few} of ${ROUNDS})`, few >= 1 && few <= 22, String(few));
  check(`the 25 ticket player won about 25/30 (${many} of ${ROUNDS})`, many >= 38 && many <= 59, String(many));
}
await reset();

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
