// Hit and gun tests: putting a hit on somebody from a hideout (500-1500, once per 2 hours per hideout, 3 a day per person), the gun (bagmand sells one a visit), and shooting:
// a bounty is claimed, the one who is shot drops blood and is dead for two minutes, the gun is always spent
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/hits.mjs (server/)
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
const owner = async (method, path, body) => (await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })).json();
const act = async (who, a, args = {}) => {
  for (let tries = 0; ; tries++) {
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12 && !process.env.NO_RETRY) { await new Promise((x) => setTimeout(x, 800)); continue; }
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 200));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 200));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  await owner("DELETE", `rooms/lobby/players/${u.uid}`); await owner("DELETE", `rooms/u_${u.uid}`); await owner("DELETE", `roomsMeta/u_${u.uid}`);
  await owner("DELETE", `hitLog/${u.uid}`); await owner("DELETE", `hitCool/${u.uid}`);
  return u;
};
const stand = (u, room, x = 5, y = 5) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x, y, dir: 2 });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const inv = (...items) => Object.fromEntries(items.map((it, i) => [i, it]));
const hasItem = (st, item) => st.inventory.some((x) => x && x.item === item);

const host = await fresh("t_ht_host", { blood: 5000 });
const mem = await fresh("t_ht_mem", { blood: 5000 });
const stranger = await fresh("t_ht_stranger", { blood: 5000 });
const shooter = await fresh("t_ht_shooter", { blood: 100, inventory: inv({ item: "gun", qty: 1 }) });
const poor = await fresh("t_ht_poor", { blood: 300 });
const rich = await fresh("t_ht_rich", { blood: 7000 });
const mid = await fresh("t_ht_mid", { blood: 3000 });
const small = await fresh("t_ht_small", { blood: 400 });
const guard = await fresh("t_ht_guard", { blood: 400 });
for (const u of [host, mem, stranger, shooter, poor, rich, mid, small, guard]) { await act(u, "sync"); await owner("PUT", `usernames/${u.name.toLowerCase()}`, u.uid); }
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 1 }));
await owner("PUT", `users/${host.uid}/blood`, 5000);
await owner("PUT", `roles/${guard.uid}`, "admin");
const HR = `h_${host.uid}`;
await owner("PUT", `roomsMeta/${HR}`, { owner: host.uid, ownerName: "host", name: "The Syndicate", access: "open", w: 14, h: 14, members: { [mem.uid]: { name: "mem", build: false, at: 1 } } });
for (const u of [host, mem, stranger]) await stand(u, HR, 4, 4);
for (const u of [rich, mid, small, shooter, poor]) await stand(u, "lobby", 5, 5);
const hits = async () => Object.entries((await owner("GET", "hits")) ?? {}).map(([id, h]) => ({ id, ...h }));
const clearHits = async () => owner("DELETE", "hits");
await clearHits();

console.log("--- the hitman site's list of players");
{
  const names = (r) => (r.data?.players ?? []).map((p) => p.name);
  for (const u of [rich, mid, guard]) await owner("PUT", `presence/${u.uid}`, { name: u.name, room: "lobby", seen: Date.now() });
  await owner("PUT", `presence/${small.uid}`, { name: small.name, room: "lobby", seen: Date.now() - 600_000 }); // (gone for ten minutes)
  const on = await act(host, "hitSearch", { q: "" });
  ok("the list of who is online", on);
  check("those who are online are in it", names(on).includes("t_ht_rich") && names(on).includes("t_ht_mid"), JSON.stringify(names(on)));
  check("not the one who left", !names(on).includes("t_ht_small"), JSON.stringify(names(on)));
  check("not the admin (protected)", !names(on).includes("t_ht_guard"), JSON.stringify(names(on)));
  check("not yourself", !names(on).includes(host.name));
  const find = await act(host, "hitSearch", { q: "t_ht_" });
  check("a search finds names with it in them", names(find).includes("t_ht_rich"), JSON.stringify(names(find)));
  check("and the protected one is not found", !names(find).includes("t_ht_guard"), JSON.stringify(names(find)));
  bad("one letter is too short", await act(host, "hitSearch", { q: "t" }));
}

