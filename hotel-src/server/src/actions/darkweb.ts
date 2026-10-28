// The dark web (the hideout computer's tab): big orders the whole hideout fills together (see src/shared/darkweb.ts).
//   darkwebGive {room, order, item, qty}   hand in some of one line of an order (before 21:00 Danish time); nothing is paid yet: your share (1.5 x what your items are worth) is collected after the order has shipped, and the hideout's bar moves
//   darkwebCollect {room, day, order}      20 minutes after an order was filled: collect your share (once)
import { Action, int, requireHideoutMember, text } from "./util";
import { fail } from "../ctx";
import { takeQtyFrom } from "../../../src/shared/economy";
import { danishDayKey } from "../../../src/shared/streets";
import { DW_DEADLINE_HOUR, DW_ORDERS, DW_SHIP_MS, dwFilled, dwLeft, dwOpen, dwUnitPay } from "../../../src/shared/darkweb";
import type { DwProgress } from "../../../src/shared/darkweb";

export const darkwebGive: Action = {
  locks: (_c, a) => [`darkweb:${typeof a?.room === "string" ? a.room : ""}`],
  async run(c, a) {
    const room = text(a.room, /^h_[A-Za-z0-9]{1,40}$/, "hideout");
    await requireHideoutMember(c, room);
    const owner = room.slice(2);
    const order = DW_ORDERS.find((o) => o.id === a.order);
    if (!order) fail("There is no such order.");
    const item = text(a.item, /^[a-z0-9_]{2,24}$/, "item");
    if (!order!.lines.some((l) => l.item === item)) fail("That isn't in the order.");
    if (!dwOpen(c.now).open) fail(`The dark web closed for today at ${DW_DEADLINE_HOUR}:00. The orders are back tomorrow.`);
    const day = danishDayKey(c.now);
    const base = `darkweb/${owner}/${day}/${order!.id}`;
    const prog = (await c.db.get<DwProgress>(base)) ?? {};
    const left = dwLeft(order!, prog, item);
    if (left <= 0) fail(dwFilled(order!, prog) ? "That order is filled for today." : "That part of the order is filled already.");
    const want = Math.min(int(a.qty ?? 1, 1, 99, "amount"), left);
    const w = await c.user();
    let inv = w.s.inventory;
    let need = want;
    for (let i = 0; i < inv.length && need > 0; i++) { // (not lit, not loaned, not ass weed)
      const s = inv[i];
      if (!s || s.item !== item || s.lit || s.inPlayer || s.ass) continue;
      const take = Math.min(need, s.qty);
      inv = takeQtyFrom(inv, i, take);
      need -= take;
    }
    if (need === want) fail("You haven't got any of that on you.");
    const gave = want - need;
    w.s.inventory = inv;
    const value = dwUnitPay(item) * gave; // (paid when the order has shipped: this is your share of it)
    const got = { ...(prog.got ?? {}), [item]: (Number(prog.got?.[item]) || 0) + gave };
    const next: DwProgress = { got, by: { ...(prog.by ?? {}), [c.uid]: (Number(prog.by?.[c.uid]) || 0) + value } };
    if (dwFilled(order!, next)) { next.done = true; next.readyAt = c.now + DW_SHIP_MS; }
    c.extra[base] = next;
    c.note = `dark web ${gave} ${item} worth ${value}`;
    return { gave, value, done: !!next.done, readyAt: next.readyAt ?? 0 };
  },
};

/** Collecting your share of an order that has shipped (20 minutes after it was filled): what your items were worth, once. */
export const darkwebCollect: Action = {
  locks: (_c, a) => [`darkweb:${typeof a?.room === "string" ? a.room : ""}`],
  async run(c, a) {
    const room = text(a.room, /^h_[A-Za-z0-9]{1,40}$/, "hideout");
    await requireHideoutMember(c, room);
    const owner = room.slice(2);
    const day = text(a.day, /^[0-9]{8}$/, "day");
    const order = DW_ORDERS.find((o) => o.id === a.order);
    if (!order) fail("There is no such order.");
    const base = `darkweb/${owner}/${day}/${order!.id}`;
    const prog = await c.db.get<DwProgress>(base);
    if (!prog || !prog.done || !prog.readyAt) fail("That order hasn't been filled.");
    if (c.now < prog!.readyAt!) fail(`The order is still on its way. It has shipped in ${Math.max(1, Math.ceil((prog!.readyAt! - c.now) / 60000))} min.`);
    const share = Number(prog!.by?.[c.uid]) || 0;
    if (share <= 0) fail("You didn't put anything in that order.");
    if (prog!.paid?.[c.uid]) fail("You have collected your share already.");
    const w = await c.user();
    w.s.blood += share;
    c.extra[`${base}/paid/${c.uid}`] = true;
    c.note = `dark web share ${share}`;
    return { share };
  },
};
