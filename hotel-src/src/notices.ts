// What a moderator puts on your screen: a warning (you press OK), a message, or a kick (you are thrown out of the game). The server writes them
// (notices/<uid>/<id>, notices/_all/<id> for everybody, kicks/<uid>); this only shows them, once each.
import { onChildAdded, onValue, ref } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";
import { serverNow } from "./db";
import { toast } from "./ui/dom";
import { LOUDSPEAKER_SHOW_MS } from "./shared/loudspeaker";

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

/** The loudspeaker (broadcast/): the newest message is shown to everybody for 10 seconds (not if it was sent before you came, or is over already). */
export function watchBroadcast(): () => void {
  let shown = 0;
  let el: HTMLElement | null = null;
  let timer = 0;
  const stop = onValue(ref(db, "broadcast"), (s) => {
    const b = s.val() as { at?: number; text?: string; byName?: string } | null;
    if (!b || typeof b.at !== "number" || typeof b.text !== "string" || b.at === shown) return;
    const left = LOUDSPEAKER_SHOW_MS - (serverNow() - b.at);
    if (left <= 500) return;
    shown = b.at;
    el?.remove(); window.clearTimeout(timer);
    el = document.createElement("div");
    el.className = "loudspeaker-banner";
    el.setAttribute("role", "alert");
    const who = document.createElement("b"); who.textContent = `📢 ${b.byName ?? "?"}`;
    const msg = document.createElement("span"); msg.textContent = b.text;
    el.append(who, msg);
    document.body.append(el);
    const mine = el;
    timer = window.setTimeout(() => { mine.remove(); if (el === mine) el = null; }, left);
  }, () => undefined);
  return () => { stop(); el?.remove(); window.clearTimeout(timer); };
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

/** The admin changed this player's name while they are playing: their open game still has the old one (and would write it back into the room), so it reloads with the new name. */
export function watchOwnName(p: Profile, onChanged: (name: string) => void): () => void {
  let first = true;
  return onValue(ref(db, `users/${p.uid}/name`), (s) => {
    const name = s.val();
    if (typeof name !== "string") return;
    if (first) { first = false; if (name === p.name) return; }
    if (name !== p.name) onChanged(name);
  }, () => undefined);
}

/** A staff member sent you to a room (teleports/<uid>, written by the server): you walk there. Only a teleport that came while you were playing counts. */
export function watchTeleport(p: Profile, go: (room: string, on?: boolean) => void): () => void {
  const startedAt = serverNow();
  let last = 0;
  return onValue(ref(db, `teleports/${p.uid}`), (s) => {
    const t = s.val() as { room?: string; at?: number; on?: boolean } | null;
    if (!t || typeof t.at !== "number" || t.at < startedAt - 5000 || t.at <= last || !/^[a-z0-9_]{1,50}$/.test(String(t.room))) return;
    last = t.at;
    toast(t.room === "arrival" || t.room === "streets" ? "A staff member sent you to the test area." : "A staff member moved you.");
    window.setTimeout(() => go(t.room!, t.on === true), 600);
  }, () => undefined);
}
