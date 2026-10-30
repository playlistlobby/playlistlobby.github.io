// The album-night event: the doors (open / sealed), who gets locked in, the surprise (kill), the fighting in the changed room, ending it, starting over, and the DJ deck.
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/event.mjs (server/)
const DB = "http://127.0.0.1:9000";
const NS = "demo-hotel-default-rtdb";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts";
const API = "http://127.0.0.1:8787";
async function account(name) {
  const email = `${name}@users.bobba.invalid`;
  for (const mode of ["signUp", "signInWithPassword"]) {
    const r = await fetch(`${AUTH}:${mode}?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "secret1", returnSecureToken: true }) });
    const j = await r.json();
    if (j.idToken) return { uid: j.localId, token: j.idToken, name };
  }
  throw new Error("auth failed for " + name);
}
const owner = async (method, path, body) => {
  const r = await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};
const act = async (who, a, args = {}) => {
  for (let tries = 0; ; tries++) {
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12) { await new Promise((x) => setTimeout(x, 800)); continue; }
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 220));
const bad = (label, r, re) => check(label, r.ok === false && (!re || re.test(String(r.error))), JSON.stringify(r).slice(0, 220));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "x", blood: 5, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  for (const r of ["lobby", "stage"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
  return u;
};
const stand = (u, x, y) => owner("PUT", `rooms/stage/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await owner("DELETE", "event");
await owner("PUT", "public/finale", { on: false });
const admin = await account("adminsidia");
await owner("PUT", `users/${admin.uid}`, { name: "adminsidia", gender: "M", figure: "x", blood: 99999, createdAt: Date.now() });
const a = await fresh("t_ev_a", { blood: 700 });
const b = await fresh("t_ev_b", { blood: 300 });
const c = await fresh("t_ev_c", { blood: 100 });
const mod = await fresh("t_ev_mod");
await owner("PUT", `roles/${mod.uid}`, "mod");
for (const u of [a, b, c, mod]) await act(u, "sync");

console.log("--- the doors");
bad("a player can't change the event", await act(a, "eventSet", { open: true }), /Unknown command/);
bad("the red door is shut", await act(a, "eventJoin"), /closed/);
ok("a mod may go in whenever", await act(mod, "eventJoin"));
check("... and is not marked as shut in", (await owner("GET", `event/in/${mod.uid}`)) === null);
ok("the admin opens the red door", await act(admin, "eventSet", { open: true }));
check("state: open", (await owner("GET", "event/state/open")) === true);
ok("a player goes in", await act(a, "eventJoin"));
check("... and is marked as shut in", Number(await owner("GET", `event/in/${a.uid}`)) > 0);
ok("the lights", await act(admin, "eventSet", { lights: true }));
ok("the doors are sealed", await act(admin, "eventSet", { sealed: true }));
ok("a late player is put in too", await act(c, "eventJoin"));
check("sealing opens too", (await owner("GET", "event/state/open")) === true && (await owner("GET", "event/state/sealed")) === true);

console.log("--- the deck");
await stand(a, 3, 8); await stand(b, 4, 8); await stand(c, 12, 15); await stand(mod, 8, 3);
await owner("PUT", `users/${mod.uid}/inventory`, { 0: { item: "cd_album", qty: 1 } });
await owner("PUT", `users/${a.uid}/inventory`, { 0: { item: "cd_album", qty: 1 } });
await act(a, "sync"); await act(mod, "sync");
bad("a player can't load the deck", await act(a, "cdInsert", { slot: 0, room: "stage", durationMs: 60000 }), /DJs/);
ok("a DJ (staff) loads the album", await act(mod, "cdInsert", { slot: 0, room: "stage", durationMs: 60000 }));
bad("a player can't pause it", await act(a, "cdControl", { room: "stage", op: "pause" }), /DJs/);
ok("a DJ pauses it", await act(mod, "cdControl", { room: "stage", op: "pause" }));
ok("a DJ ejects it", await act(mod, "cdControl", { room: "stage", op: "eject" }));
bad("only the event admin plays the album from the panel", await act(mod, "eventAlbum", { op: "play", durationMs: 60000 }), /Unknown command/);
ok("the admin plays the album from the panel", await act(admin, "eventAlbum", { op: "play", durationMs: 60000 }));
check("... it is on the deck", (await owner("GET", "rooms/stage/cdplayer/track")) === "album");
ok("... and stops it", await act(admin, "eventAlbum", { op: "stop" }));

console.log("--- the surprise");
bad("nobody fights before it", await act(a, "eventHit", { target: b.uid }), /Nobody fights/);
bad("a player can't set it off", await act(a, "eventKill"), /Unknown command/);
const k = await act(admin, "eventKill");
ok("the admin sets it off", k);
check("the page that is left is on, with a leaderboard", (await owner("GET", "public/finale/on")) === true && Array.isArray(await owner("GET", "public/finale/board")));
const board = (await owner("GET", "public/finale/board")) ?? [];
check("the leaderboard has the players by blood, not the staff", board.some((r) => r.name === "t_ev_a" && r.blood === 700) && !board.some((r) => r.name === "adminsidia" || r.name === "t_ev_mod"), JSON.stringify(board).slice(0, 200));
check("a is above b", board.findIndex((r) => r.name === "t_ev_a") < board.findIndex((r) => r.name === "t_ev_b"));
bad("it can't be set off twice", await act(admin, "eventKill"), /already/);
bad("not yet: the room is changing and nobody can be touched", await act(a, "eventHit", { target: b.uid }), /yet|fights/);

console.log("--- the fighting (the surprise moved back in time so the protection is over)");
await owner("PUT", "event/state/kill", Date.now() - 60_000);
bad("too far away", await act(a, "eventHit", { target: c.uid }), /too far/);
bad("not yourself", await act(a, "eventHit", { target: a.uid }), /yourself/);
let died = false, hits = 0, last;
for (let i = 0; i < 60 && !died; i++) {
  await owner("DELETE", `event/swing/${a.uid}`);
  last = await act(a, "eventHit", { target: b.uid });
  if (!last.ok) break;
  hits++;
  died = !!(last.data?.died ?? last.died);
}
check("b dies from a's knife", died, JSON.stringify(last).slice(0, 200));
check("b is marked dead, and gone from the room", !!(await owner("GET", `event/dead/${b.uid}`)) && (await owner("GET", `rooms/stage/players/${b.uid}`)) === null);
check("nothing was lost: b keeps their blood and items", (await act(b, "sync")).state?.blood === 300);
bad("a dead player can't fight", await act(b, "eventHit", { target: a.uid }), /dead|aren't in/);
bad("the dead can't be hit again", await act(a, "eventHit", { target: b.uid }), /dead/);
ok("one swing, then the arm is busy", await (async () => { await owner("DELETE", `event/swing/${a.uid}`); await stand(c, 4, 9); return act(a, "eventHit", { target: c.uid }); })());
bad("the arm is still swinging", await act(a, "eventHit", { target: c.uid }), /swinging/);
console.log("--- 6ixty has endless hit points");
const six = await fresh("t_ev_six");
await owner("PUT", `profiles/${six.uid}`, { name: "6ixty", figure: "x" });
await act(six, "sync"); await stand(six, 4, 8);
let sixHits = 0;
for (let i = 0; i < 12; i++) { await owner("DELETE", `event/swing/${a.uid}`); const r = await act(a, "eventHit", { target: six.uid }); if (r.ok) sixHits++; }
check("6ixty can be hit again and again", sixHits >= 10, String(sixHits));
check("... and nothing goes off his bar, he never dies", (await owner("GET", `event/hp/${six.uid}`)) === null && (await owner("GET", `event/dead/${six.uid}`)) === null);
bad("a player can't end it", await act(a, "eventEndAll"), /Unknown command/);
const ended = await act(admin, "eventEndAll");
ok("the admin ends it", ended);
check("6ixty is not taken by End it", (await owner("GET", `event/dead/${six.uid}`)) === null);
check("everybody left standing is dead (not the staff)", !!(await owner("GET", `event/dead/${a.uid}`)) && !!(await owner("GET", `event/dead/${c.uid}`)) && (await owner("GET", `event/dead/${mod.uid}`)) === null);
bad("a dead player can't go in again", await act(a, "eventJoin"), /over for you/);

console.log("--- starting over");
bad("a player can't reset", await act(a, "eventReset"), /Unknown command/);
ok("the admin resets", await act(admin, "eventReset"));
check("all gone: the state, who went in, who died, the page", (await owner("GET", "event")) === null && (await owner("GET", "public/finale/on")) === false);
ok("the leaderboard can be made again", await act(admin, "eventFinaleRefresh"));

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
