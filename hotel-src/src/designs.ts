// Clothing designed in the admin's Studio. A design is a copy of an existing garment's layers whose sprite frames the admin
// repainted/imported. It's stored as a tiny sprite sheet in the database (designs/sheet/<id>) plus its description
// (designs/meta/<id>), and slotted into the avatar imager as a normal clothing set so every other part of the game just works.
import { get, onValue, ref, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { avatarsReady, clearAvatarCache, imager } from "./avatarService";
import { extractImage } from "./avatar/Atlas";
import { applyClothingConfig, setCustomItems } from "./catalog";
import { shopConfig } from "./shopConfig";
import { assetUrl } from "./assetUrl";

export const DESIGN_ID_START = 90001;

export interface DesignPart {
  /** sprite layer: ch (shirt body), ls/rs (sleeves), lg, sh, hr, ... */
  type: string;
  index: number;
  /** drawn in grey and tinted by the player's chosen colour */
  colorable: boolean;
  colorindex: number;
  /** a garment with two layers of the same kind (a belt strap and its drape) gives the second one its own part id (default: the design's id) */
  partId?: string;
}

export interface DesignMeta {
  id: string;
  name: string;
  slot: string;
  gender: "M" | "F" | "U";
  /** the existing garment this design started from */
  base: { type: string; id: string };
  parts: DesignPart[];
  hidden: string[];
  /** players only see published designs; the admin also sees drafts */
  published: boolean;
  rev: number;
  updatedAt: number;
}

export interface SheetFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  /** anchor: where the frame sits relative to the avatar's origin (same meaning as the avatar data's offset.json x/y) */
  ox: number;
  oy: number;
}
export interface DesignSheet {
  png: string;
  frames: Record<string, SheetFrame>;
}

/** One sprite frame being edited. `edited` = the admin changed it (painted/imported) as opposed to it still being the base art. */
export interface DraftFrame {
  canvas: HTMLCanvasElement;
  ox: number;
  oy: number;
  edited: boolean;
}

export interface Draft {
  meta: DesignMeta;
  frames: Map<string, DraftFrame>;
  /** walking/waving poses without art of their own reuse the standing art you painted */
  reuseStanding: boolean;
  /** how every frame looked when editing started (for "Reset frame" and the painter's ghost view) */
  original?: Map<string, { canvas: HTMLCanvasElement; ox: number; oy: number }>;
}

const snapshotOf = (frames: Map<string, DraftFrame>): NonNullable<Draft["original"]> =>
  new Map([...frames].map(([k, f]) => [k, { canvas: cloneCanvas(f.canvas), ox: f.ox, oy: f.oy }]));

export const designLib = (id: string) => `custom_${id}`;
export const isDesignId = (id: string | number) => Number(id) >= DESIGN_ID_START;

// ---- frame names ---------------------------------------------------------------------------------------
export interface FrameKey {
  prefix: string;
  action: string;
  type: string;
  id: string;
  dir: number;
  frame: number;
}
const FRAME_RE = /^(s?h)_([a-z]+)_([a-z0-9]+)_(\d+)_(\d)_(\d+)$/;
export function parseFrameKey(name: string): FrameKey | null {
  const m = FRAME_RE.exec(name);
  return m ? { prefix: m[1], action: m[2], type: m[3], id: m[4], dir: Number(m[5]), frame: Number(m[6]) } : null;
}
export const frameName = (action: string, type: string, id: string, dir: number, frame: number) => `h_${action}_${type}_${id}_${dir}_${frame}`;

// ---- helpers --------------------------------------------------------------------------------------------
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("couldn't decode an image"));
    img.src = src;
  });
}

export function cloneCanvas(c: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = c.width;
  out.height = c.height;
  out.getContext("2d")!.drawImage(c, 0, 0);
  return out;
}

/** The library the imager loads a lib's frames from, loaded once (the imager caches it too). */
async function ensureLib(lib: string): Promise<{ data: any; atlas: any }> {
  await avatarsReady;
  if (!imager.offsets[lib]) imager.offsets[lib] = { promise: imager.fetchOffsetAsync(lib), data: {}, atlas: {} };
  await imager.offsets[lib].promise;
  return imager.offsets[lib];
}

