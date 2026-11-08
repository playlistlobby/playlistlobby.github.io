// playlist.mag · Projects admin: add, edit and remove the apps on the projects page, with their picture, title, article and media.
// Everything is kept here until "Save and publish"; the picture/video uploads go straight to the Worker.
import { API_BASE } from "../api.js";

const $ = (s, r = document) => r.querySelector(s);
const TOKEN_KEY = "pm-admin-token";
const MEDIA_PREFIX = API_BASE + "/media/";
const MAX_FILE = 24 * 1024 * 1024;

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
let sel = -1;                  // selected app
let dirty = false;
let busy = 0;                  // running uploads

const res = (u) => (/^https?:\/\//.test(u || "") ? u : "../projects/" + (u || ""));      // preview address of a stored one
function setDirty(v = true) { dirty = v; $("#dirty").hidden = !v; $("#save").disabled = !v || busy > 0; }
let toastT = 0;
function toast(msg, bad = false) {
  const t = $("#toast");
  t.textContent = msg; t.classList.toggle("bad", bad); t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), bad ? 6000 : 2600);
}
addEventListener("beforeunload", (e) => { if (dirty || busy) { e.preventDefault(); e.returnValue = ""; } });

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
  const j = await api("/api/media", { method: "POST", headers: { "content-type": blob.type }, body: blob });
  return j.url;
}

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
  let list = saved.projects;
  if (!Array.isArray(list)) {                                   // nothing saved yet: start from the built-in apps
    const d = await (await fetch("../projects/projects.json", { cache: "no-cache" })).json();
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
  $("#login").hidden = false; $("#admin").hidden = true; $("#saveBar").hidden = true; $("#barRight").hidden = true;
  $("#loginErr").textContent = msg; $("#pw").value = "";
}
async function showAdmin() {
  await loadAll();
  $("#login").hidden = true; $("#admin").hidden = false; $("#saveBar").hidden = false; $("#barRight").hidden = false;
  renderList(); renderEditor();
  if (!dirty) setDirty(false);
}

function iconBox(p, size) {
  const b = h("span", { class: "sb-icon" + (p.icon ? "" : " empty"), style: `--ic:${size}px;${p.icon ? `background-image:url('${res(p.icon).replace(/'/g, "%27")}')` : ""}` }, p.icon ? null : "?");
  return b;
}
function renderList() {
  const ul = $("#appList");
  ul.replaceChildren(...apps.map((p, i) => h("li", { class: "app-row" + (i === sel ? " on" : ""), onclick: () => { sel = i; renderList(); renderEditor(); } },
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

function renderEditor() {
  const ed = $("#editor");
  const p = apps[sel];
  if (!p) { ed.replaceChildren(h("div", { class: "card empty-note muted" }, "No apps yet. Press “+ Add app”.")); return; }

  // icon
  const iconPrev = iconBox(p, 96);
  const iconInput = h("input", { type: "file", accept: "image/*", hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    busy++; setDirty(dirty);
    try { p.icon = await uploadBlob(await squareIcon(f)); setDirty(); renderList(); renderEditor(); }
    catch (err) { toast(err.message, true); }
    finally { busy--; setDirty(dirty); }
  } });

  const label = h("input", { type: "text", value: p.label || "", maxLength: 24, placeholder: "Name under the icon", oninput: (e) => { p.label = e.target.value; setDirty(); renderList(); } });
  const title = h("input", { type: "text", value: p.title || "", maxLength: 80, placeholder: "Big title next to the phone", oninput: (e) => { p.title = e.target.value; setDirty(); } });
  const text = h("textarea", { placeholder: "Write the article here. Leave an empty line between paragraphs.", oninput: (e) => { p.text = e.target.value.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean); setDirty(); } });
  text.value = (p.text || []).join("\n\n");
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
      h("img", { src: res(m.thumb), alt: "", loading: "lazy" }),
      m.type === "video" ? h("span", { class: "badge" }, "VIDEO") : null,
      h("div", { class: "tools" },
        h("button", { type: "button", title: "Earlier", disabled: i === 0, onclick: () => { [all[i - 1], all[i]] = [all[i], all[i - 1]]; setDirty(); drawMedia(); } }, "◀"),
        h("button", { type: "button", class: "x", title: "Remove", onclick: () => { all.splice(i, 1); setDirty(); drawMedia(); renderList(); } }, "✕"),
        h("button", { type: "button", title: "Later", disabled: i === all.length - 1, onclick: () => { [all[i + 1], all[i]] = [all[i], all[i + 1]]; setDirty(); drawMedia(); } }, "▶"))
    )), addTile);
  }
  drawMedia();
  const mediaSect = h("div", { class: "card sect", hidden: !!p.href },
    h("h3", {}, "Media"),
    h("p", { class: "muted tiny" }, "Pictures and videos shown in the gallery on the phone, in this order. Pictures are resized automatically; a video can be up to 24 MB (mp4 or webm)."),
    grid, mediaInput);

  ed.replaceChildren(
    h("div", { class: "card sect" },
      h("h3", {}, "Icon"),
      h("div", { class: "icon-row" }, iconPrev,
        h("div", {},
          h("button", { class: "btn", type: "button", onclick: () => iconInput.click() }, p.icon ? "Change picture" : "Upload picture"),
          h("p", { class: "muted tiny", style: "margin-top:8px" }, "Any picture. It is cropped square and shaded like the other apps on the phone.")),
        iconInput)),
    h("div", { class: "card sect" },
      h("h3", {}, "Text"),
      h("label", { class: "f" }, "Name under the icon", label),
      h("label", { class: "f" }, "Title", h("small", {}, "The big heading next to the phone when the app is open."), title),
      h("label", { class: "f" }, "Article", text)),
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
    if (f.size > MAX_FILE) throw new Error("the video is over 24 MB, compress it first");
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
$("#save").addEventListener("click", async () => {
  for (const p of apps) {
    if (!p.label?.trim()) { toast("Every app needs a name under its icon.", true); sel = apps.indexOf(p); renderList(); renderEditor(); return; }
    if (!p.icon) { toast(`“${p.label}” needs an icon picture.`, true); sel = apps.indexOf(p); renderList(); renderEditor(); return; }
  }
  const btn = $("#save"); btn.disabled = true; $("#saveMsg").textContent = "Saving…";
  try {
    const body = apps.map((p) => ({ id: p.id, label: p.label.trim(), icon: p.icon, title: (p.title || "").trim() || p.label.trim(), text: p.text || [], ...(p.href ? { href: p.href } : { photos: p.photos || [] }) }));
    const out = await api("/api/projects", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ projects: body }) });
    const now = mediaOf(out.projects);
    for (const u of savedMedia) if (!now.has(u)) fetch(u, { method: "DELETE", headers: { authorization: "Bearer " + token } }).catch(() => {});   // free what is no longer used
    savedMedia = now;
    setDirty(false);
    $("#saveMsg").textContent = "Saved. The projects page is updated.";
    toast("Saved: the projects page is updated.");
  } catch (err) { $("#saveMsg").textContent = ""; toast(err.message, true); setDirty(true); }
});

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
$("#logout").addEventListener("click", () => { if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return; dirty = false; showLogin(); });

(async function start() {
  if (!token) return showLogin();
  try { await api("/api/session"); await showAdmin(); } catch { showLogin(); }
})();
