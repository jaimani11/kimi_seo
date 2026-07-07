'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './auth-context';

/**
 * Effect-only component. Watches the auth state for the
 * anonymous→authenticated transition and POSTs /api/auth/migrate to
 * promote anonymous trips to the new userId.
 *
 * The route is idempotent (User.migratedFrom guard), so a duplicate
 * call from React Strict Mode is harmless.
 *
 * Mounted alongside the AuthProvider - runs whether the user signed in
 * via Clerk or not (in keyless mode, kind never flips off 'anonymous'
 * so the effect never fires).
 */
export function MigrateOnSignIn() {
  const auth = useAuth();
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (auth.kind !== 'authenticated') return;
    if (fired.current === auth.userId) return;
    fired.current = auth.userId;
    fetch('/api/auth/migrate', { method: 'POST' }).catch(() => {
      // Surface only via console - UI doesn't block on this.
      console.warn('[migrate-on-sign-in] migrate request failed');
    });
  }, [auth]);

  return null;
}
