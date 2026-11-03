import { h, toast } from "./dom";
import { buyRecordCd, buyWalkman } from "../db";
import { buyBeatShop } from "../beats";
import { BLOOD_ICON, furniIcon, itemDef } from "../items";
import { itemEntry, onShopConfig } from "../shopConfig";
import { cdOwnedKey } from "../shared/cds";
import { BEATSHOP_OWNED_KEY, BEATSHOP_PRICE } from "../shared/beats";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface RecordShopApi {
  close(): void;
}

/** The record player on the counter in the shop room: the songs and the walkman for blood (the Freakme CD and the mystery CD are no longer sold). */
export function openRecordShop(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): RecordShopApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "Record player" },
    h("div", { class: "cd-head" }, h("strong", {}, "💿 Record player"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;

  function render(): void {
    if (closed) return;
    const row = (icon: string, name: string, hint: string, button: HTMLElement, extra = ""): HTMLElement =>
      h("div", { class: "sixty-row" }, h("img", { src: icon, alt: "", class: "sixty-ico" }), h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, name, extra), h("div", { class: "hint" }, hint)), button);
    // the songs that cost blood: one of each per player (the same button for each)
    const bloodCd = (id: string, label: string): HTMLElement => {
      const price = itemEntry(id).price;
      const have = !!me.owned[cdOwnedKey(id)];
      const btn = have
        ? h("button", { class: "btn small", disabled: true, title: "You already bought that CD." }, "Owned")
        : h("button", {
            class: "btn small primary",
            disabled: me.blood < price,
            title: me.blood < price ? `You need ${price - me.blood} more drops` : "",
            onclick: async () => {
              try {
                await buyRecordCd(me, id);
                ctx.refreshHeader();
                logAction(me, "buy", `bought the ${label} CD for ${price}`);
                playSfx("coins", 0.5);
                toast("The CD was added to your inventory.");
                onChange();
                render();
              } catch (err) { toast((err as Error).message, "err"); }
            },
          }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`);
      return row(itemDef(id)!.icon, label, "One song, for blood. One per player.", btn);
    };
    // the BeatShop machine: a vending machine to sell beats in (one per player)
    const haveShop = !!me.owned[BEATSHOP_OWNED_KEY];
    const shopBtn = haveShop
      ? h("button", { class: "btn small", disabled: true, title: "You have one already." }, "Owned")
      : h("button", {
          class: "btn small primary",
          disabled: me.blood < BEATSHOP_PRICE,
          title: me.blood < BEATSHOP_PRICE ? `You need ${BEATSHOP_PRICE - me.blood} more drops` : "",
          onclick: async () => {
            try {
              await buyBeatShop(me);
              ctx.refreshHeader();
              logAction(me, "buy", `bought the BeatShop for ${BEATSHOP_PRICE}`);
              playSfx("coins", 0.5);
              toast("The BeatShop is in your pocket. Put it in your room and sell your beats.");
              onChange();
              render();
            } catch (err) { toast((err as Error).message, "err"); }
          },
        }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${BEATSHOP_PRICE}`);
    // the walkman: a portable CD player (one in the pocket at a time)
    const haveWalk = me.inventory.some((x) => x?.item === "walkman");
    const walkPrice = 20;
    const walkBtn = haveWalk
      ? h("button", { class: "btn small", disabled: true, title: "You have one already." }, "Owned")
      : h("button", {
          class: "btn small primary",
          disabled: me.blood < walkPrice,
          title: me.blood < walkPrice ? `You need ${walkPrice - me.blood} more drops` : "",
          onclick: async () => {
            try {
              await buyWalkman(me);
              ctx.refreshHeader();
              logAction(me, "buy", `bought a walkman for ${walkPrice}`);
              playSfx("coins", 0.5);
              toast("The walkman is in your pocket. Tap it to put a CD in.");
              onChange();
              render();
            } catch (err) { toast((err as Error).message, "err"); }
          },
        }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${walkPrice}`);
    body.replaceChildren(
      bloodCd("cd_ogep", "OG Community EP"),
      row(itemDef("walkman")!.icon, "Walkman", "A portable CD player: music wherever you go, only you hear it. One CD at a time.", walkBtn),
      row(furniIcon("f_beatshop"), "BeatShop", "A machine to sell your beats in. Put it in your room. One per player.", shopBtn),
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
