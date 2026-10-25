// The raffle machine in the shop room, as the browser follows it: the round (ticket count, prize, the time of the draw), who holds how many tickets, what the last draw did,
// and a prize that waits for you at the machine. Everything is written by the server (server/src/actions/raffle.ts); the browser only reads and asks.
import { get, onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { toast } from "./ui/dom";
import { itemDef } from "./items";
import { FURNI_KINDS } from "./rooms";
import { parseLast, parseRound, parseTickets, ticketsSold } from "./shared/raffle";
import type { RaffleLast, RaffleRound } from "./shared/raffle";

export interface RaffleView {
  round: RaffleRound | null;
  tickets: Record<string, number>;
  sold: number;
  last: RaffleLast | null;
  /** the prizes that wait for this player at the machine */
  waiting: string[];
}

/** Follows the raffle (the round, the tickets, the last draw and your own waiting prizes); returns the stop function. */
export function watchRaffle(uid: string, cb: (v: RaffleView) => void): () => void {
  const v: RaffleView = { round: null, tickets: {}, sold: 0, last: null, waiting: [] };
  const push = (): void => cb({ ...v, tickets: { ...v.tickets }, waiting: [...v.waiting] });
  const stops = [
    onValue(ref(db, "raffle/round"), (s) => { v.round = parseRound(s.val()); push(); }, () => undefined),
    onValue(ref(db, "raffle/tickets"), (s) => { v.tickets = parseTickets(s.val()); v.sold = ticketsSold(v.tickets); push(); }, () => undefined),
    onValue(ref(db, "raffle/last"), (s) => { v.last = parseLast(s.val()); push(); }, () => undefined),
    onValue(ref(db, `raffle/prizes/${uid}`), (s) => { v.waiting = s.exists() ? Object.values(s.val() as Record<string, string>).filter((x) => typeof x === "string") : []; push(); }, () => undefined),
  ];
  return () => stops.forEach((s) => s());
}

export const raffleBuy = (p: Profile, n: number): Promise<{ tickets: number; left: number; cost: number }> => call(p, "raffleBuy", { n });
/** Runs the draw if its time has come (anybody may ask). */
export const raffleTick = (p: Profile): Promise<unknown> => call(p, "raffleTick");
export const raffleRemove = (p: Profile, uid: string, refund: boolean): Promise<{ removed: number; refunded: boolean }> => call(p, "raffleRemove", { uid, refund });
export const raffleCollect = (p: Profile): Promise<{ items: string[]; more: boolean }> => call(p, "raffleCollect");

export const prizeName = (kind: string): string => FURNI_KINDS[kind]?.label ?? itemDef(kind)?.name ?? kind;

/** the draw you were told about last (so a win is only announced once) */
const seenKey = (uid: string): string => `6ixplanet.raffleSeen.${uid}`;
const seenAt = (uid: string): number => { try { return Number(localStorage.getItem(seenKey(uid))) || 0; } catch { return 0; } };

/**
 * You won? Tells you once, with a big message: in your pocket, or waiting at the machine when the pockets were full. `onWin` runs first (the pocket is reloaded).
 * Called at login and whenever the shop room sees a new result.
 */
export function announceWin(p: Profile, last: RaffleLast | null, onWin?: () => void): boolean {
  if (!last || last.winner !== p.uid || last.drawAt <= seenAt(p.uid)) return false;
  try { localStorage.setItem(seenKey(p.uid), String(last.drawAt)); } catch { /* private mode */ }
  onWin?.();
  const name = prizeName(last.prize);
  toast(last.delivered ? `🎉 YOU WON!! The raffle gave you: ${name}. It is in your pocket.` : `🎉 YOU WON!! ${name}: your pockets are full, so it waits for you at the raffle machine in the shop.`);
  return true;
}

/** At login: asks for a draw that is due (nobody may have been in the shop at 20:00), then tells you if you won. */
export function checkRaffleAtLogin(p: Profile, refresh: () => void): void {
  void raffleTick(p).catch(() => undefined)
    .then(() => get(ref(db, "raffle/last")))
    .then((s) => { announceWin(p, parseLast(s.val()), refresh); }, () => undefined);
}
