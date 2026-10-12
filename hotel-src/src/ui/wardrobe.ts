import { h, toast } from "./dom";
import { renderAvatar } from "../avatarService";
import { deleteOutfit, saveFigure, saveOutfit, WARDROBE_SLOTS } from "../db";
import type { Ctx } from "../main";

export function mountWardrobe(root: HTMLElement, ctx: Ctx): () => void {
  const profile = ctx.profile;
  let disposed = false;

  function drawInto(canvas: HTMLCanvasElement, figure: string): void {
    renderAvatar({ figure, dir: 2, headDir: 2 }).then((img) => {
      if (disposed || !img) return;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
    });
  }

  function avatarCanvas(figure: string): HTMLCanvasElement {
    const c = h("canvas", { class: "wardrobe-canvas", width: 64, height: 110 });
    drawInto(c, figure);
    return c;
  }

  const wrap = h("div", { class: "panel wardrobe" });
  root.append(wrap);

  function redraw(): void {
    const slots = Array.from({ length: WARDROBE_SLOTS }, (_, i) => {
      const outfit = profile.wardrobe[i];
      return h("div", { class: "slot" + (outfit ? "" : " empty") },
        h("div", { class: "slot-title" }, `Slot ${i + 1}`),
        outfit ? avatarCanvas(outfit.figure) : h("div", { class: "slot-empty" }, "empty"),
        h("div", { class: "row center" },
          h("button", {
            class: "btn small",
            onclick: async () => {
              try {
                await saveOutfit(profile, i, { figure: profile.figure, gender: profile.gender });
                toast(`Saved current look to slot ${i + 1}`);
                redraw();
              } catch (err) { toast((err as Error).message, "err"); }
            },
          }, outfit ? "Overwrite" : "Save here"),
          outfit ? h("button", {
            class: "btn small primary",
            onclick: async () => {
              try {
                await saveFigure(profile, outfit.figure, outfit.gender);
                ctx.refreshHeader();
                toast("Outfit on!");
                redraw();
              } catch (err) { toast((err as Error).message, "err"); }
            },
          }, "Wear") : null,
          outfit ? h("button", {
            class: "btn small danger",
            onclick: async () => {
              try { await deleteOutfit(profile, i); redraw(); } catch (err) { toast((err as Error).message, "err"); }
            },
          }, "✕") : null));
    });

    wrap.replaceChildren(
      h("h2", {}, "Wardrobe"),
      h("div", { class: "wardrobe-current" },
        avatarCanvas(profile.figure),
        h("div", {},
          h("strong", {}, "Wearing now"),
          h("p", { class: "muted" }, "Save the look you're wearing into a slot, then swap between outfits any time. New clothes are in the shop."),
          h("button", { class: "btn", onclick: () => ctx.navigate("shop") }, "Open shop"))),
      h("div", { class: "slots" }, ...slots));
  }

  redraw();
  return () => { disposed = true; };
}
