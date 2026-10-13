// Trading between two players. Players can't write to each other's pockets, so the hand-over goes through a box in the trade itself:
//  1. both accept, both confirm;  2. each side moves its offer out of its pocket into `escrow/<uid>` (one atomic write);
//  3. each side claims the other's escrow (one atomic write that also empties that escrow).
// If anybody goes away half-way, `recoverTrades` finishes the claim (or gives the escrow back) the next time they sign in.
import { get, onValue, ref, remove, serverTimestamp, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { addToInv, commitInv, serverNow } from "./db";
import type { Profile } from "./db";
import type { Inventory } from "./items";

export interface TradeItem { item: string; qty: number; ass?: boolean }
export interface TradeOffer { blood: number; items: Record<string, TradeItem> }
export interface Escrow { blood: number; items: TradeItem[] }
export interface Trade {
  id: string;
  a: string;
  b: string;
  names: Record<string, string>;
  status: "open" | "cancelled" | "done";
  ts: number;
  offer: Record<string, TradeOffer>;
  ready: Record<string, boolean>;
  confirm: Record<string, boolean>;
  escrowed: Record<string, boolean>;
  claimed: Record<string, boolean>;
  escrow: Record<string, Escrow>;
}

export const otherOf = (t: Trade, uid: string): string => (t.a === uid ? t.b : t.a);
const flags = (v: unknown): Record<string, boolean> => Object.fromEntries(Object.entries((v ?? {}) as Record<string, unknown>).map(([k, x]) => [k, x === true]));
const cleanItem = (x: TradeItem): TradeItem => ({ item: x.item, qty: x.qty, ...(x.ass ? { ass: true } : {}) });

export function parseTrade(id: string, v: any): Trade | null {
  if (!v || typeof v.a !== "string" || typeof v.b !== "string") return null;
  const offer: Record<string, TradeOffer> = {};
  for (const [u, o] of Object.entries<any>(v.offer ?? {})) {
    const items: Record<string, TradeItem> = {};
    for (const [slot, it] of Object.entries<any>(o?.items ?? {})) if (it && typeof it.item === "string") items[slot] = { item: it.item, qty: Number(it.qty) || 1, ...(it.ass ? { ass: true } : {}) };
    offer[u] = { blood: Number(o?.blood) || 0, items };
  }
  const escrow: Record<string, Escrow> = {};
  for (const [u, e] of Object.entries<any>(v.escrow ?? {})) {
    escrow[u] = { blood: Number(e?.blood) || 0, items: Object.values<any>(e?.items ?? {}).filter((it) => it && typeof it.item === "string").map((it) => cleanItem({ item: it.item, qty: Number(it.qty) || 1, ass: !!it.ass })) };
  }
  return {
    id, a: v.a, b: v.b, names: v.names ?? {}, status: v.status === "cancelled" ? "cancelled" : v.status === "done" ? "done" : "open", ts: Number(v.ts) || 0,
    offer, ready: flags(v.ready), confirm: flags(v.confirm), escrowed: flags(v.escrowed), claimed: flags(v.claimed), escrow,
  };
}

export function watchTrade(id: string, cb: (t: Trade | null) => void): Unsubscribe {
  return onValue(ref(db, `trades/${id}`), (s) => cb(s.exists() ? parseTrade(id, s.val()) : null), () => cb(null));
}

// ---- editing your offer ----------------------------------------------------------------------------------------
export const emptyOffer = (): TradeOffer => ({ blood: 0, items: {} });

/** Can this pocket item be traded at all? (Not one that's lit or loaned out to the CD player.) */
export const tradable = (s: Inventory[number]): boolean => !!s && !s.lit && !s.inPlayer;

/** How many of the item in pocket slot `slot` are not yet in your offer. */
export const freeQty = (p: Profile, offer: TradeOffer, slot: number): number => {
  const s = p.inventory[slot];
  return tradable(s) ? s!.qty - (offer.items[String(slot)]?.qty ?? 0) : 0;
};

export function offerAdd(p: Profile, offer: TradeOffer, slot: number, step: number): TradeOffer {
  const s = p.inventory[slot];
  const n = Math.min(step, freeQty(p, offer, slot));
  if (!s || n <= 0) return offer;
  const cur = offer.items[String(slot)];
  return { ...offer, items: { ...offer.items, [String(slot)]: { item: s.item, qty: (cur?.qty ?? 0) + n, ...(s.ass ? { ass: true } : {}) } } };
}

export function offerRemove(offer: TradeOffer, slot: number, step: number): TradeOffer {
  const cur = offer.items[String(slot)];
  if (!cur) return offer;
  const items = { ...offer.items };
  if (cur.qty - step > 0) items[String(slot)] = { ...cur, qty: cur.qty - step }; else delete items[String(slot)];
  return { ...offer, items };
}

export function offerBlood(p: Profile, offer: TradeOffer, delta: number): TradeOffer {
  return { ...offer, blood: Math.max(0, Math.min(p.blood, offer.blood + delta)) };
}

const tradePath = (id: string) => `trades/${id}`;

/** Saves your offer. Any change takes back both players' accept. */
export function writeOffer(p: Profile, t: Trade, offer: TradeOffer): Promise<void> {
  const items: Record<string, TradeItem> = {};
  for (const [k, v] of Object.entries(offer.items)) items[k] = cleanItem(v);
  const hasItems = Object.keys(items).length > 0;
  return update(ref(db), {
    [`${tradePath(t.id)}/offer/${p.uid}`]: { blood: offer.blood, ...(hasItems ? { items } : {}) },
    [`${tradePath(t.id)}/ready/${t.a}`]: null, [`${tradePath(t.id)}/ready/${t.b}`]: null,
    [`${tradePath(t.id)}/confirm/${t.a}`]: null, [`${tradePath(t.id)}/confirm/${t.b}`]: null,
  });
}

export function setReady(p: Profile, t: Trade, on: boolean): Promise<void> {
  return update(ref(db), {
    [`${tradePath(t.id)}/ready/${p.uid}`]: on ? true : null,
    ...(on ? {} : { [`${tradePath(t.id)}/confirm/${t.a}`]: null, [`${tradePath(t.id)}/confirm/${t.b}`]: null }),
  });
}

/** Unlocks the trade (both accepts are taken back) so the offers can change again. */
export function unlock(t: Trade): Promise<void> {
  return update(ref(db), {
    [`${tradePath(t.id)}/ready/${t.a}`]: null, [`${tradePath(t.id)}/ready/${t.b}`]: null,
    [`${tradePath(t.id)}/confirm/${t.a}`]: null, [`${tradePath(t.id)}/confirm/${t.b}`]: null,
  });
}

export function setConfirm(p: Profile, t: Trade, on: boolean): Promise<void> {
  return update(ref(db), { [`${tradePath(t.id)}/confirm/${p.uid}`]: on ? true : null });
}

export const cancelTrade = (t: Trade): Promise<void> => update(ref(db), { [`${tradePath(t.id)}/status`]: "cancelled" });

// ---- will it fit? -----------------------------------------------------------------------------------------------
/** Would your pocket have room for what the other player offers, once your own offer has left it? */
export function canReceive(p: Profile, t: Trade): boolean {
  const mine = t.offer[p.uid] ?? emptyOffer();
  let inv: Inventory = p.inventory.map((s) => (s ? { ...s } : null));
  for (const [k, it] of Object.entries(mine.items)) {
    const s = inv[Number(k)];
    if (!s) continue;
    if (s.qty > it.qty) s.qty -= it.qty; else inv[Number(k)] = null;
  }
  for (const it of Object.values(t.offer[otherOf(t, p.uid)]?.items ?? {})) {
    const next = addToInv(inv, { item: it.item, qty: it.qty, ...(it.ass ? { ass: true } : {}) });
    if (!next) return false;
    inv = next;
  }
  return true;
}

// ---- the hand-over ------------------------------------------------------------------------------------------------
/** Step 2: your offer leaves your pocket and waits in the trade's box. */
export async function escrowMine(p: Profile, t: Trade): Promise<void> {
  const offer = t.offer[p.uid] ?? emptyOffer();
  if (offer.blood > p.blood) throw new Error("You don't have that much blood any more.");
  const next: Inventory = p.inventory.map((s) => (s ? { ...s } : null));
  const list: TradeItem[] = [];
  for (const [k, it] of Object.entries(offer.items)) {
    const s = next[Number(k)];
    if (!s || s.item !== it.item || s.qty < it.qty || !tradable(s) || !!s.ass !== !!it.ass) throw new Error("Something in your pocket changed, so the trade was called off.");
    if (s.qty > it.qty) s.qty -= it.qty; else next[Number(k)] = null;
    list.push(cleanItem(it));
  }
  await commitInv(p, next, {
    [`users/${p.uid}/blood`]: p.blood - offer.blood,
    [`${tradePath(t.id)}/escrow/${p.uid}`]: { blood: offer.blood, ...(list.length ? { items: Object.fromEntries(list.map((x, i) => [String(i), x])) } : {}) },
    [`${tradePath(t.id)}/escrowed/${p.uid}`]: true,
  });
  p.blood -= offer.blood;
}

/** Step 3: take what the other player left in the box (one write that also empties their box). */
export async function claimTheirs(p: Profile, t: Trade): Promise<void> {
  const other = otherOf(t, p.uid);
  const esc = t.escrow[other];
  if (!esc) return;
  let next: Inventory = p.inventory;
  for (const it of esc.items) {
    const added = addToInv(next, { item: it.item, qty: it.qty, ...(it.ass ? { ass: true } : {}) });
    if (!added) throw new Error("Make room in your pockets to finish the trade.");
    next = added;
  }
  await commitInv(p, next, {
    ...(esc.blood > 0 ? { [`users/${p.uid}/blood`]: p.blood + esc.blood, [`users/${p.uid}/tradeClaim`]: { trade: t.id, from: other } } : {}),
    [`${tradePath(t.id)}/escrow/${other}`]: null,
    [`${tradePath(t.id)}/claimed/${p.uid}`]: true,
    ...(t.claimed[other] || !t.escrow[p.uid] ? { [`${tradePath(t.id)}/status`]: "done" } : {}),
  });
  p.blood += esc.blood;
}

/** A called-off trade: your own box goes back into your pocket. */
export async function refundMine(p: Profile, t: Trade): Promise<void> {
  const esc = t.escrow[p.uid];
  if (!esc) return;
  let next: Inventory = p.inventory;
  for (const it of esc.items) {
    const added = addToInv(next, { item: it.item, qty: it.qty, ...(it.ass ? { ass: true } : {}) });
    if (!added) throw new Error("Make room in your pockets to get your things back.");
    next = added;
  }
  await commitInv(p, next, {
    ...(esc.blood > 0 ? { [`users/${p.uid}/blood`]: p.blood + esc.blood, [`users/${p.uid}/tradeClaim`]: { trade: t.id, from: p.uid } } : {}),
    [`${tradePath(t.id)}/escrow/${p.uid}`]: null,
  });
  p.blood += esc.blood;
}

export const forgetTrade = (p: Profile, id: string): Promise<void> => remove(ref(db, `userTrades/${p.uid}/${id}`)).catch(() => undefined);

/** What should happen next for this player in this trade (the window and the login check both ask). */
export type Step = "escrow" | "claim" | "refund" | "cancel-stale" | "forget" | "wait";
export function nextStep(p: Profile, t: Trade): Step {
  const me = p.uid, other = otherOf(t, me);
  if (t.status === "cancelled") return t.escrow[me] ? "refund" : "forget";
  if (t.status === "done") return t.escrow[other] && !t.claimed[me] ? "claim" : "forget";
  const bothConfirmed = t.confirm[me] && t.confirm[other];
  if (t.escrowed[me] && t.escrowed[other]) return t.claimed[me] ? "wait" : "claim";
  if (bothConfirmed && !t.escrowed[me]) return "escrow";
  if (serverNow() - t.ts > 30 * 60_000 && !t.escrowed[other]) return "cancel-stale";
  return "wait";
}

/** At sign-in: finish or undo any trade that was left half-way. Returns how many were dealt with. */
export async function recoverTrades(p: Profile): Promise<number> {
  const snap = await get(ref(db, `userTrades/${p.uid}`));
  let n = 0;
  for (const id of Object.keys((snap.val() ?? {}) as Record<string, unknown>)) {
    try {
      const ts = await get(ref(db, `trades/${id}`));
      const t = ts.exists() ? parseTrade(id, ts.val()) : null;
      if (!t) { await forgetTrade(p, id); continue; }
      let step = nextStep(p, t);
      if (step === "escrow") step = "cancel-stale"; // the other side is long gone: don't start a hand-over now
      if (step === "claim") { await claimTheirs(p, t); n++; }
      else if (step === "refund") { await refundMine(p, t); n++; }
      else if (step === "cancel-stale") { await cancelTrade(t); const again = parseTrade(id, (await get(ref(db, `trades/${id}`))).val()); if (again?.escrow[p.uid]) await refundMine(p, again); n++; }
      if (step === "forget" || step === "refund" || step === "claim") {
        const fresh = parseTrade(id, (await get(ref(db, `trades/${id}`))).val());
        if (fresh && (fresh.status !== "open" || (fresh.claimed[p.uid] && !fresh.escrow[p.uid]))) await forgetTrade(p, id);
      }
    } catch { /* try again next time */ }
  }
  return n;
}

/** Starts a trade: the invited player accepts, creating the trade and a pointer for each of them. */
export async function createTrade(me: Profile, inviterUid: string, inviterName: string): Promise<string> {
  const id = `${inviterUid.slice(0, 6)}${me.uid.slice(0, 6)}${Date.now().toString(36)}`;
  await update(ref(db), {
    [`${tradePath(id)}`]: { a: inviterUid, b: me.uid, names: { [inviterUid]: inviterName, [me.uid]: me.name }, status: "open", ts: serverTimestamp() },
    [`userTrades/${inviterUid}/${id}`]: true,
    [`userTrades/${me.uid}/${id}`]: true,
    [`tradeInvites/${me.uid}/${inviterUid}`]: null,
  });
  return id;
}