console.log("--- guns and rocket launchers can be traded and dropped");
{
  const tradeWith = async (a, b, item) => {
    const id = `tr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    await owner("PUT", `users/${a.uid}/inventory`, inv({ item, qty: 1 }));
    await owner("PUT", `users/${b.uid}/inventory`, {});
    await owner("PUT", `trades/${id}`, { a: a.uid, b: b.uid, status: "open", names: { [a.uid]: a.name, [b.uid]: b.name }, ready: { [a.uid]: true, [b.uid]: true }, confirm: { [a.uid]: true, [b.uid]: true }, offer: { [a.uid]: { blood: 0, items: { 0: { item, qty: 1 } } }, [b.uid]: { blood: 0, items: {} } } });
    return act(a, "tradeFinish", { id });
  };
  for (const item of ["gun", "rocket"]) {
    const r = await tradeWith(mid, small, item);
    ok(`a ${item} can be traded`, r);
    check(`and the other one has it now`, JSON.stringify((await owner("GET", `users/${small.uid}/inventory`)) ?? "").includes(item));
  }
  const k = await tradeWith(mid, small, "knife");
  bad("a knife still can not", k);
  // ...and dropped on the floor and given away too
  for (const [i, item] of ["gun", "rocket"].entries()) {
    await owner("PUT", `users/${mid.uid}/inventory`, inv({ item, qty: 1 }));
    await stand(mid, "lobby", 6, 6);
    ok(`a ${item} can be dropped`, await act(mid, "drop", { room: "lobby", slot: 0, x: 6 + i, y: 7, qty: 1 }));
    await owner("DELETE", `rooms/lobby/drops/${6 + i}_7`);
  }
  bad("a knife still can not be dropped", await (async () => { await owner("PUT", `users/${mid.uid}/inventory`, inv({ item: "knife", qty: 1 })); return act(mid, "drop", { room: "lobby", slot: 0, x: 8, y: 7, qty: 1 }); })());
}

console.log("--- a laced thing pays its giver the bounty of the one it kills");
{
  const giver = await fresh("t_ht_lg", { blood: 100 }), away = await fresh("t_ht_lo", { blood: 100 }), vic = await fresh("t_ht_lv", { blood: 5000 });
  const bounty = (id, amount) => owner("PUT", `hits/${id}`, { target: vic.uid, targetName: "t_ht_lv", amount, by: "someone", byName: "x", hideout: "x", hideoutName: "x", at: Date.now() - 5000 });
  const give = (items) => owner("PUT", `users/${vic.uid}/inventory`, inv(...items));
  const lighter = { item: "lighter", qty: 1 };
  await owner("PUT", `presence/${giver.uid}`, { name: "t_ht_lg", room: "lobby", seen: Date.now() });
  await owner("PUT", `presence/${away.uid}`, { name: "t_ht_lo", room: "lobby", seen: Date.now() - 600_000 });
  await act(vic, "sync"); await act(giver, "sync");
  await owner("DELETE", "hits");

  await bounty("lb1", 400); await give([{ item: "laced_joint", qty: 1, giver: giver.uid }, lighter]);
  const g0 = await bloodOf(giver);
  const d1 = await act(vic, "light", { slot: 0 });
  check("smoking a laced joint kills", d1.ok && d1.data?.kind === "fentdeath", JSON.stringify(d1));
  check("the bounty went to the one who gave it", d1.data?.bounty === 400 && (await bloodOf(giver)) === g0 + 400, JSON.stringify(d1.data));
  check("and it is off the board", !(await hits()).some((h) => h.id === "lb1"));

  await bounty("lb2", 500); await give([{ item: "laced_joint", qty: 1, giver: away.uid }, lighter]);
  const a0 = await bloodOf(away);
  const d2 = await act(vic, "light", { slot: 0 });
  check("a giver who is offline: it kills, but the bounty stays", d2.ok && d2.data?.bounty === undefined && (await bloodOf(away)) === a0 && (await hits()).some((h) => h.id === "lb2"), JSON.stringify(d2.data));

  await give([{ item: "laced_joint", qty: 1 }, lighter]);
  const d3 = await act(vic, "light", { slot: 0 });
  check("one they made themselves: the bounty stays", d3.ok && d3.data?.bounty === undefined && (await hits()).some((h) => h.id === "lb2"), JSON.stringify(d3.data));

  await give([{ item: "laced_joint", qty: 1, giver: vic.uid }, lighter]);
  const d4 = await act(vic, "light", { slot: 0 });
  check("their own name on it counts as made by themselves", d4.ok && d4.data?.bounty === undefined && (await hits()).some((h) => h.id === "lb2"), JSON.stringify(d4.data));

  const g1 = await bloodOf(giver);
  await give([{ item: "laced_pill", qty: 1, giver: giver.uid }]);
  const d5 = await act(vic, "consume", { slot: 0 });
  check("swallowing a laced pill pays the giver too", d5.ok && d5.data?.bounty === 500 && (await bloodOf(giver)) === g1 + 500, JSON.stringify(d5.data));

  await owner("DELETE", "hits");
  await give([{ item: "laced_joint", qty: 1, giver: giver.uid }, lighter]);
  const g2 = await bloodOf(giver);
  const d6 = await act(vic, "light", { slot: 0 });
  check("no bounty on them: nothing is paid", d6.ok && d6.data?.bounty === undefined && (await bloodOf(giver)) === g2, JSON.stringify(d6.data));

  // where the giver comes from: a trade, a gift, the floor
  await owner("PUT", `users/${vic.uid}/inventory`, {});
  const tradeLaced = async (a, b, item) => {
    const id = `tr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    await owner("PUT", `users/${a.uid}/inventory`, inv({ item, qty: 1 }));
    await owner("PUT", `users/${b.uid}/inventory`, {});
    await owner("PUT", `trades/${id}`, { a: a.uid, b: b.uid, status: "open", names: { [a.uid]: a.name, [b.uid]: b.name }, ready: { [a.uid]: true, [b.uid]: true }, confirm: { [a.uid]: true, [b.uid]: true }, offer: { [a.uid]: { blood: 0, items: { 0: { item, qty: 1 } } }, [b.uid]: { blood: 0, items: {} } } });
    return act(a, "tradeFinish", { id });
  };
  const tr = await tradeLaced(giver, vic, "laced_joint");
  ok("a laced joint is traded", tr);
  const got = Object.values((await owner("GET", `users/${vic.uid}/inventory`)) ?? {}).find((x) => x && x.item === "laced_joint");
  check("it remembers who traded it", got && got.giver === giver.uid, JSON.stringify(got));
  // dropped on the floor by one, picked up by another
  await owner("PUT", `users/${giver.uid}/inventory`, inv({ item: "laced_joint", qty: 1 })); await owner("PUT", `users/${vic.uid}/inventory`, {});
  await stand(giver, "lobby", 3, 3); await stand(vic, "lobby", 4, 3); await owner("DELETE", "rooms/lobby/drops/3_4");
  ok("the giver drops it", await act(giver, "drop", { room: "lobby", slot: 0, x: 3, y: 4, qty: 1 }));
  ok("the other picks it up", await act(vic, "pickup", { room: "lobby", key: "3_4" }));
  const got2 = Object.values((await owner("GET", `users/${vic.uid}/inventory`)) ?? {}).find((x) => x && x.item === "laced_joint");
  check("it remembers who dropped it", got2 && got2.giver === giver.uid, JSON.stringify(got2));
  await owner("DELETE", `rooms/lobby/players/${giver.uid}`); await owner("DELETE", `rooms/lobby/players/${vic.uid}`);
  await owner("DELETE", "hits");
}

