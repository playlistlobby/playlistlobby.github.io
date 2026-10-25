// Russian roulette at the basement's table: what is on the table (rooms/lobby/roulette, written only by the server) and the things you can do at it.
// The rules and the fairness live on the server (server/src/actions/roulette.ts): the browser only asks, and plays what happened.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { parseRoulette } from "./shared/roulette";
import type { RouletteState } from "./shared/roulette";

export { ROULETTE_MAX, ROULETTE_TURN_MS, ROULETTE_OVER_MS } from "./shared/roulette";
export type { RouletteState } from "./shared/roulette";

/** Follows the table; returns the stop function. `cb` gets null while nobody is playing. */
export function watchRoulette(cb: (s: RouletteState | null) => void): () => void {
  return onValue(ref(db, "rooms/lobby/roulette"), (snap) => cb(parseRoulette(snap.val())), () => cb(null));
}

/** Sit down first, then name the stake: the blood goes on the table. */
export const rouletteOpen = (p: Profile, stake: number): Promise<unknown> => call(p, "rouletteOpen", { stake });
/** Match the stake on the table: the game begins. `gone`: the one who named it had got up (their blood went back). */
export const rouletteJoin = (p: Profile): Promise<{ gone?: boolean; first?: string }> => call(p, "rouletteJoin");
/** Stand up from the table (a stake nobody matched comes back; a game in progress is lost). */
export const rouletteLeave = (p: Profile): Promise<unknown> => call(p, "rouletteLeave");
/** Your turn: pull the trigger. */
export const roulettePull = (p: Profile): Promise<{ dead: boolean }> => call(p, "roulettePull");
/** Keeps the table honest (somebody gone, somebody taking too long). Anybody in the basement may call it. */
export const rouletteTick = (p: Profile): Promise<unknown> => call(p, "rouletteTick");
