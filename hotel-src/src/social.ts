import {
  get,
  limitToLast,
  onChildAdded,
  onDisconnect,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  Unsubscribe,
} from "firebase/database";
import { db } from "./firebase";
import { serverNow } from "./db";
import type { Profile } from "./db";
import { ownRoomId } from "./rooms";
import { SIXTY, sixtyLook } from "./npc";

export interface PublicProfile {
  uid: string;
  name: string;
  figure: string;
}
export interface Presence {
  name: string;
  /** room id the player is standing in, "" when browsing menus */
  room: string;
  /** hasn't touched anything for a while (see idle.ts) */
  idle?: boolean;
  /** last heartbeat (server time, ms); a session that stops sending them (a sleeping phone, a dead tab) counts as gone */
  seen?: number;
  since?: number;
}

/** No heartbeat for this long = the session is dead, whatever the database still says. */
export const STALE_MS = 6 * 60_000;
const HEARTBEAT_MS = 60_000;
let beat: number | undefined;
export interface DmMsg {
  id: string;
  from: string;
  text: string;
  ts: number;
}
export interface Invite {
  id: string;
  room: string;
  roomName: string;
  from: string;
  fromName: string;
  ts: number;
}
/** Someone asking you to trade (it waits in the friends badge until you answer; it disappears if they leave). */
export interface TradeInvite {
  uid: string;
  name: string;
  ts: number;
}

/** Someone knocking on your room's door (shown in the friends menu until you let them in or send them away). */
export interface Knock {
  uid: string;
  name: string;
  ts: number;
}

// ---- public directory ---------------------------------------------------------------
const profileCache = new Map<string, PublicProfile>();

export async function fetchProfile(uid: string): Promise<PublicProfile | null> {
  const hit = profileCache.get(uid);
  if (hit) return hit;
  const snap = await get(ref(db, `profiles/${uid}`));
  if (!snap.exists()) return null;
  const p = { uid, name: snap.val().name as string, figure: snap.val().figure as string };
  profileCache.set(uid, p);
  return p;
}

/** Publishes name + look (readable by other players) and claims the username lookup entry. Idempotent. */
export async function publishProfile(p: Profile): Promise<void> {
  profileCache.delete(p.uid);
  // the admin account is 6ixty: that is the name and look everybody else sees (friends list, sleeping in their room, ...)
  await set(ref(db, `profiles/${p.uid}`), p.isAdmin ? { name: SIXTY.name, figure: sixtyLook().figure } : { name: p.name, figure: p.figure });
  const claim = ref(db, `usernames/${p.name.toLowerCase()}`);
  const existing = await get(claim);
  if (!existing.exists()) await set(claim, p.uid).catch(() => undefined);
}

// ---- presence -----------------------------------------------------------------------
/** A random id for this page load. The account's presence carries the id of the window that is signed in: one window per account. */
export const SESSION_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);
/** another window's seat counts as taken while its heartbeat is newer than this */
const SEAT_STALE_MS = 3 * 60_000;

/** Is this account already open in another live window (or device)? A page that is just being reloaded lets go of its seat a moment later, so a taken seat is checked twice. */
export async function otherWindowOpen(uid: string): Promise<boolean> {
  const taken = async (): Promise<boolean> => {
    const v = (await get(ref(db, `presence/${uid}`))).val() as { sid?: unknown; seen?: unknown } | null;
    return !!v && typeof v.sid === "string" && v.sid !== SESSION_ID && typeof v.seen === "number" && serverNow() - v.seen < SEAT_STALE_MS;
  };
  if (!(await taken())) return false;
  await new Promise((r) => window.setTimeout(r, 2500));
  return taken();
}

/** Calls `onTaken` if another window takes this account's seat (two windows opening at the very same moment). */
export function watchSession(uid: string, onTaken: () => void): Unsubscribe {
  return onValue(ref(db, `presence/${uid}/sid`), (snap) => {
    const v = snap.val();
    if (typeof v === "string" && v !== SESSION_ID) onTaken();
  });
}

