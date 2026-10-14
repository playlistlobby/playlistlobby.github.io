// Test commands (/giveblud, /weed). Only the admin account may use them (and anyone in the local emulator).
import { Action, int } from "./util";
import { fail } from "../ctx";
import { isEmulator } from "../env";
import { addToInv } from "../../../src/shared/economy";

export const debug: Action = {
  async run(c, a) {
    if (!c.isAdmin && !isEmulator(c.env)) fail("Unknown command.");
    const w = await c.user();
    if (a.cmd === "blood") {
      const n = int(a.n, 1, 1000, "amount");
      w.s.blood += n;
      return { note: `(test) You got ${n} drops of blood.` };
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
    return fail("Unknown command.");
  },
};
