import { assetUrl } from "./assetUrl";
import { sfxMuted } from "./sfx";

/**
 * The basement's background sound: Half-Life 2 "Citadel" ambience, looping at a low volume.
 * It fades in when you go down and fades out when you leave. It follows the sound switch in the menu, and if the browser
 * won't start audio before a tap (phones), it starts on the next tap or key press.
 */
const TARGET = 0.16; // not loud: it's an atmosphere under everything else
const FADE_IN_MS = 5000;
const FADE_OUT_MS = 1500;

let audio: HTMLAudioElement | null = null;
let wanted = false;
let timer = 0;
let blocked = false; // the browser refused to start it so far

function ensure(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(assetUrl("audio/citadel-ambience.mp3"));
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
  }
  return audio;
}

function tryStart(): void {
  const a = ensure();
  void a.play().then(() => { blocked = false; }, () => { blocked = true; });
}

function unlock(): void {
  if (!blocked || !wanted) return;
  tryStart();
}
window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
window.addEventListener("keydown", unlock, { capture: true, passive: true });

function tick(): void {
  const a = audio;
  if (!a) return;
  const goal = wanted && !sfxMuted() ? TARGET : 0;
  const step = TARGET / ((wanted ? FADE_IN_MS : FADE_OUT_MS) / 100);
  const v = a.volume;
  a.volume = v < goal ? Math.min(goal, v + step) : Math.max(goal, v - step);
  if (a.volume <= 0.001 && !wanted) {
    a.pause();
    window.clearInterval(timer);
    timer = 0;
  }
}

/** Fades the ambience in (true) or out (false). Safe to call over and over. */
export function setAmbience(on: boolean): void {
  wanted = on;
  if (on) {
    const a = ensure();
    if (a.paused) tryStart();
  }
  if (!timer && audio && (on || !audio.paused)) timer = window.setInterval(tick, 100);
}
