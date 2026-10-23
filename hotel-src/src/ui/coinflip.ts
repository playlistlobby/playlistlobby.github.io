import { h, toast } from "./dom";
import { board, cancelFlip, FLIP_MAX, FLIP_MAX_OPEN, onBoard, postFlip, Side, takeFlip } from "../coinflip";
import type { DoneFlip, OpenFlip } from "../coinflip";
import { BLOOD_ICON } from "../items";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface CoinFlipApi {
  close(): void;
  refresh(): void;
}

const sideName = (s: Side): string => (s === "heads" ? "Heads" : "Tails");
const other = (s: Side): Side => (s === "heads" ? "tails" : "heads");
const ago = (t: number): string => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60_000));
  const hours = Math.round(m / 60);
  const now = "Just now";
  const mins = `${m} min ago`;
  const hrs = `${hours} h ago`;
  return m < 1 ? now : m < 60 ? mins : hrs;
};
const drop = (): HTMLElement => h("img", { class: "cf-blood", src: BLOOD_ICON, alt: "" });

/**
 * The coin flip machine's window: the Playlist app's Coin Flip (the iOS 6 Game Center look: tabs Play / Open Flips / History, a stake stepper,
 * heads or tails, and the coin tossed in 3D), with blood instead of likes. Put blood on a side and post it for somebody to take, or take somebody else's.
 */
