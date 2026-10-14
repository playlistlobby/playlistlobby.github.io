// Makes the game bilingual: while the code is built, every string that is text for a player (see text-filter.mjs) becomes
//   (__DA ? <the Danish from translation/da.json> : <the English as written>)
// where __DA comes from src/lang.ts (the language chosen in the menu, kept in the browser). The source stays English.
//
// Also provides `virtual:da-server`: the texts the GAME SERVER (the Worker) sends back in English (error messages, "you roll a joint"...),
// as patterns the browser translates when they arrive (src/daRuntime.ts).
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { ROOT, collectTexts, labelOf, normalize, translatable } from "./text-filter.mjs";

const VIRTUAL = "virtual:da-server";
const RESOLVED = "\0" + VIRTUAL;

export default function danish() {
  const dict = JSON.parse(fs.readFileSync(path.join(ROOT, "translation", "da.json"), "utf8"));
  const byEn = new Map();
  for (const v of Object.values(dict)) if (v.da && v.da !== v.en) byEn.set(normalize(v.en), v.da);
  let skipped = 0, replaced = 0;

  /**
   * The Danish as a piece of code: a string, or (when the English has ${...} in it) a template that puts the original expressions back
   * into the Danish. `render(from, to)` gives the code of an expression with the translations inside it already done
   * (a text can sit inside the expression of another text).
   */
  function danishCode(node, da, code, render) {
    if (!ts.isTemplateExpression(node)) return JSON.stringify(da);
    const exprs = node.templateSpans.map((s) => ({ label: labelOf(s.expression), code: render(s.expression.getStart(), s.expression.getEnd()), used: false }));
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    let out = "`";
    let last = 0;
    for (const m of da.matchAll(/\{([^{}]*)\}/g)) {
      const e = exprs.find((x) => !x.used && x.label === m[1]);
      if (!e) return null; // the Danish has a {placeholder} the English doesn't: leave this one in English
      e.used = true;
      out += esc(da.slice(last, m.index)) + "${" + e.code + "}";
      last = m.index + m[0].length;
    }
    return out + esc(da.slice(last)) + "`";
  }

  return {
    name: "danish",
    enforce: "pre",
    resolveId(id) { return id === VIRTUAL ? RESOLVED : null; },
    load(id) {
      if (id !== RESOLVED) return null;
      // the texts the server produces: its own files, plus the shared rules (the notes about rolling and mixing)
      const list = Object.values(dict).filter((v) => v.da && /^(server\/src|src\/shared)\//.test(v.where)).map((v) => [v.en, v.da]);
      return `export default ${JSON.stringify(list)};`;
    },
    transform(code, id) {
      const file = id.split("?")[0].split(path.sep).join("/");
      const rootFwd = ROOT.split(path.sep).join("/");
      if (!file.startsWith(rootFwd + "/")) return null;
      const rel = file.slice(rootFwd.length + 1);
      if (!translatable(rel) || rel.startsWith("server/") || rel === "src/lang.ts") return null;
      const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
      const edits = [];
      for (const item of collectTexts(sf, rel)) {
        const da = byEn.get(item.norm);
        if (da) edits.push({ start: item.node.getStart(), end: item.node.getEnd(), node: item.node, da });
      }
      if (!edits.length) return null;
      // outer texts first, so a text inside another one's expression is handled when that expression is written out
      edits.sort((a, b) => a.start - b.start || b.end - a.end);
      const render = (from, to, skip) => {
        let out = "";
        let at = from;
        for (const e of edits) {
          if (e === skip || e.start < at || e.end > to) continue; // itself, before here (already covered by an outer text), or outside this range
          const dk = danishCode(e.node, e.da, code, render);
          out += code.slice(at, e.start);
          if (dk === null) { skipped++; out += code.slice(e.start, e.end); }
          else {
            // the English as it was written (a template can still hold translated texts in its expressions)
            const en = ts.isTemplateExpression(e.node) ? render(e.start, e.end, e) : code.slice(e.start, e.end);
            out += `(__DA ? ${dk} : ${en})`;
            replaced++;
          }
          at = e.end;
        }
        return out + code.slice(at, to);
      };
      let langPath = path.relative(path.dirname(file), rootFwd + "/src/lang").split(path.sep).join("/");
      if (!langPath.startsWith(".")) langPath = "./" + langPath;
      return { code: `import { LANG_DA as __DA } from ${JSON.stringify(langPath)};\n` + render(0, code.length), map: null };
    },
    buildEnd() { console.log(`[danish] ${replaced} texts have a Danish version${skipped ? `, ${skipped} left in English (placeholders don't line up)` : ""}`); },
  };
}
