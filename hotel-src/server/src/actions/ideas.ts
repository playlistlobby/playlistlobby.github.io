// The ideas board in the basement: an image board where everybody posts a title, a few words and a picture, likes and comments (the Playlist forum, in the hotel).
// Posts stay up for 24 hours. The browsers read the board straight from the database (rules: signed-in players may read, nobody may write); every change goes through here.
//   ideas/posts/<id>        { uid, name, figure, title, text?, img?: true, ts, likes?: { <uid>: true } }
//   ideas/comments/<id>/<c> { uid, name, text, ts }
//   ideasImg/<id>           the picture as a data URL (kept apart, so the list doesn't carry every picture with it)
//   ideasCool/<uid>         { post, comment } when this player last posted / commented
import { Action, requireInRoom } from "./util";
import { Ctx, fail } from "../ctx";
import { IDEA_COMMENT_GAP_MS, IDEA_COMMENT_MAX, IDEA_IMG_MAX, IDEA_LIFE_MS, IDEA_POST_GAP_MS, IDEA_TEXT_MAX, IDEA_TITLE_MAX } from "../../../src/shared/ideas";

const ID_RE = /^[a-z0-9]{6,24}$/;
const IMG_RE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const noControl = /^[^\u0000-\u001f\u007f]*$/;

interface PostRow { uid?: string; name?: string; title?: string; ts?: number; cn?: number }

/** a short text from the browser: trimmed, one line, within the limit */
function line(v: unknown, max: number, what: string, optional = false): string {
  if (v === undefined || v === null || v === "") { if (optional) return ""; return fail(`Write something in the ${what}.`); }
  if (typeof v !== "string" || !noControl.test(v)) return fail(`Bad ${what}.`);
  const t = v.replace(/\s+/g, " ").trim();
  if (!t && !optional) return fail(`Write something in the ${what}.`);
  if (t.length > max) return fail(`The ${what} can be ${max} characters at most.`);
  return t;
}

const newId = (c: Ctx): string => {
  const r = new Uint8Array(4);
  crypto.getRandomValues(r);
  return c.now.toString(36) + [...r].map((b) => (b % 36).toString(36)).join("");
};

/** takes a post (and its picture, comments and likes) off the board */
function removePost(c: Ctx, id: string): void {
  c.extra[`ideas/posts/${id}`] = null;
  c.extra[`ideas/comments/${id}`] = null;
  c.extra[`ideasImg/${id}`] = null;
}

export const ideaPost: Action = {
  async run(c, a) {
    await requireInRoom(c, "lobby");
    const title = line(a.title, IDEA_TITLE_MAX, "title");
    const body = line(a.text, IDEA_TEXT_MAX, "text", true);
    const img = a.image === undefined || a.image === null || a.image === "" ? "" : a.image;
    if (img !== "" && (typeof img !== "string" || img.length > IDEA_IMG_MAX || !IMG_RE.test(img))) fail("That picture can't be used.");
    const cool = await c.db.get<{ post?: number; comment?: number }>(`ideasCool/${c.uid}`);
    if (!c.isAdmin && cool?.post && c.now - cool.post < IDEA_POST_GAP_MS) fail(`Wait a moment before you post again (${Math.ceil((IDEA_POST_GAP_MS - (c.now - cool.post)) / 1000)} s).`);
    const w = await c.user();
    const id = newId(c);
    // the board only keeps what is still alive: whatever has run out goes now
    const posts = (await c.db.get<Record<string, PostRow>>("ideas/posts")) ?? {};
    for (const [pid, p] of Object.entries(posts)) if (!p || !(Number(p.ts) > c.now - IDEA_LIFE_MS)) removePost(c, pid);
    c.extra[`ideas/posts/${id}`] = {
      uid: c.uid, name: String(w.raw.name ?? "?").slice(0, 16), figure: String(w.raw.figure ?? "").slice(0, 200),
      title, ...(body ? { text: body } : {}), ...(img ? { img: true } : {}), ts: c.now,
    };
    if (img) c.extra[`ideasImg/${id}`] = img;
    c.extra[`ideasCool/${c.uid}/post`] = c.now;
    // (everything people write is kept for the admin, like the chat)
    c.extra[`chatLog/ideas${id}`] = { uid: c.uid, name: String(w.raw.name ?? "?").slice(0, 16), text: `[ideas] ${title}${body ? `: ${body}` : ""}${img ? " (picture)" : ""}`.slice(0, 100), room: "ideas", ts: c.now };
    return { id };
  },
};

