import { h, toast } from "./dom";
import { bagmandBuy, bagmandSell } from "../db";
import { BLOOD_ICON, itemDef } from "../items";
import { BAGMAND_BUY, bagmandPays } from "../shared/bagmand";
import { serverNow } from "../db";
import { stockLeft, visitEnd, visitNow, watchBagmand } from "../bagmand";
import { countdownText } from "../shared/raffle";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface BagmandShopApi {
  close(): void;
}

/** The window that opens when you talk to bagmand: poppy seeds (a few per visit, for everybody) and natryger on the shelf, and what he buys back. */
export function openBagmandShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): BagmandShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const timer = h("div", { class: "hint" });
  const el = h("div", { class: "cd-popup sixty-shop bagmand-shop", role: "dialog", "aria-label": "bagmand's shop" },
    h("div", { class: "cd-head" }, h("strong", {}, "bagmand"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    timer, body);
  host.append(el);
  let closed = false;

  function render(): void {
    if (closed) return;
    const start = visitNow();
    if (start === null) { toast("Bagmand has left.", "err"); return close(); }
    // what he sells
    const shelf = Object.entries(BAGMAND_BUY).map(([id, def]) => {
      const it = itemDef(id)!;
      const left = stockLeft(id, start);
      const soldOut = left !== null && left <= 0;
      const affordable = me.blood >= def.price && !soldOut;
      return h("div", { class: "sixty-row" },
        h("img", { src: it.icon, alt: it.name, class: "sixty-ico" }),
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, it.name), h("div", { class: "hint" }, left === null ? "As many as you like." : soldOut ? "Sold out. He has more next visit." : `${left} left this visit, for everybody.`)),
        h("button", {
          class: "btn small primary",
          disabled: !affordable,
          title: soldOut ? "Sold out" : affordable ? "" : `You need ${def.price - me.blood} more drops`,
          onclick: async () => {
            try {
              await bagmandBuy(me, id, 1);
              ctx.refreshHeader();
              logAction(me, "buy", `bought a ${it.name} from bagmand for ${def.price}`);
              playSfx("coins", 0.5);
              toast(`${it.name} added to your inventory.`);
              onChange();
              render();
            } catch (err) { toast((err as Error).message, "err"); render(); }
          },
        }, ...(soldOut ? ["Sold out"] : [h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${def.price}`])));
    });
    // what he buys: the same thing in several slots is one row
    const groups = new Map<string, { item: string; ass?: boolean; qty: number }>();
    for (const s of me.inventory) {
      if (!s || s.lit || s.inPlayer || bagmandPays(s) === null) continue;
      const key = `${s.item}|${s.ass ? "ass" : ""}`;
      const g = groups.get(key) ?? { item: s.item, ass: s.ass, qty: 0 };
      g.qty += s.qty;
      groups.set(key, g);
    }
    const sellRows = [...groups.values()].map((grp) => {
      const each = bagmandPays(grp)!;
      const nm = `${itemDef(grp.item)?.name ?? grp.item}${grp.ass ? " (weak)" : ""}`;
      const sell = async (qty: number): Promise<void> => {
        try {
          let left = qty, gain = 0;
          while (left > 0) { // (the pocket shifts after every sale: the slot is looked up again each time)
            const at = me.inventory.findIndex((x) => x && x.item === grp.item && !!x.ass === !!grp.ass && !x.lit && !x.inPlayer);
            if (at < 0) break;
            const take = Math.min(left, me.inventory[at]!.qty);
            gain += await bagmandSell(me, at, take);
            left -= take;
          }
          ctx.refreshHeader();
          logAction(me, "buy", `sold ${qty - left} ${nm} to bagmand for ${gain}`);
          playSfx("coins", 0.5);
          toast(`Bagmand pays you ${gain} drops.`);
          onChange();
          render();
        } catch (err) { toast((err as Error).message, "err"); render(); }
      };
      return h("div", { class: "sixty-row" },
        h("img", { src: itemDef(grp.item)!.icon, alt: "", class: "sixty-ico" }),
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, `${nm}${grp.qty > 1 ? ` x${grp.qty}` : ""}`), h("div", { class: "hint" }, `He pays ${each} drops each.`)),
        h("div", { class: "row" },
          h("button", { class: "btn small danger", onclick: () => void sell(1) }, "Sell"),
          ...(grp.qty > 1 ? [h("button", { class: "btn small danger", onclick: () => void sell(grp.qty) }, `All ${grp.qty}`)] : [])));
    });
    body.replaceChildren(...shelf,
      h("div", { class: "hint pad" }, sellRows.length ? "He buys back what comes from his poppies and his weed (and nothing else, nobody else buys it):" : "He only buys what comes from his poppies and his weed: opium and everything mixed from it. Nothing to sell right now."),
      ...sellRows);
  }
  const tick = (): void => {
    if (closed) return;
    const start = visitNow();
    if (start === null) { toast("Bagmand has left.", "err"); return close(); }
    timer.textContent = `He leaves in ${countdownText(visitEnd(start) - serverNow())}.`;
  };
  render(); tick();
  const stopWatch = watchBagmand(render);
  const iv = window.setInterval(tick, 1000);
  const onPocket = (): void => render();
  window.addEventListener("pocket-changed", onPocket);

  function close(): void {
    if (closed) return;
    closed = true;
    stopWatch();
    window.clearInterval(iv);
    window.removeEventListener("pocket-changed", onPocket);
    el.remove();
    onClose();
  }
  return { close };
}
