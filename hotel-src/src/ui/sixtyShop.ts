import { h, toast } from "./dom";
import { buyInventoryItem } from "../db";
import { BLOOD_ICON, DISABLED_ITEMS, ITEMS, SIXTY_STOCK } from "../items";
import { itemEntry, onShopConfig } from "../shopConfig";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface SixtyShopApi {
  close(): void;
}

/** The small shop window that opens when you talk to 6ixty (after the first meeting). */
export function openSixtyShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): SixtyShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "6ixty's shop" },
    h("div", { class: "cd-head" }, h("strong", {}, "6ixty"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;

  function render(): void {
    if (closed) return;
    // his shelf: whatever the admin has switched on (Admin > Shop > 6ixty stock); lockpick and cigarette are on by default
    const stock = [...SIXTY_STOCK, ...Object.keys(ITEMS).filter((id) => !SIXTY_STOCK.includes(id))].filter((id) => ITEMS[id] && !DISABLED_ITEMS.has(id) && id !== "cigbutt" && id !== "deadcat" && itemEntry(id).on);
    body.replaceChildren(
      ...(stock.length === 0 ? [h("div", { class: "hint" }, "Nothing on the shelf right now.")] : stock.map((id) => {
        const it = ITEMS[id];
        const price = itemEntry(id).price;
        const affordable = me.blood >= price;
        return h("div", { class: "sixty-row" },
          h("img", { src: it.icon, alt: it.name, class: "sixty-ico" }),
          h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, it.name), h("div", { class: "hint" }, it.examine)),
          h("button", {
            class: "btn small primary",
            disabled: !affordable,
            title: affordable ? "" : `You need ${price - me.blood} more drops`,
            onclick: async () => {
              try {
                await buyInventoryItem(me, id, price);
                ctx.refreshHeader();
                logAction(me, "buy", `bought a ${it.name} from 6ixty for ${price}`);
                playSfx("coins", 0.5);
                toast(`${it.name} added to your inventory.`);
                onChange();
                render();
              } catch (err) {
                toast((err as Error).message, "err");
              }
            },
          }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`));
      })));
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
