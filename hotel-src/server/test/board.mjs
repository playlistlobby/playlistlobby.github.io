// Notice board test (the blue Discord board): only the admin writes it, everybody signed in reads it.
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
const boss = await account("t_nb_admin");
await owner("PUT", `users/${boss.uid}`, { name: "t_nb_admin", gender: "M", figure: "x", blood: 0, createdAt: Date.now() });
await owner("PUT", `roles/${boss.uid}`, "admin");
const rando = await account("t_nb_rando");
await owner("PUT", `users/${rando.uid}`, { name: "t_nb_rando", gender: "M", figure: "x", blood: 0, createdAt: Date.now() - 3_600_000 });
await owner("DELETE", "discordBoard");

console.log("--- who may write it");
bad("an ordinary player can't", await act(rando, "boardSet", { title: "Hi", text: "x", link: "https://discord.gg/abc" }));
check("nothing was written", (await owner("GET", "discordBoard")) === null);
ok("the admin writes it", await act(boss, "boardSet", { title: "  Discord  ", text: "Join us\r\n\r\n\r\n\r\nfor the news", link: "https://discord.gg/abc123" }));
const row = await owner("GET", "discordBoard");
check("tidied up", row && row.title === "Discord" && row.text === "Join us\n\nfor the news" && row.link === "https://discord.gg/abc123", JSON.stringify(row));

console.log("--- what is allowed");
bad("a link must be https/http", await act(boss, "boardSet", { title: "x", text: "", link: "javascript:alert(1)" }));
bad("no spaces in a link", await act(boss, "boardSet", { title: "x", text: "", link: "https://a b.com" }));
bad("a long title", await act(boss, "boardSet", { title: "x".repeat(31), text: "", link: "" }));
bad("a long text", await act(boss, "boardSet", { title: "", text: "x".repeat(401), link: "" }));
bad("a control character", await act(boss, "boardSet", { title: "a\u0007b", text: "", link: "" }));
ok("no link is fine", await act(boss, "boardSet", { title: "Just news", text: "hello", link: "" }));
check("the old link is gone", (await owner("GET", "discordBoard/link")) === "");

console.log("--- the rules");
check("everybody signed in can read it", (await fetch(`${DB}/discordBoard.json?ns=${NS}&auth=${rando.token}`)).status === 200);
check("nobody can read it without signing in", (await fetch(`${DB}/discordBoard.json?ns=${NS}`)).status >= 400);
const put = await fetch(`${DB}/discordBoard/text.json?ns=${NS}&auth=${rando.token}`, { method: "PUT", body: JSON.stringify("hacked") });
check("and nobody writes it from the browser", put.status >= 400);
ok("the admin clears it", await act(boss, "boardSet", { title: "", text: "", link: "" }));
check("then it is empty", (await owner("GET", "discordBoard")) === null);

console.log(`\n${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
