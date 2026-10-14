import { h, toast } from "./dom";
import {
  Access,
  FLOOR_PRESETS,
  FLOOR_TEXTURES,
  FURNI_KINDS,
  MAX_FURNI,
  RoomDef,
  updateRoom,
  WALL_COLORS,
  removeFurni,
  INTERACTIVE_KINDS,
  isFixedLobbyPiece,
  LOBBY_ID,
} from "../rooms";
import { social } from "../social";
import { storeFromRoom } from "../furnishing";
import type { Ctx } from "../main";

export interface RoomHooks {
  getDef(): RoomDef;
  isOwner(): boolean;
  getTool(): string | null;
  setTool(tool: string | null): void;
  getToolDir(): number;
  rotateTool(): void;
  /** called whenever the room definition changes (live edits by the owner) */
  onDefChange(fn: () => void): () => void;
}

const ACCESS_LABEL: Record<Access, string> = { open: "Open to all", knock: "Knock to enter", closed: "Friends only", none: "No one" };
const ACCESS_HELP: Record<Access, string> = {
  open: "Anyone can walk in.",
  knock: "Friends walk in. Everyone else knocks and you let them in from your friends menu.",
  closed: "Only friends can come in. Strangers can't knock.",
  none: "Nobody can come in, not even friends.",
};

