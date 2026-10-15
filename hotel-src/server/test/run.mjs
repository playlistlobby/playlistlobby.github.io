// Integration tests: the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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

console.log("--- who is asking");
{
  const r = await fetch(`${API}/act`, { method: "POST", body: JSON.stringify({ a: "sync" }) });
  check("no token is refused (401)", r.status === 401);
  const r2 = await fetch(`${API}/act`, { method: "POST", headers: { authorization: "Bearer not.a.token" }, body: JSON.stringify({ a: "sync" }) });
  check("a garbage token is refused (401)", r2.status === 401);
  const u = await fresh("t_ask");
  bad("unknown action refused", await act(u, "giveMeEverything"), 400);
  bad("constructor trick refused", await act(u, "constructor"), 400);
}

console.log("--- login upgrades");
{
  const u = await fresh("t_sync");
  const r = await act(u, "sync");
  ok("sync", r);
  check("starter sofa in storage", r.state.storage.f_sofa === 1);
  const r2 = await act(u, "sync");
  check("a second sync gives nothing more", r2.state.storage.f_sofa === 1);
  check("starts with 0 blood", r2.state.blood === 0);
}

console.log("--- the introduction and the lighter job");
{
  const u = await fresh("t_quest");
  await act(u, "sync");
  bad("can't take the pill before the stab", await act(u, "sixty", { step: "pill" }));
  bad("can't skip to the first stab", await act(u, "sixty", { step: "firstStab" }));
  ok("knife", await act(u, "sixty", { step: "knife" }));
  bad("knife only once", await act(u, "sixty", { step: "knife" }));
  bad("first stab needs the private basement", await act(u, "sixty", { step: "firstStab" }));
  await stand(u, `tut_${u.uid}`, 7, 4);
  const fs = await act(u, "sixty", { step: "firstStab" });
  ok("first stab pays", fs);
  check("first stab paid 5", fs.state.blood === 5);
  bad("first stab only once", await act(u, "sixty", { step: "firstStab" }));
  ok("pill", await act(u, "sixty", { step: "pill" }));
  const slot = fs.state.inventory.findIndex((s) => s && s.item === "knife");
  check("knife is in the pocket", slot >= 0);
  const pillSlot = (await state(u)).inventory.findIndex((s) => s && s.item === "pill");
  const up = await act(u, "usePill", { slot: pillSlot });
  ok("swallow the pill", up);
  check("introduction is done (4)", up.state.tutorial === 4);
  bad("the job isn't ready for two hours", await act(u, "sixty", { step: "jobMoney" }));
  await owner("PATCH", `users/${u.uid}`, { questAt: Date.now() - 3 * 3600_000 });
  const jm = await act(u, "sixty", { step: "jobMoney" });
  ok("job money after two hours", jm);
  check("got the lighter price (2)", jm.state.blood === 7 && jm.data.amount === 2);
  bad("reward without a lighter", await act(u, "sixty", { step: "jobReward" }));
  ok("buy a lighter from the vending machine", await act(u, "buyVending", { id: "lighter" }));
  const jr = await act(u, "sixty", { step: "jobReward" });
  ok("reward with the lighter", jr);
  check("just the 5 blood, no syringe", total(jr.state.inventory, "syringe") === 0 && jr.state.blood === 7 - 2 + 5);
}

console.log("--- shops can't be fooled");
{
  const u = await fresh("t_shop", { blood: 3 });
  await act(u, "sync");
  bad("6ixty doesn't sell the growing kit any more", await act(u, "buySixty", { item: "f_planter" }));
  bad("can't buy the planter without enough blood", await act(u, "buyVending", { id: "planter" }));
  bad("can't buy something 6ixty doesn't sell", await act(u, "buySixty", { item: "knife" }));
  bad("can't buy a dead cat", await act(u, "buySixty", { item: "deadcat" }));
  bad("the cigarette pack is gone from the machine", await act(u, "buyVending", { id: "cigpack" }));
  const r = await act(u, "buySixty", { item: "pill" });
  ok("buy a pill for 3", r);
  check("blood went to 0", r.state.blood === 0);
  bad("furniture that isn't in the shop today", await act(u, "buyFurni", { kind: "f_sofa" }) );
}

console.log("--- the mixer");
{
  const a = await fresh("t_mix", { blood: 10, inventory: { 0: { item: "weed", qty: 4 }, 1: { item: "weed", qty: 2, ass: true }, 2: { item: "cigarette", qty: 3 }, 3: { item: "pill", qty: 3 }, 4: { item: "jointpaper", qty: 4 }, 5: { item: "lighter", qty: 1 }, 6: { item: "bluntwrap", qty: 2 } } });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_mix", name: "t_mix's room", access: "knock", w: 8, h: 8 });
  await stand(a, room, 3, 3);
  const buy = await act(a, "buyVending", { id: "mixer" });
  ok("buy the mixer from the vending machine", buy);
  check("it costs 10", buy.state.blood === 0);
  const slotOf = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
  let st = await state(a);
  const place = await act(a, "furniPlace", { source: "inv", slot: slotOf(st, "f_mixer"), x: 5, y: 5, dir: 0 });
  ok("place the mixer in the room", place);
  const fid = Object.keys((await owner("GET", `roomsMeta/${room}/furni`)) ?? {})[0];
  const mixIt = async (x, y) => {
    st = await state(a);
    const started = await act(a, "mix", { fid, a: slotOf(st, x[0], x[1]), b: slotOf(st, y[0], y[1]) });
    if (!started.ok) return started;
    const job = await owner("GET", `roomsMeta/${room}/furni/${fid}/mixJob`);
    if (!job || job.doneAt - Date.now() < 590_000 || job.doneAt - Date.now() > 60 * 60_000 + 1000) return { ok: false, status: 0, error: "no 10 minute job: " + JSON.stringify(job) };
    const early = await act(a, "mixCollect", { fid });
    if (early.ok) return { ok: false, status: 0, error: "collected early" };
    const busy = await act(a, "mix", { fid, a: 0, b: 1 });
    if (busy.ok) return { ok: false, status: 0, error: "started a second batch while busy" };
    await owner("PATCH", `roomsMeta/${room}/furni/${fid}/mixJob`, { doneAt: Date.now() - 1000 });
    return act(a, "mixCollect", { fid });
  };
  bad("rolling weed with a cigarette in the pocket no longer works", await (async () => { st = await state(a); return act(a, "combine", { a: slotOf(st, "weed"), b: slotOf(st, "cigarette") }); })());
  const r1 = await mixIt(["weed"], ["cigarette"]); ok("weed + cigarette", r1);
  check("2 weed mix", total(r1.state.inventory, "mix") === 2 && total(r1.state.inventory, "cigarette") === 2);
  const r2 = await mixIt(["weed"], ["weed", true]); ok("weed + ass weed", r2);
  check("2 mid weed", total(r2.state.inventory, "midweed") === 2);
  const r3 = await mixIt(["pill"], ["weed"]); ok("pill + weed", r3);
  check("1 thc-a", total(r3.state.inventory, "thca") === 1 && total(r3.state.inventory, "pill") === 2);
  const r4 = await mixIt(["pill"], ["cigarette"]); ok("pill + cigarette", r4);
  check("1 research chemical", total(r4.state.inventory, "researchchem") === 1);
  bad("pill + pill doesn't mix", await mixIt(["pill"], ["pill"]));
  {
    st = await state(a);
    ok("start a batch to test storing", await act(a, "mix", { fid, a: slotOf(st, "weed"), b: slotOf(st, "cigarette") }));
    bad("a mixer with a batch inside can't be stored", await act(a, "furniStore", { id: fid }));
    await owner("PATCH", `roomsMeta/${room}/furni/${fid}/mixJob`, { doneAt: Date.now() - 1000 });
    ok("collect it", await act(a, "mixCollect", { fid }));
  }
  bad("ass weed + pill doesn't mix", await mixIt(["weed", true], ["pill"]));
  bad("ass weed + cigarette doesn't mix", await mixIt(["weed", true], ["cigarette"]));
  bad("the same slot twice", await act(a, "mix", { fid, a: 0, b: 0 }));
  bad("a mixer that isn't there", await act(a, "mix", { fid: "nope", a: 0, b: 1 }));
  const far = await fresh("t_mix2", { inventory: { 0: { item: "weed", qty: 1 }, 1: { item: "cigarette", qty: 1 } } });
  await act(far, "sync"); await stand(far, `u_${far.uid}`, 2, 2);
  await owner("PUT", `roomsMeta/u_${far.uid}`, { owner: far.uid, ownerName: "t_mix2", name: "t_mix2 room", access: "knock", w: 8, h: 8 });
  bad("mixing needs a mixer in your own room", await act(far, "mix", { fid, a: 0, b: 1 }));
  // rolling and smoking the new things (a short rest so the server's anti-spam limit doesn't trip on this test's burst)
  await new Promise((r) => setTimeout(r, 3500));
  st = await state(a);
  const tj = await act(a, "combine", { a: slotOf(st, "thca"), b: slotOf(st, "jointpaper") });
  ok("roll thc-a into a joint", tj);
  check("it is a thc-a joint", total(tj.state.inventory, "joint_thca") === 1);
  const cb = await act(a, "combine", { a: slotOf(tj.state, "researchchem"), b: slotOf(tj.state, "bluntwrap") });
  ok("roll research chemical into a blunt", cb);
  check("it is a research blunt", total(cb.state.inventory, "blunt_chem") === 1);
  const mj = await act(a, "combine", { a: slotOf(cb.state, "midweed"), b: slotOf(cb.state, "jointpaper") });
  ok("roll mid weed into a joint", mj);
  const lit = await act(a, "light", { slot: slotOf(mj.state, "joint_thca") });
  ok("light the thc-a joint", lit);
  const litSlot = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${a.uid}/inventory/${litSlot}`, { lit: Date.now() - 70_000 });
  const fin = await act(a, "finishSmoke", { slot: litSlot });
  ok("finish it", fin);
  check("double blood and double speed for 2 minutes, no flashing", fin.state.boostMult === 2 && fin.state.speedUntil - Date.now() > 100_000 && fin.state.speedUntil - Date.now() <= 121_000 && fin.state.chemUntil === 0, JSON.stringify([fin.state.boostMult, fin.state.speedUntil - Date.now(), fin.state.chemUntil]));
  await new Promise((r) => setTimeout(r, 2500));
  const lit2 = await act(a, "light", { slot: slotOf(fin.state, "blunt_chem") });
  ok("light the research blunt", lit2);
  const litSlot2 = lit2.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${a.uid}/inventory/${litSlot2}`, { lit: Date.now() - 1_000 });
  bad("a research blunt is not done after 1 second", await act(a, "finishSmoke", { slot: litSlot2 }));
  await owner("PATCH", `users/${a.uid}/inventory/${litSlot2}`, { lit: Date.now() - 7_000 });
  const fin2 = await act(a, "finishSmoke", { slot: litSlot2 });
  ok("finish the research blunt", fin2);
  check("5 seconds of smoke, then 90 seconds of speed, double blood and flashing", fin2.state.speedUntil - Date.now() > 80_000 && fin2.state.speedUntil - Date.now() <= 91_000 && fin2.state.chemUntil - Date.now() > 80_000 && fin2.state.chemUntil - Date.now() <= 91_000 && fin2.state.boostUntil - Date.now() > 80_000 && fin2.state.boostUntil - Date.now() <= 91_000, JSON.stringify([fin2.state.speedUntil - Date.now(), fin2.state.chemUntil - Date.now(), fin2.state.boostUntil - Date.now()]));
}

