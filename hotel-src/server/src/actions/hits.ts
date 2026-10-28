// The hitman site (on the hideout computer) and the gun. A hideout puts blood on somebody's head; anybody holding a gun can claim it by shooting that player.
//   hits/<id> = an open hit (see src/shared/hits.ts), readable by everybody and written only here
// The blood of a hit sits in the hit (it left the hideout member's pocket when they put it down) until somebody claims it. A shot always uses up the gun.
import { Action, cheb, ID_RE, int, requireHideoutMember, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { findSlot } from "../../../src/shared/items";
import { addToInv, takeQtyFrom } from "../../../src/shared/economy";
/** how long the room of a player with a hit on them stays open to the hunters while they are logged out */
const HIT_TARGET_OPEN_MS = 24 * 3_600_000;
import { isHideoutId } from "../../../src/shared/hideout";
import { FAIR_GAME_UIDS, ROULETTE_CHAIRS, HIT_HIDEOUT_COOLDOWN_MS, HIT_MAX, HIT_ONLINE_FRESH_MS, HIT_ONLINE_MAX, HIT_MIN, HIT_PERSON_MAX, HIT_PERSON_WINDOW_MS, liveHits, parseHits, ROCKET_COOLDOWN_MS, ROCKET_SECS, SHOT_RANGE, shotLoss } from "../../../src/shared/hits";
import { bloodPile } from "./floor";
import { roleOf } from "./mod";
import { clearWanted } from "./bounty";

const ROOM_RE = /^[A-Za-z0-9_-]{1,60}$/;

/** moderators and the admin can't be hit, shot, rocketed or stabbed (all but the two in FAIR_GAME_UIDS) */
export async function isProtected(c: Ctx, uid: string): Promise<boolean> {
  if (FAIR_GAME_UIDS.includes(uid)) return false;
  return !!(await roleOf(c, uid));
}

/** somebody sitting at the roulette table (in a chair, or in a game) can not be shot or rocketed */
async function atRoulette(c: Ctx, room: string, target: string, theirs: { x?: number; y?: number; sit?: boolean }): Promise<boolean> {
  if (room !== "lobby") return false;
  if (theirs.sit === true && ROULETTE_CHAIRS.some((ch) => ch.x === theirs.x && ch.y === theirs.y)) return true;
  const game = await c.db.get<{ a?: { uid?: string }; b?: { uid?: string } }>("rooms/lobby/roulette");
  return game?.a?.uid === target || game?.b?.uid === target;
}

/** everybody who is protected from hits: moderators and the admin, except the two in FAIR_GAME_UIDS (the same list the hitman site uses) */
export async function guardedUids(c: Ctx): Promise<Set<string>> {
  const roles = (await c.db.get<Record<string, string>>("roles")) ?? {};
  const guarded = new Set<string>(Object.entries(roles).filter(([, r]) => r === "admin" || r === "mod").map(([u]) => u));
  const first = await c.db.get<string>("usernames/adminsidia"); // (the first admin is known by the name of the account)
  if (first) guarded.add(first);
  for (const f of FAIR_GAME_UIDS) guarded.delete(f);
  return guarded;
}

/**
 * The hitman site's player list: with no search, the players who are online now; with one (2 letters or more of the name, anywhere in it), the players whose name has it.
 * The protected ones (moderators, the admin) are left out, so nobody picks somebody the server would refuse.
 */
export const hitSearch: Action = {
  async run(c, a) {
    const q = String(a.q ?? "").trim().toLowerCase();
    const guarded = await guardedUids(c);
    const okUid = (u: string): boolean => u !== c.uid && !guarded.has(u);
    let uids: string[];
    if (q === "") {
      const pres = (await c.db.get<Record<string, { seen?: number }>>("presence")) ?? {};
      uids = Object.entries(pres).filter(([u, p]) => okUid(u) && typeof p?.seen === "number" && c.now - p.seen < HIT_ONLINE_FRESH_MS).map(([u]) => u);
    } else {
      text(q, /^[a-z0-9_.-]{2,20}$/, "name");
      const all = (await c.db.get<Record<string, string>>("usernames")) ?? {};
      uids = Object.entries(all).filter(([n, u]) => n.includes(q) && okUid(u)).sort((x, y) => Number(y[0].startsWith(q)) - Number(x[0].startsWith(q)) || x[0].length - y[0].length || x[0].localeCompare(y[0])).slice(0, 8).map(([, u]) => u);
    }
    const out: Array<{ uid: string; name: string }> = [];
    for (const u of uids) { const n = await c.db.get<string>(`profiles/${u}/name`); if (n) out.push({ uid: u, name: n }); }
    if (q === "") out.sort((x, y) => x.name.localeCompare(y.name));
    return { players: out.slice(0, q === "" ? HIT_ONLINE_MAX : 8) };
  },
};

/** Put blood on somebody's head. From the hideout computer (you must be a member of the hideout and standing in it): 500 to 1500, one hit per hideout every 2 hours, and nobody is hit more than 3 times a day. */
export const hitPlace: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`, "hits", `hitroom:${String(a?.room ?? "")}`],
  async run(c, a) {
    const room = text(a.room, /^h_[A-Za-z0-9]{1,40}$/, "room");
    if (!isHideoutId(room)) fail("The hitman site is on a hideout's computer.");
    await requireHideoutMember(c, room);
    await requireInRoom(c, room);
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't put a hit on yourself.");
    const amount = int(a.amount, HIT_MIN, HIT_MAX, "bounty");
    const name = String((await c.db.get<string>(`profiles/${target}/name`)) ?? "");
    if (!name) fail("They aren't a player.");
    if (await isProtected(c, target)) fail("That one is protected: nobody puts a hit on them.");
    const owner = room.slice(2);
    const cool = Number(await c.db.get<number>(`hitCool/${owner}`)) || 0;
    if (c.now - cool < HIT_HIDEOUT_COOLDOWN_MS) {
      const mins = Math.ceil((HIT_HIDEOUT_COOLDOWN_MS - (c.now - cool)) / 60000);
      fail(`Your hideout has put a hit out already. It can put the next one out in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}.`);
    }
    const log = (await c.db.get<Record<string, number>>(`hitLog/${target}`)) ?? {};
    const recent = Object.values(log).filter((t) => typeof t === "number" && c.now - t < HIT_PERSON_WINDOW_MS);
    if (recent.length >= HIT_PERSON_MAX) fail(`${name} has had ${HIT_PERSON_MAX} hits put on them today already. Try again tomorrow.`);
    const w = await c.user();
    if (w.s.blood < amount) fail(`You need ${amount - w.s.blood} more blood.`);
    w.s.blood -= amount;
    const meta = await c.db.get<{ name?: string }>(`roomsMeta/${room}`);
    const id = `h${c.now.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    c.extra[`hits/${id}`] = { target, targetName: name.slice(0, 30), amount, by: c.uid, byName: String(w.raw?.name ?? "?").slice(0, 30), hideout: owner, hideoutName: String(meta?.name ?? "A hideout").slice(0, 40), at: c.now };
    const open = await c.db.get<number>(`hitTargets/${target}/until`);
    c.extra[`hitTargets/${target}/until`] = Math.max(Number(open) || 0, c.now + HIT_TARGET_OPEN_MS); // (if they log out, their room is open to whoever comes for the hit)
    c.extra[`hitCool/${owner}`] = c.now;
    c.extra[`hitRevenge/${target}/${id}`] = { by: c.uid, byName: String(w.raw?.name ?? "?").slice(0, 30), hideoutName: String(meta?.name ?? "A hideout").slice(0, 40), amount, at: c.now };
    const mine = (await c.db.get<Record<string, { by?: string }>>(`hitRevenge/${c.uid}`)) ?? {}; // (a hit on somebody who put one on you: the revenge is done)
    for (const [rid, r] of Object.entries(mine)) if (r?.by === target) c.extra[`hitRevenge/${c.uid}/${rid}`] = null;
    const keep = Object.fromEntries(Object.entries(log).filter(([, t]) => typeof t === "number" && c.now - t < HIT_PERSON_WINDOW_MS));
    c.extra[`hitLog/${target}`] = { ...keep, [id]: c.now };
    c.note = `hit on ${name}`;
    return { id, amount };
  },
};

