// Isometric room drawing shared by the live room (ui/room.ts) and the first-run room picker previews.
import { assetUrl } from "./assetUrl";
import { footprint, FURNI_KINDS, RoomDef, RoomTheme } from "./rooms";
import { derive, loadNitro, nitroIfReady, NitroFurni, spritesFor } from "./nitro";

export const TILE_W = 64;
export const TILE_H = 32;
export const WALL_H = 120;
export const DOOR_H = 86;

export interface Pt { x: number; y: number }

export const iso = (x: number, y: number): Pt => ({ x: (x - y) * (TILE_W / 2), y: (x + y) * (TILE_H / 2) });

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

// ---- textures (small repeating patterns from the Habbo asset dump) ---------------------------------
const textures = new Map<string, HTMLImageElement | null>();

function loadTexture(kind: "floor" | "wall", id: string): Promise<void> {
  const key = `${kind}_${id}`;
  if (textures.has(key)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { textures.set(key, img); resolve(); };
    img.onerror = () => { textures.set(key, null); resolve(); };
    img.src = assetUrl(`textures/${key}.png`);
  });
}

/** Loads the textures a theme uses. Draw the room again once this resolves. */
export function ensureTextures(theme: Partial<RoomTheme>): Promise<void> {
  return Promise.all([
    theme.floorTex ? loadTexture("floor", theme.floorTex) : null,
    theme.wallTex ? loadTexture("wall", theme.wallTex) : null,
  ]).then(() => undefined);
}

const texture = (kind: "floor" | "wall", id?: string) => (id ? textures.get(`${kind}_${id}`) ?? null : null);

