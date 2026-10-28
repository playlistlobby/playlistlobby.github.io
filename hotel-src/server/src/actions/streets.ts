// The streets (src/shared/streets.ts): the elevator and its tickets, the bins, the customers, and the knife fights.
//   ticketBuy                  buy the elevator ticket in the basement (150 blood, 50 a day, one per player)
//   elevatorUp                 ride up: the ticket is used up, and the elevator is yours until it stops running (the hour 20-21, or the admin's test switch)
//   elevatorDown               ride back down (not while you are in a fight)
//   streetBin    {can}         search one of the blue bins on the street: more than a basement bin gives, and it can be searched again sooner
//   streetFill   {k}           give a customer what it asked for (k = the customer's number, see customerAt)
//   streetEnter                you walk onto the street: your hit points are looked up and you are untouchable for a few seconds
//   streetHit    {target}      a swing of your knife (or machete) at somebody standing next to you: RuneScape Classic's rules (a roll to hit, a roll for how hard, one fight at a time)
//   streetHeal   {slot}        use a bandage: +3 hit points, and it takes the place of a swing (once every 6 seconds)
//   streetsTest  {minutes}     the admin's switch: the elevator runs for that many minutes from now whatever the clock says (0 turns it off)
import { Action, cheb, ID_RE, int, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { isEmulator } from "../env";
import { addToInv, DUMPSTER_DROPS, overCarry, takeQtyFrom } from "../../../src/shared/economy";
import { streetUnit } from "../../../src/shared/darkweb";
import { findSlot, NO_DROP } from "../../../src/shared/items";
import type { InvItem } from "../../../src/shared/items";
import { floorPiles } from "./floor";
import {
  ARRIVAL_ID, bestWeapon, customerAt, CUSTOMER_CAP, CUSTOMER_STAY_MS, CUSTOMERS_PER_PLAYER_PER_MIN, danishDayKey, elevatorRuns, fmtWhen, holdsTicket, hpNow, mergeStreetPieces, orderPay, PVP, StreetOverride, STREETS_ID, STAFF_TEST_PASS_MS, StreetCombat, swingRoll, TICKET_ITEM, TICKET_PRICE, TICKET_STOCK,
} from "../../../src/shared/streets";

/** the streets are only for the staff and the emulator until the admin switches them on (config/streetsOpen, Admin > Streets) */
const openFor = async (_c: Ctx): Promise<boolean> => true; // (the streets are open for everybody now: no switch to press)
const forceUntil = async (c: Ctx): Promise<number> => Number(await c.db.get<number>("config/streetsForce")) || 0;

export const ticketBuy: Action = {
  locks: () => ["tickets"],
  async run(c) {
    if (!(await openFor(c))) fail("The elevator is out of order.");
    await requireInRoom(c, "lobby");
    const w = await c.user();
    if (holdsTicket(w.s.inventory)) fail("You have a ticket already. There is one for each player.");
    const win = elevatorRuns(c.now, await forceUntil(c)).windowKey; // (50 tickets for each run: the one that is on, or the next)
    const sold = Number(await c.db.get<number>(`streetTickets/${win}/sold`)) || 0;
    if (sold >= TICKET_STOCK) fail("The tickets for this run are sold out. There are new ones for the next run.");
    if (w.s.blood < TICKET_PRICE) fail(`You need ${TICKET_PRICE - w.s.blood} more blood.`);
    const next = addToInv(w.s.inventory, { item: TICKET_ITEM, qty: 1 });
    if (!next) fail("Your inventory is full.");
    w.s.inventory = next!;
    w.s.blood -= TICKET_PRICE;
    c.extra[`streetTickets/${win}/sold`] = sold + 1;
    return { price: TICKET_PRICE, left: TICKET_STOCK - sold - 1 };
  },
};

export const elevatorUp: Action = {
  locks: () => [],
  async run(c) {
    if (!(await openFor(c))) fail("The elevator is out of order.");
    await requireInRoom(c, "lobby");
    const cool = Number(await c.db.get<number>(`elevatorCool/${c.uid}`)) || 0; // (somebody who was just killed on the street waits 30 seconds)
    if (cool > c.now) fail(`The elevator is shut for you. Try again in ${Math.ceil((cool - c.now) / 1000)} seconds.`);
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
/** a street bin gives two things (and sometimes a third), and can be searched again after 15 minutes (the lean halves the wait at a blue bin) */
const BIN_MS = 900_000;
/** the plain can: this much of the time what it gives is a bandage */
const CAN_BANDAGE = 0.1;
export const streetBin: Action = {
  async run(c, a) {
    const can = text(a.can, /^[A-Za-z0-9_-]{1,30}$/, "can");
    const stand = await requireInRoom(c, STREETS_ID);
    const piece = mergeStreetPieces(await c.db.get<Record<string, StreetOverride>>("streets/furni")).find(([id, kind]) => id === can && (kind === "st_bin" || kind === "st_can")); // (the street as the admin has left it)
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
    const dropped: string[] = [];
    for (let i = 0; i < picks; i++) {
      const item = plain ? pickPlain() : pick();
      if (overCarry(w.s.inventory, item, 1)) { dropped.push(item); items.push(item); continue; } // (you carry 5 bandages / 2 guns already: it falls on the floor)
      const next = addToInv(w.s.inventory, { item, qty: 1 });
      if (!next) { if (!items.length) fail("Your inventory is full"); break; }
      w.s.inventory = next;
      items.push(item);
    }
    w.s.dumpsters[key] = c.now;
    if (dropped.length) await floorPiles(c, STREETS_ID, stand, dropped.map((item) => ({ item, qty: 1 })), c.uid, String(w.raw.name ?? "someone"));
    return { item: items[0], items, dropped };
  },
};

// ---- the customers ------------------------------------------------------------------------------------------------------
/**
 * Customers turn up while there are players on the street: 0.6 a minute for each of them, 15 on the street at most, and one whose order isn't filled leaves after 7 minutes.
 * The browsers on the street ask every few seconds; whoever asks first does the counting (everything is in streetCustState, so it doesn't matter who).
 */
export const streetTick: Action = {
  locks: () => ["streettick"],
  async run(c) {
    await requireInRoom(c, STREETS_ID);
    const players = (await c.db.get<Record<string, { npc?: boolean; sleeper?: boolean }>>(`rooms/${STREETS_ID}/players`)) ?? {};
    const present = Object.values(players).filter((p) => p && !p.npc && !p.sleeper).length;
    const st = (await c.db.get<{ at?: number; carry?: number; k?: number }>("streetCustState")) ?? {};
    const all = (await c.db.get<Record<string, { at?: number; until?: number }>>("streetCust")) ?? {};
    const filled = (await c.db.get<Record<string, unknown>>("streetFilled")) ?? {};
    let live = 0;
    for (const [k, r] of Object.entries(all)) {
      if (Number(r?.until) > c.now) { if (!filled[k]) live++; }
      else if (Number(r?.until) < c.now - 120_000) c.extra[`streetCust/${k}`] = null; // (long gone: swept away)
    }
    const dt = Math.min(Math.max(0, c.now - (Number(st.at) || c.now)), 90_000); // (a street that was empty for a while doesn't save up customers)
    let carry = (Number(st.carry) || 0) + (present * dt * CUSTOMERS_PER_PLAYER_PER_MIN) / 60_000;
    if (present > 0 && live === 0) carry = Math.max(carry, 1); // (somebody walks onto an empty street: the first customer is there at once)
    let next = Number(st.k) || Math.floor(c.now / 1000);
    let spawned = 0;
    while (carry >= 1 && live + spawned < CUSTOMER_CAP) {
      next += 1; spawned += 1; carry -= 1;
      c.extra[`streetCust/${next}`] = { at: c.now, until: c.now + CUSTOMER_STAY_MS };
    }
    if (live + spawned >= CUSTOMER_CAP) carry = Math.min(carry, 0.99); // (full: no queue of customers waiting to turn up)
    c.extra["streetCustState"] = { at: c.now, carry: present > 0 ? carry : 0, k: next };
    return { spawned, live: live + spawned, present };
  },
};

export const streetFill: Action = {
  locks: () => ["streetfill"],
  async run(c, a) {
    const k = int(a.k, 0, 2_000_000_000, "customer");
    await requireInRoom(c, STREETS_ID);
    const row = await c.db.get<{ at?: number; until?: number }>(`streetCust/${k}`);
    const cu = row && Number(row.until) > c.now && Number(row.at) <= c.now ? customerAt(k, Number(row.at)) : null; // (a customer the server let turn up, who hasn't left yet)
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
    const unit = streetUnit(cu!.want.item);
    const pay = orderPay(unit, cu!.want);
    w.s.blood += pay;
    c.extra[`streetFilled/${k}`] = { by: c.uid, at: c.now };
    c.note = `street order ${cu!.want.qty} ${cu!.want.item} for ${pay}`;
    return { pay, item: cu!.want.item, qty: cu!.want.qty };
  },
};

// ---- the fights ---------------------------------------------------------------------------------------------------------
/** somebody who has just been killed is out of the street: no more swings, shots or bandages from a body that is on its way home */
async function refuseIfDead(c: Ctx): Promise<void> {
  const cb = await c.db.get<{ deadAt?: number }>(`streetCombat/${c.uid}`);
  if (cb && Number(cb.deadAt) > 0 && c.now - Number(cb.deadAt) < PVP.deathCoolMs) fail("You are dead.");
}
const fresh = (c: Ctx): StreetCombat => ({ hp: PVP.maxHp, at: c.now, combatUntil: 0, healAt: 0, protectUntil: c.now + PVP.spawnProtectMs, kills: 0, deaths: 0 });
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
    await refuseIfDead(c);
    const theirs = await c.db.get<{ x?: number; y?: number; sleeper?: boolean }>(`rooms/${STREETS_ID}/players/${target}`);
    if (!theirs) fail("They've left the street.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > PVP.reach + 1) fail("They're too far away."); // (one tile, and a step of slack for the lag)
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't fight someone who plays on your device.");
    const w = await c.user();
    const weapon = bestWeapon(w.s.inventory);
    if (!weapon) fail("You need a knife for that.");
    const mine = await combatOf(c, c.uid);
    const their = await combatOf(c, target);
    if (Number(mine.protectUntil) > c.now) mine.protectUntil = 0; // (your own protection ends when you swing)
    if (their.protectUntil > c.now) fail("They just arrived. Give them a moment.");
    // one fight at a time: while two are locked in a fight nobody else can hit either of them, and neither can walk off and hit somebody else
    if (their.combatUntil > c.now && their.foe && their.foe !== c.uid) fail("They are in a fight already.");
    if (mine.combatUntil > c.now && mine.foe && mine.foe !== target) fail("You are in a fight already.");
    const last = Number(await c.db.get<number>(`streetSwing/${c.uid}`)) || 0;
    if (c.now - last < PVP.swingMs) fail("Your arm is still swinging.");
    c.extra[`streetSwing/${c.uid}`] = c.now;
    const { dmg } = swingRoll(weapon!); // (a swing that misses is a splash: 0)
    const stabKey = (t: number): string => `rooms/${STREETS_ID}/events/f${c.uid.slice(0, 8)}${t.toString(36)}`;
    if (last) c.extra[stabKey(last)] = null; // (the swing before this one has been seen by now: the events don't pile up)
    return applyStrike(c, w, target, theirs!, mine, their, dmg, stabKey(c.now), { type: "stab", from: c.uid, to: target, ts: c.now, fight: true }); // (everybody sees the stab animation, as for a normal stab)
  },
};


/**
 * A gun on the street: the gun is spent, the shot does 0 to 5 hit points, and the next gun can be fired 30 seconds after this one. It locks you and them in a fight, as a knife does,
 * and a kill works the same way (see applyStrike). It reaches further than a knife.
 */
export const streetShoot: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`],
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't shoot yourself.");
    const me = await requireInRoom(c, STREETS_ID);
    await refuseIfDead(c);
    const theirs = await c.db.get<{ x?: number; y?: number }>(`rooms/${STREETS_ID}/players/${target}`);
    if (!theirs) fail("They've left the street.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > PVP.gunRange) fail("They're too far away.");
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't shoot someone who plays on your device.");
    const w = await c.user();
    const slot = a.slot === undefined ? findSlot(w.s.inventory, "gun") : int(a.slot, 0, 27, "slot");
    if (slot < 0 || w.s.inventory[slot]?.item !== "gun") fail("You have no gun.");
    const mine = await combatOf(c, c.uid);
    const their = await combatOf(c, target);
    if (Number(mine.protectUntil) > c.now) mine.protectUntil = 0; // (your own protection ends when you shoot)
    if (their.protectUntil > c.now) fail("They just arrived. Give them a moment.");
    if (their.combatUntil > c.now && their.foe && their.foe !== c.uid) fail("They are in a fight already.");
    if (mine.combatUntil > c.now && mine.foe && mine.foe !== target) fail("You are in a fight already.");
    const last = Number(await c.db.get<number>(`streetGun/${c.uid}`)) || 0;
    if (c.now - last < PVP.gunCooldownMs) fail(`Reloading: ${Math.ceil((PVP.gunCooldownMs - (c.now - last)) / 1000)} more seconds.`);
    c.extra[`streetGun/${c.uid}`] = c.now;
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1); // (the gun is spent, hit or miss)
    const dmg = Math.floor(Math.random() * (PVP.gunMaxDmg + 1)); // (0 is a miss)
    const key = (t: number): string => `rooms/${STREETS_ID}/events/g${c.uid.slice(0, 8)}${t.toString(36)}`;
    if (last) c.extra[key(last)] = null; // (the shot before this one has been seen by now)
    return applyStrike(c, w, target, theirs!, mine, their, dmg, key(c.now), { type: "shot", from: c.uid, to: target, ts: c.now });
  },
};

/** the same for a knife and a gun: the damage lands, the two are locked in a fight, and a kill takes the dead one's things (see the comments below) */
async function applyStrike(c: Ctx, w: Awaited<ReturnType<Ctx["user"]>>, target: string, theirs: { x?: number; y?: number }, mine: StreetCombat, their: StreetCombat, dmg: number, eventKey: string, event: Record<string, unknown>): Promise<{ dmg: number; left: number; died: boolean; looted: number; spilled: number }> {
    const hpT = hpNow(their, c.now);
    const left = Math.max(0, hpT - dmg);
    mine.combatUntil = c.now + PVP.combatMs; mine.foe = target;
    their.combatUntil = c.now + PVP.combatMs; their.foe = c.uid;
    let died = false, looted = 0, spilled = 0;
    if (left <= 0) {
      died = true;
      mine.kills += 1;
      c.extra[`streetCombat/${target}`] = { ...their, hp: PVP.maxHp, at: c.now, combatUntil: 0, foe: null, protectUntil: c.now + 30_000, deaths: their.deaths + 1, deadAt: c.now, deadBy: c.uid, deadByName: String(w.raw.name ?? "someone").slice(0, 16) };
      c.extra[`elevatorCool/${target}`] = c.now + PVP.deathCoolMs; // (sent home at once by their browser; the elevator is shut for them for 30 seconds)
      mine.foe = undefined; // (the fight is over, but the 10 seconds where you can't leave still run: killing the one who hit you does not lift them)
      // the killer takes what the dead one carried (the knife stays: it is the one thing a player must always have, and so does everything else that can't be dropped); what doesn't fit in the killer's pocket lies on the floor where they died, along with 25 blood
      const v = await c.user(target);
      const loot: InvItem[] = [];
      v.s.inventory = v.s.inventory.map((it) => { if (!it || NO_DROP.has(it.item)) return it; loot.push({ item: it.item, qty: it.qty, ...(it.ass ? { ass: true } : {}), ...(it.giver ? { giver: it.giver } : {}) }); return null; });
      const spill: InvItem[] = [];
      let carried = w.s.inventory;
      for (const it of loot) { const next = addToInv(carried, it); if (next) carried = next; else spill.push(it); }
      w.s.inventory = carried;
      const lost = Math.min(PVP.deathBlood, Math.max(0, Math.floor(v.s.blood)));
      v.s.blood -= lost;
      const where = typeof theirs!.x === "number" && typeof theirs!.y === "number" ? { x: theirs!.x, y: theirs!.y } : null;
      const dead = String(v.raw.name ?? "someone");
      await floorPiles(c, STREETS_ID, where, [...(lost > 0 ? [{ item: "blood", qty: lost }] : []), ...spill.map((it) => ({ item: it.item, qty: it.qty, ...(it.ass ? { ass: true } : {}) }))], target, dead);
      looted = loot.length - spill.length; spilled = spill.length;
      // the others see the body for a few seconds (a "body" event: the browsers draw a figure lying on the ground)
      c.extra[`rooms/${STREETS_ID}/events/b${target.slice(0, 8)}${c.now.toString(36)}`] = { type: "body", uid: target, name: dead.slice(0, 16), figure: String(v.raw.figure ?? "").slice(0, 200), x: where?.x ?? 0, y: where?.y ?? 0, dir: Number((theirs as { dir?: number }).dir) || 2, ts: c.now };
      // somebody who closed the game in the fight is not standing there any more once they are dead
      const pr = await c.db.get<{ room?: string } | null>(`presence/${target}`);
      if (!pr || pr.room !== STREETS_ID) c.extra[`rooms/${STREETS_ID}/players/${target}`] = null;
    } else c.extra[`streetCombat/${target}`] = { ...their, hp: left, at: c.now };
    c.extra[`streetCombat/${c.uid}`] = { ...mine, hp: hpNow(mine, c.now), at: c.now, foe: mine.foe ?? null };
    // what everybody in the room sees: a number over the head (and the dead one is sent home by their own browser)
    c.extra[eventKey] = event;
    c.extra[`rooms/${STREETS_ID}/hits/${c.uid}`] = { to: target, dmg, at: c.now, ...(died ? { dead: true } : {}) };
    c.note = `${dmg ? `hit ${dmg}` : "missed"}${died ? " (killed)" : ""}`;
    return { dmg, left, died, looted, spilled };
}
export const streetHeal: Action = {
  async run(c, a) {
    await requireInRoom(c, STREETS_ID);
    await refuseIfDead(c);
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
    c.extra[`streetSwing/${c.uid}`] = c.now; // (eating takes the place of a swing, as in RuneScape: you give the other one a free round)
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

/**
 * /test1 (yourself) and /test1 <name> (somebody else): the staff (admin and mods) move to the arrival room, the room the elevator takes you to, and get a pass for a couple of hours,
 * so they can test the fights and the customers while the streets are closed to players. Naming a player pulls that player in too (their browser walks them there: teleports/<uid>).
 */
export const streetsStaffTest: Action = {
  async run(c, a) {
    if (!c.isAdmin && !c.isMod) fail("Unknown command.");
    const who = typeof a.name === "string" ? a.name.trim().toLowerCase() : "";
    let uid = c.uid;
    let name = "";
    if (who) {
      const found = await c.db.get<string>(`usernames/${text(who, /^[a-z0-9_ .-]{1,20}$/, "name")}`);
      if (!found) fail("There is no player with that name.");
      uid = found!;
      name = String((await c.db.get<string>(`profiles/${uid}/name`)) ?? who).slice(0, 16);
    }
    c.extra[`streetPass/${uid}`] = c.now + STAFF_TEST_PASS_MS;
    if (uid !== c.uid) c.extra[`teleports/${uid}`] = { room: ARRIVAL_ID, at: c.now, by: c.uid };
    c.note = uid === c.uid ? "staff test pass" : `test area for ${name}`;
    return { until: c.now + STAFF_TEST_PASS_MS, name, self: uid === c.uid };
  },
};
