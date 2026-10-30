// The /event panel (the admin and emil): the doors, the lights, the album on the deck, the surprise, ending it, and starting over, plus test buttons that only change what you see yourself.
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { call, serverNow } from "../db";
import type { Profile } from "../db";
import { albumCdTrack, trackDurationMs } from "../cdplayer";
import { onEvent } from "../eventState";
import { h, toast } from "./dom";
import type { EventNow } from "../eventState";

/** what the stage room lets the panel do to this browser only (null when the admin is not on the stage) */
export interface StageTools {
  preview(on: boolean): void;
  previewing(): boolean;
  testKill(): void;
  testDeath(): void;
  testFinale(): void;
  editFinale(): void;
}
export interface EventPanelApi { close(): void }

export function openEventPanel(host: HTMLElement, me: Profile, tools: StageTools | null, goStage: () => void, onClose: () => void): EventPanelApi {
  const body = h("div", { class: "sixty-body" });
  const el = h("div", { class: "cd-popup sixty-shop event-panel", role: "dialog", "aria-label": "Event" },
    h("div", { class: "cd-head" }, h("strong", {}, "🎤 Event"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  let closed = false;
  let busy = false;
  let ev: EventNow | null = null;
  let inRoom = 0, dead = 0;

  const run = async (label: string, action: string, args: Record<string, unknown> = {}, done?: (r: Record<string, unknown>) => string): Promise<void> => {
    if (busy) return;
    busy = true; paint();
    try { const r = await call<Record<string, unknown>>(me, action, args); toast(done ? done(r) : `${label}: done.`); } catch (err) { toast((err as Error).message || `${label} failed.`, "err"); }
    busy = false; paint();
  };
  /** "are you sure": asked in the panel itself (a browser inside an app may refuse confirm() and prompt(), and then the buttons would do nothing); `word` has to be typed for the dangerous one */
  let pending: { text: string; go: () => void; word?: string } | null = null;
  const ask = (text: string, go: () => void, word?: string): void => { pending = { text, go, word }; paint(); };
  const btn = (label: string, onclick: () => void, cls = ""): HTMLElement => h("button", { class: `btn small ${cls}`.trim(), type: "button", disabled: busy, onclick }, label);

  async function playAlbum(): Promise<void> {
    try { const ms = await trackDurationMs(albumCdTrack(0)); await run("Album", "eventAlbum", { op: "play", durationMs: Math.round(ms) }, () => "The album plays on the deck."); } catch (err) { toast((err as Error).message, "err"); }
  }

  function paint(): void {
    if (closed) return;
    const s = ev?.state ?? {};
    const status = [
      `Red door: ${s.open ? "OPEN" : "shut"}`,
      `Doors: ${s.sealed ? "SEALED (everybody is pulled in)" : "not sealed"}`,
      `Lights: ${s.lights ? "on" : "off"}`,
      s.kill ? `The surprise was set off ${Math.max(0, Math.round((serverNow() - s.kill) / 1000))} s ago` : "The surprise: not set off",
      `${inRoom} on the stage · ${dead} dead`,
    ];
    let sureBox: HTMLElement | null = null;
    if (pending) {
      const q = pending;
      const typed = h("input", { type: "text", class: "ev-word", placeholder: `Type ${q.word} here`, autocomplete: "off", oninput: () => { yes.disabled = busy || (!!q.word && typed.value.trim().toUpperCase() !== q.word); } }) as HTMLInputElement;
      const yes = h("button", { class: "btn small ev-danger", type: "button", disabled: !!q.word, onclick: () => { pending = null; q.go(); } }, "Yes, do it") as HTMLButtonElement;
      sureBox = h("div", { class: "ev-sure" }, h("div", {}, q.text), h("div", { class: "hint" }, "Are you sure?"), q.word ? typed : null, h("div", { class: "ev-row" }, yes, h("button", { class: "btn small", type: "button", onclick: () => { pending = null; paint(); } }, "Cancel")));
    }
    body.replaceChildren(
      ...(sureBox ? [sureBox] : []),
      h("div", { class: "ev-status" }, ...status.map((t) => h("div", {}, t))),
      h("div", { class: "ev-h" }, "Doors"),
      h("div", { class: "ev-row" },
        btn("Open the red door", () => ask("Players can walk in through the red door, and are locked in once they have.", () => void run("Open", "eventSet", { open: true, sealed: false }, () => "The red door is open."))),
        btn("Close the doors", () => ask("CLOSE THE DOORS: everybody who is not staff is pulled into the concert room, and so is everybody who logs in.", () => void run("Close", "eventSet", { sealed: true }, () => "The doors are shut.")), "primary")),
      h("div", { class: "ev-row" }, btn("Back to normal doors", () => ask("Nobody is pulled in or locked in any more (the ones inside stay until they leave).", () => void run("Normal", "eventSet", { open: false, sealed: false })))),
      h("div", { class: "ev-h" }, "Show"),
      h("div", { class: "ev-row" },
        btn(s.lights ? "Lights off" : "Lights on", () => void run("Lights", "eventSet", { lights: !s.lights })),
        btn("Play the album", () => void playAlbum()),
        btn("Stop the music", () => void run("Stop", "eventAlbum", { op: "stop" }))),
      h("div", { class: "ev-h" }, "The surprise"),
      h("div", { class: "ev-row" },
        btn("💀 THE SURPRISE", () => ask("This blacks out every screen, changes the room and starts the fighting. Only Reset undoes it.", () => void run("Surprise", "eventKill", {}, (r) => `Set off. The page that is left has ${r.board} on the leaderboard and ${r.songs} songs.`), "KILL"), "ev-danger"),
        btn("End it", () => ask("Everybody still alive on the stage is sent through the death sequence and out to the page that is left.", () => void run("End", "eventEndAll", {}, (r) => `${r.ended} sent on their way.`)))),
      h("div", { class: "ev-h" }, "Start over"),
      h("div", { class: "ev-row" }, btn("Reset everything", () => ask("The doors, the surprise, who went in and who died are all cleared, and the page that is left is switched off.", () => void run("Reset", "eventReset", {}, () => "Everything is back to normal.")))),
      h("div", { class: "ev-h" }, "Test (only on your own screen)"),
      tools ? h("div", {},
        h("div", { class: "ev-row" },
          btn(tools.previewing() ? "Back to the concert room" : "Look at the changed room", () => { tools.preview(!tools.previewing()); paint(); }),
          btn("Test the black-out", () => tools.testKill())),
        h("div", { class: "hint" }, "In the changed room \"Indret rum\" moves the furniture of that room (it is saved apart from the concert room's)."),
        h("div", { class: "ev-row" },
          btn("Test dying", () => tools.testDeath()),
          btn("The page that is left", () => tools.testFinale()),
          btn("Edit that page", () => tools.editFinale())))
        : h("div", {}, h("div", { class: "hint" }, "The test buttons are on the stage."), h("div", { class: "ev-row" }, btn("Go to the stage", () => { goStage(); close(); }))));
  }
  const offEvent = onEvent((e) => { ev = e; paint(); });
  const stops = [
    onValue(ref(db, "rooms/stage/players"), (s) => { inRoom = Object.keys((s.val() ?? {}) as object).length; paint(); }, () => undefined),
    onValue(ref(db, "event/dead"), (s) => { dead = Object.keys((s.val() ?? {}) as object).length; paint(); }, () => undefined),
  ];
  const tick = window.setInterval(paint, 5000);
  paint();

  function close(): void {
    if (closed) return;
    closed = true;
    window.clearInterval(tick);
    offEvent();
    stops.forEach((f) => f());
    el.remove();
    onClose();
  }
  return { close };
}
