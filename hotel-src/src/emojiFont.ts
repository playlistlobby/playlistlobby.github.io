import { assetUrl } from "./assetUrl";

/** The emoji and what joins them: never letters or digits, so the emoji font can't take over the text. */
const EMOJI_RANGE = "U+00A9, U+00AE, U+203C, U+2049, U+2122, U+2139, U+2194-21AA, U+231A-23FF, U+24C2, U+25AA-25FE, U+2600-27BF, U+2934-2935, U+2B05-2B55, U+3030, U+303D, U+3297, U+3299, U+200D, U+20E3, U+FE0F, U+1F000-1FAFF";

/**
 * Makes every emoji in the game (page text and the canvas) Apple's: "Apple Color Emoji" is the device's own font when it has one (iPhone, Mac),
 * otherwise the small file public/fonts/AppleColorEmoji.ttf (made by scripts/make-emoji-font.mjs). Without the file nothing changes: the device's usual emoji show.
 */
export function loadEmojiFont(): void {
  try {
    const face = new FontFace("Apple Color Emoji", `local("Apple Color Emoji"), url(${assetUrl("fonts/AppleColorEmoji.ttf")}) format("truetype")`, { unicodeRange: EMOJI_RANGE, display: "swap" });
    document.fonts.add(face);
    void face.load().catch(() => undefined);
  } catch { /* an old browser: the usual emoji */ }
}
