// Isometric room drawing shared by the live room (ui/room.ts) and the first-run room picker previews.
import { assetUrl } from "./assetUrl";
import { footprint, FURNI_KINDS, PlacedFurni, RoomDef, RoomTheme } from "./rooms";
import { derive, loadNitro, nitroIfReady, AnimState, NitroFurni, spritesFor } from "./nitro";
import { GRASS_BEDS, STREETS_DAY } from "./shared/streets";

export const TILE_W = 64;
export const TILE_H = 32;
export const WALL_H = 120;

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

// ---- the basement's painted surfaces (one big picture per surface, made in Blender) ----------------------------
// floor.jpg: left-to-right along game x, top-to-bottom along game y (top-left = the back corner), 128 px per tile.
// wall_right.jpg / wall_left.jpg: 128 px per tile across and the wall's full height down; the left picture starts at the left-hand corner.
const basementArt: { floor?: HTMLImageElement; wallRight?: HTMLImageElement; wallLeft?: HTMLImageElement } = {};
let basementLoad: Promise<void> | null = null;
/** Loads the basement's painted floor and walls. Until they have loaded (or if they fail) the basement falls back to the generated concrete. */
export function ensureBasementArt(): Promise<void> {
  basementLoad ??= Promise.all([
    ...(["floor", "wallRight", "wallLeft"] as const).map((k) => new Promise<void>((done) => {
      const img = new Image();
      img.onload = () => { basementArt[k] = img; done(); };
      img.onerror = () => done();
      img.src = assetUrl(`textures/basement/${k === "floor" ? "floor" : k === "wallRight" ? "wall_right" : "wall_left"}.jpg`);
    })),
    // the street's buildings (rendered in Blender, 128 px per tile like the basement's walls)
    ...(["wallRight", "wallLeft"] as const).map((k) => new Promise<void>((done) => {
      const img = new Image();
      img.onload = () => { streetArt[k] = img; done(); };
      img.onerror = () => done();
      img.src = assetUrl(`textures/streets/${k === "wallRight" ? "wall_right" : "wall_left"}.jpg`);
    })),
  ]).then(() => undefined);
  return basementLoad;
}
const streetArt: { wallRight?: HTMLImageElement; wallLeft?: HTMLImageElement } = {};
const basementReady = () => !!(basementArt.floor && basementArt.wallRight && basementArt.wallLeft);

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
  if (def.theme.style === "street") return STREETS_DAY ? renderStreetDay(def) : renderStreetShell(def);
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
  const painted = t.style === "grime" && basementReady();
  // with the painted basement the base under the pictures is black, so the antialiased edge between wall and floor is dark, not grey
  poly(rightWall, painted ? "#000" : shade(t.wall, 1), painted ? "#000" : shade(t.wall, 0.8));
  poly(leftWall, painted ? "#000" : shade(t.wall, 0.88), painted ? "#000" : shade(t.wall, 0.8));
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
  if (painted) {
    // the painted walls: each picture is laid onto its wall (128 px per tile along it, the full wall height down)
    const wr = basementArt.wallRight!, wl = basementArt.wallLeft!;
    x.save();
    path(rightWall); x.clip();
    x.transform(TILE_W / 2 / (wr.width / W), TILE_H / 2 / (wr.width / W), 0, WALL_H / wr.height, o.x, o.y - WALL_H);
    x.drawImage(wr, 0, 0);
    x.restore();
    x.save();
    path(leftWall); x.clip();
    if (def.id.startsWith("h_")) { // a hideout has no graffiti: its left wall is the right wall's picture, mirrored about the corner
      x.transform(-TILE_W / 2 / (wr.width / H), TILE_H / 2 / (wr.width / H), 0, WALL_H / wr.height, o.x, o.y - WALL_H);
      x.drawImage(wr, 0, 0);
    } else {
      x.transform(TILE_W / 2 / (wl.width / H), -TILE_H / 2 / (wl.width / H), 0, WALL_H / wl.height, bl.x, bl.y - WALL_H);
      x.drawImage(wl, 0, 0);
    }
    x.restore();
  } else {
    // baseboards
    poly([o, br, { x: br.x, y: br.y - 10 }, { x: o.x, y: o.y - 10 }], shade(t.wall, 0.72));
    poly([o, bl, { x: bl.x, y: bl.y - 10 }, { x: o.x, y: o.y - 10 }], shade(t.wall, 0.64));
    if (t.style === "grime") {
      paintGrime(x, rightWall, "wall", 11);
      paintGrime(x, leftWall, "wall", 23);
    }
  }
  // floor edge thickness
  const bot = iso(W, H);
  poly([bl, bot, { x: bot.x, y: bot.y + 8 }, { x: bl.x, y: bl.y + 8 }], shade(t.floorA, 0.6));
  poly([br, bot, { x: bot.x, y: bot.y + 8 }, { x: br.x, y: br.y + 8 }], shade(t.floorA, 0.45));
  // tiles
  const floorTex = texture("floor", t.floorTex);
  const floorPat = floorTex ? patternOf(floorTex) : null;
  if (painted) poly([iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)], "#000"); // black under the painted floor, so its edges stay dark
  for (let ty = 0; ty < H && !painted; ty++) {
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
  if (painted) {
    // the painted floor: its picture runs along game x (right-down) and game y (left-down), starting at the back corner
    const fl = basementArt.floor!;
    x.save();
    path([iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)]); x.clip();
    const px = fl.width / W, py = fl.height / H;
    x.transform(TILE_W / 2 / px, TILE_H / 2 / px, -TILE_W / 2 / py, TILE_H / 2 / py, o.x, o.y);
    x.drawImage(fl, 0, 0);
    x.restore();
  } else if (t.style === "grime") {
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

// ---- the street at night (theme.style "street"): drawn procedurally, nothing to download ----------------------------------------------------------
const hash = (n: number): (() => number) => {
  let a = (n ^ 0x51ed270b) | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};

/** Road rows 3-8, sidewalks 0-2 (against the buildings) and 9-11 (in front). The streets room is always 12 tiles from the back wall to the front. */
function renderStreetShell(def: RoomDef): Shell {
  const W = def.w, H = def.h;
  const minX = -H * (TILE_W / 2) - 8, maxX = W * (TILE_W / 2) + 8;
  const minY = -WALL_H - 8, maxY = (W + H) * (TILE_H / 2) + 20;
  const c = document.createElement("canvas");
  c.width = maxX - minX; c.height = maxY - minY;
  const x = c.getContext("2d")!;
  x.translate(-minX, -minY);
  const o = iso(0, 0), bl = iso(0, H), br = iso(W, 0), bot = iso(W, H);
  const path = (pts: Pt[]) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y))); x.closePath(); };
  const poly = (pts: Pt[], fill: string, stroke?: string) => { path(pts); x.fillStyle = fill; x.fill(); if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1; x.stroke(); } };
  const quad = (tx: number, ty: number, w = 1, h = 1): Pt[] => [iso(tx, ty), iso(tx + w, ty), iso(tx + w, ty + h), iso(tx, ty + h)];
  const rightWall = [o, br, { x: br.x, y: br.y - WALL_H }, { x: o.x, y: o.y - WALL_H }];
  const leftWall = [o, bl, { x: bl.x, y: bl.y - WALL_H }, { x: o.x, y: o.y - WALL_H }];

  // ---- the walls: brick buildings (drawn in "wall space": u along the wall, v up it) ----
  const facade = (side: 1 | -1, tiles: number, seed: number): void => {
    const r = hash(seed);
    x.save();
    path(side === 1 ? rightWall : leftWall); x.clip();
    x.transform(side, 0.5, 0, -1, o.x, o.y); // (u, v) -> screen: u runs along the wall, v goes up
    const L = tiles * (TILE_W / 2);
    x.fillStyle = "#2a2124"; x.fillRect(0, 0, L, WALL_H);
    // bricks
    for (let v = 0, row = 0; v < WALL_H; v += 6, row++) {
      for (let u = -(row % 2) * 9; u < L; u += 18) {
        const t = r();
        x.fillStyle = `rgb(${Math.round(52 + t * 26)},${Math.round(34 + t * 14)},${Math.round(34 + t * 12)})`;
        x.fillRect(u + 0.5, v + 0.5, 17, 5);
      }
    }
    // a lit shop-front band at the bottom, roller shutters and a few windows above it
    for (let ti = 0; ti < tiles; ti++) {
      const u0 = ti * (TILE_W / 2);
      const kind = hash(seed + ti * 31)();
      if (side === 1 && ti >= 1 && ti <= 3) continue; // (the door back to the arrival room stands here)
      if (kind < 0.18 && side === 1) { // a roller shutter
        x.fillStyle = "#3a3d42"; x.fillRect(u0 + 3, 0, 26, 62);
        x.strokeStyle = "rgba(0,0,0,.45)"; x.lineWidth = 1;
        for (let v = 4; v < 62; v += 5) { x.beginPath(); x.moveTo(u0 + 3, v); x.lineTo(u0 + 29, v); x.stroke(); }
        x.fillStyle = "rgba(255,255,255,.07)"; x.fillRect(u0 + 3, 0, 26, 3);
      }
      if (ti % 2 === 0 || side === -1) { // a window
        const lit = hash(seed + ti * 17)() < 0.4;
        const wx = u0 + 6, wy = side === 1 ? 74 : 62, ww = 20, wh = 28;
        x.fillStyle = "#15121a"; x.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
        const gl = x.createLinearGradient(0, wy, 0, wy + wh);
        if (lit) { gl.addColorStop(0, "#ffd27a"); gl.addColorStop(1, "#c9722a"); } else { gl.addColorStop(0, "#1c2740"); gl.addColorStop(1, "#0b0f1c"); }
        x.fillStyle = gl; x.fillRect(wx, wy, ww, wh);
        x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(wx + ww / 2 - 1, wy, 2, wh); x.fillRect(wx, wy + wh / 2 - 1, ww, 2);
        if (lit) { x.fillStyle = "rgba(255,190,90,.18)"; x.fillRect(wx - 4, wy - 4, ww + 8, wh + 8); }
      }
    }
    // the roofline and the grime running down
    x.fillStyle = "#3a2e31"; x.fillRect(0, WALL_H - 9, L, 9);
    x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, WALL_H - 11, L, 2);
    for (let i = 0; i < tiles * 3; i++) {
      const gx = r() * L, gh = 20 + r() * 50;
      const g = x.createLinearGradient(0, WALL_H - 10, 0, WALL_H - 10 - gh);
      g.addColorStop(0, "rgba(0,0,0,.45)"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(gx, WALL_H - 10 - gh, 3 + r() * 5, gh);
    }
    const dark = x.createLinearGradient(0, 0, 0, 22);
    dark.addColorStop(0, "rgba(0,0,0,.6)"); dark.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = dark; x.fillRect(0, 0, L, 22);
    x.restore();
  };
  facade(1, W, 11);
  facade(-1, H, 23);
  poly(leftWall, "rgba(0,0,0,0.22)");

  // ---- the floor ----
  poly([bl, bot, { x: bot.x, y: bot.y + 8 }, { x: bl.x, y: bl.y + 8 }], "#15171b");
  poly([br, bot, { x: bot.x, y: bot.y + 8 }, { x: br.x, y: br.y + 8 }], "#0f1013");
  const r = hash(77);
  for (let ty = 0; ty < H; ty++) {
    const road = ty >= 3 && ty <= 8;
    for (let tx = 0; tx < W; tx++) {
      const odd = (tx + ty) % 2;
      const t = r();
      let fill: string;
      if (road) fill = `rgb(${Math.round(28 + t * 8 + odd * 2)},${Math.round(30 + t * 8 + odd * 2)},${Math.round(36 + t * 9 + odd * 2)})`;
      else fill = `rgb(${Math.round(72 + t * 12 + odd * 5)},${Math.round(76 + t * 12 + odd * 5)},${Math.round(86 + t * 12 + odd * 5)})`;
      poly(quad(tx, ty), fill, road ? "rgba(0,0,0,0.10)" : "rgba(10,12,16,0.35)"); // (the sidewalk slabs have joints, the road barely any)
    }
  }
  // the curbs: a lighter lip along the edge of each sidewalk, and the gutter in the road beside it
  x.lineJoin = "round";
  const stroke = (a: Pt, b: Pt, col: string, w: number, dash?: number[]) => { x.save(); x.strokeStyle = col; x.lineWidth = w; if (dash) x.setLineDash(dash); x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); x.restore(); };
  stroke(iso(0, 3), iso(W, 3), "rgba(200,205,215,.55)", 3);
  stroke(iso(0, 9), iso(W, 9), "rgba(200,205,215,.55)", 3);
  stroke(iso(0, 3.12), iso(W, 3.12), "rgba(0,0,0,.5)", 3);
  stroke(iso(0, 8.88), iso(W, 8.88), "rgba(0,0,0,.5)", 3);
  // the lines in the road: a double yellow line down the middle, white edge lines
  stroke(iso(0, 5.92), iso(W, 5.92), "#c9a227", 2); stroke(iso(0, 6.08), iso(W, 6.08), "#c9a227", 2);
  stroke(iso(0, 3.45), iso(W, 3.45), "rgba(235,235,235,.5)", 2, [14, 12]);
  stroke(iso(0, 8.55), iso(W, 8.55), "rgba(235,235,235,.5)", 2, [14, 12]);
  // a zebra crossing
  for (let ty = 3.2; ty < 8.8; ty += 0.55) poly([iso(11.1, ty), iso(12.9, ty), iso(12.9, ty + 0.3), iso(11.1, ty + 0.3)], "rgba(225,225,225,.62)");
  // cracks and patches in the asphalt, wet puddles that catch the light
  x.save();
  for (let i = 0; i < 26; i++) {
    const p = iso(1 + r() * (W - 2), 3.3 + r() * 5.4);
    x.strokeStyle = `rgba(0,0,0,${0.35 + r() * 0.3})`; x.lineWidth = 1;
    x.beginPath(); x.moveTo(p.x, p.y);
    let cx = p.x, cy = p.y;
    for (let s = 0; s < 6; s++) { cx += (r() - 0.45) * 12; cy += (r() - 0.5) * 5; x.lineTo(cx, cy); }
    x.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const p = iso(1 + r() * (W - 2), 3.4 + r() * 5.2);
    const rw = 22 + r() * 34;
    const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, rw);
    g.addColorStop(0, "rgba(120,150,210,.35)"); g.addColorStop(0.7, "rgba(60,80,130,.2)"); g.addColorStop(1, "rgba(60,80,130,0)");
    x.fillStyle = g; x.beginPath(); x.ellipse(p.x, p.y, rw, rw / 2, 0, 0, Math.PI * 2); x.fill();
  }
  x.restore();
  // blood and stains on the sidewalk
  for (let i = 0; i < 6; i++) {
    const p = iso(1 + r() * (W - 2), (r() < 0.5 ? 0.5 : 9.5) + r() * 1.8);
    const rw = 8 + r() * 14;
    const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, rw);
    g.addColorStop(0, "rgba(90,12,14,.5)"); g.addColorStop(1, "rgba(90,12,14,0)");
    x.fillStyle = g; x.beginPath(); x.ellipse(p.x, p.y, rw, rw / 2, 0, 0, Math.PI * 2); x.fill();
  }
  // the light of the street lamps: a warm pool on the ground under each one, and a faint glow up on the wall
  x.save();
  path([iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)]); x.clip();
  x.globalCompositeOperation = "lighter";
  for (const f of def.furni) {
    if (f.kind !== "st_lamp" && f.kind !== "st_lamppost") continue;
    const p = iso(f.x + 0.5, f.y + (f.y < 5 ? 1.8 : -0.8));
    const rw = f.kind === "st_lamp" ? 150 : 120;
    const g = x.createRadialGradient(p.x, p.y, 4, p.x, p.y, rw);
    g.addColorStop(0, "rgba(255,196,110,.34)"); g.addColorStop(0.5, "rgba(255,170,80,.14)"); g.addColorStop(1, "rgba(255,160,70,0)");
    x.fillStyle = g; x.beginPath(); x.ellipse(p.x, p.y, rw, rw / 2, 0, 0, Math.PI * 2); x.fill();
  }
  x.restore();
  // night: everything under a cold blue, darker toward the far ends of the street
  x.save();
  path([iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)]); x.clip();
  x.globalCompositeOperation = "multiply";
  const mid = iso(W / 2, H / 2);
  const night = x.createRadialGradient(mid.x, mid.y, 40, mid.x, mid.y, Math.max(W, H) * TILE_W * 0.5);
  night.addColorStop(0, "rgba(150,165,215,1)"); night.addColorStop(1, "rgba(60,70,110,1)");
  x.fillStyle = night; x.fillRect(minX, minY, maxX - minX, maxY - minY);
  x.restore();
  x.save();
  x.globalCompositeOperation = "multiply";
  path(rightWall); x.fillStyle = "rgba(95,105,150,1)"; x.fill();
  path(leftWall); x.fillStyle = "rgba(75,85,125,1)"; x.fill();
  x.restore();
  return { canvas: c, origin: { x: -minX, y: -minY } };
}


