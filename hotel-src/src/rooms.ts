import { get, onValue, push, ref, remove, set, update, Unsubscribe } from "firebase/database";
import { db } from "./firebase";
import type { Profile } from "./db";

/** open = anyone walks in; knock = friends walk in, everyone else knocks and waits; closed = friends only, no knocking; none = nobody (not even friends). */
export type Access = "open" | "knock" | "closed" | "none";

/** Older rooms may still say friends/invite; they mean knock/closed. */
export const normAccess = (a: string | undefined): Access => (a === "none" ? "none" : a === "open" ? "open" : a === "closed" || a === "invite" ? "closed" : "knock");

export interface RoomTheme {
  floorA: string;
  floorB: string;
  wall: string;
  rug: boolean;
  rugColor: string;
  /** optional texture ids from public/textures (floor_<id>.png / wall_<id>.png) */
  floorTex?: string;
  wallTex?: string;
  /** "grime": dirty concrete drawn procedurally (stains, cracks, rust, puddles), and a dark moody stage */
  style?: "grime" | "street";
}

export interface FurniKind {
  id: string;
  label: string;
  icon: string;
  /** footprint in tiles */
  w: number;
  h: number;
  /** drawn height in px */
  height: number;
  color: string;
  /** can players put it in their own room? */
  placeable: boolean;
  /** built into every player room (never stored in the database, can't be picked up) */
  fixed?: boolean;
  /** drawn from a Habbo .nitro file in public/ instead of as a box */
  nitro?: string;
  /** clicking it walks you over and opens this page ("character" = your clothes, in your own room; "shop" = the clothing shop, from the wardrobe in the shop room) */
  /** a wall piece whose .nitro has its own two ways of facing: which of them goes on the left wall and on the back wall */
  wallArt?: { left: number; back: number };
  opens?: "computer" | "hideouts" | "pets" | "character" | "shop" | "furnish" | "vending" | "sink" | "mixer" | "records" | "poster" | "stash" | "ideas" | "ducky" | "mine" | "craft" | "raffle" | "chest" | "poker" | "blackjack" | "hits" | "board" | "cdpress" | "beatshop" | "elevator" | "streetbin" | "jukebox";
  /** a growing kit: weed is planted, watered and harvested in it */
  plant?: boolean;
  /** a table top (px it lifts what stands on it), small things that can stand on one, and the animation numbers a multi-state piece has (see SHOP_PIECES) */
  surface?: number;
  small?: boolean;
  states?: number[];
  defaultState?: number;
  /** a multi-state piece that stands on one picture of its state instead of playing it (the street plants: they are grown): that picture's number, or true for the last one */
  still?: boolean | number;
  /** a poster: a frame on the wall with a picture inside (the picture is stored on the placed piece as `img`) */
  poster?: boolean;
  /** you can sit on it (every tile of its footprint is a seat); it faces the way the piece faces */
  seat?: boolean;
  /** how far up (in 64px pixels) a sitting person is lifted onto the seat */
  seatHeight?: number;
  /** lies flat on the floor: you can walk over it and it's drawn underneath everyone */
  flat?: boolean;
  /** a wall item: hangs on the back wall (facing 4) or the left wall (facing 2); its x/y is the wall tile it hangs next to */
  wall?: boolean;
  /** nudges the art (64px pixels) if it doesn't sit right on its tiles */
  nudge?: { x: number; y: number };
  /** can be turned to face another way when placed (its footprint swaps when it faces 2 or 6) */
  rotatable?: boolean;
}

/** Tiles a piece covers given the way it faces. */
export function footprint(kindId: string, dir = 0): { w: number; h: number } {
  const k = FURNI_KINDS[kindId];
  if (!k) return { w: 1, h: 1 };
  return k.rotatable && (dir === 2 || dir === 6) ? { w: k.h, h: k.w } : { w: k.w, h: k.h };
}

import { SHOP_KIND_PREFIX, SHOP_PIECES } from "./shared/furniture";
import { RAFFLE_PRIZE_ID } from "./shared/raffle";
import { MINES_H, MINES_ID, MINES_OPEN, MINES_PIECES, MINES_W } from "./shared/mines";
import { ARRIVAL_ID, ARRIVAL_SIZE, isBuiltInStreetPiece, isStreetsRoom, mergeStreetPieces, StreetOverride, STREET_PIECES, STREETS_H, STREETS_ID, STREETS_W } from "./shared/streets";
import { streetsFlagOn } from "./streetsFlag";
import { HIDEOUT_MAX_FURNI, hideoutRoomId, isHideoutId, levelOfSize } from "./shared/hideout";
export { hideoutRoomId, isHideoutId };
export { MINES_ID };
import { BAG_SKINS, BED_SKINS } from "./shared/skins";
export type { ShopPiece } from "./shared/furniture";
export { SHOP_KIND_PREFIX, SHOP_PIECES };

const shopKinds = (): Record<string, FurniKind> => Object.fromEntries(SHOP_PIECES.map((p) => [SHOP_KIND_PREFIX + p.id, {
  id: SHOP_KIND_PREFIX + p.id, label: p.label, icon: p.icon, w: p.w, h: p.h, height: p.height, color: "#6b5a48", placeable: false,
  nitro: p.nitro ?? `furni/${SHOP_KIND_PREFIX}${p.id}.nitro`, rotatable: true, ...(p.flat ? { flat: true } : {}), ...(p.seat ? { seat: true, seatHeight: p.seatHeight ?? 14 } : {}), ...(p.surface ? { surface: p.surface } : {}), ...(p.small ? { small: true } : {}), ...(p.states ? { states: p.states } : {}), ...(p.defaultState ? { defaultState: p.defaultState } : {}),
} as FurniKind]));

/** The looks the landlord sells for the bed (bed_<id>) and the bag of clothes (bag_<id>): fixed pieces, never placed from a toolbox. */
const skinKinds = (): Record<string, FurniKind> => Object.fromEntries([
  ...BED_SKINS.map((s) => [`bed_${s.id}`, { id: `bed_${s.id}`, label: s.label, icon: "🛏️", w: s.w, h: s.h, height: s.height, color: "#6b5a48", placeable: false, nitro: `furni/skin_bed_${s.id}.nitro`, rotatable: true, fixed: true } as FurniKind]),
  ...BAG_SKINS.map((s) => [`bag_${s.id}`, { id: `bag_${s.id}`, label: s.label, icon: "🚪", w: s.w, h: s.h, height: s.height, color: "#6b5a48", placeable: false, nitro: `furni/skin_bag_${s.id}.nitro`, rotatable: true, fixed: true, opens: "character", ...(s.wall ? { flat: true, wall: true, nudge: { x: 0, y: -(s.lift ?? 0) } } : {}) } as FurniKind]),
]);
/** the bag of clothes, or one of the wardrobes you can swap it for */
export const isBagKind = (kind: string | undefined): boolean => kind === "bag" || (!!kind && kind.startsWith("bag_"));

