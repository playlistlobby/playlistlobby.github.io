import { get, onValue, ref, serverTimestamp, set, Unsubscribe } from "firebase/database";
import { db, firebaseReady } from "./firebase";
import { act } from "./api";
import { DEFAULT_FIGURE, Gender } from "./catalog";
import { DISABLED_ITEMS, Inventory, INV_SIZE, itemDef } from "./items";
import {
  DAY_MS, parseEconomy, plantProgressAt, plantThirsty as plantThirstyAt, plantWatered as plantWateredAt, plantWaterAt, Snapshot, stabGainAt, SYRINGE_CD_MS, JOB_DELAY_MS,
} from "./shared/economy";

// The numbers of the economy live in shared/economy.ts (the server uses the very same ones).
export {
  BULK_AT, DAY_MS, DROP_LIFE_BULK_MS, DROP_LIFE_MS, DUMPSTER_DROPS, DUMPSTER_MS, FIRST_BLOOD, FLAPPY_GAP_MS, JOB_DELAY_MS, JOB_REWARD, MAX_FURNI,
  STARTER_FURNITURE, STARTER_ITEMS, STORAGE_MAX_ITEMS, STORAGE_MAX_PIECES, SYRINGE_BLOOD, SYRINGE_CD_MS, addToInv, takeOneFrom, takeQtyFrom,
} from "./shared/economy";
export type { Plant } from "./shared/economy";
import type { Plant } from "./shared/economy";

export interface Outfit {
  figure: string;
  gender: Gender;
}

/** The player. The economy part (blood, pocket, toolbox, quest steps, cooldowns) is owned by the server: it is only ever replaced with what the server says. */
export interface Profile {
  uid: string;
  name: string;
  gender: Gender;
  /** empty until the player finishes the customizer once */
  figure: string;
  /** drops of blood: the hotel's currency */
  blood: number;
  owned: Record<string, true>;
  /** the account's start (ms) and what was bought today from the vending machine's limited stock */
  joinAt: number;
  vend: Record<string, { day: number; n: number }>;
  /** the things this player has mixed and collected before (the mixer shows "?" for anything else) */
  mixed: Record<string, true>;
  wardrobe: Record<string, Outfit>;
  inventory: Inventory;
  /** who this player has stabbed, and when: target uid -> start (ms, UTC midnight) of that day. One stab per person per day. */
  stabs: Record<string, number>;
  /** start (ms, UTC midnight) of the last day the old daily syringe was used (kept for the admin's player view) */
  syringeDay: number;
  /** the admin account (username "admin") gets the Admin app */
  isAdmin: boolean;
  /** has opened the door at least once (until then the door flashes to show where to go) */
  seenDoor: boolean;
  /** may place furniture and posters in other players' rooms (set by hand on the account, see users/<uid>/decorator) */
  decorator: boolean;
  /** may use the test commands (/giveblud, /give, /weed, /skip, /greenscreen), like the admin (set by hand on the account, see users/<uid>/commands) */
  commands: boolean;
  /** how far the player is with 6ixty: knifeAt = when he gave the knife (0 = not met yet) */
  sixty: { knifeAt: number; syringeGiven: boolean };
  /** when each garbage can was last searched (can id -> server time, ms) */
  dumpsters: Record<string, number>;
  /** stabbing gives more blood until this time (server time, ms): set when a cigarette / joint / blunt burns down */
  boostUntil: number;
  /** how many times a stab is worth while the bonus lasts (2 cigarette, 3 joint, 4 blunt) */
  boostMult: number;
  /** walking twice as fast until this time (thc-a, research chemical) */
  speedUntil: number;
  /** flashing and smoking until this time (research chemical) */
  chemUntil: number;
  /** how many times faster you walk while speedUntil lasts (2, or 4 with the super pill) */
  speedMult: number;
  /** the lean (codeine) works until this time; you hold the cup until cupUntil (server time, ms) */
  leanUntil: number;
  cupUntil: number;
  /** a shroom or DMT lets you walk into any room until this time (server time, ms) */
  shroomUntil: number;
  catsCarved: number;
  /** how many of the landlord's room upgrades are bought (0..3) */
  roomLevel: number;
  /** furniture and things kept in the toolbox's storage: kind (or "ass_<item>") -> how many */
  storage: Record<string, number>;
  /** what is in the stash box (the landlord sells it): item (or "ass_<item>", or a pot / mixer) -> how many */
  stash: Record<string, number>;
  /** blood given away in trades in the last 24 hours (see TRADE_BLOOD_CAP) */
  tradeCap: { at: number; n: number };
  /** no 24 hour limit on blood in trades (see Snapshot.noTradeLimit) */
  noTradeLimit: boolean;
  /** the introduction and 6ixty's jobs: 0 = just woke up, 1 = has the knife, 2 = stabbed the guy (first 5 drops), 3 = has the pill, 4 = introduction done (the door leads to the real basement),
   *  5 = got the money for a lighter (go buy one), 6 = brought it back: got 5 drops and the syringe */
  tutorial: number;
  /** when the first stab happened (server time, ms; 0 = never): 6ixty's next job comes a couple of hours later */
  questAt: number;
  /** when the syringe last drew blood from yourself / from a body bag (server time, ms); each works once every 20 minutes */
  syringeSelfAt: number;
  syringeBagAt: number;
  flappyAt: number;
}

