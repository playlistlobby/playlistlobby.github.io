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

const muteListeners = new Set<() => void>();
/** Called when the Sounds switch is flipped (the background music and the CD player follow it at once). */
export const onSfxMuteChange = (fn: () => void): void => { muteListeners.add(fn); };

export function setSfxMuted(m: boolean): void {
  muted = m;
  muteListeners.forEach((l) => l());
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

// ---- sounds made on the spot (no sound files): the revolver ----------------------------------------------------------------------------------
let audio: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  try {
    if (!audio) audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch { return null; }
}
/** a burst of noise that fades out, shaped by a low-pass filter that closes */
function noiseBurst(a: AudioContext, at: number, ms: number, volume: number, cutFrom: number, cutTo: number): void {
  const len = Math.max(1, Math.floor(a.sampleRate * ms / 1000));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(cutFrom, at); f.frequency.exponentialRampToValueAtTime(Math.max(60, cutTo), at + ms / 1000);
  const gain = a.createGain(); gain.gain.setValueAtTime(volume, at); gain.gain.exponentialRampToValueAtTime(0.001, at + ms / 1000);
  src.connect(f).connect(gain).connect(a.destination);
  src.start(at); src.stop(at + ms / 1000 + 0.02);
}
/** a low note that drops in pitch (the thump under a shot) */
function thump(a: AudioContext, at: number, ms: number, volume: number, from: number, to: number): void {
  const o = a.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(from, at); o.frequency.exponentialRampToValueAtTime(to, at + ms / 1000);
  const gain = a.createGain(); gain.gain.setValueAtTime(volume, at); gain.gain.exponentialRampToValueAtTime(0.001, at + ms / 1000);
  o.connect(gain).connect(a.destination);
  o.start(at); o.stop(at + ms / 1000 + 0.02);
}
/** a little tick, like metal on metal */
function tick(a: AudioContext, at: number, volume: number, hz: number): void {
  const o = a.createOscillator(); o.type = "square"; o.frequency.setValueAtTime(hz, at); o.frequency.exponentialRampToValueAtTime(hz * 0.55, at + 0.03);
  const gain = a.createGain(); gain.gain.setValueAtTime(volume, at); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.035);
  o.connect(gain).connect(a.destination);
  o.start(at); o.stop(at + 0.05);
}
/** the shot: a crack, a boom and a ring (everyone in the room hears it) */
export function playBang(volume = 0.8): void {
  if (muted) return;
  const a = audioCtx(); if (!a) return;
  const t = a.currentTime + 0.01;
  noiseBurst(a, t, 260, volume, 9000, 400);
  thump(a, t, 320, volume * 0.9, 150, 38);
  noiseBurst(a, t + 0.02, 700, volume * 0.22, 2400, 220); // the room answering
}
/** the hammer falls on an empty chamber */
export function playClick(volume = 0.5): void {
  if (muted) return;
  const a = audioCtx(); if (!a) return;
  const t = a.currentTime + 0.01;
  tick(a, t, volume, 2600);
  tick(a, t + 0.07, volume * 0.6, 1700);
}
/** the hammer being cocked as the gun goes up: one short tick, so the shot follows right behind it */
export function playCock(volume = 0.4): void {
  if (muted) return;
  const a = audioCtx(); if (!a) return;
  tick(a, a.currentTime + 0.005, volume, 1500);
}
/** the cylinder being spun / the hammer cocked: a few ticks, getting closer together */
export function playSpin(volume = 0.35): void {
  if (muted) return;
  const a = audioCtx(); if (!a) return;
  const t = a.currentTime + 0.01;
  [0, 0.09, 0.17, 0.24, 0.30, 0.35].forEach((dt, i) => tick(a, t + dt, volume * (0.5 + i * 0.1), 1900 + i * 140));
}
/** something heavy hits the floor (the body, the gun) */
export function playThud(volume = 0.5): void {
  if (muted) return;
  const a = audioCtx(); if (!a) return;
  const t = a.currentTime + 0.01;
  thump(a, t, 220, volume, 110, 40);
  noiseBurst(a, t, 120, volume * 0.3, 1200, 200);
}
/** blood hitting the floor */
export function playSplat(volume = 0.35): void {
  if (muted) return;
  const a = audioCtx(); if (!a) return;
  noiseBurst(a, a.currentTime + 0.01, 180, volume, 1800, 250);
}
