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
const D = await load("../../src/shared/darkweb.ts", "darkweb.mjs");

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
const curWin = async () => S.elevatorRuns(Date.now(), Number(await owner("GET", "config/streetsForce")) || 0).windowKey; // (the run the tickets are counted for: the one that is on, or the next)
await owner("DELETE", `streetTickets/${await curWin()}`);
await owner("DELETE", "config/streetsForce");
for (const p of ["streetFilled", "streetLastHit", "rooms/streets/hits", "streets/furni"]) await owner("DELETE", p);

const admin = await fresh("t_st_admin", { blood: 1000 });
await owner("PUT", `roles/${admin.uid}`, "admin");
const a = await fresh("t_st_a", { blood: 1000, inventory: inv({ item: "knife", qty: 1 }, { item: "bandage", qty: 2 }, { item: "weed", qty: 20 }) });
const b = await fresh("t_st_b", { blood: 1000, inventory: inv({ item: "knife", qty: 1 }) });
const c = await fresh("t_st_c", { blood: 1000 });
const poor = await fresh("t_st_poor", { blood: 10 });
for (const u of [admin, a, b, c, poor]) await act(u, "sync");

console.log("--- /test1 for the staff");
bad("a player can't use /test1", await act(a, "streetsStaffTest", {}));
bad("and can't pull another player in", await act(a, "streetsStaffTest", { name: b.name }));
await owner("DELETE", `streetPass/${admin.uid}`); await owner("DELETE", `teleports/${b.uid}`);
const t1 = await act(admin, "streetsStaffTest", {});
check("the admin gets a pass for 2 hours (and walks there himself)", t1.ok && t1.data.self === true && (await owner("GET", `streetPass/${admin.uid}`)) > Date.now() + 119 * 60_000, JSON.stringify(t1));
await owner("PUT", `usernames/${b.name.toLowerCase()}`, b.uid);
const t2 = await act(admin, "streetsStaffTest", { name: b.name });
check("/test1 <name> gives that player a pass and a teleport to the arrival room", t2.ok && t2.data.self === false && (await owner("GET", `streetPass/${b.uid}`)) > Date.now() && (await owner("GET", `teleports/${b.uid}/room`)) === "arrival", JSON.stringify(t2));
bad("an unknown name", await act(admin, "streetsStaffTest", { name: "nobody_here_x" }));
const rd = await fetch(`${DB}/teleports/${b.uid}.json?ns=${NS}&auth=${a.token}`);
check("others can't read a player's teleport", rd.status === 401 || rd.status === 403, String(rd.status));
await owner("DELETE", `streetPass/${admin.uid}`); await owner("DELETE", `streetPass/${b.uid}`); await owner("DELETE", `teleports/${b.uid}`);

console.log("--- the clock");
const t0 = Date.now();
check("20:00 Danish time is open for an hour", S.elevatorRuns(Date.UTC(2026, 0, 15, 19, 30)).open && !S.elevatorRuns(Date.UTC(2026, 0, 15, 21, 30)).open && S.elevatorRuns(Date.UTC(2026, 0, 15, 19, 30)).endsAt > Date.UTC(2026, 0, 15, 19, 30));
check("and in summer time too (UTC+2)", S.elevatorRuns(Date.UTC(2026, 6, 15, 18, 30)).open && !S.elevatorRuns(Date.UTC(2026, 6, 15, 19, 30)).open);
// today (28 October 2026, Danish winter time UTC+1) the elevator runs 17-18 as well as 20-21; every other day only 20-21
check("28 October: open 17:30 Danish time (16:30 UTC)", S.elevatorRuns(Date.UTC(2026, 9, 28, 16, 30)).open);
check("28 October: closed 18:30, open again 20:30", !S.elevatorRuns(Date.UTC(2026, 9, 28, 17, 30)).open && S.elevatorRuns(Date.UTC(2026, 9, 28, 19, 30)).open);
check("29 October: only 20-21 (17:30 is closed)", !S.elevatorRuns(Date.UTC(2026, 9, 29, 16, 30)).open && S.elevatorRuns(Date.UTC(2026, 9, 29, 19, 30)).open);
check("each run has its own ticket stock (its window key)", S.elevatorRuns(Date.UTC(2026, 9, 28, 16, 30)).windowKey === "2026102817" && S.elevatorRuns(Date.UTC(2026, 9, 28, 17, 30)).windowKey === "2026102820" && S.elevatorRuns(Date.UTC(2026, 9, 28, 21, 30)).windowKey === "2026102920", [16, 17, 21].map((h) => S.elevatorRuns(Date.UTC(2026, 9, 28, h, 30)).windowKey).join());
check("the next run is announced (at 15:00 on the 28th it starts in 2 hours)", Math.round((S.elevatorRuns(Date.UTC(2026, 9, 28, 14, 0)).nextAt - Date.UTC(2026, 9, 28, 14, 0)) / 3600000) === 2);
check("the admin's switch overrides the clock", S.elevatorRuns(Date.UTC(2026, 0, 15, 5, 0), Date.UTC(2026, 0, 15, 5, 30)).open);

