// The t-shirt shop at the album event: pre-order a real t-shirt for 200 kr. Pick one of three designs (two the admin can change, and one with your own character), give your name and
// address (so it can be posted), then pay on the payment page. The server only accepts it from a player who is on the event stage right now.
// The admin gets the list of orders (design, name, address, size) from the 📦 button there, and can change the pictures of designs A and B here.
import { get, ref } from "firebase/database";
import { h, toast } from "./dom";
import { db } from "../firebase";
import { startPayment } from "../api";
import { kr } from "../shared/ducky";
import { cleanTshirtOrder, TSHIRT_DESIGNS, TSHIRT_PRICE_ORE, TSHIRT_SIZES } from "../shared/tshirt";
import type { TshirtDesign, TshirtOrder } from "../shared/tshirt";
import { customShirt, designLabel, designPicture, printFile, resetDesign, uploadDesign } from "./tshirtArt";
import { logAction } from "../logger";
import type { Ctx } from "../main";

export interface TshirtShopApi { close(): void }

export function openTshirtShop(host: HTMLElement, ctx: Ctx, onClose: () => void): TshirtShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop tshirt-shop", role: "dialog", "aria-label": "T-shirt shop" },
    h("div", { class: "cd-head" }, h("strong", {}, "T-shirt shop"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let busy = false;
  const v = { design: "" as TshirtDesign | "", name: "", street: "", zip: "", city: "", country: "Danmark", size: "" };
  const pics: Partial<Record<TshirtDesign, string>> = {}; // the pictures shown on the cards (a data address or a file)

  async function loadPictures(): Promise<void> {
    const [a, b, mine] = await Promise.all([designPicture("a"), designPicture("b"), customShirt(me.figure, me.name).then((c) => c.toDataURL("image/png"), () => "")]);
    pics.a = a; pics.b = b; pics.me = mine;
    render();
  }

  const field = (key: "name" | "street" | "zip" | "city" | "country", label: string, ph: string, auto: string): HTMLElement =>
    h("label", { class: "tshirt-field" }, h("span", { class: "hint" }, label),
      h("input", { type: "text", class: "tshirt-input", maxLength: 80, placeholder: ph, value: v[key], autocomplete: auto, oninput: (e: Event) => { v[key] = (e.target as HTMLInputElement).value; } }));

  async function buy(): Promise<void> {
    if (busy) return;
    let order: TshirtOrder;
    try { order = cleanTshirtOrder(v); } catch (err) { toast((err as Error).message, "err"); return; }
    busy = true;
    render();
    try {
      const url = await startPayment("tshirt", { order });
      logAction(me, "buy", `went to pay for a t-shirt (design ${order.design}) at the event`); // (no name or address in the log)
      window.location.assign(url);
      return; // (the page goes away)
    } catch (err) { toast((err as Error).message || "The shop is stuck.", "err"); }
    busy = false;
    render();
  }

  /** the admin picks a new picture for design A or B */
  function changePicture(id: "a" | "b"): void {
    const input = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp" }) as HTMLInputElement;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      busy = true; render();
      void uploadDesign(id, f).then(() => { toast("The picture is changed."); return loadPictures(); }, (err) => toast((err as Error).message, "err")).finally(() => { busy = false; render(); });
    };
    input.click();
  }

  function card(d: (typeof TSHIRT_DESIGNS)[number]): HTMLElement {
    const on = v.design === d.id;
    const pic = pics[d.id];
    const admin = me.isAdmin && d.id !== "me";
    return h("div", { class: "tshirt-card" + (on ? " on" : ""), onclick: () => { v.design = d.id; render(); } },
      pic ? h("img", { class: "tshirt-pic", src: pic, alt: d.name }) : h("div", { class: "tshirt-pic loading" }, "…"),
      h("div", { class: "sixty-name" }, d.name),
      h("div", { class: "hint" }, d.hint),
      admin ? h("div", { class: "tshirt-admin" },
        h("button", { class: "btn small", disabled: busy, onclick: (e: Event) => { e.stopPropagation(); changePicture(d.id as "a" | "b"); } }, "Change picture"),
        h("button", { class: "btn small", disabled: busy, onclick: (e: Event) => { e.stopPropagation(); busy = true; render(); void resetDesign(d.id as "a" | "b").then(() => { toast("The original picture is back."); return loadPictures(); }, (err) => toast((err as Error).message, "err")).finally(() => { busy = false; render(); }); } }, "Original")) : null);
  }

  function render(): void {
    if (closed) return;
    const sizes = h("div", { class: "tshirt-sizes" }, ...TSHIRT_SIZES.map((s) => h("button", { class: "btn small" + (v.size === s ? " primary" : ""), type: "button", disabled: busy, onclick: () => { v.size = s; render(); } }, s)));
    body.replaceChildren(
      h("div", { class: "hint" }, "Pre-order the real t-shirt, for players at the event only. It is posted to you. Pick a design:"),
      h("div", { class: "tshirt-cards" }, ...TSHIRT_DESIGNS.map(card)),
      h("div", { class: "tshirt-form" },
        field("name", "Full name", "Your name, as on the parcel", "name"),
        field("street", "Street and number", "Street 12, 2. th", "address-line1"),
        h("div", { class: "tshirt-row" }, field("zip", "Postcode", "2100", "postal-code"), field("city", "City", "København", "address-level2")),
        field("country", "Country", "Danmark", "country-name"),
        h("div", { class: "hint" }, "Size"),
        sizes),
      h("button", { class: "btn small primary tshirt-go", disabled: busy, onclick: () => void buy() }, busy ? "…" : `Pre-order · ${kr(TSHIRT_PRICE_ORE)}`),
      h("div", { class: "hint" }, "You pay on a payment page. Your name and address are only used to send the shirt."));
  }
  render();
  void loadPictures();

  function close(): void {
    if (closed) return;
    closed = true;
    el.remove();
    onClose();
  }
  return { close };
}

