import { copyText, h, toast, trimCanvas } from "./dom";
import {
  DEFAULT_FIGURE,
  defaultColors,
  figureToString,
  findItem,
  Gender,
  isOwned,
  Item,
  itemsFor,
  Parts,
  parseFigure,
  SLOTS,
  swatchesFor,
  unownedItems,
} from "../catalog";
import { renderAvatar } from "../avatarService";
import { buyItems, saveFigure } from "../db";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import { saveSixtyLook, SIXTY, sixtyLook } from "../npc";
import type { Ctx } from "../main";
import { unusualPanel } from "../unusual";
import { createColorWheel } from "./colorWheel";

/** customize = your own look (owned items), shop = try and buy, npc = the admin dressing 6ixty (every item, nothing owned or bought) */
export type EditorMode = "customize" | "shop" | "npc";

const PAGE_SIZE = 18;

/** Customizer + shop share one editor: same preview, slots, colors and item grid, different item filter and footer. */
export function mountEditor(root: HTMLElement, ctx: Ctx, mode: EditorMode): () => void {
  const profile = ctx.profile;
  let gender: Gender = mode === "npc" ? sixtyLook().gender : profile.gender;
  let parts: Parts = parseFigure(mode === "npc" ? sixtyLook().figure : profile.figure || DEFAULT_FIGURE[gender]);
  let slotId = mode === "shop" ? "ch" : "hr";
  let page = 0;
  let dir = 2;
  let waving = false;
  let frame = 0;
  let renderToken = 0;
  let disposed = false;

  ensureRequired();
  const lookKey = () => figureToString(parts) + gender;
  let savedKey = lookKey();

  function ensureRequired(): void {
    const defaults = parseFigure(DEFAULT_FIGURE[gender]);
    for (const s of SLOTS) {
      if (s.required && !parts[s.id]) parts[s.id] = defaults[s.id];
    }
  }

  // ---- layout ---------------------------------------------------------------
  const previewCanvas = h("canvas", { class: "preview-canvas", width: 64, height: 110 });
  const nameTag = h("div", { class: "preview-name" }, mode === "npc" ? SIXTY.name : profile.name);
  const tabsEl = h("div", { class: "tabs" });
  const colorsEl = h("div", { class: "colors" });
  const wheelEl = h("div", { class: "wheel-host" }); // (the colour wheel opens here, under the colours)
  let wheelFor: number | null = null;
  const gridEl = h("div", { class: "grid" });
  const pagerEl = h("div", { class: "pager" });
  const footerEl = h("div", { class: "editor-footer" });
  const genderEl = h("div", { class: "gender" });

  const unusualBox = unusualPanel(profile);
  const rotate = (d: number) => { dir = (dir + d + 8) % 8; drawPreview(); };

  // one centred column for both pages: character, turn arrows, (Shop: the buy box), gender, category tabs, colours, items
  root.append(
    h("div", { class: "editor solo" },
      h("div", { class: "editor-solo panel" },
        h("div", { class: "preview-box" }, previewCanvas, nameTag),
        h("div", { class: "row center" },
          h("button", { class: "btn small", title: "Turn left", onclick: () => rotate(-1) }, "⟲"),
          h("button", { class: "btn small", title: "Turn right", onclick: () => rotate(1) }, "⟳")),
        ...(mode === "customize" ? [unusualBox.el] : []),
        ...(mode === "shop" ? [footerEl] : []),
        genderEl, tabsEl, colorsEl, wheelEl, gridEl, pagerEl,
        ...(mode === "shop" ? [] : [footerEl]))));

  // ---- preview ---------------------------------------------------------------
  function drawPreview(): void {
    const token = ++renderToken;
    renderAvatar({ figure: figureToString(parts), dir, headDir: dir, actions: waving ? ["wav"] : ["std"], frame }).then((canvas) => {
      if (disposed || token !== renderToken || !canvas) return;
      const ctx2 = previewCanvas.getContext("2d")!;
      ctx2.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      ctx2.drawImage(canvas, 0, 0);
    });
  }
  const waveTimer = window.setInterval(() => {
    if (waving) { frame = (frame + 1) % 2; drawPreview(); }
  }, 350);

  // ---- slot tabs -------------------------------------------------------------
  /** A category only shows up if there is something in it: items you own (Character) or items still on sale that you don't own (Shop). */
  function slotsShown() {
    const has = SLOTS.filter((s) => itemsFor(s.id, gender).some((i) => mode === "npc" ? true : mode === "shop" ? !isOwned(i, profile.owned) && i.shopOn : isOwned(i, profile.owned)));
    return has.length ? has : SLOTS;
  }

  function renderTabs(): void {
    const shown = slotsShown();
    if (!shown.some((s) => s.id === slotId)) { slotId = shown[0].id; page = 0; }
    tabsEl.replaceChildren(
      ...shown.map((s) =>
        h("button", { class: "tab" + (s.id === slotId ? " on" : ""), onclick: () => { slotId = s.id; page = 0; redraw(); } }, s.label)));
  }

  // ---- colors ----------------------------------------------------------------
  const isCustom = (id: string | undefined): boolean => !!id && /^x[0-9a-f]{6}$/i.test(id);
  let gridTimer = 0;
  function renderColors(): void {
    colorsEl.replaceChildren();
    wheelEl.replaceChildren();
    const part = parts[slotId];
    const item = part && findItem(slotId, part.id);
    if (!part || !item || item.colors === 0) { wheelFor = null; return; }
    if (wheelFor !== null && wheelFor >= item.colors) wheelFor = null;
    const sw = swatchesFor(slotId);
    for (let i = 0; i < item.colors; i++) {
      const cur = part.colors[i];
      const custom = isCustom(cur);
      colorsEl.append(
        h("div", { class: "swatch-row" },
          item.colors > 1 ? h("span", { class: "swatch-label" }, `Color ${i + 1}`) : null,
          ...sw.map((c) =>
            h("button", {
              class: "swatch" + (cur === c.id ? " on" : ""),
              style: { background: "#" + c.hex },
              title: "#" + c.hex,
              onclick: () => { part.colors[i] = c.id; drawPreview(); renderColors(); renderGrid(); },
            })),
          custom ? h("button", { class: "swatch on", style: { background: "#" + cur.slice(1) }, title: "#" + cur.slice(1), onclick: () => { wheelFor = wheelFor === i ? null : i; renderColors(); } }) : null,
          h("button", { class: "swatch swatch-wheel" + (wheelFor === i ? " open" : ""), title: "Any colour", "aria-label": "Colour wheel", onclick: () => { wheelFor = wheelFor === i ? null : i; renderColors(); } })));
    }
    if (wheelFor !== null) {
      const i = wheelFor;
      const cur = part.colors[i];
      const start = isCustom(cur) ? cur.slice(1) : sw.find((c) => c.id === cur)?.hex ?? "8899aa";
      const wheel = createColorWheel(start, (hex) => {
        part.colors[i] = "x" + hex;
        drawPreview();
        // the swatch row shows the colour that was picked (updated in place: the wheel stays where it is while it is dragged); the item grid follows a moment after
        const chip = colorsEl.querySelectorAll(".swatch-row")[i]?.querySelector<HTMLElement>(".swatch.on");
        if (chip && !chip.classList.contains("swatch-wheel") && !sw.some((c) => c.id === cur)) chip.style.background = "#" + hex;
        window.clearTimeout(gridTimer);
        gridTimer = window.setTimeout(() => { const keep = wheelFor; renderGrid(); wheelFor = keep; }, 250);
      });
      wheelEl.append(h("div", { class: "wheel-panel" }, item.colors > 1 ? h("div", { class: "swatch-label" }, `Color ${i + 1}`) : null, wheel.el,
        h("button", { class: "btn small", onclick: () => { wheelFor = null; renderColors(); renderGrid(); } }, "Done")));
    }
  }

  // ---- item grid ---------------------------------------------------------------
  function visibleItems(): Item[] {
    const all = itemsFor(slotId, gender);
    return mode === "npc" ? all : mode === "shop" ? all.filter((i) => !isOwned(i, profile.owned) && i.shopOn) : all.filter((i) => isOwned(i, profile.owned));
  }

  function renderGrid(): void {
    const slot = SLOTS.find((s) => s.id === slotId)!;
    const all = visibleItems();
    const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    if (page >= pages) page = pages - 1;
    const shown = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const current = parts[slotId];
    gridEl.replaceChildren();
    // the admin sees every item's name (slot-id, e.g. ch-3030) and can copy it, or the whole list, to paste anywhere
    if (profile.isAdmin && mode !== "npc") {
      const names = (list: Item[], slotKey: string) => list.map((i) => `${slotKey}-${i.id}`);
      const copy = async (list: string[], what: string) => toast((await copyText(list.join(String.fromCharCode(10)))) ? `Copied ${list.length} names (${what}).` : "Couldn't copy.", list.length ? "ok" : "err");
      gridEl.append(h("div", { class: "admin-names", style: { gridColumn: "1 / -1", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" } },
        h("button", { class: "btn small", onclick: () => void copy(names(all, slotId), slot.label) }, `Copy names: ${slot.label} (${all.length})`),
        h("button", { class: "btn small", onclick: () => void copy(SLOTS.flatMap((s) => names(itemsFor(s.id, gender).filter((i) => (mode === "shop" ? !isOwned(i, profile.owned) && i.shopOn : isOwned(i, profile.owned))), s.id)), "everything") }, "Copy all names")));
    }

    if (mode !== "shop" && !slot.required) {
      gridEl.append(
        h("button", { class: "cell none" + (!current ? " on" : ""), onclick: () => { delete parts[slotId]; drawPreview(); redraw(); } }, "None"));
    }
    for (const item of shown) {
      const thumb = h("div", { class: "thumb" });
      const cell = h("button", {
        class: "cell" + (current?.id === item.id ? " on" : ""),
        title: `${slot.label} #${item.id}`,
        onclick: () => {
          parts[slotId] = { id: item.id, colors: defaultColors(item, current) };
          drawPreview();
          redraw();
        },
      }, thumb, mode === "shop" ? h("span", { class: "price" }, `🩸 ${item.price}`) : null,
      profile.isAdmin && mode !== "npc" ? h("span", { class: "admin-name", title: "Click to copy", onclick: (e: Event) => { e.stopPropagation(); void copyText(`${slotId}-${item.id}`).then((ok) => toast(ok ? `Copied ${slotId}-${item.id}` : "Couldn't copy.", ok ? "ok" : "err")); } }, `${slotId}-${item.id}`) : null);
      gridEl.append(cell);

      const thumbParts: Parts = { ...parts, [slotId]: { id: item.id, colors: defaultColors(item, current) } };
      renderAvatar({ figure: figureToString(thumbParts), dir: 2, headDir: 2, headOnly: slot.headOnly }).then((canvas) => {
        if (disposed || !canvas || !thumb.isConnected) return;
        const trimmed = trimCanvas(canvas);
        trimmed.className = "thumb-canvas";
        thumb.replaceChildren(trimmed);
      });
    }
    if (all.length === 0) {
      gridEl.append(h("p", { class: "muted" }, mode === "shop" ? "You own everything in this category 🎉" : "Nothing here yet — visit the shop!"));
    }

    pagerEl.replaceChildren(
      pages > 1
        ? h("div", { class: "row center" },
            h("button", { class: "btn small", disabled: page === 0, onclick: () => { page--; renderGrid(); } }, "‹"),
            h("span", { class: "muted" }, `${page + 1} / ${pages}`),
            h("button", { class: "btn small", disabled: page >= pages - 1, onclick: () => { page++; renderGrid(); } }, "›"))
        : "");
  }

  // ---- footer ------------------------------------------------------------------
  function renderGender(): void {
    genderEl.replaceChildren();
    if (mode === "shop") return;
    genderEl.append(
      h("div", { class: "row center" },
        ...(["M", "F"] as Gender[]).map((g) =>
          h("button", {
            class: "btn small" + (gender === g ? " on" : ""),
            onclick: () => {
              if (gender === g) return;
              gender = g;
              parts = parseFigure(DEFAULT_FIGURE[g]);
              page = 0;
              drawPreview();
              redraw();
            },
          }, g === "M" ? "Boy" : "Girl"))));
  }

  function renderFooter(): void {
    footerEl.replaceChildren();
    if (mode !== "shop") {
      footerEl.classList.add("sticky");
      footerEl.append(
        h("button", {
          class: "btn primary",
          onclick: async () => {
            try {
              if (mode === "npc") {
                await saveSixtyLook(figureToString(parts), gender);
                savedKey = lookKey();
                logAction(profile, "admin", "changed 6ixty's look");
                playSfx("camera", 0.35);
                toast("6ixty's look saved!");
                return;
              }
              await saveFigure(profile, figureToString(parts), gender);
              savedKey = lookKey();
              ctx.refreshHeader();
              ctx.lookChanged();
              logAction(profile, "look", "changed their look");
              playSfx("camera", 0.35);
              toast("Look saved!");
            } catch (err) {
              toast((err as Error).message, "err");
            }
          },
        }, mode === "npc" ? "Save 6ixty's look" : "Save look"),
        h("button", {
          class: "btn",
          onclick: () => {
            if (lookKey() !== savedKey && !confirm("You haven't saved the new look. Go back without saving?")) return;
            ctx.navigate("room");
          },
        }, "Go back"));
      return;
    }
    const basket = unownedItems(parts, profile.owned);
    const cost = basket.reduce((sum, i) => sum + i.price, 0);
    const affordable = cost <= profile.blood;
    footerEl.append(
      h("div", { class: "basket" },
        basket.length === 0
          ? h("p", { class: "muted" }, "Try items on, then buy the ones you like.")
          : h("ul", {}, ...basket.map((i) => h("li", {}, `${SLOTS.find((s) => s.id === i.type)!.label} #${i.id} — 🩸 ${i.price}`)))),
      h("button", {
        class: "btn primary",
        disabled: basket.length === 0 || !affordable,
        onclick: async () => {
          try {
            await buyItems(profile, basket.map((i) => i.key), cost);
            await saveFigure(profile, figureToString(parts), gender);
            logAction(profile, "buy", `bought ${basket.map((i) => i.key).join(", ")} for ${cost}`);
            ctx.refreshHeader();
            ctx.lookChanged();
            playSfx("cash", 0.45);
            toast(`Bought ${basket.length} item${basket.length > 1 ? "s" : ""} and put them on!`);
            redraw();
          } catch (err) {
            toast((err as Error).message, "err");
          }
        },
      }, basket.length === 0 ? "Buy & wear" : affordable ? `Buy & wear — 🩸 ${cost}` : `Need 🩸 ${cost - profile.blood} more`));
  }

  function redraw(): void {
    renderTabs();
    renderColors();
    renderGrid();
    renderGender();
    renderFooter();
  }

  redraw();
  drawPreview();

  return () => {
    disposed = true;
    window.clearInterval(waveTimer);
    unusualBox.dispose();
  };
}

