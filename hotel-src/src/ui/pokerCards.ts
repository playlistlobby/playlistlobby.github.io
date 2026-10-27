// The playing cards and chips of the poker and blackjack tables. The cards are drawn sharp (a big canvas, real lettering, painted suits) so the rank and suit are easy to
// read even when they are small on a phone; the chips keep the pixel look of the rest of the game. A classic deck: cream cards with a thin outline, red and black suits,
// the rank in two corners, pips for 2 to 10, a framed court for J Q K, a big suit on the ace. The back is the game's dark red with a blood drop.
import { rankOf, suitOf } from "../shared/poker";

export const CARD_W = 30;
export const CARD_H = 46;
/** the cards are painted this many times bigger than their size on the table, so they stay sharp on every screen */
const S = 6;
const W = CARD_W * S, H = CARD_H * S;

const RED = "#c8202e", BLACK = "#1a1a22", CREAM = "#fbf8ee", EDGE = "#3a3844", GOLD = "#e6c35a", GOLD_D = "#a8832a";
const FONT_FACE = "'Arial Black', 'Helvetica Neue', Arial, Verdana, sans-serif";

const isRed = (suit: number): boolean => suit === 1 || suit === 2;

type Ctx = CanvasRenderingContext2D;
function px(g: Ctx, x: number, y: number, w: number, h: number, c: string): void { g.fillStyle = c; g.fillRect(x, y, w, h); }

/** a suit (0 spade, 1 heart, 2 diamond, 3 club) painted as a shape, centred on (cx, cy), `r` tall-ish */
function suitShape(g: Ctx, suit: number, cx: number, cy: number, r: number, color: string): void {
  g.save();
  g.translate(cx, cy);
  g.fillStyle = color;
  g.beginPath();
  if (suit === 1) { // heart
    g.moveTo(0, r * 0.95);
    g.bezierCurveTo(-r * 1.25, r * 0.15, -r * 1.1, -r * 0.95, 0, -r * 0.4);
    g.bezierCurveTo(r * 1.1, -r * 0.95, r * 1.25, r * 0.15, 0, r * 0.95);
  } else if (suit === 2) { // diamond
    g.moveTo(0, -r * 1.05); g.quadraticCurveTo(r * 0.25, -r * 0.35, r * 0.78, 0); g.quadraticCurveTo(r * 0.25, r * 0.35, 0, r * 1.05); g.quadraticCurveTo(-r * 0.25, r * 0.35, -r * 0.78, 0); g.quadraticCurveTo(-r * 0.25, -r * 0.35, 0, -r * 1.05);
  } else if (suit === 0) { // spade
    g.moveTo(0, -r * 1.0);
    g.bezierCurveTo(r * 0.2, -r * 0.55, r * 1.2, -r * 0.1, r * 1.0, r * 0.45);
    g.bezierCurveTo(r * 0.85, r * 0.9, r * 0.2, r * 0.85, r * 0.12, r * 0.55);
    g.lineTo(r * 0.3, r * 1.0); g.lineTo(-r * 0.3, r * 1.0); g.lineTo(-r * 0.12, r * 0.55);
    g.bezierCurveTo(-r * 0.2, r * 0.85, -r * 0.85, r * 0.9, -r * 1.0, r * 0.45);
    g.bezierCurveTo(-r * 1.2, -r * 0.1, -r * 0.2, -r * 0.55, 0, -r * 1.0);
  } else { // club: three round leaves and a stem
    g.arc(0, -r * 0.5, r * 0.5, 0, Math.PI * 2);
    g.moveTo(-r * 0.45 + r * 0.5, r * 0.18); g.arc(-r * 0.5, r * 0.18, r * 0.5, 0, Math.PI * 2);
    g.moveTo(r * 0.5 + r * 0.5, r * 0.18); g.arc(r * 0.5, r * 0.18, r * 0.5, 0, Math.PI * 2);
    g.moveTo(-r * 0.12, r * 0.1); g.lineTo(-r * 0.32, r * 1.0); g.lineTo(r * 0.32, r * 1.0); g.lineTo(r * 0.12, r * 0.1);
  }
  g.closePath();
  g.fill();
  g.restore();
}

