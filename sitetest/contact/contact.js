// playlist.mag · Contact: a small iMessage-style bar, alone in the middle of the page.
// 1) put your email in the bar (it has to look like a real one), 2) write ONE message: it pops up above the bar and pushes the bar down,
// 3) the only thing you ever receive: "You will be hearing from us soon". After that the bar is locked for 5 minutes (never shown).
// The lock lives in this browser (localStorage).
const $ = (s, r = document) => r.querySelector(s);
const log = $("#log"), bar = $("#bar"), field = $("#field"), send = $("#send");
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* where an inquiry is delivered. Not connected yet: set this to an address that accepts a POST with { email, message }. */
const CONTACT_ENDPOINT = "";
const REPLY = "You will be hearing from us soon";
const LOCK_MS = 5 * 60 * 1000;
const KEY_LOG = "pm-contact-log", KEY_UNTIL = "pm-contact-until";

const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 60) : ms));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window: it just won't survive a reload */ } },
};

/* ---------- does it look like a real email? ---------- */
export function looksLikeEmail(v) {
  if (typeof v !== "string" || v.length < 6 || v.length > 100) return false;
  const m = /^([A-Za-z0-9._%+'-]{1,64})@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)$/.exec(v);
  if (!m) return false;
  if (v.includes("..") || m[1].startsWith(".") || m[1].endsWith(".")) return false;
  const labels = m[2].split(".");
  if (labels.some((l) => !l || l.length > 63 || l.startsWith("-") || l.endsWith("-"))) return false;
  return /^[A-Za-z]{2,24}$/.test(labels[labels.length - 1]);        // a real ending like .com, .dk, .studio
}

/* ---------- messages above the bar; the bar glides down by exactly as much as they take ---------- */
const EASE = "cubic-bezier(.3,.8,.3,1)";
function pushBar(change, ms = 700) {
  const y0 = bar.getBoundingClientRect().top;
  const result = change();
  const dy = y0 - bar.getBoundingClientRect().top;
  if (dy) bar.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration: reduce ? 1 : ms, easing: EASE });
  return result;
}
let driftN = 0;
function bubble(who, text, restored = false) {
  return pushBar(() => {
    const row = document.createElement("div");
    row.className = "row " + who + (restored ? " restored" : "");
    row.style.setProperty("--d", (-(driftN++ % 7) * 0.9).toFixed(1) + "s");
    const b = document.createElement("div");
    b.className = "b"; b.textContent = text;
    row.append(b);
    log.append(row);
    return row;
  });
}
function typingRow() {
  return pushBar(() => {
    const row = document.createElement("div");
    row.className = "row in";
    row.innerHTML = '<div class="b"><span class="typing"><i></i><i></i><i></i></span></div>';
    log.append(row);
    return row;
  });
}

/* ---------- the bar ---------- */
let step = "email";                                        // "email" -> "message" -> "done"
let email = "";
let busy = false;

function setBar(mode) {
  const locked = mode === "locked";
  bar.dataset.mode = step === "email" ? "email" : "message";           // drives the mail <-> iMessage icon swap
  bar.classList.toggle("locked", locked);
  field.disabled = locked || busy;
  send.disabled = locked || busy || !field.value.trim();
  if (mode === "email") { field.type = "email"; field.placeholder = "Your email"; field.setAttribute("aria-label", "Your email"); field.setAttribute("inputmode", "email"); field.setAttribute("autocomplete", "email"); field.maxLength = 100; }
  if (mode === "message") { field.type = "text"; field.placeholder = "Make an inquiry"; field.setAttribute("aria-label", "Make an inquiry"); field.setAttribute("inputmode", "text"); field.setAttribute("autocomplete", "off"); field.maxLength = 400; }
  if (locked) { field.type = "text"; field.placeholder = "Make an inquiry"; field.value = ""; }
}
field.addEventListener("input", () => { bar.classList.remove("bad"); send.disabled = field.disabled || !field.value.trim(); });

async function deliver(payload) {
  if (!CONTACT_ENDPOINT) { console.info("contact: no endpoint is connected yet, so nothing was delivered"); await wait(300); return; }
  const r = await fetch(CONTACT_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error("not delivered");
}

bar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = field.value.replace(/\s+/g, " ").trim();
  if (!text || busy || step === "done") return;

  if (step === "email") {
    if (!looksLikeEmail(text)) {                           // no text for this: the bar just shakes and the field turns red
      bar.classList.add("bad"); bar.classList.remove("shake"); void bar.offsetWidth; bar.classList.add("shake");
      return;
    }
    email = text; step = "message";
    field.classList.add("swap");                            // the placeholder fades out and back in as "iMessage"
    await wait(180);
    field.value = ""; setBar("message");
    field.classList.remove("swap");
    field.focus({ preventScroll: true });
    return;
  }

  // the message
  busy = true; setBar("busy"); field.value = "";
  bubble("out", text);
  try {
    await deliver({ email, message: text });
    step = "done";
    await wait(700);
    const dots = typingRow();
    await wait(1400);
    dots.remove();
    bubble("in", REPLY);
    store.set(KEY_LOG, JSON.stringify([{ w: "out", t: text }, { w: "in", t: REPLY }]));
    busy = false; lock();
  } catch {
    busy = false; step = "message"; setBar("message");
    bubble("in", "Sorry, that didn't go through. Please try again in a moment.");
  }
});

/* ---------- the 5 minute lock (not shown anywhere) ---------- */
let unlockTimer = 0;
function lock(until = Date.now() + LOCK_MS) {
  store.set(KEY_UNTIL, String(until));
  clearTimeout(unlockTimer);
  unlockTimer = setTimeout(unlock, Math.max(0, until - Date.now()) + 50);
  setBar("locked");
}
async function unlock() {
  store.set(KEY_UNTIL, "0"); store.set(KEY_LOG, "[]");
  const rows = [...log.querySelectorAll(".row")];
  rows.forEach((r) => r.classList.add("gone"));             // the messages fade away and the bar glides back to the middle
  await wait(380);
  pushBar(() => rows.forEach((r) => r.remove()), 800);
  step = "email"; email = ""; busy = false;
  field.value = ""; setBar("email");
}

/* ---------- keep the banner in view when a phone's keyboard is open (iOS moves the visible part of the page, and fixed bars slide out of it) ---------- */
const banner = $(".banner");
if (window.visualViewport && banner) {
  const vv = window.visualViewport;
  const pin = () => { banner.style.transform = vv.offsetTop > 0 ? `translateY(${vv.offsetTop}px)` : ""; };
  vv.addEventListener("scroll", pin); vv.addEventListener("resize", pin);
}

/* ---------- start ---------- */
(function start() {
  let saved = [];
  try { saved = JSON.parse(store.get(KEY_LOG) || "[]"); } catch { saved = []; }
  const until = Number(store.get(KEY_UNTIL) || 0);
  if (saved.length && until > Date.now()) {
    // reloaded within the 5 minutes: the messages as they were, the bar still locked
    saved.forEach((m) => bubble(m.w, m.t, true));
    step = "done"; setBar("locked");
    unlockTimer = setTimeout(unlock, until - Date.now() + 50);
    return;
  }
  store.set(KEY_LOG, "[]");
  setBar("email");
})();
