// Turns an animation's frames folder into GIF + MP4 + WebM (transparent WebM too):
//   node scripts/encode-anim.mjs <animation-folder> [fps=30] [name]      (the folder holds frames/frame-000.png ...)
// ffmpeg: on PATH, or set FFMPEG=C:\ffmpeg\bin\ffmpeg
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const dir = path.resolve(process.argv[2] ?? ".");
const fps = process.argv[3] ?? "30";
const name = process.argv[4] ?? path.basename(dir).replace(/^animation-/, "");
const ff = process.env.FFMPEG || "ffmpeg";
if (!fs.existsSync(path.join(dir, "frames"))) { console.error("no frames/ folder in", dir); process.exit(1); }
const input = ["-y", "-v", "error", "-framerate", fps, "-i", path.join(dir, "frames", "frame-%03d.png")];
const go = (args) => execFileSync(ff, [...input, ...args], { stdio: "inherit" });
const out = (ext) => path.join(dir, `${name}.${ext}`);
// GIF: one palette for the whole clip, transparency kept
go(["-vf", "split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:alpha_threshold=128", "-loop", "0", out("gif")]);
// MP4 (flattened on the dark game colour, even dimensions)
go(["-vf", "format=rgba,pad=ceil(iw/2)*2:ceil(ih/2)*2:color=0x1a1a24,format=yuv420p", "-c:v", "libx264", "-crf", "14", "-movflags", "+faststart", out("mp4")]);
// WebM with alpha
go(["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", out("webm")]);
console.log("wrote", out("gif"), out("mp4"), out("webm"));
