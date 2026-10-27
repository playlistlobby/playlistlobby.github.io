// The CD printer: who presses what, the price split, the daily cap, the pressed CD as an item (play, trade, 6ixty refuses it), a song that is taken off keeps its CD alive
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/cdpress.mjs (server/)
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
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 220));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 220));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  return u;
};
const stand = (u, room) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x: 5, y: 5, dir: 2 });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const state = async (u) => (await act(u, "sync")).state;
const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));

const boss = await fresh("t_cp_boss", { blood: 100 }), mem = await fresh("t_cp_mem", { blood: 100 }), guest = await fresh("t_cp_guest", { blood: 100 }), broke = await fresh("t_cp_broke", { blood: 5 });
for (const u of [boss, mem, guest, broke]) await act(u, "sync");
const ROOM = `h_${boss.uid}`;
await owner("PUT", `roomsMeta/${ROOM}`, { owner: boss.uid, ownerName: boss.name, name: "press test", w: 14, h: 14, level: 0, access: "none", members: { [mem.uid]: { name: mem.name } }, furni: {} });
for (const u of [boss, mem, guest, broke]) await stand(u, ROOM);
await owner("DELETE", `hideoutTill/${boss.uid}`);
const song = (title, up, down) => ({ owner: boss.uid, ownerName: boss.name, title, durMs: 20_000, size: 5000, mime: "audio/mpeg", pieces: 1, at: Date.now() - 7_200_000, up, down, ready: true });
await owner("PUT", "songs/cpa", song("Press A", 900, 0));
await owner("PUT", "songs/cpb", song("Press B", 899, 0));
await owner("PUT", "songs/cpbad", song("Press Bad", 0, 900));
await owner("PUT", "audio/cpa/0", "AAAA");
// eight better songs, so that Press A and Press B are 9th and 10th in the Charts and Press Bad is 11th (out)
for (let i = 0; i < 8; i++) await owner("PUT", `songs/cpf${i}`, song(`Filler ${i}`, 950 - i, 0));

console.log("--- no printer, no CD");
bad("no printer in the room", await act(mem, "cdPress", { room: ROOM, song: "cpa", colour: "r" }));
await owner("PUT", `roomsMeta/${ROOM}/furni/fp1`, { kind: "f_cdpress", x: 3, y: 3, dir: 2, by: boss.uid });

console.log("--- who may press what");
bad("a song that isn't in the Charts", await act(mem, "cdPress", { room: ROOM, song: "cpbad", colour: "r" }));
bad("a song that isn't there", await act(mem, "cdPress", { room: ROOM, song: "nothere", colour: "r" }));
bad("a colour that isn't there", await act(mem, "cdPress", { room: ROOM, song: "cpa", colour: "z" }));
const m1 = await act(mem, "cdPress", { room: ROOM, song: "cpa", colour: "r" });
ok("a member presses for free", m1);
check("it is free and the CD is theirs", m1.data.price === 0 && (await bloodOf(mem)) === 100 && (await state(mem)).inventory.some((s) => s && s.item === "cdp_r_cpa"), JSON.stringify(m1.data));
ok("the owner presses for free", await act(boss, "cdPress", { room: ROOM, song: "cpb", colour: "y" }));
const g1 = await act(guest, "cdPress", { room: ROOM, song: "cpa", colour: "b" });
ok("a visitor pays the default price", g1);
check("25 blood goes from the visitor to the owner's Tables page", (await bloodOf(guest)) === 75 && (await owner("GET", `hideoutTill/${boss.uid}/blood`)) === 25 && (await owner("GET", `hideoutTill/${boss.uid}/total`)) === 25, JSON.stringify([await bloodOf(guest), await owner("GET", `hideoutTill/${boss.uid}`)]));
bad("a visitor can't set the price", await act(guest, "cdPressPrice", { room: ROOM, price: 10 }));
bad("a member can't either", await act(mem, "cdPressPrice", { room: ROOM, price: 10 }));
bad("not under 10", await act(boss, "cdPressPrice", { room: ROOM, price: 9 }));
bad("not over 100", await act(boss, "cdPressPrice", { room: ROOM, price: 101 }));
ok("the owner sets 40", await act(boss, "cdPressPrice", { room: ROOM, price: 40 }));
ok("a visitor pays 40 now", await act(guest, "cdPress", { room: ROOM, song: "cpb", colour: "g" }));
check("65 -> 35 for the visitor, 65 on the page", (await bloodOf(guest)) === 35 && (await owner("GET", `hideoutTill/${boss.uid}/blood`)) === 65, JSON.stringify([await bloodOf(guest), await owner("GET", `hideoutTill/${boss.uid}`)]));
bad("a visitor without the blood can't", await act(broke, "cdPress", { room: ROOM, song: "cpa", colour: "s" }));
check("and loses nothing", (await bloodOf(broke)) === 5);
check("the song counts its CDs (4)", (await owner("GET", "songs/cpa/pressed")) === 2 && (await owner("GET", "songs/cpb/pressed")) === 2, JSON.stringify([await owner("GET", "songs/cpa/pressed"), await owner("GET", "songs/cpb/pressed")]));
check("its name is kept for the inventory", (await owner("GET", "cdTitles/cpa"))?.title === "Press A");

