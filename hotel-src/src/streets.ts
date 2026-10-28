// The streets in the browser (rules and numbers: src/shared/streets.ts, the server: server/src/actions/streets.ts): the customers and their orders, the cars, the fights and the
// hit points, the little panel at the top, and the elevator's pass running out. room.ts calls into this for the street room only.
import { onValue, orderByKey, limitToLast, query, ref, update } from "firebase/database";
import { db } from "./firebase";
import { call, serverNow } from "./db";
import type { Profile } from "./db";
import { getCached, renderAvatar } from "./avatarService";
import { drawNitroFurni } from "./roomRender";
import type { Box, Pt } from "./roomRender";
import { loadNitro, nitroIfReady, spritesFor } from "./nitro";
import { FURNI_KINDS } from "./rooms";
import { figureToString, itemsFor, parseFigure, randomFigure, swatchesFor } from "./catalog";
import { drawPet, petSheet } from "./pets";
import { PET_COLORS } from "./shared/pets";
import { streetUnit } from "./shared/darkweb";
import { itemDef } from "./items";
import { findSlot } from "./shared/items";
import { h, toast } from "./ui/dom";
import { setLeaveLock } from "./leaveLock";
import { playSfx } from "./sfx";
import { bestWeapon, customerAt, RICH_PETS, STREET_TICK_MS, hpNow, orderPay, PVP, ROAD_ROWS, seeded, STREETS_H, STREETS_W } from "./shared/streets";
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
  /** over the head of a player: hit points, the numbers that fly up */
  drawPlayer(g: CanvasRenderingContext2D, uid: string, cx: number, headY: number, scale: number, now: number): void;
  fight(uid: string): void;
  stopFight(): void;
  inFight(): boolean;
  /** fire a gun from a pocket slot at somebody on the street (0 to 5 hit points, one every 30 seconds) */
  shoot(uid: string, slot: number): Promise<void>;
  /** who you are going for right now (the one you clicked) */
  target(): string | null;
  /** somebody is in a fight right now (used to keep the body of a player who closed the game in it) */
  fighting(uid: string): boolean;
  heal(slot: number): Promise<void>;
  dispose(): void;
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
/** a rich customer's look: the clothes of a customer, and an unusual hat (one that costs something in the clothing shop, if there is one) */
function richFigureOf(look: number): string {
  const key = look + 1_000_000;
  let f = figures.get(key);
  if (!f) {
    const r = seeded(look * 31 + 7);
    const gender = look % 2 ? "M" : "F";
    const parts = parseFigure(figureOf(look));
    const all = itemsFor("ha", gender);
    const dear = all.filter((i) => i.price > 0);
    const pool = dear.length ? dear : all;
    const hat = pool.length ? pool[Math.floor(r() * pool.length)] : undefined;
    if (hat) {
      const sw = swatchesFor("ha");
      parts.ha = { id: hat.id, colors: Array.from({ length: hat.colors }, () => sw[Math.floor(r() * sw.length)]?.id ?? "1") };
    }
    f = figureToString(parts);
    figures.set(key, f);
  }
  return f;
}
/** half of the rich customers have a rare pet walking with them */
function richPetOf(look: number): { type: string; palette: number } | null {
  const r = seeded(look * 17 + 3);
  if (r() < 0.5) return null;
  const type = RICH_PETS[Math.floor(r() * RICH_PETS.length)];
  const colors = PET_COLORS[type] ?? 0;
  return { type, palette: colors > 0 ? Math.floor(r() * colors) : 0 };
}
const WALK_SPEED = 2.2; // tiles a second (the street is long)
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
  let customers = new Map<number, { at: number; until: number }>(); // the customers the server has let turn up: number -> when they came and when they leave
  const hits = new Map<string, number>(); // attacker -> the time of the last hit we have shown
  const splats: Array<{ to: string; dmg: number; at: number }> = [];
  let fightTarget: string | null = null;
  let fightTimer = 0;
  let swinging = false;
  let disposed = false;
  let approach = 0;
  let lastDead = 0;
  let boxes = new Map<string, Customer>();

  const stops = [
    onValue(ref(db, "streetCombat"), (s) => {
      const v = (s.val() ?? {}) as Record<string, StreetCombat & { deadAt?: number; deadBy?: string }>;
      combat = new Map(Object.entries(v));
      const mine = v[me.uid];
      if (mine?.deadAt && mine.deadAt > lastDead && serverNow() - mine.deadAt < 15_000) { lastDead = mine.deadAt; died(mine.deadBy, mine.deadAt); }
      paintHud();
    }, () => undefined),
    onValue(query(ref(db, "streetFilled"), orderByKey(), limitToLast(60)), (s) => {
      const v = (s.val() ?? {}) as Record<string, { at?: number }>;
      filled = new Map(Object.entries(v).map(([k, r]) => [Number(k), Number(r?.at) || 0]));
    }, () => undefined),
    onValue(query(ref(db, "streetCust"), orderByKey(), limitToLast(60)), (s) => {
      const v = (s.val() ?? {}) as Record<string, { at?: number; until?: number }>;
      customers = new Map(Object.entries(v).map(([k, r]) => [Number(k), { at: Number(r?.at) || 0, until: Number(r?.until) || 0 }]));
    }, () => undefined),
    onValue(ref(db, "rooms/streets/hits"), (s) => {
      const v = (s.val() ?? {}) as Record<string, { to?: string; dmg?: number; at?: number; dead?: boolean }>;
      for (const [by, r] of Object.entries(v)) {
        if (!r || typeof r.at !== "number" || typeof r.to !== "string") continue;
        if ((hits.get(by) ?? 0) >= r.at) continue;
        const first = !hits.size && serverNow() - r.at > 3000; // (what happened before we came in is not shown)
        hits.set(by, r.at);
        if (!first && serverNow() - r.at < 4000) {
          splats.push({ to: r.to, dmg: Number(r.dmg) || 0, at: performance.now() });
        }
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
  // customers turn up while players are on the street (the server counts: 2 a minute for each player, 18 at most); every browser here asks now and then
  const customerTick = window.setInterval(() => { if (!disposed && !document.hidden) void call(me, "streetTick").catch(() => undefined); }, STREET_TICK_MS);
  window.setTimeout(() => { if (!disposed) void call(me, "streetTick").catch(() => undefined); }, 1500);

  // ---- the panel at the top: hit points, the bandage, how long the elevator runs ----
  const hpFill = h("i", {});
  const hpText = h("span", { class: "st-hp-text" }, `${PVP.maxHp}/${PVP.maxHp}`);
  const status = h("div", { class: "st-status" });
  const bandBtn = h("button", { class: "st-band", type: "button", onclick: () => { const slot = findSlot(me.inventory, PVP.healItem); if (slot < 0) return o.say("You have no bandage.", "warn"); void api.heal(slot); } }, "Bandage");
  const hud = h("div", { class: "st-hud" }, h("div", { class: "st-hp" }, h("div", { class: "st-hp-bar" }, hpFill, hpText)), status, bandBtn);
  o.stage.append(hud);
  function paintHud(): void {
    const c = combat.get(me.uid);
    const now = serverNow();
    const hp = c ? hpNow(c, now) : PVP.maxHp;
    hpFill.style.width = `${Math.max(0, Math.min(100, (hp / PVP.maxHp) * 100))}%`;
    hpFill.className = hp <= 3 ? "low" : "";
    hpText.textContent = `${hp}/${PVP.maxHp}`;
    const fighting = !!c && c.combatUntil > now;
    const prot = !!c && c.protectUntil > now;
    status.textContent = fighting ? "In a fight: you can't leave" : prot ? "Nobody can touch you for a moment" : passUntil > now ? `The elevator stops in ${Math.max(1, Math.round((passUntil - now) / 60000))} min` : "";
    status.classList.toggle("red", fighting);
    bandBtn.classList.toggle("hidden", findSlot(me.inventory, PVP.healItem) < 0);
  }
  const hudTimer = window.setInterval(paintHud, 1000);
  paintHud();

  /** how long the "you're dead" screen stays before you wake up in your room */
  const DEAD_MS = 15_000;
  let deadBox: HTMLElement | null = null;
  let deadTimer = 0;
  function died(by: string | undefined, at: number): void {
    stopFight();
    o.say(`You were killed${by ? ` by ${o.nameOf(by)}` : ""}. You lost what you carried (not your knife) and 25 blood.`, "warn");
    update(ref(db, `rooms/streets/players/${me.uid}`), { lay: true, sit: null }).catch(() => undefined); // (everybody sees you on the ground)
    deadBox?.remove();
    const secs = h("b", { class: "st-dead-secs" }, "");
    deadBox = h("div", { class: "st-dead" }, h("div", { class: "st-dead-card" }, h("div", { class: "st-dead-title" }, "You're dead"), h("div", { class: "st-dead-sub" }, "You wake up in your room in ", secs, " s")));
    o.stage.append(deadBox);
    const paint = (): void => {
      const left = Math.max(0, DEAD_MS - (serverNow() - at));
      secs.textContent = String(Math.ceil(left / 1000));
      if (left > 0 || disposed) return;
      window.clearInterval(deadTimer); deadTimer = 0;
      deadBox?.remove(); deadBox = null;
      update(ref(db, `rooms/streets/players/${me.uid}`), { lay: null }).catch(() => undefined);
      o.goHome();
    };
    window.clearInterval(deadTimer);
    deadTimer = window.setInterval(paint, 250);
    paint();
  }

  // ---- fighting: click a player and you walk up to them and swing once; a number over their head counts down to your next swing (nobody hits back by themselves) ----
  const inFight = (): boolean => (combat.get(me.uid)?.combatUntil ?? 0) > serverNow();
  setLeaveLock(inFight);
  /** when your knife (and the gun) can be used again, and who you last attacked: the number over their head counts down to it */
  let knifeReadyAt = 0, gunReadyAt = 0;
  let lastTarget: { uid: string; weapon: "knife" | "gun" } | null = null;
  function stopFight(): void { fightTarget = null; window.clearInterval(fightTimer); fightTimer = 0; }
  function fight(uid: string): void {
    if (!bestWeapon(me.inventory)) return o.say("You need a knife to fight.", "warn");
    stopFight();
    fightTarget = uid;
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
    if (d > PVP.reach) { o.walkTo(theirs); return; } // (they ran: follow them, and swing as soon as they are within reach)
    if (serverNow() < knifeReadyAt) return; // (the arm is still swinging: the swing comes the moment it is ready)
    swinging = true;
    try {
      const r = await call<{ died?: boolean; looted?: number; spilled?: number }>(me, "streetHit", { target: uid });
      knifeReadyAt = serverNow() + PVP.swingMs;
      lastTarget = { uid, weapon: "knife" };
      stopFight(); // (one click, one swing)
      if (r.died) { o.refreshPocket(); o.say(`You killed ${o.nameOf(uid)}.${r.looted ? ` You took ${r.looted} ${r.looted === 1 ? "thing" : "things"} from them.` : ""}${r.spilled ? " What didn't fit in your pocket lies on the floor." : ""}`); }
    } catch (err) {
      const m = (err as Error).message || "";
      if (/arm is still swinging/i.test(m)) { knifeReadyAt = serverNow() + 400; /* a moment more */ }
      else { stopFight(); o.say(m || "That didn't work.", "warn"); }
    }
    swinging = false;
  }
  async function shoot(uid: string, slot: number): Promise<void> {
    const wait = gunReadyAt - serverNow();
    if (wait > 0) return o.say(`Reloading: ${Math.ceil(wait / 1000)} more seconds.`, "warn");
    try {
      const r = await call<{ dmg: number; died?: boolean; looted?: number; spilled?: number }>(me, "streetShoot", { target: uid, slot });
      gunReadyAt = serverNow() + PVP.gunCooldownMs;
      lastTarget = { uid, weapon: "gun" };
      o.refreshPocket();
      o.say(r.dmg ? `Bang! You hit ${o.nameOf(uid)} for ${r.dmg}.` : `Bang! You miss ${o.nameOf(uid)}.`);
      if (r.died) o.say(`You killed ${o.nameOf(uid)}.${r.looted ? ` You took ${r.looted} ${r.looted === 1 ? "thing" : "things"} from them.` : ""}${r.spilled ? " What didn't fit in your pocket lies on the floor." : ""}`);
    } catch (err) { o.say((err as Error).message || "The gun won't fire.", "warn"); }
  }
  async function heal(slot: number): Promise<void> {
    try {
      const r = await call<{ healed: number }>(me, "streetHeal", { slot });
      o.refreshPocket();
      playSfx("give", 0.4);
      knifeReadyAt = Math.max(knifeReadyAt, serverNow() + PVP.swingMs); // (eating takes the place of a swing)
      o.say(`You use a bandage: +${r.healed} hit points.`);
    } catch (err) { o.say((err as Error).message || "That didn't work.", "warn"); }
  }

  // ---- the order box ----
  let orderBox: HTMLElement | null = null;
  function openOrder(c: Customer): void {
    orderBox?.remove();
    const it = itemDef(c.want.item);
    const have = me.inventory.reduce((n, s) => n + (s && s.item === c.want.item && !s.lit && !s.inPlayer && !s.ass ? s.qty : 0), 0);
    const pay = orderPay(streetUnit(c.want.item), c.want);
    const ok = have >= c.want.qty;
    const give = h("button", { class: "btn primary", disabled: !ok, onclick: async () => {
      give.setAttribute("disabled", "");
      try {
        const r = await call<{ pay: number }>(me, "streetFill", { k: c.k });
        o.refreshPocket();
        playSfx("coins", 0.5);
        o.say(`${c.kind === "rich" ? "The rich customer pays" : "They pay"} ${r.pay} blood. It's a pleasure.`);
        close();
      } catch (err) { toast((err as Error).message || "That didn't work.", "err"); give.removeAttribute("disabled"); }
    } }, ok ? `Give them ${c.want.qty}` : `You have ${have}`);
    const close = (): void => { orderBox?.remove(); orderBox = null; };
    orderBox = h("div", { class: "cd-popup st-order", role: "dialog" },
      h("div", { class: "cd-head" }, h("strong", {}, c.kind === "rich" ? "A rich customer" : "A customer"), h("button", { class: "btn small", onclick: close }, "✕")),
      h("div", { class: "st-order-row" }, it ? h("img", { src: it.icon, alt: "", class: "st-order-ico" }) : null, h("div", {}, h("div", { class: "st-order-want" }, `${c.want.qty} x ${it?.name ?? c.want.item}`), h("div", { class: "hint" }, `Pays ${pay} blood${c.kind === "rich" ? " (they pay well)" : ""}`))),
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
    g.strokeStyle = c.kind === "rich" ? "#d4a017" : "#444";
    g.lineWidth = Math.max(1, s);
    g.beginPath(); g.roundRect(x, yy, w, hh, 8 * s); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 5 * s, yy + hh - 0.5); g.lineTo(cx, yy + hh + 6 * s); g.lineTo(cx + 5 * s, yy + hh - 0.5); g.closePath(); g.fillStyle = hot ? "#fff6c8" : "#fff"; g.fill(); g.stroke();
    g.fillStyle = hot ? "#fff6c8" : "#fff"; g.fillRect(cx - 4.5 * s, yy + hh - 1.5, 9 * s, 3);
    const im = it ? iconOf(it.icon) : null;
    if (im) { g.imageSmoothingEnabled = false; g.drawImage(im, x + 5 * s, yy + 3 * s, icon, icon); }
    g.fillStyle = c.kind === "rich" ? "#8a5a00" : "#222";
    g.textBaseline = "middle"; g.textAlign = "left";
    g.fillText(text, x + icon + 9 * s, yy + hh / 2 + 1);
    g.restore();
  }

  function draw(f: StreetsFrame): void {
    const now = serverNow();
    const { g, scale } = f;
    boxes = new Map();
    // over the door: how long until you may leave (10 seconds after the last blow, and a new blow starts it again)
    const leaveIn = (combat.get(me.uid)?.combatUntil ?? 0) - now;
    if (leaveIn > 0) {
      const d = f.iso(2, 0); // (the door is in the back wall at tile 2: see streetsDef)
      const at = f.toScreen({ x: d.x, y: d.y + f.tileHeight / 2 });
      f.list.push({ depth: 10_000, draw: () => {
        const sc = Math.max(1, f.scale), x = at.x, y = at.y - 118 * f.scale;
        g.save();
        g.fillStyle = "rgba(150,20,20,.92)"; g.strokeStyle = "#fff"; g.lineWidth = Math.max(1.5, 1.5 * sc);
        g.beginPath(); g.arc(x, y, 13 * sc, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = "#fff"; g.font = `bold ${Math.round(15 * sc)}px Verdana, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(Math.ceil(leaveIn / 1000)), x, y + 1);
        g.restore();
      } });
    }
    // the customers (the ones that were filled walk off, or drive off, before they disappear)
    for (const [k, row] of customers) {
      const c = customerAt(k, row.at);
      c.until = row.until;
      let fa = filled.get(k) ?? null;
      if (now < c.at) continue;
      if (fa === null && now >= c.until) fa = c.until; // (nobody served them in time: they give up and walk away, the way a served one does)
      if (fa !== null && now - fa > 20_000) continue;
      boxes.set(`cust:${k}`, c);
      drawWalker(f, c, fa);
    }
  }
  function drawWalker(f: StreetsFrame, c: Customer, fa: number | null): void {
    const now = serverNow();
    const place = walkerPlace(c, now, fa);
    if (!place) return;
    const opts = { figure: c.kind === "rich" ? richFigureOf(c.look) : figureOf(c.look), dir: place.dir, headDir: place.dir, actions: place.moving ? ["wlk"] : ["std"], gesture: "std", frame: place.moving ? Math.floor(now / 140) % 4 : 0 };
    let img = getCached(opts);
    if (!img) { void renderAvatar(opts); }
    const w = f.iso(place.x, place.y);
    const feet = f.toScreen({ x: w.x, y: w.y + f.tileHeight / 2 });
    const depth = place.x + place.y + 0.5;
    const waiting = fa === null && !place.moving;
    const pet = c.kind === "rich" ? richPetOf(c.look) : null;
    const hot = f.hoverId === `cust:${c.k}`;
    f.list.push({ depth, draw: () => {
      const g = f.g;
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.beginPath(); g.ellipse(feet.x, feet.y, 14 * f.scale, 6 * f.scale, 0, 0, Math.PI * 2); g.fill();
      if (!img) img = getCached(opts);
      if (pet) { // the pet walks at its owner's side (a step behind)
        const sheet = petSheet(pet.type, pet.palette);
        if (sheet) drawPet(g, sheet, place.moving ? "mv" : "std", place.dir, place.moving ? Math.floor(now / 160) : 0, feet.x + (place.dir === 2 || place.dir === 3 ? -26 : 26) * f.scale, feet.y + 4 * f.scale, f.scale);
      }
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
    // the number over the head of the one you last attacked: how long until you can attack again
    if (lastTarget && lastTarget.uid === uid) {
      const remain = (lastTarget.weapon === "gun" ? gunReadyAt : knifeReadyAt) - t;
      if (remain > 0) {
        const text = remain >= 10_000 ? String(Math.ceil(remain / 1000)) : (remain / 1000).toFixed(1);
        g.save();
        g.font = `bold ${Math.round(13 * s)}px Verdana, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.lineWidth = 3 * s; g.strokeStyle = "rgba(0,0,0,.85)"; g.strokeText(text, cx, headY - 20 * s);
        g.fillStyle = lastTarget.weapon === "gun" ? "#ffd54a" : "#ffffff"; g.fillText(text, cx, headY - 20 * s);
        g.restore();
      }
    }
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
      return c ? `${c.kind === "rich" ? "Rich customer" : "Customer"}: wants ${c.want.qty} x ${itemDef(c.want.item)?.name ?? c.want.item}` : null;
    },
    drawPlayer, fight, shoot, stopFight, inFight, heal,
    target: () => fightTarget,
    fighting: (uid) => (combat.get(uid)?.combatUntil ?? 0) > serverNow(),
    dispose() {
      disposed = true;
      window.clearInterval(deadTimer);
      window.clearInterval(customerTick);
      deadBox?.remove();
      setLeaveLock(null);
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
