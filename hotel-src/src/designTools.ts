// Studio helpers that work on a Draft: pattern fill, importing PNG/ZIP art, exporting a template pack.
import { Draft, DraftFrame, frameName, parseFrameKey } from "./designs";
import { makeZip, text, ZipFile } from "./zip";
import { unzip } from "./unzip";

const newCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

const canvasToBytes = async (c: HTMLCanvasElement): Promise<Uint8Array> => {
  // toDataURL encodes synchronously; toBlob can stall for a second per call in background tabs
  const url = c.toDataURL("image/png");
  const bin = atob(url.slice(url.indexOf(",") + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// ---- pattern fill ---------------------------------------------------------------------------------------
export type PatternKind = "stripes" | "checks" | "dots" | "diagonal" | "zigzag";
export const PATTERN_KINDS: Array<{ id: PatternKind; name: string }> = [
  { id: "stripes", name: "Stripes" }, { id: "checks", name: "Checks" }, { id: "dots", name: "Dots" }, { id: "diagonal", name: "Diagonal" }, { id: "zigzag", name: "Zigzag" },
];

/** A small repeating tile in two colours. */
export function makePattern(kind: PatternKind, a: string, b: string): HTMLCanvasElement {
  const s = 8;
  const c = newCanvas(s, s);
  const g = c.getContext("2d")!;
  g.fillStyle = a;
  g.fillRect(0, 0, s, s);
  g.fillStyle = b;
  if (kind === "stripes") g.fillRect(0, 0, s, s / 2);
  else if (kind === "checks") { g.fillRect(0, 0, s / 2, s / 2); g.fillRect(s / 2, s / 2, s / 2, s / 2); }
  else if (kind === "dots") { g.fillRect(2, 2, 3, 3); }
  else if (kind === "diagonal") { for (let i = 0; i < s; i++) { g.fillRect(i, i, 2, 1); g.fillRect(i, i + 1 < s ? i + 1 : 0, 1, 1); } }
  else { for (let x = 0; x < s; x++) g.fillRect(x, x < s / 2 ? x : s - 1 - x, 1, 2); }
  return c;
}

/** Multiplies a pattern over every frame's shading, keeping each frame's silhouette. strength 0..1 blends it in. */
export function applyPattern(d: Draft, tile: CanvasImageSource & { width: number; height: number }, scale: number, strength: number): void {
  const scaled = newCanvas(tile.width * scale, tile.height * scale);
  const sg = scaled.getContext("2d")!;
  sg.imageSmoothingEnabled = false;
  sg.drawImage(tile, 0, 0, scaled.width, scaled.height);
  for (const f of d.frames.values()) {
    const w = f.canvas.width;
    const h = f.canvas.height;
    if (!w || !h) continue;
    const tmp = newCanvas(w, h);
    const t = tmp.getContext("2d")!;
    const pat = t.createPattern(scaled, "repeat")!;
    pat.setTransform(new DOMMatrix().translate(f.ox, f.oy)); // the pattern is anchored to the avatar, so neighbouring frames line up
    t.fillStyle = pat;
    t.fillRect(0, 0, w, h);
    t.globalCompositeOperation = "multiply";
    t.drawImage(f.canvas, 0, 0);
    t.globalCompositeOperation = "destination-in";
    t.drawImage(f.canvas, 0, 0);
    const out = newCanvas(w, h);
    const g = out.getContext("2d")!;
    g.drawImage(f.canvas, 0, 0);
    g.globalAlpha = Math.max(0, Math.min(1, strength));
    g.drawImage(tmp, 0, 0);
    f.canvas = out;
    f.edited = true;
  }
}

// ---- importing art --------------------------------------------------------------------------------------
export interface ImportReport {
  replaced: number;
  added: number;
  /** replaced frames whose size differs from the original (the anchor may need nudging; ship an offset.json to fix) */
  sizeChanged: number;
  skipped: string[];
}

const baseName = (path: string) => path.split(/[\\/]/).pop() ?? path;

async function decodePng(bytes: Uint8Array): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(new Blob([bytes as BlobPart], { type: "image/png" }));
  const c = newCanvas(bmp.width, bmp.height);
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  return c;
}

/** Reads PNG files and/or ZIPs of them. Files must be named like the template's frames: h_<pose>_<layer>_<id>_<direction>_<frame>.png.
 *  An optional offset.json ({ "h_std_ch_5_2_0": { "x": -19, "y": 48 } }) gives anchors for frames whose size changed or that are new. */
export async function importFiles(d: Draft, files: File[]): Promise<ImportReport> {
  const entries: Array<{ name: string; data: Uint8Array }> = [];
  for (const f of files) {
    const buf = await f.arrayBuffer();
    if (/\.zip$/i.test(f.name)) entries.push(...(await unzip(buf)));
    else entries.push({ name: f.name, data: new Uint8Array(buf) });
  }
  const offsets = new Map<string, { x: number; y: number }>();
  for (const e of entries) {
    if (baseName(e.name).toLowerCase() !== "offset.json") continue;
    try {
      const json = JSON.parse(new TextDecoder().decode(e.data)) as Record<string, any>;
      for (const [k, v] of Object.entries(json)) {
        const m = /(s?h_[a-z]+_[a-z0-9]+_\d+_\d_\d+)$/.exec(k);
        if (m && v && typeof v.x === "number" && typeof v.y === "number") offsets.set(m[1], { x: v.x, y: v.y });
      }
    } catch { /* an unreadable offset.json just means "keep the original anchors" */ }
  }
  const report: ImportReport = { replaced: 0, added: 0, sizeChanged: 0, skipped: [] };
  for (const e of entries) {
    const file = baseName(e.name);
    if (!/\.png$/i.test(file)) continue;
    const k = parseFrameKey(file.replace(/\.png$/i, ""));
    if (!k) { if (!/^(atlas|preview|overview)/i.test(file)) report.skipped.push(`${file} (name doesn't match h_<pose>_<layer>_<id>_<dir>_<frame>.png)`); continue; }
    if (k.prefix !== "h") continue;
    if (!d.meta.parts.some((p) => p.type === k.type)) { report.skipped.push(`${file} (this design has no "${k.type}" layer)`); continue; }
    let canvas: HTMLCanvasElement;
    try { canvas = await decodePng(e.data); } catch { report.skipped.push(`${file} (not a valid PNG)`); continue; }
    const key = frameName(k.action, k.type, d.meta.id, k.dir, k.frame);
    const given = offsets.get(file.replace(/\.png$/i, ""));
    const old = d.frames.get(key);
    if (old) {
      if (!given && (old.canvas.width !== canvas.width || old.canvas.height !== canvas.height)) report.sizeChanged++;
      d.frames.set(key, { canvas, ox: given?.x ?? old.ox, oy: given?.y ?? old.oy, edited: true });
      report.replaced++;
    } else {
      const ref = d.frames.get(frameName("std", k.type, d.meta.id, k.dir, 0)) ?? [...d.frames.values()][0];
      d.frames.set(key, { canvas, ox: given?.x ?? ref?.ox ?? 0, oy: given?.y ?? ref?.oy ?? 0, edited: true });
      report.added++;
    }
  }
  return report;
}

// ---- exporting a template pack ------------------------------------------------------------------------------
const README = `Blodig oktober clothing template
===========================

frames/                every sprite frame of this design as its own transparent PNG
offset.json            for each frame: where it is anchored on the character (x, y)

How the frames work
-------------------
* The file name is  h_<pose>_<layer>_<id>_<direction>_<frame>.png
    pose:      std = standing, wlk = walking, wav = waving, sit, lay, crr/drk = carrying/drinking
    layer:     ch = shirt body, ls / rs = left / right sleeve, lg = trousers, sh = shoes, hr = hair, ha = hat ...
    direction: 0-7 (2 = facing the viewer's right, 3 = facing the viewer, 7 = facing away). Directions 4-6 are mirrored
               from 2-0 by the game, so they usually have no files.
* Layers drawn in grey/white are TINTED with the colour the player picks (multiplied). Paint those in greyscale shading.
  Layers with real colours are drawn exactly as you paint them.
* Keep each frame the same canvas size and the same file name. If you must change a frame's size, add an offset.json with
  the new anchor for that frame.

Getting it back in
------------------
Admin > Studio > your design > Import: drop the PNG files (or a ZIP of them). Only the files you changed need to be included.
`;

/** The design's frames as PNG files plus offset.json and a README, for editing in an external pixel editor. */
export async function exportDraftZip(d: Draft): Promise<Blob> {
  const files: ZipFile[] = [];
  const offsets: Record<string, { x: number; y: number }> = {};
  for (const [name, f] of d.frames) {
    if (!f.canvas.width || !f.canvas.height) continue;
    files.push({ path: `frames/${name}.png`, data: await canvasToBytes(f.canvas) });
    offsets[name] = { x: f.ox, y: f.oy };
  }
  files.push({ path: "offset.json", data: text(JSON.stringify(offsets, null, 2)) }, { path: "README.txt", data: text(README) });
  return makeZip(files);
}

export type { DraftFrame };
