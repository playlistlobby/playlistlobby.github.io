// The dice: hold them in your hand and press Roll. The server throws them (a fair 1 to 6) and writes the number to rooms/<room>/dice/<uid>, a place the browser
// can't write to, so the number everybody sees over a head is always the real one. (Chat can say anything; this can't.)
import { Action, requireInRoom, text } from "./util";
import { fail } from "../ctx";
import { DICE_GAP_MS } from "../../../src/shared/dice";

/** a fair whole number from 0 to n-1 */
function roll(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n; // (throw away the top sliver so every number is equally likely)
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}

export const rollDice: Action = {
  async run(c, a) {
    const room = text(a.room, /^[A-Za-z0-9_-]{1,40}$/, "room");
    await requireInRoom(c, room);
    const w = await c.user();
    if (!w.s.inventory.some((s) => s && s.item === "dice" && !s.inPlayer)) fail("You don't have any dice.");
    const path = `rooms/${room}/dice/${c.uid}`;
    const last = await c.db.get<{ at?: number }>(path);
    if (last && typeof last.at === "number" && c.now - last.at < DICE_GAP_MS) fail("The dice are still rolling.");
    const n = roll(6) + 1;
    c.extra[path] = { n, at: c.now, name: String(w.raw?.name ?? "?").slice(0, 30) };
    return { n };
  },
};
