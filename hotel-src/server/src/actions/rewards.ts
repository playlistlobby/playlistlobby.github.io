// Things that pay blood or change what you carry: stabbing, the syringe, Flappy Bird, cats, bins, smoking, rolling, watering, growing.
import { Action, cheb, ID_RE, int, requireInRoom, requireOwnRoom, text } from "./util";
import { fail } from "../ctx";
import { skipTime } from "../skipTime";
import {
  addToInv, DOUBLE_HARVEST_CHANCE, DUMPSTER_DROPS, SEED_BACK_CHANCE, DUMPSTER_MS, FLAPPY_GAP_MS, LEAN_CUP_MS, LEAN_MS, DMT_MS, DMT_TRIP_MS, LSD_MS, LSD_SPEED, SHROOM_MS, stabGainAt, SYRINGE_BLOOD, SYRINGE_CD_MS, takeOneFrom, todayStartAt,
} from "../../../src/shared/economy";
import { combine, fentanylDeathCost, findSlot, growMsOf, isLaced, SMOKABLE, smokeMsOf, unlaced } from "../../../src/shared/items";
import type { Inventory } from "../../../src/shared/items";

const mins = (ms: number): string => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

/** Stabbing someone: once per person per UTC day, in the same room, close by. */
export const stab: Action = {
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't stab yourself.");
    const room = text(a.room, /^[A-Za-z0-9_-]{1,60}$/, "room");
    const me = await requireInRoom(c, room);
    const theirs = await c.db.get<{ x?: number; y?: number; bed?: boolean }>(`rooms/${room}/players/${target}`);
    // a sleeping owner (offline) isn't in the room's player list: you can still stab them in their own room
    if (!theirs && room !== `u_${target}`) fail("They've left the room.");
    if (me && theirs && typeof theirs.x === "number" && typeof theirs.y === "number" && cheb(me, { x: theirs.x, y: theirs.y }) > 3) fail("They're too far away.");
    if (!(await c.db.get(`profiles/${target}/name`))) fail("They aren't a player.");
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't stab someone who plays on your device."); // (accounts from one device: no farming your own accounts)
    c.note = target; // (the blood ledger says who was stabbed)
    const w = await c.user();
    const s = w.s;
    if (findSlot(s.inventory, "knife") < 0) fail("You need a knife for that.");
    const today = todayStartAt(c.now);
    if ((s.stabs[target] ?? 0) >= today) fail("You've already stabbed them today.");
    // somebody asleep (an offline owner in their bed, or lying in bed) is always worth exactly 1 drop: no boost counts, so sleepers can't be farmed
    const sleeping = !theirs || theirs.bed === true;
    const gain = sleeping ? 1 : stabGainAt(s, c.now);
    s.blood += gain;
    s.stabs[target] = today;
    return { gain };
  },
};

/** The syringe: 1 drop from yourself, or from a body bag in the room; each once every 20 minutes. */
export const syringe: Action = {
  async run(c, a) {
    const who = a.who === "bag" ? "bag" : "self";
    const w = await c.user();
    const s = w.s;
    if (findSlot(s.inventory, "syringe") < 0) fail("You don't have a syringe.");
    const last = who === "self" ? s.syringeSelfAt : s.syringeBagAt;
    if (c.now - last < SYRINGE_CD_MS) fail(who === "bag" ? `There's nothing left in the bag for now. Try again in ${mins(SYRINGE_CD_MS - (c.now - last))}.` : `Your arm needs ${mins(SYRINGE_CD_MS - (c.now - last))} to recover.`);
    if (who === "bag") {
      const room = text(a.room, /^[A-Za-z0-9_-]{1,60}$/, "room");
      await requireInRoom(c, room);
      const furni = (await c.db.get<Record<string, { kind?: string }>>(room === "lobby" ? "lobby/furni" : `roomsMeta/${room}/furni`)) ?? {};
      if (!Object.values(furni).some((f) => /bodybag/.test(String(f?.kind)))) fail("There's no body bag here.");
      s.syringeBagAt = c.now;
    } else s.syringeSelfAt = c.now;
    s.blood += SYRINGE_BLOOD;
    return { gain: SYRINGE_BLOOD };
  },
};

