import { h } from "./dom";
import { furniIcon, onFurniIcon } from "../items";
import { FURNI_KINDS } from "../rooms";
import { freeSlots, isFixedPiece, canTurn, MAX_FURNI, placedCount, storedCount } from "../furnishing";
import type { Profile } from "../db";
import type { PlacedFurni, RoomDef } from "../rooms";

/** What the furnishing menu asks the room to do. The room owns the canvas; this file is only the buttons around it. */
export interface FurnishHost {
  profile: Profile;
  def(): RoomDef;
  /** the piece that is selected in the room, if any */
  selected(): PlacedFurni | null;
  /** the piece you picked up from the tray and are about to put down */
  placing(): { kind: string; source: "inv" | "storage" } | null;
  done(): void;
  turn(): void;
  store(): void;
  startPlacing(source: "inv" | "storage", kind: string, slot?: number): void;
  cancelPlacing(): void;
  storeFromInventory(slot: number): void;
  takeFromStorage(kind: string): void;
}

export interface FurnishApi {
  /** call whenever the selection, the room, the inventory or the storage changed */
  refresh(): void;
  dispose(): void;
}

/**
 * The furnishing menu: a bar on top (what's selected: Turn / Store), a tray at the bottom with your storage and what you carry, and Done.
 * Moving a piece is done by dragging it in the room; nothing needs a right-click.
 */
export function mountFurnishUi(host: HTMLElement, fh: FurnishHost): FurnishApi {
  let tab: "storage" | "inventory" = "storage";
  const top = h("div", { class: "fz-top" });
  const bar = h("div", { class: "fz-bar" });
  const tray = h("div", { class: "fz-tray" });
  const root = h("div", { class: "furnish-ui" }, h("div", { class: "fz-head" }, top, bar), tray);
  host.append(root);

  function render(): void {
    const p = fh.profile;
    const sel = fh.selected();
    const placing = fh.placing();
    top.replaceChildren(
      h("div", { class: "fz-title" }, "Furnishing ", h("span", { class: "hint" }, `${placedCount(fh.def())}/${MAX_FURNI} placed`)),
      h("button", { class: "btn primary small", onclick: () => fh.done() }, "Done"));

    if (placing) {
      const k = FURNI_KINDS[placing.kind];
      bar.replaceChildren(
        h("div", { class: "fz-sel" }, h("b", {}, k.label), h("span", { class: "hint" }, "Tap a spot in the room to put it down.")),
        ...(k.rotatable ? [h("button", { class: "btn small", onclick: () => fh.turn() }, "⟳ Turn")] : []),
        h("button", { class: "btn small", onclick: () => fh.cancelPlacing() }, "Cancel"));
    } else if (sel) {
      const k = FURNI_KINDS[sel.kind];
      bar.replaceChildren(
        h("div", { class: "fz-sel" }, h("b", {}, k?.label ?? sel.kind), h("span", { class: "hint" }, "Drag it to move it.")),
        ...(canTurn(sel) ? [h("button", { class: "btn small", onclick: () => fh.turn() }, "⟳ Turn")] : []),
        ...(isFixedPiece(sel.id) ? [] : [h("button", { class: "btn small", onclick: () => fh.store() }, "📦 Store")]));
    } else {
      bar.replaceChildren(h("div", { class: "fz-sel hint" }, "Tap a piece to select it, then drag it. Tap a piece below to put it down."));
    }

    const stored = Object.entries(p.storage).filter(([k, n]) => n > 0 && FURNI_KINDS[k]);
    const carried = p.inventory.map((s, slot) => ({ s, slot })).filter((e): e is { s: NonNullable<typeof e.s>; slot: number } => !!e.s && !!FURNI_KINDS[e.s.item] && /^[fx]_/.test(e.s.item));
    const cell = (kind: string, count: number, onPlace: () => void, secondary: { label: string; run: () => void }) =>
      h("div", { class: "fz-cell" + (placing?.kind === kind ? " on" : ""), title: FURNI_KINDS[kind].label },
        h("button", { class: "fz-pick", onclick: onPlace }, h("img", { src: furniIcon(kind), alt: FURNI_KINDS[kind].label, draggable: false }), ...(count > 1 ? [h("span", { class: "qty" }, String(count))] : [])),
        h("div", { class: "fz-name" }, FURNI_KINDS[kind].label),
        h("button", { class: "btn small fz-mini", onclick: secondary.run }, secondary.label));
    const cells = tab === "storage"
      ? stored.map(([kind, n]) => cell(kind, n, () => fh.startPlacing("storage", kind), { label: "Take", run: () => fh.takeFromStorage(kind) }))
      : carried.map(({ s, slot }) => cell(s.item, 1, () => fh.startPlacing("inv", s.item, slot), { label: "Store", run: () => fh.storeFromInventory(slot) }));
    tray.replaceChildren(
      h("div", { class: "fz-tabs" },
        h("button", { class: "tab" + (tab === "storage" ? " on" : ""), onclick: () => { tab = "storage"; render(); } }, `Storage (${stored.reduce((a, [, n]) => a + n, 0)})`),
        h("button", { class: "tab" + (tab === "inventory" ? " on" : ""), onclick: () => { tab = "inventory"; render(); } }, `Carrying (${carried.length})`),
        h("span", { class: "hint" }, tab === "storage" ? `Free pockets: ${freeSlots(p)}` : "Store pieces to keep your pockets free.")),
      h("div", { class: "fz-list" }, ...(cells.length ? cells : [h("div", { class: "hint" }, tab === "storage" ? "Nothing in storage. Pick a piece up with Store, or put a carried piece into storage from the Carrying tab." : "You aren't carrying any furniture. Buy some in the shop (the white door in the basement).")])));
    void storedCount;
  }
  render();
  const off = onFurniIcon(render);
  return { refresh: render, dispose() { off(); root.remove(); } };
}
