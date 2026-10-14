import { assetUrl } from "./assetUrl";
import { sfxMuted } from "./sfx";

/**
 * The basement's background sound: Half-Life 2 "Citadel" ambience, looping at a low volume.
 * It fades in when you go down and fades out when you leave. It follows the sound switch in the menu, and if the browser
 * won't start audio before a tap (phones), it starts on the next tap or key press.
 */
interface Loop { set(on: boolean): void }

/** A looping background track that fades in and out, follows the sound switch, and starts on the next tap if the browser blocked it. */
function makeLoop(file: string, target: number, fadeInMs: number, fadeOutMs: number): Loop {
  let audio: HTMLAudioElement | null = null;
  let wanted = false;
  let timer = 0;
  let blocked = false; // the browser refused to start it so far

  const ensure = (): HTMLAudioElement => {
    if (!audio) {
      audio = new Audio(assetUrl(file));
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
    }
    return audio;
  };
  const tryStart = (): void => {
    const a = ensure();
    void a.play().then(() => { blocked = false; }, () => { blocked = true; });
  };
  const unlock = (): void => {
    if (!blocked || !wanted) return;
    tryStart();
  };
  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true, passive: true });

  const tick = (): void => {
    const a = audio;
    if (!a) return;
    const goal = wanted && !sfxMuted() ? target : 0;
    const step = target / ((wanted ? fadeInMs : fadeOutMs) / 100);
    const v = a.volume;
    a.volume = v < goal ? Math.min(goal, v + step) : Math.max(goal, v - step);
    if (a.volume <= 0.001 && !wanted) {
      a.pause();
      window.clearInterval(timer);
      timer = 0;
    }
  };

  return {
    set(on: boolean): void {
      wanted = on;
      if (on) {
        const a = ensure();
        if (a.paused) tryStart();
      }
      if (!timer && audio && (on || !audio.paused)) timer = window.setInterval(tick, 100);
    },
  };
}

const basement = makeLoop("audio/citadel-ambience.mp3", 0.16, 5000, 1500); // not loud: it's an atmosphere under everything else
/** the shop's music: the Nintendogs shopping theme, a bit louder than the basement hum (it's the point of the room) */
const shop = makeLoop("audio/shop-theme.mp3", 0.3, 2500, 1500);

/** Fades the basement ambience in (true) or out (false). Safe to call over and over. */
export function setAmbience(on: boolean): void { basement.set(on); }
/** Fades the shop music in (true) or out (false). */
export function setShopMusic(on: boolean): void { shop.set(on); }
