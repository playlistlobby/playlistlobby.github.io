import { get, onValue, push, ref, remove, set, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";

export type Access = "open" | "friends" | "invite";

export interface RoomTheme {
  floorA: string;
  floorB: string;
  wall: string;
  rug: boolean;
  rugColor: string;
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
}

export const FURNI_KINDS: Record<string, FurniKind> = {
  crate: { id: "crate", label: "Crate", icon: "📦", w: 1, h: 1, height: 26, color: "#9c6b3a", placeable: true },
  table: { id: "table", label: "Table", icon: "🪵", w: 2, h: 2, height: 22, color: "#7b5a36", placeable: true },
  sofa: { id: "sofa", label: "Sofa", icon: "🛋️", w: 2, h: 1, height: 26, color: "#8a3e3e", placeable: true },
  plant: { id: "plant", label: "Plant", icon: "🪴", w: 1, h: 1, height: 44, color: "#3d7a45", placeable: true },
  lamp: { id: "lamp", label: "Lamp", icon: "💡", w: 1, h: 1, height: 62, color: "#c9b25a", placeable: true },
  shelf: { id: "shelf", label: "Shelf", icon: "📚", w: 1, h: 1, height: 74, color: "#6a4a2c", placeable: true },
  arcade: { id: "arcade", label: "Arcade machine", icon: "🕹️", w: 1, h: 1, height: 78, color: "#26327a", placeable: false },
  cdplayer: { id: "cdplayer", label: "CD player", icon: "💿", w: 1, h: 1, height: 38, color: "#2d3140", placeable: false },
};

/** Furniture you can click on and do something with (not just walk around). */
export const INTERACTIVE_KINDS = new Set(["arcade", "cdplayer"]);

export interface PlacedFurni {
  id: string;
  kind: string;
  x: number;
  y: number;
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
}

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
export const SIZES: Array<{ label: string; w: number; h: number }> = [
  { label: "Small 8×8", w: 8, h: 8 },
  { label: "Medium 10×10", w: 10, h: 10 },
  { label: "Large 12×12", w: 12, h: 12 },
  { label: "Wide 14×9", w: 14, h: 9 },
  { label: "Deep 9×14", w: 9, h: 14 },
];
export const MAX_FURNI = 40;

export const LOBBY_ID = "lobby";
export const ownRoomId = (uid: string) => `u_${uid}`;
export const isLobby = (id: string) => id === LOBBY_ID;

/** The public lobby: fixed layout, with the arcade machine against the back wall. */
export function lobbyDef(): RoomDef {
  const fixed: Array<[string, number, number]> = [["sofa", 9, 1], ["plant", 1, 9], ["table", 5, 5], ["arcade", 3, 0], ["arcade", 5, 0], ["cdplayer", 7, 0]];
  return {
    id: LOBBY_ID,
    name: "Main Lobby",
    ownerUid: null,
    ownerName: null,
    access: "open",
    w: 12,
    h: 12,
    theme: { ...DEFAULT_THEME },
    rug: { x0: 3, y0: 3, w: 6, h: 6 },
    furni: fixed.map(([kind, x, y], i) => ({ id: `lobby${i}`, kind, x, y })),
  };
}

export interface RoomMeta {
  owner: string;
  ownerName: string;
  name: string;
  access: Access;
  w: number;
  h: number;
  theme?: Partial<RoomTheme>;
  furni?: Record<string, { kind: string; x: number; y: number }>;
}

export function defFromMeta(id: string, meta: RoomMeta): RoomDef {
  const theme: RoomTheme = { ...DEFAULT_THEME, ...(meta.theme ?? {}) };
  const furni = Object.entries(meta.furni ?? {})
    .filter(([, f]) => FURNI_KINDS[f.kind])
    .map(([fid, f]) => ({ id: fid, kind: f.kind, x: f.x, y: f.y }));
  const rug: RugRect | null = theme.rug
    ? { x0: Math.max(0, Math.floor((meta.w - 4) / 2)), y0: Math.max(0, Math.floor((meta.h - 4) / 2)), w: 4, h: 4 }
    : null;
  return { id, name: meta.name, ownerUid: meta.owner, ownerName: meta.ownerName, access: meta.access, w: meta.w, h: meta.h, theme, rug, furni };
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

export async function createRoom(p: Profile): Promise<string> {
  const id = ownRoomId(p.uid);
  const meta: RoomMeta = {
    owner: p.uid,
    ownerName: p.name,
    name: `${p.name}'s room`.slice(0, 28),
    access: "friends",
    w: 10,
    h: 10,
    theme: { ...DEFAULT_THEME },
  };
  await set(metaRef(id), meta);
  return id;
}

export const updateRoom = (id: string, patch: Record<string, unknown>) => update(metaRef(id), patch);

export async function placeFurni(id: string, kind: string, x: number, y: number): Promise<void> {
  const f = push(ref(db, `roomsMeta/${id}/furni`));
  await set(f, { kind, x, y });
}

export const removeFurni = (id: string, fid: string) => remove(ref(db, `roomsMeta/${id}/furni/${fid}`));

/** Can this player walk in? Mirrors the database rules so we can say no politely instead of failing. */
export async function canEnter(meta: RoomMeta, uid: string, friendUids: Set<string>): Promise<boolean> {
  if (meta.owner === uid || meta.access === "open") return true;
  if (meta.access === "friends" && friendUids.has(meta.owner)) return true;
  const inv = await get(ref(db, `roomInvites/u_${meta.owner}/${uid}`));
  return inv.exists();
}
