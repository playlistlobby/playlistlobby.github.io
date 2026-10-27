// Blackjack in the browser (the rules: src/shared/blackjack.ts; the server runs the game: server/src/actions/blackjack.ts). The table is watched live; the dealer also reads the face-down card.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { parseBj } from "./shared/blackjack";
import type { BjTable } from "./shared/blackjack";

export const bjKey = (room: string, fid: string): string => `${room}_${fid}`;

export const bjSit = (p: Profile, room: string, fid: string, seat: number): Promise<unknown> => call(p, "bjSit", { room, fid, seat });
export const bjBet = (p: Profile, room: string, fid: string, amount: number): Promise<unknown> => call(p, "bjBet", { room, fid, amount });
export const bjAct = (p: Profile, room: string, fid: string, move: "hit" | "stand" | "double"): Promise<unknown> => call(p, "bjAct", { room, fid, move });
/** stands up (a player), or stops dealing and takes the bank (the dealer). Without a table it stands you up from wherever the server has you (after a refresh). */
export const bjLeave = (p: Profile, room?: string, fid?: string): Promise<{ take?: number }> => call(p, "bjLeave", room && fid ? { room, fid } : {});
export type DealerClick = "sit" | "leave" | "open" | "deal" | "reveal" | "draw" | "settle" | "auto";
export const bjDealer = (p: Profile, room: string, fid: string, op: DealerClick, bank?: number, on?: boolean): Promise<unknown> => call(p, "bjDealer", { room, fid, op, ...(bank !== undefined ? { bank } : {}), ...(on !== undefined ? { on } : {}) });
export const bjTick = (p: Profile, room: string, fid: string): Promise<unknown> => call(p, "bjTick", { room, fid });

export function watchBjTable(room: string, fid: string, cb: (t: BjTable | null) => void): () => void {
  return onValue(ref(db, `blackjack/${bjKey(room, fid)}`), (s) => cb(parseBj(s.val())), () => cb(null));
}
/** the dealer's face-down card (only the dealer may read it) */
export function watchBjHole(room: string, fid: string, cb: (card: number | null) => void): () => void {
  return onValue(ref(db, `bjHole/${bjKey(room, fid)}`), (s) => { const v = s.val(); cb(typeof v === "number" ? v : null); }, () => cb(null));
}
export function watchBjSeat(uid: string, cb: (at: { room: string; fid: string } | null) => void): () => void {
  return onValue(ref(db, `bjSeat/${uid}`), (s) => { const v = s.val(); cb(v && typeof v.room === "string" && typeof v.fid === "string" ? { room: v.room, fid: v.fid } : null); }, () => cb(null));
}