// ---- the street by day (the default: STREETS_DAY): painted buildings with shop fronts and awnings, grey paving with red curb blocks, dark asphalt with white dashes and a double yellow line, grass ----
const BAYS: Array<{ wall: string; trim: string; brick: boolean }> = [
  { wall: "#e9d7b4", trim: "#fff6e2", brick: false }, { wall: "#c4694c", trim: "#f2e4d0", brick: true }, { wall: "#e6bd55", trim: "#fff3cc", brick: false },
  { wall: "#8db7d8", trim: "#f2f8fc", brick: false }, { wall: "#a3c99c", trim: "#f4fbef", brick: false }, { wall: "#d98f8f", trim: "#fff0ef", brick: false }, { wall: "#b0825c", trim: "#efe0cc", brick: true },
];
const SHOPS: Array<[string, string, string]> = [["BAKERY", "#c0392b", "#f4ede0"], ["CAFE", "#2c6e49", "#f4ede0"], ["PIZZA", "#c0392b", "#fff6d8"], ["BOOKS", "#2b4f8a", "#f4ede0"], ["DELI", "#8a5a1e", "#f4ede0"], ["FLOWERS", "#b03a7a", "#f8e8f2"], ["HAIR", "#2f2f3a", "#f0e6c8"], ["KIOSK", "#d4731a", "#fff1d8"]];

