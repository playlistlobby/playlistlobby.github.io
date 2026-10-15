// Loader for Habbo furniture in the .nitro format: a small bundle holding one JSON file (offsets, sizes, directions)
// and one PNG sprite sheet. Entries are: uint16 count, then per file uint16 name length, name, uint32 length, zlib data (big endian).
import { get, ref } from "firebase/database";
import { db } from "./firebase";
import { assetUrl } from "./assetUrl";

interface SheetFrame {
  frame: { x: number; y: number; w: number; h: number };
}
export interface NitroAsset {
  x: number;
  y: number;
  /** reuse another asset's pixels */
  source?: string;
  flipH?: boolean;
}
export interface NitroJson {
  name: string;
  type?: string;
  assets: Record<string, NitroAsset>;
  logic?: { model?: { dimensions?: { x: number; y: number; z: number }; directions?: number[] } };
  spritesheet: { frames: Record<string, SheetFrame>; meta?: unknown };
  [k: string]: unknown;
}

/** The sprite sheet: the decoded image, or an edited copy of it (see derive()). */
export type SheetImage = ImageBitmap | HTMLCanvasElement;

export interface NitroFurni {
  name: string;
  image: SheetImage;
  json: NitroJson;
  /** layer letters present at the 64px size, in draw order ("sd" is the shadow and comes first) */
  layers: string[];
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser can't open .nitro files (it has no DecompressionStream).");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate")); // zlib-wrapped
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Splits a .nitro bundle into its files (name -> bytes). */
export async function unpackNitro(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  const dec = new TextDecoder();
  const files = new Map<string, Uint8Array>();
  try {
    const count = view.getUint16(0);
    let p = 2;
    for (let i = 0; i < count; i++) {
      const nameLen = view.getUint16(p); p += 2;
      const name = dec.decode(bytes.subarray(p, p + nameLen)); p += nameLen;
      const len = view.getUint32(p); p += 4;
      files.set(name, await inflate(bytes.subarray(p, p + len))); p += len;
    }
  } catch (err) {
    throw new Error(`That doesn't look like a .nitro file (${(err as Error).message}).`);
  }
  return files;
}

export function layersOf(json: NitroJson): string[] {
  const re = new RegExp(`^${json.name}_64_([a-z]+)_\\d+_\\d+$`);
  const found = new Set<string>();
  for (const key of Object.keys(json.assets ?? {})) {
    const m = re.exec(key);
    if (m) found.add(m[1]);
  }
  return [...found].sort((a, b) => (a === "sd" ? -1 : b === "sd" ? 1 : a.localeCompare(b)));
}

/** Builds a NitroFurni from a JSON description plus the sprite sheet image. */
export async function buildNitro(json: NitroJson, png: Blob): Promise<NitroFurni> {
  const image = await createImageBitmap(png);
  return { name: json.name, image, json, layers: layersOf(json) };
}

export async function parseNitro(buf: ArrayBuffer): Promise<NitroFurni> {
  const files = await unpackNitro(buf);
  const dec = new TextDecoder();
  const jsonName = [...files.keys()].find((n) => n.endsWith(".json"));
  const pngName = [...files.keys()].find((n) => n.endsWith(".png"));
  if (!jsonName || !pngName) throw new Error("That .nitro file has no JSON or image in it.");
  const json = JSON.parse(dec.decode(files.get(jsonName)!)) as NitroJson;
  return buildNitro(json, new Blob([files.get(pngName)! as BlobPart], { type: "image/png" }));
}

const cache = new Map<string, Promise<NitroFurni | null>>();
const ready = new Map<string, NitroFurni>();

async function fetchFromDb(kind: string): Promise<NitroFurni> {
  const snap = await get(ref(db, `furni/sheet/${kind}`));
  if (!snap.exists()) throw new Error(`no sprite sheet for ${kind}`);
  const v = snap.val() as { png: string; json: string };
  const png = await (await fetch(v.png)).blob();
  return buildNitro(JSON.parse(v.json) as NitroJson, png);
}

/** Loads furniture art. "furni/foo.nitro" is a file in /public; "db:x_foo" is an uploaded piece stored in the database. Cached; resolves null on failure. */
export function loadNitro(path: string): Promise<NitroFurni | null> {
  let p = cache.get(path);
  if (!p) {
    const job = path.startsWith("db:")
      ? fetchFromDb(path.slice(3))
      : fetch(assetUrl(path)).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${path}: ${r.status}`)))).then(parseNitro);
    p = job
      .then((n) => { ready.set(path, n); return n; })
      .catch((err) => { console.warn("couldn't load furniture", path, err); cache.delete(path); return null; });
    cache.set(path, p);
  }
  return p;
}

/** Forget a loaded piece (after the admin replaced its art). */
export function forgetNitro(path: string): void {
  cache.delete(path);
  ready.delete(path);
}

/** The furniture if it has finished loading, otherwise undefined (callers just skip drawing it for now). */
export const nitroIfReady = (path: string): NitroFurni | undefined => ready.get(path);

/** Facing directions the furniture has art for (Habbo uses 0, 2, 4, 6; the JSON lists them as degrees). */
export function directionsOf(n: NitroFurni): number[] {
  const dirs = new Set<number>();
  const re = new RegExp(`^${n.name}_64_[a-z]+_(\\d+)_\\d+$`);
  for (const k of Object.keys(n.json.assets)) {
    const m = re.exec(k);
    if (m) dirs.add(Number(m[1]));
  }
  return [...dirs].sort((a, b) => a - b);
}

/** A copy of the furniture whose sprite sheet has been edited (recolour, erase something...). `edit` gets the sheet's 2D context. */
export function derive(n: NitroFurni, edit: (g: CanvasRenderingContext2D, w: number, h: number) => void): NitroFurni {
  const c = document.createElement("canvas");
  c.width = n.image.width;
  c.height = n.image.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(n.image, 0, 0);
  edit(g, c.width, c.height);
  return { ...n, image: c };
}

export interface SpriteDraw {
  layer: string;
  image: SheetImage;
  sx: number; sy: number; sw: number; sh: number;
  /** where the sprite's top-left sits relative to the furniture's anchor point, in 64px pixels */
  dx: number; dy: number;
  flipH: boolean;
  isShadow: boolean;
}

/**
 * What the piece looks like in its first state (animation 0 of the 64px visualization): which picture each layer shows, and which layers are left out.
 * Pieces with doors (a wardrobe) carry the open and the closed doors as separate layers; showing every layer at once drew both.
 * Returns null when the file says nothing about it (then every layer is drawn as before).
 */
function firstState(json: NitroJson): Record<string, number | null> | null {
  const vis = (json.visualizations as Array<{ size?: number; animations?: Record<string, { layers?: Record<string, { frameSequences?: Record<string, { frames?: Record<string, { id?: number }> }> }> }> }> | undefined)?.find((v) => v.size === 64);
  const layers = vis?.animations?.["0"]?.layers;
  if (!layers) return null;
  const out: Record<string, number | null> = {};
  for (const [idx, l] of Object.entries(layers)) {
    const id = l?.frameSequences?.["0"]?.frames?.["0"]?.id;
    out[String.fromCharCode(97 + Number(idx))] = typeof id === "number" ? id : null;
  }
  return out;
}

/**
 * Every sprite is cut out of its sheet into a canvas of its own, once. Drawing straight from a sheet can pick up a sliver of the neighbouring picture when the
 * game is scaled or moved by a fraction of a pixel, and the neighbour next to a sprite is often the solid black shadow: that was the thin black line along
 * the edge of the mixer and the sink. A separate canvas has nothing next to it, so no line can ever show.
 */
const cutOuts = new WeakMap<object, Map<string, HTMLCanvasElement>>();
function cutOut(image: SheetImage, x: number, y: number, w: number, h: number): HTMLCanvasElement | SheetImage {
  if (typeof document === "undefined") return image;
  let perImage = cutOuts.get(image as object);
  if (!perImage) { perImage = new Map(); cutOuts.set(image as object, perImage); }
  const key = `${x},${y},${w},${h}`;
  let c = perImage.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = Math.max(1, w); c.height = Math.max(1, h);
    const cx = c.getContext("2d");
    if (!cx) return image;
    cx.imageSmoothingEnabled = false;
    cx.drawImage(image as CanvasImageSource, x, y, w, h, 0, 0, w, h);
    perImage.set(key, c);
  }
  return c;
}

/** Everything to draw for one facing direction (falls back to the nearest direction that has art). */
export function spritesFor(n: NitroFurni, dir: number, frame = 0): SpriteDraw[] {
  const have = directionsOf(n);
  const d = have.includes(dir) ? dir : have.includes(dir % 4) ? dir % 4 : have[0] ?? 0;
  const out: SpriteDraw[] = [];
  const state = frame === 0 ? firstState(n.json) : null;
  for (const layer of n.layers) {
    const want = state && layer in state ? state[layer] : null;
    if (want !== null && !n.json.assets[`${n.name}_64_${layer}_${d}_${want}`]) continue; // this layer has nothing to show in that state (the open doors)
    const key = `${n.name}_64_${layer}_${d}_${want ?? frame}`;
    const a = n.json.assets[key] ?? n.json.assets[`${n.name}_64_${layer}_${d}_0`];
    if (!a) continue;
    const f = n.json.spritesheet.frames[`${n.name}_${a.source ?? key}`];
    if (!f) continue;
    out.push({
      layer, image: cutOut(n.image, f.frame.x, f.frame.y, f.frame.w, f.frame.h), sx: 0, sy: 0, sw: f.frame.w, sh: f.frame.h,
      dx: a.flipH ? a.x - f.frame.w : -a.x, dy: -a.y, flipH: !!a.flipH, isShadow: layer === "sd", // a mirrored copy is mirrored about the anchor: the registration x is the original one
    });
  }
  return out;
}
