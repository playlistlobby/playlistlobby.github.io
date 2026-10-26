// Bagmand tests: his visit hours, the shared stock, selling back, poppies and opium, the mixes, the special weeds and drugs, the deadly stab and the rules (a separate file so they run on their own)
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


const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slotAss = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
const dkHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Copenhagen", hourCycle: "h23", hour: "2-digit" }).format(new Date()));
const open = (ago = 1000) => owner("PUT", "bagmand/force", Date.now() - ago); // (a visit that began a moment ago)

console.log("--- bagmand is only there in his hours");
{
  await owner("DELETE", "bagmand");
  const a = await fresh("t_bg_a", { blood: 500 });
  await act(a, "sync"); await stand(a, "lobby", 3, 3);
  if (![1, 10, 15].includes(dkHour)) bad("closed: he isn't there now", await act(a, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  else console.log("(skipped: it is one of his hours right now)");
  await open();
  ok("open: buying works", await act(a, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  await owner("PUT", "bagmand/force", Date.now() + 3_600_000);
  if (![1, 10, 15].includes(dkHour)) bad("a visit that starts later is not open yet", await act(a, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  await owner("PUT", "bagmand/force", Date.now() - 3_700_000);
  if (![1, 10, 15].includes(dkHour)) bad("and one that ended is not open either", await act(a, "bagmandBuy", { item: "poppyseed", qty: 1 }));
}

console.log("--- buying: poppy seeds (5 per visit for each player) and natryger (as many as you like)");
{
  await owner("DELETE", "bagmand");
  const start = Date.now() - 2000;
  await owner("PUT", "bagmand/force", start);
  const a = await fresh("t_bg_buy1", { blood: 500 }), b = await fresh("t_bg_buy2", { blood: 500 }), poor = await fresh("t_bg_poor", { blood: 20 });
  for (const u of [a, b, poor]) { await act(u, "sync"); await stand(u, "lobby", 3, 3); }
  bad("not an item of his", await act(a, "bagmandBuy", { item: "weed", qty: 1 }));
  bad("not nothing", await act(a, "bagmandBuy", { item: "poppyseed", qty: 0 }));
  bad("can't afford a seed (50)", await act(poor, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  const r1 = await act(a, "bagmandBuy", { item: "poppyseed", qty: 3 });
  ok("a buys 3 seeds", r1);
  check("150 blood, 3 seeds", r1.state.blood === 350 && total(r1.state.inventory, "poppyseed") === 3, JSON.stringify([r1.state.blood, r1.data]));
  bad("a wants 3 more but only 2 are left for a", await act(a, "bagmandBuy", { item: "poppyseed", qty: 3 }));
  ok("a takes the last 2", await act(a, "bagmandBuy", { item: "poppyseed", qty: 2 }));
  bad("a has had the 5", await act(a, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  ok("but b has 5 of his own", await act(b, "bagmandBuy", { item: "poppyseed", qty: 5 }));
  bad("and not a sixth", await act(b, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  check("what each player bought is kept for the visit", (await owner("GET", `bagmand/${start}/sold/poppyseed/${a.uid}`)) === 5 && (await owner("GET", `bagmand/${start}/sold/poppyseed/${b.uid}`)) === 5);
  await owner("PUT", "bagmand/force", start + 1000); // (the next visit: new stock)
  ok("a new visit has new stock", await act(a, "bagmandBuy", { item: "poppyseed", qty: 1 }));
  await owner("PUT", `users/${a.uid}/blood`, 400); // (the seeds have used it up)
  const n = await act(a, "bagmandBuy", { item: "natryger", qty: 10 });
  ok("natryger is unlimited", n);
  check("10 natryger for 250", n.state.blood === 400 - 250 && total(n.state.inventory, "natryger") === 10, String(n.state.blood));
  await owner("DELETE", `rooms/lobby/players/${a.uid}`); await stand(a, "shop", 3, 3);
  bad("only in the basement", await act(a, "bagmandBuy", { item: "natryger", qty: 1 }));
}

console.log("--- selling back (and only to him)");
{
  await open();
  const a = await fresh("t_bg_sell", { blood: 0, inventory: inv({ item: "opium", qty: 3 }, { item: "opium", qty: 2, ass: true }, { item: "heroin", qty: 1 }, { item: "fentcn", qty: 1 }, { item: "loudpack", qty: 1 }, { item: "poppyseed", qty: 1 }, { item: "natryger", qty: 1 }, { item: "weed", qty: 1 }, { item: "joint_nat", qty: 1 }) });
  await act(a, "sync"); await stand(a, "lobby", 3, 3);
  let st = await state(a);
  const price = async (item, ass) => { const before = (await state(a)).blood; const s = await state(a); const r = await act(a, "bagmandSell", { slot: slotAss(s, item, ass), qty: 1 }); return r.ok ? r.state.blood - before : r; };
  check("opium 80", (await price("opium", false)) === 80);
  check("weak opium 40", (await price("opium", true)) === 40);
  check("heroin 130", (await price("heroin", false)) === 130);
  check("芬太尼 200", (await price("fentcn", false)) === 200);
  check("loudpack 265", (await price("loudpack", false)) === 265);
  bad("not the seeds", await act(a, "bagmandSell", { slot: slotAss(await state(a), "poppyseed", false), qty: 1 }));
  bad("not his own blue weed", await act(a, "bagmandSell", { slot: slotAss(await state(a), "natryger", false), qty: 1 }));
  bad("not ordinary weed", await act(a, "bagmandSell", { slot: slotAss(await state(a), "weed", false), qty: 1 }));
  bad("not a rolled joint", await act(a, "bagmandSell", { slot: slotAss(await state(a), "joint_nat", false), qty: 1 }));
  const all = await act(a, "bagmandSell", { slot: slotAss(await state(a), "opium", false), qty: 99 });
  ok("the rest of the opium at once", all);
  check("2 good opium: 160 more (1 weak one is left)", total(all.state.inventory, "opium") === 1 && all.state.blood === 80 + 40 + 130 + 200 + 265 + 160, String(all.state.blood));
  st = await state(a);
  bad("6ixty doesn't buy it", await act(a, "sellWeed", { slot: slotAss(st, "opium", true), qty: 1 }));
  await owner("DELETE", `rooms/lobby/players/${a.uid}`); await stand(a, "shop", 3, 3);
  bad("he buys only in the basement", await act(a, "bagmandSell", { slot: slotAss(st, "opium", true), qty: 1 }));
  await stand(a, "lobby", 3, 3);
  await owner("PUT", "bagmand/force", Date.now() - 3_700_000);
  if (![1, 10, 15].includes(dkHour)) bad("and only while he's there", await act(a, "bagmandSell", { slot: slotAss(st, "opium", true), qty: 1 }));
}

console.log("--- the poppy: 4 hours, no water needed, opium, no seed back");
{
  const a = await fresh("t_bg_poppy", { blood: 0, inventory: inv({ item: "poppyseed", qty: 2 }, { item: "wateringcan_full", qty: 1 }) });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_bg_poppy", name: "r", access: "knock", w: 8, h: 8, furni: { k1: { kind: "f_planter", x: 2, y: 2 }, k2: { kind: "f_planter", x: 4, y: 2 } } });
  await stand(a, room, 4, 4);
  ok("plant a poppy seed", await act(a, "plant", { fid: "k1", slot: 0 }));
  check("what grows is a poppy", (await owner("GET", `roomsMeta/${room}/furni/k1/crop`)) === "poppy");
  ok("and a second", await act(a, "plant", { fid: "k2", slot: 0 }));
  bad("not ready", await act(a, "harvest", { fid: "k1" }));
  await owner("PATCH", `roomsMeta/${room}/furni/k1`, { plantedAt: Date.now() - 3 * 3_600_000 });
  bad("not ready after 3 hours", await act(a, "harvest", { fid: "k1" }));
  const st0 = await state(a);
  bad("a poppy needs no water", await act(a, "water", { fid: "k1", slot: slotAss(st0, "wateringcan_full", false) }));
  await owner("PATCH", `roomsMeta/${room}/furni/k1`, { plantedAt: Date.now() - 4 * 3_600_000 - 1000, wateredAt: Date.now() - 3 * 3_600_000 });
  const h1 = await act(a, "harvest", { fid: "k1" });
  ok("harvest after 4 hours", h1);
  check("1 good opium, no seed back", total(h1.state.inventory, "opium") === 1 && !h1.state.inventory.some((x) => x && x.item === "opium" && x.ass) && !h1.data.seed && total(h1.state.inventory, "poppyseed") === 0, JSON.stringify([h1.data, h1.state.inventory.filter(Boolean)]));
  await owner("PATCH", `roomsMeta/${room}/furni/k2`, { plantedAt: Date.now() - 4 * 3_600_000 - 1000 });
  const h2 = await act(a, "harvest", { fid: "k2" });
  check("a poppy that was never watered gives good opium too", h2.ok === true && h2.state.inventory.some((x) => x && x.item === "opium" && !x.ass) && !h2.state.inventory.some((x) => x && x.item === "opium" && x.ass), JSON.stringify(h2).slice(0, 200));
  check("the pots are empty again", (await owner("GET", `roomsMeta/${room}/furni/k1/plantedAt`)) === null && (await owner("GET", `roomsMeta/${room}/furni/k1/crop`)) === null);
}

console.log("--- the mixes");
{
  const recipes = [
    ["opium", "wateringcan_full", "heroin", 1, 2 * 60],
    ["opium", "codeine", "ketamine", 1, 2 * 60],
    ["opium", "pill", "percs", 1, 150],
    ["opium", "shroom", "twocb", 1, 3 * 60],
    ["opium", "weed", "caliweed", 1, 3 * 60],
    ["opium", "superpill", "fentcn", 1, 4 * 60],
    ["twocb", "weed", "pinkweed", 2, 2 * 60],
    ["heroin", "weed", "brownweed", 2, 2 * 60],
    ["natryger", "caliweed", "loudpack", 1, 3 * 60],
  ];
  const items = {};
  for (const [x, y] of recipes) { items[x] = (items[x] ?? 0) + 2; items[y] = (items[y] ?? 0) + 2; }
  const m = await fresh("t_bg_mix", { inventory: inv(...Object.entries(items).map(([item, qty]) => ({ item, qty }))) });
  await act(m, "sync");
  const room = `u_${m.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: m.uid, ownerName: "t_bg_mix", name: "r", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(m, room, 4, 4);
  for (const [x, y, out, qty, minutes] of recipes) {
    const st = await state(m);
    const r = await act(m, "mix", { fid: "mx", a: slotAss(st, x, false), b: slotAss(st, y, false) });
    ok(`${x} + ${y} -> ${out}`, r);
    const job = await owner("GET", `roomsMeta/${room}/furni/mx/mixJob`);
    check(`  takes ${minutes} minutes`, job && Math.abs(job.ms - minutes * 60_000) < 1000, JSON.stringify(job));
    await owner("PATCH", `roomsMeta/${room}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
    const before = total((await state(m)).inventory, out);
    const c = await act(m, "mixCollect", { fid: "mx" });
    check(`  collect ${qty} ${out}`, c.ok === true && total(c.state.inventory, out) === before + qty, JSON.stringify(c).slice(0, 200));
  }
  const st = await state(m);
  check("the watering can came back empty", total(st.inventory, "wateringcan") === 1, JSON.stringify(st.inventory.filter(Boolean).map((x) => x.item)));
  bad("weak opium can't be mixed", await (async () => { const w = await fresh("t_bg_weak", { inventory: inv({ item: "opium", qty: 1, ass: true }, { item: "weed", qty: 1 }) }); await act(w, "sync"); await owner("PUT", `roomsMeta/u_${w.uid}`, { owner: w.uid, ownerName: "x", name: "r", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } }); await stand(w, `u_${w.uid}`, 4, 4); return act(w, "mix", { fid: "mx", a: 0, b: 1 }); })());
  bad("heroin + opium is nothing", await (async () => { const w = await fresh("t_bg_none", { inventory: inv({ item: "opium", qty: 1 }, { item: "heroin", qty: 1 }) }); await act(w, "sync"); await owner("PUT", `roomsMeta/u_${w.uid}`, { owner: w.uid, ownerName: "x", name: "r", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } }); await stand(w, `u_${w.uid}`, 4, 4); return act(w, "mix", { fid: "mx", a: 0, b: 1 }); })());
}

console.log("--- rolling and smoking the special weeds");
{
  const specials = [
    // item, mult (joint), boost ms, speed ms, look, look ms, deadly
    ["natryger", 2, 240_000, 240_000, "blue", 240_000, 0],
    ["caliweed", 4, 150_000, 0, "gold", 150_000, 0],
    ["pinkweed", 3, 150_000, 150_000, "pink", 150_000, 0],
    ["brownweed", 4, 180_000, 0, "brown", 180_000, 0],
    ["loudpack", 3, 60_000, 60_000, "sparkle", 60_000, 2],
  ];
  for (const [item, mult, boostMs, speedMs, look, lookMs, deadly] of specials) {
    const u = await fresh(`t_bg_s_${item}`, { inventory: inv({ item, qty: 2 }, { item: "jointpaper", qty: 1 }, { item: "bluntwrap", qty: 1 }, { item: "lighter", qty: 1 }) });
    await act(u, "sync");
    const st = await state(u);
    const j = await act(u, "combine", { a: slotAss(st, item, false), b: slotAss(st, "jointpaper", false) });
    const suffix = { natryger: "nat", caliweed: "cali", pinkweed: "pink", brownweed: "brown", loudpack: "loud" }[item];
    check(`${item} + paper = joint_${suffix}`, j.ok === true && total(j.state.inventory, `joint_${suffix}`) === 1, JSON.stringify(j).slice(0, 160));
    const b = await act(u, "combine", { a: slotAss(j.state, item, false), b: slotAss(j.state, "bluntwrap", false) });
    check(`${item} + wrap = blunt_${suffix}`, b.ok === true && total(b.state.inventory, `blunt_${suffix}`) === 1);
    const lit = await act(u, "light", { slot: slotAss(b.state, `joint_${suffix}`, false) });
    ok(`light the ${item} joint`, lit);
    const slot = lit.state.inventory.findIndex((x) => x && x.lit);
    await owner("PATCH", `users/${u.uid}/inventory/${slot}`, { lit: Date.now() - 70_000 });
    const fin = await act(u, "finishSmoke", { slot });
    ok(`smoke it`, fin);
    const s = fin.state, now = Date.now();
    check(`  stab x${mult} for ${boostMs / 1000}s`, s.boostMult === mult && Math.abs(s.boostUntil - now - boostMs) < 3000, JSON.stringify([s.boostMult, s.boostUntil - now]));
    check(`  speed ${speedMs ? "x2 for " + speedMs / 1000 + "s" : "none"}`, speedMs ? s.speedMult === 2 && Math.abs(s.speedUntil - now - speedMs) < 3000 : s.speedUntil < now, JSON.stringify([s.speedMult, s.speedUntil - now]));
    check(`  look ${look} for ${lookMs / 1000}s`, s.lookKind === look && Math.abs(s.lookUntil - now - lookMs) < 3000, JSON.stringify([s.lookKind, s.lookUntil - now]));
    check(`  ${deadly} deadly stabs`, s.deadlyLeft === deadly, String(s.deadlyLeft));
    if (deadly) check("  that last 3 minutes", Math.abs(s.deadlyUntil - now - 180_000) < 3000);
  }
}

console.log("--- the drugs");
{
  const drugs = {
    heroin: { mult: 4, boost: 180_000, look: "brown", lookMs: 180_000, nod: 10_000 },
    percs: { mult: 3, boost: 180_000, speed: 180_000, look: "purple", lookMs: 180_000 },
    twocb: { mult: 2, boost: 180_000, speed: 180_000, shroom: 180_000, look: "rainbow", lookMs: 180_000 },
    ketamine: { speed: 60_000, look: "horse", lookMs: 60_000 },
    fentcn: { mult: 4, boost: 180_000, speed: 180_000, shroom: 180_000, chem: 180_000, lean: true, look: "horse", lookMs: 60_000, rush: 10_000 },
  };
  for (const [item, d] of Object.entries(drugs)) {
    const u = await fresh(`t_bg_d_${item}`, { inventory: inv({ item, qty: 2 }) });
    await act(u, "sync");
    const r = await act(u, "consume", { slot: 0 });
    ok(`swallow ${item}`, r);
    const s = r.state, now = Date.now(), within = (t, ms) => Math.abs(t - now - ms) < 3000;
    check("  one used up", total(s.inventory, item) === 1);
    check("  the answer says what it is", r.data.kind === "drug" && r.data.drug === item && r.data.nodMs === (d.nod ?? 0) && r.data.rushMs === (d.rush ?? 0), JSON.stringify(r.data));
    if (d.boost) check(`  stab x${d.mult} for ${d.boost / 1000}s`, s.boostMult === d.mult && within(s.boostUntil, d.boost), JSON.stringify([s.boostMult, s.boostUntil - now]));
    else check("  no stab bonus", s.boostUntil < now);
    if (d.speed) check(`  x2 speed for ${d.speed / 1000}s`, s.speedMult === 2 && within(s.speedUntil, d.speed), JSON.stringify([s.speedMult, s.speedUntil - now]));
    if (d.shroom) check("  every door open for 3 minutes", within(s.shroomUntil, d.shroom));
    if (d.chem) check("  flashing for 3 minutes", within(s.chemUntil, d.chem));
    if (d.lean) check("  the lean: an hour of better bins and the cup", within(s.leanUntil, 3_600_000) && within(s.cupUntil, 120_000));
    check(`  look ${d.look} for ${d.lookMs / 1000}s`, s.lookKind === d.look && within(s.lookUntil, d.lookMs), JSON.stringify([s.lookKind, s.lookUntil - now]));
  }
  const l = await fresh("t_bg_laced", { inventory: inv({ item: "laced_heroin", qty: 1 }) });
  await act(l, "sync");
  check("laced heroin kills", (await act(l, "consume", { slot: 0 })).data?.kind === "fentdeath");
}

console.log("--- the deadly stab");
{
  await owner("DELETE", "roles/t_none");
  const k = await fresh("t_bg_k", { blood: 0, inventory: inv({ item: "knife", qty: 1 }), deadlyLeft: 2, deadlyUntil: Date.now() + 120_000 });
  const v = await fresh("t_bg_v", { blood: 30 }), v2 = await fresh("t_bg_v2", { blood: 4 }), v3 = await fresh("t_bg_v3", { blood: 50 });
  const modv = await fresh("t_bg_mod", { blood: 50 }), far = await fresh("t_bg_far", { blood: 50 }), peer = await fresh("t_bg_peer", { blood: 50 });
  for (const u of [k, v, v2, v3, modv, peer]) { await act(u, "sync"); }
  await stand(k, "lobby", 5, 5); await stand(v, "lobby", 6, 5); await stand(v2, "lobby", 6, 6); await stand(v3, "lobby", 4, 4); await stand(modv, "lobby", 5, 6); await stand(far, "lobby", 11, 20); await stand(peer, "lobby", 4, 5);
  await owner("PUT", `roles/${modv.uid}`, "mod");
  await owner("PUT", `peers/${k.uid}/${peer.uid}`, true);
  await sleep(16_000); // (the server remembers a role for 15 seconds)
  bad("not on yourself", await act(k, "deadlyStab", { target: k.uid, room: "lobby" }));
  bad("not on a mod", await act(k, "deadlyStab", { target: modv.uid, room: "lobby" }));
  bad("not on somebody from your device", await act(k, "deadlyStab", { target: peer.uid, room: "lobby" }));
  bad("not out of reach", await act(k, "deadlyStab", { target: far.uid, room: "lobby" }));
  bad("not in another room", await act(k, "deadlyStab", { target: v.uid, room: "shop" }));
  const r = await act(k, "deadlyStab", { target: v.uid, room: "lobby" });
  ok("a deadly stab", r);
  check("10 drops fall out of them", r.data.dropped === 10 && (await bloodOf(v)) === 20, JSON.stringify(r.data));
  check("they get nothing and one stab is used", r.state.blood === 0 && r.state.deadlyLeft === 1, JSON.stringify([r.state.blood, r.state.deadlyLeft]));
  const pile = await owner("GET", "rooms/lobby/drops");
  check("a pile of 10 blood lies where they fell", Object.values(pile ?? {}).some((d) => d.item === "blood" && d.qty === 10 && d.by === v.uid), JSON.stringify(pile).slice(0, 200));
  const home = await owner("GET", `sendHome/${v.uid}`);
  check("and they are sent home", home && home.by === k.uid && Math.abs(home.at - Date.now()) < 15000, JSON.stringify(home));
  const r2 = await act(k, "deadlyStab", { target: v2.uid, room: "lobby" });
  ok("a second one, on somebody with less than 10", r2);
  check("they only lose what they had", r2.data.dropped === 4 && (await bloodOf(v2)) === 0);
  bad("only two", await act(k, "deadlyStab", { target: v3.uid, room: "lobby" }));
  const k2 = await fresh("t_bg_k2", { blood: 0, inventory: inv({ item: "knife", qty: 1 }), deadlyLeft: 2, deadlyUntil: Date.now() - 1000 });
  await act(k2, "sync"); await stand(k2, "lobby", 4, 3);
  bad("they ran out", await act(k2, "deadlyStab", { target: v3.uid, room: "lobby" }));
  const k3 = await fresh("t_bg_k3", { blood: 0, deadlyLeft: 2, deadlyUntil: Date.now() + 100_000 });
  await act(k3, "sync"); await stand(k3, "lobby", 3, 4);
  bad("without a knife", await act(k3, "deadlyStab", { target: v3.uid, room: "lobby" }));
  const plain = await fresh("t_bg_k4", { blood: 0, inventory: inv({ item: "knife", qty: 1 }) });
  await act(plain, "sync"); await stand(plain, "lobby", 3, 3);
  bad("a plain player has no deadly stab", await act(plain, "deadlyStab", { target: v3.uid, room: "lobby" }));
  check("the ordinary stab still works the old way", (await act(plain, "stab", { target: v3.uid, room: "lobby" })).ok === true);
}

console.log("--- the rules");
{
  const a = await fresh("t_bg_rules", { blood: 0 });
  await act(a, "sync");
  await stand(a, "lobby", 3, 3);
  check("a player can't write the force node", refused(await clientWrite(a, "bagmand/force", Date.now())));
  check("or a stock count", refused(await clientWrite(a, "bagmand/1/sold/poppyseed", 0)));
  check("or send somebody home", refused(await clientWrite(a, `sendHome/${a.uid}`, { at: Date.now() })));
  const read = await fetch(`${DB}/bagmand.json?ns=${NS}&auth=${a.token}`);
  check("but can read the stock", read.status === 200, String(read.status));
  const mine = await fetch(`${DB}/sendHome/${a.uid}.json?ns=${NS}&auth=${a.token}`);
  check("and their own sendHome", mine.status === 200);
  const others = await fetch(`${DB}/sendHome/${(await fresh("t_bg_rules2")).uid}.json?ns=${NS}&auth=${a.token}`);
  check("not somebody else's", refused(others));
  check("the look in the room must be what the server says", refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/look`, "horse")));
  await owner("PUT", `users/${a.uid}/lookKind`, "horse");
  check("and then it is allowed", !refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/look`, "horse")));
  check("a made-up look is not", refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/look`, "banana")));
  check("run speed up to 10 is allowed", !refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/fastMult`, 10)));
  check("not 11", refused(await clientWrite(a, `rooms/lobby/players/${a.uid}/fastMult`, 11)));
}

console.log("--- bagmand sells the syringe, and the loudspeaker");
{
  await open();
  const a = await fresh("t_bg_syr", { blood: 100 });
  await act(a, "sync"); await stand(a, "lobby", 3, 3);
  const r = await act(a, "bagmandBuy", { item: "syringe", qty: 1 });
  ok("buy a syringe", r);
  check("20 blood, 1 syringe, no stock limit", r.state.blood === 80 && total(r.state.inventory, "syringe") === 1);
  ok("and another", await act(a, "bagmandBuy", { item: "syringe", qty: 1 }));
  const l = await fresh("t_bg_loud", { blood: 0, inventory: inv({ item: "loudspeaker", qty: 1 }) });
  const plain = await fresh("t_bg_noloud", { blood: 0 });
  const muted = await fresh("t_bg_muted", { blood: 0, inventory: inv({ item: "loudspeaker", qty: 1 }) });
  for (const u of [l, plain, muted]) await act(u, "sync");
  await owner("DELETE", "broadcast"); await owner("DELETE", `loudspeaker/${l.uid}`);
  bad("no loudspeaker, no message", await act(plain, "loudspeaker", { text: "hej" }));
  bad("an empty message", await act(l, "loudspeaker", { text: "" }));
  bad("too long", await act(l, "loudspeaker", { text: "x".repeat(101) }));
  await owner("PUT", `mutes/${muted.uid}`, { until: Date.now() + 600000, by: "x" });
  bad("a muted player can't", await act(muted, "loudspeaker", { text: "hej" }));
  ok("the message goes out", await act(l, "loudspeaker", { text: "Hej alle sammen" }));
  const b = await owner("GET", "broadcast");
  check("it is on the broadcast node, with the name and the time", b && b.text === "Hej alle sammen" && b.byName === "t_bg_loud" && Math.abs(b.at - Date.now()) < 15000, JSON.stringify(b));
  bad("once every 6 hours", await act(l, "loudspeaker", { text: "igen" }));
  await owner("PUT", `loudspeaker/${l.uid}`, Date.now() - 6 * 3_600_000 - 1000);
  ok("after 6 hours it works again", await act(l, "loudspeaker", { text: "igen" }));
  check("the loudspeaker can't be dropped", (await act(l, "drop", { room: "lobby", x: 4, y: 4, slot: 0, qty: 1 })).ok === false);
  check("a player can't write the broadcast", refused(await clientWrite(l, "broadcast", { at: Date.now(), text: "x" })));
  check("but can read it", (await fetch(`${DB}/broadcast.json?ns=${NS}&auth=${l.token}`)).status === 200);
  await owner("DELETE", "broadcast");
}

await owner("DELETE", "bagmand");

console.log(`
${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
