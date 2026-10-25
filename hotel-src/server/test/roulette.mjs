// Russian roulette tests (a separate file so they run on their own): the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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

const TABLE = "rooms/lobby/roulette";
const sit = (u) => owner("PUT", `rooms/lobby/players/${u.uid}`, { name: u.name, figure: "x", x: 0, y: 16, dir: 4, sit: true });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const player = async (name, blood) => { const u = await fresh(name, { blood }); await act(u, "sync"); await sit(u); return u; };
const clear = () => owner("DELETE", TABLE);

console.log("--- roulette: sitting down and the stake");
{
  await clear();
  const a = await player("t_rl_a", 1000), b = await player("t_rl_b", 1000), c3 = await player("t_rl_c", 3);
  const standing = await fresh("t_rl_stand", { blood: 100 }); await act(standing, "sync"); await stand(standing, "lobby", 3, 3);
  bad("sit down first", await act(standing, "rouletteOpen", { stake: 10 }));
  const away = await fresh("t_rl_away", { blood: 100 }); await act(away, "sync");
  bad("not even in the basement", await act(away, "rouletteOpen", { stake: 10 }));
  bad("0 blood", await act(a, "rouletteOpen", { stake: 0 }));
  bad("501 blood is too much", await act(a, "rouletteOpen", { stake: 501 }));
  bad("not a number", await act(a, "rouletteOpen", { stake: "lots" }));
  bad("more than you have", await act(c3, "rouletteOpen", { stake: 10 }));
  ok("open with 25", await act(a, "rouletteOpen", { stake: 25 }));
  check("the 25 is on the table, not in the pocket", (await bloodOf(a)) === 975);
  const st = await owner("GET", TABLE);
  check("waiting, stake 25, host a, in chair 0, with a look", st.status === "waiting" && st.stake === 25 && st.a.uid === a.uid && st.a.seat === 0 && typeof st.a.figure === "string", JSON.stringify(st));
  bad("a second stake while one waits", await act(a, "rouletteOpen", { stake: 5 }));
  bad("nobody else can name a stake", await act(b, "rouletteOpen", { stake: 5 }));
  bad("you cannot join your own stake", await act(a, "rouletteJoin"));
  bad("too poor to match it", await act(c3, "rouletteJoin"));
  bad("nobody can pull yet", await act(a, "roulettePull"));
  ok("standing up takes the blood back", await act(a, "rouletteLeave"));
  check("all 1000 again", (await bloodOf(a)) === 1000);
  check("the table is empty", (await owner("GET", TABLE)) === null);
  ok("leaving an empty table is harmless", await act(a, "rouletteLeave"));
  bad("nothing to join", await act(b, "rouletteJoin"));
}

console.log("--- roulette: a whole game");
{
  await clear();
  const a = await player("t_rl_g1", 1000), b = await player("t_rl_g2", 1000), spec = await player("t_rl_g3", 1000);
  ok("a opens with 40", await act(a, "rouletteOpen", { stake: 40 }));
  bad("b cannot take a's chair", await act(b, "rouletteJoin", { seat: 0 }));
  bad("a made-up chair", await act(b, "rouletteJoin", { seat: 5 }));
  ok("b matches it", await act(b, "rouletteJoin", { seat: 1 }));
  let st = await owner("GET", TABLE);
  check("b is in chair 1", st.b?.seat === 1, JSON.stringify(st.b));
  check("playing, both seated, somebody has the gun", st.status === "playing" && st.b.uid === b.uid && (st.turn === a.uid || st.turn === b.uid), JSON.stringify(st));
  check("both stakes are on the table", (await bloodOf(a)) === 960 && (await bloodOf(b)) === 960);
  bad("a third player cannot join", await act(spec, "rouletteJoin"));
  bad("a third player cannot pull", await act(spec, "roulettePull"));
  bad("a third player cannot open", await act(spec, "rouletteOpen", { stake: 5 }));
  const players = { [a.uid]: a, [b.uid]: b };
  let pulls = 0, dead = null;
  for (;;) {
    st = await owner("GET", TABLE);
    const holder = players[st.turn], other = players[st.turn === a.uid ? b.uid : a.uid];
    bad("the other one cannot pull out of turn", await act(other, "roulettePull"));
    const r = await act(holder, "roulettePull");
    ok("pull " + (pulls + 1), r);
    pulls++;
    if (r.data.dead) { dead = holder; break; }
    check("the gun was passed", (await owner("GET", TABLE)).turn === other.uid);
    if (pulls > 6) break;
  }
  check("somebody died within six pulls", !!dead && pulls <= 6, String(pulls));
  st = await owner("GET", TABLE);
  const winner = dead === a ? b : a;
  check("the table says who died and who won", st.status === "over" && st.dead === dead.uid && st.winner === winner.uid && st.last.dead === true && st.last.k === pulls, JSON.stringify(st));
  check("the winner got both stakes (+40 net), the dead player lost theirs (-40)", (await bloodOf(winner)) === 1040 && (await bloodOf(dead)) === 960, `${await bloodOf(winner)} / ${await bloodOf(dead)}`);
  check("no blood was made or lost", (await bloodOf(a)) + (await bloodOf(b)) === 2000);
  bad("no pulling after the end", await act(winner, "roulettePull"));
  bad("the table is busy while the end is shown", await act(spec, "rouletteOpen", { stake: 5 }));
  await owner("PUT", `${TABLE}/endAt`, Date.now() - 60_000);
  ok("a finished game that has been shown long enough clears away: a new stake can go on", await act(spec, "rouletteOpen", { stake: 5 }));
  await act(spec, "rouletteLeave");
}

