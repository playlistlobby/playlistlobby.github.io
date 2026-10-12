// database.rules.template.json is the source of truth; this expands the two shorthand checks into the full
// rules file that Firebase (and the emulator) read. Run it (npm run build:rules) after editing the template.
import { readFileSync, writeFileSync } from "node:fs";
const PW = "auth != null && auth.token.firebase.sign_in_provider === 'password'";
// admin = the account whose sign-in address is admin@users.bobba.invalid (username "admin")
const ADMIN = `${PW} && auth.token.email === 'admin@users.bobba.invalid'`;
const out = readFileSync("database.rules.template.json", "utf8").replaceAll("@ADMIN@", ADMIN).replaceAll("@PW@", PW);
JSON.parse(out); // fail loudly if the result isn't valid JSON
writeFileSync("database.rules.json", out);
console.log("wrote database.rules.json (" + out.length + " chars)");
