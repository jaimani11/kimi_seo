/**
 * AuthState - a discriminated union surfaced everywhere the app asks
 * "who is this." Anonymous always carries a sessionId (cookie-bound);
 * authenticated carries both userId and sessionId so anonymous→user
 * migration and click attribution have a single record to work with.
 */
export type AuthState =
  | { kind: 'anonymous'; sessionId: string }
  | { kind: 'authenticated'; userId: string; email?: string; sessionId: string };

/**
 * Resolve the storage owner for the current AuthState. Trips, affiliate
 * clicks, and memory records all key on this so the same AuthState
 * always points to the same row.
 */
export function ownerOf(state: AuthState): { ownerKind: 'user' | 'session'; ownerId: string } {
  return state.kind === 'authenticated'
    ? { ownerKind: 'user', ownerId: state.userId }
    : { ownerKind: 'session', ownerId: state.sessionId };
}
