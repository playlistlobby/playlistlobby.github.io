import { h, toast } from "./dom";
import { BOARD_LINK_MAX, BOARD_TEXT_MAX, BOARD_TITLE_MAX, boardSet, watchBoard } from "../discordBoard";
import type { BoardNote } from "../discordBoard";
import type { Ctx } from "../main";

/**
 * The blue notice board in the basement: what the admin wrote (a title, a text and a link, the Discord), live. Everybody reads it and opens the link;
 * the admin has the boxes to change it.
 */
export function openDiscordBoard(host: HTMLElement, ctx: Ctx, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  let closed = false;
  let note: BoardNote = { title: "", text: "", link: "" };
  let editing = false;
  const body = h("div", { class: "nb-body" });
  const el = h("div", { class: "nb-overlay", onclick: (e: Event) => { if (e.target === el) close(); } },
    h("div", { class: "nb-card", role: "dialog", "aria-label": "Notice board" },
      h("div", { class: "nb-head" }, h("div", { class: "nb-title-big" }, "📢 Notice board"), h("button", { class: "nb-x", onclick: () => close() }, "✕")),
      body));
  host.append(el);

  const openLink = (link: string): void => { window.open(link, "_blank", "noopener,noreferrer"); };

  function render(): void {
    if (closed) return;
    if (editing && me.isAdmin) {
      const title = h("input", { class: "nb-input", type: "text", maxLength: BOARD_TITLE_MAX, placeholder: "Title (Discord)", value: note.title }) as HTMLInputElement;
      const text = h("textarea", { class: "nb-input nb-text", maxLength: BOARD_TEXT_MAX, rows: 5, placeholder: "What the board says" }) as HTMLTextAreaElement;
      text.value = note.text;
      const link = h("input", { class: "nb-input", type: "url", maxLength: BOARD_LINK_MAX, placeholder: "https://discord.gg/…", value: note.link, autocapitalize: "none", spellcheck: false }) as HTMLInputElement;
      body.replaceChildren(
        h("label", { class: "nb-label" }, "Title", title),
        h("label", { class: "nb-label" }, "Text", text),
        h("label", { class: "nb-label" }, "Link (https)", link),
        h("div", { class: "nb-row" },
          h("button", { class: "btn small", onclick: () => { editing = false; render(); } }, "Cancel"),
          h("button", { class: "btn small primary", onclick: async () => {
            try { await boardSet(me, { title: title.value, text: text.value, link: link.value }); toast("The board is updated."); editing = false; render(); } catch (err) { toast((err as Error).message || "That didn't work.", "err"); }
          } }, "Save")));
      return;
    }
    const empty = !note.title && !note.text && !note.link;
    body.replaceChildren(
      ...(empty ? [h("div", { class: "nb-empty" }, "Nothing is written on the board yet.")] : [
        ...(note.title ? [h("div", { class: "nb-heading" }, note.title)] : []),
        ...(note.text ? [h("div", { class: "nb-msg" }, note.text)] : []),
        ...(note.link ? [h("button", { class: "nb-link", onclick: () => openLink(note.link) }, "Open the link"), h("div", { class: "nb-url" }, note.link)] : []),
      ]),
      ...(me.isAdmin ? [h("div", { class: "nb-row" }, h("button", { class: "btn small primary", onclick: () => { editing = true; render(); } }, "Edit the board"))] : []));
  }
  const stop = watchBoard((n) => { note = n; if (!editing) render(); });
  render();
  function close(): void { if (closed) return; closed = true; stop(); el.remove(); onClose(); }
  return { close };
}
