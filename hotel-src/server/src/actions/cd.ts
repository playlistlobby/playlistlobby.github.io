// The CD player in the basement. (CDs are switched off in the game for now, but the rules stay the same when they come back.)
import { Action, int, requireInRoom } from "./util";
import { fail } from "../ctx";

interface CdRow { by?: string; endsAt?: number }

export const cdInsert: Action = {
  locks: () => ["room:lobby"],
  async run(c, a) {
    await requireInRoom(c, "lobby");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it || it.item !== "cd" || it.inPlayer) fail("That isn't a CD you can use.");
    const cur = await c.db.get<CdRow>("rooms/lobby/cdplayer");
    if (cur && typeof cur.endsAt === "number" && cur.endsAt > c.now) fail("The CD player is busy.");
    const ms = int(a.durationMs, 10_000, 1_800_000, "length");
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot && x ? { ...x, inPlayer: true } : x));
    c.extra["rooms/lobby/cdplayer"] = { by: c.uid, byName: String(w.raw.name ?? "").slice(0, 16), track: "standin", title: "Stand-in track", startedAt: c.now, endsAt: c.now + ms };
    return { startedAt: c.now, endsAt: c.now + ms };
  },
};

/** Gives the CD back (it finished, was stopped, or you were away); if it is still playing and it's yours, this stops it. */
export const cdReturn: Action = {
  locks: () => ["room:lobby"],
  async run(c) {
    const w = await c.user();
    const slot = w.s.inventory.findIndex((x) => x?.item === "cd" && x.inPlayer);
    if (slot < 0) return {};
    const cur = await c.db.get<CdRow>("rooms/lobby/cdplayer");
    const playingMine = cur && cur.by === c.uid && typeof cur.endsAt === "number" && cur.endsAt > c.now;
    w.s.inventory = w.s.inventory.map((x, i) => {
      if (i !== slot || !x) return x;
      const { inPlayer: _gone, ...rest } = x;
      return rest;
    });
    if (playingMine || (cur && cur.by === c.uid)) c.extra["rooms/lobby/cdplayer"] = null;
    return {};
  },
};