export const ideaComment: Action = {
  async run(c, a) {
    await requireInRoom(c, "lobby");
    const pid = typeof a.post === "string" && ID_RE.test(a.post) ? a.post : fail("Bad post.");
    const body = line(a.text, IDEA_COMMENT_MAX, "comment");
    const post = await c.db.get<PostRow>(`ideas/posts/${pid}`);
    if (!post || !(Number(post.ts) > c.now - IDEA_LIFE_MS)) fail("That post is gone.");
    const cool = await c.db.get<{ post?: number; comment?: number }>(`ideasCool/${c.uid}`);
    if (!c.isAdmin && cool?.comment && c.now - cool.comment < IDEA_COMMENT_GAP_MS) fail("Not so fast.");
    const w = await c.user();
    const cid = newId(c);
    const name = String(w.raw.name ?? "?").slice(0, 16);
    c.extra[`ideas/comments/${pid}/${cid}`] = { uid: c.uid, name, text: body, ts: c.now };
    c.extra[`ideasCool/${c.uid}/comment`] = c.now;
    c.extra[`ideas/posts/${pid}/cn`] = (Number(post!.cn) || 0) + 1; // (how many comments it has)
    c.extra[`chatLog/ideas${cid}`] = { uid: c.uid, name, text: `[ideas comment on "${String(post!.title ?? "").slice(0, 18)}"] ${body}`.slice(0, 100), room: "ideas", ts: c.now };
    return { id: cid };
  },
};

/** a like (they mean nothing here, but they are nice to have) */
export const ideaLike: Action = {
  async run(c, a) {
    const pid = typeof a.post === "string" && ID_RE.test(a.post) ? a.post : fail("Bad post.");
    const post = await c.db.get<PostRow>(`ideas/posts/${pid}`);
    if (!post || !(Number(post.ts) > c.now - IDEA_LIFE_MS)) fail("That post is gone.");
    c.extra[`ideas/posts/${pid}/likes/${c.uid}`] = a.on === false ? null : true;
    return {};
  },
};

/** the poster takes their post down (the admin can take any down) */
export const ideaDelete: Action = {
  async run(c, a) {
    if (typeof a.comment === "string" && ID_RE.test(a.comment)) { // one comment
      const pid = typeof a.post === "string" && ID_RE.test(a.post) ? a.post : fail("Bad post.");
      const cm = await c.db.get<{ uid?: string }>(`ideas/comments/${pid}/${a.comment}`);
      if (!cm) return {};
      if (cm.uid !== c.uid && !c.isAdmin) fail("That isn't yours.");
      c.extra[`ideas/comments/${pid}/${a.comment}`] = null;
      const post = await c.db.get<PostRow>(`ideas/posts/${pid}`);
      if (post) c.extra[`ideas/posts/${pid}/cn`] = Math.max(0, (Number(post.cn) || 0) - 1);
      return {};
    }
    const pid = typeof a.post === "string" && ID_RE.test(a.post) ? a.post : fail("Bad post.");
    const post = await c.db.get<PostRow>(`ideas/posts/${pid}`);
    if (!post) return {};
    if (post.uid !== c.uid && !c.isAdmin) fail("That isn't yours.");
    removePost(c, pid);
    return {};
  },
};