// ---- registering designs with the avatar imager --------------------------------------------------------
type LibLoader = () => Promise<{ data: any; atlas: any }>;

const registered = new Map<string, DesignMeta>();
/** designs being previewed from unsaved work in this browser (the live watcher must not replace them) */
const localDrafts = new Set<string>();
let lastRaw: Record<string, any> = {};
const listeners = new Set<() => void>();
export const onDesignsChanged = (fn: () => void): (() => void) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Atlas bookkeeping in the shape the imager expects: data[frame] = anchor, data.atlas.frames[lib_frame.png] = rect. */
function makeLibData(lib: string, frames: Record<string, SheetFrame>): any {
  const data: any = { atlas: { frames: {}, meta: {} } };
  for (const [name, f] of Object.entries(frames)) {
    data[name] = { x: f.ox, y: f.oy };
    data.atlas.frames[`${lib}_${name}.png`] = { frame: { x: f.x, y: f.y, w: f.w, h: f.h } };
  }
  return data;
}

/** Forget everything cached for this design so the next draw uses its current art. */
export function invalidateDesign(id: string, partIds: string[] = []): void {
  delete imager.offsets[designLib(id)];
  for (const k of Object.keys(imager.chunks)) if ([id, ...partIds].some((x) => k.includes(`_${x}_`))) delete imager.chunks[k];
  clearAvatarCache();
}

export function registerDesign(meta: DesignMeta, loader: LibLoader): void {
  const settype = imager.figuredata?.settype?.[meta.slot];
  if (!settype) return;
  const lib = designLib(meta.id);
  settype.set[meta.id] = {
    gender: meta.gender,
    club: 0,
    colorable: meta.parts.some((p) => p.colorable),
    selectable: true,
    preselectable: false,
    sellable: false,
    legacy: false,
    part: meta.parts.map((p) => ({ type: p.type, id: Number(p.partId ?? meta.id), colorable: p.colorable, index: p.index, colorindex: p.colorindex })),
    hidden: meta.hidden ?? [],
  };
  for (const p of meta.parts) {
    imager.figuremap[p.type] ??= {};
    imager.figuremap[p.type][p.partId ?? meta.id] = lib;
  }
  imager.customLibs[lib] = loader;
  registered.set(meta.id, meta);
  invalidateDesign(meta.id, meta.parts.flatMap((p) => (p.partId ? [p.partId] : [])));
}

export function unregisterDesign(id: string): void {
  const meta = registered.get(id);
  if (meta) {
    delete imager.figuredata?.settype?.[meta.slot]?.set?.[id];
    for (const p of meta.parts) delete imager.figuremap?.[p.type]?.[p.partId ?? id];
  }
  delete imager.customLibs[designLib(id)];
  registered.delete(id);
  invalidateDesign(id, (meta?.parts ?? []).flatMap((p) => (p.partId ? [p.partId] : [])));
}

const sheetCache = new Map<string, Promise<{ data: any; atlas: any }>>();

export async function fetchSheet(id: string): Promise<DesignSheet | null> {
  const snap = await get(ref(db, `designs/sheet/${id}`));
  return snap.exists() ? (snap.val() as DesignSheet) : null;
}

function sheetLoader(meta: DesignMeta): LibLoader {
  const key = `${meta.id}:${meta.rev}`;
  return () => {
    let p = sheetCache.get(key);
    if (!p) {
      p = (async () => {
        const sheet = await fetchSheet(meta.id);
        if (!sheet) throw new Error(`design ${meta.id} has no sheet`);
        return { data: makeLibData(designLib(meta.id), sheet.frames), atlas: await loadImage(sheet.png) };
      })();
      sheetCache.set(key, p);
      p.catch(() => sheetCache.delete(key)); // try again next time
    }
    return p;
  };
}

