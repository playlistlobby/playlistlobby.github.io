import { h, toast } from "./dom";
import { headBox } from "./head";
import { BLOOD_ICON } from "../items";
import { serverNow } from "../db";
import { playSfx } from "../sfx";
import { bjAct, bjBet, bjDealer, bjLeave, bjSit, bjTick, watchBjHole, watchBjTable } from "../blackjack";
import { BJ_BANK_MAX, BJ_BANK_MIN, BJ_BET_MAX, BJ_BET_MIN, BJ_SEATS, BJ_TURN_MS, bjSeatOfUid, bjValue, bjStakes, canSettle, handsToBeat, isBlackjack } from "../shared/blackjack";
import type { BjSeat, BjTable } from "../shared/blackjack";
import { cardBackUrl, cardUrl, chipsFor, chipUrl } from "./pokerCards";
import type { Ctx } from "../main";

/**
 * The blackjack window: a blue table seen from above. The dealer (a member of the hideout) stands at the top with their own bank and does the clicks; the players sit along the
 * bottom, bet, and hit or stand. The server runs the game and checks every click: this window only shows what is written at blackjack/<table> and sends the clicks.
 * Closing the window stands you up (a dealer takes the bank and stops dealing).
 */
export interface BlackjackApi { close(): void; seated(): boolean; refresh(): void }

/** the five seats along the bottom, as percent of the felt: [x, y] */
const SEATS: Array<[number, number]> = [[13, 60], [31, 78], [50, 85], [69, 78], [87, 60]];
const BET_CHIPS = [10, 25, 50, 100, 250];
const blood = (n: number): string => n.toLocaleString("en-US");

