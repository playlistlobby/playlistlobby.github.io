// The raffle machine in the shop room: 50 tickets for 100 blood each, one rare piece of furniture, a draw every day at 20:00 Danish time.
// Pure data and rules: the browser and the server both use it (the server does the buying and the drawing: server/src/actions/raffle.ts).
//   raffle/round            { drawAt, prize, sold }   the round that is open now (written only by the server)
//   raffle/tickets/<uid>    how many tickets that player holds in this round
//   raffle/last             what the last draw did: { drawAt, prize, sold, winner?, winnerName?, delivered?, tickets?, none? }
//   raffle/prizes/<uid>/<drawAt>  a prize that is waiting at the machine because the winner's pockets were full

export const RAFFLE_TICKETS = 50;
/** blood per ticket (50 tickets = 5000 blood in all) */
export const RAFFLE_PRICE = 100;
/** the hour (Danish time) of the draw */
export const RAFFLE_HOUR = 20;
/** where the prize piece stands in the shop room (next to the machine), and the machine's own spot */
export const RAFFLE_PRIZE_ID = "shop_raffle_prize";

export interface RaffleRound { drawAt: number; prize: string; sold: number }
export interface RaffleLast { drawAt: number; prize: string; sold: number; winner?: string; winnerName?: string; delivered?: boolean; tickets?: number; none?: boolean }

/** The pieces the raffle gives away, and the special effect each one has in the shop (drawn around it: see drawRareShine in src/ui/room.ts). All fit the spot beside the machine (3x3 tiles). */
export type RareEffect = "shine" | "rainbow" | "snow" | "ring" | "embers";
export const RAFFLE_EFFECTS: Record<string, RareEffect> = {
  f_whippet: "shine", // a pearly shimmer: a gold glow, twinkling stars and a streak of light that sweeps over it
  f_rarecloud: "rainbow", // colours that cycle through the rainbow
  f_raresnow: "snow", // an icy blue glow and snow that drifts down around it
  f_rareplatform: "ring", // light rings that spread over the floor around it
  f_rarelamp: "embers", // a fire glow and embers that rise
};
export const RAFFLE_POOL: string[] = Object.keys(RAFFLE_EFFECTS);

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
