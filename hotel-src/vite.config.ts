import { defineConfig } from "vite";

// Relative base so the built site works from any folder (e.g. /hotel/ on GitHub Pages) without rebuilding per URL.
export default defineConfig({
  base: "./",
});
