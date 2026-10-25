// Mines tests: mining iron, crafting a pickaxe and a machete, wood from 6ixty, selling iron, the machete stab (a separate file so they run on their own)
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
const inMines = async (u, x = 3, y = 5) => { await act(u, "sync"); await stand(u, "mines", x, y); };
const ROCK = { id: "mrock1", x: 3, y: 4 };

await owner("DELETE", "rooms/mines"); await owner("DELETE", "minesCool");
console.log("--- mining");
{
  const a = await fresh("t_mi_a", { blood: 0, inventory: inv({ item: "knife", qty: 1 }) });
  await act(a, "sync");
  bad("you have to be in the mines", await act(a, "mine", { rock: ROCK.id }));
  await inMines(a, 3, 5);
  bad("that is not a rock", await act(a, "mine", { rock: "mrock99" }));
  bad("nor is the bench", await act(a, "mine", { rock: "mbench" }));
  const first = await act(a, "mine", { rock: ROCK.id });
  ok("the first swing gives iron", first);
  check("it is in the pocket", total((await state(a)).inventory, "iron") === 1);
  const early = await act(a, "mine", { rock: ROCK.id });
  check("the second one has to wait (no iron, and it says how long)", early.ok === true && early.data.iron === 0 && early.data.wait > 0, JSON.stringify(early).slice(0, 160));
  check("still one iron", total((await state(a)).inventory, "iron") === 1);
  await stand(a, "mines", 12, 12);
  await owner("DELETE", `minesCool/${a.uid}`);
  bad("too far from the rock", await act(a, "mine", { rock: ROCK.id }));
  const b = await fresh("t_mi_noknife", { blood: 0 });
  await inMines(b);
  bad("no knife, no mining", await act(b, "mine", { rock: ROCK.id }));
  // a pickaxe is faster: 10 s instead of 24 s
  const p = await fresh("t_mi_pick", { blood: 0, inventory: inv({ item: "knife", qty: 1 }, { item: "pickaxe", qty: 1 }) });
  await inMines(p);
  ok("swing with the pickaxe", await act(p, "mine", { rock: ROCK.id }));
  await owner("PUT", `minesCool/${p.uid}`, Date.now() - 9000);
  ok("9 seconds later is enough with the pickaxe (it lets 8 s through)", await act(p, "mine", { rock: ROCK.id }));
  const k = await fresh("t_mi_knife", { blood: 0, inventory: inv({ item: "knife", qty: 1 }) });
  await inMines(k);
  await owner("PUT", `minesCool/${k.uid}`, Date.now() - 9000);
  check("but not with the knife", (await act(k, "mine", { rock: ROCK.id })).data?.iron === 0);
  await owner("PUT", `minesCool/${k.uid}`, Date.now() - 20000);
  ok("20 seconds is enough for the knife (19.2 s)", await act(k, "mine", { rock: ROCK.id }));
  const full = await fresh("t_mi_full", { blood: 0, inventory: Object.fromEntries(Array.from({ length: 28 }, (_, i) => [i, i === 0 ? { item: "knife", qty: 1 } : { item: "wateringcan", qty: 1 }])) });
  await inMines(full);
  bad("a full pocket stops the mining", await act(full, "mine", { rock: ROCK.id }));
}

console.log("--- the crafting bench");
{
  const a = await fresh("t_mi_cr", { blood: 0, inventory: inv({ item: "iron", qty: 5 }, { item: "wood", qty: 5 }) });
  await inMines(a, 1, 3);
  bad("a recipe that does not exist", await act(a, "craft", { recipe: "sword" }));
  bad("6 iron are needed for the pickaxe (5 is not enough)", await act(a, "craft", { recipe: "pickaxe" }));
  await owner("PUT", `users/${a.uid}/inventory`, inv({ item: "iron", qty: 16 }, { item: "wood", qty: 5 }));
  await act(a, "sync");
  await stand(a, "mines", 10, 10);
  bad("you have to stand at the bench", await act(a, "craft", { recipe: "pickaxe" }));
  await stand(a, "mines", 1, 3);
  const r = await act(a, "craft", { recipe: "pickaxe" });
  ok("the pickaxe", r);
  let st = await state(a);
  check("6 iron and 2 wood went into it", total(st.inventory, "iron") === 10 && total(st.inventory, "wood") === 3 && total(st.inventory, "pickaxe") === 1, JSON.stringify(st.inventory.map((x) => x && x.item + "x" + x.qty)));
  bad("one pickaxe is enough", await act(a, "craft", { recipe: "pickaxe" }));
  ok("the machete (10 iron, 3 wood)", await act(a, "craft", { recipe: "machete" }));
  st = await state(a);
  check("the machete is there and the materials are gone", total(st.inventory, "machete") === 1 && total(st.inventory, "iron") === 0 && total(st.inventory, "wood") === 0);
  const nope = await fresh("t_mi_cr2", { blood: 0, inventory: inv({ item: "iron", qty: 20 }, { item: "wood", qty: 1 }) });
  await inMines(nope, 1, 3);
  bad("not enough wood", await act(nope, "craft", { recipe: "machete" }));
}

