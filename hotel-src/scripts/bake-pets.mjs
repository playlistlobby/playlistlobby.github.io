// Bakes Habbo pet libraries (.swf, e.g. from habboassets.com/swfs/pet) into what the game can draw:
//   node scripts/bake-pets.mjs <folder with the .swf files> [out folder = public/pets]
// For every pet it writes <name>.png (a sheet of ready-made frames: the layers put together for each direction and pose; the red channel of every
// pixel is a palette index, so one sheet gives every colour variant) and <name>.json (the cell size, where the pet stands in a cell, which rows are
// which pose, and the colour palettes as base64). It also writes src/shared/pets.ts (the list of pets and how many colours each has).
// The SWF files are only read, nothing in them is run.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

const [dir, outArg] = process.argv.slice(2);
if (!dir) throw new Error("usage: node scripts/bake-pets.mjs <folder with .swf files> [out]");
const out = outArg ?? "public/pets";
mkdirSync(out, { recursive: true });

// ---- the SWF: bitmaps by symbol name, and the binary data (xml, palettes) by symbol name -------------------------------------
function readSwf(file) {
  let buf = readFileSync(file);
  const sig = buf.subarray(0, 3).toString();
  if (sig === "CWS") buf = Buffer.concat([buf.subarray(0, 8), inflateSync(buf.subarray(8))]);
  else if (sig !== "FWS") throw new Error(`${file}: not a plain or zlib SWF`);
  let p = 8;
  p += Math.ceil((5 + (buf[p] >> 3) * 4) / 8) + 4;
  const symbols = {}, bitmaps = {}, bins = {};
  while (p < buf.length) {
    const hdr = buf.readUInt16LE(p); p += 2;
    const type = hdr >> 6; let len = hdr & 63;
    if (len === 63) { len = buf.readUInt32LE(p); p += 4; }
    const body = buf.subarray(p, p + len); p += len;
    if (type === 76) {
      let q = 2;
      for (let i = 0, n = body.readUInt16LE(0); i < n; i++) { const id = body.readUInt16LE(q); q += 2; let e = q; while (body[e]) e++; symbols[id] = body.subarray(q, e).toString(); q = e + 1; }
    } else if (type === 87) bins[body.readUInt16LE(0)] = body.subarray(6);
    else if (type === 36 || type === 20) { // lossless bitmap: palette (format 3) or direct colour (format 5)
      const id = body.readUInt16LE(0), format = body[2], w = body.readUInt16LE(3), h = body.readUInt16LE(5);
      let q = 7, table = 0;
      if (format === 3) { table = body[q] + 1; q++; }
      const data = inflateSync(body.subarray(q));
      const idx = new Uint8Array(w * h), alpha = new Uint8Array(w * h), rgb = new Uint8Array(w * h * 3);
      if (format === 3) {
        const entry = type === 36 ? 4 : 3, row = (w + 3) & ~3;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = data[table * entry + y * row + x]; idx[y * w + x] = i; alpha[y * w + x] = type === 36 ? data[i * 4 + 3] : 255; }
      } else if (format === 5) {
        // the pets' sprites are grey: the grey level of a pixel is its place in the palette (palette_N.bin: 256 colours of 3 bytes)
        for (let i = 0; i < w * h; i++) { const a = data[i * 4]; alpha[i] = a; idx[i] = a ? Math.min(255, Math.round(data[i * 4 + 1] * 255 / a)) : 0; for (let c = 0; c < 3; c++) rgb[i * 3 + c] = a ? Math.min(255, Math.round(data[i * 4 + 1 + c] * 255 / a)) : 0; }
      } else continue;
      bitmaps[id] = { w, h, idx, alpha, rgb: format === 5 ? rgb : null };
    }
  }
  const byName = {}, binByName = {};
  for (const [id, name] of Object.entries(symbols)) { if (bitmaps[id]) byName[name] = bitmaps[id]; if (bins[id]) binByName[name] = bins[id]; }
  return { bitmaps: byName, bins: binByName };
}

// ---- a tiny XML reader ------------------------------------------------------------------------------------------------------
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
const find = (n, tag) => n.kids.filter((k) => k.tag === tag);

