// The lighter job's guide: after 6ixty has handed over the money (the job's second step, tutorial 5) the next thing to do flashes, one step at a time:
//   the shop door in the basement -> (in the shop) the vending machine -> the lighter in its menu -> 6ixty, until the lighter has been given to him.
// A step stops flashing once it has been done: the door when you have been through it, the vending machine when its menu has opened, the lighter when you have bought one.
// Which steps are done is kept in this browser (per player); it starts over with the next job.
import type { Profile } from "./db";
import { findSlot } from "./items";

export type LighterStage = "door" | "vending" | "lighter" | "give";
interface Flags { door?: boolean; vending?: boolean }
const key = (uid: string): string => `sixplanet.lighterHint.${uid}`;
const read = (uid: string): Flags => { try { return JSON.parse(localStorage.getItem(key(uid)) ?? "{}") as Flags; } catch { return {}; } };
const write = (uid: string, f: Flags | null): void => { try { if (f) localStorage.setItem(key(uid), JSON.stringify(f)); else localStorage.removeItem(key(uid)); } catch { /* private mode: the hints just start over */ } };

/** What should flash right now, or null (not on the job, or nothing to point at). */
export function lighterStage(me: Profile): LighterStage | null {
  if (me.tutorial !== 5) { if (read(me.uid).door || read(me.uid).vending) write(me.uid, null); return null; } // (the job is over: forget the steps)
  if (findSlot(me.inventory, "lighter") >= 0) return "give";
  const f = read(me.uid);
  if (!f.door) return "door";
  if (!f.vending) return "vending";
  return "lighter";
}

/** The player has been through the shop door ("door") or has opened the vending machine's menu ("vending"). */
export function markLighterStep(me: Profile, step: "door" | "vending"): void {
  if (me.tutorial !== 5) return;
  const f = read(me.uid);
  if (f[step]) return;
  f[step] = true;
  if (step === "vending") f.door = true; // (opening the machine means you got in)
  write(me.uid, f);
}
