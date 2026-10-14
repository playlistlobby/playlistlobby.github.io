// The mixer: a piece of furniture in your own room. Two of your things go in, something new comes out.
import { Action, ID_RE, int, requireOwnRoom, text } from "./util";
import { fail } from "../ctx";
import { addToInv, takeOneFrom } from "../../../src/shared/economy";
import { mixRecipe } from "../../../src/shared/items";

export const mix: Action = {
  async run(c, a) {
    const room = await requireOwnRoom(c);
    const fid = text(a.fid, ID_RE, "mixer");
    const row = await c.db.get<{ kind?: string }>(`roomsMeta/${room}/furni/${fid}`);
    if (!row || row.kind !== "f_mixer") fail("There's no mixer there.");
    const w = await c.user();
    const ia = int(a.a, 0, 27, "slot"), ib = int(a.b, 0, 27, "slot");
    if (ia === ib) fail("Pick two different things.");
    const x = w.s.inventory[ia], y = w.s.inventory[ib];
    if (!x || !y) fail("Those don't go together.");
    const r = mixRecipe(x!, y!);
    if (!r) fail("Those don't mix.");
    let next = takeOneFrom(w.s.inventory, ia);
    next = takeOneFrom(next, ib);
    const added = addToInv(next, r!.give);
    if (!added) fail("Your inventory is full");
    w.s.inventory = added!;
    return { note: r!.note, item: r!.give.item, qty: r!.give.qty };
  },
};
