// Buying from 6ixty, the vending machine and the shop room's daily pieces. The server decides what is on sale and for how much.
import { Action, text } from "./util";
import { fail } from "../ctx";
import { addToInv, takeQtyFrom } from "../../../src/shared/economy";
import { DISABLED_ITEMS, ITEM_IDS, SIXTY_STOCK, VENDING_STOCK } from "../../../src/shared/items";
import { furniPicksToday, furniPrice, SHIPPED_DIMS, SHOP_KIND_PREFIX } from "../../../src/shared/furniture";
import { todayStartAt } from "../../../src/shared/economy";

/** 6ixty's shelf: his stock plus whatever else the admin switched on (never the leftovers: butts and dead cats). */
export const buySixty: Action = {
  async run(c, a) {
    const id = text(a.item, /^[a-z0-9_]{1,30}$/, "item");
    const known = SIXTY_STOCK.includes(id) || (ITEM_IDS.has(id) && !DISABLED_ITEMS.has(id) && id !== "cigbutt" && id !== "deadcat");
    if (!known) fail("He doesn't sell that.");
    const entry = await c.itemEntry(id);
    if (!entry.on) fail("He doesn't sell that.");
    const w = await c.user();
    if (w.s.blood < entry.price) fail(`You need ${entry.price - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: id, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= entry.price;
    return { price: entry.price };
  },
};

/** The shop room's vending machine. */
export const buyVending: Action = {
  async run(c, a) {
    const stock = VENDING_STOCK.find((s) => s.id === a.id);
    if (!stock) return fail("The machine doesn't have that.");
    const price = stock.fixedPrice ?? (await c.itemEntry(stock.id)).price;
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: stock.item, qty: stock.qty });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= price;
    return { price };
  },
};

/** One of today's four pieces in the shop room. */
export const buyFurni: Action = {
  async run(c, a) {
    const kind = text(a.kind, /^[fx]_[a-z0-9_]{1,30}$/, "piece");
    const meta = await c.furniMeta();
    const cfg = await c.furniCfg();
    const pool = [...Object.keys(SHIPPED_DIMS).filter((k) => k.startsWith(SHOP_KIND_PREFIX) && k !== "f_planter"), ...Object.entries(meta).filter(([, m]) => m.players).map(([id]) => id)];
    const picks = furniPicksToday(todayStartAt(c.now), cfg, pool, (id) => !!SHIPPED_DIMS[id] || !!meta[id]);
    if (!picks.includes(kind)) fail("That isn't in the shop today.");
    const price = furniPrice(kind, cfg.prices);
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: kind, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= price;
    return { price };
  },
};

/** What 6ixty pays for weed, per piece. */
export const WEED_PRICE = 6;
export const ASS_WEED_PRICE = 3;

/** Selling weed to 6ixty: 6 drops for good weed, 3 for ass weed. */
export const sellWeed: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = Number(a.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot > 27) return fail("Bad slot.");
    const it = w.s.inventory[slot];
    if (!it || it.item !== "weed" || it.lit || it.inPlayer) return fail("He only buys weed.");
    const qty = Math.max(1, Math.min(Math.floor(Number(a.qty) || 1), it.qty));
    const gain = qty * (it.ass ? ASS_WEED_PRICE : WEED_PRICE);
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, qty);
    w.s.blood += gain;
    return { gain, qty };
  },
};
