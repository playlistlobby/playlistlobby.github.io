import { get, onValue, ref, set, update } from "firebase/database";
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
  /** start (ms, UTC midnight) of the last day this player drew blood; 0 = never */
  lastStabDay: number;
}

export const WARDROBE_SLOTS = 8;
const DAY_MS = 86_400_000;

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
export const canStabToday = (p: Profile): boolean => p.lastStabDay < todayStart();

// ---- profile ----------------------------------------------------------------------
export async function createProfile(uid: string, name: string): Promise<Profile> {
  const inventory = emptyInventory();
  inventory[0] = { item: "knife", qty: 1 };
  inventory[1] = { item: "cd", qty: 1 };
  const profile: Profile = { uid, name, gender: "M", figure: "", blood: START_BLOOD, owned: {}, wardrobe: {}, inventory, lastStabDay: 0 };
  // figure "" marks a player who hasn't been through the customizer yet.
  await set(ref(db, `users/${uid}`), {
    name,
    gender: profile.gender,
    figure: profile.figure,
    blood: profile.blood,
    inventory: { 0: { item: "knife", qty: 1 }, 1: { item: "cd", qty: 1 } },
  });
  return profile;
}

export async function loadProfile(uid: string): Promise<Profile | null> {
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
    lastStabDay: v.lastStabDay ?? 0,
  };

  // Accounts made before blood/inventory existed get the starting kit.
  const patch: Record<string, unknown> = {};
  if (v.blood === undefined) {
    profile.blood = START_BLOOD;
    patch.blood = START_BLOOD;
  }
  if (v.inventory === undefined) {
    profile.inventory[0] = { item: "knife", qty: 1 };
    patch["inventory/0"] = { item: "knife", qty: 1 };
  }
  // everyone owns a CD (it's never consumed: it just goes into the player and comes back)
  if (findSlotAny(profile.inventory, "cd") < 0) {
    const free = profile.inventory.findIndex((s) => s === null);
    if (free >= 0) {
      profile.inventory[free] = { item: "cd", qty: 1 };
      patch[`inventory/${free}`] = { item: "cd", qty: 1 };
    }
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

/** Banks the daily drop of blood. The rules only accept +1, once per UTC day. */
export async function rewardStab(p: Profile): Promise<void> {
  const day = todayStart();
  await update(ref(db, `users/${p.uid}`), { blood: p.blood + 1, lastStabDay: day });
  p.blood += 1;
  p.lastStabDay = day;
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
