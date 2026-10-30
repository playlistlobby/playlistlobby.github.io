// The album-night event (rules and numbers: src/shared/event.ts). Everything the admin does from the /event panel goes through here, and so do the fights in the changed room.
// event/state (the doors, the lights, the surprise), event/in/<uid> (who went in), event/dead/<uid>, event/hp/<uid>, and public/finale (the page that is left, readable by anybody).
import { Action, cheb, ID_RE, requireInRoom, text } from "./util";
import { fail } from "../ctx";
import type { Ctx } from "../ctx";
import { EVENT_PROTECT_MS, EVENT_PVP, eventKilled, FINALE_HIDE_NAMES, KILL_WAKE_MS } from "../../../src/shared/event";
import type { EventState, Finale, FinaleSong } from "../../../src/shared/event";
import { swingRoll } from "../../../src/shared/streets";
import { byRating, parseSongs } from "../../../src/shared/songs";

const TESTER_EMAIL = "emil@users.bobba.invalid";
/** the admin and the account "emil" run the event */
export const eventAdmin = (c: Ctx): boolean => c.isAdmin || c.caller.email.toLowerCase() === TESTER_EMAIL;
const stateOf = async (c: Ctx): Promise<EventState> => (await c.db.get<EventState>("event/state")) ?? {};

/** what the page that is left shows of the game as it stands now: the ones with the most blood (not the staff), and every song that is on SoundCloud */
async function snapshot(c: Ctx): Promise<{ board: NonNullable<Finale["board"]>; songs: FinaleSong[] }> {
  const users = (await c.db.get<Record<string, { name?: string; blood?: number }>>("users")) ?? {};
  const roles = (await c.db.get<Record<string, string>>("roles")) ?? {};
  const board = Object.entries(users)
    .filter(([uid, u]) => !roles[uid] && typeof u?.name === "string" && !FINALE_HIDE_NAMES.has(u.name.toLowerCase()) && Number(u.blood) > 0)
    .map(([, u]) => ({ name: String(u.name).slice(0, 20), blood: Math.floor(Number(u.blood)) }))
    .sort((a, b) => b.blood - a.blood)
    .slice(0, 100);
  const songs = parseSongs(await c.db.get("songs")).sort(byRating).map((s) => ({ id: s.id, title: s.title, by: s.ownerName, pieces: s.pieces, mime: s.mime || "audio/mpeg", durMs: s.durMs }));
  return { board, songs };
}

/** 6ixty (the admin's face, and the real 6ixty) has endless hit points in the changed room: he can be hit, but nothing goes off his bar */
const isSixty = async (c: Ctx, uid: string): Promise<boolean> => String((await c.db.get<string>(`profiles/${uid}/name`)) ?? "").toLowerCase() === "6ixty" || (await c.db.get<string>(`roles/${uid}`)) === "admin";

/** the doors, the lights: { open?, sealed?, lights? } (sealing also opens) */
export const eventSet: Action = {
  async run(c, a) {
    if (!eventAdmin(c)) fail("Unknown command.");
    for (const key of ["open", "sealed", "lights"] as const) if (typeof a[key] === "boolean") c.extra[`event/state/${key}`] = a[key];
    if (a.sealed === true) c.extra["event/state/open"] = true;
    c.note = `event ${Object.entries(a).filter(([, v]) => typeof v === "boolean").map(([k, v]) => `${k}=${v}`).join(" ")}`;
    return {};
  },
};

/** a player goes in through the red door while it is open (or lands in the room because the doors are shut): from then on they stay */
export const eventJoin: Action = {
  async run(c) {
    const st = await stateOf(c);
    if (!c.isMod) {
      if (!st.open && !st.sealed) fail("The red door is closed.");
      if (await c.db.get(`event/dead/${c.uid}`)) fail("It is over for you.");
      if (!(await c.db.get(`event/in/${c.uid}`))) c.extra[`event/in/${c.uid}`] = c.now;
    }
    return { sealed: !!st.sealed };
  },
};

/** the surprise: set off from the panel (the screens go black, the room changes, the fighting starts) and the page that is left is made ready */
export const eventKill: Action = {
  async run(c) {
    if (!eventAdmin(c)) fail("Unknown command.");
    const st = await stateOf(c);
    if (st.kill) fail("It has been set off already.");
    const snap = await snapshot(c);
    c.extra["event/state/kill"] = c.now;
    c.extra["event/state/open"] = true;
    c.extra["public/finale/on"] = true;
    c.extra["public/finale/board"] = snap.board;
    c.extra["public/finale/songs"] = snap.songs;
    c.extra["public/finale/at"] = c.now;
    c.note = "event kill";
    return { board: snap.board.length, songs: snap.songs.length };
  },
};

/** the page that is left: the leaderboard and the song list are made again from how the game stands now */
export const eventFinaleRefresh: Action = {
  async run(c) {
    if (!eventAdmin(c)) fail("Unknown command.");
    const snap = await snapshot(c);
    c.extra["public/finale/board"] = snap.board;
    c.extra["public/finale/songs"] = snap.songs;
    c.extra["public/finale/at"] = c.now;
    return { board: snap.board.length, songs: snap.songs.length };
  },
};

