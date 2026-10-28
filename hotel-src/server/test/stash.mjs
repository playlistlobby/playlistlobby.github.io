// The stash box is in every room (free, nothing to buy) and the remote bank in the arrival room opens the same one.
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/stash.mjs (server/)
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

const u = await account("t_stash");
await owner("PUT", `users/${u.uid}`, { name: "t_stash", gender: "M", figure: "x", blood: 100, createdAt: Date.now() - 3_600_000, inventory: { 0: { item: "weed", qty: 9 }, 1: { item: "knife", qty: 1 } } });
await owner("PUT", `profiles/${u.uid}`, { name: "t_stash", figure: "x" });
const ROOM = `u_${u.uid}`;
await owner("PUT", `roomsMeta/${ROOM}`, { owner: u.uid, ownerName: "t_stash", name: "t_stash's room", access: "none", w: 8, h: 8 });
for (const r of ["lobby", "arrival", "streets", ROOM]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
const stand = (room, x = 3, y = 3) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: "t_stash", figure: "x", x, y, dir: 2 });

console.log("--- everybody has a stash box");
bad("not placed from the lobby", await act(u, "stashEnsure"));
await stand(ROOM);
const e1 = await act(u, "stashEnsure");
ok("the server puts one in a room that has none", e1);
const spot = await owner("GET", `roomsMeta/${ROOM}/stashbox`);
check("against a wall", e1.data.placed === true && spot && (spot.x === 0 || spot.y === 0 || spot.x === 7 || spot.y === 7), JSON.stringify(spot));
check("asking again changes nothing", (await act(u, "stashEnsure")).data.placed === false && JSON.stringify(await owner("GET", `roomsMeta/${ROOM}/stashbox`)) === JSON.stringify(spot));
ok("it can be used without buying anything", await act(u, "stashStore", { slot: 0, qty: 4 }));
check("4 weed are in the box, 5 in the pocket", (await owner("GET", `users/${u.uid}/stash/weed`)) === 4 && (await owner("GET", `users/${u.uid}/inventory/0/qty`)) === 5);

console.log("--- the remote bank in the arrival room");
await owner("DELETE", `rooms/${ROOM}/players/${u.uid}`);
bad("not from the lobby", await (async () => { await stand("lobby"); return act(u, "stashTake", { key: "weed", qty: 1 }); })());
await owner("DELETE", `rooms/lobby/players/${u.uid}`);
await stand("arrival", 5, 2);
ok("take from the box at the bank", await act(u, "stashTake", { key: "weed", qty: 3 }));
ok("put in at the bank", await act(u, "stashStore", { slot: 0, qty: 2 }));
check("the same box", (await owner("GET", `users/${u.uid}/stash/weed`)) === 3, String(await owner("GET", `users/${u.uid}/stash/weed`)));
await owner("DELETE", `rooms/arrival/players/${u.uid}`);
await stand("streets", 5, 5);
bad("and not on the street", await act(u, "stashStore", { slot: 0, qty: 1 }));
await owner("DELETE", `rooms/streets/players/${u.uid}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
