import type { TableChat } from "./tableChat";

/**
 * The chat of the room view you are in, for windows that live outside the room (the trade window is mounted for the whole session and covers the chat bar).
 * The room hands its chat over when it opens and takes it back when it closes; whoever holds `roomChat` talks through whichever room is open now.
 */
let current: TableChat | null = null;
let stopCurrent: (() => void) | null = null;
const listeners = new Set<(line: HTMLElement) => void>();

export function setRoomChat(chat: TableChat | null): () => void {
  stopCurrent?.();
  stopCurrent = null;
  current = chat;
  if (chat) stopCurrent = chat.subscribe((line) => listeners.forEach((l) => l(line)));
  return () => { if (current === chat) setRoomChat(null); };
}

export const roomChat: TableChat = {
  send: (text) => (current ? current.send(text) : false),
  recent: () => (current ? current.recent() : []),
  subscribe: (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
};
