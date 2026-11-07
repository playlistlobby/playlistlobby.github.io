// playlist.mag · Home: tap the glass play button -> it turns into the playlist note, the person slides left and the menu comes in.
const body = document.body;
const glass = document.getElementById("glass");
const menu = document.getElementById("menu");
const vid = document.getElementById("vid");

/* ---------- scenes ---------- */
function setScene(two, push = true) {
  body.classList.toggle("s2", two);
  glass.setAttribute("aria-label", two ? "Back" : "Play");
  menu.querySelectorAll("a").forEach((a) => (a.tabIndex = two ? 0 : -1));
  if (push) history.replaceState(null, "", two ? "#menu" : location.pathname + location.search);
}
glass.addEventListener("click", () => setScene(!body.classList.contains("s2")));
addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("s2")) setScene(false); });
if (location.hash === "#menu") setScene(true, false);

/* leaving the page: a short fade, then go */
menu.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  body.classList.add("leaving");
  setTimeout(() => (location.href = a.href), 260);
});
addEventListener("pageshow", () => body.classList.remove("leaving")); // back button from another page

/* ---------- the person: a transparent WebM that plays forward and back, slowly ----------
   Safari/iOS can't show transparency in WebM, so there it stays a still picture with a soft "breathing" motion. */
const ua = navigator.userAgent;
const webkit = /safari/i.test(ua) && !/chrome|chromium|crios|android|edg|opr/i.test(ua) || /iphone|ipad|ipod/i.test(ua);
const canWebm = !webkit && vid.canPlayType('video/webm; codecs="vp9"') !== "";
const person = document.querySelector(".person");
if (canWebm && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
  vid.src = "assets/person-loop.webm";
  vid.playbackRate = 0.6;
  vid.addEventListener("playing", () => { vid.hidden = false; setTimeout(() => person.querySelector(".still").remove(), 400); }, { once: true });
  vid.play().catch(() => { /* autoplay blocked: keep the still */ });
} else {
  person.classList.add("still-only");
}

/* ---------- liquid glass edges: the traced shapes as inline SVG (rim light, sheen, shadow) ---------- */
const NS = "http://www.w3.org/2000/svg";
const defsFor = (k) => `<defs>
  <linearGradient id="rim-${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1006"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".06"/><stop offset=".7" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
  <linearGradient id="sheen-${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1006"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
async function paintShape(kind) {
  try {
    const txt = await (await fetch(`assets/shapes/${kind}.svg`)).text();
    const d = /\sd="([^"]+)"/.exec(txt)[1];
    const root = document.querySelector(`.shape.${kind}`);
    root.querySelector(".sh").innerHTML = `<svg viewBox="0 0 1000 1006.32" aria-hidden="true"><path d="${d}" fill="#26402c" fill-rule="evenodd"/></svg>`;
    root.querySelector(".rim").innerHTML = `<svg viewBox="0 0 1000 1006.32" aria-hidden="true">${defsFor(kind)}
      <path d="${d}" fill="url(#sheen-${kind})" fill-rule="evenodd"/>
      <path d="${d}" fill="none" stroke="url(#rim-${kind})" stroke-width="7" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="rgba(38,64,44,.22)" stroke-width="2.5" stroke-linejoin="round" transform="translate(0 1.5)"/></svg>`;
  } catch (e) { console.warn("shape", kind, e); }
}
paintShape("play"); paintShape("note");
