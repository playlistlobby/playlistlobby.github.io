// Local test only (the Firebase emulators + `npm run dev` in server/ must be running): puts two dummy players in the basement to shoot at, one with a bounty on his head and one without,
// and gives the tester (hbboss) some guns. They stay for 12 hours; when one is shot he is put back. node scripts/dummies.mjs [hours]
const DB = "http://127.0.0.1:9000", NS = "demo-hotel-default-rtdb", AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts";
const TESTER = "hbboss";
const hours = Number(process.argv[2] || 12);
const owner = async (m, p, b) => (await fetch(`${DB}/${p}.json?ns=${NS}`, { method: m, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: b === undefined ? undefined : JSON.stringify(b) })).json();
async function account(name) {
  const email = `${name}@users.bobba.invalid`;
  for (const mode of ["signUp", "signInWithPassword"]) {
    const r = await (await fetch(`${AUTH}:${mode}?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "secret1", returnSecureToken: true }) })).json();
    if (r.idToken) return r.localId;
  }
  throw new Error("auth " + name);
}
const tester = await owner("GET", `usernames/${TESTER}`);
if (!tester) throw new Error("no tester account called " + TESTER);
const guys = [
  { name: "dummy_dan", figure: "hr-115-42.hd-190-1.ch-3030-82.lg-3023-82.sh-3068-1408", x: 5, y: 9, bounty: 700 },
  { name: "plain_pete", figure: "hr-3163-45.hd-180-2.ch-215-1408.lg-285-91.sh-290-62", x: 7, y: 9, bounty: 0 },
];
for (const g of guys) {
  g.uid = await account(g.name);
  await owner("PUT", `users/${g.uid}`, { name: g.name, gender: "M", figure: g.figure, blood: 2000, createdAt: Date.now() });
  await owner("PUT", `profiles/${g.uid}`, { name: g.name, figure: g.figure });
  await owner("PUT", `usernames/${g.name}`, g.uid);
}
const t0 = Date.now();
let tick = 0;
while (Date.now() - t0 < hours * 3_600_000) {
  const hits = (await owner("GET", "hits")) ?? {};
  for (const g of guys) {
    const shot = await owner("GET", `sendHome/${g.uid}`); // (a real player lies down by themselves when they are shot: the dummies have no browser, so this does it for them)
    if (shot && typeof shot.at === "number" && shot.at !== g.lastShot) { g.lastShot = shot.at; g.downUntil = Date.now() + (shot.secs ?? 10) * 1000; }
    const down = Date.now() < (g.downUntil ?? 0);
    await owner("PUT", `rooms/lobby/players/${g.uid}`, { name: g.name, figure: g.figure, x: g.x, y: g.y, dir: 2, ts: Date.now(), ...(down ? { lay: true } : {}) });
    await owner("PUT", `presence/${g.uid}`, { name: g.name, room: "lobby", seen: Date.now(), sid: "dummy" + g.uid.slice(0, 5), since: t0 });
    if (g.bounty && !Object.values(hits).some((h) => h.target === g.uid)) { // a bounty again whenever the last one was collected
      await owner("PUT", `hits/dummy${g.name}${tick}`, { target: g.uid, targetName: g.name, amount: g.bounty, by: tester, byName: TESTER, hideout: tester, hideoutName: "The Test Syndicate", at: Date.now() });
    }
    if (Number(await owner("GET", `users/${g.uid}/blood`)) < 500) await owner("PUT", `users/${g.uid}/blood`, 2000);
  }
  // the tester always has guns to try
  const inv = (await owner("GET", `users/${tester}/inventory`)) ?? [];
  const list = Array.isArray(inv) ? inv : Object.values(inv);
  const have = list.reduce((n, s) => n + (s && s.item === "gun" ? s.qty : 0), 0);
  if (have < 3) { const spot = list.findIndex((s) => !s); const next = [...list]; if (spot >= 0) next[spot] = { item: "gun", qty: 10 }; else next.push({ item: "gun", qty: 10 }); await owner("PUT", `users/${tester}/inventory`, next); }
  tick++;
  await new Promise((r) => setTimeout(r, 4000));
}
