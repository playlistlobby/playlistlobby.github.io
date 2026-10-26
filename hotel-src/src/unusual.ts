// The unusual the player is wearing (users/<uid>/unusual, written by the server): kept live so rooms can tell everybody (presence `un`) and the wardrobe can show it.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { itemDef } from "./items";
import { unusualOf } from "./shared/cases";
import { h, toast } from "./ui/dom";

let worn: string | null = null;
const listeners = new Set<(id: string | null) => void>();
export const unusualNow = (): string | null => worn;
export const onMyUnusual = (fn: (id: string | null) => void): (() => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export function startUnusual(uid: string): () => void {
  return onValue(ref(db, `users/${uid}/unusual`), (s) => { worn = typeof s.val() === "string" && unusualOf(s.val()) ? (s.val() as string) : null; listeners.forEach((l) => l(worn)); }, () => undefined);
}

export const wearUnusual = (p: Profile, slot: number): Promise<{ worn: string }> => call(p, "unusualWear", { slot });
export const removeUnusual = (p: Profile): Promise<unknown> => call(p, "unusualRemove", {});

/** The wardrobe's unusual box: what you wear, with a button to put it back in your inventory. */
export function unusualPanel(me: Profile): { el: HTMLElement; dispose(): void } {
  const el = h("div", { class: "unusual-box" });
  const render = (): void => {
    const u = worn ? unusualOf(worn) : undefined;
    el.replaceChildren(...(u ? [
      h("img", { src: itemDef(u.id)?.icon ?? "", alt: "", class: "un-ico" }),
      h("div", { class: "un-main" }, h("div", { class: "un-name" }, `Unusual ${u.name}`), h("div", { class: "hint" }, "You are wearing it. Everybody sees its particles.")),
      h("button", { class: "btn small", onclick: () => void removeUnusual(me).then(() => toast("It is back in your inventory."), (err) => toast((err as Error).message, "err")) }, "Put back in inventory"),
    ] : [h("div", { class: "hint" }, "No unusual on. Tap one in your inventory to wear it.")]));
  };
  render();
  const off = onMyUnusual(render);
  return { el, dispose: off };
}
