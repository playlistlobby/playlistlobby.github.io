// A room can say "you can't leave me right now" (the street fights): the page navigation asks before it walks you out of the room.
let lock: (() => boolean) | null = null;
export const setLeaveLock = (fn: (() => boolean) | null): void => { lock = fn; };
export const leaveLocked = (): boolean => !!lock?.();
