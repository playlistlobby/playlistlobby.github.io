// Hit and gun tests: putting a hit on somebody from a hideout (500-1500, once per 3 hours per hideout, 3 a day per person), the gun (bagmand sells two a visit), and shooting:
// a bounty is claimed, the one who is shot drops blood and is dead for a minute (10 seconds without a bounty), the gun is always spent
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

console.log("--- putting a hit on somebody");
const place = (u, target, amount, room = HR) => act(u, "hitPlace", { room, target: target.uid, amount });
bad("only a member of the hideout", await place(stranger, rich, 500));
bad("not under 500", await place(host, rich, 499));
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
bad("one hit per hideout per 3 hours", await place(mem, mid, 500));
await owner("PUT", `hitCool/${host.uid}`, Date.now() - 4 * 3_600_000);
ok("3 hours later the hideout can again (a member)", await place(mem, rich, 1500));
list = await hits();
check("two hits on the rich one", list.filter((h) => h.target === rich.uid).length === 2);
await owner("PUT", `hitCool/${host.uid}`, Date.now() - 4 * 3_600_000);
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
if (buy.ok) ok("a second gun is allowed", await act(stranger, "bagmandBuy", { item: "gun", qty: 1 }));
if (buy.ok) bad("only two per player per visit", await act(stranger, "bagmandBuy", { item: "gun", qty: 1 }));
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
await stand(small, "lobby", 5, 20);
bad("too far away", await shoot(small));
await stand(small, "lobby", 5, 6);
check("the gun is still there after refusals", hasItem((await act(shooter, "sync")).state, "gun"));

// no bounty: a little blood and 10 seconds
await owner("DELETE", `sendHome/${small.uid}`);
const s1 = await shoot(small);
ok("shoot somebody with no bounty", s1);
check("they drop 5 (a small purse) and are dead for 10 seconds", s1.data?.dropped === 5 && s1.data?.secs === 10 && s1.data?.bounty === 0, JSON.stringify(s1.data));
check("their blood is 395", (await bloodOf(small)) === 395);
const sh = await owner("GET", `sendHome/${small.uid}`);
check("they are sent down: shot, 10 seconds", sh && sh.shot === true && sh.secs === 10 && sh.lost === 5 && sh.byName === "t_ht_shooter", JSON.stringify(sh));
check("the gun is gone", !hasItem((await act(shooter, "sync")).state, "gun"));
const drops = Object.values((await owner("GET", "rooms/lobby/drops")) ?? {}).filter((d) => d.item === "blood" && d.by === small.uid && d.qty === 5);
check("their blood lies on the floor", drops.length >= 1);
const evs = Object.values((await owner("GET", "rooms/lobby/events")) ?? {}).filter((e) => e.type === "shot" && e.to === small.uid && e.from === shooter.uid);
check("everybody in the room is told (a shot event)", evs.length >= 1);
bad("a second shot needs a second gun", await shoot(small));

// over 1000 and over 5000 with no bounty
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 3 }));
const s2 = await shoot(mid);
check("over 1000 blood and no bounty: 10 drop... but mid has a hit on them", s2.ok);
// mid has a hit of 700 placed above: it was a bounty shot
check("a bounty of 700 is claimed", s2.data?.bounty === 700 && s2.data?.secs === 60 && s2.data?.dropped === 100, JSON.stringify(s2.data));
check("the shooter got the 700", (await bloodOf(shooter)) === 800, String(await bloodOf(shooter)));
check("the hit is gone", !(await hits()).some((h) => h.target === mid.uid));
check("the gun count went down one (3 -> 2)", (await act(shooter, "sync")).state.inventory.find((x) => x && x.item === "gun")?.qty === 2);

// the biggest bounty first; 7000 blood: 200 drop
await owner("PUT", "hits/ha", { target: rich.uid, targetName: "t_ht_rich", amount: 500, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 5000 });
await owner("PUT", "hits/hb", { target: rich.uid, targetName: "t_ht_rich", amount: 1300, by: host.uid, byName: "host", hideout: host.uid, hideoutName: "x", at: Date.now() - 4000 });
const rBefore = await bloodOf(rich), shBefore = await bloodOf(shooter);
const s3 = await shoot(rich);
ok("shoot the rich one (two hits on them)", s3);
check("the biggest, 1300, is claimed; they drop 200 and are dead a minute", s3.data?.bounty === 1300 && s3.data?.dropped === 200 && s3.data?.secs === 60, JSON.stringify(s3.data));
check("blood moves: the shooter +1300, the target -200", (await bloodOf(shooter)) === shBefore + 1300 && (await bloodOf(rich)) === rBefore - 200);
const left = (await hits()).filter((h) => h.target === rich.uid);
check("the smaller hit is still open (500) and so is one of the old ones", left.length >= 1 && left.some((h) => h.id === "ha"), JSON.stringify(left.map((h) => h.amount)));

// no bounty over 5000: 25, and over 1000: 10
await clearHits();
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 2 }));
await owner("PUT", `users/${rich.uid}/blood`, 7000);
const s4 = await shoot(rich);
check("over 5000 and no bounty: 25 drop, 10 seconds", s4.ok && s4.data.dropped === 25 && s4.data.secs === 10 && s4.data.bounty === 0, JSON.stringify(s4.data));
await owner("PUT", `users/${mid.uid}/blood`, 3000);
await stand(mid, "lobby", 5, 5);
const s5 = await shoot(mid);
check("over 1000 and no bounty: 10 drop", s5.ok && s5.data.dropped === 10 && s5.data.secs === 10, JSON.stringify(s5.data));

// nobody has less than they drop
await owner("PUT", `users/${small.uid}/blood`, 3);
await owner("PUT", `users/${shooter.uid}/inventory`, inv({ item: "gun", qty: 1 }));
const s6 = await shoot(small);
check("with 3 blood they drop 3, not 5", s6.ok && s6.data.dropped === 3 && (await bloodOf(small)) === 0, JSON.stringify(s6.data));

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

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
