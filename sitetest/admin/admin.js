// playlist.mag · Admin: the apps on the projects page (picture, title, article, media, the page text), the shop (products, sizes, colours, photos, stock), and the orders and inquiries.
// Everything is kept here until "Save and publish"; the picture/video uploads go straight to the Worker.
import { API_BASE } from "../api.js";

const $ = (s, r = document) => r.querySelector(s);
const TOKEN_KEY = "pm-admin-token";
const MEDIA_PREFIX = API_BASE + "/media/";
const MAX_FILE = 24 * 1024 * 1024;               // one request (pictures)
const PART = 8 * 1024 * 1024, MAX_VIDEO = 100 * 1024 * 1024;   // videos over MAX_FILE are sent in parts

/* tiny element builder: h("div", {class:"x", onclick}, child, "text") (text always goes in as text, never as HTML) */
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") el.style.cssText = v;
    else if (k in el && k !== "list") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

/* ---------- state ---------- */
let token = "";
try { token = sessionStorage.getItem(TOKEN_KEY) || ""; } catch { /* no storage */ }
let apps = [];                 // the working copy
let savedMedia = new Set();    // media addresses of the last saved version (to clean up what is no longer used)
let sel = -1;                  // selected app (-2 = the page text)
let intro = { title: "Projects", text: [] };   // the text next to the phone while no app is open
let dirty = false;             // unsaved changes in Apps
let sdirty = false;            // unsaved changes in Shop
let busy = 0;                  // running uploads

const res = (u) => (/^https?:\/\//.test(u || "") ? u : "../projects/" + (u || ""));      // preview address of a stored one
function updateBar() {
  const shopView = view === "shop", cur = shopView ? sdirty : dirty, other = shopView ? dirty : sdirty;
  $("#dirty").hidden = !(cur || other);
  $("#dirty").textContent = cur ? "Unsaved changes" : "Unsaved changes in " + (shopView ? "Apps" : "Shop");
  $("#save").disabled = !cur || busy > 0;
}
function setDirty(v = true) { dirty = v; updateBar(); }
function setSDirty(v = true) { sdirty = v; updateBar(); }
let toastT = 0;
function toast(msg, bad = false) {
  const t = $("#toast");
  t.textContent = msg; t.classList.toggle("bad", bad); t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), bad ? 6000 : 2600);
}
addEventListener("beforeunload", (e) => { if (dirty || sdirty || busy) { e.preventDefault(); e.returnValue = ""; } });

/* ---------- talking to the Worker ---------- */
async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.authorization = "Bearer " + token;
  let r;
  try { r = await fetch(API_BASE + path, { ...opts, headers }); } catch { throw new Error("Can't reach the server. Check your connection."); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== "/api/login") { showLogin("Your session ended. Log in again."); throw new Error("Logged out"); }
  if (!r.ok) throw new Error(j.error || `Something went wrong (${r.status})`);
  return j;
}
async function uploadBlob(blob) {
  if (blob.size > MAX_FILE) return uploadParts(blob);
  const j = await api("/api/media", { method: "POST", headers: { "content-type": blob.type }, body: blob });
  return j.url;
}
/* a big video: sent in 8 MB parts (each retried a few times), then put together on the server */
async function uploadParts(blob) {
  const parts = Math.ceil(blob.size / PART), type = encodeURIComponent(blob.type);
  let id = "";
  for (let i = 0; i < parts; i++) {
    toast(`Uploading the video… ${Math.round((i / parts) * 100)}%`);
    for (let tries = 1; ; tries++) {
      try { id = (await api(`/api/media/part?n=${i}&type=${type}${id ? "&id=" + id : ""}`, { method: "POST", headers: { "content-type": "application/octet-stream" }, body: blob.slice(i * PART, (i + 1) * PART) })).id; break; }
      catch (e) { if (tries >= 3 || e.message === "Logged out") throw e; await new Promise((r) => setTimeout(r, 800 * tries)); }
    }
  }
  return (await api("/api/media/finish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, parts, size: blob.size }) })).url;
}

/* Texts are kept exactly as typed (line breaks and empty lines included) as one block; older texts that were saved as separate paragraphs are shown with an empty line between them, which is how the page showed them. */
const packText = (v) => { const t = String(v || "").replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, ""); return t.trim() ? [t] : []; };
const unpackText = (a) => (Array.isArray(a) ? a : []).join("\n\n");

/* ---------- pictures: resized in the browser so the uploads stay small ---------- */
const toBlob = (c, type, q) => new Promise((ok) => c.toBlob((b) => ok(b), type, q));
async function bitmapOf(file) {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { return await createImageBitmap(file); }
}
async function scaled(bmp, maxSide, type = "image/webp", q = 0.86) {
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  let b = await toBlob(c, type, q);
  if (!b) b = await toBlob(c, "image/jpeg", q);
  return { blob: b, w: c.width, h: c.height };
}
/* the icon cropper: drag the picture, zoom with the slider or the wheel; the result is a square 512 px picture (zoomed out = empty edges stay see-through).
   source: a File, or the address of a picture (to adjust the icon that is already there). Resolves to a Blob, or null when cancelled. */
function cropIcon(source) {
  return new Promise(async (done) => {
    let bmp;
    try { bmp = typeof source === "string" ? await createImageBitmap(await (await fetch(source, { cache: "no-store" })).blob()) : await bitmapOf(source); }
    catch { toast("That picture can't be read.", true); return done(null); }
    const S = 300;                                                  // size of the preview square in px
    const cv = h("canvas", { width: S, height: S, class: "crop-cv" });
    const g = cv.getContext("2d");
    const base = Math.max(S / bmp.width, S / bmp.height);           // zoom 1 = the picture just covers the square
    let z = 1, ox = 0, oy = 0;
    const draw = (ctx, size, k) => {
      const s = base * z * k, w = bmp.width * s, hh = bmp.height * s;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(bmp, size / 2 + ox * k - w / 2, size / 2 + oy * k - hh / 2, w, hh);
    };
    const paint = () => { g.fillStyle = "#e9edf2"; g.fillRect(0, 0, S, S); draw(g, S, 1); };
    const zoom = h("input", { type: "range", min: "0.4", max: "4", step: "0.01", value: "1", "aria-label": "Zoom", oninput: (e) => { z = Number(e.target.value); paint(); } });
    const setZ = (v) => { z = Math.min(4, Math.max(0.4, v)); zoom.value = String(z); paint(); };
    let drag = null;
    cv.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, ox, oy }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => { if (!drag) return; const r = cv.getBoundingClientRect(), k = S / r.width; ox = drag.ox + (e.clientX - drag.x) * k; oy = drag.oy + (e.clientY - drag.y) * k; paint(); });
    const end = () => { drag = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("wheel", (e) => { e.preventDefault(); setZ(z * (e.deltaY < 0 ? 1.06 : 1 / 1.06)); }, { passive: false });
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey); done(v); };
    const onKey = (e) => { if (e.key === "Escape") close(null); };
    const use = h("button", { class: "btn primary", type: "button", onclick: async () => {
      const out = document.createElement("canvas"); out.width = out.height = 512; draw(out.getContext("2d"), 512, 512 / S);
      close((await toBlob(out, "image/webp", 0.92)) || (await toBlob(out, "image/png")));
    } }, "Use this icon");
    const back = h("div", { class: "crop-back", onclick: (e) => { if (e.target === back) close(null); } },
      h("div", { class: "card crop-card", role: "dialog", "aria-label": "Fit the icon" },
        h("h3", {}, "Fit the icon"),
        h("p", { class: "muted tiny" }, "Drag the picture to move it, use the slider (or the mouse wheel) to make it bigger or smaller."),
        h("div", { class: "crop-frame" }, cv, h("span", { class: "crop-mask", "aria-hidden": "true" })),
        h("div", { class: "crop-zoom" }, h("span", {}, "\u2212"), zoom, h("span", {}, "+")),
        h("div", { class: "crop-btns" }, h("button", { class: "btn ghost", type: "button", onclick: () => { z = 1; ox = oy = 0; zoom.value = "1"; paint(); } }, "Reset"), h("span", { style: "flex:1" }), h("button", { class: "btn ghost", type: "button", onclick: () => close(null) }, "Cancel"), use)));
    document.body.append(back); document.addEventListener("keydown", onKey);
    paint();
  });
}
/* ---------- fitting a picture into the phone: the thumbnail, the desktop viewer, the phone viewer ----------
   A picture's place in a frame is {l, t, w}: its left edge, top edge and width, as fractions of the frame (the height follows from the picture's shape).
   No saved place = the page's own default (the thumbnail and the desktop viewer fill the frame, the desktop one from the bottom; the phone viewer shows the whole picture). */
