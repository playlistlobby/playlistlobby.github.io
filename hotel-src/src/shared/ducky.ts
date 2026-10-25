// The Ducky machine in the shop: things you buy with real money (øre: 100 øre = 1 kr). Pure data: the browser and the server both use it.
// While the machine is in test mode (the local server) a buy goes straight through without paying; paying through Stripe comes when it is published.

/** while true the machine is a test version: nothing is charged (the server only sells on the local emulators). Set to false when Stripe is wired in. */
export const DUCKY_TEST_MODE = true;

export type DuckyProduct = "starter" | "color" | "fx" | "rename";

export interface DuckyDef {
  id: DuckyProduct;
  /** the price in øre */
  ore: number;
  /** can only be bought once (the key in `owned`) */
  once?: string;
}

export const DUCKY_PRODUCTS: DuckyDef[] = [
  { id: "starter", ore: 3000, once: "ducky_starter" },
  { id: "color", ore: 2000, once: "ducky_color" },
  { id: "fx", ore: 2000, once: "ducky_fx" },
  { id: "rename", ore: 1000 },
];
export const duckyDef = (id: unknown): DuckyDef | undefined => DUCKY_PRODUCTS.find((p) => p.id === id);

/** the starter package: 3 growing kits, 3 mixers and 50 blood (it takes six free pocket slots) */
export const DUCKY_STARTER = { items: [{ item: "f_planter", qty: 3 }, { item: "f_mixer", qty: 3 }], blood: 50 };

/** the effects of the chat tool: the way the text moves, and the colours it can have */
export const CHAT_EFFECTS = ["shake", "wave", "rainbow", "pulse", "big"] as const;
export type ChatEffect = (typeof CHAT_EFFECTS)[number];
export const CHAT_COLORS = ["#ff3b3b", "#ff9f1c", "#ffe14d", "#46d369", "#33c7ff", "#6a7bff", "#c45bff", "#ff6bd6", "#ffffff", "#111111"] as const;
export const isHexColor = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
export const isChatEffect = (v: unknown): v is ChatEffect => typeof v === "string" && (CHAT_EFFECTS as readonly string[]).includes(v);

/** a name colour that can be read on the dark name plates (a very dark one is turned away) */
export function readableOnDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b >= 70;
}

/** the new name for a rename (the same rules as signing up) */
export const NEW_NAME_RE = /^[A-Za-z0-9_.-]{3,16}$/;
export const RESERVED_NAMES: ReadonlySet<string> = new Set(["adminsidia", "admin", "administrator", "moderator", "staff", "6ixplanet", "6ixty"]);

/** øre -> "1 kr" / "2,50 kr" */
export const kr = (ore: number): string => `${(ore / 100).toLocaleString("da-DK", { minimumFractionDigits: ore % 100 ? 2 : 0 })} kr`;
