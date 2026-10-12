import { h } from "../ui/dom";
import type { ArcadeGame } from "./arcade";

const N = 20; // grid size
const CELL = 18;

/** Classic snake. Arrow keys / WASD. A tiny reference implementation of the ArcadeGame interface. */
export const snake: ArcadeGame = {
  id: "snake",
  title: "Snake",
  icon: "🐍",
  blurb: "Eat, grow, don't bite yourself. Arrow keys or WASD.",
  mount(host) {
    const canvas = h("canvas", { class: "arcade-canvas", width: N * CELL, height: N * CELL });
    const score = h("div", { class: "arcade-score" }, "Score: 0");
    const hint = h("div", { class: "hint" }, "Press any arrow key to start");
    host.append(canvas, score, hint);
    const g = canvas.getContext("2d")!;

    type P = { x: number; y: number };
    let body: P[] = [];
    let dir: P = { x: 1, y: 0 };
    let queued: P | null = null;
    let food: P = { x: 10, y: 10 };
    let points = 0;
    let running = false;
    let dead = false;
    let best = 0;
    let timer = 0;

    function reset(): void {
      body = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
      dir = { x: 1, y: 0 };
      queued = null;
      points = 0;
      dead = false;
      placeFood();
      score.textContent = `Score: 0   Best: ${best}`;
    }
    function placeFood(): void {
      do food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      while (body.some((s) => s.x === food.x && s.y === food.y));
    }
    function step(): void {
      if (queued) { dir = queued; queued = null; }
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || body.some((s) => s.x === head.x && s.y === head.y)) {
        dead = true;
        running = false;
        best = Math.max(best, points);
        score.textContent = `Score: ${points}   Best: ${best}`;
        hint.textContent = "Game over. Press any arrow key to play again.";
        draw();
        return;
      }
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        points++;
        score.textContent = `Score: ${points}   Best: ${best}`;
        placeFood();
      } else body.pop();
      draw();
    }
    function draw(): void {
      g.fillStyle = "#0b1a24";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.fillStyle = "#d32121";
      g.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
      body.forEach((s, i) => {
        g.fillStyle = dead ? "#777" : i === 0 ? "#7be37b" : "#3fae5a";
        g.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });
    }

    const keys: Record<string, P> = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
    };
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault();
      if (!running) {
        if (dead || body.length === 0) reset();
        running = true;
        hint.textContent = "";
        clearInterval(timer);
        timer = window.setInterval(step, 110);
      }
      const cur = queued ?? dir;
      if (d.x !== -cur.x || d.y !== -cur.y) queued = d; // no 180 turns
    };
    window.addEventListener("keydown", onKey);
    reset();
    draw();
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  },
};
