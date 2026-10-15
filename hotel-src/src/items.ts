import { assetUrl } from "./assetUrl";
import { FURNI_KINDS } from "./rooms";
import { loadNitro } from "./nitro";
import { DISABLED_ITEMS, ITEM_ID_LIST, parseInventoryWith } from "./shared/items";
export {
  combine, DEFAULT_ITEM_PRICE, DISABLED_ITEMS, emptyInventory, findSlot, findSlotAny, GROW_MS, growMsOf, INV_COLS, INV_SIZE, isFurniItem, ITEM_DEFAULTS,
  MUSIC_ACCESS_KEY, MUSIC_ACCESS_PRICE, SIXTY_STOCK, SMOKABLE, SMOKE_MS, smokeMsOf, STACKABLE, START_BLOOD, VENDING_STOCK, WATER_MS,
} from "./shared/items";
export type { InvItem, Inventory } from "./shared/items";
import { isFurniItem } from "./shared/items";

// Old-school-RuneScape-style items. Inventory slots hold an item id + quantity.
export interface ItemDef {
  id: string;
  name: string;
  examine: string;
  icon: string;
  /** what "Use" does when this item is selected and you click a player */
  useOnPlayer?: "stab";
  /** furniture kind this item can be used on (e.g. a CD on the CD player, the watering can on the sink) */
  useOnObject?: string;
  /** used on yourself with one click (the syringe, a cigarette) */
  useSelf?: "syringe" | "smoke" | "pill" | "eat" | "consume";
  /** select it, then click a piece of furniture of this kind (the sink, the growing kit) */
  /** can be dropped from the inventory (right-click > Drop) */
  droppable?: boolean;
  /** select the knife, then click this: it can be cut open for blood (the dead cat) */
  carvable?: boolean;
  /** a piece of furniture: select it, then click a free spot in your own room to put it down */
  furniture?: boolean;
  /** picture while it's lit (the cigarette: the plain icon is the unlit one) */
  litIcon?: string;
}

