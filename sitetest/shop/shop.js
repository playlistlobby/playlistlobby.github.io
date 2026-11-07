// playlist.mag · Shop
//  - a 3D ring of shirts: tilted with perspective, it turns slowly, stops when you highlight a shirt (which glows faintly),
//    and the shirts around the cursor grow with a falloff
//  - click a shirt: the others disappear, the shirt glides to the top of the screen and the product page zooms out into view
//  - the product page: size, then delivery details (the same fields and checks as the t-shirt shop of the album event, see order.js)
import { SIZES, cleanOrder } from "./order.js";

const $ = (s, r = document) => r.querySelector(s);
const wheel = $("#wheel"), product = $("#product");
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---------- the products (the same shirt for now) ---------- */
const PRICE_DKK = 10000;                                        // yes, 10k
const fmt = (n) => n.toLocaleString("da-DK") + " DKK";            // 10.000 DKK
const TEE = { id: "playlist-tee", name: "Playlist tee", img: "assets/tee-playlist3.webp", price: PRICE_DKK,
  blurb: "A white cotton tee with the playlist logo in liquid glass on the chest." };
const N = 16;
const products = Array.from({ length: N }, () => TEE);

/* ---------- tuning ---------- */
const TURN = (Math.PI * 2) / 110;   // one turn in 110 seconds (slow)
const PITCH = 42 * Math.PI / 180;   // how far the ring is tipped towards you (90 = seen from straight above, 0 = edge-on)
const PITCH_PHONE = 62 * Math.PI / 180;  // on a tall phone screen the ring is tipped further, so it fills the height
let P0 = PITCH;
const WAVE_M = 2, WAVE_A = 0.28;    // the ring rises and falls WAVE_M times round, by WAVE_A x its depth radius
const GROW = 0.75;                  // extra size of the shirt right under the cursor
const FALL = 1.45;                  // falloff: how far the growing reaches, in shirt widths
const ON = 0.55, OFF = 0.35;        // highlighted above ON, stays highlighted until it drops below OFF
const FOLLOW = { yaw: 12 * Math.PI / 180, pitch: 6 * Math.PI / 180 };  // how much the ring leans towards the cursor
const OPEN_MS = 1000, CLOSE_MS = 800;

