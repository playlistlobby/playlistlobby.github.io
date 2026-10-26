// Pet merchant tests
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


const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;
console.log("--- the pet merchant: pets are items, four at a time");
const u = await fresh("t_pet_a", { blood: 9000 });
const poor = await fresh("t_pet_poor", { blood: 500 });
for (const x of [u, poor]) await act(x, "sync");
await owner("DELETE", `users/${u.uid}/petLook`); await owner("PUT", `users/${u.uid}/inventory`, []);
const stock = await act(u, "petStockNow");
check("he has four pets on sale and says when they change", stock.ok && stock.data.types.length === 4 && new Set(stock.data.types).size === 4 && stock.data.until > Date.now() && stock.data.until - Date.now() <= 6 * 3600_000, JSON.stringify(stock).slice(0, 160));
const [A, B] = stock.data.types;
const notOnSale = ["cat", "dog", "lion", "frog", "bear", "pig"].find((t) => !stock.data.types.includes(t));
bad("not from outside the shop", await act(u, "petBuy", { type: A }));
await stand(u, "shop", 3, 3); await stand(poor, "shop", 4, 4);
bad("not a pet he has", await act(u, "petBuy", { type: "unicorn" }));
bad("a pet he took out of the shop (cow)", await act(u, "petBuy", { type: "cow" }));
bad("too poor", await act(poor, "petBuy", { type: A }));
bad("not one that isn't on sale right now", await act(u, "petBuy", { type: notOnSale }));
const r = await act(u, "petBuy", { type: A });
ok("buy the first one on sale", r);
check("it costs between 500 and 4000", r.data.price >= 500 && r.data.price <= 4000 && (await bloodOf(u)) === 9000 - r.data.price, JSON.stringify(r.data));
check("it comes in one of its colours", r.data.palette >= 0 && r.data.palette < 30);
const itemId = `pet_${A}_${r.data.palette}`;
let st = await state(u);
check("it is in the pocket", total(st.inventory, itemId) === 1);
check("it does not walk yet", (await owner("GET", `users/${u.uid}/petLook`)) === null);
const d = await act(u, "petBuy", { type: B });
ok("buy the second one on sale", d);
const dogId = `pet_${B}_${d.data.palette}`;
bad("not a thing that isn't a pet", await act(u, "petRelease", { slot: slotOf(await state(u), "pet_zzz") }));
ok("let the first one out", await act(u, "petRelease", { slot: slotOf(await state(u), itemId) }));
check("it walks now", (await owner("GET", `users/${u.uid}/petLook`)) === `${A}:${r.data.palette}`);
st = await state(u);
check("and it left the pocket", total(st.inventory, itemId) === 0 && total(st.inventory, dogId) === 1);
ok("let the second one out: the first goes back in", await act(u, "petRelease", { slot: slotOf(await state(u), dogId) }));
st = await state(u);
check("the second walks, the first is in the pocket", (await owner("GET", `users/${u.uid}/petLook`)) === `${B}:${d.data.palette}` && total(st.inventory, itemId) === 1 && total(st.inventory, dogId) === 0);
await stand(u, "shop", 3, 3);
check("a pet can't be faked in the room", refused(await clientWrite(u, `rooms/shop/players/${u.uid}/pet`, "dragon:0")));
check("the real one is allowed", !refused(await clientWrite(u, `rooms/shop/players/${u.uid}/pet`, `${B}:${d.data.palette}`)));
ok("pick the second one up", await act(u, "petPickup"));
st = await state(u);
check("it is in the pocket and nothing walks", total(st.inventory, dogId) === 1 && (await owner("GET", `users/${u.uid}/petLook`)) === null);
bad("nothing to pick up", await act(u, "petPickup"));
// full pockets
const full = {}; for (let i = 0; i < 27; i++) full[i] = { item: "cigarette", qty: 1 };
await owner("PUT", `users/${u.uid}/inventory`, { ...full, 27: { item: itemId, qty: 1 } });
ok("let a pet out of a full pocket", await act(u, "petRelease", { slot: 27 }));
await owner("PUT", `users/${u.uid}/inventory`, Object.fromEntries(Array.from({ length: 28 }, (_, i) => [i, { item: "cigarette", qty: 1 }])));
bad("buying with full pockets", await act(u, "petBuy", { type: A }));
check("and nothing was spent", (await bloodOf(u)) === 9000 - r.data.price - d.data.price);
await owner("PUT", `users/${u.uid}/inventory`, inv({ item: "unusual_galaxy", qty: 1 }));
ok("an unusual pet item is a valid item", await act(u, "unusualWear", { slot: 0 }));
// 6ixty doesn't buy pets
await owner("PUT", `users/${u.uid}/inventory`, inv({ item: itemId, qty: 1 }));
bad("6ixty has no use for a pet", await act(u, "sellWeed", { slot: 0, qty: 1 }));

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
