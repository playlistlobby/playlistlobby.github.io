// Boomboxes and the CD player: one CD at a time per room. The state lives at rooms/<room>/cdplayer (only this server writes it; the browser may
// only clear it once it has finished). The CD you put in is "loaned" (inPlayer = the room) until it ends, is ejected, or you come back later.
// The walkman (room "walk") is the same thing for one player, wherever they are: its state is at walkman/<uid>.
// The full album plays song after song: `index` is the song, and next / back / advance move it on.
import { Action, int, requireInRoom, text } from "./util";
import { findSlot } from "../../../src/shared/items";
import { fail } from "../ctx";
import { albumList, CD_ITEMS, isCdItem, JUKEBOX_PRICE, parsePressedCd } from "../../../src/shared/cds";

interface CdRow { by?: string; endsAt?: number; startedAt?: number; pausedAt?: number; durationMs?: number; track?: string; index?: number; album?: string }
/** a paused CD that nobody continues is given up after this long */
const PAUSE_MAX_MS = 10 * 60_000;
/** the album has a moment between two songs for somebody's browser to move it on */
const ALBUM_GRACE_MS = 15_000;
const live = (r: CdRow | null, now: number): boolean => !!r && (r.track === "sc" ||  typeof r.endsAt === "number" && (r.pausedAt ? now - r.pausedAt < PAUSE_MAX_MS : r.endsAt + (r.track === "album" && (r.index ?? 0) < albumList(r.album).length - 1 ? ALBUM_GRACE_MS : 0) > now));
const roomOf = (v: unknown): string => {
  const room = text(v, /^[A-Za-z0-9_-]{1,60}$/, "room");
  if (room !== "lobby" && room !== "walk" && !/^[uh]_[A-Za-z0-9]{1,40}$/.test(room)) fail("There's no music player there.");
  return room;
};
/** where a player's CD player keeps its state: a room's speaker, or (room "walk") the player's own walkman */
const pathOf = (room: string, uid: string): string => (room === "walk" ? `walkman/${uid}` : `rooms/${room}/cdplayer`);
/** the room's player works with the CD in it: how long a song is comes from the browser (it loaded the file), within sane limits */
const songMs = (v: unknown): number => int(v, 10_000, 1_800_000, "length");

export const cdInsert: Action = {
  locks: () => ["cd"],
  async run(c, a) {
    const room = roomOf(a.room ?? "lobby");
    const w = await c.user();
    if (room === "walk") { if (findSlot(w.s.inventory, "walkman") < 0) fail("You need your walkman for that."); } else await requireInRoom(c, room);
    const path = (r: string): string => pathOf(r, c.uid);
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it || !isCdItem(it.item) || it.inPlayer) fail("That isn't a CD you can use.");
    if (room === "walk" && w.s.inventory.some((x) => isCdItem(x?.item) && x?.inPlayer)) fail("A CD of yours is playing already.");
    if (room !== "walk" && w.s.inventory.some((x) => isCdItem(x?.item) && x?.inPlayer === "walk")) fail("Your walkman is playing: take the CD out of it first.");
    const pressed = parsePressedCd(it!.item);
    const def = CD_ITEMS[it!.item];
    const cur = await c.db.get<CdRow>(path(room));
    if (live(cur, c.now)) fail(room === "walk" ? "There is a CD in your walkman already." : "The CD player is busy.");
    if (a.jukebox === true) { // the basement's jukebox: you pick the CD and pay to have it played (the CD is yours again when it has finished)
      if (room !== "lobby") fail("The jukebox is in the basement.");
      if (w.s.blood < JUKEBOX_PRICE) fail(`You need ${JUKEBOX_PRICE - w.s.blood} more drops`);
      w.s.blood -= JUKEBOX_PRICE;
      c.note = "jukebox";
    }
    if (pressed) {
      // a CD made at a CD printer: its song is read from SoundCloud (or from the archive, once it has been taken off), the length comes from there too
      let song = await c.db.get<{ ready?: boolean; title?: string; ownerName?: string; durMs?: number; pieces?: number; mime?: string }>(`songs/${pressed.song}`);
      if (!song || song.ready !== true) song = await c.db.get(`songArchive/${pressed.song}`);
      if (!song || typeof song.durMs !== "number" || typeof song.pieces !== "number") fail("That CD is scratched: the song is gone.");
      const ms = song!.durMs!;
      w.s.inventory = w.s.inventory.map((x, i) => (i === slot && x ? { ...x, inPlayer: room } : x));
      c.extra[path(room)] = {
        by: c.uid, byName: String(w.raw.name ?? "").slice(0, 16), track: "pressed", title: `${song!.title ?? "?"} - ${song!.ownerName ?? "?"}`.slice(0, 60),
        song: { id: pressed.song, pieces: song!.pieces, mime: String(song!.mime || "audio/mpeg") }, startedAt: c.now, endsAt: c.now + ms, durationMs: ms,
      };
      return { startedAt: c.now, endsAt: c.now + ms };
    }
    const ms = songMs(a.durationMs);
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot && x ? { ...x, inPlayer: room } : x));
    const album = def.track === "album";
    c.extra[path(room)] = {
      by: c.uid, byName: String(w.raw.name ?? "").slice(0, 16), track: def.track, title: album ? albumList(def.album)[0].title : def.title,
      ...(album ? { index: 0, ...(def.album ? { album: def.album } : {}) } : {}), startedAt: c.now, endsAt: c.now + ms, durationMs: ms,
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
    const path = (r: string): string => pathOf(r, c.uid);
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
    const cur = await c.db.get<CdRow>(pathOf(room, c.uid));
    return ["cd", ...(cur?.by ? [`user:${cur.by}`] : [])];
  },
  async run(c, a) {
    const room = roomOf(a.room ?? "lobby");
    if (room !== "walk") await requireInRoom(c, room);
    const path = (r: string): string => pathOf(r, c.uid);
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
      if (next >= albumList(row.album).length) return {}; // the last song: the album ends the way a CD ends
      c.extra[path(room)] = { ...row, index: next, title: albumList(row.album)[next].title, startedAt: c.now, endsAt: c.now + songMs(a.durationMs), durationMs: songMs(a.durationMs) };
      return {};
    }
    if (!live(cur, c.now)) fail("Nothing is playing.");
    if (row.by !== c.uid && room !== "walk" && room !== `u_${c.uid}` && room !== `h_${c.uid}` && !c.isAdmin) fail("Only the one who put the CD in (or the room's owner) can do that.");
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
      const to = Math.max(0, Math.min(albumList(row.album).length - 1, row.index! + (op === "next" ? 1 : -1)));
      if (op === "next" && row.index! >= albumList(row.album).length - 1) fail("That's the last song.");
      const ms = songMs(a.durationMs);
      const { pausedAt: _p, ...rest } = row;
      c.extra[path(room)] = { ...rest, index: to, title: albumList(row.album)[to].title, startedAt: c.now, endsAt: c.now + ms, durationMs: ms };
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
