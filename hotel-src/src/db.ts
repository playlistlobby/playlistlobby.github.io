import { get, onValue, ref, serverTimestamp, set, update } from "firebase/database";
import { db, firebaseReady } from "./firebase";
import { DEFAULT_FIGURE, Gender } from "./catalog";
import { combine, DISABLED_ITEMS, emptyInventory, findSlotAny, GROW_MS, InvItem, Inventory, ITEMS, parseInventory, SMOKE_MS, SMOKABLE, STACKABLE, START_BLOOD, WATER_MS } from "./items";

export interface Outfit {
  figure: string;
  gender: Gender;
}

export interface Profile {
  uid: string;
  name: string;
  gender: Gender;
  /** empty until the player finishes the customizer once */
  figure: string;
  /** drops of blood: the hotel's currency */
  blood: number;
  owned: Record<string, true>;
  wardrobe: Record<string, Outfit>;
  inventory: Inventory;
  /** who this player has stabbed, and when: target uid -> start (ms, UTC midnight) of that day. One stab per person per day. */
  stabs: Record<string, number>;
  /** start (ms, UTC midnight) of the last day the syringe was used; 0 = never */
  syringeDay: number;
  /** the admin account (username "admin") gets the Admin app */
  isAdmin: boolean;
  /** has opened the door at least once (until then the door flashes to show where to go) */
  seenDoor: boolean;
  /** how far the player is with 6ixty: knifeAt = when he gave the knife (0 = not met yet), syringeGiven = the second gift (12 hours later) */
  sixty: { knifeAt: number; syringeGiven: boolean };
  /** when each garbage can was last searched (can id -> server time, ms) */
  dumpsters: Record<string, number>;
  /** stabbing gives double blood until this time (server time, ms): set when a cigarette burns down */
  boostUntil: number;
  /** how many times a stab is worth while the bonus lasts (2 cigarette, 3 joint, 4 blunt) */
  boostMult: number;
  /** how many dead cats this player has cut open (the database rules count them to allow the +5) */
  catsCarved: number;
  /** furniture kept in the toolbox's storage: kind -> how many */
  storage: Record<string, number>;
  /** the introduction and 6ixty's jobs: 0 = just woke up, 1 = has the knife, 2 = stabbed the guy (first 5 drops), 3 = has the pill, 4 = introduction done (the door leads to the real basement),
   *  5 = got the money for a lighter (go buy one), 6 = brought it back: got 5 drops and the syringe */
  tutorial: number;
  /** when the first stab happened (server time, ms; 0 = never): 6ixty's next job comes a couple of hours later */
  questAt: number;
  /** when the syringe last drew blood from yourself / from a body bag (server time, ms); each works once every 20 minutes */
  syringeSelfAt: number;
  syringeBagAt: number;
}

/** Furniture everybody starts with, waiting in their toolbox's storage (given once, to new players and to everybody who played before). */
export const STARTER_FURNITURE = ["f_sofa"];

export const SIXTY_GIFT_DELAY_MS = 12 * 3_600_000;
/** each garbage can can be searched once every 10 minutes; every search rolls each of these on its own (so it can give several things, or nothing) */
export const DUMPSTER_MS = 600_000;
export const DUMPSTER_DROPS: Array<{ item: string; chance: number; label: string }> = [
  { item: "weedseed", chance: 0.5, label: "weed seed" },
  { item: "burger", chance: 0.4, label: "burger" },
  { item: "deadcat", chance: 0.3, label: "dead cat" },
  { item: "lighter", chance: 0.05, label: "lighter" },
];
export const CAT_BLOOD = 2;
/** after a cigarette is finished, a stab is worth double for this long */
export const BOOST_MS = 120_000;

export const WARDROBE_SLOTS = 8;
export const SYRINGE_BLOOD = 1;
/** the syringe draws 1 drop from yourself and 1 from a body bag, each once every 20 minutes */
export const SYRINGE_CD_MS = 20 * 60_000;
/** the first stab pays 5 drops; the lighter job pays the price of a lighter, then 5 more with the syringe */
export const FIRST_BLOOD = 5;
export const JOB_REWARD = 5;
/** 6ixty's second job comes this long after the first stab */
export const JOB_DELAY_MS = 2 * 3_600_000;
const DAY_MS = 86_400_000;
/** Nobody starts with anything any more: 6ixty gives the knife (right away) and the syringe (12 hours later). */
export const STARTER_ITEMS: string[] = []; // (the lighter used to start in everybody's pocket; now it's bought in the shop room or found in the bin)