console.log("--- putting a hit on somebody");
const place = (u, target, amount, room = HR) => act(u, "hitPlace", { room, target: target.uid, amount });
bad("only a member of the hideout", await place(stranger, rich, 500));
bad("not under 300", await place(host, rich, 299));
bad("not over 1500", await place(host, rich, 1501));
bad("not on yourself", await place(host, host, 500));
bad("not on nobody", await act(host, "hitPlace", { room: HR, target: "nobody12345", amount: 500 }));
bad("not on an admin (they are protected)", await place(host, guard, 500));
bad("not without the blood", await place(await (async () => { await owner("PUT", `users/${poor.uid}/blood`, 100); return poor; })(), rich, 500));
const h1 = await place(host, rich, 600);
ok("the owner puts 600 on the rich one", h1);
check("their blood is 4400", (await bloodOf(host)) === 4400);
let list = await hits();
check("the hit is open for everybody to read", list.length === 1 && list[0].target === rich.uid && list[0].amount === 600 && list[0].targetName === "t_ht_rich" && list[0].hideoutName === "The Syndicate", JSON.stringify(list));
check("the target can see who did it (the revenge button)", Object.values((await owner("GET", `hitRevenge/${rich.uid}`)) ?? {}).some((r) => r.by === host.uid && r.amount === 600), JSON.stringify(await owner("GET", `hitRevenge/${rich.uid}`)));
check("only the target reads it", (await fetch(`${DB}/hitRevenge/${rich.uid}.json?ns=${NS}&auth=${stranger.token}`)).status >= 400);
bad("one hit per hideout per 2 hours", await place(mem, mid, 500));
await owner("PUT", `hitCool/${host.uid}`, Date.now() - 3 * 3_600_000);
ok("2 hours later the hideout can again (a member)", await place(mem, rich, 1500));
list = await hits();
check("two hits on the rich one", list.filter((h) => h.target === rich.uid).length === 2);
await owner("PUT", `hitCool/${host.uid}`, Date.now() - 3 * 3_600_000);
const now = Date.now();
await owner("PUT", `hitLog/${mid.uid}`, { a: now - 1000, b: now - 2000, c: now - 3000 });
bad("a player can be hit 3 times a day, not more", await place(host, mid, 500));
await owner("PUT", `hitLog/${mid.uid}`, { a: now - 25 * 3_600_000, b: now - 26 * 3_600_000, c: now - 27 * 3_600_000 });
ok("but the old ones don't count", await place(host, mid, 700));
check("the readers see them, nobody writes them", (await fetch(`${DB}/hits.json?ns=${NS}&auth=${stranger.token}`)).status === 200 && (await fetch(`${DB}/hits/x.json?ns=${NS}&auth=${stranger.token}`, { method: "PUT", body: JSON.stringify({ amount: 1 }) })).status >= 400);

