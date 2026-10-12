import { get, limitToLast, onValue, orderByChild, query, ref, Unsubscribe } from "firebase/database";
import { db } from "../firebase";
import { h, toast, trimCanvas } from "./dom";
import { renderAvatar } from "../avatarService";
import { allItemsBySlot, Item, SLOTS } from "../catalog";
import { changePassword } from "../auth";
import { BLOOD_ICON, ITEMS } from "../items";
import { EMOTES, emotePrice } from "../emotes";
import { LOG_TYPES, logAction } from "../logger";
import { clearShopEntry, itemEntry, musicEntry, saveShopEntry, shopConfig, ShopSection } from "../shopConfig";
import { social } from "../social";
import { buildItemIconPack, buildTemplatePack, figureWearing, listSets, SetInfo } from "../templateExport";
import { download } from "../zip";
import { todayStart } from "../db";
import type { Ctx } from "../main";

type Tab = "accounts" | "chat" | "private" | "actions" | "clothes" | "settings";
const TAB_LABELS: Array<[Tab, string]> = [
  ["accounts", "Accounts"], ["chat", "Chat"], ["private", "Private messages"], ["actions", "Actions"], ["clothes", "Clothes & Items"], ["settings", "Settings"],
];

const fmt = (ts: number) => new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtDate = (ts: number) => (ts ? new Date(ts).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "?");

interface UserRec {
  uid: string;
  name: string;
  figure: string;
  gender: string;
  blood: number;
  owned: Record<string, true>;
  inventory: Record<string, { item: string; qty: number; inPlayer?: boolean }>;
  wardrobe: Record<string, unknown>;
  stabs: Record<string, number>;
  syringeDay: number;
  createdAt: number;
}

async function loadUsers(): Promise<UserRec[]> {
  const snap = await get(ref(db, "users"));
  const raw = (snap.val() ?? {}) as Record<string, any>;
  return Object.entries(raw).map(([uid, v]) => ({
    uid, name: v.name ?? "?", figure: v.figure ?? "", gender: v.gender ?? "M", blood: v.blood ?? 0, owned: v.owned ?? {}, inventory: v.inventory ?? {},
    wardrobe: v.wardrobe ?? {}, stabs: v.stabs ?? {}, syringeDay: v.syringeDay ?? 0, createdAt: v.createdAt ?? 0,
  }));
}

function headThumb(figure: string): HTMLElement {
  const box = h("div", { class: "head" });
  if (figure) {
    renderAvatar({ figure, dir: 2, headDir: 2, headOnly: true }).then((c) => {
      if (!c || !box.isConnected) return;
      const t = trimCanvas(c);
      t.className = "head-canvas";
      box.replaceChildren(t);
    });
  }
  return box;
}

