// SoundCloud, the site on every hideout computer: players upload songs, everybody votes them up or down, and the 10 best make the Charts. Pure rules shared by the browser and the server
// (server/src/actions/songs.ts does the uploading, the voting and the hourly clean-up).
//   songs/<id>          { owner, ownerName, title, durMs, size, mime, pieces, at, up, down, pressed? }   the id is also the id of its audio (audioMeta/<id>, audio/<id>/<i>)
//   songVotes/<id>/<uid> 1 or -1
//   songArchive/<id>    a song that was taken off SoundCloud but is on CDs: its description, so the CDs still play (its audio stays)
//   songMeta/lastSweep  when the hourly clean-up last ran

/** how many songs one player can have on SoundCloud at once, and how many there can be in all (the storage is small) */
export const SONGS_PER_PLAYER = 5;
export const SONGS_TOTAL_MAX = 60;
/** the Charts: the best this many */
export const CHARTS_SIZE = 10;
/** every hour the worst quarter of the songs (by rating) is taken off, but never one that is younger than an hour, and never below the Charts' size */
export const SWEEP_EVERY_MS = 60 * 60_000;
export const SWEEP_SHARE = 0.25;
export const SWEEP_MIN_AGE_MS = 60 * 60_000;

export interface Song {
  id: string;
  owner: string;
  ownerName: string;
  title: string;
  durMs: number;
  size: number;
  mime: string;
  pieces: number;
  at: number;
  up: number;
  down: number;
  pressed: number;
}

const str = (v: unknown, n: number): string => String(v ?? "").slice(0, n);
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
/** the songs node as a list (only the ones that are ready: a song that is still being uploaded has no `ready` flag) */
export function parseSongs(v: any): Song[] {
  if (!v || typeof v !== "object") return [];
  const out: Song[] = [];
  for (const [id, s] of Object.entries<any>(v)) {
    if (!s || typeof s.owner !== "string" || typeof s.title !== "string" || s.ready !== true) continue;
    out.push({ id, owner: s.owner, ownerName: str(s.ownerName, 20), title: str(s.title, 40), durMs: num(s.durMs), size: num(s.size), mime: str(s.mime, 30), pieces: num(s.pieces), at: num(s.at), up: Math.max(0, num(s.up)), down: Math.max(0, num(s.down)), pressed: Math.max(0, num(s.pressed)) });
  }
  return out;
}

/** the rating: the share of up votes, smoothed so that one up vote does not beat ten up and one down (Laplace: (up + 1) / (up + down + 2)) */
export const ratingOf = (s: Pick<Song, "up" | "down">): number => (s.up + 1) / (s.up + s.down + 2);
/** best first: the rating, then more votes, then the older one */
export const byRating = (a: Song, b: Song): number => ratingOf(b) - ratingOf(a) || b.up + b.down - (a.up + a.down) || a.at - b.at;
/** the Charts: the 10 best-rated songs */
export const chartsOf = (songs: Song[]): Song[] => [...songs].sort(byRating).slice(0, CHARTS_SIZE);

/** the songs the hourly clean-up takes off: the worst quarter by rating, only songs older than an hour, and never so many that fewer than 10 are left */
export function sweepVictims(songs: Song[], now: number): Song[] {
  const total = songs.length;
  const n = Math.min(Math.floor(total * SWEEP_SHARE), Math.max(0, total - CHARTS_SIZE));
  if (n <= 0) return [];
  return [...songs].filter((s) => now - s.at >= SWEEP_MIN_AGE_MS).sort((a, b) => ratingOf(a) - ratingOf(b) || a.up + a.down - (b.up + b.down) || a.at - b.at).slice(0, n);
}

/** the title of a song: letters, numbers and a few marks, no emoji (SoundCloud has none) */
export const cleanTitle = (v: unknown): string => String(v ?? "").replace(/[^\p{L}\p{N} .,'&()+!?_-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);

/** what a hideout computer shows for the song the browsers play: the artist and the title */
export const songLabel = (s: Pick<Song, "ownerName" | "title">): string => `${s.ownerName} - ${s.title}`;

/** donations to a hideout on SoundCloud: this much per player per day, to the hideout's owner (collected with the table earnings) */
export const DONATE_DAILY_MAX = 1000;
