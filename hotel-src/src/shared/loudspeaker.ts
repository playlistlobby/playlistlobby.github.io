// The loudspeaker (an item): its owner types a message and it shows on every player's screen for 10 seconds, once every 6 hours.
//   broadcast            { at, text, by, byName }   the last message (written only by the server)
//   loudspeaker/<uid>    when that player last used theirs (written only by the server)
export const LOUDSPEAKER_SHOW_MS = 10_000;
export const LOUDSPEAKER_COOLDOWN_MS = 6 * 3_600_000;
export const LOUDSPEAKER_MAX_LEN = 100;
