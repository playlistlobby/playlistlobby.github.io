import { h, toast } from "./dom";
import { headBox } from "./head";
import { BLOOD_ICON } from "../items";
import { serverNow } from "../db";
import { playSfx } from "../sfx";
import { pokerAct, pokerLeave, pokerSit, pokerTick, watchPokerHole, watchPokerTable } from "../poker";
import { canAct, potOf, POKER_KINDS, POKER_SEATS, POKER_TURN_MS, raiseRange, seatOfUid } from "../shared/poker";
import type { PokerKind, PokerSeat, PokerTable } from "../shared/poker";
import { cardBackUrl, cardSlotUrl, cardUrl, chipsFor, chipUrl } from "./pokerCards";
import type { Ctx } from "../main";

/**
 * The poker window: a table seen from above (the felt, five seats, the cards, the chips and the pot), the way the big poker sites show it, in the game's pixel look.
 * You sit at the bottom; everybody else is placed round the table. The server runs the game: this window only shows what is written at poker/<table> (and your own
 * two cards) and sends your moves. Closing the window stands you up (you take what is in front of you).
 */
export interface PokerApi { close(): void; seated(): boolean; refresh(): void }

/** where each place at the table is on the felt, as percent: [seat x, seat y, bet x, bet y] (place 0 is you, at the bottom; the rest go clockwise) */
const PLACES: Array<[number, number, number, number]> = [
  [50, 91, 50, 66],
  [15, 66, 31, 58],
  [24, 21, 33, 36],
  [76, 21, 67, 36],
  [85, 66, 69, 58],
];
const STREETS = ["Pre-flop", "Flop", "The turn", "River"];

const nameOfSeat = (s: PokerSeat | null | undefined): string => (s ? s.name : "?");
const blood = (n: number): string => n.toLocaleString("en-US");

