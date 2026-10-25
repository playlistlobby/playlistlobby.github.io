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

console.log("--- the machine");
{
  const a = await fresh("t_du_a", { blood: 10 });
  await act(a, "sync");
  bad("you have to be in the shop", await act(a, "duckyBuy", { product: "starter" }));
  await inShop(a);
  bad("it does not sell that", await act(a, "duckyBuy", { product: "yacht" }));
  const r = await act(a, "duckyBuy", { product: "starter" });
  ok("the starter package", r);
  const st = await state(a);
  check("3 growing kits and 3 mixers", total(st.inventory, "f_planter") === 3 && total(st.inventory, "f_mixer") === 3, JSON.stringify(st.inventory.map((x) => x && x.item + "x" + x.qty)));
  check("50 blood", st.blood === 60, String(st.blood));
  check("it is marked as bought", st.owned.ducky_starter === true);
  bad("only once", await act(a, "duckyBuy", { product: "starter" }));
  const items = [];
  for (let i = 0; i < 24; i++) items.push([i, { item: "wateringcan", qty: 1 }]);
  items.push([24, { item: "lighter", qty: 1 }], [25, { item: "knife", qty: 1 }], [26, { item: "cd", qty: 1 }], [27, { item: "syringe", qty: 1 }]);
  const full = await fresh("t_du_full", { blood: 0, inventory: Object.fromEntries(items) });
  await inShop(full);
  bad("six free slots are needed", await act(full, "duckyBuy", { product: "starter" }));
  const fst = await state(full);
  check("and nothing was given", fst.blood === 0 && !fst.owned.ducky_starter);
}

console.log("--- name colour and the chat tool");
{
  const a = await fresh("t_du_c", { blood: 0 }); await inShop(a);
  bad("a colour is needed", await act(a, "duckyBuy", { product: "color" }));
  bad("not just any text", await act(a, "duckyBuy", { product: "color", color: "red" }));
  bad("too dark to read", await act(a, "duckyBuy", { product: "color", color: "#101010" }));
  const r = await act(a, "duckyBuy", { product: "color", color: "#FF8800" });
  ok("a name colour", r);
  check("it is saved (lower case)", (await owner("GET", `users/${a.uid}/nameColor`)) === "#ff8800" && (await owner("GET", `profiles/${a.uid}/nc`)) === "#ff8800");
  const r2 = await act(a, "duckyBuy", { product: "color", color: "#33c7ff" });
  check("changing it later is free", r2.ok === true && r2.data?.free === true && (await owner("GET", `users/${a.uid}/nameColor`)) === "#33c7ff");
  const node = (u, nc) => clientWrite(u, `rooms/shop/players/${u.uid}`, { name: u.name, figure: "x", x: 3, y: 3, dir: 2, nc });
  check("the player node may show the bought colour", (await node(a, "#33c7ff")).status === 200);
  check("but not another one", refused(await node(a, "#ff0000")));
  const b = await fresh("t_du_nocolor", { blood: 0 }); await inShop(b);
  check("a colour that was never bought is refused", refused(await node(b, "#ff0000")));

  const msg = (u, extra) => clientWrite(u, `rooms/shop/chat/m${Math.random().toString(36).slice(2)}`, { uid: u.uid, name: u.name, text: "hi", ts: { ".sv": "timestamp" }, ...extra });
  check("plain chat works", (await msg(b, {})).status === 200);
  check("an effect without the tool is refused", refused(await msg(b, { fx: "shake" })));
  ok("buy the chat tool", await act(a, "duckyBuy", { product: "fx" }));
  bad("only once", await act(a, "duckyBuy", { product: "fx" }));
  check("shaky text", (await msg(a, { fx: "shake" })).status === 200);
  check("coloured text", (await msg(a, { fc: "#ff3b3b" })).status === 200);
  check("both", (await msg(a, { fx: "rainbow", fc: "#46d369" })).status === 200);
  check("an effect that does not exist is refused", refused(await msg(a, { fx: "explode" })));
  check("so is a colour that is not one", refused(await msg(a, { fc: "red" })));
}

console.log("--- no room advert any more");
{
  const a = await fresh("t_du_ad", { blood: 0 }); await inShop(a);
  bad("the machine does not sell adverts", await act(a, "duckyBuy", { product: "ad" }));
}

console.log("--- renaming");
const R = Math.random().toString(36).slice(2, 6);
{
  const a = await fresh(`t_du_o${R}`, { blood: 0 }); await inShop(a);
  await put(`usernames/t_du_o${R}`, a.uid);
  await put(`profiles/${a.uid}`, { name: `t_du_o${R}`, figure: "x" });
  await put(`roomsMeta/u_${a.uid}`, { owner: a.uid, ownerName: `t_du_o${R}`, name: `t_du_o${R}'s room`, access: "open", w: 8, h: 8 });
  await put(`flappyBoard/${a.uid}`, { name: `t_du_o${R}`, score: 3, at: 1 });
  bad("a name must be valid", await act(a, "duckyBuy", { product: "rename", name: "no" }));
  bad("and not have spaces", await act(a, "duckyBuy", { product: "rename", name: "two words" }));
  bad("not reserved", await act(a, "duckyBuy", { product: "rename", name: "Admin" }));
  bad("not your own name", await act(a, "duckyBuy", { product: "rename", name: `t_du_o${R}` }));
  const other = await fresh(`t_du_t${R}`, { blood: 0 }); await put(`usernames/t_du_t${R}`, other.uid);
  bad("not a name somebody has", await act(a, "duckyBuy", { product: "rename", name: `T_du_T${R}` }));
  ok("a new name", await act(a, "duckyBuy", { product: "rename", name: `T_du_N${R}` }));
  check("the profile and the account follow", (await owner("GET", `users/${a.uid}/name`)) === `T_du_N${R}` && (await owner("GET", `profiles/${a.uid}/name`)) === `T_du_N${R}`);
  check("the old name is free, the new one is taken", (await owner("GET", `usernames/t_du_o${R}`)) === null && (await owner("GET", `usernames/t_du_n${R}`)) === a.uid);
  check("the room and the scoreboard follow", (await owner("GET", `roomsMeta/u_${a.uid}/ownerName`)) === `T_du_N${R}` && (await owner("GET", `roomsMeta/u_${a.uid}/name`)) === `T_du_N${R}'s room` && (await owner("GET", `flappyBoard/${a.uid}/name`)) === `T_du_N${R}`);
  const oldLogin = await signIn(`t_du_o${R}@users.bobba.invalid`);
  const newLogin = await signIn(`t_du_n${R}@users.bobba.invalid`);
  check("signing in works with the new name, not the old one", !oldLogin.idToken && !!newLogin.idToken && newLogin.localId === a.uid, JSON.stringify([oldLogin.error?.message, !!newLogin.idToken]));
  ok("only the capital letters", await act(a, "duckyBuy", { product: "rename", name: `t_du_n${R}` }));
  check("the name has them as written", (await owner("GET", `users/${a.uid}/name`)) === `t_du_n${R}` && (await owner("GET", `usernames/t_du_n${R}`)) === a.uid);
  const adm = await fresh("adminsidia", { blood: 0 }); await inShop(adm);
  bad("the admin keeps the name", await act(adm, "duckyBuy", { product: "rename", name: "somebodyelse" }));
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
