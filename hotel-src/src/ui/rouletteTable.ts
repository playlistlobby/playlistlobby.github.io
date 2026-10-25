// The roulette table in the basement, as the browser plays it: sitting down, the stake and the "play?" questions, whose turn it is, the gun going back and forth,
// the shot, the blood, the winnings over the winner's head and the dead player's ten seconds. The rules (and the dice) are on the server (server/src/actions/roulette.ts);
// everything here only follows what the server wrote to rooms/lobby/roulette, so everybody in the room sees and hears the same thing at the same time.
import { h } from "./dom";
import { BLOOD_ICON } from "../items";
import { playBang, playClick, playCock, playSfx, playSpin, playSplat, playThud } from "../sfx";
import { roulettePull, rouletteJoin, rouletteLeave, rouletteOpen, rouletteTick, watchRoulette } from "../roulette";
import { rouletteHas, ROULETTE_GONE_MS, ROULETTE_MAX, ROULETTE_TURN_MS, rouletteExpired } from "../shared/roulette";
import type { RouletteState } from "../shared/roulette";
import { getCached, renderAvatar } from "../avatarService";
import type { RenderOpts } from "../avatarService";
import { footprint } from "../rooms";
import type { PlacedFurni, RoomDef } from "../rooms";
import type { Profile } from "../db";
import {
  armPoseAt, DEAL_MS, DEADLY_PULL_MS, drawGoreOnBody, drawGoreOnFloor, drawGun, drawMuzzleFlash, GUN_K, gunNow, HEAD_GONE_AT, neckOf, SAFE_PULL_MS, TRIGGER_AT, withoutHead,
} from "./rouletteFx";
import type { ArmPose, Gore, P, RtAnim, Seat } from "./rouletteFx";

export interface RouletteEnv {
  me: Profile;
  stage: HTMLElement;
  def: () => RoomDef;
  scale: () => number;
  /** the feet of somebody standing on tile (tx, ty), on the screen */
  tileFeet: (tx: number, ty: number) => P;
  /** the tile a player stands (or sits) on */
  tileOf: (uid: string) => P | undefined;
  /** the room's players (just who is there, and whether they sit) */
  player: (uid: string) => { uid: string; name: string; sit?: boolean } | undefined;
  /** everybody who is in the room */
  everyone: () => string[];
  /** a player who is disconnected stays in their chair, a little darker: put (or keep) them there */
  ensureGhost: (uid: string, name: string, figure: string, tile: P, dir: number) => void;
  isGhost: (uid: string) => boolean;
  removePlayer: (uid: string) => void;
  /** you are back after a disconnect: you are put in your chair again (no walking) */
  seatMe: (tile: P, dir: number) => void;
  /** you sit down on the chair `furniId` (walking there first); `after` runs once you sit. false: you can't */
  sitAt: (furniId: string, after: () => void) => boolean;
  standUp: () => void;
  amSeated: () => boolean;
  /** back to your own room, waking up in bed */
  goHome: () => void;
  say: (text: string, kind?: "game" | "warn") => void;
  /** the blood floating up over a head (a "+50" or "-25") */
  floater: (text: string, at: P, life: number) => void;
  refreshHeader: () => void;
  serverNow: () => number;
  /** is the room still open (the table stops when you leave it) */
  alive: () => boolean;
}

export interface RouletteApi {
  /** you clicked the table, a chair or the gun rack */
  click: (furniId: string) => void;
  /** every frame, before drawing */
  update: (now: number) => void;
  /** the figure of a player as it is drawn: at the table the "misc" item (the briefcase...) is left off */
  figureFor: (uid: string, figure: string, sitting: boolean) => string;
  /** the arm pose to draw for a player while the gun is in play (null: the usual one) */
  armFor: (uid: string, now: number) => ArmPose | null;
  /** the picture of a player as it is drawn: without its head after the shot */
  imageFor: (uid: string, img: HTMLCanvasElement, opts: RenderOpts, now: number) => HTMLCanvasElement;
  /** blood on the floor under the chair of the dead (drawn under everyone) */
  drawFloor: (g: CanvasRenderingContext2D, now: number) => void;
  /** blood on the dead player's body (drawn right after the player) */
  drawBody: (g: CanvasRenderingContext2D, uid: string, feet: P, now: number) => void;
  /** the revolver and its flash (drawn over the table and the players) */
  drawGun: (g: CanvasRenderingContext2D, now: number) => void;
  /** how the table looks: its stake (0: none), and how strongly it glows by itself (0..1) */
  look: (now: number) => { stake: number; glow: number };
  /** a short shake of the whole picture at the shot */
  shake: (now: number) => P;
  hoverText: () => string;
  /** the "disconnected" counter over a player who dropped out of a game (null: not one) */
  ghostLabel: (uid: string) => string | null;
  dispose: () => void;
}

