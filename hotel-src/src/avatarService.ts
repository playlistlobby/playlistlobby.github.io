import AvatarImager from "./avatar/AvatarImager";
import AvatarInfo, { Direction } from "./avatar/AvatarInfo";

// Avatar sprite atlases + figure data are hosted by bobba.io (CORS-enabled).
// Swap this for your own mirror (h4bbo archive, etc.) when you have one.
export const AVATAR_RESOURCES_URL = "https://images.bobba.io/gordon/PRODUCTION-202006192205-424220153/";

export const imager = new AvatarImager(AVATAR_RESOURCES_URL);
export const avatarsReady: Promise<void> = imager.initialize();

export interface RenderOpts {
  figure: string;
  dir: number;
  headDir?: number;
  /** e.g. ["std"], ["wlk"], ["wav"], ["wlk","wav"] */
  actions?: string[];
  /** "std" | "spk" | "sml" | "sad" ... */
  gesture?: string;
  frame?: number;
  headOnly?: boolean;
}

const cache = new Map<string, HTMLCanvasElement>();
const pending = new Map<string, Promise<HTMLCanvasElement | null>>();

function keyOf(o: RenderOpts): string {
  return [o.figure, o.dir, o.headDir ?? o.dir, (o.actions ?? ["std"]).join("+"), o.gesture ?? "std", o.frame ?? 0, o.headOnly ? 1 : 0].join("|");
}

/** Forgets every rendered avatar (after a custom design changed, so the next draw uses the new art). */
export function clearAvatarCache(): void {
  cache.clear();
  pending.clear();
}

export function getCached(o: RenderOpts): HTMLCanvasElement | undefined {
  return cache.get(keyOf(o));
}

/** Renders (and caches) one avatar frame. Resolves null if the figure could not be drawn. */
export function renderAvatar(o: RenderOpts): Promise<HTMLCanvasElement | null> {
  const key = keyOf(o);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(key);
  if (inflight) return inflight;

  const p = avatarsReady
    .then(() => {
      const info = new AvatarInfo(
        o.figure,
        (o.dir & 7) as Direction,
        ((o.headDir ?? o.dir) & 7) as Direction,
        o.actions ?? ["std"],
        o.gesture ?? "std",
        o.frame ?? 0,
        !!o.headOnly,
        false,
        "n"
      );
      return imager.generateGeneric(info, false) as Promise<HTMLCanvasElement>;
    })
    .then((canvas) => {
      cache.set(key, canvas);
      return canvas;
    })
    .catch((err) => {
      console.warn("avatar render failed", o.figure, err);
      return null;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}
