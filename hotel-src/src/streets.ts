// The streets in the browser (rules and numbers: src/shared/streets.ts, the server: server/src/actions/streets.ts): the customers and their orders, the cars, the fights and the
// hit points, the little panel at the top, and the elevator's pass running out. room.ts calls into this for the street room only.
import { onValue, orderByKey, limitToLast, query, ref } from "firebase/database";
import { db } from "./firebase";
import { call, serverNow } from "./db";
import type { Profile } from "./db";
import { getCached, renderAvatar } from "./avatarService";
import { drawNitroFurni } from "./roomRender";
import type { Box, Pt } from "./roomRender";
import { loadNitro, nitroIfReady, spritesFor } from "./nitro";
import { FURNI_KINDS } from "./rooms";
import { randomFigure } from "./catalog";
import { itemDef } from "./items";
import { findSlot, sellPrice } from "./shared/items";
import { h, toast } from "./ui/dom";
import { playSfx } from "./sfx";
import { CAR_STAY_MS, customerAt, customersAt, CUSTOMER_EVERY_MS, hpNow, orderPay, PVP, ROAD_ROWS, seeded, STREETS_H, STREETS_W } from "./shared/streets";
import type { Customer, StreetCombat } from "./shared/streets";

const FEET_Y = 94;
const padOf = (c: HTMLCanvasElement | null | undefined): { x: number; y: number } => ({ x: (c as unknown as { padL?: number })?.padL || 0, y: (c as unknown as { padT?: number })?.padT || 0 });

/** what room.ts hands over for one frame */
export interface StreetsFrame {
  g: CanvasRenderingContext2D;
  list: Array<{ depth: number; draw: () => void }>;
  objs: Array<{ id: string; kind?: string; x0: number; y0: number; x1: number; y1: number; depth: number }>;
  bubbles: Array<() => void>;
  now: number;
  scale: number;
  toScreen: (p: Pt) => Pt;
  iso: (x: number, y: number) => Pt;
  tileHeight: number;
  hoverId: string | null;
}
export interface StreetsOptions {
  me: Profile;
  stage: HTMLElement;
  say: (text: string, kind?: "warn") => void;
  /** the tile somebody stands on (null if they aren't here) */
  tileOf: (uid: string) => { x: number; y: number } | null;
  nameOf: (uid: string) => string;
  walkTo: (t: { x: number; y: number }) => void;
  goHome: () => void;
  goDown: () => void;
  refreshPocket: () => void;
}
export interface StreetsApi {
  draw(f: StreetsFrame): void;
  /** a tap on something drawn here: true if it was ours */
  click(objId: string): boolean;
  hoverText(objId: string): string | null;
  /** over the head of a player: hit points, the skull, the numbers that fly up */
  drawPlayer(g: CanvasRenderingContext2D, uid: string, cx: number, headY: number, scale: number, now: number): void;
  fight(uid: string): void;
  stopFight(): void;
  inFight(): boolean;
  /** somebody is in a fight right now (used to keep the body of a player who closed the game in it) */
  fighting(uid: string): boolean;
  heal(slot: number): Promise<void>;
  dispose(): void;
}

// ---- the cars ----------------------------------------------------------------------------------------------------------------------------------
/** the cars that drive by (and the ones that stop for a customer): the kind (see rooms.ts). The street is one way, east (down to the right): the art only has views that look toward you. */
const CARS = ["st_car_retro", "st_car_retro_red", "st_car_retro_yellow", "st_car_retro_pink", "st_car_retro_blue", "st_car_retro_orange", "st_car_retro_green", "st_car_mafia"] as const;
const CAR_DIR = 2;
const AMBIENT_EVERY_MS = 15_000;
const AMBIENT_LIFE_MS = 26_000;
const LANE_EAST = ROAD_ROWS.lanes[0], LANE_WEST = ROAD_ROWS.lanes[1];

interface Car { id: string; kind: string; x: number; y: number; stopped: boolean }

function ambientCar(slot: number, now: number): Car | null {
  const r = seeded(slot * 131 + 5);
  const t = (now - slot * AMBIENT_EVERY_MS) / 1000;
  if (t < 0) return null;
  const lane = r() < 0.5 ? LANE_EAST : LANE_WEST;
  const speed = 2.6 + r() * 1.2;
  const kind = CARS[Math.floor(r() * CARS.length)];
  const x = -4 + speed * t;
  if (x > STREETS_W + 5) return null;
  return { id: `amb${slot}`, kind, x, y: lane, stopped: false };
}