/** The admin app. Only the account with username "admin" gets here, and the database rules enforce it. */
export function mountAdmin(root: HTMLElement, ctx: Ctx): () => void {
  let tab: Tab = "accounts";
  let dispose: (() => void) | null = null;
  let users: UserRec[] = [];
  const names = () => new Map(users.map((u) => [u.uid, u.name]));

  const tabsEl = h("div", { class: "admin-tabs tabs" });
  const body = h("div", { class: "admin-body" });
  root.append(h("div", { class: "admin" },
    h("div", { class: "privnote" }, "Admin. Players are told on the sign-in screen that staff can see chat, private messages and activity. Treat what you see here as private."),
    tabsEl, body));

  function show(next: Tab): void {
    dispose?.();
    dispose = null;
    tab = next;
    body.replaceChildren();
    tabsEl.replaceChildren(...TAB_LABELS.map(([id, label]) => h("button", { class: "tab" + (id === tab ? " on" : ""), onclick: () => show(id) }, label)));
    const run = { accounts, chat, private: privateMessages, actions, clothes, settings }[tab];
    void Promise.resolve(run(body)).then((d) => { if (tab === next) dispose = d ?? null; else d?.(); });
  }

  // ---- accounts -------------------------------------------------------------------------
  async function accounts(el: HTMLElement): Promise<() => void> {
    el.append(h("div", { class: "loading", style: { color: "#555" } }, "Loading accounts…"));
    users = await loadUsers();
    let selected: string | null = null;
    let filter = "";
    const stats = h("div", { class: "adminstat" });
    const tableHost = h("div", { class: "scroll-box" });
    const detail = h("div", {});
    const search = h("input", { class: "mini-input", placeholder: "Search by username…", oninput: () => { filter = search.value.trim().toLowerCase(); draw(); } });
    const refresh = h("button", { class: "btn small", onclick: async () => { users = await loadUsers(); draw(); toast("Refreshed"); } }, "Refresh");

    function draw(): void {
      const shown = users.filter((u) => u.name.toLowerCase().includes(filter)).sort((a, b) => b.createdAt - a.createdAt);
      const online = users.filter((u) => social.isOnline(u.uid)).length;
      stats.replaceChildren(
        h("div", { class: "panel" }, h("b", {}, String(users.length)), "accounts"),
        h("div", { class: "panel" }, h("b", {}, String(online)), "online now"),
        h("div", { class: "panel" }, h("b", {}, String(users.reduce((n, u) => n + u.blood, 0))), "drops in circulation"));
      tableHost.replaceChildren(h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["", "Username", "Online", "Drops", "Items owned", "Stabs today", "Joined", "ID"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...shown.map((u) => h("tr", { style: { cursor: "pointer", background: u.uid === selected ? "#e4edfb" : "" }, onclick: () => { selected = u.uid; draw(); } },
          h("td", {}, headThumb(u.figure)),
          h("td", {}, h("b", {}, u.name)),
          h("td", {}, h("span", { class: "dot " + (social.isOnline(u.uid) ? "on" : "") })),
          h("td", { class: "num" }, String(u.blood)),
          h("td", { class: "num" }, String(Object.keys(u.owned).length)),
          h("td", { class: "num" }, String(Object.values(u.stabs).filter((d) => d >= todayStart()).length)),
          h("td", {}, fmtDate(u.createdAt)),
          h("td", { class: "hint" }, u.uid.slice(0, 8)))))));
      const u = users.find((x) => x.uid === selected);
      detail.replaceChildren(...(u ? [userDetail(u)] : []));
    }

    function userDetail(u: UserRec): HTMLElement {
      const nm = names();
      const inv = Object.entries(u.inventory).map(([slot, s]) => `${ITEMS[s.item]?.name ?? s.item}${s.inPlayer ? " (in the CD player)" : ""} (slot ${Number(slot) + 1})`);
      const stabbed = Object.entries(u.stabs).map(([uid, d]) => `${nm.get(uid) ?? uid.slice(0, 6)} (${fmtDate(d)})`);
      return h("div", { class: "panel", style: { marginTop: "10px" } },
        h("h2", {}, u.name),
        h("div", { class: "row" }, headThumb(u.figure), h("div", {},
          h("div", {}, `Gender ${u.gender} · joined ${fmtDate(u.createdAt)} · ${u.blood} drops`),
          h("div", { class: "hint" }, `uid ${u.uid}`))),
        h("p", {}, h("b", {}, "Inventory: "), inv.join(", ") || "empty"),
        h("p", {}, h("b", {}, "Owned: "), Object.keys(u.owned).join(", ") || "nothing bought yet"),
        h("p", {}, h("b", {}, "Wardrobe: "), `${Object.keys(u.wardrobe).length} saved outfits`),
        h("p", {}, h("b", {}, "Syringe: "), u.syringeDay >= todayStart() ? "used today" : "not used today"),
        h("p", {}, h("b", {}, "Has stabbed: "), stabbed.join(", ") || "nobody"));
    }

    el.replaceChildren(h("div", { class: "admin-bar" }, search, refresh), stats, tableHost, detail);
    draw();
    return social.subscribe(() => { if (tab === "accounts") draw(); });
  }

  // ---- public chat ----------------------------------------------------------------------
  async function chat(el: HTMLElement): Promise<() => void> {
    if (!users.length) users = await loadUsers();
    let filter = "";
    let rows: Array<{ ts: number; uid: string; name: string; text: string }> = [];
    const host = h("div", { class: "scroll-box" });
    const search = h("input", { class: "mini-input", placeholder: "Filter by name or text…", oninput: () => { filter = search.value.trim().toLowerCase(); draw(); } });
    function draw(): void {
      const shown = rows.filter((r) => !filter || r.name.toLowerCase().includes(filter) || r.text.toLowerCase().includes(filter));
      host.replaceChildren(h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["Time", "User", "Message"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...shown.map((r) => h("tr", {}, h("td", { class: "hint" }, fmt(r.ts)), h("td", {}, h("b", {}, r.name)), h("td", {}, r.text))))));
      host.scrollTop = host.scrollHeight;
    }
    el.append(h("div", { class: "admin-bar" }, search, h("span", { class: "hint" }, "Lobby chat, last 300 messages, live")), host);
    const off = onValue(query(ref(db, "rooms/lobby/chat"), orderByChild("ts"), limitToLast(300)), (snap) => {
      rows = [];
      snap.forEach((c) => { const v = c.val(); rows.push({ ts: v.ts ?? 0, uid: v.uid, name: v.name ?? "?", text: v.text ?? "" }); });
      draw();
    }, () => toast("Couldn't read the chat", "err"));
    return off;
  }

  // ---- private messages -------------------------------------------------------------------
  async function privateMessages(el: HTMLElement): Promise<() => void> {
    if (!users.length) users = await loadUsers();
    interface Msg { id: string; from: string; text: string; ts: number }
    interface Convo { key: string; a: string; b: string; msgs: Map<string, Msg> }
    let convos: Convo[] = [];
    let openKey: string | null = null;
    let filter = "";
    const listHost = h("div", { class: "scroll-box" });
    const thread = h("div", { class: "scroll-box", style: { padding: "10px", background: "#dbe2ef" } });
    const search = h("input", { class: "mini-input", placeholder: "Filter by name…", oninput: () => { filter = search.value.trim().toLowerCase(); draw(); } });
    const nm = () => names();

    function build(data: Record<string, Record<string, Record<string, any>>> | null): void {
      const map = new Map<string, Convo>();
      for (const [a, others] of Object.entries(data ?? {})) {
        for (const [b, msgs] of Object.entries(others ?? {})) {
          const key = [a, b].sort().join("|");
          const c = map.get(key) ?? { key, a: [a, b].sort()[0], b: [a, b].sort()[1], msgs: new Map() };
          for (const [id, m] of Object.entries(msgs ?? {})) c.msgs.set(id, { id, from: m.from, text: m.text, ts: typeof m.ts === "number" ? m.ts : 0 });
          map.set(key, c);
        }
      }
      convos = [...map.values()].sort((x, y) => last(y) - last(x));
    }
    const last = (c: Convo) => Math.max(0, ...[...c.msgs.values()].map((m) => m.ts));

    function draw(): void {
      const n = nm();
      const label = (c: Convo) => `${n.get(c.a) ?? c.a.slice(0, 6)} ↔ ${n.get(c.b) ?? c.b.slice(0, 6)}`;
      const shown = convos.filter((c) => !filter || label(c).toLowerCase().includes(filter));
      listHost.replaceChildren(...(shown.length ? shown.map((c) => {
        const lastMsg = [...c.msgs.values()].sort((x, y) => y.ts - x.ts)[0];
        return h("div", { class: "convo-item" + (c.key === openKey ? " on" : ""), onclick: () => { openKey = c.key; draw(); } },
          h("div", { class: "who" }, label(c)),
          h("div", { class: "hint" }, `${c.msgs.size} message${c.msgs.size === 1 ? "" : "s"} · last ${lastMsg ? fmt(lastMsg.ts) : "?"}`));
      }) : [h("div", { class: "hint pad" }, "No private messages yet.")]));
      const c = convos.find((x) => x.key === openKey);
      if (!c) { thread.replaceChildren(h("div", { class: "hint pad" }, "Pick a conversation.")); return; }
      thread.replaceChildren(...[...c.msgs.values()].sort((x, y) => x.ts - y.ts).map((m) =>
        h("div", { class: "cw-msg" + (m.from === c.b ? " mine" : "") },
          h("div", { class: "hint" }, `${n.get(m.from) ?? m.from.slice(0, 6)}`),
          h("div", { class: "cw-bubble" }, m.text),
          h("div", { class: "cw-time" }, fmt(m.ts)))));
      thread.style.display = "flex";
      thread.style.flexDirection = "column";
      thread.style.gap = "6px";
      thread.scrollTop = thread.scrollHeight;
    }

    el.append(h("div", { class: "admin-bar" }, search, h("span", { class: "hint" }, "Every private conversation between players, live")), h("div", { class: "convo-list" }, listHost, thread));
    const off = onValue(ref(db, "dms"), (snap) => { build(snap.val()); draw(); }, () => toast("Couldn't read private messages", "err"));
    return off;
  }

  // ---- actions log ------------------------------------------------------------------------
  async function actions(el: HTMLElement): Promise<() => void> {
    let rows: Array<{ ts: number; name: string; type: string; detail: string }> = [];
    let type = "";
    let filter = "";
    const host = h("div", { class: "scroll-box" });
    const typeSel = h("select", { onchange: () => { type = typeSel.value; draw(); } },
      h("option", { value: "" }, "All actions"), ...LOG_TYPES.map((t) => h("option", { value: t }, t)));
    const search = h("input", { class: "mini-input", placeholder: "Filter by name or detail…", oninput: () => { filter = search.value.trim().toLowerCase(); draw(); } });
    function draw(): void {
      const shown = rows.filter((r) => (!type || r.type === type) && (!filter || r.name.toLowerCase().includes(filter) || r.detail.toLowerCase().includes(filter))).reverse();
      host.replaceChildren(h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["Time", "User", "Action", "Detail"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...shown.map((r) => h("tr", {}, h("td", { class: "hint" }, fmt(r.ts)), h("td", {}, h("b", {}, r.name)), h("td", {}, h("span", { class: "pill " + r.type }, r.type)), h("td", {}, r.detail))))));
    }
    el.append(h("div", { class: "admin-bar" }, typeSel, search, h("span", { class: "hint" }, "Last 500 actions, newest first, live")), host);
    const off = onValue(query(ref(db, "logs"), orderByChild("ts"), limitToLast(500)), (snap) => {
      rows = [];
      snap.forEach((c) => { const v = c.val(); rows.push({ ts: v.ts ?? 0, name: v.name ?? "?", type: v.type ?? "?", detail: v.detail ?? "" }); });
      draw();
    }, () => toast("Couldn't read the action log", "err"));
    return off;
  }

  // ---- clothes & items -----------------------------------------------------------------------
  function clothes(el: HTMLElement): () => void {
    let sub: "clothing" | "emotes" | "items" = "clothing";
    let off: (() => void) | null = null;
    const subTabs = h("div", { class: "tabs" });
    const host = h("div", {});
    el.append(subTabs, host);
    const open = (s: typeof sub) => {
      off?.();
      sub = s;
      subTabs.replaceChildren(...([["clothing", "Clothing"], ["emotes", "Emotes"], ["items", "Items & music"]] as Array<[typeof sub, string]>).map(([id, label]) =>
        h("button", { class: "tab" + (id === sub ? " on" : ""), onclick: () => open(id) }, label)));
      host.replaceChildren();
      off = (sub === "clothing" ? clothingTab : sub === "emotes" ? emotesTab : itemsTab)(host);
    };
    open("clothing");
    return () => off?.();
  }

  const priceBox = (value: number, onChange: (n: number) => void, disabled = false) => {
    const input = h("input", { type: "number", min: 0, max: 999, value: String(value), disabled, onchange: () => onChange(Math.max(0, Math.min(999, Number(input.value) || 0))) });
    return input;
  };
  const saved = (what: string) => logAction(ctx.profile, "admin", what);
  const failed = () => toast("Couldn't save (are you still signed in as admin?)", "err");

  function clothingTab(el: HTMLElement): () => void {
    let slot = "hr";
    let gender = "";
    let status = "";
    let search = "";
    let page = 0;
    const PAGE = 24;
    const selected = new Set<string>(); // "type:id"
    let frames = false;

    const catalogItem = (type: string, id: string): Item | undefined => allItemsBySlot()[type]?.find((i) => i.id === id);
    const slotSel = h("select", { onchange: () => { slot = slotSel.value; page = 0; draw(); } }, ...SLOTS.map((s) => h("option", { value: s.id }, `${s.label} (${s.id})`)));
    const genderSel = h("select", { onchange: () => { gender = genderSel.value; page = 0; draw(); } },
      h("option", { value: "" }, "Any gender"), h("option", { value: "M" }, "Boys"), h("option", { value: "F" }, "Girls"), h("option", { value: "U" }, "Unisex"));
    const statusSel = h("select", { onchange: () => { status = statusSel.value; page = 0; draw(); } },
      ...[["", "All items"], ["shop", "In the shop"], ["noshop", "Not in the shop"], ["free", "Free (everyone owns)"], ["club", "Club only"]].map(([v, l]) => h("option", { value: v }, l)));
    const searchBox = h("input", { class: "mini-input", placeholder: "Find by id…", oninput: () => { search = searchBox.value.trim(); page = 0; draw(); } });
    const bar = h("div", { class: "admin-bar" });
    const grid = h("div", { class: "apanel-grid" });
    const pager = h("div", { class: "row center", style: { margin: "10px 0" } });
    const progress = h("div", { class: "hint" });

    function statusOf(info: SetInfo): "club" | "free" | "shop" | "noshop" {
      if (info.club > 0 || !info.selectable) return "club";
      const it = catalogItem(info.type, info.id);
      if (!it) return "club";
      if (it.starter || it.price === 0) return "free";
      return it.shopOn ? "shop" : "noshop";
    }

    function filtered(): SetInfo[] {
      return listSets(slot).filter((s) =>
        (!gender || s.gender === gender) && (!status || statusOf(s) === status) && (!search || s.id.includes(search)));
    }

    async function exportSelected(): Promise<void> {
      if (!selected.size) return toast("Tick some items first.", "err");
      if (selected.size > 40) return toast("Pick 40 items or fewer per pack.", "err");
      const refs = [...selected].map((k) => ({ type: k.split(":")[0], id: k.split(":")[1] }));
      try {
        const blob = await buildTemplatePack(refs, { frames }, (done, total, label) => { progress.textContent = `Packing ${done}/${total}: ${label}`; });
        download(blob, "6ixplanet-clothing-templates.zip");
        progress.textContent = `Done. ${refs.length} item${refs.length === 1 ? "" : "s"} exported.`;
        saved(`exported ${refs.length} clothing templates`);
      } catch (err) {
        progress.textContent = "";
        toast(`Export failed: ${(err as Error).message}`, "err");
      }
    }

    async function bulk(action: "on" | "off" | "reset", price: number): Promise<void> {
      const targets = [...selected].map((k) => ({ type: k.split(":")[0], id: k.split(":")[1] })).filter((r) => {
        const it = catalogItem(r.type, r.id);
        return it && !it.starter;
      });
      if (!targets.length) return toast("None of the ticked items can be sold (club or starter items can't).", "err");
      try {
        await Promise.all(targets.map((r) => {
          const key = `${r.type}_${r.id}`;
          return action === "reset" ? clearShopEntry("clothing", key) : saveShopEntry("clothing", key, { on: action === "on", price });
        }));
        saved(`${action === "reset" ? "reset" : action === "on" ? `put in the shop at ${price}` : "removed from the shop"}: ${targets.length} clothing items`);
        toast(`Updated ${targets.length} item${targets.length === 1 ? "" : "s"}`);
        draw();
      } catch { failed(); }
    }

    const bulkPrice = h("input", { type: "number", min: 0, max: 999, value: "2", style: { width: "56px", padding: "4px", borderRadius: "5px", border: "1px solid #9ea5b0", textAlign: "center" } });

    function card(info: SetInfo): HTMLElement {
      const key = `${info.type}:${info.id}`;
      const it = catalogItem(info.type, info.id);
      const st = statusOf(info);
      const slotMeta = SLOTS.find((s) => s.id === info.type)!;
      const thumb = h("div", { class: "thumb" });
      renderAvatar({ figure: figureWearing(info), dir: 2, headDir: 2, headOnly: slotMeta.headOnly }).then((c) => {
        if (!c || !thumb.isConnected) return;
        const t = trimCanvas(c);
        t.className = "thumb-canvas";
        thumb.replaceChildren(t);
      });
      const sellable = !!it && !it.starter && st !== "club";
      const hasEntry = !!shopConfig.clothing[`${info.type}_${info.id}`];
      return h("div", { class: "acard" + (selected.has(key) ? " sel" : "") },
        h("span", { class: "tag " + (st === "free" ? "free" : st === "club" ? "club" : st === "noshop" ? "off" : "") }, st === "free" ? (it?.starter ? "starter" : "free") : st === "club" ? "club" : st === "shop" ? "in shop" : "not sold"),
        thumb,
        h("div", {}, h("b", {}, `${info.type}-${info.id}`)),
        h("div", { class: "nm" }, `${info.gender === "U" ? "unisex" : info.gender === "F" ? "girls" : "boys"}${info.colors ? ` · ${info.colors} colour${info.colors > 1 ? "s" : ""}` : ""}`),
        h("label", {}, h("input", { type: "checkbox", checked: selected.has(key), onchange: (e: Event) => { (e.target as HTMLInputElement).checked ? selected.add(key) : selected.delete(key); draw(); } }), "select"),
        sellable
          ? h("div", { class: "row center", style: { gap: "4px" } },
              h("label", {}, h("input", {
                type: "checkbox", checked: it!.shopOn,
                onchange: async (e: Event) => {
                  try { await saveShopEntry("clothing", `${info.type}_${info.id}`, { on: (e.target as HTMLInputElement).checked, price: it!.price }); saved(`${(e.target as HTMLInputElement).checked ? "put" : "removed"} ${info.type}-${info.id} ${(e.target as HTMLInputElement).checked ? "in" : "from"} the shop`); draw(); } catch { failed(); }
                },
              }), "shop"),
              priceBox(it!.price, async (n) => {
                try { await saveShopEntry("clothing", `${info.type}_${info.id}`, { on: it!.shopOn, price: n }); saved(`set ${info.type}-${info.id} to ${n} drops`); draw(); } catch { failed(); }
              }),
              h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "drops" }))
          : h("div", { class: "hint" }, st === "club" ? "club item: can't be sold" : "starter: free for all"),
        sellable && hasEntry ? h("button", { class: "btn small", onclick: async () => { try { await clearShopEntry("clothing", `${info.type}_${info.id}`); draw(); } catch { failed(); } } }, "Reset") : null);
    }

    function draw(): void {
      const all = filtered();
      const pages = Math.max(1, Math.ceil(all.length / PAGE));
      if (page >= pages) page = pages - 1;
      const shown = all.slice(page * PAGE, (page + 1) * PAGE);
      bar.replaceChildren(slotSel, genderSel, statusSel, searchBox,
        h("span", { class: "hint" }, `${all.length} items · ${selected.size} selected`));
      grid.replaceChildren(...shown.map(card));
      pager.replaceChildren(
        h("button", { class: "btn small", disabled: page === 0, onclick: () => { page--; draw(); } }, "‹"),
        h("span", { class: "hint" }, `${page + 1} / ${pages}`),
        h("button", { class: "btn small", disabled: page >= pages - 1, onclick: () => { page++; draw(); } }, "›"));
    }

    const actionsBar = h("div", { class: "panel", style: { marginBottom: "10px", display: "grid", gap: "8px" } },
      h("div", { class: "row" },
        h("b", {}, "Selected items:"),
        h("button", { class: "btn small", onclick: () => { filtered().slice(page * PAGE, (page + 1) * PAGE).forEach((s) => selected.add(`${s.type}:${s.id}`)); draw(); } }, "Select this page"),
        h("button", { class: "btn small", onclick: () => { selected.clear(); draw(); } }, "Clear"),
        h("span", { class: "hint" }, "Shop:"),
        h("button", { class: "btn small primary", onclick: () => void bulk("on", Math.max(0, Math.min(999, Number(bulkPrice.value) || 0))) }, "Put in shop at"), bulkPrice,
        h("button", { class: "btn small", onclick: () => void bulk("off", 0) }, "Remove from shop"),
        h("button", { class: "btn small", onclick: () => void bulk("reset", 0) }, "Reset to default")),
      h("div", { class: "row" },
        h("b", {}, "Templates:"),
        h("label", { class: "hint" }, h("input", { type: "checkbox", onchange: (e: Event) => { frames = (e.target as HTMLInputElement).checked; } }), " include every frame as its own PNG (much bigger)"),
        h("button", { class: "btn small primary", onclick: () => void exportSelected() }, "Export selected as template pack (.zip)"),
        h("button", { class: "btn small", onclick: () => { const fd = JSON.stringify(listSets(slot).map(({ parts, ...s }) => ({ ...s, parts })), null, 2); download(new Blob([fd], { type: "application/json" }), `clothing-${slot}.json`); } }, "Download this slot's data (.json)")),
      progress);
    el.append(actionsBar, bar, grid, pager);
    draw();
    return social.subscribe(() => undefined); // nothing live here; the returned function just satisfies the tab contract
  }

  function emotesTab(el: HTMLElement): () => void {
    const rows = EMOTES.map((e) => {
      const free = e.price === 0;
      const entry = shopConfig.emotes[e.id];
      const on = entry ? entry.on : true;
      const price = emotePrice(e);
      return h("tr", {},
        h("td", { style: { fontSize: "22px" } }, e.icon), h("td", {}, h("b", {}, e.name)), h("td", { class: "hint" }, e.desc),
        ...(free ? [h("td", { colspan: "3", class: "hint" }, "Always free for everyone")]
          : [
            h("td", { class: "num" }, String(e.price)),
            h("td", {}, h("label", {}, h("input", {
              type: "checkbox", checked: on,
              onchange: async (ev: Event) => { try { await saveShopEntry("emotes", e.id, { on: (ev.target as HTMLInputElement).checked, price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the ${e.name} emote ${(ev.target as HTMLInputElement).checked ? "in" : "from"} the shop`); } catch { failed(); } },
            }), " on sale")),
            h("td", {}, priceBox(price, async (n) => { try { await saveShopEntry("emotes", e.id, { on, price: n }); saved(`set the ${e.name} emote to ${n} drops${n === 0 ? " (free for everyone)" : ""}`); } catch { failed(); } }),
              entry ? h("button", { class: "btn small", style: { marginLeft: "6px" }, onclick: async () => { try { await clearShopEntry("emotes", e.id); open(); } catch { failed(); } } }, "Reset") : null),
          ]));
    });
    const open = () => { el.replaceChildren(); emotesTab(el); };
    el.append(
      h("p", { class: "hint" }, "A price of 0 makes an emote free for everyone. Changes apply to players straight away."),
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["", "Emote", "What it does", "Default", "Shop", "Price (drops)"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...rows))));
    return () => undefined;
  }

  function itemsTab(el: HTMLElement): () => void {
    const itemRows = Object.values(ITEMS).map((it) => {
      const e = itemEntry(it.id);
      return h("tr", {},
        h("td", {}, h("img", { src: it.icon, alt: "", style: { width: "32px", height: "32px", imageRendering: "pixelated" } })),
        h("td", {}, h("b", {}, it.name)), h("td", { class: "hint" }, it.examine),
        h("td", {}, h("label", {}, h("input", {
          type: "checkbox", checked: e.on,
          onchange: async (ev: Event) => { try { await saveShopEntry("items", it.id, { on: (ev.target as HTMLInputElement).checked, price: e.price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the ${it.name} ${(ev.target as HTMLInputElement).checked ? "in" : "from"} the shop`); } catch { failed(); } },
        }), " sold in shop")),
        h("td", {}, priceBox(e.price, async (n) => { try { await saveShopEntry("items", it.id, { on: e.on, price: n }); saved(`set the ${it.name} to ${n} drops`); } catch { failed(); } })));
    });
    const m = musicEntry();
    const musicRow = h("tr", {},
      h("td", { style: { fontSize: "22px" } }, "♪"), h("td", {}, h("b", {}, "Jukebox pass")), h("td", { class: "hint" }, "Unlocks the Music tab in the lobby"),
      h("td", {}, h("label", {}, h("input", {
        type: "checkbox", checked: m.on,
        onchange: async (ev: Event) => { try { await saveShopEntry("music", "pass", { on: (ev.target as HTMLInputElement).checked, price: m.price }); saved(`${(ev.target as HTMLInputElement).checked ? "put" : "removed"} the jukebox pass ${(ev.target as HTMLInputElement).checked ? "in" : "from"} the shop`); } catch { failed(); } },
      }), " sold in shop")),
      h("td", {}, priceBox(m.price, async (n) => { try { await saveShopEntry("music", "pass", { on: m.on, price: n }); saved(`set the jukebox pass to ${n} drops`); } catch { failed(); } })));
    el.append(
      h("p", { class: "hint" }, "Everyone starts with a knife, a CD and a syringe. Turn an item on to sell extra copies; it goes into the buyer's inventory."),
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["", "Item", "What it does", "Shop", "Price (drops)"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...itemRows, musicRow))),
      h("div", { class: "row", style: { marginTop: "10px" } },
        h("button", { class: "btn small primary", onclick: async () => {
          try {
            const blob = await buildItemIconPack([...Object.values(ITEMS).map((i) => ({ name: i.id, url: i.icon })), { name: "blood", url: BLOOD_ICON }]);
            download(blob, "6ixplanet-item-icons.zip");
            saved("exported the item icons");
          } catch (err) { toast(`Export failed: ${(err as Error).message}`, "err"); }
        } }, "Export item icons as templates (.zip)")));
    return () => undefined;
  }

  // ---- settings ------------------------------------------------------------------------------
  function settings(el: HTMLElement): () => void {
    const cur = h("input", { type: "password", placeholder: "current password", autocomplete: "current-password" });
    const next = h("input", { type: "password", placeholder: "new password (6+ characters)", autocomplete: "new-password" });
    const again = h("input", { type: "password", placeholder: "new password again", autocomplete: "new-password" });
    const msg = h("div", { class: "form-error" });
    el.append(
      h("div", { class: "panel", style: { maxWidth: "480px" } },
        h("h2", {}, "Admin password"),
        h("p", { class: "muted" }, "Anyone who knows this password can read every private message. If it's still the one you started with, change it before inviting people."),
        h("div", { class: "group" },
          h("label", { class: "cellrow" }, cur), h("label", { class: "cellrow" }, next), h("label", { class: "cellrow" }, again)),
        msg,
        h("button", { class: "btn primary", onclick: async () => {
          msg.textContent = "";
          if (next.value !== again.value) { msg.textContent = "The new passwords don't match."; return; }
          try {
            await changePassword(cur.value, next.value);
            cur.value = next.value = again.value = "";
            saved("changed the admin password");
            toast("Password changed.");
          } catch (err) { msg.textContent = (err as { code?: string }).code === "auth/invalid-credential" ? "Current password is wrong." : (err as Error).message; }
        } }, "Change password")));
    return () => undefined;
  }

  show("accounts");
  return () => dispose?.();
}
