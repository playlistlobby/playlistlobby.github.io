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

type Amount = 1 | 5 | 10 | "all";
const AMOUNTS: Array<[Amount, string]> = [[1, "1"], [5, "5"], [10, "10"], ["all", "All"]];

/**
 * The storage box (the stash box in your room, or the remote bank in the arrival room): a big window with what is in the box on one side and what you carry on the other.
 * Tap a thing to move it across (1, 5, 10 or all of it, as picked at the top). Things only (pots and mixers too); other furniture goes in the toolbox.
 */
export function openStashBox(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): StashApi {
  const me = ctx.profile;
  let amount: Amount = 1;
  let filter = "";
  let closed = false;
  let busy = false;

  const search = h("input", { class: "stash-search", type: "search", placeholder: "Search…", oninput: () => { filter = search.value.trim().toLowerCase(); render(); } });
  const amountBtns = new Map<Amount, HTMLButtonElement>();
  const amounts = h("div", { class: "stash-amounts", role: "group", "aria-label": "How many to move" },
    ...AMOUNTS.map(([a, label]) => {
      const b = h("button", { class: "stash-chip" + (a === amount ? " on" : ""), type: "button", onclick: () => { amount = a; for (const [k, el] of amountBtns) el.classList.toggle("on", k === a); } }, label);
      amountBtns.set(a, b);
      return b;
    }));
  const count = h("span", { class: "stash-count" }, "");
  const inside = h("div", { class: "stash-grid" });
  const carried = h("div", { class: "stash-grid" });
  const insideHead = h("div", { class: "stash-pane-head" });
  const carriedHead = h("div", { class: "stash-pane-head" });
  const el = h("div", { class: "stash-win", role: "dialog", "aria-label": "Storage" },
    h("div", { class: "stash-head" }, h("strong", {}, "🎁 Storage"), count, h("button", { class: "btn small", type: "button", "aria-label": "Close", onclick: () => close() }, "✕")),
    h("div", { class: "stash-bar" }, search, amounts),
    h("div", { class: "stash-panes" },
      h("section", { class: "stash-pane" }, insideHead, inside),
      h("section", { class: "stash-pane" }, carriedHead, carried)),
    h("div", { class: "stash-foot hint" }, "Tap a thing to move it across. Pots and mixers fit here too; other furniture goes in the toolbox."));
  host.append(el);

  async function run(job: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true;
    try { await job(); playSfx("give", 0.4); onChange(); } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
    busy = false;
    render();
  }

  const matches = (name: string): boolean => !filter || name.toLowerCase().includes(filter);
  const howMany = (have: number): number => (amount === "all" ? have : Math.min(amount, have));

  function tile(key: string, n: number, title: string, go: () => void): HTMLElement {
    return h("button", { class: "stash-tile", type: "button", title, disabled: busy, onclick: go },
      h("img", { src: iconOf(key), alt: "", class: "stash-ico" }),
      n > 1 ? h("span", { class: "stash-qty" }, n >= 10_000 ? "9999+" : String(n)) : null,
      h("span", { class: "stash-name" }, nameOf(key)));
  }

  function render(): void {
    if (closed) return;
    const stored = Object.entries(me.stash).filter(([, n]) => n > 0).sort((a, b) => nameOf(a[0]).localeCompare(nameOf(b[0])));
    const total = stored.reduce((a, [, n]) => a + n, 0);
    const pockets = me.inventory
      .map((s, slot) => ({ s, slot }))
      .filter((e): e is { s: NonNullable<typeof e.s>; slot: number } => !!e.s && isStorable(e.s) && (isFurniItem(e.s.item) ? STASH_PIECES.has(e.s.item) : !!itemDef(e.s.item)));
    count.textContent = `${total} in the box`;
    insideHead.replaceChildren(h("strong", {}, "In the box"), h("span", { class: "hint" }, `${stored.length} kinds · ${total} things`));
    carriedHead.replaceChildren(h("strong", {}, "In your pockets"), h("span", { class: "hint" }, `${freeSlots(me)} free slots`));
    const shownIn = stored.filter(([key]) => matches(nameOf(key)));
    inside.replaceChildren(...(shownIn.length
      ? shownIn.map(([key, n]) => tile(key, n, `${nameOf(key)} · take ${howMany(n)}`, () => void run(() => stashGet(me, key, howMany(n)))))
      : [h("div", { class: "stash-empty" }, stored.length ? "Nothing matches." : "The box is empty. Tap something in your pockets to put it in.")]));
    const shownOut = pockets.filter(({ s }) => matches(nameOf(storeKeyOf(s))));
    carried.replaceChildren(...(shownOut.length
      ? shownOut.map(({ s, slot }) => tile(storeKeyOf(s), s.qty, `${nameOf(storeKeyOf(s))} · put in ${howMany(s.qty)}`, () => void run(() => stashPut(me, slot, howMany(s.qty)))))
      : [h("div", { class: "stash-empty" }, pockets.length ? "Nothing matches." : "Nothing in your pockets that fits.")]));
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
