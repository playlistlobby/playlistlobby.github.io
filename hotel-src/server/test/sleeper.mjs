// A player with a hit on them who logs out is asleep in their own room: the room is open to everybody while the hit lasts, and the gun works on the sleeper
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/sleeper.mjs (server/)
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
const client = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 220));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 220));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "x", blood: 0, createdAt: Date.now() - 3_600_000, ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  return u;
};
const allowed = (r) => r.status === 200;

const gun = { 0: { item: "gun", qty: 1 } };
const hunter = await fresh("t_sl_hunter", { blood: 100, inventory: gun });
const hunter2 = await fresh("t_sl_hunter2", { blood: 100, inventory: gun });
const sleeper = await fresh("t_sl_sleeper", { blood: 2000 });
const ROOM = `u_${sleeper.uid}`;
for (const u of [hunter, hunter2, sleeper]) await act(u, "sync");
await owner("PUT", `roomsMeta/${ROOM}`, { owner: sleeper.uid, ownerName: "sleeper", name: "sleeper's room", access: "none", w: 8, h: 8 });
await owner("DELETE", `presence/${sleeper.uid}`); await owner("DELETE", `hitTargets/${sleeper.uid}`); await owner("DELETE", `hits`); await owner("DELETE", `rooms/${ROOM}`);
const hunterPresence = { name: "t_sl_hunter", figure: "x", x: 3, y: 3, dir: 2, ts: Date.now() };

console.log("--- the room of a player without a hit is closed");
check("a stranger can't walk into the room of somebody who is offline", !allowed(await client(hunter, `rooms/${ROOM}/players/${hunter.uid}`, hunterPresence)));

console.log("--- a hit on them opens it (while they are offline)");
await owner("PUT", `hits/hsleep1`, { target: sleeper.uid, targetName: "sleeper", amount: 400, by: "someone", byName: "someone", hideout: "x", hideoutName: "x", at: Date.now() });
await owner("PUT", `hitTargets/${sleeper.uid}/until`, Date.now() + 3_600_000);
check("now the hunter can walk in", allowed(await client(hunter, `rooms/${ROOM}/players/${hunter.uid}`, hunterPresence)));
await owner("PUT", `presence/${sleeper.uid}`, { name: "sleeper", room: ROOM, seen: Date.now(), sid: "x" });
check("but not while the target is online in there (the rules close it again)", !allowed(await client(hunter2, `rooms/${ROOM}/players/${hunter2.uid}`, { ...hunterPresence, name: "t_sl_hunter2" })));
await owner("DELETE", `presence/${sleeper.uid}`);

console.log("--- the gun works on the sleeper");
const before = Number(await owner("GET", `users/${sleeper.uid}/blood`));
const shot = await act(hunter, "gunShoot", { room: ROOM, target: sleeper.uid, slot: 0 });
ok("the hunter shoots the sleeper", shot);
check("and collects the bounty", shot.data.bounty === 400 && (await act(hunter, "sync")).state.blood >= 500, JSON.stringify(shot.data));
check("the sleeper loses blood", Number(await owner("GET", `users/${sleeper.uid}/blood`)) < before);
check("the hit is gone and the room closes again", (await owner("GET", `hits/hsleep1`)) === null && (await owner("GET", `hitTargets/${sleeper.uid}`)) === null);
check("so nobody else can walk in any more", !allowed(await client(hunter2, `rooms/${ROOM}/players/${hunter2.uid}`, { ...hunterPresence, name: "t_sl_hunter2" })));

console.log("--- no hit, no shot");
await owner("PUT", `rooms/${ROOM}/players/${hunter2.uid}`, { name: "t_sl_hunter2", figure: "x", x: 3, y: 3, dir: 2 });
bad("a sleeper with no bounty can't be shot", await act(hunter2, "gunShoot", { room: ROOM, target: sleeper.uid, slot: 0 }));
await owner("PUT", `hits/hsleep2`, { target: sleeper.uid, targetName: "sleeper", amount: 300, by: "someone", byName: "someone", hideout: "x", hideoutName: "x", at: Date.now() });
await owner("PUT", `presence/${sleeper.uid}`, { name: "sleeper", room: "lobby", seen: Date.now(), sid: "x" });
bad("and one who is online somewhere else has left the room: no shot", await act(hunter2, "gunShoot", { room: ROOM, target: sleeper.uid, slot: 0 }));

for (const u of [hunter, hunter2, sleeper]) { await owner("DELETE", `rooms/${ROOM}/players/${u.uid}`); }
await owner("DELETE", `hits`); await owner("DELETE", `presence/${sleeper.uid}`); await owner("DELETE", `hitTargets/${sleeper.uid}`); await owner("DELETE", `roomsMeta/${ROOM}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
