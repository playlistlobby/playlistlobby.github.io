import { h, toast } from "./dom";
import { headBox } from "./head";
import { social, PublicProfile, RelationRequest, Gift } from "../social";
import { giftAnswer, giftCollect } from "../db";
import { hideoutAnswer } from "../hideout";
import { itemDef } from "../items";
import { openProfileWindow, ProfileWindowApi } from "./profileWindow";
import { LOBBY_ID } from "../rooms";
import { playSfx } from "../sfx";
import { logAction } from "../logger";
import type { Ctx } from "../main";

const fmtClock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ---- notifications outside the page: a system notification while the game is in the background, and "(2)" in the tab title ----
/** asks the browser once (it has to come from a tap); nothing happens if it was already answered or isn't supported */
function askNotifyPermission(): void {
  try { if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission(); } catch { /* old browsers */ }
}
function systemNotify(name: string, text: string, onClick: () => void): void {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const opts: NotificationOptions = { body: text.slice(0, 120), tag: `dm-${name}` };
    const direct = (): void => { const n = new Notification(name, opts); n.onclick = () => { window.focus(); onClick(); n.close(); }; };
    // phones only allow notifications through a service worker; desktops can use the plain kind
    if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((reg) => (reg ? reg.showNotification(name, opts) : direct()), direct).catch(() => undefined);
    else direct();
  } catch { /* a notification is a bonus, never an error */ }
}

