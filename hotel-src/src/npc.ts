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

/** The landlord: stands behind the counter in the right corner of the shop room. Not a player either, only drawn there. */
export const LANDLORD = {
  id: "landlord",
  name: "Landlord",
  x: 13,
  y: 0,
  dir: 4,
  figure: "hd-180-10.hr-98113-9001.fa-98057.ch-98046-9004.lg-285-9004.sh-98143", // what the player PenerGuy wears
  /** what he says when you walk up */
  line: "looking for more space? or a fresh coat of paint?",
};

/** Bagmand: a vendor who only visits the basement for an hour at 01:00, 10:00 and 15:00 (see shared/bagmand.ts). He stands at the left wall beside the roulette table and looks like the player emil. */
export const BAGMAN = {
  id: "bagman",
  name: "bagmand",
  x: 5,
  y: 25,
  dir: 1,
  figure: "hd-190-1.hr-97012-42.ch-98188-1408.lg-98120-9004.sh-98136-1408.wa-98147-1408", // what the player Emil wears now
  line: "psst. fresh seeds. blue for the road.",
};

/** The hideout landlord: stands against the left wall past bagmand (who is at y=19), two tiles up from the hideout door (0,24). Sells hideouts. */
export const HIDEOUT_LANDLORD = {
  id: "hideoutlandlord",
  name: "Landlord",
  x: 0,
  y: 22,
  dir: 2,
  figure: LANDLORD.figure,
  line: "Skal du bruge et sted til dig og dine guys?",
};

/** The pet merchant: "pets bih", who stands in the shop room where the basket was. He looks like the player Emil. Sells pets. */
export const PET_MERCHANT = {
  id: "petmerchant",
  name: "pets bih",
  x: 14,
  y: 7,
  dir: 6,
  figure: "hd-600-1.hr-98104-9002.he-98089-74.fa-97041.ch-98028-74.lg-98120-9002.sh-98142-1408.wa-98147-82", // what the player Emil wears
  line: "pets. 1000 to 2000 blood. some are on sale, some are not. dont ask.",
};

export interface NpcLook {
  figure: string;
  gender: Gender;
}

const FALLBACK: NpcLook = { figure: "hd-200-10.hr-99001-35.ea-99011-9004.ch-3506-9003.cc-99003-9001.lg-99002-9002.sh-99010-9001.wa-99006-9001-1408", gender: "M" };
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

/** The guy 6ixty sends you to stab in the private copy of the basement (a stand-in: he is never stored anywhere). He wears what the account asdasdasd wore. */
export const LEGEND = {
  id: "legend",
  name: "LegendGamer2015",
  figure: "hd-190-10.hr-891-42.he-98089-9004.fa-98057.ch-98046-9002.cc-98025-80.ca-98005-1408.lg-98120-64.sh-98143.wa-98147-9003",
  x: 7,
  y: 5,
  dir: 4,
};

/** what he says the next time you walk into the public room after the introduction (not during it) */
export const sixtyCheckIn = (when: string): string => `you earned your first blood. come back in about ${when}, I will have another job.`;

export const SIXTY_LINES = {
  legend: "now go over and use the knife on that guy.",
  legendAgain: "the knife. that guy. go.",
  goodjob: "good job.",
  pill: "eat this pill.",
  pillAgain: "eat the pill.",
  psst: "psst",
  knife: "take this",
  lighterJob: "Gå ind i butikken og køb en lighter til mig",
  lighterJob2: "Så giv mig den her når du har købt den",
  lighterAgain: "no lighter yet. the shop, the yellow door.",
  lighterDone: "good. that is your pay.",
  lighterKit: "take this too. plant something.",
  shop: "what do you need?",
  full: "your pockets are full. clear some space.",
};
