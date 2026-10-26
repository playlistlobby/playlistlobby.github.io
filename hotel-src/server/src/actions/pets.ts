// The pet merchant in the shop room: buy a pet (1000-2000 blood, its colour is a surprise) and choose which one walks with you.
//   users/<uid>/pets/<id>   { type, palette, at }     the pets a player owns (written only here)
//   users/<uid>/activePet   the id of the one that walks with them
//   users/<uid>/petLook     "<type>:<palette>" of that one: the room's presence field `pet` has to match it (see the rules)
import { Action, ID_RE, requireInRoom, text } from "./util";
import { fail } from "../ctx";
import { PET_COLORS, PET_TYPES, petPrice } from "../../../src/shared/pets";

export const PETS_MAX = 12;

export const petBuy: Action = {
  async run(c, a) {
    await requireInRoom(c, "shop");
    const type = text(a.type, /^[a-z]{3,20}$/, "pet");
    if (!PET_TYPES.includes(type)) fail("The merchant doesn't have that one.");
    const w = await c.user();
    const owned = Object.keys((await c.db.get<Record<string, unknown>>(`users/${c.uid}/pets`)) ?? {});
    if (owned.length >= PETS_MAX) fail(`You can't look after more than ${PETS_MAX} pets.`);
    const price = petPrice(type);
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    w.s.blood -= price;
    const colors = PET_COLORS[type] ?? 0;
    const palette = colors > 0 ? Math.floor(Math.random() * colors) : 0;
    const id = `p${c.now.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    c.extra[`users/${c.uid}/pets/${id}`] = { type, palette, at: c.now };
    if (!w.raw.activePet) { c.extra[`users/${c.uid}/activePet`] = id; c.extra[`users/${c.uid}/petLook`] = `${type}:${palette}`; }
    c.note = type;
    return { id, type, palette, price };
  },
};

/** Which pet walks with you (or none). */
export const petActive: Action = {
  async run(c, a) {
    if (a.id === null || a.id === undefined) {
      c.extra[`users/${c.uid}/activePet`] = null;
      c.extra[`users/${c.uid}/petLook`] = null;
      return {};
    }
    const id = text(a.id, ID_RE, "pet");
    const pet = await c.db.get<{ type?: string; palette?: number }>(`users/${c.uid}/pets/${id}`);
    if (!pet?.type) fail("That isn't your pet.");
    c.extra[`users/${c.uid}/activePet`] = id;
    c.extra[`users/${c.uid}/petLook`] = `${pet!.type}:${Number(pet!.palette) || 0}`;
    return {};
  },
};
