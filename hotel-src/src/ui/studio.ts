import { h, toast, trimCanvas } from "./dom";
import { mountPainter, PainterApi } from "./painter";
import { mountNitroClothing } from "./studioNitro";
import { renderAvatar } from "../avatarService";
import { DEFAULT_FIGURE, figureToString, Gender, parseFigure, SLOTS, swatchesFor } from "../catalog";
import {
  allocateDesignId, DesignMeta, Draft, deleteDesign, draftFromBase, draftFromDesign, endPreview, listDesigns, onDesignsChanged, previewDraft, publishDraft,
} from "../designs";
import { applyPattern, exportDraftZip, importFiles, makePattern, PATTERN_KINDS, PatternKind } from "../designTools";
import { clearShopEntry, saveShopEntry, shopConfig } from "../shopConfig";
import { describeSet, figureWearing, listSets, SetInfo } from "../templateExport";
import { logAction } from "../logger";
import { download } from "../zip";
import { loadImage } from "../designs";
import { BLOOD_ICON } from "../items";
import type { Ctx } from "../main";

type EditorTab = "paint" | "import" | "pattern" | "details" | "template";
const TABS: Array<[EditorTab, string]> = [["paint", "Paint"], ["import", "Import"], ["pattern", "Pattern"], ["details", "Details"], ["template", "Template"]];

const slotLabel = (id: string) => SLOTS.find((s) => s.id === id)?.label ?? id;

function thumbFor(figure: string, headOnly: boolean): HTMLElement {
  const box = h("div", { class: "thumb" });
  renderAvatar({ figure, dir: 2, headDir: 2, headOnly }).then((c) => {
    if (!c || !box.isConnected) return;
    const t = trimCanvas(c);
    t.className = "thumb-canvas";
    box.replaceChildren(t);
  });
  return box;
}