const FRAMES = {
  grid:  { label: "Thumbnail",      note: "The small square in the gallery.", F: 1, pw: 240 },
  desk:  { label: "Desktop viewer", note: "The picture when it is opened on a computer (the top part of the phone).", F: 320 / 262, pw: 320 },
  phone: { label: "Phone viewer",   note: "The picture when it is opened on a phone: the whole phone screen.", F: 320 / 568, pw: 190 },
};
const boxCss = (b) => `left:${+(b.l * 100).toFixed(3)}%;top:${+(b.t * 100).toFixed(3)}%;width:${+(b.w * 100).toFixed(3)}%`;
const minWidthOf = (kind, A) => { const F = FRAMES[kind].F; return kind === "phone" ? Math.min(1, A / F) : Math.max(1, A / F); };
function defaultBox(kind, A) {
  const F = FRAMES[kind].F, w = minWidthOf(kind, A), hh = w * F / A;
  return { l: (1 - w) / 2, t: kind === "desk" ? 1 - hh : (1 - hh) / 2, w };
}
function clampBox(kind, A, b) {
  const F = FRAMES[kind].F, mw = minWidthOf(kind, A), w = Math.min(mw * 4, Math.max(mw, b.w)), hh = w * F / A;
  const lim = (v, size) => (size >= 1 ? Math.min(0, Math.max(1 - size, v)) : Math.min(1 - size, Math.max(0, v)));   // a picture bigger than the frame always covers it
  return { l: lim(b.l, w), t: lim(b.t, hh), w };
}
/* the fitting dialog: resolves to the new {grid, desk, phone} (only the ones that were set; {} = everything default), or null when cancelled */
function cropMedia(m) {
  return new Promise(async (done) => {
    const video = m.type === "video", src = res(video ? m.thumb : m.src);
    const pic = new Image();
    try { await new Promise((ok, no) => { pic.onload = ok; pic.onerror = no; pic.src = src; }); } catch { toast("That picture can't be loaded.", true); return done(null); }
    const A = pic.naturalWidth / pic.naturalHeight, kinds = video ? ["grid"] : ["grid", "desk", "phone"];
    const st = {}; kinds.forEach((k) => { st[k] = m.crop && m.crop[k] ? clampBox(k, A, m.crop[k]) : null; });
    let kind = "grid";
    const boxOf = () => st[kind] || defaultBox(kind, A);
    const img = h("img", { src, alt: "", draggable: "false", class: "fit-img" });
    const frame = h("div", { class: "fit-frame" }, img);
    const zoom = h("input", { type: "range", min: "1", max: "4", step: "0.01", value: "1", "aria-label": "Zoom" });
    const tabs = h("div", { class: "fit-tabs" });
    const note = h("p", { class: "muted tiny" });
    const paint = () => {
      const f = FRAMES[kind], b = boxOf();
      frame.style.width = f.pw + "px"; frame.style.aspectRatio = String(f.F); frame.className = "fit-frame " + kind;
      img.style.cssText = boxCss(b);
      zoom.value = String(b.w / minWidthOf(kind, A));
      tabs.replaceChildren(...kinds.map((k) => h("button", { type: "button", class: "fit-tab" + (k === kind ? " on" : ""), onclick: () => { kind = k; paint(); } }, FRAMES[k].label + (st[k] ? " •" : ""))));
      note.textContent = f.note + (st[kind] ? "" : " (Now: the default fit.)");
    };
    const set = (b) => { st[kind] = clampBox(kind, A, b); paint(); };
    zoom.addEventListener("input", () => {
      const b = boxOf(), F = FRAMES[kind].F, hh = b.w * F / A, w = minWidthOf(kind, A) * Number(zoom.value), h2 = w * F / A;
      const cx = (0.5 - b.l) / b.w, cy = (0.5 - b.t) / hh;                 // keep the middle of the frame on the same spot of the picture
      set({ l: 0.5 - cx * w, t: 0.5 - cy * h2, w });
    });
    let drag = null;
    frame.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, b: boxOf() }; frame.setPointerCapture(e.pointerId); });
    frame.addEventListener("pointermove", (e) => { if (!drag) return; const r = frame.getBoundingClientRect(); set({ l: drag.b.l + (e.clientX - drag.x) / r.width, t: drag.b.t + (e.clientY - drag.y) / r.height, w: drag.b.w }); });
    const end = () => { drag = null; };
    frame.addEventListener("pointerup", end); frame.addEventListener("pointercancel", end);
    frame.addEventListener("wheel", (e) => { e.preventDefault(); zoom.value = String(Math.min(4, Math.max(1, Number(zoom.value) * (e.deltaY < 0 ? 1.06 : 1 / 1.06)))); zoom.dispatchEvent(new Event("input")); }, { passive: false });
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey); done(v); };
    const onKey = (e) => { if (e.key === "Escape") close(null); };
    const back = h("div", { class: "crop-back", onclick: (e) => { if (e.target === back) close(null); } },
      h("div", { class: "card crop-card fit-card", role: "dialog", "aria-label": "Fit the picture" },
        h("h3", {}, "Crop, scale and position"),
        h("p", { class: "muted tiny" }, "Drag the picture to move it, use the slider (or the mouse wheel) to zoom. Each place has its own setting." + (video ? " (A video can only be placed in its thumbnail.)" : "")),
        tabs, h("div", { class: "fit-stage" }, frame), note,
        h("div", { class: "crop-zoom" }, h("span", {}, "\u2212"), zoom, h("span", {}, "+")),
        h("div", { class: "crop-btns" },
          h("button", { class: "btn ghost", type: "button", onclick: () => { st[kind] = null; paint(); } }, "Default fit"),
          h("span", { style: "flex:1" }),
          h("button", { class: "btn ghost", type: "button", onclick: () => close(null) }, "Cancel"),
          h("button", { class: "btn primary", type: "button", onclick: () => { const o = {}; kinds.forEach((k) => { if (st[k]) o[k] = { l: +st[k].l.toFixed(4), t: +st[k].t.toFixed(4), w: +st[k].w.toFixed(4) }; }); close(o); } }, "Save"))));
    document.body.append(back); document.addEventListener("keydown", onKey);
    paint();
  });
}

