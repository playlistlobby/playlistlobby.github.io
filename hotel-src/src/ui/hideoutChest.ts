import { h, toast } from "./dom";
import { hideoutChestPut, hideoutChestTake, watchHideoutChest } from "../hideout";
import type { ChestRow } from "../hideout";
import { itemDef } from "../items";
import { onFurniIcon } from "../items";
import { HIDEOUT_CHEST_SLOTS } from "../shared/hideout";
import { isFurniItem, NO_DROP } from "../shared/items";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/**
 * The hideout's shared stash: a chest every member can put things in and take things out of (it is on trust). Two lists: what is in the stash (take 1 / take all)
 * and what is in your pocket (put 1 / put all). Furniture goes in the box in the toolbox, not here.
 */
export function openHideoutChest(host: HTMLElement, ctx: Ctx, roomId: string, onChange: () => void, onClose: () => void): { close(): void; refresh(): void } {
  const me = ctx.profile;
  let closed = false;
  let busy = false;
  let rows: ChestRow[] = [];
  const body = h("div", { class: "pet-body" });
  const el = h("div", { class: "cd-popup pet-shop hc-chest", role: "dialog", "aria-label": "Shared stash" },
    h("div", { class: "cd-head" }, h("strong", {}, "🧰 Shared stash"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  const owner = roomId.slice(2);

  const act = async (what: () => Promise<unknown>): Promise<void> => {
    if (busy) return;
    busy = true;
    try { await what(); playSfx("select", 0.4); onChange(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  };
  const nameOf = (item: string, ass?: boolean): string => `${itemDef(item)?.name ?? item}${ass ? " (ass)" : ""}`;
  const line = (icon: string, name: string, qty: number, buttons: HTMLElement[]): HTMLElement => h("div", { class: "hc-person" },
    h("img", { src: icon, alt: "", style: { width: "28px", height: "28px", objectFit: "contain", imageRendering: "pixelated", flex: "none" } }),
    h("span", { class: "hc-pname" }, `${name}${qty > 1 ? ` ×${qty}` : ""}`), h("span", { class: "hc-actions" }, ...buttons));

  function render(): void {
    if (closed) return;
    const scrolled = el.scrollTop;
    // your pocket, one row per kind (what can go in)
    const mine = new Map<string, { item: string; ass?: boolean; qty: number; slot: number }>();
    me.inventory.forEach((s, slot) => {
      if (!s || s.lit || s.inPlayer || isFurniItem(s.item) || NO_DROP.has(s.item) || !itemDef(s.item)) return;
      const key = `${s.item}|${s.ass ? "a" : ""}`;
      const have = mine.get(key);
      if (have) have.qty += s.qty; else mine.set(key, { item: s.item, ass: s.ass, qty: s.qty, slot });
    });
    const putAll = async (m: { item: string; ass?: boolean; qty: number }, n: number): Promise<void> => {
      let left = n;
      while (left > 0) { // (the pocket shifts after each put: the slot is looked up again)
        const at = me.inventory.findIndex((x) => x && x.item === m.item && !!x.ass === !!m.ass && !x.lit && !x.inPlayer);
        if (at < 0) break;
        const take = Math.min(left, me.inventory[at]!.qty);
        await hideoutChestPut(me, roomId, at, take);
        left -= take;
      }
    };
    body.replaceChildren(
      h("div", { class: "hint" }, `Everybody in the hideout can put things in and take things out. ${rows.length}/${HIDEOUT_CHEST_SLOTS} kinds. Furniture goes in the box in the toolbox.`),
      h("div", { class: "fp-label" }, "In the stash"),
      ...(rows.length ? rows.map((r) => line(itemDef(r.item)?.icon ?? "", nameOf(r.item, r.ass), r.qty, [
        h("button", { class: "btn small", disabled: busy, onclick: () => void act(() => hideoutChestTake(me, roomId, r.key, 1)) }, "Take 1"),
        ...(r.qty > 1 ? [h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(() => hideoutChestTake(me, roomId, r.key, r.qty)) }, "All")] : []),
      ])) : [h("div", { class: "hint pad" }, "Nothing in the stash yet.")]),
      h("div", { class: "fp-label" }, "Your pocket"),
      ...([...mine.values()].length ? [...mine.values()].map((m) => line(itemDef(m.item)?.icon ?? "", nameOf(m.item, m.ass), m.qty, [
        h("button", { class: "btn small", disabled: busy, onclick: () => void act(() => putAll(m, 1)) }, "Put 1"),
        ...(m.qty > 1 ? [h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(() => putAll(m, m.qty)) }, "All")] : []),
      ])) : [h("div", { class: "hint pad" }, "Nothing in your pocket that fits.")]));
    el.scrollTop = scrolled;
  }
  const stops = [watchHideoutChest(owner, (r) => { rows = r; render(); }), onFurniIcon(() => render())];
  render();
  function close(): void { if (closed) return; closed = true; stops.forEach((s) => s()); el.remove(); onClose(); }
  return { close, refresh: render };
}
