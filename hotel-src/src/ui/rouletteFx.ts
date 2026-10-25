// Everything you see at the roulette table besides the furniture and the players: the revolver (in a hand, raised to the head, passed across the table),
// the muzzle flash, the blood, and the body without its head. Plain drawing functions: the room (src/ui/room.ts) feeds them where the players sit.
// Positions inside an avatar picture are in its own pixels (64 wide, 110 tall, the feet at x 32 / y 94); `scale` turns them into screen pixels.

export interface P { x: number; y: number }

/** where the feet of the avatar picture sit inside it (the same numbers the room uses) */
const FEET_X = 32, FEET_Y = 94;

// ---- the revolver (pixel art, pointing right) -----------------------------------------------------------------------------------------------
const GUN_PAL: Record<string, string> = { K: "#14161b", S: "#aab2bf", H: "#dfe5ee", D: "#656c79", W: "#8a5230", w: "#5c3418", R: "#b73a2a" };
const GUN_ROWS = [
  "......KKKKKKKKKKK",
  ".....KHHHHHHHHHHSK",
  "..KKKKSSSSSSSSSSDK",
  ".KDDDKKDDDDDDDDDDK",
  ".KDSDDKKKKKKKKKKK.",
  "KWWDDDK...........",
  "KWWWWK............",
  "KwWWWK............",
  ".KwwwK............",
  "..KKK.............",
];
const GUN_W = Math.max(...GUN_ROWS.map((r) => r.length)), GUN_H = GUN_ROWS.length;
/** where the grip is held and where the bullet comes out, in the gun's own pixels */
const GUN_GRIP = { x: 3, y: 6 }, GUN_MUZZLE = { x: 17, y: 2.5 };
let gunImg: HTMLCanvasElement | null = null;
function gunSprite(): HTMLCanvasElement {
  if (gunImg) return gunImg;
  const c = document.createElement("canvas");
  c.width = GUN_W; c.height = GUN_H;
  const g = c.getContext("2d")!;
  GUN_ROWS.forEach((row, y) => [...row].forEach((ch, x) => { const col = GUN_PAL[ch]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }));
  return (gunImg = c);
}

/** the revolver with its grip at (x, y), turned so the barrel points along `ang` (radians, screen angles); `k` = screen pixels per gun pixel */
export function drawGun(g: CanvasRenderingContext2D, x: number, y: number, ang: number, k: number): { muzzle: P } {
  const flip = Math.cos(ang) < 0; // pointing left: mirror it, so it never goes upside down
  g.save();
  g.translate(x, y);
  g.rotate(flip ? ang - Math.PI : ang);
  if (flip) g.scale(-1, 1);
  g.imageSmoothingEnabled = false;
  g.drawImage(gunSprite(), -GUN_GRIP.x * k, -GUN_GRIP.y * k, GUN_W * k, GUN_H * k);
  g.restore();
  const m = { x: (GUN_MUZZLE.x - GUN_GRIP.x) * k, y: (GUN_MUZZLE.y - GUN_GRIP.y) * k };
  const a = flip ? ang - Math.PI : ang, sx = flip ? -1 : 1;
  return { muzzle: { x: x + (m.x * sx) * Math.cos(a) - m.y * Math.sin(a), y: y + (m.x * sx) * Math.sin(a) + m.y * Math.cos(a) } };
}

// ---- where things are on a seated avatar ----------------------------------------------------------------------------------------------------
/** the fist holding the gun (resting: the arm in the "carry" pose; raised: the arm in the "drink" pose), the temple the barrel is pressed to, and the neck */
interface Anchors { rest: P; raised: P; temple: P; neck: P; head: P }
const ANCHORS: Record<number, Anchors> = {
  4: { rest: { x: 7, y: 72 }, raised: { x: 8, y: 53 }, temple: { x: 15, y: 47 }, neck: { x: 28, y: 62 }, head: { x: 26, y: 42 } }, // the one who faces the camera
  0: { rest: { x: 55, y: 67 }, raised: { x: 51, y: 47 }, temple: { x: 45, y: 41 }, neck: { x: 36, y: 62 }, head: { x: 36, y: 42 } }, // the one with their back to it
};
const anchorsOf = (dir: number): Anchors => ANCHORS[dir] ?? ANCHORS[4];

