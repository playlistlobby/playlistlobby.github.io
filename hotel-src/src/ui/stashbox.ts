import { h, toast } from "./dom";
import { furniIcon, itemDef } from "../items";
import { stashGet, stashPut } from "../db";
import { freeSlots, isStorable, parseStoreKey, storeKeyOf } from "../furnishing";
import { STASH_PIECES } from "../shared/economy";
import { isFurniItem } from "../shared/items";
import { FURNI_KINDS } from "../rooms";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface StashApi {
  close(): void;
  refresh(): void;
}

const nameOf = (key: string): string => {
  const { item, ass } = parseStoreKey(key);
  return (itemDef(item)?.name ?? FURNI_KINDS[item]?.label ?? item) + (ass ? " (ass)" : "");
};
const iconOf = (key: string): string => {
  const { item } = parseStoreKey(key);
  return itemDef(item)?.icon ?? furniIcon(item);
};

/** The stash box in your own room: what you keep in it, and what you carry that you can put in. Things only (pots and mixers too); other furniture goes in the toolbox. */
export function openStashBox(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): StashApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop", role: "dialog", "aria-label": "Stash box" },
    h("div", { class: "cd-head" }, h("strong", {}, "🎁 Stash box"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let busy = false;

  async function run(job: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true;
    try { await job(); playSfx("give", 0.4); onChange(); } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
    busy = false;
    render();
  }

  function row(key: string, count: number, buttons: Array<[string, () => void]>): HTMLElement {
    return h("div", { class: "sixty-row" },
      h("img", { src: iconOf(key), alt: "", class: "sixty-ico" }),
      h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, nameOf(key)), h("div", { class: "hint" }, `x${count}`)),
      h("div", { style: { display: "flex", gap: "4px" } }, ...buttons.map(([label, go]) => h("button", { class: "btn small", disabled: busy, onclick: go }, label))));
  }

  function render(): void {
    if (closed) return;
    const inside = Object.entries(me.stash).filter(([, n]) => n > 0);
    const carried = me.inventory
      .map((s, slot) => ({ s, slot }))
      .filter((e): e is { s: NonNullable<typeof e.s>; slot: number } => !!e.s && isStorable(e.s) && (isFurniItem(e.s.item) ? STASH_PIECES.has(e.s.item) : !!itemDef(e.s.item)));
    body.replaceChildren(
      h("div", { class: "hint" }, `In the box (${inside.reduce((a, [, n]) => a + n, 0)}) · free pockets: ${freeSlots(me)}`),
      ...(inside.length
        ? inside.map(([key, n]) => row(key, n, [["Take", () => void run(() => stashGet(me, key, 1))], ...(n > 1 ? [["All", () => void run(() => stashGet(me, key, n))] as [string, () => void]] : [])]))
        : [h("div", { class: "hint" }, "Nothing in the box yet. Put what you carry in it to free your pockets.")]),
      h("div", { class: "hint", style: { marginTop: "6px" } }, "You're carrying:"),
      ...(carried.length
        ? carried.map(({ s, slot }) => row(storeKeyOf(s), s.qty, [["Put in", () => void run(() => stashPut(me, slot, 1))], ...(s.qty > 1 ? [["All", () => void run(() => stashPut(me, slot, s.qty))] as [string, () => void]] : [])]))
        : [h("div", { class: "hint" }, "Nothing to put in. Pots and mixers fit here too; other furniture goes in the toolbox.")]));
  }
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    el.remove();
    onClose();
  }
  return { close, refresh: render };
}
