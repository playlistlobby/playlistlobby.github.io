// playlist.mag · Shop: a 3D ring of shirts. The ring is tilted towards you with perspective (near shirts big, far shirts small and fainter),
// it rises and falls like a wave, and it follows the cursor a little. It turns slowly, stops when you highlight a shirt,
// and the shirts around the cursor grow (with a falloff).
const $ = (s, r = document) => r.querySelector(s);
const wheel = $("#wheel");
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---------- the products (the same shirt for now) ---------- */
const TEE = { name: "Playlist tee", img: "assets/tee-playlist2.webp" };
const N = 16;
const products = Array.from({ length: N }, () => TEE);

/* ---------- tuning ---------- */
const TURN = (Math.PI * 2) / 110;   // one turn in 110 seconds (slow)
const PITCH = 42 * Math.PI / 180;   // how far the ring is tipped towards you (90 = seen from straight above, 0 = edge-on)
const PITCH_PHONE = 62 * Math.PI / 180;  // on a tall phone screen the ring is tipped further, so it fills the height
let P0 = PITCH;
const WAVE_M = 2, WAVE_A = 0.28;     // the ring rises and falls WAVE_M times round, by WAVE_A x its depth radius
const GROW = 0.75;                  // extra size of the shirt right under the cursor
const FALL = 1.45;                  // falloff: how far the growing reaches, in shirt widths
const ON = 0.55, OFF = 0.35;        // highlighted above ON, stays highlighted until it drops below OFF
const FOLLOW = { yaw: 12 * Math.PI / 180, pitch: 6 * Math.PI / 180 };  // how much the ring leans towards the cursor

/* ---------- build ---------- */
const els = products.map((p, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "item"; b.setAttribute("aria-label", p.name);
  const im = new Image(); im.alt = ""; im.decoding = "async"; im.draggable = false; im.src = p.img;
  b.append(im);
  wheel.append(b);
  b.addEventListener("focus", () => { if (b.matches(":focus-visible")) pointAt(items[i].x, items[i].y); });
  b.addEventListener("blur", () => pointAt(null));
  return b;
});
const items = products.map(() => ({ x: 0, y: 0, s: 1, zc: 0 }));

/* ---------- geometry (a 16:9 stage centred on the window; phones use the width) ---------- */
let W = 0, H = 0, cx = 0, cy = 0, R = 0, RX = 0, iw = 0, FL = 0, unit = 10;
function layout() {
  W = innerWidth; H = innerHeight;
  const portrait = H / W > 1.1;
  unit = portrait ? W / 100 : Math.min(W / 100, H / 56.25);
  P0 = portrait ? PITCH_PHONE : PITCH;
  R = unit * (portrait ? 34 : 24);            // depth radius of the ring (towards / away from you)
  RX = R * (portrait ? 1.05 : 1.5);           // it is wider than it is deep, so it uses the width of the window
  iw = unit * (portrait ? 15 : 10.2);
  FL = R * 2.4;                               // camera distance: the smaller, the stronger the perspective
  // the ring's near side sticks out below its centre, the far side above: centre it on the window by its extent
  const cp0 = Math.cos(P0), sp0 = Math.sin(P0);
  const near = R * sp0 * (FL / (FL - R * cp0)), far = R * sp0 * (FL / (FL + R * cp0));
  cx = W / 2; cy = H / 2 - (near - far) / 2 + (portrait ? unit * 3 : 0);
  wheel.style.setProperty("--iw", iw + "px");
}
addEventListener("resize", layout);
layout();

/* ---------- the cursor (mouse, or a finger) ---------- */
let target = null, cur = null, releaseTimer = 0;
function pointAt(x, y) {
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
let yaw = 0, pitch = P0;
let hi = -1;
let last = performance.now();
const ws = new Float32Array(N);                // how much each shirt has grown, 0..1 (smoothed)

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;

  // the ring leans towards the cursor
  const nx = target ? (target.x / W - 0.5) * 2 : 0, ny = target ? (target.y / H - 0.5) * 2 : 0;
  const k3 = 1 - Math.exp(-dt * 3);
  yaw += (-nx * FOLLOW.yaw - yaw) * k3;
  pitch += (P0 + ny * FOLLOW.pitch - pitch) * k3;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);

  if (target && cur) { const k = 1 - Math.exp(-dt * 16); cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k; }

  // 3D: put every shirt on the ring, tilt it, and project it with perspective
  for (let i = 0; i < N; i++) {
    const a = angle + (i * 2 * Math.PI) / N;
    const x = RX * Math.cos(a), z = R * Math.sin(a), up = WAVE_A * R * Math.sin(WAVE_M * a);
    const x2 = x * cyw + z * syw, z2 = -x * syw + z * cyw;           // turn about the vertical axis
    const zc = z2 * cp + up * sp;                                     // towards the viewer
    const sy = z2 * sp - up * cp;                                     // down the screen
    const s = FL / (FL - zc);                                         // perspective
    const it = items[i];
    it.x = cx + x2 * s; it.y = cy + sy * s; it.s = s; it.zc = zc;
  }

  // growth around the cursor (measured on the screen, relative to each shirt's own size)
  let best = -1, bestW = 0;
  for (let i = 0; i < N; i++) {
    const it = items[i];
    let w = 0;
    if (target && cur) { const d = Math.hypot(cur.x - it.x, cur.y - it.y) / (iw * it.s * FALL); w = Math.exp(-d * d); }
    ws[i] += (w - ws[i]) * (1 - Math.exp(-dt * 11));
    if (ws[i] > bestW) { bestW = ws[i]; best = i; }
  }

  // highlighted? (a little hysteresis so it doesn't flicker)
  if (hi >= 0 && ws[hi] > OFF) { /* stay */ }
  else hi = (best >= 0 && bestW > ON) ? best : -1;
  if (hi >= 0 && best >= 0 && best !== hi && ws[best] > ws[hi] + 0.12 && ws[best] > ON) hi = best;

  // the ring slows to a stop on a highlighted shirt and picks up again when you leave it
  const want = hi >= 0 || reduce ? 0 : TURN;
  omega += (want - omega) * (1 - Math.exp(-dt * (hi >= 0 ? 5 : 1.4)));
  angle += omega * dt;

  for (let i = 0; i < N; i++) {
    const it = items[i], g = ws[i];
    const depth = (it.zc / R + 1) / 2;                                // 0 far .. 1 near
    const s = it.s * (1 + GROW * g);
    const el = els[i];
    el.style.transform = `translate3d(${(it.x - iw / 2).toFixed(1)}px,${(it.y - iw * 0.52).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    el.style.opacity = (0.5 + 0.5 * depth + 0.5 * g > 1 ? 1 : 0.5 + 0.5 * depth + 0.5 * g).toFixed(2);
    el.style.zIndex = String(10 + Math.round(depth * 60) + Math.round(g * 200));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
