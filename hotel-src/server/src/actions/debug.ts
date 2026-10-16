// Test commands (/giveblud, /weed, /give, /skip): for the admin account only (and anyone in the local emulator).
import { Action, int, text } from "./util";
import { fail } from "../ctx";
import { skipTime } from "../skipTime";
import { isEmulator } from "../env";
import { addToInv } from "../../../src/shared/economy";
import { STACKABLE } from "../../../src/shared/items";

export const debug: Action = {
  async run(c, a) {
    const trusted = c.isAdmin || isEmulator(c.env);
    if (!trusted) fail("Unknown command.");
    const w = await c.user();
    if (a.cmd === "blood") {
      const n = int(a.n, 1, 1000, "amount");
      w.s.blood += n;
      return { note: `(test) You got ${n} drops of blood.` };
    }
    if (a.cmd === "skip") {
      // /skip <minutes>: your own timers run that much further: the plants and mixers in your room, and the bins you have searched (7 minutes to go, /skip 5: 2 to go)
      const n = int(a.n, 1, 1440, "minutes");
      await skipTime(c, w.s.dumpsters, n * 60_000);
      return { note: `(test) ${n} minutes went by. The plants, mixers and bins moved on.` };
    }
    if (a.cmd === "weed") {
      let inv = w.s.inventory;
      for (const give of [{ item: "weed", qty: 1 }, { item: "weed", qty: 1, ass: true }, { item: "bluntwrap", qty: 1 }, { item: "jointpaper", qty: 1 }]) {
        const next = addToInv(inv, give);
        if (!next) fail("Your inventory is full.");
        inv = next!;
      }
      w.s.inventory = inv;
      return { note: "(test) You got one weed, one ass weed, a blunt wrap and joint paper." };
    }
    if (a.cmd === "give") {
      // any item the game knows: ordinary items, shop furniture (f_...) and Studio pieces (x_...)
      const item = text(a.item, /^[a-z0-9_]{1,40}$/, "item");
      if (!(await c.validItem())(item)) fail("There's no item called that.");
      const qty = int(a.qty ?? 1, 1, 99, "amount");
      let inv = w.s.inventory;
      let given = 0;
      const ass = a.ass === true && item !== "cigarette";
      const parts = STACKABLE.has(item) ? [qty] : Array.from({ length: qty }, () => 1);
      for (const q of parts) {
        const next = addToInv(inv, { item, qty: q, ...(ass ? { ass: true } : {}) });
        if (!next) break;
        inv = next;
        given += q;
      }
      if (given === 0) fail("Your inventory is full.");
      w.s.inventory = inv;
      return { note: `(test) You got ${given} x ${item}${ass ? " (ass)" : ""}${given < qty ? " (your pockets are full)" : ""}.` };
    }
    return fail("Unknown command.");
  },
};
