import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { serverNow } from "./db";
import type { Profile } from "./db";
import { albumStep, CdAudio, cdEnded, cdPositionMs, controlCd, insertCd, returnCd } from "./cdplayer";
import type { CdState } from "./cdplayer";
import { albumList, isCdItem } from "./shared/cds";
import { findSlot } from "./shared/items";
import { itemDef } from "./items";
import { h, toast } from "./ui/dom";

/**
 * The walkman: a portable CD player in your pocket. One CD at a time; the music plays for you alone, in whatever room you are in.
 * Its state is at walkman/<uid> (the server writes it: cdInsert / cdControl with the room "walk"), and one CdAudio plays it for as long as you are signed in.
 */
const WALK = "walk";
let audio: CdAudio | null = null;
let state: CdState | null = null;
let listeners = new Set<() => void>();
const fire = (): void => listeners.forEach((f) => f());
export const walkmanState = (): CdState | null => (state && !cdEnded(state) ? state : null);
export const hasWalkman = (me: Profile): boolean => findSlot(me.inventory, "walkman") >= 0;
export const walkmanAudio = (): CdAudio | null => audio;

/** Starts listening to your walkman (until you sign out). */
export function startWalkman(me: Profile): () => void {
  audio = new CdAudio(fire);
  let moved = -1; // the album song we already asked to move on from
  let ejecting = false;
  const stop = onValue(ref(db, `walkman/${me.uid}`), (snap) => {
    state = snap.exists() ? (snap.val() as CdState) : null;
    if (state && !hasWalkman(me)) { // the walkman is gone from the pocket (dropped, traded): the CD comes back
      if (!ejecting) { ejecting = true; void controlCd(me, WALK, "eject").catch(() => undefined).finally(() => { ejecting = false; }); }
      audio?.stop();
    } else audio?.sync(state);
    fire();
  }, () => undefined);
  const timer = window.setInterval(() => {
    fire();
    const s = state;
    if (!s || !cdEnded(s) && !(s.track === "album" && s.endsAt <= serverNow() && (s.index ?? 0) < albumList(s.album).length - 1)) return;
    if (s.track === "album" && (s.index ?? 0) < albumList(s.album).length - 1) { // the next song of the album
      const from = s.index ?? 0;
      if (moved === from) return;
      moved = from;
      void albumStep(me, WALK, "advance", from, s.album).catch(() => undefined);
      return;
    }
    if (s.endsAt <= serverNow() || s.pausedAt) void returnCd(me).catch(() => undefined); // the CD is over: it goes back in the pocket
  }, 1000);
  // a CD that was left loaned to a walkman that isn't playing (it ended while you were away): back to the pocket
  void new Promise<void>((done) => window.setTimeout(done, 4000)).then(() => {
    const loaned = me.inventory.find((x) => isCdItem(x?.item) && x?.inPlayer === WALK);
    if (loaned && (!state || cdEnded(state))) void returnCd(me).catch(() => undefined);
  });
  return () => { stop(); window.clearInterval(timer); audio?.stop(); audio = null; state = null; fire(); };
}

/** Puts the CD in the pocket slot into the walkman (it plays at once). */
export async function loadWalkman(me: Profile, slot: number): Promise<void> {
  if (!hasWalkman(me)) throw new Error("You haven't got a walkman.");
  const cur = walkmanState();
  if (cur) throw new Error("There is a CD in your walkman already.");
  await insertCd(me, slot, WALK);
}

const fmt = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** The walkman's little menu: what is playing, pause, skip, volume, eject; or the CDs in your pocket to put in. */
export function openWalkmanMenu(host: HTMLElement, me: Profile, onClose: () => void): { close(): void } {
  let closed = false;
  const body = h("div", { class: "wk-body" });
  const el = h("div", { class: "cd-popup wk-menu", role: "dialog", "aria-label": "Walkman" },
    h("div", { class: "cd-head" }, h("strong", {}, "Walkman"), h("button", { class: "btn small", onclick: () => close() }, "✕")), body);
  host.append(el);
  const run = async (fn: () => Promise<unknown>): Promise<void> => { try { await fn(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); } };

  function render(): void {
    if (closed) return;
    if (!hasWalkman(me)) { close(); return; }
    const s = walkmanState();
    const a = audio;
    if (!s) {
      const cds = me.inventory.map((it, i) => ({ it, i })).filter((x) => x.it && isCdItem(x.it.item) && !x.it.inPlayer);
      body.replaceChildren(
        h("div", { class: "hint" }, "Nothing in it. Put a CD in and it plays wherever you go (only you hear it)."),
        ...(cds.length ? cds.map(({ it, i }) => h("button", { class: "btn", onclick: () => void run(async () => { await loadWalkman(me, i); }) }, `Put in: ${itemDef(it!.item)?.name ?? "CD"}`)) : [h("div", { class: "hint" }, "You have no CD on you.")]));
      return;
    }
    const total = s.durationMs ?? s.endsAt - s.startedAt;
    const pos = Math.min(total, cdPositionMs(s));
    const album = s.track === "album";
    const fill = h("div", { class: "cd-fill", style: { width: `${total ? Math.max(0, Math.min(100, (pos / total) * 100)) : 0}%` } });
    body.replaceChildren(
      h("div", { class: "cd-title" }, `♪ ${s.title}${album ? ` (${(s.index ?? 0) + 1}/${albumList(s.album).length})` : ""}`),
      h("div", { class: "cd-bar" }, fill),
      h("span", { class: "hint" }, `${fmt(pos / 1000)} / ${fmt(total / 1000)}`),
      h("div", { class: "cd-row" },
        h("span", { class: "hint" }, "Volume"),
        h("button", { class: "btn small", title: "Quieter", onclick: () => a?.setVolume(a.volume - 0.1) }, "−"),
        h("span", { class: "cd-vol" }, a?.muted ? "muted" : `${Math.round((a?.volume ?? 0) * 100)}%`),
        h("button", { class: "btn small", title: "Louder", onclick: () => a?.setVolume(a.volume + 0.1) }, "+"),
        h("button", { class: "btn small", title: "Mute", onclick: () => a?.toggleMute() }, a?.muted || a?.volume === 0 ? "🔇" : "🔊")),
      h("div", { class: "cd-row" },
        ...(album ? [h("button", { class: "btn small", title: "Back", onclick: () => void run(() => albumStep(me, WALK, "prev", s.index ?? 0, s.album)) }, "⏮")] : []),
        h("button", { class: "btn small", onclick: () => void run(() => controlCd(me, WALK, s.pausedAt ? "play" : "pause")) }, s.pausedAt ? "Resume" : "Pause"),
        h("button", { class: "btn small", onclick: () => void run(() => controlCd(me, WALK, "restart")) }, "Play from start"),
        ...(album && (s.index ?? 0) < albumList(s.album).length - 1 ? [h("button", { class: "btn small", title: "Skip", onclick: () => void run(() => albumStep(me, WALK, "next", s.index ?? 0, s.album)) }, "⏭")] : []),
        h("button", { class: "btn small danger", onclick: () => void run(() => controlCd(me, WALK, "eject")) }, "Take the CD out")));
  }
  listeners.add(render);
  render();
  function close(): void {
    if (closed) return;
    closed = true;
    listeners.delete(render);
    el.remove();
    onClose();
  }
  return { close };
}