/* ---------- easing (the same curve as the rest of the site) ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => { let t = x; for (let i = 0; i < 8; i++) { const e = X(t) - x; if (Math.abs(e) < 1e-4) break; t -= e / (((3 * ax * t + 2 * bx) * t + cx) || 1); } return Y(Math.min(1, Math.max(0, t))); };
}
const ease = bezier(0.3, 0.8, 0.3, 1);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- build the ring ---------- */
let mode = "ring";            // "ring" | "opening" | "product" | "closing"
const els = products.map((p, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "item"; b.setAttribute("aria-label", p.name + ", " + fmt(p.price));
  const im = new Image(); im.alt = ""; im.decoding = "async"; im.draggable = false; im.src = p.img;
  b.append(im);
  wheel.append(b);
  b.addEventListener("click", () => openProduct(i));
  b.addEventListener("focus", () => { if (b.matches(":focus-visible") && mode === "ring") pointAt(items[i].x, items[i].y); });
  b.addEventListener("blur", () => { if (mode === "ring") pointAt(null); });
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
  R = unit * (portrait ? 34 : 19.5);            // depth radius of the ring (towards / away from you)
  RX = R * (portrait ? 1.05 : 1.5);           // it is wider than it is deep, so it uses the width of the window
  iw = unit * (portrait ? 15 : 8.4);
  FL = R * 2.4;                               // camera distance: the smaller, the stronger the perspective
  // the ring's near side sticks out below its centre, the far side above: centre it on the window by its extent
  const cp0 = Math.cos(P0), sp0 = Math.sin(P0);
  const near = R * sp0 * (FL / (FL - R * cp0)), far = R * sp0 * (FL / (FL + R * cp0));
  cx = W / 2; cy = H / 2 + 22 - (near - far) / 2 + (portrait ? unit * 3 : 0);   // (+22: half the banner on top)
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

/* =========================================================
   Opening and closing a product
   ========================================================= */
let sel = -1;                 // the shirt that was clicked
let openT = 0;                // 0 = ring, 1 = product page (linear time; ease(openT) is what moves things)
let openDir = 0, openStart = 0, openFrom = 0, openDur = OPEN_MS;
let frozenWs = null;          // the growth of every shirt at the moment of the click
const heroImg = $("#pp-hero-img");

function heroRect() {                         // where the shirt will rest on the product page
  const r = heroImg.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width };
}

function openProduct(i, instant = false, push = true) {
  if (mode !== "ring") return;
  sel = i; mode = "opening"; openDir = 1; openFrom = openT; openStart = performance.now(); openDur = instant || reduce ? 1 : OPEN_MS;
  frozenWs = Float32Array.from(ws);
  hi = -1; target = null;
  wheel.classList.add("away");
  product.hidden = false; product.setAttribute("aria-hidden", "false");
  product.scrollTop = 0;
  $("#pp-title").textContent = products[i].name;
  $("#pp-price").textContent = fmt(products[i].price);
  $("#pp-blurb").textContent = products[i].blurb;
  $("#pp-buy-price").textContent = fmt(products[i].price);
  heroImg.src = products[i].img;
  if (push) history.pushState({ p: products[i].id }, "", "#" + products[i].id);
}

function closeProduct(fromPop = false) {
  if (mode !== "product" && mode !== "opening") return;
  const go = () => {
    mode = "closing"; openDir = -1; openFrom = openT; openStart = performance.now(); openDur = reduce ? 1 : CLOSE_MS;
    product.classList.remove("arrived", "show");
    els[sel].classList.remove("hidden");
    product.setAttribute("aria-hidden", "true");
    if (!fromPop && location.hash === "#" + products[sel].id) history.back();
  };
  if (product.scrollTop > 40) { product.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(go, 300); } else go();
}
$("#pp-back").addEventListener("click", () => closeProduct());
addEventListener("keydown", (e) => { if (e.key === "Escape") closeProduct(); });
addEventListener("popstate", () => {
  if (location.hash === "#" + TEE.id) { if (mode === "ring") openProduct(0, false, false); }
  else closeProduct(true);
});

/* ---------- the product page: size, then delivery details ---------- */
const sizesEl = $("#pp-sizes"), form = $("#pp-form"), note = $("#pp-note"), buy = $("#pp-buy");
let size = "";
SIZES.forEach((s) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "size"; b.textContent = s; b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", () => {
    size = s;
    sizesEl.querySelectorAll(".size").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    note.textContent = "";
  });
  sizesEl.append(b);
});
buy.addEventListener("click", () => {
  if (!size) { note.textContent = "Pick a size first."; sizesEl.classList.remove("nudge"); void sizesEl.offsetWidth; sizesEl.classList.add("nudge"); return; }
  note.textContent = "";
  form.hidden = false; buy.hidden = true;
  setTimeout(() => form.querySelector("input")?.focus({ preventScroll: true }), 50);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form).entries());
  try { cleanOrder({ ...v, size }); } catch (err) { note.textContent = err.message; return; }
  // The payment is not connected on this site yet (the album-event shop paid through the game's server, for logged-in players only).
  // Nothing is sent anywhere from this form.
  note.textContent = "Payments aren't switched on yet: nothing was sent and nothing was charged.";
});