// ---- server clock -----------------------------------------------------------------
// The database rules judge "today" with the server's clock, so the client must too.
let serverOffset = 0;
if (firebaseReady) {
  onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
    serverOffset = Number(snap.val()) || 0;
  });
}
export const serverNow = (): number => Date.now() + serverOffset;
/** Start of the current UTC day, matching `now - now % 86400000` in database.rules.json. */
export const todayStart = (): number => {
  const n = serverNow();
  return n - (n % DAY_MS);
};
export const msUntilTomorrow = (): number => todayStart() + DAY_MS - serverNow();

/** You can stab each person once a day. */
export const canStab = (p: Profile, targetUid: string): boolean => (p.stabs[targetUid] ?? 0) < todayStart();
export const stabsToday = (p: Profile): number => Object.values(p.stabs).filter((d) => d >= todayStart()).length;
export const syringeWaitMs = (p: Profile, who: "self" | "bag"): number => Math.max(0, (who === "self" ? p.syringeSelfAt : p.syringeBagAt) + SYRINGE_CD_MS - serverNow());
/** 6ixty has the lighter job ready: the introduction is over and a couple of hours have passed since the first blood */
export const jobReady = (p: Profile): boolean => p.tutorial === 4 && serverNow() - (p.questAt || p.sixty.knifeAt) >= JOB_DELAY_MS;
export const jobWaitMs = (p: Profile): number => Math.max(0, (p.questAt || p.sixty.knifeAt) + JOB_DELAY_MS - serverNow());

// ---- profile ----------------------------------------------------------------------
export async function createProfile(uid: string, name: string): Promise<Profile> {
  const inventory = emptyInventory();
  const first: Record<number, { item: string; qty: number }> = {};
  // items the admin ticked "starter" (Admin > Shop > 6ixty stock) start in every new player's inventory
  const starters = [...STARTER_ITEMS];
  try {
    const snap = await get(ref(db, "config/shop/items"));
    const cfg = (snap.val() ?? {}) as Record<string, { starter?: boolean }>;
    for (const [id, e] of Object.entries(cfg)) if (e?.starter && ITEMS[id] && !DISABLED_ITEMS.has(id) && !starters.includes(id)) starters.push(id);
  } catch { /* the settings couldn't be read: nobody starts with extras this time */ }
  starters.slice(0, inventory.length).forEach((item, i) => {
    inventory[i] = { item, qty: 1 };
    first[i] = { item, qty: 1 };
  });
  const profile: Profile = { uid, name, gender: "M", figure: "", blood: START_BLOOD, owned: {}, wardrobe: {}, inventory, stabs: {}, syringeDay: 0, isAdmin: false, seenDoor: false, sixty: { knifeAt: 0, syringeGiven: false }, dumpsters: {}, boostUntil: 0, boostMult: 2, catsCarved: 0, storage: Object.fromEntries(STARTER_FURNITURE.map((k) => [k, 1])), tutorial: 0, questAt: 0, syringeSelfAt: 0, syringeBagAt: 0 };
  // figure "" marks a player who hasn't been through the customizer yet.
  await set(ref(db, `users/${uid}`), {
    name,
    gender: profile.gender,
    figure: profile.figure,
    blood: profile.blood,
    inventory: first,
    createdAt: serverTimestamp(),
    starterFurni: true,
    storage: Object.fromEntries(STARTER_FURNITURE.map((k) => [k, 1])),
  });
  return profile;
}

