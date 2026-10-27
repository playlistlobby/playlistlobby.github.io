// SoundCloud on a hideout's speaker. It shares rooms/<room>/cdplayer with the CD player (one thing at a time), as a row with track "sc":
//   { by, byName, track: "sc", title, index, ids (the queue), loop, song {id, pieces, mime}, startedAt, endsAt, durationMs, pausedAt? }
// A member connects with their SoundCloud list; the speaker then keeps playing song after song for as long as it stays connected, even when
// the one who connected has walked away. Nobody keeps the clock running: whoever's browser sees a song end asks to move on ("advance"), and the
// server catches up over every song that ended in the meantime and skips the ones that were taken off SoundCloud. Members can skip and pause;
// the one who connected (and the hideout's owner) can change the loop and disconnect.
import { Action, hideoutAccess, int, requireInRoom, text, ID_RE } from "./util";
import { Ctx, fail } from "../ctx";
import { isHideoutId } from "../../../src/shared/hideout";

interface SongRow { owner?: string; ownerName?: string; title?: string; ready?: boolean; durMs?: number; mime?: string; pieces?: number }
interface ScRow {
  by: string; byName: string; track: "sc"; title: string; index: number; ids: string[]; loop: boolean;
  song: { id: string; pieces: number; mime: string }; startedAt: number; endsAt: number; durationMs: number; pausedAt?: number;
}
export const SPEAKER_QUEUE_MAX = 60;
const path = (room: string): string => `rooms/${room}/cdplayer`;
const hideoutRoom = (v: unknown): string => {
  const room = text(v, /^h_[A-Za-z0-9]{1,40}$/, "room");
  if (!isHideoutId(room)) fail("There's no speaker there.");
  return room;
};

/** a song of the queue that can still be played (on SoundCloud, or kept for the CDs made of it) */
async function playable(c: Ctx, id: string, cache: Map<string, SongRow | null>): Promise<SongRow | null> {
  if (cache.has(id)) return cache.get(id)!;
  let row = await c.db.get<SongRow>(`songs/${id}`);
  if (!row || row.ready !== true) row = await c.db.get<SongRow>(`songArchive/${id}`);
  const ok = row && typeof row.pieces === "number" && typeof row.durMs === "number" && row.durMs > 0 ? row : null;
  cache.set(id, ok);
  return ok;
}
const label = (s: SongRow): string => `${s.title ?? "?"} - ${s.ownerName ?? "?"}`.slice(0, 60);

/** the row for the song at queue place `at`, starting at `startedAt` (null if it can't be played) */
function rowAt(base: ScRow, at: number, song: SongRow, startedAt: number): ScRow {
  const { pausedAt: _p, ...rest } = base;
  const id = base.ids[at];
  return { ...rest, index: at, title: label(song), song: { id, pieces: song.pieces!, mime: String(song.mime || "audio/mpeg") }, startedAt, endsAt: startedAt + song.durMs!, durationMs: song.durMs! };
}
/** the next (or previous) playable place in the queue from `from`, going round; songs that are gone are dropped from the queue on the way */
async function step(c: Ctx, row: ScRow, dir: 1 | -1, cache: Map<string, SongRow | null>): Promise<{ row: ScRow; song: SongRow; at: number } | null> {
  let ids = [...row.ids];
  let from = row.index;
  for (let tries = 0; tries < SPEAKER_QUEUE_MAX + 1 && ids.length; tries++) {
    const at = (((from + dir) % ids.length) + ids.length) % ids.length;
    const song = await playable(c, ids[at], cache);
    if (song) return { row: { ...row, ids }, song, at };
    ids = ids.filter((_, i) => i !== at); // taken off SoundCloud: out of the queue
    from = dir === 1 ? at - 1 : at;
  }
  return null;
}

/** Moves the speaker over every song that has ended by `now`; null when there is nothing left to play. */
async function settle(c: Ctx, row: ScRow, now: number): Promise<ScRow | null> {
  const cache = new Map<string, SongRow | null>();
  let r = row;
  for (let guard = 0; guard < 400 && !r.pausedAt && now >= r.endsAt; guard++) {
    if (r.loop) {
      const song = await playable(c, r.ids[r.index], cache);
      if (song) { r = rowAt(r, r.index, song, r.endsAt); continue; }
    }
    const nxt = await step(c, r, 1, cache);
    if (!nxt) return null;
    r = rowAt(nxt.row, nxt.at, nxt.song, r.endsAt);
  }
  if (!r.pausedAt && now >= r.endsAt) { // (hours behind: start the song that is next now)
    const song = await playable(c, r.ids[r.index], cache);
    if (!song) return null;
    r = rowAt(r, r.index, song, now);
  }
  return r;
}

