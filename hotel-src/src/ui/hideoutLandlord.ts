import { h, toast } from "./dom";
import { hideoutBuy, hideoutUpgrade } from "../hideout";
import { RoomMeta, watchMeta } from "../rooms";
import { HIDEOUT_PRICE, HIDEOUT_SIZES, HIDEOUT_UPGRADE_PRICES, hideoutRoomId, levelOfSize } from "../shared/hideout";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";
import type { Unsubscribe } from "firebase/database";

export interface HideoutLandlordPanel { el: HTMLElement; dispose(): void }

/**
 * The landlord's menu for a hideout: buy one and the two size upgrades (the hideouts have their own textures, so no paint or carpets are sold any more).
 * It is the content of the landlord's window at the hideout door.
 */
export function hideoutLandlordPanel(ctx: Ctx, onChange: () => void): HideoutLandlordPanel {
  const me = ctx.profile;
  const roomId = hideoutRoomId(me.uid);
  let disposed = false;
  let meta: RoomMeta | null | undefined;
  let busy = false;
  const el = h("div", { class: "landlord-body" });
  let off: Unsubscribe = () => undefined;

  const run = async (what: () => Promise<string>): Promise<void> => {
    busy = true; render();
    try { const msg = await what(); playSfx("give", 0.5); toast(msg); onChange(); } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
    busy = false; render();
  };

  function render(): void {
    if (disposed || meta === undefined) return;
    const scrolled = el.parentElement?.scrollTop ?? 0;
    if (!meta) { // no hideout yet: for sale
      el.replaceChildren(
        h("div", { class: "ll-label" }, "A hideout of your own"),
        h("div", { class: "hint" }, "A hideout/group room."),
        h("div", { class: "row center" }, h("button", { class: "btn primary", disabled: me.blood < HIDEOUT_PRICE || busy, onclick: () => void run(async () => { await hideoutBuy(me); return "It's yours. Take the door at the end of the basement."; }) }, `Buy a hideout (${HIDEOUT_PRICE} drops)`)),
        me.blood < HIDEOUT_PRICE ? h("div", { class: "hint" }, `You need ${HIDEOUT_PRICE - me.blood} more drops.`) : h("div", {}));
      return;
    }
    const level = typeof meta.level === "number" ? meta.level : levelOfSize(Number(meta.w) || 14);
    const size = HIDEOUT_SIZES[Math.min(level, HIDEOUT_SIZES.length - 1)];
    el.replaceChildren(
      h("div", { class: "hint" }, `Your hideout is ${size} × ${size}.`),
      h("div", { class: "ll-label" }, "Bigger hideout"),
      ...HIDEOUT_UPGRADE_PRICES.map((p, i) => {
        const owned = level > i, next = level === i, s = HIDEOUT_SIZES[i + 1];
        return h("div", { class: "ll-row" + (owned ? " owned" : "") },
          h("span", { class: "ll-name" }, `${s} × ${s} hideout`),
          owned ? h("span", { class: "ll-done" }, "✓ bought")
            : h("button", { class: "btn small" + (next ? " primary" : ""), disabled: !next || me.blood < p || busy, title: next ? "" : "Buy the smaller one first", onclick: () => void run(async () => { const r = await hideoutUpgrade(me); return `Your hideout is now ${r.size} × ${r.size}.`; }) }, `${p} drops`));
      }),
    );
    if (el.parentElement) el.parentElement.scrollTop = scrolled;
  }
  off = watchMeta(roomId, (m) => { meta = m; render(); }); // (after everything render() uses is defined: a cached answer comes at once)
  // follows what you spend elsewhere
  let shown = "";
  const tick = window.setInterval(() => { const k = String(me.blood); if (k !== shown && !el.contains(document.activeElement)) { shown = k; render(); } }, 1500);
  return { el, dispose() { disposed = true; off(); window.clearInterval(tick); } };
}

/** The landlord at the hideout door: his window (the same menu as on the hideout's computer). */
export function openHideoutLandlord(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): { close(): void } {
  let closed = false;
  const panel = hideoutLandlordPanel(ctx, onChange);
  const el = h("div", { class: "cd-popup landlord", role: "dialog", "aria-label": "Landlord" },
    h("div", { class: "cd-head" }, h("strong", {}, "Landlord"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    panel.el);
  host.append(el);
  function close(): void { if (closed) return; closed = true; panel.dispose(); el.remove(); onClose(); }
  return { close };
}
