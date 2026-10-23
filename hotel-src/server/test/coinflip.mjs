// Coin flip tests (a separate file so they run on their own):  the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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

console.log("--- coin flips");
{
  const a = await fresh("t_flipA", { blood: 100 }), b = await fresh("t_flipB", { blood: 50 }), c = await fresh("t_flipC", { blood: 3 });
  for (const u of [a, b, c]) await act(u, "sync");
  await owner("DELETE", "coinflips");
  bad("not in the basement: no flip", await act(a, "flipPost", { stake: 10, side: "heads" }));
  for (const u of [a, b, c]) await stand(u, "lobby", 3, 3);
  bad("0 blood", await act(a, "flipPost", { stake: 0, side: "heads" }));
  bad("51 blood is too much", await act(a, "flipPost", { stake: 51, side: "heads" }));
  bad("neither heads nor tails", await act(a, "flipPost", { stake: 5, side: "edge" }));
  bad("more than you have", await act(c, "flipPost", { stake: 5, side: "tails" }));
  const p = await act(a, "flipPost", { stake: 10, side: "heads" });
  ok("post a flip", p);
  check("the stake leaves your blood", (await state(a)).blood === 90);
  const open = await owner("GET", "coinflips/open");
  check("the flip is on the board", open?.[p.data.id]?.stake === 10 && open[p.data.id].side === "heads" && open[p.data.id].by === a.uid, JSON.stringify(open));
  bad("you can't take your own flip", await act(a, "flipTake", { id: p.data.id }));
  bad("too poor to take it", await act(c, "flipTake", { id: p.data.id }));
  bad("only the poster can take it back", await act(b, "flipCancel", { id: p.data.id }));
  ok("take it back", await act(a, "flipCancel", { id: p.data.id }));
  check("the blood comes back", (await state(a)).blood === 100);
  bad("a flip that is gone", await act(b, "flipTake", { id: p.data.id }));
  const ids = [];
  for (let i = 0; i < 3; i++) { const r = await act(a, "flipPost", { stake: 5, side: "tails" }); ok("open flip " + (i + 1), r); ids.push(r.data?.id); }
  bad("a fourth open flip is refused", await act(a, "flipPost", { stake: 5, side: "tails" }));
  for (const id of ids) await act(a, "flipCancel", { id });
  // take: the winner gets both stakes, no blood appears or disappears
  let heads = 0, tails = 0, conserved = true;
  for (let i = 0; i < 24; i++) {
    await owner("PATCH", `users/${a.uid}`, { blood: 100 }); await owner("PATCH", `users/${b.uid}`, { blood: 50 });
    const r = await act(a, "flipPost", { stake: 5, side: "heads" });
    const t = await act(b, "flipTake", { id: r.data?.id });
    if (!t.ok) { check("take " + i, false, JSON.stringify(t)); break; }
    if (t.data.result === "heads") heads++; else tails++;
    const sa = (await state(a)).blood, sb = (await state(b)).blood;
    if (sa + sb !== 150 || sa !== (t.data.won ? 95 : 105) || sb !== (t.data.won ? 55 : 45)) { conserved = false; console.log("  odd:", sa, sb, JSON.stringify(t.data)); }
    if (t.data.won === (t.data.result === "heads")) { conserved = false; console.log("  the taker won on the poster's side?", JSON.stringify(t.data)); }
  }
  check("the winner gets both stakes and no blood is created or lost", conserved);
  check("both sides of the coin come up", heads > 0 && tails > 0, `heads ${heads} tails ${tails}`);
  const done = await owner("GET", "coinflips/done");
  const rows = Object.values(done ?? {});
  check("finished flips are on the board with a winner", rows.length > 0 && rows.every((f) => (f.result === f.side) === (f.winner === f.by)), JSON.stringify(rows[0]));
  check("nothing is left open", !(await owner("GET", "coinflips/open")));
  // the 24 hour limit that trades have counts here too
  const rich = await fresh("t_flipR", { blood: 5000 });
  await act(rich, "sync"); await stand(rich, "lobby", 4, 4);
  let posted = 0;
  for (let i = 0; i < 25; i++) { const r = await act(rich, "flipPost", { stake: 50, side: "heads" }); if (!r.ok) break; posted++; await act(rich, "flipCancel", { id: r.data.id }); }
  check("flips count against the 1000 per 24 hours limit (20 x 50)", posted === 20, String(posted));
}
console.log(`
${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
