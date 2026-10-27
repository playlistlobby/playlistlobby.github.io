// Ghosts: a player's entry in a room (rooms/<room>/players/<uid>) is written by their own browser and removed when they leave or the connection drops. Now and then an entry is left
// behind (a closed tab, a crash, a second window): the player is long gone, or online somewhere else, but the model keeps standing in the room. Whoever is in a room asks the server
// to sweep it (when they arrive and every few minutes): an entry goes when its player has no presence at all, is online in another room, or has been silent for half an hour.
import { Action, text } from "./util";

const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;
/** an entry this new is left alone (the player is only just walking in: their presence may not say so yet) */
const NEW_MS = 20_000;
/** a player whose presence says they were last seen this long ago is gone (a phone put down stays on for much less than this: the browsers hide it meanwhile) */
const SILENT_MS = 30 * 60_000;

export const roomSweep: Action = {
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const players = await c.db.get<Record<string, { ts?: number } | null>>(`rooms/${room}/players`);
    let removed = 0;
    for (const [uid, p] of Object.entries(players ?? {})) {
      if (uid === c.uid) continue;
      const joined = typeof p?.ts === "number" ? p.ts : 0;
      if (c.now - joined < NEW_MS) continue;
      const pr = await c.db.get<{ room?: string; seen?: number; since?: number } | null>(`presence/${uid}`);
      const seen = typeof pr?.seen === "number" ? pr.seen : typeof pr?.since === "number" ? pr.since : 0;
      const gone = !pr || c.now - seen > SILENT_MS; // (logged out, or silent for good)
      const elsewhere = !!pr && typeof pr.room === "string" && pr.room !== "" && pr.room !== room && c.now - seen < SILENT_MS; // (online, standing in another room)
      if (gone || elsewhere) { c.extra[`rooms/${room}/players/${uid}`] = null; removed++; }
    }
    return { removed };
  },
};
