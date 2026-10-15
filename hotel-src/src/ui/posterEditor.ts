import { h } from "./dom";
import { POSTER_H, POSTER_W } from "../shared/furniture";

/** How the poster picture is made from a photo: cut to the poster's shape at its own small size, then the colours are rounded off a little (that is the pixelated look). */
export function makePosterPicture(img: CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }, zoom: number, panX: number, panY: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = POSTER_W;
  c.height = POSTER_H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e7d9a6";
  g.fillRect(0, 0, POSTER_W, POSTER_H);
  const iw = img.naturalWidth ?? img.width ?? POSTER_W, ih = img.naturalHeight ?? img.height ?? POSTER_H;
  const cover = Math.max(POSTER_W / iw, POSTER_H / ih) * zoom; // the photo fills the frame at zoom 1; more zoom = bigger
  const w = iw * cover, hgt = ih * cover;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, (POSTER_W - w) / 2 + panX, (POSTER_H - hgt) / 2 + panY, w, hgt);
  // 6 steps per colour: a little posterised, so it looks like it belongs in the game
  const d = g.getImageData(0, 0, POSTER_W, POSTER_H);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = Math.round(d.data[i] / 51) * 51;
    d.data[i + 1] = Math.round(d.data[i + 1] / 51) * 51;
    d.data[i + 2] = Math.round(d.data[i + 2] / 51) * 51;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return c;
}

/**
 * The menu that opens when a poster is hung: choose a photo, make it bigger or smaller, move it, and hang it up. Resolves with the picture
 * (a small PNG as a data address) or null if the player cancels. Once the poster is hung the picture can't be changed.
 */
export function pickPosterPicture(host: HTMLElement): Promise<string | null> {
  return new Promise((resolve) => {
    let image: HTMLImageElement | null = null;
    let zoom = 1, panX = 0, panY = 0;
    const SCALE = 5; // the preview shows each picture pixel 5 times bigger
    const preview = h("canvas", { class: "poster-preview", width: POSTER_W * SCALE, height: POSTER_H * SCALE }) as HTMLCanvasElement;
    const pg = preview.getContext("2d")!;
    const status = h("div", { class: "hint" }, "Choose a photo from your device. It is made smaller and a little pixelated so it fits the game.");
    const file = h("input", { type: "file", accept: "image/*", class: "poster-file" }) as HTMLInputElement;
    const slider = h("input", { type: "range", min: "1", max: "4", step: "0.05", value: "1", class: "poster-zoom", "aria-label": "Size" }) as HTMLInputElement;
    const ok = h("button", { class: "btn small primary", disabled: true }, "Hang it up") as HTMLButtonElement;
    const cancel = h("button", { class: "btn small" }, "Cancel");
    const el = h("div", { class: "cd-popup poster-editor", role: "dialog", "aria-label": "Poster picture" },
      h("div", { class: "cd-head" }, h("strong", {}, "🖼️ Poster"), h("button", { class: "btn small", onclick: () => done(null) }, "✕")),
      status,
      file,
      h("div", { class: "poster-stage" }, preview),
      h("label", { class: "poster-row" }, h("span", { class: "hint" }, "Size"), slider),
      h("div", { class: "hint" }, "Drag the picture to move it. When you hang the poster the picture is locked to it."),
      h("div", { class: "row center" }, cancel, ok));
    host.append(el);

    const draw = (): void => {
      pg.imageSmoothingEnabled = false;
      pg.clearRect(0, 0, preview.width, preview.height);
      if (image) pg.drawImage(makePosterPicture(image, zoom, panX, panY), 0, 0, preview.width, preview.height);
      else { pg.fillStyle = "#e7d9a6"; pg.fillRect(0, 0, preview.width, preview.height); pg.fillStyle = "#3a3a42"; pg.font = `bold ${POSTER_H * SCALE * 0.5}px sans-serif`; pg.textAlign = "center"; pg.textBaseline = "middle"; pg.fillText("?", preview.width / 2, preview.height / 2 + 4); }
    };
    draw();

    file.addEventListener("change", () => {
      const f = file.files?.[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { status.textContent = "That isn't a picture."; return; }
      const url = URL.createObjectURL(f);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); image = im; zoom = 1; panX = 0; panY = 0; slider.value = "1"; ok.disabled = false; status.textContent = "Make it bigger or smaller and move it until it looks right."; draw(); };
      im.onerror = () => { URL.revokeObjectURL(url); status.textContent = "That picture couldn't be opened. Try another one."; };
      im.src = url;
    });
    slider.addEventListener("input", () => { zoom = Number(slider.value) || 1; draw(); });
    // dragging moves the photo inside the frame (one preview pixel = 1/5 of a picture pixel)
    let drag: { x: number; y: number; px: number; py: number } | null = null;
    preview.addEventListener("pointerdown", (e) => { if (!image) return; drag = { x: e.clientX, y: e.clientY, px: panX, py: panY }; preview.setPointerCapture(e.pointerId); });
    preview.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const k = POSTER_W / preview.getBoundingClientRect().width; // client pixels -> picture pixels
      panX = drag.px + (e.clientX - drag.x) * k;
      panY = drag.py + (e.clientY - drag.y) * k;
      draw();
    });
    const stop = (): void => { drag = null; };
    preview.addEventListener("pointerup", stop);
    preview.addEventListener("pointercancel", stop);

    let finished = false;
    function done(result: string | null): void {
      if (finished) return;
      finished = true;
      el.remove();
      resolve(result);
    }
    cancel.addEventListener("click", () => done(null));
    ok.addEventListener("click", () => { if (image) done(makePosterPicture(image, zoom, panX, panY).toDataURL("image/png")); });
  });
}
