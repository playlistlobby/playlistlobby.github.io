// Admin and mods: the poster feed's two tools. Taking a picture off a poster (it goes back to the blank "?" poster), and muting a player
// from putting pictures on posters (the mute is a flag at posterMutes/<uid>; furniPlace in toolbox.ts checks it).
import type { Action } from "./util";
import { text } from "./util";
import { fail } from "../ctx";

const ROOM_RE = /^u_[A-Za-z0-9]{1,40}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const UID_RE = /^[A-Za-z0-9]{1,40}$/;

export const posterAdmin: Action = {
  async run(c, a) {
    if (!c.isAdmin && !c.isMod) fail("Unknown action.");
    const op = a.op;
    if (op === "clear") {
      const room = text(a.room, ROOM_RE, "room");
      const id = text(a.id, ID_RE, "piece");
      const row = await c.db.get<{ kind?: string; img?: unknown }>(`roomsMeta/${room}/furni/${id}`);
      if (!row?.kind) fail("That poster isn't there any more.");
      c.extra[`roomsMeta/${room}/furni/${id}/img`] = null;
      return {};
    }
    if (op === "mute") {
      const uid = text(a.uid, UID_RE, "player");
      c.extra[`posterMutes/${uid}`] = a.on === false ? null : true;
      if (a.on !== false && a.clearAll === true) {
        // take down every picture this player has put on a poster, in any room
        const rooms = (await c.db.get<Record<string, { furni?: Record<string, { kind?: string; img?: unknown; by?: string }>; owner?: string }>>("roomsMeta")) ?? {};
        for (const [room, meta] of Object.entries(rooms)) {
          for (const [id, f] of Object.entries(meta.furni ?? {})) {
            if (typeof f.img === "string" && (meta.owner === uid ? !f.by : f.by === uid)) c.extra[`roomsMeta/${room}/furni/${id}/img`] = null;
          }
        }
      }
      return {};
    }
    return fail("Bad request.");
  },
};
