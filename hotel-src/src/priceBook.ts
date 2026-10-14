// The server charges for clothes, but the price list is built from files only the game has (the avatar data), so the admin's game publishes it:
// every clothing item that costs drops, with its current price and whether it is on sale. Players' games ignore this; the server reads it.
import { get, ref, set } from "firebase/database";
import { db } from "./firebase";
import { allItemsBySlot } from "./catalog";
import { onShopConfig } from "./shopConfig";
import { onDesignsChanged } from "./designs";

type Book = Record<string, { p: number; on: 0 | 1 }>;

function build(): Book {
  const book: Book = {};
  for (const list of Object.values(allItemsBySlot())) {
    for (const it of list) if (!it.starter && it.price > 0) book[it.key] = { p: it.price, on: it.shopOn ? 1 : 0 };
  }
  return book;
}

/** Keeps config/priceBook/clothing in step with the shop settings. Only the admin's game calls this (the rules refuse everybody else). Returns the stop function. */
export function publishPriceBook(): () => void {
  let last = "";
  let timer = 0;
  const publish = async () => {
    const book = build();
    const json = JSON.stringify(book);
    if (json === last) return;
    try {
      const live = JSON.stringify((await get(ref(db, "config/priceBook/clothing"))).val() ?? {});
      if (live !== json) await set(ref(db, "config/priceBook/clothing"), book);
      last = json;
    } catch { /* not allowed or offline: try again at the next change */ }
  };
  const soon = () => { window.clearTimeout(timer); timer = window.setTimeout(() => void publish(), 1500); };
  const offShop = onShopConfig(soon);
  const offDesigns = onDesignsChanged(soon);
  soon();
  return () => { window.clearTimeout(timer); offShop(); offDesigns(); };
}
