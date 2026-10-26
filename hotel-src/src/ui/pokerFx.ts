// The room's side of poker: a player who loses their last blood at a poker table puts a revolver to their head and shoots themselves, in front of everybody in the room
// (the gun, the flash, the shake, the blood and the body without its head for a few seconds). It follows what the server writes to poker/<table>: when a hand is over and a
// seat is marked "bust", everybody who has the table's room open plays the shot, a moment later so the result can be read first. Plain drawing: the room feeds it where the players stand.
import { getCached, renderAvatar } from "../avatarService";
import type { RenderOpts } from "../avatarService";
import { serverNow } from "../db";
import { playBang, playSplat, playThud } from "../sfx";
import { watchPokerTable } from "../poker";
import type { PokerTable } from "../shared/poker";
import type { Profile } from "../db";
import { drawGoreOnBody, drawGoreOnFloor, drawGun, drawMuzzleFlash, GUN_K, withoutHead } from "./rouletteFx";
import type { P } from "./rouletteFx";

/** from the moment the shot is "called" to the trigger, and how long the body stays headless and bloody */
const LEAD = 1500, RAISE = 700, HOLD = 450;
const SHOT_AT = LEAD + RAISE + HOLD;
const HEADLESS_MS = 6500;

interface Bust { t0: number; seed: number }

export interface PokerFx {
  /** which poker tables (piece ids) stand in this room: they are watched for busts */
  setTables(fids: string[]): void;
  /** the arm pose of somebody who holds the gun to their head (null: the usual) */
  armFor(uid: string, now: number): "raised" | null;
  /** the picture of a player: without its head after the shot */
  imageFor(uid: string, img: HTMLCanvasElement, opts: RenderOpts, now: number): HTMLCanvasElement;
  /** the blood on the floor under a player who shot themselves (drawn before the player) */
  drawFloor(g: CanvasRenderingContext2D, uid: string, feet: P, now: number): void;
  /** the blood on the body (drawn right after the player) */
  drawBody(g: CanvasRenderingContext2D, uid: string, feet: P, now: number): void;
  /** the gun and its flash (drawn over the player) */
  drawGun(g: CanvasRenderingContext2D, uid: string, feet: P, dir: number, now: number): void;
  /** a short shake of the whole picture at the shot */
  shake(now: number): P;
  dispose(): void;
}

