// The BeatShop (src/shared/beats.ts): buying the machine, listing beats, buying a beat, and the chats between the seller and the buyers.
//   buyBeatShop                           the record box sells the machine: 50 blood, one per player
//   beatBegin  {title, price, durMs, size, mime, whole, previewSize?, previewMs?, previewMime?}   describes the beat (and its 30 second preview) for the browser to upload
//   beatFinish {id}                       the pieces are there: the beat is on sale
//   beatRemove {id}                       take a beat off (a beat people have bought keeps its file for them)
//   beatBuy    {owner, id}                the blood goes to the seller, the buyer may read the file
//   beatReplyBegin {owner, beat, buyer?, size, durMs, mime}   describes a rap sent in a chat (the two in the chat can hear it)
//   beatChatSend {owner, beat, buyer?, text?, audioId?}       a message
//   beatChatRead {owner, beat, buyer?}    marks the chat read for you
import { Action, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { addToInv } from "../../../src/shared/economy";
import { audioBegin, audioFinish, audioRemove } from "./audio";
import { AudioMeta } from "../../../src/shared/audio";
import { BEAT_PRICE_MAX, BEAT_PRICE_MIN, BEATS_MAX, BEATSHOP_KIND, BEATSHOP_OWNED_KEY, BEATSHOP_PRICE, CHAT_MSGS_MAX, cleanBeatTitle, cleanChatText, threadKey } from "../../../src/shared/beats";

const UID_RE = /^[A-Za-z0-9]{6,40}$/;
const BEAT_RE = /^[a-z0-9]{3,30}$/;
const rand = (): string => Math.random().toString(36).slice(2, 7);

interface BeatRow { title?: string; price?: number; ready?: boolean; durMs?: number; size?: number; mime?: string; pieces?: number; previewId?: string; previewPieces?: number; whole?: boolean; at?: number; sold?: number }

export const buyBeatShop: Action = {
  async run(c) {
    await requireInRoom(c, "shop");
    const w = await c.user();
    if (w.s.owned[BEATSHOP_OWNED_KEY]) fail("You have a BeatShop already. There's one for each player.");
    if (w.s.blood < BEATSHOP_PRICE) fail(`You need ${BEATSHOP_PRICE - w.s.blood} more drops`);
    const next = addToInv(w.s.inventory, { item: BEATSHOP_KIND, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.blood -= BEATSHOP_PRICE;
    w.s.owned[BEATSHOP_OWNED_KEY] = true;
    return { price: BEATSHOP_PRICE };
  },
};

export const beatBegin: Action = {
  locks: () => ["beats"],
  async run(c, a) {
    const w = await c.user();
    if (!w.s.owned[BEATSHOP_OWNED_KEY]) fail("You need a BeatShop to sell beats.");
    const title = cleanBeatTitle(a.title);
    if (title.length < 1) fail("Give the beat a title.");
    const price = int(a.price, BEAT_PRICE_MIN, BEAT_PRICE_MAX, "price");
    const mine = (await c.db.get<Record<string, BeatRow>>(`beats/${c.uid}`)) ?? {};
    const live = Object.values(mine).filter((r) => r.ready === true || c.now - Number(r.at ?? 0) < 3_600_000);
    if (live.length >= BEATS_MAX) fail(`You can have ${BEATS_MAX} beats on sale. Take one off first.`);
    const whole = a.whole === true;
    const full = await audioBegin(c, { kind: "beat", size: a.size, durMs: a.durMs, mime: a.mime, public: whole, readers: [c.uid], idPrefix: "b" });
    let preview: { id: string; pieces: number } | null = null;
    if (!whole) preview = await audioBegin(c, { kind: "preview", size: a.previewSize, durMs: a.previewMs, mime: a.previewMime ?? "audio/wav", idPrefix: "p" });
    c.extra[`beats/${c.uid}/${full.id}`] = {
      title, price, durMs: Number(a.durMs), size: Number(a.size), mime: String(a.mime).toLowerCase(), pieces: full.pieces, whole, sold: 0, at: c.now, ready: false,
      ...(preview ? { previewId: preview.id, previewPieces: preview.pieces, previewMs: Number(a.previewMs), previewMime: String(a.previewMime ?? "audio/wav").toLowerCase() } : { previewId: full.id, previewPieces: full.pieces, previewMs: Number(a.durMs), previewMime: String(a.mime).toLowerCase() }),
    };
    return { id: full.id, pieces: full.pieces, previewId: preview?.id ?? null, previewPieces: preview?.pieces ?? 0 };
  },
};

export const beatFinish: Action = {
  locks: () => ["beats"],
  async run(c, a) {
    const id = text(a.id, BEAT_RE, "beat");
    const row = await c.db.get<BeatRow>(`beats/${c.uid}/${id}`);
    if (!row) fail("That beat isn't yours.");
    if (row!.ready) fail("That beat is on sale already.");
    await audioFinish(c, id, "beat");
    if (!row!.whole && row!.previewId && row!.previewId !== id) await audioFinish(c, row!.previewId, "preview");
    c.extra[`beats/${c.uid}/${id}/ready`] = true;
    c.extra[`beats/${c.uid}/${id}/at`] = c.now;
    c.note = `beat ${row!.title}`;
    return { id };
  },
};

export const beatRemove: Action = {
  locks: () => ["beats"],
  async run(c, a) {
    const id = text(a.id, BEAT_RE, "beat");
    const owner = c.isMod && typeof a.owner === "string" && UID_RE.test(a.owner) ? a.owner : c.uid;
    const row = await c.db.get<BeatRow>(`beats/${owner}/${id}`);
    if (!row) fail("That beat isn't there.");
    c.extra[`beats/${owner}/${id}`] = null;
    if (row!.previewId && row!.previewId !== id) audioRemove(c, row!.previewId);
    if (!(Number(row!.sold) > 0)) audioRemove(c, id); // (a beat that was bought keeps its file: the buyers can still take it)
    else c.extra[`audioMeta/${id}/public`] = null; // ... but a "whole beat" preview is no longer open to everybody
    c.note = `took off beat ${row!.title}`;
    return { ok: true };
  },
};

export const beatBuy: Action = {
  locks: (c, a) => [`user:${String(a?.owner ?? "")}`],
  async run(c, a) {
    const owner = text(a.owner, UID_RE, "seller");
    const id = text(a.id, BEAT_RE, "beat");
    if (owner === c.uid) fail("That's your own beat.");
    const row = await c.db.get<BeatRow>(`beats/${owner}/${id}`);
    if (!row || row.ready !== true) fail("That beat isn't on sale any more.");
    if (await c.db.get(`beatBuys/${c.uid}/${id}`)) fail("You have that beat already.");
    const price = Number(row!.price);
    const buyer = await c.user();
    if (buyer.s.blood < price) fail(`You need ${price - buyer.s.blood} more blood.`);
    const seller = await c.user(owner);
    buyer.s.blood -= price;
    seller.s.blood += price;
    c.extra[`beatBuys/${c.uid}/${id}`] = { owner, ownerName: String(seller.raw?.name ?? "?").slice(0, 20), title: row!.title, mime: row!.mime, pieces: row!.pieces, durMs: row!.durMs, at: c.now };
    c.extra[`audioMeta/${id}/readers/${c.uid}`] = true;
    c.extra[`beats/${owner}/${id}/sold`] = (Number(row!.sold) || 0) + 1;
    c.note = `bought beat ${row!.title} for ${price}`;
    return { price };
  },
};

// ---- the chats ---------------------------------------------------------------------------------------------------------------------------------
/** who is in the chat: the seller and a buyer who bought the beat */
async function chatPeople(c: Ctx, a: any): Promise<{ owner: string; buyer: string; beat: string; title: string; key: string; ownerName: string; buyerName: string }> {
  const owner = text(a.owner, UID_RE, "seller");
  const beat = text(a.beat, BEAT_RE, "beat");
  const buyer = c.uid === owner ? text(a.buyer, UID_RE, "buyer") : c.uid;
  if (buyer === owner) fail("That chat isn't there.");
  const bought = await c.db.get<{ owner?: string; title?: string }>(`beatBuys/${buyer}/${beat}`);
  if (!bought || bought.owner !== owner) fail("A chat starts when somebody buys the beat.");
  const nameOf = async (uid: string): Promise<string> => String((c.uid === uid ? (await c.user()).raw?.name : await c.db.get(`users/${uid}/name`)) ?? "?").slice(0, 20);
  return { owner, buyer, beat, title: String(bought!.title ?? "?"), key: threadKey(beat, buyer), ownerName: await nameOf(owner), buyerName: await nameOf(buyer) };
}

export const beatReplyBegin: Action = {
  locks: () => ["beats"],
  async run(c, a) {
    const p = await chatPeople(c, a);
    const { id, pieces } = await audioBegin(c, { kind: "reply", size: a.size, durMs: a.durMs, mime: a.mime, readers: [p.owner, p.buyer], idPrefix: "r" });
    return { id, pieces };
  },
};

export const beatChatSend: Action = {
  locks: (c, a) => [`chat:${String(a?.owner ?? "")}`],
  async run(c, a) {
    const p = await chatPeople(c, a);
    const t = cleanChatText(a.text);
    const audioId = a.audioId === undefined || a.audioId === null ? null : text(a.audioId, /^r[a-z0-9]{5,30}$/, "audio");
    if (!t && !audioId) fail("Write something or send a rap.");
    const base = `beatChatMsgs/${p.owner}/${p.key}`;
    const have = await c.db.keys(base);
    if (have.length >= CHAT_MSGS_MAX) fail(`This chat is full (${CHAT_MSGS_MAX} messages).`);
    let audio: { id: string; pieces: number; mime: string; durMs: number } | null = null;
    if (audioId) {
      const meta = await c.db.get<AudioMeta>(`audioMeta/${audioId}`);
      if (!meta || meta.owner !== c.uid || meta.kind !== "reply" || !meta.readers?.[p.owner] || !meta.readers?.[p.buyer]) fail("That recording isn't for this chat.");
      await audioFinish(c, audioId, "reply");
      audio = { id: audioId, pieces: meta!.pieces, mime: meta!.mime, durMs: meta!.durMs };
    }
    const me = c.uid === p.owner ? p.ownerName : p.buyerName;
    const msgId = `m${c.now.toString(36)}${rand()}`;
    c.extra[`${base}/${msgId}`] = { by: c.uid, name: me, ...(t ? { text: t } : {}), ...(audio ? { audio } : {}), at: c.now };
    const fromOwner = c.uid === p.owner;
    c.extra[`beatChats/${p.owner}/${p.key}`] = {
      beat: p.beat, buyer: p.buyer, buyerName: p.buyerName, ownerName: p.ownerName, title: p.title, lastText: t || "Audio reply", lastAudio: !!audio, lastBy: c.uid, lastAt: c.now,
      unreadOwner: !fromOwner, // (what you send is read by you; the other one has something new)
      unreadBuyer: fromOwner,
    };
    return { id: msgId };
  },
};

export const beatChatRead: Action = {
  locks: (c, a) => [`chat:${String(a?.owner ?? "")}`],
  async run(c, a) {
    const p = await chatPeople(c, a);
    const path = `beatChats/${p.owner}/${p.key}`;
    if (!(await c.db.get(path))) return {};
    c.extra[`${path}/${c.uid === p.owner ? "unreadOwner" : "unreadBuyer"}`] = false;
    return {};
  },
};