function blank(w = W, h = H): { c: HTMLCanvasElement; g: Ctx } {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = true;
  return { c, g };
}
function roundRect(g: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** the outline of a card: round corners, a dark edge, a light inside */
function body(g: Ctx, fill: string): void {
  roundRect(g, 0.5 * S, 0.5 * S, W - S, H - S, 3 * S);
  g.fillStyle = EDGE; g.fill();
  roundRect(g, 1.3 * S, 1.3 * S, W - 2.6 * S, H - 2.6 * S, 2.4 * S);
  g.fillStyle = fill; g.fill();
}

const cache = new Map<string, string>();
const url = (key: string, make: () => HTMLCanvasElement): string => { let u = cache.get(key); if (!u) { u = make().toDataURL(); cache.set(key, u); } return u; };

/** a card (0..51) as a picture address */
export function cardUrl(card: number): string {
  return url(`c${card}`, () => {
    const { c, g } = blank();
    const rank = rankOf(card), suit = suitOf(card);
    const ink = isRed(suit) ? RED : BLACK;
    body(g, CREAM);
    const name = rank === 8 ? "10" : rank === 12 ? "A" : rank === 11 ? "K" : rank === 10 ? "Q" : rank === 9 ? "J" : String(rank + 2);
    // the corners: the rank and a small suit under it, and the same turned upside down in the opposite corner
    const corner = (): void => {
      g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.font = `bold ${(name.length > 1 ? 8.2 : 10) * S}px ${FONT_FACE}`;
      g.fillText(name, 5.6 * S, 11.4 * S, 8.6 * S);
      suitShape(g, suit, 5.6 * S, 15.6 * S, 2.7 * S, ink);
    };
    corner();
    g.save(); g.translate(W, H); g.rotate(Math.PI); corner(); g.restore();
    // pips on a 3 x 5 grid in the middle of the card
    const X = [10.2 * S, 15 * S, 19.8 * S], Y0 = 11 * S, DY = 5.9 * S;
    const pip = (col: number, row: number): void => {
      const flip = row > 2;
      g.save(); g.translate(X[col], Y0 + row * DY); if (flip) g.rotate(Math.PI);
      suitShape(g, suit, 0, 0, 2.9 * S, ink);
      g.restore();
    };
    const L = 0, C = 1, R = 2;
    const layouts: Record<number, Array<[number, number]>> = {
      0: [[C, 0], [C, 4]], 1: [[C, 0], [C, 2], [C, 4]], 2: [[L, 0], [R, 0], [L, 4], [R, 4]], 3: [[L, 0], [R, 0], [C, 2], [L, 4], [R, 4]],
      4: [[L, 0], [R, 0], [L, 2], [R, 2], [L, 4], [R, 4]], 5: [[L, 0], [R, 0], [C, 1], [L, 2], [R, 2], [L, 4], [R, 4]],
      6: [[L, 0], [R, 0], [C, 1], [L, 2], [R, 2], [C, 3], [L, 4], [R, 4]], 7: [[L, 0], [R, 0], [L, 1], [R, 1], [C, 2], [L, 3], [R, 3], [L, 4], [R, 4]],
      8: [[L, 0], [R, 0], [L, 1], [R, 1], [C, 0.5], [L, 3], [R, 3], [C, 3.5], [L, 4], [R, 4]],
    };
    if (rank <= 8) for (const [col, row] of layouts[rank]) pip(col, row);
    else if (rank === 12) suitShape(g, suit, 15 * S, 23 * S, 7.5 * S, ink);
    else { // the court: a golden frame with the letter, a crown (K Q) or a feather cap (J), and the suit
      roundRect(g, 8 * S, 8.5 * S, 14 * S, 29 * S, 1.6 * S); g.fillStyle = GOLD_D; g.fill();
      roundRect(g, 8.8 * S, 9.3 * S, 12.4 * S, 27.4 * S, 1.2 * S); g.fillStyle = "#f8edc2"; g.fill();
      if (rank === 11) { // the king's crown
        px(g, 10.5 * S, 12 * S, 9 * S, 3 * S, GOLD); px(g, 10.5 * S, 10.2 * S, 2 * S, 2.2 * S, GOLD); px(g, 14 * S, 9.4 * S, 2 * S, 3 * S, GOLD); px(g, 17.5 * S, 10.2 * S, 2 * S, 2.2 * S, GOLD); px(g, 10.5 * S, 14.6 * S, 9 * S, 0.7 * S, GOLD_D);
      } else if (rank === 10) { // the queen's tiara
        px(g, 11 * S, 12.2 * S, 8 * S, 2.6 * S, GOLD); px(g, 11 * S, 10.6 * S, 1.6 * S, 2 * S, GOLD); px(g, 14.2 * S, 9.8 * S, 1.6 * S, 2.8 * S, GOLD); px(g, 17.4 * S, 10.6 * S, 1.6 * S, 2 * S, GOLD);
        g.fillStyle = "#d23a4a"; g.beginPath(); g.arc(15 * S, 13.4 * S, 0.8 * S, 0, Math.PI * 2); g.fill();
      } else { // the jack's cap and feather
        px(g, 10 * S, 12.6 * S, 9 * S, 2 * S, ink); px(g, 16.6 * S, 9.6 * S, 3 * S, 5 * S, ink); px(g, 18.8 * S, 8.8 * S, 1.8 * S, 3 * S, isRed(suit) ? "#ff7a82" : "#6c6c80");
      }
      g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.font = `bold ${10 * S}px ${FONT_FACE}`;
      g.fillText(name, 15 * S, 27 * S);
      suitShape(g, suit, 15 * S, 32.6 * S, 2.6 * S, ink);
    }
    return c;
  });
}

/** the back of a card: dark red with a lighter lattice, a cream border and a blood drop */
export function cardBackUrl(): string {
  return url("back", () => {
    const { c, g } = blank();
    body(g, "#f1e9d2");
    roundRect(g, 3.2 * S, 3.2 * S, W - 6.4 * S, H - 6.4 * S, 1.6 * S); g.fillStyle = "#6e1320"; g.fill();
    g.save();
    roundRect(g, 3.2 * S, 3.2 * S, W - 6.4 * S, H - 6.4 * S, 1.6 * S); g.clip();
    g.strokeStyle = "#a32535"; g.lineWidth = 0.5 * S;
    for (let k = -CARD_H; k < CARD_W + CARD_H; k += 3) { g.beginPath(); g.moveTo(k * S, 0); g.lineTo((k + CARD_H) * S, H); g.stroke(); g.beginPath(); g.moveTo(k * S, 0); g.lineTo((k - CARD_H) * S, H); g.stroke(); }
    g.restore();
    roundRect(g, 6 * S, 6 * S, W - 12 * S, H - 12 * S, 1.2 * S); g.fillStyle = "#6e1320"; g.fill();
    g.strokeStyle = "#e8d9b0"; g.lineWidth = 0.5 * S; g.stroke();
    // the drop
    g.fillStyle = "#f1e9d2"; g.beginPath();
    g.moveTo(15 * S, 16.5 * S); g.bezierCurveTo(15 * S, 16.5 * S, 20.2 * S, 22 * S, 20.2 * S, 25.4 * S); g.arc(15 * S, 25.4 * S, 5.2 * S, 0, Math.PI, false); g.bezierCurveTo(9.8 * S, 22 * S, 15 * S, 16.5 * S, 15 * S, 16.5 * S);
    g.closePath(); g.fill();
    g.fillStyle = "#6e1320"; g.beginPath(); g.ellipse(17.4 * S, 24.2 * S, 0.9 * S, 1.6 * S, 0, 0, Math.PI * 2); g.fill();
    return c;
  });
}

/** an empty spot for a card to land (the board before the flop) */
export function cardSlotUrl(): string {
  return url("slot", () => {
    const { c, g } = blank();
    g.strokeStyle = "rgba(159, 210, 162, .55)"; g.lineWidth = 0.9 * S; g.setLineDash([2.4 * S, 1.6 * S]);
    roundRect(g, 1.2 * S, 1.2 * S, W - 2.4 * S, H - 2.4 * S, 3 * S); g.stroke();
    return c;
  });
}

// the chips below stay in pixels, like the rest of the game
function blankPx(w: number, h: number): { c: HTMLCanvasElement; g: Ctx } {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

// ---- chips ---------------------------------------------------------------------------------------------------------------------------------------
export const CHIP_VALUES = [1000, 500, 100, 25, 10, 5, 1];
const CHIP_COLORS: Record<number, [string, string]> = { 1: ["#e8e8ee", "#8c8c9a"], 5: ["#d83a3a", "#7a1c1c"], 10: ["#3f7fe0", "#1b3f80"], 25: ["#3fb35a", "#1b6030"], 100: ["#2a2a34", "#0c0c12"], 500: ["#8a45c8", "#46206e"], 1000: ["#e6b93a", "#8a6410"] };
/** one chip seen from the side: 14 wide, 7 tall, the colour of its value */
export function chipUrl(value: number): string {
  return url(`chip${value}`, () => {
    const [main, dark] = CHIP_COLORS[value] ?? CHIP_COLORS[1];
    const { c, g } = blankPx(14, 8);
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
