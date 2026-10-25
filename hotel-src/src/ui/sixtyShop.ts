import { h, toast } from "./dom";
import { buyInventoryItem, sellWeed } from "../db";
import { BLOOD_ICON, DISABLED_ITEMS, itemDef, ITEMS, SIXTY_STOCK } from "../items";
import { SELL_BUNDLE, sellPrice as sellPriceOf } from "../shared/items";
import { furniPricesNow } from "../furniShop";
import { itemEntry, onShopConfig } from "../shopConfig";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface SixtyShopApi {
  close(): void;
}

/** The small shop window that opens when you talk to 6ixty (after the first meeting). */
/** `mines`: the 6ixty down in the mines: his shelf is the wood (the other 6ixty doesn't have any), and he buys what you dig up. */
export function openSixtyShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void, opts: { mines?: boolean } = {}): SixtyShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "6ixty's shop" },
    h("div", { class: "cd-head" }, h("strong", {}, "6ixty"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let picking: string | null = null; // the row whose "how many?" bar is open
  let pickQty = 1;

  function render(): void {
    if (closed) return;
    // his shelf: whatever the admin has switched on (Admin > Shop > 6ixty stock); the cigarette is on by default
    const stock = [...SIXTY_STOCK, ...Object.keys(ITEMS).filter((id) => !SIXTY_STOCK.includes(id))].filter((id) => itemDef(id) && !DISABLED_ITEMS.has(id) && id !== "cigbutt" && id !== "cd" && itemEntry(id).on && (opts.mines ? id === "wood" : id !== "wood"));
    // selling: he buys weed, seeds and what the mixer makes (prices: sellPrice)
    const sellPrice = (item: string, ass?: boolean): number | null => sellPriceOf(item, ass, furniPricesNow());
    // the same thing lying in several slots is one row ("Fentanyl x3"); Sell asks how many
    const groups = new Map<string, { item: string; ass?: boolean; slots: Array<{ slot: number; qty: number }>; qty: number }>();
    me.inventory.forEach((s, slot) => {
      if (!s || sellPrice(s.item, s.ass) === null || s.lit || s.inPlayer) return;
      const key = `${s.item}|${s.ass ? "ass" : ""}`;
      const g = groups.get(key) ?? { item: s.item, ass: s.ass, slots: [], qty: 0 };
      g.slots.push({ slot, qty: s.qty });
      g.qty += s.qty;
      groups.set(key, g);
    });
    const sellRows = [...groups.entries()].map(([key, grp]) => {
      const each = sellPrice(grp.item, grp.ass)!;
      const bundle = SELL_BUNDLE[grp.item] ?? 1; // cigarette butts, cigarettes and pills: he buys them 2 at a time
      const nm = `${itemDef(grp.item)?.name ?? grp.item}${grp.ass ? " (ass)" : ""}`;
      const max = Math.floor(grp.qty / bundle) * bundle;
      const sell = async (qty: number) => {
        try {
          let left = qty, gain = 0;
          // (the pocket can shift after every sale, so each time the slot is looked up again from what is in the pocket now)
          while (left > 0) {
            const at = me.inventory.findIndex((x) => x && x.item === grp.item && !!x.ass === !!grp.ass && !x.lit && !x.inPlayer && x.qty >= bundle);
            if (at < 0) break;
            const have = me.inventory[at]!.qty;
            const take = Math.min(left, bundle > 1 ? Math.floor(have / bundle) * bundle : have);
            gain += await sellWeed(me, at, take);
            left -= take;
          }
          picking = null;
          ctx.refreshHeader();
          logAction(me, "buy", `sold ${qty - left} ${nm} to 6ixty for ${gain}`);
          playSfx("coins", 0.5);
          toast(`6ixty pays you ${gain} drops.`);
          onChange();
          render();
        } catch (err) { toast((err as Error).message, "err"); render(); }
      };
      const head = h("div", { class: "sixty-row" },
        h("img", { src: itemDef(grp.item)!.icon, alt: "", class: "sixty-ico" }),
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, `${nm}${grp.qty > 1 ? ` x${grp.qty}` : ""}`), h("div", { class: "hint" }, bundle > 1 ? (each === 1 ? "He pays 1 drop for 2." : "He pays 3 drops for 2.") : `He pays ${each} drops each.`)),
        max < 1 ? h("button", { class: "btn small", disabled: true }, "Needs 2")
          : h("button", { class: "btn small danger", onclick: () => { picking = picking === key ? null : key; pickQty = Math.min(max, Math.max(bundle, pickQty)); render(); } }, "Sell"));
      if (picking !== key || max < 1) return head;
      pickQty = Math.min(max, Math.max(bundle, pickQty - (pickQty % bundle)));
      const total = (): number => (pickQty / bundle) * each;
      const label = h("span", { class: "sixty-qty-label" }, `${pickQty} for ${total()}`);
      const range = h("input", { type: "range", class: "sixty-qty", min: String(bundle), max: String(max), step: String(bundle), value: String(pickQty) }) as HTMLInputElement;
      range.oninput = () => { pickQty = Number(range.value); label.textContent = `${pickQty} for ${total()}`; };
      const step = (d: number) => { pickQty = Math.min(max, Math.max(bundle, pickQty + d * bundle)); range.value = String(pickQty); label.textContent = `${pickQty} for ${total()}`; };
      return h("div", { class: "sixty-pick" }, head,
        h("div", { class: "row center sixty-pick-row" },
          h("button", { class: "btn small", onclick: () => step(-1) }, "−"), range, h("button", { class: "btn small", onclick: () => step(1) }, "+"), label),
        h("div", { class: "row center" },
          h("button", { class: "btn small danger", onclick: () => void sell(pickQty) }, "Sell"),
          h("button", { class: "btn small", onclick: () => { pickQty = max; range.value = String(max); label.textContent = `${max} for ${(max / bundle) * each}`; } }, "All"),
          h("button", { class: "btn small", onclick: () => { picking = null; render(); } }, "Cancel")));
    });
    body.replaceChildren(
      ...(stock.length === 0 ? [h("div", { class: "hint" }, "Nothing on the shelf right now.")] : stock.map((id) => {
        const it = itemDef(id)!;
        const price = itemEntry(id).price;
        const bought = id === "cd" && !!me.owned.item_cd; // one CD per player
        const affordable = me.blood >= price && !bought;
        return h("div", { class: "sixty-row" },
          h("img", { src: it.icon, alt: it.name, class: "sixty-ico" }),
          h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, it.name), h("div", { class: "hint" }, it.examine)),
          h("button", {
            class: "btn small primary",
            disabled: !affordable,
            title: bought ? "You already bought your CD." : affordable ? "" : `You need ${price - me.blood} more drops`,
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
          }, ...(bought ? ["Owned"] : [h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`])));
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