/** This window gave up its seat without leaving: stop the heartbeat and the clean-up that would wipe the other window's presence. */
export function releasePresence(uid: string): void {
  window.clearInterval(beat);
  void onDisconnect(ref(db, `presence/${uid}`)).cancel();
}

export function startPresence(p: Profile, room = ""): void {
  const r = ref(db, `presence/${p.uid}`);
  void onDisconnect(r).remove();
  void set(r, { name: p.name, room, since: serverTimestamp(), seen: serverTimestamp(), sid: SESSION_ID });
  window.clearInterval(beat);
  beat = window.setInterval(() => { void update(r, { seen: serverTimestamp() }).catch(() => undefined); }, HEARTBEAT_MS);
}
export function setPresenceRoom(p: Profile, room: string): void {
  void update(ref(db, `presence/${p.uid}`), { room }).catch(() => undefined);
}
export function setPresenceIdle(p: Profile, idle: boolean): void {
  void update(ref(db, `presence/${p.uid}`), { idle: idle ? true : null }).catch(() => undefined);
}
export function stopPresence(p: Profile): void {
  window.clearInterval(beat);
  const r = ref(db, `presence/${p.uid}`);
  void onDisconnect(r).cancel();
  void remove(r).catch(() => undefined);
}

// ---- the store ----------------------------------------------------------------------
type Listener = () => void;

/** Everything social about the signed-in player, kept live: friends, requests, DMs, invites, who is online. */
class SocialStore {
  me: Profile | null = null;
  friends = new Map<string, PublicProfile>();
  requests = new Map<string, PublicProfile>();
  presence = new Map<string, Presence>();
  invites: Invite[] = [];
  /** people knocking on my room's door right now */
  knocks = new Map<string, Knock>();
  /** people who want to trade with me right now */
  tradeInvites = new Map<string, TradeInvite>();
  dms = new Map<string, DmMsg[]>();
  unread = new Map<string, number>();
  /** friend whose chat window is open (their messages don't count as unread) */
  openChat = new Set<string>();

  private listeners = new Set<Listener>();
  private knockListeners = new Set<(k: Knock) => void>();
  private tradeInviteListeners = new Set<(i: TradeInvite) => void>();
  private tradeStartListeners = new Set<(id: string) => void>();
  private inviteListeners = new Set<(i: Invite) => void>();
  private dmListeners = new Set<(friend: string, m: DmMsg) => void>();
  private unsubs: Unsubscribe[] = [];
  private dmUnsubs = new Map<string, Unsubscribe>();
  private sessionStart = 0;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  onInvite(fn: (i: Invite) => void): () => void {
    this.inviteListeners.add(fn);
    return () => this.inviteListeners.delete(fn);
  }
  onTradeInvite(fn: (i: TradeInvite) => void): () => void {
    this.tradeInviteListeners.add(fn);
    return () => this.tradeInviteListeners.delete(fn);
  }
  /** a trade with me in it was created (I accepted an invite, or the one I sent was accepted) */
  onTradeStart(fn: (id: string) => void): () => void {
    this.tradeStartListeners.add(fn);
    return () => this.tradeStartListeners.delete(fn);
  }
  onKnock(fn: (k: Knock) => void): () => void {
    this.knockListeners.add(fn);
    return () => this.knockListeners.delete(fn);
  }
  onDm(fn: (friend: string, m: DmMsg) => void): () => void {
    this.dmListeners.add(fn);
    return () => this.dmListeners.delete(fn);
  }
  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  get totalUnread(): number {
    let n = 0;
    this.unread.forEach((v) => (n += v));
    return n;
  }
  /** what the Friends button's red badge counts: unread messages, friend requests and people knocking */
  get badgeCount(): number {
    return this.totalUnread + this.requests.size + this.knocks.size + this.tradeInvites.size;
  }
  /** the presence list has arrived (until then nobody can be called gone) */
  presenceLoaded = false;
  private stale = (v: Presence): boolean => {
    const t = v.seen ?? v.since;
    return typeof t === "number" && serverNow() - t > STALE_MS;
  };
  isOnline = (uid: string) => { const v = this.presence.get(uid); return !!v && !this.stale(v); };
  isIdle = (uid: string) => !!this.presence.get(uid)?.idle;
  friendUids = () => new Set(this.friends.keys());
  roomOf = (uid: string) => this.presence.get(uid)?.room ?? "";

