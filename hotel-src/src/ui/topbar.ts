import { h } from "./dom";
import { sfxMuted, setSfxMuted } from "../sfx";
import { autoplantOn, setAutoplant } from "../settings";
import { BLOOD_ICON } from "../items";
import { FLAG_SVG, Lang, LANG, setLang } from "../lang";
import type { View } from "../main";

export interface TopBarOpts {
  appName: string;
  isAdmin: boolean;
  /** a mod or an admin: the 🛡 button (top right) opens the chat mod page */
  isMod?: boolean;
  onNav(view: View): void;
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
 * the drops-of-blood counter in the middle and a menu (Admin, sounds, log out) on the right. (Character is the bag of clothes in your room; the shop is the yellow door in the basement, and the wardrobe in it opens the clothing shop.)
 * On phones it wraps into two rows so everything stays tappable.
 */
/** a small flag (drawn as a picture: flag emoji do not show on Windows) */
function flag(lang: Lang): HTMLElement {
  const s = document.createElement("span");
  s.className = "flag-ico";
  s.innerHTML = FLAG_SVG[lang];
  return s;
}

export function topBar(o: TopBarOpts): TopBarApi {
  // every page (Character, Shop, Admin) has its own Go back button, so there is no Room tab, and no Shop button any more
  const badge = h("span", { class: "badge hidden", "data-friends-badge": "1" });
  const friendsBtn = h("button", { class: "barbtn nav-friends", title: "Friends", onclick: () => window.dispatchEvent(new CustomEvent("toggle-friends")) }, "👥", badge);
  const coins = h("span", { class: "coins", title: "Drops of blood" });
  const pill = h("div", { class: "nav-blood", "aria-label": "Drops of blood" }, coins);

  let menu: HTMLElement | null = null;
  const closeMenu = () => { menu?.remove(); menu = null; };
  const menuBtn = h("button", { class: "barbtn nav-menu", title: "Menu", "aria-label": "Menu", onclick: (e: Event) => {
    e.stopPropagation();
    if (menu) return closeMenu();
    menu = h("div", { class: "nav-pop", role: "menu" },
      ...(o.isAdmin ? [h("button", { class: "nav-pop-item", onclick: () => { closeMenu(); o.onNav("admin"); } }, "🛠 Admin")] : []),
      h("button", { class: "nav-pop-item", onclick: (ev: Event) => {
        setSfxMuted(!sfxMuted());
        (ev.currentTarget as HTMLElement).textContent = sfxMuted() ? "🔇 Sounds: off" : "🔊 Sounds: on";
      } }, sfxMuted() ? "🔇 Sounds: off" : "🔊 Sounds: on"),
      h("button", { class: "nav-pop-item", title: "With autoplant on, tapping an empty growing kit plants a seed from your pocket", onclick: (ev: Event) => {
        setAutoplant(!autoplantOn());
        (ev.currentTarget as HTMLElement).textContent = autoplantOn() ? "🌱 Autoplant: on" : "🌱 Autoplant: off";
      } }, autoplantOn() ? "🌱 Autoplant: on" : "🌱 Autoplant: off"),
      // the language: the flag of the one you are in; tap it to switch to the other
      h("button", { class: "nav-pop-item lang-item", title: LANG === "da" ? "Switch to English" : "Skift til dansk", onclick: () => setLang(LANG === "da" ? "en" : "da") }, flag(LANG), LANG === "da" ? "Dansk" : "English"),
      h("button", { class: "nav-pop-item danger", onclick: () => { closeMenu(); o.onLogout(); } }, "Log out"));
    right.append(menu);
    const away = (ev: Event) => {
      if (menu && ev.target instanceof Node && (menu.contains(ev.target) || menuBtn.contains(ev.target))) return;
      closeMenu();
      window.removeEventListener("pointerdown", away);
    };
    setTimeout(() => window.addEventListener("pointerdown", away), 0);
  } }, "⚙");

  const modBtn = o.isMod ? h("button", { class: "barbtn nav-mod", title: "Moderation", "aria-label": "Moderation", onclick: () => o.onNav("mod") }, "🛡") : null;
  const right = h("div", { class: "nav-right" }, ...(modBtn ? [modBtn] : []), menuBtn);
  const el = h("header", { class: "navbar" },
    h("div", { class: "nav-left" }, friendsBtn, h("div", { class: "nav-logo" }, h("img", { src: BLOOD_ICON, alt: "", class: "blood-ico" }), o.appName)),
    pill, right);

  return {
    el,
    setActive() { closeMenu(); },
    refreshBlood(blood) {
      coins.replaceChildren(h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "drops of blood" }), ` ${blood}`);
    },
    setBadge(n) {
      badge.textContent = String(n);
      badge.classList.toggle("hidden", n === 0);
    },
  };
}