/** A drop of blood caught in Flappy Bird. The game runs in the browser, so all the server can do is keep them rare. */
export const flappy: Action = {
  async run(c, a) {
    const room = text(a.room, /^[A-Za-z0-9_-]{1,60}$/, "room");
    await requireInRoom(c, room);
    const w = await c.user();
    if (c.now - w.s.flappyAt < FLAPPY_GAP_MS) fail("Too soon.");
    w.s.blood += 1;
    w.s.flappyAt = c.now;
    return {};
  },
};

/** Rummaging through a garbage can: one weighted pick, each can once every 10 minutes. */
export const dumpster: Action = {
  async run(c, a) {
    const can = text(a.can, /^[A-Za-z0-9_-]{1,30}$/, "can");
    const room = text(a.room, /^[A-Za-z0-9_-]{1,60}$/, "room");
    if (room !== "lobby" && room !== `tut_${c.uid}`) fail("There's no bin here.");
    await requireInRoom(c, room);
    const extras = (await c.db.get<Record<string, { kind?: string }>>("lobby/furni")) ?? {};
    if (can !== "lobby2" && can !== "lobby3" && can !== "lobby5" && extras[can]?.kind !== "dumpster") fail("That isn't a bin.");
    const w = await c.user();
    const last = w.s.dumpsters[can] ?? 0;
    const reload = c.now < w.s.leanUntil ? DUMPSTER_MS / 2 : DUMPSTER_MS; // the lean halves the wait
    if (c.now - last < reload) fail(`That bin was searched a moment ago. Try again in ${mins(reload - (c.now - last))}.`);
    const total = DUMPSTER_DROPS.reduce((n, d) => n + d.chance, 0);
    const pick = (): string => {
      let r = Math.random() * total;
      for (const d of DUMPSTER_DROPS) { if (r < d.chance) return d.item; r -= d.chance; }
      return DUMPSTER_DROPS[0].item;
    };
    // the lean: twice as much from every search
    const picks = c.now < w.s.leanUntil ? 2 : 1;
    const items: string[] = [];
    for (let i = 0; i < picks; i++) {
      const item = pick();
      const next = addToInv(w.s.inventory, { item, qty: 1 });
      if (!next) { if (items.length === 0) fail("Your inventory is full"); break; }
      w.s.inventory = next;
      items.push(item);
    }
    w.s.dumpsters[can] = c.now;
    return { item: items[0], items };
  },
};

/** How long you are dead for after fentanyl (the browser shows the screen and then puts you back in your room). */
export const FENT_DEATH_MS = 10_000;
/** You died of fentanyl: the price in blood comes off (see fentanylDeathCost); `laced` is what killed you if it wasn't the plain fentanyl. */
function fentDeath(c: import("../ctx").Ctx, s: { blood: number }, laced?: string): { kind: "fentdeath"; lost: number; ms: number; item?: string } {
  const lost = fentanylDeathCost(s.blood, laced);
  s.blood -= lost;
  c.note = laced ? `laced ${unlaced(laced)}` : "fentanyl"; // (the blood ledger says what killed you)
  return { kind: "fentdeath", lost, ms: FENT_DEATH_MS, ...(laced ? { item: unlaced(laced) } : {}) };
}

/** Swallowing fentanyl (it kills you), or anything laced with it, or drinking the lean (the cup in your hand for 2 minutes, an hour of better bins). */
export const consume: Action = {
  async run(c, a) {
    const w = await c.user();
    const s = w.s;
    const slot = int(a.slot, 0, 27, "slot");
    const it = s.inventory[slot];
    if (!it || it.inPlayer || it.lit) fail("You aren't carrying that.");
    if (it!.item === "superpill" || isLaced(it!.item)) { // fentanyl on its own kills, and so does anything that was laced with it
      s.inventory = takeOneFrom(s.inventory, slot);
      return fentDeath(c, s, isLaced(it!.item) ? it!.item : undefined);
    }
    if (it!.item === "shroom" || it!.item === "weakshroom") { // a weak shroom works the same, it just can't be mixed
      s.inventory = takeOneFrom(s.inventory, slot);
      s.shroomUntil = c.now + SHROOM_MS; // any room is open to you (the database rules look at this too)
      return { kind: "shroom", ms: DMT_MS, tripMs: SHROOM_MS }; // (the subtle patterns are drawn by the browser)
    }
    if (it!.item === "lsd") {
      s.inventory = takeOneFrom(s.inventory, slot);
      s.speedUntil = c.now + LSD_MS; // 3x speed (the browser makes the character spin for as long); no open doors
      s.speedMult = LSD_SPEED;
      return { kind: "lsd", ms: DMT_MS, tripMs: LSD_MS };
    }
    if (it!.item === "dmt") {
      s.inventory = takeOneFrom(s.inventory, slot);
      const until = c.now + DMT_MS + DMT_TRIP_MS; // the 4 minutes start after the colours and the lying down
      s.shroomUntil = until;
      s.speedUntil = until;
      s.speedMult = 2;
      return { kind: "dmt", ms: DMT_MS, tripMs: DMT_TRIP_MS };
    }
    if (it!.item === "codeine") {
      s.inventory = takeOneFrom(s.inventory, slot);
      s.leanUntil = c.now + LEAN_MS;
      s.cupUntil = c.now + LEAN_CUP_MS;
      return { kind: "codeine", leanMs: LEAN_MS, cupMs: LEAN_CUP_MS };
    }
    return fail("You can't swallow that.");
  },
};

