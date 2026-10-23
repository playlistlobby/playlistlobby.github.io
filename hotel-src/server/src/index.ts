// The public face of the server: CORS, who is asking, then hand the request to the economy.
import { verifyToken } from "./auth";
import { handleWebhook, PayError, startCheckout } from "./pay";
import type { Env } from "./env";
export { Economy } from "./economy";

const MAX_BODY = 16_000; // (a poster's picture travels with the request that hangs it)

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");
    const headers = cors(env, origin);
    const reply = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { ...headers, "content-type": "application/json" } });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health") return reply({ ok: true });
    // Stripe tells us a payment went through (no browser, no login: the signature is the proof)
    if (url.pathname === "/pay/webhook" && request.method === "POST") {
      const r = await handleWebhook(env, await request.text(), request.headers.get("stripe-signature"));
      return new Response(r.body, { status: r.status });
    }
    // a player wants to pay real money: make the payment page
    if (url.pathname === "/pay/checkout" && request.method === "POST") {
      if (origin && !env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).includes(origin)) return reply({ ok: false, error: "Not allowed." }, 403);
      try {
        const who = await verifyToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""), env);
        const body = (await request.json().catch(() => ({}))) as { product?: unknown };
        return reply({ ok: true, ...(await startCheckout(env, who.uid, body.product)) });
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
    try { caller = await verifyToken(auth.replace(/^Bearer\s+/i, ""), env); } catch { return reply({ ok: false, error: "Please log in again." }, 401); }

    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply({ ok: false, error: "Too big." }, 413);
    let parsed: { a?: unknown; args?: unknown };
    try { parsed = JSON.parse(raw); } catch { return reply({ ok: false, error: "Bad request." }, 400); }
    if (typeof parsed.a !== "string") return reply({ ok: false, error: "Bad request." }, 400);

    // which browser this is, as a short hash: accounts that log in from the same one are "peers" (they can't stab each other)
    const net: string[] = [];
    const hash = async (s: string): Promise<string> => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sixplanet|" + s)))].slice(0, 9).map((b) => b.toString(16).padStart(2, "0")).join("");
    const dev = request.headers.get("x-device") ?? "";
    if (/^[A-Za-z0-9-]{8,64}$/.test(dev)) net.push("dv" + (await hash(dev)));
    const stub = env.ECONOMY.get(env.ECONOMY.idFromName("main"));
    const r = await stub.fetch("https://economy/act", { method: "POST", body: JSON.stringify({ caller, action: parsed.a, args: parsed.args ?? {}, net }) });
    return new Response(r.body, { status: r.status, headers: { ...headers, "content-type": "application/json" } });
  },
} satisfies ExportedHandler<Env>;