export function mountPokerFx(env: { me: Profile; roomId: string; scale: () => number }): PokerFx {
  const stops = new Map<string, () => void>();
  const handled = new Map<string, number>();
  const busts = new Map<string, Bust>();
  const timers = new Set<number>();
  let shakeAt = 0;
  let closed = false;
  const at = (ms: number, fn: () => void): void => { const id = window.setTimeout(() => { timers.delete(id); if (!closed) fn(); }, Math.max(0, ms)); timers.add(id); };

  function onTable(fid: string, t: PokerTable | null): void {
    if (!t || t.phase !== "over" || !t.over) return;
    const key = `${fid}:${t.hand}`;
    if (handled.has(key)) return;
    handled.set(key, performance.now());
    if (serverNow() - t.over.at > 3000) return; // an old result: somebody who just walked in doesn't see yesterday's shot
    for (const s of t.seats) {
      if (!s || !s.bust) continue;
      const t0 = performance.now();
      busts.set(s.uid, { t0, seed: (t.over.at + t.hand * 7919) % 1_000_000 });
      at(SHOT_AT, () => { playBang(0.85); shakeAt = performance.now(); });
      at(SHOT_AT + 60, () => playSplat(0.4));
      at(SHOT_AT + 380, () => playThud(0.5));
      at(SHOT_AT + 900, () => playSplat(0.3));
    }
  }

  const bustOf = (uid: string, now: number): Bust | null => {
    const b = busts.get(uid);
    if (!b) return null;
    if (now - b.t0 > SHOT_AT + HEADLESS_MS + 400) { busts.delete(uid); return null; }
    return b;
  };

  return {
    setTables(fids) {
      for (const fid of fids) if (!stops.has(fid)) stops.set(fid, watchPokerTable(env.roomId, fid, (t) => onTable(fid, t)));
      for (const [fid, stop] of [...stops]) if (!fids.includes(fid)) { stop(); stops.delete(fid); }
    },
    armFor(uid, now) {
      const b = bustOf(uid, now);
      return b && now - b.t0 >= LEAD * 0.9 && now - b.t0 < SHOT_AT + 500 ? "raised" : null;
    },
    imageFor(uid, img, opts, now) {
      const b = bustOf(uid, now);
      if (!b || now - b.t0 < SHOT_AT + 40 || now - b.t0 > SHOT_AT + HEADLESS_MS) return img;
      const ho = getCached({ ...opts, headOnly: true });
      if (!ho) { void renderAvatar({ ...opts, headOnly: true }); return img; }
      return withoutHead(img, ho);
    },
    drawFloor(g, uid, feet, now) {
      const b = bustOf(uid, now);
      if (!b || now - b.t0 < SHOT_AT) return;
      const age = now - b.t0 - SHOT_AT;
      g.save();
      if (age > HEADLESS_MS - 1500) g.globalAlpha = Math.max(0, 1 - (age - (HEADLESS_MS - 1500)) / 1900);
      const s = env.scale();
      drawGoreOnFloor(g, { start: b.t0 + SHOT_AT, seed: b.seed }, now, { x: feet.x - 2 * s, y: feet.y + 1 * s }, s);
      g.restore();
    },
    drawBody(g, uid, feet, now) {
      const b = bustOf(uid, now);
      if (!b || now - b.t0 < SHOT_AT || now - b.t0 > SHOT_AT + HEADLESS_MS) return;
      const s = env.scale();
      drawGoreOnBody(g, { start: b.t0 + SHOT_AT, seed: b.seed }, now, { x: feet.x, y: feet.y - 54 * s }, s, feet.y + 3 * s);
    },
    drawGun(g, uid, feet, dir, now) {
      const b = bustOf(uid, now);
      if (!b) return;
      const t = now - b.t0;
      if (t < LEAD * 0.9 || t > SHOT_AT + 520) return;
      const s = env.scale();
      const side = dir >= 4 && dir <= 6 ? -1 : 1; // the gun is on the side of the head they show us
      const head = { x: feet.x, y: feet.y - 70 * s };
      const low = { x: feet.x + side * 16 * s, y: feet.y - 30 * s };
      const temple = { x: head.x + side * 11 * s, y: head.y + 3 * s };
      const up = Math.max(0, Math.min(1, (t - LEAD) / RAISE));
      const e = up * up * (3 - 2 * up);
      let x = low.x + (temple.x - low.x) * e, y = low.y + (temple.y - low.y) * e;
      let ang = side > 0 ? Math.PI * (1 - 0.0) : 0; // the barrel points at the head
      ang += side * (1 - e) * 0.9; // (it comes up tilted)
      const after = t - SHOT_AT;
      if (after > 0) { const f = Math.min(1, after / 420); x += side * 10 * s * f; y += 26 * s * f * f; ang += side * f * 1.4; } // the recoil, and the gun falls
      const r = drawGun(g, x, y, ang, s * GUN_K * 2.6); // (a bigger gun than at the roulette table: the player is small in the room)
      if (after >= 0 && after < 160) drawMuzzleFlash(g, r.muzzle, 1 - after / 160, s * 1.2);
    },
    shake(now) {
      const t = now - shakeAt;
      if (shakeAt <= 0 || t > 320) return { x: 0, y: 0 };
      const k = 1 - t / 320;
      return { x: Math.sin(t / 9) * 6 * k, y: Math.cos(t / 11) * 4 * k };
    },
    dispose() {
      closed = true;
      for (const stop of stops.values()) stop();
      stops.clear();
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    },
  };
}
