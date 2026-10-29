// SoundCloud: uploading (pieces, limits, who may write what), voting, the Charts rules, the hourly clean-up, and donating to a hideout
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/songs.mjs (server/)
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
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const readAs = (u, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const refused = (r) => r.status === 401 || r.status === 403;
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;

// a tiny "mp3": an ID3 tag and filler (the server only looks at how it starts and at the sizes)
const fakeAudio = (n, head = "ID3") => { const b = Buffer.alloc(n, 7); b.write(head, 0, "latin1"); b[3] = 3; return b; };
const PIECE = 510_000;
const pieces = (buf) => { const out = []; for (let i = 0; i < buf.length; i += PIECE) out.push(buf.subarray(i, i + PIECE).toString("base64")); return out; };
const clean = async () => { for (const p of ["songs", "songVotes", "myVotes", "audioMeta", "audio", "audioUploads", "songMeta", "songArchive", "donations"]) await owner("DELETE", p); };
async function upload(u, title, buf = fakeAudio(5000), durMs = 60_000, mime = "audio/mpeg") {
  const b = await act(u, "songBegin", { title, durMs, size: buf.length, mime });
  if (!b.ok) return b;
  const ps = pieces(buf);
  for (let i = 0; i < ps.length; i++) await clientWrite(u, `audio/${b.data.id}/${i}`, ps[i]);
  const f = await act(u, "songFinish", { id: b.data.id });
  return { ...f, id: b.data.id };
}

await clean();
const a = await fresh("t_sc_a", { blood: 500 }), b = await fresh("t_sc_b", { blood: 500 }), c = await fresh("t_sc_c", { blood: 500 }), mod = await fresh("t_sc_mod", { blood: 500 });
await owner("PUT", `roles/${mod.uid}`, "mod");
for (const u of [a, b, c, mod]) await act(u, "sync");

console.log("--- uploading a song");
bad("a song needs a title", await act(a, "songBegin", { title: "  ", durMs: 60000, size: 5000, mime: "audio/mpeg" }));
bad("not over 4 MB", await act(a, "songBegin", { title: "big", durMs: 60000, size: 4_000_001, mime: "audio/mpeg" }));
bad("not over 3 minutes", await act(a, "songBegin", { title: "long", durMs: 181_000, size: 5000, mime: "audio/mpeg" }));
bad("not under 10 seconds", await act(a, "songBegin", { title: "short", durMs: 5000, size: 5000, mime: "audio/mpeg" }));
bad("only sound files", await act(a, "songBegin", { title: "pic", durMs: 60000, size: 5000, mime: "image/png" }));
const begin = await act(a, "songBegin", { title: "  My *first* song 🎵 ", durMs: 61_000, size: 5000, mime: "audio/mpeg" });
ok("begin", begin);
const id1 = begin.data.id;
check("the title is cleaned (no marks or emoji)", (await owner("GET", `songs/${id1}`))?.title === "My first song", JSON.stringify(await owner("GET", `songs/${id1}`)));
check("it is not on SoundCloud yet (not ready)", (await owner("GET", `songs/${id1}`))?.ready === false);
bad("finishing before the pieces are there fails", await act(a, "songFinish", { id: id1 }));
check("a stranger can't write pieces of my upload", refused(await clientWrite(b, `audio/${id1}/0`, "AAAA")));
check("a piece over 700,000 characters is refused", refused(await clientWrite(a, `audio/${id1}/0`, "A".repeat(700_001))));
check("and a piece number over 19", refused(await clientWrite(a, `audio/${id1}/20`, "AAAA")));
check("the owner writes the piece", !refused(await clientWrite(a, `audio/${id1}/0`, fakeAudio(5000).toString("base64"))));
check("nobody can hear it while it is still being uploaded", refused((await readAs(b, `audio/${id1}/0`))));
ok("finish", await act(a, "songFinish", { id: id1 }));
check("the song is ready", (await owner("GET", `songs/${id1}`))?.ready === true && (await owner("GET", `audioMeta/${id1}/status`)) === "ready");
check("now everybody can read its pieces", (await readAs(b, `audio/${id1}/0`)).status === 200);
check("and the list of songs", (await readAs(b, "songs")).status === 200);
bad("a file that isn't sound is turned away at the end", await upload(a, "fake", fakeAudio(5000, "XXX")));
const many = [];
for (let i = 0; i < 3; i++) many.push(await upload(a, `song ${i}`, fakeAudio(3000 + i)));
check("5 songs fit (this one, the unfinished fake one, and three more: an upload that was begun counts for an hour)", many.every((r) => r.ok));
bad("the sixth is refused", await act(a, "songBegin", { title: "six", durMs: 60000, size: 5000, mime: "audio/mpeg" }));
const big = await upload(b, "two pieces", fakeAudio(PIECE + 4000));
ok("a file in two pieces", big);
check("it has two pieces", (await owner("GET", `audioMeta/${big.id}/pieces`)) === 2);
bad("a file that doesn't match its size is refused", await (async () => { const r = await act(c, "songBegin", { title: "liar", durMs: 60000, size: PIECE + 4000, mime: "audio/mpeg" }); if (!r.ok) return r; await clientWrite(c, `audio/${r.data.id}/0`, pieces(fakeAudio(PIECE))[0]); await clientWrite(c, `audio/${r.data.id}/1`, "AAAA"); return act(c, "songFinish", { id: r.data.id }); })());

console.log("--- voting");
const cl = await upload(c, "voted on", fakeAudio(4000));
ok("b votes it up", await act(b, "songVote", { id: cl.id, v: 1 }));
check("1 up", (await owner("GET", `songs/${cl.id}`))?.up === 1 && (await owner("GET", `songs/${cl.id}`))?.down === 0);
bad("a down vote is refused: up votes only", await act(b, "songVote", { id: cl.id, v: -1 }));
check("still 1 up, 0 down", (await owner("GET", `songs/${cl.id}`))?.up === 1 && (await owner("GET", `songs/${cl.id}`))?.down === 0);
ok("a takes a second vote up", await act(a, "songVote", { id: cl.id, v: 1 }));
ok("b takes the vote back", await act(b, "songVote", { id: cl.id, v: 0 }));
check("1 up, 0 down", (await owner("GET", `songs/${cl.id}`))?.up === 1 && (await owner("GET", `songs/${cl.id}`))?.down === 0);
bad("not on your own song", await act(c, "songVote", { id: cl.id, v: 1 }));
bad("not on a song that isn't there", await act(b, "songVote", { id: "nosuch", v: 1 }));
bad("a vote is 1, 0 or -1", await act(b, "songVote", { id: cl.id, v: 5 }));
check("my votes can be read by me", (await readAs(a, `myVotes/${a.uid}`)).body?.[cl.id] === 1);
check("but not by somebody else", refused(await readAs(b, `myVotes/${a.uid}`)));
check("and the votes per song are nobody's to read", refused(await readAs(b, `songVotes/${cl.id}`)));

console.log("--- taking one off");
bad("a stranger can't take my song off", await act(b, "songDelete", { id: id1 }));
ok("the owner takes it off", await act(a, "songDelete", { id: id1 }));
check("its row and its pieces are gone", (await owner("GET", `songs/${id1}`)) === null && (await owner("GET", `audio/${id1}`)) === null && (await owner("GET", `audioMeta/${id1}`)) === null);
ok("a mod can take any song off", await act(mod, "songDelete", { id: many[0].id }));

console.log("--- the hourly clean-up");
await clean();
const old = Date.now() - 3 * 3_600_000;
const mk = (n, up, down, at = old, pressed = 0) => owner("PUT", `songs/sw${n}`, { owner: a.uid, ownerName: "t_sc_a", title: `s${n}`, durMs: 60000, size: 1000, mime: "audio/mpeg", pieces: 1, at, up, down, ready: true, ...(pressed ? { pressed } : {}) })
  .then(() => owner("PUT", `audioMeta/sw${n}`, { owner: a.uid, kind: "song", size: 1000, pieces: 1, mime: "audio/mpeg", durMs: 60000, status: "ready", at }))
  .then(() => owner("PUT", `audio/sw${n}/0`, fakeAudio(1000).toString("base64")));
// 20 songs: 1..20 with a better rating the higher the number; the 3 worst are also the youngest (under an hour old) and a pressed one is among the worst
for (let n = 1; n <= 20; n++) await mk(n, n * 2, 20 - n, n <= 3 ? Date.now() - 60_000 : old, n === 4 ? 2 : 0);
const sw = await act(b, "songSweep");
ok("sweep", sw);
check("nothing is taken off for a low rating any more", sw.data?.swept === 0, JSON.stringify(sw.data));
const left = Object.keys((await owner("GET", "songs")) ?? {});
check("all 20 are still there, with their audio", left.length === 20 && (await owner("GET", "audio/sw5/0")) !== null && (await owner("GET", "songArchive/sw4")) === null, String(left.length));
await owner("PUT", "songs/unfinished", { owner: a.uid, ownerName: "t_sc_a", title: "never finished", durMs: 60000, size: 1000, mime: "audio/mpeg", pieces: 1, at: Date.now() - 2 * 3_600_000 });
await owner("PUT", "songMeta/lastSweep", 0);
await act(b, "songSweep");
check("an upload that was never finished is still cleared away", (await owner("GET", "songs/unfinished")) === null);

console.log("--- donating to a hideout");
await clean();
const own = await fresh("t_sc_own", { blood: 0 }), donor = await fresh("t_sc_donor", { blood: 5000 });
for (const u of [own, donor]) await act(u, "sync");
const R = `h_${own.uid}`;
await owner("PUT", `roomsMeta/${R}`, { owner: own.uid, ownerName: "t_sc_own", name: "hq", access: "open", w: 14, h: 14 });
await owner("DELETE", `hideoutTill/${own.uid}`);
bad("not from outside the room", await act(donor, "hideoutDonate", { room: R, amount: 100 }));
await owner("PUT", `rooms/${R}/players/${donor.uid}`, { name: donor.name, figure: "x", x: 3, y: 3, dir: 2 });
await owner("PUT", `rooms/${R}/players/${own.uid}`, { name: own.name, figure: "x", x: 4, y: 4, dir: 2 });
bad("not to your own hideout", await act(own, "hideoutDonate", { room: R, amount: 100 }));
bad("a donation is 1 to 1000", await act(donor, "hideoutDonate", { room: R, amount: 0 }));
bad("and not over 1000", await act(donor, "hideoutDonate", { room: R, amount: 1001 }));
const d1 = await act(donor, "hideoutDonate", { room: R, amount: 100 });
ok("100 given", d1);
check("the owner's table earnings got it", (await owner("GET", `hideoutTill/${own.uid}`))?.blood === 100 && (await bloodOf(donor)) === 4900, JSON.stringify(await owner("GET", `hideoutTill/${own.uid}`)));
check("900 left for today", d1.data?.left === 900, JSON.stringify(d1.data));
ok("900 more", await act(donor, "hideoutDonate", { room: R, amount: 900 }));
bad("that is the most for a day", await act(donor, "hideoutDonate", { room: R, amount: 1 }));
check("the owner has 1000 waiting and can collect it", (await owner("GET", `hideoutTill/${own.uid}`))?.blood === 1000);
ok("collect", await act(own, "hideoutTillCollect"));
check("1000 in the owner's pocket", (await bloodOf(own)) === 1000);
await owner("PUT", `donations/${donor.uid}`, { day: Math.floor(Date.now() / 86_400_000) - 1, n: 1000 });
ok("the next day you can give again", await act(donor, "hideoutDonate", { room: R, amount: 50 }));
await owner("PUT", `users/${donor.uid}/blood`, 10);
bad("not more than you have", await act(donor, "hideoutDonate", { room: R, amount: 50 }));
await clean(); await owner("DELETE", `hideoutTill/${own.uid}`); await owner("DELETE", `roomsMeta/${R}`); await owner("DELETE", `rooms/${R}`); await owner("DELETE", "roles");

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
