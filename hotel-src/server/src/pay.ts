// Paying real money for the CDs sold at the record player in the shop (Stripe Checkout).
//   /pay/checkout  (a logged-in player asks to buy)   -> makes a Stripe Checkout page and returns its address
//   /pay/webhook   (Stripe tells us the money arrived) -> marks the purchase "paid" (the signature is checked)
// The CD itself is handed over by the `claimPurchases` action (src/actions/pay.ts), through the normal pocket rules.
// Records live at purchases/<session> (the whole story) and userPurchases/<uid>/<session> (what a player has bought); only this server writes them.
import { Env, isEmulator } from "./env";
import { Rtdb } from "./rtdb";
import { cdOwnedKey, MYSTERY_CDS, MYSTERY_PRICE_ORE, PayProduct } from "../../src/shared/cds";

/** a checkout that was started but not paid counts as "on its way" for this long (so nobody can open ten and pay for ten) */
const OPEN_MS = 45 * 60_000;
type Status = "open" | "paid" | "claimed" | "stuck";
interface Purchase { uid: string; product: PayProduct; amount: number; status: Status; at: number; session: string; paidAt?: number; item?: string }
interface UserPurchase { product: PayProduct; status: Status; at: number }

const NAMES = { mystery: "Mystery CD (Blodig oktober)" };
const AMOUNT = { mystery: MYSTERY_PRICE_ORE };

export class PayError extends Error {
  constructor(msg: string, readonly status = 400) { super(msg); }
}

/** Can this player buy this now? Mystery: three in all, never the same twice. (The album is not sold any more.) */
async function checkEligible(db: Rtdb, uid: string, product: "mystery", now: number): Promise<void> {
  const owned = (await db.get<Record<string, boolean>>(`users/${uid}/owned`)) ?? {};
  const mine = Object.values((await db.get<Record<string, UserPurchase>>(`userPurchases/${uid}`)) ?? {});
  const onItsWay = (p: UserPurchase): boolean => p.status === "paid" || (p.status === "open" && now - p.at < OPEN_MS);
  const have = MYSTERY_CDS.filter((i) => owned[cdOwnedKey(i)]).length;
  const coming = mine.filter((p) => p.product === "mystery" && onItsWay(p)).length;
  if (have >= MYSTERY_CDS.length) throw new PayError("You have all three mystery CDs. There are none left.");
  if (have + coming >= MYSTERY_CDS.length) throw new PayError("You're already buying the last mystery CD. Finish that first.");
}

const rand = (): string => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");

/** POST /pay/checkout { product } with the login token: returns { url } to send the player to. */
export async function startCheckout(env: Env, uid: string, product: unknown): Promise<{ url: string }> {
  if (product !== "mystery") throw new PayError("Bad product.");
  const db = new Rtdb(env);
  const now = Date.now();
  await checkEligible(db, uid, product, now);
  const publicUrl = (env.PUBLIC_URL || (isEmulator(env) ? "http://127.0.0.1:5173/" : "https://playlistmag.studio/hotel/")).replace(/\/?$/, "/");
  let session = "";
  let url = "";
  let status: Status = "open";
  if (!env.STRIPE_SECRET_KEY) {
    if (!isEmulator(env)) throw new PayError("Payments aren't set up yet.", 503);
    // local testing only: no Stripe, the "payment" is counted as made at once
    session = `cs_local_${rand()}`;
    url = `${publicUrl}?pay=success`;
    status = "paid";
  } else {
    const form = new URLSearchParams({
      mode: "payment",
      success_url: `${publicUrl}?pay=success`,
      cancel_url: `${publicUrl}?pay=cancel`,
      client_reference_id: uid,
      "metadata[uid]": uid,
      "metadata[product]": product,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "dkk",
      "line_items[0][price_data][unit_amount]": String(AMOUNT[product]),
      "line_items[0][price_data][product_data][name]": NAMES[product],
    });
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
    const j = (await r.json().catch(() => null)) as { id?: string; url?: string; error?: { message?: string } } | null;
    if (!r.ok || !j?.id || !j.url) {
      console.error("stripe checkout failed", r.status, j?.error?.message);
      throw new PayError(`The payment page couldn't be made${j?.error?.message ? ` (${j.error.message})` : ""}.`, 502);
    }
    session = j.id;
    url = j.url;
  }
  const rec: Purchase = { uid, product, amount: AMOUNT[product], status, at: now, session, ...(status === "paid" ? { paidAt: now } : {}) };
  const mine: UserPurchase = { product, status, at: now };
  await db.patch({ [`purchases/${session}`]: rec, [`userPurchases/${uid}/${session}`]: mine });
  return { url };
}

// ---- Stripe tells us ----------------------------------------------------------------------------------------------------
const hex = (b: ArrayBuffer): string => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
const same = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

/** Stripe-Signature: t=<time>,v1=<hmac of "<time>.<body>">. Only a request signed with our webhook secret is believed. */
export async function verifyStripeSignature(raw: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find((p) => p[0] === "t")?.[1];
  const sigs = parts.filter((p) => p[0] === "v1").map((p) => p[1] ?? "");
  if (!t || !sigs.length || Math.abs(nowSec - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  return sigs.some((s) => same(s, mac));
}

/** POST /pay/webhook: the money arrived (checkout.session.completed with payment_status "paid"). */
export async function handleWebhook(env: Env, raw: string, signature: string | null): Promise<{ status: number; body: string }> {
  if (!env.STRIPE_WEBHOOK_SECRET) return { status: 503, body: "not set up" };
  if (!(await verifyStripeSignature(raw, signature, env.STRIPE_WEBHOOK_SECRET))) return { status: 400, body: "bad signature" };
  let event: { type?: string; data?: { object?: { id?: string; payment_status?: string; amount_total?: number; currency?: string } } };
  try { event = JSON.parse(raw); } catch { return { status: 400, body: "bad body" }; }
  const obj = event.data?.object;
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && obj?.id && obj.payment_status === "paid") {
    const db = new Rtdb(env);
    const rec = await db.get<Purchase>(`purchases/${obj.id}`);
    if (rec && rec.status === "open") {
      const right = obj.currency === "dkk" && obj.amount_total === rec.amount; // paid what it should cost
      const status: Status = right ? "paid" : "stuck";
      if (!right) console.error("stripe amount mismatch", obj.id, obj.amount_total, obj.currency, rec.amount);
      await db.patch({ [`purchases/${obj.id}/status`]: status, [`purchases/${obj.id}/paidAt`]: Date.now(), [`userPurchases/${rec.uid}/${obj.id}/status`]: status });
    }
  }
  return { status: 200, body: "ok" };
}