// ---- the PNG writer ----------------------------------------------------------------------------------------------------------
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// ---- one pet ------------------------------------------------------------------------------------------------------------------
const POSES = { std: 0, mv: 13, sit: 10, lay: 6 };
const summary = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith(".swf")).sort()) {
  const pet = file.replace(/\.swf$/, "");
  const { bitmaps, bins } = readSwf(`${dir}/${file}`);
  const xmlOf = (suffix) => { const k = Object.keys(bins).find((n) => n.endsWith(suffix)); return k ? bins[k].toString("utf8") : null; };
  const assetsXml = xmlOf(`${pet}_assets`) ?? xmlOf("_assets"), visXml = xmlOf(`${pet}_visualization`) ?? xmlOf("_visualization");
  if (!assetsXml || !visXml) { console.warn(`${pet}: no assets or visualization, skipped`); continue; }
  const assets = {};
  for (const a of find(find(parseXml(assetsXml), "assets")[0] ?? parseXml(assetsXml), "asset")) assets[a.attrs.name] = a.attrs;
  const vis = find(find(find(parseXml(visXml), "visualizationData")[0], "graphics")[0], "visualization").find((v) => v.attrs.size === "64");
  if (!vis) { console.warn(`${pet}: no 64px visualization, skipped`); continue; }
  const layerTags = {};
  for (const l of find(find(vis, "layers")[0] ?? { kids: [] }, "layer")) layerTags[l.attrs.id] = l.attrs.tag;
  if (!Object.keys(layerTags).length) { // an older pet: the layers are the letters its assets use (a, b, c...), the shadow (sd) is left out
    for (const n of Object.keys(assets)) { const m = new RegExp(`^${pet}_64_([a-z])_`).exec(n); if (m) layerTags[m[1].charCodeAt(0) - 97] = "layer"; }
  }
  const dirZ = {};
  for (const d of find(find(vis, "directions")[0] ?? { kids: [] }, "direction")) { dirZ[d.attrs.id] = {}; for (const l of find(d, "layer")) dirZ[d.attrs.id][l.attrs.id] = Number(l.attrs.z ?? 0); }
  const anims = {};
  for (const an of find(find(vis, "animations")[0] ?? { kids: [] }, "animation")) {
    const layers = {};
    for (const al of find(an, "animationLayer")) {
      layers[al.attrs.id] = find(find(al, "frameSequence")[0] ?? { kids: [] }, "frame").map((f) => {
        const offs = {};
        for (const o of find(find(f, "offsets")[0] ?? { kids: [] }, "offset")) offs[o.attrs.direction] = { x: Number(o.attrs.x ?? 0), y: Number(o.attrs.y ?? 0) };
        return { id: f.attrs.id, offs };
      });
    }
    anims[an.attrs.id] = layers;
  }
  const sprite = (layerId, dir, frameId) => {
    const name = `${pet}_64_${String.fromCharCode(97 + Number(layerId))}_${dir}_${frameId}`;
    const a = assets[name];
    if (!a) return null;
    const bmp = bitmaps[`${pet}_${a.source ?? name}`] ?? bitmaps[`${pet}_${name}`];
    if (!bmp) return null;
    const flip = a.flipH === "1";
    return { bmp, flip, pal: a.usesPalette === "1" || !bmp.rgb, left: flip ? Number(a.x) - bmp.w : -Number(a.x), top: -Number(a.y) };
  };
  // the frames of every pose: for each step and direction, the sprites with where they go
  const rows = [], rowOf = {};
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  for (const [pose, animId] of Object.entries(POSES)) {
    const an = anims[animId];
    if (!an && pose !== "std") continue;
    const layers = an ?? {};
    const steps = pose === "mv" ? Math.min(6, Math.max(1, ...Object.values(layers).map((s) => s.length))) : 1; // (standing, sitting and lying are one still picture; walking is up to 6 frames)
    rowOf[pose] = [];
    for (let step = 0; step < steps; step++) {
      const cells = [];
      for (let d = 0; d < 8; d++) {
        const parts = [];
        for (const id of Object.keys(layerTags)) {
          if (/emoticon|shadow/.test(layerTags[id])) continue;
          const seq = layers[id];
          const f = seq?.length ? seq[step % seq.length] : { id: "0", offs: {} };
          const s = sprite(id, d, f.id);
          if (!s) continue;
          const o = f.offs[d] ?? { x: 0, y: 0 };
          const left = s.left + o.x, top = s.top + o.y;
          parts.push({ ...s, left, top, z: dirZ[d]?.[id] ?? 0 });
          minX = Math.min(minX, left); minY = Math.min(minY, top); maxX = Math.max(maxX, left + s.bmp.w); maxY = Math.max(maxY, top + s.bmp.h);
        }
        parts.sort((p, q) => p.z - q.z);
        cells.push(parts);
      }
      rowOf[pose].push(rows.length);
      rows.push(cells);
    }
  }
  const palettes = Object.keys(bins).filter((n) => /_palette_\d+$/.test(n)).sort((a, b) => Number(a.split("_").pop()) - Number(b.split("_").pop())).map((n) => bins[n].toString("base64"));
  const hasPalette = palettes.length > 0;
  const W = Math.ceil(maxX - minX) + 2, H = Math.ceil(maxY - minY) + 2;
  const ox = Math.round(-minX) + 1, oy = Math.round(-minY) + 1;
  const sheet = Buffer.alloc(W * 8 * H * rows.length * 4);
  rows.forEach((cells, r) => cells.forEach((parts, d) => {
    for (const p of parts) {
      for (let y = 0; y < p.bmp.h; y++) for (let x = 0; x < p.bmp.w; x++) {
        const sx = p.flip ? p.bmp.w - 1 - x : x;
        const si = y * p.bmp.w + sx;
        if (!p.bmp.alpha[si]) continue;
        const px = d * W + ox + Math.round(p.left) + x, py = r * H + oy + Math.round(p.top) + y;
        const o = (py * W * 8 + px) * 4;
        if (p.pal && hasPalette) { sheet[o] = p.bmp.idx[si]; sheet[o + 1] = 0; sheet[o + 2] = 0; sheet[o + 3] = 254; } // (alpha 254 = "a palette index in the red channel")
        else { sheet[o] = p.bmp.rgb ? p.bmp.rgb[si * 3] : p.bmp.idx[si]; sheet[o + 1] = p.bmp.rgb ? p.bmp.rgb[si * 3 + 1] : p.bmp.idx[si]; sheet[o + 2] = p.bmp.rgb ? p.bmp.rgb[si * 3 + 2] : p.bmp.idx[si]; sheet[o + 3] = p.bmp.alpha[si] === 254 ? 255 : p.bmp.alpha[si]; }
      }
    }
  }));
  writeFileSync(`${out}/${pet}.png`, png(W * 8, H * rows.length, sheet));
  if (process.env.PREVIEW) { // (a coloured look at the first colour, for checking the bake)
    const pal = Buffer.from(palettes[Number(process.env.PREVIEW) || 0], "base64");
    const prev = Buffer.from(sheet);
    for (let i = 0; i < prev.length; i += 4) if (prev[i + 3] === 254) { const k = prev[i]; prev[i] = pal[k * 3]; prev[i + 1] = pal[k * 3 + 1]; prev[i + 2] = pal[k * 3 + 2]; }
    writeFileSync(`${out}/${pet}_preview.png`, png(W * 8, H * rows.length, prev));
  }
  writeFileSync(`${out}/${pet}.json`, JSON.stringify({ name: pet, w: W, h: H, ox, oy, rows: rowOf, palettes }));
  summary[pet] = palettes.length;
  console.log(`${pet}: ${rows.length} rows of 8, cell ${W}x${H}, ${palettes.length} palettes`);
}
writeFileSync("src/shared/pets.ts", `// The pets the pet merchant sells (made by scripts/bake-pets.mjs from Habbo's pet libraries): name -> how many colours it comes in.
// A pet's price is between 1000 and 2000 blood, from its name.
export const PET_COLORS: Record<string, number> = ${JSON.stringify(summary, null, 2)};
export const PET_TYPES: string[] = Object.keys(PET_COLORS);
export const petPrice = (type: string): number => {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return 1000 + (h % 11) * 100;
};
`);
