// Integration tests: the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: npm test (server/)
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
  const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args }) });
  const j = await r.json();
  return { status: r.status, ...j };
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
  check("syringe and 5 blood", total(jr.state.inventory, "syringe") === 1 && jr.state.blood === 7 - 2 + 5);
}

console.log("--- shops can't be fooled");
{
  const u = await fresh("t_shop", { blood: 3 });
  await act(u, "sync");
  bad("can't buy the planter without enough blood", await act(u, "buySixty", { item: "f_planter" }));
  bad("can't buy something 6ixty doesn't sell", await act(u, "buySixty", { item: "knife" }));
  bad("can't buy a dead cat", await act(u, "buySixty", { item: "deadcat" }));
  bad("not enough for the pack", await act(u, "buyVending", { id: "cigpack" }));
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
  const mixIt = async (x, y) => { st = await state(a); return act(a, "mix", { fid, a: slotOf(st, x[0], x[1]), b: slotOf(st, y[0], y[1]) }); };
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
  await owner("PATCH", `users/${a.uid}/inventory/${litSlot2}`, { lit: Date.now() - 70_000 });
  const fin2 = await act(a, "finishSmoke", { slot: litSlot2 });
  ok("finish the research blunt", fin2);
  check("the same, and 30 seconds of flashing and smoke", fin2.state.speedUntil - Date.now() > 100_000 && fin2.state.chemUntil - Date.now() > 20_000 && fin2.state.chemUntil - Date.now() <= 31_000, JSON.stringify([fin2.state.speedUntil - Date.now(), fin2.state.chemUntil - Date.now()]));
}

console.log("--- selling weed");
{
  const a = await fresh("t_sell", { inventory: { 0: { item: "weed", qty: 3 }, 1: { item: "weed", qty: 2, ass: true }, 2: { item: "knife", qty: 1 } } });
  await act(a, "sync");
  bad("he only buys weed", await act(a, "sellWeed", { slot: 2, qty: 1 }));
  const r1 = await act(a, "sellWeed", { slot: 0, qty: 2 });
  ok("sell 2 good weed", r1);
  check("paid 12", r1.state.blood === 12);
  const r2 = await act(a, "sellWeed", { slot: 1, qty: 99 });
  ok("sell all the ass weed", r2);
  check("paid 6 more (3 each, capped at what you have)", r2.state.blood === 18);
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
  const a = await fresh("t_room", { inventory: { 0: { item: "cigarette", qty: 15 }, 1: { item: "weed", qty: 2, ass: true }, 2: { item: "f_telephone", qty: 1 }, 3: { item: "lockpick", qty: 1 } } });
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

console.log("--- smoking, bins, syringe, cats, flappy");
{
  const a = await fresh("t_misc", { inventory: { 0: { item: "cigarette", qty: 2 }, 1: { item: "lighter", qty: 1 }, 2: { item: "syringe", qty: 1 }, 3: { item: "deadcat", qty: 1 }, 4: { item: "knife", qty: 1 } } });
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
  const cat = await act(a, "carve", { slot: (await state(a)).inventory.findIndex((x) => x && x.item === "deadcat") });
  ok("carve a cat", cat);
  check("+2 blood", cat.state.blood === 2);
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
  const a = await fresh("t_grow", { inventory: { 0: { item: "weed", qty: 1 }, 1: { item: "jointpaper", qty: 1 }, 2: { item: "weedseed", qty: 1 }, 3: { item: "wateringcan", qty: 1 } } });
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
  ok("water the plant", await act(a, "water", { fid: "kit1", slot: canSlot }));
  await owner("PATCH", `roomsMeta/${room}/furni/kit1`, { plantedAt: Date.now() - 3 * 3600_000, wateredAt: Date.now() });
  const h = await act(a, "harvest", { fid: "kit1" });
  ok("harvest once it has grown", h);
  check("3 good weed", h.state.inventory.some((x) => x && x.item === "weed" && x.qty === 3 && !x.ass));
  bad("a kit that isn't yours", await act(await fresh("t_grow2"), "harvest", { fid: "kit1" }));
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

console.log(`\n${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
