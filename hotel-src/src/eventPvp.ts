// The fighting in the changed concert room (rules and numbers: src/shared/event.ts, the server: server/src/actions/event.ts). Everybody holds a knife; tap a player and you walk up to them and swing.
// It is the street's fight with nothing to lose: hit points over the heads, the numbers that fly up, and a bar at the top. room.ts calls into this only while the changed room is on.
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { call, serverNow } from "./db";
import type { Profile } from "./db";
import { h } from "./ui/dom";
import { EVENT_PROTECT_MS, EVENT_PVP, KILL_WAKE_MS } from "./shared/event";

const FEET_Y = 94;

export interface EventPvpOptions {
  me: Profile;
  stage: HTMLElement;
  say: (text: string, kind?: "warn") => void;
  /** the tile somebody stands on (null if they aren't here) */
  tileOf: (uid: string) => { x: number; y: number } | null;
  nameOf: (uid: string) => string;
  walkTo: (t: { x: number; y: number }) => void;
  /** when the surprise was set off (server time): the fighting is allowed EVENT_PROTECT_MS after the room has changed */
  killAt: () => number;
}
export interface EventPvpApi {
  fight(uid: string): void;
  stopFight(): void;
  /** over the head of a player: hit points and the numbers that fly up */
  drawPlayer(g: CanvasRenderingContext2D, uid: string, cx: number, headY: number, scale: number, now: number): void;
  dispose(): void;
}

export function mountEventPvp(o: EventPvpOptions): EventPvpApi {
  const me = o.me;
  let hp = new Map<string, number>();
  const hits = new Map<string, number>(); // attacker -> the time of the last hit shown
  const splats: Array<{ to: string; dmg: number; at: number }> = [];
  let target: string | null = null;
  let timer = 0;
  let swinging = false;
  let readyAt = 0;
  let disposed = false;

  const stops = [
    onValue(ref(db, "event/hp"), (s) => { hp = new Map(Object.entries((s.val() ?? {}) as Record<string, number>).map(([k, v]) => [k, Number(v)])); paintHud(); }, () => undefined),
    onValue(ref(db, "rooms/stage/hits"), (s) => {
      const v = (s.val() ?? {}) as Record<string, { to?: string; dmg?: number; at?: number }>;
      for (const [by, r] of Object.entries(v)) {
        if (!r || typeof r.at !== "number" || typeof r.to !== "string") continue;
        if ((hits.get(by) ?? 0) >= r.at) continue;
        const first = !hits.size && serverNow() - r.at > 3000; // (what happened before we came in is not shown)
        hits.set(by, r.at);
        if (!first && serverNow() - r.at < 4000) splats.push({ to: r.to, dmg: Number(r.dmg) || 0, at: performance.now() });
      }
    }, () => undefined),
  ];

  // ---- the bar at the top (the street's look) ----
  const hpFill = h("i", {});
  const hpText = h("span", { class: "st-hp-text" }, `${EVENT_PVP.maxHp}/${EVENT_PVP.maxHp}`);
  const status = h("div", { class: "st-status" });
  const hud = h("div", { class: "st-hud" }, h("div", { class: "st-hp" }, h("div", { class: "st-hp-bar" }, hpFill, hpText)), status);
  o.stage.append(hud);
  const protectedUntil = (): number => o.killAt() + KILL_WAKE_MS + EVENT_PROTECT_MS;
  function paintHud(): void {
    const mine = hp.get(me.uid) ?? EVENT_PVP.maxHp;
    hpFill.style.width = `${Math.max(0, Math.min(100, (mine / EVENT_PVP.maxHp) * 100))}%`;
    hpFill.className = mine <= 3 ? "low" : "";
    hpText.textContent = `${mine}/${EVENT_PVP.maxHp}`;
    const prot = serverNow() < protectedUntil();
    status.textContent = prot ? "Nobody can touch you for a moment" : "";
    status.classList.toggle("red", !prot && target !== null);
  }
  const hudTimer = window.setInterval(paintHud, 1000);
  paintHud();

  // ---- fighting: tap a player and you walk up to them and swing; follow them if they run ----
  function stopFight(): void { target = null; window.clearInterval(timer); timer = 0; }
  function fight(uid: string): void {
    if (serverNow() < protectedUntil()) return o.say("Nobody can be touched yet.", "warn");
    stopFight();
    target = uid;
    timer = window.setInterval(() => void tick(), 350);
    void tick();
  }
  async function tick(): Promise<void> {
    const uid = target;
    if (!uid || disposed || swinging) return;
    const mine = o.tileOf(me.uid), theirs = o.tileOf(uid);
    if (!theirs) { stopFight(); return o.say("They've gone.", "warn"); }
    if (!mine) return;
    const d = Math.max(Math.abs(mine.x - theirs.x), Math.abs(mine.y - theirs.y));
    if (d > EVENT_PVP.reach) { o.walkTo(theirs); return; } // (too far: walk up, and follow them if they run)
    if (serverNow() < readyAt) return; // (the arm is still swinging: the swing comes the moment it is ready)
    swinging = true;
    try {
      const r = await call<{ died?: boolean }>(me, "eventHit", { target: uid });
      readyAt = serverNow() + EVENT_PVP.swingMs;
      stopFight(); // (one tap, one swing)
      if (r.died) o.say(`You killed ${o.nameOf(uid)}.`);
    } catch (err) {
      const m = (err as Error).message || "";
      if (/arm is still swinging/i.test(m)) readyAt = serverNow() + 400;
      else { stopFight(); o.say(m || "That didn't work.", "warn"); }
    }
    swinging = false;
  }

  function drawPlayer(g: CanvasRenderingContext2D, uid: string, cx: number, headY: number, scale: number, now: number): void {
    const s = Math.max(1, scale);
    const v = hp.get(uid);
    if (v !== undefined && v < EVENT_PVP.maxHp) {
      const w = 40 * s, hh = 5 * s, x = cx - w / 2, y = headY - 4 * s;
      g.save();
      g.fillStyle = "rgba(0,0,0,.7)"; g.fillRect(x - 1, y - 1, w + 2, hh + 2);
      g.fillStyle = "#b02a2a"; g.fillRect(x, y, w, hh);
      g.fillStyle = "#3fae2a"; g.fillRect(x, y, (w * Math.max(0, v)) / EVENT_PVP.maxHp, hh);
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
    void FEET_Y;
  }

  return {
    fight, stopFight, drawPlayer,
    dispose() { disposed = true; stopFight(); window.clearInterval(hudTimer); stops.forEach((f) => f()); hud.remove(); },
  };
}
