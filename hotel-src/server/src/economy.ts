// The Durable Object every action runs inside. It keeps one lock per player (and per room), so two requests that touch the same
// pocket or the same floor tile run one after the other, never at the same time. Different players don't wait for each other.
import { ACTIONS } from "./actions";
import { Caller } from "./auth";
import { Ctx, GameError } from "./ctx";
import { Env } from "./env";
import { Rtdb } from "./rtdb";
import { createBackup, rollbackTo } from "./backup";
import { BACKUP_EVERY_MS } from "../../src/shared/backup";
import { FLOOR_SPAWN_CHANCE, FLOOR_SPAWN_ITEMS, FLOOR_SPAWN_MAX, FLOOR_SPAWN_MS } from "../../src/shared/economy";
import { MINES_H, MINES_PIECES, MINES_SIXTY, MINES_W, WOOD_SPAWN_CHANCE, WOOD_SPAWN_MAX } from "../../src/shared/mines";

interface Bucket { tokens: number; at: number }
const RATE_PER_SEC = 8;
const BURST = 25;

export class Economy {
  private tails = new Map<string, Promise<void>>();
  private buckets = new Map<string, Bucket>();
  /** while a rollback runs nothing else may change anything: new actions are turned away, and the rollback waits for the running ones */
  private frozen = false;
  private inflight = 0;
  private bans: { at: number; map: Record<string, { until?: number }> } | null = null;

  constructor(private state: DurableObjectState, private env: Env) {}

  /** The clock for floor spawns: once somebody has played, an alarm goes off every 10 minutes for good. */
  private async ensureAlarm(): Promise<void> {
    try { if ((await this.state.storage.getAlarm()) === null) await this.state.storage.setAlarm(Date.now() + FLOOR_SPAWN_MS); } catch { /* the next request tries again */ }
  }

  /** Every 10 minutes: a 25% chance that a weed seed or a cigarette turns up on the floor of the public room (2 at most lying there). */
  async alarm(): Promise<void> {
    await this.state.storage.setAlarm(Date.now() + FLOOR_SPAWN_MS);
    await this.maybeBackup();
    await this.spawnLobby();
    await this.spawnMines();
  }

  /** The mines: wood turns up on the floor twice as often as the seeds in the basement (a 50% chance every 10 minutes, up to 4 lying at once). */
  private async spawnMines(): Promise<void> {
    if (Math.random() >= WOOD_SPAWN_CHANCE) return;
    const release = await this.lock("room:mines"); // the same lock drop / pickup use for this room
    try {
      const db = new Rtdb(this.env);
      const now = Date.now();
      const drops = (await db.get<Record<string, { by?: string; exp?: number }>>("rooms/mines/drops")) ?? {};
      const lying = Object.values(drops).filter((d) => d.by === "world" && (!d.exp || d.exp > now)).length;
      if (lying >= WOOD_SPAWN_MAX) return;
      // anywhere on the floor that isn't covered by a rock, the bench, 6ixty or the other things standing there
      const blocked = new Set<string>([`${MINES_SIXTY.x}_${MINES_SIXTY.y}`]);
      const size = (kind: string): { w: number; h: number } => (kind === "mbigrock" ? { w: 2, h: 3 } : kind === "mlogs" ? { w: 1, h: 2 } : { w: 1, h: 1 });
      for (const f of MINES_PIECES) { const z = size(f.kind); for (let dx = 0; dx < z.w; dx++) for (let dy = 0; dy < z.h; dy++) blocked.add(`${f.x + dx}_${f.y + dy}`); }
      const tiles: string[] = [];
      for (let x = 1; x < MINES_W; x++) for (let y = 1; y < MINES_H; y++) if (!drops[`${x}_${y}`] && !blocked.has(`${x}_${y}`)) tiles.push(`${x}_${y}`);
      if (tiles.length === 0) return;
      const key = tiles[Math.floor(Math.random() * tiles.length)];
      const [x, y] = key.split("_").map(Number);
      await db.patch({ [`rooms/mines/drops/${key}`]: { item: "wood", qty: 1, x, y, by: "world", byName: "the floor", at: now } });
    } catch (e) {
      console.error("wood spawn failed", e);
    } finally {
      release();
    }
  }

