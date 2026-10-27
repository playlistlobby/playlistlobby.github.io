// CD tests:  the Worker (wrangler dev, port 8787) against the Firebase emulators (auth 9099, database 9000).
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

console.log("--- CDs: the record player in the shop, paying, the album");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const checkout = async (who, product) => { const r = await fetch(`${API}/pay/checkout`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ product }) }); return { status: r.status, ...(await r.json()) }; };
  // the Freakme CD: 2 blood at the record player, once, no longer from 6ixty
  const f1 = await fresh("t_cd1", { blood: 9 });
  await act(f1, "sync");
  bad("not in the shop room", await act(f1, "buyRecord"));
  await stand(f1, "shop", 2, 6);
  const fr = await act(f1, "buyRecord");
  ok("buy the Freakme CD", fr);
  check("it costs 2 blood and is a CD", fr.state.blood === 7 && total(fr.state.inventory, "cd") === 1, String(fr.state.blood));
  bad("only one per player", await act(f1, "buyRecord"));
  bad("6ixty doesn't sell it any more", await act(f1, "buySixty", { item: "cd" }));
  // the Blodig oktober CD: 5 blood at the record player, once, a second CD apart from Freakme
  const bo = await act(f1, "buyRecord", { item: "cd_blodig" });
  ok("buy the kravle-blodig oktober CD", bo);
  check("it costs 5 blood (7 - 5 = 2) and is a CD", bo.state.blood === 2 && total(bo.state.inventory, "cd_blodig") === 1, String(bo.state.blood));
  bad("only one of those per player", await act(f1, "buyRecord", { item: "cd_blodig" }));
  bad("not a CD that isn't sold for blood", await act(f1, "buyRecord", { item: "cd_album" }));
  bad("6ixty doesn't sell it", await act(f1, "buySixty", { item: "cd_blodig" }));
  // the two players' songs: 5 blood each at the same record player, one of each per player
  await owner("PUT", `users/${f1.uid}/blood`, 12);
  const ly = await act(f1, "buyRecord", { item: "cd_lykk" });
  ok("buy leolegit - blodoktober", ly);
  check("it costs 5 blood and is a CD", ly.state.blood === 7 && total(ly.state.inventory, "cd_lykk") === 1, String(ly.state.blood));
  bad("only one of it per player", await act(f1, "buyRecord", { item: "cd_lykk" }));
  const ru = await act(f1, "buyRecord", { item: "cd_roulette" });
  ok("buy yungxware - russisk roulette", ru);
  check("it costs 5 blood too", ru.state.blood === 2 && total(ru.state.inventory, "cd_roulette") === 1, String(ru.state.blood));
  bad("only one of that per player", await act(f1, "buyRecord", { item: "cd_roulette" }));
  bad("6ixty doesn't sell them", await act(f1, "buySixty", { item: "cd_lykk" }));
  const poor = await fresh("t_cd1p", { blood: 4 });
  await act(poor, "sync"); await stand(poor, "shop", 2, 6);
  bad("4 blood isn't enough", await act(poor, "buyRecord", { item: "cd_blodig" }));
  // real money: three mystery CDs, never the same colour twice
  const m = await fresh("t_cd2");
  await act(m, "sync");
  check("no login: no checkout", (await fetch(`${API}/pay/checkout`, { method: "POST", body: "{}" })).status === 401);
  const colours = new Set();
  for (let i = 0; i < 3; i++) {
    const co = await checkout(m, "mystery");
    check(`mystery checkout ${i + 1} works`, co.ok === true && typeof co.url === "string", JSON.stringify(co));
    const cl = await act(m, "claimPurchases");
    ok(`claim ${i + 1}`, cl);
    check(`one new mystery CD (${i + 1})`, cl.data.items.length === 1 && /^cd_(yellow|green|blue)$/.test(cl.data.items[0]) && !colours.has(cl.data.items[0]), JSON.stringify(cl.data));
    colours.add(cl.data.items[0]);
    if (i === 2) check("all three colours", colours.size === 3 && cl.state.owned.item_cd_yellow && cl.state.owned.item_cd_green && cl.state.owned.item_cd_blue, JSON.stringify(cl.state.owned));
  }
  const fourth = await checkout(m, "mystery");
  check("a fourth mystery CD can't be bought", fourth.ok === false && fourth.status === 400, JSON.stringify(fourth));
  // the full album is not sold any more: a new checkout is refused, but an old paid order still gets its album
  const al = await checkout(m, "album");
  check("the album can't be bought any more", al.ok === false && al.status === 400, JSON.stringify(al));
  const oldSid = `cs_old_${Date.now()}`;
  await owner("PUT", `purchases/${oldSid}`, { uid: m.uid, product: "album", amount: 500, status: "paid", at: Date.now(), session: oldSid });
  await owner("PUT", `userPurchases/${m.uid}/${oldSid}`, { product: "album", status: "paid", at: Date.now() });
  const alc = await act(m, "claimPurchases");
  check("an old paid album order still arrives", alc.data.items[0] === "cd_album" && total(alc.state.inventory, "cd_album") === 1, JSON.stringify(alc.data));
  bad("the paid CDs can't be dropped", await act(m, "drop", { slot: slotOf(alc.state, "cd_album"), qty: 1 }));
  // the webhook: only a signed message from Stripe marks a payment as paid
  const w = await fresh("t_cd3");
  await act(w, "sync");
  const sid = `cs_test_${Date.now()}`;
  await owner("PUT", `purchases/${sid}`, { uid: w.uid, product: "album", amount: 200, status: "open", at: Date.now(), session: sid });
  await owner("PUT", `userPurchases/${w.uid}/${sid}`, { product: "album", status: "open", at: Date.now() });
  const event = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: sid, payment_status: "paid", amount_total: 200, currency: "dkk" } } });
  const sign = (body, secret, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
  const hook = (body, sig) => fetch(`${API}/pay/webhook`, { method: "POST", headers: sig ? { "stripe-signature": sig } : {}, body });
  check("no signature: refused", (await hook(event, null)).status === 400);
  check("a wrong secret: refused", (await hook(event, sign(event, "whsec_not_ours"))).status === 400);
  check("an old signature: refused", (await hook(event, sign(event, "whsec_local_test_secret", Math.floor(Date.now() / 1000) - 3600))).status === 400);
  check("still unpaid after all that", (await owner("GET", `purchases/${sid}/status`)) === "open" && (await act(w, "claimPurchases")).data.items.length === 0);
  check("a signed message: accepted", (await hook(event, sign(event, "whsec_local_test_secret"))).status === 200);
  check("the payment is marked paid", (await owner("GET", `purchases/${sid}/status`)) === "paid");
  const wc = await act(w, "claimPurchases");
  check("and now the album arrives", wc.data.items[0] === "cd_album", JSON.stringify(wc.data));
  check("the purchase is closed", (await owner("GET", `purchases/${sid}/status`)) === "claimed" && (await act(w, "claimPurchases")).data.items.length === 0);
  // a payment of the wrong amount is not believed
  const sid2 = `cs_test_wrong_${Date.now()}`;
  const w2 = await fresh("t_cd4");
  await act(w2, "sync");
  await owner("PUT", `purchases/${sid2}`, { uid: w2.uid, product: "album", amount: 200, status: "open", at: Date.now(), session: sid2 });
  await owner("PUT", `userPurchases/${w2.uid}/${sid2}`, { product: "album", status: "open", at: Date.now() });
  const bent = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: sid2, payment_status: "paid", amount_total: 1, currency: "dkk" } } });
  await hook(bent, sign(bent, "whsec_local_test_secret"));
  check("a payment of the wrong amount is held back", (await owner("GET", `purchases/${sid2}/status`)) === "stuck" && (await act(w2, "claimPurchases")).data.items.length === 0);
  // using the CDs: a mystery CD plays one song, the album plays on and can skip
  const room = `u_${m.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: m.uid, ownerName: "t_cd2", name: "t_cd2's room", access: "knock", w: 8, h: 8 });
  await stand(m, room, 4, 4);
  const ys = (await state(m)).inventory.findIndex((x) => x && /^cd_(yellow|green|blue)$/.test(x.item));
  ok("a mystery CD in the boombox", await act(m, "cdInsert", { slot: ys, room, durationMs: 100_000 }));
  const st1 = await owner("GET", `rooms/${room}/cdplayer`);
  check("it plays its own song", ["ahmingud", "blodig-oktober", "blod-ud-af-naesen"].includes(st1.track) && st1.index === undefined, JSON.stringify(st1));
  bad("it has no songs to skip", await act(m, "cdControl", { room, op: "next", from: 0, durationMs: 90_000 }));
  ok("eject", await act(m, "cdControl", { room, op: "eject" }));
  const albumSlot = (await state(m)).inventory.findIndex((x) => x && x.item === "cd_album");
  ok("the album in the boombox", await act(m, "cdInsert", { slot: albumSlot, room, durationMs: 120_000 }));
  const a0 = await owner("GET", `rooms/${room}/cdplayer`);
  check("it starts with the first song", a0.track === "album" && a0.index === 0 && a0.title === "02!11 på en blodig søndag", JSON.stringify(a0));
  ok("skip to the next song", await act(m, "cdControl", { room, op: "next", from: 0, durationMs: 137_000 }));
  const a1 = await owner("GET", `rooms/${room}/cdplayer`);
  check("the second song, with its own length", a1.index === 1 && a1.title === "200mg" && a1.durationMs === 137_000, JSON.stringify(a1));
  ok("pressing it twice in a row does nothing the second time", await act(m, "cdControl", { room, op: "next", from: 0, durationMs: 100_000 }));
  check("still the second song", (await owner("GET", `rooms/${room}/cdplayer/index`)) === 1);
  ok("back to the first song", await act(m, "cdControl", { room, op: "prev", from: 1, durationMs: 120_000 }));
  check("the first song again", (await owner("GET", `rooms/${room}/cdplayer/index`)) === 0);
  bad("advance only when the song is over", await act(m, "cdControl", { room, op: "advance", from: 0, durationMs: 100_000 }));
  await owner("PATCH", `rooms/${room}/cdplayer`, { startedAt: Date.now() - 119_000, endsAt: Date.now() + 500 });
  ok("the song is nearly over: the album moves on by itself", await act(m, "cdControl", { room, op: "advance", from: 0, durationMs: 137_000 }));
  check("the second song is on", (await owner("GET", `rooms/${room}/cdplayer/index`)) === 1);
  ok("eject the album", await act(m, "cdControl", { room, op: "eject" }));
  const back = await state(m);
  check("the CD is back in the pocket", total(back.inventory, "cd_album") === 1 && !back.inventory.some((x) => x && x.inPlayer));
}

console.log("--- hash, hash mix and the hash joint");
{
  const slotOf = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
  const h = await fresh("t_hash", { inventory: { 0: { item: "weed", qty: 2, ass: true }, 1: { item: "kodimagnyl", qty: 1 }, 2: { item: "cigarette", qty: 2 }, 3: { item: "jointpaper", qty: 2 }, 4: { item: "bluntwrap", qty: 1 }, 5: { item: "lighter", qty: 1 }, 6: { item: "weed", qty: 1 } } });
  await act(h, "sync");
  const room = `u_${h.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: h.uid, ownerName: "t_hash", name: "t_hash's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(h, room, 4, 4);
  const mixOnce = async (fid, aItem, aAss, bItem) => {
    const st = await state(h);
    const r = await act(h, "mix", { fid, a: slotOf(st, aItem, aAss), b: slotOf(st, bItem, false) });
    await owner("PATCH", `roomsMeta/${room}/furni/${fid}/mixJob`, { doneAt: Date.now() - 1000 });
    return r.ok ? await act(h, "mixCollect", { fid }) : r;
  };
  bad("good weed and kodimagnyl is not hash", await (async () => { const st = await state(h); return act(h, "mix", { fid: "mx", a: slotOf(st, "weed", false), b: slotOf(st, "kodimagnyl", false) }); })());
  const hs = await mixOnce("mx", "weed", true, "kodimagnyl");
  ok("ass weed + kodimagnyl in the mixer", hs);
  check("1 hash", total(hs.state.inventory, "hash") === 1 && total(hs.state.inventory, "kodimagnyl") === 0, JSON.stringify(hs.data));
  const hm = await mixOnce("mx", "hash", false, "cigarette");
  ok("hash + cigarette in the mixer", hm);
  check("2 hash mix", total(hm.state.inventory, "hashmix") === 2 && total(hm.state.inventory, "hash") === 0, JSON.stringify(hm.data));
  const st = await state(h);
  bad("hash mix can't go in a blunt", await act(h, "combine", { a: slotOf(st, "hashmix", false), b: slotOf(st, "bluntwrap", false) }));
  const hj = await act(h, "combine", { a: slotOf(st, "hashmix", false), b: slotOf(st, "jointpaper", false) });
  ok("hash mix + joint paper", hj);
  check("a hash joint", total(hj.state.inventory, "joint_hash") === 1 && total(hj.state.inventory, "hashmix") === 1, JSON.stringify(hj.data));
  const lit = await act(h, "light", { slot: slotOf(hj.state, "joint_hash", false) });
  ok("light the hash joint", lit);
  const litSlot = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${h.uid}/inventory/${litSlot}`, { lit: Date.now() - 70_000 });
  const fin = await act(h, "finishSmoke", { slot: litSlot });
  ok("smoke it to the end", fin);
  check("stabs give 3x for 2 minutes", fin.state.boostMult === 3 && fin.state.boostUntil - Date.now() > 110_000 && fin.state.boostUntil - Date.now() <= 121_000, JSON.stringify([fin.state.boostMult, fin.state.boostUntil - Date.now()]));
}

console.log("--- cigarette butts to 6ixty");
{
  const b = await fresh("t_butts", { inventory: { 0: { item: "cigbutt", qty: 5 }, 1: { item: "cigbutt", qty: 1 } } });
  await act(b, "sync");
  const st = await state(b);
  check("the butts share a slot", total(st.inventory, "cigbutt") === 6 && st.inventory.filter((x) => x && x.item === "cigbutt").length === 1, JSON.stringify(st.inventory.filter(Boolean)));
  const slot = st.inventory.findIndex((x) => x && x.item === "cigbutt");
  bad("one butt on its own isn't enough", await act(b, "sellWeed", { slot, qty: 1 }));
  const s1 = await act(b, "sellWeed", { slot, qty: 2 });
  ok("sell two butts", s1);
  check("1 drop for 2 butts", s1.state.blood === 1 && total(s1.state.inventory, "cigbutt") === 4, String(s1.state.blood));
  const s2 = await act(b, "sellWeed", { slot, qty: 99 });
  ok("sell all the rest", s2);
  check("4 butts: 2 more drops", s2.state.blood === 3 && total(s2.state.inventory, "cigbutt") === 0, String(s2.state.blood));
  const odd = await fresh("t_butts2", { inventory: { 0: { item: "cigbutt", qty: 3 } } });
  await act(odd, "sync");
  const so = await act(odd, "sellWeed", { slot: 0, qty: 3 });
  check("an odd one stays: 3 butts sell as 2", so.ok === true && so.state.blood === 1 && total(so.state.inventory, "cigbutt") === 1, JSON.stringify(so.state));
}

console.log("--- shrooms take 25 minutes");
{
  const g = await fresh("t_grow25");
  await act(g, "sync");
  const room = `u_${g.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: g.uid, ownerName: "t_grow25", name: "x", access: "knock", w: 8, h: 8, furni: { ks: { kind: "f_planter", x: 2, y: 2, crop: "shroom" }, kw: { kind: "f_planter", x: 4, y: 2 } } });
  await stand(g, room, 4, 4);
  await owner("PATCH", `roomsMeta/${room}/furni/ks`, { plantedAt: Date.now() - 22 * 60_000, wateredAt: Date.now() - 20 * 60_000 });
  await owner("PATCH", `roomsMeta/${room}/furni/kw`, { plantedAt: Date.now() - 22 * 60_000, wateredAt: Date.now() - 20 * 60_000 });
  bad("shrooms aren't ready after 22 minutes", await act(g, "harvest", { fid: "ks" }));
  ok("but weed is", await act(g, "harvest", { fid: "kw" }));
  await owner("PATCH", `roomsMeta/${room}/furni/ks`, { plantedAt: Date.now() - 26 * 60_000 });
  ok("shrooms are ready after 25", await act(g, "harvest", { fid: "ks" }));
}

