// Hideouts (see src/shared/hideout.ts): buying one, the owner's tools (size, colours, name, locking builds, members), invites, the shared box, and the
// computer's orders. Everything about a hideout is written here (the browsers only read roomsMeta/h_<owner>); the furnishing itself is in toolbox.ts.
import { Action, ID_RE, int, requireHideoutMember, requireInRoom, requireWorkRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv, lighterHex, STORAGE_MAX_PIECES, takeQtyFrom } from "../../../src/shared/economy";
import { isFurniItem, NO_DROP } from "../../../src/shared/items";
import { SHIPPED_DIMS } from "../../../src/shared/furniture";
import {
  HIDEOUT_AD_MAX, HIDEOUT_BOOST_MS, HIDEOUT_BOOST_PRICE, HIDEOUT_DESC_MAX, HideoutListing, HIDEOUT_FIXED_POS, HIDEOUT_MAX_MEMBERS, HIDEOUT_NAME_MAX, HIDEOUT_ORDER_MS, HIDEOUT_PRICE, HIDEOUT_RECOLOR_PRICE, HIDEOUT_SHOP, HIDEOUT_SIZES,
  HIDEOUT_THEME, HIDEOUT_UPGRADE_PRICES, hideoutRoomId, levelOfSize, hideoutPriceOf, HIDEOUT_CHEST_MAX_QTY, HIDEOUT_CHEST_SLOTS, memberDefaults, type HideoutPerms, HIDEOUT_MAX_FAVS,
} from "../../../src/shared/hideout";

const UID_RE = /^[A-Za-z0-9]{10,40}$/;
const KEY_RE = /^[a-z0-9_]{1,30}$/;
const hexRe = /^#[0-9a-fA-F]{6}$/;
const hideoutRoom = (a: any): string => text(a?.room, /^h_[A-Za-z0-9]{1,40}$/, "hideout");
const roomLock = (_c: Ctx, a: any): string[] => [`room:${typeof a?.room === "string" ? a.room : typeof a?.owner === "string" ? `h_${a.owner}` : ""}`];
const isPiece = async (c: Ctx, key: string): Promise<boolean> => !!SHIPPED_DIMS[key] || !!(await c.furniMeta())[key];

/** the owner's tools work from the landlord at the hideout door (in the basement) or from the computer inside the hideout */
async function requireLandlordSpot(c: Ctx): Promise<void> {
  if (await c.db.get(`rooms/lobby/players/${c.uid}`)) return;
  if (await c.db.get(`rooms/${hideoutRoomId(c.uid)}/players/${c.uid}`)) return;
  fail("Talk to the landlord at the hideout door, or use the computer in your hideout.");
}
/** the caller's own hideout, as its owner */
async function ownHideout(c: Ctx): Promise<{ room: string; meta: Record<string, any> }> {
  const room = hideoutRoom({ room: hideoutRoomId(c.uid) });
  const meta = await c.db.get<Record<string, any>>(`roomsMeta/${room}`);
  if (!meta?.owner) return fail("You haven't got a hideout yet.");
  return { room, meta: meta! };
}
/** the public list (hideoutList/<owner>): every hideout that is listed, with its line, how many are in it and until when it is boosted. `over` = what is about to change. */
function publishListing(c: Ctx, owner: string, meta: Record<string, any>, over: { name?: string; desc?: string; ad?: string; listed?: boolean; open?: boolean; membersDelta?: number; boostUntil?: number } = {}): void {
  const listed = over.listed ?? meta.listed !== false;
  if (!listed) { c.extra[`hideoutList/${owner}`] = null; return; }
  const members = Object.keys((meta.members ?? {}) as Record<string, unknown>).length + 1 + (over.membersDelta ?? 0);
  const row: HideoutListing = {
    name: String(over.name ?? meta.name ?? "hideout").slice(0, HIDEOUT_NAME_MAX), desc: String(over.desc ?? meta.desc ?? "").slice(0, HIDEOUT_DESC_MAX),
    ownerName: String(meta.ownerName ?? "?").slice(0, 16), members: Math.max(1, members), boostUntil: Number(over.boostUntil ?? meta.boostUntil ?? 0) || 0, open: over.open ?? meta.access === "open", favs: Math.max(0, Number(meta.favs) || 0),
  };
  const ad = String(over.ad ?? meta.ad ?? "").slice(0, HIDEOUT_AD_MAX);
  if (ad) row.ad = ad; // (what the landlord outside calls out while the hideout is boosted)
  c.extra[`hideoutList/${owner}`] = row;
}
const nameOf = async (c: Ctx, uid: string): Promise<string> => String((await c.db.get<string>(`profiles/${uid}/name`)) ?? "?").slice(0, 16);

