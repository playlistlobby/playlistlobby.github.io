// /tp (emil and the admin): go to a player, bring a player, send one player to another.
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/carry-upgrades.mjs (server/)
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

const mk = async (name, room) => { const u = await account(name); await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "x", createdAt: Date.now() - 3_600_000, blood: 0, inventory: {} }); await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" }); await owner("PUT", `usernames/${name}`, u.uid); await owner("PUT", `presence/${u.uid}`, { room, name }); return u; };
const em = await mk("emil", "lobby");
const p1 = await mk("t_tp_one", "shop");
const p2 = await mk("t_tp_two", "u_someone");
const rando = await mk("t_tp_rando", "lobby");
console.log("--- /tp");
check("a normal player is turned away", (await act(rando, "staffTp", { who: "t_tp_one" })).ok === false);
const r1 = await act(em, "staffTp", { who: "t_tp_one" });
check("/tp name: emil goes to them, nobody is moved", r1.ok && r1.data.self === true && r1.data.room === "shop" && (await owner("GET", `teleports/${p1.uid}`)) === null, JSON.stringify(r1));
const r2 = await act(em, "staffTp", { who: "t_tp_one", to: "me" });
const t2 = await owner("GET", `teleports/${p1.uid}`);
check("/tp name me: they are sent to emil's room", r2.ok && r2.data.self === false && t2 && t2.room === "lobby", JSON.stringify([r2, t2]));
const r3 = await act(em, "staffTp", { who: "t_tp_two", to: "t_tp_one" });
const t3 = await owner("GET", `teleports/${p2.uid}`);
check("/tp a b: the first is sent to the second", r3.ok && t3 && t3.room === "shop", JSON.stringify([r3, t3]));
check("a name that doesn't exist is refused", (await act(em, "staffTp", { who: "nobodyhere" })).ok === false);
await owner("PUT", `presence/${p1.uid}/room`, "streets");
check("the street can't be gone to this way", (await act(em, "staffTp", { who: "t_tp_one" })).ok === false);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
