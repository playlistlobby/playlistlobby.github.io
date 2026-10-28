import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { serverNow } from "../db";
import { h, toast } from "./dom";
import { headBoxFor } from "./head";
import { backButton, scIcon } from "./soundcloud";
import { BLOOD_ICON } from "../items";
import { playSfx } from "../sfx";
import { logAction } from "../logger";
import { audioUrl } from "../audio";
import { buyBeat, checkBeatFile, checkReplyFile, downloadBeat, markRead, removeBeat, sendChat, threadKey, uploadBeat, watchBeats, watchInbox, watchMessages, watchOwnedBeats, watchThread } from "../beats";
import { BEAT_PRICE_MAX, BEAT_PRICE_MIN, BEATS_MAX, downloadOpen, PREVIEW_MS } from "../shared/beats";
import type { Beat, ChatMeta, ChatMsg, OwnedBeat } from "../shared/beats";
import { fmtDur, titleFromName } from "../shared/audio";
import { cleanTitle } from "../shared/songs";
import type { Ctx } from "../main";

export interface BeatShopApi { close(): void }
type Tab = "beats" | "add" | "messages";
interface Open { beat: string; buyer: string; title: string; who: string }

const ago = (t: number): string => {
  const s = Math.max(0, Math.round((serverNow() - t) / 1000));
  return s < 60 ? "now" : s < 3600 ? `${Math.floor(s / 60)} min` : s < 86400 ? `${Math.floor(s / 3600)} h` : `${Math.floor(s / 86400)} d`;
};

/**
 * A BeatShop machine, drawn like the iTunes store and the Messages app of iOS 6 (dark navigation bar, grey section bars, striped rows, bevelled LABEL buttons, a dark tab bar,
 * an alert box, chat bubbles on linen). For a visitor: the seller's beats, a play button on every tile for the 30 second preview, the price (tap, "are you sure", then the price
 * turns into a green Download), and a chat with the seller for every beat they bought. For the seller: their beats, a form to list another one (its preview is 30 seconds they pick),
 * and one Messages inbox for all the chats. The look lives in the sc-* and bs-* rules of style.css.
 */
