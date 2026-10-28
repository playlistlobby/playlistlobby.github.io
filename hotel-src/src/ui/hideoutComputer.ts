import { h, toast } from "./dom";
import { hideoutBoost, hideoutCollect, hideoutFavorite, hideoutInvite, hideoutKick, hideoutLeave, hideoutMember, hideoutOrder, hideoutSearch, hideoutSettings, hideoutTillCollect, watchHideoutFavs, watchHideoutTill } from "../hideout";
import { mountSoundcloud, scIcon } from "./soundcloud";
import type { ScHandle } from "./soundcloud";
import { donateToHideout, watchDonated } from "../soundcloud";
import { DONATE_DAILY_MAX } from "../shared/songs";
import { BLOOD_ICON, furniIcon, itemDef, onFurniIcon } from "../items";
import { FURNI_KINDS, isCdKind, LOBBY_ID } from "../rooms";
import type { RoomDef } from "../rooms";
import { hitSearch } from "../hits";
import { headBoxFor } from "./head";
import { call } from "../db";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { danishDayKey } from "../shared/streets";
import { DW_DEADLINE_HOUR, DW_ORDERS, dwFilled, dwLeft, dwOpen, dwTotal, dwUnitPay } from "../shared/darkweb";
import type { DwProgress } from "../shared/darkweb";
import { hideoutPriceOf, HIDEOUT_AD_MAX, HIDEOUT_AD_PRICE, HIDEOUT_BOOST_PRICE, HIDEOUT_DESC_MAX, HIDEOUT_MAX_MEMBERS, HIDEOUT_ORDER_MS, HIDEOUT_SHOP, HIDEOUT_NAME_MAX } from "../shared/hideout";
import { countdownText } from "../shared/raffle";
import { serverNow } from "../db";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface ComputerApi { close(): void; refresh(): void }

type Page = "shop" | "members" | "darkweb" | "tables" | "sound"; // (the Shop page also holds the orders, the Members page also holds the settings)
const PAGES: Array<{ id: Page; icon: string; label: string; owner?: boolean; svg?: string }> = [
  { id: "shop", icon: "🛒", label: "Shop" },
  { id: "members", icon: "👥", label: "Members" },
  { id: "darkweb", icon: "🕸️", label: "Dark web" },
  { id: "tables", icon: "💰", label: "Tables", owner: true },
  { id: "sound", icon: "", label: "SoundCloud", svg: "note" },
];

/**
 * The hideout's computer: a website (iOS 6 look) for the gang. Order hideout furniture (it arrives in an hour), see your orders, manage the members
 * (invite by name, set who may build, kick), the settings (name, lock building, leave) and the Tables page (the owner collects what the poker tables have earned).
 */
