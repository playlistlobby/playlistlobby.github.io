import { onValue, ref } from "firebase/database";
import { db } from "./firebase";

/**
 * Are the streets open for players? The admin (adminsidia) switches it in his menu (Admin > Streets): config/streetsOpen. While it is off the elevator is not
 * in the basement and the server refuses the streets to everybody but the staff (they test with /test1).
 */
let open = true; // (the streets are open for everybody now: the elevator always stands in the basement; it runs by the clock, see shared/streets.ts elevatorRuns)
const subs = new Set<() => void>();
export const streetsFlagOn = (): boolean => open;
export const onStreetsFlag = (cb: () => void): (() => void) => { subs.add(cb); return () => subs.delete(cb); };
/** listens to the switch for as long as you are signed in */
export function startStreetsFlag(): () => void {
  return onValue(ref(db, "config/streetsOpen"), () => { subs.forEach((f) => f()); }, () => undefined); // (the old switch changes nothing any more)
}
