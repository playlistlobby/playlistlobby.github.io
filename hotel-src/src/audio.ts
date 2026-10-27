// Audio files in the browser (the rules: src/shared/audio.ts; the server describes and checks every upload: server/src/actions/audio.ts). A file is cut into pieces and written to
// audio/<id>/<i> as base64; to hear or download one the pieces are read and joined again. Everything that was read stays in memory for a while, so a replay costs nothing.
import { get, ref, set } from "firebase/database";
import { db } from "./firebase";
import { PIECE_BYTES } from "./shared/audio";

/** the pieces of a file as base64 text */
export async function filePieces(file: Blob): Promise<string[]> {
  const out: string[] = [];
  for (let at = 0; at < file.size; at += PIECE_BYTES) out.push(await blobToBase64(file.slice(at, at + PIECE_BYTES)));
  return out;
}
function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error ?? new Error("Couldn't read the file."));
    r.readAsDataURL(b);
  });
}
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Writes the pieces of an upload the server described (the rules let only the owner write them while the row is "uploading"). `onProgress` gets 0..1. */
export async function putPieces(id: string, file: Blob, onProgress?: (f: number) => void): Promise<void> {
  const n = Math.ceil(file.size / PIECE_BYTES);
  for (let i = 0; i < n; i++) {
    const text = await blobToBase64(file.slice(i * PIECE_BYTES, (i + 1) * PIECE_BYTES));
    await set(ref(db, `audio/${id}/${i}`), text);
    onProgress?.((i + 1) / n);
  }
}

const cache = new Map<string, Blob>();
const urls = new Map<string, string>();
const CACHE_MAX = 12;
function remember(id: string, blob: Blob): void {
  cache.set(id, blob);
  while (cache.size > CACHE_MAX) {
    const old = cache.keys().next().value as string;
    cache.delete(old);
    const u = urls.get(old);
    if (u) { URL.revokeObjectURL(u); urls.delete(old); }
  }
}

/** Reads the pieces of a file and joins them (kept in memory afterwards). Fails if you may not hear it, or a piece is missing. */
export async function loadAudio(id: string, pieces: number, mime: string): Promise<Blob> {
  const hit = cache.get(id);
  if (hit) return hit;
  const parts = await Promise.all(Array.from({ length: pieces }, async (_, i) => {
    let v: unknown = null;
    try { v = (await get(ref(db, `audio/${id}/${i}`))).val(); } catch { throw new Error("That sound isn't available."); } // (taken off, or not yours to hear)
    if (typeof v !== "string") throw new Error("Part of that file is missing.");
    return base64ToBytes(v);
  }));
  const blob = new Blob(parts as BlobPart[], { type: mime || "audio/mpeg" });
  remember(id, blob);
  return blob;
}
/** An address the <audio> element can play (made once per file). */
export async function audioUrl(id: string, pieces: number, mime: string): Promise<string> {
  const have = urls.get(id);
  if (have && cache.has(id)) return have;
  const blob = await loadAudio(id, pieces, mime);
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

/** How long a sound file is (the browser reads it: nothing is uploaded); null if it can't be played. */
export function audioLength(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    const done = (ms: number | null): void => { URL.revokeObjectURL(url); a.removeAttribute("src"); a.load(); resolve(ms); };
    a.preload = "metadata";
    a.addEventListener("loadedmetadata", () => done(Number.isFinite(a.duration) ? Math.round(a.duration * 1000) : null), { once: true });
    a.addEventListener("error", () => done(null), { once: true });
    window.setTimeout(() => done(null), 6000);
    a.src = url;
  });
}

/** Gives the person the file to keep (the browser's download). */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
export { filePieces as _filePiecesForTests };
