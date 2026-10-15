import { get, onValue, push, ref, remove, set, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";

/** open = anyone walks in; knock = friends walk in, everyone else knocks and waits; closed = friends only, no knocking; none = nobody (not even friends). */
export type Access = "open" | "knock" | "closed" | "none";

/** Older rooms may still say friends/invite; they mean knock/closed. */
export const normAccess = (a: string | undefined): Access => (a === "none" ? "none" : a === "open" ? "open" : a === "closed" || a === "invite" ? "closed" : "knock");

export interface RoomTheme {
  floorA: string;
  floorB: string;
  wall: string;
  rug: boolean;
  rugColor: string;
  /** optional texture ids from public/textures (floor_<id>.png / wall_<id>.png) */
  floorTex?: string;
  wallTex?: string;
  /** "grime": dirty concrete drawn procedurally (stains, cracks, rust, puddles), and a dark moody stage */
  style?: "grime";
}

export interface FurniKind {
  id: string;
  label: string;
  icon: string;
  /** footprint in tiles */
  w: number;
  h: number;
  /** drawn height in px */
  height: number;
  color: string;
  /** can players put it in their own room? */
  placeable: boolean;
  /** built into every player room (never stored in the database, can't be picked up) */
  fixed?: boolean;
  /** drawn from a Habbo .nitro file in public/ instead of as a box */
  nitro?: string;
  /** clicking it walks you over and opens this page ("character" = your clothes, in your own room; "shop" = the clothing shop, from the wardrobe in the shop room) */
  opens?: "character" | "shop" | "furnish" | "vending" | "sink" | "mixer";
  /** a growing kit: weed is planted, watered and harvested in it */
  plant?: boolean;
  /** you can sit on it (every tile of its footprint is a seat); it faces the way the piece faces */
  seat?: boolean;
  /** how far up (in 64px pixels) a sitting person is lifted onto the seat */
  seatHeight?: number;
  /** lies flat on the floor: you can walk over it and it's drawn underneath everyone */
  flat?: boolean;
  /** a wall item: hangs on the back wall (facing 4) or the left wall (facing 2); its x/y is the wall tile it hangs next to */
  wall?: boolean;
  /** nudges the art (64px pixels) if it doesn't sit right on its tiles */
  nudge?: { x: number; y: number };
  /** can be turned to face another way when placed (its footprint swaps when it faces 2 or 6) */
  rotatable?: boolean;
}

/** Tiles a piece covers given the way it faces. */
export function footprint(kindId: string, dir = 0): { w: number; h: number } {
  const k = FURNI_KINDS[kindId];
  if (!k) return { w: 1, h: 1 };
  return k.rotatable && (dir === 2 || dir === 6) ? { w: k.h, h: k.w } : { w: k.w, h: k.h };
}

import { SHOP_KIND_PREFIX, SHOP_PIECES } from "./shared/furniture";
import { BAG_SKINS, BED_SKINS } from "./shared/skins";
export type { ShopPiece } from "./shared/furniture";
export { SHOP_KIND_PREFIX, SHOP_PIECES };

const shopKinds = (): Record<string, FurniKind> => Object.fromEntries(SHOP_PIECES.map((p) => [SHOP_KIND_PREFIX + p.id, {
  id: SHOP_KIND_PREFIX + p.id, label: p.label, icon: p.icon, w: p.w, h: p.h, height: p.height, color: "#6b5a48", placeable: false,
  nitro: `furni/${SHOP_KIND_PREFIX}${p.id}.nitro`, rotatable: true, ...(p.flat ? { flat: true } : {}), ...(p.seat ? { seat: true, seatHeight: p.seatHeight ?? 14 } : {}),
} as FurniKind]));

/** The looks the landlord sells for the bed (bed_<id>) and the bag of clothes (bag_<id>): fixed pieces, never placed from a toolbox. */
const skinKinds = (): Record<string, FurniKind> => Object.fromEntries([
  ...BED_SKINS.map((s) => [`bed_${s.id}`, { id: `bed_${s.id}`, label: s.label, icon: "🛏️", w: s.w, h: s.h, height: s.height, color: "#6b5a48", placeable: false, nitro: `furni/skin_bed_${s.id}.nitro`, rotatable: true, fixed: true } as FurniKind]),
  ...BAG_SKINS.map((s) => [`bag_${s.id}`, { id: `bag_${s.id}`, label: s.label, icon: "🚪", w: s.w, h: s.h, height: s.height, color: "#6b5a48", placeable: false, nitro: `furni/skin_bag_${s.id}.nitro`, rotatable: true, fixed: true, opens: "character", ...(s.wall ? { flat: true, wall: true, nudge: { x: 0, y: -(s.lift ?? 0) } } : {}) } as FurniKind]),
]);
/** the bag of clothes, or one of the wardrobes you can swap it for */
export const isBagKind = (kind: string | undefined): boolean => kind === "bag" || (!!kind && kind.startsWith("bag_"));

export const FURNI_KINDS: Record<string, FurniKind> = {
  ...shopKinds(),
  ...skinKinds(),
  // the growing kit (sold by 6ixty): an empty pot until you plant a seed in it
  f_planter: { id: "f_planter", label: "Growing kit", icon: "🪴", w: 1, h: 1, height: 36, color: "#d8d8d8", placeable: false, nitro: "furni/f_flowerpot.nitro", rotatable: true, plant: true },
  // the mixer (sold by the vending machine): put it down in your room, tap it, and mix two things into something new
  f_mixer: { id: "f_mixer", label: "Mixer", icon: "🧪", w: 1, h: 1, height: 46, color: "#6b6b7a", placeable: false, nitro: "furni/f_mixer.nitro", rotatable: true, opens: "mixer" },
  // the vending machine in the shop room
  vending: { id: "vending", label: "Vending machine", icon: "🥤", w: 1, h: 1, height: 80, color: "#6b5a48", placeable: false, nitro: "furni/olympics_r16_vendingmchn.nitro", rotatable: true, fixed: true, opens: "vending" },
  // the sink in every player room (like the bed: always there, movable, never removable): fills the watering can
  sink: { id: "sink", label: "Sink", icon: "🚰", w: 1, h: 1, height: 36, color: "#555b66", placeable: false, nitro: "furni/hygge_c25_toiletsink.nitro", rotatable: true, fixed: true, opens: "sink" },
  // the silver boombox every player room starts with: use a CD on it (6ixty sells one) and the song plays in the room
  boombox: { id: "boombox", label: "Boombox", icon: "📻", w: 1, h: 1, height: 34, color: "#8d97ab", placeable: false, nitro: "furni/boombox.nitro", rotatable: true, fixed: true },
  // the toolbox in every player room (Habbo's toolbox): click it and the furnishing menu opens
  toolbox: { id: "toolbox", label: "Toolbox", icon: "🧰", w: 1, h: 1, height: 22, color: "#b4492f", placeable: false, fixed: true, opens: "furnish", nitro: "furni/ads_twi_toolbx.nitro", rotatable: true },
  // the landlord's counter in the corner of the shop room
  counter: { id: "counter", label: "Counter", icon: "🧾", w: 1, h: 2, height: 30, color: "#6b5a48", placeable: false, nitro: "furni/f_counter.nitro", rotatable: true, fixed: true },
  // the wardrobe in the shop room: click it and the clothing shop opens
  wardrobe: { id: "wardrobe", label: "Wardrobe", icon: "🚪", w: 2, h: 1, height: 90, color: "#6b5a48", placeable: false, nitro: "furni/skin_bag_plain.nitro", rotatable: true, fixed: true, opens: "shop" },
  arcade: { id: "arcade", label: "Arcade machine", icon: "🕹️", w: 1, h: 1, height: 78, color: "#26327a", placeable: false },
  cdplayer: { id: "cdplayer", label: "CD player", icon: "💿", w: 1, h: 1, height: 38, color: "#2d3140", placeable: false },
  // the Flappy Bird arcade machine (Habbo's cupcake-duck cabinet) in the basement: click it and you play Flappy Bird
  flappy: { id: "flappy", label: "Flappy Bird arcade", icon: "🐤", w: 1, h: 2, height: 80, color: "#2a2218", placeable: false, nitro: "furni/arcade_flappy.nitro", rotatable: true },
  // the alley dumpster next to the Flappy Bird machine: search it (every 10 minutes) for a cigarette or a dead cat
  dumpster: { id: "dumpster", label: "Dumpster", icon: "🗑️", w: 2, h: 1, height: 52, color: "#2c3a2c", placeable: false, nitro: "furni/alley_dumpster.nitro", rotatable: true },
  // the bed every player room has (a fixed piece: not in the furniture menu, not stored in the database)
  bed: { id: "bed", label: "Bed", icon: "🛏️", w: 1, h: 3, height: 30, color: "#6b5a48", placeable: false, nitro: "furni/hween_c25_makeshiftbed.nitro", rotatable: true, fixed: true },
  // the bag of clothes in the corner of your own room: click it (your avatar walks over first) to open the Character page
  bag: { id: "bag", label: "Bag of clothes", icon: "🛍️", w: 1, h: 1, height: 26, color: "#2a2a2a", placeable: false, nitro: "furni/messy_c21_trashbags.nitro", rotatable: true, fixed: true, opens: "character" },
};

/** Furniture you can click on and do something with (not just walk around). */
export const INTERACTIVE_KINDS = new Set(["arcade", "cdplayer", "boombox", "flappy", "dumpster"]);
/** the CD player in the basement or a boombox: both play the CD you use on them */
export const isCdKind = (kind: string | undefined): boolean => kind === "cdplayer" || kind === "boombox";
/** a body bag (the shop piece or an uploaded one): use a syringe on it for a drop of blood */
export const isBodyBag = (kind: string | undefined): boolean => !!kind && /bodybag/.test(kind);

interface Pt2 { x: number; y: number }
export interface PlacedFurni {
  id: string;
  kind: string;
  x: number;
  y: number;
  /** facing 0/2/4/6 (only matters for rotatable pieces) */
  dir?: number;
  /** a growing kit with a seed in it (server times, ms): planted, last watered, and whether it ever ran dry */
  plant?: { at: number; water: number; neglect: boolean; /** what grows in it: weed (nothing) or shrooms */ crop?: string };
}

export interface RugRect {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

export interface RoomDef {
  id: string;
  name: string;
  ownerUid: string | null;
  ownerName: string | null;
  access: Access;
  w: number;
  h: number;
  theme: RoomTheme;
  rug: RugRect | null;
  furni: PlacedFurni[];
  /** tile column of the door on the back-right wall */
  doorX: number;
  /** the main door leads straight to this room (no door menu) */
  doorTo?: string;
  /** more doors on the back-right wall, each leading to a room of its own */
  extraDoors?: ExtraDoor[];
}

export interface ExtraDoor { x: number; to: string; label: string; yellow?: boolean }

/** Every room has its door on the back-right wall at this tile column. */
export const DOOR_X = 1;
/** Tiles in front of the door that furniture may never block. */
export const isDoorTile = (x: number, y: number, doorX = DOOR_X): boolean => x === doorX && y <= 1;

export const DEFAULT_THEME: RoomTheme = { floorA: "#a99a6a", floorB: "#b5a678", wall: "#b9c9cf", rug: true, rugColor: "#c9544f" };

export const FLOOR_PRESETS: Array<{ name: string; a: string; b: string }> = [
  { name: "Sand", a: "#a99a6a", b: "#b5a678" },
  { name: "Oak", a: "#a2713f", b: "#b0814d" },
  { name: "Slate", a: "#5d6b78", b: "#6a7886" },
  { name: "Checker", a: "#2b2b2b", b: "#d8d8d8" },
  { name: "Moss", a: "#5f7d4a", b: "#6c8b56" },
  { name: "Rose", a: "#b86a7c", b: "#c47b8c" },
  { name: "Ocean", a: "#3f7fa6", b: "#4a8db5" },
  { name: "Cream", a: "#d9ccaa", b: "#e3d8ba" },
];
export const WALL_COLORS = ["#b9c9cf", "#e8d8b0", "#c9a6b8", "#9fc1a0", "#8aa6d6", "#d9a38a", "#7c7f8c", "#f0f0f0"];
export const RUG_COLORS = ["#c9544f", "#4f7bc9", "#4fa86a", "#c9a24f", "#8a4fc9", "#333333"];

/** Floor patterns multiply over the floor colours; wall patterns replace the wall colour. Files live in public/textures (from the Habbo asset dump). */
export const FLOOR_TEXTURES: Array<{ id: string; name: string }> = [
  { id: "fuzzy", name: "Fuzzy" }, { id: "tiles2", name: "Tiles" }, { id: "tiles3", name: "Planks" }, { id: "tiles5", name: "Slabs" },
];
export const WALL_TEXTURES: Array<{ id: string; name: string }> = [
  { id: "brick_red", name: "Red brick" }, { id: "brick_white", name: "White brick" }, { id: "brick_teal", name: "Teal tiles" },
  { id: "chocolate", name: "Chocolate" }, { id: "wood", name: "Wood" },
  { id: "plaid_pink", name: "Pink plaid" }, { id: "plaid_brown", name: "Brown plaid" }, { id: "plaid_green", name: "Green plaid" },
  { id: "stripes_bright", name: "Bright stripes" }, { id: "stripes_blue", name: "Blue stripes" }, { id: "stripes_orange", name: "Orange stripes" },
  { id: "zigzag_pink", name: "Pink zigzag" }, { id: "zigzag_yellow", name: "Yellow zigzag" }, { id: "zigzag_blue", name: "Blue zigzag" },
  { id: "rings_purple", name: "Purple rings" }, { id: "rings_green", name: "Green rings" }, { id: "rings_yellow", name: "Yellow rings" },
  { id: "rings_blue", name: "Blue rings" }, { id: "rings_brown", name: "Brown rings" },
  { id: "hearts", name: "Hearts" }, { id: "clouds", name: "Clouds" }, { id: "groovy_green", name: "Groovy green" }, { id: "groovy_blue", name: "Groovy blue" },
];

/** Every player room is the same size. */
export const ROOM_W = 8;
export const ROOM_H = 8;
export const MAX_FURNI = 40;

export const LOBBY_ID = "lobby";
export const SHOP_ID = "shop";
/** rooms with no owner that everyone shares (the basement and the shop) */
export const isPublicRoom = (id: string) => id === LOBBY_ID || id === SHOP_ID || isTutRoom(id);
/** The private copy of the basement a brand-new player walks through the introduction in (nobody else can come in, the body bag is not there). */
export const tutRoomId = (uid: string) => `tut_${uid}`;
export const isTutRoom = (id: string) => id.startsWith("tut_");
export const ownRoomId = (uid: string) => `u_${uid}`;
export const ownerOfRoom = (id: string) => (id.startsWith("u_") ? id.slice(2) : null);
export const isLobby = (id: string) => id === LOBBY_ID;

/** Cold, damp concrete: the look of the public room. */
export const GRIME_THEME: RoomTheme = { floorA: "#5f6262", floorB: "#686b6b", wall: "#575c5d", rug: false, rugColor: "#000000", style: "grime" };

/** The public room: an empty, filthy concrete cell. Everything in it was put there by the admin (Room > 🏠 tab). */
export function lobbyDef(extras: PlacedFurni[] = []): RoomDef {
  return {
    id: LOBBY_ID,
    name: "Basement",
    ownerUid: null,
    ownerName: null,
    access: "open",
    w: 12,
    h: 12,
    theme: { ...GRIME_THEME },
    rug: null,
    // the Flappy Bird machine is part of the basement (it stands against the left wall, 8 tiles down from the back corner)
    furni: [{ id: "lobby1", kind: "flappy", x: 0, y: 8, dir: 0 }, { id: "lobby2", kind: "dumpster", x: 0, y: 10, dir: 2 }, { id: "lobby3", kind: "dumpster", x: 0, y: 6, dir: 2 }, ...extras.filter((f) => FURNI_KINDS[f.kind])],
    doorX: DOOR_X,
    // the yellow door on the other side of 6ixty leads to the shop
    extraDoors: [{ x: 9, to: SHOP_ID, label: "Shop", yellow: true }],
  };
}

/** The private copy of the basement: the same room without the pieces the admin put in it, and its door leads back to your own room. */
export function tutDef(uid: string): RoomDef {
  return { ...lobbyDef([]), id: tutRoomId(uid), doorTo: ownRoomId(uid), extraDoors: [] };
}

/** Where the four daily pieces stand in the shop room (every piece is placed facing the same way, each in its own 3x3 corner). */
export const SHOP_SLOTS: Pt2[] = [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }];
export const SHOP_SIZE = 15;
export const DISPLAY_PREFIX = "shop_disp";
export const isDisplayPiece = (id: string) => id.startsWith(DISPLAY_PREFIX);

/** The shop: a big white room with the wardrobe on the back wall and today's four pieces standing on the floor. */
export function shopDef(picks: string[]): RoomDef {
  const furni: PlacedFurni[] = [
    { id: "shop_wardrobe", kind: "wardrobe", x: 5, y: 0, dir: 4 }, { id: "shop_vending", kind: "vending", x: 8, y: 0, dir: 4 },
    // the landlord's counter in the right corner: he stands behind it (see LANDLORD in npc.ts)
    { id: "shop_counter", kind: "counter", x: 13, y: 1, dir: 2 },
  ];
  picks.slice(0, 4).forEach((kind, i) => {
    if (!FURNI_KINDS[kind]) return;
    const slot = SHOP_SLOTS[i];
    const dir = SHOP_PIECES.find((p) => SHOP_KIND_PREFIX + p.id === kind)?.showDir ?? 2;
    const fp = footprint(kind, dir);
    furni.push({ id: DISPLAY_PREFIX + i, kind, x: slot.x + Math.floor((3 - fp.w) / 2), y: slot.y + Math.floor((3 - fp.h) / 2), dir });
  });
  return {
    id: SHOP_ID, name: "Shop", ownerUid: null, ownerName: null, access: "open", w: SHOP_SIZE, h: SHOP_SIZE,
    theme: { floorA: "#e6e2d8", floorB: "#efece4", wall: "#f3f3f3", rug: false, rugColor: "#000000" },
    rug: null, furni, doorX: DOOR_X, doorTo: LOBBY_ID,
  };
}

/** The built-in lobby pieces can't be picked up; the ones the admin added can. */
export const isFixedLobbyPiece = (id: string) => /^lobby\d+$/.test(id) || id === BED_ID || id === BAG_ID || id === TOOLBOX_ID || id === SINK_ID || id === BOOMBOX_ID || id.startsWith("shop_");

export function watchLobbyFurni(cb: (extras: PlacedFurni[]) => void): Unsubscribe {
  return onValue(ref(db, "lobby/furni"), (s) => {
    const raw = (s.val() ?? {}) as Record<string, { kind: string; x: number; y: number; dir?: number }>;
    cb(Object.entries(raw).map(([id, f]) => ({ id, kind: f.kind, x: f.x, y: f.y, dir: f.dir })));
  }, () => cb([]));
}

// ---- the bed -----------------------------------------------------------------------------------------------
/** Where the (fixed) bed sits in every player room, and which way it faces. It lies along the back-right wall, clear of the door. */
export const BED_ID = "bed";
export const BED = { x: 3, y: 0, dir: 2 };
/** The bag of clothes sits in the far right corner, next to the bed. */
export const BAG_ID = "bag";
export const BAG = { x: 7, y: 0, dir: 2 };
/** The toolbox starts between the bed and the bag. */
export const TOOLBOX_ID = "toolbox";
export const TOOLBOX = { x: 6, y: 0, dir: 4 };
/** The sink starts in the far left corner of the room, facing the camera. */
export const BOOMBOX_ID = "boombox";
export const BOOMBOX = { x: 0, y: 3, dir: 4 };

export const SINK_ID = "sink";
export const SINK = { x: 0, y: 7, dir: 4 };
/** The tile you stand on when you get out of bed (and where you start every login). */
export const BED_SIDE = { x: 4, y: 1 };
/** The tile the sleeper's head is on (the end of the bed by the pillow). */
export const BED_HEAD = { x: 3, y: 0 };

export interface RoomMeta {
  owner: string;
  ownerName: string;
  name: string;
  access: Access | "friends" | "invite";
  w: number;
  h: number;
  theme?: Partial<RoomTheme>;
  furni?: Record<string, { kind: string; x: number; y: number; dir?: number; plantedAt?: number; wateredAt?: number; neglect?: boolean; crop?: string }>;
  /** where the owner moved the fixed pieces to (the bed can't be turned, so only its x/y count) */
  bed?: { x: number; y: number; dir?: number };
  bag?: { x: number; y: number; dir?: number };
  toolbox?: { x: number; y: number; dir?: number };
  sink?: { x: number; y: number; dir?: number };
  boombox?: { x: number; y: number; dir?: number };
  /** the looks bought from the landlord (the server writes these): ids from shared/skins.ts */
  skins?: { bed?: string; bag?: string };
}

/** The tile the sleeper's head is on (the pillow end of the bed), and the tile beside the bed you step out onto. */
export const bedHead = (bed: { x: number; y: number }) => ({ x: bed.x, y: bed.y });
export const bedSide = (bed: { x: number; y: number }) => ({ x: bed.x + 1, y: bed.y + 1 });

/** the kind a fixed piece is drawn as: the plain one, or the look the player bought */
const skinKind = (part: "bed" | "bag", skin: string | undefined): string => (skin && FURNI_KINDS[part + "_" + skin] ? part + "_" + skin : part);

export function defFromMeta(id: string, meta: RoomMeta): RoomDef {
  const theme: RoomTheme = { ...DEFAULT_THEME, ...(meta.theme ?? {}) };
  // furniture of kinds that no longer exist (the old test cubes) is ignored; the bed is always there
  const furni: PlacedFurni[] = Object.entries(meta.furni ?? {})
    .filter(([, f]) => FURNI_KINDS[f.kind] && !FURNI_KINDS[f.kind].fixed)
    .map(([fid, f]) => ({ id: fid, kind: f.kind, x: f.x, y: f.y, dir: f.dir, ...(typeof f.plantedAt === "number" ? { plant: { at: f.plantedAt, water: typeof f.wateredAt === "number" ? f.wateredAt : f.plantedAt, neglect: !!f.neglect, ...(f.crop ? { crop: f.crop } : {}) } } : {}) }));
  const at = (m: { x: number; y: number; dir?: number } | undefined, d: { x: number; y: number; dir: number }) => (m && Number.isFinite(m.x) && Number.isFinite(m.y) ? { x: m.x, y: m.y, dir: m.dir ?? d.dir } : d);
  const bed = at(meta.bed, BED), bag = at(meta.bag, BAG), toolbox = at(meta.toolbox, TOOLBOX), sink = at(meta.sink, SINK), boombox = at(meta.boombox, BOOMBOX);
  furni.unshift({ id: BED_ID, kind: skinKind("bed", meta.skins?.bed), x: bed.x, y: bed.y, dir: BED.dir }, { id: BAG_ID, kind: skinKind("bag", meta.skins?.bag), x: bag.x, y: bag.y, dir: bag.dir }, { id: TOOLBOX_ID, kind: "toolbox", x: toolbox.x, y: toolbox.y, dir: toolbox.dir }, { id: SINK_ID, kind: "sink", x: sink.x, y: sink.y, dir: sink.dir }, { id: BOOMBOX_ID, kind: "boombox", x: boombox.x, y: boombox.y, dir: boombox.dir });
  // the landlord makes rooms bigger (the server writes w and h)
  const side = (n: unknown) => (typeof n === "number" && n >= ROOM_W && n <= 14 ? Math.floor(n) : ROOM_W);
  const w = side(meta.w), h = side(meta.h);
  const rug: RugRect | null = theme.rug
    ? { x0: Math.floor((w - 4) / 2), y0: Math.floor((h - 4) / 2), w: 4, h: 4 }
    : null;
  return { id, name: meta.name, ownerUid: meta.owner, ownerName: meta.ownerName, access: normAccess(meta.access), w, h, theme, rug, furni, doorX: DOOR_X };
}

// ---- database helpers ----------------------------------------------------------------
const metaRef = (id: string) => ref(db, `roomsMeta/${id}`);

export async function fetchMeta(id: string): Promise<RoomMeta | null> {
  const snap = await get(metaRef(id));
  return snap.exists() ? (snap.val() as RoomMeta) : null;
}

export function watchMeta(id: string, cb: (meta: RoomMeta | null) => void, onError?: () => void): Unsubscribe {
  return onValue(metaRef(id), (s) => cb(s.exists() ? (s.val() as RoomMeta) : null), onError);
}

export function watchAllRooms(cb: (rooms: Record<string, RoomMeta>) => void): Unsubscribe {
  return onValue(ref(db, "roomsMeta"), (s) => cb((s.val() ?? {}) as Record<string, RoomMeta>));
}

/** The room every new player wakes up in: same size for everyone, plain floor and walls, only the bed. */
export const STARTER_THEME: RoomTheme = { floorA: "#8d7a5f", floorB: "#95826a", wall: "#a8aeb0", rug: false, rugColor: "#c9544f" };

export async function createRoom(p: Profile): Promise<string> {
  const id = ownRoomId(p.uid);
  const meta: RoomMeta = {
    owner: p.uid,
    ownerName: p.name,
    name: `${p.name}'s room`.slice(0, 28),
    access: "knock",
    w: ROOM_W,
    h: ROOM_H,
    theme: { ...STARTER_THEME },
  };
  await set(metaRef(id), meta);
  return id;
}

export const updateRoom = (id: string, patch: Record<string, unknown>) => update(metaRef(id), patch);

/** Furniture of the public room lives under lobby/furni (admin only); everyone else's under their room. */
const furniPathOf = (roomId: string) => (roomId === LOBBY_ID ? "lobby/furni" : `roomsMeta/${roomId}/furni`);

export async function placeFurni(id: string, kind: string, x: number, y: number, dir = 0): Promise<void> {
  const f = push(ref(db, furniPathOf(id)));
  await set(f, dir ? { kind, x, y, dir } : { kind, x, y });
}

export const removeFurni = (id: string, fid: string) => remove(ref(db, `${furniPathOf(id)}/${fid}`));

/** Can this player walk straight in? Mirrors the database rules so we can say no politely instead of failing.
 *  Open rooms and friends' rooms: yes. Anyone else needs to be let in (a roomInvites entry), which a knock asks for. */
export async function canEnter(meta: RoomMeta, uid: string, friendUids: Set<string>, trespass = false): Promise<boolean> {
  if (meta.owner === uid || meta.access === "open" || trespass) return true; // (trespass: a shroom or DMT is working)
  if (meta.access !== "none" && friendUids.has(meta.owner)) return true;
  const inv = await get(ref(db, `roomInvites/u_${meta.owner}/${uid}`));
  return inv.exists();
}
