import { h } from "./dom";
import { Draft, DraftFrame, frameName, parseFrameKey } from "../designs";

type Tool = "pencil" | "eraser" | "fill" | "pick" | "lighten" | "darken";

const LAYER_NAMES: Record<string, string> = {
  ch: "Body", ls: "Left sleeve", rs: "Right sleeve", lg: "Legs", sh: "Shoes", hr: "Hair", hrb: "Hair (back)", ha: "Hat", he: "Head item",
  ea: "Glasses", fa: "Face item", cc: "Jacket", lc: "Jacket, left sleeve", rc: "Jacket, right sleeve", cp: "Print", ca: "Chest item", wa: "Belt",
  hd: "Head", bd: "Body skin", fc: "Face",
};
/** The directions that have their own art (the left-facing ones are mirrored by the game). Arrows show which way the character faces on screen. */
const VIEW_DIRS: Array<{ dir: number; arrow: string; name: string }> = [
  { dir: 2, arrow: "↘", name: "Down-right (default)" },
  { dir: 3, arrow: "↓", name: "Front" },
  { dir: 1, arrow: "→", name: "Right" },
  { dir: 0, arrow: "↗", name: "Up-right" },
  { dir: 7, arrow: "↑", name: "Back" },
];
const GREYS = ["#ffffff", "#e6e6e6", "#cccccc", "#b3b3b3", "#999999", "#808080", "#666666", "#4d4d4d", "#333333", "#1a1a1a", "#000000"];
const BASICS = ["#d93636", "#e8782f", "#f0c43a", "#5cb83a", "#2fa6a0", "#3a78d8", "#7a4fc9", "#d54f9c", "#8a5a34", "#f2d2b0"];

export interface PainterApi {
  /** call after the draft's frames were replaced from outside (import, pattern fill) */
  refresh(): void;
  dispose(): void;
}