function normalizeMeta(id: string, v: any): DesignMeta | null {
  if (!v || typeof v !== "object" || !v.slot || !v.parts) return null;
  const parts: DesignPart[] = (Array.isArray(v.parts) ? v.parts : Object.values(v.parts)).filter(Boolean).map((p: any) => ({
    type: String(p.type), index: Number(p.index ?? 0), colorable: !!p.colorable, colorindex: Number(p.colorindex ?? 0),
    ...(p.partId ? { partId: String(p.partId) } : {}),
  }));
  const hidden: string[] = v.hidden ? (Array.isArray(v.hidden) ? v.hidden : Object.values(v.hidden)) : [];
  return {
    id, name: String(v.name ?? id), slot: String(v.slot), gender: v.gender === "F" ? "F" : v.gender === "U" ? "U" : "M",
    base: { type: String(v.base?.type ?? v.slot), id: String(v.base?.id ?? "") }, parts, hidden, published: !!v.published,
    rev: Number(v.rev ?? 0), updatedAt: Number(v.updatedAt ?? 0),
  };
}

// ---- garments that ship with the game ---------------------------------------------------------------------------
// 6ixty's outfit lives in public/designs/bundle.json (made from the Habbo clothing files), so it works without anyone importing it into the
// database. They are registered with the avatar imager like any design, but only the admin sees them in the catalogue (to dress 6ixty).
const bundledIds = new Set<string>();
let adminView = false;

export async function loadBundledDesigns(): Promise<void> {
  await avatarsReady;
  try {
    const res = await fetch(assetUrl("designs/bundle.json"));
    if (!res.ok) return;
    const raw = (await res.json()) as { metas: Record<string, any>; sheets: Record<string, DesignSheet> };
    for (const [id, v] of Object.entries(raw.metas)) {
      const meta = normalizeMeta(id, { ...v, published: true });
      const sheet = raw.sheets[id];
      if (!meta || !sheet) continue;
      bundledIds.add(id);
      let loaded: Promise<{ data: any; atlas: any }> | null = null;
      registerDesign(meta, () => (loaded ??= loadImage(sheet.png).then((atlas) => ({ data: makeLibData(designLib(id), sheet.frames), atlas }))));
    }
    syncCatalog();
    listeners.forEach((l) => l());
  } catch (err) {
    console.warn("couldn't load the built-in garments", err);
  }
}

/** Puts every registered design into the shop/character catalogue (and applies the admin's prices to them). */
function syncCatalog(): void {
  setCustomItems([...registered.values()].filter((m) => !bundledIds.has(m.id) || adminView).map((m) => ({
    slot: m.slot, id: m.id, gender: m.gender, colors: Math.max(0, ...m.parts.map((p) => p.colorindex)),
  })));
  applyClothingConfig(shopConfig.clothing);
}

function applyMetas(raw: Record<string, any>, isAdmin: boolean): void {
  lastRaw = raw;
  const next = new Map<string, DesignMeta>();
  for (const [id, v] of Object.entries(raw)) {
    const meta = normalizeMeta(id, v);
    if (!meta || (!meta.published && !isAdmin)) continue;
    next.set(id, meta);
  }
  for (const id of [...registered.keys()]) if (!next.has(id) && !localDrafts.has(id) && !bundledIds.has(id)) unregisterDesign(id);
  for (const [id, meta] of next) {
    if (localDrafts.has(id)) continue;
    const cur = registered.get(id);
    if (cur && cur.rev === meta.rev) { registered.set(id, meta); continue; } // same art, maybe a new name/gender
    registerDesign(meta, sheetLoader(meta));
  }
  syncCatalog();
  listeners.forEach((l) => l());
}

/** Keeps the avatar data in step with the database: players get published designs, the admin gets drafts too. */
export function watchDesigns(isAdmin: boolean): { ready: Promise<void>; stop: Unsubscribe } {
  adminView = isAdmin;
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  const stop = onValue(
    ref(db, "designs/meta"),
    (snap) => {
      applyMetas((snap.val() ?? {}) as Record<string, any>, isAdmin);
      resolve();
    },
    () => resolve() // unreadable (e.g. rules not deployed yet): carry on without custom clothes
  );
  return { ready, stop };
}

/** Everything in designs/meta (drafts included) for the Studio's list. Only the admin account should call this. */
export function listDesigns(): DesignMeta[] {
  return Object.entries(lastRaw).map(([id, v]) => normalizeMeta(id, v)).filter((m): m is DesignMeta => !!m).sort((a, b) => Number(b.id) - Number(a.id));
}

