/**
 * Centralized application configuration.
 * All environment-dependent values are read here once and exported as typed constants.
 */

type Environment = "development" | "staging" | "production";

function getEnvironment(): Environment {
  const mode = import.meta.env.MODE;
  if (mode === "production") return "production";
  if (mode === "staging") return "staging";
  return "development";
}

export const ENV = getEnvironment();
export const IS_DEV = ENV === "development";
export const IS_PROD = ENV === "production";

export const config = {
  env: ENV,

  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID as string,
  },

  api: {
    /** Default timeout for edge function calls (ms) */
    timeout: 30_000,
    /** Max retries for transient failures */
    maxRetries: 3,
    /** Base delay between retries (ms), exponentially backed off */
    retryBaseDelay: 1_000,
  },

  cache: {
    /** Default staleTime for react-query (ms) */
    defaultStaleTime: 1000 * 60 * 5,
    /** GC time for react-query (ms) */
    defaultGcTime: 1000 * 60 * 30,
  },

  features: {
    /** Enable verbose console logging */
    debugLogging: IS_DEV,
    /** Enable browser sync feature */
    browserSync: true,
    /** Enable AI suggestions */
    aiSuggestions: true,
    /** Enable push notifications */
    pushNotifications: true,
  },

  pagination: {
    /** Default page size for list queries */
    defaultPageSize: 500,
    /** Max rows supabase returns without explicit range */
    supabaseMaxRows: 1000,
  },
} as const;

export type AppConfig = typeof config;