console.log("--- the gun");
await owner("PUT", "bagmand/force", 1);
await stand(stranger, "lobby", 3, 3);
await owner("PUT", `users/${stranger.uid}/blood`, 1000);
await owner("DELETE", `bagmand/${Math.floor(Date.now() / 3_600_000) * 3_600_000}/sold/gun`);
const buy = await act(stranger, "bagmandBuy", { item: "gun", qty: 1 });
if (!buy.ok && /here|stand|near|far/i.test(buy.error ?? "")) console.log("   (bagmand: " + buy.error + ")");
check("bagmand sells a gun for 250", buy.ok && (await bloodOf(stranger)) === 750, JSON.stringify(buy).slice(0, 200));
check("and it is in their pocket", buy.ok && hasItem((await act(stranger, "sync")).state, "gun"));
if (buy.ok) bad("only one per player per visit", await act(stranger, "bagmandBuy", { item: "gun", qty: 1 }));
await owner("DELETE", "bagmand/force");
await owner("PUT", `users/${stranger.uid}/inventory`, {});
await owner("DELETE", `rooms/lobby/players/${stranger.uid}`);

console.log("--- shooting");
const shoot = (target, slot) => act(shooter, "gunShoot", { room: "lobby", target: target.uid, ...(slot !== undefined ? { slot } : {}) });
await clearHits();
await owner("PUT", "hits/hm", { target: mid.uid, targetName: "t_ht_mid", amount: 700, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 9000 });
await owner("PUT", `users/${shooter.uid}/inventory`, {});
bad("no gun, no shot", await shoot(rich));
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 1 }));
bad("not yourself", await act(shooter, "gunShoot", { room: "lobby", target: shooter.uid }));
bad("not an admin", await act(shooter, "gunShoot", { room: "lobby", target: guard.uid }));
await stand(guard, "lobby", 5, 6);
bad("an admin is protected", await shoot(guard));
await owner("DELETE", `rooms/lobby/players/${guard.uid}`);
bad("somebody who isn't here", await shoot(stranger));
{ // somebody in a chair at the roulette table can not be shot (and neither can a player in a game)
  await owner("PUT", `rooms/lobby/players/${rich.uid}`, { name: rich.name, figure: "x", x: 0, y: 15, dir: 4, sit: true });
  const r1 = await shoot(rich);
  check("not in the roulette chair", r1.ok === false && /roulette/i.test(r1.error ?? ""), JSON.stringify(r1));
  await stand(rich, "lobby", 5, 5);
  await owner("PUT", "rooms/lobby/roulette", { status: "playing", stake: 50, a: { uid: rich.uid, name: rich.name, seat: 0 }, b: { uid: "someoneelse", name: "x", seat: 1 }, at: Date.now(), shots: 0, seq: 1 });
  const r2 = await shoot(rich);
  check("nor in a roulette game", r2.ok === false && /roulette/i.test(r2.error ?? ""), JSON.stringify(r2));
  await owner("DELETE", "rooms/lobby/roulette");
}
await stand(small, "lobby", 5, 20);
bad("too far away", await shoot(small));
await stand(small, "lobby", 5, 6);
check("the gun is still there after refusals", hasItem((await act(shooter, "sync")).state, "gun"));

