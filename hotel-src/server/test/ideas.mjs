// Ideas board tests: posting, pictures, likes, comments, deleting, the 24 hour life (a separate file so they run on their own): the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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



const PX = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=";
const ideasRead = (path) => owner("GET", path);
const inLobby = async (u) => { await act(u, "sync"); await stand(u, "lobby", 3, 3); };
const posts = async () => (await ideasRead("ideas/posts")) ?? {};

console.log("--- posting");
{
  await owner("DELETE", "ideas"); await owner("DELETE", "ideasImg"); await owner("DELETE", "ideasCool");
  const a = await fresh("t_id_a", { blood: 0 }), b = await fresh("t_id_b", { blood: 0 });
  await act(a, "sync"); await act(b, "sync");
  bad("you have to be in the basement", await act(a, "ideaPost", { title: "hi" }));
  await inLobby(a); await inLobby(b);
  bad("a title is needed", await act(a, "ideaPost", { title: "   " }));
  bad("19 characters is too long a title", await act(a, "ideaPost", { title: "x".repeat(19) }));
  bad("129 characters is too long", await act(a, "ideaPost", { title: "ok", text: "x".repeat(129) }));
  bad("a picture must be a data URL", await act(a, "ideaPost", { title: "ok", image: "http://example.com/a.png" }));
  bad("not a script either", await act(a, "ideaPost", { title: "ok", image: "data:text/html;base64,PHNjcmlwdD4=" }));
  bad("too big a picture", await act(a, "ideaPost", { title: "ok", image: "data:image/jpeg;base64," + "A".repeat(260000) }));
  const r = await act(a, "ideaPost", { title: "  More   lamps ", text: "we need them", image: PX });
  ok("a post with a picture", r);
  const id = r.data?.id;
  const p = (await posts())[id];
  check("the post is on the board", !!p && p.title === "More lamps" && p.text === "we need them" && p.uid === a.uid && p.name === "t_id_a" && p.img === true, JSON.stringify(p));
  check("the picture is kept apart", (await ideasRead(`ideasImg/${id}`)) === PX);
  { const big = "data:image/jpeg;base64," + "A".repeat(200000); const x = await fresh("t_id_big", { blood: 0 }); await inLobby(x); ok("a 200 KB picture gets through the worker", await act(x, "ideaPost", { title: "big", image: big })); bad("but not 300 KB", await act(x, "ideaPost", { title: "bigger", image: "data:image/jpeg;base64," + "A".repeat(300000) })); }
  { const x = await fresh("t_id_nl", { blood: 0 }); await inLobby(x); const rr = await act(x, "ideaPost", { title: "two\nlines", text: "first\r\nsecond\tthird" }); ok("line breaks in the box are fine", rr); const pp = (await posts())[rr.data?.id]; check("and they become spaces", !!pp && pp.title === "two lines" && pp.text === "first second third", JSON.stringify(pp)); }
  { const x = await fresh("t_id_ctl", { blood: 0 }); await inLobby(x); bad("another control character is refused", await act(x, "ideaPost", { title: "a\u0007b" })); }
  bad("posting again at once is too fast", await act(a, "ideaPost", { title: "again" }));
  ok("somebody else can post", await act(b, "ideaPost", { title: "A cat" }));
  check("a post without a picture has none", Object.values(await posts()).some((x) => x.title === "A cat" && !x.img));
  const logged = Object.values((await owner("GET", "chatLog")) ?? {}).some((x) => x.room === "ideas" && x.uid === a.uid && /More lamps/.test(x.text));
  check("it is in the admin's chat log", logged);

  console.log("--- likes and comments");
  ok("like it", await act(b, "ideaLike", { post: id }));
  check("one like", Object.keys((await posts())[id].likes ?? {}).length === 1 && (await posts())[id].likes[b.uid] === true);
  ok("liking twice changes nothing", await act(b, "ideaLike", { post: id }));
  check("still one", Object.keys((await posts())[id].likes ?? {}).length === 1);
  ok("take the like back", await act(b, "ideaLike", { post: id, on: false }));
  check("none left", Object.keys((await posts())[id].likes ?? {}).length === 0);
  bad("a like on nothing", await act(b, "ideaLike", { post: "zzzzzzzz" }));
  ok("comment", await act(b, "ideaComment", { post: id, text: "agreed" }));
  bad("not so fast", await act(b, "ideaComment", { post: id, text: "again" }));
  bad("an empty comment", await act(a, "ideaComment", { post: id, text: "" }));
  bad("101 characters", await act(a, "ideaComment", { post: id, text: "x".repeat(101) }));
  const comments = Object.entries((await ideasRead(`ideas/comments/${id}`)) ?? {});
  check("the comment is there", comments.length === 1 && comments[0][1].text === "agreed" && comments[0][1].uid === b.uid);

  console.log("--- deleting");
  bad("not yours", await act(b, "ideaDelete", { post: id }));
  bad("nor the comment", await act(a, "ideaDelete", { post: id, comment: comments[0][0] }));
  ok("delete your own comment", await act(b, "ideaDelete", { post: id, comment: comments[0][0] }));
  ok("the poster deletes the post", await act(a, "ideaDelete", { post: id }));
  check("post, picture and comments are gone", !(await posts())[id] && (await ideasRead(`ideasImg/${id}`)) === null && (await ideasRead(`ideas/comments/${id}`)) === null);
  // the admin takes anything down
  const adm = await fresh("adminsidia", { blood: 0 }); await inLobby(adm);
  const mine = Object.keys(await posts())[0];
  ok("the admin deletes somebody else's post", await act(adm, "ideaDelete", { post: mine }));
  check("gone", !(await posts())[mine]);
}

