// Fentanyl tests: it kills, it laces other drugs, laced things kill (a separate file so they run on their own): the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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

console.log("--- fentanyl on its own kills");
{
  const a = await fresh("t_fe_a", { blood: 100, inventory: inv({ item: "superpill", qty: 2 }) });
  const r = await act(a, "consume", { slot: 0 });
  ok("swallow fentanyl", r);
  check("you die", r.data?.kind === "fentdeath", JSON.stringify(r).slice(0, 200));
  const res = r.data;
  check("10 seconds", res.ms === 10000);
  check("1.5 x the price (11) = 17 blood", res.lost === 17 && (await bloodOf(a)) === 83, JSON.stringify(res) + " blood " + (await bloodOf(a)));
  const st = await state(a);
  check("one fentanyl used up", total(st.inventory, "superpill") === 1);
  check("no speed from it", !(st.speedUntil > Date.now()));
  const poor = await fresh("t_fe_poor", { blood: 10, inventory: inv({ item: "superpill", qty: 1 }) });
  const rp = await act(poor, "consume", { slot: 0 });
  check("not enough blood: a quarter of it (2 of 10)", rp.data.lost === 2 && (await bloodOf(poor)) === 8, JSON.stringify(rp).slice(0, 200));
  const broke = await fresh("t_fe_broke", { blood: 0, inventory: inv({ item: "superpill", qty: 1 }) });
  const rb = await act(broke, "consume", { slot: 0 });
  check("no blood: nothing to lose, still dead", rb.data.lost === 0 && rb.data.kind === "fentdeath");
}

console.log("--- lacing");
{
  const a = await fresh("t_fe_lace", { blood: 100, inventory: inv(
    { item: "superpill", qty: 3 }, { item: "weed", qty: 3 }, { item: "pill", qty: 1 }, { item: "cigarette", qty: 2 }, { item: "superpill", qty: 1, lit: undefined },
    { item: "jointpaper", qty: 5 }, { item: "knife", qty: 1 }, { item: "joint", qty: 1 }, { item: "lighter", qty: 1 }) });
  const wSlot = 1, fSlot = 0; // (slot numbers: the ones I put in)
  const r = await act(a, "combine", { a: fSlot, b: wSlot });
  ok("fentanyl on weed", r);
  check("it says what you got", r.data?.gave === "laced_weed", JSON.stringify(r).slice(0, 200));
  let st = await state(a);
  check("one fentanyl used", total(st.inventory, "superpill") === 3 + 1 - 1, JSON.stringify(st.inventory.map((x) => x && `${x.item}x${x.qty}`)));
  check("2 clean weed left", st.inventory.find((x) => x && x.item === "weed")?.qty === 2);
  check("1 laced weed, in its own slot", st.inventory.find((x) => x && x.item === "laced_weed")?.qty === 1);
  // lacing a second one stacks with the first laced
  const r2 = await act(a, "combine", { a: slotOf(st, "superpill"), b: slotOf(st, "weed") });
  ok("a second one", r2);
  st = await state(a);
  check("laced stack together (2)", st.inventory.find((x) => x && x.item === "laced_weed")?.qty === 2 && st.inventory.filter((x) => x && x.item === "laced_weed").length === 1);
  check("clean weed 1 left", st.inventory.find((x) => x && x.item === "weed")?.qty === 1);
  bad("fentanyl on fentanyl", await act(a, "combine", { a: slotOf(st, "superpill"), b: slotOf(st, "superpill") }));
  bad("fentanyl on a knife", await act(a, "combine", { a: slotOf(st, "superpill"), b: slotOf(st, "knife") }));
  bad("fentanyl on a cigarette", await act(a, "combine", { a: slotOf(st, "superpill"), b: slotOf(st, "cigarette") }));
  bad("laced can't be laced again", await act(a, "combine", { a: slotOf(st, "superpill"), b: slotOf(st, "laced_weed") }));
  // the pill and the joint
  ok("fentanyl on a pill", await act(a, "combine", { a: slotOf(st, "superpill"), b: slotOf(st, "pill") }));
  ok("fentanyl on a joint", await act(a, "combine", { a: slotOf(await state(a), "superpill"), b: slotOf(await state(a), "joint") }));
  st = await state(a);
  check("laced pill and laced joint exist", slotOf(st, "laced_pill") >= 0 && slotOf(st, "laced_joint") >= 0);
  // rolling laced weed gives a laced joint
  const roll = await act(a, "combine", { a: slotOf(st, "laced_weed"), b: slotOf(st, "jointpaper") });
  ok("roll the laced weed", roll);
  st = await state(a);
  check("it made a laced joint (stacked with the other)", st.inventory.filter((x) => x && x.item === "laced_joint").reduce((n, x) => n + x.qty, 0) === 2, JSON.stringify(st.inventory.map((x) => x && `${x.item}x${x.qty}`)));
}