console.log("--- 6ixty in the mines");
{
  const a = await fresh("t_mi_w", { blood: 50, inventory: inv({ item: "iron", qty: 4 }) });
  await act(a, "sync");
  bad("he only sells wood in the mines", await act(a, "buySixty", { item: "wood" }));
  await stand(a, "mines", 9, 2);
  ok("buy wood", await act(a, "buySixty", { item: "wood" }));
  let st = await state(a);
  check("it costs 5", st.blood === 45 && total(st.inventory, "wood") === 1, String(st.blood));
  ok("buy another", await act(a, "buySixty", { item: "wood" }));
  check("wood stacks", total((await state(a)).inventory, "wood") === 2);
  const sold = await act(a, "sellWeed", { slot: (await state(a)).inventory.findIndex((x) => x && x.item === "iron"), qty: 4 });
  ok("sell the iron", sold);
  st = await state(a);
  check("he pays 3 for each", st.blood === 40 + 12, String(st.blood));
  const woodSlot = st.inventory.findIndex((x) => x && x.item === "wood");
  const w2 = await act(a, "sellWeed", { slot: woodSlot, qty: 2 });
  check("and 2 for a piece of wood", w2.ok === true && (await state(a)).blood === 52 + 4);
  const poor = await fresh("t_mi_poor", { blood: 4 }); await act(poor, "sync"); await stand(poor, "mines", 9, 2);
  bad("not enough blood", await act(poor, "buySixty", { item: "wood" }));
}

console.log("--- iron, wood and the tools can't be put on the floor or traded (the tools)");
{
  const a = await fresh("t_mi_drop", { blood: 0, inventory: inv({ item: "pickaxe", qty: 1 }, { item: "iron", qty: 3 }) });
  await act(a, "sync"); await stand(a, "mines", 4, 4);
  bad("the pickaxe stays with you", await act(a, "drop", { room: "mines", slot: 0, x: 5, y: 4, qty: 1 }));
  ok("iron can be dropped in the mines", await act(a, "drop", { room: "mines", slot: 1, x: 5, y: 4, qty: 1 }));
}

console.log("--- the machete");
{
  const stabber = await fresh("t_mi_stab", { blood: 0, inventory: inv({ item: "machete", qty: 1 }) });
  const victim = await fresh("t_mi_vic", { blood: 0 });
  const plain = await fresh("t_mi_plain", { blood: 0, inventory: inv({ item: "knife", qty: 1 }) });
  for (const u of [stabber, victim, plain]) await act(u, "sync");
  await stand(stabber, "lobby", 4, 4); await stand(plain, "lobby", 4, 5); await stand(victim, "lobby", 5, 4);
  const r = await act(stabber, "stab", { target: victim.uid, room: "lobby" });
  ok("a machete stabs without a knife", r);
  const g1 = r.data?.gain;
  const r2 = await act(plain, "stab", { target: victim.uid, room: "lobby" });
  ok("a knife stab", r2);
  check("the machete draws twice the blood", g1 === 2 * r2.data.gain && r2.data.gain >= 1, `machete ${g1} knife ${r2.data?.gain}`);
}

console.log("--- the rules");
{
  const a = await fresh("t_mi_rules", { blood: 0 });
  await stand(a, "mines", 2, 2);
  const r = await fetch(`${DB}/rooms/mines/players.json?ns=${NS}&auth=${a.token}`);
  check("a player in the mines can read who is there", r.status === 200, String(r.status));
  const o = await fresh("t_mi_out", { blood: 0 });
  const r2 = await fetch(`${DB}/rooms/mines/players.json?ns=${NS}&auth=${o.token}`);
  check("anybody signed in may enter the mines (it is a public room)", r2.status === 200, String(r2.status));
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
