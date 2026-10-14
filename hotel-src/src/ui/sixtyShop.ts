import { h, toast } from "./dom";
import { buyInventoryItem, sellWeed } from "../db";
import { BLOOD_ICON, DISABLED_ITEMS, itemDef, ITEMS, SIXTY_STOCK } from "../items";
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
    const stock = [...SIXTY_STOCK, ...Object.keys(ITEMS).filter((id) => !SIXTY_STOCK.includes(id))].filter((id) => itemDef(id) && !DISABLED_ITEMS.has(id) && id !== "cigbutt" && id !== "deadcat" && itemEntry(id).on);
    // selling: he buys weed, 6 drops each (3 for ass weed)
    const sells = me.inventory.map((s, slot) => ({ s, slot })).filter((e) => e.s && e.s.item === "weed" && !e.s.lit);
    const sellRows = sells.map(({ s, slot }) => {
      const each = s!.ass ? 3 : 6;
      const sell = async (qty: number) => {
        try {
          const gain = await sellWeed(me, slot, qty);
          ctx.refreshHeader();
          logAction(me, "buy", `sold ${qty} ${s!.ass ? "ass " : ""}weed to 6ixty for ${gain}`);
          playSfx("coins", 0.5);
          toast(`6ixty pays you ${gain} drops.`);
          onChange();
          render();
        } catch (err) { toast((err as Error).message, "err"); }
      };
      return h("div", { class: "sixty-row" },
        h("img", { src: itemDef("weed")!.icon, alt: "Weed", class: "sixty-ico" }),
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, `${s!.ass ? "Ass weed" : "Weed"} x${s!.qty}`), h("div", { class: "hint" }, `He pays ${each} drops each.`)),
        h("button", { class: "btn small", onclick: () => void sell(1) }, `Sell 1 (${each})`),
        ...(s!.qty > 1 ? [h("button", { class: "btn small primary", onclick: () => void sell(s!.qty) }, `All (${each * s!.qty})`)] : []));
    });
    body.replaceChildren(
      ...(stock.length === 0 ? [h("div", { class: "hint" }, "Nothing on the shelf right now.")] : stock.map((id) => {
        const it = itemDef(id)!;
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
      })),
      ...(sellRows.length ? [h("div", { class: "hint pad" }, "Sell to 6ixty:"), ...sellRows] : []));
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
