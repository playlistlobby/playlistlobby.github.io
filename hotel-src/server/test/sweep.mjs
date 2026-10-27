// Ghosts in rooms: entries of players who are gone (or online in another room) are swept away; the ones who are really there stay
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/sweep.mjs (server/)
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
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 160));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 160));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  return u;
};
const entry = (u, ts) => ({ name: u.name, figure: "x", x: 3, y: 3, dir: 2, ...(ts === undefined ? {} : { ts }) });
const pres = (u, room, ago = 0) => owner("PUT", `presence/${u.uid}`, { name: u.name, room, seen: Date.now() - ago, since: Date.now() - ago });
const there = async (room, u) => (await owner("GET", `rooms/${room}/players/${u.uid}`)) !== null;

console.log("--- sweeping a room");
const R = "u_sweeptest";
await owner("DELETE", `rooms/${R}`);
const me = await fresh("t_sw_me");
const here = await fresh("t_sw_here"), moved = await fresh("t_sw_moved"), loggedOut = await fresh("t_sw_out"), silent = await fresh("t_sw_silent"), fresh1 = await fresh("t_sw_new"), nap = await fresh("t_sw_nap"), noTs = await fresh("t_sw_nots");
await act(me, "sync");
const old = Date.now() - 2 * 86_400_000;
await owner("PUT", `rooms/${R}/players/${me.uid}`, entry(me, old));
await owner("PUT", `rooms/${R}/players/${here.uid}`, entry(here, old)); await pres(here, R);
await owner("PUT", `rooms/${R}/players/${moved.uid}`, entry(moved, old)); await pres(moved, "h_somewhere");
await owner("PUT", `rooms/${R}/players/${loggedOut.uid}`, entry(loggedOut, old)); await owner("DELETE", `presence/${loggedOut.uid}`);
await owner("PUT", `rooms/${R}/players/${silent.uid}`, entry(silent, old)); await pres(silent, R, 3 * 3_600_000);
await owner("PUT", `rooms/${R}/players/${fresh1.uid}`, entry(fresh1, Date.now() - 2000)); await pres(fresh1, "lobby");
await owner("PUT", `rooms/${R}/players/${nap.uid}`, entry(nap, old)); await pres(nap, R, 8 * 60_000); // (a phone put down 8 minutes ago: not gone)
await owner("PUT", `rooms/${R}/players/${noTs.uid}`, entry(noTs)); await pres(noTs, "lobby");
bad("a bad room name is refused", await act(me, "roomSweep", { room: "no spaces" }));
const r = await act(me, "roomSweep", { room: R });
ok("sweep", r);
check("three ghosts removed (online elsewhere, logged out, silent for hours) and the entry without a time that is elsewhere", r.data?.removed === 4, JSON.stringify(r.data));
check("somebody really there stays", await there(R, here));
check("somebody who moved to another room is gone from this one", !(await there(R, moved)));
check("somebody with no presence at all is gone", !(await there(R, loggedOut)));
check("somebody silent for hours is gone", !(await there(R, silent)));
check("somebody who has only just walked in is left alone", await there(R, fresh1));
check("a phone put down for 8 minutes stays", await there(R, nap));
check("an old entry without a time is judged like any other", !(await there(R, noTs)));
check("the one who asks is never swept", await there(R, me));
const r2 = await act(me, "roomSweep", { room: R });
check("a second sweep finds nothing", r2.data?.removed === 0, JSON.stringify(r2.data));
const empty = await act(me, "roomSweep", { room: "u_nobodyhere" });
ok("an empty room is fine", empty);
await owner("DELETE", `rooms/${R}`);
for (const u of [here, moved, loggedOut, silent, fresh1, nap, noTs]) await owner("DELETE", `presence/${u.uid}`);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
