import { assetUrl } from "./assetUrl";
import { musicMuted, onMusicMuteChange } from "./sfx";

/**
 * The basement's background sound: Half-Life 2 "Citadel" ambience, looping at a low volume.
 * It fades in when you go down and fades out when you leave. It follows the sound switch in the menu, and if the browser
 * won't start audio before a tap (phones), it starts on the next tap or key press.
 */
interface Loop { set(on: boolean): void }

/**
 * A looping background track that fades in and out, follows the sound switch, and starts on the next tap if the browser blocked it.
 * Phones: iPhones ignore `audio.volume` (it is always 1), so a fade can't be heard and the volume can't be read back as a sign that it has faded out.
 * The loop keeps its own level, and where the volume can't be set it simply starts and stops. It also stops at once when the page is hidden
 * (the app is closed or switched away from: timers are frozen then, so a fade-out would never finish) and carries on when you come back.
 */
function makeLoop(file: string, target: number, fadeInMs: number, fadeOutMs: number): Loop {
  let audio: HTMLAudioElement | null = null;
  let wanted = false;
  let timer = 0;
  let blocked = false; // the browser refused to start it so far
  let level = 0; // where the fade is (0..target)
  let canFade: boolean | null = null; // can the volume be set at all?

  const ensure = (): HTMLAudioElement => {
    if (!audio) {
      audio = new Audio(assetUrl(file));
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      audio.volume = 0.5;
      canFade = Math.abs(audio.volume - 0.5) < 0.01; // an iPhone says 1 here
      audio.volume = 0;
    }
    return audio;
  };
  const stopNow = (): void => {
    level = 0;
    if (timer) { window.clearInterval(timer); timer = 0; }
    if (audio) { audio.pause(); if (canFade) audio.volume = 0; }
  };
  const tryStart = (): void => {
    if (document.hidden) return;
    const a = ensure();
    a.muted = musicMuted(); // (`muted` works on iPhones where the volume can't be set)
    if (!canFade) level = target; // no fades on this device: it is simply on
    void a.play().then(() => { blocked = false; }, () => { blocked = true; });
  };
  const unlock = (): void => {
    if (!blocked || !wanted) return;
    tryStart();
  };
  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true, passive: true });
  // the app is hidden / closed: stop at once. Back again: start again if the room still wants it.
  const onVisibility = (): void => {
    if (document.hidden) { if (audio && !audio.paused) audio.pause(); if (timer) { window.clearInterval(timer); timer = 0; } return; }
    if (wanted && !musicMuted()) { tryStart(); if (!timer && canFade) timer = window.setInterval(tick, 100); }
  };
  document.addEventListener("visibilitychange", onVisibility);
  // the Music switch in the menu: silent at once (phones included), and back when it is switched on again
  onMusicMuteChange(() => {
    if (audio) audio.muted = musicMuted();
    if (!musicMuted() && wanted) { if (audio && audio.paused) tryStart(); if (canFade && !timer) timer = window.setInterval(tick, 100); }
  });
  window.addEventListener("pagehide", stopNow);

  const tick = (): void => {
    const a = audio;
    if (!a) return;
    a.muted = musicMuted();
    const goal = wanted && !musicMuted() ? target : 0;
    const step = target / ((wanted ? fadeInMs : fadeOutMs) / 100);
    level = level < goal ? Math.min(goal, level + step) : Math.max(goal, level - step);
    if (canFade) a.volume = level;
    if (level <= 0.001 && goal === 0) {
      a.pause();
      window.clearInterval(timer);
      timer = 0;
    }
  };

  return {
    set(on: boolean): void {
      wanted = on;
      if (!on && !audio) return; // nothing was ever started
      const a = ensure();
      if (on) {
        if (a.paused) tryStart();
        if (canFade && !timer) timer = window.setInterval(tick, 100);
      } else if (!canFade) {
        stopNow(); // no fade-out possible: just stop
      } else if (!a.paused && !timer) {
        timer = window.setInterval(tick, 100);
      }
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