  start(me: Profile): void {
    this.stop();
    this.me = me;
    this.sessionStart = serverNow();

    this.unsubs.push(
      onValue(ref(db, `friends/${me.uid}`), async (snap) => {
        const ids = Object.keys(snap.val() ?? {});
        const next = new Map<string, PublicProfile>();
        await Promise.all(ids.map(async (id) => {
          const pp = await fetchProfile(id);
          if (pp) next.set(id, pp);
        }));
        this.friends = next;
        // one DM listener per friend
        for (const id of next.keys()) if (!this.dmUnsubs.has(id)) this.watchDm(id);
        for (const [id, u] of this.dmUnsubs) {
          if (!next.has(id)) { u(); this.dmUnsubs.delete(id); this.dms.delete(id); this.unread.delete(id); }
        }
        this.emit();
      }),
      onValue(ref(db, `friendRequests/${me.uid}`), async (snap) => {
        const ids = Object.keys(snap.val() ?? {});
        const next = new Map<string, PublicProfile>();
        await Promise.all(ids.map(async (id) => {
          const pp = await fetchProfile(id);
          if (pp) next.set(id, pp);
        }));
        this.requests = next;
        this.emit();
      }),
      onValue(ref(db, "presence"), (snap) => {
        const next = new Map<string, Presence>();
        for (const [uid, v] of Object.entries<any>(snap.val() ?? {})) next.set(uid, { name: v.name, room: v.room ?? "", idle: v.idle === true, seen: typeof v.seen === "number" ? v.seen : undefined, since: typeof v.since === "number" ? v.since : undefined });
        this.presence = next;
        this.presenceLoaded = true;
        this.emit();
      }),
      onValue(ref(db, `knocks/${me.uid}`), (snap) => {
        const next = new Map<string, Knock>();
        for (const [uid, v] of Object.entries<any>(snap.val() ?? {})) next.set(uid, { uid, name: v.name ?? "?", ts: typeof v.ts === "number" ? v.ts : serverNow() });
        const fresh = [...next.values()].filter((k) => !this.knocks.has(k.uid));
        this.knocks = next;
        this.emit();
        fresh.forEach((k) => this.knockListeners.forEach((l) => l(k)));
      }, () => undefined),
      onValue(ref(db, `tradeInvites/${me.uid}`), (snap) => {
        const next = new Map<string, TradeInvite>();
        for (const [uid, v] of Object.entries<any>(snap.val() ?? {})) next.set(uid, { uid, name: v.name ?? "?", ts: typeof v.ts === "number" ? v.ts : serverNow() });
        const fresh = [...next.values()].filter((k) => !this.tradeInvites.has(k.uid));
        this.tradeInvites = next;
        this.emit();
        fresh.forEach((k) => this.tradeInviteListeners.forEach((l) => l(k)));
      }, () => undefined),
      onChildAdded(ref(db, `userTrades/${me.uid}`), (snap) => {
        const id = snap.key!;
        // only trades that start while I'm here open a window (older ones are finished by recoverTrades at sign-in)
        void get(ref(db, `trades/${id}`)).then((t) => {
          const v = t.val();
          if (v && v.status === "open" && typeof v.ts === "number" && v.ts >= this.sessionStart - 60_000) this.tradeStartListeners.forEach((l) => l(id));
        }).catch(() => undefined);
      }, () => undefined),
      onChildAdded(ref(db, `invites/${me.uid}`), (snap) => {
        const v = snap.val();
        if (!v) return;
        const inv: Invite = { id: snap.key!, room: v.room, roomName: v.roomName, from: v.from, fromName: v.fromName, ts: v.ts };
        this.invites.push(inv);
        this.emit();
        // only pop up for invites that arrived while we were here
        if (typeof inv.ts === "number" && inv.ts >= this.sessionStart - 2000) this.inviteListeners.forEach((l) => l(inv));
      }));
  }

