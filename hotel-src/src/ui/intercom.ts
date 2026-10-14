import { h, toast } from "./dom";
import { Access, updateRoom } from "../rooms";

export interface IntercomApi { close(): void }

const CHOICES: Array<{ access: Access; label: string; help: string }> = [
  { access: "none", label: "No one", help: "Nobody can come in, not even friends." },
  { access: "closed", label: "Friends", help: "Only your friends can come in." },
  { access: "open", label: "Everyone", help: "Anyone can walk in." },
];

/** The door intercom: a small menu that sets who may come into your room. */
export function openIntercom(host: HTMLElement, roomId: string, current: () => Access, onClose: () => void): IntercomApi {
  let closed = false;
  const body = h("div", { class: "intercom-body" });
  const el = h("div", { class: "cd-popup intercom", role: "dialog", "aria-label": "Door intercom" },
    h("div", { class: "cd-head" }, h("strong", {}, "Door intercom"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);

  function render(): void {
    const cur = current() === "knock" ? "closed" : current(); // an older "knock" room counts as friends
    body.replaceChildren(
      h("div", { class: "hint" }, "Room open to:"),
      h("div", { class: "row center" }, ...CHOICES.map((c) =>
        h("button", {
          class: "btn small" + (cur === c.access ? " primary" : ""),
          onclick: () => { void updateRoom(roomId, { access: c.access }).then(() => { toast(`Room open to: ${c.label.toLowerCase()}.`); render(); }, () => toast("The hotel refused that change.", "err")); },
        }, c.label))),
      h("div", { class: "hint" }, CHOICES.find((c) => c.access === cur)?.help ?? ""));
  }
  render();
  const tick = window.setInterval(render, 1500); // follows changes made elsewhere
  function close(): void {
    if (closed) return;
    closed = true;
    window.clearInterval(tick);
    el.remove();
    onClose();
  }
  return { close };
}
