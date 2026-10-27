// Bagmand's own bounties (see src/shared/bagmand.ts): while he is in the basement he puts 2 to 5 hits of 300-500 blood on players who carry more than 1000, each on somebody else,
// at times spread over his visit. The hit is in hits/<id> like any other (so the wanted board and a gun work on it); it goes off by itself after an hour. A player with such a hit on
// them can't hide: any room they stand in is open to everybody (the database rules let anybody into a room that is in wantedRooms, and make the target say which room they are in first).
//   bagmandHitTick   anybody in the basement while he is there asks for it every half minute: puts out the hit that is due (the plan: bagmandHitPlan), and takes down the ones that ran out
//   bountyShow       the wanted player's browser says which room they walk into (the rules refuse their presence anywhere else while the hit lasts)
import { Action, text } from "./util";
import { Ctx } from "../ctx";
import { isEmulator } from "../env";
import {
  BAGMAND_HIT_BLOOD, BAGMAND_HIT_LATE_MS, BAGMAND_HIT_MAX, BAGMAND_HIT_MIN, BAGMAND_HIT_TTL_MS, bagmandHitPlan, BAGMAN_ROOM,
} from "../../../src/shared/bagmand";
import { HIT_ONLINE_FRESH_MS, liveHits, parseHits } from "../../../src/shared/hits";
import { visitOrNull } from "./bagmand";
import { guardedUids } from "./hits";

const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** a fair whole number from 0 to n-1 */
function roll(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}

/** a wanted player's rooms close again: the hit was claimed, or it ran out */
export async function clearWanted(c: Ctx, uid: string): Promise<void> {
  const wu = await c.db.get<{ room?: string }>(`wantedUsers/${uid}`);
  if (!wu) return;
  c.extra[`wantedUsers/${uid}`] = null;
  if (typeof wu.room === "string" && ROOM_RE.test(wu.room)) c.extra[`wantedRooms/${wu.room}`] = null;
}

interface VisitHits { placed?: number; targets?: Record<string, true>; retryAt?: number }

/** Puts out the hit that is due (if any) and takes down the ones that ran out. Anybody can ask: it does nothing when nothing is due. */
export const bagmandHitTick: Action = {
  locks: () => ["bagmandhits", "hits"],
  async run(c) {
    const all = parseHits(await c.db.get("hits"));
    for (const h of all) if (h.until && h.until <= c.now) { c.extra[`hits/${h.id}`] = null; if (h.bagmand) await clearWanted(c, h.target); } // (ran out: off the board, the rooms close)
    const start = await visitOrNull(c);
    if (start === null) return { placed: 0 };
    const key = `bagmandHits/${start}`;
    const st = (await c.db.get<VisitHits>(key)) ?? {};
    const plan = bagmandHitPlan(start);
    const rush = isEmulator(c.env) && (await c.db.get("bagmand/hitsNow")) === true; // (a test: the next hit is due right now)
    let placed = Math.max(0, Math.floor(Number(st.placed) || 0));
    const was = placed;
    while (!rush && placed < plan.length && c.now > plan[placed] + BAGMAND_HIT_LATE_MS) placed++; // (a slot nobody was around for is dropped)
    const save = (extra: Partial<VisitHits> = {}): void => { if (placed !== was || extra.retryAt !== undefined) c.extra[key] = { ...st, placed, ...extra }; };
    if (placed >= plan.length) { save(); return { placed: 0, done: true }; }
    if (!rush && c.now < plan[placed]) { save(); return { placed: 0, next: plan[placed] }; }
    if (typeof st.retryAt === "number" && c.now < st.retryAt && !rush) return { placed: 0 };

    // who: somebody online with more than 1000 blood, not protected, with no hit on them, and not hit by him already in this visit
    const live = liveHits(all, c.now);
    const hasHit = new Set(live.map((h) => h.target));
    const guarded = await guardedUids(c);
    const pres = (await c.db.get<Record<string, { seen?: number; room?: string }>>("presence")) ?? {};
    const cand = Object.entries(pres).filter(([u, p]) => typeof p?.seen === "number" && c.now - p.seen < HIT_ONLINE_FRESH_MS && !guarded.has(u) && !hasHit.has(u) && !st.targets?.[u] && typeof p.room === "string" && p.room !== "" && !p.room.startsWith("tut_"));
    for (let i = cand.length - 1; i > 0; i--) { const j = roll(i + 1); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    let target = "", where = "";
    for (const [u, p] of cand.slice(0, 80)) {
      if ((Number(await c.db.get<number>(`users/${u}/blood`)) || 0) > BAGMAND_HIT_BLOOD) { target = u; where = String(p.room); break; }
    }
    if (!target) { save({ retryAt: c.now + 25_000 }); return { placed: 0, nobody: true }; } // (nobody fits right now: it looks again in a moment)
    const name = String((await c.db.get<string>(`profiles/${target}/name`)) ?? "").slice(0, 30);
    if (!name) { save({ retryAt: c.now + 25_000 }); return { placed: 0 }; }
    const amount = BAGMAND_HIT_MIN + 10 * roll((BAGMAND_HIT_MAX - BAGMAND_HIT_MIN) / 10 + 1);
    const id = `b${c.now.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const until = c.now + BAGMAND_HIT_TTL_MS;
    c.extra[`hits/${id}`] = { target, targetName: name, amount, by: "bagmand", byName: "Bagmand", hideout: "", hideoutName: "Bagmand", at: c.now, bagmand: true, until };
    c.extra[`wantedUsers/${target}`] = { until, hit: id, ...(ROOM_RE.test(where) ? { room: where } : {}) };
    if (ROOM_RE.test(where)) c.extra[`wantedRooms/${where}`] = { uid: target, until };
    c.extra[key] = { placed: placed + 1, targets: { ...(st.targets ?? {}), [target]: true } };
    const line = `There's ${amount} blood on ${name}'s head. Whoever shoots them gets it.`; // (bagmand says it in the basement's chat)
    c.extra[`rooms/${BAGMAN_ROOM}/events/y${c.now.toString(36)}${Math.random().toString(36).slice(2, 4)}`] = { type: "bagmandSay", text: line, ts: c.now };
    c.note = `bagmand put ${amount} on ${name}`;
    return { placed: 1, target, amount };
  },
};

/** A player with a bagmand hit on them says which room they walk into: it is opened to everybody for as long as the hit lasts (the rules don't let them stand anywhere else). */
export const bountyShow: Action = {
  locks: () => ["bagmandhits"],
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const wu = await c.db.get<{ until?: number; room?: string }>(`wantedUsers/${c.uid}`);
    if (!wu || !(Number(wu.until) > c.now)) return { wanted: false };
    if (typeof wu.room === "string" && wu.room !== room && ROOM_RE.test(wu.room)) c.extra[`wantedRooms/${wu.room}`] = null; // (the room they left closes again)
    c.extra[`wantedRooms/${room}`] = { uid: c.uid, until: wu.until };
    c.extra[`wantedUsers/${c.uid}/room`] = room;
    return { wanted: true, until: wu.until };
  },
};
