// The page that is left of the site after the surprise: a text the admin writes, the leaderboard (who had the most blood) and a music player (every song uploaded to the game: the CDs and
// everything on SoundCloud, minus the songs the admin has hidden). It needs no login: public/finale is readable by anybody (see the rules), and so are the song files while it is on.
// The admin (and emil) see an editor on it from the /event panel: the text, hiding and showing songs, and making the leaderboard and the song list again.
import { onValue, ref, set } from "firebase/database";
import { db } from "../firebase";
import { call } from "../db";
import type { Profile } from "../db";
import { audioUrl } from "../audio";
import { assetUrl } from "../assetUrl";
import { OGEP_TRACKS } from "../shared/cds";
import { BLOOD_ICON } from "../items";
import { h, toast } from "./dom";
import type { Finale } from "../shared/event";

/** the key a song is hidden under (the database does not allow . # $ [ ] / in a key) */
const hk = (key: string): string => key.replace(/[.#$\[\]/]/g, "_");

interface Track { key: string; title: string; by: string; src: () => Promise<string> }

/** the songs that are files of the game: the community EP's (the album and the three mystery CDs are not on the page: they are the album) */
const cdTracks = (): Track[] => {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const t of OGEP_TRACKS) {
    const file = t.file ?? `album-${t.id}.mp3`;
    if (seen.has(file)) continue;
    seen.add(file);
    out.push({ key: `cd:${t.id}`, title: t.title, by: t.by, src: () => Promise.resolve(assetUrl(`music/${file}`)) });
  }
  return out;
};

export interface FinaleOptions {
  /** the admin / emil: the editor is shown */
  staff?: Profile;
  /** a "back" button (the /event panel's preview and the editor); the real page has none */
  onBack?: () => void;
}

export function mountFinale(host: HTMLElement, o: FinaleOptions = {}): () => void {
  let data: Finale = {};
  let stopped = false;
  const audio = new Audio();
  audio.preload = "auto";
  let queue: Track[] = [];
  let at = -1;

  const textEl = h("div", { class: "fin-text" });
  const board = h("div", { class: "fin-board" });
  const songsEl = h("div", { class: "fin-songs" });
  const nowEl = h("div", { class: "fin-now" }, "Pick a song");
  const bar = h("input", { type: "range", min: "0", max: "1000", value: "0", class: "fin-seek", "aria-label": "Seek", oninput: (e: Event) => { if (Number.isFinite(audio.duration)) audio.currentTime = (Number((e.target as HTMLInputElement).value) / 1000) * audio.duration; } }) as HTMLInputElement;
  const playBtn = h("button", { class: "btn small", type: "button", onclick: () => { if (audio.paused) void audio.play().catch(() => undefined); else audio.pause(); } }, "▶");
  const prevBtn = h("button", { class: "btn small", type: "button", onclick: () => void step(-1) }, "⏮");
  const nextBtn = h("button", { class: "btn small", type: "button", onclick: () => void step(1) }, "⏭");
  audio.addEventListener("play", () => { playBtn.textContent = "⏸"; });
  audio.addEventListener("pause", () => { playBtn.textContent = "▶"; });
  audio.addEventListener("ended", () => void step(1));
  audio.addEventListener("timeupdate", () => { if (Number.isFinite(audio.duration) && audio.duration > 0) bar.value = String(Math.round((audio.currentTime / audio.duration) * 1000)); });

  async function playAt(i: number): Promise<void> {
    const t = queue[i];
    if (!t) return;
    at = i;
    nowEl.textContent = `${t.title} · ${t.by}`;
    try { audio.src = await t.src(); await audio.play(); } catch (err) { nowEl.textContent = `${t.title}: ${(err as Error).message || "couldn't play"}`; }
    paintSongs();
  }
  async function step(d: number): Promise<void> { if (queue.length) await playAt((at + d + queue.length) % queue.length); }

  const visibleSongs = (): Track[] => {
    const hidden = data.hidden ?? {};
    const sc: Track[] = (data.songs ?? []).filter((s) => !hidden[hk(`sc:${s.id}`)]).map((s) => ({ key: `sc:${s.id}`, title: s.title, by: s.by, src: () => audioUrl(s.id, s.pieces, s.mime) }));
    return [...cdTracks().filter((t) => !hidden[hk(t.key)]), ...sc];
  };

  function paintSongs(): void {
    const hidden = data.hidden ?? {};
    const all: Track[] = [...cdTracks(), ...(data.songs ?? []).map((s) => ({ key: `sc:${s.id}`, title: s.title, by: s.by, src: () => audioUrl(s.id, s.pieces, s.mime) }))];
    const shown = o.staff ? all : all.filter((t) => !hidden[hk(t.key)]);
    queue = visibleSongs();
    songsEl.replaceChildren(...shown.map((t) => {
      const isHidden = !!hidden[hk(t.key)];
      const idx = queue.findIndex((q) => q.key === t.key);
      return h("div", { class: "fin-song" + (idx === at && idx >= 0 ? " on" : "") + (isHidden ? " hidden-song" : "") },
        h("button", { class: "fin-play", type: "button", disabled: isHidden, onclick: () => void playAt(idx) }, "▶"),
        h("div", { class: "fin-song-main" }, h("b", {}, t.title), h("small", {}, t.by)),
        o.staff ? h("button", { class: "btn small", type: "button", onclick: () => void set(ref(db, `public/finale/hidden/${hk(t.key)}`), isHidden ? null : true).catch((e) => toast((e as Error).message, "err")) }, isHidden ? "Show" : "Hide") : null);
    }));
  }

  function paint(): void {
    const text = (data.text ?? "").trim();
    textEl.replaceChildren(...(text ? text.split(/\n+/).map((l) => h("p", {}, l)) : [])); // (nothing there until the admin writes something)
    const rows = data.board ?? [];
    board.replaceChildren(
      ...(rows.length ? rows.slice(0, 50).map((r, i) => h("div", { class: "fin-row" }, h("span", { class: "fin-rank" }, String(i + 1)), h("span", { class: "fin-name" }, r.name), h("span", { class: "fin-blood" }, h("img", { src: BLOOD_ICON, alt: "" }), r.blood.toLocaleString("da-DK")))) : [h("div", { class: "hint" }, "—")]));
    paintSongs();
  }

  const stop = onValue(ref(db, "public/finale"), (s) => { data = (s.val() ?? {}) as Finale; if (!stopped) paint(); }, () => paint());

  // ---- the editor (the admin and emil) ----
  let editor: HTMLElement | null = null;
  if (o.staff) {
    const area = h("textarea", { class: "fin-area", rows: "5", placeholder: "The text on the page (a blank line starts a new paragraph)" }) as HTMLTextAreaElement;
    area.value = "";
    let filled = false;
    const filler = onValue(ref(db, "public/finale/text"), (s) => { if (!filled) { filled = true; area.value = typeof s.val() === "string" ? String(s.val()) : ""; } }, () => undefined);
    editor = h("div", { class: "fin-editor" },
      h("div", { class: "hint" }, "Only you see this box. The songs below can be hidden or shown (hidden songs are gone from the page and its player)."),
      area,
      h("div", { class: "fin-erow" },
        h("button", { class: "btn small primary", type: "button", onclick: () => void set(ref(db, "public/finale/text"), area.value.slice(0, 2000)).then(() => toast("The text is saved."), (e) => toast((e as Error).message, "err")) }, "Save the text"),
        h("button", { class: "btn small", type: "button", onclick: () => void call<{ board: number; songs: number }>(o.staff!, "eventFinaleRefresh").then((r) => toast(`Made again: ${r.board} on the leaderboard, ${r.songs} songs.`), (e) => toast((e as Error).message, "err")) }, "Make the leaderboard and song list again")));
    (editor as unknown as { _off: () => void })._off = filler;
  }

  const root = h("div", { class: "fin" },
    h("header", { class: "navbar fin-navbar" },
      h("div", { class: "nav-left" }, o.onBack ? h("button", { class: "btn small", type: "button", onclick: () => o.onBack!() }, "‹ Back") : h("span", {})),
      h("div", { class: "nav-logo" }, "Blodig oktober"),
      h("span", {})),
    h("div", { class: "fin-scroll" }, h("div", { class: "fin-inner" },
      textEl,
      editor,
      h("div", { class: "fin-cols" },
        h("div", { class: "group-title" }, "Mest blod"), board,
        h("div", { class: "group-title" }, "Musik"),
        h("div", { class: "fin-player" }, h("div", { class: "fin-bar" }, prevBtn, playBtn, nextBtn, nowEl), bar, songsEl)))));
  host.append(root);
  paint();

  return () => {
    stopped = true;
    stop();
    (editor as unknown as { _off?: () => void } | null)?._off?.();
    audio.pause();
    audio.removeAttribute("src");
    root.remove();
  };
}