/** a spot inside the avatar picture, on the screen: `feet` is where the avatar's feet are drawn (the seat's lift included) */
export const spriteAt = (feet: P, sx: number, sy: number, scale: number): P => ({ x: feet.x + (sx - FEET_X) * scale, y: feet.y + (sy - FEET_Y) * scale });

export interface Seat { feet: P; dir: number }

/** the neck of a player sitting with `dir`, on the screen (where the head was) */
export const neckOf = (feet: P, dir: number, scale: number): P => spriteAt(feet, anchorsOf(dir).neck.x, anchorsOf(dir).neck.y - 6, scale);

/** the gun is drawn this many screen pixels per gun pixel for every pixel of `scale` (the avatars' size) */
export const GUN_K = 0.8;

// ---- the pull: a timeline ----------------------------------------------------------------------------------------------------------------------
/** how long each part of a pull takes (ms): the gun comes up to the head, the long wait, the trigger, the gun comes down (or falls), and goes across the table */
export const PULL = { raise: 170, wait: 60, click: 180, lower: 300, pass: 700, fall: 500 };
export const DEAL_MS = 900;
/** the moment of truth, from the start of a pull */
export const TRIGGER_AT = PULL.raise + PULL.wait;
/** a pull that was safe is over (and the next player may reach for the gun) after this long */
export const SAFE_PULL_MS = TRIGGER_AT + PULL.click + PULL.lower + PULL.pass;
/** a pull that killed is "over" (the table is quiet) after this long */
export const DEADLY_PULL_MS = TRIGGER_AT + PULL.fall;

