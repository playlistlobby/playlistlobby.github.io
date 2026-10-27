import { h } from "./dom";
import { BLOOD_ICON } from "../items";
import { watchHits } from "../hits";
import { bountiesOf, liveHits } from "../shared/hits";
import type { Hit } from "../shared/hits";
import { serverNow } from "../db";
import { social } from "../social";
import { watchAllRooms } from "../rooms";
import type { RoomMeta } from "../rooms";

/**
 * The notice board next to the hideouts: who has blood on their head, and how much. Black and white, like a poster nailed to the wall. It is the list of the open hits
 * (hits/<id>), live: a bounty goes off the board the moment somebody collects it. Bagmand's own hits (he puts 2 to 5 out in every visit) are marked, say how long they last
 * and show where the target is standing right now.
 */
export function openWantedBoard(host: HTMLElement, onClose: () => void): { close(): void } {
  let closed = false;
  let hits: Hit[] = [];
  let rooms: Record<string, RoomMeta> = {};
  const list = h("div", { class: "wb-list" });
  const el = h("div", { class: "wb-overlay", onclick: (e: Event) => { if (e.target === el) close(); } },
    h("div", { class: "wb-card", role: "dialog", "aria-label": "Wanted" },
      h("div", { class: "wb-head" }, h("div", { class: "wb-wanted" }, "WANTED"), h("button", { class: "wb-x", onclick: () => close() }, "✕")),
      h("div", { class: "wb-sub" }, "Dead or alive. Mostly dead. Whoever shoots them with a gun gets the blood."),
      list));
  host.append(el);

  /** where somebody is standing, in words */
  function whereIs(uid: string): string {
    const p = social.presence.get(uid);
    if (!p || !social.isOnline(uid)) return "somewhere out of sight";
    const room = p.room;
    if (!room) return "browsing the menus";
    if (room === "lobby") return "the basement";
    if (room === "shop") return "the shop";
    if (room.startsWith("tut_")) return "the introduction";
    const meta = rooms[room];
    const hname = meta?.name ?? "?", oname = meta?.ownerName ?? "?";
    if (room.startsWith("h_")) return meta ? `the hideout "${hname}"` : "a hideout";
    if (room.startsWith("u_")) return meta ? `${oname}'s room` : "somebody's room";
    return "a room";
  }
  const left = (until: number): string => { const m = Math.max(1, Math.ceil((until - serverNow()) / 60000)); return m >= 60 ? "1 h" : `${m} min`; };

  function render(): void {
    if (closed) return;
    const live = liveHits(hits, serverNow());
    const per = [...bountiesOf(live).entries()].sort((a, b) => b[1].amount - a[1].amount);
    if (!per.length) { list.replaceChildren(h("div", { class: "wb-empty" }, "Nobody is wanted. For now.")); return; }
    list.replaceChildren(...per.map(([uid, b], i) => {
      const theirs = live.filter((x) => x.target === uid);
      const bag = theirs.find((x) => x.bagmand);
      const rest = bag ? left(bag.until ?? 0) : "", spot = bag ? whereIs(uid) : "";
      return h("div", { class: "wb-row" + (bag ? " wb-bag" : "") },
        h("div", { class: "wb-rank" }, String(i + 1)),
        h("div", { class: "wb-who" }, h("div", { class: "wb-name" }, b.name),
          h("div", { class: "wb-by" }, bag ? `🕴 Bagmand's hit · ${rest} left` : theirs.length > 1 ? `${theirs.length} hits out, the biggest first` : `put out by ${theirs[0]?.hideoutName ?? "a hideout"}`),
          ...(bag ? [h("div", { class: "wb-where" }, `📍 Last seen in ${spot}`)] : [])),
        h("div", { class: "wb-amt" }, h("img", { src: BLOOD_ICON, alt: "" }), b.amount.toLocaleString("en-US")));
    }));
  }
  const stop = watchHits((l) => { hits = l; render(); });
  const stopRooms = watchAllRooms((r) => { rooms = r; render(); });
  const offSocial = social.subscribe(() => render()); // (where somebody stands changes all the time)
  const tick = window.setInterval(render, 5000);
  render();
  function close(): void { if (closed) return; closed = true; stop(); stopRooms(); offSocial(); window.clearInterval(tick); el.remove(); onClose(); }
  return { close };
}