export async function loadProfile(uid: string, isAdmin = false): Promise<Profile | null> {
  const snap = await get(ref(db, `users/${uid}`));
  if (!snap.exists()) return null;
  const v = snap.val();
  const profile: Profile = {
    uid,
    name: v.name,
    gender: v.gender === "F" ? "F" : "M",
    figure: v.figure ?? "",
    blood: v.blood ?? 0,
    owned: v.owned ?? {},
    wardrobe: v.wardrobe ?? {},
    inventory: parseInventory(v.inventory),
    stabs: v.stabs ?? {},
    syringeDay: v.syringeDay ?? 0,
    isAdmin,
    seenDoor: !!v.seenDoor,
    dumpsters: Object.fromEntries(Object.entries((v.dumpsters ?? {}) as Record<string, number>).map(([k, n]) => [k, Number(n) || 0])),
    boostUntil: Number(v.boostUntil) || 0,
    boostMult: Math.min(4, Math.max(2, Number(v.boostMult) || 2)),
    catsCarved: Number(v.catsCarved) || 0,
    storage: Object.fromEntries(Object.entries((v.storage ?? {}) as Record<string, number>).filter(([, n]) => Number(n) > 0).map(([k, n]) => [k, Number(n)])),
    tutorial: 4, // (worked out below)
    questAt: Number(v.questAt) || 0,
    syringeSelfAt: Number(v.syringeSelfAt) || 0,
    syringeBagAt: Number(v.syringeBagAt) || 0,
    // accounts from before 6ixty already have their knife and syringe: they skip his introduction
    sixty: v.sixty
      ? { knifeAt: Number(v.sixty.knifeAt) || 0, syringeGiven: !!v.sixty.syringeGiven }
      : findSlotAny(parseInventory(v.inventory), "knife") >= 0 || findSlotAny(parseInventory(v.inventory), "syringe") >= 0
        ? { knifeAt: 1, syringeGiven: true }
        : { knifeAt: 0, syringeGiven: false },
  };

  // The introduction is for players who never got 6ixty's knife. Players from before it have it: with a syringe they are done with every job (6), without one the lighter job is next (4).
  profile.tutorial = typeof v.tutorial === "number" ? Math.min(6, Math.max(0, v.tutorial)) : isAdmin || profile.sixty.syringeGiven ? 6 : profile.sixty.knifeAt > 0 ? 4 : 0;

  // Accounts made before something existed get it now.
  const patch: Record<string, unknown> = {};
  // a cigarette lit more than a minute ago (the page was closed meanwhile) is a butt by now
  profile.inventory.forEach((s, i) => {
    if (s && SMOKABLE[s.item] && s.lit && Date.now() - s.lit > SMOKE_MS + 5000) {
      profile.inventory[i] = { item: "cigbutt", qty: 1 };
      patch[`inventory/${i}`] = { item: "cigbutt", qty: 1 };
    }
  });
  if (v.blood === undefined) {
    profile.blood = START_BLOOD;
    patch.blood = START_BLOOD;
  }
  if (v.createdAt === undefined) patch.createdAt = serverTimestamp();
  // everybody gets the starter furniture once (players from before it existed get it now); what they do with it afterwards is theirs
  if (!v.starterFurni) {
    for (const k of STARTER_FURNITURE) { profile.storage[k] = (profile.storage[k] ?? 0) + 1; patch[`storage/${k}`] = profile.storage[k]; }
    patch.starterFurni = true;
  }
  Object.assign(patch, compactedPatch(profile)); // close any gaps left in the inventory (older accounts)
  // everyone has the starter items (they're never used up: the CD comes back, the syringe is a daily tool)
  for (const item of STARTER_ITEMS) {
    if (findSlotAny(profile.inventory, item) >= 0) continue;
    const free = profile.inventory.findIndex((s) => s === null);
    if (free < 0) continue;
    profile.inventory[free] = { item, qty: 1 };
    patch[`inventory/${free}`] = { item, qty: 1 };
  }
  if (Object.keys(patch).length) await update(ref(db, `users/${uid}`), patch);
  return profile;
}

export async function saveFigure(p: Profile, figure: string, gender: Gender): Promise<void> {
  await update(ref(db, `users/${p.uid}`), { figure, gender });
  // the public copy other players see (friends list, room avatars)
  // (the admin account is 6ixty: its public look is his, not the one being saved here)
  if (!p.isAdmin) await update(ref(db, `profiles/${p.uid}`), { name: p.name, figure }).catch(() => undefined);
  p.figure = figure;
  p.gender = gender;
}

/** Spends drops of blood and unlocks items in one atomic multi-path write. Throws if the player can't afford it. */
export async function buyItems(p: Profile, keys: string[], cost: number): Promise<void> {
  if (cost > p.blood) throw new Error("Not enough drops of blood");
  const updates: Record<string, unknown> = { blood: p.blood - cost };
  for (const k of keys) updates[`owned/${k}`] = true;
  await update(ref(db, `users/${p.uid}`), updates);
  p.blood -= cost;
  for (const k of keys) p.owned[k] = true;
}

