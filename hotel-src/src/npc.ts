import { onValue, ref, set, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import { DEFAULT_FIGURE, Gender } from "./catalog";

/** 6ixty, the basement's merchant and guide. He is not a player: he is never stored in a room, only drawn there. */
export const SIXTY = {
  id: "sixty",
  name: "6ixty",
  /** the tile he stands on (it can't be walked through) and which way he faces */
  x: 5,
  y: 0,
  dir: 4,
};

export interface NpcLook {
  figure: string;
  gender: Gender;
}

const FALLBACK: NpcLook = { figure: "hd-200-10.hr-99001-35.ch-3506-9003.cc-99003-9001.lg-99002-9002.sh-290-9001.wa-99006-9001-1408", gender: "M" };
let look: NpcLook = FALLBACK;

export const sixtyLook = (): NpcLook => look;

/** Follows the look the admin picked (config/npc/sixty); `cb` fires on every change. */
export function watchSixtyLook(cb: (l: NpcLook) => void): Unsubscribe {
  return onValue(
    ref(db, "config/npc/sixty"),
    (snap) => {
      const v = snap.val() as Partial<NpcLook> | null;
      look = v && typeof v.figure === "string" && v.figure ? { figure: v.figure, gender: v.gender === "F" ? "F" : "M" } : FALLBACK;
      cb(look);
    },
    () => cb(look)
  );
}

/** Admin only (the database rules refuse anyone else). */
export function saveSixtyLook(figure: string, gender: Gender): Promise<void> {
  return set(ref(db, "config/npc/sixty"), { figure, gender });
}

export const SIXTY_LINES = {
  psst: "psst",
  knife: "take this",
  tomorrow: "I have another gift for you tomorrow, now go collect blood.",
  syringe: "here, as promised.",
  shop: "what do you need?",
  full: "your pockets are full. clear some space.",
};
