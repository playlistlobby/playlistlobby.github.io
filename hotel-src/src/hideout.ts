// Hideouts in the browser (rules and prices: src/shared/hideout.ts; the server does the changing: server/src/actions/hideout.ts).
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { hideoutRoomId } from "./shared/hideout";
import type { HideoutListing } from "./shared/hideout";

export const hideoutBuy = (p: Profile): Promise<{ room: string }> => call(p, "hideoutBuy");
export const hideoutUpgrade = (p: Profile): Promise<{ size: number; price: number }> => call(p, "hideoutUpgrade");
export const hideoutColors = (p: Profile, d: { floor?: string; wall?: string; rug?: string }): Promise<{ price: number }> => call(p, "hideoutColors", d);
export const hideoutSettings = (p: Profile, patch: { name?: string; lock?: boolean; desc?: string; listed?: boolean; open?: boolean }): Promise<unknown> => call(p, "hideoutSettings", patch);
export const hideoutBoost = (p: Profile): Promise<{ boostUntil: number; price: number }> => call(p, "hideoutBoost");
export const hideoutInvite = (p: Profile, who: { name?: string; uid?: string }): Promise<{ name: string }> => call(p, "hideoutInvite", who);
export const hideoutAnswer = (p: Profile, owner: string, accept: boolean): Promise<{ joined: boolean; room?: string }> => call(p, "hideoutAnswer", { owner, accept });
export const hideoutLeave = (p: Profile, owner: string): Promise<unknown> => call(p, "hideoutLeave", { owner });
export const hideoutKick = (p: Profile, uid: string): Promise<unknown> => call(p, "hideoutKick", { uid });
export const hideoutMember = (p: Profile, uid: string, perms: { build?: boolean; grow?: boolean; stash?: boolean }): Promise<unknown> => call(p, "hideoutMember", { uid, ...perms });
export const hideoutSearch = (p: Profile, q: string): Promise<{ players: Array<{ uid: string; name: string }> }> => call(p, "hideoutSearch", { q });
export const hideoutBoxStore = (p: Profile, room: string, kind: string, qty = 1, from?: { slot: number }): Promise<unknown> => call(p, "hideoutBoxStore", { room, kind, qty, ...(from ? { source: "inv", slot: from.slot } : {}) });
export const hideoutBoxTake = (p: Profile, room: string, kind: string, qty = 1, to: "storage" | "inv" = "storage"): Promise<unknown> => call(p, "hideoutBoxTake", { room, kind, qty, to });
export const hideoutOrder = (p: Profile, room: string, kind: string): Promise<{ id: string; doneAt: number }> => call(p, "hideoutOrder", { room, kind });
export const hideoutCollect = (p: Profile, room: string, id: string): Promise<{ kind: string }> => call(p, "hideoutCollect", { room, id });

export interface MyHideout { owner: string; room: string; name: string; role: "owner" | "member" }
/** The hideouts this player is in (their own, and the ones they joined), live. */
export function watchMyHideouts(uid: string, cb: (list: MyHideout[]) => void): () => void {
  return onValue(ref(db, `hideouts/${uid}`), (s) => {
    const v = (s.val() ?? {}) as Record<string, { name?: string; role?: string }>;
    cb(Object.entries(v).map(([owner, h]) => ({ owner, room: hideoutRoomId(owner), name: String(h?.name ?? "Hideout"), role: h?.role === "owner" ? "owner" as const : "member" as const })));
  }, () => cb([]));
}
/** Hideout invites waiting for this player, live: owner uid -> invite. */
export function watchHideoutInvites(uid: string, cb: (list: Array<{ owner: string; fromName: string; roomName: string; at: number }>) => void): () => void {
  return onValue(ref(db, `hideoutInvites/${uid}`), (s) => {
    const v = (s.val() ?? {}) as Record<string, { fromName?: string; roomName?: string; at?: number }>;
    cb(Object.entries(v).map(([owner, i]) => ({ owner, fromName: String(i?.fromName ?? "?"), roomName: String(i?.roomName ?? "hideout"), at: Number(i?.at) || 0 })));
  }, () => cb([]));
}

/** The public list of hideouts (the ones whose owners left them on it), live: owner uid -> what it says. */
export function watchHideoutList(cb: (list: Array<{ owner: string; listing: HideoutListing }>) => void): () => void {
  return onValue(ref(db, "hideoutList"), (s) => {
    const v = (s.val() ?? {}) as Record<string, Partial<HideoutListing>>;
    cb(Object.entries(v).map(([owner, l]) => ({ owner, listing: { name: String(l?.name ?? "Hideout"), desc: String(l?.desc ?? ""), ownerName: String(l?.ownerName ?? "?"), members: Number(l?.members) || 1, boostUntil: Number(l?.boostUntil) || 0, open: l?.open === true } })));
  }, () => cb([]));
}

// ---- the shared stash (the chest): hideoutChests/<owner>/<key> = { item, qty, ass? }, readable by the members
export interface ChestRow { key: string; item: string; qty: number; ass?: boolean }
export const hideoutChestPut = (p: Profile, room: string, slot: number, qty = 1): Promise<unknown> => call(p, "hideoutChestPut", { room, slot, qty });
export const hideoutChestTake = (p: Profile, room: string, key: string, qty = 1): Promise<unknown> => call(p, "hideoutChestTake", { room, key, qty });
export function watchHideoutChest(owner: string, cb: (rows: ChestRow[]) => void): () => void {
  return onValue(ref(db, `hideoutChests/${owner}`), (s) => {
    const v = (s.val() ?? {}) as Record<string, { item?: string; qty?: number; ass?: boolean }>;
    cb(Object.entries(v).filter(([, r]) => typeof r?.item === "string" && Number(r.qty) > 0).map(([key, r]) => ({ key, item: r.item!, qty: Number(r.qty), ...(r.ass ? { ass: true } : {}) })).sort((a, b) => a.item.localeCompare(b.item)));
  }, () => cb([]));
}
