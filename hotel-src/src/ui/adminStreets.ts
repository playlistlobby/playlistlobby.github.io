import { get, onValue, ref, set } from "firebase/database";
import { db } from "../firebase";
import { call, serverNow } from "../db";
import { h, toast } from "./dom";
import { elevatorRuns, fmtWhen } from "../shared/streets";
import type { Ctx } from "../main";

/**
 * Admin > Streets: (1) the test switch that runs the elevator right now, (2) the layout builder: paint the tiles of the next room (rooms, hallways, doors),
 * save it under config/roomLayouts and copy it out as text for the room definition.
 */
export function mountAdminStreets(el: HTMLElement, ctx: Ctx): () => void {
  const stops: Array<() => void> = [];
  let force = 0;
  const status = h("div", { class: "hint" });
  const showStatus = (): void => {
    const now = serverNow();
    const r = elevatorRuns(now, force);
    status.textContent = force > now ? `Test switch is ON: the elevator runs for ${fmtWhen(force - now)} more.` : r.open ? `The elevator is running by the clock (stops in ${fmtWhen(r.endsAt - now)}).` : `The elevator is off. By the clock it runs from 20 to 21 (next in ${fmtWhen(r.nextAt - now)}).`;
  };
  stops.push(onValue(ref(db, "config/streetsForce"), (s) => { force = Number(s.val()) || 0; showStatus(); }, () => undefined));
  const timer = window.setInterval(showStatus, 15_000);
  const test = (minutes: number) => () => void call(ctx.profile, "streetsTest", { minutes }).then(() => toast(minutes ? `The elevator runs for ${minutes} minutes.` : "The test switch is off."), (err) => toast((err as Error).message || "That didn't work.", "err"));

  // ---- the builder ----
  const MAXW = 40, MAXH = 40;
  type Brush = "floor" | "void" | "door" | "elevator";
  let w = 12, hh = 12;
  let grid: string[][] = [];
  let brush: Brush = "floor";
  let width = 1;
  let rectFrom: { x: number; y: number } | null = null;
  let tool: "paint" | "rect" | "hall" = "paint";
  const resize = (nw: number, nh: number): void => {
    w = Math.max(3, Math.min(MAXW, nw)); hh = Math.max(3, Math.min(MAXH, nh));
    const old = grid;
    grid = Array.from({ length: hh }, (_, y) => Array.from({ length: w }, (_, x) => old[y]?.[x] ?? "."));
  };
  resize(12, 12);
  const CH: Record<Brush, string> = { floor: ".", void: "#", door: "D", elevator: "E" };
  const COLOR: Record<string, string> = { ".": "#7c8aa5", "#": "#12141c", D: "#d4a017", E: "#c0392b" };

  const canvasHost = h("div", { class: "as-grid" });
  const out = h("textarea", { class: "as-out", rows: 8, readonly: true }) as HTMLTextAreaElement;
  const nameIn = h("input", { type: "text", class: "mini-input", value: "next-room", maxLength: 24 }) as HTMLInputElement;
  const wIn = h("input", { type: "number", class: "mini-input as-num", value: String(w), min: 3, max: MAXW }) as HTMLInputElement;
  const hIn = h("input", { type: "number", class: "mini-input as-num", value: String(hh), min: 3, max: MAXH }) as HTMLInputElement;
  const widthIn = h("input", { type: "number", class: "mini-input as-num", value: "2", min: 1, max: 6 }) as HTMLInputElement;
  const toolRow = h("div", { class: "rp-chips" });
  const brushRow = h("div", { class: "rp-chips" });

  const paintCell = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= w || y >= hh) return;
    if ((brush === "door" || brush === "elevator")) for (const r of grid) for (let i = 0; i < w; i++) if (r[i] === CH[brush]) r[i] = "."; // (only one door and one elevator)
    grid[y][x] = CH[brush];
  };
  const fillRect = (a: { x: number; y: number }, b: { x: number; y: number }): void => {
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) paintCell(x, y);
  };
  /** a straight hallway from a to b, `width` tiles wide (it goes along x or y, whichever is longer) */
  const hallway = (a: { x: number; y: number }, b: { x: number; y: number }): void => {
    const n = Math.max(1, Math.min(6, Number(widthIn.value) || 2));
    if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) fillRect({ x: a.x, y: a.y }, { x: b.x, y: a.y + n - 1 });
    else fillRect({ x: a.x, y: a.y }, { x: a.x + n - 1, y: b.y });
  };

  function text(): string {
    return [
      `// ${nameIn.value}: ${w} wide (x, down-right) by ${hh} tall (y, down-left). # = no floor, . = floor, D = door, E = elevator`,
      ...grid.map((r) => r.join("")),
    ].join("\n");
  }
  function draw(): void {
    const cell = Math.max(10, Math.min(22, Math.floor(560 / w)));
    const cv = h("div", { class: "as-board", style: `grid-template-columns: repeat(${w}, ${cell}px); grid-auto-rows: ${cell}px;` });
    let down = false;
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const c = h("div", { class: "as-cell", style: `background:${COLOR[grid[y][x]]}`, title: `${x}, ${y}` });
      c.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        down = true;
        if (tool === "paint") { paintCell(x, y); draw(); return; }
        if (!rectFrom) { rectFrom = { x, y }; c.style.outline = "2px solid #fff"; return; }
        if (tool === "rect") fillRect(rectFrom, { x, y }); else hallway(rectFrom, { x, y });
        rectFrom = null; draw();
      });
      c.addEventListener("pointerenter", () => { if (down && tool === "paint") { paintCell(x, y); c.style.background = COLOR[grid[y][x]]; } });
      cv.append(c);
    }
    window.addEventListener("pointerup", () => { down = false; }, { once: true });
    canvasHost.replaceChildren(cv);
    out.value = text();
  }
  const chip = (label: string, on: boolean, fn: () => void) => h("button", { class: "chip" + (on ? " on" : ""), onclick: fn }, label);
  function drawControls(): void {
    toolRow.replaceChildren(
      chip("Paint", tool === "paint", () => { tool = "paint"; rectFrom = null; drawControls(); }),
      chip("Rectangle (two clicks)", tool === "rect", () => { tool = "rect"; rectFrom = null; drawControls(); }),
      chip("Hallway (two clicks)", tool === "hall", () => { tool = "hall"; rectFrom = null; drawControls(); }));
    brushRow.replaceChildren(
      chip("Floor", brush === "floor", () => { brush = "floor"; drawControls(); }),
      chip("Erase", brush === "void", () => { brush = "void"; drawControls(); }),
      chip("Door", brush === "door", () => { brush = "door"; drawControls(); }),
      chip("Elevator", brush === "elevator", () => { brush = "elevator"; drawControls(); }));
  }
  const layoutRef = (): ReturnType<typeof ref> => ref(db, `config/roomLayouts/${nameIn.value.trim().replace(/[^a-z0-9_-]/gi, "-").toLowerCase() || "room"}`);
  const save = (): void => {
    void set(layoutRef(), { name: nameIn.value.trim(), w, h: hh, rows: grid.map((r) => r.join("")), at: serverNow() }).then(() => toast("Layout saved."), () => toast("Couldn't save the layout.", "err"));
  };
  const load = (): void => {
    void get(layoutRef()).then((s) => {
      const v = s.val() as { w: number; h: number; rows: string[] } | null;
      if (!v) return toast("No layout with that name.", "err");
      w = v.w; hh = v.h; grid = v.rows.map((r) => r.split(""));
      wIn.value = String(w); hIn.value = String(hh);
      draw();
    }, () => toast("Couldn't load the layout.", "err"));
  };

  drawControls();
  draw();
  el.replaceChildren(
    h("div", { class: "osrs-title" }, "The streets: test switch"),
    status,
    h("div", { class: "rp-chips" },
      h("button", { class: "btn small primary", onclick: test(60) }, "Run the elevator for 60 min"),
      h("button", { class: "btn small", onclick: test(5) }, "5 min"),
      h("button", { class: "btn small", onclick: test(0) }, "Stop the test")),
    h("div", { class: "hint" }, "While the switch is on, anybody with an elevator ticket can ride. Admins ride without a ticket."),
    h("div", { class: "osrs-title", style: "margin-top:14px" }, "Room layout builder"),
    h("div", { class: "hint" }, "Pick a tool and a brush, then click the grid. Hallway: click the start, then the end, and it fills a straight corridor of the width you set. Save keeps it in the database; the text below can be pasted into a room definition."),
    toolRow, brushRow,
    h("div", { class: "row" }, h("span", {}, "Width"), wIn, h("span", {}, "Height"), hIn,
      h("button", { class: "btn small", onclick: () => { resize(Number(wIn.value) || w, Number(hIn.value) || hh); wIn.value = String(w); hIn.value = String(hh); draw(); } }, "Resize"),
      h("span", {}, "Hall width"), widthIn),
    canvasHost,
    h("div", { class: "row" }, nameIn,
      h("button", { class: "btn small primary", onclick: save }, "Save"),
      h("button", { class: "btn small", onclick: load }, "Load"),
      h("button", { class: "btn small", onclick: () => { grid = grid.map((r) => r.map(() => ".")); draw(); } }, "Clear")),
    out);
  return () => { stops.forEach((s) => s()); window.clearInterval(timer); };
}
