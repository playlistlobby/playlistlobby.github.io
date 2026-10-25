// Dice tests: buying them at the pay2win machine for blood, rolling (the server throws, nobody else can write the number), the limits
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
const refused = (r) => r.status === 401 || r.status === 403;
const sleep = (ms) => new Promise((x) => setTimeout(x, ms));

console.log("--- buying the dice at the pay2win machine (500 blood)");
const a = await fresh("t_dice_a", { blood: 520, createdAt: Date.now() - 3_600_000 });
await act(a, "sync");
bad("not from across the map", await act(a, "duckyBuy", { product: "dice" })); // (not standing in the shop)
await inShop(a);
ok("buy", await act(a, "duckyBuy", { product: "dice" }));
let st = await state(a);
check("500 blood gone, 20 left", st.blood === 20, String(st.blood));
check("one die in the pocket", total(st.inventory, "dice") === 1);
bad("20 blood is not enough for another", await act(a, "duckyBuy", { product: "dice" }));
check("and nothing was taken", (await state(a)).blood === 20 && total((await state(a)).inventory, "dice") === 1);
const noPay = await fetch(`${API}/pay/checkout`, { method: "POST", headers: { authorization: `Bearer ${a.token}`, "content-type": "application/json" }, body: JSON.stringify({ product: "ducky_dice" }) });
check("the payment page does not sell it", noPay.status >= 400);
bad("6ixty does not sell it", await act(a, "buySixty", { item: "dice" }));
const full = await fresh("t_dice_full", { blood: 600, inventory: Object.fromEntries(Array.from({ length: 28 }, (_, i) => [i, { item: "wateringcan", qty: 1 }])) });
await inShop(full);
bad("a full pocket keeps the blood", await act(full, "duckyBuy", { product: "dice" }));
check("(still 600)", (await state(full)).blood === 600);

console.log("--- rolling");
const lobby = (u) => stand(u, "lobby", 4, 4);
await owner("DELETE", `rooms/shop/players/${a.uid}`); // (walked out of the shop)
await lobby(a);
const nodeOf = (u, room = "lobby") => owner("GET", `rooms/${room}/dice/${u.uid}`);
const none = await fresh("t_dice_none", { blood: 0 });
await lobby(none);
bad("no dice, no roll", await act(none, "rollDice", { room: "lobby" }));
check("(and nothing is written)", (await nodeOf(none)) === null);
bad("a room you are not in", await act(a, "rollDice", { room: "shop" }));
bad("a room that does not exist", await act(a, "rollDice", { room: "../x" }));
const r1 = await act(a, "rollDice", { room: "lobby" });
ok("roll", r1);
check("a number from 1 to 6", Number.isInteger(r1.data?.n) && r1.data.n >= 1 && r1.data.n <= 6, JSON.stringify(r1));
const node = await nodeOf(a);
check("the server wrote it over your head", node && node.n === r1.data.n && typeof node.at === "number" && Math.abs(Date.now() - node.at) < 10000, JSON.stringify(node));
bad("rolling again at once is refused", await act(a, "rollDice", { room: "lobby" }));
await sleep(2200);
const seen = new Set([r1.data.n]);
for (let i = 0; i < 40 && seen.size < 6; i++) {
  const r = await act(a, "rollDice", { room: "lobby" });
  if (r.ok) seen.add(r.data.n); else await sleep(300);
  if (r.ok) await sleep(2050);
}
check("all six faces come up (fair dice)", seen.size === 6, JSON.stringify([...seen]));

console.log("--- nobody can fake it");
check("you can't write your own number", refused(await clientWrite(a, `rooms/lobby/dice/${a.uid}`, { n: 6, at: Date.now() })));
check("or somebody else's", refused(await clientWrite(none, `rooms/lobby/dice/${a.uid}`, { n: 6, at: Date.now() })));
check("or your own with no dice", refused(await clientWrite(none, `rooms/lobby/dice/${none.uid}`, { n: 6, at: Date.now() })));
check("or delete it", refused(await fetch(`${DB}/rooms/lobby/dice/${a.uid}.json?ns=${NS}&auth=${a.token}`, { method: "DELETE" })));
const chat = await clientWrite(a, `rooms/lobby/chat/m${Math.random().toString(36).slice(2)}`, { uid: a.uid, name: a.name, text: "rolled a 6", ts: { ".sv": "timestamp" } });
check("(chat is only chat: the game shows the die from the dice node, not from text)", chat.status === 200);

console.log("--- the lent dice do not count");
const lent = await fresh("t_dice_lent", { blood: 0, inventory: { 0: { item: "dice", qty: 1, inPlayer: true } } });
await lobby(lent);
bad("dice that are loaned out can't be rolled", await act(lent, "rollDice", { room: "lobby" }));

console.log("--- 6ixty does not buy the starter sofa or the dice");
const sv = await fresh("t_sofa", { blood: 0, starterFurni: true, inventory: { 0: { item: "f_sofa", qty: 1 } } }); // (the starter sofa, taken out of storage into the pocket)
await act(sv, "sync");
const sst = await state(sv);
const sofaSlot = sst.inventory.findIndex((x) => x && x.item === "f_sofa");
check("the sofa is in the pocket", sofaSlot >= 0);
bad("he won't buy the sofa", await act(sv, "sellWeed", { slot: sofaSlot, qty: 1 }));
check("(it is still there, no blood paid)", total((await state(sv)).inventory, "f_sofa") === 1 && (await state(sv)).blood === 0);
bad("or the dice", await act(a, "sellWeed", { slot: (await state(a)).inventory.findIndex((x) => x && x.item === "dice"), qty: 1 }));

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
