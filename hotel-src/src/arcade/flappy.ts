import { h } from "../ui/dom";
import { assetUrl } from "../assetUrl";
import { sfxMuted } from "../sfx";
import { BLOOD_ICON } from "../items";
import type { ArcadeGame } from "./arcade";

/**
 * Flappy Bird, ported from the Playlist app (the same numbers as the original: a 100 px gap, pipes 144 px apart).
 * Tap, click or press Space / Up to flap. The best score is kept in this browser, and the best score of every player is on the scoreboard (the trophy button).
 * The world is 288 x 512 units and is drawn at the screen's full resolution so the pixel art stays sharp.
 */
const FB = { W: 288, H: 512, GROUND: 400, GAP: 100, SPEED: 2, GRAV: 0.25, FLAP: -4.6, PIPE_W: 52, SPACING: 144, BX: 60 };
const IMAGES = ["background", "base", "pipe", "message", "gameover", "restart", "bird-0", "bird-1", "bird-2", ..."0123456789"];
const SOUNDS = { wing: "sfx_wing", point: "sfx_point", hit: "sfx_hit", die: "sfx_die", swoosh: "sfx_swooshing" } as const;
const BEST_KEY = "6ixplanet-flappy-best";

/** every this many pipes there is a DROP_CHANCE chance that a drop of blood hangs in the next gap */
const DROP_EVERY = 15;
const DROP_CHANCE = 0.5;
interface Pipe { x: number; gap: number; passed: boolean; drop?: boolean }
interface Float { text: string; x: number; y: number; t: number }
interface State { state: "ready" | "play" | "over"; y: number; v: number; t: number; score: number; best: number; groundX: number; pipes: Pipe[]; flash: number; newBest: boolean }

