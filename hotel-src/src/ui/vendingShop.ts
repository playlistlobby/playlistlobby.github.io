import { h, toast } from "./dom";
import { buyStock } from "../db";
import { BLOOD_ICON, itemDef, VENDING_STOCK } from "../items";
import { itemEntry, onShopConfig } from "../shopConfig";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface VendingApi {
  close(): void;
}

/** The shop room's vending machine: lighters, rolling paper, watering cans, the mixer and the growing kit. */
export function openVending(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): VendingApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "Vending machine" },
    h("div", { class: "cd-head" }, h("strong", {}, "Vending machine"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;

  function render(): void {
    if (closed) return;
    body.replaceChildren(...VENDING_STOCK.map((s) => {
      const def = itemDef(s.item)!;
      const price = s.fixedPrice ?? itemEntry(s.id).price;
      const affordable = me.blood >= price;
      return h("div", { class: "sixty-row" },
        h("img", { src: def.icon, alt: def.name, class: "sixty-ico" }),
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, s.label), h("div", { class: "hint" }, s.qty > 1 ? `${s.qty} in a pack.` : def.examine)),
        h("button", {
          class: "btn small primary",
          disabled: !affordable,
          title: affordable ? "" : `You need ${price - me.blood} more drops`,
          onclick: async () => {
            try {
              await buyStock(me, s.id);
              ctx.refreshHeader();
              logAction(me, "buy", `bought ${s.label} from the vending machine for ${price}`);
              playSfx("coins", 0.5);
              toast(`${s.label} added to your inventory.`);
              onChange();
              render();
            } catch (err) {
              toast((err as Error).message, "err");
            }
          },
        }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`));
    }));
  }
  render();
  const off = onShopConfig(render);

  function close(): void {
    if (closed) return;
    closed = true;
    off();
    el.remove();
    onClose();
  }
  return { close };
}
