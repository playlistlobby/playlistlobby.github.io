// Isometric room drawing shared by the live room (ui/room.ts) and the first-run room picker previews.
import { assetUrl } from "./assetUrl";
import { footprint, FURNI_KINDS, RoomDef, RoomTheme } from "./rooms";
import { loadNitro, nitroIfReady, NitroFurni, spritesFor } from "./nitro";

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
export function drawNitroSprites(g: CanvasRenderingContext2D, n: NitroFurni, w: number, h: number, tx: number, ty: number, dir: number, nudge: { x: number; y: number } | undefined, toScreen: (p: Pt) => Pt, scale: number, alpha = 1): void {
  const o = toScreen(iso(tx + w / 2, ty + h / 2)); // 1x1: the middle of the tile's diamond
  const ox = o.x + (nudge?.x ?? 0) * scale;
  const oy = o.y + (nudge?.y ?? 0) * scale;
  const prevSmoothing = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  for (const s of spritesFor(n, dir)) {
    const sw = s.sw * scale;
    const sh = s.sh * scale;
    const left = ox + s.dx * scale;
    const top = oy + s.dy * scale;
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
export function drawDoor(g: CanvasRenderingContext2D, doorX: number, toScreen: (p: Pt) => Pt, scale: number, label: string, glow: number): Box {
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
  fillQuad(quad(-0.07, 0, 1.07, DOOR_H + 7), "#2e1b10");
  const leaf = g.createLinearGradient(BL.x, 0, BR.x, 0);
  leaf.addColorStop(0, "#8d5c35");
  leaf.addColorStop(1, "#6a4125");
  fillQuad(quad(0.03, 0, 0.97, DOOR_H), leaf);
  // two raised panels
  fillQuad(quad(0.14, 8, 0.86, 38), "rgba(0,0,0,0.18)");
  fillQuad(quad(0.14, 46, 0.86, 76), "rgba(0,0,0,0.18)");
  fillQuad(quad(0.17, 11, 0.83, 35), "rgba(255,255,255,0.07)");
  fillQuad(quad(0.17, 49, 0.83, 73), "rgba(255,255,255,0.07)");
  // knob
  const knob = P(0.82, 42);
  g.fillStyle = "#e6c14d";
  g.beginPath(); g.arc(knob.x, knob.y, 3 * scale, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.beginPath(); g.arc(knob.x - scale, knob.y - scale, 1 * scale, 0, Math.PI * 2); g.fill();
  if (glow > 0) fillQuad(quad(0.03, 0, 0.97, DOOR_H), `rgba(255,236,150,${(0.28 * glow).toFixed(2)})`);
  // sign above
  fillQuad(quad(-0.12, DOOR_H + 11, 1.12, DOOR_H + 27), "#16255c");
  const c = P(0.5, DOOR_H + 19);
  g.save();
  g.font = `bold ${Math.round(9 * Math.max(1, scale))}px Verdana, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = glow > 0 ? "#fff6b0" : "#d6e0ff";
  g.fillText(label, c.x, c.y);
  g.restore();
  const pts = [P(-0.12, 0), P(1.12, 0), P(1.12, DOOR_H + 27), P(-0.12, DOOR_H + 27)];
  return { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), y1: Math.max(...pts.map((p) => p.y)) };
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
  drawDoor(g, def.doorX, toScreen, scale, "EXIT", 0);
  void ensureFurniSprites(def);
  [...def.furni].filter((f) => !FURNI_KINDS[f.kind].nitro)
    .sort((a, b) => a.x + FURNI_KINDS[a.kind].w + a.y + FURNI_KINDS[a.kind].h - (b.x + FURNI_KINDS[b.kind].w + b.y + FURNI_KINDS[b.kind].h))
    .forEach((f) => drawFurniBase(g, f.kind, f.x, f.y, toScreen, scale));
  return out;
}
