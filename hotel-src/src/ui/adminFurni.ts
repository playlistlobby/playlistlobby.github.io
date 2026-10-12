import { h, toast } from "./dom";
import { deleteFurni, FurniMeta, FurniUpload, furniPath, listFurni, loadNitro, onFurniChanged, readFurniNitro, saveFurni, updateFurniMeta } from "../furniDefs";
import { NitroFurni } from "../nitro";
import { drawNitroSprites, iso, TILE_H, TILE_W } from "../roomRender";
import { logAction } from "../logger";
import type { Ctx } from "../main";

/** Draws a piece standing on its footprint tiles (so the admin can check it lines up) into a canvas. */
function drawPreview(canvas: HTMLCanvasElement, n: NitroFurni, meta: FurniMeta, dir: number): void {
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, canvas.width, canvas.height);
  const swap = dir === 2 || dir === 6;
  const w = swap ? meta.h : meta.w;
  const hh = swap ? meta.w : meta.h;
  const span = (w + hh) * (TILE_H / 2) + 130;
  const scale = Math.max(0.6, Math.min(2.4, (canvas.height - 20) / span));
  const left = -hh * (TILE_W / 2) * scale;
  const right = w * (TILE_W / 2) * scale;
  const ox = canvas.width / 2 - (left + right) / 2;
  const oy = canvas.height - 24 - (w + hh) * (TILE_H / 2) * scale;
  const toScreen = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const p = toScreen(iso(x, y));
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.lineTo(p.x, p.y + TILE_H * scale);
      g.lineTo(p.x - (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.closePath();
      g.fillStyle = (x + y) % 2 ? "#cfd8e3" : "#dbe3ec";
      g.fill();
      g.strokeStyle = "rgba(60,90,120,.45)";
      g.stroke();
    }
  }
  drawNitroSprites(g, n, w, hh, 0, 0, dir, { x: meta.ox, y: meta.oy }, toScreen, scale);
}

function thumb(id: string): HTMLElement {
  const c = h("canvas", { width: 96, height: 96, class: "furni-thumb" });
  void loadNitro(furniPath(id)).then((n) => {
    const m = listFurni().find((f) => f.id === id);
    if (n && m && c.isConnected) drawPreview(c, n, { ...m, ox: m.ox, oy: m.oy }, 0);
  });
  return c;
}

