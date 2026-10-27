// The BeatShop (a vending machine you put in your room, sold in the shop's record box): a player sells beats there, other players buy them. Pure: the browser and the server both use it.
//   beats/<owner>/<id>             a beat on sale (the id is the id of its audio file)                          written by the server
//   beatBuys/<buyer>/<id>          what a player bought: always there, the BeatShop shows the download for an hour, SoundCloud's "Owned beats" for good
//   beatChats/<owner>/<thread>     one chat per buyer and beat: who, the beat, the last message, who has unread   (thread = <beat id>_<buyer uid>)
//   beatChatMsgs/<owner>/<thread>  its messages (a text, an audio reply, or both)
import { cleanTitle } from "./songs";

export const BEATSHOP_KIND = "f_beatshop";
/** the record box sells the machine for blood, one per player (the key in `owned`) */
export const BEATSHOP_PRICE = 50;
export const BEATSHOP_OWNED_KEY = "item_f_beatshop";
/** a seller can have this many beats on sale at a time */
export const BEATS_MAX = 15;
export const BEAT_PRICE_MIN = 1;
export const BEAT_PRICE_MAX = 10_000;
/** a cropped preview is this long */
export const PREVIEW_MS = 30_000;
/** after buying, the download is in the BeatShop for this long (and under SoundCloud > Profile > Owned beats for good) */
export const DOWNLOAD_LINK_MS = 60 * 60_000;
/** a chat keeps this many messages; a text is this long */
export const CHAT_MSGS_MAX = 100;
export const CHAT_TEXT_MAX = 200;

export interface Beat {
  id: string;
  owner: string;
  title: string;
  price: number;
  durMs: number;
  size: number;
  mime: string;
  pieces: number;
  /** the audio of the 30 second preview (a crop): the id and what it needs to be played; or the beat itself when the whole beat is the preview */
  previewId: string;
  previewPieces: number;
  previewMime: string;
  previewMs: number;
  /** the whole beat is open to listen to (so it is open to take, too) */
  whole: boolean;
  at: number;
  sold: number;
}
export function parseBeats(raw: unknown, owner: string): Beat[] {
  if (!raw || typeof raw !== "object") return [];
  const out: Beat[] = [];
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || v.ready !== true || typeof v.title !== "string" || typeof v.price !== "number" || typeof v.pieces !== "number") continue;
    out.push({
      id, owner, title: v.title, price: v.price, durMs: Number(v.durMs) || 0, size: Number(v.size) || 0, mime: String(v.mime || "audio/mpeg"), pieces: v.pieces,
      previewId: typeof v.previewId === "string" ? v.previewId : id, previewPieces: Number(v.previewPieces) || v.pieces, previewMime: String(v.previewMime || v.mime || "audio/mpeg"),
      previewMs: Number(v.previewMs) || Number(v.durMs) || 0, whole: v.whole === true, at: Number(v.at) || 0, sold: Number(v.sold) || 0,
    });
  }
  return out.sort((a, b) => b.at - a.at);
}
export interface OwnedBeat { id: string; owner: string; ownerName: string; title: string; mime: string; pieces: number; durMs: number; at: number }
export function parseOwnedBeats(raw: unknown): OwnedBeat[] {
  if (!raw || typeof raw !== "object") return [];
  const out: OwnedBeat[] = [];
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || typeof v.title !== "string" || typeof v.pieces !== "number" || typeof v.owner !== "string") continue;
    out.push({ id, owner: v.owner, ownerName: String(v.ownerName ?? "?"), title: v.title, mime: String(v.mime || "audio/mpeg"), pieces: v.pieces, durMs: Number(v.durMs) || 0, at: Number(v.at) || 0 });
  }
  return out.sort((a, b) => b.at - a.at);
}
/** the download link is shown in the BeatShop for an hour after the purchase */
export const downloadOpen = (boughtAt: number, now: number): boolean => now - boughtAt < DOWNLOAD_LINK_MS;

export const cleanBeatTitle = cleanTitle;
/** a message in a chat: no control characters, one line, 200 characters */
export const cleanChatText = (v: unknown): string => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, CHAT_TEXT_MAX);

export const threadKey = (beat: string, buyer: string): string => `${beat}_${buyer}`;
export function parseThread(key: string): { beat: string; buyer: string } | null {
  const m = /^([a-z0-9]{3,30})_([A-Za-z0-9]{6,40})$/.exec(key);
  return m ? { beat: m[1], buyer: m[2] } : null;
}
export interface ChatMeta {
  key: string;
  beat: string;
  buyer: string;
  buyerName: string;
  ownerName: string;
  title: string;
  lastText: string;
  lastAudio: boolean;
  lastBy: string;
  lastAt: number;
  unreadOwner: boolean;
  unreadBuyer: boolean;
}
export function parseChats(raw: unknown): ChatMeta[] {
  if (!raw || typeof raw !== "object") return [];
  const out: ChatMeta[] = [];
  for (const [key, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || typeof v.beat !== "string" || typeof v.buyer !== "string") continue;
    out.push({
      key, beat: v.beat, buyer: v.buyer, buyerName: String(v.buyerName ?? "?"), ownerName: String(v.ownerName ?? "?"), title: String(v.title ?? "?"), lastText: String(v.lastText ?? ""),
      lastAudio: v.lastAudio === true, lastBy: String(v.lastBy ?? ""), lastAt: Number(v.lastAt) || 0, unreadOwner: v.unreadOwner === true, unreadBuyer: v.unreadBuyer === true,
    });
  }
  return out.sort((a, b) => b.lastAt - a.lastAt);
}
export interface ChatMsg { id: string; by: string; name: string; text: string; audio?: { id: string; pieces: number; mime: string; durMs: number }; at: number }
export function parseMsgs(raw: unknown): ChatMsg[] {
  if (!raw || typeof raw !== "object") return [];
  const out: ChatMsg[] = [];
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || typeof v.by !== "string") continue;
    const a = v.audio as Record<string, unknown> | undefined;
    out.push({
      id, by: v.by, name: String(v.name ?? "?"), text: String(v.text ?? ""), at: Number(v.at) || 0,
      ...(a && typeof a.id === "string" && typeof a.pieces === "number" ? { audio: { id: a.id, pieces: a.pieces, mime: String(a.mime || "audio/mpeg"), durMs: Number(a.durMs) || 0 } } : {}),
    });
  }
  return out.sort((a, b) => a.at - b.at);
}