export const WARDROBE_SLOTS = 8;

// ---- server clock -----------------------------------------------------------------
// "Today" is judged with the server's clock, so the browser must too.
let serverOffset = 0;
if (firebaseReady) {
  onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
    serverOffset = Number(snap.val()) || 0;
  });
}
export const serverNow = (): number => Date.now() + serverOffset;
/** Start of the current UTC day. */
export const todayStart = (): number => {
  const n = serverNow();
  return n - (n % DAY_MS);
};
export const msUntilTomorrow = (): number => todayStart() + DAY_MS - serverNow();

/** You can stab each person once a day (the server has the final say). */
export const canStab = (p: Profile, targetUid: string): boolean => (p.stabs[targetUid] ?? 0) < todayStart();
export const stabsToday = (p: Profile): number => Object.values(p.stabs).filter((d) => d >= todayStart()).length;
export const syringeWaitMs = (p: Profile, who: "self" | "bag"): number => Math.max(0, (who === "self" ? p.syringeSelfAt : p.syringeBagAt) + SYRINGE_CD_MS - serverNow());
/** 6ixty has the lighter job ready: the introduction is over and a couple of hours have passed since the first blood */
export const jobReady = (p: Profile): boolean => p.tutorial === 4 && serverNow() - (p.questAt || p.sixty.knifeAt) >= JOB_DELAY_MS;
export const jobWaitMs = (p: Profile): number => Math.max(0, (p.questAt || p.sixty.knifeAt) + JOB_DELAY_MS - serverNow());
export const dumpsterWaitMs = (p: Profile, canId: string): number => Math.max(0, (p.dumpsters[canId] ?? 0) + (p.leanUntil > serverNow() ? 300_000 : 600_000) - serverNow());
/** What a stab is worth right now: 1 drop, or more for a while after you finished a cigarette (x2), joint (x3) or blunt (x4). */
export const stabGain = (p: Profile): number => stabGainAt(p, serverNow());
export const plantProgress = (pl: Plant): number => plantProgressAt(pl, serverNow());
export const plantWater = (pl: Plant): number => plantWaterAt(pl, serverNow());
export const plantThirsty = (pl: Plant): boolean => plantThirstyAt(pl, serverNow());
export const plantWatered = (pl: Plant): boolean => plantWateredAt(pl);

