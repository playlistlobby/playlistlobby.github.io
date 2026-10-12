import { assetUrl } from "./assetUrl";

// Tracks players can stream once they own the jukebox pass. Drop more mp3s into public/music/ and list them here.
export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const TRACKS: Track[] = [
  { id: "sample", title: "Hotel jingle (placeholder)", artist: "swap me in src/music.ts", url: assetUrl("music/sample.mp3") },
];

type Listener = () => void;

/** One shared <audio> element so music keeps playing while you move between views. */
class MusicPlayer {
  readonly audio = new Audio();
  current: Track | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    this.audio.preload = "none";
    this.audio.volume = 0.6;
    for (const ev of ["play", "pause", "timeupdate", "loadedmetadata", "ended", "error", "volumechange"]) {
      this.audio.addEventListener(ev, () => {
        if (ev === "ended") this.next();
        this.emit();
      });
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  get playing(): boolean {
    return !this.audio.paused;
  }
  get failed(): boolean {
    return !!this.audio.error;
  }

  play(track: Track): void {
    if (this.current?.id !== track.id) {
      this.current = track;
      this.audio.src = track.url; // browser streams it with range requests, nothing is preloaded
    }
    void this.audio.play().catch(() => this.emit());
    this.emit();
  }

  toggle(): void {
    if (!this.current) return this.play(TRACKS[0]);
    if (this.audio.paused) void this.audio.play().catch(() => this.emit());
    else this.audio.pause();
  }

  next(): void {
    if (!this.current) return;
    const i = TRACKS.findIndex((t) => t.id === this.current!.id);
    this.play(TRACKS[(i + 1) % TRACKS.length]);
  }

  seek(fraction: number): void {
    if (Number.isFinite(this.audio.duration)) this.audio.currentTime = fraction * this.audio.duration;
  }

  setVolume(v: number): void {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  stop(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.current = null;
    this.emit();
  }
}

export const player = new MusicPlayer();

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
