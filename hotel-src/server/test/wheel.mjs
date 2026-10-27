// The colour wheel: a clothing colour that is not on the palette is "x" and six hex digits in the look
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/wheel.mjs (server/)
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
const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;

console.log("--- a custom colour in the look");
const a = await fresh("t_cw_a", { blood: 100 });
await act(a, "sync");
ok("a look with colours from the palette", await act(a, "setLook", { figure: "hr-115-42.hd-190-1.ch-215-62", gender: "M" }));
const fig = "hr-115-42.hd-190-1.ch-215-xd02090.lg-285-x20c070";
ok("custom colours from the wheel (x and six hex digits)", await act(a, "setLook", { figure: fig, gender: "M" }));
check("they are saved as they are", (await owner("GET", `users/${a.uid}/figure`)) === fig && (await owner("GET", `profiles/${a.uid}/figure`)) === fig);
bad("not hex", await act(a, "setLook", { figure: "hr-115-xZZZZZZ.hd-190-1", gender: "M" }));
bad("not too short", await act(a, "setLook", { figure: "hr-115-xd0209.hd-190-1", gender: "M" }));
bad("not too long", await act(a, "setLook", { figure: "hr-115-xd020901.hd-190-1", gender: "M" }));
bad("not a capital X", await act(a, "setLook", { figure: "hr-115-Xd02090.hd-190-1", gender: "M" }));
bad("and still no script", await act(a, "setLook", { figure: "<script>", gender: "M" }));
check("the last good look is still there", (await owner("GET", `users/${a.uid}/figure`)) === fig);

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
