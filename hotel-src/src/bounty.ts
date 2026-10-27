// Bagmand's own bounties in the browser (the rules: src/shared/bagmand.ts and server/src/actions/bounty.ts): which rooms are open because a wanted player stands in them, whether you
// are wanted yourself (then you say which room you walk into before you may stand in it), and the half-minute ask that puts the next hit out while he is in the basement.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call, serverNow } from "./db";
import type { Profile } from "./db";

/** the rooms a wanted player stands in: room -> who, and until when the hit lasts */
let wantedRooms = new Map<string, { uid: string; until: number }>();
const listeners = new Set<() => void>();
let stopRooms: (() => void) | null = null;

/** Follows wantedRooms/ while somebody cares (the door lists); returns the stop function. */
export function watchWantedRooms(cb: () => void): () => void {
  listeners.add(cb);
  if (!stopRooms) {
    stopRooms = onValue(ref(db, "wantedRooms"), (s) => {
      const v = (s.val() ?? {}) as Record<string, { uid?: string; until?: number }>;
      wantedRooms = new Map(Object.entries(v).filter(([, r]) => typeof r?.uid === "string" && typeof r.until === "number").map(([room, r]) => [room, { uid: r.uid!, until: r.until! }]));
      listeners.forEach((l) => l());
    }, () => undefined);
  }
  return () => { listeners.delete(cb); if (!listeners.size) { stopRooms?.(); stopRooms = null; } };
}
/** is somebody with one of bagmand's hits standing in this room (so it is open to everybody)? Only right while watchWantedRooms is on. */
export const isWantedRoom = (room: string): boolean => { const r = wantedRooms.get(room); return !!r && r.until > serverNow(); };

/** until when a bagmand hit is on me (0: none), live */
let myUntil = 0;
export const wantedUntil = (): number => myUntil;
export function watchMyWanted(uid: string): () => void {
  return onValue(ref(db, `wantedUsers/${uid}`), (s) => { const v = s.val() as { until?: number } | null; myUntil = v && typeof v.until === "number" ? v.until : 0; }, () => { myUntil = 0; });
}

/** the wanted player says which room they walk into: it is opened to everybody (the database refuses their presence anywhere else while the hit lasts) */
export const bountyShow = (p: Profile, room: string): Promise<{ wanted: boolean }> => call(p, "bountyShow", { room });
/** bagmand is in the basement: ask for the hit that is due (it does nothing when nothing is) */
export const bagmandHitTick = (p: Profile): Promise<unknown> => call(p, "bagmandHitTick");
