// The unusuals' effects: pictures baked from Habbo's effect files (scripts/bake-fx.mjs makes public/fx/<id>.png and .json). An effect is drawn in two goes: the layers
// that go behind the one who wears it, then the ones in front. Positions come from the avatar's origin: x from the left edge of its 64 pixel wide picture, y from its feet.
import { assetUrl } from "../assetUrl";

interface FxLayer extends Array<number> { 0: number; 1: number; 2: number; 3: number }
interface FxFrame { ms: number; s: FxLayer[] }
interface FxData { w: number; h: number; rects: number[][]; anim: Record<string, FxFrame[]> }
interface FxEntry { img: HTMLImageElement; data: FxData | null; ends: Record<string, number[]> }

const entries = new Map<string, FxEntry>();

function load(id: string): FxEntry {
  let e = entries.get(id);
  if (e) return e;
  e = { img: new Image(), data: null, ends: {} };
  entries.set(id, e);
  e.img.src = assetUrl(`fx/${id}.png`);
  fetch(assetUrl(`fx/${id}.json`)).then((r) => (r.ok ? r.json() : null)).then((d: FxData | null) => {
    if (!d) return;
    for (const [k, frames] of Object.entries(d.anim)) { let t = 0; e!.ends[k] = frames.map((f) => (t += f.ms)); }
    e!.data = d;
  }).catch(() => undefined);
  return e;
}

/** Starts loading these effects (so they are there when somebody puts one on). */
export function preloadFx(ids: readonly string[]): void { for (const id of ids) load(id); }

/**
 * Draws one effect for somebody whose feet are at (feetX, feetY): the layers behind them (`behind`) or the ones in front. `size` is how big a pixel is
 * (the room's scale; a pet passes less), `dir` the way they face (0-7) and `now` the time in milliseconds.
 */
export function drawFx(g: CanvasRenderingContext2D, id: string, behind: boolean, feetX: number, feetY: number, size: number, dir: number, now: number): void {
  const e = load(id);
  const d = e.data;
  if (!d || !e.img.complete || !e.img.naturalWidth) return;
  const key = d.anim["*"] ? "*" : String(((dir % 8) + 8) % 8);
  const frames = d.anim[key] ?? d.anim["0"];
  const ends = e.ends[key] ?? e.ends["0"];
  if (!frames || !ends || !frames.length) return;
  const total = ends[ends.length - 1];
  const t = total > 0 ? now % total : 0;
  let i = 0;
  while (i < ends.length - 1 && t >= ends[i]) i++;
  const ox = feetX - 32 * size, oy = feetY;
  g.save();
  g.imageSmoothingEnabled = false;
  for (const l of frames[i].s) {
    if ((l[3] < 0) !== behind) continue;
    const r = d.rects[l[0]];
    g.drawImage(e.img, r[0], r[1], r[2], r[3], Math.round(ox + l[1] * size), Math.round(oy + l[2] * size), r[2] * size, r[3] * size);
  }
  g.restore();
}