/** Lights a cigarette, joint or blunt (needs a lighter, which isn't used up). One at a time. */
export const light: Action = {
  async run(c, a) {
    const w = await c.user();
    const s = w.s;
    const slot = int(a.slot, 0, 27, "slot");
    const it = s.inventory[slot];
    if (!it || !SMOKABLE[it.item] || it.lit) fail("That can't be lit.");
    if (isLaced(it!.item)) { s.inventory = takeOneFrom(s.inventory, slot); return fentDeath(c, s, it!.item); }
    if (findSlot(s.inventory, "lighter") < 0) fail("You need a lighter for that. The vending machine in the shop sells them.");
    if (s.inventory.some((x) => x && SMOKABLE[x.item] && x.lit && c.now - x.lit < smokeMsOf(x.item))) fail("You're already smoking one.");
    let next: Inventory;
    if (it!.qty > 1) {
      next = s.inventory.map((x, i) => (i === slot && x ? { ...x, qty: x.qty - 1 } : x ? { ...x } : null));
      const free = next.findIndex((x) => x === null);
      if (free < 0) fail("Your inventory is full");
      next[free] = { ...it!, qty: 1, lit: c.now };
    } else {
      next = s.inventory.map((x, i) => (i === slot && x ? { ...x, lit: c.now } : x ? { ...x } : null));
    }
    s.inventory = next;
    return { litAt: c.now };
  },
};

/** A smoke that has burned for a minute becomes a butt; a joint / blunt / cigarette then gives its stab bonus (ass weed knocks you out instead). */
export const finishSmoke: Action = {
  async run(c, a) {
    const w = await c.user();
    const s = w.s;
    const slot = int(a.slot, 0, 27, "slot");
    const it = s.inventory[slot];
    const sm = it ? SMOKABLE[it.item] : undefined;
    if (!it || !sm || !it.lit) fail("That isn't lit.");
    const burn = smokeMsOf(it!.item);
    if (c.now - it!.lit! < burn - Math.min(3000, burn * 0.4)) fail("It's still burning.");
    const ass = !!it!.ass && it!.item !== "cigarette";
    s.inventory = s.inventory.map((x, i) => (i === slot ? { item: "cigbutt", qty: 1 } : x));
    if (ass) return { passOut: true };
    if (it!.item === "cigarette") await skipTime(c, s.dumpsters, 30_000); // a cigarette is half a minute gone: your plants, mixers and bins move on 30 seconds
    if (sm!.chudNameMs) return { mult: 0, boostMs: 0, speedMs: 0, chemMs: 0, shroomMs: 0, chudMs: sm!.chudNameMs }; // only the name changes (the browser shows it)
    s.boostUntil = c.now + sm!.boostMs;
    s.boostMult = sm!.mult;
    if (sm!.speedMs) { s.speedUntil = c.now + sm!.speedMs; s.speedMult = 2; }
    if (sm!.chemMs) s.chemUntil = c.now + sm!.chemMs;
    if (sm!.shroomMs) s.shroomUntil = Math.max(s.shroomUntil, c.now + sm!.shroomMs); // chud: the shroom's open doors too
    return { mult: sm!.mult, boostMs: sm!.boostMs, speedMs: sm!.speedMs ?? 0, chemMs: sm!.chemMs ?? 0, shroomMs: sm!.shroomMs ?? 0 };
  },
};

