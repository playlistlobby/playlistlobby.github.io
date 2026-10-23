// The Flappy Bird scoreboard (flappyBoard/<uid> = { name, score, at }, best score per player; everyone logged in can read it, only the server writes it).
// A score is only believed if the server saw the run start: a run takes at least a second per pipe, so a score can't be higher than the seconds the run took.
import { Action, int, requireInRoom } from "./util";
import { fail } from "../ctx";

export const flappyStart: Action = {
  async run(c) {
    await requireInRoom(c, "lobby");
    c.extra[`flappyRun/${c.uid}`] = c.now;
    return {};
  },
};

export const flappyScore: Action = {
  async run(c, a) {
    await requireInRoom(c, "lobby");
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
