// Finishing a trade: when both players have accepted and confirmed, the server checks both offers against what they really carry
// and swaps everything in one atomic write. Nothing is ever "in the middle", so nobody can lose or duplicate anything.
import { Action, ID_RE, text } from "./util";
import { fail } from "../ctx";
import { addToInv, carryMsg, carryMsgFor, overCarry, takeQtyFrom, TRADE_BLOOD_CAP, tradeBloodLeft, TRADE_BLOOD_WINDOW_MS } from "../../../src/shared/economy";
import { isLaced, NO_DROP } from "../../../src/shared/items";
import type { Inventory } from "../../../src/shared/items";

interface Offer { blood: number; items: Array<{ slot: number; item: string; qty: number; ass: boolean }> }

function parseOffer(raw: any): Offer {
  const items: Offer["items"] = [];
  for (const [k, v] of Object.entries<any>(raw?.items ?? {})) {
    const slot = Number(k);
    if (!Number.isInteger(slot) || slot < 0 || slot > 27 || !v || typeof v.item !== "string") continue;
    const qty = Number(v.qty);
    if (!Number.isInteger(qty) || qty < 1) continue;
    items.push({ slot, item: v.item, qty, ass: !!v.ass });
  }
  return { blood: Math.max(0, Math.floor(Number(raw?.blood) || 0)), items };
}

const sidesName = (sides: Array<{ w: { uid: string }; name: string }>, uid: string): string => sides.find((s) => s.w.uid === uid)?.name ?? "They";

export const tradeFinish: Action = {
  async locks(c, a) {
    const id = text(a?.id, ID_RE, "trade");
    const t = await c.db.get<any>(`trades/${id}`);
    if (!t || typeof t.a !== "string" || typeof t.b !== "string") return fail("That trade is gone.");
    return [`user:${t.a}`, `user:${t.b}`];
  },
  async run(c, a) {
    const id = text(a.id, ID_RE, "trade");
    const t = await c.db.get<any>(`trades/${id}`);
    if (!t) return fail("That trade is gone.");
    const A: string = t.a, B: string = t.b;
    if (c.uid !== A && c.uid !== B) fail("That isn't your trade.");
    if (t.status === "done") return { done: true };
    if (t.status !== "open") fail("That trade was called off.");
    const yes = (o: any, u: string) => o?.[u] === true;
    if (!(yes(t.ready, A) && yes(t.ready, B) && yes(t.confirm, A) && yes(t.confirm, B))) fail("Both of you have to accept and confirm first.");
    const wa = await c.user(A), wb = await c.user(B);
    const sides: Array<{ w: typeof wa; offer: Offer; other: typeof wb; name: string }> = [
      { w: wa, offer: parseOffer(t.offer?.[A]), other: wb, name: String(t.names?.[A] ?? "They") },
      { w: wb, offer: parseOffer(t.offer?.[B]), other: wa, name: String(t.names?.[B] ?? "They") },
    ];
    // what each side hands over must really be in their pocket right now
    const received = new Map<string, Array<{ item: string; qty: number; ass: boolean; giver: string }>>([[A, []], [B, []]]);
    for (const { w, offer, other } of sides) {
      if (offer.blood > w.s.blood) fail("Somebody doesn't have that much blood any more.");
      if (offer.blood > 0) {
        // at most 1000 blood handed over in trades per player per 24 hours
        const left = tradeBloodLeft(w.s, c.now);
        if (offer.blood > left) fail(`${w.uid === c.uid ? "You" : sidesName(sides, w.uid)} can only trade ${left} more blood for now (the limit is ${TRADE_BLOOD_CAP} per 24 hours).`);
        const fresh = c.now - w.s.tradeCap.at >= TRADE_BLOOD_WINDOW_MS;
        if (!w.s.noTradeLimit) w.s.tradeCap = { at: fresh ? c.now : w.s.tradeCap.at, n: (fresh ? 0 : w.s.tradeCap.n) + offer.blood };
      }
      let inv: Inventory = w.s.inventory;
      for (const it of offer.items) {
        const have = inv[it.slot];
        if (!have || have.item !== it.item || have.qty < it.qty || have.lit || have.inPlayer || NO_DROP.has(have.item) || !!have.ass !== it.ass) fail("Something in a pocket changed, so the trade can't finish. Change your offer and try again.");
        inv = takeQtyFrom(inv, it.slot, it.qty);
        received.get(other.uid)!.push({ item: it.item, qty: it.qty, ass: it.ass, giver: w.uid });
      }
      w.s.inventory = inv;
      w.s.blood -= offer.blood;
      other.s.blood += offer.blood;
    }
    // then each side receives what the other gave (it must fit)
    for (const { w, name } of sides) {
      let inv = w.s.inventory;
      for (const r of received.get(w.uid)!) {
        const next = addToInv(inv, { item: r.item, qty: r.qty, ...(r.ass ? { ass: true } : {}), ...(isLaced(r.item) ? { giver: r.giver } : {}) }); // (a laced thing remembers who handed it over)
        if (!next && overCarry(inv, r.item, r.qty)) fail(w.uid === c.uid ? carryMsg(r.item) : carryMsgFor(name, r.item));
        if (!next) fail(`${w.uid === c.uid ? "Your" : `${name}'s`} pocket hasn't got room for all of it. Make some space.`);
        inv = next!;
      }
      w.s.inventory = inv;
    }
    c.extra[`trades/${id}/status`] = "done";
    return { done: true };
  },
};
