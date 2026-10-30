import { STAGE_DEFAULT, STAGE_KINDS } from "../shared/stage";
import {
  get,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onDisconnect,
  onValue,
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
import { db, useEmulator } from "../firebase";
import { getCached, renderAvatar } from "../avatarService";
import { plantThirsty, plantWatered } from "../db";
import { giveCommand } from "../db";
import { puffVape, call, useFurniState, canStab, combineSlots, debugCommand, eatItem, fillCan, finishSmoke, harvestPlant, lightItem, plantProgress, plantSeed, plantWater, attachUpgrade, swallowPill, waterPlant, rewardFlappyDrop, dumpsterWaitMs, msUntilNextStab, searchDumpster, rewardStab, rewardSyringe, sixtyGiveKnife, SYRINGE_BLOOD, serverNow, FIRST_BLOOD, JOB_REWARD, jobReady, jobWaitMs, rewardFirstStab, sixtyGivePill, sixtyJobMoney, sixtyJobReward, syringeWaitMs } from "../db";
import { itemEntry } from "../shopConfig";
import { Drop, dropItem, isExpired, landingTile, pickUpDrop, sweepExpired, watchDrops, whyNotDrop, dropKey } from "../drops";
import { DropConfirmApi, openDropConfirm } from "./dropConfirm";
import { BAGMAN, HIDEOUT_LANDLORD, LANDLORD, PET_MERCHANT, LEGEND, SIXTY, SIXTY_LINES, sixtyCheckIn, sixtyLook, watchSixtyLook } from "../npc";
import { openBagmandShop, BagmandShopApi } from "./bagmandShop";
import { openCdPress } from "./cdPress";
import { openBeatShop } from "./beatShop";
import { openElevator } from "./elevator";
import { mountStreets } from "../streets";
import type { StreetsApi } from "../streets";
import { ARRIVAL_ELEVATOR, arrivalDef, ARRIVAL_ID, streetsDef, STREETS_ID } from "../rooms";
import { isBuiltInStreetPiece, isStreetsRoom, STREET_POS_KEY, STREET_RETURN_KEY, STREET_RETURN_MS, STREETS_DAY } from "../shared/streets";
import { openHideoutComputer, ComputerApi } from "./hideoutComputer";
import { openHideoutLandlord } from "./hideoutLandlord";
import { openHideoutDoor } from "./hideoutDoor";
import { openPetShop } from "./petShop";
import { openCaseWindow } from "./caseOpen";
import { onMyUnusual, unusualNow, wearUnusual } from "../unusual";
import { unusualOf } from "../shared/cases";
import { drawPet, onMyPetLook, petLookNow, petPreview, petSheet } from "../pets";
import { pickUpPet, releasePet } from "../petActions";
import { LOUDSPEAKER_ON } from "../shared/loudspeaker";
import { openHideoutChest } from "./hideoutChest";
import { openPoker } from "./pokerTable";
import type { TableChat } from "./tableChat";
import { setRoomChat } from "./roomChat";
import { fillTextWithEmoji, measureWithEmoji } from "./iosEmoji";
import type { PokerApi } from "./pokerTable";
import { mountPokerFx } from "./pokerFx";
import { openBlackjack } from "./blackjackTable";
import type { BlackjackApi } from "./blackjackTable";
import { bjLeave, watchBjSeat } from "../blackjack";
import { pokerLeave, watchPokerSeat } from "../poker";
import { pokerKindOf } from "../shared/poker";
import { parsePetLook } from "../shared/petItems";
import { hideoutBoxStore, hideoutBoxTake, watchHideoutList } from "../hideout";
import { HIDEOUT_AD_MAX_MS, HIDEOUT_AD_MIN_MS } from "../shared/hideout";
import type { HideoutListing } from "../shared/hideout";
import { openLoudspeaker } from "./loudspeaker";
import { awayMessage, visitNow, watchBagmand } from "../bagmand";
import { HORSE_HAT } from "../shared/bagmand";
import { hideoutRole, lovePercent } from "../shared/hideout";
import { deadlyStab as deadlyStabCall } from "../db";
import { openSixtyShop, SixtyShopApi } from "./sixtyShop";
import { logAction } from "../logger";
import { BLOOD_ICON, findSlot, furniIcon, growMsOf, itemDef, ITEMS, SMOKABLE, SMOKE_MS, smokeMsOf } from "../items";
import { isLaced, unlaced } from "../shared/items";
import { DICE_GAP_MS } from "../shared/dice";
import { NEW_ACCOUNT_CHAT_MS } from "../shared/mod";
import { showDeathScreen } from "./deathScreen";
import { albumStep, CdAudio, CdState, cdEnded, cdPositionMs, clearCdPlayer, controlCd, insertCd, isScState, reconcileCd, speakerOp, watchCdPlayer } from "../cdplayer";
import { voteSong } from "../soundcloud";
import { loadWalkman, openWalkmanMenu } from "../walkman";
import { openIpod } from "./ipod";
import { onStreetsFlag } from "../streetsFlag";
import { trServer } from "../daRuntime";
import { albumList, isCdItem } from "../shared/cds";
import { fmtTime } from "../music";
import { EMOTE_BY_ID, EmoteDef, hasEmote, SPIN_DIRS } from "../emotes";
import {
  canEnter,
  isWantedRoomLive,
  defFromMeta,
  FURNI_KINDS,
  INTERACTIVE_KINDS,
  ROULETTE_KINDS,
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
  isBagKind,
  isCdKind,
  isBodyBag,
  isPublicRoom,
  isHideoutId,
  COMPUTER_ID,
  hideoutRoomId,
  SHOP_ID,
  MINES_ID,
  minesDef,
  shopDef,
  tutDef,
  tutRoomId,
  watchLobbyFurni,
  watchStageFurni,
  resetStage,
  stageDef,
  STAGE_ID,
  watchStreetsFurni,
  watchMeta,
} from "../rooms";
import { AnimState, derive, isAnimated, loadNitro, NitroFurni, nitroIfReady, spritesFor } from "../nitro";
import { onFurniShopChanged, picksToday, priceOf } from "../furniShop";
import { FurniBuyApi, openFurniBuy } from "./furniBuy";
import { openVending, VendingApi } from "./vendingShop";
import { openRecordShop, RecordShopApi } from "./recordShop";
import { openPosterShop, PosterShopApi } from "./posterShop";
import { openStashBox, StashApi } from "./stashbox";
import { openConfirmBox } from "./confirmBox";
import { openJukebox, JukeboxApi } from "./jukebox";
import { IdeasBoardApi, openIdeasBoard } from "./ideasBoard";
import { DuckyShopApi, openDuckyShop } from "./duckyShop";
import { openRaffleShop, RaffleShopApi } from "./raffleShop";
import { announceWin, watchRaffle } from "../raffle";
import { RAFFLE_EFFECTS } from "../shared/raffle";
import type { RaffleView } from "../raffle";
import { CraftBenchApi, openCraftBench } from "./craftBench";
import { MINE_KNIFE_MS, MINE_PICK_MS, MINES_SIXTY } from "../shared/mines";
import { CHAT_COLORS, CHAT_EFFECTS, isChatEffect, isHexColor } from "../shared/ducky";
import type { ChatEffect } from "../shared/ducky";
import { figureAnimated } from "../designs";
import { lighterStage, markLighterStep } from "../lighterHint";
import { flappyRemoveScore, flappyRunStart, flappySubmit, watchFlappyBoard } from "../db";
import { pickPosterPicture } from "./posterEditor";
import { POSTER_KIND, POSTER_PRICE, POSTER_W, POSTER_H } from "../shared/furniture";
import { MixerApi, openMixer } from "./mixer";
import { LandlordApi, openLandlord } from "./landlord";
import { consumeItem } from "../db";
import { FurnishApi, mountFurnishUi } from "./furnish";
import { autoplantOn } from "../settings";
import { pocketFromRoom, canTurn, defaultDir, isFixedPiece, nextDir, turnedWallSpot, wallSpot, movePiece, placeFromCatalog, placeFromInventory, placeFromStorage, placedCount, Spot, storeFromInventory, storeFromRoom, takeFromStorage, whyNot } from "../furnishing";
import { Box, drawNitroSprites, drawFurniBase, drawRoomDoor, ensureDoorArt, drawNitroFurni, ensureFurniSprites, ensureTextures, iso, Pt, renderRoomShell, shade, TILE_H, TILE_W } from "../roomRender";
import { fetchProfile, setPresenceRoom, social } from "../social";
import { openArcade } from "../arcade/arcade";
import { h, toast } from "./dom";
import { closeMenu, showMenu } from "./contextMenu";
import { mountSidePanel } from "./sidepanel";
import { mountRoomPanel } from "./roomPanel";
import { DoorApi, openDoor } from "./door";
import { mountRoulette, RouletteApi } from "./rouletteTable";
import { dimmed } from "./rouletteFx";
import { assetUrl } from "../assetUrl";
import { drawFx } from "./fxSprites";
import { canonFx } from "../shared/unusualFx";
import { VAPE_COOLDOWN_MS } from "../shared/ducky";
import { bagmandHitTick, bountyShow, wantedUntil } from "../bounty";
import { playBang, playSfx, playThud } from "../sfx";
import { gunShoot as gunShootCall, rocketFire as rocketFireCall, watchHits, watchRocketAt } from "../hits";
import { ROCKET_COOLDOWN_MS, ROCKET_LINE } from "../shared/hits";
import { BADTRIP_LINES, BADTRIP_MS, BADTRIP_RUN_MS, BADTRIP_SLEEP_MS } from "../shared/items";
import { bountiesOf, liveHits } from "../shared/hits";
import type { Hit } from "../shared/hits";
import { openWantedBoard } from "./wantedBoard";
import { openDiscordBoard } from "./discordBoard";
import { drawGun, drawMuzzleFlash, GUN_K } from "./rouletteFx";
import { setAmbience, setShopMusic } from "../ambience";
import type { Ctx } from "../main";

/** The hanger that floats above the bag of clothes in your own room (it's Habbo's own wardrobe icon). */
/** the pistol and the rocket launcher in the hand (and the pictures in the pocket) */
const gunImg = new Image();
gunImg.src = assetUrl("items/gun.png");
const rocketImg = new Image();
rocketImg.src = assetUrl("items/rocket.png");
const hangerImg = new Image();
hangerImg.src = assetUrl("ui/hanger.png");
/** the little pixel "dkk" that floats over the pay2win machine while you point at it (you pay with real money there) */
const dkImg = new Image();
dkImg.src = assetUrl("ui/dk.png");
/** the golden ticket that floats over the raffle machine while you point at it */
const ticketImg = new Image();
ticketImg.src = assetUrl("ui/ticket.png");
/** the game controller that floats over the arcade machine and the roulette table when you point at them (Habbo's silver controller icon) */
const controllerImg = new Image();
controllerImg.src = assetUrl("ui/controller.png");
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

/** the picture that floats over a poker table, a blackjack table or the shared stash: that piece's own inventory picture (made once it is drawn) */
const pieceHints = new Map<string, HTMLImageElement>();
function pieceHint(kind: string): HTMLImageElement {
  let img = pieceHints.get(kind);
  if (!img) { img = new Image(); pieceHints.set(kind, img); }
  const url = furniIcon(kind === "hchest" || kind === "silo" ? "stashbox" : kind);
  if (img.dataset.src !== url) { img.dataset.src = url; img.src = url; }
  return img;
}

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

/** The growing kit is a plain flowerpot (furni/f_flowerpot.nitro). What grows in it is the leaves of the old potted-plant art (mafia_c26_planter_white): the same sheet with everything that isn't green wiped out, drawn over the pot. */
let foliageArt: NitroFurni | null = null;
void loadNitro("furni/mafia_c26_planter_white.nitro").then((n) => {
  if (!n) return;
  foliageArt = derive(n, (g) => {
    for (const [key, f] of Object.entries(n.json.spritesheet.frames)) {
      const { x, y, w, h } = f.frame;
      if (/_64_sd_/.test(key)) { g.clearRect(x, y, w, h); continue; } // the old pot's shadow
      if (!/_64_a_/.test(key) || w < 30 || h < 30) continue;
      const img = g.getImageData(x, y, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const r = img.data[i], gg = img.data[i + 1], b2 = img.data[i + 2];
        if (!(gg > r + 8 && gg > b2 + 8)) img.data[i + 3] = 0; // not a leaf: the old pot, rim and soil
      }
      g.putImageData(img, x, y);
    }
  });
}).catch(() => undefined);
/** what grows in the kit when the seed was a poppy seed (bagmand's): a man-eating plant in its own pot */
let mnstrArt: NitroFurni | null = null;
void loadNitro("furni/mnstr.nitro").then((n) => { mnstrArt = n; }).catch(() => undefined);
/** what grows in the kit when the seed was shroom spores */
let shroomArt: NitroFurni | null = null;
void loadNitro("furni/shrooms.nitro").then((n) => { shroomArt = n; }).catch(() => undefined);
/** the poster art (a black poster with a thin outline; one picture for each wall). The picture is drawn over its face, inside the outline. */
let posterArt: NitroFurni | null = null;
void loadNitro("furni/poster.nitro").then((n) => { posterArt = n; }).catch(() => undefined);
/** the "?" every new poster shows until a picture is hung on it: black, with a "?" */
const posterBlank: HTMLCanvasElement = (() => {
  const c = document.createElement("canvas");
  c.width = POSTER_W; c.height = POSTER_H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000"; g.fillRect(0, 0, POSTER_W, POSTER_H);
  g.fillStyle = "#e6e6e6"; g.font = "bold 30px Verdana, 'Apple Color Emoji', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("?", POSTER_W / 2, POSTER_H / 2 + 2);
  return c;
})();
const posterPics = new Map<string, HTMLImageElement>();
const posterPicture = (img?: string): CanvasImageSource => {
  if (!img) return posterBlank;
  let im = posterPics.get(img);
  if (!im) { im = new Image(); im.src = img; posterPics.set(img, im); }
  return im.complete && im.naturalWidth ? im : posterBlank;
};
/** the blue water drop that flashes over the sink (the blood drop, but blue) */
const waterDropImg = loadImg(assetUrl("items/waterdrop.svg"));
/** a music note as a tiny white sprite (hard pixels, a dark edge so it shows on a light wall): drawn blown up, it looks pixelated */
const noteSprites = new Map<string, HTMLCanvasElement>();
function noteSprite(glyph: string): HTMLCanvasElement {
  let c = noteSprites.get(glyph);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = 13;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = '10px "Segoe UI Symbol", "Apple Symbols", sans-serif';
  x.lineWidth = 1.5;
  x.strokeStyle = "rgba(20,20,30,1)";
  x.strokeText(glyph, 6.5, 7);
  x.fillStyle = "#fff";
  x.fillText(glyph, 6.5, 7);
  const img = x.getImageData(0, 0, 13, 13);
  for (let i = 0; i < img.data.length; i += 4) { // (no soft edges: every pixel is either there or not)
    img.data[i + 3] = img.data[i + 3] > 90 ? 255 : 0;
    if (img.data[i + 3] && img.data[i] > 140 && img.data[i + 1] > 140) { img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; } // (the light ones are plain white)
    else if (img.data[i + 3]) { img.data[i] = 24; img.data[i + 1] = 24; img.data[i + 2] = 34; }
  }
  x.putImageData(img, 0, 0);
  noteSprites.set(glyph, c);
  return c;
}
const itemImgs = new Map<string, HTMLImageElement>();
const itemImg = (id: string): HTMLImageElement => {
  let im = itemImgs.get(id);
  if (!im) { im = loadImg(itemDef(id)?.icon ?? ""); itemImgs.set(id, im); }
  return im;
};

const STEP_MS = 480;
/** after a refresh on the street you stand where you stood (the browser keeps the tile while you are there: see streets.ts); null on a normal arrival */
function savedStreetSpot(): { x: number; y: number } | null {
  try {
    const st = Number(localStorage.getItem(STREET_RETURN_KEY)) || 0;
    if (!st || Date.now() - st > STREET_RETURN_MS) return null;
    const v = JSON.parse(localStorage.getItem(STREET_POS_KEY) ?? "null") as { x?: number; y?: number } | null;
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? { x: v.x!, y: v.y! } : null;
  } catch { return null; }
}
/** nobody runs faster than this on the street, whatever they took (no outrunning a fight) */
const STREET_MAX_SPEED = 1.25;
/** the tile of the red door on the basement's back wall (6ixty stands at x 5, the door two tiles to his left) */
const RED_DOOR_X = 3;
const BUBBLE_MS = 6500;
/** the dice: how long the die tumbles, and how long the number stays over the head */
const DICE_TUMBLE_MS = 900, DICE_SHOW_MS = 6500;
/** how long a mystery box strip rolls before it stops on the prize (see ui/caseOpen.ts): everybody else sees the result then */
const CASE_SPIN_MS = 5800;
const MAX_CHARS = 100;
const STAB_MS = 700;
const DROP_FLIGHT_MS = 750;

const DIRS: Array<[number, number, number]> = [
  // dx, dy, habbo direction (0 = up-right on screen, 2 = down-right, 4 = down-left, 6 = up-left)
  [0, -1, 0], [1, -1, 1], [1, 0, 2], [1, 1, 3], [0, 1, 4], [-1, 1, 5], [-1, 0, 6], [-1, -1, 7],
];

interface Bubble { text: string; until: number; /** the chat tool: how the text moves and its colour */ fx?: string; fc?: string }
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
  /** how many times faster they walk while fast lasts (2, or 4 with the super pill) */
  fastMult?: number;
  /** they hold the lean's cup in their hand until this time */
  cup?: number;
  /** flashing with smoke pouring off them until this time */
  chem?: number;
  /** a puff-bar cloud is over them until this time (server time, ms) */
  vape?: number;
  /** until when the name plate reads "chud" (server time, ms) */
  chud?: number;
  /** spinning round and round until then (LSD; server time, ms) */
  spin?: number;
  /** how they look until lookUntil (bagmand's weeds and drugs: see LOOK_KINDS in shared/bagmand.ts; the rules check it against what the server wrote) */
  look?: string;
  lookUntil?: number;
  /** the pet that walks with them, "<type>:<palette>" (the rules check it against what the server wrote) */
  pet?: string;
  /** the unusual they wear (the rules check it against what the server wrote) */
  un?: string;
  /** the admin playing 6ixty: clicking them talks to 6ixty instead of offering the knife */
  npc?: boolean;
  /** you walk at a fifth of your speed until then (performance.now(); fentanyl: only ever set on yourself) */
  slowUntil?: number;
  /** the colour of their name (bought at the Ducky machine; the server checks it, see the rules for players/<uid>/nc) */
  nc?: string;
  /** sitting on a chair or couch (shown to everyone through players/<uid>/sit) */
  sit?: boolean;
  /** a player of a roulette game who dropped out (a refresh, a log out): kept in their chair, a little darker, until they are back or their 12 seconds are up */
  ghost?: boolean;
  /** passed out on the floor (a pill from 6ixty; shown to everyone through players/<uid>/lay) */
  faint?: boolean;
  /** you clicked a seat: where to sit once you've walked there, and which way to face */
  sitTo?: { x: number; y: number; dir: number };
}

interface StabFx { from: string; to: string; start: number; impact: boolean; dropped: boolean; /** a swing in a street fight (the blood drop and the "it doesn't hurt" text are for the daily stab) */ fight?: boolean }
/** a shot from the gun: the shooter raises it at the target, the flash, the bullet and the hit */
interface ShotFx { from: string; to: string; start: number; fired: boolean; rocket?: boolean }
const SHOT_MS = 900;
interface SyringeFx { uid: string; start: number; burst: boolean }
interface DropFx { from: string; to: string; start: number }
interface Particle { x: number; y: number; vx: number; vy: number; born: number; life: number }
interface Floater { text: string; x: number; y: number; born: number; color: string; icon?: HTMLImageElement; life?: number; /** how much bigger than usual */ size?: number }
interface GlyphFx { uid: string; glyph: string; born: number; life: number; ox: number }
interface Hitbox { id: string; kind?: string; x0: number; y0: number; x1: number; y1: number; depth: number }
interface NoteFx { born: number; life: number; glyph: string; ox: number; phase: number; color: string }

type Pending =
  | { type: "stab"; uid: string; since: number; lastTry: number }
  | { type: "door"; since: number; lastTry: number; to?: ExtraDoor }
  | { type: "sixty"; since: number; lastTry: number; auto?: boolean }
  | { type: "landlord"; since: number; lastTry: number }
  | { type: "bagman"; since: number; lastTry: number }
  | { type: "hlandlord"; since: number; lastTry: number }
  | { type: "pmerchant"; since: number; lastTry: number }
  | { type: "minessixty"; since: number; lastTry: number }
  | { type: "pickup"; key: string; since: number; lastTry: number }
  | { type: "arcade" | "cd" | "bag" | "dumpster" | "use" | "bed" | "mine" | "craft"; fid: string; since: number; lastTry: number; slot?: number | null };

const cheb = (a: Pt, b: Pt) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function dirOf(from: Pt, to: Pt): number {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  return DIRS.find((d) => d[0] === dx && d[1] === dy)?.[2] ?? 2;
}

/** chat text made with the Ducky chat tool: letters that shake, wave or run through the rainbow, in a colour of the sender's choice */
function fxText(text: string, fx?: string, fc?: string): HTMLElement {
  const el = h("span", { class: "fxt" + (fx ? ` fx-${fx}` : ""), ...(fc ? { style: { color: fc } } : {}) });
  if (fx === "wave" || fx === "shake" || fx === "rainbow") {
    [...text].forEach((ch, i) => el.append(h("span", { class: "fxc", style: { animationDelay: `${(i * 90) % 1200}ms` } }, ch === " " ? "\u00a0" : ch)));
  } else el.textContent = text;
  return el;
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
const burgerImg = loadImg(ITEMS.burger.icon);

/** Where the lying avatar's 110x64 picture sits relative to the bed-head tile's floor point (tuned by eye against the bed art). */
const LAY_DX = -76;
const LAY_DY = -76;

/** Pixels from the feet line up to the top of the 64x110 avatar canvas (tuned against the bobba sprites). */
const FEET_Y = 94;

/** How far an avatar picture was grown to the left / top so nothing gets cut off (see avatar/AvatarImager.ts); drawers move it back by this much. */
const padOf = (c: HTMLCanvasElement | null | undefined): { x: number; y: number } => ({ x: (c as any)?.padL || 0, y: (c as any)?.padT || 0 });

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
/** who has already been put to bed since this page loaded: every login starts asleep in your own bed (until you tap the floor or go somewhere) */
let sleptUid = "";
export const forgetSleep = (): void => { sleptUid = ""; };

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
  /** a hideout (a shared room: its members use its pots, mixers, sink, box and computer, and build in it when they may) */
  const isHideoutRoom = isHideoutId(roomId);
  /** a place that is yours to use: your own room, or a hideout you are in */
  const isHome = isOwnRoom || isHideoutRoom;
  let hideoutGuest = false; // (a guest of a hideout: let in by its owner, may look around but is not a member)
  /** your own room, or (an account with the decorator power) any player's room: furniture and posters can be put down here */
  const adminLobbyEdit = me.isAdmin && (roomId === LOBBY_ID || roomId === STREETS_ID || roomId === STAGE_ID); // the admin furnishes the basement and the street from the same menu, with every piece there is
  const adminOwnEdit = me.isAdmin && isOwnRoom; // the admin has every piece there is in his own room too (and the landlord's window)
  let buildCmd = false; // /build (emil and the admin): the whole catalogue in any room they may build in
  const mayFurnish = isHome || (me.decorator && roomId.startsWith("u_")) || adminLobbyEdit;
  /** the private copy of the basement a new player does the introduction in; it looks and works like the basement, but nobody else comes in */
  const isTut = roomId === tutRoomId(me.uid);
  const isBasement = roomId === LOBBY_ID || isTut;
  // The admin account IS 6ixty: in every room they show up as him (his name and look), and in the basement they stand
  // at his spot, can't move, and talk as him.
  const asSixty = me.isAdmin;
  const asLandlord = me.isAdmin && roomId === SHOP_ID; // in the shop room the admin is the landlord: he stands behind the counter, can't move, and talks as him
  const frozen = (asSixty && roomId === LOBBY_ID) || asLandlord;
  const shownName = asLandlord ? LANDLORD.name : asSixty ? SIXTY.name : me.name;
  const shownFigure = (): string => (asLandlord ? LANDLORD.figure : asSixty ? sixtyLook().figure : me.figure);

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
  let recordApi: RecordShopApi | null = null;
  let posterApi: PosterShopApi | null = null;
  let stashApi: StashApi | null = null;
  let jukeboxApi: JukeboxApi | null = null;
  let ideasApi: IdeasBoardApi | null = null;
  let duckyApi: DuckyShopApi | null = null;
  let raffleApi: RaffleShopApi | null = null;
  /** the raffle in the shop room (what the machine and its prize show) */
  let raffleNow: RaffleView = { round: null, tickets: {}, sold: 0, last: null, waiting: [] };
  let craftApi: CraftBenchApi | null = null;
  function openCraft(): void { if (!craftApi) craftApi = openCraftBench(stage, ctx, () => panel.refresh(), () => { craftApi = null; }); }
  // ---- the mines: swinging at an ore rock (the knife, or a pickaxe: faster) until the iron comes out, over and over until you walk away ----
  let mining: { fid: string; start: number; ms: number; busy?: boolean } | null = null;
  const miningMs = (): number => (findSlot(me.inventory, "pickaxe") >= 0 ? MINE_PICK_MS : MINE_KNIFE_MS);
  function startMine(fid: string): void {
    closeToolWindows();
    clearSelection();
    if (findSlot(me.inventory, "pickaxe") < 0 && findSlot(me.inventory, "knife") < 0) { say("You need a knife (or a pickaxe) to mine.", "warn"); return; }
    pending = { type: "mine", fid, since: performance.now(), lastTry: 0 };
  }
  function startCraft(fid: string): void {
    closeToolWindows();
    clearSelection();
    pending = { type: "craft", fid, since: performance.now(), lastTry: 0 };
  }
  function startMinesSixty(): void {
    closeToolWindows();
    clearSelection();
    pending = { type: "minessixty", since: performance.now(), lastTry: 0 };
  }
  /** at the rock: face it and start swinging */
  function beginMining(f: PlacedFurni): void {
    const p = mine();
    if (!p) return;
    p.dir = dirOf(currentTile(p), { x: f.x, y: f.y });
    update(myRef, { dir: p.dir }).catch(() => undefined);
    mining = { fid: f.id, start: performance.now(), ms: miningMs() };
    say(findSlot(me.inventory, "pickaxe") >= 0 ? "You swing the pickaxe at the rock…" : "You scrape at the rock with your knife…");
  }
  async function mineNow(): Promise<void> {
    const m = mining;
    if (!m || m.busy) return;
    m.busy = true;
    try {
      const r = await call<{ iron?: number; wait?: number }>(me, "mine", { rock: m.fid });
      if (!r.iron) { m.start = performance.now() - m.ms + Math.max(300, r.wait ?? 1000); m.busy = false; return; } // (a hair early: a moment more)
      panel.refresh();
      giftPop("+1 Iron", itemImg("iron"));
      playSfx("select", 0.5);
      logAction(me, "room", "mined iron");
      if (mining === m) mining = { fid: m.fid, start: performance.now(), ms: miningMs() }; // (and again, until you walk off)
    } catch (err) {
      say((err as Error).message || "The rock won't give.", "warn");
      if (mining === m) mining = null;
    }
  }
  function tickMining(now: number): void {
    if (!mining) return;
    const p = mine();
    if (!p || p.lying || p.sit || faintUntil || woozy || trippingOn || isMoving(p, now) || pending) { mining = null; return; }
    if (!mining.busy && now - mining.start >= mining.ms) void mineNow();
  }
  /** the little bar over your head while you swing */
  function drawMiningBar(now: number): void {
    if (!mining) return;
    const p = mine();
    if (!p) return;
    const fp = feetOf(p, now);
    const k = Math.max(0, Math.min(1, (now - mining.start) / mining.ms));
    const w = 46 * scale, hh = 6 * Math.max(1, scale), x = fp.x - w / 2, y = fp.y - (FEET_Y + 14) * scale;
    g.save();
    g.fillStyle = "rgba(0,0,0,0.65)";
    g.beginPath(); g.roundRect(x - 2, y - 2, w + 4, hh + 4, 4); g.fill();
    g.fillStyle = "#e0903c";
    g.beginPath(); g.roundRect(x, y, w * k, hh, 3); g.fill();
    g.restore();
  }
  function openRaffle(): void { if (!raffleApi) raffleApi = openRaffleShop(stage, ctx, () => { panel.refresh(); ctx.refreshHeader(); }, () => { raffleApi = null; }); }
  function openDucky(): void { if (!duckyApi) duckyApi = openDuckyShop(stage, ctx, () => panel.refresh(), () => { duckyApi = null; }); }
  function openIdeas(): void { if (!ideasApi) ideasApi = openIdeasBoard(stage, ctx, () => { ideasApi = null; }); }
  let landlordApi: LandlordApi | null = null;
  let bagmandApi: BagmandShopApi | null = null;
  let computerApi: ComputerApi | null = null;
  let cdPressApi: { close(): void } | null = null;
  let beatShopApi: { close(): void } | null = null;
  let elevatorApi: { close(): void } | null = null;
  let walkmanApi: { close(): void } | null = null;
  let ipodApi: { close(): void } | null = null;
  /** the streets: the customers, the cars, the fights (null in every other room) */
  let streetsApi: StreetsApi | null = null;
  let fightWalking = false;
  let petShopApi: { close(): void } | null = null;
  let chestApi: { close(): void; refresh(): void } | null = null;
  /** the poker window (it stands you up when it closes); if the server still has you sitting at a table after a refresh, you are stood up here and get your blood back */
  let pokerApi: PokerApi | null = null;
  /** a player who loses their last blood at a poker table shoots themselves, in front of everybody in the room */
  const pokerFx = mountPokerFx({ me, roomId, scale: () => scale });
  /** every open hit (the biggest bounty per player shows over their head while you hold a gun) */
  let bounties = bountiesOf([] as Hit[]);
  let hitsOpen: Hit[] = [];
  const stopHits = watchHits((all) => { const l = liveHits(all, serverNow()); hitsOpen = l; bounties = bountiesOf(l); }); // (a bagmand hit that ran out is not shown)
  let wantedApi: { close(): void } | null = null;
  let noticeApi: { close(): void } | null = null;
  let shootBox: HTMLElement | null = null;
  let shootUid = "";
  let rocketAt = 0; // when you last fired the rocket launcher
  let bjApi: BlackjackApi | null = null;
  const stopBjSeat = watchBjSeat(me.uid, (at) => { if (at && !bjApi) void bjLeave(me).then(() => panel.refresh()).catch(() => undefined); });
  const stopPokerSeat = watchPokerSeat(me.uid, (at) => { if (at && !pokerApi) void pokerLeave(me).then(() => panel.refresh()).catch(() => undefined); });
  let caseApi: { close(): void } | null = null;
  /** the pets walking about: where each one is (tiles), which way it faces, and since when it has been standing still */
  const petStates = new Map<string, { look: string; x: number; y: number; dir: number; moving: boolean; t: number; still: number }>();
  let hideoutDoorApi: { close(): void } | null = null;
  let hlandlordApi: { close(): void } | null = null;
  let hlandlordBubble: Bubble | null = null;
  let hlandlordLast: HTMLCanvasElement | undefined;
  let pmBubble: Bubble | null = null;
  let pmLast: HTMLCanvasElement | undefined;
  let pmIcon: HTMLCanvasElement | undefined;
  /** the love booths: what look each was in last, and when it changed (a new look = a new test for the couple sitting on it) */
  const loveSeen = new Map<string, { st: number; at: number }>();
  let bagmanBubble: Bubble | null = null;
  let bagmanLast: HTMLCanvasElement | undefined;
  /** the visit that is on now (bagmand's hour in the basement), looked at once a second: working it out takes a moment */
  let bagVisit: number | null = null;
  let landlordBubble: Bubble | null = null;
  let landlordLast: HTMLCanvasElement | undefined;
  const isShop = roomId === SHOP_ID;
  const isMines = roomId === MINES_ID;
  const isArrival = roomId === ARRIVAL_ID;
  const isStreets = roomId === STREETS_ID;
  let mixerApi: MixerApi | null = null;
  // the furnishing menu (toolbox): your room without you in it, pieces to drag around, storage
  let furnishOn = false;
  let furnishUi: FurnishApi | null = null;
  let fzSel: string | null = null;
  /** what the last press on the room was made with ("touch" on a phone: building is then done with taps, never with dragging) */
  let lastPointer = "mouse";
  let fzPlacing: { kind: string; source: "inv" | "storage" | "catalog" | "box"; slot?: number; owner?: string } | null = null;
  let fzDir = 6;
  let fzDrag: { id: string; kind: string; grab: Pt; moved: boolean; spot: Spot } | null = null;
  let furniBoxes: Array<{ id: string; box: Box; depth: number }> = [];
  let doorApi: DoorApi | null = null;
  /** the roulette table in the basement (null in every other room) */
  let roulette: RouletteApi | null = null;
  /** what to do when the seat you walked to has been sat on */
  let sitAfter: (() => void) | undefined;

  // OSRS-style "use item on ..." state
  let selectedSlot: number | null = null;
  let pending: Pending | null = null;
  let stabbing = false;
  /** owner's edit tool: a furniture kind id, "pickup", or null */
  let tool: string | null = null;
  /** which way the piece being placed faces (0/2/4/6; press R) */
  let toolDir = 0;

  const stabFx: StabFx[] = [];
  const shotFx: ShotFx[] = [];
  const syringeFx: SyringeFx[] = [];
  const dropFx: DropFx[] = [];
  const particles: Particle[] = [];
  const floaters: Floater[] = [];
  const glyphs: GlyphFx[] = [];
  const zzzAt = new Map<string, number>();

  /** you can edit your own room; the admin can also edit the public room's extra furniture */
  /** what you may do in this hideout (the owner builds always; a member when the owner allows it and building is not locked) */
  const hideoutCan = () => hideoutRole({ owner: def.ownerUid ?? undefined, lock: def.hideout?.lock, members: def.hideout?.members }, me.uid, me.isAdmin);
  const isOwner = () => def.ownerUid === me.uid || ((def.id === LOBBY_ID || def.id === STREETS_ID || def.id === STAGE_ID) && me.isAdmin) || (isHideoutRoom && hideoutCan().canBuild);

  // ---- DOM ---------------------------------------------------------------------
  const canvas = h("canvas", { class: "room-canvas" });
  const log = h("div", { class: "chat-log" });
  const online = h("div", { class: "online", title: "Who's in this room", onclick: () => online.classList.toggle("open") });
  if (roomId === SHOP_ID) markLighterStep(me, "door"); // (the lighter job: you have been through the shop's door)
  const roomTitle = h("div", { class: "room-title" }, isBasement ? "Main Lobby" : "Loading room…");
  const actionHint = h("div", { class: "action-hint hidden" });
  const input = h("input", { class: "chat-input", type: "text", maxLength: MAX_CHARS, placeholder: "Say something, or try /dance. Tap the floor to walk.", autocomplete: "off" });
  const sendBtn = h("button", { class: "btn primary", type: "submit" }, "Send");
  // the chat tool (Ducky machine): a sparkle next to the chat bar opens how the next lines look (moving text, a colour)
  let chatFx: { fx?: ChatEffect; fc?: string } = {};
  const fxBtn = h("button", { class: "chat-fx", type: "button", title: "Chat tool", "aria-label": "Chat tool", hidden: !me.owned.ducky_fx }, "✨") as HTMLButtonElement;
  const fxPanel = h("div", { class: "fx-panel", hidden: true });
  const stage = h("div", { class: "stage" }, canvas, online, log, actionHint, roomTitle, fxPanel);
  let greenScreen = false; // /greenscreen (Emil and the admin): a flat chroma-green room for filming
  const sideHost = h("div", { class: "side-host" });
  root.append(h("div", { class: "room" },
    h("div", { class: "room-main" }, stage, sideHost),
    h("form", { class: "chat-bar", onsubmit: (e: Event) => { e.preventDefault(); send(); } }, fxBtn, input, sendBtn)));
  // the chat on the picture shows 3 lines, and more while you're typing (the keyboard is open)
  input.addEventListener("focus", () => log.classList.add("open"));
  input.addEventListener("blur", () => log.classList.remove("open"));
  // on a computer the mouse wheel over the chat scrolls back through it (the chat is drawn over the room, so it can't take clicks: it only wakes up for the wheel, and goes back to the last lines when the mouse leaves)
  stage.addEventListener("wheel", (e) => {
    if (log.childElementCount === 0 || (e as WheelEvent).ctrlKey) return;
    const r = log.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4;
    if (!inside && !log.classList.contains("scroll")) return;
    if (!log.classList.contains("scroll")) log.classList.add("scroll");
    const rr = log.getBoundingClientRect();
    if (e.clientX < rr.left || e.clientX > rr.right || e.clientY < rr.top || e.clientY > rr.bottom) { leaveChatScroll(); return; }
    e.preventDefault();
    log.scrollTop += (e as WheelEvent).deltaY;
  }, { passive: false });
  const leaveChatScroll = (): void => { log.classList.remove("scroll"); log.scrollTop = log.scrollHeight; };
  log.addEventListener("mouseleave", leaveChatScroll);
  stage.addEventListener("mousemove", (e) => {
    if (!log.classList.contains("scroll")) return;
    const r = log.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) leaveChatScroll();
  });
  const g = canvas.getContext("2d")!;

  // Every chat line disappears 15 minutes after it was said; the swept-out messages are also deleted from the database.
  const CHAT_LIFE_MS = 15 * 60_000;
  const lines: Array<{ el: HTMLElement; exp: number; msg?: ReturnType<typeof ref> }> = [];
  /** the poker and blackjack windows cover the chat bar, so they get their own box that talks through this one (the same rules: the spam limit, the mute, the commands) */
  const tableLineListeners = new Set<(line: HTMLElement) => void>();
  const tableChat: TableChat = {
    send: (text) => { if (Date.now() < spamUntil) return false; input.value = text; send(); return true; },
    recent: () => Array.from(log.children).map((c) => c.cloneNode(true) as HTMLElement),
    subscribe: (cb) => { tableLineListeners.add(cb); return () => { tableLineListeners.delete(cb); }; },
  };
  const releaseRoomChat = setRoomChat(tableChat); // (the trade window talks through the room you are in)
  function addLine(el: HTMLElement, lifeMs: number, msg?: ReturnType<typeof ref>): void {
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.append(el);
    tableLineListeners.forEach((l) => l(el.cloneNode(true) as HTMLElement));
    lines.push({ el, exp: Date.now() + lifeMs, msg });
    while (log.children.length > 60) log.firstElementChild?.remove();
    if (atBottom || !log.classList.contains("scroll")) log.scrollTop = log.scrollHeight; // (somebody reading back is not pulled down by a new line)
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
    // with the mixer open a tap on a pocket item puts it in the mixer; while you trade with 6ixty the pocket does nothing (use his window)
    slotTap: (slot) => {
      if (mixerApi) return mixerApi.pick(slot);
      if (sixtyShop) { say("You're talking to 6ixty: use his window.", "warn"); return true; }
      return false;
    },
    onEmote: (id) => performEmote(id),
    onUseSelf: (what, slot) => { if (what === "open") { if (!caseApi) caseApi = openCaseWindow(stage, ctx, roomId, () => panel.refresh(), () => { caseApi = null; }); } else if (what === "wear") void wearUnusual(me, slot).then(() => { panel.refresh(); say("You put it on."); }, (err) => say((err as Error).message || "It won't go on.", "warn")); else if (what === "pet") void releasePet(me, slot).then(() => { panel.refresh(); say("It walks with you now."); }, (err) => say((err as Error).message || "It won't come out.", "warn")); else if (what === "speak") openLoudspeakerWindow(); else if (what === "syringe") void useSyringe(); else if (what === "pill") void usePill(); else if (what === "consume") void consumeSlot(slot); else if (what === "vape") void usePuff(slot); else if (what === "ipod") { if (ipodApi) ipodApi.close(); else ipodApi = openIpod(stage, ctx, () => { if (!beatShopApi) beatShopApi = openBeatShop(stage, ctx, me.uid, me.name, () => { beatShopApi = null; }); }, () => { ipodApi = null; }); } else if (what === "walkman") { if (walkmanApi) walkmanApi.close(); else walkmanApi = openWalkmanMenu(stage, me, () => { walkmanApi = null; }); } else if (what === "heal") { if (streetsApi) void streetsApi.heal(slot); else say("A bandage is for a fight on the streets.", "warn"); } else if (what === "eat") void eatBurger(); else void lightUp(slot); },
    onDropPick: (slot) => askDrop(slot),
    onCombine: (a, b) => {
      // a CD used on the walkman (either way round) goes into it
      const wk = me.inventory[a]?.item === "walkman" ? a : me.inventory[b]?.item === "walkman" ? b : -1;
      const cdSlot = wk === a ? b : a;
      if (wk >= 0 && isCdItem(me.inventory[cdSlot]?.item)) { void loadWalkman(me, cdSlot).then(() => { panel.refresh(); say("The CD is in your walkman."); }, (err) => say((err as Error).message || "That didn't work.", "warn")); return; }
      void combineSlots(me, a, b).then((r) => { panel.refresh(); say(isLaced(r.gave) ? `Du har lacede "${itemDef(unlaced(r.gave))?.name ?? r.gave}" med fentanyl. Monster.` : r.note); }, (err) => say((err as Error).message, "warn")); },
    roomTab: isPublicRoom(roomId) && !me.isAdmin ? undefined : {
      icon: assetUrl("osrs/tab_room.png"),
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

  /** The Turn button on the screen while you hold a piece of furniture from your pocket (outside the furnishing menu): the same as the R key. */
  const carryTurnBtn = h("button", { class: "btn small carry-turn hidden", title: "Turn", onclick: () => { const it = selectedDef(); if (it?.furniture) toolDir = nextDir(it.id, toolDir || defaultDir(it.id)); } }, "⟳ Turn");
  stage.append(carryTurnBtn);
  /** The dice in your hand (selected in the pocket): the Roll button, looking like the roulette table's trigger. The server throws them and writes the number where only it can write. */
  const rollBtn = h("button", { class: "btn rt-pull", type: "button", onclick: () => void rollTheDice() }, "Roll the dice") as HTMLButtonElement;
  const diceBar = h("div", { class: "rt-bar dice-bar hidden" }, h("div", { class: "rt-bar-t" }, "🎲 Dice in your hand"), rollBtn);
  stage.append(diceBar);
  let rollLock = false;
  async function rollTheDice(): Promise<void> {
    if (rollLock || disposed) return;
    rollLock = true;
    rollBtn.disabled = true;
    try { await call(me, "rollDice", { room: roomId }); } catch (err) { say((err as Error).message || "The dice slipped.", "warn"); }
    window.setTimeout(() => { rollLock = false; rollBtn.disabled = false; }, DICE_GAP_MS);
  }
  /** Only for accounts with the decorator power, in somebody else's room: opens the furnishing menu there. */
  const decorateBtn = h("button", { class: "btn small decorate-btn hidden", onclick: () => enterFurnish() }, adminLobbyEdit ? "🛠 Edit room" : "🛠 Decorate");
  stage.append(decorateBtn);
  /** the admin on the event stage: puts the stage back the way it starts (everything he moved is undone) */
  const resetStageBtn = h("button", { class: "btn small decorate-btn reset-stage-btn hidden", onclick: () => { if (window.confirm("Put the stage back the way it started? Everything you moved or added is lost.")) void resetStage(STAGE_DEFAULT).then(() => toast("The stage is back as it was."), (err) => toast((err as Error).message, "err")); } }, "↺ Reset stage");
  stage.append(resetStageBtn);
  /** The admin in his own room: the landlord's window (colours, bigger room, skins, stash box) without going to the shop. */
  const landlordBtn = h("button", { class: "btn small decorate-btn landlord-btn hidden", onclick: () => { if (!landlordApi) landlordApi = openLandlord(stage, ctx, () => panel.refresh(), () => { landlordApi = null; }); } }, "🏠 Landlord");
  stage.append(landlordBtn);
  setTimeout(() => syncCarryTurn(), 0); // (show the buttons from the start, not only after the first hover)
  function syncCarryTurn(): void {
    const it = selectedDef();
    carryTurnBtn.classList.toggle("hidden", !(it?.furniture && !furnishOn && mayFurnish && FURNI_KINDS[it.id]?.rotatable));
    diceBar.classList.toggle("hidden", !(it?.rolls && !furnishOn));
    landlordBtn.classList.toggle("hidden", !(adminOwnEdit && !furnishOn));
    resetStageBtn.classList.toggle("hidden", !(roomId === STAGE_ID && me.isAdmin && !furnishOn));
    decorateBtn.classList.toggle("hidden", !(((me.decorator && !isOwnRoom && roomId.startsWith("u_")) || adminLobbyEdit) && !furnishOn));
  }
  /** the name of whoever owns a BeatShop that stands in somebody else's room (looked up the first time you point at it) */
  const beatOwnerNames = new Map<string, string>();
  function updateHint(): void {
    syncCarryTurn();
    const item = selectedDef();
    let text = "";
    if (tool && isOwner()) text = tool === "pickup" ? "Pick up furniture: click it" : `Place ${FURNI_KINDS[tool]?.label ?? tool}: click a tile${FURNI_KINDS[tool]?.rotatable ? " (R turns it)" : ""}`;
    else if (furnishOn && fzSel && lastPointer !== "mouse") text = "In your hand: tap a free spot to put it down (tap it again to let go)";
    else if (item?.useOnObject) text = hoverObj && (hoverObj.kind === item.useOnObject || (item.useOnObject === "cdplayer" && isCdKind(hoverObj.kind))) ? `Use ${item.name} → ${FURNI_KINDS[hoverObj.kind!].label}` : `Use ${item.name} →`;
    else if (item?.rolls) text = "Dice in your hand: press Roll";
    else if (item) text = hoverPlayer && hoverPlayer.uid !== me.uid ? `Use ${item.name} → ${hoverPlayer.name}` : `Use ${item.name} →`;
    else if (hoverPlayer) text = hoverPlayer.name;
    else if (hoverObj && hoverObj.kind === "npc") text = SIXTY.name;
    else if (hoverObj && hoverObj.kind === "reddoor") text = "Red door";
    else if (hoverObj && hoverObj.kind === "stageexit") text = "Door: back to the basement";
    else if (hoverObj && hoverObj.kind === "pmerchant") text = "pets bih: buy a pet";
    else if (hoverObj && hoverObj.kind === "mypet") text = "Your pet: tap to pick it up";
    else if (hoverObj && hoverObj.kind === "hlandlord") text = "Landlord: hideouts";
    else if (hoverObj && hoverObj.kind === "hcomputer") text = "Computer: order furniture, members, settings";
    else if (hoverObj && hoverObj.kind === "hdoor") text = "Door: your hideouts";
    else if (hoverObj && FURNI_KINDS[hoverObj.kind!]?.opens === "cdpress") text = "CD printer: press a song onto a CD";
    else if (hoverObj && FURNI_KINDS[hoverObj.kind!]?.opens === "elevator") text = isArrival ? "Elevator: back to the basement" : "Elevator: runs from 20 to 21";
    else if (hoverObj && FURNI_KINDS[hoverObj.kind!]?.opens === "streetbin") text = "Trash can: search it";
    else if (hoverObj && hoverObj.kind === "scustomer" && streetsApi) text = streetsApi.hoverText(hoverObj.id) ?? "";
    else if (hoverObj && FURNI_KINDS[hoverObj.kind!]?.opens === "beatshop") { const bf = def.furni.find((q) => q.id === hoverObj!.id); const bo = bf?.by ?? def.ownerUid; const bn = (bo && bo === def.ownerUid ? def.ownerName : bo ? beatOwnerNames.get(bo) : "") ?? ""; if (bo && !bn && !beatOwnerNames.has(bo)) { beatOwnerNames.set(bo, ""); void fetchProfile(bo).then((pp) => { if (pp?.name) { beatOwnerNames.set(bo, pp.name); updateHint(); } }, () => undefined); } text = bn ? `${bn}'s BeatShop: listen to beats and buy them` : "BeatShop: listen to beats and buy them"; }
    else if (hoverObj && (FURNI_KINDS[hoverObj.kind!]?.opens === "poker" || FURNI_KINDS[hoverObj.kind!]?.opens === "blackjack")) text = `${FURNI_KINDS[hoverObj.kind!].label}: tap to play`;
    else if (hoverObj && hoverObj.kind === "wantedboard") text = "Wanted board";
    else if (hoverObj && hoverObj.kind === "discordboard") text = "Notice board";
    else if (hoverObj && hoverObj.kind === "hchest") text = "Shared stash";
    else if (hoverObj && hoverObj.kind === "bagman") text = "bagmand: poppy seeds, blue weed. He buys opium and what is mixed from it";
    else if (hoverObj && hoverObj.kind === "bed") text = mine()?.lying ? "Your bed: get up" : "Your bed: lie down";
    else if (hoverObj && (hoverObj.kind === "boombox" || hoverObj.kind === "f_boombox")) text = "Boombox: use a CD on it";
    else if (hoverObj && hoverObj.kind === "landlord") text = "Landlord: bigger rooms, room colours";
    else if (hoverObj && hoverObj.kind === "drop") { const dd = drops.get(hoverObj.id.slice(5)); text = dd ? `${itemDef(dd.item)?.name ?? dd.item}${dd.qty > 1 ? ` x${dd.qty}` : ""}${dd.ass ? " (ass)" : ""} · ${dd.by === "world" ? "lying on the floor" : `dropped by ${dd.byName}`} (click to pick up)` : "On the floor"; }
    else if (hoverObj && isDisplayPiece(hoverObj.id)) text = `${FURNI_KINDS[hoverObj.kind!].label} · ${priceOf(hoverObj.kind!)} drops (click to buy)`;
    else if (hoverObj && ROULETTE_KINDS.has(hoverObj.kind ?? "")) text = roulette ? roulette.hoverText() : FURNI_KINDS[hoverObj.kind!].label;
    else if (hoverObj && hoverObj.kind === "wardrobe") text = "Wardrobe: the clothing shop";
    else if (hoverObj && hoverObj.kind === "vending") text = "Vending machine";
    else if (hoverObj && (hoverObj.kind === "recordplayer" || hoverObj.kind === "vinyltable")) text = "Record player: CDs";
    else if (hoverObj && hoverObj.kind === "shopposter") text = "Poster: buy one for your wall";
    else if (hoverObj && hoverObj.kind === "stashbox") text = "Stash box: keep your things here";
    else if (hoverObj && hoverObj.kind === "silo") text = "Remote bank: your stash box";
    else if (hoverObj && hoverObj.kind === "jukebox") text = "Jukebox: play a CD for 50 blood";
    else if (hoverObj && hoverObj.kind === "ideaboard") text = "Ideas board: post pictures and ideas";
    else if (hoverObj && hoverObj.kind === "ducky") text = "pay2win: things for real money";
    else if (hoverObj && (hoverObj.kind === "gacha" || hoverObj.kind === "raffletable")) text = "Raffle: win the rare piece";
    else if (hoverObj && hoverObj.kind === "mrock") text = "Iron rock: mine it with your knife";
    else if (hoverObj && hoverObj.kind === "mbench") text = "Crafting bench: make a pickaxe or a machete";
    else if (hoverObj && hoverObj.kind === "minesixty") text = "6ixty: buy wood, sell iron";
    else if (hoverObj && hoverObj.kind === "sink") text = "Sink: fill your watering can";
    else if (hoverObj && hoverObj.kind === "f_mixer") text = "Mixer: mix two things";
    else if (hoverObj && (FURNI_KINDS[hoverObj.kind ?? ""]?.states?.length ?? 0) > 1) text = `${FURNI_KINDS[hoverObj.kind!].label}: tap to use`;
    else if (hoverObj && isBodyBag(hoverObj.kind)) text = "Body bag: use a syringe on it";
    else if (hoverObj && FURNI_KINDS[hoverObj.kind ?? ""]?.plant) { const pf = def.furni.find((x) => x.id === hoverObj!.id); text = pf?.plant ? `Growing kit · ${Math.round(plantProgress(pf.plant) * 100)}% · water ${Math.round(plantWater(pf.plant) * 100)}%` : "Growing kit (empty): plant a seed"; }
    else if (hoverObj && hoverObj.kind) text = FURNI_KINDS[hoverObj.kind].label;
    else if (hoverExtra >= 0 && def.extraDoors?.[hoverExtra]) text = `Door: ${def.extraDoors[hoverExtra].label}`;
    else if (hoverDoor) text = isOwnRoom ? "Door: to the basement" : isTut ? "Door: locked" : isStreets ? "Door: back inside" : isArrival ? "Door: to the streets" : def.doorTo ? "Door: back to the basement" : "Door: rooms";
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
    if (isBasement) { blocked.add(`${SIXTY.x},${SIXTY.y}`); blocked.add(`${RED_DOOR_X},0`); } // 6ixty stands in the basement, and the red door behind him
    if (roomId === LOBBY_ID) blocked.add(`${HIDEOUT_LANDLORD.x},${HIDEOUT_LANDLORD.y}`); // the hideout landlord, beside the hideout door
    if (roomId === LOBBY_ID) blocked.add(`${BAGMAN.x},${BAGMAN.y}`); // and bagmand next to the roulette table, in his hours (the tile stays blocked when he is away)
    if (isMines) blocked.add(`${MINES_SIXTY.x},${MINES_SIXTY.y}`); // and in the mines
    if (isShop) blocked.add(`${PET_MERCHANT.x},${PET_MERCHANT.y}`); // pets bih
    if (isShop) for (let x = LANDLORD.x; x < def.w; x++) blocked.add(`${x},0`); // the landlord and the space behind his counter
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
    pokerFx.setTables(def.furni.filter((f) => pokerKindOf(f.kind)).map((f) => f.id));
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
    stage.classList.toggle("horror", def.theme.style === "grime" || (def.theme.style === "street" && !STREETS_DAY));
    stage.classList.toggle("street", def.theme.style === "street");
    defListeners.forEach((l) => l());
  }

  // ---- camera --------------------------------------------------------------------
  let scale = 1;
  let offX = 0;
  let offY = 0;
  /** on a phone (and in a very long room, like the streets) the picture is zoomed in on you and follows you around (the whole room doesn't fit big enough to see anything) */
  let followMe = false;
  /** the camera jumps to you at once (after a layout), instead of sliding */
  let snapCam = true;
  const PHONE_ZOOM = 1.45;
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
    followMe = w < 560 || def.w >= 36;
    if (w < 560 && def.w < 36) scale = Math.max(0.5, Math.min(Math.floor(fit * PHONE_ZOOM * 4) / 4, 2.5)); // a little closer
    else if (def.w >= 36) scale = w < 560 ? 0.9 : Math.min(1.5, Math.max(1, Math.floor((w / 800) * 4) / 4)); // (a street fifty tiles long is looked at a stretch at a time)
    snapCam = true;
    offX = Math.round((w - floor.width * scale) / 2 + floorOrigin.x * scale);
    offY = Math.round((hh - floor.height * scale) / 2 + floorOrigin.y * scale + 24);
  }
  const resizeObs = new ResizeObserver(layout);
  resizeObs.observe(stage);

  const toScreen = (p: Pt): Pt => ({ x: offX + p.x * scale, y: offY + p.y * scale });
  /** how high (px) the floor is on a tile: the pieces of the stage floor are raised */
  function raiseAt(x: number, y: number): number {
    if (roomId !== STAGE_ID) return 0;
    let r = 0;
    for (const f of def.furni) {
      const k = FURNI_KINDS[f.kind];
      if (!k.flat || !k.surface) continue;
      const q = footprint(f.kind, f.dir);
      if (x >= f.x && x < f.x + q.w && y >= f.y && y < f.y + q.h) r = Math.max(r, k.surface);
    }
    return r;
  }
  function tileAt(mx: number, my: number): Pt | null {
    const flat = tileAtFlat(mx, my);
    if (roomId === STAGE_ID) { const up = tileAtFlat(mx, my + 32 * scale); if (up && raiseAt(up.x, up.y) >= 32) return up; } // (pointing at the top of the raised stage floor)
    return flat;
  }
  function tileAtFlat(mx: number, my: number): Pt | null {
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
  /**
   * The thing you meant when you point at (or tap) something: the piece that stands on the tile under the pointer, first of all (two pots or mixers
   * side by side have sprites that overlap, but the tile you click is the one you get). Only if no piece stands on that tile, whatever picture is under the pointer.
   */
  function pickObj(mx: number, my: number): Hitbox | null {
    // something hanging on a wall (the ideas board) wins where it is drawn: the floor tile "under" it belongs to a bin or a chair
    for (const b of objBoxes) {
      const k = FURNI_KINDS[def.furni.find((q) => q.id === b.id)?.kind ?? ""];
      if (k?.wall && mx >= b.x0 && mx <= b.x1 && my >= b.y0 && my <= b.y1) return b;
    }
    const t = tileAt(mx, my);
    if (t) {
      let best: Hitbox | null = null;
      for (const b of objBoxes) {
        const f = def.furni.find((q) => q.id === b.id);
        const k = f ? FURNI_KINDS[f.kind] : undefined;
        if (!f || !k || k.wall || k.flat) continue; // (wall pieces hang above their tile; flat things are walked over)
        const fp = footprint(f.kind, f.dir);
        if (t.x >= f.x && t.x < f.x + fp.w && t.y >= f.y && t.y < f.y + fp.h && (!best || b.depth > best.depth)) best = b;
      }
      if (best) return best;
    }
    return pick(objBoxes, mx, my);
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
    const ho = hp ? null : pickObj(m.x, m.y);
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

    const obj = pickObj(m.x, m.y);

    // nothing selected: a tap does what the menu would offer (one option -> it happens, several -> you choose)
    if (!selectedDef()) {
      if (isStreets && target && target.uid === me.uid) return; // (on the street a tap on yourself does nothing: no profile / walk menu in the middle of a fight)
      // on the street a tap on another player is a fight (the menu is still there on a right click)
      if (isStreets && streetsApi && target && target.uid !== me.uid && !target.npc && !target.sleeper && target.uid !== LEGEND.id) { streetsApi.fight(target.uid); return; }
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
      if (ed) { clearSelection(); if (isTut) { say("The door is locked. Finish what Sixty wants first.", "warn"); return; } pending = { type: "door", since: performance.now(), lastTry: 0, to: ed.door }; return; }
    }

    if (target?.npc && target.uid !== me.uid) { clearSelection(); if (isShop) startLandlord(); else startSixty(); return; }
    const item = selectedDef();
    // tapping another player (with nothing selected) opens their menu: add friend, invite to trade, walk here...
    if (target && target.uid !== me.uid && !target.sleeper && !item) { openContextAt(m.x, m.y, e.clientX, e.clientY); return; }
    if (item?.furniture) {
      if (!mayFurnish) { clearSelection(); say("You can only put furniture down in your own room.", "warn"); return; }
      if (t && selectedSlot !== null) void putDown(t, { kind: item.id, source: "inv", slot: selectedSlot }, toolDir || defaultDir(item.id));
      return;
    }
    if (item?.useOnPlayer === "shoot" || item?.useOnPlayer === "rocket") {
      if (target && target.uid !== me.uid && !target.npc && isStreets && streetsApi) { if (selectedSlot !== null) { const gunSlot = selectedSlot; clearSelection(); void streetsApi.shoot(target.uid, gunSlot); } } // (on the street a shot is a fight: no bounty box; the gun goes back in the pocket so the next click is a knife attack)
      else if (target && target.uid !== me.uid && !target.npc) openShootBox(target.uid);
      else if (target) say("You can't shoot that.", "warn");
      else { clearSelection(); closeShootBox(); if (t) { pending = null; walkTo(t); } }
      return;
    }
    if (item?.useOnPlayer === "stab" && obj && !target && obj.kind === "mrock") { startMine(obj.id); return; } // the knife on a rock: mine it
    if (item?.useOnPlayer === "stab") {
      if (target && target.uid !== me.uid) { if (isStreets && streetsApi) streetsApi.fight(target.uid); else startStab(target.uid); }
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
      if (obj && !target && (obj.kind === item.useOnObject || (item.useOnObject === "cdplayer" && isCdKind(obj.kind)))) { if (isCdKind(obj.kind)) startCd(obj.id); else startUse(obj.id, selectedSlot); }
      else {
        clearSelection();
        if (obj && !target) say("Nothing interesting happens.", "warn");
        else if (t && walkable(t.x, t.y)) { pending = null; walkTo(t); }
      }
      return;
    }

    if (obj && !target) {
      if (isCdKind(obj.kind)) openCdPopup();
      else if (isBagKind(obj.kind) || obj.kind === "wardrobe" || obj.kind === "toolbox" || obj.kind === "vending" || obj.kind === "recordplayer" || obj.kind === "vinyltable" || obj.kind === "shopposter" || obj.kind === "f_mixer" || obj.kind === "stashbox" || obj.kind === "silo" || obj.kind === "ideaboard" || obj.kind === "ducky" || obj.kind === "gacha" || obj.kind === "raffletable" || obj.kind === "hcomputer" || obj.kind === "hchest" || obj.kind === "hdoor" || FURNI_KINDS[obj.kind!]?.opens === "poker" || FURNI_KINDS[obj.kind!]?.opens === "blackjack" || FURNI_KINDS[obj.kind!]?.opens === "cdpress" || FURNI_KINDS[obj.kind!]?.opens === "beatshop" || FURNI_KINDS[obj.kind!]?.opens === "elevator" || FURNI_KINDS[obj.kind!]?.opens === "jukebox" || FURNI_KINDS[obj.kind!]?.opens === "streetbin" || obj.kind === "wantedboard" || obj.kind === "discordboard") startBag(obj.id);
      else if (obj.kind === "hlandlord") startHideoutLandlord();
      else if (obj.kind === "pmerchant") startPetMerchant();
      else if (obj.kind === "mypet") pickUpMyPet();
      else if (obj.kind === "sink" || isBodyBag(obj.kind) || FURNI_KINDS[obj.kind!]?.plant) startUse(obj.id, null);
      else if (obj.kind === "npc") startSixty();
      else if (obj.kind === "reddoor") redDoorTap();
      else if (obj.kind === "stageexit") ctx.navigate("room", { roomId: LOBBY_ID, from: STAGE_ID });
      else if (obj.kind === "bagman") startBagman();
      else if (obj.kind === "minesixty") startMinesSixty();
      else if (obj.kind === "mrock") startMine(obj.id);
      else if (obj.kind === "mbench") startCraft(obj.id);
      else if (obj.kind === "landlord") startLandlord();
      else if (obj.kind === "bed") bedAction();
      else if (obj.kind === "dumpster") startDumpster(obj.id);
      else if (roulette && ROULETTE_KINDS.has(obj.kind!)) roulette.click(obj.id);
      else if (obj.kind === "scustomer" && streetsApi) streetsApi.click(obj.id);
      else if (FURNI_KINDS[obj.kind!]?.seat) sitAt(obj.id, t);
      else startArcade(obj.id);
      return;
    }
    if (t && walkable(t.x, t.y)) { pending = null; walkTo(t); }
  });

  /** What you can do with whatever is at canvas position (mx, my). `forTap` leaves out the owner's "Pick up" (that belongs to the furnishing menu). */
  function contextOptions(mx: number, my: number, forTap = false): Array<{ label: string; target?: string; danger?: boolean; action: () => void }> {
    const target = playerAt(mx, my);
    if (isStreets && target && target.uid === me.uid) return []; // (no menu when you click yourself on the street)
    const tile = tileAt(mx, my);
    const item = selectedDef();
    const hasKnife = findSlot(me.inventory, "knife") >= 0;
    const opts: Array<{ label: string; target?: string; danger?: boolean; action: () => void }> = [];
    if (target?.npc && target.uid !== me.uid) {
      opts.push({ label: "Talk", target: isShop ? LANDLORD.name : SIXTY.name, action: () => (isShop ? startLandlord() : startSixty()) });
    } else if (target && target.uid !== me.uid) {
      if (isStreets && streetsApi && hasKnife && !target.npc && !target.sleeper) opts.push({ label: "Fight", target: target.name, danger: true, action: () => streetsApi?.fight(target.uid) });
      // (stabbing isn't in this menu: pick the knife and tap the player)
      if (target.uid !== LEGEND.id && social.isOnline(target.uid) && !target.sleeper) opts.push({ label: "Invite to trade", target: target.name, action: () => void social.inviteToTrade(target.uid).then(() => say(`You ask ${target.name} to trade. They have to accept.`), () => say("Couldn't send that trade invite.", "warn")) });
      // their name opens their profile: friend, message, visit, gift... (no profile for the introduction's stand-in)
      if (target.uid !== LEGEND.id) opts.push({ label: target.name, action: () => window.dispatchEvent(new CustomEvent("open-profile", { detail: target.uid })) });
    } else if (target && target.uid === me.uid) {
      opts.push({ label: "My profile", action: () => window.dispatchEvent(new CustomEvent("open-profile", { detail: me.uid })) });
    }
    const obj = pickObj(mx, my);
    if (obj?.kind === "arcade") opts.push({ label: "Play", target: "Arcade machine", action: () => startArcade(obj.id) });
    if (obj?.kind === "flappy") opts.push({ label: "Play", target: "Flappy Bird", action: () => startArcade(obj.id) });
    if (obj && roulette && ROULETTE_KINDS.has(obj.kind!)) opts.push({ label: "Play", target: "Russian roulette", action: () => roulette!.click(obj.id) });
    if (obj?.kind === "npc") {
      opts.push({ label: "Talk", target: SIXTY.name, action: () => startSixty() });
      if (me.isAdmin) opts.push({ label: "Change look", target: SIXTY.name, action: () => ctx.navigate("npc") });
    }
    if (obj?.kind === "landlord") opts.push({ label: "Talk", target: LANDLORD.name, action: () => startLandlord() });
    if (obj?.kind === "bagman") opts.push({ label: "Trade", target: BAGMAN.name, action: () => startBagman() });
    if (obj?.kind === "bed") opts.push({ label: mine()?.lying ? "Get up" : "Lie down", target: "Bed", action: () => bedAction() });
    if (obj?.kind === "dumpster") opts.push({ label: "Search", target: "Dumpster", action: () => startDumpster(obj.id) });
    if (obj?.kind === "drop") { const dd = drops.get(obj.id.slice(5)); opts.push({ label: "Pick up", target: dd ? (itemDef(dd.item)?.name ?? dd.item) : "item", action: () => startPickup(obj.id.slice(5)) }); }
    if (obj && isDisplayPiece(obj.id)) opts.push({ label: "Buy", target: FURNI_KINDS[obj.kind!].label, action: () => openBuy(obj.kind!) });
    if (obj?.kind === "wardrobe") opts.push({ label: "Open the shop", target: "Wardrobe", action: () => startBag(obj.id) });
    if (obj && FURNI_KINDS[obj.kind!]?.seat && !isDisplayPiece(obj.id) && !ROULETTE_KINDS.has(obj.kind!)) opts.push({ label: "Sit", target: FURNI_KINDS[obj.kind!].label, action: () => sitAt(obj.id, tile) });
    if (obj?.kind === "vending") opts.push({ label: "Shop", target: "Vending machine", action: () => startBag(obj.id) });
    if (obj?.kind === "recordplayer" || obj?.kind === "vinyltable") opts.push({ label: "CDs", target: "Record player", action: () => startBag(obj.id) });
    if (obj?.kind === "shopposter") opts.push({ label: "Buy", target: "Poster", action: () => startBag(obj.id) });
    if (obj && isBodyBag(obj.kind) && !isDisplayPiece(obj.id)) opts.push({ label: "Draw blood", target: "Body bag", action: () => startUse(obj.id, null) });
    if (obj?.kind === "sink" || (obj && FURNI_KINDS[obj.kind!]?.plant)) opts.push({ label: obj.kind === "sink" ? "Use" : "Tend", target: FURNI_KINDS[obj.kind!].label, action: () => startUse(obj.id, null) });
    if (obj?.kind === "f_mixer") opts.push({ label: "Mix", target: "Mixer", action: () => startBag(obj.id) });
    if (obj?.kind === "stashbox") opts.push({ label: "Open", target: "Stash box", action: () => startBag(obj.id) });
    if (obj?.kind === "silo") opts.push({ label: "Open", target: "Remote bank", action: () => startBag(obj.id) });
    if (obj?.kind === "jukebox") opts.push({ label: "Play a CD", target: "Jukebox", action: () => startBag(obj.id) });
    if (obj?.kind === "ideaboard") opts.push({ label: "Open", target: "Ideas board", action: () => startBag(obj.id) });
    if (obj?.kind === "wantedboard") opts.push({ label: "Open", target: "Wanted board", action: () => startBag(obj.id) });
    if (obj?.kind === "discordboard") opts.push({ label: "Open", target: "Notice board", action: () => startBag(obj.id) });
    if (obj?.kind === "ducky") opts.push({ label: "Shop", target: "pay2win", action: () => startBag(obj.id) });
    if (obj?.kind === "gacha" || obj?.kind === "raffletable") opts.push({ label: "Raffle", target: "Royal gacha", action: () => startBag(obj.id) });
    if (obj?.kind === "mrock") opts.push({ label: "Mine", target: "Iron rock", action: () => startMine(obj.id) });
    if (obj?.kind === "mbench") opts.push({ label: "Craft", target: "Crafting bench", action: () => startCraft(obj.id) });
    if (obj?.kind === "minesixty") opts.push({ label: "Talk", target: SIXTY.name, action: () => startMinesSixty() });
    if (obj && (FURNI_KINDS[obj.kind ?? ""]?.states?.length ?? 0) > 1 && !isDisplayPiece(obj.id)) opts.push({ label: "Use", target: FURNI_KINDS[obj.kind!].label, action: () => void useFurni(obj.id) });
    if (obj?.kind === "toolbox") opts.push({ label: "Furnish", target: "Toolbox", action: () => startBag(obj.id) });
    if (obj?.kind === "mypet") opts.push({ label: "Pick up", target: "Your pet", action: () => pickUpMyPet() });
    if (obj?.kind === "pmerchant") opts.push({ label: "Browse pets", target: PET_MERCHANT.name, action: () => startPetMerchant() });
    if (obj?.kind === "hcomputer") opts.push({ label: "Use", target: "Computer", action: () => startBag(obj.id) });
    if (obj && (FURNI_KINDS[obj.kind!]?.opens === "poker" || FURNI_KINDS[obj.kind!]?.opens === "blackjack")) opts.push({ label: "Play", target: FURNI_KINDS[obj.kind!].label, action: () => startBag(obj.id) });
    if (obj && FURNI_KINDS[obj.kind!]?.opens === "cdpress") opts.push({ label: "Press a CD", target: FURNI_KINDS[obj.kind!].label, action: () => startBag(obj.id) });
    if (obj && FURNI_KINDS[obj.kind!]?.opens === "elevator") opts.push({ label: "Use", target: "Elevator", action: () => startBag(obj.id) });
    if (obj && FURNI_KINDS[obj.kind!]?.opens === "streetbin") opts.push({ label: "Search", target: "Trash can", action: () => startBag(obj.id) });
    if (obj?.kind === "scustomer" && streetsApi && !target) opts.push({ label: "Serve", target: streetsApi.hoverText(obj.id)?.split(":")[0] ?? "Customer", action: () => streetsApi?.click(obj.id) });
    if (obj && FURNI_KINDS[obj.kind!]?.opens === "beatshop") opts.push({ label: "Open", target: FURNI_KINDS[obj.kind!].label, action: () => startBag(obj.id) });
    if (obj?.kind === "hchest") opts.push({ label: "Open", target: "Shared stash", action: () => startBag(obj.id) });
    if (obj?.kind === "stageexit") opts.push({ label: "Leave", target: "Exit door", action: () => ctx.navigate("room", { roomId: LOBBY_ID, from: STAGE_ID }) });
    if (obj?.kind === "reddoor") opts.push({ label: "Knock", target: "Red door", action: () => redDoorTap() });
    if (obj?.kind === "hdoor") opts.push({ label: "Open", target: "Hideouts", action: () => startBag(obj.id) });
    if (obj?.kind === "hlandlord") opts.push({ label: "Talk", target: HIDEOUT_LANDLORD.name, action: () => startHideoutLandlord() });
    if (isBagKind(obj?.kind)) opts.push({ label: "Change clothes", target: FURNI_KINDS[obj!.kind!].label, action: () => startBag(obj!.id) });
    if (isCdKind(obj?.kind)) {
      if (item?.useOnObject === "cdplayer") opts.push({ label: `Use ${item.name} →`, target: FURNI_KINDS[obj!.kind!].label, action: () => startCd(obj!.id) });
      opts.push({ label: "Volume", target: FURNI_KINDS[obj!.kind!].label, action: () => openCdPopup() });
    }
    const onDoor = !target && !obj && inBox({ x: mx, y: my }, doorBox);
    if (onDoor) opts.push({ label: "Open", target: "Door", action: () => { clearSelection(); startDoor(); } });
    const ed = !target && !obj && !onDoor ? extraDoorBoxes.find((e) => inBox({ x: mx, y: my }, e.box)) : undefined;
    if (ed) opts.push({ label: "Open", target: `${ed.door.label} door`, action: () => { clearSelection(); if (isTut) { say("The door is locked. Finish what Sixty wants first.", "warn"); return; } pending = { type: "door", since: performance.now(), lastTry: 0, to: ed.door }; } });
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
      if (def.id === LOBBY_ID || def.id === STREETS_ID || def.id === STAGE_ID) await removeFurni(def.id, f.id);
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
  const onPocket = () => { panel.refresh(); ctx.refreshHeader(); mixerApi?.refresh(); tutorialGuide(); };
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
    const adminLobby = (def.id === LOBBY_ID || def.id === STREETS_ID || def.id === STAGE_ID) && me.isAdmin;
    if (!k || (!k.placeable && !(adminLobby && (k.nitro || INTERACTIVE_KINDS.has(kind))))) return;
    if (!adminLobby && def.furni.length >= MAX_FURNI) return say(`That's the limit: ${MAX_FURNI} pieces per room.`, "warn");
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
  defListeners.add(() => furnishUi?.refresh()); // (the hideout box changes under you when somebody else uses it)

  function enterFurnish(force = false): void {
    if ((!mayFurnish && !force) || furnishOn) return;
    clearSelection();
    pending = null;
    furnishOn = true;
    fzSel = null; fzPlacing = null; fzDrag = null;
    syncCarryTurn();
    canvas.style.cursor = "grab";
    furnishUi = mountFurnishUi(stage, {
      profile: me,
      def: () => def,
      selected: fzPiece,
      placing: () => fzPlacing,
      done: exitFurnish,
      turn: fzTurn,
      ...(adminLobbyEdit || adminOwnEdit || buildCmd || (me.isAdmin && isHideoutRoom) ? { catalog: () => Object.keys(FURNI_KINDS).filter((k) => (FURNI_KINDS[k].nitro || INTERACTIVE_KINDS.has(k)) && !isFixedPiece(k) && !/^(bed|bag)_/.test(k) && k !== "stashbox" && k !== "boombox" && k !== "f_planter" && k !== "f_planter_auto").sort((a, b) => (roomId === STAGE_ID ? +STAGE_KINDS.has(b) - +STAGE_KINDS.has(a) : 0) || FURNI_KINDS[a].label.localeCompare(FURNI_KINDS[b].label)) } : {}), // (on the stage the stage pieces come first)
      store: () => { const f = fzPiece(); if (f) void (adminLobbyEdit ? (def.id === LOBBY_ID && /^lobby\d+$/.test(f.id) ? Promise.reject(new Error("That one is built into the basement: move it instead.")) : def.id === LOBBY_ID && isFixedLobbyPiece(f.id) ? Promise.reject(new Error("That one can't be removed.")) : removeFurni(def.id, f.id)) : storeFromRoom(me, def.id, f)).then(() => { fzSel = null; refreshFz(); }, (err) => say((err as Error).message, "warn")); },
      pocket: () => { const f = fzPiece(); if (f) void pocketFromRoom(me, def.id, f).then(() => { fzSel = null; refreshFz(); playSfx("select", 0.4); }, (err) => say((err as Error).message, "warn")); },
      select: (id) => { fzSel = id; fzPlacing = null; refreshFz(); },
      mine: () => def.furni.filter((f) => !isFixedPiece(f.id) && (!isHideoutRoom || f.by === me.uid)),
      startPlacing: (source, kind, slot, owner) => { fzPlacing = { kind, source, slot, owner }; fzDir = defaultDir(kind); fzSel = null; if (source === "inv" && slot !== undefined) { selectedSlot = slot; panel.setSelected(slot); } else if (selectedSlot !== null) clearSelection(); refreshFz(); },
      cancelPlacing: () => { fzPlacing = null; clearSelection(); refreshFz(); },
      storeFromInventory: (slot, qty) => void storeFromInventory(me, slot, qty, isHideoutRoom ? roomId : undefined).then(refreshFz, (err) => say((err as Error).message, "warn")),
      takeFromStorage: (kind, qty) => void takeFromStorage(me, kind, qty, isHideoutRoom ? roomId : undefined).then(refreshFz, (err) => say((err as Error).message, "warn")),
      ...(isHideoutRoom ? { hideout: {
        box: () => def.hideout?.box ?? {},
        names: () => ({ ...(def.ownerUid ? { [def.ownerUid]: def.ownerName ?? "owner" } : {}), ...Object.fromEntries(Object.entries(def.hideout?.members ?? {}).map(([u, m]) => [u, m.name])) }),
        note: () => (hideoutCan().canBuild ? null : def.hideout?.lock ? "Building is locked by the owner." : "The owner hasn't given you building rights."),
        cap: () => def.hideout?.cap ?? (adminLobbyEdit ? 999 : MAX_FURNI),
        boxStore: (kind, qty, slot) => void hideoutBoxStore(me, def.id, kind, qty, slot !== undefined ? { slot } : undefined).then(refreshFz, (err) => say((err as Error).message, "warn")),
        boxTake: (kind, qty) => void hideoutBoxTake(me, def.id, kind, qty).then(refreshFz, (err) => say((err as Error).message, "warn")),
      } } : {}),
    });
  }

  function exitFurnish(): void {
    if (!furnishOn) return;
    furnishOn = false;
    syncCarryTurn();
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

  /** moves or turns a piece: the basement's pieces are rewritten in its own list (the ones built into the basement can't move) */
  async function movePieceHere(f: PlacedFurni, spot: Spot): Promise<void> {
    if (!adminLobbyEdit) return movePiece(def.id, f, spot, me);
    const base = def.id === STREETS_ID ? "streets/furni" : def.id === STAGE_ID ? "stage/furni" : "lobby/furni";
    if (def.id === STREETS_ID ? isBuiltInStreetPiece(f.id) : /^lobby\d+$/.test(f.id)) { await set(ref(db, `${base}/${f.id}`), { kind: f.kind, x: spot.x, y: spot.y, ...(spot.dir ? { dir: spot.dir } : {}) }); return; } // a piece built into the room: its new spot is kept under its own id
    if (def.id === LOBBY_ID && isFixedLobbyPiece(f.id)) throw new Error("That one can't be moved.");
    await update(ref(db, `${base}/${f.id}`), { x: spot.x, y: spot.y, dir: spot.dir || null });
  }
  async function putDown(t: Pt, what: { kind: string; source: "inv" | "storage" | "catalog" | "box"; slot?: number; owner?: string }, dir: number): Promise<void> {
    const o = originFor(what.kind, dir, t);
    // a wall piece (a poster) snaps to the nearest wall instead of standing where you tapped
    const spot: Spot = FURNI_KINDS[what.kind].wall ? wallSpot(def, what.kind, t, dir) : { x: o.x, y: o.y, dir: FURNI_KINDS[what.kind].rotatable ? dir : 0 };
    const cap = def.hideout?.cap ?? (adminLobbyEdit ? 999 : MAX_FURNI);
    if (placedCount(def) >= cap) return say(`That's the limit: ${cap} pieces in this room.`, "warn");
    const why = whyNot(def, what.kind, spot, null, othersOccupy());
    if (why) return say(why, "warn");
    // a poster: first the menu where the picture is chosen and sized (cancelling leaves the poster in your hand)
    let img: string | undefined;
    if (what.kind === POSTER_KIND) {
      const pic = await pickPosterPicture(stage);
      if (!pic) return;
      img = pic;
    }
    try {
      if (what.source === "catalog") await (adminLobbyEdit ? placeFurni(def.id, what.kind, spot.x, spot.y, spot.dir) : placeFromCatalog(me, def.id, what.kind, spot));
      else if (what.source === "box") await call(me, "furniPlace", { room: def.id, source: "box", kind: what.kind, owner: what.owner, x: spot.x, y: spot.y, dir: spot.dir });
      else if (what.source === "inv") await placeFromInventory(me, def.id, what.slot!, spot, img);
      else await placeFromStorage(me, def.id, what.kind, spot, img);
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
    // turning swaps the footprint: slide it back inside the room if it now sticks out (a wall item goes round the corner to the other wall)
    const fp = footprint(f.kind, dir);
    const spot: Spot = FURNI_KINDS[f.kind].wall ? turnedWallSpot(def, f.kind, f) : { x: Math.min(f.x, def.w - fp.w), y: Math.min(f.y, def.h - fp.h), dir };
    const why = whyNot(def, f.kind, spot, f.id, othersOccupy());
    if (why) return say(why, "warn");
    void movePieceHere(f, spot).catch((err) => say((err as Error).message || "Couldn't turn that.", "warn"));
  }

  const pieceAtPointer = (m: Pt, t: Pt | null) => {
    let best: { id: string; depth: number } | null = null;
    for (const b of furniBoxes) if (m.x >= b.box.x0 && m.x <= b.box.x1 && m.y >= b.box.y0 && m.y <= b.box.y1 && (!best || b.depth > best.depth)) best = b;
    return best ? def.furni.find((f) => f.id === best!.id) ?? null : t ? furniAtTile(t) ?? null : null;
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (!furnishOn || (e.pointerType === "mouse" && e.button !== 0)) return;
    lastPointer = e.pointerType;
    const m = mousePos(e);
    const t = tileAt(m.x, m.y);
    hover = t;
    if (fzPlacing) { if (t) void putDown(t, fzPlacing, fzDir); return; }
    const tapMode = e.pointerType !== "mouse" || adminLobbyEdit; // on a phone nothing is dragged: tap a piece to pick it up in your hand, then tap the floor where it goes
    const f = pieceAtPointer(m, t);
    if (tapMode && fzSel) {
      const sel = fzPiece();
      if (sel) {
        if (f && f.id === sel.id) { fzSel = null; furnishUi?.refresh(); updateHint(); return; } // (tapping it again: let go of it where it stands)
        if (!t) return;
        const o = originFor(sel.kind, sel.dir ?? 0, t);
        const spot: Spot = FURNI_KINDS[sel.kind].wall ? wallSpot(def, sel.kind, t) : { x: o.x, y: o.y, dir: sel.dir ?? 0 };
        const why = whyNot(def, sel.kind, spot, sel.id, othersOccupy());
        if (why) { say(why, "warn"); return; }
        playSfx("select", 0.4);
        fzSel = null; furnishUi?.refresh(); updateHint();
        void movePieceHere(sel, spot).catch((err) => say((err as Error).message || "Couldn't move that.", "warn"));
        return;
      }
    }
    if (!f) { fzSel = null; furnishUi?.refresh(); updateHint(); return; }
    fzSel = f.id;
    updateHint();
    if (tapMode) { furnishUi?.refresh(); return; } // (picked up: no dragging, the next tap on the floor puts it down)
    fzDrag = { id: f.id, kind: f.kind, grab: t ? { x: t.x - f.x, y: t.y - f.y } : { x: 0, y: 0 }, moved: false, spot: { x: f.x, y: f.y, dir: f.dir ?? 0 } };
    canvas.setPointerCapture?.(e.pointerId);
    furnishUi?.refresh();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!furnishOn) return;
    const t = tileAt(mousePos(e).x, mousePos(e).y);
    hover = t;
    if (fzDrag && t) {
      const spot: Spot = FURNI_KINDS[fzDrag.kind].wall ? wallSpot(def, fzDrag.kind, t) : { x: t.x - fzDrag.grab.x, y: t.y - fzDrag.grab.y, dir: fzDrag.spot.dir };
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
    void movePieceHere(f, d.spot).catch((err) => say((err as Error).message || "Couldn't move that.", "warn"));
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
      if (FURNI_KINDS[kind].poster) drawPosterAt(kind, spot.x, spot.y, spot.dir, undefined, 0.6); // a poster: the "?" one, on the wall
      else if (FURNI_KINDS[kind].nitro) drawNitroFurni(g, kind, spot.x, spot.y, spot.dir, toScreen, scale, 0.6);
    };
    if (fzDrag?.moved) ghost(fzDrag.kind, fzDrag.spot, fzDrag.id);
    else if (fzPlacing && hover) {
      const o = originFor(fzPlacing.kind, fzDir, hover);
      ghost(fzPlacing.kind, FURNI_KINDS[fzPlacing.kind].wall ? wallSpot(def, fzPlacing.kind, hover, fzDir) : { x: o.x, y: o.y, dir: fzDir }, null);
    }
  }

  /** The ghost for a furniture item you've selected in your pocket (outside the furnishing menu). */
  function drawCarryGhost(): void {
    const item = selectedDef();
    if (furnishOn || !item?.furniture || !mayFurnish || !hover) return;
    const o = originFor(item.id, toolDir || defaultDir(item.id), hover);
    const spot: Spot = FURNI_KINDS[item.id].wall ? wallSpot(def, item.id, hover, toolDir || defaultDir(item.id)) : { x: o.x, y: o.y, dir: toolDir || defaultDir(item.id) };
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
    if (FURNI_KINDS[item.id].poster) drawPosterAt(item.id, spot.x, spot.y, spot.dir, undefined, 0.6);
    else if (FURNI_KINDS[item.id].nitro) drawNitroFurni(g, item.id, spot.x, spot.y, spot.dir, toScreen, scale, 0.6);
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
      fastMult: typeof v.fastMult === "number" ? v.fastMult : undefined,
      cup: typeof v.cup === "number" ? v.cup : undefined,
      chem: typeof v.chem === "number" ? v.chem : undefined,
      vape: typeof v.vape === "number" ? v.vape : undefined,
      chud: typeof v.chud === "number" ? v.chud : undefined,
      spin: typeof v.spin === "number" ? v.spin : undefined,
      look: typeof v.look === "string" ? v.look : undefined,
      pet: typeof v.pet === "string" ? v.pet : undefined,
      un: typeof v.un === "string" ? v.un : undefined,
      lookUntil: typeof v.lookUntil === "number" ? v.lookUntil : undefined,
      nc: typeof v.nc === "string" && /^#[0-9a-fA-F]{6}$/.test(v.nc) ? v.nc : undefined,
      npc: v.sixty === true,
      sit: v.sit === true,
      faint: v.lay === true,
      lying: v.bed === true,
    };
  }

  /** how long one step takes: half as long while thc-a / research chemical is in you */
  const stepOf = (p: Player): number => (p.slowUntil && performance.now() < p.slowUntil ? STEP_MS * 5 : p.fast && serverNow() < p.fast ? STEP_MS / (isStreets ? Math.min(p.fastMult ?? 2, STREET_MAX_SPEED) : (p.fastMult ?? 2)) : STEP_MS);
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

  function walkTo(dest: Pt, force = false): void {
    if (!fightWalking) streetsApi?.stopFight(); // (walking somewhere yourself ends a fight you were chasing)
    const p = mine();
    if (badTripRun && !force) return; // (you run where the trip takes you)
    if (!p || frozen || faintUntil) return; // 6ixty doesn't walk, and nobody walks while out cold
    if (p.lying && !(introUntil && performance.now() < introUntil)) getUp(); // out of bed first
    if (p.sit && !seatTiles.has(`${dest.x},${dest.y}`)) { p.sit = false; update(ref(db, `rooms/${roomId}/players/${me.uid}`), { sit: null }).catch(() => undefined); } // you get up when you walk
    if (!seatTiles.has(`${dest.x},${dest.y}`)) { p.sitTo = undefined; sitAfter = undefined; }
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
  /** a loudpack gave you deadly stabs and they have not run out: the knife kills (and is not held back by the once-a-day rule) */
  const deadlyReady = (): boolean => me.deadlyLeft > 0 && serverNow() < me.deadlyUntil;
  function startStab(uid: string): void {
    const target = players.get(uid);
    if (!target || uid === me.uid) return;
    if (target.npc) return isShop ? startLandlord() : startSixty(); // you don't stab 6ixty, you talk to him
    if (findSlot(me.inventory, "knife") < 0 && findSlot(me.inventory, "machete") < 0) return say("You need a knife for that.", "warn");
    if (uid === LEGEND.id && me.tutorial >= 2) return say("He isn't getting up.", "warn");
    if (!deadlyReady() && !canStab(me, uid)) {
      const mins = Math.max(1, Math.ceil(msUntilNextStab(me, uid) / 60000));
      return say(`You've already stabbed ${target.name} lately. You can stab them again in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}.`, "warn");
    }
    pending = { type: "stab", uid, since: performance.now(), lastTry: 0 };
    clearSelection(); // like OSRS, the item stops being a "selected" cursor once you commit to a target
    if (cheb(currentTile(mine()!), currentTile(target)) > 1) say(`You walk towards ${target.name}…`);
  }

  /** Sit on a chair or couch: walk onto the tile you clicked (or the nearest tile of the piece), then take the seat. */
  function sitAt(fid: string, at: Pt | null, after?: () => void): boolean {
    const p = mine();
    const f = def.furni.find((x) => x.id === fid);
    if (!p || !f || frozen) return false;
    const k = FURNI_KINDS[f.kind];
    if (!k?.seat) return false;
    clearSelection();
    const fp = footprint(f.kind, f.dir);
    const tiles: Pt[] = [];
    for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) tiles.push({ x: f.x + i, y: f.y + j });
    const taken = new Set<string>();
    for (const o of players.values()) { if (o === p) continue; taken.add(`${currentTile(o).x},${currentTile(o).y}`); taken.add(`${o.dest.x},${o.dest.y}`); }
    const free = tiles.filter((t) => !taken.has(`${t.x},${t.y}`));
    if (!free.length) { say("Somebody is sitting there.", "warn"); return false; }
    const want = at ?? currentTile(p);
    free.sort((a, b) => Math.hypot(a.x - want.x, a.y - want.y) - Math.hypot(b.x - want.x, b.y - want.y));
    const seat = free[0];
    pending = null;
    if (p.sit && currentTile(p).x === seat.x && currentTile(p).y === seat.y) { after?.(); return true; }
    p.sitTo = { x: seat.x, y: seat.y, dir: (f.dir ?? 0) };
    sitAfter = after;
    if (currentTile(p).x === seat.x && currentTile(p).y === seat.y) return true; // already on it: finishSit runs next frame
    walkTo(seat);
    if (!p.path.length) { p.sitTo = undefined; sitAfter = undefined; say("You can't get to that seat.", "warn"); return false; }
    return true;
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
    const cb = sitAfter;
    sitAfter = undefined;
    cb?.();
  }

  /** Walk over to a piece you're using something on (or just tending); `slot` is the pocket item you had selected. */
  /** Tapping the next thing you want to use closes the window of the last one (the mixer, the shops...), so you never have to close it by hand first. */
  function closeToolWindows(): void {
    mixerApi?.close();
    vendingApi?.close();
    recordApi?.close();
    posterApi?.close();
    stashApi?.close();
    jukeboxApi?.close();
    ideasApi?.close();
    duckyApi?.close();
    raffleApi?.close();
    craftApi?.close();
    landlordApi?.close();
    bagmandApi?.close();
    computerApi?.close();
    cdPressApi?.close();
    beatShopApi?.close();
    elevatorApi?.close();
    walkmanApi?.close();
    ipodApi?.close();
    petShopApi?.close();
    caseApi?.close();
    hideoutDoorApi?.close();
    chestApi?.close();
    hlandlordApi?.close();
    sixtyShop?.close();
  }

  function startUse(fid: string, slot: number | null): void {
    closeToolWindows();
    pending = { type: "use", fid, since: performance.now(), lastTry: 0, slot };
    clearSelection();
  }

  const planterStatus = (pl: { at: number; water: number; neglect: boolean; crop?: string }): string => {
    const prog = plantProgress(pl);
    const left = Math.max(0, growMsOf(pl.crop) * (1 - prog));
    const mins = Math.max(1, Math.ceil(left / 60000));
    const water = pl.crop === "poppy" ? "" : plantWatered(pl) ? "watered" : plantThirsty(pl) ? "THIRSTY: water it now!" : `water bar ${Math.round(plantWater(pl) * 100)}%`;
    const left2 = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
    return prog >= 1 ? `It's ready to pick!${plantWatered(pl) ? "" : " It looks a bit sad."}` : `Growing: ${Math.round(prog * 100)}% (about ${left2} to go).${water ? ` ${water[0].toUpperCase()}${water.slice(1)}.` : ""}`;
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
        await fillCan(me, cs, roomId);
        try { localStorage.setItem(`6ixplanet.sinkHint.${me.uid}`, String(sinkFills() + 1)); } catch { /* private mode */ }
        panel.refresh();
        tutorialGuide();
        playSfx("select", 0.4);
        return say("You fill the watering can.");
      }
      if (f.kind === "f_mixer" && (held?.item === "mixerchip" || held?.item === "mixerchip2")) {
        if (!isHome) return say("That's not your mixer.", "warn");
        const mk2 = held.item === "mixerchip2";
        await attachUpgrade(me, roomId, f.id, slot!);
        panel.refresh(); playSfx("select", 0.4);
        return say(mk2 ? "The MK2 clicks in. This mixer mixes 25% faster now, and has turned dark grey." : "The chip clicks in. This mixer mixes 15% faster now, and has turned green.");
      }
      if (!k?.plant) return;
      if (!isHome) return say("That's not your plant.", "warn");
      if (held?.item === "waterer") {
        if (f.auto) return say("There's a waterer on that pot already.", "warn");
        await attachUpgrade(me, roomId, f.id, slot!);
        panel.refresh(); playSfx("select", 0.4);
        return say("The sprinkler clicks onto the pot. This plant never needs water again.");
      }
      if (!f.plant) {
        const isSeed = (n: string | undefined): boolean => n === "weedseed" || n === "shroomspore" || n === "poppyseed";
        let ss = isSeed(held?.item) ? slot : null; // (nothing is planted unless you hold a seed: tap the seed first, then the pot... or turn Autoplant on in the menu)
        if (ss === null && autoplantOn()) { const at = me.inventory.findIndex((x) => !!x && isSeed(x.item)); ss = at >= 0 ? at : null; if (ss === null) return say("Autoplant is on, but you have no seeds to plant.", "warn"); }
        if (ss === null) return say("An empty growing kit. Tap a weed seed, shroom spores or a poppy seed in your pocket first, then tap the kit to plant it. (Or turn Autoplant on in the menu.)", "warn");
        await plantSeed(me, def.id, f.id, ss);
        panel.refresh();
        return say(held?.item === "poppyseed" ? "You press the little black seed into the soil. A poppy takes 4 hours and needs no water." : me.inventory[ss]?.item === "shroomspore" ? "You press the spores into the soil. Shrooms take 25 minutes, and they need one watering: water them any time." : "You push a seed into the soil. It takes 10 minutes to grow, and it needs one watering: water it any time.");
      }
      const prog = plantProgress(f.plant);
      const canSlot = held?.item === "wateringcan_full" ? slot! : findSlot(me.inventory, "wateringcan_full");
      if (held?.item === "wateringcan_full" || (prog < 1 && canSlot >= 0 && !plantWatered(f.plant))) {
        if (canSlot < 0 || canSlot === null) return say("You need a full watering can.", "warn");
        if (f.plant.crop === "poppy") return say("A poppy doesn't need water.");
        if (plantWatered(f.plant)) return say("It's already been watered. It'll grow fine now.");
        await waterPlant(me, def.id, f.id, f.plant, canSlot);
        panel.refresh();
        playSfx("select", 0.4);
        return say("You water the plant.");
      }
      if (prog >= 1) {
        const r = await harvestPlant(me, def.id, f.id, f.plant);
        panel.refresh();
        playSfx("give", 0.6);
        if (r.seed) window.setTimeout(() => { if (!disposed && r.seed) giftPop(`+1 ${itemDef(r.seed)?.name ?? r.seed}`, itemImg(r.seed)); }, 700);
        if (r.crop === "poppy") {
          giftPop("+1 Opium", itemImg("opium"));
          logAction(me, "room", "picked opium");
          return say("You cut the pod and scrape off the milk. Opium. Bagmand will want this.");
        }
        if (r.crop === "shroom") {
          giftPop(`+${r.qty ?? 1} ${r.ass ? "Weak shroom" : "Shroom"}`, itemImg(r.ass ? "weakshroom" : "shroom"));
          logAction(me, "room", "picked shrooms");
          if (r.seed) say("Some spores fell out of the shrooms. You keep them.");
          return say(r.ass ? "You pick one weak shroom. It never got its water." : "You pick the shrooms. Fresh.");
        }
        if (r.seed) say("A seed fell out of the plant. You keep it.");
        giftPop(`+${r.qty ?? 1} ${r.ass ? "Ass weed" : "Weed"}`, itemImg("weed"));
        logAction(me, "room", `harvested ${r.ass ? "ass weed" : "weed"}`);
        return say(r.ass ? "You pick it. It's ass weed: it never got its water." : "You pick the buds. Nice.");
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
      const res = await searchDumpster(me, canId, roomId);
      const onFloor = res.dropped.length; // (a bandage with 5 already on you: it falls on the floor)
      const kept = [...res.items];
      for (const d of res.dropped) { const i = kept.indexOf(d); if (i >= 0) kept.splice(i, 1); }
      const fell = (): void => { for (const d of res.dropped) say(`You find a ${itemDef(d)?.name ?? d}, but you can't carry any more of them: it falls on the floor.`); };
      if (!kept.length) { panel.refresh(); playSfx("give", 0.6); fell(); logAction(me, "room", "searched a garbage can and found something it couldn't carry"); return; }
      const foundAll = kept;
      const found = foundAll[0];
      panel.refresh();
      playSfx("give", 0.6);
      const FOUND: Record<string, string> = { burger: "A burger, hardly bitten. Lucky you.", weedseed: "A few little seeds in the muck. They might grow.", lighter: "A lighter, and it still works!", kodimagnyl: "A blister of blue pills: kodimagnyl.", shroomspore: "A pinch of spores in the muck. They might grow." };
      giftPop(`+1 ${itemDef(found)?.name ?? found}`, itemImg(found));
      say(FOUND[found] ?? `You find a ${itemDef(found)?.name ?? found}.`);
      foundAll.slice(1).forEach((extra, i) => {
        window.setTimeout(() => { if (!disposed) giftPop(`+1 ${itemDef(extra)?.name ?? extra}`, itemImg(extra)); }, 600 * (i + 1));
        say(`The lean pays off: you find a ${itemDef(extra)?.name ?? extra} as well.`);
      });
      if (onFloor) fell();
      logAction(me, "room", `searched a garbage can and found a ${found}`);
    } catch (err) {
      say((err as Error).message || "You find nothing but rot.", "warn");
    } finally {
      searching = false;
    }
  }

  function startArcade(fid: string): void {
    pending = { type: "arcade", fid, since: performance.now(), lastTry: 0 };
  }

  /** Walk over to the bag of clothes; processPending opens the Character page once you're next to it. */
  /** a tap on your own pet: it goes back into the pocket */
  function pickUpMyPet(): void {
    void pickUpPet(me).then(() => { panel.refresh(); say("You picked your pet up."); }, (err) => say((err as Error).message || "It won't come.", "warn"));
  }

  /** a blue bin on the street: more than a basement bin gives, and it can be searched again sooner */
  async function searchStreetBin(fid: string): Promise<void> {
    try {
      const r = await call<{ items: string[]; dropped?: string[] }>(me, "streetBin", { can: fid });
      panel.refresh();
      const kept = [...r.items];
      for (const d of r.dropped ?? []) { const i = kept.indexOf(d); if (i >= 0) kept.splice(i, 1); }
      if (kept.length) say(`You search the bin and find ${kept.map((i) => itemDef(i)?.name ?? i).join(", ")}.`);
      for (const d of r.dropped ?? []) say(`You find a ${itemDef(d)?.name ?? d}, but you can't carry any more of them: it falls on the floor.`);
      playSfx("give", 0.4);
    } catch (err) { say((err as Error).message || "There's nothing in it.", "warn"); }
  }

  function startBag(fid: string): void {
    closeToolWindows();
    clearSelection();
    pending = { type: "bag", fid, since: performance.now(), lastTry: 0 };
  }

  function openVendingShop(): void {
    if (vendingApi) return;
    markLighterStep(me, "vending");
    vendingApi = openVending(stage, ctx, () => panel.refresh(), () => { vendingApi = null; });
  }

  function openBuy(kind: string): void {
    furniBuyApi?.close();
    furniBuyApi = openFurniBuy(stage, ctx, kind, () => panel.refresh(), () => { furniBuyApi = null; });
  }

  function startDoor(): void {
    if (doorApi) return;
    if (isTut) { say("The door is locked. Finish what Sixty wants first.", "warn"); return; } // no leaving the introduction
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
    if (me.isAdmin) return "arrived"; // the admin never walks: whatever he clicks opens right away
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
          if (streetsApi?.inFight()) return say("You are in a fight. You can't leave.", "warn");
          playSfx("doorOpen", 0.6);
          logAction(me, "visit", `went to the ${to.label.toLowerCase()}`);
          ctx.navigate("room", { roomId: to.to, from: roomId });
        } else if (isOwnRoom || def.doorTo) {
          // arrived at your own room's door (down to the basement) or the shop's door (back to the basement)
          if (streetsApi?.inFight()) return say("You are in a fight. You can't leave.", "warn");
          if (roomId === ARRIVAL_ID && def.doorTo === STREETS_ID) { // the door to the streets asks first: it is not safe out there
            openConfirmBox(stage, "WATCH OUT", ["Behind this door knives do damage, if you die you lose all the items you carry + 25 blood", "Are you sure bro?"], (yes) => {
              if (!yes || disposed) return;
              playSfx("doorOpen", 0.6);
              logAction(me, "visit", "went to the streets");
              ctx.navigate("room", { roomId: STREETS_ID, from: roomId });
            });
            return;
          }
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
    if (pending.type === "landlord") {
      // he stands behind the counter: walk up to the counter in front of him
      const goals: Pt[] = [{ x: LANDLORD.x, y: LANDLORD.y }];
      for (const f of def.furni) if (f.kind === "counter") { const fp = footprint(f.kind, f.dir); for (let i = 0; i < fp.w; i++) for (let j = 0; j < fp.h; j++) goals.push({ x: f.x + i, y: f.y + j }); }
      const r = approach(p, goals, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to him.", "warn"); }
      if (r === "arrived") {
        pending = null;
        const here = currentTile(p);
        p.dir = dirOf(here, { x: LANDLORD.x, y: LANDLORD.y });
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        landlordBubble = { text: LANDLORD.line, until: performance.now() + 4200 };
        if (!landlordApi) landlordApi = openLandlord(stage, ctx, () => panel.refresh(), () => { landlordApi = null; });
      }
      return;
    }
    if (pending.type === "hlandlord") {
      const goal = { x: HIDEOUT_LANDLORD.x, y: HIDEOUT_LANDLORD.y };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to him.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = dirOf(currentTile(p), goal);
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        hlandlordBubble = { text: HIDEOUT_LANDLORD.line, until: performance.now() + 4200 };
        if (!hlandlordApi) hlandlordApi = openHideoutLandlord(stage, ctx, () => panel.refresh(), () => { hlandlordApi = null; });
      }
      return;
    }
    if (pending.type === "pmerchant") {
      const goal = { x: PET_MERCHANT.x, y: PET_MERCHANT.y };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to him.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = dirOf(currentTile(p), goal);
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        pmBubble = { text: PET_MERCHANT.line, until: performance.now() + 4200 };
        if (!petShopApi) petShopApi = openPetShop(stage, ctx, () => panel.refresh(), () => { petShopApi = null; });
      }
      return;
    }
    if (pending.type === "bagman") {
      if (bagVisit === null) { pending = null; return say("Bagmand has left.", "warn"); }
      const goal = { x: BAGMAN.x, y: BAGMAN.y };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to him.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = dirOf(currentTile(p), goal);
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        bagmanBubble = { text: BAGMAN.line, until: performance.now() + 4200 };
        if (!bagmandApi) bagmandApi = openBagmandShop(stage, ctx, () => panel.refresh(), () => { bagmandApi = null; });
      }
      return;
    }
    if (pending.type === "minessixty") {
      const goal = { x: MINES_SIXTY.x, y: MINES_SIXTY.y };
      const r = approach(p, goal, now, pending);
      if (r === "unreachable") { pending = null; return say("You can't get to him.", "warn"); }
      if (r === "arrived") {
        pending = null;
        p.dir = dirOf(currentTile(p), goal);
        update(ref(db, `rooms/${roomId}/players/${me.uid}`), { dir: p.dir }).catch(() => undefined);
        if (!sixtyShop) sixtyShop = openSixtyShop(stage, ctx, () => panel.refresh(), () => { sixtyShop = null; }, { mines: true });
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
      if (job.type === "mine") beginMining(f);
      else if (job.type === "craft") openCraft();
      else if (job.type === "bed") layDown();
      else if (job.type === "cd") void executeInsert();
      else if (job.type === "bag") {
        const opens = FURNI_KINDS[f.kind].opens;
        if (opens === "furnish") enterFurnish();
        else if (opens === "vending") openVendingShop();
        else if (opens === "stash") { if (!stashApi) stashApi = openStashBox(stage, ctx, () => panel.refresh(), () => { stashApi = null; }); }
        else if (opens === "jukebox") openJukeboxWindow();
        else if (opens === "poster") { if (!posterApi) posterApi = openPosterShop(stage, ctx, () => panel.refresh(), () => { posterApi = null; }); }
        else if (opens === "ideas") openIdeas();
        else if (opens === "pets") { if (!petShopApi) petShopApi = openPetShop(stage, ctx, () => panel.refresh(), () => { petShopApi = null; }); }
        else if (opens === "computer") { if (!computerApi) computerApi = openHideoutComputer(stage, ctx, roomId, () => def, () => panel.refresh(), () => { computerApi = null; }); }
        else if (opens === "beatshop") { const bo = f.by ?? def.ownerUid; if (bo && !beatShopApi) beatShopApi = openBeatShop(stage, ctx, bo, bo === def.ownerUid ? def.ownerName ?? "" : "", () => { beatShopApi = null; }); }
        else if (opens === "elevator") { if (!elevatorApi) elevatorApi = openElevator(stage, ctx, isArrival || isStreets ? "arrival" : "lobby", (ride) => { if (ride === "up") ctx.navigate("room", { roomId: ARRIVAL_ID, from: LOBBY_ID }); else if (ride === "down") ctx.navigate("room", { roomId: LOBBY_ID, from: ARRIVAL_ID }); }, () => { elevatorApi = null; }); }
        else if (opens === "streetbin") void searchStreetBin(f.id);
        else if (opens === "cdpress") { if (!cdPressApi) cdPressApi = openCdPress(stage, ctx, roomId, () => def, () => panel.refresh(), () => { cdPressApi = null; }); }
        else if (opens === "chest") { if (!me.isAdmin && !hideoutCan().member) say("Only the members can use the stash.", "warn"); else if (!chestApi) chestApi = openHideoutChest(stage, ctx, roomId, () => panel.refresh(), () => { chestApi = null; }); }
        else if (opens === "poker") { const pk = pokerKindOf(f.kind); if (pk && !pokerApi) pokerApi = openPoker(stage, ctx, roomId, f.id, pk, () => panel.refresh(), () => { pokerApi = null; }, tableChat); }
        else if (opens === "blackjack") { if (!bjApi) bjApi = openBlackjack(stage, ctx, roomId, f.id, () => panel.refresh(), () => { bjApi = null; }, tableChat); }
        else if (opens === "hits") openWanted();
        else if (opens === "board") openNotice();
        else if (opens === "hideouts") { if (!hideoutDoorApi) hideoutDoorApi = openHideoutDoor(stage, ctx, () => { hideoutDoorApi = null; }); }
        else if (opens === "ducky") openDucky();
        else if (opens === "raffle") openRaffle();
        else if (opens === "records") { if (!recordApi) recordApi = openRecordShop(stage, ctx, () => panel.refresh(), () => { recordApi = null; }); }
        else if (opens === "mixer") {
          if (mixerApi) { /* already open */ }
          else if (f.mix && f.mix.doneAt <= serverNow()) { // a finished batch: one tap and it's in your pocket (no window)
            const item = f.mix.item ? itemDef(f.mix.item)?.name : undefined;
            void call<{ item?: string; qty?: number }>(me, "mixCollect", { fid: f.id, ...(isHideoutRoom ? { room: roomId } : {}) }).then((r) => {
              playSfx("give", 0.5);
              panel.refresh();
              say(`You collect ${r.qty ?? 1} ${itemDef(r.item ?? "")?.name ?? item ?? "of it"} from the mixer.`);
              if (r.item) giftPop(`+${r.qty ?? 1} ${itemDef(r.item)?.name ?? r.item}`, itemImg(r.item));
            }, (err) => say((err as Error).message || "It isn't done yet.", "warn"));
          } else mixerApi = openMixer(stage, ctx, f.id, def.id, () => panel.refresh(), () => { mixerApi = null; }, (item, qty) => giftPop(`+${qty} ${itemDef(item)?.name ?? item}`, itemImg(item)));
        }
        else ctx.navigate(opens === "shop" ? "shop" : "customize");
      }
      else if (job.type === "dumpster") void searchTheDumpster(job.fid);
      else if (job.type === "use") void interactWith(f, job.slot ?? null);
      else openArcade(f.kind === "flappy" ? "flappy" : undefined, {
        myUid: me.uid,
        ...(roomId === LOBBY_ID ? {
          startRun: () => { void flappyRunStart(me).catch(() => undefined); },
          submitScore: (score: number) => flappySubmit(me, score),
          watchBoard: (cb: (rows: Array<{ uid: string; name: string; score: number }>) => void) => watchFlappyBoard(cb, me.uid),
          ...(me.isAdmin ? { removeScore: (uid: string, shadow?: boolean) => flappyRemoveScore(me, uid, shadow) } : {}),
        } : {}),
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
  /** the room's music is actually sounding (a paused CD is not): then the basement's hum keeps quiet */
  const musicOn = () => cdPlaying() && !cdState!.pausedAt;

  const cdUi = {
    title: h("div", { class: "cd-title" }),
    status: h("div", { class: "hint" }),
    fill: h("div", { class: "cd-fill" }),
    time: h("span", { class: "hint" }),
    vol: h("span", { class: "cd-vol" }),
    mute: h("button", { class: "btn small", title: "Mute", onclick: () => cdAudio.toggleMute() }),
    pause: h("button", { class: "btn small", onclick: () => void cdControlOp(cdState?.pausedAt ? "play" : "pause") }, "Pause"),
    restart: h("button", { class: "btn small", onclick: () => void cdControlOp("restart") }, "Play from start"),
    eject: h("button", { class: "btn small danger", onclick: () => void ejectCd() }, "Eject"),
    loop: h("button", { class: "btn small", title: "Loop this song", onclick: () => void speakerRun("loop", { on: !cdState?.loop }) }, "Loop"),
    prev: h("button", { class: "btn small", title: "Back", onclick: () => void albumOp("prev") }, "⏮"),
    next: h("button", { class: "btn small", title: "Skip", onclick: () => void albumOp("next") }, "⏭"),
    // SoundCloud on the speaker: everybody in the room can vote on the song that is playing
    up: h("button", { class: "btn small", title: "Upvote this song", onclick: () => void scVoteNow(1) }, "▲ 0"),
  };
  let scVoteFor: string | null = null;
  let scVote = 0;
  let scUp = 0, scDown = 0;
  const scSongId = (): string | null => (cdState && isScState(cdState) ? cdState.song?.id ?? cdState.ids?.[cdState.index ?? 0] ?? null : null);
  function paintVotes(): void {
    cdUi.up.textContent = `▲ ${scUp}`;
    cdUi.up.classList.toggle("primary", scVote === 1);
  }
  /** the votes of the song on the speaker: its counts and what you voted (read again when the song changes) */
  function loadScVotes(id: string): void {
    scVoteFor = id; scVote = 0; scUp = 0; scDown = 0; paintVotes();
    void Promise.all([get(ref(db, `songs/${id}/up`)), get(ref(db, `songs/${id}/down`)), get(ref(db, `myVotes/${me.uid}/${id}`))]).then(([u, d, v]) => {
      if (scVoteFor !== id) return;
      scUp = Number(u.val()) || 0; scDown = Number(d.val()) || 0; scVote = Number(v.val()) || 0; paintVotes();
    }, () => undefined);
  }
  async function scVoteNow(v: 1): Promise<void> {
    const id = scSongId();
    if (!id) return;
    try {
      const r = await voteSong(me, id, scVote === v ? 0 : v); // (tapping your own vote again takes it back)
      if (scVoteFor === id) { scUp = r.up; scDown = r.down; scVote = r.v; paintVotes(); }
    } catch (err) { say((err as Error).message || "That didn't work.", "warn"); }
  }
  /** the full album: the song before, or the next one */
  async function albumOp(op: "prev" | "next"): Promise<void> {
    const s = cdState;
    if (s && isScState(s)) return speakerRun(op, { from: s.index ?? 0 });
    if (!s || s.track !== "album") return;
    try { await albumStep(me, roomId, op, s.index ?? 0, s.album); } catch (err) { say((err as Error).message || "That didn't work.", "warn"); }
  }
  /** the buttons in the player's window (for whoever put the CD in, and the owner of the room) */
  /** SoundCloud on the speaker: its buttons (members: pause, skip; the one who connected it and the owner: loop, disconnect) */
  async function speakerRun(op: "pause" | "play" | "next" | "prev" | "loop" | "disconnect", more: { from?: number; on?: boolean } = {}): Promise<void> {
    try { await speakerOp(me, roomId, op, more); } catch (err) { say((err as Error).message || "That didn't work.", "warn"); }
  }
  async function cdControlOp(op: "pause" | "play" | "restart"): Promise<void> {
    if (isScState(cdState)) { if (op !== "restart") await speakerRun(op); return; }
    try { await controlCd(me, roomId, op); } catch (err) { say((err as Error).message || "That didn't work.", "warn"); }
  }

  function refreshCdPopup(): void {
    if (!cdPopup) return;
    const s = cdState && !cdEnded(cdState) ? cdState : null;
    cdUi.title.textContent = s ? `♪ ${s.title}${s.track === "album" ? ` (${(s.index ?? 0) + 1}/${albumList(s.album).length})` : ""}` : "Nothing playing";
    cdUi.status.textContent = s ? (isScState(s) ? `SoundCloud, connected by ${s.byName}${s.loop ? " (this song on loop)" : ""}` : `Put in by ${s.byName}`) : "Use a CD from your inventory on the player.";
    const total = s ? (s.durationMs ?? s.endsAt - s.startedAt) : 0;
    const pos = s ? Math.min(total, cdPositionMs(s)) : 0;
    cdUi.fill.style.width = total ? `${Math.max(0, Math.min(100, (pos / total) * 100))}%` : "0%";
    cdUi.time.textContent = s ? `${fmtTime(pos / 1000)} / ${fmtTime(total / 1000)}` : "";
    cdUi.vol.textContent = cdAudio.muted ? "muted" : `${Math.round(cdAudio.volume * 100)}%`;
    cdUi.mute.textContent = cdAudio.muted || cdAudio.volume === 0 ? "🔇" : "🔊";
    const sc = isScState(s);
    // SoundCloud: every member may pause and skip; only who connected it (or the owner) may loop and disconnect
    const boss = sc && (s!.by === me.uid || def.ownerUid === me.uid || me.isAdmin);
    const mayControl = !!s && (sc ? hideoutCan().member : s.by === me.uid || isOwner());
    cdUi.eject.classList.toggle("hidden", !(sc ? boss : mayControl));
    cdUi.eject.textContent = sc ? "Disconnect" : "Eject";
    cdUi.pause.classList.toggle("hidden", !mayControl);
    const isAlbum = !!s && s.track === "album";
    cdUi.prev.classList.toggle("hidden", !(mayControl && (isAlbum || sc)));
    cdUi.next.classList.toggle("hidden", !(mayControl && (sc || (isAlbum && (s!.index ?? 0) < albumList(s!.album).length - 1))));
    cdUi.restart.classList.toggle("hidden", !mayControl || sc);
    cdUi.loop.classList.toggle("hidden", !boss);
    cdUi.loop.classList.toggle("primary", !!s?.loop);
    cdUi.pause.textContent = s?.pausedAt ? "Resume" : "Pause";
    cdUi.up.parentElement?.classList.toggle("hidden", !sc);
    const sid = sc ? scSongId() : null;
    if (sid && sid !== scVoteFor) loadScVotes(sid);
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
      h("div", { class: "hint" }, "Everyone in the room hears the same music. Only the volume is your own."),
      h("div", { class: "cd-row" }, cdUi.up),
      h("div", { class: "cd-row" }, cdUi.prev, cdUi.pause, cdUi.next, cdUi.restart, cdUi.loop, cdUi.eject));
    stage.append(el);
    cdPopup = { el, timer: window.setInterval(refreshCdPopup, 500) };
    refreshCdPopup();
  }

  /** the CD to put in the player: the selected one, else the first one that isn't in a player already */
  /** the CD you picked before walking over to the player (the selection is cleared on the way, so it is remembered here) */
  let chosenCdSlot: number | null = null;
  function findCdSlot(): number {
    const ok = (i: number | null): i is number => i !== null && !!me.inventory[i] && isCdItem(me.inventory[i]!.item) && !me.inventory[i]!.inPlayer;
    if (ok(selectedSlot)) return selectedSlot;
    if (ok(chosenCdSlot)) return chosenCdSlot;
    return me.inventory.findIndex((s) => !!s && isCdItem(s.item) && !s.inPlayer);
  }

  /** the basement's jukebox: pick one of your CDs and pay to have it played for the room (the room's CD player, one CD at a time) */
  function openJukeboxWindow(): void {
    if (jukeboxApi) return;
    jukeboxApi = openJukebox(stage, ctx, {
      nowPlaying: () => (cdPlaying() ? `${cdState!.title} · ${cdState!.byName}` : null),
      play: async (slot) => {
        if (cdPlaying()) throw new Error(`The jukebox is busy playing ${cdState!.byName}'s CD.`);
        await insertCd(me, slot, roomId, true);
        panel.refresh();
        logAction(me, "cd", "paid for a CD on the jukebox");
        say("You drop the blood in the slot. The jukebox starts up. ♪ Your CD pops back into your pocket when it has finished.");
        jukeboxApi?.close();
      },
      onClose: () => { jukeboxApi = null; },
      volume: { get: () => cdAudio.volume, set: (v) => cdAudio.setVolume(v), muted: () => cdAudio.muted, toggleMute: () => cdAudio.toggleMute() },
    });
  }

  function startCd(fid: string): void {
    if (findCdSlot() < 0) { clearSelection(); return say("Your CD is already in the player.", "warn"); }
    if (cdPlaying()) { clearSelection(); return say(`The CD player is busy playing ${cdState!.byName}'s CD.`, "warn"); }
    chosenCdSlot = findCdSlot(); // the CD you selected, not just the first one in your pocket
    pending = { type: "cd", fid, since: performance.now(), lastTry: 0 };
    clearSelection();
    say("You walk over to the CD player…");
  }

  async function executeInsert(): Promise<void> {
    if (cdInserting) return;
    cdInserting = true;
    try {
      const slot = findCdSlot();
      if (slot < 0) return;
      if (cdPlaying()) return say(`The CD player is busy playing ${cdState!.byName}'s CD.`, "warn");
      chosenCdSlot = null;
      await insertCd(me, slot, roomId);
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
    if (isScState(cdState)) { await speakerRun("disconnect"); say("You disconnect SoundCloud from the speaker."); return; }
    try {
      await controlCd(me, roomId, "eject");
      panel.refresh();
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
    jukeboxApi?.refresh();
    if (isBasement && active) setAmbience(!musicOn()); // (the hum gives way to the music at once)
    // my CD comes home when it finishes, is ejected, or if I was away while it finished
    void reconcileCd(me, roomId, state).then((returned) => {
      if (!returned) return;
      panel.refresh();
      say("Your CD pops out of the player and back into your inventory.");
    });
  }

  /** Anyone may clear a CD that has finished; this also keeps a stuck CD from blocking the player. */
  let albumAdvancing = false;
  let scAdvancing = false;
  let cdGuestGone: number | null = null;
  let cdEjecting = false;
  function tickCd(): void {
    // the full album: when a song has finished somebody's browser moves it on (the first one wins, the others see the new song and do nothing)
    const cs = cdState;
    if (cs && cs.track === "album" && !cs.pausedAt && (cs.index ?? 0) < albumList(cs.album).length - 1 && serverNow() >= cs.endsAt - 400 && !cdEnded(cs) && !albumAdvancing) {
      albumAdvancing = true;
      void albumStep(me, roomId, "advance", cs.index ?? 0, cs.album).catch(() => undefined).finally(() => setTimeout(() => { albumAdvancing = false; }, 2500));
    }
    // SoundCloud on the speaker: when a song has ended somebody's browser asks the server to move on (it catches up over every song that ended and skips the ones taken off)
    if (cs && isScState(cs) && isHideoutRoom && !cs.pausedAt && serverNow() >= cs.endsAt - 400 && !scAdvancing) {
      scAdvancing = true;
      void speakerOp(me, roomId, "advance").catch(() => undefined).finally(() => setTimeout(() => { scAdvancing = false; }, 2500));
    }
    // a guest put a CD in the owner's player and walked out: the music stops (the owner's browser ejects it, so the CD goes back to the guest)
    if (cs && !isScState(cs) && !cdEnded(cs) && isOwnRoom && cs.by !== me.uid && !players.has(cs.by) && social.roomOf(cs.by) !== roomId) {
      cdGuestGone ??= performance.now();
      if (performance.now() - cdGuestGone > 6000 && !cdEjecting) {
        cdEjecting = true;
        void controlCd(me, roomId, "eject").catch(() => undefined).finally(() => { cdGuestGone = null; setTimeout(() => { cdEjecting = false; }, 3000); });
      }
    } else cdGuestGone = null;
    if (cdState && cdEnded(cdState) && !cdClearing) {
      cdClearing = true;
      clearCdPlayer(roomId).catch(() => undefined).finally(() => setTimeout(() => { cdClearing = false; }, 3000));
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
      if (!deadlyReady() && !canStab(me, uid)) return say(`You've already stabbed ${target.name} lately.`, "warn");
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
        if (deadlyReady()) {
          try {
            const dr = await deadlyStabCall(me, uid, roomId);
            ctx.refreshHeader();
            panel.refresh();
            logAction(me, "stab", `deadly stab on ${target.name}`);
            say(`DEADLY STAB. ${target.name} goes down${dr.dropped ? ` and drops ${dr.dropped} blood on the floor` : ""}. ${dr.left ? `${dr.left} left.` : "That was the last one."}`);
          } catch (err) { say((err as Error).message || "Your knife won't go in.", "warn"); }
          return;
        }
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
    const src = id === "blood" ? BLOOD_ICON : itemDef(id)?.icon ?? ""; // (a pile of blood on the floor: somebody died of fentanyl)
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
      if (got.item === "blood") { ctx.refreshHeader(); logAction(me, "drop", `picked up ${got.qty} blood`); say(`You pick up ${got.qty} blood.`); return; }
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
  const redDoorTap = (): void => { if (import.meta.env.MODE === "emulator") ctx.navigate("room", { roomId: STAGE_ID, from: LOBBY_ID }); else redDoorSay(); }; // (in the test the red door leads to the event stage)
  const redDoorSay = (): void => sixtySay("idag d.30 kl 20, Blodig Oktober deluxe album listening party, 1/1 drops", 6000); // (the red door behind 6ixty)
  /** he has something for you: the introduction's next step, or one of his jobs (the lighter job a couple of hours after the first blood) */
  const sixtyWants = (): boolean => {
    if (isTut) return me.tutorial === 0 || me.tutorial === 2;
    if (me.sixty.knifeAt === 0) return true;
    return jobReady(me) || (me.tutorial === 5 && findSlot(me.inventory, "lighter") >= 0);
  };

  /** Your bed: walk over and lie down in it (you're drawn under the covers for everyone); tap it again, or walk anywhere, to get up. */
  function bedAction(): void {
    const p = mine();
    if (!p || !isOwnRoom || faintUntil || frozen) return;
    clearSelection();
    if (p.lying) { getUp(); return; }
    pending = { type: "bed", fid: BED_ID, since: performance.now(), lastTry: 0 };
  }
  function layDown(): void {
    const p = mine();
    if (!p || p.lying) return;
    const head = headTile();
    p.path = []; p.emote = undefined; p.sit = false;
    p.lying = true;
    p.from = p.to = p.dest = { ...head };
    p.dir = 2;
    update(myRef, { x: head.x, y: head.y, dir: 2, bed: true, sit: null }).catch(() => undefined);
  }
  function getUp(): void {
    const p = mine();
    if (!p || !p.lying || (introUntil && performance.now() < introUntil)) return;
    const side = sideTile();
    p.lying = false;
    p.from = p.to = p.dest = { ...side };
    p.dir = 2;
    update(myRef, { x: side.x, y: side.y, dir: 2, bed: null }).catch(() => undefined);
  }

  function startLandlord(): void {
    closeToolWindows();
    clearSelection();
    pending = { type: "landlord", since: performance.now(), lastTry: 0 };
  }

  let loudspeakerApi: { close(): void } | null = null;
  function openLoudspeakerWindow(): void {
    if (!LOUDSPEAKER_ON && import.meta.env.MODE !== "emulator") return say("The loudspeaker is switched off for now.", "warn");
    if (loudspeakerApi) return;
    loudspeakerApi = openLoudspeaker(stage, ctx, () => { loudspeakerApi = null; });
  }

  function startHideoutLandlord(): void {
    closeToolWindows();
    clearSelection();
    pending = { type: "hlandlord", since: performance.now(), lastTry: 0 };
  }

  function startPetMerchant(): void {
    closeToolWindows();
    clearSelection();
    pending = { type: "pmerchant", since: performance.now(), lastTry: 0 };
  }

  function startBagman(): void {
    if (bagVisit === null) return say("Bagmand isn't here right now.", "warn");
    closeToolWindows();
    clearSelection();
    pending = { type: "bagman", since: performance.now(), lastTry: 0 };
  }

  function startSixty(auto = false): void {
    clearSelection();
    pending = { type: "sixty", since: performance.now(), lastTry: 0, ...(auto ? { auto: true } : {}) };
  }

  /** a little "+1 Knife" with its icon pops up over your head when 6ixty hands you something */
  function giftPop(text: string, icon: HTMLImageElement, uid: string = me.uid): void {
    const p = uid === me.uid ? mine() : players.get(uid);
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
        void furniIcon("f_planter"); // (the picture for the pay is ready when you come back)
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
        sixtyAfter(900, () => giftPop("+1 Growing kit", loadImg(furniIcon("f_planter")))); // the pay is 5 drops and a growing kit
        logAction(me, "room", "brought 6ixty the lighter (got 5 drops and a growing kit)");
        sixtySay(SIXTY_LINES.lighterDone, 3200);
        sixtyAfter(3400, () => sixtySay(SIXTY_LINES.lighterKit, 4200));
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
  /** The first three times you fill the watering can, the empty can and the sink in your room glow (counted on this device). */
  function sinkFills(): number { try { return Number(localStorage.getItem(`6ixplanet.sinkHint.${me.uid}`)) || 0; } catch { return 0; } }
  /** After the introduction, until you have searched a dumpster once, they flash yellow in the basement. */
  function lootHintOn(): boolean { return roomId === LOBBY_ID && !isTut && !me.isAdmin && me.tutorial >= 4 && Object.keys(me.dumpsters).length === 0; }
  function sinkHintOn(): boolean { return (isHideoutRoom || roomId === LOBBY_ID) && sinkFills() < 3 && findSlot(me.inventory, "wateringcan") >= 0 && findSlot(me.inventory, "wateringcan_full") < 0; } // (nothing flashes while you already carry a full can)
  /** The growing kit 6ixty pays for the lighter job: in your own room it flashes in your pocket until you have put one down (kept per player in this browser). */
  function potHintOn(): boolean {
    if (!isOwnRoom || isTut || me.tutorial < 6) return false;
    const k = `sixplanet.potPlaced.${me.uid}`;
    try {
      if (localStorage.getItem(k)) return false;
      if (def.furni.some((q) => q.kind === "f_planter")) { localStorage.setItem(k, "1"); return false; } // one stands in the room: it has been put down
    } catch { /* private mode: it just keeps flashing until the kit is gone from the pocket */ }
    return findSlot(me.inventory, "f_planter") >= 0;
  }
  /** points the player at the next thing: the knife (and the guy) in the pocket, then the pill */
  function tutorialGuide(): void {
    if (disposed) return;
    const knife = findSlot(me.inventory, "knife");
    const pill = findSlot(me.inventory, "pill");
    if (!isTut) {
      const kit = potHintOn() ? findSlot(me.inventory, "f_planter") : -1;
      const can = sinkHintOn() ? findSlot(me.inventory, "wateringcan") : -1;
      if (kit >= 0 && selectedSlot !== kit) panel.guide(kit); // the growing kit from 6ixty flashes in your pocket until you have put it down in your room
      else if (can >= 0 && selectedSlot !== can) panel.guide(can); // the empty watering can glows (and so does the sink) for your first three fills
      else panel.guide(null);
      return;
    }
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
      sixtyAfter(5400, () => { if (!pending && !mine()?.lying) startSixty(true); }); // you walk over to him (he finishes saying good job first); he hands you the pill: "eat this pill"
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
    if (isLaced(it.item)) return void consumeSlot(slot); // (it kills you)
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
  /** The super pill (4x walking speed for a minute) and the lean (the cup in your hand, an hour of better bins). */
  let dying = false;
  const FENT_SLOW_MS = 7000;
  /**
   * Fentanyl (or something laced with it) has gone in: the screen swims green, you walk at a fifth of your speed for 7 seconds, then you go down and
   * "DU OD'EDE PÅ FENT" shows for 10 seconds with what it cost you in blood, and you wake up in your own room. (The server took the blood and the item at once.)
   */
  let lastKilledAt = 0;
  function startKilled(k: { byName?: string; lost?: number; secs?: number; shot?: boolean; rocket?: boolean }): void {
    const p = mine();
    if (!p || dying) return;
    dying = true;
    pillCleanup?.();
    faintUntil = performance.now() + 18_000;
    p.slowUntil = undefined;
    p.path = []; p.emote = undefined; p.sit = false; p.sitTo = undefined; pending = null; mining = null;
    p.faint = true;
    update(myRef, { lay: true, sit: null }).catch(() => undefined);
    playThud(0.7);
    ctx.refreshHeader();
    if (k.lost) {
      const t = performance.now(), fp = feetOf(p, t);
      floaters.push({ text: `-${k.lost}`, x: fp.x, y: fp.y - 70 * scale, born: t, color: "#ff2d2d", icon: bloodImg, life: 4200, size: 2.4 });
    }
    stage.append(h("div", { class: "fent-flash" }));
    window.setTimeout(() => stage.querySelector(".fent-flash")?.remove(), 1400);
    say(k.rocket ? `${k.byName ?? "Somebody"} blew you up.` : k.shot ? `${k.byName ?? "Somebody"} shot you.` : `${k.byName ?? "Somebody"} killed you with a deadly stab.`, "warn");
    if (k.rocket) window.setTimeout(() => { if (!disposed) sendChat(ROCKET_LINE); }, 700); // (the rocket makes you say it)
    const stop = showDeathScreen(stage, k.rocket ? "DU BLEV SPRÆNGT I LUFTEN" : k.shot ? "DU BLEV SKUDT" : "DU BLEV DRÆBT", k.secs ?? 10, () => { dying = false; faintUntil = 0; ctx.navigate("room", { roomId: ownRoomId(me.uid), arrival: "bed", intro: true, force: true }); }, k.lost ? { lost: `-${k.lost} blod`, icon: BLOOD_ICON } : undefined);
    unsubs.push(stop);
  }

  function startFentDeath(p: Player, r: { lost?: number; ms?: number; item?: string }): void {
    dying = true;
    const app = document.getElementById("app");
    const t0 = performance.now();
    const timers: number[] = [];
    p.slowUntil = t0 + FENT_SLOW_MS;
    say(r.item ? "You took it. It was laced. Your legs go heavy…" : "You swallow it. Your legs go heavy…", "warn");
    const swim = window.setInterval(() => {
      const t = performance.now() - t0;
      const ramp = Math.min(1, t / FENT_SLOW_MS);
      if (app) app.style.filter = `blur(${(0.3 + 5 * ramp * ramp + Math.sin(performance.now() / 380) * 1.2 * ramp).toFixed(1)}px) hue-rotate(${(Math.sin(t / 700) * 55 * ramp).toFixed(0)}deg) saturate(${(1 + 1.4 * ramp).toFixed(2)})`;
    }, 70);
    const tidy = (): void => { window.clearInterval(swim); timers.forEach((t) => window.clearTimeout(t)); if (app) app.style.filter = ""; pillCleanup = null; };
    pillCleanup = tidy; // leaving the room ends the dizziness
    timers.push(window.setTimeout(() => {
      tidy();
      if (disposed) return;
      faintUntil = performance.now() + (r.ms ?? 10_000) + 8000; // (out cold until you are carried home)
      p.slowUntil = undefined;
      p.path = []; p.emote = undefined; p.sit = false; p.sitTo = undefined; pending = null; mining = null;
      p.faint = true; // down
      update(myRef, { lay: true, sit: null }).catch(() => undefined);
      playThud(0.7);
      ctx.refreshHeader(); // (the blood is gone from the top bar now)
      void call(me, "fentDrop", { room: roomId }).catch(() => undefined); // (and it lies on the floor where you went down)
      if (r.lost) {
        const t = performance.now(), fp = feetOf(p, t);
        floaters.push({ text: `-${r.lost}`, x: fp.x, y: fp.y - 70 * scale, born: t, color: "#ff2d2d", icon: bloodImg, life: 4200, size: 2.4 });
        for (let i = 0; i < 6; i++) floaters.push({ text: "", x: fp.x + (i - 2.5) * 16 * scale, y: fp.y - 30 * scale, born: t + i * 90, color: "#ff2d2d", icon: bloodImg, life: 1800, size: 1.2 });
      }
      stage.append(h("div", { class: "fent-flash" }));
      window.setTimeout(() => stage.querySelector(".fent-flash")?.remove(), 1400);
      const stop = showDeathScreen(stage, "DU OD'EDE PÅ FENT", Math.round((r.ms ?? 10_000) / 1000), () => { dying = false; faintUntil = 0; ctx.navigate("room", { roomId: ownRoomId(me.uid), arrival: "bed", intro: true, force: true }); }, r.lost ? { lost: `-${r.lost} blod`, icon: BLOOD_ICON } : undefined);
      unsubs.push(stop);
    }, FENT_SLOW_MS));
  }

  /** Shows your look in the room (and to yourself): what the server has set on you (me.lookKind / me.lookUntil). */
  function setMyLook(p: Player): void {
    const live = me.lookUntil > serverNow() && !!me.lookKind;
    p.look = live ? me.lookKind : undefined;
    p.lookUntil = live ? me.lookUntil : undefined;
    void update(myRef, { look: p.look ?? null, lookUntil: p.lookUntil ?? null }).catch(() => undefined);
  }

  /** Heroin: the screen goes dark and you lie where you stood for 10 seconds. */
  function startNod(ms: number, then: () => void): void {
    const p = mine();
    if (!p || disposed || faintUntil || trippingOn) return;
    trippingOn = true;
    faintUntil = performance.now() + ms;
    p.path = []; p.emote = undefined; p.sit = false; p.sitTo = undefined; pending = null;
    p.faint = true;
    update(myRef, { lay: true, sit: null }).catch(() => undefined);
    const ov = h("div", { class: "nod-overlay" });
    document.body.append(ov);
    window.requestAnimationFrame(() => ov.classList.add("on"));
    const t1 = window.setTimeout(() => ov.classList.remove("on"), Math.max(0, ms - 1200));
    const end = (): void => {
      window.clearTimeout(t1); window.clearTimeout(t2);
      ov.remove();
      pillCleanup = null;
      trippingOn = false;
      faintUntil = 0; p.faint = false;
      if (!disposed) { update(myRef, { lay: null }).catch(() => undefined); then(); }
    };
    const t2 = window.setTimeout(end, ms);
    pillCleanup = end; // leaving the room ends it
  }

  /** The 芬太尼: 10 seconds at 10 times your speed and the LSD spin at three times its speed, then it is the 2x speed with everything else. */
  function startRush(p: Player, ms: number): void {
    const until = serverNow() + ms;
    p.fastMult = 10; p.fast = Math.max(me.speedUntil, until); p.spin = until;
    void update(myRef, { fast: p.fast, fastMult: 10, spin: until }).catch(() => undefined);
    window.setTimeout(() => {
      if (disposed) return;
      p.fastMult = me.speedMult; p.spin = undefined;
      void update(myRef, { fastMult: me.speedMult, spin: null }).catch(() => undefined);
      say("The rush is over. Everything else is still on you.");
    }, ms + 200);
  }

  /** bagmand's drugs (heroin, percs, 2cb, ketamine, 芬太尼): what the server set on you shows on you and in the room, and heroin / the rush play out here. */
  function applyDrug(p: Player, r: { drug?: string; nodMs?: number; rushMs?: number }): void {
    const sn = serverNow();
    p.fast = me.speedUntil > sn ? me.speedUntil : undefined;
    p.fastMult = me.speedMult;
    p.chem = me.chemUntil > sn ? me.chemUntil : undefined;
    if (me.cupUntil > sn) p.cup = me.cupUntil;
    void update(myRef, { fast: p.fast ?? null, fastMult: p.fast ? me.speedMult : null, chem: p.chem ?? null, ...(me.cupUntil > sn ? { cup: me.cupUntil } : {}) }).catch(() => undefined);
    setMyLook(p);
    const msg: Record<string, string> = {
      heroin: "You push it in. Everything goes warm and heavy… and dark.",
      percs: "You swallow the percs. A purple haze settles over you. You run twice as fast and stabs give triple blood, for 3 minutes.",
      twocb: "You swallow the 2cb. The colours start to move. Every door is open to you and you run twice as fast, for 3 minutes.",
      ketamine: "You swallow the ketamine. Your head feels long. A horse's head grows over yours, for a minute.",
      fentcn: "You swallow the 芬太尼. THE WORLD EXPLODES. Run.",
    };
    say(msg[r.drug ?? ""] ?? "You swallow it.");
    if (r.nodMs) startNod(r.nodMs, () => say("You come to. Stabs give 4x blood for 3 minutes."));
    else if (me.shroomUntil > sn) startDmt(10_000, { lie: false });
    if (r.rushMs) startRush(p, r.rushMs);
  }

  /** the puff-bar: puff it (once a minute): 35 seconds of 1.5x speed and double stab blood, with the cloud over you (everybody sees it) */
  async function usePuff(slot: number): Promise<void> {
    const p = mine();
    if (!p || p.lying || faintUntil || woozy || trippingOn || dying) return;
    const wait = me.vapeAt + VAPE_COOLDOWN_MS - serverNow();
    if (wait > 0) return say(`The puff-bar needs ${Math.ceil(wait / 1000)} more seconds.`, "warn");
    try {
      const r = await puffVape(me, slot);
      clearSelection();
      panel.refresh();
      playSfx("select", 0.5);
      const sn = serverNow();
      p.path = []; p.vape = r.until;
      p.fast = me.speedUntil > sn ? me.speedUntil : undefined;
      p.fastMult = me.speedMult;
      void update(myRef, { vape: r.until, fast: p.fast ?? null, fastMult: p.fast ? me.speedMult : null }).catch(() => undefined);
      logAction(me, "room", "puffed the puff-bar");
      say("You take a long puff. Something clammy looks back at you. 35 seconds of speed and double stab blood.");
    } catch (err) {
      say((err as Error).message || "Nothing comes out.", "warn");
    }
  }

  async function consumeSlot(slot: number): Promise<void> {
    const p = mine();
    if (!p || p.lying || faintUntil || woozy || trippingOn || dying) return;
    const it = me.inventory[slot];
    if (!it) return;
    try {
      const r = await consumeItem(me, slot, badTripNow());
      clearSelection();
      panel.refresh();
      playSfx("select", 0.5);
      if (r.kind === "fentdeath") {
        logAction(me, "room", r.item ? `died of a laced ${r.item}` : "died of fentanyl");
        startFentDeath(p, r);
      } else if (r.kind === "dmt") {
        logAction(me, "room", "swallowed DMT");
        say("You swallow the yellow pill. The floor tilts and the colours start to move.");
        startDmt(r.ms ?? 10_000, {
          lie: true,
          then: () => { // the colours are over: now the 4 minutes of double speed (and open doors) begin
            p.fast = me.speedUntil; p.fastMult = me.speedMult;
            void update(myRef, { fast: p.fast, fastMult: p.fastMult }).catch(() => undefined);
            say("You get up. Everything is fast, and every room is open to you. For 4 minutes.");
          },
        });
      } else if (r.kind === "lsd") {
        logAction(me, "room", "took LSD");
        say("You put the little pattern on your tongue. Everything starts to breathe, and your legs won't stop.");
        const until = serverNow() + (r.tripMs ?? 90_000);
        p.fast = me.speedUntil; p.fastMult = me.speedMult; p.spin = until; // 3x speed and spinning for a minute and a half, while the patterns only last 10 seconds
        void update(myRef, { fast: p.fast, fastMult: p.fastMult, spin: until }).catch(() => undefined);
        window.setTimeout(() => { if (!disposed) void update(myRef, { spin: null }).catch(() => undefined); }, (r.tripMs ?? 90_000) + 500);
        startDmt(r.ms ?? 10_000, { lie: false });
      } else if (r.kind === "shroom") {
        logAction(me, "room", "ate a shroom");
        say("You chew the shroom. It tastes like soil. The edges of the world start to move.");
        startDmt(r.ms ?? 10_000, { lie: false, then: () => say("Every door is open to you for 3 minutes. Take the basement door and walk into anyone's room.") });
      } else if (r.kind === "codeine") {
        p.cup = me.cupUntil;
        void update(myRef, { cup: p.cup }).catch(() => undefined);
        logAction(me, "room", "drank codeine");
        say("You drink the lean. Slow and heavy. For an hour the bins give twice as much, twice as often.");
      } else if (r.kind === "drug") {
        logAction(me, "room", `took ${r.drug}`);
        applyDrug(p, r);
      }
      if (r.badtrip) { logAction(me, "room", "bad trip"); startBadTrip(); }
    } catch (err) { say((err as Error).message || "Couldn't do that.", "warn"); }
  }

  /**
   * DMT and shrooms: for ten seconds the screen fills with moving patterns. With DMT you also lie on the floor where you stood (and everyone sees it);
   * a shroom's patterns are only a faint wash and you stay on your feet. `then` runs when it is over (the speed and room access come after the colours).
   */
  let trippingOn = false;
  let badTripOn = false, badTripRun = false;
  const badTripNow = (): boolean => { try { return useEmulator && localStorage.getItem("6ixplanet.badtrip") === "1"; } catch { return false; } }; // (only in the local test: a switch to get one every time)
  /**
   * A bad trip (the server says so after a psychedelic, one time in ten): for 30 seconds you say things in the chat; for the last 15 you are naked and run around the room by yourself at four times
   * your speed; then you fall asleep for 4 seconds and wake up in your room.
   */
  function startBadTrip(): void {
    const p = mine();
    if (!p || badTripOn || disposed) return;
    badTripOn = true;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void): void => { timers.push(window.setTimeout(() => { if (!disposed) fn(); }, ms)); };
    const others = (): string[] => [...players.values()].filter((q) => q.uid !== me.uid && !q.npc && !q.sleeper).map((q) => q.name);
    const pick = BADTRIP_LINES.map((l, i) => ({ l, k: Math.random() + (i < 2 ? 0 : 0.0001) })).sort((x, y) => x.k - y.k).map((x) => x.l);
    const count = 3 + Math.floor(Math.random() * 3); // 3 to 5 lines
    const span = BADTRIP_MS - 5000;
    for (let i = 0; i < count; i++) {
      later(1500 + (i * span) / count + Math.random() * (span / count) * 0.6, () => {
        const names = others();
        let line = pick[i % pick.length];
        if (line.includes("{name}")) {
          if (!names.length) line = pick.find((l) => !l.includes("{name}")) ?? line;
          else line = line.split("{name}").join(names[Math.floor(Math.random() * names.length)]);
        }
        sendChat(line);
      });
    }
    const naked = (fig: string): string => fig.split(".").filter((part) => /^(hd|hr|fa|ey)-/.test(part)).join("."); // (only the head and the body are left)
    later(BADTRIP_MS - BADTRIP_RUN_MS, () => {
      const q = mine();
      if (!q) return;
      badTripRun = true;
      q.figure = naked(q.figure);
      const until = serverNow() + BADTRIP_RUN_MS + 400;
      q.fast = until; q.fastMult = 4;
      void update(myRef, { figure: q.figure, fast: until, fastMult: 4 }).catch(() => undefined);
      say("Your clothes are gone and your legs will not stop.", "warn");
      const run = window.setInterval(() => {
        const r = mine();
        if (!r || disposed) return;
        if (r.path.length > 0) return;
        for (let tries = 0; tries < 30; tries++) {
          const x = Math.floor(Math.random() * def.w), y = Math.floor(Math.random() * def.h);
          if (walkable(x, y)) { walkTo({ x, y }, true); if (r.path.length) break; }
        }
      }, 180);
      timers.push(run);
    });
    later(BADTRIP_MS, () => {
      for (const t of timers) { window.clearTimeout(t); window.clearInterval(t); }
      badTripRun = false;
      const q = mine();
      if (q) { q.path = []; q.fast = undefined; q.fastMult = me.speedMult; q.faint = true; faintUntil = performance.now() + BADTRIP_SLEEP_MS + 8000; q.emote = undefined; q.sit = false; q.sitTo = undefined; pending = null; }
      void update(myRef, { lay: true, sit: null, fast: null }).catch(() => undefined);
      const stop = showDeathScreen(stage, "DU FALDT I SØVN", Math.round(BADTRIP_SLEEP_MS / 1000), () => { dying = false; faintUntil = 0; ctx.navigate("room", { roomId: ownRoomId(me.uid), arrival: "bed", intro: true, force: true }); });
      unsubs.push(stop);
    });
    unsubs.push(() => { for (const t of timers) { window.clearTimeout(t); window.clearInterval(t); } badTripRun = false; });
  }
  function startDmt(ms: number, opts: { lie: boolean; then?: () => void }): void {
    const p = mine();
    if (!p || disposed || faintUntil || trippingOn) return;
    trippingOn = true;
    const lie = opts.lie;
    if (lie) {
      faintUntil = performance.now() + ms;
      p.path = []; p.emote = undefined; p.sit = false; p.sitTo = undefined; pending = null;
      p.faint = true; // they go down (shown to everyone, like after the other pill)
      update(myRef, { lay: true, sit: null }).catch(() => undefined);
    }
    const cv = h("canvas", { class: "dmt-overlay" }) as HTMLCanvasElement;
    document.body.append(cv);
    // a small canvas, stretched over the screen: a pattern worked out per pixel from the distance and angle to the middle, with colours that keep rolling
    const W = (cv.width = Math.max(120, Math.ceil(innerWidth / 3))), H = (cv.height = Math.max(120, Math.ceil(innerHeight / 3)));
    const g2 = cv.getContext("2d")!;
    const img = g2.createImageData(W, H);
    const dist = new Float32Array(W * H), ang = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - W / 2, dy = y - H / 2, i = y * W + x; dist[i] = Math.hypot(dx, dy); ang[i] = Math.atan2(dy, dx); }
    const pal = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) { // a rainbow, hsl(i/256) at full colour
      const hh = (i / 256) * 6, c = Math.floor(hh), f = hh - c, q = Math.round(255 * (1 - f)), t = Math.round(255 * f);
      const rgb = [[255, t, 0], [q, 255, 0], [0, 255, t], [0, q, 255], [t, 0, 255], [255, 0, q]][c % 6];
      pal.set(rgb, i * 3);
    }
    const t0 = performance.now();
    let raf = 0;
    const draw = (): void => {
      const t = performance.now() - t0, ts = t / 1000;
      cv.style.opacity = String(Math.max(0, Math.min(1, t / 700, (ms - t) / 1200)) * (lie ? 0.72 : 0.24));
      const px = img.data;
      for (let i = 0; i < W * H; i++) {
        const d = dist[i], a = ang[i];
        const v = Math.sin(d * 0.2 - ts * 2.4) + Math.sin(a * 6 + ts * 1.4 + d * 0.05) + Math.sin(d * 0.07 + a * 3 - ts * 0.9) * 1.3;
        const k = (((v + 3.3) / 6.6) * 255 + ts * 60) & 255;
        px[i * 4] = pal[k * 3]; px[i * 4 + 1] = pal[k * 3 + 1]; px[i * 4 + 2] = pal[k * 3 + 2]; px[i * 4 + 3] = 255;
      }
      g2.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    const done = window.setTimeout(() => end(), ms);
    const end = (): void => {
      window.clearTimeout(done);
      cancelAnimationFrame(raf);
      cv.remove();
      pillCleanup = null;
      trippingOn = false;
      if (lie && faintUntil) { faintUntil = 0; p.faint = false; if (!disposed) update(myRef, { lay: null }).catch(() => undefined); } // they get up
      if (!disposed) opts.then?.();
    };
    pillCleanup = end; // leaving the room ends it
  }

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
      sendChat("Faaaahhhh shii");
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
  const fmtDuration = (ms: number): string => (ms % 60_000 === 0 ? `${ms / 60_000} minute${ms === 60_000 ? "" : "s"}` : ms < 120_000 ? `${Math.round(ms / 1000)} seconds` : `${Math.round(ms / 6000) / 10} minutes`);
  const finishing = new Set<number>();
  function burnDown(): void {
    me.inventory.forEach((s, i) => {
      const sm = s ? SMOKABLE[s.item] : undefined;
      if (!s || !sm || !s.lit || serverNow() - s.lit < smokeMsOf(s.item) || finishing.has(i)) return;
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
          if (r.lookKind === "blue") extra.push("you float over the ground");
          if (r.deadly) extra.push(`you have ${r.deadly} deadly stabs: use your knife on somebody`);
          if (p && r.lookKind) setMyLook(p);
          if (p && (r.speedMs || r.chemMs)) {
            p.fast = me.speedUntil || undefined;
            p.fastMult = me.speedMult;
            p.chem = me.chemUntil || undefined;
            void update(myRef, { fast: p.fast ?? null, fastMult: p.fast ? me.speedMult : null, chem: p.chem ?? null }).catch(() => undefined);
          }
          if (r.chudMs) {
            const until = serverNow() + r.chudMs;
            if (p) p.chud = until;
            void update(myRef, { chud: until }).catch(() => undefined);
            window.setTimeout(() => { if (!disposed) void update(myRef, { chud: null }).catch(() => undefined); }, r.chudMs + 500);
            say("You finish the chud joint. Nothing happens. Except your name is now chud.");
            return;
          }
          if (r.shroomMs) {
            logAction(me, "room", `smoked a ${s.item}`);
            startDmt(10_000, { lie: false, then: () => say("Every door is open to you for 3 minutes. Take the basement door and walk into anyone's room.") });
          }
          say(`You finish the ${name}. You feel sharp: stabs give x${r.mult ?? sm.mult} blood for ${fmtDuration(r.boostMs ?? sm.boostMs)}${extra.length ? ` and ${extra.join(", ")}` : ""}.`);
        }
      }).catch(() => undefined).finally(() => window.setTimeout(() => finishing.delete(i), 4000));
    });
  }

  // ---- start: presence, players, chat, events ---------------------------------------
  /** You come in through the door (the tile in front of it), or on login you're standing by your bed; else the nearest free tile. */
  function spawnTile(): Pt {
    const back = opts.from ? def.extraDoors?.find((d) => d.to === opts.from) : undefined; // coming back through a door: stand in front of it
    const want = roomId === STAGE_ID ? { x: 1, y: 16 } : opts.arrival === "bed" && isOwnRoom ? sideTile() : roomId === LOBBY_ID && opts.from && isHideoutId(opts.from) ? { x: 1, y: 24 } : roomId === LOBBY_ID && opts.from === STAGE_ID ? { x: RED_DOOR_X, y: 1 } : roomId === LOBBY_ID && opts.from && isStreetsRoom(opts.from) ? { x: 1, y: 12 } : roomId === ARRIVAL_ID && opts.from === LOBBY_ID ? { x: ARRIVAL_ELEVATOR.x, y: 1 } : roomId === STREETS_ID ? savedStreetSpot() ?? { x: 2, y: 1 } : { x: back ? back.x : def.doorX, y: 1 };
    const taken = (x: number, y: number) => [...players.values()].some((o) => { const t = currentTile(o); return t.x === x && t.y === y; });
    const tiles: Pt[] = [];
    for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) if (walkable(x, y) && !taken(x, y)) tiles.push({ x, y });
    tiles.sort((a, b) => Math.hypot(a.x - want.x, a.y - want.y) - Math.hypot(b.x - want.x, b.y - want.y));
    // a little variety so a crowd doesn't stack on one tile
    if (roomId === STREETS_ID && tiles[0] && tiles[0].x === want.x && tiles[0].y === want.y && savedStreetSpot()) return tiles[0]; // (back after a refresh: exactly where you stood)
    const near = tiles.slice(0, 4);
    return near[Math.floor(Math.random() * near.length)] ?? { x: 0, y: 0 };
  }

  const playersRef = ref(db, `rooms/${roomId}/players`);
  const myRef = ref(db, `rooms/${roomId}/players/${me.uid}`);
  /** what the database does with my entry when the connection drops: it goes (in the streets it is only marked off, so a fight can't be escaped by closing the game) */
  const armLeave = (): void => { void (roomId === STREETS_ID ? onDisconnect(myRef).update({ off: serverTimestamp() }) : onDisconnect(myRef).remove()).catch(() => undefined); };
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  function paintFx(): void {
    fxBtn.classList.toggle("on", !!(chatFx.fx || chatFx.fc));
    input.style.color = chatFx.fc ?? "";
    input.classList.toggle("fx-big", chatFx.fx === "big");
    const word = (v: string, on: boolean, label: string, click: () => void) => h("button", { class: "fx-opt" + (on ? " on" : ""), type: "button", onclick: click }, label);
    fxPanel.replaceChildren(
      h("div", { class: "fx-row" }, ...CHAT_EFFECTS.map((e) => word(e, chatFx.fx === e, { shake: "Shake", wave: "Wavy", rainbow: "Rainbow", pulse: "Pulse", big: "Big" }[e], () => { chatFx = { ...chatFx, fx: chatFx.fx === e ? undefined : e }; paintFx(); }))),
      h("div", { class: "fx-row" }, ...CHAT_COLORS.map((c) => h("button", { class: "fx-sw" + (chatFx.fc === c ? " on" : ""), type: "button", style: { background: c }, "aria-label": c, onclick: () => { chatFx = { ...chatFx, fc: chatFx.fc === c ? undefined : c }; paintFx(); } }))),
      h("div", { class: "fx-row" }, h("span", { class: "fx-prev" }, fxText("Sådan ser det ud", chatFx.fx, chatFx.fc)), h("button", { class: "fx-opt", type: "button", onclick: () => { chatFx = {}; paintFx(); } }, "Clear")));
  }
  fxBtn.addEventListener("click", () => { fxPanel.hidden = !fxPanel.hidden; if (!fxPanel.hidden) paintFx(); });
  const syncFxBtn = (): void => { fxBtn.hidden = !me.owned.ducky_fx; if (fxBtn.hidden) { chatFx = {}; fxPanel.hidden = true; } };
  window.addEventListener("pocket-changed", syncFxBtn);
  /** the colour of your name changed (Ducky machine): everyone sees it through your presence */
  const onNameColor = (e: Event): void => { const c = (e as CustomEvent<string>).detail; const mp = mine(); if (mp) mp.nc = c; void update(myRef, { nc: c }).catch(() => undefined); };
  window.addEventListener("name-color", onNameColor);
  unsubs.push(() => { window.removeEventListener("pocket-changed", syncFxBtn); window.removeEventListener("name-color", onNameColor); });
  /** a chat line goes to the room (where it fades after 15 minutes) and, in the same write, to chatLog: the admin's permanent archive (nobody can change or delete an entry) */
  function sendChat(text: string): void {
    // a moderator has muted you, or the account is too new to chat in the public rooms: the database refuses the line, so say why instead of letting it vanish
    if (me.mutedUntil > serverNow()) { say(`You are muted for ${Math.max(1, Math.ceil((me.mutedUntil - serverNow()) / 60000))} more minutes.`, "warn"); return; }
    if ((roomId === LOBBY_ID || roomId === SHOP_ID) && me.createdAt && serverNow() - me.createdAt < NEW_ACCOUNT_CHAT_MS) { say(`New accounts can chat here after ${Math.ceil(NEW_ACCOUNT_CHAT_MS / 60000)} minutes. You can chat in your own room now.`, "warn"); return; }
    const id = push(chatRef).key!;
    const msg = { uid: me.uid, name: shownName, text, ts: serverTimestamp(), ...(me.owned.ducky_fx && chatFx.fx ? { fx: chatFx.fx } : {}), ...(me.owned.ducky_fx && chatFx.fc ? { fc: chatFx.fc } : {}) };
    update(ref(db), { [`rooms/${roomId}/chat/${id}`]: msg, [`chatLog/${id}`]: { ...msg, room: roomId } }).catch(console.warn);
  }
  const eventsRef = ref(db, `rooms/${roomId}/events`);
  const joinedAt = serverNow();

  // ---- the dice: a throw is written by the server to rooms/<room>/dice/<uid> (nobody else can write there), and shows over that player's head for everybody ----
  const diceRolls = new Map<string, { n: number; start: number }>();
  const diceSeen = new Map<string, number>();
  function onDice(snap: { key: string | null; val(): unknown }): void {
    const uid = snap.key, v = snap.val() as { n?: unknown; at?: unknown } | null;
    if (!uid || !v || typeof v.at !== "number" || !Number.isInteger(v.n) || (v.n as number) < 1 || (v.n as number) > 6) return;
    if (diceSeen.get(uid) === v.at) return;
    diceSeen.set(uid, v.at);
    const age = serverNow() - v.at;
    if (age > DICE_SHOW_MS) return; // (an old throw from before you came in)
    const n = v.n as number;
    diceRolls.set(uid, { n, start: performance.now() - Math.max(0, age) });
    playSfx("select", 0.35);
    const who = players.get(uid)?.name ?? "Someone";
    window.setTimeout(() => { if (!disposed) say(uid === me.uid ? `You rolled a ${n}.` : `${who} rolled a ${n}.`); }, Math.max(0, DICE_TUMBLE_MS - age)); // (a line only the game can write: it is not a chat message)
  }
  const diceRef = ref(db, `rooms/${roomId}/dice`);
  unsubs.push(onChildAdded(diceRef, onDice, () => undefined), onChildChanged(diceRef, onDice, () => undefined));

  // ---- mystery boxes: what somebody got is written by the server to rooms/<room>/caseWin/<uid>; it shows over their head and in the chat once their strip has stopped ----
  const caseSeen = new Map<string, number>();
  function onCaseWin(snap: { key: string | null; val(): unknown }): void {
    const uid = snap.key, v = snap.val() as { item?: unknown; qty?: unknown; ass?: unknown; at?: unknown; name?: unknown } | null;
    if (!uid || !v || typeof v.at !== "number" || typeof v.item !== "string") return;
    if (caseSeen.get(uid) === v.at) return;
    caseSeen.set(uid, v.at);
    const age = serverNow() - v.at;
    if (age > CASE_SPIN_MS + 4000) return; // (an old one from before you came in)
    const item = v.item, qty = Number.isInteger(v.qty) && (v.qty as number) > 0 ? (v.qty as number) : 1;
    const label = `${itemDef(item)?.name ?? item}${v.ass ? " (ass)" : ""}`;
    const who = players.get(uid)?.name ?? (typeof v.name === "string" ? v.name : "Someone");
    window.setTimeout(() => {
      if (disposed) return;
      giftPop(`+${qty} ${label}`, itemImg(item), uid);
      say(uid === me.uid ? `You opened a case and got ${label}.` : `${who} opened a case and got ${label}.`);
    }, Math.max(0, CASE_SPIN_MS - age));
  }
  const caseRef = ref(db, `rooms/${roomId}/caseWin`);
  unsubs.push(onChildAdded(caseRef, onCaseWin, () => undefined), onChildChanged(caseRef, onCaseWin, () => undefined));

  function kicked(msg: string): void {
    if (disposed) return;
    toast(msg, "err");
    ctx.navigate("room", { roomId: LOBBY_ID });
  }

  function renderOnline(): void {
    const here = [...players.values()].filter((p) => !p.sleeper && !p.ghost);
    online.replaceChildren(
      h("strong", {}, `In room (${here.length})`),
      ...here.map((p) => h("div", { class: p.uid === me.uid ? "me" : "" }, p.name)));
  }

  // ---- offline owners sleep in their bed -----------------------------------------------------------------
  let sleeperToken = 0;
  /** Someone else's room whose owner is offline shows the owner asleep in the bed (you can still stab them). Not stored anywhere. */
  function syncSleeper(): void {
    const owner = def.ownerUid;
    if (!started || disposed || !owner || owner === me.uid || isPublicRoom(roomId) || isHideoutRoom) return;
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
    const spawn = frozen ? (asLandlord ? { x: LANDLORD.x, y: LANDLORD.y } : { x: SIXTY.x, y: SIXTY.y }) : spawnTile(); // as 6ixty (or the landlord) you stand exactly where he stands
    const startDir = frozen ? (asLandlord ? LANDLORD.dir : SIXTY.dir) : 2;
    const mineP = makePlayer(me.uid, { name: shownName, figure: shownFigure(), ...(me.nameColor ? { nc: me.nameColor } : {}), x: spawn.x, y: spawn.y, dir: startDir, sixty: asSixty });
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
    // logging in again: you start asleep in your own bed, and stay there until you tap the floor or head somewhere else
    let sleepingIn = false;
    if (!opts.intro && isOwnRoom && !frozen && !asSixty && sleptUid !== me.uid) {
      sleptUid = me.uid;
      sleepingIn = true;
      mineP.lying = true;
      mineP.from = mineP.to = mineP.dest = { ...headTile() };
      mineP.dir = 2;
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
    const burningItem = me.inventory.find((s) => s && SMOKABLE[s.item] && s.lit && serverNow() - s.lit < smokeMsOf(s.item));
    const burning = burningItem?.lit;
    if (me.speedUntil > serverNow()) { mineP.fast = me.speedUntil; mineP.fastMult = me.speedMult; }
    if (me.speedUntil > serverNow() && me.speedMult === 3) mineP.spin = me.speedUntil; // LSD is the only 3x: the spinning goes with you into the next room (and across a reload)
    if (me.cupUntil > serverNow()) mineP.cup = me.cupUntil;
    if (me.chemUntil > serverNow()) mineP.chem = me.chemUntil;
    if (burning) { mineP.smoke = burning; mineP.smokeKind = SMOKABLE[burningItem!.item].kind; }
    armLeave();
    if (isStreets) { // closing the game in a street fight is no way out: your entry stays (marked off) while the fight goes on, and you can still be killed
      unsubs.push(onValue(ref(db, ".info/connected"), (s) => { if (s.val() === true && !disposed) { void update(myRef, { off: null }).catch(() => undefined); armLeave(); } }));
    }
    if (frozen) { // as 6ixty (or the landlord) you are locked facing the way he faces: nothing you do in the room (a shot, a tap, a gesture) turns you
      const lockedDir = startDir;
      const pin = window.setInterval(() => {
        const mp = mine();
        if (disposed || !mp || mp.dir === lockedDir) return;
        mp.dir = lockedDir;
        update(myRef, { dir: lockedDir }).catch(() => undefined);
      }, 250);
      unsubs.push(() => window.clearInterval(pin));
    }
    set(myRef, { name: shownName, figure: shownFigure(), ...(me.nameColor ? { nc: me.nameColor } : {}), x: sleepingIn ? headTile().x : spawn.x, y: sleepingIn ? headTile().y : spawn.y, dir: startDir, ts: serverTimestamp(), ...(sleepingIn ? { bed: true } : {}), ...(burning ? { smoke: burning, smokeKind: SMOKABLE[burningItem!.item].kind } : {}), ...(mineP.fast ? { fast: mineP.fast, fastMult: me.speedMult } : {}), ...(mineP.cup ? { cup: mineP.cup } : {}), ...(mineP.spin ? { spin: mineP.spin } : {}), ...(mineP.chem ? { chem: mineP.chem } : {}), ...(asSixty ? { sixty: true } : {}) }).catch(() => kicked("You can't be in that room."));
    { const un0 = unusualNow(); if (un0) { mineP.un = un0; void update(myRef, { un: un0 }).catch(() => undefined); } }
    unsubs.push(onMyUnusual((id) => { const mp = mine(); if (mp) mp.un = id ?? undefined; if (started) void update(myRef, { un: id ?? null }).catch(() => undefined); }));
    { const pl0 = petLookNow(); if (pl0) { mineP.pet = pl0; void update(myRef, { pet: pl0 }).catch(() => undefined); } }
    unsubs.push(onMyPetLook((look) => { const mp = mine(); if (mp) mp.pet = look ?? undefined; if (started) void update(myRef, { pet: look ?? null }).catch(() => undefined); }));
    if (me.vapeUntil > serverNow()) { mineP.vape = me.vapeUntil; void update(myRef, { vape: me.vapeUntil }).catch(() => undefined); } // (a puff-bar cloud still on you when you walk in)
    if (me.lookUntil > serverNow() && me.lookKind) { mineP.look = me.lookKind; mineP.lookUntil = me.lookUntil; void update(myRef, { look: me.lookKind, lookUntil: me.lookUntil }).catch(() => undefined); }
    unsubs.push(() => sixtyTimers.forEach((t) => window.clearTimeout(t)), () => sixtyShop?.close());
    const burnTimer = window.setInterval(burnDown, 1000);
    unsubs.push(() => window.clearInterval(burnTimer));
    unsubs.push(watchRocketAt(me.uid, (at) => { rocketAt = at; }));
    // a deadly stab on you (the server writes sendHome/<you>): you go down, your blood is on the floor, and you wake up in your room
    const homeFrom = serverNow();
    unsubs.push(onValue(ref(db, `sendHome/${me.uid}`), (s) => {
      const k = s.val() as { at?: number; byName?: string; lost?: number; secs?: number; shot?: boolean; rocket?: boolean } | null;
      if (!k || typeof k.at !== "number" || k.at < homeFrom - 5000 || k.at === lastKilledAt || disposed) return;
      lastKilledAt = k.at;
      startKilled(k);
    }, () => undefined));
    const awayTimer = window.setInterval(() => {
      const p = mine();
      if (!p || (!landlordApi && !vendingApi && !recordApi && !posterApi)) return;
      const t = currentTile(p);
      if (landlordApi && isShop && cheb(t, { x: LANDLORD.x, y: LANDLORD.y }) > 3) landlordApi.close();
      const vm = def.furni.find((f) => f.kind === "vending");
      if (vendingApi && vm && cheb(t, vm) > 3) vendingApi.close();
      const rp = def.furni.find((f) => f.kind === "recordplayer");
      if (recordApi && rp && cheb(t, rp) > 3) recordApi.close();
      const sp = def.furni.find((f) => f.kind === "shopposter");
      if (posterApi && sp && cheb(t, sp) > 4) posterApi.close();
    }, 300);
    unsubs.push(() => window.clearInterval(awayTimer));
    unsubs.push(watchDrops(roomId, (m) => { drops = m; sweepExpired(roomId, m.values()); }));
    const stopPocketWatch = (): void => undefined; void stopPocketWatch;
    const dropSweep = window.setInterval(() => sweepExpired(roomId, drops.values()), 5000);
    unsubs.push(() => window.clearInterval(dropSweep));
    if (isBasement) setAmbience(!musicOn()); if (roomId === SHOP_ID) setShopMusic(true); // the basement hums: the sound fades in as you arrive (but not over the jukebox's music)
    if (isBasement) { // the hum and a CD never play together: it fades out when the room's CD starts and comes back when it has finished (the CD ends by the clock, so this looks every second)
      const ambienceWatch = window.setInterval(() => { if (active) setAmbience(!musicOn()); }, 1000);
      unsubs.push(() => window.clearInterval(ambienceWatch));
    }
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
      // after the introduction: the first time you walk into the public room he tells you when to come back
      if (!isTut && !asSixty && me.tutorial === 4 && !jobReady(me)) {
        const seenKey = `sixtyCheckIn:${me.uid}`;
        let told = false;
        try { told = localStorage.getItem(seenKey) === "1"; } catch { /* no storage: he may say it again */ }
        if (!told) sixtyAfter(2600, () => {
          if (sixtyBusy || sixtyShop) return;
          sixtySay(sixtyCheckIn(waitText(jobWaitMs(me))), 9000);
          try { localStorage.setItem(seenKey, "1"); } catch { /* ignore */ }
        });
      }
      const psst = window.setInterval(() => {
        if (sixtyCalls() && !sixtyBusy && !sixtyShop && !(sixtyBubble && sixtyBubble.until > performance.now())) sixtySay(SIXTY_LINES.psst, 4500);
      }, 14_000);
      unsubs.push(() => window.clearInterval(psst));
      // the landlord by the hideout door calls out the message of a boosted hideout every 2 to 5 minutes (the owner writes it in the boost section on the computer)
      if (roomId === LOBBY_ID) {
        let ads: Array<{ owner: string; listing: HideoutListing }> = [];
        unsubs.push(watchHideoutList((l) => { ads = l; }));
        let adTimer = 0;
        const nextAd = (): void => {
          adTimer = window.setTimeout(() => {
            if (disposed) return;
            const live = ads.filter((a) => a.listing.ad && a.listing.boostUntil > serverNow());
            if (live.length && !(hlandlordBubble && hlandlordBubble.until > performance.now())) {
              const pick = live[Math.floor(Math.random() * live.length)].listing;
              hlandlordBubble = { text: `🔥 ${pick.name}: ${pick.ad}`, until: performance.now() + 9000 };
            }
            nextAd();
          }, HIDEOUT_AD_MIN_MS + Math.random() * (HIDEOUT_AD_MAX_MS - HIDEOUT_AD_MIN_MS));
        };
        nextAd();
        unsubs.push(() => window.clearTimeout(adTimer));
      }
    }
    if (roomId === LOBBY_ID) {
      // bagmand's visits: follow the clock (and his stock), and 6ixty says when he is back, once for each coming visit while he is away
      bagVisit = visitNow();
      unsubs.push(watchBagmand(() => { bagVisit = visitNow(); }));
      const bagTimer = window.setInterval(() => { bagVisit = visitNow(); if (bagVisit === null && bagmandApi) bagmandApi.close(); }, 1000);
      unsubs.push(() => window.clearInterval(bagTimer));
      // while he is here somebody in the basement asks every half minute for the hit that is due (he puts out 2 to 5 in a visit: see server/src/actions/bounty.ts)
      const hitTimer = window.setInterval(() => { if (!disposed && bagVisit !== null && !document.hidden) void bagmandHitTick(me).catch(() => undefined); }, 30_000 + Math.floor(Math.random() * 5000));
      unsubs.push(() => window.clearInterval(hitTimer));
      if (bagVisit !== null) void bagmandHitTick(me).catch(() => undefined);
      if (!asSixty) sixtyAfter(3400, () => {
        if (sixtyBusy || sixtyShop || (sixtyBubble && sixtyBubble.until > performance.now())) return;
        const m = awayMessage(me.uid);
        if (m) sixtySay(m, 7000);
      });
    }
    setPresenceRoom(me, isTut ? ownRoomId(me.uid) : roomId); // the private copy isn't a place friends can follow you to
    if (!isTut) { // the server clears the entries of players who are gone from this room (it asks when you arrive, and every 5 minutes)
      const sweep = (): void => { if (!disposed && !document.hidden) void call(me, "roomSweep", { room: roomId }).catch(() => undefined); };
      const first = window.setTimeout(sweep, 5000);
      const sweepTimer = window.setInterval(sweep, 5 * 60_000);
      unsubs.push(() => { window.clearTimeout(first); window.clearInterval(sweepTimer); });
    }
    unsubs.push(social.subscribe(syncSleeper));
    tutorialGuide();
    if (isTut && me.tutorial === 1) say("Tap the glowing knife in your pocket, then tap LegendGamer2015.");
    if (isTut && me.tutorial === 3) say("Tap the glowing pill in your pocket to swallow it.");

    const denied = () => kicked("You don't have access to that room.");
    // what the database lists as standing here; people whose session has died (no heartbeat, or no presence any more) are hidden, not drawn as ghosts
    const known = new Map<string, any>();
    /** a closed game in the streets: whoever is still being fought stays on the street for now */
    const logged = (uid: string): boolean => isStreets && !!known.get(uid)?.off && !!streetsApi?.fighting(uid);
    // (somebody is drawn here only while they are online AND their presence says this room: an entry left behind by a player who has moved on is a ghost, not somebody standing here)
    const visible = (uid: string): boolean => !social.presenceLoaded || (social.isOnline(uid) && (uid === me.uid || social.presence.get(uid)?.room === roomId)) || logged(uid);
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
    const ghostTimer = window.setInterval(applyVisibility, isStreets ? 2_000 : 30_000);
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
        if (isStreets) applyVisibility();
        const p = players.get(snap.key!);
        if (!p) return;
        p.name = v.name;
        p.figure = v.figure;
        p.smoke = typeof v.smoke === "number" ? v.smoke : undefined;
        p.smokeKind = typeof v.smokeKind === "string" ? v.smokeKind : undefined;
        p.fast = typeof v.fast === "number" ? v.fast : undefined;
        p.fastMult = typeof v.fastMult === "number" ? v.fastMult : undefined;
        p.cup = typeof v.cup === "number" ? v.cup : undefined;
        p.chem = typeof v.chem === "number" ? v.chem : undefined;
        p.vape = typeof v.vape === "number" ? v.vape : undefined;
        p.chud = typeof v.chud === "number" ? v.chud : undefined;
        p.spin = typeof v.spin === "number" ? v.spin : undefined;
        p.look = typeof v.look === "string" ? v.look : undefined;
        p.pet = typeof v.pet === "string" ? v.pet : undefined;
        p.un = typeof v.un === "string" ? v.un : undefined;
        p.lookUntil = typeof v.lookUntil === "number" ? v.lookUntil : undefined;
        p.nc = typeof v.nc === "string" && /^#[0-9a-fA-F]{6}$/.test(v.nc) ? v.nc : undefined;
        p.npc = v.sixty === true;
        p.sit = v.sit === true;
        p.faint = v.lay === true;
        const wasLying = !!p.lying && !p.sleeper;
        if (!p.sleeper) p.lying = v.bed === true;
        if (p.lying) { p.path = []; p.from = p.to = p.dest = { x: v.x, y: v.y }; } // in bed: no walking about
        else if (wasLying) p.from = p.to = p.dest = { x: v.x, y: v.y }; // got up: they stand beside the bed
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
            armLeave();
            set(myRef, { name: shownName, figure: shownFigure(), ...(me.nameColor ? { nc: me.nameColor } : {}), x: t.x, y: t.y, dir: mineNow.dir, ts: serverTimestamp(), ...(asSixty ? { sixty: true } : {}) }).catch(() => undefined);
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
        const sp = players.get(m.uid);
        const fx = isChatEffect(m.fx) ? m.fx : undefined, fc = isHexColor(m.fc) ? m.fc : undefined;
        const nameEl = h("b", { class: m.uid === me.uid ? "me" : "", ...(sp?.nc ? { style: { color: sp.nc } } : {}) }, m.name + ": ");
        addLine(h("div", { class: "line" }, nameEl, fx || fc ? fxText(m.text, fx, fc) : m.text), CHAT_LIFE_MS - age, snap.ref);
        const p = sp;
        const recent = typeof m.ts === "number" ? m.ts > joinedAt - 15000 : true;
        if (p && recent) p.bubble = { text: m.text, until: performance.now() + BUBBLE_MS, fx, fc };
      }, () => undefined),
      onChildAdded(query(eventsRef, orderByChild("ts"), limitToLast(10)), (snap) => {
        const ev = snap.val();
        if (!ev || typeof ev.ts !== "number" || ev.ts < joinedAt - 3000) return;
        if (ev.type === "syringe") {
          syringeFx.push({ uid: ev.from, start: performance.now(), burst: false });
          return;
        }
        if (ev.type === "bagmandSay" && typeof ev.text === "string") { // bagmand puts a hit out: he says it over his head and in the chat
          const line = trServer(String(ev.text).slice(0, 140)); // (the server wrote it in English: the Danish game shows it in Danish)
          bagmanBubble = { text: line, until: performance.now() + 8000 };
          addLine(h("div", { class: "line" }, h("b", {}, `${BAGMAN.name}: `), line), CHAT_LIFE_MS);
          return;
        }
        if (ev.type === "shot") { shotFx.push({ from: ev.from, to: ev.to, start: performance.now(), fired: false, rocket: !!ev.rocket }); return; }
        if (ev.type !== "stab") return;
        stabFx.push({ from: ev.from, to: ev.to, start: performance.now(), impact: false, dropped: false, ...(ev.fight ? { fight: true } : {}) });
        if (ev.to === me.uid && ev.from !== me.uid && !ev.fight) {
          say(`${players.get(ev.from)?.name ?? "Someone"} stabs you with a knife. It doesn't hurt a bit.`);
        }
      }, () => undefined));
    const chatSweep = window.setInterval(sweepChat, 20_000);
    unsubs.push(() => window.clearInterval(chatSweep));
    // the lobby has a CD player; its state is shared with everyone in the room
    if (roomId === LOBBY_ID || roomId.startsWith("u_") || isHideoutRoom) unsubs.push(watchCdPlayer(roomId, onCdState)); // the CD player in the basement, or the boombox in a player's room
    renderOnline();
    syncSleeper();
  }

  /** TEMP test commands (/giveblud 25, /weed): only the admin account gets anything from the server. */
  async function testCommand(cmd: "blood" | "weed" | "skip", n?: number): Promise<void> {
    try {
      const note = await debugCommand(me, cmd, n);
      ctx.refreshHeader();
      panel.refresh();
      if (cmd === "skip") mixerApi?.refresh();
      say(note || "(test) Done.");
    } catch (err) {
      say((err as Error).message || "Unknown command.", "warn");
    }
  }

  /** /give: "weed 3", "joint paper", "f_sofa", "research chemical 2 ass" ... */
  async function giveItem(arg: string): Promise<void> {
    const words = arg.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let ass = false;
    if (words[words.length - 1] === "ass") { ass = true; words.pop(); }
    let qty = 1;
    if (words.length > 1 && /^\d{1,2}$/.test(words[words.length - 1])) qty = Math.max(1, Number(words.pop()));
    const query = words.join(" ");
    if (!query) return say("Usage: /give <item> [amount] [ass]. Examples: /give weed 3, /give joint paper, /give kodimagnyl 2, /give f_sofa", "warn");
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const q = norm(query);
    const byId = Object.keys(ITEMS).find((id) => id === query.replace(/\s+/g, "_") || norm(id) === q);
    const byName = Object.values(ITEMS).find((d) => norm(d.name) === q) ?? Object.values(ITEMS).find((d) => norm(d.name).startsWith(q));
    const kind = Object.keys(FURNI_KINDS).find((id) => id === query.replace(/\s+/g, "_") || norm(FURNI_KINDS[id].label) === q);
    const id = byId ?? byName?.id ?? kind ?? query.replace(/\s+/g, "_");
    try {
      const note = await giveCommand(me, id, qty, ass);
      panel.refresh();
      say(note || "(test) Done.");
    } catch (err) {
      say((err as Error).message || "Unknown command.", "warn");
    }
  }

  // anti-spam: three sends within 4 seconds and the chat is locked for 8 seconds, with a little countdown on the Send button
  const sendTimes: number[] = [];
  let spamUntil = 0;
  let spamTimer = 0;
  const SPAM_WINDOW_MS = 4000, SPAM_LOCK_MS = 8000;
  function spamTick(): void {
    const left = Math.ceil((spamUntil - Date.now()) / 1000);
    if (left > 0) {
      sendBtn.textContent = `${left}s`;
      sendBtn.classList.add("cooling");
      (sendBtn as HTMLButtonElement).disabled = true;
      input.placeholder = "Slow down a little…";
      return;
    }
    window.clearInterval(spamTimer);
    spamTimer = 0;
    sendBtn.textContent = "Send";
    sendBtn.classList.remove("cooling");
    (sendBtn as HTMLButtonElement).disabled = false;
    input.placeholder = "Say something, or try /dance. Tap the floor to walk.";
  }
  unsubs.push(() => window.clearInterval(spamTimer));

  function send(): void {
    if (Date.now() < spamUntil) return; // cooling down: what you typed stays in the box
    const text = input.value.trim().slice(0, MAX_CHARS);
    if (!text) return;
    input.value = "";
    const sentAt = Date.now();
    sendTimes.push(sentAt);
    while (sendTimes.length > 3) sendTimes.shift();
    if (sendTimes.length === 3 && sentAt - sendTimes[0] < SPAM_WINDOW_MS) {
      spamUntil = sentAt + SPAM_LOCK_MS;
      sendTimes.length = 0;
      spamTick();
      spamTimer = window.setInterval(spamTick, 250);
    }
    if (text.startsWith("/")) {
      // TEMP-GIVEBLUD: testing command, remove together with the 'testBlood' rule in database.rules.template.json
      if (/^\/greenscreen$/i.test(text)) { // for filming ads: the room's floor and walls become pure chroma green, and the menus hide (type it again to go back)
        if (!(me.isAdmin || me.decorator || me.commands)) { say("Unknown command.", "warn"); return; }
        greenScreen = !greenScreen;
        document.body.classList.toggle("greenscreen", greenScreen);
        say(greenScreen ? "Green screen on. Type /greenscreen again to bring the room back." : "Green screen off.");
        return;
      }
      const skipM = /^\/skip\s+(\d{1,4})$/i.exec(text);
      if (skipM) { void testCommand("skip", Number(skipM[1])); return; } // TEMP: /skip <minutes> moves your plants, mixers and bins on in time
      if (/^\/build$/i.test(text)) { // emil and the admin: the furnishing panel with every piece there is (nothing is taken from storage)
        void call(me, "buildCheck", {}).then(() => {
          if (!(isHome || adminLobbyEdit || roomId.startsWith("u_"))) return say("You can't build in this room.", "warn");
          buildCmd = true;
          if (furnishOn) { exitFurnish(); }
          enterFurnish(true);
        }, (err) => say((err as Error).message || "Unknown command.", "warn"));
        return;
      }
      const tpM = /^\/tp\s+(\S+)(?:\s+(\S+))?$/i.exec(text);
      if (tpM) { // /tp <name> (go to them), /tp <name> me (bring them here), /tp <name> <name2> (send the first to the second): Emil and the admin
        void call<{ self: boolean; room: string; name: string }>(me, "staffTp", { who: tpM[1], ...(tpM[2] ? { to: tpM[2] } : {}) }).then((r) => {
          if (r.self) ctx.navigate("room", { roomId: r.room, from: roomId, force: true });
          else say(`${r.name} is on the way.`);
        }, (err) => say((err as Error).message || "Unknown command.", "warn"));
        return;
      }
      const testM = /^\/test1(?:\s+(.+))?$/i.exec(text);
      if (testM) { // the staff: to the room the elevator takes you to (the streets are closed to players until the admin opens them), or send a player there
        const who = (testM[1] ?? "").trim();
        void call<{ name: string; self: boolean }>(me, "streetsStaffTest", who ? { name: who } : {}).then((r) => {
          if (r.self) ctx.navigate("room", { roomId: ARRIVAL_ID, from: LOBBY_ID, force: true });
          else say(`${r.name} is on the way to the test area.`);
        }, (err) => say((err as Error).message || "Unknown command.", "warn"));
        return;
      }
      if (/^\/weed$/i.test(text)) { void testCommand("weed"); return; } // TEMP: testing command (admin only)
      // TEMP: /give <item> [amount] [ass]: any item by its id or its name (admin only)
      const giveM = /^\/give(?:\s+(.+))?$/i.exec(text);
      if (giveM && !/^\/giveblud/i.test(text)) { void giveItem(giveM[1] ?? ""); return; }
      const gift = /^\/giveblud\s+(\d{1,6})$/i.exec(text);
      if (gift) { void testCommand("blood", Math.min(useEmulator ? 100000 : 1000, Number(gift[1]))); return; }
      const id = text.slice(1).toLowerCase();
      if (EMOTE_BY_ID[id]) return performEmote(id);
      return say(`Unknown command. Emotes: ${Object.keys(EMOTE_BY_ID).map((e) => "/" + e).join(" ")}`, "warn");
    }
    sendChat(text);
  }

  // ---- render helpers ----------------------------------------------------------------
  /** how far a sitting player is lifted: the height of the seat under them */
  function sitLift(p: Player): number {
    const t = currentTile(p);
    const piece = seatTiles.get(`${t.x},${t.y}`);
    return piece ? FURNI_KINDS[piece.kind].seatHeight ?? 14 : 0;
  }

  /** how this player looks right now (bagmand's weeds and drugs), or null */
  const lookOf = (p: Player): string | null => (p.look && p.lookUntil && serverNow() < p.lookUntil ? p.look : null);
  /** the figure with the horse's head on while the horse look lasts (the hat is a design that ships with the game but is not for sale) */
  const withLook = (figure: string, p: Player): string => {
    if (lookOf(p) === "horse") return [...figure.split(".").filter((x) => !x.startsWith("ha-")), HORSE_HAT].join(".");
    const un = p.un ? unusualOf(p.un) : undefined; // an unusual replaces whatever is on the head
    return un ? [...figure.split(".").filter((x) => !x.startsWith("ha-") && !x.startsWith("he-")), un.part].join(".") : figure;
  };

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
    if (p.spin && serverNow() < p.spin && !p.lying && !p.faint) dir = SPIN_DIRS[Math.floor(now / ((p.fastMult ?? 2) >= 10 ? 47 : 140)) % 8]; // LSD: round and round, walking or not (the 芬太尼's rush: three times as fast)
    if (em?.def.motion === "dance") { dir = SPIN_DIRS[Math.floor(t / 420) % 8]; yOff = -Math.abs(Math.sin(t / 120)) * 6; }
    if (em?.def.motion === "bounce") yOff = -Math.abs(Math.sin(t / 110)) * 7;
    if (em?.def.motion === "hop") yOff = -Math.abs(Math.sin((t / em.def.ms) * Math.PI * 2)) * 16;

    // smoking: the hand is up at the mouth (the "drink" arm pose with no cup; the cigarette itself is drawn on top)
    // (holding a knife: the arm is out in the "carry" pose, and the knife itself is drawn in that hand)
    const sitting = !moving && !!p.sit && !em;
    if (sitting) yOff = -sitLift(p);
    if (lookOf(p) === "blue" && !p.lying && !p.faint) yOff -= 14 + Math.sin(now / 260) * 3; // natryger: hovering over the ground
    const rtArm = sitting && roulette ? roulette.armFor(p.uid, now) : null; // the gun is in this hand (or at this head)
    const pkArm = !moving && !sitting && !em ? pokerFx.armFor(p.uid, now) : null; // a player who busted at poker puts the gun to their head
    const actions = moving ? ["wlk"] : pkArm ? ["drk=9999"] : rtArm ? ["sit", rtArm === "raised" ? "drk=9999" : "crr=9999"] : em?.def.actions ?? (!em && isSmoking(p) ? ["drk=9999"] : !em && (holdsKnife(p, now) || holdsGun(p) || holdsCup(p) || holdsDice(p)) ? ["crr=9999"] : sitting ? ["sit"] : ["std"]);
    const gesture = talking ? "spk" : em?.def.gesture ?? "std";
    const frame = moving
      ? Math.floor((now - p.stepStart) / (stepOf(p) / 4)) % 4
      : talking ? Math.floor(now / 140) % (figureAnimated(p.figure) ? 24 : 2)
      : em?.def.actions?.includes("wav") ? Math.floor(now / 250) % 2
      : figureAnimated(p.figure) ? Math.floor(now / 110) % 24 // a garment with an animation of its own (sparklers...) keeps playing while you stand still
      : 0;
    if (roomId === STAGE_ID && !sitting) { const tt = moving ? (now - p.stepStart) / stepOf(p) : 1; yOff -= raiseAt(p.from.x, p.from.y) * (1 - tt) + raiseAt(p.to.x, p.to.y) * tt; } // (the stage floor is raised: whoever walks on it is lifted)
    return { opts: { figure: withLook(roulette ? roulette.figureFor(p.uid, p.figure, sitting) : p.figure, p), dir, headDir: dir, actions, gesture, frame }, yOff };
  }

  /** The knife (Habbo's survival knife, one picture per way it can point) in a player's hand: while it's selected, and during a stab. */
  /** the karambit skin in the fist: a hooked, curved blade (gold to amber with dark tiger stripes), a dark grip and a finger ring, turned to the way they face */
  function drawKarambit(hx: number, hy: number, ux: number, uy: number): void {
    const u = scale * 0.8;
    g.save();
    g.translate(hx, hy);
    g.rotate(Math.atan2(uy, ux));
    if (ux < 0) g.scale(1, -1); // (pointing left it would be upside down: the curve stays on the same side)
    g.lineJoin = "round";
    // the grip with its ring at the back
    g.fillStyle = "#232323"; g.strokeStyle = "#0c0c0c"; g.lineWidth = 0.8 * u;
    g.beginPath(); g.roundRect(-9 * u, -1.9 * u, 11 * u, 3.8 * u, 1.4 * u); g.fill(); g.stroke();
    g.strokeStyle = "#b8bcc4"; g.lineWidth = 1.5 * u;
    g.beginPath(); g.arc(-10.8 * u, 0.4 * u, 2.7 * u, 0, Math.PI * 2); g.stroke();
    // the blade: a crescent that curves down at the tip
    const blade = new Path2D();
    blade.moveTo(2 * u, -1.6 * u); blade.bezierCurveTo(12 * u, -2.6 * u, 17 * u, 2 * u, 15.5 * u, 11 * u); blade.lineTo(13.6 * u, 9.6 * u); blade.bezierCurveTo(14.4 * u, 4.4 * u, 10 * u, 1.6 * u, 2 * u, 1.8 * u); blade.closePath();
    const gr = g.createLinearGradient(2 * u, -2 * u, 15 * u, 10 * u);
    gr.addColorStop(0, "#fff0a6"); gr.addColorStop(0.45, "#f6b81b"); gr.addColorStop(1, "#c25a0b");
    g.fillStyle = gr; g.fill(blade);
    g.save(); g.clip(blade);
    g.strokeStyle = "rgba(138,61,5,0.8)"; g.lineWidth = 0.9 * u;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo((3 + i * 2.4) * u, -3 * u); g.lineTo((6 + i * 2.4) * u, 12 * u); g.stroke(); }
    g.restore();
    g.strokeStyle = "#6b3a05"; g.lineWidth = 0.8 * u; g.stroke(blade);
    g.restore();
  }
  function drawKnifeInHand(fx: number, fy: number, dir: number, skin = false): void {
    const n = nitroIfReady(KNIFE_NITRO);
    if (!n && !skin) return;
    const [hdx, hdy] = KNIFE_HAND[dir] ?? KNIFE_HAND[2];
    const [ux, uy] = KNIFE_AXIS[dir] ?? KNIFE_AXIS[2]; // which way the blade points on screen = the way they face
    const hx = fx + hdx * scale; // the fist (where the arm ends in the "carry" pose)
    const hy = fy + hdy * scale;
    if (skin) { drawKarambit(hx, hy, ux, uy); return; }
    if (!n) return;
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
  /** the lean's cup, drawn in the same hand as the knife */
  const holdsCup = (p: Player): boolean => !!p.cup && serverNow() < p.cup;
  /** the dice in your own hand: while they are selected in your pocket (the Roll button is on the screen) */
  const holdsDice = (p: Player): boolean => p.uid === me.uid && !!selectedDef()?.rolls;
  function drawCupInHand(fx: number, fy: number, dir: number, id = "codeine", size = 26): void {
    const im = itemImg(id);
    if (!im.complete || !im.naturalWidth) return;
    const [hdx, hdy] = KNIFE_HAND[dir] ?? KNIFE_HAND[2];
    const ch = size * scale, cw = ch; // (the picture is square: the cup is in the middle of it)
    g.save();
    g.imageSmoothingEnabled = false;
    g.shadowColor = "rgba(0,0,0,0.75)"; g.shadowBlur = 3 * scale; // a white cup against a white shirt needs an edge
    g.drawImage(im, fx + hdx * scale - cw / 2, fy + hdy * scale - ch * 0.85, cw, ch);
    g.restore();
  }
  /** the gun in your own hand: while it is selected in your pocket (the bounties show over the heads, tap somebody to shoot) */
  const holdsGun = (p: Player): boolean => p.uid === me.uid && (selectedDef()?.useOnPlayer === "shoot" || selectedDef()?.useOnPlayer === "rocket");
  const holdsKnife = (p: Player, now: number): boolean =>
    (p.uid === me.uid && (selectedDef()?.useOnPlayer === "stab" || !!mining)) || stabFx.some((fx) => fx.from === p.uid && (now - fx.start) / STAB_MS <= 1.05);

  /** Little hearts that drift up over a player's head (a hash joint). (fx, fy) = the player's feet. */
  /** Particles are drawn as chunky pixels on the same grid as the game's art: a round blob made of square cells, snapped to the grid. */
  function pxCell(): number { return Math.max(1.5, scale); }
  function pxBlob(cx: number, cy: number, r: number, color: string): void {
    const P = pxCell();
    const n = Math.max(0, Math.round(r / P));
    const gx = Math.round(cx / P), gy = Math.round(cy / P);
    g.fillStyle = color;
    for (let dy = -n; dy <= n; dy++) {
      let w = 0;
      while ((w + 1) * (w + 1) + dy * dy <= n * n + n) w++;
      if (n === 0) w = 0;
      g.fillRect((gx - w) * P, (gy + dy) * P, (2 * w + 1) * P, P);
    }
  }
  /** A pixel-art heart (7 wide) at (cx, cy), pixel size from pxCell. */
  const HEART_PIX = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
  function pxHeart(cx: number, cy: number, size: number, color: string, shine: string): void {
    const P = pxCell() * size;
    const ox = Math.round((cx - 3.5 * P) / P) * P, oy = Math.round((cy - 3 * P) / P) * P;
    HEART_PIX.forEach((row, j) => [...row].forEach((c, i) => {
      if (c === "0") return;
      g.fillStyle = j === 1 && i === 1 ? shine : color;
      g.fillRect(ox + i * P, oy + j * P, P, P);
    }));
  }
  function drawHearts(fx: number, fy: number, now: number): void {
    const COLORS = ["#ff4d6d", "#ff7aa8", "#ff3b5c", "#ff9ec4"];
    g.save();
    for (let i = 0; i < 5; i++) {
      const t = (now / 2600 + i / 5) % 1;
      const x = fx + Math.sin(t * 7 + i * 2.3) * 11 * scale;
      const y = fy - (FEET_Y + 4) * scale - t * 34 * scale;
      g.globalAlpha = Math.min(1, t * 6) * (1 - t * t);
      pxHeart(x, y, i % 3 === 0 ? 1.4 : 1, COLORS[(i + Math.floor(now / 2600)) % COLORS.length], "#fff");
    }
    g.restore();
  }

  /**
   * What everybody can see of a player's high: a glow round the body and particles. It is worked out from what is shared in the room already
   * (fast + fastMult, cup), so it needs no new database fields: the super pill (4x) is gold, LSD (3x) is a rainbow, the 2x speed drugs
   * (thc-a, troll, DMT) are teal, and holding the lean's cup is purple. The research chemical has its own show and is left alone.
   */
  type Aura = { kind: "pill" | "lsd" | "speed" | "lean" | "look"; glow: string; blur: number; look?: string };
  function auraOf(p: Player, now: number): Aura | null {
    const sn = serverNow();
    if (p.chem && sn < p.chem) return null;
    const beat = 0.5 + 0.5 * Math.sin(now / 160);
    const lk = lookOf(p);
    if (lk && lk !== "horse") { // bagmand's weeds and drugs: each has its own colour (the horse has no glow, only the head)
      const col: Record<string, string> = { blue: "70,150,255", gold: "255,205,60", pink: "255,110,190", brown: "150,95,45", purple: "165,80,235", sparkle: "255,255,255" };
      const glow = lk === "rainbow" ? `hsla(${Math.floor(now / 3) % 360},100%,62%,0.9)` : `rgba(${col[lk] ?? "255,255,255"},${(0.65 + 0.3 * beat).toFixed(2)})`;
      return { kind: "look", look: lk, glow, blur: (11 + 9 * beat) * scale };
    }
    if (p.fast && sn < p.fast) {
      const m = p.fastMult ?? 2;
      if (m >= 4) return { kind: "pill", glow: `rgba(255,214,58,${(0.7 + 0.3 * beat).toFixed(2)})`, blur: (10 + 12 * beat) * scale };
      if (m === 3 || (p.spin && sn < p.spin)) return { kind: "lsd", glow: `hsla(${Math.floor(now / 3) % 360},100%,62%,0.9)`, blur: (12 + 10 * beat) * scale };
      return { kind: "speed", glow: `rgba(60,210,220,${(0.55 + 0.3 * beat).toFixed(2)})`, blur: (8 + 8 * beat) * scale };
    }
    if (p.cup && sn < p.cup) return { kind: "lean", glow: `rgba(150,90,230,${(0.6 + 0.25 * beat).toFixed(2)})`, blur: (9 + 7 * beat) * scale };
    return null;
  }
  /** A little four-point twinkle, drawn on the pixel grid. */
  function pxStar(cx: number, cy: number, arm: number, color: string): void {
    const P = pxCell();
    const gx = Math.round(cx / P) * P, gy = Math.round(cy / P) * P;
    g.fillStyle = color;
    g.fillRect(gx, gy, P, P);
    for (let i = 1; i <= arm; i++) { g.fillRect(gx + i * P, gy, P, P); g.fillRect(gx - i * P, gy, P, P); g.fillRect(gx, gy + i * P, P, P); g.fillRect(gx, gy - i * P, P, P); }
  }
  /** (fx, fy) = the player's feet. */
  function drawAuraParticles(a: Aura, fx: number, fy: number, now: number): void {
    const s = scale;
    g.save();
    if (a.kind === "pill") { // lightning: streaks race up the body and gold sparks fly off
      for (let i = 0; i < 9; i++) {
        const t = (now / 380 + i * 0.37) % 1;
        const x = fx + ((i % 5) - 2) * 6 * s + Math.sin(i * 7.3) * 2 * s;
        const y = fy - t * 86 * s;
        g.globalAlpha = (1 - t) * 0.9;
        g.fillStyle = i % 2 ? "#ffe680" : "#fff6c9";
        g.fillRect(Math.round(x), Math.round(y), pxCell(), Math.max(pxCell(), 9 * s * (1 - t * 0.5)));
      }
      for (let i = 0; i < 6; i++) {
        const k = Math.floor(now / 140) + i * 11;
        const ang = (k * 2.399) % (Math.PI * 2), rad = (14 + ((k * 7) % 12)) * s;
        g.globalAlpha = 0.5 + 0.5 * Math.sin(now / 70 + i);
        pxStar(fx + Math.cos(ang) * rad, fy - 44 * s + Math.sin(ang) * rad * 1.6, 1, "#ffd23a");
      }
    } else if (a.kind === "lsd") { // a ring of rainbow twinkles circling the body
      for (let i = 0; i < 12; i++) {
        const ang = now / 700 + (i / 12) * Math.PI * 2;
        const rad = (20 + 5 * Math.sin(now / 300 + i * 2)) * s;
        g.globalAlpha = 0.55 + 0.45 * Math.sin(now / 110 + i * 1.7);
        pxStar(fx + Math.cos(ang) * rad, fy - 46 * s + Math.sin(ang) * rad * 1.9, i % 3 === 0 ? 2 : 1, `hsl(${(Math.floor(now / 5) + i * 30) % 360},100%,68%)`);
      }
    } else if (a.kind === "speed") { // rings spread out from the feet and little motes rise
      for (let i = 0; i < 2; i++) {
        const t = (now / 900 + i / 2) % 1;
        g.globalAlpha = 0.65 * (1 - t);
        g.strokeStyle = "#63e6ee"; g.lineWidth = Math.max(1.5, 1.6 * s);
        g.beginPath(); g.ellipse(fx, fy, (8 + t * 22) * s, (4 + t * 11) * s, 0, 0, Math.PI * 2); g.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const t = (now / 1300 + i / 8) % 1;
        g.globalAlpha = 0.85 * (1 - t);
        pxBlob(fx + Math.sin(t * 6 + i * 2.2) * 13 * s, fy - (4 + t * 74) * s, 0.9 * s, "#8ff3f7");
      }
    } else if (a.kind === "look") { // bagmand's: rising motes and twinkles in the colour of the look
      const k = a.look ?? "";
      const mote = (n: number, rise: number, speed: number, color: string, size: number): void => {
        for (let i = 0; i < n; i++) {
          const t = (now / speed + i / n) % 1;
          g.globalAlpha = 0.85 * (1 - t);
          pxBlob(fx + Math.sin(t * 6 + i * 2.2) * 13 * s, fy - (4 + t * rise) * s, size * s, color);
        }
      };
      const stars = (n: number, color: (i: number) => string, radius: number): void => {
        for (let i = 0; i < n; i++) {
          const kk = Math.floor(now / 170) + i * 13;
          const ang = (kk * 2.399) % (Math.PI * 2), rad = (radius * 0.6 + ((kk * 7) % radius)) * s;
          g.globalAlpha = 0.45 + 0.55 * Math.sin(now / 80 + i * 1.3);
          pxStar(fx + Math.cos(ang) * rad, fy - 44 * s + Math.sin(ang) * rad * 1.7, i % 3 === 0 ? 2 : 1, color(i));
        }
      };
      if (k === "blue") {
        for (let i = 0; i < 2; i++) { // blue rings under the feet, and motes rising
          const t = (now / 900 + i / 2) % 1;
          g.globalAlpha = 0.7 * (1 - t); g.strokeStyle = "#6fb6ff"; g.lineWidth = Math.max(1.5, 1.6 * s);
          g.beginPath(); g.ellipse(fx, fy, (8 + t * 20) * s, (4 + t * 10) * s, 0, 0, Math.PI * 2); g.stroke();
        }
        mote(9, 80, 1500, "#9fd0ff", 0.9);
      } else if (k === "gold") { stars(9, (i) => (i % 2 ? "#ffe680" : "#fff6c9"), 24); mote(4, 70, 1700, "#ffd23a", 0.7); }
      else if (k === "pink") { drawHearts(fx, fy, now); stars(6, () => "#ff9ad0", 22); }
      else if (k === "brown") { mote(8, 74, 2100, "rgba(120,80,40,0.8)", 2.6); mote(5, 70, 2600, "rgba(200,170,130,0.6)", 1.6); }
      else if (k === "purple") { mote(9, 78, 2300, "#9a5ae6", 2); stars(5, () => "#d9b8ff", 22); }
      else if (k === "rainbow") { stars(12, (i) => `hsl(${(Math.floor(now / 5) + i * 30) % 360},100%,68%)`, 26); }
      else { stars(14, (i) => (i % 3 === 0 ? "#ffd23a" : i % 3 === 1 ? "#8fd0ff" : "#ffffff"), 28); } // sparkle: the loudpack
    } else { // lean: slow purple bubbles and a few twinkles
      for (let i = 0; i < 9; i++) {
        const t = (now / 2300 + i / 9) % 1;
        const x = fx + Math.sin(t * 5 + i * 1.9) * 12 * s, y = fy - (6 + t * 78) * s;
        g.globalAlpha = 0.7 * (1 - t);
        pxBlob(x, y, (1.4 + t * 2.4) * s, "#9a5ae6");
        g.globalAlpha = 0.9 * (1 - t);
        pxBlob(x - 0.6 * s, y - 0.6 * s, 0.5 * s, "#e5d0ff");
      }
      for (let i = 0; i < 4; i++) {
        g.globalAlpha = Math.max(0, Math.sin(now / 400 + i * 1.8));
        pxStar(fx + Math.sin(i * 4.1) * 15 * s, fy - (24 + i * 16) * s, 1, "#d9b8ff");
      }
    }
    g.restore();
  }

  /** A cigarette at the mouth and a thin stream of smoke rising from the tip. (fx, fy) = the player's feet, `dir` the way they face. */
  function drawCigarette(fx: number, fy: number, dir: number, now: number, kind?: string): void {
    const blunt = kind === "blunt" || kind === "chudblunt", joint = kind === "joint" || kind === "hashjoint" || kind === "chudjoint";
    const chud = kind === "chudjoint" || kind === "chudblunt"; // spots on the paper, and green smoke
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
    if (chud) { // the spots
      g.fillStyle = "#d83a4a";
      for (const u of [0.25, 0.5, 0.75]) pxBlob(mx + (tipx - mx) * u, my + (tipy - my) * u, 0, "#d83a4a");
    }
    g.strokeStyle = "#ff6a1a"; g.lineWidth = 3 * s;
    g.beginPath(); g.moveTo(tipx - (side || 1) * 1.6 * s, tipy - 0.3 * s); g.lineTo(tipx, tipy); g.stroke();
    }
    // the tip glows and flicks off sparks: orange, pink for hash, green for chud
    {
      const hot = kind === "hashjoint" ? "255,110,170" : chud ? "110,255,140" : "255,150,40";
      const pulse = 0.55 + 0.45 * Math.sin(now / 240);
      const gr = g.createRadialGradient(tipx, tipy, 0, tipx, tipy, (blunt ? 11 : 8) * s * (0.8 + 0.4 * pulse));
      gr.addColorStop(0, `rgba(${hot},${(0.75 * pulse + 0.2).toFixed(2)})`);
      gr.addColorStop(1, `rgba(${hot},0)`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(tipx, tipy, (blunt ? 11 : 8) * s * (0.8 + 0.4 * pulse), 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 4; i++) {
        const u = now / 800 + i / 4, t = u % 1, k = Math.floor(u);
        g.globalAlpha = 1 - t;
        pxBlob(tipx + Math.sin(k * 3.7 + i * 5.1) * 7 * s * t, tipy - t * 16 * s, 0, `rgb(${hot})`);
      }
      g.globalAlpha = 1;
    }
    // smoke: a few soft puffs that drift up, widen and fade
    for (let i = 0; i < 6; i++) {
      const t = (now / 1900 + i / 6) % 1;
      const px = tipx + Math.sin(t * 7 + i * 1.7) * 3.5 * s + t * 3 * s * (side || 1);
      const py = tipy - t * 36 * s;
      const r = (1.6 + t * 4.2) * s;
      pxBlob(px, py, r, chud ? `rgba(90,230,110,${(0.5 * (1 - t)).toFixed(3)})` : `rgba(222,224,230,${(0.42 * (1 - t)).toFixed(3)})`);
    }
    g.restore();
  }

  /** A growing kit: an empty pot; once planted the plant is revealed from the bottom up as it grows, with a growth bar and a water bar over it. */
  /** A mixer with a batch in it: it shakes a little while it works and shows a progress bar like the growing kit, then "ready!" until you collect. */
  function drawMixing(f: { id?: string; kind: string; x: number; y: number; dir?: number; up?: number; mix?: { doneAt: number; ms: number } }, now: number): Hitbox | null {
    const mix = f.mix!;
    const left = mix.doneAt - serverNow();
    const done = left <= 0;
    const speed = f.up === 2 ? 1.7 : f.up ? 1.35 : 1; // (an upgraded mixer works faster: it shakes faster too)
    const shake = done ? 0 : Math.sin((now * speed) / 40) * 0.7 * scale;
    g.save();
    g.translate(shake, done ? 0 : Math.sin((now * speed) / 53) * 0.3 * scale);
    const b = drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale);
    g.restore();
    if (!b) return null;
    const prog = done ? 1 : Math.max(0, Math.min(1, 1 - left / mix.ms));
    const bw = 30 * scale, bh = 4 * scale, cx = (b.x0 + b.x1) / 2, y = b.y0 - 7 * scale;
    g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(cx - bw / 2 - scale, y - scale, bw + 2 * scale, bh + 2 * scale);
    g.fillStyle = "#222"; g.fillRect(cx - bw / 2, y, bw, bh);
    g.fillStyle = done ? "#ffd75a" : "#e0a030"; g.fillRect(cx - bw / 2, y, bw * prog, bh);
    if (done) {
      const bounce = Math.sin(now / 260) * 2 * scale;
      g.font = `bold ${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`; g.textAlign = "center"; g.textBaseline = "bottom";
      g.lineWidth = 3; g.strokeStyle = "#000"; g.strokeText("ready!", cx, y - 3 * scale + bounce);
      g.fillStyle = "#ffe9a0"; g.fillText("ready!", cx, y - 3 * scale + bounce);
      g.textAlign = "start";
    }
    return { id: "", ...b, depth: f.x + f.y };
  }

  /** The automatic waterer: a little steel peg with a blue nozzle stands by the pot (it is the thing you see) and every few seconds a pixel spray arcs from it over the plant. */
  function drawSprinkler(f: { x: number; y: number }, now: number): void {
    const o = toScreen(iso(f.x + 0.5, f.y + 0.5));
    const u = Math.max(2, Math.round(scale * 3)); // one chunky pixel (the peg is the thing you look at: it is big and never thinner than 2 screen pixels)
    const px = (x: number, y: number, w: number, h: number, c: string): void => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const bx = o.x + 30 * scale, by = o.y + 14 * scale; // where the peg goes into the ground (right and in front of the pot)
    const head = { x: bx - 3 * u, y: by - 15 * u }; // the nozzle, pointing up at the pot
    const target = { x: o.x + 1 * scale, y: o.y - 8 * scale }; // the soil of the pot
    const cycle = 3600, burst = 2700;
    const ph = now % cycle;
    g.save();
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 0.25; px(bx - 3 * u, by - 0.5 * u, 6 * u, 1 * u, "#000"); g.globalAlpha = 1; // its shadow
    px(bx - 0.5 * u, by - 1 * u, 1 * u, 1.5 * u, "#5a4630"); // the spike in the soil
    px(bx - 0.5 * u, by - 12 * u, 1 * u, 11 * u, "#8da0af"); // the steel stake
    px(bx + 0.5 * u, by - 12 * u, 0.5 * u, 11 * u, "#4b5662");
    px(bx - 1.5 * u, by - 3 * u, 3 * u, 1 * u, "#2c333b"); // a foot plate
    // the head: a blue dome on the stake with a nozzle that points at the pot
    px(bx - 2 * u, by - 14 * u, 4 * u, 2 * u, "#2f7fc4");
    px(bx - 1 * u, by - 15 * u, 2 * u, 1 * u, "#2f7fc4");
    px(bx - 1 * u, by - 14 * u, 1 * u, 1 * u, "#8fd0ff");
    px(bx + 1 * u, by - 13 * u, 1 * u, 1 * u, "#1b4f80");
    px(bx - 3 * u, by - 14.5 * u, 1 * u, 1 * u, "#222a31"); // the nozzle tip
    const spraying = ph < burst;
    // the spray: three jets of drops leave the nozzle one after another and fall in an arc onto the soil
    const drops = 36;
    for (let i = 0; i < drops; i++) {
      const life = 760;
      const t0 = (i / drops) * (burst - life);
      const t = (ph - t0) / life;
      if (!spraying || t < 0 || t > 1) continue;
      const jet = i % 3; // left, middle, right of the pot
      const aim = target.x + (jet - 1) * 6 * scale + Math.sin(i * 12.9898) * 2 * scale;
      const x = head.x + (aim - head.x) * t;
      const y = head.y + (target.y - head.y) * t * t - Math.sin(t * Math.PI) * (12 + jet * 4) * scale;
      const big = i % 4 === 0 ? 1.6 : 1;
      px(x, y, u * big, u * big, i % 3 === 0 ? "#ffffff" : i % 2 ? "#9fd8ff" : "#5fb4f0");
      if (t > 0.8) { // it lands: a small splash on the soil
        const sp = (t - 0.8) / 0.2;
        px(x - (1 + 2 * sp) * u, y - sp * 2 * u, u, u, "#bfe6ff");
        px(x + (1 + 2 * sp) * u, y - sp * 2 * u, u, u, "#bfe6ff");
      }
    }
    if (spraying) { // a puff of mist at the nozzle while it works
      g.globalAlpha = 0.45; px(head.x - 2 * u, head.y - 1 * u, 2 * u, 2 * u, "#dff3ff"); g.globalAlpha = 1;
    } else { // between bursts the nozzle drips now and then
      const d = ((now % 1300) / 1300);
      if (d < 0.7) px(head.x, head.y + 1.5 * u + d * 8 * u, u, 1.5 * u, "#7fc4f5");
    }
    g.restore();
  }

  /** the pistol or the rocket launcher in the hand: its picture, turned to point along `ang` with the grip in the fist (the picture's grip and muzzle are given as shares of its size); returns where the muzzle is */
  const HELD = {
    gun: { img: gunImg, w: 26, grip: { x: 0.2, y: 0.62 }, muzzle: { x: 1, y: 0.12 } },
    rocket: { img: rocketImg, w: 40, grip: { x: 0.4, y: 0.82 }, muzzle: { x: 1, y: 0.5 } },
  } as const;
  function drawHeld(kind: "gun" | "rocket", x: number, y: number, ang: number): { muzzle: { x: number; y: number } } {
    const d = HELD[kind];
    const w = d.w * scale, hgt = w * ((d.img.naturalHeight || 1) / (d.img.naturalWidth || 1));
    const s = Math.cos(ang) < 0 ? -1 : 1; // (pointing left: the picture is turned over, so it is not upside down)
    const gx = d.grip.x * w, gy = d.grip.y * hgt, mx = d.muzzle.x * w - gx, my = d.muzzle.y * hgt - gy;
    if (d.img.complete && d.img.naturalWidth) {
      g.save();
      g.translate(x, y); g.rotate(ang); g.scale(1, s);
      g.imageSmoothingEnabled = false;
      g.drawImage(d.img, -gx, -gy, w, hgt);
      g.restore();
    } else drawGun(g, x, y, ang, scale * GUN_K * 1.8);
    const c = Math.cos(ang), sn = Math.sin(ang);
    return { muzzle: { x: x + mx * c - my * s * sn, y: y + mx * sn + my * s * c } };
  }
  /** the gun (or the rocket launcher) in the hand (the same fist as the knife and the cup), pointing the way they face */
  function drawGunInHand(fx: number, fy: number, dir: number, rocket = false): void {
    const [hdx, hdy] = KNIFE_HAND[dir] ?? KNIFE_HAND[2];
    const [ux, uy] = KNIFE_AXIS[dir] ?? KNIFE_AXIS[2];
    drawHeld(rocket ? "rocket" : "gun", fx + hdx * scale, fy + hdy * scale, Math.atan2(uy, ux));
  }
  /** a wanted tag over a head: a black plate with the bounty in white (and how many hits there are) */
  function drawBountyTag(amount: number, count: number, x: number, y: number, now: number): void {
    const s = Math.max(1, scale);
    const label = `${amount.toLocaleString("en-US")}${count > 1 ? ` ×${count}` : ""}`;
    g.save();
    g.font = `800 ${Math.round(11 * s)}px Verdana, sans-serif`;
    const tw = g.measureText(label).width + 30 * s;
    const bob = Math.sin(now / 300) * 1.5 * s;
    g.fillStyle = "rgba(10,10,10,0.92)";
    g.strokeStyle = "#f2f2f2"; g.lineWidth = Math.max(1, s * 0.8);
    g.beginPath(); g.roundRect(x - tw / 2, y - 18 * s + bob, tw, 17 * s, 4 * s); g.fill(); g.stroke();
    g.fillStyle = "#f2f2f2"; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText("☠", x - tw / 2 + 4 * s, y - 9 * s + bob);
    if (bloodImg.complete && bloodImg.naturalWidth) g.drawImage(bloodImg, x - tw / 2 + 17 * s, y - 15 * s + bob, 8 * s, 11 * s);
    g.fillText(label, x - tw / 2 + 27 * s, y - 9 * s + bob);
    g.restore();
  }
  /** the shot: the shooter's gun comes up at the target, the flash, the bullet and the hit (everybody in the room sees it) */
  function drawShots(now: number): void {
    for (const fx of shotFx) {
      const a = players.get(fx.from), b = players.get(fx.to);
      if (!a || !b) continue;
      const t = now - fx.start;
      if (t < 0 || t > SHOT_MS) continue;
      const fa = feetOf(a, now), fb = feetOf(b, now);
      const hand = { x: fa.x + (KNIFE_HAND[a.dir]?.[0] ?? 14) * scale, y: fa.y + (KNIFE_HAND[a.dir]?.[1] ?? -24) * scale };
      const to = { x: fb.x, y: fb.y - 46 * scale };
      const ang = Math.atan2(to.y - hand.y, to.x - hand.x);
      const r = drawHeld(fx.rocket ? "rocket" : "gun", hand.x, hand.y, ang);
      if (t < 160) drawMuzzleFlash(g, r.muzzle, 1 - t / 160, scale * (fx.rocket ? 1.5 : 0.9));
      if (fx.rocket) { // the rocket: it flies to the target leaving smoke, and blows up
        if (t >= 60 && t < 480) {
          const k = (t - 60) / 420;
          for (let i = 6; i >= 0; i--) { // the smoke trail
            const kk = Math.max(0, k - i * 0.05);
            const px = r.muzzle.x + (to.x - r.muzzle.x) * kk, py = r.muzzle.y + (to.y - r.muzzle.y) * kk;
            g.save(); g.globalAlpha = 0.5 * (1 - i / 7); g.fillStyle = i < 2 ? "#ffb347" : "#c9c9c9"; g.beginPath(); g.arc(px, py, (2.5 + i * 0.6) * scale, 0, Math.PI * 2); g.fill(); g.restore();
          }
          const bx = r.muzzle.x + (to.x - r.muzzle.x) * k, by = r.muzzle.y + (to.y - r.muzzle.y) * k;
          g.save(); g.translate(bx, by); g.rotate(ang); g.fillStyle = "#4f6a3c"; g.fillRect(-5 * scale, -1.8 * scale, 8 * scale, 3.6 * scale); g.fillStyle = "#d63428"; g.fillRect(3 * scale, -1.8 * scale, 3 * scale, 3.6 * scale); g.restore();
        }
        if (t >= 460 && t < 900) { // the explosion
          const u = (t - 460) / 440, rad = (14 + 46 * u) * scale;
          g.save();
          const gr = g.createRadialGradient(to.x, to.y, 0, to.x, to.y, rad);
          gr.addColorStop(0, `rgba(255,250,200,${(0.95 * (1 - u)).toFixed(2)})`);
          gr.addColorStop(0.45, `rgba(255,150,40,${(0.85 * (1 - u)).toFixed(2)})`);
          gr.addColorStop(1, "rgba(200,30,10,0)");
          g.fillStyle = gr; g.beginPath(); g.arc(to.x, to.y, rad, 0, Math.PI * 2); g.fill();
          g.restore();
        }
        continue;
      }
      if (t >= 40 && t < 260) { // the bullet: a short bright streak from the muzzle to the target
        const k = Math.min(1, (t - 40) / 160);
        const bx = r.muzzle.x + (to.x - r.muzzle.x) * k, by = r.muzzle.y + (to.y - r.muzzle.y) * k;
        const tx = r.muzzle.x + (to.x - r.muzzle.x) * Math.max(0, k - 0.25), ty = r.muzzle.y + (to.y - r.muzzle.y) * Math.max(0, k - 0.25);
        g.save(); g.strokeStyle = "#fff6c0"; g.lineWidth = Math.max(2, scale * 2); g.beginPath(); g.moveTo(tx, ty); g.lineTo(bx, by); g.stroke(); g.restore();
      }
      if (t >= 200 && t < 420) { // the hit: a red flash on the target
        g.save(); g.globalAlpha = 0.7 * (1 - (t - 200) / 220); g.fillStyle = "#ff2a1a"; g.beginPath(); g.arc(to.x, to.y, (10 + (t - 200) / 14) * scale, 0, Math.PI * 2); g.fill(); g.restore();
      }
    }
  }

  function closeShootBox(): void { shootBox?.remove(); shootBox = null; shootUid = ""; }
  /** Tapping somebody with the gun in your hand: a box with their name (so you shoot the right one), the bounty if there is one, and Shoot or Cancel. */
  function openShootBox(uid: string): void {
    const target = players.get(uid);
    const slot = selectedSlot;
    const rocket = slot !== null && me.inventory[slot]?.item === "rocket";
    if (!target || slot === null || (me.inventory[slot]?.item !== "gun" && !rocket)) return;
    closeShootBox();
    shootUid = uid;
    const bt = bounties.get(uid);
    let busy = false;
    const yes = h("button", { class: "yes", onclick: async () => {
      if (busy) return;
      busy = true; yes.setAttribute("disabled", "true");
      try {
        if (rocket) {
          const rr = await rocketFireCall(me, roomId, uid);
          closeShootBox(); rocketAt = serverNow();
          say(`You blew up ${rr.name}. They are down for ${rr.secs} seconds.`);
          return;
        }
        const r = await gunShootCall(me, roomId, uid, slot);
        closeShootBox(); clearSelection(); panel.refresh(); ctx.refreshHeader();
        if (r.bounty > 0) {
          const f0 = mine() ? feetOf(mine()!, performance.now()) : null;
          if (f0) floaters.push({ text: `+${r.bounty}`, x: f0.x, y: f0.y - 78 * scale, born: performance.now(), color: "#9dff9a", icon: bloodImg, life: 3200, size: 2 });
          say(`You shot ${r.name} and collected the ${r.bounty} on their head.${r.key ? " You found a box key on them." : ""}`);
        } else say(`You shot ${r.name}. Nothing on their head: they are down for ${r.secs} seconds.`);
      } catch (err) { closeShootBox(); say((err as Error).message || "The gun jams.", "warn"); }
    } }, rocket ? "Fire" : "Shoot");
    const reload = rocket ? Math.max(0, rocketAt + ROCKET_COOLDOWN_MS - serverNow()) : 0;
    if (reload > 0) yes.setAttribute("disabled", "true");
    shootBox = h("div", { class: "shoot-box" },
      h("div", { class: "shoot-title" }, rocket ? "Rocket launcher" : "Shoot"),
      h("div", { class: "shoot-name" }, target.name),
      rocket ? h("div", { class: "shoot-none" }, reload > 0 ? `Reloading: ${Math.ceil(reload / 60000)} min` : "They are dead for 30 seconds.") : bt ? h("div", { class: "shoot-bounty" }, h("img", { src: BLOOD_ICON, alt: "" }), `${bt.amount.toLocaleString("en-US")}${bt.count > 1 ? ` (${bt.count} hits)` : ""}`) : h("div", { class: "shoot-none" }, "Nothing on their head. They only go down for 10 seconds."),
      h("div", { class: "shoot-note" }, rocket ? "Once every 30 minutes." : "One bullet. It is gone after the shot."),
      h("div", { class: "shoot-row" }, h("button", { class: "no", onclick: () => closeShootBox() }, "Cancel"), yes));
    stage.append(shootBox);
  }
  function openWanted(): void { if (!wantedApi) wantedApi = openWantedBoard(document.body, () => { wantedApi = null; }); }
  function openNotice(): void { if (!noticeApi) noticeApi = openDiscordBoard(document.body, ctx, () => { noticeApi = null; }); }

  function drawPlanter(f: { id?: string; kind: string; x: number; y: number; dir?: number; plant?: { at: number; water: number; neglect: boolean; crop?: string } }, now: number): Hitbox | null {
    const k = FURNI_KINDS[f.kind];
    const potN = k.nitro ? nitroIfReady(k.nitro) : undefined;
    if (!potN) return null;
    const dir = f.dir ?? 0;
    const pl = f.plant;
    const poppyArt = pl?.crop === "poppy" ? mnstrArt : null; // (the poppy comes in a pot of its own: the plain pot is not drawn)
    const pot = poppyArt ? null : drawNitroSprites(g, potN, 1, 1, f.x, f.y, dir, k.nudge, toScreen, scale);
    let box = pot;
    const base = pot ?? (poppyArt ? drawNitroSpritesBox(poppyArt, f, dir, { x: 0, y: 0 }) : null);
    if (pl && base && isHome) {
      // a planted pot glows green like the mixers glow gold, and brighter when you point at it
      const hot = !!f.id && hoverObj?.id === f.id;
      const pulse = 0.5 + 0.5 * Math.sin(now / 450);
      const cx = (base.x0 + base.x1) / 2, cy = base.y0 - 10 * scale;
      const r = 46 * scale * (hot ? 1.2 : 1);
      const al = 0.12 + 0.05 * pulse + (hot ? 0.14 : 0);
      g.save();
      const halo = g.createRadialGradient(cx, cy, 2 * scale, cx, cy, r);
      halo.addColorStop(0, `rgba(80,230,90,${al.toFixed(2)})`);
      halo.addColorStop(0.55, `rgba(60,210,70,${(al * 0.6).toFixed(2)})`);
      halo.addColorStop(1, "rgba(60,210,70,0)");
      g.fillStyle = halo;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    const art = poppyArt ?? (pl?.crop === "shroom" ? shroomArt : foliageArt);
    if (pl && art) {
      const full = art;
      // the leaves are drawn so that their base sits on the new pot's rim (about 22px above the anchor, in the middle)
      const s0 = spritesFor(full, dir).find((q) => !q.isShadow && q.sw > 2);
      const leaf = poppyArt ? { x: -(k.nudge?.x ?? 0), y: -(k.nudge?.y ?? 0) } : s0 ? { x: -(s0.dx + s0.sw / 2), y: -22 - (s0.dy + Math.round(s0.sh * (pl.crop === "shroom" ? 0.95 : 0.64)) - 1) } : { x: 0, y: 0 };
      const leafNudge = { x: (k.nudge?.x ?? 0) + leaf.x, y: (k.nudge?.y ?? 0) + leaf.y };
      const prog = plantProgress(pl);
      const water = plantWater(pl);
      g.save();
      const probe = drawNitroSpritesBox(full, f, dir, leafNudge);
      if (probe) {
        const hh = probe.y1 - probe.y0;
        const shown = 0.34 + 0.66 * prog; // a seedling shows at once, the full plant when it's grown
        g.beginPath();
        g.rect(probe.x0 - 2, probe.y1 - hh * shown, probe.x1 - probe.x0 + 4, hh * shown + 2);
        g.clip();
        drawNitroSprites(g, full, 1, 1, f.x, f.y, dir, leafNudge, toScreen, scale);
        box = pot ? { x0: Math.min(pot.x0, probe.x0), y0: Math.min(pot.y0, probe.y0), x1: Math.max(pot.x1, probe.x1), y1: Math.max(pot.y1, probe.y1) } : probe;
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
        if (pl.crop !== "poppy") bar(y + bh + 3 * scale, water, water > 0 ? "#4aa8e8" : "#7a2a2a"); // water (a poppy needs none)
        if (prog >= 1) {
          const bounce = Math.sin(now / 260) * 2 * scale;
          g.font = `bold ${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`; g.textAlign = "center"; g.textBaseline = "bottom";
          g.lineWidth = 3; g.strokeStyle = "#000"; g.strokeText("ready!", cx, y - 3 * scale + bounce);
          g.fillStyle = "#c8ff8a"; g.fillText("ready!", cx, y - 3 * scale + bounce);
          g.textAlign = "start";
        }
      }
    }
    return box ? { id: "", ...box, depth: f.x + f.y } : null;
  }
  /** The screen box the full-grown plant art covers (without drawing it). */
  function drawNitroSpritesBox(n: NitroFurni, f: { x: number; y: number }, dir: number, nudge: { x: number; y: number }): Box | null {
    let box: Box | null = null;
    const o = toScreen(iso(f.x + 0.5, f.y + 0.5));
    for (const s of spritesFor(n, dir)) {
      if (s.isShadow || s.sw <= 2 || s.sh <= 2) continue;
      const left = o.x + nudge.x * scale + s.dx * scale, top = o.y + nudge.y * scale + s.dy * scale;
      const b2 = { x0: left, y0: top, x1: left + s.sw * scale, y1: top + s.sh * scale };
      box = box ? { x0: Math.min(box.x0, b2.x0), y0: Math.min(box.y0, b2.y0), x1: Math.max(box.x1, b2.x1), y1: Math.max(box.y1, b2.y1) } : b2;
    }
    return box;
  }

  /** the "Disconnected · 9" counter over a player who dropped out of the roulette game */
  function drawGhostTag(text: string, cx: number, bottom: number): void {
    const fs = Math.round(11 * Math.max(1, scale));
    g.save();
    g.font = `bold ${fs}px Verdana, 'Apple Color Emoji', sans-serif`;
    const w = g.measureText(text).width + 16, hgt = fs + 9;
    g.fillStyle = "rgba(20,8,8,0.82)";
    g.beginPath(); g.roundRect(cx - w / 2, bottom - hgt, w, hgt, hgt / 2); g.fill();
    g.strokeStyle = "rgba(255,120,90,0.85)"; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = "#ffd9cf"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, cx, bottom - hgt / 2 + 1);
    g.restore();
  }

  /** The price of a piece for sale: a blood drop and the number, tucked under the bottom right corner of it. */
  /**
   * The raffle's rare pieces each have an effect of their own, so everybody can see they are something special:
   *   shine   gold glow, twinkling stars and a streak of light that sweeps over the piece (the whippet)
   *   rainbow a glow and stars whose colours cycle through the rainbow (the cotton cloud)
   *   snow    an icy blue glow and snow drifting down around it (the snow drift)
   *   ring    light rings that spread over the floor, and a violet glow (the frost platform)
   *   embers  a flickering fire glow and embers that rise (the dragon lamp)
   */
  function drawRareShine(f: { kind: string; x: number; y: number; dir?: number }, box: Box, now: number): void {
    const effect = RAFFLE_EFFECTS[f.kind] ?? "shine";
    const pulse = 0.5 + 0.5 * Math.sin(now / 420);
    const hue = (now / 12) % 360;
    const flick = 0.55 + 0.45 * Math.sin(now / 70) * Math.sin(now / 130 + 1);
    const glow = effect === "rainbow" ? `hsla(${hue},100%,62%,0.95)` : effect === "snow" ? "rgba(150,215,255,0.95)" : effect === "ring" ? "rgba(190,140,255,0.95)" : effect === "embers" ? "rgba(255,110,30,0.95)" : "rgba(255,213,74,0.95)";
    // the glow: the piece again, lit, with a coloured shadow around it
    g.save();
    g.globalCompositeOperation = "lighter";
    g.shadowColor = glow;
    g.shadowBlur = (effect === "embers" ? 8 + 12 * flick : 10 + 8 * pulse) * scale;
    drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, effect === "embers" ? 0.12 + 0.18 * flick : 0.22 + 0.2 * pulse, true);
    g.restore();
    const P = pxCell(), w = box.x1 - box.x0, hgt = box.y1 - box.y0, cx = (box.x0 + box.x1) / 2;
    const snap = (v: number): number => Math.round(v / P) * P;
    const star = (x: number, y: number, arm: number, color: string, alpha: number): void => {
      g.globalAlpha = Math.max(0, Math.min(1, alpha));
      g.fillStyle = color;
      const gx = snap(x), gy = snap(y);
      g.fillRect(gx, gy, P, P);
      for (let k = 1; k <= arm; k++) { g.fillRect(gx + k * P, gy, P, P); g.fillRect(gx - k * P, gy, P, P); g.fillRect(gx, gy + k * P, P, P); g.fillRect(gx, gy - k * P, P, P); }
    };
    if (effect === "shine") {
      // a streak of light sweeping over the piece every few seconds: the piece again, in white, only inside a slanted band
      const t = (now % 3200) / 3200 * 1.7 - 0.35;
      if (t > -0.2 && t < 1.2) {
        const bx = box.x0 + w * t, bw = w * 0.22;
        g.save();
        g.beginPath();
        g.moveTo(bx, box.y0 - 4 * scale); g.lineTo(bx + bw, box.y0 - 4 * scale); g.lineTo(bx + bw - hgt * 0.35, box.y1 + 4 * scale); g.lineTo(bx - hgt * 0.35, box.y1 + 4 * scale);
        g.closePath();
        g.clip();
        g.globalCompositeOperation = "lighter";
        drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 0.85, true);
        g.restore();
      }
    }
    g.save();
    if (effect === "snow") {
      for (let i = 0; i < 16; i++) { // flakes fall from above the piece to its foot, swaying
        const life = 3200 + (i % 4) * 600, tt = ((now + i * 331) % life) / life;
        const x = box.x0 - w * 0.15 + w * 1.3 * (((i * 0.61) % 1)) + Math.sin(now / 500 + i * 2) * 4 * scale;
        const y = box.y0 - hgt * 0.25 + tt * hgt * 1.35;
        star(x, y, i % 5 === 0 ? 1 : 0, i % 3 === 0 ? "#ffffff" : "#bfe6ff", Math.sin(tt * Math.PI) * 1.4);
      }
    } else if (effect === "ring") {
      const fy = box.y1 - hgt * 0.1; // the floor under the piece
      g.globalCompositeOperation = "lighter";
      g.lineWidth = 2 * scale;
      for (let i = 0; i < 3; i++) {
        const tt = ((now + i * 900) % 2700) / 2700;
        g.globalAlpha = (1 - tt) * 0.75;
        g.strokeStyle = i % 2 ? "#e6d0ff" : "#b080ff";
        g.beginPath();
        g.ellipse(cx, fy, (0.25 + tt * 0.95) * w * 0.6, (0.25 + tt * 0.95) * w * 0.3, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalCompositeOperation = "source-over";
      for (let i = 0; i < 6; i++) { const tt = ((now + i * 470) % 2800) / 2800; star(box.x0 + w * (0.15 + ((i * 0.29) % 0.7)), fy - tt * hgt * 1.1, 1, i % 2 ? "#ffffff" : "#d2b0ff", Math.sin(tt * Math.PI) * 1.3); }
    } else if (effect === "embers") {
      for (let i = 0; i < 14; i++) { // embers rise from the flames, wobbling, and burn out
        const life = 1500 + (i % 4) * 400, tt = ((now + i * 211) % life) / life;
        const x = cx + (((i * 0.37) % 1) - 0.5) * w * 0.7 + Math.sin(now / 160 + i * 3) * 3 * scale * tt;
        const y = box.y0 + hgt * 0.35 - tt * hgt * 1.0;
        const col = tt < 0.35 ? "#fff1a8" : tt < 0.7 ? "#ff9a2e" : "#e03a1e";
        g.globalAlpha = Math.max(0, 1 - tt * 1.1);
        g.fillStyle = col;
        const sz = tt < 0.5 ? P * 1.5 : P;
        g.fillRect(snap(x), snap(y), sz, sz);
      }
    } else { // shine and rainbow: twinkling four-point stars drifting up around the piece
      for (let i = 0; i < 9; i++) {
        const life = 2600 + (i % 3) * 500, tt = ((now + i * 417) % life) / life;
        const sx = box.x0 + w * (0.08 + ((i * 0.37) % 0.84)) + Math.sin(now / 600 + i) * 3 * scale;
        const sy = box.y1 - hgt * 0.15 - tt * hgt * 1.05;
        const a = Math.sin(tt * Math.PI);
        const color = effect === "rainbow" ? `hsl(${(hue + i * 40) % 360},100%,70%)` : i % 3 === 0 ? "#ffffff" : "#ffe27a";
        star(sx, sy, Math.max(1, Math.round((1 + 2 * a) * (i % 2 ? 1 : 1.4))), color, a * 1.3);
      }
    }
    g.restore();
  }

  function drawPriceTag(price: number, right: number, bottom: number): void {
    const fs = Math.round(11 * Math.max(1, scale));
    g.save();
    g.font = `bold ${fs}px Verdana, 'Apple Color Emoji', sans-serif`;
    const label = String(price);
    const ic = fs + 2;
    const w = g.measureText(label).width + ic + 14, hgt = fs + 8;
    const x = right - w + 4 * scale, y = bottom - hgt + 2 * scale;
    g.fillStyle = "rgba(20,8,8,0.78)";
    g.beginPath(); g.roundRect(x, y, w, hgt, hgt / 2); g.fill();
    g.strokeStyle = "rgba(255,90,90,0.8)"; g.lineWidth = 1.5; g.stroke();
    if (bloodImg.complete && bloodImg.naturalWidth) g.drawImage(bloodImg, x + 5, y + (hgt - ic) / 2, ic, ic);
    g.fillStyle = "#ffe9e9"; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText(label, x + 8 + ic, y + hgt / 2 + 1);
    g.restore();
  }

  /**
   * A poster: the art, then its picture over the face of it (cut to the face, tilted to lie on the wall, drawn in big pixels).
   * The back wall tilts the picture one way and the left wall the other (the art slopes half a pixel per pixel); the face is 50 x 76 sprite pixels.
   */
  /** where the poster art is anchored: on the wall plane, half a tile along the wall (the poster covers two tiles, the art is anchored to the first) */
  const posterOrigin = (x: number, y: number, dir: number): { tx: number; ty: number } => (dir === 2 ? { tx: x - 0.5, ty: y + 0.5 } : { tx: x + 0.5, ty: y - 0.5 });
  function drawPosterAt(kind: string, x: number, y: number, dirIn: number, img: string | undefined, alpha: number, glowHot = false): Box | null {
    const k = FURNI_KINDS[kind];
    const art = posterArt;
    if (!art) return null;
    const dir = dirIn === 2 ? 2 : 4;
    const { tx, ty } = posterOrigin(x, y, dir);
    const box = drawNitroSpritesBox(art, { x: tx, y: ty }, dir, k.nudge ?? { x: 0, y: 0 });
    if (!box) return null;
    const b = drawNitroSprites(g, art, 2, 1, tx, ty, dir, k.nudge, toScreen, scale, alpha) ?? box;
    g.save();
    g.globalAlpha = alpha;
    g.translate(b.x0, b.y0);
    g.scale(scale, scale);
    g.imageSmoothingEnabled = false;
    const W = 50, H = 76;
    if (dir === 4) g.transform(1, 0.5, 0, 1, 1, 2.25); // back wall: the face slopes down to the right
    else g.transform(1, -0.5, 0, 1, 1, 27.25); // left wall: the other way
    g.beginPath(); g.rect(0, 0, W, H); g.clip();
    g.drawImage(posterPicture(img), 0, 0, W, H);
    g.fillStyle = "rgba(10,12,30,0.06)"; // the wall is in the shade of the room: a little darker, like everything else
    g.fillRect(0, 0, W, H);
    g.restore();
    if (glowHot) {
      g.save();
      g.globalCompositeOperation = "lighter";
      drawNitroSprites(g, art, 2, 1, tx, ty, dir, k.nudge, toScreen, scale, 0.14);
      g.restore();
    }
    return b;
  }

  function drawPoster(f: { id?: string; kind: string; x: number; y: number; dir?: number; img?: string }, now: number): Hitbox | null {
    const k = FURNI_KINDS[f.kind];
    const hot = !!f.id && hoverObj?.id === f.id;
    if (k.opens && posterArt) { // the poster in the shop glows like the other things you can use
      const dir0 = f.dir === 2 ? 2 : 4;
      const po = posterOrigin(f.x, f.y, dir0);
      const bx = drawNitroSpritesBox(posterArt, { x: po.tx, y: po.ty }, dir0, k.nudge ?? { x: 0, y: 0 });
      if (bx) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 450);
        const cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2, r = 62 * scale * (hot ? 1.15 : 1);
        g.save();
        const halo = g.createRadialGradient(cx, cy, 4 * scale, cx, cy, r);
        const a = 0.12 + 0.05 * pulse + (hot ? 0.14 : 0);
        halo.addColorStop(0, `rgba(255,214,70,${a.toFixed(2)})`);
        halo.addColorStop(0.6, `rgba(255,200,40,${(a * 0.6).toFixed(2)})`);
        halo.addColorStop(1, "rgba(255,200,40,0)");
        g.fillStyle = halo;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    }
    const b = drawPosterAt(f.kind, f.x, f.y, f.dir ?? 4, f.img, 1, hot && !!k.opens);
    if (!b) return null;
    if (k.opens && !furnishOn) drawPriceTag(POSTER_PRICE, b.x1, b.y1); // the shop poster shows its price in blood, like the other things for sale
    return { id: "", ...b, depth: f.x + f.y };
  }

  /** when each multi-state piece went into the state it is in (so its animation starts from the beginning when it is tapped) */
  const animClock = new Map<string, { st: number; at: number }>();
  /** the animation a piece is in right now: its state and how long it has been in it (undefined for pieces that never move) */
  function pieceAnim(f: { id?: string; kind: string; st?: number }, now: number): AnimState | undefined {
    const k = FURNI_KINDS[f.kind];
    if (!k?.nitro) return undefined;
    const n = nitroIfReady(k.nitro);
    if (!n || !isAnimated(n)) return undefined;
    const st = f.kind === "jukebox" ? (cdPlaying() ? 1 : 0) : (f.st ?? k.defaultState ?? 0); // (the jukebox lights up and its notes dance while the room's CD plays)
    const id = f.id ?? f.kind;
    let c = animClock.get(id);
    if (!c || c.st !== st) { c = { st, at: now }; animClock.set(id, c); }
    return { state: st, t: now - c.at, ...(k.still ? { still: k.still } : {}) };
  }
  /** the table top a small piece stands on (if its tile is under one) */
  function tableUnder(f: { id?: string; kind: string; x: number; y: number }): PlacedFurni | undefined {
    if (!FURNI_KINDS[f.kind]?.small) return undefined;
    return def.furni.find((t) => {
      if (t.id === f.id || !FURNI_KINDS[t.kind]?.surface) return false;
      const q = footprint(t.kind, t.dir);
      return f.x >= t.x && f.x < t.x + q.w && f.y >= t.y && f.y < t.y + q.h;
    });
  }
  /** Taps a piece with several looks or animations: it goes on to the next one right away here, and the server tells everyone else. */
  async function useFurni(id: string): Promise<void> {
    const f = def.furni.find((x) => x.id === id);
    const k = f ? FURNI_KINDS[f.kind] : undefined;
    if (!f || !k?.states || k.states.length < 2 || !(def.id.startsWith("u_") || isHideoutRoom)) return;
    try {
      const r = await useFurniState(me, def.id, id);
      if (typeof r.st === "number") f.st = r.st; // (the room's data will say the same in a moment)
      playSfx("select", 0.4);
    } catch (err) { say((err as Error).message || "Nothing happens.", "warn"); }
  }

  /** the arcade machine and the roulette table: a soft glow (red for the table, gold for the arcade), brighter when you point at it, and a game controller floating over it */
  function drawGameFurni(f: { id?: string; kind: string; x: number; y: number; dir?: number; st?: number }, now: number): Hitbox | null {
    const isTable = f.kind === "rtable";
    const b = drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 1, false, pieceAnim(f, now));
    if (!b) return null;
    if (greenScreen || furnishOn) return { id: "", ...b, depth: f.x + f.y };
    const hot = (!!f.id && hoverObj?.id === f.id) || (isTable && !!hoverObj && ROULETTE_KINDS.has(hoverObj.kind ?? "")); // pointing at the rack or a chair counts for the table
    const look = isTable && roulette ? roulette.look(now) : { stake: 0, glow: 0 };
    const pulse = 0.5 + 0.5 * Math.sin(now / 450);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const r = (isTable ? 72 : 46) * scale * (hot ? 1.2 : 1);
    const a = 0.11 + 0.05 * pulse + (hot ? 0.14 : 0) + look.glow * 0.35;
    const rgb = isTable ? "255,60,50" : "255,214,70", rgb2 = isTable ? "255,50,40" : "255,200,40";
    g.save();
    const halo = g.createRadialGradient(cx, cy, 2 * scale, cx, cy, r);
    halo.addColorStop(0, `rgba(${rgb},${a.toFixed(2)})`);
    halo.addColorStop(0.55, `rgba(${rgb2},${(a * 0.6).toFixed(2)})`);
    halo.addColorStop(1, `rgba(${rgb2},0)`);
    g.fillStyle = halo;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.restore();
    drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 1, true, pieceAnim(f, now)); // the piece again on top of the halo (its shadow is already down)
    if (hot) { g.save(); g.globalCompositeOperation = "lighter"; drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 0.12 + 0.05 * pulse, true, pieceAnim(f, now)); g.restore(); }
    if (hot && controllerImg.complete && controllerImg.naturalWidth) {
      const hs = (scale * 34) / controllerImg.naturalWidth, hw = controllerImg.naturalWidth * hs, hh = controllerImg.naturalHeight * hs;
      const bob = Math.sin(now / 380) * 3 * scale;
      g.save();
      g.imageSmoothingEnabled = false;
      g.shadowColor = isTable ? "rgba(255,90,80,0.7)" : "rgba(255,226,140,0.7)";
      g.shadowBlur = 6 * scale;
      g.drawImage(controllerImg, cx - hw / 2, b.y0 - hh - (isTable ? 34 : 2) * scale + bob, hw, hh);
      g.restore();
    }
    if (isTable && look.stake > 0) drawPriceTag(look.stake, b.x1, b.y1); // what is on the table
    return { id: "", ...b, y0: hot ? b.y0 - 40 * scale : b.y0, depth: f.x + f.y };
  }

  function drawFurni(f: { id?: string; kind: string; x: number; y: number; dir?: number; st?: number; auto?: boolean; up?: number; plant?: { at: number; water: number; neglect: boolean; crop?: string }; mix?: { doneAt: number; ms: number } }, now: number): Hitbox | null {
    if (f.up && f.kind === "f_mixer") f = { ...f, kind: f.up === 2 ? "f_mixer_up2" : "f_mixer_up" }; // (an upgraded mixer is drawn green, the MK2 dark grey)
    const k = FURNI_KINDS[f.kind];
    if (k.opens === "mixer" && f.mix) return drawMixing(f, now);
    if (k.plant) {
      const hb = drawPlanter(f, now);
      if (f.auto) drawSprinkler(f, now); // the automatic waterer: a peg beside the pot that sends water over it now and then
      return hb;
    }
    if (k.poster) return drawPoster(f, now);
    if (k.nitro && (f.kind === "rtable" || f.kind === "flappy")) return drawGameFurni(f, now);
    if (k.nitro) {
      const tbl = tableUnder(f);
      const lift = tbl ? FURNI_KINDS[tbl.kind].surface ?? 0 : 0; // a small piece on a table top stands on it
      if (lift) { g.save(); g.translate(0, -lift * scale); }
      let b: Box | null;
      if ((f.kind === "dumpster" && lootHintOn()) || (f.kind === "vending" && isShop && lighterStage(me) === "vending")) {
        // the dumpsters flash yellow the first time in the basement after the introduction (you can search them), and the vending machine on the lighter job
        const pulse = 0.5 + 0.5 * Math.sin(now / 240);
        g.save();
        g.shadowColor = `rgba(255,214,40,${(0.8 + 0.2 * pulse).toFixed(2)})`;
        g.shadowBlur = (10 + 26 * pulse) * scale;
        b = drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 1, false, pieceAnim(f, now));
        g.restore();
        g.save();
        g.globalCompositeOperation = "lighter";
        drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 0.5 * pulse, true, pieceAnim(f, now));
        g.restore();
      } else b = drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 1, false, pieceAnim(f, now), f.kind === "rchair" ? "back" : undefined); // (a roulette chair's backrest is drawn after the player in it: see below)
      if (lift) { g.restore(); if (b) { b.y0 -= lift * scale; b.y1 -= lift * scale; } }
      if (b && (f.kind === "ideaboard" || f.kind === "wantedboard" || f.kind === "discordboard") && !furnishOn) { // the ideas board glows a little (more when you point at it), so people notice it is there (the wanted board glows red)
        const red = f.kind === "wantedboard", blue = f.kind === "discordboard";
        const hot = !!f.id && hoverObj?.id === f.id;
        const pulse = 0.5 + 0.5 * Math.sin(now / 450);
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, r = 44 * scale * (hot ? 1.3 : 1);
        g.save();
        g.globalCompositeOperation = "lighter";
        const halo = g.createRadialGradient(cx, cy, 3 * scale, cx, cy, r);
        const a = 0.14 + 0.06 * pulse + (hot ? 0.16 : 0);
        halo.addColorStop(0, red ? `rgba(255,60,50,${(a + 0.06).toFixed(2)})` : blue ? `rgba(70,150,255,${(a + 0.06).toFixed(2)})` : `rgba(255,214,70,${a.toFixed(2)})`);
        halo.addColorStop(1, red ? "rgba(255,50,40,0)" : blue ? "rgba(60,140,255,0)" : "rgba(255,200,40,0)");
        g.fillStyle = halo;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
        g.restore();
        if (red && hitsOpen.length && bloodImg.complete && bloodImg.naturalWidth) { // a little blood drop floats over the wanted board while there is a hit up (everybody sees when one is possible)
          const bag = hitsOpen.some((x) => x.bagmand); // (one of bagmand's own hits: a bigger, faster drop with a red mark)
          const w = 13 * scale * (hot ? 1.2 : 1) * (bag ? 1.5 : 1), hgt = w * 1.375;
          const bob = Math.sin(now / (bag ? 220 : 380)) * (bag ? 5 : 3) * scale;
          g.save();
          g.imageSmoothingEnabled = false;
          g.shadowColor = "rgba(255,60,50,0.8)"; g.shadowBlur = (4 + 4 * pulse + (bag ? 6 : 0)) * scale;
          g.drawImage(bloodImg, cx - w / 2, b.y0 - hgt - 4 * scale + bob, w, hgt);
          if (bag) { // the red "!" next to it
            g.shadowBlur = 0; g.fillStyle = "#e8281e"; g.strokeStyle = "#fff"; g.lineWidth = 3 * scale;
            g.font = `bold ${Math.round(16 * scale)}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
            g.strokeText("!", cx + w * 0.85, b.y0 - hgt * 0.6 + bob); g.fillText("!", cx + w * 0.85, b.y0 - hgt * 0.6 + bob);
          }
          g.restore();
        }
      }
      const hotSink = k.opens === "sink" && ((!!f.id && hoverObj?.id === f.id) || ((pending?.type === "bag" || pending?.type === "use") && pending.fid === f.id)); // pointed at or tapped: the sink always shows its water drop
      const glowSink = k.opens === "sink" && (sinkHintOn() || hotSink);
      const isBoom = f.kind === "boombox" || f.kind === "f_boombox"; // the boombox glows red and floats a CD when you point at it or tap it
      const redGlow = isBoom || k.opens === "records" || k.opens === "elevator"; // so does the record player in the shop
      if (b && (k.opens || isBoom) && f.kind !== "vinyltable" && f.kind !== "raffletable" && (k.opens !== "sink" || glowSink) && (isBoom ? isHome : isHome || k.opens === "sink" || k.opens === "pets" || k.opens === "hideouts" || k.opens === "shop" || k.opens === "vending" || k.opens === "records" || k.opens === "stash" || k.opens === "jukebox" || k.opens === "ducky" || k.opens === "raffle" || k.opens === "elevator" || k.opens === "streetbin")) {
        // the bag of clothes: a soft pulsing glow, a floating hanger, and a brighter light when you point at it or walk to it
        const tableId = k.opens === "records" ? def.furni.find((x) => x.kind === "vinyltable")?.id : k.opens === "raffle" ? def.furni.find((x) => x.kind === "raffletable")?.id : undefined; // the record player stands on a table: pointing at the table counts too
        const hot = (!!f.id && hoverObj?.id === f.id) || ((pending?.type === "bag" || pending?.type === "use") && pending.fid === f.id) || (!!tableId && (hoverObj?.id === tableId || ((pending?.type === "bag" || pending?.type === "use") && pending.fid === tableId)));
        const pulse = 0.5 + 0.5 * Math.sin(now / 450);
        const cx = (b.x0 + b.x1) / 2;
        const cy = (b.y0 + b.y1) / 2;
        const r = 42 * scale * (hot ? 1.2 : 1) * (k.opens === "records" ? 1.5 : 1);
        // a warm gold halo (plain alpha, so it shows on the pale room background too), then the bag lit up on top when pointed at
        g.save();
        const halo = g.createRadialGradient(cx, cy, 2 * scale, cx, cy, r);
        const a = 0.11 + 0.05 * pulse + (hot ? 0.14 : 0);
        const glowRgb = redGlow ? "255,60,50" : "255,214,70";
        halo.addColorStop(0, `rgba(${glowRgb},${a.toFixed(2)})`);
        halo.addColorStop(0.55, `rgba(${redGlow ? "255,50,40" : "255,200,40"},${(a * 0.6).toFixed(2)})`);
        halo.addColorStop(1, `rgba(${redGlow ? "255,50,40" : "255,200,40"},0)`);
        g.fillStyle = halo;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
        g.restore();
        const onTable = tableUnder(f), liftUp = onTable ? (FURNI_KINDS[onTable.kind].surface ?? 0) * scale : 0; // (a piece on a table top is drawn again up there, not on the floor)
        if (liftUp) { g.save(); g.translate(0, -liftUp); }
        drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 1, true); // the bag again, on top of the halo (its shadow is already down)
        if (hot) {
          g.save();
          g.globalCompositeOperation = "lighter";
          drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 0.12 + 0.05 * pulse, true);
          g.restore();
        }
        if (liftUp) g.restore();
        // the hanger is only a hint: it floats over the bag until you've left your room for the first time, after that it only appears when the mouse is on the bag
        const noHint = k.opens === "mixer" || k.opens === "ducky" || k.opens === "raffle"; // the mixer glows like the rest, but has no little icon floating over it
        const showHanger = k.opens === "sink" ? glowSink && hot : k.opens === "ducky" || k.opens === "raffle" || k.opens === "elevator" || k.opens === "streetbin" || k.opens === "hideouts" || k.opens === "computer" || k.opens === "poker" || k.opens === "blackjack" || k.opens === "chest" || k.opens === "stash" ? hot : k.opens === "records" || k.opens === "beatshop" || k.opens === "jukebox" || isBoom ? hot : !noHint && (!me.seenDoor || hot); // the sink's drop and the record player's CD only show when you point at them or tap them // the sink flashes a little watering can for as long as the hint lasts
        const hint = k.opens === "ducky" ? dkImg : k.opens === "raffle" || k.opens === "elevator" ? ticketImg : k.opens === "streetbin" ? basketIconImg : k.opens === "records" || k.opens === "beatshop" || k.opens === "jukebox" || isBoom ? itemImg("cd") : k.opens === "sink" ? waterDropImg : k.opens === "furnish" || k.opens === "hideouts" || k.opens === "computer" ? toolIconImg : k.opens === "vending" ? basketIconImg : k.opens === "poker" || k.opens === "blackjack" || k.opens === "chest" || k.opens === "stash" ? pieceHint(f.kind) : hangerImg; // the toolbox, the hideout door and the hideout computer float the little house (the building bricks), the vending machine a basket, the bag a hanger
        if (showHanger && hint.complete && hint.naturalWidth) {
          const hs = k.opens === "sink" || k.opens === "records" || k.opens === "beatshop" || k.opens === "jukebox" || k.opens === "ducky" || k.opens === "raffle" || k.opens === "elevator" || isBoom ? (scale * (hot ? 34 : 28)) / Math.max(1, hint.naturalWidth) : scale * (k.opens === "furnish" || k.opens === "vending" || k.opens === "hideouts" || k.opens === "computer" ? (hot ? 0.95 : 0.8) : k.opens === "poker" || k.opens === "blackjack" || k.opens === "chest" || k.opens === "stash" ? (hot ? 0.95 : 0.8) : hot ? 0.5 : 0.42);
          const hw = hint.naturalWidth * hs;
          const hh = hint.naturalHeight * hs;
          const bob = Math.sin(now / 380) * 3 * scale;
          g.save();
          g.imageSmoothingEnabled = false;
          g.shadowColor = redGlow ? "rgba(255,90,80,0.7)" : "rgba(255,226,140,0.7)";
          g.shadowBlur = (hot ? 6 : 3) * scale;
          if (k.opens === "sink") g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(now / 320)); // the watering can flashes
          g.drawImage(hint, cx - hw / 2, b.y0 - hh - 2 * scale + bob, hw, hh);
          g.restore();
        }
        // while the hanger always shows, the click box covers it too
        return { id: "", ...b, y0: me.seenDoor || noHint || k.opens === "sink" || k.opens === "records" || k.opens === "poker" || k.opens === "blackjack" || k.opens === "chest" || isBoom ? b.y0 : b.y0 - 22 * scale, depth: f.x + f.y };
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

  /** The die over a head: it tumbles through faces a moment, then lands on the number the server threw (the pips and the digit beside it). */
  function drawDie(cx: number, bottomY: number, n: number, age: number): void {
    const u = Math.max(1, scale), s = 30 * u;
    const tumbling = age < DICE_TUMBLE_MS;
    const face = tumbling ? 1 + (Math.floor(age / 85) * 5 + 2) % 6 : n;
    const hop = tumbling ? -Math.abs(Math.sin(age / 95)) * 14 * u : -Math.max(0, 1 - (age - DICE_TUMBLE_MS) / 160) * 5 * u;
    const left = DICE_SHOW_MS - age;
    const x = cx - s / 2 - (tumbling ? 0 : 7 * u), y = bottomY - s - 6 * u + hop;
    g.save();
    g.globalAlpha = left < 800 ? Math.max(0, left / 800) : 1;
    if (tumbling) { g.translate(x + s / 2, y + s / 2); g.rotate(Math.sin(age / 70) * 0.5); g.translate(-(x + s / 2), -(y + s / 2)); }
    g.shadowColor = "rgba(0,0,0,0.5)"; g.shadowBlur = 5 * u;
    g.fillStyle = "#d32f2f"; // (red like the dice in the pocket)
    g.strokeStyle = tumbling ? "#5a0f0f" : "#ffd54a";
    g.lineWidth = (tumbling ? 2 : 3) * u / 1.5;
    g.beginPath(); g.roundRect(x, y, s, s, 6 * u); g.fill(); g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = "#fff";
    const PIPS: number[][][] = [[], [[1, 1]], [[0, 0], [2, 2]], [[0, 0], [1, 1], [2, 2]], [[0, 0], [2, 0], [0, 2], [2, 2]], [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]]];
    for (const [px, py] of PIPS[face]) { g.beginPath(); g.arc(x + s * (0.25 + px * 0.25), y + s * (0.25 + py * 0.25), s * 0.085, 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (!tumbling) { // the number itself, next to the die
      g.save();
      g.globalAlpha = left < 800 ? Math.max(0, left / 800) : 1;
      const pop = 1 + Math.max(0, 1 - (age - DICE_TUMBLE_MS) / 250) * 0.5;
      g.font = `900 ${Math.round(26 * u * pop)}px Verdana, sans-serif`;
      g.textAlign = "left"; g.textBaseline = "middle";
      g.lineWidth = 4 * u / 1.5; g.strokeStyle = "#000"; g.strokeText(String(n), x + s + 5 * u, y + s / 2);
      g.fillStyle = "#ffd54a"; g.fillText(String(n), x + s + 5 * u, y + s / 2);
      g.restore();
    }
  }

  /** a chat bubble over a player; `look` is what the Ducky machine sold them: a name colour, and moving or coloured text (the chat tool) */
  function drawBubble(text: string, name: string, cx: number, bottomY: number, alpha: number, look?: { nc?: string; fx?: string; fc?: string }): void {
    const fxName = look?.fx, fc = look?.fc, now = performance.now();
    const px = Math.round(12 * Math.max(1, scale) * (fxName === "big" ? 1.35 : 1));
    const font = `${px}px Verdana, 'Apple Color Emoji', sans-serif`;
    g.font = font;
    const maxW = 190 * Math.max(1, scale);
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const trial = cur ? cur + " " + w : w;
      if (measureWithEmoji(g, trial, px) > maxW && cur) { lines.push(cur); cur = w; } else cur = trial;
    }
    if (cur) lines.push(cur);
    const nameFont = `bold ${Math.round(12 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
    g.font = nameFont;
    const nameW = g.measureText(name + ": ").width;
    g.font = font;
    const lh = px * 1.25;
    const nlh = 15 * Math.max(1, scale);
    const w = Math.max(...lines.map((l) => measureWithEmoji(g, l, px))) + 18;
    const boxW = Math.max(w, nameW + 18);
    const boxH = lines.length * lh + nlh + 8;
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
    g.textBaseline = "top";
    g.font = nameFont;
    if (look?.nc) { g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 2.5; g.lineJoin = "round"; g.strokeText(name, x + 9, y + 5); g.fillStyle = look.nc; } else g.fillStyle = "#111";
    g.fillText(name, x + 9, y + 5);
    g.font = font;
    g.fillStyle = fc ?? "#111";
    if (fc) { g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 2; g.lineJoin = "round"; }
    lines.forEach((l, li) => {
      const ty = y + 5 + nlh + lh * li;
      if (!fxName && !fc) { fillTextWithEmoji(g, l, x + 9, ty, px); return; }
      if (fxName === "pulse") g.globalAlpha = alpha * (0.55 + 0.45 * Math.abs(Math.sin(now / 260)));
      let tx = x + 9;
      [...l].forEach((ch, i) => {
        let dx = 0, dy = 0;
        if (fxName === "shake") { dx = Math.sin(now / 37 + i * 7.1 + li) * 1.3 * Math.max(1, scale); dy = Math.cos(now / 41 + i * 5.3) * 1.3 * Math.max(1, scale); }
        else if (fxName === "wave") dy = Math.sin(now / 170 + i * 0.7) * 3 * Math.max(1, scale);
        if (fxName === "rainbow") g.fillStyle = `hsl(${(now / 7 + i * 28) % 360},90%,48%)`;
        if (fc) g.strokeText(ch, tx + dx, ty + dy);
        g.fillText(ch, tx + dx, ty + dy);
        tx += g.measureText(ch).width;
      });
    });
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
    drawShots(now);
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
    const cdf = def.furni.find((f) => f.kind === "jukebox") ?? def.furni.find((f) => isCdKind(f.kind)); // (the notes come out of the jukebox in the basement)
    if (cdf && notes.length) {
      const k = FURNI_KINDS[cdf.kind];
      const base = toScreen(iso(cdf.x + 0.5, cdf.y + 0.5));
      g.save();
      g.imageSmoothingEnabled = false; // (the notes are drawn small and blown up: a little pixelated)
      for (const n of notes) {
        const age = now - n.born;
        const f = age / n.life;
        const x = base.x + (n.ox + Math.sin(age / 240 + n.phase) * 9) * scale;
        const y = base.y - (k.height + 8) * scale - age * 0.045 * scale;
        g.globalAlpha = f < 0.15 ? f / 0.15 : Math.max(0, 1 - (f - 0.55) / 0.45);
        const spr = noteSprite(n.glyph);
        const size = spr.width * (1.45 + 0.25 * Math.sin(n.phase)) * Math.max(1, scale);
        g.drawImage(spr, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      }
      g.restore();
      g.globalAlpha = 1;
    }

    // emote glyphs floating above heads
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${Math.round(20 * Math.max(1, scale))}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
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
      if (age < 0) continue; // (not yet)
      const fsz = Math.round(16 * Math.max(1, scale) * (f.size ?? 1));
      g.font = `bold ${fsz}px Verdana, 'Apple Color Emoji', sans-serif`;
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
    for (let i = shotFx.length - 1; i >= 0; i--) {
      const fx = shotFx[i];
      if (!fx.fired) {
        fx.fired = true;
        if (active) playBang(0.75);
        const b = players.get(fx.to);
        if (b) { const f = feetOf(b, now); for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6; const sp = 0.05 + Math.random() * 0.1; particles.push({ x: f.x, y: f.y - 46 * scale, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, born: now + 200, life: 700 + Math.random() * 300 }); } }
      }
      if (now - fx.start > SHOT_MS + 200) shotFx.splice(i, 1);
    }
    if (shootBox && (!players.has(shootUid) || (selectedDef()?.useOnPlayer !== "shoot" && selectedDef()?.useOnPlayer !== "rocket"))) closeShootBox(); // (they left, or you put the gun away)
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
        if (!fx.fight) dropFx.push({ from: fx.from, to: fx.to, start: now });
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
      notes.push({ born: now, life: 2200, glyph: glyphsPool[Math.floor(Math.random() * 4)], ox: (Math.random() - 0.5) * 22, phase: Math.random() * 6, color: "#fff" });
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
    if (followMe && started && !furnishOn) {
      // slide the camera so you stay in the middle (a bit below it), but never so far that the room leaves the screen
      const mp = mine();
      if (mp) {
        const sw = stage.clientWidth, sh = stage.clientHeight;
        const f = feetOf(mp, now);
        let nx = offX + (sw / 2 - f.x), ny = offY + (sh * 0.56 - f.y);
        nx = Math.max(sw * 0.7 - floor.width * scale + floorOrigin.x * scale, Math.min(sw * 0.3 + floorOrigin.x * scale, nx));
        ny = Math.max(sh * 0.7 - floor.height * scale + floorOrigin.y * scale, Math.min(sh * 0.3 + floorOrigin.y * scale, ny));
        const ease = snapCam ? 1 : 0.14;
        snapCam = false;
        offX += (nx - offX) * ease;
        offY += (ny - offY) * ease;
      }
    }
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (roulette) { const sh = roulette.shake(now); if (sh.x || sh.y) g.translate(sh.x, sh.y); } // the shot shakes the picture a moment
    { const sh = pokerFx.shake(now); if (sh.x || sh.y) g.translate(sh.x, sh.y); }
    g.imageSmoothingEnabled = scale < 1;
    // (the picture is cleared in screen units: the bitmap is `dpr` times bigger, so with the browser zoomed out (dpr below 1) clearing canvas.width units left the right and bottom edge
    // uncleared, and everything drawn there piled up into dark bands and brighter corners)
    const clearW = canvas.width / dpr + 60, clearH = canvas.height / dpr + 60;
    g.clearRect(-30, -30, clearW, clearH);
    if (greenScreen) { g.fillStyle = "#00ff00"; g.fillRect(-30, -30, clearW, clearH); } // chroma green instead of the floor and the walls
    else { // the floor and walls picture: only the part that is on the screen (a very long room like the street is a huge picture, and drawing all of it, scaled, with most of it off the screen showed black banding in the corners in Chrome)
      const dx = offX - floorOrigin.x * scale, dy = offY - floorOrigin.y * scale;
      const vw = canvas.width / dpr, vh = canvas.height / dpr;
      const sx = Math.max(0, Math.floor(-dx / scale) - 1), sy = Math.max(0, Math.floor(-dy / scale) - 1);
      const ex = Math.min(floor.width, Math.ceil((vw - dx) / scale) + 1), ey = Math.min(floor.height, Math.ceil((vh - dy) / scale) + 1);
      if (ex > sx && ey > sy) g.drawImage(floor, sx, sy, ex - sx, ey - sy, dx + sx * scale, dy + sy * scale, (ex - sx) * scale, (ey - sy) * scale);
    }
    if (introUntil && performance.now() >= introUntil) {
      // eyes open: get out of bed and stand next to it
      const mp = mine();
      if (mp) { mp.lying = false; mp.from = mp.to = mp.dest = { ...sideTile() }; mp.dir = 2; }
      introUntil = 0;
    }
    // until you've opened the door once, it flashes to show you where to go
    const flashing = isOwnRoom && !me.seenDoor && !introUntil && started;
    const glow = Math.max(hoverDoor ? 1 : 0, flashing ? 0.55 + 0.45 * Math.sin(performance.now() / 280) : 0);
    if (!greenScreen && roomId !== STAGE_ID) doorBox = drawRoomDoor(g, def.doorX, toScreen, scale, glow, def.theme.style === "grime" || def.theme.style === "street");
    const doorHint = roomId === LOBBY_ID && lighterStage(me) === "door"; // the lighter job: the shop's door flashes until you have been through it
    extraDoorBoxes = greenScreen ? [] : (def.extraDoors ?? []).map((d, i) => {
      const flash = doorHint && d.to === SHOP_ID;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 240);
      if (flash) { g.save(); g.shadowColor = `rgba(255,214,40,${(0.8 + 0.2 * pulse).toFixed(2)})`; g.shadowBlur = (10 + 26 * pulse) * scale; }
      const box = drawRoomDoor(g, d.x, toScreen, scale, hoverExtra === i ? 1 : flash ? 2.2 * pulse : 0, d.yellow ? "yellow" : d.brown ? "brown" : def.theme.style === "grime");
      if (flash) g.restore();
      return { door: d, box };
    });

    if (!started) return;
    for (const p of players.values()) advance(p, now);
    { const mp = mine(); if (mp) finishSit(mp, now); }
    processPending(now);
    roulette?.update(now);
    tickMining(now);
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
    if (isBasement && !greenScreen) { // the red door behind 6ixty, on the wall like the other doors: tap it and he tells you what is coming
      const rb = drawRoomDoor(g, RED_DOOR_X, toScreen, scale, hoverObj?.kind === "reddoor" ? 1 : 0, "red");
      objs.push({ id: "reddoor", kind: "reddoor", x0: rb.x0, y0: rb.y0, x1: rb.x1, y1: rb.y1, depth: -1 });
    }
    const bubbles: Array<() => void> = [];
    const pieceBoxes: Array<{ id: string; box: Box; depth: number }> = [];

    const pieceDepth = (f: PlacedFurni): number =>
      // flat pieces lie on the floor, so they're drawn before (underneath) everyone else
      FURNI_KINDS[f.kind].flat ? -1
        : FURNI_KINDS[f.kind].nitro ? f.x + footprint(f.kind, f.dir).w - 1 + f.y + footprint(f.kind, f.dir).h - 1 + 0.25 // sprite pieces: their far tile, so people beside them stand in front
        : f.x + footprint(f.kind, f.dir).w + f.y + footprint(f.kind, f.dir).h - 1;
    /** A big sprite piece (a long or wide bed) is sorted by its far tile, so someone standing right in front of it would be drawn behind it: lift them above any piece they stand in front of. */
    const aboveFrontPieces = (depth: number, pos: Pt): number => {
      const tx = Math.floor(pos.x + 0.5), ty = Math.floor(pos.y + 0.5);
      for (const f of def.furni) {
        const k = FURNI_KINDS[f.kind];
        if (!k.nitro || k.flat) continue;
        const fp = footprint(f.kind, f.dir);
        const inX = tx >= f.x && tx < f.x + fp.w, inY = ty >= f.y && ty < f.y + fp.h;
        if ((inX && ty >= f.y + fp.h) || (inY && tx >= f.x + fp.w)) depth = Math.max(depth, (furniDepth.get(f.id) ?? pieceDepth(f)) + 0.1);
      }
      return depth;
    };

    // Pieces that stand on the floor are drawn far to near. Sorting by one number (the far tile's x+y) leaves ties and mistakes for big pieces, e.g. three long beds
    // set out diagonally: so every pair of footprints is compared properly (one that lies entirely behind the other on either axis is drawn first), and the depths are
    // nudged until the order agrees with that. People and small things keep sorting by their own numbers around them.
    const furniDepth = new Map<string, number>();
    {
      const solid = def.furni.filter((f) => { const k = FURNI_KINDS[f.kind]; return k.nitro && !k.flat && !k.wall; });
      const rect = (f: PlacedFurni) => { const fp = footprint(f.kind, f.dir); return { x0: f.x, x1: f.x + fp.w - 1, y0: f.y, y1: f.y + fp.h - 1 }; };
      const behind = (a: PlacedFurni, b: PlacedFurni): boolean => { // a must be drawn before b
        const A = rect(a), B = rect(b);
        const aBack = A.x1 < B.x0 || A.y1 < B.y0, bBack = B.x1 < A.x0 || B.y1 < A.y0;
        return aBack && !bBack;
      };
      for (const f of solid) furniDepth.set(f.id, pieceDepth(f));
      for (let pass = 0; pass < solid.length; pass++) {
        let changed = false;
        for (const a of solid) for (const b of solid) {
          if (a === b || !behind(a, b)) continue;
          const da = furniDepth.get(a.id)!, db = furniDepth.get(b.id)!;
          if (db <= da) { furniDepth.set(b.id, da + 0.001); changed = true; }
        }
        if (!changed) break;
      }
      for (const f of solid) { // a small piece on a table top is drawn just after that table
        const t = tableUnder(f);
        if (t) furniDepth.set(f.id, Math.max(furniDepth.get(f.id) ?? 0, (furniDepth.get(t.id) ?? 0) + 0.3));
      }
    }

    for (const f of def.furni) {
      list.push({
        depth: furniDepth.get(f.id) ?? pieceDepth(f),
        draw: () => {
          const box = drawFurni(f, now);
          if (box && isDisplayPiece(f.id) && !furnishOn) drawPriceTag(priceOf(f.kind), box.x1, box.y1);
          if (box && !furnishOn && RAFFLE_EFFECTS[f.kind]) drawRareShine(f, box, now); // the rare pieces (the raffle's prizes) shine wherever they stand: in the shop and in your own room
          if (box && furnishOn) pieceBoxes.push({ id: f.id, box, depth: box.depth });
          if (box && FURNI_KINDS[f.kind].seat && !isDisplayPiece(f.id)) objs.push({ ...box, id: f.id, kind: f.kind });
          if (box && (FURNI_KINDS[f.kind].states?.length ?? 0) > 1 && !isDisplayPiece(f.id)) objs.push({ ...box, id: f.id, kind: f.kind }); // a piece you can tap to change
          if (box && isOwnRoom && f.id === BED_ID) objs.push({ ...box, id: f.id, kind: "bed" });
          // the bag of clothes can be clicked in your own room only
          if (box && (INTERACTIVE_KINDS.has(f.kind) || isBodyBag(f.kind) || (FURNI_KINDS[f.kind].opens && (isHome || FURNI_KINDS[f.kind].opens === "sink" || FURNI_KINDS[f.kind].opens === "pets" || FURNI_KINDS[f.kind].opens === "poker" || FURNI_KINDS[f.kind].opens === "blackjack" || FURNI_KINDS[f.kind].opens === "beatshop" || FURNI_KINDS[f.kind].opens === "cdpress" || FURNI_KINDS[f.kind].opens === "elevator" || FURNI_KINDS[f.kind].opens === "jukebox" || FURNI_KINDS[f.kind].opens === "stash" || FURNI_KINDS[f.kind].opens === "streetbin" || FURNI_KINDS[f.kind].opens === "hits" || FURNI_KINDS[f.kind].opens === "board" || FURNI_KINDS[f.kind].opens === "hideouts" || FURNI_KINDS[f.kind].opens === "shop" || FURNI_KINDS[f.kind].opens === "vending" || FURNI_KINDS[f.kind].opens === "records" || FURNI_KINDS[f.kind].opens === "poster" || FURNI_KINDS[f.kind].opens === "ducky" || FURNI_KINDS[f.kind].opens === "raffle")) || FURNI_KINDS[f.kind].plant || isDisplayPiece(f.id))) objs.push({ ...box, id: f.id, kind: f.kind });
        },
      });
    }

    if (!furnishOn) {
      for (const f of def.furni) {
        if (f.kind !== "rchair") continue;
        list.push({ depth: (furniDepth.get(f.id) ?? pieceDepth(f)) + 1.8, draw: () => { drawNitroFurni(g, f.kind, f.x, f.y, f.dir ?? 0, toScreen, scale, 1, true, undefined, "front"); } });
      }
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
              g.font = `bold ${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
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
          if (simg) {
            const flash = lighterStage(me) === "give"; // the lighter job: he flashes until you have given him the lighter
            const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 240);
            g.save();
            if (flash) { g.shadowColor = `rgba(255,214,40,${(0.8 + 0.2 * pulse).toFixed(2)})`; g.shadowBlur = (10 + 26 * pulse) * scale; }
            g.drawImage(simg, sf.x - (32 + padOf(simg).x) * scale, sf.y - (FEET_Y + padOf(simg).y) * scale, simg.width * scale, simg.height * scale);
            g.restore();
          }
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
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

    if (isMines) {
      // 6ixty down here too: not a player, only drawn; he sells the wood and buys your iron
      const look = sixtyLook();
      const sopts = { figure: look.figure, dir: MINES_SIXTY.dir, headDir: MINES_SIXTY.dir, actions: ["std"], gesture: "std", frame: 0 };
      let simg = getCached(sopts);
      if (!simg) { renderAvatar(sopts); simg = sixtyLast; } else sixtyLast = simg;
      const sw = iso(MINES_SIXTY.x, MINES_SIXTY.y);
      const sf = toScreen({ x: sw.x, y: sw.y + TILE_H / 2 });
      objs.push({ id: "minessixty", kind: "minesixty", x0: sf.x - 22 * scale, x1: sf.x + 22 * scale, y0: sf.y - FEET_Y * scale, y1: sf.y + 8 * scale, depth: MINES_SIXTY.x + MINES_SIXTY.y });
      const sHot = hoverObj?.kind === "minesixty" || pending?.type === "minessixty";
      const pulse = 0.5 + 0.5 * Math.sin(now / 450);
      list.push({
        depth: MINES_SIXTY.x + MINES_SIXTY.y + 0.5,
        draw: () => {
          const cx = sf.x, cy = sf.y - 48 * scale, r = 54 * scale * (sHot ? 1.2 : 1);
          g.save();
          const halo = g.createRadialGradient(cx, cy, 3 * scale, cx, cy, r);
          const a = 0.1 + 0.05 * pulse + (sHot ? 0.14 : 0);
          halo.addColorStop(0, `rgba(255,214,70,${a.toFixed(2)})`);
          halo.addColorStop(1, "rgba(255,200,40,0)");
          g.fillStyle = halo;
          g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
          g.restore();
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath(); g.ellipse(sf.x, sf.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2); g.fill();
          if (simg) g.drawImage(simg, sf.x - (32 + padOf(simg).x) * scale, sf.y - (FEET_Y + padOf(simg).y) * scale, simg.width * scale, simg.height * scale);
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
          const tw = g.measureText(SIXTY.name).width + 10;
          g.fillStyle = sHot ? "rgba(120,80,10,0.9)" : "rgba(0,0,0,0.55)";
          g.beginPath(); g.roundRect(sf.x - tw / 2, sf.y + 7 * scale, tw, 14 * Math.max(1, scale), 5); g.fill();
          g.fillStyle = "#ff3b3b";
          g.textBaseline = "top"; g.textAlign = "center";
          g.fillText(SIXTY.name, sf.x, sf.y + 9 * scale);
          g.textAlign = "start";
        },
      });
    }

    if (streetsApi) streetsApi.draw({ g, list, objs, bubbles, now, scale, toScreen, iso, tileHeight: TILE_H, hoverId: hoverObj?.id ?? null });

    const landlordHere = isShop && [...players.values()].some((q) => q.npc); // the admin is standing there as the landlord: no second one
    if (isShop && !landlordHere) {
      // the landlord: not a player, only drawn here, behind his counter. He glows like the other things you can use, and brighter when you point at him
      const talking = !!landlordBubble && landlordBubble.until > now;
      const lopts = { figure: LANDLORD.figure, dir: LANDLORD.dir, headDir: LANDLORD.dir, actions: ["std"], gesture: talking ? "spk" : "std", frame: talking ? Math.floor(now / 140) % 2 : 0 };
      let limg = getCached(lopts);
      if (!limg) { renderAvatar(lopts); limg = landlordLast; } else landlordLast = limg;
      const lw = iso(LANDLORD.x, LANDLORD.y);
      const lf = toScreen({ x: lw.x, y: lw.y + TILE_H / 2 });
      objs.push({ id: LANDLORD.id, kind: "landlord", x0: lf.x - 22 * scale, x1: lf.x + 22 * scale, y0: lf.y - FEET_Y * scale, y1: lf.y + 8 * scale, depth: LANDLORD.x + LANDLORD.y });
      const lHot = hoverObj?.kind === "landlord" || pending?.type === "landlord";
      const pulse = 0.5 + 0.5 * Math.sin(now / 450);
      list.push({
        depth: LANDLORD.x + LANDLORD.y + 0.5,
        draw: () => {
          const cx = lf.x, cy = lf.y - 48 * scale, r = 54 * scale * (lHot ? 1.2 : 1);
          g.save();
          const halo = g.createRadialGradient(cx, cy, 3 * scale, cx, cy, r);
          const a = 0.12 + 0.05 * pulse + (lHot ? 0.14 : 0);
          halo.addColorStop(0, `rgba(255,214,70,${a.toFixed(2)})`);
          halo.addColorStop(0.55, `rgba(255,200,40,${(a * 0.6).toFixed(2)})`);
          halo.addColorStop(1, "rgba(255,200,40,0)");
          g.fillStyle = halo;
          g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
          g.restore();
          if (limg) {
            g.drawImage(limg, lf.x - (32 + padOf(limg).x) * scale, lf.y - (FEET_Y + padOf(limg).y) * scale, limg.width * scale, limg.height * scale);
            if (lHot) {
              g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.14 + 0.05 * pulse;
              g.drawImage(limg, lf.x - (32 + padOf(limg).x) * scale, lf.y - (FEET_Y + padOf(limg).y) * scale, limg.width * scale, limg.height * scale);
              g.restore();
            }
          }
          if (lHot && toolIconImg.complete && toolIconImg.naturalWidth) { // the little house over his head (when you point at him or tap him): he is the one for rooms
            const hs = scale * (lHot ? 0.95 : 0.8), hw = toolIconImg.naturalWidth * hs, hh = toolIconImg.naturalHeight * hs;
            g.save();
            g.imageSmoothingEnabled = false;
            g.shadowColor = "rgba(255,226,140,0.7)";
            g.shadowBlur = (lHot ? 6 : 3) * scale;
            g.drawImage(toolIconImg, lf.x - hw / 2, lf.y - (FEET_Y + 6) * scale - hh + Math.sin(now / 380) * 3 * scale, hw, hh);
            g.restore();
          }
        },
      });
      if (landlordBubble && landlordBubble.until > now) {
        const left = landlordBubble.until - now;
        const lb = landlordBubble;
        bubbles.push(() => drawBubble(lb.text, LANDLORD.name, lf.x, lf.y - (FEET_Y + 4) * scale, left < 800 ? left / 800 : 1));
      }
    }

    if (roomId === LOBBY_ID) {
      // the hideout landlord: not a player, only drawn here, beside the hideout door at the far end of the basement. A yellow glow like the other landlord
      const talking = !!hlandlordBubble && hlandlordBubble.until > now;
      const hopts = { figure: HIDEOUT_LANDLORD.figure, dir: HIDEOUT_LANDLORD.dir, headDir: HIDEOUT_LANDLORD.dir, actions: ["std"], gesture: talking ? "spk" : "std", frame: talking ? Math.floor(now / 140) % 2 : 0 };
      let himg = getCached(hopts);
      if (!himg) { renderAvatar(hopts); himg = hlandlordLast; } else hlandlordLast = himg;
      const hw = iso(HIDEOUT_LANDLORD.x, HIDEOUT_LANDLORD.y);
      const hf = toScreen({ x: hw.x, y: hw.y + TILE_H / 2 });
      objs.push({ id: HIDEOUT_LANDLORD.id, kind: "hlandlord", x0: hf.x - 22 * scale, x1: hf.x + 22 * scale, y0: hf.y - FEET_Y * scale, y1: hf.y + 8 * scale, depth: HIDEOUT_LANDLORD.x + HIDEOUT_LANDLORD.y });
      const hHot = hoverObj?.kind === "hlandlord" || pending?.type === "hlandlord";
      const hpulse = 0.5 + 0.5 * Math.sin(now / 450);
      list.push({
        depth: HIDEOUT_LANDLORD.x + HIDEOUT_LANDLORD.y + 0.5,
        draw: () => {
          const cx = hf.x, cy = hf.y - 48 * scale, r = 54 * scale * (hHot ? 1.2 : 1);
          g.save();
          const halo = g.createRadialGradient(cx, cy, 3 * scale, cx, cy, r);
          const a = 0.12 + 0.05 * hpulse + (hHot ? 0.14 : 0);
          halo.addColorStop(0, `rgba(255,214,70,${a.toFixed(2)})`);
          halo.addColorStop(0.55, `rgba(255,200,40,${(a * 0.6).toFixed(2)})`);
          halo.addColorStop(1, "rgba(255,200,40,0)");
          g.fillStyle = halo;
          g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath(); g.ellipse(hf.x, hf.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2); g.fill();
          g.restore();
          if (himg) {
            g.drawImage(himg, hf.x - (32 + padOf(himg).x) * scale, hf.y - (FEET_Y + padOf(himg).y) * scale, himg.width * scale, himg.height * scale);
            if (hHot) {
              g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.14 + 0.05 * hpulse;
              g.drawImage(himg, hf.x - (32 + padOf(himg).x) * scale, hf.y - (FEET_Y + padOf(himg).y) * scale, himg.width * scale, himg.height * scale);
              g.restore();
            }
          }
        },
      });
      if (hlandlordBubble && hlandlordBubble.until > now) {
        const left = hlandlordBubble.until - now;
        const hb = hlandlordBubble;
        bubbles.push(() => drawBubble(hb.text, HIDEOUT_LANDLORD.name, hf.x, hf.y - (FEET_Y + 4) * scale, left < 800 ? left / 800 : 1));
      }
    }

    if (isShop) {
      // pets bih: not a player, only drawn here, in the shop room where the pet basket was. A yellow glow like the landlords
      const talking = !!pmBubble && pmBubble.until > now;
      const popts = { figure: PET_MERCHANT.figure, dir: PET_MERCHANT.dir, headDir: PET_MERCHANT.dir, actions: ["std"], gesture: talking ? "spk" : "std", frame: talking ? Math.floor(now / 140) % 2 : 0 };
      let pimg = getCached(popts);
      if (!pimg) { renderAvatar(popts); pimg = pmLast; } else pmLast = pimg;
      const pw = iso(PET_MERCHANT.x, PET_MERCHANT.y);
      const pf = toScreen({ x: pw.x, y: pw.y + TILE_H / 2 });
      objs.push({ id: PET_MERCHANT.id, kind: "pmerchant", x0: pf.x - 22 * scale, x1: pf.x + 22 * scale, y0: pf.y - FEET_Y * scale, y1: pf.y + 8 * scale, depth: PET_MERCHANT.x + PET_MERCHANT.y });
      const pHot = hoverObj?.kind === "pmerchant" || pending?.type === "pmerchant";
      const ppulse = 0.5 + 0.5 * Math.sin(now / 450);
      list.push({
        depth: PET_MERCHANT.x + PET_MERCHANT.y + 0.5,
        draw: () => {
          const cx = pf.x, cy = pf.y - 48 * scale, r = 54 * scale * (pHot ? 1.2 : 1);
          g.save();
          const halo = g.createRadialGradient(cx, cy, 3 * scale, cx, cy, r);
          const a = 0.12 + 0.05 * ppulse + (pHot ? 0.14 : 0);
          halo.addColorStop(0, `rgba(255,214,70,${a.toFixed(2)})`);
          halo.addColorStop(0.55, `rgba(255,200,40,${(a * 0.6).toFixed(2)})`);
          halo.addColorStop(1, "rgba(255,200,40,0)");
          g.fillStyle = halo;
          g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath(); g.ellipse(pf.x, pf.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2); g.fill();
          g.restore();
          if (pimg) {
            g.drawImage(pimg, pf.x - (32 + padOf(pimg).x) * scale, pf.y - (FEET_Y + padOf(pimg).y) * scale, pimg.width * scale, pimg.height * scale);
            if (pHot) {
              g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.14 + 0.05 * ppulse;
              g.drawImage(pimg, pf.x - (32 + padOf(pimg).x) * scale, pf.y - (FEET_Y + padOf(pimg).y) * scale, pimg.width * scale, pimg.height * scale);
              g.restore();
            }
          }
          // the white bunny floats over her head while you point at her or walk to her (the way the CD floats over the record player)
          const bunny = petSheet("bunnyeaster", 0);
          if (pHot && bunny) {
            pmIcon ??= petPreview(bunny, 48);
            const hw = 48 * scale, hh = (pmIcon.height / pmIcon.width) * hw, bob = Math.sin(now / 380) * 3 * scale;
            g.save();
            g.imageSmoothingEnabled = false;
            g.shadowColor = "rgba(255,226,140,0.7)"; g.shadowBlur = 6 * scale;
            g.drawImage(pmIcon, pf.x - hw / 2, pf.y - (FEET_Y + 4) * scale - hh + bob, hw, hh);
            g.restore();
          }
        },
      });
      if (pmBubble && pmBubble.until > now) {
        const left = pmBubble.until - now;
        const pb = pmBubble;
        bubbles.push(() => drawBubble(pb.text, PET_MERCHANT.name, pf.x, pf.y - (FEET_Y + 4) * scale, left < 800 ? left / 800 : 1));
      }
    }

    // the love booth: two players sitting on it get a verdict (a percentage over the pair) each time somebody taps it to change its look
    for (const f of def.furni) {
      if (f.kind !== "f_randomizer") continue;
      const st = f.st ?? 0;
      const seen = loveSeen.get(f.id);
      if (!seen) loveSeen.set(f.id, { st, at: -1e9 });
      else if (seen.st !== st) { seen.st = st; seen.at = now; }
      const ls = loveSeen.get(f.id)!;
      if (now - ls.at > 8000) continue;
      const fp = footprint(f.kind, f.dir);
      const seated = [...players.values()].filter((q) => { const t = currentTile(q); return q.sit && !q.sleeper && t.x >= f.x && t.x < f.x + fp.w && t.y >= f.y && t.y < f.y + fp.h; })
        .sort((a, b) => currentTile(a).x + currentTile(a).y - (currentTile(b).x + currentTile(b).y) || a.uid.localeCompare(b.uid));
      for (let i = 0; i + 1 < seated.length; i += 2) {
        const a = seated[i], b = seated[i + 1];
        const fa = feetOf(a, now), fb = feetOf(b, now);
        const pct = lovePercent(a.uid, b.uid, st);
        const left = 8000 - (now - ls.at);
        bubbles.push(() => drawBubble(`💘 ${pct}%`, `${a.name} + ${b.name}`, (fa.x + fb.x) / 2, Math.min(fa.y, fb.y) - (FEET_Y + 26 + Math.sin(now / 260) * 3) * scale, left < 800 ? left / 800 : 1));
      }
    }

    // pets: each one walks behind its owner (worked out here, the same for everybody who sees it: all it needs is the owner's position and `pet` in their presence)
    for (const p of players.values()) {
      if (!p.pet || p.sleeper || p.lying) { petStates.delete(p.uid); continue; }
      const [type, palText] = p.pet.split(":");
      const petFx = parsePetLook(p.pet)?.fx;
      const sheet = petSheet(type, Number(palText) || 0);
      if (!sheet) continue;
      const own = posOf(p, now);
      let st = petStates.get(p.uid);
      if (!st || st.look !== p.pet) { st = { look: p.pet, x: Math.min(def.w - 1, own.x + 1), y: Math.min(def.h - 1, own.y + 1), dir: 2, moving: false, t: now, still: now }; petStates.set(p.uid, st); }
      const dt = Math.min(0.12, (now - st.t) / 1000);
      st.t = now;
      const dx = own.x - st.x, dy = own.y - st.y, dist = Math.hypot(dx, dy);
      if (dist > 8) { st.x = own.x; st.y = own.y; st.moving = false; }
      else if (dist > 1.7 || (st.moving && dist > 1.2)) {
        const speed = ((p.fast && serverNow() < p.fast ? (p.fastMult ?? 2) : 1) * 2.8 + Math.max(0, dist - 3) * 1.2) * dt;
        st.x += (dx / dist) * Math.min(speed, dist); st.y += (dy / dist) * Math.min(speed, dist);
        st.dir = dirOf({ x: 0, y: 0 }, { x: Math.abs(dx) > 0.25 ? dx : 0, y: Math.abs(dy) > 0.25 ? dy : 0 });
        st.moving = true; st.still = now;
      } else st.moving = false;
      st.x = Math.max(0, Math.min(def.w - 1, st.x)); st.y = Math.max(0, Math.min(def.h - 1, st.y));
      const idle = now - st.still;
      const pose = st.moving ? "mv" : idle > 25_000 && sheet.meta.rows.lay ? "lay" : idle > 7_000 && sheet.meta.rows.sit ? "sit" : "std";
      const ps = toScreen({ x: iso(st.x, st.y).x, y: iso(st.x, st.y).y + TILE_H / 2 });
      const dirNow = st.dir, step = Math.floor(now / 130);
      list.push({
        depth: st.x + st.y + 0.45,
        draw: () => {
          g.fillStyle = "rgba(0,0,0,0.16)";
          g.beginPath(); g.ellipse(ps.x, ps.y, Math.max(6, sheet.meta.w * 0.22) * scale, 3.2 * scale, 0, 0, Math.PI * 2); g.fill();
          if (petFx) drawFx(g, canonFx(petFx), true, ps.x, ps.y, scale * 0.42, dirNow, now); // (an unusual pet: its effect, smaller, behind it...)
          drawPet(g, sheet, pose, dirNow, step, ps.x, ps.y, scale);
          if (petFx) drawFx(g, canonFx(petFx), false, ps.x, ps.y, scale * 0.42, dirNow, now); // (...and in front)
        },
      });
      if (p.uid === me.uid) objs.push({ id: `pet:${p.uid}`, kind: "mypet", x0: ps.x - sheet.meta.ox * scale, x1: ps.x - sheet.meta.ox * scale + sheet.meta.w * scale, y0: ps.y - sheet.meta.oy * scale, y1: ps.y - sheet.meta.oy * scale + sheet.meta.h * scale, depth: st.x + st.y + 0.45 });
    }

    if (roomId === LOBBY_ID && bagVisit !== null) {
      // bagmand: not a player, only drawn here, next to the roulette table, and only in his hour. He glows green like the other things you can use
      const talking = !!bagmanBubble && bagmanBubble.until > now;
      const bopts = { figure: BAGMAN.figure, dir: BAGMAN.dir, headDir: BAGMAN.dir, actions: ["std"], gesture: talking ? "spk" : "std", frame: talking ? Math.floor(now / 140) % 2 : 0 };
      let bimg = getCached(bopts);
      if (!bimg) { renderAvatar(bopts); bimg = bagmanLast; } else bagmanLast = bimg;
      const bw = iso(BAGMAN.x, BAGMAN.y);
      const bf = toScreen({ x: bw.x, y: bw.y + TILE_H / 2 });
      objs.push({ id: BAGMAN.id, kind: "bagman", x0: bf.x - 22 * scale, x1: bf.x + 22 * scale, y0: bf.y - FEET_Y * scale, y1: bf.y + 8 * scale, depth: BAGMAN.x + BAGMAN.y });
      const bHot = hoverObj?.kind === "bagman" || pending?.type === "bagman";
      const bpulse = 0.5 + 0.5 * Math.sin(now / 450);
      list.push({
        depth: BAGMAN.x + BAGMAN.y + 0.5,
        draw: () => {
          const cx = bf.x, cy = bf.y - 48 * scale, r = 54 * scale * (bHot ? 1.2 : 1);
          g.save();
          const halo = g.createRadialGradient(cx, cy, 3 * scale, cx, cy, r);
          const a = 0.12 + 0.05 * bpulse + (bHot ? 0.14 : 0);
          halo.addColorStop(0, `rgba(90,220,120,${a.toFixed(2)})`);
          halo.addColorStop(0.55, `rgba(60,200,90,${(a * 0.6).toFixed(2)})`);
          halo.addColorStop(1, "rgba(60,200,90,0)");
          g.fillStyle = halo;
          g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath(); g.ellipse(bf.x, bf.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2); g.fill();
          g.restore();
          if (bimg) {
            g.drawImage(bimg, bf.x - (32 + padOf(bimg).x) * scale, bf.y - (FEET_Y + padOf(bimg).y) * scale, bimg.width * scale, bimg.height * scale);
            if (bHot) {
              g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.14 + 0.05 * bpulse;
              g.drawImage(bimg, bf.x - (32 + padOf(bimg).x) * scale, bf.y - (FEET_Y + padOf(bimg).y) * scale, bimg.width * scale, bimg.height * scale);
              g.restore();
            }
          }
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
          const tw = g.measureText(BAGMAN.name).width + 10;
          g.fillStyle = bHot ? "rgba(20,100,40,0.9)" : "rgba(0,0,0,0.55)";
          g.beginPath(); g.roundRect(bf.x - tw / 2, bf.y + 7 * scale, tw, 14 * Math.max(1, scale), 5); g.fill();
          g.fillStyle = "#7dff9b";
          g.textBaseline = "top"; g.textAlign = "center";
          g.fillText(BAGMAN.name, bf.x, bf.y + 9 * scale);
          g.textAlign = "start";
        },
      });
      if (bagmanBubble && bagmanBubble.until > now) {
        const left = bagmanBubble.until - now;
        const bb = bagmanBubble;
        bubbles.push(() => drawBubble(bb.text, BAGMAN.name, bf.x, bf.y - (FEET_Y + 4) * scale, left < 800 ? left / 800 : 1));
      }
    }

    furniBoxes = pieceBoxes;
    if (roulette && !furnishOn) {
      list.push({ depth: -0.5, draw: () => roulette!.drawFloor(g, now) }); // the blood on the floor is under everything
      list.push({ depth: 1000, draw: () => roulette!.drawGun(g, now) }); // the gun is over the table and the players
    }
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
        const ax = c.x + (LAY_DX - padOf(limg).x) * scale;
        const ay = c.y + (LAY_DY - padOf(limg).y) * scale;
        const lw = (limg?.width ?? 110) * scale;
        const lh = (limg?.height ?? 64) * scale;
        // clickable area = just the sleeping body (the picture itself has a lot of empty padding around it)
        boxes.push({ id: p.uid, x0: ax + 66 * scale, x1: ax + 166 * scale, y0: ay + 38 * scale, y1: ay + 98 * scale, depth: dh.x + dh.y + 3 });
        list.push({
          depth: p.lying ? (furniDepth.get(bedPiece().id) ?? pieceDepth(bedPiece())) + 0.35 : dh.x + dh.y + 0.6, // just after the bed itself, whatever its size
          draw: () => {
            if (limg) {
              g.drawImage(limg, ax, ay, lw, lh);
              if (lflash > 0.02) g.drawImage(redWash(limg, lflash), ax, ay, lw, lh);
            }
            const targeted = hoverPlayer?.uid === p.uid && p.uid !== me.uid && selectedDef()?.useOnPlayer === "stab";
            g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
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
      if (img && roulette) img = roulette.imageFor(p.uid, img, opts, now); // (the dead player at the roulette table has no head)
      if (img) img = pokerFx.imageFor(p.uid, img, opts, now); // (and the one who shot themselves after going bust at poker)
      if (img && p.ghost) img = dimmed(img); // (a player who dropped out of a roulette game: a little darker)
      const feet = feetOf(p, now);
      if (streetsApi && p.uid !== me.uid && !p.npc && !p.sleeper && (hoverPlayer?.uid === p.uid || streetsApi.target() === p.uid || streetsApi.foe() === p.uid)) { // on the street the player under the pointer, the one you are going for, and the one you are in a fight with stand on a red tile
        const tw = (TILE_W / 2) * scale, th = (TILE_H / 2) * scale, pulse = 0.5 + 0.5 * Math.sin(now / 350);
        list.push({ depth: -0.4, draw: () => {
          g.beginPath(); g.moveTo(feet.x, feet.y - th); g.lineTo(feet.x + tw, feet.y); g.lineTo(feet.x, feet.y + th); g.lineTo(feet.x - tw, feet.y); g.closePath();
          g.fillStyle = `rgba(220,30,30,${(0.45 + 0.15 * pulse).toFixed(2)})`; g.fill();
          g.strokeStyle = "rgba(255,70,70,.85)"; g.lineWidth = Math.max(1, scale * 1.5); g.stroke();
        } });
      }

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

      boxes.push({ id: p.uid, x0: feet.x - 22 * scale, x1: feet.x + 22 * scale, y0: feet.y - FEET_Y * scale + (roomId === STAGE_ID ? lift : 0), y1: feet.y + 8 * scale + (roomId === STAGE_ID ? lift : 0), depth: pos.x + pos.y });
      list.push({
        depth: aboveFrontPieces(pos.x + pos.y + 0.5 + (p.sit && !isMoving(p, now) ? 1.2 : 0) + (p.uid === me.uid ? 0.02 : 0), pos), // (you stand on top of anyone on your tile)
        draw: () => {
          g.fillStyle = "rgba(0,0,0,0.18)";
          g.beginPath();
          g.ellipse(feet.x + lunge.x, feet.y + lunge.y, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
          g.fill();
          // facing away from the camera (up-right, up-left, up) the knife hand is behind the body: draw the knife first so the body covers it
          const knifeOut = !isMoving(p, now) && !p.emote && !smoking && holdsKnife(p, now);
          const knifeBehind = knifeOut && (p.dir === 6 || p.dir === 7 || p.dir === 0);
          const skinKnife = p.uid === me.uid && selectedDef()?.id === "knife_tt"; // (the karambit skin: you see it in your own hand)
          if (knifeBehind) drawKnifeInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, skinKnife);
          const gunOut = !knifeOut && !isMoving(p, now) && !p.emote && !smoking && holdsGun(p);
          const gunBehind = gunOut && (p.dir === 6 || p.dir === 7 || p.dir === 0);
          if (gunBehind) drawGunInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, selectedDef()?.useOnPlayer === "rocket");
          const cupOut = !knifeOut && !gunOut && !isMoving(p, now) && !p.emote && !smoking && (holdsCup(p) || holdsDice(p));
          const heldId = holdsCup(p) ? "codeine" : "dice", heldSize = holdsCup(p) ? 26 : 18;
          const cupBehind = cupOut && (p.dir === 6 || p.dir === 7 || p.dir === 0);
          if (cupBehind) drawCupInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, heldId, heldSize);
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
          const vapeOn = !!p.vape && serverNow() < p.vape; // (a puff-bar cloud: the Raincloud effect over them, and vapour)
          const aura = glowing ? null : auraOf(p, now);
          if (img) {
            const ax = feet.x + lunge.x - (32 + padOf(img).x) * scale;
            const ay = feet.y + lunge.y + lift - (FEET_Y + padOf(img).y) * scale;
            pokerFx.drawFloor(g, p.uid, { x: feet.x + lunge.x, y: feet.y + lunge.y + lift }, now);
            const unusual = p.un ? unusualOf(p.un) : undefined;
            if (unusual) drawFx(g, unusual.effect, true, feet.x + lunge.x, feet.y + lunge.y + lift, scale, p.dir, now); // (an unusual: the part of its effect that goes behind)
            if (glowing) { g.save(); g.shadowColor = `rgba(255,214,90,${(0.75 + 0.25 * pulse).toFixed(2)})`; g.shadowBlur = (10 + 18 * pulse) * scale; }
            else if (chemOn) { g.save(); g.shadowColor = `hsla(${Math.floor(now / 2.5) % 360},100%,60%,0.95)`; g.shadowBlur = (14 + 14 * Math.abs(Math.sin(now / 90))) * scale; }
            else if (aura) { g.save(); g.shadowColor = aura.glow; g.shadowBlur = aura.blur; }
            g.drawImage(img, ax, ay, img.width * scale, img.height * scale);
            if (glowing || chemOn || aura) g.restore();
            if (aura) drawAuraParticles(aura, feet.x + lunge.x, feet.y + lunge.y + lift, now);
            if (unusual) drawFx(g, unusual.effect, false, feet.x + lunge.x, feet.y + lunge.y + lift, scale, p.dir, now); // (and the part in front)
            if (vapeOn) {
              for (let i = 0; i < 6; i++) { // vapour rolls off the head: soft blue-white puffs
                const t = (now / 1800 + i / 6) % 1;
                const px = feet.x + lunge.x + Math.sin(t * 7 + i * 1.9) * (8 + t * 16) * scale;
                const py = feet.y + lunge.y + lift - (40 + t * 46) * scale;
                const pr = (3 + t * 9) * scale;
                pxBlob(px, py, pr + pxCell(), `rgba(110,170,210,${(0.35 * (1 - t)).toFixed(3)})`);
                pxBlob(px, py, pr, `rgba(236,248,255,${(0.75 * (1 - t)).toFixed(3)})`);
              }
            }
            if (chemOn) { // smoke pours off you
              for (let i = 0; i < 10; i++) {
                const t = (now / 1400 + i / 10) % 1;
                const px = feet.x + lunge.x + Math.sin(t * 9 + i * 2.1) * (10 + t * 14) * scale;
                const py = feet.y + lunge.y + lift - (14 + t * 70) * scale;
                const pr = (4 + t * 10) * scale;
                pxBlob(px, py, pr + pxCell(), `rgba(80,84,96,${(0.55 * (1 - t)).toFixed(3)})`); // the dark edge, then the light puff on top
                pxBlob(px, py, pr, `rgba(244,244,248,${(0.85 * (1 - t)).toFixed(3)})`);
              }
            }
            if (flash > 0.02) g.drawImage(redWash(img, flash), ax, ay, img.width * scale, img.height * scale);
            if (roulette) roulette.drawBody(g, p.uid, { x: feet.x + lunge.x, y: feet.y + lunge.y + lift }, now);
            pokerFx.drawBody(g, p.uid, { x: feet.x + lunge.x, y: feet.y + lunge.y + lift }, now);
            pokerFx.drawGun(g, p.uid, { x: feet.x + lunge.x, y: feet.y + lunge.y + lift }, p.dir, now);
          }
          if (smoking) drawCigarette(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, now, p.smokeKind);
          if (smoking && p.smokeKind === "hashjoint") drawHearts(feet.x + lunge.x, feet.y + lunge.y + lift, now); // the hash joint: hearts float up over the head
          if (knifeOut && !knifeBehind) drawKnifeInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, skinKnife);
          if (gunOut && !gunBehind) drawGunInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, selectedDef()?.useOnPlayer === "rocket");
          if (cupOut && !cupBehind) drawCupInHand(feet.x + lunge.x, feet.y + lunge.y + lift, p.dir, heldId, heldSize);
          // name plate (highlighted while it's a valid stab target)
          const targeted = hoverPlayer?.uid === p.uid && p.uid !== me.uid && (selectedDef()?.useOnPlayer === "stab" || selectedDef()?.useOnPlayer === "shoot" || selectedDef()?.useOnPlayer === "rocket");
          g.font = `${Math.round(10 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
          const shownLabel = p.chud && serverNow() < p.chud ? "chud" : p.name; // the plain chud joint: your name reads "chud" for a while
          const tw = g.measureText(shownLabel).width + 10;
          g.fillStyle = targeted ? "rgba(150,20,20,0.85)" : "rgba(0,0,0,0.55)";
          g.beginPath();
          g.roundRect(feet.x - tw / 2, feet.y + 7 * scale, tw, 14 * Math.max(1, scale), 5);
          g.fill();
          g.fillStyle = p.npc ? "#ff3b3b" : p.nc ? p.nc : p.uid === me.uid ? "#ffe27a" : "#fff";
          g.textBaseline = "top";
          g.textAlign = "center";
          g.fillText(shownLabel, feet.x, feet.y + 9 * scale);
          if (p.ghost && roulette) { const gl = roulette.ghostLabel(p.uid); if (gl) drawGhostTag(gl, feet.x, feet.y + lift - (FEET_Y + 4) * scale); }
          if (p.uid !== me.uid && !p.npc && selectedDef()?.useOnPlayer === "shoot") { const bt = bounties.get(p.uid); if (bt) drawBountyTag(bt.amount, bt.count, feet.x, feet.y + lift - (FEET_Y + 12) * scale, now); } // (holding a gun: who has a price on their head)
          if (glowing) { // a little arrow bobbing over his head
            g.fillStyle = "#ffd54a";
            g.font = `${Math.round(16 * Math.max(1, scale))}px Verdana, 'Apple Color Emoji', sans-serif`;
            g.fillText("▼", feet.x, feet.y - (FEET_Y + 14) * scale + Math.sin(now / 200) * 4 * scale);
          }
          g.textAlign = "start";
        },
      });
      const dr = diceRolls.get(p.uid);
      if (dr && now - dr.start > DICE_SHOW_MS) diceRolls.delete(p.uid);
      const dieOn = !!dr && now - dr.start <= DICE_SHOW_MS;
      if (dieOn) bubbles.push(() => drawDie(feet.x, feet.y - (FEET_Y + 4) * scale, dr!.n, now - dr!.start));
      if (streetsApi) { const hy = feet.y - (FEET_Y + 4) * scale; const pu = p.uid; bubbles.push(() => streetsApi?.drawPlayer(g, pu, feet.x, hy, scale, now)); }
      if (p.bubble && p.bubble.until > now) {
        const left = p.bubble.until - now;
        const b = p.bubble;
        const up = dieOn ? 44 * Math.max(1, scale) : 0; // (the chat bubble makes room for the die)
        bubbles.push(() => drawBubble(b.text, p.name, feet.x, feet.y - (FEET_Y + 4) * scale - up, left < 800 ? left / 800 : 1, { nc: p.nc, fx: b.fx, fc: b.fc }));
      }
    }
    hitboxes = boxes;
    list.sort((a, b) => a.depth - b.depth).forEach((d) => d.draw());
    objBoxes = objs;
    drawEffects(now);
    bubbles.forEach((b) => b());
    drawMiningBar(now);
  }

  // ---- boot --------------------------------------------------------------------------
  async function init(): Promise<void> {
    // a player with one of bagmand's hits on them says which room they walk into first: it is open to everybody while the hit lasts, and the database refuses their presence anywhere else
    if (wantedUntil() > serverNow()) { try { await bountyShow(me, roomId); } catch { /* the rules decide */ } }
    if (disposed) return;
    if (roomId === SHOP_ID) {
      applyDef(shopDef(picksToday(), raffleNow.round?.prize));
      start();
      unsubs.push(onFurniShopChanged(() => { if (!disposed) applyDef(shopDef(picksToday(), raffleNow.round?.prize)); })); // the admin swapped a piece
      // the raffle: its prize stands beside the machine (and changes after a draw), a draw you won is announced, and somebody in the shop asks for the 16:00 draw
      unsubs.push(watchRaffle(me.uid, (v) => {
        if (disposed) return;
        const before = raffleNow.round?.prize;
        raffleNow = v;
        if (v.round && v.round.prize !== before) applyDef(shopDef(picksToday(), v.round.prize));
        announceWin(me, v.last, () => { void call(me, "sync").then(() => { panel.refresh(); ctx.refreshHeader(); }, () => undefined); });
      }));
      const drawWatch = window.setInterval(() => { if (!disposed && raffleNow.round && serverNow() >= raffleNow.round.drawAt) void call(me, "raffleTick").catch(() => undefined); }, 30_000);
      unsubs.push(() => window.clearInterval(drawWatch));
      void call(me, "raffleTick").catch(() => undefined); // (no round yet, or a draw that is due)
      return;
    }
    if (roomId === STAGE_ID) {
      applyDef(stageDef());
      start();
      let firstLook = true;
      unsubs.push(watchStageFurni((pieces) => { // everything on the stage comes from the database; the first admin in puts the starting layout there
        if (disposed) return;
        const first = firstLook; firstLook = false;
        if (first && !pieces.length && me.isAdmin) { void resetStage(STAGE_DEFAULT).catch(() => undefined); return; } // (the first admin in puts the starting layout there: it comes back as the next snapshot)
        applyDef(stageDef(pieces));
      }));
      return;
    }
    if (isMines) {
      applyDef(minesDef());
      start();
      return;
    }
    if (isArrival) {
      applyDef(arrivalDef());
      start();
      return;
    }
    if (isStreets) {
      applyDef(streetsDef());
      unsubs.push(watchStreetsFurni((over) => { if (!disposed) applyDef(streetsDef(over)); })); // what the admin has moved, added or taken away
      start();
      void mountStreets({
        me, stage, say,
        tileOf: (uid) => { const p = players.get(uid); return p ? currentTile(p) : null; },
        nameOf: (uid) => players.get(uid)?.name ?? "somebody",
        walkTo: (t) => { fightWalking = true; try { walkTo(t); } finally { fightWalking = false; } },
        goHome: () => ctx.navigate("room", { roomId: ownRoomId(me.uid), arrival: "bed", force: true }),
        goDown: () => ctx.navigate("room", { roomId: LOBBY_ID, from: ARRIVAL_ID, force: true }),
        refreshPocket: () => panel.refresh(),
        pop: (text) => giftPop(text, bloodImg),
      }).then((api) => { if (disposed) api.dispose(); else streetsApi = api; });
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
      let lobbyExtras: PlacedFurni[] = [];
      unsubs.push(watchLobbyFurni((extras) => { lobbyExtras = extras; if (!disposed) applyDef(lobbyDef(extras)); })); // pieces the admin added
      unsubs.push(onStreetsFlag(() => { if (!disposed) applyDef(lobbyDef(lobbyExtras)); })); // the elevator stands there only while the admin has the streets switched on
      roulette = mountRoulette({
        me, stage,
        def: () => def,
        scale: () => scale,
        tileFeet: (tx, ty) => { const w = iso(tx, ty); return toScreen({ x: w.x, y: w.y + TILE_H / 2 }); },
        tileOf: (uid) => { const p = players.get(uid); return p ? currentTile(p) : undefined; },
        player: (uid) => players.get(uid),
        everyone: () => [...players.keys()].filter((u) => !players.get(u)?.sleeper),
        ensureGhost: (uid, name, figure, tile, dir) => {
          if (players.has(uid)) return;
          const gp = makePlayer(uid, { name, figure: figure || me.figure, x: tile.x, y: tile.y, dir, sit: true });
          gp.ghost = true;
          players.set(uid, gp);
          renderAvatar({ figure: gp.figure, dir, headDir: dir, actions: ["sit"], gesture: "std", frame: 0 });
          renderOnline();
        },
        isGhost: (uid) => !!players.get(uid)?.ghost,
        removePlayer: (uid) => { players.delete(uid); if (hoverPlayer?.uid === uid) hoverPlayer = null; renderOnline(); },
        seatMe: (tile, dir) => {
          const mp = mine();
          if (!mp) return;
          mp.from = mp.to = mp.dest = { ...tile };
          mp.path = []; mp.dir = dir; mp.sit = true; mp.sitTo = undefined; mp.lying = false;
          update(myRef, { x: tile.x, y: tile.y, dir, sit: true }).catch(() => undefined);
        },
        sitAt: (fid, after) => sitAt(fid, null, after),
        standUp: () => { const p = mine(); if (!p) return; p.sit = false; p.sitTo = undefined; sitAfter = undefined; update(myRef, { sit: null }).catch(() => undefined); },
        amSeated: () => !!mine()?.sit,
        goHome: () => ctx.navigate("room", { roomId: ownRoomId(me.uid), arrival: "bed", intro: true, force: true }),
        say,
        floater: (text, at, life) => { floaters.push({ text, x: at.x, y: at.y, born: performance.now(), color: "#ff5252", icon: bloodImg, life }); },
        refreshHeader: () => ctx.refreshHeader(),
        serverNow,
        alive: () => !disposed,
      });
      return;
    }
    try {
      const meta = await fetchMeta(roomId);
      if (disposed) return;
      if (!meta) return kicked("That room doesn't exist.");
      const trespassNow = me.shroomUntil > serverNow();
      if (isHideoutRoom) {
        if (!me.enterAnywhere && !hideoutRole({ owner: meta.owner, members: meta.members }, me.uid).member) {
          hideoutGuest = meta.access === "open" || (await get(ref(db, `roomInvites/${roomId}/${me.uid}`)).catch(() => null))?.exists() === true || (await isWantedRoomLive(roomId)); // (open to all, or the owner let me in)
          if (!hideoutGuest) return kicked("You aren't in that hideout.");
        }
      }
      else if (!me.enterAnywhere && !(await canEnter(meta, me.uid, social.friendUids(), trespassNow))) return kicked(`${meta.ownerName}'s room is closed. Knock on its door from the basement to ask.`);
      if (disposed) return;
      // in on a shroom or DMT rather than by the door rules: when it wears off the door closes behind you (the database stops letting you in at that moment too)
      if (trespassNow && !me.enterAnywhere && !(await canEnter(meta, me.uid, social.friendUids(), false))) {
        const watch = window.setInterval(() => {
          if (disposed || me.shroomUntil > serverNow()) return;
          window.clearInterval(watch);
          toast("The shroom wears off and the door closes behind you.", "err");
          ctx.navigate("room", { roomId: ownRoomId(me.uid) });
        }, 1000);
        unsubs.push(() => window.clearInterval(watch));
      }
      applyDef(defFromMeta(roomId, meta));
      start();
      if (isOwnRoom && !meta.stashbox) { // a room from before the stash box came with every room: the server puts one against a wall (once you are standing in it)
        const ensure = (n: number): void => { void call(me, "stashEnsure", {}).catch(() => { if (n < 4 && !disposed) window.setTimeout(() => ensure(n + 1), 1500); }); };
        window.setTimeout(() => { if (!disposed) ensure(0); }, 1200);
      }
      unsubs.push(watchMeta(roomId, (m) => {
        if (!m) return kicked("This room was deleted.");
        applyDef(defFromMeta(roomId, m));
        if (isHideoutRoom && !me.enterAnywhere && !hideoutGuest && !hideoutRole({ owner: m.owner, members: m.members }, me.uid).member) { toast("You are not in that hideout any more.", "err"); ctx.navigate("room", { roomId: LOBBY_ID, from: roomId }); } // (kicked, or left)
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
    releaseRoomChat();
    document.body.classList.remove("greenscreen");
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
    recordApi?.close();
    posterApi?.close();
    stashApi?.close();
    jukeboxApi?.close();
    ideasApi?.close();
    duckyApi?.close();
    raffleApi?.close();
    craftApi?.close();
    landlordApi?.close();
    bagmandApi?.close();
    computerApi?.close();
    cdPressApi?.close();
    beatShopApi?.close();
    elevatorApi?.close();
    walkmanApi?.close();
    ipodApi?.close();
    petShopApi?.close();
    caseApi?.close();
    hideoutDoorApi?.close();
    chestApi?.close();
    hlandlordApi?.close();
    mixerApi?.close();
    dropConfirmApi?.close();
    pokerApi?.close();
    bjApi?.close();
    wantedApi?.close();
    noticeApi?.close();
    closeShootBox();
    stopHits();
    stopPokerSeat();
    stopBjSeat();
    pokerFx.dispose();
    roulette?.dispose();
    streetsApi?.dispose(); elevatorApi?.close();
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
      if (isBasement) setAmbience(!musicOn()); if (roomId === SHOP_ID) setShopMusic(true);
      panel.refresh();
      layout();
      ctx.refreshHeader();
    },
    hide() {
      active = false;
      if (isBasement) setAmbience(false); if (roomId === SHOP_ID) setShopMusic(false);
      sixtyShop?.close();
      pokerApi?.close();
      bjApi?.close();
      furniBuyApi?.close();
      vendingApi?.close();
      recordApi?.close();
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
