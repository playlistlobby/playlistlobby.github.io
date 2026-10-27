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
export const HIDEOUT_MAX_MEMBERS = 7;
/** how many growing kits fit in a hideout (there is no limit on mixers) */
export const HIDEOUT_MAX_KITS = 40;
/** changing the floor, walls or rug costs 15 times what it costs in a player room, per part */
export const HIDEOUT_RECOLOR_PRICE = RECOLOR_PRICE * 15;
export const HIDEOUT_NAME_MAX = 28;
/** the list of hideouts everybody can see (at the door): a line about the hideout, and paying to be shown first for a while */
export const HIDEOUT_DESC_MAX = 80;
export const HIDEOUT_BOOST_PRICE = 500;
export const HIDEOUT_BOOST_MS = 6 * 60 * 60 * 1000;
/** what the public list says about a hideout (written by the server to hideoutList/<owner>) */
export interface HideoutListing { name: string; desc: string; ownerName: string; members: number; boostUntil: number; /** anybody can walk in (no knocking) */ open: boolean; /** how many players have it as a favourite: the more, the higher it is on the list */ favs?: number }
/** the order of the list: boosted ones first (the latest boost on top), then the most favourited, then the bigger crowds */
export const sortListings = <T extends { listing: HideoutListing }>(rows: T[], now: number): T[] =>
  [...rows].sort((a, b) => (Number(b.listing.boostUntil > now) - Number(a.listing.boostUntil > now)) || (b.listing.boostUntil > now ? b.listing.boostUntil - a.listing.boostUntil : 0) || (b.listing.favs ?? 0) - (a.listing.favs ?? 0) || b.listing.members - a.listing.members || a.listing.name.localeCompare(b.listing.name));
/** how many hideouts a player can have as favourites */
export const HIDEOUT_MAX_FAVS = 30;

/** how a new hideout looks until the owner pays for other colours: the same cold concrete as the basement */
export const HIDEOUT_THEME = { floorA: "#5f6262", floorB: "#686b6b", wall: "#575c5d", rug: false, rugColor: "#000000", style: "grime" };

/** where the fixed pieces stand in a new hideout (the owner can move them) */
export const HIDEOUT_FIXED_POS = {
  toolbox: { x: 6, y: 0, dir: 2 },
  computer: { x: 4, y: 0, dir: 2 },
  sink: { x: 0, y: 7, dir: 2 },
  boombox: { x: 0, y: 3, dir: 2 },
  chest: { x: 8, y: 0, dir: 2 },
};
/** the shared stash (the chest): how many different things fit in it, and the most of one thing */
export const HIDEOUT_CHEST_SLOTS = 28;
export const HIDEOUT_CHEST_MAX_QTY = 999;

/** the computer: a red laptop that is in every hideout (its kind is a fixed piece, drawn from furni/hcomputer.nitro) */
export const COMPUTER_KIND = "hcomputer";

/**
 * What the computer sells (ordered, paid at once, and it arrives later: `etaMs`). The automatic waterer and the mixer chip are plain items you put on a pot or a mixer; the poker tables
 * are furniture. The price can change after the first few that the hideout has bought (`tier`).
 */
export const HIDEOUT_ORDER_MS = 3_600_000;
export const HIDEOUT_FAST_MS = 20 * 60_000;
export interface HideoutShopItem { kind: string; label: string; price: number; blurb: string; etaMs: number; /** the price after this many have been bought in this hideout */ tier?: { first: number; then: number }; /** or the price of the 1st, 2nd, 3rd ... one (the last price holds for every one after) */ steps?: number[]; /** only a hideout you belong to may put it down */ hideoutOnly?: boolean }
export const HIDEOUT_SHOP: HideoutShopItem[] = [
  { kind: "waterer", label: "Automatic plant waterer", price: 250, etaMs: HIDEOUT_FAST_MS, blurb: "A plant never needs water again." },
  { kind: "mixerchip", label: "Mixer upgrade", price: 400, etaMs: HIDEOUT_FAST_MS, blurb: "Mixes 15% faster." },
  { kind: "mixerchip2", label: "Mixer upgrade MK2", price: 800, etaMs: HIDEOUT_FAST_MS, blurb: "Mixes 25% faster." },
  { kind: "f_pokertable", label: "Poker table", price: 1000, etaMs: HIDEOUT_ORDER_MS, blurb: "Poker for five. Buy in 200-500." },
  { kind: "f_pokertablehi", label: "High stakes poker table", price: 4000, etaMs: 2 * HIDEOUT_ORDER_MS, blurb: "Poker for five. Buy in 1000-2000." },
  { kind: "f_blackjacktable", label: "Blackjack table", price: 500, steps: [500, 1000, 2000], etaMs: HIDEOUT_ORDER_MS, blurb: "Blackjack for five. A member deals." },
];
/** what one of them costs when the hideout has already bought `bought` of that kind */
export const hideoutPriceOf = (item: HideoutShopItem, bought: number): number => (item.steps?.length ? item.steps[Math.min(Math.max(0, bought), item.steps.length - 1)] : item.tier && bought >= item.tier.first ? item.tier.then : item.price);
export const HIDEOUT_ONLY: ReadonlySet<string> = new Set(HIDEOUT_SHOP.filter((i) => i.hideoutOnly).map((i) => i.kind));
/** a mixer with the upgrade mixes in this share of the time (15% faster), and with the MK2 (25% faster) */
export const MIXER_UP_FACTOR = 0.85;
export const MIXER_UP2_FACTOR = 0.75;
/** the share of the time a mixer needs: `up` is 1 for the upgrade, 2 for the MK2 (an old `true` counts as the first) */
export const mixerFactor = (up: unknown): number => (up === 2 ? MIXER_UP2_FACTOR : up ? MIXER_UP_FACTOR : 1);

export interface HideoutMember { name: string; build: boolean; at: number }
export interface HideoutOrder { kind: string; by: string; doneAt: number }

/** What a player may do in a hideout. The owner always builds; a member builds when the owner allows it and builds are not locked for everybody. */
export interface HideoutPerms { build?: boolean; grow?: boolean; stash?: boolean }
export interface HideoutMeta { owner?: string; lock?: boolean; members?: Record<string, HideoutPerms> }
/** the three things the owner can switch on and off for every member: building, using the pots and the mixers (and the sink), and using the shared stash. All on to begin with. */
export function hideoutRole(meta: HideoutMeta | null | undefined, uid: string, isAdmin = false): { owner: boolean; member: boolean; canBuild: boolean; canGrow: boolean; canStash: boolean } {
  if (!meta) return { owner: false, member: false, canBuild: false, canGrow: false, canStash: false };
  const owner = meta.owner === uid;
  const member = owner || !!meta.members?.[uid];
  const m = meta.members?.[uid];
  const canBuild = isAdmin || owner || (member && m?.build !== false && !meta.lock);
  const canGrow = isAdmin || owner || (member && m?.grow !== false);
  const canStash = isAdmin || owner || (member && m?.stash !== false);
  return { owner, member: member || isAdmin, canBuild, canGrow, canStash };
}
/** what a new member starts with: everything on, except what the owner has switched off for some of the members (that stays off for the next one who joins) */
export function memberDefaults(members: Record<string, HideoutPerms> | undefined): Required<HideoutPerms> {
  const list = Object.values(members ?? {});
  return { build: !list.some((m) => m?.build === false), grow: !list.some((m) => m?.grow === false), stash: !list.some((m) => m?.stash === false) };
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