  stop(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.dmUnsubs.forEach((u) => u());
    this.dmUnsubs.clear();
    this.friends.clear();
    this.requests.clear();
    this.presence.clear();
    this.invites = [];
    this.knocks.clear();
    this.tradeInvites.clear();
    this.dms.clear();
    this.unread.clear();
    this.openChat.clear();
    this.me = null;
  }

  private watchDm(friend: string): void {
    const me = this.me!;
    const unsub = onChildAdded(query(ref(db, `dms/${me.uid}/${friend}`), orderByChild("ts"), limitToLast(50)), (snap) => {
      const v = snap.val();
      if (!v) return;
      const list = this.dms.get(friend) ?? [];
      if (list.some((m) => m.id === snap.key)) return;
      const msg: DmMsg = { id: snap.key!, from: v.from, text: v.text, ts: typeof v.ts === "number" ? v.ts : serverNow() };
      list.push(msg);
      this.dms.set(friend, list);
      // history that was already there when we signed in is neither "unread" nor worth a pop-up
      const fresh = msg.ts >= this.sessionStart - 2000;
      if (fresh && msg.from !== me.uid && !this.openChat.has(friend)) {
        this.unread.set(friend, (this.unread.get(friend) ?? 0) + 1);
      }
      this.emit();
      if (fresh) this.dmListeners.forEach((l) => l(friend, msg));
    }, () => undefined);
    this.dmUnsubs.set(friend, unsub);
  }

  markRead(friend: string): void {
    if (this.unread.delete(friend)) this.emit();
  }

  // ---- actions ----
  async sendRequest(rawName: string): Promise<string> {
    const me = this.me!;
    const name = rawName.trim();
    if (!name) throw new Error("Type a username first.");
    const snap = await get(ref(db, `usernames/${name.toLowerCase()}`));
    if (!snap.exists()) throw new Error(`Nobody is called "${name}".`);
    const uid = snap.val() as string;
    if (uid === me.uid) throw new Error("That's you!");
    if (this.friends.has(uid)) throw new Error("You're already friends.");
    if (this.requests.has(uid)) {
      await this.accept(uid); // they already asked us: just say yes
      return `You and ${name} are now friends.`;
    }
    await set(ref(db, `friendRequests/${uid}/${me.uid}`), { ts: serverTimestamp() });
    return `Friend request sent to ${name}.`;
  }

  async accept(from: string): Promise<void> {
    const me = this.me!;
    const since = serverNow();
    await update(ref(db), {
      [`friends/${me.uid}/${from}`]: { since },
      [`friends/${from}/${me.uid}`]: { since },
      [`friendRequests/${me.uid}/${from}`]: null,
    });
  }

  decline(from: string): Promise<void> {
    return remove(ref(db, `friendRequests/${this.me!.uid}/${from}`));
  }

  async removeFriend(uid: string): Promise<void> {
    const me = this.me!;
    await update(ref(db), { [`friends/${me.uid}/${uid}`]: null, [`friends/${uid}/${me.uid}`]: null });
  }

  async sendDm(friend: string, text: string): Promise<void> {
    const me = this.me!;
    const id = push(ref(db, `dms/${me.uid}/${friend}`)).key!;
    const msg = { from: me.uid, text: text.slice(0, 200), ts: serverTimestamp() };
    await update(ref(db), { [`dms/${me.uid}/${friend}/${id}`]: msg, [`dms/${friend}/${me.uid}/${id}`]: msg });
  }

  async inviteToRoom(friend: string, roomId: string, roomName: string): Promise<void> {
    const me = this.me!;
    const id = push(ref(db, `invites/${friend}`)).key!;
    await update(ref(db), {
      [`roomInvites/${roomId}/${friend}`]: true,
      [`invites/${friend}/${id}`]: { room: roomId, roomName, from: me.uid, fromName: me.name, ts: serverTimestamp() },
    });
  }