async function squareIcon(file) {                               // centre-cropped square, 256 px; the gloss/shading is added by CSS like the other apps
  const bmp = await bitmapOf(file);
  const side = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas"); c.width = c.height = 256;
  c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 256, 256);
  return (await toBlob(c, "image/webp", 0.9)) || (await toBlob(c, "image/png"));
}
function videoPoster(file) {
  return new Promise((ok, no) => {
    const v = document.createElement("video"), url = URL.createObjectURL(file);
    v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = url;
    const done = (fn, x) => { URL.revokeObjectURL(url); fn(x); };
    v.onerror = () => done(no, new Error("This video can't be read by the browser (use mp4 or webm)."));
    v.onloadedmetadata = () => { v.currentTime = Math.min(0.2, (v.duration || 1) / 2); };
    v.onseeked = async () => {
      try {
        const k = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        done(ok, { blob: await toBlob(c, "image/jpeg", 0.8), w: v.videoWidth, h: v.videoHeight });
      } catch (e) { done(no, e); }
    };
  });
}

/* ---------- loading what the site currently shows ---------- */
async function loadAll() {
  const saved = await api("/api/projects");
  const d = await (await fetch("../projects/projects.json", { cache: "no-cache" })).json();
  const i = saved.intro || d.intro || {};
  intro = { title: i.title || "Projects", text: [...(i.text || [])] };
  let list = saved.projects;
  if (!Array.isArray(list)) {                                   // nothing saved yet: start from the built-in apps
    list = d.projects;
    for (const p of list) {
      if (typeof p.photos === "string") {                       // built-in gallery: read its photos.json into a plain list
        const base = p.photos.replace(/[^/]*$/, "");
        const j = await (await fetch("../projects/" + p.photos)).json();
        p.photos = j.photos.map((x) => ({ src: base + x.src, thumb: base + x.thumb, w: x.w || 0, h: x.h || 0, alt: x.alt || "" }));
      }
    }
    setDirty(false);
  }
  apps = list.map((p) => ({ ...p, text: [...(p.text || [])], photos: p.photos ? p.photos.map((x) => ({ ...x })) : (p.href ? undefined : []) }));
  savedMedia = mediaOf(Array.isArray(saved.projects) ? apps : []);
  sel = apps.length ? 0 : -1;
}
function mediaOf(list) {
  const s = new Set();
  const add = (u) => { if (typeof u === "string" && u.startsWith(MEDIA_PREFIX)) s.add(u); };
  for (const p of list) { add(p.icon); (Array.isArray(p.photos) ? p.photos : []).forEach((m) => { add(m.src); add(m.thumb); }); }
  return s;
}

/* ---------- views ---------- */
function showLogin(msg = "") {
  token = ""; try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* */ }
  $("#login").hidden = false; $("#admin").hidden = true; $("#saveBar").hidden = true; $("#barRight").hidden = true; $("#tabsbar").hidden = true; $("#inbox").hidden = true; $("#shopAdmin").hidden = true; view = "apps";
  $("#loginErr").textContent = msg; $("#pw").value = "";
}
async function showAdmin() {
  await Promise.all([loadAll(), loadShop()]);
  $("#login").hidden = true; $("#barRight").hidden = false; $("#tabsbar").hidden = false;
  renderList(); renderEditor(); renderPList(); renderPEditor();
  setView("apps"); loadInbox();
  setDirty(false); setSDirty(false);
}