/** Admin > Studio > Furniture: upload .nitro furniture, check how it sits on its tiles, and decide who can place it. */
export function mountAdminFurni(root: HTMLElement, ctx: Ctx): () => void {
  const host = h("div", { class: "furni-admin" });
  root.append(host);
  let disposed = false;
  let queue: File[] = [];
  let offList: (() => void) | null = null;
  const failed = (err: unknown) => toast((err as Error)?.message || "Something went wrong.", "err");

  // ---- list ------------------------------------------------------------------------------------------
  function showList(): void {
    offList?.();
    const grid = h("div", { class: "apanel-grid" });
    const status = h("div", { class: "hint" });
    const pick = h("input", { type: "file", multiple: true, accept: ".nitro", onchange: () => void startUpload(Array.from(pick.files ?? [])) });
    const drop = h("div", { class: "dropzone" }, "Drop furniture .nitro files here, or ", h("label", { class: "link" }, "choose files", pick));
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => void startUpload(Array.from((e as DragEvent).dataTransfer?.files ?? [])));
    const draw = () => {
      const all = listFurni();
      grid.replaceChildren(...(all.length ? all.map((m) => h("button", { class: "acard design-card", onclick: () => void openExisting(m) },
        h("span", { class: "tag " + (m.players ? "free" : "off") }, m.players ? "players" : "admin only"),
        thumb(m.id),
        h("div", {}, h("b", {}, m.name)),
        h("div", { class: "nm" }, `${m.w}×${m.h}${m.flat ? " · flat" : ""}`))) : [h("p", { class: "hint" }, "No furniture yet. Upload a .nitro file above.")]));
    };
    host.replaceChildren(
      h("p", { class: "muted" }, "Furniture uploaded here can be placed in the public room (Room tab > the 🏠 tab while you stand in it). Turn on \"players can place it\" to let everyone use it in their own rooms."),
      drop, status, grid);
    draw();
    offList = onFurniChanged(draw);

    async function startUpload(files: File[]): Promise<void> {
      queue = files.filter((f) => /\.nitro$/i.test(f.name));
      const skipped = files.length - queue.length;
      if (skipped) status.textContent = `${skipped} file${skipped === 1 ? " was" : "s were"} skipped (only .nitro files).`;
      void nextInQueue();
    }
  }

  async function nextInQueue(): Promise<void> {
    const f = queue.shift();
    if (!f) return showList();
    try {
      showEditor(await readFurniNitro(f), true);
    } catch (err) {
      failed(err);
      void nextInQueue();
    }
  }

  async function openExisting(m: FurniMeta): Promise<void> {
    const n = await loadNitro(furniPath(m.id));
    if (!n) return failed(new Error("Couldn't load this piece's art."));
    showEditor({ nitro: n, meta: { ...m } }, false);
  }

  // ---- editor ----------------------------------------------------------------------------------------
  function showEditor(upload: FurniUpload, isNew: boolean): void {
    offList?.();
    const meta = upload.meta;
    let art: FurniUpload | null = isNew ? upload : null; // set when the art itself should be (re)saved
    let nitro = upload.nitro;
    let dir = 0;
    const exists = listFurni().some((f) => f.id === meta.id);
    const canvas = h("canvas", { class: "furni-preview", width: 320, height: 300 });
    const redraw = () => drawPreview(canvas, nitro, meta, dir);

    const num = (get: () => number, set: (n: number) => void, opts: { min: number; max: number }) => {
      const input = h("input", { type: "number", min: opts.min, max: opts.max, value: String(get()), style: { width: "70px", padding: "4px" }, onchange: () => { set(Math.max(opts.min, Math.min(opts.max, Math.round(Number(input.value) || 0)))); input.value = String(get()); redraw(); } });
      return input;
    };
    const nudge = (dx: number, dy: number) => { meta.ox += dx; meta.oy += dy; ox.value = String(meta.ox); oy.value = String(meta.oy); redraw(); };
    const ox = num(() => meta.ox, (n) => (meta.ox = n), { min: -200, max: 200 });
    const oy = num(() => meta.oy, (n) => (meta.oy = n), { min: -200, max: 200 });
    const name = h("input", { class: "mini-input", value: meta.name, maxLength: 28, oninput: () => { meta.name = name.value.trim() || "Furniture"; } });
    const flat = h("input", { type: "checkbox", checked: meta.flat, onchange: () => { meta.flat = flat.checked; } });
    const players = h("input", { type: "checkbox", checked: meta.players, onchange: () => { meta.players = players.checked; } });
    const replace = h("input", { type: "file", accept: ".nitro", onchange: async () => {
      const f = replace.files?.[0];
      if (!f) return;
      try { const u = await readFurniNitro(f); art = { nitro: u.nitro, meta }; nitro = u.nitro; meta.dirs = u.meta.dirs; redraw(); toast("New art loaded. Save to keep it."); } catch (err) { failed(err); }
    } });

    const dirs = meta.dirs.length ? meta.dirs : [0];
    host.replaceChildren(
      h("div", { class: "admin-bar" }, h("button", { class: "btn small", onclick: () => { queue = []; showList(); } }, "‹ Furniture"), h("b", {}, isNew ? `New: ${meta.id}` : meta.name),
        queue.length ? h("span", { class: "hint" }, `${queue.length} more file${queue.length === 1 ? "" : "s"} waiting`) : null),
      ...(isNew && exists ? [h("div", { class: "privnote" }, `A piece called ${meta.id} already exists. Saving replaces its art.`)] : []),
      h("div", { class: "studio-grid" },
        h("div", { class: "panel" },
          h("div", { class: "preview-box" }, canvas),
          h("div", { class: "row center" }, ...dirs.map((d) => h("button", { class: "btn small", onclick: () => { dir = d; redraw(); } }, `Facing ${d}`))),
          h("div", { class: "hint" }, "The grid shows the tiles it occupies. If the art floats or sinks, nudge it.")),
        h("div", { class: "panel" },
          h("h2", {}, "Details"),
          h("div", { class: "group" },
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Name"), name),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Tiles wide"), num(() => meta.w, (n) => (meta.w = n), { min: 1, max: 8 })),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Tiles deep"), num(() => meta.h, (n) => (meta.h = n), { min: 1, max: 8 })),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Flat on the floor (walkable)"), flat),
            h("label", { class: "cellrow" }, h("span", { class: "lbl" }, "Players can place it"), players),
            h("div", { class: "cellrow" }, h("span", { class: "lbl" }, "Nudge x / y"), ox, oy,
              h("span", { class: "row", style: { gap: "3px" } },
                h("button", { class: "btn small", onclick: () => nudge(-1, 0) }, "◀"), h("button", { class: "btn small", onclick: () => nudge(0, -1) }, "▲"),
                h("button", { class: "btn small", onclick: () => nudge(0, 1) }, "▼"), h("button", { class: "btn small", onclick: () => nudge(1, 0) }, "▶")))),
          isNew ? null : h("div", { class: "row" }, h("span", { class: "hint" }, "Replace the art:"), replace),
          h("div", { class: "row" },
            h("button", { class: "btn primary", onclick: async () => {
              try {
                if (art) await saveFurni(art, meta); else await updateFurniMeta(meta);
                logAction(ctx.profile, "admin", `${isNew ? "uploaded" : "updated"} the furniture ${meta.name} (${meta.id})`);
                toast("Saved.");
                if (isNew) void nextInQueue(); else showList();
              } catch (err) { failed(err); }
            } }, "Save"),
            !isNew ? h("button", { class: "btn danger", onclick: async () => {
              if (!confirm(`Delete "${meta.name}"? It disappears from every room.`)) return;
              try { await deleteFurni(meta.id); logAction(ctx.profile, "admin", `deleted the furniture ${meta.name} (${meta.id})`); showList(); } catch (err) { failed(err); }
            } }, "Delete") : null))));
    redraw();
  }

  showList();
  return () => { disposed = true; offList?.(); void disposed; };
}