/** Docked friends list + private chat windows + room requests and invites. Lives for as long as you're signed in. */
export function mountMessenger(root: HTMLElement, ctx: Ctx): () => void {
  const me = ctx.profile;
  let open = false;
  const windows = new Map<string, { el: HTMLElement; log: HTMLElement; render(): void }>();

  const badge = h("span", { class: "badge hidden" });
  const toggle = h("button", { class: "btn friends-toggle", onclick: () => { askNotifyPermission(); open = !open; renderPanel(); } }, "👥 Friends ", badge);
  const panel = h("div", { class: "friends-panel hidden" });
  const winRow = h("div", { class: "chat-windows" });
  const popups = h("div", { class: "invite-popups" });
  const dock = h("div", { class: "messenger" }, winRow, h("div", { class: "friends-col" }, panel, toggle));
  root.append(dock, popups);

  // ---- friends panel ------------------------------------------------------------------
  const addInput = h("input", { type: "text", placeholder: "Add friend by username", maxLength: 16, class: "mini-input", autocapitalize: "none", spellcheck: false });

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
    document.body.classList.toggle("friends-open", open);
    const friends = [...social.friends.values()].sort((a, b) => Number(social.isOnline(b.uid)) - Number(social.isOnline(a.uid)) || a.name.localeCompare(b.name));
    const onlineCount = friends.filter((f) => social.isOnline(f.uid)).length;
    toggle.firstChild!.textContent = `👥 Friends (${onlineCount}/${friends.length}) `;
    const count = social.badgeCount;
    badge.textContent = String(count);
    badge.classList.toggle("hidden", count === 0);
    if (!open) return;

    const knockRows = [...social.knocks.values()].map((k) =>
      h("div", { class: "frow" }, h("span", { class: "knock-ico" }, "✊"), h("span", { class: "fname knock-name" }, `${k.name} is at your door`),
        h("button", { class: "btn small primary", title: "Let them in", onclick: () => social.answerKnock(k.uid, true).then(() => { logAction(me, "room", `let ${k.name} into their room`); toast(`${k.name} can come in until you log off.`); }, () => toast("Couldn't let them in.", "err")) }, "Let in"),
        h("button", { class: "btn small", title: "Send them away", onclick: () => void social.answerKnock(k.uid, false) }, "✕")));

    const hideoutKnockRows = [...social.hideoutKnocks.values()].map((k) =>
      h("div", { class: "frow" }, h("span", { class: "knock-ico" }, "✊"), h("span", { class: "fname knock-name" }, `${k.name} is at your hideout`),
        h("button", { class: "btn small primary", title: "Let them in as a guest", onclick: () => social.answerHideoutKnock(k.uid, true).then(() => toast(`${k.name} can look around your hideout until you log off.`), () => toast("Couldn't let them in.", "err")) }, "Let in"),
        h("button", { class: "btn small", title: "Send them away", onclick: () => void social.answerHideoutKnock(k.uid, false) }, "✕")));

    const reqRows = [...social.requests.values()].map((r) =>
      h("div", { class: "frow" }, headBox(r.figure), h("span", { class: "fname" }, r.name),
        h("button", { class: "btn small primary", title: "Accept", onclick: () => social.accept(r.uid).then(() => { playSfx("friend"); toast(`You and ${r.name} are friends now.`); }, () => toast("Couldn't accept that.", "err")) }, "✓"),
        h("button", { class: "btn small", title: "Decline", onclick: () => void social.decline(r.uid) }, "✕")));

    const giftName = (g: Gift): string => `${g.qty > 1 ? `${g.qty} × ` : ""}${itemDef(g.item)?.name ?? g.item}${g.ass ? " (ass)" : ""}`;
    const giftRows = social.gifts.map((g) =>
      h("div", { class: "frow" }, h("span", { class: "fname" }, `🎁 ${g.fromName} sent you ${giftName(g)}`),
        h("button", { class: "btn small primary", title: "Accept", onclick: () => giftAnswer(me, g.id, true).then(() => { playSfx("give", 0.5); toast(`You got ${giftName(g)}.`); }, (err) => toast((err as Error).message || "Couldn't take it.", "err")) }, "✓"),
        h("button", { class: "btn small", title: "Decline", onclick: () => giftAnswer(me, g.id, false).then(() => toast("You sent it back."), (err) => toast((err as Error).message || "Couldn't do that.", "err")) }, "✕")));
    const returnedRows = social.giftReturns.map((g) =>
      h("div", { class: "frow" }, h("span", { class: "fname" }, `${giftName(g)} was declined`),
        h("button", { class: "btn small primary", title: "Take it back", onclick: () => giftCollect(me, g.id).then(() => toast(`You took back ${giftName(g)}.`), (err) => toast((err as Error).message || "Couldn't take it back.", "err")) }, "Take back")));
    const relRows = [...social.relationRequests.values()].map((r: RelationRequest) =>
      h("div", { class: "frow" }, h("span", { class: "fname" }, r.kind === "partner" ? `💖 ${r.name} wants to be your partner` : `⭐ ${r.name} wants to be your best friend`),
        h("button", { class: "btn small primary", title: "Accept", onclick: () => social.answerRelation(r.uid, true).then(() => { playSfx("friend"); toast(r.kind === "partner" ? `You and ${r.name} are now partners.` : `You and ${r.name} are now best friends.`); }, () => toast("Couldn't accept that.", "err")) }, "✓"),
        h("button", { class: "btn small", title: "Decline", onclick: () => void social.answerRelation(r.uid, false) }, "✕")));

    const hideoutRows = [...social.hideoutInvites.values()].map((i) =>
      h("div", { class: "frow" }, h("span", { class: "fname" }, `🏚 ${i.fromName} invites you to the hideout "${i.roomName}"`),
        h("button", { class: "btn small primary", title: "Join", onclick: () => void hideoutAnswer(me, i.owner, true).then(() => { playSfx("friend"); toast(`You joined "${i.roomName}". The hideout door is at the far end of the basement.`); }, (err) => toast((err as Error).message, "err")) }, "Join"),
        h("button", { class: "btn small", title: "No thanks", onclick: () => void hideoutAnswer(me, i.owner, false).catch(() => undefined) }, "✕")));
    const inviteRows = social.invites.map((i) =>
      h("div", { class: "frow" }, h("span", { class: "fname" }, `${i.fromName} invited you to "${i.roomName}"`),
        h("button", { class: "btn small primary", onclick: () => { void social.dismissInvite(i.id); ctx.navigate("room", { roomId: i.room }); } }, "Join"),
        h("button", { class: "btn small", onclick: () => void social.dismissInvite(i.id) }, "✕")));

    // header + input are built once so typing isn't interrupted by presence updates
    if (!panel.firstChild) {
      panel.append(
        h("div", { class: "fp-head" }, h("strong", {}, "Friends"), h("button", { class: "btn small", title: "Your profile", onclick: () => { open = false; renderPanel(); showProfile(me.uid); } }, "👤 Me"), h("button", { class: "btn small", onclick: () => { open = false; renderPanel(); } }, "Close")),
        h("form", { class: "row fp-add", onsubmit: (e: Event) => { e.preventDefault(); void addFriend(); } }, addInput, h("button", { class: "btn small", type: "submit" }, "Add")),
        dyn);
    }
    dyn.replaceChildren(
      ...(knockRows.length ? [h("div", { class: "fp-sec fp-knocks" }, h("div", { class: "fp-label" }, `Room requests (${knockRows.length})`), ...knockRows)] : []),
      ...(hideoutKnockRows.length ? [h("div", { class: "fp-sec fp-knocks" }, h("div", { class: "fp-label" }, `Hideout guests (${hideoutKnockRows.length})`), ...hideoutKnockRows)] : []),
      ...(inviteRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, "Room invites"), ...inviteRows)] : []),
      ...(hideoutRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, "Hideout invites"), ...hideoutRows)] : []),
      ...(reqRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, `Friend requests (${reqRows.length})`), ...reqRows)] : []),
      ...(relRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, "Partner and best friend requests"), ...relRows)] : []),
      ...(giftRows.length || returnedRows.length ? [h("div", { class: "fp-sec" }, h("div", { class: "fp-label" }, `Gifts (${giftRows.length + returnedRows.length})`), ...giftRows, ...returnedRows)] : []),
      h("div", { class: "fp-list" },
        ...(friends.length === 0
          ? [h("div", { class: "hint pad" }, "No friends yet. Add someone by username, or tap a player in a room.")]
          : friends.map((f) => friendRow(f)))));
  }
  const dyn = h("div", { class: "fp-dyn" });

  function friendRow(f: PublicProfile): HTMLElement {
    const online = social.isOnline(f.uid);
    const room = social.roomOf(f.uid);
    const unread = social.unread.get(f.uid) ?? 0;
    const where = social.isIdle(f.uid) ? "Idle" : room === LOBBY_ID ? "In the basement" : room ? "In a room" : online ? "Online" : "Offline";
    return h("div", { class: "frow" },
      headBox(f.figure),
      h("span", { class: "dot " + (online ? (social.isIdle(f.uid) ? "idle" : "on") : "") }),
      h("span", { class: "fname", title: where, onclick: () => openChat(f.uid) }, f.name, h("span", { class: "fwhere" }, where)),
      unread ? h("span", { class: "badge" }, String(unread)) : null,
      h("button", { class: "btn small", title: "Profile", onclick: () => { open = false; renderPanel(); showProfile(f.uid); } }, "👤"),
      h("button", { class: "btn small", title: "Message", onclick: () => openChat(f.uid) }, "💬"),
      room ? h("button", { class: "btn small", title: room === LOBBY_ID ? "Go to the basement" : "Follow into their room", onclick: () => { open = false; renderPanel(); ctx.navigate("room", { roomId: room }); } }, "➜") : null);
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
        askNotifyPermission(); // you have started talking: now is a fair time to ask if they may tell you about the answer
        social.sendDm(uid, text).then(() => playSfx("sent", 0.3), () => toast("That message didn't go through.", "err"));
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

  // ---- profile window (opened from a player's menu in a room, and from the friends list) ----
  let profileWin: ProfileWindowApi | null = null;
  function showProfile(uid: string): void {
    profileWin?.close();
    profileWin = openProfileWindow(root, ctx, uid, () => { profileWin = null; });
  }
  const onOpenProfile = (e: Event) => showProfile((e as CustomEvent<string>).detail);
  window.addEventListener("open-profile", onOpenProfile);

  const onOpenChat = (e: Event) => openChat((e as CustomEvent<string>).detail);
  window.addEventListener("open-chat", onOpenChat);
  // the Friends button in the top bar (phones) opens/closes the list the same way the corner button does
  const onToggleFriends = () => { askNotifyPermission(); open = !open; renderPanel(); };
  window.addEventListener("toggle-friends", onToggleFriends);

  // ---- live updates ---------------------------------------------------------------------
  const baseTitle = document.title.replace(/^(d+) /, "");
  const seenGifts = new Set<string>(social.gifts.map((g) => g.id));
  const offStore = social.subscribe(() => {
    for (const g of social.gifts) {
      if (seenGifts.has(g.id)) continue;
      seenGifts.add(g.id);
      playSfx("knock", 0.4);
      toast(`🎁 ${g.fromName} sent you a gift. Open your friends list.`);
    }
    const unread = social.totalUnread;
    document.title = unread ? `(${unread}) ${baseTitle}` : baseTitle;
    renderPanel();
    for (const [uid, w] of windows) {
      if (!social.friends.has(uid)) closeChat(uid);
      else { social.markRead(uid); w.render(); }
    }
  });

  const offDm = social.onDm((friend, m) => {
    if (m.from === me.uid) return;
    const f = social.friends.get(friend);
    if (!f) return;
    const away = document.hidden || !document.hasFocus();
    if (away) systemNotify(f.name, m.text, () => openChat(friend)); // the game is in the background: tell the system
    const w = windows.get(friend);
    if (w && !w.el.classList.contains("min") && !away) return; // you are looking at that chat right now
    playSfx("message", 0.4);
    const pop = h("div", { class: "toast ok show msg-toast", onclick: () => { openChat(friend); pop.remove(); } }, `💬 ${f.name}: ${m.text.slice(0, 60)}`);
    document.body.append(pop);
    setTimeout(() => pop.remove(), 5000);
  });

  const offHideoutInvite = social.onHideoutInvite((i) => {
    playSfx("knock", 0.4);
    const card = h("div", { class: "invite-card" },
      h("div", {}, "🏚 ", h("strong", {}, i.fromName), " invites you to the hideout ", h("strong", {}, `"${i.roomName}"`)),
      h("div", { class: "row" },
        h("button", { class: "btn small primary", onclick: () => { card.remove(); void hideoutAnswer(me, i.owner, true).then(() => toast(`You joined "${i.roomName}". The hideout door is at the far end of the basement.`), (err) => toast((err as Error).message, "err")); } }, "Join"),
        h("button", { class: "btn small", onclick: () => { card.remove(); void hideoutAnswer(me, i.owner, false).catch(() => undefined); } }, "No"),
        h("button", { class: "btn small", onclick: () => card.remove() }, "Later")));
    popups.append(card);
    setTimeout(() => card.remove(), 25000);
  });

  const offInvite = social.onInvite((i) => {
    playSfx("knock", 0.4);
    const card = h("div", { class: "invite-card" },
      h("div", {}, h("strong", {}, i.fromName), ` invited you to `, h("strong", {}, `"${i.roomName}"`)),
      h("div", { class: "row" },
        h("button", { class: "btn small primary", onclick: () => { void social.dismissInvite(i.id); card.remove(); ctx.navigate("room", { roomId: i.room }); } }, "Join"),
        h("button", { class: "btn small", onclick: () => { void social.dismissInvite(i.id); card.remove(); } }, "Later")));
    popups.append(card);
    setTimeout(() => card.remove(), 20000);
  });

  // someone knocking on my door: a pop-up right away (the request also waits in the friends menu)
  const offKnock = social.onKnock((k) => {
    playSfx("knock", 0.5);
    const card = h("div", { class: "invite-card knock-card" },
      h("div", {}, "✊ ", h("strong", {}, k.name), " is knocking on your door."),
      h("div", { class: "row" },
        h("button", { class: "btn small primary", onclick: () => { card.remove(); void social.answerKnock(k.uid, true).then(() => { logAction(me, "room", `let ${k.name} into their room`); toast(`${k.name} can come in until you log off.`); }, () => toast("Couldn't let them in.", "err")); } }, "Let in"),
        h("button", { class: "btn small", onclick: () => { card.remove(); void social.answerKnock(k.uid, false); } }, "Send away"),
        h("button", { class: "btn small", onclick: () => card.remove() }, "Later")));
    popups.append(card);
    setTimeout(() => card.remove(), 25000);
  });

  // somebody knocking on my hideout's door: the same pop-up (the owner lets them in as a guest)
  const offHideoutKnock = social.onHideoutKnock((k) => {
    playSfx("knock", 0.5);
    const card = h("div", { class: "invite-card knock-card" },
      h("div", {}, "✊ ", h("strong", {}, k.name), " is knocking on your hideout."),
      h("div", { class: "row" },
        h("button", { class: "btn small primary", onclick: () => { card.remove(); void social.answerHideoutKnock(k.uid, true).then(() => toast(`${k.name} can look around your hideout until you log off.`), () => toast("Couldn't let them in.", "err")); } }, "Let in"),
        h("button", { class: "btn small", onclick: () => { card.remove(); void social.answerHideoutKnock(k.uid, false); } }, "Send away"),
        h("button", { class: "btn small", onclick: () => card.remove() }, "Later")));
    popups.append(card);
    setTimeout(() => card.remove(), 25000);
  });

  renderPanel();
  return () => {
    offStore();
    offHideoutKnock();
    offDm();
    offInvite();
    offHideoutInvite();
    offKnock();
    document.title = baseTitle;
    document.body.classList.remove("friends-open");
    window.removeEventListener("open-chat", onOpenChat);
    window.removeEventListener("open-profile", onOpenProfile);
    profileWin?.close();
    window.removeEventListener("toggle-friends", onToggleFriends);
    dock.remove();
    popups.remove();
  };
}
