// The streets (src/shared/streets.ts): the elevator and its tickets, the bins, the customers, and the knife fights.
//   ticketBuy                  buy the elevator ticket in the basement (150 blood, 50 a day, one per player)
//   elevatorUp                 ride up: the ticket is used up, and the elevator is yours until it stops running (the hour 20-21, or the admin's test switch)
//   elevatorDown               ride back down (not while you are in a fight)
//   streetBin    {can}         search one of the blue bins on the street: more than a basement bin gives, and it can be searched again sooner
//   streetFill   {k}           give a customer what it asked for (k = the customer's number, see customerAt)
//   streetEnter                you walk onto the street: your hit points are looked up and you are untouchable for a few seconds
//   streetHit    {target}      a swing of your knife at somebody standing next to you (RuneScape's rules for a risk fight)
//   streetHeal   {slot}        use a bandage: +3 hit points, once every 6 seconds
//   streetsTest  {minutes}     the admin's switch: the elevator runs for that many minutes from now whatever the clock says (0 turns it off)
import { Action, cheb, ID_RE, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { isEmulator } from "../env";
import { addToInv, DUMPSTER_DROPS, takeQtyFrom } from "../../../src/shared/economy";
import { findSlot, sellPrice } from "../../../src/shared/items";
import {
  ARRIVAL_ID, customerAt, customersAt, danishDayKey, elevatorRuns, fmtWhen, holdsTicket, hpNow, orderPay, PVP, STREET_PIECES, STREETS_ID, STREETS_OPEN, StreetCombat, TICKET_ITEM, TICKET_PRICE, TICKET_STOCK,
} from "../../../src/shared/streets";

/** the streets are only for the admin and the emulator until STREETS_OPEN is true */
const openFor = (c: Ctx): boolean => STREETS_OPEN || isEmulator(c.env) || c.isAdmin;
const forceUntil = async (c: Ctx): Promise<number> => Number(await c.db.get<number>("config/streetsForce")) || 0;

export const ticketBuy: Action = {
  locks: () => ["tickets"],
  async run(c) {
    if (!openFor(c)) fail("The elevator is out of order.");
    await requireInRoom(c, "lobby");
    const w = await c.user();
    if (holdsTicket(w.s.inventory)) fail("You have a ticket already. There is one for each player.");
    const day = danishDayKey(c.now);
    const sold = Number(await c.db.get<number>(`streetTickets/${day}/sold`)) || 0;
    if (sold >= TICKET_STOCK) fail("The tickets are sold out for today. There are new ones tomorrow.");
    if (w.s.blood < TICKET_PRICE) fail(`You need ${TICKET_PRICE - w.s.blood} more blood.`);
    const next = addToInv(w.s.inventory, { item: TICKET_ITEM, qty: 1 });
    if (!next) fail("Your inventory is full.");
    w.s.inventory = next!;
    w.s.blood -= TICKET_PRICE;
    c.extra[`streetTickets/${day}/sold`] = sold + 1;
    return { price: TICKET_PRICE, left: TICKET_STOCK - sold - 1 };
  },
};

export const elevatorUp: Action = {
  locks: () => [],
  async run(c) {
    if (!openFor(c)) fail("The elevator is out of order.");
    await requireInRoom(c, "lobby");
    const run = elevatorRuns(c.now, await forceUntil(c));
    if (!run.open) fail(`The elevator runs from 20 to 21. It starts again in ${fmtWhen(run.nextAt - c.now)}.`);
    const pass = Number(await c.db.get<number>(`streetPass/${c.uid}`)) || 0;
    if (pass > c.now) return { endsAt: pass, used: false }; // (you rode already in this hour: no second ticket)
    const w = await c.user();
    if (!c.isAdmin) {
      const slot = findSlot(w.s.inventory, TICKET_ITEM);
      if (slot < 0) fail("You need a ticket for the elevator.");
      w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1);
    }
    c.extra[`streetPass/${c.uid}`] = run.endsAt;
    c.note = "rode the elevator";
    return { endsAt: run.endsAt, used: !c.isAdmin };
  },
};

export const elevatorDown: Action = {
  async run(c) {
    const room = (await c.db.get(`rooms/${ARRIVAL_ID}/players/${c.uid}`)) ? ARRIVAL_ID : STREETS_ID;
    await requireInRoom(c, room);
    const cb = await c.db.get<Partial<StreetCombat>>(`streetCombat/${c.uid}`);
    if (cb && Number(cb.combatUntil) > c.now) fail("You are in a fight. You can't leave now.");
    return { ok: true };
  },
};

