// Puts the four songs of the OG Community EP on SoundCloud "uploaded by bagmand" (so the app already has music when the update drops).
// They are the same mp3 files the EP CD plays (public/music/cd-*.mp3), cut into database pieces like any upload. Run it again to reset them (their votes too).
//   the local emulator:   node scripts/seed-og-ep.mjs
//   the live database:    DB_URL=https://<project>-default-rtdb.<region>.firebasedatabase.app TOKEN=$(gcloud auth print-access-token) node scripts/seed-og-ep.mjs
//   (TOKEN = any OAuth token or database secret of an owner of the project; it is only used for these writes)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const DB = (process.env.DB_URL || "http://127.0.0.1:9000").replace(/\/$/, "");
const NS = process.env.DB_URL ? "" : "&ns=demo-hotel-default-rtdb";
const TOKEN = process.env.TOKEN || "owner";
const PIECE_BYTES = 510_000; // (src/shared/audio.ts)
const put = async (p, body) => {
  const r = await fetch(`${DB}/${p}.json?x=1${NS}`, { method: "PUT", headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${p}: ${r.status} ${await r.text()}`);
};
// id, title, file, length in ms (ffprobe)
const SONGS = [
  ["sbagmand_kravle", "kravle - blodig oktober", "cd-blodigoktober.mp3", 94198],
  ["sbagmand_leolegit", "leolegit - blodoktober", "cd-leolegit-blodoktober.mp3", 52715],
  ["sbagmand_yungxware", "yungxware - russisk roulette", "cd-yungxware-russisk-roulette.mp3", 191687],
  ["sbagmand_lemonade", "lemonade - Dip Dip", "cd-lemonade-dip-dip.mp3", 95634],
];
const BAGMAND = { uid: "bagman", name: "bagmand", figure: "hd-190-1.hr-97012-42.ch-98188-1408.lg-98120-9004.sh-98136-1408.wa-98147-1408" };
await put(`profiles/${BAGMAND.uid}`, { name: BAGMAND.name, figure: BAGMAND.figure }); // (the face on his artist page)
const now = Date.now();
let i = 0;
for (const [id, title, file, durMs] of SONGS) {
  i++;
  const buf = fs.readFileSync(path.join(here, "..", "public", "music", file));
  const pieces = Math.ceil(buf.length / PIECE_BYTES);
  await put(`audioMeta/${id}`, { owner: BAGMAND.uid, kind: "song", size: buf.length, pieces, mime: "audio/mpeg", durMs, status: "ready", at: now });
  for (let p = 0; p < pieces; p++) await put(`audio/${id}/${p}`, buf.subarray(p * PIECE_BYTES, (p + 1) * PIECE_BYTES).toString("base64"));
  await put(`songs/${id}`, { owner: BAGMAND.uid, ownerName: BAGMAND.name, title, durMs, size: buf.length, mime: "audio/mpeg", pieces, at: now - i * 60_000, up: 0, down: 0, ready: true });
  console.log(`${title}: ${pieces} pieces`);
}
console.log("done: 4 songs on SoundCloud by bagmand");
