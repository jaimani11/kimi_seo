'use client';

import { createContext, useContext } from 'react';
import type { AuthState } from './auth-state';

/**
 * AuthContext is provided by either AnonymousAuthProvider or ClerkAuthProvider
 * (chosen at runtime by AuthProvider). Both paths populate the same shape
 * so consumers don't branch.
 */
export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Tolerant fallback - components imported in places where the provider
    // isn't mounted (e.g. unit tests) get a stable anonymous state rather
    // than a crash.
    return { kind: 'anonymous', sessionId: 'unprovided' };
  }
  return ctx;
}
