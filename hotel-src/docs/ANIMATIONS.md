# Making the ad animations (for humans and cloud sessions)

Everything needed is in this repo; nothing depends on the original PC except the output folder the owner wants them in
(locally `F:\1A.6ix\ad-animations\<name>\`; a cloud session just commits/attaches the result or leaves it in the working tree).

## How it works
1. `export.html` + `src/exportTool.ts` render the game's own avatars, clothes, furniture and effects (same `AvatarImager`, designs in
   `public/designs`, furniture in `public/` nitro assets) to a canvas and save PNG frames through `scripts/export-server.mjs` (:8799).
2. Each scene is a function in `src/exportTool.ts`, picked with `?only=<mode>` (see the `only` chain at the bottom of the file):
   `basement` (busted-and-broke LSD + emil6 sleeping), `sixty` (emil6 + 6ixty "Du er broke as fuccc"), `morph` (emil6 -> emil),
   `dig` (emil6 searches the dumpster, "+1" blood), `jet`, `sip`, `blood`, `sell`, `spin`, `weed`, `anim` (stabs), `newsheet`, `room`.
   Characters' looks are the `FIGURES` / `EMIL6` constants at the top of the file (real figure strings, so no database access is needed).
   To make a new animation copy the closest scene function (they follow one pattern: build a scene, loop over frames, `save(.../frame-NNN.png)`)
   and add an `only` branch.
3. `scripts/encode-anim.mjs` turns the frames into GIF, MP4 and transparent WebM with ffmpeg.

## One-command run (headless, works in a cloud sandbox)
```
npm install
npm i --no-save playwright && npx playwright install chromium     # once; not a project dependency
node scripts/render-anim.mjs dig ./anim-out                       # starts export-server + vite, renders, exits
node scripts/encode-anim.mjs ./anim-out/animation-emil6-dumpster 30 emil6-dumpster
```
ffmpeg must be on PATH (or set `FFMPEG=/path/to/ffmpeg`; on the owner's PC it is `C:\ffmpeg\bin\ffmpeg`).
Rendering is slow-ish (hundreds of 3-4x-scaled frames); the page title becomes "export done" / "export error" at the end and the log div has the details.

## Manual run (owner's PC, with a visible browser)
```
node scripts/export-server.mjs "F:\1A.6ix\ad-animations"
npm run dev            # then open http://localhost:5173/export.html?only=dig
```

## House rules
- No name tags on characters unless the owner asks.
- Output GIF + MP4 + WebM per animation, in its own folder named after it.
- Check frames for the known glitches: faces drawn twice, hats/umbrellas over heads from behind, missing effects (`fx`/`replaces` in `src/designs.ts`).
- The `hotel/` folder is the built game; never edit it by hand (`npm run build:pages`).