// ---- keeping the profile in step with the server ---------------------------------------------------------------------
/** Replaces the economy part of the profile with what the server says (the pocket array stays the same array). */
export function applyState(p: Profile, s: Snapshot): void {
  p.blood = s.blood;
  p.owned = s.owned;
  p.mixed = s.mixed;
  p.joinAt = s.joinAt;
  p.vend = s.vend;
  p.storage = s.storage;
  p.stash = s.stash;
  p.tradeCap = s.tradeCap;
  p.noTradeLimit = s.noTradeLimit;
  p.stabs = s.stabs;
  p.dumpsters = s.dumpsters;
  p.boostUntil = s.boostUntil;
  p.boostMult = s.boostMult;
  p.speedUntil = s.speedUntil;
  p.chemUntil = s.chemUntil;
  p.speedMult = s.speedMult;
  p.leanUntil = s.leanUntil;
  p.cupUntil = s.cupUntil;
  p.shroomUntil = s.shroomUntil;
  p.catsCarved = s.catsCarved;
  p.roomLevel = s.roomLevel;
  p.syringeSelfAt = s.syringeSelfAt;
  p.syringeBagAt = s.syringeBagAt;
  p.flappyAt = s.flappyAt;
  p.tutorial = s.tutorial;
  p.questAt = s.questAt;
  p.sixty = s.sixty;
  for (let i = 0; i < INV_SIZE; i++) p.inventory[i] = s.inventory[i] ?? null;
}

const itemOk = (id: string): boolean => !!itemDef(id) && !DISABLED_ITEMS.has(id);

/** Asks the server to do something and applies the answer to the profile. Resolves with whatever extra the server said (a message, an item...). */
export async function call<T = Record<string, any>>(p: Profile, action: string, args: object = {}): Promise<T> {
  const r = await act<T>(action, args);
  if (r.state) applyState(p, r.state);
  window.dispatchEvent(new Event("pocket-changed"));
  return r.data;
}

/** Follows the economy part of the player's database node (what the server wrote, e.g. the other side of a trade); returns the stop function. */
export function watchEconomy(p: Profile): Unsubscribe {
  return onValue(ref(db, `users/${p.uid}`), (snap) => {
    if (!snap.exists()) return;
    applyState(p, parseEconomy(snap.val(), itemOk, p.isAdmin));
    window.dispatchEvent(new Event("pocket-changed"));
  }, () => undefined);
}

// ---- profile ----------------------------------------------------------------------
/** A brand-new player: the base profile (no blood, nothing carried); the server hands out the starter things on the first sync. */
export async function createProfile(uid: string, name: string): Promise<Profile> {
  // figure "" marks a player who hasn't been through the customizer yet.
  await set(ref(db, `users/${uid}`), { name, gender: "M", figure: "", blood: 0, createdAt: serverTimestamp() });
  const p = await loadProfile(uid);
  if (!p) throw new Error("Couldn't create the profile.");
  return p;
}

export async function loadProfile(uid: string, isAdmin = false): Promise<Profile | null> {
  const snap = await get(ref(db, `users/${uid}`));
  if (!snap.exists()) return null;
  const v = snap.val();
  const { state } = await act("sync"); // the server gives accounts made before something existed what they are due
  if (!state) throw new Error("The server had a problem. Try again.");
  const profile: Profile = {
    uid,
    name: v.name,
    gender: v.gender === "F" ? "F" : "M",
    figure: v.figure ?? "",
    blood: 0,
    owned: {},
    mixed: {},
    joinAt: 0,
    vend: {},
    wardrobe: v.wardrobe ?? {},
    inventory: Array.from({ length: INV_SIZE }, () => null),
    stabs: {},
    syringeDay: v.syringeDay ?? 0,
    isAdmin,
    seenDoor: !!v.seenDoor,
    decorator: v.decorator === true,
    commands: v.commands === true,
    sixty: { knifeAt: 0, syringeGiven: false },
    dumpsters: {},
    boostUntil: 0,
    boostMult: 2,
    speedUntil: 0,
    chemUntil: 0,
    speedMult: 2,
    leanUntil: 0,
    cupUntil: 0,
    shroomUntil: 0,
    catsCarved: 0,
    roomLevel: 0,
    storage: {},
    stash: {},
    tradeCap: { at: 0, n: 0 },
    noTradeLimit: false,
    tutorial: 0,
    questAt: 0,
    syringeSelfAt: 0,
    syringeBagAt: 0,
    flappyAt: 0,
  };
  applyState(profile, state);
  return profile;
}

export async function saveFigure(p: Profile, figure: string, gender: Gender): Promise<void> {
  await call(p, "setLook", { figure, gender });
  p.figure = figure;
  p.gender = gender;
}

