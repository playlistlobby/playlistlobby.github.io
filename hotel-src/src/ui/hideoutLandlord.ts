import { h, toast } from "./dom";
import { hideoutBuy, hideoutColors, hideoutUpgrade } from "../hideout";
import { defFromMeta, RoomMeta, RoomTheme, watchMeta, RUG_COLORS, WALL_COLORS } from "../rooms";
import { HIDEOUT_PRICE, HIDEOUT_RECOLOR_PRICE, HIDEOUT_SIZES, HIDEOUT_UPGRADE_PRICES, hideoutRoomId, levelOfSize } from "../shared/hideout";
import { lighterHex } from "../shared/economy";
import { ensureFurniSprites, ensureTextures, renderRoomPreview } from "../roomRender";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";
import type { Unsubscribe } from "firebase/database";

const FLOOR_TINTS = ["#6f6a63", "#8d7a5f", "#a99a6a", "#a2713f", "#7a4a3a", "#5d6b78", "#3d3d4a", "#2b2b2b", "#5f7d4a", "#b86a7c", "#3f7fa6", "#c8c8c8"];
const WALL_TINTS = [...WALL_COLORS, "#8b9096", "#4a5360", "#6b3a3a", "#2f4a3a", "#d8c24a"];
const RUG_TINTS = [...RUG_COLORS, "#7a2f2f", "#e8e0cf", "#c97a2b", "#2f8a8a", "#a8324e"];
interface Draft { floor?: string; wall?: string; rug?: string }

export interface HideoutLandlordPanel { el: HTMLElement; dispose(): void }

/**
 * The landlord's menu for a hideout: buy one (1000), the two size upgrades (2000, 4000) and new colours (15 times a player room's price).
 * It is the content of the landlord's window at the hideout door and of the "Landlord" page on the hideout's computer.
 */
export function hideoutLandlordPanel(ctx: Ctx, onChange: () => void): HideoutLandlordPanel {
  const me = ctx.profile;
  const roomId = hideoutRoomId(me.uid);
  let disposed = false;
  let meta: RoomMeta | null | undefined;
  let draft: Draft = {};
  let busy = false;
  const el = h("div", { class: "landlord-body" });
  let off: Unsubscribe = () => undefined;

  const sameHex = (a: string | undefined, b: string | undefined) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
  const current = (): RoomTheme => defFromMeta(roomId, meta!).theme;
  const changes = (): Draft => {
    const t = current(), d: Draft = {};
    if (draft.floor !== undefined && (!sameHex(draft.floor, t.floorA) || t.floorTex)) d.floor = draft.floor;
    if (draft.wall !== undefined && (!sameHex(draft.wall, t.wall) || t.wallTex)) d.wall = draft.wall;
    if (draft.rug === "none" ? t.rug : draft.rug !== undefined && (!t.rug || !sameHex(draft.rug, t.rugColor))) d.rug = draft.rug;
    return d;
  };
  const cost = (): number => Object.keys(changes()).length * HIDEOUT_RECOLOR_PRICE;

  function preview(): HTMLElement {
    const theme: RoomTheme = { ...current() };
    if (draft.floor !== undefined) { theme.floorA = draft.floor; theme.floorB = lighterHex(draft.floor); theme.floorTex = undefined; }
    if (draft.wall !== undefined) { theme.wall = draft.wall; theme.wallTex = undefined; }
    if (draft.rug !== undefined) { theme.rug = draft.rug !== "none"; if (draft.rug !== "none") theme.rugColor = draft.rug; }
    const def = defFromMeta(roomId, { ...meta!, theme });
    const box = h("div", { class: "ll-preview" }, renderRoomPreview(def, 236));
    const again = () => { if (!disposed) box.replaceChildren(renderRoomPreview(def, 236)); };
    void Promise.all([ensureTextures(theme), ensureFurniSprites(def)]).then(again, again);
    return box;
  }
  function swatches(colors: string[], shown: string | undefined, pick: (c: string) => void, extra?: HTMLElement): HTMLElement {
    const custom = h("input", { type: "color", class: "tint-picker", title: "Any colour", value: shown && /^#[0-9a-f]{6}$/i.test(shown) ? shown : "#888888" }) as HTMLInputElement;
    custom.addEventListener("change", () => pick(custom.value));
    return h("div", { class: "rp-chips" }, ...(extra ? [extra] : []), ...colors.map((c) => h("button", { class: "chip swatch2" + (sameHex(shown, c) ? " on" : ""), style: { background: c }, title: c, onclick: () => pick(c) })), custom);
  }
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
        h("div", { class: "hint" }, `A shared room three times the size of yours (${HIDEOUT_SIZES[0]} × ${HIDEOUT_SIZES[0]}) for you and your gang. You invite the members, you decide who may build, and everybody can use its pots, mixers and sink. It comes with a computer, a toolbox, a sink and a boombox.`),
        h("div", { class: "row center" }, h("button", { class: "btn primary", disabled: me.blood < HIDEOUT_PRICE || busy, onclick: () => void run(async () => { await hideoutBuy(me); return "It's yours. Take the door at the end of the basement."; }) }, `Buy a hideout (${HIDEOUT_PRICE} drops)`)),
        me.blood < HIDEOUT_PRICE ? h("div", { class: "hint" }, `You need ${HIDEOUT_PRICE - me.blood} more drops.`) : h("div", {}));
      return;
    }
    const t = current();
    const level = typeof meta.level === "number" ? meta.level : levelOfSize(Number(meta.w) || 14);
    const size = HIDEOUT_SIZES[Math.min(level, HIDEOUT_SIZES.length - 1)];
    const price = cost();
    const shownRug = draft.rug !== undefined ? (draft.rug === "none" ? undefined : draft.rug) : t.rug ? t.rugColor : undefined;
    const noRug = draft.rug !== undefined ? draft.rug === "none" : !t.rug;
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
      h("div", { class: "ll-label" }, `Colours · ${HIDEOUT_RECOLOR_PRICE} drops for each part you change`),
      preview(),
      h("div", { class: "ll-part" }, "Floor"),
      swatches(FLOOR_TINTS, draft.floor ?? (t.floorTex ? undefined : t.floorA), (c) => { draft.floor = c; render(); }),
      h("div", { class: "ll-part" }, "Walls"),
      swatches(WALL_TINTS, draft.wall ?? (t.wallTex ? undefined : t.wall), (c) => { draft.wall = c; render(); }),
      h("div", { class: "ll-part" }, "Carpet"),
      swatches(RUG_TINTS, shownRug, (c) => { draft.rug = c; render(); }, h("button", { class: "chip" + (noRug ? " on" : ""), onclick: () => { draft.rug = "none"; render(); } }, "None")),
      h("div", { class: "row center" },
        h("button", { class: "btn primary", disabled: price === 0 || me.blood < price || busy, onclick: () => void run(async () => { const d = changes(); const r = await hideoutColors(me, d); draft = {}; return `New colours. That was ${r.price} drops.`; }) }, price === 0 ? "Pick a colour to preview" : `Apply (${price} drops)`),
        ...(Object.keys(draft).length ? [h("button", { class: "btn small", onclick: () => { draft = {}; render(); } }, "Reset")] : [])),
      price > me.blood ? h("div", { class: "hint" }, "You don't have enough drops for that.") : h("div", { class: "hint" }, "Tap colours to see them in the picture. Nothing is paid until you press Apply."));
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
