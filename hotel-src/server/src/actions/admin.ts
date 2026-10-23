// Admin only: a backup right now, and banning or unbanning a player. (Rolling back is done by the Durable Object itself: it has to stop everything first, see economy.ts.)
import type { Action } from "./util";
import { text } from "./util";
import { fail } from "../ctx";
import { createBackup } from "../backup";

const UID_RE = /^[A-Za-z0-9]{1,40}$/;

export const backupNow: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Unknown action.");
    const note = typeof a.note === "string" && a.note.trim() ? a.note.trim().slice(0, 60) : undefined;
    const e = await createBackup(c.env, "manual", note);
    return { at: e.at, accounts: e.accounts, totalBlood: e.totalBlood };
  },
};

/** A banned player can't do anything any more: the server refuses their actions, and the database rules shut them out (see scripts/build-rules.mjs). */
export const banPlayer: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Unknown action.");
    const uid = text(a.uid, UID_RE, "player");
    if (uid === c.uid) fail("You can't ban yourself.");
    if (a.on === false) { c.extra[`bans/${uid}`] = null; return {}; }
    const reason = typeof a.reason === "string" ? a.reason.slice(0, 120) : "";
    c.extra[`bans/${uid}`] = { at: c.now, by: c.uid, ...(reason ? { reason } : {}) };
    return {};
  },
};
