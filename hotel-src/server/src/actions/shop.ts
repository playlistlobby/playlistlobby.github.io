// Buying from 6ixty, the vending machine and the shop room's daily pieces. The server decides what is on sale and for how much.
import { Action, requireInRoom, roomSize, text } from "./util";
import { fail } from "../ctx";
import { addToInv, lighterHex, RECOLOR_PRICE, ROOM_UPGRADES, STASHBOX_OWNED_KEY, STASHBOX_PRICE, takeQtyFrom } from "../../../src/shared/economy";
import { DISABLED_ITEMS, ITEM_IDS, SELL_BUNDLE, sellPrice, SIXTY_STOCK, VENDING_STOCK } from "../../../src/shared/items";
import { furniPeriodStart, furniPicksToday, furniPrice, POSTER_KIND, POSTER_PRICE, SHIPPED_DIMS, SHOP_KIND_PREFIX, SHOP_PIECES } from "../../../src/shared/furniture";
import { todayStartAt, vendLeft } from "../../../src/shared/economy";
import { DEFAULT_FIXED_POS, DEFAULT_PIECE_POS, nearestWallSpot, skinFootprint, skinOf, skinOwnedKey, SkinPart } from "../../../src/shared/skins";

/** 6ixty's shelf: his stock plus whatever else the admin switched on (never the leftovers: butts and dead cats). */
export const buySixty: Action = {
  async run(c, a) {
    const id = text(a.item, /^[a-z0-9_]{1,30}$/, "item");
    if (id === "cd") fail("He doesn't sell that."); // the Freakme CD is sold at the record player in the shop now
    if (id === "wood") await requireInRoom(c, "mines"); // (he only has wood down in the mines)
    const known = SIXTY_STOCK.includes(id) || (ITEM_IDS.has(id) && !DISABLED_ITEMS.has(id) && id !== "cigbutt");
    if (!known) fail("He doesn't sell that.");
    const entry = await c.itemEntry(id);
    if (!entry.on) fail("He doesn't sell that.");
    const w = await c.user();
    if (w.s.blood < entry.price) fail(`You need ${entry.price - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: id, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= entry.price;
    return { price: entry.price };
  },
};

/** The record player in the shop room: the Freakme CD for blood (one per player, ever: it comes back after it has played). The CDs for real money are bought through /pay/checkout. */
export const buyRecord: Action = {
  async run(c) {
    await requireInRoom(c, "shop");
    const w = await c.user();
    if (w.s.owned.item_cd) fail("You already bought your CD.");
    const price = (await c.itemEntry("cd")).price;
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: "cd", qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= price;
    w.s.owned.item_cd = true;
    return { price };
  },
};

/** The poster on the shop room's wall: a poster for blood. Its picture is chosen when you hang it in your room. */
export const buyPoster: Action = {
  async run(c) {
    await requireInRoom(c, "shop");
    const w = await c.user();
    if (w.s.blood < POSTER_PRICE) fail(`You need ${POSTER_PRICE - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: POSTER_KIND, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= POSTER_PRICE;
    return { price: POSTER_PRICE };
  },
};

/** The shop room's vending machine. */
export const buyVending: Action = {
  async run(c, a) {
    const stock = VENDING_STOCK.find((s) => s.id === a.id);
    if (!stock) return fail("The machine doesn't have that.");
    const price = stock.fixedPrice ?? (await c.itemEntry(stock.id)).price;
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    const left = vendLeft(w.s, stock.id, c.now); // the mixer and the growing kit: a daily stock that gets smaller every day
    if (left !== null && left <= 0) fail("Sold out for today. New stock tomorrow.");
    const next = addToInv(w.s.inventory, { item: stock.item, qty: stock.qty });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= price;
    if (left !== null) { const today = todayStartAt(c.now); const got = w.s.vend[stock.id]; w.s.vend[stock.id] = { day: today, n: (got && got.day === today ? got.n : 0) + 1 }; }
    return { price };
  },
};

/** One of today's four pieces in the shop room. */
export const buyFurni: Action = {
  async run(c, a) {
    const kind = text(a.kind, /^[fx]_[a-z0-9_]{1,30}$/, "piece");
    const meta = await c.furniMeta();
    const cfg = await c.furniCfg();
    // the same pool as the shop window (shopPool in src/furniShop.ts): the shop's own pieces plus Studio pieces. (It used to be every shipped f_ piece, so the mixer was in the server's pool only and the two picked different four.)
    const pool = [...SHOP_PIECES.map((p) => SHOP_KIND_PREFIX + p.id), ...Object.entries(meta).filter(([, m]) => m.players).map(([id]) => id)];
    const picks = furniPicksToday(furniPeriodStart(c.now), cfg, pool, (id) => !!SHIPPED_DIMS[id] || !!meta[id]);
    if (!picks.includes(kind)) fail("That isn't in the shop today.");
    const price = furniPrice(kind, cfg.prices);
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: kind, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= price;
    return { price };
  },
};


/** The landlord's window: in the shop room, or (the admin only) in his own room. */
async function requireLandlord(c: { uid: string; isAdmin: boolean } & Parameters<typeof requireInRoom>[0]): Promise<void> {
  if (c.isAdmin && (await c.db.get(`rooms/u_${c.uid}/players/${c.uid}`))) return;
  await requireInRoom(c, "shop");
}

/** The landlord (in the shop room): the next of three room upgrades makes your room bigger. They have to be bought in order. */
export const buyRoomUpgrade: Action = {
  async run(c) {
    await requireLandlord(c);
    const w = await c.user();
    const next = ROOM_UPGRADES[w.s.roomLevel];
    if (!next) fail("Your room is as big as it gets.");
    if (w.s.blood < next!.price) fail(`You need ${next!.price - w.s.blood} more drops`);
    const room = `u_${c.uid}`;
    if (!(await c.db.get<unknown>(`roomsMeta/${room}/owner`))) fail("You haven't got a room yet.");
    w.s.blood -= next!.price;
    w.s.roomLevel += 1;
    c.extra[`roomsMeta/${room}/w`] = next!.size;
    c.extra[`roomsMeta/${room}/h`] = next!.size;
    return { size: next!.size, price: next!.price };
  },
};

/** The landlord again: new colours for your floor, walls and carpet, 2 drops for each part that really changes. Patterns are gone: a colour replaces them. */
export const roomColors: Action = {
  async run(c, a) {
    await requireLandlord(c);
    const hex = /^#[0-9a-fA-F]{6}$/;
    const pick = (v: unknown, what: string): string | undefined => (v === undefined ? undefined : text(v, hex, what).toLowerCase());
    const floor = pick(a.floor, "floor colour"), wall = pick(a.wall, "wall colour");
    const rug = a.rug === "none" ? null : pick(a.rug, "carpet colour");
    const room = `u_${c.uid}`;
    if (!(await c.db.get<unknown>(`roomsMeta/${room}/owner`))) fail("You haven't got a room yet.");
    const cur = (await c.db.get<Record<string, any>>(`roomsMeta/${room}/theme`)) ?? {};
    const same = (x: unknown, y: string) => String(x ?? "").toLowerCase() === y;
    let parts = 0;
    const put = (k: string, v: unknown) => { c.extra[`roomsMeta/${room}/theme/${k}`] = v; };
    if (floor !== undefined && (!same(cur.floorA ?? "#a99a6a", floor) || cur.floorTex)) { parts++; put("floorA", floor); put("floorB", lighterHex(floor)); put("floorTex", null); }
    if (wall !== undefined && (!same(cur.wall ?? "#b9c9cf", wall) || cur.wallTex)) { parts++; put("wall", wall); put("wallTex", null); }
    if (rug === null) { if (cur.rug ?? true) { parts++; put("rug", false); } }
    else if (rug !== undefined && (!(cur.rug ?? true) || !same(cur.rugColor ?? "#c9544f", rug))) { parts++; put("rug", true); put("rugColor", rug); }
    if (parts === 0) fail("Nothing to change.");
    const price = parts * RECOLOR_PRICE;
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    w.s.blood -= price;
    return { price, parts };
  },
};

/** The landlord's furniture: a new look for your bed and for your bag of clothes (a wardrobe). Bought once, then swapped for free; "default" goes back to the plain one. */
export const roomSkins: Action = {
  async run(c, a) {
    await requireLandlord(c);
    const room = `u_${c.uid}`;
    const meta = await c.db.get<any>(`roomsMeta/${room}`);
    if (!meta?.owner) fail("You haven't got a room yet.");
    const size = await roomSize(c, room);
    const w = await c.user();
    let price = 0, parts = 0;
    for (const part of ["bed", "bag"] as SkinPart[]) {
      if (a[part] === undefined) continue;
      const id = a[part] === "default" ? null : text(a[part], /^[a-z0-9]{1,16}$/, "look");
      if (id !== null && !skinOf(part, id)) fail("That isn't for sale.");
      if (id === (meta.skins?.[part] ?? null)) continue;
      if (id !== null) {
        const key = skinOwnedKey(part, id);
        if (!w.s.owned[key]) { price += skinOf(part, id)!.price; w.s.owned[key] = true; }
      }
      parts++;
      c.extra[`roomsMeta/${room}/skins/${part}`] = id;
      // the new one may be bigger: keep it inside the room
      const pos = { ...DEFAULT_PIECE_POS[part], ...(meta[part] ?? {}) };
      if (skinOf(part, id)?.wall) {
        // a wall item hangs on a wall: on the back wall facing the room, at the far right end
        const fpw = skinFootprint(part, id, 4);
        c.extra[`roomsMeta/${room}/${part}/x`] = Math.max(2, size.w - fpw.w);
        c.extra[`roomsMeta/${room}/${part}/y`] = 0;
        c.extra[`roomsMeta/${room}/${part}/dir`] = 4;
        continue;
      }
      if (part === "bag") {
        // a floor wardrobe goes against the wall in the nearest place where nothing stands (it used to land on top of the toolbox)
        const taken = new Set<string>();
        const cover = (x: number, y: number, w: number, h: number): void => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) taken.add(`${x + i},${y + j}`); };
        const bedPos = { ...DEFAULT_PIECE_POS.bed, ...(meta.bed ?? {}) };
        const bedFp = skinFootprint("bed", meta.skins?.bed, 2);
        cover(bedPos.x, bedPos.y, bedFp.w, bedFp.h);
        for (const k of ["toolbox", "sink", "boombox"] as const) { if (k === "boombox" && meta.boombox?.gone) continue; const p = { ...DEFAULT_FIXED_POS[k], ...(meta[k] ?? {}) }; cover(p.x, p.y, 1, 1); }
        if (meta.stashbox) cover(Number(meta.stashbox.x) || 0, Number(meta.stashbox.y) || 0, 1, 1);
        const dimsOf = await c.furniMeta();
        for (const f of Object.values<any>(meta.furni ?? {})) {
          const d = SHIPPED_DIMS[f?.kind] ?? dimsOf[f?.kind] ?? { w: 1, h: 1 };
          const swap = f?.dir === 2 || f?.dir === 6;
          cover(Number(f?.x) || 0, Number(f?.y) || 0, swap ? d.h : d.w, swap ? d.w : d.h);
        }
        const spot = nearestWallSpot(size, taken, skinFootprint("bag", id, 4), pos);
        if (spot) {
          c.extra[`roomsMeta/${room}/bag/x`] = spot.x;
          c.extra[`roomsMeta/${room}/bag/y`] = spot.y;
          c.extra[`roomsMeta/${room}/bag/dir`] = spot.dir;
          continue;
        }
      }
      const fp = skinFootprint(part, id, part === "bed" ? 2 : pos.dir);
      const x = Math.max(0, Math.min(pos.x, size.w - fp.w)), y = Math.max(0, Math.min(pos.y, size.h - fp.h));
      if (x !== pos.x || y !== pos.y) { c.extra[`roomsMeta/${room}/${part}/x`] = x; c.extra[`roomsMeta/${room}/${part}/y`] = y; }
    }
    if (parts === 0) fail("Nothing to change.");
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    w.s.blood -= price;
    return { price, parts };
  },
};

