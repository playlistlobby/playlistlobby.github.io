// The mixer: a piece of furniture in your own room. Two of your things go in; it works for 10 minutes; you collect what it made.
// The batch lives on the mixer's row (mixJob), so it carries on while you're away.
import { Action, ID_RE, int, requireWorkRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv, MIX_MS, takeOneFrom } from "../../../src/shared/economy";
import { mixRecipe } from "../../../src/shared/items";

interface MixerRow { kind?: string; mixJob?: { item: string; qty: number; doneAt: number; ms?: number } }
async function mixer(c: Ctx, fid: unknown, want?: unknown): Promise<{ path: string; row: MixerRow }> {
  const room = await requireWorkRoom(c, want); // (your own room, or a hideout you are in: every member may use its mixers)
  const id = text(fid, ID_RE, "mixer");
  const path = `roomsMeta/${room}/furni/${id}`;
  const row = await c.db.get<MixerRow>(path);
  if (!row || row.kind !== "f_mixer") return fail("There's no mixer there.");
  return { path, row };
}

export const mix: Action = {
  locks: (c, a) => [`room:${typeof a?.room === "string" ? a.room : `u_${c.uid}`}`],
  async run(c, a) {
    const { path, row } = await mixer(c, a.fid, a.room);
    if (row.mixJob) fail("The mixer is busy.");
    const w = await c.user();
    const ia = int(a.a, 0, 27, "slot"), ib = int(a.b, 0, 27, "slot");
    const x = w.s.inventory[ia], y = w.s.inventory[ib];
    if (!x || !y) fail("Those don't go together.");
    if (ia === ib && (x!.qty < 2 || x!.item !== "cigbutt")) fail("Pick two different things."); // (only 2 butts out of one stack can go in together)
    const r = mixRecipe(x!, y!);
    if (!r) fail("Those don't mix.");
    let next = takeOneFrom(w.s.inventory, ia);
    next = takeOneFrom(next, ib);
    if (r!.back) { const withBack = addToInv(next, r!.back); if (!withBack) fail("Your inventory is full."); next = withBack!; } // (the emptied can: its old slot is free)
    w.s.inventory = next;
    const ms = r!.ms ?? MIX_MS; // 10 to 30 minutes: the dearer the result, the longer
    c.extra[`${path}/mixJob`] = { item: r!.give.item, qty: r!.give.qty, doneAt: c.now + ms, ms };
    return { note: `The mixer starts up. It needs ${Math.round(ms / 60_000)} minutes.`, doneAt: c.now + ms };
  },
};

export const mixCollect: Action = {
  locks: (c, a) => [`room:${typeof a?.room === "string" ? a.room : `u_${c.uid}`}`],
  async run(c, a) {
    const { path, row } = await mixer(c, a.fid, a.room);
    const job = row.mixJob;
    if (!job) fail("There's nothing in the mixer.");
    if (c.now < job!.doneAt) fail("It isn't done yet.");
    const w = await c.user();
    const added = addToInv(w.s.inventory, { item: job!.item, qty: job!.qty });
    if (!added) fail("Your inventory is full");
    w.s.inventory = added!;
    w.s.mixed[job!.item] = true; // now you know what that mix makes
    c.extra[`${path}/mixJob`] = null;
    return { item: job!.item, qty: job!.qty };
  },
};