function iconBox(p, size) {
  const b = h("span", { class: "sb-icon" + (p.icon ? "" : " empty"), style: `--ic:${size}px;${p.icon ? `background-image:url('${res(p.icon).replace(/'/g, "%27")}')` : ""}` }, p.icon ? null : "?");
  return b;
}
function renderList() {
  const ul = $("#appList");
  ul.replaceChildren(
    h("li", { class: "app-row" + (sel === -2 ? " on" : ""), onclick: () => { sel = -2; renderList(); renderEditor(); } },
      h("span", { class: "sb-icon empty", style: "--ic:44px" }, "Aa"),
      h("span", { class: "nm" }, "Page text", h("small", {}, "Next to the phone"))),
    ...apps.map((p, i) => h("li", { class: "app-row" + (i === sel ? " on" : ""), onclick: () => { sel = i; renderList(); renderEditor(); } },
    iconBox(p, 44),
    h("span", { class: "nm" }, p.label || "Untitled", h("small", {}, p.href ? "Link: " + p.href : `${(p.photos || []).length} media`)),
    h("span", { class: "arrows" },
      h("button", { type: "button", title: "Move up", disabled: i === 0, onclick: (e) => { e.stopPropagation(); move(i, -1); } }, "▲"),
      h("button", { type: "button", title: "Move down", disabled: i === apps.length - 1, onclick: (e) => { e.stopPropagation(); move(i, 1); } }, "▼")))));
}
function move(i, d) {
  const j = i + d; if (j < 0 || j >= apps.length) return;
  [apps[i], apps[j]] = [apps[j], apps[i]];
  if (sel === i) sel = j; else if (sel === j) sel = i;
  setDirty(); renderList();
}

function renderIntro() {
  const title = h("input", { type: "text", value: intro.title || "", maxLength: 80, placeholder: "Projects", oninput: (e) => { intro.title = e.target.value; setDirty(); } });
  const text = h("textarea", { placeholder: "Tap an app on the phone to open a project.", oninput: (e) => { intro.text = packText(e.target.value); setDirty(); } });
  text.value = unpackText(intro.text);
  $("#editor").replaceChildren(h("div", { class: "card sect" },
    h("h3", {}, "Page text"),
    h("p", { class: "muted tiny" }, "What the projects page says next to the phone until an app is opened (and again when it is closed)."),
    h("label", { class: "f" }, "Title", title),
    h("label", { class: "f" }, "Text", h("small", {}, "Line breaks and empty lines appear on the page exactly as you type them."), text)));
}
function renderEditor() {
  const ed = $("#editor");
  if (sel === -2) return renderIntro();
  const p = apps[sel];
  if (!p) { ed.replaceChildren(h("div", { class: "card empty-note muted" }, "No apps yet. Press “+ Add app”.")); return; }

  // icon
  const iconPrev = iconBox(p, 96);
  const iconInput = h("input", { type: "file", accept: "image/*", hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    busy++; setDirty(dirty);
    try { const blob = await cropIcon(f); if (!blob) return; p.icon = await uploadBlob(blob); setDirty(); renderList(); renderEditor(); }
    catch (err) { toast(err.message, true); }
    finally { busy--; setDirty(dirty); }
  } });

  const label = h("input", { type: "text", value: p.label || "", maxLength: 16, placeholder: "Name under the icon", oninput: (e) => { p.label = e.target.value; setDirty(); renderList(); } });
  const title = h("input", { type: "text", value: p.title || "", maxLength: 32, placeholder: "Big title next to the phone", oninput: (e) => { p.title = e.target.value; setDirty(); } });
  const text = h("textarea", { placeholder: "Write the article here. Line breaks and empty lines appear on the page exactly as you type them.", oninput: (e) => { p.text = packText(e.target.value); setDirty(); } });
  text.value = unpackText(p.text);
  const btnLabel = h("input", { type: "text", value: (p.button && p.button.label) || "", maxLength: 24, placeholder: "Button name, e.g. Play the game", oninput: (e) => { p.button = { ...(p.button || {}), label: e.target.value }; setDirty(); } });
  const btnHref = h("input", { type: "text", value: (p.button && p.button.href) || "", maxLength: 120, placeholder: "Where it goes, e.g. /hotel/", oninput: (e) => { p.button = { ...(p.button || {}), href: e.target.value.trim() }; setDirty(); } });
  const href = h("input", { type: "text", value: p.href || "", placeholder: "Leave empty for a normal gallery app", oninput: (e) => {
    p.href = e.target.value.trim() || undefined;
    if (p.href && !p.photos) p.photos = undefined; else if (!p.href && !p.photos) p.photos = [];
    setDirty(); renderList(); mediaSect.hidden = !!p.href;
  } });

  // media
  const grid = h("div", { class: "media-grid" });
  const mediaInput = h("input", { type: "file", accept: "image/*,video/mp4,video/webm", multiple: true, hidden: true, onchange: async (e) => {
    const files = [...e.target.files]; e.target.value = "";
    if (!p.photos) p.photos = [];
    for (const f of files) {
      const tile = h("div", { class: "tile up" }, "Uploading " + f.name.slice(0, 18) + "…");
      grid.insertBefore(tile, addTile);
      busy++; setDirty(dirty);
      try { p.photos.push(await uploadMedia(f)); setDirty(); }
      catch (err) { toast(`${f.name}: ${err.message}`, true); }
      finally { busy--; tile.remove(); setDirty(dirty); }
      drawMedia();
    }
    renderList();
  } });
  const addTile = h("div", { class: "addtile", onclick: () => mediaInput.click() }, "+ Add pictures or videos");
  function drawMedia() {
    grid.replaceChildren(...(p.photos || []).map((m, i, all) => h("div", { class: "tile" },
      h("img", { src: res(m.thumb), alt: "", loading: "lazy", ...(m.crop && m.crop.grid ? { class: "cr", style: boxCss(m.crop.grid) } : {}) }),
      m.type === "video" ? h("span", { class: "badge" }, "VIDEO") : null,
      h("div", { class: "tools" },
        h("button", { type: "button", title: "Earlier", disabled: i === 0, onclick: () => { [all[i - 1], all[i]] = [all[i], all[i - 1]]; setDirty(); drawMedia(); } }, "◀"),
        h("button", { type: "button", title: "Crop, scale and position" + (m.crop ? " (changed)" : ""), onclick: async () => {
          const c = await cropMedia(m); if (c === null) return;
          if (Object.keys(c).length) m.crop = c; else delete m.crop;
          setDirty(); drawMedia();
        } }, m.crop ? "\u2726" : "\u2922"),
        h("button", { type: "button", class: "x", title: "Remove", onclick: () => { all.splice(i, 1); setDirty(); drawMedia(); renderList(); } }, "✕"),
        h("button", { type: "button", title: "Later", disabled: i === all.length - 1, onclick: () => { [all[i + 1], all[i]] = [all[i], all[i + 1]]; setDirty(); drawMedia(); } }, "▶"))
    )), addTile);
  }
  drawMedia();
  const mediaSect = h("div", { class: "card sect", hidden: !!p.href },
    h("h3", {}, "Media"),
    h("p", { class: "muted tiny" }, "Pictures and videos shown in the gallery on the phone, in this order. Pictures are resized automatically; a video can be up to 100 MB (mp4 or webm)."),
    grid, mediaInput);

  ed.replaceChildren(
    h("div", { class: "card sect" },
      h("h3", {}, "Icon"),
      h("div", { class: "icon-row" }, iconPrev,
        h("div", {},
          h("div", { class: "icon-btns" },
            h("button", { class: "btn", type: "button", onclick: () => iconInput.click() }, p.icon ? "Change picture" : "Upload picture"),
            p.icon ? h("button", { class: "btn ghost", type: "button", onclick: async () => {
              busy++; setDirty(dirty);
              try { const blob = await cropIcon(res(p.icon)); if (!blob) return; p.icon = await uploadBlob(blob); setDirty(); renderList(); renderEditor(); }
              catch (err) { toast(err.message, true); }
              finally { busy--; setDirty(dirty); }
            } }, "Resize / move") : null),
          h("p", { class: "muted tiny", style: "margin-top:8px" }, "Any picture. You fit it in the square yourself; it is shaded like the other apps on the phone.")),
        iconInput)),
    h("div", { class: "card sect" },
      h("h3", {}, "Text"),
      h("label", { class: "f" }, "Name under the icon", h("small", {}, "Up to 16 characters."), label),
      h("label", { class: "f" }, "Title", h("small", {}, "The big heading next to the phone when the app is open. Up to 32 characters."), title),
      h("label", { class: "f" }, "Article", text)),
    h("div", { class: "card sect" },
      h("h3", {}, "Button under the text"),
      h("p", { class: "muted tiny" }, "Optional. A button under the article that opens a page of the site, like the game: /hotel/. Leave both empty for no button."),
      h("label", { class: "f" }, "Button name", btnLabel),
      h("label", { class: "f" }, "Opens (an address on this site)", btnHref)),
    mediaSect,
    h("div", { class: "card sect" },
      h("h3", {}, "Link (optional)"),
      h("label", { class: "f" }, "Open this address instead of a gallery", h("small", {}, "For an app that is really a link, like the game: /hotel/"), href)),
    h("div", { class: "row-end" },
      h("button", { class: "btn danger", type: "button", onclick: () => removeApp(sel) }, "Delete this app"),
      h("span", {})));
}

