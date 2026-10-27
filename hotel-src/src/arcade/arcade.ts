import { h } from "../ui/dom";
import { snake } from "./snake";
import { flappy } from "./flappy";

/**
 * An arcade game. To add one: write a module exporting an ArcadeGame, import it here and add it to GAMES.
 * `mount` gets an empty element to build into and returns a cleanup function.
 */
export interface ArcadeGame {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  comingSoon?: boolean;
  mount(host: HTMLElement, api: ArcadeApi): () => void;
}

export interface ArcadeApi {
  close(): void;
  /** the player picked up a drop of blood in the game: bank it (resolves false if the hotel refused it) */
  collectBlood?(): Promise<boolean>;
  /** the scoreboard (the Flappy Bird cabinet only): a run started, a run ended with this score, and the live list of best scores */
  startRun?(): void;
  submitScore?(score: number): Promise<{ best: number; improved: boolean }>;
  watchBoard?(cb: (rows: Array<{ uid: string; name: string; score: number }>) => void): () => void;
  /** the admin only: take a score off the scoreboard */
  removeScore?(uid: string, shadow?: boolean): Promise<unknown>;
  /** who is playing (to mark their row) */
  myUid?: string;
}

const soon = (id: string, title: string, icon: string, blurb: string): ArcadeGame => ({
  id, title, icon, blurb, comingSoon: true, mount: () => () => undefined,
});

export const GAMES: ArcadeGame[] = [
  snake,
  flappy,
  soon("blood-catch", "Blood Catch", "🩸", "Catch the falling drops."),
  soon("lobby-pong", "Lobby Pong", "🏓", "Two players, one ball."),
];

let overlay: HTMLElement | null = null;

export function closeArcade(): void {
  overlay?.dispatchEvent(new Event("arcade-close"));
}

/** Opens the arcade cabinet UI: game list first, then the chosen game (or straight into `gameId`). Escape closes. */
export function openArcade(gameId?: string, extra: Partial<ArcadeApi> = {}): void {
  if (overlay) return;
  let cleanup: (() => void) | null = null;
  const body = h("div", { class: "arcade-body" });
  const title = h("div", { class: "arcade-title" }, "🕹️ Arcade");
  const back = h("button", { class: "btn small hidden", onclick: () => showList() }, "← Games");
  const closeBtn = h("button", { class: "btn small", onclick: () => close() }, "Close");
  // a cabinet made for one game (Flappy Bird): the window is just the game with a close button; the title and info sit underneath it
  const solo = !!gameId && GAMES.some((g) => g.id === gameId && !g.comingSoon);
  const closeFloat = h("button", { class: "btn small arcade-x", title: "Close", onclick: () => close() }, "✕");
  const screen = h("div", { class: "arcade-screen" + (solo ? " solo" : "") }, h("div", { class: "arcade-head" }, title, h("div", { class: "row" }, back, closeBtn)), body, ...(solo ? [closeFloat] : []));
  const root = h("div", { class: "arcade-overlay", onmousedown: (e: MouseEvent) => { if (e.target === root) close(); } }, screen);
  overlay = root;
  document.body.append(root);

  function stopGame(): void {
    cleanup?.();
    cleanup = null;
    body.replaceChildren();
  }
  function showList(): void {
    stopGame();
    title.textContent = "🕹️ Arcade";
    back.classList.add("hidden");
    body.append(h("div", { class: "arcade-list" }, ...GAMES.map((g) =>
      h("button", {
        class: "arcade-card" + (g.comingSoon ? " soon" : ""),
        disabled: !!g.comingSoon,
        onclick: () => play(g),
      }, h("div", { class: "arcade-icon" }, g.icon), h("div", { class: "arcade-name" }, g.title), h("div", { class: "hint" }, g.comingSoon ? "Coming soon" : g.blurb)))));
  }
  function play(g: ArcadeGame): void {
    stopGame();
    title.textContent = `${g.icon} ${g.title}`;
    // a machine that is made for one game (the Flappy Bird cabinet) has nothing else on it: no way back to a list
    back.classList.toggle("hidden", !!gameId && g.id === gameId);
    cleanup = g.mount(body, { ...extra, close });
  }
  function close(): void {
    stopGame();
    window.removeEventListener("keydown", onKey);
    root.remove();
    overlay = null;
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
  window.addEventListener("keydown", onKey);
  root.addEventListener("arcade-close", close);
  const direct = gameId ? GAMES.find((g) => g.id === gameId && !g.comingSoon) : undefined;
  if (direct) play(direct); else showList();
}
