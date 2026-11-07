// playlist.mag · Contact: an iMessage-style conversation.
// 1) it asks for your email (it has to look like a real one), 2) you write ONE message, 3) it answers "You will be hearing back from us shortly."
// After that the bar is locked for 5 minutes (never shown). The lock lives in this browser (localStorage).
const $ = (s, r = document) => r.querySelector(s);
const log = $("#log"), bar = $("#bar"), field = $("#field"), send = $("#send");
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* where an inquiry is delivered. Not connected yet: set this to an address that accepts a POST with { email, message }. */
const CONTACT_ENDPOINT = "";
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

/* ---------- drawing the conversation ---------- */
let history = [];                         // [{ w: "in" | "out", t: text }] (kept so a reload doesn't lose the conversation)
const saveHistory = () => store.set(KEY_LOG, JSON.stringify(history.slice(-30)));
const scrollDown = () => log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
let driftN = 0;

function bubble(who, text, { silent = false } = {}) {
  document.querySelectorAll(".meta").forEach((m) => m.remove());
  const row = document.createElement("div");
  row.className = "row " + who;
  row.style.setProperty("--d", (-(driftN++ % 7) * 0.9).toFixed(1) + "s");
  const b = document.createElement("div");
  b.className = "b"; b.textContent = text;
  row.append(b);
  log.append(row);
  if (!silent) { history.push({ w: who, t: text }); saveHistory(); }
  scrollDown();
  return row;
}
function meta(text) {
  const m = document.createElement("div");
  m.className = "meta"; m.textContent = text;
  log.append(m); scrollDown();
}
function stamp(text) {
  const s = document.createElement("div");
  s.className = "stamp"; s.textContent = text;
  log.append(s);
}
async function reply(text, delay = 900) {                 // the other side "types" first
  const row = document.createElement("div");
  row.className = "row in";
  row.innerHTML = '<div class="b"><span class="typing"><i></i><i></i><i></i></span></div>';
  log.append(row); scrollDown();
  await wait(delay);
  row.remove();
  bubble("in", text);
}
const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/* ---------- the bar ---------- */
let step = "email";                                        // "email" -> "message" -> "done"
let email = "";
let busy = false;

function setBar(mode) {
  const locked = mode === "locked";
  field.disabled = locked || busy;
  send.disabled = locked || busy || !field.value.trim();
  if (mode === "email") { field.type = "email"; field.placeholder = "Your email"; field.setAttribute("inputmode", "email"); field.setAttribute("autocomplete", "email"); field.maxLength = 100; }
  if (mode === "message") { field.type = "text"; field.placeholder = "iMessage"; field.setAttribute("inputmode", "text"); field.setAttribute("autocomplete", "off"); field.maxLength = 1000; }
  if (locked) { field.type = "text"; field.placeholder = "iMessage"; field.value = ""; }
}
field.addEventListener("input", () => { send.disabled = field.disabled || !field.value.trim(); });

async function deliver(payload) {
  if (!CONTACT_ENDPOINT) { console.info("contact: no endpoint is connected yet, so nothing was delivered"); await wait(400); return; }
  const r = await fetch(CONTACT_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error("not delivered");
}

bar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = field.value.replace(/\s+/g, " ").trim();
  if (!text || busy || step === "done") return;
  busy = true; setBar("busy"); field.value = "";

  if (step === "email") {
    bubble("out", text);
    if (!looksLikeEmail(text)) {
      await reply("That doesn't look like a real email address. Could you check it?");
    } else {
      email = text; step = "message";
      await reply("Thanks. What would you like to tell us?");
    }
  } else if (step === "message") {
    const msg = field.value || text;
    bubble("out", msg); meta("Delivered");
    try {
      await deliver({ email, message: msg });
      step = "done";
      await reply("You will be hearing back from us shortly.", 1400);
      lock();
    } catch {
      meta("Not delivered");
      await reply("Sorry, that didn't go through. Please try again in a moment.");
    }
  }
  busy = false;
  if (step === "done") setBar("locked"); else { setBar(step); field.focus({ preventScroll: true }); }
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
  store.set(KEY_UNTIL, "0");
  step = "email"; email = ""; busy = true; setBar("busy");
  await reply("Anything else? What's your email?", 700);
  busy = false; setBar("email");
}

/* ---------- start ---------- */
(async function start() {
  let saved = [];
  try { saved = JSON.parse(store.get(KEY_LOG) || "[]"); } catch { saved = []; }
  const until = Number(store.get(KEY_UNTIL) || 0);
  const locked = until > Date.now();
  if (saved.length && locked) {
    // the conversation as it was, and the bar still locked
    stamp("Today " + clock());
    history = saved;
    saved.forEach((m) => bubble(m.w, m.t, { silent: true }));
    step = "done"; setBar("locked");
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(unlock, until - Date.now() + 50);
    return;
  }
  store.set(KEY_LOG, "[]");
  history = [];
  stamp("Today " + clock());
  busy = true; setBar("busy");
  await wait(500);
  await reply("Hi, you've reached playlist.mag.", 800);
  await reply("What's your email?", 900);
  busy = false; setBar("email");
})();
