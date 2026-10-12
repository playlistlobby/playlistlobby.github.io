// database.rules.template.json is the source of truth; this expands the shorthand checks into the full
// rules file that Firebase (and the emulator) read. Run it (npm run build:rules) after editing the template.
import { readFileSync, writeFileSync } from "node:fs";
const PW = "auth != null && auth.token.firebase.sign_in_provider === 'password'";
// admin = the account whose sign-in address is admin@users.bobba.invalid (username "admin")
const ADMIN = `${PW} && auth.token.email === 'admin@users.bobba.invalid'`;
// "may enter room $room": the lobby, your own room, an open room, a room you were let into, or a friend's room (friends always get in)
const OWNER = "root.child('roomsMeta').child($room).child('owner').val()";
const IN = `($room === 'lobby' || ${OWNER} === auth.uid || root.child('roomsMeta').child($room).child('access').val() === 'open' || root.child('roomInvites').child($room).child(auth.uid).exists() || root.child('friends').child(${OWNER}).child(auth.uid).exists())`;
const out = readFileSync("database.rules.template.json", "utf8").replaceAll("@ADMIN@", ADMIN).replaceAll("@PW@", PW).replaceAll("@IN@", IN);
JSON.parse(out); // fail loudly if the result isn't valid JSON
writeFileSync("database.rules.json", out);
console.log("wrote database.rules.json (" + out.length + " chars)");