// ---- dirty concrete (procedural, so no texture files are needed) ----------------------------------------------
/** Small seeded random generator: the same room always gets the same stains, so redraws don't shimmer. */
function seeded(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stains, grit, cracks, rust, water streaks and (on floors) puddles, painted over a polygon. */
function paintGrime(x: CanvasRenderingContext2D, pts: Pt[], kind: "wall" | "floor", seed: number): void {
  const r = seeded(seed);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
  const rnd = (a: number, b: number) => a + r() * (b - a);
  x.save();
  x.beginPath();
  pts.forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)));
  x.closePath();
  x.clip();

  // big soft blotches: damp patches, soot, a few paler worn areas
  const blotches = Math.round((bw * bh) / 5200);
  for (let i = 0; i < blotches; i++) {
    const cx = rnd(bx, bx + bw), cy = rnd(by, by + bh), rad = rnd(18, kind === "wall" ? 70 : 90);
    const dark = r() < 0.78;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const col = dark ? (r() < 0.25 ? "40,30,22" : "12,14,14") : "170,172,165";
    g.addColorStop(0, `rgba(${col},${dark ? rnd(0.12, 0.34) : rnd(0.05, 0.12)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g;
    x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }

  // grit
  const specks = Math.round((bw * bh) / 26);
  for (let i = 0; i < specks; i++) {
    const light = r() < 0.38;
    x.fillStyle = light ? `rgba(200,205,200,${rnd(0.04, 0.16)})` : `rgba(0,0,0,${rnd(0.08, 0.3)})`;
    x.fillRect(rnd(bx, bx + bw), rnd(by, by + bh), r() < 0.85 ? 1 : 2, r() < 0.85 ? 1 : 2);
  }

  if (kind === "wall") {
    // water streaks running down from the top, rust trails, and a few dark red drips
    const streaks = Math.round(bw / 11);
    for (let i = 0; i < streaks; i++) {
      const sx = rnd(bx, bx + bw), sy = by + rnd(-10, bh * 0.55), len = rnd(30, 140), wd = rnd(1.5, 7);
      const rust = r() < 0.2;
      const g = x.createLinearGradient(0, sy, 0, sy + len);
      const col = rust ? "112,52,24" : "22,20,18";
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(0.15, `rgba(${col},${rust ? rnd(0.22, 0.38) : rnd(0.16, 0.34)})`);
      g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g;
      x.fillRect(sx, sy, wd, len);
    }
    for (let i = 0; i < Math.max(2, Math.round(bw / 120)); i++) {
      const sx = rnd(bx + 8, bx + bw - 8), sy = by + rnd(bh * 0.1, bh * 0.45), len = rnd(18, 64);
      const g = x.createLinearGradient(0, sy, 0, sy + len);
      g.addColorStop(0, "rgba(88,12,10,.0)");
      g.addColorStop(0.2, "rgba(88,12,10,.55)");
      g.addColorStop(1, "rgba(60,8,8,.5)");
      x.fillStyle = g;
      x.fillRect(sx, sy, 2, len);
      x.fillStyle = "rgba(60,8,8,.6)";
      x.beginPath(); x.arc(sx + 1, sy + len, 2.2, 0, Math.PI * 2); x.fill();
    }
    // grimier toward the floor
    const g = x.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, "rgba(0,0,0,0.12)");
    g.addColorStop(0.55, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.28)");
    x.fillStyle = g;
    x.fillRect(bx, by, bw, bh);
  } else {
    // puddles: dark ellipses squashed to the floor's perspective, with a faint wet sheen, and a stain or two
    for (let i = 0; i < 5; i++) {
      const cx = rnd(bx + bw * 0.2, bx + bw * 0.8), cy = rnd(by + bh * 0.3, by + bh * 0.8), rw = rnd(16, 46);
      const pg = x.createRadialGradient(cx, cy, rw * 0.15, cx, cy, rw);
      pg.addColorStop(0, "rgba(8,12,14,.4)");
      pg.addColorStop(0.75, "rgba(8,12,14,.28)");
      pg.addColorStop(1, "rgba(8,12,14,0)");
      x.fillStyle = pg;
      x.save();
      x.translate(cx, cy);
      x.scale(1, 0.5);
      x.beginPath(); x.arc(0, 0, rw, 0, Math.PI * 2); x.fill();
      x.restore();
      x.strokeStyle = "rgba(190,205,210,.14)";
      x.lineWidth = 1;
      x.beginPath(); x.ellipse(cx - rw * 0.15, cy - rw * 0.08, rw * 0.7, rw * 0.3, 0, Math.PI * 1.05, Math.PI * 1.7); x.stroke();
    }
    for (let i = 0; i < 2; i++) {
      const cx = rnd(bx + bw * 0.25, bx + bw * 0.75), cy = rnd(by + bh * 0.35, by + bh * 0.75), rw = rnd(14, 34);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rw);
      g.addColorStop(0, "rgba(78,14,12,.5)");
      g.addColorStop(1, "rgba(78,14,12,0)");
      x.fillStyle = g;
      x.beginPath(); x.ellipse(cx, cy, rw, rw / 2, 0, 0, Math.PI * 2); x.fill();
    }
  }

  // cracks that branch
  const crack = (sx: number, sy: number, dx: number, dy: number, steps: number, depth: number) => {
    x.beginPath();
    x.moveTo(sx, sy);
    let cx = sx, cy = sy;
    for (let i = 0; i < steps; i++) {
      cx += dx * rnd(3, 8) + rnd(-3, 3);
      cy += dy * rnd(3, 8) + rnd(-3, 3);
      x.lineTo(cx, cy);
      if (depth > 0 && r() < 0.12) crack(cx, cy, dx + rnd(-1, 1), dy + rnd(-0.6, 0.6), Math.round(steps / 2), depth - 1);
      x.moveTo(cx, cy);
    }
    x.strokeStyle = `rgba(6,6,6,${rnd(0.45, 0.7)})`;
    x.lineWidth = rnd(0.7, 1.4);
    x.stroke();
  };
  const cracks = Math.max(2, Math.round((bw * bh) / 38000));
  for (let i = 0; i < cracks; i++) {
    const ang = kind === "wall" ? rnd(0.9, 2.2) : rnd(0, Math.PI);
    crack(rnd(bx, bx + bw), rnd(by, by + bh), Math.cos(ang), Math.sin(ang), Math.round(rnd(10, 26)), 2);
  }
  x.restore();
}

// ---- the room shell: floor, walls ------------------------------------------------------------------
export interface Shell {
  canvas: HTMLCanvasElement;
  /** where the room's (0,0) iso point sits inside the canvas */
  origin: Pt;
}

export function renderRoomShell(def: RoomDef): Shell {
  const W = def.w;
  const H = def.h;
  const t = def.theme;
  const minX = -H * (TILE_W / 2) - 8;
  const maxX = W * (TILE_W / 2) + 8;
  const minY = -WALL_H - 8;
  const maxY = (W + H) * (TILE_H / 2) + 20;
  const c = document.createElement("canvas");
  c.width = maxX - minX;
  c.height = maxY - minY;
  const x = c.getContext("2d")!;
  x.translate(-minX, -minY);
  const path = (pts: Pt[]) => {
    x.beginPath();
    pts.forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)));
    x.closePath();
  };
  const poly = (pts: Pt[], fill: string, stroke?: string) => {
    path(pts);
    x.fillStyle = fill;
    x.fill();
    if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1; x.stroke(); }
  };
  const patternOf = (img: HTMLImageElement): CanvasPattern | null => {
    const pat = x.createPattern(img, "repeat");
    pat?.setTransform(new DOMMatrix([2, 0, 0, 2, 0, 0])); // the dump's textures are half-size
    return pat;
  };

  const o = iso(0, 0);
  const bl = iso(0, H);
  const br = iso(W, 0);
  const wallTex = texture("wall", t.wallTex);
  const wallPat = wallTex ? patternOf(wallTex) : null;
  const rightWall = [o, br, { x: br.x, y: br.y - WALL_H }, { x: o.x, y: o.y - WALL_H }];
  const leftWall = [o, bl, { x: bl.x, y: bl.y - WALL_H }, { x: o.x, y: o.y - WALL_H }];
  // walls: right wall along y = 0 (running down-right), left wall along x = 0 (running down-left)
  poly(rightWall, shade(t.wall, 1), shade(t.wall, 0.8));
  poly(leftWall, shade(t.wall, 0.88), shade(t.wall, 0.8));
  if (wallPat) {
    for (const side of [1, -1]) {
      x.save();
      path(side === 1 ? rightWall : leftWall);
      x.clip();
      x.transform(side, 0.5, 0, 1, o.x, o.y - WALL_H); // the texture runs along the wall's slope
      x.fillStyle = wallPat;
      x.fillRect(0, 0, (side === 1 ? W : H) * (TILE_W / 2), WALL_H);
      x.restore();
    }
    poly(leftWall, "rgba(0,0,0,0.14)");
  }
  // baseboards
  poly([o, br, { x: br.x, y: br.y - 10 }, { x: o.x, y: o.y - 10 }], shade(t.wall, 0.72));
  poly([o, bl, { x: bl.x, y: bl.y - 10 }, { x: o.x, y: o.y - 10 }], shade(t.wall, 0.64));
  if (t.style === "grime") {
    paintGrime(x, rightWall, "wall", 11);
    paintGrime(x, leftWall, "wall", 23);
  }
  // floor edge thickness
  const bot = iso(W, H);
  poly([bl, bot, { x: bot.x, y: bot.y + 8 }, { x: bl.x, y: bl.y + 8 }], shade(t.floorA, 0.6));
  poly([br, bot, { x: bot.x, y: bot.y + 8 }, { x: br.x, y: br.y + 8 }], shade(t.floorA, 0.45));
  // tiles
  const floorTex = texture("floor", t.floorTex);
  const floorPat = floorTex ? patternOf(floorTex) : null;
  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const p = iso(tx, ty);
      const r = def.rug;
      const rug = !!r && tx >= r.x0 && tx < r.x0 + r.w && ty >= r.y0 && ty < r.y0 + r.h;
      const edgeRug = rug && !!r && (tx === r.x0 || tx === r.x0 + r.w - 1 || ty === r.y0 || ty === r.y0 + r.h - 1);
      const fill = rug ? shade(t.rugColor, edgeRug ? 0.88 : 1) : (tx + ty) % 2 ? t.floorA : t.floorB;
      const tile = [
        { x: p.x, y: p.y },
        { x: p.x + TILE_W / 2, y: p.y + TILE_H / 2 },
        { x: p.x, y: p.y + TILE_H },
        { x: p.x - TILE_W / 2, y: p.y + TILE_H / 2 },
      ];
      poly(tile, fill, "rgba(0,0,0,0.12)");
      if (floorPat && !rug) {
        x.save();
        path(tile);
        x.clip();
        x.globalCompositeOperation = "multiply";
        x.translate(p.x - TILE_W / 2, p.y);
        x.fillStyle = floorPat;
        x.fillRect(0, 0, TILE_W, TILE_H);
        x.restore();
      }
    }
  }
  if (t.style === "grime") {
    paintGrime(x, [iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)], "floor", 37);
    // the room darkens toward the walls, as if one dim bulb lit the middle
    const mid = iso(W / 2, H / 2);
    const g = x.createRadialGradient(mid.x, mid.y + TILE_H / 2, 20, mid.x, mid.y + TILE_H / 2, Math.max(W, H) * TILE_W * 0.55);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.42)");
    x.save();
    x.beginPath();
    [iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)].forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)));
    x.closePath();
    x.clip();
    x.fillStyle = g;
    x.fillRect(minX, minY, maxX - minX, maxY - minY);
    x.restore();
  }
  return { canvas: c, origin: { x: -minX, y: -minY } };
}

// ---- furniture boxes ----------------------------------------------------------------------------------
export interface FurniBase {
  A: Pt; B: Pt; C: Pt; D: Pt;
  /** the same corner on the floor */
  gd: (p: Pt) => Pt;
  fill: (pts: Pt[], color: string) => void;
}

/** Draws a piece of furniture as a shaded box and hands back its corners (so callers can add details on top). */
export function drawFurniBase(g: CanvasRenderingContext2D, kindId: string, tx: number, ty: number, toScreen: (p: Pt) => Pt, scale: number): FurniBase {
  const k = FURNI_KINDS[kindId];
  const top = (x: number, y: number, dz: number): Pt => {
    const p = toScreen(iso(x, y));
    return { x: p.x, y: p.y - dz * scale };
  };
  const A = top(tx, ty, k.height);
  const B = top(tx + k.w, ty, k.height);
  const C = top(tx + k.w, ty + k.h, k.height);
  const D = top(tx, ty + k.h, k.height);
  const gd = (pt: Pt): Pt => ({ x: pt.x, y: pt.y + k.height * scale });
  const fill = (pts: Pt[], color: string) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
    g.fillStyle = color;
    g.fill();
  };
  fill([D, C, gd(C), gd(D)], shade(k.color, 0.7));
  fill([B, C, gd(C), gd(B)], shade(k.color, 0.55));
  fill([A, B, C, D], shade(k.color, 1.05));
  return { A, B, C, D, gd, fill };
}

// ---- sprite furniture (.nitro files) ---------------------------------------------------------------------
/** Starts loading the .nitro art of every sprite piece in a room. The pieces appear on their own once loaded. */
export function ensureFurniSprites(def: RoomDef): Promise<void> {
  const paths = new Set(def.furni.map((f) => FURNI_KINDS[f.kind]?.nitro).filter((p): p is string => !!p));
  return Promise.all([...paths].map((p) => loadNitro(p))).then(() => undefined);
}

/** Draws sprite art standing on the floor footprint (w x h tiles) at (tx, ty). The art's anchor is the centre of that footprint. */
export function drawNitroSprites(g: CanvasRenderingContext2D, n: NitroFurni, w: number, h: number, tx: number, ty: number, dir: number, nudge: { x: number; y: number } | undefined, toScreen: (p: Pt) => Pt, scale: number, alpha = 1): Box | null {
  const o = toScreen(iso(tx + w / 2, ty + h / 2)); // 1x1: the middle of the tile's diamond
  const ox = o.x + (nudge?.x ?? 0) * scale;
  const oy = o.y + (nudge?.y ?? 0) * scale;
  const prevSmoothing = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  let box: Box | null = null;
  for (const s of spritesFor(n, dir)) {
    const sw = s.sw * scale;
    const sh = s.sh * scale;
    const left = ox + s.dx * scale;
    const top = oy + s.dy * scale;
    if (!s.isShadow && s.sw > 2 && s.sh > 2) {
      box = box ? { x0: Math.min(box.x0, left), y0: Math.min(box.y0, top), x1: Math.max(box.x1, left + sw), y1: Math.max(box.y1, top + sh) } : { x0: left, y0: top, x1: left + sw, y1: top + sh };
    }
    g.save();
    g.globalAlpha = alpha * (s.isShadow ? 0.22 : 1); // the shadow art is solid black; the game draws it faint
    if (s.flipH) {
      g.translate(left + sw, top);
      g.scale(-1, 1);
      g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, 0, 0, sw, sh);
    } else {
      g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, left, top, sw, sh);
    }
    g.restore();
  }
  g.imageSmoothingEnabled = prevSmoothing;
  return box;
}

/** Draws a placed .nitro piece of a registered furniture kind. Returns false until its art has loaded. */
export function drawNitroFurni(g: CanvasRenderingContext2D, kindId: string, tx: number, ty: number, dir: number, toScreen: (p: Pt) => Pt, scale: number, alpha = 1): boolean {
  const k = FURNI_KINDS[kindId];
  const n = k?.nitro ? nitroIfReady(k.nitro) : undefined;
  if (!n) return false;
  const fp = footprint(kindId, dir);
  drawNitroSprites(g, n, fp.w, fp.h, tx, ty, dir, k.nudge, toScreen, scale, alpha);
  return true;
}

// ---- the door -------------------------------------------------------------------------------------------
export interface Box { x0: number; y0: number; x1: number; y1: number }

/** Draws the door on the back-right wall above tile (doorX, 0) and returns its click box. glow 0..1 lights it up (hover). */
export function drawDoor(g: CanvasRenderingContext2D, doorX: number, toScreen: (p: Pt) => Pt, scale: number, label: string, glow: number, worn = false): Box {
  const BL = toScreen(iso(doorX, 0));
  const BR = toScreen(iso(doorX + 1, 0));
  const P = (u: number, v: number): Pt => ({ x: BL.x + (BR.x - BL.x) * u, y: BL.y + (BR.y - BL.y) * u - v * scale });
  const quad = (u0: number, v0: number, u1: number, v1: number): Pt[] => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  const fillQuad = (pts: Pt[], style: string | CanvasGradient) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
    g.fillStyle = style;
    g.fill();
  };
  // frame, then the door leaf
  fillQuad(quad(-0.07, 0, 1.07, DOOR_H + 7), worn ? "#14110f" : "#2e1b10");
  const leaf = g.createLinearGradient(BL.x, 0, BR.x, 0);
  leaf.addColorStop(0, worn ? "#4d4740" : "#8d5c35"); // worn = a scarred steel door
  leaf.addColorStop(1, worn ? "#35312c" : "#6a4125");
  fillQuad(quad(0.03, 0, 0.97, DOOR_H), leaf);
  // two raised panels
  fillQuad(quad(0.14, 8, 0.86, 38), "rgba(0,0,0,0.18)");
  fillQuad(quad(0.14, 46, 0.86, 76), "rgba(0,0,0,0.18)");
  fillQuad(quad(0.17, 11, 0.83, 35), "rgba(255,255,255,0.07)");
  fillQuad(quad(0.17, 49, 0.83, 73), "rgba(255,255,255,0.07)");
  // knob
  const knob = P(0.82, 42);
  if (worn) {
    // rust streaks down the door
    fillQuad(quad(0.12, 20, 0.2, DOOR_H - 4), "rgba(110,52,24,.38)");
    fillQuad(quad(0.55, 8, 0.62, DOOR_H - 18), "rgba(90,40,18,.32)");
    fillQuad(quad(0.78, 30, 0.84, DOOR_H - 2), "rgba(30,26,22,.4)");
  }
  g.fillStyle = worn ? "#8c8576" : "#e6c14d";
  g.beginPath(); g.arc(knob.x, knob.y, 3 * scale, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.beginPath(); g.arc(knob.x - scale, knob.y - scale, 1 * scale, 0, Math.PI * 2); g.fill();
  if (glow > 0) fillQuad(quad(0.03, 0, 0.97, DOOR_H), `rgba(255,236,150,${(0.28 * glow).toFixed(2)})`);
  // sign above
  fillQuad(quad(-0.12, DOOR_H + 11, 1.12, DOOR_H + 27), worn ? "#2a1210" : "#16255c");
  const c = P(0.5, DOOR_H + 19);
  g.save();
  g.font = `bold ${Math.round(9 * Math.max(1, scale))}px Verdana, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = glow > 0 ? "#fff6b0" : worn ? "#d98a7a" : "#d6e0ff";
  g.fillText(label, c.x, c.y);
  g.restore();
  const pts = [P(-0.12, 0), P(1.12, 0), P(1.12, DOOR_H + 27), P(-0.12, DOOR_H + 27)];
  return { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), y1: Math.max(...pts.map((p) => p.y)) };
}

