import { onValue, ref, remove, serverTimestamp, set, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { serverNow } from "./db";
import type { Profile } from "./db";
import { assetUrl } from "./assetUrl";

// The CD player in the lobby plays whatever is on the CD you put in. For now every CD holds the same stand-in track.
// To give CDs different music later: add tracks here, store the track id on the inventory item, and pass it to insertCd.
export interface CdTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const CD_TRACKS: Record<string, CdTrack> = {
  standin: { id: "standin", title: "Stand-in track", artist: "swap me in src/cdplayer.ts", url: assetUrl("music/cd-standin.mp3") },
};
export const DEFAULT_CD_TRACK = "standin";

/** What's in the player right now. Lives at rooms/lobby/cdplayer so everyone in the lobby hears the same thing. */
export interface CdState {
  by: string;
  byName: string;
  track: string;
  title: string;
  /** server time the CD started, ms */
  startedAt: number;
  /** server time it finishes, ms */
  endsAt: number;
}

const cdRef = ref(db, "rooms/lobby/cdplayer");

export function watchCdPlayer(cb: (state: CdState | null) => void, onError?: () => void): Unsubscribe {
  return onValue(cdRef, (snap) => cb(snap.exists() ? (snap.val() as CdState) : null), onError);
}

export const cdEnded = (s: CdState): boolean => serverNow() >= s.endsAt;

/** Loads just enough of the file to learn how long it is (falls back to a minute if it can't). */
export function trackDurationMs(track: CdTrack): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    const done = (ms: number) => { a.removeAttribute("src"); a.load(); resolve(ms); };
    a.preload = "metadata";
    a.addEventListener("loadedmetadata", () => done(Number.isFinite(a.duration) ? Math.round(a.duration * 1000) : 60_000), { once: true });
    a.addEventListener("error", () => done(60_000), { once: true });
    setTimeout(() => done(60_000), 6000);
    a.src = track.url;
  });
}

/** Puts the CD in `slot` into the player. Throws if the player is busy (the rules refuse a second CD). */
export async function insertCd(me: Profile, slot: number, trackId = DEFAULT_CD_TRACK): Promise<CdState> {
  const track = CD_TRACKS[trackId];
  const duration = await trackDurationMs(track);
  const state = { by: me.uid, byName: me.name, track: track.id, title: track.title, startedAt: serverTimestamp(), endsAt: Math.round(serverNow() + duration) };
  await set(cdRef, state);
  const item = me.inventory[slot];
  if (item) {
    await update(ref(db, `users/${me.uid}/inventory/${slot}`), { inPlayer: true });
    item.inPlayer = true;
  }
  return { ...state, startedAt: serverNow() };
}

/** Stops the CD early (only the person who inserted it may), or clears it once it has finished (anyone). */
export const clearCdPlayer = (): Promise<void> => remove(cdRef);

/** Hands a loaned-out CD back to its owner's inventory. */
export async function returnCd(me: Profile): Promise<boolean> {
  const slot = me.inventory.findIndex((s) => s?.item === "cd" && s.inPlayer);
  if (slot < 0) return false;
  await update(ref(db, `users/${me.uid}/inventory/${slot}`), { inPlayer: null });
  delete me.inventory[slot]!.inPlayer;
  return true;
}

/** If my CD isn't actually in the player any more (finished, stopped, or I was offline), it goes back in my inventory. */
export async function reconcileCd(me: Profile, state: CdState | null): Promise<boolean> {
  const loaned = me.inventory.some((s) => s?.item === "cd" && s.inPlayer);
  if (!loaned) return false;
  if (state && state.by === me.uid && !cdEnded(state)) return false;
  return returnCd(me).catch(() => false);
}

// ---- listening ---------------------------------------------------------------------------
const VOLUME_KEY = "bobba.cdVolume";

function loadVolume(): number {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && localStorage.getItem(VOLUME_KEY) !== null ? Math.max(0, Math.min(1, v)) : 0.5;
  } catch {
    return 0.5;
  }
}

/**
 * Plays the CD for this listener, lined up with everyone else (it seeks to wherever the track should be by now).
 * Volume is the listener's own: turning it down never affects anyone else.
 */
export class CdAudio {
  readonly audio = new Audio();
  volume = loadVolume();
  muted = false;
  /** set when the browser refused to autoplay (no click on the page yet) */
  blocked = false;
  private key: string | null = null;
  private state: CdState | null = null;

  constructor(private onChange: () => void) {
    this.audio.preload = "auto";
    this.apply();
  }

  private apply(): void {
    this.audio.volume = this.muted ? 0 : this.volume;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, Math.round(v * 100) / 100));
    if (this.volume > 0) this.muted = false;
    this.apply();
    try { localStorage.setItem(VOLUME_KEY, String(this.volume)); } catch { /* private mode */ }
    this.onChange();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.apply();
    this.onChange();
  }

  get playing(): boolean {
    return !!this.state && !this.audio.paused && !this.audio.ended;
  }

  /** seconds into the CD according to the shared clock */
  get position(): number {
    return this.state ? Math.max(0, (serverNow() - this.state.startedAt) / 1000) : 0;
  }

  /** Call whenever the shared state changes. */
  sync(state: CdState | null): void {
    this.state = state && !cdEnded(state) ? state : null;
    if (!this.state) {
      this.stop();
      return;
    }
    const track = CD_TRACKS[this.state.track];
    if (!track) return this.stop();
    const key = `${this.state.by}:${this.state.startedAt}`;
    if (key !== this.key) {
      this.key = key;
      this.audio.src = track.url;
      this.audio.addEventListener("loadedmetadata", () => this.seekAndPlay(), { once: true });
      this.audio.load();
    }
    this.onChange();
  }

  private seekAndPlay(): void {
    if (!this.state) return;
    const d = this.audio.duration;
    const pos = this.position;
    if (Number.isFinite(d) && pos >= d) return; // already over
    try { this.audio.currentTime = pos; } catch { /* some browsers need more data first */ }
    this.tryPlay();
  }

  tryPlay(): void {
    this.audio.play().then(() => { this.blocked = false; this.onChange(); }, () => { this.blocked = true; this.onChange(); });
  }

  stop(): void {
    this.state = null;
    this.key = null;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.onChange();
  }
}
