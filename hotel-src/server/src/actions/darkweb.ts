// The dark web (the hideout computer's tab): big orders the whole hideout fills together (see src/shared/darkweb.ts).
//   darkwebGive {room, order, item, qty}   hand in some of one line of an order; you are paid 1.5 x 6ixty's price for each one at once, and the hideout's bar moves
import { Action, int, requireHideoutMember, text } from "./util";
import { fail } from "../ctx";
import { takeQtyFrom } from "../../../src/shared/economy";
import { danishDayKey } from "../../../src/shared/streets";
import { DW_ORDERS, dwFilled, dwLeft, dwUnitPay } from "../../../src/shared/darkweb";
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
    const pay = dwUnitPay(item) * gave;
    w.s.blood += pay;
    const got = { ...(prog.got ?? {}), [item]: (Number(prog.got?.[item]) || 0) + gave };
    const next: DwProgress = { got, by: { ...(prog.by ?? {}), [c.uid]: (Number(prog.by?.[c.uid]) || 0) + gave } };
    if (dwFilled(order!, next)) next.done = true;
    c.extra[base] = next;
    c.note = `dark web ${gave} ${item} for ${pay}`;
    return { gave, pay, done: !!next.done };
  },
};