// ---- the real door: Habbo's teleport door (.nitro), carpet erased, plain colour or fully greyscale -------------------
const DOOR_PATH = "furni/teleport_door.nitro";
/** the way the door faces: dir 4 looks into the room from the back-right wall */
const DOOR_DIR = 4;
let doorColour: NitroFurni | null = null;
let doorGrey: NitroFurni | null = null;

/** Loads the door art (once) and prepares its two looks. Draw again when it resolves; until then the old painted door is used. */
export function ensureDoorArt(): Promise<void> {
  if (doorColour) return Promise.resolve();
  return loadNitro(DOOR_PATH).then((n) => {
    if (!n || doorColour) return;
    // the red doormat is painted into the door frame's sprite: wipe the strongly red pixels at its bottom
    const clean = derive(n, (g) => {
      for (const [key, f] of Object.entries(n.json.spritesheet.frames)) {
        if (!/_64_[abc]_/.test(key)) continue;
        const frameA = /_64_a_/.test(key); // the frame's own sprite carries the mat; the leaf sprites only have a few red specks
        const { x, y, w, h } = f.frame;
        if (w < 3 || h < 3) continue;
        const img = g.getImageData(x, y, w, h);
        const d = img.data;
        const top = Math.floor(h * 0.6);
        const wiped = new Set<number>();
        for (let py = top; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const i = (py * w + px) * 4;
            const r = d[i], gg = d[i + 1], b = d[i + 2];
            if (d[i + 3] > 0 && r > 80 && gg < r * 0.34 && b < r * 0.34) { d[i + 3] = 0; wiped.add(py * w + px); }
          }
        }
        // the mat also had a thin, dotted black outline: take the dark pixels within two pixels of the wiped area
        const dark = (i: number) => d[i + 3] > 0 && d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40;
        const touching: number[] = [];
        for (let py = top; py < h && frameA; py++) {
          for (let px = 0; px < w; px++) {
            const i = (py * w + px) * 4;
            if (!dark(i)) continue;
            let near = false;
            for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) if (wiped.has((py + dy) * w + px + dx)) near = true;
            if (near) touching.push(i);
          }
        }
        for (const i of touching) d[i + 3] = 0;
        g.putImageData(img, x, y);
      }
    });
    doorColour = clean;
    doorGrey = derive(clean, (g, w, h) => {
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const l = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
        d[i] = d[i + 1] = d[i + 2] = l;
      }
      g.putImageData(img, 0, 0);
    });
  });
}

