// The mines: mining iron from the rocks, and crafting tools on the bench (src/shared/mines.ts has the numbers and where everything stands).
//   mine   one swing of the knife (or the pickaxe) at a rock: an iron if enough time has passed since the last one
//   craft  a pickaxe or a machete from iron and wood
import { Action, cheb, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { isEmulator } from "../env";
import { addToInv, takeQtyFrom } from "../../../src/shared/economy";
import { findSlot } from "../../../src/shared/items";
import { CRAFT_REACH, craftRecipe, MINE_KNIFE_MS, MINE_PICK_MS, MINE_REACH, MINE_ROCKS, MINE_SLACK, MINES_BENCH, MINES_ID, MINES_OPEN } from "../../../src/shared/mines";

const total = (inv: Array<{ item: string; qty: number } | null>, item: string): number => inv.reduce((n, s) => n + (s && s.item === item ? s.qty : 0), 0);

/** takes `qty` of an item from wherever it lies in the pocket */
function take(inv: Array<{ item: string; qty: number; lit?: number; inPlayer?: boolean | string } | null>, item: string, qty: number): typeof inv {
  let left = qty, out = inv;
  for (let i = 0; i < out.length && left > 0; i++) {
    const s = out[i];
    if (!s || s.item !== item) continue;
    const n = Math.min(left, s.qty);
    out = takeQtyFrom(out as never, i, n) as typeof inv;
    left -= n;
  }
  return out;
}

/** the mines are not open yet (see MINES_OPEN): only the local test server has them */
function minesOpen(c: Ctx): void {
  if (!MINES_OPEN && !isEmulator(c.env)) fail("Unknown action.");
}

export const mine: Action = {
  async run(c, a) {
    minesOpen(c);
    const stand = await requireInRoom(c, MINES_ID);
    const id = text(a.rock, /^[a-z0-9]{3,20}$/, "rock");
    const rock = MINE_ROCKS.find((r) => r.id === id);
    if (!rock) fail("That isn't a rock you can mine.");
    if (!stand || cheb(stand, rock!) > MINE_REACH) fail("You're too far from the rock.");
    const w = await c.user();
    const s = w.s;
    const pick = findSlot(s.inventory, "pickaxe") >= 0;
    if (!pick && findSlot(s.inventory, "knife") < 0) fail("You need a knife (or a pickaxe) to mine.");
    const ms = pick ? MINE_PICK_MS : MINE_KNIFE_MS;
    const last = (await c.db.get<number>(`minesCool/${c.uid}`)) ?? 0;
    if (c.now - last < ms * MINE_SLACK) return { iron: 0, wait: Math.ceil(ms * MINE_SLACK - (c.now - last)), pick }; // (too early: nothing yet; the browser tries again in a moment)
    const next = addToInv(s.inventory, { item: "iron", qty: 1 });
    if (!next) fail("Your inventory is full");
    s.inventory = next!;
    c.extra[`minesCool/${c.uid}`] = c.now;
    return { iron: 1, pick };
  },
};

export const craft: Action = {
  async run(c, a) {
    minesOpen(c);
    const stand = await requireInRoom(c, MINES_ID);
    const r = craftRecipe(a.recipe);
    if (!r) fail("The bench can't make that.");
    if (!stand || cheb(stand, MINES_BENCH) > CRAFT_REACH) fail("Walk up to the crafting bench first.");
    const w = await c.user();
    const s = w.s;
    if (findSlot(s.inventory, r!.give) >= 0) fail(`You already have a ${r!.give}.`);
    const iron = total(s.inventory, "iron"), wood = total(s.inventory, "wood");
    if (iron < r!.iron || wood < r!.wood) fail(`You need ${r!.iron} iron and ${r!.wood} wood (you have ${iron} and ${wood}).`);
    let inv = take(s.inventory, "iron", r!.iron);
    inv = take(inv, "wood", r!.wood);
    const next = addToInv(inv as never, { item: r!.give, qty: 1 });
    if (!next) fail("Your inventory is full");
    s.inventory = next!;
    return { made: r!.give };
  },
};