console.log("--- selling weed");
{
  const a = await fresh("t_sell", { inventory: { 0: { item: "weed", qty: 3 }, 1: { item: "weed", qty: 2, ass: true }, 2: { item: "knife", qty: 1 }, 3: { item: "weedseed", qty: 5 } } });
  await act(a, "sync");
  bad("he only buys weed", await act(a, "sellWeed", { slot: 2, qty: 1 }));
  const r1 = await act(a, "sellWeed", { slot: 0, qty: 2 });
  ok("sell 2 good weed", r1);
  check("paid 12", r1.state.blood === 12);
  const r2 = await act(a, "sellWeed", { slot: 1, qty: 99 });
  ok("sell all the ass weed", r2);
  check("paid 8 more (4 each, capped at what you have)", r2.state.blood === 20);
  const r3 = await act(a, "sellWeed", { slot: 2, qty: 5 });
  ok("sell the 5 weed seeds", r3);
  check("2 each: 10 more", r3.state.blood === 30);
  const b2 = await fresh("t_sell2", { inventory: { 0: { item: "mix", qty: 1 }, 1: { item: "midweed", qty: 1 }, 2: { item: "thca", qty: 1 }, 3: { item: "researchchem", qty: 1 } } });
  await act(b2, "sync");
  let tot = 0;
  for (let i = 0; i < 4; i++) { const r = await act(b2, "sellWeed", { slot: 0, qty: 1 }); ok(`sell mixer item #${i + 1}`, r); tot = r.state.blood; }
  check("mix 5 + mid weed 7 + thc-a 12 + research chemical 9 = 33", tot === 33, String(tot));
  // 6ixty buys nearly anything: furniture at 75%, what cost blood at half, what you grow / mix / find at its own price
  const b3 = await fresh("t_sell3", { inventory: { 0: { item: "f_sofa", qty: 1 }, 1: { item: "cigarette", qty: 4 }, 2: { item: "pill", qty: 3 }, 3: { item: "lighter", qty: 1 }, 4: { item: "kodimagnyl", qty: 2 }, 5: { item: "hash", qty: 1 }, 6: { item: "joint_hash", qty: 1 }, 7: { item: "dmt", qty: 1 }, 8: { item: "shroom", qty: 3 } } });
  await act(b3, "sync");
  const sold = async (label, slotItem, qty, expect) => {
    const st = await state(b3);
    const slot = st.inventory.findIndex((x) => x && x.item === slotItem);
    const r = await act(b3, "sellWeed", { slot, qty });
    check(label, r.ok === true && r.state.blood - st.blood === expect, JSON.stringify([r.ok, r.error, r.state && r.state.blood - st.blood]));
  };
  await sold("an old sofa (48) sells for 75%: 36", "f_sofa", 1, 36);
  await sold("4 cigarettes: 1 drop for 2, so 2", "cigarette", 4, 2);
  await sold("3 pills: 2 sell for 3, the third stays", "pill", 3, 3);
  await sold("a lighter: 1", "lighter", 1, 1);
  await sold("2 kodimagnyl: 2 each", "kodimagnyl", 2, 4);
  await sold("hash: 12", "hash", 1, 12);
  await sold("a hash joint: 13", "joint_hash", 1, 13);
  await sold("DMT: 24", "dmt", 1, 24);
  await sold("3 shrooms: 14 each", "shroom", 3, 42);
  const never = await fresh("t_sell4", { inventory: { 0: { item: "f_mixer", qty: 1 }, 1: { item: "f_planter", qty: 1 }, 2: { item: "jointpaper", qty: 1 }, 3: { item: "bluntwrap", qty: 1 }, 4: { item: "wateringcan", qty: 1 }, 5: { item: "wateringcan_full", qty: 1 }, 6: { item: "knife", qty: 1 }, 7: { item: "cd_yellow", qty: 1 } } });
  await act(never, "sync");
  for (const [i, nm] of ["the mixer", "the growing kit", "joint paper", "blunt paper", "a watering can", "a full watering can", "the knife", "a CD bought with real money"].entries()) bad(`he won't buy ${nm}`, await act(never, "sellWeed", { slot: i, qty: 1 }));
}

console.log("--- the floor: drop and pick up");
{
  const a = await fresh("t_da", { inventory: { 0: { item: "cigarette", qty: 10 }, 1: { item: "knife", qty: 1 } } });
  const b = await fresh("t_db");
  const c = await fresh("t_dc");
  for (const u of [a, b, c]) { await act(u, "sync"); await stand(u, "lobby", 5, 5); }
  await owner("DELETE", "rooms/lobby/drops");
  const d1 = await act(a, "drop", { room: "lobby", slot: 0, qty: 4, x: 5, y: 5 });
  ok("drop 4 cigarettes", d1);
  check("6 left in the pocket", total(d1.state.inventory, "cigarette") === 6);
  bad("the same tile is taken", await act(a, "drop", { room: "lobby", slot: 0, qty: 1, x: 5, y: 5 }));
  bad("more than you have", await act(a, "drop", { room: "lobby", slot: 0, qty: 7, x: 6, y: 5 }));
  bad("a tile outside the room", await act(a, "drop", { room: "lobby", slot: 0, qty: 1, x: 40, y: 5 }));
  bad("a room you aren't in", await act(a, "drop", { room: "shop", slot: 0, qty: 1, x: 1, y: 1 }));
  bad("too far away", await act(a, "drop", { room: "lobby", slot: 0, qty: 1, x: 11, y: 11 }));
  const node = await owner("GET", "rooms/lobby/drops/5_5");
  check("the pile has a life time (public room)", node && typeof node.exp === "number" && node.exp - Date.now() <= 300_000 + 2000 && node.exp > Date.now());
  // two players race for the pile: exactly one wins
  const [pb, pc] = await Promise.all([act(b, "pickup", { room: "lobby", key: "5_5" }), act(c, "pickup", { room: "lobby", key: "5_5" })]);
  check("exactly one pick-up wins", [pb, pc].filter((r) => r.ok).length === 1, JSON.stringify([pb, pc]).slice(0, 300));
  const wb = (await state(b)), wc = (await state(c));
  check("the pile exists exactly once (4 cigarettes in total)", total(wb.inventory, "cigarette") + total(wc.inventory, "cigarette") === 4);
}

console.log("--- the two-window dupe, attempted in parallel");
{
  const a = await fresh("t_dupe", { inventory: { 0: { item: "weed", qty: 10 } } });
  await act(a, "sync");
  await stand(a, "lobby", 5, 5);
  await owner("DELETE", "rooms/lobby/drops");
  const tries = await Promise.all(Array.from({ length: 8 }, (_, i) => act(a, "drop", { room: "lobby", slot: 0, qty: 10, x: 3 + (i % 4), y: 4 + Math.floor(i / 4) })));
  const wins = tries.filter((r) => r.ok).length;
  check("only one of eight parallel drops of the same stack works", wins === 1, `wins=${wins}`);
  const left = (await state(a)).inventory;
  const piles = Object.values((await owner("GET", "rooms/lobby/drops")) ?? {}).reduce((n, d) => n + (d.item === "weed" ? d.qty : 0), 0);
  check("10 weed in total (none created)", total(left, "weed") + piles === 10, `pocket=${total(left, "weed")} floor=${piles}`);
  // drop and store at the same time
  const b = await fresh("t_dupe2", { inventory: { 0: { item: "weed", qty: 6 } } });
  await act(b, "sync");
  await stand(b, "lobby", 5, 5); await stand(b, `u_${b.uid}`, 3, 3);
  await owner("PUT", `roomsMeta/u_${b.uid}`, { owner: b.uid, ownerName: "x", name: "x room", access: "knock", w: 8, h: 8 });
  const [d, s] = await Promise.all([act(b, "drop", { room: "lobby", slot: 0, qty: 6, x: 6, y: 6 }), act(b, "store", { slot: 0, qty: 6 })]);
  const after = await state(b);
  const floor = Object.values((await owner("GET", "rooms/lobby/drops")) ?? {}).reduce((n, x) => n + (x.item === "weed" && x.by === b.uid ? x.qty : 0), 0);
  check("drop + store at once: 6 in total", total(after.inventory, "weed") + (after.storage.weed ?? 0) + floor === 6, `drop=${d.ok} store=${s.ok} pocket=${total(after.inventory, "weed")} storage=${after.storage.weed ?? 0} floor=${floor}`);
}

console.log("--- bulk drops go short (5+ in a public room)");
{
  const a = await fresh("t_bulk", { inventory: { 0: { item: "cigarette", qty: 50 } } });
  await act(a, "sync"); await stand(a, "lobby", 5, 5);
  await owner("DELETE", "rooms/lobby/drops");
  for (let i = 0; i < 5; i++) ok(`drop #${i + 1}`, await act(a, "drop", { room: "lobby", slot: 0, qty: 1, x: 2 + i, y: 5 }));
  const piles = Object.values((await owner("GET", "rooms/lobby/drops")) ?? {}).filter((d) => d.by === a.uid);
  check("all five now last at most a minute", piles.length === 5 && piles.every((d) => d.exp - Date.now() <= 62_000), JSON.stringify(piles.map((d) => d.exp - Date.now())));
}

console.log("--- player rooms keep drops, the toolbox and furniture");
{
  const a = await fresh("t_room", { inventory: { 0: { item: "cigarette", qty: 15 }, 1: { item: "weed", qty: 2, ass: true }, 2: { item: "f_telephone", qty: 1 }, 3: { item: "lighter", qty: 1 } } });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_room", name: "t_room's room", access: "knock", w: 8, h: 8 });
  bad("the toolbox needs you in your room", await act(a, "store", { slot: 0, qty: 15 }));
  await stand(a, room, 4, 4);
  const d = await act(a, "drop", { room, slot: 0, qty: 5, x: 4, y: 5 });
  ok("drop in your own room", d);
  const node = await owner("GET", `rooms/${room}/drops/4_5`);
  check("no life time in a player room", node && node.exp === undefined);
  ok("store the rest of the cigarettes", await act(a, "store", { slot: 0, qty: 10 }));
  ok("store the ass weed", await act(a, "store", { slot: 0, qty: 2 }));
  let s = await state(a);
  check("storage keeps ass weed apart", s.storage.cigarette === 10 && s.storage.ass_weed === 2, JSON.stringify(s.storage));
  const t = await act(a, "take", { key: "ass_weed", qty: 2 });
  ok("take the ass weed back", t);
  check("it is still ass", t.state.inventory.some((x) => x && x.item === "weed" && x.ass === true && x.qty === 2));
  bad("can't take what isn't there", await act(a, "take", { key: "knife", qty: 1 }));
  bad("can't place a knife as furniture", await act(a, "furniPlace", { source: "storage", kind: "knife", x: 1, y: 1, dir: 0 }));
  const p = await act(a, "furniPlace", { source: "storage", kind: "f_sofa", x: 1, y: 1, dir: 4 });
  ok("place the starter sofa", p);
  const rows = (await owner("GET", `roomsMeta/${room}/furni`)) ?? {};
  const rowId = Object.keys(rows)[0];
  check("one row in the room", Object.keys(rows).length === 1 && rows[rowId].kind === "f_sofa");
  bad("can't place the sofa twice from storage", await act(a, "furniPlace", { source: "storage", kind: "f_sofa", x: 3, y: 3, dir: 0 }));
  bad("a piece that doesn't fit", await act(a, "furniMove", { id: rowId, x: 7, y: 7, dir: 0 }));
  ok("move it", await act(a, "furniMove", { id: rowId, x: 3, y: 3, dir: 2 }));
  ok("place the telephone from the pocket", await act(a, "furniPlace", { source: "inv", slot: (await state(a)).inventory.findIndex((x) => x && x.item === "f_telephone"), x: 6, y: 1, dir: 0 }));
  const st = await act(a, "furniStore", { id: rowId });
  ok("store the sofa again", st);
  check("the sofa is back in storage", st.state.storage.f_sofa === 1);
  bad("can't store a row that is gone", await act(a, "furniStore", { id: rowId }));
  const strangerRoom = await fresh("t_other");
  await act(strangerRoom, "sync");
  await stand(strangerRoom, room, 3, 4);
  bad("you can't rearrange someone else's room", await act(strangerRoom, "furniMove", { id: Object.keys((await owner("GET", `roomsMeta/${room}/furni`)))[0], x: 2, y: 2, dir: 0 }));
  ok("a visitor may take what lies on the floor", await act(strangerRoom, "pickup", { room, key: "4_5" }));
}

