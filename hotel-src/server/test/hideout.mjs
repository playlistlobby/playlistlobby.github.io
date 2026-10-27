// Hideout tests: buying, sizes and colours, invites, build rights and the lock, the shared box, pots and mixers for every member, orders, kicks, rules
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


const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const readAs = (who, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${who.token}`).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const refused = (r) => r.status === 401 || r.status === 403;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HR = (u) => `h_${u.uid}`;
const meta = (u) => owner("GET", `roomsMeta/${HR(u)}`);
const giveName = (u) => owner("PUT", `usernames/${u.name.toLowerCase()}`, u.uid);
const rowsOf = async (u) => Object.entries((await owner("GET", `roomsMeta/${HR(u)}/furni`)) ?? {});

console.log("--- buying a hideout");
const boss = await fresh("t_hd_boss", { blood: 8000, inventory: inv({ item: "f_rareblock", qty: 3 }, { item: "f_planter", qty: 1 }, { item: "f_mixer", qty: 1 }, { item: "weedseed", qty: 2 }, { item: "f_randomizer", qty: 1 }) });
const poor = await fresh("t_hd_poor", { blood: 749 });
for (const u of [boss, poor]) { await act(u, "sync"); await giveName(u); }
await owner("DELETE", `roomsMeta/${HR(boss)}`); await owner("DELETE", `hideouts/${boss.uid}`);
bad("not from the shop room", await act(boss, "hideoutBuy"));
await stand(boss, "lobby", 3, 3); await stand(poor, "lobby", 3, 4);
bad("749 blood is not enough", await act(poor, "hideoutBuy"));
const b = await act(boss, "hideoutBuy");
ok("buy a hideout", b);
check("750 blood", b.state.blood === 7250);
let m = await meta(boss);
check("14x14, level 0, closed to everybody but its members", m && m.w === 14 && m.h === 14 && m.level === 0 && m.access === "none" && m.owner === boss.uid, JSON.stringify(m)?.slice(0, 200));
check("with a toolbox, a sink, a boombox, a computer and a stash", m.toolbox && m.sink && m.boombox && m.computer && m.chest);
check("and the owner is on the list of hideouts they are in", (await owner("GET", `hideouts/${boss.uid}/${boss.uid}`))?.role === "owner");
bad("only one each", await act(boss, "hideoutBuy"));

console.log("--- sizes and colours");
ok("first upgrade (2000)", await act(boss, "hideoutUpgrade"));
m = await meta(boss);
check("17x17", m.w === 17 && m.h === 17 && m.level === 1 && (await bloodOf(boss)) === 5250, JSON.stringify([m.w, m.level, await bloodOf(boss)]));
ok("second upgrade (4000)", await act(boss, "hideoutUpgrade"));
m = await meta(boss);
check("20x20", m.w === 20 && m.h === 20 && m.level === 2 && (await bloodOf(boss)) === 1250);
bad("no third", await act(boss, "hideoutUpgrade"));
const col = await act(boss, "hideoutColors", { floor: "#112233", wall: "#445566" });
ok("new floor and wall colours", col);
check("30 drops a part", col.data.price === 60 && (await bloodOf(boss)) === 1190, JSON.stringify(col.data));
bad("the same colours again is nothing", await act(boss, "hideoutColors", { floor: "#112233", wall: "#445566" }));
bad("nobody else changes them", await act(poor, "hideoutColors", { floor: "#aa0000" }));
await owner("PUT", `users/${boss.uid}/blood`, 5000);
await stand(boss, HR(boss), 5, 5);
ok("rename (from the computer, inside)", await act(boss, "hideoutSettings", { name: "Gang HQ" }));
check("the name changed", (await owner("GET", `roomsMeta/${HR(boss)}/name`)) === "Gang HQ");

console.log("--- members and invites");
const al = await fresh("t_hd_al", { blood: 500, inventory: inv({ item: "f_rareblock", qty: 2 }, { item: "weedseed", qty: 1 }, { item: "wateringcan_full", qty: 1 }, { item: "f_planter", qty: 1 }) });
const bo = await fresh("t_hd_bo", { blood: 500, inventory: inv({ item: "f_rareblock", qty: 1 }, { item: "wateringcan_full", qty: 1 }, { item: "weed", qty: 2 }, { item: "cigarette", qty: 2 }) });
const out = await fresh("t_hd_out", { blood: 500, inventory: inv({ item: "f_rareblock", qty: 1 }) });
for (const u of [al, bo, out]) { await act(u, "sync"); await giveName(u); }
bad("a stranger can't invite", await act(al, "hideoutInvite", { name: boss.name }));
ok("invite by name", await act(boss, "hideoutInvite", { name: "T_HD_AL" }));
check("the invite waits for al", (await owner("GET", `hideoutInvites/${al.uid}/${boss.uid}`))?.fromName === boss.name);
bad("not you", await act(boss, "hideoutInvite", { name: boss.name }));
bad("not nobody", await act(boss, "hideoutInvite", { name: "nobody_here_x" }));
const inRoom = () => rowsOf(boss);
const ans = await act(al, "hideoutAnswer", { owner: boss.uid, accept: true });
ok("al joins", ans);
m = await meta(boss);
check("al is a member who may build", m.members?.[al.uid]?.build === true);
check("and has it in their list", (await owner("GET", `hideouts/${al.uid}/${boss.uid}`))?.role === "member");
check("the invite is gone", (await owner("GET", `hideoutInvites/${al.uid}/${boss.uid}`)) === null);
bad("no second answer", await act(al, "hideoutAnswer", { owner: boss.uid, accept: true }));
ok("invite bo", await act(boss, "hideoutInvite", { uid: bo.uid }));
ok("bo says no", await act(bo, "hideoutAnswer", { owner: boss.uid, accept: false }));
check("bo is not a member", !(await meta(boss)).members?.[bo.uid]);
ok("invite bo again", await act(boss, "hideoutInvite", { uid: bo.uid }));
ok("bo joins", await act(bo, "hideoutAnswer", { owner: boss.uid, accept: true }));
const found = await act(boss, "hideoutSearch", { q: "t_hd_" });
check("search finds players by the start of their name", found.ok && found.data.players.some((p) => p.uid === al.uid) && found.data.players.some((p) => p.uid === out.uid), JSON.stringify(found).slice(0, 200));

console.log("--- building together");
await stand(al, HR(boss), 6, 6); await stand(bo, HR(boss), 7, 7);
bad("a stranger can't place", await (async () => { await stand(out, HR(boss), 8, 8); return act(out, "furniPlace", { room: HR(boss), source: "inv", slot: 0, x: 3, y: 3 }); })());
await owner("DELETE", `rooms/${HR(boss)}/players/${out.uid}`);
const p1 = await act(al, "furniPlace", { room: HR(boss), source: "inv", slot: slotOf(await state(al), "f_rareblock"), x: 3, y: 3, dir: 0 });
ok("a member places a piece", p1);
let rows = await rowsOf(boss);
check("it is marked as al's", rows.length === 1 && rows[0][1].by === al.uid, JSON.stringify(rows));
let rowId = rows[0][0];
ok("another member moves it", await act(bo, "furniMove", { room: HR(boss), id: rowId, x: 4, y: 4, dir: 0 }));
ok("and the owner too", await act(boss, "furniMove", { room: HR(boss), id: rowId, x: 15, y: 15, dir: 0 }));
check("(the room is big: 20x20 now)", (await owner("GET", `roomsMeta/${HR(boss)}/furni/${rowId}/x`)) === 15);
ok("bo puts it back", await act(bo, "furniStore", { room: HR(boss), id: rowId }));
check("it went into the box, still al's", (await owner("GET", `roomsMeta/${HR(boss)}/box/${al.uid}/f_rareblock`)) === 1 && (await rowsOf(boss)).length === 0);
bad("bo can't take al's piece out", await act(bo, "hideoutBoxTake", { room: HR(boss), kind: "f_rareblock" }));
const p2 = await act(bo, "furniPlace", { room: HR(boss), source: "box", owner: al.uid, kind: "f_rareblock", x: 5, y: 5 });
ok("bo places it from the box", p2);
rows = await rowsOf(boss);
check("it is still al's", rows.length === 1 && rows[0][1].by === al.uid && (await owner("GET", `roomsMeta/${HR(boss)}/box/${al.uid}`)) === null);
rowId = rows[0][0];
bad("nothing left in the box", await act(bo, "furniPlace", { room: HR(boss), source: "box", owner: al.uid, kind: "f_rareblock", x: 6, y: 5 }));
console.log("--- the box from outside, and taking things back");
ok("al puts a piece in the box from storage", await (async () => { await owner("PUT", `users/${al.uid}/storage/f_rareblock`, 2); return act(al, "hideoutBoxStore", { room: HR(boss), kind: "f_rareblock", qty: 1 }); })());
ok("and one from the pocket", await act(al, "hideoutBoxStore", { room: HR(boss), kind: "f_rareblock", qty: 1, source: "inv", slot: slotOf(await state(al), "f_rareblock") }));
check("2 in the box", (await owner("GET", `roomsMeta/${HR(boss)}/box/${al.uid}/f_rareblock`)) === 2);
bad("not a weed seed", await act(al, "hideoutBoxStore", { room: HR(boss), kind: "weedseed", qty: 1, source: "inv", slot: slotOf(await state(al), "weedseed") }));
bad("a stranger has no access to the box", await act(out, "hideoutBoxStore", { room: HR(boss), kind: "f_rareblock", qty: 1, source: "inv", slot: 0 }));
const tk = await act(al, "hideoutBoxTake", { room: HR(boss), kind: "f_rareblock", qty: 1 });
ok("al takes one back to storage", tk);
check("it is in al's storage", (await owner("GET", `users/${al.uid}/storage/f_rareblock`)) === 2, String(await owner("GET", `users/${al.uid}/storage/f_rareblock`)));
const tk2 = await act(al, "hideoutBoxTake", { room: HR(boss), kind: "f_rareblock", qty: 1, to: "inv" });
ok("and one to the pocket", tk2);

console.log("--- locking, and who may build");
ok("the owner locks building", await act(boss, "hideoutSettings", { lock: true }));
bad("members can't place now", await act(bo, "furniPlace", { room: HR(boss), source: "inv", slot: slotOf(await state(bo), "f_rareblock"), x: 8, y: 8 }));
bad("or move", await act(bo, "furniMove", { room: HR(boss), id: rowId, x: 9, y: 9, dir: 0 }));
ok("the owner still can", await act(boss, "furniMove", { room: HR(boss), id: rowId, x: 9, y: 9, dir: 0 }));
ok("unlock", await act(boss, "hideoutSettings", { lock: false }));
ok("the owner takes building away from bo", await act(boss, "hideoutMember", { uid: bo.uid, build: false }));
bad("bo can't build", await act(bo, "furniPlace", { room: HR(boss), source: "inv", slot: slotOf(await state(bo), "f_rareblock"), x: 8, y: 8 }));
ok("al still can", await act(al, "furniPlace", { room: HR(boss), source: "inv", slot: slotOf(await state(al), "f_rareblock"), x: 8, y: 8 }));
bad("a member can't set rights", await act(al, "hideoutMember", { uid: bo.uid, build: true }));
bad("or lock", await act(al, "hideoutSettings", { lock: true }));
ok("rights back for bo", await act(boss, "hideoutMember", { uid: bo.uid, build: true }));

console.log("--- pots and mixers for everybody");
ok("the owner puts a growing kit down", await act(boss, "furniPlace", { room: HR(boss), source: "inv", slot: slotOf(await state(boss), "f_planter"), x: 12, y: 3 }));
ok("and a mixer", await act(boss, "furniPlace", { room: HR(boss), source: "inv", slot: slotOf(await state(boss), "f_mixer"), x: 13, y: 3 }));
const kit = (await rowsOf(boss)).find(([, r]) => r.kind === "f_planter")[0], mx = (await rowsOf(boss)).find(([, r]) => r.kind === "f_mixer")[0];
await owner("PUT", `users/${boss.uid}/inventory/20`, { item: "weedseed", qty: 1 });
ok("al plants", await act(al, "plant", { room: HR(boss), fid: kit, slot: slotOf(await state(al), "weedseed") }));
bad("a stranger can't use it", await (async () => { await stand(out, HR(boss), 8, 8); const r = await act(out, "water", { room: HR(boss), fid: kit, slot: 0 }); await owner("DELETE", `rooms/${HR(boss)}/players/${out.uid}`); return r; })());
ok("bo waters", await act(bo, "water", { room: HR(boss), fid: kit, slot: slotOf(await state(bo), "wateringcan_full") }));
await owner("PATCH", `roomsMeta/${HR(boss)}/furni/${kit}`, { plantedAt: Date.now() - 11 * 60_000 });
const hv = await act(boss, "harvest", { room: HR(boss), fid: kit });
ok("the owner harvests", hv);
check("the weed is the harvester's", total(hv.state.inventory, "weed") >= 1, JSON.stringify(hv.state.inventory.filter(Boolean).map((x) => x.item)));
const st = await state(bo);
const mixed = await act(bo, "mix", { room: HR(boss), fid: mx, a: slotOf(st, "weed"), b: slotOf(st, "cigarette") });
ok("bo mixes in the shared mixer", mixed);
await owner("PATCH", `roomsMeta/${HR(boss)}/furni/${mx}/mixJob`, { doneAt: Date.now() - 1000 });
const got = await act(boss, "mixCollect", { room: HR(boss), fid: mx });
ok("and the owner collects it", got);
check("the owner got the weed mix", total(got.state.inventory, "mix") === 2, JSON.stringify(got.data));
bad("the sink works for members only", await (async () => { await stand(out, HR(boss), 9, 9); const r = await act(out, "fillCan", { room: HR(boss), slot: 0 }); await owner("DELETE", `rooms/${HR(boss)}/players/${out.uid}`); return r; })());

console.log("--- orders from the computer");
await owner("PUT", `users/${bo.uid}/blood`, 5000);
bad("not in the shop list", await act(bo, "hideoutOrder", { room: HR(boss), kind: "f_sofa" }));
const od = await act(bo, "hideoutOrder", { room: HR(boss), kind: "waterer" });
ok("bo orders an automatic waterer", od);
check("250 blood", (await bloodOf(bo)) === 4750);
const oid = od.data.id;
check("it takes 20 minutes", Math.abs(od.data.doneAt - Date.now() - 20 * 60_000) < 15_000, String(od.data.doneAt - Date.now()));
bad("not before it arrives", await act(bo, "hideoutCollect", { room: HR(boss), id: oid }));
await owner("PATCH", `roomsMeta/${HR(boss)}/orders/${oid}`, { doneAt: Date.now() - 1000 });
bad("only bo can collect it", await act(al, "hideoutCollect", { room: HR(boss), id: oid }));
const cl = await act(bo, "hideoutCollect", { room: HR(boss), id: oid });
ok("bo collects", cl);
check("a waterer in the pocket", total(cl.state.inventory, "waterer") === 1);
bad("nothing twice", await act(bo, "hideoutCollect", { room: HR(boss), id: oid }));
for (let i = 0; i < 4; i++) ok(`waterer ${i + 2} for 250`, await act(bo, "hideoutOrder", { room: HR(boss), kind: "waterer" }));
check("1250 spent so far", (await bloodOf(bo)) === 3750, String(await bloodOf(bo)));
ok("the sixth waterer", await act(bo, "hideoutOrder", { room: HR(boss), kind: "waterer" }));
check("still 250 (no cheap ones, no dear ones)", (await bloodOf(bo)) === 3500, String(await bloodOf(bo)));
const chip = await act(bo, "hideoutOrder", { room: HR(boss), kind: "mixerchip" });
ok("a mixer chip", chip);
check("400 for the first", (await bloodOf(bo)) === 3100);
ok("and a second", await act(bo, "hideoutOrder", { room: HR(boss), kind: "mixerchip" }));
check("400 for the next", (await bloodOf(bo)) === 2700);

console.log("--- upgrades: the waterer and the mixer chip");
await owner("PATCH", `roomsMeta/${HR(boss)}/orders/${chip.data.id}`, { doneAt: Date.now() - 1000 });
await act(bo, "hideoutCollect", { room: HR(boss), id: chip.data.id });
const wo = Object.entries((await owner("GET", `roomsMeta/${HR(boss)}/orders`)) ?? {}).filter(([, o]) => o.by === bo.uid && o.kind === "waterer").map(([id]) => id);
await owner("PATCH", `roomsMeta/${HR(boss)}/orders/${wo[0]}`, { doneAt: Date.now() - 1000 });
await act(bo, "hideoutCollect", { room: HR(boss), id: wo[0] });
bad("a stranger can't", await (async () => { await stand(out, HR(boss), 8, 8); const r = await act(out, "attachUpgrade", { room: HR(boss), fid: kit, slot: 0 }); await owner("DELETE", `rooms/${HR(boss)}/players/${out.uid}`); return r; })());
bad("the waterer doesn't go on a mixer", await act(bo, "attachUpgrade", { room: HR(boss), fid: mx, slot: slotOf(await state(bo), "waterer") }));
bad("the chip doesn't go on a pot", await act(bo, "attachUpgrade", { room: HR(boss), fid: kit, slot: slotOf(await state(bo), "mixerchip") }));
ok("the waterer goes on the pot", await act(bo, "attachUpgrade", { room: HR(boss), fid: kit, slot: slotOf(await state(bo), "waterer") }));
check("the pot is automatic", (await owner("GET", `roomsMeta/${HR(boss)}/furni/${kit}/auto`)) === true);
bad("not twice", await act(bo, "attachUpgrade", { room: HR(boss), fid: kit, slot: slotOf(await state(bo), "waterer") }));
ok("the chip goes in the mixer", await act(bo, "attachUpgrade", { room: HR(boss), fid: mx, slot: slotOf(await state(bo), "mixerchip") }));
check("the mixer is upgraded", (await owner("GET", `roomsMeta/${HR(boss)}/furni/${mx}/up`)) === 1);
bad("not twice", await act(bo, "attachUpgrade", { room: HR(boss), fid: mx, slot: slotOf(await state(bo), "mixerchip") }));
await owner("PUT", `users/${bo.uid}/inventory/21`, { item: "weedseed", qty: 1 });
ok("plant in the automatic pot", await act(bo, "plant", { room: HR(boss), fid: kit, slot: slotOf(await state(bo), "weedseed") }));
bad("no watering needed", await act(bo, "water", { room: HR(boss), fid: kit, slot: 0 }));
await owner("PATCH", `roomsMeta/${HR(boss)}/furni/${kit}`, { plantedAt: Date.now() - 11 * 60_000 });
const hv2 = await act(bo, "harvest", { room: HR(boss), fid: kit });
ok("harvests a proper weed (not ass)", hv2);
check("it is not ass", total(hv2.state.inventory, "weed") >= 1 && !hv2.state.inventory.some((x) => x && x.item === "weed" && x.ass), JSON.stringify(hv2.state.inventory.filter(Boolean).map((x) => x.item + (x.ass ? "*" : ""))));
const st2 = await state(bo);
ok("a mix in the upgraded mixer", await act(bo, "mix", { room: HR(boss), fid: mx, a: slotOf(st2, "weed"), b: slotOf(st2, "cigarette") }));
const job = await owner("GET", `roomsMeta/${HR(boss)}/furni/${mx}/mixJob`);
check("the first upgrade: 15% faster (8.5 to 25.5 minutes)", job && job.doneAt - Date.now() <= 25.6 * 60_000 && job.doneAt - Date.now() >= 8 * 60_000, JSON.stringify(job));
await owner("PUT", `users/${bo.uid}/inventory/22`, { item: "mixerchip2", qty: 2 });
ok("the MK2 goes over it", await act(bo, "attachUpgrade", { room: HR(boss), fid: mx, slot: 22 }));
check("the mixer is level 2", (await owner("GET", `roomsMeta/${HR(boss)}/furni/${mx}/up`)) === 2);
bad("not twice", await act(bo, "attachUpgrade", { room: HR(boss), fid: mx, slot: 22 }));
await owner("DELETE", `roomsMeta/${HR(boss)}/furni/${mx}/mixJob`);
await owner("PUT", `users/${bo.uid}/inventory/23`, { item: "weed", qty: 1 }); await owner("PUT", `users/${bo.uid}/inventory/24`, { item: "cigarette", qty: 1 });
const st3 = await state(bo);
ok("a mix in the MK2 mixer", await act(bo, "mix", { room: HR(boss), fid: mx, a: slotOf(st3, "weed"), b: slotOf(st3, "cigarette") }));
const job2 = await owner("GET", `roomsMeta/${HR(boss)}/furni/${mx}/mixJob`);
check("25% faster (7.5 to 22.5 minutes)", job2 && job2.doneAt - Date.now() <= 22.6 * 60_000 && job2.doneAt - Date.now() >= 7 * 60_000, JSON.stringify(job2));

console.log("--- the sink: basement and hideouts, not player rooms");
await owner("PUT", `users/${boss.uid}/inventory/22`, { item: "wateringcan", qty: 1 });
await stand(boss, HR(boss), 6, 6);
ok("the sink in the hideout", await act(boss, "fillCan", { room: HR(boss), slot: 22 }));
await owner("PUT", `users/${boss.uid}/inventory/22`, { item: "wateringcan", qty: 1 });
bad("none in your own room any more", await act(boss, "fillCan", { slot: 22 }));
await stand(boss, "lobby", 3, 3);
ok("the one in the basement", await act(boss, "fillCan", { room: "lobby", slot: 22 }));

console.log("--- the shared stash");
await stand(boss, HR(boss), 5, 5); await stand(al, HR(boss), 6, 6);
await owner("PUT", `users/${boss.uid}/inventory/23`, { item: "weed", qty: 4 });
bad("a stranger can't put", await (async () => { await stand(out, HR(boss), 8, 8); const r = await act(out, "hideoutChestPut", { room: HR(boss), slot: 0, qty: 1 }); await owner("DELETE", `rooms/${HR(boss)}/players/${out.uid}`); return r; })());
ok("the owner puts 3 weed in", await act(boss, "hideoutChestPut", { room: HR(boss), slot: 23, qty: 3 }));
check("3 in the stash", (await owner("GET", `hideoutChests/${boss.uid}/weed/qty`)) === 3);
check("1 left in the pocket", total((await state(boss)).inventory, "weed") >= 1);
ok("al takes 2", await act(al, "hideoutChestTake", { room: HR(boss), key: "weed", qty: 2 }));
check("1 left in the stash", (await owner("GET", `hideoutChests/${boss.uid}/weed/qty`)) === 1);
bad("a stranger can't take", await (async () => { await stand(out, HR(boss), 8, 8); const r = await act(out, "hideoutChestTake", { room: HR(boss), key: "weed", qty: 1 }); await owner("DELETE", `rooms/${HR(boss)}/players/${out.uid}`); return r; })());
bad("furniture goes in the box, not the stash", await act(boss, "hideoutChestPut", { room: HR(boss), slot: slotOf(await state(boss), "f_rareblock"), qty: 1 }));
ok("al takes the last one", await act(al, "hideoutChestTake", { room: HR(boss), key: "weed", qty: 5 }));
check("the stash row is gone", (await owner("GET", `hideoutChests/${boss.uid}/weed`)) === null);
bad("nothing to take", await act(al, "hideoutChestTake", { room: HR(boss), key: "weed", qty: 1 }));

console.log("--- what members may do, taking your own pieces to your pocket, the kit cap");
await giveName(al); await giveName(bo);
const sr = await act(boss, "hideoutSearch", { q: "hd_b" });
check("a part of a name is enough: hd_b finds t_hd_bo (and boss)", sr.ok && sr.data.players.some((p) => p.name === "t_hd_bo"), JSON.stringify(sr.data));
const sr2 = await act(boss, "hideoutSearch", { q: "t_hd_bo" });
check("the names that start with it come first", sr2.ok && sr2.data.players[0].name.startsWith("t_hd_bo"));
ok("the owner switches pots and mixers off for bo", await act(boss, "hideoutMember", { uid: bo.uid, grow: false }));
check("bo's flag is saved, build stays on", (await owner("GET", `roomsMeta/${HR(boss)}/members/${bo.uid}/grow`)) === false && (await owner("GET", `roomsMeta/${HR(boss)}/members/${bo.uid}/build`) !== false));
bad("bo can't water any more", await act(bo, "water", { room: HR(boss), fid: kit, slot: 0 }));
bad("nor use the sink", await act(bo, "fillCan", { room: HR(boss), slot: 0 }));
bad("a member can't change it", await act(al, "hideoutMember", { uid: bo.uid, grow: true }));
bad("nothing to change", await act(boss, "hideoutMember", { uid: bo.uid }));
ok("the owner switches the stash off for al", await act(boss, "hideoutMember", { uid: al.uid, stash: false }));
bad("al can't put in the stash", await act(al, "hideoutChestPut", { room: HR(boss), slot: 0, qty: 1 }));
const nw = await fresh("t_hd_new", { blood: 100 });
await act(nw, "sync"); await giveName(nw);
ok("a new player is invited", await act(boss, "hideoutInvite", { uid: nw.uid }));
ok("and joins", await act(nw, "hideoutAnswer", { owner: boss.uid, accept: true }));
const nm = await owner("GET", `roomsMeta/${HR(boss)}/members/${nw.uid}`);
check("what was switched off for some is off for the new one (pots and stash), building is on", nm.grow === false && nm.stash === false && nm.build === true, JSON.stringify(nm));
check("the owner switches them back on for bo and al", (await act(boss, "hideoutMember", { uid: bo.uid, grow: true })).ok && (await act(boss, "hideoutMember", { uid: al.uid, stash: true })).ok);
ok("kick the new one again", await act(boss, "hideoutKick", { uid: nw.uid }));
// taking your own piece straight to your pocket
await owner("PUT", `users/${boss.uid}/inventory/20`, { item: "f_rareblock", qty: 1 });
await stand(boss, HR(boss), 5, 5);
ok("boss puts a block down", await act(boss, "furniPlace", { room: HR(boss), source: "inv", slot: 20, x: 3, y: 12 }));
const blockId = (await rowsOf(boss)).find(([, r]) => r.kind === "f_rareblock" && r.x === 3 && r.y === 12)?.[0];
bad("bo can't pocket the boss's piece", await act(bo, "furniStore", { room: HR(boss), id: blockId, to: "pocket" }));
const pk = await act(boss, "furniStore", { room: HR(boss), id: blockId, to: "pocket" });
ok("the boss takes it straight to the pocket", pk);
check("it is in the pocket, not in the box", total(pk.state.inventory, "f_rareblock") >= 1 && !(await owner("GET", `roomsMeta/${HR(boss)}/furni/${blockId}`)));
await owner("PUT", `users/${boss.uid}/inventory`, inv(...Array.from({ length: 28 }, () => ({ item: "weedseed", qty: 1 }))));
await owner("PUT", `roomsMeta/${HR(boss)}/furni/blk2`, { kind: "f_rareblock", x: 2, y: 12, dir: 0, by: boss.uid });
bad("full pockets: it stays", await act(boss, "furniStore", { room: HR(boss), id: "blk2", to: "pocket" }));
await owner("DELETE", `roomsMeta/${HR(boss)}/furni/blk2`);
// 40 growing kits at most
const kitsNow = (await rowsOf(boss)).filter(([, r]) => r.kind === "f_planter").length;
for (let i = 0; i < 40 - kitsNow; i++) await owner("PUT", `roomsMeta/${HR(boss)}/furni/capk${i}`, { kind: "f_planter", x: i % 13, y: 13 - Math.floor(i / 13), dir: 0, by: boss.uid });
await owner("PUT", `users/${boss.uid}/inventory`, inv({ item: "f_planter", qty: 1 }));
bad("the 41st growing kit doesn't fit", await act(boss, "furniPlace", { room: HR(boss), source: "inv", slot: 0, x: 0, y: 0 }));
for (let i = 0; i < 40 - kitsNow; i++) await owner("DELETE", `roomsMeta/${HR(boss)}/furni/capk${i}`);
// 40 mixers at most
const mixNow = (await rowsOf(boss)).filter(([, r]) => r.kind === "f_mixer").length;
for (let i = 0; i < 40 - mixNow; i++) await owner("PUT", `roomsMeta/${HR(boss)}/furni/capm${i}`, { kind: "f_mixer", x: i % 13, y: 13 - Math.floor(i / 13), dir: 0, by: boss.uid });
await owner("PUT", `users/${boss.uid}/inventory`, inv({ item: "f_mixer", qty: 1 }));
bad("the 41st mixer doesn't fit", await act(boss, "furniPlace", { room: HR(boss), source: "inv", slot: 0, x: 0, y: 0 }));
for (let i = 0; i < 40 - mixNow; i++) await owner("DELETE", `roomsMeta/${HR(boss)}/furni/capm${i}`);
await owner("PUT", `users/${boss.uid}/inventory`, inv({ item: "f_planter", qty: 1 }, { item: "weedseed", qty: 2 }));

// the toolbox storage works inside a hideout too (Store from the pocket, Take back into it)
await owner("PUT", `users/${boss.uid}/inventory`, inv({ item: "f_planter", qty: 1 }));
await owner("DELETE", `users/${boss.uid}/storage`);
ok("store a piece in a hideout", await act(boss, "store", { slot: 0, qty: 1, room: HR(boss) }));
check("it is in the storage", (await owner("GET", `users/${boss.uid}/storage/f_planter`)) === 1);
ok("take it back in a hideout", await act(boss, "take", { key: "f_planter", qty: 1, room: HR(boss) }));
check("it is in the pocket again", (await owner("GET", `users/${boss.uid}/storage/f_planter`)) === null);
bad("not in a hideout you are not in", await act(poor, "take", { key: "f_planter", qty: 1, room: HR(boss) }));
await owner("PUT", `users/${boss.uid}/inventory`, inv({ item: "f_planter", qty: 1 }, { item: "weedseed", qty: 2 }));

console.log("--- leaving and being kicked");
await stand(al, HR(boss), 6, 6);
const alRows = (await rowsOf(boss)).filter(([, r]) => r.by === al.uid).length;
check("al has pieces in the room", alRows >= 2, String(alRows));
ok("the owner puts something of al's in the box too", await act(al, "hideoutBoxStore", { room: HR(boss), kind: "f_rareblock", qty: 1, source: "inv", slot: slotOf(await state(al), "f_rareblock") }).then((r) => (r.ok ? r : { ok: true })));
const before = (await owner("GET", `users/${al.uid}/storage/f_rareblock`)) ?? 0;
const kk = await act(boss, "hideoutKick", { uid: al.uid });
ok("the owner kicks al", kk);
check("al's pieces left the room", (await rowsOf(boss)).every(([, r]) => r.by !== al.uid));
const after = (await owner("GET", `users/${al.uid}/storage/f_rareblock`)) ?? 0;
check("and went into al's own storage", after >= before + alRows, `${before} -> ${after}`);
check("al is off the list", !(await meta(boss)).members?.[al.uid] && (await owner("GET", `hideouts/${al.uid}/${boss.uid}`)) === null);
check("and the box has nothing of al's", (await owner("GET", `roomsMeta/${HR(boss)}/box/${al.uid}`)) === null);
bad("al can't build any more", await act(al, "furniPlace", { room: HR(boss), source: "storage", kind: "f_rareblock", x: 1, y: 1 }));
bad("the owner can't kick themself", await act(boss, "hideoutKick", { uid: boss.uid }));
bad("the owner can't leave", await act(boss, "hideoutLeave", { owner: boss.uid }));
ok("bo leaves", await act(bo, "hideoutLeave", { owner: boss.uid }));
check("bo's list is empty", (await owner("GET", `hideouts/${bo.uid}`)) === null);

console.log("--- the rules");
{
  const rr = await fresh("t_hd_rules", { blood: 0 });
  await act(rr, "sync");
  const pres = { name: rr.name, figure: "x", x: 3, y: 3, dir: 2 };
  check("a stranger can't stand in the hideout", refused(await clientWrite(rr, `rooms/${HR(boss)}/players/${rr.uid}`, pres)));
  check("the owner can", !refused(await clientWrite(boss, `rooms/${HR(boss)}/players/${boss.uid}`, { ...pres, name: boss.name })));
  ok("invite the rules player", await act(boss, "hideoutInvite", { uid: rr.uid }));
  ok("they join", await act(rr, "hideoutAnswer", { owner: boss.uid, accept: true }));
  check("a member can", !refused(await clientWrite(rr, `rooms/${HR(boss)}/players/${rr.uid}`, pres)));
  check("a member reads their own invites and hideouts", (await fetch(`${DB}/hideouts/${rr.uid}.json?ns=${NS}&auth=${rr.token}`)).status === 200);
  check("not other people's", refused(await fetch(`${DB}/hideouts/${boss.uid}.json?ns=${NS}&auth=${rr.token}`)));
  check("nobody writes the hideout record", refused(await clientWrite(rr, `roomsMeta/${HR(boss)}/members/${rr.uid}/build`, false)));
  ok("kicked", await act(boss, "hideoutKick", { uid: rr.uid }));
  check("and then they can't stand there", refused(await clientWrite(rr, `rooms/${HR(boss)}/players/${rr.uid}`, pres)));
}

console.log("--- the list at the door");
{
  const lo = await fresh("t_hd_list_o", { blood: 3000 });
  const ls = await fresh("t_hd_list_s", { blood: 100 });
  for (const x of [lo, ls]) await act(x, "sync");
  await owner("DELETE", `hideoutList/${lo.uid}`); await owner("DELETE", `hideoutKnocks/${lo.uid}`); await owner("DELETE", `roomInvites/h_${lo.uid}`);
  await owner("DELETE", `roomsMeta/h_${lo.uid}`); await owner("DELETE", `hideouts/${lo.uid}`);
  await owner("PUT", `rooms/lobby/players/${lo.uid}`, { name: lo.name, figure: "x", x: 5, y: 5, dir: 2 });
  ok("buy", await act(lo, "hideoutBuy"));
  let row = await owner("GET", `hideoutList/${lo.uid}`);
  check("it is on the list at once", row && row.name === "t_hd_list_o's hideout" && row.members === 1 && row.boostUntil === 0, JSON.stringify(row));
  await owner("PUT", `rooms/h_${lo.uid}/players/${lo.uid}`, { name: lo.name, figure: "x", x: 5, y: 5, dir: 2 });
  ok("a description", await act(lo, "hideoutSettings", { desc: "we sell nothing" }));
  row = await owner("GET", `hideoutList/${lo.uid}`);
  check("it shows on the list", row.desc === "we sell nothing");
  ok("a message for the landlord to shout", await act(lo, "hideoutSettings", { ad: "  Cheap\nweed   at my place  " }));
  row = await owner("GET", `hideoutList/${lo.uid}`);
  check("it is on the list, tidied up", row.ad === "Cheap weed at my place", JSON.stringify(row));
  check("and in the hideout's own data", (await owner("GET", `roomsMeta/h_${lo.uid}/ad`)) === "Cheap weed at my place");
  ok("a long one is cut to 80 letters", await act(lo, "hideoutSettings", { ad: "x".repeat(200) }));
  check("80 letters", ((await owner("GET", `hideoutList/${lo.uid}`)).ad ?? "").length === 80);
  bad("a control character is refused", await act(lo, "hideoutSettings", { ad: "a\u0007b" }));
  ok("it can be cleared", await act(lo, "hideoutSettings", { ad: "" }));
  check("and then it is gone", (await owner("GET", `hideoutList/${lo.uid}`)).ad === undefined);
  await act(lo, "hideoutSettings", { ad: "Cheap weed at my place" });
  check("the list is readable for everybody who is signed in", (await fetch(`${DB}/hideoutList.json?ns=${NS}&auth=${ls.token}`)).status === 200);
  check("nobody writes it", refused(await clientWrite(ls, `hideoutList/${lo.uid}/name`, "mine")));
  await owner("PUT", `users/${lo.uid}/blood`, 5000);
  const b0 = await bloodOf(lo);
  ok("boost for 500", await act(lo, "hideoutBoost"));
  check("it costs 500", (await bloodOf(lo)) === b0 - 500);
  row = await owner("GET", `hideoutList/${lo.uid}`);
  check("and the list says until when", row.boostUntil > Date.now() + 21_000_000 && row.boostUntil < Date.now() + 21_700_000, JSON.stringify(row));
  ok("boosting again adds 6 hours", await act(lo, "hideoutBoost"));
  const row2 = await owner("GET", `hideoutList/${lo.uid}`);
  check("it adds up", row2.boostUntil > row.boostUntil + 21_000_000);
  bad("only the owner boosts", await act(ls, "hideoutBoost"));
  await owner("DELETE", `hideoutFavs/${ls.uid}`); await owner("DELETE", `roomsMeta/h_${lo.uid}/favs`); await owner("DELETE", `hideoutList/${lo.uid}/favs`); // (a clean start: earlier runs left favourites behind)
  const fv = await act(ls, "hideoutFavorite", { owner: lo.uid });
  ok("ls makes it a favourite", fv);
  check("the list counts it", (await owner("GET", `hideoutList/${lo.uid}/favs`)) === 1 && (await owner("GET", `hideoutFavs/${ls.uid}/${lo.uid}`)) === true, JSON.stringify(fv.data));
  check("favourites are private (nobody else reads them)", refused(await readAs(lo, `hideoutFavs/${ls.uid}`)));
  ok("again: it is off", await act(ls, "hideoutFavorite", { owner: lo.uid }));
  check("the count is back to nothing", !(await owner("GET", `hideoutList/${lo.uid}/favs`)));
  bad("not your own", await act(lo, "hideoutFavorite", { owner: lo.uid }));
  bad("not a hideout that isn't there", await act(ls, "hideoutFavorite", { owner: "zzzzzzzzzzzz" }));
  ok("favourite once more", await act(ls, "hideoutFavorite", { owner: lo.uid, on: true }));

  ok("the owner invites", await act(lo, "hideoutInvite", { uid: ls.uid }));
  ok("they join", await act(ls, "hideoutAnswer", { owner: lo.uid, accept: true }));
  check("the list counts two", (await owner("GET", `hideoutList/${lo.uid}/members`)) === 2);
  ok("take it off the list", await act(lo, "hideoutSettings", { listed: false }));
  check("it is gone from the list", (await owner("GET", `hideoutList/${lo.uid}`)) === null);
  bad("no boost when it isn't listed", await act(lo, "hideoutBoost"));
  const st2 = await fresh("t_hd_list_x", { blood: 0 });
  const knock = (who) => clientWrite(who, `hideoutKnocks/${lo.uid}/${who.uid}`, { name: who.name, ts: { ".sv": "timestamp" } });
  check("nobody knocks at one that isn't on the list", refused(await knock(st2)));
  ok("back on the list", await act(lo, "hideoutSettings", { listed: true }));
  check("with the members counted", (await owner("GET", `hideoutList/${lo.uid}/members`)) === 2);
  ok("the member leaves", await act(ls, "hideoutLeave", { owner: lo.uid }));
  check("and the list counts one", (await owner("GET", `hideoutList/${lo.uid}/members`)) === 1);
  // knocking: a stranger can't ask to be a member, but can knock and be let in as a guest
  const pres = { name: st2.name, figure: "x", x: 5, y: 5, dir: 2 };
  bad("there is no asking to join", await act(st2, "hideoutRequest", { owner: lo.uid }));
  check("a stranger can't stand in the hideout", refused(await clientWrite(st2, `rooms/h_${lo.uid}/players/${st2.uid}`, pres)));
  check("a stranger knocks", !refused(await knock(st2)));
  check("the owner sees the knock", !!(await owner("GET", `hideoutKnocks/${lo.uid}/${st2.uid}`)) && (await fetch(`${DB}/hideoutKnocks/${lo.uid}.json?ns=${NS}&auth=${lo.token}`)).status === 200);
  check("nobody else reads the queue", refused(await fetch(`${DB}/hideoutKnocks/${lo.uid}.json?ns=${NS}&auth=${st2.token}`)));
  check("a stranger can't let themselves in", refused(await clientWrite(st2, `roomInvites/h_${lo.uid}/${st2.uid}`, true)));
  check("the owner lets them in", !refused(await clientWrite(lo, `roomInvites/h_${lo.uid}/${st2.uid}`, true)) && !refused(await clientWrite(lo, `hideoutKnocks/${lo.uid}/${st2.uid}`, null)));
  check("the guest can stand there now", !refused(await clientWrite(st2, `rooms/h_${lo.uid}/players/${st2.uid}`, pres)));
  bad("but a guest can't use the box", await act(st2, "hideoutBoxStore", { room: `h_${lo.uid}`, kind: "f_rareblock", qty: 1 }));
  bad("or order from the computer", await act(st2, "hideoutOrder", { room: `h_${lo.uid}`, kind: "f_randomizer" }));
  check("the knock can be taken back by the one who made it", (await knock(st2)).status < 300 && !refused(await clientWrite(st2, `hideoutKnocks/${lo.uid}/${st2.uid}`, null)));
  // open to everybody: no knocking
  const st3 = await fresh("t_hd_list_y", { blood: 0 });
  const pres3 = { name: st3.name, figure: "x", x: 5, y: 5, dir: 2 };
  check("before it is open a stranger can't walk in", refused(await clientWrite(st3, `rooms/h_${lo.uid}/players/${st3.uid}`, pres3)));
  bad("only the owner opens it", await act(st3, "hideoutSettings", { open: true }));
  ok("the owner opens it to everybody", await act(lo, "hideoutSettings", { open: true }));
  check("the list says it is open", (await owner("GET", `hideoutList/${lo.uid}/open`)) === true && (await owner("GET", `roomsMeta/h_${lo.uid}/access`)) === "open");
  check("a stranger walks in without knocking", !refused(await clientWrite(st3, `rooms/h_${lo.uid}/players/${st3.uid}`, pres3)));
  bad("but is still no member (the box)", await act(st3, "hideoutBoxStore", { room: `h_${lo.uid}`, kind: "f_rareblock", qty: 1 }));
  ok("the owner closes it again", await act(lo, "hideoutSettings", { open: false }));
  check("and the list and the door say so", (await owner("GET", `hideoutList/${lo.uid}/open`)) === false && (await owner("GET", `roomsMeta/h_${lo.uid}/access`)) === "none");
  // the enterAnywhere perk: some accounts may enter any hideout and any room
  const vip = await fresh("t_hd_list_vip", { blood: 0 });
  const presV = { name: vip.name, figure: "x", x: 5, y: 5, dir: 2 };
  check("without the perk nobody walks into a closed hideout", refused(await clientWrite(vip, `rooms/h_${lo.uid}/players/${vip.uid}`, presV)));
  await owner("PUT", `perks/${vip.uid}/enterAnywhere`, true);
  check("with the perk they do", !refused(await clientWrite(vip, `rooms/h_${lo.uid}/players/${vip.uid}`, presV)));
  await owner("PUT", `roomsMeta/u_${lo.uid}`, { owner: lo.uid, ownerName: lo.name, name: "closed room", access: "closed", w: 8, h: 8 });
  check("and into a closed player room", !refused(await clientWrite(vip, `rooms/u_${lo.uid}/players/${vip.uid}`, presV)));
  await owner("DELETE", `roomsMeta/u_${lo.uid}`); await owner("DELETE", `perks/${vip.uid}`);
}

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
