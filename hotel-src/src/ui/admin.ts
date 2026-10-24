import { get, limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { headBox } from "./head";
import { changePassword } from "../auth";
import { itemDef } from "../items";
import { LOG_TYPES, logAction } from "../logger";
import { social } from "../social";
import { todayStart } from "../db";
import { mountAdminShop } from "./adminShop";
import { mountAdminPosters } from "./adminPosters";
import { mountAdminEconomy } from "./adminEconomy";
import { mountStudioHub } from "./studioHub";
import type { Ctx } from "../main";

type Tab = "players" | "messages" | "activity" | "economy" | "posters" | "shop" | "studio" | "settings";
const TAB_LABELS: Array<[Tab, string]> = [
  ["players", "Players"], ["messages", "Messages"], ["activity", "Activity"], ["economy", "Economy"], ["posters", "Posters"], ["shop", "Shop"], ["studio", "Studio"], ["settings", "Settings"],
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

const headThumb = headBox;

/** The admin app. Only the account with username "adminsidia" gets here, and the database rules enforce it. */
export function mountAdmin(root: HTMLElement, ctx: Ctx): () => void {
  let tab: Tab = "players";
  let dispose: (() => void) | null = null;
  let users: UserRec[] = [];
  const names = () => new Map(users.map((u) => [u.uid, u.name]));
  const saved = (what: string) => logAction(ctx.profile, "admin", what);

  const tabsEl = h("div", { class: "admin-tabs tabs" });
  const body = h("div", { class: "admin-body" });
  root.append(h("div", { class: "admin" },
    h("div", { class: "privnote" }, "Admin. Treat what you see here as private."),
    tabsEl, body));

  function show(next: Tab): void {
    dispose?.();
    dispose = null;
    tab = next;
    body.replaceChildren();
    tabsEl.replaceChildren(...TAB_LABELS.map(([id, label]) => h("button", { class: "tab" + (id === tab ? " on" : ""), onclick: () => show(id) }, label)));
    const run = { players: accounts, messages, activity: actions, economy: (el: HTMLElement) => mountAdminEconomy(el, ctx), posters: (el: HTMLElement) => mountAdminPosters(el, ctx), shop: (el: HTMLElement) => mountAdminShop(el, ctx), studio: (el: HTMLElement) => mountStudioHub(el, ctx), settings }[tab];
    void Promise.resolve(run(body)).then((d) => { if (tab === next) dispose = d ?? null; else d?.(); });
  }

  // ---- accounts -------------------------------------------------------------------------
  async function accounts(el: HTMLElement): Promise<() => void> {
    el.append(h("div", { class: "loading", style: { color: "#555" } }, "Loading players…"));
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
      const inv = Object.entries(u.inventory).map(([slot, s]) => `${itemDef(s.item)?.name ?? s.item}${s.inPlayer ? " (in the CD player)" : ""} (slot ${Number(slot) + 1})`);
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
    return social.subscribe(() => { if (tab === "players") draw(); });
  }

  // ---- messages: public chat + private conversations --------------------------------------------------
  function messages(el: HTMLElement): () => void {
    let which: "chat" | "private" = "chat";
    let off: (() => void) | null = null;
    let token = 0;
    const seg = h("div", { class: "tabs" });
    const host = h("div", {});
    el.append(seg, host);
    const open = (w: typeof which) => {
      off?.();
      off = null;
      which = w;
      const mine = ++token;
      seg.replaceChildren(...([["chat", "Public chat"], ["private", "Private messages"]] as Array<[typeof which, string]>).map(([id, label]) =>
        h("button", { class: "tab" + (id === which ? " on" : ""), onclick: () => open(id) }, label)));
      host.replaceChildren();
      void (which === "chat" ? chat(host) : privateMessages(host)).then((d) => { if (mine === token) off = d; else d(); });
    };
    open("chat");
    return () => { token++; off?.(); };
  }

  // ---- public chat: everything ever said, kept forever in chatLog (rooms/<room>/chat only holds the last 15 minutes) ----------------------
  async function chat(el: HTMLElement): Promise<() => void> {
    if (!users.length) users = await loadUsers();
    let filter = "";
    let room = "";
    let limit = 500;
    let off: (() => void) | null = null;
    let rows: Array<{ ts: number; uid: string; name: string; text: string; room: string }> = [];
    const host = h("div", { class: "scroll-box" });
    const roomLabel = (id: string): string => {
      if (id === "lobby") return "Basement";
      if (id === "shop") return "Shop";
      if (id.startsWith("tut_")) return "Tutorial";
      const owner = id.startsWith("u_") ? names().get(id.slice(2)) : null;
      return owner ? `${owner}'s room` : id;
    };
    const roomSel = h("select", { onchange: () => { room = roomSel.value; draw(); } });
    const search = h("input", { class: "mini-input", placeholder: "Filter by name or text…", oninput: () => { filter = search.value.trim().toLowerCase(); draw(); } });
    const info = h("span", { class: "hint" });
    const more = h("button", { class: "btn small", onclick: () => { limit += 2000; load(); } }, "Load older");
    const all = h("button", { class: "btn small", onclick: () => { limit = 1_000_000; load(); } }, "Load everything");
    function draw(): void {
      const rooms = [...new Set(rows.map((r) => r.room))].sort((x, y) => roomLabel(x).localeCompare(roomLabel(y)));
      roomSel.replaceChildren(h("option", { value: "" }, "All rooms"), ...rooms.map((r) => h("option", { value: r, ...(r === room ? { selected: "selected" } : {}) }, roomLabel(r))));
      const shown = rows.filter((r) => (!room || r.room === room) && (!filter || r.name.toLowerCase().includes(filter) || r.text.toLowerCase().includes(filter)));
      host.replaceChildren(h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["Time", "Room", "User", "Message"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...shown.map((r) => h("tr", {}, h("td", { class: "hint" }, fmt(r.ts)), h("td", { class: "hint" }, roomLabel(r.room)), h("td", {}, h("b", {}, r.name)), h("td", {}, r.text))))));
      info.textContent = `${shown.length} shown of ${rows.length} loaded (oldest first, live)`;
      more.style.display = all.style.display = rows.length >= limit ? "" : "none";
      host.scrollTop = host.scrollHeight;
    }
    function load(): void {
      off?.();
      off = onValue(query(ref(db, "chatLog"), orderByChild("ts"), limitToLast(limit)), (snap) => {
        rows = [];
        snap.forEach((c) => { const v = c.val(); rows.push({ ts: v.ts ?? 0, uid: v.uid, name: v.name ?? "?", text: v.text ?? "", room: v.room ?? "?" }); });
        draw();
      }, () => toast("Couldn't read the chat", "err"));
    }
    el.append(h("div", { class: "admin-bar" }, roomSel, search, info, more, all), host);
    load();
    return () => off?.();
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

  show("players");
  return () => dispose?.();
}