/** everything back to normal (for testing, and for after): the state, who went in, who died, the hit points, and the page that is left is switched off (its text and hidden songs stay) */
export const eventReset: Action = {
  async run(c) {
    if (!eventAdmin(c)) fail("Unknown command.");
    c.extra["event"] = null;
    c.extra["public/finale/on"] = false;
    c.extra["rooms/stage/hits"] = null;
    c.extra["rooms/stage/events"] = null;
    c.note = "event reset";
    return {};
  },
};

/** the album on the DJ deck without a CD in anybody's pocket: { op: "play", durationMs } or { op: "stop" } (the first song's length comes from the browser) */
export const eventAlbum: Action = {
  async run(c, a) {
    if (!eventAdmin(c)) fail("Unknown command.");
    if (a.op === "stop") { c.extra["rooms/stage/cdplayer"] = null; return {}; }
    const ms = Number(a.durationMs);
    if (!Number.isInteger(ms) || ms < 10_000 || ms > 1_800_000) fail("Bad length.");
    c.extra["rooms/stage/cdplayer"] = { by: c.uid, byName: String((await c.db.get<string>(`users/${c.uid}/name`)) ?? "DJ").slice(0, 16), track: "album", title: "Blodig oktober", index: 0, startedAt: c.now, endsAt: c.now + ms, durationMs: ms };
    return {};
  },
};

/** a swing with the knife every player holds in the changed room: the hit points go down, and at 0 the player is dead (nothing is lost: no items, no blood) */
export const eventHit: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`],
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't fight yourself.");
    const st = await stateOf(c);
    if (!eventKilled(st, c.now)) fail("Nobody fights yet.");
    if (c.now < st.kill! + KILL_WAKE_MS + EVENT_PROTECT_MS) fail("Nobody can be touched yet.");
    const me = await requireInRoom(c, "stage");
    if (await c.db.get(`event/dead/${c.uid}`)) fail("You are dead.");
    if (await c.db.get(`event/dead/${target}`)) fail("They are dead already.");
    const theirs = await c.db.get<{ x?: number; y?: number }>(`rooms/stage/players/${target}`);
    if (!theirs) fail("They've gone.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > EVENT_PVP.reach + 1) fail("They're too far away."); // (and a step of slack for the lag)
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't fight someone who plays on your device.");
    const last = Number(await c.db.get<number>(`event/swing/${c.uid}`)) || 0;
    if (c.now - last < EVENT_PVP.swingMs) fail("Your arm is still swinging.");
    c.extra[`event/swing/${c.uid}`] = c.now;
    const hp = Number(await c.db.get<number>(`event/hp/${target}`)) || EVENT_PVP.maxHp;
    const { dmg } = swingRoll("knife"); // (a swing that misses is a splash: 0)
    const sixty = await isSixty(c, target);
    const left = sixty ? hp : Math.max(0, hp - dmg); // (6ixty: the hit is shown, but his hit points stay)
    const key = (t: number): string => `rooms/stage/events/f${c.uid.slice(0, 8)}${t.toString(36)}`;
    if (last) c.extra[key(last)] = null; // (the swing before this one has been seen by now)
    c.extra[key(c.now)] = { type: "stab", from: c.uid, to: target, ts: c.now, fight: true };
    c.extra[`rooms/stage/hits/${c.uid}`] = { to: target, dmg, at: c.now, ...(left <= 0 ? { dead: true } : {}) };
    if (!sixty) c.extra[`event/hp/${target}`] = left;
    let died = false;
    if (left <= 0) {
      died = true;
      c.extra[`event/dead/${target}`] = { at: c.now, by: c.uid, byName: String((await c.db.get<string>(`users/${c.uid}/name`)) ?? "someone").slice(0, 16) };
      c.extra[`event/kills/${c.uid}`] = (Number(await c.db.get<number>(`event/kills/${c.uid}`)) || 0) + 1;
      c.extra[`rooms/stage/players/${target}`] = null; // (they are gone from the room: their own browser takes them through what happens next)
    }
    c.note = `${dmg ? `hit ${dmg}` : "missed"}${died ? " (killed)" : ""}`;
    return { dmg, left, died };
  },
};

/** "End it": everybody who is still alive in the concert room is marked dead at once (their browsers take them through the death sequence and out to the page that is left) */
export const eventEndAll: Action = {
  async run(c) {
    if (!eventAdmin(c)) fail("Unknown command.");
    const st = await stateOf(c);
    if (!st.kill) fail("The surprise hasn't been set off.");
    const here = (await c.db.get<Record<string, unknown>>("rooms/stage/players")) ?? {};
    const dead = (await c.db.get<Record<string, unknown>>("event/dead")) ?? {};
    const roles = (await c.db.get<Record<string, string>>("roles")) ?? {};
    let n = 0;
    for (const uid of Object.keys(here)) {
      if (dead[uid] || roles[uid] || (await isSixty(c, uid))) continue; // (staff stay: they run it, and 6ixty is never taken)
      c.extra[`event/dead/${uid}`] = { at: c.now, by: "", byName: "" };
      n++;
    }
    c.note = `event end (${n})`;
    return { ended: n };
  },
};
