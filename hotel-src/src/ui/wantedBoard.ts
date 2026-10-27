import { h } from "./dom";
import { BLOOD_ICON } from "../items";
import { watchHits } from "../hits";
import { bountiesOf } from "../shared/hits";
import type { Hit } from "../shared/hits";

/**
 * The notice board next to the hideouts: who has blood on their head, and how much. Black and white, like a poster nailed to the wall. It is the list of the open hits
 * (hits/<id>), live: a bounty goes off the board the moment somebody collects it.
 */
export function openWantedBoard(host: HTMLElement, onClose: () => void): { close(): void } {
  let closed = false;
  let hits: Hit[] = [];
  const list = h("div", { class: "wb-list" });
  const el = h("div", { class: "wb-overlay", onclick: (e: Event) => { if (e.target === el) close(); } },
    h("div", { class: "wb-card", role: "dialog", "aria-label": "Wanted" },
      h("div", { class: "wb-head" }, h("div", { class: "wb-wanted" }, "WANTED"), h("button", { class: "wb-x", onclick: () => close() }, "✕")),
      h("div", { class: "wb-sub" }, "Dead or alive. Mostly dead. Whoever shoots them with a gun gets the blood."),
      list));
  host.append(el);

  function render(): void {
    if (closed) return;
    const per = [...bountiesOf(hits).entries()].sort((a, b) => b[1].amount - a[1].amount);
    if (!per.length) { list.replaceChildren(h("div", { class: "wb-empty" }, "Nobody is wanted. For now.")); return; }
    list.replaceChildren(...per.map(([uid, b], i) => {
      const theirs = hits.filter((x) => x.target === uid);
      return h("div", { class: "wb-row" },
        h("div", { class: "wb-rank" }, String(i + 1)),
        h("div", { class: "wb-who" }, h("div", { class: "wb-name" }, b.name), h("div", { class: "wb-by" }, theirs.length > 1 ? `${theirs.length} hits out, the biggest first` : `put out by ${theirs[0]?.hideoutName ?? "a hideout"}`)),
        h("div", { class: "wb-amt" }, h("img", { src: BLOOD_ICON, alt: "" }), b.amount.toLocaleString("en-US")));
    }));
  }
  const stop = watchHits((l) => { hits = l; render(); });
  render();
  function close(): void { if (closed) return; closed = true; stop(); el.remove(); onClose(); }
  return { close };
}
