import { h, toast } from "./dom";
import { buyPosterItem } from "../db";
import { BLOOD_ICON, itemDef } from "../items";
import { POSTER_KIND, POSTER_PRICE } from "../shared/furniture";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface PosterShopApi {
  close(): void;
}

/** The poster on the wall of the shop room: buy one for your own wall (you choose its picture when you hang it). */
export function openPosterShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): PosterShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "Poster" },
    h("div", { class: "cd-head" }, h("strong", {}, "🖼️ Poster"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;

  function render(): void {
    if (closed) return;
    const def = itemDef(POSTER_KIND)!;
    const affordable = me.blood >= POSTER_PRICE;
    body.replaceChildren(h("div", { class: "sixty-row" },
      h("img", { src: def.icon, alt: "", class: "sixty-ico" }),
      h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, "Poster"), h("div", { class: "hint" }, "A frame for your wall. You choose the picture when you hang it: your own photo. It stays on the poster.")),
      h("button", {
        class: "btn small primary",
        disabled: !affordable,
        title: affordable ? "" : `You need ${POSTER_PRICE - me.blood} more drops`,
        onclick: async () => {
          try {
            await buyPosterItem(me);
            ctx.refreshHeader();
            logAction(me, "buy", `bought a poster for ${POSTER_PRICE}`);
            playSfx("coins", 0.5);
            toast("The poster was added to your inventory.");
            onChange();
            render();
          } catch (err) { toast((err as Error).message, "err"); }
        },
      }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${POSTER_PRICE}`)));
  }
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    el.remove();
    onClose();
  }
  return { close };
}
