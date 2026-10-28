// Fills the local emulator with a BeatShop to look at (not a test): hbboss has a machine in his own room with 4 beats and 4 simulated chats (the inbox, unread dots, raps),
// and a machine by "yungxware" stands in hbboss's hideout, where hbboss is a buyer (a beat bought 10 minutes ago: the green Download; an older one: only under SoundCloud > Profile).
// The beats are small synthesized loops (real playable WAV files). Run it again to reset.
//   terminal 1: npm run emulators (project root)   node test/seed-beatshop.mjs (server/)
const DB = "http://127.0.0.1:9000";
const NS = "demo-hotel-default-rtdb";
const owner = async (method, path, body) => {
  const r = await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};
const HB = process.argv[2] || "oUquA8FCcFQjF4zDTqDFV8s2SPTq"; // hbboss
const A1 = "fakeA1", A2 = "fakeA2", A3 = "fakeA3";
const NAMES = { [A1]: "Dj Mabs", [A2]: "yungxware", [A3]: "lemonade", [HB]: "hbboss" };
const RATE = 22050;

// ---- sound -----------------------------------------------------------------------------------------------------------------------------------
function loop(bpm, secs, seed) {
  const n = Math.floor(RATE * secs);
  const out = new Float32Array(n);
  const beat = (60 / bpm) * RATE;
  let r = seed;
  const rnd = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296 - 0.5; };
  for (let b = 0; b * beat < n; b++) {
    const t0 = Math.floor(b * beat);
    const step = b % 8;
    if ([0, 3, 4, 6].includes(step)) for (let i = 0; i < 0.22 * RATE && t0 + i < n; i++) { const t = i / RATE; out[t0 + i] += Math.sin(2 * Math.PI * (130 * Math.exp(-t * 18) + 38) * t) * Math.exp(-t * 11) * 0.9; }
    if (step === 2 || step === 6) for (let i = 0; i < 0.16 * RATE && t0 + i < n; i++) { const t = i / RATE; out[t0 + i] += rnd() * Math.exp(-t * 24) * 0.7; }
    for (let h = 0; h < 2; h++) { const th = t0 + Math.floor(h * beat / 2); for (let i = 0; i < 0.04 * RATE && th + i < n; i++) out[th + i] += rnd() * Math.exp(-(i / RATE) * 90) * 0.25; }
    const note = [55, 55, 65.4, 49][Math.floor(b / 8) % 4];
    for (let i = 0; i < beat && t0 + i < n; i++) out[t0 + i] += Math.sin(2 * Math.PI * note * (i / RATE)) * 0.18 * Math.exp(-(i / beat) * 1.2);
  }
  return out;
}
function voice(secs, seed) { // a rap: bursts of syllables
  const n = Math.floor(RATE * secs);
  const out = new Float32Array(n);
  let r = seed;
  const rnd = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };
  for (let at = 0; at < n;) {
    const len = Math.floor(RATE * (0.08 + rnd() * 0.14));
    const f = 90 + rnd() * 140;
    for (let i = 0; i < len && at + i < n; i++) out[at + i] += (Math.sin(2 * Math.PI * f * (i / RATE)) + 0.5 * Math.sin(2 * Math.PI * f * 2.1 * (i / RATE))) * Math.sin((Math.PI * i) / len) * 0.4;
    at += len + Math.floor(RATE * (rnd() < 0.2 ? 0.25 : 0.03));
  }
  return out;
}
function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0, "latin1"); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVEfmt ", 8, "latin1"); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36, "latin1"); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 0.8 * 32767), 44 + i * 2);
  return buf;
}
const PIECE = 510_000;
async function store(id, buf, meta) {
  const pieces = Math.ceil(buf.length / PIECE);
  await owner("PUT", `audioMeta/${id}`, { size: buf.length, pieces, mime: "audio/wav", status: "ready", at: Date.now(), ...meta });
  for (let i = 0; i < pieces; i++) await owner("PUT", `audio/${id}/${i}`, buf.subarray(i * PIECE, (i + 1) * PIECE).toString("base64"));
  return pieces;
}

// ---- beats -----------------------------------------------------------------------------------------------------------------------------------
const now = Date.now();
// the simulated players need an account to receive blood when somebody buys their beat
for (const uid of [A1, A2, A3]) if (!(await owner("GET", `users/${uid}/name`))) await owner("PUT", `users/${uid}`, { name: NAMES[uid], gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: now });
for (const p of ["beats", "beatBuys", "beatChats", "beatChatMsgs"]) await owner("DELETE", p);
const BEATS = [];
async function beat(sellerUid, id, title, price, bpm, secs, _unused, sold, seed, ago) {
  const whole = false; // (every beat has a 30 second preview; the beat itself is for its buyers)
  const samples = loop(bpm, secs, seed);
  const readers = { [sellerUid]: true };
  const pieces = await store(id, wav(samples), { owner: sellerUid, kind: "beat", durMs: secs * 1000, ...(whole ? { public: true } : { readers }) });
  let previewId = id, previewPieces = pieces, previewMs = secs * 1000;
  if (!whole) {
    previewId = "p" + id.slice(1);
    const cut = samples.subarray(Math.floor(RATE * 4), Math.floor(RATE * 34));
    previewPieces = await store(previewId, wav(cut), { owner: sellerUid, kind: "preview", durMs: 30_000 });
    previewMs = 30_000;
  }
  await owner("PUT", `beats/${sellerUid}/${id}`, { title, price, durMs: secs * 1000, size: pieces * PIECE, mime: "audio/wav", pieces, whole, sold, at: now - ago, ready: true, previewId, previewPieces, previewMs, previewMime: "audio/wav" });
  BEATS.push({ sellerUid, id, title });
  return { id, pieces, secs };
}
const bDark = await beat(HB, "bseedaaaa1", "Dark Trap", 100, 140, 40, false, 2, 11, 5 * 86400_000);
const bNight = await beat(HB, "bseedaaaa2", "Night Drive", 60, 90, 36, false, 1, 22, 3 * 86400_000);
await beat(HB, "bseedaaaa3", "Boom Bap", 25, 85, 30, true, 0, 33, 86400_000);
const bLoop = await beat(HB, "bseedaaaa4", "Cheap Loop", 5, 120, 20, true, 3, 44, 2 * 3600_000);
const bDrill = await beat(A2, "bseedbbbb1", "Drill Slide", 80, 150, 40, false, 0, 55, 86400_000);
const bLofi = await beat(A2, "bseedbbbb2", "Lofi Sunday", 15, 70, 30, true, 1, 66, 7200_000);

