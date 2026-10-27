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
 * SoundCloud, a site on the hideout computer (iOS 6 look, no emoji): the Charts (the 10 best-rated songs), all the music, your profile with your songs and an upload form, and an
 * artist's page. Every song has up and down votes, a play button and a face for the artist. The player plays a list in order, shuffled, or one song on loop.
 * `extra` is where the speaker connection goes (members get a Connect button there).
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
};
export const scIcon = (name: string, cls = ""): HTMLElement => { const s = document.createElement("span"); s.className = `sc-ico ${cls}`.trim(); s.innerHTML = ICONS[name] ?? ""; return s; };

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

  const body = h("div", { class: "sc-body" });
  const bar = h("div", { class: "sc-now" });
  const root = h("div", { class: "sc" }, body, bar);
  host.append(root);

  const byNew = (a: Song, b: Song): number => b.at - a.at;
  const mine = (): Song[] => songs.filter((s) => s.owner === me.uid).sort(byNew);
  const nameOf = (uid: string): string => songs.find((s) => s.owner === uid)?.ownerName ?? "Artist";

  // ---- a row for a song ---------------------------------------------------------------------------------------------------------------------
  function voteBtn(s: Song, dir: 1 | -1): HTMLElement {
    const on = votes[s.id] === dir;
    const own = s.owner === me.uid;
    return h("button", {
      class: `sc-vote-btn ${dir === 1 ? "up" : "down"}${on ? " on" : ""}`, type: "button", disabled: own, "aria-label": dir === 1 ? "Vote up" : "Vote down", "aria-pressed": String(on),
      title: own ? "You can't vote on your own song" : dir === 1 ? "Vote up" : "Vote down",
      onclick: () => void voteSong(me, s.id, on ? 0 : dir).catch((e) => toast((e as Error).message, "err")),
    }, h("span", { class: "sc-tri" }));
  }
  function row(s: Song, list: Song[], rank?: number): HTMLElement {
    const playing = scPlayer.current?.id === s.id;
    return h("div", { class: "sc-row" + (playing ? " playing" : "") },
      rank !== undefined ? h("div", { class: "sc-rank" }, String(rank)) : null,
      headBoxFor(s.owner),
      h("div", { class: "sc-main" },
        h("div", { class: "sc-title" }, s.title),
        h("div", { class: "sc-line" }, h("button", { class: "sc-artist", type: "button", onclick: () => { artist = s.owner; render(); } }, s.ownerName), h("span", { class: "sc-meta" }, fmtDur(s.durMs))),
        h("div", { class: "sc-votes" }, voteBtn(s, 1), h("span", { class: "sc-n up" }, String(s.up)), voteBtn(s, -1), h("span", { class: "sc-n down" }, String(s.down)))),
      h("button", { class: "sc-play" + (playing && scPlayer.state.playing ? " on" : ""), type: "button", "aria-label": `Play ${s.title}`, onclick: () => { if (playing) scPlayer.toggle(); else void scPlayer.playList(list, list.indexOf(s)); } }, scIcon(playing && scPlayer.state.playing ? "pause" : "play")));
  }
  const empty = (t: string): HTMLElement => h("div", { class: "sc-empty" }, t);
  const actions = (list: Song[], label: string): HTMLElement => h("div", { class: "sc-actions-wrap" },
    h("div", { class: "sc-actions" },
      h("button", { class: "sc-btn", type: "button", disabled: !list.length, onclick: () => void scPlayer.playList(list, 0) }, scIcon("play"), `Play ${label}`),
      h("button", { class: "sc-btn", type: "button", disabled: !list.length, onclick: () => void scPlayer.playList(list, 0, true) }, scIcon("shuffle"), "Shuffle")),
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
    if (!sp.hasBox()) return [h("div", { class: "sc-sub dark" }, "This hideout has no speaker yet. Put a boombox in it.")];
    const busy = !!spk || cdBusy;
    return [h("div", { class: "sc-actions" },
      h("button", { class: "sc-btn", type: "button", disabled: !list.length || busy, onclick: () => void toSpeaker(list, false) }, scIcon("note"), "Play on speaker"),
      h("button", { class: "sc-btn", type: "button", disabled: !list.length || busy, onclick: () => void toSpeaker(list, true) }, scIcon("shuffle"), "Shuffle on speaker")),
    ...(busy ? [h("div", { class: "sc-sub dark" }, spk ? `${spk.byName} has SoundCloud on the speaker.` : "A CD is in the speaker.")] : [])];
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
      h("div", { class: "sc-speaker-top" }, scIcon("note"), h("div", { class: "sc-now-text" }, h("small", {}, "On the speaker"), h("b", {}, s.title), h("small", {}, `Connected by ${s.byName}`))),
      member ? h("div", { class: "sc-ctrl" },
        btn("prev", "Previous", () => speakerOp(me, spkRoom(), "prev", { from: s.index ?? 0 })),
        btn(s.pausedAt ? "play" : "pause", s.pausedAt ? "Play" : "Pause", () => speakerOp(me, spkRoom(), s.pausedAt ? "play" : "pause")),
        btn("next", "Next", () => speakerOp(me, spkRoom(), "next", { from: s.index ?? 0 })),
        ...(boss ? [btn("loop", "Loop this song", () => speakerOp(me, spkRoom(), "loop", { on: !s.loop }), !!s.loop),
          h("button", { class: "sc-btn danger", type: "button", onclick: () => void speakerOp(me, spkRoom(), "disconnect").then(() => toast("Disconnected."), spkErr) }, "Disconnect")] : [])) : null)];
  }

  // ---- the pages ----------------------------------------------------------------------------------------------------------------------------
  function charts(): HTMLElement[] {
    const top = chartsOf(songs);
    const next = lastSweep ? lastSweep + SWEEP_EVERY_MS : 0;
    const mins = next ? Math.max(1, Math.ceil((next - serverNow()) / 60000)) : 0;
    return [
      h("div", { class: "sc-head" }, h("div", { class: "sc-h1" }, "Charts"), h("div", { class: "sc-sub" }, `The ${CHARTS_SIZE} best rated songs. Every hour the worst quarter of all songs is taken off${mins ? ` (next clean-up in ${mins} min)` : ""}.`)),
      actions(top, "charts"),
      ...(top.length ? top.map((s, i) => row(s, top, i + 1)) : [empty("No songs yet. Upload the first one on your profile.")]),
    ];
  }
  function allMusic(): HTMLElement[] {
    const list = [...songs].sort(byNew);
    return [
      h("div", { class: "sc-head" }, h("div", { class: "sc-h1" }, "All music"), h("div", { class: "sc-sub" }, `Songs: ${list.length}. Artists: ${new Set(list.map((s) => s.owner)).size}. Newest first. Tap a name to see an artist.`)),
      actions(list, "all"),
      ...(list.length ? list.map((s) => row(s, list)) : [empty("Nothing here yet.")]),
    ];
  }
  function artistPage(uid: string): HTMLElement[] {
    const list = songs.filter((s) => s.owner === uid).sort(byRating);
    return [
      h("button", { class: "sc-back", type: "button", onclick: () => { artist = null; render(); } }, h("span", { class: "sc-back-tri" }), "Back"),
      h("div", { class: "sc-artistcard" }, headBoxFor(uid), h("div", {}, h("div", { class: "sc-h1" }, nameOf(uid)), h("div", { class: "sc-sub" }, `Songs: ${list.length}, best rated first`))),
      actions(list, "artist"),
      ...(list.length ? list.map((s) => row(s, list)) : [empty("This artist has no songs on SoundCloud right now.")]),
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
    const titleIn = h("input", { class: "hc-input", type: "text", maxlength: "40", placeholder: "Song title", value: title, "aria-label": "Song title", oninput: () => { title = titleIn.value; } }) as HTMLInputElement;
    const go = h("button", { class: "sc-btn primary", type: "button", disabled: !file || uploading >= 0 || left <= 0, onclick: async () => {
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
      h("div", { class: "sc-profile" }, headBoxFor(me.uid), h("div", {}, h("div", { class: "sc-h1" }, me.name), h("div", { class: "sc-sub" }, `${my.length} of ${SONG_SLOTS} songs on SoundCloud`))),
      h("div", { class: "hc-group sc-upload" },
        h("div", { class: "hc-label" }, "Upload a song"),
        h("div", { class: "sc-sub dark" }, left > 0 ? "A song is an mp3, wav, ogg or m4a up to 4 MB and 3 minutes. It gets votes from everybody, and the worst rated ones are taken off every hour." : `You have ${SONG_SLOTS} songs up. Take one off to upload another.`),
        h("div", { class: "sc-filerow" }, h("button", { class: "sc-btn", type: "button", disabled: left <= 0 || uploading >= 0, onclick: () => fileIn.click() }, file ? "Another file" : "Choose a file"), h("span", { class: "sc-sub dark" }, file ? `${file.name.slice(0, 30)} - ${fmtDur(fileMs)}` : "No file chosen"), fileIn),
        titleIn, go, prog),
      h("div", { class: "sc-h2" }, "Your songs"),
      ...(my.length ? my.map((s) => h("div", { class: "sc-mine" }, row(s, my), h("button", { class: "sc-btn danger", type: "button", onclick: () => { if (window.confirm(`Take "${s.title}" off SoundCloud? Its votes are lost.`)) void deleteSong(me, s.id).then(() => toast("Taken off."), (e) => toast((e as Error).message, "err")); } }, "Take off"))) : [empty("You haven't uploaded anything yet.")]),
      h("div", { class: "sc-h2" }, "Owned beats"),
      ...(ownedBeats().length ? ownedBeats() : [empty("Beats you buy from a BeatShop show up here with a download button.")]),
    ];
  }
  /** the beats this player bought from BeatShops: they stay here for good, with a download button */
  let ownedList: OwnedBeat[] = [];
  const ownedBeats = (): HTMLElement[] => ownedList.map((b) => h("div", { class: "sc-row" },
    headBoxFor(b.owner),
    h("div", { class: "sc-main" }, h("div", { class: "sc-title" }, b.title), h("div", { class: "sc-line" }, h("span", { class: "sc-meta" }, b.ownerName), h("span", { class: "sc-meta" }, fmtDur(b.durMs)))),
    h("button", { class: "sc-btn green", type: "button", onclick: () => void downloadBeat(b).then(() => toast("The beat is saved."), (e) => toast((e as Error).message || "That didn't work.", "err")) }, "Download")));

  // ---- the whole page -----------------------------------------------------------------------------------------------------------------------
  function seg(): HTMLElement {
    const t = (id: typeof tab, label: string): HTMLElement => h("button", { class: "sc-seg-btn" + (!artist && tab === id ? " on" : ""), type: "button", onclick: () => { tab = id; artist = null; render(); } }, label);
    return h("div", { class: "sc-seg", role: "tablist" }, t("charts", "Charts"), t("all", "All music"), t("profile", "Profile"));
  }
  function render(): void {
    if (disposed) return;
    const keep = body.parentElement?.parentElement?.scrollTop ?? 0;
    const hasInput = document.activeElement instanceof HTMLInputElement && body.contains(document.activeElement);
    if (hasInput && tab === "profile" && uploading < 0) return; // (don't rebuild the page while somebody is typing the title)
    body.replaceChildren(seg(), ...speakerPanel(), ...(artist ? artistPage(artist) : tab === "charts" ? charts() : tab === "all" ? allMusic() : profile()), ...(o.extra?.() ? [o.extra()!] : []));
    if (body.parentElement?.parentElement) body.parentElement.parentElement.scrollTop = keep;
    paintBar();
  }
  function paintBar(): void {
    const st = scPlayer.state, cur = scPlayer.current;
    bar.hidden = !cur;
    if (!cur) { bar.replaceChildren(); return; }
    const frac = st.duration > 0 ? Math.min(1, st.position / st.duration) : 0;
    const prog = h("div", { class: "sc-seek", role: "slider", "aria-label": "Position", onclick: (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); scPlayer.seek((e.clientX - r.left) / r.width); } }, h("i", { style: { width: `${Math.round(frac * 100)}%` } }));
    bar.replaceChildren(
      h("div", { class: "sc-now-top" },
        h("div", { class: "sc-now-text" }, h("b", {}, cur.title), h("small", {}, st.error || (st.loading ? "Loading" : cur.ownerName))),
        h("div", { class: "sc-ctrl" },
          h("button", { class: "sc-cbtn", type: "button", "aria-label": "Previous", onclick: () => void scPlayer.prev() }, scIcon("prev")),
          h("button", { class: "sc-cbtn big", type: "button", "aria-label": st.playing ? "Pause" : "Play", onclick: () => scPlayer.toggle() }, scIcon(st.playing ? "pause" : "play")),
          h("button", { class: "sc-cbtn", type: "button", "aria-label": "Next", onclick: () => void scPlayer.next() }, scIcon("next")),
          h("button", { class: "sc-cbtn" + (st.loop ? " on" : ""), type: "button", "aria-label": "Loop this song", "aria-pressed": String(st.loop), title: "Loop this song", onclick: () => scPlayer.setLoop(!st.loop) }, scIcon("loop")),
          h("button", { class: "sc-cbtn" + (st.shuffle ? " on" : ""), type: "button", "aria-label": "Shuffle", "aria-pressed": String(st.shuffle), title: "Shuffle", onclick: () => { const q = st.queue; if (q.length) void scPlayer.playList(q, st.index, !st.shuffle); } }, scIcon("shuffle")))),
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
