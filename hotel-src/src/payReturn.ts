// Back from the payment page (?pay=success): the money takes a few seconds to reach the game server, then the CD (or what you bought from the pay2win machine) is handed over.
// Also run quietly at every login, so something that was paid for in a tab that got closed still arrives.
import { claimPurchases } from "./db";
import type { Profile } from "./db";
import { itemDef } from "./items";
import { toast } from "./ui/dom";

const sleep = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));

export async function collectPaidCds(p: Profile): Promise<void> {
  const url = new URL(window.location.href);
  const pay = url.searchParams.get("pay");
  if (pay) { url.searchParams.delete("pay"); window.history.replaceState(null, "", url.pathname + url.search + url.hash); }
  if (pay === "cancel") { toast("The payment was cancelled. Nothing was charged."); return; }
  const tries = pay === "success" ? 20 : 1; // waiting for the payment to arrive: every 2 seconds, up to 40 seconds
  for (let i = 0; i < tries; i++) {
    try {
      const r = await claimPurchases(p);
      for (const id of r.items) toast(`You got the ${itemDef(id)?.name ?? "CD"} CD!`);
      for (const d of r.ducky) {
        if (d.stuck) { toast(`${d.stuck} Your payment is safe: tell the admin and you get it sorted.`, "err"); continue; }
        if (d.product === "starter") toast("The starter package is in your pockets, and 50 blood.");
        else if (d.product === "color" && d.color) { p.nameColor = d.color; window.dispatchEvent(new CustomEvent("name-color", { detail: d.color })); toast("Your name has a colour now."); }
        else if (d.product === "fx") toast("The chat tool is yours: tap the ✨ next to the chat bar.");
        else if (d.product === "rename" && d.name) { toast(`You are ${d.name} now. The page reloads.`); window.setTimeout(() => window.location.reload(), 1600); }
      }
      if (r.items.length || r.ducky.length) { window.dispatchEvent(new Event("pocket-changed")); return; }
      if (r.full) { toast("Your pockets are full. Make room, and your CD arrives next time you log in.", "err"); return; }
    } catch { /* the server may be busy: try again */ }
    if (i < tries - 1) await sleep(2000);
  }
  if (pay === "success") toast("Your payment is on its way. It arrives as soon as it has been received (log in again if it takes long).");
}
