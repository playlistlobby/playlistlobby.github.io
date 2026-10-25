// The chat mod page: every chat line as it is written (all rooms), the reports, what players uploaded (the ideas board pictures), and what the mods did.
// Click a name to look at the player: mute, ban, the other accounts they made, what they said. Mods mute for an hour and ban for 30 minutes; the admin chooses the time.
// Everything is done by the server (server/src/actions/mod.ts); this page only asks. Opened from the 🛡 button (top right) by mods and admins, and it is all the
// "playlistmod" account sees when it logs in.
import { get, limitToLast, onChildAdded, onValue, orderByChild, query, equalTo, ref } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { call } from "../db";
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
  let tab: "live" | "reports" | "uploads" | "log" = "live";
  let picked: Pick | null = null;
  let alts: Alt[] | null = null;
  let recent: ChatRow[] | null = null;
  let ips: Array<{ ip: string; at: number; banned: boolean }> | null = null;
  let status: { role: string | null; mute: number; ban: { until?: number } | null } = { role: null, mute: 0, ban: null };
  let reports: Array<{ id: string; from: string; fromName: string; target: string; targetName: string; reason: string; at: number }> = [];
  let ideas: Array<{ id: string; uid: string; name: string; title: string; text?: string; img?: boolean; ts: number }> = [];
  let log: Array<{ byName: string; what: string; targetName: string; detail?: string; at: number }> = [];
  let pausedLive = false;
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
    alts = null; recent = null; ips = null;
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
    if (isAdmin) btns.push(h("button", { class: "btn small danger", type: "button", title: "Ban for good", onclick: () => { if (confirm(`Ban ${p.name} for good?`)) void run(`${p.name} is banned.`, () => call(me, "modBan", { uid: p.uid })); } }, compact ? "⛔ Ban" : "⛔ Ban for good"));
    void muted;
    return btns;
  }

  function paintTabs(): void {
    const t = (id: typeof tab, label: string): HTMLElement => h("button", { class: "mp-tab" + (tab === id ? " on" : ""), type: "button", onclick: () => { tab = id; paint(); } }, label);
    tabs.replaceChildren(t("live", "💬 Live chat"), t("reports", `🚩 Reports${reports.length ? ` (${reports.length})` : ""}`), t("uploads", "🖼 Uploads"), t("log", "📜 Log"),
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
    if (tab === "live") {
      body.replaceChildren(h("div", { class: "mp-bar" }, h("label", {}, h("input", { type: "checkbox", checked: pausedLive, onchange: (e: Event) => { pausedLive = (e.target as HTMLInputElement).checked; if (!pausedLive) paintLive(); } }), " Pause scrolling"), h("span", { class: "hint" }, "Every message in every room, live. Tap a name to see the player.")), live);
      paintLive();
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
    const sec = (title: string, ...kids: Array<HTMLElement | null>): HTMLElement => h("div", { class: "mp-group" }, h("div", { class: "mp-sec" }, title), ...kids.filter((k): k is HTMLElement => !!k));
    const row = (...kids: HTMLElement[]): HTMLElement => h("div", { class: "mp-q on" }, ...kids);
    const btn = (label: string, onclick: () => void, cls = ""): HTMLElement => h("button", { class: `btn small ${cls}`, type: "button", onclick }, label);
    side.replaceChildren(
      h("div", { class: "mp-sidehead" }, h("div", {}, h("div", { class: "mp-pname" }, p.name, status.role ? h("span", { class: "mp-role" }, status.role) : h("span", {})), h("div", { class: "hint mp-uid" }, p.uid)),
        h("button", { class: "btn small mp-closebtn", type: "button", "aria-label": "Close", onclick: () => { picked = null; paintSide(); } }, "✕")),
      h("div", { class: "mp-status" }, muted ? `🔇 muted ${mins(status.mute)} more min` : "not muted", " · ", banned ? (status.ban!.until ? `⛔ banned ${mins(status.ban!.until)} more min` : "⛔ banned for good") : "not banned"),
      sec("Quick", row(...actionsFor(p)),
        row(...(muted ? [btn("Unmute", () => void run("Unmuted.", () => call(me, "modMute", { uid: p.uid, on: false })))] : []),
          ...(banned ? [btn("Unban", () => void run("Unbanned.", () => call(me, "modBan", { uid: p.uid, on: false })))] : []))),
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
        bloodIn,
        row(btn("🩸 Give", () => void run("Blood given.", () => call(me, "modBlood", { uid: p.uid, delta: Math.abs(Number(bloodIn.value)) }))),
          btn("🩸 Take", () => void run("Blood taken.", () => call(me, "modBlood", { uid: p.uid, delta: -Math.abs(Number(bloodIn.value)) })))),
        row(status.role === "mod" ? btn("Take away mod", () => void run("No longer a mod.", () => call(me, "modPromote", { uid: p.uid, role: "none" })))
          : status.role === "admin" ? h("span", { class: "hint" }, "admin") : btn("Make mod", () => void run(`${p.name} is a mod now.`, () => call(me, "modPromote", { uid: p.uid, role: "mod" })), "primary")),
        row(btn("🌐 Addresses", () => void showIps()))) : h("span", {}),
      sec("Look", row(btn("🕵 Other accounts", () => void showAlts()), btn("💬 What they said", () => void showRecent()))),
      ...(ips ? [h("div", { class: "mp-sec" }, `Addresses (${ips.length})`), ...(ips.length ? ips.map((x) => h("div", { class: "mp-alt" }, `${x.ip}`, h("span", { class: "hint" }, ` ${ago(x.at)}${x.banned ? " · banned" : ""}`))) : [h("div", { class: "hint" }, "None noted yet (it is noted when they log in on the live game).")])] : []),
      ...(alts ? [h("div", { class: "mp-sec" }, `Other accounts (${alts.length})`),
        ...(alts.length ? [btn(`Ban all ${alts.filter((a) => !a.banned).length}`, () => { const ids = alts!.filter((a) => !a.banned).map((a) => a.uid); if (ids.length && confirm(`Ban ${ids.length} accounts${isAdmin ? " for good" : " for 30 minutes"}?`)) void run(`${ids.length} accounts banned.`, () => call(me, "modBanMany", { uids: ids })); }, "danger")] : [h("div", { class: "hint" }, "None found.")]),
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
  return () => { stops.forEach((s) => s()); root.remove(); };
}
