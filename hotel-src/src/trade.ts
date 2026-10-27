// Trading between two players. The two of them agree on offers in trades/<id> (each writes only their own offer and their own accept /
// confirm). When both have accepted and confirmed, the game server swaps everything in ONE atomic write after checking both pockets
// (src/api.ts "tradeFinish"), so nothing is ever in the middle: nobody can lose or duplicate anything.
import { onValue, ref, remove, serverTimestamp, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { addToInv, call } from "./db";
import type { Profile } from "./db";
import type { Inventory } from "./items";
import { NO_DROP, NO_TRADE_EXCEPT } from "./shared/items";
import { tradeBloodLeft } from "./shared/economy";

export interface TradeItem { item: string; qty: number; ass?: boolean }
export interface TradeOffer { blood: number; items: Record<string, TradeItem> }
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
  return {
    id, a: v.a, b: v.b, names: v.names ?? {}, status: v.status === "cancelled" ? "cancelled" : v.status === "done" ? "done" : "open", ts: Number(v.ts) || 0,
    offer, ready: flags(v.ready), confirm: flags(v.confirm),
  };
}

export function watchTrade(id: string, cb: (t: Trade | null) => void): Unsubscribe {
  return onValue(ref(db, `trades/${id}`), (s) => cb(s.exists() ? parseTrade(id, s.val()) : null), () => cb(null));
}

// ---- editing your offer ----------------------------------------------------------------------------------------
export const emptyOffer = (): TradeOffer => ({ blood: 0, items: {} });

/** Can this pocket item be traded at all? (Not one that's lit or loaned out to the CD player.) */
export const tradable = (s: Inventory[number]): boolean => !!s && !s.lit && !s.inPlayer && (!NO_DROP.has(s.item) || NO_TRADE_EXCEPT.has(s.item));

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
  return { ...offer, blood: Math.max(0, Math.min(p.blood, tradeBloodLeft(p, Date.now()), offer.blood + delta)) };
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

/** Both have confirmed: ask the server to swap everything. (Either side may ask; the second ask changes nothing.) */
export async function finishTrade(p: Profile, t: Trade): Promise<void> {
  await call(p, "tradeFinish", { id: t.id });
}

export const forgetTrade = (p: Profile, id: string): Promise<void> => remove(ref(db, `userTrades/${p.uid}/${id}`)).catch(() => undefined);

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