export function openHideoutComputer(host: HTMLElement, ctx: Ctx, roomId: string, getDef: () => RoomDef, onChange: () => void, onClose: () => void): ComputerApi {
  const me = ctx.profile;
  let closed = false;
  let page: Page = getDef().ownerUid === me.uid || !!getDef().hideout?.members?.[me.uid] ? "shop" : "sound";
  let till = { blood: 0, total: 0 };
  let results: Array<{ uid: string; name: string }> = [];
  let searchTimer = 0;
  let searchQ = "";
  let busy = false;
  let dwAll: Record<string, Record<string, DwProgress>> = {}; // the hideout's dark web orders: day -> order -> progress (the days that are not over for somebody who has a share to collect)
  const stops = [watchHideoutFavs(me.uid, (f) => { favs = f; if (page === "members") render(); }), watchDonated(me.uid, (n) => { donated = n; if (page === "members") render(); }), watchHideoutTill(me.uid, (t) => { till = t; if (page === "tables") render(); }), onValue(ref(db, `darkweb/${roomId.slice(2)}`), (s) => { dwAll = (s.val() as Record<string, Record<string, DwProgress>> | null) ?? {}; if (page === "darkweb") render(); }, () => undefined)];
  const owner = (): boolean => getDef().ownerUid === me.uid;
  /** the staff can open any hideout's computer to see who is in it (they get the Members page only, and can't change anything) */
  const staffView = (): boolean => { const d = getDef(); return me.enterAnywhere && d.ownerUid !== me.uid && !d.hideout?.members?.[me.uid]; };
  /** somebody who is neither the owner nor a member (a guest, or staff looking in): SoundCloud and the Members page are theirs, nothing else */
  const guestView = (): boolean => { const d = getDef(); return d.ownerUid !== me.uid && !d.hideout?.members?.[me.uid]; };
  let sc: ScHandle | null = null; // (SoundCloud, mounted while its page is open: the page is not rebuilt every second like the others)
  const scHost = h("div", { class: "sc-host" });
  let favs = new Set<string>();
  let donated = 0;

  const url = h("div", { class: "hc-url" });
  const body = h("div", { class: "hc-body" });
  const tabs = h("div", { class: "hc-tabs" });
  const card = h("div", { class: "hc-card", role: "dialog", "aria-label": "Computer" },
    h("div", { class: "hc-nav" }, h("div", { class: "hc-title" }, "hideout.6ix"), h("button", { class: "hc-done", onclick: () => close() }, "Done")),
    url, body, tabs);
  const el = h("div", { class: "hc-overlay", onclick: (e: Event) => { if (e.target === el) close(); } }, card);
  host.append(el);

  const go = (p: Page): void => { (document.activeElement as HTMLElement | null)?.blur(); page = p; render(); };
  const act = async (what: () => Promise<string | void>): Promise<void> => {
    if (busy) return;
    busy = true;
    try { const msg = await what(); if (msg) { playSfx("select", 0.4); toast(msg); } onChange(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false; render();
  };

  /** the picture of a thing on the computer: a piece of furniture, or a plain item (the waterer, the chip) */
  const picOf = (kind: string): string => (kind.startsWith("f_") ? furniIcon(kind) : itemDef(kind)?.icon ?? "");
  const etaOf = (kind: string): number => HIDEOUT_SHOP.find((i) => i.kind === kind)?.etaMs ?? HIDEOUT_ORDER_MS;
  const minText = (ms: number): string => (ms >= 3_600_000 ? `${Math.round(ms / 3_600_000)} hour${ms >= 7_200_000 ? "s" : ""}` : `${Math.round(ms / 60000)} minutes`);

  /** a search box for players: type a part of a name ("mem" finds hbmem); the answers come as you type, each with a button of your own */
  type Person = { uid: string; name: string };
  /** the hitman site's list of who is online (kept for a while: the page is drawn again every second) */
  let onlineList: { at: number; rows: Person[]; loading: boolean } = { at: 0, rows: [], loading: false };
  function searchUi(placeholder: string, exclude: () => Set<string>, button: (r: Person) => HTMLElement, hits = false): HTMLElement[] {
    const input = h("input", { class: "hc-input", type: "search", placeholder, value: searchQ, autocomplete: "off", autocapitalize: "none", spellcheck: false }) as HTMLInputElement;
    const box = h("div", { class: "hc-results" });
    let state: "idle" | "short" | "searching" | "done" = searchQ.trim().length >= 2 ? "done" : "idle";
    const person = (r: Person): HTMLElement => h("div", { class: "hc-person" }, headBoxFor(r.uid), h("span", { class: "hc-pname" }, r.name), button(r));
    const paint = (): void => {
      const rows = results.filter((r) => !exclude().has(r.uid));
      if (hits && state === "idle") { // nothing typed yet: who is online right now (the protected ones are not in the list)
        const on = onlineList.rows.filter((r) => !exclude().has(r.uid));
        box.replaceChildren(h("div", { class: "hc-hint" }, onlineList.at === 0 ? "Looking for who is online…" : on.length ? "Online now" : "Nobody else is online."), ...on.map(person));
        return;
      }
      box.replaceChildren(...(state === "short" ? [h("div", { class: "hc-hint" }, "Type at least 2 letters.")]
        : state === "searching" ? [h("div", { class: "hc-hint" }, "Searching…")]
        : state === "done" && !rows.length && searchQ.trim().length >= 2 ? [h("div", { class: "hc-hint" }, "Nobody has a name like that.")]
        : rows.map(person)));
    };
    const loadOnline = (): void => {
      if (!hits || onlineList.loading || Date.now() - onlineList.at < 20_000) return;
      onlineList.loading = true;
      void hitSearch(me, "").then((r) => { onlineList = { at: Date.now(), rows: r.players, loading: false }; if (searchQ.trim().length < 2) paint(); }, () => { onlineList.loading = false; onlineList.at = Date.now(); });
    };
    const run = (): void => {
      const q = searchQ.trim();
      if (q.length < 2) { results = []; state = q.length ? "short" : "idle"; paint(); return; }
      state = "searching"; paint();
      void (hits ? hitSearch(me, q) : hideoutSearch(me, q)).then((r) => { if (q === searchQ.trim()) { results = r.players; state = "done"; paint(); } }, () => { state = "done"; paint(); });
    };
    input.addEventListener("input", () => { searchQ = input.value; window.clearTimeout(searchTimer); searchTimer = window.setTimeout(run, 180); });
    if (searchQ.trim().length >= 2 && !results.length) run(); else paint();
    loadOnline();
    return [input, box];
  }

  function shopPage(): HTMLElement[] {
    const mineWaiting = Object.values(getDef().hideout?.orders ?? {}).filter((o) => o.by === me.uid).length;
    const bought = getDef().hideout?.bought ?? {};
    return [
      h("div", { class: "hc-hero" }, h("div", { class: "hc-h1" }, "Hideout shop"), h("div", { class: "hc-sub" }, "What you order arrives later: collect it under Orders.")),
      ...HIDEOUT_SHOP.map((it) => {
        const price = hideoutPriceOf(it, bought[it.kind] ?? 0);
        return h("div", { class: "hc-card-row" },
          h("img", { class: "hc-ico", src: picOf(it.kind), alt: it.label }),
          h("div", { class: "hc-main" }, h("div", { class: "hc-name" }, it.label), h("div", { class: "hc-blurb" }, it.blurb), h("div", { class: "hc-meta" }, `Arrives in ${minText(it.etaMs)}${FURNI_KINDS[it.kind] ? ` · ${FURNI_KINDS[it.kind].w} × ${FURNI_KINDS[it.kind].h} tiles` : ""}`)),
          h("button", { class: "btn small primary", disabled: me.blood < price || busy || mineWaiting >= 50, onclick: () => void act(async () => { await hideoutOrder(me, roomId, it.kind); return `${it.label} ordered. It arrives in ${minText(it.etaMs)}.`; }) },
            h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), ` ${price}`));
      }),
    ];
  }

  function ordersPage(): HTMLElement[] {
    const orders = Object.entries(getDef().hideout?.orders ?? {}).sort((a, b) => a[1].doneAt - b[1].doneAt);
    const mine = orders.filter(([, o]) => o.by === me.uid);
    const label = (kind: string): string => HIDEOUT_SHOP.find((i) => i.kind === kind)?.label ?? FURNI_KINDS[kind]?.label ?? kind;
    return [
      h("div", { class: "hc-hero" }, h("div", { class: "hc-h1" }, "Your orders"), h("div", { class: "hc-sub" }, "Only the one who ordered something can collect it.")),
      ...(mine.length ? mine.map(([id, o]) => {
        const left = o.doneAt - serverNow();
        return h("div", { class: "hc-card-row" },
          h("img", { class: "hc-ico", src: picOf(o.kind), alt: "" }),
          h("div", { class: "hc-main" }, h("div", { class: "hc-name" }, label(o.kind)), h("div", { class: "hc-meta" }, left > 0 ? `Arrives in ${countdownText(left)}` : "Arrived!"),
            ...(left > 0 ? [h("div", { class: "hc-bar" }, h("div", { class: "hc-fill", style: { width: `${Math.max(0, Math.min(100, (1 - left / etaOf(o.kind)) * 100))}%` } }))] : [])),
          h("button", { class: "btn small primary", disabled: left > 0 || busy, onclick: () => void act(async () => { await hideoutCollect(me, roomId, id); return `${label(o.kind)} is in your pocket.`; }) }, "Collect"));
      }) : [h("div", { class: "hc-empty" }, "No orders. Order something in the Shop.")]),
      ...(orders.length > mine.length ? [h("div", { class: "hc-foot" }, `${orders.length - mine.length} more on the way for other members.`)] : []),
    ];
  }

  /** the hitman site: black and white. Put blood on somebody's head; whoever shoots them with a gun gets it. */
  /** the dark web: today's big orders. Everybody in the hideout hands in what they have; each one is paid at once, and the bars are shared. */
  function darkwebPage(): HTMLElement[] {
    const names = (p: DwProgress | undefined): string => Object.keys(p?.by ?? {}).length ? `Members who have helped: ${Object.keys(p!.by!).length}` : "Nobody has handed anything in yet";
    const open = dwOpen(serverNow());
    const today = danishDayKey(serverNow());
    /** your share of a filled order: shipping, ready to collect, or collected */
    const shareRow = (day: string, o: (typeof DW_ORDERS)[number], p: DwProgress | undefined): HTMLElement | null => {
      if (!p?.done || !p.readyAt) return null;
      const share = Number(p.by?.[me.uid]) || 0;
      if (share <= 0) return h("div", { class: "hint" }, "You didn't put anything in this one.");
      if (p.paid?.[me.uid]) return h("div", { class: "dw-share" }, h("span", {}, "Your share"), h("span", { class: "dw-reward" }, h("img", { src: BLOOD_ICON, alt: "" }), share.toLocaleString("en-US")), h("span", { class: "dw-tick" }, "Collected ✓"));
      const wait = p.readyAt - serverNow();
      return h("div", { class: "dw-share" }, h("span", {}, "Your share"), h("span", { class: "dw-reward" }, h("img", { src: BLOOD_ICON, alt: "" }), share.toLocaleString("en-US")),
        wait > 0 ? h("span", { class: "hint" }, `On its way: ${countdownText(wait)}`)
          : h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(async () => { const r = await call<{ share: number }>(me, "darkwebCollect", { room: roomId, day, order: o.id }); playSfx("coins", 0.5); return `You collected ${r.share} blood.`; }) }, `Collect ${share.toLocaleString("en-US")}`));
    };
    const card = (o: (typeof DW_ORDERS)[number]): HTMLElement => {
      const p = dwAll[today]?.[o.id];
      const filled = dwFilled(o, p);
      return h("div", { class: "dw-card" + (filled ? " done" : "") },
        h("div", { class: "dw-title" }, h("span", {}, o.title), filled ? h("span", { class: "dw-badge" }, "Filled") : h("span", { class: "dw-reward" }, h("img", { src: BLOOD_ICON, alt: "" }), dwTotal(o).toLocaleString("en-US"))),
        ...o.lines.map((l) => {
          const def = itemDef(l.item);
          const got = Math.min(l.qty, Number(p?.got?.[l.item]) || 0);
          const left = dwLeft(o, p, l.item);
          const have = me.inventory.reduce((n, s) => n + (s && s.item === l.item && !s.lit && !s.inPlayer && !s.ass ? s.qty : 0), 0);
          const give = Math.min(have, left);
          return h("div", { class: "dw-line" },
            def ? h("img", { src: def.icon, alt: "", class: "dw-ico" }) : null,
            h("div", { class: "dw-main" },
              h("div", { class: "dw-name" }, `${def?.name ?? l.item}`, h("span", { class: "dw-count" }, `${got} / ${l.qty}`)),
              h("div", { class: "dw-bar" }, h("div", { class: "dw-fill", style: { width: `${(got / l.qty) * 100}%` } })),
              h("div", { class: "hint" }, `Worth ${dwUnitPay(l.item)} blood each to your share`)),
            left <= 0 ? h("span", { class: "dw-tick" }, "✓")
              : h("button", { class: "btn small primary", disabled: busy || give <= 0 || !open.open, title: have <= 0 ? "You have none on you" : "", onclick: () => void act(async () => { const r = await call<{ gave: number; value: number; done: boolean }>(me, "darkwebGive", { room: roomId, order: o.id, item: l.item, qty: give }); playSfx("select", 0.5); return `You handed in ${r.gave}: ${r.value} blood added to your share.${r.done ? " The order is filled and on its way!" : ""}`; }) }, give > 0 ? `Give ${give}` : "Give"));
        }),
        shareRow(today, o, p) ?? h("div", { class: "hint" }, names(p), h("br"), "Your share is paid 20 minutes after the order is filled."));
    };
    // shares from an earlier day that nobody has collected yet (an order that was filled just before midnight)
    const earlier: HTMLElement[] = [];
    for (const day of Object.keys(dwAll).sort().reverse()) {
      if (day === today) continue;
      for (const o of DW_ORDERS) {
        const p = dwAll[day]?.[o.id];
        if (!p?.done || !(Number(p.by?.[me.uid]) > 0) || p.paid?.[me.uid]) continue;
        earlier.push(h("div", { class: "dw-card" }, h("div", { class: "dw-title" }, h("span", {}, `${o.title} (${day.slice(6)}/${day.slice(4, 6)})`), h("span", { class: "dw-badge" }, "Filled")), shareRow(day, o, p)));
      }
    }
    return [
      h("div", { class: "hc-hero ht-hero" }, h("div", { class: "hc-h1" }, "THE DARK WEB"), h("div", { class: "hc-sub" }, "Big orders. The whole hideout fills them together.")),
      h("div", { class: "dw-clock" + (open.open ? "" : " closed") }, open.open ? `Ships before ${DW_DEADLINE_HOUR}:00 today: ${countdownText(open.leftMs)} left` : `Closed for today (it shut at ${DW_DEADLINE_HOUR}:00). The orders are back tomorrow.`),
      ...earlier,
      ...DW_ORDERS.map(card),
      h("div", { class: "hc-foot" }, "Everybody in the hideout can hand in what they have on them, and both orders have to be filled before 21:00. When an order is filled it takes 20 minutes to ship. Then everybody collects their own share here: what the things they put in are worth, one and a half times what 6ixty pays (or bagmand, for the opium drugs). The orders start over every day."),
    ];
  }

  function membersPage(): HTMLElement[] {
    const d = getDef();
    const isOwner = owner();
    const members = Object.entries(d.hideout?.members ?? {});
    const taken = new Set([d.ownerUid ?? "", ...members.map(([u]) => u)]);
    const chip = (uid: string, key: "build" | "grow" | "stash", on: boolean, label: string, hint: string): HTMLElement =>
      h("button", { class: "hc-chip" + (on ? " on" : ""), disabled: busy, title: hint, onclick: () => void act(async () => { await hideoutMember(me, uid, { [key]: !on }); }) }, h("span", { class: "hc-chip-dot" }, on ? "✓" : ""), label);
    const fav = !!d.ownerUid && favs.has(d.ownerUid);
    const left = Math.max(0, DONATE_DAILY_MAX - donated);
    const giveBtn = (n: number): HTMLElement => h("button", { class: "btn small", disabled: busy || n > left || n > me.blood, onclick: () => void act(async () => { const r = await donateToHideout(me, roomId, n); playSfx("coins", 0.5); return `You gave ${n} blood to ${d.ownerName ?? "the owner"}. ${r.left} left to give today.`; }) }, h("img", { src: BLOOD_ICON, alt: "", style: { width: "12px", height: "12px", marginRight: "3px" } }), String(n));
    return [
      h("div", { class: "hc-hero" }, h("div", { class: "hc-h1" }, "Members"), h("div", { class: "hc-sub" }, `${members.length + 1} of ${HIDEOUT_MAX_MEMBERS + 1}`)),
      ...(!isOwner ? [h("div", { class: "hc-group" },
        h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, "Favourite this hideout"),
          h("button", { class: "btn small" + (fav ? " primary" : ""), disabled: busy, onclick: () => void act(async () => { await hideoutFavorite(me, d.ownerUid!); return fav ? "It is off your favourites." : "It is a favourite now."; }) }, fav ? "Favourite" : "Add")),
        h("div", { class: "hc-label" }, "Give blood to the owner"),
        h("div", { class: "hc-actions" }, giveBtn(10), giveBtn(50), giveBtn(100), giveBtn(500)),
        h("div", { class: "hc-sub" }, left > 0 ? `You can give ${left} more today (the most is ${DONATE_DAILY_MAX} a day, to all hideouts together).` : `You have given the most you can today (${DONATE_DAILY_MAX}).`))] : []),
      ...(isOwner ? [h("div", { class: "hc-group" }, h("div", { class: "hc-label" }, "Invite somebody"), ...searchUi("Search a player's name", () => taken, (r) => h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(async () => { const x = await hideoutInvite(me, { uid: r.uid }); results = results.filter((q) => q.uid !== r.uid); return `Invite sent to ${x.name}.`; }) }, "Invite")))] : []),
      h("div", { class: "hc-group" },
        h("div", { class: "hc-person" }, headBoxFor(d.ownerUid ?? ""), h("span", { class: "hc-pname" }, d.ownerName ?? "?"), h("span", { class: "hc-tag" }, "Owner")),
        ...members.map(([uid, m]) => h("div", { class: "hc-member" },
          h("div", { class: "hc-person" }, headBoxFor(uid), h("span", { class: "hc-pname" }, m.name),
            isOwner ? h("button", { class: "btn small danger", disabled: busy, onclick: () => { if (window.confirm(`Kick ${m.name}? Their furniture goes back to their own storage.`)) void act(async () => { await hideoutKick(me, uid); return `${m.name} is out.`; }); } }, "Kick") : ""),
          isOwner
            ? h("div", { class: "hc-perms" }, chip(uid, "build", m.build, "Build", "May place and move furniture"), chip(uid, "grow", m.grow, "Pots & mixers", "May use the growing kits, the mixers and the sink"), chip(uid, "stash", m.stash, "Stash", "May use the shared stash"))
            : h("div", { class: "hc-perms" }, ...[[m.build, "Build"], [m.grow, "Pots & mixers"], [m.stash, "Stash"]].map(([on, label]) => h("span", { class: "hc-tag" + (on ? "" : " off") }, `${on ? "✓" : "✗"} ${label}`)))))),
      ...(isOwner ? [h("div", { class: "hc-foot" }, "Switch things off for a member and they stay off for new members too, until you switch them on again.")] : [h("div", { class: "hc-foot" }, "Only the owner can invite, kick and change what members may do.")]),
    ];
  }

  function settingsPage(): HTMLElement[] {
    const d = getDef();
    const isOwner = owner();
    const placed = d.furni.filter((f) => !["toolbox", "computer", "sink", "boombox"].includes(f.id)).length;
    const name = h("input", { class: "hc-input", type: "text", maxlength: String(HIDEOUT_NAME_MAX), value: d.name }) as HTMLInputElement;
    const desc = h("input", { class: "hc-input", type: "text", maxlength: String(HIDEOUT_DESC_MAX), placeholder: "A line about your hideout", value: d.hideout?.desc ?? "" }) as HTMLInputElement;
    const ad = h("input", { class: "hc-input", type: "text", maxlength: String(HIDEOUT_AD_MAX), placeholder: "What the landlord shouts about it (optional)", value: d.hideout?.ad ?? "" }) as HTMLInputElement;
    const adPrice = (): number => HIDEOUT_BOOST_PRICE + (ad.value.trim() ? HIDEOUT_AD_PRICE : 0);
    const adBtn = h("button", { class: "btn small primary", disabled: busy || me.blood < HIDEOUT_BOOST_PRICE, onclick: () => void act(async () => { const r = await hideoutBoost(me, ad.value); return r.price > HIDEOUT_BOOST_PRICE ? "Advertised: it is shown first for an hour, and the landlord will shout your message." : "Advertised: it is shown first for an hour."; }) }, `🔥 Advertise 1 hour (${HIDEOUT_BOOST_PRICE} drops)`);
    ad.addEventListener("input", () => { adBtn.textContent = `🔥 Advertise 1 hour (${adPrice()} drops)`; });
    const boosted = (d.hideout?.boostUntil ?? 0) > Date.now();
    return [
      h("div", { class: "hc-hero" }, h("div", { class: "hc-h1" }, "Settings"), h("div", { class: "hc-sub" }, `${d.w} × ${d.h} · ${placed}/${d.hideout?.cap ?? "?"} pieces`)),
      ...(isOwner ? [
        h("div", { class: "hc-group" },
          h("div", { class: "hc-label" }, "Hideout name"), name,
          h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(async () => { await hideoutSettings(me, { name: name.value }); return "Renamed."; }) }, "Save name")),
        h("div", { class: "hc-group" },
          h("div", { class: "hc-label" }, "Description (on the list at the door)"), desc,
          h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(async () => { await hideoutSettings(me, { desc: desc.value }); return "Saved."; }) }, "Save description"),
          h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, "Show on the list for everybody"),
            h("button", { class: "btn small" + (d.hideout?.listed ? " primary" : ""), disabled: busy, onclick: () => void act(async () => { await hideoutSettings(me, { listed: !d.hideout?.listed }); return d.hideout?.listed ? "It is off the list. Only members can find it." : "It is on the list."; }) }, d.hideout?.listed ? "✅ Listed" : "🙈 Hidden")),
          h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, "Anyone can enter (no knocking)"),
            h("button", { class: "btn small" + (d.hideout?.open ? " primary" : ""), disabled: busy, onclick: () => void act(async () => { await hideoutSettings(me, { open: !d.hideout?.open }); return d.hideout?.open ? "Visitors have to knock now." : "Anyone can walk in now."; }) }, d.hideout?.open ? "🚪 Open to all" : "✊ Knock first")),
          ...(d.hideout?.listed ? [
            h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, boosted ? `Shown first for ${Math.max(1, Math.ceil(((d.hideout?.boostUntil ?? 0) - Date.now()) / 60000))} more min` : "Show it first on the list for an hour")),
            h("div", { class: "hc-label" }, `A message the landlord outside shouts every 2 to 5 minutes while it is advertised (+${HIDEOUT_AD_PRICE} drops)`), ad,
            adBtn,
          ] : [])),
        h("div", { class: "hc-group" },
          h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, "Lock building for everybody"),
            h("button", { class: "btn small" + (d.hideout?.lock ? " danger" : ""), disabled: busy, onclick: () => void act(async () => { await hideoutSettings(me, { lock: !d.hideout?.lock }); return d.hideout?.lock ? "Building is open again." : "Building is locked."; }) }, d.hideout?.lock ? "🔒 Locked" : "🔓 Open")),
          h("div", { class: "hc-sub" }, "While building is locked only you can place, move or take back furniture. Everybody can still use the pots, mixers, sink and the box."))
      ] : [
        h("div", { class: "hc-group" }, h("div", { class: "hc-sub" }, d.hideout?.lock ? "Building is locked by the owner." : "Furniture you put down is yours: when you leave, it goes back to your own storage."),
          h("button", { class: "btn danger", disabled: busy, onclick: () => { if (window.confirm("Leave this hideout? Your furniture goes back to your storage.")) void act(async () => { await hideoutLeave(me, d.ownerUid!); close(); ctx.navigate("room", { roomId: LOBBY_ID, from: roomId }); }); } }, "Leave hideout")),
      ]),
    ];
  }

  /** the Tables page: what the poker tables have earned for the owner (a fee on every buy-in and a cut of the pots), to collect */
  function tablesPage(): HTMLElement[] {
    const waiting = till.blood.toLocaleString("en-US"), earned = till.total.toLocaleString("en-US");
    return [
      h("div", { class: "hc-hero" }, h("div", { class: "hc-h1" }, "Table earnings"), h("div", { class: "hc-sub" }, "What your tables have paid you")),
      h("div", { class: "hc-group" },
        h("div", { class: "hc-person" }, h("img", { src: BLOOD_ICON, alt: "", style: { width: "20px", height: "20px" } }), h("span", { class: "hc-pname" }, "Waiting for you"), h("span", { class: "hc-tag" }, waiting)),
        h("button", { class: "btn primary", disabled: busy || till.blood <= 0, onclick: () => void act(async () => { const r = await hideoutTillCollect(me); playSfx("coins", 0.5); return `You collected ${r.got} blood.`; }) }, till.blood > 0 ? `Collect ${waiting}` : "Nothing to collect yet"),
        h("div", { class: "hc-sub" }, `Earned so far: ${earned}`)),
      h("div", { class: "hc-foot" }, "Your poker tables pay you a 1% fee on every buy-in (on top, so the players' stacks are not touched) and 1% of every pot that sees a flop. It all waits here until you collect it."),
      h("div", { class: "hc-foot" }, "A blackjack dealer keeps a 3% commission on wins in their own bank, and takes it when they stop dealing."),
    ];
  }

  function render(): void {
    if (closed) return;
    const isOwner = owner();
    if (page === "tables" && !isOwner) page = "shop";
    if (guestView() && page !== "sound" && page !== "members") page = "sound";
    body.classList.toggle("sound", page === "sound"); // (SoundCloud has its own bars and fills the whole page)
    if (page !== "sound" && sc) { sc.dispose(); sc = null; } // (leaving SoundCloud stops the music)
    const tabsFor = (): HTMLElement[] => PAGES.filter((p) => (guestView() ? p.id === "sound" || p.id === "members" : !p.owner || isOwner)).map((p) => h("button", { class: "hc-tab" + (page === p.id ? " on" : ""), onclick: () => go(p.id) }, h("span", { class: "hc-tab-ico" }, p.svg ? scIcon(p.svg) : p.icon), h("span", {}, p.label)));
    if (page === "sound") { // SoundCloud stays as it is (the player is in it): it is mounted once and the 1 second refresh leaves it alone
      url.textContent = "hideout.6ix/soundcloud";
      if (!sc) { body.replaceChildren(scHost); sc = mountSoundcloud(scHost, { me, speaker: { roomId, can: () => owner() || !!getDef().hideout?.members?.[me.uid], hasBox: () => getDef().furni.some((f) => isCdKind(f.kind)), isOwner: () => owner() || me.isAdmin } }); } else if (body.firstChild !== scHost) body.replaceChildren(scHost);
      tabs.replaceChildren(...tabsFor());
      return;
    }
    const scrolled = body.scrollTop;
    const focused = document.activeElement instanceof HTMLInputElement && body.contains(document.activeElement) ? document.activeElement : null;
    if (focused) return; // (don't rebuild the page while somebody is typing in it)
    url.textContent = `🔒 hideout.6ix/${page}`;
    body.replaceChildren(...(page === "shop" ? [...shopPage(), ...ordersPage()] : page === "members" ? [...membersPage(), ...(guestView() ? [] : settingsPage())] : page === "darkweb" ? darkwebPage() : tablesPage()));
    body.scrollTop = scrolled;
    tabs.replaceChildren(...tabsFor());
  }
  render();
  const off = onFurniIcon(() => { if (page === "shop") render(); });
  const tick = window.setInterval(() => render(), 1000);
  function close(): void {
    if (closed) return;
    closed = true;
    window.clearInterval(tick); window.clearTimeout(searchTimer); stops.forEach((f) => f());
    off(); sc?.dispose(); sc = null; el.remove(); onClose();
  }
  return { close, refresh: render };
}
