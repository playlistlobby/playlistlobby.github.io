// playlist.mag · Projects: an interactive iPhone. Tap an app, a photo gallery opens on the phone and the text changes.
import { API_BASE } from "../api.js";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* the page never scrolls: a refresh must not restore an old scroll position */
try { history.scrollRestoration = "manual"; } catch { /* old browser */ }
scrollTo(0, 0);

const screen = $("#screen");
const copy = $("#copy");
const titleEl = $("#title");
const textEl = $("#text");

let data = null;
let current = null;        // the open project
let photos = [];           // [{src, thumb, w, h, alt}] of the open project
let viewerIdx = -1;

/* ---------- the text on the right ---------- */
function setCopy(title, paras) {
  copy.classList.add("swap");
  setTimeout(() => {
    titleEl.textContent = title;
    textEl.innerHTML = (paras || []).map((p) => `<p>${esc(p)}</p>`).join("");
    copy.classList.remove("swap");
  }, 280);
}

/* ---------- screen markup ---------- */
const BACK_SVG = `<svg viewBox="0 0 62 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9db0cc"/><stop offset=".5" stop-color="#6f88ad"/><stop offset=".52" stop-color="#5d78a0"/><stop offset="1" stop-color="#6c86ad"/></linearGradient></defs><path d="M11.4 .8H57.2Q61 .8 61 4.6V25.4Q61 29.2 57.2 29.2H11.4L1 15Z" fill="url(#bk)" stroke="rgba(20,35,60,.65)" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
const statusBar = () => `<div class="sb-status"><span><span class="sb-bars"><i></i><i></i><i></i><i></i><i></i></span><b>Playlist</b>
  <svg class="sb-wifi" viewBox="0 0 12 9" fill="#fff" aria-hidden="true"><path d="M6 8.6 4.3 6.8A2.4 2.4 0 0 1 7.7 6.8ZM2.9 5.4A4.4 4.4 0 0 1 9.1 5.4L8 6.4A3 3 0 0 0 4 6.4ZM1.5 4A6.4 6.4 0 0 1 10.5 4L9.5 5A5 5 0 0 0 2.5 5ZM0 2.5A8.5 8.5 0 0 1 12 2.5L11 3.4A7 7 0 0 0 1 3.4Z" opacity=".95"/></svg></span>
  <span class="sb-time" data-clock></span><span><b>100%</b><i class="sb-batt"></i></span></div>`;

function build() {
  screen.innerHTML = `
    <div class="home" id="home">
      ${statusBar()}
      <div class="sb-grid" id="grid"></div>
      <div class="sb-dots"><i></i><i></i></div>
      <div class="sb-dock"><div class="sb-shelf"></div></div>
    </div>
    <div class="app" id="app"></div>`;
  const grid = $("#grid");
  data.projects.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "sb-app"; b.type = "button"; b.style.setProperty("--i", i);
    b.setAttribute("aria-label", `Open ${p.label}`);
    b.innerHTML = `<span class="sb-icon" style="background-image:url('${esc(p.icon)}')"></span><span class="sb-label">${esc(p.label)}</span>`;
    b.addEventListener("click", () => (p.href ? openLink(p, b) : openProject(p, b)));
    grid.append(b);
  });
  tick();
}

/* the clock in the status bars */
function tick() {
  const d = new Date();
  const h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, "0");
  const t = `${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
  document.querySelectorAll("[data-clock]").forEach((n) => (n.textContent = t));
}
setInterval(tick, 20000);

/* offset of an element inside the screen (unaffected by transforms) */
function centerIn(el, root) {
  let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x: (x / root.offsetWidth) * 100, y: (y / root.offsetHeight) * 100 };
}

