// Makes public/fonts/AppleColorEmoji.ttf: a small copy of the Apple emoji font that holds only the emoji this game uses (the whole font is huge).
//   1. Get "AppleColorEmoji-Linux.ttf" (the build for browsers / Linux, a normal TTF) from https://github.com/samuelngs/apple-emoji-ttf/releases
//   2. pip install fonttools
//   3. node scripts/make-emoji-font.mjs path/to/AppleColorEmoji-Linux.ttf   (optional 2nd argument: where to write it)
// Apple Color Emoji belongs to Apple: check that you may publish it on your site before you commit the result.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
if (!input || !fs.existsSync(input)) { console.error("usage: node scripts/make-emoji-font.mjs path/to/AppleColorEmoji-Linux.ttf"); process.exit(1); }

// every emoji in the source (pictographs, plus the joiners and variation selectors that belong to them)
const EMOJI = /\p{Extended_Pictographic}|‍|️|⃣/gu;
const codes = new Set([0x200d, 0xfe0f, 0x20e3]);
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "avatar") walk(f); continue; }
    if (!/\.(ts|html|css|json)$/.test(e.name) || /package(-lock)?\.json$/.test(e.name)) continue;
    for (const m of fs.readFileSync(f, "utf8").matchAll(EMOJI)) { const cp = m[0].codePointAt(0); if (cp > 0xff) codes.add(cp); }
  }
})(path.join(ROOT, "src"));
// the emoji of the Danish texts and the player-facing server messages are in src/ and translation/ already; pick up translation/da.json too
for (const m of fs.readFileSync(path.join(ROOT, "translation", "da.json"), "utf8").matchAll(EMOJI)) { const cp = m[0].codePointAt(0); if (cp > 0xff) codes.add(cp); }

const out = process.argv[3] ?? path.join(ROOT, "public", "fonts", "AppleColorEmoji.ttf"); // (a third argument writes somewhere else, for testing)
fs.mkdirSync(path.dirname(out), { recursive: true });
const unicodes = [...codes].sort((a, b) => a - b).map((c) => "U+" + c.toString(16).toUpperCase()).join(",");
console.log(`keeping ${codes.size} characters`);
execFileSync("pyftsubset", [input, `--unicodes=${unicodes}`, `--output-file=${out}`, "--layout-features=*", "--glyph-names", "--no-hinting"], { stdio: "inherit" });
console.log(`wrote ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
