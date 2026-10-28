// Local test only (the Firebase emulators + `npm run dev` in server/ must be running): sparring partners for the street fights.
//   node scripts/pvp-bot.mjs                 two bots stand on the sidewalk and fight back when you hit them
//   node scripts/pvp-bot.mjs --aggro         ... and the first one goes for you as soon as you come within 4 tiles
//   node scripts/pvp-bot.mjs --machete       ... both carry a machete instead of a knife
//   node scripts/pvp-bot.mjs --hours=2       how long they stay (default 12)
// They play by the same rules as a player: every swing and every bandage goes through the server's streetHit / streetHeal, so the fight is the real thing.
// When one is killed the pocket is wiped like for anybody; the bot gets its knife and bandages back and stands up again a few seconds later.
// The tester (hbboss) is given a knife and a stack of bandages and a pass for the elevator.
if (process.env.DB_URL || process.env.TOKEN) throw new Error("This script is for the local emulators only (it never talks to the real database).");
const DB = "http://127.0.0.1:9000", NS = "demo-hotel-default-rtdb", AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts", API = "http://127.0.0.1:8787";
const TESTER = "hbboss";
const args = process.argv.slice(2);
const aggro = args.includes("--aggro");
const weapon = args.includes("--machete") ? "machete" : "knife";
const hours = Number((args.find((a) => a.startsWith("--hours=")) ?? "--hours=12").split("=")[1]);
const owner = async (m, p, b) => (await fetch(`${DB}/${p}.json?ns=${NS}`, { method: m, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: b === undefined ? undefined : JSON.stringify(b) })).json();
async function account(name) {
  const email = `${name}@users.bobba.invalid`;
  for (const mode of ["signUp", "signInWithPassword"]) {
    const r = await (await fetch(`${AUTH}:${mode}?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "secret1", returnSecureToken: true }) })).json();
    if (r.idToken) return { uid: r.localId, token: r.idToken, name };
  }
  throw new Error("auth " + name);
}
const act = async (who, a, body = {}) => {
  const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args: body }) });
  return r.json().catch(() => ({ ok: false }));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const testerUid = await owner("GET", `usernames/${TESTER}`);
if (!testerUid) throw new Error("no tester account called " + TESTER + " (log in once on the local site first)");

// the tester: a knife, bandages, and the elevator pass
{
  const inv = (await owner("GET", `users/${testerUid}/inventory`)) ?? [];
  const list = Array.isArray(inv) ? [...inv] : Object.values(inv);
  const put = (item, qty) => {
    const have = list.findIndex((s) => s && s.item === item);
    if (have >= 0) { list[have] = { ...list[have], qty: Math.max(list[have].qty, qty) }; return; }
    const spot = list.findIndex((s) => !s);
    if (spot >= 0) list[spot] = { item, qty }; else list.push({ item, qty });
  };
  put("knife", 1); put("bandage", 20);
  await owner("PUT", `users/${testerUid}/inventory`, list);
  await owner("PUT", `streetPass/${testerUid}`, Date.now() + hours * 3_600_000);
}

const FIGURES = ["hr-115-42.hd-190-1.ch-3030-82.lg-3023-82.sh-3068-1408", "hr-3163-45.hd-180-2.ch-215-1408.lg-285-91.sh-290-62"];
const bots = [{ name: "spar_sam", x: 4, y: 9, aggro }, { name: "spar_tess", x: 25, y: 9, aggro: false }];
for (const [i, b] of bots.entries()) {
  Object.assign(b, await account(b.name));
  b.figure = FIGURES[i];
  b.home = { x: b.x, y: b.y };
  await owner("PUT", `users/${b.uid}`, { name: b.name, gender: i ? "F" : "M", figure: b.figure, blood: 500, createdAt: Date.now() - 3_600_000, inventory: kit() });
  await owner("PUT", `profiles/${b.uid}`, { name: b.name, figure: b.figure });
  await owner("PUT", `usernames/${b.name}`, b.uid);
  await owner("DELETE", `streetCombat/${b.uid}`); await owner("DELETE", `streetSwing/${b.uid}`);
}
function kit() { return { 0: { item: weapon, qty: 1 }, 1: { item: "bandage", qty: 12 } }; }
console.log(`sparring bots on the street for ${hours} h (${weapon}${aggro ? ", aggressive" : ""}). Go up in the elevator (or /test1) and click one of them: spar_sam, spar_tess. Ctrl-C to stop.`);

const t0 = Date.now();
let tick = 0;
while (Date.now() - t0 < hours * 3_600_000) {
  const now = Date.now();
  const tester = await owner("GET", `rooms/streets/players/${testerUid}`); // (the tester, if they are on the street)
  for (const b of bots) {
    if (tick % 600 === 0) Object.assign(b, await account(b.name)); // (a fresh token about every ten minutes)
    const row = await owner("GET", `rooms/streets/players/${b.uid}`);
    const cb = (await owner("GET", `streetCombat/${b.uid}`)) ?? {};
    // dead: a few seconds on the ground, then up again at home with the pocket refilled
    if (cb.deadAt && cb.deadAt > (b.revivedAt ?? 0)) {
      if (now - cb.deadAt < 4000) { await owner("PUT", `rooms/streets/players/${b.uid}`, { ...(row ?? {}), name: b.name, figure: b.figure, x: b.home.x, y: b.home.y, dir: 2, ts: now, lay: true }); continue; }
      b.revivedAt = now; b.x = b.home.x; b.y = b.home.y; b.foe = null;
      await owner("PUT", `users/${b.uid}/inventory`, kit());
      console.log(b.name, "was killed by", cb.deadBy === testerUid ? TESTER : cb.deadBy, "and stands up again");
    }
    if (!row || tick % 3 === 0) {
      await owner("PUT", `rooms/streets/players/${b.uid}`, { name: b.name, figure: b.figure, x: b.x, y: b.y, dir: 2, ts: now });
      await owner("PUT", `presence/${b.uid}`, { name: b.name, room: "streets", seen: now, sid: "bot" + b.uid.slice(0, 5), since: t0 });
    }
    const inFight = Number(cb.combatUntil) > now && cb.foe;
    let foe = null;
    if (inFight) foe = cb.foe;
    else if (b.aggro && tester && Math.max(Math.abs(tester.x - b.x), Math.abs(tester.y - b.y)) <= 4) foe = testerUid;
    if (!foe) continue;
    const fr = foe === testerUid ? tester : await owner("GET", `rooms/streets/players/${foe}`);
    if (!fr) continue;
    // walk up to the other one (a step a round), then swing
    const dx = Math.sign(fr.x - b.x), dy = Math.sign(fr.y - b.y);
    const dist = Math.max(Math.abs(fr.x - b.x), Math.abs(fr.y - b.y));
    if (dist > 1) { b.x += dx; b.y += dy; await owner("PATCH", `rooms/streets/players/${b.uid}`, { x: b.x, y: b.y, dir: dx > 0 ? 2 : 6, ts: now }); continue; }
    const hp = Math.min(10, (cb.hp ?? 10) + Math.floor(Math.max(0, now - (cb.at ?? now)) / 20_000));
    if (hp <= 3) { const r = await act(b, "streetHeal", { slot: 1 }); if (r.ok) { console.log(b.name, "uses a bandage"); continue; } }
    const r = await act(b, "streetHit", { target: foe });
    if (r.ok) console.log(b.name, r.data.dmg ? `hits for ${r.data.dmg}` : "misses", r.data.died ? "and kills them" : `(they have ${r.data.left} left)`);
  }
  tick++;
  await sleep(700);
}