export interface RtAnim {
  /** "deal": the gun is taken from the rack to the first player; "pull": a pull of the trigger */
  kind: "deal" | "pull";
  /** performance.now() when it began */
  start: number;
  /** who holds the gun (0 = the first seat, 1 = the second) */
  by: 0 | 1;
  /** the pull was the bullet (undefined: the player has clicked and the table hasn't said yet) */
  dead?: boolean;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpP = (a: P, b: P, t: number): P => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const ease = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** which way the arm of a player is held: down (resting on the lap), or up at the head */
export type ArmPose = "rest" | "raised";
/** what pose the arm of seat `i` is in while the pull `a` runs (null: no gun involved, the arm is as it always is) */
export function armPoseAt(a: RtAnim | null, now: number, i: 0 | 1): ArmPose | null {
  if (!a || a.by !== i) return null;
  const t = now - a.start;
  if (a.kind === "deal") return t >= DEAL_MS * 0.7 ? "rest" : null;
  if (t < PULL.raise * 0.35) return "rest";
  if (a.dead === undefined && t >= TRIGGER_AT) return "raised"; // the answer from the server isn't in yet: the gun stays at the head
  if (t < TRIGGER_AT + (a.dead ? PULL.fall : PULL.click + PULL.lower * 0.4)) return "raised";
  return "rest";
}

export interface GunDraw { at: P; ang: number; behind: boolean; flash: number; shake: number }

/**
 * Where the revolver is, and which way it points, at `now`. null: it is not in the picture (it lies in the rack). `holder` = the seat that has it when nothing is moving.
 * `table` = the middle of the table top on the screen. `behind`: draw it before the player (a player with their back to us holds it on the far side of their body).
 */
export function gunNow(a: RtAnim | null, holder: 0 | 1 | null, seats: [Seat, Seat], table: P, now: number, scale: number): GunDraw | null {
  const rest = (i: 0 | 1): P => spriteAt(seats[i].feet, anchorsOf(seats[i].dir).rest.x, anchorsOf(seats[i].dir).rest.y, scale);
  const raised = (i: 0 | 1): P => spriteAt(seats[i].feet, anchorsOf(seats[i].dir).raised.x, anchorsOf(seats[i].dir).raised.y, scale);
  const temple = (i: 0 | 1): P => spriteAt(seats[i].feet, anchorsOf(seats[i].dir).temple.x, anchorsOf(seats[i].dir).temple.y, scale);
  const toward = (from: P, to: P): number => Math.atan2(to.y - from.y, to.x - from.x);
  const holdAng = (i: 0 | 1): number => toward(rest(i), table);
  // where the grip is when the barrel touches the temple: the barrel points from the fist to the temple, so the fist sits a gun's length behind it
  const aimed = (i: 0 | 1): { at: P; ang: number } => {
    const tp = temple(i), fist = raised(i);
    const ang = toward(fist, tp);
    const len = (GUN_MUZZLE.x - GUN_GRIP.x) * scale * GUN_K * 0.82;
    return { at: { x: tp.x - Math.cos(ang) * len, y: tp.y - Math.sin(ang) * len }, ang };
  };
  const behind = (i: 0 | 1): boolean => seats[i].dir === 0;
  if (!a) {
    if (holder === null) return null;
    const bob = Math.sin(now / 520) * 0.6 * scale;
    return { at: { x: rest(holder).x, y: rest(holder).y + bob }, ang: holdAng(holder), behind: behind(holder), flash: 0, shake: 0 };
  }
  const t = now - a.start;
  const i = a.by;
  if (a.kind === "deal") {
    const k = ease(t / DEAL_MS);
    const from: P = { x: table.x, y: table.y - 4 * scale };
    const to = rest(i);
    const p = lerpP(from, to, k);
    p.y -= Math.sin(k * Math.PI) * 14 * scale; // lifted over the table on the way
    return { at: p, ang: lerp(-0.4, holdAng(i), k), behind: k > 0.6 && behind(i), flash: 0, shake: 0 };
  }
  const other: 0 | 1 = i === 0 ? 1 : 0;
  const aim = aimed(i);
  if (t < PULL.raise) { // up to the head
    const k = ease(t / PULL.raise);
    const p = lerpP(rest(i), aim.at, k);
    return { at: p, ang: lerp(holdAng(i), aim.ang, k), behind: false, flash: 0, shake: 0 };
  }
  if (t < TRIGGER_AT) { // the wait: the barrel trembles against the head
    const tr = (t - PULL.raise) / PULL.wait;
    const shake = Math.sin(t / 38) * 0.55 * scale * (0.4 + tr);
    return { at: { x: aim.at.x + shake, y: aim.at.y + Math.cos(t / 51) * 0.4 * scale }, ang: aim.ang, behind: false, flash: 0, shake: 0 };
  }
  if (a.dead === undefined) { // pulled, but the table hasn't said yet what the trigger did: the barrel stays pressed to the head
    return { at: { x: aim.at.x + Math.sin(t / 38) * 0.9 * scale, y: aim.at.y + Math.cos(t / 51) * 0.5 * scale }, ang: aim.ang, behind: false, flash: 0, shake: 0 };
  }
  if (a.dead) { // the shot: the gun kicks back and falls
    const u = t - TRIGGER_AT;
    const kick = Math.max(0, 1 - u / 120);
    const fall = clamp01((u - 90) / (PULL.fall - 90));
    const from = { x: aim.at.x - Math.cos(aim.ang) * 5 * scale * kick, y: aim.at.y - Math.sin(aim.ang) * 5 * scale * kick - 3 * scale * kick };
    const ground: P = { x: lerp(table.x, rest(i).x, 0.5), y: table.y + 2 * scale };
    const p = lerpP(from, ground, fall * fall);
    return { at: p, ang: aim.ang + fall * 1.2, behind: false, flash: Math.max(0, 1 - u / 150), shake: Math.max(0, 1 - u / 260) };
  }
  const u = t - TRIGGER_AT;
  if (u < PULL.click) return { at: aim.at, ang: aim.ang, behind: false, flash: 0, shake: 0 }; // click
  if (u < PULL.click + PULL.lower) { // down from the head again
    const k = ease((u - PULL.click) / PULL.lower);
    return { at: lerpP(aim.at, rest(i), k), ang: lerp(aim.ang, holdAng(i), k), behind: false, flash: 0, shake: 0 };
  }
  const v = clamp01((u - PULL.click - PULL.lower) / PULL.pass); // across the table to the other player
  const k = ease(v);
  const p = lerpP(rest(i), rest(other), k);
  const mid = Math.sin(v * Math.PI) * 18 * scale;
  p.x = lerp(rest(i).x, rest(other).x, k);
  p.y -= mid;
  return { at: p, ang: lerp(holdAng(i), holdAng(other), k) + Math.sin(v * Math.PI) * 0.25, behind: v > 0.7 && behind(other), flash: 0, shake: 0 };
}

/** a burst of light at the end of the barrel (0..1: how fresh it is) */
export function drawMuzzleFlash(g: CanvasRenderingContext2D, at: P, fresh: number, scale: number): void {
  if (fresh <= 0) return;
  const r = (7 + 12 * fresh) * scale;
  g.save();
  g.translate(at.x, at.y);
  g.globalAlpha = Math.min(1, fresh * 1.4);
  g.fillStyle = "#ffb52e";
  g.beginPath();
  for (let i = 0; i < 16; i++) { const rad = i % 2 ? r * 0.38 : r; const a = (i / 16) * Math.PI * 2 + 0.3; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  g.closePath(); g.fill();
  g.fillStyle = "#fff3b0";
  g.beginPath();
  for (let i = 0; i < 12; i++) { const rad = i % 2 ? r * 0.2 : r * 0.62; const a = (i / 12) * Math.PI * 2; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  g.closePath(); g.fill();
  g.restore();
}

// ---- the body without its head ---------------------------------------------------------------------------------------------------------------
const headless = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
/** the avatar with the head, hair and hat taken out (`headOnly` is the same picture of just those parts: both come out the same size) */
export function withoutHead(full: HTMLCanvasElement, headOnly: HTMLCanvasElement): HTMLCanvasElement {
  const hit = headless.get(full);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = full.width; c.height = full.height;
  const g = c.getContext("2d")!;
  g.drawImage(full, 0, 0);
  g.globalCompositeOperation = "destination-out";
  g.drawImage(headOnly, 0, 0);
  g.globalCompositeOperation = "source-over";
  headless.set(full, c);
  return c;
}

const dimmedCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
/** the same picture a little darker (for a player who is disconnected) */
export function dimmed(img: HTMLCanvasElement): HTMLCanvasElement {
  const hit = dimmedCache.get(img);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = "rgba(8,10,22,0.5)";
  g.fillRect(0, 0, c.width, c.height);
  dimmedCache.set(img, c);
  return c;
}

// ---- the blood -----------------------------------------------------------------------------------------------------------------------------------
const BLOOD = ["#5c0606", "#7d0a0a", "#a11212", "#c41a1a", "#d92a2a"];
/** a small steady random series from a seed (so every browser draws the same splashes) */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x1_0000_0000; };
}

export interface Gore { start: number; seed: number }
const SPURT_MS = 1300;
const SPURTS = 60;
const GRAV = 380; // art pixels per second squared

/** one spurt of blood: where it is `t` seconds after it left (art pixels, relative to the neck) */
function spurt(r: () => number): { vx: number; vy: number; size: number; col: string; delay: number } {
  const a = (-90 + (r() - 0.5) * 120) * (Math.PI / 180);
  const sp = 45 + r() * 130;
  return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: 1 + Math.floor(r() * 3), col: BLOOD[Math.floor(r() * BLOOD.length)], delay: r() * SPURT_MS };
}

