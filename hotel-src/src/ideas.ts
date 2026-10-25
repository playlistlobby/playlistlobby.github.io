// The ideas board: what is on it (ideas/posts, ideas/comments/<post>, ideasImg/<post>: written only by the server) and the things you can do on it.
// The rules and the limits live on the server (server/src/actions/ideas.ts): the browser only asks.
import { get, onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call } from "./db";
import type { Profile } from "./db";
import { IDEA_IMG_MAX, parseIdeaComments, parseIdeas } from "./shared/ideas";
import type { IdeaComment, IdeaPost } from "./shared/ideas";

export type { IdeaComment, IdeaPost } from "./shared/ideas";
export { IDEA_COMMENT_MAX, IDEA_LIFE_MS, IDEA_TEXT_MAX, IDEA_TITLE_MAX } from "./shared/ideas";

/** Follows the board (newest first, nothing older than 24 hours); returns the stop function. */
export function watchIdeas(cb: (posts: IdeaPost[]) => void): () => void {
  return onValue(ref(db, "ideas/posts"), (snap) => cb(parseIdeas(snap.val(), Date.now())), () => cb([]));
}
/** Follows the comments under one post; returns the stop function. */
export function watchIdeaComments(post: string, cb: (c: IdeaComment[]) => void): () => void {
  return onValue(ref(db, `ideas/comments/${post}`), (snap) => cb(parseIdeaComments(snap.val())), () => cb([]));
}

const pictures = new Map<string, Promise<string | null>>();
/** A post's picture (fetched once; null if it is gone). */
export function ideaPicture(post: string): Promise<string | null> {
  let p = pictures.get(post);
  if (!p) {
    p = get(ref(db, `ideasImg/${post}`)).then((s) => (typeof s.val() === "string" ? (s.val() as string) : null), () => null);
    pictures.set(post, p);
  }
  return p;
}

export const postIdea = (p: Profile, a: { title: string; text?: string; image?: string }): Promise<{ id: string }> => call(p, "ideaPost", a);
export const commentIdea = (p: Profile, post: string, text: string): Promise<unknown> => call(p, "ideaComment", { post, text });
export const likeIdea = (p: Profile, post: string, on: boolean): Promise<unknown> => call(p, "ideaLike", { post, on });
export const deleteIdea = (p: Profile, post: string, comment?: string): Promise<unknown> => call(p, "ideaDelete", { post, ...(comment ? { comment } : {}) });

/** A picture from the player's own files, made small enough for a post (a JPEG data URL under the limit). */
export async function shrinkPicture(file: File): Promise<string> {
  const src = await new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => no(new Error("That file can't be read.")); r.readAsDataURL(file); });
  const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("That isn't a picture.")); i.src = src; });
  for (const max of [1000, 800, 640, 480, 360]) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); // (a see-through picture would turn black as a JPEG)
    g.drawImage(img, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", 0.8);
    if (url.length < IDEA_IMG_MAX - 2000) return url;
  }
  throw new Error("That picture is too big.");
}
