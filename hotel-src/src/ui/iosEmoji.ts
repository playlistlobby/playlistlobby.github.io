// iPhone-style emoji everywhere. Apple devices already draw them; on every other device (Windows, Android) the emoji in the page are swapped for the Apple pictures,
// and the chat bubbles in the room (drawn on the canvas) draw the same pictures. A picture that can't be loaded falls back to the device's own emoji.

const APPLE = typeof navigator !== "undefined" && (/iP(hone|ad|od)|Macintosh|Mac OS X/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const BASE = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/";

/** one emoji: a flag, a keycap, or a picture character (with its skin colour / variation) joined by zero-width joiners */
const PIC = "(?:\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F)(?:\\p{Emoji_Modifier})?";
const EMOJI_SRC = `\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3|${PIC}(?:\\u200D(?:${PIC}|\\p{Emoji}\\uFE0F?))*\\uFE0F?`;
const EMOJI_G = new RegExp(EMOJI_SRC, "gu");

/** the picture address of an emoji (the file names are the code points in lower case joined by dashes, with the variation selector where the set keeps it) */
export function emojiUrl(emoji: string): string {
  return BASE + Array.from(emoji).map((c) => c.codePointAt(0)!.toString(16)).join("-") + ".png";
}
/** the same address without the variation selectors (some files are saved without them) */
const plainUrl = (emoji: string): string => BASE + Array.from(emoji).map((c) => c.codePointAt(0)!).filter((cp) => cp !== 0xfe0f).map((cp) => cp.toString(16)).join("-") + ".png";

const isEmojiText = (s: string): boolean => { EMOJI_G.lastIndex = 0; return EMOJI_G.test(s); };

// ---- the page ------------------------------------------------------------------------------------------------------------------------------------
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CANVAS", "NOSCRIPT", "OPTION"]);

function pictureFor(emoji: string): HTMLImageElement {
  const img = document.createElement("img");
  img.className = "ios-emoji";
  img.alt = emoji;
  img.draggable = false;
  img.decoding = "async";
  img.src = emojiUrl(emoji);
  let tried = 0;
  img.addEventListener("error", () => {
    if (tried++ === 0 && plainUrl(emoji) !== img.src) { img.src = plainUrl(emoji); return; }
    img.replaceWith(document.createTextNode(emoji)); // (no picture for it: the device's own)
  });
  return img;
}

function swapIn(node: Text): void {
  const text = node.nodeValue ?? "";
  if (!isEmojiText(text)) return;
  const parent = node.parentElement;
  if (!parent || SKIP.has(parent.tagName) || parent.closest(".ios-emoji, [contenteditable='true']")) return;
  const frag = document.createDocumentFragment();
  let last = 0;
  EMOJI_G.lastIndex = 0;
  for (let m = EMOJI_G.exec(text); m; m = EMOJI_G.exec(text)) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    frag.append(pictureFor(m[0]));
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.append(text.slice(last));
  node.replaceWith(frag);
}

function scan(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) { swapIn(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (SKIP.has((root as Element).tagName) || (root as Element).classList.contains("ios-emoji")) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (isEmojiText(n.nodeValue ?? "")) found.push(n as Text);
  found.forEach(swapIn);
}

/** starts swapping the emoji on the page (and in anything that is added later); does nothing on an Apple device */
export function startIosEmoji(): void {
  if (APPLE || typeof document === "undefined") return;
  const queue = new Set<Node>();
  let frame = 0;
  const flush = (): void => { frame = 0; const nodes = [...queue]; queue.clear(); for (const n of nodes) if (n.isConnected) scan(n); };
  const later = (n: Node): void => { queue.add(n); if (!frame) frame = requestAnimationFrame(flush); };
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") { if (m.target.parentElement && !m.target.parentElement.closest(".ios-emoji")) later(m.target); }
      else m.addedNodes.forEach((n) => { if (n.nodeType === Node.TEXT_NODE || n.nodeType === Node.ELEMENT_NODE) later(n); });
    }
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
  later(document.body);
}

// ---- the canvas (chat bubbles in the room) ------------------------------------------------------------------------------------------------------
const pictures = new Map<string, HTMLImageElement | null>();
function canvasPicture(emoji: string): HTMLImageElement | null {
  if (pictures.has(emoji)) { const p = pictures.get(emoji)!; return p && p.complete && p.naturalWidth > 0 ? p : null; }
  pictures.set(emoji, null);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => pictures.set(emoji, img);
  img.onerror = () => { if (!img.dataset.plain) { img.dataset.plain = "1"; img.src = plainUrl(emoji); } };
  img.src = emojiUrl(emoji);
  return null;
}

/** a text split into plain parts and emoji (on an Apple device: one plain part) */
function parts(text: string): Array<{ t: string; emoji: boolean }> {
  if (APPLE || !isEmojiText(text)) return [{ t: text, emoji: false }];
  const out: Array<{ t: string; emoji: boolean }> = [];
  let last = 0;
  EMOJI_G.lastIndex = 0;
  for (let m = EMOJI_G.exec(text); m; m = EMOJI_G.exec(text)) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), emoji: false });
    out.push({ t: m[0], emoji: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), emoji: false });
  return out;
}

/** how wide a text is when its emoji are drawn as pictures (a square as tall as the font); set the font on the context first */
export function measureWithEmoji(g: CanvasRenderingContext2D, text: string, px: number): number {
  let w = 0;
  for (const p of parts(text)) w += p.emoji ? px * 1.15 : g.measureText(p.t).width;
  return w;
}

/** draws a text with its emoji as Apple pictures (the pictures that have not come in yet are drawn with the device's own emoji until they do); returns the width */
export function fillTextWithEmoji(g: CanvasRenderingContext2D, text: string, x: number, y: number, px: number): number {
  const align = g.textAlign;
  const ps = parts(text);
  const total = measureWithEmoji(g, text, px);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  g.textAlign = "left";
  for (const p of ps) {
    if (!p.emoji) { g.fillText(p.t, cx, y); cx += g.measureText(p.t).width; continue; }
    const size = px * 1.15, pic = canvasPicture(p.t);
    if (pic) g.drawImage(pic, cx, g.textBaseline === "top" ? y - px * 0.1 : y - size * 0.82, size, size);
    else g.fillText(p.t, cx, y);
    cx += size;
  }
  g.textAlign = align;
  return total;
}
