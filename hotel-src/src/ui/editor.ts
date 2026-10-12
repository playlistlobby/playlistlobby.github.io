import { h, toast, trimCanvas } from "./dom";
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
import type { Ctx } from "../main";

export type EditorMode = "customize" | "shop";

const PAGE_SIZE = 18;

/** Customizer + shop share one editor: same preview, slots, colors and item grid, different item filter and footer. */
export function mountEditor(root: HTMLElement, ctx: Ctx, mode: EditorMode): () => void {
  const profile = ctx.profile;
  let gender: Gender = profile.gender;
  let parts: Parts = parseFigure(profile.figure || DEFAULT_FIGURE[gender]);
  let slotId = mode === "shop" ? "ch" : "hr";
  let page = 0;
  let dir = 2;
  let waving = false;
  let frame = 0;
  let renderToken = 0;
  let disposed = false;

  ensureRequired();

  function ensureRequired(): void {
    const defaults = parseFigure(DEFAULT_FIGURE[gender]);
    for (const s of SLOTS) {
      if (s.required && !parts[s.id]) parts[s.id] = defaults[s.id];
    }
  }

  // ---- layout ---------------------------------------------------------------
  const previewCanvas = h("canvas", { class: "preview-canvas", width: 64, height: 110 });
  const nameTag = h("div", { class: "preview-name" }, profile.name);
  const tabsEl = h("div", { class: "tabs" });
  const colorsEl = h("div", { class: "colors" });
  const gridEl = h("div", { class: "grid" });
  const pagerEl = h("div", { class: "pager" });
  const footerEl = h("div", { class: "editor-footer" });
  const genderEl = h("div", { class: "gender" });

  const waveBtn = h("button", { class: "btn small", onclick: () => { waving = !waving; frame = 0; waveBtn.classList.toggle("on", waving); drawPreview(); } }, "Wave");
  const rotate = (d: number) => { dir = (dir + d + 8) % 8; drawPreview(); };

  root.append(
    h("div", { class: "editor" },
      h("div", { class: "editor-left panel" },
        h("h2", {}, mode === "shop" ? "Clothing shop" : "Your character"),
        h("div", { class: "preview-box" }, previewCanvas, nameTag),
        h("div", { class: "row center" },
          h("button", { class: "btn small", onclick: () => rotate(-1) }, "⟲"),
          waveBtn,
          h("button", { class: "btn small", onclick: () => rotate(1) }, "⟳")),
        genderEl,
        footerEl),
      h("div", { class: "editor-right panel" }, tabsEl, colorsEl, gridEl, pagerEl)));

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
  function renderTabs(): void {
    tabsEl.replaceChildren(
      ...SLOTS.map((s) =>
        h("button", { class: "tab" + (s.id === slotId ? " on" : ""), onclick: () => { slotId = s.id; page = 0; redraw(); } }, s.label)));
  }

  // ---- colors ----------------------------------------------------------------
  function renderColors(): void {
    colorsEl.replaceChildren();
    const part = parts[slotId];
    const item = part && findItem(slotId, part.id);
    if (!part || !item || item.colors === 0) return;
    const sw = swatchesFor(slotId);
    for (let i = 0; i < item.colors; i++) {
      colorsEl.append(
        h("div", { class: "swatch-row" },
          item.colors > 1 ? h("span", { class: "swatch-label" }, `Color ${i + 1}`) : null,
          ...sw.map((c) =>
            h("button", {
              class: "swatch" + (part.colors[i] === c.id ? " on" : ""),
              style: { background: "#" + c.hex },
              title: "#" + c.hex,
              onclick: () => { part.colors[i] = c.id; drawPreview(); renderColors(); renderGrid(); },
            }))));
    }
  }

  // ---- item grid ---------------------------------------------------------------
  function visibleItems(): Item[] {
    const all = itemsFor(slotId, gender);
    return mode === "shop" ? all.filter((i) => !isOwned(i, profile.owned) && i.shopOn) : all.filter((i) => isOwned(i, profile.owned));
  }

  function renderGrid(): void {
    const slot = SLOTS.find((s) => s.id === slotId)!;
    const all = visibleItems();
    const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    if (page >= pages) page = pages - 1;
    const shown = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const current = parts[slotId];
    gridEl.replaceChildren();

    if (mode === "customize" && !slot.required) {
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
      }, thumb, mode === "shop" ? h("span", { class: "price" }, `🩸 ${item.price}`) : null);
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
    if (mode !== "customize") return;
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
    if (mode === "customize") {
      footerEl.append(
        h("button", {
          class: "btn primary",
          onclick: async () => {
            try {
              await saveFigure(profile, figureToString(parts), gender);
              ctx.refreshHeader();
              ctx.lookChanged();
              logAction(profile, "look", "changed their look");
              playSfx("camera", 0.35);
              toast("Look saved!");
            } catch (err) {
              toast((err as Error).message, "err");
            }
          },
        }, "Save look"));
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
  };
}

