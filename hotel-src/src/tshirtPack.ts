// Dev tool (tshirt-pack.html): renders the game's own art as big transparent PNGs for the t-shirt designs and saves them through scripts/export-server.mjs.
// The NPCs facing all eight ways, the blood and knife icons, the body bag, the mixer, the growing-kit pot, and the roulette table with its chairs (with 6ixty and bagmand sitting at it).
import { avatarsReady, clearAvatarCache, renderAvatar } from "./avatarService";
import { loadBundledDesigns, loadShopDesigns, loadStarterDesigns, watchDesigns } from "./designs";
import { loadCatalog } from "./catalog";
import { auth } from "./firebase";
import { directionsOf, loadNitro, spritesFor, type NitroFurni } from "./nitro";
import { FURNI_KINDS } from "./rooms";
import { drawNitroFurni, iso, TILE_H } from "./roomRender";
import { BAGMAN, LANDLORD, PET_MERCHANT, sixtyLook } from "./npc";
import { ITEMS, BLOOD_ICON } from "./items";

const log = document.getElementById("log")!;
const say = (m: string): void => { log.textContent += "\n" + m; };
const SAVE = "http://127.0.0.1:8799/save?path=";
const FEET_Y = 94;
const K_AVATAR = 8, K_FURNI = 8, K_ICON = 16;

async function save(rel: string, c: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
  const r = await fetch(SAVE + encodeURIComponent(rel).replace(/%2F/g, "/"), { method: "POST", body: blob });
  if (!r.ok) throw new Error("save failed: " + rel);
}

function trimmed(c: HTMLCanvasElement, pad = 8): HTMLCanvasElement {
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

function scaled(src: CanvasImageSource & { width: number; height: number }, k: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width * k; c.height = src.height * k;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return trimmed(c);
}

/** one furniture piece facing one way, without its floor shadow, at art scale k */
function piece(n: NitroFurni, dir: number, k: number): HTMLCanvasElement {
  const items = spritesFor(n, dir).filter((s) => !s.isShadow && s.sw > 2 && s.sh > 2);
  const x0 = Math.min(...items.map((s) => s.dx)), y0 = Math.min(...items.map((s) => s.dy));
  const x1 = Math.max(...items.map((s) => s.dx + s.sw)), y1 = Math.max(...items.map((s) => s.dy + s.sh));
  const c = document.createElement("canvas");
  c.width = Math.ceil((x1 - x0) * k); c.height = Math.ceil((y1 - y0) * k);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  for (const s of items) {
    const px = (s.dx - x0) * k, py = (s.dy - y0) * k;
    if (s.flipH) { g.save(); g.translate(px + s.sw * k, py); g.scale(-1, 1); g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, 0, 0, s.sw * k, s.sh * k); g.restore(); }
    else g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py, s.sw * k, s.sh * k);
  }
  return trimmed(c);
}

const needNitro = async (path: string): Promise<NitroFurni> => { const n = await loadNitro(path); if (!n) throw new Error("missing " + path); return n; };
const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("no " + src)); i.src = src; });
const padOf = (c: HTMLCanvasElement): { x: number; y: number } => ({ x: (c as unknown as { padL?: number }).padL || 0, y: (c as unknown as { padT?: number }).padT || 0 });

const NPCS: Array<[string, string]> = [
  ["6ixty", sixtyLook().figure],
  ["landlord", LANDLORD.figure],
  ["bagmand", BAGMAN.figure],
  ["pets-bih", PET_MERCHANT.figure],
];

async function npcs(): Promise<void> {
  for (const [name, figure] of NPCS) {
    for (let dir = 0; dir < 8; dir++) {
      const c = await renderAvatar({ figure, dir, headDir: dir, actions: ["std"], gesture: "std", frame: 0 });
      if (c) await save(`npcs/${name}/${name}-dir${dir}.png`, scaled(c, K_AVATAR));
    }
  }
  say("npcs done");
}

async function icons(): Promise<void> {
  const list: Array<[string, string]> = [["blood-icon", BLOOD_ICON], ["knife-icon", (ITEMS as Record<string, { icon: string }>).knife.icon]];
  for (const [name, src] of list) {
    const img = await loadImage(src);
    const k = img.naturalWidth <= 40 ? K_ICON : 2; // the icons are 32x32 pixel art
    await save(`icons/${name}.png`, scaled(img, k));
  }
  say("icons done");
}

