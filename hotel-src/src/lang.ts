// Which language the game is shown in: Danish (the default) or English. The choice is kept in this browser and the page reloads when it changes.
// The build puts both texts into the code (scripts/danish-plugin.mjs turns every text into  LANG_DA ? danish : english).
export type Lang = "da" | "en";

const KEY = "6ixplanet.lang";
const DEFAULT: Lang = import.meta.env.VITE_LANG === "en" ? "en" : "da";

function read(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "da" || v === "en") return v;
  } catch { /* no storage: the default */ }
  return DEFAULT;
}

export const LANG: Lang = read();
export const LANG_DA = LANG === "da";

/** Switches the language and reloads the page so every text is redrawn in it. */
export function setLang(lang: Lang): void {
  try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
  location.reload();
}

/** The small flags on the language button: the Danish flag while the game is Danish, the British one while it is English. */
export const FLAG_SVG: Record<Lang, string> = {
  da: `<svg viewBox="0 0 37 28" xmlns="http://www.w3.org/2000/svg"><rect width="37" height="28" fill="#c8102e"/><rect x="12" width="4" height="28" fill="#fff"/><rect y="12" width="37" height="4" fill="#fff"/></svg>`,
  en: `<svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg"><clipPath id="fs"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="ft"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#fs)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#ft)" stroke="#c8102e" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/></g></svg>`,
};
