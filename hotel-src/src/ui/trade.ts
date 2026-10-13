import { h, toast } from "./dom";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { social, TradeInvite } from "../social";
import { BLOOD_ICON, INV_SIZE, itemDef } from "../items";
import {
  canReceive, cancelTrade, claimTheirs, createTrade, emptyOffer, escrowMine, forgetTrade, freeQty, nextStep, offerAdd, offerBlood, offerRemove,
  otherOf, recoverTrades, refundMine, setConfirm, setReady, Trade, TradeItem, TradeOffer, tradable, unlock, watchTrade, writeOffer,
} from "../trade";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/** Tells the room to redraw the pocket (the trade moved things in or out of it). */
const pocketChanged = (): void => { window.dispatchEvent(new Event("pocket-changed")); };

/**
 * Trading, for as long as you're signed in: invitations pop up with Accept / Decline, and a trade window opens for both players once it
 * starts. Unfinished trades from last time are finished (or undone) right away.
 */
export function mountTrades(ctx: Ctx): () => void {
  const me = ctx.profile;
  const popups = h("div", { class: "trade-popups" });
  document.body.append(popups);
  const windows = new Map<string, () => void>();

  void recoverTrades(me).then((n) => { if (n) { ctx.refreshHeader(); pocketChanged(); toast("A trade you left half-way was finished."); } }).catch(() => undefined);

  const cards = new Map<string, HTMLElement>();
  const showInvite = (k: TradeInvite) => {
    playSfx("knock", 0.5);
    cards.get(k.uid)?.remove();
    const card = h("div", { class: "invite-card knock-card" },
      h("div", {}, "🤝 ", h("strong", {}, k.name), " wants to trade with you."),
      h("div", { class: "row" },
        h("button", { class: "btn small primary", onclick: () => { card.remove(); cards.delete(k.uid); void createTrade(me, k.uid, k.name).catch(() => toast("Couldn't start that trade.", "err")); } }, "Accept"),
        h("button", { class: "btn small", onclick: () => { card.remove(); cards.delete(k.uid); void social.dropTradeInvite(me.uid, k.uid); } }, "Decline")));
    cards.set(k.uid, card);
    popups.append(card);
  };
  const offInvite = social.onTradeInvite(showInvite);
  // an invite that was taken back (they left or cancelled) disappears
  const offStore = social.subscribe(() => { for (const [uid, c] of cards) if (!social.tradeInvites.has(uid)) { c.remove(); cards.delete(uid); } });
  const offStart = social.onTradeStart((id) => { if (!windows.has(id)) windows.set(id, openTradeWindow(ctx, id, () => windows.delete(id))); });

  return () => {
    offInvite();
    offStore();
    offStart();
    [...windows.values()].forEach((close) => close());
    popups.remove();
  };
}