function renderStreetDay(def: RoomDef): Shell {
  const W = def.w, H = def.h;
  const minX = -H * (TILE_W / 2) - 8, maxX = W * (TILE_W / 2) + 8;
  const minY = -WALL_H - 8, maxY = (W + H) * (TILE_H / 2) + 20;
  const c = document.createElement("canvas");
  c.width = maxX - minX; c.height = maxY - minY;
  const x = c.getContext("2d")!;
  x.translate(-minX, -minY);
  const o = iso(0, 0), bl = iso(0, H), br = iso(W, 0), bot = iso(W, H);
  const path = (pts: Pt[]) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y))); x.closePath(); };
  const poly = (pts: Pt[], fill: string, stroke?: string) => { path(pts); x.fillStyle = fill; x.fill(); if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1; x.stroke(); } };
  const quad = (tx: number, ty: number, w = 1, h = 1): Pt[] => [iso(tx, ty), iso(tx + w, ty), iso(tx + w, ty + h), iso(tx, ty + h)];
  const rightWall = [o, br, { x: br.x, y: br.y - WALL_H }, { x: o.x, y: o.y - WALL_H }];
  const leftWall = [o, bl, { x: bl.x, y: bl.y - WALL_H }, { x: o.x, y: o.y - WALL_H }];
  const HALF = TILE_W / 2;

  // ---- the walls: a row of painted buildings (drawn in "wall space": u along the wall, v up it) ----
  const facade = (side: 1 | -1, tiles: number, seed: number): void => {
    const r = hash(seed);
    x.save();
    path(side === 1 ? rightWall : leftWall); x.clip();
    x.transform(side, 0.5, 0, -1, o.x, o.y);
    const L = tiles * HALF;
    let u = 0, bi = Math.floor(r() * BAYS.length), si = Math.floor(r() * SHOPS.length);
    while (u < L) {
      const w = Math.min(L - u, HALF * (4 + Math.floor(r() * 3)));
      const bay = BAYS[bi++ % BAYS.length];
      const shop = SHOPS[si++ % SHOPS.length];
      const keep = side === 1 && u < HALF * 4 && u + w > HALF; // (the door back to the arrival room stands in tiles 1 to 3: no shop front there)
      x.fillStyle = bay.wall; x.fillRect(u, 0, w, WALL_H);
      if (bay.brick) {
        for (let v = 0, row = 0; v < WALL_H; v += 6, row++) for (let bu = u - (row % 2) * 8; bu < u + w; bu += 16) {
          const t = r(); x.fillStyle = `rgba(${t < 0.5 ? "0,0,0" : "255,255,255"},${(0.04 + t * 0.07).toFixed(3)})`; x.fillRect(Math.max(u, bu) + 0.5, v + 0.5, 15, 5);
        }
      } else {
        for (let i = 0; i < w * 1.4; i++) { x.fillStyle = r() < 0.5 ? "rgba(0,0,0,.035)" : "rgba(255,255,255,.07)"; x.fillRect(u + r() * w, r() * WALL_H, 2, 2); }
      }
      x.fillStyle = bay.trim; x.fillRect(u, 0, 3, WALL_H); x.fillRect(u + w - 3, 0, 3, WALL_H);
      x.fillStyle = bay.trim; x.fillRect(u, WALL_H - 12, w, 12);
      x.fillStyle = "rgba(0,0,0,.16)"; x.fillRect(u, WALL_H - 13, w, 2);
      x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(u, WALL_H - 3, w, 2);
      // upper windows
      for (let wu = u + 9; wu + 20 <= u + w - 6; wu += 24) {
        const wy = 70, ww = 18, wh = 30;
        x.fillStyle = bay.trim; x.fillRect(wu - 2, wy - 2, ww + 4, wh + 4);
        const gl = x.createLinearGradient(0, wy, 0, wy + wh);
        gl.addColorStop(0, "#7fb9ea"); gl.addColorStop(1, "#d6ecfb");
        x.fillStyle = gl; x.fillRect(wu, wy, ww, wh);
        x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.moveTo(wu, wy + wh); x.lineTo(wu + 9, wy); x.lineTo(wu + 14, wy); x.lineTo(wu + 5, wy + wh); x.closePath(); x.fill();
        x.fillStyle = bay.trim; x.fillRect(wu + ww / 2 - 1, wy, 2, wh); x.fillRect(wu, wy + wh / 2 - 1, ww, 2);
        if (r() < 0.55) {
          x.fillStyle = ["rgba(230,120,120,.8)", "rgba(250,240,200,.85)", "rgba(120,170,230,.8)"][Math.floor(r() * 3)];
          x.fillRect(wu, wy, 5, wh * 0.7); x.fillRect(wu + ww - 5, wy, 5, wh * 0.7);
        }
        x.fillStyle = "rgba(0,0,0,.22)"; x.fillRect(wu - 2, wy + wh + 2, ww + 4, 2);
        if (r() < 0.45) { // a flower box
          x.fillStyle = "#7a4a28"; x.fillRect(wu - 2, wy + wh + 2, ww + 4, 5);
          for (let f = 0; f < 6; f++) { x.fillStyle = ["#e84a5f", "#f7d046", "#fff", "#ff8fb3"][Math.floor(r() * 4)]; x.fillRect(wu - 1 + f * 3.4, wy + wh - 1 + r() * 2, 3, 3); }
          x.fillStyle = "#3d8f3a"; x.fillRect(wu - 2, wy + wh + 1, ww + 4, 2);
        }
      }
      if (!keep && w >= HALF * 4) { // the shop: a window, the door, a window, an awning and a sign
        const a = u + 8, b = u + w - 8;
        const winW = (b - a - 26) / 2;
        const glass = (gx: number, gw: number): void => {
          x.fillStyle = "#4b3a2c"; x.fillRect(gx - 2, 6, gw + 4, 40);
          const g = x.createLinearGradient(0, 6, 0, 46); g.addColorStop(0, "#9fd0f2"); g.addColorStop(1, "#f6e8c4");
          x.fillStyle = g; x.fillRect(gx, 8, gw, 36);
          x.fillStyle = "rgba(255,255,255,.4)"; x.beginPath(); x.moveTo(gx + 3, 8); x.lineTo(gx + 14, 8); x.lineTo(gx + 9, 44); x.lineTo(gx + 1, 44); x.closePath(); x.fill();
          for (let k = 0; k < 4; k++) { x.fillStyle = ["#e8a33d", "#d9534f", "#fff", "#7ec0ee"][Math.floor(r() * 4)]; x.fillRect(gx + 4 + k * ((gw - 10) / 4), 10 + r() * 4, 7, 7); }
          x.fillStyle = "rgba(60,40,20,.5)"; x.fillRect(gx, 30, gw, 2);
        };
        glass(a, winW);
        glass(b - winW, winW);
        const dx = a + winW + 6; // the door
        x.fillStyle = "#3a2c24"; x.fillRect(dx - 1, 0, 14, 48);
        x.fillStyle = shop[1]; x.fillRect(dx, 0, 12, 46);
        const dg = x.createLinearGradient(0, 8, 0, 40); dg.addColorStop(0, "#bfe0f7"); dg.addColorStop(1, "#7fb2d9");
        x.fillStyle = dg; x.fillRect(dx + 2, 8, 8, 28);
        x.fillStyle = "#f4d03f"; x.fillRect(dx + 9, 22, 2, 2);
        // the awning: stripes with a scalloped edge, and the shadow it throws
        const ax0 = a - 4, ax1 = b + 4;
        for (let au = ax0, k = 0; au < ax1; au += 7, k++) {
          x.fillStyle = k % 2 ? shop[2] : shop[1]; x.fillRect(au, 46, Math.min(7, ax1 - au), 12);
          x.beginPath(); x.arc(au + 3.5, 46, 3.5, 0, Math.PI); x.fill();
        }
        x.fillStyle = "rgba(255,255,255,.28)"; x.fillRect(ax0, 54, ax1 - ax0, 4);
        x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(ax0, 40, ax1 - ax0, 3);
        x.fillStyle = "#2a2018"; x.fillRect(ax0 + 2, 60, ax1 - ax0 - 4, 9);
        // the sign (the wall is drawn mirrored on the left side, so the writing is flipped back there)
        x.save();
        x.translate((ax0 + ax1) / 2, 64.6);
        if (side === -1) x.scale(-1, 1);
        x.fillStyle = "#f8f1de"; x.font = "bold 7px Verdana, sans-serif"; x.textBaseline = "middle"; x.textAlign = "center";
        x.scale(1, -1); x.scale(1, -1);
        x.fillText(shop[0], 0, 0);
        x.restore();
      } else if (!keep) { // a narrow building: a door and one window
        x.fillStyle = bay.trim; x.fillRect(u + 6, 0, 16, 48);
        x.fillStyle = "#5b3b27"; x.fillRect(u + 8, 0, 12, 44);
        x.fillStyle = "#e0b83c"; x.fillRect(u + 17, 22, 2, 2);
        x.fillStyle = bay.trim; x.fillRect(u + 6, 44, 16, 3);
      } else {
        x.fillStyle = "rgba(0,0,0,.10)"; x.fillRect(u + HALF - 4, 0, HALF * 2 + 8, 56);
      }
      x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(u, 0, w, 4); // the plinth along the foot of the building
      u += w;
    }
    const sh = x.createLinearGradient(0, 0, 0, 30);
    sh.addColorStop(0, "rgba(40,50,80,.20)"); sh.addColorStop(1, "rgba(40,50,80,0)");
    x.fillStyle = sh; x.fillRect(0, 0, L, 30);
    x.restore();
  };
  const wr = streetArt.wallRight, wl = streetArt.wallLeft;
  if (wr && wl) { // the buildings rendered in Blender: each picture is laid onto its wall (the same way as the basement's)
    x.save(); path(rightWall); x.clip();
    x.transform(TILE_W / 2 / (wr.width / W), TILE_H / 2 / (wr.width / W), 0, WALL_H / wr.height, o.x, o.y - WALL_H);
    x.drawImage(wr, 0, 0); x.restore();
    x.save(); path(leftWall); x.clip();
    x.transform(TILE_W / 2 / (wl.width / H), -TILE_H / 2 / (wl.width / H), 0, WALL_H / wl.height, bl.x, bl.y - WALL_H);
    x.drawImage(wl, 0, 0); x.restore();
    poly(leftWall, "rgba(20,30,70,0.18)"); // (the left wall faces away from the sun)
  } else { // (until the pictures have loaded: painted buildings)
    facade(1, W, 11);
    facade(-1, H, 23);
    poly(leftWall, "rgba(30,40,80,0.16)");
  }

  // ---- the floor ----
  poly([bl, bot, { x: bot.x, y: bot.y + 8 }, { x: bl.x, y: bl.y + 8 }], "#4d6a2f");
  poly([br, bot, { x: bot.x, y: bot.y + 8 }, { x: br.x, y: br.y + 8 }], "#3d5626");
  const r = hash(77);
  const speckle = (pts: Pt[], n: number, cols: string[]): void => { // pixel noise inside a quad (an isometric tile's bounding box, clipped)
    x.save(); path(pts); x.clip();
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
    for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(Math.floor(bx + r() * bw), Math.floor(by + r() * bh), 1, 1); }
    x.restore();
  };
  for (let ty = 0; ty < H; ty++) {
    const road = ty >= 3 && ty <= 8;
    for (let tx = 0; tx < W; tx++) {
      const odd = (tx + ty) % 2;
      const t = r();
      const q = quad(tx, ty);
      if (road) {
        poly(q, `rgb(${Math.round(40 + t * 6 + odd * 2)},${Math.round(52 + t * 6 + odd * 2)},${Math.round(52 + t * 6 + odd * 2)})`);
        speckle(q, 46, ["rgba(255,255,255,.07)", "rgba(0,0,0,.18)", "rgba(120,140,130,.10)"]);
      } else { // grey paving slabs with a darker seam
        poly(q, `rgb(${Math.round(150 + t * 10 + odd * 8)},${Math.round(150 + t * 10 + odd * 8)},${Math.round(150 + t * 10 + odd * 8)})`, "rgba(70,70,76,0.55)");
        speckle(q, 22, ["rgba(255,255,255,.18)", "rgba(0,0,0,.14)"]);
      }
    }
  }
  // grass (a strip along the front of the street, tree pits on the back sidewalk) with pixel texture and a few flowers
  const grass = (tx: number, ty: number, w: number, h: number): void => {
    const q = quad(tx, ty, w, h);
    poly(q, "#5f8a34");
    speckle(q, Math.round(w * h * 150), ["#79a844", "#4c7a2a", "#6e9c3a", "#89b84e", "#44702a"]);
    for (let i = 0; i < w * h * 2; i++) {
      const p = iso(tx + 0.1 + r() * (w - 0.2), ty + 0.1 + r() * (h - 0.2));
      x.fillStyle = ["#fff", "#f7d046", "#ff7aa8", "#ff9f43"][Math.floor(r() * 4)]; x.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }
  };
  for (const [gx, gy, gw, gh] of GRASS_BEDS) grass(gx, gy, gw, gh);
  x.lineJoin = "round";
  const stroke = (a: Pt, b: Pt, col: string, w: number, dash?: number[]) => { x.save(); x.strokeStyle = col; x.lineWidth = w; if (dash) x.setLineDash(dash); x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); x.restore(); };
  // the curb: a row of dark red blocks along each sidewalk edge, with a lit top
  const curb = (ty: number, inward: number): void => {
    stroke(iso(0, ty + inward * 0.08), iso(W, ty + inward * 0.08), "#4a2a2c", 7);
    stroke(iso(0, ty), iso(W, ty), "#7a4a4c", 4);
    stroke(iso(0, ty - inward * 0.02), iso(W, ty - inward * 0.02), "#9a6466", 1);
    for (let tx = 1; tx < W; tx++) stroke(iso(tx, ty - 0.1), iso(tx, ty + inward * 0.12), "rgba(30,15,15,.7)", 1);
  };
  curb(3, -1); curb(9, 1);
  // the road markings: a double yellow line down the middle, white dashes in each lane, a zebra crossing
  stroke(iso(0, 5.9), iso(W, 5.9), "#d8b52a", 2); stroke(iso(0, 6.1), iso(W, 6.1), "#d8b52a", 2);
  stroke(iso(0, 4.5), iso(W, 4.5), "rgba(245,245,240,.9)", 2, [14, 12]);
  stroke(iso(0, 7.5), iso(W, 7.5), "rgba(245,245,240,.9)", 2, [14, 12]);
  for (let ty = 3.2; ty < 8.8; ty += 0.5) poly([iso(11.1, ty), iso(12.9, ty), iso(12.9, ty + 0.28), iso(11.1, ty + 0.28)], "rgba(250,250,245,.93)");
  // drains at the curb, and weeds in the seams
  for (const dxx of [4.5, 15.5, 21.5]) for (const dy of [3.18, 8.82]) { const p = iso(dxx, dy); x.fillStyle = "rgba(20,24,24,.85)"; x.beginPath(); x.ellipse(p.x, p.y, 7, 3, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = "rgba(160,160,165,.5)"; x.stroke(); }
  for (let i = 0; i < 40; i++) { const p = iso(r() * W, (r() < 0.5 ? r() * 3 : 9 + r() * 2)); x.fillStyle = "#6f9a3a"; x.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 3); }
  // the shade the buildings throw on the back sidewalk
  x.save();
  path(quad(0, 0, W, 3)); x.clip();
  const sd = x.createLinearGradient(iso(0, 0).x, iso(0, 0).y, iso(0, 3).x, iso(0, 3).y);
  sd.addColorStop(0, "rgba(40,50,90,.28)"); sd.addColorStop(1, "rgba(40,50,90,0)");
  x.fillStyle = sd; x.fillRect(minX, minY, maxX - minX, maxY - minY);
  x.restore();
  // a touch of afternoon sun
  x.save();
  path([iso(0, 0), iso(W, 0), iso(W, H), iso(0, H)]); x.clip();
  x.globalCompositeOperation = "soft-light";
  const mid = iso(W * 0.65, H * 0.4);
  const sun = x.createRadialGradient(mid.x, mid.y, 20, mid.x, mid.y, Math.max(W, H) * TILE_W * 0.55);
  sun.addColorStop(0, "rgba(255,238,190,.8)"); sun.addColorStop(1, "rgba(255,238,190,0)");
  x.fillStyle = sun; x.fillRect(minX, minY, maxX - minX, maxY - minY);
  x.restore();
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
  for (const f of def.furni) { // (the art of upgrades: the green mixer, the sprinkler on a pot)
    if (f.up && f.kind === "f_mixer") paths.add((f.up === 2 ? FURNI_KINDS.f_mixer_up2 : FURNI_KINDS.f_mixer_up).nitro!);
    if (f.auto) paths.add(FURNI_KINDS.sprinkler.nitro!);
  }
  return Promise.all([...paths].map((p) => loadNitro(p))).then(() => undefined);
}

