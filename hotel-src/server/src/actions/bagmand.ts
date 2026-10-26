// Bagmand, the visiting vendor in the basement (see src/shared/bagmand.ts): buying poppy seeds and his blue weed, selling back what they turn into, and the loudpack's deadly stab.
import { Action, cheb, ID_RE, int, requireInRoom, text } from "./util";
import { fail } from "../ctx";
import type { Ctx } from "../ctx";
import { isEmulator } from "../env";
import { addToInv, takeQtyFrom } from "../../../src/shared/economy";
import { findSlot } from "../../../src/shared/items";
import { BAGMAND_BUY, bagmandPays, BAGMAN_ROOM, currentVisit, DEADLY_DROP, VISIT_MS } from "../../../src/shared/bagmand";
import { bloodPile } from "./floor";
import { roleOf } from "./mod";

/** The start of the visit that is on now (in the local emulator a test can open one by hand: bagmand/force). */
async function openVisit(c: Ctx): Promise<number> {
  if (isEmulator(c.env)) {
    const forced = await c.db.get<number>("bagmand/force");
    if (forced === 1) return Math.floor(c.now / VISIT_MS) * VISIT_MS; // (a test: 1 = he is always here)
    if (typeof forced === "number" && c.now >= forced && c.now < forced + VISIT_MS) return forced;
  }
  const start = currentVisit(c.now);
  if (start === null) fail("Bagmand isn't here. He comes at 01:00, 10:00 and 15:00 for an hour.");
  return start!;
}

/** Buying: the stock of the limited things is the same for everybody in a visit, first come first served. */
export const bagmandBuy: Action = {
  locks: () => ["bagmand"],
  async run(c, a) {
    await requireInRoom(c, BAGMAN_ROOM);
    const start = await openVisit(c);
    const item = text(a.item, /^[a-z]{3,20}$/, "item");
    const def = BAGMAND_BUY[item];
    if (!def) fail("He doesn't sell that.");
    const qty = int(a.qty ?? 1, 1, 99, "amount");
    let sold = 0;
    if (def.stock !== null) {
      sold = (await c.db.get<number>(`bagmand/${start}/sold/${item}`)) ?? 0;
      const left = def.stock - sold;
      if (left <= 0) fail("He's sold out of those for today's visit.");
      if (qty > left) fail(left === 1 ? "There is only 1 left." : `There are only ${left} left.`);
    }
    const w = await c.user();
    const cost = def.price * qty;
    if (w.s.blood < cost) fail(`You need ${cost - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item, qty });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= cost;
    if (def.stock !== null) c.extra[`bagmand/${start}/sold/${item}`] = sold + qty;
    c.note = `${qty} ${item}`;
    return { cost, left: def.stock === null ? null : def.stock - sold - qty };
  },
};

/** Selling what he buys back (the prices are in BAGMAND_SELL). */
export const bagmandSell: Action = {
  locks: () => ["bagmand"],
  async run(c, a) {
    await requireInRoom(c, BAGMAN_ROOM);
    await openVisit(c);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    const each = it ? bagmandPays(it) : null;
    if (!it || each === null || it.lit || it.inPlayer) fail("He doesn't buy that.");
    const qty = Math.max(1, Math.min(Math.floor(Number(a.qty) || 1), it!.qty));
    const gain = each! * qty;
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, qty);
    w.s.blood += gain;
    c.note = `${qty} ${it!.item}`;
    return { gain, qty };
  },
};

/**
 * The loudpack's deadly stab: kills somebody in the room (no boost, no once-a-day limit, any player standing within reach): they drop 10 blood on the floor where they fall
 * and are sent home (their browser reads sendHome/<uid>). Not on a player who plays on your device, not on a mod or an admin.
 */
export const deadlyStab: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`, `room:${String(a?.room ?? "")}`],
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't stab yourself.");
    const room = text(a.room, /^[A-Za-z0-9_-]{1,60}$/, "room");
    const me = await requireInRoom(c, room);
    const theirs = await c.db.get<{ x?: number; y?: number }>(`rooms/${room}/players/${target}`);
    if (!theirs) fail("They've left the room.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > 3) fail("They're too far away.");
    const name = String((await c.db.get<string>(`profiles/${target}/name`)) ?? "");
    if (!name) fail("They aren't a player.");
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't stab someone who plays on your device.");
    if (await roleOf(c, target)) fail("Your knife won't go in. That one is protected.");
    const w = await c.user();
    const s = w.s;
    if (s.deadlyLeft <= 0 || c.now >= s.deadlyUntil) fail("You have no deadly stab.");
    if (findSlot(s.inventory, "knife") < 0 && findSlot(s.inventory, "machete") < 0) fail("You need a knife for that.");
    const v = await c.user(target);
    const drop = Math.min(DEADLY_DROP, Math.max(0, Math.floor(v.s.blood)));
    v.s.blood -= drop;
    s.deadlyLeft -= 1;
    if (s.deadlyLeft <= 0) s.deadlyUntil = 0;
    c.note = `deadly stab on ${name}`;
    if (drop > 0) await bloodPile(c, room, typeof theirs!.x === "number" && typeof theirs!.y === "number" ? { x: theirs!.x, y: theirs!.y } : null, drop, target, name);
    c.extra[`sendHome/${target}`] = { at: c.now, by: c.uid, byName: String(w.raw.name ?? "someone").slice(0, 16), lost: drop };
    return { dropped: drop, left: s.deadlyLeft };
  },
};

