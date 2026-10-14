import { h, toast } from "./dom";
import { call } from "../db";
import { itemDef } from "../items";
import { mixRecipe, MIX_RECIPES } from "../shared/items";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface MixerApi { close(): void; refresh(): void }

/** The mixer window: tap two of your things, see what they make, press Mix. */
export function openMixer(host: HTMLElement, ctx: Ctx, fid: string, onChange: () => void, onClose: () => void): MixerApi {
  const me = ctx.profile;
  let closed = false;
  let first: number | null = null;
  let second: number | null = null;
  const body = h("div", { class: "mixer-body" });
  const el = h("div", { class: "cd-popup mixer", role: "dialog", "aria-label": "Mixer" },
    h("div", { class: "cd-head" }, h("strong", {}, "Mixer"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);

  const label = (slot: number | null): string => { const s = slot === null ? null : me.inventory[slot]; return s ? `${itemDef(s.item)?.name ?? s.item}${s.ass ? " (ass)" : ""}` : "—"; };

  function render(): void {
    if (closed) return;
    if (first !== null && !me.inventory[first]) first = null;
    if (second !== null && !me.inventory[second]) second = null;
    // only things that go into some recipe are shown
    const usable = new Set<string>();
    for (const r of MIX_RECIPES) { usable.add(r.a.item); usable.add(r.b.item); }
    const cells = me.inventory.map((s, slot) => ({ s, slot })).filter((e) => e.s && usable.has(e.s.item) && !e.s.lit && !e.s.inPlayer);
    const a = first !== null ? me.inventory[first] : null, b = second !== null ? me.inventory[second] : null;
    const recipe = a && b ? mixRecipe(a, b) : null;
    const result = recipe ? itemDef(recipe.give.item) : null;
    body.replaceChildren(
      h("div", { class: "hint" }, cells.length ? "Tap two things to mix." : "You have nothing that mixes (weed, ass weed, cigarettes, pills)."),
      h("div", { class: "mixer-grid" }, ...cells.map(({ s, slot }) => {
        const d = itemDef(s!.item)!;
        const on = slot === first || slot === second;
        return h("button", {
          class: "inv-slot filled" + (on ? " selected" : ""),
          title: d.name + (s!.ass ? " (ass)" : ""),
          onclick: () => {
            if (slot === first) first = null; else if (slot === second) second = null;
            else if (first === null) first = slot;
            else if (second === null) second = slot;
            else { first = second; second = slot; }
            render();
          },
        }, h("img", { src: d.icon, alt: d.name, draggable: false }), ...(s!.qty > 1 ? [h("span", { class: "qty" }, String(s!.qty))] : []), ...(s!.ass ? [h("span", { class: "ass-tag" }, "ass")] : []));
      })),
      h("div", { class: "mixer-line" }, `${label(first)}  +  ${label(second)}`),
      h("div", { class: "mixer-result" }, ...(recipe && result ? [h("img", { src: result.icon, alt: "" }), ` → ${recipe.give.qty} × ${result.name}`] : [a && b ? "Those don't mix." : ""])),
      h("div", { class: "row center" },
        h("button", {
          class: "btn primary", disabled: !recipe,
          onclick: async () => {
            if (first === null || second === null) return;
            try {
              const r = await call<{ note?: string }>(me, "mix", { fid, a: first, b: second });
              playSfx("give", 0.5);
              toast(r.note || "Mixed.");
              first = null; second = null;
              onChange();
              render();
            } catch (err) { toast((err as Error).message || "Those don't mix.", "err"); }
          },
        }, "Mix")));
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
