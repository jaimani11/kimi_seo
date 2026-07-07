import { PrismaClient } from '@prisma/client';
import { getServerFeatures } from '@lib/env';

/**
 * Lazy Prisma client singleton. Returns null when DATABASE_URL is unset
 * (or set to the placeholder used for codegen) - code paths that touch
 * the DB must check for null first. The SessionStore factory handles
 * that branching at the boundary so orchestrator + route handlers don't.
 *
 * Hot-reload safety: in dev, Next/Turbopack may re-import this module
 * across HMR rounds. We cache on globalThis to prevent
 * "Too many connections" warnings.
 */

declare global {
  var __stayscoutPrisma: PrismaClient | null | undefined;
}

export function getDbClient(): PrismaClient | null {
  if (!getServerFeatures().database) return null;
  if (globalThis.__stayscoutPrisma === undefined) {
    try {
      globalThis.__stayscoutPrisma = new PrismaClient({
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
      });
    } catch (err) {
      console.warn('[db] Prisma client failed to initialise - continuing in mock mode:', err);
      globalThis.__stayscoutPrisma = null;
    }
  }
  return globalThis.__stayscoutPrisma;
}

export type { PrismaClient };
