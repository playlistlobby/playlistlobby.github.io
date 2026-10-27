// The mixer's daily stock comes back at 10:00 Danish time (src/shared/economy.ts lastRestockAt / vendLeft), without a server. node test/restock.mjs
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(mkdtempSync(join(tmpdir(), "rs-")), "economy.mjs");
buildSync({ entryPoints: [resolve(here, "../../src/shared/economy.ts")], bundle: true, format: "esm", outfile: out, logLevel: "error" });
const E = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { if (cond) pass++; else { fail++; console.log("FAIL ", name, extra); } };

// winter (Danish time = UTC+1): 10:00 is 09:00 UTC
const win = (iso) => Date.parse(iso);
check("winter, 12:00 UTC: the last restock was 09:00 UTC today", E.lastRestockAt(win("2026-01-15T12:00:00Z")) === win("2026-01-15T09:00:00Z"));
check("winter, 08:59 UTC (09:59 there): still yesterday's", E.lastRestockAt(win("2026-01-15T08:59:00Z")) === win("2026-01-14T09:00:00Z"));
check("winter, exactly 09:00 UTC: the new one", E.lastRestockAt(win("2026-01-15T09:00:00Z")) === win("2026-01-15T09:00:00Z"));
// summer (UTC+2): 10:00 is 08:00 UTC
check("summer, 12:00 UTC: 08:00 UTC today", E.lastRestockAt(win("2026-07-15T12:00:00Z")) === win("2026-07-15T08:00:00Z"));
check("summer, 07:59 UTC: yesterday's", E.lastRestockAt(win("2026-07-15T07:59:00Z")) === win("2026-07-14T08:00:00Z"));
// the clocks go forward on the last Sunday of March (2026-03-29): the day after is summer time
check("the morning after the clocks went forward: 08:00 UTC", E.lastRestockAt(win("2026-03-30T12:00:00Z")) === win("2026-03-30T08:00:00Z"));
check("the afternoon of the change day: 08:00 UTC (summer time since 03:00)", E.lastRestockAt(win("2026-03-29T12:00:00Z")) === win("2026-03-29T08:00:00Z"));
check("the evening before it: 09:00 UTC (winter)", E.lastRestockAt(win("2026-03-28T20:00:00Z")) === win("2026-03-28T09:00:00Z"));

// the stock
const now = win("2026-01-15T12:00:00Z");
const s = { joinAt: now - 30 * 86_400_000, vend: {} };
check("an old account still gets 5 mixers", E.vendLeft(s, "mixer", now) === 5, String(E.vendLeft(s, "mixer", now)));
s.vend.mixer = { day: E.vendDay("mixer", now), n: 5 };
check("all bought: none left", E.vendLeft(s, "mixer", now) === 0);
check("at 08:59 UTC the next day (09:59 there): still none", E.vendLeft(s, "mixer", win("2026-01-16T08:59:00Z")) === 0);
check("at 09:00 UTC the next day: five again", E.vendLeft(s, "mixer", win("2026-01-16T09:00:00Z")) === 5);
check("a kit still gets smaller with the age of the account", E.vendLeft({ joinAt: now - 30 * 86_400_000, vend: {} }, "planter", now) === 1);
check("a lighter has no limit", E.vendLeft(s, "lighter", now) === null);

console.log(fail ? `${fail} FAILED, ${pass} passed` : `all ${pass} passed`);
process.exit(fail ? 1 : 0);
