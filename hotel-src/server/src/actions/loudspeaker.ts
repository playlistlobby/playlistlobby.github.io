// The loudspeaker: a message on everybody's screen for 10 seconds (the browsers show broadcast/ while it is fresh), once every 6 hours per player.
import { Action, text } from "./util";
import { fail } from "../ctx";
import { findSlot } from "../../../src/shared/items";
import { LOUDSPEAKER_COOLDOWN_MS, LOUDSPEAKER_MAX_LEN, LOUDSPEAKER_ON } from "../../../src/shared/loudspeaker";
import { isEmulator } from "../env";

export const loudspeaker: Action = {
  locks: () => ["broadcast"],
  async run(c, a) {
    if (!LOUDSPEAKER_ON && !isEmulator(c.env)) fail("The loudspeaker is switched off for now.");
    const w = await c.user();
    if (findSlot(w.s.inventory, "loudspeaker") < 0) fail("You don't have a loudspeaker.");
    const msg = text(a.text, new RegExp(`^[^\\n\\r]{1,${LOUDSPEAKER_MAX_LEN}}$`), "message").trim();
    if (!msg) fail("Write something first.");
    const mute = await c.db.get<{ until?: number }>(`mutes/${c.uid}`);
    if (mute && Number(mute.until) > c.now) fail("You are muted.");
    const last = (await c.db.get<number>(`loudspeaker/${c.uid}`)) ?? 0;
    if (!c.isAdmin && c.now - last < LOUDSPEAKER_COOLDOWN_MS) {
      const mins = Math.ceil((LOUDSPEAKER_COOLDOWN_MS - (c.now - last)) / 60000);
      fail(`The loudspeaker is still charging: ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`} left.`);
    }
    c.extra[`loudspeaker/${c.uid}`] = c.now;
    c.extra["broadcast"] = { at: c.now, text: msg, by: c.uid, byName: String(w.raw.name ?? "someone").slice(0, 16) };
    c.note = "loudspeaker";
    return { at: c.now };
  },
};
