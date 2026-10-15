import { defineConfig } from "vite";
// @ts-expect-error: a plain .mjs build script
import danish from "./scripts/danish-plugin.mjs";

// Relative base so the built site works from any folder (e.g. /hotel/ on GitHub Pages) without rebuilding per URL.
// The game is built in Danish (the texts come from translation/da.json); VITE_LANG=en builds the English one.
// Every build gets an id; it is also written to version.json so a phone running an older copy can tell (see src/updateCheck.ts).
const BUILD_ID = String(Date.now());
export default defineConfig({
  base: "./",
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    danish(),
    { name: "version-file", generateBundle() { this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ id: BUILD_ID }) }); } },
  ],
});
