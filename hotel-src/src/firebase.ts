import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { firebaseConfig, isConfigured } from "./firebaseConfig";

// `npm run dev:emu` talks to local Firebase emulators (npm run emulators) instead of a real project.
export const useEmulator = import.meta.env.MODE === "emulator";

export const firebaseReady = useEmulator || isConfigured;

const config = useEmulator
  ? {
      apiKey: "demo-key",
      authDomain: "demo-hotel.firebaseapp.com",
      databaseURL: "http://127.0.0.1:9000/?ns=demo-hotel-default-rtdb",
      projectId: "demo-hotel",
      appId: "demo",
    }
  : firebaseConfig;

// A *named* app instance on purpose. The hotel shares the "playlist-lobby" Firebase project and the same website
// origin as the Playlist app, which signs visitors in anonymously. Firebase stores each app's sign-in under its name,
// so naming ours keeps the two sessions apart: the hotel never sees (or signs out) a Playlist member.
const app = initializeApp(config, "hotel");
export const auth = getAuth(app);
export const db = getDatabase(app);

if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
}
