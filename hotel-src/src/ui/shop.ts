import { h } from "./dom";
import { mountEditor } from "./editor";
import type { Ctx } from "../main";

type ShopTab = "clothing" | "furniture";

/** The shop: clothing now, furniture next. (Emotes are free for everyone, items and music are no longer sold.) */
export function mountShop(root: HTMLElement, ctx: Ctx): () => void {
  let inner: (() => void) | null = null;

  const tabs = h("div", { class: "shop-tabs" });
  const content = h("div", { class: "shop-content" });
  root.append(h("div", { class: "shop" }, tabs, content));

  function show(tab: ShopTab): void {
    inner?.();
    inner = null;
    content.replaceChildren();
    tabs.replaceChildren(
      ...([["clothing", "Clothing"], ["furniture", "Furniture"]] as Array<[ShopTab, string]>).map(([id, label]) =>
        h("button", { class: "tab big" + (tab === id ? " on" : ""), onclick: () => show(id) }, label)));
    inner = tab === "clothing" ? mountEditor(content, ctx, "shop") : mountFurnitureShop(content);
  }

  show("clothing");
  return () => inner?.();
}

/** Placeholder until furniture has prices and a list of what each player owns. */
function mountFurnitureShop(root: HTMLElement): () => void {
  root.append(h("div", { class: "panel" }, h("h2", {}, "Furniture"), h("p", { class: "muted" }, "Furniture for your room is coming soon.")));
  return () => undefined;
}