/* ---------- an app that is a link (the game): the icon opens up to fill the phone like an iOS app, the springboard falls away, the page fades out, then the game loads ---------- */
function offsetIn(el, root) {
  let x = 0, y = 0, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y };
}
let launchEls = [];
function openLink(p, icon) {
  if (current) return;
  current = "link";
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const home = $("#home");
  const art = icon.querySelector(".sb-icon") || icon;
  const o = centerIn(icon, screen);
  home.style.transformOrigin = `${o.x}% ${o.y}%`;
  icon.classList.add("pressed");
  setCopy(p.title, p.text);
  try { sessionStorage.setItem("pm-from-site", location.pathname); } catch { /* the game just won't show its return button */ }   // only players who come through this app get the way back

  // the launch picture starts exactly on the icon
  const at = offsetIn(art, screen);
  const l = document.createElement("div");
  l.className = "launch";
  l.style.cssText = `left:${at.x}px;top:${at.y}px;width:${art.offsetWidth}px;height:${art.offsetHeight}px;background-image:url('${esc(p.icon)}')`;
  const fade = document.createElement("div");
  fade.className = "pagefade";
  document.body.append(fade);
  screen.append(l);
  launchEls = [l, fade];
  void l.offsetWidth;
  setTimeout(() => { l.classList.add("go"); l.style.left = l.style.top = "0px"; l.style.width = l.style.height = "100%"; home.classList.add("out"); }, 30);   // inline values would beat the class, so the end size is set inline too
  setTimeout(() => fade.classList.add("on"), reduce ? 0 : 420);                       // the whole page melts into the game's background
  setTimeout(() => { location.href = p.href; }, reduce ? 80 : 820);
}
// coming back with the browser's back button: the phone is on its home screen again
addEventListener("pageshow", (e) => {
  if (!e.persisted || current !== "link") return;
  current = null;
  launchEls.forEach((n) => n.remove()); launchEls = [];
  $("#home").classList.remove("out");
  document.querySelectorAll(".sb-app.pressed").forEach((n) => n.classList.remove("pressed"));
  setCopy(data.intro.title, data.intro.text);
});

/* ---------- open / close a project (photo gallery app) ---------- */
let iconEl = null;
async function openProject(p, icon) {
  if (current) return;
  current = p; iconEl = icon;
  const home = $("#home"), app = $("#app");
  const o = centerIn(icon, screen);
  home.style.transformOrigin = app.style.transformOrigin = `${o.x}% ${o.y}%`;
  icon.classList.add("pressed");
  setCopy(p.title, p.text);
  history.replaceState(null, "", `#${p.id}`);

  photos = [];
  if (Array.isArray(p.photos)) photos = p.photos.map((x) => ({ ...x }));              // saved by the admin: full addresses
  else if (typeof p.photos === "string") {                                           // built-in: a photos.json next to its pictures
    try { photos = (await (await fetch(p.photos)).json()).photos; } catch (e) { console.warn("photos.json", e); }
    const base = p.photos.replace(/[^/]*$/, "");
    photos = photos.map((x) => ({ ...x, src: base + x.src, thumb: base + x.thumb }));
  }

  app.innerHTML = `
    <div class="app-body" id="roll"><div class="ph-grid" id="phgrid"></div><p class="ph-count">${photos.length ? `${photos.length} ${photos.some((x) => x.type === "video") ? "Item" : "Photo"}${photos.length === 1 ? "" : "s"}` : "Nothing here yet"}</p></div>
    <div class="ios-top">${statusBar()}<div class="ios-nav"><button class="ios-back" type="button" id="back">${BACK_SVG}<span>Home</span></button><h2 class="ios-title">${esc(p.label)}</h2><span class="ios-ghost"></span></div></div>
    <div class="viewer" id="viewer">
      <div class="strip" id="strip"></div>
      <div class="ios-top">${statusBar()}<div class="ios-nav"><button class="ios-back" type="button" id="vback">${BACK_SVG}<span>${esc(p.label)}</span></button><h2 class="ios-title" id="vtitle"></h2><span class="ios-pager"><button class="ios-navbtn" type="button" id="vprev" aria-label="Previous photo">&lsaquo;</button><button class="ios-navbtn" type="button" id="vnext" aria-label="Next photo">&rsaquo;</button></span></div></div>
    </div>`;
  tick();
  const gridEl = $("#phgrid");
  photos.forEach((ph, i) => {
    const t = document.createElement("button");
    t.className = "th" + (ph.type === "video" ? " vid" : ""); t.type = "button"; t.setAttribute("aria-label", `${ph.type === "video" ? "Video" : "Photo"} ${i + 1}`);
    const im = new Image(); im.alt = ph.alt || ""; im.decoding = "async"; im.loading = "lazy";
    im.onload = () => im.classList.add("on"); im.src = ph.thumb;
    t.append(im);
    t.addEventListener("click", () => openViewer(i, t));
    gridEl.append(t);
  });
  $("#back").addEventListener("click", closeProject);
  wireViewer();

  requestAnimationFrame(() => requestAnimationFrame(() => { app.classList.add("open"); home.classList.add("out"); }));
}

