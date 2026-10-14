import type { Profile } from "./db";
import { assetUrl } from "./assetUrl";

// An emote is a short performance: a face and/or arm action from the avatar sprites, a body motion,
// and floating glyphs. Free emotes are always usable; the rest are sold in the shop for drops of blood
// and unlocked by an `emote_<id>` entry in the player's owned map (the database rules check it too).
export type Motion = "bounce" | "hop" | "spin" | "dance";

export interface EmoteDef {
  id: string;
  name: string;
  /** the picture shown on its button (an Old School RuneScape emote icon, see public/osrs/README.txt) */
  icon: string;
  desc: string;
  /** drops of blood; 0 = free for everyone */
  price: number;
  /** avatar face gesture: sml (smile), sad, agr (angry), sur (surprised), eyb (eyes closed) */
  gesture?: string;
  /** avatar actions while performing, e.g. ["wav"] or ["sit"] */
  actions?: string[];
  motion?: Motion;
  /** glyphs that float up above the head */
  fx?: string[];
  /** how long it plays, ms (0 = until you move) */
  ms: number;
}

export const EMOTES: EmoteDef[] = [
  { id: "wave", name: "Wave", icon: assetUrl("osrs/emote_wave.png"), desc: "Say hi.", price: 0, actions: ["wav"], ms: 2200 },
  { id: "smile", name: "Smile", icon: assetUrl("osrs/emote_smile.png"), desc: "A friendly grin.", price: 0, gesture: "sml", ms: 3500 },
  { id: "sad", name: "Sad", icon: assetUrl("osrs/emote_sad.png"), desc: "Bit of a downer.", price: 0, gesture: "sad", fx: ["💧"], ms: 3500 },
  { id: "jump", name: "Jump", icon: assetUrl("osrs/emote_jump.png"), desc: "Hop on the spot.", price: 0, motion: "hop", ms: 1300 },

  { id: "angry", name: "Angry", icon: assetUrl("osrs/emote_angry.png"), desc: "Steam comes out of your ears.", price: 1, gesture: "agr", fx: ["💢"], ms: 3500 },
  // (the "sur" face sprite is missing from the hosted atlas, so this one jumps instead of changing face)
  { id: "surprised", name: "Surprised", icon: assetUrl("osrs/emote_surprised.png"), desc: "Didn't see that coming.", price: 1, motion: "hop", fx: ["❗", "❓"], ms: 1800 },
  { id: "sleep", name: "Sleep", icon: assetUrl("osrs/emote_sleep.png"), desc: "Eyes shut, zzz.", price: 1, gesture: "eyb", fx: ["💤"], ms: 5000 },
  { id: "laugh", name: "Laugh", icon: assetUrl("osrs/emote_laugh.png"), desc: "Crack up.", price: 2, gesture: "sml", motion: "bounce", fx: ["😂"], ms: 3500 },
  { id: "love", name: "Love", icon: assetUrl("osrs/emote_love.png"), desc: "Hearts everywhere.", price: 2, gesture: "sml", fx: ["❤️", "💕"], ms: 4000 },
  { id: "cheer", name: "Cheer", icon: assetUrl("osrs/emote_cheer.png"), desc: "Hands up, confetti.", price: 2, actions: ["wav"], motion: "hop", fx: ["🎉", "✨"], ms: 3000 },
  { id: "spin", name: "Spin", icon: assetUrl("osrs/emote_spin.png"), desc: "Round and round.", price: 2, motion: "spin", ms: 2200 },
  { id: "dance", name: "Dance", icon: assetUrl("osrs/emote_dance.png"), desc: "Bust a move.", price: 3, motion: "dance", fx: ["🎵", "🎶"], ms: 6000 },
];

export const EMOTE_BY_ID: Record<string, EmoteDef> = Object.fromEntries(EMOTES.map((e) => [e.id, e]));

export const emoteKey = (id: string) => `emote_${id}`;

// The admin can put emotes on sale, change their price, or make one free (config/shop/emotes). The built-in free emotes stay free.
let overrides: Record<string, { on: boolean; price: number }> = {};
export function setEmoteOverrides(o: Record<string, { on: boolean; price: number }>): void {
  overrides = o;
}
/** Current price in drops of blood (0 = free for everyone). */
export function emotePrice(def: EmoteDef): number {
  return def.price === 0 ? 0 : overrides[def.id]?.price ?? def.price;
}
/** Is it for sale in the shop right now? */
export function emoteForSale(def: EmoteDef): boolean {
  return def.price !== 0 && emotePrice(def) > 0 && (overrides[def.id]?.on ?? true);
}

export function hasEmote(p: Pick<Profile, "owned">, id: string): boolean {
  void p;
  return !!EMOTE_BY_ID[id]; // every emote is free for everyone now (the shop no longer sells them)
}

/** Order of facing directions for spinning, clockwise on screen. */
export const SPIN_DIRS = [2, 3, 4, 5, 6, 7, 0, 1];
