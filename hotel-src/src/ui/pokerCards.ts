// The playing cards and chips of the poker table, drawn in pixels like the rest of the game (no pictures: they are painted on tiny canvases and shown big with
// crisp edges). A classic deck: cream cards with a dark outline, red and black suits, the rank in two corners, pips for 2 to 10, a framed court for J Q K, a big
// suit on the ace. The back is the game's dark red with a blood drop.
import { rankOf, suitOf } from "../shared/poker";

export const CARD_W = 30;
export const CARD_H = 46;

const RED = "#c2202c", BLACK = "#1b1b24", CREAM = "#f6f2e4", SHADE = "#dcd6c2", EDGE = "#25232b", GOLD = "#e6c35a", GOLD_D = "#a8832a";

// 3x5 letters and numbers
const FONT: Record<string, string[]> = {
  "0": ["010", "101", "101", "101", "010"], "1": ["010", "110", "010", "010", "111"], "2": ["110", "001", "010", "100", "111"], "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "110", "001", "110"], "6": ["011", "100", "110", "101", "010"], "7": ["111", "001", "010", "010", "010"],
  "8": ["010", "101", "010", "101", "010"], "9": ["010", "101", "011", "001", "110"],
  A: ["010", "101", "111", "101", "101"], J: ["001", "001", "001", "101", "010"], Q: ["010", "101", "101", "110", "011"], K: ["101", "101", "110", "101", "101"],
};
// the four suits: 5x5 for the corners and the pips, 7x7 for the aces
const SUIT5: string[][] = [
  ["00100", "01110", "11111", "11111", "01010"], // spade
  ["01010", "11111", "11111", "01110", "00100"], // heart
  ["00100", "01110", "11111", "01110", "00100"], // diamond
  ["01110", "01110", "10101", "11111", "00100"], // club
];
const SUIT7: string[][] = [
  ["0001000", "0011100", "0111110", "1111111", "1111111", "0001000", "0011100"],
  ["0110110", "1111111", "1111111", "1111111", "0111110", "0011100", "0001000"],
  ["0001000", "0011100", "0111110", "1111111", "0111110", "0011100", "0001000"],
  ["0011100", "0111110", "0011100", "1101011", "1111111", "0001000", "0011100"],
];
const isRed = (suit: number): boolean => suit === 1 || suit === 2;

type Ctx = CanvasRenderingContext2D;
const px = (g: Ctx, x: number, y: number, w: number, h: number, c: string): void => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function bitmap(g: Ctx, rows: string[], x: number, y: number, c: string, s = 1): void {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === "1") px(g, x + i * s, y + j * s, s, s, c); });
}
function word(g: Ctx, text: string, x: number, y: number, c: string, s = 1): number {
  let cx = x;
  for (const ch of text) { bitmap(g, FONT[ch], cx, y, c, s); cx += 4 * s; }
  return cx - x - s;
}

function blank(w = CARD_W, h = CARD_H): { c: HTMLCanvasElement; g: Ctx } {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}
/** the outline of a card: cut corners, a dark edge, a light inside with a little shade at the bottom */
function body(g: Ctx, fill: string, shade: string): void {
  const w = CARD_W, h = CARD_H;
  px(g, 1, 0, w - 2, h, EDGE); px(g, 0, 1, w, h - 2, EDGE);
  px(g, 2, 1, w - 4, h - 2, fill); px(g, 1, 2, w - 2, h - 4, fill);
  px(g, 2, h - 3, w - 4, 2, shade); px(g, 1, h - 4, w - 2, 1, shade);
}

const cache = new Map<string, string>();
const url = (key: string, make: () => HTMLCanvasElement): string => { let u = cache.get(key); if (!u) { u = make().toDataURL(); cache.set(key, u); } return u; };

/** a card (0..51) as a picture address */
export function cardUrl(card: number): string {
  return url(`c${card}`, () => {
    const { c, g } = blank();
    const rank = rankOf(card), suit = suitOf(card);
    const ink = isRed(suit) ? RED : BLACK;
    body(g, CREAM, SHADE);
    const name = rank === 8 ? "10" : rank === 12 ? "A" : rank === 11 ? "K" : rank === 10 ? "Q" : rank === 9 ? "J" : String(rank + 2);
    // the corners: the rank and a small suit, and the same turned upside down in the opposite corner
    const corner = (g2: Ctx): void => { const w = word(g2, name, 2, 3, ink); bitmap(g2, SUIT5[suit], 2 + Math.max(0, Math.floor((w - 5) / 2)), 9, ink); };
    corner(g);
    const { c: tmp, g: tg } = blank();
    corner(tg);
    g.save(); g.translate(CARD_W, CARD_H); g.rotate(Math.PI); g.drawImage(tmp, 0, 0); g.restore();
    const cx = 15, pip = (col: number, row: number): void => { // a pip on the 3 x 5 grid in the middle of the card
      const x = col === 0 ? 7 : col === 1 ? 12 : 18, y = Math.round(9 + row * 7);
      bitmap(g, SUIT5[suit], x, y, ink);
    };
    const L = 0, C = 1, R = 2;
    const layouts: Record<number, Array<[number, number]>> = {
      0: [[C, 0], [C, 4]], 1: [[C, 0], [C, 2], [C, 4]], 2: [[L, 0], [R, 0], [L, 4], [R, 4]], 3: [[L, 0], [R, 0], [C, 2], [L, 4], [R, 4]],
      4: [[L, 0], [R, 0], [L, 2], [R, 2], [L, 4], [R, 4]], 5: [[L, 0], [R, 0], [C, 1], [L, 2], [R, 2], [L, 4], [R, 4]],
      6: [[L, 0], [R, 0], [C, 1], [L, 2], [R, 2], [C, 3], [L, 4], [R, 4]], 7: [[L, 0], [R, 0], [L, 1], [R, 1], [C, 2], [L, 3], [R, 3], [L, 4], [R, 4]],
      8: [[L, 0], [R, 0], [L, 1], [R, 1], [C, 0.5], [L, 3], [R, 3], [C, 3.5], [L, 4], [R, 4]],
    };
    if (rank <= 8) for (const [col, row] of layouts[rank]) pip(col, row);
    else if (rank === 12) bitmap(g, SUIT7[suit], cx - 7, 17, ink, 2);
    else { // the court: a golden frame with the letter, a crown (K Q) or a feather cap (J), and the suit
      px(g, 7, 9, 16, 28, GOLD_D); px(g, 8, 10, 14, 26, "#f3e2a2"); px(g, 9, 11, 12, 24, "#f8edc2");
      const letter = name;
      if (rank === 11) { px(g, 10, 12, 10, 4, GOLD); px(g, 10, 11, 2, 2, GOLD); px(g, 14, 10, 2, 3, GOLD); px(g, 18, 11, 2, 2, GOLD); px(g, 10, 15, 10, 1, GOLD_D); } // the king's crown
      else if (rank === 10) { px(g, 11, 12, 8, 3, GOLD); px(g, 11, 11, 1, 2, GOLD); px(g, 14, 10, 2, 3, GOLD); px(g, 18, 11, 1, 2, GOLD); px(g, 12, 15, 6, 1, GOLD_D); px(g, 13, 13, 1, 1, "#d23a4a"); px(g, 16, 13, 1, 1, "#d23a4a"); } // the queen's tiara
      else { px(g, 10, 13, 9, 2, ink); px(g, 17, 10, 3, 5, ink); px(g, 19, 9, 2, 3, isRed(suit) ? "#ff7a82" : "#6c6c80"); } // the jack's cap and feather
      bitmap(g, FONT[letter], 12, 18, ink, 2);
      bitmap(g, SUIT5[suit], 13, 30, ink);
    }
    return c;
  });
}