/** the open neck: a red stump with blood running down the front, and the fountain above it */
export function drawGoreOnBody(g: CanvasRenderingContext2D, fx: Gore, now: number, neck: P, scale: number, floorY: number): void {
  const t = now - fx.start;
  if (t < 0) return;
  const px = Math.max(1.5, scale);
  const snap = (v: number): number => Math.round(v / px) * px;
  // the stump
  g.fillStyle = BLOOD[1];
  g.fillRect(snap(neck.x - 7 * scale), snap(neck.y - 3 * scale), snap(14 * scale), snap(5 * scale));
  g.fillStyle = BLOOD[3];
  g.fillRect(snap(neck.x - 5 * scale), snap(neck.y - 4 * scale), snap(10 * scale), snap(2.5 * scale));
  g.fillStyle = BLOOD[0];
  g.fillRect(snap(neck.x - 2 * scale), snap(neck.y - 5 * scale), snap(4 * scale), snap(2 * scale));
  // the blood running down the front, longer as time goes
  const run = Math.min(1, t / 3500);
  const r = rng(fx.seed + 7);
  for (let i = 0; i < 4; i++) {
    const x = neck.x + (-5 + i * 3.4 + (r() - 0.5) * 2) * scale, len = (6 + r() * 14) * run * scale;
    g.fillStyle = i % 2 ? BLOOD[2] : BLOOD[1];
    g.fillRect(snap(x), snap(neck.y), snap(1.7 * scale), snap(len + 2 * scale));
    g.fillStyle = BLOOD[4];
    g.fillRect(snap(x), snap(neck.y + len), snap(2.2 * scale), snap(1.6 * scale));
  }
  // the fountain: little squares thrown up and out, falling down in an arc
  const rr = rng(fx.seed);
  for (let i = 0; i < SPURTS; i++) {
    const s = spurt(rr);
    const age = (t - s.delay) / 1000;
    if (age < 0 || age > 1.4) continue;
    const x = neck.x + s.vx * age * scale, y = neck.y - 3 * scale + (s.vy * age + 0.5 * GRAV * age * age) * scale;
    if (y > floorY) continue;
    g.fillStyle = s.col;
    g.fillRect(snap(x), snap(y), snap(s.size * scale), snap(s.size * scale));
  }
}

