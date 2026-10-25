// Russian roulette at the basement's roulette table: what is on the table (rooms/lobby/roulette, written only by the server) and the numbers of the game.
// Pure: the browser and the server both use it.

/** the most blood one player can put on the table (both put the same amount down) */
export const ROULETTE_MAX = 500;
/** one bullet in a revolver with six chambers: every pull is a roll, so the odds grow as the chambers run out (1 in 6, 1 in 5 ... a sure thing on the sixth) */
export const ROULETTE_CHAMBERS = 6;
/** how long a player may sit with the gun before the server pulls the trigger for them */
export const ROULETTE_TURN_MS = 25_000;
/** how long a finished game stays on the table: the "you are dead" screen (10 s) and a little more, so everyone sees the end */
export const ROULETTE_OVER_MS = 14_000;
/** a player who is gone from the basement (a refresh, a log out, a dead connection) has this long to come back to the table before the game is lost for them */
export const ROULETTE_GONE_MS = 12_000;

export interface RouletteSeat {
  uid: string;
  name: string;
  /** how they look (so a player who is gone can still be shown in the chair) */
  figure?: string;
  /** which of the two chairs they sit on: 0 = the first, 1 = the second */
  seat?: 0 | 1;
}
export interface RouletteState {
  status: "waiting" | "playing" | "over";
  /** what each player has put on the table */
  stake: number;
  /** the one who sat down first and named the stake */
  a: RouletteSeat;
  /** the one who accepted it (not before the game starts) */
  b?: RouletteSeat;
  /** when the status last changed (server time, ms) */
  at: number;
  /** whose turn it is, how many times the trigger has been pulled, and since when this player has had the gun (server time, ms) */
  turn?: string;
  shots: number;
  turnAt?: number;
  /** counts up with every pull: the browsers play the pull when this changes */
  seq: number;
  /** the last pull: who pulled, whether it was the bullet, how many pulls that made, and when */
  last?: { by: string; dead: boolean; k: number; at: number };
  /** the game is over: who won, who died (nobody, when somebody got up and left) and when it ended */
  winner?: string;
  dead?: string;
  forfeit?: boolean;
  endAt?: number;
  /** players who were not in the basement when the server last looked: uid -> since when */
  gone?: Record<string, number>;
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const seatOf = (v: any): RouletteSeat | null => (v && typeof v.uid === "string"
  ? { uid: v.uid, name: String(v.name ?? "?").slice(0, 30), ...(typeof v.figure === "string" ? { figure: v.figure.slice(0, 200) } : {}), ...(v.seat === 0 || v.seat === 1 ? { seat: v.seat as 0 | 1 } : {}) }
  : null);

/** What the database holds as the table's state, made safe to use (null: nobody is playing). */
export function parseRoulette(v: any): RouletteState | null {
  if (!v || typeof v !== "object") return null;
  const status = v.status === "waiting" || v.status === "playing" || v.status === "over" ? v.status : null;
  const a = seatOf(v.a);
  if (!status || !a) return null;
  const b = seatOf(v.b) ?? undefined;
  const last = v.last && typeof v.last.by === "string" ? { by: String(v.last.by), dead: v.last.dead === true, k: num(v.last.k), at: num(v.last.at) } : undefined;
  const gone: Record<string, number> = {};
  for (const [uid, t] of Object.entries<any>(v.gone ?? {})) if (typeof t === "number") gone[uid] = t;
  return {
    status, stake: num(v.stake), a, ...(b ? { b } : {}), at: num(v.at), shots: num(v.shots), seq: num(v.seq),
    ...(typeof v.turn === "string" ? { turn: v.turn } : {}), ...(typeof v.turnAt === "number" ? { turnAt: v.turnAt } : {}),
    ...(last ? { last } : {}),
    ...(typeof v.winner === "string" ? { winner: v.winner } : {}), ...(typeof v.dead === "string" ? { dead: v.dead } : {}),
    ...(v.forfeit === true ? { forfeit: true } : {}), ...(typeof v.endAt === "number" ? { endAt: v.endAt } : {}),
    ...(Object.keys(gone).length ? { gone } : {}),
  };
}

/** is this player one of the two at the table? */
export const rouletteHas = (s: RouletteState | null, uid: string): boolean => !!s && (s.a.uid === uid || s.b?.uid === uid);
/** the other player at the table */
export const rouletteOther = (s: RouletteState, uid: string): RouletteSeat | undefined => (s.a.uid === uid ? s.b : s.a);
/** a finished game that has been shown long enough counts as no game */
export const rouletteExpired = (s: RouletteState, now: number): boolean => s.status === "over" && now - (s.endAt ?? s.at) > ROULETTE_OVER_MS;
