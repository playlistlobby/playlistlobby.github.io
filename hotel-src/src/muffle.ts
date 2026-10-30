// "The music is playing in another room": a low-pass filter on the CD player's audio (eased in and out), and a fade-out for when the music has to end.
// The audio element is routed through the browser's audio graph the first time it is muffled; if the browser won't run the graph (no tap on the page yet) the music is just made quieter instead.
let ctx: AudioContext | null = null;
const filters = new Map<HTMLAudioElement, BiquadFilterNode>();
const plain = new Map<HTMLAudioElement, number>(); // elements that could not be routed: their normal volume
let wanted = false;
/** how closed the filter is when it is on (Hz), and how loud the music is left */
const CLOSED_HZ = 520, OPEN_HZ = 20_000;

function graph(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx.state === "closed" ? null : ctx;
  } catch { return null; }
}

/** sets the effect on or off for this audio element (and every one muffled before), over `ms` */
export function setMuffle(el: HTMLAudioElement, on: boolean, ms = 1500): void {
  wanted = on;
  let f = filters.get(el);
  const a = graph();
  if (!f && a && a.state === "running") {
    try {
      const src = a.createMediaElementSource(el);
      f = a.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = on ? OPEN_HZ : OPEN_HZ;
      f.Q.value = 0.7;
      src.connect(f).connect(a.destination);
      filters.set(el, f);
    } catch { f = undefined; }
  }
  if (f && a) {
    const t = a.currentTime;
    f.frequency.cancelScheduledValues(t);
    f.frequency.setValueAtTime(f.frequency.value, t);
    f.frequency.exponentialRampToValueAtTime(on ? CLOSED_HZ : OPEN_HZ, t + ms / 1000);
    return;
  }
  // no audio graph: just quieter (and back)
  if (on) { if (!plain.has(el)) plain.set(el, el.volume); el.volume = Math.min(el.volume, 0.12); }
  else if (plain.has(el)) { el.volume = plain.get(el)!; plain.delete(el); }
}
export const isMuffled = (): boolean => wanted;

/** the music fades to nothing over `ms` and stops (the CD player starts again by itself when its state changes) */
export function fadeOut(el: HTMLAudioElement, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const from = el.volume, t0 = performance.now();
    const step = (): void => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      try { el.volume = Math.max(0, from * (1 - k)); } catch { /* some phones can't set the volume */ }
      if (k >= 1) { el.pause(); resolve(); } else window.setTimeout(step, 60);
    };
    step();
  });
}