/** Buys clothes: the server charges what they cost (the price list the admin's game published), whatever the browser thinks. */
export async function buyItems(p: Profile, keys: string[], _cost?: number): Promise<void> {
  await call(p, "buyClothes", { keys });
}

/** Buys something from 6ixty's shelf (it goes into the pocket). */
export async function buyInventoryItem(p: Profile, item: string, _price?: number): Promise<void> {
  await call(p, "buySixty", { item });
}

/** Buys from the vending machine by its stock id (a pack of 15 cigarettes comes as one stack). */
export async function buyStock(p: Profile, id: string): Promise<void> {
  await call(p, "buyVending", { id });
}

/** A poster from the wall of the shop room (the picture is chosen when it is hung in your room). */
export async function buyPosterItem(p: Profile): Promise<void> {
  await call(p, "buyPoster", {});
}

/** The Freakme CD from the record player in the shop, for blood (once per player). */
export async function buyRecordCd(p: Profile): Promise<void> {
  await call(p, "buyRecord", {});
}

/** Hands over the CDs that have been paid for (the payment may take a few seconds to arrive). Resolves with the item ids that landed in the pocket. */
export async function claimPurchases(p: Profile): Promise<{ items: string[]; full: boolean }> {
  const r = await call<{ items?: string[]; full?: boolean }>(p, "claimPurchases", {});
  return { items: r.items ?? [], full: !!r.full };
}

/** Buys the next room upgrade from the landlord (the server checks the price and makes the room bigger). Resolves with the new size. */
export async function buyRoomUpgrade(p: Profile): Promise<number> {
  return Number((await call<{ size?: number }>(p, "buyRoomUpgrade", {})).size) || 0;
}

/** New colours for your floor / walls / carpet (hex, or "none" for no carpet), 2 drops for each part that changes. Resolves with what it cost. */
export async function buyRoomColors(p: Profile, parts: { floor?: string; wall?: string; rug?: string }): Promise<number> {
  return Number((await call<{ price?: number }>(p, "roomColors", parts)).price) || 0;
}

/** A new look for the bed and/or the bag of clothes (ids from shared/skins.ts, or "default"). Each look is paid once. Resolves with what it cost. */
export async function buyRoomSkins(p: Profile, parts: { bed?: string; bag?: string }): Promise<number> {
  return Number((await call<{ price?: number }>(p, "roomSkins", parts)).price) || 0;
}

/** Buys one of today's pieces in the shop room. */
export async function buyFurni(p: Profile, kind: string, _price?: number): Promise<void> {
  await call(p, "buyFurni", { kind });
}

// ---- 6ixty's steps ----------------------------------------------------------------------------------------------------
/** 6ixty's first gift: the knife (also step 1 of the introduction). */
export const sixtyGiveKnife = (p: Profile): Promise<unknown> => call(p, "sixty", { step: "knife" });
/** 6ixty's pill, at the end of the introduction. */
export const sixtyGivePill = (p: Profile): Promise<unknown> => call(p, "sixty", { step: "pill" });
/** The first stab (the introduction's guy): the first 5 drops. */
export const rewardFirstStab = (p: Profile): Promise<unknown> => call(p, "sixty", { step: "firstStab" });
/** The lighter job, part 1: he hands over what a lighter costs. Resolves with the amount. */
export async function sixtyJobMoney(p: Profile): Promise<number> {
  return Number((await call<{ amount?: number }>(p, "sixty", { step: "jobMoney" })).amount) || 0;
}
/** The lighter job, part 2: the lighter is brought back: 5 drops and the syringe. */
export const sixtyJobReward = (p: Profile): Promise<unknown> => call(p, "sixty", { step: "jobReward" });

// ---- things you do with what you carry ---------------------------------------------------------------------------------
export const swallowPill = (p: Profile, slot: number): Promise<unknown> => call(p, "usePill", { slot });
export const eatItem = (p: Profile, slot: number): Promise<unknown> => call(p, "eat", { slot });
/** Rummages through a garbage can. Resolves with the item that came out. */
export async function searchDumpster(p: Profile, canId: string, roomId: string): Promise<string[]> {
  const r = await call<{ item?: string; items?: string[] }>(p, "dumpster", { can: canId, room: roomId });
  return r.items && r.items.length ? r.items.map(String) : [String(r.item)];
}
/** Taps a piece with several looks or animations: the server sends it on to its next one. */
export const useFurniState = (p: Profile, room: string, id: string): Promise<{ st?: number }> => call(p, "furniState", { room, id });

