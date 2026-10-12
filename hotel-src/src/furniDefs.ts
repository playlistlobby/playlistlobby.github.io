// Furniture uploaded by the admin as .nitro files. The art is re-packed (64px sprites only) into one small image stored in
// the database (furni/sheet/<kind>); the description lives at furni/meta/<kind>. Each piece becomes a furniture kind that can
// be put in the public room (admin) and, if "players" is on, in players' own rooms.
import { onValue, ref, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { FURNI_KINDS, FurniKind } from "./rooms";
import { directionsOf, forgetNitro, loadNitro, NitroFurni, NitroJson, unpackNitro, buildNitro } from "./nitro";

export interface FurniMeta {
  /** the kind id used in rooms: "x_" + the file's name */
  id: string;
  name: string;
  /** footprint in tiles when facing 0 (swapped when facing 2 or 6) */
  w: number;
  h: number;
  /** lies flat on the floor: walkable, drawn underneath everyone */
  flat: boolean;
  /** players can put it in their own rooms (otherwise only the admin, in the public room) */
  players: boolean;
  /** nudge the art, in 64px pixels, if it doesn't sit right on its tiles */
  ox: number;
  oy: number;
  height: number;
  dirs: number[];
  rev: number;
  updatedAt: number;
}

export const FURNI_ID_RE = /^x_[a-z0-9_]{1,24}$/;
export const furniPath = (id: string) => `db:${id}`;
const MAX_PNG_CHARS = 690_000;

const metas = new Map<string, FurniMeta>();
const listeners = new Set<() => void>();
export const onFurniChanged = (fn: () => void): (() => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export const listFurni = (): FurniMeta[] => [...metas.values()].sort((a, b) => a.name.localeCompare(b.name));
export const furniMeta = (id: string): FurniMeta | undefined => metas.get(id);

/** The pieces players (or just the admin) can place, as furniture kinds. */
function kindOf(m: FurniMeta): FurniKind {
  return {
    id: m.id, label: m.name, icon: "🪑", w: m.w, h: m.h, height: m.flat ? 3 : m.height, color: "#8a8f99", placeable: m.players,
    nitro: furniPath(m.id), flat: m.flat, nudge: { x: m.ox, y: m.oy }, rotatable: true,
  };
}

function normalize(id: string, v: any): FurniMeta | null {
  if (!FURNI_ID_RE.test(id) || !v || typeof v !== "object") return null;
  const dirs: number[] = v.dirs ? (Array.isArray(v.dirs) ? v.dirs : Object.values(v.dirs)) : [0];
  return {
    id, name: String(v.name ?? id), w: Number(v.w) || 1, h: Number(v.h) || 1, flat: !!v.flat, players: !!v.players,
    ox: Number(v.ox) || 0, oy: Number(v.oy) || 0, height: Number(v.height) || 40, dirs: dirs.map(Number), rev: Number(v.rev) || 0, updatedAt: Number(v.updatedAt) || 0,
  };
}

/** Keeps the furniture kinds in step with the database. Resolves once the first copy arrived (so rooms never meet an unknown kind). */
export function watchFurni(): { ready: Promise<void>; stop: Unsubscribe } {
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  const stop = onValue(
    ref(db, "furni/meta"),
    (snap) => {
      const raw = (snap.val() ?? {}) as Record<string, any>;
      const next = new Map<string, FurniMeta>();
      for (const [id, v] of Object.entries(raw)) {
        const m = normalize(id, v);
        if (m) next.set(id, m);
      }
      for (const [id, old] of metas) {
        if (!next.has(id)) { delete FURNI_KINDS[id]; forgetNitro(furniPath(id)); }
        else if (next.get(id)!.rev !== old.rev) forgetNitro(furniPath(id)); // new art: load it again
      }
      metas.clear();
      for (const [id, m] of next) { metas.set(id, m); FURNI_KINDS[id] = kindOf(m); }
      listeners.forEach((l) => l());
      resolve();
    },
    () => resolve()
  );
  return { ready, stop };
}

// ---- reading an uploaded .nitro ----------------------------------------------------------------------
export interface FurniUpload {
  nitro: NitroFurni;
  meta: FurniMeta;
}

/** The ids stay short and safe: "wf_label" -> "x_wf_label". */
export function kindIdFor(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 22) || "item";
  return `x_${slug}`;
}

export async function readFurniNitro(file: File): Promise<FurniUpload> {
  const files = await unpackNitro(await file.arrayBuffer());
  const dec = new TextDecoder();
  const jsonName = [...files.keys()].find((n) => n.endsWith(".json"));
  const pngName = [...files.keys()].find((n) => n.endsWith(".png"));
  if (!jsonName || !pngName) throw new Error(`${file.name}: no JSON or image inside.`);
  const json = JSON.parse(dec.decode(files.get(jsonName)!)) as NitroJson;
  if (!json.name || !json.assets || !json.spritesheet?.frames) throw new Error(`${file.name}: this doesn't look like a furniture file.`);
  const nitro = await buildNitro(json, new Blob([files.get(pngName)! as BlobPart], { type: "image/png" }));
  if (!nitro.layers.length) throw new Error(`${file.name}: no 64px furniture sprites found (is this a clothing file? Use the Clothing tab).`);
  const dim = json.logic?.model?.dimensions ?? { x: 1, y: 1, z: 1 };
  const dirs = directionsOf(nitro);
  const id = kindIdFor(json.name);
  const flat = dim.z < 0.3;
  const meta: FurniMeta = {
    id, name: json.name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()).slice(0, 28), w: Math.max(1, Math.min(8, Math.round(dim.x))), h: Math.max(1, Math.min(8, Math.round(dim.y))),
    flat, players: false, ox: 0, oy: 0, height: Math.max(10, Math.round(dim.z * 32)), dirs: dirs.length ? dirs : [0], rev: 0, updatedAt: 0,
  };
  return { nitro, meta };
}

