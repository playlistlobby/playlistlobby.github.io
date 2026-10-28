// An upgraded mixer and a pot with a waterer keep their upgrade through every way of moving them, and watering cans stack and fill one at a time.
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/carry-upgrades.mjs (server/)
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

const u = await account("t_cu_a");
await owner("PUT", `users/${u.uid}`, { name: "t_cu_a", gender: "M", figure: "x", createdAt: Date.now() - 3_600_000, blood: 100, inventory: {} });
await owner("PUT", `profiles/${u.uid}`, { name: "t_cu_a", figure: "x" });
const room = `u_${u.uid}`;
await owner("PUT", `rooms/${room}/players/${u.uid}`, { name: "t_cu_a", figure: "x", x: 3, y: 3, dir: 2 });
await owner("DELETE", `roomsMeta/${room}/furni`);
const rows = async () => Object.entries((await owner("GET", `roomsMeta/${room}/furni`)) ?? {});
const inv = async () => Object.values((await owner("GET", `users/${u.uid}/inventory`)) ?? {}).filter(Boolean);

console.log("--- an upgraded mixer through the pocket and through storage");
await owner("PUT", `roomsMeta/${room}/furni/m1`, { kind: "f_mixer", x: 4, y: 4, up: 2 });
ok("into the pocket", await act(u, "furniStore", { room, id: "m1", to: "pocket" }));
check("the pocket holds an MK2 mixer", (await inv()).some((s) => s.item === "f_mixer_up2"), JSON.stringify(await inv()));
ok("put down from the pocket", await act(u, "furniPlace", { room, source: "inv", slot: 0, x: 5, y: 5 }));
check("it is a mixer with up 2", (await rows()).some(([, r]) => r.kind === "f_mixer" && r.up === 2 && r.x === 5), JSON.stringify(await rows()));
const id1 = (await rows()).find(([, r]) => r.kind === "f_mixer")[0];
ok("into storage", await act(u, "furniStore", { room, id: id1 }));
check("storage holds an MK2 mixer", (await owner("GET", `users/${u.uid}/storage/f_mixer_up2`)) === 1);
ok("out of storage", await act(u, "furniPlace", { room, source: "storage", kind: "f_mixer_up2", x: 6, y: 6 }));
check("still up 2", (await rows()).some(([, r]) => r.kind === "f_mixer" && r.up === 2 && r.x === 6));
await owner("DELETE", `roomsMeta/${room}/furni`);

console.log("--- a pot with a waterer");
await owner("PUT", `roomsMeta/${room}/furni/p1`, { kind: "f_planter", x: 4, y: 4, auto: true });
ok("into the pocket", await act(u, "furniStore", { room, id: "p1", to: "pocket" }));
ok("put down", await act(u, "furniPlace", { room, source: "inv", slot: 0, x: 5, y: 5 }));
check("still automatic", (await rows()).some(([, r]) => r.kind === "f_planter" && r.auto === true));
await owner("DELETE", `roomsMeta/${room}/furni`);

console.log("--- watering cans stack in pockets and in the stash");
await owner("PUT", `users/${u.uid}/inventory`, { 0: { item: "wateringcan", qty: 1 }, 1: { item: "wateringcan", qty: 1 }, 2: { item: "wateringcan", qty: 1 } });
ok("one can into the stash", await act(u, "stashStore", { slot: 0 }));
ok("another", await act(u, "stashStore", { slot: 0 }));
check("the stash counts 2", (await owner("GET", `users/${u.uid}/stash/wateringcan`)) === 2);
ok("both back out", await act(u, "stashTake", { key: "wateringcan", qty: 2 }));
const cans = (await inv()).filter((s) => s.item === "wateringcan");
check("all three cans are there in one stack", cans.reduce((n, s) => n + s.qty, 0) === 3 && cans.length === 1, JSON.stringify(cans));
await owner("PUT", `rooms/lobby/players/${u.uid}`, { name: "t_cu_a", figure: "x", x: 3, y: 3, dir: 2 });
ok("the sink fills one", await act(u, "fillCan", { room: "lobby", slot: (await owner("GET", `users/${u.uid}/inventory`)).findIndex((s) => s && s.item === "wateringcan") }));
const after = await inv();
check("two empty, one full", after.filter((s) => s.item === "wateringcan").reduce((n, s) => n + s.qty, 0) === 2 && after.filter((s) => s.item === "wateringcan_full").reduce((n, s) => n + s.qty, 0) === 1, JSON.stringify(after));
await owner("DELETE", `rooms/lobby/players/${u.uid}`);
await owner("DELETE", `rooms/${room}/players/${u.uid}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