console.log("--- harvesting: a 25% chance of a seed (or spores) back");
{
  const g = await fresh("t_seedback");
  await act(g, "sync");
  const room = `u_${g.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: g.uid, ownerName: "t_seedback", name: "t_seedback's room", access: "knock", w: 8, h: 8, furni: { kw: { kind: "f_planter", x: 2, y: 2 }, ks: { kind: "f_planter", x: 4, y: 2 } } });
  await stand(g, room, 4, 4);
  const total2 = async (item) => total((await state(g)).inventory, item);
  const grown = { plantedAt: Date.now() - 25 * 60_000, wateredAt: Date.now() - 10 * 60_000 };
  let weedBack = 0, sporeBack = 0;
  const N = 40;
  for (let i = 0; i < N; i++) {
    await owner("PATCH", `roomsMeta/${room}/furni/kw`, grown);
    const r = await act(g, "harvest", { fid: "kw" });
    if (r.data.seed === "weedseed") weedBack++;
    await owner("PATCH", `roomsMeta/${room}/furni/ks`, { ...grown, crop: "shroom" });
    const r2 = await act(g, "harvest", { fid: "ks" });
    if (r2.data.seed === "shroomspore") sporeBack++;
  }
  check(`weed: some gave a seed back, about 1 in 8 (${weedBack} of ${N})`, weedBack >= 1 && weedBack <= 16, String(weedBack));
  check(`shrooms: some gave spores back, about 1 in 8 (${sporeBack} of ${N})`, sporeBack >= 1 && sporeBack <= 16, String(sporeBack));
  check("the seeds and spores really are in the pocket", (await total2("weedseed")) === weedBack && (await total2("shroomspore")) === sporeBack);
}

console.log("--- posters");
{
  // a PNG header is all the server looks at: the signature and a 37 x 48 size
  const png = (w, h) => {
    const b = Buffer.alloc(8 + 4 + 4 + 13 + 4);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b, 0);
    b.writeUInt32BE(13, 8); b.write("IHDR", 12); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); b[24] = 8; b[25] = 6;
    return "data:image/png;base64," + b.toString("base64");
  };
  const p = await fresh("t_poster", { blood: 100 });
  await act(p, "sync");
  bad("a poster is bought in the shop room", await act(p, "buyPoster"));
  await stand(p, "shop", 9, 4);
  const buy = await act(p, "buyPoster");
  ok("buy a poster", buy);
  check("75 blood, one poster", buy.state.blood === 25 && total(buy.state.inventory, "f_poster") === 1, String(buy.state.blood));
  const room = `u_${p.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: p.uid, ownerName: "t_poster", name: "t_poster's room", access: "knock", w: 8, h: 8 });
  await stand(p, room, 4, 4);
  const slot = buy.state.inventory.findIndex((x) => x && x.item === "f_poster");
  bad("not in the middle of the room", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 4, dir: 0, img: png(25, 38) }));
  bad("not on the floor of the back wall facing the wrong way", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 2, img: png(25, 38) }));
  bad("a picture that isn't a PNG", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 4, img: "data:image/png;base64,AAAA" }));
  bad("a picture of the wrong size", await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 4, img: png(500, 500) }));
  bad("a picture on something that isn't a poster", await act(p, "furniPlace", { source: "inv", slot: buy.state.inventory.findIndex((x) => x && x.item === "f_poster") + 0, x: 4, y: 0, dir: 4, img: "http://example.com/x.png" }));
  const hang = await act(p, "furniPlace", { source: "inv", slot, x: 4, y: 0, dir: 4, img: png(25, 38) });
  ok("hang the poster on the back wall", hang);
  const rows = await owner("GET", `roomsMeta/${room}/furni`);
  const [fid, row] = Object.entries(rows ?? {}).find(([, r]) => r.kind === "f_poster") ?? [];
  check("it hangs there with its picture", !!row && row.x === 4 && row.y === 0 && row.dir === 4 && typeof row.img === "string" && row.img.length > 40, JSON.stringify(row).slice(0, 120));
  ok("move it along the wall", await act(p, "furniMove", { id: fid, x: 2, y: 0, dir: 4 }));
  ok("round the corner to the left wall", await act(p, "furniMove", { id: fid, x: 0, y: 3, dir: 2 }));
  bad("not into the room", await act(p, "furniMove", { id: fid, x: 3, y: 3, dir: 0 }));
  check("the picture stayed on it", typeof (await owner("GET", `roomsMeta/${room}/furni/${fid}/img`)) === "string");
  const st = await act(p, "furniStore", { id: fid });
  ok("take it down (into the toolbox)", st);
  check("it is back as a plain poster", st.state.storage.f_poster === 1 && (await owner("GET", `roomsMeta/${room}/furni/${fid}`)) === null);
  const again = await act(p, "furniPlace", { source: "storage", kind: "f_poster", x: 6, y: 0, dir: 4 });
  ok("hang it again with no picture: it shows the ?", again);
  const sell = await fresh("t_poster2", { inventory: { 0: { item: "f_poster", qty: 1 } } });
  await act(sell, "sync");
  const so = await act(sell, "sellWeed", { slot: 0, qty: 1 });
  check("6ixty pays 75% of 75 for a poster: 56", so.ok === true && so.state.blood === 56, JSON.stringify(so.state && so.state.blood));
}

