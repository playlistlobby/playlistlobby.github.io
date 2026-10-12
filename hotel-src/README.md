# Bobba Hotel demo

A small Habbo-style hotel: **username + password accounts (Firebase Auth) → character customizer → live isometric lobby**, with an OSRS-style inventory, a knife that draws blood (the hotel's currency), a shop for clothes / emotes / music access, a wardrobe, friends + private chat, player-made rooms you can decorate and invite people to, and an arcade machine in the lobby.

- Avatars are rendered in the browser from Habbo's sprite data, using the avatar imager from [Josedn/bobba_client](https://github.com/Josedn/bobba_client) (GPL-3.0, vendored in `src/avatar/`). Sprite atlases and `figuredata.json` come from `images.bobba.io` (see `src/avatarService.ts` to point it at your own mirror).
- Everything realtime lives in Firebase Realtime Database. There is no custom server.

## Run locally with the emulators (no Firebase account needed)

Needs Node 18+ and a JDK 11+.

```powershell
npm install
./scripts/dev-emu.ps1      # emulators + dev server on http://127.0.0.1:5173
```

(or `npm run emulators` and `npm run dev:emu` in two terminals; on Windows see the temp-dir note in `scripts/dev-emu.ps1`).

## The live Firebase setup

The hotel uses the **same Firebase project as the Playlist app** (`playlist-lobby`), but a different product, so they stay separate:

| | Playlist app | Hotel |
|---|---|---|
| Data | Firestore | **Realtime Database** `playlist-lobby-default-rtdb` (europe-west1) |
| Sign-in | Anonymous | **Email/Password** (usernames are mapped onto it) |
| Rules | `firestore.rules` | `database.rules.json` (`npm run deploy:rules`) |

Because they share a project and a website origin, two things keep them apart:

- The hotel creates its own **named Firebase app instance** (`src/firebase.ts`), so its sign-in is stored separately and never touches (or signs out) a Playlist member.
- Every database rule requires `auth.token.firebase.sign_in_provider === 'password'`, so the anonymous sessions the Playlist hands out to every visitor can't read or write hotel data. The app also ignores any anonymous session.

The config in `src/firebaseConfig.ts` is public (identifiers, not secrets). To publish rule changes: `npx firebase login` once, then `npm run deploy:rules`.

## What's in it

| Feature | How it works | Where |
|---|---|---|
| Login / register | username + password, mapped to a hidden email | `src/auth.ts` |
| Character customizer, shop, wardrobe | one editor, two modes; 8 outfit slots | `src/ui/editor.ts`, `wardrobe.ts` |
| **Drops of blood** (currency) | start with 5; clothes cost 1-4, emotes 1-3, music 4 | `src/items.ts`, `src/catalog.ts` |
| **Inventory + knife** | 28 slots, click the knife then a player; one stab a day (UTC) = +1 drop; the stab animation does nothing to the victim | `src/ui/sidepanel.ts`, `src/ui/room.ts` |
| **Emotes** | Emotes tab or `/dance` in chat; free ones + paid ones from the shop | `src/emotes.ts` |
| **CD + CD player** | everyone owns a CD; use it on the CD player in the lobby (it walks you over). Everyone in the lobby hears it in sync, music notes float out of the machine, and the CD comes back to your inventory when it ends (or when you eject it). Click the player with nothing selected for volume controls (volume is per listener). | `src/cdplayer.ts`, `src/ui/room.ts` |
| **Music access** | shop item unlocks the Music tab, which streams `public/music/*.mp3` | `src/music.ts` |
| **Friends + private chat** | requests by username, accept/decline, online dots, follow into a room, DMs between friends, unread badges | `src/social.ts`, `src/ui/messenger.ts` |
| **Rooms** | `Rooms` tab: create your room, then use the 🏠 tab inside it to rename it, set access (open / friends / invite only), resize, recolor floor / walls / rug, place furniture, invite friends | `src/rooms.ts`, `src/ui/navigator.ts`, `src/ui/roomPanel.ts` |
| **Arcade** | two cabinets in the lobby; click one, walk up, pick a game | `src/arcade/` |

### Adding things

- **An arcade game:** write a module that exports an `ArcadeGame` (see `src/arcade/snake.ts`) and add it to `GAMES` in `src/arcade/arcade.ts`. `mount(host)` builds into an element and returns a cleanup function.
- **An emote:** add an entry to `EMOTES` in `src/emotes.ts`. `price: 0` makes it free; otherwise it appears in the shop automatically. Free emote ids must also be listed in `database.rules.json` (search for `'wave'`).
- **A music track:** drop an mp3 in `public/music/` and add it to `TRACKS` in `src/music.ts`. `sample.mp3` is a placeholder.
- **CD music:** the CD currently plays the stand-in track `public/music/cd-standin.mp3` (a synthesized loop, replace it freely). To add more, add entries to `CD_TRACKS` in `src/cdplayer.ts`, allow the id in the `cdplayer/track` rule, and store which track a CD holds on the inventory item.
- **An item:** add it to `ITEMS` in `src/items.ts` with an icon in `public/items/`, and allow its id in the `inventory` rule.
- **A furniture kind:** add it to `FURNI_KINDS` in `src/rooms.ts` and to the `furni/kind` rule.

## What the database rules enforce

The rules (not just the UI) enforce: only you can touch your data; blood can only go up by exactly 1, once per UTC day (and only down otherwise); non-free emotes need the matching `owned` entry; friendship needs a request that the other side accepts; DMs and invites only flow between mutual friends; room access (open / friends / invite) applies to who can read or write a room's players and chat; only the owner edits a room.

## Known limits

- **Prices aren't enforced.** The rules stop players from minting blood or touching others' data, but they can't check what something costs, so a tampered client could unlock shop items without paying. Real enforcement needs Cloud Functions.
- **The music file isn't access-controlled.** The Music tab is gated, but the mp3 is a static file anyone with the URL can fetch. Real gating needs signed URLs.
- Rooms have a 40-piece furniture cap and furniture is simple colored blocks (no sprites yet). Chat history is never pruned. Avatars don't collide.
- The "surprised" face sprite is missing from the hosted atlas, so that emote jumps instead of pulling a face.
- Assets are hotlinked from third-party hosts.
