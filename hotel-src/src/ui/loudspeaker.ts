import { h, toast } from "./dom";
import { call } from "../db";
import { LOUDSPEAKER_MAX_LEN } from "../shared/loudspeaker";
import { logAction } from "../logger";
import { playSfx } from "../sfx";
import type { Ctx } from "../main";

/** The loudspeaker window: type a message, and it shows on everybody's screen for 10 seconds. (The server keeps it to once every 6 hours.) */
export function openLoudspeaker(host: HTMLElement, ctx: Ctx, onClose: () => void): { close(): void } {
  const me = ctx.profile;
  const input = h("input", { class: "mini-input", type: "text", maxlength: String(LOUDSPEAKER_MAX_LEN), placeholder: "Your message to everybody", "aria-label": "Message" }) as HTMLInputElement;
  const el = h("div", { class: "cd-popup", role: "dialog", "aria-label": "Loudspeaker" },
    h("div", { class: "cd-head" }, h("strong", {}, "📢 Loudspeaker"), h("button", { class: "btn small", onclick: () => close() }, "✕")),
    h("div", { class: "hint" }, "Everybody sees it for 10 seconds. You can only use it once every 6 hours, so make it count."),
    input,
    h("button", {
      class: "btn primary",
      onclick: async () => {
        const text = input.value.trim();
        if (!text) return toast("Write something first.", "err");
        try {
          await call(me, "loudspeaker", { text });
          logAction(me, "room", `used the loudspeaker: ${text}`);
          playSfx("select", 0.5);
          toast("Sent to everybody.");
          close();
        } catch (err) { toast((err as Error).message, "err"); }
      },
    }, "Broadcast"));
  host.append(el);
  let closed = false;
  function close(): void { if (closed) return; closed = true; el.remove(); onClose(); }
  window.setTimeout(() => input.focus(), 50);
  return { close };
}