/** Draws the room's door on the back-right wall and returns its click box. The painted door is the fallback while the art loads. */
export function drawRoomDoor(g: CanvasRenderingContext2D, doorX: number, toScreen: (p: Pt) => Pt, scale: number, glow: number, grey: boolean): Box {
  const art = grey ? doorGrey : doorColour;
  if (!art) return drawDoor(g, doorX, toScreen, scale, "", glow, grey);
  const box = drawNitroSprites(g, art, 1, 1, doorX, 0, DOOR_DIR, undefined, toScreen, scale);
  if (glow > 0) {
    g.save();
    g.globalCompositeOperation = "lighter";
    drawNitroSprites(g, art, 1, 1, doorX, 0, DOOR_DIR, undefined, toScreen, scale, 0.22 * glow);
    g.restore();
  }
  return box ?? drawDoor(g, doorX, toScreen, scale, "", glow, grey);
}

// ---- small static preview (room picker cards) ----------------------------------------------------------
/** A still picture of a room (floor, walls, furniture, door) that fits `width` px wide. Textures must be loaded first (ensureTextures). */
export function renderRoomPreview(def: RoomDef, width: number): HTMLCanvasElement {
  const shell = renderRoomShell(def);
  const scale = width / shell.canvas.width;
  const out = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  out.width = Math.round(width * dpr);
  out.height = Math.round(shell.canvas.height * scale * dpr);
  out.style.width = `${width}px`;
  out.style.height = `${Math.round(shell.canvas.height * scale)}px`;
  const g = out.getContext("2d")!;
  g.scale(dpr, dpr);
  g.imageSmoothingQuality = "high";
  g.drawImage(shell.canvas, 0, 0, width, shell.canvas.height * scale);
  const toScreen = (p: Pt): Pt => ({ x: (shell.origin.x + p.x) * scale, y: (shell.origin.y + p.y) * scale });
  drawRoomDoor(g, def.doorX, toScreen, scale, 0, def.theme.style === "grime");
  void ensureFurniSprites(def);
  [...def.furni].filter((f) => !FURNI_KINDS[f.kind].nitro)
    .sort((a, b) => a.x + FURNI_KINDS[a.kind].w + a.y + FURNI_KINDS[a.kind].h - (b.x + FURNI_KINDS[b.kind].w + b.y + FURNI_KINDS[b.kind].h))
    .forEach((f) => drawFurniBase(g, f.kind, f.x, f.y, toScreen, scale));
  return out;
}
