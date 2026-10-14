import { push, ref, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

// Everything players do that staff may want to see goes into /logs (only the admin can read it).
// Chat and private messages are stored where they're sent, so they aren't duplicated here.
export type LogType =
  | "register" | "login" | "logout"
  | "buy" | "stab" | "syringe" | "cd" | "emote"
  | "trade" | "drop" | "friend" | "outfit" | "look" | "visit" | "room" | "design" | "admin";

export const LOG_TYPES: LogType[] = ["register", "login", "logout", "buy", "stab", "syringe", "cd", "emote", "drop", "friend", "outfit", "look", "visit", "room", "design", "admin"];

/** Fire-and-forget: logging must never get in the way of what the player is doing. */
export function logAction(who: { uid: string; name: string }, type: LogType, detail: string): void {
  push(ref(db, "logs"), { uid: who.uid, name: who.name, type, detail: detail.slice(0, 160), ts: serverTimestamp() }).catch(() => undefined);
}