// no bounty: no shot (and the gun is kept)
await owner("DELETE", `sendHome/${small.uid}`);
const s0 = await shoot(small);
check("somebody with no bounty can't be shot", s0.ok === false && /bounty/i.test(s0.error ?? ""), JSON.stringify(s0));
check("the gun is kept", hasItem((await act(shooter, "sync")).state, "gun"));
check("and they were not touched", (await bloodOf(small)) === 400 && (await owner("GET", `sendHome/${small.uid}`)) === null);
// with the smallest bounty (300) they can: 20 drop (they have 400) and two minutes down
await owner("PUT", "hits/hs", { target: small.uid, targetName: "t_ht_small", amount: 300, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 3000 });
const s1 = await shoot(small);
ok("shoot somebody with a bounty", s1);
check("they drop 20 and are dead for two minutes, the bounty is claimed", s1.data?.dropped === 20 && s1.data?.secs === 120 && s1.data?.bounty === 300, JSON.stringify(s1.data));
check("their blood is 380", (await bloodOf(small)) === 380);
const sh = await owner("GET", `sendHome/${small.uid}`);
check("they are sent down: shot, two minutes", sh && sh.shot === true && sh.secs === 120 && sh.lost === 20 && sh.byName === "t_ht_shooter", JSON.stringify(sh));
check("the gun is gone", !hasItem((await act(shooter, "sync")).state, "gun"));
const drops = Object.values((await owner("GET", "rooms/lobby/drops")) ?? {}).filter((d) => d.item === "blood" && d.by === small.uid && d.qty === 20);
check("their blood lies on the floor", drops.length >= 1);
const evs = Object.values((await owner("GET", "rooms/lobby/events")) ?? {}).filter((e) => e.type === "shot" && e.to === small.uid && e.from === shooter.uid);
check("everybody in the room is told (a shot event)", evs.length >= 1);
bad("a second shot needs a second gun (and a second bounty)", await shoot(small));

// over 1000 and over 5000 with no bounty
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 3 }));
const s2 = await shoot(mid);
check("over 1000 blood and no bounty: 10 drop... but mid has a hit on them", s2.ok);
// mid has a hit of 700 placed above: it was a bounty shot
check("a bounty of 700 is claimed", s2.data?.bounty === 700 && s2.data?.secs === 120 && s2.data?.dropped === 100, JSON.stringify(s2.data));
check("the shooter got the 700 (on top of the 300 from before)", (await bloodOf(shooter)) === 1100, String(await bloodOf(shooter)));
check("the hit is gone", !(await hits()).some((h) => h.target === mid.uid));
check("the gun count went down one (3 -> 2)", (await act(shooter, "sync")).state.inventory.find((x) => x && x.item === "gun")?.qty === 2);

// the biggest bounty first; 7000 blood: 200 drop
await owner("PUT", "hits/ha", { target: rich.uid, targetName: "t_ht_rich", amount: 500, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 5000 });
await owner("PUT", "hits/hb", { target: rich.uid, targetName: "t_ht_rich", amount: 1300, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 4000 });
const rBefore = await bloodOf(rich), shBefore = await bloodOf(shooter);
const s3 = await shoot(rich);
ok("shoot the rich one (two hits on them)", s3);
check("the biggest, 1300, is claimed; they drop 200 and are dead two minutes", s3.data?.bounty === 1300 && s3.data?.dropped === 200 && s3.data?.secs === 120, JSON.stringify(s3.data));
check("blood moves: the shooter +1300, the target -200", (await bloodOf(shooter)) === shBefore + 1300 && (await bloodOf(rich)) === rBefore - 200);
const left = (await hits()).filter((h) => h.target === rich.uid);
check("the smaller hit is still open (500) and so is one of the old ones", left.length >= 1 && left.some((h) => h.id === "ha"), JSON.stringify(left.map((h) => h.amount)));

// no bounty, however rich: no shot
await clearHits();
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 2 }));
await owner("PUT", `users/${rich.uid}/blood`, 7000);
const s4 = await shoot(rich);
check("a rich one with no bounty can't be shot", s4.ok === false && /bounty/i.test(s4.error ?? "") && (await bloodOf(rich)) === 7000, JSON.stringify(s4));
check("and the gun stays", hasItem((await act(shooter, "sync")).state, "gun"));

// nobody has less than they drop
await owner("PUT", `users/${small.uid}/blood`, 3);
await owner("PUT", "hits/hz", { target: small.uid, targetName: "t_ht_small", amount: 400, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 2000 });
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 1 }));
const s6 = await shoot(small);
check("with 3 blood they drop 3, not 20", s6.ok && s6.data.dropped === 3 && (await bloodOf(small)) === 0, JSON.stringify(s6.data));

