// SoundCloud (the site on every hideout computer, see src/shared/songs.ts): uploading a song, voting, taking one off, and the hourly clean-up.
//   songBegin   {title, durMs, size, mime}  describes the upload (audio.ts) and puts a row in songs/<id> that is not "ready" yet; the browser writes the pieces
//   songFinish  {id}                        checks the pieces and makes the song ready: it is on SoundCloud
//   songVote    {id, v}                     1 up, -1 down, 0 takes your vote back (one vote each, not on your own song)
//   songDelete  {id}                        the owner (or a mod) takes a song off
//   songSweep                               the hourly clean-up: the worst quarter of the songs goes (anybody who opens SoundCloud asks; it does nothing when the hour is not up)
import { Action, int, text, ID_RE } from "./util";
import { Ctx, fail } from "../ctx";
import { cleanTitle, parseSongs, SONGS_PER_PLAYER, SONGS_TOTAL_MAX, SWEEP_EVERY_MS, sweepVictims } from "../../../src/shared/songs";
import { audioBegin, audioFinish, audioRemove, dropStaleUploads } from "./audio";

interface SongRow { owner?: string; ownerName?: string; title?: string; ready?: boolean; up?: number; down?: number; pressed?: number; at?: number; durMs?: number; size?: number; mime?: string; pieces?: number }

/** takes a song off SoundCloud: a song that is on CDs keeps its audio (and a short description in songArchive) so the CDs still play; any other one is deleted with its audio */
export function removeSong(c: Ctx, id: string, row: SongRow): void {
  c.extra[`songs/${id}`] = null;
  c.extra[`songVotes/${id}`] = null;
  if ((row.pressed ?? 0) > 0) {
    c.extra[`songArchive/${id}`] = { owner: row.owner, ownerName: row.ownerName, title: row.title, durMs: row.durMs, size: row.size, mime: row.mime, pieces: row.pieces, at: row.at, pressed: row.pressed };
  } else audioRemove(c, id);
}

export const songBegin: Action = {
  locks: () => ["songs"],
  async run(c, a) {
    const title = cleanTitle(a.title);
    if (title.length < 1) fail("Give the song a title.");
    await dropStaleUploads(c);
    const all = (await c.db.get<Record<string, SongRow>>("songs")) ?? {};
    const rows = Object.entries(all);
    // a song that was begun and never finished does not count after an hour
    const live = rows.filter(([, r]) => r.ready === true || c.now - Number(r.at ?? 0) < 3_600_000);
    if (live.filter(([, r]) => r.owner === c.uid).length >= SONGS_PER_PLAYER) fail(`You can have ${SONGS_PER_PLAYER} songs on SoundCloud at a time. Take one off first.`);
    if (live.length >= SONGS_TOTAL_MAX) fail("SoundCloud is full. The worst songs are taken off every hour: try again later.");
    const w = await c.user();
    const { id, pieces } = await audioBegin(c, { kind: "song", size: a.size, durMs: a.durMs, mime: a.mime, idPrefix: "s" });
    c.extra[`songs/${id}`] = { owner: c.uid, ownerName: String(w.raw?.name ?? "?").slice(0, 20), title, durMs: Number(a.durMs), size: Number(a.size), mime: String(a.mime).toLowerCase(), pieces, at: c.now, up: 0, down: 0, ready: false };
    return { id, pieces };
  },
};

export const songFinish: Action = {
  locks: () => ["songs"],
  async run(c, a) {
    const id = text(a.id, ID_RE, "song");
    const row = await c.db.get<SongRow>(`songs/${id}`);
    if (!row || row.owner !== c.uid) fail("That song isn't yours.");
    if (row!.ready) fail("That song is on SoundCloud already.");
    await audioFinish(c, id, "song");
    c.extra[`songs/${id}/ready`] = true;
    c.extra[`songs/${id}/at`] = c.now; // (it is as new as when the last piece arrived)
    c.note = `song ${row!.title}`;
    return { id };
  },
};

export const songVote: Action = {
  locks: (c, a) => [`song:${String(a?.id ?? "")}`],
  async run(c, a) {
    const id = text(a.id, ID_RE, "song");
    const v = int(a.v, 0, 1, "vote"); // (up votes only: an old browser that still sends a down vote is turned away)
    const row = await c.db.get<SongRow>(`songs/${id}`);
    if (!row || !row.ready) fail("That song isn't there any more.");
    if (row!.owner === c.uid) fail("You can't vote on your own song.");
    const before = Number(await c.db.get<number>(`songVotes/${id}/${c.uid}`)) || 0;
    if (before === v) return { up: row!.up ?? 0, down: row!.down ?? 0, v };
    let up = row!.up ?? 0, down = row!.down ?? 0;
    if (before === 1) up--; else if (before === -1) down--;
    if (v === 1) up++; else if (v === -1) down++;
    c.extra[`songs/${id}/up`] = Math.max(0, up);
    c.extra[`songs/${id}/down`] = Math.max(0, down);
    c.extra[`songVotes/${id}/${c.uid}`] = v === 0 ? null : v;
    c.extra[`myVotes/${c.uid}/${id}`] = v === 0 ? null : v; // (the copy the player reads: their own votes)
    return { up: Math.max(0, up), down: Math.max(0, down), v };
  },
};

export const songDelete: Action = {
  locks: () => ["songs"],
  async run(c, a) {
    const id = text(a.id, ID_RE, "song");
    const row = await c.db.get<SongRow>(`songs/${id}`);
    if (!row) fail("That song isn't there.");
    if (row!.owner !== c.uid && !c.isMod) fail("That song isn't yours.");
    removeSong(c, id, row!);
    c.note = `took off ${row!.title}`;
    return { ok: true };
  },
};

/** Every hour the worst quarter of the songs goes (see sweepVictims). Anybody who has SoundCloud open asks; it does nothing until the hour is up. */
export const songSweep: Action = {
  locks: () => ["songs"],
  async run(c) {
    const last = Number(await c.db.get<number>("songMeta/lastSweep")) || 0;
    if (c.now - last < SWEEP_EVERY_MS) return { swept: 0, next: last + SWEEP_EVERY_MS };
    const raw = (await c.db.get<Record<string, SongRow>>("songs")) ?? {};
    const songs = parseSongs(raw);
    const victims = sweepVictims(songs, c.now);
    for (const s of victims) removeSong(c, s.id, raw[s.id]);
    // an upload that was never finished goes too (its row and its pieces)
    for (const [id, r] of Object.entries(raw)) if (r.ready !== true && c.now - Number(r.at ?? 0) > 3_600_000) removeSong(c, id, r);
    c.extra["songMeta/lastSweep"] = c.now;
    c.note = `sweep ${victims.length}`;
    return { swept: victims.length, next: c.now + SWEEP_EVERY_MS };
  },
};