const bodyBagKind = (): string => Object.values(FURNI_KINDS).find((k) => /bodybag/.test(k.id) && k.nitro)?.nitro ?? "furni/f_bodybag.nitro";

async function furniture(): Promise<void> {
  const list: Array<[string, string]> = [
    ["body-bag", bodyBagKind()], ["mixer", FURNI_KINDS.f_mixer.nitro!], ["growth-kit-pot", FURNI_KINDS.f_planter.nitro!],
    ["roulette-table", FURNI_KINDS.rtable.nitro!], ["roulette-chair", FURNI_KINDS.rchair.nitro!],
  ];
  for (const [name, path] of list) {
    const n = await needNitro(path);
    for (const dir of directionsOf(n)) await save(`furniture/${name}-dir${dir}.png`, piece(n, dir, K_FURNI));
  }
  say("furniture done");
}

/** the roulette table with its two chairs, set up like the basement (table 0,16 facing 2; chairs 0,15 facing 4 and 0,18 facing 0), with 6ixty and bagmand sitting if `sitters` */
async function rouletteScene(sitters: boolean): Promise<void> {
  const S = K_FURNI;
  const W = 3600, Hh = 3600;
  const c = document.createElement("canvas");
  c.width = W; c.height = Hh;
  const g = c.getContext("2d")!;
  const mid = iso(0.5, 17);
  const toScreen = (p: { x: number; y: number }): { x: number; y: number } => ({ x: W / 2 + (p.x - mid.x) * S, y: Hh / 2 + (p.y - mid.y) * S });
  const seats = [{ x: 0, y: 15, dir: 4, who: sixtyLook().figure }, { x: 0, y: 18, dir: 0, who: BAGMAN.figure }];
  const sit = async (s: (typeof seats)[number]): Promise<void> => {
    const img = await renderAvatar({ figure: s.who, dir: s.dir, headDir: s.dir, actions: ["sit"], gesture: "std", frame: 0 });
    if (!img) return;
    const w = iso(s.x, s.y);
    const feet = toScreen({ x: w.x, y: w.y + TILE_H / 2 });
    const ax = feet.x - (32 + padOf(img).x) * S, ay = feet.y - 14 * S - (FEET_Y + padOf(img).y) * S; // (14: the height of the seat)
    g.imageSmoothingEnabled = false;
    g.drawImage(img, ax, ay, img.width * S, img.height * S);
  };
  drawNitroFurni(g, "rchair", seats[0].x, seats[0].y, seats[0].dir, toScreen, S, 1, true, undefined, "back");
  if (sitters) await sit(seats[0]);
  drawNitroFurni(g, "rchair", seats[0].x, seats[0].y, seats[0].dir, toScreen, S, 1, true, undefined, "front");
  drawNitroFurni(g, "rtable", 0, 16, 2, toScreen, S, 1, true);
  drawNitroFurni(g, "rchair", seats[1].x, seats[1].y, seats[1].dir, toScreen, S, 1, true, undefined, "back");
  if (sitters) await sit(seats[1]);
  drawNitroFurni(g, "rchair", seats[1].x, seats[1].y, seats[1].dir, toScreen, S, 1, true, undefined, "front");
  await save(sitters ? "roulette/roulette-table-with-6ixty-and-bagmand.png" : "roulette/roulette-table-and-chairs.png", trimmed(c));
}

(async () => {
  try {
    await avatarsReady;
    await Promise.all([loadCatalog(), loadBundledDesigns(), loadStarterDesigns(), loadShopDesigns()]);
    await auth.authStateReady(); // (the clothes players made are in the database: needs the login the game page already has)
    await watchDesigns(true).ready;
    clearAvatarCache();
    await Promise.all([FURNI_KINDS.rtable.nitro!, FURNI_KINDS.rchair.nitro!].map((p) => needNitro(p)));
    say("avatar art and clothes ready");
    await npcs();
    await icons();
    await furniture();
    await rouletteScene(false);
    await rouletteScene(true);
    say("ALL DONE");
    document.title = "export done";
  } catch (e) { say("ERROR: " + (e as Error).message); document.title = "export error"; }
})();