  /** Every 10 minutes: a 25% chance that a weed seed or a cigarette turns up on the floor of the public room (2 at most lying there). */
  private async spawnLobby(): Promise<void> {
    if (Math.random() >= FLOOR_SPAWN_CHANCE) return;
    const release = await this.lock("room:lobby"); // the same lock drop / pickup use for this room
    try {
      const db = new Rtdb(this.env);
      const now = Date.now();
      const drops = (await db.get<Record<string, { by?: string; exp?: number }>>("rooms/lobby/drops")) ?? {};
      const lying = Object.values(drops).filter((d) => d.by === "world" && (!d.exp || d.exp > now)).length;
      if (lying >= FLOOR_SPAWN_MAX) return;
      // somewhere in the middle of the room, away from the walls (the machines, bins and doors stand there), and not on anything the admin put down
      const extras = (await db.get<Record<string, { x?: number; y?: number }>>("lobby/furni")) ?? {};
      const blocked = new Set<string>();
      for (const f of Object.values(extras)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${(f.x ?? -9) + dx}_${(f.y ?? -9) + dy}`);
      const tiles: string[] = [];
      for (let x = 2; x <= 10; x++) for (let y = 2; y <= 10; y++) if (!drops[`${x}_${y}`] && !blocked.has(`${x}_${y}`)) tiles.push(`${x}_${y}`);
      if (tiles.length === 0) return;
      const key = tiles[Math.floor(Math.random() * tiles.length)];
      const [x, y] = key.split("_").map(Number);
      const item = FLOOR_SPAWN_ITEMS[Math.floor(Math.random() * FLOOR_SPAWN_ITEMS.length)];
      await db.patch({ [`rooms/lobby/drops/${key}`]: { item, qty: 1, x, y, by: "world", byName: "the floor", at: now } });
    } catch (e) {
      console.error("floor spawn failed", e);
    } finally {
      release();
    }
  }

  /** An automatic backup when the last one is old enough (the alarm runs every 10 minutes, so that is about every 20). Never lets a failed backup stop the rest of the alarm. */
  private async maybeBackup(): Promise<void> {
    try {
      const last = (await this.state.storage.get<number>("lastBackupAt")) ?? 0;
      if (this.frozen || Date.now() - last < BACKUP_EVERY_MS) return;
      await createBackup(this.env, "auto");
      await this.state.storage.put("lastBackupAt", Date.now());
    } catch (e) {
      console.error("backup failed", e);
    }
  }

  /** a ban is for good, or until `until` (a mod's ban lasts 30 minutes). Returns 0 when not banned, Infinity for good, else the time it ends. */
  private async bannedUntil(uid: string): Promise<number> {
    if (!this.bans || Date.now() - this.bans.at > 15_000) {
      try { this.bans = { at: Date.now(), map: (await new Rtdb(this.env).get<Record<string, { until?: number }>>("bans")) ?? {} }; } catch { if (!this.bans) return 0; }
    }
    const b = this.bans.map[uid];
    if (!b) return 0;
    if (typeof b.until !== "number") return Infinity;
    return b.until > Date.now() ? b.until : 0;
  }

  /** Rolling the server back to a backup (admin only): stop new actions, let the running ones finish, put the backup back, and ban the accounts the admin picked. */
  private async rollback(caller: Caller, args: Record<string, unknown>): Promise<Response> {
    if (!caller.isAdmin) return json({ ok: false, error: "Unknown request." }, 400);
    const ts = Number(args.ts);
    if (!Number.isInteger(ts) || ts <= 0 || args.confirm !== true) return json({ ok: false, error: "Bad request." }, 400);
    const ban = Array.isArray(args.ban) ? args.ban.filter((u): u is string => typeof u === "string" && u !== caller.uid).slice(0, 50) : [];
    if (this.frozen) return json({ ok: false, error: "A rollback is already running." }, 409);
    this.frozen = true;
    try {
      const until = Date.now() + 30_000;
      while (this.inflight > 0 && Date.now() < until) await new Promise((r) => setTimeout(r, 100));
      if (this.inflight > 0) return json({ ok: false, error: "The server was too busy to stop. Try again." }, 503);
      const entry = await rollbackTo(this.env, ts, caller.uid, ban);
      this.bans = null; // the new bans count at once
      const me = await new Ctx(this.env, new Rtdb(this.env), caller).user(); // (the admin's own pockets may have been put back too: the app shows the new ones)
      return json({ ok: true, state: me.s, data: entry }, 200);
    } catch (e) {
      if (e instanceof GameError) return json({ ok: false, error: e.message }, 400);
      console.error("rollback failed", e);
      return json({ ok: false, error: "The rollback failed part of the way. Check the data before opening the game again." }, 500);
    } finally {
      this.frozen = false;
    }
  }

  /** Waits for the previous holder of `key`, and returns what releases it. */
  private async lock(key: string): Promise<() => void> {
    const prev = this.tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>((r) => (release = r));
    const chain = prev.then(() => mine);
    this.tails.set(key, chain);
    void chain.then(() => { if (this.tails.get(key) === chain) this.tails.delete(key); });
    await prev;
    return release;
  }

  private tooFast(uid: string): boolean {
    const now = Date.now();
    const b = this.buckets.get(uid) ?? { tokens: BURST, at: now };
    b.tokens = Math.min(BURST, b.tokens + ((now - b.at) / 1000) * RATE_PER_SEC);
    b.at = now;
    const ok = b.tokens >= 1;
    if (ok) b.tokens -= 1;
    this.buckets.set(uid, b);
    if (this.buckets.size > 5000) for (const [k, v] of this.buckets) if (now - v.at > 60_000) this.buckets.delete(k);
    return !ok;
  }

  async fetch(request: Request): Promise<Response> {
    let body: { caller: Caller; action: string; args: unknown; net?: unknown; ip?: unknown };
    try { body = (await request.json()) as typeof body; } catch { return json({ ok: false, error: "Bad request." }, 400); }
    void this.ensureAlarm();
    const { caller, action } = body;
    const args = (body.args && typeof body.args === "object" ? body.args : {}) as Record<string, unknown>;
    if (action === "backupRollback") return this.rollback(caller, args);
    const def = Object.prototype.hasOwnProperty.call(ACTIONS, action) ? ACTIONS[action] : undefined;
    if (!def) return json({ ok: false, error: "Unknown request." }, 400);
    if (this.frozen) return json({ ok: false, error: "The server is being repaired. Try again in a minute." }, 503);
    if (!caller.isAdmin) {
      const until = await this.bannedUntil(caller.uid);
      if (until) return json({ ok: false, error: until === Infinity ? "This account has been banned." : `You are banned for ${Math.max(1, Math.ceil((until - Date.now()) / 60000))} more minutes.` }, 403);
    }
    if (this.tooFast(caller.uid)) return json({ ok: false, error: "Slow down a little." }, 429);

    const db = new Rtdb(this.env);
    const c = new Ctx(this.env, db, caller);
    c.action = action;
    if (typeof body.ip === "string" && /^[0-9a-fA-F:.]{3,45}$/.test(body.ip)) c.ip = body.ip;
    if (Array.isArray(body.net)) c.net = body.net.filter((k): k is string => typeof k === "string" && /^dv[0-9a-f]{18}$/.test(k)).slice(0, 4);
    const releases: Array<() => void> = [];
    if (this.frozen) return json({ ok: false, error: "The server is being repaired. Try again in a minute." }, 503); // (a rollback may have started while we looked up the ban list; nothing awaits between here and the count)
    this.inflight++;
    try {
      const keys = new Set<string>([`user:${caller.uid}`]);
      try { for (const k of (await def.locks?.(c, args)) ?? []) keys.add(k); } catch (e) { if (e instanceof GameError) return json({ ok: false, error: e.message }, 400); throw e; }
      for (const k of [...keys].sort()) releases.push(await this.lock(k)); // always in the same order, so two actions can't wait for each other
      c.now = Date.now();
      const data = await def.run(c, args);
      const state = await c.commit();
      return json({ ok: true, state, data: data ?? {} }, 200);
    } catch (e) {
      if (e instanceof GameError) return json({ ok: false, error: e.message }, 400);
      console.error("action failed", action, e);
      return json({ ok: false, error: "The server had a problem. Try again." }, 500);
    } finally {
      for (const r of releases.reverse()) r();
      this.inflight--;
    }
  }
}

const json = (v: unknown, status: number): Response => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