/** Buys a physical item (knife, CD, syringe...) from the shop: it goes into the first free inventory slot. */
export async function buyInventoryItem(p: Profile, item: string, cost: number): Promise<void> {
  if (cost > p.blood) throw new Error("Not enough drops of blood");
  const free = p.inventory.findIndex((s) => s === null);
  if (free < 0) throw new Error("Your inventory is full");
  await update(ref(db, `users/${p.uid}`), { blood: p.blood - cost, [`inventory/${free}`]: { item, qty: 1 } });
  p.blood -= cost;
  p.inventory[free] = { item, qty: 1 };
}

/** Puts one item into the first free inventory slot. Throws if the inventory is full. Returns the slot. */
export async function giveItem(p: Profile, item: string, extra: Record<string, unknown> = {}): Promise<number> {
  const free = p.inventory.findIndex((s) => s === null);
  if (free < 0) throw new Error("Your inventory is full");
  await update(ref(db, `users/${p.uid}`), { [`inventory/${free}`]: { item, qty: 1, ...extra } });
  p.inventory[free] = { item, qty: 1, ...(extra as object) };
  return free;
}

/** Uses up one of the item in a slot (or empties the slot, and the items after it move up to fill the gap). */
export async function consumeSlot(p: Profile, slot: number): Promise<void> {
  const s = p.inventory[slot];
  if (!s) return;
  if (s.qty > 1) {
    await update(ref(db, `users/${p.uid}`), { [`inventory/${slot}/qty`]: s.qty - 1 });
    s.qty -= 1;
  } else {
    await update(ref(db, `users/${p.uid}`), { [`inventory/${slot}`]: null });
    p.inventory[slot] = null;
    await compactInventory(p);
  }
}

/**
 * The inventory never has gaps: every item moves up to fill an empty slot before it. Returns the database changes
 * that make it so (and rearranges `p.inventory` to match); empty when there was nothing to close.
 */
export function compactedPatch(p: { inventory: Inventory }): Record<string, unknown> {
  const items = p.inventory.filter((s): s is NonNullable<typeof s> => !!s);
  const patch: Record<string, unknown> = {};
  for (let i = 0; i < p.inventory.length; i++) {
    const want = items[i] ?? null;
    const had = p.inventory[i];
    if (JSON.stringify(want) === JSON.stringify(had)) continue;
    patch[`inventory/${i}`] = want;
    p.inventory[i] = want;
  }
  return patch;
}

/** Closes any gaps in the inventory and saves it. */
export async function compactInventory(p: Profile): Promise<void> {
  const patch = compactedPatch(p);
  if (Object.keys(patch).length) await update(ref(db, `users/${p.uid}`), patch);
}

/** 6ixty's first gift: the knife. Starts the 12-hour wait for the second gift. */
export async function sixtyGiveKnife(p: Profile, tutorialStep = 0): Promise<void> {
  // (a knife that is already in the inventory, e.g. a starter item, isn't given twice)
  const has = findSlotAny(p.inventory, "knife") >= 0;
  const free = p.inventory.findIndex((s) => s === null);
  if (!has && free < 0) throw new Error("Your inventory is full");
  await update(ref(db, `users/${p.uid}`), { ...(has ? {} : { [`inventory/${free}`]: { item: "knife", qty: 1 } }), "sixty/knifeAt": serverTimestamp(), ...(tutorialStep > p.tutorial ? { tutorial: tutorialStep } : {}) });
  if (!has) p.inventory[free] = { item: "knife", qty: 1 };
  p.sixty.knifeAt = serverNow();
  if (tutorialStep > p.tutorial) p.tutorial = tutorialStep;
}

/** Moves the introduction on (never back). */
export async function setTutorial(p: Profile, step: number): Promise<void> {
  if (step <= p.tutorial) return;
  p.tutorial = step;
  await update(ref(db, `users/${p.uid}`), { tutorial: step });
}

/** 6ixty's pill, at the end of the introduction (it also moves the introduction on to step 3). */
export async function sixtyGivePill(p: Profile): Promise<void> {
  const next = addToInv(p.inventory, { item: "pill", qty: 1 });
  if (!next) throw new Error("Your inventory is full");
  await commitInv(p, next, { [`users/${p.uid}/tutorial`]: 3 });
  p.tutorial = 3;
}

/** The first stab (the introduction's guy): the first 5 drops, and the clock starts for 6ixty's next job. */
export async function rewardFirstStab(p: Profile): Promise<void> {
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + FIRST_BLOOD, tutorial: 2, questAt: serverTimestamp() });
  p.blood += FIRST_BLOOD;
  p.tutorial = 2;
  p.questAt = serverNow();
}

