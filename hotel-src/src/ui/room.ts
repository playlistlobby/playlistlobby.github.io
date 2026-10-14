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
import { canStab, carveCat, combineSlots, debugCommand, eatItem, fillCan, finishSmoke, harvestPlant, lightItem, plantProgress, plantSeed, plantWater, swallowPill, waterPlant, rewardFlappyDrop, CAT_BLOOD, dumpsterWaitMs, msUntilTomorrow, searchDumpster, rewardStab, rewardSyringe, sixtyGiveKnife, SYRINGE_BLOOD, serverNow, FIRST_BLOOD, JOB_REWARD, jobReady, jobWaitMs, rewardFirstStab, sixtyGivePill, sixtyJobMoney, sixtyJobReward, syringeWaitMs } from "../db";
import { itemEntry } from "../shopConfig";
import { Drop, dropItem, isExpired, landingTile, pickUpDrop, sweepExpired, watchDrops, whyNotDrop, dropKey } from "../drops";
import { DropConfirmApi, openDropConfirm } from "./dropConfirm";
import { LEGEND, SIXTY, SIXTY_LINES, sixtyLook, watchSixtyLook } from "../npc";
import { openSixtyShop, SixtyShopApi } from "./sixtyShop";
import { logAction } from "../logger";
import { BLOOD_ICON, findSlot, GROW_MS, itemDef, ITEMS, SMOKABLE, SMOKE_MS } from "../items";
import { CdAudio, CdState, cdEnded, clearCdPlayer, insertCd, reconcileCd, watchCdPlayer } from "../cdplayer";
import { fmtTime } from "../music";
import { EMOTE_BY_ID, EmoteDef, hasEmote, SPIN_DIRS } from "../emotes";
import {
  canEnter,
  defFromMeta,
  FURNI_KINDS,
  INTERACTIVE_KINDS,
  BED,
  BED_ID,
  bedHead,
  bedSide,
  fetchMeta,
  footprint,
  isDoorTile,
  isFixedLobbyPiece,
  lobbyDef,
  LOBBY_ID,
  MAX_FURNI,
  ownRoomId,
  placeFurni,
  removeFurni,
  RoomDef,
  ExtraDoor,
  PlacedFurni,
  isDisplayPiece,
  isBodyBag,
  isPublicRoom,
  SHOP_ID,
  shopDef,
  tutDef,
  tutRoomId,
  watchLobbyFurni,
  watchMeta,
} from "../rooms";
import { derive, loadNitro, NitroFurni, nitroIfReady, spritesFor } from "../nitro";
import { onFurniShopChanged, picksToday, priceOf } from "../furniShop";
import { FurniBuyApi, openFurniBuy } from "./furniBuy";
import { openVending, VendingApi } from "./vendingShop";
import { IntercomApi, openIntercom } from "./intercom";
import { MixerApi, openMixer } from "./mixer";
import { FurnishApi, mountFurnishUi } from "./furnish";
import { canTurn, defaultDir, isFixedPiece, nextDir, movePiece, placeFromInventory, placeFromStorage, placedCount, Spot, storeFromInventory, storeFromRoom, takeFromStorage, whyNot } from "../furnishing";
import { Box, drawNitroSprites, drawFurniBase, drawRoomDoor, ensureDoorArt, drawNitroFurni, ensureFurniSprites, ensureTextures, iso, Pt, renderRoomShell, shade, TILE_H, TILE_W } from "../roomRender";
import { fetchProfile, setPresenceRoom, social } from "../social";
import { openArcade } from "../arcade/arcade";
import { h, toast } from "./dom";
import { closeMenu, showMenu } from "./contextMenu";
import { mountSidePanel } from "./sidepanel";
import { mountRoomPanel } from "./roomPanel";
import { DoorApi, openDoor } from "./door";
import { assetUrl } from "../assetUrl";
import { playSfx } from "../sfx";
import { setAmbience, setShopMusic } from "../ambience";
import type { Ctx } from "../main";

