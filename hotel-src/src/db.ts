import { get, onValue, ref, serverTimestamp, set, update } from "firebase/database";
import { db, firebaseReady } from "./firebase";
import { DEFAULT_FIGURE, Gender } from "./catalog";
import { DISABLED_ITEMS, emptyInventory, findSlotAny, Inventory, ITEMS, parseInventory, SMOKE_MS, START_BLOOD } from "./items";

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
  /** when the dumpster was last searched (server time, ms; 0 = never) */
  dumpsterAt: number;
  /** how many dead cats this player has cut open (the database rules count them to allow the +5) */
  catsCarved: number;
  /** furniture kept in the toolbox's storage: kind -> how many */
  storage: Record<string, number>;
}

export const SIXTY_GIFT_DELAY_MS = 12 * 3_600_000;
/** the dumpster can be searched once every 3 hours; it gives a cigarette (75%) or a dead cat (25%) */
export const DUMPSTER_MS = 3 * 3_600_000;
export const CAT_CHANCE = 0.25;
export const CAT_BLOOD = 5;

export const WARDROBE_SLOTS = 8;
export const SYRINGE_BLOOD = 2;
const DAY_MS = 86_400_000;
/** Nobody starts with anything any more: 6ixty gives the knife (right away) and the syringe (12 hours later). */
export const STARTER_ITEMS: string[] = ["lighter"];

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
export const canUseSyringe = (p: Profile): boolean => p.syringeDay < todayStart();

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
  const profile: Profile = { uid, name, gender: "M", figure: "", blood: START_BLOOD, owned: {}, wardrobe: {}, inventory, stabs: {}, syringeDay: 0, isAdmin: false, seenDoor: false, sixty: { knifeAt: 0, syringeGiven: false }, dumpsterAt: 0, catsCarved: 0, storage: {} };
  // figure "" marks a player who hasn't been through the customizer yet.
  await set(ref(db, `users/${uid}`), {
    name,
    gender: profile.gender,
    figure: profile.figure,
    blood: profile.blood,
    inventory: first,
    createdAt: serverTimestamp(),
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
    dumpsterAt: Number(v.dumpsterAt) || 0,
    catsCarved: Number(v.catsCarved) || 0,
    storage: Object.fromEntries(Object.entries((v.storage ?? {}) as Record<string, number>).filter(([, n]) => Number(n) > 0).map(([k, n]) => [k, Number(n)])),
    // accounts from before 6ixty already have their knife and syringe: they skip his introduction
    sixty: v.sixty
      ? { knifeAt: Number(v.sixty.knifeAt) || 0, syringeGiven: !!v.sixty.syringeGiven }
      : findSlotAny(parseInventory(v.inventory), "knife") >= 0 || findSlotAny(parseInventory(v.inventory), "syringe") >= 0
        ? { knifeAt: 1, syringeGiven: true }
        : { knifeAt: 0, syringeGiven: false },
  };

  // Accounts made before something existed get it now.
  const patch: Record<string, unknown> = {};
  // a cigarette lit more than a minute ago (the page was closed meanwhile) is a butt by now
  profile.inventory.forEach((s, i) => {
    if (s?.item === "cigarette" && s.lit && Date.now() - s.lit > SMOKE_MS + 5000) {
      profile.inventory[i] = { item: "cigbutt", qty: 1 };
      patch[`inventory/${i}`] = { item: "cigbutt", qty: 1 };
    }
  });
  if (v.blood === undefined) {
    profile.blood = START_BLOOD;
    patch.blood = START_BLOOD;
  }
  if (v.createdAt === undefined) patch.createdAt = serverTimestamp();
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
export async function sixtyGiveKnife(p: Profile): Promise<void> {
  // (a knife that is already in the inventory, e.g. a starter item, isn't given twice)
  const has = findSlotAny(p.inventory, "knife") >= 0;
  const free = p.inventory.findIndex((s) => s === null);
  if (!has && free < 0) throw new Error("Your inventory is full");
  await update(ref(db, `users/${p.uid}`), { ...(has ? {} : { [`inventory/${free}`]: { item: "knife", qty: 1 } }), "sixty/knifeAt": serverTimestamp() });
  if (!has) p.inventory[free] = { item: "knife", qty: 1 };
  p.sixty.knifeAt = serverNow();
}

/** His second gift, once the 12 hours are up: the syringe. */
export async function sixtyGiveSyringe(p: Profile): Promise<void> {
  const has = findSlotAny(p.inventory, "syringe") >= 0;
  const free = p.inventory.findIndex((s) => s === null);
  if (!has && free < 0) throw new Error("Your inventory is full");
  await update(ref(db, `users/${p.uid}`), { ...(has ? {} : { [`inventory/${free}`]: { item: "syringe", qty: 1 } }), "sixty/syringeGiven": true });
  if (!has) p.inventory[free] = { item: "syringe", qty: 1 };
  p.sixty.syringeGiven = true;
}

export const sixtySyringeReady = (p: Profile): boolean => p.sixty.knifeAt > 0 && !p.sixty.syringeGiven && serverNow() - p.sixty.knifeAt >= SIXTY_GIFT_DELAY_MS;

export const dumpsterWaitMs = (p: Profile): number => Math.max(0, p.dumpsterAt + DUMPSTER_MS - serverNow());

/** Rummages through the dumpster: a cigarette (75%) or a dead cat (25%) lands in the inventory. Once every 3 hours. */
export async function searchDumpster(p: Profile): Promise<"cigarette" | "deadcat"> {
  const free = p.inventory.findIndex((s) => s === null);
  if (free < 0) throw new Error("Your inventory is full");
  const item = Math.random() < CAT_CHANCE ? "deadcat" : "cigarette";
  await update(ref(db, `users/${p.uid}`), { dumpsterAt: serverTimestamp(), [`inventory/${free}`]: { item, qty: 1 } });
  p.dumpsterAt = serverNow();
  p.inventory[free] = { item, qty: 1 };
  return item;
}

/** Cuts a dead cat open with the knife: +5 drops of blood, the cat is used up (the rules check you held one and count it). */
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

/** Banks the drop of blood for stabbing `targetUid`. The rules only accept +1, once per person per UTC day. */
export async function rewardStab(p: Profile, targetUid: string): Promise<void> {
  const day = todayStart();
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + 1, lastStabTarget: targetUid, [`stabs/${targetUid}`]: day });
  p.blood += 1;
  p.stabs[targetUid] = day;
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

/** Banks the syringe's 2 drops. The rules only accept +2, once per UTC day. */
export async function rewardSyringe(p: Profile): Promise<void> {
  const day = todayStart();
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + SYRINGE_BLOOD, syringeDay: day });
  p.blood += SYRINGE_BLOOD;
  p.syringeDay = day;
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
