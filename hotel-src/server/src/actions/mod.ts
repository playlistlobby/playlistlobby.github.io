// Moderation: two roles, "admin" and "mod" (roles/<uid>, written only here, and by hand for the first admin).
//   mod    can mute somebody for an hour, ban somebody for 30 minutes, take a ban or a mute off again (a short one), look at the accounts somebody has made, answer reports
//   admin  can do all that for any time (or for good), promote players to mods, and take any ban off
// Neither can act on an admin, and a mod can't act on another mod. Everything done is written to modLog/<id> (the chat mod page shows it).
//   mutes/<uid>   { until, by, byName?, reason? }   while it lasts the database rules refuse the player's chat lines
//   bans/<uid>    { at, by, until?, reason? }       without `until` for good; with it the ban ends by itself (rules and worker both look at `until`)
//   reports/<id>  { from, fromName, target, targetName, reason, at }
import { Action, int, text } from "./util";
import { Ctx, fail } from "../ctx";
import { MOD_BAN_MS, MOD_MUTE_MS, REPORT_LIMIT, REPORT_WINDOW_MS } from "../../../src/shared/mod";

const UID_RE = /^[A-Za-z0-9]{10,40}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

type Role = "admin" | "mod" | null;

async function roleOf(c: Ctx, uid: string): Promise<Role> {
  const r = await c.db.get<string>(`roles/${uid}`);
  if (r === "admin" || r === "mod") return r;
  // the first admin account is the one the server knows by its sign-in address (adminsidia)
  const name = String((await c.db.get<string>(`profiles/${uid}/name`)) ?? "").toLowerCase();
  return name === "adminsidia" ? "admin" : null;
}

function needMod(c: Ctx): void {
  if (!c.isMod) fail("Unknown action.");
}

/** may the caller act on this player? (nobody acts on an admin; a mod doesn't act on a mod; nobody on themselves) */
async function mayAct(c: Ctx, uid: string): Promise<string> {
  if (uid === c.uid) fail("Not on yourself.");
  const target = await roleOf(c, uid);
  if (target === "admin") fail("That is an admin.");
  if (target === "mod" && !c.isAdmin) fail("That is a mod.");
  return String((await c.db.get<string>(`profiles/${uid}/name`)) ?? uid.slice(0, 6)).slice(0, 16);
}

async function callerName(c: Ctx): Promise<string> {
  return String((await c.db.get<string>(`profiles/${c.uid}/name`)) ?? "?").slice(0, 16);
}