console.log("--- the ticket");
bad("not outside the basement", await act(a, "ticketBuy"));
for (const u of [admin, a, b, c, poor]) await stand(u, "lobby", 3, 3);
bad("blood is needed", await act(poor, "ticketBuy"));
await owner("DELETE", `streetTickets/${await curWin()}`);
const tb = await act(a, "ticketBuy");
ok("buy the ticket for 50", tb);
check("50 blood, one ticket", (await bloodOf(a)) === 950 && have(await state(a), "elevator_ticket") === 1 && tb.data.left === 49, JSON.stringify(tb.data));
bad("one per player", await act(a, "ticketBuy"));
check("the stock counts (for this run)", (await owner("GET", `streetTickets/${await curWin()}/sold`)) === 1);
await owner("PUT", `streetTickets/${await curWin()}/sold`, 50);
bad("sold out for this run", await act(c, "ticketBuy"));
await owner("PUT", `streetTickets/${await curWin()}/sold`, 1);

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
// who turns up: 0.6 a minute for each player on the street, 15 at most, and a customer nobody serves leaves after 7 minutes
check("customers stay 7 minutes, 15 at most, 0.6 a minute for each player (about 4 at a time for one player)", S.CUSTOMER_STAY_MS === 7 * 60_000 && S.CUSTOMER_CAP === 15 && S.CUSTOMERS_PER_PLAYER_PER_MIN === 0.6);
for (const u of [admin, a, b, c, poor]) await owner("DELETE", `rooms/streets/players/${u.uid}`);
await stand(a, "streets", 5, 5); await stand(b, "streets", 9, 5);
await owner("DELETE", "streetCust"); await owner("DELETE", "streetFilled");
await owner("PUT", "streetCustState", { at: Date.now() - 60_000, carry: 0, k: 100_000 });
const t1r = await act(a, "streetTick");
ok("a tick with two players on the street", t1r);
check("a minute of players on the street brings 0.6 customers for each of them (the sparring bots count when they are running)", t1r.data.present >= 2 && t1r.data.spawned === Math.min(S.CUSTOMER_CAP, Math.max(1, Math.floor(S.CUSTOMERS_PER_PLAYER_PER_MIN * t1r.data.present))), JSON.stringify(t1r.data));
const spawned = Object.values((await owner("GET", "streetCust")) ?? {});
check("who each leave after 7 minutes", spawned.length === t1r.data.spawned && spawned.every((x) => x.until - x.at === 7 * 60_000));
const t1b = await act(b, "streetTick");
check("asking again straight away brings no more (nobody saves up)", t1b.data.spawned === 0, JSON.stringify(t1b.data));
await owner("DELETE", "streetCust");
await owner("PUT", "streetCust", Object.fromEntries(Array.from({ length: 15 }, (_, i) => [200_000 + i, { at: Date.now() - 1000, until: Date.now() + 300_000 }])));
await owner("PUT", "streetCustState", { at: Date.now() - 80_000, carry: 0, k: 200_014 });
const capped = await act(a, "streetTick");
check("with 15 on the street nobody new turns up", capped.data.spawned === 0 && capped.data.live === 15, JSON.stringify(capped.data));
await owner("DELETE", "streetCust");
await owner("PUT", "streetCustState", { at: Date.now() - 30_000, carry: 0, k: 300_000 });
const first = await act(a, "streetTick");
check("on an empty street the first customer is there at once", first.data.spawned >= 1, JSON.stringify(first.data));
await owner("DELETE", "streetCust");
let wk = 9000; while (S.customerAt(wk).kind !== "walker") wk++;
await owner("PUT", `streetCust/${wk}`, { at: now - 60_000, until: now + 5 * 60_000 });
const walker = S.customerAt(wk, now - 60_000);
await owner("PUT", `streetCust/${wk + 1}`, { at: now - 9 * 60_000, until: now - 2 * 60_000 });
bad("a customer who has left (7 minutes, not served) can't be served", await act(a, "streetFill", { k: wk + 1 }));
await owner("DELETE", `rooms/streets/players/${b.uid}`);
const all = [...Array(6000)].map((_, i) => S.customerAt(i));
const rich = all.filter((x) => x.kind === "rich");
check("there are no cars any more", !all.some((x) => x.kind === "car"));
check("about one customer in five is rich", rich.length / all.length > 0.15 && rich.length / all.length < 0.25, String(rich.length / all.length));
check("rich customers pay 3 times and stand on a sidewalk", rich.every((x) => x.want.mult === 3 && S.STREET_SIDEWALK_ROWS.includes(x.y)));
const asked = new Map();
for (const x of rich) asked.set(x.want.item, (asked.get(x.want.item) ?? 0) + 1);
check("every drug on the list is asked for", S.RICH_WANTS.every(([item]) => asked.has(item)), S.RICH_WANTS.filter(([item]) => !asked.has(item)).join());
check("the cali weed and the 芬太尼 are asked for", asked.has("caliweed") && asked.has("fentcn"));
check("the common ones are asked for more than the rare ones", (asked.get("weed") ?? 0) > 2 * (asked.get("caliweed") ?? 1) && (asked.get("joint") ?? 0) > 2 * (asked.get("loudpack") ?? 1), `${asked.get("weed")} ${asked.get("caliweed")} ${asked.get("joint")} ${asked.get("loudpack")}`);
check("every item they ask for exists", S.RICH_WANTS.every(([item]) => I.ITEM_IDS?.has ? I.ITEM_IDS.has(item) : true));
check("and has a price (the cali weed and the 芬太尼 the most)", S.RICH_WANTS.every(([item]) => D.streetUnit(item) >= 3) && D.streetUnit("caliweed") >= 250 && D.streetUnit("fentcn") >= 300 && D.streetUnit("joint_cali") > 250, S.RICH_WANTS.filter(([item]) => D.streetUnit(item) < 3).join());
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