/** The hanger that floats above the bag of clothes in your own room (it's Habbo's own wardrobe icon). */
const hangerImg = new Image();
hangerImg.src = assetUrl("ui/hanger.png");
/** the picture that floats over the toolbox: the little wooden house icon from xmas_c20_woodenhouse.nitro */
const toolIconImg = new Image();
void loadNitro("furni/xmas_c20_woodenhouse.nitro").then((n) => {
  if (!n) return;
  const key = Object.keys(n.json.spritesheet.frames).find((k) => /_icon_a(.png)?$/.test(k));
  const fr = key ? n.json.spritesheet.frames[key].frame : null;
  if (!fr) return;
  const c = document.createElement("canvas");
  c.width = fr.w; c.height = fr.h;
  c.getContext("2d")!.drawImage(n.image, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
  toolIconImg.src = c.toDataURL("image/png");
}).catch(() => undefined);

/** the picture that floats over the vending machine: the basket icon from market_c19_basket.nitro */
const basketIconImg = new Image();
void loadNitro("furni/market_c19_basket.nitro").then((n) => {
  if (!n) return;
  const key = Object.keys(n.json.spritesheet.frames).find((k) => /_icon_a(.png)?$/.test(k));
  const fr = key ? n.json.spritesheet.frames[key].frame : null;
  if (!fr) return;
  const c = document.createElement("canvas");
  c.width = fr.w; c.height = fr.h;
  c.getContext("2d")!.drawImage(n.image, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
  basketIconImg.src = c.toDataURL("image/png");
}).catch(() => undefined);

/** The growing kit's art is a potted plant; the empty pot is the same sheet with everything above the rim wiped out. */
let potArt: NitroFurni | null = null;
void loadNitro("furni/mafia_c26_planter_white.nitro").then((n) => {
  if (!n) return;
  potArt = derive(n, (g) => {
    for (const [key, f] of Object.entries(n.json.spritesheet.frames)) {
      if (!/_64_a_/.test(key)) continue;
      const { x, y, w, h } = f.frame;
      if (w < 30 || h < 30) continue;
      // the sprite is a plant that covers its own pot: wipe it and paint a bare pot (gold rim, dark soil, pale bowl, dark foot) in its place
      g.clearRect(x, y, w, h);
      const cx = w / 2 - 0.5, top = Math.round(h * 0.64);
      const px = (ix: number, iy: number, c: string) => { g.fillStyle = c; g.fillRect(x + Math.round(ix), y + iy, 1, 1); };
      for (let iy = top; iy < h; iy++) {
        const t = (iy - top) / (h - top);
        const hw = 16 - t * 6.5; // the bowl narrows towards the foot
        for (let ix = Math.ceil(cx - hw); ix <= Math.floor(cx + hw); ix++) {
          const edge = ix <= cx - hw + 1 || ix >= cx + hw - 1 || iy >= h - 1;
          const foot = iy > h - 6;
          const shade = ix < cx - hw * 0.35 ? "#ebe7e2" : ix < cx + hw * 0.3 ? "#d6d1cb" : "#b8b1aa";
          px(ix, iy, edge ? "#5c554f" : foot ? "#5a3d2b" : shade);
        }
      }
      for (let iy = top - 8; iy <= top + 6; iy++) for (let ix = 0; ix < w; ix++) {
        const dx = (ix - cx) / 16.5, dy = (iy - (top - 1)) / 5.6;
        if (dx * dx + dy * dy <= 1) px(ix, iy, "#e8a63a"); // the gold rim
        const sx = (ix - cx) / 13.5, sy = (iy - (top - 1.6)) / 3.8;
        if (sx * sx + sy * sy <= 1) px(ix, iy, sy < -0.2 ? "#3d2716" : "#4f321c"); // the dark soil
        if (dx * dx + dy * dy <= 1 && dx * dx + dy * dy > 0.86 && iy < top) px(ix, iy, "#f6d27a"); // the rim's lit edge
      }
    }
  });
}).catch(() => undefined);
const itemImgs = new Map<string, HTMLImageElement>();
const itemImg = (id: string): HTMLImageElement => {
  let im = itemImgs.get(id);
  if (!im) { im = loadImg(itemDef(id)?.icon ?? ""); itemImgs.set(id, im); }
  return im;
};

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
  /** drawn lying on the bed (an offline owner asleep, or you waking up) */
  lying?: boolean;
  /** an offline owner shown asleep: not in the database, just drawn here */
  sleeper?: boolean;
  /** when this player lit a cigarette (server time, ms); they smoke for SMOKE_MS */
  smoke?: number;
  /** what they are smoking: "cigarette" (or nothing), "joint" or "blunt" */
  smokeKind?: string;
  /** walking twice as fast until this time (server time, ms) */
  fast?: number;
  /** flashing with smoke pouring off them until this time */
  chem?: number;
  /** the admin playing 6ixty: clicking them talks to 6ixty instead of offering the knife */
  npc?: boolean;
  /** sitting on a chair or couch (shown to everyone through players/<uid>/sit) */
  sit?: boolean;
  /** passed out on the floor (a pill from 6ixty; shown to everyone through players/<uid>/lay) */
  faint?: boolean;
  /** you clicked a seat: where to sit once you've walked there, and which way to face */
  sitTo?: { x: number; y: number; dir: number };
}

interface StabFx { from: string; to: string; start: number; impact: boolean; dropped: boolean }
interface SyringeFx { uid: string; start: number; burst: boolean }
interface DropFx { from: string; to: string; start: number }
interface Particle { x: number; y: number; vx: number; vy: number; born: number; life: number }
interface Floater { text: string; x: number; y: number; born: number; color: string; icon?: HTMLImageElement; life?: number }
interface GlyphFx { uid: string; glyph: string; born: number; life: number; ox: number }
interface Hitbox { id: string; kind?: string; x0: number; y0: number; x1: number; y1: number; depth: number }
interface NoteFx { born: number; life: number; glyph: string; ox: number; phase: number; color: string }

type Pending =
  | { type: "stab"; uid: string; since: number; lastTry: number }
  | { type: "door"; since: number; lastTry: number; to?: ExtraDoor }
  | { type: "sixty"; since: number; lastTry: number; auto?: boolean }
  | { type: "pickup"; key: string; since: number; lastTry: number }
  | { type: "arcade" | "cd" | "bag" | "dumpster" | "use"; fid: string; since: number; lastTry: number; slot?: number | null };

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
/** Where the hand ends up in the avatar's "carry" pose, per facing (0..7), as pixels from the feet; measured from the avatar sprites. */
const KNIFE_HAND: Array<[number, number]> = [[25, -24], [17, -22], [-8, -24], [-10, -26], [-23, -24], [-17, -24], [14, -26], [15, -24]];
/** The way the knife picture of each direction points on screen (a 2:1 isometric view): up-right, right, down-right, down, down-left, left, up-left, up. */
const KNIFE_AXIS: Array<[number, number]> = [[0.894, -0.447], [1, 0], [0.894, 0.447], [0, 1], [-0.894, 0.447], [-1, 0], [-0.894, -0.447], [0, -1]];
/** the knife as furniture art: eight pictures, one per direction, used to draw it in a player's hand */
const KNIFE_NITRO = "furni/survival_c26_knife.nitro";
void loadNitro(KNIFE_NITRO);
const bloodImg = loadImg(BLOOD_ICON);
const syringeImg = loadImg(ITEMS.syringe.icon);
const cigaretteImg = loadImg(ITEMS.cigarette.icon);
const deadcatImg = loadImg(ITEMS.deadcat.icon);
const burgerImg = loadImg(ITEMS.burger.icon);

/** Where the lying avatar's 110x64 picture sits relative to the bed-head tile's floor point (tuned by eye against the bed art). */
const LAY_DX = -76;
const LAY_DY = -76;

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

export interface RoomOpts {
  /** how you come in: through the door (default) or standing by your bed (login) */
  arrival?: "door" | "bed";
  /** play the first-time wake-up: lying in bed, eyes opening, then getting up */
  intro?: boolean;
  /** the room you walked in from (you appear in front of the door that leads back to it) */
  from?: string;
}

const WAKE_MS = 2300;

export function mountRoom(root: HTMLElement, ctx: Ctx, roomId: string, opts: RoomOpts = {}): RoomApi {
  const me = ctx.profile;
  const players = new Map<string, Player>();
  const unsubs: Unsubscribe[] = [];
  let disposed = false;
  let started = false;
  let active = true;
  /** while now < introUntil the player lies in bed (the wake-up); 0 = no intro */
  let introUntil = 0;
  /** things lying on the floor of this room (rooms/<room>/drops), by tile */
  let drops = new Map<string, Drop>();
  let dropConfirmApi: DropConfirmApi | null = null;
  const isOwnRoom = roomId === ownRoomId(me.uid);
  /** the private copy of the basement a new player does the introduction in; it looks and works like the basement, but nobody else comes in */
  const isTut = roomId === tutRoomId(me.uid);
  const isBasement = roomId === LOBBY_ID || isTut;
  // The admin account IS 6ixty: in every room they show up as him (his name and look), and in the basement they stand
  // at his spot, can't move, and talk as him.
  const asSixty = me.isAdmin;
  const frozen = asSixty && roomId === LOBBY_ID;
  const shownName = asSixty ? SIXTY.name : me.name;
  const shownFigure = (): string => (asSixty ? sixtyLook().figure : me.figure);

  let def: RoomDef = lobbyDef();
  const blocked = new Set<string>();

  let hover: Pt | null = null;
  let hoverPlayer: Player | null = null;
  let hitboxes: Hitbox[] = [];
  let objBoxes: Hitbox[] = [];
  let hoverObj: Hitbox | null = null;
  let hoverDoor = false;
  let doorBox: Box | null = null;
  let extraDoorBoxes: Array<{ box: Box; door: ExtraDoor }> = [];
  let hoverExtra = -1;
  let furniBuyApi: FurniBuyApi | null = null;
  let vendingApi: VendingApi | null = null;
  let intercomApi: IntercomApi | null = null;
  let mixerApi: MixerApi | null = null;
  // the furnishing menu (toolbox): your room without you in it, pieces to drag around, storage
  let furnishOn = false;
  let furnishUi: FurnishApi | null = null;
  let fzSel: string | null = null;
  let fzPlacing: { kind: string; source: "inv" | "storage"; slot?: number } | null = null;
  let fzDir = 6;
  let fzDrag: { id: string; kind: string; grab: Pt; moved: boolean; spot: Spot } | null = null;
  let furniBoxes: Array<{ id: string; box: Box; depth: number }> = [];
  let doorApi: DoorApi | null = null;

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
  const zzzAt = new Map<string, number>();

  /** you can edit your own room; the admin can also edit the public room's extra furniture */
  const isOwner = () => def.ownerUid === me.uid || (def.id === LOBBY_ID && me.isAdmin);

  // ---- DOM ---------------------------------------------------------------------
  const canvas = h("canvas", { class: "room-canvas" });
  const log = h("div", { class: "chat-log" });
  const online = h("div", { class: "online", title: "Who's in this room", onclick: () => online.classList.toggle("open") });
  const roomTitle = h("div", { class: "room-title" }, isBasement ? "Main Lobby" : "Loading room…");
  const actionHint = h("div", { class: "action-hint hidden" });
  const input = h("input", { class: "chat-input", type: "text", maxLength: MAX_CHARS, placeholder: "Say something, or try /dance. Tap the floor to walk.", autocomplete: "off" });
  const stage = h("div", { class: "stage" }, canvas, online, log, actionHint, roomTitle);
  const sideHost = h("div", { class: "side-host" });
  root.append(h("div", { class: "room" },
    h("div", { class: "room-main" }, stage, sideHost),
    h("form", { class: "chat-bar", onsubmit: (e: Event) => { e.preventDefault(); send(); } }, input, h("button", { class: "btn primary", type: "submit" }, "Send"))));
  const g = canvas.getContext("2d")!;

  // Every chat line disappears 15 minutes after it was said; the swept-out messages are also deleted from the database.
  const CHAT_LIFE_MS = 15 * 60_000;
  const lines: Array<{ el: HTMLElement; exp: number; msg?: ReturnType<typeof ref> }> = [];
  function addLine(el: HTMLElement, lifeMs: number, msg?: ReturnType<typeof ref>): void {
    log.append(el);
    lines.push({ el, exp: Date.now() + lifeMs, msg });
    while (log.children.length > 60) log.firstElementChild?.remove();
    log.scrollTop = log.scrollHeight;
  }
  function sweepChat(): void {
    const now = Date.now();
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      if (!l.el.isConnected) lines.splice(i, 1);
      else if (l.exp <= now) {
        l.el.remove();
        if (l.msg) void remove(l.msg).catch(() => undefined);
        lines.splice(i, 1);
      }
    }
  }

  /** Game messages (OSRS "chatbox" lines) that only you see. */
  function say(text: string, kind: "game" | "warn" = "game"): void {
    addLine(h("div", { class: `line sys ${kind}` }, text), CHAT_LIFE_MS);
  }

  const panel = mountSidePanel(sideHost, ctx, {
    say,
    onSelect: (slot) => {
      selectedSlot = slot;
      pending = null;
      updateHint();
      tutorialGuide();
      // in the furnishing menu, tapping a piece of furniture you carry picks it up to put down (the same as tapping it in the tray)
      const it = slot !== null ? me.inventory[slot] : null;
      if (furnishOn && it && itemDef(it.item)?.furniture) {
        fzPlacing = { kind: it.item, source: "inv", slot: slot! };
        fzDir = defaultDir(it.item);
        fzSel = null;
        furnishUi?.refresh();
      } else if (furnishOn && slot === null && fzPlacing?.source === "inv") { fzPlacing = null; furnishUi?.refresh(); }
    },
    onEmote: (id) => performEmote(id),
    onCarve: (slot) => { void carveDeadCat(slot); },
    onUseSelf: (what, slot) => { if (what === "syringe") void useSyringe(); else if (what === "pill") void usePill(); else if (what === "eat") void eatBurger(); else void lightUp(slot); },
    onDropPick: (slot) => askDrop(slot),
    onCombine: (a, b) => { void combineSlots(me, a, b).then((note) => { panel.refresh(); say(note); }, (err) => say((err as Error).message, "warn")); },
    roomTab: isPublicRoom(roomId) && !me.isAdmin ? undefined : {
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

  const selectedDef = () => (selectedSlot !== null && me.inventory[selectedSlot] ? itemDef(me.inventory[selectedSlot]!.item) ?? null : null);

  function updateHint(): void {
    const item = selectedDef();
    let text = "";
    if (tool && isOwner()) text = tool === "pickup" ? "Pick up furniture: click it" : `Place ${FURNI_KINDS[tool]?.label ?? tool}: click a tile${FURNI_KINDS[tool]?.rotatable ? " (R turns it)" : ""}`;
    else if (item?.useOnObject) text = hoverObj && hoverObj.kind === item.useOnObject ? `Use ${item.name} → ${FURNI_KINDS[hoverObj.kind].label}` : `Use ${item.name} →`;
    else if (item) text = hoverPlayer && hoverPlayer.uid !== me.uid ? `Use ${item.name} → ${hoverPlayer.name}` : `Use ${item.name} →`;
    else if (hoverPlayer) text = hoverPlayer.name;
    else if (hoverObj && hoverObj.kind === "npc") text = SIXTY.name;
    else if (hoverObj && hoverObj.kind === "drop") { const dd = drops.get(hoverObj.id.slice(5)); text = dd ? `${itemDef(dd.item)?.name ?? dd.item}${dd.qty > 1 ? ` x${dd.qty}` : ""}${dd.ass ? " (ass)" : ""} · dropped by ${dd.byName} (click to pick up)` : "On the floor"; }
    else if (hoverObj && isDisplayPiece(hoverObj.id)) text = `${FURNI_KINDS[hoverObj.kind!].label} · ${priceOf(hoverObj.kind!)} drops (click to buy)`;
    else if (hoverObj && hoverObj.kind === "wardrobe") text = "Wardrobe: the clothing shop";
    else if (hoverObj && hoverObj.kind === "vending") text = "Vending machine";
    else if (hoverObj && hoverObj.kind === "sink") text = "Sink: fill your watering can";
    else if (hoverObj && hoverObj.kind === "intercom") text = "Door intercom: who may come in";
    else if (hoverObj && hoverObj.kind === "f_mixer") text = "Mixer: mix two things";
    else if (hoverObj && isBodyBag(hoverObj.kind)) text = "Body bag: use a syringe on it";
    else if (hoverObj && FURNI_KINDS[hoverObj.kind ?? ""]?.plant) { const pf = def.furni.find((x) => x.id === hoverObj!.id); text = pf?.plant ? `Growing kit · ${Math.round(plantProgress(pf.plant) * 100)}% · water ${Math.round(plantWater(pf.plant) * 100)}%` : "Growing kit (empty): plant a seed"; }
    else if (hoverObj && hoverObj.kind) text = FURNI_KINDS[hoverObj.kind].label;
    else if (hoverExtra >= 0 && def.extraDoors?.[hoverExtra]) text = `Door: ${def.extraDoors[hoverExtra].label}`;
    else if (hoverDoor) text = isOwnRoom ? "Door: to the basement" : isTut ? "Door: back to your room" : def.doorTo ? "Door: back to the basement" : "Door: rooms";
    actionHint.textContent = text;
    actionHint.classList.toggle("hidden", !text);
    canvas.style.cursor = item || tool ? "crosshair" : "pointer";
  }

  // ---- room geometry ---------------------------------------------------------------
  function rebuildBlocked(): void {
    blocked.clear();
    blocked.add(`${def.doorX},0`); // the door itself stands on this tile; you use it from beside or in front of it
    for (const d of def.extraDoors ?? []) blocked.add(`${d.x},0`);
    seatTiles.clear();
    if (isBasement) blocked.add(`${SIXTY.x},${SIXTY.y}`); // 6ixty stands in the basement
    for (const f of def.furni) {
      const k = FURNI_KINDS[f.kind];
      if (k.flat) continue; // flat pieces (a label on the floor) can be walked over
      const fp = footprint(f.kind, f.dir);
      for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) {
        blocked.add(`${f.x + i},${f.y + j}`);
        if (k.seat && !isDisplayPiece(f.id)) seatTiles.set(`${f.x + i},${f.y + j}`, f);
      }
    }
  }
  const bedPiece = () => def.furni.find((f) => f.id === BED_ID) ?? { ...BED, id: BED_ID, kind: "bed" };
  const headTile = (): Pt => bedHead(bedPiece());
  /** every tile of every piece you can sit on -> the piece (the tiles are blocked for walking, but you may step onto one to sit) */
  const seatTiles = new Map<string, PlacedFurni>();
  const walkable0 = (x: number, y: number) => x >= 0 && y >= 0 && x < def.w && y < def.h && !blocked.has(`${x},${y}`);
  /** the free tile nearest to a wanted one (the bed's side may have been moved against a wall) */
  function nearestWalkable(want: Pt): Pt {
    let best: Pt = want, bd = Infinity;
    for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
      if (!walkable0(x, y)) continue;
      const d = Math.hypot(x - want.x, y - want.y);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  }
  const sideTile = (): Pt => nearestWalkable(bedSide(bedPiece()));
  const walkable = (x: number, y: number) => x >= 0 && y >= 0 && x < def.w && y < def.h && !blocked.has(`${x},${y}`);

  /** 8-directional BFS; diagonals can't cut corners. Returns tiles after `start`, [] if unreachable. */
  function findPath(start: Pt, goal: Pt): Pt[] {
    const seatGoal = seatTiles.has(`${goal.x},${goal.y}`);
    if ((!walkable(goal.x, goal.y) && !seatGoal) || (start.x === goal.x && start.y === goal.y)) return [];
    const open = (x: number, y: number) => walkable(x, y) || (seatGoal && x === goal.x && y === goal.y);
    const key = (p: Pt) => p.y * def.w + p.x;
    const prev = new Map<number, Pt | null>([[key(start), null]]);
    const queue: Pt[] = [start];
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      if (cur.x === goal.x && cur.y === goal.y) break;
      for (const [dx, dy] of DIRS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!open(nx, ny) || prev.has(ny * def.w + nx)) continue;
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
    void ensureDoorArt();
    // textured floors/walls need their images first; draw again once they're in
    const forDef = def;
    void ensureTextures(def.theme).then(() => {
      if (disposed || def !== forDef || (!def.theme.floorTex && !def.theme.wallTex)) return;
      const again = renderRoomShell(def);
      floor = again.canvas;
      floorOrigin = again.origin;
    });
    roomTitle.textContent = def.ownerName ? `${def.name} · by ${def.ownerName}` : def.name;
    stage.classList.toggle("horror", def.theme.style === "grime");
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
    const he = !hp && !ho && !hd ? extraDoorBoxes.findIndex((e) => inBox(m, e.box)) : -1;
    if (hp !== hoverPlayer || ho?.id !== hoverObj?.id || hd !== hoverDoor || he !== hoverExtra) {
      hoverPlayer = hp;
      hoverObj = ho;
      hoverDoor = hd;
      hoverExtra = he;
      updateHint();
    }
  });
  canvas.addEventListener("mouseleave", () => { hover = null; hoverPlayer = null; hoverObj = null; hoverDoor = false; hoverExtra = -1; updateHint(); });

  canvas.addEventListener("click", (e) => {
    if (furnishOn) return; // the furnishing menu has its own pointer handling
    if (faintUntil) return; // out cold
    if (suppressClick) { suppressClick = false; return; }
    if (introUntil && performance.now() < introUntil) return; // still waking up
    const m = mousePos(e);
    const target = playerAt(m.x, m.y);
    const t = tileAt(m.x, m.y);

    // owner furniture editing takes priority
    if (tool && isOwner()) {
      if (!t) return;
      if (tool === "pickup") {
        const f = furniAtTile(t);
        if (f && isFixedLobbyPiece(f.id)) say("That one is part of the lobby itself.", "warn");
        else if (f) void pickUpPiece(f);
      } else tryPlace(tool, t);
      return;
    }

    const obj = pick(objBoxes, m.x, m.y);

    // nothing selected: a tap does what the menu would offer (one option -> it happens, several -> you choose)
    if (!selectedDef()) {
      const options = contextOptions(m.x, m.y, true);
      if (options.length === 1) options[0].action();
      else if (options.length > 1) showMenu(e.clientX, e.clientY, options);
      return;
    }

    // one of today's pieces in the shop room: a window asks Buy or Cancel
    if (!target && obj && isDisplayPiece(obj.id)) { clearSelection(); openBuy(obj.kind!); return; }

    // something lying on the floor: walk over and pick it up
    if (!target && obj && obj.kind === "drop") { clearSelection(); startPickup(obj.id.slice(5)); return; }

    // the door (on the wall behind everything, so players and furniture win clicks that overlap it)
    if (!target && !obj && inBox(m, doorBox)) {
      clearSelection();
      startDoor();
      return;
    }
    if (!target && !obj) {
      const ed = extraDoorBoxes.find((e) => inBox(m, e.box));
      if (ed) { clearSelection(); pending = { type: "door", since: performance.now(), lastTry: 0, to: ed.door }; return; }
    }

    if (target?.npc && target.uid !== me.uid) { clearSelection(); startSixty(); return; }
    const item = selectedDef();
    // tapping another player (with nothing selected) opens their menu: add friend, invite to trade, walk here...
    if (target && target.uid !== me.uid && !target.sleeper && !item) { openContextAt(m.x, m.y, e.clientX, e.clientY); return; }
    if (item?.furniture) {
      if (!isOwnRoom) { clearSelection(); say("You can only put furniture down in your own room.", "warn"); return; }
      if (t && selectedSlot !== null) void putDown(t, { kind: item.id, source: "inv", slot: selectedSlot }, toolDir || defaultDir(item.id));
      return;
    }
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
      if (obj && !target && obj.kind === item.useOnObject) { if (obj.kind === "cdplayer") startCd(obj.id); else startUse(obj.id, selectedSlot); }
      else {
        clearSelection();
        if (obj && !target) say("Nothing interesting happens.", "warn");
        else if (t && walkable(t.x, t.y)) { pending = null; walkTo(t); }
      }
      return;
    }

    if (obj && !target) {
      if (obj.kind === "cdplayer") openCdPopup();
      else if (obj.kind === "bag" || obj.kind === "wardrobe" || obj.kind === "toolbox" || obj.kind === "vending" || obj.kind === "intercom" || obj.kind === "f_mixer") startBag(obj.id);
      else if (obj.kind === "sink" || isBodyBag(obj.kind) || FURNI_KINDS[obj.kind!]?.plant) startUse(obj.id, null);
      else if (obj.kind === "npc") startSixty();
      else if (obj.kind === "dumpster") startDumpster(obj.id);
      else if (FURNI_KINDS[obj.kind!]?.seat) sitAt(obj.id, t);
      else startArcade(obj.id);
      return;
    }
    if (t && walkable(t.x, t.y)) { pending = null; walkTo(t); }
  });

  /** What you can do with whatever is at canvas position (mx, my). `forTap` leaves out the owner's "Pick up" (that belongs to the furnishing menu). */
  function contextOptions(mx: number, my: number, forTap = false): Array<{ label: string; target?: string; danger?: boolean; action: () => void }> {
    const target = playerAt(mx, my);
    const tile = tileAt(mx, my);
    const item = selectedDef();
    const hasKnife = findSlot(me.inventory, "knife") >= 0;
    const opts: Array<{ label: string; target?: string; danger?: boolean; action: () => void }> = [];
    if (target?.npc && target.uid !== me.uid) {
      opts.push({ label: "Talk", target: SIXTY.name, action: () => startSixty() });
    } else if (target && target.uid !== me.uid) {
      if (item?.useOnPlayer === "stab" && !(target.uid === LEGEND.id && me.tutorial >= 2)) opts.push({ label: `Use ${item.name} →`, target: target.name, action: () => startStab(target.uid) });
      if (hasKnife && item?.useOnPlayer !== "stab" && !(target.uid === LEGEND.id && me.tutorial >= 2)) opts.push({ label: "Stab", target: target.name, danger: true, action: () => startStab(target.uid) });
      if (target.uid !== LEGEND.id && social.isOnline(target.uid) && !target.sleeper) opts.push({ label: "Invite to trade", target: target.name, action: () => void social.inviteToTrade(target.uid).then(() => say(`You ask ${target.name} to trade. They have to accept.`), () => say("Couldn't send that trade invite.", "warn")) });
      if (target.uid === LEGEND.id) { /* a stand-in: no friending him */ } else if (social.friends.has(target.uid)) opts.push({ label: "Message", target: target.name, action: () => window.dispatchEvent(new CustomEvent("open-chat", { detail: target.uid })) });
      else opts.push({ label: "Add friend", target: target.name, action: () => social.sendRequest(target.name).then((s) => say(s), (err) => say((err as Error).message, "warn")) });
    }
    const obj = pick(objBoxes, mx, my);
    if (obj?.kind === "arcade") opts.push({ label: "Play", target: "Arcade machine", action: () => startArcade(obj.id) });
    if (obj?.kind === "flappy") opts.push({ label: "Play", target: "Flappy Bird", action: () => startArcade(obj.id) });
    if (obj?.kind === "npc") {
      opts.push({ label: "Talk", target: SIXTY.name, action: () => startSixty() });
      if (me.isAdmin) opts.push({ label: "Change look", target: SIXTY.name, action: () => ctx.navigate("npc") });
    }
    if (obj?.kind === "dumpster") opts.push({ label: "Search", target: "Dumpster", action: () => startDumpster(obj.id) });
    if (obj?.kind === "drop") { const dd = drops.get(obj.id.slice(5)); opts.push({ label: "Pick up", target: dd ? (itemDef(dd.item)?.name ?? dd.item) : "item", action: () => startPickup(obj.id.slice(5)) }); }
    if (obj && isDisplayPiece(obj.id)) opts.push({ label: "Buy", target: FURNI_KINDS[obj.kind!].label, action: () => openBuy(obj.kind!) });
    if (obj?.kind === "wardrobe") opts.push({ label: "Open the shop", target: "Wardrobe", action: () => startBag(obj.id) });
    if (obj && FURNI_KINDS[obj.kind!]?.seat && !isDisplayPiece(obj.id)) opts.push({ label: "Sit", target: FURNI_KINDS[obj.kind!].label, action: () => sitAt(obj.id, tile) });
    if (obj?.kind === "vending") opts.push({ label: "Shop", target: "Vending machine", action: () => startBag(obj.id) });
    if (obj && isBodyBag(obj.kind) && !isDisplayPiece(obj.id)) opts.push({ label: "Draw blood", target: "Body bag", action: () => startUse(obj.id, null) });
    if (obj?.kind === "sink" || (obj && FURNI_KINDS[obj.kind!]?.plant)) opts.push({ label: obj.kind === "sink" ? "Use" : "Tend", target: FURNI_KINDS[obj.kind!].label, action: () => startUse(obj.id, null) });
    if (obj?.kind === "f_mixer") opts.push({ label: "Mix", target: "Mixer", action: () => startBag(obj.id) });
    if (obj?.kind === "intercom") opts.push({ label: "Use", target: "Door intercom", action: () => startBag(obj.id) });
    if (obj?.kind === "toolbox") opts.push({ label: "Furnish", target: "Toolbox", action: () => startBag(obj.id) });
    if (obj?.kind === "bag") opts.push({ label: "Change clothes", target: "Bag of clothes", action: () => startBag(obj.id) });
    if (obj?.kind === "cdplayer") {
      if (item?.useOnObject === "cdplayer") opts.push({ label: `Use ${item.name} →`, target: "CD player", action: () => startCd(obj.id) });
      opts.push({ label: "Volume", target: "CD player", action: () => openCdPopup() });
    }
    const onDoor = !target && !obj && inBox({ x: mx, y: my }, doorBox);
    if (onDoor) opts.push({ label: "Open", target: "Door", action: () => { clearSelection(); startDoor(); } });
    const ed = !target && !obj && !onDoor ? extraDoorBoxes.find((e) => inBox({ x: mx, y: my }, e.box)) : undefined;
    if (ed) opts.push({ label: "Open", target: `${ed.door.label} door`, action: () => { clearSelection(); pending = { type: "door", since: performance.now(), lastTry: 0, to: ed.door }; } });
    const furni = tile ? furniAtTile(tile) : undefined;
    if (!forTap && furni && isOwner() && furni.kind !== "arcade" && !isFixedLobbyPiece(furni.id)) {
      opts.push({ label: "Pick up", target: FURNI_KINDS[furni.kind].label, action: () => void pickUpPiece(furni) });
    }
    // walking is the default for an empty floor tile; on a door or a piece of furniture the tap means that thing, not "walk"
    if (tile && walkable(tile.x, tile.y) && !obj && !onDoor && !ed) opts.push({ label: "Walk here", action: () => { pending = null; walkTo(tile); } });
    return opts;
  }

  /** Picks a piece of furniture up: in your own room it goes into the toolbox's storage (the server does it); the admin removes the basement's extras. */
  async function pickUpPiece(f: PlacedFurni): Promise<void> {
    try {
      if (def.id === LOBBY_ID) await removeFurni(def.id, f.id);
      else await storeFromRoom(me, def.id, f);
      panel.refresh();
    } catch (err) { toast((err as Error).message || "Couldn't pick that up", "err"); }
  }

  /** The menu you get from a right-click or a long press. */
  function openContextAt(mx: number, my: number, cx: number, cy: number): void {
    const options = contextOptions(mx, my);
    if (options.length) showMenu(cx, cy, options);
  }

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (furnishOn) return;
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
    if (e.pointerType === "mouse" || furnishOn) return;
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
    if (furnishOn) { if (fzPlacing) { fzPlacing = null; clearSelection(); } else if (fzSel) fzSel = null; else exitFurnish(); refreshFz(); return; }
    if (selectedSlot !== null) clearSelection();
    closeCdPopup();
    doorApi?.close();
    if (tool) { tool = null; updateHint(); defListeners.forEach((l) => l()); }
  };
  const onRotateKey = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== "r" || e.ctrlKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (furnishOn) { fzTurn(); return; }
    if (selectedDef()?.furniture) { const it = selectedDef()!; toolDir = nextDir(it.id, toolDir || defaultDir(it.id)); return; }
    rotateTool();
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keydown", onRotateKey);
  const onPocket = () => { panel.refresh(); ctx.refreshHeader(); mixerApi?.refresh(); };
  window.addEventListener("pocket-changed", onPocket);

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
    if (!k || (!k.placeable && !(adminLobby && (k.nitro || INTERACTIVE_KINDS.has(kind))))) return;
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

  // ---- the furnishing menu -----------------------------------------------------------------------------------
  const othersOccupy = (): Set<string> => {
    const s = new Set<string>();
    for (const p of players.values()) { if (p.uid === me.uid || p.sleeper) continue; const t = currentTile(p); s.add(`${t.x},${t.y}`); }
    return s;
  };
  const fzPiece = () => (fzSel ? def.furni.find((f) => f.id === fzSel) ?? null : null);
  const refreshFz = () => { furnishUi?.refresh(); panel.refresh(); };

  function enterFurnish(): void {
    if (!isOwnRoom || furnishOn) return;
    clearSelection();
    pending = null;
    furnishOn = true;
    fzSel = null; fzPlacing = null; fzDrag = null;
    canvas.style.cursor = "grab";
    furnishUi = mountFurnishUi(stage, {
      profile: me,
      def: () => def,
      selected: fzPiece,
      placing: () => fzPlacing,
      done: exitFurnish,
      turn: fzTurn,
      store: () => { const f = fzPiece(); if (f) void storeFromRoom(me, def.id, f).then(() => { fzSel = null; refreshFz(); }, (err) => say((err as Error).message, "warn")); },
      startPlacing: (source, kind, slot) => { fzPlacing = { kind, source, slot }; fzDir = defaultDir(kind); fzSel = null; if (source === "inv" && slot !== undefined) { selectedSlot = slot; panel.setSelected(slot); } else if (selectedSlot !== null) clearSelection(); refreshFz(); },
      cancelPlacing: () => { fzPlacing = null; clearSelection(); refreshFz(); },
      storeFromInventory: (slot, qty) => void storeFromInventory(me, slot, qty).then(refreshFz, (err) => say((err as Error).message, "warn")),
      takeFromStorage: (kind, qty) => void takeFromStorage(me, kind, qty).then(refreshFz, (err) => say((err as Error).message, "warn")),
    });
  }

  function exitFurnish(): void {
    if (!furnishOn) return;
    furnishOn = false;
    fzSel = null; fzPlacing = null; fzDrag = null;
    furnishUi?.dispose();
    furnishUi = null;
    canvas.style.cursor = "pointer";
    // a piece may now stand where you were: step to the nearest free tile
    const p = mine();
    if (p && blocked.has(`${currentTile(p).x},${currentTile(p).y}`)) {
      const to = nearestWalkable(currentTile(p));
      p.from = p.to = p.dest = to; p.path = [];
      update(myRef, { x: to.x, y: to.y }).catch(() => undefined);
    }
    updateHint();
  }

  /** The tile a piece's origin goes on when the pointer is on tile t: the pointer is in the middle of its footprint. */
  const originFor = (kind: string, dir: number, t: Pt): Pt => {
    const fp = footprint(kind, dir);
    return { x: t.x - Math.floor((fp.w - 1) / 2), y: t.y - Math.floor((fp.h - 1) / 2) };
  };

  async function putDown(t: Pt, what: { kind: string; source: "inv" | "storage"; slot?: number }, dir: number): Promise<void> {
    const o = originFor(what.kind, dir, t);
    const spot: Spot = { x: o.x, y: o.y, dir: FURNI_KINDS[what.kind].rotatable ? dir : 0 };
    if (placedCount(def) >= MAX_FURNI) return say(`That's the limit: ${MAX_FURNI} pieces per room.`, "warn");
    const why = whyNot(def, what.kind, spot, null, othersOccupy());
    if (why) return say(why, "warn");
    try {
      if (what.source === "inv") await placeFromInventory(me, def.id, what.slot!, spot);
      else await placeFromStorage(me, def.id, what.kind, spot);
      playSfx("select", 0.4);
      clearSelection();
      fzPlacing = null;
      refreshFz();
    } catch (err) {
      say((err as Error).message || "Couldn't put that down.", "warn");
    }
  }

  function fzTurn(): void {
    if (fzPlacing) { fzDir = nextDir(fzPlacing.kind, fzDir); return; }
    const f = fzPiece();
    if (!f || !canTurn(f)) return;
    const dir = nextDir(f.kind, f.dir ?? 0);
    // turning swaps the footprint: slide it back inside the room if it now sticks out
    const fp = footprint(f.kind, dir);
    const spot: Spot = { x: Math.min(f.x, def.w - fp.w), y: Math.min(f.y, def.h - fp.h), dir };
    const why = whyNot(def, f.kind, spot, f.id, othersOccupy());
    if (why) return say(why, "warn");
    void movePiece(def.id, f, spot, me).catch((err) => say((err as Error).message || "Couldn't turn that.", "warn"));
  }

  const pieceAtPointer = (m: Pt, t: Pt | null) => {
    let best: { id: string; depth: number } | null = null;
    for (const b of furniBoxes) if (m.x >= b.box.x0 && m.x <= b.box.x1 && m.y >= b.box.y0 && m.y <= b.box.y1 && (!best || b.depth > best.depth)) best = b;
    return best ? def.furni.find((f) => f.id === best!.id) ?? null : t ? furniAtTile(t) ?? null : null;
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (!furnishOn || (e.pointerType === "mouse" && e.button !== 0)) return;
    const m = mousePos(e);
    const t = tileAt(m.x, m.y);
    hover = t;
    if (fzPlacing) { if (t) void putDown(t, fzPlacing, fzDir); return; }
    const f = pieceAtPointer(m, t);
    if (!f) { fzSel = null; furnishUi?.refresh(); return; }
    fzSel = f.id;
    fzDrag = { id: f.id, kind: f.kind, grab: t ? { x: t.x - f.x, y: t.y - f.y } : { x: 0, y: 0 }, moved: false, spot: { x: f.x, y: f.y, dir: f.dir ?? 0 } };
    canvas.setPointerCapture?.(e.pointerId);
    furnishUi?.refresh();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!furnishOn) return;
    const t = tileAt(mousePos(e).x, mousePos(e).y);
    hover = t;
    if (fzDrag && t) {
      const spot: Spot = { x: t.x - fzDrag.grab.x, y: t.y - fzDrag.grab.y, dir: fzDrag.spot.dir };
      if (spot.x !== fzDrag.spot.x || spot.y !== fzDrag.spot.y) { fzDrag.spot = spot; fzDrag.moved = true; canvas.style.cursor = "grabbing"; }
    }
  });
  const fzRelease = () => {
    if (!furnishOn || !fzDrag) return;
    const d = fzDrag;
    fzDrag = null;
    canvas.style.cursor = "grab";
    const f = def.furni.find((x) => x.id === d.id);
    if (!f || !d.moved) return;
    const why = whyNot(def, f.kind, d.spot, f.id, othersOccupy());
    if (why) return say(why, "warn");
    void movePiece(def.id, f, d.spot, me).catch((err) => say((err as Error).message || "Couldn't move that.", "warn"));
  };
  canvas.addEventListener("pointerup", fzRelease);
  canvas.addEventListener("pointercancel", () => { fzDrag = null; });

  /** Floor grid, the selected piece's outline and the ghost of what you're dragging or about to put down. */
  function drawFurnishOverlay(): void {
    const diamond = (x: number, y: number, fill: string | null, stroke: string | null) => {
      const p = toScreen(iso(x, y));
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.lineTo(p.x, p.y + TILE_H * scale);
      g.lineTo(p.x - (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
    };
    for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) diamond(x, y, null, "rgba(255,255,255,0.22)");
    const sel = fzPiece();
    if (sel && !fzDrag?.moved) {
      const fp = footprint(sel.kind, sel.dir);
      for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) diamond(sel.x + i, sel.y + j, "rgba(255,226,90,0.28)", "rgba(255,226,90,0.9)");
    }
    const ghost = (kind: string, spot: Spot, ignore: string | null) => {
      const ok = !whyNot(def, kind, spot, ignore, othersOccupy());
      const fp = footprint(kind, spot.dir);
      for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) diamond(spot.x + i, spot.y + j, ok ? "rgba(80,220,120,0.45)" : "rgba(230,70,70,0.45)", null);
      if (FURNI_KINDS[kind].nitro) drawNitroFurni(g, kind, spot.x, spot.y, spot.dir, toScreen, scale, 0.6);
    };
    if (fzDrag?.moved) ghost(fzDrag.kind, fzDrag.spot, fzDrag.id);
    else if (fzPlacing && hover) { const o = originFor(fzPlacing.kind, fzDir, hover); ghost(fzPlacing.kind, { x: o.x, y: o.y, dir: fzDir }, null); }
  }

  /** The ghost for a furniture item you've selected in your pocket (outside the furnishing menu). */
  function drawCarryGhost(): void {
    const item = selectedDef();
    if (furnishOn || !item?.furniture || !isOwnRoom || !hover) return;
    const o = originFor(item.id, toolDir || defaultDir(item.id), hover);
    const spot: Spot = { x: o.x, y: o.y, dir: toolDir || defaultDir(item.id) };
    const ok = !whyNot(def, item.id, spot, null, othersOccupy());
    const fp = footprint(item.id, spot.dir);
    for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) {
      const p = toScreen(iso(spot.x + i, spot.y + j));
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.lineTo(p.x, p.y + TILE_H * scale);
      g.lineTo(p.x - (TILE_W / 2) * scale, p.y + (TILE_H / 2) * scale);
      g.closePath();
      g.fillStyle = ok ? "rgba(80,220,120,0.45)" : "rgba(230,70,70,0.45)";
      g.fill();
    }
    if (FURNI_KINDS[item.id].nitro) drawNitroFurni(g, item.id, spot.x, spot.y, spot.dir, toScreen, scale, 0.6);
  }

  // ---- players -------------------------------------------------------------------
  function makePlayer(uid: string, v: any): Player {
    const p: Pt = { x: v.x ?? 1, y: v.y ?? 1 };
    return {
      uid, name: v.name ?? "?", figure: v.figure ?? me.figure, dir: v.dir ?? 2,
      from: p, to: p, stepStart: 0, path: [], dest: p, lastEmoteTs: v.emote?.ts ?? 0,
      smoke: typeof v.smoke === "number" ? v.smoke : undefined,
      smokeKind: typeof v.smokeKind === "string" ? v.smokeKind : undefined,
      fast: typeof v.fast === "number" ? v.fast : undefined,
      chem: typeof v.chem === "number" ? v.chem : undefined,
      npc: v.sixty === true,
      sit: v.sit === true,
      faint: v.lay === true,
    };
  }

  /** how long one step takes: half as long while thc-a / research chemical is in you */
  const stepOf = (p: Player): number => (p.fast && serverNow() < p.fast ? STEP_MS / 2 : STEP_MS);
  const isMoving = (p: Player, now: number) => now - p.stepStart < stepOf(p) && (p.from.x !== p.to.x || p.from.y !== p.to.y);

  function currentTile(p: Player): Pt {
    return p.path.length || performance.now() - p.stepStart < stepOf(p) ? p.to : p.from;
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
    if (!p || frozen || faintUntil) return; // 6ixty doesn't walk, and nobody walks while out cold
    if (p.sit && !seatTiles.has(`${dest.x},${dest.y}`)) { p.sit = false; update(ref(db, `rooms/${roomId}/players/${me.uid}`), { sit: null }).catch(() => undefined); } // you get up when you walk
    if (!seatTiles.has(`${dest.x},${dest.y}`)) p.sitTo = undefined;
    setDestination(p, dest);
    if (p.path.length === 0) return;
    update(ref(db, `rooms/${roomId}/players/${me.uid}`), { x: dest.x, y: dest.y, dir: dirOf(currentTile(p), p.path[0]) }).catch(console.warn);
  }

  function advance(p: Player, now: number): void {
    if (now - p.stepStart < stepOf(p)) return;
    p.from = p.to;
    if (p.path.length) {
      const next = p.path.shift()!;
      p.dir = dirOf(p.from, next);
      p.to = next;
      p.stepStart = now;
    }
  }

  function posOf(p: Player, now: number): Pt {
    const t = isMoving(p, now) ? (now - p.stepStart) / stepOf(p) : 1;
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
    if (target.npc) return startSixty(); // you don't stab 6ixty, you talk to him
    if (findSlot(me.inventory, "knife") < 0) return say("You need a knife for that.", "warn");
    if (uid === LEGEND.id && me.tutorial >= 2) return say("He isn't getting up.", "warn");
    if (!canStab(me, uid)) {
      const mins = Math.max(1, Math.ceil(msUntilTomorrow() / 60000));
      return say(`You've already stabbed ${target.name} today. You can stab them again in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}.`, "warn");
    }
    pending = { type: "stab", uid, since: performance.now(), lastTry: 0 };
    clearSelection(); // like OSRS, the item stops being a "selected" cursor once you commit to a target
    if (cheb(currentTile(mine()!), currentTile(target)) > 1) say(`You walk towards ${target.name}…`);
  }

  /** Sit on a chair or couch: walk onto the tile you clicked (or the nearest tile of the piece), then take the seat. */
  function sitAt(fid: string, at: Pt | null): void {
    const p = mine();
    const f = def.furni.find((x) => x.id === fid);
    if (!p || !f || frozen) return;
    const k = FURNI_KINDS[f.kind];
    if (!k?.seat) return;
    clearSelection();
    const fp = footprint(f.kind, f.dir);
    const tiles: Pt[] = [];
    for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) tiles.push({ x: f.x + i, y: f.y + j });
    const taken = new Set<string>();
    for (const o of players.values()) { if (o === p) continue; taken.add(`${currentTile(o).x},${currentTile(o).y}`); taken.add(`${o.dest.x},${o.dest.y}`); }
    const free = tiles.filter((t) => !taken.has(`${t.x},${t.y}`));
    if (!free.length) return say("Somebody is sitting there.", "warn");
    const want = at ?? currentTile(p);
    free.sort((a, b) => Math.hypot(a.x - want.x, a.y - want.y) - Math.hypot(b.x - want.x, b.y - want.y));
    const seat = free[0];
    pending = null;
    if (p.sit && currentTile(p).x === seat.x && currentTile(p).y === seat.y) return;
    p.sitTo = { x: seat.x, y: seat.y, dir: (f.dir ?? 0) };
    if (currentTile(p).x === seat.x && currentTile(p).y === seat.y) return; // already on it: finishSit runs next frame
    walkTo(seat);
    if (!p.path.length) { p.sitTo = undefined; say("You can't get to that seat.", "warn"); }
  }

  /** When you've walked onto the seat you clicked, sit down (everyone else sees it through players/<uid>/sit). */
  function finishSit(p: Player, now: number): void {
    const s = p.sitTo;
    if (!s || p.path.length || isMoving(p, now)) return;
    p.sitTo = undefined;
    const t = currentTile(p);
    if (t.x !== s.x || t.y !== s.y) return; // the walk didn't get there
    p.sit = true;
    p.dir = s.dir;
    update(ref(db, `rooms/${roomId}/players/${me.uid}`), { sit: true, dir: s.dir }).catch(() => undefined);
  }

  /** Walk over to a piece you're using something on (or just tending); `slot` is the pocket item you had selected. */
  function startUse(fid: string, slot: number | null): void {
    pending = { type: "use", fid, since: performance.now(), lastTry: 0, slot };
    clearSelection();
  }

  const planterStatus = (pl: { at: number; water: number; neglect: boolean }): string => {
    const prog = plantProgress(pl), water = plantWater(pl);
    const left = Math.max(0, GROW_MS * (1 - prog));
    const mins = Math.ceil(left / 60000);
    return prog >= 1 ? `It's ready to pick!${pl.neglect || water <= 0 ? " It looks a bit sad." : ""}` : `Growing: ${Math.round(prog * 100)}% (about ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`} to go). Water: ${Math.round(water * 100)}%.`;
  };

  /** Next to the sink or a growing kit: the sink fills a can; a kit gets a seed, water, or gets picked. */
  async function interactWith(f: PlacedFurni, slot: number | null): Promise<void> {
    const k = FURNI_KINDS[f.kind];
    const held = slot !== null ? me.inventory[slot] : null;
    try {
      if (isBodyBag(f.kind)) return await drawFromBag();
      if (f.kind === "sink") {
        const cs = held?.item === "wateringcan" ? slot! : findSlot(me.inventory, "wateringcan");
        if (cs < 0 || cs === null) return say(findSlot(me.inventory, "wateringcan_full") >= 0 ? "Your watering can is already full." : "You have nowhere to put the water.", "warn");
        await fillCan(me, cs);
        panel.refresh();
        playSfx("select", 0.4);
        return say("You fill the watering can.");
      }
      if (!k?.plant) return;
      if (!isOwnRoom) return say("That's not your plant.", "warn");
      if (!f.plant) {
        const ss = held?.item === "weedseed" ? slot! : findSlot(me.inventory, "weedseed");
        if (ss < 0 || ss === null) return say("An empty growing kit. Select a weed seed, then click the kit to plant it.", "warn");
        await plantSeed(me, def.id, f.id, ss);
        panel.refresh();
        return say("You push a seed into the soil. It needs water: 2 hours to grow, thirsty after 1.");
      }
      const prog = plantProgress(f.plant);
      const canSlot = held?.item === "wateringcan_full" ? slot! : findSlot(me.inventory, "wateringcan_full");
      if (held?.item === "wateringcan_full" || (prog < 1 && canSlot >= 0)) {
        if (canSlot < 0 || canSlot === null) return say("You need a full watering can.", "warn");
        await waterPlant(me, def.id, f.id, f.plant, canSlot);
        panel.refresh();
        playSfx("select", 0.4);
        return say("You water the plant.");
      }
      if (prog >= 1) {
        const r = await harvestPlant(me, def.id, f.id, f.plant);
        panel.refresh();
        playSfx("give", 0.6);
        giftPop(r.ass ? "+3 Ass weed" : "+3 Weed", itemImg("weed"));
        logAction(me, "room", `harvested ${r.ass ? "ass weed" : "weed"}`);
        return say(r.ass ? "You pick it. It's ass weed: it ran dry on you." : "You pick the buds. Nice.");
      }
      say(planterStatus(f.plant));
    } catch (err) {
      say((err as Error).message || "That didn't work.", "warn");
    }
  }

  function startDumpster(fid: string): void {
    clearSelection();
    pending = { type: "dumpster", fid, since: performance.now(), lastTry: 0 };
  }

  let searching = false;
  /** next to a garbage can: rummage through it (a burger, a cigarette or a dead cat), each can once every 10 minutes */
  async function searchTheDumpster(canId: string): Promise<void> {
    if (searching) return;
    const wait = dumpsterWaitMs(me, canId);
    if (wait > 0) {
      const secs = Math.ceil(wait / 1000);
      return say(`You've already been through this one. Nothing new yet: try again in ${secs >= 60 ? `${Math.ceil(secs / 60)}m` : `${secs}s`}.`, "warn");
    }
    if (me.inventory.every((s) => s !== null)) return say("Your inventory is full.", "warn");
    searching = true;
    try {
      say("You dig through the dumpster…");
      playSfx("select", 0.4);
      await new Promise((r) => window.setTimeout(r, 900));
      if (disposed) return;
      const found = await searchDumpster(me, canId, roomId);
      panel.refresh();
      playSfx("give", 0.6);
      const FOUND: Record<string, string> = { deadcat: "Under the bin bags: a dead cat. Poor thing.", burger: "A burger, hardly bitten. Lucky you.", weedseed: "A few little seeds in the muck. They might grow.", lighter: "A lighter, and it still works!" };
      giftPop(`+1 ${itemDef(found)?.name ?? found}`, itemImg(found));
      say(FOUND[found] ?? `You find a ${itemDef(found)?.name ?? found}.`);
      logAction(me, "room", `searched a garbage can and found a ${found}`);
    } catch (err) {
      say((err as Error).message || "You find nothing but rot.", "warn");
    } finally {
      searching = false;
    }
  }

  /** the knife on a dead cat from your inventory: +5 drops of blood, the cat is used up */
  async function carveDeadCat(slot: number): Promise<void> {
    if (me.inventory[slot]?.item !== "deadcat") return;
    if (findSlot(me.inventory, "knife") < 0) return say("You've got nothing to cut it with.", "warn");
    try {
      await carveCat(me, slot);
      clearSelection();
      ctx.refreshHeader();
      panel.refresh();
      playSfx("stab", 0.5);
      const p = mine();
      if (p) {
        const t = performance.now();
        const fp = feetOf(p, t);
        floaters.push({ text: `+${CAT_BLOOD}`, x: fp.x, y: fp.y - 70 * scale, born: t, color: "#ff5252", icon: bloodImg, life: 1700 });
      }
      logAction(me, "stab", `cut open a dead cat (+${CAT_BLOOD})`);
      say(`You open the cat up with your knife. It's still a little warm. (+${CAT_BLOOD})`);
    } catch {
      say("The cat slips away… (the hotel refused it)", "warn");
    }
  }

  function startArcade(fid: string): void {
    pending = { type: "arcade", fid, since: performance.now(), lastTry: 0 };
  }

  /** Walk over to the bag of clothes; processPending opens the Character page once you're next to it. */
  function startBag(fid: string): void {
    clearSelection();
    pending = { type: "bag", fid, since: performance.now(), lastTry: 0 };
  }

  function openVendingShop(): void {
    if (vendingApi) return;
    vendingApi = openVending(stage, ctx, () => panel.refresh(), () => { vendingApi = null; });
  }

  function openBuy(kind: string): void {
    furniBuyApi?.close();
    furniBuyApi = openFurniBuy(stage, ctx, kind, () => panel.refresh(), () => { furniBuyApi = null; });
  }

  function startDoor(): void {
    if (doorApi) return;
    if (isOwnRoom || def.doorTo) {
      // your own room's door is simple: it leads to the basement, no menu. Your avatar walks to the door first (processPending sends you down on arrival).
      pending = { type: "door", since: performance.now(), lastTry: 0 };
      return;
    }
    // everywhere else the door opens the menu (basement, your room, visit someone); it opens straight away while the avatar strolls over
    showDoor();
    pending = { type: "door", since: performance.now(), lastTry: 0 };
  }

  function showDoor(): void {
    if (doorApi) return;
    if (!me.seenDoor) { me.seenDoor = true; void update(ref(db, `users/${me.uid}`), { seenDoor: true }).catch(() => undefined); } // stop the door flashing
    doorApi = openDoor(stage, ctx, roomId, () => { doorApi = null; });
  }

  /** Walks next to a tile (or a player's tile), returns true once adjacent. */
  function approach(p: Player, goal: Pt | Pt[], now: number, tries: { lastTry: number }): "arrived" | "walking" | "unreachable" {
    const goals = Array.isArray(goal) ? goal : [goal]; // every tile the target covers (a big machine covers two)
    const mt = currentTile(p);
    const key = (t: Pt) => `${t.x},${t.y}`;
    // tiles other players stand on or are heading to: we don't stop on top of anybody
    const taken = new Set<string>();
    for (const o of players.values()) {
      if (o === p || o.lying) continue;
      taken.add(key(currentTile(o)));
      taken.add(key(o.dest));
    }
    const touching = (t: Pt) => goals.some((g) => cheb(t, g) <= 1);
    if (touching(mt) && !taken.has(key(mt))) return "arrived"; // beside it, on a tile of our own
    if (now - tries.lastTry < 450) return "walking";
    tries.lastTry = now;

    // free tiles next to any part of the target; if the crowd has taken them all, share one rather than give up
    const candidates = (avoidPlayers: boolean): Pt[] => {
      const seen = new Map<string, Pt>();
      for (const g of goals) for (const [dx, dy] of DIRS) {
        const n = { x: g.x + dx, y: g.y + dy };
        if (!walkable(n.x, n.y) || goals.some((q) => q.x === n.x && q.y === n.y)) continue;
        if (avoidPlayers && taken.has(key(n))) continue;
        seen.set(key(n), n);
      }
      return [...seen.values()];
    };
    let tiles = candidates(true);
    if (tiles.length === 0) tiles = candidates(false);
    if (tiles.length === 0) return touching(mt) ? "arrived" : "unreachable";

    // the closest one to walk to (shortest path), and among equals the one nearest the target
    let best: Pt | null = null;
    let bestLen = Infinity;
    let bestNear = Infinity;
    for (const n of tiles) {
      const len = n.x === mt.x && n.y === mt.y ? 0 : findPath(mt, n).length || Infinity;
      const near = Math.min(...goals.map((g) => Math.hypot(g.x - n.x, g.y - n.y)));
      if (len < bestLen || (len === bestLen && near < bestNear)) { best = n; bestLen = len; bestNear = near; }
    }
    if (!best || bestLen === Infinity) return "unreachable";
    if (bestLen === 0) return "arrived";
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
      const to = pending.to;
      const goal = { x: to ? to.x : def.doorX, y: 0 };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to the door.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = 0; // face the wall the door is in
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        if (to) {
          // one of the extra doors (the yellow one to the shop)
          playSfx("doorOpen", 0.6);
          logAction(me, "visit", `went to the ${to.label.toLowerCase()}`);
          ctx.navigate("room", { roomId: to.to, from: roomId });
        } else if (isOwnRoom || def.doorTo) {
          // arrived at your own room's door (down to the basement) or the shop's door (back to the basement)
          playSfx("doorOpen", 0.6);
          if (isOwnRoom && !me.seenDoor) { me.seenDoor = true; void update(ref(db, `users/${me.uid}`), { seenDoor: true }).catch(() => undefined); }
          logAction(me, "visit", "went to the basement");
          ctx.navigate("room", { roomId: def.doorTo ?? (me.tutorial < 4 && !me.isAdmin ? tutRoomId(me.uid) : LOBBY_ID), from: roomId });
        }
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
    if (pending.type === "sixty") {
      const job0 = pending;
      const goal = { x: SIXTY.x, y: SIXTY.y };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to him.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = dirOf(currentTile(p), goal);
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        if (!job0.auto || sixtyWants()) void talkSixty(); // walking over on arrival only talks if he has something for you
      }
      return;
    }
    if (pending.type === "pickup") {
      const d = drops.get(pending.key);
      if (!d || isExpired(d)) { pending = null; return say("It's gone.", "warn"); }
      const goal = { x: d.x, y: d.y };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to it.", "warn"); }
      if (r === "arrived") {
        pending = null;
        const here = currentTile(p);
        if (here.x !== goal.x || here.y !== goal.y) { p.dir = dirOf(here, goal); update(myRef, { dir: p.dir }).catch(() => undefined); }
        void doPickup(d);
      }
      return;
    }
    const job = pending;
    const f = def.furni.find((x) => x.id === job.fid);
    if (!f) { pending = null; return; }
    const fp = footprint(f.kind, f.dir);
    const covered: Pt[] = [];
    for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) covered.push({ x: f.x + i, y: f.y + j });
    const r = approach(p, covered, now, job);
    if (r === "unreachable") {
      pending = null;
      // the toolbox opens its furnishing menu even when something is in the way: the menu is the point, not standing next to it
      if (job.type === "bag" && FURNI_KINDS[f.kind].opens === "furnish") { enterFurnish(); return; }
      return say("You can't get to it.", "warn");
    }
    if (r === "arrived") {
      pending = null;
      const me0 = currentTile(p);
      const face = covered.reduce((a, b) => (Math.hypot(b.x - me0.x, b.y - me0.y) < Math.hypot(a.x - me0.x, a.y - me0.y) ? b : a)); // face the nearest part of it
      p.dir = dirOf(me0, face);
      update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
      if (job.type === "cd") void executeInsert();
      else if (job.type === "bag") {
        const opens = FURNI_KINDS[f.kind].opens;
        if (opens === "furnish") enterFurnish();
        else if (opens === "vending") openVendingShop();
        else if (opens === "mixer") { if (!mixerApi) mixerApi = openMixer(stage, ctx, f.id, () => panel.refresh(), () => { mixerApi = null; }); }
        else if (opens === "intercom") { if (!intercomApi) intercomApi = openIntercom(stage, def.id, () => def.access, () => { intercomApi = null; }); }
        else ctx.navigate(opens === "shop" ? "shop" : "customize");
      }
      else if (job.type === "dumpster") void searchTheDumpster(job.fid);
      else if (job.type === "use") void interactWith(f, job.slot ?? null);
      else openArcade(f.kind === "flappy" ? "flappy" : undefined, {
        collectBlood: async () => {
          try {
            await rewardFlappyDrop(me, roomId);
            ctx.refreshHeader();
            logAction(me, "room", "caught a drop of blood in Flappy Bird (+1)");
            return true;
          } catch { return false; }
        },
      });
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

  let lastStabGain = 1;
  async function executeStab(uid: string): Promise<void> {
    const p = mine();
    const target = players.get(uid);
    if (!p || !target || stabbing) return;
    if (isTut && uid === LEGEND.id) return tutorialStab();
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
        const gain = await rewardStab(me, uid, roomId);
        lastStabGain = gain;
        ctx.refreshHeader();
        panel.refresh();
        logAction(me, "stab", `stabbed ${target.name} (+${gain})`);
        say("You did what you had to do");
      } catch {
        say("The drop of blood slips through your fingers… (the hotel refused it)", "warn");
      }
    } finally {
      stabbing = false;
    }
  }

  // ---- things on the floor --------------------------------------------------------------------------------
  const iconImgs = new Map<string, HTMLImageElement>();
  const iconFor = (id: string): HTMLImageElement => {
    const src = itemDef(id)?.icon ?? "";
    let im = iconImgs.get(src);
    if (!im) { im = loadImg(src); iconImgs.set(src, im); }
    return im;
  };

  function startPickup(key: string): void {
    pending = { type: "pickup", key, since: performance.now(), lastTry: 0 };
  }

  /** The red Drop button: an item was picked. Asks (and for a stack, how many) before anything lands on the floor. */
  function askDrop(slot: number): void {
    const s = me.inventory[slot];
    const why = whyNotDrop(s);
    if (why) return say(why, "warn");
    if (furnishOn) return say("Finish furnishing first.", "warn");
    if (faintUntil || mine()?.lying) return;
    const d = itemDef(s!.item);
    if (!d) return;
    dropConfirmApi?.close();
    const icon = d.icon;
    dropConfirmApi = openDropConfirm(stage, { name: d.name, icon, qty: s!.qty, ass: s!.ass }, (qty) => {
      dropConfirmApi = null;
      if (qty) void doDrop(slot, qty, s!.item);
    });
  }

  async function doDrop(slot: number, qty: number, itemId: string): Promise<void> {
    const p = mine();
    const s = me.inventory[slot];
    if (!p || !s || s.item !== itemId) return say("That isn't in your pocket any more.", "warn");
    const tile = landingTile(currentTile(p), (x, y) => walkable0(x, y) && !isDoorTile(x, y, def.doorX), (x, y) => drops.has(dropKey(x, y)), def.w, def.h);
    if (!tile) return say("There's no room to put it down here.", "warn");
    const name = itemDef(s.item)?.name ?? s.item;
    try {
      await dropItem(me, roomId, slot, qty, tile);
      panel.refresh();
      playSfx("select", 0.5);
      logAction(me, "drop", `dropped ${qty} ${name}`);
      say(`You drop ${qty > 1 ? `${qty} ` : "the "}${name.toLowerCase()}.`);
    } catch (err) {
      say((err as Error).message || "It won't go. (the hotel refused it)", "warn");
    }
  }

  async function doPickup(d: Drop): Promise<void> {
    try {
      const got = await pickUpDrop(me, roomId, d);
      panel.refresh();
      playSfx("give", 0.4);
      const name = itemDef(got.item)?.name ?? got.item;
      logAction(me, "drop", `picked up ${got.qty} ${name}`);
      say(`You pick up ${got.qty > 1 ? `${got.qty} ` : "the "}${name.toLowerCase()}.`);
    } catch (err) {
      say((err as Error).message || "You couldn't pick that up.", "warn");
    }
  }

  // ---- the syringe: 1 drop from yourself and 1 from a body bag, each once every 20 minutes ---------------------
  let drawing = false;
  const waitText = (ms: number): string => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
  async function drawBlood(who: "self" | "bag"): Promise<void> {
    if (drawing) return;
    if (findSlot(me.inventory, "syringe") < 0) return say(who === "bag" ? "A body bag. You'd need a syringe to get anything out of it." : "You don't have a syringe.", "warn");
    const wait = syringeWaitMs(me, who);
    if (wait > 0) return say(who === "bag" ? `There's nothing left in the bag for now. Try again in ${waitText(wait)}.` : `Your arm needs ${waitText(wait)} to recover.`, "warn");
    drawing = true;
    try {
      const p = mine();
      if (p) { p.path = []; p.emote = undefined; }
      try {
        // everyone sees it, like a stab
        await push(ref(db, `rooms/${roomId}/events`), { type: "syringe", from: me.uid, to: me.uid, ts: serverTimestamp() });
      } catch { /* the animation is optional; the blood isn't */ }
      try {
        await rewardSyringe(me, who, roomId);
        ctx.refreshHeader();
        panel.refresh();
        logAction(me, "syringe", `drew blood with the syringe from ${who === "bag" ? "a body bag" : "themselves"} (+${SYRINGE_BLOOD})`);
        say(who === "bag" ? `You find a vein that still works and draw a little blood. (+${SYRINGE_BLOOD})` : `You slide the needle in and draw some blood. It fills the barrel nicely. (+${SYRINGE_BLOOD})`);
      } catch {
        say("The needle slips and the blood goes to waste… (the hotel refused it)", "warn");
      }
    } finally {
      drawing = false;
    }
  }
  const useSyringe = (): Promise<void> => drawBlood("self");
  const drawFromBag = (): Promise<void> => drawBlood("bag");

  // ---- 6ixty, the basement's merchant and guide ---------------------------------------------------------
  let sixtyBubble: Bubble | null = null;
  let sixtyShop: SixtyShopApi | null = null;
  let sixtyBusy = false;
  let sixtyLast: HTMLCanvasElement | undefined;
  const sixtyTimers: number[] = [];
  const sixtyAfter = (ms: number, fn: () => void) => { sixtyTimers.push(window.setTimeout(() => { if (!disposed) fn(); }, ms)); };
  const sixtySay = (text: string, ms = 4200) => { sixtyBubble = { text, until: performance.now() + ms }; };
  /** he has something for you: the introduction's next step, or one of his jobs (the lighter job a couple of hours after the first blood) */
  const sixtyWants = (): boolean => {
    if (isTut) return me.tutorial === 0 || me.tutorial === 2;
    if (me.sixty.knifeAt === 0) return true;
    return jobReady(me) || (me.tutorial === 5 && findSlot(me.inventory, "lighter") >= 0);
  };

  function startSixty(auto = false): void {
    clearSelection();
    pending = { type: "sixty", since: performance.now(), lastTry: 0, ...(auto ? { auto: true } : {}) };
  }

  /** a little "+1 Knife" with its icon pops up over your head when 6ixty hands you something */
  function giftPop(text: string, icon: HTMLImageElement): void {
    const p = mine();
    if (!p) return;
    const t = performance.now();
    const fp = feetOf(p, t);
    floaters.push({ text, x: fp.x, y: fp.y - 78 * scale, born: t, color: "#ffe27a", icon, life: 2200 });
  }

  function openSixtyWindow(): void {
    if (sixtyShop) return;
    sixtyShop = openSixtyShop(stage, ctx, () => panel.refresh(), () => { sixtyShop = null; });
  }

  async function talkSixty(): Promise<void> {
    if (sixtyBusy) return;
    sixtyBusy = true;
    try {
      if (isTut) return await talkIntro();
      if (me.sixty.knifeAt === 0) {
        try { await sixtyGiveKnife(me); } catch { return sixtySay(SIXTY_LINES.full); }
        panel.refresh();
        playSfx("give", 0.6);
        giftPop("+1 Knife", knifeImg);
        logAction(me, "room", "got the knife from 6ixty");
        sixtySay(SIXTY_LINES.knife, 2600);
      } else if (jobReady(me)) {
        // the lighter job, part 1: money for a lighter
        let price = 0;
        try { price = await sixtyJobMoney(me); } catch { return sixtySay(SIXTY_LINES.full); }
        ctx.refreshHeader();
        playSfx("give", 0.6);
        giftPop(`+${price} Blood`, bloodImg);
        logAction(me, "room", `got ${price} drops from 6ixty for a lighter`);
        sixtySay(SIXTY_LINES.lighterJob, 4200);
        sixtyAfter(4500, () => sixtySay(SIXTY_LINES.lighterJob2, 6500));
      } else if (me.tutorial === 5) {
        // the lighter job, part 2: bring it back
        if (findSlot(me.inventory, "lighter") < 0) return sixtySay(SIXTY_LINES.lighterAgain, 4500);
        try { await sixtyJobReward(me); } catch { return sixtySay(SIXTY_LINES.full); }
        ctx.refreshHeader();
        panel.refresh();
        playSfx("give", 0.6);
        giftPop(`+${JOB_REWARD} Blood`, bloodImg);
        logAction(me, "room", "brought 6ixty the lighter: got the syringe");
        sixtySay(SIXTY_LINES.lighterDone, 3200);
        sixtyAfter(3500, () => { giftPop("+1 Syringe", syringeImg); sixtySay(SIXTY_LINES.syringe, 7000); });
      } else if (me.tutorial === 4) {
        sixtySay(`come back in about ${waitText(jobWaitMs(me))}. I'll have another job for you.`, 4200);
        openSixtyWindow();
      } else {
        sixtySay(SIXTY_LINES.shop, 2500);
        openSixtyWindow();
      }
    } finally {
      sixtyBusy = false;
    }
  }

  // ---- the introduction (in the private copy of the basement) ---------------------------------------------
  /** points the player at the next thing: the knife (and the guy) in the pocket, then the pill */
  function tutorialGuide(): void {
    if (!isTut || disposed) return;
    const knife = findSlot(me.inventory, "knife");
    const pill = findSlot(me.inventory, "pill");
    if (me.tutorial === 1 && knife >= 0 && selectedSlot !== knife) panel.guide(knife);
    else if (me.tutorial === 3 && pill >= 0) panel.guide(pill);
    else panel.guide(null);
  }

  async function talkIntro(): Promise<void> {
    const st = me.tutorial;
    if (st === 0) {
      try { await sixtyGiveKnife(me); } catch { return sixtySay(SIXTY_LINES.full); }
      panel.refresh();
      playSfx("give", 0.6);
      giftPop("+1 Knife", knifeImg);
      logAction(me, "room", "got the knife from 6ixty");
      sixtySay(SIXTY_LINES.knife, 4200);
      sixtyAfter(4800, () => { sixtySay(SIXTY_LINES.legend, 8500); say("Tap the glowing knife in your pocket, then tap LegendGamer2015."); tutorialGuide(); });
    } else if (st === 1) {
      sixtySay(SIXTY_LINES.legendAgain, 5000);
      tutorialGuide();
    } else if (st === 2) {
      // let him finish what he is saying (good job / your first blood) before he hands anything over
      const left = sixtyBubble ? sixtyBubble.until - performance.now() : 0;
      if (left > 0) await new Promise<void>((r) => window.setTimeout(r, left + 600));
      if (disposed) return;
      try { await sixtyGivePill(me); } catch { return sixtySay(SIXTY_LINES.full); }
      panel.refresh();
      playSfx("give", 0.6);
      giftPop("+1 Pill", itemImg("pill"));
      logAction(me, "room", "got the pill from 6ixty");
      sixtySay(SIXTY_LINES.pill, 6000);
      sixtyAfter(6200, () => { say("Tap the glowing pill in your pocket to swallow it."); tutorialGuide(); });
      tutorialGuide();
    } else {
      sixtySay(SIXTY_LINES.pillAgain, 5000);
      tutorialGuide();
    }
  }

  /** The first stab, on the guy 6ixty points at: he falls down, you get your first 5 drops, and 6ixty tells you what's next. */
  async function tutorialStab(): Promise<void> {
    const p = mine();
    const legend = players.get(LEGEND.id);
    if (!p || !legend || stabbing) return;
    if (me.tutorial >= 2) return say("He isn't getting up.", "warn");
    stabbing = true;
    try {
      p.dir = dirOf(currentTile(p), currentTile(legend));
      p.emote = undefined;
      update(myRef, { dir: p.dir }).catch(console.warn);
      try { await rewardFirstStab(me); } catch { return say("The drops slip through your fingers… (the hotel refused it)", "warn"); }
      stabFx.push({ from: me.uid, to: LEGEND.id, start: performance.now(), impact: false, dropped: false });
      lastStabGain = FIRST_BLOOD;
      ctx.refreshHeader();
      panel.refresh();
      logAction(me, "stab", `stabbed ${LEGEND.name} (+${FIRST_BLOOD})`);
      say("You did what you had to do");
      tutorialGuide();
      sixtyAfter(450, () => { legend.path = []; legend.emote = undefined; legend.faint = true; }); // he goes down
      sixtyAfter(1800, () => sixtySay(SIXTY_LINES.goodjob, 3600));
      sixtyAfter(5800, () => sixtySay(SIXTY_LINES.firstBlood, 10000));
      sixtyAfter(7000, () => { if (!pending && !mine()?.lying) startSixty(true); }); // you walk over to him (he finishes his sentence first)
    } finally {
      stabbing = false;
    }
  }

  // ---- smoking ------------------------------------------------------------------------------------------
  const isSmoking = (p: Player | undefined): boolean => !!p && typeof p.smoke === "number" && serverNow() - p.smoke < SMOKE_MS;

  /** Lights a cigarette, joint or blunt (you need a lighter; it isn't used up). */
  async function lightUp(slot: number): Promise<void> {
    const p = mine();
    if (!p || p.lying) return;
    const it = me.inventory[slot];
    if (!it || !SMOKABLE[it.item] || it.lit) return;
    if (isSmoking(p)) return say("You're already smoking one.", "warn");
    if (findSlot(me.inventory, "lighter") < 0) return say("You need a lighter for that. The vending machine in the shop sells them.", "warn");
    try {
      const t = await lightItem(me, slot);
      p.smoke = t;
      p.smokeKind = SMOKABLE[it.item].kind;
      void update(myRef, { smoke: serverTimestamp(), smokeKind: SMOKABLE[it.item].kind }).catch(() => undefined);
      playSfx("light", 0.45);
      logAction(me, "room", `lit a ${it.item}`);
      panel.refresh();
      say("You light up.");
    } catch (err) {
      say((err as Error).message || "The lighter won't catch.", "warn");
    }
  }


  /**
   * 6ixty's pill. Nothing happens for 5-10 seconds while the screen swims (more and more blur, you can still walk about). Then you say
   * your piece and slowly pass out where you stand, the screen fades to black and stays black for two seconds, and you wake up in your own room.
   */
  let faintUntil = 0;
  let woozy = false;
  let pillCleanup: (() => void) | null = null;
  async function usePill(): Promise<void> {
    const p = mine();
    if (!p || p.lying || faintUntil || woozy) return;
    const slot = findSlot(me.inventory, "pill");
    if (slot < 0) return say("You don't have a pill.", "warn");
    try { await swallowPill(me, slot); } catch { return say("The pill slips out of your fingers. (the hotel refused it)", "warn"); } // (the server also ends the introduction here: the door leads to the real basement from now on)
    clearSelection();
    panel.guide(null);
    panel.refresh();
    logAction(me, "room", "swallowed a pill");
    say("You swallow the pill. Give it a moment…");
    startWoozy();
  }

  /** The dizzy-then-pass-out sequence (the pill, and ass weed once it's smoked). */
  function startWoozy(tries = 0): void {
    if (disposed || faintUntil || woozy) return;
    const p = mine();
    if (!p) { if (tries < 20) window.setTimeout(() => startWoozy(tries + 1), 500); return; } // still walking in
    if (p.lying) return;
    woozy = true;
    const buffer = 5000 + Math.random() * 5000;
    const app = document.getElementById("app");
    const t0 = performance.now();
    const timers: number[] = [];
    const black = h("div", { class: "blackout" });
    const stop = (removeBlack: boolean): void => {
      window.clearInterval(swim);
      timers.forEach((t) => window.clearTimeout(t));
      if (app) app.style.filter = "";
      if (removeBlack) black.remove();
      woozy = false;
      pillCleanup = null;
    };
    // the swimming screen: the blur creeps up with a slow wobble, heavier once you go down
    const swim = window.setInterval(() => {
      const t = performance.now() - t0;
      const ramp = Math.min(1, t / buffer);
      const extra = t > buffer ? Math.min(1, (t - buffer) / 1800) * 4 : 0;
      const px = 0.4 + 5.6 * ramp * ramp + extra + Math.sin(performance.now() / 430) * 1.1 * ramp;
      if (app) app.style.filter = `blur(${Math.max(0, px).toFixed(1)}px)`;
    }, 70);
    pillCleanup = () => stop(false); // leaving the room mid-way ends the dizziness (a started blackout finishes on its own)
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    at(buffer, () => {
      if (disposed) return stop(true);
      faintUntil = performance.now() + 60_000;
      push(chatRef, { uid: me.uid, name: shownName, text: "Faaaahhhh shii", ts: serverTimestamp() }).catch(console.warn);
      p.path = []; p.emote = undefined; p.sit = false; p.sitTo = undefined; pending = null;
      p.faint = true; // they go down
      update(myRef, { lay: true, sit: null }).catch(() => undefined);
    });
    at(buffer + 1400, () => { document.body.append(black); black.style.transition = "opacity 1.4s ease"; requestAnimationFrame(() => { black.style.opacity = "1"; }); });
    at(buffer + 3300, () => {
      // fully black: wake up in your own room
      if (app) app.style.filter = "";
      window.clearInterval(swim);
      pillCleanup = null;
      if (disposed) return;
      faintUntil = 0;
      p.faint = false;
      if (isOwnRoom) {
        const to = sideTile();
        p.from = p.to = p.dest = to; p.path = []; p.dir = 2;
        update(myRef, { x: to.x, y: to.y, dir: 2, lay: null }).catch(() => undefined);
      } else {
        ctx.navigate("room", { roomId: ownRoomId(me.uid), arrival: "bed" });
      }
    });
    at(buffer + 5300, () => { black.style.transition = "opacity 1s ease"; black.style.opacity = "0"; }); // two seconds of black
    at(buffer + 6500, () => { black.remove(); woozy = false; });
  }

  /** Eat a burger from the inventory (no effect yet): you click it. */
  async function eatBurger(): Promise<void> {
    const slot = findSlot(me.inventory, "burger");
    if (slot < 0) return say("You don't have a burger.", "warn");
    try { await eatItem(me, slot); } catch { return say("The burger slips out of your hands. (the hotel refused it)", "warn"); }
    clearSelection();
    panel.refresh();
    playSfx("select", 0.5);
    logAction(me, "room", "ate a burger");
    say("You eat the burger. Greasy. Good.");
  }

  /** A cigarette that has burned for a minute becomes a butt (the server checks the time and gives the stab bonus, or knocks you out for ass weed). */
  const finishing = new Set<number>();
  function burnDown(): void {
    me.inventory.forEach((s, i) => {
      const sm = s ? SMOKABLE[s.item] : undefined;
      if (!s || !sm || !s.lit || serverNow() - s.lit < SMOKE_MS || finishing.has(i)) return;
      finishing.add(i);
      const name = itemDef(s.item)?.name.toLowerCase() ?? "smoke";
      void finishSmoke(me, i).then((r) => {
        const p = mine();
        if (p) { p.smoke = undefined; p.smokeKind = undefined; }
        void update(myRef, { smoke: null, smokeKind: null }).catch(() => undefined);
        panel.refresh();
        if (r.passOut) {
          logAction(me, "room", `smoked ass ${s.item}`);
          say("That was ass weed… it hits you hard. Give it a moment…");
          startWoozy();
        } else {
          const extra: string[] = [];
          if (r.speedMs) extra.push("you're walking twice as fast");
          if (r.chemMs) extra.push("you're flashing and smoke pours off you");
          if (p && (r.speedMs || r.chemMs)) {
            p.fast = me.speedUntil || undefined;
            p.chem = me.chemUntil || undefined;
            void update(myRef, { fast: p.fast ?? null, chem: p.chem ?? null }).catch(() => undefined);
          }
          say(`You finish the ${name}. You feel sharp: stabs give x${r.mult ?? sm.mult} blood for ${Math.round((r.boostMs ?? sm.boostMs) / 60000)} minutes${extra.length ? ` and ${extra.join(", ")}` : ""}.`);
        }
      }).catch(() => undefined).finally(() => window.setTimeout(() => finishing.delete(i), 4000));
    });
  }

  // ---- start: presence, players, chat, events ---------------------------------------
  /** You come in through the door (the tile in front of it), or on login you're standing by your bed; else the nearest free tile. */
  function spawnTile(): Pt {
    const back = opts.from ? def.extraDoors?.find((d) => d.to === opts.from) : undefined; // coming back through a door: stand in front of it
    const want = opts.arrival === "bed" && isOwnRoom ? sideTile() : { x: back ? back.x : def.doorX, y: 1 };
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
    const here = [...players.values()].filter((p) => !p.sleeper);
    online.replaceChildren(
      h("strong", {}, `In room (${here.length})`),
      ...here.map((p) => h("div", { class: p.uid === me.uid ? "me" : "" }, p.name)));
  }

  // ---- offline owners sleep in their bed -----------------------------------------------------------------
  let sleeperToken = 0;
  /** Someone else's room whose owner is offline shows the owner asleep in the bed (you can still stab them). Not stored anywhere. */
  function syncSleeper(): void {
    const owner = def.ownerUid;
    if (!started || disposed || !owner || owner === me.uid || isPublicRoom(roomId)) return;
    const cur = players.get(owner);
    const wanted = !social.isOnline(owner) && !(cur && !cur.sleeper);
    if (!wanted) {
      if (cur?.sleeper) { players.delete(owner); if (hoverPlayer?.uid === owner) hoverPlayer = null; renderOnline(); }
      return;
    }
    if (cur?.sleeper) return;
    const token = ++sleeperToken;
    void fetchProfile(owner).then((pp) => {
      if (disposed || token !== sleeperToken || !pp) return;
      const now = players.get(owner);
      if ((now && !now.sleeper) || social.isOnline(owner)) return;
      const sl = makePlayer(owner, { name: pp.name, figure: pp.figure, x: headTile().x, y: headTile().y, dir: 2 });
      sl.lying = true;
      sl.sleeper = true;
      players.set(owner, sl);
      void renderAvatar({ figure: pp.figure, dir: 2, actions: ["lay"] });
      renderOnline();
    });
  }

  function start(): void {
    if (started || disposed) return;
    started = true;
    const spawn = frozen ? { x: SIXTY.x, y: SIXTY.y } : spawnTile(); // as 6ixty you stand exactly where he stands
    const startDir = frozen ? SIXTY.dir : 2;
    const mineP = makePlayer(me.uid, { name: shownName, figure: shownFigure(), x: spawn.x, y: spawn.y, dir: startDir, sixty: asSixty });
    players.set(me.uid, mineP);
    if (opts.intro && isOwnRoom) {
      // first wake-up: start under the covers (drawn lying on the bed), get up when the eyes have opened
      mineP.lying = true;
      mineP.from = mineP.to = mineP.dest = { ...headTile() };
      introUntil = performance.now() + WAKE_MS;
      const fade = h("div", { class: "wake-fade" });
      stage.append(fade);
      window.setTimeout(() => fade.remove(), WAKE_MS + 800);
    }
    // the introduction's guy: only drawn here (never stored), standing about until you stab him
    if (isTut) {
      const lg = makePlayer(LEGEND.id, { name: LEGEND.name, figure: LEGEND.figure, x: LEGEND.x, y: LEGEND.y, dir: LEGEND.dir });
      if (me.tutorial >= 2) lg.faint = true;
      players.set(LEGEND.id, lg);
      void renderAvatar({ figure: LEGEND.figure, dir: 2, actions: ["lay"] });
      void renderAvatar({ figure: LEGEND.figure, dir: LEGEND.dir });
    }
    // a cigarette still burning from before (you changed rooms) keeps smoking
    const burningItem = me.inventory.find((s) => s && SMOKABLE[s.item] && s.lit && serverNow() - s.lit < SMOKE_MS);
    const burning = burningItem?.lit;
    if (me.speedUntil > serverNow()) mineP.fast = me.speedUntil;
    if (me.chemUntil > serverNow()) mineP.chem = me.chemUntil;
    if (burning) { mineP.smoke = burning; mineP.smokeKind = SMOKABLE[burningItem!.item].kind; }
    void onDisconnect(myRef).remove();
    set(myRef, { name: shownName, figure: shownFigure(), x: spawn.x, y: spawn.y, dir: startDir, ts: serverTimestamp(), ...(burning ? { smoke: burning, smokeKind: SMOKABLE[burningItem!.item].kind } : {}), ...(mineP.fast ? { fast: mineP.fast } : {}), ...(mineP.chem ? { chem: mineP.chem } : {}), ...(asSixty ? { sixty: true } : {}) }).catch(() => kicked("You can't be in that room."));
    unsubs.push(() => sixtyTimers.forEach((t) => window.clearTimeout(t)), () => sixtyShop?.close());
    const burnTimer = window.setInterval(burnDown, 1000);
    unsubs.push(() => window.clearInterval(burnTimer));
    unsubs.push(watchDrops(roomId, (m) => { drops = m; sweepExpired(roomId, m.values()); }));
    const stopPocketWatch = (): void => undefined; void stopPocketWatch;
    const dropSweep = window.setInterval(() => sweepExpired(roomId, drops.values()), 5000);
    unsubs.push(() => window.clearInterval(dropSweep));
    if (isBasement) setAmbience(true); if (roomId === SHOP_ID) setShopMusic(true); // the basement hums: the sound fades in as you arrive
    if (isBasement || asSixty) {
      // 6ixty's look (the admin can change it); as 6ixty you wear it too
      unsubs.push(watchSixtyLook((l) => {
        void renderAvatar({ figure: l.figure, dir: SIXTY.dir, headDir: SIXTY.dir, actions: ["std"], gesture: "std", frame: 0 });
        if (asSixty) {
          const mp = mine();
          if (mp) mp.figure = l.figure;
          void update(myRef, { figure: l.figure }).catch(() => undefined);
        }
      }));
    }
    if (isBasement) {
      // he whispers to anyone he has something for, now and every little while until they come over
      const sixtyCalls = (): boolean => (isTut ? me.tutorial === 0 : sixtyWants()); // (in the introduction he only whispers before you have the knife)
      sixtyAfter(2200, () => { if (sixtyCalls() && !sixtyBusy) sixtySay(SIXTY_LINES.psst, 4500); });
      // you walk over to him by yourself when you come down (the admin plays him and stays put)
      if (!asSixty && isTut) sixtyAfter(900, () => { if (!pending && !mine()?.lying) startSixty(true); }); // only the introduction walks you over
      const psst = window.setInterval(() => {
        if (sixtyCalls() && !sixtyBusy && !sixtyShop && !(sixtyBubble && sixtyBubble.until > performance.now())) sixtySay(SIXTY_LINES.psst, 4500);
      }, 14_000);
      unsubs.push(() => window.clearInterval(psst));
    }
    setPresenceRoom(me, isTut ? ownRoomId(me.uid) : roomId); // the private copy isn't a place friends can follow you to
    unsubs.push(social.subscribe(syncSleeper));
    tutorialGuide();
    if (isTut && me.tutorial === 1) say("Tap the glowing knife in your pocket, then tap LegendGamer2015.");
    if (isTut && me.tutorial === 3) say("Tap the glowing pill in your pocket to swallow it.");

    const denied = () => kicked("You don't have access to that room.");
    // what the database lists as standing here; people whose session has died (no heartbeat, or no presence any more) are hidden, not drawn as ghosts
    const known = new Map<string, any>();
    const visible = (uid: string): boolean => !social.presenceLoaded || social.isOnline(uid);
    function applyVisibility(): void {
      if (disposed) return;
      let changed = false;
      for (const [uid, v] of known) {
        const p = players.get(uid);
        const vis = visible(uid);
        if (!vis && p && !p.sleeper) { players.delete(uid); if (hoverPlayer?.uid === uid) hoverPlayer = null; changed = true; }
        else if (vis && !p) { players.set(uid, makePlayer(uid, v)); renderAvatar({ figure: v.figure, dir: 2 }); changed = true; }
      }
      if (changed) { renderOnline(); syncSleeper(); }
    }
    unsubs.push(social.subscribe(applyVisibility));
    const ghostTimer = window.setInterval(applyVisibility, 30_000);
    unsubs.push(() => window.clearInterval(ghostTimer));
    unsubs.push(
      onChildAdded(playersRef, (snap) => {
        if (snap.key === me.uid) return;
        const v = snap.val();
        known.set(snap.key!, v);
        if (!visible(snap.key!)) return;
        players.set(snap.key!, makePlayer(snap.key!, v));
        renderAvatar({ figure: v.figure, dir: 2 });
        renderOnline();
      }, denied),
      onChildChanged(playersRef, (snap) => {
        if (snap.key === me.uid) return;
        const v = snap.val();
        known.set(snap.key!, v);
        const p = players.get(snap.key!);
        if (!p) return;
        p.name = v.name;
        p.figure = v.figure;
        p.smoke = typeof v.smoke === "number" ? v.smoke : undefined;
        p.smokeKind = typeof v.smokeKind === "string" ? v.smokeKind : undefined;
        p.fast = typeof v.fast === "number" ? v.fast : undefined;
        p.chem = typeof v.chem === "number" ? v.chem : undefined;
        p.npc = v.sixty === true;
        p.sit = v.sit === true;
        p.faint = v.lay === true;
        if (p.sit && typeof v.dir === "number") p.dir = v.dir;
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
            set(myRef, { name: shownName, figure: shownFigure(), x: t.x, y: t.y, dir: mineNow.dir, ts: serverTimestamp(), ...(asSixty ? { sixty: true } : {}) }).catch(() => undefined);
          }
          return;
        }
        known.delete(snap.key!);
        players.delete(snap.key!);
        if (hoverPlayer?.uid === snap.key) { hoverPlayer = null; updateHint(); }
        renderOnline();
        syncSleeper(); // the owner just left: back to bed
      }),
      onChildAdded(query(chatRef, orderByChild("ts"), limitToLast(40)), (snap) => {
        const m = snap.val();
        if (!m) return;
        const age = typeof m.ts === "number" ? serverNow() - m.ts : 0;
        if (age >= CHAT_LIFE_MS) { void remove(snap.ref).catch(() => undefined); return; } // already expired: not shown, cleaned up
        addLine(h("div", { class: "line" }, h("b", { class: m.uid === me.uid ? "me" : "" }, m.name + ": "), m.text), CHAT_LIFE_MS - age, snap.ref);
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
    const chatSweep = window.setInterval(sweepChat, 20_000);
    unsubs.push(() => window.clearInterval(chatSweep));
    // the lobby has a CD player; its state is shared with everyone in the room
    if (roomId === LOBBY_ID) unsubs.push(watchCdPlayer(onCdState));
    renderOnline();
    syncSleeper();
  }

  /** TEMP test commands (/giveblud 25, /weed): only the admin account gets anything from the server. */
  async function testCommand(cmd: "blood" | "weed", n?: number): Promise<void> {
    try {
      const note = await debugCommand(me, cmd, n);
      ctx.refreshHeader();
      panel.refresh();
      say(note || "(test) Done.");
    } catch (err) {
      say((err as Error).message || "Unknown command.", "warn");
    }
  }

  function send(): void {
    const text = input.value.trim().slice(0, MAX_CHARS);
    if (!text) return;
    input.value = "";
    if (text.startsWith("/")) {
      // TEMP-GIVEBLUD: testing command, remove together with the 'testBlood' rule in database.rules.template.json
      if (/^\/weed$/i.test(text)) { void testCommand("weed"); return; } // TEMP: testing command (admin only), remove when asked
      const gift = /^\/giveblud\s+(\d{1,4})$/i.exec(text);
      if (gift) { void testCommand("blood", Math.min(1000, Number(gift[1]))); return; }
      const id = text.slice(1).toLowerCase();
      if (EMOTE_BY_ID[id]) return performEmote(id);
      return say(`Unknown command. Emotes: ${Object.keys(EMOTE_BY_ID).map((e) => "/" + e).join(" ")}`, "warn");
    }
    push(chatRef, { uid: me.uid, name: shownName, text, ts: serverTimestamp() }).catch(console.warn);
  }

  // ---- render helpers ----------------------------------------------------------------
  /** how far a sitting player is lifted: the height of the seat under them */
  function sitLift(p: Player): number {
    const t = currentTile(p);
    const piece = seatTiles.get(`${t.x},${t.y}`);
    return piece ? FURNI_KINDS[piece.kind].seatHeight ?? 14 : 0;
  }

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

    // smoking: the hand is up at the mouth (the "drink" arm pose with no cup; the cigarette itself is drawn on top)
    // (holding a knife: the arm is out in the "carry" pose, and the knife itself is drawn in that hand)
    const sitting = !moving && !!p.sit && !em;
    if (sitting) yOff = -sitLift(p);
    const actions = moving ? ["wlk"] : em?.def.actions ?? (!em && isSmoking(p) ? ["drk=9999"] : !em && holdsKnife(p, now) ? ["crr=9999"] : sitting ? ["sit"] : ["std"]);
    const gesture = talking ? "spk" : em?.def.gesture ?? "std";
    const frame = moving
      ? Math.floor((now - p.stepStart) / (stepOf(p) / 4)) % 4
      : talking ? Math.floor(now / 140) % 2
      : em?.def.actions?.includes("wav") ? Math.floor(now / 250) % 2
      : 0;
    return { opts: { figure: p.figure, dir, headDir: dir, actions, gesture, frame }, yOff };
  }

  /** The knife (Habbo's survival knife, one picture per way it can point) in a player's hand: while it's selected, and during a stab. */
  function drawKnifeInHand(fx: number, fy: number, dir: number): void {
    const n = nitroIfReady(KNIFE_NITRO);
    if (!n) return;
    const [hdx, hdy] = KNIFE_HAND[dir] ?? KNIFE_HAND[2];
    const [ux, uy] = KNIFE_AXIS[dir] ?? KNIFE_AXIS[2]; // which way the blade points on screen = the way they face
    const hx = fx + hdx * scale; // the fist (where the arm ends in the "carry" pose)
    const hy = fy + hdy * scale;
    const k = scale * 0.7;
    g.save();
    g.imageSmoothingEnabled = false;
    for (const s of spritesFor(n, dir)) {
      if (s.isShadow) continue;
      // the grip sits in the fist: a little way in from the handle end, along the knife's length
      const half = Math.hypot(s.sw, s.sh) * 0.95 * 0.5;
      const gripX = s.sw / 2 - ux * half * 0.55;
      const gripY = s.sh / 2 - uy * half * 0.55;
      g.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, hx - gripX * k, hy - gripY * k, s.sw * k, s.sh * k);
    }
    g.restore();
  }
  // a knife in the hand: selected in your inventory (your own avatar), or mid-stab (everyone sees the attacker). The avatar's arm is held out for it.
  const holdsKnife = (p: Player, now: number): boolean =>
    (p.uid === me.uid && selectedDef()?.useOnPlayer === "stab") || stabFx.some((fx) => fx.from === p.uid && (now - fx.start) / STAB_MS <= 1.05);

  /** A cigarette at the mouth and a thin stream of smoke rising from the tip. (fx, fy) = the player's feet, `dir` the way they face. */
  function drawCigarette(fx: number, fy: number, dir: number, now: number, kind?: string): void {
    const blunt = kind === "blunt", joint = kind === "joint";
    const side = dir >= 1 && dir <= 3 ? 1 : dir >= 5 && dir <= 7 ? -1 : 0; // which side of the face the cigarette sticks out on
    const s = scale;
    const mx = fx + side * 5 * s;                 // the mouth
    const my = fy - (FEET_Y - 51) * s;
    const tipx = mx + (side || 1) * 11 * s;
    const tipy = my + 2.5 * s;
    g.save();
    g.lineCap = "round";
    // turned away from the camera the mouth is on the far side of the head: no cigarette in front of the hair, only the smoke drifting up
    const away = dir === 6 || dir === 7 || dir === 0;
    if (!away) {
    // dark edge first so the white paper reads against a pale shirt or a hand
    // a joint is a cigarette with no orange filter; a blunt is the same shape in brown and a bit fatter
    g.strokeStyle = "rgba(30,24,20,0.75)"; g.lineWidth = (blunt ? 5 : 4.2) * s;
    g.beginPath(); g.moveTo(mx, my); g.lineTo(tipx, tipy); g.stroke();
    g.strokeStyle = blunt ? "#8b5a2b" : "#fbf8f0"; g.lineWidth = (blunt ? 3.4 : 2.6) * s;
    g.beginPath(); g.moveTo(mx, my); g.lineTo(tipx, tipy); g.stroke();
    if (!blunt && !joint) {
      g.strokeStyle = "#d98a2b"; g.lineWidth = 2.6 * s; // the filter
      g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + (side || 1) * 3 * s, my + 0.7 * s); g.stroke();
    }
    g.strokeStyle = "#ff6a1a"; g.lineWidth = 3 * s;
    g.beginPath(); g.moveTo(tipx - (side || 1) * 1.6 * s, tipy - 0.3 * s); g.lineTo(tipx, tipy); g.stroke();
    }
    // smoke: a few soft puffs that drift up, widen and fade
    for (let i = 0; i < 6; i++) {
      const t = (now / 1900 + i / 6) % 1;
      const px = tipx + Math.sin(t * 7 + i * 1.7) * 3.5 * s + t * 3 * s * (side || 1);
      const py = tipy - t * 36 * s;
      const r = (1.6 + t * 4.2) * s;
      g.fillStyle = `rgba(222,224,230,${(0.42 * (1 - t)).toFixed(3)})`;
      g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  /** A growing kit: an empty pot; once planted the plant is revealed from the bottom up as it grows, with a growth bar and a water bar over it. */
  function drawPlanter(f: { id?: string; kind: string; x: number; y: number; dir?: number; plant?: { at: number; water: number; neglect: boolean } }, now: number): Hitbox | null {
    const k = FURNI_KINDS[f.kind];
    const full = k.nitro ? nitroIfReady(k.nitro) : undefined;
    if (!full) return null;
    const dir = f.dir ?? 0;
    const pot = drawNitroSprites(g, potArt ?? full, 1, 1, f.x, f.y, dir, k.nudge, toScreen, scale);
    const pl = f.plant;
    let box = pot;
    if (pl) {
      const prog = plantProgress(pl);
      const water = plantWater(pl);
      g.save();
      const probe = drawNitroSpritesBox(full, f, dir);
      if (probe) {
        const hh = probe.y1 - probe.y0;
        const shown = 0.34 + 0.66 * prog; // a seedling shows at once, the full plant when it's grown
        g.beginPath();
        g.rect(probe.x0 - 2, probe.y1 - hh * shown, probe.x1 - probe.x0 + 4, hh * shown + 2);
        g.clip();
        drawNitroSprites(g, full, 1, 1, f.x, f.y, dir, k.nudge, toScreen, scale);
        box = probe;
      }
      g.restore();
      if (box) {
        const bw = 30 * scale, bh = 4 * scale, cx = (box.x0 + box.x1) / 2, y = box.y0 - 7 * scale;
        const bar = (yy: number, frac: number, color: string) => {
          g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(cx - bw / 2 - scale, yy - scale, bw + 2 * scale, bh + 2 * scale);
          g.fillStyle = "#222"; g.fillRect(cx - bw / 2, yy, bw, bh);
          g.fillStyle = color; g.fillRect(cx - bw / 2, yy, bw * Math.max(0, Math.min(1, frac)), bh);
        };
        bar(y, prog, prog >= 1 ? "#9dff5a" : "#4fa93a"); // growth
        bar(y + bh + 3 * scale, water, water > 0 ? "#4aa8e8" : "#7a2a2a"); // water
        if (prog >= 1) {
          const bounce = Math.sin(now / 260) * 2 * scale;
          g.font = `bold ${Math.round(10 * Math.max(1, scale))}px Verdana, sans-serif`; g.textAlign = "center"; g.textBaseline = "bottom";
          g.lineWidth = 3; g.strokeStyle = "#000"; g.strokeText("ready!", cx, y - 3 * scale + bounce);
          g.fillStyle = "#c8ff8a"; g.fillText("ready!", cx, y - 3 * scale + bounce);
          g.textAlign = "start";
        }
      }
    }
    return box ? { id: "", ...box, depth: f.x + f.y } : null;
  }
  /** The screen box the full-grown plant art covers (without drawing it). */
  function drawNitroSpritesBox(n: NitroFurni, f: { x: number; y: number }, dir: number): Box | null {
    const k = FURNI_KINDS["f_planter"];
    let box: Box | null = null;
    const o = toScreen(iso(f.x + 0.5, f.y + 0.5));
    for (const s of spritesFor(n, dir)) {
      if (s.isShadow || s.sw <= 2 || s.sh <= 2) continue;
      const left = o.x + (k.nudge?.x ?? 0) * scale + s.dx * scale, top = o.y + (k.nudge?.y ?? 0) * scale + s.dy * scale;
      const b2 = { x0: left, y0: top, x1: left + s.sw * scale, y1: top + s.sh * scale };
      box = box ? { x0: Math.min(box.x0, b2.x0), y0: Math.min(box.y0, b2.y0), x1: Math.max(box.x1, b2.x1), y1: Math.max(box.y1, b2.y1) } : b2;
    }
    return box;
  }

  function drawFurni(f: { id?: string; kind: string; x: number; y: number; dir?: number; plant?: { at: number; water: number; neglect: boolean } }, now: number): Hitbox | null {
    const k = FURNI_KINDS[f.kind];
    if (k.plant) return drawPlanter(f, now);
    if (k.nitro) {
      const b = drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale);
      if (b && k.opens && k.opens !== "sink" && k.opens !== "intercom" && k.opens !== "mixer" && (isOwnRoom || k.opens === "shop" || k.opens === "vending")) {
        // the bag of clothes: a soft pulsing glow, a floating hanger, and a brighter light when you point at it or walk to it
        const hot = (!!f.id && hoverObj?.id === f.id) || (pending?.type === "bag" && pending.fid === f.id);
        const pulse = 0.5 + 0.5 * Math.sin(now / 450);
        const cx = (b.x0 + b.x1) / 2;
        const cy = (b.y0 + b.y1) / 2;
        const r = 42 * scale * (hot ? 1.2 : 1);
        // a warm gold halo (plain alpha, so it shows on the pale room background too), then the bag lit up on top when pointed at
        g.save();
        const halo = g.createRadialGradient(cx, cy, 2 * scale, cx, cy, r);
        const a = 0.11 + 0.05 * pulse + (hot ? 0.14 : 0);
        halo.addColorStop(0, `rgba(255,214,70,${a.toFixed(2)})`);
        halo.addColorStop(0.55, `rgba(255,200,40,${(a * 0.6).toFixed(2)})`);
        halo.addColorStop(1, "rgba(255,200,40,0)");
        g.fillStyle = halo;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
        g.restore();
        drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale); // the bag again, on top of the halo
        if (hot) {
          g.save();
          g.globalCompositeOperation = "lighter";
          drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 0.12 + 0.05 * pulse);
          g.restore();
        }
        // the hanger is only a hint: it floats over the bag until you've left your room for the first time, after that it only appears when the mouse is on the bag
        const showHanger = !me.seenDoor || hot;
        const hint = k.opens === "furnish" ? toolIconImg : k.opens === "vending" ? basketIconImg : hangerImg; // the toolbox floats a little house, the vending machine a basket, the bag a hanger
        if (showHanger && hint.complete && hint.naturalWidth) {
          const hs = scale * (k.opens === "furnish" || k.opens === "vending" ? (hot ? 0.95 : 0.8) : hot ? 0.5 : 0.42);
          const hw = hint.naturalWidth * hs;
          const hh = hint.naturalHeight * hs;
          const bob = Math.sin(now / 380) * 3 * scale;
          g.save();
          g.imageSmoothingEnabled = false;
          g.shadowColor = "rgba(255,226,140,0.7)";
          g.shadowBlur = (hot ? 6 : 3) * scale;
          g.drawImage(hint, cx - hw / 2, b.y0 - hh - 2 * scale + bob, hw, hh);
          g.restore();
        }
        // while the hanger always shows, the click box covers it too
        return { id: "", ...b, y0: me.seenDoor ? b.y0 : b.y0 - 22 * scale, depth: f.x + f.y };
      }
      return b ? { id: "", ...b, depth: f.x + f.y } : null;
    }
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
    } else if (f.kind === "lamp") {    } else if (f.kind === "lamp") {
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
      g.fillText(gl.glyph, f.x + gl.ox * scale, f.y - (p.sleeper ? 34 : FEET_Y + 6) * scale - age * 0.035 * scale);
    }
    g.globalAlpha = 1;

    // floating "+1"
    for (const f of floaters) {
      const age = now - f.born;
      const life = f.life ?? 1100;
      g.globalAlpha = Math.max(0, Math.min(1, (life - age) / (life * 0.45)));
      const fsz = Math.round(16 * Math.max(1, scale));
      g.font = `bold ${fsz}px Verdana, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 3;
      g.strokeStyle = "#000";
      const fy = f.y - age * 0.04;
      let fx = f.x;
      if (f.icon?.complete && f.icon.naturalWidth) {
        const sz = fsz * 1.7;
        const tw = g.measureText(f.text).width;
        const pop = 1 + 0.35 * Math.max(0, 1 - age / 260); // a little pop as it appears
        const left = f.x - (sz + 4 + tw) / 2;
        fx = left + sz + 4 + tw / 2;
        g.drawImage(f.icon, left + sz / 2 - (sz * pop) / 2, fy - (sz * pop) / 2, sz * pop, sz * pop);
      }
      g.strokeText(f.text, fx, fy);
      g.fillStyle = f.color;
      g.fillText(f.text, fx, fy);
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
        if (active) playSfx("stab", 0.5); // the blade lands (everyone in the room hears it)
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
        if (a && d.from === me.uid && lastStabGain > 0) {
          const f = feetOf(a, now);
          floaters.push({ text: `+${lastStabGain}`, x: f.x, y: f.y - 70 * scale, born: now, color: "#ff5252" });
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

    // sleepers breathe out little zzz's
    for (const p of players.values()) {
      if (p.sleeper && now - (zzzAt.get(p.uid) ?? 0) > 1100) {
        zzzAt.set(p.uid, now);
        glyphs.push({ uid: p.uid, glyph: "💤", born: now, life: 1900, ox: 10 + (Math.random() - 0.5) * 16 });
      }
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
    for (let i = floaters.length - 1; i >= 0; i--) if (now - floaters[i].born > (floaters[i].life ?? 1100)) floaters.splice(i, 1);
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
    if (introUntil && performance.now() >= introUntil) {
      // eyes open: get out of bed and stand next to it
      const mp = mine();
      if (mp) { mp.lying = false; mp.from = mp.to = mp.dest = { ...sideTile() }; mp.dir = 2; }
      introUntil = 0;
    }
    // until you've opened the door once, it flashes to show you where to go
    const flashing = isOwnRoom && !me.seenDoor && !introUntil && started;
    const glow = Math.max(hoverDoor ? 1 : 0, flashing ? 0.55 + 0.45 * Math.sin(performance.now() / 280) : 0);
    doorBox = drawRoomDoor(g, def.doorX, toScreen, scale, glow, def.theme.style === "grime");
    extraDoorBoxes = (def.extraDoors ?? []).map((d, i) => ({ door: d, box: drawRoomDoor(g, d.x, toScreen, scale, hoverExtra === i ? 1 : 0, d.yellow ? "yellow" : def.theme.style === "grime") }));

    if (!started) return;
    for (const p of players.values()) advance(p, now);
    { const mp = mine(); if (mp) finishSit(mp, now); }
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
    if (furnishOn) drawFurnishOverlay(); else drawCarryGhost();

    type Drawable = { depth: number; draw: () => void };
    const list: Drawable[] = [];
    const boxes: Hitbox[] = [];
    const objs: Hitbox[] = [];
    const bubbles: Array<() => void> = [];
    const pieceBoxes: Array<{ id: string; box: Box; depth: number }> = [];

    for (const f of def.furni) {
      list.push({
        // flat pieces lie on the floor, so they're drawn before (underneath) everyone else
        depth: FURNI_KINDS[f.kind].flat ? -1
          : FURNI_KINDS[f.kind].nitro ? f.x + footprint(f.kind, f.dir).w - 1 + f.y + footprint(f.kind, f.dir).h - 1 + 0.25 // sprite pieces: their far tile, so people beside them stand in front
          : f.x + footprint(f.kind, f.dir).w + f.y + footprint(f.kind, f.dir).h - 1,
        draw: () => {
          const box = drawFurni(f, now);
          if (box && furnishOn) pieceBoxes.push({ id: f.id, box, depth: box.depth });
          if (box && FURNI_KINDS[f.kind].seat && !isDisplayPiece(f.id)) objs.push({ ...box, id: f.id, kind: f.kind });
          // the bag of clothes can be clicked in your own room only
          if (box && (INTERACTIVE_KINDS.has(f.kind) || isBodyBag(f.kind) || (FURNI_KINDS[f.kind].opens && (isOwnRoom || FURNI_KINDS[f.kind].opens === "shop" || FURNI_KINDS[f.kind].opens === "vending")) || FURNI_KINDS[f.kind].plant || isDisplayPiece(f.id))) objs.push({ ...box, id: f.id, kind: f.kind });
        },
      });
    }

    // things lying on the floor: their inventory picture, with a little shadow (players stand in front of them)
    if (!furnishOn) {
      for (const d of drops.values()) {
        if (isExpired(d)) continue;
        const dw = iso(d.x, d.y);
        const c = toScreen({ x: dw.x, y: dw.y + TILE_H / 2 });
        const im = iconFor(d.item);
        const sz = 32 * scale;
        const id = `drop:${d.key}`;
        objs.push({ id, kind: "drop", x0: c.x - 15 * scale, x1: c.x + 15 * scale, y0: c.y - 26 * scale, y1: c.y + 8 * scale, depth: d.x + d.y + 0.2 });
        const hot = hoverObj?.id === id;
        list.push({
          depth: d.x + d.y + 0.2,
          draw: () => {
            g.fillStyle = "rgba(0,0,0,0.22)";
            g.beginPath(); g.ellipse(c.x, c.y + 1 * scale, 12 * scale, 5 * scale, 0, 0, Math.PI * 2); g.fill();
            if (hot) { g.strokeStyle = "rgba(255,226,122,0.95)"; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y + 1 * scale, 15 * scale, 7 * scale, 0, 0, Math.PI * 2); g.stroke(); }
            if (im.complete && im.naturalWidth) g.drawImage(im, c.x - sz / 2, c.y - sz * 0.9, sz, sz);
            if (d.qty > 1) {
              g.font = `bold ${Math.round(10 * Math.max(1, scale))}px Verdana, sans-serif`;
              g.textAlign = "right"; g.textBaseline = "alphabetic";
              g.lineWidth = 3; g.strokeStyle = "rgba(0,0,0,0.8)"; g.strokeText(String(d.qty), c.x + sz / 2, c.y - 2 * scale);
              g.fillStyle = "#ffe27a"; g.fillText(String(d.qty), c.x + sz / 2, c.y - 2 * scale);
              g.textAlign = "start";
            }
          },
        });
      }
    }

    if (isBasement) {
      // 6ixty: not a player, just drawn here; clicking him is how you meet him
      const look = sixtyLook();
      const talking = !!sixtyBubble && sixtyBubble.until > now;
      const sopts = { figure: look.figure, dir: SIXTY.dir, headDir: SIXTY.dir, actions: ["std"], gesture: talking ? "spk" : "std", frame: talking ? Math.floor(now / 140) % 2 : 0 };
      let simg = getCached(sopts);
      if (!simg) { renderAvatar(sopts); simg = sixtyLast; } else sixtyLast = simg;
      const sw = iso(SIXTY.x, SIXTY.y);
      const sf = toScreen({ x: sw.x, y: sw.y + TILE_H / 2 });
      // when the admin is in the room they ARE 6ixty (a real player standing here), so the stand-in steps aside
      const sixtyHere = [...players.values()].some((q) => q.npc);
      if (!sixtyHere) objs.push({ id: SIXTY.id, kind: "npc", x0: sf.x - 22 * scale, x1: sf.x + 22 * scale, y0: sf.y - FEET_Y * scale, y1: sf.y + 8 * scale, depth: SIXTY.x + SIXTY.y });
      const sHot = hoverObj?.kind === "npc";
      if (!sixtyHere) list.push({
        depth: SIXTY.x + SIXTY.y + 0.5,
        draw: () => {
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath(); g.ellipse(sf.x, sf.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2); g.fill();
          if (simg) g.drawImage(simg, sf.x - 32 * scale, sf.y - FEET_Y * scale, simg.width * scale, simg.height * scale);
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, sans-serif`;
          const tw = g.measureText(SIXTY.name).width + 10;
          g.fillStyle = sHot ? "rgba(120,80,10,0.9)" : "rgba(0,0,0,0.55)";
          g.beginPath(); g.roundRect(sf.x - tw / 2, sf.y + 7 * scale, tw, 14 * Math.max(1, scale), 5); g.fill();
          g.fillStyle = "#ff3b3b";
          g.textBaseline = "top"; g.textAlign = "center";
          g.fillText(SIXTY.name, sf.x, sf.y + 9 * scale);
          g.textAlign = "start";
        },
      });
      if (sixtyBubble && sixtyBubble.until > now) {
        const left = sixtyBubble.until - now;
        const sb = sixtyBubble;
        bubbles.push(() => drawBubble(sb.text, SIXTY.name, sf.x, sf.y - (FEET_Y + 4) * scale, left < 800 ? left / 800 : 1));
      }
    }

    furniBoxes = pieceBoxes;
    for (const p of players.values()) {
      if (furnishOn) break; // the furnishing menu shows the room, not the people in it
      if (p.lying || p.faint) {
        // asleep (or just waking up): drawn lying on the bed; or passed out on the floor wherever they were
        const dh = p.lying ? headTile() : currentTile(p);
        const lopts = { figure: p.figure, dir: 2, actions: ["lay"] };
        let limg = getCached(lopts);
        if (!limg) { renderAvatar(lopts); limg = p.last; } else p.last = limg;
        const c = feetOf(p, now);
        let lflash = 0;
        for (const fx of stabFx) { const t = (now - fx.start) / STAB_MS; if (t <= 1 && fx.to === p.uid) lflash = Math.max(lflash, flashAmount(t)); }
        const ax = c.x + LAY_DX * scale;
        const ay = c.y + LAY_DY * scale;
        const lw = (limg?.width ?? 110) * scale;
        const lh = (limg?.height ?? 64) * scale;
        // clickable area = just the sleeping body (the picture itself has a lot of empty padding around it)
        boxes.push({ id: p.uid, x0: ax + 66 * scale, x1: ax + 166 * scale, y0: ay + 38 * scale, y1: ay + 98 * scale, depth: dh.x + dh.y + 3 });
        list.push({
          depth: p.lying ? headTile().x + 3 - 1 + headTile().y + 0.6 : dh.x + dh.y + 0.6, // just after the bed itself
          draw: () => {
            if (limg) {
              g.drawImage(limg, ax, ay, lw, lh);
              if (lflash > 0.02) g.drawImage(redWash(limg, lflash), ax, ay, lw, lh);
            }
            const targeted = hoverPlayer?.uid === p.uid && p.uid !== me.uid && selectedDef()?.useOnPlayer === "stab";
            g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, sans-serif`;
            const label = p.sleeper ? `${p.name} 💤` : p.name;
            const tw = g.measureText(label).width + 10;
            g.fillStyle = targeted ? "rgba(150,20,20,0.85)" : "rgba(0,0,0,0.55)";
            g.beginPath();
            const lx = c.x + 32 * scale; // under the middle of the bed
            const ly = c.y + 26 * scale;
            g.roundRect(lx - tw / 2, ly, tw, 14 * Math.max(1, scale), 5);
            g.fill();
            g.fillStyle = "#fff";
            g.textBaseline = "top";
            g.textAlign = "center";
            g.fillText(label, lx, ly + 2 * scale);
            g.textAlign = "start";
          },
        });
        continue;
      }
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
      const smoking = !isMoving(p, now) && isSmoking(p);

      boxes.push({ id: p.uid, x0: feet.x - 22 * scale, x1: feet.x + 22 * scale, y0: feet.y - FEET_Y * scale, y1: feet.y + 8 * scale, depth: pos.x + pos.y });
      list.push({
        depth: pos.x + pos.y + 0.5 + (p.sit && !isMoving(p, now) ? 1.2 : 0),
        draw: () => {
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath();
          g.ellipse(feet.x + lunge.x, feet.y + lunge.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
          g.fill();
          // facing away from the camera (up-right, up-left, up) the knife hand is behind the body: draw the knife first so the body covers it
          const knifeOut = !isMoving(p, now) && !p.emote && !smoking && holdsKnife(p, now);
          const knifeBehind = knifeOut && (p.dir === 6 || p.dir === 7 || p.dir === 0);
          if (knifeBehind) drawKnifeInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir);
          // the introduction's guy flashes and glows until he's been stabbed
          const glowing = isTut && p.uid === LEGEND.id && me.tutorial === 1;
          const pulse = 0.5 + 0.5 * Math.sin(now / 170);
          if (glowing) {
            const gx = feet.x, gy = feet.y - 44 * scale, gr = (40 + 14 * pulse) * scale;
            const grad = g.createRadialGradient(gx, gy, 4 * scale, gx, gy, gr);
            grad.addColorStop(0, `rgba(255,226,122,${(0.55 + 0.3 * pulse).toFixed(2)})`);
            grad.addColorStop(1, "rgba(255,226,122,0)");
            g.fillStyle = grad;
            g.beginPath(); g.arc(gx, gy, gr, 0, Math.PI * 2); g.fill();
          }
          const chemOn = !!p.chem && serverNow() < p.chem;
          if (img) {
            const ax = feet.x + lunge.x - 32 * scale;
            const ay = feet.y + lunge.y + lift - FEET_Y * scale;
            if (glowing) { g.save(); g.shadowColor = `rgba(255,214,90,${(0.75 + 0.25 * pulse).toFixed(2)})`; g.shadowBlur = (10 + 18 * pulse) * scale; }
            else if (chemOn) { g.save(); g.shadowColor = `hsla(${Math.floor(now / 2.5) % 360},100%,60%,0.95)`; g.shadowBlur = (14 + 14 * Math.abs(Math.sin(now / 90))) * scale; }
            g.drawImage(img, ax, ay, img.width * scale, img.height * scale);
            if (glowing || chemOn) g.restore();
            if (chemOn) { // smoke pours off you
              for (let i = 0; i < 10; i++) {
                const t = (now / 1400 + i / 10) % 1;
                const px = feet.x + lunge.x + Math.sin(t * 9 + i * 2.1) * (10 + t * 14) * scale;
                const py = feet.y + lunge.y + lift - (14 + t * 70) * scale;
                g.fillStyle = `rgba(244,244,248,${(0.85 * (1 - t)).toFixed(3)})`; g.strokeStyle = `rgba(80,84,96,${(0.55 * (1 - t)).toFixed(3)})`; g.lineWidth = 1.2;
                g.beginPath(); g.arc(px, py, (4 + t * 10) * scale, 0, Math.PI * 2); g.fill(); g.stroke();
              }
            }
            if (flash > 0.02) g.drawImage(redWash(img, flash), ax, ay, img.width * scale, img.height * scale);
          }
          if (smoking) drawCigarette(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, now, p.smokeKind);
          if (knifeOut && !knifeBehind) drawKnifeInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir);
          // name plate (highlighted while it's a valid stab target)
          const targeted = hoverPlayer?.uid === p.uid && p.uid !== me.uid && selectedDef()?.useOnPlayer === "stab";
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, sans-serif`;
          const tw = g.measureText(p.name).width + 10;
          g.fillStyle = targeted ? "rgba(150,20,20,0.85)" : "rgba(0,0,0,0.55)";
          g.beginPath();
          g.roundRect(feet.x - tw / 2, feet.y + 7 * scale, tw, 14 * Math.max(1, scale), 5);
          g.fill();
          g.fillStyle = p.npc ? "#ff3b3b" : p.uid === me.uid ? "#ffe27a" : "#fff";
          g.textBaseline = "top";
          g.textAlign = "center";
          g.fillText(p.name, feet.x, feet.y + 9 * scale);
          if (glowing) { // a little arrow bobbing over his head
            g.fillStyle = "#ffd54a";
            g.font = `${Math.round(16 * Math.max(1, scale))}px Verdana, sans-serif`;
            g.fillText("▼", feet.x, feet.y - (FEET_Y + 14) * scale + Math.sin(now / 200) * 4 * scale);
          }
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
    if (roomId === SHOP_ID) {
      applyDef(shopDef(picksToday()));
      start();
      unsubs.push(onFurniShopChanged(() => { if (!disposed) applyDef(shopDef(picksToday())); })); // the admin swapped a piece
      return;
    }
    if (isTut) {
      applyDef(tutDef(me.uid)); // the same room, without the body bag or anything else the admin put there
      start();
      return;
    }
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
      if (!(await canEnter(meta, me.uid, social.friendUids()))) return kicked(`${meta.ownerName}'s room is closed. Knock on its door from the basement to ask.`);
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
    window.removeEventListener("pocket-changed", onPocket);
    unsubs.forEach((u) => u());
    if (isBasement) setAmbience(false); if (roomId === SHOP_ID) setShopMusic(false);
    endPress();
    doorApi?.close();
    furniBuyApi?.close();
    vendingApi?.close();
    intercomApi?.close();
    mixerApi?.close();
    dropConfirmApi?.close();
    pillCleanup?.();
    furnishUi?.dispose();
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
      if (isBasement) setAmbience(true); if (roomId === SHOP_ID) setShopMusic(true);
      panel.refresh();
      layout();
      ctx.refreshHeader();
    },
    hide() {
      active = false;
      if (isBasement) setAmbience(false); if (roomId === SHOP_ID) setShopMusic(false);
      sixtyShop?.close();
      furniBuyApi?.close();
      vendingApi?.close();
      exitFurnish();
      closeCdPopup();
      closeMenu();
      doorApi?.close();
    },
    figureChanged() {
      const p = mine();
      if (!p) return;
      p.figure = shownFigure();
      void renderAvatar({ figure: p.figure, dir: 2 });
      update(myRef, { figure: me.figure }).catch(() => undefined);
    },
  };
}