/** a customer's car: drives in along its lane to the curb spot, waits for the order, drives away the way it was going */
function customerCar(c: Customer, now: number, filledAt: number | null): Car | null {
  const speed = 3;
  const startX = -4;
  const arriveMs = (Math.abs(c.x - startX) / speed) * 1000;
  const t = now - c.at;
  const y = c.y === ROAD_ROWS.curbs[0] ? LANE_EAST : LANE_WEST;
  let x: number;
  if (t < arriveMs) x = startX + speed * (t / 1000);
  else if (filledAt !== null && now > filledAt) {
    const away = (speed * (now - filledAt - 800)) / 1000; // (a moment to count the money)
    x = c.x + Math.max(0, away);
    if (x > STREETS_W + 6) return null;
  } else x = c.x;
  const kind = CARS[c.look % CARS.length];
  return { id: `car${c.k}`, kind, x, y, stopped: t >= arriveMs && !(filledAt !== null && now > filledAt + 800) };
}

// ---- the walking customers ------------------------------------------------------------------------------------------------------------------------
const figures = new Map<number, string>();
function figureOf(look: number): string {
  let f = figures.get(look);
  if (!f) {
    const r = seeded(look);
    const orig = Math.random;
    Math.random = r; // (the same clothes for the same customer, on every screen)
    try { f = randomFigure(look % 2 ? "M" : "F"); } finally { Math.random = orig; }
    figures.set(look, f);
  }
  return f;
}
const WALK_SPEED = 1.5; // tiles a second
function walkerPlace(c: Customer, now: number, filledAt: number | null): { x: number; y: number; moving: boolean; dir: number } | null {
  const startX = c.from === -1 ? -1.5 : STREETS_W + 0.5;
  const step = c.from === -1 ? 1 : -1;
  const arriveMs = (Math.abs(c.x - startX) / WALK_SPEED) * 1000;
  const t = now - c.at;
  if (t < arriveMs) return { x: startX + step * WALK_SPEED * (t / 1000), y: c.y, moving: true, dir: step === 1 ? 2 : 6 };
  if (filledAt !== null && now > filledAt + 600) {
    const out = c.x < STREETS_W / 2 ? -1 : 1; // off the screen the nearer way
    const x = c.x + out * WALK_SPEED * ((now - filledAt - 600) / 1000);
    if (x < -2 || x > STREETS_W + 1) return null;
    return { x, y: c.y, moving: true, dir: out === 1 ? 2 : 6 };
  }
  return { x: c.x, y: c.y, moving: false, dir: c.y < ROAD_ROWS.first ? 4 : 0 };
}