/** The lighter job, part 1: 6ixty hands over what a lighter costs (go and buy one in the shop room). */
export async function sixtyJobMoney(p: Profile, amount: number): Promise<void> {
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + amount, tutorial: 5 });
  p.blood += amount;
  p.tutorial = 5;
}

/** The lighter job, part 2: the lighter is brought back: 5 drops and the syringe. */
export async function sixtyJobReward(p: Profile): Promise<void> {
  const next = addToInv(p.inventory, { item: "syringe", qty: 1 });
  if (!next) throw new Error("Your inventory is full");
  await commitInv(p, next, { [`users/${p.uid}/blood`]: p.blood + JOB_REWARD, [`users/${p.uid}/tutorial`]: 6 });
  p.blood += JOB_REWARD;
  p.tutorial = 6;
}
export const dumpsterWaitMs = (p: Profile, canId: string): number => Math.max(0, (p.dumpsters[canId] ?? 0) + DUMPSTER_MS - serverNow());

// ---- the pocket: adding, stacking, trading items in one write --------------------------------------------------

/** A copy of the inventory with something put in it (stacking where the item stacks); null if there's no room. */
export function addToInv(inv: Inventory, give: InvItem): Inventory | null {
  const out: Inventory = inv.map((s) => (s ? { ...s } : null));
  if (STACKABLE.has(give.item) && !give.lit) {
    const t = out.findIndex((s) => s && s.item === give.item && !s.lit && !s.inPlayer && !!s.ass === !!give.ass && s.qty + give.qty <= 999);
    if (t >= 0) { out[t]!.qty += give.qty; return out; }
  }
  const f = out.findIndex((s) => s === null);
  if (f < 0) return null;
  out[f] = { ...give };
  return out;
}

/** A copy of the inventory with one of the item in `slot` used up. */
export function takeOneFrom(inv: Inventory, slot: number): Inventory {
  const out: Inventory = inv.map((s) => (s ? { ...s } : null));
  const s = out[slot];
  if (!s) return out;
  if (s.qty > 1) s.qty -= 1; else out[slot] = null;
  return out;
}

/** A copy of the inventory with `qty` of the item in `slot` used up (the slot empties when it's all gone). */
export function takeQtyFrom(inv: Inventory, slot: number, qty: number): Inventory {
  const out: Inventory = inv.map((s) => (s ? { ...s } : null));
  const s = out[slot];
  if (!s) return out;
  if (s.qty > qty) s.qty -= qty; else out[slot] = null;
  return out;
}

/** Saves a new inventory (gaps closed) together with other changes, as one atomic write from the root. `extra` keys are full database paths. */
export async function commitInv(p: Profile, next: Inventory, extra: Record<string, unknown> = {}): Promise<void> {
  const kept = next.filter((s): s is InvItem => !!s);
  const after: Inventory = next.map((_, i) => kept[i] ?? null);
  const patch: Record<string, unknown> = {};
  for (let i = 0; i < after.length; i++) if (JSON.stringify(after[i]) !== JSON.stringify(p.inventory[i] ?? null)) patch[`users/${p.uid}/inventory/${i}`] = after[i];
  await update(ref(db), { ...patch, ...extra });
  for (let i = 0; i < after.length; i++) p.inventory[i] = after[i];
}

/** Rummages through a garbage can: one thing out of a weighted pick (weed seed, burger, dead cat, lighter). Each can: once every 10 minutes. */
export async function searchDumpster(p: Profile, canId: string): Promise<string> {
  const total = DUMPSTER_DROPS.reduce((a, d) => a + d.chance, 0);
  let r = Math.random() * total;
  let item = DUMPSTER_DROPS[0].item;
  for (const d of DUMPSTER_DROPS) { if (r < d.chance) { item = d.item; break; } r -= d.chance; }
  const next = addToInv(p.inventory, { item, qty: 1 });
  if (!next) throw new Error("Your inventory is full");
  await commitInv(p, next, { [`users/${p.uid}/dumpsters/${canId}`]: serverTimestamp() });
  p.dumpsters[canId] = serverNow();
  return item;
}

