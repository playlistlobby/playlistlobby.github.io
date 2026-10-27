// The effects of the unusuals (hats, and the pets that come out of a mystery box). They are pictures baked from Habbo's effect files (scripts/bake-fx.mjs, public/fx/<id>.png), drawn by src/ui/fxSprites.ts.
export const UNUSUAL_FX = ["confused", "untouchable", "chicks", "fireflies", "flies", "lightning", "mystic", "raincloud", "snowwar", "hearts", "thumbsup", "totem"] as const;
export type UnusualEffect = (typeof UNUSUAL_FX)[number];
/** what they are called in the game */
export const FX_LABELS: Record<UnusualEffect, string> = {
  confused: "Completely Confused", untouchable: "Untouchable", chicks: "Easter Chicks", fireflies: "Fireflies", flies: "Flies", lightning: "Lightning",
  mystic: "Mystic", raincloud: "Raincloud", snowwar: "Snow Warrior", hearts: "Spinning Hearts", thumbsup: "Spinning Thumbs Up", totem: "Totem Eagle",
};
/** the names the first effects had (a pet that came out of a box before the new ones keeps its place: it gets the new effect named here) */
const LEGACY_FX: Record<string, UnusualEffect> = {
  flames: "totem", stars: "fireflies", hearts: "hearts", snow: "snowwar", bubbles: "raincloud", bolts: "lightning", rainbow: "chicks", embers: "mystic", galaxy: "mystic", sakura: "thumbsup", toxic: "flies", sparks: "untouchable",
};
export const isUnusualFx = (v: unknown): v is UnusualEffect => typeof v === "string" && ((UNUSUAL_FX as readonly string[]).includes(v) || v in LEGACY_FX);
/** the effect as it is called now */
export const canonFx = (v: string): UnusualEffect => ((UNUSUAL_FX as readonly string[]).includes(v) ? (v as UnusualEffect) : LEGACY_FX[v] ?? "totem");