/** the back of a card: dark red with a lighter lattice, a cream border and a blood drop */
export function cardBackUrl(): string {
  return url("back", () => {
    const { c, g } = blank();
    body(g, "#f1e9d2", "#d6ccb0");
    px(g, 3, 3, CARD_W - 6, CARD_H - 6, "#6e1320");
    for (let y = 4; y < CARD_H - 4; y++) for (let x = 4; x < CARD_W - 4; x++) if ((x + y) % 4 === 0 || (x - y + 100) % 4 === 0) px(g, x, y, 1, 1, "#a32535");
    px(g, 6, 6, CARD_W - 12, CARD_H - 12, "#6e1320");
    px(g, 6, 6, CARD_W - 12, 1, "#e8d9b0"); px(g, 6, CARD_H - 7, CARD_W - 12, 1, "#e8d9b0"); px(g, 6, 6, 1, CARD_H - 12, "#e8d9b0"); px(g, CARD_W - 7, 6, 1, CARD_H - 12, "#e8d9b0");
    // the drop
    const drop = ["0001000", "0001000", "0011100", "0111110", "1111111", "1111111", "1111111", "0111110", "0011100"];
    bitmap(g, drop, 12, 17, "#f1e9d2");
    bitmap(g, ["0000000", "0000000", "0000000", "0001100", "0001000", "0000000", "0000000"], 12, 20, "#6e1320");
    return c;
  });
}

/** an empty spot for a card to land (the board before the flop) */
export function cardSlotUrl(): string {
  return url("slot", () => {
    const { c, g } = blank();
    g.globalAlpha = 0.55;
    for (let x = 2; x < CARD_W - 2; x += 3) { px(g, x, 1, 2, 1, "#9fd2a2"); px(g, x, CARD_H - 2, 2, 1, "#9fd2a2"); }
    for (let y = 2; y < CARD_H - 2; y += 3) { px(g, 1, y, 1, 2, "#9fd2a2"); px(g, CARD_W - 2, y, 1, 2, "#9fd2a2"); }
    return c;
  });
}

// ---- chips ---------------------------------------------------------------------------------------------------------------------------------------
export const CHIP_VALUES = [1000, 500, 100, 25, 10, 5, 1];
const CHIP_COLORS: Record<number, [string, string]> = { 1: ["#e8e8ee", "#8c8c9a"], 5: ["#d83a3a", "#7a1c1c"], 10: ["#3f7fe0", "#1b3f80"], 25: ["#3fb35a", "#1b6030"], 100: ["#2a2a34", "#0c0c12"], 500: ["#8a45c8", "#46206e"], 1000: ["#e6b93a", "#8a6410"] };
/** one chip seen from the side: 14 wide, 7 tall, the colour of its value */
export function chipUrl(value: number): string {
  return url(`chip${value}`, () => {
    const [main, dark] = CHIP_COLORS[value] ?? CHIP_COLORS[1];
    const { c, g } = blank(14, 8);
    px(g, 2, 1, 10, 6, dark); px(g, 1, 2, 12, 4, dark);
    px(g, 2, 1, 10, 4, main); px(g, 1, 2, 12, 2, main);
    px(g, 4, 2, 2, 1, "#ffffffcc"); px(g, 8, 2, 2, 1, "#ffffffcc"); // the stripes
    px(g, 3, 0, 8, 1, "#ffffff55");
    return c;
  });
}
/** which chips make an amount: the biggest first, a few of each, at most `max` in all (a pile, not a bank) */
export function chipsFor(amount: number, max = 7): number[] {
  const out: number[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const v of CHIP_VALUES) { let n = 0; while (left >= v && n < 3 && out.length < max) { out.push(v); left -= v; n++; } }
  while (left > 0 && out.length < max) { out.push(1); left--; }
  return out;
}
