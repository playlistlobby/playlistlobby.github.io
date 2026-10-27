// The Flappy Bird scoreboard (flappyBoard/<uid> = { name, score, at }, best score per player; everyone logged in can read it, only the server writes it).
// A score is only believed if the server saw the run start: a run takes at least a second per pipe, so a score can't be higher than the seconds the run took.
import { Action, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";

/**
 * What the admin did about a player in Flappy Bird (flappyBans/<uid>): true = banned (they can't play), "shadow" = shadow banned (they play and see their own scores,
 * kept in flappyShadow/<uid>, but nobody else ever sees them on the board). Returns whether this player is shadow banned.
 */
async function banState(c: Ctx): Promise<"shadow" | null> {
  const b = await c.db.get<boolean | string>(`flappyBans/${c.uid}`);
  if (b === "shadow") return "shadow";
  if (b) fail("You are banned from Flappy Bird.");
  return null;
}

export const flappyStart: Action = {
  async run(c) {
    await requireInRoom(c, "lobby");
    await banState(c);
    c.extra[`flappyRun/${c.uid}`] = c.now;
    return {};
  },
};

export const flappyScore: Action = {
  async run(c, a) {
    await requireInRoom(c, "lobby");
    const shadow = (await banState(c)) === "shadow";
    const score = int(a.score, 1, 5000, "score");
    const start = await c.db.get<number>(`flappyRun/${c.uid}`);
    if (typeof start !== "number") return fail("That run wasn't started.");
    const seconds = (c.now - start) / 1000;
    c.extra[`flappyRun/${c.uid}`] = null; // (one score per run)
    if (score > seconds) return fail("That score isn't possible.");
    const where = shadow ? "flappyShadow" : "flappyBoard"; // (a shadow banned player's scores go where only they can see them)
    const cur = await c.db.get<{ score?: number }>(`${where}/${c.uid}`);
    if (typeof cur?.score === "number" && cur.score >= score) return { best: cur.score, improved: false };
    const w = await c.user();
    c.extra[`${where}/${c.uid}`] = { name: String(w.raw?.name ?? "?").slice(0, 30), score, at: c.now };
    return { best: score, improved: true };
  },
};

/** The admin takes a score off the scoreboard (a cheated one, or a name that should not be there). The player can post a new score by playing again, unless `ban` is set: then they are banned from Flappy Bird (`ban: false` lets them back); `ban: "shadow"` shadow bans them: they play on and see their own scores, but nobody else does. */
export const flappyRemove: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Unknown action.");
    const uid = text(a.uid, /^[A-Za-z0-9]{1,40}$/, "player");
    c.extra[`flappyBoard/${uid}`] = null;
    if (a.ban === true) c.extra[`flappyBans/${uid}`] = true;
    else if (a.ban === "shadow") c.extra[`flappyBans/${uid}`] = "shadow";
    else if (a.ban === false) { c.extra[`flappyBans/${uid}`] = null; c.extra[`flappyShadow/${uid}`] = null; }
    if (a.ban === "shadow") c.extra[`flappyShadow/${uid}`] = null; // (they start again from nothing, in the shadow)
    c.note = `removed ${uid} from the flappy board${a.ban === true ? " and banned them from it" : a.ban === "shadow" ? " and shadow banned them" : a.ban === false ? " and let them play again" : ""}`;
    return {};
  },
};
