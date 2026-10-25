// What a moderator puts on your screen: a warning (you press OK), a message, or a kick (you are thrown out of the game). The server writes them
// (notices/<uid>/<id>, notices/_all/<id> for everybody, kicks/<uid>); this only shows them, once each.
import { onChildAdded, onValue, ref } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";
import { serverNow } from "./db";

interface Notice { kind?: string; text?: string; byName?: string; at?: number }

const seenKey = (uid: string): string => `6ixplanet.notices.${uid}`;
function seenSet(uid: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(seenKey(uid)) ?? "[]") as string[]); } catch { return new Set(); }
}
function remember(uid: string, set: Set<string>): void {
  try { localStorage.setItem(seenKey(uid), JSON.stringify([...set].slice(-60))); } catch { /* private mode */ }
}

function overlay(cls: string, title: string, text: string, button: string, onOk: () => void): void {
  const box = document.createElement("div");
  box.className = `notice ${cls}`;
  box.setAttribute("role", "alertdialog");
  const card = document.createElement("div");
  card.className = "notice-card";
  const t = document.createElement("div"); t.className = "notice-title"; t.textContent = title;
  const m = document.createElement("div"); m.className = "notice-text"; m.textContent = text;
  const b = document.createElement("button"); b.className = "btn primary"; b.type = "button"; b.textContent = button;
  b.addEventListener("click", () => { box.remove(); onOk(); });
  card.append(t, m, b);
  box.append(card);
  document.body.append(box);
}

/** Shows warnings and messages written to you (or to everybody) while you are in the game; returns the stop function. */
export function watchNotices(p: Profile): () => void {
  const seen = seenSet(p.uid);
  const startedAt = serverNow();
  const show = (id: string, n: Notice): void => {
    if (!n || typeof n.text !== "string" || seen.has(id)) return;
    if (typeof n.at !== "number" || startedAt - n.at > 10 * 60_000) return; // (an old one from before you came: not now)
    seen.add(id); remember(p.uid, seen);
    if (n.kind === "warn") overlay("warn", "⚠ Warning from a moderator", n.text, "OK, I understand", () => undefined);
    else overlay("msg", "📢 Message", n.text, "OK", () => undefined);
  };
  const stops = [
    onChildAdded(ref(db, `notices/${p.uid}`), (s) => show(s.key!, s.val() as Notice), () => undefined),
    onChildAdded(ref(db, "notices/_all"), (s) => show("all-" + s.key!, s.val() as Notice), () => undefined),
  ];
  return () => stops.forEach((s) => s());
}

/** A kick (kicks/<uid>) that comes while you play: a message over everything, and then you are logged out. */
export function watchKick(p: Profile, logout: () => void): () => void {
  const startedAt = serverNow();
  let done = false;
  return onValue(ref(db, `kicks/${p.uid}`), (s) => {
    const k = s.val() as { at?: number; reason?: string } | null;
    if (done || !k || typeof k.at !== "number" || k.at < startedAt - 5000) return;
    done = true;
    overlay("kick", "You were removed from the game", k.reason ? `A moderator removed you: ${k.reason}` : "A moderator removed you from the game.", "OK", logout);
    window.setTimeout(logout, 30_000);
  }, () => undefined);
}
