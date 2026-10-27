import { h } from "./dom";

/**
 * A colour wheel for the wardrobe and the clothes shop: round hue and saturation disc, a brightness slider and a hex field. It picks any colour, not just the ones on the palette.
 * (A clothing colour that is not on the palette is written in the figure as "x" and six hex digits: see the avatar renderer and the server's look check.)
 */
export interface ColorWheel { el: HTMLElement; set(hex: string): void }

const SIZE = 150;

function hsvToRgb(hh: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(hh * 6) % 6, f = hh * 6 - Math.floor(hh * 6);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let hh = 0;
  if (d) hh = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return [hh, max ? d / max : 0, max];
}
const toHex = (rgb: [number, number, number]): string => rgb.map((n) => n.toString(16).padStart(2, "0")).join("");

/** `start` is a hex without the #; `onChange` gets the hex (six lowercase digits, no #) while the wheel is dragged. */
export function createColorWheel(start: string, onChange: (hex: string) => void): ColorWheel {
  let [hue, sat, val] = /^[0-9a-f]{6}$/i.test(start) ? rgbToHsv(parseInt(start.slice(0, 2), 16), parseInt(start.slice(2, 4), 16), parseInt(start.slice(4, 6), 16)) : [0.6, 0.5, 0.9];
  const canvas = h("canvas", { class: "cw-disc", width: SIZE, height: SIZE, "aria-label": "Colour wheel" }) as HTMLCanvasElement;
  const knob = h("div", { class: "cw-knob" });
  const bright = h("input", { type: "range", class: "cw-bright", min: "5", max: "100", step: "1", value: String(Math.round(val * 100)), "aria-label": "Brightness" }) as HTMLInputElement;
  const hexIn = h("input", { type: "text", class: "cw-hex mini-input", maxlength: "7", spellcheck: false, "aria-label": "Hex colour" }) as HTMLInputElement;
  const chip = h("span", { class: "cw-chip" });
  const ctx2 = canvas.getContext("2d")!;

  function drawDisc(): void {
    const img = ctx2.createImageData(SIZE, SIZE);
    const c = SIZE / 2;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.sqrt(dx * dx + dy * dy) / c;
        const i = (y * SIZE + x) * 4;
        if (r > 1) { img.data[i + 3] = 0; continue; }
        const [R, G, B] = hsvToRgb(((Math.atan2(dy, dx) / (2 * Math.PI)) + 1) % 1, r, val);
        img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = B; img.data[i + 3] = r > 0.985 ? 150 : 255; // (a soft rim)
      }
    }
    ctx2.putImageData(img, 0, 0);
  }
  const current = (): string => toHex(hsvToRgb(hue, sat, val));
  function show(fire: boolean): void {
    const c = SIZE / 2, ang = hue * 2 * Math.PI;
    knob.style.left = `${c + Math.cos(ang) * sat * c}px`;
    knob.style.top = `${c + Math.sin(ang) * sat * c}px`;
    const hex = current();
    knob.style.background = "#" + hex;
    chip.style.background = "#" + hex;
    if (document.activeElement !== hexIn) hexIn.value = "#" + hex;
    if (fire) onChange(hex);
  }
  function pick(e: PointerEvent): void {
    const r = canvas.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width) * SIZE - SIZE / 2, dy = ((e.clientY - r.top) / r.height) * SIZE - SIZE / 2;
    hue = ((Math.atan2(dy, dx) / (2 * Math.PI)) + 1) % 1;
    sat = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (SIZE / 2));
    show(true);
  }
  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); pick(e); e.preventDefault(); });
  canvas.addEventListener("pointermove", (e) => { if (dragging) pick(e); });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  bright.addEventListener("input", () => { val = Number(bright.value) / 100; drawDisc(); show(true); });
  hexIn.addEventListener("input", () => {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hexIn.value.trim());
    if (!m) return;
    [hue, sat, val] = rgbToHsv(parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16));
    bright.value = String(Math.max(5, Math.round(val * 100)));
    drawDisc(); show(true);
  });
  hexIn.addEventListener("blur", () => { hexIn.value = "#" + current(); });

  drawDisc(); show(false);
  const el = h("div", { class: "cw" },
    h("div", { class: "cw-wheel" }, canvas, knob),
    h("div", { class: "cw-side" }, h("label", { class: "cw-label" }, "Brightness"), bright, h("div", { class: "cw-row" }, chip, hexIn)));
  return {
    el,
    set(hex: string): void {
      if (!/^[0-9a-f]{6}$/i.test(hex)) return;
      [hue, sat, val] = rgbToHsv(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
      bright.value = String(Math.max(5, Math.round(val * 100)));
      drawDisc(); show(false);
    },
  };
}
