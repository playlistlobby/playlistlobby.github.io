// Hits and the gun in the browser (the rules: src/shared/hits.ts; the server does the placing and the shooting: server/src/actions/hits.ts).
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { parseHits } from "./shared/hits";
import type { Hit } from "./shared/hits";

/** put blood on somebody's head (from a hideout's computer) */
export const hitPlace = (p: Profile, room: string, target: string, amount: number): Promise<{ id: string; amount: number }> => call(p, "hitPlace", { room, target, amount });
/** the hitman site's player list: who is online (no search), or the names with the search in them; the protected ones are not in it */
export const hitSearch = (p: Profile, q: string): Promise<{ players: Array<{ uid: string; name: string }> }> => call(p, "hitSearch", { q });
/** shoot somebody in the room with the gun in this pocket slot */
export const gunShoot = (p: Profile, room: string, target: string, slot: number): Promise<{ bounty: number; dropped: number; secs: number; name: string; key?: boolean }> => call(p, "gunShoot", { room, target, slot });

/** every open hit, live (the biggest first) */
export function watchHits(cb: (hits: Hit[]) => void): () => void {
  return onValue(ref(db, "hits"), (s) => cb(parseHits(s.val())), () => cb([]));
}
/** when this hideout last put a hit out (members can read it), live */
export function watchHitCool(owner: string, cb: (at: number) => void): () => void {
  return onValue(ref(db, `hitCool/${owner}`), (s) => cb(typeof s.val() === "number" ? s.val() : 0), () => cb(0));
}

export interface Revenge { id: string; by: string; byName: string; hideoutName: string; amount: number; at: number }
/** the people who put a hit on you (newest first): the hitman site offers a revenge button for each */
export function watchRevenge(uid: string, cb: (list: Revenge[]) => void): () => void {
  return onValue(ref(db, `hitRevenge/${uid}`), (s) => {
    const v = (s.val() ?? {}) as Record<string, { by?: string; byName?: string; hideoutName?: string; amount?: number; at?: number }>;
    cb(Object.entries(v).filter(([, r]) => typeof r?.by === "string").map(([id, r]) => ({ id, by: r.by!, byName: String(r.byName ?? "?"), hideoutName: String(r.hideoutName ?? ""), amount: Number(r.amount) || 0, at: Number(r.at) || 0 })).sort((a, b) => b.at - a.at));
  }, () => cb([]));
}
/** fire the rocket launcher at somebody in the room (it is not used up: once every 30 minutes) */
export const rocketFire = (p: Profile, room: string, target: string): Promise<{ secs: number; name: string }> => call(p, "rocketFire", { room, target });
/** when you last fired the rocket launcher, live */
export function watchRocketAt(uid: string, cb: (at: number) => void): () => void {
  return onValue(ref(db, `rocketAt/${uid}`), (s) => cb(typeof s.val() === "number" ? s.val() : 0), () => cb(0));
}
