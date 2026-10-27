// Moderation tests: roles (admin, mod), mutes, temporary bans, new accounts keep quiet, the accounts a player made, reports
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: npm test (server/)
import { createHmac } from "node:crypto";
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
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json", ...(who.device ? { "x-device": who.device } : {}) }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12 && !process.env.NO_RETRY) { await new Promise((x) => setTimeout(x, 800)); continue; } // the anti-spam limit: wait and go on
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 160));
const bad = (label, r, status) => check(label, r.ok === false && (!status || r.status === status), JSON.stringify(r).slice(0, 160));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  await owner("DELETE", `rooms/lobby/players/${u.uid}`); await owner("DELETE", `rooms/shop/players/${u.uid}`); await owner("DELETE", `rooms/tut_${u.uid}`); await owner("DELETE", `rooms/u_${u.uid}`); await owner("DELETE", `roomsMeta/u_${u.uid}`);
  return u;
};
const stand = (u, room, x = 5, y = 5) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const state = async (u) => (await act(u, "sync")).state;
const total = (inv, item) => inv.reduce((n, s) => n + (s && s.item === item ? s.qty : 0), 0);

const sleepMs = (ms) => new Promise((x) => setTimeout(x, ms));
const clientWrite = (u, path, v, method = "PUT") => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method, body: JSON.stringify(v) });
const clientRead = (u, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`);
const refused = (r) => r.status === 401 || r.status === 403;
const OLD = { createdAt: Date.now() - 3_600_000 };
const say = (u, room, text) => clientWrite(u, `rooms/${room}/chat/m${Math.random().toString(36).slice(2)}`, { uid: u.uid, name: u.name, text, ts: { ".sv": "timestamp" } });
const sayLog = (u, room, text) => clientWrite(u, `chatLog/m${Math.random().toString(36).slice(2)}`, { uid: u.uid, name: u.name, text, room, ts: { ".sv": "timestamp" } });
const inLobby = async (u) => { await act(u, "sync"); await stand(u, "lobby", 4, 4); };

console.log("--- roles");
await owner("DELETE", "reports"); await owner("DELETE", "modLog");
const adm = await fresh("adminsidia", { blood: 0 }); await act(adm, "sync");
const mod = await fresh("t_mod_m", { blood: 0, ...OLD }), mod2 = await fresh("t_mod_m2", { blood: 0, ...OLD });
const p1 = await fresh("t_mod_p1", { blood: 0, ...OLD }), p2 = await fresh("t_mod_p2", { blood: 0, ...OLD }), p3 = await fresh("t_mod_p3", { blood: 0, ...OLD }), p4 = await fresh("t_mod_p4", { blood: 0, ...OLD });
for (const u of [mod, mod2, p1, p2, p3, p4]) await act(u, "sync");
await owner("DELETE", "roles"); await owner("DELETE", "mutes");
for (const u of [mod, mod2, p1, p2, p3, p4]) { await owner("DELETE", `bans/${u.uid}`); await owner("DELETE", `reportLog/${u.uid}`); }
bad("a player can't promote", await act(p1, "modPromote", { uid: p2.uid, role: "mod" }));
bad("a player can't mute", await act(p1, "modMute", { uid: p2.uid }));
bad("a player can't ban", await act(p1, "modBan", { uid: p2.uid }));
ok("the admin makes a mod", await act(adm, "modPromote", { uid: mod.uid, role: "mod" }));
ok("and another", await act(adm, "modPromote", { uid: mod2.uid, role: "mod" }));
check("roles/<uid> says mod", (await owner("GET", `roles/${mod.uid}`)) === "mod");
bad("a mod can't promote", await act(mod, "modPromote", { uid: p1.uid, role: "mod" }));
const emil = await fresh("t_mod_emil", { blood: 0, ...OLD }); await act(emil, "sync");
await owner("PUT", `roles/${emil.uid}`, "admin");
await sleepMs(16000); // (roles are remembered for 15 seconds)
ok("a second admin (roles/<uid> = admin) can promote", await act(emil, "modPromote", { uid: p4.uid, role: "mod" }));
ok("and demote again", await act(emil, "modPromote", { uid: p4.uid, role: "none" }));
check("p4 is no mod", (await owner("GET", `roles/${p4.uid}`)) === null);

console.log("--- mutes");
await inLobby(p1);
check("an old account chats in the basement", (await say(p1, "lobby", "hi")).status === 200);
const mu = await act(mod, "modMute", { uid: p1.uid, minutes: 5 });
ok("a mod mutes (the minutes he asks for do not count: an hour)", mu);
const m = await owner("GET", `mutes/${p1.uid}`);
check("for an hour", m && Math.abs(m.until - Date.now() - 3_600_000) < 15_000 && m.by === mod.uid, JSON.stringify(m));
check("the room chat is refused now", refused(await say(p1, "lobby", "still here")));
check("so is the archive line", refused(await sayLog(p1, "lobby", "still here")));
check("the player sees his own mute", (await clientRead(p1, `mutes/${p1.uid}`)).status === 200 && refused(await clientRead(p1, `mutes/${p2.uid}`)));
bad("a mod can't mute a mod", await act(mod, "modMute", { uid: mod2.uid }));
bad("or an admin", await act(mod, "modMute", { uid: adm.uid }));
bad("or himself", await act(mod, "modMute", { uid: mod.uid }));
ok("the mod unmutes", await act(mod, "modMute", { uid: p1.uid, on: false }));
check("chat works again", (await say(p1, "lobby", "back")).status === 200);
await owner("PUT", `mutes/${p1.uid}`, { until: Date.now() - 1000, by: mod.uid });
check("a mute that ran out lets the chat through", (await say(p1, "lobby", "again")).status === 200);
const am = await act(adm, "modMute", { uid: p1.uid, minutes: 5 });
check("the admin chooses the time (5 minutes)", am.ok === true && Math.abs((await owner("GET", `mutes/${p1.uid}`)).until - Date.now() - 300_000) < 15_000);
await owner("DELETE", `mutes/${p1.uid}`);

console.log("--- muting for good (admins, and mods with the perk)");
{
  bad("a plain mod can't mute forever", await act(mod, "modMute", { uid: p1.uid, forever: true }));
  await owner("PUT", `perks/${mod.uid}/muteForever`, true);
  ok("a mod with the perk can", await act(mod, "modMute", { uid: p1.uid, forever: true }));
  const fm = await owner("GET", `mutes/${p1.uid}`);
  check("for ten years", fm && fm.until - Date.now() > 9 * 365 * 24 * 3_600_000, JSON.stringify(fm));
  check("and the chat is refused", refused(await say(p1, "lobby", "x")));
  ok("the mod can lift it", await act(mod, "modMute", { uid: p1.uid, on: false }));
  ok("the admin can mute forever too", await act(adm, "modMute", { uid: p1.uid, forever: true }));
  await owner("DELETE", `mutes/${p1.uid}`); await owner("DELETE", `perks/${mod.uid}`);
  check("a mod reads his own perks only", (await clientRead(mod2, `perks/${mod2.uid}`)).status === 200 && refused(await clientRead(mod2, `perks/${mod.uid}`)) === false);
}

console.log("--- new accounts keep quiet in the public rooms");
{
  const nu = await fresh("t_mod_new", { blood: 0 }); // (made just now)
  await inLobby(nu);
  check("a new account can't chat in the basement", refused(await say(nu, "lobby", "free lemonade")));
  check("or put it in the archive", refused(await sayLog(nu, "lobby", "free lemonade")));
  await owner("PUT", `rooms/u_${nu.uid}/players/${nu.uid}`, { name: nu.name, figure: "x", x: 1, y: 1, dir: 2 });
  await owner("PUT", `roomsMeta/u_${nu.uid}`, { owner: nu.uid, ownerName: nu.name, name: "r", access: "open", w: 8, h: 8 });
  check("but may in its own room", (await say(nu, `u_${nu.uid}`, "hello")).status === 200);
  await owner("PUT", `users/${nu.uid}/createdAt`, Date.now() - 200_000);
  check("after three minutes it can", (await say(nu, "lobby", "hi all")).status === 200);
}

console.log("--- bans");
ok("a mod bans (the minutes do not count: 30)", await act(mod, "modBan", { uid: p2.uid, minutes: 600 }));
const b = await owner("GET", `bans/${p2.uid}`);
check("for 30 minutes", b && Math.abs(b.until - Date.now() - 1_800_000) < 15_000, JSON.stringify(b));
await sleepMs(16000); // (the server remembers the bans for 15 seconds)
const r = await act(p2, "sync");
check("the banned player is turned away and told for how long", r.ok === false && /30 more minutes|29 more minutes/.test(r.error ?? ""), JSON.stringify(r).slice(0, 150));
check("and the database shuts him out", refused(await clientRead(p2, `profiles/${p2.uid}`)));
await owner("PUT", `bans/${p2.uid}/until`, Date.now() - 1000);
check("a ban that ran out opens the database again", (await clientRead(p2, `profiles/${p2.uid}`)).status === 200);
await sleepMs(16000);
ok("and the server lets him in", await act(p2, "sync"));
bad("a mod can't ban a mod", await act(mod, "modBan", { uid: mod2.uid }));
bad("or an admin", await act(mod, "modBan", { uid: adm.uid }));
ok("the admin bans for good (no minutes)", await act(adm, "modBan", { uid: p3.uid, reason: "bots" }));
const b3 = await owner("GET", `bans/${p3.uid}`);
check("without an end", b3 && b3.until === undefined && b3.reason === "bots", JSON.stringify(b3));
bad("a mod can't lift a ban for good", await act(mod, "modBan", { uid: p3.uid, on: false }));
ok("the admin can", await act(adm, "modBan", { uid: p3.uid, on: false }));
check("(gone)", (await owner("GET", `bans/${p3.uid}`)) === null);
await act(mod, "modBan", { uid: p4.uid });
ok("a mod lifts a short ban", await act(mod, "modBan", { uid: p4.uid, on: false }));
// the banForever perk: a mod who was given it bans for good (and lifts such a ban), still not an admin or another mod
await owner("PUT", `perks/${mod2.uid}/banForever`, true);
await owner("PUT", `roles/${mod2.uid}`, "mod");
await act(mod2, "sync");
ok("a mod with the perk bans for good", await act(mod2, "modBan", { uid: p4.uid, reason: "perk" }));
check("it has no end time", (await owner("GET", `bans/${p4.uid}`)) && (await owner("GET", `bans/${p4.uid}/until`)) === null);
ok("and lifts a ban for good", await act(mod2, "modBan", { uid: p4.uid, on: false }));
bad("still not on an admin", await act(mod2, "modBan", { uid: adm.uid }));
bad("still not on the mod without the perk", await act(mod2, "modBan", { uid: mod.uid }));
await owner("DELETE", `perks/${mod2.uid}`);

console.log("--- the accounts a player made");
{
  const bots = [];
  for (const sfx of ["aa1", "bb2", "cc3", "dd4"]) {
    const nm = `bobot${sfx}`;
    const u = await fresh(nm, { blood: 0, ...OLD });
    await owner("PUT", `usernames/${nm}`, u.uid); await owner("PUT", `profiles/${u.uid}`, { name: nm, figure: "x" });
    bots.push(u);
  }
  await owner("PUT", `peers/${bots[0].uid}/${p1.uid}`, true);
  const al = await act(mod, "modAlts", { uid: bots[0].uid });
  ok("the mod looks up the other accounts", al);
  const names = (al.data?.accounts ?? []).map((x) => x.name).sort();
  check("the ones with a similar name and the one on the same device", JSON.stringify(names) === JSON.stringify(["bobotbb2", "bobotcc3", "bobotdd4", "t_mod_p1"]), JSON.stringify(names));
  bad("a player can't", await act(p1, "modAlts", { uid: bots[0].uid }));
  const many = await act(mod, "modBanMany", { uids: bots.map((x) => x.uid).concat([mod2.uid, adm.uid, mod.uid]) });
  check("bans all four at once (the mods and the admin in the list are skipped)", many.data?.banned === 4, JSON.stringify(many));
  check("each for 30 minutes", bots.every(async (x) => !!(await owner("GET", `bans/${x.uid}`)).until));
  for (const x of bots) await owner("DELETE", `bans/${x.uid}`);
}

console.log("--- the chat mod page reads, players do not");
check("a mod reads the archive", (await fetch(`${DB}/chatLog.json?ns=${NS}&auth=${mod.token}&orderBy=%22ts%22&limitToLast=1`)).status === 200);
check("a player does not", refused(await fetch(`${DB}/chatLog.json?ns=${NS}&auth=${p1.token}&orderBy=%22ts%22&limitToLast=1`)));
check("a mod reads the bans", (await clientRead(mod, "bans")).status === 200 && refused(await clientRead(p1, "bans")));
check("and the roles", (await clientRead(mod, "roles")).status === 200 && refused(await clientRead(p1, "roles")));
check("a player reads his own role only", (await clientRead(p1, `roles/${p1.uid}`)).status === 200 && refused(await clientRead(p1, `roles/${mod.uid}`)));
check("nobody writes a role from the page", refused(await clientWrite(p1, `roles/${p1.uid}`, "admin")) && refused(await clientWrite(mod, `roles/${mod.uid}`, "admin")));

console.log("--- reports");
ok("a report", await act(p1, "reportPlayer", { uid: p2.uid, reason: "spams" }));
bad("not the same player twice", await act(p1, "reportPlayer", { uid: p2.uid, reason: "again" }));
bad("not yourself", await act(p1, "reportPlayer", { uid: p1.uid, reason: "me" }));
bad("with a reason", await act(p1, "reportPlayer", { uid: p3.uid, reason: "  " }));
ok("a second", await act(p1, "reportPlayer", { uid: p3.uid, reason: "bot" }));
ok("a third", await act(p1, "reportPlayer", { uid: p4.uid, reason: "rude" }));
bad("a fourth account in an hour", await act(p1, "reportPlayer", { uid: mod2.uid, reason: "no" }));
const reps = Object.values((await owner("GET", "reports")) ?? {});
check("three reports are there, with the names", reps.length === 3 && reps.some((x) => x.targetName === "t_mod_p2" && x.fromName === "t_mod_p1" && x.reason === "spams"), JSON.stringify(reps).slice(0, 200));
check("a mod reads the reports, a player does not", (await clientRead(mod, "reports")).status === 200 && refused(await clientRead(p1, "reports")));
const old = Object.entries((await owner("GET", `reportLog/${p1.uid}`)) ?? {});
for (const [id, v] of old) await owner("PUT", `reportLog/${p1.uid}/${id}/t`, v.t - 3_700_000);
ok("an hour later the limit is gone", await act(p1, "reportPlayer", { uid: mod2.uid, reason: "fine now" }));
const rid = Object.keys((await owner("GET", "reports")))[0];
bad("a player can't clear a report", await act(p1, "modDismissReport", { id: rid }));
ok("a mod does", await act(mod, "modDismissReport", { id: rid }));
check("(gone)", (await owner("GET", `reports/${rid}`)) === null);

console.log("--- blood, warnings, messages, kicks, addresses (full privileges)");
{
  const v = await fresh("t_mod_v", { blood: 50, ...OLD }); await act(v, "sync");
  bad("a mod can't give blood", await act(mod, "modBlood", { uid: v.uid, delta: 100 }));
  ok("the admin gives 100", await act(adm, "modBlood", { uid: v.uid, delta: 100 }));
  check("150 blood", (await state(v)).blood === 150);
  ok("and takes 500 (it stops at 0)", await act(adm, "modBlood", { uid: v.uid, delta: -500 }));
  check("0 blood", (await state(v)).blood === 0);
  const led = JSON.stringify((await owner("GET", `users/${v.uid}/bloodBy`)) ?? {});
  check("the blood ledger knows where it came from", /modBlood/.test(led), led);
  bad("not nothing", await act(adm, "modBlood", { uid: v.uid, delta: 0 }));
  ok("a mod warns", await act(mod, "modNotice", { uid: v.uid, kind: "warn", text: "stop spamming" }));
  ok("a mod writes a message", await act(mod, "modNotice", { uid: v.uid, kind: "msg", text: "hello there" }));
  const ns = Object.values((await owner("GET", `notices/${v.uid}`)) ?? {});
  check("both are on his notice board", ns.length === 2 && ns.some((n) => n.kind === "warn" && n.text === "stop spamming") && ns.some((n) => n.kind === "msg"), JSON.stringify(ns));
  check("he reads his own notices, nobody else's", (await clientRead(v, `notices/${v.uid}`)).status === 200 && refused(await clientRead(v, `notices/${p1.uid}`)));
  check("and he writes none", refused(await clientWrite(v, `notices/${v.uid}/x`, { kind: "msg", text: "x", at: 1 })));
  bad("a mod can't write to everybody", await act(mod, "modNotice", { uid: "all", kind: "msg", text: "hi all" }));
  ok("the admin can", await act(adm, "modNotice", { uid: "all", kind: "msg", text: "server news" }));
  check("everybody reads that board", (await clientRead(p1, "notices/_all")).status === 200);
  bad("not an empty message", await act(adm, "modNotice", { uid: v.uid, kind: "warn", text: "   " }));
  bad("not to an admin", await act(mod, "modNotice", { uid: adm.uid, kind: "warn", text: "hey" }));
  ok("a mod kicks", await act(mod, "modKick", { uid: v.uid, reason: "spam" }));
  const k = await owner("GET", `kicks/${v.uid}`);
  check("the kick is written", k && k.reason === "spam" && Math.abs(k.at - Date.now()) < 10000, JSON.stringify(k));
  check("he can read his own kick", (await clientRead(v, `kicks/${v.uid}`)).status === 200);
  bad("a player can't kick", await act(p1, "modKick", { uid: v.uid }));
  // addresses: noted at login, banned by the admin
  const withIp = (u, a, args, ip) => fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${u.token}`, "content-type": "application/json", "cf-connecting-ip": ip }, body: JSON.stringify({ a, args }) }).then(async (r) => ({ status: r.status, ...(await r.json()) }));
  const w = await fresh("t_mod_w", { blood: 0, ...OLD });
  ok("login from an address", await withIp(w, "sync", {}, "203.0.113.7"));
  const ipsAfter = await owner("GET", `ips/${w.uid}`);
  check("the address is noted", ipsAfter && Object.values(ipsAfter)[0].ip === "203.0.113.7", JSON.stringify(ipsAfter));
  bad("a mod can't see addresses", await act(mod, "modIps", { uid: w.uid }));
  const il = await act(adm, "modIps", { uid: w.uid });
  check("the admin sees it", il.data?.ips?.[0]?.ip === "203.0.113.7", JSON.stringify(il).slice(0, 150));
  bad("a mod can't ban an address", await act(mod, "modIpBan", { uid: w.uid }));
  // the ipBan perk: a mod who was given it sees and bans addresses (a player with the perk but no mod role can't)
  await owner("PUT", `perks/${mod2.uid}/ipBan`, true);
  const il2 = await act(mod2, "modIps", { uid: w.uid });
  check("a mod with the ipBan perk sees the addresses", il2.data?.ips?.[0]?.ip === "203.0.113.7", JSON.stringify(il2).slice(0, 150));
  bad("another mod still can't", await act(mod, "modIps", { uid: w.uid }));
  await owner("PUT", `perks/${p1.uid}/ipBan`, true);
  bad("a player with the perk but no mod role can't", await act(p1, "modIpBan", { uid: w.uid }));
  await owner("DELETE", `perks/${p1.uid}/ipBan`);
  ok("the mod with the perk bans the address", await act(mod2, "modIpBan", { uid: w.uid }));
  ok("and lifts it again", await act(mod2, "modIpBan", { uid: w.uid, on: false }));
  await owner("DELETE", `perks/${mod2.uid}/ipBan`);
  bad("without the perk he can't", await act(mod2, "modIpBan", { uid: w.uid }));
  // the economy numbers: a mod reads them (they can't write them), a player can't
  check("a mod reads the accounts", (await clientRead(mod, "users")).status === 200);
  check("and the blood ledger", (await clientRead(mod, "ledger")).status === 200);
  check("a player can't read the accounts", (await clientRead(p1, "users")).status !== 200);
  check("a mod can't write blood", refused(await clientWrite(mod, `users/${w.uid}/blood`, 99999)));
  // the poster feed and the ban list are the mods' too
  check("a mod reads the ban list", (await clientRead(mod, "bans")).status === 200);
  check("and the poster mutes", (await clientRead(mod, "posterMutes")).status === 200);
  check("a player can't read the poster mutes", (await clientRead(p1, "posterMutes")).status !== 200);
  const pc = await act(mod, "posterAdmin", { op: "clear", room: "u_nobodyhere", id: "fnone" });
  check("a mod gets to the poster tool (the poster just isn't there)", pc.ok === false && /isn't there/.test(pc.error ?? ""), JSON.stringify(pc));
  bad("a player doesn't", await act(p1, "posterAdmin", { op: "clear", room: "u_nobodyhere", id: "fnone" }));
  ok("a mod mutes somebody from posters", await act(mod, "posterAdmin", { op: "mute", uid: w.uid }));
  check("it is written", (await owner("GET", `posterMutes/${w.uid}`)) === true);
  ok("and lifts it", await act(mod, "posterAdmin", { op: "mute", uid: w.uid, on: false }));
  ok("the admin bans the address", await act(adm, "modIpBan", { uid: w.uid }));
  check("it is on the list", (await owner("GET", "bannedIps/203_0_113_7")) !== null);
  await sleepMs(16000);
  const other = await fresh("t_mod_other", { blood: 0, ...OLD });
  const blocked = await withIp(other, "sync", {}, "203.0.113.7");
  check("anybody from that address is turned away", blocked.status === 403 && /connection has been banned/.test(blocked.error ?? ""), JSON.stringify(blocked).slice(0, 150));
  ok("from another address the game works", await withIp(other, "sync", {}, "198.51.100.9"));
  ok("the admin is never turned away", await withIp(adm, "sync", {}, "203.0.113.7"));
  ok("the admin lifts it", await act(adm, "modIpBan", { uid: w.uid, on: false }));
  await sleepMs(16000);
  ok("and the address works again", await withIp(other, "sync", {}, "203.0.113.7"));
  await owner("DELETE", "bannedIps"); await owner("DELETE", `ips`); await owner("DELETE", "notices"); await owner("DELETE", "kicks");
}