async function uploadMedia(f) {
  if (f.type.startsWith("video/")) {
    if (!["video/mp4", "video/webm"].includes(f.type)) throw new Error("videos must be mp4 or webm");
    if (f.size > MAX_VIDEO) throw new Error("the video is over 100 MB, compress it first");
    const poster = await videoPoster(f);
    const [src, thumb] = [await uploadBlob(f), await uploadBlob(poster.blob)];
    return { src, thumb, w: poster.w, h: poster.h, alt: "", type: "video" };
  }
  if (!f.type.startsWith("image/")) throw new Error("not a picture or video");
  if (f.type === "image/gif") {                                  // keep animated gifs as they are
    if (f.size > MAX_FILE) throw new Error("the gif is over 24 MB");
    const bmp = await bitmapOf(f), t = await scaled(bmp, 480, "image/webp", 0.8);
    return { src: await uploadBlob(f), thumb: await uploadBlob(t.blob), w: bmp.width, h: bmp.height, alt: "" };
  }
  const bmp = await bitmapOf(f);
  const big = await scaled(bmp, 1800, "image/webp", 0.86), small = await scaled(bmp, 480, "image/webp", 0.8);
  return { src: await uploadBlob(big.blob), thumb: await uploadBlob(small.blob), w: big.w, h: big.h, alt: "" };
}

function removeApp(i) {
  const p = apps[i];
  if (!p || !confirm(`Delete “${p.label || "this app"}” and all its media? This goes live when you save.`)) return;
  apps.splice(i, 1);
  sel = Math.min(sel, apps.length - 1);
  setDirty(); renderList(); renderEditor();
}
$("#addApp").addEventListener("click", () => {
  apps.push({ id: "app-" + Math.random().toString(36).slice(2, 8), label: "New app", icon: "", title: "New app", text: [], photos: [] });
  sel = apps.length - 1; setDirty(); renderList(); renderEditor();
  $("#editor").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- save ---------- */
async function saveApps() {
  for (const p of apps) {
    if (!p.label?.trim()) { toast("Every app needs a name under its icon.", true); sel = apps.indexOf(p); renderList(); renderEditor(); return; }
    if (!p.icon) { toast(`“${p.label}” needs an icon picture.`, true); sel = apps.indexOf(p); renderList(); renderEditor(); return; }
  }
  const btn = $("#save"); btn.disabled = true; $("#saveMsg").textContent = "Saving…";
  try {
    const body = apps.map((p) => ({ id: p.id, label: p.label.trim(), icon: p.icon, title: (p.title || "").trim() || p.label.trim(), text: p.text || [], button: (p.button && p.button.label && p.button.href) ? { label: p.button.label.trim(), href: p.button.href.trim() } : null, ...(p.href ? { href: p.href } : { photos: p.photos || [] }) }));
    const out = await api("/api/projects", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ projects: body, intro: { title: (intro.title || "").trim() || "Projects", text: intro.text || [] } }) });
    const now = mediaOf(out.projects);
    for (const u of savedMedia) if (!now.has(u)) fetch(u, { method: "DELETE", headers: { authorization: "Bearer " + token } }).catch(() => {});   // free what is no longer used
    savedMedia = now;
    setDirty(false);
    $("#saveMsg").textContent = "Saved. The projects page is updated.";
    toast("Saved: the projects page is updated.");
  } catch (err) { $("#saveMsg").textContent = ""; toast(err.message, true); setDirty(true); }
}
$("#save").addEventListener("click", () => (view === "shop" ? saveShop() : saveApps()));


/* ---------- the shop: products with pictures, sizes, colours, stock ---------- */
let products = [];             // the working copy
let selP = -1;                 // selected product
let stockLive = {};            // "product|size|colour" -> count, as the shop has it
let stockTouched = {};         // the counts changed here (only these are sent, so a sale made meanwhile is not overwritten)
let savedShopMedia = new Set();
const DEFAULT_SHOP = [{ id: "playlist-tee", name: "Playlist tee", price: 10000, on: true, track: false, img: "assets/tee-playlist3.webp", photos: [], colors: [],
  blurb: "A white cotton tee with the playlist logo in liquid glass on the chest.", sizes: ["S", "M", "L", "XL"].map((n) => ({ id: n.toLowerCase(), name: n, on: true })) }];
const resS = (u) => (/^https?:\/\//.test(u || "") ? u : "../shop/" + (u || ""));
const rid = () => Math.random().toString(36).slice(2, 8);
const skey = (p, sid, cid) => `${p.id}|${sid || "x"}|${cid || "x"}`;
const stockOf = (p, sid, cid) => { const k = skey(p, sid, cid); return k in stockTouched ? stockTouched[k] : (stockLive[k] ?? 0); };
const normP = (p) => ({ ...p, on: p.on !== false, track: !!p.track, blurb: p.blurb || "", photos: (p.photos || []).map((x) => ({ ...x })), sizes: (p.sizes || []).map((x) => ({ ...x, on: x.on !== false })), colors: (p.colors || []).map((x) => ({ ...x, on: x.on !== false })) });
function shopMediaOf(list) {
  const s = new Set(), add = (u) => { if (typeof u === "string" && u.startsWith(MEDIA_PREFIX)) s.add(u); };
  for (const p of list) { add(p.img); (p.photos || []).forEach((m) => { add(m.src); add(m.thumb); }); (p.colors || []).forEach((c) => add(c.img)); }
  return s;
}
async function loadShop() {
  const j = await api("/api/shop");
  products = (Array.isArray(j.shop) ? j.shop : JSON.parse(JSON.stringify(DEFAULT_SHOP))).map(normP);
  stockLive = j.stock || {}; stockTouched = {};
  savedShopMedia = shopMediaOf(Array.isArray(j.shop) ? products : []);
  selP = products.length ? 0 : -1;
}

/* a picture with a see-through background (PNG): trimmed to its content and centred on a square, so every product sits the same on the ring */
async function cutout(file, side = 1000) {
  const bmp = await bitmapOf(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * k)), hh = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement("canvas"); c.width = w; c.height = hh;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(bmp, 0, 0, w, hh);
  const d = x.getImageData(0, 0, w, hh).data;
  let x0 = w, y0 = hh, x1 = -1, y1 = -1;
  for (let y = 0; y < hh; y++) for (let xx = 0; xx < w; xx++) if (d[(y * w + xx) * 4 + 3] > 12) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = hh - 1; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, m = Math.max(bw, bh), S = Math.round(m * 1.08), out = Math.min(side, S), q = out / S;
  const o = document.createElement("canvas"); o.width = o.height = out;
  o.getContext("2d").drawImage(c, x0, y0, bw, bh, ((S - bw) / 2) * q, ((S - bh) / 2) * q, bw * q, bh * q);
  return (await toBlob(o, "image/webp", 0.92)) || (await toBlob(o, "image/png"));
}
async function uploadCutout(file) {
  if (!file.type.startsWith("image/")) throw new Error("that is not a picture");
  return uploadBlob(await cutout(file));
}

const sw = (checked, onchange, title) => h("label", { class: "switch", title }, h("input", { type: "checkbox", checked, onchange: (e) => onchange(e.target.checked) }), h("span", { class: "knob" }));
const fmtDkk = (n) => Number(n || 0).toLocaleString("da-DK") + " DKK";

