import { h } from "./dom";

/** A small "are you sure" window in the game's blue iOS 6 popup look (like the landlord's): a title, a few lines, then Yes (blue) and Cancel. Escape or a tap outside cancels. */
export function openConfirmBox(host: HTMLElement, title: string, lines: string[], onDone: (yes: boolean) => void): void {
  let closed = false;
  const finish = (yes: boolean): void => {
    if (closed) return;
    closed = true;
    window.removeEventListener("keydown", onKey);
    el.remove();
    onDone(yes);
  };
  const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") finish(false); };
  const el = h("div", { class: "confirm-overlay", onclick: (e: Event) => { if (e.target === el) finish(false); } },
    h("div", { class: "cd-popup confirm-pop", role: "alertdialog", "aria-label": title },
      h("div", { class: "cd-head" }, h("strong", { class: "confirm-title" }, title), h("button", { class: "btn small", type: "button", "aria-label": "Close", onclick: () => finish(false) }, "✕")),
      ...lines.map((l, i) => h("div", { class: i === lines.length - 1 ? "confirm-ask" : "hint confirm-line" }, l)),
      h("div", { class: "row center confirm-buttons" }, h("button", { class: "btn primary", type: "button", onclick: () => finish(true) }, "Yes"), h("button", { class: "btn", type: "button", onclick: () => finish(false) }, "Cancel"))));
  window.addEventListener("keydown", onKey);
  host.append(el);
}