/** Buys something from the vending machine (a stack of 15 cigarettes comes as one stack). */
export async function buyStock(p: Profile, give: InvItem, price: number): Promise<void> {
  if (p.blood < price) throw new Error(`You need ${price - p.blood} more drops`);
  const next = addToInv(p.inventory, give);
  if (!next) throw new Error("Your inventory is full");
  await commitInv(p, next, { [`users/${p.uid}/blood`]: p.blood - price });
  p.blood -= price;
}

/** Uses two pocket items on each other (weed + paper, ...): one of each is used up, the result goes in. Returns the message. */
export async function combineSlots(p: Profile, a: number, b: number): Promise<string> {
  const ia = p.inventory[a], ib = p.inventory[b];
  if (!ia || !ib || a === b) throw new Error("Those don't go together.");
  const res = combine(ia, ib);
  if (!res) throw new Error("Those don't go together.");
  let next = takeOneFrom(p.inventory, a);
  next = takeOneFrom(next, a === b ? a : b);
  // taking from a stack keeps its slot, taking the last one empties it: the slots haven't moved yet, so both indexes were valid
  const added = addToInv(next, res.give);
  if (!added) throw new Error("Your inventory is full");
  await commitInv(p, added);
  return res.note;
}

/** Fills the empty watering can in `slot` at the sink. */
export async function fillCan(p: Profile, slot: number): Promise<void> {
  if (p.inventory[slot]?.item !== "wateringcan") throw new Error("That can isn't empty.");
  const next: Inventory = p.inventory.map((s) => (s ? { ...s } : null));
  next[slot] = { item: "wateringcan_full", qty: 1 };
  await commitInv(p, next);
}

/** Lights a cigarette, joint or blunt (a stack gives up one, which goes in its own slot). */
export async function lightItem(p: Profile, slot: number): Promise<number> {
  const s = p.inventory[slot];
  if (!s || !SMOKABLE[s.item] || s.lit) throw new Error("That can't be lit.");
  const t = serverNow();
  let next: Inventory;
  if (s.qty > 1) {
    const one: InvItem = { ...s, qty: 1, lit: t };
    const rest = p.inventory.map((x, i) => (i === slot && x ? { ...x, qty: x.qty - 1 } : x ? { ...x } : null));
    const free = rest.findIndex((x) => x === null);
    if (free < 0) throw new Error("Your inventory is full");
    rest[free] = one;
    next = rest;
  } else {
    next = p.inventory.map((x, i) => (i === slot && x ? { ...x, lit: t } : x ? { ...x } : null));
  }
  await commitInv(p, next);
  return t;
}

// ---- growing weed in a growing kit ---------------------------------------------------------------------------
const furniPath = (roomId: string, fid: string) => `roomsMeta/${roomId}/furni/${fid}`;
export interface Plant { at: number; water: number; neglect: boolean }
export const plantProgress = (pl: Plant): number => Math.min(1, (serverNow() - pl.at) / GROW_MS);
export const plantWater = (pl: Plant): number => Math.max(0, 1 - (serverNow() - pl.water) / WATER_MS);

/** Plants a seed from your pocket in an empty growing kit. */
export async function plantSeed(p: Profile, roomId: string, fid: string, seedSlot: number): Promise<void> {
  if (p.inventory[seedSlot]?.item !== "weedseed") throw new Error("That isn't a seed.");
  await commitInv(p, takeOneFrom(p.inventory, seedSlot), {
    [`${furniPath(roomId, fid)}/plantedAt`]: serverTimestamp(),
    [`${furniPath(roomId, fid)}/wateredAt`]: serverTimestamp(),
    [`${furniPath(roomId, fid)}/neglect`]: null,
  });
}

/** Waters a planted kit with a full watering can (the can is empty afterwards). A plant that had run dry is remembered as neglected. */
export async function waterPlant(p: Profile, roomId: string, fid: string, pl: Plant, canSlot: number): Promise<void> {
  if (p.inventory[canSlot]?.item !== "wateringcan_full") throw new Error("That can is empty.");
  const next: Inventory = p.inventory.map((s) => (s ? { ...s } : null));
  next[canSlot] = { item: "wateringcan", qty: 1 };
  const dry = serverNow() - pl.water > WATER_MS;
  await commitInv(p, next, {
    [`${furniPath(roomId, fid)}/wateredAt`]: serverTimestamp(),
    ...(dry && !pl.neglect ? { [`${furniPath(roomId, fid)}/neglect`]: true } : {}),
  });
}

