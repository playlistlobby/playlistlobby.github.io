// Dev tool (export.html): renders the game's own art as transparent PNGs for the ad and saves them through scripts/export-server.mjs.
// Furniture sprites (pots, weed, shrooms, mixers, ...), the item icons, the avatars (6ixty, Emil, bootyshaker) and a frame-by-frame animation of Emil stabbing bootyshaker.
import { avatarsReady, clearAvatarCache, renderAvatar } from "./avatarService";
import { loadBundledDesigns, loadShopDesigns, loadStarterDesigns } from "./designs";
import { derive, loadNitro, spritesFor, type NitroFurni } from "./nitro";
import { FURNI_KINDS, defFromMeta, lobbyDef, type RoomMeta, type RoomDef } from "./rooms";
import { shade, TILE_W, TILE_H, WALL_H, iso, renderRoomShell, ensureFurniSprites, ensureBasementArt, drawNitroFurni } from "./roomRender";
import { SPIN_DIRS } from "./emotes";
import { loadEmojiFont } from "./emojiFont";
import { ITEMS } from "./items";

const log = document.getElementById("log")!;
const say = (m: string): void => { log.textContent += "\n" + m; };
const SAVE = "http://127.0.0.1:8799/save?path=";

const FIGURES = {
  emil: "hd-190-10.hr-97012-42.ha-98080-64.ch-98046-64.cc-98016-9004.ca-97020-1408.lg-98120-64.sh-98142-1408.wa-98147-1408",
  bootyshaker: "hd-206-10.hr-98113-40.ha-98083-64.ea-98055-1408.fa-98057.ch-3688-9002.cc-98020-1408.ca-98007-64.lg-98122-1408.sh-98133-64.wa-98149-1408",
  "6ixty": "hd-190-10.hr-98112-31.fa-97010.ch-255-91.cc-98016-9002.ca-97021-9001.lg-98120-9002.sh-98132-64.wa-98147-1408",
};

async function save(rel: string, c: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
  const r = await fetch(SAVE + encodeURIComponent(rel).replace(/%2F/g, "/"), { method: "POST", body: blob });
  if (!r.ok) throw new Error("save failed: " + rel);
}

/** the same picture, nearest-neighbour scaled up (the game's art is small pixel art) and trimmed of empty space */
function scaled(src: CanvasImageSource & { width: number; height: number }, k: number, trim = true): HTMLCanvasElement {
  const w = src.width * k, h = src.height * k;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, w, h);
  return trim ? trimmed(c) : c;
}
function trimmed(c: HTMLCanvasElement, pad = 4): HTMLCanvasElement {
  const g = c.getContext("2d")!;
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return c;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1 + pad * 2; out.height = y1 - y0 + 1 + pad * 2;
  out.getContext("2d")!.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
  return out;
}

interface Layer { n: NitroFurni; dir: number; nudge?: { x: number; y: number }; /** show only the bottom part (a plant that is still growing) */ grow?: number }
/** Draws furniture layers (no floor shadow) around their common anchor, at art scale k. */
function composite(layers: Layer[], k: number, trim = true): HTMLCanvasElement {
  const items = layers.flatMap((l) => spritesFor(l.n, l.dir).filter((s) => !s.isShadow && s.sw > 2 && s.sh > 2).map((s) => ({ l, s, x: s.dx + (l.nudge?.x ?? 0), y: s.dy + (l.nudge?.y ?? 0) })));
  const x0 = Math.min(...items.map((i) => i.x)), y0 = Math.min(...items.map((i) => i.y));
  const x1 = Math.max(...items.map((i) => i.x + i.s.sw)), y1 = Math.max(...items.map((i) => i.y + i.s.sh));
  const c = document.createElement("canvas");
  c.width = Math.ceil((x1 - x0) * k); c.height = Math.ceil((y1 - y0) * k);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  for (const it of items) {
    g.save();
    if (it.l.grow !== undefined) { // a seedling shows at once, the full plant when it is grown: reveal from the bottom up
      const top = it.y, h = it.s.sh;
      const shown = it.l.grow;
      g.beginPath();
      g.rect((it.x - x0) * k - 2, (top - y0 + h * (1 - shown)) * k, it.s.sw * k + 4, h * shown * k + 2);
      g.clip();
    }
    const px = (it.x - x0) * k, py = (it.y - y0) * k;
    if (it.s.flipH) { g.translate(px + it.s.sw * k, py); g.scale(-1, 1); g.drawImage(it.s.image, it.s.sx, it.s.sy, it.s.sw, it.s.sh, 0, 0, it.s.sw * k, it.s.sh * k); }
    else g.drawImage(it.s.image, it.s.sx, it.s.sy, it.s.sw, it.s.sh, px, py, it.s.sw * k, it.s.sh * k);
    g.restore();
  }
  return trim ? trimmed(c) : c; // (animations keep the same size on every frame: no trimming)
}

const needNitro = async (path: string): Promise<NitroFurni> => { const n = await loadNitro(path); if (!n) throw new Error("missing " + path); return n; };

async function furniture(): Promise<void> {
  const K = 4;
  const plain: Array<[string, string, number?]> = [
    ["mixer", "furni/f_mixer.nitro"], ["pot", "furni/f_flowerpot.nitro"], ["vending-machine", "furni/olympics_r16_vendingmchn.nitro"],
    ["record-player", "furni/recordplayer.nitro"], ["vinyl-table", "furni/vinyltable.nitro"], ["boombox", "furni/boombox.nitro"],
    ["dumpster", "furni/alley_dumpster.nitro"], ["toolbox", "furni/ads_twi_toolbx.nitro"], ["sink", "furni/hygge_c25_toiletsink.nitro"],
    ["counter", "furni/f_counter.nitro"], ["wardrobe", "furni/uni_wardrobe.nitro"], ["bed-gothic", "furni/skin_bed_gothic.nitro"], ["restraint-bed", "furni/f_torturebed.nitro"],
    ["blood-bath", "furni/f_bloodbath.nitro"], ["trash-bags", "furni/messy_c21_trashbags.nitro"], ["poster", "furni/poster.nitro"], ["arcade", "furni/arcade_flappy.nitro"],
  ];
  for (const [name, path] of plain) {
    try {
      const n = await needNitro(path);
      for (const dir of [2, 4]) {
        const dirs = spritesFor(n, dir);
        if (!dirs.length) continue;
        await save(`furniture/${name}-dir${dir}.png`, composite([{ n, dir }], K));
      }
    } catch (e) { say("skipped " + name + ": " + (e as Error).message); }
  }
  const kit = await potKit();
  const { pot, foliage, shrooms, place } = kit;
  for (const [stage, grow] of [["seedling", 0.34], ["growing", 0.67], ["ready", 1]] as Array<[string, number]>) {
    await save(`weed/weed-in-pot-${stage}.png`, composite([pot, { n: foliage, dir: 2, nudge: place(foliage, 0.64), grow }], K));
    await save(`shrooms/shrooms-in-pot-${stage}.png`, composite([pot, { n: shrooms, dir: 2, nudge: place(shrooms, 0.95), grow }], K));
  }
  await save("weed/weed-plant-only.png", composite([{ n: foliage, dir: 2 }], K));
  say("furniture done");
}

async function potKit(): Promise<{ pot: Layer; foliage: NitroFurni; shrooms: NitroFurni; place: (art: NitroFurni, frac: number) => { x: number; y: number } }> {
  // the growing kit: a pot, with weed growing in it (the leaves of an old plant, everything that isn't green wiped out: the same trick the game uses) or shrooms
  const potN = await needNitro("furni/f_flowerpot.nitro");
  const pk = FURNI_KINDS.f_planter;
  const plant = await needNitro("furni/mafia_c26_planter_white.nitro");
  const foliage = derive(plant, (g) => {
    for (const [key, f] of Object.entries(plant.json.spritesheet.frames)) {
      const { x, y, w, h } = f.frame;
      if (/_64_sd_/.test(key)) { g.clearRect(x, y, w, h); continue; }
      if (!/_64_a_/.test(key) || w < 30 || h < 30) continue;
      const img = g.getImageData(x, y, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const r = img.data[i], gg = img.data[i + 1], b2 = img.data[i + 2];
        if (!(gg > r + 8 && gg > b2 + 8)) img.data[i + 3] = 0;
      }
      g.putImageData(img, x, y);
    }
  });
  const shrooms = await needNitro("furni/shrooms.nitro");
  const place = (art: NitroFurni, frac: number): { x: number; y: number } => {
    const s0 = spritesFor(art, 2).find((q) => !q.isShadow && q.sw > 2);
    return s0 ? { x: (pk.nudge?.x ?? 0) - (s0.dx + s0.sw / 2), y: (pk.nudge?.y ?? 0) - 22 - (s0.dy + Math.round(s0.sh * frac) - 1) } : { x: 0, y: 0 };
  };
  const pot: Layer = { n: potN, dir: 2, nudge: pk.nudge };
  return { pot, foliage, shrooms, place };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("no " + src)); i.src = src; });
}

