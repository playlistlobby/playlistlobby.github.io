import { h, toast } from "./dom";
import { buyRoomColors, buyRoomSkins, buyRoomUpgrade } from "../db";
import { defFromMeta, ownRoomId, RoomMeta, RoomTheme, watchMeta, RUG_COLORS, WALL_COLORS } from "../rooms";
import { BAG_SKINS, BED_SKINS, RoomSkin, skinOf, skinOwnedKey, SkinPart } from "../shared/skins";
import { BASE_ROOM_SIZE, lighterHex, RECOLOR_PRICE, ROOM_UPGRADES } from "../shared/economy";
import { ensureFurniSprites, ensureTextures, renderRoomPreview } from "../roomRender";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";
import type { Unsubscribe } from "firebase/database";

export interface LandlordApi { close(): void }

const FLOOR_TINTS = ["#8d7a5f", "#a99a6a", "#a2713f", "#7a4a3a", "#5d6b78", "#3d3d4a", "#2b2b2b", "#5f7d4a", "#b86a7c", "#3f7fa6", "#d9ccaa", "#c8c8c8"];
const WALL_TINTS = [...WALL_COLORS, "#4a5360", "#6b3a3a", "#2f4a3a", "#d8c24a"];
const RUG_TINTS = [...RUG_COLORS, "#e8e0cf", "#c97a2b", "#2f8a8a", "#a8324e"];

/** What you've picked but not paid for yet. A part that is missing stays as it is. `rug: "none"` takes the carpet away. */
interface Draft { floor?: string; wall?: string; rug?: string }
/** the looks picked for the bed and the bag, not paid for yet ("default" = the plain one) */
interface SkinDraft { bed?: string; bag?: string }

