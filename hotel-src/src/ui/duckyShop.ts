// The pay2win machine in the shop room: a starter package, a name colour, the chat tool and a new name, all for real money.
// Everything here is paid on the payment page (Stripe) and handed over when you are back (src/payReturn.ts); only changing the colour you already bought is free.
import { h, toast } from "./dom";
import { call } from "../db";
import { startPayment } from "../api";
import { BLOOD_ICON } from "../items";
import { CHAT_COLORS, duckyDef, duckyPayId, isHexColor, kr, NEW_NAME_RE, readableOnDark } from "../shared/ducky";
import type { DuckyProduct } from "../shared/ducky";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface DuckyShopApi { close(): void }

const ICONS: Record<DuckyProduct, string> = { starter: "🌱", color: "🎨", fx: "💬", rename: "🏷️", keys: "🔑", key1: "🔑", vape: "💨" };

export function openDuckyShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): DuckyShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop ducky-shop", role: "dialog", "aria-label": "pay2win" },
    h("div", { class: "cd-head" }, h("strong", {}, "💸 pay2win"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let busy = false;
  let open: DuckyProduct | null = null; // the card with its extra input open (colour, new name)
  let pickedColor = me.nameColor ?? CHAT_COLORS[3];
  let newName = "";

  /** the colour you already own changes for free; everything else sends you to the payment page (and what you chose comes with you: the colour, the new name) */
  async function buy(product: DuckyProduct, extra: { color?: string; name?: string } = {}): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try {
      if (product === "color" && me.owned.ducky_color) {
        const r = await call<{ color?: string }>(me, "duckyBuy", { product, ...extra });
        playSfx("select", 0.5);
        logAction(me, "buy", "changed the name colour at pay2win");
        if (r.color) { me.nameColor = r.color; window.dispatchEvent(new CustomEvent("name-color", { detail: r.color })); }
        toast("Your name colour changed.");
        open = null;
      } else {
        const url = await startPayment(duckyPayId(product), extra);
        logAction(me, "buy", `went to pay for "${product}" at pay2win`);
        window.location.assign(url);
        return; // (the page goes away: nothing to redraw)
      }
    } catch (err) { toast((err as Error).message || "The machine is stuck.", "err"); }
    busy = false;
    render();
  }

  function card(product: DuckyProduct, name: string, hint: string, action: HTMLElement | null, input?: HTMLElement): HTMLElement {
    const def = duckyDef(product)!;
    const owned = def.once ? !!me.owned[def.once] : false;
    return h("div", { class: "ducky-card" + (owned ? " owned" : "") },
      h("div", { class: "sixty-row" },
        h("div", { class: "ducky-ico" }, ICONS[product]),
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, name), h("div", { class: "hint" }, hint)),
        action ?? h("span", {})),
      input ?? null);
  }
  const price = (p: DuckyProduct): string => kr(duckyDef(p)!.ore);
  const buyBtn = (p: DuckyProduct, onclick: () => void, label?: string): HTMLElement =>
    h("button", { class: "btn small primary", disabled: busy, onclick }, busy ? "…" : label ?? price(p));
  const ownedBtn = (label = "Owned"): HTMLElement => h("button", { class: "btn small", disabled: true }, label);

  function render(): void {
    if (closed) return;
    const starterHave = !!me.owned.ducky_starter, colorHave = !!me.owned.ducky_color, fxHave = !!me.owned.ducky_fx;
    const swatches = h("div", { class: "ducky-swatches" },
      ...CHAT_COLORS.filter(readableOnDark).map((c) => h("button", { class: "ducky-sw" + (pickedColor === c ? " on" : ""), type: "button", style: { background: c }, "aria-label": c, onclick: () => { pickedColor = c; render(); } })),
      h("input", { type: "color", class: "ducky-pick", value: isHexColor(pickedColor) ? pickedColor : "#46d369", "aria-label": "Own colour", oninput: (e: Event) => { pickedColor = (e.target as HTMLInputElement).value; } , onchange: () => render() }));
    const colorOk = isHexColor(pickedColor) && readableOnDark(pickedColor);
    const colorInput = h("div", { class: "ducky-input" },
      swatches,
      h("div", { class: "ducky-prev", style: { color: colorOk ? pickedColor : "#888" } }, me.name),
      colorOk ? h("button", { class: "btn small primary", disabled: busy, onclick: () => void buy("color", { color: pickedColor }) }, colorHave ? "Change colour (free)" : `Buy · ${price("color")}`) : h("div", { class: "hint" }, "That colour is too dark to read."));
    const nameOk = NEW_NAME_RE.test(newName);
    const nameInput = h("div", { class: "ducky-input" },
      h("input", { type: "text", class: "ducky-name", maxLength: 16, placeholder: "New name", value: newName, autocomplete: "off", oninput: (e: Event) => { newName = (e.target as HTMLInputElement).value.trim(); (document.querySelector(".ducky-go") as HTMLButtonElement | null)?.toggleAttribute("disabled", !NEW_NAME_RE.test(newName) || busy); } }),
      h("button", { class: "btn small primary ducky-go", disabled: busy || !nameOk, onclick: () => void buy("rename", { name: newName }) }, `Buy · ${price("rename")}`),
      h("div", { class: "hint" }, "3-16 letters, numbers, . _ -  Your password stays the same."));

    body.replaceChildren(
      card("starter", "Starter package", "3 growing kits, 3 mixers and 50 blood. Only once.",
        starterHave ? ownedBtn() : buyBtn("starter", () => void buy("starter"))),
      card("color", "Name colour", colorHave ? "Your name has its own colour. Change it whenever you like." : "Your name in a colour of your own, over your head and in the chat.",
        open === "color" ? h("button", { class: "btn small", onclick: () => { open = null; render(); } }, "Close") : h("button", { class: "btn small primary", disabled: busy, onclick: () => { open = "color"; render(); } }, colorHave ? "Change" : price("color")),
        open === "color" ? colorInput : undefined),
      card("fx", "Chat tool", "Du kan lave effects med din chat i guess",
        fxHave ? ownedBtn() : buyBtn("fx", () => void buy("fx"))),
      card("keys", "5 box keys", "Five keys for mystery boxes (boxes turn up in the bins). One key opens one box. Buy as many as you like.",
        buyBtn("keys", () => void buy("keys"))),
      card("key1", "1 box key", "One key for a mystery box. One key opens one box.",
        buyBtn("key1", () => void buy("key1"))),
      card("vape", "Puff-bar", "Vape med en klam abe på. Puff it once a minute: 35 seconds of walking 1.5x as fast and double blood from stabs. You can trade it.",
        buyBtn("vape", () => void buy("vape"))),
      card("rename", "Change your name", "Pick a new username. Your things, friends and room come with you.",
        open === "rename" ? h("button", { class: "btn small", onclick: () => { open = null; render(); } }, "Close") : h("button", { class: "btn small primary", disabled: busy, onclick: () => { open = "rename"; render(); } }, price("rename")),
        open === "rename" ? nameInput : undefined),
      h("div", { class: "hint" }, "Everything here is paid on a payment page: you come back to the game afterwards."));
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
