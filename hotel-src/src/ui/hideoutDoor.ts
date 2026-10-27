import { h, toast } from "./dom";
import { hideoutAnswer, hideoutFavorite, watchHideoutFavs, watchHideoutInvites, watchHideoutList, watchMyHideouts } from "../hideout";
import { social } from "../social";
import { sortListings } from "../shared/hideout";
import type { HideoutListing } from "../shared/hideout";
import type { MyHideout } from "../hideout";
import { isHideoutId, LOBBY_ID, watchAllRooms } from "../rooms";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/** The hideout door in the basement: pick one of the hideouts you are in (yours, or one you were invited to), or answer an invite. */
export function openHideoutDoor(host: HTMLElement, ctx: Ctx, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let mine: MyHideout[] = [];
  let invites: Array<{ owner: string; fromName: string; roomName: string; at: number }> = [];
  let list: Array<{ owner: string; listing: HideoutListing }> = [];
  let everyHideout: Array<{ owner: string; name: string; ownerName: string; members: number }> = []; // (for the accounts that may enter any hideout: all of them, listed or not)
  let favs = new Set<string>();
  let tab: "boosted" | "all" | null = null; // (null: the boosted ones if there are any, else all)
  let knocking: { owner: string; name: string; state: "waiting" | "declined" | "none" } | null = null;
  let stopKnock: (() => void) | null = null;
  let knockTimer = 0;
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
    // the hideouts whose owners left them on the list: you can't ask to be a member (the owner adds members on the hideout's computer), but you can knock and be let in as a guest
    const now = Date.now();
    // an account that may enter any hideout also gets the ones that are not on the list (open to it: it just walks in), in the same list with the same tabs
    const unlisted = me.enterAnywhere ? everyHideout.filter((x) => x.owner !== me.uid && !list.some((l) => l.owner === x.owner)).map((x) => ({ owner: x.owner, listing: { name: x.name, desc: "not on the list", ownerName: x.ownerName, members: x.members, boostUntil: 0, open: true } as HideoutListing })) : [];
    const others = [...list, ...unlisted].filter((l) => l.owner === me.uid || !mine.some((m) => m.owner === l.owner)); // (your own listed hideout is in the tabs too, so you can see that it is boosted)
    const boosted = sortListings(others.filter((l) => l.listing.boostUntil > now), now);
    const plain = sortListings(others.filter((l) => !(l.listing.boostUntil > now)), now);
    const favRows = sortListings(others.filter((l) => favs.has(l.owner)), now);
    const rowFor = (o: { owner: string; listing: HideoutListing }): HTMLElement => {
      const fav = favs.has(o.owner);
      const n = o.listing.favs ?? 0;
      const yours = o.owner === me.uid;
      return h("div", { class: "door-row" },
        yours ? "" : h("button", { class: "btn small door-star" + (fav ? " on" : ""), title: fav ? "Take it off your favourites" : "Add it to your favourites", "aria-label": "Favourite", onclick: () => void hideoutFavorite(me, o.owner).catch((e) => toast((e as Error).message, "err")) }, fav ? "★" : "☆"),
        h("div", { class: "door-row-main" },
          h("div", { class: "door-row-name" }, `${o.listing.boostUntil > now ? "🔥 " : ""}${o.listing.name}`),
          h("div", { class: "hint" }, `${yours ? "Yours" : o.listing.ownerName} · ${o.listing.members} member${o.listing.members === 1 ? "" : "s"}${n ? ` · ★ ${n}` : ""}${o.listing.desc ? ` · ${o.listing.desc}` : ""}`)),
        o.listing.open
          ? h("button", { class: "btn small primary", onclick: () => { playSfx("select", 0.5); close(); ctx.navigate("room", { roomId: `h_${o.owner}`, from: LOBBY_ID }); } }, "Enter")
          : knocking?.owner === o.owner
          ? (knocking.state === "waiting" ? h("span", { class: "hint" }, "Knocking…") : h("span", { class: "hint" }, knocking.state === "declined" ? "Sent away" : "Nobody answered"))
          : h("button", { class: "btn small", disabled: !!knocking && knocking.state === "waiting", onclick: () => startKnock(o.owner, o.listing.name) }, "Knock"));
    };
    if (favRows.length) { rows.push(h("div", { class: "fp-label" }, "★ Favourites")); rows.push(...favRows.map(rowFor)); }
    if (others.length) {
      const active = tab ?? (boosted.length ? "boosted" : "all");
      const shownRows = active === "boosted" ? boosted : plain;
      rows.push(h("div", { class: "door-tabs" },
        h("button", { class: "door-tab" + (active === "boosted" ? " on" : ""), onclick: () => { tab = "boosted"; render(); } }, `🔥 Boosted (${boosted.length})`),
        h("button", { class: "door-tab" + (active === "all" ? " on" : ""), onclick: () => { tab = "all"; render(); } }, `All (${plain.length})`)));
      rows.push(...(shownRows.length ? shownRows.map(rowFor) : [h("div", { class: "hint pad" }, active === "boosted" ? "No boosted hideouts right now. A hideout's owner can advertise it for an hour." : "No hideouts here yet.")]));
    }
    body.replaceChildren(...rows);
  }
  function startKnock(owner: string, name: string): void {
    knocking = { owner, name, state: "waiting" };
    render();
    social.hideoutKnock(owner).then(() => {
      if (closed || knocking?.owner !== owner) return;
      stopKnock = social.watchHideoutKnock(owner, (answer) => {
        if (closed || knocking?.owner !== owner) return;
        stopKnock?.(); stopKnock = null; window.clearTimeout(knockTimer);
        if (answer === "accepted") { toast("You are let in as a guest."); playSfx("select", 0.5); close(); ctx.navigate("room", { roomId: `h_${owner}`, from: LOBBY_ID }); }
        else { knocking = { owner, name, state: "declined" }; render(); }
      });
      knockTimer = window.setTimeout(() => {
        if (closed || knocking?.state !== "waiting") return;
        stopKnock?.(); stopKnock = null;
        void social.cancelHideoutKnock(owner);
        knocking = { owner, name, state: "none" };
        render();
      }, 30_000);
      playSfx("knock", 0.35);
    }, () => { toast("Couldn't knock.", "err"); knocking = null; render(); });
  }
  const stops = [watchHideoutFavs(me.uid, (f) => { favs = f; render(); }), ...(me.enterAnywhere ? [watchAllRooms((all) => { everyHideout = Object.entries(all).filter(([id, m]) => isHideoutId(id) && m?.owner).map(([id, m]) => ({ owner: id.slice(2), name: String(m.name ?? "Hideout"), ownerName: String(m.ownerName ?? "?"), members: Object.keys((m as { members?: object }).members ?? {}).length + 1 })); render(); })] : []), watchHideoutList((l) => { list = l; render(); }), watchMyHideouts(me.uid, (l) => { mine = l; render(); }), watchHideoutInvites(me.uid, (l) => { invites = l; render(); })];
  render();
  function close(): void { if (closed) return; closed = true; window.clearTimeout(knockTimer); stopKnock?.(); if (knocking?.state === "waiting") void social.cancelHideoutKnock(knocking.owner); stops.forEach((s) => s()); el.remove(); onClose(); }
  return { close };
}
