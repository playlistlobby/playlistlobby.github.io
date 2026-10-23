import { h, toast } from "./dom";
import { headBoxFor } from "./head";
import { social } from "../social";
import { Access, LOBBY_ID, normAccess, ownRoomId, RoomMeta, watchAllRooms } from "../rooms";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import { findSlot } from "../items";
import { call, serverNow } from "../db";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import type { Ctx } from "../main";

export interface DoorApi {
  close(): void;
}

interface Row {
  owner: string;
  roomId: string;
  roomName: string;
  ownerName: string;
  access: Access;
  friend: boolean;
  online: boolean;
  /** online but hasn't touched anything for 15 minutes */
  idle: boolean;
  count: number;
  /** how much blood the owner has (the server keeps it in bloodBoard) */
  blood: number;
  /** 1 = the richest player */
  rank: number;
}

const KNOCK_TIMEOUT_MS = 60_000;

/**
 * The door popup (click the door in any room): go to the basement or your own room, or visit someone else's.
 * Friends' rooms and open rooms: walk in. Everyone else: knock, and the owner lets you in from their friends menu.
 */
export function openDoor(host: HTMLElement, ctx: Ctx, currentRoom: string, onClose: () => void): DoorApi {
  const me = ctx.profile;
  const mineId = ownRoomId(me.uid);
  let rooms: Record<string, RoomMeta> = {};
  /** every player's blood (bloodBoard/<uid>, written by the server): open rooms are listed richest first, so the rich get the visitors */
  let board: Record<string, number> = {};
  let ranks = new Map<string, number>();
  let search = "";
  let searched: { uid: string; name: string } | { none: true } | null = null;
  let knocking: { row: Row; state: "waiting" | "declined" | "none" } | null = null;
  let stopKnock: (() => void) | null = null;
  let knockTimer = 0;
  let closed = false;

  const body = h("div", { class: "door-body" });
  const el = h("div", { class: "door-popup", role: "dialog", "aria-label": "Door" },
    h("div", { class: "door-head" }, h("strong", {}, "🚪 Where to?"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  el.classList.add("arming");
  window.setTimeout(() => el.classList.remove("arming"), 800);
  // A button only counts if the press that clicked it started on this menu (after it settled): a stray tap or click left over
  // from opening the menu, or a replayed one, can never choose a destination for you.
  let pressedOn = 0;
  el.addEventListener("pointerdown", () => { if (!el.classList.contains("arming")) pressedOn = performance.now(); }, true);
  const chosen = (e: Event): boolean => {
    const keyboard = (e as MouseEvent).detail === 0; // Enter/Space on a focused button
    const ok = keyboard || (pressedOn > 0 && performance.now() - pressedOn < 2500);
    pressedOn = 0;
    return ok;
  };

  function enter(roomId: string, label: string): void {
    playSfx("doorOpen", 0.6);
    logAction(me, "visit", `went to ${label}`);
    close();
    ctx.navigate("room", { roomId });
  }

  function rowFor(id: string, meta: RoomMeta): Row {
    return {
      owner: meta.owner, roomId: id, roomName: meta.name, ownerName: meta.ownerName, access: normAccess(meta.access),
      blood: board[meta.owner] ?? 0, rank: ranks.get(meta.owner) ?? 0,
      friend: social.friends.has(meta.owner), online: social.isOnline(meta.owner), idle: social.isIdle(meta.owner), count: social.roomCounts().get(id) ?? 0,
    };
  }

  function rowsToShow(): Row[] {
    const all = Object.entries(rooms)
      .filter(([id, m]) => id.startsWith("u_") && m.owner !== me.uid && id !== currentRoom)
      .map(([id, m]) => rowFor(id, m));
    const visible = tripping() ? all : all.filter((r) => r.friend || r.access === "open" || (r.access === "knock" && r.online)); // on a shroom every room is on the list, online or not
    // friends first, then the rooms open to everyone (richest owner first), then the knock rooms (richest first too)
    return visible.sort((a, b) =>
      Number(b.friend) - Number(a.friend) || Number(b.access === "open") - Number(a.access === "open") || b.blood - a.blood || Number(b.online) - Number(a.online) || Number(a.idle) - Number(b.idle) || b.count - a.count || a.ownerName.localeCompare(b.ownerName)).slice(0, me.isAdmin ? 300 : 40);
  }

  /** a shroom or DMT is working: every door is open */
  const tripping = (): boolean => me.isAdmin || me.shroomUntil > serverNow(); // (the admin can walk into anybody's room, always)

  function actionFor(r: Row): HTMLElement {
    if (tripping() && !(r.friend || r.access === "open")) return h("button", { class: "btn small primary", onclick: (e: Event) => { if (chosen(e)) enter(r.roomId, `${r.ownerName}'s room`); } }, "Walk in");
    if (r.access === "none") return h("span", { class: "door-actions" }, h("button", { class: "btn small", disabled: true }, "Closed"));
    if (r.friend || r.access === "open") return h("button", { class: "btn small primary", onclick: (e: Event) => { if (chosen(e)) enter(r.roomId, `${r.ownerName}'s room`); } }, "Visit");
    let main: HTMLElement;
    if (r.access === "knock") {
      main = r.online
        ? h("button", { class: "btn small", onclick: (e: Event) => { if (chosen(e)) startKnock(r); } }, "Knock")
        : h("button", { class: "btn small", disabled: true }, "Offline");
    } else main = h("button", { class: "btn small", disabled: true }, "Closed");
    return h("span", { class: "door-actions" }, main);
  }

  function rowEl(r: Row): HTMLElement {
    const sub = r.friend ? "friend" : r.access === "open" ? "open to everyone" : me.isAdmin ? "admin: always open" : tripping() ? "Opened by a shroom" : r.access === "knock" ? "knock to enter" : "closed";
    return h("div", { class: "door-row" },
      headBoxFor(r.owner),
      h("span", { class: "dot " + (r.online ? (r.idle ? "idle" : "on") : "") }),
      h("div", { class: "door-row-main" },
        h("div", { class: "door-row-name" }, r.roomName),
        h("div", { class: "hint" }, `${r.ownerName} · ${sub}${r.idle ? " · idle" : ""}${r.count ? ` · ${r.count} inside` : ""}`)),
      r.access === "open" && r.rank > 0 && r.rank <= 50 ? h("span", { class: "door-rank", title: "Ranked by blood: the richest players are on top" }, `#${r.rank}`) : null,
      // a little profile button (just the icon) next to Visit / Knock: the owner's profile page
      h("button", { class: "btn small door-profile", title: `${r.ownerName}'s profile`, "aria-label": `${r.ownerName}'s profile`, onclick: (e: Event) => { if (chosen(e)) { close(); window.dispatchEvent(new CustomEvent("open-profile", { detail: r.owner })); } } }, "👤"),
      actionFor(r));
  }

  function render(): void {
    if (closed) return;
    if (knocking) return renderKnocking();
    const list = rowsToShow();
    const found = searched && "uid" in searched ? rooms[ownRoomId(searched.uid)] : undefined;
    const foundRow = found && searched && "uid" in searched ? rowFor(ownRoomId(searched.uid), found) : null;
    body.replaceChildren(
      h("div", { class: "door-main" },
        currentRoom !== LOBBY_ID ? h("button", { class: "btn primary door-big", onclick: (e: Event) => { if (chosen(e)) enter(LOBBY_ID, "the basement"); } }, "🕳 Basement") : null,
        currentRoom !== mineId ? h("button", { class: "btn primary door-big", onclick: (e: Event) => { if (chosen(e)) enter(mineId, "their own room"); } }, "🏠 My room") : null),
      h("div", { class: "fp-label" }, "Visit a player's room"),
      h("form", { class: "row door-search", onsubmit: async (e: Event) => {
        e.preventDefault();
        search = input.value.trim();
        if (!search) { searched = null; return render(); }
        const uid = await social.uidOf(search).catch(() => null);
        searched = uid ? { uid, name: search } : { none: true };
        render();
      } }, input, h("button", { class: "btn small", type: "submit" }, "Find")),
      ...(searched && "none" in searched ? [h("div", { class: "hint pad" }, `Nobody is called "${search}".`)] : []),
      ...(searched && "uid" in searched
        ? [foundRow ? rowEl(foundRow) : h("div", { class: "hint pad" }, `${searched.name} hasn't set up a room yet.`)]
        : []),
      h("div", { class: "door-list" }, ...(list.length
        ? list.map(rowEl)
        : [h("div", { class: "hint pad" }, "No rooms to visit right now. Search for a friend by username above.")])));
  }
  const input = h("input", { class: "mini-input", type: "text", placeholder: "Username…", maxLength: 16, autocapitalize: "none", spellcheck: false });

  // ---- knocking ---------------------------------------------------------------------------------------
  function renderKnocking(): void {
    const k = knocking!;
    if (k.state === "waiting") {
      body.replaceChildren(h("div", { class: "door-knock" },
        h("div", { class: "door-knock-ico" }, "✊"),
        h("div", {}, h("strong", {}, `Knocking on ${k.row.ownerName}'s door…`)),
        h("div", { class: "hint" }, "They'll see your request in their friends menu. Hang tight."),
        h("button", { class: "btn", onclick: () => stopKnocking() }, "Cancel")));
    } else {
      body.replaceChildren(h("div", { class: "door-knock" },
        h("div", { class: "door-knock-ico" }, "🚫"),
        h("div", {}, h("strong", {}, k.state === "declined" ? `${k.row.ownerName} didn't let you in.` : `No answer from ${k.row.ownerName}.`)),
        h("button", { class: "btn", onclick: () => stopKnocking() }, "Back")));
    }
  }

  function startKnock(r: Row): void {
    knocking = { row: r, state: "waiting" };
    render();
    social.knock(r.owner).then(() => {
      if (closed || knocking?.row.owner !== r.owner) return;
      stopKnock = social.watchKnock(r.owner, (answer) => {
        if (closed || knocking?.row.owner !== r.owner) return;
        stopKnock?.();
        stopKnock = null;
        window.clearTimeout(knockTimer);
        if (answer === "accepted") { toast(`${r.ownerName} let you in.`); enter(r.roomId, `${r.ownerName}'s room (let in)`); }
        else { knocking = { row: r, state: "declined" }; render(); }
      });
      knockTimer = window.setTimeout(() => {
        if (closed || knocking?.state !== "waiting") return;
        stopKnock?.();
        stopKnock = null;
        void social.cancelKnock(r.owner);
        knocking = { row: r, state: "none" };
        render();
      }, KNOCK_TIMEOUT_MS);
      playSfx("knock", 0.35);
    }, () => {
      toast("Couldn't knock. They may have just closed their door.", "err");
      knocking = null;
      render();
    });
  }

  function stopKnocking(): void {
    const k = knocking;
    stopKnock?.();
    stopKnock = null;
    window.clearTimeout(knockTimer);
    if (k && k.state === "waiting") void social.cancelKnock(k.row.owner);
    knocking = null;
    render();
  }

  function close(): void {
    if (closed) return;
    const k = knocking;
    if (k?.state === "waiting") void social.cancelKnock(k.row.owner);
    closed = true;
    stopKnock?.();
    window.clearTimeout(knockTimer);
    offRooms();
    offBoard();
    offSocial();
    el.remove();
    onClose();
  }

  const offRooms = watchAllRooms((r) => { rooms = r; render(); });
  const offBoard = onValue(ref(db, "bloodBoard"), (snap) => {
    board = (snap.val() ?? {}) as Record<string, number>;
    ranks = new Map(Object.entries(board).filter(([, b]) => Number(b) > 0).sort((a, b) => Number(b[1]) - Number(a[1])).map(([uid], i) => [uid, i + 1]));
    if (!knocking && document.activeElement !== input) render();
  }, () => undefined);
  const offSocial = social.subscribe(() => { if (!knocking && document.activeElement !== input) render(); });
  render();
  return { close };
}