console.log("--- making accounts (the server writes the profile, and limits how many)");
{
  await owner("DELETE", "signups");
  const R = Math.random().toString(36).slice(2, 6);
  const mk = async (nm, device) => { const u = await account(nm); if (device) u.device = device; await owner("DELETE", `users/${u.uid}`); await owner("DELETE", `usernames/${nm.toLowerCase()}`); return u; };
  const withIp = (u, a, args, ip) => fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${u.token}`, "content-type": "application/json", "cf-connecting-ip": ip, ...(u.device ? { "x-device": u.device } : {}) }, body: JSON.stringify({ a, args }) }).then(async (r) => ({ status: r.status, ...(await r.json()) }));
  const a1 = await mk(`t_su_${R}a`, `device-${R}-1`);
  check("a sign-in without a profile can't make one itself", refused(await clientWrite(a1, `users/${a1.uid}`, { name: `t_su_${R}a`, gender: "M", figure: "", blood: 0, createdAt: Date.now() })));
  check("or just a bit of one", refused(await clientWrite(a1, `users/${a1.uid}/name`, `t_su_${R}a`)));
  await owner("PUT", `rooms/u_${a1.uid}/players/${a1.uid}`, null);
  await owner("PUT", `roomsMeta/u_${a1.uid}`, { owner: a1.uid, ownerName: "x", name: "r", access: "open", w: 8, h: 8 });
  check("and can't chat or stand in a room", refused(await say(a1, "lobby", "free lemonade")) && refused(await clientWrite(a1, `rooms/lobby/players/${a1.uid}`, { name: "x", figure: "x", x: 1, y: 1, dir: 2 })));
  bad("the name has to be the one it signed in with", await act(a1, "register", { name: `t_su_${R}zzz` }));
  bad("not a bot name", await act(await mk(`blodigoktober${R.slice(0, 3)}`, undefined), "register", { name: `blodigoktober${R.slice(0, 3)}` }));
  bad("not a reserved name", await act(await mk("admin", undefined), "register", { name: "admin" }));
  ok("the real name makes the profile", await act(a1, "register", { name: `t_su_${R}a` }));
  const u1 = await owner("GET", `users/${a1.uid}`);
  check("with its name, 0 blood and a time", u1 && u1.name === `t_su_${R}a` && u1.blood === 0 && Math.abs(u1.createdAt - Date.now()) < 15000, JSON.stringify(u1));
  check("the username is claimed", (await owner("GET", `usernames/t_su_${R}a`)) === a1.uid);
  ok("asking again is fine", await act(a1, "register", { name: `t_su_${R}a` }));
  {
    await owner("DELETE", "usernames/playlistmod"); await owner("DELETE", "roles/PMUID");
    const pm = await mk("playlistmod", `device-${R}-pm`);
    await owner("DELETE", `roles/${pm.uid}`);
    ok("the playlistmod account can be made", await act(pm, "register", { name: "playlistmod" }));
    check("and is an admin at once", (await owner("GET", `roles/${pm.uid}`)) === "admin");
    await owner("DELETE", `roles/${pm.uid}`); await owner("DELETE", `users/${pm.uid}`); await owner("DELETE", "usernames/playlistmod");
  }
  ok("the new account then plays (sync)", await act(a1, "sync"));
  // one device: 3 a day
  const d2 = await mk(`t_su_${R}b`, `device-${R}-1`), d3 = await mk(`t_su_${R}c`, `device-${R}-1`), d4 = await mk(`t_su_${R}d`, `device-${R}-1`);
  ok("the second account from the device", await act(d2, "register", { name: `t_su_${R}b` }));
  ok("the third", await act(d3, "register", { name: `t_su_${R}c` }));
  const r4 = await act(d4, "register", { name: `t_su_${R}d` });
  check("the fourth is turned away", r4.ok === false && /this device/.test(r4.error ?? ""), JSON.stringify(r4));
  check("and has no profile", (await owner("GET", `users/${d4.uid}`)) === null);
  // one address: 5 a day
  for (let i = 0; i < 5; i++) { const u = await mk(`t_su_${R}i${i}`, `device-${R}-i${i}`); ok(`address account ${i + 1}`, await withIp(u, "register", { name: `t_su_${R}i${i}` }, "192.0.2.55")); }
  const u6 = await mk(`t_su_${R}i9`, `device-${R}-i9`);
  const r6 = await withIp(u6, "register", { name: `t_su_${R}i9` }, "192.0.2.55");
  check("the sixth from one address is turned away", r6.ok === false && /connection/.test(r6.error ?? ""), JSON.stringify(r6));
  ok("another address is fine", await withIp(u6, "register", { name: `t_su_${R}i9` }, "192.0.2.56"));
  // the admin renames somebody
  const rn = await fresh(`t_rn_${R}`, { blood: 0, ...OLD }); await act(rn, "sync");
  await owner("PUT", `usernames/t_rn_${R}`, rn.uid); await owner("PUT", `profiles/${rn.uid}`, { name: `t_rn_${R}`, figure: "x" });
  bad("a mod can't rename", await act(mod, "modRename", { uid: rn.uid, name: `t_rnn_${R}` }));
  await owner("PUT", `presence/${rn.uid}`, { name: `t_rn_${R}`, room: "lobby", seen: Date.now() });
  await owner("PUT", `rooms/lobby/players/${rn.uid}`, { name: `t_rn_${R}`, figure: "x", x: 5, y: 5, dir: 2 });
  await owner("PUT", `roomsMeta/u_${rn.uid}`, { owner: rn.uid, ownerName: `t_rn_${R}`, name: `t_rn_${R}s værelse`, w: 8, h: 8 });
  ok("the admin renames", await act(adm, "modRename", { uid: rn.uid, name: `t_RN2_${R}` }));
  check("the room's Danish name follows the player", (await owner("GET", `roomsMeta/u_${rn.uid}/name`)) === `t_RN2_${R}s værelse`.slice(0, 28), String(await owner("GET", `roomsMeta/u_${rn.uid}/name`)));
  await owner("DELETE", `roomsMeta/u_${rn.uid}`);
  check("their presence and the room show the new name at once", (await owner("GET", `presence/${rn.uid}/name`)) === `t_RN2_${R}` && (await owner("GET", `rooms/lobby/players/${rn.uid}/name`)) === `t_RN2_${R}`);
  await owner("DELETE", `rooms/lobby/players/${rn.uid}`); await owner("DELETE", `presence/${rn.uid}`);
  check("the name is changed everywhere", (await owner("GET", `users/${rn.uid}/name`)) === `t_RN2_${R}` && (await owner("GET", `profiles/${rn.uid}/name`)) === `t_RN2_${R}` && (await owner("GET", `usernames/t_rn2_${R}`)) === rn.uid && (await owner("GET", `usernames/t_rn_${R}`)) === null);
  const login = await fetch(`${AUTH}:signInWithPassword?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `t_rn2_${R}@users.bobba.invalid`, password: "secret1", returnSecureToken: true }) }).then((r) => r.json());
  check("and the player logs in with the new name", !!login.idToken && login.localId === rn.uid, JSON.stringify(login).slice(0, 100));
  bad("not to a taken name", await act(adm, "modRename", { uid: rn.uid, name: "t_mod_p1" }));
  bad("not to a reserved name", await act(adm, "modRename", { uid: rn.uid, name: "admin" }));
  await owner("DELETE", "signups");
}

