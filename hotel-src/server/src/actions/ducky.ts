// The Ducky machine in the shop: things that cost real money (see src/shared/ducky.ts). TEST MODE: while the machine runs on the local server (the Firebase emulators)
// a buy goes straight through without paying; in production it says the machine isn't open yet, until paying through Stripe is wired in.
//   starter  3 growing kits, 3 mixers and 50 blood (once)
//   color    your name in a colour of your own (once; after that you can change the colour as often as you like)
//   fx       the chat tool: shaky, wavy, rainbow text and colours (once)
//   ad       your room is shown first in the door list for a while (buying again adds the time)
//   rename   a new username: the sign-in address, the profile and the room names follow
import { Action, requireInRoom } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv } from "../../../src/shared/economy";
import { INV_SIZE } from "../../../src/shared/items";
import { DUCKY_AD_MS, DUCKY_STARTER, duckyDef, isHexColor, NEW_NAME_RE, readableOnDark, RESERVED_NAMES } from "../../../src/shared/ducky";
import { isEmulator } from "../env";
import { setSignInEmail } from "../authAdmin";

const toEmail = (name: string): string => `${name.toLowerCase()}@users.bobba.invalid`;

export const duckyBuy: Action = {
  /** a rename claims a name: nobody else may take it while this runs */
  locks: (c, a) => (typeof a?.name === "string" ? [`name:${a.name.toLowerCase()}`] : []),
  async run(c, a) {
    if (!isEmulator(c.env)) fail("The Ducky machine isn't open yet.");
    await requireInRoom(c, "shop");
    const def = duckyDef(a.product);
    if (!def) fail("The machine doesn't sell that.");
    const w = await c.user();
    const s = w.s;
    const have = def!.once ? !!s.owned[def!.once] : false;
    c.note = `ducky ${def!.id} (${def!.ore / 100} kr, test)`;

    if (def!.id === "starter") {
      if (have) fail("You already bought the starter package. It can only be bought once.");
      let inv = s.inventory;
      for (const g of DUCKY_STARTER.items) for (let i = 0; i < g.qty; i++) {
        const next = addToInv(inv, { item: g.item, qty: 1 });
        if (!next) return fail(`Your pockets are full: make room for ${DUCKY_STARTER.items.reduce((n, x) => n + x.qty, 0)} things (you have ${INV_SIZE} slots).`);
        inv = next;
      }
      s.inventory = inv;
      s.blood += DUCKY_STARTER.blood;
      s.owned.ducky_starter = true;
      return { ok: true };
    }

    if (def!.id === "color") {
      if (!isHexColor(a.color)) fail("Pick a colour.");
      if (!readableOnDark(a.color as string)) fail("That colour is too dark to read. Pick a lighter one.");
      const color = (a.color as string).toLowerCase();
      if (!have) s.owned.ducky_color = true; // (the first time is the buy; after that the colour can be changed for free)
      c.extra[`users/${c.uid}/nameColor`] = color;
      c.extra[`profiles/${c.uid}/nc`] = color;
      return { ok: true, color, free: have };
    }

    if (def!.id === "fx") {
      if (have) fail("You already have the chat tool.");
      s.owned.ducky_fx = true;
      return { ok: true };
    }

    if (def!.id === "ad") {
      const room = `u_${c.uid}`;
      const meta = await c.db.get<{ adUntil?: number }>(`roomsMeta/${room}`);
      if (!meta) fail("You haven't got a room to advertise.");
      const until = Math.max(c.now, Number(meta!.adUntil) || 0) + DUCKY_AD_MS;
      c.extra[`roomsMeta/${room}/adUntil`] = until;
      return { ok: true, until };
    }

    // rename
    const name = typeof a.name === "string" ? a.name.trim() : "";
    if (!NEW_NAME_RE.test(name)) fail("A name is 3-16 characters: letters, numbers, . _ -");
    if (RESERVED_NAMES.has(name.toLowerCase())) fail("That name is reserved.");
    if (c.isAdmin) fail("This account keeps its name.");
    const old = String(w.raw.name ?? "");
    if (!old) fail("That player doesn't exist.");
    if (name === old) fail("That is already your name.");
    const sameAddress = name.toLowerCase() === old.toLowerCase(); // (only the capital letters change: the address stays)
    if (!sameAddress) {
      if ((await c.db.get(`usernames/${name.toLowerCase()}`)) !== null) fail("That name is taken.");
      if (!(await setSignInEmail(c.env, c.uid, toEmail(name)))) fail("That name is taken.");
      c.extra[`usernames/${old.toLowerCase()}`] = null;
      c.extra[`usernames/${name.toLowerCase()}`] = c.uid;
    }
    c.extra[`users/${c.uid}/name`] = name;
    c.extra[`profiles/${c.uid}/name`] = name;
    const room = `u_${c.uid}`;
    const meta = await c.db.get<{ name?: string }>(`roomsMeta/${room}`);
    if (meta) {
      c.extra[`roomsMeta/${room}/ownerName`] = name;
      if (typeof meta.name === "string" && meta.name === `${old}'s room`.slice(0, 28)) c.extra[`roomsMeta/${room}/name`] = `${name}'s room`.slice(0, 28);
    }
    if ((await c.db.get(`flappyBoard/${c.uid}`)) !== null) c.extra[`flappyBoard/${c.uid}/name`] = name;
    return { ok: true, name };
  },
};
