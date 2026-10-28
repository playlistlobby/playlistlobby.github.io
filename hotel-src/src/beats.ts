// The BeatShop in the browser (the rules: src/shared/beats.ts; the server does the listing, the buying and the chats: server/src/actions/beats.ts): the live lists, the actions,
// cutting a 30 second preview out of a beat (a small mono WAV made in the browser), uploading, and taking a bought beat home.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { audioLength, loadAudio, putPieces, saveBlob } from "./audio";
import { AUDIO_LIMITS, titleFromName } from "./shared/audio";
import { BEAT_PRICE_MAX, BEAT_PRICE_MIN, cleanBeatTitle, cleanChatText, parseBeats, parseChats, parseMsgs, parseOwnedBeats, PREVIEW_MS, threadKey } from "./shared/beats";
import type { Beat, ChatMeta, ChatMsg, OwnedBeat } from "./shared/beats";

export const watchBeats = (owner: string, cb: (b: Beat[]) => void): (() => void) => onValue(ref(db, `beats/${owner}`), (s) => cb(parseBeats(s.val(), owner)), () => cb([]));
/** what a player bought, with the time of the purchase (the BeatShop shows the download for an hour) */
export const watchOwnedBeats = (uid: string, cb: (b: OwnedBeat[]) => void): (() => void) => onValue(ref(db, `beatBuys/${uid}`), (s) => cb(parseOwnedBeats(s.val())), () => cb([]));
/** the seller's inbox: every chat about their beats, newest first */
export const watchInbox = (owner: string, cb: (c: ChatMeta[]) => void): (() => void) => onValue(ref(db, `beatChats/${owner}`), (s) => cb(parseChats(s.val())), () => cb([]));
export const watchThread = (owner: string, key: string, cb: (c: ChatMeta | null) => void): (() => void) => onValue(ref(db, `beatChats/${owner}/${key}`), (s) => cb(parseChats(s.val() ? { [key]: s.val() } : null)[0] ?? null), () => cb(null));
export const watchMessages = (owner: string, key: string, cb: (m: ChatMsg[]) => void): (() => void) => onValue(ref(db, `beatChatMsgs/${owner}/${key}`), (s) => cb(parseMsgs(s.val())), () => cb([]));

export const buyBeatShop = (p: Profile): Promise<{ price: number }> => call(p, "buyBeatShop");
export const buyBeat = (p: Profile, owner: string, id: string): Promise<{ price: number }> => call(p, "beatBuy", { owner, id });
export const removeBeat = (p: Profile, id: string): Promise<unknown> => call(p, "beatRemove", { id });
export const markRead = (p: Profile, owner: string, beat: string, buyer: string): Promise<unknown> => call(p, "beatChatRead", { owner, beat, buyer });
export { threadKey };

/** the checks before an upload (the server checks again): the length, or what is wrong */
export async function checkBeatFile(file: File): Promise<{ error: string } | { durMs: number }> {
  const lim = AUDIO_LIMITS.beat;
  if (file.size > lim.bytes) return { error: `That file is ${(file.size / 1e6).toFixed(1)} MB. A beat can be 10 MB at most.` };
  const durMs = await audioLength(file);
  if (durMs === null) return { error: "That file can't be played. Use an mp3, wav, ogg or m4a." };
  if (durMs < lim.minMs || durMs > lim.maxMs) return { error: "A beat has to be between 10 seconds and 10 minutes." };
  return { durMs };
}
export async function checkReplyFile(file: File): Promise<{ error: string } | { durMs: number }> {
  const lim = AUDIO_LIMITS.reply;
  if (file.size > lim.bytes) return { error: `That file is ${(file.size / 1e6).toFixed(1)} MB. A rap can be 3 MB at most.` };
  const durMs = await audioLength(file);
  if (durMs === null) return { error: "That file can't be played. Use an mp3, wav, ogg or m4a." };
  if (durMs < lim.minMs || durMs > lim.maxMs) return { error: "A rap has to be between 2 and 60 seconds." };
  return { durMs };
}

