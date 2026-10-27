// SoundCloud in the browser (the rules: src/shared/songs.ts; the server does the uploading and the voting: server/src/actions/songs.ts): the live list of songs, your votes, the actions,
// and the player that plays a list (in order, shuffled, one song on loop) with the browser's own <audio> element.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { audioLength, audioUrl, putPieces } from "./audio";
import { AUDIO_LIMITS, titleFromName } from "./shared/audio";
import { cleanTitle, parseSongs, SONGS_PER_PLAYER } from "./shared/songs";
import type { Song } from "./shared/songs";
import { musicMuted, onMusicMuteChange } from "./sfx";

/** every song that is on SoundCloud, live */
export function watchSongs(cb: (songs: Song[]) => void): () => void {
  return onValue(ref(db, "songs"), (s) => cb(parseSongs(s.val())), () => cb([]));
}
/** your own votes (song id -> 1 or -1), live */
export function watchMyVotes(uid: string, cb: (votes: Record<string, number>) => void): () => void {
  return onValue(ref(db, `myVotes/${uid}`), (s) => {
    const v = (s.val() ?? {}) as Record<string, unknown>;
    cb(Object.fromEntries(Object.entries(v).filter(([, x]) => x === 1 || x === -1).map(([k, x]) => [k, x as number])));
  }, () => cb({}));
}
/** how much of today's 1,000 you have given to hideouts, live */
export function watchDonated(uid: string, cb: (given: number) => void): () => void {
  return onValue(ref(db, `donations/${uid}`), (s) => {
    const v = s.val() as { day?: number; n?: number } | null;
    cb(v && v.day === Math.floor(Date.now() / 86_400_000) ? Number(v.n) || 0 : 0);
  }, () => cb(0));
}

export const voteSong = (p: Profile, id: string, v: 1 | -1 | 0): Promise<{ up: number; down: number; v: number }> => call(p, "songVote", { id, v });
export const deleteSong = (p: Profile, id: string): Promise<unknown> => call(p, "songDelete", { id });
export const sweepSongs = (p: Profile): Promise<{ swept: number }> => call(p, "songSweep");
export const donateToHideout = (p: Profile, room: string, amount: number): Promise<{ given: number; left: number }> => call(p, "hideoutDonate", { room, amount });

/** Checks a file before it is sent (the server checks again): returns what is wrong, or the length. */
export async function checkSongFile(file: File): Promise<{ error: string } | { durMs: number }> {
  const lim = AUDIO_LIMITS.song;
  if (file.size > lim.bytes) return { error: `That file is ${(file.size / 1e6).toFixed(1)} MB. A song can be 4 MB at most.` };
  const durMs = await audioLength(file);
  if (durMs === null) return { error: "That file can't be played. Use an mp3, wav, ogg or m4a." };
  if (durMs < lim.minMs || durMs > lim.maxMs) return { error: `That song is ${Math.floor(durMs / 60000)}:${String(Math.round((durMs % 60000) / 1000)).padStart(2, "0")}. It has to be between 10 seconds and 3 minutes.` };
  return { durMs };
}
/** Uploads a song: describes it to the server, writes the pieces, and tells the server it is all there. */
export async function uploadSong(p: Profile, file: File, title: string, durMs: number, onProgress?: (f: number) => void): Promise<{ id: string }> {
  const begun = await call<{ id: string; pieces: number }>(p, "songBegin", { title: cleanTitle(title) || cleanTitle(titleFromName(file.name)), durMs, size: file.size, mime: file.type || "audio/mpeg" });
  await putPieces(begun.id, file, onProgress);
  await call(p, "songFinish", { id: begun.id });
  return { id: begun.id };
}
export const SONG_SLOTS = SONGS_PER_PLAYER;

// ---- the player ----------------------------------------------------------------------------------------------------------------------------------
export interface PlayerState { queue: Song[]; index: number; playing: boolean; loop: boolean; shuffle: boolean; loading: boolean; position: number; duration: number; error: string }
type Listener = () => void;

/** Plays a list of songs: next one on its own, shuffled if asked, one song on loop. One player for the whole page; it follows the Music switch of the menu. */
class ScPlayer {
  private audio = new Audio();
  private listeners = new Set<Listener>();
  state: PlayerState = { queue: [], index: -1, playing: false, loop: false, shuffle: false, loading: false, position: 0, duration: 0, error: "" };
  private token = 0;

  constructor() {
    this.audio.preload = "auto";
    this.audio.addEventListener("ended", () => { if (this.state.loop) { this.audio.currentTime = 0; void this.audio.play(); } else void this.next(); });
    this.audio.addEventListener("timeupdate", () => { this.state.position = this.audio.currentTime * 1000; this.emit(); });
    this.audio.addEventListener("loadedmetadata", () => { this.state.duration = Number.isFinite(this.audio.duration) ? this.audio.duration * 1000 : 0; this.emit(); });
    this.audio.addEventListener("play", () => { this.state.playing = true; this.emit(); });
    this.audio.addEventListener("pause", () => { this.state.playing = false; this.emit(); });
    this.audio.muted = musicMuted();
    onMusicMuteChange(() => { this.audio.muted = musicMuted(); });
  }
  subscribe(fn: Listener): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(): void { this.listeners.forEach((l) => l()); }
  get current(): Song | null { return this.state.queue[this.state.index] ?? null; }

  /** plays `list` from `start`; with `shuffle` the order is mixed (the song you tapped goes first) */
  async playList(list: Song[], start = 0, shuffle = false): Promise<void> {
    const first = list[start];
    let queue = [...list];
    if (shuffle) {
      queue = queue.filter((s) => s !== first);
      for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
      if (first) queue.unshift(first);
      start = 0;
    }
    this.state.queue = queue; this.state.shuffle = shuffle;
    await this.playAt(start);
  }
  private async playAt(i: number): Promise<void> {
    const s = this.state.queue[i];
    if (!s) { this.stop(); return; }
    const mine = ++this.token;
    this.state.index = i; this.state.loading = true; this.state.error = ""; this.state.position = 0; this.state.duration = s.durMs; this.emit();
    try {
      const url = await audioUrl(s.id, s.pieces, s.mime);
      if (mine !== this.token) return;
      this.audio.src = url;
      await this.audio.play();
      this.state.loading = false; this.emit();
    } catch (err) {
      if (mine !== this.token) return;
      this.state.loading = false; this.state.error = (err as Error).message || "Couldn't play that."; this.emit();
    }
  }
  async next(): Promise<void> { if (this.state.queue.length) await this.playAt((this.state.index + 1) % this.state.queue.length); }
  async prev(): Promise<void> { if (this.audio.currentTime > 4) { this.audio.currentTime = 0; return; } if (this.state.queue.length) await this.playAt((this.state.index - 1 + this.state.queue.length) % this.state.queue.length); }
  toggle(): void { if (!this.current) return; if (this.audio.paused) void this.audio.play().catch(() => undefined); else this.audio.pause(); }
  seek(fraction: number): void { if (Number.isFinite(this.audio.duration)) this.audio.currentTime = Math.max(0, Math.min(1, fraction)) * this.audio.duration; }
  setLoop(on: boolean): void { this.state.loop = on; this.emit(); }
  stop(): void {
    this.token++;
    this.audio.pause(); this.audio.removeAttribute("src"); this.audio.load();
    this.state = { ...this.state, queue: [], index: -1, playing: false, loading: false, position: 0, duration: 0, error: "" };
    this.emit();
  }
}
export const scPlayer = new ScPlayer();
