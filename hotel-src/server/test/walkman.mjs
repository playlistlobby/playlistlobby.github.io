// The walkman: bought in the record shop (100 blood, one in the pocket), holds one CD, plays wherever you are, pause / play / eject, one loaned CD at a time
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/walkman.mjs (server/)
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
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 220));
const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "x", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  for (const r of ["lobby", "shop"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`);
  await owner("DELETE", `walkman/${u.uid}`);
  return u;
};
const stand = (u, room) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x: 5, y: 5, dir: 2 });
const state = async (u) => (await act(u, "sync")).state;
const have = (st, item) => st.inventory.reduce((n, x) => n + (x && x.item === item ? x.qty : 0), 0);
const slotOf = (st, item) => st.inventory.findIndex((s) => s && s.item === item);
const refused = (r) => r.status === 401 || r.status === 403;

const a = await fresh("t_wk_a", { blood: 500 });
const b = await fresh("t_wk_b", { blood: 50, inventory: inv({ item: "cd", qty: 1 }) });
await act(a, "sync"); await act(b, "sync");

console.log("--- buying");
bad("not outside the shop", await act(a, "buyWalkman"));
await stand(a, "shop"); await stand(b, "shop");
bad("blood is needed", await act(b, "buyWalkman"));
ok("buy it for 100", await act(a, "buyWalkman"));
let st = await state(a);
check("100 blood gone, a walkman in the pocket", st.blood === 400 && slotOf(st, "walkman") >= 0, JSON.stringify(st.blood));
bad("one at a time", await act(a, "buyWalkman"));

console.log("--- playing");
await owner("PUT", `users/${a.uid}/inventory/5`, { item: "cd", qty: 1 });
st = await state(a);
const cdSlot = slotOf(st, "cd");
bad("no walkman, no music (b)", await act(b, "cdInsert", { room: "walk", slot: 0, durationMs: 60000 }));
ok("a CD goes into the walkman anywhere (the lobby)", await (async () => { await stand(a, "lobby"); return act(a, "cdInsert", { room: "walk", slot: cdSlot, durationMs: 60000 }); })());
const row = await owner("GET", `walkman/${a.uid}`);
check("the state is at walkman/<uid>", row && row.by === a.uid && row.track === "freakme", JSON.stringify(row));
check("the CD is loaned out", (await state(a)).inventory.some((s) => s && s.item === "cd" && s.inPlayer === "walk"));
await owner("PUT", `users/${a.uid}/inventory/6`, { item: "cd_green", qty: 1 });
st = await state(a);
bad("only one CD in it", await act(a, "cdInsert", { room: "walk", slot: slotOf(st, "cd_green"), durationMs: 60000 }));
bad("and the speakers wait", await act(a, "cdInsert", { room: "lobby", slot: slotOf(st, "cd_green"), durationMs: 60000 }));
ok("pause", await act(a, "cdControl", { room: "walk", op: "pause" }));
check("paused", !!(await owner("GET", `walkman/${a.uid}/pausedAt`)));
ok("play on", await act(a, "cdControl", { room: "walk", op: "play" }));
check("playing again", (await owner("GET", `walkman/${a.uid}/pausedAt`)) === null);
bad("nobody else can touch it", await act(b, "cdControl", { room: "walk", op: "pause" }));
const wr = await fetch(`${DB}/walkman/${b.uid}.json?ns=${NS}&auth=${a.token}`);
check("and only you can read it", refused({ status: wr.status }), String(wr.status));
ok("take the CD out", await act(a, "cdControl", { room: "walk", op: "eject" }));
st = await state(a);
check("the CD is back, the walkman is empty", st.inventory.some((s) => s && s.item === "cd" && !s.inPlayer) && (await owner("GET", `walkman/${a.uid}`)) === null);
ok("a pressed-less CD can go in again", await act(a, "cdInsert", { room: "walk", slot: slotOf(st, "cd"), durationMs: 60000 }));
ok("cdReturn hands it back too", await act(a, "cdReturn"));
check("and clears the walkman", (await owner("GET", `walkman/${a.uid}`)) === null);

console.log("--- the OG community EP");
await stand(a, "shop");
bad("the old single CDs are not sold any more", await act(a, "buyRecord", { item: "cd_blodig" }));
const bloodBefore = (await state(a)).blood;
ok("the EP is sold for 20 blood", await act(a, "buyRecord", { item: "cd_ogep" }));
check("20 blood gone", (await state(a)).blood === bloodBefore - 20);
bad("one per player", await act(a, "buyRecord", { item: "cd_ogep" }));
st = await state(a);
ok("it goes into the walkman", await act(a, "cdInsert", { room: "walk", slot: slotOf(st, "cd_ogep"), durationMs: 94000 }));
let ep = await owner("GET", `walkman/${a.uid}`);
check("it starts on kravle, on the ogep album", ep.album === "ogep" && ep.index === 0 && ep.title === "kravle - blodig oktober", JSON.stringify(ep));
ok("next song", await act(a, "cdControl", { room: "walk", op: "next", from: 0, durationMs: 52000 }));
ep = await owner("GET", `walkman/${a.uid}`);
check("now leolegit", ep.index === 1 && ep.title === "leolegit - blodoktober" && ep.album === "ogep", JSON.stringify(ep));
ok("and back", await act(a, "cdControl", { room: "walk", op: "prev", from: 1, durationMs: 94000 }));
await act(a, "cdControl", { room: "walk", op: "eject" });

console.log("--- the iPod (bagmand, 500 blood, one per player)");
const ip = await fresh("t_wk_ipod", { blood: 1200 });
await act(ip, "sync"); await stand(ip, "lobby");
await owner("PUT", "bagmand/force", Date.now() - 1000);
const bi = await act(ip, "bagmandBuy", { item: "ipod", qty: 1 });
ok("buy the iPod from bagmand", bi);
st = await state(ip);
check("500 blood gone, an iPod in the pocket", st.blood === 700 && slotOf(st, "ipod") >= 0, String(st.blood));
bad("only one per player", await act(ip, "bagmandBuy", { item: "ipod", qty: 1 }));
bad("6ixty doesn't sell it", await act(ip, "buySixty", { item: "ipod" }));
const b3 = await act(ip, "bagmandBuy", { item: "bandage", qty: 3 });
ok("3 bandages from bagmand for 10 each", b3);
check("30 blood gone", (await state(ip)).blood === 670, String((await state(ip)).blood));
bad("a 4th bandage in the same visit", await act(ip, "bagmandBuy", { item: "bandage", qty: 1 }));
bad("6ixty doesn't sell bandages", await act(ip, "buySixty", { item: "bandage" }));
const bk = await act(ip, "bagmandBuy", { item: "casekey", qty: 1 });
ok("a box key from bagmand", bk);
check("it costs 400", (await state(ip)).blood === 270 && have(await state(ip), "casekey") === 1, String((await state(ip)).blood));
ok("and there are always more keys", await act(ip, "bagmandBuy", { item: "casekey", qty: 0 + 1 }).then((r) => ({ ok: r.ok === false && /more drops/.test(r.error || "") })));
bad("6ixty doesn't sell keys", await act(ip, "buySixty", { item: "casekey" }));
await owner("DELETE", "bagmand/force");
await owner("DELETE", `rooms/lobby/players/${ip.uid}`);

for (const u of [a, b]) { await owner("DELETE", `walkman/${u.uid}`); for (const r of ["lobby", "shop"]) await owner("DELETE", `rooms/${r}/players/${u.uid}`); }
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