console.log("--- stabbing");
{
  const a = await fresh("t_st1", { inventory: { 0: { item: "knife", qty: 1 } } });
  const b = await fresh("t_st2");
  await act(a, "sync"); await act(b, "sync");
  bad("not in the same room", await act(a, "stab", { target: b.uid, room: "lobby" }));
  await stand(a, "lobby", 2, 2);
  bad("they aren't there", await act(a, "stab", { target: b.uid, room: "lobby" }));
  await stand(b, "lobby", 10, 10);
  bad("too far away", await act(a, "stab", { target: b.uid, room: "lobby" }));
  await stand(b, "lobby", 3, 2);
  const r = await act(a, "stab", { target: b.uid, room: "lobby" });
  ok("stab", r);
  check("+1 blood", r.state.blood === 1);
  bad("once per day", await act(a, "stab", { target: b.uid, room: "lobby" }));
  bad("not yourself", await act(a, "stab", { target: a.uid, room: "lobby" }));
  const [x, y] = await Promise.all([act(a, "stab", { target: b.uid, room: "lobby" }), act(a, "stab", { target: b.uid, room: "lobby" })]);
  check("parallel stabs on the same person never pay twice", !x.ok && !y.ok);
  const noKnife = await fresh("t_st3");
  await act(noKnife, "sync"); await stand(noKnife, "lobby", 4, 2);
  bad("a stab needs a knife", await act(noKnife, "stab", { target: b.uid, room: "lobby" }));
}

console.log("--- smoking, bins, syringe, flappy");
{
  const a = await fresh("t_misc", { inventory: { 0: { item: "cigarette", qty: 2 }, 1: { item: "lighter", qty: 1 }, 2: { item: "syringe", qty: 1 }, 4: { item: "knife", qty: 1 } } });
  await act(a, "sync"); await stand(a, "lobby", 4, 4);
  const l = await act(a, "light", { slot: 0 });
  ok("light a cigarette", l);
  bad("you're already smoking one", await act(a, "light", { slot: 0 }));
  const litSlot = l.state.inventory.findIndex((x) => x && x.lit);
  bad("it hasn't burned out yet", await act(a, "finishSmoke", { slot: litSlot }));
  await owner("PATCH", `users/${a.uid}/inventory/${litSlot}`, { lit: Date.now() - 70_000 });
  const f = await act(a, "finishSmoke", { slot: litSlot });
  ok("finish once it has burned", f);
  check("stab bonus x2", f.state.boostMult === 2 && f.state.boostUntil > Date.now());
  const sy = await act(a, "syringe", { who: "self" });
  ok("syringe on yourself", sy);
  bad("syringe again right away", await act(a, "syringe", { who: "self" }));
  bad("syringe on a bag that isn't there", await act(a, "syringe", { who: "bag", room: "lobby" }));
  await owner("PUT", "lobby/furni/test_bag", { kind: "x_nft_sc_bodybag", x: 5, y: 5 });
  ok("syringe on a body bag", await act(a, "syringe", { who: "bag", room: "lobby" }));
  await owner("DELETE", "lobby/furni/test_bag");
  const bin = await act(a, "dumpster", { can: "lobby2", room: "lobby" });
  ok("search a bin", bin);
  bad("the same bin again", await act(a, "dumpster", { can: "lobby2", room: "lobby" }));
  bad("a bin that doesn't exist", await act(a, "dumpster", { can: "nope", room: "lobby" }));
  const fl = await act(a, "flappy", { room: "lobby" });
  ok("a flappy drop", fl);
  bad("flappy again straight away", await act(a, "flappy", { room: "lobby" }));
}

console.log("--- combining, growing");
{
  const a = await fresh("t_grow", { inventory: { 0: { item: "weed", qty: 1 }, 1: { item: "jointpaper", qty: 1 }, 2: { item: "weedseed", qty: 2 }, 3: { item: "wateringcan", qty: 1 } } });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_grow", name: "t_grow's room", access: "knock", w: 8, h: 8, furni: { kit1: { kind: "f_planter", x: 2, y: 2 } } });
  await stand(a, room, 3, 3);
  const c = await act(a, "combine", { a: 0, b: 1 });
  ok("roll a joint", c);
  bad("two things that don't go together", await act(a, "combine", { a: 0, b: 1 }));
  bad("plant needs a seed in that slot", await act(a, "plant", { fid: "kit1", slot: 0 }));
  const seedSlot = (await state(a)).inventory.findIndex((x) => x && x.item === "weedseed");
  ok("plant the seed", await act(a, "plant", { fid: "kit1", slot: seedSlot }));
  bad("plant twice", await act(a, "plant", { fid: "kit1", slot: seedSlot }));
  bad("harvest too early", await act(a, "harvest", { fid: "kit1" }));
  const canSlot = (await state(a)).inventory.findIndex((x) => x && x.item === "wateringcan");
  ok("fill the can", await act(a, "fillCan", { slot: canSlot }));
  ok("it can be watered at once, before the bar is empty", await act(a, "water", { fid: "kit1", slot: canSlot }));
  bad("harvest before 10 minutes", await act(a, "harvest", { fid: "kit1" }));
  const empty = (await state(a)).inventory.findIndex((x) => x && x.item === "wateringcan");
  ok("fill the can again", await act(a, "fillCan", { slot: empty }));
  bad("one watering is enough", await act(a, "water", { fid: "kit1", slot: empty }));
  await owner("PATCH", `roomsMeta/${room}/furni/kit1`, { plantedAt: Date.now() - 21 * 60_000, wateredAt: Date.now() - 12 * 60_000 });
  const h = await act(a, "harvest", { fid: "kit1" });
  ok("harvest after 10 minutes", h);
  check("1 or 2 good weed (2 only 15% of the time)", h.state.inventory.some((x) => x && x.item === "weed" && (x.qty === 1 || x.qty === 2) && !x.ass));
  // a second plant that never gets its water
  const seed2 = (await state(a)); const sl = seed2.inventory.findIndex((x) => x && x.item === "weedseed");
  if (sl >= 0) { ok("plant another seed", await act(a, "plant", { fid: "kit1", slot: sl })); }
  await owner("PATCH", `roomsMeta/${room}/furni/kit1`, { plantedAt: Date.now() - 21 * 60_000 });
  const h2 = await act(a, "harvest", { fid: "kit1" });
  if (sl >= 0) { ok("harvest without ever watering", h2); check("it is ass weed", h2.state.inventory.some((x) => x && x.item === "weed" && x.ass === true && (x.qty === 1 || x.qty === 2))); }  bad("a kit that isn't yours", await act(await fresh("t_grow2"), "harvest", { fid: "kit1" }));
}

console.log("--- trading");
{
  const a = await fresh("t_tr1", { blood: 10, inventory: { 0: { item: "weed", qty: 5 }, 1: { item: "knife", qty: 1 } } });
  const b = await fresh("t_tr2", { blood: 3, inventory: { 0: { item: "lighter", qty: 1 } } });
  await act(a, "sync"); await act(b, "sync");
  const id = `tt${Date.now().toString(36)}`;
  const base = { a: a.uid, b: b.uid, names: { [a.uid]: "t_tr1", [b.uid]: "t_tr2" }, status: "open", ts: Date.now() };
  await owner("PUT", `trades/${id}`, { ...base, offer: { [a.uid]: { blood: 4, items: { 0: { item: "weed", qty: 3 } } }, [b.uid]: { blood: 0, items: { 0: { item: "lighter", qty: 1 } } } } });
  bad("not accepted yet", await act(a, "tradeFinish", { id }));
  await owner("PATCH", `trades/${id}`, { ready: { [a.uid]: true, [b.uid]: true }, confirm: { [a.uid]: true } });
  bad("not confirmed by both", await act(b, "tradeFinish", { id }));
  await owner("PATCH", `trades/${id}/confirm`, { [b.uid]: true });
  bad("a stranger can't finish it", await act(await fresh("t_tr3"), "tradeFinish", { id }));
  const [r1, r2] = await Promise.all([act(a, "tradeFinish", { id }), act(b, "tradeFinish", { id })]);
  check("both finish calls are fine (the second one is a no-op)", r1.ok && r2.ok, JSON.stringify([r1, r2]).slice(0, 200));
  const sa = await state(a), sb = await state(b);
  check("a has 2 weed, a lighter, 6 blood", total(sa.inventory, "weed") === 2 && total(sa.inventory, "lighter") === 1 && sa.blood === 6, JSON.stringify(sa).slice(0, 300));
  check("b has 3 weed, no lighter, 7 blood", total(sb.inventory, "weed") === 3 && total(sb.inventory, "lighter") === 0 && sb.blood === 7, JSON.stringify(sb).slice(0, 300));
  check("the trade is marked done", (await owner("GET", `trades/${id}/status`)) === "done");
  // an offer for something that isn't there
  const id2 = `tu${Date.now().toString(36)}`;
  await owner("PUT", `trades/${id2}`, { ...base, offer: { [a.uid]: { blood: 0, items: { 0: { item: "weed", qty: 50 } } }, [b.uid]: { blood: 0 } }, ready: { [a.uid]: true, [b.uid]: true }, confirm: { [a.uid]: true, [b.uid]: true } });
  bad("offering more than you have is refused", await act(a, "tradeFinish", { id: id2 }));
  const id3 = `tv${Date.now().toString(36)}`;
  await owner("PUT", `trades/${id3}`, { ...base, offer: { [a.uid]: { blood: 999, items: {} }, [b.uid]: { blood: 0 } }, ready: { [a.uid]: true, [b.uid]: true }, confirm: { [a.uid]: true, [b.uid]: true } });
  bad("offering blood you don't have is refused", await act(a, "tradeFinish", { id: id3 }));
}

console.log("--- looks and clothes");
{
  const a = await fresh("t_look", { blood: 10 });
  await act(a, "sync");
  await owner("PUT", "config/priceBook/clothing", { hr_9999: { p: 4, on: 1 }, ch_8888: { p: 3, on: 0 } });
  await new Promise((r) => setTimeout(r, 100));
  const look = "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62";
  ok("a free look is fine", await act(a, "setLook", { figure: look, gender: "M" }));
  bad("a bad look string", await act(a, "setLook", { figure: "<script>", gender: "M" }));
  bad("a look with an unowned premium item", await act(a, "setLook", { figure: "hr-9999-1.hd-190-1", gender: "M" }));
  bad("an item that isn't for sale", await act(a, "buyClothes", { keys: ["ch_8888"] }));
  bad("an item that isn't in the price book", await act(a, "buyClothes", { keys: ["ch_1"] }));
  const buy = await act(a, "buyClothes", { keys: ["hr_9999"] });
  ok("buy a premium hairstyle", buy);
  check("the server charged 4 (not what the browser says)", buy.state.blood === 6 && buy.state.owned.hr_9999 === true);
  ok("now it can be worn", await act(a, "setLook", { figure: "hr-9999-1.hd-190-1", gender: "M" }));
}

console.log("--- the landlord's room upgrades");
{
  const a = await fresh("t_land", { blood: 200 });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_land", name: "t_land's room", access: "knock", w: 8, h: 8 });
  bad("you have to be in the shop", await act(a, "buyRoomUpgrade", {}));
  await stand(a, "shop", 5, 5);
  const u1 = await act(a, "buyRoomUpgrade", {});
  ok("buy the first upgrade", u1);
  check("25 drops, level 1", u1.state.blood === 175 && u1.state.roomLevel === 1, JSON.stringify([u1.state.blood, u1.state.roomLevel]));
  const m1 = await owner("GET", `roomsMeta/${room}`);
  check("the room is 10x10", m1.w === 10 && m1.h === 10, JSON.stringify([m1.w, m1.h]));
  await stand(a, room, 3, 3);
  ok("furniture fits in the bigger room", await act(a, "furniPlace", { source: "storage", kind: "f_sofa", x: 8, y: 8, dir: 0 }));
  const u2 = await act(a, "buyRoomUpgrade", {});
  ok("buy the second", u2);
  check("50 drops, 12x12", u2.state.blood === 125 && (await owner("GET", `roomsMeta/${room}/w`)) === 12);
  await stand(a, "shop", 5, 5);
  const u3 = await act(a, "buyRoomUpgrade", {});
  ok("buy the third", u3);
  check("80 drops, 14x14", u3.state.blood === 45 && (await owner("GET", `roomsMeta/${room}/h`)) === 14);
  bad("there is no fourth upgrade", await act(a, "buyRoomUpgrade", {}));
  const poor = await fresh("t_land2", { blood: 30 });
  await act(poor, "sync");
  await owner("PUT", `roomsMeta/u_${poor.uid}`, { owner: poor.uid, ownerName: "x", name: "x room", access: "knock", w: 8, h: 8 });
  await stand(poor, "shop", 5, 5);
  ok("25 drops is enough for the first", await act(poor, "buyRoomUpgrade", {}));
  bad("5 drops is not enough for the second", await act(poor, "buyRoomUpgrade", {}));
}

