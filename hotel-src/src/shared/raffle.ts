// The raffle machine in the shop room: 50 tickets for 100 blood each, one rare piece of furniture, a draw every day at 16:00 Danish time.
// Pure data and rules: the browser and the server both use it (the server does the buying and the drawing: server/src/actions/raffle.ts).
//   raffle/round            { drawAt, prize, sold }   the round that is open now (written only by the server)
//   raffle/tickets/<uid>    how many tickets that player holds in this round
//   raffle/last             what the last draw did: { drawAt, prize, sold, winner?, winnerName?, delivered?, tickets?, none? }
//   raffle/prizes/<uid>/<drawAt>  a prize that is waiting at the machine because the winner's pockets were full
import { SHOP_KIND_PREFIX, SHOP_PIECES } from "./furniture";

export const RAFFLE_TICKETS = 50;
/** blood per ticket (50 tickets = 5000 blood in all) */
export const RAFFLE_PRICE = 100;
/** the hour (Danish time) of the draw */
export const RAFFLE_HOUR = 16;
/** where the prize piece stands in the shop room (next to the machine), and the machine's own spot */
export const RAFFLE_PRIZE_ID = "shop_raffle_prize";

export interface RaffleRound { drawAt: number; prize: string; sold: number }
export interface RaffleLast { drawAt: number; prize: string; sold: number; winner?: string; winnerName?: string; delivered?: boolean; tickets?: number; none?: boolean }

/** The pieces the raffle can give away. For now the regular shop furniture, those small enough for the spot beside the machine (3x3 tiles). */
export const RAFFLE_POOL: string[] = SHOP_PIECES
  .filter((p) => { const sw = p.showDir === 2 || p.showDir === 6; const w = sw ? p.h : p.w, h = sw ? p.w : p.h; return w <= 3 && h <= 3; })
  .map((p) => SHOP_KIND_PREFIX + p.id);

const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Copenhagen", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
/** Danish time minus UTC at that moment, in milliseconds */
function copenhagenOffset(ts: number): number {
  const ps = parts.formatToParts(new Date(ts));
  const g = (t: string): number => Number(ps.find((p) => p.type === t)!.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - Math.floor(ts / 1000) * 1000;
}

/** The next 16:00 Danish time after `now` (a moment in milliseconds). */
export function nextDrawAt(now: number): number {
  const local = new Date(now + copenhagenOffset(now)); // (its UTC fields read as the Danish clock)
  for (let k = 0; k < 3; k++) {
    const naive = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + k, RAFFLE_HOUR);
    const t = naive - copenhagenOffset(naive - copenhagenOffset(naive));
    if (t > now) return t;
  }
  return now + 24 * 3_600_000;
}

/** how many tickets are held in all */
export const ticketsSold = (tickets: Record<string, number>): number => Object.values(tickets).reduce((n, v) => n + (Number.isInteger(v) && v > 0 ? v : 0), 0);

/** 3:05:09 / 12:09 */
export function countdownText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n: number): string => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

export function parseRound(v: unknown): RaffleRound | null {
  const r = v as Partial<RaffleRound> | null;
  if (!r || typeof r.drawAt !== "number" || typeof r.prize !== "string") return null;
  return { drawAt: r.drawAt, prize: r.prize, sold: Number.isInteger(r.sold) ? (r.sold as number) : 0 };
}
export function parseLast(v: unknown): RaffleLast | null {
  const r = v as Partial<RaffleLast> | null;
  if (!r || typeof r.drawAt !== "number" || typeof r.prize !== "string") return null;
  return { drawAt: r.drawAt, prize: r.prize, sold: Number(r.sold) || 0, ...(typeof r.winner === "string" ? { winner: r.winner } : {}), ...(typeof r.winnerName === "string" ? { winnerName: r.winnerName } : {}), ...(r.delivered ? { delivered: true } : {}), ...(Number.isInteger(r.tickets) ? { tickets: r.tickets } : {}), ...(r.none ? { none: true } : {}) };
}
export function parseTickets(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === "object") for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number" && Number.isInteger(n) && n > 0) out[k] = n;
  return out;
}
