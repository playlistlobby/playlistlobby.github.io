import { h, toast } from "./dom";
import { mountEditor } from "./editor";
import { buyInventoryItem, buyItems } from "../db";
import { BLOOD_ICON, ITEMS, MUSIC_ACCESS_KEY } from "../items";
import { TRACKS } from "../music";
import { EMOTES, emoteForSale, emoteKey, emotePrice, hasEmote } from "../emotes";
import { itemEntry, musicEntry, onShopConfig } from "../shopConfig";
import { logAction } from "../logger";
import type { Ctx } from "../main";

type ShopTab = "clothing" | "emotes" | "items" | "music";

const drops = (n: number) => h("span", {}, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${n}`);

/** The shop. What's on sale and for how much is decided by the admin (Admin > Clothes & Items). */
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
      ...([["clothing", "Clothing"], ["emotes", "Emotes"], ["items", "Items"], ["music", "Music"]] as Array<[ShopTab, string]>).map(([id, label]) =>
        h("button", { class: "tab big" + (tab === id ? " on" : ""), onclick: () => show(id) }, label)));
    const again = () => show(tab);
    inner = tab === "clothing" ? mountEditor(content, ctx, "shop")
      : tab === "emotes" ? mountEmoteShop(content, ctx, again)
      : tab === "items" ? mountItemShop(content, ctx, again)
      : mountMusicShop(content, ctx, again);
  }

  show("clothing");
  // if the admin changes what's on sale while you're browsing, refresh (but not mid-purchase on the clothing tab)
  const off = onShopConfig(() => { if (tab !== "clothing") show(tab); });
  return () => { off(); inner?.(); };
}

function mountEmoteShop(root: HTMLElement, ctx: Ctx, rerender: () => void): () => void {
  const p = ctx.profile;
  const free = EMOTES.filter((e) => emotePrice(e) === 0);
  const sale = EMOTES.filter((e) => e.price > 0 && emotePrice(e) > 0 && (emoteForSale(e) || hasEmote(p, e.id)));
  root.append(
    h("div", { class: "panel" },
      h("h2", {}, "Emotes"),
      h("p", { class: "muted" }, `You already have: ${free.map((e) => `${e.icon} ${e.name}`).join("  ")}. Unlocked emotes show up in the Emotes tab in the lobby, or type /name in chat.`),
      sale.length === 0 ? h("p", { class: "muted" }, "Nothing on sale right now. Check back soon.") : null,
      h("div", { class: "emote-shop" }, ...sale.map((e) => {
        const owned = hasEmote(p, e.id);
        const price = emotePrice(e);
        const affordable = p.blood >= price;
        return h("div", { class: "emote-card" + (owned ? " owned" : "") },
          h("div", { class: "emote-card-icon" }, e.icon),
          h("div", { class: "emote-card-name" }, e.name),
          h("div", { class: "hint" }, e.desc),
          owned
            ? h("div", { class: "ok-text" }, "✔ Owned")
            : h("button", {
                class: "btn small primary",
                disabled: !affordable,
                title: affordable ? "" : `You need ${price - p.blood} more drops`,
                onclick: async () => {
                  try {
                    await buyItems(p, [emoteKey(e.id)], price);
                    ctx.refreshHeader();
                    logAction(p, "buy", `bought the ${e.name} emote for ${price}`);
                    toast(`${e.name} unlocked! Try /${e.id} in the lobby.`);
                    rerender();
                  } catch (err) {
                    toast((err as Error).message, "err");
                  }
                },
              }, drops(price)));
      }))));
  return () => undefined;
}

function mountItemShop(root: HTMLElement, ctx: Ctx, rerender: () => void): () => void {
  const p = ctx.profile;
  const forSale = Object.values(ITEMS).filter((it) => itemEntry(it.id).on);
  const have = (id: string) => p.inventory.filter((s) => s?.item === id).length;
  root.append(
    h("div", { class: "panel" },
      h("h2", {}, "Items"),
      forSale.length === 0 ? h("p", { class: "muted" }, "No items on sale right now. Check back soon.") : h("p", { class: "muted" }, "Bought items go straight into your inventory."),
      h("div", { class: "emote-shop" }, ...forSale.map((it) => {
        const price = itemEntry(it.id).price;
        const affordable = p.blood >= price;
        return h("div", { class: "emote-card" },
          h("img", { src: it.icon, alt: it.name, style: { width: "48px", height: "48px", imageRendering: "pixelated" } }),
          h("div", { class: "emote-card-name" }, it.name),
          h("div", { class: "hint" }, it.examine),
          have(it.id) ? h("div", { class: "hint" }, `You have ${have(it.id)}`) : null,
          h("button", {
            class: "btn small primary",
            disabled: !affordable,
            title: affordable ? "" : `You need ${price - p.blood} more drops`,
            onclick: async () => {
              try {
                await buyInventoryItem(p, it.id, price);
                ctx.refreshHeader();
                logAction(p, "buy", `bought a ${it.name} for ${price}`);
                toast(`${it.name} added to your inventory.`);
                rerender();
              } catch (err) {
                toast((err as Error).message, "err");
              }
            },
          }, drops(price)));
      }))));
  return () => undefined;
}

function mountMusicShop(root: HTMLElement, ctx: Ctx, rerender: () => void): () => void {
  const p = ctx.profile;
  const entry = musicEntry();
  const owned = !!p.owned[MUSIC_ACCESS_KEY];
  const affordable = p.blood >= entry.price;

  root.append(
    h("div", { class: "panel music-card" },
      h("h2", {}, "Jukebox pass"),
      h("p", {}, `Stream music while you're in 6ixPlanet. Includes ${TRACKS.length} track${TRACKS.length === 1 ? "" : "s"} for now; more get added over time.`),
      h("ul", { class: "muted" }, ...TRACKS.map((t) => h("li", {}, `♪ ${t.title}`))),
      owned
        ? h("div", {}, h("p", { class: "ok-text" }, "✔ You own this."), h("button", { class: "btn primary", onclick: () => ctx.navigate("room") }, "Go listen (Music tab in the lobby)"))
        : !entry.on
          ? h("p", { class: "muted" }, "The jukebox pass isn't on sale right now.")
          : h("div", {},
              h("button", {
                class: "btn primary",
                disabled: !affordable,
                onclick: async () => {
                  try {
                    await buyItems(p, [MUSIC_ACCESS_KEY], entry.price);
                    ctx.refreshHeader();
                    logAction(p, "buy", `bought the jukebox pass for ${entry.price}`);
                    toast("Jukebox pass unlocked! Open the Music tab in the lobby.");
                    rerender();
                  } catch (err) {
                    toast((err as Error).message, "err");
                  }
                },
              }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` Buy for ${entry.price} drops`),
              affordable ? null : h("p", { class: "muted" }, `You have ${p.blood}. Stab people in the lobby to earn drops.`))));
  return () => undefined;
}
