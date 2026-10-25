// The ideas board in the basement: the Playlist forum (an imageboard in the style of the iOS 6 Notes app) as a window in the hotel. Everybody posts a title, a few
// words and a picture; posts stay up for 24 hours. Tap a name or a head to see that player's profile. Likes mean nothing here, but they are there.
// What is on the board lives in the database (src/ideas.ts); the server does every change (server/src/actions/ideas.ts).
import { h, toast } from "./dom";
import { headBox } from "./head";
import { openProfileWindow, ProfileWindowApi } from "./profileWindow";
import { commentIdea, deleteIdea, IDEA_COMMENT_MAX, IDEA_LIFE_MS, IDEA_TEXT_MAX, IDEA_TITLE_MAX, ideaPicture, likeIdea, postIdea, shrinkPicture, watchIdeaComments, watchIdeas } from "../ideas";
import type { IdeaComment, IdeaPost } from "../ideas";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface IdeasBoardApi { close(): void }

const HEART = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.5 1.1 5.3 3 1.8-1.9 3.2-3 5.3-3 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';
const BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4C6.8 4 3 7.2 3 11c0 2.2 1.3 4.2 3.4 5.5-.2 1.2-.8 2.3-1.8 3.2 1.9 0 3.6-.7 4.8-1.9.8.2 1.7.3 2.6.3 5.2 0 9-3.2 9-7.1S17.2 4 12 4z"/></svg>';
const hours = Math.round(IDEA_LIFE_MS / 3_600_000);

