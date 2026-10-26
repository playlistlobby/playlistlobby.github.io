// Pets in the browser: the sheets made by scripts/bake-pets.mjs (public/pets/<type>.png + .json), coloured with one of the pet's palettes, and a few
// helpers to read what a player owns. A pet walks behind its owner in every room (see the pets block in src/ui/room.ts); everybody in the room sees it
// because the owner's presence in the room carries `pet: "<type>:<palette>"` (the database rules check it against users/<uid>/petLook, written by the server).
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { assetUrl } from "./assetUrl";
import { call } from "./db";
import type { Profile } from "./db";

export interface PetMeta { name: string; w: number; h: number; ox: number; oy: number; rows: Record<string, number[]>; palettes: string[] }
export interface PetSheet { meta: PetMeta; canvas: HTMLCanvasElement }

const sheets = new Map<string, PetSheet>();
const jobs = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
export const onPetSheet = (fn: () => void): (() => void) => { listeners.add(fn); return () => listeners.delete(fn); };

const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`couldn't load ${src}`)); i.src = src; });

/** the pet in this colour if it has loaded (it starts loading the first time it is asked for); null until then */
export function petSheet(type: string, palette: number): PetSheet | null {
  const key = `${type}:${palette}`;
  const have = sheets.get(key);
  if (have) return have;
  if (!jobs.has(key)) {
    jobs.set(key, (async () => {
      const meta = (await (await fetch(assetUrl(`pets/${type}.json`))).json()) as PetMeta;
      const img = await loadImg(assetUrl(`pets/${type}.png`));
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      const pal64 = meta.palettes[Math.min(palette, meta.palettes.length - 1)];
      if (pal64) { // pixels with alpha 254 hold a palette index in red: they take that colour
        const pal = Uint8Array.from(atob(pal64), (ch) => ch.charCodeAt(0));
        const data = g.getImageData(0, 0, c.width, c.height);
        const d = data.data;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 254) { const k = d[i]; d[i] = pal[k * 3]; d[i + 1] = pal[k * 3 + 1]; d[i + 2] = pal[k * 3 + 2]; d[i + 3] = 255; }
        g.putImageData(data, 0, 0);
      }
      sheets.set(key, { meta, canvas: c });
      listeners.forEach((l) => l());
    })().catch((err) => { console.warn("pet", key, err); }));
  }
  return null;
}

/** where a frame is in the sheet: pose (std, mv, sit, lay), direction 0-7, step of the walk */
export function petCell(s: PetSheet, pose: string, dir: number, step: number): { sx: number; sy: number } {
  const rows = s.meta.rows[pose] ?? s.meta.rows.std ?? [0];
  return { sx: dir * s.meta.w, sy: rows[step % rows.length] * s.meta.h };
}

/** draws a pet standing at the screen point (x, y) (the middle of its tile, on the floor) */
export function drawPet(g: CanvasRenderingContext2D, s: PetSheet, pose: string, dir: number, step: number, x: number, y: number, scale: number): void {
  const { sx, sy } = petCell(s, pose, dir, step);
  g.drawImage(s.canvas, sx, sy, s.meta.w, s.meta.h, x - s.meta.ox * scale, y - s.meta.oy * scale, s.meta.w * scale, s.meta.h * scale);
}

/** a small picture of the pet for the merchant's window */
export function petPreview(s: PetSheet, height = 56): HTMLCanvasElement {
  const { sx, sy } = petCell(s, "std", 2, 0);
  const k = Math.min(2, height / s.meta.h);
  const c = document.createElement("canvas");
  c.width = Math.round(s.meta.w * k); c.height = Math.round(s.meta.h * k);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(s.canvas, sx, sy, s.meta.w, s.meta.h, 0, 0, c.width, c.height);
  return c;
}

// ---- what the player owns ------------------------------------------------------------------------------------------------------
export interface OwnedPet { id: string; type: string; palette: number }
export function watchMyPets(uid: string, cb: (pets: OwnedPet[], active: string | null) => void): () => void {
  let pets: OwnedPet[] = [], active: string | null = null;
  const stops = [
    onValue(ref(db, `users/${uid}/pets`), (s) => { const v = (s.val() ?? {}) as Record<string, { type?: string; palette?: number }>; pets = Object.entries(v).filter(([, p]) => typeof p?.type === "string").map(([id, p]) => ({ id, type: p.type!, palette: Number(p.palette) || 0 })); cb(pets, active); }, () => undefined),
    onValue(ref(db, `users/${uid}/activePet`), (s) => { active = typeof s.val() === "string" ? (s.val() as string) : null; cb(pets, active); }, () => undefined),
  ];
  return () => stops.forEach((s) => s());
}

/** "<type>:<palette>" of the pet that walks with me (null = none), kept live so rooms can tell everybody */
let myLook: string | null = null;
const lookListeners = new Set<(look: string | null) => void>();
export const petLookNow = (): string | null => myLook;
export const onMyPetLook = (fn: (look: string | null) => void): (() => void) => { lookListeners.add(fn); return () => lookListeners.delete(fn); };
export function startPetLook(uid: string): () => void {
  return onValue(ref(db, `users/${uid}/petLook`), (s) => { myLook = typeof s.val() === "string" ? (s.val() as string) : null; lookListeners.forEach((l) => l(myLook)); }, () => undefined);
}

export const buyPet = (p: Profile, type: string): Promise<{ id: string; type: string; palette: number; price: number }> => call(p, "petBuy", { type });
export const setActivePet = (p: Profile, id: string | null): Promise<unknown> => call(p, "petActive", { id });
