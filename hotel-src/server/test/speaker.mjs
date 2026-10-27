// SoundCloud on a hideout speaker: connecting, one thing at a time, who may skip/pause/loop/disconnect, the lazy catch-up when songs end, taken-off songs skipped
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/speaker.mjs (server/)
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
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 200));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 200));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  return u;
};
const stand = (u, room) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x: 5, y: 5, dir: 2 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const boss = await fresh("t_sp_boss"), mem = await fresh("t_sp_mem"), mem2 = await fresh("t_sp_mem2"), guest = await fresh("t_sp_guest");
for (const u of [boss, mem, mem2, guest]) await act(u, "sync");
const ROOM = `h_${boss.uid}`;
await owner("PUT", `roomsMeta/${ROOM}`, { owner: boss.uid, ownerName: boss.name, name: "speaker test", w: 14, h: 14, level: 0, access: "none", members: { [mem.uid]: { name: mem.name }, [mem2.uid]: { name: mem2.name } } });
for (const u of [boss, mem, mem2, guest]) await stand(u, ROOM);
await owner("DELETE", `rooms/${ROOM}/cdplayer`);
const song = (title, durMs, extra = {}) => ({ owner: boss.uid, ownerName: boss.name, title, durMs, size: 5000, mime: "audio/mpeg", pieces: 1, at: Date.now() - 7_200_000, up: 0, down: 0, ready: true, ...extra });
const ids = ["spa", "spb", "spc"];
await owner("PUT", "songs/spa", song("Alpha", 20_000));
await owner("PUT", "songs/spb", song("Bravo", 20_000));
await owner("PUT", "songs/spc", song("Charlie", 20_000));
const cdp = () => owner("GET", `rooms/${ROOM}/cdplayer`);

console.log("--- connecting");
bad("a guest can't connect", await act(guest, "speakerConnect", { room: ROOM, ids }));
bad("not nothing", await act(mem, "speakerConnect", { room: ROOM, ids: [] }));
bad("not songs that aren't there", await act(mem, "speakerConnect", { room: ROOM, ids: ["nope"] }));
bad("only a hideout", await act(mem, "speakerConnect", { room: "lobby", ids }));
const c1 = await act(mem, "speakerConnect", { room: ROOM, ids, start: 1 });
ok("a member connects, starting at the second song", c1);
let st = await cdp();
check("the speaker holds the queue and the song", st && st.track === "sc" && st.by === mem.uid && st.index === 1 && st.ids.length === 3 && st.song.id === "spb" && st.durationMs === 20_000, JSON.stringify(st));
check("the title has the song and the artist", st.title === `Bravo - ${boss.name}`.slice(0, 60), st.title);
bad("while it is connected nobody else can connect", await act(boss, "speakerConnect", { room: ROOM, ids }));
bad("and a CD can't be put in", await act(boss, "cdInsert", { room: ROOM, slot: 0, durationMs: 20000 }));
bad("the old CD buttons don't touch it", await act(boss, "cdControl", { room: ROOM, op: "eject" }));
check("the browser can't clear it (even when its time is up)", (await fetch(`${DB}/rooms/${ROOM}/cdplayer.json?ns=${NS}&auth=${guest.token}`, { method: "DELETE" })).status !== 200);

console.log("--- buttons");
bad("a guest can't skip", await act(guest, "speakerControl", { room: ROOM, op: "next", from: 1 }));
ok("another member skips", await act(mem2, "speakerControl", { room: ROOM, op: "next", from: 1 }));
st = await cdp();
check("the third song is on", st.index === 2 && st.song.id === "spc", JSON.stringify(st));
ok("pressing it again on the old song does nothing", await act(boss, "speakerControl", { room: ROOM, op: "next", from: 1 }));
check("(still the third)", (await cdp()).index === 2);
ok("the owner goes back", await act(boss, "speakerControl", { room: ROOM, op: "prev", from: 2 }));
check("the second song", (await cdp()).index === 1);
ok("a member pauses", await act(mem2, "speakerControl", { room: ROOM, op: "pause" }));
check("it is paused", !!(await cdp()).pausedAt);
await sleep(300);
ok("and plays on", await act(mem2, "speakerControl", { room: ROOM, op: "play" }));
st = await cdp();
check("playing again with the same length", !st.pausedAt && st.endsAt - st.startedAt === 20_000, JSON.stringify(st));
bad("a member can't loop (not theirs)", await act(mem2, "speakerControl", { room: ROOM, op: "loop", on: true }));
ok("who connected it can", await act(mem, "speakerControl", { room: ROOM, op: "loop", on: true }));
check("loop is on", (await cdp()).loop === true);
ok("the owner can turn it off", await act(boss, "speakerControl", { room: ROOM, op: "loop", on: false }));

