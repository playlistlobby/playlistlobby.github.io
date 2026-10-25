// Moderation limits (see server/src/actions/mod.ts). Shared so the buttons say what the server does.
/** a mod mutes for an hour and bans for half an hour; the admin chooses */
export const MOD_MUTE_MS = 60 * 60_000;
export const MOD_BAN_MS = 30 * 60_000;
/** a player can report this many different accounts in an hour */
export const REPORT_LIMIT = 3;
export const REPORT_WINDOW_MS = 60 * 60_000;
/** a new account can chat in the basement and the shop after this long (it keeps freshly made bots quiet) */
export const NEW_ACCOUNT_CHAT_MS = 3 * 60_000;
/** the account whose login is the chat mod page: it only shows the live chat and the moderation tools */
export const CHATMOD_NAME = "playlistmod";
export type Role = "admin" | "mod";
