import { get, limitToLast, onValue, orderByKey, query, ref } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { backupNow, banAccount, rollbackServer } from "../db";
import { logAction } from "../logger";
import { itemDef } from "../items";
import { BACKUP_KEEP_MS, BackupIndexEntry, LedgerEntry, RollbackLogEntry, sourceLabel } from "../shared/backup";
import type { Ctx } from "../main";

interface Acct {
  uid: string;
  name: string;
  blood: number;
  /** what is in the pockets, the toolbox and the stash box, by name */
  held: Array<{ where: string; name: string; qty: number }>;
  items: number;
  earned: Record<string, number>;
  spent: Record<string, number>;
}
type Entry = LedgerEntry & { uid: string };

const num = (v: unknown): number => Number(v) || 0;
const fmt = (n: number): string => Math.round(n).toLocaleString();
const when = (ts: number): string => new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const ago = (ts: number): string => {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`;
};
const sum = (o: Record<string, number>): number => Object.values(o).reduce((a, b) => a + b, 0);
const itemName = (key: string): string => {
  const ass = key.startsWith("ass_");
  const id = ass ? key.slice(4) : key;
  return (itemDef(id)?.name ?? id) + (ass ? " (ass)" : "");
};

function parseAcct(uid: string, v: any): Acct {
  const held: Acct["held"] = [];
  const inv = v?.inventory ?? {};
  for (const it of Object.values<any>(inv)) if (it && typeof it.item === "string") held.push({ where: "Pockets", name: itemName(it.ass ? `ass_${it.item}` : it.item), qty: num(it.qty) || 1 });
  for (const [k, n] of Object.entries<any>(v?.storage ?? {})) if (num(n) > 0) held.push({ where: "Toolbox", name: itemName(k), qty: num(n) });
  for (const [k, n] of Object.entries<any>(v?.stash ?? {})) if (num(n) > 0) held.push({ where: "Stash box", name: itemName(k), qty: num(n) });
  const nums = (o: any): Record<string, number> => Object.fromEntries(Object.entries<any>(o ?? {}).map(([k, n]) => [k, num(n)]));
  return { uid, name: String(v?.name ?? "?"), blood: num(v?.blood), held, items: held.reduce((a, x) => a + x.qty, 0), earned: nums(v?.bloodBy?.earned), spent: nums(v?.bloodBy?.spent) };
}

/** The admin's economy page: all the blood in the game and where it came from, what every account holds, and the backups (with rollback). Live where it can be. */
export function mountAdminEconomy(el: HTMLElement, ctx: Ctx): () => void {
  let accts: Acct[] = [];
  let index: BackupIndexEntry[] = [];
  let bans = new Set<string>();
  let log: RollbackLogEntry[] = [];
  let feed: Entry[] = [];
  let history: Entry[] | null = null;
  let selected: string | null = null;
  let filter = "";
  let busy = false;
  let rb: { ts: number; gains: Array<{ uid: string; name: string; delta: number }>; ban: Set<string>; typed: string } | null = null;
  let closed = false;

  const search = h("input", { class: "mini-input", placeholder: "Search accounts…", oninput: () => { filter = search.value.trim().toLowerCase(); drawAccounts(); } });
  const top = h("div", {});
  const accountsHost = h("div", {});
  const lower = h("div", {});
  el.append(top, h("h3", {}, "Accounts"), h("div", { class: "admin-bar" }, search), accountsHost, lower);

  const names = (): Map<string, string> => new Map(accts.map((a) => [a.uid, a.name]));
  const nameOf = (uid: string): string => names().get(uid) ?? uid.slice(0, 6);
  const total = (): number => accts.reduce((a, x) => a + x.blood, 0);

  async function loadUsers(): Promise<void> {
    const snap = await get(ref(db, "users"));
    const raw = (snap.val() ?? {}) as Record<string, any>;
    accts = Object.entries(raw).map(([uid, v]) => parseAcct(uid, v)).sort((a, b) => b.blood - a.blood);
  }
  async function loadLedger(buckets: number): Promise<Entry[]> {
    const snap = await get(query(ref(db, "ledger"), orderByKey(), limitToLast(buckets)));
    const out: Entry[] = [];
    snap.forEach((bucket) => { bucket.forEach((u) => { u.forEach((e) => { out.push({ ...(e.val() as LedgerEntry), uid: u.key! }); }); }); });
    return out.sort((a, b) => b.t - a.t);
  }
  async function refreshAll(): Promise<void> {
    try {
      await loadUsers();
      feed = await loadLedger(3);
      history = null;
    } catch { toast("Couldn't read the economy data (are the new database rules deployed?)", "err"); }
    drawTop(); drawAccounts(); drawLower();
  }

  async function run(what: string, job: () => Promise<string>): Promise<void> {
    if (busy) return;
    busy = true; drawLower();
    try { const msg = await job(); logAction(ctx.profile, "admin", what); toast(msg); } catch (err) { toast((err as Error).message || "Couldn't do that.", "err"); }
    busy = false;
    await refreshAll();
  }

  // ---- the numbers at the top ---------------------------------------------------------------------------
  function bars(): HTMLElement {
    const pts = [...index].sort((a, b) => a.at - b.at).map((b) => ({ at: b.at, v: b.totalBlood }));
    pts.push({ at: Date.now(), v: total() });
    const max = Math.max(1, ...pts.map((p) => p.v));
    const W = 600, H = 110, gap = 3, bw = Math.max(3, (W - gap * pts.length) / pts.length);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H + 18}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Blood in circulation at each backup, and now");
    svg.style.width = "100%"; svg.style.maxHeight = "150px";
    pts.forEach((p, i) => {
      const bh = Math.max(1, (p.v / max) * H);
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", String(i * (bw + gap))); r.setAttribute("y", String(H - bh));
      r.setAttribute("width", String(bw)); r.setAttribute("height", String(bh)); r.setAttribute("rx", "2");
      r.setAttribute("fill", i === pts.length - 1 ? "#b3182b" : "#7d8a99");
      const t = document.createElementNS(NS, "title"); t.textContent = `${when(p.at)}: ${fmt(p.v)} blood`; r.append(t);
      svg.append(r);
    });
    const label = (x: number, anchor: string, text: string): void => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", String(x)); t.setAttribute("y", String(H + 14)); t.setAttribute("text-anchor", anchor); t.setAttribute("font-size", "11"); t.setAttribute("fill", "currentColor");
      t.textContent = text; svg.append(t);
    };
    label(0, "start", `${when(pts[0].at)} · ${fmt(pts[0].v)}`);
    label(W, "end", `now · ${fmt(pts[pts.length - 1].v)}`);
    return h("div", { class: "panel", style: { padding: "10px 12px" } }, h("div", { class: "hint" }, "Blood in circulation at each backup (grey) and now (red). A sudden jump is worth a look."), svg);
  }

  function sources(): HTMLElement {
    const earned: Record<string, number> = {}, spent: Record<string, number> = {};
    for (const a of accts) {
      for (const [k, n] of Object.entries(a.earned)) earned[k] = (earned[k] ?? 0) + n;
      for (const [k, n] of Object.entries(a.spent)) spent[k] = (spent[k] ?? 0) + n;
    }
    const tracked = sum(earned) - sum(spent);
    const table = (title: string, data: Record<string, number>, color: string): HTMLElement => {
      const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
      const all = Math.max(1, sum(data));
      return h("div", { class: "panel", style: { padding: "10px 12px", flex: "1 1 280px", minWidth: "0" } },
        h("b", {}, title),
        ...(rows.length ? rows.map(([k, n]) => h("div", { style: { margin: "6px 0" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", gap: "8px" } }, h("span", {}, sourceLabel(k)), h("span", { class: "hint" }, `${fmt(n)} · ${Math.round((n / all) * 100)}%`)),
          h("div", { style: { height: "5px", borderRadius: "3px", background: color, width: `${Math.max(2, (n / all) * 100)}%` } }))) : [h("div", { class: "hint" }, "Nothing tracked yet.")]));
    };
    return h("div", {},
      h("h3", {}, "Where blood comes from, and where it goes"),
      h("div", { class: "hint" }, `Counted since tracking started. Tracked: ${fmt(tracked)} now in circulation from tracked changes. The other ${fmt(total() - tracked)} was already there before tracking started.`),
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" } }, table("Earned", earned, "#2f9e5a"), table("Spent or given away", spent, "#b3182b")));
  }

  function drawTop(): void {
    if (closed) return;
    const last = [...index].sort((a, b) => b.at - a.at)[0];
    const richest = accts[0];
    top.replaceChildren(
      h("div", { class: "adminstat" },
        h("div", { class: "panel" }, h("b", {}, fmt(total())), h("span", { class: "hint" }, "blood in circulation")),
        h("div", { class: "panel" }, h("b", {}, String(accts.length)), h("span", { class: "hint" }, "accounts")),
        h("div", { class: "panel" }, h("b", {}, richest ? fmt(richest.blood) : "0"), h("span", { class: "hint" }, richest ? `most: ${richest.name}` : "most")),
        h("div", { class: "panel" }, h("b", {}, last ? ago(last.at) : "none yet"), h("span", { class: "hint" }, `last backup (${index.length} kept)`))),
      bars(), sources());
  }

  // ---- accounts -------------------------------------------------------------------------------------------
  function detail(a: Acct): HTMLElement {
    const src = (data: Record<string, number>): HTMLElement[] => {
      const rows = Object.entries(data).sort((x, y) => y[1] - x[1]);
      return rows.length ? rows.map(([k, n]) => h("div", { class: "hint" }, `${sourceLabel(k)}: ${fmt(n)}`)) : [h("div", { class: "hint" }, "none tracked")];
    };
    const entries = (history ?? feed).filter((e) => e.uid === a.uid).slice(0, 60);
    const held = [...a.held].sort((x, y) => x.where.localeCompare(y.where) || y.qty - x.qty);
    return h("div", { class: "panel", style: { margin: "6px 0 12px", padding: "10px 12px" } },
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", justifyContent: "space-between" } },
        h("b", {}, `${a.name} · ${fmt(a.blood)} blood`),
        h("button", {
          class: "btn small" + (bans.has(a.uid) ? "" : " primary"), disabled: busy,
          onclick: () => void run(`${bans.has(a.uid) ? "unbanned" : "banned"} ${a.name}`, async () => { const on = !bans.has(a.uid); await banAccount(ctx.profile, a.uid, on, on ? "banned by the admin" : undefined); return on ? `${a.name} is banned.` : `${a.name} can play again.`; }),
        }, bans.has(a.uid) ? "Unban" : "Ban")),
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px" } },
        h("div", { style: { flex: "1 1 200px", minWidth: "0" } }, h("b", {}, "Got blood from"), ...src(a.earned)),
        h("div", { style: { flex: "1 1 200px", minWidth: "0" } }, h("b", {}, "Spent on"), ...src(a.spent)),
        h("div", { style: { flex: "1 1 200px", minWidth: "0" } }, h("b", {}, `Holds (${fmt(a.items)})`),
          ...(held.length ? held.map((x) => h("div", { class: "hint" }, `${x.where}: ${x.name} ×${fmt(x.qty)}`)) : [h("div", { class: "hint" }, "nothing")]))),
      h("div", { style: { marginTop: "10px" } },
        h("b", {}, history ? "Blood changes, last 72 hours" : "Blood changes, last few hours"), " ",
        ...(history ? [] : [h("button", { class: "btn small", onclick: async () => { try { history = await loadLedger(72); drawAccounts(); } catch { toast("Couldn't read the history", "err"); } } }, "Show 72 hours")]),
        entries.length
          ? h("div", { class: "scroll-box", style: { maxHeight: "220px" } }, h("table", { class: "atable" }, h("tbody", {}, ...entries.map((e) => h("tr", {},
              h("td", { class: "hint" }, when(e.t)), h("td", { style: { fontWeight: "700", color: e.d > 0 ? "#2f9e5a" : "#b3182b" } }, `${e.d > 0 ? "+" : ""}${fmt(e.d)}`), h("td", {}, sourceLabel(e.a) + (e.n ? ` (${e.a === "stab" ? nameOf(e.n) : e.n})` : "")), h("td", { class: "hint" }, `→ ${fmt(e.b)}`))))))
          : h("div", { class: "hint" }, "Nothing in this period.")));
  }

  function drawAccounts(): void {
    if (closed) return;
    const shown = accts.filter((a) => !filter || a.name.toLowerCase().includes(filter));
    accountsHost.replaceChildren(
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["Account", "Blood", "Items", "Tracked", ""].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...shown.slice(0, 200).map((a) => h("tr", { style: { cursor: "pointer" }, onclick: () => { selected = selected === a.uid ? null : a.uid; history = null; drawAccounts(); } },
          h("td", {}, h("b", {}, a.name), bans.has(a.uid) ? " 🚫" : ""),
          h("td", {}, fmt(a.blood)),
          h("td", {}, fmt(a.items)),
          h("td", { class: "hint", title: "earned minus spent since tracking started" }, fmt(sum(a.earned) - sum(a.spent))),
          h("td", { class: "hint" }, selected === a.uid ? "▲" : "▼")))))),
      ...(selected && accts.find((a) => a.uid === selected) ? [detail(accts.find((a) => a.uid === selected)!)] : []),
      ...(shown.length > 200 ? [h("div", { class: "hint" }, `Showing 200 of ${shown.length}. Use the search.`)] : []));
  }

  // ---- backups and rollback -------------------------------------------------------------------------------
  async function openRollback(ts: number): Promise<void> {
    let then: Record<string, number> = {};
    try { then = ((await get(ref(db, `backupBlood/${ts}`))).val() ?? {}) as Record<string, number>; } catch { /* the list is just empty */ }
    const gains = accts.map((a) => ({ uid: a.uid, name: a.name, delta: a.blood - num(then[a.uid]) })).filter((g) => g.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 10);
    rb = { ts, gains, ban: new Set(), typed: "" };
    drawLower();
  }

  function rollbackPanel(): HTMLElement {
    const r = rb!;
    const b = index.find((x) => x.at === r.ts);
    const go = h("button", {
      class: "btn primary", disabled: busy || r.typed !== "ROLLBACK",
      onclick: () => void run(`rolled the server back to ${when(r.ts)}`, async () => {
        const res = await rollbackServer(ctx.profile, r.ts, [...r.ban]);
        rb = null;
        return `Rolled back: ${res.users} accounts and ${res.rooms} rooms put back. A safety backup of the moment before was kept.`;
      }),
    }, busy ? "Rolling back…" : "Roll the server back");
    return h("div", { class: "panel", style: { padding: "12px", border: "2px solid #b3182b", margin: "10px 0" } },
      h("b", {}, `Roll back to ${when(r.ts)} (${ago(r.ts)})`),
      h("div", { class: "hint", style: { margin: "6px 0" } }, `Everyone is stopped for a few seconds. Every account's blood, pockets, toolbox, stash box and what they own, and the furniture in every room, go back to ${b ? `how they were then (${fmt(b.totalBlood)} blood in ${b.accounts} accounts)` : "that backup"}. Everything since is lost, for everybody. Accounts made after the backup, names, looks, friends and chat are not touched. A backup of right now is made first, so you can go forward again.`),
      h("div", { class: "hint" }, "Ban while you roll back (these gained the most blood since that backup):"),
      ...(r.gains.length
        ? r.gains.map((g) => h("label", { style: { display: "flex", gap: "8px", alignItems: "center", margin: "3px 0" } },
            h("input", { type: "checkbox", checked: r.ban.has(g.uid), onchange: (e: Event) => { if ((e.target as HTMLInputElement).checked) r.ban.add(g.uid); else r.ban.delete(g.uid); } }),
            h("span", {}, `${g.name} `, h("span", { class: "hint" }, `+${fmt(g.delta)} blood since`))))
        : [h("div", { class: "hint" }, "Nobody has more blood than then.")]),
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginTop: "10px" } },
        h("input", { class: "mini-input", placeholder: "type ROLLBACK to confirm", value: r.typed, oninput: (e: Event) => { r.typed = (e.target as HTMLInputElement).value.trim(); go.disabled = busy || r.typed !== "ROLLBACK"; } }),
        go,
        h("button", { class: "btn small", onclick: () => { rb = null; drawLower(); } }, "Cancel")));
  }

  function drawLower(): void {
    if (closed) return;
    const list = [...index].sort((a, b) => b.at - a.at);
    const recent = feed.slice(0, 60);
    lower.replaceChildren(
      h("h3", {}, "Backups"),
      h("div", { class: "hint" }, `Taken about every 20 minutes and kept ${BACKUP_KEEP_MS / 3_600_000} hours. Use one to roll the server back if somebody finds a dupe or an exploit: roll back, ban them, then fix it.`),
      h("div", { style: { margin: "8px 0" } }, h("button", { class: "btn small primary", disabled: busy, onclick: () => void run("made a backup", async () => { await backupNow(ctx.profile, "manual"); return "Backup made."; }) }, busy ? "Working…" : "Back up now")),
      ...(rb ? [rollbackPanel()] : []),
      h("div", { class: "scroll-box" }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["Time", "Kind", "Accounts", "Blood", "vs now", ""].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...(list.length ? list.map((b) => h("tr", {},
          h("td", {}, when(b.at), " ", h("span", { class: "hint" }, ago(b.at))),
          h("td", {}, h("span", { class: "pill" }, b.kind === "pre-rollback" ? "safety" : b.kind), b.note ? h("div", { class: "hint" }, b.note) : null),
          h("td", {}, fmt(b.accounts)),
          h("td", {}, fmt(b.totalBlood)),
          h("td", { class: "hint" }, `${total() - b.totalBlood >= 0 ? "+" : ""}${fmt(total() - b.totalBlood)}`),
          h("td", {}, h("button", { class: "btn small", disabled: busy, onclick: () => void openRollback(b.at) }, "Roll back…")))) : [h("tr", {}, h("td", { colSpan: 6, class: "hint" }, "No backups yet. The server makes the first one within about 20 minutes of someone playing, or press Back up now."))])))),
      ...(log.length ? [h("h3", {}, "Rollbacks so far"), ...log.map((l) => h("div", { class: "hint" }, `${when(l.at)}: back to ${when(l.to)} · ${fmt(l.users)} accounts, ${fmt(l.rooms)} rooms${l.banned.length ? ` · banned ${l.banned.map(nameOf).join(", ")}` : ""} · safety backup ${when(l.safety)}`))] : []),
      h("h3", {}, "Latest blood changes"),
      recent.length
        ? h("div", { class: "scroll-box", style: { maxHeight: "260px" } }, h("table", { class: "atable" }, h("tbody", {}, ...recent.map((e) => h("tr", {},
            h("td", { class: "hint" }, when(e.t)), h("td", {}, h("b", {}, nameOf(e.uid))),
            h("td", { style: { fontWeight: "700", color: e.d > 0 ? "#2f9e5a" : "#b3182b" } }, `${e.d > 0 ? "+" : ""}${fmt(e.d)}`),
            h("td", {}, sourceLabel(e.a)))))))
        : h("div", { class: "hint" }, "No blood changes recorded yet."));
  }

  // ---- live parts -------------------------------------------------------------------------------------------
  const offs = [
    onValue(ref(db, "backupIndex"), (snap) => { index = Object.values((snap.val() ?? {}) as Record<string, BackupIndexEntry>); drawTop(); drawLower(); }, () => toast("Couldn't read the backups (are the new database rules deployed?)", "err")),
    onValue(ref(db, "bans"), (snap) => { bans = new Set(Object.keys((snap.val() ?? {}) as Record<string, unknown>)); drawAccounts(); }, () => undefined),
    onValue(query(ref(db, "rollbackLog"), orderByKey(), limitToLast(10)), (snap) => { log = []; snap.forEach((c) => { log.unshift(c.val() as RollbackLogEntry); }); drawLower(); }, () => undefined),
  ];
  top.append(h("div", { class: "loading", style: { color: "#555" } }, "Loading…"));
  void refreshAll();
  return () => { closed = true; offs.forEach((off) => off()); };
}
