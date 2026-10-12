import { h } from "./dom";
import { mountStudio } from "./studio";
import { mountAdminFurni } from "./adminFurni";
import type { Ctx } from "../main";

type Sub = "clothing" | "furniture";

/** Admin > Studio: two tabs, Clothing (designs + .nitro import) and Furniture (.nitro uploads). */
export function mountStudioHub(root: HTMLElement, ctx: Ctx): () => void {
  let sub: Sub = "clothing";
  let off: (() => void) | null = null;
  const tabs = h("div", { class: "tabs" });
  const host = h("div", {});
  root.append(tabs, host);
  const open = (next: Sub) => {
    off?.();
    sub = next;
    tabs.replaceChildren(...([["clothing", "Clothing"], ["furniture", "Furniture"]] as Array<[Sub, string]>).map(([id, label]) =>
      h("button", { class: "tab" + (id === sub ? " on" : ""), onclick: () => open(id) }, label)));
    host.replaceChildren();
    off = (sub === "clothing" ? mountStudio : mountAdminFurni)(host, ctx);
  };
  open("clothing");
  return () => off?.();
}
