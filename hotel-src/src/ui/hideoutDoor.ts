import { h, toast } from "./dom";
import { hideoutAnswer, watchHideoutInvites, watchMyHideouts } from "../hideout";
import type { MyHideout } from "../hideout";
import { LOBBY_ID } from "../rooms";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/** The hideout door in the basement: pick one of the hideouts you are in (yours, or one you were invited to), or answer an invite. */
export function openHideoutDoor(host: HTMLElement, ctx: Ctx, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let mine: MyHideout[] = [];
  let invites: Array<{ owner: string; fromName: string; roomName: string; at: number }> = [];
  const body = h("div", { class: "door-body" });
  const el = h("div", { class: "door-popup hideout-door", role: "dialog", "aria-label": "Hideouts" },
    h("div", { class: "door-head" }, h("strong", {}, "🚪 Hideouts"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    body);
  host.append(el);
  const enter = (r: MyHideout): void => { playSfx("select", 0.5); close(); ctx.navigate("room", { roomId: r.room, from: LOBBY_ID }); };
  function render(): void {
    if (closed) return;
    const rows: HTMLElement[] = [];
    if (invites.length) {
      rows.push(h("div", { class: "fp-label" }, "Invites"));
      for (const i of invites) rows.push(h("div", { class: "door-row" },
        h("div", { class: "door-row-main" }, h("div", { class: "door-row-name" }, i.roomName), h("div", { class: "hint" }, `${i.fromName} invites you`)),
        h("button", { class: "btn small primary", onclick: () => void hideoutAnswer(me, i.owner, true).then(() => toast("You joined."), (e) => toast((e as Error).message, "err")) }, "Join"),
        h("button", { class: "btn small", onclick: () => void hideoutAnswer(me, i.owner, false).catch(() => undefined) }, "No")));
    }
    rows.push(h("div", { class: "fp-label" }, "Your hideouts"));
    if (!mine.length) rows.push(h("div", { class: "hint pad" }, "You aren't in a hideout. The landlord next to the door sells them, or ask a friend to invite you."));
    for (const r of mine) rows.push(h("div", { class: "door-row" },
      h("div", { class: "door-row-main" }, h("div", { class: "door-row-name" }, r.name), h("div", { class: "hint" }, r.role === "owner" ? "Yours" : "You are a member")),
      h("button", { class: "btn small primary", onclick: () => enter(r) }, "Enter")));
    body.replaceChildren(...rows);
  }
  const stops = [watchMyHideouts(me.uid, (l) => { mine = l; render(); }), watchHideoutInvites(me.uid, (l) => { invites = l; render(); })];
  render();
  function close(): void { if (closed) return; closed = true; stops.forEach((s) => s()); el.remove(); onClose(); }
  return { close };
}
