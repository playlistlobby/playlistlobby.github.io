import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { headBoxFor } from "./head";
import { downloadBeat, watchOwnedBeats } from "../beats";
import type { OwnedBeat } from "../shared/beats";
import { checkSongFile, deleteSong, scPlayer, SONG_SLOTS, sweepSongs, uploadSong, voteSong, watchMyVotes, watchSongs } from "../soundcloud";
import type { Profile } from "../db";
import { serverNow } from "../db";
import { fmtDur, titleFromName } from "../shared/audio";
import { cdEnded, connectSpeaker, isScState, speakerOp, watchCdPlayer } from "../cdplayer";
import type { CdState } from "../cdplayer";
import { byRating, chartsOf, cleanTitle, CHARTS_SIZE, SWEEP_EVERY_MS } from "../shared/songs";
import type { Song } from "../shared/songs";

/**
 * SoundCloud, a site on the hideout computer, drawn like the iTunes app of iOS 6 (see the Legacy iOS UI Kit): a dark navigation bar, a dark segmented control, a list with
 * grey section bars and light striped rows, small bevelled LABEL buttons, a mini player with a round progress dial at the bottom. No emoji: the icons are drawn here.
 * The pages are the Charts (the 10 best-rated songs), all the music, your profile (songs, an upload form, beats you bought) and an artist's page. A member can also send a list
 * to the hideout's speaker. The look lives in the sc-* rules of style.css.
 */
export interface ScHandle { dispose(): void }
/** the speaker of the hideout this computer is in: who may use it, and whether there is a boombox to play on */
export interface ScSpeaker { roomId: string; can: () => boolean; hasBox: () => boolean; isOwner: () => boolean }
export interface ScOptions { me: Profile; extra?: () => HTMLElement | null; onChange?: () => void; speaker?: ScSpeaker }

const ICONS: Record<string, string> = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14l10-7zM16 5h3v14h-3z" fill="currentColor"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14L9 12zM5 5h3v14H5z" fill="currentColor"/></svg>',
  loop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h9.5V4l5 4.5-5 4.5v-3H8v3.5H5V9a2 2 0 0 1 2-2zm10 10H7.5v3l-5-4.5L7.5 11v3H16v-3.5h3V15a2 2 0 0 1-2 2z" fill="currentColor"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.6c1.7 0 3.1.9 4 2.3l3.6 5.4c.5.8 1.4 1.3 2.4 1.3H18V13l4 3.5-4 3.5v-2.7h-1.4a5 5 0 0 1-4.1-2.2L8.9 11.1A2.6 2.6 0 0 0 6.6 10H3zm0 10h3.6c1 0 1.9-.4 2.5-1.1l.9-1.1 1.5 2.2-.6.8A5 5 0 0 1 6.6 19H3zm15-12V2.3L22 6l-4 3.5V7h-1.4c-1 0-1.9.5-2.4 1.3l-.4.6L12.2 7l.2-.3A5 5 0 0 1 16.6 5z" fill="currentColor"/></svg>',
  note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V5l11-2v12.5a3 2.6 0 1 1-2-2.4V6.5L11 7.8v9.7A3 2.6 0 1 1 9 17.5z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z" fill="currentColor"/></svg>',
  person: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4h3v6.5H20v3h-6.5V20h-3v-6.5H4v-3h6.5z" fill="currentColor"/></svg>',
  bubble: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.5 3.4 6L4 21l4.6-2.2c1 .3 2.2.4 3.4.4 5.5 0 10-3.6 10-8s-4.5-8-10-8z" fill="currentColor"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 19a4.5 4.5 0 0 1-.7-8.9A6 6 0 0 1 18 9.8 4.6 4.6 0 0 1 17.5 19H14v-4.4l1.8 1.8 1.4-1.4L12 9.8 6.8 15l1.4 1.4L10 14.6V19z" fill="currentColor"/></svg>',
  list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h3v3H4zm5 0h11v3H9zm-5 4.5h3v3H4zm5 0h11v3H9zM4 15h3v3H4zm5 0h11v3H9z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor"/></svg>',
};
export const scIcon = (name: string, cls = ""): HTMLElement => { const s = document.createElement("span"); s.className = `sc-ico ${cls}`.trim(); s.innerHTML = ICONS[name] ?? ""; return s; };