// ---- the admin's list of orders -------------------------------------------------------------------------------------
interface OrderRow extends TshirtOrder { uid: string; playerName?: string; status: string; at: number; amount: number; figure?: string }

/** The admin: every t-shirt order (design, who, size, where to post it, paid or not), a picture to print for the own-character ones, and a button that copies them as a table for a spreadsheet. */
export function openTshirtOrders(host: HTMLElement, onClose: () => void): TshirtShopApi {
  const list = h("div", { class: "sixty-body" }, h("div", { class: "hint" }, "Loading…"));
  const el = h("div", { class: "cd-popup sixty-shop tshirt-shop", role: "dialog", "aria-label": "T-shirt orders" },
    h("div", { class: "cd-head" }, h("strong", {}, "📦 T-shirt orders"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    list);
  host.append(el);
  let closed = false;

  async function savePrint(r: OrderRow & { id: string }): Promise<void> {
    const c = await printFile(r.figure ?? "", r.playerName ?? "");
    if (!c) { toast("Couldn't draw that character.", "err"); return; }
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `tshirt-${r.playerName ?? "player"}-${r.id.slice(-6)}.png`;
    a.click();
  }

  void get(ref(db, "tshirtOrders")).then((s) => {
    if (closed) return;
    const rows = Object.entries((s.val() ?? {}) as Record<string, OrderRow>).map(([id, r]) => ({ id, ...r })).sort((a, b) => a.at - b.at);
    const paid = rows.filter((r) => r.status === "paid" || r.status === "ordered");
    const csv = ["player;design;name;street;zip;city;country;size;status"].concat(rows.map((r) => [r.playerName ?? "", designLabel(r.design), r.name, r.street, r.zip, r.city, r.country, r.size, r.status].map((x) => String(x).replace(/;/g, ",")).join(";"))).join("\n");
    list.replaceChildren(
      h("div", { class: "hint" }, `${paid.length} paid, ${rows.length - paid.length} not paid (yet).`),
      h("button", { class: "btn small primary", onclick: () => { void navigator.clipboard?.writeText(csv).then(() => toast("Copied: paste it into a spreadsheet."), () => toast("Couldn't copy.", "err")); } }, "Copy as a table"),
      ...rows.map((r) => h("div", { class: "ducky-card" + (r.status === "paid" || r.status === "ordered" ? "" : " owned") },
        h("div", { class: "sixty-name" }, `${r.name} · ${r.size}`),
        h("div", { class: "hint" }, `${designLabel(r.design)} · ${r.street}, ${r.zip} ${r.city}, ${r.country}`),
        h("div", { class: "hint" }, `${r.playerName ?? "?"} · ${r.status}`),
        r.design === "me" && r.figure ? h("button", { class: "btn small", onclick: () => void savePrint(r) }, "Save the character to print") : null)),
      ...(rows.length ? [] : [h("div", { class: "hint" }, "No orders yet.")]));
  }, (err) => { if (!closed) list.replaceChildren(h("div", { class: "hint" }, (err as Error).message || "Couldn't load the orders.")); });
  function close(): void {
    if (closed) return;
    closed = true;
    el.remove();
    onClose();
  }
  return { close };
}