// ---- the bins ---------------------------------------------------------------------------------------------------------
/** a street bin gives two things (and sometimes a third), and can be searched again after 5 minutes */
const BIN_MS = 300_000;
/** the plain can: this much of the time what it gives is a bandage */
const CAN_BANDAGE = 0.1;
export const streetBin: Action = {
  async run(c, a) {
    const can = text(a.can, /^[A-Za-z0-9_-]{1,30}$/, "can");
    await requireInRoom(c, STREETS_ID);
    const piece = STREET_PIECES.find(([id, kind]) => id === can && (kind === "st_bin" || kind === "st_can"));
    if (!piece) fail("That isn't a bin.");
    const plain = piece![1] === "st_can"; // the plain can: always 1 thing, the lean does nothing to it, and it has a better chance of a bandage
    const w = await c.user();
    const key = `st_${can}`;
    const last = w.s.dumpsters[key] ?? 0;
    const reload = !plain && c.now < w.s.leanUntil ? BIN_MS / 2 : BIN_MS;
    if (c.now - last < reload) fail(`That bin was searched a moment ago. Try again in ${Math.max(1, Math.ceil((reload - (c.now - last)) / 60000))}m.`);
    const total = DUMPSTER_DROPS.reduce((n, d) => n + d.chance, 0);
    const pick = (): string => { let r = Math.random() * total; for (const d of DUMPSTER_DROPS) { if (r < d.chance) return d.item; r -= d.chance; } return DUMPSTER_DROPS[0].item; };
    const others = DUMPSTER_DROPS.filter((d) => d.item !== PVP.healItem);
    const pickPlain = (): string => { if (Math.random() < CAN_BANDAGE) return PVP.healItem; const t = others.reduce((n, d) => n + d.chance, 0); let r = Math.random() * t; for (const d of others) { if (r < d.chance) return d.item; r -= d.chance; } return others[0].item; };
    const picks = plain ? 1 : 2 + (Math.random() < 0.3 ? 1 : 0) + (c.now < w.s.leanUntil ? 2 : 0);
    const items: string[] = [];
    for (let i = 0; i < picks; i++) {
      const item = plain ? pickPlain() : pick();
      const next = addToInv(w.s.inventory, { item, qty: 1 });
      if (!next) { if (!items.length) fail("Your inventory is full"); break; }
      w.s.inventory = next;
      items.push(item);
    }
    w.s.dumpsters[key] = c.now;
    return { item: items[0], items };
  },
};

// ---- the customers ------------------------------------------------------------------------------------------------------
export const streetFill: Action = {
  locks: () => ["streetfill"],
  async run(c, a) {
    const k = int(a.k, 0, 2_000_000_000, "customer");
    await requireInRoom(c, STREETS_ID);
    const cu = customersAt(c.now).find((x) => x.k === k) ?? (customerAt(k).until > c.now && customerAt(k).at <= c.now ? customerAt(k) : null);
    if (!cu) fail("They've gone.");
    if (await c.db.get(`streetFilled/${k}`)) fail("Somebody else got there first.");
    const w = await c.user();
    let need = cu!.want.qty;
    let inv = w.s.inventory;
    // the order is filled from what you hold (not lit, not loaned out, not ass weed)
    for (let i = 0; i < inv.length && need > 0; i++) {
      const s = inv[i];
      if (!s || s.item !== cu!.want.item || s.lit || s.inPlayer || s.ass) continue;
      const take = Math.min(need, s.qty);
      inv = takeQtyFrom(inv, i, take);
      need -= take;
    }
    if (need > 0) fail("You haven't got enough of that.");
    w.s.inventory = inv;
    const unit = sellPrice(cu!.want.item, false, {}) ?? 5;
    const pay = orderPay(unit, cu!.want);
    w.s.blood += pay;
    c.extra[`streetFilled/${k}`] = { by: c.uid, at: c.now };
    c.note = `street order ${cu!.want.qty} ${cu!.want.item} for ${pay}`;
    return { pay, item: cu!.want.item, qty: cu!.want.qty };
  },
};

// ---- the fights ---------------------------------------------------------------------------------------------------------
const fresh = (c: Ctx): StreetCombat => ({ hp: PVP.maxHp, at: c.now, combatUntil: 0, skullUntil: 0, healAt: 0, protectUntil: c.now + PVP.spawnProtectMs, kills: 0, deaths: 0 });
async function combatOf(c: Ctx, uid: string): Promise<StreetCombat> {
  const raw = await c.db.get<Partial<StreetCombat>>(`streetCombat/${uid}`);
  const base = fresh(c);
  if (!raw) return { ...base, protectUntil: 0 };
  return { ...base, ...raw, protectUntil: Number(raw.protectUntil) || 0 };
}

export const streetEnter: Action = {
  async run(c) {
    await requireInRoom(c, STREETS_ID);
    const cb = await combatOf(c, c.uid);
    const hp = hpNow(cb, c.now);
    const next: StreetCombat = { ...cb, hp, at: c.now, protectUntil: c.now + PVP.spawnProtectMs };
    c.extra[`streetCombat/${c.uid}`] = next;
    return { hp, max: PVP.maxHp };
  },
};

