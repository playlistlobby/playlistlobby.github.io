// Firebase web-app config for the hotel. It shares the "playlist-lobby" project with the Playlist app:
//  - Authentication: the Email/Password provider (usernames are mapped onto it); Playlist keeps using Anonymous.
//  - Realtime Database: playlist-lobby-default-rtdb (europe-west1), protected by database.rules.json.
//    Playlist uses Firestore, which is separate and untouched.
// These values are public identifiers, not secrets; access is controlled by the rules.
export const firebaseConfig = {
  apiKey: "AIzaSyAXWr1bW5FljYLu7levh_P6w0rrbdhVToE",
  authDomain: "playlist-lobby.firebaseapp.com",
  databaseURL: "https://playlist-lobby-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "playlist-lobby",
  appId: "1:98113831672:web:caae55b5c34ba63688310d",
};

export const isConfigured = !firebaseConfig.apiKey.startsWith("PASTE");
