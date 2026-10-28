import { Ctx, fail } from "../ctx";
import { hideoutRole, isHideoutId } from "../../../src/shared/hideout";
import { STREETS_H, STREETS_W } from "../../../src/shared/streets";

export interface Action {
  run(c: Ctx, args: any): Promise<unknown>;
  /** extra lock keys besides the acting player (other players, rooms) */
  locks?(c: Ctx, args: any): Promise<string[]> | string[];
}

export function int(v: unknown, min: number, max: number, what: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return fail(`Bad ${what}.`);
  return n;
}
export function text(v: unknown, re: RegExp, what: string): string {
  if (typeof v !== "string" || !re.test(v)) return fail(`Bad ${what}.`);
  return v;
}
export const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export const isPublicRoom = (id: string): boolean => id === "lobby" || id === "shop" || id === "mines" || id === "arrival" || id === "streets" || id.startsWith("tut_");

/** How big a room is (the shared rooms are fixed; a player room is 8x8 until the landlord makes it bigger: the server writes its size). */
export async function roomSize(c: Ctx, roomId: string): Promise<{ w: number; h: number }> {
  if (roomId === "lobby" || roomId === `tut_${c.uid}`) return { w: 12, h: 26 };
  if (roomId === "shop") return { w: 15, h: 15 };
  if (roomId === "mines") return { w: 14, h: 14 };
  if (roomId === "arrival") return { w: 11, h: 11 };
  if (roomId === "streets") return { w: STREETS_W, h: STREETS_H };
  if (/^u_[A-Za-z0-9]{1,40}$/.test(roomId)) {
    const m = await c.db.get<{ w?: number; h?: number }>(`roomsMeta/${roomId}`);
    const side = (n: unknown) => (typeof n === "number" && n >= 8 && n <= 14 ? Math.floor(n) : 8);
    return { w: side(m?.w), h: side(m?.h) };
  }
  if (isHideoutId(roomId)) { // a hideout: 14, 17 or 20 tiles a side (the server writes w and h)
    const m = await c.db.get<{ w?: number; h?: number }>(`roomsMeta/${roomId}`);
    const side = (n: unknown) => (typeof n === "number" && n >= 8 && n <= 24 ? Math.floor(n) : 14);
    return { w: side(m?.w), h: side(m?.h) };
  }
  return fail("Unknown room.");
}

export interface HideoutMetaRow { owner?: string; ownerName?: string; name?: string; w?: number; h?: number; level?: number; lock?: boolean; members?: Record<string, { name?: string; build?: boolean; grow?: boolean; stash?: boolean; at?: number }> }
/** A hideout's record and what the caller may do in it (the owner and the members get in; the admin does everything). */
export async function hideoutAccess(c: Ctx, room: string): Promise<{ meta: HideoutMetaRow; owner: boolean; member: boolean; canBuild: boolean; canGrow: boolean; canStash: boolean }> {
  if (!isHideoutId(room)) return fail("That isn't a hideout.");
  const meta = await c.db.get<HideoutMetaRow>(`roomsMeta/${room}`);
  if (!meta || !meta.owner) return fail("That hideout doesn't exist.");
  return { meta, ...hideoutRole(meta, c.uid, c.isAdmin) };
}
/** The caller is a member of that hideout (they don't have to be standing in it). */
export async function requireHideoutMember(c: Ctx, room: string): Promise<{ meta: HideoutMetaRow; owner: boolean; canBuild: boolean; canGrow: boolean; canStash: boolean }> {
  const h = await hideoutAccess(c, room);
  if (!h.member) fail("You aren't in that hideout.");
  return h;
}
/**
 * The room a mixer, a growing kit or the sink is used in: your own room, or a hideout you are a member of (you have to be standing in it).
 * Anyone in the hideout may use these, whether or not they may build.
 */
export async function requireWorkRoom(c: Ctx, want?: unknown): Promise<string> {
  if (want === undefined || want === `u_${c.uid}`) return requireOwnRoom(c);
  const room = text(want, /^h_[A-Za-z0-9]{1,40}$/, "room");
  const h = await requireHideoutMember(c, room);
  if (!h.canGrow) fail("The owner has turned off the pots, the mixers and the sink for you.");
  await requireInRoom(c, room);
  return room;
}

/** The caller must be standing in that room (their player node is there). Returns where they stand. */
export async function requireInRoom(c: Ctx, roomId: string): Promise<{ x: number; y: number } | null> {
  await roomSize(c, roomId);
  const node = await c.db.get<{ x?: number; y?: number }>(`rooms/${roomId}/players/${c.uid}`);
  if (!node) return fail("You aren't in that room.");
  return typeof node.x === "number" && typeof node.y === "number" ? { x: node.x, y: node.y } : null;
}

/** The caller's own room id, once they are standing in it. */
export async function requireOwnRoom(c: Ctx): Promise<string> {
  const id = `u_${c.uid}`;
  await requireInRoom(c, id);
  return id;
}

/** Is the caller standing on the street right now (where the fights are)? What kills you, or gets you out of a fight, is not allowed there. */
export async function onTheStreet(c: Ctx): Promise<boolean> {
  return !!(await c.db.get(`rooms/streets/players/${c.uid}`));
}

export const cheb = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
