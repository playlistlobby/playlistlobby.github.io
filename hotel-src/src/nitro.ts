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

export interface NitroFurni {
  name: string;
  image: ImageBitmap;
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

export interface SpriteDraw {
  layer: string;
  image: ImageBitmap;
  sx: number; sy: number; sw: number; sh: number;
  /** where the sprite's top-left sits relative to the furniture's anchor point, in 64px pixels */
  dx: number; dy: number;
  flipH: boolean;
  isShadow: boolean;
}

/** Everything to draw for one facing direction (falls back to the nearest direction that has art). */
export function spritesFor(n: NitroFurni, dir: number, frame = 0): SpriteDraw[] {
  const have = directionsOf(n);
  const d = have.includes(dir) ? dir : have.includes(dir % 4) ? dir % 4 : have[0] ?? 0;
  const out: SpriteDraw[] = [];
  for (const layer of n.layers) {
    const key = `${n.name}_64_${layer}_${d}_${frame}`;
    const a = n.json.assets[key] ?? n.json.assets[`${n.name}_64_${layer}_${d}_0`];
    if (!a) continue;
    const f = n.json.spritesheet.frames[`${n.name}_${a.source ?? key}`];
    if (!f) continue;
    out.push({
      layer, image: n.image, sx: f.frame.x, sy: f.frame.y, sw: f.frame.w, sh: f.frame.h,
      dx: -a.x, dy: -a.y, flipH: !!a.flipH, isShadow: layer === "sd",
    });
  }
  return out;
}
