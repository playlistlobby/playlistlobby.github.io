// Fills the local emulator with SoundCloud songs to look at (not a test; the songs test wipes them): 8 songs with votes, made by "Dj Mabs", "yungxware", "lemonade" and hbboss.
// Every song is a small synthesized loop (a real playable WAV). Run it again to reset.
//   terminal 1: npm run emulators (project root)   node test/seed-songs.mjs [hbboss uid] (server/)
const DB = "http://127.0.0.1:9000";
const NS = "demo-hotel-default-rtdb";
const owner = async (method, path, body) => {
  const r = await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};
const HB = process.argv[2] || "oUquA8FCcFQjF4zDTqDFV8s2SPTq";
const RATE = 22050;
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
    const note = [55, 65.4, 73.4, 49][Math.floor(b / 8) % 4] * (1 + (seed % 3) * 0.12);
    for (let i = 0; i < beat && t0 + i < n; i++) out[t0 + i] += Math.sin(2 * Math.PI * note * (i / RATE)) * 0.2 * Math.exp(-(i / beat) * 1.2);
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
const NAMES = { fakeA1: "Dj Mabs", fakeA2: "yungxware", fakeA3: "lemonade", [HB]: "hbboss" };
const SONGS = [
  ["sseedsong1", "fakeA1", "Rooftop", 94, 14, 2, 100], ["sseedsong2", "fakeA2", "Blodig oktober pt 2", 98, 31, 4, 95], ["sseedsong3", "fakeA3", "Dip dip", 102, 9, 9, 120],
  ["sseedsong4", "fakeA3", "Taxa", 114, 4, 0, 88], ["sseedsong5", "fakeA1", "Natbus", 118, 18, 3, 105], ["sseedsong6", "fakeA2", "Russisk roulette", 110, 22, 1, 92],
  [`sseedsong7`, HB, "Basement tape", 15, 0, 0, 80], [`sseedsong8`, HB, "Night drive", 12, 0, 0, 130],
];
await owner("DELETE", "songs"); await owner("DELETE", "songVotes"); await owner("DELETE", "myVotes");
const now = Date.now();
let i = 0;
for (const [id, who, title, secs, up, down, bpm] of SONGS) {
  i++;
  const buf = wav(loop(bpm, secs, i * 17));
  const pieces = Math.ceil(buf.length / 510_000);
  await owner("PUT", `audioMeta/${id}`, { owner: who, kind: "song", size: buf.length, pieces, mime: "audio/wav", durMs: secs * 1000, status: "ready", at: now });
  for (let p = 0; p < pieces; p++) await owner("PUT", `audio/${id}/${p}`, buf.subarray(p * 510_000, (p + 1) * 510_000).toString("base64"));
  await owner("PUT", `songs/${id}`, { owner: who, ownerName: NAMES[who], title, durMs: secs * 1000, size: buf.length, mime: "audio/wav", pieces, at: now - i * 600_000 - 3_600_000, up, down, ready: true });
}
console.log("done: 8 songs on SoundCloud");
