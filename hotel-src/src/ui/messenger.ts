import { h, toast, trimCanvas } from "./dom";
import { renderAvatar } from "../avatarService";
import { social, PublicProfile } from "../social";
import { LOBBY_ID } from "../rooms";
import { FEATURES } from "../features";
import type { Ctx } from "../main";

function headOf(figure: string): HTMLElement {
  const box = h("div", { class: "head" });
  renderAvatar({ figure, dir: 2, headDir: 2, headOnly: true }).then((c) => {
    if (!c || !box.isConnected) return;
    const t = trimCanvas(c);
    t.className = "head-canvas";
    box.replaceChildren(t);
  });
  return box;
}

const fmtClock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Docked friends list + private chat windows + room-invite popups. Lives for as long as you're signed in. */
export function mountMessenger(root: HTMLElement, ctx: Ctx): () => void {
  const me = ctx.profile;
  let open = false;
  const windows = new Map<string, { el: HTMLElement; log: HTMLElement; render(): void }>();

  const badge = h("span", { class: "badge hidden" });
  const toggle = h("button", { class: "btn friends-toggle", onclick: () => { open = !open; renderPanel(); } }, "👥 Friends ", badge);
  const panel = h("div", { class: "friends-panel hidden" });
  const winRow = h("div", { class: "chat-windows" });
  const popups = h("div", { class: "invite-popups" });
  const dock = h("div", { class: "messenger" }, winRow, h("div", { class: "friends-col" }, panel, toggle));
  root.append(dock, popups);

  // ---- friends panel ------------------------------------------------------------------
  const addInput = h("input", { type: "text", placeholder: "Add friend by username", maxLength: 16, class: "mini-input" });

  async function addFriend(): Promise<void> {
    const name = addInput.value;
    addInput.value = "";
    try {
      toast(await social.sendRequest(name));
    } catch (err) {
      toast((err as Error).message || "Couldn't send that request.", "err");
    }
  }

  function renderPanel(): void {
    panel.classList.toggle("hidden", !open);
    const friends = [...social.friends.values()].sort((a, b) => Number(social.isOnline(b.uid)) - Number(social.isOnline(a.uid)) || a.name.localeCompare(b.name));
    const onlineCount = friends.filter((f) => social.isOnline(f.uid)).length;
    toggle.firstChild!.textContent = `👥 Friends (${onlineCount}/${friends.length}) `;
    const unread = social.totalUnread;
    badge.textContent = String(unread);
    badge.classList.toggle("hidden", unread === 0);
    if (!open) return;

    const reqRows = [...social.requests.values()].map((r) =>
      h("div", { class: "frow" }, headOf(r.figure), h("span", { class: "fname" }, r.name),
        h("button", { class: "btn small primary", title: "Accept", onclick: () => social.accept(r.uid).then(() => toast(`You and ${r.name} are friends now.`), () => toast("Couldn't accept that.", "err")) }, "✓"),
        h("button", { class: "btn small", title: "Decline", onclick: () => void social.decline(r.uid) }, "✕")));

    const inviteRows = (FEATURES.rooms ? social.invites : []).map((i) =>
      h("div", { class: "frow" }, h("span", { class: "fname" }, `${i.fromName} invited you to "${i.roomName}"`),
        h("button", { class: "btn small primary", onclick: () => { void social.dismissInvite(i.id); ctx.navigate("room", { roomId: i.room }); } }, "Join"),
        h("button", { class: "btn small", onclick: () => void social.dismissInvite(i.id) }, "✕")));

    // header + input are built once so typing isn't interrupted by presence updates
    if (!panel.firstChild) {
      panel.append(
        h("div", { class: "fp-head" }, h("strong", {}, "Friends"), h("button", { class: "btn small", onclick: () => { open = false; renderPanel(); } }, "–")),
        h("form", { class: "row fp-add", onsubmit: (e: Event) => { e.preventDefault(); void addFriend(); } }, addInput, h("button", { class: "btn small", type: "submit" }, "Add")),
        dyn);
    }
    dyn.replaceChildren(
      ...(inviteRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, "Room invites"), ...inviteRows)] : []),
      ...(reqRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, `Requests (${reqRows.length})`), ...reqRows)] : []),
      h("div", { class: "fp-list" },
        ...(friends.length === 0
          ? [h("div", { class: "hint pad" }, "No friends yet. Add someone by username, or right-click a player in a room.")]
          : friends.map((f) => friendRow(f)))));
  }
  const dyn = h("div", { class: "fp-dyn" });

  function friendRow(f: PublicProfile): HTMLElement {
    const online = social.isOnline(f.uid);
    const room = social.roomOf(f.uid);
    const unread = social.unread.get(f.uid) ?? 0;
    return h("div", { class: "frow" },
      headOf(f.figure),
      h("span", { class: "dot " + (online ? "on" : "") }),
      h("span", { class: "fname", title: online ? (room ? "In a room" : "Online") : "Offline", onclick: () => openChat(f.uid) }, f.name),
      unread ? h("span", { class: "badge" }, String(unread)) : null,
      h("button", { class: "btn small", title: "Message", onclick: () => openChat(f.uid) }, "💬"),
      room && (room === LOBBY_ID || FEATURES.rooms) ? h("button", { class: "btn small", title: room === LOBBY_ID ? "Go to the lobby" : "Follow into their room", onclick: () => ctx.navigate("room", { roomId: room }) }, "➜") : null,
      h("button", { class: "btn small", title: "Remove friend", onclick: () => {
        if (confirm(`Remove ${f.name} from your friends?`)) void social.removeFriend(f.uid).then(() => closeChat(f.uid));
      } }, "✕"));
  }

  // ---- chat windows --------------------------------------------------------------------
  function openChat(uid: string): void {
    const friend = social.friends.get(uid);
    if (!friend) return;
    social.openChat.add(uid);
    social.markRead(uid);
    open = false; // tuck the list away so the window is visible on small screens
    renderPanel();
    const existing = windows.get(uid);
    if (existing) {
      existing.el.classList.remove("min");
      existing.render();
      return;
    }
    const log = h("div", { class: "cw-log" });
    const field = h("input", { type: "text", maxLength: 200, placeholder: `Message ${friend.name}…`, class: "cw-input", autocomplete: "off" });
    const status = h("span", { class: "dot" });
    const head = h("div", { class: "cw-head", onclick: () => el.classList.toggle("min") },
      status, h("strong", {}, friend.name),
      h("button", { class: "btn small", onclick: (e: Event) => { e.stopPropagation(); closeChat(uid); } }, "✕"));
    const el = h("div", { class: "chat-window" }, head, log,
      h("form", { class: "cw-form", onsubmit: (e: Event) => {
        e.preventDefault();
        const text = field.value.trim();
        if (!text) return;
        field.value = "";
        social.sendDm(uid, text).catch(() => toast("That message didn't go through.", "err"));
      } }, field));
    const render = () => {
      status.className = "dot " + (social.isOnline(uid) ? "on" : "");
      const msgs = social.dms.get(uid) ?? [];
      log.replaceChildren(...(msgs.length === 0
        ? [h("div", { class: "hint pad" }, "Say hi!")]
        : msgs.map((m) => h("div", { class: "cw-msg" + (m.from === me.uid ? " mine" : "") },
            h("div", { class: "cw-bubble" }, m.text), h("div", { class: "cw-time" }, fmtClock(m.ts))))));
      log.scrollTop = log.scrollHeight;
    };
    windows.set(uid, { el, log, render });
    winRow.append(el);
    render();
    field.focus();
  }

  function closeChat(uid: string): void {
    const w = windows.get(uid);
    if (w) { w.el.remove(); windows.delete(uid); }
    social.openChat.delete(uid);
  }

  const onOpenChat = (e: Event) => openChat((e as CustomEvent<string>).detail);
  window.addEventListener("open-chat", onOpenChat);
  // the Friends icon on the home screen opens/closes the friends list
  const onToggleFriends = () => { open = !open; renderPanel(); };
  window.addEventListener("toggle-friends", onToggleFriends);

  // ---- live updates ---------------------------------------------------------------------
  const offStore = social.subscribe(() => {
    renderPanel();
    for (const [uid, w] of windows) {
      if (!social.friends.has(uid)) closeChat(uid);
      else { social.markRead(uid); w.render(); }
    }
  });

  const offDm = social.onDm((friend, m) => {
    if (m.from === me.uid || windows.has(friend)) return;
    const f = social.friends.get(friend);
    if (!f) return;
    const pop = h("div", { class: "toast ok show msg-toast", onclick: () => { openChat(friend); pop.remove(); } }, `💬 ${f.name}: ${m.text.slice(0, 60)}`);
    document.body.append(pop);
    setTimeout(() => pop.remove(), 5000);
  });

  const offInvite = social.onInvite((i) => {
    if (!FEATURES.rooms) return;
    const card = h("div", { class: "invite-card" },
      h("div", {}, h("strong", {}, i.fromName), ` invited you to `, h("strong", {}, `"${i.roomName}"`)),
      h("div", { class: "row" },
        h("button", { class: "btn small primary", onclick: () => { void social.dismissInvite(i.id); card.remove(); ctx.navigate("room", { roomId: i.room }); } }, "Join"),
        h("button", { class: "btn small", onclick: () => { void social.dismissInvite(i.id); card.remove(); } }, "Later")));
    popups.append(card);
    setTimeout(() => card.remove(), 20000);
  });

  renderPanel();
  return () => {
    offStore();
    offDm();
    offInvite();
    window.removeEventListener("open-chat", onOpenChat);
    window.removeEventListener("toggle-friends", onToggleFriends);
    dock.remove();
    popups.remove();
  };
}