console.log("--- using something laced");
{
  const a = await fresh("t_fe_use", { blood: 100, inventory: inv({ item: "laced_weed", qty: 1 }, { item: "laced_pill", qty: 1 }, { item: "laced_joint", qty: 1 }, { item: "lighter", qty: 1 }, { item: "laced_codeine", qty: 1 }) });
  let st0 = await state(a);
  const r = await act(a, "consume", { slot: slotOf(st0, "laced_pill") });
  const res = r.data;
  check("laced pill kills", res.kind === "fentdeath" && res.item === "pill", JSON.stringify(r).slice(0, 200));
  // (fentanyl 11 + pill 3) x 1.5 = 21
  check("loses (11 + 3) x 1.5 = 21", res.lost === 21 && (await bloodOf(a)) === 79, JSON.stringify(res));
  check("the laced pill is gone", slotOf(await state(a), "laced_pill") < 0);
  const j = await act(a, "light", { slot: slotOf(await state(a), "laced_joint") });
  check("lighting a laced joint kills", j.data.kind === "fentdeath", JSON.stringify(j).slice(0, 200));
  // (11 + 9) x 1.5 = 30
  check("loses (11 + 9) x 1.5 = 30", j.data.lost === 30 && (await bloodOf(a)) === 49, JSON.stringify(j));
  const c = await act(a, "consume", { slot: slotOf(await state(a), "laced_codeine") });
  check("laced codeine kills", c.data.kind === "fentdeath");
  check("anything laced kills, even if it was asked nicely", (await act(a, "consume", { slot: slotOf(await state(a), "laced_weed") })).data?.kind === "fentdeath");
  const poor = await fresh("t_fe_use2", { blood: 20, inventory: inv({ item: "laced_pill", qty: 1 }) });
  const rp = await act(poor, "consume", { slot: 0 });
  check("not enough blood for 21: a quarter of 20 = 5", rp.data.lost === 5 && (await bloodOf(poor)) === 15, JSON.stringify(rp).slice(0, 200));
}

console.log("--- the blood falls on the floor where you die");
{
  const a = await fresh("t_fe_drop", { blood: 100, inventory: inv({ item: "superpill", qty: 1 }) });
  const b = await fresh("t_fe_pick", { blood: 5 });
  await act(a, "sync"); await act(b, "sync");
  await owner("DELETE", "rooms/lobby/drops");
  await stand(a, "lobby", 4, 4); await stand(b, "lobby", 4, 5);
  const r = await act(a, "consume", { slot: 0 });
  check("you die and lose 17", r.data?.lost === 17 && (await bloodOf(a)) === 83);
  bad("it does not fall at once", await act(a, "fentDrop", { room: "lobby" }));
  await owner("PUT", `fentOwed/${a.uid}/at`, Date.now() - 7000);
  const d = await act(a, "fentDrop", { room: "lobby" });
  check("after 7 seconds it lands on the floor", d.ok === true && d.data.dropped === 17, JSON.stringify(d).slice(0, 200));
  const pile = await owner("GET", "rooms/lobby/drops/4_4");
  check("on the tile where you lay: a pile of 17 blood", pile && pile.item === "blood" && pile.qty === 17 && !!pile.exp, JSON.stringify(pile));
  const again = await act(a, "fentDrop", { room: "lobby" });
  check("it only falls once", again.ok === true && again.data.dropped === 0 && (await owner("GET", "rooms/lobby/drops/4_4")).qty === 17);
  const got = await act(b, "pickup", { room: "lobby", key: "4_4" });
  check("somebody else picks it up as blood", got.ok === true && got.data.item === "blood" && (await bloodOf(b)) === 22, JSON.stringify(got).slice(0, 200));
  check("and it is gone from the floor", (await owner("GET", "rooms/lobby/drops/4_4")) === null);
  bad("nobody gets it twice", await act(b, "pickup", { room: "lobby", key: "4_4" }));
  const poor = await fresh("t_fe_nodrop", { blood: 0, inventory: inv({ item: "superpill", qty: 1 }) });
  await act(poor, "sync"); await stand(poor, "lobby", 6, 6);
  await act(poor, "consume", { slot: 0 });
  check("nothing to drop when you had nothing to lose", (await owner("GET", `fentOwed/${poor.uid}`)) === null);
}

console.log("--- laced things travel like anything else");
{
  const a = await fresh("t_fe_give", { blood: 5, inventory: inv({ item: "laced_weed", qty: 2 }, { item: "weed", qty: 2 }) });
  const b = await fresh("t_fe_get", { blood: 5 });
  await act(a, "sync"); await act(b, "sync");
  const st = await state(a);
  check("laced and clean weed are separate slots", st.inventory.filter((x) => x && (x.item === "weed" || x.item === "laced_weed")).length === 2);
  const sold = await act(a, "sellWeed", { slot: slotOf(st, "laced_weed"), qty: 1 });
  check("6ixty pays the same for it (6)", sold.ok === true, JSON.stringify(sold).slice(0, 200));
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