const reserved = new Set<string>();

export function allocateDesignId(): string {
  const ids = [...Object.keys(lastRaw), ...localDrafts, ...reserved].map(Number).filter((n) => Number.isFinite(n));
  const id = String(Math.max(DESIGN_ID_START - 1, ...ids) + 1);
  reserved.add(id); // a batch import asks for several ids before any of them reaches the database
  return id;
}

export const designRev = (id: string): number => Number(lastRaw[id]?.rev ?? 0);

// ---- starting a draft ---------------------------------------------------------------------------------------
/** Copies an existing garment's layers and sprite frames (renamed to the new design's id) as a starting point. */
export async function draftFromBase(type: string, baseId: string, id: string, name: string): Promise<Draft> {
  await avatarsReady;
  const set = imager.figuredata?.settype?.[type]?.set?.[baseId];
  if (!set) throw new Error("That item doesn't exist.");
  const parts: DesignPart[] = [];
  const frames = new Map<string, DraftFrame>();
  for (const p of set.part as any[]) {
    if (!parts.some((q) => q.type === p.type && q.index === p.index)) {
      parts.push({ type: p.type, index: p.index ?? 0, colorable: !!p.colorable, colorindex: p.colorindex ?? 0 });
    }
    const lib = imager.figuremap?.[p.type]?.[p.id];
    if (!lib) continue;
    const entry = await ensureLib(lib);
    for (const key of Object.keys(entry.data)) {
      if (key === "atlas") continue;
      const k = parseFrameKey(key);
      if (!k || k.prefix !== "h" || k.type !== p.type || k.id !== String(p.id)) continue;
      const rec = entry.data[key];
      if (!rec || rec.flipped) continue;
      const canvas = extractImage(entry.data.atlas, entry.atlas, `${lib}_${key}.png`);
      if (canvas) frames.set(frameName(k.action, p.type, id, k.dir, k.frame), { canvas, ox: rec.x, oy: rec.y, edited: false });
    }
  }
  if (!frames.size) throw new Error("That item has no sprite frames to start from. Try another one.");
  const meta: DesignMeta = {
    id, name, slot: type, gender: set.gender === "F" ? "F" : set.gender === "U" ? "U" : "M",
    base: { type, id: String(baseId) }, parts, hidden: Array.isArray(set.hidden) ? [...set.hidden] : [], published: false, rev: designRev(id), updatedAt: 0,
  };
  return { meta, frames, reuseStanding: true, original: snapshotOf(frames) };
}

/** Re-opens a saved design for editing: its published sprite sheet becomes the frames. */
export async function draftFromDesign(meta: DesignMeta): Promise<Draft> {
  const sheet = await fetchSheet(meta.id);
  if (!sheet) throw new Error("This design's sprite sheet is missing.");
  const img = await loadImage(sheet.png);
  const frames = new Map<string, DraftFrame>();
  for (const [name, f] of Object.entries(sheet.frames)) {
    const c = document.createElement("canvas");
    c.width = f.w;
    c.height = f.h;
    c.getContext("2d")!.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    frames.set(name, { canvas: c, ox: f.ox, oy: f.oy, edited: true });
  }
  return { meta: { ...meta, parts: meta.parts.map((p) => ({ ...p })), hidden: [...meta.hidden] }, frames, reuseStanding: false, original: snapshotOf(frames) };
}

// ---- turning a draft into frames/atlas ----------------------------------------------------------------------
const SWING_TYPES = new Set(["ls", "rs", "lc", "rc"]);

/** The frames that will really be shipped: unpainted walking/waving poses reuse your standing art (when switched on). */
export function buildFrames(d: Draft): Map<string, DraftFrame> {
  if (!d.reuseStanding) return d.frames;
  const out = new Map(d.frames);
  for (const [name, f] of d.frames) {
    if (f.edited) continue;
    const k = parseFrameKey(name);
    if (!k || k.action === "std") continue;
    const ok = k.action === "wlk" || ((k.action === "wav" || k.action === "crr" || k.action === "drk") && !SWING_TYPES.has(k.type));
    if (!ok) continue;
    const std = d.frames.get(frameName("std", k.type, d.meta.id, k.dir, 0));
    if (std?.edited) out.set(name, { canvas: std.canvas, ox: f.ox, oy: f.oy, edited: true });
  }
  return out;
}

