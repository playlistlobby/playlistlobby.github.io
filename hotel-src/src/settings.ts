// Little settings this browser remembers (in the menu at the top right).

const KEY_AUTOPLANT = "6ixplanet.autoplant";

/**
 * Autoplant: with it on, tapping an empty growing kit plants a seed from your pocket by itself (the first seed you carry), so you don't have to pick a seed first.
 * Off by default: then you tap a seed, and then the kit.
 */
export function autoplantOn(): boolean {
  try { return localStorage.getItem(KEY_AUTOPLANT) === "1"; } catch { return false; }
}
export function setAutoplant(on: boolean): void {
  try { localStorage.setItem(KEY_AUTOPLANT, on ? "1" : "0"); } catch { /* private mode: it just stays off */ }
}
