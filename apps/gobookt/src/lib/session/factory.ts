import { getDbClient } from '@lib/db';
import { InMemorySessionStore } from './in-memory-session-store';
import { PostgresSessionStore } from './postgres-session-store';
import type { SessionStore } from './session-store';

/**
 * Process-global singleton anchor. Module-local `let` was insufficient
 * in Next 16 + Turbopack dev: server components and API route handlers
 * sometimes get separate module bundles, which produced TWO instances
 * of the in-memory store. A trip saved via POST /api/trips/save was
 * invisible to a server-rendered /trips/[id]/itinerary page - same
 * cookie, same owner key, but two different stores. `globalThis`
 * anchors the singleton to the actual Node process so every consumer
 * (route, server component, server action, monitoring runner, etc.)
 * sees the same instance.
 *
 * Other in-memory subsystems (monitoring, booking, itinerary cache,
 * memory store, billing-subscription store, webhook event log) already
 * use this pattern; session-store joins them.
 */
declare global {
  var __stayscoutSessionStore: SessionStore | undefined;
}

/**
 * Resolve the singleton SessionStore. PostgresSessionStore when
 * DATABASE_URL is set + Prisma client constructed successfully; otherwise
 * InMemorySessionStore. The decision is made once per process.
 */
export function getSessionStore(): SessionStore {
  if (globalThis.__stayscoutSessionStore) return globalThis.__stayscoutSessionStore;
  const db = getDbClient();
  globalThis.__stayscoutSessionStore = db
    ? new PostgresSessionStore(db)
    : new InMemorySessionStore();
  return globalThis.__stayscoutSessionStore;
}

// Test seam - replace the singleton between tests.
export function _setSessionStoreForTesting(store: SessionStore | null): void {
  globalThis.__stayscoutSessionStore = store ?? undefined;
}
