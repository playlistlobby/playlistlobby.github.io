import { h, toast } from "./dom";
import { buyRecordCd } from "../db";
import { startPayment } from "../api";
import { BLOOD_ICON, itemDef } from "../items";
import { itemEntry, onShopConfig } from "../shopConfig";
import { ALBUM_CD, ALBUM_PRICE_ORE, cdOwnedKey, MYSTERY_CDS, MYSTERY_PRICE_ORE } from "../shared/cds";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface RecordShopApi {
  close(): void;
}

/** øre -> "1 kr" / "2,50 kr" */
const kr = (ore: number): string => `${(ore / 100).toLocaleString("da-DK", { minimumFractionDigits: ore % 100 ? 2 : 0 })} kr`;

/** The record player on the counter in the shop room: the Freakme CD for blood, and the mystery CD and the full album for real money. */
export function openRecordShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): RecordShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "Record player" },
    h("div", { class: "cd-head" }, h("strong", {}, "💿 Record player"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let paying = false;

  /** sends the player to the payment page (they come back to the game afterwards and the CD is handed over) */
  async function pay(product: "mystery" | "album"): Promise<void> {
    if (paying) return;
    paying = true;
    render();
    try {
      const url = await startPayment(product);
      logAction(me, "buy", `went to pay for the ${product === "album" ? "full album" : "mystery CD"}`);
      window.location.assign(url);
    } catch (err) {
      toast((err as Error).message, "err");
      paying = false;
      render();
    }
  }

  function render(): void {
    if (closed) return;
    const mysteryHave = MYSTERY_CDS.filter((i) => me.owned[cdOwnedKey(i)]).length;
    const soldOut = mysteryHave >= MYSTERY_CDS.length;
    const haveAlbum = !!me.owned[cdOwnedKey(ALBUM_CD)];
    const haveFreak = !!me.owned.item_cd;
    const freakPrice = itemEntry("cd").price;
    const freak = itemDef("cd")!;
    const row = (icon: string, name: string, hint: string, button: HTMLElement, extra = ""): HTMLElement =>
      h("div", { class: "sixty-row" }, h("img", { src: icon, alt: "", class: "sixty-ico" }), h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, name, extra), h("div", { class: "hint" }, hint)), button);
    const mysteryBtn = soldOut
      ? h("button", { class: "btn small", disabled: true }, "Sold out")
      : h("button", { class: "btn small primary", disabled: paying, onclick: () => void pay("mystery") }, paying ? "…" : kr(MYSTERY_PRICE_ORE));
    const albumBtn = haveAlbum
      ? h("button", { class: "btn small", disabled: true }, "Owned")
      : h("button", { class: "btn small primary", disabled: paying, onclick: () => void pay("album") }, paying ? "…" : kr(ALBUM_PRICE_ORE));
    const freakBtn = haveFreak
      ? h("button", { class: "btn small", disabled: true, title: "You already bought your CD." }, "Owned")
      : h("button", {
          class: "btn small primary",
          disabled: me.blood < freakPrice,
          title: me.blood < freakPrice ? `You need ${freakPrice - me.blood} more drops` : "",
          onclick: async () => {
            try {
              await buyRecordCd(me);
              ctx.refreshHeader();
              logAction(me, "buy", `bought the Freakme CD for ${freakPrice}`);
              playSfx("coins", 0.5);
              toast("The CD was added to your inventory.");
              onChange();
              render();
            } catch (err) { toast((err as Error).message, "err"); }
          },
        }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${freakPrice}`);
    body.replaceChildren(
      row(freak.icon, "Freakme", "One song, for blood. One per player.", freakBtn),
      row(itemDef(MYSTERY_CDS[0])!.icon, "Mystery CD", soldOut ? "You have all three. There are none left." : "A CD with one of three songs. You never get the same one twice. Real money.", mysteryBtn, ` ${mysteryHave}/${MYSTERY_CDS.length}`),
      row(itemDef(ALBUM_CD)!.icon, "Full album", haveAlbum ? "It's in your pocket (or in a player)." : "A red CD with the whole album. Skip and go back from song to song. Real money.", albumBtn),
      h("div", { class: "hint" }, "Real money is paid on a payment page, and you come back to the game afterwards."));
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
