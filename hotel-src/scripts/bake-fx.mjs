// Bakes Habbo avatar effect libraries (.swf, e.g. from habboassets.com/swfs/effect) into what the game can draw:
//   node scripts/bake-fx.mjs <folder with the .swf files> [out folder = public/fx]
// For every effect it writes <id>.png (all the pictures of the effect in one sheet) and <id>.json (where each picture goes, frame by frame, and for every
// direction the avatar can face). Positions are in pixels at normal size, from the avatar's origin: x from the left edge of its 64 pixel wide picture,
// y from its feet. The SWF files are only read, nothing in them is run.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

/** which file is which effect (the ids are what the game calls them: see src/shared/unusualFx.ts) */
const EFFECTS = {
  confused: "CompletelyConfused",
  untouchable: "ESredUntouchable",
  chicks: "Easterchicks",
  fireflies: "Fireflies",
  flies: "Flies",
  lightning: "Lightning",
  mystic: "Mystic",
  raincloud: "Raincloud",
  snowwar: "Snowwarblue",
  hearts: "SpinningHeats",
  thumbsup: "SpinningThumbsUp",
  totem: "TotemEagle",
};
const FRAME_MS = 90; // how long one animation frame lasts (a frame can say it repeats)

const [dir, outArg] = process.argv.slice(2);
if (!dir) throw new Error("usage: node scripts/bake-fx.mjs <folder with .swf files> [out]");
const out = outArg ?? "public/fx";
mkdirSync(out, { recursive: true });

// ---- the SWF ------------------------------------------------------------------------------------------------------------------
function readSwf(file) {
  let buf = readFileSync(file);
  const sig = buf.subarray(0, 3).toString();
  if (sig === "CWS") buf = Buffer.concat([buf.subarray(0, 8), inflateSync(buf.subarray(8))]);
  else if (sig !== "FWS") throw new Error(`${file}: not a plain or zlib SWF`);
  let p = 8;
  p += Math.ceil((5 + (buf[p] >> 3) * 4) / 8) + 4;
  const symbols = [], bitmaps = {}, bins = {};
  while (p < buf.length) {
    const hdr = buf.readUInt16LE(p); p += 2;
    const type = hdr >> 6; let len = hdr & 63;
    if (len === 63) { len = buf.readUInt32LE(p); p += 4; }
    const body = buf.subarray(p, p + len); p += len;
    if (type === 76) { // several names can be the same picture
      let q = 2;
      for (let i = 0, n = body.readUInt16LE(0); i < n; i++) { const id = body.readUInt16LE(q); q += 2; let e = q; while (body[e]) e++; symbols.push([id, body.subarray(q, e).toString()]); q = e + 1; }
    } else if (type === 87) bins[body.readUInt16LE(0)] = body.subarray(6);
    else if (type === 36 || type === 20) { // lossless bitmap: palette (format 3) or direct colour (format 5); the colours of type 36 are premultiplied with the alpha
      const id = body.readUInt16LE(0), format = body[2], w = body.readUInt16LE(3), h = body.readUInt16LE(5);
      let q = 7, table = 0;
      if (format === 3) { table = body[q] + 1; q++; }
      const data = inflateSync(body.subarray(q));
      const rgba = Buffer.alloc(w * h * 4);
      const put = (o, r, g, b, a) => {
        if (a > 0 && a < 255 && type === 36) { r = Math.min(255, Math.round((r * 255) / a)); g = Math.min(255, Math.round((g * 255) / a)); b = Math.min(255, Math.round((b * 255) / a)); }
        rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = a;
      };
      if (format === 3) {
        const entry = type === 36 ? 4 : 3, row = (w + 3) & ~3;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = data[table * entry + y * row + x] , o = i * entry;
          put((y * w + x) * 4, data[o], data[o + 1], data[o + 2], type === 36 ? data[o + 3] : 255);
        }
      } else if (format === 5) {
        for (let i = 0; i < w * h; i++) {
          if (type === 36) put(i * 4, data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3], data[i * 4]);
          else put(i * 4, data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3], 255);
        }
      } else continue;
      bitmaps[id] = { w, h, rgba };
    }
  }
  const byName = {}, binByName = {};
  for (const [id, name] of symbols) { if (bitmaps[id]) byName[name] = bitmaps[id]; if (bins[id]) binByName[name] = bins[id]; }
  return { bitmaps: byName, bins: binByName };
}

