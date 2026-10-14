// Things that pay blood or change what you carry: stabbing, the syringe, Flappy Bird, cats, bins, smoking, rolling, watering, growing.
import { Action, cheb, ID_RE, int, requireInRoom, requireOwnRoom, text } from "./util";
import { fail } from "../ctx";
import {
  addToInv, CAT_BLOOD, DUMPSTER_DROPS, DUMPSTER_MS, FLAPPY_GAP_MS, stabGainAt, SYRINGE_BLOOD, SYRINGE_CD_MS, takeOneFrom, todayStartAt,
} from "../../../src/shared/economy";
import { combine, findSlot, GROW_MS, SMOKABLE, SMOKE_MS, WATER_MS } from "../../../src/shared/items";
import type { Inventory } from "../../../src/shared/items";

const mins = (ms: number): string => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

/** Stabbing someone: once per person per UTC day, in the same room, close by. */
export const stab: Action = {
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't stab yourself.");
    const room = text(a.room, /^[A-Za-z0-9_-]{1,60}$/, "room");
    const me = await requireInRoom(c, room);
    const theirs = await c.db.get<{ x?: number; y?: number }>(`rooms/${room}/players/${target}`);
    // a sleeping owner (offline) isn't in the room's player list: you can still stab them in their own room
    if (!theirs && room !== `u_${target}`) fail("They've left the room.");
    if (me && theirs && typeof theirs.x === "number" && typeof theirs.y === "number" && cheb(me, { x: theirs.x, y: theirs.y }) > 3) fail("They're too far away.");
    if (!(await c.db.get(`profiles/${target}/name`))) fail("They aren't a player.");
    const w = await c.user();
    const s = w.s;
    if (findSlot(s.inventory, "knife") < 0) fail("You need a knife for that.");
    const today = todayStartAt(c.now);
    if ((s.stabs[target] ?? 0) >= today) fail("You've already stabbed them today.");
    const gain = stabGainAt(s, c.now);
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

/** Cuts a dead cat open with the knife. */
export const carve: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "deadcat") fail("That isn't a dead cat");
    if (findSlot(w.s.inventory, "knife") < 0) fail("You've got nothing to cut it with.");
    w.s.inventory = takeOneFrom(w.s.inventory, slot);
    w.s.blood += CAT_BLOOD;
    w.s.catsCarved += 1;
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
    if (can !== "lobby2" && can !== "lobby3" && extras[can]?.kind !== "dumpster") fail("That isn't a bin.");
    const w = await c.user();
    const last = w.s.dumpsters[can] ?? 0;
    if (c.now - last < DUMPSTER_MS) fail(`That bin was searched a moment ago. Try again in ${mins(DUMPSTER_MS - (c.now - last))}.`);
    const total = DUMPSTER_DROPS.reduce((n, d) => n + d.chance, 0);
    let r = Math.random() * total;
    let item = DUMPSTER_DROPS[0].item;
    for (const d of DUMPSTER_DROPS) { if (r < d.chance) { item = d.item; break; } r -= d.chance; }
    const next = addToInv(w.s.inventory, { item, qty: 1 });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    w.s.dumpsters[can] = c.now;
    return { item };
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
    if (findSlot(s.inventory, "lighter") < 0) fail("You need a lighter for that. The vending machine in the shop sells them.");
    if (s.inventory.some((x) => x && SMOKABLE[x.item] && x.lit && c.now - x.lit < SMOKE_MS)) fail("You're already smoking one.");
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
    if (c.now - it!.lit! < SMOKE_MS - 3000) fail("It's still burning.");
    const ass = !!it!.ass && it!.item !== "cigarette";
    s.inventory = s.inventory.map((x, i) => (i === slot ? { item: "cigbutt", qty: 1 } : x));
    if (ass) return { passOut: true };
    s.boostUntil = c.now + sm!.boostMs;
    s.boostMult = sm!.mult;
    if (sm!.speedMs) s.speedUntil = c.now + sm!.speedMs;
    if (sm!.chemMs) s.chemUntil = c.now + sm!.chemMs;
    return { mult: sm!.mult, boostMs: sm!.boostMs, speedMs: sm!.speedMs ?? 0, chemMs: sm!.chemMs ?? 0 };
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
    const added = addToInv(next, res!.give);
    if (!added) fail("Your inventory is full");
    w.s.inventory = added!;
    return { note: res!.note };
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
  const row = await c.db.get<{ kind?: string; plantedAt?: number; wateredAt?: number; neglect?: boolean }>(path);
  if (!row || row.kind !== "f_planter") return fail("That isn't a growing kit.");
  return { path, row };
}

export const plant: Action = {
  async run(c, a) {
    const { path, row } = await planter(c, a.fid);
    if (typeof row.plantedAt === "number") fail("Something is already growing there.");
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "weedseed") fail("That isn't a seed.");
    w.s.inventory = takeOneFrom(w.s.inventory, slot);
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
    // one watering, once it is thirsty (5 minutes in), keeps the weed good: before that it isn't thirsty, after that it's done
    if ((row.wateredAt ?? 0) >= row.plantedAt! + WATER_MS) fail("It's already been watered. It'll grow fine now.");
    if (c.now < row.plantedAt! + WATER_MS) fail("It isn't thirsty yet. Wait until its water bar is empty.");
    w.s.inventory = w.s.inventory.map((x, i) => (i === slot ? { item: "wateringcan", qty: 1 } : x));
    c.extra[`${path}/wateredAt`] = c.now;
    return {};
  },
};

export const harvest: Action = {
  async run(c, a) {
    const { path, row } = await planter(c, a.fid);
    if (typeof row.plantedAt !== "number") fail("There's nothing planted there.");
    if (c.now - row.plantedAt! < GROW_MS) fail("It isn't ready yet.");
    const ass = !((row.wateredAt ?? 0) >= row.plantedAt! + WATER_MS); // never got its one watering
    const w = await c.user();
    const next = addToInv(w.s.inventory, { item: "weed", qty: 3, ...(ass ? { ass: true } : {}) });
    if (!next) fail("Your inventory is full");
    w.s.inventory = next!;
    c.extra[`${path}/plantedAt`] = null;
    c.extra[`${path}/wateredAt`] = null;
    c.extra[`${path}/neglect`] = null;
    return { ass };
  },
};

/** A lockpick lets you into someone's room until you disconnect (the invite is removed by the browser when you leave). */
export const lockpick: Action = {
  async run(c, a) {
    const owner = text(a.owner, ID_RE, "player");
    if (owner === c.uid) fail("It's your own room.");
    if (!(await c.db.get(`roomsMeta/u_${owner}/owner`))) fail("That room doesn't exist.");
    const w = await c.user();
    const slot = findSlot(w.s.inventory, "lockpick");
    if (slot < 0) fail("You don't have a lockpick.");
    w.s.inventory = takeOneFrom(w.s.inventory, slot);
    c.extra[`roomInvites/u_${owner}/${c.uid}`] = true;
    return {};
  },
};
