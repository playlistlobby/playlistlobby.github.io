// Test commands (/giveblud, /weed, /give, /skip): for the admin account only (and anyone in the local emulator); the account "emil" also gets /giveblud and /skip.
// An account with users/<uid>/commands = true (set by hand, like the decorator power) gets all of them too.
import { Action, int, text } from "./util";
import { fail } from "../ctx";
import { skipTime } from "../skipTime";
import { isEmulator } from "../env";
import { addToInv } from "../../../src/shared/economy";
import { STACKABLE } from "../../../src/shared/items";

const TESTER_EMAIL = "emil@users.bobba.invalid";

export const debug: Action = {
  async run(c, a) {
    // the account "emil" may use /giveblud and /skip too (not the item commands)
    const tester = c.caller.email.toLowerCase() === TESTER_EMAIL && (a.cmd === "blood" || a.cmd === "skip");
    const w = await c.user();
    const trusted = c.isAdmin || isEmulator(c.env) || tester || w.raw.commands === true;
    if (!trusted) fail("Unknown command.");
    c.note = typeof a.cmd === "string" ? a.cmd : ""; // (the blood ledger says which admin command it was)
    if (a.cmd === "blood") {
      const n = int(a.n, 1, isEmulator(c.env) ? 100000 : 1000, "amount"); // (the local test may give as much as it likes: poker and blackjack buy-ins are big)
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

/**
 * /tp <name>            you go to where that player is
 * /tp <name> me         that player comes to where you are
 * /tp <name> <name2>    the first player goes to where the second is
 * For the admin and the account "emil". The player's browser walks them there (teleports/<uid>, see watchTeleport). The street and its elevator room are left out: they need a ticket.
 */
export const staffTp: Action = {
  async run(c, a) {
    if (!c.isAdmin && c.caller.email.toLowerCase() !== TESTER_EMAIL) fail("Unknown command.");
    const find = async (raw: unknown): Promise<{ uid: string; name: string; room: string }> => {
      const who = text(typeof raw === "string" ? raw.trim().toLowerCase() : "", /^[a-z0-9_ .-]{1,20}$/, "name");
      const uid = await c.db.get<string>(`usernames/${who}`);
      if (!uid) fail("There is no player with that name.");
      const room = await c.db.get<string>(`presence/${uid}/room`);
      if (!room) fail(`${who} isn't in the game right now.`);
      const name = String((await c.db.get<string>(`profiles/${uid}/name`)) ?? who).slice(0, 16);
      return { uid: uid!, name, room: room! };
    };
    const first = await find(a.who);
    const second = a.to === undefined || a.to === "" ? null : String(a.to).trim().toLowerCase() === "me" ? "me" : await find(a.to);
    let mover = c.uid, dest: string, label: string;
    if (second === null) { dest = first.room; label = first.name; } // you go to them
    else if (second === "me") { // they come to you
      mover = first.uid;
      dest = (await c.db.get<string>(`presence/${c.uid}/room`)) ?? fail("You aren't in a room.");
      label = first.name;
    } else { mover = first.uid; dest = second.room; label = first.name; }
    if (!/^[a-z0-9_]{1,50}$/.test(dest) || dest === "arrival" || dest === "streets") fail("That room can't be gone to like that: the street needs the elevator.");
    if (mover !== c.uid) c.extra[`teleports/${mover}`] = { room: dest, at: c.now, by: c.uid };
    c.note = `tp ${first.name}${second ? " " + (second === "me" ? "to me" : "to " + second.name) : ""}`;
    return { self: mover === c.uid, room: dest, name: label, moved: mover === c.uid ? c.uid : first.name };
  },
};