console.log("--- the landlord's colours");
{
  const a = await fresh("t_paint", { blood: 20 });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_paint", name: "t_paint's room", access: "knock", w: 8, h: 8, theme: { floorA: "#8d7a5f", floorB: "#95826a", wall: "#a8aeb0", rug: false, rugColor: "#c9544f", floorTex: "tiles2" } });
  bad("you have to be in the shop", await act(a, "roomColors", { floor: "#a2713f" }));
  await stand(a, "shop", 5, 5);
  bad("a bad colour", await act(a, "roomColors", { floor: "red" }));
  bad("nothing picked", await act(a, "roomColors", {}));
  bad("the same walls again is nothing to pay for", await act(a, "roomColors", { wall: "#a8aeb0" }));
  const p1 = await act(a, "roomColors", { floor: "#a2713f" });
  ok("a new floor", p1);
  check("2 drops", p1.state.blood === 18, String(p1.state.blood));
  const th = await owner("GET", `roomsMeta/${room}/theme`);
  check("floor colour set, pattern gone", th.floorA === "#a2713f" && th.floorB && th.floorTex === undefined, JSON.stringify(th));
  const p2 = await act(a, "roomColors", { floor: "#a2713f", wall: "#d9a38a", rug: "#4f7bc9" });
  ok("walls and carpet (the floor is the same, so it is free)", p2);
  check("4 more drops", p2.state.blood === 14, String(p2.state.blood));
  const th2 = await owner("GET", `roomsMeta/${room}/theme`);
  check("walls and carpet are set", th2.wall === "#d9a38a" && th2.rug === true && th2.rugColor === "#4f7bc9", JSON.stringify(th2));
  const p3 = await act(a, "roomColors", { rug: "none" });
  ok("take the carpet away", p3);
  check("2 more drops, carpet off", p3.state.blood === 12 && (await owner("GET", `roomsMeta/${room}/theme/rug`)) === false);
  const poor = await fresh("t_paint2", { blood: 3 });
  await act(poor, "sync");
  await owner("PUT", `roomsMeta/u_${poor.uid}`, { owner: poor.uid, ownerName: "x", name: "x room", access: "knock", w: 8, h: 8, theme: { floorA: "#8d7a5f", floorB: "#95826a", wall: "#a8aeb0", rug: false, rugColor: "#c9544f" } });
  await stand(poor, "shop", 5, 5);
  bad("3 drops can't pay for 3 parts (6)", await act(poor, "roomColors", { floor: "#a2713f", wall: "#d9a38a", rug: "#4f7bc9" }));
  check("and nothing was changed", (await owner("GET", `roomsMeta/u_${poor.uid}/theme/floorA`)) === "#8d7a5f");
}

console.log("--- the landlord's bed and wardrobe");
{
  const a = await fresh("t_skin", { blood: 100 });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_skin", name: "t_skin's room", access: "knock", w: 8, h: 8, bag: { x: 7, y: 7, dir: 2 } });
  bad("you have to be in the shop", await act(a, "roomSkins", { bed: "gold" }));
  await stand(a, "shop", 5, 5);
  bad("a look that isn't sold", await act(a, "roomSkins", { bed: "diamond" }));
  bad("nothing picked", await act(a, "roomSkins", {}));
  bad("the plain bed is what you have", await act(a, "roomSkins", { bed: "default" }));
  const s1 = await act(a, "roomSkins", { bed: "gold", bag: "plain" });
  ok("buy the gold bed and a wardrobe", s1);
  check("40 + 20 = 60 drops", s1.state.blood === 40, String(s1.state.blood));
  const m = await owner("GET", `roomsMeta/${room}`);
  check("the looks are stored", m.skins && m.skins.bed === "gold" && m.skins.bag === "plain", JSON.stringify(m.skins));
  // a floor wardrobe goes against a wall, in the nearest place where nothing stands (the toolbox is at 6,0, the door at 1,0, the bed along y 0)
  const bagCovers = (b) => (b.dir === 2 || b.dir === 6 ? [[b.x, b.y], [b.x, b.y + 1]] : [[b.x, b.y], [b.x + 1, b.y]]);
  check("the wardrobe stands against a wall", (m.bag.x === 0 || m.bag.y === 0) && (m.bag.dir === 2 || m.bag.dir === 4), JSON.stringify(m.bag));
  check("and not on the toolbox, the sink, the boombox or the bed", !bagCovers(m.bag).some(([x, y]) => (x === 6 && y === 0) || (x === 0 && (y === 7 || y === 3)) || (y === 0 && x >= 3 && x <= 5)), JSON.stringify(m.bag));
  check("it is the nearest such place (0,5 turned to the left wall)", m.bag.x === 0 && m.bag.y === 5 && m.bag.dir === 2, JSON.stringify(m.bag));
  const s2 = await act(a, "roomSkins", { bed: "default" });
  ok("back to the plain bed is free", s2);
  check("no charge", s2.state.blood === 40);
  const s3 = await act(a, "roomSkins", { bed: "gold" });
  ok("the gold bed again is free (already bought)", s3);
  check("still 40", s3.state.blood === 40);
  bad("the gothic bed is 60, too much now", await act(a, "roomSkins", { bed: "gothic" }));
  // wall items hang on the back wall
  const w1 = await act(a, "roomSkins", { bag: "coatrack" });
  ok("a coat rack", w1);
  const m3 = await owner("GET", `roomsMeta/${room}/bag`);
  check("it hangs on the back wall, facing the room, at the right end", m3.y === 0 && m3.dir === 4 && m3.x === 7, JSON.stringify(m3));
  bad("the tall wardrobe is gone from the game", await act(a, "roomSkins", { bag: "tall" }));
  const w2 = await act(a, "roomSkins", { bag: "plain" });
  ok("a wardrobe again, from the coat rack", w2);
  const m4 = await owner("GET", `roomsMeta/${room}/bag`);
  check("it goes to the nearest free wall place (the back wall has no room left of the toolbox, so the left wall corner at 0,0)", m4.x === 0 && m4.y === 0 && m4.dir === 2, JSON.stringify(m4));
}

console.log("--- kodimagnyl, the lean and the super pill");
{
  const slotOf = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
  const a = await fresh("t_kodi", { blood: 30, inventory: { 0: { item: "pill", qty: 1 }, 1: { item: "wateringcan_full", qty: 1 } } });
  await act(a, "sync");
  await stand(a, "shop", 5, 5);
  bad("the vending machine doesn't sell kodimagnyl any more", await act(a, "buyVending", { id: "kodimagnyl" }));
  const v = await act(a, "buySixty", { item: "kodimagnyl" });
  ok("buy kodimagnyl from 6ixty", v);
  check("4 drops", v.state.blood === 26, String(v.state.blood));
  check("it stacks", total(v.state.inventory, "kodimagnyl") === 1);
  const v2 = await act(a, "buySixty", { item: "kodimagnyl" });
  check("two now, in one slot", total(v2.state.inventory, "kodimagnyl") === 2 && v2.state.inventory.filter((x) => x && x.item === "kodimagnyl").length === 1);
  const cd = v2;
  bad("kodimagnyl and water no longer combine in the pocket (the lean is a mixer job)", await act(a, "combine", { a: slotOf(v2.state, "kodimagnyl"), b: slotOf(v2.state, "wateringcan_full") }));
  // the super pill is made in the mixer: pill + kodimagnyl
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_kodi", name: "t_kodi's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(a, room, 4, 4);
  const mx = await act(a, "mix", { fid: "mx", a: slotOf(cd.state, "pill"), b: slotOf(cd.state, "kodimagnyl") });
  ok("pill + kodimagnyl in the mixer", mx);
  await owner("PATCH", `roomsMeta/${room}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
  const col = await act(a, "mixCollect", { fid: "mx" });
  ok("collect", col);
  check("a super pill", total(col.state.inventory, "superpill") === 1);
  // the lean in the mixer too: kodimagnyl + a full watering can, and the can is back empty at once
  {
    const l = await fresh("t_lean", { inventory: { 0: { item: "kodimagnyl", qty: 1 }, 1: { item: "wateringcan_full", qty: 1 } } });
    await act(l, "sync");
    await owner("PUT", `roomsMeta/u_${l.uid}`, { owner: l.uid, ownerName: "t_lean", name: "t_lean's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
    await stand(l, `u_${l.uid}`, 4, 4);
    const lm = await act(l, "mix", { fid: "mx", a: 0, b: 1 });
    ok("kodimagnyl + full can in the mixer", lm);
    check("the can came back empty, the kodimagnyl is gone", total(lm.state.inventory, "wateringcan") === 1 && total(lm.state.inventory, "wateringcan_full") === 0 && total(lm.state.inventory, "kodimagnyl") === 0);
    const lj = await owner("GET", `roomsMeta/u_${l.uid}/furni/mx/mixJob`);
    check("the lean takes an hour (water and kodimagnyl grow nothing: double)", lj && lj.doneAt - Date.now() > 59 * 60_000 && lj.doneAt - Date.now() <= 60 * 60_000 + 2000, JSON.stringify(lj));
    await owner("PATCH", `roomsMeta/u_${l.uid}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
    const lc = await act(l, "mixCollect", { fid: "mx" });
    check("and the lean comes out", total(lc.state.inventory, "codeine") === 1);
  }
  // swallowing it: 4x for a minute
  const sp = await act(a, "consume", { slot: slotOf(col.state, "superpill") });
  ok("swallow the super pill", sp);
  check("4x speed for about a minute", sp.state.speedMult === 4 && sp.state.speedUntil - Date.now() > 50_000 && sp.state.speedUntil - Date.now() <= 61_000, JSON.stringify([sp.state.speedMult, sp.state.speedUntil - Date.now()]));
  // drinking the lean: an hour, the cup for 2 minutes, bins give two things and reload in 5 minutes
  const gc = await act(a, "debug", { cmd: "give", item: "codeine", qty: 1 });
  const dr = await act(a, "consume", { slot: slotOf(gc.state, "codeine") });
  ok("drink the codeine", dr);
  check("an hour of lean and 2 minutes of cup", dr.state.leanUntil - Date.now() > 3_500_000 && dr.state.cupUntil - Date.now() > 100_000 && dr.state.cupUntil - Date.now() <= 121_000, JSON.stringify([dr.state.leanUntil - Date.now(), dr.state.cupUntil - Date.now()]));
  bad("you can't drink a lighter", await act(a, "consume", { slot: 0 }));
  await stand(a, "lobby", 5, 5);
  const s1 = await act(a, "dumpster", { can: "lobby2", room: "lobby" });
  ok("search a bin with the lean", s1);
  check("two things came out", (s1.data.items ?? []).length === 2, JSON.stringify(s1.data));
  await owner("PATCH", `users/${a.uid}/dumpsters`, { lobby2: Date.now() - 6 * 60_000 });
  ok("the same bin again after 6 minutes (it reloads in 5 with the lean)", await act(a, "dumpster", { can: "lobby2", room: "lobby" }));
  await owner("PATCH", `users/${a.uid}/dumpsters`, { lobby2: Date.now() - 3 * 60_000 });
  bad("not after 3 minutes", await act(a, "dumpster", { can: "lobby2", room: "lobby" }));
  // without the lean: one thing, 10 minutes
  const plain = await fresh("t_kodi2");
  await act(plain, "sync");
  await stand(plain, "lobby", 5, 5);
  const p1 = await act(plain, "dumpster", { can: "lobby2", room: "lobby" });
  ok("search a bin without the lean", p1);
  check("one thing", (p1.data.items ?? []).length === 1);
  await owner("PATCH", `users/${plain.uid}/dumpsters`, { lobby2: Date.now() - 6 * 60_000 });
  bad("6 minutes is not enough without the lean", await act(plain, "dumpster", { can: "lobby2", room: "lobby" }));
  // 6ixty buys them
  const sell = await fresh("t_kodi3", { inventory: { 0: { item: "codeine", qty: 1 }, 1: { item: "superpill", qty: 1 }, 2: { item: "kodimagnyl", qty: 1 } } });
  await act(sell, "sync");
  const s8 = await act(sell, "sellWeed", { slot: 0, qty: 1 });
  ok("sell the lean", s8);
  check("8 drops", s8.state.blood === 8, String(s8.state.blood));
  const s12 = await act(sell, "sellWeed", { slot: slotOf(s8.state, "superpill"), qty: 1 });
  ok("sell the super pill", s12);
  check("14 more", s12.state.blood === 22, String(s12.state.blood));
  const sk = await act(sell, "sellWeed", { slot: slotOf(s12.state, "kodimagnyl"), qty: 1 });
  check("kodimagnyl: half of the 4 it costs", sk.ok === true && sk.state.blood === 24, String(sk.state && sk.state.blood));
}

