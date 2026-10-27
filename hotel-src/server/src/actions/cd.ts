// Boomboxes and the CD player: one CD at a time per room. The state lives at rooms/<room>/cdplayer (only this server writes it; the browser may
// only clear it once it has finished). The CD you put in is "loaned" (inPlayer = the room) until it ends, is ejected, or you come back later.
// The full album plays song after song: `index` is the song, and next / back / advance move it on.
import { Action, int, requireInRoom, text } from "./util";
import { fail } from "../ctx";
import { ALBUM_TRACKS, CD_ITEMS, isCdItem } from "../../../src/shared/cds";

interface CdRow { by?: string; endsAt?: number; startedAt?: number; pausedAt?: number; durationMs?: number; track?: string; index?: number }
/** a paused CD that nobody continues is given up after this long */
const PAUSE_MAX_MS = 10 * 60_000;
/** the album has a moment between two songs for somebody's browser to move it on */
const ALBUM_GRACE_MS = 15_000;
const live = (r: CdRow | null, now: number): boolean => !!r && (r.track === "sc" ||  typeof r.endsAt === "number" && (r.pausedAt ? now - r.pausedAt < PAUSE_MAX_MS : r.endsAt + (r.track === "album" && (r.index ?? 0) < ALBUM_TRACKS.length - 1 ? ALBUM_GRACE_MS : 0) > now));
const roomOf = (v: unknown): string => {
  const room = text(v, /^[A-Za-z0-9_-]{1,60}$/, "room");
  if (room !== "lobby" && !/^[uh]_[A-Za-z0-9]{1,40}$/.test(room)) fail("There's no music player there.");
  return room;
};
const path = (room: string): string => `rooms/${room}/cdplayer`;
/** the room's player works with the CD in it: how long a song is comes from the browser (it loaded the file), within sane limits */
const songMs = (v: unknown): number => int(v, 10_000, 1_800_000, "length");

export const cdInsert: Action = {
  locks: () => ["cd"],
  async run(c, a) {
    const room = roomOf(a.room ?? "lobby");
    await requireInRoom(c, room);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it || !isCdItem(it.item) || it.inPlayer) fail("That isn't a CD you can use.");
    const def = CD_ITEMS[it!.item];
    const cur = await c.db.get<CdRow>(path(room));
    if (live(cur, c.now)) fail("The CD player is busy.");
    const ms = songMs(a.durationMs);
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot && x ? { ...x, inPlayer: room } : x));
    const album = def.track === "album";
    c.extra[path(room)] = {
      by: c.uid, byName: String(w.raw.name ?? "").slice(0, 16), track: def.track, title: album ? ALBUM_TRACKS[0].title : def.title,
      ...(album ? { index: 0 } : {}), startedAt: c.now, endsAt: c.now + ms, durationMs: ms,
    };
    return { startedAt: c.now, endsAt: c.now + ms };
  },
};

/** Gives the CD back (it finished, was stopped, or you were away); if it is still playing and it's yours, this stops it. */
export const cdReturn: Action = {
  locks: () => ["cd"],
  async run(c) {
    const w = await c.user();
    const slot = w.s.inventory.findIndex((x) => isCdItem(x?.item) && x?.inPlayer);
    if (slot < 0) return {};
    const flag = w.s.inventory[slot]!.inPlayer;
    const room = typeof flag === "string" ? flag : "lobby";
    const cur = await c.db.get<CdRow>(path(room));
    w.s.inventory = w.s.inventory.map((x, i) => {
      if (i !== slot || !x) return x;
      const { inPlayer: _gone, ...rest } = x;
      return rest;
    });
    if (cur && cur.by === c.uid) c.extra[path(room)] = null;
    return {};
  },
};

/** Pause, play on, play from the start, eject, and (album) next / back: for whoever put the CD in, and for the owner of the room. "advance" is the album moving on by itself. */
export const cdControl: Action = {
  locks: async (c, a) => {
    const room = roomOf(a?.room ?? "lobby");
    const cur = await c.db.get<CdRow>(path(room));
    return ["cd", ...(cur?.by ? [`user:${cur.by}`] : [])];
  },
  async run(c, a) {
    const room = roomOf(a.room ?? "lobby");
    await requireInRoom(c, room);
    const cur = await c.db.get<CdRow & Record<string, unknown>>(path(room));
    const op = text(a.op, /^(pause|play|restart|eject|next|prev|advance)$/, "button");
    const row = cur!;
    if (row?.track === "sc") fail("SoundCloud is on the speaker: use its buttons.");
    const album = row?.track === "album" && typeof row.index === "number";
    if (op === "advance") {
      // the song is over: anyone in the room may move the album on (the first request wins, the rest see the new song and do nothing)
      if (!row || !album || !row.endsAt) fail("Nothing to move on.");
      if (a.from !== row.index) return {};
      if (c.now < row.endsAt! - 2000 || row.pausedAt) fail("The song isn't over yet.");
      const next = row.index! + 1;
      if (next >= ALBUM_TRACKS.length) return {}; // the last song: the album ends the way a CD ends
      c.extra[path(room)] = { ...row, index: next, title: ALBUM_TRACKS[next].title, startedAt: c.now, endsAt: c.now + songMs(a.durationMs), durationMs: songMs(a.durationMs) };
      return {};
    }
    if (!live(cur, c.now)) fail("Nothing is playing.");
    if (row.by !== c.uid && room !== `u_${c.uid}` && room !== `h_${c.uid}` && !c.isAdmin) fail("Only the one who put the CD in (or the room's owner) can do that.");
    const duration = row.durationMs ?? Math.max(10_000, (row.endsAt ?? c.now) - (row.startedAt ?? c.now));
    const started = row.startedAt ?? c.now;
    if (op === "pause") {
      if (!row.pausedAt) c.extra[path(room)] = { ...row, pausedAt: c.now };
    } else if (op === "play") {
      if (row.pausedAt) {
        const begin = c.now - (row.pausedAt - started);
        const { pausedAt: _p, ...rest } = row;
        c.extra[path(room)] = { ...rest, startedAt: begin, endsAt: begin + duration, durationMs: duration };
      }
    } else if (op === "restart") {
      const { pausedAt: _p, ...rest } = row;
      c.extra[path(room)] = { ...rest, startedAt: c.now, endsAt: c.now + duration, durationMs: duration };
    } else if (op === "next" || op === "prev") {
      if (!album) fail("That CD only has one song.");
      if (a.from !== row.index) return {}; // someone already pressed it
      const to = Math.max(0, Math.min(ALBUM_TRACKS.length - 1, row.index! + (op === "next" ? 1 : -1)));
      if (op === "next" && row.index! >= ALBUM_TRACKS.length - 1) fail("That's the last song.");
      const ms = songMs(a.durationMs);
      const { pausedAt: _p, ...rest } = row;
      c.extra[path(room)] = { ...rest, index: to, title: ALBUM_TRACKS[to].title, startedAt: c.now, endsAt: c.now + ms, durationMs: ms };
    } else {
      // eject: the CD goes back to whoever put it in
      if (row.by) {
        const owner = await c.user(row.by);
        const slot = owner.s.inventory.findIndex((x) => isCdItem(x?.item) && x?.inPlayer);
        if (slot >= 0) owner.s.inventory = owner.s.inventory.map((x, i) => { if (i !== slot || !x) return x; const { inPlayer: _g, ...rest } = x; return rest; });
      }
      c.extra[path(room)] = null;
    }
    return {};
  },
};
