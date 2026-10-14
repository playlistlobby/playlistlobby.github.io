// Collects every piece of text a player can see (buttons, messages, item names, 6ixty's lines, server messages...) into a spreadsheet
// so it can be translated by hand:  node scripts/extract-text.mjs   ->  translation/6ixplanet-text.csv (+ a readable .md)
// It walks the TypeScript with the compiler (not a regex), so it only takes real strings and skips class names, ids, paths and so on.
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { ROOT, collectTexts, hasLetters, translatable } from "./text-filter.mjs";

const files = [];
for (const d of ["src", "server/src"]) walk(path.join(ROOT, d));
files.push(path.join(ROOT, "index.html"));
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "avatar") walk(full); }
    else if (translatable(path.relative(ROOT, full).split(path.sep).join("/"))) files.push(full);
  }
}

const rows = new Map(); // english -> { where: [], keys: Set }
const add = (text, file, line, why) => {
  text = text.replace(/\s+\n\s+/g, " ").trim();
  if (!text) return;
  const r = rows.get(text) ?? { where: [], why: new Set() };
  r.where.push(`${path.relative(ROOT, file).split(path.sep).join("/")}:${line}`);
  if (why) r.why.add(why);
  rows.set(text, r);
};

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  if (file.endsWith(".html")) {
    for (const m of src.matchAll(/>([^<>]{3,})</g)) { const t = m[1].trim(); if (hasLetters(t)) add(t, file, src.slice(0, m.index).split("\n").length, "html"); }
    for (const m of src.matchAll(/(?:title|placeholder|alt|aria-label)="([^"]+)"/g)) add(m[1], file, src.slice(0, m.index).split("\n").length, "html");
    continue;
  }
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  for (const t of collectTexts(sf, path.relative(ROOT, file).split(path.sep).join("/"))) add(t.text, file, t.line, t.key);
}

// ---- write them out --------------------------------------------------------------------------------------------------
const list = [...rows.entries()].sort((a, b) => a[1].where[0].localeCompare(b[1].where[0], "en", { numeric: true }));
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;
const outDir = path.join(ROOT, "translation");
fs.mkdirSync(outDir, { recursive: true });
const csvLines = ["ID,English,Danish,Where"];
list.forEach(([text, r], i) => {
  const id = "T" + String(i + 1).padStart(4, "0");
  const where = [...new Set(r.where)].slice(0, 4).join("  |  ") + (r.where.length > 4 ? `  (+${r.where.length - 4} more)` : "");
  csvLines.push([id, csvCell(text), csvCell(""), csvCell(where)].join(","));
});
fs.writeFileSync(path.join(outDir, "6ixplanet-text.csv"), "﻿" + csvLines.join("\r\n") + "\r\n", "utf8");

// a readable version grouped by file
const byFile = new Map();
list.forEach(([text, r], i) => { const f = r.where[0].split(":")[0]; (byFile.get(f) ?? byFile.set(f, []).get(f)).push({ id: "T" + String(i + 1).padStart(4, "0"), text }); });
const md = ["# 6ixPlanet: all the text in the game", "", "Fill in the Danish for each line. Keep anything in {curly brackets} exactly as it is (it is replaced by a name or a number in the game).", ""];
for (const [f, items] of [...byFile.entries()].sort()) {
  md.push(`## ${f}`, "");
  for (const it of items) md.push(`- **${it.id}** ${it.text}`, `  - Danish: `);
  md.push("");
}
fs.writeFileSync(path.join(outDir, "6ixplanet-text.md"), md.join("\n"), "utf8");
console.log(`${list.length} different texts from ${files.length} files -> translation/6ixplanet-text.csv`);
