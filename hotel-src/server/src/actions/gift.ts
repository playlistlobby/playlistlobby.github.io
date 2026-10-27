// Gifts between friends: items only (never blood). The item leaves the sender's pocket in the same write that creates the gift, so it can't be
// copied; the receiver accepts it into their pocket or declines it, and a declined gift waits in the sender's "returned" list until they have room.
//   gifts/<to>/<id>        a gift waiting for its receiver
//   giftReturns/<from>/<id> a declined gift waiting for its sender
import { Action, ID_RE, int, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv, takeQtyFrom } from "../../../src/shared/economy";
import { isLaced, NO_DROP, STACKABLE } from "../../../src/shared/items";

const UID_RE = /^[A-Za-z0-9]{1,40}$/;
/** how many gifts can wait for one player at a time */
const MAX_WAITING = 20;

interface GiftRec { from: string; fromName: string; item: string; qty: number; ass?: boolean; at: number; declinedAt?: number }

/** puts a gift's item in the caller's pocket; fails when it doesn't fit */
function intoPocket(c: Ctx, w: Awaited<ReturnType<Ctx["user"]>>, g: GiftRec): void {
  let inv = w.s.inventory;
  const parts = STACKABLE.has(g.item) ? [g.qty] : Array.from({ length: g.qty }, () => 1);
  for (const q of parts) {
    const next = addToInv(inv, { item: g.item, qty: q, ...(g.ass ? { ass: true } : {}), ...(isLaced(g.item) && g.from !== c.uid ? { giver: g.from } : {}) });
    if (!next) return fail("Your pocket hasn't got room for it. Make some space first.");
    inv = next;
  }
  w.s.inventory = inv;
}

export const giftSend: Action = {
  async run(c, a) {
    const to = text(a.to, UID_RE, "player");
    if (to === c.uid) fail("You can't send a gift to yourself.");
    if (!(await c.db.get(`friends/${c.uid}/${to}`))) fail("You can only send gifts to your friends.");
    if ((await c.db.keys(`gifts/${to}`)).length >= MAX_WAITING) fail("They have too many gifts waiting. Try again later.");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it) fail("You aren't carrying that.");
    if (it!.lit) fail("Wait for it to burn out first.");
    if (it!.inPlayer) fail("That's in the player right now.");
    if (NO_DROP.has(it!.item)) fail("That can't be given away.");
    const qty = int(a.qty ?? 1, 1, 999, "amount");
    if (qty > it!.qty) fail("You haven't got that many.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, qty);
    const id = `g${c.now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const rec: GiftRec = { from: c.uid, fromName: String(w.raw?.name ?? "?").slice(0, 16), item: it!.item, qty, ...(it!.ass ? { ass: true } : {}), at: c.now };
    c.extra[`gifts/${to}/${id}`] = rec;
    return { id };
  },
};

export const giftAnswer: Action = {
  async run(c, a) {
    const id = text(a.id, ID_RE, "gift");
    const g = await c.db.get<GiftRec>(`gifts/${c.uid}/${id}`);
    if (!g || typeof g.item !== "string" || typeof g.from !== "string") return fail("That gift is gone.");
    if (a.accept === true) {
      const w = await c.user();
      if (!(await c.validItem())(g.item)) fail("That doesn't exist any more.");
      intoPocket(c, w, g);
      c.extra[`gifts/${c.uid}/${id}`] = null;
      return { item: g.item, qty: g.qty };
    }
    c.extra[`gifts/${c.uid}/${id}`] = null;
    c.extra[`giftReturns/${g.from}/${id}`] = { ...g, declinedAt: c.now };
    return {};
  },
};

export const giftCollect: Action = {
  async run(c, a) {
    const id = text(a.id, ID_RE, "gift");
    const g = await c.db.get<GiftRec>(`giftReturns/${c.uid}/${id}`);
    if (!g || typeof g.item !== "string") return fail("That gift is gone.");
    const w = await c.user();
    intoPocket(c, w, g);
    c.extra[`giftReturns/${c.uid}/${id}`] = null;
    return { item: g.item, qty: g.qty };
  },
};
