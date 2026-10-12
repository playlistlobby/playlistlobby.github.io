/**
 * Phone keyboards. iOS Safari doesn't shrink the page when the keyboard opens: it pans the view up so the focused field stays visible,
 * so the whole site (top bar and all) jumps. Instead, from the moment a text field is tapped we pin the app to the *visible* area (the
 * visual viewport): the top bar stays put, the room shrinks to what's left, and the chat bar sits right above the keyboard.
 * iOS only reports the shrunken height at the END of the keyboard animation, so until then we use the last keyboard height we saw
 * (a typical one the first time) and follow the pan frame by frame. CSS does the layout (html.kb, --vv-top, --vv-h, --kb-gap).
 */
export function trackKeyboard(): void {
  const vv = window.visualViewport;
  if (!vv || !window.matchMedia("(pointer: coarse)").matches) return;
  const root = document.documentElement;
  let lastKeyboard = 0; // keyboard height seen last time
  let loop = 0;

  // iOS draws its field helper (up/down arrows + checkmark) over the bottom of the page, just above the keys, without counting it in the
  // visible height. Pages can't remove it, so leave room for it: the strip it covers is the only thing hidden.
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const HELPER_BAR = ios ? 48 : 0;

  const typing = (): boolean => {
    const a = document.activeElement;
    return a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement;
  };

  const frame = (): void => {
    loop = 0;
    if (!typing()) return;
    const covered = window.innerHeight - vv.height;
    if (covered > 100) lastKeyboard = covered;
    // keyboard reported: exact. Not reported yet (animation still running): assume it's about to show up at its usual height.
    const h = (covered > 100 ? vv.height : window.innerHeight - (lastKeyboard || Math.round(window.innerHeight * 0.38))) - HELPER_BAR;
    const top = Math.max(0, vv.offsetTop);
    root.style.setProperty("--vv-top", `${top}px`);
    root.style.setProperty("--vv-h", `${h}px`);
    root.style.setProperty("--kb-gap", `${Math.max(0, window.innerHeight - h - top)}px`);
    root.classList.add("kb");
    loop = requestAnimationFrame(frame); // keep following while a field has focus
  };

  const release = (): void => {
    if (typing()) return;
    if (loop) { cancelAnimationFrame(loop); loop = 0; }
    root.classList.remove("kb");
    window.scrollTo(0, 0); // iOS can leave the view panned after the keyboard closes
    setTimeout(() => window.scrollTo(0, 0), 120);
  };

  window.addEventListener("focusin", () => { if (typing() && !loop) frame(); });
  window.addEventListener("focusout", () => setTimeout(release, 60));
}
