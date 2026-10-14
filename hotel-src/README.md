# 6ixPlanet

A small Habbo-style hotel: **username + password accounts (Firebase Auth) → pick an avatar (randomizer over the free clothes) → pick one of three rooms → you start in your own room**, with a door to the public room and to other players' rooms (friends walk in, strangers knock), an OSRS-style inventory, a knife that draws blood (the hotel's currency), a shop for clothes / emotes / music access, saved outfits, friends + private chat and an arcade machine in the public room. The admin has a **Studio** for designing clothing. Works on phones.

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
| **First run** | avatar step (Boy/Girl tab + 🎲 Randomize over free clothes), then a choice of 3 room templates with previews | `src/ui/onboarding.ts`, `src/rooms.ts` (`ROOM_TEMPLATES`) |
| **Rooms + doors** | everyone has a room (`u_<uid>`); a door on the back wall of every room and the public room opens a popup: public room / my room / visit a player. Friends' rooms and open rooms: walk in. Strangers: **Knock**; the owner sees the request in the Friends menu (and a pop-up) and lets them in for that session. The 🏠 tab in your own room edits name, access (open / knock / friends only), size, floor + wallpaper textures, rug, furniture. | `src/ui/door.ts`, `src/ui/roomPanel.ts`, `src/social.ts` (knocks), `src/roomRender.ts` |
| **Studio (admin)** | design clothing: start from an existing garment, repaint it in the built-in pixel painter, import PNG/ZIP frames, add a pattern, set price + shop, publish. Stored as a small sprite sheet in `designs/*` and slotted into the avatar imager as a normal set. | `src/designs.ts`, `src/designTools.ts`, `src/ui/studio.ts`, `src/ui/painter.ts` |
| **Nitro uploads (admin)** | Studio > Furniture: upload Habbo furniture `.nitro` files, check how the art sits on its tiles (nudge it), choose whether players can place it. The admin places pieces in the public room from the 🏠 tab; players place the allowed ones in their own rooms (R turns a piece). Studio > Clothing > Import .nitro: upload a figure library (e.g. `hh_human_shirt.nitro`), group its parts into garments and import them as designs. | `src/nitro.ts`, `src/furniDefs.ts`, `src/nitroClothing.ts`, `src/ui/adminFurni.ts`, `src/ui/studioNitro.ts` |
| **Arcade** | two cabinets in the lobby; click one, walk up, pick a game | `src/arcade/` |

### Adding things

- **An arcade game:** write a module that exports an `ArcadeGame` (see `src/arcade/snake.ts`) and add it to `GAMES` in `src/arcade/arcade.ts`. `mount(host)` builds into an element and returns a cleanup function.
- **An emote:** add an entry to `EMOTES` in `src/emotes.ts`. `price: 0` makes it free; otherwise it appears in the shop automatically. Free emote ids must also be listed in `database.rules.json` (search for `'wave'`).
- **A music track:** drop an mp3 in `public/music/` and add it to `TRACKS` in `src/music.ts`. `sample.mp3` is a placeholder.
- **CD music:** the CD currently plays the stand-in track `public/music/cd-standin.mp3` (a synthesized loop, replace it freely). To add more, add entries to `CD_TRACKS` in `src/cdplayer.ts`, allow the id in the `cdplayer/track` rule, and store which track a CD holds on the inventory item.
- **An item:** add it to `ITEMS` in `src/items.ts` with an icon in `public/items/`, and allow its id in the `inventory` rule.
- **A furniture kind:** add it to `FURNI_KINDS` in `src/rooms.ts` and to the `furni/kind` rule.

## What the database rules enforce

The rules (not just the UI) enforce: only you can touch your data; blood can only go up by exactly 1, once per UTC day (and only down otherwise); non-free emotes need the matching `owned` entry; friendship needs a request that the other side accepts; DMs and invites only flow between mutual friends; a room's players and chat are open to its owner, friends of the owner, anyone let in (`roomInvites`, wiped when the owner logs off) and, for open rooms, everyone; knocks are refused for closed rooms; only the owner edits a room; only the admin account writes `designs/*` and `config/*`.

## Known limits

- **Prices aren't enforced.** The rules stop players from minting blood or touching others' data, but they can't check what something costs, so a tampered client could unlock shop items without paying. Real enforcement needs Cloud Functions.
- **The music file isn't access-controlled.** The Music tab is gated, but the mp3 is a static file anyone with the URL can fetch. Real gating needs signed URLs.
- Rooms have a 40-piece furniture cap and furniture is simple colored blocks (no sprites yet). Chat history is never pruned. Avatars don't collide.
- Studio designs are stored as base64 PNG sprite sheets in the Realtime Database (limit ~880 KB each).
- The floor/wall textures, UI sounds and any assets taken from the Habbo asset dump belong to their original owner.
- The "surprised" face sprite is missing from the hosted atlas, so that emote jumps instead of pulling a face.
- Assets are hotlinked from third-party hosts.

## Credits

The tab pictures under the room (backpack, emotes, house) and the emote buttons are from [OSRS Icons by Dava96](https://github.com/Dava96/osrs-icons) (sprites from the Old School RuneScape Wiki), licence CC BY-NC-SA 3.0, non-commercial. Old School RuneScape belongs to Jagex Ltd. See `public/osrs/README.txt`.