const SEAT_LIFT = 14;
const TABLE_TOP = 36;
const STAKE_CHIPS = [10, 25, 50, 100, 250];

export function mountRoulette(env: RouletteEnv): RouletteApi {
  const me = env.me;
  let rt: RouletteState | null = null;
  let anim: RtAnim | null = null;
  let animEnd = 0;
  let gore: (Gore & { uid: string; seat: 0 | 1 }) | null = null;
  let headGoneAt = 0;
  let shakeAt = 0;
  /** the pull whose results have been played (the table's seq): the browsers play each pull once */
  let playedSeq = -1;
  let busyAsking = false;
  let seating = false;
  let lastLeave = 0, lastTick = 0, lastBar = 0;
  const mountedAt = performance.now();
  const timers: number[] = [];
  const later = (ms: number, fn: () => void): void => { timers.push(window.setTimeout(() => { if (env.alive()) fn(); }, ms)); };
  let overlayEl: HTMLElement | null = null;
  let barEl: HTMLElement | null = null;
  let deathEl: HTMLElement | null = null;
  let deathTimer = 0;

  // ---- the corner: where the chairs, the table and the seats are -----------------------------------------------------
  const chairs = (): PlacedFurni[] => env.def().furni.filter((f) => f.kind === "rchair").sort((a, b) => a.y - b.y || a.x - b.x);
  const tablePiece = (): PlacedFurni | undefined => env.def().furni.find((f) => f.kind === "rtable");
  const seatIndexOf = (uid: string): 0 | 1 | null => {
    const t = env.tileOf(uid);
    if (!t) return null;
    const cs = chairs();
    const i = cs.findIndex((c) => c.x === t.x && c.y === t.y);
    return i === 0 || i === 1 ? i : null;
  };
  /** the seats on the screen, as the gun needs them (null when the corner isn't there) */
  function seats(): [Seat, Seat] | null {
    const cs = chairs();
    if (cs.length < 2) return null;
    const s = env.scale();
    const at = (c: PlacedFurni): Seat => { const f = env.tileFeet(c.x, c.y); return { feet: { x: f.x, y: f.y - SEAT_LIFT * s }, dir: c.dir ?? 0 }; };
    return [at(cs[0]), at(cs[1])];
  }
  function tableMid(): P | null {
    const t = tablePiece();
    if (!t) return null;
    const fp = footprint(t.kind, t.dir);
    const a = env.tileFeet(t.x, t.y), b = env.tileFeet(t.x + fp.w - 1, t.y + fp.h - 1);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - TABLE_TOP * env.scale() };
  }
  const active = (): RouletteState | null => (rt && !rouletteExpired(rt, env.serverNow()) ? rt : null);
  const nameOf = (st: RouletteState, uid: string): string => (st.a.uid === uid ? st.a.name : st.b?.name ?? "?");
  const seatOfUid = (st: RouletteState, uid: string): 0 | 1 => (seatIndexOf(uid) ?? (st.a.uid === uid ? 0 : 1));

  // ---- clicking the table ---------------------------------------------------------------------------------------------
  function freeChair(): PlacedFurni | null {
    const cs = chairs();
    const taken = new Set<string>();
    for (const c of cs) { const who = chairOccupant(c); if (who && who !== me.uid) taken.add(c.id); } // (a chair somebody is on)
    const mine = env.tileOf(me.uid) ?? { x: 0, y: 0 };
    const free = cs.filter((c) => !taken.has(c.id));
    free.sort((a, b) => Math.hypot(a.x - mine.x, a.y - mine.y) - Math.hypot(b.x - mine.x, b.y - mine.y));
    return free[0] ?? null;
  }

  function click(): void {
    if (seating || busyAsking) return;
    const st = active();
    if (st && rouletteHas(st, me.uid)) {
      if (st.status === "waiting") env.say(`You have ${st.stake} blood on the table. Waiting for somebody to sit down opposite you. Stand up to take it back.`);
      else if (st.status === "playing") env.say("Keep your eyes on the gun.");
      return;
    }
    if (st && st.status !== "waiting") {
      const other = st.b?.name ?? "somebody";
      env.say(st.status === "playing" ? `${st.a.name} and ${other} are playing. Wait until it is over.` : "The table is being cleaned up. Wait a moment.", "warn");
      return;
    }
    if (env.player(me.uid)?.sit && env.amSeated() && seatIndexOf(me.uid) !== null) { void afterSeated(); return; } // already on a chair: just go on
    const chair = freeChair();
    if (!chair) { env.say("Both chairs are taken.", "warn"); return; }
    // somebody else sits down to name a stake: wait for them instead of fighting over the table
    if (!st) for (const c of chairs()) { const o = chairOccupant(c); if (o && o !== me.uid) { env.say("Somebody is sitting down at the table. Wait a moment.", "warn"); return; } }
    seating = true;
    const started = env.sitAt(chair.id, () => { seating = false; void afterSeated(); });
    if (!started) { seating = false; return; }
    window.setTimeout(() => { seating = false; }, 8000); // (the walk was cut short: don't stay stuck)
  }

  function chairOccupant(c: PlacedFurni): string | null {
    for (const uid of env.everyone()) { const t = env.tileOf(uid); if (t && t.x === c.x && t.y === c.y) return uid; }
    return null;
  }

  /** you are on the chair: name the stake (nobody is playing), or answer "play?" (somebody is waiting) */
  async function afterSeated(): Promise<void> {
    if (busyAsking || !env.alive()) return;
    const st = active();
    busyAsking = true;
    try {
      if (st && st.status === "waiting" && st.a.uid !== me.uid) {
        const yes = await askJoin(st.a.name, st.stake);
        if (!yes) { env.standUp(); return; }
        try {
          const r = await rouletteJoin(me, seatIndexOf(me.uid) ?? 1);
          env.refreshHeader();
          if (r.gone) { env.say(`${st.a.name} got up from the table.`, "warn"); env.standUp(); }
        } catch (err) { env.say((err as Error).message || "That didn't work.", "warn"); env.standUp(); }
        return;
      }
      if (st) { env.standUp(); env.say("The table is in use.", "warn"); return; }
      const stake = await askStake(Math.max(0, me.blood));
      if (!stake) { env.standUp(); return; }
      try {
        await rouletteOpen(me, stake, seatIndexOf(me.uid) ?? 0);
        playSfx("give", 0.6);
        env.refreshHeader();
        env.say(`You put ${stake} blood on the table. Waiting for somebody to sit down opposite you.`);
      } catch (err) { env.say((err as Error).message || "That didn't work.", "warn"); env.standUp(); }
    } finally { busyAsking = false; }
  }

  // ---- the questions ---------------------------------------------------------------------------------------------------
  function overlay(content: HTMLElement): { el: HTMLElement; close: () => void } {
    const el = h("div", { class: "drop-overlay rt-overlay" }, content);
    env.stage.append(el);
    overlayEl = el;
    return { el, close: () => { el.remove(); if (overlayEl === el) overlayEl = null; } };
  }

  function askStake(have: number): Promise<number | null> {
    return new Promise((resolve) => {
      const max = Math.min(ROULETTE_MAX, have);
      let stake = Math.min(25, max);
      const num = h("b", { class: "rt-num" });
      const chips = h("div", { class: "rt-chips" });
      const less = h("button", { class: "btn small", type: "button", "aria-label": "Less", onclick: () => set(stake - 1) }, "−");
      const more = h("button", { class: "btn small", type: "button", "aria-label": "More", onclick: () => set(stake + 1) }, "+");
      const go = h("button", { class: "btn drop-yes", onclick: () => finish(stake) }, "Put it on the table");
      const stand = h("button", { class: "btn drop-no", onclick: () => finish(null) }, "Stand up");
      const set = (n: number): void => {
        stake = Math.max(1, Math.min(max, Math.round(n)));
        num.replaceChildren(h("img", { src: BLOOD_ICON, alt: "", class: "rt-drop" }), String(stake));
        (less as HTMLButtonElement).disabled = stake <= 1; (more as HTMLButtonElement).disabled = stake >= max;
        chips.replaceChildren(...[...STAKE_CHIPS.filter((c) => c < max), max].map((c, i, all) => h("button", { class: "rt-chip" + (stake === c ? " on" : ""), type: "button", onclick: () => set(c) }, i === all.length - 1 ? "Max" : String(c))));
      };
      const win = h("div", { class: "drop-win rt-win", role: "dialog", "aria-label": "Russian roulette" },
        h("div", { class: "drop-title" }, "Russian roulette"),
        h("div", { class: "rt-ask" }, "How much blood do you want to put at stake?"),
        max < 1 ? h("div", { class: "form-error" }, "You have no blood to put on the table.") : h("div", { class: "rt-stake" }, less, num, more),
        max < 1 ? h("span") : chips,
        h("div", { class: "hint" }, `You have ${have} blood. The most you can put down is ${ROULETTE_MAX}.`),
        h("div", { class: "drop-buttons" }, stand, ...(max < 1 ? [] : [go])));
      const ov = overlay(win);
      if (max >= 1) set(stake);
      let done = false;
      const finish = (v: number | null): void => { if (done) return; done = true; window.removeEventListener("keydown", onKey); ov.close(); resolve(v); };
      const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") finish(null); };
      window.addEventListener("keydown", onKey);
      later(120_000, () => finish(null)); // (nobody leaves the table hanging for ever)
      disposers.push(() => finish(null));
    });
  }

  function askJoin(host: string, stake: number): Promise<boolean> {
    return new Promise((resolve) => {
      const yes = h("button", { class: "btn drop-yes", onclick: () => finish(true) }, "Yes, deal me in");
      const no = h("button", { class: "btn drop-no", onclick: () => finish(false) }, "No");
      const win = h("div", { class: "drop-win rt-win", role: "dialog", "aria-label": "Russian roulette" },
        h("div", { class: "drop-title" }, "Russian roulette"),
        h("div", { class: "rt-ask" }, h("b", {}, host), " has put ", h("img", { src: BLOOD_ICON, alt: "", class: "rt-drop" }), h("b", {}, String(stake)), " on the table."),
        h("div", { class: "rt-ask" }, `Put ${stake} blood at stake for a 50% chance to double it?`),
        h("div", { class: "drop-buttons" }, no, yes));
      const ov = overlay(win);
      let done = false;
      const finish = (v: boolean): void => { if (done) return; done = true; window.removeEventListener("keydown", onKey); ov.close(); resolve(v); };
      const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") finish(false); };
      window.addEventListener("keydown", onKey);
      // the offer is gone (they took it back, or somebody else got there first): close the question
      const watch = window.setInterval(() => { const st = active(); if (!st || st.status !== "waiting") { window.clearInterval(watch); finish(false); } }, 400);
      timers.push(watch);
      later(60_000, () => finish(false));
      disposers.push(() => finish(false));
    });
  }

  // ---- whose turn it is --------------------------------------------------------------------------------------------------
  /** the little bar at the bottom of the room while a game runs: your turn, or whose it is */
  function updateBar(now: number): void {
    const st = active();
    const showFor = !!st && st.status === "playing" && rouletteHas(st, me.uid);
    if (!showFor || !st) { barEl?.remove(); barEl = null; return; }
    if (now - lastBar < 150) return;
    lastBar = now;
    if (!barEl) { barEl = h("div", { class: "rt-bar" }); env.stage.append(barEl); }
    const mine = st.turn === me.uid;
    const busy = now < animEnd - 250; // (the button is there a moment before the gun has quite arrived)
    const left = Math.max(0, Math.ceil((ROULETTE_TURN_MS - (env.serverNow() - (st.turnAt ?? st.at))) / 1000));
    const chambers = 6 - st.shots;
    const info = chambers === 1 ? "Only 1 chamber left" : `${chambers} chambers left`;
    const turnTitle = st.shots === 0 ? "Your turn · the gun is loaded with one bullet" : chambers === 1 ? "Your turn · only 1 chamber left" : `Your turn · ${chambers} chambers left`;
    if (mine) {
      const btn = h("button", { class: "btn rt-pull", disabled: busy || pulling, onclick: () => void pull() }, busy ? "…" : "Pull the trigger");
      barEl.replaceChildren(h("div", { class: "rt-bar-t" }, turnTitle), btn, h("div", { class: "hint" }, !busy && left <= 12 ? `${left} s` : " "));
    } else {
      const holderName = nameOf(st, st.turn ?? "");
      barEl.replaceChildren(h("div", { class: "rt-bar-t" }, `${holderName} has the gun…`), h("div", { class: "hint" }, info));
    }
  }
  let pulling = false;
  /** my own pull is playing (it began when I clicked) and the table hasn't said yet how it went */
  let optimistic = false;
  async function pull(): Promise<void> {
    const st = active();
    if (pulling || !st || st.status !== "playing" || st.turn !== me.uid) return;
    pulling = true;
    // the gun goes up to your head the moment you click; the server's answer (a moment later) says what the trigger does
    const now = performance.now();
    optimistic = true;
    startAnim({ kind: "pull", start: now, by: seatOfUid(st, me.uid) }, SAFE_PULL_MS, now);
    playCock(0.4);
    try { await roulettePull(me); env.refreshHeader(); }
    catch (err) { cancelOptimistic(); env.say((err as Error).message || "That didn't work.", "warn"); }
    finally { pulling = false; }
  }
  function cancelOptimistic(): void {
    if (optimistic && anim && anim.dead === undefined) { anim = null; animEnd = 0; }
    optimistic = false;
  }

  // ---- what happened: the table changed ------------------------------------------------------------------------------
  function startAnim(a: RtAnim, ms: number, now: number): void { anim = a; animEnd = now + ms; }

  function onState(next: RouletteState | null): void {
    const prev = rt;
    rt = next;
    const now = performance.now();
    if (!next) { if (prev && prev.status === "waiting" && prev.a.uid !== me.uid) closeAsks(); return; }
    const first = prev === null && playedSeq < 0;
    // you come back to a game you were in (a refresh, you logged out for a moment): you are put in your chair again, ready to go on
    if (first && rouletteHas(next, me.uid) && next.status !== "over" && !env.amSeated()) returnToTable(next);
    // a table seen for the first time (you just came in): show it as it is, play nothing
    if (first && next.status !== "waiting") {
      playedSeq = next.seq;
      if (next.status === "over" && next.dead) { gore = { start: now - Math.max(0, env.serverNow() - (next.endAt ?? next.at)) - 2500, seed: next.at % 100000, uid: next.dead, seat: seatOfUid(next, next.dead) }; headGoneAt = gore.start; }
      return;
    }
    if (prev && prev.status === "waiting" && next.status === "playing") {
      playedSeq = next.seq;
      const first0 = seatOfUid(next, next.turn ?? next.a.uid);
      startAnim({ kind: "deal", start: now, by: first0 }, DEAL_MS, now);
      playSpin(0.4);
      const firstName = nameOf(next, next.turn ?? "");
      if (rouletteHas(next, me.uid)) env.say(`The game begins. ${firstName} gets the gun first.`);
      return;
    }
    if (next.seq > playedSeq && next.last && (next.status === "playing" || next.status === "over")) {
      playedSeq = next.seq;
      const last = next.last;
      const by = seatOfUid(next, last.by);
      if (optimistic && last.by === me.uid && anim && anim.dead === undefined && anim.by === by) { resolveMine(next, last.dead, now); return; } // my own pull: it has been playing since I clicked
      if (last.dead) { startAnim({ kind: "pull", start: now, by, dead: true }, DEADLY_PULL_MS, now); playCock(0.4); scheduleDeath(next, last.by, by, now); }
      else if (next.status === "over") endGame(next, now, 400);
      else {
        startAnim({ kind: "pull", start: now, by, dead: false }, SAFE_PULL_MS, now);
        playCock(0.4);
        at(now, TRIGGER_AT, () => playClick(0.55));
      }
      return;
    }
    if (prev && prev.status !== "over" && next.status === "over" && !next.dead) { // somebody got up and left: no shot, just the money
      playedSeq = next.seq;
      endGame(next, now, 400);
    }
  }

  function closeAsks(): void { disposers.slice().forEach((d) => d()); }

  /** back at the table after a disconnect: in your own chair at once, and the table is told you are here (the 12 second counter stops) */
  function returnToTable(st: RouletteState): void {
    const mineSeat = st.a.uid === me.uid ? st.a : st.b;
    const c = chairs()[mineSeat?.seat ?? (st.a.uid === me.uid ? 0 : 1)];
    if (!c) return;
    returned = true;
    env.seatMe({ x: c.x, y: c.y }, c.dir ?? 0);
    env.say("You are back at the table.");
    later(500, () => { void rouletteTick(me).catch(() => undefined); });
  }
  let returned = false;

  /** the players who dropped out stay in their chairs, a little darker, until their 12 seconds are up */
  function syncGhosts(): void {
    const st = active();
    const cs = chairs();
    const alive = !!st && st.status !== "over";
    const here = new Set(env.everyone());
    if (st && alive) {
      for (const seat of [st.a, st.b]) {
        if (!seat || seat.uid === me.uid || here.has(seat.uid)) continue;
        const c = cs[seat.seat ?? (seat.uid === st.a.uid ? 0 : 1)];
        if (c) env.ensureGhost(seat.uid, seat.name, seat.figure ?? "", { x: c.x, y: c.y }, c.dir ?? 0);
      }
    }
    for (const uid of here) if (env.isGhost(uid) && !(st && alive && rouletteHas(st, uid))) env.removePlayer(uid);
  }

  function ghostLabel(uid: string): string | null {
    const st = active();
    if (!st || st.status === "over" || !rouletteHas(st, uid) || !env.isGhost(uid)) return null;
    const since = st.gone?.[uid];
    const secs = since === undefined ? Math.round(ROULETTE_GONE_MS / 1000) : Math.max(0, Math.ceil((ROULETTE_GONE_MS - (env.serverNow() - since)) / 1000));
    return `Disconnected · ${secs}`;
  }

  /** run `fn` at `offset` ms after `t0` (if that time has passed already: now) */
  function at(t0: number, offset: number, fn: () => void): void { later(Math.max(0, t0 + offset - performance.now()), fn); }

  /** the sounds, the blood and the end of the game for a pull that killed, timed from `t0` (when the gun began to rise) */
  function scheduleDeath(st: RouletteState, by: string, seat: 0 | 1, t0: number): void {
    at(t0, TRIGGER_AT, () => { playBang(0.85); shakeAt = performance.now(); });
    at(t0, TRIGGER_AT + 60, () => playSplat(0.4));
    at(t0, TRIGGER_AT + 380, () => playThud(0.5));
    at(t0, TRIGGER_AT + 900, () => playSplat(0.3));
    gore = { start: t0 + TRIGGER_AT, seed: (st.at + st.seq * 7919) % 1_000_000, uid: by, seat };
    headGoneAt = t0 + HEAD_GONE_AT;
    endGame(st, performance.now(), Math.max(0, t0 + TRIGGER_AT + 1000 - performance.now()));
  }

  /** my own pull has been playing since the click; now the table says how it went */
  function resolveMine(st: RouletteState, dead: boolean, now: number): void {
    const a = anim!;
    optimistic = false;
    if (now - a.start > TRIGGER_AT) a.start = now - TRIGGER_AT; // the answer was slow: the trigger is pulled now
    a.dead = dead;
    if (dead) { animEnd = a.start + DEADLY_PULL_MS; scheduleDeath(st, me.uid, a.by, a.start); }
    else { animEnd = a.start + SAFE_PULL_MS; at(a.start, TRIGGER_AT, () => playClick(0.55)); }
  }

  /** the blood changes hands: the winner's "+50", the loser's "-25" over their heads, and the dead player's ten seconds */
  function endGame(st: RouletteState, now: number, delay: number): void {
    const winner = st.winner, loser = winner ? (winner === st.a.uid ? st.b?.uid : st.a.uid) : undefined;
    const forfeit = st.forfeit === true;
    later(delay, () => {
      const s = env.scale();
      const spot = (uid: string): P | null => { const t = env.tileOf(uid); if (!t) return null; const f = env.tileFeet(t.x, t.y); return { x: f.x, y: f.y - (SEAT_LIFT + 80) * s }; };
      const wp = winner ? spot(winner) : null, lp = loser ? spot(loser) : null;
      if (wp) env.floater(`+${st.stake * 2}`, wp, 2600);
      if (lp) later(250, () => env.floater(`-${st.stake}`, lp, 2600));
      const winnings = st.stake * 2;
      const quitter = loser === undefined ? "They" : nameOf(st, loser);
      if (winner === me.uid) { playSfx("coins", 0.6); env.say(forfeit ? `${quitter} got up. You win ${winnings} blood.` : `You win ${winnings} blood.`); }
      else if (loser === me.uid && forfeit) env.say(`You got up and lost ${st.stake} blood.`, "warn");
      env.refreshHeader();
    });
    if (st.dead === me.uid) later(delay + 300, () => showDeath());
  }

  /** "you are dead" for ten seconds, then you wake up in your own room */
  function showDeath(): void {
    if (deathEl) return;
    closeAsks();
    barEl?.remove(); barEl = null;
    const count = h("div", { class: "rt-dead-sub" });
    deathEl = h("div", { class: "rt-dead", role: "alert" }, h("div", { class: "rt-dead-t" }, "YOU ARE DEAD"), count);
    env.stage.append(deathEl);
    let left = 10;
    const tick = (): void => {
      count.textContent = `You wake up in your room in ${left}…`;
      if (left-- <= 0) { window.clearInterval(deathTimer); env.goHome(); }
    };
    tick();
    deathTimer = window.setInterval(tick, 1000);
  }

  // ---- every frame ----------------------------------------------------------------------------------------------------
  function update(now: number): void {
    const st = active();
    // got up from the table while you had blood on it (or a game going): give the stake back / lose the game
    if (st && rouletteHas(st, me.uid) && (st.status === "waiting" || st.status === "playing") && !seating && !returned && !env.amSeated() && now - mountedAt > 4000 && now - lastLeave > 3000) {
      lastLeave = now;
      void rouletteLeave(me).then(() => { env.refreshHeader(); }, () => undefined);
      env.say(st.status === "waiting" ? "You stood up and took your blood back." : "You got up from the table in the middle of the game: you lose.", st.status === "waiting" ? "game" : "warn");
    }
    // anybody in the basement keeps the table honest every few seconds (somebody gone, somebody taking too long)
    if (st && (st.status === "waiting" || st.status === "playing") && now - lastTick > 2000 + (me.uid.charCodeAt(0) % 5) * 150) {
      lastTick = now;
      void rouletteTick(me).catch(() => undefined);
    }
    if (optimistic && anim && anim.dead === undefined && now - anim.start > 8000) cancelOptimistic(); // (the table never answered: put the gun down)
    syncGhosts();
    updateBar(now);
  }

  // ---- how things look -------------------------------------------------------------------------------------------------
  function figureFor(uid: string, figure: string, sitting: boolean): string {
    const st = active();
    const onChair = sitting && seatIndexOf(uid) !== null;
    if (!onChair && !(st && rouletteHas(st, uid) && st.status !== "over")) return figure;
    return figure.replace(/\.?ca-[0-9]+(-[0-9]+)*/g, "").replace(/^\./, ""); // (the "misc" item: a briefcase in the lap, a prop in the way of the gun)
  }

  function armFor(uid: string, now: number): ArmPose | null {
    const st = active();
    if (!st || !rouletteHas(st, uid)) return null;
    const i = seatOfUid(st, uid);
    const a = armPoseAt(anim && now - anim.start < (anim.kind === "deal" ? DEAL_MS : SAFE_PULL_MS) + 50 ? anim : null, now, i);
    if (a) return a;
    if (st.status === "playing" && st.turn === uid && now >= animEnd - 1) return "rest"; // holding the gun, waiting to pull
    return null;
  }

  function imageFor(uid: string, img: HTMLCanvasElement, opts: RenderOpts, now: number): HTMLCanvasElement {
    if (!gore || gore.uid !== uid || now < headGoneAt) return img;
    const ho = getCached({ ...opts, headOnly: true });
    if (!ho) { void renderAvatar({ ...opts, headOnly: true }); return img; }
    return withoutHead(img, ho);
  }

  function drawFloor(g: CanvasRenderingContext2D, now: number): void {
    if (!gore) return;
    const age = now - gore.start;
    if (age > 32_000) { gore = null; return; } // the stain fades away after a while
    g.save();
    if (age > 22_000) g.globalAlpha = Math.max(0, 1 - (age - 22_000) / 10_000);
    const cs = chairs();
    const c = cs[gore.seat];
    if (!c) return;
    const s = env.scale();
    const f = env.tileFeet(c.x, c.y);
    drawGoreOnFloor(g, gore, now, { x: f.x - 4 * s, y: f.y + 2 * s }, s);
    g.restore();
  }

  function drawBody(g: CanvasRenderingContext2D, uid: string, feet: P, now: number): void {
    if (!gore || gore.uid !== uid || now < gore.start) return;
    const cs = chairs();
    const dir = cs[gore.seat]?.dir ?? 0;
    const s = env.scale();
    drawGoreOnBody(g, gore, now, neckOf(feet, dir, s), s, feet.y + 24 * s);
  }

  function drawGunNow(g: CanvasRenderingContext2D, now: number): void {
    const st = active();
    const sts = seats(), mid = tableMid();
    if (!st || !sts || !mid) return;
    let a: RtAnim | null = anim;
    if (a && now - a.start > (a.kind === "deal" ? DEAL_MS : a.dead ? DEADLY_PULL_MS : SAFE_PULL_MS) + 20) a = null;
    let holder: 0 | 1 | null = null;
    if (st.status === "playing" && !a && st.turn) holder = seatOfUid(st, st.turn);
    if (st.status === "over" && !a) return; // (the gun lies on the table: drawn with the table)
    if (st.status === "waiting") return;
    const s = env.scale();
    const gun = gunNow(a, holder, sts, mid, now, s);
    if (!gun) return;
    const r = drawGun(g, gun.at.x, gun.at.y, gun.ang, s * GUN_K);
    drawMuzzleFlash(g, r.muzzle, gun.flash, s * 0.55);
    if (a && a.dead && now - a.start >= TRIGGER_AT && now - a.start < TRIGGER_AT + PULL_FLASH_MS) { // a white flash on the whole picture for a blink
      g.save(); g.globalAlpha = 0.16 * (1 - (now - a.start - TRIGGER_AT) / PULL_FLASH_MS); g.fillStyle = "#fff"; g.fillRect(0, 0, 4000, 4000); g.restore();
    }
  }

  function look(now: number): { stake: number; glow: number } {
    const st = active();
    if (!st || st.status === "over") return { stake: 0, glow: 0 };
    const pulse = 0.5 + 0.5 * Math.sin(now / 450);
    return { stake: st.stake, glow: 0.35 + 0.15 * pulse };
  }

  function shake(now: number): P {
    const t = now - shakeAt;
    if (shakeAt <= 0 || t > 320) return { x: 0, y: 0 };
    const k = 1 - t / 320;
    return { x: Math.sin(t / 9) * 6 * k, y: Math.cos(t / 11) * 4 * k };
  }

  function hoverText(): string {
    const st = active();
    if (!st) return "Russian roulette: sit down and put blood on the table";
    if (st.status === "waiting") return st.a.uid === me.uid ? `Russian roulette: you have ${st.stake} blood on the table` : `Russian roulette: ${st.a.name} has ${st.stake} blood on the table. Sit down opposite to play`;
    const other = st.b?.name ?? "?", pot = st.stake * 2;
    if (st.status === "playing") return `Russian roulette: ${st.a.name} and ${other} are playing for ${pot} blood`;
    return "Russian roulette";
  }

  // ---- start and stop ------------------------------------------------------------------------------------------------------
  const disposers: Array<() => void> = [];
  const unwatch = watchRoulette(onState);

  return {
    click: () => click(),
    update, figureFor, armFor, imageFor, drawFloor, drawBody, drawGun: drawGunNow, look, shake, hoverText, ghostLabel,
    dispose: () => {
      unwatch();
      timers.forEach((t) => { window.clearTimeout(t); window.clearInterval(t); });
      window.clearInterval(deathTimer);
      disposers.slice().forEach((d) => d());
      overlayEl?.remove(); barEl?.remove(); deathEl?.remove();
    },
  };
}

const PULL_FLASH_MS = 170;