/** the pool under the chair and the drops that landed around it (drawn on the floor, under everything) */
export function drawGoreOnFloor(g: CanvasRenderingContext2D, fx: Gore, now: number, at: P, scale: number): void {
  const t = now - fx.start;
  if (t < 0) return;
  const grow = 1 - Math.pow(1 - Math.min(1, t / 5000), 2.2);
  const px = Math.max(1.5, scale);
  const snap = (v: number): number => Math.round(v / px) * px;
  g.save();
  // the pool: a few overlapping ellipses, darker in the middle
  const r = rng(fx.seed + 31);
  for (let i = 0; i < 5; i++) {
    const ox = (r() - 0.5) * 16 * scale, oy = (r() - 0.5) * 6 * scale;
    const rx = (10 + r() * 14) * grow * scale, ry = rx * 0.45;
    g.fillStyle = i === 0 ? BLOOD[0] : i < 3 ? BLOOD[1] : BLOOD[2];
    g.beginPath(); g.ellipse(snap(at.x + ox), snap(at.y + oy), Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); g.fill();
  }
  // the drops that fell
  const rr = rng(fx.seed);
  for (let i = 0; i < SPURTS; i++) {
    const s = spurt(rr);
    const ageEnd = (t - s.delay) / 1000;
    if (ageEnd < 1.2) continue;
    const x = at.x + s.vx * 1.15 * scale * 0.55 + (r() - 0.5) * 8 * scale, y = at.y + (r() - 0.35) * 10 * scale;
    g.fillStyle = s.col;
    g.fillRect(snap(x), snap(y), snap(s.size * scale), snap(Math.max(1, s.size * 0.6) * scale));
  }
  g.restore();
}

/** when the head is gone: from the shot on, the body is drawn without it (a little after the flash) */
export const HEAD_GONE_AT = TRIGGER_AT + 40;
