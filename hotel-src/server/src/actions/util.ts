import { Ctx, fail } from "../ctx";

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

export const isPublicRoom = (id: string): boolean => id === "lobby" || id === "shop" || id.startsWith("tut_");

/** How big a room is (the shared rooms are fixed; a player room is 8x8 until the landlord makes it bigger: the server writes its size). */
export async function roomSize(c: Ctx, roomId: string): Promise<{ w: number; h: number }> {
  if (roomId === "lobby" || roomId === `tut_${c.uid}`) return { w: 12, h: 12 };
  if (roomId === "shop") return { w: 15, h: 15 };
  if (/^u_[A-Za-z0-9]{1,40}$/.test(roomId)) {
    const m = await c.db.get<{ w?: number; h?: number }>(`roomsMeta/${roomId}`);
    const side = (n: unknown) => (typeof n === "number" && n >= 8 && n <= 14 ? Math.floor(n) : 8);
    return { w: side(m?.w), h: side(m?.h) };
  }
  return fail("Unknown room.");
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

export const cheb = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
