// The names of pressed CDs (a CD made at a CD printer holds only the song's id): the server writes cdTitles/<song> when a song is pressed, and this reads it once per song.
import { get, ref } from "firebase/database";
import { db } from "./firebase";

const titles = new Map<string, string>();
const asked = new Set<string>();

/** "Title - Artist" of a pressed song, or null until it has been read (the pocket is redrawn when it arrives) */
export function pressedTitle(song: string): string | null {
  if (!asked.has(song)) {
    asked.add(song);
    get(ref(db, `cdTitles/${song}`)).then((s) => {
      const v = s.val() as { title?: unknown; by?: unknown } | null;
      if (v && typeof v.title === "string") {
        titles.set(song, typeof v.by === "string" && v.by ? `${v.title} - ${v.by}` : v.title);
        window.dispatchEvent(new Event("pocket-changed"));
      }
    }, () => undefined);
  }
  return titles.get(song) ?? null;
}
/** a title that is known already (the printer window has the song in front of it) */
export function rememberPressedTitle(song: string, title: string, by: string): void {
  titles.set(song, by ? `${title} - ${by}` : title);
  asked.add(song);
}