/** The landlord's stash box: 20 drops, bought once. It then stands in your room (against a wall, where nothing else is) and keeps your things out of your pockets. */
export const buyStashbox: Action = {
  async run(c) {
    await requireLandlord(c);
    const room = `u_${c.uid}`;
    const meta = await c.db.get<any>(`roomsMeta/${room}`);
    if (!meta?.owner) fail("You haven't got a room yet.");
    const w = await c.user();
    if (w.s.owned[STASHBOX_OWNED_KEY] || meta.stashbox) fail("You already have a stash box.");
    if (w.s.blood < STASHBOX_PRICE) fail(`You need ${STASHBOX_PRICE - w.s.blood} more drops`);
    const size = await roomSize(c, room);
    const taken = new Set<string>();
    const cover = (x: number, y: number, cw: number, ch: number): void => { for (let i = 0; i < cw; i++) for (let j = 0; j < ch; j++) taken.add(`${x + i},${y + j}`); };
    const bedPos = { ...DEFAULT_PIECE_POS.bed, ...(meta.bed ?? {}) };
    const bedFp = skinFootprint("bed", meta.skins?.bed, 2);
    cover(bedPos.x, bedPos.y, bedFp.w, bedFp.h);
    const bagPos = { ...DEFAULT_PIECE_POS.bag, ...(meta.bag ?? {}) };
    const bagFp = skinFootprint("bag", meta.skins?.bag, bagPos.dir ?? 2);
    cover(bagPos.x, bagPos.y, bagFp.w, bagFp.h);
    for (const k of ["toolbox", "sink", "boombox"] as const) { if (k === "boombox" && meta.boombox?.gone) continue; const p = { ...DEFAULT_FIXED_POS[k], ...(meta[k] ?? {}) }; cover(p.x, p.y, 1, 1); }
    const dimsOf = await c.furniMeta();
    for (const f of Object.values<any>(meta.furni ?? {})) {
      const d = SHIPPED_DIMS[f?.kind] ?? dimsOf[f?.kind] ?? { w: 1, h: 1 };
      const swap = f?.dir === 2 || f?.dir === 6;
      cover(Number(f?.x) || 0, Number(f?.y) || 0, swap ? d.h : d.w, swap ? d.w : d.h);
    }
    const spot = nearestWallSpot(size, taken, { w: 1, h: 1 }, { x: 2, y: 0 });
    if (!spot) fail("There's no space in your room for it. Make some room first.");
    w.s.blood -= STASHBOX_PRICE;
    w.s.owned[STASHBOX_OWNED_KEY] = true;
    c.extra[`roomsMeta/${room}/stashbox`] = { x: spot!.x, y: spot!.y, dir: spot!.dir === 2 ? 2 : 4 };
    return { price: STASHBOX_PRICE };
  },
};

/** Selling to 6ixty: weed, ass weed, seeds and what the mixer makes (prices in shared/items.ts sellPrice). */
export const sellWeed: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = Number(a.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot > 27) return fail("Bad slot.");
    const it = w.s.inventory[slot];
    const each = it ? sellPrice(it.item, it.ass, (await c.furniCfg()).prices) : null;
    if (!it || each === null || it.lit || it.inPlayer) return fail("He doesn't buy that.");
    const bundle = SELL_BUNDLE[it.item] ?? 1; // some things only go in bundles (2 cigarette butts for a drop)
    let qty = Math.max(1, Math.min(Math.floor(Number(a.qty) || 1), it.qty));
    qty -= qty % bundle;
    if (qty < bundle) return fail("He wants them in twos.");
    const gain = (qty / bundle) * each;
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, qty);
    w.s.blood += gain;
    return { gain, qty };
  },
};