function closeProject() {
  if (!current) return;
  if (viewerIdx >= 0) return closeViewer();
  const home = $("#home"), app = $("#app");
  app.classList.remove("open"); home.classList.remove("out");
  iconEl && iconEl.classList.remove("pressed");
  setCopy(data.intro.title, data.intro.text);
  history.replaceState(null, "", location.pathname + location.search);
  const done = current;
  setTimeout(() => { if (current === done) { app.innerHTML = ""; current = null; } }, 480);
  current = "closing";
  setTimeout(() => { if (current === "closing") current = null; }, 480);
}

/* ---------- the photo viewer (swipe, arrows, tap to hide the bars) ---------- */
const strip = () => $("#strip");
function slideHTML(i) {
  const p = photos[i];
  if (p && p.type === "video") return `<div class="slide"><video src="${esc(p.src)}" poster="${esc(p.thumb || "")}" controls playsinline preload="metadata"></video></div>`;
  return `<div class="slide">${p ? `<img src="${esc(p.src)}" alt="${esc(p.alt || "")}" draggable="false" ${p.w ? `width="${p.w}" height="${p.h}"` : ""}>` : ""}</div>`;
}
function paintStrip() {
  const s = strip();
  s.classList.remove("anim");
  s.style.transform = "translateX(0)";
  s.innerHTML = slideHTML(viewerIdx - 1) + slideHTML(viewerIdx) + slideHTML(viewerIdx + 1);
  $("#vtitle").textContent = `${viewerIdx + 1} of ${photos.length}`;
  $("#vprev").disabled = viewerIdx <= 0;
  $("#vnext").disabled = viewerIdx >= photos.length - 1;
  // warm the cache for the neighbours two steps away
  [viewerIdx - 2, viewerIdx + 2].forEach((j) => { if (photos[j] && photos[j].type !== "video") new Image().src = photos[j].src; });
}
function openViewer(i, thumb) {
  viewerIdx = i;
  const v = $("#viewer");
  const o = centerIn(thumb, screen);
  v.style.transformOrigin = `${o.x}% ${o.y}%`;
  v.classList.remove("bare");
  paintStrip();
  requestAnimationFrame(() => v.classList.add("open"));
}
function closeViewer() {
  const v = $("#viewer");
  const th = document.querySelectorAll(".th")[viewerIdx];
  if (th) { const o = centerIn(th, screen); v.style.transformOrigin = `${o.x}% ${o.y}%`; }
  v.classList.remove("open");
  viewerIdx = -1;
}
function go(d) {
  const n = viewerIdx + d;
  if (n < 0 || n >= photos.length) return;
  const s = strip();
  s.classList.add("anim");
  s.style.transform = `translateX(${d > 0 ? -33.3333 : 33.3333}%)`;
  const done = () => { s.removeEventListener("transitionend", done); viewerIdx = n; paintStrip(); };
  s.addEventListener("transitionend", done, { once: true });
}
function wireViewer() {
  const v = $("#viewer"), s = strip();
  $("#vback").addEventListener("click", closeViewer);
  $("#vprev").addEventListener("click", () => go(-1));
  $("#vnext").addEventListener("click", () => go(1));
  let x0 = 0, dx = 0, drag = false, moved = false, w = 1;
  s.addEventListener("pointerdown", (e) => {
    if (s.classList.contains("anim") || (e.target.closest && e.target.closest("video"))) return;   // a video keeps its own controls
    drag = true; moved = false; x0 = e.clientX; dx = 0; w = v.getBoundingClientRect().width || 1;
    s.setPointerCapture(e.pointerId);
  });
  s.addEventListener("pointermove", (e) => {
    if (!drag) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 6) moved = true;
    const edge = (dx > 0 && viewerIdx <= 0) || (dx < 0 && viewerIdx >= photos.length - 1);
    s.style.transform = `translateX(${edge ? dx * 0.3 : dx}px)`;
  });
  const end = () => {
    if (!drag) return; drag = false;
    if (!moved) { v.classList.toggle("bare"); s.style.transform = "translateX(0)"; return; }
    if (Math.abs(dx) > w * 0.18 && ((dx < 0 && viewerIdx < photos.length - 1) || (dx > 0 && viewerIdx > 0))) {
      // finish the swipe from where the finger left the picture
      s.classList.add("anim");
      s.style.transform = `translateX(${dx < 0 ? -w : w}px)`;
      const dir = dx < 0 ? 1 : -1;
      s.addEventListener("transitionend", () => { viewerIdx += dir; paintStrip(); }, { once: true });
    } else {
      s.classList.add("anim"); s.style.transform = "translateX(0)";
      s.addEventListener("transitionend", () => s.classList.remove("anim"), { once: true });
    }
  };
  s.addEventListener("pointerup", end);
  s.addEventListener("pointercancel", end);
}

