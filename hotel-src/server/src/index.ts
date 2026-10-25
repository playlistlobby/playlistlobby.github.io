// The public face of the server: CORS, who is asking, then hand the request to the economy.
import { applyRole, verifyToken } from "./auth";
import { Rtdb } from "./rtdb";
import { CHATMOD_NAME, ipKey } from "../../src/shared/mod";
import { handleWebhook, PayError, startCheckout } from "./pay";
import type { Env } from "./env";
export { Economy } from "./economy";

const MAX_BODY = 16_000; // (a poster's picture travels with the request that hangs it)
const MAX_BODY_IDEA = 300_000; // (a picture on the ideas board travels with its post)

function cors(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  const ok = origin && allowed.includes(origin);
  return {
    "access-control-allow-origin": ok ? origin! : allowed[0],
    "access-control-allow-headers": "authorization, content-type, x-device",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

const bannedIps: { at: number; keys: Set<string> } = { at: 0, keys: new Set() };
/** is this address banned? (bannedIps/<key>, remembered for 15 seconds) */
async function ipBanned(env: Env, ip: string): Promise<boolean> {
  if (Date.now() - bannedIps.at > 15_000) {
    try { bannedIps.keys = new Set(await new Rtdb(env).keys("bannedIps")); bannedIps.at = Date.now(); } catch { /* keep the old list */ }
  }
  return bannedIps.keys.has(ipKey(ip));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");
    const headers = cors(env, origin);
    const reply = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { ...headers, "content-type": "application/json" } });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health") return reply({ ok: true, ...(env.MAINTENANCE ? { maintenance: env.MAINTENANCE } : {}) });
    // Stripe tells us a payment went through (no browser, no login: the signature is the proof)
    if (url.pathname === "/pay/webhook" && request.method === "POST") {
      const r = await handleWebhook(env, await request.text(), request.headers.get("stripe-signature"));
      return new Response(r.body, { status: r.status });
    }
    // a player wants to pay real money: make the payment page
    if (url.pathname === "/pay/checkout" && request.method === "POST") {
      if (origin && !env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).includes(origin)) return reply({ ok: false, error: "Not allowed." }, 403);
      try {
        const who = await applyRole(await verifyToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""), env), env);
        if (env.MAINTENANCE && !who.isAdmin) return reply({ ok: false, error: env.MAINTENANCE, maintenance: true }, 503);
        const body = (await request.json().catch(() => ({}))) as { product?: unknown; color?: unknown; name?: unknown };
        return reply({ ok: true, ...(await startCheckout(env, who.uid, body.product, body)) });
      } catch (e) {
        if (e instanceof PayError) return reply({ ok: false, error: e.message }, e.status);
        console.error("checkout failed", e);
        return reply({ ok: false, error: "Please log in again." }, 401);
      }
    }
    if (url.pathname !== "/act" || request.method !== "POST") return reply({ ok: false, error: "Not found." }, 404);
    // browsers from other sites can't read the answer (CORS), and the token is required anyway; still refuse unknown origins outright
    if (origin && !env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).includes(origin)) return reply({ ok: false, error: "Not allowed." }, 403);

    const auth = request.headers.get("authorization") ?? "";
    let caller;
    try { caller = await applyRole(await verifyToken(auth.replace(/^Bearer\s+/i, ""), env), env); } catch { return reply({ ok: false, error: "Please log in again." }, 401); }

    const raw = await request.text();
    if (raw.length > MAX_BODY_IDEA) return reply({ ok: false, error: "Too big." }, 413);
    let parsed: { a?: unknown; args?: unknown };
    try { parsed = JSON.parse(raw); } catch { return reply({ ok: false, error: "Bad request." }, 400); }
    if (typeof parsed.a !== "string") return reply({ ok: false, error: "Bad request." }, 400);
    if (raw.length > MAX_BODY && parsed.a !== "ideaPost") return reply({ ok: false, error: "Too big." }, 413);

    // the game is closed: everybody but the admin gets the text (except the making of the chat mod account, so the mods can get in)
    const nameArg = ((parsed.args as { name?: unknown } | undefined)?.name);
    const openForChatMod = parsed.a === "register" && typeof nameArg === "string" && nameArg.toLowerCase() === CHATMOD_NAME;
    if (env.MAINTENANCE && !caller.isAdmin && !openForChatMod) return reply({ ok: false, error: env.MAINTENANCE, maintenance: true }, 503);
    const ip = request.headers.get("cf-connecting-ip") ?? "";
    if (ip && !caller.isAdmin && (await ipBanned(env, ip))) return reply({ ok: false, error: "This connection has been banned." }, 403);

    // which browser this is, as a short hash: accounts that log in from the same one are "peers" (they can't stab each other)
    const net: string[] = [];
    const hash = async (s: string): Promise<string> => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sixplanet|" + s)))].slice(0, 9).map((b) => b.toString(16).padStart(2, "0")).join("");
    const dev = request.headers.get("x-device") ?? "";
    if (/^[A-Za-z0-9-]{8,64}$/.test(dev)) net.push("dv" + (await hash(dev)));
    const stub = env.ECONOMY.get(env.ECONOMY.idFromName("main"));
    const r = await stub.fetch("https://economy/act", { method: "POST", body: JSON.stringify({ caller, action: parsed.a, args: parsed.args ?? {}, net, ip }) });
    return new Response(r.body, { status: r.status, headers: { ...headers, "content-type": "application/json" } });
  },
} satisfies ExportedHandler<Env>;
