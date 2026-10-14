export interface Env {
  ECONOMY: DurableObjectNamespace;
  /** "emulator" = local development against the Firebase emulators (unsigned tokens, no service account) */
  ENV?: string;
  FIREBASE_PROJECT_ID: string;
  /** the Realtime Database URL, no trailing slash */
  DB_URL: string;
  /** emulator only: the database namespace */
  DB_NS?: string;
  /** comma separated list of origins that may call the API */
  ALLOWED_ORIGINS: string;
  ADMIN_EMAIL: string;
  /** secret: the Firebase service-account key (JSON) the server uses to write to the database */
  FIREBASE_SA_JSON?: string;
}

export const isEmulator = (env: Env): boolean => env.ENV === "emulator";
