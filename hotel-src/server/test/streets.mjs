// The streets: the elevator ticket (50 a day, one per player), the ride and its pass, the rules for who may stand in the arrival room and on the street, the bins,
// the customers' orders, and the knife fights (protection, swing time, damage, death, the bandage, no leaving in a fight)
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/streets.mjs (server/)
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "st-"));
const load = async (rel, name) => { const out = join(dir, name); buildSync({ entryPoints: [resolve(here, rel)], bundle: true, format: "esm", outfile: out, logLevel: "error" }); return import(pathToFileURL(out).href); };
const S = await load("../../src/shared/streets.ts", "streets.mjs");
const I = await load("../../src/shared/items.ts", "items.mjs");

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
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12 && !process.env.NO_RETRY) { await new Promise((x) => setTimeout(x, 800)); continue; }
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 220));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 220));
const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  for (const r of ["lobby", "shop", "arrival", "streets"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
  await owner("DELETE", `streetPass/${u.uid}`); await owner("DELETE", `streetCombat/${u.uid}`); await owner("DELETE", `streetSwing/${u.uid}`);
  return u;
};
const stand = (u, room, x = 5, y = 5) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const state = async (u) => (await act(u, "sync")).state;
const have = (st, item) => st.inventory.reduce((n, s) => n + (s && s.item === item ? s.qty : 0), 0);
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;

const day = S.danishDayKey(Date.now());
await owner("DELETE", `streetTickets/${day}`);
await owner("DELETE", "config/streetsForce");
for (const p of ["streetFilled", "streetLastHit", "rooms/streets/hits"]) await owner("DELETE", p);

const admin = await fresh("t_st_admin", { blood: 1000 });
await owner("PUT", `roles/${admin.uid}`, "admin");
const a = await fresh("t_st_a", { blood: 1000, inventory: inv({ item: "knife", qty: 1 }, { item: "bandage", qty: 2 }, { item: "weed", qty: 20 }) });
const b = await fresh("t_st_b", { blood: 1000, inventory: inv({ item: "knife", qty: 1 }) });
const c = await fresh("t_st_c", { blood: 1000 });
const poor = await fresh("t_st_poor", { blood: 10 });
for (const u of [admin, a, b, c, poor]) await act(u, "sync");

console.log("--- the clock");
const t0 = Date.now();
check("20:00 Danish time is open for an hour", S.elevatorRuns(Date.UTC(2026, 0, 15, 19, 30)).open && !S.elevatorRuns(Date.UTC(2026, 0, 15, 21, 30)).open && S.elevatorRuns(Date.UTC(2026, 0, 15, 19, 30)).endsAt > Date.UTC(2026, 0, 15, 19, 30));
check("and in summer time too (UTC+2)", S.elevatorRuns(Date.UTC(2026, 6, 15, 18, 30)).open && !S.elevatorRuns(Date.UTC(2026, 6, 15, 19, 30)).open);
check("the admin's switch overrides the clock", S.elevatorRuns(Date.UTC(2026, 0, 15, 5, 0), Date.UTC(2026, 0, 15, 5, 30)).open);

console.log("--- the ticket");
bad("not outside the basement", await act(a, "ticketBuy"));
for (const u of [admin, a, b, c, poor]) await stand(u, "lobby", 3, 3);
bad("blood is needed", await act(poor, "ticketBuy"));
const tb = await act(a, "ticketBuy");
ok("buy the ticket for 50", tb);
check("50 blood, one ticket", (await bloodOf(a)) === 950 && have(await state(a), "elevator_ticket") === 1 && tb.data.left === 49, JSON.stringify(tb.data));
bad("one per player", await act(a, "ticketBuy"));
check("the stock counts", (await owner("GET", `streetTickets/${day}/sold`)) === 1);
await owner("PUT", `streetTickets/${day}/sold`, 50);
bad("sold out for today", await act(c, "ticketBuy"));
await owner("PUT", `streetTickets/${day}/sold`, 1);

console.log("--- one ticket at a time");
await owner("PUT", "rooms/lobby/drops/3_3", { item: "elevator_ticket", qty: 1, x: 3, y: 3, by: "someone", at: Date.now() });
bad("a player who has one can't pick up another", await act(a, "pickup", { room: "lobby", key: "3_3" }));
ok("one who has none can", await act(b, "pickup", { room: "lobby", key: "3_3" }));
check("they hold it now", have(await state(b), "elevator_ticket") === 1);
const g = await act(c, "giftSend", { to: a.uid, slot: 0, qty: 1 });
await owner("DELETE", "rooms/lobby/drops/3_3");

console.log("--- the ride");
await owner("DELETE", "config/streetsForce");
bad("only the admin has the test switch", await act(a, "streetsTest", { minutes: 30 }));
if (!S.elevatorRuns(t0).open) bad("the elevator does not run now", await act(a, "elevatorUp"));
ok("the admin turns the elevator on for 30 minutes", await act(admin, "streetsTest", { minutes: 30 }));
bad("no ticket, no ride", await act(c, "elevatorUp"));
bad("not from another room", await (async () => { await owner("DELETE", "rooms/lobby/players/" + a.uid); await stand(a, "shop"); const r = await act(a, "elevatorUp"); await owner("DELETE", "rooms/shop/players/" + a.uid); await stand(a, "lobby", 3, 3); return r; })());
check("without a pass nobody can stand in the arrival room", refused(await clientWrite(a, `rooms/arrival/players/${a.uid}`, { name: a.name, figure: "x", x: 3, y: 3, dir: 2 })));
const up = await act(a, "elevatorUp");
ok("a ticket rides the elevator", up);
check("the ticket is used up and the pass is set", have(await state(a), "elevator_ticket") === 0 && (await owner("GET", `streetPass/${a.uid}`)) > Date.now() && up.data.used === true, JSON.stringify(up.data));
const up2 = await act(a, "elevatorUp");
ok("the same hour again costs no ticket", up2);
check("(nothing used)", up2.data.used === false);
const w1 = await clientWrite(a, `rooms/arrival/players/${a.uid}`, { name: a.name, figure: "x", x: 3, y: 3, dir: 2 }), w2 = await clientWrite(a, `rooms/streets/players/${a.uid}`, { name: a.name, figure: "x", x: 3, y: 4, dir: 2 });
check("now they can stand in the arrival room and on the street", !refused(w1) && !refused(w2), `${w1.status} ${w2.status} ${await w2.text()}`);
check("somebody without a pass still can't", refused(await clientWrite(c, `rooms/streets/players/${c.uid}`, { name: c.name, figure: "x", x: 3, y: 4, dir: 2 })));
const upAdmin = await act(admin, "elevatorUp");
ok("the admin rides without a ticket", upAdmin);
check("(and keeps blood and items)", upAdmin.data.used === false);

console.log("--- the bins");
await stand(a, "streets", 3, 4);
await owner("DELETE", `users/${a.uid}/dumpsters`);
bad("not a bin that isn't there", await act(a, "streetBin", { can: "nothere" }));
const bin = await act(a, "streetBin", { can: "s_bin1" });
ok("search a blue bin", bin);
check("two or three things come out", bin.data.items.length >= 2 && bin.data.items.length <= 3, JSON.stringify(bin.data));
bad("and not again at once", await act(a, "streetBin", { can: "s_bin1" }));
ok("another bin is fine", await act(a, "streetBin", { can: "s_bin2" }));

await owner("PUT", `users/${a.uid}/leanUntil`, Date.now() + 600_000);
const can1 = await act(a, "streetBin", { can: "s_can1" });
ok("search a plain can", can1);
check("the plain can gives exactly 1 thing, whatever the lean does to the others", can1.data.items.length === 1, JSON.stringify(can1.data));
let bandages = 0;
for (let i = 0; i < 60; i++) {
  await owner("DELETE", `users/${a.uid}/dumpsters`);
  await owner("PUT", `users/${a.uid}/inventory`, [{ item: "knife", qty: 1 }]);
  const r = await act(a, "streetBin", { can: "s_can2" });
  if (r.ok && r.data.items.includes("bandage")) bandages++;
}
check("about 1 in 10 plain cans gives a bandage", bandages >= 1 && bandages <= 17, String(bandages));
await owner("DELETE", `users/${a.uid}/leanUntil`);
await owner("DELETE", `users/${a.uid}/dumpsters`);

console.log("--- the customers");
const now = Date.now();
const walker = S.customersAt(now).find((x) => x.kind === "walker");
check("there are customers on the street", S.customersAt(now).length >= 6, String(S.customersAt(now).length));
const car = [...Array(40)].map((_, i) => S.customerAt(Math.floor(now / S.CUSTOMER_EVERY_MS) - i)).find((x) => x.kind === "car");
check("cars ask for much more (7-10) at 3 times the price, or a little of something rare", car && car.want.mult === 3 && (car.want.qty >= 7 || S.RARE_WANTS.includes(car.want.item)), JSON.stringify(car?.want));
check("a customer is the same for everybody (a function of its number)", JSON.stringify(S.customerAt(12345)) === JSON.stringify(S.customerAt(12345)));
const common = [...Array(300)].map((_, i) => S.customerAt(i)).filter((x) => x.kind === "walker");
check("half of the walkers ask for 1 or 2 of something common", common.filter((x) => x.want.qty <= 2 && S.COMMON_WANTS.includes(x.want.item)).length / common.length > 0.4);
// give the fill test what the walker wants
await owner("PUT", `users/${a.uid}/inventory/5`, { item: walker.want.item, qty: walker.want.qty + 1 });
const before = await bloodOf(a);
const want = S.orderPay(I.sellPrice(walker.want.item, false, {}) ?? 5, walker.want);
bad("not a customer that has gone", await act(a, "streetFill", { k: walker.k - 100 }));
bad("someone who doesn't have it can't fill it", await (async () => { await owner("PUT", `users/${c.uid}/inventory`, null); await stand(c, "streets", 4, 4); return act(c, "streetFill", { k: walker.k }); })());
ok("fill the order", await act(a, "streetFill", { k: walker.k }));
check("paid the price", (await bloodOf(a)) === before + want, `${await bloodOf(a)} vs ${before} + ${want}`);
check("they gave exactly what was asked", have(await state(a), walker.want.item) >= 1);
bad("a customer can only be filled once", await act(a, "streetFill", { k: walker.k }));
check("it is marked as filled for everybody to see", !!(await owner("GET", `streetFilled/${walker.k}`)));

console.log("--- the knife fights");
await stand(a, "streets", 5, 5); await stand(b, "streets", 6, 5); await stand(c, "streets", 12, 9);
await owner("PUT", `streetPass/${b.uid}`, Date.now() + 3_600_000); await owner("PUT", `streetPass/${c.uid}`, Date.now() + 3_600_000);
ok("walking in sets the hit points", await act(b, "streetEnter"));
const cbB = await owner("GET", `streetCombat/${b.uid}`);
check("10 hit points and a moment of protection", cbB.hp === 10 && cbB.protectUntil > Date.now(), JSON.stringify(cbB));
bad("nobody can hit somebody who just arrived", await act(a, "streetHit", { target: b.uid }));
await owner("PATCH", `streetCombat/${b.uid}`, { protectUntil: 0 });
bad("you can't hit yourself", await act(a, "streetHit", { target: a.uid }));
bad("not somebody far away", await act(a, "streetHit", { target: c.uid }));
bad("not with an empty hand", await act(c, "streetHit", { target: b.uid }));
let hit = await act(a, "streetHit", { target: b.uid });
ok("a swing of the knife", hit);
check("it did 0 to 3 damage", hit.data.dmg >= 0 && hit.data.dmg <= 3, JSON.stringify(hit.data));
check("both are in a fight and the one who started it is skulled", (await owner("GET", `streetCombat/${b.uid}/combatUntil`)) > Date.now() && (await owner("GET", `streetCombat/${a.uid}/skullUntil`)) > Date.now());
check("everybody can see it (a number over the head)", (await owner("GET", `rooms/streets/hits/${a.uid}`))?.to === b.uid);
bad("you can't swing again at once", await act(a, "streetHit", { target: b.uid }));
bad("nobody leaves a fight", await act(b, "elevatorDown"));
await owner("PATCH", `streetCombat/${b.uid}`, { combatUntil: 0 }); await owner("PATCH", `streetCombat/${a.uid}`, { combatUntil: 0 });
ok("out of a fight you can leave", await act(b, "elevatorDown"));
console.log("--- bandage and death");
await owner("PUT", `streetCombat/${b.uid}`, { hp: 4, at: Date.now(), combatUntil: 0, skullUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
await owner("PUT", `users/${b.uid}/inventory/3`, { item: "bandage", qty: 2 });
const heal = await act(b, "streetHeal", { slot: 3 });
ok("a bandage heals 3", heal);
check("4 -> 7", heal.data.hp === 7 && heal.data.healed === 3, JSON.stringify(heal.data));
bad("and not again at once", await act(b, "streetHeal", { slot: 3 }));
await owner("PATCH", `streetCombat/${b.uid}`, { healAt: 0, hp: 10, at: Date.now() });
bad("not when you are not hurt", await act(b, "streetHeal", { slot: 3 }));
// kill b: they have 1 hp, a hits until a swing lands
await owner("PUT", `streetCombat/${b.uid}`, { hp: 1, at: Date.now(), combatUntil: 0, skullUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
let died = false;
for (let i = 0; i < 25 && !died; i++) {
  await owner("DELETE", `streetSwing/${a.uid}`);
  const r = await act(a, "streetHit", { target: b.uid });
  if (r.ok && r.data.died) died = true;
}
check("a hit that lands kills somebody on 1 hit point", died);
const dead = await owner("GET", `streetCombat/${b.uid}`);
check("the dead one is back on full hit points, marked dead, and untouchable for a while", dead.hp === 10 && dead.deaths === 1 && dead.deadBy === a.uid && dead.protectUntil > Date.now(), JSON.stringify(dead));
check("the killer is credited", (await owner("GET", `streetCombat/${a.uid}/kills`)) === 1);
check("everything in the pocket is lost on death", !(await state(b)).inventory.some((x) => x), JSON.stringify((await state(b)).inventory));

console.log("--- closing the game in a fight");
const rowOf = (u) => ({ name: u.name, figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", x: 4, y: 4, dir: 2, ts: Date.now() - 60_000, off: Date.now() });
await owner("DELETE", `presence/${b.uid}`);
await owner("PUT", `rooms/streets/players/${b.uid}`, rowOf(b));
await owner("PUT", `streetCombat/${b.uid}`, { hp: 10, at: Date.now(), combatUntil: Date.now() + 8000, skullUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
await act(a, "roomSweep", { room: "streets" });
check("somebody who closed the game in a fight stays on the street", !!(await owner("GET", `rooms/streets/players/${b.uid}`)));
await owner("PATCH", `streetCombat/${b.uid}`, { combatUntil: Date.now() - 1000 });
await act(a, "roomSweep", { room: "streets" });
check("and goes once the fight has been quiet", !(await owner("GET", `rooms/streets/players/${b.uid}`)));

for (const u of [admin, a, b, c, poor]) for (const r of ["lobby", "shop", "arrival", "streets"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
await owner("PUT", "config/streetsForce", Date.now() + 30 * 86_400_000); // (the elevator keeps running in the local test)
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
