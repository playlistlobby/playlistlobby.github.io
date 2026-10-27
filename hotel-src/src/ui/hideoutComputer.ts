import { h, toast } from "./dom";
import { hideoutBoost, hideoutCollect, hideoutInvite, hideoutKick, hideoutLeave, hideoutMember, hideoutOrder, hideoutSearch, hideoutSettings } from "../hideout";
import { hideoutLandlordPanel } from "./hideoutLandlord";
import type { HideoutLandlordPanel } from "./hideoutLandlord";
import { BLOOD_ICON, furniIcon, itemDef, onFurniIcon } from "../items";
import { FURNI_KINDS, LOBBY_ID } from "../rooms";
import type { RoomDef } from "../rooms";
import { hitPlace, watchHitCool, watchHits } from "../hits";
import { HIT_HIDEOUT_COOLDOWN_MS, HIT_MAX, HIT_MIN } from "../shared/hits";
import type { Hit } from "../shared/hits";
import { hideoutPriceOf, HIDEOUT_BOOST_PRICE, HIDEOUT_DESC_MAX, HIDEOUT_MAX_MEMBERS, HIDEOUT_ORDER_MS, HIDEOUT_SHOP, HIDEOUT_NAME_MAX } from "../shared/hideout";
import { countdownText } from "../shared/raffle";
import { serverNow } from "../db";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

export interface ComputerApi { close(): void; refresh(): void }

type Page = "shop" | "orders" | "members" | "hits" | "settings" | "landlord";
const PAGES: Array<{ id: Page; icon: string; label: string; owner?: boolean }> = [
  { id: "shop", icon: "🛒", label: "Shop" },
  { id: "orders", icon: "📦", label: "Orders" },
  { id: "members", icon: "👥", label: "Members" },
  { id: "hits", icon: "💀", label: "Hitman" },
  { id: "settings", icon: "⚙️", label: "Settings" },
  { id: "landlord", icon: "🏠", label: "Landlord", owner: true },
];

/**
 * The hideout's computer: a website (iOS 6 look) for the gang. Order hideout furniture (it arrives in an hour), see your orders, manage the members
 * (invite by name, set who may build, kick), the settings (name, lock building, leave) and the landlord's menu (size, colours: the owner only).
 */
