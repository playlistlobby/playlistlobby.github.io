// Ducky machine tests (test mode: a buy goes straight through): the starter package, name colour, chat tool, room advert, rename (a separate file so they run on their own)
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



const inShop = async (u) => { await act(u, "sync"); await stand(u, "shop", 3, 3); };
const put = (path, v) => owner("PUT", path, v);
const signIn = async (email, password = "secret1") => (await (await fetch(`${AUTH}:signInWithPassword?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) })).json());
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const refused = (r) => r.status === 401 || r.status === 403;
// paying: the payment page is made (here the "payment" counts at once: no Stripe key on the local server), then what was paid for is handed over
const checkout = async (u, product, params = {}) => {
  const r = await fetch(`${API}/pay/checkout`, { method: "POST", headers: { authorization: `Bearer ${u.token}`, "content-type": "application/json" }, body: JSON.stringify({ product: "ducky_" + product, ...params }) });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};
const pay = async (u, product, params = {}) => {
  const c = await checkout(u, product, params);
  if (!c.ok) return { ok: false, status: c.status, error: c.error, stage: "checkout" };
  const cl = await act(u, "claimPurchases");
  const got = cl.data?.ducky?.find((d) => d.product === product);
  return got && !got.stuck ? { ok: true, status: 200, data: got } : { ok: false, status: cl.status, error: got?.stuck ?? cl.error ?? "nothing came", stage: "claim", claim: cl };
};

await owner("DELETE", "purchases"); await owner("DELETE", "userPurchases");
console.log("--- the machine: paying and getting");
{
  const a = await fresh("t_du_a", { blood: 10 });
  await act(a, "sync");
  check("no login: no checkout", (await fetch(`${API}/pay/checkout`, { method: "POST", body: "{}" })).status === 401);
  const nope = await checkout(a, "yacht");
  check("it does not sell that", nope.ok === false);
  const r = await pay(a, "starter");
  ok("the starter package", r);
  const st = await state(a);
  check("3 growing kits and 3 mixers", total(st.inventory, "f_planter") === 3 && total(st.inventory, "f_mixer") === 3, JSON.stringify(st.inventory.map((x) => x && x.item + "x" + x.qty)));
  check("50 blood", st.blood === 60, String(st.blood));
  check("it is marked as bought", st.owned.ducky_starter === true);
  const pur = Object.values((await owner("GET", `purchases`)) ?? {}).filter((p) => p.uid === a.uid && p.product === "ducky_starter");
  check("the purchase is on record: 30 kr, claimed", pur.length === 1 && pur[0].amount === 3000 && pur[0].status === "claimed", JSON.stringify(pur));
  bad("only once", await pay(a, "starter"));
  bad("and the free machine does not give it", await act(a, "duckyBuy", { product: "starter" }));
  const items = [];
  for (let i = 0; i < 24; i++) items.push([i, { item: "wateringcan", qty: 1 }]);
  items.push([24, { item: "lighter", qty: 1 }], [25, { item: "knife", qty: 1 }], [26, { item: "cd", qty: 1 }], [27, { item: "syringe", qty: 1 }]);
  const full = await fresh("t_du_full", { blood: 0, inventory: Object.fromEntries(items) });
  await act(full, "sync");
  const fr = await pay(full, "starter");
  check("with a full pocket it waits (the money is kept)", fr.ok === false && !(await state(full)).owned.ducky_starter);
  await owner("PUT", `users/${full.uid}/inventory`, {});
  const later = await act(full, "claimPurchases");
  check("and arrives once there is room", later.data?.ducky?.some((d) => d.product === "starter") && (await state(full)).owned.ducky_starter === true, JSON.stringify(later).slice(0, 200));
}

console.log("--- name colour and the chat tool");
{
  const a = await fresh("t_du_c", { blood: 0, createdAt: Date.now() - 3_600_000 }); await inShop(a);
  check("a colour is needed", (await checkout(a, "color")).ok === false);
  check("not just any text", (await checkout(a, "color", { color: "red" })).ok === false);
  check("too dark to read", (await checkout(a, "color", { color: "#101010" })).ok === false);
  bad("the free change needs the colour first", await act(a, "duckyBuy", { product: "color", color: "#33c7ff" }));
  const r = await pay(a, "color", { color: "#FF8800" });
  ok("a name colour", r);
  check("it is saved (lower case)", (await owner("GET", `users/${a.uid}/nameColor`)) === "#ff8800" && (await owner("GET", `profiles/${a.uid}/nc`)) === "#ff8800");
  check("a second payment for it is refused", (await checkout(a, "color", { color: "#33c7ff" })).ok === false);
  const r2 = await act(a, "duckyBuy", { product: "color", color: "#33c7ff" });
  check("changing it later is free", r2.ok === true && r2.data?.free === true && (await owner("GET", `users/${a.uid}/nameColor`)) === "#33c7ff");
  const node = (u, nc) => clientWrite(u, `rooms/shop/players/${u.uid}`, { name: u.name, figure: "x", x: 3, y: 3, dir: 2, nc });
  check("the player node may show the bought colour", (await node(a, "#33c7ff")).status === 200);
  check("but not another one", refused(await node(a, "#ff0000")));
  const b = await fresh("t_du_nocolor", { blood: 0, createdAt: Date.now() - 3_600_000 }); await inShop(b);
  check("a colour that was never bought is refused", refused(await node(b, "#ff0000")));

  const msg = (u, extra) => clientWrite(u, `rooms/shop/chat/m${Math.random().toString(36).slice(2)}`, { uid: u.uid, name: u.name, text: "hi", ts: { ".sv": "timestamp" }, ...extra });
  check("plain chat works", (await msg(b, {})).status === 200);
  check("an effect without the tool is refused", refused(await msg(b, { fx: "shake" })));
  ok("buy the chat tool", await pay(a, "fx"));
  bad("only once", await pay(a, "fx"));
  check("shaky text", (await msg(a, { fx: "shake" })).status === 200);
  check("coloured text", (await msg(a, { fc: "#ff3b3b" })).status === 200);
  check("both", (await msg(a, { fx: "rainbow", fc: "#46d369" })).status === 200);
  check("an effect that does not exist is refused", refused(await msg(a, { fx: "explode" })));
  check("so is a colour that is not one", refused(await msg(a, { fc: "red" })));
}

console.log("--- no room advert any more");
{
  const a = await fresh("t_du_ad", { blood: 0 }); await inShop(a);
  check("the machine does not sell adverts", (await checkout(a, "ad")).ok === false);
}

console.log("--- renaming");
const R = Math.random().toString(36).slice(2, 6);
{
  const a = await fresh(`t_du_o${R}`, { blood: 0 }); await inShop(a);
  await put(`usernames/t_du_o${R}`, a.uid);
  await put(`profiles/${a.uid}`, { name: `t_du_o${R}`, figure: "x" });
  await put(`roomsMeta/u_${a.uid}`, { owner: a.uid, ownerName: `t_du_o${R}`, name: `t_du_o${R}'s room`, access: "open", w: 8, h: 8 });
  await put(`flappyBoard/${a.uid}`, { name: `t_du_o${R}`, score: 3, at: 1 });
  check("a name must be valid", (await checkout(a, "rename", { name: "no" })).ok === false);
  check("and not have spaces", (await checkout(a, "rename", { name: "two words" })).ok === false);
  check("not reserved", (await checkout(a, "rename", { name: "Admin" })).ok === false);
  check("not your own name", (await checkout(a, "rename", { name: `t_du_o${R}` })).ok === false);
  const other = await fresh(`t_du_t${R}`, { blood: 0 }); await put(`usernames/t_du_t${R}`, other.uid);
  check("not a name somebody has (nothing is charged)", (await checkout(a, "rename", { name: `T_du_T${R}` })).ok === false);
  check("so nothing is on record yet", !Object.values((await owner("GET", "purchases")) ?? {}).some((p) => p.uid === a.uid && p.product === "ducky_rename"));
  const paid = await pay(a, "rename", { name: `T_du_N${R}` });
  ok("a new name", paid);
  const rec = Object.values((await owner("GET", "purchases")) ?? {}).find((p) => p.uid === a.uid && p.product === "ducky_rename");
  check("10 kr, and the new name is in the record", rec && rec.amount === 1000 && rec.params?.name === `T_du_N${R}`, JSON.stringify(rec));
  check("the profile and the account follow", (await owner("GET", `users/${a.uid}/name`)) === `T_du_N${R}` && (await owner("GET", `profiles/${a.uid}/name`)) === `T_du_N${R}`);
  check("the old name is free, the new one is taken", (await owner("GET", `usernames/t_du_o${R}`)) === null && (await owner("GET", `usernames/t_du_n${R}`)) === a.uid);
  check("the room and the scoreboard follow", (await owner("GET", `roomsMeta/u_${a.uid}/ownerName`)) === `T_du_N${R}` && (await owner("GET", `roomsMeta/u_${a.uid}/name`)) === `T_du_N${R}'s room` && (await owner("GET", `flappyBoard/${a.uid}/name`)) === `T_du_N${R}`);
  const oldLogin = await signIn(`t_du_o${R}@users.bobba.invalid`);
  const newLogin = await signIn(`t_du_n${R}@users.bobba.invalid`);
  check("signing in works with the new name, not the old one", !oldLogin.idToken && !!newLogin.idToken && newLogin.localId === a.uid, JSON.stringify([oldLogin.error?.message, !!newLogin.idToken]));
  ok("only the capital letters", await pay(a, "rename", { name: `t_du_n${R}` }));
  check("the name has them as written", (await owner("GET", `users/${a.uid}/name`)) === `t_du_n${R}` && (await owner("GET", `usernames/t_du_n${R}`)) === a.uid);
  // two players paid for the same name: the second one cannot have it (the money stays, for the admin to give back)
  const x = await fresh(`t_du_x${R}`, { blood: 0 }), y = await fresh(`t_du_y${R}`, { blood: 0 });
  await act(x, "sync"); await act(y, "sync");
  const cx = await checkout(x, "rename", { name: `Same${R}` }), cy = await checkout(y, "rename", { name: `Same${R}` });
  check("both can start paying for it", cx.ok && cy.ok);
  const gx = await act(x, "claimPurchases"), gy = await act(y, "claimPurchases");
  check("the first one gets it", gx.data?.ducky?.[0]?.name === `Same${R}`, JSON.stringify(gx).slice(0, 200));
  check("the second one is told, and the payment is kept as stuck", !!gy.data?.ducky?.[0]?.stuck && Object.values((await owner("GET", `userPurchases/${y.uid}`)) ?? {}).some((p) => p.status === "stuck"), JSON.stringify(gy).slice(0, 200));
  const adm = await fresh("adminsidia", { blood: 0 }); await inShop(adm);
  const ad = await pay(adm, "rename", { name: "somebodyelse" });
  check("the admin keeps the name", ad.ok === false);
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