/** The landlord at the hideout door sells a hideout: 14x14, with a computer, a toolbox, a sink and a boombox. One per player. */
export const hideoutBuy: Action = {
  async run(c) {
    await requireInRoom(c, "lobby");
    const room = hideoutRoomId(c.uid);
    if (await c.db.get(`roomsMeta/${room}/owner`)) fail("You already have a hideout.");
    const w = await c.user();
    if (w.s.blood < HIDEOUT_PRICE) fail(`You need ${HIDEOUT_PRICE - w.s.blood} more drops`);
    w.s.blood -= HIDEOUT_PRICE;
    const name = await nameOf(c, c.uid);
    c.extra[`roomsMeta/${room}`] = {
      owner: c.uid, ownerName: name, name: `${name}'s hideout`.slice(0, HIDEOUT_NAME_MAX), access: "none", w: HIDEOUT_SIZES[0], h: HIDEOUT_SIZES[0], level: 0, lock: false,
      theme: { ...HIDEOUT_THEME }, toolbox: HIDEOUT_FIXED_POS.toolbox, sink: HIDEOUT_FIXED_POS.sink, boombox: HIDEOUT_FIXED_POS.boombox, computer: HIDEOUT_FIXED_POS.computer, chest: HIDEOUT_FIXED_POS.chest,
    };
    c.extra[`hideouts/${c.uid}/${c.uid}`] = { name: `${name}'s hideout`.slice(0, HIDEOUT_NAME_MAX), role: "owner" };
    publishListing(c, c.uid, { name: `${name}'s hideout`, ownerName: name }, {});
    return { room };
  },
};

/** The next size: 17x17 for 2000, then 20x20 for 4000. */
export const hideoutUpgrade: Action = {
  locks: (c) => [`room:${hideoutRoomId(c.uid)}`],
  async run(c) {
    await requireLandlordSpot(c);
    const { room, meta } = await ownHideout(c);
    const level = typeof meta.level === "number" ? meta.level : levelOfSize(Number(meta.w) || 14);
    const price = HIDEOUT_UPGRADE_PRICES[level];
    if (price === undefined) fail("Your hideout is as big as it gets.");
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    w.s.blood -= price;
    c.extra[`roomsMeta/${room}/w`] = HIDEOUT_SIZES[level + 1];
    c.extra[`roomsMeta/${room}/h`] = HIDEOUT_SIZES[level + 1];
    c.extra[`roomsMeta/${room}/level`] = level + 1;
    return { size: HIDEOUT_SIZES[level + 1], price };
  },
};

/** New colours for the floor, walls and carpet: 30 drops for each part that really changes (15 times a player room). */
export const hideoutColors: Action = {
  locks: (c) => [`room:${hideoutRoomId(c.uid)}`],
  async run(c, a) {
    await requireLandlordSpot(c);
    const { room, meta } = await ownHideout(c);
    const pick = (v: unknown, what: string): string | undefined => (v === undefined ? undefined : text(v, hexRe, what).toLowerCase());
    const floor = pick(a.floor, "floor colour"), wall = pick(a.wall, "wall colour");
    const rug = a.rug === "none" ? null : pick(a.rug, "carpet colour");
    const cur = (meta.theme ?? {}) as Record<string, any>;
    const same = (x: unknown, y: string) => String(x ?? "").toLowerCase() === y;
    let parts = 0;
    const put = (k: string, v: unknown) => { c.extra[`roomsMeta/${room}/theme/${k}`] = v; };
    if (floor !== undefined && (!same(cur.floorA ?? HIDEOUT_THEME.floorA, floor) || cur.floorTex)) { parts++; put("floorA", floor); put("floorB", lighterHex(floor)); put("floorTex", null); }
    if (wall !== undefined && (!same(cur.wall ?? HIDEOUT_THEME.wall, wall) || cur.wallTex)) { parts++; put("wall", wall); put("wallTex", null); }
    if (rug === null) { if (cur.rug ?? false) { parts++; put("rug", false); } }
    else if (rug !== undefined && (!(cur.rug ?? false) || !same(cur.rugColor ?? HIDEOUT_THEME.rugColor, rug))) { parts++; put("rug", true); put("rugColor", rug); }
    if (parts === 0) fail("Nothing to change.");
    const price = parts * HIDEOUT_RECOLOR_PRICE;
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    w.s.blood -= price;
    return { price, parts };
  },
};

