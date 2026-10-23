// Renders one of the export.html modes headlessly and saves the PNG frames, in one command (for cloud sessions and CI-like use):
//   node scripts/render-anim.mjs <mode> <output-folder>        e.g.  node scripts/render-anim.mjs dig ./out
// Needs: `npm i --no-save playwright && npx playwright install chromium` (not a project dependency). Modes: see `only` in src/exportTool.ts.
// Frames land in <output-folder>/animation-<name>/frames/frame-000.png ...; then run scripts/encode-anim.mjs on that folder.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [mode, outArg] = process.argv.slice(2);
if (!mode || !outArg) { console.error("usage: node scripts/render-anim.mjs <mode> <output-folder>"); process.exit(1); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const procs = [];
const run = (args) => { const p = spawn(process.execPath, args, { cwd: root, stdio: "inherit" }); procs.push(p); return p; };
const stopAll = () => procs.forEach((p) => p.kill());
process.on("exit", stopAll);

const { chromium } = await import("playwright").catch(() => { console.error("playwright missing: npm i --no-save playwright && npx playwright install chromium"); process.exit(1); });
run(["scripts/export-server.mjs", path.resolve(outArg)]);
run(["node_modules/vite/bin/vite.js", "--port", "5199", "--host", "127.0.0.1", "--strictPort"]);
const url = `http://127.0.0.1:5199/export.html?only=${encodeURIComponent(mode)}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on("console", (m) => { if (m.type() === "error") console.error("[page]", m.text()); });
await page.goto(url);
await page.waitForFunction(() => document.title === "export done" || document.title === "export error", null, { timeout: 30 * 60_000, polling: 1000 });
console.log(await page.locator("#log").innerText());
const failed = (await page.title()) === "export error";
await browser.close();
stopAll();
process.exit(failed ? 1 : 0);
