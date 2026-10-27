import { h } from "./dom";

/**
 * The chat inside the poker and blackjack windows (they cover the whole screen, so the room's own chat bar is out of sight while you play): the last few lines of the room's chat,
 * a box to write in and a Send button. The room view does the real work (the spam limit, the muted message, the commands); this only hands it the text and shows the lines it hears.
 */
export interface TableChat {
  /** says it in the room; false means it was not sent (cooling down after too many lines), so the text should stay in the box */
  send(text: string): boolean;
  /** the lines in the room's chat right now (copies) */
  recent(): HTMLElement[];
  /** called with a copy of every new line; returns the stop function */
  subscribe(cb: (line: HTMLElement) => void): () => void;
}
export interface TableChatApi { el: HTMLElement; dispose(): void }

const SHOWN = 4;
/** a line stays on the table this long (ms) before it fades out of the strip */
const LINE_MS = 30_000;

export function mountTableChat(chat: TableChat, maxChars = 120): TableChatApi {
  const log = h("div", { class: "tc-log" });
  const input = h("input", { class: "tc-input", type: "text", maxLength: maxChars, placeholder: "Say something…", autocomplete: "off", enterkeyhint: "send" }) as HTMLInputElement;
  const sendBtn = h("button", { class: "pk-btn tc-send", type: "submit" }, "Send");
  const form = h("form", { class: "tc-bar", onsubmit: (e: Event) => { e.preventDefault(); submit(); } }, input, sendBtn);
  const el = h("div", { class: "tc-box" }, log, form);
  const born = new Map<HTMLElement, number>();

  const add = (line: HTMLElement): void => {
    log.append(line);
    born.set(line, Date.now());
    while (log.children.length > SHOWN) { born.delete(log.firstElementChild as HTMLElement); log.firstElementChild?.remove(); }
    el.classList.add("talk");
  };
  for (const l of chat.recent().slice(-SHOWN)) { log.append(l); born.set(l, Date.now()); }
  const stop = chat.subscribe(add);
  // lines older than half a minute leave the strip, so it gives the felt back when nobody is talking
  const sweep = window.setInterval(() => {
    const now = Date.now();
    for (const [l, t] of born) if (now - t > LINE_MS) { l.remove(); born.delete(l); }
    el.classList.toggle("talk", log.children.length > 0);
  }, 2000);
  el.classList.toggle("talk", log.children.length > 0);

  function submit(): void {
    const text = input.value.trim();
    if (!text) return;
    if (chat.send(text)) input.value = "";
    input.focus({ preventScroll: true }); // (the keyboard stays up on a phone, so you can go on writing)
  }
  // keys in the box are for the box (the table has no shortcuts, but the room does)
  input.addEventListener("keydown", (e) => e.stopPropagation());
  return { el, dispose() { stop(); window.clearInterval(sweep); } };
}