// ---- who bought what -------------------------------------------------------------------------------------------------------------------------
const buy = async (buyer, sellerUid, b, at) => {
  await owner("PUT", `beatBuys/${buyer}/${b.id}`, { owner: sellerUid, ownerName: NAMES[sellerUid], title: b.title ?? "?", mime: "audio/wav", pieces: b.pieces, durMs: b.secs * 1000, at });
  await owner("PUT", `audioMeta/${b.id}/readers/${buyer}`, true);
};
bDark.title = "Dark Trap"; bNight.title = "Night Drive"; bLoop.title = "Cheap Loop"; bLofi.title = "Lofi Sunday"; bDrill.title = "Drill Slide";
await buy(A1, HB, bDark, now - 4 * 86400_000); await buy(A2, HB, bDark, now - 3 * 3600_000); await buy(A3, HB, bNight, now - 86400_000);
await buy(A1, HB, bLoop, now - 3600_000); await buy(A2, HB, bLoop, now - 7200_000); await buy(A3, HB, bLoop, now - 9000_000);
await buy(HB, A2, bLofi, now - 10 * 60_000); // 10 minutes ago: the green Download is still in the shop
// an older beat that hbboss owns (only under SoundCloud > Profile > Owned beats)
const oldTape = await beat(A3, "bseedcccc1", "Old Tape", 30, 100, 24, true, 1, 77, 30 * 86400_000);
oldTape.title = "Old Tape";
await owner("DELETE", `beats/${A3}/${oldTape.id}`); // (no longer on sale: the file stays for the buyer)
await buy(HB, A3, oldTape, now - 5 * 86400_000);

// ---- chats -----------------------------------------------------------------------------------------------------------------------------------
async function chat(sellerUid, b, buyer, msgs, unreadOwner, unreadBuyer) {
  const key = `${b.id}_${buyer}`;
  let last = null;
  for (const [i, m] of msgs.entries()) {
    const by = m.by === "s" ? sellerUid : buyer;
    let audio;
    if (m.rap) {
      const rid = `rseed${b.id.slice(-5)}${buyer.slice(-2).toLowerCase()}${i}`;
      const pieces = await store(rid, wav(voice(m.rap, i * 7 + buyer.length)), { owner: by, kind: "reply", durMs: m.rap * 1000, readers: { [sellerUid]: true, [buyer]: true } });
      audio = { id: rid, pieces, mime: "audio/wav", durMs: m.rap * 1000 };
    }
    const at = now - m.ago;
    await owner("PUT", `beatChatMsgs/${sellerUid}/${key}/mseed${i}`, { by, name: NAMES[by], ...(m.text ? { text: m.text } : {}), ...(audio ? { audio } : {}), at });
    last = { text: m.text || "Audio reply", audio: !!audio, by, at };
  }
  await owner("PUT", `beatChats/${sellerUid}/${key}`, { beat: b.id, buyer, buyerName: NAMES[buyer], ownerName: NAMES[sellerUid], title: b.title, lastText: last.text, lastAudio: last.audio, lastBy: last.by, lastAt: last.at, unreadOwner, unreadBuyer });
}
await chat(HB, bDark, A1, [
  { by: "b", text: "yo this beat is fire, thinking of a verse about the basement", ago: 3 * 86400_000 },
  { by: "s", text: "thanks! send me a verse when it's done and i'll tell you what i think", ago: 3 * 86400_000 - 600_000 },
  { by: "b", rap: 14, ago: 25 * 60_000 },
], true, false);
await chat(HB, bDark, A2, [{ by: "b", text: "can you do the same one a bit slower?", ago: 40 * 60_000 }], true, false);
await chat(HB, bNight, A3, [{ by: "b", rap: 9, ago: 6 * 3600_000 }, { by: "s", text: "this is nice, keep the second part", ago: 5 * 3600_000 }], false, true);
await chat(HB, bLoop, A1, [{ by: "b", text: "cheap and good", ago: 50 * 60_000 }, { by: "s", text: "enjoy!", ago: 45 * 60_000 }], false, true);
await chat(A2, bLofi, HB, [{ by: "s", text: "thanks for buying Lofi Sunday! send your rap when you have one", ago: 9 * 60_000 }], false, true);

// ---- the machines -----------------------------------------------------------------------------------------------------------------------------
await owner("PUT", `users/${HB}/owned/item_f_beatshop`, true);
await owner("PUT", `roomsMeta/u_${HB}/furni/fbeatown1`, { kind: "f_beatshop", x: 2, y: 5, dir: 2 });
await owner("PUT", `roomsMeta/h_${HB}/furni/fbeatyung1`, { kind: "f_beatshop", x: 9, y: 9, dir: 2, by: A2 });
console.log("done: hbboss's own room has his BeatShop (tap it for the owner view); his hideout has yungxware's (the buyer view).");
