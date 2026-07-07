'use client';

import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { AuthState } from './auth-state';

export function AnonymousAuthProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  const value: AuthState = { kind: 'anonymous', sessionId };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