/** The landlord's window (shop room): bigger room upgrades, and new colours for your own room's floor, walls and carpet (a preview first, then 2 drops for each part you change). */
export function openLandlord(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): LandlordApi {
  const me = ctx.profile;
  const roomId = ownRoomId(me.uid);
  let closed = false;
  let meta: RoomMeta | null = null;
  let draft: Draft = {};
  let skinDraft: SkinDraft = {};
  let tab: "room" | "style" = "room";
  let busy = false;
  let shownKey = "";
  const body = h("div", { class: "landlord-body" });
  const el = h("div", { class: "cd-popup landlord", role: "dialog", "aria-label": "Landlord" },
    h("div", { class: "cd-head" }, h("strong", {}, "Landlord"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  const off: Unsubscribe = watchMeta(roomId, (m) => { meta = m; render(); });

  const baseMeta = (): RoomMeta => meta ?? { owner: me.uid, ownerName: me.name, name: "", access: "knock", w: BASE_ROOM_SIZE, h: BASE_ROOM_SIZE };
  /** the colours your room has right now (with the defaults the game fills in for older rooms) */
  const current = (): RoomTheme => defFromMeta(roomId, baseMeta()).theme;
  const sameHex = (a: string | undefined, b: string | undefined) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
  /** parts that really differ from your room (a pattern counts: a colour replaces it) */
  const changes = (): Draft => {
    const t = current(), d: Draft = {};
    if (draft.floor !== undefined && (!sameHex(draft.floor, t.floorA) || t.floorTex)) d.floor = draft.floor;
    if (draft.wall !== undefined && (!sameHex(draft.wall, t.wall) || t.wallTex)) d.wall = draft.wall;
    if (draft.rug === "none" ? t.rug : draft.rug !== undefined && (!t.rug || !sameHex(draft.rug, t.rugColor))) d.rug = draft.rug;
    return d;
  };
  const cost = (): number => Object.keys(changes()).length * RECOLOR_PRICE;

  /** the looks your bed and bag have now, and which of the picked ones really are a change */
  const currentSkin = (part: SkinPart): string => baseMeta().skins?.[part] ?? "default";
  const skinChanges = (): SkinDraft => {
    const d: SkinDraft = {};
    for (const part of ["bed", "bag"] as SkinPart[]) if (skinDraft[part] !== undefined && skinDraft[part] !== currentSkin(part)) d[part] = skinDraft[part];
    return d;
  };
  const owns = (part: SkinPart, id: string): boolean => id === "default" || !!me.owned[skinOwnedKey(part, id)];
  /** what the picked looks cost: each one that isn't bought yet, once */
  const skinCost = (): number => (Object.entries(skinChanges()) as Array<[SkinPart, string]>).reduce((n, [part, id]) => n + (owns(part, id) ? 0 : skinOf(part, id)?.price ?? 0), 0);

  /** The room as it would look with the picked colours (the real room is left alone until you pay). */
  function preview(): HTMLElement {
    const theme: RoomTheme = { ...current() };
    if (draft.floor !== undefined) { theme.floorA = draft.floor; theme.floorB = lighterHex(draft.floor); theme.floorTex = undefined; }
    if (draft.wall !== undefined) { theme.wall = draft.wall; theme.wallTex = undefined; }
    if (draft.rug !== undefined) { theme.rug = draft.rug !== "none"; if (draft.rug !== "none") theme.rugColor = draft.rug; }
    const skins = { ...baseMeta().skins };
    for (const [part, id] of Object.entries(skinDraft) as Array<[SkinPart, string]>) { if (id === "default") delete skins[part]; else skins[part] = id; }
    const def = defFromMeta(roomId, { ...baseMeta(), theme, skins });
    const box = h("div", { class: "ll-preview" }, renderRoomPreview(def, 236));
    // textures and the furniture art load in the background: draw again once they're there
    const again = () => { if (!closed) box.replaceChildren(renderRoomPreview(def, 236)); };
    void Promise.all([ensureTextures(theme), ensureFurniSprites(def)]).then(again, again);
    return box;
  }

  function swatches(colors: string[], shown: string | undefined, pick: (c: string) => void, extra?: HTMLElement): HTMLElement {
    const custom = h("input", { type: "color", class: "tint-picker", title: "Any colour", value: shown && /^#[0-9a-f]{6}$/i.test(shown) ? shown : "#888888" }) as HTMLInputElement;
    custom.addEventListener("change", () => pick(custom.value));
    return h("div", { class: "rp-chips" },
      ...(extra ? [extra] : []),
      ...colors.map((c) => h("button", { class: "chip swatch2" + (sameHex(shown, c) ? " on" : ""), style: { background: c }, title: c, onclick: () => pick(c) })),
      custom);
  }

  const pickFloor = (c: string) => { draft.floor = c; render(); };
  const pickWall = (c: string) => { draft.wall = c; render(); };
  const pickRug = (c: string) => { draft.rug = c; render(); };

  /** The "Bed & wardrobe" tab: pick a look for each, see it in the picture, pay once (looks you bought are free to swap back to). */
  function styleContent(): HTMLElement[] {
    const part = (p: SkinPart, label: string, plain: string, list: RoomSkin[]): HTMLElement => {
      const shown = skinDraft[p] ?? currentSkin(p);
      const option = (id: string, name: string, price: number): HTMLElement => h("button", {
        class: "chip ll-skin" + (shown === id ? " on" : ""),
        onclick: () => { skinDraft[p] = id === currentSkin(p) ? undefined : id; render(); },
      }, owns(p, id) ? name : `${name} · ${price}`);
      return h("div", {}, h("div", { class: "ll-part" }, label), h("div", { class: "rp-chips" }, option("default", plain, 0), ...list.map((s) => option(s.id, s.label, s.price))));
    };
    const changed = Object.keys(skinChanges()).length > 0;
    const price = skinCost();
    return [
      h("div", { class: "ll-label" }, "Bed & wardrobe · you pay for a look once"),
      preview(),
      part("bed", "Bed", "Plain bed", BED_SKINS),
      part("bag", "Bag of clothes", "Bag of clothes", BAG_SKINS),
      h("div", { class: "row center" },
        h("button", {
          class: "btn primary", disabled: !changed || me.blood < price || busy,
          onclick: async () => {
            const d = skinChanges();
            busy = true; render();
            try {
              const paid = await buyRoomSkins(me, d);
              playSfx("give", 0.5);
              toast(paid > 0 ? `Done. That was ${paid} drops.` : "Done.");
              skinDraft = {};
              onChange();
            } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
            busy = false; render();
          },
        }, !changed ? "Pick a look to preview" : price > 0 ? `Apply (${price} drops)` : "Apply (free)"),
        ...(Object.keys(skinDraft).length ? [h("button", { class: "btn small", onclick: () => { skinDraft = {}; render(); } }, "Reset")] : [])),
      price > me.blood ? h("div", { class: "hint" }, "You don't have enough drops for that.") : h("div", { class: "hint" }, "A bigger piece moves over if it wouldn't fit where the old one stood."),
    ];
  }

  function render(): void {
    if (closed) return;
    const t = current();
    const level = me.roomLevel;
    const size = level > 0 ? ROOM_UPGRADES[level - 1].size : BASE_ROOM_SIZE;
    const price = cost();
    const shownRug = draft.rug !== undefined ? (draft.rug === "none" ? undefined : draft.rug) : t.rug ? t.rugColor : undefined;
    const noRug = draft.rug !== undefined ? draft.rug === "none" : !t.rug;
    shownKey = `${me.blood}|${me.roomLevel}`;
    const scrolled = el.scrollTop; // keep the window where it is: a re-draw must never move a button under your finger
    const roomContent: HTMLElement[] = [
      h("div", { class: "hint" }, `Your room is ${size} × ${size}.`),
      h("div", { class: "ll-label" }, "Room upgrades"),
      ...ROOM_UPGRADES.map((u, i) => {
        const owned = level > i, next = level === i;
        return h("div", { class: "ll-row" + (owned ? " owned" : "") },
          h("span", { class: "ll-name" }, `${u.size} × ${u.size} room`),
          owned
            ? h("span", { class: "ll-done" }, "✓ bought")
            : h("button", {
                class: "btn small" + (next ? " primary" : ""),
                disabled: !next || me.blood < u.price || busy,
                title: next ? "" : "Buy the smaller one first",
                onclick: async () => {
                  busy = true; render();
                  try {
                    const s = await buyRoomUpgrade(me);
                    playSfx("give", 0.5);
                    toast(`Your room is now ${s} × ${s}.`);
                    onChange();
                  } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
                  busy = false; render();
                },
              }, `${u.price} drops`));
      }),
      h("div", { class: "ll-label" }, `Colours · ${RECOLOR_PRICE} drops for each part you change`),
      preview(),
      h("div", { class: "ll-part" }, "Floor"),
      swatches(FLOOR_TINTS, draft.floor ?? (t.floorTex ? undefined : t.floorA), pickFloor),
      h("div", { class: "ll-part" }, "Walls"),
      swatches(WALL_TINTS, draft.wall ?? (t.wallTex ? undefined : t.wall), pickWall),
      h("div", { class: "ll-part" }, "Carpet"),
      swatches(RUG_TINTS, shownRug, pickRug,
        h("button", { class: "chip" + (noRug ? " on" : ""), onclick: () => pickRug("none") }, "None")),
      h("div", { class: "row center" },
        h("button", {
          class: "btn primary", disabled: price === 0 || me.blood < price || busy,
          onclick: async () => {
            const d = changes();
            busy = true; render();
            try {
              const paid = await buyRoomColors(me, d);
              playSfx("give", 0.5);
              toast(`Your room has its new colours. That was ${paid} drops.`);
              draft = {};
              onChange();
            } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
            busy = false; render();
          },
        }, price === 0 ? "Pick a colour to preview" : `Apply (${price} drops)`),
        ...(Object.keys(draft).length ? [h("button", { class: "btn small", onclick: () => { draft = {}; render(); } }, "Reset")] : [])),
      price > me.blood ? h("div", { class: "hint" }, "You don't have enough drops for that.") : h("div", { class: "hint" }, "Tap colours to see them in the picture. Nothing is paid until you press Apply.")];
    body.replaceChildren(
      h("div", { class: "rp-chips" },
        h("button", { class: "chip" + (tab === "room" ? " on" : ""), onclick: () => { tab = "room"; render(); } }, "Room"),
        h("button", { class: "chip" + (tab === "style" ? " on" : ""), onclick: () => { tab = "style"; render(); } }, "Bed & wardrobe")),
      ...(tab === "room" ? roomContent : styleContent()));
    el.scrollTop = scrolled;
  }
  render();
  // follows changes made elsewhere (blood spent, level bought); doesn't rebuild the window for nothing, or while the colour box is open
  const tick = window.setInterval(() => { if (`${me.blood}|${me.roomLevel}` !== shownKey && !el.contains(document.activeElement)) render(); }, 1500);
  function close(): void {
    if (closed) return;
    closed = true;
    off();
    window.clearInterval(tick);
    el.remove();
    onClose();
  }
  return { close };
}