export function openHideoutComputer(host: HTMLElement, ctx: Ctx, roomId: string, getDef: () => RoomDef, onChange: () => void, onClose: () => void): ComputerApi {
  const me = ctx.profile;
  let closed = false;
  let page: Page = "shop";
  let landlord: HideoutLandlordPanel | null = null;
  let results: Array<{ uid: string; name: string }> = [];
  let searchTimer = 0;
  let searchQ = "";
  let busy = false;
  let hitTarget: { uid: string; name: string } | null = null;
  let hitAmount = 500;
  let hitCool = 0;
  let openHits: Hit[] = [];
  const stops = [watchHitCool(roomId.slice(2), (at) => { hitCool = at; }), watchHits((l) => { openHits = l; })];
  const owner = (): boolean => getDef().ownerUid === me.uid;

  const url = h("div", { class: "hc-url" });
  const body = h("div", { class: "hc-body" });
  const tabs = h("div", { class: "hc-tabs" });
  const card = h("div", { class: "hc-card", role: "dialog", "aria-label": "Computer" },
    h("div", { class: "hc-nav" }, h("div", { class: "hc-title" }, "hideout.6ix"), h("button", { class: "hc-done", onclick: () => close() }, "Done")),
    url, body, tabs);
  const el = h("div", { class: "hc-overlay", onclick: (e: Event) => { if (e.target === el) close(); } }, card);
  host.append(el);

  const go = (p: Page): void => { (document.activeElement as HTMLElement | null)?.blur(); if (page === "landlord" && p !== "landlord") { landlord?.dispose(); landlord = null; } page = p; render(); };
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
  function hitsPage(): HTMLElement[] {
    const left = hitCool + HIT_HIDEOUT_COOLDOWN_MS - serverNow();
    const waiting = left > 0;
    const input = h("input", { class: "hc-input", type: "search", placeholder: "Search a player's name", value: searchQ, autocomplete: "off", autocapitalize: "none" }) as HTMLInputElement;
    input.addEventListener("input", () => {
      searchQ = input.value;
      window.clearTimeout(searchTimer);
      if (searchQ.trim().length < 2) { results = []; paintResults(); return; }
      searchTimer = window.setTimeout(() => { void hideoutSearch(me, searchQ).then((r) => { results = r.players; paintResults(); }, () => undefined); }, 300);
    });
    const resultsBox = h("div", { class: "hc-results" });
    const paintResults = (): void => {
      resultsBox.replaceChildren(...results.filter((r) => r.uid !== me.uid).map((r) => h("div", { class: "hc-person" },
        h("span", { class: "hc-pname" }, r.name),
        h("button", { class: "btn small primary", onclick: () => { hitTarget = r; results = []; searchQ = ""; render(); } }, "Pick"))));
    };
    paintResults();
    const slider = h("input", { type: "range", class: "hc-slider", min: String(HIT_MIN), max: String(HIT_MAX), step: "50", value: String(hitAmount) }) as HTMLInputElement;
    const big = h("div", { class: "ht-amt" }, h("img", { src: BLOOD_ICON, alt: "" }), hitAmount.toLocaleString("en-US"));
    slider.addEventListener("input", () => { hitAmount = Number(slider.value); big.replaceChildren(h("img", { src: BLOOD_ICON, alt: "" }), hitAmount.toLocaleString("en-US")); });
    const mins = Math.ceil(left / 60000);
    const cant = !hitTarget || busy || waiting || me.blood < hitAmount;
    const form = h("div", { class: "ht-form" },
      waiting ? h("div", { class: "ht-warn" }, `Your hideout has put a hit out already. The next one can go out in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}.`) : "",
      hitTarget ? h("div", { class: "ht-target" }, h("span", {}, "The target"), h("strong", {}, hitTarget.name), h("button", { class: "btn small", onclick: () => { hitTarget = null; render(); } }, "Change")) : h("div", { class: "hc-group" }, input, resultsBox),
      h("div", { class: "ht-bounty" }, h("span", {}, `The bounty (${HIT_MIN} to ${HIT_MAX})`), big, slider),
      h("button", { class: "ht-go", disabled: cant, onclick: () => void act(async () => { const t = hitTarget!; await hitPlace(me, roomId, t.uid, hitAmount); hitTarget = null; return `The hit on ${t.name} is out: ${hitAmount} blood.`; }) },
        hitTarget ? `Put out a hit on ${hitTarget.name}` : "Pick somebody first"),
      h("div", { class: "hc-foot" }, `The blood leaves your pocket now and sits on their head until somebody collects it. A hideout puts out one hit every 3 hours, and nobody gets more than 3 a day. Anybody with a gun (bagmand sells one a visit) can collect it.`));
    const per = new Map<string, { name: string; amount: number }>();
    for (const x of openHits) { const c = per.get(x.target); if (!c || x.amount > c.amount) per.set(x.target, { name: x.targetName, amount: x.amount }); }
    return [
      h("div", { class: "hc-hero ht-hero" }, h("div", { class: "hc-h1" }, "THE HITMAN"), h("div", { class: "hc-sub" }, "Put blood on a head. Somebody will come for it.")),
      form,
      h("div", { class: "ht-open" }, h("div", { class: "ht-open-t" }, `Open hits (${openHits.length})`),
        ...(openHits.length ? openHits.map((x) => h("div", { class: "ht-row" }, h("span", { class: "ht-n" }, x.targetName), h("span", { class: "ht-by" }, x.hideoutName), h("span", { class: "ht-a" }, h("img", { src: BLOOD_ICON, alt: "" }), x.amount.toLocaleString("en-US")))) : [h("div", { class: "hc-empty" }, "Nobody has a price on their head right now.")])),
    ];
  }

  function membersPage(): HTMLElement[] {
    const d = getDef();
    const isOwner = owner();
    const members = Object.entries(d.hideout?.members ?? {});
    const input = h("input", { class: "hc-input", type: "search", placeholder: "Search a player's name to invite", value: searchQ, autocomplete: "off", autocapitalize: "none" }) as HTMLInputElement;
    input.addEventListener("input", () => {
      searchQ = input.value;
      window.clearTimeout(searchTimer);
      if (searchQ.trim().length < 2) { results = []; paintResults(); return; }
      searchTimer = window.setTimeout(() => { void hideoutSearch(me, searchQ).then((r) => { results = r.players; paintResults(); }, () => undefined); }, 300);
    });
    const resultsBox = h("div", { class: "hc-results" });
    const paintResults = (): void => {
      const taken = new Set([d.ownerUid, ...members.map(([u]) => u)]);
      resultsBox.replaceChildren(...results.filter((r) => !taken.has(r.uid)).map((r) => h("div", { class: "hc-person" },
        h("span", { class: "hc-pname" }, r.name),
        h("button", { class: "btn small primary", disabled: busy, onclick: () => void act(async () => { const x = await hideoutInvite(me, { uid: r.uid }); results = results.filter((q) => q.uid !== r.uid); return `Invite sent to ${x.name}.`; }) }, "Invite"))));
    };
    paintResults();
    return [
      h("div", { class: "hc-hero" }, h("div", { class: "hc-h1" }, "Members"), h("div", { class: "hc-sub" }, `${members.length + 1} of ${HIDEOUT_MAX_MEMBERS + 1}`)),
      ...(isOwner ? [h("div", { class: "hc-group" }, input, resultsBox)] : []),
      h("div", { class: "hc-group" },
        h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, d.ownerName ?? "?"), h("span", { class: "hc-tag" }, "Owner")),
        ...members.map(([uid, m]) => h("div", { class: "hc-person" },
          h("span", { class: "hc-pname" }, m.name),
          isOwner
            ? h("span", { class: "hc-actions" },
              h("button", { class: "btn small" + (m.build ? " primary" : ""), disabled: busy, title: "May this member place and move furniture?", onclick: () => void act(async () => { await hideoutMember(me, uid, !m.build); }) }, m.build ? "🔨 Builds" : "🚫 No building"),
              h("button", { class: "btn small danger", disabled: busy, onclick: () => { if (window.confirm(`Kick ${m.name}? Their furniture goes back to their own storage.`)) void act(async () => { await hideoutKick(me, uid); return `${m.name} is out.`; }); } }, "Kick"))
            : h("span", { class: "hc-tag" }, m.build ? "Builds" : "No building")))),
      ...(isOwner ? [] : [h("div", { class: "hc-foot" }, "Only the owner can invite and kick.")]),
    ];
  }

  function settingsPage(): HTMLElement[] {
    const d = getDef();
    const isOwner = owner();
    const placed = d.furni.filter((f) => !["toolbox", "computer", "sink", "boombox"].includes(f.id)).length;
    const name = h("input", { class: "hc-input", type: "text", maxlength: String(HIDEOUT_NAME_MAX), value: d.name }) as HTMLInputElement;
    const desc = h("input", { class: "hc-input", type: "text", maxlength: String(HIDEOUT_DESC_MAX), placeholder: "A line about your hideout", value: d.hideout?.desc ?? "" }) as HTMLInputElement;
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
            h("div", { class: "hc-person" }, h("span", { class: "hc-pname" }, boosted ? `Shown first for ${Math.max(1, Math.ceil(((d.hideout?.boostUntil ?? 0) - Date.now()) / 60000))} more min` : "Show it first on the list for an hour"),
              h("button", { class: "btn small primary", disabled: busy || me.blood < HIDEOUT_BOOST_PRICE, onclick: () => void act(async () => { await hideoutBoost(me); return "Boosted: it is shown first for a while."; }) }, `🔥 Boost (${HIDEOUT_BOOST_PRICE} drops)`)),
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

  function landlordPage(): HTMLElement[] {
    if (!landlord) landlord = hideoutLandlordPanel(ctx, onChange);
    return [landlord.el];
  }

  function render(): void {
    if (closed) return;
    const isOwner = owner();
    if (page === "landlord" && !isOwner) page = "shop";
    const scrolled = body.scrollTop;
    const focused = document.activeElement instanceof HTMLInputElement && body.contains(document.activeElement) ? document.activeElement : null;
    if (focused) return; // (don't rebuild the page while somebody is typing in it)
    url.textContent = `🔒 hideout.6ix/${page}`;
    body.replaceChildren(...(page === "shop" ? shopPage() : page === "orders" ? ordersPage() : page === "members" ? membersPage() : page === "hits" ? hitsPage() : page === "settings" ? settingsPage() : landlordPage()));
    body.scrollTop = scrolled;
    tabs.replaceChildren(...PAGES.filter((p) => !p.owner || isOwner).map((p) => h("button", { class: "hc-tab" + (page === p.id ? " on" : ""), onclick: () => go(p.id) }, h("span", { class: "hc-tab-ico" }, p.icon), h("span", {}, p.label))));
  }
  render();
  const off = onFurniIcon(() => { if (page === "shop" || page === "orders") render(); });
  const tick = window.setInterval(() => { if (page !== "landlord") render(); }, 1000);
  function close(): void {
    if (closed) return;
    closed = true;
    window.clearInterval(tick); window.clearTimeout(searchTimer); stops.forEach((f) => f());
    off(); landlord?.dispose(); el.remove(); onClose();
  }
  return { close, refresh: render };
}
