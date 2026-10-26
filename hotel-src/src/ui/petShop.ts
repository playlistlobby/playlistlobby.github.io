import { h, toast } from "./dom";
import { BLOOD_ICON } from "../items";
import { buyPet, onPetSheet, OwnedPet, petPreview, petSheet, setActivePet, watchMyPets } from "../pets";
import { PET_TYPES, petPrice } from "../shared/pets";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

const label = (type: string): string => type.replace(/baby$/, " baby").replace(/^./, (c) => c.toUpperCase());

/** The pet merchant's window: buy a pet (1000-2000 drops, the colour is a surprise), and pick which of yours walks with you. */
export function openPetShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let tab: "buy" | "mine" = "buy";
  let mine: OwnedPet[] = [], active: string | null = null;
  let busy = false;
  const body = h("div", { class: "pet-body" });
  const el = h("div", { class: "cd-popup pet-shop", role: "dialog", "aria-label": "Pet merchant" },
    h("div", { class: "cd-head" }, h("strong", {}, "🐾 Pet merchant"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);

  const previewOf = (type: string, palette: number): HTMLElement => {
    const s = petSheet(type, palette);
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
    const chips = h("div", { class: "rp-chips" },
      h("button", { class: "chip" + (tab === "buy" ? " on" : ""), onclick: () => { tab = "buy"; render(); } }, "Buy a pet"),
      h("button", { class: "chip" + (tab === "mine" ? " on" : ""), onclick: () => { tab = "mine"; render(); } }, `My pets (${mine.length})`));
    if (tab === "buy") {
      body.replaceChildren(chips,
        h("div", { class: "hint" }, "Every pet comes in a colour you can't pick: you find out when it is yours. It walks behind you, and everybody sees it."),
        h("div", { class: "pet-grid" }, ...PET_TYPES.map((type) => {
          const price = petPrice(type);
          return h("div", { class: "pet-card" },
            h("div", { class: "pet-pic" }, previewOf(type, 0)),
            h("div", { class: "pet-name" }, label(type)),
            h("button", { class: "btn small primary", disabled: me.blood < price || busy, title: me.blood < price ? `You need ${price - me.blood} more drops` : "", onclick: () => void act(async () => { const r = await buyPet(me, type); logAction(me, "buy", `bought a ${type} for ${r.price}`); tab = "mine"; return `${label(type)} is yours. It follows you now.`; }) },
              h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`));
        })));
    } else {
      body.replaceChildren(chips,
        ...(mine.length ? [h("div", { class: "pet-grid" }, ...mine.map((p) => h("div", { class: "pet-card" + (active === p.id ? " on" : "") },
          h("div", { class: "pet-pic" }, previewOf(p.type, p.palette)),
          h("div", { class: "pet-name" }, label(p.type)),
          h("button", { class: "btn small" + (active === p.id ? "" : " primary"), disabled: busy, onclick: () => void act(async () => { await setActivePet(me, active === p.id ? null : p.id); return active === p.id ? "It waits at home." : `${label(p.type)} walks with you.`; }) }, active === p.id ? "Send home" : "Take along"))))]
          : [h("div", { class: "hint pad" }, "You have no pets yet. Buy one on the first page.")]));
    }
    el.scrollTop = scrolled;
  }
  const stops = [watchMyPets(me.uid, (p, a) => { mine = p; active = a; render(); }), onPetSheet(render)];
  render();
  function close(): void { if (closed) return; closed = true; stops.forEach((s) => s()); el.remove(); onClose(); }
  return { close };
}
