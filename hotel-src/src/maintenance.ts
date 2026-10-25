// Closing the game for a while: while the worker has a MAINTENANCE text (server/wrangler.toml [vars]), every player but the admin gets this full-screen message, and the
// server refuses their actions (server/src/index.ts). The page asks the server's /health every two minutes; when the text is gone again the page reloads and the game is back.
import { auth, useEmulator } from "./firebase";
import { isAdminUser } from "./auth";
import { API_URL } from "./apiConfig";

let overlay: HTMLElement | null = null;
let peeking = false; // (the admin pressed the little dot to log in: the server still refuses everybody else's actions)

const base = (): string => {
  const url = useEmulator ? "http://127.0.0.1:8787" : (import.meta.env.VITE_API_URL as string | undefined) || API_URL;
  return (url || "").replace(/\/+$/, "");
};

export function showMaintenance(text: string): void {
  if (peeking || isAdminUser(auth.currentUser)) return;
  if (!overlay) {
    const msg = document.createElement("div");
    msg.className = "maint-text";
    const dot = document.createElement("button");
    dot.className = "maint-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", "Admin");
    dot.textContent = "·";
    dot.addEventListener("click", () => { peeking = true; overlay?.remove(); overlay = null; });
    overlay = document.createElement("div");
    overlay.className = "maint";
    overlay.setAttribute("role", "alert");
    overlay.append(msg, dot);
    document.body.append(overlay);
  }
  (overlay.querySelector(".maint-text") as HTMLElement).textContent = text;
}

async function check(): Promise<void> {
  const b = base();
  if (!b) return;
  try {
    const r = await fetch(`${b}/health`, { cache: "no-store" });
    const j = (await r.json()) as { maintenance?: string };
    if (j.maintenance) showMaintenance(j.maintenance);
    else if (overlay || peeking) location.reload(); // the game is open again
  } catch { /* offline: nothing to say */ }
}

export function startMaintenanceWatch(): void {
  void check();
  window.setInterval(() => { if (!document.hidden) void check(); }, 120_000); // (every open window asks the server: two minutes keeps it well inside the free request limit)
}