/** The "Room" tab: owners edit their room here, everyone else sees who owns it. */
export function mountRoomPanel(container: HTMLElement, ctx: Ctx, hooks: RoomHooks): () => void {
  const invited = new Set<string>();
  const wrap = h("div", { class: "roompanel" });
  container.append(wrap);

  const safe = (p: Promise<unknown>, okMsg?: string) =>
    p.then(() => okMsg && toast(okMsg), () => toast("The hotel refused that change.", "err"));

  const kindChip = (k: (typeof FURNI_KINDS)[string], tool: string | null) =>
    h("button", { class: "chip" + (tool === k.id ? " on" : ""), title: `${k.label} (${k.w}×${k.h})`, onclick: () => { hooks.setTool(tool === k.id ? null : k.id); render(); } }, `${k.icon} ${k.label}`);

  /** Furniture picker: the tools, the pieces to place, and rotate / clear. */
  function furnitureSection(def: RoomDef, tool: string | null, admin: boolean): HTMLElement {
    const kinds = Object.values(FURNI_KINDS).filter((k) => (admin ? k.placeable || !!k.nitro?.startsWith("db:") || INTERACTIVE_KINDS.has(k.id) : k.placeable));
    const picked = tool && tool !== "pickup" ? FURNI_KINDS[tool] : undefined;
    const clearable = def.furni.filter((f) => !isFixedLobbyPiece(f.id));
    return h("div", { class: "rp-sec" },
      h("div", { class: "rp-label" }, `Furniture (${clearable.length}/${MAX_FURNI})`),
      h("div", { class: "rp-chips" },
        ...kinds.map((k) => kindChip(k, tool)),
        h("button", { class: "chip" + (tool === "pickup" ? " on" : ""), onclick: () => { hooks.setTool(tool === "pickup" ? null : "pickup"); render(); } }, "🧹 Pick up")),
      picked?.rotatable ? h("div", { class: "row" }, h("button", { class: "btn small", onclick: () => { hooks.rotateTool(); render(); } }, `⟳ Turn (R) · facing ${hooks.getToolDir()}`)) : null,
      h("div", { class: "hint" }, kinds.length === 0 ? "No furniture is available yet. New pieces will show up here." : tool ? "Click in the room to use the tool. Esc to stop." : "Pick a piece, then click a tile in the room."),
      clearable.length ? h("button", { class: "btn small", onclick: () => {
        if (confirm(admin ? "Remove everything you added to the basement?" : "Put all furniture from this room into your toolbox storage?")) {
          for (const f of clearable) void (admin ? removeFurni(def.id, f.id) : storeFromRoom(ctx.profile, def.id, f)).catch(() => undefined);
        }
      } }, "Clear room") : null);
  }

  function render(): void {
    const def = hooks.getDef();
    if (def.id === LOBBY_ID) {
      // the basement: only the admin gets here, and only the furniture can be changed
      wrap.replaceChildren(
        h("div", { class: "osrs-title" }, "Basement"),
        h("div", { class: "hint" }, "Admin: add furniture uploaded in Admin > Studio > Furniture. The built-in pieces stay."),
        furnitureSection(def, hooks.getTool(), true));
      return;
    }
    if (!hooks.isOwner()) {
      wrap.replaceChildren(
        h("div", { class: "osrs-title" }, "Room"),
        h("div", { class: "inv-foot" },
          h("div", {}, def.name),
          h("div", { class: "hint" }, `Owned by ${def.ownerName ?? "the hotel"}`),
          h("div", { class: "hint" }, ACCESS_LABEL[def.access])));
      return;
    }

    const nameInput = h("input", { type: "text", value: def.name, maxLength: 28, class: "mini-input" });
    const tool = hooks.getTool();

    wrap.replaceChildren(
      h("div", { class: "osrs-title" }, "My room"),

      h("div", { class: "rp-sec" },
        h("div", { class: "rp-label" }, "Name"),
        h("div", { class: "row" }, nameInput,
          h("button", { class: "btn small", onclick: () => {
            const n = nameInput.value.trim();
            if (n.length < 3) return toast("Room names need 3+ characters.", "err");
            void safe(updateRoom(def.id, { name: n }), "Renamed.");
          } }, "Save"))),

      h("div", { class: "rp-sec" },
        h("div", { class: "rp-label" }, "Who can come in"),
        h("div", { class: "rp-chips" }, ...(["open", "knock", "closed", "none"] as Access[]).map((a) =>
          h("button", { class: "chip" + (def.access === a ? " on" : ""), onclick: () => void safe(updateRoom(def.id, { access: a })) }, ACCESS_LABEL[a]))),
        h("div", { class: "hint" }, ACCESS_HELP[def.access])),

      h("div", { class: "rp-sec" },
        h("div", { class: "rp-label" }, "Colours"),
        h("div", { class: "hint" }, "Floor, walls and carpet colours are sold by the landlord in the shop: 2 drops for each, and you see a preview first.")),

      h("div", { class: "rp-sec" },
        h("div", { class: "rp-label" }, "Furniture"),
        h("div", { class: "hint" }, "Arrange your room with the toolbox in it: click the toolbox. Buy furniture in the shop (the yellow door in the basement).")),

      (inviteHost = h("div", {}, inviteSection())));
  }
  let inviteHost: HTMLElement | null = null;

  function inviteSection(): HTMLElement {
    const def = hooks.getDef();
    const friends = [...social.friends.values()].sort((a, b) => Number(social.isOnline(b.uid)) - Number(social.isOnline(a.uid)) || a.name.localeCompare(b.name));
    return h("div", { class: "rp-sec" },
      h("div", { class: "rp-label" }, "Invite friends"),
      friends.length === 0
        ? h("div", { class: "hint" }, "Add friends in the Friends panel first.")
        : h("div", { class: "invite-list" }, ...friends.map((f) =>
            h("div", { class: "invite-row" },
              h("span", { class: "dot " + (social.isOnline(f.uid) ? "on" : "") }),
              h("span", { class: "invite-name" }, f.name),
              h("button", {
                class: "btn small",
                disabled: invited.has(f.uid),
                onclick: () => {
                  invited.add(f.uid);
                  social.inviteToRoom(f.uid, def.id, def.name).then(() => toast(`Invited ${f.name}.`), () => { invited.delete(f.uid); toast("Couldn't send that invite.", "err"); }).finally(render);
                },
              }, invited.has(f.uid) ? "Invited ✓" : "Invite")))));
  }

  render();
  const offDef = hooks.onDefChange(render);
  // presence changes fire constantly; only the invite list depends on them, so don't rebuild the whole panel
  const offSocial = social.subscribe(() => { if (hooks.isOwner() && inviteHost) inviteHost.replaceChildren(inviteSection()); });
  void ctx;
  return () => {
    offDef();
    offSocial();
    wrap.remove();
  };
}