console.log("--- the CD and the boombox");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const a = await fresh("t_cd", { blood: 5 });
  await act(a, "sync");
  const room = `u_${a.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: a.uid, ownerName: "t_cd", name: "t_cd room", access: "open", w: 8, h: 8 });
  await stand(a, "shop", 2, 6);
  const b1 = await act(a, "buyRecord");
  ok("buy the CD at the record player", b1);
  check("2 drops", b1.state.blood === 3 && total(b1.state.inventory, "cd") === 1, String(b1.state.blood));
  bad("it can't be bought twice", await act(a, "buyRecord"));
  bad("the player needs you in the room", await act(a, "cdInsert", { slot: slotOf(b1.state, "cd"), room, durationMs: 180000 }));
  await stand(a, room, 4, 4);
  const ins = await act(a, "cdInsert", { slot: slotOf(b1.state, "cd"), room, durationMs: 180000 });
  ok("put the CD in the boombox", ins);
  const st0 = await owner("GET", `rooms/${room}/cdplayer`);
  check("the song is playing", st0 && st0.by === a.uid && st0.title === "Freakme" && st0.endsAt - st0.startedAt === 180000, JSON.stringify(st0));
  check("the CD is loaned to this room", ins.state.inventory.some((x) => x && x.item === "cd" && x.inPlayer === room));
  // a visitor can't use the boombox while it plays, and can't control it
  const v = await fresh("t_cd2", { inventory: { 0: { item: "cd", qty: 1 } } });
  await act(v, "sync");
  bad("6ixty does not buy a CD", await act(v, "sellWeed", { slot: 0, qty: 1 }));
  await stand(v, room, 2, 2);
  bad("busy", await act(v, "cdInsert", { slot: 0, room, durationMs: 100000 }));
  bad("a visitor can't pause it", await act(v, "cdControl", { room, op: "pause" }));
  ok("the inserter pauses it", await act(a, "cdControl", { room, op: "pause" }));
  const st1 = await owner("GET", `rooms/${room}/cdplayer`);
  check("paused", typeof st1.pausedAt === "number");
  bad("still busy while paused", await act(v, "cdInsert", { slot: 0, room, durationMs: 100000 }));
  await owner("PATCH", `rooms/${room}/cdplayer`, { pausedAt: Date.now() - 5_000, startedAt: Date.now() - 65_000 });
  ok("play on", await act(a, "cdControl", { room, op: "play" }));
  const st2 = await owner("GET", `rooms/${room}/cdplayer`);
  const into = Date.now() - st2.startedAt;
  check("it carries on from where it stopped (about 60 s in)", st2.pausedAt === undefined && into > 55_000 && into < 66_000, JSON.stringify([st2.pausedAt, into]));
  ok("play from the start", await act(a, "cdControl", { room, op: "restart" }));
  const st3 = await owner("GET", `rooms/${room}/cdplayer`);
  check("back at the start", Date.now() - st3.startedAt < 5_000);
  const ej = await act(a, "cdControl", { room, op: "eject" });
  ok("eject", ej);
  check("the song is off and the CD is free", (await owner("GET", `rooms/${room}/cdplayer`)) === null && !ej.state.inventory.some((x) => x && x.item === "cd" && x.inPlayer));
  // the room's owner can eject somebody else's CD
  ok("a visitor puts theirs in", await act(v, "cdInsert", { slot: 0, room, durationMs: 100000 }));
  ok("the owner ejects it", await act(a, "cdControl", { room, op: "eject" }));
  const vs = await state(v);
  check("the visitor has the CD back", vs.inventory.some((x) => x && x.item === "cd" && !x.inPlayer));
  ok("nothing playing: nothing to control", { ok: (await act(a, "cdControl", { room, op: "pause" })).ok === false });
}

console.log("--- shrooms and DMT");
{
  // 6ixty no longer sells DMT
  const d = await fresh("t_dmt", { blood: 40 });
  await act(d, "sync");
  bad("6ixty doesn't sell DMT", await act(d, "buySixty", { item: "dmt" }));
  // spores grow into shrooms in a growing kit
  const room = `u_${d.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: d.uid, ownerName: "t_dmt", name: "t_dmt's room", access: "closed", w: 8, h: 8, furni: { kit: { kind: "f_planter", x: 2, y: 2 }, mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await owner("PUT", `users/${d.uid}/inventory`, { 0: { item: "shroomspore", qty: 2 }, 1: { item: "kodimagnyl", qty: 2 } });
  await stand(d, room, 4, 4);
  const pl = await act(d, "plant", { fid: "kit", slot: 0 });
  ok("plant shroom spores", pl);
  check("the kit remembers it is shrooms", (await owner("GET", `roomsMeta/${room}/furni/kit/crop`)) === "shroom");
  bad("not ready yet", await act(d, "harvest", { fid: "kit" }));
  await owner("PATCH", `roomsMeta/${room}/furni/kit`, { plantedAt: Date.now() - 25 * 60_000, wateredAt: Date.now() - 10 * 60_000 });
  const hv = await act(d, "harvest", { fid: "kit" });
  ok("pick the shrooms", hv);
  check("three shrooms, and the kit is empty again", [1, 2].includes(total(hv.state.inventory, "shroom")) && (await owner("GET", `roomsMeta/${room}/furni/kit/crop`)) === null, JSON.stringify(hv.data));
  // shroom + pill in the mixer = DMT
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const mx = await act(d, "mix", { fid: "mx", a: slotOf(hv.state, "shroom"), b: slotOf(hv.state, "kodimagnyl") });
  ok("shroom + kodimagnyl in the mixer", mx);
  await owner("PATCH", `roomsMeta/${room}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
  const col = await act(d, "mixCollect", { fid: "mx" });
  check("a DMT comes out", total(col.state.inventory, "dmt") === 1);
  // eating a shroom: every room is open for 3 minutes
  await owner("PUT", `users/${d.uid}/inventory/25`, { item: "shroom", qty: 1 }); // (a harvest gives only 1 now, and it went into the DMT)
  const eatState = await state(d);
  const eat = await act(d, "consume", { slot: slotOf(eatState, "shroom") });
  ok("eat a shroom", eat);
  check("3 minutes of open doors", eat.data.kind === "shroom" && eat.state.shroomUntil - Date.now() > 170_000 && eat.state.shroomUntil - Date.now() <= 181_000, JSON.stringify([eat.data, eat.state.shroomUntil - Date.now()]));
  // DMT: the colours, then 4 minutes of open doors and double speed
  const dm = await act(d, "consume", { slot: slotOf(eat.state, "dmt") });
  ok("swallow DMT", dm);
  check("DMT: 10 seconds of colours, then 4 minutes", dm.data.kind === "dmt" && dm.data.ms === 10000 && dm.data.tripMs === 240000, JSON.stringify(dm.data));
  check("2x speed and open doors until the 4 minutes are over", dm.state.speedMult === 2 && dm.state.speedUntil - Date.now() > 245_000 && dm.state.shroomUntil === dm.state.speedUntil && total(dm.state.inventory, "dmt") === 0, JSON.stringify([dm.state.speedMult, dm.state.speedUntil - Date.now()]));
  // the database rules let you into someone's closed room while it lasts, and not afterwards
  const owner2 = await fresh("t_dmt_owner");
  await act(owner2, "sync");
  await owner("PUT", `roomsMeta/u_${owner2.uid}`, { owner: owner2.uid, ownerName: "t_dmt_owner", name: "closed room", access: "none", w: 8, h: 8 });
  await owner("PUT", `rooms/u_${owner2.uid}/players/${owner2.uid}`, { name: "t_dmt_owner", figure: "x", x: 3, y: 3, dir: 2 });
  const peek = async (who) => (await fetch(`${DB}/rooms/u_${owner2.uid}/players.json?ns=${NS}&auth=${who.token}`)).status;
  const trip = await fresh("t_dmt_trip");
  // a friend gets in without any shroom (this broke once: the shroom check came before the friend check and failed on "no value")
  const friendRoom = await fresh("t_dmt_friend");
  await owner("PUT", `friends/${owner2.uid}/${friendRoom.uid}`, true);
  await owner("PUT", `roomsMeta/u_${owner2.uid}/access`, "knock");
  check("a friend can read a friend's room (no shroom at all)", (await peek(friendRoom)) === 200);
  await owner("PUT", `roomInvites/u_${owner2.uid}/${trip.uid}`, true);
  check("someone let in by the owner can read it", (await peek(trip)) === 200);
  await owner("DELETE", `roomInvites/u_${owner2.uid}/${trip.uid}`);
  await owner("PUT", `roomsMeta/u_${owner2.uid}/access`, "none");
  check("no shroom: a closed room stays closed", (await peek(trip)) === 401);
  await owner("PUT", `users/${trip.uid}/shroomUntil`, Date.now() + 60_000);
  check("on a shroom: the room can be read", (await peek(trip)) === 200);
  await owner("PUT", `users/${trip.uid}/shroomUntil`, Date.now() - 1000);
  check("when it wears off: closed again", (await peek(trip)) === 401);
}
console.log("--- peers: same device; sleepers give 1");
{
  const a = await fresh("t_peer_a"), b = await fresh("t_peer_b"), c3 = await fresh("t_peer_c");
  a.device = b.device = "device-aaaa-1111"; c3.device = "device-cccc-3333";
  await act(a, "sync"); await act(b, "sync"); await act(c3, "sync");
  const pa = (await owner("GET", `peers/${a.uid}`)) ?? {};
  check("a and b share a device: peers both ways", pa[b.uid] === true && (await owner("GET", `peers/${b.uid}/${a.uid}`)) === true, JSON.stringify(pa));
  check("c is on another device: nobody's peer", !(pa[c3.uid]) && !((await owner("GET", `peers/${c3.uid}`)) ?? {})[a.uid]);
  // accounts from one device can't stab each other, but anybody else can
  const roomB = `u_${b.uid}`;
  await owner("PUT", `roomsMeta/${roomB}`, { owner: b.uid, ownerName: "t_peer_b", name: "b's room", access: "open", w: 8, h: 8 });
  await owner("PUT", `users/${a.uid}/inventory`, { 0: { item: "knife", qty: 1 } });
  await stand(a, roomB, 3, 3);
  bad("a can't stab b (same device)", await act(a, "stab", { target: b.uid, room: roomB }));
  // a sleeping owner (offline, in their own room) gives exactly 1, whatever the boost
  const knife = { 0: { item: "knife", qty: 1 } };
  await owner("PUT", `users/${c3.uid}/inventory`, knife);
  await owner("PUT", `users/${c3.uid}/boostUntil`, Date.now() + 120_000);
  await owner("PUT", `users/${c3.uid}/boostMult`, 4);
  const room = `u_${b.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: b.uid, ownerName: "t_peer_b", name: "b's room", access: "open", w: 8, h: 8 });
  await stand(c3, room, 3, 3);
  const st = await act(c3, "stab", { target: b.uid, room });
  ok("stab the sleeping owner", st);
  check("a sleeper is worth exactly 1, boost or not", st.data.gain === 1, JSON.stringify(st.data));
}

console.log("--- CDs: the record player in the shop, paying, the album");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const checkout = async (who, product) => { const r = await fetch(`${API}/pay/checkout`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ product }) }); return { status: r.status, ...(await r.json()) }; };
  // the Freakme CD: 2 blood at the record player, once, no longer from 6ixty
  const f1 = await fresh("t_cd1", { blood: 9 });
  await act(f1, "sync");
  bad("not in the shop room", await act(f1, "buyRecord"));
  await stand(f1, "shop", 2, 6);
  const fr = await act(f1, "buyRecord");
  ok("buy the Freakme CD", fr);
  check("it costs 2 blood and is a CD", fr.state.blood === 7 && total(fr.state.inventory, "cd") === 1, String(fr.state.blood));
  bad("only one per player", await act(f1, "buyRecord"));
  bad("6ixty doesn't sell it any more", await act(f1, "buySixty", { item: "cd" }));
  // real money: three mystery CDs, never the same colour twice
  const m = await fresh("t_cd2");
  await act(m, "sync");
  check("no login: no checkout", (await fetch(`${API}/pay/checkout`, { method: "POST", body: "{}" })).status === 401);
  const colours = new Set();
  for (let i = 0; i < 3; i++) {
    const co = await checkout(m, "mystery");
    check(`mystery checkout ${i + 1} works`, co.ok === true && typeof co.url === "string", JSON.stringify(co));
    const cl = await act(m, "claimPurchases");
    ok(`claim ${i + 1}`, cl);
    check(`one new mystery CD (${i + 1})`, cl.data.items.length === 1 && /^cd_(yellow|green|blue)$/.test(cl.data.items[0]) && !colours.has(cl.data.items[0]), JSON.stringify(cl.data));
    colours.add(cl.data.items[0]);
    if (i === 2) check("all three colours", colours.size === 3 && cl.state.owned.item_cd_yellow && cl.state.owned.item_cd_green && cl.state.owned.item_cd_blue, JSON.stringify(cl.state.owned));
  }
  const fourth = await checkout(m, "mystery");
  check("a fourth mystery CD can't be bought", fourth.ok === false && fourth.status === 400, JSON.stringify(fourth));
  // the album: one, red
  const al = await checkout(m, "album");
  check("album checkout works", al.ok === true, JSON.stringify(al));
  const alc = await act(m, "claimPurchases");
  check("the album arrives", alc.data.items[0] === "cd_album" && total(alc.state.inventory, "cd_album") === 1, JSON.stringify(alc.data));
  const al2 = await checkout(m, "album");
  check("a second album can't be bought", al2.ok === false, JSON.stringify(al2));
  bad("the paid CDs can't be dropped", await act(m, "drop", { slot: slotOf(alc.state, "cd_album"), qty: 1 }));
  // the webhook: only a signed message from Stripe marks a payment as paid
  const w = await fresh("t_cd3");
  await act(w, "sync");
  const sid = `cs_test_${Date.now()}`;
  await owner("PUT", `purchases/${sid}`, { uid: w.uid, product: "album", amount: 200, status: "open", at: Date.now(), session: sid });
  await owner("PUT", `userPurchases/${w.uid}/${sid}`, { product: "album", status: "open", at: Date.now() });
  const event = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: sid, payment_status: "paid", amount_total: 200, currency: "dkk" } } });
  const sign = (body, secret, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
  const hook = (body, sig) => fetch(`${API}/pay/webhook`, { method: "POST", headers: sig ? { "stripe-signature": sig } : {}, body });
  check("no signature: refused", (await hook(event, null)).status === 400);
  check("a wrong secret: refused", (await hook(event, sign(event, "whsec_not_ours"))).status === 400);
  check("an old signature: refused", (await hook(event, sign(event, "whsec_local_test_secret", Math.floor(Date.now() / 1000) - 3600))).status === 400);
  check("still unpaid after all that", (await owner("GET", `purchases/${sid}/status`)) === "open" && (await act(w, "claimPurchases")).data.items.length === 0);
  check("a signed message: accepted", (await hook(event, sign(event, "whsec_local_test_secret"))).status === 200);
  check("the payment is marked paid", (await owner("GET", `purchases/${sid}/status`)) === "paid");
  const wc = await act(w, "claimPurchases");
  check("and now the album arrives", wc.data.items[0] === "cd_album", JSON.stringify(wc.data));
  check("the purchase is closed", (await owner("GET", `purchases/${sid}/status`)) === "claimed" && (await act(w, "claimPurchases")).data.items.length === 0);
  // a payment of the wrong amount is not believed
  const sid2 = `cs_test_wrong_${Date.now()}`;
  const w2 = await fresh("t_cd4");
  await act(w2, "sync");
  await owner("PUT", `purchases/${sid2}`, { uid: w2.uid, product: "album", amount: 200, status: "open", at: Date.now(), session: sid2 });
  await owner("PUT", `userPurchases/${w2.uid}/${sid2}`, { product: "album", status: "open", at: Date.now() });
  const bent = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: sid2, payment_status: "paid", amount_total: 1, currency: "dkk" } } });
  await hook(bent, sign(bent, "whsec_local_test_secret"));
  check("a payment of the wrong amount is held back", (await owner("GET", `purchases/${sid2}/status`)) === "stuck" && (await act(w2, "claimPurchases")).data.items.length === 0);
  // using the CDs: a mystery CD plays one song, the album plays on and can skip
  const room = `u_${m.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: m.uid, ownerName: "t_cd2", name: "t_cd2's room", access: "knock", w: 8, h: 8 });
  await stand(m, room, 4, 4);
  const ys = (await state(m)).inventory.findIndex((x) => x && /^cd_(yellow|green|blue)$/.test(x.item));
  ok("a mystery CD in the boombox", await act(m, "cdInsert", { slot: ys, room, durationMs: 100_000 }));
  const st1 = await owner("GET", `rooms/${room}/cdplayer`);
  check("it plays its own song", ["ahmingud", "blodig-oktober", "blod-ud-af-naesen"].includes(st1.track) && st1.index === undefined, JSON.stringify(st1));
  bad("it has no songs to skip", await act(m, "cdControl", { room, op: "next", from: 0, durationMs: 90_000 }));
  ok("eject", await act(m, "cdControl", { room, op: "eject" }));
  const albumSlot = (await state(m)).inventory.findIndex((x) => x && x.item === "cd_album");
  ok("the album in the boombox", await act(m, "cdInsert", { slot: albumSlot, room, durationMs: 120_000 }));
  const a0 = await owner("GET", `rooms/${room}/cdplayer`);
  check("it starts with the first song", a0.track === "album" && a0.index === 0 && a0.title === "02!11 på en blodig søndag", JSON.stringify(a0));
  ok("skip to the next song", await act(m, "cdControl", { room, op: "next", from: 0, durationMs: 137_000 }));
  const a1 = await owner("GET", `rooms/${room}/cdplayer`);
  check("the second song, with its own length", a1.index === 1 && a1.title === "200mg" && a1.durationMs === 137_000, JSON.stringify(a1));
  ok("pressing it twice in a row does nothing the second time", await act(m, "cdControl", { room, op: "next", from: 0, durationMs: 100_000 }));
  check("still the second song", (await owner("GET", `rooms/${room}/cdplayer/index`)) === 1);
  ok("back to the first song", await act(m, "cdControl", { room, op: "prev", from: 1, durationMs: 120_000 }));
  check("the first song again", (await owner("GET", `rooms/${room}/cdplayer/index`)) === 0);
  bad("advance only when the song is over", await act(m, "cdControl", { room, op: "advance", from: 0, durationMs: 100_000 }));
  await owner("PATCH", `rooms/${room}/cdplayer`, { startedAt: Date.now() - 119_000, endsAt: Date.now() + 500 });
  ok("the song is nearly over: the album moves on by itself", await act(m, "cdControl", { room, op: "advance", from: 0, durationMs: 137_000 }));
  check("the second song is on", (await owner("GET", `rooms/${room}/cdplayer/index`)) === 1);
  ok("eject the album", await act(m, "cdControl", { room, op: "eject" }));
  const back = await state(m);
  check("the CD is back in the pocket", total(back.inventory, "cd_album") === 1 && !back.inventory.some((x) => x && x.inPlayer));
}

console.log("--- hash, hash mix and the hash joint");
{
  const slotOf = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
  const h = await fresh("t_hash", { inventory: { 0: { item: "weed", qty: 2, ass: true }, 1: { item: "kodimagnyl", qty: 1 }, 2: { item: "cigarette", qty: 2 }, 3: { item: "jointpaper", qty: 2 }, 4: { item: "bluntwrap", qty: 1 }, 5: { item: "lighter", qty: 1 }, 6: { item: "weed", qty: 1 } } });
  await act(h, "sync");
  const room = `u_${h.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: h.uid, ownerName: "t_hash", name: "t_hash's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(h, room, 4, 4);
  const mixOnce = async (fid, aItem, aAss, bItem) => {
    const st = await state(h);
    const r = await act(h, "mix", { fid, a: slotOf(st, aItem, aAss), b: slotOf(st, bItem, false) });
    await owner("PATCH", `roomsMeta/${room}/furni/${fid}/mixJob`, { doneAt: Date.now() - 1000 });
    return r.ok ? await act(h, "mixCollect", { fid }) : r;
  };
  bad("good weed and kodimagnyl is not hash", await (async () => { const st = await state(h); return act(h, "mix", { fid: "mx", a: slotOf(st, "weed", false), b: slotOf(st, "kodimagnyl", false) }); })());
  const hs = await mixOnce("mx", "weed", true, "kodimagnyl");
  ok("ass weed + kodimagnyl in the mixer", hs);
  check("1 hash", total(hs.state.inventory, "hash") === 1 && total(hs.state.inventory, "kodimagnyl") === 0, JSON.stringify(hs.data));
  const hm = await mixOnce("mx", "hash", false, "cigarette");
  ok("hash + cigarette in the mixer", hm);
  check("2 hash mix", total(hm.state.inventory, "hashmix") === 2 && total(hm.state.inventory, "hash") === 0, JSON.stringify(hm.data));
  const st = await state(h);
  bad("hash mix can't go in a blunt", await act(h, "combine", { a: slotOf(st, "hashmix", false), b: slotOf(st, "bluntwrap", false) }));
  const hj = await act(h, "combine", { a: slotOf(st, "hashmix", false), b: slotOf(st, "jointpaper", false) });
  ok("hash mix + joint paper", hj);
  check("a hash joint", total(hj.state.inventory, "joint_hash") === 1 && total(hj.state.inventory, "hashmix") === 1, JSON.stringify(hj.data));
  const lit = await act(h, "light", { slot: slotOf(hj.state, "joint_hash", false) });
  ok("light the hash joint", lit);
  const litSlot = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${h.uid}/inventory/${litSlot}`, { lit: Date.now() - 70_000 });
  const fin = await act(h, "finishSmoke", { slot: litSlot });
  ok("smoke it to the end", fin);
  check("stabs give 3x for 2 minutes", fin.state.boostMult === 3 && fin.state.boostUntil - Date.now() > 110_000 && fin.state.boostUntil - Date.now() <= 121_000, JSON.stringify([fin.state.boostMult, fin.state.boostUntil - Date.now()]));
}

console.log("--- cigarette butts to 6ixty");
{
  const b = await fresh("t_butts", { inventory: { 0: { item: "cigbutt", qty: 5 }, 1: { item: "cigbutt", qty: 1 } } });
  await act(b, "sync");
  const st = await state(b);
  check("the butts share a slot", total(st.inventory, "cigbutt") === 6 && st.inventory.filter((x) => x && x.item === "cigbutt").length === 1, JSON.stringify(st.inventory.filter(Boolean)));
  const slot = st.inventory.findIndex((x) => x && x.item === "cigbutt");
  bad("one butt on its own isn't enough", await act(b, "sellWeed", { slot, qty: 1 }));
  const s1 = await act(b, "sellWeed", { slot, qty: 2 });
  ok("sell two butts", s1);
  check("1 drop for 2 butts", s1.state.blood === 1 && total(s1.state.inventory, "cigbutt") === 4, String(s1.state.blood));
  const s2 = await act(b, "sellWeed", { slot, qty: 99 });
  ok("sell all the rest", s2);
  check("4 butts: 2 more drops", s2.state.blood === 3 && total(s2.state.inventory, "cigbutt") === 0, String(s2.state.blood));
  const odd = await fresh("t_butts2", { inventory: { 0: { item: "cigbutt", qty: 3 } } });
  await act(odd, "sync");
  const so = await act(odd, "sellWeed", { slot: 0, qty: 3 });
  check("an odd one stays: 3 butts sell as 2", so.ok === true && so.state.blood === 1 && total(so.state.inventory, "cigbutt") === 1, JSON.stringify(so.state));
}

console.log("--- shrooms take 25 minutes");
{
  const g = await fresh("t_grow25");
  await act(g, "sync");
  const room = `u_${g.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: g.uid, ownerName: "t_grow25", name: "x", access: "knock", w: 8, h: 8, furni: { ks: { kind: "f_planter", x: 2, y: 2, crop: "shroom" }, kw: { kind: "f_planter", x: 4, y: 2 } } });
  await stand(g, room, 4, 4);
  await owner("PATCH", `roomsMeta/${room}/furni/ks`, { plantedAt: Date.now() - 22 * 60_000, wateredAt: Date.now() - 20 * 60_000 });
  await owner("PATCH", `roomsMeta/${room}/furni/kw`, { plantedAt: Date.now() - 22 * 60_000, wateredAt: Date.now() - 20 * 60_000 });
  bad("shrooms aren't ready after 22 minutes", await act(g, "harvest", { fid: "ks" }));
  ok("but weed is", await act(g, "harvest", { fid: "kw" }));
  await owner("PATCH", `roomsMeta/${room}/furni/ks`, { plantedAt: Date.now() - 26 * 60_000 });
  ok("shrooms are ready after 25", await act(g, "harvest", { fid: "ks" }));
}

