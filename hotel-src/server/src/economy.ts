// The Durable Object every action runs inside. It keeps one lock per player (and per room), so two requests that touch the same
// pocket or the same floor tile run one after the other, never at the same time. Different players don't wait for each other.
import { ACTIONS } from "./actions";
import { Caller } from "./auth";
import { Ctx, GameError } from "./ctx";
import { Env } from "./env";
import { Rtdb } from "./rtdb";
import { FLOOR_SPAWN_CHANCE, FLOOR_SPAWN_ITEMS, FLOOR_SPAWN_MAX, FLOOR_SPAWN_MS } from "../../src/shared/economy";

interface Bucket { tokens: number; at: number }
const RATE_PER_SEC = 8;
const BURST = 25;

export class Economy {
  private tails = new Map<string, Promise<void>>();
  private buckets = new Map<string, Bucket>();

  constructor(private state: DurableObjectState, private env: Env) {}

  /** The clock for floor spawns: once somebody has played, an alarm goes off every 10 minutes for good. */
  private async ensureAlarm(): Promise<void> {
    try { if ((await this.state.storage.getAlarm()) === null) await this.state.storage.setAlarm(Date.now() + FLOOR_SPAWN_MS); } catch { /* the next request tries again */ }
  }

  /** Every 10 minutes: a 25% chance that a weed seed or a cigarette turns up on the floor of the public room (2 at most lying there). */
  async alarm(): Promise<void> {
    await this.state.storage.setAlarm(Date.now() + FLOOR_SPAWN_MS);
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
    let body: { caller: Caller; action: string; args: unknown };
    try { body = (await request.json()) as typeof body; } catch { return json({ ok: false, error: "Bad request." }, 400); }
    void this.ensureAlarm();
    const { caller, action } = body;
    const args = (body.args && typeof body.args === "object" ? body.args : {}) as Record<string, unknown>;
    const def = Object.prototype.hasOwnProperty.call(ACTIONS, action) ? ACTIONS[action] : undefined;
    if (!def) return json({ ok: false, error: "Unknown request." }, 400);
    if (this.tooFast(caller.uid)) return json({ ok: false, error: "Slow down a little." }, 429);

    const db = new Rtdb(this.env);
    const c = new Ctx(this.env, db, caller);
    const releases: Array<() => void> = [];
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
    }
  }
}

const json = (v: unknown, status: number): Response => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
