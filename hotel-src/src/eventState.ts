// The album-night event as the browser sees it (rules: src/shared/event.ts): one live copy of event/state and of this player's own event/in and event/dead, started once by main.ts
// and listened to by main.ts (who is locked in, where the first room is) and room.ts (the stage: the doors, the lights, the surprise, the fighting).
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { eventLocked } from "./shared/event";
import type { EventState } from "./shared/event";

export interface EventNow { state: EventState; /** when this player went in (0 = they haven't) */ inAt: number; dead: boolean; /** has the first answer come in? */ ready: boolean }
let cur: EventNow = { state: {}, inAt: 0, dead: false, ready: false };
const listeners = new Set<(e: EventNow) => void>();
const push = (): void => listeners.forEach((l) => l(cur));

/** the event as it stands now */
export const eventNow = (): EventNow => cur;
/** is this player shut in the concert room right now? (staff never are) */
export const lockedIn = (staff: boolean): boolean => eventLocked(cur.state, cur.inAt, staff);
/** called now and at every change; returns the stop function */
export function onEvent(fn: (e: EventNow) => void): () => void { listeners.add(fn); fn(cur); return () => { listeners.delete(fn); }; }

/** starts following the event for this player (the first state is awaited by `ready`) */
export function startEvent(uid: string): { stop: () => void; ready: Promise<void> } {
  let got = 0;
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  const first = (): void => { if (++got >= 3) { cur = { ...cur, ready: true }; resolve(); } };
  const stops = [
    onValue(ref(db, "event/state"), (s) => { cur = { ...cur, state: (s.val() ?? {}) as EventState }; first(); push(); }, () => { first(); }),
    onValue(ref(db, `event/in/${uid}`), (s) => { cur = { ...cur, inAt: Number(s.val()) || 0 }; first(); push(); }, () => { first(); }),
    onValue(ref(db, `event/dead/${uid}`), (s) => { cur = { ...cur, dead: s.exists() }; first(); push(); }, () => { first(); }),
  ];
  window.setTimeout(resolve, 4000); // (never hold the login up for long)
  return { stop: () => { stops.forEach((f) => f()); cur = { state: {}, inAt: 0, dead: false, ready: false }; }, ready };
}