/** 30 seconds of a beat from `startMs` as a mono WAV (22,050 Hz, 16 bit: about 1.3 MB) */
export async function cropPreview(file: Blob, startMs: number): Promise<Blob> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    const rate = 22050;
    const len = Math.min(Math.floor((PREVIEW_MS / 1000) * rate), Math.floor((buf.duration - startMs / 1000) * rate));
    const off = new OfflineAudioContext(1, Math.max(1, len), rate);
    const src = off.createBufferSource();
    src.buffer = buf;
    src.connect(off.destination);
    src.start(0, startMs / 1000);
    const out = (await off.startRendering()).getChannelData(0);
    return wavBlob(out, rate);
  } finally { void ctx.close(); }
}
function wavBlob(samples: Float32Array, rate: number): Blob {
  const data = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (at: number, s: string): void => { for (let i = 0; i < s.length; i++) data.setUint8(at + i, s.charCodeAt(i)); };
  str(0, "RIFF"); data.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE"); str(12, "fmt "); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, rate, true); data.setUint32(28, rate * 2, true); data.setUint16(32, 2, true); data.setUint16(34, 16, true); str(36, "data"); data.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new Blob([data], { type: "audio/wav" });
}

export interface BeatUpload { file: File; title: string; price: number; durMs: number; /** where the 30 second preview starts */ cropStartMs: number }
/** Lists a beat: describes it, writes the pieces of the beat (and of its preview), and tells the server it is all there. `onProgress` gets 0..1. */
export async function uploadBeat(p: Profile, u: BeatUpload, onProgress?: (f: number) => void): Promise<{ id: string }> {
  const price = Math.round(u.price);
  if (!(price >= BEAT_PRICE_MIN && price <= BEAT_PRICE_MAX)) throw new Error(`The price has to be between ${BEAT_PRICE_MIN} and ${BEAT_PRICE_MAX}.`);
  const preview = await cropPreview(u.file, u.cropStartMs);
  const begun = await call<{ id: string; previewId: string | null }>(p, "beatBegin", {
    title: cleanBeatTitle(u.title) || cleanBeatTitle(titleFromName(u.file.name)), price, durMs: u.durMs, size: u.file.size, mime: u.file.type || "audio/mpeg", previewSize: preview.size, previewMs: Math.min(PREVIEW_MS, u.durMs - u.cropStartMs), previewMime: "audio/wav",
  });
  if (begun.previewId) await putPieces(begun.previewId, preview);
  await putPieces(begun.id, u.file, (f) => onProgress?.(f * 0.95));
  await call(p, "beatFinish", { id: begun.id });
  onProgress?.(1);
  return { id: begun.id };
}

/** Sends a message to a chat: a text, a rap (an uploaded file), or both. */
export async function sendChat(p: Profile, owner: string, beat: string, buyer: string, text: string, rap: File | null, rapMs = 0): Promise<void> {
  let audioId: string | undefined;
  if (rap) {
    const begun = await call<{ id: string }>(p, "beatReplyBegin", { owner, beat, buyer, size: rap.size, durMs: rapMs, mime: rap.type || "audio/mpeg" });
    await putPieces(begun.id, rap);
    audioId = begun.id;
  }
  await call(p, "beatChatSend", { owner, beat, buyer, text: cleanChatText(text), ...(audioId ? { audioId } : {}) });
}

/** Takes a bought beat home: reads its pieces, joins them, and hands the browser the file. */
export async function downloadBeat(b: { id: string; title: string; mime: string; pieces: number }): Promise<void> {
  const blob = await loadAudio(b.id, b.pieces, b.mime);
  const ext = /wav/.test(b.mime) ? "wav" : /ogg/.test(b.mime) ? "ogg" : /mp4|m4a|aac/.test(b.mime) ? "m4a" : "mp3";
  saveBlob(blob, `${b.title}.${ext}`);
}
