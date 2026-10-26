// Pets are items. The pet merchant in the shop room sells them (1000-2000 blood, the colour is a surprise): a bought pet goes into the pocket. Tap it there and it
// walks with you (users/<uid>/petLook, "<type>:<colour>[:<effect>]": the room's presence field `pet` has to match it, see the rules); tap it in the room and it
// goes back into the pocket. An unusual pet (from a mystery box) is the same with a particle effect of its own.
import { Action, int, requireInRoom, text } from "./util";
import { fail } from "../ctx";
import { addToInv, takeOneFrom } from "../../../src/shared/economy";
import { PET_COLORS, PET_TYPES, petPrice } from "../../../src/shared/pets";
import { parsePetItem, parsePetLook, petItemId, petLookOf, petStock, petStockEnds } from "../../../src/shared/petItems";

/** the four pets he has right now, and when they change */
export const petStockNow: Action = {
  async run(c) { return { types: petStock(c.now), until: petStockEnds(c.now) }; },
};

export const petBuy: Action = {
  async run(c, a) {
    await requireInRoom(c, "shop");
    const type = text(a.type, /^[a-z]{3,20}$/, "pet");
    if (!PET_TYPES.includes(type)) fail("The merchant doesn't have that one.");
    if (!petStock(c.now).includes(type)) fail("He hasn't got that one right now: he swaps his pets every 6 hours.");
    const w = await c.user();
    const price = petPrice(type);
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    const colors = PET_COLORS[type] ?? 0;
    const palette = colors > 0 ? Math.floor(Math.random() * colors) : 0;
    const give = addToInv(w.s.inventory, { item: petItemId({ type, palette }), qty: 1 });
    if (!give) fail("Your pockets are full: make room for the pet first.");
    w.s.inventory = give!;
    w.s.blood -= price;
    c.note = type;
    return { type, palette, price };
  },
};

/** Lets the pet in a pocket slot out: it walks with you from now on (the one that did goes back into the pocket). */
export const petRelease: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    const pet = it ? parsePetItem(it.item) : null;
    if (!it || !pet) fail("That isn't a pet.");
    let inv = takeOneFrom(w.s.inventory, slot);
    const old = parsePetLook(w.raw.petLook);
    if (old) { const back = addToInv(inv, { item: petItemId(old), qty: 1 }); if (!back) fail("Your pockets are full: make room for the pet that is out."); inv = back!; }
    w.s.inventory = inv;
    c.extra[`users/${c.uid}/petLook`] = petLookOf(pet!);
    return { look: petLookOf(pet!) };
  },
};

/** Picks the pet that walks with you up: it goes into the pocket. */
export const petPickup: Action = {
  async run(c) {
    const w = await c.user();
    const old = parsePetLook(w.raw.petLook);
    if (!old) fail("You haven't got a pet out.");
    const back = addToInv(w.s.inventory, { item: petItemId(old!), qty: 1 });
    if (!back) fail("Your pockets are full.");
    w.s.inventory = back!;
    c.extra[`users/${c.uid}/petLook`] = null;
    return {};
  },
};
