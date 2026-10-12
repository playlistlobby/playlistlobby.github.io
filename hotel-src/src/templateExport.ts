import { AVATAR_RESOURCES_URL, imager, renderAvatar } from "./avatarService";
import { extractImage } from "./avatar/Atlas";
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

const canvasToBytes = (c: HTMLCanvasElement): Promise<Uint8Array> =>
  new Promise((resolve, reject) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => resolve(new Uint8Array(a))) : reject(new Error("PNG encoding failed"))), "image/png"));

const loadImage = (blob: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("couldn't decode an atlas")); };
    img.src = url;
  });

const README = `6ixPlanet clothing template pack
================================

Made by the admin panel (Clothes & Items). Use it as a starting point for designing your own clothes.

items/<slot>_<id>/        one folder per exported clothing item
  item.json               what the item is: slot, gender, which sprite layers it uses and whether they're tinted
  preview_dir0..7.png     the item worn on a default character, standing, from all 8 directions (direction 2 = facing the viewer's right)
  frames/                 (if you ticked "include frames") every sprite frame of the item as its own transparent PNG
libs/<library>/           the sprite sheets those items come from
  atlas.png               all frames packed into one image
  offset.json             for every frame: where its anchor is (x, y) so it lines up on the body, plus the atlas position data
figuredata-selected.json  the avatar-data entries for the selected items (same format the game reads)

How the sprites work
--------------------
* A frame is named  h_<action>_<layer>_<id>_<direction>_<frame>   (sh_ = small size).
  action: std (standing), wlk (walking), sit, wav (waving)...   direction: 0-7   frame: animation frame.
* Layers flagged  "colorable": true  in item.json are drawn in grey/white and then TINTED with the player's chosen colour
  (multiplied). So paint colourable layers in greyscale shading, and non-colourable layers in full colour.
* Directions 4-6 are usually mirrored from 2-0 by the game, so only some directions exist as files.
* Keep every frame the same size and position (the offsets in offset.json depend on it), and keep the file names.

Previews are rendered with the item's default colours on the default boy/girl look, only so you can see the item in context.
`;

export interface ExportOptions {
  /** also write every individual frame of each item as a PNG (much bigger) */
  frames: boolean;
}

/** Builds the template pack for the given items. Downloads the sprite sheets from the avatar host, so it needs a connection. */
export async function buildTemplatePack(sets: SetRef[], opts: ExportOptions, onProgress: (done: number, total: number, label: string) => void): Promise<Blob> {
  const files: ZipFile[] = [];
  const infos = sets.map(describeSet).filter((s): s is SetInfo => !!s);
  const libs = new Map<string, { atlasBytes: Uint8Array; atlasImg?: HTMLImageElement; offset: any }>();

  const libNames = [...new Set(infos.flatMap((i) => i.parts.map((p) => p.lib).filter((l): l is string => !!l)))];
  const total = libNames.length + infos.length * 8 + (opts.frames ? infos.length : 0);
  let done = 0;
  const tick = (label: string) => onProgress(++done, total, label);

  // 1) sprite sheets (shared between items, so each library is written once)
  for (const lib of libNames) {
    const [atlasRes, offsetRes] = await Promise.all([fetch(`${AVATAR_RESOURCES_URL}${lib}/atlas.png`), fetch(`${AVATAR_RESOURCES_URL}${lib}/offset.json`)]);
    if (!atlasRes.ok || !offsetRes.ok) { tick(`skipped ${lib} (not available)`); continue; }
    const atlasBlob = await atlasRes.blob();
    const offsetText = await offsetRes.text();
    libs.set(lib, { atlasBytes: new Uint8Array(await atlasBlob.arrayBuffer()), atlasImg: opts.frames ? await loadImage(atlasBlob) : undefined, offset: JSON.parse(offsetText) });
    files.push({ path: `libs/${lib}/atlas.png`, data: libs.get(lib)!.atlasBytes }, { path: `libs/${lib}/offset.json`, data: text(offsetText) });
    tick(`sprite sheet ${lib}`);
  }

  // 2) per item: description, previews, optional frames
  for (const info of infos) {
    const dir = `items/${info.type}_${info.id}`;
    files.push({ path: `${dir}/item.json`, data: text(JSON.stringify(info, null, 2)) });
    const figure = figureWearing(info);
    for (let d = 0; d < 8; d++) {
      const canvas = await renderAvatar({ figure, dir: d, headDir: d });
      if (canvas) files.push({ path: `${dir}/preview_dir${d}.png`, data: await canvasToBytes(canvas) });
      tick(`${info.type}-${info.id} preview ${d + 1}/8`);
    }
    if (opts.frames) {
      for (const part of info.parts) {
        const lib = part.lib && libs.get(part.lib);
        if (!lib || !lib.atlasImg || !lib.offset?.atlas?.frames) continue;
        const needle = `_${part.type}_${part.id}_`;
        for (const key of Object.keys(lib.offset.atlas.frames)) {
          if (!key.includes(needle)) continue;
          const frame = extractImage(lib.offset.atlas, lib.atlasImg, key);
          if (frame) files.push({ path: `${dir}/frames/${key.replace(`${part.lib}_`, "")}`, data: await canvasToBytes(frame) });
        }
      }
      tick(`${info.type}-${info.id} frames`);
    }
  }

  // 3) the data entries + a readme
  const fd = imager.figuredata;
  const slice: Record<string, unknown> = {};
  for (const info of infos) {
    slice[info.type] ??= { paletteid: fd.settype[info.type].paletteid, set: {} };
    (slice[info.type] as { set: Record<string, unknown> }).set[info.id] = fd.settype[info.type].set[info.id];
  }
  files.push({ path: "figuredata-selected.json", data: text(JSON.stringify({ settype: slice }, null, 2)) }, { path: "README.txt", data: text(README) });
  return makeZip(files);
}

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
