import { h, toast } from "./dom";
import { call } from "../db";
import { findSlot, itemDef, onFurniIcon } from "../items";
import { CASE_ITEM, CASE_TABLE, KEY_ITEM, Tier, UNUSUAL_IDS } from "../shared/cases";
import { CASE_FURNI, CASE_JUNK, CASE_RARE_FURNI, randomUnusualPet } from "../shared/cases";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

interface Prize { id: string; tier: Tier; item: string; qty: number; ass?: boolean }
const TIER_COLOR: Record<Tier, string> = { junk: "#8f98a6", common: "#4a90e2", rare: "#a45bff", unusual: "#ffb62e" };
const TIER_NAME: Record<Tier, string> = { junk: "Junk", common: "Common", rare: "Rare", unusual: "Unusual" };

const nameOf = (item: string, ass?: boolean): string => `${itemDef(item)?.name ?? item}${ass ? " (ass)" : ""}`;
const iconOf = (item: string): string => itemDef(item)?.icon ?? "";
const countOf = (ctx: Ctx, item: string): number => ctx.profile.inventory.reduce((n, s) => n + (s && s.item === item && !s.inPlayer ? s.qty : 0), 0);

/** a tile for the spinning strip: a random thing from the box's table (the real prize is slipped in near the end) */
function randomTile(): Prize {
  let r = Math.random() * 100;
  let row = CASE_TABLE[0];
  for (const p of CASE_TABLE) { if (r < p.chance) { row = p; break; } r -= p.chance; }
  const pick = <T,>(l: T[]): T => l[Math.floor(Math.random() * l.length)];
  const junk = row.id === "junk" ? pick(CASE_JUNK) : null;
  const item = junk ? junk.item : row.id === "furni" ? pick(CASE_FURNI) : row.id === "unusual" ? pick(UNUSUAL_IDS) : row.id === "knifeskin" ? "knife_tt" : row.id === "unusualpet" ? randomUnusualPet((n) => Math.floor(Math.random() * n)) : row.id === "rarefurni" ? pick(CASE_RARE_FURNI) : row.id;
  return { id: row.id, tier: row.tier, item, qty: 1, ass: !!junk?.ass };
}

/**
 * The mystery box window (iOS 6 look, the way the cases open in CS:GO): press Open and a strip of prizes rolls past the gold marker and slows down on yours.
 * The prize is rolled by the server first; the strip only plays it.
 */