/** Two pocket items used on each other: rolling (weed + paper, ...). Mixing is the mixer's job. */
export const combineItems: Action = {
  async run(c, a) {
    const w = await c.user();
    const ia = int(a.a, 0, 27, "slot"), ib = int(a.b, 0, 27, "slot");
    const x = w.s.inventory[ia], y = w.s.inventory[ib];
    if (!x || !y || ia === ib) fail("Those don't go together.");
    const res = combine(x!, y!);
    if (!res) fail("Those don't go together.");
    let next = takeOneFrom(w.s.inventory, ia);
    next = takeOneFrom(next, ib);
    let added = addToInv(next, res!.give);
    if (added && res!.back) added = addToInv(added, res!.back); // the watering can comes back empty
    if (!added) fail("Your inventory is full");
    w.s.inventory = added!;
    return { note: res!.note, gave: res!.give.item };
  },
};

export const fillCan: Action = {
  async run(c, a) {
    await requireOwnRoom(c); // the sink is in your own room
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "wateringcan") fail("That can isn't empty.");
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot ? { item: "wateringcan_full", qty: 1 } : x));
    return {};
  },
};

// ---- growing weed in a growing kit (a piece of furniture in your own room) ----------------------------------------------
async function planter(c: import("../ctx").Ctx, fid: unknown) {
  const room = await requireOwnRoom(c);
  const id = text(fid, ID_RE, "kit");
  const path = `roomsMeta/${room}/furni/${id}`;
  const row = await c.db.get<{ kind?: string; plantedAt?: number; wateredAt?: number; neglect?: boolean; crop?: string }>(path);
  if (!row || row.kind !== "f_planter") return fail("That isn't a growing kit.");
  return { path, row };
}

export const plant: Action = {
  async run(c, a) {
    const { path, row } = await planter(c, a.fid);
    if (typeof row.plantedAt === "number") fail("Something is already growing there.");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    const seed = w.s.inventory[slot]?.item;
    if (seed !== "weedseed" && seed !== "shroomspore") fail("That isn't a seed.");
    w.s.inventory = takeOneFrom(w.s.inventory, slot);
    c.extra[`${path}/crop`] = seed === "shroomspore" ? "shroom" : null; // what grows: weed (nothing stored) or shrooms
    c.extra[`${path}/plantedAt`] = c.now;
    c.extra[`${path}/wateredAt`] = null; // it hasn't been watered yet
    c.extra[`${path}/neglect`] = null;
    return {};
  },
};

export const water: Action = {
  async run(c, a) {
    const { path, row } = await planter(c, a.fid);
    if (typeof row.plantedAt !== "number") fail("There's nothing planted there.");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "wateringcan_full") fail("That can is empty.");
    // one watering, at any time while it grows (the bar need not be empty), keeps the harvest good
    if (typeof row.wateredAt === "number" && row.wateredAt > row.plantedAt!) fail("It's already been watered. It'll grow fine now.");
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot ? { item: "wateringcan", qty: 1 } : x));
    c.extra[`${path}/wateredAt`] = c.now;
    return {};
  },
};

export const harvest: Action = {
  async run(c, a) {
    const { path, row } = await planter(c, a.fid);
    if (typeof row.plantedAt !== "number") fail("There's nothing planted there.");
    if (c.now - row.plantedAt! < growMsOf(row.crop)) fail("It isn't ready yet.");
    const ass = !(typeof row.wateredAt === "number" && row.wateredAt > row.plantedAt!); // never got its one watering
    const w = await c.user();
    const shrooms = row.crop === "shroom";
    const qty = Math.random() < DOUBLE_HARVEST_CHANCE ? 2 : 1; // one per harvest, and now and then two
    const give = shrooms ? { item: ass ? "weakshroom" : "shroom", qty: ass ? 1 : qty } : { item: "weed", qty, ...(ass ? { ass: true } : {}) }; // (shrooms that never got their water give only one)
    const next = addToInv(w.s.inventory, give);
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    // a 25% chance of a seed (or spores) falling out of the plant: only if there is room for it
    let seed: string | undefined;
    if (Math.random() < SEED_BACK_CHANCE) {
      const item = shrooms ? "shroomspore" : "weedseed";
      const withSeed = addToInv(w.s.inventory, { item, qty: 1 });
      if (withSeed) { w.s.inventory = withSeed; seed = item; }
    }
    c.extra[`${path}/crop`] = null;
    c.extra[`${path}/plantedAt`] = null;
    c.extra[`${path}/wateredAt`] = null;
    c.extra[`${path}/neglect`] = null;
    return { ass, crop: shrooms ? "shroom" : undefined, qty: give.qty, seed };
  },
};

