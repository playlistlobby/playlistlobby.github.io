// The game server (the Worker) talks English: its error messages ("You need 5 more drops") and notes ("You roll a joint."). The Danish
// build makes a list of those texts (virtual:da-server, see scripts/danish-plugin.mjs) and this turns what arrives into Danish.
// Texts with a number or a name in them are matched as patterns ({…} / {name} stand for the part that changes).
import pairs from "virtual:da-server";
import { LANG_DA } from "./lang";

interface Pattern { re: RegExp; labels: string[]; da: string }
const exact = new Map<string, string>();
const patterns: Pattern[] = [];
for (const [en, da] of pairs) {
  const labels: string[] = [];
  let re = "";
  let last = 0;
  for (const m of en.matchAll(/\{([^{}]*)\}/g)) {
    re += en.slice(last, m.index).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(.+?)";
    labels.push(m[1]);
    last = m.index! + m[0].length;
  }
  if (!labels.length) { exact.set(en, da); continue; }
  re += en.slice(last).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  patterns.push({ re: new RegExp(`^${re}$`, "s"), labels, da });
}

/** The Danish for a text the server sent (or the text itself when there is no translation for it). */
export function trServer(text: string): string {
  if (!LANG_DA) return text; // English: the server already speaks it
  const hit = exact.get(text);
  if (hit !== undefined) return hit;
  for (const p of patterns) {
    const m = p.re.exec(text);
    if (!m) continue;
    const used = new Array(p.labels.length).fill(false);
    return p.da.replace(/\{([^{}]*)\}/g, (_all, label: string) => {
      const i = p.labels.findIndex((l, k) => !used[k] && l === label);
      if (i < 0) return "";
      used[i] = true;
      return m[i + 1];
    });
  }
  return text;
}
