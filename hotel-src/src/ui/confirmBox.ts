import { h } from "./dom";

/** A small "are you sure" window (the same look as the drop window): Yes (green) goes on, Cancel (red) or Escape or a tap outside stops. */
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
  const el = h("div", { class: "drop-overlay", onclick: (e: Event) => { if (e.target === el) finish(false); } },
    h("div", { class: "drop-win", role: "dialog", "aria-label": title },
      h("div", { class: "drop-title" }, title),
      ...lines.map((l) => h("div", { class: "hint", style: { margin: "6px 0" } }, l)),
      h("div", { class: "drop-buttons" }, h("button", { class: "btn drop-yes", onclick: () => finish(true) }, "Yes"), h("button", { class: "btn drop-no", onclick: () => finish(false) }, "Cancel"))));
  window.addEventListener("keydown", onKey);
  host.append(el);
}
