// A phone keeps an old copy of the game for ages (the page itself is cached for ten minutes, an installed app for longer), so fixes seemed to "not work".
// Every build writes version.json next to the page with its own id. When the game starts, and whenever you come back to it, it asks for that file
// (never cached) and, if the id is newer than the copy you are running, reloads once with a fresh address so the new build is fetched.
declare const __BUILD_ID__: string;

const KEY = "6ixplanet.reloadedFor";

async function check(): Promise<void> {
  if (import.meta.env.DEV || typeof __BUILD_ID__ === "undefined") return;
  try {
    const r = await fetch(new URL("version.json", document.baseURI).href + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const id = String(((await r.json()) as { id?: unknown }).id ?? "");
    if (!id || id === __BUILD_ID__) return;
    try { if (sessionStorage.getItem(KEY) === id) return; sessionStorage.setItem(KEY, id); } catch { /* private mode: one try per page load anyway */ }
    const url = new URL(location.href);
    url.searchParams.set("v", id); // a different address, so the old cached page is not used
    location.replace(url.toString());
  } catch { /* offline: nothing to do */ }
}

export function startUpdateCheck(): void {
  window.setTimeout(() => void check(), 2500);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void check(); });
}
