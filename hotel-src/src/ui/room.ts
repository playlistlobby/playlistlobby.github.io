import {
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onDisconnect,
  push,
  query,
  limitToLast,
  orderByChild,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  Unsubscribe,
} from "firebase/database";
import { db } from "../firebase";
import { getCached, renderAvatar } from "../avatarService";
import { canStab, canUseSyringe, msUntilTomorrow, rewardStab, rewardSyringe, SYRINGE_BLOOD, serverNow } from "../db";
import { logAction } from "../logger";
import { BLOOD_ICON, findSlot, ITEMS } from "../items";
import { CdAudio, CdState, cdEnded, clearCdPlayer, insertCd, reconcileCd, watchCdPlayer } from "../cdplayer";
import { fmtTime } from "../music";
import { EMOTE_BY_ID, EmoteDef, hasEmote, SPIN_DIRS } from "../emotes";
import {
  canEnter,
  defFromMeta,
  FURNI_KINDS,
  INTERACTIVE_KINDS,
  fetchMeta,
  footprint,
  isDoorTile,
  isFixedLobbyPiece,
  lobbyDef,
  LOBBY_ID,
  MAX_FURNI,
  placeFurni,
  removeFurni,
  RoomDef,
  watchLobbyFurni,
  watchMeta,
} from "../rooms";
import { Box, drawDoor, drawFurniBase, drawNitroFurni, ensureFurniSprites, ensureTextures, iso, Pt, renderRoomShell, shade, TILE_H, TILE_W } from "../roomRender";
import { setPresenceRoom, social } from "../social";
import { openArcade } from "../arcade/arcade";
import { h, toast } from "./dom";
import { closeMenu, showMenu } from "./contextMenu";
import { mountSidePanel } from "./sidepanel";
import { mountRoomPanel } from "./roomPanel";
import { DoorApi, openDoor } from "./door";
import type { Ctx } from "../main";

const STEP_MS = 480;
const BUBBLE_MS = 6500;
const MAX_CHARS = 100;
const STAB_MS = 700;
const DROP_FLIGHT_MS = 750;

const DIRS: Array<[number, number, number]> = [
  // dx, dy, habbo direction (0 = up-right on screen, 2 = down-right, 4 = down-left, 6 = up-left)
  [0, -1, 0], [1, -1, 1], [1, 0, 2], [1, 1, 3], [0, 1, 4], [-1, 1, 5], [-1, 0, 6], [-1, -1, 7],
];

interface Bubble { text: string; until: number }
interface ActiveEmote { def: EmoteDef; start: number; lastFx: number }

interface Player {
  uid: string;
  name: string;
  figure: string;
  dir: number;
  from: Pt;
  to: Pt;
  stepStart: number;
  path: Pt[];
  dest: Pt;
  bubble?: Bubble;
  emote?: ActiveEmote;
  lastEmoteTs: number;
  last?: HTMLCanvasElement;
}

interface StabFx { from: string; to: string; start: number; impact: boolean; dropped: boolean }
interface SyringeFx { uid: string; start: number; burst: boolean }
interface DropFx { from: string; to: string; start: number }
interface Particle { x: number; y: number; vx: number; vy: number; born: number; life: number }
interface Floater { text: string; x: number; y: number; born: number; color: string }
interface GlyphFx { uid: string; glyph: string; born: number; life: number; ox: number }
interface Hitbox { id: string; kind?: string; x0: number; y0: number; x1: number; y1: number; depth: number }
interface NoteFx { born: number; life: number; glyph: string; ox: number; phase: number; color: string }

type Pending =
  | { type: "stab"; uid: string; since: number; lastTry: number }
  | { type: "door"; since: number; lastTry: number }
  | { type: "arcade" | "cd"; fid: string; since: number; lastTry: number };

const cheb = (a: Pt, b: Pt) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function dirOf(from: Pt, to: Pt): number {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  return DIRS.find((d) => d[0] === dx && d[1] === dy)?.[2] ?? 2;
}

function loadImg(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}
const knifeImg = loadImg(ITEMS.knife.icon);
const bloodImg = loadImg(BLOOD_ICON);
const syringeImg = loadImg(ITEMS.syringe.icon);

/** Pixels from the feet line up to the top of the 64x110 avatar canvas (tuned against the bobba sprites). */
const FEET_Y = 94;

export interface RoomApi {
  dispose(): void;
  /** the room stays mounted (so you stay in it) while you look at Character or Shop; show/hide pause and resume it */
  show(): void;
  hide(): void;
  /** call after the player's look changed so everyone in the room sees the new one */
  figureChanged(): void;
}

