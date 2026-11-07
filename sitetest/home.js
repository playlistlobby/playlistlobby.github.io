// playlist.mag · Home: tap the glass play button -> it MORPHS into the playlist note, the menu comes in.
const body = document.body;
const glass = document.getElementById("glass");
const shape = glass.querySelector(".shape");
const menu = document.getElementById("menu");
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
  if (!two) setGlow(false);
  if (push) history.replaceState(null, "", two ? "#menu" : location.pathname + location.search);
}
glass.addEventListener("click", () => setScene(!scene2));
addEventListener("keydown", (e) => { if (e.key === "Escape" && scene2) setScene(false); });

/* leaving the page: a short fade, then go */
menu.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  body.classList.add("leaving");
  setTimeout(() => (location.href = a.href), 260);
});
addEventListener("pageshow", () => body.classList.remove("leaving")); // back button from another page

/* =========================================================
   Hover: the buttons glow green and the logo reacts
   ========================================================= */
function setGlow(on) { glass.classList.toggle("glow", on); menu.classList.toggle("glowing", on); }
menu.querySelectorAll("a").forEach((a) => {
  a.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") setGlow(true); });
  a.addEventListener("pointerleave", () => setGlow(false));
  a.addEventListener("focus", () => { if (a.matches(":focus-visible")) setGlow(true); });
  a.addEventListener("blur", () => setGlow(false));
  a.addEventListener("pointerdown", () => setGlow(true));   // touch: lights up while pressed / on the way out
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
function draw(t) {
  if (!P) return;
  const d = poly(P.outer[0], P.outer[1], t, 1) + poly(P.inner[0], P.inner[1], t, 1);
  for (const p of pathEls) p.setAttribute("d", d);
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
    <linearGradient id="rim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1006"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".06"/><stop offset=".7" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
    <linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1006"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  shape.querySelector(".sh").innerHTML = svg(`<path class="shp" fill-rule="evenodd"/>`);
  shape.querySelector(".rim").innerHTML = svg(`${defs}
    <path fill="url(#sheen)" fill-rule="evenodd"/>
    <path class="gr" fill="none" stroke-width="16" stroke-linejoin="round"/>
    <path fill="none" stroke="url(#rim)" stroke-width="7" stroke-linejoin="round"/>
    <path fill="none" stroke="rgba(38,64,44,.22)" stroke-width="2.5" stroke-linejoin="round" transform="translate(0 1.5)"/>`);
  pathEls = [...shape.querySelectorAll(".sh path, .rim path")];
  k = location.hash === "#menu" ? 1 : 0;
  draw(k);
  shape.classList.add("ready");
}
if (location.hash === "#menu") setScene(true, false);
buildGlass().then(() => draw(k));