export function openBeatShop(host: HTMLElement, ctx: Ctx, ownerUid: string, ownerNameHint: string, onClose: () => void): BeatShopApi {
  const me = ctx.profile;
  const mine = ownerUid === me.uid;
  let ownerName = ownerNameHint;
  let tab: Tab = "beats";
  let beats: Beat[] = [];
  let owned = new Map<string, OwnedBeat>();
  let inbox: ChatMeta[] = [];
  let open: Open | null = null;
  let filter: string | null = null;
  let confirm: Beat | null = null;
  let busy = false;
  let closed = false;
  // the form of a new beat
  let file: File | null = null, fileMs = 0, title = "", price = 50, cropStart = 0, uploading = -1;
  // the chat that is open
  let thread: ChatMeta | null = null, msgs: ChatMsg[] = [], draft = "", rap: File | null = null, rapMs = 0, sending = false;
  let threadStops: Array<() => void> = [];

  // one little player for previews and raps
  const pv = new Audio();
  let pvKey = "";
  let pvLoading = "";
  pv.addEventListener("ended", () => { pvKey = ""; softRender(); });
  pv.addEventListener("pause", () => softRender());
  async function toggle(key: string, id: string, pieces: number, mime: string): Promise<void> {
    if (pvKey === key && !pv.paused) { pv.pause(); pvKey = ""; softRender(); return; }
    pvLoading = key; softRender();
    try {
      pv.src = await audioUrl(id, pieces, mime);
      await pv.play();
      pvKey = key;
    } catch { toast("That sound isn't available.", "err"); pvKey = ""; }
    pvLoading = ""; softRender();
  }

  const navTitle = h("div", { class: "sc-nav-title" }, "BeatShop");
  const navLeft = h("div", { class: "sc-nav-side" });
  const navRight = h("div", { class: "sc-nav-side right" }, h("button", { class: "sc-barbtn", type: "button", onclick: () => close() }, "Done"));
  const body = h("div", { class: "sc-body bs-body" });
  const scroll = h("div", { class: "sc-scroll" }, body);
  const footer = h("div", { class: "bs-footer" });
  const panel = h("div", { class: "bs", role: "dialog", "aria-label": "BeatShop" }, h("div", { class: "sc-nav" }, navLeft, navTitle, navRight), scroll, footer);
  host.append(panel);

  const unreadFor = (m: ChatMeta): boolean => (mine ? m.unreadOwner : m.unreadBuyer);
  const unreadBy = (beatId: string): number => inbox.filter((m) => m.beat === beatId && m.unreadOwner).length;
  const unreadAll = (): number => inbox.filter((m) => m.unreadOwner).length;

  function back(): void { closeThread(); render(); }
  function closeThread(): void { threadStops.forEach((s) => s()); threadStops = []; open = null; thread = null; msgs = []; draft = ""; rap = null; }
  function openThread(o: Open): void {
    closeThread();
    open = o;
    const key = threadKey(o.beat, o.buyer);
    threadStops = [
      watchThread(ownerUid, key, (m) => { thread = m; if (m && unreadFor(m) && !closed) void markRead(me, ownerUid, o.beat, o.buyer).catch(() => undefined); render(); }),
      watchMessages(ownerUid, key, (m) => { msgs = m; render(); window.setTimeout(() => { scroll.scrollTop = scroll.scrollHeight; }, 30); }),
    ];
    render();
  }

  // ---- small pieces --------------------------------------------------------------------------------------------------------------------------
  const section = (t: string): HTMLElement => h("div", { class: "sc-section" }, t);
  const priceTag = (n: number): HTMLElement => h("span", { class: "bs-price" }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${n}`);
  /** an album tile with a play button over it (the 30 second preview) */
  const tile = (key: string, id: string, pieces: number, mime: string, label: string): HTMLElement => {
    const on = pvKey === key && !pv.paused;
    return h("button", { class: "sc-art beat" + (on ? " on" : ""), type: "button", "aria-label": label, disabled: pvLoading === key, onclick: () => void toggle(key, id, pieces, mime) },
      h("span", { class: "bs-note" }, scIcon("note")), h("span", { class: "bs-tileplay" }, scIcon(on ? "pause" : "play")));
  };
  const roundPlay = (key: string, id: string, pieces: number, mime: string, label: string): HTMLElement => {
    const on = pvKey === key && !pv.paused;
    return h("button", { class: "sc-play" + (on ? " on" : ""), type: "button", "aria-label": label, disabled: pvLoading === key, onclick: () => void toggle(key, id, pieces, mime) }, scIcon(on ? "pause" : "play"));
  };
  const seller = (): HTMLElement => h("div", { class: "sc-profilehead" }, h("div", { class: "sc-art big" }, headBoxFor(ownerUid)),
    h("div", { class: "sc-ph-text" }, h("div", { class: "sc-ph-name" }, mine ? "Your BeatShop" : `${ownerName}'s BeatShop`), h("div", { class: "sc-ph-sub" }, mine ? `${beats.length} of ${BEATS_MAX} beats on sale` : `Beats on sale: ${beats.length}`)));

  // ---- the beats ------------------------------------------------------------------------------------------------------------------------------
  function beatRow(b: Beat): HTMLElement {
    const bought = owned.get(b.id);
    const acts: HTMLElement[] = [];
    if (mine) {
      acts.push(h("span", { class: "bs-price-tag" }, priceTag(b.price)));
      acts.push(h("button", { class: "sc-btn danger small", type: "button", disabled: busy, onclick: () => { if (window.confirm(`Take "${b.title}" off sale?`)) void act(async () => { await removeBeat(me, b.id); toast("Taken off."); }); } }, "Take off"));
    } else if (bought && downloadOpen(bought.at, serverNow())) {
      acts.push(h("button", { class: "sc-btn green small", type: "button", disabled: busy, onclick: () => void act(async () => { await downloadBeat(bought); toast("The beat is saved."); }) }, scIcon("cloud"), "Download"));
      acts.push(h("button", { class: "sc-btn small", type: "button", onclick: () => openThread({ beat: b.id, buyer: me.uid, title: b.title, who: ownerName }) }, scIcon("bubble"), "Chat"));
    } else if (bought) {
      acts.push(h("span", { class: "bs-owned" }, scIcon("check"), "Bought"));
      acts.push(h("button", { class: "sc-btn small", type: "button", onclick: () => openThread({ beat: b.id, buyer: me.uid, title: b.title, who: ownerName }) }, scIcon("bubble"), "Chat"));
    } else acts.push(h("button", { class: "sc-btn small bs-buy", type: "button", disabled: busy, onclick: () => { confirm = b; render(); } }, priceTag(b.price)));
    const unread = mine ? unreadBy(b.id) : 0;
    return h("div", { class: "sc-row bs-beat" },
      tile(`p:${b.id}`, b.previewId, b.previewPieces, b.previewMime, `Play ${b.title}`),
      h("div", { class: "sc-main" },
        h("div", { class: "sc-title" }, h("span", {}, b.title), ...(unread ? [h("span", { class: "bs-dot", title: "New messages" }, String(unread))] : [])),
        h("div", { class: "sc-line" }, h("span", { class: "sc-meta" }, fmtDur(b.durMs)), h("span", { class: "sc-meta" }, b.whole ? "Whole beat" : `Preview ${fmtDur(b.previewMs)}`), ...(mine ? [h("span", { class: "sc-meta" }, `Sold ${b.sold}`)] : []))),
      h("div", { class: "bs-act" }, ...acts));
  }
  function beatsPage(): HTMLElement[] {
    return [seller(), section(mine ? "My beats" : "Beats"), beats.length ? h("div", { class: "sc-list" }, ...beats.map(beatRow)) : h("div", { class: "sc-empty" }, mine ? "You have no beats on sale. Add one." : "There are no beats here yet.")];
  }

  // ---- adding a beat --------------------------------------------------------------------------------------------------------------------------
  function addPage(): HTMLElement[] {
    const left = BEATS_MAX - beats.length;
    const fileIn = h("input", { type: "file", accept: "audio/*", class: "sc-file", "aria-label": "Choose a beat", onchange: async () => {
      const f = fileIn.files?.[0];
      if (!f) return;
      const r = await checkBeatFile(f);
      if ("error" in r) { toast(r.error, "err"); fileIn.value = ""; return; }
      file = f; fileMs = r.durMs; if (!title) title = cleanTitle(titleFromName(f.name));
      cropStart = 0;
      render();
    } }) as HTMLInputElement;
    const titleIn = h("input", { class: "sc-field", type: "text", maxlength: "40", placeholder: "Beat title", value: title, "aria-label": "Beat title", oninput: () => { title = titleIn.value; } }) as HTMLInputElement;
    const priceIn = h("input", { class: "sc-field num", type: "number", min: String(BEAT_PRICE_MIN), max: String(BEAT_PRICE_MAX), value: String(price), "aria-label": "Price", oninput: () => { price = Number(priceIn.value); } }) as HTMLInputElement;
    const maxStart = Math.max(0, fileMs - PREVIEW_MS);
    const slider = h("input", { type: "range", min: "0", max: String(Math.floor(maxStart / 1000)), value: String(Math.floor(cropStart / 1000)), class: "sc-range", "aria-label": "Where the preview starts", oninput: () => { cropStart = Number(slider.value) * 1000; startLabel.textContent = fmtDur(cropStart); } }) as HTMLInputElement;
    const startLabel = h("span", { class: "sc-gvalue" }, fmtDur(cropStart));
    const go = h("button", { class: "sc-btn blue wide", type: "button", disabled: !file || uploading >= 0 || left <= 0, onclick: async () => {
      if (!file) return;
      if (!(price >= BEAT_PRICE_MIN && price <= BEAT_PRICE_MAX)) return void toast(`The price has to be between ${BEAT_PRICE_MIN} and ${BEAT_PRICE_MAX}.`, "err");
      uploading = 0; render();
      try {
        await uploadBeat(me, { file, title, price, durMs: fileMs, cropStartMs: cropStart }, (f) => { uploading = f; prog(); });
        toast("Your beat is on sale.");
        logAction(me, "buy", "put a beat on sale");
        file = null; title = ""; fileMs = 0; tab = "beats";
      } catch (err) { toast((err as Error).message || "The upload failed.", "err"); }
      uploading = -1; render();
    } }, uploading >= 0 ? "Uploading" : "Put it on sale");
    const bar = h("div", { class: "sc-prog", hidden: uploading < 0 }, h("i", { style: { width: `${Math.round(Math.max(0, uploading) * 100)}%` } }));
    function prog(): void { (bar.firstElementChild as HTMLElement).style.width = `${Math.round(uploading * 100)}%`; }
    return [
      seller(),
      section("Add a beat"),
      h("div", { class: "sc-linen" },
        h("div", { class: "sc-note" }, left > 0 ? "An mp3, wav, ogg or m4a up to 10 MB and 10 minutes." : `You have ${BEATS_MAX} beats on sale. Take one off to add another.`),
        h("div", { class: "sc-group" },
          h("div", { class: "sc-grow" }, h("span", { class: "sc-glabel" }, file ? `${file.name.slice(0, 20)} - ${fmtDur(fileMs)}` : "No file chosen"), h("button", { class: "sc-btn", type: "button", disabled: left <= 0 || uploading >= 0, onclick: () => fileIn.click() }, file ? "Another file" : "Choose a file"), fileIn),
          h("div", { class: "sc-grow" }, titleIn),
          h("div", { class: "sc-grow" }, h("span", { class: "sc-glabel" }, "Price in blood"), priceIn)),
        h("div", { class: "sc-note" }, "People hear 30 seconds you pick. The whole beat is for buyers."),
        ...(file ? [h("div", { class: "sc-group" }, h("div", { class: "sc-grow" }, h("span", { class: "sc-glabel" }, "Preview"), startLabel), ...(maxStart > 0 ? [h("div", { class: "sc-grow slider" }, slider)] : []))] : []),
        go, bar),
    ];
  }

  // ---- the messages ----------------------------------------------------------------------------------------------------------------------------
  function inboxPage(): HTMLElement[] {
    const chip = (id: string | null, label: string, n: number): HTMLElement => h("button", { class: "sc-chip" + (filter === id ? " on" : ""), type: "button", onclick: () => { filter = id; render(); } }, label, ...(n ? [h("span", { class: "bs-dot" }, String(n))] : []));
    const chips = [chip(null, "All", unreadAll()), ...beats.map((b) => chip(b.id, b.title, unreadBy(b.id)))];
    const list = inbox.filter((m) => filter === null || m.beat === filter);
    return [
      section("Messages"),
      h("div", { class: "sc-chips" }, ...chips),
      list.length ? h("div", { class: "sc-list" }, ...list.map((m) => h("button", { class: "sc-row bs-thread" + (m.unreadOwner ? " unread" : ""), type: "button", onclick: () => openThread({ beat: m.beat, buyer: m.buyer, title: m.title, who: m.buyerName }) },
        h("span", { class: "bs-unread" + (m.unreadOwner ? " on" : "") }),
        h("div", { class: "sc-art" }, headBoxFor(m.buyer)),
        h("div", { class: "sc-main" },
          h("div", { class: "sc-title" }, h("span", {}, m.buyerName), h("span", { class: "bs-when" }, ago(m.lastAt))),
          h("div", { class: "sc-line" }, h("span", { class: "sc-meta" }, m.title)),
          h("div", { class: "bs-last" }, m.lastBy === me.uid ? "You: " : "", m.lastText)),
        h("span", { class: "sc-chev" })))) : h("div", { class: "sc-empty" }, "No messages yet. A chat starts when somebody buys one of your beats."),
    ];
  }
  function msgView(m: ChatMsg): HTMLElement {
    const mineMsg = m.by === me.uid;
    return h("div", { class: "bs-msg" + (mineMsg ? " me" : "") },
      h("div", { class: "bs-msg-who" }, mineMsg ? "You" : m.name, h("span", {}, ` ${ago(m.at)}`)),
      h("div", { class: "bs-bubble" },
        ...(m.text ? [h("div", { class: "bs-msg-text" }, m.text)] : []),
        ...(m.audio ? [h("div", { class: "bs-msg-audio" }, roundPlay(`m:${m.id}`, m.audio.id, m.audio.pieces, m.audio.mime, "Play the rap"), h("span", { class: "bs-msg-len" }, `Rap ${fmtDur(m.audio.durMs)}`))] : [])));
  }
  function threadPage(o: Open): HTMLElement[] {
    const rapIn = h("input", { type: "file", accept: "audio/*", class: "sc-file", "aria-label": "Choose your rap", onchange: async () => {
      const f = rapIn.files?.[0];
      if (!f) return;
      const r = await checkReplyFile(f);
      if ("error" in r) { toast(r.error, "err"); rapIn.value = ""; return; }
      rap = f; rapMs = r.durMs; render();
    } }) as HTMLInputElement;
    const sendBtn = h("button", { class: "sc-btn green small bs-send", type: "button", disabled: sending || (!draft.trim() && !rap), onclick: () => void send() }, sending ? "Sending" : "Send");
    const input = h("input", { class: "bs-input", type: "text", maxlength: "200", placeholder: "Write a message", value: draft, "aria-label": "Message", oninput: () => { draft = input.value; sendBtn.disabled = sending || (!draft.trim() && !rap); }, onkeydown: (e: KeyboardEvent) => { if (e.key === "Enter") void send(); } }) as HTMLInputElement;
    async function send(): Promise<void> {
      if (sending || (!draft.trim() && !rap)) return;
      sending = true; render();
      try { await sendChat(me, ownerUid, o.beat, o.buyer, draft, rap, rapMs); draft = ""; rap = null; rapMs = 0; playSfx("give", 0.4); } catch (err) { toast((err as Error).message || "That didn't send.", "err"); }
      sending = false; render();
    }
    const slot = !msgs.length && !mine
      ? h("button", { class: "bs-slot", type: "button", onclick: () => rapIn.click() }, scIcon("note"), h("b", {}, "Upload your rap on this beat"), h("small", {}, rap ? `${rap.name.slice(0, 30)} - ${fmtDur(rapMs)}` : "An mp3, wav, ogg or m4a, up to 3 MB and a minute. Tap to choose."))
      : null;
    footer.replaceChildren(
      ...(rap && !slot ? [h("div", { class: "bs-rapchip" }, scIcon("note"), h("span", {}, `${rap.name.slice(0, 24)} - ${fmtDur(rapMs)}`), h("button", { class: "bs-x", type: "button", "aria-label": "Close", onclick: () => { rap = null; render(); } }, "×"))] : []),
      h("div", { class: "bs-compose" },
        h("button", { class: "sc-cbtn plus", type: "button", disabled: sending, title: rap ? "Another rap" : "Add a rap", "aria-label": rap ? "Another rap" : "Add a rap", onclick: () => rapIn.click() }, scIcon("plus")),
        input, sendBtn, rapIn));
    return [
      section(o.title),
      h("div", { class: "sc-who" }, h("div", { class: "sc-art" }, headBoxFor(mine ? o.buyer : ownerUid)), h("span", {}, o.who)),
      h("div", { class: "bs-chat" },
        ...(msgs.length ? msgs.map(msgView) : [h("div", { class: "sc-empty linen" }, mine ? "Nothing yet." : "Say something to the seller, or send your rap.")]),
        ...(slot ? [slot] : [])),
    ];
  }

  // ---- the page ---------------------------------------------------------------------------------------------------------------------------------
  async function act(fn: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { await fn(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  }
  /** the dark tab bar of the seller: My beats, Add a beat, Messages (with the red badge) */
  function tabBar(): HTMLElement {
    const item = (id: Tab, icon: string, label: string, badge = 0): HTMLElement => h("button", { class: "sc-tab" + (tab === id ? " on" : ""), type: "button", onclick: () => { tab = id; render(); } },
      h("span", { class: "sc-tab-ico" }, scIcon(icon), ...(badge ? [h("span", { class: "sc-badge" }, String(badge))] : [])), h("span", { class: "sc-tab-label" }, label));
    return h("div", { class: "sc-tabbar", role: "tablist" }, item("beats", "note", "My beats"), item("add", "plus", "Add a beat"), item("messages", "bubble", "Messages", unreadAll()));
  }
  /** the iOS 6 alert box */
  function confirmSheet(b: Beat): HTMLElement {
    return h("div", { class: "bs-sheet" }, h("div", { class: "bs-alert", role: "alertdialog" },
      h("div", { class: "bs-alert-body" },
        h("div", { class: "bs-alert-title" }, "Are you sure?"),
        h("div", { class: "bs-alert-msg" }, `Buy "${b.title}" from ${ownerName} for ${b.price} blood? You get the whole beat to keep.`),
        ...(me.blood < b.price ? [h("div", { class: "bs-alert-msg warn" }, `You need ${b.price - me.blood} more blood.`)] : [])),
      h("div", { class: "bs-alert-row" },
        h("button", { class: "bs-alert-btn", type: "button", onclick: () => { confirm = null; render(); } }, "Cancel"),
        h("button", { class: "bs-alert-btn ok", type: "button", disabled: busy || me.blood < b.price, onclick: () => { confirm = null; void act(async () => { await buyBeat(me, ownerUid, b.id); ctx.refreshHeader(); playSfx("coins", 0.5); logAction(me, "buy", `bought a beat for ${b.price}`); toast("It's yours. Tap Download."); }); } }, "Buy for ", priceTag(b.price)))));
  }
  /** a redraw that leaves a page with a text field alone while somebody is typing in it (the player's buttons call this) */
  function softRender(): void {
    if (closed) return;
    if (document.activeElement instanceof HTMLInputElement && panel.contains(document.activeElement)) return;
    render();
  }
  function render(): void {
    if (closed) return;
    navTitle.textContent = open ? "Chat" : "BeatShop";
    navLeft.replaceChildren(...(open ? [backButton("Back", back)] : []));
    const keep = scroll.scrollTop;
    const page = open ? threadPage(open) : mine ? (tab === "beats" ? beatsPage() : tab === "add" ? addPage() : inboxPage()) : beatsPage();
    body.replaceChildren(...page);
    scroll.classList.toggle("linen", !!open || (mine && tab === "add"));
    if (!open) footer.replaceChildren(...(mine ? [tabBar()] : []));
    panel.querySelector(".bs-sheet")?.remove();
    if (confirm) panel.append(confirmSheet(confirm)); // (over the whole window)
    if (!open) scroll.scrollTop = keep;
  }

  const stops = [
    watchBeats(ownerUid, (b) => { beats = b; softRender(); }),
    watchOwnedBeats(me.uid, (l) => { owned = new Map(l.map((x) => [x.id, x])); softRender(); }),
    ...(mine ? [watchInbox(me.uid, (c) => { inbox = c; softRender(); })] : []),
    ...(ownerNameHint ? [] : [onValue(ref(db, `profiles/${ownerUid}/name`), (s) => { if (typeof s.val() === "string") { ownerName = s.val() as string; softRender(); } }, () => undefined)]),
  ];
  // the download button goes away an hour after the purchase: look again every minute
  const tick = window.setInterval(softRender, 60_000);
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    window.clearInterval(tick);
    stops.forEach((s) => s());
    closeThread();
    pv.pause(); pv.removeAttribute("src");
    panel.remove();
    onClose();
  }
  return { close };
}
