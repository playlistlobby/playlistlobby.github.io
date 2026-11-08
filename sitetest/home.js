// playlist.mag · Home: tap the glass play button -> it MORPHS into the playlist note, the person slides left and the menu comes in.
/* players who switched on "Stay on PlaylistPlanet" (a switch on the game's login page, only shown to those who came in through the Projects phone) go straight back to the game */
try {
  if (localStorage.getItem("pm-stay-planet") === "1" && !location.hash) { sessionStorage.setItem("pm-from-site", location.pathname.replace(/[^/]*$/, "") + "projects/"); location.replace("/hotel/"); }
} catch { /* no storage: the home page just shows */ }
import { sfx } from "./sounds.js";
const body = document.body;
const glass = document.getElementById("glass");
const shape = glass.querySelector(".shape");
const menu = document.getElementById("menu");
const vid = document.getElementById("vid");
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* =========================================================
   Scenes
   ========================================================= */
let scene2 = false;
function setScene(two, push = true) {
  scene2 = two;
  body.classList.toggle("s2", two);
  glass.setAttribute("aria-label", two ? "Back" : "Play");
  menu.querySelectorAll("a").forEach((a) => (a.tabIndex = two ? 0 : -1));
  morphTo(two ? 1 : 0);
  if (!two) { clearTimeout(leaveTimer); setGlow(false); }
  if (push) history.replaceState(null, "", two ? "#menu" : location.pathname + location.search);
}
glass.addEventListener("click", () => { sfx(scene2 ? "lock" : "unlock"); setScene(!scene2); });
/* the word next to the logo opens the menu too (it is part of the logo) */
document.querySelector(".wordmark")?.addEventListener("click", () => { if (!scene2) { sfx("unlock"); setScene(true); } });
addEventListener("keydown", (e) => { if (e.key === "Escape" && scene2) { sfx("lock"); setScene(false); } });

/* leaving the page: a short fade, then go */
menu.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  sfx("tock");
  body.classList.add("leaving");
  setTimeout(() => (location.href = a.href), 260);
});
addEventListener("pageshow", () => body.classList.remove("leaving")); // back button from another page

/* =========================================================
   Hover: the buttons glow green and the logo reacts
   ========================================================= */
let leaveTimer = 0;
function setGlow(on, a) {
  clearTimeout(leaveTimer);
  glass.classList.toggle("glow", on);
  glass.classList.toggle("app", on && !!a);
  if (on && a) glass.dataset.app = a.dataset.app;
  menu.classList.toggle("glowing", on);
}
const hoverOn = (a) => setGlow(true, a);
const hoverOff = () => { clearTimeout(leaveTimer); leaveTimer = setTimeout(() => setGlow(false), 140); };   // a short grace, so moving to the next option cross-fades instead of flickering
menu.querySelectorAll("a").forEach((a) => {
  a.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") { hoverOn(a); sfx("tink", 0.35); } });
  a.addEventListener("pointerleave", hoverOff);
  a.addEventListener("focus", () => { if (a.matches(":focus-visible")) hoverOn(a); });
  a.addEventListener("blur", hoverOff);
  a.addEventListener("pointerdown", () => hoverOn(a));   // touch: the icon shows while pressed / on the way out
});

/* =========================================================
   The morph: the play shape and the note shape are traced polylines with the same rounded-square outside.
   Both are resampled to the same number of points (and lined up), then every point slides from one to the other.
   ========================================================= */
const N_OUT = 160, N_IN = 240;
let P = null;            // { outer:[a,b], inner:[a,b] } as Float64Arrays of x,y pairs, 1000 wide
let k = 0;               // current morph amount 0 (play) .. 1 (note)
let raf = 0;

const parse = (d) => d.split("Z").map((s) => s.trim()).filter(Boolean).map((seg) =>
  seg.replace(/^M/, "").split("L").map((p) => p.trim().split(",").map(Number)));
