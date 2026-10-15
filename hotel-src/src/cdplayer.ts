import { get, onValue, ref, remove, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { call, serverNow } from "./db";
import type { Profile } from "./db";
import { assetUrl } from "./assetUrl";
import { onSfxMuteChange, sfxMuted } from "./sfx";
import { ALBUM_TRACKS, CD_ITEMS, isCdItem } from "./shared/cds";

// The CD player in the lobby plays whatever is on the CD you put in. For now every CD holds the same stand-in track.
// To give CDs different music later: add tracks here, store the track id on the inventory item, and pass it to insertCd.
export interface CdTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const CD_TRACKS: Record<string, CdTrack> = {
  freakme: { id: "freakme", title: "Freakme", artist: "Freakme", url: assetUrl("music/cd-freakme.mp3") },
  moyo: { id: "moyo", title: "Freakme", artist: "Freakme", url: assetUrl("music/cd-freakme.mp3") }, // (the old name: a CD that is still playing from before)
  standin: { id: "standin", title: "Stand-in track", artist: "swap me in src/cdplayer.ts", url: assetUrl("music/cd-standin.mp3") },
  // the three mystery CDs
  "ahmingud": { id: "ahmingud", title: "Åhmingud", artist: "Em", url: assetUrl("music/album-ahmingud.mp3") },
  "blodig-oktober": { id: "blodig-oktober", title: "Blodig oktober", artist: "Em", url: assetUrl("music/album-blodig-oktober.mp3") },
  "blod-ud-af-naesen": { id: "blod-ud-af-naesen", title: "Blod ud af næsen", artist: "Sonne, Em, Hxllxw", url: assetUrl("music/album-blod-ud-af-naesen.mp3") },
};
/** the song of the full album at this place (it plays song after song) */
export const albumCdTrack = (index: number): CdTrack => {
  const t = ALBUM_TRACKS[Math.max(0, Math.min(ALBUM_TRACKS.length - 1, index))];
  return { id: t.id, title: t.title, artist: t.by, url: assetUrl(`music/album-${t.id}.mp3`) };
};
/** what is playing right now: the CD's one song, or the song the album is on */
export const trackOfState = (s: { track: string; index?: number }): CdTrack | null => (s.track === "album" ? albumCdTrack(s.index ?? 0) : CD_TRACKS[s.track] ?? null);
export const DEFAULT_CD_TRACK = "freakme";

/** What's in the player right now. Lives at rooms/<room>/cdplayer so everyone in the room hears the same thing. */
export interface CdState {
  by: string;
  byName: string;
  track: string;
  title: string;
  /** server time the CD started (moved forward when it is played on after a pause), ms */
  startedAt: number;
  /** server time it finishes, ms */
  endsAt: number;
  /** the whole song, ms */
  durationMs?: number;
  /** set while it is paused: when (server time) */
  pausedAt?: number;
  /** the full album: which song it is on */
  index?: number;
}

const cdRef = (roomId: string) => ref(db, `rooms/${roomId}/cdplayer`);

export function watchCdPlayer(roomId: string, cb: (state: CdState | null) => void, onError?: () => void): Unsubscribe {
  return onValue(cdRef(roomId), (snap) => cb(snap.exists() ? (snap.val() as CdState) : null), onError);
}

/** a paused CD that nobody plays on is given up after this long */
export const PAUSE_MAX_MS = 10 * 60_000;
/** the album has a moment between two songs for somebody's browser to move it on before it counts as over */
export const ALBUM_GRACE_MS = 15_000;
export const cdEnded = (s: CdState): boolean => {
  if (s.pausedAt) return serverNow() - s.pausedAt > PAUSE_MAX_MS;
  const more = s.track === "album" && (s.index ?? 0) < ALBUM_TRACKS.length - 1;
  return serverNow() >= s.endsAt + (more ? ALBUM_GRACE_MS : 0);
};
/** how far into the song it is right now, ms (it stands still while paused) */
export const cdPositionMs = (s: CdState): number => Math.max(0, (s.pausedAt ?? serverNow()) - s.startedAt);

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

/** Puts the CD in `slot` into the player of this room (the server checks it is a CD, you are in the room and the player is free). */
export async function insertCd(me: Profile, slot: number, roomId: string): Promise<CdState> {
  const def = CD_ITEMS[me.inventory[slot]?.item ?? ""] ?? CD_ITEMS.cd;
  const track = def.track === "album" ? albumCdTrack(0) : CD_TRACKS[def.track] ?? CD_TRACKS[DEFAULT_CD_TRACK];
  const duration = await trackDurationMs(track);
  const r = await call<{ startedAt?: number; endsAt?: number }>(me, "cdInsert", { slot, room: roomId, durationMs: Math.round(duration) });
  return { by: me.uid, byName: me.name, track: def.track, title: track.title, startedAt: Number(r.startedAt) || serverNow(), endsAt: Number(r.endsAt) || Math.round(serverNow() + duration), durationMs: Math.round(duration), ...(def.track === "album" ? { index: 0 } : {}) };
}

/** Full album: next song, the song before, or (when a song has finished) the album moving on by itself. Measures the new song's length first. */
export async function albumStep(me: Profile, roomId: string, op: "next" | "prev" | "advance", from: number): Promise<void> {
  const to = op === "prev" ? Math.max(0, from - 1) : Math.min(ALBUM_TRACKS.length - 1, from + 1);
  const duration = await trackDurationMs(albumCdTrack(to));
  await call(me, "cdControl", { room: roomId, op, from, durationMs: Math.round(duration) });
}

/** Pause / play on / play from the start / eject (the one who put the CD in, and the owner of the room). */
export const controlCd = (me: Profile, roomId: string, op: "pause" | "play" | "restart" | "eject"): Promise<unknown> => call(me, "cdControl", { room: roomId, op });

/** Clears a CD that has finished (the server and the database rules only allow it once it is over). */
export const clearCdPlayer = (roomId: string): Promise<void> => remove(cdRef(roomId));

/** Hands a loaned-out CD back to its owner's inventory (the server does it). */
export async function returnCd(me: Profile): Promise<boolean> {
  if (!me.inventory.some((s) => isCdItem(s?.item) && s?.inPlayer)) return false;
  await call(me, "cdReturn");
  return true;
}

/**
 * If my CD isn't actually playing any more (finished, ejected, or I was away), it goes back in my inventory.
 * It remembers which room it is in: here the state is at hand, for another room it is looked up.
 */
export async function reconcileCd(me: Profile, roomId: string, state: CdState | null): Promise<boolean> {
  const loaned = me.inventory.find((s) => isCdItem(s?.item) && s?.inPlayer);
  if (!loaned) return false;
  const where = typeof loaned.inPlayer === "string" ? loaned.inPlayer : "lobby";
  let st = state;
  if (where !== roomId) st = await get(cdRef(where)).then((snap) => (snap.exists() ? (snap.val() as CdState) : null), () => null);
  if (st && st.by === me.uid && !cdEnded(st)) return false;
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
/** the boombox is loud: its slider goes to 100% but that is only half of the real volume */
const CD_VOLUME_SCALE = 0.5;

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
    // the app is hidden or closed: the music stops; when it is back the song carries on at the right place
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { this.audio.pause(); return; }
      if (this.state && !this.state.pausedAt && !cdEnded(this.state)) this.seekAndPlay();
    });
    window.addEventListener("pagehide", () => this.audio.pause());
    onSfxMuteChange(() => this.apply());
  }

  private apply(): void {
    this.audio.volume = this.muted ? 0 : this.volume * CD_VOLUME_SCALE; // the slider's 100% is half of the real loudness
    this.audio.muted = this.muted || sfxMuted(); // (`muted` works on iPhones, where the volume can't be set; the Sounds switch silences the CD too)
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

  /** seconds into the CD according to the shared clock (it stands still while the CD is paused) */
  get position(): number {
    return this.state ? cdPositionMs(this.state) / 1000 : 0;
  }

  /** Call whenever the shared state changes. */
  sync(state: CdState | null): void {
    this.state = state && !cdEnded(state) ? state : null;
    if (!this.state) {
      this.stop();
      return;
    }
    const track = trackOfState(this.state);
    if (!track) return this.stop();
    if (this.state.pausedAt) { this.audio.pause(); this.onChange(); return; } // paused: quiet until it is played on
    const key = `${this.state.by}:${this.state.startedAt}:${this.state.index ?? 0}`;
    if (key !== this.key) {
      this.key = key;
      this.audio.src = track.url;
      this.audio.addEventListener("loadedmetadata", () => this.seekAndPlay(), { once: true });
      this.audio.load();
    } else if (this.audio.paused) {
      this.tryPlay(); // played on after a pause (the song is already loaded)
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
