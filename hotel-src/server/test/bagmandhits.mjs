// Bagmand's own bounties: 2 to 5 hits of 300-500 on players with over 1000 blood, rooms that open for the wanted, claimed with a gun
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/bagmandhits.mjs (server/)
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
const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;
const putPresence = (u, room) => owner("PUT", `presence/${u.uid}`, { name: u.name, room, seen: Date.now(), since: Date.now() });
const readAs = (who, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${who.token}`).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const clear = async () => { for (const p of ["hits", "wantedUsers", "wantedRooms", "bagmandHits", "bagmand", "roles"]) await owner("DELETE", p); await owner("DELETE", "rooms/lobby/events"); };
const here = (u, room, x, y) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const pres = (u, x = 3, y = 3) => ({ name: u.name, figure: "x", x, y, dir: 2 });

const dropTestPresence = async () => { // (test accounts of earlier runs (of this and other suites) are still "online" for 3 minutes: they would be picked)
  const all = (await owner("GET", "presence")) ?? {};
  for (const [uid, p] of Object.entries(all)) if (typeof p?.name === "string" && p.name.startsWith("t_")) await owner("DELETE", `presence/${uid}`);
};
await dropTestPresence();
console.log("--- who gets picked");
await clear();
await owner("PUT", "bagmand/force", 1); await owner("PUT", "bagmand/hitsNow", true); // (the local emulator only: bagmand is always here and the next hit is always due)
const rich = await fresh("t_bh_rich", { blood: 2000 });
const poor = await fresh("t_bh_poor", { blood: 500 });
const mod = await fresh("t_bh_mod", { blood: 5000 });
const marked = await fresh("t_bh_marked", { blood: 3000 });
const other = await fresh("t_bh_other", { blood: 100 });
for (const u of [rich, poor, mod, marked, other]) await act(u, "sync");
await owner("PUT", `roles/${mod.uid}`, "mod");
await owner("PUT", `roomsMeta/u_${rich.uid}`, { owner: rich.uid, ownerName: "rich", name: "private", access: "none", w: 8, h: 8 });
await putPresence(rich, `u_${rich.uid}`);
for (const u of [poor, mod, marked, other]) await putPresence(u, "lobby");
{ // the person at the keyboard of the local game (hbboss) may be online with plenty of blood: put a hit on them for this test, so that only the accounts made here can be picked
  const dev = await owner("GET", "usernames/hbboss");
  if (typeof dev === "string") await owner("PUT", "hits/blockdev", { target: dev, targetName: "hbboss", amount: 400, by: "x", byName: "x", hideout: "", hideoutName: "x", at: Date.now() });
}
await owner("PUT", "hits/old", { target: marked.uid, targetName: "marked", amount: 400, by: "x", byName: "x", hideout: "", hideoutName: "x", at: Date.now() });
bad("a bad room name is refused", await act(rich, "bountyShow", { room: "no spaces" }));
const nope = await act(rich, "bountyShow", { room: "lobby" });
ok("bountyShow for somebody who isn't wanted does nothing", nope);
check("it says so", nope.data?.wanted === false, JSON.stringify(nope.data));
check("a stranger can't walk into rich's private room yet", refused(await clientWrite(other, `rooms/u_${rich.uid}/players/${other.uid}`, pres(other))));
const t1 = await act(other, "bagmandHitTick");
ok("a tick puts a hit out", t1);
check("on the only one who fits (over 1000 blood, not a mod, no hit on them already)", t1.data?.placed === 1 && t1.data?.target === rich.uid, JSON.stringify(t1.data));
const hits = Object.entries((await owner("GET", "hits")) ?? {}).filter(([k]) => k !== "old" && k !== "blockdev");
const [hid, hit] = hits[0] ?? [];
check("the hit is on the board: 300-500, by bagmand, with a time limit", hits.length === 1 && hit.by === "bagmand" && hit.bagmand === true && hit.amount >= 300 && hit.amount <= 500 && hit.amount % 10 === 0 && hit.until > Date.now() + 3_000_000 && hit.target === rich.uid, JSON.stringify(hit));
check("the wanted player is noted, with the room they stand in", (await owner("GET", `wantedUsers/${rich.uid}`))?.hit === hid && (await owner("GET", `wantedUsers/${rich.uid}`))?.room === `u_${rich.uid}`);
check("and the room is on the list of open rooms", (await owner("GET", `wantedRooms/u_${rich.uid}`))?.uid === rich.uid);
const evs = Object.values((await owner("GET", "rooms/lobby/events")) ?? {}).filter((e) => e.type === "bagmandSay");
check("bagmand says it in the basement's chat", evs.length === 1 && evs[0].text.includes(String(hit.amount)) && evs[0].text.includes("t_bh_rich"), JSON.stringify(evs));
check("the hit is readable by everybody (the board shows it)", (await readAs(other, "hits")).status === 200);
check("wantedUsers is only for the one it is about", (await readAs(rich, `wantedUsers/${rich.uid}`)).status === 200 && (await readAs(other, `wantedUsers/${rich.uid}`)).status !== 200);

console.log("--- a wanted player can't hide");
check("now anybody can walk into their private room", !refused(await clientWrite(other, `rooms/u_${rich.uid}/players/${other.uid}`, pres(other))));
check("and read what is going on in it", (await readAs(other, `rooms/u_${rich.uid}`)).status === 200);
check("the wanted player can't stand in a room they haven't said", refused(await clientWrite(rich, `rooms/lobby/players/${rich.uid}`, pres(rich, 4, 4))));
ok("they say they go to the basement", await act(rich, "bountyShow", { room: "lobby" }));
check("then they can", !refused(await clientWrite(rich, `rooms/lobby/players/${rich.uid}`, pres(rich, 4, 4))));
check("the room they left closes again", (await owner("GET", `wantedRooms/u_${rich.uid}`)) === null && refused(await clientWrite(poor, `rooms/u_${rich.uid}/players/${poor.uid}`, pres(poor))));
check("and the basement is the open one now", (await owner("GET", "wantedRooms/lobby"))?.uid === rich.uid);
check("leaving a room is always allowed", !refused(await clientWrite(rich, `rooms/lobby/players/${rich.uid}`, null)));

console.log("--- claiming it");
{
  const shooter = await fresh("t_bh_shooter", { blood: 10, inventory: inv({ item: "gun", qty: 1 }) });
  await act(shooter, "sync");
  await here(shooter, "lobby", 3, 3);
  await here(rich, "lobby", 5, 3);
  const before = Number(await owner("GET", `users/${shooter.uid}/blood`)) || 0;
  const sh = await act(shooter, "gunShoot", { room: "lobby", target: rich.uid, slot: 0 });
  ok("a gun claims the hit", sh);
  check("the shooter gets the bounty", sh.data?.bounty === hit.amount && (Number(await owner("GET", `users/${shooter.uid}/blood`)) || 0) === before + hit.amount, JSON.stringify(sh.data));
  check("it is off the board and the rooms close", (await owner("GET", `hits/${hid}`)) === null && (await owner("GET", `wantedUsers/${rich.uid}`)) === null && (await owner("GET", "wantedRooms/lobby")) === null);
}

console.log("--- never twice, and 2 to 5 in a visit");
await clear();
await owner("PUT", "bagmand/force", 1); await owner("PUT", "bagmand/hitsNow", true);
await owner("PUT", `roles/${mod.uid}`, "mod");
await putPresence(mod, "lobby"); await putPresence(poor, "lobby");
const crowd = [];
for (let i = 0; i < 8; i++) { const u = await fresh(`t_bh_c${i}`, { blood: 1500 + i }); await act(u, "sync"); await putPresence(u, "lobby"); crowd.push(u); }
const placed = [];
for (let i = 0; i < 8; i++) { const r = await act(crowd[0], "bagmandHitTick"); if (r.data?.placed === 1) placed.push(r.data.target); else break; }
check("2 to 5 hits in a visit", placed.length >= 2 && placed.length <= 5, String(placed.length));
check("never the same player twice", new Set(placed).size === placed.length);
check("never the poor or the mod", placed.every((u) => u !== mod.uid && u !== poor.uid));
const after = await act(crowd[0], "bagmandHitTick");
check("then no more in that visit", after.data?.placed === 0 && after.data?.done === true, JSON.stringify(after.data));
check("the number of hits on the board is the number placed", Object.keys((await owner("GET", "hits")) ?? {}).length === placed.length);

console.log("--- the plan and the clock");
await clear();
await owner("PUT", "bagmand/force", 1); // (no hitsNow: the real schedule, 5 minutes in at the earliest)
const start = Math.floor(Date.now() / 3_600_000) * 3_600_000;
const early = await act(crowd[0], "bagmandHitTick");
if (Date.now() - start < 5 * 60_000) check("nothing in the first 5 minutes", early.data?.placed === 0);
else console.log("   (past the first 5 minutes of this hour: that check is skipped)");
await owner("PUT", `bagmandHits/${start}`, { placed: 99 });
check("a visit whose plan is used up puts out nothing", (await act(crowd[0], "bagmandHitTick")).data?.placed === 0);

console.log("--- a hit that ran out");
await clear();
await owner("PUT", "bagmand/force", 1); await owner("PUT", "bagmand/hitsNow", true);
await owner("PUT", `bagmandHits/${start}`, { placed: 99 });
await owner("PUT", "hits/gone", { target: crowd[1].uid, targetName: "c1", amount: 400, by: "bagmand", byName: "Bagmand", hideout: "", hideoutName: "Bagmand", at: Date.now() - 4_000_000, bagmand: true, until: Date.now() - 1000 });
await owner("PUT", `wantedUsers/${crowd[1].uid}`, { until: Date.now() - 1000, hit: "gone", room: "lobby" });
await owner("PUT", "wantedRooms/lobby", { uid: crowd[1].uid, until: Date.now() - 1000 });
{
  const sh2 = await fresh("t_bh_sh2", { blood: 10, inventory: inv({ item: "gun", qty: 1 }) });
  await act(sh2, "sync");
  await here(sh2, "lobby", 3, 3);
  await here(crowd[1], "lobby", 5, 3);
  bad("a hit that ran out can't be claimed (the gun is kept)", await act(sh2, "gunShoot", { room: "lobby", target: crowd[1].uid, slot: 0 }));
}
await act(crowd[0], "bagmandHitTick");
check("the tick takes it down", (await owner("GET", "hits/gone")) === null && (await owner("GET", `wantedUsers/${crowd[1].uid}`)) === null && (await owner("GET", "wantedRooms/lobby")) === null);
await owner("DELETE", "bagmand"); await owner("DELETE", "bagmandHits"); await owner("DELETE", "roles"); await owner("DELETE", "hits"); await owner("DELETE", "wantedUsers"); await owner("DELETE", "wantedRooms");
await dropTestPresence();

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