console.log("--- roulette: the odds (one bullet, six chambers)");
{
  const a = await player("t_rl_o1", 100000), b = await player("t_rl_o2", 100000);
  await owner("PUT", `users/${a.uid}/noTradeLimit`, true); await owner("PUT", `users/${b.uid}/noTradeLimit`, true);
  const hist = [0, 0, 0, 0, 0, 0, 0];
  const GAMES = 60;
  for (let i = 0; i < GAMES; i++) {
    await clear();
    await act(a, "rouletteOpen", { stake: 1 }); await act(b, "rouletteJoin");
    for (let k = 1; k <= 6; k++) {
      const st = await owner("GET", TABLE);
      const r = await act(st.turn === a.uid ? a : b, "roulettePull");
      if (!r.ok) { check("pull went through", false, JSON.stringify(r)); break; }
      if (r.data.dead) { hist[k]++; break; }
      if (k === 6) check("the sixth pull is always the bullet", false);
    }
  }
  check(`every game ended on a pull from 1 to 6 (${hist.slice(1).join(", ")})`, hist.slice(1).reduce((s, n) => s + n, 0) === GAMES);
  check("the first pull is not always deadly or always safe", hist[1] > 0 && hist[1] < GAMES, String(hist[1]));
  check("the first three pulls hold about half the deaths (it is 1/2 in theory)", hist[1] + hist[2] + hist[3] >= GAMES * 0.25 && hist[1] + hist[2] + hist[3] <= GAMES * 0.75, hist.join(","));
  await clear();
}

console.log("--- roulette: getting up, leaving, timeouts");
{
  await clear();
  const a = await player("t_rl_l1", 500), b = await player("t_rl_l2", 500);
  await act(a, "rouletteOpen", { stake: 100 }); await act(b, "rouletteJoin");
  const st0 = await owner("GET", TABLE);
  const holder = st0.turn === a.uid ? a : b, other = holder === a ? b : a;
  ok("somebody gets up mid-game", await act(holder, "rouletteLeave"));
  const st = await owner("GET", TABLE);
  check("the one who stayed wins by forfeit, nobody died", st.status === "over" && st.winner === other.uid && st.forfeit === true && !st.dead, JSON.stringify(st));
  check("the one who left lost 100, the other won 100", (await bloodOf(holder)) === 400 && (await bloodOf(other)) === 600, `${await bloodOf(holder)} / ${await bloodOf(other)}`);
  await clear();

  // the trigger is pulled for somebody who takes too long
  await act(a, "rouletteOpen", { stake: 10 }); await act(b, "rouletteJoin");
  const stT = await owner("GET", TABLE);
  ok("tick before the time is up changes nothing", await act(a, "rouletteTick"));
  check("still the same turn", (await owner("GET", TABLE)).seq === stT.seq);
  await owner("PUT", `${TABLE}/turnAt`, Date.now() - 60_000);
  const t = await act(b, "rouletteTick");
  ok("tick after the time is up pulls for them", t);
  const stA = await owner("GET", TABLE);
  check("a pull was made", stA.seq === stT.seq + 1 && stA.shots === 1, JSON.stringify(stA));
  await clear();

  // somebody who vanished (closed the tab) loses the game once they have been gone long enough; a waiting stake goes back
  const c3 = await player("t_rl_l3", 300), d = await player("t_rl_l4", 300);
  await act(c3, "rouletteOpen", { stake: 50 });
  await owner("DELETE", `rooms/lobby/players/${c3.uid}`);
  ok("first tick only notes that c is gone", await act(d, "rouletteTick"));
  check("still waiting", (await owner("GET", TABLE))?.status === "waiting");
  await owner("PUT", `${TABLE}/gone/${c3.uid}`, Date.now() - 60_000);
  ok("a later tick gives the blood back", await act(d, "rouletteTick"));
  check("c has the 50 back and the table is empty", (await bloodOf(c3)) === 300 && (await owner("GET", TABLE)) === null);
  await sit(c3);
  await act(c3, "rouletteOpen", { stake: 50 }); await act(d, "rouletteJoin");
  await owner("DELETE", `rooms/lobby/players/${c3.uid}`);
  await act(d, "rouletteTick");
  await owner("PUT", `${TABLE}/gone/${c3.uid}`, Date.now() - 60_000);
  ok("a game whose player vanished", await act(d, "rouletteTick"));
  const stG = await owner("GET", TABLE);
  check("d wins it", stG.status === "over" && stG.winner === d.uid && stG.forfeit === true, JSON.stringify(stG));
  check("d won 50, c lost 50", (await bloodOf(d)) === 350 && (await bloodOf(c3)) === 250, `${await bloodOf(d)} / ${await bloodOf(c3)}`);
  await clear();
  const e = await player("t_rl_l5", 100);
  await act(e, "rouletteOpen", { stake: 20 });
  await owner("DELETE", `rooms/lobby/players/${e.uid}`);
  const away = await player("t_rl_l6", 10);
  const j = await act(away, "rouletteJoin");
  ok("joining a stake whose owner is gone does not crash", j);
  check("e has the 20 back and the table is empty", (await bloodOf(e)) === 100 && (await owner("GET", TABLE)) === null, `${await bloodOf(e)}`);
  await clear();
}

