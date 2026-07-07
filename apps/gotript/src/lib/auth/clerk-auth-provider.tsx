'use client';

import { ClerkProvider, useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { AuthState } from './auth-state';

/**
 * ClerkAuthProvider - mounted only when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 * is present. Wraps ClerkProvider, then a bridge that derives our
 * AuthState from Clerk's useUser() at render time (no setState-in-effect).
 */
export function ClerkAuthProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <ClerkAuthBridge sessionId={sessionId}>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

function ClerkAuthBridge({ sessionId, children }: { sessionId: string; children: ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const value: AuthState =
    isLoaded && isSignedIn && user
      ? {
          kind: 'authenticated',
          userId: user.id,
          ...(user.primaryEmailAddress?.emailAddress
            ? { email: user.primaryEmailAddress.emailAddress }
            : {}),
          sessionId,
        }
      : { kind: 'anonymous', sessionId };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
