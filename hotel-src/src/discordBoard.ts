// The blue notice board in the basement (the Discord): a title, a text and a link that the admin writes (the server writes discordBoard, everybody signed in reads it).
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";

export interface BoardNote { title: string; text: string; link: string }
export const BOARD_TITLE_MAX = 30;
export const BOARD_TEXT_MAX = 400;
export const BOARD_LINK_MAX = 200;

/** follows the board live; returns the stop function */
export function watchBoard(cb: (n: BoardNote) => void): () => void {
  return onValue(ref(db, "discordBoard"), (s) => {
    const v = (s.val() ?? {}) as Partial<BoardNote>;
    cb({ title: String(v.title ?? ""), text: String(v.text ?? ""), link: String(v.link ?? "") });
  }, () => cb({ title: "", text: "", link: "" }));
}
/** the admin writes the board */
export const boardSet = (p: Profile, n: BoardNote): Promise<unknown> => call(p, "boardSet", n);