export function openPoker(host: HTMLElement, ctx: Ctx, roomId: string, fid: string, kind: PokerKind, onChange: () => void, onClose: () => void): PokerApi {
  const me = ctx.profile;
  const info = POKER_KINDS[kind];
  let closed = false;
  let t: PokerTable | null = null;
  let hole: number[] | null = null;
  let busy = false;
  let raising = false;
  let raiseTo = 0;
  let sitting: number | null = null; // the seat the buy-in panel is for
  let buyIn = info.min;
  let leaveArmed = 0;
  let prev: PokerTable | null = null;
  let lastTick = 0;
  let peeking = false; // the window is slid out of the way so you can watch the room (a player who goes bust shoots themselves there)
  let peekTimer = 0;

  const felt = h("div", { class: "pk-felt" });
  const actions = h("div", { class: "pk-actions" });
  const bloodEl = h("span", { class: "pk-blood" });
  const leaveBtn = h("button", { class: "pk-leave", onclick: () => void leave() }, "Leave");
  const peekBtn = h("button", { class: "pk-room", title: "Look at the room", onclick: () => setPeek(!peeking) }, "Room");
  const backBtn = h("button", { class: "pk-back", onclick: () => setPeek(false) }, "Back to the table");
  const win = h("div", { class: `pk-window ${kind === "hi" ? "hi" : ""}`, role: "dialog", "aria-label": "Poker" },
    h("div", { class: "pk-nav" }, leaveBtn,
      h("div", { class: "pk-title" }, h("strong", {}, kind === "hi" ? "High stakes" : "Poker"), h("span", {}, `Blinds ${info.sb}/${info.bb} · Buy-in ${blood(info.min)}-${blood(info.max)}`)),
      peekBtn, h("div", { class: "pk-pocket" }, h("img", { src: BLOOD_ICON, alt: "" }), bloodEl)),
    felt, actions);
  const overlay = h("div", { class: "pk-overlay" }, win, backBtn);
  (host.ownerDocument.body ?? host).append(overlay); // (on the page itself, not inside the room: the room is under a filter that would keep the header on top of it)

  const mySeat = (): number => (t ? seatOfUid(t, me.uid) : -1);
  const imSeated = (): boolean => mySeat() >= 0;

  function setPeek(on: boolean, forMs = 0): void {
    window.clearTimeout(peekTimer);
    peeking = on;
    overlay.classList.toggle("peek", on);
    if (on && forMs > 0) peekTimer = window.setTimeout(() => setPeek(false), forMs);
  }

  // ---- sending moves ---------------------------------------------------------------------------------------------------------------------------
  async function run(what: () => Promise<unknown>): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { await what(); onChange(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  }
  const move = (m: "fold" | "check" | "call" | "raise" | "allin", to?: number): Promise<void> => run(async () => { raising = false; await pokerAct(me, roomId, fid, m, to); });
  async function leave(): Promise<void> {
    const seat = mySeat();
    if (seat >= 0 && t && t.phase === "play" && t.seats[seat]?.in && !t.seats[seat]?.folded && leaveArmed < Date.now()) { // in the middle of a hand: tap twice
      leaveArmed = Date.now() + 3500; renderNav(); setTimeout(renderNav, 3600); return;
    }
    if (seat >= 0) await run(async () => { await pokerLeave(me, roomId, fid); });
    close();
  }
  function renderNav(): void {
    const armed = leaveArmed > Date.now();
    leaveBtn.textContent = armed ? "Fold and leave?" : imSeated() ? "Leave table" : "Close";
    leaveBtn.classList.toggle("armed", armed);
  }

  // ---- drawing ---------------------------------------------------------------------------------------------------------------------------------
  const card = (c: number | null, cls: string, delay = 0): HTMLElement => h("img", { class: `pk-card ${cls}`, src: c === null ? cardBackUrl() : cardUrl(c), alt: "", draggable: false, style: delay ? { animationDelay: `${delay}ms` } : {} });

  function chipPile(amount: number, cls: string): HTMLElement {
    const chips = chipsFor(amount);
    return h("div", { class: `pk-pile ${cls}` },
      h("div", { class: "pk-chips" }, ...chips.map((v, i) => h("img", { src: chipUrl(v), alt: "", style: { bottom: `${i * 3}px` } }))),
      h("span", { class: "pk-amt" }, blood(amount)));
  }

  function seatEl(i: number, place: number): HTMLElement {
    const s = t!.seats[i];
    const [x, y] = PLACES[place];
    const pos = { left: `${x}%`, top: `${y}%` };
    if (!s) {
      const can = !imSeated();
      return h("div", { class: `pk-seat empty p${place}`, style: pos },
        can ? h("button", { class: "pk-sit", onclick: () => { sitting = i; buyIn = Math.min(info.max, Math.max(info.min, Math.min(info.max, me.blood))); render(); } }, "Sit") : h("div", { class: "pk-nobody" }, ""));
    }
    const over = t!.over;
    const isMe = s.uid === me.uid;
    const winAmt = over ? over.pots.reduce((n, p) => n + (p.win.includes(i) ? Math.floor(p.amt / p.win.length) : 0), 0) : 0;
    const winner = !!over && winAmt > 0;
    const showdown = !!over && !over.uncontested;
    const inHand = s.in && !s.folded;
    const turn = t!.phase === "play" && t!.turn === i;
    const cards: HTMLElement[] = [];
    if (s.in && !s.left) {
      const shown = over?.show[i];
      if (isMe && hole && hole.length === 2) cards.push(card(hole[0], "mine", 0), card(hole[1], "mine", 90));
      else if (shown && shown.length === 2 && showdown) cards.push(card(shown[0], "open flip"), card(shown[1], "open flip", 120));
      else if (inHand) cards.push(card(null, "back"), card(null, "back"));
      else if (s.folded && !isMe) cards.push();
    }
    const timer = h("div", { class: "pk-timer" }, h("i", {}));
    const last = s.bust ? "BUST" : s.allin && inHand ? "All in" : s.folded ? (s.left ? "Left" : "Fold") : s.last && t!.phase !== "idle" ? s.last : "";
    const tagClass = s.bust ? "bust" : /^(Raise|Bet|All)/.test(last) ? "raise" : /^Call/.test(last) ? "call" : /^Check/.test(last) ? "check" : /^(Fold|Left)/.test(last) ? "fold" : /blind/i.test(last) ? "blind" : "";
    const el = h("div", { class: `pk-seat p${place}${isMe ? " me" : ""}${turn ? " turn" : ""}${s.folded ? " folded" : ""}${winner ? " win" : ""}${s.bust ? " bust" : ""}${s.gone ? " gone" : ""}`, "data-seat": String(i), style: pos },
      h("div", { class: "pk-hand" }, ...cards),
      h("div", { class: "pk-plate" },
        h("div", { class: "pk-head" }, headBox(s.figure ?? "")),
        h("div", { class: "pk-pinfo" }, h("div", { class: "pk-name" }, s.name),
          h("div", { class: "pk-stack" }, h("img", { src: BLOOD_ICON, alt: "" }), s.allin && inHand && s.stack === 0 ? "All in" : blood(s.stack))),
        timer),
      last ? h("div", { class: `pk-tag ${tagClass}` }, last) : "",
      t!.dealer === i ? h("div", { class: "pk-dealer", title: "Dealer" }, "D") : "",
      winner ? h("div", { class: "pk-won" }, `+${blood(winAmt)}`) : "",
      "");
    return el;
  }

  function render(): void {
    if (closed) return;
    bloodEl.textContent = blood(me.blood);
    renderNav();
    const scrollKeep = actions.scrollTop;
    felt.replaceChildren();
    if (!t) { felt.append(h("div", { class: "pk-empty" }, h("div", { class: "pk-hint" }, `Nobody is playing yet. Tap Sit to start a table: buy in for ${blood(info.min)} to ${blood(info.max)} blood, blinds ${info.sb}/${info.bb}.`))); }
    const base = t ? Math.max(0, mySeat()) : 0;
    const table = t;
    felt.append(h("div", { class: "pk-rail" }, h("div", { class: "pk-cloth" }, h("div", { class: "pk-logo" }, "6ix"))));
    if (table) {
      // the board and the pot in the middle
      const over = table.over;
      const pot = table.phase === "over" && over ? over.pots.reduce((n, p) => n + p.amt, 0) : potOf(table);
      const fresh = prev && prev.hand === table.hand ? prev.board.length : 0;
      felt.append(h("div", { class: "pk-middle" },
        pot > 0 && table.phase !== "idle" ? h("div", { class: "pk-pot" }, chipPile(pot, "pot"), h("span", { class: "pk-potlabel" }, "Pot")) : h("div", { class: "pk-pot none" }),
        h("div", { class: "pk-board" }, ...Array.from({ length: 5 }, (_, i) => (i < table.board.length ? card(table.board[i], i >= fresh ? "deal" : "", i >= fresh ? (i - fresh) * 140 : 0) : h("img", { class: "pk-card slot", src: cardSlotUrl(), alt: "", draggable: false })))),
        h("div", { class: "pk-status" }, statusText(table))));
      for (let n = 0; n < POKER_SEATS; n++) {
        const i = (base + n) % POKER_SEATS;
        felt.append(seatEl(i, n));
      }
      for (let n = 0; n < POKER_SEATS; n++) {
        const i = (base + n) % POKER_SEATS;
        const s = table.seats[i];
        if (s && s.bet > 0 && table.phase === "play") { const [, , bx, by] = PLACES[n]; felt.append(h("div", { class: `pk-bet p${n}`, style: { left: `${bx}%`, top: `${by}%` } }, chipPile(s.bet, "bet"))); }
      }
      if (over && !over.uncontested) felt.append(h("div", { class: "pk-banner" }, ...over.pots.slice(0, 3).map((p) => h("div", { class: "pk-line" }, h("strong", {}, p.win.map((w) => nameOfSeat(table.seats[w])).join(" & ")), ` wins ${blood(p.amt)}`, p.name ? h("em", {}, ` · ${p.name}`) : ""))));
      else if (over && over.uncontested) { const w = over.pots[0]?.win[0]; felt.append(h("div", { class: "pk-banner" }, h("div", { class: "pk-line" }, h("strong", {}, nameOfSeat(table.seats[w ?? -1])), ` wins ${blood(over.pots[0]?.amt ?? 0)}`, h("em", {}, " · everybody else folded")))); }
      const my = table.seats[mySeat()];
      if (my?.bust) felt.append(h("div", { class: "pk-bust" }, h("strong", {}, "You're out of blood"), h("span", {}, "You put the gun to your head. Buy in again to get back in.")));
    } else {
      for (let n = 0; n < POKER_SEATS; n++) felt.append(h("div", { class: `pk-seat empty p${n}`, style: { left: `${PLACES[n][0]}%`, top: `${PLACES[n][1]}%` } }, h("button", { class: "pk-sit", onclick: () => { sitting = n; buyIn = Math.min(info.max, Math.max(info.min, Math.min(info.max, me.blood))); render(); } }, "Sit")));
    }
    if (sitting !== null) felt.append(buyPanel());
    renderActions();
    actions.scrollTop = scrollKeep;
    tickBars();
  }

  function statusText(tb: PokerTable): string {
    if (tb.phase === "idle") return seatsCount(tb) < 2 ? "Waiting for a second player" : "Starting soon…";
    if (tb.phase === "over") return tb.over && !tb.over.uncontested ? "Showdown" : "";
    return `${STREETS[tb.street]} · Hand ${tb.hand}`;
  }
  const seatsCount = (tb: PokerTable): number => tb.seats.filter((s) => s && !s.left).length;

  function buyPanel(): HTMLElement {
    const max = Math.min(info.max, me.blood);
    const slider = h("input", { type: "range", min: String(info.min), max: String(Math.max(info.min, max)), step: String(Math.max(1, info.min >= 1000 ? 50 : 10)), value: String(Math.min(buyIn, Math.max(info.min, max))), class: "pk-slider" }) as HTMLInputElement;
    const num = h("div", { class: "pk-bignum" }, h("img", { src: BLOOD_ICON, alt: "" }), blood(buyIn));
    slider.addEventListener("input", () => { buyIn = Number(slider.value); num.replaceChildren(h("img", { src: BLOOD_ICON, alt: "" }), blood(buyIn)); });
    const short = me.blood < info.min;
    return h("div", { class: "pk-buy" },
      h("div", { class: "pk-buybox" },
        h("strong", {}, `Sit down · seat ${sitting! + 1}`),
        h("div", { class: "pk-hint" }, `Blinds ${info.sb}/${info.bb}. You can stand up any time and take what is in front of you.`),
        short ? h("div", { class: "pk-warn" }, `You need ${blood(info.min - me.blood)} more blood for the smallest buy-in (${blood(info.min)}).`) : h("div", {}, num, slider,
          h("div", { class: "pk-presets" }, h("button", { onclick: () => { buyIn = info.min; render(); } }, "Min"), h("button", { onclick: () => { buyIn = Math.round((info.min + info.max) / 2 / 10) * 10; render(); } }, "Half"), h("button", { onclick: () => { buyIn = max; render(); } }, "Max"))),
        h("div", { class: "pk-row" },
          h("button", { class: "pk-btn", onclick: () => { sitting = null; render(); } }, "Cancel"),
          h("button", { class: "pk-btn go", disabled: short || busy, onclick: () => { const seat = sitting!; sitting = null; void run(async () => { await pokerSit(me, roomId, fid, seat, Math.min(max, Math.max(info.min, buyIn))); playSfx("coins", 0.5); }); } }, "Buy in"))));
  }

  function renderActions(): void {
    actions.replaceChildren();
    const seat = mySeat();
    const s = t && seat >= 0 ? t.seats[seat] : null;
    if (!t || !s) {
      actions.append(h("div", { class: "pk-info" }, imSeated() ? "" : `Tap an empty seat to sit down. Buy-in ${blood(info.min)}-${blood(info.max)} blood.`,
        me.blood < info.min ? h("div", { class: "pk-warn" }, `You have ${blood(me.blood)}: the smallest buy-in is ${blood(info.min)}.`) : ""));
      return;
    }
    const myTurn = t.phase === "play" && t.turn === seat && canAct(s);
    if (myTurn) {
      const toCall = Math.max(0, t.bet - s.bet);
      const range = raiseRange(t, seat);
      const canRaise = range.max > t.bet && s.stack > toCall;
      if (raising && canRaise) {
        raiseTo = Math.min(range.max, Math.max(range.min, raiseTo || range.min));
        const potNow = potOf(t) + toCall;
        const preset = (label: string, to: number): HTMLElement => h("button", { onclick: () => { raiseTo = Math.min(range.max, Math.max(range.min, Math.round(to))); render(); } }, label);
        const slider = h("input", { type: "range", class: "pk-slider", min: String(range.min), max: String(range.max), step: "1", value: String(raiseTo) }) as HTMLInputElement;
        const big = h("div", { class: "pk-bignum" }, h("img", { src: BLOOD_ICON, alt: "" }), blood(raiseTo));
        slider.addEventListener("input", () => { raiseTo = Number(slider.value); big.replaceChildren(h("img", { src: BLOOD_ICON, alt: "" }), blood(raiseTo)); });
        actions.append(h("div", { class: "pk-raise" },
          h("div", { class: "pk-rtop" }, h("span", {}, t.bet === 0 ? "Bet" : "Raise to"), big),
          slider,
          h("div", { class: "pk-presets" }, preset("Min", range.min), preset("½ pot", t.bet + potNow / 2), preset("¾ pot", t.bet + (potNow * 3) / 4), preset("Pot", t.bet + potNow), preset("All in", range.max)),
          h("div", { class: "pk-row" }, h("button", { class: "pk-btn", onclick: () => { raising = false; render(); } }, "Back"),
            h("button", { class: "pk-btn raise", disabled: busy, onclick: () => void move(raiseTo >= range.max ? "allin" : "raise", raiseTo) }, raiseTo >= range.max ? "All in" : t.bet === 0 ? `Bet ${blood(raiseTo)}` : `Raise to ${blood(raiseTo)}`))));
        return;
      }
      raising = false;
      actions.append(h("div", { class: "pk-row main" },
        h("button", { class: "pk-btn fold", disabled: busy, onclick: () => void move("fold") }, "Fold"),
        toCall === 0 ? h("button", { class: "pk-btn check", disabled: busy, onclick: () => void move("check") }, "Check")
          : h("button", { class: "pk-btn call", disabled: busy, onclick: () => void move("call") }, s.stack <= toCall ? `All in ${blood(s.stack)}` : `Call ${blood(toCall)}`),
        canRaise ? h("button", { class: "pk-btn raise", disabled: busy, onclick: () => { raising = true; raiseTo = range.min; render(); } }, t.bet === 0 ? "Bet" : "Raise") : ""));
      return;
    }
    raising = false;
    let msg = "";
    if (t.phase === "play") {
      if (s.folded) msg = "You folded. Watching the hand…";
      else if (!s.in) msg = "You'll be dealt in on the next hand.";
      else if (s.allin) msg = "You're all in. Good luck.";
      else msg = t.turn >= 0 ? `Waiting for ${nameOfSeat(t.seats[t.turn])}…` : "The cards are coming…";
    } else if (t.phase === "over") msg = "Next hand in a moment…";
    else msg = seatsCount(t) < 2 ? "Waiting for another player to sit down." : "The next hand starts in a moment…";
    actions.append(h("div", { class: "pk-info" }, msg, h("div", { class: "pk-sub" }, `In front of you: ${blood(s.stack)}`)));
  }

  /** the countdown bar over the player whose turn it is (called often) */
  function tickBars(): void {
    if (!t) return;
    const tb = t;
    const left = tb.turnAt + POKER_TURN_MS - serverNow();
    const bar = felt.querySelector(".pk-seat.turn .pk-timer i") as HTMLElement | null;
    if (bar) {
      const f = Math.max(0, Math.min(1, left / POKER_TURN_MS));
      bar.style.width = `${f * 100}%`;
      bar.style.background = f > 0.5 ? "#5fe07a" : f > 0.25 ? "#ffd75a" : "#ff5a4a";
    }
  }

  // ---- time keeps by the server, but somebody has to tell it when a deadline has passed: any window that is open does ---------------------------------
  const timer = window.setInterval(() => {
    if (closed) return;
    tickBars();
    if (!t) return;
    const now = serverNow();
    const due = (t.phase === "play" && t.turn >= 0 && now > t.turnAt + POKER_TURN_MS + 400 + (mySeat() * 250))
      || (t.nextAt > 0 && now > t.nextAt + 300 + (Math.max(0, mySeat()) * 250));
    const gone = imSeated() && Date.now() - lastTick > 7000 && t.seats.some((s) => s?.gone !== undefined);
    if ((due || gone) && Date.now() - lastTick > 1500) { lastTick = Date.now(); void pokerTick(me, roomId, fid).catch(() => undefined); }
    if (t.phase === "idle" || t.phase === "over") renderStatusOnly();
  }, 250);
  function renderStatusOnly(): void { /* the status line changes with the table, not with the clock */ }

  // ---- what the table says -----------------------------------------------------------------------------------------------------------------------
  function onTable(next: PokerTable | null): void {
    if (closed) return;
    const old = t;
    prev = old;
    t = next;
    if (next && old && next.seq !== old.seq) {
      if (next.board.length > old.board.length && next.hand === old.hand) playSfx("select", 0.45);
      if (next.lastAct && (!old.lastAct || next.lastAct.at !== old.lastAct.at)) { const a = next.lastAct.act; if (/^(Raise|Bet|Call|All)/.test(a)) playSfx("give", 0.4); }
      if (next.phase === "over" && old.phase !== "over") {
        const meSeat = seatOfUid(next, me.uid);
        const won = meSeat >= 0 && next.over?.pots.some((p) => p.win.includes(meSeat));
        playSfx(won ? "cash" : "select", 0.5);
        if (next.seats.some((s) => s?.bust)) setTimeout(() => { if (!closed) setPeek(true, 5600); }, 1300); // (the shot is in the room: slide the window away so everybody sees it)
      }
      if (next.phase === "play" && next.turn === seatOfUid(next, me.uid) && (old.turn !== next.turn || old.hand !== next.hand)) playSfx("knock", 0.5);
    }
    if (next && !old && next.hand > 0) playSfx("select", 0.3);
    if (!imSeated()) { raising = false; }
    onChange();
    render();
    if (next === null && old === null) return;
  }
  const stops = [
    watchPokerTable(roomId, fid, onTable),
    watchPokerHole(roomId, fid, me.uid, (c) => { hole = c; render(); }),
  ];
  render();

  function close(): void {
    if (closed) return;
    const wasSeated = imSeated();
    closed = true;
    window.clearInterval(timer);
    window.clearTimeout(peekTimer);
    stops.forEach((s) => s());
    overlay.remove();
    if (wasSeated) void pokerLeave(me, roomId, fid).then(() => onChange()).catch(() => undefined); // (closing the window stands you up: nobody sits at a table they can't see)
    onClose();
  }
  overlay.addEventListener("click", (e) => { if (e.target === overlay) void leave(); });
  return { close, seated: imSeated, refresh: render };
}