const isSc = (r: unknown): r is ScRow => !!r && (r as { track?: string }).track === "sc";

export const speakerConnect: Action = {
  locks: () => ["cd"],
  async run(c, a) {
    const room = hideoutRoom(a.room);
    const h = await hideoutAccess(c, room);
    if (!h.member) fail("Only the owner and the members can use the speaker.");
    await requireInRoom(c, room);
    const cur = await c.db.get<Record<string, unknown>>(path(room));
    if (cur && typeof cur.endsAt === "number") {
      if (isSc(cur)) fail(`${cur.byName} has SoundCloud on the speaker. They (or the owner) can disconnect it.`);
      if (!cur.pausedAt && cur.endsAt + 15_000 > c.now) fail("The speaker is busy.");
    }
    if (!Array.isArray(a.ids) || a.ids.length < 1) fail("Pick some songs first.");
    const cache = new Map<string, SongRow | null>();
    const ids: string[] = [];
    for (const v of a.ids.slice(0, SPEAKER_QUEUE_MAX * 2)) {
      const id = text(v, ID_RE, "song");
      if (ids.includes(id)) continue;
      if (await playable(c, id, cache)) ids.push(id);
      if (ids.length >= SPEAKER_QUEUE_MAX) break;
    }
    if (!ids.length) fail("Those songs aren't on SoundCloud any more.");
    const start = Math.min(ids.length - 1, a.start === undefined ? 0 : int(a.start, 0, SPEAKER_QUEUE_MAX * 2, "place"));
    const w = await c.user();
    const base: ScRow = { by: c.uid, byName: String(w.raw?.name ?? "").slice(0, 16), track: "sc", title: "", index: start, ids, loop: a.loop === true, song: { id: ids[start], pieces: 1, mime: "" }, startedAt: c.now, endsAt: c.now, durationMs: 0 };
    const row = rowAt(base, start, (await playable(c, ids[start], cache))!, c.now);
    c.extra[path(room)] = row;
    c.note = `speaker ${row.title}`;
    return { started: c.now, title: row.title };
  },
};

export const speakerControl: Action = {
  locks: () => ["cd"],
  async run(c, a) {
    const room = hideoutRoom(a.room);
    const op = text(a.op, /^(pause|play|next|prev|loop|disconnect|advance)$/, "button");
    await requireInRoom(c, room);
    const cur = await c.db.get<ScRow>(path(room));
    if (!isSc(cur)) fail("SoundCloud isn't on the speaker.");
    const row = cur as ScRow;
    if (op === "advance") {
      // a song is over: anybody in the room may move on (the first one wins; the rest find the song already changed and do nothing)
      if (row.pausedAt || c.now < row.endsAt - 2000) return {};
      const next = await settle(c, row, Math.max(c.now, row.endsAt));
      c.extra[path(room)] = next;
      return {};
    }
    const h = await hideoutAccess(c, room);
    if (!h.member) fail("Only the owner and the members can use the speaker.");
    const boss = row.by === c.uid || h.owner || c.isAdmin;
    if (op === "disconnect") {
      if (!boss) fail("Only the one who connected it (or the owner) can disconnect it.");
      c.extra[path(room)] = null;
      return {};
    }
    if (op === "loop") {
      if (!boss) fail("Only the one who connected it (or the owner) can change that.");
      c.extra[path(room)] = { ...row, loop: a.on === true };
      return {};
    }
    if (op === "pause") {
      if (!row.pausedAt) c.extra[path(room)] = { ...row, pausedAt: c.now };
      return {};
    }
    if (op === "play") {
      if (row.pausedAt) {
        const begin = c.now - (row.pausedAt - row.startedAt);
        const { pausedAt: _p, ...rest } = row;
        c.extra[path(room)] = { ...rest, startedAt: begin, endsAt: begin + row.durationMs };
      }
      return {};
    }
    // next / prev: `from` is the song the button was pressed on (a second press on the same song does nothing)
    if (a.from !== row.index) return {};
    const cache = new Map<string, SongRow | null>();
    const nxt = await step(c, row, op === "next" ? 1 : -1, cache);
    c.extra[path(room)] = nxt ? rowAt(nxt.row, nxt.at, nxt.song, c.now) : null;
    return {};
  },
};