function openTradeWindow(ctx: Ctx, id: string, onGone: () => void): () => void {
  const me = ctx.profile;
  let t: Trade | null = null;
  let amount: 1 | 5 | "all" = 1;
  let closed = false;
  let note = "";
  const acted = new Set<string>();
  const body = h("div", { class: "trade-body" });
  const root = h("div", { class: "trade-overlay" }, h("div", { class: "trade-win", role: "dialog", "aria-label": "Trade" }, body));
  document.body.append(root);
  playSfx("give", 0.4);

  const step = (avail: number): number => (amount === "all" ? Math.max(1, avail) : amount);
  const name = (uid: string) => t?.names[uid] ?? "?";
  const cell = (it: TradeItem, onclick?: () => void, extra = "") => {
    const d = itemDef(it.item);
    return h("button", { class: "trade-cell" + extra, title: `${d?.name ?? it.item}${it.ass ? " (ass)" : ""}`, onclick: onclick ?? (() => undefined), disabled: !onclick },
      h("img", { src: d?.icon ?? "", alt: d?.name ?? it.item, draggable: false }),
      ...(it.qty > 1 ? [h("span", { class: "qty" }, String(it.qty))] : []),
      ...(it.ass ? [h("span", { class: "ass-tag" }, "ass")] : []));
  };
  const bloodChip = (n: number, onclick?: () => void) => h("button", { class: "trade-cell blood", disabled: !onclick, onclick: onclick ?? (() => undefined), title: "Drops of blood" },
    h("img", { src: BLOOD_ICON, alt: "", draggable: false }), h("span", { class: "qty" }, String(n)));

  function render(): void {
    if (closed) return;
    if (!t) { body.replaceChildren(h("div", { class: "hint" }, "Opening the trade…")); return; }
    const other = otherOf(t, me.uid);
    const mine = t.offer[me.uid] ?? emptyOffer();
    const theirs = t.offer[other] ?? emptyOffer();
    const myReady = !!t.ready[me.uid], theirReady = !!t.ready[other];
    const myConfirm = !!t.confirm[me.uid], theirConfirm = !!t.confirm[other];
    const locked = myReady && theirReady;
    const handover = locked && myConfirm && theirConfirm;
    const over = t.status !== "open";
    const editable = !locked && !over;
    const status = (r: boolean, c: boolean) => (c ? "confirmed ✓" : r ? "accepted ✓" : "");
    const fits = canReceive(me, t);

    const give = (o: TradeOffer, mineSide: boolean) => {
      const slots = Object.entries(o.items).sort((a, b) => Number(a[0]) - Number(b[0]));
      return h("div", { class: "trade-grid small" },
        ...(o.blood > 0 || mineSide ? [bloodChip(o.blood, mineSide && editable && o.blood > 0 ? () => void save(offerBlood(me, mine, -step(o.blood))) : undefined)] : []),
        ...slots.map(([slot, it]) => cell(it, mineSide && editable ? () => void save(offerRemove(mine, Number(slot), step(it.qty))) : undefined)),
        ...(slots.length === 0 && o.blood === 0 ? [h("span", { class: "hint" }, mineSide ? "Tap something in your pocket below." : "Nothing yet.")] : []));
    };

    const pocket = Array.from({ length: INV_SIZE }, (_, i) => {
      const s = me.inventory[i];
      if (!s) return h("div", { class: "trade-cell empty" });
      const left = freeQty(me, mine, i);
      const ok = tradable(s);
      return cell({ item: s.item, qty: Math.max(0, left), ...(s.ass ? { ass: true } : {}) }, editable && ok && left > 0 ? () => void save(offerAdd(me, mine, i, step(left))) : undefined, ok ? (left <= 0 ? " dim" : "") : " dim");
    });

    const buttons: HTMLElement[] = [];
    if (over) {
      buttons.push(h("button", { class: "btn primary", onclick: () => close() }, "Close"));
    } else if (handover) {
      buttons.push(h("span", { class: "hint" }, "Handing over…"));
    } else if (locked) {
      buttons.push(
        myConfirm ? h("span", { class: "hint" }, `Waiting for ${name(other)} to confirm…`)
          : h("button", { class: "btn primary", disabled: !fits, onclick: () => void doConfirm() }, "Confirm trade"),
        h("button", { class: "btn", onclick: () => void unlock(t!) }, "Change offer"));
    } else {
      buttons.push(h("button", { class: "btn primary", onclick: () => void setReady(me, t!, !myReady) }, myReady ? "Take back accept" : "Accept"));
    }
    if (!over && !(t.escrowed[me.uid] && t.escrowed[other])) buttons.push(h("button", { class: "btn danger", onclick: () => void doCancel() }, "Cancel trade"));

    body.replaceChildren(
      h("div", { class: "trade-head" }, h("strong", {}, `Trade with ${name(other)}`), h("button", { class: "btn small", onclick: () => void doCancel(true) }, "✕")),
      h("div", { class: "trade-sec" }, h("div", { class: "trade-label" }, `${name(other)}'s offer `, h("span", { class: "ok" }, status(theirReady, theirConfirm))), give(theirs, false)),
      h("div", { class: "trade-sec" }, h("div", { class: "trade-label" }, "Your offer ", h("span", { class: "ok" }, status(myReady, myConfirm))), give(mine, true)),
      h("div", { class: "trade-sec" },
        h("div", { class: "trade-label" }, "Your pocket ",
          h("span", { class: "trade-step" }, ...([1, 5, "all"] as const).map((a) => h("button", { class: "chip" + (amount === a ? " on" : ""), onclick: () => { amount = a; render(); } }, a === "all" ? "All" : `×${a}`)))),
        h("div", { class: "trade-grid" },
          bloodChip(me.blood - mine.blood, editable && me.blood - mine.blood > 0 ? () => void save(offerBlood(me, mine, step(me.blood - mine.blood))) : undefined),
          ...pocket)),
      ...(locked && !myConfirm && !fits ? [h("div", { class: "hint warn" }, "Not enough room in your pocket for what you'd get. Free up some slots (or ask them to offer less).")] : []),
      ...(note ? [h("div", { class: "hint warn" }, note)] : []),
      h("div", { class: "trade-actions" }, ...buttons));
  }

  async function save(offer: TradeOffer): Promise<void> {
    if (!t || t.status !== "open") return;
    try { await writeOffer(me, t, offer); } catch { toast("The hotel refused that offer.", "err"); }
  }
  async function doConfirm(): Promise<void> {
    if (!t) return;
    if (!canReceive(me, t)) { note = "Make room in your pocket first."; return render(); }
    try { await setConfirm(me, t, true); } catch { toast("Couldn't confirm.", "err"); }
  }
  async function doCancel(closeToo = false): Promise<void> {
    if (!t) return close();
    if (t.status !== "open") return close();
    if (t.escrowed[me.uid] && t.escrowed[otherOf(t, me.uid)]) return; // it's being handed over: it will finish by itself
    try { await cancelTrade(t); } catch { toast("Couldn't cancel.", "err"); }
    if (closeToo) close();
  }

  /** What has to happen next for me (escrow my offer, claim theirs, give my box back); each is tried once per window. */
  function drive(): void {
    if (!t || closed) return;
    const s = nextStep(me, t);
    const run = (key: string, job: () => Promise<void>, onErr?: (e: unknown) => void) => {
      if (acted.has(key)) return;
      acted.add(key);
      void job().catch((e) => { acted.delete(key); onErr?.(e); });
    };
    if (s === "escrow") run("escrow", async () => { await escrowMine(me, t!); ctx.refreshHeader(); pocketChanged(); }, (e) => { toast((e as Error).message, "err"); void cancelTrade(t!); });
    else if (s === "claim") run("claim", async () => { await claimTheirs(me, t!); ctx.refreshHeader(); pocketChanged(); playSfx("coins", 0.5); logAction(me, "trade", `traded with ${name(otherOf(t!, me.uid))}`); }, (e) => { note = (e as Error).message; render(); });
    else if (s === "refund") run("refund", async () => { await refundMine(me, t!); ctx.refreshHeader(); pocketChanged(); }, (e) => { note = (e as Error).message; render(); });
    else if (s === "cancel-stale") run("stale", async () => { await cancelTrade(t!); });
    // both have taken their things: the trade is over (whoever finishes second normally marks it, this covers a missed write)
    if (t.status === "open" && t.claimed[t.a] && t.claimed[t.b] && !acted.has("done")) { acted.add("done"); void update(ref(db, `trades/${id}`), { status: "done" }).catch(() => acted.delete("done")); }
    if (t.status === "done" && !t.escrow[otherOf(t, me.uid)] && t.claimed[me.uid]) {
      void forgetTrade(me, id);
      if (!acted.has("bye")) { acted.add("bye"); toast("Trade complete."); window.setTimeout(() => close(), 900); }
    }
    if (t.status === "cancelled" && !t.escrow[me.uid]) { void forgetTrade(me, id); if (!acted.has("bye")) { acted.add("bye"); toast("The trade was called off."); window.setTimeout(() => close(), 600); } }
  }

  const off = watchTrade(id, (next) => {
    if (closed) return;
    if (!next) { close(); return; }
    t = next;
    note = note && t.status === "open" ? note : note;
    render();
    drive();
  });

  function close(): void {
    if (closed) return;
    closed = true;
    off();
    root.remove();
    onGone();
  }
  render();
  return close;
}
