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
console.log("--- mystery boxes");
const u = await fresh("t_case_a", { blood: 5000 });
const lone = await fresh("t_case_b", { blood: 0 });
for (const x of [u, lone]) await act(x, "sync");
const setInv = (x, items) => owner("PUT", `users/${x.uid}/inventory`, items);
await setInv(lone, inv({ item: "mysterycase", qty: 1 }));
bad("a box without a key", await act(lone, "caseOpen"));
check("nothing used up", total((await state(lone)).inventory, "mysterycase") === 1);
await setInv(lone, inv({ item: "casekey", qty: 1 }));
bad("a key without a box", await act(lone, "caseOpen"));

// the prize table: open many and count
await setInv(u, inv({ item: "mysterycase", qty: 20 }, { item: "casekey", qty: 20 }));
const counts = {};
for (let i = 0; i < 20; i++) {
  const r = await act(u, "caseOpen");
  if (!r.ok) { check("open " + i, false, JSON.stringify(r)); break; }
  counts[r.data.prize.id] = (counts[r.data.prize.id] || 0) + 1;
  if (i === 0) check("a prize comes back", !!r.data.prize.item && !!r.data.prize.tier);
  // pocket space: take the prize out again so 20 opens always fit
  const st = await state(u);
  const keep = st.inventory.map((s, k) => (s && (s.item === "mysterycase" || s.item === "casekey") ? s : null));
  await setInv(u, Object.fromEntries(keep.map((s, k) => [k, s]).filter(([, s]) => s)));
}
console.log("   twenty opens:", JSON.stringify(counts));
const stEnd = await state(u);
check("boxes and keys used up", total(stEnd.inventory, "mysterycase") === 0 && total(stEnd.inventory, "casekey") === 0);

// the room hears what came out
await setInv(u, inv({ item: "mysterycase", qty: 2 }, { item: "casekey", qty: 2 }));
await stand(u, "lobby", 3, 3);
const rw = await act(u, "caseOpen", { room: "lobby" });
ok("open with a room", rw);
const win = await owner("GET", `rooms/lobby/caseWin/${u.uid}`);
check("the server wrote what came out to the room", win && win.item === rw.data.prize.item && typeof win.at === "number" && win.name === "t_case_a", JSON.stringify(win));
check("the room's players can't fake it", refused(await clientWrite(u, `rooms/lobby/caseWin/${u.uid}`, { item: "unusual_flame", qty: 1, at: Date.now() })));
const rw2 = await act(u, "caseOpen", { room: "u_nobodyhere" });
ok("a room you aren't in just means no announcement", rw2);
await setInv(u, inv());

// the unusual: wear, swap, remove, rules
await setInv(u, inv({ item: "unusual_flame", qty: 1 }, { item: "unusual_star", qty: 1 }));
bad("not a normal item", await act(u, "unusualWear", { slot: 5 }));
const w1 = await act(u, "unusualWear", { slot: 0 });
ok("wear the flame crown", w1);
check("stored on the user", (await owner("GET", `users/${u.uid}/unusual`)) === "unusual_flame");
const w2 = await act(u, "unusualWear", { slot: slotOf(await state(u), "unusual_star") });
ok("swap to the star", w2);
const st2 = await state(u);
check("the flame is back in the pocket", total(st2.inventory, "unusual_flame") === 1 && total(st2.inventory, "unusual_star") === 0);
await stand(u, "lobby", 3, 3);
check("faking one in the room is refused", refused(await clientWrite(u, `rooms/lobby/players/${u.uid}/un`, "unusual_bolt")));
check("the real one is allowed", !refused(await clientWrite(u, `rooms/lobby/players/${u.uid}/un`, "unusual_star")));
ok("take it off", await act(u, "unusualRemove"));
check("it is in the pocket", total((await state(u)).inventory, "unusual_star") === 1 && (await owner("GET", `users/${u.uid}/unusual`)) === null);
bad("nothing to take off", await act(u, "unusualRemove"));

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
