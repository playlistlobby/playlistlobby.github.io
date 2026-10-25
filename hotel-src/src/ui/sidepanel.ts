import { h } from "./dom";
import { showMenu, MenuOption } from "./contextMenu";
import { BLOOD_ICON, combine, findSlot, INV_SIZE, itemDef, ITEMS, MUSIC_ACCESS_KEY, onFurniIcon } from "../items";
import { playSfx } from "../sfx";
import { EMOTES, hasEmote } from "../emotes";
import { assetUrl } from "../assetUrl";
import { isLaced, NO_DROP } from "../shared/items";
import { fmtTime, player, TRACKS } from "../music";
import type { Ctx } from "../main";

type Tab = "inventory" | "emotes" | "music" | "room";

export interface PanelApi {
  setSelected(slot: number | null): void;
  /** the introduction points at one pocket item: opens the inventory and makes that slot glow (null = stop) */
  guide(slot: number | number[] | null): void;
  /** call after the profile changed (inventory, blood, stab status) */
  refresh(): void;
  dispose(): void;
}

export interface PanelOpts {
  say(text: string, kind?: "game" | "warn"): void;
  onSelect(slot: number | null): void;
  onEmote(id: string): void;
  /** an item that is used on yourself with one click (the syringe) */
  onUseSelf(what: "syringe" | "smoke" | "pill" | "eat" | "consume", slot: number): void;
  /** one pocket item used on another (weed + paper, ...) */
  onCombine(a: number, b: number): void;
  /** a pocket item was tapped: return true if something else (the mixer, 6ixty's window) took the tap */
  slotTap?(slot: number): boolean;
  /** Drop mode: an item was picked to be put on the floor */
  onDropPick(slot: number): void;
  /** an extra tab (player rooms get a "Room" tab); `mount` fills the body and returns a cleanup */
  roomTab?: { icon: string; title: string; mount(container: HTMLElement): () => void };
}