/** Draws sprite art standing on the floor footprint (w x h tiles) at (tx, ty). The art's anchor is the centre of the base tile (tx, ty). */
export function drawNitroSprites(g: CanvasRenderingContext2D, n: NitroFurni, w: number, h: number, tx: number, ty: number, dir: number, nudge: { x: number; y: number } | undefined, toScreen: (p: Pt) => Pt, scale: number, alpha = 1, skipShadow = false, anim?: AnimState, part?: "back" | "front"): Box | null {
  const o = toScreen(iso(tx + 0.5, ty + 0.5)); // the art is anchored to the middle of the piece's base tile (its lowest x,y)
  void w; void h;
  const ox = o.x + (nudge?.x ?? 0) * scale;
  const oy = o.y + (nudge?.y ?? 0) * scale;
  const prevSmoothing = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  let box: Box | null = null;
  for (const s of spritesFor(n, dir, anim)) {
    if (skipShadow && s.isShadow) continue; // a second pass over the same piece (glow, highlight) must not stack another shadow on the floor
    const sw = s.sw * scale;
    const sh = s.sh * scale;
    const left = ox + s.dx * scale;
    const top = oy + s.dy * scale;
    if (!s.isShadow && s.sw > 2 && s.sh > 2) {
      box = box ? { x0: Math.min(box.x0, left), y0: Math.min(box.y0, top), x1: Math.max(box.x1, left + sw), y1: Math.max(box.y1, top + sh) } : { x0: left, y0: top, x1: left + sw, y1: top + sh };
    }
    // a piece with a layer in front of the people who use it (the backrest of a chair somebody sits on with their back to us): the room draws the back and the front layers at different moments
    if (part === "back" && s.z > 0 && !s.isShadow) continue;
    if (part === "front" && (s.z <= 0 || s.isShadow)) continue;
    g.save();
    g.globalAlpha = alpha * (s.isShadow ? 0.22 : 1) * (s.alpha ?? 1); // the shadow art is solid black; the game draws it faint
    if (s.ink === "ADD") g.globalCompositeOperation = "lighter"; // glows add their light to what is behind them
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
export function drawNitroFurni(g: CanvasRenderingContext2D, kindId: string, tx: number, ty: number, dir: number, toScreen: (p: Pt) => Pt, scale: number, alpha = 1, skipShadow = false, anim?: AnimState, part?: "back" | "front"): Box | null {
  const k = FURNI_KINDS[kindId];
  const n = k?.nitro ? nitroIfReady(k.nitro) : undefined;
  if (!n) return null;
  const fp = footprint(kindId, dir);
  // a wall item hangs on the wall plane, not on the floor tile: the back wall is the line y = 0, the left wall x = 0
  let artDir = dir;
  if (k.wall) { if (dir === 2) { tx -= 0.5; if (k.wallArt) artDir = k.wallArt.left; } else { ty -= 0.5; if (k.wallArt) artDir = k.wallArt.back; } }
  return drawNitroSprites(g, n, fp.w, fp.h, tx, ty, artDir, k.nudge, toScreen, scale, alpha, skipShadow, anim, part);
}

// ---- the door -------------------------------------------------------------------------------------------
export interface Box { x0: number; y0: number; x1: number; y1: number }

// ---- the real door: Habbo's teleport door (.nitro), carpet erased, plain colour or fully greyscale -------------------
const DOOR_PATH = "furni/teleport_door.nitro";
/** the way the door faces: dir 4 looks into the room from the back-right wall */
const DOOR_DIR = 4;
let doorColour: NitroFurni | null = null;
let doorGrey: NitroFurni | null = null;
let doorYellow: NitroFurni | null = null;
let doorBrown: NitroFurni | null = null;

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
    // the shop's door: the same door, painted a warm yellow
    // the mines' door: rusty brown
    doorBrown = derive(clean, (g, w, h) => {
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const l = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
        const k = 0.35 + 0.7 * (l / 255);
        d[i] = Math.min(255, Math.round(150 * k)); d[i + 1] = Math.min(255, Math.round(92 * k)); d[i + 2] = Math.min(255, Math.round(48 * k));
      }
      g.putImageData(img, 0, 0);
    });
    doorYellow = derive(clean, (g, w, h) => {
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const l = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
        const k = 0.5 + 0.62 * (l / 255); // the panel shading stays, the colour is a sunny yellow
        d[i] = Math.min(255, Math.round(255 * k)); d[i + 1] = Math.min(255, Math.round(200 * k)); d[i + 2] = Math.min(255, Math.round(35 * k));
      }
      g.putImageData(img, 0, 0);
    });
  });
}