function renderPList() {
  const ul = $("#prodList");
  ul.replaceChildren(...(products.length ? products.map((p, i) => h("li", { class: "app-row" + (i === selP ? " on" : "") + (p.on ? "" : " off"), onclick: () => { selP = i; renderPList(); renderPEditor(); } },
    h("span", { class: "pthumb", style: p.img ? `background-image:url('${resS(p.img).replace(/'/g, "%27")}')` : "" }),
    h("span", { class: "nm" }, p.name || "Untitled", h("small", {}, `${fmtDkk(p.price)} · ${p.on ? "on sale" : "off"}`)),
    h("span", { class: "arrows" },
      h("button", { type: "button", title: "Move up", disabled: i === 0, onclick: (e) => { e.stopPropagation(); moveP(i, -1); } }, "▲"),
      h("button", { type: "button", title: "Move down", disabled: i === products.length - 1, onclick: (e) => { e.stopPropagation(); moveP(i, 1); } }, "▼")))) : [h("li", { class: "muted tiny" }, "No products yet.")]));
}
function moveP(i, d) {
  const j = i + d; if (j < 0 || j >= products.length) return;
  [products[i], products[j]] = [products[j], products[i]];
  if (selP === i) selP = j; else if (selP === j) selP = i;
  setSDirty(); renderPList();
}
function moveIn(list, i, d) { const j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; setSDirty(); renderPEditor(); }