  // ---- knocking on someone's door -------------------------------------------------------------
  /** username -> uid (null if nobody has that name) */
  async uidOf(rawName: string): Promise<string | null> {
    const name = rawName.trim().toLowerCase();
    if (!name) return null;
    const snap = await get(ref(db, `usernames/${name}`));
    return snap.exists() ? (snap.val() as string) : null;
  }

  /** Asks an online player to trade. The invite goes away by itself if I leave. */
  async inviteToTrade(uid: string): Promise<void> {
    const me = this.me!;
    const r = ref(db, `tradeInvites/${uid}/${me.uid}`);
    await set(r, { name: me.name, ts: serverTimestamp() });
    void onDisconnect(r).remove();
  }

  /** The invited player says no (or the inviter takes the invite back). */
  async dropTradeInvite(to: string, from: string): Promise<void> {
    await remove(ref(db, `tradeInvites/${to}/${from}`)).catch(() => undefined);
  }

  /** Asks to be let into someone's room. The owner answers from their friends menu. */
  async knock(owner: string): Promise<void> {
    const me = this.me!;
    const r = ref(db, `knocks/${owner}/${me.uid}`);
    await set(r, { name: me.name, ts: serverTimestamp() });
    void onDisconnect(r).remove(); // a knock from someone who closed the page isn't a knock any more
  }

  cancelKnock(owner: string): Promise<void> {
    const r = ref(db, `knocks/${owner}/${this.me!.uid}`);
    void onDisconnect(r).cancel().catch(() => undefined);
    return remove(r).catch(() => undefined);
  }

  /** Watches the answer to my knock: "accepted" once the owner lets me in, "declined" if they send me away. Returns a stop function. */
  watchKnock(owner: string, cb: (answer: "accepted" | "declined") => void): Unsubscribe {
    const me = this.me!;
    let seenKnock = false;
    let accepted = false;
    let timer = 0;
    const offInvite = onValue(ref(db, `roomInvites/${ownRoomId(owner)}/${me.uid}`), (s) => {
      if (!s.exists() || accepted) return;
      accepted = true;
      window.clearTimeout(timer);
      cb("accepted");
    }, () => undefined);
    const offKnock = onValue(ref(db, `knocks/${owner}/${me.uid}`), (s) => {
      if (s.exists()) { seenKnock = true; return; }
      if (!seenKnock || accepted) return;
      // letting me in removes the knock and adds the invite in one write; give the invite a moment to show up before calling it a "no"
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (!accepted) cb("declined"); }, 700);
    }, () => undefined);
    return () => { window.clearTimeout(timer); offInvite(); offKnock(); };
  }

  /** Owner: let a knocker in (they get access until I log off) or send them away. */
  async answerKnock(visitor: string, allow: boolean): Promise<void> {
    const me = this.me!;
    const updates: Record<string, unknown> = { [`knocks/${me.uid}/${visitor}`]: null };
    if (allow) updates[`roomInvites/${ownRoomId(me.uid)}/${visitor}`] = true;
    await update(ref(db), updates);
  }

  /** Let-in grants only last for one session: they're wiped when I disconnect. Call after signing in and after creating my room. */
  armInviteCleanup(): void {
    const me = this.me;
    if (!me) return;
    void onDisconnect(ref(db, `roomInvites/${ownRoomId(me.uid)}`)).remove().catch(() => undefined);
  }

  clearRoomInvites(): Promise<void> {
    const me = this.me;
    if (!me) return Promise.resolve();
    void onDisconnect(ref(db, `roomInvites/${ownRoomId(me.uid)}`)).cancel().catch(() => undefined);
    return remove(ref(db, `roomInvites/${ownRoomId(me.uid)}`)).catch(() => undefined);
  }

  async dismissInvite(id: string): Promise<void> {
    this.invites = this.invites.filter((i) => i.id !== id);
    this.emit();
    await remove(ref(db, `invites/${this.me!.uid}/${id}`)).catch(() => undefined);
  }

  /** How many players are in each room right now (from presence). */
  roomCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    this.presence.forEach((p, uid) => p.room && this.isOnline(uid) && counts.set(p.room, (counts.get(p.room) ?? 0) + 1));
    return counts;
  }
}

export const social = new SocialStore();
