// The ideas board (src/ui/ideasBoard.ts in the browser, server/src/actions/ideas.ts on the server): the limits both sides agree on.

/** how long a post stays on the board */
export const IDEA_LIFE_MS = 24 * 60 * 60_000;
export const IDEA_TITLE_MAX = 18;
export const IDEA_TEXT_MAX = 128;
export const IDEA_COMMENT_MAX = 100;
/** the biggest picture (a data URL, in characters): the browser shrinks every picture to fit */
export const IDEA_IMG_MAX = 250_000;
export const IDEA_POST_GAP_MS = 20_000;
export const IDEA_COMMENT_GAP_MS = 4_000;

export interface IdeaPost {
  id: string;
  uid: string;
  name: string;
  figure: string;
  title: string;
  text?: string;
  img: boolean;
  ts: number;
  likes: string[];
  /** how many comments it has */
  cn: number;
}
export interface IdeaComment { id: string; uid: string; name: string; text: string; ts: number }

/** the board's posts from what the database holds (newest first; anything past its 24 hours is left out) */
export function parseIdeas(raw: unknown, now: number): IdeaPost[] {
  if (!raw || typeof raw !== "object") return [];
  const out: IdeaPost[] = [];
  for (const [id, v] of Object.entries(raw as Record<string, any>)) {
    if (!v || typeof v.uid !== "string" || typeof v.title !== "string" || typeof v.ts !== "number" || v.ts <= now - IDEA_LIFE_MS) continue;
    out.push({
      id, uid: v.uid, name: String(v.name ?? "?"), figure: String(v.figure ?? ""), title: v.title.slice(0, IDEA_TITLE_MAX),
      ...(typeof v.text === "string" && v.text ? { text: v.text.slice(0, IDEA_TEXT_MAX) } : {}), img: v.img === true, ts: v.ts,
      likes: v.likes && typeof v.likes === "object" ? Object.keys(v.likes) : [], cn: Math.max(0, Math.floor(Number(v.cn) || 0)),
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}
export function parseIdeaComments(raw: unknown): IdeaComment[] {
  if (!raw || typeof raw !== "object") return [];
  const out: IdeaComment[] = [];
  for (const [id, v] of Object.entries(raw as Record<string, any>)) {
    if (!v || typeof v.uid !== "string" || typeof v.text !== "string" || typeof v.ts !== "number") continue;
    out.push({ id, uid: v.uid, name: String(v.name ?? "?"), text: v.text.slice(0, IDEA_COMMENT_MAX), ts: v.ts });
  }
  return out.sort((a, b) => a.ts - b.ts);
}
