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
console.log("--- the pet merchant");
const u = await fresh("t_pet_a", { blood: 9000 });
const poor = await fresh("t_pet_poor", { blood: 500 });
for (const x of [u, poor]) await act(x, "sync");
await owner("DELETE", `users/${u.uid}/pets`); await owner("DELETE", `users/${u.uid}/activePet`); await owner("DELETE", `users/${u.uid}/petLook`);
bad("not from outside the shop", await act(u, "petBuy", { type: "cat" }));
await stand(u, "shop", 3, 3); await stand(poor, "shop", 4, 4);
bad("not a pet he has", await act(u, "petBuy", { type: "unicorn" }));
bad("too poor", await act(poor, "petBuy", { type: "cat" }));
const r = await act(u, "petBuy", { type: "cat" });
ok("buy a cat", r);
check("it costs 1000-2000", r.data.price >= 1000 && r.data.price <= 2000 && (await bloodOf(u)) === 9000 - r.data.price, JSON.stringify(r.data));
check("it comes in one of its 25 colours", r.data.palette >= 0 && r.data.palette < 25);
check("the first pet walks with you", (await owner("GET", `users/${u.uid}/activePet`)) === r.data.id && (await owner("GET", `users/${u.uid}/petLook`)) === `cat:${r.data.palette}`);
const d = await act(u, "petBuy", { type: "dog" });
ok("buy a dog", d);
check("the second doesn't take over", (await owner("GET", `users/${u.uid}/activePet`)) === r.data.id);
ok("switch to the dog", await act(u, "petActive", { id: d.data.id }));
check("the look follows", (await owner("GET", `users/${u.uid}/petLook`)) === `dog:${d.data.palette}`);
bad("not somebody else's pet", await act(poor, "petActive", { id: d.data.id }));
ok("send it home", await act(u, "petActive", { id: null }));
check("no look then", (await owner("GET", `users/${u.uid}/petLook`)) === null);
check("a pet can't be faked in the room", refused(await clientWrite(u, `rooms/shop/players/${u.uid}/pet`, "dragon:0")));
ok("take the cat along", await act(u, "petActive", { id: r.data.id }));
check("and then that one is allowed", !refused(await clientWrite(u, `rooms/shop/players/${u.uid}/pet`, `cat:${r.data.palette}`)));

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