export const streetHit: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`],
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't fight yourself.");
    const me = await requireInRoom(c, STREETS_ID);
    const theirs = await c.db.get<{ x?: number; y?: number; sleeper?: boolean }>(`rooms/${STREETS_ID}/players/${target}`);
    if (!theirs) fail("They've left the street.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > PVP.reach + 1) fail("They're too far away."); // (one tile, and a step of slack for the lag)
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't fight someone who plays on your device.");
    const w = await c.user();
    if (findSlot(w.s.inventory, "knife") < 0 && findSlot(w.s.inventory, "machete") < 0) fail("You need a knife for that.");
    const mine = await combatOf(c, c.uid);
    const their = await combatOf(c, target);
    if (Number(mine.protectUntil) > c.now) mine.protectUntil = 0; // (your own protection ends when you swing)
    if (their.protectUntil > c.now) fail("They just arrived. Give them a moment.");
    const last = Number(await c.db.get<number>(`streetSwing/${c.uid}`)) || 0;
    if (c.now - last < PVP.swingMs) fail("Your arm is still swinging.");
    c.extra[`streetSwing/${c.uid}`] = c.now;
    // the one who starts a fight is skulled: a mark the risk rules will use later (a fight is "started" when the other one has not hit you in the last 10 seconds)
    const theyHitMe = Number((await c.db.get<number>(`streetLastHit/${target}/${c.uid}`)) ?? 0) > c.now - PVP.combatMs;
    if (!theyHitMe) mine.skullUntil = c.now + PVP.skullMs;
    const hpT = hpNow(their, c.now);
    const landed = Math.random() < PVP.hitChance;
    const dmg = landed ? 1 + Math.floor(Math.random() * PVP.maxHit) : 0; // (a swing that misses is a splash: 0)
    const left = Math.max(0, hpT - dmg);
    mine.combatUntil = c.now + PVP.combatMs;
    their.combatUntil = c.now + PVP.combatMs;
    c.extra[`streetLastHit/${c.uid}/${target}`] = c.now;
    let died = false;
    if (left <= 0) {
      died = true;
      mine.kills += 1;
      c.extra[`streetCombat/${target}`] = { ...their, hp: PVP.maxHp, at: c.now, combatUntil: 0, skullUntil: 0, protectUntil: c.now + 30_000, deaths: their.deaths + 1, deadAt: c.now, deadBy: c.uid };
      mine.combatUntil = 0;
      // everything they carry is gone (the pocket is wiped; blood and what they wear stay)
      const v = await c.user(target);
      v.s.inventory = v.s.inventory.map(() => null);
      // somebody who closed the game in the fight is not standing there any more once they are dead
      const pr = await c.db.get<{ room?: string } | null>(`presence/${target}`);
      if (!pr || pr.room !== STREETS_ID) c.extra[`rooms/${STREETS_ID}/players/${target}`] = null;
    } else c.extra[`streetCombat/${target}`] = { ...their, hp: left, at: c.now };
    c.extra[`streetCombat/${c.uid}`] = { ...mine, hp: hpNow(mine, c.now), at: c.now };
    // what everybody in the room sees: a number over the head (and the dead one is sent home by their own browser)
    c.extra[`rooms/${STREETS_ID}/hits/${c.uid}`] = { to: target, dmg, at: c.now, ...(died ? { dead: true } : {}) };
    c.note = `${dmg ? `hit ${dmg}` : "missed"}${died ? " (killed)" : ""}`;
    return { dmg, left, died };
  },
};

export const streetHeal: Action = {
  async run(c, a) {
    await requireInRoom(c, STREETS_ID);
    const slot = int(a.slot, 0, 27, "slot");
    const w = await c.user();
    const it = w.s.inventory[slot];
    if (!it || it.item !== PVP.healItem) fail("That isn't a bandage.");
    const cb = await combatOf(c, c.uid);
    if (c.now - cb.healAt < PVP.healCooldownMs) fail("You can't use another bandage yet.");
    const hp = hpNow(cb, c.now);
    if (hp >= PVP.maxHp) fail("You aren't hurt.");
    const now = Math.min(PVP.maxHp, hp + PVP.healHp);
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1);
    c.extra[`streetCombat/${c.uid}`] = { ...cb, hp: now, at: c.now, healAt: c.now };
    return { hp: now, healed: now - hp };
  },
};

export const streetsTest: Action = {
  async run(c, a) {
    if (!c.isAdmin) fail("Only the admin can do that.");
    const minutes = int(a.minutes, 0, 600, "minutes");
    c.extra["config/streetsForce"] = minutes > 0 ? c.now + minutes * 60_000 : null;
    return { until: minutes > 0 ? c.now + minutes * 60_000 : 0 };
  },
};
