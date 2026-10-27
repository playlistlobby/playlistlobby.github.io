// Hits and the gun in the browser (the rules: src/shared/hits.ts; the server does the placing and the shooting: server/src/actions/hits.ts).
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { parseHits } from "./shared/hits";
import type { Hit } from "./shared/hits";

/** put blood on somebody's head (from a hideout's computer) */
export const hitPlace = (p: Profile, room: string, target: string, amount: number): Promise<{ id: string; amount: number }> => call(p, "hitPlace", { room, target, amount });
/** shoot somebody in the room with the gun in this pocket slot */
export const gunShoot = (p: Profile, room: string, target: string, slot: number): Promise<{ bounty: number; dropped: number; secs: number; name: string }> => call(p, "gunShoot", { room, target, slot });

/** every open hit, live (the biggest first) */
export function watchHits(cb: (hits: Hit[]) => void): () => void {
  return onValue(ref(db, "hits"), (s) => cb(parseHits(s.val())), () => cb([]));
}
/** when this hideout last put a hit out (members can read it), live */
export function watchHitCool(owner: string, cb: (at: number) => void): () => void {
  return onValue(ref(db, `hitCool/${owner}`), (s) => cb(typeof s.val() === "number" ? s.val() : 0), () => cb(0));
}
