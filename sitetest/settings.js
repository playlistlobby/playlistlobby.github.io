// playlist.mag: the settings button in the banner (sound on/off + language). Sound is switched in sounds.js (so it works everywhere);
// the language is only remembered for now (key "pm-lang": "en" or "da") - the site is translated by hand later, nothing changes yet.
import { sfx, soundOn, setSound } from "./sounds.js";

const LANG_KEY = "pm-lang";
const btn = document.getElementById("setbtn"), panel = document.getElementById("setpanel");
if (btn && panel) {
  let lang = "en";
  try { if (localStorage.getItem(LANG_KEY) === "da") lang = "da"; } catch { /* no storage */ }
  document.documentElement.dataset.lang = lang;

  const show = () => {
    const vals = { sound: soundOn() ? "on" : "off", lang };
    panel.querySelectorAll(".seg").forEach((seg) => seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === vals[seg.dataset.key]))));
  };
  const open = (yes) => { panel.hidden = !yes; btn.setAttribute("aria-expanded", String(yes)); if (yes) show(); };

  btn.addEventListener("click", () => { const yes = panel.hidden; open(yes); sfx(yes ? "tink" : "tock", 0.4); });
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    const key = b.parentElement.dataset.key;
    if (key === "sound") { setSound(b.dataset.v === "on"); sfx("tink", 0.5); }              // (silent when switched off)
    else if (key === "lang") { lang = b.dataset.v; document.documentElement.dataset.lang = lang; try { localStorage.setItem(LANG_KEY, lang); } catch { /* no storage */ } sfx("tink", 0.4); }
    show();
  });
  document.addEventListener("pointerdown", (e) => { if (!panel.hidden && !e.target.closest(".settings")) open(false); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { open(false); btn.focus(); } });
}