export interface Packed {
  canvas: HTMLCanvasElement;
  frames: Record<string, SheetFrame>;
}

/** Shelf-packs all frames into one sprite sheet. */
export function packFrames(frames: Map<string, DraftFrame>): Packed {
  const list = [...frames.entries()].filter(([, f]) => f.canvas.width > 0 && f.canvas.height > 0)
    .sort((a, b) => b[1].canvas.height - a[1].canvas.height || b[1].canvas.width - a[1].canvas.width);
  const maxW = 1024;
  let x = 0, y = 0, rowH = 0, W = 1;
  const placed: Array<{ name: string; f: DraftFrame; x: number; y: number }> = [];
  for (const [name, f] of list) {
    const w = f.canvas.width, h = f.canvas.height;
    if (x + w + 1 > maxW) { y += rowH + 1; x = 0; rowH = 0; }
    placed.push({ name, f, x, y });
    x += w + 1;
    rowH = Math.max(rowH, h);
    W = Math.max(W, x);
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = Math.max(1, y + rowH);
  const g = canvas.getContext("2d")!;
  const out: Record<string, SheetFrame> = {};
  for (const p of placed) {
    g.drawImage(p.f.canvas, p.x, p.y);
    out[p.name] = { x: p.x, y: p.y, w: p.f.canvas.width, h: p.f.canvas.height, ox: Math.round(p.f.ox), oy: Math.round(p.f.oy) };
  }
  return { canvas, frames: out };
}

/** Shows the draft on a character right now (nothing is saved). Call again after every change. */
export function previewDraft(d: Draft): void {
  const packed = packFrames(buildFrames(d));
  const data = makeLibData(designLib(d.meta.id), packed.frames);
  localDrafts.add(d.meta.id);
  registerDesign({ ...d.meta, rev: d.meta.rev + 0.5 }, () => Promise.resolve({ data, atlas: packed.canvas }));
}

/** Stop previewing unsaved work: go back to what's in the database (or remove a never-saved design). */
export function endPreview(id: string): void {
  if (!localDrafts.delete(id)) return;
  const raw = lastRaw[id];
  const meta = raw ? normalizeMeta(id, raw) : null;
  if (meta) registerDesign(meta, sheetLoader(meta));
  else unregisterDesign(id);
  syncCatalog();
  listeners.forEach((l) => l());
}

export const MAX_SHEET_CHARS = 880_000;

/** Saves the design (sprite sheet + description) for everyone. Throws a readable error if it's too big. */
export async function publishDraft(d: Draft): Promise<DesignMeta> {
  const frames = buildFrames(d);
  if (!frames.size) throw new Error("This design has no frames.");
  const packed = packFrames(frames);
  const png = packed.canvas.toDataURL("image/png");
  if (png.length > MAX_SHEET_CHARS) throw new Error(`The sprite sheet is too big to store (${Math.round(png.length / 1024)} KB, the limit is about ${Math.round(MAX_SHEET_CHARS / 1024)} KB). Use fewer or smaller frames.`);
  const meta: DesignMeta = { ...d.meta, rev: Math.floor(designRev(d.meta.id)) + 1, updatedAt: Date.now() };
  await update(ref(db), {
    [`designs/sheet/${meta.id}`]: { png, frames: packed.frames },
    [`designs/meta/${meta.id}`]: {
      name: meta.name, slot: meta.slot, gender: meta.gender, base: meta.base, parts: meta.parts,
      ...(meta.hidden.length ? { hidden: meta.hidden } : {}), published: meta.published, rev: meta.rev, updatedAt: meta.updatedAt,
    },
  });
  d.meta.rev = meta.rev;
  return meta;
}

export async function deleteDesign(id: string): Promise<void> {
  await update(ref(db), { [`designs/sheet/${id}`]: null, [`designs/meta/${id}`]: null });
}