const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
function resample(pts, n) {
  if (area(pts) < 0) pts = pts.slice().reverse();                  // every contour runs the same way round
  // start at the top-left-most point so the two shapes begin in a similar place
  let s = 0, best = Infinity;
  pts.forEach((p, i) => { const v = p[1] * 2 + p[0]; if (v < best) { best = v; s = i; } });
  pts = pts.slice(s).concat(pts.slice(0, s));
  const L = [0];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; L.push(L[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = L[L.length - 1], out = new Float64Array(n * 2);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * total;
    while (L[j + 1] < t) j++;
    const a = pts[j], b = pts[(j + 1) % pts.length], f = (t - L[j]) / ((L[j + 1] - L[j]) || 1);
    out[i * 2] = a[0] + (b[0] - a[0]) * f; out[i * 2 + 1] = a[1] + (b[1] - a[1]) * f;
  }
  return out;
}
function align(a, b) {                                                 // rotate b so that its points sit closest to a's
  const n = a.length / 2; let bestS = 0, bestD = Infinity;
  for (let s = 0; s < n; s += 2) {
    let d = 0;
    for (let i = 0; i < n; i += 3) { const j = (i + s) % n; const dx = a[i * 2] - b[j * 2], dy = a[i * 2 + 1] - b[j * 2 + 1]; d += dx * dx + dy * dy; }
    if (d < bestD) { bestD = d; bestS = s; }
  }
  const out = new Float64Array(b.length);
  for (let i = 0; i < n; i++) { const j = (i + bestS) % n; out[i * 2] = b[j * 2]; out[i * 2 + 1] = b[j * 2 + 1]; }
  return out;
}
async function loadShapes() {
  const get = async (name) => parse(/\sd="([^"]+)"/.exec(await (await fetch(`assets/shapes/${name}.svg`)).text())[1])
    .sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));            // [outer, inner]
  const [play, note] = await Promise.all([get("play"), get("note")]);
  const oa = resample(play[0], N_OUT), ob = align(oa, resample(note[0], N_OUT));
  const ia = resample(play[1], N_IN), ib = align(ia, resample(note[1], N_IN));
  P = { outer: [oa, ob], inner: [ia, ib] };
}

const NS = "http://www.w3.org/2000/svg";
let pathEls = [];        // every <path> that follows the shape (shadow, sheen, rims)
const gEl = shape.querySelector(".g");

