// The pay2win machine in the shop: things that cost real money (see src/shared/ducky.ts). They are paid for on the payment page (Stripe: src/pay.ts), and once the money has
// arrived `claimPurchases` (src/actions/pay.ts) hands them over with grantDucky below.
//   starter  3 growing kits, 3 mixers and 50 blood (once)
//   color    your name in a colour of your own (once; after that you can change the colour as often as you like, for free: duckyBuy)
//   fx       the chat tool: shaky, wavy, rainbow text and colours (once)
//   rename   a new username: the sign-in address, the profile and the room names follow
import { Action, requireInRoom } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv } from "../../../src/shared/economy";
import { INV_SIZE } from "../../../src/shared/items";
import { KEYS_PACK } from "../../../src/shared/cases";
import { DUCKY_STARTER, DuckyProduct, isHexColor, NEW_NAME_RE, readableOnDark, RESERVED_NAMES } from "../../../src/shared/ducky";
import { setSignInEmail } from "../authAdmin";

const toEmail = (name: string): string => `${name.toLowerCase()}@users.bobba.invalid`;

/** Gives a player what they bought (the money has arrived, or it is a free change of the colour). Throws a normal game error when it can't be done. */
export async function grantDucky(c: Ctx, product: DuckyProduct, a: { color?: unknown; name?: unknown }): Promise<Record<string, unknown>> {
  const w = await c.user();
  const s = w.s;
  c.note = `pay2win ${product}`;

  if (product === "starter") {
    if (s.owned.ducky_starter) fail("You already bought the starter package. It can only be bought once.");
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

  if (product === "keys") { // 2 keys for the mystery boxes (as often as you like)
    const next = addToInv(s.inventory, { item: "casekey", qty: KEYS_PACK.qty });
    if (!next) fail("Your pockets are full: make room for the keys.");
    s.inventory = next!;
    return { ok: true, qty: KEYS_PACK.qty };
  }

  if (product === "color") {
    if (!isHexColor(a.color)) fail("Pick a colour.");
    if (!readableOnDark(a.color as string)) fail("That colour is too dark to read. Pick a lighter one.");
    const color = (a.color as string).toLowerCase();
    const have = !!s.owned.ducky_color;
    s.owned.ducky_color = true; // (the first time is the buy; after that the colour can be changed for free)
    c.extra[`users/${c.uid}/nameColor`] = color;
    c.extra[`profiles/${c.uid}/nc`] = color;
    return { ok: true, color, free: have };
  }

  if (product === "fx") {
    if (s.owned.ducky_fx) fail("You already have the chat tool.");
    s.owned.ducky_fx = true;
    return { ok: true };
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
    const holder = await c.db.get<string>(`usernames/${name.toLowerCase()}`);
    if (holder !== null && holder !== c.uid) fail("That name is taken.");
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
}

/** What the machine does without the payment page: change the colour of your name once you have bought it. (Everything else is paid on the payment page.) */
export const duckyBuy: Action = {
  async run(c, a) {
    await requireInRoom(c, "shop");
    if (a.product !== "color") fail("That one is paid on the payment page.");
    const w = await c.user();
    if (!w.s.owned.ducky_color) fail("Buy the name colour first.");
    return grantDucky(c, "color", a);
  },
};
