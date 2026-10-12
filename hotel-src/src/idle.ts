import type { Profile } from "./db";
import { setPresenceIdle } from "./social";

export const IDLE_MS = 15 * 60_000;

/**
 * Notices when the player hasn't touched anything (tap, click, key, scroll) for 15 minutes: marks them "idle" in presence
 * (the door's room list shows it) and calls `onIdle` once so the app can send them home. Any activity clears the mark again.
 * Returns a function that stops watching.
 */
export function watchIdle(p: Profile, onIdle: () => void): () => void {
  let last = Date.now();
  let idle = false;
  const bump = (): void => {
    last = Date.now();
    if (idle) { idle = false; setPresenceIdle(p, false); }
  };
  const events = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
  events.forEach((e) => window.addEventListener(e, bump, { passive: true, capture: true }));
  const onVisible = (): void => { if (document.visibilityState === "visible") bump(); };
  document.addEventListener("visibilitychange", onVisible);
  const timer = window.setInterval(() => {
    if (!idle && Date.now() - last >= IDLE_MS) {
      idle = true;
      setPresenceIdle(p, true);
      onIdle();
    }
  }, 15_000);
  return () => {
    window.clearInterval(timer);
    events.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
    document.removeEventListener("visibilitychange", onVisible);
  };
}
