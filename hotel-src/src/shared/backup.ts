// Backups, the blood ledger and rollbacks: what is saved, how long, and what the sources of blood are called. Shared by the server and the admin app.

/** A backup of everything the server owns is taken about every 20 minutes (the Durable Object's alarm runs every 10 minutes) and kept for 12 hours. */
export const BACKUP_EVERY_MS = 15 * 60_000;
export const BACKUP_KEEP_MS = 12 * 3_600_000;
/** Blood ledger entries (who got or spent blood, from what) are kept for 3 days, in one bucket per hour. */
export const LEDGER_KEEP_MS = 72 * 3_600_000;
export const hourBucket = (ms: number): number => ms - (ms % 3_600_000);

/** The parts of a player's database node a backup holds and a rollback puts back: everything the server decides (blood, pockets, storage, what is owned...). Names, looks, friends and chat are not touched. */
export const USER_BACKUP_KEYS = [
  "blood", "owned", "inventory", "storage", "stash", "vend", "mixed", "stabs", "dumpsters", "boostUntil", "boostMult", "speedUntil", "speedMult",
  "leanUntil", "cupUntil", "shroomUntil", "chemUntil", "lookKind", "lookUntil", "deadlyLeft", "deadlyUntil", "catsCarved", "roomLevel", "syringeSelfAt", "syringeBagAt", "vapeAt", "vapeUntil", "flappyAt", "tutorial", "questAt",
  "sixty", "tradeCap", "bloodBy",
] as const;
/** The parts of a player room a backup holds: the furniture in it and everything the server changes about it. */
export const ROOM_BACKUP_KEYS = ["furni", "skins", "bed", "bag", "toolbox", "sink", "boombox", "stashbox", "theme", "w", "h", "members", "level", "lock", "box", "orders", "computer"] as const;

export interface BackupIndexEntry {
  at: number;
  kind: "auto" | "manual" | "pre-rollback";
  note?: string;
  accounts: number;
  rooms: number;
  /** all the blood in the players' pockets when the backup was taken */
  totalBlood: number;
}
export interface RollbackLogEntry {
  at: number;
  by: string;
  to: number;
  users: number;
  rooms: number;
  banned: string[];
  /** the backup taken just before the rollback (it can be rolled back to as well) */
  safety: number;
}
export interface LedgerEntry { t: number; a: string; n?: string; d: number; b: number }

/** What a source key in the ledger means, in words for the admin. A source is the action's name (and, for admin commands, which one). */
const LABELS: Record<string, string> = {
  stab: "Stabbing players",
  syringe: "Syringe (self and body bags)",
  flappy: "Flappy Bird",
  sixty: "6ixty's jobs",
  sellWeed: "Selling to 6ixty",
  tradeFinish: "Trades with other players",
  sync: "Account sync",
  "debug:blood": "Admin command /giveblud",
  debug: "Admin commands",
  buySixty: "Buying from 6ixty",
  buyVending: "Vending machine",
  buyRecord: "Record player",
  buyPoster: "Posters",
  buyFurni: "Furniture shop",
  buyClothes: "Clothes",
  buyRoomUpgrade: "Room upgrades",
  roomColors: "Room colours",
  roomSkins: "Bed and wardrobe looks",
  stashEnsure: "Stash box",
};
export const sourceLabel = (src: string): string => LABELS[src] ?? src;
