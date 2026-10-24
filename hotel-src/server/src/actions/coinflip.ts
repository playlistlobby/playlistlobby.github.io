// The coin flip machine in the basement: a player puts blood on heads or tails and leaves the flip open; another player takes it
// (puts the same amount down) and the server flips the coin. The winner gets both stakes. The blood of an open flip sits in the flip
// (taken from the poster when it is posted, given back if they call it off), so nothing is ever created or lost.
//   coinflips/open/<id>  = { by, name, stake, side, ts }
//   coinflips/done/<id>  = { by, name, taker, takerName, stake, side, result, winner, ts, at }   (kept for a day)
// Flips count against the same 24 hour limit as trades (TRADE_BLOOD_CAP), so two accounts can't use them to pass blood around it.
import { Action, ID_RE, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { FLIP_KEEP_MS, FLIP_MAX, FLIP_MAX_OPEN, TRADE_BLOOD_CAP, TRADE_BLOOD_WINDOW_MS, tradeBloodLeft } from "../../../src/shared/economy";

interface OpenFlip { by: string; name: string; stake: number; side: "heads" | "tails"; ts: number }

const newId = (now: number): string => `${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** counts a stake against the player's 24 hour blood limit (or says no) */
function useLimit(c: Ctx, w: { s: { tradeCap: { at: number; n: number }; noTradeLimit?: boolean } }, stake: number): void {
  const left = tradeBloodLeft(w.s, c.now);
  if (stake > left) fail(`You can only put ${left} more blood into trades and flips for now (the limit is ${TRADE_BLOOD_CAP} per 24 hours).`);
  const fresh = c.now - w.s.tradeCap.at >= TRADE_BLOOD_WINDOW_MS;
  if (!w.s.noTradeLimit) w.s.tradeCap = { at: fresh ? c.now : w.s.tradeCap.at, n: (fresh ? 0 : w.s.tradeCap.n) + stake };
}

/** finished flips older than a day leave the board */
async function sweep(c: Ctx): Promise<void> {
  for (const k of await c.db.keys("coinflips/done")) {
    const t = parseInt(k.slice(0, 8), 36);
    if (Number.isFinite(t) && c.now - t > FLIP_KEEP_MS) c.extra[`coinflips/done/${k}`] = null;
  }
}

const flipOf = async (c: Ctx, id: string): Promise<OpenFlip> => {
  const f = await c.db.get<OpenFlip>(`coinflips/open/${id}`);
  if (!f || typeof f.by !== "string" || !Number.isInteger(f.stake)) return fail("That flip is gone.");
  return f;
};

export const flipPost: Action = {
  async run(c, a) {
    await requireInRoom(c, "lobby");
    const stake = int(a.stake, 1, FLIP_MAX, "amount");
    const side = a.side === "heads" || a.side === "tails" ? a.side : fail("Heads or tails?");
    const w = await c.user();
    if (w.s.blood < stake) fail("You don't have that much blood.");
    const open = (await c.db.get<Record<string, OpenFlip>>("coinflips/open")) ?? {};
    if (Object.values(open).filter((f) => f.by === c.uid).length >= FLIP_MAX_OPEN) fail(`You can only have ${FLIP_MAX_OPEN} open flips at a time.`);
    useLimit(c, w, stake);
    w.s.blood -= stake;
    const id = newId(c.now);
    const flip: OpenFlip = { by: c.uid, name: String(w.raw?.name ?? "?").slice(0, 30), stake, side, ts: c.now };
    c.extra[`coinflips/open/${id}`] = flip;
    await sweep(c);
    return { id };
  },
};

export const flipTake: Action = {
  async locks(c, a) {
    const id = text(a?.id, ID_RE, "flip");
    const f = await flipOf(c, id);
    return [`flip:${id}`, `user:${f.by}`];
  },
  async run(c, a) {
    const id = text(a.id, ID_RE, "flip");
    await requireInRoom(c, "lobby");
    const f = await flipOf(c, id);
    if (f.by === c.uid) fail("That's your own flip.");
    const poster = await c.user(f.by);
    const me = await c.user();
    if (me.s.blood < f.stake) fail("You don't have that much blood.");
    useLimit(c, me, f.stake);
    me.s.blood -= f.stake;
    const coin = crypto.getRandomValues(new Uint8Array(1))[0] & 1 ? "heads" : "tails";
    const winner = coin === f.side ? f.by : c.uid;
    (winner === f.by ? poster : me).s.blood += f.stake * 2;
    c.note = `${f.stake}`;
    c.extra[`coinflips/open/${id}`] = null;
    c.extra[`coinflips/done/${id}`] = { by: f.by, name: f.name, taker: c.uid, takerName: String(me.raw?.name ?? "?").slice(0, 30), stake: f.stake, side: f.side, result: coin, winner, ts: f.ts, at: c.now };
    await sweep(c);
    return { result: coin, won: winner === c.uid, stake: f.stake };
  },
};

export const flipCancel: Action = {
  async locks(c, a) {
    return [`flip:${text(a?.id, ID_RE, "flip")}`];
  },
  async run(c, a) {
    const id = text(a.id, ID_RE, "flip");
    const f = await flipOf(c, id);
    if (f.by !== c.uid) fail("That isn't your flip.");
    const w = await c.user();
    w.s.blood += f.stake;
    c.extra[`coinflips/open/${id}`] = null;
    return {};
  },
};
