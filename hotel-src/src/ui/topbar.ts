import { h } from "./dom";
import { sfxMuted, setSfxMuted } from "../sfx";
import { BLOOD_ICON } from "../items";
import type { View } from "../main";

export interface TopBarOpts {
  appName: string;
  isAdmin: boolean;
  onNav(view: View): void;
  onOutfits(): void;
  onLogout(): void;
}

export interface TopBarApi {
  el: HTMLElement;
  setActive(view: View): void;
  refreshBlood(blood: number): void;
  setBadge(n: number): void;
}

/**
 * The iOS 6 navigation bar: logo (and, on phones, the Friends button) on the left, the segmented control
 * Room | Character | Shop (| Admin) in the middle, drops of blood and a menu on the right.
 * On phones it wraps into two rows so everything stays tappable.
 */
export function topBar(o: TopBarOpts): TopBarApi {
  const tabs: Array<[View, string]> = [["room", "Room"], ["customize", "Character"], ["shop", "Shop"], ...(o.isAdmin ? [["admin", "Admin"] as [View, string]] : [])];
  const tabEls = new Map<View, HTMLElement>();
  const seg = h("nav", { class: "nav-tabs", "aria-label": "Sections" },
    ...tabs.map(([view, label]) => {
      const b = h("button", { class: "nav-tab", onclick: () => o.onNav(view) }, label);
      tabEls.set(view, b);
      return b;
    }));

  const badge = h("span", { class: "badge hidden", "data-friends-badge": "1" });
  const friendsBtn = h("button", { class: "barbtn nav-friends", title: "Friends", onclick: () => window.dispatchEvent(new CustomEvent("toggle-friends")) }, "👥", badge);
  const coins = h("span", { class: "coins", title: "Drops of blood" });
  const pill = h("span", { class: "barbtn blood-pill" }, coins);

  let menu: HTMLElement | null = null;
  const closeMenu = () => { menu?.remove(); menu = null; };
  const menuBtn = h("button", { class: "barbtn nav-menu", title: "Menu", "aria-label": "Menu", onclick: (e: Event) => {
    e.stopPropagation();
    if (menu) return closeMenu();
    menu = h("div", { class: "nav-pop", role: "menu" },
      h("button", { class: "nav-pop-item", onclick: () => { closeMenu(); o.onOutfits(); } }, "👕 Saved outfits"),
      h("button", { class: "nav-pop-item", onclick: (ev: Event) => {
        setSfxMuted(!sfxMuted());
        (ev.currentTarget as HTMLElement).textContent = sfxMuted() ? "🔇 Sounds: off" : "🔊 Sounds: on";
      } }, sfxMuted() ? "🔇 Sounds: off" : "🔊 Sounds: on"),
      h("button", { class: "nav-pop-item danger", onclick: () => { closeMenu(); o.onLogout(); } }, "Log out"));
    right.append(menu);
    const away = (ev: Event) => {
      if (menu && ev.target instanceof Node && (menu.contains(ev.target) || menuBtn.contains(ev.target))) return;
      closeMenu();
      window.removeEventListener("pointerdown", away);
    };
    setTimeout(() => window.addEventListener("pointerdown", away), 0);
  } }, "⚙");

  const right = h("div", { class: "nav-right" }, pill, menuBtn);
  const el = h("header", { class: "navbar" },
    h("div", { class: "nav-left" }, friendsBtn, h("div", { class: "nav-logo" }, h("img", { src: BLOOD_ICON, alt: "", class: "blood-ico" }), o.appName)),
    seg, right);

  return {
    el,
    setActive(view) { tabEls.forEach((b, v) => b.classList.toggle("on", v === view)); closeMenu(); },
    refreshBlood(blood) {
      coins.replaceChildren(h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "drops of blood" }), ` ${blood}`);
    },
    setBadge(n) {
      badge.textContent = String(n);
      badge.classList.toggle("hidden", n === 0);
    },
  };
}
