import { h } from "./dom";
import { furniIcon, itemDef, onFurniIcon } from "../items";
import { FURNI_KINDS } from "../rooms";
import { freeSlots, isFixedPiece, canTurn, isFurnitureKey, isStorable, MAX_FURNI, parseStoreKey, placedCount, storedCount } from "../furnishing";
import type { Profile } from "../db";
import type { PlacedFurni, RoomDef } from "../rooms";

/** a phone or tablet: building is done with taps, nothing is dragged */
const coarse = (): boolean => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

/** What the furnishing menu asks the room to do. The room owns the canvas; this file is only the buttons around it. */
export interface FurnishHost {
  profile: Profile;
  def(): RoomDef;
  /** the piece that is selected in the room, if any */
  selected(): PlacedFurni | null;
  /** the piece you picked up from the tray and are about to put down */
  placing(): { kind: string; source: "inv" | "storage" | "catalog" | "box" } | null;
  /** the admin in the basement: every piece there is, instead of storage and pocket (put down from the catalogue, "Remove" instead of "Store") */
  catalog?(): string[];
  done(): void;
  turn(): void;
  store(): void;
  startPlacing(source: "inv" | "storage" | "catalog" | "box", kind: string, slot?: number, owner?: string): void;
  cancelPlacing(): void;
  storeFromInventory(slot: number, qty?: number): void;
  takeFromStorage(kind: string, qty?: number): void;
  /** in a hideout: the shared box (owner -> kind -> how many), who is who, why you can't build (or null), how many pieces fit, and moving pieces in and out of the box */
  hideout?: {
    box(): Record<string, Record<string, number>>;
    names(): Record<string, string>;
    note(): string | null;
    cap(): number;
    boxStore(kind: string, qty: number, slot?: number): void;
    boxTake(kind: string, qty: number): void;
  };
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
  let tab: "storage" | "inventory" | "box" = "storage";
  let search = "";
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
      h("div", { class: "fz-title" }, "Furnishing ", h("span", { class: "hint" }, `${placedCount(fh.def())}/${fh.hideout?.cap() ?? MAX_FURNI} placed`)),
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
        h("div", { class: "fz-sel" }, h("b", {}, k?.label ?? sel.kind), h("span", { class: "hint" }, coarse() ? "In your hand: tap a free spot to put it down." : "Drag it to move it.")),
        ...(canTurn(sel) ? [h("button", { class: "btn small", onclick: () => fh.turn() }, "⟳ Turn")] : []),
        ...(isFixedPiece(sel.id) && sel.id !== "boombox" ? [] : [h("button", { class: "btn small", onclick: () => fh.store() }, fh.catalog ? "🗑 Remove" : "📦 Store")]));
    } else {
      bar.replaceChildren(h("div", { class: "fz-sel hint" }, fh.hideout?.note() ?? (coarse() ? "Tap a piece in the room to pick it up, then tap where it goes. Tap a piece below to put it down." : "Tap a piece to select it, then drag it. Tap a piece below to put it down.")));
    }

    tray.style.display = placing ? "none" : ""; // while you're choosing where to put a piece down, the tray steps out of the way so the whole room shows
    if (fh.catalog) { // the admin in the basement: every piece, with a search box
      const q = search.trim().toLowerCase();
      const kinds = fh.catalog().filter((k) => !q || FURNI_KINDS[k].label.toLowerCase().includes(q) || k.toLowerCase().includes(q));
      const box = h("input", { type: "search", class: "input", placeholder: "Search furniture", value: search, style: { width: "170px" }, oninput: (e: Event) => { search = (e.target as HTMLInputElement).value; render(); } }) as HTMLInputElement;
      const keep = document.activeElement === box || search !== "";
      tray.replaceChildren(
        h("div", { class: "fz-tabs" }, h("button", { class: "tab on" }, `All furniture (${kinds.length})`), box, h("span", { class: "hint" }, coarse() ? "Tap a piece, then a spot in the room. Tap a placed piece to pick it up, then tap where it goes." : "Tap a piece, then a spot in the room. Drag a placed piece to move it.")),
        h("div", { class: "fz-list" }, ...kinds.map((kind) => h("div", { class: "fz-cell", title: FURNI_KINDS[kind].label },
          h("button", { class: "fz-pick", onclick: () => fh.startPlacing("catalog", kind) }, h("img", { src: furniIcon(kind), alt: FURNI_KINDS[kind].label, draggable: false })),
          h("div", { class: "fz-name" }, FURNI_KINDS[kind].label)))));
      if (keep) { const nb = tray.querySelector("input"); if (nb) { (nb as HTMLInputElement).focus(); (nb as HTMLInputElement).setSelectionRange(search.length, search.length); } }
      return;
    }
    const stored = Object.entries(p.storage).filter(([k, n]) => n > 0 && (FURNI_KINDS[k] || itemDef(parseStoreKey(k).item)));
    // the toolbox only takes furniture now; seeds, weed, pills and the like go in the stash box (the landlord sells it)
    const carried = p.inventory.map((s, slot) => ({ s, slot })).filter((e): e is { s: NonNullable<typeof e.s>; slot: number } => !!e.s && !!FURNI_KINDS[e.s.item] && /^[fx]_/.test(e.s.item));
    // a thing (cigarettes, weed, a lighter...): not placed in the room, only stored and taken out, one or all of them at a time
    const thingCell = (key: string, count: number, buttons: Array<{ label: string; run: () => void }>) => {
      const { item, ass } = parseStoreKey(key);
      const d = itemDef(item)!;
      return h("div", { class: "fz-cell", title: d.name + (ass ? " (ass)" : "") },
        h("div", { class: "fz-pick thing" }, h("img", { src: d.icon, alt: d.name, draggable: false }), ...(count > 1 ? [h("span", { class: "qty" }, String(count))] : []), ...(ass ? [h("span", { class: "ass-tag" }, "ass")] : [])),
        h("div", { class: "fz-name" }, d.name),
        h("div", { class: "fz-btns" }, ...buttons.map((b) => h("button", { class: "btn small fz-mini", onclick: b.run }, b.label))));
    };
    const cell = (kind: string, count: number, onPlace: () => void, secondary: { label: string; run: () => void } | null, extra?: { label: string; run: () => void }, sub?: string) =>
      h("div", { class: "fz-cell" + (placing?.kind === kind ? " on" : ""), title: FURNI_KINDS[kind].label },
        h("button", { class: "fz-pick", onclick: onPlace }, h("img", { src: furniIcon(kind), alt: FURNI_KINDS[kind].label, draggable: false }), ...(count > 1 ? [h("span", { class: "qty" }, String(count))] : [])),
        h("div", { class: "fz-name" }, FURNI_KINDS[kind].label),
        ...(sub ? [h("div", { class: "hint fz-owner" }, sub)] : []),
        ...(secondary ? [h("button", { class: "btn small fz-mini", onclick: secondary.run }, secondary.label)] : []),
        ...(extra ? [h("button", { class: "btn small fz-mini", onclick: extra.run }, extra.label)] : []));
    const hid = fh.hideout;
    // the shared box of a hideout: everybody who may build places from it; only the owner of a piece takes it out again
    const boxed = hid ? Object.entries(hid.box()).flatMap(([owner, kinds]) => Object.entries(kinds).filter(([k, n]) => n > 0 && FURNI_KINDS[k]).map(([kind, n]) => ({ owner, kind, n }))) : [];
    const cells = tab === "box" && hid
      ? boxed.map(({ owner, kind, n }) => cell(kind, n, () => fh.startPlacing("box", kind, undefined, owner), owner === p.uid ? { label: "Take", run: () => hid.boxTake(kind, 1) } : null, undefined, owner === p.uid ? "yours" : (hid.names()[owner] ?? "")))
      : tab === "storage"
      ? stored.map(([kind, n]) => isFurnitureKey(kind)
        ? cell(kind, n, () => fh.startPlacing("storage", kind), { label: "Take", run: () => fh.takeFromStorage(kind) }, hid && kind !== "f_boombox" ? { label: "→ Box", run: () => hid.boxStore(kind, 1) } : undefined)
        : thingCell(kind, n, [{ label: "Take", run: () => fh.takeFromStorage(kind) }, ...(n > 1 ? [{ label: "All", run: () => fh.takeFromStorage(kind, n) }] : [])]))
      : carried.map(({ s, slot }) => isFurnitureKey(s.item) && /^[fx]_/.test(s.item)
        ? cell(s.item, 1, () => fh.startPlacing("inv", s.item, slot), { label: "Store", run: () => fh.storeFromInventory(slot) }, hid && s.item !== "f_boombox" ? { label: "→ Box", run: () => hid.boxStore(s.item, 1, slot) } : undefined)
        : thingCell(s.ass ? `ass_${s.item}` : s.item, s.qty, [{ label: "Store", run: () => fh.storeFromInventory(slot) }, ...(s.qty > 1 ? [{ label: "All", run: () => fh.storeFromInventory(slot, s.qty) }] : [])]));
    tray.replaceChildren(
      h("div", { class: "fz-tabs" },
        h("button", { class: "tab" + (tab === "storage" ? " on" : ""), onclick: () => { tab = "storage"; render(); } }, `Storage (${stored.reduce((a, [, n]) => a + n, 0)})`),
        h("button", { class: "tab" + (tab === "inventory" ? " on" : ""), onclick: () => { tab = "inventory"; render(); } }, `Carrying (${carried.length})`),
        ...(hid ? [h("button", { class: "tab" + (tab === "box" ? " on" : ""), onclick: () => { tab = "box"; render(); } }, `Box (${boxed.reduce((a, b) => a + b.n, 0)})`)] : []),
        h("span", { class: "hint" }, tab === "box" ? "Shared by everybody in the hideout. Each piece is still its owner's." : tab === "storage" ? `Free pockets: ${freeSlots(p)}` : "Store furniture here. Things like seeds and weed go in a stash box (the landlord sells them).")),
      h("div", { class: "fz-list" }, ...(cells.length ? cells : [h("div", { class: "hint" }, tab === "box" ? "The box is empty. Put pieces in it with → Box from your storage or the Carrying tab." : tab === "storage" ? "Nothing in storage. Pick a piece up with Store, or put furniture you carry into storage from the Carrying tab." : "You aren't carrying anything you can store. Furniture comes from the shop (the yellow door in the basement).")])));
    void storedCount;
  }
  render();
  const off = onFurniIcon(render);
  return { refresh: render, dispose() { off(); root.remove(); } };
}