/** The owner's settings (from the computer): the hideout's name, and locking everybody's building. */
export const hideoutSettings: Action = {
  locks: (c) => [`room:${hideoutRoomId(c.uid)}`],
  async run(c, a) {
    const { room, meta } = await ownHideout(c);
    await requireInRoom(c, room);
    const over: { name?: string; desc?: string; ad?: string; listed?: boolean; open?: boolean } = {};
    if (a.desc !== undefined) {
      const desc = String(a.desc ?? "").replace(/[\n\r]+/g, " ").trim().slice(0, HIDEOUT_DESC_MAX);
      c.extra[`roomsMeta/${room}/desc`] = desc || null;
      over.desc = desc;
    }
    if (a.ad !== undefined) { // the message the landlord calls out while the hideout is boosted
      const ad = String(a.ad ?? "").replace(/\s+/g, " ").trim().slice(0, HIDEOUT_AD_MAX);
      if (/[\u0000-\u001f\u007f]/.test(ad)) fail("Bad message.");
      c.extra[`roomsMeta/${room}/ad`] = ad || null;
      over.ad = ad;
    }
    if (a.open !== undefined) { c.extra[`roomsMeta/${room}/access`] = a.open ? "open" : "none"; over.open = !!a.open; } // (anybody can walk in, or only members and the guests the owner lets in)
    if (a.listed !== undefined) { c.extra[`roomsMeta/${room}/listed`] = a.listed ? null : false; over.listed = !!a.listed; }
    if (a.name !== undefined) {
      const name = text(a.name, /^[^\n\r]{3,28}$/, "name").trim();
      if (name.length < 3) fail("Bad name.");
      over.name = name;
      c.extra[`roomsMeta/${room}/name`] = name;
      c.extra[`hideouts/${c.uid}/${c.uid}/name`] = name;
      for (const uid of Object.keys((await c.db.get<Record<string, unknown>>(`roomsMeta/${room}/members`)) ?? {})) c.extra[`hideouts/${uid}/${c.uid}/name`] = name;
    }
    if (a.lock !== undefined) c.extra[`roomsMeta/${room}/lock`] = !!a.lock;
    publishListing(c, c.uid, meta, over);
    return {};
  },
};

/** The owner pays 50 drops to be shown first on the list at the hideout door for an hour (boosts add up). */
export const hideoutBoost: Action = {
  locks: (c) => [`room:${hideoutRoomId(c.uid)}`],
  async run(c) {
    const { room, meta } = await ownHideout(c);
    await requireInRoom(c, room);
    if (meta.listed === false) fail("Put the hideout on the list first.");
    const w = await c.user();
    if (w.s.blood < HIDEOUT_BOOST_PRICE) fail(`You need ${HIDEOUT_BOOST_PRICE - w.s.blood} more drops`);
    w.s.blood -= HIDEOUT_BOOST_PRICE;
    const boostUntil = Math.min(Math.max(c.now, Number(meta.boostUntil) || 0) + HIDEOUT_BOOST_MS, c.now + 24 * HIDEOUT_BOOST_MS);
    c.extra[`roomsMeta/${room}/boostUntil`] = boostUntil;
    publishListing(c, c.uid, meta, { boostUntil });
    return { boostUntil, price: HIDEOUT_BOOST_PRICE };
  },
};

