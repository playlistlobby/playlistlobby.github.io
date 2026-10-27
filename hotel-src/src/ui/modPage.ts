// The chat mod page: every chat line as it is written (all rooms), the reports, what players uploaded (the ideas board pictures), and what the mods did.
// Click a name to look at the player: mute, ban, the other accounts they made, what they said. Mods mute for an hour and ban for 30 minutes; the admin chooses the time.
// Everything is done by the server (server/src/actions/mod.ts); this page only asks. Opened from the 🛡 button (top right) by mods and admins, and it is all the
// "playlistmod" account sees when it logs in.
import { get, limitToLast, onChildAdded, onValue, orderByChild, query, equalTo, ref } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { call } from "../db";
import { mountAdminEconomy } from "./adminEconomy";
import { MOD_BAN_MS, MOD_MUTE_MS } from "../shared/mod";
import type { Ctx } from "../main";

interface ChatRow { uid: string; name: string; text: string; room: string; ts: number }
interface Pick { uid: string; name: string }
interface Alt { uid: string; name: string; createdAt: number; why: string; banned: boolean }

const when = (ts: number): string => new Date(ts).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const ago = (ts: number): string => { const m = Math.max(0, Math.round((Date.now() - ts) / 60000)); return m < 1 ? "just now" : m < 90 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
const roomName = (r: string): string => (r.startsWith("u_") ? "room " + r.slice(2, 6) : r.startsWith("tut_") ? "intro" : r);

export function mountModPage(host: HTMLElement, ctx: Ctx): () => void {
  const me = ctx.profile;
  const isAdmin = me.isAdmin || me.role === "admin";
  const stops: Array<() => void> = [];
  let tab: "live" | "dms" | "reports" | "uploads" | "economy" | "staff" | "log" = "live";
  let stopEconomy: (() => void) | null = null;
  let picked: Pick | null = null;
  let alts: Alt[] | null = null;
  let recent: ChatRow[] | null = null;
  let ips: Array<{ ip: string; at: number; banned: boolean }> | null = null;
  let status: { role: string | null; mute: number; ban: { until?: number } | null } = { role: null, mute: 0, ban: null };
  let reports: Array<{ id: string; from: string; fromName: string; target: string; targetName: string; reason: string; at: number }> = [];
  let ideas: Array<{ id: string; uid: string; name: string; title: string; text?: string; img?: boolean; ts: number }> = [];
  let log: Array<{ byName: string; what: string; targetName: string; detail?: string; at: number }> = [];
  let pausedLive = false;
  interface DmRow { from: string; fromName?: string; to: string; text: string; ts: number }
  const dmRows: DmRow[] = [];
  const names = new Map<string, string>();
  let staff: Record<string, string> = {};
  let threads: Array<{ other: string; msgs: Array<{ from: string; text: string; ts: number }> }> | null = null;
  let busy = false;
  const liveRows: ChatRow[] = [];

  const tabs = h("div", { class: "mp-tabs" });
  const live = h("div", { class: "mp-live" });
  const body = h("div", { class: "mp-body" });
  const side = h("aside", { class: "mp-side" });
  const root = h("div", { class: "mp" },
    h("div", { class: "mp-head" }, h("strong", {}, "🛡 Chat mod"), h("span", { class: "hint" }, isAdmin ? " · full access" : " · mod: mute 1 hour, ban 30 minutes")), tabs,
    h("div", { class: "mp-main" }, h("section", { class: "mp-center" }, body), side));
  host.append(root);

  const run = async (label: string, job: () => Promise<unknown>): Promise<void> => {
    if (busy) return;
    busy = true;
    try { await job(); toast(label); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
    busy = false;
    if (picked) await loadPlayer(picked);
    paint();
  };

  async function loadPlayer(p: Pick): Promise<void> {
    picked = p;
    const [role, mute, ban] = await Promise.all([get(ref(db, `roles/${p.uid}`)), get(ref(db, `mutes/${p.uid}`)), get(ref(db, `bans/${p.uid}`))]);
    status = { role: (role.val() as string | null) ?? null, mute: Number((mute.val() as { until?: number } | null)?.until) || 0, ban: (ban.val() as { until?: number } | null) };
    paintSide();
  }
  async function select(uid: string, name: string): Promise<void> {
    alts = null; recent = null; ips = null; threads = null;
    await loadPlayer({ uid, name });
  }
  async function findByName(name: string): Promise<void> {
    const n = name.trim().toLowerCase();
    if (!n) return;
    const uid = (await get(ref(db, `usernames/${n}`))).val() as string | null;
    if (!uid) { toast("No player with that name.", "err"); return; }
    const nm = (await get(ref(db, `profiles/${uid}/name`))).val() as string | null;
    await select(uid, nm ?? name);
  }
  async function showRecent(): Promise<void> {
    if (!picked) return;
    const snap = await get(query(ref(db, "chatLog"), orderByChild("uid"), equalTo(picked.uid), limitToLast(40)));
    recent = Object.values((snap.val() ?? {}) as Record<string, ChatRow>).sort((a, b) => a.ts - b.ts);
    paintSide();
  }
  async function showIps(): Promise<void> {
    if (!picked) return;
    try { ips = (await call<{ ips: Array<{ ip: string; at: number; banned: boolean }> }>(me, "modIps", { uid: picked.uid })).ips; } catch (err) { toast((err as Error).message, "err"); return; }
    paintSide();
  }
  const nameOf = (uid: string): string => {
    if (!names.has(uid)) { names.set(uid, uid.slice(0, 6)); void get(ref(db, `profiles/${uid}/name`)).then((s) => { if (typeof s.val() === "string") { names.set(uid, s.val() as string); if (tab === "staff" || tab === "dms") paintBody(); if (threads) paintSide(); } }, () => undefined); }
    return names.get(uid)!;
  };
  /** every private conversation of the player (dms/<uid>/<friend>/...): who they wrote to, and what */
  async function showThreads(): Promise<void> {
    if (!picked) return;
    const snap = await get(ref(db, `dms/${picked.uid}`));
    const all = (snap.val() ?? {}) as Record<string, Record<string, { from: string; text: string; ts: number }>>;
    threads = Object.entries(all).map(([other, m]) => ({ other, msgs: Object.values(m).sort((a, b) => a.ts - b.ts).slice(-40) })).sort((a, b) => (b.msgs[b.msgs.length - 1]?.ts ?? 0) - (a.msgs[a.msgs.length - 1]?.ts ?? 0));
    paintSide();
  }
  async function showAlts(): Promise<void> {
    if (!picked) return;
    try { alts = (await call<{ accounts: Alt[] }>(me, "modAlts", { uid: picked.uid })).accounts; } catch (err) { toast((err as Error).message, "err"); return; }
    paintSide();
  }

  const name = (uid: string, n: string): HTMLElement => h("button", { class: "mp-name", type: "button", title: "Look at this player", onclick: () => void select(uid, n) }, n);

  /** the quick buttons for a player: mute, ban (a mod's fixed times, the admin's own) */
  function actionsFor(p: Pick, compact = false): HTMLElement[] {
    const muted = status.mute > Date.now() && picked?.uid === p.uid;
    const btns: HTMLElement[] = [
      h("button", { class: "btn small", type: "button", title: `Mute for ${MOD_MUTE_MS / 60000} minutes`, onclick: () => void run(`${p.name} is muted.`, () => call(me, "modMute", { uid: p.uid })) }, compact ? "🔇 1h" : "🔇 Mute 1 hour"),
      h("button", { class: "btn small", type: "button", title: `Ban for ${MOD_BAN_MS / 60000} minutes`, onclick: () => void run(`${p.name} is banned for 30 minutes.`, () => call(me, "modBan", { uid: p.uid, minutes: 30 })) }, compact ? "⛔ 30m" : "⛔ Ban 30 minutes"),
    ];
    if (isAdmin || me.muteForever) btns.push(h("button", { class: "btn small", type: "button", title: "Mute for good", onclick: () => { if (confirm(`Mute ${p.name} for good?`)) void run(`${p.name} is muted for good.`, () => call(me, "modMute", { uid: p.uid, forever: true })); } }, compact ? "🔇 ∞" : "🔇 Mute forever"));
    if (isAdmin || me.banForever) btns.push(h("button", { class: "btn small danger", type: "button", title: "Ban for good", onclick: () => { if (confirm(`Ban ${p.name} for good?`)) void run(`${p.name} is banned.`, () => call(me, "modBan", { uid: p.uid })); } }, compact ? "⛔ Ban" : "⛔ Ban for good"));
    void muted;
    return btns;
  }

  function paintTabs(): void {
    const t = (id: typeof tab, label: string): HTMLElement => h("button", { class: "mp-tab" + (tab === id ? " on" : ""), type: "button", onclick: () => { tab = id; paint(); } }, label);
    tabs.replaceChildren(t("live", "💬 Live chat"), t("dms", "✉ Private"), t("reports", `🚩 Reports${reports.length ? ` (${reports.length})` : ""}`), t("uploads", "🖼 Uploads"), t("economy", "🩸 Economy"), ...(isAdmin ? [t("staff", "🛡 Staff")] : []), t("log", "📜 Log"),
      ...(isAdmin ? [h("form", { class: "mp-find mp-all", onsubmit: (e: Event) => { e.preventDefault(); const i = (e.currentTarget as HTMLFormElement).querySelector("input")!; const t = i.value; if (t.trim() && confirm("Put this message on EVERYBODY's screen?")) void run("Sent to everybody.", async () => { await call(me, "modNotice", { uid: "all", kind: "msg", text: t }); i.value = ""; }); } },
        h("input", { class: "mini-input", maxLength: 200, placeholder: "Message to everybody…", "aria-label": "Message to everybody" }), h("button", { class: "btn small", type: "submit" }, "📢 All"))] : []),
      h("form", { class: "mp-find", onsubmit: (e: Event) => { e.preventDefault(); const i = (e.currentTarget as HTMLFormElement).querySelector("input")!; void findByName(i.value); } },
        h("input", { class: "mini-input", placeholder: "Find a player…", "aria-label": "Find a player" }), h("button", { class: "btn small", type: "submit" }, "Find")));
  }

  function chatLine(m: ChatRow): HTMLElement {
    return h("div", { class: "mp-line" },
      h("span", { class: "mp-time" }, when(m.ts)), h("span", { class: "mp-room" }, roomName(m.room)), name(m.uid, m.name), h("span", { class: "mp-text" }, m.text),
      h("span", { class: "mp-q" }, ...actionsFor({ uid: m.uid, name: m.name }, true)));
  }

  function paintLive(): void {
    live.replaceChildren(...liveRows.map(chatLine));
    if (!pausedLive) live.scrollTop = live.scrollHeight;
  }

  function paintBody(): void {
    stopEconomy?.();
    stopEconomy = null;
    if (tab === "economy") {
      const el = h("div", {});
      body.replaceChildren(h("div", { class: "hint" }, "How much blood there is, where it comes from and what everybody holds. Look only: you can't change anything here."), el);
      stopEconomy = mountAdminEconomy(el, ctx, true);
    } else if (tab === "live") {
      body.replaceChildren(h("div", { class: "mp-bar" }, h("label", {}, h("input", { type: "checkbox", checked: pausedLive, onchange: (e: Event) => { pausedLive = (e.target as HTMLInputElement).checked; if (!pausedLive) paintLive(); } }), " Pause scrolling"), h("span", { class: "hint" }, "Every message in every room, live. Tap a name to see the player.")), live);
      paintLive();
    } else if (tab === "dms") {
      body.replaceChildren(h("div", { class: "hint" }, "Private messages between friends, as they are sent (only from now on: to read an older talk, open a player and press ✉ Their private messages)."), ...(dmRows.length ? [...dmRows].reverse().slice(0, 150).map((m) => h("div", { class: "mp-line" },
        h("span", { class: "mp-time" }, when(m.ts)), name(m.from, m.fromName ?? nameOf(m.from)), h("span", { class: "hint" }, "→"), name(m.to, nameOf(m.to)), h("span", { class: "mp-text" }, m.text),
        h("span", { class: "mp-q" }, ...actionsFor({ uid: m.from, name: m.fromName ?? nameOf(m.from) }, true)))) : [h("div", { class: "hint pad" }, "No private messages yet.")]));
    } else if (tab === "staff") {
      const nameIn = h("input", { class: "mini-input", placeholder: "Make somebody a mod: their name", "aria-label": "Name" }) as HTMLInputElement;
      body.replaceChildren(
        h("form", { class: "mp-card", onsubmit: (e: Event) => { e.preventDefault(); const n = nameIn.value.trim().toLowerCase(); if (!n) return; void run("Done.", async () => { const uid = (await get(ref(db, `usernames/${n}`))).val() as string | null; if (!uid) throw new Error("No player with that name."); await call(me, "modPromote", { uid, role: "mod" }); nameIn.value = ""; }); } },
          h("div", { class: "mp-sec" }, "Make a mod"), nameIn, h("button", { class: "btn small primary", type: "submit" }, "Make mod")),
        h("div", { class: "mp-sec" }, "Staff"),
        ...Object.entries(staff).map(([uid, role]) => h("div", { class: "mp-card" }, name(uid, nameOf(uid)), h("span", { class: "mp-role" }, role),
          role === "mod" ? h("button", { class: "btn small", type: "button", onclick: () => void run("No longer a mod.", () => call(me, "modPromote", { uid, role: "none" })) }, "Take away mod") : h("span", {}))),
        h("div", { class: "hint" }, "The admins are Emil, adminsidia and playlistmod. Admins are set by hand."));
    } else if (tab === "reports") {
      body.replaceChildren(...(reports.length ? reports.map((r) => h("div", { class: "mp-card" },
        h("div", {}, name(r.from, r.fromName), " reported ", name(r.target, r.targetName), h("span", { class: "hint" }, ` · ${ago(r.at)}`)),
        h("div", { class: "mp-reason" }, r.reason),
        h("div", { class: "mp-q on" }, ...actionsFor({ uid: r.target, name: r.targetName }, true),
          h("button", { class: "btn small", type: "button", onclick: () => void run("Report cleared.", () => call(me, "modDismissReport", { id: r.id })) }, "✔ Done")))) : [h("div", { class: "hint pad" }, "No reports. 🎉")]));
    } else if (tab === "uploads") {
      const withPics = ideas.filter((i) => i.img);
      body.replaceChildren(h("div", { class: "hint" }, "Pictures and posts on the ideas board (they disappear after 24 hours)."), ...(ideas.length ? ideas.map((i) => {
        const img = h("img", { class: "mp-img", alt: "" }) as HTMLImageElement;
        if (i.img) void get(ref(db, `ideasImg/${i.id}`)).then((s) => { if (typeof s.val() === "string") img.src = s.val() as string; });
        return h("div", { class: "mp-card" }, name(i.uid, i.name), h("span", { class: "hint" }, ` · ${ago(i.ts)}`), h("div", { class: "mp-reason" }, i.title + (i.text ? ` — ${i.text}` : "")), i.img ? img : h("span", {}),
          h("div", { class: "mp-q on" }, ...actionsFor({ uid: i.uid, name: i.name }, true), h("button", { class: "btn small danger", type: "button", onclick: () => void run("Removed.", () => call(me, "ideaDelete", { post: i.id })) }, "🗑 Remove")));
      }) : [h("div", { class: "hint pad" }, "Nothing uploaded right now.")]), h("span", { class: "hint" }, withPics.length ? "" : ""));
    } else {
      body.replaceChildren(...(log.length ? [...log].reverse().map((l) => h("div", { class: "mp-line" }, h("span", { class: "mp-time" }, ago(l.at)), h("b", {}, l.byName), h("span", { class: "mp-text" }, `${l.what} ${l.targetName}${l.detail ? " (" + l.detail + ")" : ""}`))) : [h("div", { class: "hint pad" }, "Nothing yet.")]));
    }
  }

  function paintSide(): void {
    side.classList.toggle("open", !!picked);
    if (!picked) { side.replaceChildren(h("div", { class: "hint pad" }, "Tap a name (or find a player) to see them here.")); return; }
    const p = picked;
    const muted = status.mute > Date.now();
    const banned = !!status.ban && (!status.ban.until || status.ban.until > Date.now());
    const mins = (t: number): number => Math.max(1, Math.ceil((t - Date.now()) / 60000));
    const field = (cls: string, ph: string, type = "text", value = ""): HTMLInputElement => h("input", { class: `mini-input ${cls}`, type, placeholder: ph, value, "aria-label": ph }) as HTMLInputElement;
    const reason = field("mp-reason-in", "Reason (optional)");
    const noteIn = field("mp-note-in", "Message to this player");
    const minIn = field("mp-min", "Minutes", "number", "60");
    const bloodIn = field("mp-blood", "Blood", "number", "100");
    const nameIn = field("mp-rename", "New name for this player");
    const sec = (title: string, ...kids: Array<HTMLElement | null>): HTMLElement => h("div", { class: "mp-group" }, h("div", { class: "mp-sec" }, title), ...kids.filter((k): k is HTMLElement => !!k));
    const row = (...kids: HTMLElement[]): HTMLElement => h("div", { class: "mp-q on" }, ...kids);
    const btn = (label: string, onclick: () => void, cls = ""): HTMLElement => h("button", { class: `btn small ${cls}`, type: "button", onclick }, label);
    side.replaceChildren(
      h("div", { class: "mp-sidehead" }, h("div", {}, h("div", { class: "mp-pname" }, p.name, status.role ? h("span", { class: "mp-role" }, status.role) : h("span", {})), h("div", { class: "hint mp-uid" }, p.uid)),
        h("button", { class: "btn small mp-closebtn", type: "button", "aria-label": "Close", onclick: () => { picked = null; paintSide(); } }, "✕")),
      h("div", { class: "mp-status" }, muted ? (status.mute - Date.now() > 365 * 24 * 3_600_000 ? "🔇 muted for good" : `🔇 muted ${mins(status.mute)} more min`) : "not muted", " · ", banned ? (status.ban!.until ? `⛔ banned ${mins(status.ban!.until)} more min` : "⛔ banned for good") : "not banned"),
      sec("Quick", row(...actionsFor(p)),
        row(...(muted ? [btn("Unmute", () => void run("Unmuted.", () => call(me, "modMute", { uid: p.uid, on: false })))] : []),
          ...(banned ? [btn("Unban", () => void run("Unbanned.", () => call(me, "modBan", { uid: p.uid, on: false })))] : [])),
        ...(!isAdmin && me.ipBan ? [row(
          ...(me.banForever ? [btn("⛔ + address ban", () => { if (confirm(`Ban ${p.name} for good and ban the addresses they play from?`)) void run(`${p.name} is banned, and their addresses.`, async () => { await call(me, "modBan", { uid: p.uid }); await call(me, "modIpBan", { uid: p.uid }); }); }, "danger")] : []),
          btn("Address ban", () => { if (confirm(`Ban the addresses ${p.name} plays from?`)) void run("Addresses banned.", () => call(me, "modIpBan", { uid: p.uid })); }, "danger"),
          btn("Lift address ban", () => void run("Address ban lifted.", () => call(me, "modIpBan", { uid: p.uid, on: false }))),
          btn("🌐 Addresses", () => void showIps()))] : [])),
      sec("Tell them", noteIn,
        row(btn("⚠ Warn", () => void run("Warning sent.", () => call(me, "modNotice", { uid: p.uid, kind: "warn", text: noteIn.value }))),
          btn("📢 Message", () => void run("Message sent.", () => call(me, "modNotice", { uid: p.uid, kind: "msg", text: noteIn.value }))),
          btn("👢 Kick", () => void run(`${p.name} was kicked.`, () => call(me, "modKick", { uid: p.uid, reason: noteIn.value }))))),
      isAdmin ? sec("Admin", minIn, reason,
        row(btn("Mute (min)", () => void run(`Muted for ${minIn.value} minutes.`, () => call(me, "modMute", { uid: p.uid, minutes: Number(minIn.value) }))),
          btn("Ban (min)", () => void run(`Banned for ${minIn.value} minutes.`, () => call(me, "modBan", { uid: p.uid, minutes: Number(minIn.value), reason: reason.value })))),
        row(btn("⛔ Ban for good", () => { if (confirm(`Ban ${p.name} for good?`)) void run(`${p.name} is banned.`, () => call(me, "modBan", { uid: p.uid, reason: reason.value })); }, "danger"),
          btn("⛔ + address ban", () => { if (confirm(`Ban ${p.name} for good and ban the addresses they play from?`)) void run(`${p.name} is banned, and their addresses.`, async () => { await call(me, "modBan", { uid: p.uid, reason: reason.value }); await call(me, "modIpBan", { uid: p.uid }); }); }, "danger"),
          btn("Lift address ban", () => void run("Address ban lifted.", () => call(me, "modIpBan", { uid: p.uid, on: false })))),
        nameIn,
        row(btn("✏️ Rename", () => void run("Renamed.", async () => { const r = await call<{ name: string }>(me, "modRename", { uid: p.uid, name: nameIn.value.trim() }); picked = { uid: p.uid, name: r.name }; }))),
        bloodIn,
        row(btn("🩸 Give", () => void run("Blood given.", () => call(me, "modBlood", { uid: p.uid, delta: Math.abs(Number(bloodIn.value)) }))),
          btn("🩸 Take", () => void run("Blood taken.", () => call(me, "modBlood", { uid: p.uid, delta: -Math.abs(Number(bloodIn.value)) })))),
        row(status.role === "mod" ? btn("Take away mod", () => void run("No longer a mod.", () => call(me, "modPromote", { uid: p.uid, role: "none" })))
          : status.role === "admin" ? h("span", { class: "hint" }, "admin") : btn("Make mod", () => void run(`${p.name} is a mod now.`, () => call(me, "modPromote", { uid: p.uid, role: "mod" })), "primary")),
        row(btn("🌐 Addresses", () => void showIps()))) : h("span", {}),
      sec("Look", row(btn("🕵 Other accounts", () => void showAlts()), btn("💬 What they said", () => void showRecent()), btn("✉ Their private messages", () => void showThreads()))),
      ...(threads ? [h("div", { class: "mp-sec" }, `Private messages (${threads.length} talks)`), ...(threads.length ? threads.flatMap((t) => [h("div", { class: "mp-sec small" }, `with ${nameOf(t.other)}`), ...t.msgs.map((m) => h("div", { class: "mp-line small" }, h("span", { class: "mp-time" }, ago(m.ts)), h("b", {}, m.from === p.uid ? p.name : nameOf(m.from)), h("span", { class: "mp-text" }, m.text)))]) : [h("div", { class: "hint" }, "No private talks.")])] : []),
      ...(ips ? [h("div", { class: "mp-sec" }, `Addresses (${ips.length})`), ...(ips.length ? ips.map((x) => h("div", { class: "mp-alt" }, `${x.ip}`, h("span", { class: "hint" }, ` ${ago(x.at)}${x.banned ? " · banned" : ""}`))) : [h("div", { class: "hint" }, "None noted yet (it is noted when they log in on the live game).")])] : []),
      ...(alts ? [h("div", { class: "mp-sec" }, `Other accounts (${alts.length})`),
        ...(alts.length ? [btn(`Ban all ${alts.filter((a) => !a.banned).length}`, () => { const ids = alts!.filter((a) => !a.banned).map((a) => a.uid); if (ids.length && confirm(`Ban ${ids.length} accounts${isAdmin || me.banForever ? " for good" : " for 30 minutes"}?`)) void run(`${ids.length} accounts banned.`, () => call(me, "modBanMany", { uids: ids })); }, "danger")] : [h("div", { class: "hint" }, "None found.")]),
        ...alts.map((a) => h("div", { class: "mp-alt" }, name(a.uid, a.name), h("span", { class: "hint" }, ` ${a.why}${a.banned ? " · banned" : ""}`)))] : []),
      ...(recent ? [h("div", { class: "mp-sec" }, "What they said"), ...(recent.length ? recent.map((m) => h("div", { class: "mp-line small" }, h("span", { class: "mp-time" }, ago(m.ts)), h("span", { class: "mp-room" }, roomName(m.room)), h("span", { class: "mp-text" }, m.text))) : [h("div", { class: "hint" }, "Nothing written.")])] : []));
  }

  function paint(): void { paintTabs(); paintBody(); paintSide(); }

  // the live chat (every room) and the lists
  stops.push(onChildAdded(query(ref(db, "chatLog"), orderByChild("ts"), limitToLast(150)), (s) => {
    const m = s.val() as ChatRow | null;
    if (!m || typeof m.text !== "string") return;
    liveRows.push(m);
    if (liveRows.length > 400) liveRows.shift();
    if (tab === "live") { live.append(chatLine(m)); if (live.childElementCount > 400) live.firstElementChild?.remove(); if (!pausedLive) live.scrollTop = live.scrollHeight; }
  }, (err) => toast(`Can't read the chat: ${err.message}`, "err")));
  stops.push(onChildAdded(query(ref(db, "dmLog"), orderByChild("ts"), limitToLast(100)), (s) => {
    const m = s.val() as DmRow | null;
    if (!m || typeof m.text !== "string") return;
    dmRows.push(m);
    if (dmRows.length > 400) dmRows.shift();
    if (tab === "dms") paintBody();
  }, () => undefined));
  stops.push(onValue(ref(db, "roles"), (s) => { staff = (s.val() ?? {}) as Record<string, string>; if (tab === "staff") paintBody(); }, () => undefined));
  stops.push(onValue(ref(db, "reports"), (s) => {
    reports = Object.entries((s.val() ?? {}) as Record<string, Omit<(typeof reports)[number], "id">>).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.at - a.at);
    paintTabs(); if (tab === "reports") paintBody();
  }, () => undefined));
  stops.push(onValue(ref(db, "ideas/posts"), (s) => {
    ideas = Object.entries((s.val() ?? {}) as Record<string, Omit<(typeof ideas)[number], "id">>).map(([id, i]) => ({ id, ...i })).sort((a, b) => b.ts - a.ts);
    if (tab === "uploads") paintBody();
  }, () => undefined));
  stops.push(onValue(query(ref(db, "modLog"), limitToLast(100)), (s) => {
    log = Object.values((s.val() ?? {}) as Record<string, (typeof log)[number]>).sort((a, b) => a.at - b.at);
    if (tab === "log") paintBody();
  }, () => undefined));

  paint();
  return () => { stopEconomy?.(); stops.forEach((s) => s()); root.remove(); };
}
