// A death in the changed concert room (numbers: src/shared/event.ts): "you were killed" with a 20 second countdown, at 7 the screen fades to black and the music fades out, then a close-up
// of a grave with "Tak for alt" over it and the player's name under it, on the public room's floor for 5 seconds (with the public room's hum), then black again. After that the caller signs the
// player out (secretly) and shows the page that is left.
import { h } from "./dom";
import { loadNitro, spritesFor } from "../nitro";
import { assetUrl } from "../assetUrl";
import { fadeOut } from "../muffle";
import { setAmbience } from "../ambience";
import { DEAD_FADE_AT, DEAD_SECS, GRAVE_MS, GRAVE_TEXT } from "../shared/event";

export interface DeathOptions {
  name: string;
  /** the music that fades out at 7 */
  music?: HTMLAudioElement;
  /** called when the second black screen is fully black */
  onDone: () => void;
}

/** draws the grave (the animation with the skeleton hand) on a canvas, big and pixelated */
async function graveCanvas(): Promise<{ canvas: HTMLCanvasElement; stop: () => void }> {
  const canvas = document.createElement("canvas");
  canvas.className = "ev-grave-art";
  let stopped = false;
  const n = await loadNitro("furni/hween14_rare2.nitro").catch(() => null);
  const g = canvas.getContext("2d")!;
  if (n) {
    const k = 5;
    const all = spritesFor(n, 4, { state: 1, t: 0 }).filter((s) => !s.isShadow);
    const x0 = Math.min(...all.map((s) => s.dx)), y0 = Math.min(...all.map((s) => s.dy));
    const x1 = Math.max(...all.map((s) => s.dx + s.sw)), y1 = Math.max(...all.map((s) => s.dy + s.sh));
    canvas.width = Math.ceil((x1 - x0) * k) + 20; canvas.height = Math.ceil((y1 - y0) * k) + 20;
    const t0 = performance.now();
    const frame = (): void => {
      if (stopped) return;
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.imageSmoothingEnabled = false;
      for (const s of spritesFor(n, 4, { state: 1, t: performance.now() - t0 }).filter((q) => !q.isShadow)) {
        const px = (s.dx - x0) * k + 10, py = (s.dy - y0) * k + 10;
        if (s.flipH) { g.save(); g.translate(px + s.sw * k, py); g.scale(-1, 1); g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, 0, 0, s.sw * k, s.sh * k); g.restore(); }
        else g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py, s.sw * k, s.sh * k);
      }
      requestAnimationFrame(frame);
    };
    frame();
  }
  return { canvas, stop: () => { stopped = true; } };
}

/** runs the whole thing on top of `host`; returns a function that stops it (and clears everything it put up) */
export function runDeathSequence(host: HTMLElement, o: DeathOptions): () => void {
  let stopped = false;
  const timers: number[] = [];
  const later = (fn: () => void, ms: number): void => { timers.push(window.setTimeout(() => { if (!stopped) fn(); }, ms)); };
  const black = h("div", { class: "ev-black" });
  const count = h("div", { class: "rt-dead-sub" });
  const dead = h("div", { class: "rt-dead", role: "alert" }, h("div", { class: "rt-dead-t" }, "DU BLEV DRÆBT"), count);
  host.append(dead, black);
  const setBlack = (on: boolean, ms: number): void => { black.style.transition = `opacity ${ms}ms linear`; black.style.opacity = on ? "1" : "0"; };
  let grave: HTMLElement | null = null;
  let stopGrave = (): void => undefined;

  let left = DEAD_SECS;
  const tick = (): void => {
    if (stopped) return;
    count.textContent = `${left}…`; // (no "you wake up in your room": there is no room to wake up in)
    if (left === DEAD_FADE_AT) {
      setBlack(true, 1500);
      if (o.music) void fadeOut(o.music, 1800);
      later(showGrave, 1700);
      return; // (the countdown stops here: the screen is going black)
    }
    left--;
    later(tick, 1000);
  };
  tick();

  function showGrave(): void {
    dead.remove();
    setAmbience(true); // (the public room's hum)
    void graveCanvas().then(({ canvas, stop }) => {
      if (stopped) { stop(); return; }
      stopGrave = stop;
      grave = h("div", { class: "ev-grave", style: { backgroundImage: `url(${GRAVE_FLOOR})` } },
        h("div", { class: "ev-grave-box" }, h("div", { class: "ev-grave-text" }, GRAVE_TEXT), canvas, h("div", { class: "ev-grave-name" }, o.name)));
      host.insertBefore(grave, black);
      setBlack(false, 700);
      later(() => { setBlack(true, 1000); later(() => { o.onDone(); }, 1100); }, 700 + GRAVE_MS);
    });
  }

  return () => {
    stopped = true;
    timers.forEach((t) => window.clearTimeout(t));
    stopGrave();
    dead.remove(); black.remove(); grave?.remove();
    setAmbience(false);
  };
}

/** the floor of the public room as a CSS background (the grave screen's ground) */
export const GRAVE_FLOOR = assetUrl("textures/basement/floor.jpg");
