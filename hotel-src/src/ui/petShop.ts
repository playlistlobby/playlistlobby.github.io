import { h, toast } from "./dom";
import { BLOOD_ICON } from "../items";
import { onPetSheet, petPreview, petSheet } from "../pets";
import { buyPet } from "../petActions";
import { PET_TYPES, petPrice } from "../shared/pets";
import { petLabel } from "../shared/petItems";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/** The pet merchant's window: buy a pet (1000-2000 drops, the colour is a surprise). It goes into your pocket: tap it there to let it out. */
export function openPetShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let busy = false;
  const body = h("div", { class: "pet-body" });
  const el = h("div", { class: "cd-popup pet-shop", role: "dialog", "aria-label": "Pet merchant" },
    h("div", { class: "cd-head" }, h("strong", {}, "🐾 Pet merchant"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
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
      h("div", { class: "hint" }, "Every pet comes in a colour you can't pick: you find out when it is yours. It goes into your pocket: tap it there to let it out. Then it walks behind you, and everybody sees it. Tap it in the room to pick it up again."),
      h("div", { class: "pet-grid" }, ...PET_TYPES.map((type) => {
        const price = petPrice(type);
        return h("div", { class: "pet-card" },
          h("div", { class: "pet-pic" }, previewOf(type)),
          h("div", { class: "pet-name" }, petLabel(type)),
          h("button", { class: "btn small primary", disabled: me.blood < price || busy, title: me.blood < price ? `You need ${price - me.blood} more drops` : "", onclick: () => void act(async () => { const r = await buyPet(me, type); logAction(me, "buy", `bought a ${type} for ${r.price}`); return `${petLabel(type)} is yours. It is in your pocket.`; }) },
            h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`));
      })));
    el.scrollTop = scrolled;
  }
  const stops = [onPetSheet(render)];
  render();
  function close(): void { if (closed) return; closed = true; stops.forEach((s) => s()); el.remove(); onClose(); }
  return { close };
}