const ago = (t: number): string => {
  const m = Math.round((Date.now() - t) / 60_000);
  return m < 1 ? "now" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h`;
};

/** An element built from markup that is ours (the two little icons above). */
const icon = (svg: string): HTMLElement => { const s = h("span", { class: "ib-ico" }); s.innerHTML = svg; return s; };

export function openIdeasBoard(host: HTMLElement, ctx: Ctx, onClose: () => void): IdeasBoardApi {
  const me = ctx.profile;
  let closed = false;
  let posts: IdeaPost[] | null = null;
  let openId: string | null = null;
  let comments: IdeaComment[] = [];
  let stopComments: (() => void) | null = null;
  let profileWin: ProfileWindowApi | null = null;
  let picture: string | null = null; // the picture of the post being written
  let sending = false;
  const liking = new Map<string, boolean>(); // my likes the database hasn't confirmed yet
  const pictures = new Map<string, string>(); // pictures fetched so far, so a refresh doesn't flash

  // ---- the three screens: the board, one post, a new post -----------------------------------------------------------------------
  const nav = (title: string, left: HTMLElement | null, right: HTMLElement | null): HTMLElement =>
    h("div", { class: "ib-nav" }, left ?? h("span", {}), h("div", { class: "ib-nav-t" }, title), right ?? h("span", {}));
  const navBtn = (label: string, onclick: () => void, extra = ""): HTMLButtonElement => h("button", { class: "ib-navbtn " + extra, type: "button", onclick }, label) as HTMLButtonElement;

  const list = h("div", { class: "ib-list" });
  const empty = h("div", { class: "ib-empty" });
  const feedBody = h("div", { class: "ib-body paper" }, list, empty);
  const plus = navBtn("+", () => openComposer(), "plus");
  plus.setAttribute("aria-label", "New post");
  const feed = h("div", { class: "ib-screen" }, nav("Ideas board", navBtn("Close", () => close()), plus), feedBody);

  const postBody = h("div", { class: "ib-body paper margin" });
  const postTitle = h("div", { class: "ib-nav-t" });
  const commentInput = h("input", { type: "text", maxLength: IDEA_COMMENT_MAX, placeholder: "Comment", autocomplete: "off", "aria-label": "Comment" }) as HTMLInputElement;
  const commentSend = h("button", { type: "submit" }, "Send") as HTMLButtonElement;
  const commentForm = h("form", { class: "ib-form", onsubmit: (e: Event) => { e.preventDefault(); void sendComment(); } }, commentInput, commentSend);
  const postSheet = h("div", { class: "ib-sheet", hidden: true },
    h("div", { class: "ib-nav" }, navBtn("Ideas", () => closePost(), "back"), postTitle, h("span", {})), postBody, commentForm);

  const titleInput = h("input", { type: "text", maxLength: IDEA_TITLE_MAX, placeholder: "Title", autocomplete: "off", "aria-label": "Title" }) as HTMLInputElement;
  const textInput = h("textarea", { maxLength: IDEA_TEXT_MAX, placeholder: "Tell us more (if you want)", rows: 4, "aria-label": "Text", oninput: () => { count.textContent = `${textInput.value.length} / ${IDEA_TEXT_MAX}`; } }) as HTMLTextAreaElement;
  const count = h("div", { class: "ib-count" }, `0 / ${IDEA_TEXT_MAX}`);
  const preview = h("img", { class: "ib-prev", alt: "", hidden: true }) as HTMLImageElement;
  const removePic = h("button", { class: "ib-pbtn", type: "button", hidden: true, onclick: () => setPicture(null) }, "Remove") as HTMLButtonElement;
  const file = h("input", { type: "file", accept: "image/*", hidden: true, onchange: () => void pickPicture() }) as HTMLInputElement;
  const addPic = h("button", { class: "ib-pbtn", type: "button", onclick: () => file.click() }, "Add picture") as HTMLButtonElement;
  const send = navBtn("Post", () => void submit(), "send");
  const newSheet = h("div", { class: "ib-sheet", hidden: true },
    nav("New post", navBtn("Cancel", () => { newSheet.hidden = true; }, "back"), send),
    h("div", { class: "ib-body paper margin" }, h("div", { class: "ib-new" }, titleInput, textInput, count, h("div", { class: "ib-photo" }, addPic, removePic, file), preview)));

  const card = h("div", { class: "ib-card", role: "dialog", "aria-label": "Ideas board" }, feed, postSheet, newSheet);
  const el = h("div", { class: "ib-overlay", onclick: (e: Event) => { if (e.target === el) close(); } }, card);
  host.append(el);

  // ---- the board ----------------------------------------------------------------------------------------------------------------
  const orb = (p: { uid: string; figure: string }): HTMLElement => {
    const b = h("button", { class: "ib-orb", type: "button", "aria-label": "Profile", onclick: (e: Event) => { e.stopPropagation(); showProfile(p.uid); } }, headBox(p.figure));
    return b;
  };
  function showProfile(uid: string): void {
    profileWin?.close();
    profileWin = openProfileWindow(el, ctx, uid, () => { profileWin = null; });
  }
  const isMine = (uid: string): boolean => uid === me.uid;

  function postEl(p: IdeaPost, full: boolean): HTMLElement {
    const head = h("div", { class: "ib-head" },
      orb(p),
      h("button", { class: "ib-name", type: "button", onclick: (e: Event) => { e.stopPropagation(); showProfile(p.uid); } }, p.name),
      h("span", { class: "ib-time" }, ago(p.ts)));
    const art = h("article", { class: "ib-post" }, head, h("div", { class: "ib-ptitle" }, p.title));
    if (p.img) {
      const have = pictures.get(p.id);
      const im = h("img", { class: "ib-img", alt: p.title, ...(have ? { src: have } : {}) }) as HTMLImageElement;
      if (!have) {
        im.classList.add("loading");
        void ideaPicture(p.id).then((url) => { if (url) { pictures.set(p.id, url); im.src = url; im.classList.remove("loading"); } else im.remove(); });
      }
      art.append(im);
    }
    if (p.text) art.append(h("p", { class: "ib-text" }, p.text));
    const mine = liking.has(p.id) ? liking.get(p.id)! : p.likes.includes(me.uid);
    const n = p.likes.filter((u) => u !== me.uid).length + (mine ? 1 : 0);
    const like = h("button", { class: "ib-act" + (mine ? " liked" : ""), type: "button", "aria-label": (mine ? "Unlike" : "Like") + ` · ${n}`,
      onclick: (e: Event) => { e.stopPropagation(); void toggleLike(p, !mine); } }, icon(HEART), String(n));
    const talk = h("button", { class: "ib-act", type: "button", "aria-label": `${p.cn} comments` }, icon(BUBBLE), String(p.cn));
    const foot = h("div", { class: "ib-foot" }, like, talk);
    if (isMine(p.uid) || me.isAdmin) {
      foot.append(h("button", { class: "ib-del", type: "button", onclick: (e: Event) => { e.stopPropagation(); void remove(p); } }, "Delete"));
    }
    art.append(foot);
    if (!full) art.addEventListener("click", () => openPost(p.id));
    return art;
  }

  function drawFeed(): void {
    if (closed) return;
    const rows = posts ?? [];
    list.replaceChildren(...rows.map((p) => postEl(p, false)));
    empty.hidden = posts === null || rows.length > 0;
    empty.textContent = `Nothing here yet. Tap + to post something. Posts stay for ${hours} hours.`;
    if (openId) {
      const p = rows.find((x) => x.id === openId);
      if (p) postBody.replaceChildren(postEl(p, true), commentsEl()); else closePost();
    }
  }

  async function toggleLike(p: IdeaPost, on: boolean): Promise<void> {
    liking.set(p.id, on);
    if (on) playSfx("select", 0.35);
    drawFeed();
    try { await likeIdea(me, p.id, on); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    liking.delete(p.id);
    drawFeed();
  }

  async function remove(p: IdeaPost): Promise<void> {
    if (!window.confirm(`Delete “${p.title}”? It is removed for everybody.`)) return;
    try { await deleteIdea(me, p.id); logAction(me, "room", `took down the idea "${p.title}"`); toast("Post deleted."); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
  }

  // ---- one post, with its comments ------------------------------------------------------------------------------------------------
  function commentsEl(): HTMLElement {
    const box = h("div", { class: "ib-comments" });
    if (!comments.length) box.append(h("p", { class: "ib-text" }, "No comments yet."));
    for (const c of comments) {
      const head = h("div", { class: "ib-head" }, h("button", { class: "ib-name", type: "button", onclick: () => showProfile(c.uid) }, c.name), h("span", { class: "ib-time" }, ago(c.ts)));
      if (isMine(c.uid) || me.isAdmin) head.append(h("button", { class: "ib-del small", type: "button", onclick: () => void deleteIdea(me, openId!, c.id).catch((err) => toast((err as Error).message, "err")) }, "Delete"));
      box.append(h("div", { class: "ib-c" }, head, h("p", {}, c.text)));
    }
    return box;
  }
  function openPost(id: string): void {
    const p = posts?.find((x) => x.id === id);
    if (!p) return;
    openId = id; comments = [];
    stopComments?.();
    stopComments = watchIdeaComments(id, (list) => { comments = list; if (openId === id) drawFeed(); });
    postTitle.textContent = p.title;
    postSheet.hidden = false;
    commentInput.value = "";
    drawFeed();
  }
  function closePost(): void {
    openId = null; comments = [];
    stopComments?.(); stopComments = null;
    postSheet.hidden = true;
  }
  async function sendComment(): Promise<void> {
    const text = commentInput.value.trim();
    if (!text || !openId || commentSend.disabled) return;
    commentSend.disabled = true;
    try {
      await commentIdea(me, openId, text);
      playSfx("select", 0.35);
      commentInput.value = "";
      logAction(me, "room", "commented on the ideas board");
      setTimeout(() => { postBody.scrollTop = postBody.scrollHeight; }, 200);
    } catch (err) { toast((err as Error).message || "Comment not posted. Try again.", "err"); }
    finally { commentSend.disabled = false; }
  }

  // ---- a new post -----------------------------------------------------------------------------------------------------------------
  function setPicture(url: string | null): void {
    picture = url;
    preview.hidden = !url; removePic.hidden = !url;
    if (url) preview.src = url; else preview.removeAttribute("src");
  }
  async function pickPicture(): Promise<void> {
    const f = file.files?.[0];
    file.value = "";
    if (!f) return;
    addPic.disabled = true;
    try { setPicture(await shrinkPicture(f)); } catch (err) { toast((err as Error).message || "That picture can't be used.", "err"); }
    finally { addPic.disabled = false; }
  }
  function openComposer(): void {
    titleInput.value = ""; textInput.value = ""; count.textContent = `0 / ${IDEA_TEXT_MAX}`; setPicture(null);
    newSheet.hidden = false;
    setTimeout(() => titleInput.focus(), 300);
  }
  async function submit(): Promise<void> {
    const title = titleInput.value.trim(), text = textInput.value.trim();
    if (!title) { toast("Give your post a title.", "err"); titleInput.focus(); return; }
    if (sending) return;
    sending = true; send.disabled = true;
    try {
      await postIdea(me, { title, ...(text ? { text } : {}), ...(picture ? { image: picture } : {}) });
      playSfx("give", 0.4);
      logAction(me, "room", `posted "${title}" on the ideas board`);
      newSheet.hidden = true;
      feedBody.scrollTop = 0;
      toast(`Posted. It stays up for ${hours} hours.`);
    } catch (err) { toast((err as Error).message || "Post not sent. Try again.", "err"); }
    finally { sending = false; send.disabled = false; }
  }

  const stopPosts = watchIdeas((rows) => { posts = rows; drawFeed(); });
  const tick = window.setInterval(() => drawFeed(), 60_000); // (the "5 min" next to a post, and posts that have run out)
  drawFeed();

  function close(): void {
    if (closed) return;
    closed = true;
    stopPosts(); stopComments?.(); window.clearInterval(tick);
    profileWin?.close();
    el.remove();
    onClose();
  }
  return { close };
}
