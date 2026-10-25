// The raffle machine in the shop room: the rare piece up for grabs, the countdown to the 20:00 draw, the tickets left, how many you hold (and your chance), and buying more.
import { h, toast } from "./dom";
import { BLOOD_ICON, furniIcon, onFurniIcon } from "../items";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import { prizeName, raffleBuy, raffleCollect, raffleTick, watchRaffle } from "../raffle";
import type { RaffleView } from "../raffle";
import { countdownText, RAFFLE_PRICE, RAFFLE_TICKETS } from "../shared/raffle";
import { serverNow } from "../db";
import type { Ctx } from "../main";

export interface RaffleShopApi { close(): void }

export function openRaffleShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): RaffleShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop raffle-shop", role: "dialog", "aria-label": "Raffle" },
    h("div", { class: "cd-head" }, h("strong", {}, "🎟️ Raffle"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let busy = false;
  let view: RaffleView = { round: null, tickets: {}, sold: 0, last: null, waiting: [] };
  let qty = 1;
  let drawAsked = 0;

  const stopWatch = watchRaffle(me.uid, (v) => { view = v; render(); });
  const stopIcons = onFurniIcon(() => render());
  const clock = window.setInterval(() => tick(), 1000);
  void raffleTick(me).catch(() => undefined); // (a draw that is due, or no round yet)

  const mine = (): number => view.tickets[me.uid] ?? 0;
  const left = (): number => Math.max(0, RAFFLE_TICKETS - view.sold);

  /** every second: the countdown moves; at 20:00 the draw is asked for (the server runs it for the first one who asks) */
  function tick(): void {
    if (closed) return;
    const r = view.round;
    if (r && serverNow() >= r.drawAt && Date.now() - drawAsked > 4000) {
      drawAsked = Date.now();
      void raffleTick(me).then(() => onChange(), () => undefined);
    }
    const t = el.querySelector(".raffle-count");
    if (t && r) t.textContent = serverNow() >= r.drawAt ? "Drawing…" : countdownText(r.drawAt - serverNow());
  }

  async function buy(): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try {
      const r = await raffleBuy(me, qty);
      playSfx("give", 0.6);
      ctx.refreshHeader();
      onChange();
      logAction(me, "buy", `bought ${qty} raffle ticket${qty > 1 ? "s" : ""}`);
      toast(r.tickets === 1 ? "You have 1 ticket now." : `You have ${r.tickets} tickets now.`);
      qty = Math.min(qty, Math.max(1, r.left));
    } catch (err) { toast((err as Error).message || "The machine is stuck.", "err"); }
    busy = false;
    render();
  }

  async function collect(): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try {
      const r = await raffleCollect(me);
      playSfx("give", 0.6);
      onChange();
      toast(r.more ? "You took one prize. Make room for the rest." : `You took the ${prizeName(r.items[0])}!`);
    } catch (err) { toast((err as Error).message || "The machine is stuck.", "err"); }
    busy = false;
    render();
  }

  const blood = (n: number): Array<string | HTMLElement> => [h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${n}`];

  function render(): void {
    if (closed) return;
    const r = view.round;
    const have = mine();
    const max = Math.max(1, Math.min(left(), Math.floor(me.blood / RAFFLE_PRICE) || 1));
    if (qty > max) qty = max;
    if (qty < 1) qty = 1;
    const chance = view.sold > 0 ? Math.round((have / view.sold) * 100) : 0;
    const soldOut = left() <= 0;
    const cost = qty * RAFFLE_PRICE;
    const last = view.last;
    const lastLine = !last ? "" : last.winner
      ? last.winner === me.uid ? `Last draw: you won the ${prizeName(last.prize)}!` : `Last draw: ${last.winnerName ?? "someone"} won the ${prizeName(last.prize)}.`
      : `Last draw: nobody had a ticket, so the ${prizeName(last.prize)} stays up.`;
    body.replaceChildren(
      r ? h("div", { class: "raffle-prize" },
        h("img", { src: furniIcon(r.prize), alt: "", class: "raffle-ico" }),
        h("div", { class: "raffle-pname" }, prizeName(r.prize)),
        h("div", { class: "hint" }, "Tonight's rare piece. One ticket wins it.")) : h("div", { class: "hint" }, "Opening the raffle…"),
      h("div", { class: "raffle-row" }, h("span", {}, "Draw in"), h("b", { class: "raffle-count" }, r ? (serverNow() >= r.drawAt ? "Drawing…" : countdownText(r.drawAt - serverNow())) : "…")),
      h("div", { class: "raffle-row" }, h("span", {}, "Tickets left"), h("b", {}, `${left()} / ${RAFFLE_TICKETS}`)),
      h("div", { class: "raffle-row" }, h("span", {}, "Yours"), h("b", {}, have ? `${have} · ${chance}% chance` : "none")),
      soldOut ? h("div", { class: "hint" }, "Sold out. The draw is at 20:00.") : h("div", { class: "raffle-buy" },
        h("button", { class: "btn small", type: "button", disabled: busy || qty <= 1, onclick: () => { qty = Math.max(1, qty - 1); render(); } }, "−"),
        h("b", { class: "raffle-qty" }, String(qty)),
        h("button", { class: "btn small", type: "button", disabled: busy || qty >= max, onclick: () => { qty = Math.min(max, qty + 1); render(); } }, "+"),
        h("button", { class: "btn small", type: "button", disabled: busy || qty >= max, onclick: () => { qty = max; render(); } }, "Max"),
        h("button", { class: "btn small primary", type: "button", disabled: busy || me.blood < RAFFLE_PRICE, onclick: () => void buy() }, ...(busy ? ["…"] : ["Buy ", ...blood(cost)]))),
      h("div", { class: "hint" }, `A ticket costs ${RAFFLE_PRICE} blood. The blood is gone for good.`),
      view.waiting.length ? h("div", { class: "raffle-win" },
        h("div", {}, `🎉 You won the ${prizeName(view.waiting[0])}! It waits here until there is room in your pockets.`),
        h("button", { class: "btn small primary", type: "button", disabled: busy, onclick: () => void collect() }, "Take it")) : h("span", {}),
      lastLine ? h("div", { class: "hint raffle-last" }, lastLine) : h("span", {}));
  }
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    window.clearInterval(clock);
    stopWatch();
    stopIcons();
    el.remove();
    onClose();
  }
  return { close };
}
