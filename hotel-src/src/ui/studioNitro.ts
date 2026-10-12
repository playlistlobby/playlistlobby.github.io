import { h, toast } from "./dom";
import { FigureNitro, FigurePart, Garment, draftFromGarment, publishDraft, readFigureNitro, slotOfLayer } from "../nitroClothing";
import { SLOTS } from "../catalog";
import { saveShopEntry } from "../shopConfig";
import { logAction } from "../logger";
import { BLOOD_ICON } from "../items";
import type { Ctx } from "../main";

const LAYER_NAMES: Record<string, string> = { ch: "Body", ls: "Left sleeve", rs: "Right sleeve", lg: "Legs", sh: "Shoes", hr: "Hair", hrb: "Hair (back)", ha: "Hat", he: "Head item", ea: "Glasses", fa: "Face item", cc: "Jacket", lc: "Jacket L", rc: "Jacket R", cp: "Print", ca: "Chest item", wa: "Belt", hd: "Head" };

/** Upload a clothing .nitro (a figure library), group its parts into garments, and import them as Studio designs. */
export function mountNitroClothing(host: HTMLElement, ctx: Ctx, onDone: () => void): () => void {
  let disposed = false;
  let figs: FigureNitro[] = [];
  /** garment number chosen per part ("file|type:id" -> number); parts with the same slot and number form one garment */
  const group = new Map<string, number>();
  const picked = new Map<string, boolean>();
  const garments = new Map<string, Garment>();

  const status = h("div", { class: "hint" });
  const body = h("div", {});
  const filters = new Map<string, string>(); // per file: text to filter the part table by
  const file = h("input", { type: "file", multiple: true, accept: ".nitro", onchange: () => void load(Array.from(file.files ?? [])) });
  const drop = h("div", { class: "dropzone" }, "Drop one or more clothing .nitro files here, or ", h("label", { class: "link" }, "choose files", file));
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => void load(Array.from((e as DragEvent).dataTransfer?.files ?? [])));

  host.append(h("div", { class: "panel" },
    h("div", { class: "row" }, h("button", { class: "btn small", onclick: onDone }, "‹ Designs"), h("b", {}, "Import clothing from .nitro")),
    h("p", { class: "muted" }, "Upload a figure library such as hh_human_shirt.nitro. It holds the sprite frames of one or more garments. You choose which parts belong together, then each garment becomes a design in your list, which you can repaint, rename or put on sale."),
    drop, status, body));

  const keyOf = (f: FigureNitro, p: FigurePart) => `${f.fileName}|${p.type}:${p.id}`;

  async function load(files: File[]): Promise<void> {
    if (!files.length) return;
    status.textContent = "Reading…";
    const errors: string[] = [];
    for (const f of files) {
      try {
        const fig = await readFigureNitro(f);
        if (disposed) return;
        figs = figs.filter((x) => x.fileName !== fig.fileName).concat(fig);
        for (const p of fig.parts) {
          if (!slotOfLayer(p.type) || group.has(keyOf(fig, p))) continue;
          group.set(keyOf(fig, p), Number(p.id));
          // a big library starts with nothing ticked, so you only import what you want
          picked.set(keyOf(fig, p), fig.parts.length <= 12);
        }
      } catch (err) {
        errors.push((err as Error).message);
      }
    }
    status.replaceChildren(...(errors.length ? [h("div", { class: "form-error" }, errors.join(" "))] : []));
    render();
  }

  /** garments implied by the part table: same file + slot + garment number */
  function computeGarments(): Array<{ id: string; fig: FigureNitro; slot: string; num: number; parts: FigurePart[] }> {
    const out = new Map<string, { id: string; fig: FigureNitro; slot: string; num: number; parts: FigurePart[] }>();
    for (const fig of figs) {
      for (const p of fig.parts) {
        const slot = slotOfLayer(p.type);
        const k = keyOf(fig, p);
        if (!slot || !picked.get(k)) continue;
        const num = group.get(k) ?? Number(p.id);
        const gid = `${fig.fileName}|${slot}|${num}`;
        const e = out.get(gid) ?? { id: gid, fig, slot, num, parts: [] };
        e.parts.push(p);
        out.set(gid, e);
      }
    }
    return [...out.values()].sort((a, b) => a.slot.localeCompare(b.slot) || a.num - b.num);
  }

  function render(): void {
    if (disposed) return;
    if (!figs.length) { body.replaceChildren(); return; }
    const gs = computeGarments();
    const live = new Set(gs.map((g) => g.id));
    for (const id of [...garments.keys()]) if (!live.has(id)) garments.delete(id);

    const tables = figs.map((fig) => {
      const q = (filters.get(fig.fileName) ?? "").toLowerCase();
      const shown = fig.parts.filter((p) => !q || p.id.includes(q) || p.type === q || (LAYER_NAMES[p.type] ?? "").toLowerCase().includes(q));
      const setAll = (on: boolean) => { for (const p of shown) if (slotOfLayer(p.type)) picked.set(keyOf(fig, p), on); render(); };
      const find = h("input", { class: "mini-input", placeholder: "Filter by id or layer (ch, lg, sleeve)…", value: filters.get(fig.fileName) ?? "", style: { maxWidth: "260px" },
        onchange: () => { filters.set(fig.fileName, find.value.trim()); render(); } });
      return h("div", { class: "panel nitro-fig" },
      h("div", { class: "row" }, h("b", {}, fig.fileName), h("span", { class: "hint" }, `${fig.frames.length} frames · ${fig.parts.length} parts`),
        h("button", { class: "btn small", onclick: () => { figs = figs.filter((x) => x !== fig); render(); } }, "Remove")),
      h("div", { class: "admin-bar" }, find,
        h("button", { class: "btn small", onclick: () => setAll(true) }, "Tick shown"), h("button", { class: "btn small", onclick: () => setAll(false) }, "Untick shown")),
      h("div", { class: "scroll-box", style: { maxHeight: "260px" } }, h("table", { class: "atable" },
        h("thead", {}, h("tr", {}, ...["Use", "Layer", "Part id", "Frames", "Garment #"].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...shown.map((p) => {
          const slot = slotOfLayer(p.type);
          const k = keyOf(fig, p);
          if (!slot) return h("tr", {}, h("td", {}), h("td", {}, p.type), h("td", {}, p.id), h("td", { class: "num" }, String(p.frames)), h("td", { class: "hint" }, "body part, skipped"));
          const num = h("input", { type: "number", min: 0, value: String(group.get(k) ?? p.id), style: { width: "72px", padding: "3px 5px" }, onchange: () => { group.set(k, Math.max(0, Math.floor(Number(num.value) || 0))); render(); } });
          return h("tr", {},
            h("td", {}, h("input", { type: "checkbox", checked: !!picked.get(k), onchange: (e: Event) => { picked.set(k, (e.target as HTMLInputElement).checked); render(); } })),
            h("td", {}, `${LAYER_NAMES[p.type] ?? p.type} (${p.type})`), h("td", {}, p.id), h("td", { class: "num" }, String(p.frames)), h("td", {}, num));
        })))));
    });

    const cards = gs.map((gr) => {
      const gm = garments.get(gr.id) ?? { parts: gr.parts, slot: gr.slot, name: `${gr.fig.libName.replace(/^hh_human_/, "").replace(/_/g, " ")} ${gr.num}`, gender: "U" as const, tintable: false, price: 0 };
      gm.parts = gr.parts;
      garments.set(gr.id, gm);
      const types = gr.parts.map((p) => p.type);
      const dup = types.length !== new Set(types).size;
      const name = h("input", { class: "mini-input", value: gm.name, maxLength: 28, oninput: () => { gm.name = name.value; } });
      const slot = h("select", { onchange: () => { gm.slot = slot.value; } }, ...SLOTS.map((s) => h("option", { value: s.id }, s.label)));
      slot.value = gm.slot;
      const gender = h("select", { onchange: () => { gm.gender = gender.value as Garment["gender"]; } }, h("option", { value: "U" }, "Unisex"), h("option", { value: "M" }, "Boys"), h("option", { value: "F" }, "Girls"));
      gender.value = gm.gender;
      const tint = h("input", { type: "checkbox", checked: gm.tintable, onchange: () => { gm.tintable = tint.checked; } });
      const price = h("input", { type: "number", min: 0, max: 999, value: String(gm.price), style: { width: "64px", padding: "4px" }, onchange: () => { gm.price = Math.max(0, Math.min(999, Number(price.value) || 0)); } });
      return h("div", { class: "panel nitro-garment" },
        h("div", { class: "row" }, h("b", {}, `Garment ${gr.num}`), h("span", { class: "hint" }, `${types.join(" + ")} · ${gr.parts.reduce((n, p) => n + p.frames, 0)} frames`)),
        dup ? h("div", { class: "form-error" }, "Two parts use the same layer; only the first of each layer is imported. Give one a different garment number.") : null,
        h("div", { class: "admin-bar" }, name, slot, gender),
        h("div", { class: "row" },
          h("label", { class: "hint" }, tint, " players pick the colour (art is grey/white)"),
          h("label", { class: "hint" }, "Price ", price, h("img", { src: BLOOD_ICON, class: "blood-ico", alt: "" }), " (0 = free for everyone)")));
    });

    body.replaceChildren(
      ...tables,
      ...(gs.length ? [h("h2", {}, `Garments to import (${gs.length})`), ...cards,
        h("div", { class: "row" },
          h("button", { class: "btn primary", onclick: () => void importAll(gs.map((g) => g.id)) }, `Import ${gs.length} garment${gs.length === 1 ? "" : "s"}`),
          h("span", { class: "hint" }, "They go live straight away. Free ones are available to everyone; priced ones go on sale in the shop."))]
        : [h("p", { class: "hint" }, "Tick at least one part to build a garment.")]));
  }

  async function importAll(ids: string[]): Promise<void> {
    const byId = new Map(computeGarments().map((g) => [g.id, g]));
    let done = 0;
    const failures: string[] = [];
    for (const gid of ids) {
      const gr = byId.get(gid);
      const gm = garments.get(gid);
      if (!gr || !gm) continue;
      status.textContent = `Importing ${done + 1}/${ids.length}: ${gm.name}…`;
      try {
        const draft = draftFromGarment(gr.fig, gm);
        const saved = await publishDraft(draft);
        if (gm.price > 0) await saveShopEntry("clothing", `${saved.slot}_${saved.id}`, { on: true, price: gm.price });
        logAction(ctx.profile, "design", `imported ${gm.name} from ${gr.fig.fileName} (${saved.slot}-${saved.id})`);
        done++;
      } catch (err) {
        failures.push(`${gm.name}: ${(err as Error).message}`);
      }
    }
    status.replaceChildren(...(failures.length ? [h("div", { class: "form-error" }, failures.join(" · "))] : []));
    if (done) {
      toast(`Imported ${done} garment${done === 1 ? "" : "s"}.`);
      if (!failures.length) onDone();
    }
  }

  return () => { disposed = true; };
}