/** the three little bars of a song that is playing */
const eq = (on: boolean): HTMLElement => h("span", { class: "sc-eq" + (on ? " on" : ""), "aria-hidden": "true" }, h("i", {}), h("i", {}), h("i", {}));
/** a bar button of the navigation bar: the arrow-shaped Back button */
export const backButton = (label: string, onclick: () => void): HTMLElement => h("button", { class: "sc-barbtn back", type: "button", onclick }, label);

export function mountSoundcloud(host: HTMLElement, o: ScOptions): ScHandle {
  const me = o.me;
  let tab: "charts" | "all" | "profile" = "charts";
  let artist: string | null = null;
  let songs: Song[] = [];
  let votes: Record<string, number> = {};
  let lastSweep = 0;
  let file: File | null = null;
  let fileMs = 0;
  let title = "";
  let uploading = -1; // -1: not uploading, 0..1: how far
  let disposed = false;
  let spk: CdState | null = null; // SoundCloud on the speaker (the shared state of the room's player)
  let cdBusy = false; // a CD is in the player

  const navTitle = h("div", { class: "sc-nav-title" }, "SoundCloud");
  const navLeft = h("div", { class: "sc-nav-side" });
  const nav = h("div", { class: "sc-nav" }, navLeft, navTitle, h("div", { class: "sc-nav-side" }));
  const segBar = h("div", { class: "sc-segbar" });
  const body = h("div", { class: "sc-body" });
  const scroll = h("div", { class: "sc-scroll" }, body);
  const bar = h("div", { class: "sc-now" });
  const root = h("div", { class: "sc" }, nav, segBar, scroll, bar);
  host.append(root);

  const byNew = (a: Song, b: Song): number => b.at - a.at;
  const mine = (): Song[] => songs.filter((s) => s.owner === me.uid).sort(byNew);
  const nameOf = (uid: string): string => songs.find((s) => s.owner === uid)?.ownerName ?? "Artist";

  // ---- pieces --------------------------------------------------------------------------------------------------------------------------------
  /** the grey bar that heads a list (iTunes: "Title" in white on grey) */
  const section = (t: string): HTMLElement => h("div", { class: "sc-section" }, t);
  /** a line of small grey text under a bar */
  const note = (t: string): HTMLElement => h("div", { class: "sc-note" }, t);
  const empty = (t: string): HTMLElement => h("div", { class: "sc-empty" }, t);
  /** an album tile: the artist's face on a bevelled square */
  const art = (uid: string, big = false): HTMLElement => h("div", { class: "sc-art" + (big ? " big" : "") }, headBoxFor(uid));

  function voteBtn(s: Song, dir: 1 | -1): HTMLElement {
    const on = votes[s.id] === dir;
    const own = s.owner === me.uid;
    return h("button", {
      class: `sc-vote-btn ${dir === 1 ? "up" : "down"}${on ? " on" : ""}`, type: "button", disabled: own, "aria-label": dir === 1 ? "Vote up" : "Vote down", "aria-pressed": String(on),
      title: own ? "You can't vote on your own song" : dir === 1 ? "Vote up" : "Vote down",
      onclick: () => void voteSong(me, s.id, on ? 0 : dir).catch((e) => toast((e as Error).message, "err")),
    }, h("span", { class: "sc-tri" }));
  }
  /** a song: [rank] [tile] title / artist . length / votes [play] */
  function row(s: Song, list: Song[], rank?: number): HTMLElement {
    const playing = scPlayer.current?.id === s.id;
    const going = playing && scPlayer.state.playing;
    return h("div", { class: "sc-row" + (playing ? " playing" : "") },
      rank !== undefined ? h("div", { class: "sc-rank" }, String(rank)) : null,
      art(s.owner),
      h("div", { class: "sc-main" },
        h("div", { class: "sc-title" }, ...(playing ? [eq(going)] : []), h("span", {}, s.title)),
        h("div", { class: "sc-line" }, h("button", { class: "sc-artist", type: "button", onclick: () => { artist = s.owner; render(); } }, s.ownerName), h("span", { class: "sc-meta" }, fmtDur(s.durMs))),
        h("div", { class: "sc-votes" }, voteBtn(s, 1), h("span", { class: "sc-n up" }, String(s.up)), voteBtn(s, -1), h("span", { class: "sc-n down" }, String(s.down)))),
      h("button", { class: "sc-play" + (going ? " on" : ""), type: "button", "aria-label": `Play ${s.title}`, onclick: () => { if (playing) scPlayer.toggle(); else void scPlayer.playList(list, list.indexOf(s)); } }, scIcon(going ? "pause" : "play")));
  }
  const listOf = (rows: HTMLElement[]): HTMLElement => h("div", { class: "sc-list" }, ...rows);
  /** Play / Shuffle (and the same for the speaker): two buttons side by side, like the iTunes Redeem / Send Gift pair */
  const actions = (list: Song[], label: string): HTMLElement => h("div", { class: "sc-panel" },
    h("div", { class: "sc-actions" },
      h("button", { class: "sc-btn wide", type: "button", disabled: !list.length, onclick: () => void scPlayer.playList(list, 0) }, scIcon("play"), `Play ${label}`),
      h("button", { class: "sc-btn wide", type: "button", disabled: !list.length, onclick: () => void scPlayer.playList(list, 0, true) }, scIcon("shuffle"), "Shuffle")),
    ...speakerActions(list));

  // ---- the speaker --------------------------------------------------------------------------------------------------------------------------
  const spkRoom = (): string => o.speaker!.roomId;
  const spkErr = (e: unknown): void => toast((e as Error).message || "That didn't work.", "err");
  async function toSpeaker(list: Song[], shuffle: boolean): Promise<void> {
    const ids = list.map((s) => s.id);
    if (shuffle) for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    scPlayer.stop(); // (it plays on the speaker now, not here)
    try { await connectSpeaker(me, spkRoom(), ids); toast("SoundCloud is on the speaker."); } catch (e) { spkErr(e); }
  }
  /** the two buttons that send a list to the speaker (members only; there has to be a boombox, and nothing else on it) */
  function speakerActions(list: Song[]): HTMLElement[] {
    const sp = o.speaker;
    if (!sp || !sp.can()) return [];
    if (!sp.hasBox()) return [h("div", { class: "sc-hint" }, "This hideout has no speaker yet. Put a boombox in it.")];
    const busy = !!spk || cdBusy;
    return [h("div", { class: "sc-actions" },
      h("button", { class: "sc-btn wide", type: "button", disabled: !list.length || busy, onclick: () => void toSpeaker(list, false) }, scIcon("note"), "Play on speaker"),
      h("button", { class: "sc-btn wide", type: "button", disabled: !list.length || busy, onclick: () => void toSpeaker(list, true) }, scIcon("shuffle"), "Shuffle on speaker")),
    ...(busy ? [h("div", { class: "sc-hint" }, spk ? `${spk.byName} has SoundCloud on the speaker.` : "A CD is in the speaker.")] : [])];
  }
  /** what is on the speaker right now (everybody in the room sees it; members get the buttons) */
  function speakerPanel(): HTMLElement[] {
    const sp = o.speaker;
    if (!sp || !spk) return [];
    const s = spk;
    const member = sp.can();
    const boss = s.by === me.uid || sp.isOwner();
    const btn = (icon: string, label: string, fn: () => Promise<unknown>, on = false): HTMLElement => h("button", { class: "sc-cbtn" + (on ? " on" : ""), type: "button", "aria-label": label, title: label, onclick: () => void fn().catch(spkErr) }, scIcon(icon));
    return [h("div", { class: "sc-speaker" },
      h("div", { class: "sc-speaker-top" }, h("div", { class: "sc-speaker-ico" }, scIcon("note")), h("div", { class: "sc-now-text" }, h("small", {}, "On the speaker"), h("b", {}, s.title), h("small", {}, `Connected by ${s.byName}`))),
      member ? h("div", { class: "sc-ctrl" },
        btn("prev", "Previous", () => speakerOp(me, spkRoom(), "prev", { from: s.index ?? 0 })),
        btn(s.pausedAt ? "play" : "pause", s.pausedAt ? "Play" : "Pause", () => speakerOp(me, spkRoom(), s.pausedAt ? "play" : "pause")),
        btn("next", "Next", () => speakerOp(me, spkRoom(), "next", { from: s.index ?? 0 })),
        ...(boss ? [btn("loop", "Loop this song", () => speakerOp(me, spkRoom(), "loop", { on: !s.loop }), !!s.loop),
          h("button", { class: "sc-btn danger small", type: "button", onclick: () => void speakerOp(me, spkRoom(), "disconnect").then(() => toast("Disconnected."), spkErr) }, "Disconnect")] : [])) : null)];
  }

  // ---- the pages ----------------------------------------------------------------------------------------------------------------------------
  function charts(): HTMLElement[] {
    const top = chartsOf(songs);
    const next = lastSweep ? lastSweep + SWEEP_EVERY_MS : 0;
    const mins = next ? Math.max(1, Math.ceil((next - serverNow()) / 60000)) : 0;
    return [
      section("Charts"),
      note(`The ${CHARTS_SIZE} best rated songs. Every hour the worst quarter of all songs is taken off${mins ? ` (next clean-up in ${mins} min)` : ""}.`),
      actions(top, "charts"),
      ...(top.length ? [listOf(top.map((s, i) => row(s, top, i + 1)))] : [empty("No songs yet. Upload the first one on your profile.")]),
    ];
  }
  function allMusic(): HTMLElement[] {
    const list = [...songs].sort(byNew);
    return [
      section("All music"),
      note(`Songs: ${list.length}. Artists: ${new Set(list.map((s) => s.owner)).size}. Newest first. Tap a name to see an artist.`),
      actions(list, "all"),
      ...(list.length ? [listOf(list.map((s) => row(s, list)))] : [empty("Nothing here yet.")]),
    ];
  }
  function artistPage(uid: string): HTMLElement[] {
    const list = songs.filter((s) => s.owner === uid).sort(byRating);
    return [
      h("div", { class: "sc-profilehead" }, art(uid, true), h("div", { class: "sc-ph-text" }, h("div", { class: "sc-ph-name" }, nameOf(uid)), h("div", { class: "sc-ph-sub" }, `Songs: ${list.length}, best rated first`))),
      actions(list, "artist"),
      ...(list.length ? [listOf(list.map((s) => row(s, list)))] : [empty("This artist has no songs on SoundCloud right now.")]),
    ];
  }
  function profile(): HTMLElement[] {
    const my = mine();
    const left = SONG_SLOTS - my.length;
    const fileIn = h("input", { type: "file", accept: "audio/*", class: "sc-file", "aria-label": "Choose a song file", onchange: async () => {
      const f = fileIn.files?.[0];
      if (!f) return;
      const r = await checkSongFile(f);
      if ("error" in r) { toast(r.error, "err"); fileIn.value = ""; return; }
      file = f; fileMs = r.durMs; if (!title) title = cleanTitle(titleFromName(f.name));
      render();
    } }) as HTMLInputElement;
    const titleIn = h("input", { class: "sc-field", type: "text", maxlength: "40", placeholder: "Song title", value: title, "aria-label": "Song title", oninput: () => { title = titleIn.value; } }) as HTMLInputElement;
    const go = h("button", { class: "sc-btn blue wide", type: "button", disabled: !file || uploading >= 0 || left <= 0, onclick: async () => {
      if (!file) return;
      uploading = 0; render();
      try {
        await uploadSong(me, file, title, fileMs, (f) => { uploading = f; paintProgress(); });
        toast("Your song is on SoundCloud.");
        file = null; title = ""; fileMs = 0;
      } catch (err) { toast((err as Error).message || "The upload failed.", "err"); }
      uploading = -1; render();
    } }, uploading >= 0 ? "Uploading" : "Upload");
    const prog = h("div", { class: "sc-prog", hidden: uploading < 0 }, h("i", { style: { width: `${Math.round(Math.max(0, uploading) * 100)}%` } }));
    function paintProgress(): void { (prog.firstElementChild as HTMLElement).style.width = `${Math.round(uploading * 100)}%`; }
    return [
      h("div", { class: "sc-profilehead" }, art(me.uid, true), h("div", { class: "sc-ph-text" }, h("div", { class: "sc-ph-name" }, me.name), h("div", { class: "sc-ph-sub" }, `${my.length} of ${SONG_SLOTS} songs on SoundCloud`))),
      section("Upload a song"),
      h("div", { class: "sc-linen" },
        note(left > 0 ? "A song is an mp3, wav, ogg or m4a up to 4 MB and 3 minutes. It gets votes from everybody, and the worst rated ones are taken off every hour." : `You have ${SONG_SLOTS} songs up. Take one off to upload another.`),
        h("div", { class: "sc-group" },
          h("div", { class: "sc-grow" }, h("span", { class: "sc-glabel" }, file ? file.name.slice(0, 22) : "No file chosen"), h("button", { class: "sc-btn", type: "button", disabled: left <= 0 || uploading >= 0, onclick: () => fileIn.click() }, file ? "Another file" : "Choose a file"), fileIn),
          h("div", { class: "sc-grow" }, titleIn),
          ...(file ? [h("div", { class: "sc-grow" }, h("span", { class: "sc-glabel" }, "Length"), h("span", { class: "sc-gvalue" }, fmtDur(fileMs)))] : [])),
        go, prog),
      section("Your songs"),
      my.length ? listOf(my.map((s) => h("div", { class: "sc-mine" }, row(s, my), h("button", { class: "sc-btn danger small", type: "button", onclick: () => { if (window.confirm(`Take "${s.title}" off SoundCloud? Its votes are lost.`)) void deleteSong(me, s.id).then(() => toast("Taken off."), (e) => toast((e as Error).message, "err")); } }, "Take off")))) : empty("You haven't uploaded anything yet."),
      section("Owned beats"),
      ownedList.length ? ownedBeats() : empty("Beats you buy from a BeatShop show up here with a download button."),
    ];
  }
  /** the beats this player bought from BeatShops: they stay here for good, with a download button */
  let ownedList: OwnedBeat[] = [];
  const ownedBeats = (): HTMLElement => listOf(ownedList.map((b) => h("div", { class: "sc-row" },
    art(b.owner),
    h("div", { class: "sc-main" }, h("div", { class: "sc-title" }, h("span", {}, b.title)), h("div", { class: "sc-line" }, h("span", { class: "sc-meta" }, b.ownerName), h("span", { class: "sc-meta" }, fmtDur(b.durMs)))),
    h("button", { class: "sc-btn green small", type: "button", onclick: () => void downloadBeat(b).then(() => toast("The beat is saved."), (e) => toast((e as Error).message || "That didn't work.", "err")) }, scIcon("cloud"), "Download"))));

  // ---- the whole page -----------------------------------------------------------------------------------------------------------------------
  function seg(): HTMLElement {
    const t = (id: typeof tab, label: string): HTMLElement => h("button", { class: "sc-seg-btn" + (!artist && tab === id ? " on" : ""), type: "button", onclick: () => { tab = id; artist = null; render(); } }, label);
    return h("div", { class: "sc-seg", role: "tablist" }, t("charts", "Charts"), t("all", "All music"), t("profile", "Profile"));
  }
  function render(): void {
    if (disposed) return;
    const keep = scroll.scrollTop;
    const hasInput = document.activeElement instanceof HTMLInputElement && body.contains(document.activeElement);
    if (hasInput && tab === "profile" && uploading < 0) return; // (don't rebuild the page while somebody is typing the title)
    navTitle.textContent = artist ? nameOf(artist) : "SoundCloud";
    navLeft.replaceChildren(...(artist ? [backButton("Back", () => { artist = null; render(); })] : []));
    segBar.replaceChildren(seg());
    body.replaceChildren(...speakerPanel(), ...(artist ? artistPage(artist) : tab === "charts" ? charts() : tab === "all" ? allMusic() : profile()), ...(o.extra?.() ? [o.extra()!] : []));
    scroll.scrollTop = keep;
    paintBar();
  }
  /** the mini player: a round dial that fills as the song plays, the song, and small dark buttons */
  function paintBar(): void {
    const st = scPlayer.state, cur = scPlayer.current;
    bar.hidden = !cur;
    if (!cur) { bar.replaceChildren(); return; }
    const frac = st.duration > 0 ? Math.min(1, st.position / st.duration) : 0;
    const prog = h("div", { class: "sc-seek", role: "slider", "aria-label": "Position", onclick: (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); scPlayer.seek((e.clientX - r.left) / r.width); } }, h("i", { style: { width: `${Math.round(frac * 100)}%` } }));
    const dial = h("button", { class: "sc-donut", type: "button", "aria-label": st.playing ? "Pause" : "Play", style: { "--p": `${Math.round(frac * 360)}deg` }, onclick: () => scPlayer.toggle() }, h("span", { class: "sc-donut-in" }, scIcon(st.playing ? "pause" : "play")));
    const small = (icon: string, label: string, fn: () => void, on = false): HTMLElement => h("button", { class: "sc-cbtn" + (on ? " on" : ""), type: "button", "aria-label": label, "aria-pressed": on ? "true" : null, title: label, onclick: fn }, scIcon(icon));
    bar.replaceChildren(
      h("div", { class: "sc-now-top" },
        dial,
        h("div", { class: "sc-now-text" }, h("b", {}, cur.title), h("small", {}, st.error || (st.loading ? "Loading" : cur.ownerName))),
        h("div", { class: "sc-ctrl" },
          small("prev", "Previous", () => void scPlayer.prev()),
          small("next", "Next", () => void scPlayer.next()),
          small("loop", "Loop this song", () => scPlayer.setLoop(!st.loop), st.loop),
          small("shuffle", "Shuffle", () => { const q = st.queue; if (q.length) void scPlayer.playList(q, st.index, !st.shuffle); }, st.shuffle))),
      prog,
      h("div", { class: "sc-times" }, h("span", {}, fmtDur(st.position)), h("span", {}, fmtDur(st.duration))));
  }

  const stops = [
    watchSongs((l) => { songs = l; render(); }),
    watchMyVotes(me.uid, (v) => { votes = v; render(); }),
    watchOwnedBeats(me.uid, (l) => { ownedList = l; if (tab === "profile") render(); }),
    onValue(ref(db, "songMeta/lastSweep"), (s) => { lastSweep = Number(s.val()) || 0; if (tab === "charts") render(); }, () => undefined),
  ];
  if (o.speaker) stops.push(watchCdPlayer(o.speaker.roomId, (st) => { spk = isScState(st) && st && !cdEnded(st) ? st : null; cdBusy = !!st && !isScState(st) && !cdEnded(st); render(); }));
  let lastIndex = scPlayer.state.index, lastPlaying = scPlayer.state.playing;
  stops.push(scPlayer.subscribe(() => {
    const st = scPlayer.state;
    if (st.index !== lastIndex || st.playing !== lastPlaying) { lastIndex = st.index; lastPlaying = st.playing; render(); } else paintBar();
  }));
  void sweepSongs(me).catch(() => undefined); // (the hourly clean-up: does nothing until the hour is up)
  render();
  return { dispose(): void { disposed = true; stops.forEach((s) => s()); scPlayer.stop(); root.remove(); } };
}
