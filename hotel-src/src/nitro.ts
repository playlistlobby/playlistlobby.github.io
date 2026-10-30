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
    const job = path === "derived:hcomputer" // the hideout's computer: the laptop, painted red
      ? loadNitro("furni/f_rareblock.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          const k = l / 255;
          d[i] = Math.min(255, Math.round(70 + 215 * k)); d[i + 1] = Math.round(8 + 170 * k * k); d[i + 2] = Math.round(8 + 150 * k * k);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no laptop art"))))
      : path === "derived:mixer_up" // a mixer with an upgrade chip: greenish
      ? loadNitro("furni/f_mixer.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          d[i] = Math.round(d[i] * 0.62); d[i + 1] = Math.min(255, Math.round(d[i + 1] * 1.12 + 26)); d[i + 2] = Math.round(d[i + 2] * 0.7);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no mixer art"))))
      : path === "derived:mixer_up2" // the MK2 mixer: dark grey
      ? loadNitro("furni/f_mixer.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) * 0.5 + 8;
          d[i] = Math.round(l); d[i + 1] = Math.round(l); d[i + 2] = Math.round(l + 4);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no mixer art"))))
      : path === "derived:wanted_board" // the wanted board: the ideas board with the colour taken out
      ? loadNitro("furni/f_ideaboard.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const l = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
          d[i] = d[i + 1] = d[i + 2] = l;
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no board art"))))
      : path === "derived:red_door" // the hideout door painted red: every pixel keeps its lightness and turns red (only the dark outlines stay)
      ? loadNitro("furni/teleport_door.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          if (l < 0.16) continue; // (the dark outlines stay)
          const k = Math.min(1, l * 1.1);
          d[i] = Math.min(255, Math.round(70 + 185 * k)); d[i + 1] = Math.round(8 + 48 * k * k); d[i + 2] = Math.round(8 + 38 * k * k);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no door art"))))
      : path === "derived:blue_board" // the notice board: the ideas board in blue
      ? loadNitro("furni/f_ideaboard.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          d[i] = Math.round(l * 0.5); d[i + 1] = Math.round(l * 0.78); d[i + 2] = Math.min(255, Math.round(l * 1.25 + 22));
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no board art"))))
      : path === "derived:blackjack" // the blackjack table: the poker table with a blue cloth (green and blue swap places where the felt is)
      ? loadNitro("furni/f_pokertable.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          if (d[i + 1] > d[i] * 1.12 && d[i + 1] > d[i + 2] * 1.05) { const gr = d[i + 1]; d[i + 1] = Math.round(d[i + 2] * 0.85 + gr * 0.15); d[i + 2] = Math.min(255, Math.round(gr * 1.15)); d[i] = Math.round(d[i] * 0.8); }
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no table art"))))
      : path === "derived:poker_hi" // the high stakes table: gold instead of the felt
      ? loadNitro("furni/f_pokertable.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const k = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          d[i] = Math.min(255, Math.round(48 + 215 * k)); d[i + 1] = Math.min(255, Math.round(30 + 170 * k)); d[i + 2] = Math.round(4 + 60 * k * k);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no table art"))))
      : path === "derived:st_bin_blue" // the street's trash cans: the grey bin painted blue
      ? loadNitro("furni/st_urban_bin.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const k = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          d[i] = Math.round(10 + 70 * k * k); d[i + 1] = Math.round(30 + 140 * k); d[i + 2] = Math.min(255, Math.round(70 + 215 * k));
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no bin art"))))
      : path.startsWith("derived:beetle_") // the old car (a teal beetle) in other colours: the saturated pixels (the paint) change hue, the greys (glass, tyres, chrome) stay
      ? loadNitro("furni/st_hween_c25_retrocar2.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const shift = BEETLE_HUES[path.slice("derived:beetle_".length)] ?? 0;
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
          const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, c = mx - mn;
          if (c < 0.12) continue; // (grey: leave it)
          let hh = mx === r ? ((gg - b) / c) % 6 : mx === gg ? (b - r) / c + 2 : (r - gg) / c + 4;
          hh = ((hh * 60 + shift) % 360 + 360) % 360;
          const s2 = Math.min(1, (c / (1 - Math.abs(2 * l - 1) || 1)) * 1.8); // (the teal is a pastel: the new colours are livelier)
          const l2 = l * 0.9, cc = (1 - Math.abs(2 * l2 - 1)) * s2, x2 = cc * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l2 - cc / 2;
          const [r2, g2, b2] = hh < 60 ? [cc, x2, 0] : hh < 120 ? [x2, cc, 0] : hh < 180 ? [0, cc, x2] : hh < 240 ? [0, x2, cc] : hh < 300 ? [x2, 0, cc] : [cc, 0, x2];
          d[i] = Math.round((r2 + m) * 255); d[i + 1] = Math.round((g2 + m) * 255); d[i + 2] = Math.round((b2 + m) * 255);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no car art"))))
      : path === "derived:silo_red" // the remote bank: the grey safe painted red (the wooden top, the dials and the outlines stay)
      ? loadNitro("furni/st_safe_silo.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          if (mx - mn > 38 || l < 0.3) continue; // (only the grey paint: the brown top and the dark lines are left)
          const k = Math.min(1, l * 1.05);
          d[i] = Math.min(255, Math.round(80 + 175 * k)); d[i + 1] = Math.round(14 + 52 * k * k); d[i + 2] = Math.round(10 + 40 * k * k);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no safe art"))))
      : path === "derived:phonebox_red" // the phone box in classic red: the white parts of the box go red, the glass and the shading stay
      ? loadNitro("furni/st_phonebox.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          if (l < 0.35) continue; // (the dark glass and the outlines)
          const k = Math.min(1, l * 1.05);
          d[i] = Math.min(255, Math.round(70 + 190 * k)); d[i + 1] = Math.round(10 + 40 * k * k); d[i + 2] = Math.round(8 + 36 * k * k);
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no phone box art"))))
      : path === "derived:beatshop" // the BeatShop: the vending machine painted purple
      ? loadNitro("furni/olympics_r16_vendingmchn.nitro").then((n) => (n ? derive(n, (g, w, h) => {
        const img = g.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          const k = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          d[i] = Math.min(255, Math.round(40 + 150 * k)); d[i + 1] = Math.round(10 + 60 * k * k); d[i + 2] = Math.min(255, Math.round(70 + 200 * k));
        }
        g.putImageData(img, 0, 0);
      }) : Promise.reject(new Error("no machine art"))))
      : path.startsWith("db:")
      ? fetchFromDb(path.slice(3))
      : fetch(assetUrl(path)).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${path}: ${r.status}`)))).then(parseNitro);
    p = job
      .then((n) => { ready.set(path, n); return n; })
      .catch((err) => { console.warn("couldn't load furniture", path, err); cache.delete(path); return null; });
    cache.set(path, p);
  }
  return p;
}

/** how far the beetle's teal paint is turned (degrees of hue) for each colour */
const BEETLE_HUES: Record<string, number> = { red: -170, yellow: -125, pink: 150, blue: 45, orange: -145, green: -70 };

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
  /** "ADD": glows (flames, screens) are added to what is behind them instead of covering it */
  ink?: "ADD";
  /** 0-1 (the layer's own transparency) */
  alpha?: number;
  /** the layer's depth offset: higher is in front of the others of the same piece */
  z: number;
}

interface LayerProps { ink?: string; alpha?: number; z?: number }
interface AnimLayer { frameRepeat?: number; loopCount?: number; frameSequences?: Record<string, { frames?: Record<string, { id: number }> }> }
interface Vis64 { layers?: Record<string, LayerProps>; animations?: Record<string, { layers?: Record<string, AnimLayer> }> }
const visCache = new WeakMap<object, Vis64>();
function vis64(json: NitroJson): Vis64 {
  let v = visCache.get(json);
  if (!v) {
    const all = json.visualizations as Array<{ size?: number } & Vis64> | undefined;
    v = all?.find((x) => x.size === 64) ?? {};
    visCache.set(json, v);
  }
  return v;
}

/** How long one animation tick lasts (a frame stays up for frameRepeat ticks). */
const TICK_MS = 83;
/** Which look or animation a piece is in (its state number) and how long it has been in it. */
/** `still`: stand on one picture of the state instead of playing it (a tree that has grown): the number of that picture, or true for the last one */
export interface AnimState { state: number; t: number; still?: boolean | number }

/** The state numbers a piece can be in (animation numbers below 100 are states; the higher ones are one-off effects). */
export function nitroStates(n: NitroFurni): number[] {
  return Object.keys(vis64(n.json).animations ?? {}).map(Number).filter((x) => x < 100).sort((a, b) => a - b);
}
/** Does the piece have any animation at all (then it is drawn frame by frame)? */
export const isAnimated = (n: NitroFurni): boolean => nitroStates(n).length > 0;

/** The picture number a layer shows at this moment (null = it has no picture in this state: its default one). */
function frameOf(a: AnimLayer | undefined, t: number, still?: boolean | number): number | null {
  const seqs = a?.frameSequences;
  if (!seqs) return null;
  const ids: number[] = [];
  for (const key of Object.keys(seqs).sort((x, y) => Number(x) - Number(y))) {
    const fr = seqs[key].frames ?? {};
    for (const k of Object.keys(fr).sort((x, y) => Number(x) - Number(y))) ids.push(fr[k].id);
  }
  if (!ids.length) return null;
  if (ids.length === 1) return ids[0];
  if (typeof still === "number") return ids.includes(still) ? still : ids[ids.length - 1];
  if (still) return ids[ids.length - 1];
  const tick = Math.floor(Math.max(0, t) / (TICK_MS * Math.max(1, a!.frameRepeat ?? 1)));
  const loops = a!.loopCount;
  if (loops === 0) return ids[tick % ids.length]; // plays for ever
  if (typeof loops === "number" && loops > 0) return ids[Math.min(tick, loops * ids.length - 1) % ids.length];
  return ids[Math.min(tick, ids.length - 1)]; // plays once and stays on the last picture
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
export function spritesFor(n: NitroFurni, dir: number, anim?: AnimState): SpriteDraw[] {
  const have = directionsOf(n);
  const d = have.includes(dir) ? dir : have.includes(dir % 4) ? dir % 4 : have[0] ?? 0;
  const out: SpriteDraw[] = [];
  const v = vis64(n.json);
  const fixed = anim ? null : firstState(n.json);
  const animLayers = anim ? v.animations?.[String(anim.state)]?.layers : undefined;
  for (const layer of n.layers) {
    const idx = layer.charCodeAt(0) - 97;
    let want: number | null;
    if (anim) want = animLayers ? frameOf(animLayers[String(idx)], anim.t, anim.still) : null;
    else want = fixed && layer in fixed ? fixed[layer] : null;
    if (want !== null && !n.json.assets[`${n.name}_64_${layer}_${d}_${want}`]) continue; // this layer has nothing to show in that state (the open doors)
    const key = `${n.name}_64_${layer}_${d}_${want ?? 0}`;
    const a = n.json.assets[key] ?? n.json.assets[`${n.name}_64_${layer}_${d}_0`];
    if (!a) continue;
    const f = n.json.spritesheet.frames[`${n.name}_${a.source ?? key}`];
    if (!f) continue;
    const lp = v.layers?.[String(idx)];
    out.push({
      layer, image: cutOut(n.image, f.frame.x, f.frame.y, f.frame.w, f.frame.h), sx: 0, sy: 0, sw: f.frame.w, sh: f.frame.h,
      dx: a.flipH ? a.x - f.frame.w : -a.x, dy: -a.y, flipH: !!a.flipH, isShadow: layer === "sd", // a mirrored copy is mirrored about the anchor: the registration x is the original one
      ...(lp?.ink === "ADD" ? { ink: "ADD" as const } : {}), ...(typeof lp?.alpha === "number" && lp.alpha < 255 ? { alpha: lp.alpha / 255 } : {}), z: lp?.z ?? 0,
    });
  }
  return out.some((o) => o.z !== 0) ? out.map((o, i) => ({ o, i })).sort((p, q) => (p.o.isShadow === q.o.isShadow ? p.o.z - q.o.z || p.i - q.i : p.o.isShadow ? -1 : 1)).map((p) => p.o) : out; // (layers with a depth offset are drawn lowest first)
}
