import { h } from "./dom";

/** "9:41 AM", like iOS */
export function clockText(d = new Date()): string {
  const hours = d.getHours() % 12 || 12;
  return `${hours}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "AM" : "PM"}`;
}

let ticking = false;
function startClock(): void {
  if (ticking) return;
  ticking = true;
  setInterval(() => {
    document.querySelectorAll(".sb-time").forEach((el) => (el.textContent = clockText()));
    document.querySelectorAll(".lock-clock .t").forEach((el) => (el.textContent = lockTime()));
  }, 10_000);
}
export function lockTime(d = new Date()): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const svg = (markup: string): HTMLElement => {
  const span = document.createElement("span");
  span.innerHTML = markup;
  return span.firstElementChild as HTMLElement;
};

/** The iOS 6 status bar (same as the Playlist app): signal, carrier, clock, battery. */
export function statusBar(): HTMLElement {
  startClock();
  const bars = h("span", { class: "sb-bars" }, ...[3, 4.5, 6, 7.5, 9].map((px) => h("i", { style: { height: px + "px" } })));
  const wifi = svg('<svg width="13" height="10" viewBox="0 0 13 10"><path d="M6.5 2.2c1.9 0 3.6.7 4.9 1.9l1-1C10.8 1.6 8.8.8 6.5.8S2.2 1.6.6 3.1l1 1C2.9 2.9 4.6 2.2 6.5 2.2zm0 2.6c1.2 0 2.2.4 3 1.2l1-1C9.4 4 8 3.4 6.5 3.4S3.6 4 2.5 5l1 1c.8-.8 1.8-1.2 3-1.2zm0 2.6c-.5 0-.9.2-1.2.5L6.5 9.2l1.2-1.3c-.3-.3-.7-.5-1.2-.5z" fill="#fff"/></svg>');
  const battery = svg('<svg width="23" height="11" viewBox="0 0 23 11"><rect x=".6" y=".6" width="19" height="9.8" rx="1.6" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="2" y="2" width="16.2" height="7" rx=".6" fill="#fff"/><rect x="20.4" y="3.4" width="1.8" height="4.2" rx=".6" fill="#fff"/></svg>');
  return h("div", { class: "sb-status", "aria-hidden": "true" },
    h("span", {}, bars, "6IX", wifi),
    h("span", { class: "sb-time" }, clockText()),
    h("span", {}, "100% ", battery));
}

export interface NavBarOpts {
  title: string;
  /** shows an iOS back button with this label that calls `onBack` */
  back?: { label: string; onBack: () => void };
  right?: Array<Node | string>;
}

/** The 44px iOS 6 navigation bar: back button on the left, title in the middle, buttons on the right. */
export function navBar(o: NavBarOpts): HTMLElement {
  return h("header", { class: "navbar" },
    h("div", { class: "barside" }, o.back ? h("button", { class: "barbtn back", onclick: o.back.onBack }, o.back.label) : null),
    h("div", { class: "title" }, o.title),
    h("div", { class: "barside right" }, ...(o.right ?? [])));
}