/* ---------- the physical home button and the keyboard ---------- */
$("#home-hit").addEventListener("click", () => { if (viewerIdx >= 0) { $("#viewer").classList.remove("open"); viewerIdx = -1; } closeProject(); });
addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProject();
  else if (viewerIdx >= 0 && e.key === "ArrowRight") go(1);
  else if (viewerIdx >= 0 && e.key === "ArrowLeft") go(-1);
});

/* ---------- a little 3D tilt that follows the pointer (mouse only) ---------- */
const tilt = $("#tilt");
if (matchMedia("(hover:hover) and (pointer:fine)").matches && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
  addEventListener("pointermove", (e) => {
    const rx = (e.clientY / innerHeight - 0.4) * -3.2, ry = (e.clientX / innerWidth - 0.3) * 4.5;
    tilt.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  }, { passive: true });
  document.addEventListener("pointerleave", () => (tilt.style.transform = ""));
}

/* ---------- go ---------- */
/* the built-in list (projects.json) is the fallback; what the admin saved (the Worker) replaces its apps when it can be reached */
async function loadData() {
  const d = await (await fetch("projects.json?v=3", { cache: "no-cache" })).json();
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4500);
    const r = await fetch(API_BASE + "/api/projects", { cache: "no-store", signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (Array.isArray(j.projects)) d.projects = j.projects;
    if (j.intro && typeof j.intro.title === "string" && Array.isArray(j.intro.text)) d.intro = j.intro;
  } catch { /* offline or blocked: the built-in apps are shown */ }
  return d;
}
loadData().then((d) => {
  data = d;
  titleEl.textContent = d.intro.title;
  textEl.innerHTML = d.intro.text.map((p) => `<p>${esc(p)}</p>`).join("");
  build();
  const want = location.hash.slice(1);
  const at = d.projects.findIndex((p) => p.id === want);
  if (at >= 0 && !d.projects[at].href) setTimeout(() => openProject(d.projects[at], document.querySelectorAll(".sb-app")[at]), 900);
}).catch((e) => { textEl.textContent = "Couldn't load the projects."; console.error(e); });