export const ITEMS: Record<string, ItemDef> = {
  weedseed: {
    id: "weedseed",
    name: "Weed seed",
    examine: "A little seed from the bin. Select it, then click your growing kit to plant it. It grows in 10 minutes and needs one watering (any time).",
    icon: assetUrl("items/weedseed.svg"),
    useOnObject: "f_planter",
  },
  weed: {
    id: "weed",
    name: "Weed",
    examine: "A bud. Select it, then click joint paper or a blunt wrap to roll it, or a cigarette to crumble it in.",
    icon: assetUrl("items/weed.svg"),
  },
  mix: {
    id: "mix",
    name: "Weed mix",
    examine: "Tobacco and weed mixed together (made in the mixer). It works like weed: roll it in joint paper or a blunt wrap.",
    icon: assetUrl("items/mix.svg"),
  },
  midweed: {
    id: "midweed",
    name: "Mid weed",
    examine: "Good weed and bad weed mixed together: not great, not terrible. Roll it in joint paper or a blunt wrap.",
    icon: assetUrl("items/midweed.svg"),
  },
  thca: {
    id: "thca",
    name: "THC-A",
    examine: "Weed with a pill ground into it. Roll it and smoke it: for 2 minutes you walk twice as fast and stabs give double blood.",
    icon: assetUrl("items/thca.svg"),
  },
  researchchem: {
    id: "researchchem",
    name: "Research chemical",
    examine: "A pill ground into tobacco. Roll it and smoke it: you walk twice as fast and stab for double blood for 2 minutes, and for 30 seconds you flash and smoke pours off you.",
    icon: assetUrl("items/researchchem.svg"),
  },
  jointpaper: {
    id: "jointpaper",
    name: "Joint paper",
    examine: "Rolling paper. Select weed (or mix), then click the paper to roll a joint.",
    icon: assetUrl("items/jointpaper.svg"),
  },
  bluntwrap: {
    id: "bluntwrap",
    name: "Blunt wrap",
    examine: "A tobacco leaf wrap. Select weed (or mix), then click the wrap to roll a blunt.",
    icon: assetUrl("items/bluntwrap.svg"),
  },
  joint: {
    id: "joint",
    name: "Joint",
    examine: "A joint. Click it to light up (you need a lighter). Once it's finished, stabbing gives triple blood for 2 minutes.",
    icon: assetUrl("items/joint.svg"),
    useSelf: "smoke",
  },
  blunt: {
    id: "blunt",
    name: "Blunt",
    examine: "A fat blunt. Click it to light up (you need a lighter). Once it's finished, stabbing gives four times the blood for 3 minutes.",
    icon: assetUrl("items/blunt.svg"),
    useSelf: "smoke",
  },
  joint_mid: {
    id: "joint_mid",
    name: "Mid joint",
    examine: "A joint rolled from mid weed. Click it to light up (you need a lighter). Stabs give double blood for 2 minutes.",
    icon: assetUrl("items/joint_mid.svg"),
    useSelf: "smoke",
  },
  joint_thca: {
    id: "joint_thca",
    name: "THC-A joint",
    examine: "A joint of thc-a. Click it to light up (you need a lighter). For 2 minutes you walk twice as fast and stabs give double blood.",
    icon: assetUrl("items/joint_thca.svg"),
    useSelf: "smoke",
  },
  joint_chem: {
    id: "joint_chem",
    name: "Research joint",
    examine: "A joint of research chemical. Light it up: after 5 seconds you get 90 seconds of double speed and double blood, and you flash while smoke pours off you.",
    icon: assetUrl("items/joint_chem.svg"),
    useSelf: "smoke",
  },
  blunt_mid: {
    id: "blunt_mid",
    name: "Mid blunt",
    examine: "A blunt rolled from mid weed. Click it to light up (you need a lighter). Stabs give double blood for 2 minutes.",
    icon: assetUrl("items/blunt_mid.svg"),
    useSelf: "smoke",
  },
  blunt_thca: {
    id: "blunt_thca",
    name: "THC-A blunt",
    examine: "A blunt of thc-a. Click it to light up (you need a lighter). For 2 minutes you walk twice as fast and stabs give double blood.",
    icon: assetUrl("items/blunt_thca.svg"),
    useSelf: "smoke",
  },
  blunt_chem: {
    id: "blunt_chem",
    name: "Research blunt",
    examine: "A blunt of research chemical. Light it up: after 5 seconds you get 90 seconds of double speed and double blood, and you flash while smoke pours off you.",
    icon: assetUrl("items/blunt_chem.svg"),
    useSelf: "smoke",
  },
  kodimagnyl: {
    id: "kodimagnyl",
    name: "Kodimagnyl",
    examine: "Mix with water",
    icon: assetUrl("items/kodimagnyl.svg"),
  },
  codeine: {
    id: "codeine",
    name: "Codeine",
    examine: "The lean. Drink it: for an hour garbage cans give twice as much and can be searched twice as often. You hold the cup for 2 minutes.",
    icon: assetUrl("items/codeine.svg"),
    useSelf: "consume",
  },
  superpill: {
    id: "superpill",
    name: "Fentanyl",
    examine: "A pill pressed together with kodimagnyl. Swallow it and you run 4 times faster for a minute.",
    icon: assetUrl("items/superpill.svg"),
    useSelf: "consume",
  },
  tobacco: {
    id: "tobacco",
    name: "Tobacco",
    examine: "Two cigarette butts, picked apart. Mix it like a cigarette, or select it and click joint paper to roll a cigarette, or blunt paper to roll a cigar.",
    icon: assetUrl("items/tobacco.svg"),
  },
  cigar: {
    id: "cigar",
    name: "Cigar",
    examine: "Tobacco rolled in blunt paper. Click it to light up (you need a lighter): it smokes like a cigarette, and it mixes like one too.",
    icon: assetUrl("items/cigar.svg"),
    useSelf: "smoke",
  },
  hash: {
    id: "hash",
    name: "Hash",
    examine: "Ass weed pressed together with kodimagnyl. Mix it with a cigarette in the mixer to get hash mix.",
    icon: assetUrl("items/hash.svg"),
  },
  hashmix: {
    id: "hashmix",
    name: "Hash mix",
    examine: "Hash crumbled into tobacco. Select it, then click joint paper to roll a hash joint.",
    icon: assetUrl("items/hashmix.svg"),
  },
  joint_hash: {
    id: "joint_hash",
    name: "Hash joint",
    examine: "A joint rolled from hash mix. Click it to light up (you need a lighter). Hearts float over your head while you smoke, and stabs give triple blood for 2 minutes.",
    icon: assetUrl("items/joint_hash.svg"),
    useSelf: "smoke",
  },
  chudmix: {
    id: "chudmix",
    name: "Chud mix",
    examine: "A shroom chopped into weed (made in the mixer). Roll it in joint paper or a blunt wrap like weed.",
    icon: assetUrl("items/chudmix.svg"),
  },
  joint_chud: {
    id: "joint_chud",
    name: "Chud joint",
    examine: "A spotted joint rolled from chud mix. Click it to light up (you need a lighter). Green smoke: the weed high and the shroom high together (stabs give triple blood for 2 minutes, and every door opens for 3).",
    icon: assetUrl("items/joint_chud.svg"),
    useSelf: "smoke",
  },
  blunt_chud: {
    id: "blunt_chud",
    name: "Chud blunt",
    examine: "A spotted blunt rolled from chud mix. Click it to light up (you need a lighter). Green smoke: the weed high and the shroom high together (stabs give 4x blood for 3 minutes, and every door opens for 3).",
    icon: assetUrl("items/blunt_chud.svg"),
    useSelf: "smoke",
  },
  shroomspore: {
    id: "shroomspore",
    name: "Shroom spores",
    examine: "A pinch of spores. Select them, then click a growing kit to plant them. Shrooms are ready after 25 minutes (water them once, any time).",
    icon: assetUrl("items/shroomspore.svg"),
    useOnObject: "f_planter",
  },
  shroom: {
    id: "shroom",
    name: "Shroom",
    examine: "A shroom. Eat it: the world gets a little strange, and for 3 minutes you can walk into anyone's room, online or offline.",
    icon: assetUrl("items/shroom.png"),
    useSelf: "consume",
  },
  dmt: {
    id: "dmt",
    name: "DMT",
    examine: "A shroom pressed into a pill: yellow. Swallow it: the world fills with patterns and you lie down for 10 seconds. Then, for 4 minutes, you run twice as fast and can walk into anyone's room.",
    icon: assetUrl("items/dmt.svg"),
    useSelf: "consume",
  },
  wateringcan: {
    id: "wateringcan",
    name: "Watering can",
    examine: "Water the shit you grow",
    icon: assetUrl("items/wateringcan.svg"),
    useOnObject: "sink",
  },
  wateringcan_full: {
    id: "wateringcan_full",
    name: "Watering can (full)",
    examine: "A full watering can. Select it, then click a planted growing kit to water the plant.",
    icon: assetUrl("items/wateringcan_full.svg"),
    useOnObject: "f_planter",
  },
  burger: {
    id: "burger",
    name: "Burger",
    examine: "A burger out of the bin. It's still warm. Click it to eat it.",
    icon: assetUrl("items/burger.svg"),
    useSelf: "eat",
  },
  pill: {
    id: "pill",
    name: "Pill",
    examine: "A red and white pill",
    icon: assetUrl("items/pill.svg"),
    useSelf: "pill",
  },
  syringe: {
    id: "syringe",
    name: "Syringe",
    examine: "A clean syringe. Click it to draw blood from yourself, or click a body bag with it: 1 drop from each, once every 20 minutes.",
    icon: assetUrl("items/syringe.svg"),
    useSelf: "syringe",
  },
  cd: {
    id: "cd",
    name: "CD",
    examine: "freakme",
    icon: assetUrl("items/cd.png"),
    useOnObject: "cdplayer",
  },
  cd_yellow: {
    id: "cd_yellow",
    name: "Åhmingud",
    examine: "A yellow CD. Use it on a boombox: Åhmingud plays. It comes back when it's done.",
    icon: assetUrl("items/cd_yellow.png"),
    useOnObject: "cdplayer",
  },
  cd_green: {
    id: "cd_green",
    name: "Blodig oktober",
    examine: "A green CD. Use it on a boombox: Blodig oktober plays. It comes back when it's done.",
    icon: assetUrl("items/cd_green.png"),
    useOnObject: "cdplayer",
  },
  cd_blue: {
    id: "cd_blue",
    name: "Blod ud af næsen",
    examine: "A blue CD. Use it on a boombox: Blod ud af næsen plays. It comes back when it's done.",
    icon: assetUrl("items/cd_blue.png"),
    useOnObject: "cdplayer",
  },
  cd_album: {
    id: "cd_album",
    name: "Full album",
    examine: "A red CD with the whole album on it. Put it in a boombox and skip from song to song. It comes back when the last song is done.",
    icon: assetUrl("items/cd_red.png"),
    useOnObject: "cdplayer",
  },
  cigarette: {
    id: "cigarette",
    name: "Cigarette",
    examine: "A cigarette. Click it to light up: you hold it and smoke for a minute, then it's only a butt.",
    icon: assetUrl("items/cigarette.svg"),
    litIcon: assetUrl("items/cigarette-lit.svg"),
    useSelf: "smoke",
  },
  cigbutt: {
    id: "cigbutt",
    name: "Cigarette butt",
    examine: "What's left. Right-click it to drop it.",
    icon: assetUrl("items/cigbutt.svg"),
    droppable: true,
  },
  lighter: {
    id: "lighter",
    name: "Lighter",
    examine: "A cheap lighter. You need one to light a cigarette, joint or blunt. It lasts. Sold in the shop room's vending machine.",
    icon: assetUrl("items/lighter.png"),
  },
  knife: {
    id: "knife",
    name: "Knife",
    examine: "A small, sharp knife. Use it on another player: you can stab each person once a day, and every stab draws a drop of blood.",
    icon: assetUrl("items/knife.png"), // Habbo's survival knife (catalog icon of survival_c26_knife.nitro), as crisp pixels
    useOnPlayer: "stab",
  },
};

