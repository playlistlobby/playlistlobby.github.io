// The album-night event (the concert on the stage, the surprise in the middle of it, and what is left of the site afterwards). Pure: the browser and the server both use it.
// The state lives at event/state (only the server writes it, on the admin's say: the /event panel):
//   open    the red door is open: players can walk in and are locked in once they have (event/in/<uid>)
//   sealed  the doors are shut: everybody who is not staff is pulled into the concert room, new logins land there
//   lights  the light show behind the game
//   kill    when the surprise was set off (server time): the screen fades to black, the room changes, and the fighting starts
//   Everything else is per player: event/in/<uid> (when they went in), event/dead/<uid> (when they were killed), event/hp/<uid> (their hit points).

export interface EventState { open?: boolean; sealed?: boolean; lights?: boolean; kill?: number }

/** the screen fades to black over this long once the surprise is set off, and the room is changed while it is black */
export const KILL_FADE_MS = 3500;
/** this long after the surprise the screen fades back in on the changed room (the fighting starts then) */
export const KILL_WAKE_MS = 9000;
/** nobody can be hurt for this long after waking up in the changed room */
export const EVENT_PROTECT_MS = 10_000;

/** the fighting in the changed room: the same rules as the street, but nothing is lost when you die */
export const EVENT_PVP = { maxHp: 10, swingMs: 4000, reach: 2, minDmg: 1, maxDmg: 3 } as const;

/** a death: the screen says it for this long (the countdown); at 7 it fades to black and the music fades out; then the grave for 5 seconds; then black, and the page that is left */
export const DEAD_SECS = 20;
export const DEAD_FADE_AT = 7;
export const GRAVE_MS = 5000;
/** what the grave says under the name */
export const GRAVE_TEXT = "Tak for alt";

/** the browser remembers that the player died (they have been signed out): a refresh shows the page that is left */
export const FINALE_KEY = "6ix-finale";

/** are the doors shut on this player? Staff are never locked in. Once somebody has gone in during the event (or the doors are sealed) they stay in. */
export const eventLocked = (s: EventState | null | undefined, inAt: number, staff: boolean): boolean => !staff && !!s && (!!s.sealed || ((!!s.open || !!s.kill) && inAt > 0));
/** is the changed room (the one after the surprise) on, at this server time? */
export const eventKilled = (s: EventState | null | undefined, now: number): boolean => !!s?.kill && now >= s.kill + KILL_WAKE_MS;

/** accounts left off the page's leaderboard: the staff and the people who only hold blood because it was given to them */
export const FINALE_HIDE_NAMES = new Set(["6ixty", "idontdothose", "lesliecph", "knoglemarv", "adminsidia", "emoney6", "emil", "playlistmod", "ripsaiko", "mabs", "leolegit"]);

/** what the page that is left shows (public/finale: anybody can read it, only the admin writes it) */
export interface FinaleSong { id: string; title: string; by: string; pieces: number; mime: string; durMs: number }
export interface Finale { on?: boolean; text?: string; board?: Array<{ name: string; blood: number }>; songs?: FinaleSong[]; hidden?: Record<string, boolean>; at?: number }
