import { h, toast } from "./dom";
import { isWantedRoom, watchWantedRooms } from "../bounty";
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
const CHUNK = 30;

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
  /** how many rows of the list are on screen: more are added as you scroll down (a long list of players never builds in one go) */
  let shown = CHUNK;
  let refreshTimer = 0;
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

  /** the list: with nothing typed, the rooms you can go to (friends first, then open rooms by blood); with letters typed, every player whose name or room matches, best match first */
  function rowsToShow(): Row[] {
    const q = search.trim().toLowerCase();
    const all = Object.entries(rooms)
      .filter(([id, m]) => id.startsWith("u_") && m.owner !== me.uid && id !== currentRoom)
      .map(([id, m]) => rowFor(id, m));
    const rank = (a: Row, b: Row): number =>
      Number(b.friend) - Number(a.friend) || Number(b.access === "open") - Number(a.access === "open") || b.blood - a.blood || Number(b.online) - Number(a.online) || Number(a.idle) - Number(b.idle) || b.count - a.count || a.ownerName.localeCompare(b.ownerName);
    if (q) {
      const score = (r: Row): number => {
        const n = r.ownerName.toLowerCase(), rn = r.roomName.toLowerCase();
        if (n === q) return 0;
        if (n.startsWith(q)) return 1;
        const at = n.indexOf(q);
        if (at >= 0) return 2 + Math.min(at, 20) / 100; // earlier in the name is better
        if (rn.includes(q)) return 3;
        return -1;
      };
      return all.map((r) => ({ r, s: score(r) })).filter((x) => x.s >= 0).sort((a, b) => a.s - b.s || rank(a.r, b.r)).map((x) => x.r);
    }
    const visible = tripping() ? all : all.filter((r) => r.friend || r.access === "open" || isWantedRoom(r.roomId) || (r.access === "knock" && r.online)); // on a shroom every room is on the list, online or not
    return visible.sort(rank);
  }

  /** a shroom or DMT is working: every door is open */
  const tripping = (): boolean => me.isAdmin || me.enterAnywhere || me.shroomUntil > serverNow(); // (the admin can walk into anybody's room, always)

  function actionFor(r: Row): HTMLElement {
    if (isWantedRoom(r.roomId) && !(r.friend || r.access === "open")) return h("button", { class: "btn small primary", title: "Somebody with a bounty on them is in there: nobody can hide", onclick: (e: Event) => { if (chosen(e)) enter(r.roomId, `${r.ownerName}'s room`); } }, "Walk in");
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

  /** the typed letters picked out inside a name */
  function lit(text: string): Array<string | HTMLElement> {
    const q = search.trim().toLowerCase();
    const at = q ? text.toLowerCase().indexOf(q) : -1;
    if (at < 0) return [text];
    return [text.slice(0, at), h("mark", { class: "door-mark" }, text.slice(at, at + q.length)), text.slice(at + q.length)];
  }

  function rowEl(r: Row): HTMLElement {
    const sub = r.friend ? "friend" : r.access === "open" ? "open to everyone" : me.isAdmin || me.enterAnywhere ? "always open for you" : tripping() ? "Opened by a shroom" : r.access === "knock" ? "knock to enter" : "closed";
    return h("div", { class: "door-row" },
      headBoxFor(r.owner),
      h("span", { class: "dot " + (r.online ? (r.idle ? "idle" : "on") : "") }),
      h("div", { class: "door-row-main" },
        h("div", { class: "door-row-name" }, ...lit(r.roomName)),
        h("div", { class: "hint" }, ...lit(r.ownerName), ` · ${sub}${r.idle ? " · idle" : ""}${r.count ? ` · ${r.count} inside` : ""}`)),
      r.access === "open" && r.rank > 0 && r.rank <= 50 ? h("span", { class: "door-rank", title: "Ranked by blood: the richest players are on top" }, `#${r.rank}`) : null,
      // a little profile button (just the icon) next to Visit / Knock: the owner's profile page
      h("button", { class: "btn small door-profile", title: `${r.ownerName}'s profile`, "aria-label": `${r.ownerName}'s profile`, onclick: (e: Event) => { if (chosen(e)) { close(); window.dispatchEvent(new CustomEvent("open-profile", { detail: r.owner })); } } }, "👤"),
      actionFor(r));
  }

  /** the shell (the two big buttons, the search box and the list) is built once, so typing never loses the cursor or the scroll position */
  function buildShell(): void {
    body.classList.add("door-flex");
    body.replaceChildren(
      h("div", { class: "door-main" },
        currentRoom !== LOBBY_ID ? h("button", { class: "btn primary door-big", onclick: (e: Event) => { if (chosen(e)) enter(LOBBY_ID, "the basement"); } }, "🕳 Basement") : null,
        currentRoom !== mineId ? h("button", { class: "btn primary door-big", onclick: (e: Event) => { if (chosen(e)) enter(mineId, "their own room"); } }, "🏠 My room") : null),
      h("div", { class: "fp-label" }, "Visit a player's room"),
      h("div", { class: "door-search" }, input, clearBtn),
      status,
      list);
    renderList();
  }

  /** (re)draws the list for what is typed; keeps the scroll position */
  function renderList(): void {
    if (closed || knocking) return;
    const all = rowsToShow();
    const q = search.trim();
    const top = list.scrollTop;
    list.replaceChildren(...(all.length
      ? all.slice(0, shown).map(rowEl)
      : [h("div", { class: "hint pad" }, q ? `No player or room matches "${q}".` : "No rooms to visit right now. Type a few letters of a player's name to find them.")]));
    list.scrollTop = top;
    const n = all.length;
    status.textContent = q ? (n === 1 ? "1 match" : `${n} matches`) : n === 1 ? "1 room to visit" : `${n} rooms to visit`;
    clearBtn.style.visibility = input.value ? "visible" : "hidden";
  }

  /** many updates arrive at once (presence, blood, rooms): draw the list once for all of them */
  function refreshSoon(): void {
    if (refreshTimer) return;
    refreshTimer = window.setTimeout(() => { refreshTimer = 0; renderList(); }, 120);
  }

  function render(): void {
    if (closed) return;
    if (knocking) return renderKnocking();
    if (!list.isConnected) buildShell(); else renderList();
  }

  const input = h("input", { class: "mini-input", type: "text", placeholder: "Search by name or room…", maxLength: 24, autocapitalize: "none", autocomplete: "off", spellcheck: false, "aria-label": "Search players" });
  const clearBtn = h("button", { class: "door-clear", type: "button", title: "Clear", "aria-label": "Clear the search", onclick: () => { input.value = ""; search = ""; shown = CHUNK; list.scrollTop = 0; renderList(); input.focus(); } }, "✕");
  const status = h("div", { class: "hint door-status" });
  const list = h("div", { class: "door-list door-scroll" });
  input.addEventListener("input", () => { search = input.value; shown = CHUNK; list.scrollTop = 0; renderList(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); (list.querySelector(".door-row .btn.primary:not([disabled]):not(.door-profile)") as HTMLElement | null)?.click(); } // Enter = the first row's Visit
    else if (e.key === "Escape") { e.stopPropagation(); if (input.value) { input.value = ""; search = ""; shown = CHUNK; renderList(); } else close(); }
  });
  list.addEventListener("scroll", () => { if (list.scrollTop + list.clientHeight > list.scrollHeight - 120 && shown < rowsToShow().length) { shown += CHUNK; renderList(); } });
  // a phone would pop its keyboard up at once: only a mouse gets the cursor in the box straight away
  window.setTimeout(() => { if (!closed && window.matchMedia?.("(pointer: fine)").matches) input.focus(); }, 850);

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
    buildShell();
  }

  function close(): void {
    if (closed) return;
    const k = knocking;
    if (k?.state === "waiting") void social.cancelKnock(k.row.owner);
    closed = true;
    stopKnock?.();
    window.clearTimeout(knockTimer);
    window.clearTimeout(refreshTimer);
    offRooms();
    offBoard();
    offSocial();
    offWanted();
    el.remove();
    onClose();
  }

  const offRooms = watchAllRooms((r) => { rooms = r; refreshSoon(); });
  const offBoard = onValue(ref(db, "bloodBoard"), (snap) => {
    board = (snap.val() ?? {}) as Record<string, number>;
    ranks = new Map(Object.entries(board).filter(([, b]) => Number(b) > 0).sort((a, b) => Number(b[1]) - Number(a[1])).map(([uid], i) => [uid, i + 1]));
    refreshSoon();
  }, () => undefined);
  const offSocial = social.subscribe(() => refreshSoon());
  const offWanted = watchWantedRooms(() => refreshSoon());
  render();
  return { close };
}
