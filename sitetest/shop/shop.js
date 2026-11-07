// playlist.mag · Shop: a wheel of shirts that turns slowly. It stops when you highlight a shirt, and the shirts near the cursor grow (with a falloff).
const $ = (s, r = document) => r.querySelector(s);
const wheel = $("#wheel"), ring = $("#ring"), hub = $("#hub");
const hubTitle = $("#hub-title"), hubSub = $("#hub-sub"), hubPrice = $("#hub-price");
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---------- the products (the same shirt for now) ---------- */
const TEE = { name: "Playlist tee", sub: "White · liquid glass logo", price: "000 kr", img: "assets/tee-playlist.webp" };
const products = Array.from({ length: 10 }, () => TEE);
const N = products.length;

/* ---------- tuning ---------- */
const TURN = (Math.PI * 2) / 90;   // one turn in 90 seconds (slow)
const GROW = 1.0;                  // extra size of the shirt right under the cursor (1.0 = twice as big)
const SIGMA = 0.9;                 // falloff: how far the growing reaches, in "gaps between shirts"
const ON = 0.55, OFF = 0.35;       // a shirt counts as highlighted above ON and stays highlighted until it drops below OFF

/* ---------- build ---------- */
const els = products.map((p, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "item"; b.setAttribute("aria-label", p.name);
  const im = new Image(); im.alt = ""; im.decoding = "async"; im.draggable = false; im.src = p.img;
  b.append(im);
  wheel.insertBefore(b, hub);
  b.addEventListener("focus", () => { if (b.matches(":focus-visible")) pointAt(items[i].x, items[i].y, true); });
  b.addEventListener("blur", () => pointAt(null));
  return b;
});
const items = products.map(() => ({ x: 0, y: 0, w: 0, s: 1 }));

/* ---------- geometry (a 16:9 stage centred on the window; phones use the width) ---------- */
let cx = 0, cy = 0, R = 0, iw = 0, gap = 0, unit = 10;
function layout() {
  const W = innerWidth, H = innerHeight, portrait = H / W > 1.1;
  unit = portrait ? W / 100 : Math.min(W / 100, H / 56.25);
  cx = W / 2; cy = H / 2;
  R = unit * (portrait ? 39 : 24);
  iw = unit * (portrait ? 20.5 : 12.5);
  gap = (2 * Math.PI * R) / N;
  wheel.style.setProperty("--u", unit + "px");
  wheel.style.setProperty("--iw", iw + "px");
  ring.style.width = ring.style.height = 2 * R + "px";
  hub.style.width = unit * (portrait ? 44 : 30) + "px";
}
addEventListener("resize", layout);
layout();

/* ---------- the cursor (mouse, or a finger) ---------- */
let target = null;          // {x, y} where the pointer is, or null
let cur = null;             // smoothed position
let releaseTimer = 0;
function pointAt(x, y, keep) {
  clearTimeout(releaseTimer);
  if (x == null) { target = null; return; }
  target = { x, y };
  if (!cur) cur = { x, y };
}
wheel.addEventListener("pointermove", (e) => pointAt(e.clientX, e.clientY));
wheel.addEventListener("pointerdown", (e) => pointAt(e.clientX, e.clientY));
wheel.addEventListener("pointerup", (e) => { if (e.pointerType === "touch") releaseTimer = setTimeout(() => (target = null), 1600); });
wheel.addEventListener("pointercancel", () => (target = null));
wheel.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") target = null; });
document.addEventListener("pointerleave", () => (target = null));
addEventListener("blur", () => (target = null));

/* ---------- the loop ---------- */
let angle = Math.random() * Math.PI * 2, omega = reduce ? 0 : TURN;
let hi = -1;                                   // the highlighted shirt
let last = performance.now();
const ws = new Float32Array(N);                // smoothed grow amount of each shirt, 0..1

function setHub(j) {
  hub.classList.add("swap");
  setTimeout(() => {
    if (j < 0) { hubTitle.textContent = "shop"; hubSub.textContent = "Hover a shirt."; hubPrice.textContent = ""; }
    else { const p = products[j]; hubTitle.textContent = p.name; hubSub.textContent = p.sub; hubPrice.textContent = p.price; }
    hub.classList.remove("swap");
  }, 220);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;

  // smooth cursor
  if (target && cur) { const k = 1 - Math.exp(-dt * 16); cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k; }

  // place every shirt on the wheel and work out how much it grows
  let best = -1, bestW = 0;
  for (let i = 0; i < N; i++) {
    const a = angle + (i * 2 * Math.PI) / N - Math.PI / 2;
    const it = items[i];
    it.x = cx + R * Math.cos(a); it.y = cy + R * Math.sin(a);
    let w = 0;
    if (target && cur) { const d = Math.hypot(cur.x - it.x, cur.y - it.y) / (gap * SIGMA); w = Math.exp(-d * d); }
    ws[i] += (w - ws[i]) * (1 - Math.exp(-dt * 11));
    if (ws[i] > bestW) { bestW = ws[i]; best = i; }
  }

  // highlighted? (with a little hysteresis so it doesn't flicker)
  const was = hi;
  if (hi >= 0 && ws[hi] > OFF) { /* stay */ }
  else hi = (best >= 0 && bestW > ON) ? best : -1;
  if (hi >= 0 && best >= 0 && best !== hi && ws[best] > ws[hi] + 0.12 && ws[best] > ON) hi = best;
  if (hi !== was) setHub(hi);

  // the wheel slows to a stop on a highlighted shirt and picks up again when you leave it
  const want = hi >= 0 || reduce ? 0 : TURN;
  omega += (want - omega) * (1 - Math.exp(-dt * (hi >= 0 ? 5 : 1.4)));
  angle += omega * dt;

  for (let i = 0; i < N; i++) {
    const it = items[i], s = 1 + GROW * ws[i];
    const el = els[i];
    el.style.transform = `translate3d(${(it.x - iw / 2).toFixed(1)}px,${(it.y - iw * 0.52).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    el.style.zIndex = String(10 + Math.round(ws[i] * 100));
    if (!el.classList.contains("ready")) el.classList.add("ready");
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