/** Swallows the super pill or drinks the lean (codeine) in a slot. */
export const consumeItem = (p: Profile, slot: number): Promise<{ kind?: string; speedMs?: number; speedMult?: number; leanMs?: number; cupMs?: number; ms?: number; tripMs?: number }> => call(p, "consume", { slot });
/** Uses two pocket items on each other (weed + paper, ...). Resolves with the message. */
export async function combineSlots(p: Profile, a: number, b: number): Promise<string> {
  return String((await call<{ note?: string }>(p, "combine", { a, b })).note ?? "");
}
export const fillCan = (p: Profile, slot: number): Promise<unknown> => call(p, "fillCan", { slot });
/** Lights a cigarette, joint or blunt (needs a lighter). Resolves with when it was lit (server time). */
export async function lightItem(p: Profile, slot: number): Promise<number> {
  return Number((await call<{ litAt?: number }>(p, "light", { slot })).litAt) || serverNow();
}
/** A smoke that has burned for a minute: it becomes a butt and gives its bonus (or knocks you out, for ass weed). */
export const finishSmoke = (p: Profile, slot: number): Promise<{ passOut?: boolean; mult?: number; boostMs?: number; speedMs?: number; chemMs?: number; shroomMs?: number; chudMs?: number }> => call(p, "finishSmoke", { slot });

// ---- growing weed in a growing kit ---------------------------------------------------------------------------
export const plantSeed = (p: Profile, _roomId: string, fid: string, seedSlot: number): Promise<unknown> => call(p, "plant", { fid, slot: seedSlot });
export const waterPlant = (p: Profile, _roomId: string, fid: string, _pl: Plant, canSlot: number): Promise<unknown> => call(p, "water", { fid, slot: canSlot });
export async function harvestPlant(p: Profile, _roomId: string, fid: string, _pl: Plant): Promise<{ ass: boolean; crop?: string; qty?: number; seed?: string }> {
  const r = await call<{ ass?: boolean; crop?: string; qty?: number; seed?: string }>(p, "harvest", { fid });
  return { ass: !!r.ass, crop: r.crop, qty: r.qty, seed: r.seed };
}

// ---- blood ---------------------------------------------------------------------------------------------------------------
/** Banks the blood for stabbing `targetUid` in `roomId` (the server checks the room, the distance and the once-a-day rule). Returns what it was worth. */
export async function rewardStab(p: Profile, targetUid: string, roomId: string): Promise<number> {
  return Number((await call<{ gain?: number }>(p, "stab", { target: targetUid, room: roomId })).gain) || 1;
}
/** A Flappy Bird run starts (the server notes the time: a score is only believed if it fits the time the run took). */
export const flappyRunStart = (p: Profile): Promise<unknown> => call(p, "flappyStart");
/** The score of the run that just ended: it goes on the scoreboard if it is the player's best. */
export const flappySubmit = (p: Profile, score: number): Promise<{ best: number; improved: boolean }> => call(p, "flappyScore", { score });
export interface BoardRow { uid: string; name: string; score: number }
/** Follows the Flappy Bird scoreboard (best score per player, highest first); returns the stop function. */
export function watchFlappyBoard(cb: (rows: BoardRow[]) => void): Unsubscribe {
  return onValue(ref(db, "flappyBoard"), (snap) => {
    const rows = Object.entries<any>(snap.val() ?? {}).filter(([, v]) => v && typeof v.score === "number").map(([uid, v]) => ({ uid, name: String(v.name ?? "?"), score: v.score as number }));
    rows.sort((a, b) => b.score - a.score);
    cb(rows);
  }, () => cb([]));
}
/** A drop of blood caught in Flappy Bird. */
export const rewardFlappyDrop = (p: Profile, roomId: string): Promise<unknown> => call(p, "flappy", { room: roomId });
/** The syringe's drop: from yourself, or from a body bag in the room. */
export const rewardSyringe = (p: Profile, who: "self" | "bag", roomId: string): Promise<unknown> => call(p, "syringe", { who, room: roomId });

