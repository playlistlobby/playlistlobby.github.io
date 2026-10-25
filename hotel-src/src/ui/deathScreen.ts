// The red "you are dead" screen with a countdown, for deaths outside the roulette table (fentanyl). It covers the picture until the time is up, then `onDone` runs.
import { h } from "./dom";

export function showDeathScreen(host: HTMLElement, title: string, seconds: number, onDone: () => void): () => void {
  const count = h("div", { class: "rt-dead-sub" });
  const el = h("div", { class: "rt-dead", role: "alert" }, h("div", { class: "rt-dead-t" }, title), count);
  host.append(el);
  let left = seconds, done = false;
  const tick = (): void => {
    count.textContent = `You wake up in your room in ${left}…`;
    if (left-- <= 0) { window.clearInterval(timer); if (!done) { done = true; onDone(); } }
  };
  const timer = window.setInterval(tick, 1000);
  tick();
  return () => { done = true; window.clearInterval(timer); el.remove(); };
}