console.log("--- blood is not made out of nothing");
await clearHits();
await owner("PUT", `users/${host.uid}/blood`, 5000); await owner("PUT", `hitCool/${host.uid}`, 0);
await owner("PUT", `users/${rich.uid}/blood`, 2000); await owner("DELETE", `hitLog/${rich.uid}`);
await owner("PUT", `users/${shooter.uid}/blood`, 100); await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 1 }));
await act(host, "hitPlace", { room: HR, target: rich.uid, amount: 1000 });
const before = (await bloodOf(host)) + (await bloodOf(shooter)) + (await bloodOf(rich)) + 1000; // (the 1000 is in the hit)
await shoot(rich);
const floor = Object.values((await owner("GET", "rooms/lobby/drops")) ?? {}).filter((d) => d.item === "blood" && d.by === rich.uid && d.qty === 100).length ? 100 : 0;
check("the blood that left the pockets lies on the floor", (await bloodOf(host)) + (await bloodOf(shooter)) + (await bloodOf(rich)) + floor === before, `${(await bloodOf(host)) + (await bloodOf(shooter)) + (await bloodOf(rich)) + floor} vs ${before}`);

console.log("--- the rocket launcher");
const alex = await fresh("t_ht_alex", { blood: 100, inventory: inv({ item: "rocket", qty: 1 }) });
await act(alex, "sync"); await owner("PUT", `users/${alex.uid}/inventory`, inv({ item: "rocket", qty: 1 }));
await owner("PUT", `users/${mid.uid}/blood`, 3000); await owner("DELETE", `rocketAt/${alex.uid}`);
await stand(alex, "lobby", 5, 5); await stand(mid, "lobby", 6, 5); await stand(guard, "lobby", 6, 6);
const rk = (who, target) => act(who, "rocketFire", { room: "lobby", target: target.uid });
bad("without a launcher it fails", await rk(shooter, mid));
bad("a protected player can't be hit", await rk(alex, guard));
const r1 = await rk(alex, mid);
check("the rocket: dead for 30 seconds", r1.ok && r1.data.secs === 30, JSON.stringify(r1));
const home = await owner("GET", `sendHome/${mid.uid}`);
check("they are sent home for 30 seconds, nothing dropped, marked as a rocket", home && home.rocket === true && home.secs === 30 && home.lost === 0, JSON.stringify(home));
check("their blood is untouched", (await bloodOf(mid)) === 3000);
const au = await owner("GET", `users/${alex.uid}`);
check("the launcher is not used up", hasItem({ inventory: Object.values(au.inventory ?? {}) }, "rocket"));
bad("it has to reload for 30 minutes", await rk(alex, mid));
await owner("PUT", `rocketAt/${alex.uid}`, Date.now() - 31 * 60_000);
ok("after 30 minutes it fires again", await rk(alex, mid));

console.log("--- a bad trip (psychedelics only)");
const tripper = await fresh("t_ht_tripper", { blood: 10 });
await act(tripper, "sync");
await owner("PUT", `users/${tripper.uid}/inventory`, inv({ item: "lsd", qty: 1 }, { item: "heroin", qty: 1 }, { item: "shroom", qty: 1 }, { item: "twocb", qty: 1 }));
const c1 = await act(tripper, "consume", { slot: 0, badtrip: true });
check("lsd with the switch on: a bad trip", c1.ok && c1.data.badtrip === true, JSON.stringify(c1));
const c2 = await act(tripper, "consume", { slot: 0, badtrip: true });
check("heroin is not a psychedelic: never a bad trip", c2.ok && !c2.data.badtrip, JSON.stringify(c2));
const c3 = await act(tripper, "consume", { slot: 0, badtrip: true });
check("a shroom can give one", c3.ok && c3.data.badtrip === true, JSON.stringify(c3));
const c4 = await act(tripper, "consume", { slot: 0, badtrip: true });
check("2cb can give one", c4.ok && c4.data.badtrip === true, JSON.stringify(c4));
await owner("PUT", `users/${tripper.uid}/inventory`, Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, { item: "lsd", qty: 1 }])));
let bads = 0;
for (let i = 0; i < 20; i++) { const r = await act(tripper, "consume", { slot: 0 }); if (r.ok && r.data.badtrip) bads++; }
check(`without the switch it is only now and then (${bads} of 20)`, bads <= 10);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
