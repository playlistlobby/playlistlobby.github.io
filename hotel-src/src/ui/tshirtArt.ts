// The pictures of the t-shirt shop: the two designs the admin can change, and the player's own character (with their name over its head) on a blank shirt.
// The shirt pictures are see-through 1500x1500 pictures (public/tshirt/ holds them at 900x900); the character on the third one is twice the size of the characters on design A
// (they are drawn at scale 3.37), looking the same way (facing 2), with the name over its head.
import { get, ref, remove, set } from "firebase/database";
import { db } from "../firebase";
import { assetUrl } from "../assetUrl";
import { renderAvatar } from "../avatarService";
import type { TshirtDesign } from "../shared/tshirt";

/** the mockup's size, and where the middle character of design A stands in it (centre x, the line its feet are on) */
const MOCK = 1500, CHAR_X = 751, CHAR_FEET_Y = 1010, CHAR_SCALE = 3.37 * 2, CHAR_DIR = 2, NAME_GAP = 26, NAME_PX = 44;

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("no " + src)); i.src = src; });

const DEFAULTS: Record<"a" | "b", string> = { a: assetUrl("tshirt/design-a.png"), b: assetUrl("tshirt/design-b.png") };
export const BLANK_URL = assetUrl("tshirt/blank.png");

/** what the admin uploaded for design A or B (a picture as a data address), or null while the original is in use */
export async function uploadedDesign(id: "a" | "b"): Promise<string | null> {
  try { const v = (await get(ref(db, `tshirtDesigns/${id}`))).val(); return typeof v === "string" && v.startsWith("data:image/") ? v : null; } catch { return null; }
}
/** the picture to show for design A or B */
export async function designPicture(id: "a" | "b"): Promise<string> { return (await uploadedDesign(id)) ?? DEFAULTS[id]; }

/** The admin changes a design's picture: it is cut down to 1000 pixels and stored as it is (everybody sees the new one the next time they open the shop). */
export async function uploadDesign(id: "a" | "b", file: File): Promise<void> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Use a PNG, JPG or WebP picture.");
  const img = await loadImage(URL.createObjectURL(file));
  const k = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0, c.width, c.height);
  let url = c.toDataURL("image/png");
  if (url.length > 1_100_000) url = c.toDataURL("image/webp", 0.92);
  if (url.length > 1_150_000) throw new Error("That picture is too big even after shrinking it. Try a smaller one.");
  await set(ref(db, `tshirtDesigns/${id}`), url);
}
/** the admin puts the original picture back */
export const resetDesign = (id: "a" | "b"): Promise<void> => remove(ref(db, `tshirtDesigns/${id}`));

/** the part of a picture that is drawn on (a box around everything that isn't see-through) */
function inkBox(c: HTMLCanvasElement): { x0: number; y0: number; x1: number; y1: number } | null {
  const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** the name as it is printed over the character's head: the game's name font, red, pixelated a little (drawn small, every pixel made solid, then blown up) */
function drawName(g: CanvasRenderingContext2D, name: string, cx: number, baseline: number, px: number): void {
  const cell = Math.max(1, px / 12); // (one name pixel: the letters are about 12 of them tall)
  const font = (n: number): string => `${Math.max(6, Math.round(n))}px Verdana, 'Apple Color Emoji', sans-serif`;
  const small = document.createElement("canvas");
  const sg = small.getContext("2d", { willReadFrequently: true })!;
  const fpx = px / cell; // (the font size in name pixels)
  sg.font = font(fpx);
  const maxW = (px * 14.5) / cell;
  const w = Math.min(Math.ceil(sg.measureText(name).width) + 2, Math.ceil(maxW) + 2);
  const h = Math.ceil(fpx * 1.5);
  small.width = w; small.height = h;
  sg.font = font(fpx);
  sg.textBaseline = "alphabetic";
  sg.textAlign = "center";
  sg.fillStyle = "#d01f2b";
  sg.fillText(name, w / 2, Math.round(fpx * 1.1), Math.max(1, w - 2));
  const img = sg.getImageData(0, 0, w, h); // (no soft edges: a pixel is either there or not)
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
  sg.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(small, cx - (w * cell) / 2, baseline - Math.round(fpx * 1.1) * cell, w * cell, h * cell);
  g.restore();
}

/** the player's character on the blank shirt: twice the size of the characters on design A, in the middle of the chest, with the player's name over its head */
export async function customShirt(figure: string, name: string, size = 900): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(await loadImage(BLANK_URL), 0, 0, size, size);
  const av = await renderAvatar({ figure, dir: CHAR_DIR, headDir: CHAR_DIR, actions: ["std"], gesture: "std", frame: 0 });
  const box = av ? inkBox(av) : null;
  if (av && box) {
    const k = (CHAR_SCALE * size) / MOCK;
    const x = (CHAR_X * size) / MOCK - ((box.x0 + box.x1 + 1) / 2) * k;
    const y = (CHAR_FEET_Y * size) / MOCK - (box.y1 + 1) * k;
    g.drawImage(av, x, y, av.width * k, av.height * k);
    if (name) drawName(g, name, (CHAR_X * size) / MOCK, y + box.y0 * k - (NAME_GAP * size) / MOCK, (NAME_PX * size) / MOCK); // (just over the top of the head)
  }
  return c;
}

/** the character alone, big and see-through, to print from (the admin saves it from the order list) */
export async function printFile(figure: string, name = "", k = 14): Promise<HTMLCanvasElement | null> {
  const av = await renderAvatar({ figure, dir: CHAR_DIR, headDir: CHAR_DIR, actions: ["std"], gesture: "std", frame: 0 });
  if (!av) return null;
  const box = inkBox(av);
  if (!box) return null;
  const w = (box.x1 - box.x0 + 1) * k, h = (box.y1 - box.y0 + 1) * k;
  const px = Math.round(NAME_PX * (k / CHAR_SCALE)); // (the name is the same size over the character as on the shirt)
  const gap = Math.round(NAME_GAP * (k / CHAR_SCALE));
  const top = name ? Math.round(px + gap) : 0; // (room for the name over the head)
  const textW = name ? Math.min(px * 14.5, px * name.length * 0.7) : 0;
  const c = document.createElement("canvas");
  c.width = Math.ceil(Math.max(w, textW) + k * 4); c.height = Math.ceil(top + h + k * 2);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(av, box.x0, box.y0, box.x1 - box.x0 + 1, box.y1 - box.y0 + 1, (c.width - w) / 2, top, w, h);
  if (name) drawName(g, name, c.width / 2, top - gap, px);
  return c;
}

export const designLabel = (d: TshirtDesign | string | undefined): string => (d === "a" ? "6 mafia" : d === "b" ? "trykker bands" : d === "me" ? "custom" : "?");
