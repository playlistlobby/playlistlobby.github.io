// The Flappy Bird scoreboard (flappyBoard/<uid> = { name, score, at }, best score per player; everyone logged in can read it, only the server writes it).
// A score is only believed if the server saw the run start: a run takes at least a second per pipe, so a score can't be higher than the seconds the run took.
import { Action, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";

/** a player the admin banned from Flappy Bird (flappyBans/<uid> = true): they can't play, and their scores don't count */
async function notBanned(c: Ctx): Promise<void> {
  if (await c.db.get(`flappyBans/${c.uid}`)) fail("You are banned from Flappy Bird.");
}

export const flappyStart: Action = {
  async run(c) {
    await requireInRoom(c, "lobby");
    await notBanned(c);
    c.extra[`flappyRun/${c.uid}`] = c.now;
    return {};
  },
};

export const flappyScore: Action = {
  async run(c, a) {
    await requireInRoom(c, "lobby");
    await notBanned(c);
    const score = int(a.score, 1, 5000, "score");
    const start = await c.db.get<number>(`flappyRun/${c.uid}`);
    if (typeof start !== "number") return fail("That run wasn't started.");
    const seconds = (c.now - start) / 1000;
    c.extra[`flappyRun/${c.uid}`] = null; // (one score per run)
    if (score > seconds) return fail("That score isn't possible.");
    const cur = await c.db.get<{ score?: number }>(`flappyBoard/${c.uid}`);
    if (typeof cur?.score === "number" && cur.score >= score) return { best: cur.score, improved: false };
    const w = await c.user();
    c.extra[`flappyBoard/${c.uid}`] = { name: String(w.raw?.name ?? "?").slice(0, 30), score, at: c.now };
    return { best: score, improved: true };
  },
};

/** The admin takes a score off the scoreboard (a cheated one, or a name that should not be there). The player can post a new score by playing again, unless `ban` is set: then they are banned from Flappy Bird (`ban: false` lets them back). */
export const flappyRemove: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Unknown action.");
    const uid = text(a.uid, /^[A-Za-z0-9]{1,40}$/, "player");
    c.extra[`flappyBoard/${uid}`] = null;
    if (a.ban === true) c.extra[`flappyBans/${uid}`] = true;
    else if (a.ban === false) c.extra[`flappyBans/${uid}`] = null;
    c.note = `removed ${uid} from the flappy board${a.ban === true ? " and banned them from it" : a.ban === false ? " and let them play again" : ""}`;
    return {};
  },
};
