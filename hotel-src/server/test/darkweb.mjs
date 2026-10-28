// The dark web: two big orders a day for a hideout, filled together by its members, each item paid at once at 1.5 x 6ixty's price
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/darkweb.mjs (server/)
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "dw-"));
const load = async (rel, name) => { const out = join(dir, name); buildSync({ entryPoints: [resolve(here, rel)], bundle: true, format: "esm", outfile: out, logLevel: "error" }); return import(pathToFileURL(out).href); };
const D = await load("../../src/shared/darkweb.ts", "darkweb.mjs");
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
    if (r.status === 429 && tries < 12) { await new Promise((x) => setTimeout(x, 800)); continue; }
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
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "x", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  return u;
};
const state = async (u) => (await act(u, "sync")).state;
const have = (st, item) => st.inventory.reduce((n, s) => n + (s && s.item === item ? s.qty : 0), 0);

console.log("--- the orders");
const A = D.DW_ORDERS[0], B = D.DW_ORDERS[1];
check("two orders", D.DW_ORDERS.length === 2);
check("order 1: 3 fentanyl, 1 cali blunt, 1 2cb (about 2k)", A.lines.find((l) => l.item === "fentcn")?.qty === 3 && A.lines.find((l) => l.item === "blunt_cali")?.qty === 1 && A.lines.find((l) => l.item === "twocb")?.qty === 1 && D.dwTotal(A) > 1800 && D.dwTotal(A) < 2400, String(D.dwTotal(A)));
check("order 2: 25 chud blunts", B.lines.length === 1 && B.lines[0].item === "blunt_chud" && B.lines[0].qty === 25);
check("every item pays 1.5 x what it is worth (6ixty's price; bagmand's for the opium drugs)", D.dwUnitPay("blunt_chud") === 30 && D.dwUnitPay("fentcn") === 495 && D.dwUnitPay("twocb") === 270 && D.dwUnitPay("blunt_cali") === 386 && D.dwTotal(B) === 750, [D.dwUnitPay("blunt_chud"), D.dwUnitPay("fentcn"), D.dwUnitPay("twocb"), D.dwUnitPay("blunt_cali")].join());
check("the chud blunt is 6ixty's price x 1.5", D.dwUnitPay("blunt_chud") === Math.ceil(I.sellPrice("blunt_chud") * 1.5) && I.sellPrice("blunt_chud") === 20);
check("open until 21:00 Danish time (20:00 UTC in winter), closed after", D.dwOpen(Date.UTC(2026, 0, 15, 19, 59)).open && !D.dwOpen(Date.UTC(2026, 0, 15, 20, 0)).open && D.dwOpen(Date.UTC(2026, 6, 15, 18, 59)).open && !D.dwOpen(Date.UTC(2026, 6, 15, 19, 0)).open);

const boss = await fresh("t_dw_boss", { blood: 0, inventory: inv({ item: "blunt_chud", qty: 20 }, { item: "twocb", qty: 2 }) });
const mate = await fresh("t_dw_mate", { inventory: inv({ item: "fentcn", qty: 8 }, { item: "blunt_chud", qty: 9 }) });
const out = await fresh("t_dw_out", { inventory: inv({ item: "blunt_chud", qty: 5 }) });
const ROOM = `h_${boss.uid}`;
await owner("PUT", `roomsMeta/${ROOM}`, { owner: boss.uid, ownerName: "boss", name: "test", access: "none", w: 14, h: 14, level: 0, lock: false, members: { [mate.uid]: { name: "mate", build: false, grow: true, stash: false } } });
await owner("DELETE", `darkweb/${boss.uid}`);
for (const u of [boss, mate, out]) await act(u, "sync");

const openNow = D.dwOpen(Date.now()).open;
console.log(openNow ? "--- handing in" : "--- closed (after 21:00 Danish time): only the closing is tested");
if (!openNow) { bad("closed after 21:00", await act(boss, "darkwebGive", { room: ROOM, order: "b", item: "blunt_chud", qty: 1 })); await owner("DELETE", `roomsMeta/${ROOM}`); console.log(`
${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0); }
bad("somebody outside the hideout can't", await act(out, "darkwebGive", { room: ROOM, order: "b", item: "blunt_chud", qty: 2 }));
bad("not an order", await act(boss, "darkwebGive", { room: ROOM, order: "zz", item: "blunt_chud", qty: 1 }));
bad("not in that order", await act(boss, "darkwebGive", { room: ROOM, order: "b", item: "fentcn", qty: 1 }));
bad("nothing on you", await act(boss, "darkwebGive", { room: ROOM, order: "a", item: "blunt_cali", qty: 1 }));
const g1 = await act(boss, "darkwebGive", { room: ROOM, order: "b", item: "blunt_chud", qty: 20 });
ok("the owner hands in 20 chud blunts", g1);
check("paid 20 x 30 (1.5 x 20) at once", (await state(boss)).blood === 600 && have(await state(boss), "blunt_chud") === 0, JSON.stringify(g1.data));
const g2 = await act(mate, "darkwebGive", { room: ROOM, order: "b", item: "blunt_chud", qty: 9 });
ok("a member helps (only 5 are still needed)", g2);
check("so only 5 are taken and paid 150", g2.data.gave === 5 && have(await state(mate), "blunt_chud") === 4 && (await state(mate)).blood === 150, JSON.stringify(g2.data));
check("the order is done", g2.data.done === true);
bad("and filled for the day", await act(mate, "darkwebGive", { room: ROOM, order: "b", item: "blunt_chud", qty: 1 }));
const prog = await owner("GET", `darkweb/${boss.uid}/${S.danishDayKey(Date.now())}/b`);
check("the hideout's progress is shared", prog.got.blunt_chud === 25 && prog.by[boss.uid] === 20 && prog.by[mate.uid] === 5 && prog.done === true, JSON.stringify(prog));
const g3 = await act(mate, "darkwebGive", { room: ROOM, order: "a", item: "fentcn", qty: 99 });
ok("the first order takes the fentanyl too", g3);
check("only 3 are needed: 3 taken and paid 3 x 495", g3.data.gave === 3 && have(await state(mate), "fentcn") === 5 && (await state(mate)).blood === 150 + 1485, JSON.stringify(g3.data));
bad("the fentanyl part is filled", await act(mate, "darkwebGive", { room: ROOM, order: "a", item: "fentcn", qty: 1 }));
const g4 = await act(boss, "darkwebGive", { room: ROOM, order: "a", item: "twocb", qty: 2 });
check("the owner's 2 2cb are cut to the 1 needed (paid 270), the order is not done yet", g4.ok && g4.data.gave === 1 && g4.data.pay === 270 && !g4.data.done, JSON.stringify(g4));
const wr = await fetch(`${DB}/darkweb/${boss.uid}.json?ns=${NS}&auth=${out.token}`, { method: "PUT", body: "{}" });
check("players can't write the progress themselves", wr.status === 401 || wr.status === 403, String(wr.status));

await owner("DELETE", `darkweb/${boss.uid}`); await owner("DELETE", `roomsMeta/${ROOM}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
