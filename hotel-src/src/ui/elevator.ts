import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { call, serverNow } from "../db";
import { h, toast } from "./dom";
import { itemDef, BLOOD_ICON } from "../items";
import { findSlot } from "../shared/items";
import { playSfx } from "../sfx";
import { elevatorRuns, fmtWhen, runHoursOn, TICKET_ITEM, TICKET_PRICE, TICKET_STOCK } from "../shared/streets";
import type { Ctx } from "../main";

export interface ElevatorApi { close(): void }

/**
 * The elevator window. In the basement: the ticket (50 blood, 50 a day, one per player), when it runs (20 to 21), and the ride up (the ticket is used up). In the arrival room: the ride back down.
 * `onRide` is told where to go once the server has said yes.
 */
export function openElevator(host: HTMLElement, ctx: Ctx, where: "lobby" | "arrival", onRide: (dir: "up" | "down") => void, onClose: () => void): ElevatorApi {
  const me = ctx.profile;
  let sold = 0;
  let force = 0;
  let pass = 0;
  let busy = false;
  let closed = false;
  const body = h("div", { class: "sixty-body el-body" });
  const el = h("div", { class: "cd-popup sixty-shop el", role: "dialog", "aria-label": "Elevator" },
    h("div", { class: "cd-head" }, h("strong", {}, "Elevator"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);

  let soldFor = "";
  const watchSold = (): void => { // the tickets are counted for each run of the elevator (the one that is on, or the next)
    const key = elevatorRuns(serverNow(), force).windowKey;
    if (key === soldFor) return;
    soldFor = key; sold = 0;
    soldOff();
    soldOff = onValue(ref(db, `streetTickets/${key}/sold`), (s) => { sold = Number(s.val()) || 0; render(); }, () => undefined);
  };
  let soldOff: () => void = () => undefined;
  const stops = [
    () => soldOff(),
    onValue(ref(db, "config/streetsForce"), (s) => { force = Number(s.val()) || 0; render(); }, () => undefined),
    onValue(ref(db, `streetPass/${me.uid}`), (s) => { pass = Number(s.val()) || 0; render(); }, () => undefined),
  ];
  const tick = window.setInterval(render, 20_000);

  async function go(fn: () => Promise<unknown>, after?: () => void): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { await fn(); after?.(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  }

  function render(): void {
    if (closed) return;
    watchSold();
    const now = serverNow();
    const run = elevatorRuns(now, force);
    if (where === "arrival") {
      body.replaceChildren(
        h("div", { class: "hint" }, "This elevator goes back down to the basement. You can't ride it in a fight."),
        h("button", { class: "btn primary", disabled: busy, onclick: () => void go(() => call(me, "elevatorDown"), () => { playSfx("doorOpen", 0.6); close(); onRide("down"); }) }, "Ride down"));
      return;
    }
    const slot = findSlot(me.inventory, TICKET_ITEM);
    const have = slot >= 0;
    const left = Math.max(0, TICKET_STOCK - sold);
    const ticket = itemDef(TICKET_ITEM);
    const riding = pass > now;
    const price = h("span", { class: "el-price" }, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${TICKET_PRICE}`);
    body.replaceChildren(
      ...(run.open ? [] : [h("div", { class: "hint el-desc" }, "A risky chance to sell to new customers")]), // (before 20: what the elevator is for)
      h("div", { class: "el-time" + (run.open ? " open" : "") }, run.open ? `The elevator is running. It stops in ${fmtWhen(run.endsAt - now)}.` : (runHoursOn(now).length > 1 ? `The elevator runs from 17 to 18 and from 20 to 21 today. It starts in ${fmtWhen(run.nextAt - now)}.` : `The elevator runs every day from 20 to 21. It starts in ${fmtWhen(run.nextAt - now)}.`)),
      h("div", { class: "sixty-row" },
        ticket ? h("img", { src: ticket.icon, alt: "", class: "sixty-ico" }) : null,
        h("div", { class: "sixty-main" }, h("div", { class: "sixty-name" }, "Elevator ticket"), h("div", { class: "hint" }, have ? "You have a ticket. It is used up when you ride." : `${left} of ${TICKET_STOCK} left for this run. One for each player.`)),
        have
          ? h("button", { class: "btn small", disabled: true }, "Yours")
          : h("button", { class: "btn small primary", disabled: busy || left <= 0 || me.blood < TICKET_PRICE, title: left <= 0 ? "Sold out for today" : me.blood < TICKET_PRICE ? `You need ${TICKET_PRICE - me.blood} more drops` : "", onclick: () => void go(async () => { await call(me, "ticketBuy"); ctx.refreshHeader(); playSfx("coins", 0.5); toast("The ticket is in your pocket."); }) }, left <= 0 ? "Sold out" : price)),
      h("button", { class: "btn primary", disabled: busy || !run.open || (!have && !riding && !me.isAdmin), onclick: () => void go(() => call(me, "elevatorUp"), () => { playSfx("doorOpen", 0.6); close(); onRide("up"); }) },
        !run.open ? "Not running" : riding ? "Ride up (you have a pass)" : have || me.isAdmin ? "Ride up" : "You need a ticket"),
      h("div", { class: "hint" }, "A ticket you didn't use stays yours for the next day."));
  }
  render();

  function close(): void {
    if (closed) return;
    closed = true;
    stops.forEach((s) => s());
    window.clearInterval(tick);
    el.remove();
    onClose();
  }
  return { close };
}
