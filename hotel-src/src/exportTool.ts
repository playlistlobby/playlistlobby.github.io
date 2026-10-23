// Dev tool (export.html): renders the game's own art as transparent PNGs for the ad and saves them through scripts/export-server.mjs.
// Furniture sprites (pots, weed, shrooms, mixers, ...), the item icons, the avatars (6ixty, Emil, bootyshaker) and a frame-by-frame animation of Emil stabbing bootyshaker.
import { avatarsReady, clearAvatarCache, renderAvatar } from "./avatarService";
import { loadBundledDesigns, loadShopDesigns, loadStarterDesigns } from "./designs";
import { derive, loadNitro, spritesFor, type NitroFurni } from "./nitro";
import { FURNI_KINDS } from "./rooms";
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
function composite(layers: Layer[], k: number): HTMLCanvasElement {
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
  return trimmed(c);
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
  for (const [stage, grow] of [["seedling", 0.34], ["growing", 0.67], ["ready", 1]] as Array<[string, number]>) {
    await save(`weed/weed-in-pot-${stage}.png`, composite([pot, { n: foliage, dir: 2, nudge: place(foliage, 0.64), grow }], K));
    await save(`shrooms/shrooms-in-pot-${stage}.png`, composite([pot, { n: shrooms, dir: 2, nudge: place(shrooms, 0.95), grow }], K));
  }
  await save("weed/weed-plant-only.png", composite([{ n: foliage, dir: 2 }], K));
  say("furniture done");
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
  const booty = (await renderAvatar({ figure: FIGURES.bootyshaker, dir: 6, headDir: 6, actions: ["std"], gesture: "std", frame: 0 }))!;
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
      g.fillStyle = "#fff"; g.font = `bold ${Math.round(13 * S)}px Verdana, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("0", sx, sy + S);
      g.restore();
    }
    frames.push(c);
  }
  for (let i = 0; i < frames.length; i++) await save(`animation-emil-stabs-bootyshaker/frames/frame-${String(i).padStart(3, "0")}.png`, frames[i]);
  say(`animation done: ${frames.length} frames at ${FPS} fps`);
}

(async () => {
  try {
    await avatarsReady;
    await Promise.all([loadBundledDesigns(), loadStarterDesigns(), loadShopDesigns()]); // the game's own garments (the clothes the players wear)
    clearAvatarCache();
    say("avatar art and clothes ready");
    const only = new URLSearchParams(location.search).get("only"); // ?only=anim re-renders just the animation
    if (!only) { await furniture(); await icons(); await avatars(); }
    await stabAnimation();
    say("ALL DONE");
    document.title = "export done";
  } catch (e) { say("ERROR: " + (e as Error).message); document.title = "export error"; }
})();