/** Draws the room's door on the back-right wall and returns its click box. Nothing is drawn until the door art has loaded (main.ts waits for it before the first room). */
export function drawRoomDoor(g: CanvasRenderingContext2D, doorX: number, toScreen: (p: Pt) => Pt, scale: number, glow: number, look: boolean | "yellow" | "brown"): Box {
  const art = look === "yellow" ? doorYellow : look === "brown" ? doorBrown : look ? doorGrey : doorColour;
  const none: Box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  if (!art) return none;
  const box = drawNitroSprites(g, art, 1, 1, doorX, 0, DOOR_DIR, undefined, toScreen, scale);
  if (glow > 0) {
    g.save();
    g.globalCompositeOperation = "lighter";
    drawNitroSprites(g, art, 1, 1, doorX, 0, DOOR_DIR, undefined, toScreen, scale, 0.3 * glow);
    g.restore();
  }
  return box ?? none;
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
  // the pieces drawn from .nitro art (once their sprites are loaded: ensureFurniSprites)
  const depthOf = (f: PlacedFurni) => f.x + FURNI_KINDS[f.kind].w + f.y + FURNI_KINDS[f.kind].h;
  [...def.furni].filter((f) => FURNI_KINDS[f.kind].nitro).sort((a, b) => depthOf(a) - depthOf(b))
    .forEach((f) => drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale));
  return out;
}
