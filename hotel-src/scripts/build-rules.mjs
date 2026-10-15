// database.rules.template.json is the source of truth; this expands the shorthand checks into the full
// rules file that Firebase (and the emulator) read. Run it (npm run build:rules) after editing the template.
import { readFileSync, writeFileSync } from "node:fs";
const PW = "auth != null && auth.token.firebase.sign_in_provider === 'password'";
// admin = the account whose sign-in address is admin@users.bobba.invalid (username "admin")
const ADMIN = `${PW} && auth.token.email === 'admin@users.bobba.invalid'`;
// "may enter room $room": the lobby, your own room, an open room, a room you were let into, a friend's room (friends always get in), or any room while a shroom / DMT lasts (users/<uid>/shroomUntil, written by the server)
const OWNER = "root.child('roomsMeta').child($room).child('owner').val()";
const IN = `($room === 'lobby' || $room === 'shop' || $room === 'tut_' + auth.uid || ${OWNER} === auth.uid || root.child('roomsMeta').child($room).child('access').val() === 'open' || root.child('roomInvites').child($room).child(auth.uid).exists() || (root.child('friends').child(${OWNER}).child(auth.uid).exists() && root.child('roomsMeta').child($room).child('access').val() !== 'none') || (root.child('users').child(auth.uid).child('shroomUntil').exists() && root.child('users').child(auth.uid).child('shroomUntil').val() > now))`;
const out = readFileSync("database.rules.template.json", "utf8").replaceAll("@ADMIN@", ADMIN).replaceAll("@PW@", PW).replaceAll("@IN@", IN);
JSON.parse(out); // fail loudly if the result isn't valid JSON
writeFileSync("database.rules.json", out);
console.log("wrote database.rules.json (" + out.length + " chars)");