// ---- a tiny XML reader ----------------------------------------------------------------------------------------------------------
function parseXml(src) {
  const root = { tag: "#", attrs: {}, kids: [] };
  const stack = [root];
  for (const m of src.matchAll(/<(\/?)([A-Za-z_][\w.-]*)([^>]*?)(\/?)>/g)) {
    if (m[1]) { stack.pop(); continue; }
    const attrs = {};
    for (const a of m[3].matchAll(/([\w:.-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    const node = { tag: m[2], attrs, kids: [] };
    stack[stack.length - 1].kids.push(node);
    if (!m[4]) stack.push(node);
  }
  return root;
}
const all = (n, tag, acc = []) => { for (const k of n.kids) { if (k.tag === tag) acc.push(k); all(k, tag, acc); } return acc; };

// ---- the PNG writer ---------------------------------------------------------------------------------------------------------------
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4); data.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// ---- one effect ---------------------------------------------------------------------------------------------------------------------
function bake(id, name) {
  const { bitmaps, bins } = readSwf(`${dir}/${name}.swf`);
  const manifestKey = Object.keys(bins).find((k) => k.endsWith("_manifest")), animKey = Object.keys(bins).find((k) => k.endsWith("_animation"));
  if (!manifestKey || !animKey) throw new Error(`${name}: no manifest or animation`);
  const lib = manifestKey.slice(0, -"_manifest".length);
  const pics = {}; // asset name -> bitmap (the library's own name in front is dropped)
  for (const [k, v] of Object.entries(bitmaps)) pics[k.startsWith(lib + "_") ? k.slice(lib.length + 1) : k] = v;
  const manifest = parseXml(bins[manifestKey].toString());
  const offset = {}, alias = {};
  for (const a of all(manifest, "asset")) {
    const o = all(a, "param").find((p) => p.attrs.key === "offset");
    if (o) { const [x, y] = o.attrs.value.split(",").map(Number); offset[a.attrs.name] = { x, y }; }
  }
  for (const a of all(manifest, "alias")) alias[a.attrs.name] = a.attrs.link;
  const resolve = (n) => { for (let i = 0; i < 6 && !pics[n] && alias[n]; i++) n = alias[n]; return pics[n] ? n : null; };
  const offsetOf = (n, orig) => offset[orig] ?? offset[n] ?? { x: 0, y: 0 };

  const anim = parseXml(bins[animKey].toString());
  const sprites = {};
  for (const s of all(anim, "sprite")) {
    const dirs = {};
    for (const d of all(s, "direction")) dirs[Number(d.attrs.id)] = { dx: Number(d.attrs.dx ?? 0), dy: Number(d.attrs.dy ?? 0), dz: Number(d.attrs.dz ?? 0) };
    sprites[s.attrs.id] = { member: s.attrs.member, directional: s.attrs.directions === "1", ink: Number(s.attrs.ink ?? 0), dirs };
  }
  const frames = all(anim, "frame").map((f) => ({ repeats: Math.max(1, Number(f.attrs.repeats ?? 1)), fx: f.kids.filter((k) => k.tag === "fx").map((k) => ({ id: k.attrs.id, frame: Number(k.attrs.frame ?? 0), dx: Number(k.attrs.dx ?? 0), dy: Number(k.attrs.dy ?? 0) })) }));
  const directional = Object.values(sprites).some((s) => s.directional);

  // which directions have their own pictures (for a directional sprite): the nearest one is used for the others
  const hasDir = (member, d) => Object.keys(pics).some((n) => n.startsWith(`h_${member}_${d}_`)) || Object.keys(offset).some((n) => n.startsWith(`h_${member}_${d}_`));
  const dirsFor = (member) => [0, 1, 2, 3, 4, 5, 6, 7].filter((d) => hasDir(member, d));
  const nearest = (member, want) => {
    const have = dirsFor(member);
    if (!have.length) return 0;
    return have.slice().sort((a, b) => Math.min((a - want + 8) % 8, (want - a + 8) % 8) - Math.min((b - want + 8) % 8, (want - b + 8) % 8))[0];
  };

  const rects = []; // the pictures in the sheet: {key, bmp}
  const rectOf = new Map();
  const useRect = (bmp, key) => { if (!rectOf.has(key)) { rectOf.set(key, rects.length); rects.push({ key, bmp }); } return rectOf.get(key); };
  // ink 33 is "add": black is nothing and the colour adds up on whatever is behind. The room is pale, so it is turned into an ordinary picture instead: the brightness becomes the alpha.
  const glowed = new Map();
  const glow = (bmp) => {
    let g = glowed.get(bmp);
    if (g) return g;
    const rgba = Buffer.alloc(bmp.rgba.length);
    for (let i = 0; i < bmp.w * bmp.h; i++) {
      const r = bmp.rgba[i * 4], gr = bmp.rgba[i * 4 + 1], b = bmp.rgba[i * 4 + 2], a = bmp.rgba[i * 4 + 3];
      const m = Math.max(r, gr, b);
      if (!m || !a) continue;
      rgba[i * 4] = Math.min(255, Math.round((r * 255) / m)); rgba[i * 4 + 1] = Math.min(255, Math.round((gr * 255) / m)); rgba[i * 4 + 2] = Math.min(255, Math.round((b * 255) / m));
      rgba[i * 4 + 3] = Math.min(255, Math.round((m * 0.72 * a) / 255));
    }
    g = { w: bmp.w, h: bmp.h, rgba };
    glowed.set(bmp, g);
    return g;
  };
  const sameBmp = new Map(); // (identical pictures are kept once)
  const hash = (bmp) => `${bmp.w}x${bmp.h}:${bmp.rgba.toString("base64")}`;

  const outDirs = directional ? [0, 1, 2, 3, 4, 5, 6, 7] : [0];
  const result = {};
  for (const d of outDirs) {
    result[d] = frames.map((f) => {
      const layers = [];
      for (const fx of f.fx) {
        const sp = sprites[fx.id];
        if (!sp) continue;
        const dd = sp.dirs[d] ?? sp.dirs[0] ?? { dx: 0, dy: 0, dz: 1 };
        const useDir = sp.directional ? nearest(sp.member, d) : 0;
        const orig = `h_${sp.member}_${useDir}_${fx.frame}`;
        const n = resolve(orig);
        if (!n) continue;
        const bmp = sp.ink === 33 ? glow(pics[n]) : pics[n];
        const hk = hash(bmp);
        if (!sameBmp.has(hk)) sameBmp.set(hk, n);
        const idx = useRect(bmp, sameBmp.get(hk));
        const o = offsetOf(n, orig);
        layers.push([idx, -o.x + dd.dx + fx.dx, -o.y + dd.dy + fx.dy, dd.dz]);
      }
      layers.sort((a, b) => a[3] - b[3]);
      return { ms: f.repeats * FRAME_MS, s: layers };
    });
  }

  // the sheet: pictures side by side in rows
  const MAXW = 1024;
  let x = 0, y = 0, rowH = 0, W = 1;
  const placed = rects.map((r) => { if (x + r.bmp.w + 1 > MAXW) { x = 0; y += rowH + 1; rowH = 0; } const at = [x, y, r.bmp.w, r.bmp.h]; x += r.bmp.w + 1; rowH = Math.max(rowH, r.bmp.h); W = Math.max(W, x); return at; });
  const H = Math.max(1, y + rowH);
  const sheet = Buffer.alloc(W * H * 4);
  rects.forEach((r, i) => { const [px, py] = placed[i]; for (let yy = 0; yy < r.bmp.h; yy++) r.bmp.rgba.copy(sheet, ((py + yy) * W + px) * 4, yy * r.bmp.w * 4, (yy + 1) * r.bmp.w * 4); });
  writeFileSync(`${out}/${id}.png`, png(W, H, sheet));
  const json = { w: W, h: H, rects: placed, ink: Object.fromEntries(Object.entries(sprites).map(([k, v]) => [k, v.ink])), anim: directional ? result : { "*": result[0] } };
  writeFileSync(`${out}/${id}.json`, JSON.stringify(json));
  const total = result[0].reduce((n, f) => n + f.ms, 0);
  console.log(`${id}: ${rects.length} pictures, ${frames.length} frames (${total} ms), ${directional ? "per direction" : "one for all directions"}, sheet ${W}x${H}`);
}

for (const [id, name] of Object.entries(EFFECTS)) bake(id, name);