/* ---------- the loop ---------- */
let angle = Math.random() * Math.PI * 2, omega = reduce ? 0 : TURN;
let yaw = 0, pitch = P0;
let hi = -1;
let last = performance.now();
const ws = new Float32Array(N);                // how much each shirt has grown, 0..1 (smoothed)

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const inRing = mode === "ring";

  // opening / closing progress
  if (mode === "opening" || mode === "closing") {
    const p = clamp01((now - openStart) / openDur);
    openT = openDir > 0 ? lerp(openFrom, 1, p) : lerp(openFrom, 0, p);
    if (openDir > 0) {
      if (openT > 0.3 && !product.classList.contains("show")) product.classList.add("show");     // the page begins to zoom out into view
      if (p >= 1) { mode = "product"; openT = 1; product.classList.add("arrived"); els[sel].classList.add("hidden"); }
    } else if (p >= 1) {
      mode = "ring"; openT = 0; wheel.classList.remove("away"); product.hidden = true; frozenWs = null; sel = -1;
    }
  }
  const openE = ease(openT);

  if (inRing) {
    // the ring leans towards the cursor
    const nx = target ? (target.x / W - 0.5) * 2 : 0, ny = target ? (target.y / H - 0.5) * 2 : 0;
    const k3 = 1 - Math.exp(-dt * 3);
    yaw += (-nx * FOLLOW.yaw - yaw) * k3;
    pitch += (P0 + ny * FOLLOW.pitch - pitch) * k3;
    if (target && cur) { const k = 1 - Math.exp(-dt * 16); cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k; }
  }
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);

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

  // growth around the cursor (measured on the screen, relative to each shirt's own size); frozen while a product is open
  let best = -1, bestW = 0;
  if (inRing) {
    for (let i = 0; i < N; i++) {
      const it = items[i];
      let w = 0;
      if (target && cur) { const d = Math.hypot(cur.x - it.x, cur.y - it.y) / (iw * it.s * FALL); w = Math.exp(-d * d); }
      ws[i] += (w - ws[i]) * (1 - Math.exp(-dt * 11));
      if (ws[i] > bestW) { bestW = ws[i]; best = i; }
    }
    if (hi >= 0 && ws[hi] > OFF) { /* stay */ }
    else hi = (best >= 0 && bestW > ON) ? best : -1;
    if (hi >= 0 && best >= 0 && best !== hi && ws[best] > ws[hi] + 0.12 && ws[best] > ON) hi = best;
    // the ring slows to a stop on a highlighted shirt and picks up again when you leave it
    const want = hi >= 0 || reduce ? 0 : TURN;
    omega += (want - omega) * (1 - Math.exp(-dt * (hi >= 0 ? 5 : 1.4)));
    angle += omega * dt;
  }

  const hero = openT > 0 && sel >= 0 ? heroRect() : null;
  for (let i = 0; i < N; i++) {
    const it = items[i], el = els[i];
    const g = (frozenWs && openT > 0) ? frozenWs[i] : ws[i];
    const depth = (it.zc / R + 1) / 2;                                // 0 far .. 1 near
    let s = it.s * (1 + GROW * g), x = it.x, y = it.y;
    let op = Math.min(1, 0.5 + 0.5 * depth + 0.5 * g);
    let z = 10 + Math.round(depth * 60) + Math.round(g * 200);
    let glow = g;
    if (hero && i === sel) {
      // the clicked shirt glides from the ring to the top of the page
      x = lerp(x, hero.cx, openE); y = lerp(y, hero.cy, openE); s = lerp(s, hero.w / iw, openE); op = 1; z = 900; glow = g * (1 - openE);
    } else if (openT > 0) {
      // the others fall away: they shrink towards the middle and fade out
      op *= 1 - clamp01(openE * 1.9);
      s *= 1 - 0.4 * openE;
      x = lerp(x, cx, 0.25 * openE); y = lerp(y, cy, 0.25 * openE);
    }
    const anchorY = i === sel && hero ? iw * 0.488 : iw * 0.52;       // the shirt's centre sits a little below its anchor
    el.style.transform = `translate3d(${(x - iw / 2).toFixed(1)}px,${(y - anchorY).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    el.style.opacity = op.toFixed(2);
    el.style.zIndex = String(z);
    el.style.setProperty("--g", glow.toFixed(3));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// a link straight to the product page (#playlist-tee) opens it at once
if (location.hash === "#" + TEE.id) openProduct(0, true, false);
