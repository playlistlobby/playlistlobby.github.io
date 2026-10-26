// Hideouts: shared rooms for a gang. A player buys one from the landlord at the far end of the basement, invites others, and they build and use it together.
// Pure data and rules, used by the browser and the server (server/src/actions/hideout.ts does the changing).
//   roomsMeta/h_<owner>   { owner, ownerName, name, access:"none", w, h, level, lock, theme, furni, toolbox, sink, boombox, computer,
//                           members/<uid>: { name, build, at },
//                           box/<ownerUid>/<kind>: n          the shared storage box: every piece in it is still its owner's,
//                           orders/<id>: { kind, by, doneAt } hideout-exclusive furniture on its way (1 hour) }
//   hideouts/<uid>/<owner>  { name, role }                    which hideouts a player is in (written by the server, read by that player)
//   hideoutInvites/<to>/<owner> { fromName, roomName, at }    an invite waiting for an answer
import { RECOLOR_PRICE } from "./economy";

export const hideoutRoomId = (ownerUid: string): string => `h_${ownerUid}`;
export const HIDEOUT_ID_RE = /^h_[A-Za-z0-9]{1,40}$/;
export const isHideoutId = (id: string): boolean => HIDEOUT_ID_RE.test(id);
export const ownerOfHideout = (id: string): string => id.slice(2);

/** what the landlord sells it for, and what the two size upgrades cost */
export const HIDEOUT_PRICE = 1000;
export const HIDEOUT_UPGRADE_PRICES = [2000, 4000];
/** the room's width and height by level (a player room is 8x8 = 64 tiles; the first hideout is 14x14 = 196, about three times that) */
export const HIDEOUT_SIZES = [14, 17, 20];
/** how many pieces fit in a hideout, by level */
export const HIDEOUT_MAX_FURNI = [120, 160, 220];
export const HIDEOUT_MAX_MEMBERS = 10;
/** changing the floor, walls or rug costs 15 times what it costs in a player room, per part */
export const HIDEOUT_RECOLOR_PRICE = RECOLOR_PRICE * 15;
export const HIDEOUT_NAME_MAX = 28;

/** how a new hideout looks until the owner pays for other colours */
export const HIDEOUT_THEME = { floorA: "#6f6a63", floorB: "#78736b", wall: "#8b9096", rug: false, rugColor: "#7a2f2f" };

/** where the fixed pieces stand in a new hideout (the owner can move them) */
export const HIDEOUT_FIXED_POS = {
  toolbox: { x: 6, y: 0, dir: 2 },
  computer: { x: 4, y: 0, dir: 2 },
  sink: { x: 0, y: 7, dir: 2 },
  boombox: { x: 0, y: 3, dir: 2 },
};

/** the computer: a red laptop that is in every hideout (its kind is a fixed piece, drawn from furni/hcomputer.nitro) */
export const COMPUTER_KIND = "hcomputer";

/** Furniture that only exists for hideouts: it is ordered on the computer (an hour to arrive) and can only be put down in a hideout you belong to. */
export const HIDEOUT_ORDER_MS = 3_600_000;
export interface HideoutShopItem { kind: string; label: string; price: number; blurb: string }
export const HIDEOUT_SHOP: HideoutShopItem[] = [
  { kind: "f_randomizer", label: "Love booth", price: 150, blurb: "A booth for two. Sit down together and tap it: it tells you how well you match." },
];
export const HIDEOUT_ONLY: ReadonlySet<string> = new Set(HIDEOUT_SHOP.map((i) => i.kind));

export interface HideoutMember { name: string; build: boolean; at: number }
export interface HideoutOrder { kind: string; by: string; doneAt: number }

/** What a player may do in a hideout. The owner always builds; a member builds when the owner allows it and builds are not locked for everybody. */
export interface HideoutMeta { owner?: string; lock?: boolean; members?: Record<string, { build?: boolean }> }
export function hideoutRole(meta: HideoutMeta | null | undefined, uid: string, isAdmin = false): { owner: boolean; member: boolean; canBuild: boolean } {
  if (!meta) return { owner: false, member: false, canBuild: false };
  const owner = meta.owner === uid;
  const member = owner || !!meta.members?.[uid];
  const canBuild = isAdmin || owner || (member && meta.members?.[uid]?.build !== false && !meta.lock);
  return { owner, member: member || isAdmin, canBuild };
}

/** the level a hideout of this width is at (0..2) */
export const levelOfSize = (w: number): number => Math.max(0, HIDEOUT_SIZES.findIndex((s) => s >= w));

/** The love booth's verdict for two players: the same number for everybody who watches, a new one each time the booth's look changes. 1..100. */
export function lovePercent(a: string, b: string, st: number): number {
  const key = [a, b].sort().join("|") + "#" + st;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 1 + ((h >>> 0) % 100);
}
