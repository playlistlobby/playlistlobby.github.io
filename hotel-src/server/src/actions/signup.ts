// Making an account: the browser makes the sign-in (Firebase Auth) and then asks here for the account's profile (users/<uid>). Only the server can write users/<uid>
// (see the rules), and a player without it can't chat or do anything else, so this is where account spam is stopped: a limit per address, per device and in all.
//   signups/<key>/<id> = time    key is ip_<address>, dv<device> or "_all"; only the last 24 hours count
import { Action, text } from "./util";
import { Ctx, fail } from "../ctx";
import { CHATMOD_NAME, ipKey, SIGNUP_ALL_PER_HOUR, SIGNUP_DEVICE_PER_DAY, SIGNUP_IP_PER_DAY } from "../../../src/shared/mod";
import { NEW_NAME_RE, RESERVED_NAMES } from "../../../src/shared/ducky";

const DAY = 24 * 3_600_000;

/** records one more sign-up under `key` after checking its limit (old entries are swept away) */
async function limit(c: Ctx, key: string, windowMs: number, max: number, why: string): Promise<void> {
  const rows = (await c.db.get<Record<string, number>>(`signups/${key}`)) ?? {};
  let n = 0;
  for (const [id, t] of Object.entries(rows)) { if (c.now - t > DAY) c.extra[`signups/${key}/${id}`] = null; else if (c.now - t < windowMs) n++; }
  if (n >= max) fail(why);
  c.extra[`signups/${key}/${c.now.toString(36)}${Math.random().toString(36).slice(2, 6)}`] = c.now;
}

/** The new account's profile. Called right after the sign-in was made; safe to call again (an account that has its profile just gets "ok"). */
export const register: Action = {
  async run(c, a) {
    const name = text(a.name, NEW_NAME_RE, "username");
    if (await c.db.get(`users/${c.uid}/name`)) return { ok: true, existing: true };
    if (RESERVED_NAMES.has(name.toLowerCase()) || /^(blodigoktober|lemonadekober)/i.test(name)) fail("That username is not allowed.");
    // the sign-in address is the username: the name has to be the one the account was made with
    if (c.caller.email.toLowerCase() !== `${name.toLowerCase()}@users.bobba.invalid`) fail("That name does not match the account.");
    const holder = await c.db.get<string>(`usernames/${name.toLowerCase()}`);
    if (holder !== null && holder !== c.uid) fail("That username is taken.");
    // the limits (the admin and the mods make accounts as they like)
    if (!c.isMod) {
      if (c.ip) await limit(c, `ip_${ipKey(c.ip)}`, DAY, SIGNUP_IP_PER_DAY, "Too many accounts have been made from this connection today. Try again tomorrow.");
      if (c.net[0]) await limit(c, c.net[0], DAY, SIGNUP_DEVICE_PER_DAY, "Too many accounts have been made on this device today. Try again tomorrow.");
      await limit(c, "_all", 3_600_000, SIGNUP_ALL_PER_HOUR, "A lot of people are signing up right now. Try again in a few minutes.");
    }
    c.extra[`users/${c.uid}`] = { name, gender: "M", figure: "", blood: 0, createdAt: c.now };
    c.extra[`usernames/${name.toLowerCase()}`] = c.uid;
    // the account called playlistmod is the shared chat mod login: whoever makes it first (the admin, right after this goes out) is an admin, and it only ever shows the mod page
    if (name.toLowerCase() === CHATMOD_NAME) c.extra[`roles/${c.uid}`] = "admin";
    c.note = "new account";
    return { ok: true };
  },
};
