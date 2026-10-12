import { assetUrl } from "./assetUrl";

// Short UI sounds from the Habbo asset dump (public/sfx). Played on purchases, messages, knocks and so on.
const FILES = {
  cash: "sound_catalogue_cash",
  message: "sound_console_new_message",
  sent: "sound_console_message_sent",
  knock: "sound_guide_received_invitation",
  camera: "sound_camera_shutter",
  friend: "sound_respect_received",
} as const;
export type Sfx = keyof typeof FILES;

const KEY = "6ix-sfx-muted";
let muted = false;
try { muted = localStorage.getItem(KEY) === "1"; } catch { /* private mode: sounds just stay on */ }

const cache = new Map<Sfx, HTMLAudioElement>();

export const sfxMuted = (): boolean => muted;

export function setSfxMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem(KEY, m ? "1" : "0"); } catch { /* ignore */ }
}

/** Plays a UI sound. Never throws: browsers may refuse until the page has been clicked once. */
export function playSfx(name: Sfx, volume = 0.5): void {
  if (muted) return;
  try {
    let a = cache.get(name);
    if (!a) {
      a = new Audio(assetUrl(`sfx/${FILES[name]}.m4a`));
      cache.set(name, a);
    }
    const play = a.paused ? a : (a.cloneNode() as HTMLAudioElement);
    play.volume = volume;
    play.currentTime = 0;
    void play.play().catch(() => undefined);
  } catch { /* sounds are a nicety */ }
}