console.log("--- the daily cap");
const day = Math.floor(Date.now() / 86_400_000);
await owner("PUT", `cdPress/${mem.uid}`, { day, n: 49 });
ok("the 50th", await act(mem, "cdPress", { room: ROOM, song: "cpa", colour: "p" }));
bad("the 51st", await act(mem, "cdPress", { room: ROOM, song: "cpa", colour: "p" }));
await owner("PUT", `cdPress/${mem.uid}`, { day: day - 1, n: 50 });
ok("tomorrow it starts again", await act(mem, "cdPress", { room: ROOM, song: "cpa", colour: "p" }));

console.log("--- a full pocket");
const full = await fresh("t_cp_full", { blood: 100, inventory: inv(...["cigarette", "pill", "kodimagnyl", "lighter", "cigbutt", "tobacco", "cigar", "jointpaper", "bluntwrap", "wateringcan", "knife", "cd", "cd_yellow", "cd_green", "cd_blue", "cd_album", "cd_blodig", "cd_lykk", "cd_roulette", "cd_dipdip", "dice", "puffbar", "loudspeaker", "mysterycase", "casekey", "pickaxe", "machete", "f_sofa"].map((item) => ({ item, qty: 1 }))) });
await act(full, "sync"); await stand(full, ROOM);
bad("no room in the pocket", await act(full, "cdPress", { room: ROOM, song: "cpa", colour: "o" }));
check("and nothing was paid", (await bloodOf(full)) === 100);

console.log("--- the CD in a player");
const BB = `u_${mem.uid}`;
await stand(mem, BB);
let st = await state(mem);
const slot = st.inventory.findIndex((s) => s && s.item === "cdp_r_cpa");
check("the red CD is in the pocket", slot >= 0);
const ins = await act(mem, "cdInsert", { room: BB, slot, durationMs: 12345 });
ok("it goes in a player (the length comes from the song, not the browser)", ins);
let row = await owner("GET", `rooms/${BB}/cdplayer`);
check("the row is a pressed CD with the song's own pieces and length", row && row.track === "pressed" && row.song.id === "cpa" && row.durationMs === 20_000 && row.title === `Press A - ${boss.name}`, JSON.stringify(row));
ok("eject gives it back", await act(mem, "cdControl", { room: BB, op: "eject" }));
st = await state(mem);
check("the CD is free again", st.inventory.some((s) => s && s.item === "cdp_r_cpa" && !s.inPlayer));

console.log("--- 6ixty refuses it, and an invalid one is no item");
const slot2 = st.inventory.findIndex((s) => s && s.item === "cdp_r_cpa");
bad("6ixty doesn't buy a pressed CD", await act(mem, "sellWeed", { slot: slot2, qty: 1 }));
await owner("PUT", `users/${guest.uid}/inventory/20`, { item: "cdp_x_cpa", qty: 1 });
await owner("PUT", `users/${guest.uid}/inventory/21`, { item: "cdp_r_NOPE!", qty: 1 });
const gst = await state(guest);
check("a made-up CD id vanishes from the pocket", !gst.inventory.some((s) => s && (s.item === "cdp_x_cpa" || s.item === "cdp_r_NOPE!")), JSON.stringify(gst.inventory.filter(Boolean).map((s) => s.item)));

console.log("--- the song is taken off SoundCloud: the CD still plays");
ok("the artist takes it off", await act(boss, "songDelete", { id: "cpa" }));
check("it moved to the archive and keeps its audio", (await owner("GET", "songs/cpa")) === null && (await owner("GET", "songArchive/cpa"))?.title === "Press A" && (await owner("GET", "audio/cpa/0")) === "AAAA");
ok("the CD plays all the same", await act(mem, "cdInsert", { room: BB, slot: slot2, durationMs: 5000 }));
row = await owner("GET", `rooms/${BB}/cdplayer`);
check("from the archive", row && row.track === "pressed" && row.song.id === "cpa", JSON.stringify(row));
await act(mem, "cdControl", { room: BB, op: "eject" });

console.log("--- the song that nobody pressed is gone for good");
await owner("PUT", "songs/cpz", song("Press Z", 800, 0));
ok("deleted", await act(boss, "songDelete", { id: "cpz" }));
check("no archive", (await owner("GET", "songArchive/cpz")) === null);

for (let i = 0; i < 8; i++) await owner("DELETE", `songs/cpf${i}`);
for (const p of ["songs/cpa", "songs/cpb", "songs/cpbad", "songs/cpz", "songArchive/cpa", "songArchive/cpb", "audio/cpa", "cdTitles/cpa", "cdTitles/cpb", `roomsMeta/${ROOM}`, `rooms/${ROOM}`, `rooms/${BB}`, `hideoutTill/${boss.uid}`]) await owner("DELETE", p);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
