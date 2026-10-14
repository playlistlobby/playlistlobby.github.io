import { onValue, ref, Unsubscribe } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { call, serverNow } from "../db";
import { itemDef } from "../items";
import { MIX_RECIPES, mixRecipe } from "../shared/items";
import { MIX_MS } from "../shared/economy";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface MixerApi { close(): void; refresh(): void }

interface Job { item: string; qty: number; doneAt: number }

/** The mixer window: tap two things, see what they make, press Mix. It works for 10 minutes; come back and Collect. */
export function openMixer(host: HTMLElement, ctx: Ctx, fid: string, roomId: string, onChange: () => void, onClose: () => void): MixerApi {
  const me = ctx.profile;
  let closed = false;
  let first: number | null = null;
  let second: number | null = null;
  let job: Job | null = null;
  const body = h("div", { class: "mixer-body" });
  const el = h("div", { class: "cd-popup mixer", role: "dialog", "aria-label": "Mixer" },
    h("div", { class: "cd-head" }, h("strong", {}, "Mixer"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  const off: Unsubscribe = onValue(ref(db, `roomsMeta/${roomId}/furni/${fid}/mixJob`), (snap) => {
    const v = snap.val() as Partial<Job> | null;
    job = v && typeof v.item === "string" && typeof v.doneAt === "number" ? { item: v.item, qty: Number(v.qty) || 1, doneAt: v.doneAt } : null;
    render();
  }, () => undefined);
  // the countdown ticks on its own
  const tick = window.setInterval(() => { if (job) render(); }, 1000);

  const label = (slot: number | null): string => { const s = slot === null ? null : me.inventory[slot]; return s ? `${itemDef(s.item)?.name ?? s.item}${s.ass ? " (ass)" : ""}` : "—"; };
  const clock = (ms: number): string => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  function renderJob(j: Job): void {
    const d = itemDef(j.item);
    const left = j.doneAt - serverNow();
    const done = left <= 0;
    body.replaceChildren(
      h("div", { class: "mixer-line" }, done ? "Your batch is ready!" : "The mixer is working…"),
      h("div", { class: "mixer-result" }, ...(d ? [h("img", { src: d.icon, alt: "" }), `${j.qty} × ${d.name}`] : [])),
      h("div", { class: "mixer-bar" }, h("div", { class: "mixer-bar-fill", style: { width: `${Math.round(Math.min(1, 1 - left / MIX_MS) * 100)}%` } })),
      h("div", { class: "hint", style: { textAlign: "center" } }, done ? "Tap Collect." : `${clock(left)} left. You can leave: it keeps going.`),
      h("div", { class: "row center" },
        h("button", {
          class: "btn primary", disabled: !done,
          onclick: async () => {
            try {
              const r = await call<{ item?: string; qty?: number }>(me, "mixCollect", { fid });
              playSfx("give", 0.5);
              toast(`You collect ${r.qty ?? j.qty} ${d?.name ?? "of it"}.`);
              onChange();
            } catch (err) { toast((err as Error).message || "It isn't done yet.", "err"); }
          },
        }, "Collect")));
  }

  function render(): void {
    if (closed) return;
    if (job) return renderJob(job);
    if (first !== null && !me.inventory[first]) first = null;
    if (second !== null && !me.inventory[second]) second = null;
    // only things that go into some recipe are shown
    const usable = new Set<string>();
    for (const r of MIX_RECIPES) { usable.add(r.a.item); usable.add(r.b.item); }
    const cells = me.inventory.map((s, slot) => ({ s, slot })).filter((e) => e.s && usable.has(e.s.item) && !e.s.lit && !e.s.inPlayer);
    const a = first !== null ? me.inventory[first] : null, b = second !== null ? me.inventory[second] : null;
    const recipe = a && b ? mixRecipe(a, b) : null;
    const result = recipe ? itemDef(recipe.give.item) : null;
    body.replaceChildren(
      h("div", { class: "hint" }, cells.length ? "Tap two things to mix. Every batch takes 10 minutes." : "You have nothing that mixes (weed, ass weed, cigarettes, pills, kodimagnyl, a full watering can)."),
      h("div", { class: "mixer-grid" }, ...cells.map(({ s, slot }) => {
        const d = itemDef(s!.item)!;
        const on = slot === first || slot === second;
        return h("button", {
          class: "inv-slot filled" + (on ? " selected" : ""),
          title: d.name + (s!.ass ? " (ass)" : ""),
          onclick: () => {
            if (slot === first) first = null; else if (slot === second) second = null;
            else if (first === null) first = slot;
            else if (second === null) second = slot;
            else { first = second; second = slot; }
            render();
          },
        }, h("img", { src: d.icon, alt: d.name, draggable: false }), ...(s!.qty > 1 ? [h("span", { class: "qty" }, String(s!.qty))] : []), ...(s!.ass ? [h("span", { class: "ass-tag" }, "ass")] : []));
      })),
      h("div", { class: "mixer-line" }, `${label(first)}  +  ${label(second)}`),
      h("div", { class: "mixer-result" }, ...(recipe && result ? [h("img", { src: result.icon, alt: "" }), ` → ${recipe.give.qty} × ${result.name}`] : [a && b ? "Those don't mix." : ""])),
      h("div", { class: "row center" },
        h("button", {
          class: "btn primary", disabled: !recipe,
          onclick: async () => {
            if (first === null || second === null) return;
            try {
              const r = await call<{ note?: string }>(me, "mix", { fid, a: first, b: second });
              playSfx("give", 0.5);
              toast(r.note || "The mixer starts up.");
              first = null; second = null;
              onChange();
            } catch (err) { toast((err as Error).message || "Those don't mix.", "err"); }
          },
        }, "Start mixing (10 min)")));
  }
  render();
  function close(): void {
    if (closed) return;
    closed = true;
    off();
    window.clearInterval(tick);
    el.remove();
    onClose();
  }
  return { close, refresh: render };
}