/** The Studio: design new clothing from an existing garment (paint it, import PNGs, add a pattern), then publish it to the shop. */
export function mountStudio(root: HTMLElement, ctx: Ctx): () => void {
  const host = h("div", { class: "studio" });
  root.append(host);
  let draft: Draft | null = null;
  let painter: PainterApi | null = null;
  let disposed = false;
  let offList: (() => void) | null = null;
  let previewTimer = 0;
  let stopWalk: (() => void) | null = null;
  let stopNitro: (() => void) | null = null;

  const failed = (err: unknown) => toast((err as Error)?.message || "Something went wrong.", "err");

  function leaveEditor(): void {
    painter?.dispose();
    painter = null;
    stopWalk?.();
    stopWalk = null;
    window.clearTimeout(previewTimer);
    if (draft) endPreview(draft.meta.id);
    draft = null;
  }

  // ---- list of designs -------------------------------------------------------------------------------------
  function showNitro(): void {
    leaveEditor();
    offList?.();
    stopNitro?.();
    host.replaceChildren();
    stopNitro = mountNitroClothing(host, ctx, showList);
  }

  function showList(): void {
    leaveEditor();
    offList?.();
    stopNitro?.();
    stopNitro = null;
    const grid = h("div", { class: "apanel-grid" });
    const draw = () => {
      const all = listDesigns();
      grid.replaceChildren(...(all.length ? all.map((m) => {
        const slot = SLOTS.find((s) => s.id === m.slot);
        const entry = shopConfig.clothing[`${m.slot}_${m.id}`];
        const info = describeSet({ type: m.slot, id: m.id });
        const status = !m.published ? "draft" : !entry ? "free for all" : entry.on && entry.price > 0 ? `${entry.price} drops` : entry.price === 0 ? "free for all" : "not sold";
        return h("button", { class: "acard design-card", onclick: () => void openExisting(m) },
          h("span", { class: "tag " + (m.published ? "free" : "off") }, m.published ? "live" : "draft"),
          info ? thumbFor(figureWearing(info), !!slot?.headOnly) : h("div", { class: "thumb" }),
          h("div", {}, h("b", {}, m.name)),
          h("div", { class: "nm" }, `${slotLabel(m.slot)} · ${status}`));
      }) : [h("p", { class: "hint" }, "No designs yet. Press New design to make your first one.")]));
    };
    host.replaceChildren(
      h("div", { class: "admin-bar" },
        h("button", { class: "btn primary", onclick: showPicker }, "＋ New design"),
        h("button", { class: "btn", onclick: showNitro }, "⬆ Import .nitro"),
        h("span", { class: "hint" }, "Designs start from an existing garment, so they come with the right layers and animations.")),
      grid);
    draw();
    offList = onDesignsChanged(() => { if (!draft) draw(); });
  }

  async function openExisting(meta: DesignMeta): Promise<void> {
    host.replaceChildren(h("div", { class: "loading", style: { color: "#555" } }, "Opening…"));
    try {
      const d = await draftFromDesign(meta);
      showEditor(d);
    } catch (err) {
      failed(err);
      showList();
    }
  }

  // ---- step 1: pick the garment to start from ----------------------------------------------------------------
  function showPicker(): void {
    leaveEditor();
    offList?.();
    let slot = "ch";
    let gender = "";
    let search = "";
    let page = 0;
    const PAGE = 24;
    const nameInput = h("input", { class: "mini-input", placeholder: "Name your design", maxLength: 28, value: "My design" });
    const slotSel = h("select", { onchange: () => { slot = slotSel.value; page = 0; draw(); } }, ...SLOTS.filter((s) => s.id !== "hd").map((s) => h("option", { value: s.id }, s.label)));
    const genderSel = h("select", { onchange: () => { gender = genderSel.value; page = 0; draw(); } },
      h("option", { value: "" }, "Any gender"), h("option", { value: "M" }, "Boys"), h("option", { value: "F" }, "Girls"), h("option", { value: "U" }, "Unisex"));
    slotSel.value = slot;
    const searchBox = h("input", { class: "mini-input", placeholder: "Find by id…", oninput: () => { search = searchBox.value.trim(); page = 0; draw(); } });
    const grid = h("div", { class: "apanel-grid" });
    const pager = h("div", { class: "row center", style: { margin: "10px 0" } });
    const status = h("div", { class: "hint" });

    function filtered(): SetInfo[] {
      return listSets(slot).filter((s) => (!gender || s.gender === gender) && (!search || s.id.includes(search)) && s.parts.some((p) => p.lib));
    }
    async function start(info: SetInfo): Promise<void> {
      const name = nameInput.value.trim() || "My design";
      status.textContent = "Getting the artwork ready…";
      try {
        showEditor(await draftFromBase(info.type, info.id, allocateDesignId(), name));
      } catch (err) {
        status.textContent = "";
        failed(err);
      }
    }
    function draw(): void {
      const all = filtered();
      const pages = Math.max(1, Math.ceil(all.length / PAGE));
      if (page >= pages) page = pages - 1;
      const slotMeta = SLOTS.find((s) => s.id === slot)!;
      grid.replaceChildren(...all.slice(page * PAGE, (page + 1) * PAGE).map((info) =>
        h("button", { class: "acard", onclick: () => void start(info) },
          thumbFor(figureWearing(info), slotMeta.headOnly),
          h("div", {}, h("b", {}, `${info.type}-${info.id}`)),
          h("div", { class: "nm" }, `${info.gender === "U" ? "unisex" : info.gender === "F" ? "girls" : "boys"}${info.colors ? " · tintable" : ""}`))));
      pager.replaceChildren(
        h("button", { class: "btn small", disabled: page === 0, onclick: () => { page--; draw(); } }, "‹"),
        h("span", { class: "hint" }, `${page + 1} / ${pages} · ${all.length} garments`),
        h("button", { class: "btn small", disabled: page >= pages - 1, onclick: () => { page++; draw(); } }, "›"));
    }
    host.replaceChildren(
      h("div", { class: "admin-bar" }, h("button", { class: "btn small", onclick: showList }, "‹ Designs"), h("b", {}, "Pick a garment to start from")),
      h("div", { class: "admin-bar" }, nameInput, slotSel, genderSel, searchBox),
      status, grid, pager);
    draw();
  }

  // ---- step 2: the editor ---------------------------------------------------------------------------------------
  function showEditor(d: Draft): void {
    leaveEditor();
    offList?.();
    draft = d;
    let tab: EditorTab = "paint";
    let dir = 2;
    let walking = false;
    let frame = 0;
    let previewGender: Gender = d.meta.gender === "F" ? "F" : "M";
    let colorId = "";
    let token = 0;
    const meta = d.meta;
    const entry = shopConfig.clothing[`${meta.slot}_${meta.id}`];
    let price = entry?.price ?? 0;
    let onSale = entry ? entry.on : false;
    const colorCount = Math.max(0, ...meta.parts.map((p) => p.colorindex));

    const canvas = h("canvas", { class: "design-preview", width: 64, height: 110 });
    const swatchEl = h("div", { class: "colors" });
    const tabsEl = h("div", { class: "tabs" });
    const bodyEl = h("div", { class: "studio-body" });
    const saveInfo = h("div", { class: "hint" });

    const figure = (): string => {
      const parts = parseFigure(DEFAULT_FIGURE[previewGender]);
      const sw = swatchesFor(meta.slot);
      const pick = colorId || sw[Math.min(3, sw.length - 1)]?.id || "1";
      parts[meta.slot] = { id: meta.id, colors: Array.from({ length: colorCount }, () => pick) };
      return figureToString(parts);
    };
    function drawPreview(): void {
      const mine = ++token;
      renderAvatar({ figure: figure(), dir, headDir: dir, actions: walking ? ["wlk"] : ["std"], frame }).then((c) => {
        if (disposed || mine !== token || !c) return;
        const g = canvas.getContext("2d")!;
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(c, 0, 0);
      });
    }
    /** Rebuild the draft's sprite sheet in memory and redraw the character (nothing is saved yet). */
    function refreshPreview(now = false): void {
      window.clearTimeout(previewTimer);
      const run = () => { previewDraft(d); drawPreview(); };
      if (now) run(); else previewTimer = window.setTimeout(run, 140);
    }
    const walkTimer = window.setInterval(() => { if (walking) { frame = (frame + 1) % 4; drawPreview(); } }, 160);
    stopWalk = () => window.clearInterval(walkTimer);

    function renderSwatches(): void {
      if (!colorCount) { swatchEl.replaceChildren(h("div", { class: "hint" }, "This design isn't tinted: it shows the colours you paint.")); return; }
      const sw = swatchesFor(meta.slot).slice(0, 36);
      swatchEl.replaceChildren(h("div", { class: "swatch-row" }, ...sw.map((c) =>
        h("button", { class: "swatch" + (colorId === c.id ? " on" : ""), style: { background: "#" + c.hex }, title: "Preview colour", onclick: () => { colorId = c.id; renderSwatches(); drawPreview(); } }))));
    }

    function renderTabs(): void {
      tabsEl.replaceChildren(...TABS.map(([id, label]) => h("button", { class: "tab" + (id === tab ? " on" : ""), onclick: () => { tab = id; renderBody(); renderTabs(); } }, label)));
    }

    function renderBody(): void {
      painter?.dispose();
      painter = null;
      bodyEl.replaceChildren();
      if (tab === "paint") {
        painter = mountPainter(bodyEl, d, () => refreshPreview());
      } else if (tab === "import") {
        const out = h("div", { class: "hint" });
        const pick = h("input", { type: "file", multiple: true, accept: ".png,.zip,.json,image/png,application/zip", onchange: () => void run(Array.from(pick.files ?? [])) });
        const drop = h("div", { class: "dropzone" }, "Drop PNG files or a ZIP here, or ", h("label", { class: "link" }, "choose files", pick));
        ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
        ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
        drop.addEventListener("drop", (e) => void run(Array.from((e as DragEvent).dataTransfer?.files ?? [])));
        async function run(files: File[]): Promise<void> {
          if (!files.length) return;
          out.textContent = "Importing…";
          try {
            const r = await importFiles(d, files);
            out.replaceChildren(
              h("div", { class: r.replaced + r.added ? "ok-text" : "form-error" }, `${r.replaced} frame${r.replaced === 1 ? "" : "s"} replaced, ${r.added} added.`),
              ...(r.sizeChanged ? [h("div", { class: "hint" }, `${r.sizeChanged} replaced frame${r.sizeChanged === 1 ? " has" : "s have"} a different size than the original. If it sits in the wrong place, include an offset.json with the anchors.`)] : []),
              ...(r.skipped.length ? [h("div", { class: "hint" }, `Skipped ${r.skipped.length}: ${r.skipped.slice(0, 4).join("; ")}${r.skipped.length > 4 ? "…" : ""}`)] : []));
            refreshPreview(true);
          } catch (err) { out.textContent = ""; failed(err); }
        }
        bodyEl.append(h("div", { class: "panel" },
          h("h2", {}, "Import your art"),
          h("p", { class: "muted" }, "Draw in Aseprite, Photoshop or anything else, then bring the PNGs back. Files must be named like the template's frames (h_std_ch_5_2_0.png: pose, layer, id, direction, frame). Only include the frames you changed."),
          drop, out,
          h("p", { class: "hint" }, "Need the frame files first? The Template tab downloads them for this design.")));
      } else if (tab === "pattern") {
        let kind: PatternKind = "stripes";
        let a = "#ffffff", b = "#4a6fb5";
        let scale = 2;
        let strength = 100;
        let upload: HTMLImageElement | null = null;
        const previewTile = h("canvas", { class: "pattern-tile", width: 64, height: 64 });
        const drawTile = () => {
          const g = previewTile.getContext("2d")!;
          g.imageSmoothingEnabled = false;
          g.clearRect(0, 0, 64, 64);
          const tile = upload ?? makePattern(kind, a, b);
          const t2 = document.createElement("canvas");
          t2.width = tile.width * scale;
          t2.height = tile.height * scale;
          const tg = t2.getContext("2d")!;
          tg.imageSmoothingEnabled = false;
          tg.drawImage(tile, 0, 0, t2.width, t2.height);
          g.fillStyle = g.createPattern(t2, "repeat")!;
          g.fillRect(0, 0, 64, 64);
        };
        const kindSel = h("select", { onchange: () => { kind = kindSel.value as PatternKind; upload = null; drawTile(); } }, ...PATTERN_KINDS.map((k) => h("option", { value: k.id }, k.name)));
        const ca = h("input", { type: "color", value: a, oninput: () => { a = ca.value; upload = null; drawTile(); } });
        const cb = h("input", { type: "color", value: b, oninput: () => { b = cb.value; upload = null; drawTile(); } });
        const sc = h("input", { type: "range", min: 1, max: 4, value: String(scale), oninput: () => { scale = Number(sc.value); drawTile(); } });
        const st = h("input", { type: "range", min: 10, max: 100, value: String(strength), oninput: () => { strength = Number(st.value); } });
        const file = h("input", { type: "file", accept: "image/*", onchange: async () => {
          const f = file.files?.[0];
          if (!f) return;
          try { upload = await loadImage(URL.createObjectURL(f)); drawTile(); } catch (err) { failed(err); }
        } });
        bodyEl.append(h("div", { class: "panel" },
          h("h2", {}, "Pattern fill"),
          h("p", { class: "muted" }, "Lays a pattern over the whole garment (every pose), keeping its shading. Apply more than once to layer patterns, or use Reset all to start over."),
          h("div", { class: "row" }, previewTile, kindSel, ca, cb),
          h("div", { class: "row" }, h("span", { class: "hint" }, "Or use your own tile image:"), file),
          h("label", { class: "row hint" }, "Size ", sc),
          h("label", { class: "row hint" }, "Strength ", st),
          h("div", { class: "row" },
            h("button", { class: "btn primary", onclick: () => {
              applyPattern(d, upload ?? makePattern(kind, a, b), scale, strength / 100);
              refreshPreview(true);
              toast("Pattern applied.");
            } }, "Apply to every frame"),
            h("button", { class: "btn", onclick: () => { resetAll(); refreshPreview(true); toast("Back to the original art."); } }, "Reset all frames"))));
        drawTile();
      } else if (tab === "details") {
        const name = h("input", { class: "mini-input", value: meta.name, maxLength: 28, oninput: () => { meta.name = name.value.trim() || "Untitled"; } });
        const gSel = h("select", { onchange: () => { meta.gender = gSel.value as DesignMeta["gender"]; if (meta.gender !== "U") previewGender = meta.gender; drawPreview(); } },
          h("option", { value: "M" }, "Boys"), h("option", { value: "F" }, "Girls"), h("option", { value: "U" }, "Unisex"));
        gSel.value = meta.gender;
        const tint = h("input", { type: "checkbox", checked: meta.parts.some((p) => p.colorable), onchange: () => {
          for (const p of meta.parts) { p.colorable = tint.checked; p.colorindex = tint.checked ? 1 : 0; }
          refreshPreview(true);
          renderSwatches();
        } });
        const reuse = h("input", { type: "checkbox", checked: d.reuseStanding, onchange: () => { d.reuseStanding = reuse.checked; refreshPreview(true); } });
        const priceBox = h("input", { type: "number", min: 0, max: 999, value: String(price), onchange: () => { price = Math.max(0, Math.min(999, Number(priceBox.value) || 0)); } });
        const sale = h("input", { type: "checkbox", checked: onSale, onchange: () => { onSale = sale.checked; } });
        bodyEl.append(h("div", { class: "panel" },
          h("h2", {}, "Details"),
          h("div", { class: "group" },
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Name"), name),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "For"), gSel),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Players pick the colour"), tint),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Reuse standing art when walking"), reuse),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Price (drops)"), priceBox, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" })),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "For sale in the shop"), sale)),
          h("p", { class: "hint" }, "Price 0 = free for everyone (it shows up in the character picker and the random avatar). A price above 0 needs \"for sale\" ticked, otherwise nobody can get it."),
          h("p", { class: "hint" }, `Based on ${meta.base.type}-${meta.base.id} · layers: ${meta.parts.map((p) => p.type).join(", ")}`)));
      } else {
        bodyEl.append(h("div", { class: "panel" },
          h("h2", {}, "Template"),
          h("p", { class: "muted" }, "Download every frame of this design as a PNG (plus offset.json and a readme) to edit in your own pixel editor. Import the changed files back with the Import tab."),
          h("button", { class: "btn primary", onclick: async () => {
            try {
              download(await exportDraftZip(d), `${meta.name.replace(/[^\w-]+/g, "_") || "design"}-frames.zip`);
              logAction(ctx.profile, "design", `downloaded the frames of ${meta.name}`);
            } catch (err) { failed(err); }
          } }, "Download frames (.zip)"),
          h("p", { class: "hint" }, "Tip: the file names carry the pose, layer, direction and frame. Directions 4-6 don't have files because the game mirrors 2-0 for them.")));
      }
    }

    function resetAll(): void {
      if (!d.original) return;
      for (const k of [...d.frames.keys()]) if (!d.original.has(k)) d.frames.delete(k);
      for (const [k, o] of d.original) {
        const c = document.createElement("canvas");
        c.width = o.canvas.width;
        c.height = o.canvas.height;
        c.getContext("2d")!.drawImage(o.canvas, 0, 0);
        d.frames.set(k, { canvas: c, ox: o.ox, oy: o.oy, edited: false });
      }
      painter?.refresh();
    }

    async function save(publish: boolean): Promise<void> {
      meta.published = publish;
      saveInfo.textContent = "Saving…";
      try {
        const saved = await publishDraft(d);
        const key = `${meta.slot}_${meta.id}`;
        if (price > 0 || onSale) await saveShopEntry("clothing", key, { on: onSale, price });
        else await clearShopEntry("clothing", key);
        logAction(ctx.profile, "design", `${publish ? "published" : "saved a draft of"} ${meta.name} (${meta.slot}-${meta.id}, rev ${saved.rev})`);
        toast(publish ? "Published. Players have it now." : "Draft saved.");
        showList();
      } catch (err) {
        saveInfo.textContent = "";
        failed(err);
      }
    }

    host.replaceChildren(
      h("div", { class: "admin-bar" },
        h("button", { class: "btn small", onclick: () => { if (!d.frames.size || confirm("Leave without saving? Unsaved changes are lost.")) showList(); } }, "‹ Designs"),
        h("b", {}, meta.name), h("span", { class: "hint" }, `${slotLabel(meta.slot)} · design ${meta.id}`)),
      h("div", { class: "studio-grid" },
        h("div", { class: "panel studio-preview" },
          h("div", { class: "preview-box" }, canvas),
          h("div", { class: "row center" },
            h("button", { class: "btn small", onclick: () => { dir = (dir + 7) % 8; drawPreview(); } }, "⟲"),
            h("button", { class: "btn small", onclick: () => { walking = !walking; frame = 0; drawPreview(); } }, "Walk"),
            h("button", { class: "btn small", onclick: () => { dir = (dir + 1) % 8; drawPreview(); } }, "⟳")),
          h("div", { class: "row center" },
            ...(["M", "F"] as Gender[]).map((g) => h("button", { class: "btn small", onclick: () => { previewGender = g; drawPreview(); } }, g === "M" ? "Boy" : "Girl"))),
          swatchEl),
        h("div", { class: "studio-main" }, tabsEl, bodyEl)),
      h("div", { class: "panel studio-save" },
        h("div", { class: "row" },
          h("button", { class: "btn primary", onclick: () => void save(true) }, "Publish"),
          h("button", { class: "btn", onclick: () => void save(false) }, "Save as draft"),
          listDesigns().some((m) => m.id === meta.id)
            ? h("button", { class: "btn danger", onclick: async () => {
                if (!confirm(`Delete "${meta.name}" for everyone? Players wearing it will lose it.`)) return;
                try {
                  await deleteDesign(meta.id);
                  await clearShopEntry("clothing", `${meta.slot}_${meta.id}`).catch(() => undefined);
                  logAction(ctx.profile, "design", `deleted ${meta.name} (${meta.slot}-${meta.id})`);
                  showList();
                } catch (err) { failed(err); }
              } }, "Delete")
            : null,
          saveInfo),
        h("p", { class: "hint" }, "Publish makes it visible to players (as free, or on sale if you set a price in Details). A draft is only visible to you.")));
    renderTabs();
    renderBody();
    renderSwatches();
    refreshPreview(true);
  }

  showList();
  return () => {
    disposed = true;
    leaveEditor();
    offList?.();
    stopNitro?.();
  };
}
