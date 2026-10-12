/**
 * Phone keyboards. iOS Safari doesn't shrink the page when the keyboard opens: it pans the view up so the focused field stays visible,
 * so the whole site (top bar and all) jumps. Instead, while the keyboard is up we pin the app to the *visible* area (the visual viewport):
 * the top bar stays put, the room shrinks to what's left, and the chat bar sits right above the keyboard with the chat still readable.
 * CSS does the layout (html.kb, --vv-top, --vv-h, --kb-gap); this only reports the numbers.
 */
export function trackKeyboard(): void {
  const vv = window.visualViewport;
  if (!vv || !window.matchMedia("(pointer: coarse)").matches) return;
  const root = document.documentElement;
  let raf = 0;

  const typing = (): boolean => {
    const a = document.activeElement;
    return a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement;
  };

  const apply = (): void => {
    raf = 0;
    const covered = window.innerHeight - vv.height;
    const open = typing() && covered > 100; // a real keyboard, not just the address bar sliding
    if (open) {
      root.style.setProperty("--vv-top", `${Math.max(0, vv.offsetTop)}px`);
      root.style.setProperty("--vv-h", `${vv.height}px`);
      root.style.setProperty("--kb-gap", `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    }
    if (root.classList.contains("kb") !== open) {
      root.classList.toggle("kb", open);
      if (!open) window.scrollTo(0, 0); // iOS can leave the view panned after the keyboard closes
    }
  };
  const schedule = (): void => { if (!raf) raf = requestAnimationFrame(apply); };

  vv.addEventListener("resize", schedule);
  vv.addEventListener("scroll", schedule);
  window.addEventListener("focusin", schedule);
  window.addEventListener("focusout", () => setTimeout(schedule, 60));
}
