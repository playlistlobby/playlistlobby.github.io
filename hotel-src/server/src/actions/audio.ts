// Audio files, the server's part (the rules and the limits are in src/shared/audio.ts): describing an upload, checking it when the browser says it wrote all the pieces, and removing a file.
//   audioBegin    makes the row audioMeta/<id> (status "uploading") and notes it in audioUploads/<uid>/<id>; the browser then writes audio/<id>/<i> itself (the rules let only the owner do that)
//   audioFinish   looks at what was written: every piece is there and no more, the sizes fit what was said, the first bytes look like audio; then the row is "ready"
//   audioRemove   deletes the row and the pieces
// These are helpers used by the actions of songs, beats and chat replies, not actions themselves.
import { Ctx, fail } from "../ctx";
import { AUDIO_LIMITS, AudioKind, AudioMeta, isAudioMime, looksLikeAudio, MAX_PIECES, PIECE_CHARS, piecesFor, UPLOAD_STALE_MS } from "../../../src/shared/audio";
import { int } from "./util";

const randomId = (): string => Math.random().toString(36).slice(2, 7) + Math.random().toString(36).slice(2, 5);
/** how many uploads one player can have going at the same time */
const UPLOADS_AT_ONCE = 3;

export interface BeginOpts { kind: AudioKind; size: unknown; durMs: unknown; mime: unknown; public?: boolean; readers?: string[]; idPrefix?: string }

/** Removes the uploads of this player that were begun more than an hour ago and never finished (their pieces too). */
export async function dropStaleUploads(c: Ctx): Promise<void> {
  const mine = (await c.db.get<Record<string, number>>(`audioUploads/${c.uid}`)) ?? {};
  for (const [id, at] of Object.entries(mine)) if (c.now - Number(at) > UPLOAD_STALE_MS) { audioRemove(c, id); c.extra[`audioUploads/${c.uid}/${id}`] = null; }
}

/** Describes a new upload. The kind's limits are checked here (size, length, type); returns the id and the number of pieces the browser has to write. */
export async function audioBegin(c: Ctx, o: BeginOpts): Promise<{ id: string; pieces: number }> {
  const lim = AUDIO_LIMITS[o.kind];
  const size = int(o.size, 1000, lim.bytes, "file size");
  const durMs = int(o.durMs, lim.minMs, lim.maxMs, "length");
  if (!isAudioMime(o.mime)) fail("That isn't a sound file (mp3, wav, ogg or m4a).");
  const pieces = piecesFor(size);
  if (pieces > MAX_PIECES) fail("That file is too big.");
  await dropStaleUploads(c);
  const going = Object.keys((await c.db.get<Record<string, number>>(`audioUploads/${c.uid}`)) ?? {}).length;
  if (going >= UPLOADS_AT_ONCE) fail("You have uploads going already. Wait for them to finish.");
  const id = `${o.idPrefix ?? "a"}${c.now.toString(36)}${randomId()}`;
  const meta: AudioMeta = { owner: c.uid, kind: o.kind, size, pieces, mime: String(o.mime).toLowerCase(), durMs, status: "uploading", at: c.now, ...(o.public ? { public: true } : {}), ...(o.readers?.length ? { readers: Object.fromEntries(o.readers.map((u) => [u, true as const])) } : {}) };
  c.extra[`audioMeta/${id}`] = meta;
  c.extra[`audioUploads/${c.uid}/${id}`] = c.now;
  return { id, pieces };
}

/** The browser says it has written the pieces: check them, and make the file ready. Fails (and keeps the upload going) if something is missing. */
export async function audioFinish(c: Ctx, id: string, kind: AudioKind): Promise<AudioMeta> {
  const meta = await c.db.get<AudioMeta>(`audioMeta/${id}`);
  if (!meta || meta.owner !== c.uid || meta.kind !== kind) return fail("That upload isn't yours.");
  if (meta.status !== "uploading") return fail("That upload is done already.");
  const have = new Set(await c.db.keys(`audio/${id}`));
  for (let i = 0; i < meta.pieces; i++) if (!have.has(String(i))) return fail("The upload didn't arrive in full. Try again.");
  for (const k of have) if (!/^\d{1,2}$/.test(k) || Number(k) >= meta.pieces) c.extra[`audio/${id}/${k}`] = null; // (a piece that doesn't belong goes)
  const first = (await c.db.get<string>(`audio/${id}/0`)) ?? "";
  if (meta.pieces > 1 ? first.length !== PIECE_CHARS : Math.abs(first.length - Math.ceil(meta.size / 3) * 4) > 4) return fail("That file isn't what it said it was.");
  if (meta.pieces > 1) { // the last piece must fit the size that was said
    const last = (await c.db.get<string>(`audio/${id}/${meta.pieces - 1}`)) ?? "";
    const want = Math.ceil((meta.size - (meta.pieces - 1) * (PIECE_CHARS / 4) * 3) / 3) * 4;
    if (Math.abs(last.length - want) > 4) return fail("That file isn't what it said it was.");
  }
  let head: Uint8Array;
  try { head = Uint8Array.from(atob(first.slice(0, 64)), (ch) => ch.charCodeAt(0)); } catch { return fail("That isn't a sound file."); }
  if (!looksLikeAudio(head)) {
    audioRemove(c, id);
    c.extra[`audioUploads/${c.uid}/${id}`] = null;
    return fail("That isn't a sound file.");
  }
  c.extra[`audioMeta/${id}/status`] = "ready";
  c.extra[`audioUploads/${c.uid}/${id}`] = null;
  return { ...meta, status: "ready" };
}

/** Deletes a file: its row and every piece. */
export function audioRemove(c: Ctx, id: string): void {
  c.extra[`audioMeta/${id}`] = null;
  c.extra[`audio/${id}`] = null;
}