/** Sends an item from a pocket slot to a friend as a gift (items only; they can decline it). */
export async function giftSend(p: Profile, to: string, slot: number, qty = 1): Promise<void> {
  await call(p, "giftSend", { to, slot, qty });
}
/** Accepts a gift into your pocket, or declines it (it then waits for the sender to take back). */
export async function giftAnswer(p: Profile, id: string, accept: boolean): Promise<{ item?: string; qty?: number }> {
  return call<{ item?: string; qty?: number }>(p, "giftAnswer", { id, accept });
}
/** Takes back a gift that was declined. */
export async function giftCollect(p: Profile, id: string): Promise<void> {
  await call(p, "giftCollect", { id });
}

/** Admin: a backup right now. */
export async function backupNow(p: Profile, note?: string): Promise<void> {
  await call(p, "backupNow", note ? { note } : {});
}
/** Admin: put the server back to the backup taken at `ts` and ban `ban` (account ids). Everything stops for a moment while it runs. */
export async function rollbackServer(p: Profile, ts: number, ban: string[]): Promise<{ users: number; rooms: number; safety: number }> {
  return call<{ users: number; rooms: number; safety: number }>(p, "backupRollback", { ts, confirm: true, ban });
}
/** Admin: ban or unban an account. */
export async function banAccount(p: Profile, uid: string, on: boolean, reason?: string): Promise<void> {
  await call(p, "banPlayer", { uid, on, ...(reason ? { reason } : {}) });
}

/** The landlord's stash box (20 drops, once). It then stands in your room. */
export async function buyStashbox(p: Profile): Promise<number> {
  return Number((await call<{ price?: number }>(p, "buyStashbox", {})).price) || 0;
}
/** Puts `qty` of what is in a pocket slot into the stash box. */
export async function stashPut(p: Profile, slot: number, qty = 1): Promise<void> {
  await call(p, "stashStore", { slot, qty });
}
/** Takes `qty` of a stash box entry back into your pockets. */
export async function stashGet(p: Profile, key: string, qty = 1): Promise<void> {
  await call(p, "stashTake", { key, qty });
}

/** The test commands (/giveblud, /weed). The server only listens to the admin. Resolves with the message. */
export async function debugCommand(p: Profile, cmd: "blood" | "weed" | "skip", n?: number): Promise<string> {
  return String((await call<{ note?: string }>(p, "debug", { cmd, n })).note ?? "");
}
/** Admin: take a picture off a poster, or mute / unmute a player from putting pictures on posters. */
export async function posterAdminCall(p: Profile, args: object): Promise<void> {
  await call(p, "posterAdmin", args);
}
/** /give <item> [amount] [ass]: any item (admin only). Resolves with the message. */
export async function giveCommand(p: Profile, item: string, qty: number, ass: boolean): Promise<string> {
  return String((await call<{ note?: string }>(p, "debug", { cmd: "give", item, qty, ass })).note ?? "");
}

// ---- wardrobe (just saved looks: nothing worth cheating) -------------------------------------------------------------
export async function saveOutfit(p: Profile, slot: number, outfit: Outfit): Promise<void> {
  await set(ref(db, `users/${p.uid}/wardrobe/${slot}`), outfit);
  p.wardrobe[slot] = outfit;
}

export async function deleteOutfit(p: Profile, slot: number): Promise<void> {
  await set(ref(db, `users/${p.uid}/wardrobe/${slot}`), null);
  delete p.wardrobe[slot];
}

export { DEFAULT_FIGURE };

/** Sells weed from a pocket slot to 6ixty (6 drops each, 3 for ass weed). Resolves with what it paid. */
export async function sellWeed(p: Profile, slot: number, qty: number): Promise<number> {
  return Number((await call<{ gain?: number }>(p, "sellWeed", { slot, qty })).gain) || 0;
}
