import { h } from "./dom";

export interface DropConfirmApi { close(): void }

/**
 * The "drop item" window: the item's picture and name, then (for a stack) a box to type how many, then the buttons.
 * A single item asks Yes (green) / Cancel (red); a stack asks Cancel / Drop. `onDone` gets the amount, or null if it was cancelled.
 */
export function openDropConfirm(host: HTMLElement, item: { name: string; icon: string; qty: number; ass?: boolean }, onDone: (qty: number | null) => void): DropConfirmApi {
  let closed = false;
  const stack = item.qty > 1;
  const input = h("input", { class: "drop-qty", type: "text", inputMode: "numeric", pattern: "[0-9]*", maxLength: String(item.qty).length, value: "1", autocomplete: "off", "aria-label": "How many" }) as HTMLInputElement;
  const msg = h("div", { class: "hint" });
  input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, ""); msg.textContent = ""; });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } e.stopPropagation(); });
  const yes = h("button", { class: "btn drop-yes", onclick: () => go() }, stack ? "Drop" : "Yes");
  const no = h("button", { class: "btn drop-no", onclick: () => finish(null) }, "Cancel");
  const el = h("div", { class: "drop-overlay", onclick: (e: Event) => { if (e.target === el) finish(null); } },
    h("div", { class: "drop-win", role: "dialog", "aria-label": "Drop item" },
      h("div", { class: "drop-title" }, "Drop item"),
      h("div", { class: "drop-item" }, h("img", { src: item.icon, alt: item.name, draggable: false }), h("div", {}, h("strong", {}, item.name + (item.ass ? " (ass)" : "")), h("div", { class: "hint" }, stack ? `You have ${item.qty}.` : "It lands on the floor."))),
      ...(stack ? [h("div", { class: "drop-how" }, h("label", {}, "How many? "), input), msg] : []),
      h("div", { class: "drop-buttons" }, ...(stack ? [no, yes] : [yes, no]))));
  host.append(el);
  if (stack) { input.focus(); input.select(); }

  function go(): void {
    if (!stack) return finish(1);
    const n = Number(input.value);
    if (!Number.isFinite(n) || n < 1) { msg.textContent = `Type a number from 1 to ${item.qty}.`; return; }
    finish(Math.min(n, item.qty));
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(null); };
  window.addEventListener("keydown", onKey);
  function finish(qty: number | null): void {
    if (closed) return;
    closed = true;
    window.removeEventListener("keydown", onKey);
    el.remove();
    onDone(qty);
  }
  return { close: () => finish(null) };
}