const furniIcons = new Map<string, string>();
const furniIconListeners = new Set<() => void>();
export const onFurniIcon = (fn: () => void): (() => void) => { furniIconListeners.add(fn); return () => furniIconListeners.delete(fn); };
const BLANK_ICON = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="6" y="12" width="20" height="14" rx="2" fill="#8a8f99"/><rect x="6" y="12" width="20" height="4" fill="#aab0ba"/></svg>');

/** The shop picture of a piece (the icon inside its .nitro), drawn once; shows a plain box until it's ready. */
export function furniIcon(kind: string): string {
  const got = furniIcons.get(kind);
  if (got) return got;
  furniIcons.set(kind, BLANK_ICON);
  const path = FURNI_KINDS[kind]?.nitro;
  if (path) {
    void loadNitro(path).then((n) => {
      if (!n) return;
      const key = Object.keys(n.json.spritesheet.frames).find((k) => /_icon_a(.png)?$/.test(k));
      const fr = key ? n.json.spritesheet.frames[key].frame : null;
      if (!fr) return;
      const c = document.createElement("canvas");
      c.width = fr.w; c.height = fr.h;
      c.getContext("2d")!.drawImage(n.image, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
      furniIcons.set(kind, c.toDataURL("image/png"));
      furniIconListeners.forEach((l) => l());
    }).catch(() => undefined);
  }
  return furniIcons.get(kind)!;
}

/** The definition of any inventory item: the fixed ones above, or a piece of furniture. */
export function itemDef(id: string): ItemDef | undefined {
  if (ITEMS[id]) return ITEMS[id];
  const k = FURNI_KINDS[id];
  if (!k || !isFurniItem(id)) return undefined;
  if (id === "f_poster") return { id, name: k.label, examine: "A poster for your wall. When you hang it you choose the picture, and the picture stays on it. Only on a wall.", icon: assetUrl("items/poster.svg"), furniture: true };
  return { id, name: k.label, examine: id === "f_planter" ? "Grow some shit" : id === "f_mixer" ? "Mix some shit" : `${k.label}: furniture. Click it, then a free spot in your own room to put it down. Your toolbox can also store it.`, icon: furniIcon(id), furniture: true };
}

/** The inventory from what the database holds: only items that exist (and aren't switched off) are kept. */
export function parseInventory(raw: unknown): import("./shared/items").Inventory {
  return parseInventoryWith(raw, (id) => !!itemDef(id) && !DISABLED_ITEMS.has(id));
}

/** A drop of blood is the hotel's currency. */
export const BLOOD_ICON = assetUrl("items/blood.svg");

// every ordinary item has a picture and a text here (the list of ids lives in shared/items.ts)
for (const id of ITEM_ID_LIST) if (!ITEMS[id]) console.warn("item without a definition:", id);
