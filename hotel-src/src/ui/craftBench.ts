// The crafting bench (an anvil) in the mines: iron and wood in, a pickaxe or a machete out.
import { h, toast } from "./dom";
import { call } from "../db";
import { itemDef } from "../items";
import { CRAFT_RECIPES } from "../shared/mines";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface CraftBenchApi { close(): void; refresh(): void }

const count = (me: Ctx["profile"], item: string): number => me.inventory.reduce((n, s) => n + (s && s.item === item && !s.inPlayer ? s.qty : 0), 0);

export function openCraftBench(host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): CraftBenchApi {
  const me = ctx.profile;
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop craft-bench", role: "dialog", "aria-label": "Crafting bench" },
    h("div", { class: "cd-head" }, h("strong", {}, "⚒️ Crafting bench"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let busy = false;

  async function craft(recipe: string, name: string): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try {
      await call(me, "craft", { recipe });
      playSfx("give", 0.5);
      logAction(me, "room", `crafted a ${name}`);
      toast(`You made a ${name}.`);
      onChange();
    } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    finally { busy = false; render(); }
  }

  function render(): void {
    if (closed) return;
    const iron = count(me, "iron"), wood = count(me, "wood");
    body.replaceChildren(
      ...CRAFT_RECIPES.map((r) => {
        const def = itemDef(r.give)!;
        const have = count(me, r.give) > 0;
        const ok = iron >= r.iron && wood >= r.wood;
        const need = h("div", { class: "hint" },
          h("span", { class: iron >= r.iron ? "craft-ok" : "craft-no" }, `${r.iron} iron (${iron})`), "  +  ",
          h("span", { class: wood >= r.wood ? "craft-ok" : "craft-no" }, `${r.wood} wood (${wood})`));
        return h("div", { class: "sixty-row" },
          h("img", { src: def.icon, alt: "", class: "sixty-ico" }),
          h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, def.name), h("div", { class: "hint" }, r.note), need),
          have ? h("button", { class: "btn small", disabled: true }, "Owned")
            : h("button", { class: "btn small primary", disabled: !ok || busy, title: ok ? "" : "You need more iron or wood", onclick: () => void craft(r.id, def.name) }, "Craft"));
      }),
      h("div", { class: "hint" }, "Mine iron with your knife (or a pickaxe) at the rocks. 6ixty sells wood, and some lies on the floor."));
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
