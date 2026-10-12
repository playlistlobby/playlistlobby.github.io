// Importing clothing from a Habbo figure library in .nitro format. A library holds the sprite frames of many garments
// (h_<pose>_<layer>_<partId>_<direction>_<frame>); we list the parts it contains, let the admin group them into garments,
// and turn each garment into a Studio design (which can then be repainted, repriced or deleted like any other).
import { Draft, DraftFrame, DesignMeta, DesignPart, allocateDesignId, cloneCanvas, frameName, parseFrameKey, publishDraft } from "./designs";
import { buildNitro, NitroFurni, NitroJson, SheetImage, unpackNitro } from "./nitro";

export interface FigurePart {
  /** sprite layer: ch, ls, rs, lg, sh, hr, ... */
  type: string;
  id: string;
  frames: number;
}

interface FrameRef {
  key: string;
  type: string;
  id: string;
  action: string;
  dir: number;
  frame: number;
  ox: number;
  oy: number;
  /** where the pixels are in the sheet, and whether they're mirrored */
  rect: { x: number; y: number; w: number; h: number };
  flip: boolean;
}

export interface FigureNitro {
  fileName: string;
  libName: string;
  image: SheetImage;
  frames: FrameRef[];
  parts: FigurePart[];
}

/** Which clothing slot a sprite layer belongs to (null = body parts that aren't clothing). */
export function slotOfLayer(type: string): string | null {
  const map: Record<string, string> = {
    ch: "ch", ls: "ch", rs: "ch", lg: "lg", sh: "sh", hr: "hr", hrb: "hr", ha: "ha", he: "he", ea: "ea", fa: "fa",
    cc: "cc", lc: "cc", rc: "cc", cp: "cp", ca: "ca", wa: "wa", hd: "hd",
  };
  return map[type] ?? null;
}

const KEY_RE = /(s?h_[a-z]+_[a-z0-9]+_\d+_\d_\d+)(?:\.png)?$/;

/** Reads a figure .nitro: finds every frame, its anchor and where its pixels are. */
export async function readFigureNitro(file: File): Promise<FigureNitro> {
  const files = await unpackNitro(await file.arrayBuffer());
  const dec = new TextDecoder();
  const jsonName = [...files.keys()].find((n) => n.endsWith(".json"));
  const pngName = [...files.keys()].find((n) => n.endsWith(".png"));
  if (!jsonName || !pngName) throw new Error(`${file.name}: no JSON or image inside.`);
  const json = JSON.parse(dec.decode(files.get(jsonName)!)) as NitroJson;
  const nitro: NitroFurni = await buildNitro(json, new Blob([files.get(pngName)! as BlobPart], { type: "image/png" }));
  const sheet = json.spritesheet?.frames ?? {};
  const assets = json.assets ?? {};
  const lib = json.name ?? file.name.replace(/\.nitro$/i, "");

  /** the sheet entry for an asset key, whatever prefix/suffix the converter used */
  const sheetFor = (key: string) => sheet[key] ?? sheet[`${lib}_${key}`] ?? sheet[`${key}.png`] ?? sheet[`${lib}_${key}.png`];
  const frames: FrameRef[] = [];
  const seen = new Set<string>();
  const add = (name: string, ox: number, oy: number, srcKey: string, flip: boolean) => {
    const m = KEY_RE.exec(name);
    if (!m) return;
    const k = parseFrameKey(m[1]);
    if (!k || k.prefix !== "h" || seen.has(m[1])) return;
    const f = sheetFor(srcKey);
    if (!f) return;
    seen.add(m[1]);
    frames.push({ key: m[1], type: k.type, id: k.id, action: k.action, dir: k.dir, frame: k.frame, ox, oy, rect: { ...f.frame }, flip });
  };
  for (const [key, a] of Object.entries(assets)) add(key, a.x ?? 0, a.y ?? 0, a.source ?? key, !!a.flipH);
  if (!frames.length) {
    throw new Error(`${file.name}: no clothing frames found. ${Object.keys(assets).some((k) => /_64_/.test(k)) ? "This looks like furniture: use the Furniture tab." : "Is this a figure library such as hh_human_shirt.nitro?"}`);
  }

  const count = new Map<string, FigurePart>();
  for (const f of frames) {
    const k = `${f.type}:${f.id}`;
    const e = count.get(k) ?? { type: f.type, id: f.id, frames: 0 };
    e.frames++;
    count.set(k, e);
  }
  const parts = [...count.values()].sort((a, b) => a.type.localeCompare(b.type) || Number(a.id) - Number(b.id));
  return { fileName: file.name, libName: lib, image: nitro.image, frames, parts };
}

export interface Garment {
  /** parts of the library that make up this garment (at most one per layer) */
  parts: FigurePart[];
  slot: string;
  name: string;
  gender: "M" | "F" | "U";
  tintable: boolean;
  price: number;
}

function cropFrame(image: SheetImage, f: FrameRef): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = f.rect.w;
  c.height = f.rect.h;
  const g = c.getContext("2d")!;
  if (f.flip) { g.translate(f.rect.w, 0); g.scale(-1, 1); }
  g.drawImage(image, f.rect.x, f.rect.y, f.rect.w, f.rect.h, 0, 0, f.rect.w, f.rect.h);
  return c;
}

/** Builds a Studio draft for a garment: frames renamed to the new design's id. Nothing is saved yet. */
export function draftFromGarment(fig: FigureNitro, gm: Garment): Draft {
  const id = allocateDesignId();
  const frames = new Map<string, DraftFrame>();
  const parts: DesignPart[] = [];
  const used = new Set<string>();
  for (const p of gm.parts) {
    if (used.has(p.type)) continue; // one part per layer
    used.add(p.type);
    parts.push({ type: p.type, index: 0, colorable: gm.tintable, colorindex: gm.tintable ? 1 : 0 });
    for (const f of fig.frames) {
      if (f.type !== p.type || f.id !== p.id) continue;
      frames.set(frameName(f.action, p.type, id, f.dir, f.frame), { canvas: cropFrame(fig.image, f), ox: f.ox, oy: f.oy, edited: true });
    }
  }
  const meta: DesignMeta = {
    id, name: gm.name.slice(0, 28) || "Imported", slot: gm.slot, gender: gm.gender, base: { type: gm.slot, id: "nitro" },
    parts, hidden: [], published: true, rev: 0, updatedAt: 0,
  };
  const original = new Map([...frames].map(([k, f]) => [k, { canvas: cloneCanvas(f.canvas), ox: f.ox, oy: f.oy }]));
  return { meta, frames, reuseStanding: false, original };
}

export { publishDraft };