export function openCaseWindow(host: HTMLElement, ctx: Ctx, roomId: string, onChange: () => void, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let busy = false;
  let won: Prize | null = null;
  const strip = h("div", { class: "case-strip" });
  const view = h("div", { class: "case-view" }, strip, h("div", { class: "case-marker" }), h("div", { class: "case-glass" }));
  const info = h("div", { class: "case-info" });
  const actions = h("div", { class: "row center" });
  const result = h("div", { class: "case-result" });
  const el = h("div", { class: "case-overlay", onclick: (e: Event) => { if (e.target === el && !busy) close(); } },
    h("div", { class: "case-card", role: "dialog", "aria-label": "Mystery box" },
      h("div", { class: "case-nav" }, h("div", { class: "case-title" }, "Mystery box"), h("button", { class: "case-done", disabled: false, onclick: () => { if (!busy) close(); } }, "Done")),
      h("div", { class: "case-body" },
        h("div", { class: "case-hero" }, h("img", { class: "case-pic", src: iconOf(CASE_ITEM), alt: "" }), h("img", { class: "case-pic key", src: iconOf(KEY_ITEM), alt: "" })),
        view, result, info, actions)));
  host.append(el);

  const tile = (p: Prize, extra = ""): HTMLElement => h("div", { class: `case-tile ${extra}`, style: { borderBottomColor: TIER_COLOR[p.tier] } },
    h("img", { src: iconOf(p.item), alt: "", draggable: false, "data-item": p.item }), h("div", { class: "case-tname" }, nameOf(p.item, p.ass)));
  function idle(): void {
    strip.style.transition = "none"; strip.style.transform = "translateX(0)";
    strip.replaceChildren(...Array.from({ length: 14 }, () => tile(randomTile())));
    // a gentle slow drift while it waits
    strip.style.transform = "translateX(-30px)";
  }
  function render(): void {
    if (closed) return;
    const boxes = countOf(ctx, CASE_ITEM), keys = countOf(ctx, KEY_ITEM);
    info.replaceChildren(
      h("div", { class: "case-counts" }, h("span", {}, `📦 ${boxes} box${boxes === 1 ? "" : "es"}`), h("span", {}, `🔑 ${keys} key${keys === 1 ? "" : "s"}`)),
      h("div", { class: "hint" }, boxes < 1 ? "You have no box. Boxes turn up in the bins." : keys < 1 ? "You need a key: 6ixty sells them (250 blood), and so does the pay2win machine in the shop (2 for 25 kr)." : "One key opens one box."));
    actions.replaceChildren(
      h("button", { class: "btn primary case-open", disabled: busy || boxes < 1 || keys < 1, onclick: () => void open() }, busy ? "Opening…" : won ? "Open another" : "Open (uses 1 key)"));
  }
  idle(); render();

  async function open(): Promise<void> {
    if (busy || findSlot(me.inventory, CASE_ITEM) < 0 || findSlot(me.inventory, KEY_ITEM) < 0) return;
    busy = true; won = null; result.replaceChildren(); render();
    let prize: Prize;
    try { prize = (await call<{ prize: Prize }>(me, "caseOpen", { room: roomId })).prize; } catch (err) { toast((err as Error).message || "It won't open.", "err"); busy = false; render(); return; }
    ctx.refreshHeader(); onChange();
    // the strip: 46 random tiles, the prize at tile 38; it rolls until that tile is under the marker
    const WIN = 38, tiles = Array.from({ length: 46 }, (_, i) => (i === WIN ? prize : randomTile()));
    strip.style.transition = "none"; strip.style.transform = "translateX(0)";
    strip.replaceChildren(...tiles.map((t, i) => tile(t, i === WIN ? "win" : "")));
    void strip.offsetWidth;
    const tw = (strip.children[1] as HTMLElement).offsetLeft - (strip.children[0] as HTMLElement).offsetLeft || 92;
    const target = WIN * tw + tw / 2 + (Math.random() - 0.5) * tw * 0.6 - view.clientWidth / 2;
    playSfx("select", 0.4);
    strip.style.transition = "transform 5.6s cubic-bezier(.08,.55,.1,1)";
    strip.style.transform = `translateX(${-target}px)`;
    const tick = window.setInterval(() => playSfx("select", 0.08), 260);
    await new Promise<void>((res) => window.setTimeout(res, 5800));
    window.clearInterval(tick);
    if (closed) return;
    won = prize;
    playSfx(prize.tier === "unusual" ? "give" : "coins", 0.7);
    logAction(me, "room", `opened a mystery box: ${prize.item}`);
    result.replaceChildren(h("div", { class: `case-won tier-${prize.tier}`, style: { boxShadow: `0 0 18px ${TIER_COLOR[prize.tier]}` } },
      h("img", { src: iconOf(prize.item), alt: "", "data-item": prize.item }),
      h("div", {}, h("div", { class: "case-won-tier", style: { color: TIER_COLOR[prize.tier] } }, TIER_NAME[prize.tier]), h("div", { class: "case-won-name" }, nameOf(prize.item, prize.ass)))));
    busy = false; render();
  }
  const refresh = (): void => { if (!busy) render(); };
  window.addEventListener("pocket-changed", refresh);
  // furniture pictures are drawn out of their .nitro files a moment after they are first asked for: swap them in when they are ready
  const offIcons = onFurniIcon(() => el.querySelectorAll<HTMLImageElement>("img[data-item]").forEach((im) => { const src = iconOf(im.dataset.item ?? ""); if (src && im.src !== src) im.src = src; }));
  function close(): void { if (closed) return; closed = true; offIcons(); window.removeEventListener("pocket-changed", refresh); el.remove(); onClose(); }
  return { close };
}