export function openCoinFlip(_host: HTMLElement, ctx: Ctx, onChange: () => void, onClose: () => void): CoinFlipApi {
  const me = ctx.profile;
  let closed = false;
  let busy = false;
  let tab: "play" | "open" | "mine" = "play";
  let stake = 5;
  let side: Side = "heads";
  let sure = ""; // the open flip whose Take button is waiting for a second tap
  let sureTimer = 0;

  const balance = (): number => Math.max(0, me.blood);
  const maxStake = (): number => Math.min(FLIP_MAX, Math.max(1, balance()));

  // ---- the window -----------------------------------------------------------------------------------------------
  const body = h("div", { class: "cf-body gc-body" });
  const stage = h("div", { class: "cf-stage", hidden: true });
  const app = h("div", { class: "cf-app", role: "dialog", "aria-label": "Coin flip" },
    h("div", { class: "cf-nav" }, h("strong", {}, "Coin Flip"), h("button", { class: "cf-x", type: "button", onclick: () => close() }, "Done")),
    body, stage);
  const root = h("div", { class: "cf-overlay", onmousedown: (e: MouseEvent) => { if (e.target === root) close(); } }, app);
  document.body.append(root);
  const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") close(); };
  window.addEventListener("keydown", onKey);

  const tabBtn = (t: typeof tab, label: string, badge = ""): HTMLElement =>
    h("button", { type: "button", role: "tab", "aria-selected": String(tab === t), onclick: () => { tab = t; sure = ""; render(); } }, label, badge ? h("span", { class: "gc-n" }, badge) : null);

  // ---- the three panes ------------------------------------------------------------------------------------------
  function playPane(): HTMLElement {
    const bal = balance();
    stake = Math.max(1, Math.min(stake, maxStake()));
    const mineOpen = board.open.filter((f) => f.by === me.uid).length;
    const can = bal >= 1 && !busy && mineOpen < FLIP_MAX_OPEN;
    const maxOpen = FLIP_MAX_OPEN;
    const maxFlip = FLIP_MAX;
    const theirSide = sideName(other(side));
    const sideBtn = (s: Side): HTMLElement => h("button", { type: "button", class: "cf-side" + (side === s ? " on" : ""), "aria-pressed": String(side === s), onclick: () => { side = s; playSfx("select", 0.3); render(); } },
      h("i", { class: "cf-chip" }, s === "heads" ? "♥" : "★"), sideName(s));
    return h("div", { class: "gc-pane" },
      h("p", { class: "gc-head" }, drop(), h("b", {}, `You have ${bal} blood`)),
      h("div", { class: "gc-card" },
        h("div", { class: "gc-cell" }, h("span", {}, "Stake"),
          h("div", { class: "gc-step" },
            h("button", { type: "button", "aria-label": "Less", disabled: stake <= 1, onclick: () => { stake = Math.max(1, stake - 1); render(); } }, "−"),
            h("b", {}, drop(), String(stake)),
            h("button", { type: "button", "aria-label": "More", disabled: stake >= maxStake(), onclick: () => { stake = Math.min(maxStake(), stake + 1); render(); } }, "+"))),
        h("div", { class: "gc-cell sides" }, h("span", {}, "Your side"), h("div", { class: "cf-sides" }, sideBtn("heads"), sideBtn("tails")))),
      h("button", { type: "button", class: "gc-ribbon", disabled: !can, onclick: () => post() }, "Post Flip"),
      h("p", { class: "gc-note" }, bal < 1
        ? "You need at least 1 blood to play."
        : mineOpen >= FLIP_MAX_OPEN
          ? `You already have ${maxOpen} open flips. Take one back or wait for somebody to take it.`
          : `Post a flip and anyone can take it (they get ${theirSide}). Up to ${maxFlip} blood per flip.`));
  }

  function openRow(f: OpenFlip): HTMLElement {
    const mine = f.by === me.uid;
    const picked = mine ? "You picked" : "Picked";
    const face = sideName(f.side);
    const when = ago(f.ts);
    const who = h("div", { class: "gc-who" }, h("b", {}, mine ? "Your flip" : f.name), h("small", {}, `${picked} ${face} · ${when}`));
    const row = h("div", { class: "gc-row" }, h("span", { class: "gc-num" }, drop(), String(f.stake)), who);
    if (mine) {
      row.append(h("button", { type: "button", class: "gc-ribbon sm red", disabled: busy, onclick: () => back(f) }, "Cancel"));
    } else {
      const poor = balance() < f.stake;
      const ask = "Tap again";
      const go = "Take";
      row.append(h("button", { type: "button", class: "gc-ribbon sm", disabled: busy || poor, title: poor ? "You don't have that much blood." : "", onclick: () => take(f) }, sure === f.id ? ask : go));
    }
    return row;
  }

  function doneRow(f: DoneFlip): HTMLElement {
    const iPosted = f.by === me.uid;
    const won = f.winner === me.uid;
    const face = sideName(f.result);
    const when = ago(f.at);
    return h("div", { class: "gc-row" }, h("span", { class: "gc-num" }, drop(), String(f.stake)),
      h("div", { class: "gc-who" }, h("b", {}, iPosted ? f.takerName : f.name), h("small", {}, `${face} · ${when}`)),
      h("span", { class: "gc-tag " + (won ? "win" : "lose") }, won ? `+${f.stake}` : `−${f.stake}`));
  }

  function openPane(): HTMLElement {
    const open = [...board.open].sort((a, b) => b.ts - a.ts);
    const count = open.length;
    return h("div", { class: "gc-pane" },
      h("p", { class: "gc-head" }, open.length === 1 ? "❖ 1 Open Flip ❖" : `❖ ${count} Open Flips ❖`),
      h("div", { class: "gc-list" }, ...(open.length ? open.map(openRow) : [h("p", { class: "gc-empty" }, "No open flips right now. Post one from Play.")])));
  }

  function minePane(): HTMLElement {
    const mine = board.done.filter((f) => f.by === me.uid || f.taker === me.uid).slice(0, 60);
    return h("div", { class: "gc-pane" },
      h("p", { class: "gc-head" }, "❖ Your Flips ❖"),
      h("div", { class: "gc-list" }, ...(mine.length ? mine.map(doneRow) : [h("p", { class: "gc-empty" }, "Your finished flips show up here.")])));
  }

  function render(): void {
    if (closed) return;
    const others = board.open.filter((f) => f.by !== me.uid).length;
    body.replaceChildren(
      h("div", { class: "gc-hero" },
        h("div", { class: "gc-hero-txt" }, h("h2", { class: "gc-title" }, "COIN FLIP"), h("p", {}, "Put your blood on heads or tails. The winner takes both stakes.")),
        h("div", { class: "cf-mini-toss", "aria-hidden": "true" }, h("div", { class: "cf-coin sm spin" }, h("i", { class: "h" }, h("b", {}, "♥")), h("i", { class: "t" }, h("b", {}, "★"))))),
      h("div", { class: "gc-tabs", role: "tablist" }, tabBtn("play", "Play"), tabBtn("open", "Open Flips", others ? String(others) : ""), tabBtn("mine", "History")),
      tab === "play" ? playPane() : tab === "open" ? openPane() : minePane());
  }

  // ---- doing things ---------------------------------------------------------------------------------------------
  async function post(): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try {
      await postFlip(me, stake, side);
      playSfx("give", 0.5);
      const amount = stake;
      toast(`Your ${amount} blood flip is up. You'll hear when somebody takes it.`);
      tab = "open";
      onChange();
    } catch (err) {
      toast((err as Error).message || "Couldn't post the flip.", "err");
    }
    busy = false;
    render();
  }

  async function back(f: OpenFlip): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try { await cancelFlip(me, f.id); toast(`${f.stake} blood is back in your pocket.`); onChange(); } catch (err) { toast((err as Error).message || "Couldn't take it back.", "err"); }
    busy = false;
    render();
  }

  function take(f: OpenFlip): void {
    if (busy) return;
    if (sure !== f.id) { // the first tap only asks: it costs blood
      sure = f.id;
      window.clearTimeout(sureTimer);
      sureTimer = window.setTimeout(() => { sure = ""; render(); }, 3000);
      render();
      return;
    }
    sure = "";
    void doTake(f);
  }

  async function doTake(f: OpenFlip): Promise<void> {
    busy = true;
    render();
    tossStart();
    try {
      const r = await takeFlip(me, f.id);
      onChange();
      await tossLand(r.result, r.won, r.stake, f.name);
    } catch (err) {
      tossFail();
      toast((err as Error).message || "Somebody else took that flip first, or the connection dropped.", "err");
    }
    busy = false;
    render();
  }

  // ---- the toss: the coin spins while the server decides, then lands on the result ---------------------------------
  let spin: Animation | null = null;
  let coin: HTMLElement | null = null;
  const res = h("p", { class: "cf-res" });
  const resSub = h("p", { class: "cf-res-sub" });
  const done = h("button", { type: "button", class: "gc-ribbon", hidden: true, onclick: () => { stage.hidden = true; coin?.getAnimations().forEach((a) => a.cancel()); tab = "mine"; render(); } }, "Done");

  function tossStart(): void {
    stage.hidden = false;
    res.textContent = ""; res.className = "cf-res"; resSub.textContent = ""; done.hidden = true;
    coin = h("div", { class: "cf-coin" }, h("i", { class: "h" }, h("b", {}, "♥"), h("small", {}, "HEADS")), h("i", { class: "t" }, h("b", {}, "★"), h("small", {}, "TAILS")));
    for (let z = -4; z <= 4; z++) { const e = h("i", { class: "e" }); e.style.transform = `translateZ(${z}px)`; coin.prepend(e); } // the coin's thickness
    stage.replaceChildren(h("div", { class: "cf-toss" }, coin), h("div", { class: "cf-shadow" }), res, resSub, done);
    playSfx("select", 0.5);
    spin?.cancel();
    const c = coin;
    spin = c.animate([{ transform: "translateY(0) rotateX(0deg)" }, { transform: "translateY(-120px) rotateX(720deg)" }], { duration: 700, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
    spin.finished.then(() => {
      if (!spin || spin.playState !== "finished") return;
      spin = c.animate([{ transform: "translateY(-120px) rotateX(0deg)" }, { transform: "translateY(-120px) rotateX(360deg)" }], { duration: 260, iterations: Infinity });
    }).catch(() => undefined);
  }

  async function tossLand(face: Side, won: boolean, st: number, vs: string): Promise<void> {
    if (!coin) return;
    const turns = 1440 + (face === "tails" ? 180 : 0);
    spin?.cancel();
    spin = null;
    const a = coin.animate([
      { transform: "translateY(-120px) rotateX(0deg)" },
      { transform: `translateY(-150px) rotateX(${turns * 0.55}deg)`, offset: 0.35 },
      { transform: `translateY(0) rotateX(${turns}deg)`, offset: 0.82 },
      { transform: `translateY(-14px) rotateX(${turns}deg)`, offset: 0.9 },
      { transform: `translateY(0) rotateX(${turns}deg)` },
    ], { duration: 1500, easing: "ease-in-out", fill: "forwards" });
    await a.finished.catch(() => undefined);
    playSfx(won ? "give" : "select", 0.6);
    const landed = sideName(face);
    const prize = st * 2;
    res.textContent = won ? `YOU WIN ${prize}` : landed.toUpperCase();
    res.className = "cf-res" + (won ? " win" : "");
    resSub.textContent = won ? `It landed on ${landed}. You beat ${vs}.` : `It landed on ${landed}. You lost ${st} blood to ${vs}.`;
    done.hidden = false;
  }

  function tossFail(): void {
    spin?.cancel();
    spin = null;
    stage.hidden = true;
  }

  render();
  const off = onBoard(() => { if (!busy) render(); });

  function close(): void {
    if (closed) return;
    closed = true;
    off();
    window.clearTimeout(sureTimer);
    window.removeEventListener("keydown", onKey);
    root.remove();
    onClose();
  }
  return { close, refresh: render };
}
