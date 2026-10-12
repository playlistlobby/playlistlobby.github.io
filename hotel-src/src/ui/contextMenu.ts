import { h } from "./dom";

export interface MenuOption {
  label: string;
  /** the highlighted noun, e.g. the player or item name (OSRS prints it in a different colour) */
  target?: string;
  danger?: boolean;
  action: () => void;
}

let open: HTMLElement | null = null;

export function closeMenu(): void {
  open?.remove();
  open = null;
}

/** OSRS-style right-click menu: dark box, "Choose Option" header, Cancel at the bottom. */
export function showMenu(x: number, y: number, options: MenuOption[]): void {
  closeMenu();
  const menu = h("div", { class: "ctx-menu" },
    h("div", { class: "ctx-head" }, "Choose Option"),
    ...options.map((o) =>
      h("div", {
        class: "ctx-opt",
        onclick: () => { closeMenu(); o.action(); },
      }, h("span", { class: o.danger ? "ctx-danger" : "" }, o.label), o.target ? h("span", { class: "ctx-target" }, " " + o.target) : null)),
    h("div", { class: "ctx-opt", onclick: closeMenu }, h("span", { class: "ctx-danger" }, "Cancel")));
  document.body.append(menu);
  const r = menu.getBoundingClientRect();
  menu.style.left = Math.min(x, window.innerWidth - r.width - 4) + "px";
  menu.style.top = Math.min(y, window.innerHeight - r.height - 4) + "px";
  open = menu;
  // closes on the next outside click / Escape / scroll
  setTimeout(() => {
    const away = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && menu.contains(e.target as Node)) return;
      closeMenu();
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", away);
      window.removeEventListener("blur", away);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", away);
    window.addEventListener("blur", away);
  }, 0);
}
