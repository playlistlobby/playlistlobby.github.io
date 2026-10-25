// Roles and mutes, as the browser sees them: roles/<uid> ("admin" or "mod", written only by the server), mutes/<uid> (while it lasts the chat is refused, see the rules),
// and the account's age (new accounts can't chat in the basement and the shop for their first minutes).
import { get, onValue, ref } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";
import type { Role } from "./shared/mod";

/** Reads who you are (a mod or an admin) and how old the account is, onto the profile. */
export async function loadRole(p: Profile): Promise<void> {
  try {
    const r = (await get(ref(db, `roles/${p.uid}`))).val();
    p.role = r === "admin" || r === "mod" ? (r as Role) : null;
  } catch { p.role = null; }
  p.isMod = p.isAdmin || p.role !== null;
  try { p.createdAt = Number((await get(ref(db, `users/${p.uid}/createdAt`))).val()) || 0; } catch { p.createdAt = 0; }
}

/** Follows your own mute (p.mutedUntil, server time in ms); returns the stop function. */
export function watchMute(p: Profile): () => void {
  return onValue(ref(db, `mutes/${p.uid}`), (s) => { p.mutedUntil = Number((s.val() as { until?: number } | null)?.until) || 0; }, () => { p.mutedUntil = 0; });
}
