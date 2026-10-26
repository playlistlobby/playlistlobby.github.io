import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { headBox } from "./head";
import { renderAvatar } from "../avatarService";
import { call, giftSend } from "../db";
import { REPORT_LIMIT } from "../shared/mod";
import { hideoutInvite } from "../hideout";
import { get as dbGet } from "firebase/database";
import { itemDef } from "../items";
import { canEnter, fetchMeta, ownRoomId } from "../rooms";
import { fetchProfile, FullProfile, fetchFullProfile, PROFILE_BGS, RelationKind, social } from "../social";
import { NO_DROP } from "../shared/items";
import { isStorable } from "../furnishing";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface ProfileWindowApi { close(): void }

type Visit = "go" | "knock" | "closed" | "none";
const STATUS_MAX = 60;

/** A copy of a cached avatar canvas that can be put on the page (the cache keeps the original). */
function copyOf(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width; c.height = src.height;
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
}

/**
 * A player's profile page, like MovieStarPlanet's: their look, a status line, their partner and best friends, and everything you can do with them
 * (visit, message, trade, send a gift, friend / unfriend, ask to be best friends). Your own profile also lets you change the status line and background.
 * Opened from the player menu in a room and from the friends list (the `open-profile` event, see messenger.ts).
 */
export function openProfileWindow(host: HTMLElement, ctx: Ctx, firstUid: string, onClose: () => void): ProfileWindowApi {
  const me = ctx.profile;
  let uid = firstUid;
  let closed = false;
  let prof: FullProfile | null = null;
  let loading = true;
  let visit: Visit = "none";
  /** you own a hideout (so you can invite this player to it) and this player is not in it yet */
  let canInviteToHideout = false;
  let view: "main" | "gift" | "edit" | "report" = "main";
  let busy = false;
  let confirmRemove = false;
  let stopKnock: (() => void) | null = null;
  let knocking = false;
  let token = 0;

  const card = h("div", { class: "pw-card", role: "dialog", "aria-label": "Profile" });
  const el = h("div", { class: "pw-overlay", onclick: (e: Event) => { if (e.target === el) close(); } }, card);
  host.append(el);

  async function load(target: string): Promise<void> {
    const mine = ++token;
    uid = target; loading = true; view = "main"; confirmRemove = false; canInviteToHideout = false; render();
    const p = await fetchFullProfile(target).catch(() => null);
    let v: Visit = "none";
    if (p && target !== me.uid) {
      void dbGet(ref(db, `hideouts/${me.uid}/${me.uid}`)).then(async (own) => {
        if (!own.exists() || target === me.uid) return;
        const inIt = await dbGet(ref(db, `roomsMeta/h_${me.uid}/members/${target}`)).catch(() => null);
        if (token === mine && !closed && !inIt?.exists()) { canInviteToHideout = true; render(); }
      }, () => undefined);
      const meta = await fetchMeta(ownRoomId(target)).catch(() => null);
      if (meta) {
        const allowed = me.isAdmin || (await canEnter(meta, me.uid, social.friendUids()).catch(() => false));
        v = allowed ? "go" : meta.access === "closed" || meta.access === "none" ? "closed" : "knock";
      }
    }
    if (closed || mine !== token) return;
    prof = p; visit = v; loading = false; render();
  }

  const isMe = (): boolean => uid === me.uid;
  const friend = (): boolean => social.friends.has(uid);
  const online = (): boolean => social.isOnline(uid);
  const bgColor = (): string => PROFILE_BGS.find((b) => b.id === prof?.bg)?.color ?? PROFILE_BGS[0].color;

  async function act(job: () => Promise<string | void>): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { const msg = await job(); if (msg) toast(msg); } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
    busy = false; if (!closed) render();
  }

  function btn(icon: string, label: string, onclick: () => void, opts: { disabled?: boolean; title?: string; primary?: boolean; tone?: string } = {}): HTMLElement {
    return h("button", { class: "pw-btn" + (opts.primary ? " primary" : ""), disabled: !!opts.disabled || busy, title: opts.title ?? label, onclick },
      h("span", { class: "pw-ico tone-" + (opts.tone ?? "gray") }, icon), h("span", { class: "pw-lbl" }, label), h("span", { class: "pw-chev" }, "›"));
  }
  /** a grouped list like the iOS 6 settings tables: one rounded box, rows split by thin lines */
  const group = (...rows: HTMLElement[]): HTMLElement => h("div", { class: "pw-group" }, ...rows);

  // ---- the three views ------------------------------------------------------------------------------------
  function actions(): HTMLElement[] {
    const name = prof!.name;
    const rel = social.relations.get(uid);
    if (isMe()) return [h("div", { class: "pw-sec" }, "This is you"), group(btn("✏️", "Customize", () => { view = "edit"; render(); }, { primary: true, tone: "blue" }))];
    const out: HTMLElement[] = [h("div", { class: "pw-sec" }, friend() ? "You are friends" : "You are not friends")];
    if (friend()) {
      const rows: HTMLElement[] = [];
      rows.push(confirmRemove
        ? h("div", { class: "pw-confirm" }, `Remove ${name}?`,
            h("button", { class: "btn small primary", onclick: () => void act(async () => { await social.removeFriend(uid); confirmRemove = false; logAction(me, "friend", `removed ${name}`); return `${name} isn't your friend any more.`; }) }, "Yes"),
            h("button", { class: "btn small", onclick: () => { confirmRemove = false; render(); } }, "No"))
        : btn("💔", "Remove friend", () => { confirmRemove = true; render(); }, { tone: "red" }));
      if (rel) rows.push(btn("✖️", rel === "partner" ? "End partnership" : "Not best friends", () => void act(async () => { await social.removeRelation(uid); return "Done."; }), { tone: "gray" }));
      else {
        rows.push(btn("⭐", "Best friends", () => void act(async () => { await social.askRelation(uid, "bff"); return `You asked ${name} to be your best friend.`; }), { title: "Ask to be best friends (up to 3)", tone: "yellow" }));
        rows.push(btn("💖", "Be partners", () => void act(async () => { await social.askRelation(uid, "partner"); return `You asked ${name} to be your partner.`; }), { title: "Ask to be partners (only one)", tone: "pink" }));
      }
      out.push(group(...rows));
    } else {
      out.push(group(btn("➕", "Add friend", () => void act(async () => social.sendRequest(name).then((s) => { logAction(me, "friend", `asked ${name}`); return s; })), { primary: true, tone: "green" })));
    }
    out.push(h("div", { class: "pw-sec" }, "Actions"));
    const visitLabel = visit === "go" ? "Visit" : visit === "knock" ? (knocking ? "Knocking…" : "Knock") : visit === "closed" ? "Room closed" : "No room";
    out.push(group(
      btn("🏠", visitLabel, () => doVisit(), { disabled: visit === "closed" || visit === "none" || knocking, title: visit === "closed" ? "Their room is closed to you" : "Go to their room", tone: "orange" }),
      btn("💬", "Message", () => { window.dispatchEvent(new CustomEvent("open-chat", { detail: uid })); close(); }, { disabled: !friend(), title: friend() ? "Send a message" : "Only friends can message each other", tone: "blue" }),
      btn("🔁", "Trade", () => void act(async () => { await social.inviteToTrade(uid); return `You ask ${name} to trade. They have to accept.`; }), { disabled: !online(), title: online() ? "Invite to trade" : "They have to be online", tone: "teal" }),
      btn("🎁", "Send gift", () => { view = "gift"; render(); }, { disabled: !friend(), title: friend() ? "Send an item as a gift" : "Gifts go to friends", tone: "purple" }),
      ...(canInviteToHideout ? [btn("🏚", "Invite to hideout", () => void act(async () => { const r = await hideoutInvite(me, { uid }); canInviteToHideout = false; return `You invited ${r.name} to your hideout.`; }), { title: "Ask them to join your hideout", tone: "teal" })] : []),
      btn("🚩", "Report", () => { view = "report"; render(); }, { title: "Tell the moderators about this player", tone: "red" })));
    return out;
  }

  /** Report a player to the moderators (they see it in the chat mod page). You can report 3 different accounts an hour. */
  function reportView(): HTMLElement {
    const REASONS = ["Spam or bots", "Rude or harassing", "Scam or cheating", "Something illegal", "Other"];
    let picked = REASONS[0];
    const more = h("input", { class: "mini-input", maxLength: 100, placeholder: "More (what happened?)" }) as HTMLInputElement;
    const chips = h("div", { class: "pw-sw" });
    const paint = (): void => chips.replaceChildren(...REASONS.map((r) => h("button", { class: "btn small" + (picked === r ? " primary" : ""), type: "button", onclick: () => { picked = r; paint(); } }, r)));
    paint();
    return h("div", { class: "pw-edit" },
      h("div", { class: "pw-sec" }, `Report ${prof!.name}`),
      h("div", { class: "hint" }, `The moderators see your report. You can report ${REPORT_LIMIT} different accounts an hour, so only report real problems.`),
      chips, more,
      h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(async () => {
        await call(me, "reportPlayer", { uid, reason: `${picked}${more.value.trim() ? ": " + more.value.trim() : ""}` });
        logAction(me, "friend", `reported ${prof!.name}`);
        view = "main";
        return "Thank you. The moderators will look at it.";
      }) }, "Send the report"),
      h("button", { class: "btn small", onclick: () => { view = "main"; render(); } }, "Back"));
  }

  function doVisit(): void {
    if (visit === "go") { ctx.navigate("room", { roomId: ownRoomId(uid) }); close(); return; }
    if (visit !== "knock" || knocking) return;
    knocking = true; render();
    const owner = uid, name = prof!.name;
    void social.knock(owner).then(() => {
      toast(`You knock on ${name}'s door. Waiting…`);
      stopKnock = social.watchKnock(owner, (answer) => {
        stopKnock?.(); stopKnock = null; knocking = false;
        if (answer === "accepted") { ctx.navigate("room", { roomId: ownRoomId(owner) }); close(); } else { toast(`${name} didn't let you in.`, "err"); if (!closed) render(); }
      });
    }, () => { knocking = false; toast("Couldn't knock.", "err"); render(); });
  }

  /** what you can give: the things in your pockets that can be handed over */
  function giftView(): HTMLElement {
    const rows = me.inventory.map((s, slot) => ({ s, slot })).filter((e): e is { s: NonNullable<typeof e.s>; slot: number } => !!e.s && isStorable(e.s) && !NO_DROP.has(e.s.item) && !!itemDef(e.s.item));
    return h("div", { class: "pw-gift" },
      h("div", { class: "pw-sec" }, `Send a gift to ${prof!.name}`),
      h("div", { class: "hint" }, "They can accept it or decline it. Items only, no blood."),
      ...(rows.length ? rows.map(({ s, slot }) => {
        const d = itemDef(s.item)!;
        const send = (qty: number): void => void act(async () => { await giftSend(me, uid, slot, qty); playSfx("give", 0.5); logAction(me, "drop", `gifted ${qty} ${d.name} to ${prof!.name}`); view = "main"; return `${d.name} is on its way to ${prof!.name}.`; });
        return h("div", { class: "pw-grow" },
          h("img", { src: d.icon, alt: "", class: "pw-gico" }),
          h("span", { class: "pw-gname" }, d.name + (s.ass ? " (ass)" : ""), h("span", { class: "hint" }, ` ×${s.qty}`)),
          h("button", { class: "btn small", disabled: busy, onclick: () => send(1) }, "Give 1"),
          ...(s.qty > 1 ? [h("button", { class: "btn small", disabled: busy, onclick: () => send(s.qty) }, "All")] : []));
      }) : [h("div", { class: "hint" }, "You aren't carrying anything you can give.")]),
      h("button", { class: "btn small", onclick: () => { view = "main"; render(); } }, "Back"));
  }

  function editView(): HTMLElement {
    const field = h("input", { class: "mini-input pw-status-in", maxLength: STATUS_MAX, value: prof!.status, placeholder: "What's on your mind? (shows next to you)", id: "pw-status" }) as HTMLInputElement;
    const save = (patch: Record<string, string>, then: string): void => void act(async () => { await update(ref(db, `profiles/${me.uid}`), patch); Object.assign(prof!, patch); return then; });
    const close4 = [...social.relations.entries()];
    return h("div", { class: "pw-edit" },
      h("div", { class: "pw-sec" }, "Your status"),
      field,
      h("button", { class: "btn small primary", disabled: busy, onclick: () => save({ status: field.value.trim().slice(0, STATUS_MAX) }, "Status saved.") }, "Save status"),
      h("div", { class: "pw-sec" }, "Background"),
      h("div", { class: "pw-sw" }, ...PROFILE_BGS.map((b) => h("button", { class: "pw-swatch" + (prof!.bg === b.id ? " on" : ""), style: { background: b.color }, title: b.label, "aria-label": b.label, onclick: () => save({ bg: b.id }, "Background changed.") }))),
      h("div", { class: "pw-sec" }, "Your partner and best friends"),
      h("div", { class: "hint" }, "Open a friend's profile and tap Best friends or Be partners. They have to accept."),
      ...(close4.length ? close4.map(([u, kind]) => h("div", { class: "pw-grow" },
        h("span", { class: "pw-gname" }, kind === "partner" ? "💖 " : "⭐ ", h("span", { class: "pw-rel", "data-uid": u }, social.friends.get(u)?.name ?? "…")),
        h("button", { class: "btn small", disabled: busy, onclick: () => void act(async () => { await social.removeRelation(u); return "Done."; }) }, "Remove"))) : [h("div", { class: "hint" }, "Nobody yet.")]),
      h("button", { class: "btn small", onclick: () => { view = "main"; render(); } }, "Back"));
  }

  /** the four slots on the right: the partner (heart) first, then best friends (star) */
  function tiles(): HTMLElement {
    const rels = [...(prof!.relations)].sort((a, b) => Number(b.kind === "partner") - Number(a.kind === "partner")).slice(0, 4);
    const slots: Array<HTMLElement> = rels.map((r) => {
      const tile = h("button", { class: "pw-tile", title: "Open profile", onclick: () => void load(r.uid) }, h("span", { class: "pw-head" }), h("span", { class: "pw-badge " + (r.kind === "partner" ? "heart" : "star"), title: r.kind === "partner" ? "Partner" : "Best friend" }, r.kind === "partner" ? "♥" : "★"));
      void fetchProfile(r.uid).then((p) => { if (p) { tile.title = p.name; tile.querySelector(".pw-head")?.replaceWith(headBox(p.figure)); } });
      return tile;
    });
    while (slots.length < 4) slots.push(h("span", { class: "pw-tile empty" }, "·"));
    return h("div", { class: "pw-close" }, h("div", { class: "pw-sec small" }, "Close friends"), h("div", { class: "pw-tiles", "aria-label": "Partner and best friends" }, ...slots));
  }

  function render(): void {
    if (closed) return;
    const closeBtn = h("button", { class: "pw-x", "aria-label": "Done", onclick: () => close() }, "Done");
    if (loading || !prof) {
      card.replaceChildren(h("div", { class: "pw-head-bar" }, h("span", { class: "pw-spacer" }), h("strong", {}, loading ? "Loading…" : "Profile"), closeBtn), h("div", { class: "pw-body" }, h("div", { class: "hint pad" }, loading ? "" : "This player has no profile.")));
      return;
    }
    const who = prof;
    const avatar = h("div", { class: "pw-avatar" });
    void renderAvatar({ figure: who.figure, dir: 2, headDir: 2 }).then((c) => { if (c && !closed && prof === who) avatar.replaceChildren(copyOf(c)); });
    const dot = h("span", { class: "dot " + (online() ? (social.isIdle(uid) ? "idle" : "on") : "") });
    const mid = h("div", { class: "pw-mid" });
    mid.style.setProperty("--pw-bg", bgColor());
    const bubble = h("div", { class: "pw-bubble" + (who.status ? "" : " empty") }, who.status || (isMe() ? "Tap Customize to write a status." : "No status yet."));
    mid.append(avatar, bubble);
    card.replaceChildren(
      h("div", { class: "pw-head-bar" }, h("span", { class: "pw-spacer" }), h("strong", {}, who.name, " ", dot), closeBtn),
      h("div", { class: "pw-body" },
        h("div", { class: "pw-left" }, ...(view === "gift" ? [giftView()] : view === "edit" ? [editView()] : view === "report" ? [reportView()] : actions())),
        mid,
        h("div", { class: "pw-right" }, tiles())));
  }

  function close(): void {
    if (closed) return;
    closed = true;
    off();
    stopKnock?.();
    if (knocking) void social.cancelKnock(uid);
    el.remove();
    onClose();
  }

  const off = social.subscribe(() => { if (!closed && !loading && view === "main" && !busy) render(); });
  void load(firstUid);
  return { close };
}
