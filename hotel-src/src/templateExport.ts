import { imager } from "./avatarService";
import { DEFAULT_FIGURE, parseFigure, figureToString, swatchesFor } from "./catalog";
import { makeZip, text, ZipFile } from "./zip";

/** One clothing item, in the avatar data's own terms: a slot (hair "hr", shirt "ch", ...) and a set id. */
export interface SetRef {
  type: string;
  id: string;
}

export interface SetPart {
  /** sprite layer type, e.g. "ch" (shirt body), "ls"/"rs" (left/right sleeve) */
  type: string;
  id: number;
  index: number;
  colorable: boolean;
  colorindex: number;
  /** the sprite library (atlas folder) these frames live in, if the hosted data has one */
  lib: string | null;
}

export interface SetInfo extends SetRef {
  gender: string;
  club: number;
  selectable: boolean;
  colorable: boolean;
  colors: number;
  hidden: string[];
  parts: SetPart[];
}

export function describeSet(ref: SetRef): SetInfo | null {
  const fd = imager.figuredata;
  const set = fd?.settype?.[ref.type]?.set?.[ref.id];
  if (!set) return null;
  const parts: SetPart[] = (set.part ?? []).map((p: any) => ({
    type: p.type,
    id: p.id,
    index: p.index,
    colorable: !!p.colorable,
    colorindex: p.colorindex ?? 0,
    lib: imager.figuremap?.[p.type]?.[p.id] ?? null,
  }));
  return {
    ...ref,
    gender: set.gender,
    club: set.club ?? 0,
    selectable: !!set.selectable,
    colorable: !!set.colorable,
    colors: Math.max(0, ...parts.map((p) => p.colorindex)),
    hidden: Array.isArray(set.hidden) ? set.hidden : [],
    parts,
  };
}

/** Every clothing set in the avatar data for a slot (including club items, which the shop never sells). */
export function listSets(type: string): SetInfo[] {
  const sets = imager.figuredata?.settype?.[type]?.set ?? {};
  return Object.keys(sets)
    .map((id) => describeSet({ type, id }))
    .filter((s): s is SetInfo => !!s)
    .sort((a, b) => Number(a.id) - Number(b.id));
}

/** A full figure string that wears this item on top of the default look for its gender (so previews look like a person). */
export function figureWearing(info: SetInfo): string {
  const base = parseFigure(DEFAULT_FIGURE[info.gender === "F" ? "F" : "M"]);
  const sw = swatchesFor(info.type);
  base[info.type] = { id: info.id, colors: Array.from({ length: info.colors }, (_, i) => sw[Math.min(i * 3, sw.length - 1)]?.id ?? "1") };
  return figureToString(base);
}

const canvasToBytes = async (c: HTMLCanvasElement): Promise<Uint8Array> => {
  // toDataURL encodes synchronously; toBlob can stall for a second per call in background tabs
  const url = c.toDataURL("image/png");
  const bin = atob(url.slice(url.indexOf(",") + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const loadImage = (blob: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("couldn't decode an atlas")); };
    img.src = url;
  });

/** The icons of the shop items (knife, CD, syringe, blood drop) as SVG plus a 256px PNG of each, for use as templates. */
export async function buildItemIconPack(icons: Array<{ name: string; url: string }>): Promise<Blob> {
  const files: ZipFile[] = [];
  for (const ic of icons) {
    const res = await fetch(ic.url);
    if (!res.ok) continue;
    const svg = await res.text();
    files.push({ path: `items/${ic.name}.svg`, data: text(svg) });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const img = await loadImage(blob);
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, 0, 256, 256);
    files.push({ path: `items/${ic.name}_256.png`, data: await canvasToBytes(c) });
  }
  files.push({ path: "README.txt", data: text("Item icons as SVG (editable, 16x16 pixel grid) and as 256px PNG previews.\n") });
  return makeZip(files);
}
