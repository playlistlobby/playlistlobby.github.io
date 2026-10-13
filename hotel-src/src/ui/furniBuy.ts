import { h, toast } from "./dom";
import { buyFurni, serverNow } from "../db";
import { BLOOD_ICON, furniIcon, onFurniIcon } from "../items";
import { FURNI_KINDS } from "../rooms";
import { priceOf } from "../furniShop";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface FurniBuyApi { close(): void }

/** The small window that pops up when you click one of today's pieces in the shop room: its price, and Buy or Cancel. */
export function openFurniBuy(host: HTMLElement, ctx: Ctx, kind: string, onBought: () => void, onClose: () => void): FurniBuyApi {
  const me = ctx.profile;
  const k = FURNI_KINDS[kind];
  const price = priceOf(kind);
  const img = h("img", { class: "furni-buy-img", alt: k.label, src: furniIcon(kind) });
  const offIcon = onFurniIcon(() => { img.src = furniIcon(kind); });
  const msg = h("div", { class: "hint" });
  const buy = h("button", { class: "btn primary", onclick: () => void doBuy() }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` Buy for ${price}`);
  const cancel = h("button", { class: "btn", onclick: () => close() }, "Cancel");
  const el = h("div", { class: "cd-popup furni-buy", role: "dialog", "aria-label": `Buy ${k.label}` },
    h("div", { class: "cd-head" }, h("strong", {}, k.label), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    h("div", { class: "furni-buy-body" }, img, h("div", {}, h("div", { class: "hint" }, `${k.w}×${k.h} tiles${k.seat ? " · you can sit on it" : ""}`), msg)),
    h("div", { class: "row center" }, buy, cancel));
  host.append(el);
  let closed = false;
  let busy = false;
  const refresh = () => {
    const short = price - me.blood;
    buy.toggleAttribute("disabled", short > 0 || busy);
    msg.textContent = short > 0 ? `You need ${short} more drop${short === 1 ? "" : "s"}.` : "It goes into your inventory.";
  };
  refresh();

  async function doBuy(): Promise<void> {
    if (busy) return;
    busy = true;
    refresh();
    try {
      await buyFurni(me, kind, price);
      ctx.refreshHeader();
      logAction(me, "buy", `bought ${k.label} for ${price} (${serverNow()})`);
      playSfx("coins", 0.5);
      toast(`${k.label} is in your inventory.`);
      onBought();
      close();
    } catch (err) {
      busy = false;
      toast((err as Error).message || "The hotel refused that.", "err");
      refresh();
    }
  }
  function close(): void {
    if (closed) return;
    closed = true;
    offIcon();
    el.remove();
    onClose();
  }
  return { close };
}