console.log("--- the 24 hours");
{
  await owner("DELETE", "ideasCool");
  const a = await fresh("t_id_old", { blood: 0 }); await inLobby(a);
  await owner("PUT", "ideas/posts/oldoldpost1", { uid: a.uid, name: "t_id_old", figure: "x", title: "ancient", ts: Date.now() - 25 * 3600_000, img: true });
  await owner("PUT", "ideasImg/oldoldpost1", PX);
  await owner("PUT", "ideas/comments/oldoldpost1/c1", { uid: a.uid, name: "t_id_old", text: "old", ts: Date.now() - 25 * 3600_000 });
  bad("no comment on an old post", await act(a, "ideaComment", { post: "oldoldpost1", text: "hi" }));
  bad("no like on an old post", await act(a, "ideaLike", { post: "oldoldpost1" }));
  ok("a new post clears the old ones away", await act(a, "ideaPost", { title: "fresh" }));
  check("the old post, its picture and its comments are gone", !(await posts()).oldoldpost1 && (await ideasRead("ideasImg/oldoldpost1")) === null && (await ideasRead("ideas/comments/oldoldpost1")) === null);
}

console.log("--- the rules");
{
  const a = await fresh("t_id_rules", { blood: 0 });
  const r1 = await fetch(`${DB}/ideas/posts.json?ns=${NS}&auth=${a.token}`);
  check("a signed-in player can read the board", r1.status === 200, String(r1.status));
  const w = await fetch(`${DB}/ideas/posts/hack.json?ns=${NS}&auth=${a.token}`, { method: "PUT", body: JSON.stringify({ uid: a.uid, title: "x", ts: 1 }) });
  check("but not write to it", w.status === 401 || w.status === 403, String(w.status));
  const w2 = await fetch(`${DB}/ideasImg/hack.json?ns=${NS}&auth=${a.token}`, { method: "PUT", body: JSON.stringify("x") });
  check("nor to the pictures", w2.status === 401 || w2.status === 403, String(w2.status));
  const r2 = await fetch(`${DB}/ideas/posts.json?ns=${NS}`);
  check("and strangers can't read it", r2.status === 401 || r2.status === 403, String(r2.status));
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
