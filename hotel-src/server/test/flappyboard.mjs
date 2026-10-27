// Flappy Bird scoreboard test:  the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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

console.log("--- the flappy bird scoreboard");
{
  const u = await fresh("t_fbscore", { blood: 0 });
  await act(u, "sync");
  await owner("DELETE", `flappyBoard/${u.uid}`); await owner("DELETE", `flappyRun/${u.uid}`);
  bad("not in the basement: no run", await act(u, "flappyStart"));
  await stand(u, "lobby", 3, 3);
  bad("a score without a run", await act(u, "flappyScore", { score: 3 }));
  ok("start a run", await act(u, "flappyStart"));
  bad("a score that doesn't fit the time the run took", await act(u, "flappyScore", { score: 40 }));
  bad("the run is used up by that try", await act(u, "flappyScore", { score: 1 }));
  ok("start another run", await act(u, "flappyStart"));
  await new Promise((r) => setTimeout(r, 4200));
  const r1 = await act(u, "flappyScore", { score: 3 });
  ok("a possible score", r1);
  check("it is the best so far", r1.data?.improved === true && r1.data?.best === 3, JSON.stringify(r1.data));
  const row = await owner("GET", `flappyBoard/${u.uid}`);
  check("it is on the board with the name", row?.score === 3 && row?.name === "t_fbscore", JSON.stringify(row));
  ok("start a third run", await act(u, "flappyStart"));
  await new Promise((r) => setTimeout(r, 1500));
  const r2 = await act(u, "flappyScore", { score: 1 });
  check("a lower score doesn't replace the best", r2.ok && r2.data?.improved === false && (await owner("GET", `flappyBoard/${u.uid}/score`)) === 3, JSON.stringify(r2.data));
}
{
  console.log("--- the admin takes a score off the board");
  const victim = await account("t_fbvictim");
  await owner("PUT", `flappyBoard/${victim.uid}`, { name: "t_fbvictim", score: 99, at: Date.now() });
  const boss = await account("t_fbadmin");
  await owner("PUT", `roles/${boss.uid}`, "admin");
  bad("an ordinary player can't remove a score", await act(victim, "flappyRemove", { uid: victim.uid }));
  check("the score is still there", (await owner("GET", `flappyBoard/${victim.uid}/score`)) === 99);
  ok("the admin removes it", await act(boss, "flappyRemove", { uid: victim.uid }));
  check("the score is gone", (await owner("GET", `flappyBoard/${victim.uid}`)) === null);
  console.log("--- banned from Flappy Bird (only from the game)");
  await stand(victim, "lobby", 3, 3);
  ok("not banned yet: can play", await act(victim, "flappyStart"));
  ok("the admin bans them from it", await act(boss, "flappyRemove", { uid: victim.uid, ban: true }));
  check("the ban is written", (await owner("GET", `flappyBans/${victim.uid}`)) === true);
  bad("they can't start a run", await act(victim, "flappyStart"));
  bad("and no score counts", await act(victim, "flappyScore", { score: 1 }));
  ok("the admin lets them back", await act(boss, "flappyRemove", { uid: victim.uid, ban: false }));
  ok("they can play again", await act(victim, "flappyStart"));
  await owner("DELETE", `flappyBoard/${victim.uid}`);
}
console.log(`
${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