export async function mountStreets(o: StreetsOptions): Promise<StreetsApi> {
  const me = o.me;
  let combat = new Map<string, StreetCombat & { deadAt?: number; deadBy?: string }>();
  let filled = new Map<number, number>(); // customer number -> when it was filled
  const hits = new Map<string, number>(); // attacker -> the time of the last hit we have shown
  const splats: Array<{ to: string; dmg: number; at: number }> = [];
  let fightTarget: string | null = null;
  let fightTimer = 0;
  let swinging = false;
  let disposed = false;
  let approach = 0;
  let lastDead = 0;
  let boxes = new Map<string, Customer>();
  void Promise.all(CARS.map((k) => loadNitro(FURNI_KINDS[k].nitro!)));

  const stops = [
    onValue(ref(db, "streetCombat"), (s) => {
      const v = (s.val() ?? {}) as Record<string, StreetCombat & { deadAt?: number; deadBy?: string }>;
      combat = new Map(Object.entries(v));
      const mine = v[me.uid];
      if (mine?.deadAt && mine.deadAt > lastDead && serverNow() - mine.deadAt < 15_000) { lastDead = mine.deadAt; died(mine.deadBy); }
      paintHud();
    }, () => undefined),
    onValue(query(ref(db, "streetFilled"), orderByKey(), limitToLast(60)), (s) => {
      const v = (s.val() ?? {}) as Record<string, { at?: number }>;
      filled = new Map(Object.entries(v).map(([k, r]) => [Number(k), Number(r?.at) || 0]));
    }, () => undefined),
    onValue(ref(db, "rooms/streets/hits"), (s) => {
      const v = (s.val() ?? {}) as Record<string, { to?: string; dmg?: number; at?: number; dead?: boolean }>;
      for (const [by, r] of Object.entries(v)) {
        if (!r || typeof r.at !== "number" || typeof r.to !== "string") continue;
        if ((hits.get(by) ?? 0) >= r.at) continue;
        const first = !hits.size && serverNow() - r.at > 3000; // (what happened before we came in is not shown)
        hits.set(by, r.at);
        if (!first && serverNow() - r.at < 4000) { splats.push({ to: r.to, dmg: Number(r.dmg) || 0, at: performance.now() }); if (r.to === me.uid) playSfx("stab", 0.4); }
      }
    }, () => undefined),
  ];
  // the elevator stops running: everybody on the street rides down (the pass says until when)
  let passUntil = 0;
  stops.push(onValue(ref(db, `streetPass/${me.uid}`), (s) => { passUntil = Number(s.val()) || 0; }, () => undefined));
  const passTimer = window.setInterval(() => {
    if (disposed || !passUntil) return;
    if (serverNow() > passUntil && !inFight()) { toast("The elevator stopped running. You ride down.", "ok"); o.goDown(); }
  }, 2000);

  void call(me, "streetEnter").catch(() => undefined);

  // ---- the panel at the top: hit points, the skull, the bandage, how long the elevator runs ----
  const hpFill = h("i", {});
  const hpText = h("span", { class: "st-hp-text" }, `${PVP.maxHp}/${PVP.maxHp}`);
  const skull = h("span", { class: "st-skull hidden", title: "You started a fight" }, "SKULL");
  const status = h("div", { class: "st-status" });
  const bandBtn = h("button", { class: "st-band", type: "button", onclick: () => { const slot = findSlot(me.inventory, PVP.healItem); if (slot < 0) return o.say("You have no bandage.", "warn"); void api.heal(slot); } }, "Bandage");
  const hud = h("div", { class: "st-hud" }, h("div", { class: "st-hp" }, h("div", { class: "st-hp-bar" }, hpFill, hpText), skull), status, bandBtn);
  o.stage.append(hud);
  function paintHud(): void {
    const c = combat.get(me.uid);
    const now = serverNow();
    const hp = c ? hpNow(c, now) : PVP.maxHp;
    hpFill.style.width = `${Math.max(0, Math.min(100, (hp / PVP.maxHp) * 100))}%`;
    hpFill.className = hp <= 3 ? "low" : "";
    hpText.textContent = `${hp}/${PVP.maxHp}`;
    skull.classList.toggle("hidden", !(c && c.skullUntil > now));
    const fighting = !!c && c.combatUntil > now;
    const prot = !!c && c.protectUntil > now;
    status.textContent = fighting ? "In a fight: you can't leave" : prot ? "Nobody can touch you for a moment" : passUntil > now ? `The elevator stops in ${Math.max(1, Math.round((passUntil - now) / 60000))} min` : "";
    status.classList.toggle("red", fighting);
    bandBtn.classList.toggle("hidden", findSlot(me.inventory, PVP.healItem) < 0);
  }
  const hudTimer = window.setInterval(paintHud, 1000);
  paintHud();

  function died(by?: string): void {
    stopFight();
    o.say(`You were killed${by ? ` by ${o.nameOf(by)}` : ""}. You lost everything you carried. You wake up in your room.`, "warn");
    window.setTimeout(() => { if (!disposed) o.goHome(); }, 1800);
  }

  // ---- fighting: click a player, you walk up to them and keep swinging (like RuneScape) until one of you is gone ----
  const inFight = (): boolean => (combat.get(me.uid)?.combatUntil ?? 0) > serverNow();
  function stopFight(): void { fightTarget = null; window.clearInterval(fightTimer); fightTimer = 0; }
  function fight(uid: string): void {
    if (findSlot(me.inventory, "knife") < 0 && findSlot(me.inventory, "machete") < 0) return o.say("You need a knife to fight.", "warn");
    stopFight();
    fightTarget = uid;
    o.say(`You go for ${o.nameOf(uid)}.`);
    fightTimer = window.setInterval(() => void tick(), 350);
    void tick();
  }
  async function tick(): Promise<void> {
    const uid = fightTarget;
    if (!uid || disposed || swinging) return;
    const mine = o.tileOf(me.uid), theirs = o.tileOf(uid);
    if (!theirs) { stopFight(); return o.say("They've gone.", "warn"); }
    if (!mine) return;
    const d = Math.max(Math.abs(mine.x - theirs.x), Math.abs(mine.y - theirs.y));
    if (d > PVP.reach) { if (Math.random() < 0.6) o.walkTo(theirs); return; } // (follow them)
    swinging = true;
    try {
      await call(me, "streetHit", { target: uid });
    } catch (err) {
      const m = (err as Error).message || "";
      if (/arm is still swinging/i.test(m)) { /* wait for the next tick */ }
      else { stopFight(); o.say(m || "That didn't work.", "warn"); }
    }
    swinging = false;
  }
  async function heal(slot: number): Promise<void> {
    try {
      const r = await call<{ healed: number }>(me, "streetHeal", { slot });
      o.refreshPocket();
      playSfx("give", 0.4);
      o.say(`You use a bandage: +${r.healed} hit points.`);
    } catch (err) { o.say((err as Error).message || "That didn't work.", "warn"); }
  }

  // ---- the order box ----
  let orderBox: HTMLElement | null = null;
  function openOrder(c: Customer): void {
    orderBox?.remove();
    const it = itemDef(c.want.item);
    const have = me.inventory.reduce((n, s) => n + (s && s.item === c.want.item && !s.lit && !s.inPlayer && !s.ass ? s.qty : 0), 0);
    const pay = orderPay(sellPrice(c.want.item, false, {}) ?? 5, c.want);
    const ok = have >= c.want.qty;
    const give = h("button", { class: "btn primary", disabled: !ok, onclick: async () => {
      give.setAttribute("disabled", "");
      try {
        const r = await call<{ pay: number }>(me, "streetFill", { k: c.k });
        o.refreshPocket();
        playSfx("coins", 0.5);
        o.say(`${c.kind === "car" ? "The driver" : "They"} pay${c.kind === "car" ? "s" : ""} ${r.pay} blood. It's a pleasure.`);
        close();
      } catch (err) { toast((err as Error).message || "That didn't work.", "err"); give.removeAttribute("disabled"); }
    } }, ok ? `Give them ${c.want.qty}` : `You have ${have}`);
    const close = (): void => { orderBox?.remove(); orderBox = null; };
    orderBox = h("div", { class: "cd-popup st-order", role: "dialog" },
      h("div", { class: "cd-head" }, h("strong", {}, c.kind === "car" ? "A car pulls over" : "A customer"), h("button", { class: "btn small", onclick: close }, "✕")),
      h("div", { class: "st-order-row" }, it ? h("img", { src: it.icon, alt: "", class: "st-order-ico" }) : null, h("div", {}, h("div", { class: "st-order-want" }, `${c.want.qty} x ${it?.name ?? c.want.item}`), h("div", { class: "hint" }, `Pays ${pay} blood${c.kind === "car" ? " (a big order)" : ""}`))),
      h("div", { class: "cd-row" }, give, h("button", { class: "btn", onclick: close }, "Not now")));
    o.stage.append(orderBox);
  }

  // ---- drawing ----
  const icons = new Map<string, HTMLImageElement>();
  const iconOf = (url: string): HTMLImageElement | null => { let i = icons.get(url); if (!i) { i = new Image(); i.src = url; icons.set(url, i); } return i.complete && i.naturalWidth ? i : null; };
  function drawOrderBubble(g: CanvasRenderingContext2D, cx: number, y: number, c: Customer, scale: number, hot: boolean): void {
    const it = itemDef(c.want.item);
    const text = `x${c.want.qty}`;
    const s = Math.max(1, scale);
    g.save();
    g.font = `bold ${Math.round(12 * s)}px Verdana, sans-serif`;
    const icon = 20 * s;
    const tw = g.measureText(text).width;
    const w = icon + tw + 16 * s, hh = 26 * s;
    const x = cx - w / 2, yy = y - hh;
    g.fillStyle = hot ? "#fff6c8" : "#ffffff";
    g.strokeStyle = c.kind === "car" ? "#d4a017" : "#444";
    g.lineWidth = Math.max(1, s);
    g.beginPath(); g.roundRect(x, yy, w, hh, 8 * s); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 5 * s, yy + hh - 0.5); g.lineTo(cx, yy + hh + 6 * s); g.lineTo(cx + 5 * s, yy + hh - 0.5); g.closePath(); g.fillStyle = hot ? "#fff6c8" : "#fff"; g.fill(); g.stroke();
    g.fillStyle = hot ? "#fff6c8" : "#fff"; g.fillRect(cx - 4.5 * s, yy + hh - 1.5, 9 * s, 3);
    const im = it ? iconOf(it.icon) : null;
    if (im) { g.imageSmoothingEnabled = false; g.drawImage(im, x + 5 * s, yy + 3 * s, icon, icon); }
    g.fillStyle = c.kind === "car" ? "#8a5a00" : "#222";
    g.textBaseline = "middle"; g.textAlign = "left";
    g.fillText(text, x + icon + 9 * s, yy + hh / 2 + 1);
    g.restore();
  }

  function draw(f: StreetsFrame): void {
    const now = serverNow();
    const { g, scale } = f;
    boxes = new Map();
    // the cars that drive by
    const slot = Math.floor(now / AMBIENT_EVERY_MS);
    for (let j = slot; j > slot - Math.ceil(AMBIENT_LIFE_MS / AMBIENT_EVERY_MS) - 1; j--) {
      const car = ambientCar(j, now);
      if (car) drawCar(f, car, null);
    }
    // the customers (the ones that were filled walk off, or drive off, before they disappear)
    const last = Math.floor(now / CUSTOMER_EVERY_MS);
    for (let k = last; k > last - Math.ceil(CAR_STAY_MS / CUSTOMER_EVERY_MS) - 6; k--) {
      const c = customerAt(k);
      const fa = filled.get(k) ?? null;
      if (now < c.at) continue;
      if (fa === null && now >= c.until) continue; // (gone: nobody filled it)
      if (fa !== null && now - fa > 20_000) continue;
      boxes.set(`cust:${k}`, c);
      if (c.kind === "car") { const car = customerCar(c, now, fa); if (car) drawCar(f, car, c, fa === null && car.stopped); }
      else drawWalker(f, c, fa);
    }
  }
  function drawCar(f: StreetsFrame, car: Car, c: Customer | null, waiting = false): void {
    const kind = FURNI_KINDS[car.kind];
    const n = nitroIfReady(kind.nitro!);
    // the art is drawn around the sprites' own centre, so a long car sits in its lane whatever its size: the middle of its shadow (the part on the ground) goes on the lane
    let offX = 0;
    if (n) {
      const sh = spritesFor(n, CAR_DIR).filter((sp) => sp.isShadow);
      const use = sh.length ? sh : spritesFor(n, CAR_DIR);
      if (use.length) offX = (Math.min(...use.map((sp) => sp.dx)) + Math.max(...use.map((sp) => sp.dx + sp.sw))) / 2;
    }
    const depth = car.x + car.y + 0.4;
    f.list.push({ depth, draw: () => {
      const ts = (p: Pt): Pt => { const q = f.toScreen(p); return { x: q.x - offX * f.scale, y: q.y }; };
      const box = drawNitroFurni(f.g, car.kind, car.x, car.y, CAR_DIR, ts, f.scale);
      if (c && box && waiting) {
        const cx = (box.x0 + box.x1) / 2;
        const hot = f.hoverId === `cust:${c.k}`;
        drawOrderBubble(f.g, cx, box.y0 - 2 * f.scale, c, f.scale, hot);
        f.objs.push({ id: `cust:${c.k}`, kind: "scustomer", x0: box.x0, y0: box.y0 - 30 * f.scale, x1: box.x1, y1: box.y1, depth });
      }
    } });
  }
  function drawWalker(f: StreetsFrame, c: Customer, fa: number | null): void {
    const now = serverNow();
    const place = walkerPlace(c, now, fa);
    if (!place) return;
    const opts = { figure: figureOf(c.look), dir: place.dir, headDir: place.dir, actions: place.moving ? ["wlk"] : ["std"], gesture: "std", frame: place.moving ? Math.floor(now / 140) % 4 : 0 };
    let img = getCached(opts);
    if (!img) { void renderAvatar(opts); }
    const w = f.iso(place.x, place.y);
    const feet = f.toScreen({ x: w.x, y: w.y + f.tileHeight / 2 });
    const depth = place.x + place.y + 0.5;
    const waiting = fa === null && !place.moving;
    const hot = f.hoverId === `cust:${c.k}`;
    f.list.push({ depth, draw: () => {
      const g = f.g;
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.beginPath(); g.ellipse(feet.x, feet.y, 14 * f.scale, 6 * f.scale, 0, 0, Math.PI * 2); g.fill();
      if (!img) img = getCached(opts);
      if (img) g.drawImage(img, feet.x - (32 + padOf(img).x) * f.scale, feet.y - (FEET_Y + padOf(img).y) * f.scale, img.width * f.scale, img.height * f.scale);
      if (waiting) drawOrderBubble(g, feet.x, feet.y - (FEET_Y + 6) * f.scale, c, f.scale, hot);
    } });
    if (waiting) f.objs.push({ id: `cust:${c.k}`, kind: "scustomer", x0: feet.x - 24 * f.scale, y0: feet.y - (FEET_Y + 28) * f.scale, x1: feet.x + 24 * f.scale, y1: feet.y + 8 * f.scale, depth });
  }

  function drawPlayer(g: CanvasRenderingContext2D, uid: string, cx: number, headY: number, scale: number, now: number): void {
    const c = combat.get(uid);
    const t = serverNow();
    const s = Math.max(1, scale);
    const hurtOrFighting = !!c && (hpNow(c, t) < PVP.maxHp || c.combatUntil > t);
    if (c && hurtOrFighting) {
      const w = 40 * s, hh = 5 * s, x = cx - w / 2, y = headY - 4 * s;
      g.save();
      g.fillStyle = "rgba(0,0,0,.7)"; g.fillRect(x - 1, y - 1, w + 2, hh + 2);
      g.fillStyle = "#b02a2a"; g.fillRect(x, y, w, hh);
      g.fillStyle = "#3fae2a"; g.fillRect(x, y, (w * hpNow(c, t)) / PVP.maxHp, hh);
      g.restore();
    }
    if (c && c.skullUntil > t) { // a red skull tag over the head of the one who started a fight
      g.save(); g.fillStyle = "#d02020"; g.strokeStyle = "#fff"; g.lineWidth = 1;
      const sx = cx, sy = headY - 18 * s;
      g.beginPath(); g.arc(sx, sy, 6 * s, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "#fff"; g.fillRect(sx - 3 * s, sy - 2 * s, 2 * s, 2.5 * s); g.fillRect(sx + 1 * s, sy - 2 * s, 2 * s, 2.5 * s); g.fillRect(sx - 1 * s, sy + 2 * s, 2 * s, 2.5 * s);
      g.restore();
    }
    for (const sp of splats) {
      if (sp.to !== uid) continue;
      const age = now - sp.at;
      if (age > 1300) continue;
      const lift = (age / 1300) * 18 * s;
      g.save();
      g.globalAlpha = age > 900 ? 1 - (age - 900) / 400 : 1;
      g.fillStyle = sp.dmg > 0 ? "#d02020" : "#2a6fd0"; g.strokeStyle = "#fff"; g.lineWidth = 1.5;
      g.beginPath(); g.arc(cx + 12 * s, headY + 18 * s - lift, 9 * s, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "#fff"; g.font = `bold ${Math.round(11 * s)}px Verdana, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(sp.dmg), cx + 12 * s, headY + 18.5 * s - lift);
      g.restore();
    }
    while (splats.length && now - splats[0].at > 1400) splats.shift();
  }

  const api: StreetsApi = {
    draw,
    click(objId) {
      if (!objId.startsWith("cust:")) return false;
      const c = boxes.get(objId);
      if (!c) return true;
      const tile = o.tileOf(me.uid);
      const dist = (): number => { const t = o.tileOf(me.uid); return t ? Math.hypot(t.x - c.x, t.y - c.y) : 0; };
      if (!tile || dist() <= 3) { openOrder(c); return true; }
      // too far: you walk over, and the order box opens when you are close
      o.say("You walk over.");
      o.walkTo({ x: Math.max(0, Math.min(STREETS_W - 1, Math.round(c.x))), y: Math.max(0, Math.min(STREETS_H - 1, Math.round(c.y))) });
      window.clearInterval(approach);
      let waited = 0;
      approach = window.setInterval(() => {
        waited += 300;
        if (disposed || waited > 12_000) return window.clearInterval(approach);
        if (dist() <= 3) { window.clearInterval(approach); if (boxes.has(objId) || true) openOrder(c); }
      }, 300);
      return true;
    },
    hoverText(objId) {
      const c = boxes.get(objId);
      return c ? `${c.kind === "car" ? "Car" : "Customer"}: wants ${c.want.qty} x ${itemDef(c.want.item)?.name ?? c.want.item}` : null;
    },
    drawPlayer, fight, stopFight, inFight, heal,
    fighting: (uid) => (combat.get(uid)?.combatUntil ?? 0) > serverNow(),
    dispose() {
      disposed = true;
      stopFight();
      window.clearInterval(approach);
      stops.forEach((s) => s());
      window.clearInterval(passTimer);
      window.clearInterval(hudTimer);
      hud.remove();
      orderBox?.remove();
    },
  };
  void STREETS_H;
  void (null as unknown as Box);
  return api;
}
