// "You are being watched": the first time a player logs in after the game was closed for a while, they see the security camera's own picture for a few seconds:
// a grainy shot of the basement that pans from the right to the left, where 6ixty stands with the camera next to him, the text "Opfør jer nu ordenligt plz", and then it fades to black
// and the game is there. Shown once per player (change WATCHED_ID to show it again some other day). Tapping it skips it.
import { assetUrl } from "./assetUrl";
import { renderAvatar } from "./avatarService";
import { sixtyLook } from "./npc";

const WATCHED_ID = "2026-10-reopen";
const TEXT = "Opfør jer nu ordenligt plz";

export async function showWatched(uid: string): Promise<void> {
  const key = `6ixplanet.watched.${uid}`;
  try { if (localStorage.getItem(key) === WATCHED_ID) return; localStorage.setItem(key, WATCHED_ID); } catch { /* private mode: it just shows */ }

  const el = (cls: string, tag = "div"): HTMLElement => { const e = document.createElement(tag); e.className = cls; return e; };
  const box = el("watched");
  const scene = el("wf-scene");
  const wall = el("wf-wall"), floor = el("wf-floor"), door = el("wf-door"), stain = el("wf-stain");
  const cam = document.createElement("img");
  cam.className = "wf-cam"; cam.src = assetUrl("ui/seccam.png"); cam.alt = "";
  const sixty = el("wf-sixty");
  scene.append(wall, floor, stain, door, cam, sixty); // (6ixty stands in front of the camera pole, to the right of it)
  const fx = el("wf-fx"), rec = el("wf-rec"), stamp = el("wf-stamp"), cap = el("wf-cap"), text = el("wf-text"), black = el("wf-black");
  rec.textContent = "● REC";
  cap.textContent = "CAM 01 · KÆLDER";
  const tick = (): void => { stamp.textContent = new Date().toLocaleString("da-DK", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
  tick();
  const clock = window.setInterval(tick, 1000);
  box.append(scene, fx, rec, stamp, cap, text, black);
  document.body.append(box);
  const done = (): void => { window.clearInterval(clock); box.classList.add("out"); window.setTimeout(() => box.remove(), 900); };
  box.addEventListener("click", done);

  // 6ixty, as he stands in the basement (his look comes from the database; the default one if it hasn't arrived)
  void renderAvatar({ figure: sixtyLook().figure, dir: 4, headDir: 4 }).then((c) => { if (c) { c.className = "wf-sixty-img"; sixty.append(c); } });

  // the timeline: the shot pans for 5 seconds, the text comes up, then it goes black
  window.setTimeout(() => text.classList.add("on"), 4600);
  window.setTimeout(() => black.classList.add("on"), 7800);
  window.setTimeout(done, 9200);
  text.textContent = TEXT;
}
