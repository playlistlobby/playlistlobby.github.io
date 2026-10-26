// Poker in the browser (the rules: src/shared/poker.ts; the server deals and decides: server/src/actions/poker.ts). The table is watched live; you only ever see your own cards.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { parsePoker } from "./shared/poker";
import type { PokerMove, PokerTable } from "./shared/poker";

export const pokerKey = (room: string, fid: string): string => `${room}_${fid}`;

export const pokerSit = (p: Profile, room: string, fid: string, seat: number, buy: number): Promise<{ seat: number }> => call(p, "pokerSit", { room, fid, seat, buy });
export const pokerAct = (p: Profile, room: string, fid: string, move: PokerMove, to?: number): Promise<unknown> => call(p, "pokerAct", { room, fid, move, ...(to !== undefined ? { to } : {}) });
/** stands up and takes the blood in front of you. Without a table it stands you up from wherever the server has you sitting (after a refresh). */
export const pokerLeave = (p: Profile, room?: string, fid?: string): Promise<{ take?: number }> => call(p, "pokerLeave", room && fid ? { room, fid } : {});
export const pokerTick = (p: Profile, room: string, fid: string): Promise<unknown> => call(p, "pokerTick", { room, fid });

/** The table, live (null: nobody sits there). */
export function watchPokerTable(room: string, fid: string, cb: (t: PokerTable | null) => void): () => void {
  return onValue(ref(db, `poker/${pokerKey(room, fid)}`), (s) => cb(parsePoker(s.val())), () => cb(null));
}
/** Your own two cards, live (null: you have none). */
export function watchPokerHole(room: string, fid: string, uid: string, cb: (cards: number[] | null) => void): () => void {
  return onValue(ref(db, `pokerHole/${pokerKey(room, fid)}/${uid}`), (s) => { const v = s.val(); cb(Array.isArray(v) ? v.filter((c: unknown): c is number => typeof c === "number") : null); }, () => cb(null));
}
/** Where you are sitting now (a refresh or a new log in can find the way back to the table, or stand you up). */
export function watchPokerSeat(uid: string, cb: (at: { room: string; fid: string } | null) => void): () => void {
  return onValue(ref(db, `pokerSeat/${uid}`), (s) => { const v = s.val(); cb(v && typeof v.room === "string" && typeof v.fid === "string" ? { room: v.room, fid: v.fid } : null); }, () => cb(null));
}
