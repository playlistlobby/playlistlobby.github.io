// The coin flip machine in the basement: what is on the board (coinflips/open, coinflips/done, both written by the server) and the three things you can do.
import { onValue, ref, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
export { FLIP_MAX, FLIP_MAX_OPEN } from "./shared/economy";

export type Side = "heads" | "tails";
export interface OpenFlip { id: string; by: string; name: string; stake: number; side: Side; ts: number }
export interface DoneFlip { id: string; by: string; name: string; taker: string; takerName: string; stake: number; side: Side; result: Side; winner: string; ts: number; at: number }

export const board: { open: OpenFlip[]; done: DoneFlip[] } = { open: [], done: [] };
const listeners = new Set<() => void>();
export const onBoard = (fn: () => void): (() => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const changed = (): void => listeners.forEach((fn) => fn());

let users = 0;
let stops: Unsubscribe[] = [];

/**
 * Follows the board while you are in a room with the machine. `onResolved` runs when a flip finishes (for anybody in the room: the machine spins),
 * with `mine` true when it was one you posted or took (its result is then shown to you).
 */
export function watchFlips(me: Profile, onResolved: (f: DoneFlip, mine: boolean) => void): () => void {
  if (users++ === 0) {
    let seen: Set<string> | null = null;
    stops = [
      onValue(ref(db, "coinflips/open"), (snap) => {
        board.open = Object.entries<any>(snap.val() ?? {}).map(([id, v]) => ({ id, ...v } as OpenFlip)).sort((a, b) => a.ts - b.ts);
        changed();
      }, () => undefined),
      onValue(ref(db, "coinflips/done"), (snap) => {
        board.done = Object.entries<any>(snap.val() ?? {}).map(([id, v]) => ({ id, ...v } as DoneFlip)).sort((a, b) => b.at - a.at);
        const fresh = seen ? board.done.filter((f) => !seen!.has(f.id)) : [];
        seen = new Set(board.done.map((f) => f.id)); // (the first look only learns what is already there)
        changed();
        for (const f of fresh) onResolvedAll.forEach((fn) => fn(f));
      }, () => undefined),
    ];
  }
  const mineOf = (f: DoneFlip): boolean => f.by === me.uid || f.taker === me.uid;
  const fn = (f: DoneFlip): void => onResolved(f, mineOf(f));
  onResolvedAll.add(fn);
  return () => {
    onResolvedAll.delete(fn);
    if (--users === 0) { stops.forEach((s) => s()); stops = []; board.open = []; board.done = []; }
  };
}
const onResolvedAll = new Set<(f: DoneFlip) => void>();

/** Put blood on heads or tails and leave the flip open for somebody to take. */
export const postFlip = (p: Profile, stake: number, side: Side): Promise<unknown> => call(p, "flipPost", { stake, side });
/** Take somebody's open flip: the coin is flipped at once. */
export const takeFlip = (p: Profile, id: string): Promise<{ result: Side; won: boolean; stake: number }> => call(p, "flipTake", { id });
/** Take back your own open flip (the blood comes back). */
export const cancelFlip = (p: Profile, id: string): Promise<unknown> => call(p, "flipCancel", { id });
