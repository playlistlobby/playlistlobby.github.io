// Accounts and a clean slate for testing the album-night event in the local emulator (the stack: npm run emulators, npm run dev:emu, and in server/: npm run dev).
//   node scripts/seed-event-test.mjs          (run it again whenever the emulator has been restarted: it empties the event and makes the accounts)
// Every account has the password  secret1.  The accounts:
//   adminsidia   the admin (shows as 6ixty in the game): runs /event and /finale, has endless hit points in the fighting
//   emil         runs /event and /finale too (not the admin)
//   djmod        a moderator: may load a CD on the DJ deck, is never locked in, doesn't lose the site
//   fan1..fan4   ordinary players with some blood (the leaderboard) and a character
import fs from "node:fs";
const DB = "http://127.0.0.1:9000", NS = "demo-hotel-default-rtdb";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts";
const owner = async (method, path, body) => {
  const r = await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};
async function account(name) {
  for (const mode of ["signUp", "signInWithPassword"]) {
    const r = await fetch(`${AUTH}:${mode}?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `${name}@users.bobba.invalid`, password: "secret1", returnSecureToken: true }) });
    const j = await r.json();
    if (j.localId) return j.localId;
  }
  throw new Error("could not make " + name);
}
const FIGURES = {
  adminsidia: "hd-200-10.hr-99001-35.ea-99011-9004.ch-3506-9003.cc-99003-9001.lg-99002-9002.sh-99010-9001.wa-99006-9001-1408",
  emil: "hd-190-1.hr-97012-42.ch-98188-1408.lg-98120-9004.sh-98136-1408.wa-98147-1408",
  djmod: "hd-190-10.hr-98112-31.ha-98080-9001.ch-3527-85.cc-98021.ca-98007-91.lg-98120-91.sh-98137-9001.wa-98147-9001",
  fan1: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62",
  fan2: "hr-155-45.hd-180-2.ch-210-66.lg-270-82.sh-300-91",
  fan3: "hr-165-37.hd-190-8.ch-3030-110.lg-275-64.sh-295-62",
  fan4: "hr-125-61.hd-600-1.ch-3019-66.lg-3078-110.sh-290-91",
};
const BLOOD = { adminsidia: 99999, emil: 5000, djmod: 1200, fan1: 4200, fan2: 2600, fan3: 900, fan4: 150 };
const uids = {};
for (const name of Object.keys(FIGURES)) {
  const uid = await account(name);
  uids[name] = uid;
  const inv = name === "djmod" || name === "emil" || name === "adminsidia" ? { 0: { item: "cd_album", qty: 1 } } : { 0: { item: "knife", qty: 1 } };
  await owner("PUT", `users/${uid}`, { name, gender: "M", figure: FIGURES[name], blood: BLOOD[name], tutorial: 6, seenDoor: true, createdAt: Date.now() - 86_400_000 * 5, inventory: inv });
  await owner("PUT", `profiles/${uid}`, { name: name === "adminsidia" ? "6ixty" : name, figure: FIGURES[name] });
  await owner("PUT", `usernames/${name}`, uid);
  for (const room of ["lobby", "stage", `u_${uid}`]) await owner("DELETE", `rooms/${room}/players/${uid}`);
}
await owner("PUT", `roles/${uids.djmod}`, "mod");
// a clean slate: the event, the page that is left (its text stays), and nobody on the stage
await owner("DELETE", "event");
await owner("PUT", "public/finale/on", false);
await owner("DELETE", "rooms/stage/cdplayer");
await owner("DELETE", "rooms/stage/hits");
await owner("DELETE", "rooms/stage/events");
console.log("accounts (password secret1):", Object.keys(FIGURES).join(", "));
console.log("the event is reset. The stage layout is made by the admin the first time they walk in.");
