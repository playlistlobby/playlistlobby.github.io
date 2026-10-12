import { get, onValue, push, ref, remove, set, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";

/** open = anyone walks in; knock = friends walk in, everyone else knocks and waits; closed = friends only, no knocking. */
export type Access = "open" | "knock" | "closed";

/** Older rooms may still say friends/invite; they mean knock/closed. */
export const normAccess = (a: string | undefined): Access => (a === "open" ? "open" : a === "closed" || a === "invite" ? "closed" : "knock");

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
  /** clicking it in your own room walks you over and opens this page */
  opens?: "character";
  /** lies flat on the floor: you can walk over it and it's drawn underneath everyone */
  flat?: boolean;
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

export const FURNI_KINDS: Record<string, FurniKind> = {
  arcade: { id: "arcade", label: "Arcade machine", icon: "🕹️", w: 1, h: 1, height: 78, color: "#26327a", placeable: false },
  cdplayer: { id: "cdplayer", label: "CD player", icon: "💿", w: 1, h: 1, height: 38, color: "#2d3140", placeable: false },
  // the bed every player room has (a fixed piece: not in the furniture menu, not stored in the database)
  bed: { id: "bed", label: "Bed", icon: "🛏️", w: 1, h: 3, height: 30, color: "#6b5a48", placeable: false, nitro: "furni/hween_c25_makeshiftbed.nitro", rotatable: true, fixed: true },
  // the bag of clothes in the corner of your own room: click it (your avatar walks over first) to open the Character page
  bag: { id: "bag", label: "Bag of clothes", icon: "🛍️", w: 1, h: 1, height: 26, color: "#2a2a2a", placeable: false, nitro: "furni/messy_c21_trashbags.nitro", rotatable: true, fixed: true, opens: "character" },
};

/** Furniture you can click on and do something with (not just walk around). */
export const INTERACTIVE_KINDS = new Set(["arcade", "cdplayer"]);

export interface PlacedFurni {
  id: string;
  kind: string;
  x: number;
  y: number;
  /** facing 0/2/4/6 (only matters for rotatable pieces) */
  dir?: number;
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
}

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
    furni: extras.filter((f) => FURNI_KINDS[f.kind]),
    doorX: DOOR_X,
  };
}

/** The built-in lobby pieces can't be picked up; the ones the admin added can. */
export const isFixedLobbyPiece = (id: string) => /^lobby\d+$/.test(id) || id === BED_ID || id === BAG_ID;

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
  furni?: Record<string, { kind: string; x: number; y: number; dir?: number }>;
}

export function defFromMeta(id: string, meta: RoomMeta): RoomDef {
  const theme: RoomTheme = { ...DEFAULT_THEME, ...(meta.theme ?? {}) };
  // furniture of kinds that no longer exist (the old test cubes) is ignored; the bed is always there
  const furni: PlacedFurni[] = Object.entries(meta.furni ?? {})
    .filter(([, f]) => FURNI_KINDS[f.kind] && !FURNI_KINDS[f.kind].fixed)
    .map(([fid, f]) => ({ id: fid, kind: f.kind, x: f.x, y: f.y, dir: f.dir }));
  furni.unshift({ id: BED_ID, kind: "bed", x: BED.x, y: BED.y, dir: BED.dir }, { id: BAG_ID, kind: "bag", x: BAG.x, y: BAG.y, dir: BAG.dir });
  const rug: RugRect | null = theme.rug
    ? { x0: Math.floor((ROOM_W - 4) / 2), y0: Math.floor((ROOM_H - 4) / 2), w: 4, h: 4 }
    : null;
  return { id, name: meta.name, ownerUid: meta.owner, ownerName: meta.ownerName, access: normAccess(meta.access), w: ROOM_W, h: ROOM_H, theme, rug, furni, doorX: DOOR_X };
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
export async function canEnter(meta: RoomMeta, uid: string, friendUids: Set<string>): Promise<boolean> {
  if (meta.owner === uid || meta.access === "open" || friendUids.has(meta.owner)) return true;
  const inv = await get(ref(db, `roomInvites/u_${meta.owner}/${uid}`));
  return inv.exists();
}