async function icons(): Promise<void> {
  const ids = ["weed", "weedseed", "mix", "midweed", "thca", "hash", "hashmix", "joint", "blunt", "joint_hash", "joint_chud", "blunt_chud", "chudmix", "shroom", "shroomspore", "lsd", "dmt", "pill", "superpill",
    "kodimagnyl", "codeine", "syringe", "knife", "cigarette", "cigar", "tobacco", "lighter", "jointpaper", "bluntwrap", "wateringcan", "wateringcan_full", "burger", "cd"];
  for (const id of ids) {
    const def = (ITEMS as Record<string, { icon: string; name: string }>)[id];
    if (!def) continue;
    try {
      const img = await loadImage(def.icon);
      const k = img.naturalWidth <= 40 ? 8 : 2; // the small svg icons are 32x32 pixel art
      const c = document.createElement("canvas");
      c.width = img.naturalWidth * k; c.height = img.naturalHeight * k;
      const g = c.getContext("2d")!;
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, c.width, c.height);
      await save(`item-icons/${id}.png`, c);
    } catch (e) { say("icon skipped " + id + ": " + (e as Error).message); }
  }
  say("icons done");
}

async function avatars(): Promise<void> {
  for (const [name, figure] of Object.entries(FIGURES)) {
    for (const dir of [2, 3, 4]) {
      const c = await renderAvatar({ figure, dir, headDir: dir, actions: ["std"], gesture: "std", frame: 0 });
      if (c) await save(`characters/${name}-dir${dir}.png`, scaled(c, 4));
    }
  }
  say("avatars done");
}

