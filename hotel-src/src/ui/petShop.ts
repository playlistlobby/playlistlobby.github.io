import { h, toast } from "./dom";
import { BLOOD_ICON } from "../items";
import { onPetSheet, petPreview, petSheet } from "../pets";
import { buyPet } from "../petActions";
import { petPrice } from "../shared/pets";
import { petLabel, petStock, petStockEnds } from "../shared/petItems";
import { serverNow } from "../db";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/** "3t 12m" for the time until he has new pets */
const untilText = (ms: number): string => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}t ${m % 60}m` : `${m}m`; };

/** pets bih's window: buy a pet (1000-2000 drops, the colour is a surprise). It goes into your pocket: tap it there to let it out. */
export function openPetShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let busy = false;
  const body = h("div", { class: "pet-body" });
  const el = h("div", { class: "cd-popup pet-shop", role: "dialog", "aria-label": "pets bih" },
    h("div", { class: "cd-head" }, h("strong", {}, "🐾 pets bih"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);

  const previewOf = (type: string): HTMLElement => {
    const s = petSheet(type, 0);
    return s ? petPreview(s) : h("div", { class: "pet-wait" }, "…");
  };
  const act = async (what: () => Promise<string>): Promise<void> => {
    if (busy) return;
    busy = true;
    try { const msg = await what(); playSfx("coins", 0.5); toast(msg); ctx.refreshHeader(); onChange(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  };

  function render(): void {
    if (closed) return;
    const scrolled = el.scrollTop;
    body.replaceChildren(
      h("div", { class: "hint" }, `har nogen nye kreaturer eller whatver om ${untilText(petStockEnds(serverNow()) - serverNow())}`),
      h("div", { class: "pet-grid" }, ...petStock(serverNow()).map((type) => {
        const price = petPrice(type);
        return h("div", { class: "pet-card" },
          h("div", { class: "pet-pic" }, previewOf(type)),
          h("div", { class: "pet-name" }, petLabel(type)),
          h("button", { class: "btn small primary", disabled: me.blood < price || busy, title: me.blood < price ? `You need ${price - me.blood} more drops` : "", onclick: () => void act(async () => { const r = await buyPet(me, type); logAction(me, "buy", `bought a ${type} for ${r.price}`); return `${petLabel(type)} is yours. It is in your pocket.`; }) },
            h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`));
      })));
    el.scrollTop = scrolled;
  }
  let stockKey = Math.floor(serverNow() / 60_000);
  const tick = window.setInterval(() => { const k = Math.floor(serverNow() / 60_000); if (k !== stockKey && !busy) { stockKey = k; render(); } }, 5000); // (the time left, and the new four when it is time)
  const stops = [onPetSheet(render), () => window.clearInterval(tick)];
  render();
  function close(): void { if (closed) return; closed = true; stops.forEach((s) => s()); el.remove(); onClose(); }
  return { close };
}
