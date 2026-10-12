import { h, toast, trimCanvas } from "./dom";
import { renderAvatar } from "../avatarService";
import { allItemsBySlot, Item, SLOTS } from "../catalog";
import { BLOOD_ICON, ITEMS } from "../items";
import { EMOTES, emotePrice } from "../emotes";
import { logAction } from "../logger";
import { clearShopEntry, itemEntry, musicEntry, saveShopEntry, shopConfig } from "../shopConfig";
import { buildItemIconPack, figureWearing, listSets, SetInfo } from "../templateExport";
import { download } from "../zip";
import type { Ctx } from "../main";

type Sub = "clothing" | "emotes" | "items";

/** Admin > Shop: decide what is on sale and for how much. (Making new clothes is in the Studio tab.) */
export function mountAdminShop(root: HTMLElement, ctx: Ctx): () => void {
  let sub: Sub = "clothing";
  let off: (() => void) | null = null;
  const subTabs = h("div", { class: "tabs" });
  const host = h("div", {});
  root.append(subTabs, host);

  const saved = (what: string) => logAction(ctx.profile, "admin", what);
  const failed = () => toast("Couldn't save (are you still signed in as admin?)", "err");
  const priceBox = (value: number, onChange: (n: number) => void, disabled = false) => {
    const input = h("input", { type: "number", min: 0, max: 999, value: String(value), disabled, onchange: () => onChange(Math.max(0, Math.min(999, Number(input.value) || 0))) });
    return input;
  };

  function open(next: Sub): void {
    off?.();
    sub = next;
    subTabs.replaceChildren(...([["clothing", "Clothing"], ["emotes", "Emotes"], ["items", "Items & music"]] as Array<[Sub, string]>).map(([id, label]) =>
      h("button", { class: "tab" + (id === sub ? " on" : ""), onclick: () => open(id) }, label)));
    host.replaceChildren();
    off = (sub === "clothing" ? clothingTab : sub === "emotes" ? emotesTab : itemsTab)(host);
  }

  // ---- clothing --------------------------------------------------------------------------------------------
  function clothingTab(el: HTMLElement): () => void {
    let slot = "ch";
    let gender = "";
    let status = "";
    let search = "";
    let page = 0;
    const PAGE = 24;
    const selected = new Set<string>(); // "type:id"
    const catalogItem = (type: string, id: string): Item | undefined => allItemsBySlot()[type]?.find((i) => i.id === id);

    const slotSel = h("select", { onchange: () => { slot = slotSel.value; page = 0; draw(); } }, ...SLOTS.map((s) => h("option", { value: s.id }, s.label)));
    slotSel.value = slot;
    const genderSel = h("select", { onchange: () => { gender = genderSel.value; page = 0; draw(); } },
      h("option", { value: "" }, "Any gender"), h("option", { value: "M" }, "Boys"), h("option", { value: "F" }, "Girls"), h("option", { value: "U" }, "Unisex"));
    const statusSel = h("select", { onchange: () => { status = statusSel.value; page = 0; draw(); } },
      ...[["", "All items"], ["shop", "In the shop"], ["noshop", "Not in the shop"], ["free", "Free (everyone owns)"], ["club", "Club only"]].map(([v, l]) => h("option", { value: v }, l)));
    const searchBox = h("input", { class: "mini-input", placeholder: "Find by id…", oninput: () => { search = searchBox.value.trim(); page = 0; draw(); } });
    const bar = h("div", { class: "admin-bar" });
    const grid = h("div", { class: "apanel-grid" });
    const pager = h("div", { class: "row center", style: { margin: "10px 0" } });

    function statusOf(info: SetInfo): "club" | "free" | "shop" | "noshop" {
      const it = catalogItem(info.type, info.id);
      if (!it) return "club"; // club/unselectable sets aren't in the catalogue at all
      if (it.starter || it.price === 0) return "free";
      return it.shopOn ? "shop" : "noshop";
    }
    const filtered = (): SetInfo[] => listSets(slot).filter((s) => (!gender || s.gender === gender) && (!status || statusOf(s) === status) && (!search || s.id.includes(search)));

    async function bulk(action: "on" | "off" | "reset", price: number): Promise<void> {
      const targets = [...selected].map((k) => ({ type: k.split(":")[0], id: k.split(":")[1] })).filter((r) => {
        const it = catalogItem(r.type, r.id);
        return it && !it.starter;
      });
      if (!targets.length) return toast("None of the ticked items can be sold (club or free items can't).", "err");
      try {
        await Promise.all(targets.map((r) => {
          const key = `${r.type}_${r.id}`;
          return action === "reset" ? clearShopEntry("clothing", key) : saveShopEntry("clothing", key, { on: action === "on", price });
        }));
        saved(`${action === "reset" ? "reset" : action === "on" ? `put in the shop at ${price}` : "removed from the shop"}: ${targets.length} clothing items`);
        toast(`Updated ${targets.length} item${targets.length === 1 ? "" : "s"}`);
        draw();
      } catch { failed(); }
    }

    const bulkPrice = h("input", { type: "number", min: 0, max: 999, value: "2", style: { width: "56px", padding: "4px", borderRadius: "5px", border: "1px solid #9ea5b0", textAlign: "center" } });

    function card(info: SetInfo): HTMLElement {
      const key = `${info.type}:${info.id}`;
      const it = catalogItem(info.type, info.id);
      const st = statusOf(info);
      const slotMeta = SLOTS.find((s) => s.id === info.type)!;
      const thumb = h("div", { class: "thumb" });
      renderAvatar({ figure: figureWearing(info), dir: 2, headDir: 2, headOnly: slotMeta.headOnly }).then((c) => {
        if (!c || !thumb.isConnected) return;
        const t = trimCanvas(c);
        t.className = "thumb-canvas";
        thumb.replaceChildren(t);
      });
      const sellable = !!it && !it.starter && st !== "club";
      const hasEntry = !!shopConfig.clothing[`${info.type}_${info.id}`];
      return h("div", { class: "acard" + (selected.has(key) ? " sel" : "") },
        h("span", { class: "tag " + (st === "free" ? "free" : st === "club" ? "club" : st === "noshop" ? "off" : "") }, st === "free" ? (it?.custom ? "made here" : it?.starter ? "starter" : "free") : st === "club" ? "club" : st === "shop" ? "in shop" : "not sold"),
        thumb,
        h("div", {}, h("b", {}, `${info.type}-${info.id}`)),
        h("div", { class: "nm" }, `${info.gender === "U" ? "unisex" : info.gender === "F" ? "girls" : "boys"}${info.colors ? ` · ${info.colors} colour${info.colors > 1 ? "s" : ""}` : ""}`),
        h("label", {}, h("input", { type: "checkbox", checked: selected.has(key), onchange: (e: Event) => { (e.target as HTMLInputElement).checked ? selected.add(key) : selected.delete(key); draw(); } }), "select"),
        sellable
          ? h("div", { class: "row center", style: { gap: "4px" } },
              h("label", {}, h("input", {
                type: "checkbox", checked: it!.shopOn,
                onchange: async (e: Event) => {
                  try { await saveShopEntry("clothing", `${info.type}_${info.id}`, { on: (e.target as HTMLInputElement).checked, price: it!.price }); saved(`${(e.target as HTMLInputElement).checked ? "put" : "removed"} ${info.type}-${info.id} ${(e.target as HTMLInputElement).checked ? "in" : "from"} the shop`); draw(); } catch { failed(); }
                },
              }), "shop"),
              priceBox(it!.price, async (n) => {
                try { await saveShopEntry("clothing", `${info.type}_${info.id}`, { on: it!.shopOn, price: n }); saved(`set ${info.type}-${info.id} to ${n} drops`); draw(); } catch { failed(); }
              }),
              h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "drops" }))
          : h("div", { class: "hint" }, st === "club" ? "club item: can't be sold" : "free for everyone"),
        sellable && hasEntry ? h("button", { class: "btn small", onclick: async () => { try { await clearShopEntry("clothing", `${info.type}_${info.id}`); draw(); } catch { failed(); } } }, "Reset") : null);
    }

    function draw(): void {
      const all = filtered();
      const pages = Math.max(1, Math.ceil(all.length / PAGE));
      if (page >= pages) page = pages - 1;
      bar.replaceChildren(slotSel, genderSel, statusSel, searchBox, h("span", { class: "hint" }, `${all.length} items · ${selected.size} selected`));
      grid.replaceChildren(...all.slice(page * PAGE, (page + 1) * PAGE).map(card));
      pager.replaceChildren(
        h("button", { class: "btn small", disabled: page === 0, onclick: () => { page--; draw(); } }, "‹"),
        h("span", { class: "hint" }, `${page + 1} / ${pages}`),
        h("button", { class: "btn small", disabled: page >= pages - 1, onclick: () => { page++; draw(); } }, "›"));
    }

    const actionsBar = h("div", { class: "panel", style: { marginBottom: "10px" } },
      h("div", { class: "row" },
        h("b", {}, "Ticked items:"),
        h("button", { class: "btn small", onclick: () => { filtered().slice(page * PAGE, (page + 1) * PAGE).forEach((s) => selected.add(`${s.type}:${s.id}`)); draw(); } }, "Select this page"),
        h("button", { class: "btn small", onclick: () => { selected.clear(); draw(); } }, "Clear"),
        h("button", { class: "btn small primary", onclick: () => void bulk("on", Math.max(0, Math.min(999, Number(bulkPrice.value) || 0))) }, "Put in shop at"), bulkPrice,
        h("button", { class: "btn small", onclick: () => void bulk("off", 0) }, "Remove from shop"),
        h("button", { class: "btn small", onclick: () => void bulk("reset", 0) }, "Reset to default")),
      h("p", { class: "hint", style: { margin: "6px 0 0" } }, "Clothes you make yourself live in the Studio tab; set their price there."));
    el.append(actionsBar, bar, grid, pager);
    draw();
    return () => undefined;
  }

  // ---- emotes ----------------------------------------------------------------------------------------------
  function emotesTab(el: HTMLElement): () => void {
    const rows = EMOTES.map((e) => {
      const free = e.price === 0;
      const entry = shopConfig.emotes[e.id];
      const on = entry ? entry.on : true;
      const price = emotePrice(e);
      return h("tr", {},
        h("td", { style: { fontSize: "22px" } }, e.icon), h("td", {}, h("b", {}, e.name)), h("td", { class: "hint" }, e.desc),
        ...(free ? [h("td", { colspan: "3", class: "hint" }, "Always free for everyone")]
          : [
            h("td", { class: "num" }, String(e.price)),
            h("td", {}, h("label", {}, h("input", {
              type: "checkbox", checked: on,
              onchange: async (ev: Event) => { try { await saveShopEntry("emotes", e.id, { on: (ev.target as HTMLInputElement).checked, price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the ${e.name} emote ${(ev.target as HTMLInputElement).checked ? "in" : "from"} the shop`); } catch { failed(); } },
            }), " on sale")),
            h("td", {}, priceBox(price, async (n) => { try { await saveShopEntry("emotes", e.id, { on, price: n }); saved(`set the ${e.name} emote to ${n} drops${n === 0 ? " (free for everyone)" : ""}`); } catch { failed(); } }),
              entry ? h("button", { class: "btn small", style: { marginLeft: "6px" }, onclick: async () => { try { await clearShopEntry("emotes", e.id); reopen(); } catch { failed(); } } }, "Reset") : null),
          ]));
    });
    const reopen = () => { el.replaceChildren(); emotesTab(el); };
    el.append(
      h("p", { class: "hint" }, "A price of 0 makes an emote free for everyone. Changes apply to players straight away."),
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["", "Emote", "What it does", "Default", "Shop", "Price (drops)"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...rows))));
    return () => undefined;
  }

  // ---- items & music ---------------------------------------------------------------------------------------
  function itemsTab(el: HTMLElement): () => void {
    const itemRows = Object.values(ITEMS).map((it) => {
      const e = itemEntry(it.id);
      return h("tr", {},
        h("td", {}, h("img", { src: it.icon, alt: "", style: { width: "32px", height: "32px", imageRendering: "pixelated" } })),
        h("td", {}, h("b", {}, it.name)), h("td", { class: "hint" }, it.examine),
        h("td", {}, h("label", {}, h("input", {
          type: "checkbox", checked: e.on,
          onchange: async (ev: Event) => { try { await saveShopEntry("items", it.id, { on: (ev.target as HTMLInputElement).checked, price: e.price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the ${it.name} ${(ev.target as HTMLInputElement).checked ? "in" : "from"} the shop`); } catch { failed(); } },
        }), " sold in shop")),
        h("td", {}, priceBox(e.price, async (n) => { try { await saveShopEntry("items", it.id, { on: e.on, price: n }); saved(`set the ${it.name} to ${n} drops`); } catch { failed(); } })));
    });
    const m = musicEntry();
    const musicRow = h("tr", {},
      h("td", { style: { fontSize: "22px" } }, "♪"), h("td", {}, h("b", {}, "Jukebox pass")), h("td", { class: "hint" }, "Unlocks the Music tab in every room"),
      h("td", {}, h("label", {}, h("input", {
        type: "checkbox", checked: m.on,
        onchange: async (ev: Event) => { try { await saveShopEntry("music", "pass", { on: (ev.target as HTMLInputElement).checked, price: m.price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the jukebox pass ${(ev.target as HTMLInputElement).checked ? "in" : "from"} the shop`); } catch { failed(); } },
      }), " sold in shop")),
      h("td", {}, priceBox(m.price, async (n) => { try { await saveShopEntry("music", "pass", { on: m.on, price: n }); saved(`set the jukebox pass to ${n} drops`); } catch { failed(); } })));
    el.append(
      h("p", { class: "hint" }, "Everyone starts with a knife, a CD and a syringe. Turn an item on to sell extra copies; it goes into the buyer's inventory."),
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["", "Item", "What it does", "Shop", "Price (drops)"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...itemRows, musicRow))),
      h("div", { class: "row", style: { marginTop: "10px" } },
        h("button", { class: "btn small", onclick: async () => {
          try {
            const blob = await buildItemIconPack([...Object.values(ITEMS).map((i) => ({ name: i.id, url: i.icon })), { name: "blood", url: BLOOD_ICON }]);
            download(blob, "6ixplanet-item-icons.zip");
            saved("exported the item icons");
          } catch (err) { toast(`Export failed: ${(err as Error).message}`, "err"); }
        } }, "Download item icons (.zip)")));
    return () => undefined;
  }

  open("clothing");
  return () => off?.();
}
