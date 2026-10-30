# Testing the album-night event locally (emulator, nothing is live)

**The stack must be running** (three programs, already started in this session): `npm run emulators` and `npm run dev:emu` in the project root, `npm run dev` in `server/`. Open the game at **http://localhost:5173**.
After the emulator has been restarted its data is gone: run `node scripts/seed-event-test.mjs` (accounts + a clean event) and `node scripts/seed-og-ep.mjs` (the four SoundCloud songs).

**Accounts** (all with the password `secret1`): `adminsidia` (the admin, shows as 6ixty), `emil` (runs the event too), `djmod` (a moderator: DJ deck, never locked in), `fan1`..`fan4` (ordinary players).
One account per browser window: use a normal window, a private window and a second browser (the sign-in is shared between tabs of the same browser).

## A run-through
1. **admin:** log in, type `/stage1` (you land on the stage), type `/event`.
2. **fans:** log in. Each types nothing: the red door is shut (tap the red door in the basement: 6ixty says the old line).
3. **admin, panel:** *Open the red door*. Now a fan taps the red door and walks in. From now on that fan cannot leave (exit door, logout, other pages all say "The doors are shut"), and a refresh puts them back on the stage.
4. **admin, panel:** *Lights on* (everyone also has a 💡 button to turn them off for themselves). *Play the album* (or tap the DJ deck as `djmod`/admin with a CD: `djmod` has `cd_album`). Notes rise from the speakers and the deck; music and sound effects are switched on for everybody who comes in.
5. **admin, panel:** *Close the doors*: a fan who is still in their own room is pulled onto the stage, and anybody who logs in lands there.
6. **admin, panel:** *THE SURPRISE* (confirm, then type KILL). Everybody's screen fades to black, the music goes muffled, and about 9 seconds later they wake up in the same spot in the changed room (public room look, body bags, no t-shirt wall). After 10 seconds of protection everybody holds a knife: tap a player to fight. 6ixty (the admin) cannot lose hit points.
7. **a fan dies:** 20 second countdown, at 7 the screen goes black and the music fades, then the grave ("Tak for alt" over it, the name under it) for 5 seconds, then black, and the fan is signed out. Refreshing shows the leftover page; the sign-in box is hidden.
8. **admin, panel:** *End it* sends everybody still alive the same way. *Reset everything* puts it all back (a fan's browser that remembered it died shows the normal login again).
9. **The leftover page:** `/finale` (admin and emil) opens it with the editor (text, hide/show songs, make the leaderboard again). Staff reach the game from the page by adding `?login` to the address: http://localhost:5173/?login

Panel test buttons (only on your own screen): *Look at the changed room* (move its furniture with "Indret rum": saved apart from the concert room), *Test the black-out*, *Test dying* (ends on the page with a Back button, nobody is signed out), *The page that is left*, *Edit that page*.

Server test: `cd server && node test/event.mjs` (49 checks).
