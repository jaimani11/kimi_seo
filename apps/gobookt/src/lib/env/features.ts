/**
 * Runtime feature flags derived from env vars.
 *
 * IMPORTANT: this module is imported by both client and server code, so it
 * must NOT reference server-only env vars without a NEXT_PUBLIC_ prefix.
 * Server-only flags (DATABASE_URL, CLERK_SECRET_KEY, etc.) are exposed via
 * getServerFeatures() in get-server-features.ts.
 */

// NEXT_PUBLIC_* env vars are inlined at build time by Next, so this is a
// build-time constant in client bundles.
export const clientFeatures = {
  auth:
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0,
} as const;

export type ClientFeatures = typeof clientFeatures;
