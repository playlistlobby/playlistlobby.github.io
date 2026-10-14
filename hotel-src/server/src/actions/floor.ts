// Putting things on the floor and picking them up. Every pile lives at rooms/<room>/drops/<x>_<y>: the key is the tile, so a tile holds one pile.
import { Action, cheb, int, isPublicRoom, requireInRoom, roomSize, text } from "./util";
import { fail } from "../ctx";
import { NO_DROP } from "../../../src/shared/items";
import { addToInv, BULK_AT, DROP_LIFE_BULK_MS, DROP_LIFE_MS, takeQtyFrom } from "../../../src/shared/economy";

interface DropRow { item: string; qty: number; ass?: boolean; x: number; y: number; by: string; byName?: string; at?: number; exp?: number }
const ROOM_RE = /^[A-Za-z0-9_-]{1,60}$/;

export const drop: Action = {
  locks: (c, a) => [`room:${a?.room}`],
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const stand = await requireInRoom(c, room);
    const size = roomSize(c, room);
    const x = int(a.x, 0, size.w - 1, "spot"), y = int(a.y, 0, size.h - 1, "spot");
    if (stand && cheb(stand, { x, y }) > 3) fail("That's too far away to put it down.");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const it = w.s.inventory[slot];
    if (!it) fail("You aren't carrying that.");
    if (NO_DROP.has(it!.item)) fail("You can't drop that.");
    if (it!.lit) fail("Let it burn out first.");
    if (it!.inPlayer) fail("That's in the player right now.");
    const take = int(a.qty ?? 1, 1, 999, "amount");
    if (take > it!.qty) fail("You haven't got that many.");
    const drops = (await c.db.get<Record<string, DropRow>>(`rooms/${room}/drops`)) ?? {};
    const live = (d: DropRow) => !d.exp || d.exp > c.now;
    const key = `${x}_${y}`;
    if (drops[key] && live(drops[key])) fail("Something is already lying there.");
    const pub = isPublicRoom(room);
    const mine = Object.entries(drops).filter(([k, d]) => k !== key && d.by === c.uid && live(d));
    const bulk = pub && mine.length + 1 >= BULK_AT;
    const exp = pub ? c.now + (bulk ? DROP_LIFE_BULK_MS : DROP_LIFE_MS) : undefined;
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, take);
    c.extra[`rooms/${room}/drops/${key}`] = { item: it!.item, qty: take, ...(it!.ass ? { ass: true } : {}), x, y, by: c.uid, byName: String(w.raw.name ?? "someone").slice(0, 16), at: c.now, ...(exp !== undefined ? { exp } : {}) };
    if (bulk) for (const [k, d] of mine) if ((d.exp ?? Infinity) > c.now + DROP_LIFE_BULK_MS) c.extra[`rooms/${room}/drops/${k}/exp`] = c.now + DROP_LIFE_BULK_MS;
    return {};
  },
};

export const pickup: Action = {
  locks: (c, a) => [`room:${a?.room}`],
  async run(c, a) {
    const room = text(a.room, ROOM_RE, "room");
    const stand = await requireInRoom(c, room);
    const key = text(a.key, /^[0-9]{1,2}_[0-9]{1,2}$/, "spot");
    const path = `rooms/${room}/drops/${key}`;
    const d = await c.db.get<DropRow>(path);
    if (!d) return fail("Somebody else got it first.");
    if (d.exp && d.exp <= c.now) { await c.db.patch({ [path]: null }); return fail("It's gone."); }
    if (stand && cheb(stand, { x: d.x, y: d.y }) > 3) fail("It's too far away.");
    const w = await c.user();
    const next = addToInv(w.s.inventory, { item: d.item, qty: Math.max(1, Number(d.qty) || 1), ...(d.ass ? { ass: true } : {}) });
    if (!next) fail("Your inventory is full.");
    w.s.inventory = next!;
    c.extra[path] = null;
    return { item: d.item, qty: d.qty };
  },
};
