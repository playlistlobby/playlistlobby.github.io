// Checks the Danish build without building: applies the translation to every file and makes sure each result is still valid code.
//   node scripts/check-danish.mjs
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import danish from "./danish-plugin.mjs";
import { ROOT, translatable } from "./text-filter.mjs";

const plugin = danish();
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "avatar") walk(f); }
    else if (translatable(path.relative(ROOT, f).split(path.sep).join("/")) && !path.relative(ROOT, f).startsWith("server")) files.push(f);
  }
})(path.join(ROOT, "src"));

let bad = 0, changed = 0;
for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  const r = plugin.transform(code, f.split(path.sep).join("/"));
  if (!r) continue;
  changed++;
  const res = ts.transpileModule(r.code, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ESNext } });
  if (res.diagnostics?.length) {
    bad++;
    const d = res.diagnostics[0];
    const line = ts.getLineAndCharacterOfPosition(ts.createSourceFile("x.ts", r.code, ts.ScriptTarget.Latest), d.start ?? 0).line;
    console.log(path.relative(ROOT, f), "line", line + 1, ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    console.log("   ", r.code.split("\n")[line].slice(0, 300));
  }
}
console.log(`${changed} files translated, ${bad} with errors`);

// A text that is translated in one place but also used as a code word in another (compared, used as a key...) would stop matching.
// List every such place so it can be looked at.
import { collectTexts, normalize } from "./text-filter.mjs";
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, "translation", "da.json"), "utf8"));
const translated = new Set(Object.values(dict).filter((v) => v.da && v.da !== v.en).map((v) => normalize(v.en)));
let coupled = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join("/");
  const sf = ts.createSourceFile(f, fs.readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true);
  const taken = new Set(collectTexts(sf, rel).map((t) => t.node));
  const visit = (n) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && !taken.has(n) && translated.has(normalize(n.text))) {
      coupled++;
      const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
      console.log(`  still English (used as code): ${rel}:${line}  ${JSON.stringify(n.text)}   in: ${n.parent.getText().slice(0, 90).replace(/\s+/g, " ")}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log(`${coupled} places use a translated text as a code word`);
