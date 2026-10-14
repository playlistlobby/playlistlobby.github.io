// The Durable Object every action runs inside. It keeps one lock per player (and per room), so two requests that touch the same
// pocket or the same floor tile run one after the other, never at the same time. Different players don't wait for each other.
import { ACTIONS } from "./actions";
import { Caller } from "./auth";
import { Ctx, GameError } from "./ctx";
import { Env } from "./env";
import { Rtdb } from "./rtdb";

interface Bucket { tokens: number; at: number }
const RATE_PER_SEC = 8;
const BURST = 25;

export class Economy {
  private tails = new Map<string, Promise<void>>();
  private buckets = new Map<string, Bucket>();

  constructor(_state: DurableObjectState, private env: Env) {}

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