function renderPEditor() {
  const ed = $("#prodEditor"), p = products[selP];
  if (!p) { ed.replaceChildren(h("div", { class: "card empty-note muted" }, "No products yet. Press “+ Add product”.")); return; }
  const edited = () => { setSDirty(); renderPList(); };

  // main picture
  const imgPrev = h("span", { class: "bigthumb", style: p.img ? `background-image:url('${resS(p.img).replace(/'/g, "%27")}')` : "" }, p.img ? null : "?");
  const imgInput = h("input", { type: "file", accept: "image/*", hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    busy++; updateBar();
    try { p.img = await uploadCutout(f); edited(); renderPEditor(); } catch (err) { toast(err.message, true); } finally { busy--; updateBar(); }
  } });

  // sizes
  const sizeRows = p.sizes.map((s, i, all) => h("div", { class: "optrow" + (s.on ? "" : " offrow") },
    h("input", { type: "text", class: "nm", value: s.name, maxLength: 12, placeholder: "Size", oninput: (e) => { s.name = e.target.value; setSDirty(); renderStock(); } }),
    sw(s.on, (v) => { s.on = v; setSDirty(); renderPEditor(); }, "On or off"),
    h("button", { type: "button", class: "mini", title: "Earlier", disabled: i === 0, onclick: () => moveIn(all, i, -1) }, "▲"),
    h("button", { type: "button", class: "mini", title: "Later", disabled: i === all.length - 1, onclick: () => moveIn(all, i, 1) }, "▼"),
    h("button", { type: "button", class: "mini x", title: "Remove", onclick: () => { all.splice(i, 1); setSDirty(); renderPEditor(); } }, "✕")));

  // colours
  const colorRows = p.colors.map((c, i, all) => {
    const file = h("input", { type: "file", accept: "image/*", hidden: true, onchange: async (e) => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      busy++; updateBar();
      try { c.img = await uploadCutout(f); setSDirty(); renderPEditor(); } catch (err) { toast(err.message, true); } finally { busy--; updateBar(); }
    } });
    return h("div", { class: "optrow" + (c.on ? "" : " offrow") },
      h("input", { type: "color", class: "hex", value: c.hex || "#cccccc", title: "Colour", oninput: (e) => { c.hex = e.target.value; setSDirty(); renderStock(); } }),
      h("input", { type: "text", class: "nm", value: c.name, maxLength: 24, placeholder: "Colour name", oninput: (e) => { c.name = e.target.value; setSDirty(); renderStock(); } }),
      sw(c.on, (v) => { c.on = v; setSDirty(); renderPEditor(); }, "On or off"),
      h("button", { type: "button", class: "pic" + (c.img ? " has" : ""), title: c.img ? "Change the picture of this colour" : "Add a picture of this colour (optional)", style: c.img ? `background-image:url('${resS(c.img).replace(/'/g, "%27")}')` : "", onclick: () => file.click() }, c.img ? "" : "PNG"),
      c.img ? h("button", { type: "button", class: "mini", title: "Remove the picture", onclick: () => { delete c.img; setSDirty(); renderPEditor(); } }, "⌫") : null,
      h("button", { type: "button", class: "mini", title: "Earlier", disabled: i === 0, onclick: () => moveIn(all, i, -1) }, "▲"),
      h("button", { type: "button", class: "mini", title: "Later", disabled: i === all.length - 1, onclick: () => moveIn(all, i, 1) }, "▼"),
      h("button", { type: "button", class: "mini x", title: "Remove", onclick: () => { all.splice(i, 1); setSDirty(); renderPEditor(); } }, "✕"),
      file);
  });

  // stock: one number for every size and colour
  const stockBox = h("div", { class: "stockbox" });
  function renderStock() {
    if (!p.track) { stockBox.replaceChildren(h("p", { class: "muted tiny" }, "Stock is not counted: the product never sells out. Switch the counting on to set how many there are of each.")); return; }
    const sizes = p.sizes.length ? p.sizes : [{ id: "x", name: "All" }], colors = p.colors.length ? p.colors : [{ id: "x", name: "All" }];
    const idOf = (o) => (o.id === "x" ? "" : o.id);
    const cell = (s, c) => h("td", {}, h("input", { type: "number", min: 0, max: 100000, step: 1, value: String(stockOf(p, idOf(s), idOf(c))),
      oninput: (e) => { stockTouched[skey(p, idOf(s), idOf(c))] = Math.max(0, Math.round(Number(e.target.value)) || 0); setSDirty(); } }));
    stockBox.replaceChildren(
      h("p", { class: "muted tiny" }, "How many are left of each. An order request takes one off; at 0 that size/colour shows as sold out. The counts you change here replace the live ones when you save."),
      h("div", { class: "tscroll" }, h("table", { class: "stock" },
        h("thead", {}, h("tr", {}, h("th", {}, ""), ...colors.map((c) => h("th", {}, c.hex ? h("i", { class: "dot", style: `background:${c.hex}` }) : null, c.name || "?")))),
        h("tbody", {}, ...sizes.map((s) => h("tr", {}, h("th", {}, s.name || "?"), ...colors.map((c) => cell(s, c))))))));
  }
  renderStock();

  // more photos
  const grid = h("div", { class: "media-grid" });
  const photoInput = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: async (e) => {
    const files = [...e.target.files]; e.target.value = "";
    for (const f of files) {
      const tile = h("div", { class: "tile up" }, "Uploading " + f.name.slice(0, 18) + "…");
      grid.insertBefore(tile, addTile);
      busy++; updateBar();
      try { if (!f.type.startsWith("image/")) throw new Error("only pictures"); p.photos.push(await uploadMedia(f)); setSDirty(); }
      catch (err) { toast(`${f.name}: ${err.message}`, true); }
      finally { busy--; tile.remove(); updateBar(); }
      drawPhotos();
    }
  } });
  const addTile = h("div", { class: "addtile", onclick: () => photoInput.click() }, "+ Add photos");
  function drawPhotos() {
    grid.replaceChildren(...p.photos.map((m, i, all) => h("div", { class: "tile" },
      h("img", { src: resS(m.thumb), alt: "", loading: "lazy" }),
      h("div", { class: "tools" },
        h("button", { type: "button", title: "Earlier", disabled: i === 0, onclick: () => { [all[i - 1], all[i]] = [all[i], all[i - 1]]; setSDirty(); drawPhotos(); } }, "◀"),
        h("button", { type: "button", class: "x", title: "Remove", onclick: () => { all.splice(i, 1); setSDirty(); drawPhotos(); } }, "✕"),
        h("button", { type: "button", title: "Later", disabled: i === all.length - 1, onclick: () => { [all[i + 1], all[i]] = [all[i], all[i + 1]]; setSDirty(); drawPhotos(); } }, "▶")))), addTile);
  }
  drawPhotos();

  const trackSw = sw(p.track, (v) => { p.track = v; setSDirty(); renderStock(); }, "Count the stock");
  ed.replaceChildren(
    h("div", { class: "card sect" },
      h("div", { class: "switchrow" }, h("div", {}, h("h3", {}, "On sale"), h("p", { class: "muted tiny" }, "Off hides the product from the shop (it keeps its settings).")), sw(p.on, (v) => { p.on = v; edited(); }, "On or off"))),
    h("div", { class: "card sect" },
      h("h3", {}, "Product"),
      h("label", { class: "f" }, "Name", h("input", { type: "text", value: p.name || "", maxLength: 60, placeholder: "Playlist tee", oninput: (e) => { p.name = e.target.value; edited(); } })),
      h("label", { class: "f" }, "Price (DKK)", h("input", { type: "text", inputMode: "numeric", value: String(p.price ?? ""), placeholder: "10000", oninput: (e) => { p.price = Math.round(Number(e.target.value.replace(/[^0-9]/g, ""))) || 0; edited(); } })),
      h("label", { class: "f" }, "Description", h("textarea", { style: "min-height:90px", maxLength: 600, placeholder: "Shown under the price on the product page.", value: p.blurb || "", oninput: (e) => { p.blurb = e.target.value; setSDirty(); } }))),
    h("div", { class: "card sect" },
      h("h3", {}, "Picture on the shop wheel"),
      h("div", { class: "icon-row" }, imgPrev,
        h("div", {}, h("button", { class: "btn", type: "button", onclick: () => imgInput.click() }, p.img ? "Change picture" : "Upload picture"),
          h("p", { class: "muted tiny", style: "margin-top:8px" }, "A PNG with a see-through background. It is trimmed and centred automatically. Shown on the wheel and at the top of the product page.")),
        imgInput)),
    h("div", { class: "card sect" },
      h("h3", {}, "Sizes"),
      h("p", { class: "muted tiny" }, "Name them anything (S, M, 42, One size…). Switch one off to hide it for now. No sizes at all = nothing to pick."),
      ...sizeRows,
      h("div", { class: "row-end" },
        h("button", { class: "btn small", type: "button", onclick: () => { p.sizes.push({ id: rid(), name: "", on: true }); setSDirty(); renderPEditor(); } }, "+ Add size"),
        p.sizes.length ? null : h("button", { class: "btn small ghost", type: "button", onclick: () => { ["S", "M", "L", "XL"].forEach((n) => p.sizes.push({ id: rid(), name: n, on: true })); setSDirty(); renderPEditor(); } }, "Add S M L XL"))),
    h("div", { class: "card sect" },
      h("h3", {}, "Colours"),
      h("p", { class: "muted tiny" }, "Pick a colour and give it a name. A PNG per colour is optional: when a visitor picks that colour, the shirt on the product page changes to it."),
      ...colorRows,
      h("div", { class: "row-end" }, h("button", { class: "btn small", type: "button", onclick: () => { p.colors.push({ id: rid(), name: "", hex: "#ffffff", on: true }); setSDirty(); renderPEditor(); } }, "+ Add colour"))),
    h("div", { class: "card sect" },
      h("div", { class: "switchrow" }, h("div", {}, h("h3", {}, "Stock"), h("p", { class: "muted tiny" }, "Count the stock")), trackSw),
      stockBox),
    h("div", { class: "card sect" },
      h("h3", {}, "More photos"),
      h("p", { class: "muted tiny" }, "Shown as small pictures on the product page; tapping one opens it full size. Pictures are resized automatically."),
      grid, photoInput),
    h("div", { class: "row-end" },
      h("button", { class: "btn danger", type: "button", onclick: () => removeProduct(selP) }, "Delete this product"),
      h("span", {})));
}
function removeProduct(i) {
  const p = products[i];
  if (!p || !confirm(`Delete “${p.name || "this product"}” with its pictures and stock? This goes live when you save. (To only hide it, switch it off instead.)`)) return;
  products.splice(i, 1); selP = Math.min(selP, products.length - 1);
  setSDirty(); renderPList(); renderPEditor();
}
$("#addProduct").addEventListener("click", () => {
  products.push({ id: "p-" + rid(), name: "New product", price: 100, on: false, track: false, blurb: "", img: "", photos: [], sizes: [], colors: [] });
  selP = products.length - 1; setSDirty(); renderPList(); renderPEditor();
  $("#prodEditor").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* test tees: the built-in tee, added in one tap (or many) to try the wheel with different numbers of products */
function addTestTees(n) {
  const room = 40 - products.length;
  if (room <= 0) { toast("The shop already has the most products it can hold (40).", true); return; }
  let k = products.filter((p) => p.id.startsWith("test-")).length;
  for (let i = 0; i < Math.min(n, room); i++) {
    k++;
    products.push({ id: "test-" + rid(), name: "Test tee " + k, price: 10000, on: true, track: false, blurb: "A test shirt.", img: "assets/tee-playlist3.webp", photos: [], colors: [],
      sizes: ["S", "M", "L", "XL"].map((nm) => ({ id: nm.toLowerCase(), name: nm, on: true })) });
  }
  selP = products.length - 1; setSDirty(); renderPList(); renderPEditor();
  toast(`${products.filter((p) => p.on).length} products on sale. Save to put them on the wheel.`);
}
$("#addTest").addEventListener("click", () => addTestTees(1));
$("#addTest4").addEventListener("click", () => addTestTees(4));
$("#fillTest").addEventListener("click", () => { const need = 16 - products.length; if (need > 0) addTestTees(need); else toast("The shop already has 16 or more products."); });
$("#delTests").addEventListener("click", () => {
  const n = products.filter((p) => p.id.startsWith("test-")).length;
  if (!n) { toast("There are no test tees."); return; }
  if (!confirm(`Remove all ${n} test tees? This goes live when you save.`)) return;
  products = products.filter((p) => !p.id.startsWith("test-")); selP = products.length ? 0 : -1;
  setSDirty(); renderPList(); renderPEditor();
});

async function saveShop() {
  for (const p of products) {
    const bad = (msg) => { toast(`“${p.name || "Untitled"}”: ${msg}`, true); selP = products.indexOf(p); renderPList(); renderPEditor(); };
    if (!p.name?.trim()) return bad("give it a name.");
    if (!(p.price >= 1)) return bad("set a price.");
    if (!p.img) return bad("upload the picture for the shop wheel.");
    if (p.sizes.some((s) => !s.name.trim())) return bad("a size has no name.");
    if (p.colors.some((c) => !c.name.trim())) return bad("a colour has no name.");
  }
  $("#save").disabled = true; $("#saveMsg").textContent = "Saving…";
  try {
    const body = products.map((p) => ({ id: p.id, name: p.name.trim(), price: p.price, blurb: (p.blurb || "").trim(), on: p.on, track: p.track, img: p.img, photos: p.photos,
      sizes: p.sizes.map((s) => ({ id: s.id, name: s.name.trim(), on: s.on })), colors: p.colors.map((c) => ({ id: c.id, name: c.name.trim(), hex: c.hex || "#cccccc", on: c.on, ...(c.img ? { img: c.img } : {}) })) }));
    const out = await api("/api/shop", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ products: body, stock: stockTouched }) });
    const now = shopMediaOf(out.shop);
    for (const u of savedShopMedia) if (!now.has(u)) fetch(u, { method: "DELETE", headers: { authorization: "Bearer " + token } }).catch(() => {});
    savedShopMedia = now; stockLive = out.stock || {}; stockTouched = {};
    setSDirty(false); renderPEditor();
    $("#saveMsg").textContent = "Saved. The shop is updated.";
    toast("Saved: the shop is updated.");
  } catch (err) { $("#saveMsg").textContent = ""; toast(err.message, true); setSDirty(true); }
}

