// database.rules.template.json is the source of truth; this expands the shorthand checks into the full
// rules file that Firebase (and the emulator) read. Run it (npm run build:rules) after editing the template.
import { readFileSync, writeFileSync } from "node:fs";
// a banned account (bans/<uid>, written by the server) is shut out of everything: its reads and writes all fail
// (a ban is for good, or, with `until` (a mod's 30 minute ban), only until that time)
const PW = "auth != null && auth.token.firebase.sign_in_provider === 'password' && (!root.child('bans').child(auth.uid).exists() || (root.child('bans').child(auth.uid).child('until').exists() && root.child('bans').child(auth.uid).child('until').val() < now))";
// admin = the account whose sign-in address is adminsidia@users.bobba.invalid (username "adminsidia")
// (more admins, and the mods, are in roles/<uid>: written only by the server, see server/src/actions/mod.ts)
const ADMIN = `${PW} && (auth.token.email === 'adminsidia@users.bobba.invalid' || root.child('roles').child(auth.uid).val() === 'admin')`;
const MOD = `${PW} && (auth.token.email === 'adminsidia@users.bobba.invalid' || root.child('roles').child(auth.uid).val() === 'admin' || root.child('roles').child(auth.uid).val() === 'mod')`;
// a muted player (mutes/<uid>/until in the future) can't chat; a brand new account can't chat in the basement and the shop for its first minutes (it keeps new bots quiet)
const UNMUTED = "(!root.child('mutes').child(auth.uid).exists() || root.child('mutes').child(auth.uid).child('until').val() < now)";
// an account the server has made a profile for (only the server writes users/<uid>/name): the sign-ins that bots make without asking the server can't chat
const KNOWN = "root.child('users').child(auth.uid).child('name').exists()";
const AGED = "(!root.child('users').child(auth.uid).child('createdAt').exists() || root.child('users').child(auth.uid).child('createdAt').val() < now - 180000)";
// "may enter room $room": the lobby, your own room, an open room, a room you were let into, a friend's room (friends always get in), or any room while a shroom / DMT lasts (users/<uid>/shroomUntil, written by the server)
const OWNER = "root.child('roomsMeta').child($room).child('owner').val()";
const WANTED_ROOM = "(root.child('wantedRooms').child($room).child('until').exists() && root.child('wantedRooms').child($room).child('until').val() > now)"; // (a room a player with one of bagmand's hits stands in: open to everybody while it lasts)
const IN = `((${MOD}) || ${WANTED_ROOM} || (${PW} && root.child('perks').child(auth.uid).child('enterAnywhere').val() === true) || $room === 'lobby' || $room === 'shop' || $room === 'mines' || (($room === 'arrival' || $room === 'streets') && root.child('streetPass').child(auth.uid).val() > now) || $room === 'tut_' + auth.uid || ${OWNER} === auth.uid || root.child('roomsMeta').child($room).child('members').child(auth.uid).exists() || root.child('roomsMeta').child($room).child('access').val() === 'open' || root.child('roomInvites').child($room).child(auth.uid).exists() || (root.child('friends').child(${OWNER}).child(auth.uid).exists() && root.child('roomsMeta').child($room).child('access').val() !== 'none') || (root.child('users').child(auth.uid).child('shroomUntil').exists() && root.child('users').child(auth.uid).child('shroomUntil').val() > now))`;
const out = readFileSync("database.rules.template.json", "utf8").replaceAll("@ADMIN@", ADMIN).replaceAll("@MOD@", MOD).replaceAll("@UNMUTED@", UNMUTED).replaceAll("@AGED@", AGED).replaceAll("@KNOWN@", KNOWN).replaceAll("@PW@", PW).replaceAll("@IN@", IN);
JSON.parse(out); // fail loudly if the result isn't valid JSON
writeFileSync("database.rules.json", out);
console.log("wrote database.rules.json (" + out.length + " chars)");
