// Audio files in the game (songs on SoundCloud, beats in the BeatShop, rap replies in the chats). The game has no file storage, so a file is kept in the database in pieces, like the iTunes
// app of the Playlist site did: the browser cuts it into pieces of PIECE_BYTES and writes them to audio/<id>/<i> as base64 text; the server only ever writes the row that describes the file.
//   audioMeta/<id>   { owner, kind, size, pieces, mime, durMs, status: "uploading" | "ready", at, public?, readers?: { <uid>: true } }   written only by the server
//   audio/<id>/<i>   one piece, base64                                                                                              written by the owner of an "uploading" row, read by whoever may hear it
// Who may read the pieces of a ready file: everybody for a song or a preview, and for anything else the ones in `readers` (a beat: its owner and its buyers; a reply: the two in the chat).
// Pure: the browser and the server both use it. If the files ever move to real file storage (R2), only src/audio.ts and server/src/actions/audio.ts change.

export type AudioKind = "song" | "preview" | "beat" | "reply";
/** the biggest a file of each kind may be (bytes) and how long (ms): bandwidth is what the database plan is short of, so these are strict */
export const AUDIO_LIMITS: Record<AudioKind, { bytes: number; minMs: number; maxMs: number }> = {
  song: { bytes: 4_000_000, minMs: 10_000, maxMs: 180_000 },
  preview: { bytes: 2_000_000, minMs: 3_000, maxMs: 31_000 },
  beat: { bytes: 10_000_000, minMs: 10_000, maxMs: 600_000 },
  reply: { bytes: 3_000_000, minMs: 2_000, maxMs: 60_000 },
};
/** a piece is this many bytes of the file (680,000 characters as base64: under the 1,000,000 the rules allow, and a multiple of 3 so the pieces join without padding) */
export const PIECE_BYTES = 510_000;
export const PIECE_CHARS = (PIECE_BYTES / 3) * 4;
/** the most pieces a file can have (10 MB of beat = 20 pieces) */
export const MAX_PIECES = 20;
export const piecesFor = (bytes: number): number => Math.ceil(bytes / PIECE_BYTES);
/** an upload that was begun and never finished is thrown away after this long */
export const UPLOAD_STALE_MS = 60 * 60_000;

export interface AudioMeta {
  owner: string;
  kind: AudioKind;
  size: number;
  pieces: number;
  mime: string;
  durMs: number;
  status: "uploading" | "ready";
  at: number;
  public?: boolean;
  readers?: Record<string, true>;
}
export const AUDIO_MIMES: readonly string[] = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/webm"];
export const isAudioMime = (m: unknown): m is string => typeof m === "string" && AUDIO_MIMES.includes(m.toLowerCase());

/** does this start like an audio file? (mp3 with or without an ID3 tag, wav, ogg, mp4/m4a, webm) — the first bytes of the file */
export function looksLikeAudio(b: Uint8Array): boolean {
  if (b.length < 12) return false;
  const s = (i: number, t: string): boolean => t.split("").every((ch, k) => b[i + k] === ch.charCodeAt(0));
  if (s(0, "ID3")) return true; // mp3 with a tag
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return true; // an mp3/aac frame
  if (s(0, "RIFF") && s(8, "WAVE")) return true;
  if (s(0, "OggS")) return true;
  if (s(4, "ftyp")) return true; // m4a / mp4
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return true; // webm / mka
  return false;
}
/** the file's name without the ending, as a title */
export const titleFromName = (name: string): string => name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim().slice(0, 40);
export const fmtDur = (ms: number): string => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
export const fmtSize = (b: number): string => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} kB`);
