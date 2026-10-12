import { get, onValue, ref, serverTimestamp, set, update } from "firebase/database";
import { db, firebaseReady } from "./firebase";
import { DEFAULT_FIGURE, Gender } from "./catalog";
import { emptyInventory, findSlotAny, Inventory, parseInventory, START_BLOOD } from "./items";

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
}

export const WARDROBE_SLOTS = 8;
export const SYRINGE_BLOOD = 2;
const DAY_MS = 86_400_000;
/** What every player starts with (and gets back if it's missing). */
export const STARTER_ITEMS = ["knife", "syringe"]; // the CD is switched off for now (see DISABLED_ITEMS in items.ts)

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
  STARTER_ITEMS.forEach((item, i) => {
    inventory[i] = { item, qty: 1 };
    first[i] = { item, qty: 1 };
  });
  const profile: Profile = { uid, name, gender: "M", figure: "", blood: START_BLOOD, owned: {}, wardrobe: {}, inventory, stabs: {}, syringeDay: 0, isAdmin: false, seenDoor: false };
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
  };

  // Accounts made before something existed get it now.
  const patch: Record<string, unknown> = {};
  if (v.blood === undefined) {
    profile.blood = START_BLOOD;
    patch.blood = START_BLOOD;
  }
  if (v.createdAt === undefined) patch.createdAt = serverTimestamp();
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
  await update(ref(db, `profiles/${p.uid}`), { name: p.name, figure }).catch(() => undefined);
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

/** Banks the drop of blood for stabbing `targetUid`. The rules only accept +1, once per person per UTC day. */
export async function rewardStab(p: Profile, targetUid: string): Promise<void> {
  const day = todayStart();
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + 1, lastStabTarget: targetUid, [`stabs/${targetUid}`]: day });
  p.blood += 1;
  p.stabs[targetUid] = day;
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