const poly = (a, b, t, sc) => {
  let s = "";
  for (let i = 0; i < a.length; i += 2) {
    const x = (a[i] + (b[i] - a[i]) * t) * sc, y = (a[i + 1] + (b[i + 1] - a[i + 1]) * t) * sc;
    s += (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }
  return s + "Z";
};
/* ---- the light rim ---- */
const CS = 1.6;                                                        // canvas pixels per shape unit (sharp enough when the glass is scaled up)
const GK = matchMedia("(max-aspect-ratio:9/10)").matches ? 2.6207 : 5.3943, WD = matchMedia("(max-aspect-ratio:9/10)").matches ? 57.24 : 116.23;   // scene-2 scale and the glass width in design px (see home.css)
let rimCv = null, rimG = null;
const FLOOR = 0.04, POW = 1.7;
function rimLoop(a, b, t, g, wUnits) {
  const n = a.length / 2, X = new Float64Array(n), Y = new Float64Array(n), I = new Float64Array(n);
  for (let i = 0; i < n; i++) { X[i] = a[i * 2] + (b[i * 2] - a[i * 2]) * t; Y[i] = a[i * 2 + 1] + (b[i * 2 + 1] - a[i * 2 + 1]) * t; }
  for (let i = 0; i < n; i++) {
    const p = (i + n - 1) % n, q = (i + 1) % n;
    let tx = X[q] - X[p], ty = Y[q] - Y[p]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const c = Math.abs((-ty) * -0.7071 + tx * -0.7071);              // 1 when the edge faces the top left (or bottom right), 0 when it faces top right / bottom left
    I[i] = FLOOR + (1 - FLOOR) * Math.pow(c, POW);
  }
  g.lineWidth = wUnits * CS; g.lineCap = "butt";
  for (let i = 0; i < n; i++) {
    const q = (i + 1) % n, x1 = X[i] * CS, y1 = Y[i] * CS, x2 = X[q] * CS, y2 = Y[q] * CS;
    const gr = g.createLinearGradient(x1, y1, x2, y2);
    gr.addColorStop(0, `rgba(255,255,255,${I[i].toFixed(3)})`); gr.addColorStop(1, `rgba(255,255,255,${I[q].toFixed(3)})`);
    g.strokeStyle = gr; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 + (x2 - x1) * 0.06, y2 + (y2 - y1) * 0.06); g.stroke();
  }
}
function drawRim(t) {
  if (!rimG) return;
  const gk = 1 + (GK - 1) * t, w = 1.35 * 1000 / (WD * gk);          // about 1.3 design px wide in both scenes
  rimG.clearRect(0, 0, rimCv.width, rimCv.height);
  rimLoop(P.outer[0], P.outer[1], t, rimG, w);
  rimLoop(P.inner[0], P.inner[1], t, rimG, w);
}
function draw(t) {
  if (!P) return;
  const d = poly(P.outer[0], P.outer[1], t, 1) + poly(P.inner[0], P.inner[1], t, 1);
  for (const p of pathEls) p.setAttribute("d", d);
  drawRim(t);
  const w = glass.offsetWidth || 1;                                    // layout size (the page's own scale transform is applied on top)
  const px = w / 1000;
  gEl.style.clipPath = `path(evenodd,"${poly(P.outer[0], P.outer[1], t, px) + poly(P.inner[0], P.inner[1], t, px)}")`;
}
// the same easing as the CSS transform of the glass, so the shape and its move stay together
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => { let t = x; for (let i = 0; i < 8; i++) { const e = X(t) - x; if (Math.abs(e) < 1e-4) break; t -= e / (((3 * ax * t + 2 * bx) * t + cx) || 1); } return Y(Math.min(1, Math.max(0, t))); };
}
const ease = bezier(0.3, 0.8, 0.3, 1);
function morphTo(target) {
  cancelAnimationFrame(raf);
  const from = k, dur = reduce ? 1 : 1100, t0 = performance.now();
  const step = (now) => {
    const u = Math.min(1, (now - t0) / dur);
    k = from + (target - from) * ease(u);
    draw(k);
    if (u < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
addEventListener("resize", () => draw(k));

async function buildGlass() {
  try { await loadShapes(); } catch (e) { console.warn("shapes", e); return; }
  const svg = (inner) => `<svg viewBox="0 0 1000 1006.32" aria-hidden="true">${inner}</svg>`;
  const defs = `<defs>
    <linearGradient id="rim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1006"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".4" stop-color="#fff" stop-opacity=".62"/><stop offset=".7" stop-color="#fff" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
    <linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1006"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  shape.querySelector(".sh").innerHTML = svg(`<path class="shp" fill-rule="evenodd"/>`);
  shape.querySelector(".rim").innerHTML = svg(`${defs}
    <path fill="url(#sheen)" fill-rule="evenodd"/>
    <path class="gr" fill="none" stroke-width="16" stroke-linejoin="round"/>
        <path class="ln2" fill="none" stroke="rgba(38,64,44,.07)" stroke-linejoin="round" transform="translate(0 1.5)"/>`);
  pathEls = [...shape.querySelectorAll(".sh path, .rim path")];
  rimCv = document.createElement("canvas"); rimCv.width = Math.round(1000 * CS); rimCv.height = Math.round(1006.32 * CS); rimCv.setAttribute("aria-hidden", "true");
  rimG = rimCv.getContext("2d");
  shape.querySelector(".rim").append(rimCv);
  k = location.hash === "#menu" ? 1 : 0;
  draw(k);
  shape.classList.add("ready");
}
if (location.hash === "#menu") setScene(true, false);
buildGlass().then(() => draw(k));

/* =========================================================
   The person: he moves. 126 frames, played forward and then in reverse (so it loops seamlessly), at 12 fps.
   - Chrome, Edge, Firefox: one transparent WebM (VP9 + alpha) that already contains the forward-and-back loop.
   - Safari and everything on iOS can't show transparency in WebM, so they get the same frames as small WebP pictures
     painted on a canvas at 12 fps (loaded in the background; the still picture shows until they are ready).
   ========================================================= */
const FPS = 12;
const person = document.querySelector(".person");
const still = person.querySelector(".still");
const ua = navigator.userAgent;
const webkit = (/safari/i.test(ua) && !/chrome|chromium|crios|android|edg|opr/i.test(ua)) || /iphone|ipad|ipod/i.test(ua);
const canWebm = !webkit && !/[?&]frames(&|$)/.test(location.search) && vid.canPlayType('video/webm; codecs="vp9"') !== "";

function startVideo() {
  vid.src = "assets/person-12fps.webm";
  vid.playbackRate = 1;
  vid.addEventListener("playing", () => { vid.hidden = false; setTimeout(() => still.remove(), 400); }, { once: true });
  vid.play().catch(() => person.classList.add("still-only"));
}
function startFrames() {
  const N = 126, frames = new Array(N);
  let ready = 0;
  const cv = document.createElement("canvas");
  cv.width = 448; cv.height = 565;
  const g = cv.getContext("2d");
  const loadOne = (i) => new Promise((res) => {
    const im = new Image(); im.decoding = "async";
    im.onload = im.onerror = () => { ready++; res(); };
    im.src = `assets/pf/${String(i + 1).padStart(3, "0")}.webp`;
    frames[i] = im;
  });
  (async () => {
    for (let i = 0; i < N; i += 14) await Promise.all(Array.from({ length: Math.min(14, N - i) }, (_, j) => loadOne(i + j)));
    if (ready < N) return;
    cv.setAttribute("aria-hidden", "true");
    person.append(cv);
    let idx = 0, dir = 1, last = performance.now();
    g.drawImage(frames[0], 0, 0);
    const tick = (now) => {
      if (now - last >= 1000 / FPS) {
        last += 1000 / FPS * Math.max(1, Math.floor((now - last) / (1000 / FPS)));
        idx += dir;
        if (idx >= N - 1) { idx = N - 1; dir = -1; } else if (idx <= 0) { idx = 0; dir = 1; }
        g.clearRect(0, 0, cv.width, cv.height);
        g.drawImage(frames[idx], 0, 0);
        if (still.isConnected) setTimeout(() => still.remove(), 200);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();
}
if (reduce) person.classList.add("still-only");
else if (canWebm) startVideo();
else { person.classList.add("still-only"); startFrames(); }
