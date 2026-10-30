// The CD printer (a hideout's furniture, see shared/cds.ts): pick any song on SoundCloud and a colour and press it onto a CD.
//   cdPress       {room, song, colour}  the owner and the members press for free; anybody else pays the owner's price (it goes to the Tables page); 50 CDs a day each
//   cdPressPrice  {room, price}         the owner sets what visitors pay (10-100)
// A pressed song is counted (songs/<id>/pressed) so that it keeps its audio when it is taken off SoundCloud (see removeSong), and its name is written to cdTitles/<id>.
import { Action, hideoutAccess, int, requireInRoom, text, ID_RE } from "./util";
import { fail } from "../ctx";
import { addToInv } from "../../../src/shared/economy";
import { CDPRESS_KIND, PRESS_COLOURS, PRESS_DAILY_MAX, PRESS_PRICE_DEFAULT, PRESS_PRICE_MAX, PRESS_PRICE_MIN, pressedCdId } from "../../../src/shared/cds";
import { parseSongs, rankedSongs } from "../../../src/shared/songs";

const hideoutRoom = (v: unknown): string => text(v, /^h_[A-Za-z0-9]{1,40}$/, "room");

/** the room has a CD printer in it */
async function hasPrinter(c: { db: { get<T>(p: string): Promise<T | null> } }, room: string): Promise<boolean> {
  const furni = await c.db.get<Record<string, { kind?: string }>>(`roomsMeta/${room}/furni`);
  return Object.values(furni ?? {}).some((f) => f?.kind === CDPRESS_KIND);
}

export const cdPress: Action = {
  locks: (c, a) => [`till:${String(a?.room ?? "").slice(2)}`, "songs"],
  async run(c, a) {
    const room = hideoutRoom(a.room);
    const song = text(a.song, ID_RE, "song");
    const colour = text(a.colour, /^[a-z]$/, "colour");
    if (!PRESS_COLOURS.some((x) => x.id === colour)) fail("That colour isn't there.");
    await requireInRoom(c, room);
    const h = await hideoutAccess(c, room);
    if (!(await hasPrinter(c, room))) fail("There's no CD printer here.");
    const raw = (await c.db.get<Record<string, Record<string, unknown>>>("songs")) ?? {};
    const top = rankedSongs(parseSongs(raw));
    const row = top.find((s) => s.id === song);
    if (!row) fail("That song isn't on SoundCloud any more.");
    const day = Math.floor(c.now / 86_400_000);
    const rec = await c.db.get<{ day?: number; n?: number }>(`cdPress/${c.uid}`);
    const done = rec?.day === day ? Number(rec.n) || 0 : 0;
    if (done >= PRESS_DAILY_MAX) fail(`You have pressed ${PRESS_DAILY_MAX} CDs today. That's the most.`);
    const w = await c.user();
    const owner = room.slice(2);
    const free = h.member; // (the owner and the members; the admin counts as a member)
    let price = 0;
    if (!free) {
      const p = Number(await c.db.get<number>(`roomsMeta/${room}/cdPrice`));
      price = Number.isInteger(p) && p >= PRESS_PRICE_MIN && p <= PRESS_PRICE_MAX ? p : PRESS_PRICE_DEFAULT;
      if (w.s.blood < price) fail(`You need ${price - w.s.blood} more blood.`);
    }
    const next = addToInv(w.s.inventory, { item: pressedCdId(colour, song), qty: 1 });
    if (!next) fail("Your inventory is full.");
    w.s.inventory = next!;
    if (price > 0) {
      w.s.blood -= price;
      const cur = await c.db.get<{ blood?: number; total?: number }>(`hideoutTill/${owner}`);
      c.extra[`hideoutTill/${owner}`] = { blood: (Number(cur?.blood) || 0) + price, total: (Number(cur?.total) || 0) + price };
    }
    c.extra[`cdPress/${c.uid}`] = { day, n: done + 1 };
    c.extra[`songs/${song}/pressed`] = (Number(raw[song]?.pressed) || 0) + 1;
    c.extra[`cdTitles/${song}`] = { title: row!.title, by: row!.ownerName };
    c.note = `pressed ${row!.title}${price ? ` for ${price}` : ""}`;
    return { item: pressedCdId(colour, song), price, left: PRESS_DAILY_MAX - done - 1 };
  },
};

export const cdPressPrice: Action = {
  locks: () => ["cd"],
  async run(c, a) {
    const room = hideoutRoom(a.room);
    const h = await hideoutAccess(c, room);
    if (!h.owner && !c.isAdmin) fail("Only the owner can set the price.");
    const price = int(a.price, PRESS_PRICE_MIN, PRESS_PRICE_MAX, "price");
    c.extra[`roomsMeta/${room}/cdPrice`] = price;
    return { price };
  },
};
