// Bagmand in the browser (rules and prices: src/shared/bagmand.ts): whether he is in the basement right now, what is left of his limited stock,
// and the one-time message 6ixty gives while he is away. The server decides everything; this only follows the clock and the stock node.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { serverNow } from "./db";
import { awayLine, BAGMAND_BUY, currentVisit, nextVisit, VISIT_MS } from "./shared/bagmand";

/** the visit start a test opened by hand (the node is only written in the local emulator and only honoured there) */
let forced: number | null = null;
/** how many of each limited thing each player bought, per visit start (ms): visit -> item -> player -> how many */
let sold: Record<string, Record<string, Record<string, number>>> = {};
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;
let users = 0;

/** Follows bagmand/ (the stock) while somebody in the room cares; returns the stop function. */
export function watchBagmand(onChange: () => void): () => void {
  listeners.add(onChange);
  if (users++ === 0) {
    stop = onValue(ref(db, "bagmand"), (s) => {
      const v = (s.val() ?? {}) as Record<string, unknown>;
      forced = typeof v.force === "number" ? v.force : null;
      sold = {};
      for (const [k, row] of Object.entries(v)) {
        if (k === "force" || !row || typeof row !== "object") continue;
        const so = (row as { sold?: Record<string, Record<string, number>> }).sold;
        if (so) sold[k] = so;
      }
      listeners.forEach((l) => l());
    }, () => undefined);
  }
  return () => {
    listeners.delete(onChange);
    if (--users === 0) { stop?.(); stop = null; }
  };
}

/** the start of the visit that is on now, or null */
export function visitNow(): number | null {
  const now = serverNow();
  if (forced === 1) return Math.floor(now / VISIT_MS) * VISIT_MS; // (a test: bagmand/force = 1 keeps him here round the clock, with fresh stock every hour)
  if (forced !== null && now >= forced && now < forced + VISIT_MS) return forced;
  return currentVisit(now);
}
/** when the open visit ends (ms) */
export const visitEnd = (start: number): number => start + VISIT_MS;

/** how many of a limited thing THIS player may still buy in this visit (null: no limit): the limit is per player */
export function stockLeft(item: string, start: number, uid: string): number | null {
  const def = BAGMAND_BUY[item];
  if (!def || def.stock === null) return null;
  return Math.max(0, def.stock - (sold[String(start)]?.[item]?.[uid] ?? 0));
}

/**
 * What 6ixty says (once for each coming visit) when you come into the basement while bagmand is away: "bagmanden besøger igen kl 10:00".
 * The visit it was said for is kept in the browser, so it is said again only when the next visit is a new one. Null: nothing to say now.
 */
export function awayMessage(uid: string): string | null {
  if (visitNow() !== null) return null;
  const now = serverNow();
  const next = nextVisit(now);
  const key = `6ixplanet.bagmanMsg.${uid}`;
  try {
    if (localStorage.getItem(key) === String(next)) return null;
    localStorage.setItem(key, String(next));
  } catch { /* no storage: it is said every time you come in */ }
  return awayLine(next);
}