/** Picks a grown plant: 3 weed ("ass weed" if it ever ran dry), and the kit is empty again. */
export async function harvestPlant(p: Profile, roomId: string, fid: string, pl: Plant): Promise<{ ass: boolean }> {
  if (serverNow() - pl.at < GROW_MS) throw new Error("It isn't ready yet.");
  const ass = pl.neglect || serverNow() - pl.water > WATER_MS;
  const next = addToInv(p.inventory, { item: "weed", qty: 3, ...(ass ? { ass: true } : {}) });
  if (!next) throw new Error("Your inventory is full");
  await commitInv(p, next, {
    [`${furniPath(roomId, fid)}/plantedAt`]: null,
    [`${furniPath(roomId, fid)}/wateredAt`]: null,
    [`${furniPath(roomId, fid)}/neglect`]: null,
  });
  return { ass };
}

/** Cuts a dead cat open with the knife: +2 drops of blood, the cat is used up (the rules check you held one and count it). */
export async function carveCat(p: Profile, slot: number): Promise<void> {
  if (p.inventory[slot]?.item !== "deadcat") throw new Error("That isn't a dead cat");
  const before = p.inventory.slice();
  const after = before.map((s, i) => (i === slot ? null : s)).filter((s): s is NonNullable<typeof s> => !!s);
  const patch: Record<string, unknown> = {};
  for (let i = 0; i < before.length; i++) {
    const want = after[i] ?? null;
    if (JSON.stringify(want) !== JSON.stringify(before[i])) patch[`inventory/${i}`] = want;
  }
  await update(ref(db, `users/${p.uid}`), { ...patch, blood: p.blood + CAT_BLOOD, catsCarved: p.catsCarved + 1 });
  p.blood += CAT_BLOOD;
  p.catsCarved += 1;
  for (let i = 0; i < before.length; i++) p.inventory[i] = after[i] ?? null;
}

/** What a stab is worth right now: 1 drop, or more for a while after you finished a cigarette (x2), joint (x3) or blunt (x4). */
export const stabGain = (p: Profile): number => (p.boostUntil > serverNow() ? p.boostMult : 1);

/** Banks the blood for stabbing `targetUid` (once per person per UTC day; the rules accept +1, or +2 while the cigarette bonus lasts). Returns what it was worth. */
export async function rewardStab(p: Profile, targetUid: string): Promise<number> {
  const day = todayStart();
  const gain = stabGain(p);
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + gain, lastStabTarget: targetUid, [`stabs/${targetUid}`]: day });
  p.blood += gain;
  p.stabs[targetUid] = day;
  return gain;
}

/** Buys a piece of furniture from the shop room: the drops are taken and the piece lands in the first free inventory slot, in one write. */
export async function buyFurni(p: Profile, kind: string, price: number): Promise<void> {
  if (p.blood < price) throw new Error(`You need ${price - p.blood} more drops`);
  const free = p.inventory.findIndex((s) => s === null);
  if (free < 0) throw new Error("Your inventory is full");
  await update(ref(db, `users/${p.uid}`), { blood: p.blood - price, [`inventory/${free}`]: { item: kind, qty: 1 } });
  p.blood -= price;
  p.inventory[free] = { item: kind, qty: 1 };
}

/** Banks a drop of blood picked up in Flappy Bird. The rules want a gap of at least 20 seconds between drops (25 pipes take longer than that). */
export async function rewardFlappyDrop(p: Profile): Promise<void> {
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + 1, flappyAt: serverTimestamp() });
  p.blood += 1;
}

/** Banks the syringe's drop: 1 from yourself or 1 from a body bag, each once every 20 minutes (the rules check the 20 minutes). */
export async function rewardSyringe(p: Profile, who: "self" | "bag"): Promise<void> {
  const field = who === "self" ? "syringeSelfAt" : "syringeBagAt";
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + SYRINGE_BLOOD, [field]: serverTimestamp() });
  p.blood += SYRINGE_BLOOD;
  if (who === "self") p.syringeSelfAt = serverNow(); else p.syringeBagAt = serverNow();
}

export async function saveOutfit(p: Profile, slot: number, outfit: Outfit): Promise<void> {
  await set(ref(db, `users/${p.uid}/wardrobe/${slot}`), outfit);
  p.wardrobe[slot] = outfit;
}

export async function deleteOutfit(p: Profile, slot: number): Promise<void> {
  await set(ref(db, `users/${p.uid}/wardrobe/${slot}`), null);
  delete p.wardrobe[slot];
}

export { DEFAULT_FIGURE };