// ---- Emil stabs bootyshaker ----------------------------------------------------------------------------------------------------------
const STAB_MS = 700;
const FEET_Y = 94;
const lungeAmount = (t: number): number => (t < 0.3 ? t / 0.3 : t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.4));
const flashAmount = (t: number): number => (t < 0.3 ? 0 : t < 0.9 ? Math.max(0, 0.65 - (t - 0.3)) : 0);
const padOf = (c: HTMLCanvasElement): { x: number; y: number } => ({ x: (c as unknown as { padL?: number }).padL || 0, y: (c as unknown as { padT?: number }).padT || 0 });
function redWash(img: HTMLCanvasElement, alpha: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = `rgba(190,20,20,${alpha})`;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

async function stabAnimation(): Promise<void> {
  const S = 5; // art pixel -> picture pixels
  const emil = (await renderAvatar({ figure: FIGURES.emil, dir: 2, headDir: 2, actions: ["std"], gesture: "std", frame: 0 }))!;
  const booty = (await renderAvatar({ figure: FIGURES.bootyshaker, dir: 4, headDir: 4, actions: ["std"], gesture: "std", frame: 0 }))!;
  const knife = await loadImage(ITEMS.knife.icon);
  const W = 760, H = 640;
  const feetA = { x: 210, y: 560 }, feetB = { x: 560, y: 560 }; // two characters standing face to face
  const chest = (f: { x: number; y: number }): { x: number; y: number } => ({ x: f.x, y: f.y - 46 * S });
  const frames: HTMLCanvasElement[] = [];
  const FPS = 30, LEAD = 6;
  const total = Math.round((1.25 * STAB_MS) / 1000 * FPS) + LEAD + 8;
  for (let i = 0; i < total; i++) {
    const t = (i - LEAD) / ((STAB_MS / 1000) * FPS); // 0 = the stab starts (a few idle frames before it, and after)
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    // victim, then attacker (the attacker stands to the left; nobody is in front of anyone)
    const ca = chest(feetA), cb = chest(feetB);
    const dx = cb.x - ca.x, dy = cb.y - ca.y, len = Math.hypot(dx, dy) || 1;
    const amt = t > 0 && t < 1 ? lungeAmount(t) * 16 * S : 0;
    const lunge = { x: (dx / len) * amt, y: (dy / len) * amt };
    const flash = t > 0 && t < 1 ? flashAmount(t) : 0;
    const drawChar = (img: HTMLCanvasElement, f: { x: number; y: number }, off: { x: number; y: number }, wash: number): void => {
      const pic = wash > 0.02 ? redWash(img, wash) : img;
      g.save();
      g.beginPath(); g.fillStyle = "rgba(0,0,0,0.18)"; g.ellipse(f.x + off.x, f.y + off.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(pic, f.x + off.x - (32 + padOf(img).x) * S, f.y + off.y - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
      g.restore();
    };
    drawChar(booty, feetB, { x: 0, y: 0 }, flash);
    drawChar(emil, feetA, lunge, 0);
    if (t >= 0.12 && t < 0.5) { // the knife swings from Emil's chest to bootyshaker's
      const k = Math.min(1, (t - 0.12) / 0.3);
      const x = ca.x + lunge.x + (cb.x - ca.x - lunge.x) * (0.4 + 0.6 * k), y = ca.y + lunge.y + (cb.y - ca.y - lunge.y) * (0.4 + 0.6 * k);
      g.save(); g.translate(x, y); g.rotate(Math.atan2(cb.y - ca.y, cb.x - ca.x) + Math.PI * 0.25);
      const s = 26 * S; g.drawImage(knife, -s / 2, -s / 2, s, s); g.restore();
    }
    if (t >= 0.3 && t < 1.15) { // the blue "0" hit splat rises over bootyshaker
      const rise = Math.min(1, (t - 0.3) / 0.5) * 14 * S;
      const sx = cb.x, sy = cb.y - 34 * S - rise, r = 11 * S;
      g.save(); g.globalAlpha = t > 0.95 ? Math.max(0, (1.15 - t) / 0.2) : 1;
      g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fillStyle = "#2f67a8"; g.fill(); g.lineWidth = 2 * S / 2; g.strokeStyle = "#0b2a52"; g.stroke();
      g.fillStyle = "#fff"; g.font = `bold ${Math.round(13 * S)}px Verdana, 'Apple Color Emoji', sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("0", sx, sy + S);
      g.restore();
    }
    frames.push(c);
  }
  for (let i = 0; i < frames.length; i++) await save(`animation-emil-stabs-bootyshaker/frames/frame-${String(i).padStart(3, "0")}.png`, frames[i]);
  say(`animation done: ${frames.length} frames at ${FPS} fps`);
}

/**
 * 6ixty's room for Blender: the floor and the two walls as flat pictures (the same colours, checker, rug and baseboards the game draws), and every piece of furniture as its own
 * transparent picture plus where it stands (tile, and where the picture's top-left corner sits relative to the piece's anchor), written to room.json.
 */
async function roomForBlender(which: "6ixty" | "lobby" = "6ixty"): Promise<void> {
  const DIR = which === "lobby" ? "public-room-blender/" : "6ixty-room-blender/";
  const def = which === "lobby" ? lobbyDef([]) : defFromMeta("u_6ixty", (await (await fetch("/export-data/room6ixty.json")).json()) as RoomMeta);
  const t = def.theme, W = def.w, H = def.h, T = 64; // 64 picture pixels per tile on the floor
  // floor, seen from straight above: the game's checker (tiles with a faint edge) and the rug with its darker border
  const fl = document.createElement("canvas");
  fl.width = W * T; fl.height = H * T;
  const fg = fl.getContext("2d")!;
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const r = def.rug;
    const rug = !!r && tx >= r.x0 && tx < r.x0 + r.w && ty >= r.y0 && ty < r.y0 + r.h;
    const edge = rug && !!r && (tx === r.x0 || tx === r.x0 + r.w - 1 || ty === r.y0 || ty === r.y0 + r.h - 1);
    fg.fillStyle = rug ? shade(t.rugColor, edge ? 0.88 : 1) : (tx + ty) % 2 ? t.floorA : t.floorB;
    fg.fillRect(tx * T, ty * T, T, T);
    fg.strokeStyle = "rgba(0,0,0,0.12)"; fg.lineWidth = 2; fg.strokeRect(tx * T + 1, ty * T + 1, T - 2, T - 2);
  }
  await save(DIR + "textures/floor.png", fl);
  // walls: the plain colour, a baseboard along the bottom, a thin darker edge (the right wall is lit more than the left one)
  const wall = async (name: string, tiles: number, light: number, board: number): Promise<void> => {
    const c = document.createElement("canvas");
    c.width = tiles * T; c.height = WALL_H * 2;
    const g = c.getContext("2d")!;
    g.fillStyle = shade(t.wall, light); g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = shade(t.wall, board); g.fillRect(0, c.height - 20, c.width, 20);
    g.strokeStyle = shade(t.wall, 0.8); g.lineWidth = 2; g.strokeRect(1, 1, c.width - 2, c.height - 2);
    await save(DIR + "textures/" + name + ".png", c);
  };
  await wall("wall-back", W, 1, 0.72); // the wall along game y = 0
  await wall("wall-left", H, 0.88, 0.64); // the wall along game x = 0

  // furniture
  const K = 4;
  const kit = await potKit();
  const manifest: Array<Record<string, unknown>> = [];
  for (const f of def.furni) {
    const k = FURNI_KINDS[f.kind];
    if (!k?.nitro) continue;
    try {
      const n = await needNitro(k.nitro);
      const dir = f.dir ?? 0;
      const layers: Layer[] = [{ n, dir, nudge: k.nudge }];
      if (f.kind === "f_planter") {
        const crop = f.plant?.crop === "shroom" ? "shroom" : "weed";
        if (f.plant) layers.push({ n: crop === "shroom" ? kit.shrooms : kit.foliage, dir: 2, nudge: kit.place(crop === "shroom" ? kit.shrooms : kit.foliage, crop === "shroom" ? 0.95 : 0.64) });
      }
      const box = compositeBox(layers, K);
      let tx = f.x, ty = f.y;
      if (k.wall) { if (dir === 2) tx -= 0.5; else ty -= 0.5; } // wall pieces hang on the wall plane, not on the floor tile
      const file = `furniture/${f.id}-${f.kind}.png`;
      await save(DIR + file, box.canvas);
      manifest.push({ id: f.id, kind: f.kind, png: file, anchorTileX: tx, anchorTileY: ty, ox: box.x0, oy: box.y0, pw: box.canvas.width / K, ph: box.canvas.height / K, flat: !!k.flat, wall: !!k.wall, dir });
    } catch (e) { say("skipped " + f.kind + ": " + (e as Error).message); }
  }
  const json = JSON.stringify({ w: W, h: H, doors: which === "lobby" ? [{ x: def.doorX, color: "#8a8f98", label: "Home" }, ...(def.extraDoors ?? []).map((d) => ({ x: d.x, color: d.yellow ? "#e0b020" : "#8a8f98", label: d.label }))] : [], wallHeightPx: WALL_H, tilePx: TILE_W, theme: t, rug: def.rug, floor: "textures/floor.png", wallBack: "textures/wall-back.png", wallLeft: "textures/wall-left.png", pieces: manifest }, null, 1);
  await fetch(SAVE + DIR + "room.json", { method: "POST", body: new Blob([json]) });
  say(`room export done: ${manifest.length} pieces`);
}

/** like composite(), but untrimmed and returning where the picture's top-left corner sits relative to the anchor (in art pixels) */
function compositeBox(layers: Layer[], k: number): { canvas: HTMLCanvasElement; x0: number; y0: number } {
  const items = layers.flatMap((l) => spritesFor(l.n, l.dir).filter((s) => !s.isShadow && s.sw > 2 && s.sh > 2).map((s) => ({ l, s, x: s.dx + (l.nudge?.x ?? 0), y: s.dy + (l.nudge?.y ?? 0) })));
  const x0 = Math.min(...items.map((i) => i.x)), y0 = Math.min(...items.map((i) => i.y));
  const x1 = Math.max(...items.map((i) => i.x + i.s.sw)), y1 = Math.max(...items.map((i) => i.y + i.s.sh));
  const c = document.createElement("canvas");
  c.width = Math.ceil((x1 - x0) * k); c.height = Math.ceil((y1 - y0) * k);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  for (const it of items) {
    const px = (it.x - x0) * k, py = (it.y - y0) * k;
    if (it.s.flipH) { g.save(); g.translate(px + it.s.sw * k, py); g.scale(-1, 1); g.drawImage(it.s.image, it.s.sx, it.s.sy, it.s.sw, it.s.sh, 0, 0, it.s.sw * k, it.s.sh * k); g.restore(); }
    else g.drawImage(it.s.image, it.s.sx, it.s.sy, it.s.sw, it.s.sh, px, py, it.s.sw * k, it.s.sh * k);
  }
  return { canvas: c, x0, y0 };
}

/** the game's floating "+1" over a head: a blood drop and the number, with a little pop as it appears, rising and fading (src/ui/room.ts, "floating +1") */
function bloodPop(g: CanvasRenderingContext2D, icon: HTMLImageElement, text: string, x: number, y: number, ageMs: number, S: number, life = 1100): void {
  if (ageMs < 0 || ageMs > life) return;
  g.save();
  g.globalAlpha = Math.max(0, Math.min(1, (life - ageMs) / (life * 0.45)));
  const fsz = 16 * S;
  g.font = `bold ${fsz}px Verdana, 'Apple Color Emoji', sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 3 * S / 2; g.strokeStyle = "#000"; g.lineJoin = "round";
  const fy = y - ageMs * 0.04 * S;
  const sz = fsz * 1.7;
  const tw = g.measureText(text).width;
  const pop = 1 + 0.35 * Math.max(0, 1 - ageMs / 260);
  const left = x - (sz + 4 * S + tw) / 2;
  const fx = left + sz + 4 * S + tw / 2;
  g.imageSmoothingEnabled = false;
  g.drawImage(icon, left + sz / 2 - (sz * pop) / 2, fy - (sz * pop) / 2, sz * pop, sz * pop);
  g.strokeText(text, fx, fy);
  g.fillStyle = "#ff5252"; g.fillText(text, fx, fy);
  g.restore();
}

/** blood drops going +1, +1, +1 */
async function bloodDrops(): Promise<void> {
  const icon = await loadImage(ITEMS.knife ? "/items/blood.svg" : "/items/blood.svg");
  const S = 5, W = 640, H = 360, FPS = 30;
  const gap = 14, life = 1100;
  const total = gap * 2 + Math.round((life / 1000) * FPS) + 8;
  for (let i = 0; i < total; i++) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    for (let k = 0; k < 3; k++) bloodPop(g, icon, "+1", W / 2, H - 70, ((i - 4 - k * gap) / FPS) * 1000, S, life);
    await save(`animation-blood-drops-plus-one/frames/frame-${String(i).padStart(3, "0")}.png`, c);
  }
  say(`blood drops done: ${total} frames at ${FPS} fps`);
}

/** a seamless loop of the "-1" (a stab or a payment costs one blood): one pop per loop, the last frames are empty so it restarts cleanly */
async function bloodMinusLoop(): Promise<void> {
  const icon = await loadImage("/items/blood.svg");
  const S = 5, W = 640, H = 360, FPS = 30, life = 1100;
  const total = 45; // 1.5 s per loop
  for (let i = 0; i < total; i++) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    bloodPop(c.getContext("2d")!, icon, "-1", W / 2, H - 70, (i / FPS) * 1000, S, life);
    await save(`animation-blood-minus-one-loop/frames/frame-${String(i).padStart(3, "0")}.png`, c);
  }
  say(`blood -1 loop done: ${total} frames at ${FPS} fps`);
}

/** someone (Emil) sells things to 6ixty: each thing flies over to him and the drops of blood he pays pop up over the seller */
async function sellToSixty(): Promise<void> {
  const S = 5, W = 900, H = 640, FPS = 30;
  const emil = (await renderAvatar({ figure: FIGURES.emil, dir: 2, headDir: 2, actions: ["std"], gesture: "std", frame: 0 }))!;
  const sixty = (await renderAvatar({ figure: FIGURES["6ixty"], dir: 3, headDir: 3, actions: ["std"], gesture: "std", frame: 0 }))!; // facing the camera (dir 3): his umbrella covers his whole head from the front; from the side his head pokes out of its edge
  const blood = await loadImage("/items/blood.svg");
  const sells: Array<{ icon: string; pays: number }> = [{ icon: ITEMS.weed.icon, pays: 6 }, { icon: ITEMS.shroom.icon, pays: 14 }, { icon: ITEMS.lsd.icon, pays: 22 }];
  const icons = await Promise.all(sells.map((x) => loadImage(x.icon)));
  const feetA = { x: 230, y: 560 }, feetB = { x: 680, y: 560 };
  const LEAD = 6, EACH = 38, TAIL = 26;
  const total = LEAD + EACH * sells.length + TAIL;
  const chestA = { x: feetA.x + 40, y: feetA.y - 40 * S }, chestB = { x: feetB.x - 20, y: feetB.y - 40 * S };
  for (let i = 0; i < total; i++) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    // 6ixty gives a little hop each time he takes something; Emil leans in as he holds it out
    let hopB = 0, leanA = 0;
    sells.forEach((_, k) => {
      const t = i - LEAD - k * EACH;
      if (t >= 22 && t < 30) hopB = Math.sin(((t - 22) / 8) * Math.PI) * 6 * S;
      if (t >= 6 && t < 22) leanA = Math.sin(((t - 6) / 16) * Math.PI) * 8 * S;
    });
    const shadow = (f: { x: number; y: number }): void => { g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(f.x, f.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill(); };
    const draw = (img: HTMLCanvasElement, f: { x: number; y: number }, dx: number, dy: number): void => {
      shadow(f);
      g.drawImage(img, f.x + dx - (32 + padOf(img).x) * S, f.y + dy - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
    };
    draw(sixty, feetB, 0, -hopB);
    draw(emil, feetA, leanA, 0);
    sells.forEach((sell, k) => {
      const t = i - LEAD - k * EACH;
      const img = icons[k];
      const sz = 36 * S;
      if (t >= 4 && t < 22) { // the thing is held out, then thrown across in an arc
        const u = Math.max(0, (t - 8) / 14);
        const e = u * u * (3 - 2 * u);
        const x = chestA.x + (chestB.x - chestA.x) * e, y = chestA.y + (chestB.y - chestA.y) * e - Math.sin(e * Math.PI) * 70 * S / 2 - (t < 8 ? (t - 4) * S : 4 * S);
        const spin = e * Math.PI * 0.6;
        g.save(); g.translate(x, y); g.rotate(spin); g.drawImage(img, -sz / 2, -sz / 2, sz, sz); g.restore();
      }
      bloodPop(g, blood, `+${sell.pays}`, feetA.x + leanA, feetA.y - 80 * S, ((t - 22) / FPS) * 1000, S, 1300); // 6ixty pays: the drops pop up over the seller
    });
    await save(`animation-sell-to-6ixty/frames/frame-${String(i).padStart(3, "0")}.png`, c);
  }
  say(`sell animation done: ${total} frames at ${FPS} fps`);
}

const JET = "hd-600-1.hr-98092.he-98089-80.ea-98051.fa-98060-71.ch-98029.ca-98003-71.lg-98121-1408.sh-98139.wa-98147-71"; // WatchYoJet's look

/** the game's own cigarette / joint / blunt at the mouth with its drifting smoke (src/ui/room.ts drawCigarette), drawn as chunky pixels */
function drawBlunt(g: CanvasRenderingContext2D, S: number, fx: number, fy: number, dir: number, nowMs: number, ember = 1): void {
  const blob = (cx: number, cy: number, r: number, color: string): void => {
    const P = S, n = Math.max(0, Math.round(r / P)), gx = Math.round(cx / P), gy = Math.round(cy / P);
    g.fillStyle = color;
    for (let dy = -n; dy <= n; dy++) { let w = 0; while ((w + 1) * (w + 1) + dy * dy <= n * n + n) w++; if (n === 0) w = 0; g.fillRect((gx - w) * P, (gy + dy) * P, (2 * w + 1) * P, P); }
  };
  const side = dir >= 1 && dir <= 3 ? 1 : dir >= 5 && dir <= 7 ? -1 : 0;
  const mx = fx + side * 5 * S, my = fy - (FEET_Y - 51) * S;
  const tipx = mx + (side || 1) * 11 * S, tipy = my + 2.5 * S;
  g.save();
  g.lineCap = "round";
  g.strokeStyle = "rgba(30,24,20,0.75)"; g.lineWidth = 5 * S;
  g.beginPath(); g.moveTo(mx, my); g.lineTo(tipx, tipy); g.stroke();
  g.strokeStyle = "#8b5a2b"; g.lineWidth = 3.4 * S;
  g.beginPath(); g.moveTo(mx, my); g.lineTo(tipx, tipy); g.stroke();
  g.strokeStyle = `rgba(255,106,26,${ember})`; g.lineWidth = 3 * S;
  g.beginPath(); g.moveTo(tipx - (side || 1) * 1.6 * S, tipy - 0.3 * S); g.lineTo(tipx, tipy); g.stroke();
  for (let i = 0; i < 6; i++) {
    const t = (nowMs / 1900 + i / 6) % 1;
    const px = tipx + Math.sin(t * 7 + i * 1.7) * 3.5 * S + t * 3 * S * (side || 1);
    const py = tipy - t * 36 * S;
    blob(px, py, (1.6 + t * 4.2) * S, `rgba(222,224,230,${(0.5 * (1 - t)).toFixed(3)})`);
  }
  g.restore();
}

/** watchyoJet: nothing on, then the outfit appears piece by piece, then a blunt */
async function jetDressSmoke(): Promise<void> {
  const S = 6, W = 700, H = 720, FPS = 30;
  const feet = { x: W / 2, y: H - 60 };
  const parts = JET.split(".");
  const typeOf = (p: string): string => p.split("-")[0];
  const order = ["sh", "lg", "ch", "ca", "wa", "hr", "fa", "he", "ea"]; // shoes up to the hair and the face things
  const stages: string[] = [parts.filter((p) => typeOf(p) === "hd").join(".")]; // just the body and the head
  const have: string[] = [stages[0]];
  for (const t of order) { const p = parts.filter((q) => typeOf(q) === t); if (!p.length) continue; have.push(...p); stages.push(have.join(".")); }
  const imgs: HTMLCanvasElement[] = [];
  for (const fig of stages) imgs.push((await renderAvatar({ figure: fig, dir: 3, headDir: 3, actions: ["std"], gesture: "std", frame: 0 }))!);
  const draw = (g: CanvasRenderingContext2D, img: HTMLCanvasElement, dy: number, flash: number): void => {
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(feet.x, feet.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill();
    let pic = img;
    if (flash > 0.02) { // a quick white flash as each piece appears
      pic = document.createElement("canvas"); pic.width = img.width; pic.height = img.height;
      const x = pic.getContext("2d")!; x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-atop"; x.fillStyle = `rgba(255,255,255,${flash})`; x.fillRect(0, 0, pic.width, pic.height);
    }
    g.drawImage(pic, feet.x - (32 + padOf(img).x) * S, feet.y + dy - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
  };
  let n = 0;
  const out = async (c: HTMLCanvasElement): Promise<void> => { await save(`animation-watchyojet-dress-and-smoke/frames/frame-${String(n++).padStart(3, "0")}.png`, c); };
  const blank = (): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } => { const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!; g.imageSmoothingEnabled = false; return { c, g }; };
  for (let i = 0; i < 12; i++) { const { c, g } = blank(); draw(g, imgs[0], 0, 0); await out(c); } // nothing on
  const PER = 9;
  for (let k = 1; k < imgs.length; k++) for (let i = 0; i < PER; i++) { // each piece pops on: a hop and a flash
    const { c, g } = blank();
    const hop = i < 5 ? Math.sin((i / 5) * Math.PI) * 4 * S : 0;
    draw(g, imgs[k], -hop, Math.max(0, 0.7 - i * 0.18));
    await out(c);
  }
  const dressed = imgs[imgs.length - 1];
  for (let i = 0; i < 14; i++) { const { c, g } = blank(); draw(g, dressed, 0, 0); await out(c); } // posing
  const SMOKE = 120;
  for (let i = 0; i < SMOKE; i++) { // the blunt is lit and smoked: now and then a drag (a small lift of the head, the ember glowing)
    const { c, g } = blank();
    const drag = Math.max(0, Math.sin((i / 40) * Math.PI * 2 - 0.6));
    draw(g, dressed, -drag * 1.5 * S, 0);
    drawBlunt(g, S, feet.x, feet.y - drag * 1.5 * S, 3, (i / FPS) * 1000, i < 4 ? 0.2 : 0.6 + 0.4 * drag);
    await out(c);
  }
  say(`dress and smoke done: ${n} frames at ${FPS} fps, ${stages.length} stages`);
}

/** watchyoJet sipping lean: the cup is lifted to the mouth, tipped, lowered, twice */
async function jetSipLean(): Promise<void> {
  const S = 6, W = 700, H = 720;
  const feet = { x: W / 2, y: H - 60 };
  const img = (await renderAvatar({ figure: JET, dir: 3, headDir: 3, actions: ["std"], gesture: "std", frame: 0 }))!;
  const cup = await loadImage(ITEMS.codeine.icon);
  const HAND = [-10, -26]; // where the game holds the cup (KNIFE_HAND for this facing)
  const cs = 26 * S;
  // the picture is square with the cup nearly filling it, so the rim is the top edge of the picture: the rim is what travels to the mouth
  const hand = { x: feet.x + HAND[0] * S, y: feet.y + HAND[1] * S - cs * 0.8 };
  const mouth = { x: feet.x + 2 * S, y: feet.y - 42 * S }; // measured on this character: the middle of the mouth, 42 art pixels up from the feet
  const rim = { x: mouth.x + 2 * S, y: mouth.y + 1 * S };   // the rim touches the lower lip
  const ease = (u: number): number => u * u * (3 - 2 * u);
  let n = 0;
  const frames = 150;
  for (let i = 0; i < frames; i++) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(feet.x, feet.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill();
    // two sips: lift (14 frames), tip and hold (22), lower (14), rest
    const cycle = (i - 14) % 62;
    let lift = 0, tip = 0;
    if (i >= 14 && i < 14 + 124) {
      if (cycle < 14) lift = ease(cycle / 14);
      else if (cycle < 36) { lift = 1; tip = ease(Math.min(1, (cycle - 14) / 6)) * (cycle > 30 ? 1 - (cycle - 30) / 6 : 1); }
      else if (cycle < 50) lift = 1 - ease((cycle - 36) / 14);
    }
    const tilt = lift * 0.1 + tip * 0.22; // the cup tips a little more while drinking (turning about the rim)
    g.save();
    g.translate(feet.x, feet.y - tip * 0.6 * S);
    g.drawImage(img, -(32 + padOf(img).x) * S, -(FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
    g.restore();
    const px = hand.x + (rim.x - hand.x) * lift, py = hand.y + (rim.y - hand.y) * lift - tip * 0.6 * S;
    g.save();
    g.translate(px, py);
    g.rotate(tilt);
    g.shadowColor = "rgba(0,0,0,0.75)"; g.shadowBlur = 3 * S;
    g.drawImage(cup, -cs / 2, -cs * 0.05, cs, cs);
    g.restore();
    if (tip > 0.3) { // a little purple drips from the rim into the mouth while it is tipped
      g.fillStyle = "#8a2fc4";
      const dripH = (2 + 3 * Math.sin(i * 0.6)) * S;
      g.fillRect(Math.round((rim.x - S) / S) * S, Math.round(rim.y / S) * S, 2 * S, dripH);
    }
    await save(`animation-watchyojet-sipping-lean/frames/frame-${String(n++).padStart(3, "0")}.png`, c);
  }
  say(`sipping done: ${n} frames at 30 fps`);
}

/** A contact sheet of the new furniture as the game draws it: every piece in its default state at its shop facing (and one picture per further state), labelled. */
async function newFurnitureSheet(): Promise<void> {
  const { SHOP_PIECES, SHOP_KIND_PREFIX } = await import("./shared/furniture");
  const { drawNitroFurni } = await import("./roomRender");
  const first = SHOP_PIECES.findIndex((p) => p.id === "cheerbear");
  const list = SHOP_PIECES.slice(first);
  for (const p of list) await loadNitro(`furni/${SHOP_KIND_PREFIX}${p.id}.nitro`);
  const cols = 8, cellW = 230, cellH = 230;
  const rows = Math.ceil(list.length / cols);
  const c = document.createElement("canvas");
  c.width = cols * cellW; c.height = rows * cellH;
  const g = c.getContext("2d")!;
  g.fillStyle = "#4a525c"; g.fillRect(0, 0, c.width, c.height);
  g.font = "bold 13px Verdana, 'Apple Color Emoji', sans-serif";
  list.forEach((p, i) => {
    const cx = (i % cols) * cellW + cellW / 2, cy = Math.floor(i / cols) * cellH + cellH * 0.62;
    const kind = SHOP_KIND_PREFIX + p.id;
    g.fillStyle = "#566069"; g.fillRect((i % cols) * cellW + 2, Math.floor(i / cols) * cellH + 2, cellW - 4, cellH - 4);
    const toScreen = (q: { x: number; y: number }): { x: number; y: number } => ({ x: q.x + cx, y: q.y + cy });
    const anim = { state: p.defaultState ?? 0, t: 900 };
    drawNitroFurni(g, kind, 0, 0, p.showDir, toScreen, 1.2, 1, false, p.states || FURNI_KINDS[kind].nitro ? anim : undefined);
    g.fillStyle = "#fff"; g.textAlign = "left";
    g.fillText(`${p.id} ${p.w}x${p.h}${p.seat ? " seat" : ""}${p.surface ? " top" : ""}${p.small ? " small" : ""}${p.states ? " st" + p.states.join("") : ""}`, (i % cols) * cellW + 6, Math.floor(i / cols) * cellH + 16);
  });
  await save("shots/new-furniture-sheet.png", c);
  say("sheet saved");
}

/** weed growing in a pot: planted, then the plant rises out of the soil until it is ready (the same reveal-from-the-bottom the game uses) */
async function weedGrowth(): Promise<void> {
  const { pot, foliage, place } = await potKit();
  const K = 12, FPS = 30;
  const seedFrames = 12, growFrames = 90, holdFrames = 24;
  const total = seedFrames + growFrames + holdFrames;
  for (let i = 0; i < total; i++) {
    const prog = Math.max(0, Math.min(1, (i - seedFrames) / growFrames));
    const shown = i < seedFrames ? 0 : 0.34 + 0.66 * prog; // the game's own curve: a seedling shows at once, the full plant when grown
    const layers: Layer[] = [pot];
    if (shown > 0) layers.push({ n: foliage, dir: 2, nudge: place(foliage, 0.64), grow: shown });
    await save(`animation-weed-growing/frames/frame-${String(i).padStart(3, "0")}.png`, composite(layers, K, false));
  }
  say(`weed growth done: ${total} frames at ${FPS} fps`);
}

/** every account's character spins once, then the next account's takes over in the same spot: it looks like one player spinning and changing outfit */
// ---- scenes in the basement: busted and broke take LSD on the starter bed, emil6 sleeps on one --------------------------------------------
const BUSTED = "hd-209-1.hr-98173-9002.he-98089-71.fa-97045.ch-98188-1408.cc-98015-64.ca-98155.lg-98198-80.sh-98139.wa-98169-71"; // emil5's look
const BROKE = FIGURES.emil; // emil's look
const EMIL6 = "hd-190-10.hr-98095-35.fa-98057.ch-804-64.lg-98129-82.sh-98139";
const LAY_DX = -76, LAY_DY = -76; // where the game draws a lying player, relative to the bed's head tile

async function basementScene(def: RoomDef, cam: { x: number; y: number }, W: number, H: number, S: number, order: string[]): Promise<{ bg: HTMLCanvasElement; feetOf: (tx: number, ty: number) => { x: number; y: number } }> {
  await ensureBasementArt();
  await ensureFurniSprites(def);
  const shell = renderRoomShell(def);
  const toScreen = (p: { x: number; y: number }): { x: number; y: number } => ({ x: W / 2 + (p.x - cam.x) * S, y: H / 2 + (p.y - cam.y) * S });
  const bg = document.createElement("canvas");
  bg.width = W; bg.height = H;
  const g = bg.getContext("2d")!;
  const o = toScreen({ x: -shell.origin.x, y: -shell.origin.y });
  g.imageSmoothingEnabled = true;
  g.drawImage(shell.canvas, o.x, o.y, shell.canvas.width * S, shell.canvas.height * S);
  g.imageSmoothingEnabled = false;
  for (const id of order) { // back to front
    const f = def.furni.find((q) => q.id === id)!;
    if (!drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, S)) throw new Error("art not loaded: " + f.kind);
  }
  return { bg, feetOf: (tx, ty) => { const w = iso(tx, ty); return toScreen({ x: w.x, y: w.y + TILE_H / 2 }); } };
}

function nameTag(g: CanvasRenderingContext2D, S: number, name: string, x: number, y: number): void {
  g.save();
  g.font = `${Math.round(10 * S)}px Verdana, 'Apple Color Emoji', sans-serif`;
  const tw = g.measureText(name).width + 10 * S;
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.beginPath(); g.roundRect(x - tw / 2, y, tw, 14 * S, 5 * S); g.fill();
  g.fillStyle = "#fff"; g.textBaseline = "top"; g.textAlign = "center";
  g.fillText(name, x, y + 2 * S);
  g.restore();
}

/** a four-point twinkle on the pixel grid (like the game's own) */
function star(g: CanvasRenderingContext2D, P: number, cx: number, cy: number, arm: number, color: string): void {
  const gx = Math.round(cx / P) * P, gy = Math.round(cy / P) * P;
  g.fillStyle = color;
  g.fillRect(gx, gy, P, P);
  for (let i = 1; i <= arm; i++) { g.fillRect(gx + i * P, gy, P, P); g.fillRect(gx - i * P, gy, P, P); g.fillRect(gx, gy + i * P, P, P); g.fillRect(gx, gy - i * P, P, P); }
}

async function bustedAndBroke(): Promise<void> {
  const W = 1400, H = 900, S = 3, FPS = 30, OUT = "animation-busted-and-broke-lsd";
  const base = lobbyDef([]);
  const def: RoomDef = { ...base, furni: [
    { id: "d1", kind: "dumpster", x: 3, y: 0, dir: 4 },
    { id: "d2", kind: "dumpster", x: 5, y: 0, dir: 4 },
  ] };
  const scene = await basementScene(def, { x: iso(4.6, 2.6).x, y: iso(4.6, 2.6).y - 30 }, W, H, S, ["d1", "d2"]);
  const lsd = await loadImage(ITEMS.lsd.icon);
  const STEP = 160; // ms per tile: LSD is 3x speed (the game's step is 480 ms)
  const chain = (pts: Array<[number, number]>): Array<[number, number]> => { // the tiles between the waypoints, one step at a time (diagonals allowed)
    const out: Array<[number, number]> = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      let [x, y] = out[out.length - 1];
      const [tx, ty] = pts[i];
      while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
    }
    return out;
  };
  const people = [
    { name: "busted", figure: BUSTED, late: 0, start: [3, 2] as [number, number], run: chain([[3, 2], [6, 5], [2, 4], [4, 1], [7, 3], [3, 5], [5, 2], [3, 4]]), end: [3, 4] as [number, number] },
    { name: "broke", figure: BROKE, late: 5, start: [5, 2] as [number, number], run: chain([[5, 2], [2, 3], [6, 4], [3, 1], [7, 5], [4, 3], [6, 1], [6, 4]]), end: [6, 4] as [number, number] },
  ];
  const T_IDLE = 0.9, T_TAKE = 1.0, T_RUN = 3.2, T_STUMBLE = 0.9, T_SLEEP = 2.8;
  const total = Math.round((T_IDLE + T_TAKE + T_RUN + T_STUMBLE + T_SLEEP) * FPS);
  const glyphs: Array<{ who: number; born: number; ox: number }> = [];
  const lastGlyph = [-1e9, -1e9];
  const lay = new Map<string, HTMLCanvasElement>();
  let n = 0;
  for (let i = 0; i < total; i++) {
    const t = i / FPS, ms = t * 1000;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(scene.bg, 0, 0);
    const tTake = t - T_IDLE, tRun = t - T_IDLE - T_TAKE, tStumble = tRun - T_RUN, tSleep = tStumble - T_STUMBLE;
    const draws: Array<{ depth: number; draw: () => void }> = [];
    for (let k = 0; k < people.length; k++) {
      const p = people[k];
      const mine = tRun - p.late / FPS; // this one's own clock in the trip (the second one starts a moment later)
      const running = mine >= 0 && tStumble < 0;
      // where the feet are: standing on the start tile, running along the path (one tile per STEP), then slowing to a stop on the end tile
      let pos = { x: p.start[0], y: p.start[1] };
      if (mine >= 0) {
        const steps = mine * 1000 / STEP;
        const i0 = Math.min(p.run.length - 1, Math.floor(steps)), i1 = Math.min(p.run.length - 1, i0 + 1), fr = Math.min(1, steps - i0);
        pos = { x: p.run[i0][0] + (p.run[i1][0] - p.run[i0][0]) * fr, y: p.run[i0][1] + (p.run[i1][1] - p.run[i0][1]) * fr };
        if (steps >= p.run.length - 1) pos = { x: p.end[0], y: p.end[1] };
      }
      const w = iso(pos.x, pos.y);
      const f = scene.feetOf(pos.x, pos.y);
      void w;
      const beat = 0.5 + 0.5 * Math.sin(ms / 160);
      const done = tStumble >= 0;
      const fallen = tSleep >= 0.1 + p.late / 60; // they go down one after the other
      let img: HTMLCanvasElement;
      let dx = 0, dy = 0;
      if (fallen) {
        const key = p.figure;
        if (!lay.has(key)) lay.set(key, (await renderAvatar({ figure: p.figure, dir: 2, headDir: 2, actions: ["lay"], gesture: "std", frame: 0 }))!);
        img = lay.get(key)!;
      } else {
        const dir = running ? SPIN_DIRS[Math.floor((mine * 1000) / 140) % 8] : 3;
        const gesture = done ? "eyb" : "std";
        img = (await renderAvatar({ figure: p.figure, dir, headDir: dir, actions: [running ? "wlk" : "std"], gesture, frame: running ? Math.floor(ms / 40) % 4 : 0 }))!;
        if (done) dx = Math.sin(ms / 120) * 3 * Math.min(1, tStumble * 2); // swaying on their feet before they drop
      }
      draws.push({ depth: pos.x + pos.y + (fallen ? 0.6 : 0.5), draw: () => {
        if (fallen) {
          g.drawImage(img, f.x + (LAY_DX - padOf(img).x) * S, f.y + (LAY_DY - padOf(img).y) * S, img.width * S, img.height * S);
          return;
        }
        if (!running) { g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(f.x, f.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill(); }
        else { g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(f.x, f.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill(); }
        g.save();
        if (running) { g.shadowColor = `hsla(${Math.floor(ms / 3) % 360},100%,62%,0.9)`; g.shadowBlur = (12 + 10 * beat) * S; }
        g.drawImage(img, f.x + dx * S - (32 + padOf(img).x) * S, f.y + dy * S - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
        g.restore();
        if (running) { // a ring of rainbow twinkles round the body
          for (let q = 0; q < 12; q++) {
            const ang = ms / 700 + (q / 12) * Math.PI * 2;
            const rad = (20 + 5 * Math.sin(ms / 300 + q * 2)) * S;
            g.save(); g.globalAlpha = 0.55 + 0.45 * Math.sin(ms / 110 + q * 1.7);
            star(g, S, f.x + Math.cos(ang) * rad, f.y - 46 * S + Math.sin(ang) * rad * 1.9, q % 3 === 0 ? 2 : 1, `hsl(${(Math.floor(ms / 5) + q * 30) % 360},100%,68%)`);
            g.restore();
          }
        }
        // taking it: the little pattern lifts to the mouth and is gone
        const tk = (tTake - p.late / FPS) / 0.7;
        if (tk >= 0 && tk < 1 && tRun < 0) {
          const sz = 18 * S * (1 - 0.4 * tk);
          const yy = f.y - (30 + 34 * tk) * S, xx = f.x + 16 * S * (1 - tk);
          g.save(); g.globalAlpha = tk < 0.8 ? 1 : (1 - tk) / 0.2;
          g.drawImage(lsd, xx - sz / 2, yy - sz / 2, sz, sz);
          g.restore();
          if (tk > 0.75) star(g, S, f.x, f.y - 74 * S, 2, "#fff");
        }
      } });
      if (!fallen) draws.push({ depth: 99, draw: () => nameTag(g, S, p.name, f.x, f.y + 8 * S) });
      // asleep: zzz drift up from the head (the game's sleep emote)
      if (fallen && ms - lastGlyph[k] > 420) { lastGlyph[k] = ms; glyphs.push({ who: k, born: ms, ox: (Math.random() - 0.5) * 30 }); }
    }
    draws.sort((a, b) => a.depth - b.depth);
    for (const d of draws) d.draw();
    g.save();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `${Math.round(20 * S)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    for (let q = glyphs.length - 1; q >= 0; q--) {
      const gl = glyphs[q], age = ms - gl.born;
      if (age > 1500) { glyphs.splice(q, 1); continue; }
      const e = people[gl.who].end;
      const f = scene.feetOf(e[0], e[1]);
      g.globalAlpha = Math.max(0, 1 - age / 1500);
      g.fillText("💤", f.x + 40 * S + gl.ox * S, f.y - 34 * S - age * 0.035 * S);
    }
    g.restore();
    await save(`${OUT}/frames/frame-${String(n++).padStart(3, "0")}.png`, c);
  }
  say(`busted and broke done: ${n} frames at ${FPS} fps`);
}

async function emil6Sleeping(): Promise<void> {
  const W = 1120, H = 760, S = 4, FPS = 30, OUT = "animation-emil6-sleeping";
  const base = lobbyDef([]);
  const def: RoomDef = { ...base, furni: [{ id: "bed", kind: "bed", x: 5, y: 7, dir: 2 }] };
  const scene = await basementScene(def, { x: iso(6.5, 7.5).x, y: iso(6.5, 7.5).y - 10 }, W, H, S, ["bed"]);
  const limg = (await renderAvatar({ figure: EMIL6, dir: 2, headDir: 2, actions: ["lay"], gesture: "std", frame: 0 }))!;
  const total = 7 * FPS;
  const glyphs: Array<{ born: number; ox: number }> = [];
  let last = -1e9, n = 0;
  for (let i = 0; i < total; i++) {
    const ms = (i / FPS) * 1000;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(scene.bg, 0, 0);
    const f = scene.feetOf(5, 7);
    g.drawImage(limg, f.x + (LAY_DX - padOf(limg).x) * S, f.y + (LAY_DY - padOf(limg).y) * S, limg.width * S, limg.height * S);
    if (ms - last > 1100) { last = ms; glyphs.push({ born: ms, ox: 10 + (Math.random() - 0.5) * 16 }); } // the sleepers' zzz (the game: one every 1.1 s)
    g.save();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `${Math.round(20 * S)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    for (let q = glyphs.length - 1; q >= 0; q--) {
      const gl = glyphs[q], age = ms - gl.born;
      if (age > 1900) { glyphs.splice(q, 1); continue; }
      g.globalAlpha = Math.max(0, 1 - age / 1900);
      g.fillText("💤", f.x + 40 * S + gl.ox * S, f.y - 34 * S - age * 0.035 * S);
    }
    g.restore();
    await save(`${OUT}/frames/frame-${String(n++).padStart(3, "0")}.png`, c);
  }
  say(`emil6 sleeping done: ${n} frames at ${FPS} fps`);
}

/** emil6 keeps sleeping on the bed; 6ixty walks in from the corner of the room, stops beside the bed and says his line */
async function emil6Sixty(): Promise<void> {
  const W = 1400, H = 900, S = 3, FPS = 30, OUT = "animation-emil6-sleeping-sixty";
  const LINE = "Du er broke as fuccc";
  const base = lobbyDef([]);
  const def: RoomDef = { ...base, furni: [{ id: "bed", kind: "bed", x: 5, y: 7, dir: 2 }] };
  const scene = await basementScene(def, { x: iso(5.8, 7.6).x, y: iso(5.8, 7.6).y - 10 }, W, H, S, ["bed"]);
  const limg = (await renderAvatar({ figure: EMIL6, dir: 2, headDir: 2, actions: ["lay"], gesture: "std", frame: 0 }))!;
  const SIXTY = FIGURES["6ixty"];
  const path: Array<[number, number]> = [[0, 12], [1, 11], [2, 10], [3, 9], [4, 9], [5, 9]]; // in from the left corner, along the floor to the bed's side
  const STEP = 480; // ms per tile (the game's walking speed)
  const dirOf = (dx: number, dy: number): number => ({ "0,-1": 0, "1,-1": 1, "1,0": 2, "1,1": 3, "0,1": 4, "-1,1": 5, "-1,0": 6, "-1,-1": 7 } as Record<string, number>)[`${Math.sign(dx)},${Math.sign(dy)}`] ?? 0;
  const T_SLEEP = 2.4, T_WALK = ((path.length - 1) * STEP) / 1000, T_TURN = 0.6, T_TALK = 3.4, T_END = 1.2;
  const total = Math.round((T_SLEEP + T_WALK + T_TURN + T_TALK + T_END) * FPS);
  const glyphs: Array<{ born: number; ox: number }> = [];
  let last = -1e9, n = 0;
  const bubble = (g: CanvasRenderingContext2D, text: string, name: string, cx: number, bottomY: number, alpha: number): void => {
    const font = `${Math.round(12 * S)}px Verdana, 'Apple Color Emoji', sans-serif`;
    g.save();
    g.font = font;
    const lh = 15 * S;
    const nameW = (g.font = `bold ${font}`, g.measureText(name).width);
    g.font = font;
    const boxW = Math.max(g.measureText(text).width + 18 * S, nameW + 18 * S);
    const boxH = 2 * lh + 8 * S;
    const x = cx - boxW / 2, y = bottomY - boxH - 8 * S;
    g.globalAlpha = alpha;
    g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = S;
    g.beginPath(); g.roundRect(x, y, boxW, boxH, 8 * S); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 5 * S, y + boxH); g.lineTo(cx, y + boxH + 7 * S); g.lineTo(cx + 5 * S, y + boxH); g.fill();
    g.fillStyle = "#111"; g.textBaseline = "top";
    g.font = `bold ${font}`; g.fillText(name, x + 9 * S, y + 5 * S);
    g.font = font; g.fillText(text, x + 9 * S, y + 5 * S + lh);
    g.restore();
  };
  for (let i = 0; i < total; i++) {
    const t = i / FPS, ms = t * 1000;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(scene.bg, 0, 0);
    // emil6, asleep on the bed, zzz every 1.1 s
    const f = scene.feetOf(5, 7);
    g.drawImage(limg, f.x + (LAY_DX - padOf(limg).x) * S, f.y + (LAY_DY - padOf(limg).y) * S, limg.width * S, limg.height * S);
    if (ms - last > 1100) { last = ms; glyphs.push({ born: ms, ox: 10 + (Math.random() - 0.5) * 16 }); }
    // 6ixty
    const tWalk = t - T_SLEEP, tTalk = t - T_SLEEP - T_WALK - T_TURN;
    if (tWalk >= 0) {
      const steps = (tWalk * 1000) / STEP;
      const i0 = Math.min(path.length - 1, Math.floor(steps)), i1 = Math.min(path.length - 1, i0 + 1), fr = Math.min(1, steps - i0);
      const pos = { x: path[i0][0] + (path[i1][0] - path[i0][0]) * fr, y: path[i0][1] + (path[i1][1] - path[i0][1]) * fr };
      const walking = steps < path.length - 1;
      const dir = walking ? dirOf(path[i1][0] - path[i0][0], path[i1][1] - path[i0][1]) : tTalk >= -0.05 ? 0 : 1; // a beat to turn towards the bed
      const talking = tTalk >= 0 && tTalk < T_TALK;
      const img = (await renderAvatar({ figure: SIXTY, dir, headDir: dir, actions: [walking ? "wlk" : "std"], gesture: talking ? "spk" : "std", frame: walking ? Math.floor((tWalk * 1000) / (STEP / 4)) % 4 : talking ? Math.floor(ms / 140) % 2 : 0 }))!;
      const sf = scene.feetOf(pos.x, pos.y);
      g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(sf.x, sf.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(img, sf.x - (32 + padOf(img).x) * S, sf.y - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
      if (talking) bubble(g, LINE, "6ixty", sf.x, sf.y - (FEET_Y + 4) * S, Math.min(1, tTalk / 0.15, (T_TALK - tTalk) / 0.3));
    }
    g.save();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `${Math.round(20 * S)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    for (let q = glyphs.length - 1; q >= 0; q--) {
      const gl = glyphs[q], age = ms - gl.born;
      if (age > 1900) { glyphs.splice(q, 1); continue; }
      g.globalAlpha = Math.max(0, 1 - age / 1900);
      g.fillText("💤", f.x + 40 * S + gl.ox * S, f.y - 34 * S - age * 0.035 * S);
    }
    g.restore();
    await save(`${OUT}/frames/frame-${String(n++).padStart(3, "0")}.png`, c);
  }
  say(`emil6 + 6ixty done: ${n} frames at ${FPS} fps`);
}

/** emil6 changes one piece at a time (shoes, trousers, top, jacket, chest piece, belt, hair, hat, the face piece comes off) until he looks like emil */
async function emil6ToEmil(): Promise<void> {
  const S = 6, W = 700, H = 760, FPS = 30, OUT = "animation-emil6-to-emil";
  const feet = { x: W / 2, y: H - 70 };
  const part = (fig: string, type: string): string | undefined => fig.split(".").find((p) => p.split("-")[0] === type);
  const from = EMIL6, to = FIGURES.emil;
  // each change: the part type and what it becomes (nothing = taken off), in the order they happen
  const order = ["sh", "lg", "ch", "cc", "ca", "wa", "hr", "ha", "fa"];
  const stages: string[] = [from];
  let cur = from.split(".");
  const names: string[] = [];
  for (const t of order) {
    const a = part(from, t), b = part(to, t);
    if (a === b) continue;
    cur = cur.filter((p) => p.split("-")[0] !== t);
    if (b) cur.push(b);
    // keep the order of the figure string the way the game writes it
    const rank = ["hd", "hr", "ha", "he", "ea", "fa", "ch", "cc", "cp", "ca", "lg", "sh", "wa"];
    cur.sort((x, y) => rank.indexOf(x.split("-")[0]) - rank.indexOf(y.split("-")[0]));
    stages.push(cur.join("."));
    names.push(t);
  }
  const imgs: HTMLCanvasElement[] = [];
  for (const fig of stages) imgs.push((await renderAvatar({ figure: fig, dir: 3, headDir: 3, actions: ["std"], gesture: "std", frame: 0 }))!);
  const draw = (g: CanvasRenderingContext2D, img: HTMLCanvasElement, dy: number, flash: number): void => {
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(feet.x, feet.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill();
    let pic = img;
    if (flash > 0.02) { // a quick white flash as each piece changes
      pic = document.createElement("canvas"); pic.width = img.width; pic.height = img.height;
      const x = pic.getContext("2d")!; x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-atop"; x.fillStyle = `rgba(255,255,255,${flash})`; x.fillRect(0, 0, pic.width, pic.height);
    }
    g.drawImage(pic, feet.x - (32 + padOf(img).x) * S, feet.y + dy - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
  };
  let n = 0;
  const out = async (c: HTMLCanvasElement): Promise<void> => { await save(`${OUT}/frames/frame-${String(n++).padStart(3, "0")}.png`, c); };
  const blank = (): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } => { const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!; g.imageSmoothingEnabled = false; return { c, g }; };
  for (let i = 0; i < 18; i++) { const { c, g } = blank(); draw(g, imgs[0], 0, 0); await out(c); } // emil6 as he is
  const PER = 11;
  for (let k = 1; k < imgs.length; k++) {
    for (let i = 0; i < PER; i++) { // the piece changes: a hop and a flash, then a short pause
      const { c, g } = blank();
      const hop = i < 6 ? Math.sin((i / 6) * Math.PI) * 5 * S : 0;
      draw(g, i < 3 ? imgs[k - 1] : imgs[k], -hop, Math.max(0, 0.8 - Math.abs(i - 3) * 0.2));
      await out(c);
    }
  }
  for (let i = 0; i < 30; i++) { const { c, g } = blank(); draw(g, imgs[imgs.length - 1], 0, 0); await out(c); } // emil
  say(`emil6 to emil done: ${n} frames at ${FPS} fps, changes: ${names.join(", ")}`);
}

/** emil6 digs through the dumpster over and over; every time something turns up the game's "+1" blood pops up over his head */
async function emil6Dumpster(): Promise<void> {
  const W = 1100, H = 860, S = 4, FPS = 30, OUT = "animation-emil6-dumpster";
  const base = lobbyDef([]);
  const def: RoomDef = { ...base, furni: [
    { id: "d1", kind: "dumpster", x: 3, y: 0, dir: 4 },
    { id: "d2", kind: "dumpster", x: 5, y: 0, dir: 4 },
  ] };
  const scene = await basementScene(def, { x: iso(4.4, 1.2).x, y: iso(4.4, 1.2).y - 55 }, W, H, S, ["d1", "d2"]);
  const icon = await loadImage("/items/blood.svg");
  const img = (await renderAvatar({ figure: EMIL6, dir: 0, headDir: 0, actions: ["std"], gesture: "std", frame: 0 }))!;
  const CYCLE = 2.0, DIG = 0.9, CYCLES = 4; // seconds: digging, then the find
  const total = Math.round(CYCLE * CYCLES * FPS);
  const f = scene.feetOf(4, 1);
  for (let i = 0; i < total; i++) {
    const t = i / FPS;
    const k = Math.floor(t / CYCLE), local = t - k * CYCLE;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(scene.bg, 0, 0);
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(f.x, f.y, 16 * S, 7 * S, 0, 0, Math.PI * 2); g.fill();
    // rummaging: quick little dips towards the dumpster while he digs, standing still the rest of the time
    const dig = local < DIG ? Math.abs(Math.sin((local / DIG) * Math.PI * 3)) : 0;
    g.drawImage(img, f.x + dig * 2.5 * S - (32 + padOf(img).x) * S, f.y - dig * 3 * S - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
    // the "+1" over his head, for every find
    for (let q = 0; q <= k; q++) bloodPop(g, icon, "+1", f.x, f.y - 78 * S, (t - (q * CYCLE + DIG)) * 1000, S, 1100);
    await save(`${OUT}/frames/frame-${String(i).padStart(3, "0")}.png`, c);
  }
  say(`emil6 dumpster done: ${total} frames at ${FPS} fps`);
}

async function spinAll(): Promise<void> {
  const accounts: Array<[string, string]> = [
    ["Emil", FIGURES.emil], ["bootyshaker", FIGURES.bootyshaker],
    ["Emil2", "hd-180-1369.hr-98095-40.ch-98049-83.lg-98126.sh-908-1320"],
    ["Emil3", "hd-190-1.hr-98093-9002.he-98089-1408.fa-98060-80.ch-98047-64.cc-98025-81.lg-98120-9002.sh-98134-1408"],
    ["emoney6", "hd-200-10.hr-98108-45.ea-98055-1408.ch-98044-80.cc-98016-1408.lg-98118-1408.sh-98132-9001"],
    ["les", "hd-206-10.hr-98101-35.ea-98052-71.fa-1212.ch-98050-9001.ca-98008-1408.lg-98117-9001.sh-98137-9001"],
    ["les2", "hd-209-8.hr-115-34.ch-807-9004.lg-98118-74.sh-98143"],
    ["6ixty", FIGURES["6ixty"]],
  ];
  const S = 6, W = 700, H = 760, FPS_PER_DIR = 4; // the game turns every 140 ms (4 frames at 30 fps)
  const SPIN = [2, 3, 4, 5, 6, 7, 0, 1];
  let n = 0;
  for (const [name, figure] of accounts) {
    for (const dir of SPIN) {
      const img = await renderAvatar({ figure, dir, headDir: dir, actions: ["std"], gesture: "std", frame: 0 });
      if (!img) continue;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d")!;
      g.imageSmoothingEnabled = false;
      const feet = { x: W / 2, y: H - 80 };
      g.drawImage(img, feet.x - (32 + padOf(img).x) * S, feet.y - (FEET_Y + padOf(img).y) * S, img.width * S, img.height * S);
      for (let r = 0; r < FPS_PER_DIR; r++) await save(`animation-spin-all-accounts/frames/frame-${String(n++).padStart(3, "0")}.png`, c);
    }
    say("spun " + name);
  }
  say(`spin done: ${n} frames at 30 fps`);
}

(async () => {
  try {
    await avatarsReady;
    await Promise.all([loadBundledDesigns(), loadStarterDesigns(), loadShopDesigns()]); // the game's own garments (the clothes the players wear)
    clearAvatarCache();
    say("avatar art and clothes ready");
    const only = new URLSearchParams(location.search).get("only"); // ?only=anim re-renders just the animation
    if (only === "newsheet") await newFurnitureSheet();
    else if (only === "room") await roomForBlender();
    else if (only === "lobby") await roomForBlender("lobby");
    else if (only === "jet") { await jetDressSmoke(); await jetSipLean(); }
    else if (only === "sip") await jetSipLean();
    else if (only === "blood") await bloodDrops();
    else if (only === "minus") await bloodMinusLoop();
    else if (only === "sell") await sellToSixty();
    else if (only === "spin") await spinAll();
    else if (only === "morph") await emil6ToEmil();
    else if (only === "dig") await emil6Dumpster();
    else if (only === "sixty") { loadEmojiFont(); await document.fonts.ready; await emil6Sixty(); }
    else if (only === "basement") { loadEmojiFont(); await document.fonts.ready; await bustedAndBroke(); await emil6Sleeping(); }
    else if (only === "weed") await weedGrowth();
    else if (only === "anim") await stabAnimation();
    else { await furniture(); await icons(); await avatars(); await stabAnimation(); }
    say("ALL DONE");
    document.title = "export done";
  } catch (e) { say("ERROR: " + (e as Error).message); document.title = "export error"; }
})();