export function mountRoom(root: HTMLElement, ctx: Ctx, roomId: string): RoomApi {
  const me = ctx.profile;
  const players = new Map<string, Player>();
  const unsubs: Unsubscribe[] = [];
  let disposed = false;
  let started = false;
  let active = true;

  let def: RoomDef = lobbyDef();
  const blocked = new Set<string>();

  let hover: Pt | null = null;
  let hoverPlayer: Player | null = null;
  let hitboxes: Hitbox[] = [];
  let objBoxes: Hitbox[] = [];
  let hoverObj: Hitbox | null = null;
  let hoverDoor = false;
  let doorBox: Box | null = null;
  let doorApi: DoorApi | null = null;
  const doorLabel = roomId === LOBBY_ID ? "ROOMS" : "EXIT";

  // OSRS-style "use item on ..." state
  let selectedSlot: number | null = null;
  let pending: Pending | null = null;
  let stabbing = false;
  /** owner's edit tool: a furniture kind id, "pickup", or null */
  let tool: string | null = null;
  /** which way the piece being placed faces (0/2/4/6; press R) */
  let toolDir = 0;

  const stabFx: StabFx[] = [];
  const syringeFx: SyringeFx[] = [];
  const dropFx: DropFx[] = [];
  const particles: Particle[] = [];
  const floaters: Floater[] = [];
  const glyphs: GlyphFx[] = [];

  /** you can edit your own room; the admin can also edit the public room's extra furniture */
  const isOwner = () => def.ownerUid === me.uid || (def.id === LOBBY_ID && me.isAdmin);

  // ---- DOM ---------------------------------------------------------------------
  const canvas = h("canvas", { class: "room-canvas" });
  const log = h("div", { class: "chat-log" });
  const online = h("div", { class: "online", title: "Who's in this room", onclick: () => online.classList.toggle("open") });
  const roomTitle = h("div", { class: "room-title" }, roomId === LOBBY_ID ? "Main Lobby" : "Loading room…");
  const actionHint = h("div", { class: "action-hint hidden" });
  const input = h("input", { class: "chat-input", type: "text", maxLength: MAX_CHARS, placeholder: "Say something, or try /dance. Tap the floor to walk.", autocomplete: "off" });
  const stage = h("div", { class: "stage" }, canvas, online, log, actionHint, roomTitle);
  const sideHost = h("div", { class: "side-host" });
  root.append(h("div", { class: "room" },
    h("div", { class: "room-main" }, stage, sideHost),
    h("form", { class: "chat-bar", onsubmit: (e: Event) => { e.preventDefault(); send(); } }, input, h("button", { class: "btn primary", type: "submit" }, "Send"))));
  const g = canvas.getContext("2d")!;

  /** Game messages (OSRS "chatbox" lines) that only you see. */
  function say(text: string, kind: "game" | "warn" = "game"): void {
    log.append(h("div", { class: `line sys ${kind}` }, text));
    while (log.children.length > 60) log.firstElementChild?.remove();
    log.scrollTop = log.scrollHeight;
  }

  const panel = mountSidePanel(sideHost, ctx, {
    say,
    onSelect: (slot) => {
      selectedSlot = slot;
      pending = null;
      updateHint();
    },
    onEmote: (id) => performEmote(id),
    onUseSelf: (what) => { if (what === "syringe") void useSyringe(); },
    roomTab: roomId === LOBBY_ID && !me.isAdmin ? undefined : {
      icon: "🏠",
      title: "Room",
      mount: (container) => mountRoomPanel(container, ctx, {
        getDef: () => def,
        isOwner,
        getTool: () => tool,
        setTool: (t) => { if (t !== tool) toolDir = 0; tool = t; updateHint(); },
        getToolDir: () => toolDir,
        rotateTool,
        onDefChange: (fn) => { defListeners.add(fn); return () => defListeners.delete(fn); },
      }),
    },
  });
  const defListeners = new Set<() => void>();

  const selectedDef = () => (selectedSlot !== null && me.inventory[selectedSlot] ? ITEMS[me.inventory[selectedSlot]!.item] : null);

  function updateHint(): void {
    const item = selectedDef();
    let text = "";
    if (tool && isOwner()) text = tool === "pickup" ? "Pick up furniture: click it" : `Place ${FURNI_KINDS[tool]?.label ?? tool}: click a tile${FURNI_KINDS[tool]?.rotatable ? " (R turns it)" : ""}`;
    else if (item?.useOnObject) text = hoverObj && hoverObj.kind === item.useOnObject ? `Use ${item.name} → ${FURNI_KINDS[hoverObj.kind].label}` : `Use ${item.name} →`;
    else if (item) text = hoverPlayer && hoverPlayer.uid !== me.uid ? `Use ${item.name} → ${hoverPlayer.name}` : `Use ${item.name} →`;
    else if (hoverPlayer) text = hoverPlayer.name;
    else if (hoverObj && hoverObj.kind) text = FURNI_KINDS[hoverObj.kind].label;
    else if (hoverDoor) text = roomId === LOBBY_ID ? "Door: rooms" : "Door: leave the room";
    actionHint.textContent = text;
    actionHint.classList.toggle("hidden", !text);
    canvas.style.cursor = item || tool ? "crosshair" : "pointer";
  }

  // ---- room geometry ---------------------------------------------------------------
  function rebuildBlocked(): void {
    blocked.clear();
    for (const f of def.furni) {
      const k = FURNI_KINDS[f.kind];
      if (k.flat) continue; // flat pieces (a label on the floor) can be walked over
      const fp = footprint(f.kind, f.dir);
      for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) blocked.add(`${f.x + i},${f.y + j}`);
    }
  }
  const walkable = (x: number, y: number) => x >= 0 && y >= 0 && x < def.w && y < def.h && !blocked.has(`${x},${y}`);

  /** 8-directional BFS; diagonals can't cut corners. Returns tiles after `start`, [] if unreachable. */
  function findPath(start: Pt, goal: Pt): Pt[] {
    if (!walkable(goal.x, goal.y) || (start.x === goal.x && start.y === goal.y)) return [];
    const key = (p: Pt) => p.y * def.w + p.x;
    const prev = new Map<number, Pt | null>([[key(start), null]]);
    const queue: Pt[] = [start];
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      if (cur.x === goal.x && cur.y === goal.y) break;
      for (const [dx, dy] of DIRS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!walkable(nx, ny) || prev.has(ny * def.w + nx)) continue;
        if (dx !== 0 && dy !== 0 && (!walkable(cur.x + dx, cur.y) || !walkable(cur.x, cur.y + dy))) continue;
        prev.set(ny * def.w + nx, cur);
        queue.push({ x: nx, y: ny });
      }
    }
    if (!prev.has(key(goal))) return [];
    const out: Pt[] = [];
    for (let p: Pt | null = goal; p && !(p.x === start.x && p.y === start.y); p = prev.get(key(p)) ?? null) out.unshift(p);
    return out;
  }

  // static floor/walls are drawn once into an offscreen canvas (rebuilt when the room changes)
  let floorOrigin: Pt = { x: 0, y: 0 };
  let floor: HTMLCanvasElement = document.createElement("canvas");

  function applyDef(next: RoomDef): void {
    def = next;
    rebuildBlocked();
    const shell = renderRoomShell(def);
    floor = shell.canvas;
    floorOrigin = shell.origin;
    layout();
    void ensureFurniSprites(def);
    // textured floors/walls need their images first; draw again once they're in
    const forDef = def;
    void ensureTextures(def.theme).then(() => {
      if (disposed || def !== forDef || (!def.theme.floorTex && !def.theme.wallTex)) return;
      const again = renderRoomShell(def);
      floor = again.canvas;
      floorOrigin = again.origin;
    });
    roomTitle.textContent = def.ownerName ? `${def.name} · by ${def.ownerName}` : def.name;
    defListeners.forEach((l) => l());
  }

  // ---- camera --------------------------------------------------------------------
  let scale = 1;
  let offX = 0;
  let offY = 0;
  function layout(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = stage.clientWidth;
    const hh = stage.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(hh * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = hh + "px";
    const fit = Math.min(w / floor.width, hh / (floor.height + 70));
    scale = fit >= 1 ? Math.floor(fit * 2) / 2 : fit; // half-steps keep pixel art crisp
    scale = Math.max(0.4, Math.min(scale, 2));
    offX = Math.round((w - floor.width * scale) / 2 + floorOrigin.x * scale);
    offY = Math.round((hh - floor.height * scale) / 2 + floorOrigin.y * scale + 24);
  }
  const resizeObs = new ResizeObserver(layout);
  resizeObs.observe(stage);

  const toScreen = (p: Pt): Pt => ({ x: offX + p.x * scale, y: offY + p.y * scale });
  function tileAt(mx: number, my: number): Pt | null {
    const u = (mx - offX) / scale / (TILE_W / 2);
    const v = (my - offY) / scale / (TILE_H / 2);
    const tx = Math.floor((u + v) / 2);
    const ty = Math.floor((v - u) / 2);
    return tx >= 0 && ty >= 0 && tx < def.w && ty < def.h ? { x: tx, y: ty } : null;
  }
  function pick(boxes: Hitbox[], mx: number, my: number): Hitbox | null {
    let best: Hitbox | null = null;
    for (const b of boxes) {
      if (mx >= b.x0 && mx <= b.x1 && my >= b.y0 && my <= b.y1 && (!best || b.depth > best.depth)) best = b;
    }
    return best;
  }
  const playerAt = (mx: number, my: number): Player | null => {
    const b = pick(hitboxes, mx, my);
    return b ? players.get(b.id) ?? null : null;
  };
  const mousePos = (e: MouseEvent): Pt => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const furniAtTile = (t: Pt) =>
    def.furni.find((f) => {
      const fp = footprint(f.kind, f.dir);
      return t.x >= f.x && t.x < f.x + fp.w && t.y >= f.y && t.y < f.y + fp.h;
    });

  const inBox = (m: Pt, b: Box | null) => !!b && m.x >= b.x0 && m.x <= b.x1 && m.y >= b.y0 && m.y <= b.y1;

  canvas.addEventListener("mousemove", (e) => {
    const m = mousePos(e);
    hover = tileAt(m.x, m.y);
    const hp = playerAt(m.x, m.y);
    const ho = hp ? null : pick(objBoxes, m.x, m.y);
    const hd = !hp && !ho && inBox(m, doorBox);
    if (hp !== hoverPlayer || ho?.id !== hoverObj?.id || hd !== hoverDoor) {
      hoverPlayer = hp;
      hoverObj = ho;
      hoverDoor = hd;
      updateHint();
    }
  });
  canvas.addEventListener("mouseleave", () => { hover = null; hoverPlayer = null; hoverObj = null; hoverDoor = false; updateHint(); });

  canvas.addEventListener("click", (e) => {
    if (suppressClick) { suppressClick = false; return; }
    const m = mousePos(e);
    const target = playerAt(m.x, m.y);
    const t = tileAt(m.x, m.y);

    // owner furniture editing takes priority
    if (tool && isOwner()) {
      if (!t) return;
      if (tool === "pickup") {
        const f = furniAtTile(t);
        if (f && isFixedLobbyPiece(f.id)) say("That one is part of the lobby itself.", "warn");
        else if (f) void removeFurni(def.id, f.id).catch(() => toast("Couldn't pick that up", "err"));
      } else tryPlace(tool, t);
      return;
    }

    const obj = pick(objBoxes, m.x, m.y);

    // the door (on the wall behind everything, so players and furniture win clicks that overlap it)
    if (!target && !obj && inBox(m, doorBox)) {
      clearSelection();
      startDoor();
      return;
    }

    const item = selectedDef();
    if (item?.useOnPlayer === "stab") {
      if (target && target.uid !== me.uid) startStab(target.uid);
      else if (target) say("You can't stab yourself.", "warn");
      else {
        // OSRS: clicking the floor with an item selected cancels it and walks
        clearSelection();
        if (t) { pending = null; walkTo(t); }
      }
      return;
    }

    // an item that goes on a piece of furniture (the CD on the CD player)
    if (item?.useOnObject) {
      if (obj && !target && obj.kind === item.useOnObject) startCd(obj.id);
      else {
        clearSelection();
        if (obj && !target) say("Nothing interesting happens.", "warn");
        else if (t && walkable(t.x, t.y)) { pending = null; walkTo(t); }
      }
      return;
    }

    if (obj && !target) {
      if (obj.kind === "cdplayer") openCdPopup();
      else startArcade(obj.id);
      return;
    }
    if (t && walkable(t.x, t.y)) { pending = null; walkTo(t); }
  });

  /** The right-click menu for whatever is at canvas position (mx, my); (cx, cy) is where on the page to show it. */
  function openContextAt(mx: number, my: number, cx: number, cy: number): void {
    const target = playerAt(mx, my);
    const tile = tileAt(mx, my);
    const item = selectedDef();
    const hasKnife = findSlot(me.inventory, "knife") >= 0;
    const opts: Array<{ label: string; target?: string; danger?: boolean; action: () => void }> = [];
    if (target && target.uid !== me.uid) {
      if (item?.useOnPlayer === "stab") opts.push({ label: `Use ${item.name} →`, target: target.name, action: () => startStab(target.uid) });
      if (hasKnife && item?.useOnPlayer !== "stab") opts.push({ label: "Stab", target: target.name, danger: true, action: () => startStab(target.uid) });
      opts.push({ label: "Examine", target: target.name, action: () => say(`${target.name}: a fellow hotel guest.`) });
      if (social.friends.has(target.uid)) opts.push({ label: "Message", target: target.name, action: () => window.dispatchEvent(new CustomEvent("open-chat", { detail: target.uid })) });
      else opts.push({ label: "Add friend", target: target.name, action: () => social.sendRequest(target.name).then((s) => say(s), (err) => say((err as Error).message, "warn")) });
    }
    const obj = pick(objBoxes, mx, my);
    if (obj?.kind === "arcade") opts.push({ label: "Play", target: "Arcade machine", action: () => startArcade(obj.id) });
    if (obj?.kind === "cdplayer") {
      if (item?.useOnObject === "cdplayer") opts.push({ label: `Use ${item.name} →`, target: "CD player", action: () => startCd(obj.id) });
      opts.push({ label: "Volume", target: "CD player", action: () => openCdPopup() });
      opts.push({ label: "Examine", target: "CD player", action: () => say(cdState && !cdEnded(cdState) ? `The CD player is playing "${cdState.title}", put in by ${cdState.byName}.` : "A chunky CD player. It's empty. Use a CD on it.") });
    }
    if (!target && !obj && inBox({ x: mx, y: my }, doorBox)) opts.push({ label: "Open", target: "Door", action: () => startDoor() });
    const furni = tile ? furniAtTile(tile) : undefined;
    if (furni && isOwner() && furni.kind !== "arcade" && !isFixedLobbyPiece(furni.id)) {
      opts.push({ label: "Pick up", target: FURNI_KINDS[furni.kind].label, action: () => void removeFurni(def.id, furni.id).catch(() => undefined) });
    }
    if (tile && walkable(tile.x, tile.y)) opts.push({ label: "Walk here", action: () => { pending = null; walkTo(tile); } });
    showMenu(cx, cy, opts);
  }

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (performance.now() - lastLongPress < 900) return; // a touch long-press already opened the menu
    const m = mousePos(e);
    openContextAt(m.x, m.y, e.clientX, e.clientY);
  });

  // touch: a long press is the "right click"
  let press: { x: number; y: number; cx: number; cy: number; timer: number } | null = null;
  let suppressClick = false;
  let lastLongPress = -1e9;
  const endPress = () => {
    if (!press) return;
    window.clearTimeout(press.timer);
    press = null;
  };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const m = mousePos(e);
    const at = { x: m.x, y: m.y, cx: e.clientX, cy: e.clientY };
    press = {
      ...at,
      timer: window.setTimeout(() => {
        press = null;
        suppressClick = true;
        lastLongPress = performance.now();
        openContextAt(at.x, at.y, at.cx, at.cy);
      }, 480),
    };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (press && Math.hypot(e.clientX - press.cx, e.clientY - press.cy) > 10) endPress();
  });
  canvas.addEventListener("pointerup", endPress);
  canvas.addEventListener("pointercancel", endPress);

  function clearSelection(): void {
    selectedSlot = null;
    panel.setSelected(null);
    updateHint();
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (selectedSlot !== null) clearSelection();
    closeCdPopup();
    doorApi?.close();
    if (tool) { tool = null; updateHint(); defListeners.forEach((l) => l()); }
  };
  const onRotateKey = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== "r" || e.ctrlKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    rotateTool();
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keydown", onRotateKey);

  function rotateTool(): void {
    if (!tool || tool === "pickup" || !FURNI_KINDS[tool]?.rotatable) return;
    toolDir = (toolDir + 2) % 8;
    updateHint();
    defListeners.forEach((l) => l());
  }

  // ---- furniture placing (owner) ---------------------------------------------------
  function tryPlace(kind: string, t: Pt): void {
    const k = FURNI_KINDS[kind];
    const adminLobby = def.id === LOBBY_ID && me.isAdmin;
    if (!k || (!k.placeable && !(adminLobby && k.nitro))) return;
    if (def.furni.length >= MAX_FURNI) return say(`That's the limit: ${MAX_FURNI} pieces per room.`, "warn");
    const fp = footprint(kind, toolDir);
    for (let i = 0; i < fp.w; i++) {
      for (let j = 0; j < fp.h; j++) {
        const x = t.x + i;
        const y = t.y + j;
        if (isDoorTile(x, y, def.doorX)) return say("Keep the doorway clear.", "warn");
        if (!walkable(x, y)) return say("There's no room for that there.", "warn");
        for (const p of players.values()) {
          const pt = currentTile(p);
          if (pt.x === x && pt.y === y) return say("Someone is standing there.", "warn");
        }
      }
    }
    void placeFurni(def.id, kind, t.x, t.y, k.rotatable ? toolDir : 0).catch(() => say("Couldn't place that.", "warn"));
  }

  // ---- players -------------------------------------------------------------------
  function makePlayer(uid: string, v: any): Player {
    const p: Pt = { x: v.x ?? 1, y: v.y ?? 1 };
    return {
      uid, name: v.name ?? "?", figure: v.figure ?? me.figure, dir: v.dir ?? 2,
      from: p, to: p, stepStart: 0, path: [], dest: p, lastEmoteTs: v.emote?.ts ?? 0,
    };
  }

  const isMoving = (p: Player, now: number) => now - p.stepStart < STEP_MS && (p.from.x !== p.to.x || p.from.y !== p.to.y);

  function currentTile(p: Player): Pt {
    return p.path.length || performance.now() - p.stepStart < STEP_MS ? p.to : p.from;
  }

  function setDestination(p: Player, dest: Pt): void {
    const start = currentTile(p);
    p.dest = dest;
    p.path = findPath(start, dest);
    if (p.path.length) p.emote = undefined; // walking ends any emote
  }

  const mine = (): Player | undefined => players.get(me.uid);

  function walkTo(dest: Pt): void {
    const p = mine();
    if (!p) return;
    setDestination(p, dest);
    if (p.path.length === 0) return;
    update(ref(db, `rooms/${roomId}/players/${me.uid}`), { x: dest.x, y: dest.y, dir: dirOf(currentTile(p), p.path[0]) }).catch(console.warn);
  }

  function advance(p: Player, now: number): void {
    if (now - p.stepStart < STEP_MS) return;
    p.from = p.to;
    if (p.path.length) {
      const next = p.path.shift()!;
      p.dir = dirOf(p.from, next);
      p.to = next;
      p.stepStart = now;
    }
  }

  function posOf(p: Player, now: number): Pt {
    const t = isMoving(p, now) ? (now - p.stepStart) / STEP_MS : 1;
    return { x: p.from.x + (p.to.x - p.from.x) * t, y: p.from.y + (p.to.y - p.from.y) * t };
  }

  const feetOf = (p: Player, now: number): Pt => {
    const pos = posOf(p, now);
    const w = iso(pos.x, pos.y);
    return toScreen({ x: w.x, y: w.y + TILE_H / 2 });
  };

  // ---- emotes ----------------------------------------------------------------------
  function startEmote(p: Player, def: EmoteDef): void {
    p.emote = { def, start: performance.now(), lastFx: 0 };
  }

  function performEmote(id: string): void {
    const def = EMOTE_BY_ID[id];
    const p = mine();
    if (!def || !p) return;
    if (!hasEmote(me, id)) return say(`You haven't unlocked ${def.name}. You can buy it in the shop.`, "warn");
    p.path = []; // stand still to emote
    startEmote(p, def);
    update(ref(db, `rooms/${roomId}/players/${me.uid}`), { emote: { id, ts: serverTimestamp() } }).catch(() => say("Your emote didn't go through.", "warn"));
    logAction(me, "emote", `/${id}`);
  }

  // ---- the knife -------------------------------------------------------------------
  function startStab(uid: string): void {
    const target = players.get(uid);
    if (!target || uid === me.uid) return;
    if (findSlot(me.inventory, "knife") < 0) return say("You need a knife for that.", "warn");
    if (!canStab(me, uid)) {
      const mins = Math.max(1, Math.ceil(msUntilTomorrow() / 60000));
      return say(`You've already stabbed ${target.name} today. You can stab them again in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}.`, "warn");
    }
    pending = { type: "stab", uid, since: performance.now(), lastTry: 0 };
    clearSelection(); // like OSRS, the item stops being a "selected" cursor once you commit to a target
    if (cheb(currentTile(mine()!), currentTile(target)) > 1) say(`You walk towards ${target.name}…`);
  }

  function startArcade(fid: string): void {
    pending = { type: "arcade", fid, since: performance.now(), lastTry: 0 };
  }

  function startDoor(): void {
    if (doorApi) return;
    pending = { type: "door", since: performance.now(), lastTry: 0 };
  }

  function showDoor(): void {
    if (doorApi) return;
    doorApi = openDoor(stage, ctx, roomId, () => { doorApi = null; });
  }

  /** Walks next to a tile (or a player's tile), returns true once adjacent. */
  function approach(p: Player, goal: Pt, now: number, tries: { lastTry: number }): "arrived" | "walking" | "unreachable" {
    const mt = currentTile(p);
    if (cheb(mt, goal) <= 1) return "arrived";
    if (now - tries.lastTry < 450) return "walking";
    tries.lastTry = now;
    let best: Pt | null = null;
    let bestLen = Infinity;
    for (const [dx, dy] of DIRS) {
      const n = { x: goal.x + dx, y: goal.y + dy };
      if (!walkable(n.x, n.y)) continue;
      const len = n.x === mt.x && n.y === mt.y ? 0 : findPath(mt, n).length || Infinity;
      if (len < bestLen) { best = n; bestLen = len; }
    }
    if (!best || bestLen === Infinity) return "unreachable";
    walkTo(best);
    return "walking";
  }

  /** Walks the player next to their target, then acts (stab / open arcade). Runs every frame while pending. */
  function processPending(now: number): void {
    const p = mine();
    if (!pending || !p || stabbing) return;
    if (now - pending.since > 20_000) { pending = null; return say("You lose track of what you were doing.", "warn"); }
    if (p.path.length || isMoving(p, now)) return;

    if (pending.type === "door") {
      const goal = { x: def.doorX, y: 0 };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to the door.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = 0; // face the wall the door is in
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        showDoor();
      }
      return;
    }

    if (pending.type === "stab") {
      const target = players.get(pending.uid);
      if (!target) { pending = null; return say("They've left the room.", "warn"); }
      const r = approach(p, currentTile(target), now, pending);
      if (r === "unreachable") { pending = null; return say("You can't reach them.", "warn"); }
      if (r === "arrived") {
        const uid = pending.uid;
        pending = null;
        void executeStab(uid);
      }
      return;
    }
    const job = pending;
    const f = def.furni.find((x) => x.id === job.fid);
    if (!f) { pending = null; return; }
    const r = approach(p, { x: f.x, y: f.y }, now, job);
    if (r === "unreachable") { pending = null; return say("You can't get to it.", "warn"); }
    if (r === "arrived") {
      pending = null;
      p.dir = dirOf(currentTile(p), { x: f.x, y: f.y });
      update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
      if (job.type === "cd") void executeInsert();
      else openArcade();
    }
  }

  // ---- the CD player ------------------------------------------------------------------
  // Shared state lives at rooms/lobby/cdplayer. Everyone in the lobby plays the same CD in step; each listener has
  // their own volume. The inserter's CD is "loaned" (inPlayer) in their inventory until it ends, then comes back.
  let cdState: CdState | null = null;
  let cdInserting = false;
  let cdClearing = false;
  let unblockHandler: (() => void) | null = null;
  let cdPopup: { el: HTMLElement; timer: number } | null = null;
  const notes: NoteFx[] = [];
  let lastNote = 0;
  const cdPlaying = () => !!cdState && !cdEnded(cdState);

  const cdUi = {
    title: h("div", { class: "cd-title" }),
    status: h("div", { class: "hint" }),
    fill: h("div", { class: "cd-fill" }),
    time: h("span", { class: "hint" }),
    vol: h("span", { class: "cd-vol" }),
    mute: h("button", { class: "btn small", title: "Mute", onclick: () => cdAudio.toggleMute() }),
    eject: h("button", { class: "btn small danger", onclick: () => void ejectCd() }, "⏏ Take my CD back"),
  };

  function refreshCdPopup(): void {
    if (!cdPopup) return;
    const s = cdState && !cdEnded(cdState) ? cdState : null;
    cdUi.title.textContent = s ? `♪ ${s.title}` : "Nothing playing";
    cdUi.status.textContent = s ? `Put in by ${s.byName}` : "Use a CD from your inventory on the player.";
    const total = s ? s.endsAt - s.startedAt : 0;
    const pos = s ? Math.min(total, serverNow() - s.startedAt) : 0;
    cdUi.fill.style.width = total ? `${Math.max(0, Math.min(100, (pos / total) * 100))}%` : "0%";
    cdUi.time.textContent = s ? `${fmtTime(pos / 1000)} / ${fmtTime(total / 1000)}` : "";
    cdUi.vol.textContent = cdAudio.muted ? "muted" : `${Math.round(cdAudio.volume * 100)}%`;
    cdUi.mute.textContent = cdAudio.muted || cdAudio.volume === 0 ? "🔇" : "🔊";
    cdUi.eject.classList.toggle("hidden", !(s && s.by === me.uid));
  }

  /** Called whenever the audio changes; also deals with browsers refusing to autoplay before the first click. */
  function cdChanged(): void {
    refreshCdPopup();
    if (cdAudio.blocked && !unblockHandler) {
      say("Click anywhere to hear the CD player (your browser holds back sound until you interact with the page).", "warn");
      unblockHandler = () => { unblockHandler = null; cdAudio.tryPlay(); };
      window.addEventListener("pointerdown", unblockHandler, { once: true });
    }
  }
  const cdAudio = new CdAudio(cdChanged);

  function closeCdPopup(): void {
    if (!cdPopup) return;
    window.clearInterval(cdPopup.timer);
    cdPopup.el.remove();
    cdPopup = null;
  }

  /** Click the CD player (with nothing selected): volume controls and what's playing. */
  function openCdPopup(): void {
    if (cdPopup) return closeCdPopup();
    const step = (d: number) => cdAudio.setVolume(cdAudio.volume + d);
    const el = h("div", { class: "cd-popup" },
      h("div", { class: "cd-head" }, h("strong", {}, "💿 CD player"), h("button", { class: "btn small", onclick: closeCdPopup }, "✕")),
      cdUi.title, cdUi.status,
      h("div", { class: "cd-bar" }, cdUi.fill), cdUi.time,
      h("div", { class: "cd-row" },
        h("span", { class: "hint" }, "Volume"),
        h("button", { class: "btn small", title: "Quieter", onclick: () => step(-0.1) }, "−"),
        cdUi.vol,
        h("button", { class: "btn small", title: "Louder", onclick: () => step(0.1) }, "+"),
        cdUi.mute),
      h("div", { class: "hint" }, "Volume is just for you. Other players keep their own."),
      cdUi.eject);
    stage.append(el);
    cdPopup = { el, timer: window.setInterval(refreshCdPopup, 500) };
    refreshCdPopup();
  }

  function startCd(fid: string): void {
    if (findSlot(me.inventory, "cd") < 0) { clearSelection(); return say("Your CD is already in the player.", "warn"); }
    if (cdPlaying()) { clearSelection(); return say(`The CD player is busy playing ${cdState!.byName}'s CD.`, "warn"); }
    pending = { type: "cd", fid, since: performance.now(), lastTry: 0 };
    clearSelection();
    say("You walk over to the CD player…");
  }

  async function executeInsert(): Promise<void> {
    if (cdInserting) return;
    cdInserting = true;
    try {
      const slot = findSlot(me.inventory, "cd");
      if (slot < 0) return;
      if (cdPlaying()) return say(`The CD player is busy playing ${cdState!.byName}'s CD.`, "warn");
      await insertCd(me, slot);
      panel.refresh();
      logAction(me, "cd", "put a CD in the CD player");
      say("You slide the CD into the player. Music starts up. ♪ It will pop back into your inventory when it's finished.");
    } catch {
      say("The CD player spits your CD back out. Someone else got there first.", "warn");
    } finally {
      cdInserting = false;
    }
  }

  async function ejectCd(): Promise<void> {
    try {
      await clearCdPlayer();
      logAction(me, "cd", "ejected their CD");
      say("You press eject.");
    } catch {
      say("The eject button doesn't respond.", "warn");
    }
  }

  function onCdState(state: CdState | null): void {
    cdState = state;
    cdAudio.sync(state);
    refreshCdPopup();
    // my CD comes home when it finishes, is ejected, or if I was away while it finished
    void reconcileCd(me, state).then((returned) => {
      if (!returned) return;
      panel.refresh();
      say("Your CD pops out of the player and back into your inventory.");
    });
  }

  /** Anyone may clear a CD that has finished; this also keeps a stuck CD from blocking the player. */
  function tickCd(): void {
    if (cdState && cdEnded(cdState) && !cdClearing) {
      cdClearing = true;
      clearCdPlayer().catch(() => undefined).finally(() => setTimeout(() => { cdClearing = false; }, 3000));
    }
  }

  async function executeStab(uid: string): Promise<void> {
    const p = mine();
    const target = players.get(uid);
    if (!p || !target || stabbing) return;
    stabbing = true;
    try {
      if (!canStab(me, uid)) return say(`You've already stabbed ${target.name} today.`, "warn");
      p.dir = dirOf(currentTile(p), currentTile(target));
      p.emote = undefined;
      update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(console.warn);
      try {
        // everyone (including us) plays the animation off this event
        await push(ref(db, `rooms/${roomId}/events`), { type: "stab", from: me.uid, to: uid, ts: serverTimestamp() });
      } catch {
        return say("Your stab missed. They may have just left.", "warn");
      }
      try {
        await rewardStab(me, uid);
        ctx.refreshHeader();
        panel.refresh();
        logAction(me, "stab", `stabbed ${target.name} (+1)`);
        say(`You stab ${target.name}. It does them no harm, and a drop of blood trickles into your pouch. (+1)`);
      } catch {
        say("The drop of blood slips through your fingers… (the hotel refused it)", "warn");
      }
    } finally {
      stabbing = false;
    }
  }

  // ---- the syringe: draw 2 drops from yourself, once a day -----------------------------------
  let drawing = false;
  async function useSyringe(): Promise<void> {
    if (drawing) return;
    if (findSlot(me.inventory, "syringe") < 0) return say("You don't have a syringe.", "warn");
    if (!canUseSyringe(me)) {
      const mins = Math.max(1, Math.ceil(msUntilTomorrow() / 60000));
      return say(`You've already drawn your blood today. Your arm needs ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`} to recover.`, "warn");
    }
    drawing = true;
    try {
      const p = mine();
      if (p) { p.path = []; p.emote = undefined; }
      try {
        // everyone sees it, like a stab
        await push(ref(db, `rooms/${roomId}/events`), { type: "syringe", from: me.uid, to: me.uid, ts: serverTimestamp() });
      } catch { /* the animation is optional; the blood isn't */ }
      try {
        await rewardSyringe(me);
        ctx.refreshHeader();
        panel.refresh();
        logAction(me, "syringe", `drew blood with the syringe (+${SYRINGE_BLOOD})`);
        say(`You slide the needle in and draw some blood. It fills the barrel nicely. (+${SYRINGE_BLOOD})`);
      } catch {
        say("The needle slips and the blood goes to waste… (the hotel refused it)", "warn");
      }
    } finally {
      drawing = false;
    }
  }

  // ---- start: presence, players, chat, events ---------------------------------------
  /** You come in through the door: the tile in front of it, or the nearest free one. */
  function spawnTile(): Pt {
    const want = { x: def.doorX, y: 1 };
    const taken = (x: number, y: number) => [...players.values()].some((o) => { const t = currentTile(o); return t.x === x && t.y === y; });
    const tiles: Pt[] = [];
    for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) if (walkable(x, y) && !taken(x, y)) tiles.push({ x, y });
    tiles.sort((a, b) => Math.hypot(a.x - want.x, a.y - want.y) - Math.hypot(b.x - want.x, b.y - want.y));
    // a little variety so a crowd doesn't stack on one tile
    const near = tiles.slice(0, 4);
    return near[Math.floor(Math.random() * near.length)] ?? { x: 0, y: 0 };
  }

  const playersRef = ref(db, `rooms/${roomId}/players`);
  const myRef = ref(db, `rooms/${roomId}/players/${me.uid}`);
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  const eventsRef = ref(db, `rooms/${roomId}/events`);
  const joinedAt = serverNow();

  function kicked(msg: string): void {
    if (disposed) return;
    toast(msg, "err");
    ctx.navigate("room", { roomId: LOBBY_ID });
  }

  function renderOnline(): void {
    online.replaceChildren(
      h("strong", {}, `In room (${players.size})`),
      ...[...players.values()].map((p) => h("div", { class: p.uid === me.uid ? "me" : "" }, p.name)));
  }

  function start(): void {
    if (started || disposed) return;
    started = true;
    const spawn = spawnTile();
    players.set(me.uid, makePlayer(me.uid, { name: me.name, figure: me.figure, x: spawn.x, y: spawn.y, dir: 2 }));
    void onDisconnect(myRef).remove();
    set(myRef, { name: me.name, figure: me.figure, x: spawn.x, y: spawn.y, dir: 2, ts: serverTimestamp() }).catch(() => kicked("You can't be in that room."));
    setPresenceRoom(me, roomId);

    const denied = () => kicked("You don't have access to that room.");
    unsubs.push(
      onChildAdded(playersRef, (snap) => {
        if (snap.key === me.uid) return;
        const v = snap.val();
        players.set(snap.key!, makePlayer(snap.key!, v));
        renderAvatar({ figure: v.figure, dir: 2 });
        renderOnline();
      }, denied),
      onChildChanged(playersRef, (snap) => {
        if (snap.key === me.uid) return;
        const v = snap.val();
        const p = players.get(snap.key!);
        if (!p) return;
        p.name = v.name;
        p.figure = v.figure;
        if (v.x !== p.dest.x || v.y !== p.dest.y) setDestination(p, { x: v.x, y: v.y });
        const em = v.emote;
        if (em && typeof em.ts === "number" && em.ts !== p.lastEmoteTs) {
          p.lastEmoteTs = em.ts;
          const d = EMOTE_BY_ID[em.id];
          if (d) { p.path = []; startEmote(p, d); }
        }
      }),
      onChildRemoved(playersRef, (snap) => {
        if (snap.key === me.uid) {
          // Our entry vanished while we're still here (e.g. the connection of a page we just reloaded timed out and its
          // "remove me on disconnect" fired late). Put ourselves back where we stand.
          const mineNow = players.get(me.uid);
          if (!disposed && mineNow) {
            const t = currentTile(mineNow);
            void onDisconnect(myRef).remove();
            set(myRef, { name: me.name, figure: me.figure, x: t.x, y: t.y, dir: mineNow.dir, ts: serverTimestamp() }).catch(() => undefined);
          }
          return;
        }
        players.delete(snap.key!);
        if (hoverPlayer?.uid === snap.key) { hoverPlayer = null; updateHint(); }
        renderOnline();
      }),
      onChildAdded(query(chatRef, orderByChild("ts"), limitToLast(40)), (snap) => {
        const m = snap.val();
        if (!m) return;
        log.append(h("div", { class: "line" }, h("b", { class: m.uid === me.uid ? "me" : "" }, m.name + ": "), m.text));
        while (log.children.length > 60) log.firstElementChild?.remove();
        log.scrollTop = log.scrollHeight;
        const p = players.get(m.uid);
        const recent = typeof m.ts === "number" ? m.ts > joinedAt - 15000 : true;
        if (p && recent) p.bubble = { text: m.text, until: performance.now() + BUBBLE_MS };
      }, () => undefined),
      onChildAdded(query(eventsRef, orderByChild("ts"), limitToLast(10)), (snap) => {
        const ev = snap.val();
        if (!ev || typeof ev.ts !== "number" || ev.ts < joinedAt - 3000) return;
        if (ev.type === "syringe") {
          syringeFx.push({ uid: ev.from, start: performance.now(), burst: false });
          return;
        }
        if (ev.type !== "stab") return;
        stabFx.push({ from: ev.from, to: ev.to, start: performance.now(), impact: false, dropped: false });
        if (ev.to === me.uid && ev.from !== me.uid) {
          say(`${players.get(ev.from)?.name ?? "Someone"} stabs you with a knife. It doesn't hurt a bit.`);
        }
      }, () => undefined));
    // the lobby has a CD player; its state is shared with everyone in the room
    if (roomId === LOBBY_ID) unsubs.push(watchCdPlayer(onCdState));
    renderOnline();
  }

  function send(): void {
    const text = input.value.trim().slice(0, MAX_CHARS);
    if (!text) return;
    input.value = "";
    if (text.startsWith("/")) {
      const id = text.slice(1).toLowerCase();
      if (EMOTE_BY_ID[id]) return performEmote(id);
      return say(`Unknown command. Emotes: ${Object.keys(EMOTE_BY_ID).map((e) => "/" + e).join(" ")}`, "warn");
    }
    push(chatRef, { uid: me.uid, name: me.name, text, ts: serverTimestamp() }).catch(console.warn);
  }

  // ---- render helpers ----------------------------------------------------------------
  function frameFor(p: Player, now: number): { opts: Parameters<typeof getCached>[0]; yOff: number } {
    const moving = isMoving(p, now);
    const talking = !!p.bubble && p.bubble.until > now;
    // emotes expire on their own (ms = 0 means "until you move")
    if (p.emote && p.emote.def.ms > 0 && now - p.emote.start > p.emote.def.ms) p.emote = undefined;
    const em = !moving ? p.emote : undefined;
    const t = em ? now - em.start : 0;

    let dir = p.dir;
    let yOff = 0;
    if (em?.def.motion === "spin") dir = SPIN_DIRS[Math.floor(t / 140) % 8];
    if (em?.def.motion === "dance") { dir = SPIN_DIRS[Math.floor(t / 420) % 8]; yOff = -Math.abs(Math.sin(t / 120)) * 6; }
    if (em?.def.motion === "bounce") yOff = -Math.abs(Math.sin(t / 110)) * 7;
    if (em?.def.motion === "hop") yOff = -Math.abs(Math.sin((t / em.def.ms) * Math.PI * 2)) * 16;

    const actions = moving ? ["wlk"] : em?.def.actions ?? ["std"];
    const gesture = talking ? "spk" : em?.def.gesture ?? "std";
    const frame = moving
      ? Math.floor((now - p.stepStart) / (STEP_MS / 4)) % 4
      : talking ? Math.floor(now / 140) % 2
      : em?.def.actions?.includes("wav") ? Math.floor(now / 250) % 2
      : 0;
    return { opts: { figure: p.figure, dir, headDir: dir, actions, gesture, frame }, yOff };
  }

  function drawFurni(f: { kind: string; x: number; y: number; dir?: number }, now: number): Hitbox | null {
    const k = FURNI_KINDS[f.kind];
    if (k.nitro) { drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale); return null; }
    const { A, B, C, D, gd, fill } = drawFurniBase(g, f.kind, f.x, f.y, toScreen, scale);

    if (f.kind === "arcade") {
      // screen + marquee + controls on the face that looks down-left
      const P = (u: number, v: number): Pt => ({ x: D.x + (C.x - D.x) * u, y: D.y + (C.y - D.y) * u + k.height * scale * v });
      const quad = (u0: number, v0: number, u1: number, v1: number, color: string) => fill([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], color);
      quad(0.06, 0.03, 0.94, 0.13, `hsl(${(now / 12) % 360},90%,60%)`); // marquee
      quad(0.14, 0.18, 0.86, 0.52, "#06101a"); // bezel
      const flick = 0.55 + 0.25 * Math.sin(now / 130) + 0.1 * Math.sin(now / 47);
      quad(0.2, 0.22, 0.8, 0.48, `rgba(60,255,150,${flick.toFixed(2)})`); // screen glow
      quad(0.2, 0.56, 0.8, 0.64, "#1b2150"); // control deck
      g.fillStyle = "#e23b3b";
      const b1 = P(0.34, 0.6);
      g.beginPath(); g.arc(b1.x, b1.y, 3 * scale, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#3b7de2";
      const b2 = P(0.64, 0.6);
      g.beginPath(); g.arc(b2.x, b2.y, 3 * scale, 0, Math.PI * 2); g.fill();
    } else if (f.kind === "lamp") {
      const c = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
      const grad = g.createRadialGradient(c.x, c.y, 2, c.x, c.y, 34 * scale);
      grad.addColorStop(0, "rgba(255,240,170,0.55)");
      grad.addColorStop(1, "rgba(255,240,170,0)");
      g.fillStyle = grad;
      g.fillRect(c.x - 40 * scale, c.y - 40 * scale, 80 * scale, 80 * scale);
    } else if (f.kind === "cdplayer") {
      const playing = cdPlaying();
      // the disc on top (spins while playing)
      const c = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
      const rx = 17 * scale;
      const ry = 8.5 * scale;
      g.fillStyle = "#1a1d27";
      g.beginPath(); g.ellipse(c.x, c.y, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = playing ? "#cfd8ee" : "#8d97ab";
      g.beginPath(); g.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2); g.fill();
      if (playing) {
        const a = (now / 260) % (Math.PI * 2);
        g.lineWidth = 2 * scale;
        g.strokeStyle = "rgba(255,255,255,0.9)";
        g.beginPath(); g.ellipse(c.x, c.y, rx * 0.8, ry * 0.8, 0, a, a + 1.0); g.stroke();
        g.strokeStyle = "rgba(124,92,255,0.8)";
        g.beginPath(); g.ellipse(c.x, c.y, rx * 0.55, ry * 0.55, 0, a + 3.1, a + 4.0); g.stroke();
      }
      g.fillStyle = "#10131b";
      g.beginPath(); g.ellipse(c.x, c.y, rx * 0.2, ry * 0.2, 0, 0, Math.PI * 2); g.fill();
      // front: two speaker grills and a status light
      const P = (u: number, v: number): Pt => ({ x: D.x + (C.x - D.x) * u, y: D.y + (C.y - D.y) * u + k.height * scale * v });
      g.fillStyle = "#0e1118";
      for (const u of [0.28, 0.72]) {
        const s = P(u, 0.5);
        g.beginPath(); g.ellipse(s.x, s.y, 5 * scale, 6.5 * scale, 0, 0, Math.PI * 2); g.fill();
      }
      const led = P(0.5, 0.22);
      g.fillStyle = playing ? (Math.floor(now / 400) % 2 ? "#52e07a" : "#2f9c4b") : "#5a2a2a";
      g.beginPath(); g.arc(led.x, led.y, 2.2 * scale, 0, Math.PI * 2); g.fill();
    }

    const xs = [A.x, B.x, C.x, D.x];
    const ys = [A.y, B.y, C.y, D.y, gd(C).y, gd(D).y, gd(B).y];
    return { id: "", x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), depth: f.x + k.w + f.y + k.h - 1 };
  }

  function drawBubble(text: string, name: string, cx: number, bottomY: number, alpha: number): void {
    const font = `${Math.round(12 * Math.max(1, scale))}px Verdana, sans-serif`;
    g.font = font;
    const maxW = 190 * Math.max(1, scale);
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const trial = cur ? cur + " " + w : w;
      if (g.measureText(trial).width > maxW && cur) { lines.push(cur); cur = w; } else cur = trial;
    }
    if (cur) lines.push(cur);
    g.font = `bold ${font}`;
    const nameW = g.measureText(name + ": ").width;
    g.font = font;
    const lh = 15 * Math.max(1, scale);
    const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 18;
    const boxW = Math.max(w, nameW + 18);
    const boxH = lines.length * lh + lh + 8;
    const x = cx - boxW / 2;
    const y = bottomY - boxH - 8;
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = "#fff";
    g.strokeStyle = "rgba(0,0,0,0.35)";
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(x, y, boxW, boxH, 8);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(cx - 5, y + boxH);
    g.lineTo(cx, y + boxH + 7);
    g.lineTo(cx + 5, y + boxH);
    g.fill();
    g.fillStyle = "#111";
    g.textBaseline = "top";
    g.font = `bold ${font}`;
    g.fillText(name, x + 9, y + 5);
    g.font = font;
    lines.forEach((l, i) => g.fillText(l, x + 9, y + 5 + lh * (i + 1)));
    g.restore();
  }

  /** A copy of an avatar frame with a translucent red wash (only over its opaque pixels). */
  function redWash(img: HTMLCanvasElement, alpha: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext("2d")!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = "source-atop";
    x.fillStyle = `rgba(190,20,20,${alpha})`;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  const lungeAmount = (t: number) => (t < 0.3 ? t / 0.3 : t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.4));
  const flashAmount = (t: number) => (t < 0.3 ? 0 : t < 0.9 ? Math.max(0, 0.65 - (t - 0.3) * 1.0) : 0);

  function drawEffects(now: number): void {
    const chest = (p: Player): Pt => {
      const f = feetOf(p, now);
      return { x: f.x, y: f.y - 46 * scale };
    };

    // hit splat + knife swing
    for (const fx of stabFx) {
      const a = players.get(fx.from);
      const b = players.get(fx.to);
      if (!a || !b) continue;
      const t = (now - fx.start) / STAB_MS;
      const ca = chest(a);
      const cb = chest(b);
      if (t >= 0.12 && t < 0.5) {
        const k = Math.min(1, (t - 0.12) / 0.3);
        const x = ca.x + (cb.x - ca.x) * (0.4 + 0.6 * k);
        const y = ca.y + (cb.y - ca.y) * (0.4 + 0.6 * k);
        g.save();
        g.translate(x, y);
        g.rotate(Math.atan2(cb.y - ca.y, cb.x - ca.x) + Math.PI * 0.25);
        g.imageSmoothingEnabled = false;
        const s = 26 * Math.max(1, scale);
        g.drawImage(knifeImg, -s / 2, -s / 2, s, s);
        g.restore();
      }
      if (t >= 0.3 && t < 1.15) {
        const rise = Math.min(1, (t - 0.3) / 0.5) * 14 * scale;
        const sx = cb.x;
        const sy = cb.y - 34 * scale - rise;
        const r = 11 * Math.max(1, scale);
        g.save();
        g.globalAlpha = t > 0.95 ? Math.max(0, (1.15 - t) / 0.2) : 1;
        g.beginPath();
        g.arc(sx, sy, r, 0, Math.PI * 2);
        g.fillStyle = "#2f67a8"; // OSRS "blocked" splat: the stab does 0
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = "#0b2a52";
        g.stroke();
        g.fillStyle = "#fff";
        g.font = `bold ${Math.round(13 * Math.max(1, scale))}px Verdana, sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("0", sx, sy + 1);
        g.restore();
      }
    }

    // syringe pressed into the arm
    for (const fx of syringeFx) {
      const who = players.get(fx.uid);
      if (!who) continue;
      const t = (now - fx.start) / 900;
      if (t > 0.85) continue;
      const c = chest(who);
      const pushIn = t < 0.4 ? t / 0.4 : 1;
      g.save();
      g.translate(c.x - (22 - 8 * pushIn) * scale, c.y + (-6 + 6 * pushIn) * scale);
      g.rotate(Math.PI * 0.25);
      g.imageSmoothingEnabled = false;
      const s = 28 * Math.max(1, scale);
      g.drawImage(syringeImg, -s / 2, -s / 2, s, s);
      g.restore();
    }

    // flying drop of blood from victim to attacker's pouch
    for (const d of dropFx) {
      const a = players.get(d.from);
      const b = players.get(d.to);
      if (!a || !b) continue;
      const k = Math.min(1, (now - d.start) / DROP_FLIGHT_MS);
      const p0 = chest(b);
      const p1 = { x: feetOf(a, now).x, y: feetOf(a, now).y - 60 * scale };
      const ctrl = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 50 * scale };
      const x = (1 - k) * (1 - k) * p0.x + 2 * (1 - k) * k * ctrl.x + k * k * p1.x;
      const y = (1 - k) * (1 - k) * p0.y + 2 * (1 - k) * k * ctrl.y + k * k * p1.y;
      g.imageSmoothingEnabled = false;
      const s = 18 * Math.max(1, scale) * (1 - 0.35 * k);
      g.drawImage(bloodImg, x - s / 2, y - s / 2, s, s);
    }

    // splatter particles
    for (const p of particles) {
      const age = now - p.born;
      const x = p.x + p.vx * age;
      const y = p.y + p.vy * age + 0.0014 * age * age;
      g.globalAlpha = Math.max(0, 1 - age / p.life);
      g.fillStyle = "#b01616";
      const s = 3 * Math.max(1, scale);
      g.fillRect(x, y, s, s);
    }
    g.globalAlpha = 1;

    // music notes drifting up out of the CD player (so you can see where the sound comes from)
    const cdf = def.furni.find((f) => f.kind === "cdplayer");
    if (cdf && notes.length) {
      const k = FURNI_KINDS.cdplayer;
      const base = toScreen(iso(cdf.x + 0.5, cdf.y + 0.5));
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 3;
      g.strokeStyle = "rgba(0,0,0,0.65)";
      for (const n of notes) {
        const age = now - n.born;
        const f = age / n.life;
        const x = base.x + (n.ox + Math.sin(age / 240 + n.phase) * 9) * scale;
        const y = base.y - (k.height + 8) * scale - age * 0.045 * scale;
        g.globalAlpha = f < 0.15 ? f / 0.15 : Math.max(0, 1 - (f - 0.55) / 0.45);
        g.font = `bold ${Math.round((18 + 6 * Math.sin(n.phase)) * Math.max(1, scale))}px "Segoe UI Symbol", "Apple Symbols", sans-serif`;
        g.strokeText(n.glyph, x, y);
        g.fillStyle = n.color;
        g.fillText(n.glyph, x, y);
      }
      g.globalAlpha = 1;
    }

    // emote glyphs floating above heads
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${Math.round(20 * Math.max(1, scale))}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    for (const gl of glyphs) {
      const p = players.get(gl.uid);
      if (!p) continue;
      const age = now - gl.born;
      const f = feetOf(p, now);
      g.globalAlpha = Math.max(0, 1 - age / gl.life);
      g.fillText(gl.glyph, f.x + gl.ox * scale, f.y - (FEET_Y + 6) * scale - age * 0.035 * scale);
    }
    g.globalAlpha = 1;

    // floating "+1"
    for (const f of floaters) {
      const age = now - f.born;
      g.globalAlpha = Math.max(0, 1 - age / 1100);
      g.font = `bold ${Math.round(16 * Math.max(1, scale))}px Verdana, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 3;
      g.strokeStyle = "#000";
      g.strokeText(f.text, f.x, f.y - age * 0.04);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, f.y - age * 0.04);
    }
    g.globalAlpha = 1;
    g.textAlign = "start";
  }

  function updateEffects(now: number): void {
    for (let i = stabFx.length - 1; i >= 0; i--) {
      const fx = stabFx[i];
      const t = (now - fx.start) / STAB_MS;
      const b = players.get(fx.to);
      if (!fx.impact && t >= 0.3) {
        fx.impact = true;
        if (b) {
          const f = feetOf(b, now);
          for (let k = 0; k < 9; k++) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
            const sp = 0.05 + Math.random() * 0.09;
            particles.push({ x: f.x, y: f.y - 46 * scale, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, born: now, life: 650 + Math.random() * 250 });
          }
        }
      }
      if (!fx.dropped && t >= 0.5) {
        fx.dropped = true;
        dropFx.push({ from: fx.from, to: fx.to, start: now });
      }
      if (t > 1.3) stabFx.splice(i, 1);
    }
    for (let i = dropFx.length - 1; i >= 0; i--) {
      const d = dropFx[i];
      if (now - d.start >= DROP_FLIGHT_MS) {
        const a = players.get(d.from);
        if (a && d.from === me.uid) {
          const f = feetOf(a, now);
          floaters.push({ text: "+1", x: f.x, y: f.y - 70 * scale, born: now, color: "#ff5252" });
        }
        dropFx.splice(i, 1);
      }
    }
    // music notes while a CD is playing
    if (cdPlaying() && now - lastNote > 360) {
      lastNote = now;
      const glyphsPool = ["♪", "♫", "♬", "♩"];
      const colors = ["#ffd54a", "#ff7fbf", "#7fe3ff", "#9dff8a"];
      notes.push({ born: now, life: 2200, glyph: glyphsPool[Math.floor(Math.random() * 4)], ox: (Math.random() - 0.5) * 22, phase: Math.random() * 6, color: colors[Math.floor(Math.random() * 4)] });
    }
    for (let i = notes.length - 1; i >= 0; i--) if (now - notes[i].born > notes[i].life) notes.splice(i, 1);

    // syringe: a burst of blood once the needle is in
    for (let i = syringeFx.length - 1; i >= 0; i--) {
      const fx = syringeFx[i];
      const t = (now - fx.start) / 900;
      const who = players.get(fx.uid);
      if (!fx.burst && t >= 0.45) {
        fx.burst = true;
        if (who) {
          const f = feetOf(who, now);
          for (let k = 0; k < 7; k++) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            const sp = 0.04 + Math.random() * 0.06;
            particles.push({ x: f.x - 8 * scale, y: f.y - 44 * scale, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, born: now, life: 600 + Math.random() * 250 });
          }
          if (fx.uid === me.uid) floaters.push({ text: `+${SYRINGE_BLOOD}`, x: f.x, y: f.y - 70 * scale, born: now, color: "#ff5252" });
        }
      }
      if (t > 1.2 || !who) syringeFx.splice(i, 1);
    }

    // emote glyph spawner
    for (const p of players.values()) {
      const em = p.emote;
      if (em?.def.fx && now - em.lastFx > 420 && !isMoving(p, now)) {
        em.lastFx = now;
        glyphs.push({ uid: p.uid, glyph: em.def.fx[Math.floor(Math.random() * em.def.fx.length)], born: now, life: 1500, ox: (Math.random() - 0.5) * 30 });
      }
    }
    for (let i = glyphs.length - 1; i >= 0; i--) if (now - glyphs[i].born > glyphs[i].life) glyphs.splice(i, 1);
    for (let i = particles.length - 1; i >= 0; i--) if (now - particles[i].born > particles[i].life) particles.splice(i, 1);
    for (let i = floaters.length - 1; i >= 0; i--) if (now - floaters[i].born > 1100) floaters.splice(i, 1);
  }

  /** Translucent footprint of the piece the owner is about to place. */
  function drawGhost(): void {
    if (!tool || tool === "pickup" || !hover || !isOwner()) return;
    const k = FURNI_KINDS[tool];
    if (!k) return;
    const fp = footprint(tool, toolDir);
    for (let i = 0; i < fp.w; i++) {
      for (let j = 0; j < fp.h; j++) {
        const x = hover.x + i;
        const y = hover.y + j;
        const ok = walkable(x, y);
        const p = toScreen(iso(x, y));
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x + (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
        g.lineTo(p.x, p.y + TILE_H * scale);
        g.lineTo(p.x - (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
        g.closePath();
        g.fillStyle = ok ? "rgba(80,220,120,0.45)" : "rgba(230,70,70,0.45)";
        g.fill();
      }
    }
    if (k.nitro) drawNitroFurni(g, tool, hover.x, hover.y, toolDir, toScreen, scale, 0.6);
  }

  let raf = 0;
  function loop(): void {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    if (!active) return;
    const now = performance.now();
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = scale < 1;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(floor, offX - floorOrigin.x * scale, offY - floorOrigin.y * scale, floor.width * scale, floor.height * scale);
    doorBox = drawDoor(g, def.doorX, toScreen, scale, doorLabel, hoverDoor ? 1 : 0);

    if (!started) return;
    for (const p of players.values()) advance(p, now);
    processPending(now);
    tickCd();
    updateEffects(now);

    if (hover && !(tool && tool !== "pickup")) {
      const p = toScreen(iso(hover.x, hover.y));
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.lineTo(p.x, p.y + TILE_H * scale);
      g.lineTo(p.x - (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.closePath();
      g.strokeStyle = tool === "pickup" ? "rgba(255,170,60,0.95)" : "rgba(255,255,255,0.9)";
      g.lineWidth = 2;
      g.stroke();
    }
    drawGhost();

    type Drawable = { depth: number; draw: () => void };
    const list: Drawable[] = [];
    const boxes: Hitbox[] = [];
    const objs: Hitbox[] = [];
    const bubbles: Array<() => void> = [];

    for (const f of def.furni) {
      list.push({
        // flat pieces lie on the floor, so they're drawn before (underneath) everyone else
        depth: FURNI_KINDS[f.kind].flat ? -1 : f.x + footprint(f.kind, f.dir).w + f.y + footprint(f.kind, f.dir).h - 1,
        draw: () => {
          const box = drawFurni(f, now);
          if (box && INTERACTIVE_KINDS.has(f.kind)) objs.push({ ...box, id: f.id, kind: f.kind });
        },
      });
    }

    for (const p of players.values()) {
      const pos = posOf(p, now);
      const { opts, yOff } = frameFor(p, now);
      let img = getCached(opts);
      if (!img) { renderAvatar(opts); img = p.last; } else p.last = img;
      const feet = feetOf(p, now);

      // stab animation: attacker lunges toward the victim, victim flashes red
      let lunge: Pt = { x: 0, y: 0 };
      let flash = 0;
      for (const fx of stabFx) {
        const t = (now - fx.start) / STAB_MS;
        if (t > 1) continue;
        if (fx.from === p.uid) {
          const victim = players.get(fx.to);
          if (victim) {
            const vf = feetOf(victim, now);
            const dx = vf.x - feet.x;
            const dy = vf.y - feet.y;
            const len = Math.hypot(dx, dy) || 1;
            const amt = lungeAmount(t) * 16 * scale;
            lunge = { x: (dx / len) * amt, y: (dy / len) * amt };
          }
        }
        if (fx.to === p.uid) flash = Math.max(flash, flashAmount(t));
      }
      const lift = yOff * scale;

      boxes.push({ id: p.uid, x0: feet.x - 22 * scale, x1: feet.x + 22 * scale, y0: feet.y - FEET_Y * scale, y1: feet.y + 8 * scale, depth: pos.x + pos.y });
      list.push({
        depth: pos.x + pos.y + 0.5,
        draw: () => {
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath();
          g.ellipse(feet.x + lunge.x, feet.y + lunge.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
          g.fill();
          if (img) {
            const ax = feet.x + lunge.x - 32 * scale;
            const ay = feet.y + lunge.y + lift - FEET_Y * scale;
            g.drawImage(img, ax, ay, img.width * scale, img.height * scale);
            if (flash > 0.02) g.drawImage(redWash(img, flash), ax, ay, img.width * scale, img.height * scale);
          }
          // name plate (highlighted while it's a valid stab target)
          const targeted = hoverPlayer?.uid === p.uid && p.uid !== me.uid && selectedDef()?.useOnPlayer === "stab";
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, sans-serif`;
          const tw = g.measureText(p.name).width + 10;
          g.fillStyle = targeted ? "rgba(150,20,20,0.85)" : "rgba(0,0,0,0.55)";
          g.beginPath();
          g.roundRect(feet.x - tw / 2, feet.y + 7 * scale, tw, 14 * Math.max(1, scale), 5);
          g.fill();
          g.fillStyle = p.uid === me.uid ? "#ffe27a" : "#fff";
          g.textBaseline = "top";
          g.textAlign = "center";
          g.fillText(p.name, feet.x, feet.y + 9 * scale);
          g.textAlign = "start";
        },
      });
      if (p.bubble && p.bubble.until > now) {
        const left = p.bubble.until - now;
        const b = p.bubble;
        bubbles.push(() => drawBubble(b.text, p.name, feet.x, feet.y - (FEET_Y + 4) * scale, left < 800 ? left / 800 : 1));
      }
    }
    hitboxes = boxes;
    list.sort((a, b) => a.depth - b.depth).forEach((d) => d.draw());
    objBoxes = objs;
    drawEffects(now);
    bubbles.forEach((b) => b());
  }

  // ---- boot --------------------------------------------------------------------------
  async function init(): Promise<void> {
    if (roomId === LOBBY_ID) {
      applyDef(lobbyDef());
      start();
      unsubs.push(watchLobbyFurni((extras) => { if (!disposed) applyDef(lobbyDef(extras)); })); // pieces the admin added
      return;
    }
    try {
      const meta = await fetchMeta(roomId);
      if (disposed) return;
      if (!meta) return kicked("That room doesn't exist.");
      if (!(await canEnter(meta, me.uid, social.friendUids()))) return kicked(`${meta.ownerName}'s room is closed. Knock on the door of the public room to ask.`);
      if (disposed) return;
      applyDef(defFromMeta(roomId, meta));
      start();
      unsubs.push(watchMeta(roomId, (m) => {
        if (!m) return kicked("This room was deleted.");
        applyDef(defFromMeta(roomId, m));
      }, () => kicked("You can't be in that room any more.")));
    } catch {
      kicked("Couldn't open that room.");
    }
  }

  applyDef(def);
  raf = requestAnimationFrame(loop);
  void init();

  function dispose(): void {
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObs.disconnect();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keydown", onRotateKey);
    unsubs.forEach((u) => u());
    endPress();
    doorApi?.close();
    closeCdPopup();
    cdAudio.stop(); // leaving the lobby = you can't hear the CD player any more (your CD stays in it until it ends)
    if (unblockHandler) window.removeEventListener("pointerdown", unblockHandler);
    panel.dispose();
    if (started) {
      void onDisconnect(myRef).cancel();
      void remove(myRef);
    }
    setPresenceRoom(me, "");
  }

  return {
    dispose,
    show() {
      active = true;
      panel.refresh();
      layout();
      ctx.refreshHeader();
    },
    hide() {
      active = false;
      closeCdPopup();
      closeMenu();
      doorApi?.close();
    },
    figureChanged() {
      const p = mine();
      if (!p) return;
      p.figure = me.figure;
      void renderAvatar({ figure: me.figure, dir: 2 });
      update(myRef, { figure: me.figure }).catch(() => undefined);
    },
  };
}