/** What a player who leaves or is kicked takes with them: every piece they put down and everything of theirs in the box goes to their own storage. */
async function removeMember(c: Ctx, room: string, uid: string): Promise<{ pieces: number }> {
  const w = await c.user(uid);
  let pieces = 0;
  const give = (kind: string, n: number) => { w.s.storage[kind] = (w.s.storage[kind] ?? 0) + n; pieces += n; };
  const rows = (await c.db.get<Record<string, { kind?: string; by?: string }>>(`roomsMeta/${room}/furni`)) ?? {};
  for (const [id, row] of Object.entries(rows)) if (row?.by === uid && row.kind) { give(row.kind, 1); c.extra[`roomsMeta/${room}/furni/${id}`] = null; }
  const box = (await c.db.get<Record<string, number>>(`roomsMeta/${room}/box/${uid}`)) ?? {};
  for (const [kind, n] of Object.entries(box)) if (n > 0) give(kind, n);
  c.extra[`roomsMeta/${room}/box/${uid}`] = null;
  c.extra[`roomsMeta/${room}/members/${uid}`] = null;
  c.extra[`hideouts/${uid}/${room.slice(2)}`] = null;
  c.extra[`rooms/${room}/players/${uid}`] = null; // (their browser sees it is not a member any more and goes back to the basement)
  const meta = await c.db.get<Record<string, any>>(`roomsMeta/${room}`);
  if (meta?.owner) publishListing(c, room.slice(2), meta, { membersDelta: -1 });
  return { pieces };
}

export const hideoutKick: Action = {
  locks: (c, a) => [`room:${hideoutRoomId(c.uid)}`, `user:${String(a?.uid ?? "")}`],
  async run(c, a) {
    const { room } = await ownHideout(c);
    const uid = text(a.uid, UID_RE, "player");
    if (uid === c.uid) fail("You can't kick yourself.");
    if (!(await c.db.get(`roomsMeta/${room}/members/${uid}`))) fail("They aren't in your hideout.");
    c.note = `kicked ${uid}`;
    return removeMember(c, room, uid);
  },
};

export const hideoutLeave: Action = {
  locks: (c, a) => [`room:h_${String(a?.owner ?? "")}`],
  async run(c, a) {
    const owner = text(a.owner, UID_RE, "hideout");
    const room = hideoutRoomId(owner);
    if (owner === c.uid) fail("It's your hideout: you can't leave it.");
    if (!(await c.db.get(`roomsMeta/${room}/members/${c.uid}`))) fail("You aren't in that hideout.");
    return removeMember(c, room, c.uid);
  },
};

/** Whether a member may place, move and take back furniture (the owner decides, member by member). */
export const hideoutMember: Action = {
  locks: (c) => [`room:${hideoutRoomId(c.uid)}`],
  async run(c, a) {
    const { room } = await ownHideout(c);
    const uid = text(a.uid, UID_RE, "player");
    if (!(await c.db.get(`roomsMeta/${room}/members/${uid}`))) fail("They aren't in your hideout.");
    let any = false;
    for (const k of ["build", "grow", "stash"] as const) if (typeof a[k] === "boolean") { c.extra[`roomsMeta/${room}/members/${uid}/${k}`] = a[k]; any = true; }
    if (!any) fail("Nothing to change.");
    return {};
  },
};

/** Find players by a part of their name (the ones that start with it first). */
export const hideoutSearch: Action = {
  async run(c, a) {
    const q = text(String(a.q ?? "").trim().toLowerCase(), /^[a-z0-9_.-]{2,20}$/, "name");
    const all = (await c.db.get<Record<string, string>>("usernames")) ?? {};
    const hits = Object.entries(all).filter(([n, uid]) => n.includes(q) && uid !== c.uid).sort((x, y) => Number(y[0].startsWith(q)) - Number(x[0].startsWith(q)) || x[0].length - y[0].length || x[0].localeCompare(y[0])).slice(0, 8); // (the start of a name first, then names with it in the middle: "mem" finds hbmem)
    const out: Array<{ uid: string; name: string }> = [];
    for (const [n, uid] of hits) out.push({ uid, name: (await c.db.get<string>(`profiles/${uid}/name`)) ?? n });
    return { players: out };
  },
};

/** The owner asks somebody to join (by name, or by uid from the profile window). */
export const hideoutInvite: Action = {
  locks: (c) => [`room:${hideoutRoomId(c.uid)}`],
  async run(c, a) {
    const { room, meta } = await ownHideout(c);
    let uid: string | null;
    if (a.uid !== undefined) uid = text(a.uid, UID_RE, "player");
    else uid = (await c.db.get<string>(`usernames/${text(String(a.name ?? "").trim().toLowerCase(), /^[a-z0-9_.-]{1,40}$/, "name")}`)) ?? null;
    if (!uid) fail("There's nobody with that name.");
    if (uid === c.uid) fail("That's you.");
    if (!(await c.db.get(`profiles/${uid}/name`))) fail("There's nobody with that name.");
    const members = (meta.members ?? {}) as Record<string, unknown>;
    if (members[uid!]) fail("They are already in your hideout.");
    if (Object.keys(members).length >= HIDEOUT_MAX_MEMBERS) fail(`A hideout holds ${HIDEOUT_MAX_MEMBERS} members at most.`);
    c.extra[`hideoutInvites/${uid}/${c.uid}`] = { fromName: await nameOf(c, c.uid), roomName: String(meta.name ?? "hideout").slice(0, HIDEOUT_NAME_MAX), at: c.now };
    return { name: await nameOf(c, uid!) };
  },
};

