import { h, toast, trimCanvas } from "./dom";
import { renderAvatar } from "../avatarService";
import { allItemsBySlot, Item, SLOTS } from "../catalog";
import { BLOOD_ICON, DISABLED_ITEMS, ITEMS } from "../items";
import { EMOTES, emotePrice } from "../emotes";
import { logAction } from "../logger";
import { clearShop, clearShopEntry, itemEntry, musicEntry, resetShop, saveShopEntry, shopConfig } from "../shopConfig";
import { buildItemIconPack, figureWearing, listSets, SetInfo } from "../templateExport";
import { download } from "../zip";
import type { Ctx } from "../main";

type Sub = "clothing" | "furniture" | "sixty";

/** Admin > Shop: decide what is on sale and for how much. (Making new clothes is in the Studio tab.) */
export function mountAdminShop(root: HTMLElement, ctx: Ctx): () => void {
  let sub: Sub = "clothing";
  let off: (() => void) | null = null;
  const subTabs = h("div", { class: "tabs" });
  const host = h("div", {});
  const bigButtons = h("div", { class: "panel row", style: { marginBottom: "10px" } },
    h("button", { class: "btn danger", onclick: async () => {
      const typed = prompt("This takes EVERYTHING off sale (all clothing, emotes, items, the jukebox pass and your own designs). Prices are kept, so you can switch things back on one by one.\n\nType  clear  to confirm:");
      if (typed === null) return;
      if (typed.trim().toLowerCase() !== "clear") return void toast('Nothing changed. You have to type "clear".', "err");
      try {
        await clearShop(EMOTES.map((e) => ({ id: e.id, price: e.price })));
        saved("cleared the shop (everything off sale)");
        toast("The shop is empty.");
        open(sub);
      } catch { failed(); }
    } }, "Clear the shop"),
    h("button", { class: "btn", onclick: async () => {
      if (!confirm("Forget every shop change you made (prices, what's on sale) and go back to the defaults?")) return;
      try { await resetShop(); saved("reset the shop to its defaults"); toast("Shop reset to defaults."); open(sub); } catch { failed(); }
    } }, "Reset to defaults"),
    h("span", { class: "hint" }, "Clear the shop takes everything off sale in one go."));
  root.append(bigButtons, subTabs, host);

  const saved = (what: string) => logAction(ctx.profile, "admin", what);
  const failed = () => toast("Couldn't save (are you still signed in as admin?)", "err");
  const priceBox = (value: number, onChange: (n: number) => void, disabled = false) => {
    const input = h("input", { type: "number", min: 0, max: 999, value: String(value), disabled, onchange: () => onChange(Math.max(0, Math.min(999, Number(input.value) || 0))) });
    return input;
  };

  function open(next: Sub): void {
    off?.();
    sub = next;
    subTabs.replaceChildren(...([["clothing", "Clothing"], ["furniture", "Furniture"], ["sixty", "6ixty stock"]] as Array<[Sub, string]>).map(([id, label]) =>
      h("button", { class: "tab" + (id === sub ? " on" : ""), onclick: () => open(id) }, label)));
    host.replaceChildren();
    off = (sub === "clothing" ? clothingTab : sub === "furniture" ? furnitureTab : sixtyTab)(host);
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

    async function bulk(action: "on" | "off" | "reset" | "starter", price: number): Promise<void> {
      const targets = [...selected].map((k) => ({ type: k.split(":")[0], id: k.split(":")[1] })).filter((r) => {
        const it = catalogItem(r.type, r.id);
        // reset/starter can touch the admin's own starter ticks too; the shop actions only apply to things that can be sold
        return it && !it.baseStarter && !it.custom && (action === "reset" || action === "starter" || !it.starter);
      });
      if (!targets.length) return toast("None of the ticked items can be changed (club, built-in free and Studio items can't).", "err");
      try {
        await Promise.all(targets.map((r) => {
          const key = `${r.type}_${r.id}`;
          if (action === "starter") return saveShopEntry("clothing", key, { on: false, price: catalogItem(r.type, r.id)!.basePrice, starter: true });
          return action === "reset" ? clearShopEntry("clothing", key) : saveShopEntry("clothing", key, { on: action === "on", price });
        }));
        saved(`${action === "reset" ? "reset" : action === "starter" ? "made starter (free for everyone)" : action === "on" ? `put in the shop at ${price}` : "removed from the shop"}: ${targets.length} clothing items`);
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
      // the "starter" tick: everyone owns it for free (not for Studio items, which are already free until priced, nor the data's built-in starters)
      const canStarter = !!it && !it.custom && !it.baseStarter && st !== "club";
      const starterBox = canStarter
        ? h("label", { title: "Starter: free for everyone, never sold" }, h("input", {
            type: "checkbox", checked: it!.starter,
            onchange: async (e: Event) => {
              const on = (e.target as HTMLInputElement).checked;
              try {
                if (on) await saveShopEntry("clothing", `${info.type}_${info.id}`, { on: false, price: it!.basePrice, starter: true });
                else await clearShopEntry("clothing", `${info.type}_${info.id}`);
                saved(`${on ? "made" : "unmade"} ${info.type}-${info.id} a starter item`);
                draw();
              } catch { failed(); }
            },
          }), "starter")
        : null;
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
        starterBox,
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
        h("button", { class: "btn small", title: "Free for everyone, never sold", onclick: () => void bulk("starter", 0) }, "Make starter"),
        h("button", { class: "btn small", onclick: () => void bulk("reset", 0) }, "Reset to default")),
      h("p", { class: "hint", style: { margin: "6px 0 0" } }, "Clothes you make yourself live in the Studio tab; set their price there."));
    el.append(actionsBar, bar, grid, pager);
    draw();
    return () => undefined;
  }

  // ---- furniture -------------------------------------------------------------------------------------------
  function furnitureTab(el: HTMLElement): () => void {
    el.append(h("div", { class: "panel" },
      h("h3", {}, "Furniture"),
      h("p", { class: "hint" }, "Furniture isn't sold yet: there are no prices and no list of what each player owns. The shop's Furniture tab says \"coming soon\" until that exists. Furniture you upload (Studio > Furniture) can already be placed by you, and by players where you ticked \"players can place it\".")));
    return () => undefined;
  }

  // ---- 6ixty's stock -----------------------------------------------------------------------------------------
  /** What 6ixty can sell, and what new players start with: lockpick and cigarette are on his shelf by default. */
  function sixtyTab(el: HTMLElement): () => void {
    const ids = Object.keys(ITEMS).filter((id) => !DISABLED_ITEMS.has(id) && id !== "cigbutt" && id !== "deadcat");
    const rowFor = (id: string): HTMLElement => {
      const it = ITEMS[id];
      const e = itemEntry(id);
      return h("tr", {},
        h("td", {}, h("img", { src: it.icon, alt: "", style: { width: "32px", height: "32px", imageRendering: "pixelated" } })),
        h("td", {}, h("b", {}, it.name)), h("td", { class: "hint" }, it.examine),
        h("td", {}, h("label", {}, h("input", {
          type: "checkbox", checked: e.on,
          onchange: async (ev: Event) => { try { await saveShopEntry("items", id, { on: (ev.target as HTMLInputElement).checked, price: e.price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the ${it.name} ${(ev.target as HTMLInputElement).checked ? "on" : "off"} 6ixty's shelf`); } catch { failed(); } },
        }), " 6ixty sells it")),
        h("td", {}, priceBox(e.price, async (n) => { try { await saveShopEntry("items", id, { on: e.on, price: n }); saved(`set the ${it.name} to ${n} drops`); } catch { failed(); } })),
        h("td", {}, h("label", { title: "New players start with one in their inventory" }, h("input", {
          type: "checkbox", checked: !!e.starter,
          onchange: async (ev: Event) => {
            const on = (ev.target as HTMLInputElement).checked;
            try { await saveShopEntry("items", id, { on: e.on, price: e.price, starter: on }); saved(`${on ? "made" : "unmade"} the ${it.name} a starter item`); open("sixty"); } catch { failed(); }
          },
        }), " starter")));
    };
    el.append(
      h("p", { class: "hint" }, "6ixty sells what is ticked here (the shop window opens when a player talks to him). Tick \"starter\" and every NEW player starts with one in their inventory (players who already have an account aren't given one). The knife and the syringe come from 6ixty himself: the knife the first time you meet him, the syringe 12 hours later."),
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["", "Item", "What it does", "On the shelf", "Price (drops)", "Starter"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...ids.map(rowFor)))),
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
