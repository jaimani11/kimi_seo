'use client';

import type { ReactNode } from 'react';
import { clientFeatures } from '@lib/env';
import { AnonymousAuthProvider } from './anonymous-auth-provider';
import { ClerkAuthProvider } from './clerk-auth-provider';

/**
 * Top-level auth provider. Chooses the Clerk-backed bridge when the env
 * flag is on, otherwise the always-anonymous provider. Both produce the
 * same AuthContext shape.
 *
 * The branch is at render time on a build-time constant
 * (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY), so when the flag is off the
 * Clerk branch is dead code and modern bundlers can tree-shake it.
 * Worst case the runtime is shipped but never executed - acceptable.
 */
export function AuthProvider({ sessionId, children }: { sessionId: string; children: ReactNode }) {
  if (clientFeatures.auth) {
    return <ClerkAuthProvider sessionId={sessionId}>{children}</ClerkAuthProvider>;
  }
  return <AnonymousAuthProvider sessionId={sessionId}>{children}</AnonymousAuthProvider>;
}
