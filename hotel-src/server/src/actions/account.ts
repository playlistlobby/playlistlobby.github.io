// Logging in (the upgrades older accounts get), the player's look, and buying clothes.
import { Action, text } from "./util";
import { Ctx, fail } from "../ctx";
import { STARTER_FURNITURE, STARTER_ITEMS, START_BLOOD } from "../../../src/shared/economy";
import { addToInv, mergeStacks } from "../../../src/shared/economy";
import { DISABLED_ITEMS, ITEM_IDS, SMOKABLE, smokeMsOf } from "../../../src/shared/items";

const CLOTHING_SLOTS = new Set(["hd", "hr", "ha", "he", "ea", "fa", "ch", "cc", "cp", "ca", "lg", "sh", "wa"]);

/**
 * Accounts that log in from the same device are peers: peers/<a>/<b> and peers/<b>/<a> are set (only the server writes them).
 * Peers can't stab each other (so nobody can run a pile of accounts and stab them one after another for blood); they can still visit each other like anybody else.
 */
async function notePeers(c: Ctx): Promise<void> {
  for (const key of c.net) {
    const known = (await c.db.get<Record<string, true>>(`netUsers/${key}`)) ?? {};
    for (const other of Object.keys(known)) {
      if (other === c.uid) continue;
      c.extra[`peers/${c.uid}/${other}`] = true;
      c.extra[`peers/${other}/${c.uid}`] = true;
    }
    if (!known[c.uid]) c.extra[`netUsers/${key}/${c.uid}`] = true;
  }
}

/** Login: everything an account made before something existed gets now. Safe to call as often as you like. */
export const sync: Action = {
  async run(c) {
    const w = await c.user();
    const s = w.s, raw = w.raw;
    // everybody gets the starter furniture once (new players, and players from before it existed); what they do with it afterwards is theirs
    if (!raw.starterFurni) {
      for (const k of STARTER_FURNITURE) s.storage[k] = (s.storage[k] ?? 0) + 1;
      c.extra[`users/${c.uid}/starterFurni`] = true;
      // items the admin ticked "starter" (Admin > Shop > 6ixty stock) start in every new player's pocket
      const starters = [...STARTER_ITEMS];
      const cfg = (await c.shop()).items ?? {};
      for (const [id, e] of Object.entries(cfg)) if (e?.starter && ITEM_IDS.has(id) && !DISABLED_ITEMS.has(id) && !starters.includes(id)) starters.push(id);
      for (const item of starters) { const next = addToInv(s.inventory, { item, qty: 1 }); if (next) s.inventory = next; }
    }
    // a cigarette lit long ago (the page was closed meanwhile) is a butt by now
    s.inventory = s.inventory.map((it) => (it && SMOKABLE[it.item] && it.lit && c.now - it.lit > smokeMsOf(it.item) + 5000 ? { item: "cigbutt", qty: 1 } : it));
    s.inventory = mergeStacks(s.inventory); // things that stack now (butts) but were lying about one to a slot
    if (raw.blood === undefined) s.blood = START_BLOOD;
    if (raw.createdAt === undefined) c.extra[`users/${c.uid}/createdAt`] = c.now;
    await notePeers(c);
    return {};
  },
};

/** Saves the look. Anything that costs drops must already be owned (the admin can wear anything). */
export const setLook: Action = {
  async run(c, a) {
    const figure = text(a.figure, /^[a-z]{2}-[0-9]{1,7}(-[0-9]{1,5})*(\.[a-z]{2}-[0-9]{1,7}(-[0-9]{1,5})*)*$/, "look");
    if (figure.length > 190) fail("Bad look.");
    const gender = a.gender === "F" ? "F" : "M";
    const w = await c.user();
    const book = await c.priceBook();
    for (const chunk of figure.split(".")) {
      const [type, id] = chunk.split("-");
      if (!CLOTHING_SLOTS.has(type)) fail("That isn't clothing.");
      const key = `${type}_${id}`;
      const entry = book[key];
      if (!c.isAdmin && entry && entry.p > 0 && !w.s.owned[key]) fail("You don't own all of that yet.");
    }
    c.extra[`users/${c.uid}/figure`] = figure;
    c.extra[`users/${c.uid}/gender`] = gender;
    // the public copy other players see (the admin account is 6ixty: his public look isn't the one being saved here)
    if (!c.isAdmin) c.extra[`profiles/${c.uid}`] = { name: String(w.raw.name ?? ""), figure };
    return {};
  },
};

/** Buys clothes: each one must be for sale at the price the admin's game published; the server charges the sum. */
export const buyClothes: Action = {
  async run(c, a) {
    const keys: string[] = Array.isArray(a.keys) ? [...new Set<string>(a.keys.map(String))] : [];
    if (!keys.length || keys.length > 30) fail("Nothing to buy.");
    const w = await c.user();
    const book = await c.priceBook();
    let cost = 0;
    for (const key of keys) {
      if (!/^[a-z]{2}_[0-9]{1,7}$/.test(key)) fail("Bad item.");
      const e = book[key];
      if (!e || !e.on || !(e.p > 0)) fail("That isn't for sale.");
      if (w.s.owned[key]) continue;
      cost += e.p;
    }
    if (cost > w.s.blood) fail("Not enough drops of blood");
    w.s.blood -= cost;
    for (const key of keys) w.s.owned[key] = true;
    return {};
  },
};

export type { Ctx };