export const flappy: ArcadeGame = {
  id: "flappy",
  title: "Flappy Bird",
  icon: "🐤",
  blurb: "Tap to flap. Don't touch the pipes.",
  mount(host, api) {
    const canvas = h("canvas", { "aria-label": "Flappy Bird. Tap or press space to flap." });
    const stage = h("div", { class: "fb-stage" }, canvas);
    host.append(stage);
    const g = canvas.getContext("2d")!;

    const img: Record<string, HTMLImageElement> = {};
    for (const n of IMAGES) { img[n] = new Image(); img[n].src = assetUrl(`arcade/flappy/${n}.png`); }

    // sounds: Web Audio, so they're instant and can overlap (a phone only allows sound after a tap, which is what starts the game)
    let actx: AudioContext | null = null;
    const bufs: Record<string, AudioBuffer> = {};
    const sfx = (name: keyof typeof SOUNDS, vol = 0.5): void => {
      if (sfxMuted()) return;
      try {
        actx ??= new AudioContext();
        if (actx.state === "suspended") void actx.resume();
        const play = (b: AudioBuffer) => { const s = actx!.createBufferSource(); const gn = actx!.createGain(); gn.gain.value = vol; s.buffer = b; s.connect(gn).connect(actx!.destination); s.start(); };
        if (bufs[name]) return play(bufs[name]);
        void fetch(assetUrl(`arcade/flappy/${SOUNDS[name]}.wav`)).then((r) => r.arrayBuffer()).then((a) => actx!.decodeAudioData(a)).then((b) => { bufs[name] = b; play(b); }).catch(() => undefined);
      } catch { /* no audio: the game still plays */ }
    };

    // ---- the scoreboard: the trophy button opens the best scores of everybody ----
    let boardRows: Array<{ uid: string; name: string; score: number }> = [];
    const boardList = h("div", { class: "fb-board-list" });
    const boardPanel = h("div", { class: "fb-board", hidden: true },
      h("div", { class: "fb-board-head" }, h("strong", {}, "Scoreboard"), h("button", { class: "btn small", type: "button", onclick: (e: Event) => { e.stopPropagation(); boardPanel.hidden = true; } }, "Close")),
      boardList);
    const drawBoard = (): void => {
      const me = api.myUid;
      const top = boardRows.slice(0, 10);
      const rows = top.map((r, i) => h("div", { class: "fb-board-row" + (r.uid === me ? " me" : "") }, h("span", { class: "fb-rank" }, String(i + 1)), h("span", { class: "fb-name" }, r.name), h("span", { class: "fb-score" }, String(r.score))));
      const mine = boardRows.findIndex((r) => r.uid === me);
      if (mine >= 10) rows.push(h("div", { class: "fb-board-row me" }, h("span", { class: "fb-rank" }, String(mine + 1)), h("span", { class: "fb-name" }, boardRows[mine].name), h("span", { class: "fb-score" }, String(boardRows[mine].score))));
      boardList.replaceChildren(...(rows.length ? rows : [h("div", { class: "hint" }, "No scores yet. Be the first!")]));
    };
    const stopBoard = api.watchBoard?.((rows) => { boardRows = rows; drawBoard(); });
    if (api.watchBoard) {
      stage.append(
        h("button", { class: "fb-trophy", type: "button", title: "Scoreboard", onclick: (e: Event) => { e.stopPropagation(); drawBoard(); boardPanel.hidden = !boardPanel.hidden; } }, "🏆"),
        boardPanel);
    }

    const dropImg = new Image();
    dropImg.src = BLOOD_ICON;
    const floats: Float[] = [];
    let caught = 0;

    const bestNow = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
    let fb: State;
    const reset = (): void => { fb = { state: "ready", y: 240, v: 0, t: 0, score: 0, best: bestNow(), groundX: 0, pipes: [], flash: 0, newBest: false }; };
    reset();

    const gapY = () => Math.round(FB.GROUND * 0.2 + Math.random() * (FB.GROUND * 0.6 - FB.GAP));
    function flap(): void {
      if (fb.state === "ready") {
        fb.state = "play";
        api.startRun?.();
        fb.pipes = [];
        for (let x = FB.W + 40; x < FB.W + 40 + FB.SPACING * Math.ceil((FB.W + FB.PIPE_W) / FB.SPACING + 1); x += FB.SPACING) fb.pipes.push({ x, gap: gapY(), passed: false });
      }
      if (fb.state === "play") { if (fb.y > -48) { fb.v = FB.FLAP; sfx("wing", 0.55); } return; }
      if (fb.state === "over" && fb.t > 30) { reset(); sfx("swoosh", 0.5); }
    }

    function over(): void {
      fb.state = "over"; fb.t = 0; fb.flash = 1;
      if (navigator.vibrate) navigator.vibrate(60);
      sfx("hit", 0.7);
      if (fb.y + 12 < FB.GROUND) window.setTimeout(() => sfx("die", 0.6), 300); // hit a pipe: the fall
      if (fb.score > 0) void api.submitScore?.(fb.score).catch(() => undefined); // onto the scoreboard, if it is your best
      if (fb.score > fb.best) {
        fb.best = fb.score; fb.newBest = fb.score > 0;
        try { localStorage.setItem(BEST_KEY, String(fb.best)); } catch { /* private window: just not kept */ }
      }
    }

    function step(dt: number): void {
      fb.t += dt;
      if (fb.state !== "over") fb.groundX = (fb.groundX - FB.SPEED * dt) % 24;
      if (fb.state === "ready") { fb.y = 240 + Math.sin(fb.t / 8) * 5; return; }
      if (fb.state === "over") {
        if (fb.y < FB.GROUND - 12) { fb.v = Math.min(fb.v + FB.GRAV * dt, 10); fb.y += fb.v * dt; }
        fb.flash = Math.max(0, fb.flash - 0.08 * dt);
        return;
      }
      fb.v = Math.min(fb.v + FB.GRAV * dt, 10); fb.y += fb.v * dt;
      const span = FB.SPACING * fb.pipes.length;
      for (const p of fb.pipes) {
        p.x -= FB.SPEED * dt;
        if (p.x + FB.PIPE_W < 0) { p.x += span; p.gap = gapY(); p.passed = false; p.drop = false; }
        if (!p.passed && p.x + FB.PIPE_W / 2 <= FB.BX + 17) {
          p.passed = true; fb.score++; sfx("point", 0.6);
          // every 15th pipe: a one-in-two chance that a drop of blood hangs in the gap of the next pipe
          if (api.collectBlood && fb.score % DROP_EVERY === 0 && Math.random() < DROP_CHANCE) {
            const next = fb.pipes.filter((q) => !q.passed && q.x > p.x).sort((a, b) => a.x - b.x)[0];
            if (next) next.drop = true;
          }
        }
      }
      // pick up a drop: the bird touches it
      for (const p of fb.pipes) {
        if (!p.drop) continue;
        const dx = p.x + FB.PIPE_W / 2 - (FB.BX + 17), dy = p.gap + FB.GAP / 2 - fb.y;
        if ((dx / 26) ** 2 + (dy / 22) ** 2 <= 1) {
          p.drop = false;
          sfx("swoosh", 0.7);
          floats.push({ text: "+1", x: FB.BX + 17, y: fb.y - 20, t: 0 });
          void api.collectBlood?.().then((ok) => { if (ok) caught++; else floats.push({ text: "refused", x: FB.BX + 17, y: fb.y - 40, t: 0 }); });
        }
      }
      for (const f of floats) f.t += dt;
      while (floats.length && floats[0].t > 60) floats.shift();
      // hit a pipe or the ground: the bird is an oval (16 x 11.5 from its middle), pipes reach up past the top of the screen
      const cx = FB.BX + 17, cy = fb.y, rx = 16, ry = 11.5;
      const touches = (x0: number, y0: number, x1: number, y1: number) => {
        const nx = Math.max(x0, Math.min(cx, x1)), ny = Math.max(y0, Math.min(cy, y1));
        return ((cx - nx) / rx) ** 2 + ((cy - ny) / ry) ** 2 <= 1;
      };
      const hit = fb.y + 12 >= FB.GROUND || fb.pipes.some((p) => touches(p.x, -1e4, p.x + FB.PIPE_W, p.gap) || touches(p.x, p.gap + FB.GAP, p.x + FB.PIPE_W, 1e4));
      if (hit) over();
    }

    const digits = (n: number, cx: number, y: number, hh: number): void => {
      const s = String(n);
      const w = [...s].map((c) => (img[c].naturalWidth || 24) * hh / 36);
      const total = w.reduce((a, b) => a + b, 0) + (s.length - 1) * 2;
      let x = cx - total / 2;
      [...s].forEach((c, i) => { g.drawImage(img[c], x, y, w[i], hh); x += w[i] + 2; });
    };

    function panel(x: number, y: number, w: number, hh: number): void {
      const r = 10;
      g.save();
      g.beginPath(); g.roundRect(x, y, w, hh, r); g.fillStyle = "#ded895"; g.fill();
      g.lineWidth = 3; g.strokeStyle = "#543847"; g.stroke();
      g.beginPath(); g.roundRect(x + 5, y + 5, w - 10, hh - 10, r - 4); g.lineWidth = 1.5; g.strokeStyle = "rgba(84,56,71,.25)"; g.stroke();
      g.font = '800 15px "Helvetica Neue",Helvetica,Arial,sans-serif'; g.textAlign = "center"; g.textBaseline = "top";
      const label = (t: string, yy: number) => { g.fillStyle = "#fff"; g.fillText(t, x + w / 2, yy + 1.5); g.fillStyle = "#e86101"; g.fillText(t, x + w / 2, yy); };
      label("SCORE", y + 14); digits(fb.score, x + w / 2, y + 34, 30);
      label("BEST", y + 76); digits(fb.best, x + w / 2, y + 96, 30);
      if (fb.newBest) {
        g.font = '800 11px "Helvetica Neue",Helvetica,Arial,sans-serif';
        const bw = 38, bxx = x + w - bw - 10, byy = y + 78;
        g.beginPath(); g.roundRect(bxx, byy, bw, 16, 8); g.fillStyle = "#ff3b30"; g.fill();
        g.fillStyle = "#fff"; g.fillText("NEW", bxx + bw / 2, byy + 2.5);
      }
      g.restore();
    }

    let k = 1;
    function draw(): void {
      if (!canvas.width) return;
      g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false;
      // sky, city, ground
      const bgw = FB.H * (img.background.naturalWidth || 288) / (img.background.naturalHeight || 512);
      for (let x = 0; x < FB.W; x += bgw - 1) g.drawImage(img.background, x, 0, bgw, FB.H);
      const ph = FB.PIPE_W * (img.pipe.naturalHeight || 793) / (img.pipe.naturalWidth || 138);
      for (const p of fb.pipes) {
        if (fb.state === "ready") break;
        g.save(); g.translate(p.x + FB.PIPE_W / 2, p.gap); g.scale(1, -1); g.drawImage(img.pipe, -FB.PIPE_W / 2, 0, FB.PIPE_W, ph); g.restore(); // the top pipe, upside down
        g.drawImage(img.pipe, p.x, p.gap + FB.GAP, FB.PIPE_W, ph);
        if (p.drop && dropImg.complete) {
          // the drop of blood: bobbing in the middle of the gap with a soft red glow
          const bob = Math.sin(fb.t / 9) * 4, cx = p.x + FB.PIPE_W / 2, cy = p.gap + FB.GAP / 2 + bob;
          const glow = g.createRadialGradient(cx, cy, 2, cx, cy, 24);
          glow.addColorStop(0, "rgba(255,60,60,0.55)"); glow.addColorStop(1, "rgba(255,60,60,0)");
          g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, 24, 0, Math.PI * 2); g.fill();
          g.drawImage(dropImg, cx - 14, cy - 14, 28, 28);
        }
      }
      for (let x = fb.groundX; x < FB.W; x += 335) g.drawImage(img.base, x, FB.GROUND, 336, 112);
      const frame = fb.state === "over" ? 1 : Math.floor(Math.max(0, fb.t) / 6) % 3;
      const ang = fb.state === "play" || fb.state === "over" ? Math.max(-0.4, Math.min(1.4, fb.v / 8)) : 0;
      g.save(); g.translate(FB.BX + 17, fb.y); g.rotate(ang); g.drawImage(img["bird-" + frame], -17, -12, 34, 24); g.restore();
      if (fb.state === "ready") g.drawImage(img.message, (FB.W - 184) / 2, 80, 184, 267);
      if (fb.state === "play") digits(fb.score, FB.W / 2, 40, 40);
      for (const f of floats) {
        g.save();
        g.globalAlpha = Math.max(0, 1 - f.t / 60);
        g.font = '800 22px "Helvetica Neue",Helvetica,Arial,sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
        g.lineWidth = 4; g.strokeStyle = "#000"; g.strokeText(f.text, f.x, f.y - f.t * 0.6);
        g.fillStyle = "#ff4d4d"; g.fillText(f.text, f.x, f.y - f.t * 0.6);
        g.restore();
      }
      if (fb.state === "over") {
        g.drawImage(img.gameover, (FB.W - 192) / 2, 86, 192, 42);
        const pw = 176, phh = 136, px = (FB.W - pw) / 2, py = 142;
        panel(px, py, pw, phh);
        if (fb.t > 30) g.drawImage(img.restart, (FB.W - 130) / 2, py + phh + 14, 130, 45);
        if (fb.flash > 0) { g.fillStyle = `rgba(255,255,255,${fb.flash})`; g.fillRect(0, 0, FB.W, FB.H); }
      }
    }

    // the canvas matches the stage in real pixels; the world is 512 high and 288 wide
    function fit(): void {
      const cw = stage.clientWidth, ch = stage.clientHeight;
      if (!cw || !ch) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      k = canvas.height / FB.H;
    }
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    fit();

    let raf = 0, last = performance.now();
    const loop = (now: number): void => {
      const dt = Math.min(2.5, (now - last) / (1000 / 60)); // 1 = one frame at 60 fps, like the original
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => { e.preventDefault(); flap(); };
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") { e.preventDefault(); flap(); } };
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      stopBoard?.();
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      void actx?.close().catch(() => undefined);
    };
  },
};
