// The particle effects of the unusuals (hats, and the pets that come out of a mystery box): the browser draws them (drawUnusualFx in ui/room.ts).
export const UNUSUAL_FX = ["flames", "stars", "hearts", "snow", "bubbles", "bolts", "rainbow", "embers", "galaxy", "sakura", "toxic", "sparks"] as const;
export type UnusualEffect = (typeof UNUSUAL_FX)[number];
export const isUnusualFx = (v: unknown): v is UnusualEffect => typeof v === "string" && (UNUSUAL_FX as readonly string[]).includes(v);