async function note(c: Ctx, what: string, target: string, targetName: string, detail = ""): Promise<void> {
  const id = `${c.now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  c.extra[`modLog/${id}`] = { by: c.uid, byName: await callerName(c), what, target, targetName, ...(detail ? { detail: detail.slice(0, 120) } : {}), at: c.now };
}

const reasonOf = (a: { reason?: unknown }): string => (typeof a.reason === "string" ? a.reason.trim().slice(0, 120) : "");

/** Mute somebody (a mod: one hour; the admin: up to a week, default an hour). `on: false` takes it off. */
export const modMute: Action = {
  async run(c, a) {
    needMod(c);
    const uid = text(a.uid, UID_RE, "player");
    const name = await mayAct(c, uid);
    if (a.on === false) {
      c.extra[`mutes/${uid}`] = null;
      await note(c, "unmute", uid, name);
      return { ok: true };
    }
    const minutes = c.isAdmin && a.minutes !== undefined ? int(a.minutes, 1, 10080, "minutes") : MOD_MUTE_MS / 60000;
    const until = c.now + minutes * 60000;
    c.extra[`mutes/${uid}`] = { until, by: c.uid, byName: await callerName(c), ...(reasonOf(a) ? { reason: reasonOf(a) } : {}) };
    await note(c, "mute", uid, name, `${minutes} min${reasonOf(a) ? ": " + reasonOf(a) : ""}`);
    return { until };
  },
};

/** one ban (a mod: 30 minutes; the admin: for good unless `minutes`), used by modBan and modBanMany */
async function banOne(c: Ctx, uid: string, a: { minutes?: unknown; reason?: unknown }): Promise<{ until?: number }> {
  const name = await mayAct(c, uid);
  const minutes = c.isAdmin ? (a.minutes === undefined || a.minutes === null || a.minutes === 0 ? 0 : int(a.minutes, 1, 525600, "minutes")) : MOD_BAN_MS / 60000;
  const until = minutes ? c.now + minutes * 60000 : undefined;
  c.extra[`bans/${uid}`] = { at: c.now, by: c.uid, ...(until ? { until } : {}), ...(reasonOf(a) ? { reason: reasonOf(a) } : {}) };
  await note(c, "ban", uid, name, `${minutes ? minutes + " min" : "for good"}${reasonOf(a) ? ": " + reasonOf(a) : ""}`);
  return { until };
}

/** Ban somebody (a mod: 30 minutes; the admin: for good unless `minutes`). `on: false` takes it off (a mod only a short one). */
export const modBan: Action = {
  async run(c, a) {
    needMod(c);
    const uid = text(a.uid, UID_RE, "player");
    if (a.on === false) {
      const name = await mayAct(c, uid);
      const ban = await c.db.get<{ until?: number }>(`bans/${uid}`);
      if (!ban) return { ok: true };
      if (!c.isAdmin && !ban.until) fail("Only the admin can lift a ban for good.");
      c.extra[`bans/${uid}`] = null;
      await note(c, "unban", uid, name);
      return { ok: true };
    }
    return banOne(c, uid, a);
  },
};

/** Ban up to 100 accounts at once (the bots of one botter). */
export const modBanMany: Action = {
  async run(c, a) {
    needMod(c);
    if (!Array.isArray(a.uids) || !a.uids.length) fail("Pick some accounts.");
    const uids: string[] = [...new Set<string>((a.uids as unknown[]).slice(0, 100).map((u) => text(u, UID_RE, "player")))];
    let n = 0;
    for (const uid of uids) { try { await banOne(c, uid, a); n++; } catch { /* an admin, a mod or yourself in the list: skipped */ } }
    return { banned: n };
  },
};

/** Admin: make somebody a mod, or take it away again. */
export const modPromote: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Only the admin can do that.");
    const uid = text(a.uid, UID_RE, "player");
    if (uid === c.uid) fail("Not on yourself.");
    if ((await roleOf(c, uid)) === "admin") fail("That is an admin.");
    const name = String((await c.db.get<string>(`profiles/${uid}/name`)) ?? "?").slice(0, 16);
    if (a.role === "mod") { c.extra[`roles/${uid}`] = "mod"; await note(c, "promote", uid, name); return { role: "mod" }; }
    if (a.role === "none") { c.extra[`roles/${uid}`] = null; await note(c, "demote", uid, name); return { role: null }; }
    return fail("Bad role.");
  },
};

/**
 * The other accounts of a player: the ones that played from the same device (peers/<uid>) and the ones whose names look made by the same hand
 * (the same name up to its last three characters, like blodigoktober + 3 letters). Returns up to 120 accounts with what a mod needs to see.
 */
export const modAlts: Action = {
  async run(c, a) {
    needMod(c);
    const uid = text(a.uid, UID_RE, "player");
    const peers = Object.keys((await c.db.get<Record<string, boolean>>(`peers/${uid}`)) ?? {});
    const mine = String((await c.db.get<string>(`profiles/${uid}/name`)) ?? "");
    const stem = mine.length >= 8 ? mine.slice(0, -3).toLowerCase() : "";
    const names = Object.entries((await c.db.get<Record<string, string>>("usernames")) ?? {});
    const like = stem ? names.filter(([n, u]) => n.length === mine.length && n.startsWith(stem) && u !== uid).map(([, u]) => u) : [];
    const ids = [...new Set([...peers, ...like])].filter((u) => u !== uid).slice(0, 120);
    const bans = (await c.db.get<Record<string, { until?: number }>>("bans")) ?? {};
    const out = [];
    for (const u of ids) {
      const name = (await c.db.get<string>(`profiles/${u}/name`)) ?? "?";
      const created = await c.db.get<number>(`users/${u}/createdAt`);
      const b = bans[u];
      out.push({ uid: u, name, createdAt: created ?? 0, why: peers.includes(u) ? "same device" : "similar name", banned: !!b && (!b.until || b.until > c.now) });
    }
    return { accounts: out, stem };
  },
};

/** A mod/admin has dealt with a report (or it is rubbish): it leaves the list. */
export const modDismissReport: Action = {
  async run(c, a) {
    needMod(c);
    const id = text(a.id, ID_RE, "report");
    c.extra[`reports/${id}`] = null;
    return { ok: true };
  },
};

/** Any player: report another player (from their profile). At most REPORT_LIMIT different accounts per hour. */
export const reportPlayer: Action = {
  async run(c, a) {
    const target = text(a.uid, UID_RE, "player");
    if (target === c.uid) fail("You can't report yourself.");
    const reason = typeof a.reason === "string" ? a.reason.trim().slice(0, 140) : "";
    if (!reason) fail("Say what it is about.");
    const targetName = await c.db.get<string>(`profiles/${target}/name`);
    if (targetName === null) fail("That player doesn't exist.");
    const log = (await c.db.get<Record<string, { t: number; target: string }>>(`reportLog/${c.uid}`)) ?? {};
    const recent = Object.entries(log).filter(([, r]) => c.now - r.t < REPORT_WINDOW_MS);
    for (const [id, r] of Object.entries(log)) if (c.now - r.t >= REPORT_WINDOW_MS) c.extra[`reportLog/${c.uid}/${id}`] = null;
    if (recent.some(([, r]) => r.target === target)) fail("You have already reported that player.");
    if (recent.length >= REPORT_LIMIT) fail(`You can report ${REPORT_LIMIT} accounts an hour. Try again later.`);
    const id = `${c.now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    c.extra[`reportLog/${c.uid}/${id}`] = { t: c.now, target };
    c.extra[`reports/${id}`] = { from: c.uid, fromName: await callerName(c), target, targetName: String(targetName).slice(0, 16), reason, at: c.now };
    return { ok: true };
  },
};
