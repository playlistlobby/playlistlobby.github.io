import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { call } from "../db";
import { assetUrl } from "../assetUrl";
import { h, toast } from "./dom";
import { BLOOD_ICON, itemDef } from "../items";
import { playSfx } from "../sfx";
import { logAction } from "../logger";
import { watchSongs } from "../soundcloud";
import { rememberPressedTitle } from "../cdTitles";
import { fmtDur } from "../shared/audio";
import { rankedSongs } from "../shared/songs";
import type { Song } from "../shared/songs";
import { PRESS_COLOURS, PRESS_PRICE_DEFAULT, PRESS_PRICE_MAX, PRESS_PRICE_MIN, pressedCdId } from "../shared/cds";
import type { RoomDef } from "../rooms";
import type { Ctx } from "../main";

export interface CdPressApi { close(): void }

/**
 * The CD printer of a hideout: any song on SoundCloud and a colour, and a CD with that song comes out. The owner and the members press for free,
 * everybody else pays the owner's price (10-100 blood, it goes to the owner's Tables page).
 */
export function openCdPress(host: HTMLElement, ctx: Ctx, roomId: string, getDef: () => RoomDef, onChange: () => void, onClose: () => void): CdPressApi {
  const me = ctx.profile;
  let songs: Song[] = [];
  let pick: string | null = null;
  let colour = "r";
  let price = PRESS_PRICE_DEFAULT;
  let myPrice = PRESS_PRICE_DEFAULT;
  let busy = false;
  let closed = false;
  const isOwner = (): boolean => getDef().ownerUid === me.uid || me.isAdmin;
  const free = (): boolean => isOwner() || !!getDef().hideout?.members?.[me.uid];

  const body = h("div", { class: "sixty-body cdp" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "CD printer" },
    h("div", { class: "cd-head" }, h("strong", {}, "CD printer"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);

  async function press(): Promise<void> {
    if (!pick || busy) return;
    const s = songs.find((x) => x.id === pick);
    busy = true; render();
    try {
      const r = await call<{ item: string; price: number; left: number }>(me, "cdPress", { room: roomId, song: pick, colour });
      if (s) rememberPressedTitle(s.id, s.title, s.ownerName);
      ctx.refreshHeader();
      playSfx(r.price ? "coins" : "give", 0.5);
      logAction(me, "buy", `pressed a CD${r.price ? ` for ${r.price}` : ""}`);
      toast(`The CD is in your pocket. You can press ${r.left} more today.`);
      onChange();
    } catch (err) { toast((err as Error).message || "The printer jams.", "err"); }
    busy = false; render();
  }
  async function setPrice(): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { await call(me, "cdPressPrice", { room: roomId, price: myPrice }); toast("The price is set."); } catch (err) { toast((err as Error).message, "err"); }
    busy = false; render();
  }

  function render(): void {
    if (closed) return;
    const top = rankedSongs(songs);
    if (pick && !top.some((s) => s.id === pick)) pick = null;
    const rows = top.length ? top.map((s, i) => h("button", { class: "cdp-song" + (pick === s.id ? " on" : ""), type: "button", onclick: () => { pick = s.id; render(); } },
      h("span", { class: "cdp-rank" }, String(i + 1)),
      h("span", { class: "cdp-main" }, h("b", {}, s.title), h("small", {}, `${s.ownerName} · ${fmtDur(s.durMs)}`)),
      h("span", { class: "cdp-votes" }, `${s.up} / ${s.down}`))) : [h("div", { class: "hint" }, "There are no songs on SoundCloud yet.")];
    const swatches = PRESS_COLOURS.map((c) => h("button", { class: "cdp-col" + (colour === c.id ? " on" : ""), type: "button", title: c.name, "aria-label": c.name, onclick: () => { colour = c.id; render(); } },
      h("img", { src: assetUrl(`items/${c.file}.png`), alt: "" })));
    const preview = pick ? itemDef(pressedCdId(colour, pick)) : null;
    body.replaceChildren(
      h("div", { class: "hint" }, "Pick any song on SoundCloud (best first) and a colour. The CD plays on any boombox."),
      h("div", { class: "cdp-list" }, ...rows),
      h("div", { class: "cdp-label" }, "Colour"),
      h("div", { class: "cdp-cols" }, ...swatches),
      h("div", { class: "cdp-bottom" },
        h("div", { class: "cdp-price" }, free() ? "Free for you" : h("span", {}, "Price: ", h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`)),
        h("button", { class: "btn primary", disabled: !pick || busy || (!free() && me.blood < price), onclick: () => void press() }, busy ? "Pressing" : "Press a CD")),
      ...(preview ? [h("div", { class: "hint" }, preview.name)] : []),
      ...(isOwner() ? [h("div", { class: "cdp-owner" },
        h("div", { class: "cdp-label" }, "Price for visitors"),
        h("div", { class: "cdp-row" },
          h("button", { class: "btn small", disabled: busy || myPrice <= PRESS_PRICE_MIN, onclick: () => { myPrice = Math.max(PRESS_PRICE_MIN, myPrice - 5); render(); } }, "-"),
          h("span", { class: "cdp-num" }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${myPrice}`),
          h("button", { class: "btn small", disabled: busy || myPrice >= PRESS_PRICE_MAX, onclick: () => { myPrice = Math.min(PRESS_PRICE_MAX, myPrice + 5); render(); } }, "+"),
          h("button", { class: "btn small primary", disabled: busy || myPrice === price, onclick: () => void setPrice() }, "Set")),
        h("div", { class: "hint" }, `Between ${PRESS_PRICE_MIN} and ${PRESS_PRICE_MAX}. You and the members press for free. What visitors pay is on your Tables page.`))] : []));
  }

  const stops = [
    watchSongs((l) => { songs = l; render(); }),
    onValue(ref(db, `roomsMeta/${roomId}/cdPrice`), (s) => {
      const v = Number(s.val());
      price = Number.isInteger(v) && v >= PRESS_PRICE_MIN && v <= PRESS_PRICE_MAX ? v : PRESS_PRICE_DEFAULT;
      myPrice = price;
      render();
    }, () => undefined),
  ];
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    stops.forEach((s) => s());
    el.remove();
    onClose();
  }
  return { close };
}
