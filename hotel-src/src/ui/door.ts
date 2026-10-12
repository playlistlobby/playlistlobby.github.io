import { h, toast } from "./dom";
import { headBoxFor } from "./head";
import { social } from "../social";
import { Access, LOBBY_ID, normAccess, ownRoomId, RoomMeta, watchAllRooms } from "../rooms";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
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
  count: number;
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
  window.setTimeout(() => el.classList.remove("arming"), 500);

  function enter(roomId: string, label: string): void {
    logAction(me, "visit", `went to ${label}`);
    close();
    ctx.navigate("room", { roomId });
  }

  function rowFor(id: string, meta: RoomMeta): Row {
    return {
      owner: meta.owner, roomId: id, roomName: meta.name, ownerName: meta.ownerName, access: normAccess(meta.access),
      friend: social.friends.has(meta.owner), online: social.isOnline(meta.owner), count: social.roomCounts().get(id) ?? 0,
    };
  }

  function rowsToShow(): Row[] {
    const all = Object.entries(rooms)
      .filter(([id, m]) => id.startsWith("u_") && m.owner !== me.uid && id !== currentRoom)
      .map(([id, m]) => rowFor(id, m));
    const visible = all.filter((r) => r.friend || r.access === "open" || (r.access === "knock" && r.online));
    return visible.sort((a, b) =>
      Number(b.friend) - Number(a.friend) || Number(b.online) - Number(a.online) || b.count - a.count || a.ownerName.localeCompare(b.ownerName)).slice(0, 40);
  }

  function actionFor(r: Row): HTMLElement {
    if (r.friend || r.access === "open") return h("button", { class: "btn small primary", onclick: () => enter(r.roomId, `${r.ownerName}'s room`) }, "Visit");
    if (r.access === "knock") {
      return r.online
        ? h("button", { class: "btn small", onclick: () => startKnock(r) }, "Knock")
        : h("button", { class: "btn small", disabled: true }, "Offline");
    }
    return h("button", { class: "btn small", disabled: true }, "Closed");
  }

  function rowEl(r: Row): HTMLElement {
    const sub = r.friend ? "friend" : r.access === "open" ? "open to everyone" : r.access === "knock" ? "knock to enter" : "closed";
    return h("div", { class: "door-row" },
      headBoxFor(r.owner),
      h("span", { class: "dot " + (r.online ? "on" : "") }),
      h("div", { class: "door-row-main" },
        h("div", { class: "door-row-name" }, r.roomName),
        h("div", { class: "hint" }, `${r.ownerName} · ${sub}${r.count ? ` · ${r.count} inside` : ""}`)),
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
        currentRoom !== LOBBY_ID ? h("button", { class: "btn primary door-big", onclick: () => enter(LOBBY_ID, "the basement") }, "🕳 Basement") : null,
        currentRoom !== mineId ? h("button", { class: "btn primary door-big", onclick: () => enter(mineId, "their own room") }, "🏠 My room") : null),
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
    offSocial();
    el.remove();
    onClose();
  }

  const offRooms = watchAllRooms((r) => { rooms = r; render(); });
  const offSocial = social.subscribe(() => { if (!knocking && document.activeElement !== input) render(); });
  render();
  return { close };
}