console.log("--- RuneScape Classic's numbers");
check("a machete hits harder than a knife", S.maxHitOf("machete") > S.maxHitOf("knife") && S.maxHitOf("knife") >= 1, `${S.maxHitOf("knife")} ${S.maxHitOf("machete")}`);
check("a machete lands more swings", S.hitChanceOf("machete") > S.hitChanceOf("knife"));
check("the machete is the best weapon in a pocket", S.bestWeapon([null, { item: "knife" }, { item: "machete" }]) === "machete" && S.bestWeapon([{ item: "bandage" }]) === null);
for (const w of ["knife", "machete"]) {
  let landed = 0, top = 0, sum = 0;
  const N = 40000;
  for (let i = 0; i < N; i++) { const r = S.swingRoll(w); if (r.landed) landed++; sum += r.dmg; top = Math.max(top, r.dmg); }
  check(`${w}: the swings that land match the formula (${(S.hitChanceOf(w) * 100).toFixed(1)}%)`, Math.abs(landed / N - S.hitChanceOf(w)) < 0.015, String(landed / N));
  check(`${w}: it never hits harder than ${S.maxHitOf(w)} and does reach it`, top === S.maxHitOf(w), String(top));
  check(`${w}: a fight lasts a while (${(sum / N).toFixed(2)} a swing, ${S.PVP.maxHp} hit points)`, sum / N > 1.0 && sum / N < 3, String(sum / N));
}
check("a fixed roll is a fixed result (the rolls are RuneScape's two random numbers)", (() => { const seq = [0.9, 0.1, 0.5]; let i = 0; const r = S.swingRoll("knife", () => seq[i++]); return r.landed && r.dmg === Math.floor(0.5 * (S.maxHitOf("knife") + 1)); })());

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
check("it did 0 up to the knife's hardest hit", hit.data.dmg >= 0 && hit.data.dmg <= S.maxHitOf("knife"), JSON.stringify(hit.data));
check("both are in a fight, and nobody is marked for starting it", (await owner("GET", `streetCombat/${b.uid}/combatUntil`)) > Date.now() && (await owner("GET", `streetCombat/${a.uid}/skullUntil`)) === null);
check("everybody can see it (a number over the head)", (await owner("GET", `rooms/streets/hits/${a.uid}`))?.to === b.uid);
bad("you can't swing again at once", await act(a, "streetHit", { target: b.uid }));
check("the fight remembers who is fighting whom", (await owner("GET", `streetCombat/${a.uid}/foe`)) === b.uid && (await owner("GET", `streetCombat/${b.uid}/foe`)) === a.uid);
await owner("PUT", `users/${c.uid}/inventory`, { 0: { item: "knife", qty: 1 } }); await stand(c, "streets", 6, 6);
await owner("PUT", `streetCombat/${c.uid}`, { hp: 10, at: Date.now(), combatUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
bad("a third player can't join a fight (one at a time)", await act(c, "streetHit", { target: b.uid }));
await owner("DELETE", `streetSwing/${a.uid}`);
bad("and the one in a fight can't turn on somebody else", await act(a, "streetHit", { target: c.uid }));
await stand(c, "streets", 12, 9); await owner("DELETE", `streetSwing/${a.uid}`);
bad("nobody leaves a fight", await act(b, "elevatorDown"));
await owner("PATCH", `streetCombat/${b.uid}`, { combatUntil: 0 }); await owner("PATCH", `streetCombat/${a.uid}`, { combatUntil: 0 });
ok("out of a fight you can leave", await act(b, "elevatorDown"));
console.log("--- bandage and death");
await owner("PUT", `streetCombat/${b.uid}`, { hp: 4, at: Date.now(), combatUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
await owner("PUT", `users/${b.uid}/inventory/3`, { item: "bandage", qty: 2 });
const heal = await act(b, "streetHeal", { slot: 3 });
ok("a bandage heals 3", heal);
check("4 -> 7", heal.data.hp === 7 && heal.data.healed === 3, JSON.stringify(heal.data));
check("eating takes the place of a swing", Math.abs((Number(await owner("GET", `streetSwing/${b.uid}`)) || 0) - Date.now()) < 5000);
bad("and not again at once", await act(b, "streetHeal", { slot: 3 }));
await owner("PATCH", `streetCombat/${b.uid}`, { healAt: 0, hp: 10, at: Date.now() });
bad("not when you are not hurt", await act(b, "streetHeal", { slot: 3 }));
// kill b: they have 1 hp, a hits until a swing lands
await owner("PUT", `users/${b.uid}/inventory/4`, { item: "weed", qty: 5 });
await owner("DELETE", "rooms/streets/drops");
const weedBefore = have(await state(a), "weed"), bandBefore = have(await state(a), "bandage"), bBlood = await bloodOf(b);
await owner("PUT", `streetCombat/${b.uid}`, { hp: 1, at: Date.now(), combatUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
let died = false;
for (let i = 0; i < 25 && !died; i++) {
  await owner("DELETE", `streetSwing/${a.uid}`);
  const r = await act(a, "streetHit", { target: b.uid });
  if (r.ok && r.data.died) died = true;
}
check("a hit that lands kills somebody on 1 hit point", died);
const dead = await owner("GET", `streetCombat/${b.uid}`);
check("the dead one is back on full hit points, marked dead, and untouchable for a while", dead.hp === 10 && dead.deaths === 1 && dead.deadBy === a.uid && dead.protectUntil > Date.now(), JSON.stringify(dead));
check("killing the one who hit you does not lift your own 10 seconds (you still can't leave), but you are free to fight somebody else", (await owner("GET", `streetCombat/${a.uid}/combatUntil`)) > Date.now() + 5000 && (await owner("GET", `streetCombat/${a.uid}/foe`)) === null);
check("the killer is credited", (await owner("GET", `streetCombat/${a.uid}/kills`)) === 1);
check("the dead one keeps only the knife", (await state(b)).inventory.filter((x) => x).map((x) => x.item).join() === "knife", JSON.stringify((await state(b)).inventory));
check("the killer takes what they carried", have(await state(a), "weed") === weedBefore + 5 && have(await state(a), "bandage") === bandBefore + 1, `${have(await state(a), "weed")} ${have(await state(a), "bandage")}`);
check("the dead one drops 25 blood on the floor where they died", (await bloodOf(b)) === bBlood - 25 && Object.values((await owner("GET", "rooms/streets/drops")) ?? {}).some((d) => d.item === "blood" && d.qty === 25 && d.x === 6 && d.y === 5));
// with no room in the killer's pocket the things lie where the dead one went down
await owner("PUT", `users/${a.uid}/inventory`, Object.fromEntries(Array.from({ length: 28 }, (_, i) => [i, i === 0 ? { item: "knife", qty: 1 } : { item: "bandage", qty: 1 }])));
await owner("PUT", `users/${b.uid}/inventory/5`, { item: "joint", qty: 1 }); await owner("DELETE", "rooms/streets/drops"); await stand(b, "streets", 6, 5);
await owner("PUT", `streetCombat/${b.uid}`, { hp: 1, at: Date.now(), combatUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
let died2 = false, spilled = 0;
for (let i = 0; i < 25 && !died2; i++) {
  await owner("DELETE", `streetSwing/${a.uid}`); await owner("PATCH", `streetCombat/${a.uid}`, { foe: null, combatUntil: 0 });
  const r = await act(a, "streetHit", { target: b.uid });
  if (r.ok && r.data.died) { died2 = true; spilled = r.data.spilled; }
}
const floor2 = Object.values((await owner("GET", "rooms/streets/drops")) ?? {});
check("what doesn't fit lies on the floor", died2 && spilled === 1 && floor2.some((d) => d.item === "joint") && !(await state(a)).inventory.some((x) => x && x.item === "joint"), JSON.stringify(floor2));
check("every swing is a stab for everybody in the room to see", Object.values((await owner("GET", "rooms/streets/events")) ?? {}).some((e) => e.type === "stab" && e.fight && e.from === a.uid && e.to === b.uid));

console.log("--- nothing that kills you, or gets you out of a fight, on the street");
await stand(a, "streets", 5, 5);
await owner("PUT", `users/${a.uid}/inventory/1`, { item: "superpill", qty: 1 });
await owner("PUT", `users/${a.uid}/inventory/2`, { item: I.LACED_PREFIX + "joint", qty: 1, giver: b.uid });
await owner("PUT", `users/${a.uid}/inventory/3`, { item: "lighter", qty: 1 });
bad("the pill can't be taken on the street", await act(a, "consume", { slot: 1 }));
bad("neither can a laced drug", await act(a, "consume", { slot: 2 }));
bad("or a laced joint lit", await act(a, "light", { slot: 2 }));
check("nobody died of it (the pill and the joint are still there)", (await state(a)).inventory[1]?.item === "superpill" && (await state(a)).inventory[2]?.item === I.LACED_PREFIX + "joint");
await owner("PUT", `users/${a.uid}/loudpack`, null);
await owner("PUT", `users/${a.uid}/deadlyLeft`, 2); await owner("PUT", `users/${a.uid}/deadlyUntil`, Date.now() + 100_000);
bad("no deadly stab on the street", await act(a, "deadlyStab", { target: b.uid, room: "streets" }));
await owner("DELETE", `rooms/streets/players/${a.uid}`);
const off = await act(a, "consume", { slot: 1 });
check("off the street the pill still kills (the rule is for the street only)", off.ok === true && off.data.kind === "fentdeath", JSON.stringify(off).slice(0, 160));
console.log("--- bandages: 5 at most on you, as many as you like in the stash, 5% from the basement bins");
const E = await load("../../src/shared/economy.ts", "economy.mjs");
let pocket = Array.from({ length: 28 }, () => null);
for (let i = 0; i < 5; i++) pocket = E.addToInv(pocket, { item: "bandage", qty: 1 });
check("five bandages fit", E.carriedOf(pocket, "bandage") === 5);
check("a sixth doesn't", E.addToInv(pocket, { item: "bandage", qty: 1 }) === null);
check("other things still do", E.addToInv(pocket, { item: "weed", qty: 1 }) !== null);
const drops = Object.fromEntries(E.DUMPSTER_DROPS.map((d) => [d.item, d.chance]));
check("the bins give a bandage 5% of the time", drops.bandage === 5);
check("the seeds and the spores are where they were (39.5% and 22%)", drops.weedseed === 39.5 && drops.shroomspore === 22);
check("and the table still adds up to 100", Math.abs(E.DUMPSTER_DROPS.reduce((n, d) => n + d.chance, 0) - 100) < 1e-9);
await stand(a, "arrival", 5, 2);
await owner("PUT", `users/${a.uid}/inventory`, Object.fromEntries(Array.from({ length: 5 }, (_, i) => [i, { item: "bandage", qty: 1 }])));
await owner("PUT", `users/${a.uid}/stash`, { bandage: 40 });
ok("a bandage goes in a stash that already has 40", await act(a, "stashStore", { slot: 0, qty: 1 }));
check("41 in the stash", (await owner("GET", `users/${a.uid}/stash/bandage`)) === 41);
bad("taking out two while carrying four is refused (that would be six)", await act(a, "stashTake", { key: "bandage", qty: 2 }));
ok("one is fine now there are four on you", await act(a, "stashTake", { key: "bandage", qty: 1 }));
bad("but not past five", await act(a, "stashTake", { key: "bandage", qty: 1 }));
await owner("DELETE", `rooms/arrival/players/${a.uid}`);
// a bin with 5 bandages on you: the bandage lands on the floor, and every other way of getting one says why not
await stand(a, "streets", 5, 5);
await owner("DELETE", "rooms/streets/drops");
await owner("PUT", `users/${a.uid}/inventory`, Object.fromEntries(Array.from({ length: 5 }, (_, i) => [i, { item: "bandage", qty: 1 }])));
let droppedOne = null;
for (let i = 0; i < 120 && !droppedOne; i++) {
  await owner("DELETE", `users/${a.uid}/dumpsters`);
  const r = await act(a, "streetBin", { can: "s_can2" });
  if (r.ok && r.data.dropped?.length) droppedOne = r;
}
check("a bin that gives a bandage to somebody with 5 puts it on the floor", !!droppedOne && Object.values((await owner("GET", "rooms/streets/drops")) ?? {}).some((d) => d.item === "bandage"), JSON.stringify(droppedOne));
check("and the pocket still has 5", have(await state(a), "bandage") === 5);
const pile = Object.entries((await owner("GET", "rooms/streets/drops")) ?? {}).find(([, d]) => d.item === "bandage");
const picked = await act(a, "pickup", { room: "streets", key: pile?.[0] });
check("picking it up says you can only carry 5", picked.ok === false && picked.error === E.carryMsg("bandage"), JSON.stringify(picked).slice(0, 200));
await owner("PUT", `users/${a.uid}/blood`, 1000);
await owner("DELETE", `rooms/streets/players/${a.uid}`);
await owner("DELETE", "rooms/streets/drops");

console.log("--- guns on the street: 0-5 damage, one every 30 seconds, a fight with the one you shot, 2 at a time");
check("two guns fit, a third doesn't", (() => { let p = Array.from({ length: 28 }, () => null); p = E.addToInv(p, { item: "gun", qty: 1 }); p = E.addToInv(p, { item: "gun", qty: 1 }); return !!p && E.addToInv(p, { item: "gun", qty: 1 }) === null; })());
check("the message says so", E.carryMsg("gun") === "You can only carry 2 guns at a time.");
await stand(a, "streets", 5, 5); await stand(b, "streets", 9, 5);
await owner("PUT", `users/${a.uid}/inventory`, { 0: { item: "knife", qty: 1 }, 1: { item: "gun", qty: 1 }, 2: { item: "gun", qty: 1 } });
await owner("PUT", `users/${b.uid}/inventory`, { 0: { item: "knife", qty: 1 }, 1: { item: "weed", qty: 3 } });
await owner("PUT", `streetCombat/${b.uid}`, { hp: 10, at: Date.now(), combatUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
await owner("PUT", `streetCombat/${a.uid}`, { hp: 10, at: Date.now(), combatUntil: 0, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
await owner("DELETE", `streetGun/${a.uid}`); await owner("DELETE", "rooms/streets/events");
bad("the bounty gun doesn't work on the street", await act(a, "gunShoot", { room: "streets", target: b.uid, slot: 1 }));
await owner("PUT", `rooms/streets/players/${a.uid}`, { name: a.name, figure: "x", x: 5, y: 5, dir: 2 });
await stand(c, "streets", 40, 5); // (too far for the gun)
bad("too far away", await act(a, "streetShoot", { target: c.uid, slot: 1 }));
const shot = await act(a, "streetShoot", { target: b.uid, slot: 1 });
ok("a shot from 4 tiles away", shot);
check("0 to 5 damage", shot.data.dmg >= 0 && shot.data.dmg <= 5, JSON.stringify(shot.data));
check("the gun is spent", (await state(a)).inventory.filter((x) => x && x.item === "gun").length === 1);
check("they lost that many hit points", (await owner("GET", `streetCombat/${b.uid}/hp`)) === 10 - shot.data.dmg || shot.data.died);
check("you are locked in a fight with each other", (await owner("GET", `streetCombat/${a.uid}/foe`)) === b.uid && (await owner("GET", `streetCombat/${b.uid}/foe`)) === a.uid);
check("everybody sees the shot", Object.values((await owner("GET", "rooms/streets/events")) ?? {}).some((e) => e.type === "shot" && e.from === a.uid && e.to === b.uid));
const again = await act(a, "streetShoot", { target: b.uid });
check("the second gun has to wait 30 seconds", again.ok === false && /Reloading/.test(again.error), JSON.stringify(again).slice(0, 160));
await owner("PUT", `streetGun/${a.uid}`, Date.now() - 31_000);
const second = await act(a, "streetShoot", { target: b.uid });
ok("after the wait the next gun fires", second);
check("every damage is 0 to 5", second.data.dmg >= 0 && second.data.dmg <= 5);
await owner("PUT", `users/${a.uid}/inventory`, { 0: { item: "gun", qty: 1 } });
await owner("DELETE", `streetGun/${a.uid}`);
bad("somebody else can't join a fight you are in", await (async () => { await owner("PUT", `users/${c.uid}/inventory`, { 0: { item: "gun", qty: 1 } }); await stand(c, "streets", 8, 5); return act(c, "streetShoot", { target: b.uid, slot: 0 }); })());
await owner("DELETE", `rooms/streets/players/${c.uid}`); await owner("DELETE", `rooms/streets/players/${a.uid}`); await owner("DELETE", `rooms/streets/players/${b.uid}`);

console.log("--- the admin's changes to the street (streets/furni)");
const base = S.STREET_PIECES.length;
check("no changes: the street as built", S.mergeStreetPieces(null).length === base);
const m = S.mergeStreetPieces({ s_can1: { kind: "st_can", x: 7, y: 1, dir: 4 }, s_bin1: { removed: true }, x_new: { kind: "st_bench", x: 3, y: 4, dir: 2 }, x_gone: { removed: true } });
check("a piece moved", m.find((p) => p[0] === "s_can1")?.slice(2, 4).join() === "7,1");
check("a built-in piece taken away", !m.some((p) => p[0] === "s_bin1"));
check("a new piece added", m.some((p) => p[0] === "x_new" && p[1] === "st_bench"));
check("so the count is right (one less, one more)", m.length === base);
await stand(a, "streets", 5, 5);
await owner("PUT", "streets/furni/x_bin", { kind: "st_bin", x: 30, y: 10, dir: 2 });
await owner("DELETE", `users/${a.uid}/dumpsters`);
ok("a bin the admin added can be searched", await act(a, "streetBin", { can: "x_bin" }));
await owner("PUT", "streets/furni/x_bin", { removed: true });
bad("and not one that is gone", await act(a, "streetBin", { can: "x_bin" }));
await owner("PUT", "streets/furni/s_bin2", { removed: true }); await owner("DELETE", `users/${a.uid}/dumpsters`);
bad("or a built-in one the admin took away", await act(a, "streetBin", { can: "s_bin2" }));
await owner("DELETE", "streets/furni"); await owner("DELETE", `rooms/streets/players/${a.uid}`);

console.log("--- closing the game in a fight");
const rowOf = (u) => ({ name: u.name, figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", x: 4, y: 4, dir: 2, ts: Date.now() - 60_000, off: Date.now() });
await owner("DELETE", `presence/${b.uid}`);
await owner("PUT", `rooms/streets/players/${b.uid}`, rowOf(b));
await owner("PUT", `streetCombat/${b.uid}`, { hp: 10, at: Date.now(), combatUntil: Date.now() + 8000, healAt: 0, protectUntil: 0, kills: 0, deaths: 0 });
await act(a, "roomSweep", { room: "streets" });
check("somebody who closed the game in a fight stays on the street", !!(await owner("GET", `rooms/streets/players/${b.uid}`)));
await owner("PATCH", `streetCombat/${b.uid}`, { combatUntil: Date.now() - 1000 });
await act(a, "roomSweep", { room: "streets" });
check("and goes once the fight has been quiet", !(await owner("GET", `rooms/streets/players/${b.uid}`)));

for (const u of [admin, a, b, c, poor]) for (const r of ["lobby", "shop", "arrival", "streets"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
await owner("PUT", "config/streetsForce", Date.now() + 30 * 86_400_000); // (the elevator keeps running in the local test)
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
