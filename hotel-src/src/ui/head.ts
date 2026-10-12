import { h, trimCanvas } from "./dom";
import { renderAvatar } from "../avatarService";
import { fetchProfile } from "../social";

/** A little head-and-shoulders portrait box for a figure string (friends list, room lists). */
export function headBox(figure: string): HTMLElement {
  const box = h("div", { class: "head" });
  if (figure) {
    renderAvatar({ figure, dir: 2, headDir: 2, headOnly: true }).then((c) => {
      if (!c || !box.isConnected) return;
      const t = trimCanvas(c);
      t.className = "head-canvas";
      box.replaceChildren(t);
    });
  }
  return box;
}

/** Same, for a player we only know by uid: fetches their public profile first. */
export function headBoxFor(uid: string): HTMLElement {
  const box = h("div", { class: "head" });
  void fetchProfile(uid).then((p) => {
    if (!p || !box.isConnected) return;
    box.replaceWith(headBox(p.figure));
  });
  return box;
}