console.log("--- harvesting: a 25% chance of a seed (or spores) back");
{
  const g = await fresh("t_seedback");
  await act(g, "sync");
  const room = `u_${g.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: g.uid, ownerName: "t_seedback", name: "t_seedback's room", access: "knock", w: 8, h: 8, furni: { kw: { kind: "f_planter", x: 2, y: 2 }, ks: { kind: "f_planter", x: 4, y: 2 } } });
  await stand(g, room, 4, 4);
  const total2 = async (item) => total((await state(g)).inventory, item);
  const grown = { plantedAt: Date.now() - 25 * 60_000, wateredAt: Date.now() - 10 * 60_000 };
  let weedBack = 0, sporeBack = 0;
  const N = 40;
  for (let i = 0; i < N; i++) {
    await owner("PATCH", `roomsMeta/${room}/furni/kw`, grown);
    const r = await act(g, "harvest", { fid: "kw" });
    if (r.data.seed === "weedseed") weedBack++;
    await owner("PATCH", `roomsMeta/${room}/furni/ks`, { ...grown, crop: "shroom" });
    const r2 = await act(g, "harvest", { fid: "ks" });
    if (r2.data.seed === "shroomspore") sporeBack++;
  }
  check(`weed: about a quarter gave a seed back (${weedBack} of ${N})`, weedBack >= 2 && weedBack <= 22, String(weedBack));
  check(`shrooms: about a quarter gave spores back (${sporeBack} of ${N})`, sporeBack >= 2 && sporeBack <= 22, String(sporeBack));
  check("the seeds and spores really are in the pocket", (await total2("weedseed")) === weedBack && (await total2("shroomspore")) === sporeBack);
}

console.log("--- posters");
{
  // a PNG header is all the server looks at: the signature and a 37 x 48 size
  const png = (w, h) => {
    const b = Buffer.alloc(8 + 4 + 4 + 13 + 4);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b, 0);
    b.writeUInt32BE(13, 8); b.write("IHDR", 12); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); b[24] = 8; b[25] = 6;
    return "data:image/png;base64," + b.toString("base64");
  };
  const p = await fresh("t_poster", { blood: 100 });
  await act(p, "sync");
  bad("a poster is bought in the shop room", await act(p, "buyPoster"));
  await stand(p, "shop", 9, 4);
  const buy = await act(p, "buyPoster");
  ok("buy a poster", buy);
  check("75 blood, one poster", buy.state.blood === 25 && total(buy.state.inventory, "f_poster") === 1, String(buy.state.blood));
  const room = `u_${p.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: p.uid, ownerName: "t_poster", name: "t_poster's room", access: "knock", w: 8, h: 8 });
  await stand(p, room, 4, 4);
  const slot = buy.state.inventory.findIndex((x) => x && x.item === "f_poster");
  bad("not in the middle of the room", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 4, dir: 0, img: png(25, 38) }));
  bad("not on the floor of the back wall facing the wrong way", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 2, img: png(25, 38) }));
  bad("a picture that isn't a PNG", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 4, img: "data:image/png;base64,AAAA" }));
  bad("a picture of the wrong size", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 4, img: png(500, 500) }));
  bad("a picture on something that isn't a poster", await act(p, "furniPlace", { source: "inv", slot: buy.state.inventory.findIndex((x) => x && x.item === "f_poster") + 0, x: 4, y: 0, dir: 4, img: "http://example.com/x.png" }));
  const hang = await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 4, img: png(25, 38) });
  ok("hang the poster on the back wall", hang);
  const rows = await owner("GET", `roomsMeta/${room}/furni`);
  const [fid, row] = Object.entries(rows ?? {}).find(([, r]) => r.kind === "f_poster") ?? [];
  check("it hangs there with its picture", !!row && row.x === 4 && row.y === 0 && row.dir === 4 && typeof row.img === "string" && row.img.length > 40, JSON.stringify(row).slice(0, 120));
  ok("move it along the wall", await act(p, "furniMove", { id: fid, x: 2, y: 0, dir: 4 }));
  ok("round the corner to the left wall", await act(p, "furniMove", { id: fid, x: 0, y: 3, dir: 2 }));
  bad("not into the room", await act(p, "furniMove", { id: fid, x: 3, y: 3, dir: 0 }));
  check("the picture stayed on it", typeof (await owner("GET", `roomsMeta/${room}/furni/${fid}/img`)) === "string");
  const st = await act(p, "furniStore", { id: fid });
  ok("take it down (into the toolbox)", st);
  check("it is back as a plain poster", st.state.storage.f_poster === 1 && (await owner("GET", `roomsMeta/${room}/furni/${fid}`)) === null);
  const again = await act(p, "furniPlace", { source: "storage", kind: "f_poster", x: 6, y: 0, dir: 4 });
  ok("hang it again with no picture: it shows the ?", again);
  const sell = await fresh("t_poster2", { inventory: { 0: { item: "f_poster", qty: 1 } } });
  await act(sell, "sync");
  const so = await act(sell, "sellWeed", { slot: 0, qty: 1 });
  check("6ixty pays 75% of 75 for a poster: 56", so.ok === true && so.state.blood === 56, JSON.stringify(so.state && so.state.blood));
}