/** Answering an invite: joining puts you on the member list (with building allowed until the owner says otherwise). */
export const hideoutAnswer: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const owner = text(a.owner, UID_RE, "hideout");
    const inv = await c.db.get<{ roomName?: string }>(`hideoutInvites/${c.uid}/${owner}`);
    if (!inv) fail("That invite is gone.");
    c.extra[`hideoutInvites/${c.uid}/${owner}`] = null;
    if (!a.accept) return { joined: false };
    const room = hideoutRoomId(owner);
    const meta = await c.db.get<{ owner?: string; name?: string; members?: Record<string, unknown> }>(`roomsMeta/${room}`);
    if (!meta?.owner) fail("That hideout doesn't exist any more.");
    if (Object.keys(meta!.members ?? {}).length >= HIDEOUT_MAX_MEMBERS) fail("That hideout is full.");
    const start = memberDefaults(meta!.members as Record<string, HideoutPerms> | undefined); // (what the owner has turned off for some stays off for a new one)
    c.extra[`roomsMeta/${room}/members/${c.uid}`] = { name: await nameOf(c, c.uid), build: start.build, grow: start.grow, stash: start.stash, at: c.now };
    c.extra[`hideouts/${c.uid}/${owner}`] = { name: String(meta!.name ?? inv!.roomName ?? "hideout").slice(0, HIDEOUT_NAME_MAX), role: "member" };
    publishListing(c, owner, meta as Record<string, any>, { membersDelta: 1 });
    return { joined: true, room };
  },
};

/** Moves furniture into the shared box from your own storage or pocket. It stays yours: only you can take it out again (anybody who builds can place it). */
export const hideoutBoxStore: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const room = hideoutRoom(a);
    await requireHideoutMember(c, room);
    const kind = text(a.kind, KEY_RE, "piece");
    if (kind === "f_boombox") fail("The boombox can't go in the box.");
    if (!(await isPiece(c, kind))) fail("Only furniture goes in the box.");
    const qty = int(a.qty ?? 1, 1, 99, "amount");
    const w = await c.user();
    if (a.source === "inv") {
      const slot = int(a.slot, 0, 27, "slot");
      const it = w.s.inventory[slot];
      if (!it || it.item !== kind || it.inPlayer || it.lit) fail("You aren't carrying that.");
      if (qty > it!.qty) fail("You haven't got that many.");
      w.s.inventory = takeQtyFrom(w.s.inventory, slot, qty);
    } else {
      const have = w.s.storage[kind] ?? 0;
      if (have < qty) fail("There's not enough of that in storage.");
      if (have > qty) w.s.storage[kind] = have - qty; else delete w.s.storage[kind];
    }
    const inBox = (await c.db.get<number>(`roomsMeta/${room}/box/${c.uid}/${kind}`)) ?? 0;
    if (inBox + qty > STORAGE_MAX_PIECES) fail("The box is full of those.");
    c.extra[`roomsMeta/${room}/box/${c.uid}/${kind}`] = inBox + qty;
    return {};
  },
};

/** Takes your own pieces out of the box into your storage (or your pocket). Nobody else can. */
export const hideoutBoxTake: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const room = hideoutRoom(a);
    await requireHideoutMember(c, room);
    const kind = text(a.kind, KEY_RE, "piece");
    const inBox = (await c.db.get<number>(`roomsMeta/${room}/box/${c.uid}/${kind}`)) ?? 0;
    if (inBox < 1) fail("You have none of that in the box.");
    const qty = Math.min(int(a.qty ?? 1, 1, 99, "amount"), inBox);
    const w = await c.user();
    if (a.to === "inv") {
      let inv = w.s.inventory;
      for (let i = 0; i < qty; i++) { const next = addToInv(inv, { item: kind, qty: 1 }); if (!next) fail("Your inventory is full."); inv = next!; }
      w.s.inventory = inv;
    } else {
      const have = w.s.storage[kind] ?? 0;
      if (have + qty > STORAGE_MAX_PIECES) fail("Storage is full of those.");
      w.s.storage[kind] = have + qty;
    }
    c.extra[`roomsMeta/${room}/box/${c.uid}/${kind}`] = inBox > qty ? inBox - qty : null;
    return { qty };
  },
};