/* ---------- orders and inquiries ---------- */
let view = "apps";
let inbox = { inquiries: [], orders: [] };
const fmt = (iso) => { try { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; } };
function setCounts() {
  const n1 = inbox.orders.filter((o) => !o.done).length, n2 = inbox.inquiries.filter((o) => !o.done).length;
  const a = $("#nOrd"), b = $("#nInq");
  a.hidden = !n1; a.textContent = n1; b.hidden = !n2; b.textContent = n2;
}
async function loadInbox() {
  try { inbox = await api("/api/inbox"); } catch (e) { if (e.message !== "Logged out") toast(e.message, true); return; }
  setCounts(); if (view !== "apps") renderInbox();
}
async function markItem(it, done) {
  try {
    await api("/api/inbox/" + encodeURIComponent(it.key), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ done }) });
    it.done = done; setCounts(); renderInbox();
  } catch (e) { toast(e.message, true); }
}
async function deleteItem(it, kind) {
  if (!confirm("Delete this " + (kind === "ord" ? "order" : "inquiry") + " for good?")) return;
  try {
    await api("/api/inbox/" + encodeURIComponent(it.key), { method: "DELETE" });
    const list = kind === "ord" ? inbox.orders : inbox.inquiries;
    list.splice(list.indexOf(it), 1); setCounts(); renderInbox();
  } catch (e) { toast(e.message, true); }
}
function renderInbox() {
  const orders = view === "orders", list = orders ? inbox.orders : inbox.inquiries;
  $("#inboxTitle").textContent = orders ? "Orders" : "Inquiries";
  $("#inboxNote").textContent = orders
    ? "Order requests from the shop. Payments are not switched on yet, so none of these are paid: contact the buyer to finish each one."
    : "Messages sent through the contact page (email address first, then the message).";
  $("#inboxList").replaceChildren(...(list.length ? list.map((it) => {
    const acts = h("div", { class: "acts" },
      h("button", { class: "btn small ghost", type: "button", onclick: () => markItem(it, !it.done) }, it.done ? "Mark as new" : (orders ? "Mark as handled" : "Mark as read")),
      h("button", { class: "btn small danger", type: "button", onclick: () => deleteItem(it, orders ? "ord" : "inq") }, "Delete"));
    if (orders) {
      const row = (k, v) => [h("dt", {}, k), h("dd", {}, v)];
      return h("div", { class: "card msg" + (it.done ? " done" : "") },
        h("div", { class: "top" },
          h("span", { class: "who" }, it.name),
          h("span", {}, h("span", { class: "tag" + (it.done ? "" : " new") }, it.done ? "HANDLED" : "NEW"), " ", h("span", { class: "tag" }, "UNPAID")),
          h("span", { class: "when" }, fmt(it.at))),
        h("dl", { class: "grid" },
          ...row("Item", `${it.product}${it.color ? " · " + it.color : ""}${it.size ? " · size " + it.size : ""} · ${Number(it.price).toLocaleString("da-DK")} ${it.currency}`),
          ...row("Email", h("a", { href: "mailto:" + it.email }, it.email)),
          ...row("Phone", h("a", { href: "tel:" + it.phone.replace(/[^+0-9]/g, "") }, it.phone)),
          ...row("Address", `${it.street}, ${it.zip} ${it.city}, ${it.country}`)),
        acts);
    }
    return h("div", { class: "card msg" + (it.done ? " done" : "") },
      h("div", { class: "top" },
        h("span", { class: "who" }, h("a", { href: "mailto:" + it.email }, it.email)),
        h("span", {}, h("span", { class: "tag" + (it.done ? "" : " new") }, it.done ? "READ" : "NEW")),
        h("span", { class: "when" }, fmt(it.at))),
      h("div", { class: "body" }, it.message),
      acts);
  }) : [h("div", { class: "card empty-note muted" }, orders ? "No orders yet." : "No inquiries yet.")]));
}
function setView(v) {
  view = v;
  document.querySelectorAll("#tabsbar button").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
  const edit = v === "apps" || v === "shop";
  $("#admin").hidden = v !== "apps"; $("#shopAdmin").hidden = v !== "shop"; $("#saveBar").hidden = !edit; $("#inbox").hidden = edit;
  updateBar();
  if (!edit) { renderInbox(); loadInbox(); }
}
document.querySelectorAll("#tabsbar button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
$("#inboxRefresh").addEventListener("click", loadInbox);

/* ---------- login / logout ---------- */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = $("#loginBtn"); b.disabled = true; $("#loginErr").textContent = "";
  try {
    const j = await api("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: $("#pw").value }) });
    token = j.token; try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* */ }
    await showAdmin();
  } catch (err) { $("#loginErr").textContent = err.message; }
  finally { b.disabled = false; }
});
$("#logout").addEventListener("click", () => { if ((dirty || sdirty) && !confirm("You have unsaved changes. Log out anyway?")) return; dirty = sdirty = false; showLogin(); });

(async function start() {
  if (!token) return showLogin();
  try { await api("/api/session"); await showAdmin(); } catch { showLogin(); }
})();
