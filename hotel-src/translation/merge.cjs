// Puts the hand-made Danish (from the user's file) together with the rest, checks every line, and writes the finished files.
const fs = require("fs");
const D = __dirname + "/";
const rows = JSON.parse(fs.readFileSync(D + "_rows.json", "utf8"));
// the markdown editor escaped some characters (\_  \&  \[ ...): take the backslashes out again
const unescapeMd = (s) => s.replace(/\\([\\`*_{}\[\]()#+.!&<>|~-])/g, "$1");
for (const r of rows) { r.en = unescapeMd(r.en); r.da = unescapeMd(r.da); }
const byId = new Map(rows.map((r) => [r.id, r]));

const mine = new Map();
const problems = [];
for (const part of ["_part1.txt", "_part2.txt", "_part3.txt"]) {
  const lines = fs.readFileSync(D + part, "utf8").replace(/\r/g, "").split("\n");
  let cur = null;
  for (const line of lines) {
    const m = /^(T\d{4})\|([^|]*)\|([\s\S]*)$/.exec(line);
    if (m) {
      cur = { id: m[1], prefix: m[2], da: m[3] };
      mine.set(cur.id, cur);
    } else if (cur) cur.da += "\n" + line; // a translation that continues on the next lines
  }
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
let used = 0, kept = 0;
for (const r of rows) {
  const m = mine.get(r.id);
  if (r.da) { kept++; if (m) problems.push(`${r.id}: you had translated it, I also had one (yours is kept)`); continue; }
  if (!m) { problems.push(`${r.id}: nothing translated (${r.en.slice(0, 40)})`); continue; }
  const a = norm(r.en), p = norm(m.prefix);
  if (p && !a.includes(p)) problems.push(`${r.id}: my prefix "${m.prefix}" does not match "${r.en.slice(0, 50)}"`);
  r.da = /^<svg/.test(r.en) ? r.en : m.da.replace(/\n+$/, "");
  used++;
}
for (const id of mine.keys()) if (!byId.has(id)) problems.push(`${id}: no such text`);

// tidy what the user typed (stray tabs / spaces)
for (const r of rows) r.da = r.da.replace(/[\t ]+$/g, "").replace(/^[\t ]+/, "");
const emoji = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{23CF}\u{FE0F}]/u;
for (const r of rows) if (emoji.test(r.da) && !/^[←]/.test(r.da)) problems.push(`${r.id}: emoji/symbol left in Danish: ${r.da.slice(0, 40)}`);

console.log(`rows ${rows.length}: yours kept ${kept}, mine ${used}, blank ${rows.filter((r) => !r.da).length}`);
console.log(problems.join("\n") || "no problems");

// ---- write the finished files ----------------------------------------------------------------------------------------
const csvOld = fs.existsSync(D + "6ixplanet-text.csv") ? fs.readFileSync(D + "6ixplanet-text.csv", "utf8") : "";
const where = new Map();
for (const l of csvOld.split(/\r\n/).slice(1)) { const m = /^(T\d+),.*,"([^"]*)"$/.exec(l); if (m) where.set(m[1], m[2]); }
const cell = (s) => `"${String(s).replace(/"/g, '""')}"`;
fs.writeFileSync(D + "6ixplanet-text-da.csv", "﻿" + ["ID,English,Danish,Where", ...rows.map((r) => [r.id, cell(r.en), cell(r.da), cell(where.get(r.id) ?? "")].join(","))].join("\r\n") + "\r\n", "utf8");
fs.writeFileSync(D + "da.json", JSON.stringify(Object.fromEntries(rows.map((r) => [r.id, { en: r.en, da: r.da, where: where.get(r.id) ?? "" }])), null, 1), "utf8");

// the same markdown layout as the one the user filled in
const src = fs.readFileSync(D + "6ixplanet-text.user.md", "utf8").replace(/\r/g, "");
const out = src.replace(/(\* \*\*(T\d{4})\*\* [\s\S]*?\n\n\s*\* Danish:)[^\n]*/g, (all, head, id) => `${head} ${byId.get(id)?.da ?? ""}`);
fs.writeFileSync(D + "6ixplanet-text-da.md", out, "utf8");
console.log("written: 6ixplanet-text-da.csv, 6ixplanet-text-da.md, da.json");