/** Re-packs just the 64px sprites (and the icon) into a fresh, smaller sheet, and returns what gets stored. */
export function repackNitro(n: NitroFurni): { png: string; json: string } {
  const keep = Object.keys(n.json.assets).filter((k) => k.startsWith(`${n.name}_64_`) || /_icon_/.test(k));
  const frameKeyOf = (k: string): string => `${n.name}_${n.json.assets[k].source ?? k}`;
  const need = new Set<string>();
  for (const k of keep) need.add(frameKeyOf(k));
  const list = [...need].map((fk) => ({ fk, f: n.json.spritesheet.frames[fk] })).filter((e) => !!e.f)
    .sort((a, b) => b.f.frame.h - a.f.frame.h);
  const maxW = 1024;
  let x = 0, y = 0, rowH = 0, W = 1;
  const placed: Array<{ fk: string; x: number; y: number; w: number; h: number; src: { x: number; y: number } }> = [];
  for (const { fk, f } of list) {
    const { w, h } = f.frame;
    if (x + w + 1 > maxW) { y += rowH + 1; x = 0; rowH = 0; }
    placed.push({ fk, x, y, w, h, src: { x: f.frame.x, y: f.frame.y } });
    x += w + 1;
    rowH = Math.max(rowH, h);
    W = Math.max(W, x);
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = Math.max(1, y + rowH);
  const g = canvas.getContext("2d")!;
  const frames: NitroJson["spritesheet"]["frames"] = {};
  for (const p of placed) {
    g.drawImage(n.image, p.src.x, p.src.y, p.w, p.h, p.x, p.y, p.w, p.h);
    frames[p.fk] = { frame: { x: p.x, y: p.y, w: p.w, h: p.h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: p.w, h: p.h }, sourceSize: { w: p.w, h: p.h } } as any;
  }
  const assets: NitroJson["assets"] = {};
  for (const k of keep) assets[k] = n.json.assets[k];
  const json: NitroJson = { name: n.name, assets, logic: n.json.logic, spritesheet: { frames } };
  return { png: canvas.toDataURL("image/png"), json: JSON.stringify(json) };
}

export async function saveFurni(upload: FurniUpload, meta: FurniMeta): Promise<FurniMeta> {
  const packed = repackNitro(upload.nitro);
  if (packed.png.length > MAX_PNG_CHARS) throw new Error(`The artwork is too big to store (${Math.round(packed.png.length / 1024)} KB, the limit is about ${Math.round(MAX_PNG_CHARS / 1024)} KB).`);
  if (packed.json.length > 58_000) throw new Error("The furniture description is too large to store.");
  const prev = metas.get(meta.id);
  const saved: FurniMeta = { ...meta, rev: (prev?.rev ?? 0) + 1, updatedAt: Date.now() };
  await update(ref(db), {
    [`furni/sheet/${saved.id}`]: packed,
    [`furni/meta/${saved.id}`]: { name: saved.name, w: saved.w, h: saved.h, flat: saved.flat, players: saved.players, ox: saved.ox, oy: saved.oy, height: saved.height, dirs: saved.dirs, rev: saved.rev, updatedAt: saved.updatedAt },
  });
  return saved;
}

/** Changes only the description (name, players, nudge...), keeping the art. */
export function updateFurniMeta(m: FurniMeta): Promise<void> {
  return update(ref(db, `furni/meta/${m.id}`), { name: m.name, w: m.w, h: m.h, flat: m.flat, players: m.players, ox: m.ox, oy: m.oy, height: m.height, updatedAt: Date.now() });
}

export function deleteFurni(id: string): Promise<void> {
  return update(ref(db), { [`furni/meta/${id}`]: null, [`furni/sheet/${id}`]: null });
}

export { loadNitro };