console.log("--- the decorator power: furniture in other people's rooms");
{
  const owner1 = await fresh("t_dec_owner");
  await act(owner1, "sync");
  const room = `u_${owner1.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: owner1.uid, ownerName: "t_dec_owner", name: "t_dec_owner's room", access: "open", w: 8, h: 8, furni: { theirs: { kind: "f_sofa", x: 5, y: 5 } } });
  await owner("PUT", `rooms/${room}/players/${owner1.uid}`, { name: "t_dec_owner", figure: "x", x: 1, y: 6, dir: 2 });
  const png = () => { const b = Buffer.alloc(33); Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b, 0); b.writeUInt32BE(13, 8); b.write("IHDR", 12); b.writeUInt32BE(25, 16); b.writeUInt32BE(38, 20); b[24] = 8; b[25] = 6; return "data:image/png;base64," + b.toString("base64"); };
  const inv = { 0: { item: "f_poster", qty: 1 }, 1: { item: "f_sofa", qty: 1 }, 2: { item: "f_poster", qty: 1 } };
  const plain = await fresh("t_dec_plain", { inventory: inv });
  await act(plain, "sync");
  await owner("PUT", `roomsMeta/u_${plain.uid}`, { owner: plain.uid, ownerName: "t_dec_plain", name: "x", access: "open", w: 8, h: 8 });
  await stand(plain, room, 3, 3);
  bad("a normal player can't put furniture in someone else's room", await act(plain, "furniPlace", { room, source: "inv", slot: 1, x: 2, y: 2, dir: 0 }));
  const deco = await fresh("t_dec_deco", { inventory: inv });
  await owner("PATCH", `users/${deco.uid}`, { decorator: true });
  await act(deco, "sync");
  await owner("PUT", `roomsMeta/u_${deco.uid}`, { owner: deco.uid, ownerName: "t_dec_deco", name: "x", access: "open", w: 8, h: 8 });
  bad("not from outside the room", await act(deco, "furniPlace", { room, source: "inv", slot: 1, x: 2, y: 2, dir: 0 }));
  await stand(deco, room, 3, 3);
  const sofa = await act(deco, "furniPlace", { room, source: "inv", slot: 1, x: 2, y: 2, dir: 0 });
  ok("the decorator puts a sofa in their room", sofa);
  const rows = await owner("GET", `roomsMeta/${room}/furni`);
  const mine = Object.entries(rows).find(([, r]) => r.by === deco.uid && r.kind === "f_sofa");
  check("it carries who put it there", !!mine, JSON.stringify(rows));
  ok("and a poster on the wall", await act(deco, "furniPlace", { room, source: "inv", slot: 0, x: 4, y: 0, dir: 4, img: png() }));
  bad("a poster still only goes on a wall", await act(deco, "furniPlace", { room, source: "inv", slot: 2, x: 4, y: 4, dir: 0, img: png() }));
  ok("move the sofa they put there", await act(deco, "furniMove", { room, id: mine[0], x: 1, y: 3, dir: 0 }));
  bad("not the owner's own sofa", await act(deco, "furniMove", { room, id: "theirs", x: 1, y: 1, dir: 0 }));
  bad("and not take it away", await act(deco, "furniStore", { room, id: "theirs" }));
  ok("they can take back what they put there", await act(deco, "furniStore", { room, id: mine[0] }));
  check("the owner's sofa is still there", (await owner("GET", `roomsMeta/${room}/furni/theirs/kind`)) === "f_sofa");
}

console.log("--- tobacco and the cigar");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const t = await fresh("t_tobacco", { inventory: { 0: { item: "cigbutt", qty: 5 }, 1: { item: "jointpaper", qty: 1 }, 2: { item: "bluntwrap", qty: 1 }, 3: { item: "weed", qty: 2 }, 4: { item: "pill", qty: 1 }, 5: { item: "lighter", qty: 1 } } });
  await act(t, "sync");
  const room = `u_${t.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: t.uid, ownerName: "t_tobacco", name: "x", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(t, room, 4, 4);
  const done = async () => { await owner("PATCH", `roomsMeta/${room}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 }); return act(t, "mixCollect", { fid: "mx" }); };
  bad("one butt on its own can't be mixed with itself", await act(t, "mix", { fid: "mx", a: 1, b: 1 }));
  const m1 = await act(t, "mix", { fid: "mx", a: 0, b: 0 }); // two butts out of the same stack
  ok("two cigarette butts in the mixer", m1);
  check("three butts left", total(m1.state.inventory, "cigbutt") === 3);
  const c1 = await done();
  check("1 tobacco", total(c1.state.inventory, "tobacco") === 1, JSON.stringify(c1.data));
  // tobacco mixes like a cigarette
  const m2 = await act(t, "mix", { fid: "mx", a: slotOf(c1.state, "weed"), b: slotOf(c1.state, "tobacco") });
  ok("weed + tobacco in the mixer", m2);
  const c2 = await done();
  check("2 weed mix, like with a cigarette", total(c2.state.inventory, "mix") === 2 && total(c2.state.inventory, "tobacco") === 0, JSON.stringify(c2.data));
  // butts again -> tobacco -> rolled in paper
  await owner("PUT", `users/${t.uid}/inventory/20`, { item: "tobacco", qty: 2 });
  const st = await state(t);
  const cig = await act(t, "combine", { a: slotOf(st, "tobacco"), b: slotOf(st, "jointpaper") });
  ok("tobacco + joint paper", cig);
  check("a cigarette", total(cig.state.inventory, "cigarette") === 1 && total(cig.state.inventory, "tobacco") === 1, JSON.stringify(cig.data));
  const cgr = await act(t, "combine", { a: slotOf(cig.state, "tobacco"), b: slotOf(cig.state, "bluntwrap") });
  ok("tobacco + blunt paper", cgr);
  check("a cigar", total(cgr.state.inventory, "cigar") === 1, JSON.stringify(cgr.data));
  // the cigar mixes like a cigarette and smokes like one
  const mc = await act(t, "mix", { fid: "mx", a: slotOf(cgr.state, "pill"), b: slotOf(cgr.state, "cigar") });
  ok("pill + cigar in the mixer", mc);
  const cc = await done();
  check("a research chemical, like with a cigarette", total(cc.state.inventory, "researchchem") === 1, JSON.stringify(cc.data));
  await owner("PUT", `users/${t.uid}/inventory/21`, { item: "cigar", qty: 1 });
  const smoke = await act(t, "light", { slot: 21 });
  ok("light a cigar", smoke);
  const litSlot = smoke.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${t.uid}/inventory/${litSlot}`, { lit: Date.now() - 70_000 });
  const fin = await act(t, "finishSmoke", { slot: litSlot });
  ok("smoke it", fin);
  check("stabs give 2x, like a cigarette", fin.state.boostMult === 2 && fin.state.boostUntil - Date.now() > 110_000, JSON.stringify([fin.state.boostMult]));
}

console.log("--- /give");
{
  const g = await fresh("t_give");
  await act(g, "sync");
  const r1 = await act(g, "debug", { cmd: "give", item: "weed", qty: 3 });
  ok("give weed", r1);
  check("3 weed in one stack", total(r1.state.inventory, "weed") === 3);
  const r2 = await act(g, "debug", { cmd: "give", item: "f_sofa", qty: 2 });
  check("two sofas, a slot each", total(r2.state.inventory, "f_sofa") === 2 && r2.state.inventory.filter((x) => x && x.item === "f_sofa").length === 2);
  const r3 = await act(g, "debug", { cmd: "give", item: "codeine", qty: 1 });
  check("anything: codeine", total(r3.state.inventory, "codeine") === 1);
  bad("an item that does not exist", await act(g, "debug", { cmd: "give", item: "unicorn", qty: 1 }));
}

console.log("--- a cigarette skips 30 seconds");
{
  const k = await fresh("t_cigskip", { inventory: { 0: { item: "cigarette", qty: 1 }, 1: { item: "lighter", qty: 1 }, 2: { item: "kodimagnyl", qty: 1 }, 3: { item: "wateringcan_full", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_cigskip", name: "t_cigskip's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  ok("start a lean", await act(k, "mix", { fid: "mx", a: 2, b: 3 }));
  const before = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  const lit = await act(k, "light", { slot: 0 });
  ok("light the cigarette", lit);
  const ls = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${k.uid}/inventory/${ls}`, { lit: Date.now() - 70_000 });
  ok("smoke it", await act(k, "finishSmoke", { slot: ls }));
  const after = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  check("the mixer is 30 seconds closer", before - after === 30_000, String(before - after));
}
console.log("--- the boombox goes into storage, never into a pocket");
{
  const k = await fresh("t_boombox");
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_boombox", name: "t_boombox's room", access: "knock", w: 8, h: 8 });
  await stand(k, `u_${k.uid}`, 4, 4);
  const st = await act(k, "furniStore", { id: "boombox" });
  ok("store the room's boombox", st);
  check("it is in storage", (st.state.storage ?? {}).f_boombox === 1, JSON.stringify(st.state.storage));
  check("and gone from the room", (await owner("GET", `roomsMeta/u_${k.uid}/boombox/gone`)) === true);
  bad("it can't be taken into the pocket", await act(k, "take", { key: "f_boombox" }));
  bad("it can't be stored twice", await act(k, "furniStore", { id: "boombox" }));
  ok("put it down again", await act(k, "furniPlace", { source: "storage", kind: "f_boombox", x: 3, y: 3, dir: 2 }));
  const rows = (await owner("GET", `roomsMeta/u_${k.uid}/furni`)) ?? {};
  const fid = Object.keys(rows).find((id) => rows[id].kind === "f_boombox");
  check("it stands in the room", !!fid);
  ok("and back into storage", await act(k, "furniStore", { id: fid }));
}
console.log("--- chud mix");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const k = await fresh("t_chud", { inventory: { 0: { item: "shroom", qty: 1 }, 1: { item: "weed", qty: 1 }, 2: { item: "jointpaper", qty: 1 }, 3: { item: "lighter", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_chud", name: "t_chud's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  ok("shroom + weed in the mixer", await act(k, "mix", { fid: "mx", a: 0, b: 1 }));
  const job = await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`);
  check("2 chud mix, 20 minutes", job.item === "chudmix" && job.qty === 2 && job.doneAt - Date.now() > 19 * 60_000 && job.doneAt - Date.now() <= 20 * 60_000 + 2000, JSON.stringify(job));
  await owner("PATCH", `roomsMeta/u_${k.uid}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
  const col = await act(k, "mixCollect", { fid: "mx" });
  check("collected", total(col.state.inventory, "chudmix") === 2);
  check("and the mixer remembers it: you know the result now", (await owner("GET", `users/${k.uid}/mixed/chudmix`)) === true);
  const roll = await act(k, "combine", { a: slotOf(col.state, "chudmix"), b: slotOf(col.state, "jointpaper") });
  ok("roll a chud joint", roll);
  check("a chud joint", total(roll.state.inventory, "joint_chud") === 1);
  const lit = await act(k, "light", { slot: slotOf(roll.state, "joint_chud") });
  ok("light it", lit);
  const ls = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${k.uid}/inventory/${ls}`, { lit: Date.now() - 70_000 });
  const fin = await act(k, "finishSmoke", { slot: ls });
  ok("smoke it", fin);
  check("the weed high: triple blood", fin.state.boostMult === 3, JSON.stringify(fin.state.boostMult));
  check("and the shroom high: doors open for 3 minutes", fin.state.shroomUntil - Date.now() > 170_000 && fin.state.shroomUntil - Date.now() <= 181_000, String(fin.state.shroomUntil - Date.now()));
}
console.log("--- troldmand mix, LSD, the plain chud joint");
{
  const slotOf = (st, item, ass) => st.inventory.findIndex((x) => x && x.item === item && !!x.ass === !!ass);
  const k = await fresh("t_troll", { inventory: { 0: { item: "hash", qty: 1 }, 1: { item: "weed", qty: 1 }, 2: { item: "shroom", qty: 1 }, 3: { item: "pill", qty: 1 }, 4: { item: "weed", qty: 1, ass: true }, 5: { item: "cigarette", qty: 1 }, 6: { item: "lighter", qty: 1 }, 7: { item: "jointpaper", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_troll", name: "t_troll's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  const mixCollect = async (a, b, item, qty) => {
    const st = await act(k, "sync");
    const m = await act(k, "mix", { fid: "mx", a: slotOf(st.state, a[0], a[1]), b: slotOf(st.state, b[0], b[1]) });
    ok(`${a[0]} + ${b[0]} in the mixer`, m);
    await owner("PATCH", `roomsMeta/u_${k.uid}/furni/mx/mixJob`, { doneAt: Date.now() - 1000 });
    const col = await act(k, "mixCollect", { fid: "mx" });
    check(`${qty} ${item} come out`, total(col.state.inventory, item) === qty, JSON.stringify(col.state.inventory.filter(Boolean)));
    return col;
  };
  await mixCollect(["hash"], ["weed"], "trollmix", 2);
  await mixCollect(["shroom"], ["pill"], "lsd", 1);
  const cj = await mixCollect(["weed", true], ["cigarette"], "joint_chudname", 1);
  const lsd = await act(k, "debug", { cmd: "give", item: "lsd", qty: 1 });
  const dr = await act(k, "consume", { slot: slotOf(lsd.state, "lsd") });
  ok("take LSD", dr);
  check("3x speed for a minute and a half", dr.state.speedMult === 3 && dr.state.speedUntil - Date.now() > 85_000 && dr.state.speedUntil - Date.now() <= 91_000, JSON.stringify([dr.state.speedMult, dr.state.speedUntil - Date.now()]));
  check("and no open doors", !(dr.state.shroomUntil > Date.now()), String(dr.state.shroomUntil));
  const lit = await act(k, "light", { slot: slotOf(dr.state, "joint_chudname") });
  ok("light the chud joint", lit);
  const ls = lit.state.inventory.findIndex((x) => x && x.lit);
  await owner("PATCH", `users/${k.uid}/inventory/${ls}`, { lit: Date.now() - 70_000 });
  const fin = await act(k, "finishSmoke", { slot: ls });
  ok("smoke it", fin);
  check("it only changes the name for 30 seconds", fin.data.chudMs === 30_000 && fin.data.mult === 0, JSON.stringify(fin.data));
  check("no blood bonus", !(fin.state.boostUntil > Date.now()), String(fin.state.boostUntil));
}
console.log("--- the vending machine's daily stock of mixers and growing kits");
{
  const room = "shop";
  const v = await fresh("t_vend", { blood: 500 });
  await act(v, "sync");
  await stand(v, room, 3, 3);
  let got = 0;
  for (let i = 0; i < 5; i++) if ((await act(v, "buyVending", { id: "mixer" })).ok) got++;
  check("day 1: five mixers", got === 5, String(got));
  bad("the sixth is sold out", await act(v, "buyVending", { id: "mixer" }));
  ok("kits have their own stock", await act(v, "buyVending", { id: "planter" }));
  ok("lighters have no limit", await act(v, "buyVending", { id: "lighter" }));
  // an account made 2 days ago: 3 a day
  const old = await fresh("t_vend_old", { blood: 500 });
  await owner("PUT", `users/${old.uid}/createdAt`, Date.now() - 2 * 86_400_000);
  await act(old, "sync");
  await stand(old, room, 3, 3);
  let n2 = 0;
  for (let i = 0; i < 6; i++) if ((await act(old, "buyVending", { id: "planter" })).ok) n2++;
  check("day 3: three kits", n2 === 3, String(n2));
  // an account made long ago: one a day
  const older = await fresh("t_vend_older", { blood: 500 });
  await owner("PUT", `users/${older.uid}/createdAt`, Date.now() - 20 * 86_400_000);
  await act(older, "sync");
  await stand(older, room, 3, 3);
  let n3 = 0;
  for (let i = 0; i < 7; i++) if ((await act(older, "buyVending", { id: "mixer" })).ok) n3++;
  check("mixers: five a day for everybody, however old the account", n3 === 5, String(n3));
  let n4 = 0;
  for (let i = 0; i < 7; i++) if ((await act(older, "buyVending", { id: "planter" })).ok) n4++;
  check("kits: one a day for an old account", n4 === 1, String(n4));
}
console.log("--- weak shrooms");
{
  const slotOf = (st, item) => st.inventory.findIndex((x) => x && x.item === item);
  const w = await fresh("t_weak", { inventory: { 0: { item: "weed", qty: 1 } } });
  await act(w, "sync");
  const room = `u_${w.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: w.uid, ownerName: "t_weak", name: "t_weak's room", access: "knock", w: 8, h: 8, furni: { ks: { kind: "f_planter", x: 2, y: 2, crop: "shroom", plantedAt: Date.now() - 26 * 60_000 }, mx: { kind: "f_mixer", x: 4, y: 2 } } });
  await stand(w, room, 4, 4);
  const hv = await act(w, "harvest", { fid: "ks" });
  ok("harvest an unwatered shroom", hv);
  check("a weak shroom, not a shroom", total(hv.state.inventory, "weakshroom") === 1 && total(hv.state.inventory, "shroom") === 0, JSON.stringify(hv.state.inventory.filter(Boolean)));
  bad("it can't be mixed with weed", await act(w, "mix", { fid: "mx", a: slotOf(hv.state, "weakshroom"), b: slotOf(hv.state, "weed") }));
  const eat = await act(w, "consume", { slot: slotOf(hv.state, "weakshroom") });
  ok("but it can be eaten", eat);
  check("same effect: 3 minutes of open doors", eat.state.shroomUntil - Date.now() > 170_000, String(eat.state.shroomUntil - Date.now()));
}
console.log("--- the second batch of furniture: tapping a multi-state piece");
{
  const k = await fresh("t_furnist");
  await act(k, "sync");
  const room = `u_${k.uid}`;
  await owner("PUT", `roomsMeta/${room}`, { owner: k.uid, ownerName: "t_furnist", name: "t_furnist's room", access: "open", w: 14, h: 14, furni: { tv: { kind: "f_lodgetv", x: 8, y: 2, dir: 2 }, sofa: { kind: "f_sofa", x: 2, y: 2, dir: 2 }, die: { kind: "f_randomizer", x: 2, y: 8, dir: 2 } } });
  bad("not standing in the room: nothing happens", await act(k, "furniState", { room, id: "tv" }));
  await stand(k, room, 4, 4);
  const s1 = await act(k, "furniState", { room, id: "tv" });
  ok("tap the TV", s1);
  check("it goes from its default (channel 1) to the next one", s1.data.st === 2, JSON.stringify(s1.data));
  const rows = [];
  for (let i = 0; i < 4; i++) rows.push((await act(k, "furniState", { room, id: "tv" })).data.st);
  check("and round again: 3, 4, then off (0), then channel 1", JSON.stringify(rows) === JSON.stringify([3, 4, 0, 1]), JSON.stringify(rows));
  check("the state is kept on the room's data for everybody", (await owner("GET", `roomsMeta/${room}/furni/tv/st`)) === 1);
  bad("a piece with one look can't be tapped", await act(k, "furniState", { room, id: "sofa" }));
  const d1 = await act(k, "furniState", { room, id: "die" });
  ok("the love booth picks a state", d1);
  check("one of its own", [11, 12, 13, 14, 21, 22, 23, 24, 30, 31, 32].includes(d1.data.st) && d1.data.st !== 11, JSON.stringify(d1.data));
  // the new pieces can be put down (their sizes are known to the server)
  const pl = await fresh("t_furnist2", { inventory: { 0: { item: "f_lodgedesk", qty: 1 }, 1: { item: "f_candelabra", qty: 1 } } });
  await act(pl, "sync");
  await owner("PUT", `roomsMeta/u_${pl.uid}`, { owner: pl.uid, ownerName: "t_furnist2", name: "x", access: "knock", w: 8, h: 8 });
  await stand(pl, `u_${pl.uid}`, 6, 6);
  ok("put down the desk", await act(pl, "furniPlace", { source: "inv", slot: 0, x: 2, y: 2, dir: 0 }));
  ok("put down the candelabra (the pocket closes up, so it is slot 0 now)", await act(pl, "furniPlace", { source: "inv", slot: 0, x: 2, y: 2, dir: 2 }));
}
console.log("--- /skip");
{
  const k = await fresh("t_skip", { inventory: { 0: { item: "kodimagnyl", qty: 1 }, 1: { item: "wateringcan_full", qty: 1 } } });
  await act(k, "sync");
  await owner("PUT", `roomsMeta/u_${k.uid}`, { owner: k.uid, ownerName: "t_skip", name: "t_skip's room", access: "knock", w: 8, h: 8, furni: { mx: { kind: "f_mixer", x: 2, y: 2 } } });
  await stand(k, `u_${k.uid}`, 4, 4);
  ok("start a lean", await act(k, "mix", { fid: "mx", a: 0, b: 1 }));
  const before = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  ok("/skip 5", await act(k, "debug", { cmd: "skip", n: 5 }));
  const after = (await owner("GET", `roomsMeta/u_${k.uid}/furni/mx/mixJob`)).doneAt;
  check("the mixer is 5 minutes closer", before - after === 300_000, String(before - after));
}
console.log(`\n${fails ? `${fails} FAILED, ${passes} passed` : `all ${passes} passed`}`);
process.exit(fails ? 1 : 0);