console.log("--- roulette: the 24 hour limit counts the stakes");
{
  await clear();
  const a = await player("t_rl_m1", 5000);
  for (let i = 0; i < 2; i++) { ok(`500 on the table, round ${i + 1}`, await act(a, "rouletteOpen", { stake: 500 })); await act(a, "rouletteLeave"); }
  bad("the third 500 goes over 1000 in 24 hours", await act(a, "rouletteOpen", { stake: 500 }));
  await owner("PUT", `users/${a.uid}/noTradeLimit`, true);
  ok("an account without the limit can", await act(a, "rouletteOpen", { stake: 500 }));
  await act(a, "rouletteLeave");
  await clear();
}
console.log("--- coin flip machine removed: an open flip is paid back on the next load");
{
  const a = await fresh("t_fl_a", { blood: 100 }), b = await fresh("t_fl_b", { blood: 100 });
  await owner("PUT", "coinflips/open/zzz1", { by: a.uid, name: "t_fl_a", stake: 30, side: "heads", ts: Date.now() });
  await owner("PUT", "coinflips/open/zzz2", { by: b.uid, name: "t_fl_b", stake: 12, side: "tails", ts: Date.now() });
  const r = await act(a, "sync");
  ok("a loads the game", r);
  check("a got the 30 back", r.state.blood === 130, String(r.state.blood));
  check("a's flip is gone, b's is still there", (await owner("GET", "coinflips/open/zzz1")) === null && (await owner("GET", "coinflips/open/zzz2")) !== null);
  const r2 = await act(a, "sync");
  check("loading again pays nothing more", r2.state.blood === 130);
  const rb = await act(b, "sync");
  check("b got the 12 back", rb.state.blood === 112 && (await owner("GET", "coinflips/open")) === null, String(rb.state.blood));
  bad("the old flip actions are gone", await act(a, "flipPost", { stake: 5, side: "heads" }));
}
console.log("--- roulette: somebody who is away keeps their 12 seconds");
{
  await clear();
  const a = await player("t_rl_w1", 500), b = await player("t_rl_w2", 500);
  await act(a, "rouletteOpen", { stake: 10, seat: 0 }); await act(b, "rouletteJoin", { seat: 1 });
  const st0 = await owner("GET", TABLE);
  const holder = st0.turn === a.uid ? a : b, other = holder === a ? b : a;
  await owner("DELETE", `rooms/lobby/players/${holder.uid}`); // the holder refreshes the page
  await owner("PUT", `${TABLE}/turnAt`, Date.now() - 60_000); // (and the gun's clock had nearly run out)
  ok("a tick notes that the holder is away", await act(other, "rouletteTick"));
  const st1 = await owner("GET", TABLE);
  check("the holder is marked gone, nothing was pulled for them", st1.status === "playing" && st1.shots === 0 && typeof st1.gone?.[holder.uid] === "number", JSON.stringify(st1));
  ok("another tick: still nothing pulled while they are away", await act(other, "rouletteTick"));
  check("still not pulled", (await owner("GET", TABLE)).shots === 0);
  await sit(holder); // back in the chair
  ok("they are back", await act(other, "rouletteTick"));
  const st2 = await owner("GET", TABLE);
  check("the gone mark is wiped and the gun's clock started again", !st2.gone && st2.shots === 0 && st2.turnAt > Date.now() - 20_000, JSON.stringify(st2));
  ok("the game goes on: they can pull", await act(holder, "roulettePull"));
  await clear();
}
console.log(`\n${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