/** A small pixel editor for one sprite frame at a time. Edits the Draft's frame canvases in place; onChange fires after every edit. */
export function mountPainter(host: HTMLElement, draft: Draft, onChange: () => void): PainterApi {
  let tool: Tool = "pencil";
  let color = "#808080";
  let zoom = 8;
  let grid = true;
  let ghost = false;
  let layer = draft.meta.parts[0]?.type ?? "";
  let dir = 2;
  let disposed = false;
  const recent: string[] = [];
  const history = new Map<string, { canvas: HTMLCanvasElement; undo: ImageData[]; redo: ImageData[] }>();

  const layerEl = h("div", { class: "seg paint-layers" });
  const dirEl = h("div", { class: "seg paint-dirs" });
  const toolsEl = h("div", { class: "paint-tools" });
  const paletteEl = h("div", { class: "paint-palette" });
  const info = h("div", { class: "hint paint-info" });
  const view = h("canvas", { class: "paint-canvas" });
  const wrap = h("div", { class: "paint-wrap" }, view);
  const colorInput = h("input", { type: "color", value: color, class: "paint-color", title: "Colour", oninput: () => setColor(colorInput.value) });
  host.append(h("div", { class: "painter" },
    h("div", { class: "paint-top" }, layerEl, dirEl),
    h("div", { class: "paint-body" }, h("div", { class: "paint-side" }, toolsEl, h("div", { class: "row" }, colorInput, paletteEl), info), wrap)));

  const keyOf = () => frameName("std", layer, draft.meta.id, dir, 0);
  const current = (): DraftFrame | undefined => draft.frames.get(keyOf());
  const colorable = () => !!draft.meta.parts.find((p) => p.type === layer)?.colorable;

  // which layers/directions actually have a standing frame to paint
  function available(): Array<{ type: string; dirs: number[] }> {
    const out = new Map<string, Set<number>>();
    for (const name of draft.frames.keys()) {
      const k = parseFrameKey(name);
      if (!k || k.action !== "std" || k.frame !== 0 || !draft.meta.parts.some((p) => p.type === k.type)) continue;
      if (!out.has(k.type)) out.set(k.type, new Set());
      out.get(k.type)!.add(k.dir);
    }
    return [...out].map(([type, dirs]) => ({ type, dirs: [...dirs] }));
  }

  function setColor(c: string): void {
    color = c;
    colorInput.value = c;
    if (!recent.includes(c) && !GREYS.includes(c) && !BASICS.includes(c)) { recent.unshift(c); recent.length = Math.min(recent.length, 8); }
    renderPalette();
  }

  function renderPalette(): void {
    const sw = (c: string) => h("button", { class: "swatch" + (c.toLowerCase() === color.toLowerCase() ? " on" : ""), style: { background: c }, title: c, onclick: () => setColor(c) });
    paletteEl.replaceChildren(...(colorable() ? GREYS : [...GREYS, ...BASICS]).map(sw), ...recent.map(sw));
  }

  function renderTabs(): void {
    const av = available();
    if (!av.some((a) => a.type === layer)) layer = av[0]?.type ?? "";
    const dirs = av.find((a) => a.type === layer)?.dirs ?? [];
    if (!dirs.includes(dir)) dir = dirs.includes(2) ? 2 : dirs[0] ?? 2;
    layerEl.replaceChildren(...av.map((a) => h("button", { class: "tab" + (a.type === layer ? " on" : ""), onclick: () => { layer = a.type; renderAll(); } }, LAYER_NAMES[a.type] ?? a.type)));
    dirEl.replaceChildren(...VIEW_DIRS.filter((v) => dirs.includes(v.dir)).map((v) =>
      h("button", { class: "tab" + (v.dir === dir ? " on" : ""), title: v.name, onclick: () => { dir = v.dir; renderAll(); } }, `${v.arrow} ${v.name.split(" (")[0]}`)));
  }

  function renderTools(): void {
    const t = (id: Tool, label: string, title: string) => h("button", { class: "btn small" + (tool === id ? " on" : ""), title, onclick: () => { tool = id; renderTools(); } }, label);
    toolsEl.replaceChildren(
      t("pencil", "✏️", "Pencil"), t("eraser", "🧽", "Eraser"), t("fill", "🪣", "Fill"), t("pick", "💧", "Pick a colour"),
      t("lighten", "☀", "Lighten"), t("darken", "◐", "Darken"),
      h("button", { class: "btn small", title: "Undo", onclick: undo }, "↶"), h("button", { class: "btn small", title: "Redo", onclick: redo }, "↷"),
      h("button", { class: "btn small" + (grid ? " on" : ""), title: "Pixel grid", onclick: () => { grid = !grid; renderTools(); draw(); } }, "▦"),
      h("button", { class: "btn small" + (ghost ? " on" : ""), title: "Show the original art faintly underneath", onclick: () => { ghost = !ghost; renderTools(); draw(); } }, "👻"),
      h("button", { class: "btn small", title: "Zoom out", onclick: () => { zoom = Math.max(2, zoom - 1); layoutCanvas(); } }, "−"),
      h("button", { class: "btn small", title: "Zoom in", onclick: () => { zoom = Math.min(20, zoom + 1); layoutCanvas(); } }, "+"),
      h("button", { class: "btn small", title: "Empty this frame", onclick: () => { const f = current(); if (!f) return; snapshot(); f.canvas.getContext("2d")!.clearRect(0, 0, f.canvas.width, f.canvas.height); touched(); } }, "Clear"),
      h("button", { class: "btn small", title: "Back to the original art for this frame", onclick: resetFrame }, "Reset"));
  }

  function resetFrame(): void {
    const f = current();
    const orig = draft.original?.get(keyOf());
    if (!f || !orig) return;
    snapshot();
    const g = f.canvas.getContext("2d")!;
    f.canvas.width = orig.canvas.width;
    f.canvas.height = orig.canvas.height;
    g.drawImage(orig.canvas, 0, 0);
    f.ox = orig.ox;
    f.oy = orig.oy;
    f.edited = false;
    layoutCanvas();
    onChange();
  }

  // ---- canvas ------------------------------------------------------------------------------------------
  function layoutCanvas(): void {
    const f = current();
    if (!f) { view.width = 1; view.height = 1; info.textContent = "Nothing to paint here."; return; }
    view.width = f.canvas.width * zoom;
    view.height = f.canvas.height * zoom;
    view.style.width = `${view.width}px`;
    view.style.height = `${view.height}px`;
    info.textContent = `${LAYER_NAMES[layer] ?? layer} · ${f.canvas.width}×${f.canvas.height}px${colorable() ? " · tinted by the player's colour: paint in white/grey" : " · real colours"}${f.edited ? " · edited" : ""}`;
    draw();
  }

  function draw(): void {
    const f = current();
    if (!f) return;
    const g = view.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, view.width, view.height);
    // checkerboard so transparent pixels are visible
    const cs = Math.max(4, zoom);
    for (let y = 0; y * cs < view.height; y++) for (let x = 0; x * cs < view.width; x++) { g.fillStyle = (x + y) % 2 ? "#d9dee6" : "#c6ccd6"; g.fillRect(x * cs, y * cs, cs, cs); }
    const orig = draft.original?.get(keyOf());
    if (ghost && orig) { g.globalAlpha = 0.35; g.drawImage(orig.canvas, 0, 0, orig.canvas.width * zoom, orig.canvas.height * zoom); g.globalAlpha = 1; }
    g.drawImage(f.canvas, 0, 0, f.canvas.width * zoom, f.canvas.height * zoom);
    if (grid && zoom >= 5) {
      g.strokeStyle = "rgba(0,0,0,0.12)";
      g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x <= f.canvas.width; x++) { g.moveTo(x * zoom + 0.5, 0); g.lineTo(x * zoom + 0.5, view.height); }
      for (let y = 0; y <= f.canvas.height; y++) { g.moveTo(0, y * zoom + 0.5); g.lineTo(view.width, y * zoom + 0.5); }
      g.stroke();
    }
  }

  function touched(): void {
    const f = current();
    if (f) f.edited = true;
    layoutCanvas();
    onChange();
  }

  // ---- history -----------------------------------------------------------------------------------------
  function hist() {
    const f = current()!;
    let hs = history.get(keyOf());
    if (!hs || hs.canvas !== f.canvas) { hs = { canvas: f.canvas, undo: [], redo: [] }; history.set(keyOf(), hs); }
    return hs;
  }
  function snapshot(): void {
    const f = current();
    if (!f || !f.canvas.width) return;
    const hs = hist();
    hs.undo.push(f.canvas.getContext("2d")!.getImageData(0, 0, f.canvas.width, f.canvas.height));
    if (hs.undo.length > 40) hs.undo.shift();
    hs.redo.length = 0;
  }
  function undo(): void {
    const f = current();
    if (!f) return;
    const hs = hist();
    const prev = hs.undo.pop();
    if (!prev) return;
    const g = f.canvas.getContext("2d")!;
    hs.redo.push(g.getImageData(0, 0, f.canvas.width, f.canvas.height));
    g.putImageData(prev, 0, 0);
    touched();
  }
  function redo(): void {
    const f = current();
    if (!f) return;
    const hs = hist();
    const next = hs.redo.pop();
    if (!next) return;
    const g = f.canvas.getContext("2d")!;
    hs.undo.push(g.getImageData(0, 0, f.canvas.width, f.canvas.height));
    g.putImageData(next, 0, 0);
    touched();
  }

  // ---- painting ----------------------------------------------------------------------------------------
  const hexToRgb = (c: string) => ({ r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16) });

  function floodFill(f: DraftFrame, sx: number, sy: number): void {
    const w = f.canvas.width, hh = f.canvas.height;
    const g = f.canvas.getContext("2d")!;
    const img = g.getImageData(0, 0, w, hh);
    const d = img.data;
    const at = (x: number, y: number) => (y * w + x) * 4;
    const i0 = at(sx, sy);
    const target = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
    const c = hexToRgb(color);
    if (target[0] === c.r && target[1] === c.g && target[2] === c.b && target[3] === 255) return;
    const same = (i: number) => d[i] === target[0] && d[i + 1] === target[1] && d[i + 2] === target[2] && d[i + 3] === target[3];
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (x < 0 || y < 0 || x >= w || y >= hh) continue;
      const i = at(x, y);
      if (!same(i)) continue;
      d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    g.putImageData(img, 0, 0);
  }

  function paintPixel(f: DraftFrame, x: number, y: number, seen: Set<number>): void {
    if (x < 0 || y < 0 || x >= f.canvas.width || y >= f.canvas.height) return;
    const g = f.canvas.getContext("2d")!;
    if (tool === "pencil") { g.fillStyle = color; g.fillRect(x, y, 1, 1); }
    else if (tool === "eraser") g.clearRect(x, y, 1, 1);
    else if (tool === "lighten" || tool === "darken") {
      const id = y * f.canvas.width + x;
      if (seen.has(id)) return;
      seen.add(id);
      const px = g.getImageData(x, y, 1, 1);
      if (px.data[3] === 0) return;
      const k = tool === "lighten" ? 1.14 : 0.86;
      for (let i = 0; i < 3; i++) px.data[i] = Math.max(0, Math.min(255, Math.round(px.data[i] * k + (tool === "lighten" ? 6 : 0))));
      g.putImageData(px, x, y);
    }
  }

  let stroke: { last: { x: number; y: number }; seen: Set<number> } | null = null;
  const pixelAt = (e: PointerEvent) => {
    const r = view.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * (view.width / zoom)), y: Math.floor(((e.clientY - r.top) / r.height) * (view.height / zoom)) };
  };

  view.addEventListener("pointerdown", (e) => {
    const f = current();
    if (!f) return;
    e.preventDefault();
    const p = pixelAt(e);
    if (p.x < 0 || p.y < 0 || p.x >= f.canvas.width || p.y >= f.canvas.height) return;
    if (tool === "pick") {
      const d = f.canvas.getContext("2d")!.getImageData(p.x, p.y, 1, 1).data;
      if (d[3] > 0) setColor("#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join(""));
      tool = "pencil";
      renderTools();
      return;
    }
    snapshot();
    if (tool === "fill") { floodFill(f, p.x, p.y); touched(); return; }
    view.setPointerCapture(e.pointerId);
    stroke = { last: p, seen: new Set() };
    paintPixel(f, p.x, p.y, stroke.seen);
    draw();
  });
  view.addEventListener("pointermove", (e) => {
    const f = current();
    if (!stroke || !f) return;
    const p = pixelAt(e);
    // fill in the pixels between the last and this position so fast strokes have no gaps (Bresenham)
    let { x, y } = stroke.last;
    const dx = Math.abs(p.x - x), dy = Math.abs(p.y - y);
    const sx = x < p.x ? 1 : -1, sy = y < p.y ? 1 : -1;
    let err = dx - dy;
    for (let guard = 0; guard < 400; guard++) {
      paintPixel(f, x, y, stroke.seen);
      if (x === p.x && y === p.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    stroke.last = p;
    draw();
  });
  const endStroke = () => {
    if (!stroke) return;
    stroke = null;
    touched();
  };
  view.addEventListener("pointerup", endStroke);
  view.addEventListener("pointercancel", endStroke);

  const onKey = (e: KeyboardEvent) => {
    if (disposed || !(e.ctrlKey || e.metaKey) || (e.target instanceof HTMLInputElement)) return;
    if (e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  };
  window.addEventListener("keydown", onKey);

  function renderAll(): void {
    renderTabs();
    renderTools();
    renderPalette();
    const f = current();
    if (f) zoom = Math.max(3, Math.min(14, Math.floor(480 / Math.max(f.canvas.width, f.canvas.height))));
    layoutCanvas();
  }
  renderAll();

  return {
    refresh: renderAll,
    dispose() { disposed = true; window.removeEventListener("keydown", onKey); },
  };
}
