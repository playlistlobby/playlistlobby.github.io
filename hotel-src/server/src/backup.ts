// Backups and rollbacks of what the server owns (every player's blood, pockets, storage and what they own, and the furniture in the rooms).
//   createBackup   : a snapshot, written to backupData/<time> (the whole thing) and backupIndex/<time> (a small summary the admin app lists)
//   rollbackTo     : puts a snapshot back (the Durable Object has already stopped new actions), after taking a safety backup of the present
// Only the admin app can read these nodes (database rules); only this server writes them.
import { Rtdb } from "./rtdb";
import { GameError } from "./ctx";
import { Env } from "./env";
import {
  BACKUP_KEEP_MS, BackupIndexEntry, LEDGER_KEEP_MS, RollbackLogEntry, ROOM_BACKUP_KEYS, USER_BACKUP_KEYS,
} from "../../src/shared/backup";
import { cdOwnedKey } from "../../src/shared/cds";

/** One database write never carries more than this many paths (a rollback of many players goes in several, while the server is stopped). */
const CHUNK = 1500;

const pick = (src: any, keys: readonly string[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (src && src[k] !== undefined && src[k] !== null) out[k] = src[k];
  return out;
};

export async function createBackup(env: Env, kind: BackupIndexEntry["kind"], note?: string): Promise<BackupIndexEntry> {
  const db = new Rtdb(env);
  const at = Date.now();
  const [users, rooms] = await Promise.all([db.get<Record<string, any>>("users"), db.get<Record<string, any>>("roomsMeta")]);
  const userOut: Record<string, unknown> = {};
  const bloodOf: Record<string, number> = {};
  let totalBlood = 0;
  for (const [uid, v] of Object.entries(users ?? {})) {
    const part = pick(v, USER_BACKUP_KEYS);
    totalBlood += Number(v?.blood) || 0;
    if (Number(v?.blood)) bloodOf[uid] = Number(v.blood);
    if (Object.keys(part).length) userOut[uid] = part;
  }
  const roomOut: Record<string, unknown> = {};
  for (const [id, v] of Object.entries(rooms ?? {})) {
    const part = pick(v, ROOM_BACKUP_KEYS);
    if (Object.keys(part).length) roomOut[id] = part;
  }
  const entry: BackupIndexEntry = { at, kind, ...(note ? { note } : {}), accounts: Object.keys(userOut).length, rooms: Object.keys(roomOut).length, totalBlood };
  await db.patch({ [`backupData/${at}`]: { users: userOut, rooms: roomOut }, [`backupBlood/${at}`]: bloodOf, [`backupIndex/${at}`]: entry, bloodBoard: bloodOf }); // (bloodBoard is the public ranking the door list uses: refreshed here for everyone)
  await pruneBackups(db, at);
  return entry;
}

/** Backups older than 12 hours go (the newest one always stays), and so do ledger buckets older than 3 days. */
export async function pruneBackups(db: Rtdb, now: number): Promise<void> {
  const keys = (await db.keys("backupIndex")).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const old = keys.slice(0, -1).filter((k) => now - k > BACKUP_KEEP_MS);
  const dead: Record<string, unknown> = {};
  for (const k of old) { dead[`backupIndex/${k}`] = null; dead[`backupData/${k}`] = null; dead[`backupBlood/${k}`] = null; }
  for (const b of await db.keys("ledger")) if (now - Number(b) > LEDGER_KEEP_MS) dead[`ledger/${b}`] = null;
  await db.patch(dead);
}

async function patchInChunks(db: Rtdb, updates: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(updates);
  for (let i = 0; i < entries.length; i += CHUNK) await db.patch(Object.fromEntries(entries.slice(i, i + CHUNK)));
}

/**
 * Puts the backup taken at `ts` back. Accounts and rooms that exist now but not in the backup (made since) are left as they are.
 * Paid CDs are reconciled: one that was handed over after the backup would vanish with the rollback, so its payment goes back to "paid" and is handed over again.
 */
export async function rollbackTo(env: Env, ts: number, by: string, ban: string[]): Promise<RollbackLogEntry> {
  const db = new Rtdb(env);
  const data = await db.get<{ users?: Record<string, any>; rooms?: Record<string, any> }>(`backupData/${ts}`);
  if (!data) throw new GameError("That backup is gone.");
  const safety = await createBackup(env, "pre-rollback", `before going back to ${new Date(ts).toISOString()}`);
  const now = Date.now();
  const [nowUsers, nowRooms] = [new Set(await db.keys("users")), new Set(await db.keys("roomsMeta"))];

  const updates: Record<string, unknown> = {};
  let users = 0, rooms = 0;
  for (const [uid, saved] of Object.entries(data.users ?? {})) {
    if (!nowUsers.has(uid)) continue;
    users++;
    for (const k of USER_BACKUP_KEYS) updates[`users/${uid}/${k}`] = saved?.[k] ?? null;
    updates[`bloodBoard/${uid}`] = Number(saved?.blood) || null;
  }
  for (const [id, saved] of Object.entries(data.rooms ?? {})) {
    if (!nowRooms.has(id)) continue;
    rooms++;
    for (const k of ROOM_BACKUP_KEYS) updates[`roomsMeta/${id}/${k}`] = saved?.[k] ?? null;
  }

  // paid CDs that were handed over after the backup
  const purchases = (await db.get<Record<string, { uid?: string; status?: string; item?: string }>>("purchases")) ?? {};
  for (const [id, p] of Object.entries(purchases)) {
    if (p?.status !== "claimed" || !p.uid || !p.item) continue;
    const saved = data.users?.[p.uid];
    if (!saved || !nowUsers.has(p.uid)) continue;
    if (saved.owned?.[cdOwnedKey(p.item)]) continue; // they had it already at the backup: it stays theirs
    updates[`purchases/${id}/status`] = "paid";
    updates[`userPurchases/${p.uid}/${id}/status`] = "paid";
  }

  const banned = ban.filter((u) => /^[A-Za-z0-9]{1,40}$/.test(u));
  for (const u of banned) updates[`bans/${u}`] = { at: now, by, reason: `rolled back to ${new Date(ts).toISOString()}` };

  await patchInChunks(db, updates);
  const entry: RollbackLogEntry = { at: now, by, to: ts, users, rooms, banned, safety: safety.at };
  await db.patch({ [`rollbackLog/${now}`]: entry });
  return entry;
}
