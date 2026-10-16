import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import { h, toast } from "./dom";
import { posterAdminCall } from "../db";
import { logAction } from "../logger";
import { POSTER_KIND } from "../shared/furniture";
import type { Ctx } from "../main";

interface Row { room: string; id: string; img: string; ownerUid: string; ownerName: string; roomName: string; by?: string; ts: number }

// a piece's id is "f" + the time it was hung in base 36 + 4 random characters (see server/src/actions/toolbox.ts)
const hungAt = (id: string): number => (/^f[0-9a-z]{8,}$/.test(id) ? parseInt(id.slice(1, -4), 36) || 0 : 0);
const fmt = (ts: number): string => (ts ? new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "?");

/** The admin's poster feed: every picture hung on a poster in any room, newest first. Take one down, or mute its owner from putting pictures on posters. Live. */
export function mountAdminPosters(el: HTMLElement, ctx: Ctx): () => void {
  let rows: Row[] = [];
  let muted: Record<string, true> = {};
  let names = new Map<string, string>();
  let filter = "";
  const host = h("div", { class: "poster-feed" });
  const search = h("input", { class: "mini-input", placeholder: "Filter by owner or room…", oninput: () => { filter = search.value.trim().toLowerCase(); draw(); } });
  el.append(h("div", { class: "admin-bar" }, search, h("span", { class: "hint" }, "Every picture on a poster, newest first, live")), host);

  async function run(what: string, args: object, done: string): Promise<void> {
    try {
      await posterAdminCall(ctx.profile, args);
      logAction(ctx.profile, "admin", what);
      toast(done);
    } catch (err) { toast((err as Error).message, "err"); }
  }

  function draw(): void {
    const shown = rows.filter((r) => !filter || r.ownerName.toLowerCase().includes(filter) || r.roomName.toLowerCase().includes(filter) || (names.get(r.by ?? "") ?? "").toLowerCase().includes(filter));
    const mutedList = Object.keys(muted);
    host.replaceChildren(
      mutedList.length ? h("div", { class: "panel", style: { marginBottom: "10px" } },
        h("b", {}, "Muted from posters: "),
        ...mutedList.map((uid) => h("span", { style: { marginRight: "8px" } }, names.get(uid) ?? uid, " ",
          h("button", { class: "btn small", onclick: () => void run(`unmuted ${names.get(uid) ?? uid} from posters`, { op: "mute", uid, on: false }, "Unmuted.") }, "Unmute")))) : h("span", {}),
      shown.length ? h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" } }, ...shown.map((r) => {
        const who = r.by ? (names.get(r.by) ?? r.by) : r.ownerName; // whoever hung it: a decorator in someone else's room, or the owner
        const whoUid = r.by ?? r.ownerUid;
        const isMuted = !!muted[whoUid];
        return h("div", { class: "panel", style: { padding: "8px" } },
          h("img", { src: r.img, alt: "", style: { width: "100%", imageRendering: "pixelated", background: "#fff", border: "1px solid #888" } }),
          h("div", { class: "hint" }, h("b", {}, who), r.by ? ` (in ${r.ownerName}'s room)` : "", h("br", {}), `${r.roomName} · ${fmt(r.ts)}`),
          h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" } },
            h("button", { class: "btn small", onclick: () => void run(`took a poster picture down (${who})`, { op: "clear", room: r.room, id: r.id }, "The picture was taken down.") }, "Delete"),
            isMuted
              ? h("button", { class: "btn small", onclick: () => void run(`unmuted ${who} from posters`, { op: "mute", uid: whoUid, on: false }, "Unmuted.") }, "Unmute")
              : h("button", { class: "btn small primary", onclick: () => { if (confirm(`Mute ${who} from posters and take down all their pictures?`)) void run(`muted ${who} from posters`, { op: "mute", uid: whoUid, clearAll: true }, `${who} is muted.`); } }, "Mute + delete all")));
      })) : h("div", { class: "hint" }, "No pictures on any poster."));
  }

  const offs = [
    onValue(ref(db, "roomsMeta"), (snap) => {
      rows = [];
      const all = (snap.val() ?? {}) as Record<string, { owner?: string; ownerName?: string; name?: string; furni?: Record<string, { kind?: string; img?: unknown; by?: string }> }>;
      for (const [room, m] of Object.entries(all)) {
        for (const [id, f] of Object.entries(m.furni ?? {})) {
          if (f.kind === POSTER_KIND && typeof f.img === "string" && f.img) rows.push({ room, id, img: f.img, ownerUid: m.owner ?? "", ownerName: m.ownerName ?? "?", roomName: m.name ?? room, ...(f.by ? { by: f.by } : {}), ts: hungAt(id) });
        }
        if (m.owner && m.ownerName) names.set(m.owner, m.ownerName);
      }
      rows.sort((a, b) => b.ts - a.ts);
      draw();
    }, () => toast("Couldn't read the rooms", "err")),
    onValue(ref(db, "posterMutes"), (snap) => { muted = (snap.val() ?? {}) as Record<string, true>; draw(); }, () => toast("Couldn't read the poster mutes (the new database rules may not be deployed yet)", "err")),
  ];
  return () => offs.forEach((off) => off());
}