export function openBlackjack(host: HTMLElement, ctx: Ctx, roomId: string, fid: string, onChange: () => void, onClose: () => void): BlackjackApi {
  const me = ctx.profile;
  let closed = false;
  let t: BjTable | null = null;
  let prev: BjTable | null = null;
  let hole: number | null = null;
  let busy = false;
  let sitting: number | null = null; // the seat the "sit here" is for
  let dealing = false; // the "deal at this table" panel is open
  let bank = 1000;
  let bet = 0; // the bet being built from chips
  let lastTick = 0;
  let leaveArmed = 0;

  const felt = h("div", { class: "pk-felt bj-felt" });
  const actions = h("div", { class: "pk-actions" });
  const bloodEl = h("span", { class: "pk-blood" });
  const leaveBtn = h("button", { class: "pk-leave", onclick: () => void leave() }, "Close");
  const win = h("div", { class: "pk-window bj", role: "dialog", "aria-label": "Blackjack" },
    h("div", { class: "pk-nav" }, leaveBtn,
      h("div", { class: "pk-title" }, h("strong", {}, "Blackjack"), h("span", {}, `Bets ${BJ_BET_MIN}-${BJ_BET_MAX} · Blackjack pays 3 to 2`)),
      h("div", { class: "pk-pocket" }, h("img", { src: BLOOD_ICON, alt: "" }), bloodEl)),
    felt, actions);
  const overlay = h("div", { class: "pk-overlay" }, win);
  (host.ownerDocument.body ?? host).append(overlay);

  const iDeal = (): boolean => !!t?.dealer && t.dealer.uid === me.uid;
  const mySeat = (): number => (t ? bjSeatOfUid(t, me.uid) : -1);
  const imAt = (): boolean => iDeal() || mySeat() >= 0;

  async function run(what: () => Promise<unknown>): Promise<void> {
    if (busy) return;
    busy = true; render();
    try { await what(); onChange(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  }
  async function leave(): Promise<void> {
    const midRound = !!t && (t.phase === "betting" || t.phase === "players" || t.phase === "dealer") && (iDeal() || (t.seats[mySeat()]?.bet ?? 0) > 0);
    if (imAt() && midRound && leaveArmed < Date.now()) { leaveArmed = Date.now() + 3500; renderNav(); setTimeout(renderNav, 3600); return; }
    if (imAt()) await run(async () => { await bjLeave(me, roomId, fid); });
    close();
  }
  function renderNav(): void {
    const armed = leaveArmed > Date.now();
    leaveBtn.textContent = armed ? (iDeal() ? "Call off the round?" : "Leave and forfeit?") : iDeal() ? "Stop dealing" : mySeat() >= 0 ? "Leave table" : "Close";
    leaveBtn.classList.toggle("armed", armed);
  }

  const img = (src: string, cls: string, delay = 0): HTMLElement => h("img", { class: `pk-card ${cls}`, src, alt: "", draggable: false, style: delay ? { animationDelay: `${delay}ms` } : {} });
  function pile(amount: number): HTMLElement {
    return h("div", { class: "pk-pile bet" }, h("div", { class: "pk-chips" }, ...chipsFor(amount).map((v, i) => h("img", { src: chipUrl(v), alt: "", style: { bottom: `${i * 3}px` } }))), h("span", { class: "pk-amt" }, blood(amount)));
  }
  const totalText = (cards: number[]): string => { const v = bjValue(cards); return isBlackjack(cards) ? "Blackjack" : v.total > 21 ? `Bust ${v.total}` : v.soft && v.total < 21 ? `${v.total - 10} / ${v.total}` : String(v.total); };

  function seatEl(i: number): HTMLElement {
    const [x, y] = SEATS[i];
    const pos = { left: `${x}%`, top: `${y}%` };
    const s = t?.seats[i] ?? null;
    if (!s) {
      return h("div", { class: `pk-seat empty bjs b${i}`, style: pos }, !imAt() ? h("button", { class: "pk-sit", onclick: () => void run(async () => { await bjSit(me, roomId, fid, i); playSfx("select", 0.4); }) }, "Sit") : "");
    }
    const isMe = s.uid === me.uid;
    const turn = t!.phase === "players" && t!.turn === i;
    const fresh = prev && prev.round === t!.round ? (prev.seats[i]?.cards.length ?? 0) : 0;
    const total = s.cards.length ? totalText(s.cards) : "";
    const tag = s.result ? (s.result === "bj" ? `Blackjack +${blood(s.back! - s.bet)}` : s.result === "win" ? `Win +${blood(s.back! - s.bet)}` : s.result === "push" ? "Push" : `Lose -${blood(s.bet)}`) : s.state === "bust" ? "Bust" : s.state === "stand" ? "Stand" : s.state === "bj" ? "Blackjack" : s.bet > 0 && t!.phase === "betting" ? "Bet in" : "";
    const tagClass = s.result === "win" || s.result === "bj" ? "call" : s.result === "lose" || s.state === "bust" ? "fold" : s.result === "push" ? "check" : "blind";
    const winner = s.result === "win" || s.result === "bj";
    return h("div", { class: `pk-seat bjs b${i}${isMe ? " me" : ""}${turn ? " turn" : ""}${winner ? " win" : ""}${s.state === "bust" || s.result === "lose" ? " folded" : ""}${s.gone ? " gone" : ""}`, "data-seat": String(i), style: pos },
      h("div", { class: "bj-cards" }, ...s.cards.map((c, k) => img(cardUrl(c), k >= fresh ? "deal" : "", k >= fresh ? (k - fresh) * 160 : 0))),
      total ? h("div", { class: `bj-total${s.state === "bust" ? " bust" : ""}` }, total) : "",
      s.bet > 0 ? h("div", { class: "bj-bet" }, pile(s.bet)) : "",
      h("div", { class: "pk-plate" },
        h("div", { class: "pk-head" }, headBox(s.figure ?? "")),
        h("div", { class: "pk-pinfo" }, h("div", { class: "pk-name" }, s.name), h("div", { class: "pk-stack" }, s.doubled ? "Doubled" : isMe ? "You" : "")),
        h("div", { class: "pk-timer" }, h("i", {}))),
      tag ? h("div", { class: `pk-tag ${tagClass}` }, tag) : "");
  }

  function dealerEl(): HTMLElement {
    const d = t?.dealer;
    if (!t || !d) return h("div", { class: "bj-dealer empty" }, h("div", { class: "pk-hint" }, "No dealer at this table"));
    const cards = t.dealerCards.map((c, k) => img(cardUrl(c), t!.revealed && k === 1 ? "flip" : (prev && prev.round === t!.round && k < prev.dealerCards.length ? "" : "deal"), 0));
    const showHole = t.hole;
    const holeEl = showHole ? (iDeal() && hole != null ? h("div", { class: "bj-hole" }, img(cardUrl(hole), "mine"), h("span", {}, "only you see this")) : img(cardBackUrl(), "back")) : "";
    const total = t.dealerCards.length ? (t.revealed || t.phase === "over" ? totalText(t.dealerCards) : `${bjValue(t.dealerCards).total} + ?`) : "";
    return h("div", { class: "bj-dealer" },
      h("div", { class: "pk-plate" }, h("div", { class: "pk-head" }, headBox(d.figure ?? "")),
        h("div", { class: "pk-pinfo" }, h("div", { class: "pk-name" }, `${d.name} · dealer`), h("div", { class: "pk-stack" }, h("img", { src: BLOOD_ICON, alt: "" }), `Bank ${blood(t.bank)}`))),
      h("div", { class: "bj-cards dealer" }, ...cards, holeEl),
      total ? h("div", { class: "bj-total" }, total) : "");
  }

  function statusText(): string {
    if (!t || !t.dealer) return "Waiting for a dealer";
    switch (t.phase) {
      case "idle": return `${t.dealer.name} will open a round`;
      case "betting": return "Place your bets";
      case "players": return t.turn >= 0 ? `${t.seats[t.turn]?.name ?? "?"}'s turn` : "";
      case "dealer": return t.revealed ? "The dealer plays" : "The dealer turns the card";
      case "over": return "Round over";
    }
  }

  function render(): void {
    if (closed) return;
    bloodEl.textContent = blood(me.blood);
    renderNav();
    felt.replaceChildren(h("div", { class: "pk-rail" }, h("div", { class: "pk-cloth" }, h("div", { class: "pk-logo bj-logo" }, "BLACKJACK"))));
    felt.append(h("div", { class: "bj-arc" }, "Blackjack pays 3 to 2 · Dealer stands on 17"));
    felt.append(dealerEl());
    felt.append(h("div", { class: "bj-status" }, statusText()));
    for (let i = 0; i < BJ_SEATS; i++) felt.append(seatEl(i));
    if (dealing) felt.append(bankPanel());
    renderActions();
    tickBars();
  }

  function bankPanel(): HTMLElement {
    const top = Math.min(BJ_BANK_MAX, me.blood);
    const slider = h("input", { type: "range", class: "pk-slider", min: String(BJ_BANK_MIN), max: String(Math.max(BJ_BANK_MIN, top)), step: "100", value: String(Math.min(bank, Math.max(BJ_BANK_MIN, top))) }) as HTMLInputElement;
    const num = h("div", { class: "pk-bignum" }, h("img", { src: BLOOD_ICON, alt: "" }), blood(bank));
    slider.addEventListener("input", () => { bank = Number(slider.value); num.replaceChildren(h("img", { src: BLOOD_ICON, alt: "" }), blood(bank)); });
    const short = me.blood < BJ_BANK_MIN;
    return h("div", { class: "pk-buy" }, h("div", { class: "pk-buybox" },
      h("strong", {}, "Deal at this table"),
      h("div", { class: "pk-hint" }, `You put a bank on the table: it pays the winners and takes what the players lose. Anybody can bet up to ${BJ_BET_MAX}. You can stop and take the bank any time.`),
      short ? h("div", { class: "pk-warn" }, `You need ${blood(BJ_BANK_MIN - me.blood)} more blood for the smallest bank (${blood(BJ_BANK_MIN)}).`) : h("div", {}, num, slider),
      h("div", { class: "pk-row" },
        h("button", { class: "pk-btn", onclick: () => { dealing = false; render(); } }, "Cancel"),
        h("button", { class: "pk-btn go", disabled: short || busy, onclick: () => { dealing = false; void run(async () => { await bjDealer(me, roomId, fid, "sit", Math.min(top, Math.max(BJ_BANK_MIN, bank))); playSfx("coins", 0.5); }); } }, "Start dealing"))));
  }

  function renderActions(): void {
    actions.replaceChildren();
    if (!t || (!imAt())) {
      actions.append(h("div", { class: "pk-info" }, t?.dealer ? "Tap an empty seat to sit down and play." : "There's no dealer yet.",
        !t?.dealer ? h("div", { class: "pk-row", style: { marginTop: "8px" } }, h("button", { class: "pk-btn raise", onclick: () => { dealing = true; bank = Math.min(BJ_BANK_MAX, Math.max(BJ_BANK_MIN, Math.min(me.blood, 1000))); render(); } }, "Deal at this table")) : "",
        t?.dealer ? h("div", { class: "pk-sub" }, `The dealer's bank: ${blood(t.bank)}`) : h("div", { class: "pk-sub" }, "Members of the hideout can deal.")));
      return;
    }
    if (iDeal()) { actions.append(dealerPanel()); return; }
    const seat = mySeat();
    const s = t.seats[seat]!;
    if (t.phase === "betting" && s.bet === 0) {
      const room = Math.min(BJ_BET_MAX, me.blood);
      bet = Math.min(bet, room);
      const big = h("div", { class: "pk-bignum" }, h("img", { src: BLOOD_ICON, alt: "" }), bet ? blood(bet) : "Your bet");
      actions.append(h("div", { class: "pk-raise" },
        h("div", { class: "pk-rtop" }, h("span", {}, `In your pocket: ${blood(me.blood)}`), big),
        h("div", { class: "pk-presets" }, ...BET_CHIPS.map((v) => h("button", { class: "bj-chipbtn", disabled: bet + v > room, onclick: () => { bet = Math.min(room, bet + v); render(); } }, h("img", { src: chipUrl(v), alt: "" }), `+${v}`))),
        h("div", { class: "pk-row" },
          h("button", { class: "pk-btn", disabled: bet === 0, onclick: () => { bet = 0; render(); } }, "Clear"),
          h("button", { class: "pk-btn raise", disabled: busy || bet < BJ_BET_MIN, onclick: () => { const amount = bet; bet = 0; void run(async () => { await bjBet(me, roomId, fid, amount); playSfx("give", 0.5); }); } }, bet >= BJ_BET_MIN ? `Bet ${blood(bet)}` : `Bet (at least ${BJ_BET_MIN})`))));
      return;
    }
    if (t.phase === "players" && t.turn === seat && s.state === "play") {
      const canDouble = s.cards.length === 2 && me.blood >= s.bet;
      actions.append(h("div", { class: "pk-row main" },
        h("button", { class: "pk-btn fold", disabled: busy, onclick: () => void run(async () => { await bjAct(me, roomId, fid, "stand"); }) }, "Stand"),
        h("button", { class: "pk-btn call", disabled: busy, onclick: () => void run(async () => { await bjAct(me, roomId, fid, "hit"); playSfx("select", 0.4); }) }, "Hit"),
        canDouble ? h("button", { class: "pk-btn raise", disabled: busy, onclick: () => void run(async () => { await bjAct(me, roomId, fid, "double"); playSfx("give", 0.5); }) }, `Double ${blood(s.bet)}`) : ""));
      return;
    }
    let msg = "";
    if (t.phase === "betting") msg = "Bet is in. Waiting for the dealer to deal…";
    else if (t.phase === "players") msg = s.bet === 0 ? "You sit this round out." : s.state === "play" ? `Waiting for ${t.seats[t.turn]?.name ?? "the others"}…` : s.state === "bust" ? "Bust." : s.state === "bj" ? "Blackjack! The dealer will pay you 3 to 2." : "You stand. Waiting…";
    else if (t.phase === "dealer") msg = "The dealer plays…";
    else if (t.phase === "over") msg = s.result ? (s.result === "win" ? `You win ${blood(s.back! - s.bet)}!` : s.result === "bj" ? `Blackjack! You win ${blood(s.back! - s.bet)}!` : s.result === "push" ? "Push: you get your bet back." : "You lose this one.") : "Round over.";
    else msg = `${t.dealer?.name ?? "The dealer"} will open the next round.`;
    actions.append(h("div", { class: "pk-info" }, msg, h("div", { class: "pk-sub" }, `In your pocket: ${blood(me.blood)}`)));
  }

  function dealerPanel(): HTMLElement {
    const tb = t!;
    const click = (op: "open" | "deal" | "reveal" | "draw" | "settle", label: string, cls: string, enabled = true, sfx: "select" | "coins" | "give" = "select"): HTMLElement =>
      h("button", { class: `pk-btn ${cls}`, disabled: busy || !enabled, onclick: () => void run(async () => { await bjDealer(me, roomId, fid, op); playSfx(sfx, 0.5); }) }, label);
    const stakes = bjStakes(tb);
    const row = (...kids: HTMLElement[]): HTMLElement => h("div", { class: "pk-row main" }, ...kids);
    let info = "", body: HTMLElement;
    switch (tb.phase) {
      case "idle": case "over":
        info = tb.phase === "over" ? "Round over. Open the next one when you are ready." : "Open a round and the players can bet.";
        body = row(click("open", "Open a round", "check")); break;
      case "betting":
        info = stakes > 0 ? `${blood(stakes)} is bet. Deal when everybody has bet.` : "Waiting for bets…";
        body = row(click("deal", "Deal the cards", "raise", stakes > 0)); break;
      case "players":
        info = tb.turn >= 0 ? `Waiting for ${tb.seats[tb.turn]?.name ?? "a player"} to hit or stand…` : "";
        body = h("div", {}); break;
      default: {
        const total = bjValue(tb.dealerCards).total;
        if (!tb.revealed) { info = "Everybody has played. Turn your hidden card."; body = row(click("reveal", "Turn the hidden card", "raise")); }
        else if (canSettle(tb)) { info = handsToBeat(tb) ? `You have ${total}: you stand. Pay the table.` : "Nobody is left to beat. Pay the table."; body = row(click("settle", "Pay out", "call", true, "coins")); }
        else { info = `You have ${total}: you must draw.`; body = row(click("draw", "Draw a card", "raise")); }
      }
    }
    return h("div", {}, h("div", { class: "pk-info" }, info, h("div", { class: "pk-sub" }, `Your bank: ${blood(tb.bank)}`)), body);
  }

  function tickBars(): void {
    if (!t) return;
    const left = t.turnAt + BJ_TURN_MS - serverNow();
    const bar = felt.querySelector(".pk-seat.turn .pk-timer i") as HTMLElement | null;
    if (bar) { const f = Math.max(0, Math.min(1, left / BJ_TURN_MS)); bar.style.width = `${f * 100}%`; bar.style.background = f > 0.5 ? "#5fe07a" : f > 0.25 ? "#ffd75a" : "#ff5a4a"; }
  }

  const timer = window.setInterval(() => {
    if (closed || !t) return;
    tickBars();
    const now = serverNow();
    const due = (t.phase === "players" && t.turn >= 0 && now > t.turnAt + BJ_TURN_MS + 500)
      || (t.phase === "over" && now > t.nextAt + 400)
      || ((t.phase === "betting" || t.phase === "dealer") && now > t.dealerAt + 45_000 + 500)
      || (imAt() && Date.now() - lastTick > 8000 && (t.seats.some((s) => s?.gone !== undefined)));
    if (due && Date.now() - lastTick > 1500) { lastTick = Date.now(); void bjTick(me, roomId, fid).catch(() => undefined); }
  }, 300);

  function onTable(next: BjTable | null): void {
    if (closed) return;
    const old = t;
    prev = old;
    t = next;
    if (next && old && next.seq !== old.seq) {
      if (next.phase === "players" && old.phase !== "players") playSfx("select", 0.5);
      if (next.phase === "over" && old.phase !== "over") { const me0 = bjSeatOfUid(next, me.uid); const r = me0 >= 0 ? next.seats[me0]?.result : undefined; playSfx(r === "win" || r === "bj" ? "cash" : "select", 0.5); }
      if (next.phase === "players" && next.turn === bjSeatOfUid(next, me.uid) && (old.turn !== next.turn || old.phase !== "players")) playSfx("knock", 0.5);
    }
    onChange();
    render();
  }
  const stops = [watchBjTable(roomId, fid, onTable), watchBjHole(roomId, fid, (c) => { hole = c; render(); })];
  render();

  function close(): void {
    if (closed) return;
    const was = imAt();
    closed = true;
    window.clearInterval(timer);
    stops.forEach((s) => s());
    overlay.remove();
    if (was) void bjLeave(me, roomId, fid).then(() => onChange()).catch(() => undefined);
    onClose();
  }
  overlay.addEventListener("click", (e) => { if (e.target === overlay) void leave(); });
  return { close, seated: imAt, refresh: render };
}

void ({} as BjSeat);