console.log("--- the log");
const log = Object.values((await owner("GET", "modLog")) ?? {});
check("what the mods did is written down", log.some((x) => x.what === "mute" && x.byName === "t_mod_m") && log.some((x) => x.what === "ban") && log.some((x) => x.what === "promote"), JSON.stringify(log).slice(0, 200));

console.log("--- a ban or a kick takes them out of the room at once");
{
  const victim = await fresh("t_mod_out1"), victim2 = await fresh("t_mod_out2");
  for (const v of [victim, victim2]) { await owner("PUT", `presence/${v.uid}`, { name: v.name, room: "lobby", seen: Date.now() }); await stand(v, "lobby", 6, 6); }
  ok("a mod kicks", await act(mod, "modKick", { uid: victim.uid, reason: "out" }));
  check("they are gone from the room", (await owner("GET", `rooms/lobby/players/${victim.uid}`)) === null);
  const kick = await owner("GET", `kicks/${victim.uid}`);
  check("and their browser is told", kick && kick.reason === "out", JSON.stringify(kick));
  ok("a mod bans", await act(mod, "modBan", { uid: victim2.uid }));
  check("a ban takes them out of the room too", (await owner("GET", `rooms/lobby/players/${victim2.uid}`)) === null);
  check("and logs them out", !!(await owner("GET", `kicks/${victim2.uid}`)));
}

await owner("DELETE", "roles"); await owner("DELETE", "mutes"); await owner("DELETE", "reports");
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
