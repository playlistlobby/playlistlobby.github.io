// Hands over the CDs a player has paid for (the webhook marked them "paid"). Through the normal pocket rules: a full pocket just waits.
import { Action } from "./util";
import { GameError } from "../ctx";
import { duckyOfPayId } from "../../../src/shared/ducky";
import { grantDucky } from "./ducky";
import { addToInv } from "../../../src/shared/economy";
import { ALBUM_CD, cdOwnedKey, MYSTERY_CDS } from "../../../src/shared/cds";

interface UserPurchase { product?: string; status?: string }


export const claimPurchases: Action = {
  locks: () => ["names"], // (a rename takes a name: one at a time)
  async run(c) {
    const mine = (await c.db.get<Record<string, UserPurchase>>(`userPurchases/${c.uid}`)) ?? {};
    const paid = Object.entries(mine).filter(([, p]) => p?.status === "paid").sort(([a], [b]) => a.localeCompare(b));
    if (!paid.length) return { items: [] };
    const w = await c.user();
    const items: string[] = [];
    const ducky: Array<Record<string, unknown>> = [];
    let full = false, tshirt = false;
    for (const [id, p] of paid) {
      if (p.product === "tshirt") { // a t-shirt pre-order: nothing to hand over, it is just confirmed (the admin posts it from the order list)
        c.extra[`purchases/${id}/status`] = "ordered";
        c.extra[`userPurchases/${c.uid}/${id}/status`] = "ordered";
        c.extra[`tshirtOrders/${id}/status`] = "ordered";
        tshirt = true;
        continue;
      }
      const dk = duckyOfPayId(p.product);
      if (dk) { // something from the pay2win machine: given with what was chosen before paying (the colour, the new name)
        const params = (await c.db.get<{ color?: string; name?: string }>(`purchases/${id}/params`)) ?? {};
        try {
          const res = await grantDucky(c, dk.id, params);
          c.extra[`purchases/${id}/status`] = "claimed";
          c.extra[`userPurchases/${c.uid}/${id}/status`] = "claimed";
          ducky.push({ product: dk.id, ...res });
        } catch (e) {
          if (!(e instanceof GameError)) throw e; // (the server had a problem: it stays "paid" and is tried again)
          if (/pockets are full/.test(e.message)) { full = true; break; } // (it waits for room)
          c.extra[`purchases/${id}/status`] = "stuck"; // (it can't be given: kept, so the money can be given back by hand)
          c.extra[`userPurchases/${c.uid}/${id}/status`] = "stuck";
          ducky.push({ product: dk.id, stuck: e.message });
        }
        continue;
      }
      let item: string | null = null;
      if (p.product === "album") {
        item = w.s.owned[cdOwnedKey(ALBUM_CD)] ? null : ALBUM_CD;
      } else {
        // a mystery CD is one of the three colours you don't have yet (never the same twice)
        const left = MYSTERY_CDS.filter((i) => !w.s.owned[cdOwnedKey(i)]);
        item = left.length ? left[Math.floor(Math.random() * left.length)] : null;
      }
      if (!item) {
        // nothing left to give for this payment: it is kept as "stuck" so the money can be given back by hand
        c.extra[`purchases/${id}/status`] = "stuck";
        c.extra[`userPurchases/${c.uid}/${id}/status`] = "stuck";
        continue;
      }
      const next = addToInv(w.s.inventory, { item, qty: 1 });
      if (!next) { full = true; break; } // the pocket is full: it waits (the payment stays "paid")
      w.s.inventory = next;
      w.s.owned[cdOwnedKey(item)] = true;
      c.extra[`purchases/${id}/status`] = "claimed";
      c.extra[`purchases/${id}/item`] = item;
      c.extra[`userPurchases/${c.uid}/${id}/status`] = "claimed";
      items.push(item);
    }
    return { items, full, ducky, tshirt };
  },
};
