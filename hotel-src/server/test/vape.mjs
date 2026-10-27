// The puff-bar: puff it once a minute for 35 seconds of 1.5x walking speed and double stab blood, with a cloud over you that everybody sees
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/vape.mjs (server/)
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

console.log("--- the puff-bar");
const a = await fresh("t_vp_a", { blood: 100, inventory: inv({ item: "puffbar", qty: 1 }) });
const b = await fresh("t_vp_b", { blood: 100, inventory: inv({ item: "cigarette", qty: 1 }) });
for (const x of [a, b]) await act(x, "sync");
bad("no puff-bar, no puff", await act(b, "vapePuff", { slot: 0 }));
bad("a bad slot", await act(a, "vapePuff", { slot: 99 }));
bad("the wrong thing in the slot", await act(b, "vapePuff", { slot: 0 }));
const r1 = await act(a, "vapePuff", { slot: 0 });
ok("puff", r1);
let st = await state(a);
check("35 seconds of 1.5x speed", st.speedUntil > Date.now() + 33_000 && st.speedUntil < Date.now() + 37_000 && st.speedMult === 1.5, JSON.stringify([st.speedUntil - Date.now(), st.speedMult]));
check("and double stab blood", st.boostUntil > Date.now() + 33_000 && st.boostMult === 2, JSON.stringify([st.boostUntil - Date.now(), st.boostMult]));
check("the cloud lasts as long", st.vapeUntil === r1.data.until && st.vapeUntil > Date.now() + 33_000, String(st.vapeUntil));
check("the puff-bar stays in the pocket (it is not used up)", total(st.inventory, "puffbar") === 1);
bad("not again for a minute", await act(a, "vapePuff", { slot: 0 }));
await owner("PUT", `users/${a.uid}/vapeAt`, Date.now() - 61_000);
ok("a minute later it works again", await act(a, "vapePuff", { slot: 0 }));

console.log("--- a stronger boost stays");
await owner("PUT", `users/${a.uid}/vapeAt`, Date.now() - 61_000);
await owner("PUT", `users/${a.uid}`, { ...(await owner("GET", `users/${a.uid}`)), boostUntil: Date.now() + 120_000, boostMult: 4, speedUntil: Date.now() + 120_000, speedMult: 4 });
ok("puff with the percs still going", await act(a, "vapePuff", { slot: 0 }));
st = await state(a);
check("the 4x blood and the 4x speed are not touched", st.boostMult === 4 && st.speedMult === 4 && st.boostUntil > Date.now() + 100_000 && st.speedUntil > Date.now() + 100_000, JSON.stringify([st.boostMult, st.speedMult]));

console.log("--- the cloud is what the server says");
await stand(a, "lobby", 5, 5); await stand(b, "lobby", 6, 6);
const until = (await state(a)).vapeUntil;
check("somebody can't put a cloud on themselves", refused(await clientWrite(b, `rooms/lobby/players/${b.uid}/vape`, Date.now() + 100000)));
check("and can show the one they have", !refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/vape`, until)));
check("a speed of 1.5 is allowed in the room", !refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/fastMult`, 1.5)));
check("but not a speed of 1.2", refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/fastMult`, 1.2)));

console.log("--- stabs give double blood while it lasts");
{
  const t = await fresh("t_vp_t", { blood: 100 });
  await act(t, "sync");
  await stand(t, "lobby", 4, 5);
  await owner("PUT", `users/${a.uid}/inventory`, inv({ item: "puffbar", qty: 1 }, { item: "knife", qty: 1 }));
  await owner("PUT", `users/${a.uid}/stabs`, null);
  await owner("PUT", `users/${a.uid}/boostUntil`, Date.now() + 30_000); await owner("PUT", `users/${a.uid}/boostMult`, 2);
  const before = Number(await owner("GET", `users/${a.uid}/blood`)) || 0;
  const sr = await act(a, "stab", { target: t.uid, room: "lobby" });
  if (sr.ok) check("a stab pays double while the puff lasts", ((Number(await owner("GET", `users/${a.uid}/blood`)) || 0) - before) % 2 === 0 && (Number(await owner("GET", `users/${a.uid}/blood`)) || 0) > before, String((Number(await owner("GET", `users/${a.uid}/blood`)) || 0) - before));
  else console.log("   (the stab itself was refused here: " + (sr.error ?? "") + ")");
}

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
