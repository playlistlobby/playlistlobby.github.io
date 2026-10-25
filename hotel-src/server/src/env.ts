export interface Env {
  ECONOMY: DurableObjectNamespace;
  /** "emulator" = local development against the Firebase emulators (unsigned tokens, no service account) */
  ENV?: string;
  FIREBASE_PROJECT_ID: string;
  /** the Realtime Database URL, no trailing slash */
  DB_URL: string;
  /** emulator only: where the Auth emulator listens (default http://127.0.0.1:9099) */
  AUTH_EMU_URL?: string;
  /** emulator only: the database namespace */
  DB_NS?: string;
  /** comma separated list of origins that may call the API */
  ALLOWED_ORIGINS: string;
  ADMIN_EMAIL: string;
  /** secret: the Firebase service-account key (JSON) the server uses to write to the database */
  FIREBASE_SA_JSON?: string;
  /** secret: Stripe's secret key (sk_test_... while testing, sk_live_... later). Without it the pay button says payments aren't set up. */
  STRIPE_SECRET_KEY?: string;
  /** secret: the signing secret (whsec_...) of the Stripe webhook that points at /pay/webhook */
  STRIPE_WEBHOOK_SECRET?: string;
  /** while this has a text the game is closed for everybody but the admin, and players see the text (see server/src/index.ts and src/maintenance.ts) */
  MAINTENANCE?: string;
  /** where Stripe sends people back to: the game's address with a trailing slash */
  PUBLIC_URL?: string;
}

export const isEmulator = (env: Env): boolean => env.ENV === "emulator";
