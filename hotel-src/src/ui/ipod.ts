import { h, toast } from "./dom";
import { mountSoundcloud } from "./soundcloud";
import type { ScHandle } from "./soundcloud";
import { BEATSHOP_OWNED_KEY } from "../shared/beats";
import type { Ctx } from "../main";

export interface IpodApi { close(): void }

/**
 * The iPod: SoundCloud and your own BeatShop, from wherever you are. It opens as a phone-sized window: the home screen with the two apps, and
 * SoundCloud inside it (the same page as in the hideout computers, without the speaker). The BeatShop opens on its own window, as it does at the machine.
 */
export function openIpod(host: HTMLElement, ctx: Ctx, openBeats: () => void, onClose: () => void): IpodApi {
  const me = ctx.profile;
  let closed = false;
  let page: "home" | "sound" = "home";
  let sc: ScHandle | null = null;
  const body = h("div", { class: "hc-body" });
  const title = h("div", { class: "hc-title" }, "iPod");
  const back = h("button", { class: "hc-done", onclick: () => go("home") }, "Home");
  const nav = h("div", { class: "hc-nav" }, title, h("button", { class: "hc-done", onclick: () => close() }, "Done"));
  const card = h("div", { class: "hc-card ipod-card", role: "dialog", "aria-label": "iPod" }, nav, body);
  const el = h("div", { class: "hc-overlay", onclick: (e: Event) => { if (e.target === el) close(); } }, card);
  host.append(el);

  function go(p: "home" | "sound"): void {
    page = p;
    if (page !== "sound" && sc) { sc.dispose(); sc = null; } // (leaving SoundCloud stops the music)
    render();
  }
  function app(label: string, hint: string, svg: string, onclick: () => void): HTMLElement {
    return h("button", { class: "ipod-app", type: "button", onclick },
      h("span", { class: "ipod-app-ico", innerHTML: svg }), h("span", { class: "ipod-app-text" }, h("b", {}, label), h("small", {}, hint)));
  }
  function render(): void {
    if (closed) return;
    nav.replaceChildren(page === "home" ? title : back, ...(page === "home" ? [] : [title]), h("button", { class: "hc-done", onclick: () => close() }, "Done"));
    title.textContent = page === "home" ? "iPod" : "SoundCloud";
    body.classList.toggle("sound", page === "sound");
    if (page === "sound") {
      const host2 = h("div", { class: "sc-host" });
      body.replaceChildren(host2);
      sc = mountSoundcloud(host2, { me });
      return;
    }
    const haveShop = !!me.owned[BEATSHOP_OWNED_KEY];
    body.replaceChildren(
      app("SoundCloud", "Charts, all music, your songs", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V5l11-2v12.5a3 2.6 0 1 1-2-2.4V6.5L11 7.8v9.7A3 2.6 0 1 1 9 17.5z" fill="currentColor"/></svg>', () => go("sound")),
      app("BeatShop", haveShop ? "Your beats, sales and chats" : "You haven't got a BeatShop (the record shop sells it)", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v3H4zm1 4h14v9H5zm3 2v5h2v-5zm4 0v5h4v-5z" fill="currentColor"/></svg>', () => {
        if (!haveShop) return toast("You haven't got a BeatShop yet. The record shop in the store sells one.", "err");
        close();
        openBeats();
      }));
  }
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    sc?.dispose(); sc = null;
    el.remove();
    onClose();
  }
  return { close };
}
