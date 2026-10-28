import { h, toast } from "./dom";
import { itemDef } from "../items";
import { pressedTitle } from "../cdTitles";
import { CD_ITEMS, isCdItem, JUKEBOX_PRICE, parsePressedCd } from "../shared/cds";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface JukeboxApi {
  close(): void;
  refresh(): void;
}

/** the name of a CD in a pocket: a pressed CD is named after its song, the rest after what is on them */
function cdName(item: string): string {
  const pressed = parsePressedCd(item);
  if (pressed) return pressedTitle(pressed.song) ?? "Pressed CD";
  return CD_ITEMS[item]?.title ?? itemDef(item)?.name ?? "CD";
}

/**
 * The basement's jukebox, in the game's iOS 6 look: a navigation bar, a "now playing" strip and a grouped list of the CDs in your pockets. Tap one and an iOS alert asks
 * whether to play it for 50 blood; the whole room then hears it (the CD player of the room: one CD at a time) and the CD is yours again when it has finished.
 */
export function openJukebox(host: HTMLElement, ctx: Ctx, o: { nowPlaying: () => string | null; play: (slot: number) => Promise<void>; onClose: () => void; volume: { get: () => number; set: (v: number) => void; muted: () => boolean; toggleMute: () => void } }): JukeboxApi {
  const me = ctx.profile;
  let closed = false;
  let busy = false;
  let alertEl: HTMLElement | null = null;
  const bloodPill = h("span", { class: "jb-blood" }, "");
  // your own volume: everybody in the room hears the same song, only how loud it is for you is yours
  const slider = h("input", { class: "jb-slider", type: "range", min: "0", max: "100", step: "1", "aria-label": "Volume", oninput: () => { o.volume.set(Number(slider.value) / 100); render(); } });
  const muteBtn = h("button", { class: "jb-mute", type: "button", title: "Mute", onclick: () => { o.volume.toggleMute(); render(); } }, "");
  const volRow = h("div", { class: "jb-vol" }, h("span", { class: "jb-vol-label" }, "Volume"), slider, muteBtn);
  const now = h("div", { class: "jb-now" });
  const list = h("div", { class: "jb-list" });
  const onPocket = (): void => render();
  window.addEventListener("pocket-changed", onPocket);
  const el = h("div", { class: "jb-overlay", onclick: (e: Event) => { if (e.target === el && !alertEl) close(); } },
    h("div", { class: "jb-win", role: "dialog", "aria-label": "Jukebox" },
      h("div", { class: "jb-bar" },
        h("button", { class: "jb-barbtn", type: "button", onclick: () => close() }, "Done"),
        h("div", { class: "jb-title" }, "Jukebox"),
        bloodPill),
      now,
      volRow,
      h("div", { class: "jb-body" },
        h("div", { class: "jb-head" }, "Your CDs"),
        list,
        h("div", { class: "jb-foot" }, `Pick a CD and pay ${JUKEBOX_PRICE} blood to play it for everybody in the room. It comes back to your pocket when it has finished.`))));
  host.append(el);

  const closeAlert = (): void => { alertEl?.remove(); alertEl = null; };
  function ask(slot: number, name: string): void {
    closeAlert();
    const canPay = me.blood >= JUKEBOX_PRICE;
    const go = h("button", { class: "jb-alert-btn primary", type: "button", disabled: !canPay || busy, onclick: () => void doPlay(slot) }, `Play · ${JUKEBOX_PRICE} blood`);
    alertEl = h("div", { class: "jb-alert-wrap", onclick: (e: Event) => { if (e.target === alertEl) closeAlert(); } },
      h("div", { class: "jb-alert", role: "alertdialog" },
        h("div", { class: "jb-alert-title" }, `Play “${name}”?`),
        h("div", { class: "jb-alert-text" }, canPay ? `It costs ${JUKEBOX_PRICE} blood. Everybody in the room hears it.` : `You need ${JUKEBOX_PRICE - me.blood} more blood.`),
        h("div", { class: "jb-alert-btns" }, h("button", { class: "jb-alert-btn", type: "button", onclick: closeAlert }, "Cancel"), go)));
    el.append(alertEl);
  }
  async function doPlay(slot: number): Promise<void> {
    if (busy) return;
    busy = true;
    try { await o.play(slot); playSfx("coins", 0.5); closeAlert(); } catch (err) { toast((err as Error).message || "The jukebox doesn't take it.", "err"); closeAlert(); }
    busy = false;
    render();
  }

  function render(): void {
    if (closed) return;
    bloodPill.textContent = `${me.blood} blood`;
    const muted = o.volume.muted();
    if (document.activeElement !== slider) slider.value = String(Math.round(o.volume.get() * 100));
    muteBtn.textContent = muted || o.volume.get() === 0 ? "🔇" : "🔊";
    const playing = o.nowPlaying();
    now.className = "jb-now" + (playing ? " on" : "");
    now.replaceChildren(h("span", { class: "jb-note" }, "♪"), h("span", { class: "jb-now-text" }, playing ? `Now playing: ${playing}` : "Nothing is playing"));
    const cds = me.inventory.map((s, slot) => ({ s, slot })).filter((e): e is { s: NonNullable<typeof e.s>; slot: number } => !!e.s && isCdItem(e.s.item) && !e.s.inPlayer);
    list.replaceChildren(...(cds.length
      ? cds.map(({ s, slot }) => {
        const name = cdName(s.item);
        const icon = itemDef(s.item)?.icon;
        return h("button", { class: "jb-row", type: "button", disabled: !!playing || busy, onclick: () => ask(slot, name) },
          icon ? h("img", { class: "jb-ico", src: icon, alt: "" }) : h("span", { class: "jb-ico" }, "💿"),
          h("span", { class: "jb-row-main" }, h("span", { class: "jb-row-name" }, name), h("span", { class: "jb-row-sub" }, playing ? "Wait until the song has finished" : `${JUKEBOX_PRICE} blood`)),
          h("span", { class: "jb-chev" }, "›"));
      })
      : [h("div", { class: "jb-empty" }, "You have no CD with you. The record shop sells them.")]));
  }
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    window.removeEventListener("pocket-changed", onPocket);
    el.remove();
    o.onClose();
  }
  return { close, refresh: render };
}