export const FURNI_KINDS: Record<string, FurniKind> = {
  ...shopKinds(),
  ...skinKinds(),
  // the growing kit (sold in the shop room's vending machine): an empty pot until you plant a seed in it
  f_planter_auto: { id: "f_planter_auto", label: "Growing kit with waterer", icon: "🪴", w: 1, h: 1, height: 36, color: "#d8d8d8", placeable: false, nitro: "furni/f_flowerpot.nitro", rotatable: true, plant: true }, // (only ever carried or stored: put down, it is a growing kit with `auto`)
  f_planter: { id: "f_planter", label: "Growing kit", icon: "🪴", w: 1, h: 1, height: 36, color: "#d8d8d8", placeable: false, nitro: "furni/f_flowerpot.nitro", rotatable: true, plant: true },
  // the mixer (sold by the vending machine): put it down in your room, tap it, and mix two things into something new
  // the automatic plant waterer: it sits on a growing kit (drawn over the pot, never placed on its own)
  sprinkler: { id: "sprinkler", label: "Automatic waterer", icon: "💦", w: 1, h: 1, height: 36, color: "#9fd4ff", placeable: false, nitro: "furni/sprinkler.nitro", rotatable: true, flat: true },
  // the hideout's shared stash: a chest every member can put things in and take things out of
  hchest: { id: "hchest", label: "Shared stash", icon: "🧰", w: 1, h: 1, height: 36, color: "#8a6a3a", placeable: false, nitro: "furni/stashbox.nitro", rotatable: true, fixed: true, opens: "chest" },
  f_mixer_up2: { id: "f_mixer_up2", label: "Mixer (MK2)", icon: "🧪", w: 1, h: 1, height: 46, color: "#3a3d44", placeable: false, nitro: "derived:mixer_up2", rotatable: true, opens: "mixer" },
  f_mixer_up: { id: "f_mixer_up", label: "Mixer (upgraded)", icon: "🧪", w: 1, h: 1, height: 46, color: "#4f8a5a", placeable: false, nitro: "derived:mixer_up", rotatable: true, opens: "mixer" },
  f_mixer: { id: "f_mixer", label: "Mixer", icon: "🧪", w: 1, h: 1, height: 46, color: "#6b6b7a", placeable: false, nitro: "furni/f_mixer.nitro", rotatable: true, opens: "mixer" },
  // the streets (see shared/streets.ts): the elevator in the basement (and in the arrival room, to go back), and the things on the street. The art is from HabboAssets (public/furni/st_*.nitro).
  elevator: { id: "elevator", label: "Elevator", icon: "🛗", w: 1, h: 1, height: 96, color: "#7a1c1c", placeable: false, nitro: "furni/elevator.nitro", rotatable: true, fixed: true, opens: "elevator" },
  st_bin: { id: "st_bin", label: "Trash can", icon: "🗑️", w: 1, h: 1, height: 40, color: "#2f5fa8", placeable: false, nitro: "derived:st_bin_blue", rotatable: true, fixed: true, opens: "streetbin" },
  st_can: { id: "st_can", label: "Trash can", icon: "🗑️", w: 1, h: 1, height: 40, color: "#555", placeable: false, nitro: "furni/st_trashcan.nitro", rotatable: true, fixed: true, opens: "streetbin" },
  st_tree_apple: { id: "st_tree_apple", label: "Apple tree", icon: "🌳", w: 1, h: 1, height: 110, color: "#4a7", placeable: false, nitro: "furni/st_tree_apple.nitro", rotatable: true, fixed: true, states: [6], defaultState: 6 },
  st_tree_orange: { id: "st_tree_orange", label: "Orange tree", icon: "🌳", w: 1, h: 1, height: 110, color: "#4a7", placeable: false, nitro: "furni/st_tree_orange.nitro", rotatable: true, fixed: true, states: [6], defaultState: 6 },
  st_tree_pear: { id: "st_tree_pear", label: "Pear tree", icon: "🌳", w: 1, h: 1, height: 110, color: "#4a7", placeable: false, nitro: "furni/st_tree_pearg.nitro", rotatable: true, fixed: true, states: [4], defaultState: 4 },
  st_tree_blossom: { id: "st_tree_blossom", label: "Blossom tree", icon: "🌳", w: 1, h: 1, height: 110, color: "#4a7", placeable: false, nitro: "furni/st_tree_peach.nitro", rotatable: true, fixed: true, states: [1], defaultState: 1, still: 4 },
  st_planttree: { id: "st_planttree", label: "Tree in a planter", icon: "🌳", w: 1, h: 1, height: 90, color: "#4a7", placeable: false, nitro: "furni/st_plant_office.nitro", rotatable: true, fixed: true },
  st_planter: { id: "st_planter", label: "Planter", icon: "🌳", w: 1, h: 1, height: 28, color: "#4a7", placeable: false, nitro: "furni/st_potbush.nitro", rotatable: true, fixed: true, states: [1], defaultState: 1, still: true },
  st_stall1: { id: "st_stall1", label: "Market stall", icon: "🌳", w: 2, h: 1, height: 70, color: "#4a7", placeable: false, nitro: "furni/st_stall1.nitro", rotatable: true, fixed: true },
  st_stall2: { id: "st_stall2", label: "Market stall", icon: "🌳", w: 2, h: 1, height: 70, color: "#4a7", placeable: false, nitro: "furni/st_stall2.nitro", rotatable: true, fixed: true },
  st_stall3: { id: "st_stall3", label: "Market stall", icon: "🌳", w: 2, h: 1, height: 70, color: "#4a7", placeable: false, nitro: "furni/st_stall3.nitro", rotatable: true, fixed: true },
  st_phonebox: { id: "st_phonebox", label: "Phone box", icon: "🌳", w: 1, h: 1, height: 100, color: "#4a7", placeable: false, nitro: "derived:phonebox_red", rotatable: true, fixed: true },
  st_birdbath: { id: "st_birdbath", label: "Bird bath", icon: "🌳", w: 1, h: 1, height: 56, color: "#4a7", placeable: false, nitro: "furni/st_birdbath.nitro", rotatable: true, fixed: true },
  st_cafetable: { id: "st_cafetable", label: "Cafe table", icon: "🌳", w: 2, h: 2, height: 36, color: "#4a7", placeable: false, nitro: "furni/st_cafetable.nitro", rotatable: true, fixed: true },
  st_cafechair: { id: "st_cafechair", label: "Chair", icon: "🌳", w: 1, h: 1, height: 36, color: "#4a7", placeable: false, nitro: "furni/st_cafechair.nitro", rotatable: true, fixed: true },
  st_statue: { id: "st_statue", label: "Statue", icon: "🌳", w: 1, h: 1, height: 72, color: "#4a7", placeable: false, nitro: "furni/st_statue.nitro", rotatable: true, fixed: true },
  st_traffic: { id: "st_traffic", label: "Traffic light", icon: "🌳", w: 1, h: 1, height: 96, color: "#4a7", placeable: false, nitro: "furni/st_traffic.nitro", rotatable: true, fixed: true },
  st_lamp: { id: "st_lamp", label: "Street lamp", icon: "💡", w: 1, h: 1, height: 120, color: "#555", placeable: false, nitro: "furni/st_urban_lamp.nitro", rotatable: true, fixed: true },
  st_lamppost: { id: "st_lamppost", label: "Lamp post", icon: "💡", w: 1, h: 1, height: 110, color: "#555", placeable: false, nitro: "furni/st_es_lmppst.nitro", rotatable: true, fixed: true },
  st_hydrant: { id: "st_hydrant", label: "Fire hydrant", icon: "🧯", w: 1, h: 1, height: 36, color: "#a22", placeable: false, nitro: "furni/st_urban_wpost.nitro", rotatable: true, fixed: true },
  st_bench: { id: "st_bench", label: "Bench", icon: "🪑", w: 2, h: 1, height: 36, color: "#666", placeable: false, nitro: "furni/st_urban_bench.nitro", rotatable: true, fixed: true },
  st_blocker: { id: "st_blocker", label: "Road block", icon: "🚧", w: 1, h: 1, height: 36, color: "#cc8", placeable: false, nitro: "furni/st_urban_blocker.nitro", rotatable: true, fixed: true },
  st_dumpster: { id: "st_dumpster", label: "Dumpster", icon: "🗑️", w: 2, h: 1, height: 44, color: "#2d4d34", placeable: false, nitro: "furni/st_vwave_c21_dumpster.nitro", rotatable: true, fixed: true },
  st_signs: { id: "st_signs", label: "Road signs", icon: "🚸", w: 1, h: 1, height: 70, color: "#cc3", placeable: false, nitro: "furni/st_bump_signs.nitro", rotatable: true, fixed: true },
  st_roadsign: { id: "st_roadsign", label: "Road works sign", icon: "🚧", w: 1, h: 1, height: 60, color: "#c33", placeable: false, nitro: "furni/st_nyc_c23_roaditem2.nitro", rotatable: true, fixed: true },
  st_manhole: { id: "st_manhole", label: "Manhole", icon: "⚫", w: 1, h: 1, height: 3, color: "#222", placeable: false, nitro: "furni/st_nyc_c23_manhole.nitro", rotatable: true, fixed: true, flat: true },
  st_tag1: { id: "st_tag1", label: "Graffiti", icon: "🎨", w: 2, h: 1, height: 60, color: "#c4a", placeable: false, nitro: "furni/st_sb_tag1.nitro", rotatable: true, fixed: true, flat: true, wall: true, wallArt: { left: 2, back: 4 } },
  st_tag2: { id: "st_tag2", label: "Graffiti", icon: "🎨", w: 2, h: 1, height: 60, color: "#4c8", placeable: false, nitro: "furni/st_sb_tag2.nitro", rotatable: true, fixed: true, flat: true, wall: true, wallArt: { left: 2, back: 4 } },
  st_tag3: { id: "st_tag3", label: "Graffiti", icon: "🎨", w: 2, h: 1, height: 60, color: "#ea4", placeable: false, nitro: "furni/st_sb_tag3.nitro", rotatable: true, fixed: true, flat: true, wall: true, wallArt: { left: 2, back: 4 } },
  // the cars that drive down the street (drawn by src/streets.ts, never placed in a room)
  st_car_retro: { id: "st_car_retro", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#6ab", placeable: false, nitro: "furni/st_hween_c25_retrocar2.nitro", rotatable: true, fixed: true },
  st_car_retro_red: { id: "st_car_retro_red", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#c33", placeable: false, nitro: "derived:beetle_red", rotatable: true, fixed: true },
  st_car_retro_yellow: { id: "st_car_retro_yellow", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#dc3", placeable: false, nitro: "derived:beetle_yellow", rotatable: true, fixed: true },
  st_car_retro_pink: { id: "st_car_retro_pink", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#d7a", placeable: false, nitro: "derived:beetle_pink", rotatable: true, fixed: true },
  st_car_retro_blue: { id: "st_car_retro_blue", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#36c", placeable: false, nitro: "derived:beetle_blue", rotatable: true, fixed: true },
  st_car_retro_orange: { id: "st_car_retro_orange", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#d82", placeable: false, nitro: "derived:beetle_orange", rotatable: true, fixed: true },
  st_car_retro_green: { id: "st_car_retro_green", label: "Old car", icon: "🚗", w: 2, h: 1, height: 50, color: "#3a5", placeable: false, nitro: "derived:beetle_green", rotatable: true, fixed: true },
  st_car_mafia: { id: "st_car_mafia", label: "Black car", icon: "🚘", w: 2, h: 4, height: 50, color: "#222", placeable: false, nitro: "furni/st_mafia_c26_car.nitro", rotatable: true, fixed: true },
  // the vending machine in the shop room
  vending: { id: "vending", label: "Vending machine", icon: "🥤", w: 1, h: 1, height: 80, color: "#6b5a48", placeable: false, nitro: "furni/olympics_r16_vendingmchn.nitro", rotatable: true, fixed: true, opens: "vending" },
  // the sink in every player room (like the bed: always there, movable, never removable): fills the watering can
  sink: { id: "sink", label: "Sink", icon: "🚰", w: 1, h: 1, height: 36, color: "#555b66", placeable: false, nitro: "furni/hygge_c25_toiletsink.nitro", rotatable: true, fixed: true, opens: "sink" },
  // the silver boombox every player room starts with: use a CD on it (6ixty sells one) and the song plays in the room
  // the same boombox as a piece you carry: take it out of the room into your pocket, put it down anywhere, trade it or sell it
  // the BeatShop (the record box sells it): a vending machine painted purple; tap it to sell your beats or buy somebody's
  f_beatshop: { id: "f_beatshop", label: "BeatShop", icon: "🎧", w: 1, h: 1, height: 80, color: "#6a3d8f", placeable: false, nitro: "derived:beatshop", rotatable: true, opens: "beatshop" },
  f_boombox: { id: "f_boombox", label: "Boombox", icon: "📻", w: 1, h: 1, height: 34, color: "#8d97ab", placeable: false, nitro: "furni/boombox.nitro", rotatable: true },
  boombox: { id: "boombox", label: "Boombox", icon: "📻", w: 1, h: 1, height: 34, color: "#8d97ab", placeable: false, nitro: "furni/boombox.nitro", rotatable: true, fixed: true },
  // the stash box the landlord sells (20 drops): a gift box that keeps what you don't want in your pockets
  // the basement's jukebox (art from HabboAssets, public/furni/vwave_r21_jukebox.nitro): pick a CD and pay to have it played for the whole room
  jukebox: { id: "jukebox", label: "Jukebox", icon: "🎵", w: 1, h: 1, height: 70, color: "#b86a1a", placeable: false, fixed: true, opens: "jukebox", nitro: "furni/vwave_r21_jukebox.nitro", rotatable: true },
  // the remote bank in the arrival room (a safe, painted red): it opens your stash box from there
  silo: { id: "silo", label: "Remote bank", icon: "🏦", w: 1, h: 1, height: 64, color: "#b02a1a", placeable: false, fixed: true, opens: "stash", nitro: "derived:silo_red", rotatable: true },
  stashbox: { id: "stashbox", label: "Stash box", icon: "🎁", w: 1, h: 1, height: 36, color: "#8a5fd0", placeable: false, fixed: true, opens: "stash", nitro: "furni/stashbox.nitro", rotatable: true },
  // the toolbox in every player room (Habbo's toolbox): click it and the furnishing menu opens
  // the hideout's computer: a red laptop (the shop's laptop, painted); tap it for the hideout's website
  hcomputer: { id: "hcomputer", label: "Computer", icon: "💻", w: 1, h: 1, height: 32, color: "#b02a2a", placeable: false, fixed: true, small: true, opens: "computer", nitro: "derived:hcomputer", rotatable: true },
  // the door in the basement's left wall, past the roulette table: it leads to your hideouts
  // the pet merchant in the shop room: a basket (for now: tap it to buy a pet)
  petbasket: { id: "petbasket", label: "Pet merchant", icon: "🐾", w: 1, h: 1, height: 40, color: "#c8a060", placeable: false, nitro: "furni/market_c19_basket.nitro", rotatable: true, fixed: true, opens: "pets" },
  // the red door behind 6ixty: the hideout door (the teleport door) painted red; tap it and 6ixty says what is coming
  reddoor: { id: "reddoor", label: "Red door", icon: "🚪", w: 1, h: 1, height: 70, color: "#b01818", placeable: false, nitro: "derived:red_door", rotatable: true, fixed: true, flat: true, wall: true, wallArt: { left: 2, back: 4 } },
  hdoor: { id: "hdoor", label: "Hideouts", icon: "🚪", w: 1, h: 1, height: 70, color: "#3d5a73", placeable: false, nitro: "furni/teleport_door.nitro", rotatable: true, fixed: true, flat: true, wall: true, wallArt: { left: 2, back: 4 }, opens: "hideouts" },
  toolbox: { id: "toolbox", label: "Toolbox", icon: "🧰", w: 1, h: 1, height: 22, color: "#b4492f", placeable: false, fixed: true, opens: "furnish", nitro: "furni/ads_twi_toolbx.nitro", rotatable: true },
  // posters: a frame on the wall; the picture inside is the player's own (chosen when it is hung). The one in the shop room is for sale.
  f_poster: { id: "f_poster", label: "Poster", icon: "🖼️", w: 2, h: 1, height: 60, color: "#55595f", placeable: true, nitro: "furni/poster.nitro", rotatable: true, flat: true, wall: true, poster: true, nudge: { x: 0, y: -52 } },
  // the notice board by the hideouts: who has blood on their head (drawn by the room itself: names and bounties, black and white); tap it for the list
  discordboard: { id: "discordboard", label: "Notice board", icon: "📢", w: 1, h: 1, height: 60, color: "#2f6fd0", placeable: false, nitro: "derived:blue_board", rotatable: true, flat: true, wall: true, wallArt: { left: 0, back: 2 }, opens: "board" },
  wantedboard: { id: "wantedboard", label: "Wanted board", icon: "📋", w: 1, h: 1, height: 60, color: "#777777", placeable: false, nitro: "derived:wanted_board", rotatable: true, flat: true, wall: true, wallArt: { left: 0, back: 2 }, opens: "hits" },
  shopposter: { id: "shopposter", label: "Poster", icon: "🖼️", w: 2, h: 1, height: 60, color: "#55595f", placeable: false, nitro: "furni/poster.nitro", rotatable: true, fixed: true, flat: true, wall: true, poster: true, opens: "poster", nudge: { x: 0, y: -52 } },
  // the record player on the counter at the left of the shop room: the CDs are sold here
  recordplayer: { id: "recordplayer", label: "Record player", icon: "💿", w: 1, h: 1, height: 30, color: "#3a3a44", placeable: false, nitro: "furni/recordplayer.nitro", rotatable: true, fixed: true, opens: "records", nudge: { x: 0, y: -34 } },
  // the grey vinyl table the record player stands on (it opens the record shop too, but only the player glows)
  vinyltable: { id: "vinyltable", label: "Record table", icon: "💿", w: 1, h: 1, height: 36, color: "#555", placeable: false, nitro: "furni/vinyltable.nitro", rotatable: true, fixed: true, opens: "records" },
  // the landlord's counter in the corner of the shop room
  counter: { id: "counter", label: "Counter", icon: "🧾", w: 1, h: 2, height: 30, color: "#6b5a48", placeable: false, nitro: "furni/f_counter.nitro", rotatable: true, fixed: true },
  // the wardrobe in the shop room: click it and the clothing shop opens
  wardrobe: { id: "wardrobe", label: "Wardrobe", icon: "🚪", w: 2, h: 1, height: 90, color: "#6b5a48", placeable: false, nitro: "furni/skin_bag_plain.nitro", rotatable: true, fixed: true, opens: "shop" },
  arcade: { id: "arcade", label: "Arcade machine", icon: "🕹️", w: 1, h: 1, height: 78, color: "#26327a", placeable: false },
  cdplayer: { id: "cdplayer", label: "CD player", icon: "💿", w: 1, h: 1, height: 38, color: "#2d3140", placeable: false },
  // the Flappy Bird arcade machine (Habbo's cupcake-duck cabinet) in the basement: click it and you play Flappy Bird
  flappy: { id: "flappy", label: "Flappy Bird arcade", icon: "🐤", w: 1, h: 2, height: 80, color: "#2a2218", placeable: false, nitro: "furni/arcade_flappy.nitro", rotatable: true },
  // Russian roulette at the far end of the basement's left wall: the makeshift table (click it to sit down and put blood on it), the two crate chairs, and the gun rack on the table
  rtable: { id: "rtable", label: "Roulette table", icon: "🔫", w: 2, h: 1, height: 36, color: "#6b5a48", placeable: false, nitro: "furni/f_makeshifttable.nitro", rotatable: true, surface: 36 },
  rchair: { id: "rchair", label: "Roulette chair", icon: "🪑", w: 1, h: 1, height: 38, color: "#6b5a48", placeable: false, nitro: "furni/f_cratechairlight.nitro", rotatable: true, seat: true, seatHeight: 14 },
  gunrack: { id: "gunrack", label: "Gun rack", icon: "🔫", w: 1, h: 1, height: 20, color: "#6b5a48", placeable: false, nitro: "furni/f_gunrack.nitro", rotatable: true, small: true },
  // the pay2win machine in the shop room, on the left wall next to the record table: things for real money (a starter package, a name colour, a chat tool, a room advert, a new name)
  ducky: { id: "ducky", label: "pay2win", icon: "💸", w: 1, h: 1, height: 78, color: "#e8a020", placeable: false, nitro: "furni/ducky_machine.nitro", rotatable: true, fixed: true, opens: "ducky" },
  // the security camera next to 6ixty in the basement: it turns, and reminds everybody they are being watched (see also src/watched.ts)
  seccam: { id: "seccam", label: "Security camera", icon: "📹", w: 1, h: 1, height: 70, color: "#555", placeable: false, nitro: "furni/exe_seccam.nitro", rotatable: true, fixed: true, states: [0, 1], defaultState: 1 },
  // the raffle in the shop room: a royal gacha machine on the elven square end table (tap either): tickets for a rare piece, drawn every day at 16:00 (see src/shared/raffle.ts)
  raffletable: { id: "raffletable", label: "Raffle", icon: "🎟️", w: 1, h: 1, height: 30, color: "#cfcfcf", placeable: false, nitro: "furni/easter_c26_elvensquareendtable.nitro", rotatable: true, fixed: true, surface: 30, opens: "raffle" },
  gacha: { id: "gacha", label: "Royal gacha", icon: "🎰", w: 1, h: 1, height: 64, color: "#d4a017", placeable: false, nitro: "furni/gacha_c25_royalgachab.nitro", rotatable: true, fixed: true, small: true, opens: "raffle" },
  // ---- the mines (a door in the basement): ore rocks to mine, an anvil to craft on, and things to look at (all fixed pieces, only drawn here) ----
  mrock: { id: "mrock", label: "Iron rock", icon: "🪨", w: 1, h: 1, height: 40, color: "#5b4a40", placeable: false, nitro: "furni/mine_rock.nitro", rotatable: true, fixed: true, opens: "mine" },
  mbench: { id: "mbench", label: "Crafting bench", icon: "⚒️", w: 1, h: 1, height: 36, color: "#4a4f57", placeable: false, nitro: "furni/mine_anvil.nitro", rotatable: true, fixed: true, opens: "craft" },
  mlogs: { id: "mlogs", label: "Logs", icon: "🪵", w: 1, h: 2, height: 40, color: "#7a4e2a", placeable: false, nitro: "furni/mine_logs.nitro", rotatable: true, fixed: true },
  mballs: { id: "mballs", label: "Iron balls", icon: "⚫", w: 1, h: 1, height: 24, color: "#333", placeable: false, nitro: "furni/mine_balls.nitro", rotatable: true, fixed: true },
  msacks: { id: "msacks", label: "Sacks", icon: "🎒", w: 1, h: 1, height: 30, color: "#a89878", placeable: false, nitro: "furni/mine_sacks.nitro", rotatable: true, fixed: true },
  mcart: { id: "mcart", label: "Mine cart", icon: "🛒", w: 1, h: 1, height: 34, color: "#555", placeable: false, nitro: "furni/mine_cart.nitro", rotatable: true, fixed: true },
  mtools: { id: "mtools", label: "Tool cart", icon: "🧰", w: 1, h: 1, height: 36, color: "#555", placeable: false, nitro: "furni/mine_tools.nitro", rotatable: true, fixed: true },
  mpick: { id: "mpick", label: "Dirt and a pickaxe", icon: "⛏️", w: 1, h: 1, height: 24, color: "#6b4a2a", placeable: false, nitro: "furni/mine_pick.nitro", rotatable: true, fixed: true },
  mskull: { id: "mskull", label: "Longhorn skull", icon: "💀", w: 1, h: 1, height: 22, color: "#ddd", placeable: false, nitro: "furni/mine_skull.nitro", rotatable: true, fixed: true },
  mbigrock: { id: "mbigrock", label: "Big rock", icon: "🪨", w: 2, h: 3, height: 70, color: "#6a7a66", placeable: false, nitro: "furni/mine_bigrock.nitro", rotatable: true, fixed: true },
  mspire: { id: "mspire", label: "Rock spire", icon: "🪨", w: 1, h: 1, height: 70, color: "#5b3f33", placeable: false, nitro: "furni/mine_spire.nitro", rotatable: true, fixed: true },
  mtorch: { id: "mtorch", label: "Torch", icon: "🔥", w: 1, h: 1, height: 60, color: "#c85", placeable: false, nitro: "furni/mine_torch.nitro", rotatable: true, fixed: true, flat: true, wall: true, wallArt: { left: 0, back: 2 } },
  // the ideas board on the basement's left wall (Habbo's cork board with pictures): click it and the board opens, where everybody posts pictures and ideas
  ideaboard: { id: "ideaboard", label: "Ideas board", icon: "💡", w: 1, h: 1, height: 60, color: "#a8793c", placeable: false, nitro: "furni/f_ideaboard.nitro", rotatable: true, flat: true, wall: true, wallArt: { left: 0, back: 2 }, opens: "ideas" },
  // the alley dumpster next to the Flappy Bird machine: search it (every 10 minutes) for a cigarette or a dead cat
  dumpster: { id: "dumpster", label: "Dumpster", icon: "🗑️", w: 2, h: 1, height: 52, color: "#2c3a2c", placeable: false, nitro: "furni/alley_dumpster.nitro", rotatable: true },
  // the bed every player room has (a fixed piece: not in the furniture menu, not stored in the database)
  bed: { id: "bed", label: "Bed", icon: "🛏️", w: 1, h: 3, height: 30, color: "#6b5a48", placeable: false, nitro: "furni/hween_c25_makeshiftbed.nitro", rotatable: true, fixed: true },
  // the bag of clothes in the corner of your own room: click it (your avatar walks over first) to open the Character page
  bag: { id: "bag", label: "Bag of clothes", icon: "🛍️", w: 1, h: 1, height: 26, color: "#2a2a2a", placeable: false, nitro: "furni/messy_c21_trashbags.nitro", rotatable: true, fixed: true, opens: "character" },
};
// the poker tables (they come from the hideout computer like any shop piece): tap one to sit down and play
for (const id of ["f_pokertable", "f_pokertablehi"]) if (FURNI_KINDS[id]) FURNI_KINDS[id].opens = "poker";
if (FURNI_KINDS.f_blackjacktable) FURNI_KINDS.f_blackjacktable.opens = "blackjack";
if (FURNI_KINDS.f_cdpress) FURNI_KINDS.f_cdpress.opens = "cdpress"; // (the CD printer: pick one of the Charts songs and press it onto a CD)

/** Furniture you can click on and do something with (not just walk around). */
export const INTERACTIVE_KINDS = new Set(["arcade", "cdplayer", "boombox", "f_boombox", "flappy", "dumpster", "rtable", "rchair", "gunrack", "ideaboard", "mrock", "mbench", "reddoor"]);
/** the CD player in the basement or a boombox: both play the CD you use on them */
export const isCdKind = (kind: string | undefined): boolean => kind === "cdplayer" || kind === "boombox" || kind === "f_boombox";
/** a body bag (the shop piece or an uploaded one): use a syringe on it for a drop of blood */
export const isBodyBag = (kind: string | undefined): boolean => !!kind && /bodybag/.test(kind);

interface Pt2 { x: number; y: number }
export interface PlacedFurni {
  id: string;
  kind: string;
  x: number;
  y: number;
  /** facing 0/2/4/6 (only matters for rotatable pieces) */
  dir?: number;
  /** a poster's picture: a small PNG as a data address (empty = the "?" poster) */
  img?: string;
  /** a growing kit with a seed in it (server times, ms): planted, last watered, and whether it ever ran dry */
  plant?: { at: number; water: number; neglect: boolean; /** what grows in it: weed (nothing) or shrooms */ crop?: string; /** an automatic waterer sits on the pot: it never needs water */ auto?: boolean };
  /** the pot has an automatic waterer, the mixer an upgrade chip (set by the server) */
  auto?: boolean; up?: number;
  /** which look or animation a multi-state piece is in (its animation number); empty = the piece's default */
  st?: number;
  /** a mixer with a batch in it (server times, ms): when it is done and how long it takes */
  mix?: { doneAt: number; ms: number; item?: string };
  /** in a hideout: whose piece it is (the one who put it in: only they can take it out of the box again) */
  by?: string;
}

export interface RugRect {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

export interface RoomDef {
  id: string;
  name: string;
  ownerUid: string | null;
  ownerName: string | null;
  access: Access;
  w: number;
  h: number;
  theme: RoomTheme;
  rug: RugRect | null;
  furni: PlacedFurni[];
  /** tile column of the door on the back-right wall */
  doorX: number;
  /** the main door leads straight to this room (no door menu) */
  doorTo?: string;
  /** more doors on the back-right wall, each leading to a room of its own */
  extraDoors?: ExtraDoor[];
  /** a hideout (a shared room): its level, who is in it, what is in the shared box, the orders on the way */
  hideout?: HideoutInfo;
}

export interface HideoutInfo {
  level: number;
  lock: boolean;
  members: Record<string, { name: string; build: boolean; grow: boolean; stash: boolean }>;
  /** the shared box: piece owner -> kind -> how many */
  box: Record<string, Record<string, number>>;
  orders: Record<string, { kind: string; by: string; doneAt: number }>;
  /** how many of each thing on the computer this hideout has ordered (the price can change after the first few) */
  bought: Record<string, number>;
  /** how many pieces fit */
  cap: number;
  /** the line about it on the public list, whether it is on the list, and until when it is shown first */
  desc: string;
  /** what the landlord outside calls out about it while it is boosted */
  ad: string;
  listed: boolean;
  boostUntil: number;
  /** anybody can walk in (no knocking) */
  open: boolean;
}

export interface ExtraDoor { x: number; to: string; label: string; yellow?: boolean; /** a rusty brown door (the mines) */ brown?: boolean }

/** Every room has its door on the back-right wall at this tile column. */
export const DOOR_X = 1;
/** Tiles in front of the door that furniture may never block. */
export const isDoorTile = (x: number, y: number, doorX = DOOR_X): boolean => x === doorX && y <= 1;

export const DEFAULT_THEME: RoomTheme = { floorA: "#a99a6a", floorB: "#b5a678", wall: "#b9c9cf", rug: true, rugColor: "#c9544f" };

export const FLOOR_PRESETS: Array<{ name: string; a: string; b: string }> = [
  { name: "Sand", a: "#a99a6a", b: "#b5a678" },
  { name: "Oak", a: "#a2713f", b: "#b0814d" },
  { name: "Slate", a: "#5d6b78", b: "#6a7886" },
  { name: "Checker", a: "#2b2b2b", b: "#d8d8d8" },
  { name: "Moss", a: "#5f7d4a", b: "#6c8b56" },
  { name: "Rose", a: "#b86a7c", b: "#c47b8c" },
  { name: "Ocean", a: "#3f7fa6", b: "#4a8db5" },
  { name: "Cream", a: "#d9ccaa", b: "#e3d8ba" },
];
export const WALL_COLORS = ["#b9c9cf", "#e8d8b0", "#c9a6b8", "#9fc1a0", "#8aa6d6", "#d9a38a", "#7c7f8c", "#f0f0f0"];
export const RUG_COLORS = ["#c9544f", "#4f7bc9", "#4fa86a", "#c9a24f", "#8a4fc9", "#333333"];

/** Floor patterns multiply over the floor colours; wall patterns replace the wall colour. Files live in public/textures (from the Habbo asset dump). */
export const FLOOR_TEXTURES: Array<{ id: string; name: string }> = [
  { id: "fuzzy", name: "Fuzzy" }, { id: "tiles2", name: "Tiles" }, { id: "tiles3", name: "Planks" }, { id: "tiles5", name: "Slabs" },
];
export const WALL_TEXTURES: Array<{ id: string; name: string }> = [
  { id: "brick_red", name: "Red brick" }, { id: "brick_white", name: "White brick" }, { id: "brick_teal", name: "Teal tiles" },
  { id: "chocolate", name: "Chocolate" }, { id: "wood", name: "Wood" },
  { id: "plaid_pink", name: "Pink plaid" }, { id: "plaid_brown", name: "Brown plaid" }, { id: "plaid_green", name: "Green plaid" },
  { id: "stripes_bright", name: "Bright stripes" }, { id: "stripes_blue", name: "Blue stripes" }, { id: "stripes_orange", name: "Orange stripes" },
  { id: "zigzag_pink", name: "Pink zigzag" }, { id: "zigzag_yellow", name: "Yellow zigzag" }, { id: "zigzag_blue", name: "Blue zigzag" },
  { id: "rings_purple", name: "Purple rings" }, { id: "rings_green", name: "Green rings" }, { id: "rings_yellow", name: "Yellow rings" },
  { id: "rings_blue", name: "Blue rings" }, { id: "rings_brown", name: "Brown rings" },
  { id: "hearts", name: "Hearts" }, { id: "clouds", name: "Clouds" }, { id: "groovy_green", name: "Groovy green" }, { id: "groovy_blue", name: "Groovy blue" },
];

/** Every player room is the same size. */
export const ROOM_W = 8;
export const ROOM_H = 8;
export const MAX_FURNI = 40;

export const LOBBY_ID = "lobby";
export const SHOP_ID = "shop";
/** rooms with no owner that everyone shares (the basement and the shop) */
export const isPublicRoom = (id: string) => id === LOBBY_ID || id === SHOP_ID || id === MINES_ID || isStreetsRoom(id) || isTutRoom(id);
/** The private copy of the basement a brand-new player walks through the introduction in (nobody else can come in, the body bag is not there). */
export const tutRoomId = (uid: string) => `tut_${uid}`;
export const isTutRoom = (id: string) => id.startsWith("tut_");
export const ownRoomId = (uid: string) => `u_${uid}`;
export const ownerOfRoom = (id: string) => (id.startsWith("u_") ? id.slice(2) : null);
export const isLobby = (id: string) => id === LOBBY_ID;

/** Cold, damp concrete: the look of the public room. */
export const GRIME_THEME: RoomTheme = { floorA: "#5f6262", floorB: "#686b6b", wall: "#575c5d", rug: false, rugColor: "#000000", style: "grime" };

/** The public room: an empty, filthy concrete cell. Everything in it was put there by the admin (Room > 🏠 tab). */
/** the pieces that belong to the basement itself; the admin can move them (the move is saved in the basement's furniture list under the same id, and wins over these spots) */
const LOBBY_BUILTIN: PlacedFurni[] = [
  { id: "lobby1", kind: "flappy", x: 0, y: 8, dir: 0 }, { id: "lobby2", kind: "dumpster", x: 0, y: 10, dir: 2 }, { id: "lobby3", kind: "dumpster", x: 0, y: 6, dir: 2 },
  { id: "lobby5", kind: "dumpster", x: 0, y: 13, dir: 2 }, // (the left wall, between the Flappy machine and the roulette table; the live basement already had it moved here)
  // Russian roulette against the left wall at the far end: chair, two-tile table, chair along the wall (the way it stands in emil's room), and the gun rack on the table
  { id: "lobby6", kind: "rtable", x: 0, y: 16, dir: 2 }, { id: "lobby7", kind: "rchair", x: 0, y: 15, dir: 4 }, { id: "lobby8", kind: "rchair", x: 0, y: 18, dir: 0 },
  { id: "lobby9", kind: "gunrack", x: 0, y: 16, dir: 2 },
  // the ideas board hangs on the left wall between the bin and the roulette table
  { id: "lobby10", kind: "ideaboard", x: 0, y: 15, dir: 2 },
  // the security camera beside 6ixty, who stands at the back wall
  { id: "lobby11", kind: "seccam", x: 4, y: 0, dir: 2 },
  // the door to the hideouts, in the left wall at the far end of the basement, past the roulette table and bagmand (the hideout landlord stands two tiles up from it, see src/npc.ts)
  { id: "lobby12", kind: "hdoor", x: 0, y: 24, dir: 2 },
  // the sink for everybody (the player rooms have none any more): fills the watering can. The admin moves it where he wants it
  { id: "lobby13", kind: "sink", x: 0, y: 4, dir: 2 },
  // the wanted board next to the door to the hideouts
  { id: "lobby14", kind: "wantedboard", x: 0, y: 20, dir: 2 },
  // the blue notice board (the Discord): the admin writes on it, and moves it where he wants it
  { id: "lobby15", kind: "discordboard", x: 0, y: 2, dir: 2 },
  // the elevator to the streets (the admin moves it where he wants it, like the rest)
  { id: "lobby16", kind: "elevator", x: 0, y: 12, dir: 2 },
  // the jukebox on the back wall: a CD of yours for 50 blood, played for everybody in the basement
  { id: "lobby17", kind: "jukebox", x: 2, y: 0, dir: 4 },
  // the red door on the back wall, two tiles left of 6ixty (who stands at x 5)
  { id: "lobby18", kind: "reddoor", x: 3, y: 0, dir: 4 },
];
/** the pieces of the roulette corner (the private copy of the basement in the introduction has none) */
export const ROULETTE_KINDS: ReadonlySet<string> = new Set(["rtable", "rchair", "gunrack"]);
export function lobbyDef(extras: PlacedFurni[] = []): RoomDef {
  const streetsOn = streetsFlagOn() || import.meta.env.MODE === "emulator"; // (the elevator only stands there once the streets are open)
  const builtin = LOBBY_BUILTIN.filter((b) => b.id !== "lobby16" || streetsOn).map((b) => { const o = extras.find((e) => e.id === b.id); return o && Number.isFinite(o.x) && Number.isFinite(o.y) ? { ...b, x: o.x, y: o.y, dir: o.dir ?? 0 } : b; });
  return {
    id: LOBBY_ID,
    name: "Basement",
    ownerUid: null,
    ownerName: null,
    access: "open",
    w: 12,
    h: 26, // 12 wide, and 26 down the left wall (it was 12, then 16, then 20: tiles were added at the far end each time; 6 more now)
    theme: { ...GRIME_THEME },
    rug: null,
    // the Flappy Bird machine is part of the basement (it stands against the left wall, 8 tiles down from the back corner)
    furni: [...builtin, ...extras.filter((f) => FURNI_KINDS[f.kind] && !LOBBY_BUILTIN.some((b) => b.id === f.id))],
    doorX: DOOR_X,
    // the yellow door on the other side of 6ixty leads to the shop
    extraDoors: [{ x: 9, to: SHOP_ID, label: "Shop", yellow: true }, ...(MINES_OPEN || import.meta.env.MODE === "emulator" ? [{ x: 7, to: MINES_ID, label: "Mines", brown: true }] : [])],
  };
}

/** The private copy of the basement: the same room without the pieces the admin put in it, and its door leads back to your own room. */
export function tutDef(uid: string): RoomDef {
  const lobby = lobbyDef([]);
  return { ...lobby, id: tutRoomId(uid), doorTo: ownRoomId(uid), extraDoors: [], furni: lobby.furni.filter((f) => !ROULETTE_KINDS.has(f.kind) && f.kind !== "ideaboard" && f.kind !== "hdoor" && f.kind !== "jukebox") }; // (no roulette and no ideas board during the introduction)
}

/** Where the four daily pieces stand in the shop room (every piece is placed facing the same way, each in its own 3x3 corner). */
export const SHOP_SLOTS: Pt2[] = [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }];
export const SHOP_SIZE = 15;
export const DISPLAY_PREFIX = "shop_disp";
export const isDisplayPiece = (id: string) => id.startsWith(DISPLAY_PREFIX);

/** The mines: a dark cave room behind the brown door in the basement. Ore rocks to mine, an anvil to craft on, 6ixty with his wood and his iron balls (see src/shared/mines.ts). */
export const MINES_THEME: RoomTheme = { ...GRIME_THEME, floorA: "#4d4036", floorB: "#574a3f", wall: "#3f3731" };
export function minesDef(): RoomDef {
  return {
    id: MINES_ID, name: "Mines", ownerUid: null, ownerName: null, access: "open", w: MINES_W, h: MINES_H,
    theme: { ...MINES_THEME }, rug: null, furni: MINES_PIECES.map((p) => ({ id: p.id, kind: p.kind, x: p.x, y: p.y, dir: p.dir })), doorX: DOOR_X, doorTo: LOBBY_ID,
  };
}

// ---- the streets (see shared/streets.ts) ------------------------------------------------------------------------------
/** The arrival room: the size of a medium player room, an ordinary look until the admin sends a texture. The elevator back is on the back wall, the door to the streets beside it. */
export const ARRIVAL_ELEVATOR = { x: 2, y: 0, dir: 4 };
/** the remote bank stands on the back wall between the elevator and the door to the streets */
export const ARRIVAL_BANK = { x: 5, y: 0, dir: 4 };
export function arrivalDef(): RoomDef {
  return {
    id: ARRIVAL_ID, name: "Arrival", ownerUid: null, ownerName: null, access: "open", w: ARRIVAL_SIZE, h: ARRIVAL_SIZE,
    theme: { ...DEFAULT_THEME }, rug: null, furni: [{ id: "arrival_elevator", kind: "elevator", x: ARRIVAL_ELEVATOR.x, y: ARRIVAL_ELEVATOR.y, dir: ARRIVAL_ELEVATOR.dir }, { id: "arrival_bank", kind: "silo", x: ARRIVAL_BANK.x, y: ARRIVAL_BANK.y, dir: ARRIVAL_BANK.dir }],
    doorX: 8, doorTo: STREETS_ID,
  };
}
/** Night: dark blue-black asphalt, the buildings along the back wall. (The look is drawn by renderRoomShell: sidewalks, curbs, a yellow line, lit windows.) */
export const STREETS_THEME: RoomTheme = { floorA: "#2a2d33", floorB: "#2f3238", wall: "#2a2326", rug: false, rugColor: "#000000", style: "street" };
export function streetsDef(over?: Record<string, StreetOverride> | null): RoomDef {
  return {
    id: STREETS_ID, name: "The streets", ownerUid: null, ownerName: null, access: "open", w: STREETS_W, h: STREETS_H,
    theme: { ...STREETS_THEME }, rug: null, furni: mergeStreetPieces(over).filter(([, kind]) => FURNI_KINDS[kind]).map(([id, kind, x, y, dir]) => ({ id, kind, x, y, dir })), doorX: 2, doorTo: ARRIVAL_ID,
  };
}
export { ARRIVAL_ID, STREETS_ID };

/** The shop: a big white room with the wardrobe on the back wall and today's four pieces standing on the floor. */
export function shopDef(picks: string[], raffleKind?: string): RoomDef {
  const furni: PlacedFurni[] = [
    { id: "shop_wardrobe", kind: "wardrobe", x: 5, y: 0, dir: 4 }, { id: "shop_vending", kind: "vending", x: 8, y: 0, dir: 4 },
    // the landlord's counter in the right corner: he stands behind it (see LANDLORD in npc.ts)
    { id: "shop_counter", kind: "counter", x: 13, y: 1, dir: 2 },
    // a poster on the back wall between the vending machine and the landlord: tap it to buy one
    { id: "shop_poster", kind: "shopposter", x: 10, y: 0, dir: 4 },
    // the record table on the left (a grey turntable table): mystery CDs, the album and the Freakme CD
    { id: "shop_table", kind: "vinyltable", x: 0, y: 6, dir: 4 }, { id: "shop_records", kind: "recordplayer", x: 0, y: 6, dir: 4 },
    // the Ducky machine along the same wall, two tiles further down
    { id: "shop_ducky", kind: "ducky", x: 0, y: 8, dir: 2 },
    // the raffle machine further down the same wall, on a marble block; the rare piece it gives away stands beside it
    // the pet merchant: a basket on the right-hand wall
    { id: "shop_raffle_table", kind: "raffletable", x: 0, y: 11, dir: 2 }, { id: "shop_raffle", kind: "gacha", x: 0, y: 11, dir: 0 },
  ];
  if (raffleKind && FURNI_KINDS[raffleKind]) {
    const dir = SHOP_PIECES.find((p) => SHOP_KIND_PREFIX + p.id === raffleKind)?.showDir ?? 2;
    furni.push({ id: RAFFLE_PRIZE_ID, kind: raffleKind, x: 0, y: Math.min(13, SHOP_SIZE - footprint(raffleKind, dir).h), dir }); // (two tiles along the wall from the machine; a long piece is pulled back so it fits in the room)
  }
  picks.slice(0, 4).forEach((kind, i) => {
    if (!FURNI_KINDS[kind]) return;
    const slot = SHOP_SLOTS[i];
    const dir = SHOP_PIECES.find((p) => SHOP_KIND_PREFIX + p.id === kind)?.showDir ?? 2;
    const fp = footprint(kind, dir);
    furni.push({ id: DISPLAY_PREFIX + i, kind, x: slot.x + Math.floor((3 - fp.w) / 2), y: slot.y + Math.floor((3 - fp.h) / 2), dir });
  });
  return {
    id: SHOP_ID, name: "Shop", ownerUid: null, ownerName: null, access: "open", w: SHOP_SIZE, h: SHOP_SIZE,
    theme: { floorA: "#e6e2d8", floorB: "#efece4", wall: "#f3f3f3", rug: false, rugColor: "#000000" },
    rug: null, furni, doorX: DOOR_X, doorTo: LOBBY_ID,
  };
}

/** The built-in lobby pieces can't be picked up; the ones the admin added can. */
export const isFixedLobbyPiece = (id: string) => /^lobby\d+$/.test(id) || id === BED_ID || id === BAG_ID || id === TOOLBOX_ID || id === SINK_ID || id === BOOMBOX_ID || id === STASH_ID || id.startsWith("shop_");

export function watchLobbyFurni(cb: (extras: PlacedFurni[]) => void): Unsubscribe {
  return onValue(ref(db, "lobby/furni"), (s) => {
    const raw = (s.val() ?? {}) as Record<string, { kind: string; x: number; y: number; dir?: number }>;
    cb(Object.entries(raw).map(([id, f]) => ({ id, kind: f.kind, x: f.x, y: f.y, dir: f.dir })));
  }, () => cb([]));
}

// ---- the bed -----------------------------------------------------------------------------------------------
/** Where the (fixed) bed sits in every player room, and which way it faces. It lies along the back-right wall, clear of the door. */
export const BED_ID = "bed";
export const BED = { x: 3, y: 0, dir: 2 };
/** The bag of clothes sits in the far right corner, next to the bed. */
export const BAG_ID = "bag";
export const BAG = { x: 7, y: 0, dir: 2 };
/** The toolbox starts between the bed and the bag. */
export const STASH_ID = "stashbox";
export const COMPUTER_ID = "computer";
export const CHEST_ID = "chest";
export const TOOLBOX_ID = "toolbox";
export const TOOLBOX = { x: 6, y: 0, dir: 4 };
/** The sink starts in the far left corner of the room, facing the camera. */
export const BOOMBOX_ID = "boombox";
export const BOOMBOX = { x: 0, y: 3, dir: 4 };

export const SINK_ID = "sink";
export const SINK = { x: 0, y: 7, dir: 4 };
/** The tile you stand on when you get out of bed (and where you start every login). */
export const BED_SIDE = { x: 4, y: 1 };
/** The tile the sleeper's head is on (the end of the bed by the pillow). */
export const BED_HEAD = { x: 3, y: 0 };

export interface RoomMeta {
  owner: string;
  ownerName: string;
  name: string;
  
  access: Access | "friends" | "invite";
  w: number;
  h: number;
  /** a hideout: its size level, whether building is locked for the members, who is in, the shared box, the orders on the way, the computer */
  level?: number;
  lock?: boolean;
  desc?: string;
  ad?: string;
  listed?: boolean;
  boostUntil?: number;
  members?: Record<string, { name?: string; build?: boolean; grow?: boolean; stash?: boolean }>;
  box?: Record<string, Record<string, number>>;
  orders?: Record<string, { kind?: string; by?: string; doneAt?: number }>;
  bought?: Record<string, number>;
  computer?: { x: number; y: number; dir?: number };
  theme?: Partial<RoomTheme>;
  furni?: Record<string, { kind: string; x: number; y: number; dir?: number; plantedAt?: number; wateredAt?: number; neglect?: boolean; crop?: string; auto?: boolean; up?: boolean | number; img?: string; mixJob?: { doneAt?: number; ms?: number; item?: string }; st?: number }>;
  /** where the owner moved the fixed pieces to (the bed can't be turned, so only its x/y count) */
  bed?: { x: number; y: number; dir?: number };
  bag?: { x: number; y: number; dir?: number };
  toolbox?: { x: number; y: number; dir?: number };
  /** only there once the landlord has sold you one (the server writes where it first stands) */
  stashbox?: { x: number; y: number; dir?: number };
  sink?: { x: number; y: number; dir?: number };
  chest?: { x: number; y: number; dir?: number };
  boombox?: { x: number; y: number; dir?: number; /** taken out of the room (it is in somebody's pocket as f_boombox) */ gone?: boolean };
  /** the looks bought from the landlord (the server writes these): ids from shared/skins.ts */
  skins?: { bed?: string; bag?: string };
}

/** The tile the sleeper's head is on (the pillow end of the bed), and the tile beside the bed you step out onto. */
export const bedHead = (bed: { x: number; y: number }) => ({ x: bed.x, y: bed.y });
export const bedSide = (bed: { x: number; y: number }) => ({ x: bed.x + 1, y: bed.y + 1 });

/** the kind a fixed piece is drawn as: the plain one, or the look the player bought */
const skinKind = (part: "bed" | "bag", skin: string | undefined): string => (skin && FURNI_KINDS[part + "_" + skin] ? part + "_" + skin : part);

/** a hideout: like a player room but bigger, with a computer instead of a bed and a wardrobe; its door leads back to the basement */
function hideoutDef(id: string, meta: RoomMeta): RoomDef {
  // a hideout looks like the basement (the old plain grey hideouts, which nobody has recoloured, get the basement's look too)
  const stored = (meta.theme ?? {}) as Partial<RoomTheme>;
  const oldDefault = stored.floorA === "#6f6a63" && stored.wall === "#8b9096" && !stored.floorTex && !stored.wallTex;
  const theme: RoomTheme = { ...GRIME_THEME, ...(oldDefault ? {} : stored) };
  const furni: PlacedFurni[] = Object.entries(meta.furni ?? {})
    .filter(([, f]) => FURNI_KINDS[f.kind] && !FURNI_KINDS[f.kind].fixed)
    .map(([fid, f]) => ({ id: fid, kind: f.kind, x: f.x, y: f.y, dir: f.dir, ...(typeof (f as any).by === "string" ? { by: (f as any).by as string } : {}), ...(typeof f.img === "string" ? { img: f.img } : {}), ...(typeof f.st === "number" ? { st: f.st } : {}), ...(typeof f.mixJob?.doneAt === "number" ? { mix: { doneAt: f.mixJob.doneAt, ms: Number(f.mixJob.ms) || 600_000, ...(typeof f.mixJob.item === "string" ? { item: f.mixJob.item } : {}) } } : {}), ...(typeof f.plantedAt === "number" ? { plant: { at: f.plantedAt, water: typeof f.wateredAt === "number" ? f.wateredAt : f.plantedAt, neglect: !!f.neglect, ...(f.crop ? { crop: f.crop } : {}), ...(f.auto ? { auto: true } : {}) } } : {}), ...(f.auto ? { auto: true } : {}), ...(f.up ? { up: f.up === 2 ? 2 : 1 } : {}) }));
  const at = (m: { x: number; y: number; dir?: number } | undefined, d: { x: number; y: number; dir: number }) => (m && Number.isFinite(m.x) && Number.isFinite(m.y) ? { x: m.x, y: m.y, dir: m.dir ?? d.dir } : d);
  const toolbox = at(meta.toolbox, { x: 6, y: 0, dir: 2 }), sink = at(meta.sink, { x: 0, y: 7, dir: 2 }), boombox = at(meta.boombox, { x: 0, y: 3, dir: 2 }), computer = at(meta.computer, { x: 4, y: 0, dir: 2 }), chest = at(meta.chest, { x: 8, y: 0, dir: 2 });
  furni.unshift({ id: TOOLBOX_ID, kind: "toolbox", x: toolbox.x, y: toolbox.y, dir: toolbox.dir }, { id: COMPUTER_ID, kind: "hcomputer", x: computer.x, y: computer.y, dir: computer.dir }, { id: SINK_ID, kind: "sink", x: sink.x, y: sink.y, dir: sink.dir }, { id: CHEST_ID, kind: "hchest", x: chest.x, y: chest.y, dir: chest.dir }, ...(meta.boombox?.gone ? [] : [{ id: BOOMBOX_ID, kind: "boombox", x: boombox.x, y: boombox.y, dir: boombox.dir }]));
  const side = (n: unknown) => (typeof n === "number" && n >= 8 && n <= 24 ? Math.floor(n) : 14);
  const w = side(meta.w), h = side(meta.h);
  const level = typeof meta.level === "number" ? meta.level : levelOfSize(w);
  const rug: RugRect | null = theme.rug ? { x0: Math.floor((w - 6) / 2), y0: Math.floor((h - 6) / 2), w: 6, h: 6 } : null;
  const members: HideoutInfo["members"] = {};
  for (const [uid, m] of Object.entries(meta.members ?? {})) members[uid] = { name: String(m?.name ?? "?"), build: m?.build !== false, grow: m?.grow !== false, stash: m?.stash !== false };
  const orders: HideoutInfo["orders"] = {};
  for (const [oid, o] of Object.entries(meta.orders ?? {})) if (o && typeof o.kind === "string" && typeof o.by === "string") orders[oid] = { kind: o.kind, by: o.by, doneAt: Number(o.doneAt) || 0 };
  return { id, name: meta.name, ownerUid: meta.owner, ownerName: meta.ownerName, access: "none", w, h, theme, rug, furni, doorX: DOOR_X, doorTo: LOBBY_ID, hideout: { bought: Object.fromEntries(Object.entries(meta.bought ?? {}).filter(([, n]) => Number.isFinite(Number(n))).map(([k, n]) => [k, Number(n)])), level, lock: meta.lock === true, desc: String(meta.desc ?? ""), ad: String(meta.ad ?? ""), listed: meta.listed !== false, boostUntil: Number(meta.boostUntil) || 0, open: meta.access === "open", members, box: meta.box ?? {}, orders, cap: HIDEOUT_MAX_FURNI[Math.min(level, HIDEOUT_MAX_FURNI.length - 1)] } };
}

export function defFromMeta(id: string, meta: RoomMeta): RoomDef {
  if (isHideoutId(id)) return hideoutDef(id, meta);
  const theme: RoomTheme = { ...DEFAULT_THEME, ...(meta.theme ?? {}) };
  // furniture of kinds that no longer exist (the old test cubes) is ignored; the bed is always there
  const furni: PlacedFurni[] = Object.entries(meta.furni ?? {})
    .filter(([, f]) => FURNI_KINDS[f.kind] && !FURNI_KINDS[f.kind].fixed)
    .map(([fid, f]) => ({ id: fid, kind: f.kind, x: f.x, y: f.y, dir: f.dir, ...(typeof f.img === "string" ? { img: f.img } : {}), ...(typeof f.st === "number" ? { st: f.st } : {}), ...(typeof f.mixJob?.doneAt === "number" ? { mix: { doneAt: f.mixJob.doneAt, ms: Number(f.mixJob.ms) || 600_000, ...(typeof f.mixJob.item === "string" ? { item: f.mixJob.item } : {}) } } : {}), ...(typeof f.plantedAt === "number" ? { plant: { at: f.plantedAt, water: typeof f.wateredAt === "number" ? f.wateredAt : f.plantedAt, neglect: !!f.neglect, ...(f.crop ? { crop: f.crop } : {}), ...(f.auto ? { auto: true } : {}) } } : {}), ...(f.auto ? { auto: true } : {}), ...(f.up ? { up: f.up === 2 ? 2 : 1 } : {}) }));
  const at = (m: { x: number; y: number; dir?: number } | undefined, d: { x: number; y: number; dir: number }) => (m && Number.isFinite(m.x) && Number.isFinite(m.y) ? { x: m.x, y: m.y, dir: m.dir ?? d.dir } : d);
  const bed = at(meta.bed, BED), bag = at(meta.bag, BAG), toolbox = at(meta.toolbox, TOOLBOX), sink = at(meta.sink, SINK), boombox = at(meta.boombox, BOOMBOX);
  furni.unshift({ id: BED_ID, kind: skinKind("bed", meta.skins?.bed), x: bed.x, y: bed.y, dir: BED.dir }, { id: BAG_ID, kind: skinKind("bag", meta.skins?.bag), x: bag.x, y: bag.y, dir: bag.dir }, { id: TOOLBOX_ID, kind: "toolbox", x: toolbox.x, y: toolbox.y, dir: toolbox.dir }, ...(meta.boombox?.gone ? [] : [{ id: BOOMBOX_ID, kind: "boombox", x: boombox.x, y: boombox.y, dir: boombox.dir }]), ...(meta.stashbox && Number.isFinite(meta.stashbox.x) && Number.isFinite(meta.stashbox.y) ? [{ id: STASH_ID, kind: "stashbox", x: meta.stashbox.x, y: meta.stashbox.y, dir: meta.stashbox.dir ?? 2 }] : []));
  // the landlord makes rooms bigger (the server writes w and h)
  const side = (n: unknown) => (typeof n === "number" && n >= ROOM_W && n <= 14 ? Math.floor(n) : ROOM_W);
  const w = side(meta.w), h = side(meta.h);
  const rug: RugRect | null = theme.rug
    ? { x0: Math.floor((w - 4) / 2), y0: Math.floor((h - 4) / 2), w: 4, h: 4 }
    : null;
  return { id, name: meta.name, ownerUid: meta.owner, ownerName: meta.ownerName, access: normAccess(meta.access), w, h, theme, rug, furni, doorX: DOOR_X };
}

// ---- database helpers ----------------------------------------------------------------
const metaRef = (id: string) => ref(db, `roomsMeta/${id}`);

export async function fetchMeta(id: string): Promise<RoomMeta | null> {
  const snap = await get(metaRef(id));
  return snap.exists() ? (snap.val() as RoomMeta) : null;
}

export function watchMeta(id: string, cb: (meta: RoomMeta | null) => void, onError?: () => void): Unsubscribe {
  return onValue(metaRef(id), (s) => cb(s.exists() ? (s.val() as RoomMeta) : null), onError);
}

export function watchAllRooms(cb: (rooms: Record<string, RoomMeta>) => void): Unsubscribe {
  return onValue(ref(db, "roomsMeta"), (s) => cb((s.val() ?? {}) as Record<string, RoomMeta>));
}

/** The room every new player wakes up in: same size for everyone, plain floor and walls, only the bed. */
export const STARTER_THEME: RoomTheme = { floorA: "#8d7a5f", floorB: "#95826a", wall: "#a8aeb0", rug: false, rugColor: "#c9544f" };

export async function createRoom(p: Profile): Promise<string> {
  const id = ownRoomId(p.uid);
  const meta: RoomMeta = {
    owner: p.uid,
    ownerName: p.name,
    name: `${p.name}'s room`.slice(0, 28),
    access: "knock",
    w: ROOM_W,
    h: ROOM_H,
    theme: { ...STARTER_THEME },
  };
  await set(metaRef(id), meta);
  return id;
}

export const updateRoom = (id: string, patch: Record<string, unknown>) => update(metaRef(id), patch);

/** Furniture of the public room lives under lobby/furni (admin only); everyone else's under their room. */
const furniPathOf = (roomId: string) => (roomId === LOBBY_ID ? "lobby/furni" : roomId === STREETS_ID ? "streets/furni" : `roomsMeta/${roomId}/furni`);

export async function placeFurni(id: string, kind: string, x: number, y: number, dir = 0): Promise<void> {
  const f = push(ref(db, furniPathOf(id)));
  await set(f, dir ? { kind, x, y, dir } : { kind, x, y });
}

/** takes a piece out of the room (the admin, in the basement or the street): one of the street's built-in pieces is marked as removed, the rest are deleted */
export const removeFurni = (id: string, fid: string) => (id === STREETS_ID && isBuiltInStreetPiece(fid) ? set(ref(db, `streets/furni/${fid}`), { removed: true }) : remove(ref(db, `${furniPathOf(id)}/${fid}`)));

/** what the admin has changed in the street, as it is stored (see mergeStreetPieces) */
export function watchStreetsFurni(cb: (over: Record<string, StreetOverride>) => void): Unsubscribe {
  return onValue(ref(db, "streets/furni"), (s) => cb((s.val() ?? {}) as Record<string, StreetOverride>), () => cb({}));
}

/** Can this player walk straight in? Mirrors the database rules so we can say no politely instead of failing.
 *  Open rooms and friends' rooms: yes. Anyone else needs to be let in (a roomInvites entry), which a knock asks for. */
/** is a player with one of bagmand's hits standing in this room right now? Then it is open to everybody (see server/src/actions/bounty.ts). */
export async function isWantedRoomLive(room: string): Promise<boolean> {
  try {
    const v = (await get(ref(db, `wantedRooms/${room}`))).val() as { until?: number } | null;
    if (!!v && typeof v.until === "number" && v.until > Date.now()) return true;
    if (room.startsWith("u_")) { // a player with a hit on them who logged out is asleep in their own room: it is open to whoever comes for the hit
      const uid = room.slice(2);
      const [t, p] = await Promise.all([get(ref(db, `hitTargets/${uid}/until`)), get(ref(db, `presence/${uid}`))]);
      return Number(t.val()) > Date.now() && !p.exists();
    }
    return false;
  } catch { return false; }
}

export async function canEnter(meta: RoomMeta, uid: string, friendUids: Set<string>, trespass = false): Promise<boolean> {
  if (meta.owner === uid || meta.access === "open" || trespass) return true; // (trespass: a shroom or DMT is working)
  if (await isWantedRoomLive(`u_${meta.owner}`)) return true; // (a wanted player is in there: nobody can hide)
  if (meta.access !== "none" && friendUids.has(meta.owner)) return true;
  const inv = await get(ref(db, `roomInvites/u_${meta.owner}/${uid}`));
  return inv.exists();
}
