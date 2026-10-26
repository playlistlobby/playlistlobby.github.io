// Mystery boxes (see src/shared/cases.ts): one box and one key go in, one prize comes out. The roll is the server's; the browser only plays the opening.
// Unusuals: tap one in your pocket to wear it (users/<uid>/unusual: everybody sees the hat and its particles), and put it back from the wardrobe in your room.
import { Action } from "./util";
import { fail } from "../ctx";
import { addToInv, takeOneFrom } from "../../../src/shared/economy";
import { findSlot } from "../../../src/shared/items";
import { CASE_FURNI, CASE_ITEM, CASE_RARE_FURNI, CASE_TABLE, KEY_ITEM, UNUSUAL_IDS, unusualOf } from "../../../src/shared/cases";
import { int } from "./util";

/** a fair whole number from 0 to n-1 */
function fairInt(n: number): number {
  if (n <= 1) return 0;
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}
const pick = <T,>(list: T[]): T => list[fairInt(list.length)];

/** Opens a box with a key. The prize goes into the pocket; if there's no room for it nothing is used up. */
export const caseOpen: Action = {
  async run(c) {
    const w = await c.user();
    const s = w.s;
    const boxAt = findSlot(s.inventory, CASE_ITEM), keyAt = findSlot(s.inventory, KEY_ITEM);
    if (boxAt < 0) fail("You haven't got a mystery box.");
    if (keyAt < 0) fail("You need a key to open it. 6ixty sells them.");
    // the roll: 100 numbers, each prize gets as many as its percentage
    let r = fairInt(100), row = CASE_TABLE[0];
    for (const p of CASE_TABLE) { if (r < p.chance) { row = p; break; } r -= p.chance; }
    const give =
      row.id === "asweed" ? { item: "weed", qty: 1, ass: true as const }
      : row.id === "furni" ? { item: pick(CASE_FURNI), qty: 1 }
      : row.id === "caliweed" ? { item: "caliweed", qty: 1 }
      : row.id === "fentcn" ? { item: "fentcn", qty: 1 }
      : row.id === "poppyseed" ? { item: "poppyseed", qty: 1 }
      : row.id === "loudspeaker" ? { item: "loudspeaker", qty: 1 }
      : row.id === "unusual" ? { item: pick(UNUSUAL_IDS), qty: 1 }
      : { item: pick(CASE_RARE_FURNI), qty: 1 };
    if (!(await c.validItem())(give.item)) fail("That prize doesn't exist any more. Try again.");
    let inv = takeOneFrom(s.inventory, boxAt);
    inv = takeOneFrom(inv, keyAt);
    const next = addToInv(inv, give);
    if (!next) fail("Your pockets are full: make room for the prize first.");
    s.inventory = next!;
    c.note = `${row.id} ${give.item}`;
    return { prize: { id: row.id, tier: row.tier, item: give.item, qty: give.qty, ...("ass" in give ? { ass: true } : {}) } };
  },
};

/** Wears an unusual from the pocket (one at a time: the one you had on goes back into the pocket). */
export const unusualWear: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it || !unusualOf(it.item)) fail("That isn't an unusual.");
    const old = typeof w.raw.unusual === "string" ? w.raw.unusual : null;
    let inv = takeOneFrom(w.s.inventory, slot);
    if (old && unusualOf(old)) { const back = addToInv(inv, { item: old, qty: 1 }); if (!back) fail("Your pockets are full."); inv = back!; }
    w.s.inventory = inv;
    c.extra[`users/${c.uid}/unusual`] = it!.item;
    return { worn: it!.item };
  },
};

/** Takes the unusual off, into the pocket (the wardrobe in your own room is where the browser offers it). */
export const unusualRemove: Action = {
  async run(c) {
    const w = await c.user();
    const old = typeof w.raw.unusual === "string" ? w.raw.unusual : null;
    if (!old || !unusualOf(old)) fail("You aren't wearing one.");
    const next = addToInv(w.s.inventory, { item: old!, qty: 1 });
    if (!next) fail("Your pockets are full.");
    w.s.inventory = next!;
    c.extra[`users/${c.uid}/unusual`] = null;
    return {};
  },
};