function untilText(ms: number): string {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

/** OSRS-style side panel: stone tabs on top, 4x7 inventory grid, music tab. */
export function mountSidePanel(root: HTMLElement, ctx: Ctx, opts: PanelOpts): PanelApi {
  const profile = ctx.profile;
  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
  let tab: Tab = "inventory";
  /** on phones the panel starts as a bare tab strip; tapping the open tab again folds it away */
  let collapsed = isMobile();
  let selected: number | null = null;
  let guided: number[] = [];
  /** the red Drop button was pressed: every item glows and tapping one asks to drop it */
  let dropMode = false;
  let unsubMusic: (() => void) | null = null;
  let roomCleanup: (() => void) | null = null;

  const tabsEl = h("div", { class: "osrs-tabs" });
  const body = h("div", { class: "osrs-body" });
  const panel = h("aside", { class: "osrs-panel" }, tabsEl, body);
  root.append(panel);

  function renderTabs(): void {
    const mk = (id: Tab, icon: string, title: string) =>
      h("button", { class: "osrs-tab" + (tab === id && !collapsed ? " on" : ""), title, onclick: () => {
        if (isMobile() && tab === id) collapsed = !collapsed;
        else { tab = id; collapsed = false; }
        dropMode = false;
        render();
      } }, h("img", { class: "tab-ico", src: /\.png$/.test(icon) ? icon : "", alt: title, draggable: false }));
    tabsEl.replaceChildren(
      mk("inventory", assetUrl("osrs/tab_inventory.png"), "Inventory"),
      mk("emotes", assetUrl("osrs/tab_emotes.png"), "Emotes"),
      ...(opts.roomTab ? [mk("room", opts.roomTab.icon, opts.roomTab.title)] : []));
  }

  // ---- emotes --------------------------------------------------------------------------
  function renderEmotes(): void {
    const grid = h("div", { class: "emote-grid" },
      ...EMOTES.map((e) => {
        const owned = hasEmote(profile, e.id);
        return h("button", {
          class: "emote-cell" + (owned ? "" : " locked"),
          title: owned ? `${e.name}: ${e.desc}  (/${e.id})` : `${e.name}: locked. Buy it in the shop for ${e.price} drops.`,
          onclick: () => opts.onEmote(e.id),
        }, h("span", { class: "emote-icon" }, h("img", { src: e.icon, alt: "", draggable: false })), h("span", { class: "emote-name" }, e.name), owned ? null : h("span", { class: "emote-lock" }, "🔒"));
      }));
    body.replaceChildren(
      h("div", { class: "osrs-title" }, "Emotes"),
      grid,
      h("div", { class: "inv-foot" },
        h("div", { class: "hint" }, "Click one to perform it, or type /name in chat (like /dance). Walking cancels it."),
        EMOTES.some((e) => !hasEmote(profile, e.id)) ? h("button", { class: "btn small", onclick: () => ctx.navigate("shop") }, "Get more in the shop") : null));
  }

  // ---- inventory -----------------------------------------------------------------------
  function selectedHint(): string {
    const it = selected !== null ? profile.inventory[selected] : null;
    if (!it) return "Knife: click it, then a player. CD: click it, then the CD player. Syringe: just click it.";
    const d = itemDef(it.item);
    if (it.item === "superpill") return "Now tap the drug you want to lace with it.";
    if (d?.rolls) return "The dice are in your hand: press Roll.";
    return d?.furniture ? "Now click a free spot in your room to put it down (R turns it)." : d?.useOnObject ? "Now click the CD player in the basement." : "Now click a player to use it on them.";
  }

  /** What you can do with the item in slot `i` (no right-click needed: a tap runs the only option, or lists them). */
  function optionsFor(i: number): MenuOption[] {
    const slot = profile.inventory[i];
    const def = slot ? itemDef(slot.item) : undefined;
    if (!slot || !def || slot.inPlayer) return [];
    const out: MenuOption[] = [];
    const laced = isLaced(slot.item); // looks like the real thing, but using it kills you (the hotel handles it as a swallow)
    if (def.useSelf && !slot.lit) {
      out.push({ label: def.useSelf === "smoke" ? "Light up" : def.useSelf === "pill" ? "Swallow" : def.useSelf === "eat" ? "Eat" : def.useSelf === "consume" ? (slot.item === "codeine" ? "Drink" : "Swallow") : "Draw blood", target: def.name, action: () => opts.onUseSelf(laced ? "consume" : def.useSelf!, i) });
    }
    const combinable = profile.inventory.some((o, j) => j !== i && !!o && (combine(slot, o) || combine(o, slot)));
    if (def.furniture || def.useOnObject || def.useOnPlayer || def.rolls || combinable || slot.item === "superpill") {
      const use = { label: selected === i ? (def.rolls ? "Put away" : "Cancel") : def.furniture ? "Place" : def.rolls ? "Hold" : "Use", target: def.name, action: () => setSelected(selected === i ? null : i) };
      if (slot.item === "superpill") out.unshift(use); // a tap on fentanyl is "Use" first: swallowing it is the second choice
      else out.push(use);
    }
    return out;
  }

  function renderInventory(): void {
    unsubMusic?.();
    unsubMusic = null;
    const grid = h("div", { class: "inv-grid" });
    for (let i = 0; i < INV_SIZE; i++) {
      const slot = profile.inventory[i];
      const def = slot ? itemDef(slot.item) ?? null : null;
      const loaned = !!slot?.inPlayer; // e.g. the CD is sitting in the CD player right now
      const el = h("div", {
        class: "inv-slot" + (selected === i ? " selected" : "") + (guided.includes(i) && def ? " guide" : "") + (dropMode && def && !loaned && !slot?.lit && !NO_DROP.has(slot!.item) ? " drop-glow" : "") + (def ? " filled" : "") + (loaned ? " loaned" : ""),
        title: def ? (loaned ? `${def.name} (in the player)` : def.name) : "",
        onclick: (e: MouseEvent) => {
          if (!def) return;
          if (opts.slotTap?.(i)) { playSfx("select", 0.35); return; }
          playSfx("select", 0.35);
          if (dropMode) {
            if (loaned) return opts.say(`Your ${def.name} is in the player right now.`, "warn");
            if (slot?.lit) return opts.say("Let it burn out first.", "warn");
            if (NO_DROP.has(slot!.item)) return opts.say("You can't drop that.", "warn");
            dropMode = false;
            renderInventory();
            return opts.onDropPick(i);
          }
          if (loaned) return opts.say(`Your ${def.name} is in the player. It'll be back when it's done.`, "warn");
          // something is selected and you tap another item: use the one on the other (cut the cat, roll the weed...)
          if (selected !== null && selected !== i) {
            const sel = profile.inventory[selected];
            if (sel && slot && combine(sel, slot)) { const first = selected; setSelected(null); return opts.onCombine(first, i); }
          }
          // a tap does what the menu would offer: one option -> it happens, several -> you choose
          const options = optionsFor(i);
          if (options.length === 1) options[0].action();
          else if (options.length > 1) showMenu(e.clientX, e.clientY, options);
          else if (def.carvable) opts.say("You've got nothing to cut it with.", "warn");
        },
        oncontextmenu: (e: MouseEvent) => {
          e.preventDefault();
          if (!def || opts.slotTap?.(i)) return;
          const options = optionsFor(i);
          if (options.length) showMenu(e.clientX, e.clientY, options);
        },
      }, def ? h("img", { src: def.litIcon && slot?.lit ? def.litIcon : def.icon, alt: def.name, draggable: false }) : null,
        slot && slot.qty > 1 ? h("span", { class: "qty" }, String(slot.qty)) : null);
      grid.append(el);
    }

    body.replaceChildren(
      h("div", { class: "osrs-title" }, "Inventory"),
      grid,
      h("div", { class: "inv-foot drop-foot" },
        dropMode ? h("div", { class: "hint" }, "Tap the item you want to put on the floor.") : null,
        h("button", { class: "btn small drop-btn", onclick: () => { dropMode = !dropMode; if (dropMode) { selected = null; opts.onSelect(null); } renderInventory(); } }, dropMode ? "Cancel" : "Drop")));
  }

  // ---- music ---------------------------------------------------------------------------
  function renderMusic(): void {
    unsubMusic?.();
    unsubMusic = null;
    if (!profile.owned[MUSIC_ACCESS_KEY]) {
      body.replaceChildren(
        h("div", { class: "osrs-title" }, "Music"),
        h("div", { class: "music-locked" },
          h("p", {}, "🔒 You don't have a jukebox pass."),
          h("p", { class: "hint" }, "Buy music access in the shop to stream tracks while you hang out."),
          h("button", { class: "btn small", onclick: () => ctx.navigate("shop") }, "Open shop")));
      return;
    }

    const list = h("div", { class: "track-list" });
    const now = h("div", { class: "now" });
    const playBtn = h("button", { class: "btn small", onclick: () => player.toggle() });
    const seek = h("input", { type: "range", min: 0, max: 1000, value: 0, class: "seek", oninput: () => player.seek(Number(seek.value) / 1000) });
    const time = h("span", { class: "time" });
    const vol = h("input", { type: "range", min: 0, max: 100, value: Math.round(player.audio.volume * 100), class: "vol", oninput: () => player.setVolume(Number(vol.value) / 100) });

    const sync = () => {
      const a = player.audio;
      list.replaceChildren(...TRACKS.map((t) =>
        h("div", { class: "track" + (player.current?.id === t.id ? " on" : ""), onclick: () => player.play(t) },
          h("span", { class: "track-ico" }, player.current?.id === t.id && player.playing ? "▶" : "♪"),
          h("div", {}, h("div", { class: "track-title" }, t.title), h("div", { class: "hint" }, t.artist)))));
      now.textContent = player.failed
        ? "Couldn't load that track."
        : player.current ? `${player.playing ? "Now playing" : "Paused"}: ${player.current.title}` : "Pick a track to start streaming.";
      playBtn.textContent = player.playing ? "⏸ Pause" : "▶ Play";
      if (document.activeElement !== seek && Number.isFinite(a.duration) && a.duration > 0) seek.value = String(Math.round((a.currentTime / a.duration) * 1000));
      time.textContent = `${fmtTime(a.currentTime)} / ${fmtTime(a.duration)}`;
    };
    unsubMusic = player.subscribe(sync);
    sync();
    body.replaceChildren(h("div", { class: "osrs-title" }, "Music"), list, now, h("div", { class: "row center" }, playBtn), seek, time, h("label", { class: "hint" }, "Volume ", vol));
  }

  function render(): void {
    unsubMusic?.();
    unsubMusic = null;
    roomCleanup?.();
    roomCleanup = null;
    panel.classList.toggle("collapsed", collapsed);
    renderTabs();
    if (tab === "inventory") renderInventory();
    else if (tab === "emotes") renderEmotes();
    else if (tab === "room" && opts.roomTab) {
      body.replaceChildren();
      roomCleanup = opts.roomTab.mount(body);
    } else renderMusic();
  }

  function setSelected(slot: number | null): void {
    selected = slot;
    opts.onSelect(slot);
    if (tab === "inventory") renderInventory();
  }

  render();
  // the "again in 5h 10m" line should tick over without needing a click
  const timer = window.setInterval(() => { if (tab === "inventory") renderInventory(); }, 60_000);
  const offIcons = onFurniIcon(() => { if (tab === "inventory") renderInventory(); }); // a piece's picture finished loading

  return {
    setSelected(slot) { selected = slot; if (tab === "inventory") renderInventory(); },
    guide(slot) {
      const next = slot === null ? [] : Array.isArray(slot) ? slot : [slot];
      const changed = JSON.stringify(next) !== JSON.stringify(guided);
      guided = next;
      // a new thing to point at opens the inventory; the same one just keeps glowing
      if (changed && next.length && (tab !== "inventory" || collapsed)) { tab = "inventory"; collapsed = false; render(); } else if (tab === "inventory") renderInventory();
    },
    refresh: render,
    dispose() {
      window.clearInterval(timer);
      offIcons();
      unsubMusic?.();
      roomCleanup?.();
      panel.remove();
    },
  };
}