/**
 * Shoot somebody in the room with your gun (the gun is used up, hit or miss: there is no miss, it is just spent). If they have a hit on their head you claim the biggest one (you get its blood),
 * they drop blood and are dead for a minute; if not, they drop a little and are dead for 10 seconds. The blood they drop lies on the floor where they stood.
 */
export const gunShoot: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`, "hits", `room:${String(a?.room ?? "")}`],
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't shoot yourself.");
    const room = text(a.room, ROOM_RE, "room");
    if (room === "streets") fail("On the street a gun is a weapon: shoot from the street screen."); // (streetShoot: 0 to 5 hit points, no bounty)
    const me = await requireInRoom(c, room);
    let theirs = await c.db.get<{ x?: number; y?: number; sit?: boolean }>(`rooms/${room}/players/${target}`);
    // a player who logged out is asleep in their own room: somebody with a hit on them can be shot there (the room is open to everybody while the hit lasts)
    const sleeping = !theirs && room === `u_${target}` && !(await c.db.get(`presence/${target}`));
    if (sleeping) theirs = {};
    if (!theirs) fail("They've left the room.");
    if (await atRoulette(c, room, target, theirs!)) fail("They are at the roulette table: you can't shoot them there.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > SHOT_RANGE) fail("They're too far away.");
    const name = String((await c.db.get<string>(`profiles/${target}/name`)) ?? "");
    if (!name) fail("They aren't a player.");
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't shoot someone who plays on your device.");
    if (await isProtected(c, target)) fail("The gun jams. That one is protected.");
    const hits = liveHits(parseHits(await c.db.get("hits")), c.now).filter((h) => h.target === target);
    if (!hits.length) fail("Nobody has put a bounty on them (any more): the gun won't fire."); // (only somebody with blood on their head can be shot; the gun is kept)
    const w = await c.user();
    const want = a.slot ?? findSlot(w.s.inventory, "gun");
    if (want === undefined || Number(want) < 0) fail("You have no gun.");
    const slot = int(want, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "gun") fail("You have no gun.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1); // (it is spent whatever happens next)
    const hit = hits[0]; // (the biggest)
    const v = await c.user(target);
    const loss = shotLoss(v.s.blood, !!hit);
    v.s.blood -= loss.drop;
    let got = 0;
    let key = false;
    if (hit) {
      got = hit.amount;
      w.s.blood += got;
      c.extra[`hits/${hit.id}`] = null;
      if (hits.length === 1) c.extra[`hitTargets/${target}`] = null; // (that was the last hit on them: their room closes again)
      if (hit.bagmand) await clearWanted(c, target); // (a claimed bagmand hit: the rooms they stand in close again)
      if (Math.random() < 0.1) { // doing a hit: 1 time in 10 a box key turns up (not if the pocket is full)
        const withKey = addToInv(w.s.inventory, { item: "casekey", qty: 1 });
        if (withKey) { w.s.inventory = withKey; key = true; }
      }
    }
    const shooterName = String(w.raw?.name ?? "someone").slice(0, 16);
    c.note = hit ? `shot ${name}: bounty ${got}` : `shot ${name}`;
    if (loss.drop > 0) await bloodPile(c, room, typeof theirs!.x === "number" && typeof theirs!.y === "number" ? { x: theirs!.x, y: theirs!.y } : null, loss.drop, target, name);
    c.extra[`sendHome/${target}`] = { at: c.now, by: c.uid, byName: shooterName, lost: loss.drop, secs: loss.secs, shot: true };
    c.extra[`rooms/${room}/events/s${c.now.toString(36)}${Math.random().toString(36).slice(2, 4)}`] = { type: "shot", from: c.uid, to: target, ts: c.now };
    return { bounty: got, dropped: loss.drop, secs: loss.secs, name, key };
  },
};

/**
 * Fire the rocket launcher at somebody in the room. It is not used up: it can be fired again after 30 minutes. They are dead for 30 seconds, drop no blood, and their browser makes them say a line in the chat.
 */
export const rocketFire: Action = {
  locks: (c, a) => [`user:${String(a?.target ?? "")}`, `rocket:${c.uid}`, `room:${String(a?.room ?? "")}`],
  async run(c, a) {
    const target = text(a.target, ID_RE, "target");
    if (target === c.uid) fail("You can't shoot yourself.");
    const room = text(a.room, ROOM_RE, "room");
    if (room === "streets") fail("You can't do that on the street.");
    const me = await requireInRoom(c, room);
    const w = await c.user();
    if (findSlot(w.s.inventory, "rocket") < 0) fail("You have no rocket launcher.");
    const last = Number(await c.db.get<number>(`rocketAt/${c.uid}`)) || 0;
    if (c.now - last < ROCKET_COOLDOWN_MS) {
      const mins = Math.ceil((ROCKET_COOLDOWN_MS - (c.now - last)) / 60000);
      fail(`Reloading: ${mins} more minute${mins === 1 ? "" : "s"}.`);
    }
    const theirs = await c.db.get<{ x?: number; y?: number; sit?: boolean }>(`rooms/${room}/players/${target}`);
    if (!theirs) fail("They've left the room.");
    if (await atRoulette(c, room, target, theirs!)) fail("They are at the roulette table: you can't shoot them there.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > SHOT_RANGE) fail("They're too far away.");
    const name = String((await c.db.get<string>(`profiles/${target}/name`)) ?? "");
    if (!name) fail("They aren't a player.");
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't shoot someone who plays on your device.");
    if (await isProtected(c, target)) fail("The launcher jams. That one is protected.");
    c.extra[`rocketAt/${c.uid}`] = c.now;
    const shooterName = String(w.raw?.name ?? "someone").slice(0, 16);
    c.note = `rocket on ${name}`;
    c.extra[`sendHome/${target}`] = { at: c.now, by: c.uid, byName: shooterName, lost: 0, secs: ROCKET_SECS, shot: true, rocket: true };
    c.extra[`rooms/${room}/events/s${c.now.toString(36)}${Math.random().toString(36).slice(2, 4)}`] = { type: "shot", from: c.uid, to: target, rocket: true, ts: c.now };
    return { secs: ROCKET_SECS, name };
  },
};
