// playlist.mag: the iOS 6 interface sounds (Tink, Tock, Sent/Received message, lock/unlock, ...) from github.com/Tamasina07/iOS-6-Sounds (WTFPL),
// squeezed to small mono mp3s in assets/sounds/. Played with the Web Audio API so they start at once on iPhones too.
// Browsers only allow sound after a tap, so a sound that is triggered without one is simply silent. Turn them off with ?sound=off (back on with ?sound=on).
const BASE = new URL("assets/sounds/", import.meta.url).href;
const NAMES = ["tink", "tock", "sent", "received", "unlock", "lock", "no", "swish"];
const KEY = "pm-sound";
try { const q = new URLSearchParams(location.search).get("sound"); if (q === "off" || q === "on") localStorage.setItem(KEY, q); } catch { /* no storage */ }
const muted = () => { try { return localStorage.getItem(KEY) === "off"; } catch { return false; } };

let ctx = null;
const raw = {}, buf = {};
function load(n) { return (raw[n] ||= fetch(BASE + n + ".mp3").then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null)); }
function context() {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch { return null; } }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}
function decoded(n) {
  return (buf[n] ||= load(n).then((ab) => (ab && ctx ? new Promise((res) => { ctx.decodeAudioData(ab.slice(0), res, () => res(null)); }) : null)));
}
/** play a sound: sfx("tock"), sfx("tink", 0.35) with a volume from 0 to 1 */
export function sfx(name, vol = 0.6) {
  if (muted()) return;
  const c = context();
  if (!c) return;
  decoded(name).then((b) => {
    if (!b) { delete buf[name]; return; }
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(c.destination); s.start();
  });
}

// the small files are fetched when the browser is idle; the first tap creates the audio context and decodes them, so the first sound has no delay
(window.requestIdleCallback || ((f) => setTimeout(f, 800)))(() => NAMES.forEach(load));
addEventListener("pointerdown", () => { if (muted()) return; context(); NAMES.forEach(decoded); }, { once: true, passive: true });

// the same click for the tabs and the home button on every page that uses this file
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".tabs a, .homebtn")) sfx("tock"); }, true);
