// The raffle machine in the shop room (see src/shared/raffle.ts): buy tickets for blood, and every day at 20:00 Danish time one ticket wins a rare piece of furniture.
// There is no timer on the server: the first request after 20:00 (anybody standing in the shop asks every little while, and so does everybody who logs in) runs the draw.
import { Action, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv } from "../../../src/shared/economy";
import { nextDrawAt, parseRound, parseTickets, RAFFLE_MAX_PER_PLAYER, RAFFLE_POOL, RAFFLE_PRICE, RAFFLE_TICKETS, RaffleRound, ticketsSold } from "../../../src/shared/raffle";

const ROUND = "raffle/round", TICKETS = "raffle/tickets", LAST = "raffle/last";

/** a fair whole number from 0 to n-1 */
function fairInt(n: number): number {
  if (n <= 1) return 0;
  const limit = Math.floor(0x1_0000_0000 / n) * n; // (throw away the top sliver so every number is equally likely)
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}
const pickPrize = (not?: string): string => {
  const pool = RAFFLE_POOL.filter((k) => k !== not);
  return pool[fairInt(pool.length)] ?? RAFFLE_POOL[0];
};

const holders = async (c: Ctx): Promise<Record<string, number>> => parseTickets(await c.db.get(TICKETS));

/** the draw (and the buying) change every ticket holder: all of them are locked, and the raffle itself */
const raffleLocks = async (c: Ctx): Promise<string[]> => ["raffle", ...Object.keys(await holders(c)).map((u) => `user:${u}`)];

/**
 * Makes sure there is an open round, and runs the draw if its time has come. Returns the round that is open afterwards and its tickets.
 * `drew` says a new round started in this very request (its ticket list is empty; the caller writes the list in full then).
 */
async function drawIfDue(c: Ctx): Promise<{ round: RaffleRound; tickets: Record<string, number>; drew: boolean }> {
  let round = parseRound(await c.db.get(ROUND));
  if (!round || !RAFFLE_POOL.includes(round.prize)) {
    round = { drawAt: nextDrawAt(c.now), prize: pickPrize(), sold: 0 };
    c.extra[ROUND] = round;
    return { round, tickets: {}, drew: false };
  }
  if (c.now < round.drawAt) return { round, tickets: await holders(c), drew: false };

  const tickets = await holders(c);
  const sold = ticketsSold(tickets);
  let winner: string | null = null;
  if (sold > 0) {
    let pick = fairInt(sold);
    for (const [uid, n] of Object.entries(tickets)) { if (pick < n) { winner = uid; break; } pick -= n; }
  }
  let prize = round.prize;
  if (winner) {
    let w;
    try { w = await c.user(winner); } catch { w = null; } // (an account that is gone can't win: the prize stays up)
    if (w) {
      const next = addToInv(w.s.inventory, { item: round.prize, qty: 1 });
      if (next) w.s.inventory = next;
      else c.extra[`raffle/prizes/${winner}/${round.drawAt}`] = round.prize; // the pockets are full: it waits at the machine
      c.extra[LAST] = { drawAt: round.drawAt, prize: round.prize, sold, winner, winnerName: String(w.raw.name ?? "?").slice(0, 16), delivered: !!next, tickets: tickets[winner] };
      prize = pickPrize(round.prize);
    } else winner = null;
  }
  if (!winner) c.extra[LAST] = { drawAt: round.drawAt, prize: round.prize, sold, none: true };
  const fresh: RaffleRound = { drawAt: nextDrawAt(c.now), prize, sold: 0 };
  c.extra[ROUND] = fresh;
  c.extra[TICKETS] = null;
  return { round: fresh, tickets: {}, drew: true };
}

/** Anybody may ask: runs the draw if it is due (the shop does it every little while, and a login does it too). */
export const raffleTick: Action = {
  locks: raffleLocks,
  async run(c) {
    const { round } = await drawIfDue(c);
    return { drawAt: round.drawAt };
  },
};

/** Buy tickets (100 blood each) while standing in the shop. The blood is spent for good. */
export const raffleBuy: Action = {
  locks: raffleLocks,
  async run(c, a) {
    await requireInRoom(c, "shop");
    const n = int(a.n, 1, RAFFLE_TICKETS, "number of tickets");
    const { round, tickets, drew } = await drawIfDue(c);
    const left = RAFFLE_TICKETS - ticketsSold(tickets);
    if (left <= 0) fail("The raffle is sold out. Wait for the draw.");
    if (n > left) fail(left === 1 ? "There is only 1 ticket left." : `There are only ${left} tickets left.`);
    const have = tickets[c.uid] ?? 0;
    if (have + n > RAFFLE_MAX_PER_PLAYER) fail(have >= RAFFLE_MAX_PER_PLAYER ? `You already have the most tickets one player can hold (${RAFFLE_MAX_PER_PLAYER}).` : `One player can hold ${RAFFLE_MAX_PER_PLAYER} tickets at most: you can buy ${RAFFLE_MAX_PER_PLAYER - have} more.`);
    const w = await c.user();
    const cost = n * RAFFLE_PRICE;
    if (w.s.blood < cost) fail(`You need ${cost - w.s.blood} more drops`);
    w.s.blood -= cost;
    c.note = `${n} tickets`;
    const mine = (tickets[c.uid] ?? 0) + n;
    if (drew) c.extra[TICKETS] = { [c.uid]: mine }; // (the draw has just cleared the list: it starts again with this)
    else c.extra[`${TICKETS}/${c.uid}`] = mine;
    c.extra[ROUND] = { ...round, sold: ticketsSold(tickets) + n };
    return { tickets: mine, left: left - n, cost };
  },
};

/** Admin: takes a player out of the raffle (all their tickets). With `refund` the blood comes back (100 per ticket); without it the blood stays gone. */
export const raffleRemove: Action = {
  locks: async (c, a) => ["raffle", `user:${String(a?.uid ?? "")}`],
  async run(c, a) {
    if (!c.isAdmin) fail("Only the admin can do that.");
    const uid = text(a.uid, /^[A-Za-z0-9]{10,40}$/, "player");
    const tickets = await holders(c);
    const n = tickets[uid];
    if (!n) fail("That player has no tickets.");
    const round = parseRound(await c.db.get(ROUND));
    c.extra[`${TICKETS}/${uid}`] = null;
    if (round) c.extra[ROUND] = { ...round, sold: Math.max(0, ticketsSold(tickets) - n) };
    if (a.refund) {
      const w = await c.user(uid);
      w.s.blood += n * RAFFLE_PRICE;
      c.note = `raffle refund ${n}`;
    }
    return { removed: n, refunded: !!a.refund };
  },
};

/** A prize that waited for room in the pockets: at the machine you can take it. */
export const raffleCollect: Action = {
  async run(c) {
    await requireInRoom(c, "shop");
    const waiting = (await c.db.get<Record<string, string>>(`raffle/prizes/${c.uid}`)) ?? {};
    const ids = Object.keys(waiting);
    if (!ids.length) fail("There is nothing waiting for you.");
    const w = await c.user();
    const got: string[] = [];
    for (const id of ids) {
      const next = addToInv(w.s.inventory, { item: waiting[id], qty: 1 });
      if (!next) break;
      w.s.inventory = next;
      c.extra[`raffle/prizes/${c.uid}/${id}`] = null;
      got.push(waiting[id]);
    }
    if (!got.length) fail("Your pockets are full: make room first.");
    c.note = "raffle prize";
    return { items: got, more: got.length < ids.length };
  },
};
