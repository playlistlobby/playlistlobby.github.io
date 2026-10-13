import { assetUrl } from "./assetUrl";

// Short UI sounds: the Habbo ones from the asset dump, and a few Old School RuneScape effects (doors, knife, lockpick...)
// taken from https://github.com/SoaresPT/OSRS-SoundEffects-Dumps (public/sfx/osrs, named after what they are; the repo's numbers are in comments).
const FILES = {
  cash: "sfx/sound_catalogue_cash.m4a",
  message: "sfx/sound_console_new_message.m4a",
  sent: "sfx/sound_console_message_sent.m4a",
  knock: "sfx/sound_guide_received_invitation.m4a",
  camera: "sfx/sound_camera_shutter.m4a",
  friend: "sfx/sound_respect_received.m4a",
  doorOpen: "sfx/osrs/door_open.wav", // 62 door_open
  doorClose: "sfx/osrs/door_close.wav", // 60 door_close
  stab: "sfx/osrs/stab.wav", // 2549 stabsword_stab
  pickLock: "sfx/osrs/pick_lock.wav", // 2407 pick_lock
  light: "sfx/osrs/light.wav", // 2599 tinderbox_strike
  coins: "sfx/osrs/coins.wav", // 2115 coins
  select: "sfx/osrs/select.wav", // 2266 interface_select1
  give: "sfx/osrs/coin_single.wav", // 2112 coin_single_1
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
      a = new Audio(assetUrl(FILES[name]));
      cache.set(name, a);
    }
    const play = a.paused ? a : (a.cloneNode() as HTMLAudioElement);
    play.volume = volume;
    play.currentTime = 0;
    void play.play().catch(() => undefined);
  } catch { /* sounds are a nicety */ }
}
