import { h, toast } from "./dom";
import { mountEditor } from "./editor";
import { buyItems } from "../db";
import { BLOOD_ICON, MUSIC_ACCESS_KEY, MUSIC_ACCESS_PRICE } from "../items";
import { TRACKS } from "../music";
import { EMOTES, emoteKey, hasEmote } from "../emotes";
import type { Ctx } from "../main";

type ShopTab = "clothing" | "emotes" | "music";

/** The shop: clothing (try-on editor) and the jukebox pass. Everything is priced in drops of blood. */
export function mountShop(root: HTMLElement, ctx: Ctx): () => void {
  let tab: ShopTab = "clothing";
  let inner: (() => void) | null = null;

  const tabs = h("div", { class: "shop-tabs" });
  const content = h("div", { class: "shop-content" });
  root.append(h("div", { class: "shop" }, tabs, content));

  function show(next: ShopTab): void {
    tab = next;
    inner?.();
    inner = null;
    content.replaceChildren();
    tabs.replaceChildren(
      ...([["clothing", "Clothing"], ["emotes", "Emotes"], ["music", "Music access"]] as Array<[ShopTab, string]>).map(([id, label]) =>
        h("button", { class: "tab big" + (tab === id ? " on" : ""), onclick: () => show(id) }, label)));
    inner = tab === "clothing" ? mountEditor(content, ctx, "shop")
      : tab === "emotes" ? mountEmoteShop(content, ctx, () => show("emotes"))
      : mountMusicShop(content, ctx, () => show("music"));
  }

  show("clothing");
  return () => inner?.();
}

function mountEmoteShop(root: HTMLElement, ctx: Ctx, rerender: () => void): () => void {
  const p = ctx.profile;
  const free = EMOTES.filter((e) => e.price === 0);
  const paid = EMOTES.filter((e) => e.price > 0);
  root.append(
    h("div", { class: "panel" },
      h("h2", {}, "Emotes"),
      h("p", { class: "muted" }, `You already have: ${free.map((e) => `${e.icon} ${e.name}`).join("  ")}. Unlocked emotes show up in the Emotes tab in the lobby, or type /name in chat.`),
      h("div", { class: "emote-shop" }, ...paid.map((e) => {
        const owned = hasEmote(p, e.id);
        const affordable = p.blood >= e.price;
        return h("div", { class: "emote-card" + (owned ? " owned" : "") },
          h("div", { class: "emote-card-icon" }, e.icon),
          h("div", { class: "emote-card-name" }, e.name),
          h("div", { class: "hint" }, e.desc),
          owned
            ? h("div", { class: "ok-text" }, "✔ Owned")
            : h("button", {
                class: "btn small primary",
                disabled: !affordable,
                title: affordable ? "" : `You need ${e.price - p.blood} more drops`,
                onclick: async () => {
                  try {
                    await buyItems(p, [emoteKey(e.id)], e.price);
                    ctx.refreshHeader();
                    toast(`${e.name} unlocked! Try /${e.id} in a room.`);
                    rerender();
                  } catch (err) {
                    toast((err as Error).message, "err");
                  }
                },
              }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${e.price}`));
      }))));
  return () => undefined;
}

function mountMusicShop(root: HTMLElement, ctx: Ctx, rerender: () => void): () => void {
  const p = ctx.profile;
  const owned = !!p.owned[MUSIC_ACCESS_KEY];
  const affordable = p.blood >= MUSIC_ACCESS_PRICE;

  root.append(
    h("div", { class: "panel music-card" },
      h("h2", {}, "Jukebox pass"),
      h("p", {}, `Stream music while you're in the hotel. Includes ${TRACKS.length} track${TRACKS.length === 1 ? "" : "s"} for now; more get added over time.`),
      h("ul", { class: "muted" }, ...TRACKS.map((t) => h("li", {}, `♪ ${t.title}`))),
      owned
        ? h("div", {}, h("p", { class: "ok-text" }, "✔ You own this."), h("button", { class: "btn primary", onclick: () => ctx.navigate("room") }, "Go listen (Music tab in the lobby)"))
        : h("div", {},
            h("button", {
              class: "btn primary",
              disabled: !affordable,
              onclick: async () => {
                try {
                  await buyItems(p, [MUSIC_ACCESS_KEY], MUSIC_ACCESS_PRICE);
                  ctx.refreshHeader();
                  toast("Jukebox pass unlocked! Open the Music tab in the lobby.");
                  rerender();
                } catch (err) {
                  toast((err as Error).message, "err");
                }
              },
            }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` Buy for ${MUSIC_ACCESS_PRICE} drops`),
            affordable ? null : h("p", { class: "muted" }, `You have ${p.blood}. Stab a player in the lobby to earn a drop each day.`))));
  return () => undefined;
}