/** The computer's shop: pay now, the piece arrives in an hour (collect it at the computer). */
export const hideoutOrder: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const room = hideoutRoom(a);
    await requireHideoutMember(c, room);
    await requireInRoom(c, room);
    const item = HIDEOUT_SHOP.find((i) => i.kind === a.kind);
    if (!item) fail("That isn't for sale.");
    const orders = (await c.db.get<Record<string, { by?: string }>>(`roomsMeta/${room}/orders`)) ?? {};
    if (Object.values(orders).filter((o) => o?.by === c.uid).length >= 50) fail("You already have 50 orders on the way.");
    const bought = Number(await c.db.get<number>(`roomsMeta/${room}/bought/${item!.kind}`)) || 0; // (how many of these this hideout has ordered: the price can go up after the first few)
    const price = hideoutPriceOf(item!, bought);
    const w = await c.user();
    if (w.s.blood < price) fail(`You need ${price - w.s.blood} more drops`);
    w.s.blood -= price;
    const id = `o${c.now.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    c.extra[`roomsMeta/${room}/orders/${id}`] = { kind: item!.kind, by: c.uid, doneAt: c.now + item!.etaMs };
    c.extra[`roomsMeta/${room}/bought/${item!.kind}`] = bought + 1;
    c.note = item!.kind;
    return { id, doneAt: c.now + item!.etaMs, price };
  },
};
export const hideoutCollect: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const room = hideoutRoom(a);
    await requireHideoutMember(c, room);
    await requireInRoom(c, room);
    const id = text(a.id, ID_RE, "order");
    const o = await c.db.get<{ kind?: string; by?: string; doneAt?: number }>(`roomsMeta/${room}/orders/${id}`);
    if (!o || o.by !== c.uid) fail("That isn't your order.");
    if (c.now < Number(o!.doneAt)) fail("It hasn't arrived yet.");
    const w = await c.user();
    const next = addToInv(w.s.inventory, { item: String(o!.kind), qty: 1 });
    if (!next) fail("Your inventory is full.");
    w.s.inventory = next!;
    c.extra[`roomsMeta/${room}/orders/${id}`] = null;
    return { kind: o!.kind };
  },
};

// ---- the shared stash: a chest in every hideout. Every member puts things in and takes things out (a gang's chest: it is on trust). hideoutChests/<owner>/<key> = { item, qty, ass? }
const chestKey = (item: string, ass?: boolean): string => `${item}${ass ? "_ass" : ""}`;
export const hideoutChestPut: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const room = hideoutRoom(a);
    const who = await requireHideoutMember(c, room);
    if (!who.canStash) fail("The owner has turned off the shared stash for you.");
    await requireInRoom(c, room);
    const owner = room.slice(2);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it || it.lit || it.inPlayer) fail("You can't put that in the stash.");
    if (isFurniItem(it!.item)) fail("Furniture goes in the box (the toolbox), not the stash.");
    if (NO_DROP.has(it!.item)) fail("That one stays with you.");
    const qty = Math.max(1, Math.min(int(a.qty ?? 1, 1, 999, "amount"), it!.qty));
    const key = chestKey(it!.item, it!.ass);
    const path = `hideoutChests/${owner}/${key}`;
    const cur = await c.db.get<{ qty?: number }>(path);
    if (!cur) {
      const all = (await c.db.get<Record<string, unknown>>(`hideoutChests/${owner}`)) ?? {};
      if (Object.keys(all).length >= HIDEOUT_CHEST_SLOTS) fail("The stash is full: take something out first.");
    }
    const have = Number(cur?.qty) || 0;
    if (have + qty > HIDEOUT_CHEST_MAX_QTY) fail("There is too much of that in there already.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, qty);
    c.extra[path] = { item: it!.item, qty: have + qty, ...(it!.ass ? { ass: true } : {}) };
    c.note = `${qty} ${it!.item}`;
    return {};
  },
};
export const hideoutChestTake: Action = {
  locks: (c, a) => roomLock(c, a),
  async run(c, a) {
    const room = hideoutRoom(a);
    const who = await requireHideoutMember(c, room);
    if (!who.canStash) fail("The owner has turned off the shared stash for you.");
    await requireInRoom(c, room);
    const owner = room.slice(2);
    const key = text(a.key, /^[a-z0-9_]{1,60}$/, "thing");
    const path = `hideoutChests/${owner}/${key}`;
    const cur = await c.db.get<{ item?: string; qty?: number; ass?: boolean }>(path);
    if (!cur?.item || !(Number(cur.qty) > 0)) fail("There's none of that in the stash.");
    const qty = Math.max(1, Math.min(int(a.qty ?? 1, 1, 999, "amount"), Number(cur!.qty)));
    const w = await c.user();
    const next = addToInv(w.s.inventory, { item: cur!.item!, qty, ...(cur!.ass ? { ass: true } : {}) });
    if (!next) fail("Your pockets are full.");
    w.s.inventory = next!;
    const left = Number(cur!.qty) - qty;
    c.extra[path] = left > 0 ? { item: cur!.item, qty: left, ...(cur!.ass ? { ass: true } : {}) } : null;
    c.note = `${qty} ${cur!.item}`;
    return { item: cur!.item, qty };
  },
};

/** Puts an automatic waterer on a growing kit, or an upgrade chip in a mixer (your own room or a hideout you are in). The item is used up. */
export const attachUpgrade: Action = {
  locks: (c, a) => [`room:${typeof a?.room === "string" ? a.room : `u_${c.uid}`}`],
  async run(c, a) {
    const room = await requireWorkRoom(c, a.room);
    const id = text(a.fid, ID_RE, "piece");
    const path = `roomsMeta/${room}/furni/${id}`;
    const row = await c.db.get<{ kind?: string; auto?: boolean; up?: boolean | number }>(path);
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const item = w.s.inventory[slot]?.item;
    if (item === "waterer") {
      if (row?.kind !== "f_planter") fail("An automatic waterer goes on a growing kit.");
      if (row!.auto) fail("There's a waterer on it already.");
      c.extra[`${path}/auto`] = true;
    } else if (item === "mixerchip" || item === "mixerchip2") {
      if (row?.kind !== "f_mixer") fail("The chip goes in a mixer.");
      const level = item === "mixerchip2" ? 2 : 1;
      const have = row!.up === 2 ? 2 : row!.up ? 1 : 0;
      if (have >= level) fail(have === 2 ? "That mixer has the MK2 already." : "That mixer has an upgrade already.");
      c.extra[`${path}/up`] = level; // (the MK2 goes over the first upgrade: that one is lost)
    } else fail("That doesn't go on anything.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1);
    c.note = String(item);
    return {};
  },
};


/** Make a hideout a favourite (or not): you find it again at the top of the list, and the more players favourite it the higher it sits. */
export const hideoutFavorite: Action = {
  locks: (c, a) => [`hfav:${String(a?.owner ?? "")}`, `user:${c.uid}`],
  async run(c, a) {
    const owner = text(a.owner, UID_RE, "hideout");
    if (owner === c.uid) fail("It's your own hideout.");
    const room = hideoutRoomId(owner);
    const meta = await c.db.get<Record<string, any>>(`roomsMeta/${room}`);
    if (!meta?.owner) fail("That hideout doesn't exist.");
    const mine = (await c.db.get<Record<string, boolean>>(`hideoutFavs/${c.uid}`)) ?? {};
    const has = !!mine[owner];
    const want = a.on === undefined ? !has : !!a.on;
    if (want === has) return { on: has, favs: Number(meta!.favs) || 0 };
    if (want && Object.keys(mine).length >= HIDEOUT_MAX_FAVS) fail(`You can have ${HIDEOUT_MAX_FAVS} favourites at most.`);
    const favs = Math.max(0, (Number(meta!.favs) || 0) + (want ? 1 : -1));
    c.extra[`hideoutFavs/${c.uid}/${owner}`] = want ? true : null;
    c.extra[`roomsMeta/${room}/favs`] = favs || null;
    if (await c.db.get(`hideoutList/${owner}`)) c.extra[`hideoutList/${owner}/favs`] = favs;
    return { on: want, favs };
  },
};
