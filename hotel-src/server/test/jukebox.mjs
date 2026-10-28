// The basement's jukebox: you pick a CD and pay 50 blood to have it played (the room's CD player, one at a time); the CD is loaned until it has finished.
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/jukebox.mjs (server/)
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
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 220));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 220));
const blood = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const fresh = async (name, extra) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "x", createdAt: Date.now() - 3_600_000, ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  for (const r of ["lobby", "shop"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
  return u;
};
const stand = (u, room) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x: 3, y: 3, dir: 2 });

const rich = await fresh("t_jb_rich", { blood: 120, inventory: { 0: { item: "cd", qty: 1 }, 1: { item: "cd_green", qty: 1 } } });
const poor = await fresh("t_jb_poor", { blood: 49, inventory: { 0: { item: "cd", qty: 1 } } });
await owner("DELETE", "rooms/lobby/cdplayer");

console.log("--- paying for the jukebox");
await stand(poor, "lobby");
bad("49 blood is not enough", await act(poor, "cdInsert", { slot: 0, room: "lobby", durationMs: 60_000, jukebox: true }));
check("and nothing was taken, the CD is still in the pocket", (await blood(poor)) === 49 && !(await owner("GET", `users/${poor.uid}/inventory/0/inPlayer`)));
await stand(rich, "lobby");
ok("a CD for 50 blood", await act(rich, "cdInsert", { slot: 0, room: "lobby", durationMs: 60_000, jukebox: true }));
check("50 blood paid", (await blood(rich)) === 70, String(await blood(rich)));
check("the room's player plays it and the CD is loaned", (await owner("GET", "rooms/lobby/cdplayer/by")) === rich.uid && (await owner("GET", `users/${rich.uid}/inventory/0/inPlayer`)) === "lobby");
bad("one at a time: the second CD is refused", await act(rich, "cdInsert", { slot: 1, room: "lobby", durationMs: 60_000, jukebox: true }));
check("and costs nothing", (await blood(rich)) === 70);
await owner("DELETE", "rooms/lobby/cdplayer");
await owner("DELETE", `rooms/lobby/players/${rich.uid}`);
await stand(rich, "shop");
bad("the jukebox is in the basement only", await act(rich, "cdInsert", { slot: 1, room: "lobby", durationMs: 60_000, jukebox: true }));
await owner("DELETE", `rooms/shop/players/${rich.uid}`);
await owner("DELETE", `rooms/lobby/players/${poor.uid}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
