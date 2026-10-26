// The hitman site (on the hideout computer) and the gun. A hideout puts blood on somebody's head; anybody holding a gun can claim it by shooting that player.
//   hits/<id> = an open hit (see src/shared/hits.ts), readable by everybody and written only here
// The blood of a hit sits in the hit (it left the hideout member's pocket when they put it down) until somebody claims it. A shot always uses up the gun.
import { Action, cheb, ID_RE, int, requireHideoutMember, requireInRoom, text } from "./util";
import { Ctx, fail } from "../ctx";
import { findSlot } from "../../../src/shared/items";
import { takeQtyFrom } from "../../../src/shared/economy";
import { isHideoutId } from "../../../src/shared/hideout";
import { HIT_HIDEOUT_COOLDOWN_MS, HIT_MAX, HIT_MIN, HIT_PERSON_MAX, HIT_PERSON_WINDOW_MS, parseHits, SHOT_RANGE, shotLoss } from "../../../src/shared/hits";
import { bloodPile } from "./floor";
import { roleOf } from "./mod";

const ROOM_RE = /^[A-Za-z0-9_-]{1,60}$/;

/** Put blood on somebody's head. From the hideout computer (you must be a member of the hideout and standing in it): 500 to 1500, one hit per hideout every 12 hours, and nobody is hit more than 3 times a day. */
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
    if (await roleOf(c, target)) fail("That one is protected: nobody puts a hit on them.");
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
    c.extra[`hitCool/${owner}`] = c.now;
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
    const me = await requireInRoom(c, room);
    const theirs = await c.db.get<{ x?: number; y?: number }>(`rooms/${room}/players/${target}`);
    if (!theirs) fail("They've left the room.");
    if (me && typeof theirs!.x === "number" && typeof theirs!.y === "number" && cheb(me, { x: theirs!.x, y: theirs!.y }) > SHOT_RANGE) fail("They're too far away.");
    const name = String((await c.db.get<string>(`profiles/${target}/name`)) ?? "");
    if (!name) fail("They aren't a player.");
    if (await c.db.get(`peers/${c.uid}/${target}`)) fail("You can't shoot someone who plays on your device.");
    if (await roleOf(c, target)) fail("The gun jams. That one is protected.");
    const w = await c.user();
    const want = a.slot ?? findSlot(w.s.inventory, "gun");
    if (want === undefined || Number(want) < 0) fail("You have no gun.");
    const slot = int(want, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "gun") fail("You have no gun.");
    w.s.inventory = takeQtyFrom(w.s.inventory, slot, 1); // (it is spent whatever happens next)
    const hits = parseHits(await c.db.get("hits")).filter((h) => h.target === target);
    const hit = hits[0]; // (the biggest)
    const v = await c.user(target);
    const loss = shotLoss(v.s.blood, !!hit);
    v.s.blood -= loss.drop;
    let got = 0;
    if (hit) {
      got = hit.amount;
      w.s.blood += got;
      c.extra[`hits/${hit.id}`] = null;
    }
    const shooterName = String(w.raw?.name ?? "someone").slice(0, 16);
    c.note = hit ? `shot ${name}: bounty ${got}` : `shot ${name}`;
    if (loss.drop > 0) await bloodPile(c, room, typeof theirs!.x === "number" && typeof theirs!.y === "number" ? { x: theirs!.x, y: theirs!.y } : null, loss.drop, target, name);
    c.extra[`sendHome/${target}`] = { at: c.now, by: c.uid, byName: shooterName, lost: loss.drop, secs: loss.secs, shot: true };
    c.extra[`rooms/${room}/events/s${c.now.toString(36)}${Math.random().toString(36).slice(2, 4)}`] = { type: "shot", from: c.uid, to: target, ts: c.now };
    return { bounty: got, dropped: loss.drop, secs: loss.secs, name };
  },
};
