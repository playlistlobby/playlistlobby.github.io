// Moves a player's own timers on: the bins they searched, and the plants and mixers in their own room.
import type { Ctx } from "./ctx";

type Row = { plantedAt?: number; wateredAt?: number; mixJob?: { doneAt?: number } };

export async function skipTime(c: Ctx, dumpsters: Record<string, number>, ms: number): Promise<void> {
  for (const can of Object.keys(dumpsters)) dumpsters[can] -= ms; // (searched that much longer ago)
  const room = `u_${c.uid}`;
  const rows = (await c.db.get<Record<string, Row>>(`roomsMeta/${room}/furni`)) ?? {};
  for (const [id, row] of Object.entries(rows)) {
    if (typeof row?.plantedAt === "number") c.extra[`roomsMeta/${room}/furni/${id}/plantedAt`] = row.plantedAt - ms;
    if (typeof row?.wateredAt === "number") c.extra[`roomsMeta/${room}/furni/${id}/wateredAt`] = row.wateredAt - ms;
    if (typeof row?.mixJob?.doneAt === "number") c.extra[`roomsMeta/${room}/furni/${id}/mixJob/doneAt`] = row.mixJob.doneAt - ms;
  }
}
