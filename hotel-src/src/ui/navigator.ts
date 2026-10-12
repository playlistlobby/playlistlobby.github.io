import { h, toast } from "./dom";
import { createRoom, LOBBY_ID, ownRoomId, RoomMeta, watchAllRooms } from "../rooms";
import { social } from "../social";
import type { Ctx } from "../main";

const ACCESS_ICON = { open: "🌐 Open", friends: "👥 Friends", invite: "🔒 Invite only" } as const;

/** Room finder: the public lobby, your own room, your friends' rooms and any open rooms. */
export function mountNavigator(root: HTMLElement, ctx: Ctx): () => void {
  const me = ctx.profile;
  let rooms: Record<string, RoomMeta> = {};
  const wrap = h("div", { class: "panel navigator" });
  root.append(wrap);

  const enter = (id: string) => ctx.navigate("room", { roomId: id });

  function card(id: string, name: string, sub: string, badge: string, extra?: HTMLElement | null): HTMLElement {
    const count = social.roomCounts().get(id) ?? 0;
    return h("div", { class: "room-card" },
      h("div", { class: "rc-main" },
        h("div", { class: "rc-name" }, name),
        h("div", { class: "hint" }, `${sub} · ${badge}`)),
      h("div", { class: "rc-count", title: "Players inside" }, `👤 ${count}`),
      extra ?? null,
      h("button", { class: "btn small primary", onclick: () => enter(id) }, "Enter"));
  }

  function render(): void {
    const mineId = ownRoomId(me.uid);
    const mine = rooms[mineId];
    const friendIds = social.friendUids();
    const counts = social.roomCounts();
    const others = Object.entries(rooms).filter(([id]) => id !== mineId);
    const friendsRooms = others.filter(([, m]) => friendIds.has(m.owner) && m.access !== "invite");
    const open = others
      .filter(([, m]) => m.access === "open" && !friendIds.has(m.owner))
      .sort((a, b) => (counts.get(b[0]) ?? 0) - (counts.get(a[0]) ?? 0));

    wrap.replaceChildren(
      h("h2", {}, "Rooms"),
      h("div", { class: "nav-sec" }, h("div", { class: "fp-label" }, "Public"),
        card(LOBBY_ID, "Main Lobby", "The hotel", "🌐 Open · arcade inside")),

      h("div", { class: "nav-sec" }, h("div", { class: "fp-label" }, "My room"),
        mine
          ? card(mineId, mine.name, `${mine.w}×${mine.h}`, ACCESS_ICON[mine.access], h("span", { class: "hint" }, "Edit it from the 🏠 tab inside"))
          : h("div", { class: "room-card" },
              h("div", { class: "rc-main" }, h("div", { class: "rc-name" }, "You don't have a room yet"), h("div", { class: "hint" }, "Make one, then decorate it and invite friends.")),
              h("button", {
                class: "btn primary",
                onclick: async () => {
                  try {
                    enter(await createRoom(me));
                    toast("Room created! Open the 🏠 tab to decorate it.");
                  } catch {
                    toast("Couldn't create your room.", "err");
                  }
                },
              }, "Create my room"))),

      ...(friendsRooms.length
        ? [h("div", { class: "nav-sec" }, h("div", { class: "fp-label" }, "Friends' rooms"),
            ...friendsRooms.map(([id, m]) => card(id, m.name, `by ${m.ownerName}`, ACCESS_ICON[m.access])))]
        : []),

      h("div", { class: "nav-sec" }, h("div", { class: "fp-label" }, "Open rooms"),
        ...(open.length
          ? open.map(([id, m]) => card(id, m.name, `by ${m.ownerName}`, ACCESS_ICON[m.access]))
          : [h("div", { class: "hint pad" }, "No other open rooms right now.")])));
  }

  const offRooms = watchAllRooms((r) => { rooms = r; render(); });
  const offSocial = social.subscribe(render);
  render();
  return () => {
    offRooms();
    offSocial();
  };
}
