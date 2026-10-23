# playlistlobby.github.io

The site lives at https://playlistmag.studio/ (custom domain, see `CNAME`; the old https://playlistlobby.github.io/ address redirects to it). The root page opens the game (`/hotel/`) straight away; the Playlist app is at `/playlist/`. The pieces:

| App | URL | What | Where in this repo |
|---|---|---|---|
| (home screen) | `/` | the landing page | `index.html`, icons in `icons/` |
| **Playlist** | `/playlist/` | the Playlist app (chat, timeline, games, store, admin) | `playlist/` |
| **6** (blood drop icon) | `/hotel/` | the hotel (build a character, rooms, friends, arcade) | `hotel/` (built output) |

Other files:

- `hotel-src/` is the Hotel's source code (Vite + TypeScript + Firebase). It includes code from [bobba_client](https://github.com/Josedn/bobba_client) under GPL-3.0, so the source has to stay public alongside the built site.
- `sw.js` and `manifest.json` at the root are **kept for people who installed the Playlist app before it moved to `/playlist/`**. Their installed copy keeps working and now opens `/playlist/`. Don't delete them.
- `firestore.rules` belongs to the Playlist app's Firebase project (`playlist-lobby`).
- `.nojekyll` tells GitHub Pages to serve the files as they are.

## Updating the Hotel

The Hotel is built to static files, which are committed in `hotel/`:

```powershell
cd hotel-src
npm ci
npm run build:pages     # type-checks, then writes the site into ../hotel
```

Then commit `hotel/` and `hotel-src/` and push to `main`.

The hotel shares the `playlist-lobby` Firebase project with the Playlist app, but uses the Realtime Database and Email/Password sign-in (Playlist uses Firestore and anonymous sign-in). The two are kept apart on purpose; read "The live Firebase setup" in `hotel-src/README.md` before changing either.

## Previewing locally

Serve this folder with any static server and open it, for example:

```powershell
python -m http.server 8000
```

then visit http://localhost:8000/ (the landing page), `/playlist/` and `/hotel/`.
