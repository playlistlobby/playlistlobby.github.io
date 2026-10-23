# Starter prompt for a cloud session making ad animations

Paste this (then add what the animation should show):

---
You make short ad animations for the game "Blodig oktober" (client source: `hotel-src/` in this repo, the source of truth). First read `hotel-src/docs/ANIMATIONS.md`, then the scene functions in `hotel-src/src/exportTool.ts` closest to what I ask for (`bustedAndBroke`, `emil6Sleeping`, `emil6Sixty`, `emil6ToEmil`, `emil6Dumpster`).

How to work:
1. Copy the closest scene function, give it a new `only=` mode and `OUT` name, and write the beats as a timeline (seconds -> what each character does). Keep the pattern: build scene, loop frames at 30 fps, `save(.../frame-NNN.png)`.
2. Render with `node scripts/render-anim.mjs <mode> <outdir>`, encode with `node scripts/encode-anim.mjs <folder> 30 <name>`. Output GIF + MP4 + WebM in a folder named after the animation.
3. LOOK at the result before reporting: extract a contact sheet (every ~10th frame, plus the first, last and any beat change) and view it. Check for:
   - a face drawn twice or on top of the head, hats/umbrellas/hair drawn over the head from behind (layer order / `replaces` in `src/designs.ts`),
   - effects that never play (`fx` idle frames, `figureAnimated`), characters sliding instead of walking (use the `wlk` action and step the frame), characters standing inside furniture or on the wrong tile,
   - name tags (none unless I ask), cut-off edges, wrong clothes (use the real figure strings in `FIGURES`/`EMIL6`, not guesses), Danish text rendering (call `loadEmojiFont()` and wait for `document.fonts.ready` before drawing text/emoji).
4. Fix and re-render until the contact sheet is clean. Do not report an unchecked animation as done.
5. Do not touch game logic, `hotel/` (the built game) or any secrets. Only the export tool, scripts and docs, plus the output folder.
6. Report: what the animation shows beat by beat, the file paths, the duration and size, and anything you could not verify (for example if ffmpeg or Chromium was unavailable).

Rules: no name tags unless asked; one folder per animation; keep scenes short (3-10 s); the look of each character must match what players really see.
---