console.log("--- the decorator power: furniture in other people's rooms");
{
  const owner1 = await fresh("t_dec_owner");
  await act(owner1, "sync");
  const room = `u_${owner1.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: owner1.uid, ownerName: "t_dec_owner", name: "t_dec_owner's room", access: "open", w: 8, h: 8, furni: { theirs: { kind: "f_sofa", x: 5, y: 5 } } });
  await owner("PUT", `rooms/${room}/players/${owner1.uid}`, { name: "t_dec_owner", figure: "x", x: 1, y: 6, dir: 2 });
  const png = () => { const b = Buffer.alloc(33); Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b, 0); b.writeUInt32BE(13, 8); b.write("IHDR", 12); b.writeUInt32BE(25, 16); b.writeUInt32BE(38, 20); b[24] = 8; b[25] = 6; return "data:image/png;base64," + b.toString("base64"); };
  const inv = { 0: { item: "f_poster", qty: 1 }, 1: { item: "f_sofa", qty: 1 }, 2: { item: "f_poster", qty: 1 } };
  const plain = await fresh("t_dec_plain", { inventory: inv });
  await act(plain, "sync");
  await owner("PUT", `roomsMeta/u_${plain.uid}`, { owner: plain.uid, ownerName: "t_dec_plain", name: "x", access: "open", w: 8, h: 8 });
  await stand(plain, room, 3, 3);
  bad("a normal player can't put furniture in someone else's room", await act(plain, "furniPlace", { room, source: "inv", slot: 1, x: 2, y: 2, dir: 0 }));
  const deco = await fresh("t_dec_deco", { inventory: inv });
  await owner("PATCH", `users/${deco.uid}`, { decorator: true });
  await act(deco, "sync");
  await owner("PUT", `roomsMeta/u_${deco.uid}`, { owner: deco.uid, ownerName: "t_dec_deco", name: "x", access: "open", w: 8, h: 8 });
  bad("not from outside the room", await act(deco, "furniPlace", { room, source: "inv", slot: 1, x: 2, y: 2, dir: 0 }));
  await stand(deco, room, 3, 3);
  const sofa = await act(deco, "furniPlace", { room, source: "inv", slot: 1, x: 2, y: 2, dir: 0 });
  ok("the decorator puts a sofa in their room", sofa);
  const rows = await owner("GET", `roomsMeta/${room}/furni`);
  const mine = Object.entries(rows).find(([, r]) => r.by === deco.uid && r.kind === "f_sofa");
  check("it carries who put it there", !!mine, JSON.stringify(rows));
  ok("and a poster on the wall", await act(deco, "furniPlace", { room, source: "inv", slot: 0, x: 4, y: 0, dir: 4, img: png() }));
  bad("a poster still only goes on a wall", await act(deco, "furniPlace", { room, source: "inv", slot: 2, x: 4, y: 4, dir: 0, img: png() }));
  ok("move the sofa they put there", await act(deco, "furniMove", { room, id: mine[0], x: 1, y: 3, dir: 0 }));
  bad("not the owner's own sofa", await act(deco, "furniMove", { room, id: "theirs", x: 1, y: 1, dir: 0 }));
  bad("and not take it away", await act(deco, "furniStore", { room, id: "theirs" }));
  ok("they can take back what they put there", await act(deco, "furniStore", { room, id: mine[0] }));
  check("the owner's sofa is still there", (await owner("GET", `roomsMeta/${room}/furni/theirs/kind`)) === "f_sofa");
}

console.log("--- tobacco and the cigar");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const t = await fresh("t_tobacco", { inventory: { 0: { item: "cigbutt", qty: 5 }, 1: { item: "jointpaper", qty: 1 }, 2: { item: "bluntwrap", qty: 1 }, 3: { item: "weed", qty: 2 }, 4: { item: "pill", qty: 1 }, 5: { item: "lighter", qty: 1 } } });
  await act(t, "sync");
  const room = `u_${t.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: t.uid, ownerName: "t_tobacco", name: "x", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(t, room, 4, 4);
  const done = async () => { await owner("PATCH", `roomsMeta/${room}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 }); return act(t, "mixCollect", { fid: "mx" }); };
  bad("one butt on its own can't be mixed with itself", await act(t, "mix", { fid: "mx", a: 1, b: 1 }));
  const m1 = await act(t, "mix", { fid: "mx", a: 0, b: 0 }); // two butts out of the same stack
  ok("two cigarette butts in the mixer", m1);
  check("three butts left", total(m1.state.inventory, "cigbutt") === 3);
  const c1 = await done();
  check("1 tobacco", total(c1.state.inventory, "tobacco") === 1, JSON.stringify(c1.data));
  // tobacco mixes like a cigarette
  const m2 = await act(t, "mix", { fid: "mx", a: slotOf(c1.state, "weed"), b: slotOf(c1.state, "tobacco") });
  ok("weed + tobacco in the mixer", m2);
  const c2 = await done();
  check("2 weed mix, like with a cigarette", total(c2.state.inventory, "mix") === 2 && total(c2.state.inventory, "tobacco") === 0, JSON.stringify(c2.data));
  // butts again -> tobacco -> rolled in paper
  await owner("PUT", `users/${t.uid}/inventory/20`, { item: "tobacco", qty: 2 });
  const st = await state(t);
  const cig = await act(t, "combine", { a: slotOf(st, "tobacco"), b: slotOf(st, "jointpaper") });
  ok("tobacco + joint paper", cig);
  check("a cigarette", total(cig.state.inventory, "cigarette") === 1 && total(cig.state.inventory, "tobacco") === 1, JSON.stringify(cig.data));
  const cgr = await act(t, "combine", { a: slotOf(cig.state, "tobacco"), b: slotOf(cig.state, "bluntwrap") });
  ok("tobacco + blunt paper", cgr);
  check("a cigar", total(cgr.state.inventory, "cigar") === 1, JSON.stringify(cgr.data));
  // the cigar mixes like a cigarette and smokes like one
  const mc = await act(t, "mix", { fid: "mx", a: slotOf(cgr.state, "pill"), b: slotOf(cgr.state, "cigar") });
  ok("pill + cigar in the mixer", mc);
  const cc = await done();
  check("a research chemical, like with a cigarette", total(cc.state.inventory, "researchchem") === 1, JSON.stringify(cc.data));
  await owner("PUT", `users/${t.uid}/inventory/21`, { item: "cigar", qty: 1 });
  const smoke = await act(t, "light", { slot: 21 });
  ok("light a cigar", smoke);
  const litSlot = smoke.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${t.uid}/inventory/${litSlot}`, { lit: Date.now() - 70_000 });
  const fin = await act(t, "finishSmoke", { slot: litSlot });
  ok("smoke it", fin);
  check("stabs give 2x, like a cigarette", fin.state.boostMult === 2 && fin.state.boostUntil - Date.now() > 110_000, JSON.stringify([fin.state.boostMult]));
}

console.log("--- /give");
{
  const g = await fresh("t_give");
  await act(g, "sync");
  const r1 = await act(g, "debug", { cmd: "give", item: "weed", qty: 3 });
  ok("give weed", r1);
  check("3 weed in one stack", total(r1.state.inventory, "weed") === 3);
  const r2 = await act(g, "debug", { cmd: "give", item: "f_sofa", qty: 2 });
  check("two sofas, a slot each", total(r2.state.inventory, "f_sofa") === 2 && r2.state.inventory.filter((x) => x && x.item === "f_sofa").length === 2);
  const r3 = await act(g, "debug", { cmd: "give", item: "codeine", qty: 1 });
  check("anything: codeine", total(r3.state.inventory, "codeine") === 1);
  bad("an item that does not exist", await act(g, "debug", { cmd: "give", item: "unicorn", qty: 1 }));
}

console.log("--- a cigarette skips 30 seconds");
{
  const k = await fresh("t_cigskip", { inventory: { 0: { item: "cigarette", qty: 1 }, 1: { item: "lighter", qty: 1 }, 2: { item: "kodimagnyl", qty: 1 }, 3: { item: "wateringcan_full", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_cigskip", name: "t_cigskip's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  ok("start a lean", await act(k, "mix", { fid: "mx", a: 2, b: 3 }));
  const before = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  const lit = await act(k, "light", { slot: 0 });
  ok("light the cigarette", lit);
  const ls = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${k.uid}/inventory/${ls}`, { lit: Date.now() - 70_000 });
  ok("smoke it", await act(k, "finishSmoke", { slot: ls }));
  const after = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  check("the mixer is 30 seconds closer", before - after === 30_000, String(before - after));
}
console.log("--- the boombox goes into storage, never into a pocket");
{
  const k = await fresh("t_boombox");
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_boombox", name: "t_boombox's room", access: "knock", w: 8, h: 8 });
  await stand(k, `u_${k.uid}`, 4, 4);
  const st = await act(k, "furniStore", { id: "boombox" });
  ok("store the room's boombox", st);
  check("it is in storage", (st.state.storage ?? {}).f_boombox === 1, JSON.stringify(st.state.storage));
  check("and gone from the room", (await owner("GET", `roomsMeta/u_${k.uid}/boombox/gone`)) === true);
  bad("it can't be taken into the pocket", await act(k, "take", { key: "f_boombox" }));
  bad("it can't be stored twice", await act(k, "furniStore", { id: "boombox" }));
  ok("put it down again", await act(k, "furniPlace", { source: "storage", kind: "f_boombox", x: 3, y: 3, dir: 2 }));
  const rows = (await owner("GET", `roomsMeta/u_${k.uid}/furni`)) ?? {};
  const fid = Object.keys(rows).find((id) => rows[id].kind === "f_boombox");
  check("it stands in the room", !!fid);
  ok("and back into storage", await act(k, "furniStore", { id: fid }));
}
console.log("--- chud mix");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const k = await fresh("t_chud", { inventory: { 0: { item: "shroom", qty: 1 }, 1: { item: "weed", qty: 1 }, 2: { item: "jointpaper", qty: 1 }, 3: { item: "lighter", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_chud", name: "t_chud's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  ok("shroom + weed in the mixer", await act(k, "mix", { fid: "mx", a: 0, b: 1 }));
  const job = await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`);
  check("2 chud mix, 20 minutes", job.item === "chudmix" && job.qty === 2 && job.doneAt - Date.now() > 19 * 60_000 && job.doneAt - Date.now() <= 20 * 60_000 + 2000, JSON.stringify(job));
  await owner("PATCH", `roomsMeta/u_${k.uid}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
  const col = await act(k, "mixCollect", { fid: "mx" });
  check("collected", total(col.state.inventory, "chudmix") === 2);
  check("and the mixer remembers it: you know the result now", (await owner("GET", `users/${k.uid}/mixed/chudmix`)) === true);
  const roll = await act(k, "combine", { a: slotOf(col.state, "chudmix"), b: slotOf(col.state, "jointpaper") });
  ok("roll a chud joint", roll);
  check("a chud joint", total(roll.state.inventory, "joint_chud") === 1);
  const lit = await act(k, "light", { slot: slotOf(roll.state, "joint_chud") });
  ok("light it", lit);
  const ls = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${k.uid}/inventory/${ls}`, { lit: Date.now() - 70_000 });
  const fin = await act(k, "finishSmoke", { slot: ls });
  ok("smoke it", fin);
  check("the weed high: triple blood", fin.state.boostMult === 3, JSON.stringify(fin.state.boostMult));
  check("and the shroom high: doors open for 3 minutes", fin.state.shroomUntil - Date.now() > 170_000 && fin.state.shroomUntil - Date.now() <= 181_000, String(fin.state.shroomUntil - Date.now()));
}
console.log("--- troldmand mix, LSD, the plain chud joint");
{
  const slotOf = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
  const k = await fresh("t_troll", { inventory: { 0: { item: "hash", qty: 1 }, 1: { item: "weed", qty: 1 }, 2: { item: "shroom", qty: 1 }, 3: { item: "pill", qty: 1 }, 4: { item: "weed", qty: 1, ass: true }, 5: { item: "cigarette", qty: 1 }, 6: { item: "lighter", qty: 1 }, 7: { item: "jointpaper", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_troll", name: "t_troll's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  const mixCollect = async (a, b, item, qty) => {
    const st = await act(k, "sync");
    const m = await act(k, "mix", { fid: "mx", a: slotOf(st.state, a[0], a[1]), b: slotOf(st.state, b[0], b[1]) });
    ok(`${a[0]} + ${b[0]} in the mixer`, m);
    await owner("PATCH", `roomsMeta/u_${k.uid}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
    const col = await act(k, "mixCollect", { fid: "mx" });
    check(`${qty} ${item} come out`, total(col.state.inventory, item) === qty, JSON.stringify(col.state.inventory.filter(Boolean)));
    return col;
  };
  await mixCollect(["hash"], ["weed"], "trollmix", 2);
  await mixCollect(["shroom"], ["pill"], "lsd", 1);
  const cj = await mixCollect(["weed", true], ["cigarette"], "joint_chudname", 1);
  const lsd = await act(k, "debug", { cmd: "give", item: "lsd", qty: 1 });
  const dr = await act(k, "consume", { slot: slotOf(lsd.state, "lsd") });
  ok("take LSD", dr);
  check("3x speed for a minute and a half", dr.state.speedMult === 3 && dr.state.speedUntil - Date.now() > 85_000 && dr.state.speedUntil - Date.now() <= 91_000, JSON.stringify([dr.state.speedMult, dr.state.speedUntil - Date.now()]));
  check("and no open doors", !(dr.state.shroomUntil > Date.now()), String(dr.state.shroomUntil));
  const lit = await act(k, "light", { slot: slotOf(dr.state, "joint_chudname") });
  ok("light the chud joint", lit);
  const ls = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${k.uid}/inventory/${ls}`, { lit: Date.now() - 70_000 });
  const fin = await act(k, "finishSmoke", { slot: ls });
  ok("smoke it", fin);
  check("it only changes the name for 30 seconds", fin.data.chudMs === 30_000 && fin.data.mult === 0, JSON.stringify(fin.data));
  check("no blood bonus", !(fin.state.boostUntil > Date.now()), String(fin.state.boostUntil));
}
console.log("--- the vending machine's daily stock of mixers and growing kits");
{
  const room = "shop";
  const v = await fresh("t_vend", { blood: 500 });
  await act(v, "sync");
  await stand(v, room, 3, 3);
  let got = 0;
  for (let i = 0; i < 5; i++) if ((await act(v, "buyVending", { id: "mixer" })).ok) got++;
  check("day 1: five mixers", got === 5, String(got));
  bad("the sixth is sold out", await act(v, "buyVending", { id: "mixer" }));
  ok("kits have their own stock", await act(v, "buyVending", { id: "planter" }));
  ok("lighters have no limit", await act(v, "buyVending", { id: "lighter" }));
  // an account made 2 days ago: 3 a day
  const old = await fresh("t_vend_old", { blood: 500 });
  await owner("PUT", `users/${old.uid}/createdAt`, Date.now() - 2 * 86_400_000);
  await act(old, "sync");
  await stand(old, room, 3, 3);
  let n2 = 0;
  for (let i = 0; i < 6; i++) if ((await act(old, "buyVending", { id: "planter" })).ok) n2++;
  check("day 3: three kits", n2 === 3, String(n2));
  // an account made long ago: one a day
  const older = await fresh("t_vend_older", { blood: 500 });
  await owner("PUT", `users/${older.uid}/createdAt`, Date.now() - 20 * 86_400_000);
  await act(older, "sync");
  await stand(older, room, 3, 3);
  let n3 = 0;
  for (let i = 0; i < 4; i++) if ((await act(older, "buyVending", { id: "mixer" })).ok) n3++;
  check("day 5 and later: one a day", n3 === 1, String(n3));
}
console.log("--- weak shrooms");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const w = await fresh("t_weak", { inventory: { 0: { item: "weed", qty: 1 } } });
  await act(w, "sync");
  const room = `u_${w.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: w.uid, ownerName: "t_weak", name: "t_weak's room", access: "knock", w: 8, h: 8, furni: { ks: { kind: "f_planter", x: 2, y: 2, crop: "shroom", plantedAt: Date.now() - 26 * 60_000 }, mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(w, room, 4, 4);
  const hv = await act(w, "harvest", { fid: "ks" });
  ok("harvest an unwatered shroom", hv);
  check("a weak shroom, not a shroom", total(hv.state.inventory, "weakshroom") === 1 && total(hv.state.inventory, "shroom") === 0, JSON.stringify(hv.state.inventory.filter(Boolean)));
  bad("it can't be mixed with weed", await act(w, "mix", { fid: "mx", a: slotOf(hv.state, "weakshroom"), b: slotOf(hv.state, "weed") }));
  const eat = await act(w, "consume", { slot: slotOf(hv.state, "weakshroom") });
  ok("but it can be eaten", eat);
  check("same effect: 3 minutes of open doors", eat.state.shroomUntil - Date.now() > 170_000, String(eat.state.shroomUntil - Date.now()));
}
console.log("--- /skip");
{
  const k = await fresh("t_skip", { inventory: { 0: { item: "kodimagnyl", qty: 1 }, 1: { item: "wateringcan_full", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_skip", name: "t_skip's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  ok("start a lean", await act(k, "mix", { fid: "mx", a: 0, b: 1 }));
  const before = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  ok("/skip 5", await act(k, "debug", { cmd: "skip", n: 5 }));
  const after = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  check("the mixer is 5 minutes closer", before - after === 300_000, String(before - after));
}
console.log(`\n${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
