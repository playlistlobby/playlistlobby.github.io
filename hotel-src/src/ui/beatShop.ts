import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { serverNow } from "../db";
import { h, toast } from "./dom";
import { headBoxFor } from "./head";
import { scIcon } from "./soundcloud";
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
 * A BeatShop machine. For a visitor: the seller's beats, a play button for the preview, the price (tap, "are you sure", then the price turns into a green Download), and a chat with the
 * seller for every beat they bought. For the seller: their beats, a form to list another one (the whole beat as the preview, or 30 seconds of it), and one Messages inbox for all the chats.
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
  let file: File | null = null, fileMs = 0, title = "", price = 50, whole = false, cropStart = 0, uploading = -1;
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

  const body = h("div", { class: "sc-body bs-body" });
  const titleEl = h("div", { class: "bs-title" });
  const panel = h("div", { class: "bs", role: "dialog", "aria-label": "BeatShop" },
    h("div", { class: "bs-bar" }, h("button", { class: "bs-back", type: "button", "aria-label": "Back", onclick: () => back() }, h("span", { class: "sc-back-tri" })), titleEl, h("button", { class: "bs-x", type: "button", "aria-label": "Close", onclick: () => close() }, "×")),
    h("div", { class: "bs-scroll" }, body));
  host.append(panel);

  const unreadFor = (m: ChatMeta): boolean => (mine ? m.unreadOwner : m.unreadBuyer);
  const unreadBy = (beatId: string): number => inbox.filter((m) => m.beat === beatId && m.unreadOwner).length;
  const unreadAll = (): number => inbox.filter((m) => m.unreadOwner).length;

  function back(): void {
    if (open) { closeThread(); render(); return; }
    close();
  }
  function closeThread(): void { threadStops.forEach((s) => s()); threadStops = []; open = null; thread = null; msgs = []; draft = ""; rap = null; }
  function openThread(o: Open): void {
    closeThread();
    open = o;
    const key = threadKey(o.beat, o.buyer);
    threadStops = [
      watchThread(ownerUid, key, (m) => { thread = m; if (m && unreadFor(m) && !closed) void markRead(me, ownerUid, o.beat, o.buyer).catch(() => undefined); render(); }),
      watchMessages(ownerUid, key, (m) => { msgs = m; render(); window.setTimeout(() => { const sc = body.parentElement; if (sc) sc.scrollTop = sc.scrollHeight; }, 30); }),
    ];
    render();
  }

  // ---- small pieces --------------------------------------------------------------------------------------------------------------------------
  const priceTag = (n: number): HTMLElement => h("span", { class: "bs-price" }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${n}`);
  const playBtn = (key: string, id: string, pieces: number, mime: string, label: string): HTMLElement => {
    const on = pvKey === key && !pv.paused;
    return h("button", { class: "sc-play" + (on ? " on" : ""), type: "button", "aria-label": label, disabled: pvLoading === key, onclick: () => void toggle(key, id, pieces, mime) }, scIcon(on ? "pause" : "play"));
  };
  const seller = (): HTMLElement => h("div", { class: "sc-artistcard" }, headBoxFor(ownerUid), h("div", {}, h("div", { class: "sc-h1" }, mine ? "Your BeatShop" : `${ownerName}'s BeatShop`), h("div", { class: "sc-sub" }, mine ? `${beats.length} of ${BEATS_MAX} beats on sale` : `Beats on sale: ${beats.length}`)));

  // ---- the beats ------------------------------------------------------------------------------------------------------------------------------
  function beatRow(b: Beat): HTMLElement {
    const bought = owned.get(b.id);
    let action: HTMLElement;
    if (mine) action = h("button", { class: "sc-btn danger", type: "button", disabled: busy, onclick: () => { if (window.confirm(`Take "${b.title}" off sale?`)) void act(async () => { await removeBeat(me, b.id); toast("Taken off."); }); } }, "Take off");
    else if (bought && downloadOpen(bought.at, serverNow())) action = h("button", { class: "sc-btn green", type: "button", disabled: busy, onclick: () => void act(async () => { await downloadBeat(bought); toast("The beat is saved."); }) }, "Download");
    else if (bought) action = h("span", { class: "bs-owned" }, "Bought");
    else action = h("button", { class: "sc-btn primary bs-buy", type: "button", disabled: busy, onclick: () => { confirm = b; render(); } }, priceTag(b.price));
    const chat = !mine && bought ? h("button", { class: "sc-btn", type: "button", onclick: () => openThread({ beat: b.id, buyer: me.uid, title: b.title, who: ownerName }) }, "Chat") : null;
    const unread = mine ? unreadBy(b.id) : 0;
    return h("div", { class: "sc-row bs-beat" },
      playBtn(`p:${b.id}`, b.previewId, b.previewPieces, b.previewMime, `Play ${b.title}`),
      h("div", { class: "sc-main" },
        h("div", { class: "sc-title" }, b.title),
        h("div", { class: "sc-line" }, h("span", { class: "sc-meta" }, fmtDur(b.durMs)), h("span", { class: "sc-meta" }, b.whole ? "Whole beat" : `Preview ${fmtDur(b.previewMs)}`), ...(mine ? [h("span", { class: "sc-meta" }, `Sold ${b.sold}`)] : []))),
      h("div", { class: "bs-act" }, ...(mine ? [priceTag(b.price)] : []), action, ...(chat ? [chat] : []), ...(unread ? [h("span", { class: "bs-dot", title: "New messages" }, String(unread))] : [])));
  }
  function beatsPage(): HTMLElement[] {
    return [seller(), ...(beats.length ? beats.map(beatRow) : [h("div", { class: "sc-empty" }, mine ? "You have no beats on sale. Add one." : "There are no beats here yet.")])];
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
      cropStart = 0; whole = fileMs <= PREVIEW_MS + 2000;
      render();
    } }) as HTMLInputElement;
    const titleIn = h("input", { class: "hc-input", type: "text", maxlength: "40", placeholder: "Beat title", value: title, "aria-label": "Beat title", oninput: () => { title = titleIn.value; } }) as HTMLInputElement;
    const priceIn = h("input", { class: "hc-input bs-priceIn", type: "number", min: String(BEAT_PRICE_MIN), max: String(BEAT_PRICE_MAX), value: String(price), "aria-label": "Price", oninput: () => { price = Number(priceIn.value); } }) as HTMLInputElement;
    const maxStart = Math.max(0, fileMs - PREVIEW_MS);
    const slider = h("input", { type: "range", min: "0", max: String(Math.floor(maxStart / 1000)), value: String(Math.floor(cropStart / 1000)), class: "bs-range", "aria-label": "Where the preview starts", oninput: () => { cropStart = Number(slider.value) * 1000; startLabel.textContent = `Starts at ${fmtDur(cropStart)}`; } }) as HTMLInputElement;
    const startLabel = h("span", { class: "sc-sub dark" }, `Starts at ${fmtDur(cropStart)}`);
    const go = h("button", { class: "sc-btn primary", type: "button", disabled: !file || uploading >= 0 || left <= 0, onclick: async () => {
      if (!file) return;
      if (!(price >= BEAT_PRICE_MIN && price <= BEAT_PRICE_MAX)) return void toast(`The price has to be between ${BEAT_PRICE_MIN} and ${BEAT_PRICE_MAX}.`, "err");
      uploading = 0; render();
      try {
        await uploadBeat(me, { file, title, price, durMs: fileMs, cropStartMs: whole ? null : cropStart }, (f) => { uploading = f; prog(); });
        toast("Your beat is on sale.");
        logAction(me, "buy", "put a beat on sale");
        file = null; title = ""; fileMs = 0; tab = "beats";
      } catch (err) { toast((err as Error).message || "The upload failed.", "err"); }
      uploading = -1; render();
    } }, uploading >= 0 ? "Uploading" : "Put it on sale");
    const bar = h("div", { class: "sc-prog", hidden: uploading < 0 }, h("i", { style: { width: `${Math.round(Math.max(0, uploading) * 100)}%` } }));
    function prog(): void { (bar.firstElementChild as HTMLElement).style.width = `${Math.round(uploading * 100)}%`; }
    const modeBtn = (isWhole: boolean, label: string, sub: string): HTMLElement => h("button", { class: "bs-mode" + (whole === isWhole ? " on" : ""), type: "button", disabled: !file || (isWhole === false && fileMs < 3000), onclick: () => { whole = isWhole; render(); } }, h("b", {}, label), h("small", {}, sub));
    return [
      seller(),
      h("div", { class: "hc-group sc-upload" },
        h("div", { class: "hc-label" }, "Add a beat"),
        h("div", { class: "sc-sub dark" }, left > 0 ? "An mp3, wav, ogg or m4a up to 10 MB and 10 minutes." : `You have ${BEATS_MAX} beats on sale. Take one off to add another.`),
        h("div", { class: "sc-filerow" }, h("button", { class: "sc-btn", type: "button", disabled: left <= 0 || uploading >= 0, onclick: () => fileIn.click() }, file ? "Another file" : "Choose a file"), h("span", { class: "sc-sub dark" }, file ? `${file.name.slice(0, 26)} - ${fmtDur(fileMs)}` : "No file chosen"), fileIn),
        titleIn,
        h("div", { class: "bs-pricerow" }, h("span", { class: "sc-sub dark" }, "Price in blood"), priceIn),
        h("div", { class: "hc-label" }, "What people can listen to"),
        h("div", { class: "bs-modes" },
          modeBtn(false, "30 seconds", "A preview you pick. The rest is for buyers."),
          modeBtn(true, "The whole beat", "Everybody can hear all of it.")),
        ...(!whole && file ? [h("div", { class: "bs-crop" }, slider, startLabel)] : []),
        go, bar),
    ];
  }

  // ---- the messages ----------------------------------------------------------------------------------------------------------------------------
  function inboxPage(): HTMLElement[] {
    const chips = [h("button", { class: "bs-chip" + (filter === null ? " on" : ""), type: "button", onclick: () => { filter = null; render(); } }, `All${unreadAll() ? ` (${unreadAll()})` : ""}`),
      ...beats.map((b) => h("button", { class: "bs-chip" + (filter === b.id ? " on" : ""), type: "button", onclick: () => { filter = b.id; render(); } }, `${b.title}${unreadBy(b.id) ? ` (${unreadBy(b.id)})` : ""}`))];
    const list = inbox.filter((m) => filter === null || m.beat === filter);
    return [
      h("div", { class: "bs-chips" }, ...chips),
      ...(list.length ? list.map((m) => h("button", { class: "sc-row bs-thread" + (m.unreadOwner ? " unread" : ""), type: "button", onclick: () => openThread({ beat: m.beat, buyer: m.buyer, title: m.title, who: m.buyerName }) },
        headBoxFor(m.buyer),
        h("div", { class: "sc-main" }, h("div", { class: "sc-title" }, m.buyerName), h("div", { class: "sc-line" }, h("span", { class: "sc-meta" }, m.title)), h("div", { class: "bs-last" }, m.lastBy === me.uid ? "You: " : "", m.lastText)),
        h("div", { class: "bs-when" }, ago(m.lastAt), ...(m.unreadOwner ? [h("span", { class: "bs-dot" }, "")] : [])))) : [h("div", { class: "sc-empty" }, "No messages yet. A chat starts when somebody buys one of your beats.")]),
    ];
  }
  function msgView(m: ChatMsg): HTMLElement {
    const mineMsg = m.by === me.uid;
    return h("div", { class: "bs-msg" + (mineMsg ? " me" : "") },
      h("div", { class: "bs-msg-who" }, mineMsg ? "You" : m.name, h("span", {}, ` ${ago(m.at)}`)),
      ...(m.text ? [h("div", { class: "bs-msg-text" }, m.text)] : []),
      ...(m.audio ? [h("div", { class: "bs-msg-audio" }, playBtn(`m:${m.id}`, m.audio.id, m.audio.pieces, m.audio.mime, "Play the rap"), h("span", { class: "sc-sub dark" }, `Rap ${fmtDur(m.audio.durMs)}`))] : []));
  }
  function threadPage(o: Open): HTMLElement[] {
    const rapIn = h("input", { type: "file", accept: "audio/*", class: "sc-file", "aria-label": "Choose your rap", onchange: async () => {
      const f = rapIn.files?.[0];
      if (!f) return;
      const r = await checkReplyFile(f);
      if ("error" in r) { toast(r.error, "err"); rapIn.value = ""; return; }
      rap = f; rapMs = r.durMs; render();
    } }) as HTMLInputElement;
    const input = h("input", { class: "hc-input", type: "text", maxlength: "200", placeholder: "Write a message", value: draft, "aria-label": "Message", oninput: () => { draft = input.value; sendBtn.disabled = sending || (!draft.trim() && !rap); }, onkeydown: (e: KeyboardEvent) => { if (e.key === "Enter") void send(); } }) as HTMLInputElement;
    const sendBtn = h("button", { class: "sc-btn primary", type: "button", disabled: sending || (!draft.trim() && !rap), onclick: () => void send() }, sending ? "Sending" : "Send");
    async function send(): Promise<void> {
      if (sending || (!draft.trim() && !rap)) return;
      sending = true; render();
      try { await sendChat(me, ownerUid, o.beat, o.buyer, draft, rap, rapMs); draft = ""; rap = null; rapMs = 0; playSfx("give", 0.4); } catch (err) { toast((err as Error).message || "That didn't send.", "err"); }
      sending = false; render();
    }
    const slot = !msgs.length && !mine
      ? h("button", { class: "bs-slot", type: "button", onclick: () => rapIn.click() }, h("b", {}, "Upload your rap on this beat"), h("small", {}, rap ? `${rap.name.slice(0, 30)} - ${fmtDur(rapMs)}` : "An mp3, wav, ogg or m4a, up to 3 MB and a minute. Tap to choose."))
      : null;
    return [
      h("div", { class: "sc-artistcard" }, headBoxFor(mine ? o.buyer : ownerUid), h("div", {}, h("div", { class: "sc-h1" }, o.who), h("div", { class: "sc-sub" }, o.title))),
      ...(msgs.length ? msgs.map(msgView) : [h("div", { class: "sc-empty" }, mine ? "Nothing yet." : "Say something to the seller, or send your rap.")]),
      ...(slot ? [slot] : []),
      h("div", { class: "bs-compose" },
        input,
        h("button", { class: "sc-btn", type: "button", disabled: sending, onclick: () => rapIn.click() }, rap ? "Another rap" : "Add a rap"),
        sendBtn,
        rapIn),
      ...(rap && !slot ? [h("div", { class: "sc-sub dark" }, `Rap: ${rap.name.slice(0, 30)} - ${fmtDur(rapMs)}`)] : []),
    ];
  }

  // ---- the page ---------------------------------------------------------------------------------------------------------------------------------
  async function act(fn: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { await fn(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  }
  function tabs(): HTMLElement {
    const t = (id: Tab, label: string): HTMLElement => h("button", { class: "sc-seg-btn" + (tab === id ? " on" : ""), type: "button", onclick: () => { tab = id; render(); } }, label);
    return h("div", { class: "sc-seg", role: "tablist" }, t("beats", "My beats"), t("add", "Add a beat"), t("messages", `Messages${unreadAll() ? ` (${unreadAll()})` : ""}`));
  }
  function confirmSheet(b: Beat): HTMLElement {
    return h("div", { class: "bs-sheet" }, h("div", { class: "bs-sheet-box", role: "alertdialog" },
      h("div", { class: "sc-h1 dark" }, "Are you sure?"),
      h("div", { class: "sc-sub dark" }, `Buy "${b.title}" from ${ownerName} for ${b.price} blood? You get the whole beat to keep.`),
      h("div", { class: "bs-sheet-row" },
        h("button", { class: "sc-btn", type: "button", onclick: () => { confirm = null; render(); } }, "Cancel"),
        h("button", { class: "sc-btn primary", type: "button", disabled: busy || me.blood < b.price, onclick: () => { confirm = null; void act(async () => { await buyBeat(me, ownerUid, b.id); ctx.refreshHeader(); playSfx("coins", 0.5); logAction(me, "buy", `bought a beat for ${b.price}`); toast("It's yours. Tap Download."); }); } }, "Buy for ", priceTag(b.price))),
      ...(me.blood < b.price ? [h("div", { class: "sc-sub dark" }, `You need ${b.price - me.blood} more blood.`)] : [])));
  }
  /** a redraw that leaves a page with a text field alone while somebody is typing in it (the player's buttons call this) */
  function softRender(): void {
    if (closed) return;
    if (document.activeElement instanceof HTMLInputElement && body.contains(document.activeElement)) return;
    render();
  }
  function render(): void {
    if (closed) return;
    titleEl.textContent = open ? "Chat" : "BeatShop";
    const keep = body.parentElement?.scrollTop ?? 0;
    const page = open ? threadPage(open) : mine ? (tab === "beats" ? beatsPage() : tab === "add" ? addPage() : inboxPage()) : beatsPage();
    body.replaceChildren(...(mine && !open ? [tabs()] : []), ...page);
    panel.querySelector(".bs-sheet")?.remove();
    if (confirm) panel.append(confirmSheet(confirm)); // (over the whole window)
    if (!open && body.parentElement) body.parentElement.scrollTop = keep;
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