console.log("--- songs end: the server catches up");
const back = (ms) => owner("PUT", `rooms/${ROOM}/cdplayer/startedAt`, Date.now() - ms).then(() => owner("PUT", `rooms/${ROOM}/cdplayer/endsAt`, Date.now() - ms + 20_000));
await back(21_000);
ok("somebody asks to move on once the song is over", await act(guest, "speakerControl", { room: ROOM, op: "advance" }));
st = await cdp();
check("the third song is playing, started when the second ended", st.index === 2 && Math.abs(st.startedAt - (Date.now() - 1000)) < 4000, JSON.stringify(st));
await back(65_000); // 3 songs' worth behind: it lands somewhere in the round
ok("a long time with nobody asking", await act(guest, "speakerControl", { room: ROOM, op: "advance" }));
st = await cdp();
check("it moved over the songs that ended and is inside a song now", st && st.endsAt > Date.now() && st.startedAt <= Date.now() + 100 && st.ids.length === 3, JSON.stringify(st));
ok("advancing early does nothing", await act(guest, "speakerControl", { room: ROOM, op: "advance" }));

console.log("--- loop one song");
await act(mem, "speakerControl", { room: ROOM, op: "loop", on: true });
const idx = (await cdp()).index;
await back(25_000);
ok("advance on loop", await act(guest, "speakerControl", { room: ROOM, op: "advance" }));
check("the same song again", (await cdp()).index === idx, JSON.stringify(await cdp()));
await act(boss, "speakerControl", { room: ROOM, op: "loop", on: false });

console.log("--- a song taken off is skipped");
await owner("DELETE", "songs/spc");
await owner("PUT", `rooms/${ROOM}/cdplayer/index`, 1);
await owner("PUT", `rooms/${ROOM}/cdplayer/song`, { id: "spb", pieces: 1, mime: "audio/mpeg" });
await back(21_000);
ok("advance", await act(guest, "speakerControl", { room: ROOM, op: "advance" }));
st = await cdp();
check("the next one is Alpha (Charlie is gone) and Charlie left the queue", st.song.id === "spa" && !st.ids.includes("spc"), JSON.stringify(st));

console.log("--- disconnecting");
bad("a member can't disconnect someone else's", await act(mem2, "speakerControl", { room: ROOM, op: "disconnect" }));
bad("a guest can't", await act(guest, "speakerControl", { room: ROOM, op: "disconnect" }));
await owner("DELETE", `rooms/${ROOM}/players/${mem.uid}`);
await stand(mem, ROOM);
ok("who connected it can disconnect", await act(mem, "speakerControl", { room: ROOM, op: "disconnect" }));
check("the speaker is free", (await cdp()) === null);
ok("a member connects again", await act(mem2, "speakerConnect", { room: ROOM, ids: ["spa", "spb"] }));
ok("the owner force-disconnects", await act(boss, "speakerControl", { room: ROOM, op: "disconnect" }));
check("free again", (await cdp()) === null);
bad("buttons with nothing connected", await act(boss, "speakerControl", { room: ROOM, op: "pause" }));

console.log("--- when no song is left");
await act(mem, "speakerConnect", { room: ROOM, ids: ["spa"] });
await owner("DELETE", "songs/spa");
await back(21_000);
ok("advance", await act(guest, "speakerControl", { room: ROOM, op: "advance" }));
check("the speaker clears itself", (await cdp()) === null);

await owner("DELETE", `rooms/${ROOM}`);
for (const id of ["spa", "spb", "spc"]) await owner("DELETE", `songs/${id}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
