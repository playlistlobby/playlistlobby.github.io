import { defineConfig } from "vite";
// @ts-expect-error: a plain .mjs build script
import danish from "./scripts/danish-plugin.mjs";

// Relative base so the built site works from any folder (e.g. /hotel/ on GitHub Pages) without rebuilding per URL.
// The game is built in Danish (the texts come from translation/da.json); VITE_LANG=en builds the English one.
export default defineConfig({
  base: "./",
  plugins: [danish()],
});
