// Boomboxes and the CD player: one CD at a time per room. The state lives at rooms/<room>/cdplayer (only this server writes it; the browser may
// only clear it once it has finished). The CD you put in is "loaned" (inPlayer = the room) until it ends, is ejected, or you come back later.
import { Action, int, requireInRoom, text } from "./util";
import { fail } from "../ctx";

interface CdRow { by?: string; endsAt?: number; startedAt?: number; pausedAt?: number; durationMs?: number }
/** a paused CD that nobody continues is given up after this long */
const PAUSE_MAX_MS = 10 * 60_000;
const live = (r: CdRow | null, now: number): boolean => !!r && typeof r.endsAt === "number" && (r.pausedAt ? now - r.pausedAt < PAUSE_MAX_MS : r.endsAt > now);
const roomOf = (v: unknown): string => {
  const room = text(v, /^[A-Za-z0-9_-]{1,60}$/, "room");
  if (room !== "lobby" && !/^u_[A-Za-z0-9]{1,40}$/.test(room)) fail("There's no music player there.");
  return room;
};
const path = (room: string): string => `rooms/${room}/cdplayer`;
const TRACK = { track: "freakme", title: "Freakme" };

export const cdInsert: Action = {
  locks: () => ["cd"],
  async run(c, a) {
    const room = roomOf(a.room ?? "lobby");
    await requireInRoom(c, room);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it || it.item !== "cd" || it.inPlayer) fail("That isn't a CD you can use.");
    const cur = await c.db.get<CdRow>(path(room));
    if (live(cur, c.now)) fail("The CD player is busy.");
    const ms = int(a.durationMs, 10_000, 1_800_000, "length");
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot && x ? { ...x, inPlayer: room } : x));
    c.extra[path(room)] = { by: c.uid, byName: String(w.raw.name ?? "").slice(0, 16), ...TRACK, startedAt: c.now, endsAt: c.now + ms, durationMs: ms };
    return { startedAt: c.now, endsAt: c.now + ms };
  },
};

/** Gives the CD back (it finished, was stopped, or you were away); if it is still playing and it's yours, this stops it. */
export const cdReturn: Action = {
  locks: () => ["cd"],
  async run(c) {
    const w = await c.user();
    const slot = w.s.inventory.findIndex((x) => x?.item === "cd" && x.inPlayer);
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

/** Pause, play on, play from the start, eject: for whoever put the CD in, and for the owner of the room. */
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
    if (!live(cur, c.now)) fail("Nothing is playing.");
    const row = cur!;
    if (row.by !== c.uid && room !== `u_${c.uid}` && !c.isAdmin) fail("Only the one who put the CD in (or the room's owner) can do that.");
    const op = text(a.op, /^(pause|play|restart|eject)$/, "button");
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
    } else {
      // eject: the CD goes back to whoever put it in
      if (row.by) {
        const owner = await c.user(row.by);
        const slot = owner.s.inventory.findIndex((x) => x?.item === "cd" && x.inPlayer);
        if (slot >= 0) owner.s.inventory = owner.s.inventory.map((x, i) => { if (i !== slot || !x) return x; const { inPlayer: _g, ...rest } = x; return rest; });
      }
      c.extra[path(room)] = null;
    }
    return {};
  },
};
