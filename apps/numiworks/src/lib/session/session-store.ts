import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';
import type { ProposalRef } from '@core/partial';

export interface TurnRecord {
  turnId: string;
  sessionId: string;
  userId?: string;
  conversationId?: string;
  type: 'compose' | 'refine';
  rawInput: string;
  intent: TripIntent;
  proposal?: TripProposal;
  failed?: boolean;
  error?: string;
  durationMs?: number;
  completedAt: number;
}

export interface SavedTrip {
  id: string;
  ownerKind: 'user' | 'session';
  ownerId: string;
  conversationId?: string;
  proposalId: string;
  proposalSummary: ProposalRef['summary'];
  proposal: TripProposal;
  intent: TripIntent;
  /** Lazy-minted on first share. Undefined until then. */
  shareSlug?: string;
  bookmarkedAt: string;
}

/**
 * Public, sanitized projection of a SavedTrip for share links. Strips
 * everything that could leak owner identity or PII. The intent is
 * coarsened - we keep the structured trip parameters but drop
 * `rawInput` (which can echo the user's exact words including names).
 */
export interface SharedTrip {
  proposalId: string;
  proposalSummary: ProposalRef['summary'];
  proposal: TripProposal;
  intent: TripIntent; // rawInput already masked by toSharedTrip
  bookmarkedAt: string;
}

export interface MigrationResult {
  movedUserId: string;
  fromSessionId: string;
  tripsCopied: number;
  alreadyMigrated: boolean;
}

export interface AffiliateClickRecord {
  id: string;
  ownerKind: 'user' | 'session';
  ownerId: string;
  /** sessionId is recorded even when ownerKind is 'user' - covers
   *  cross-device + supports anonymous→user reconciliation in B7. */
  sessionId: string;
  stayId: string;
  providerId: string;
  affiliateUrl: string;
  turnId?: string;
  conversationId?: string;
  createdAt: string; // ISO
}

export interface RecordClickArgs {
  ownerKind: 'user' | 'session';
  ownerId: string;
  sessionId: string;
  stayId: string;
  providerId: string;
  affiliateUrl: string;
  turnId?: string;
  conversationId?: string;
}

/**
 * Funnel events recorded server-side so the /admin/analytics
 * dashboard can compute exact counts (no proxy fields). The set is
 * tightly bounded — adding a new kind requires a code change so the
 * funnel stays well-defined. Anything ad-hoc keeps going through the
 * client-side `track()` to Plausible/GA4 only.
 */
export const FUNNEL_EVENT_KINDS = [
  'search_results_view',
  'recommendation_impression',
  'experience_view',
  'save_click',
] as const;
export type FunnelEventKind = (typeof FUNNEL_EVENT_KINDS)[number];

/**
 * Small structured payload carried alongside a funnel event. Used by
 * Sprint 18's "recently viewed" rail to remember the user-facing
 * snapshot at view time (title, hero image, price) without a second
 * round-trip to Viator. Strictly typed as a string→primitive map so
 * the JSON shape stays predictable and Zod-validatable at the API
 * boundary. Free-form on values; key set should stay small per kind.
 */
export type FunnelEventMetadata = Record<string, string | number | boolean>;

export interface FunnelEventRecord {
  id: string;
  kind: FunnelEventKind;
  ownerKind: 'user' | 'session';
  ownerId: string;
  sessionId: string;
  /** Optional reference — e.g. stayId for experience_view + save_click,
   *  searchTerm for search_results_view, turnId for recommendation
   *  impression. Free-form (<= 200 chars), never PII. */
  ref?: string;
  /** Optional structured snapshot. Sprint 18 uses this on
   *  `experience_view` to remember {title, imageUrl, destination,
   *  priceFromUsd} so the "Pick up where you left off" rail can
   *  render without re-fetching from the provider. */
  metadata?: FunnelEventMetadata;
  createdAt: string; // ISO
}

export interface RecordEventArgs {
  kind: FunnelEventKind;
  ownerKind: 'user' | 'session';
  ownerId: string;
  sessionId: string;
  ref?: string;
  metadata?: FunnelEventMetadata;
}

export type OwnerKind = 'user' | 'session';

export interface SaveTripArgs {
  ownerKind: OwnerKind;
  ownerId: string;
  proposalId: string;
  proposalSummary: ProposalRef['summary'];
  proposal: TripProposal;
  intent: TripIntent;
  conversationId?: string;
}

export interface OwnerArgs {
  ownerKind: OwnerKind;
  ownerId: string;
}

/**
 * SessionStore - the persistence boundary for everything Slice B–D
 * stores per-user or per-session. Two implementations:
 *
 *   - InMemorySessionStore: always available; backs the "no DB" dev mode.
 *     Process-local; lost on restart. Saved trips survive page refreshes
 *     within a single dev-server session.
 *
 *   - PostgresSessionStore: active when DATABASE_URL is set. Backed by
 *     Prisma. Real durability + auth-aware queries.
 *
 * Both implementations pass the same contract tests. New persistence
 * concerns (affiliate clicks, memory records) extend this interface in
 * later sub-slices; the contract is intentionally narrow today.
 */
export interface SessionStore {
  // ============== Turns (orchestrator's refine lookup) ==============
  getTurn(turnId: string): Promise<TurnRecord | null>;
  putTurn(turn: TurnRecord): Promise<void>;

  // ============== Saved trips ==============
  saveTrip(args: SaveTripArgs): Promise<SavedTrip>;
  listTrips(args: OwnerArgs): Promise<SavedTrip[]>;
  getTrip(args: OwnerArgs & { tripId: string }): Promise<SavedTrip | null>;
  deleteTrip(args: OwnerArgs & { tripId: string }): Promise<boolean>;

  // ============== Share links ==============
  /**
   * Idempotently mint a share slug for the given owned trip. If the
   * trip already has a slug, return it; otherwise generate one, persist,
   * and return. Returns null if the trip isn't owned by the caller (or
   * doesn't exist) - callers should treat null as 404.
   */
  mintShareSlug(args: OwnerArgs & { tripId: string }): Promise<string | null>;

  /**
   * Public read by share slug - no owner gating. Returns a sanitized
   * projection (no ownerId, no rawInput). Returns null for unknown slug.
   */
  getTripBySlug(slug: string): Promise<SharedTrip | null>;

  // ============== Affiliate clicks ==============
  /**
   * Append-only record of a booking redirect. Owner attribution mirrors
   * trip ownership (user for authenticated, session for anonymous).
   * Failures here MUST NOT block the redirect - callers wrap with
   * try/catch + log so a DB outage doesn't break the booking flow.
   */
  recordClick(args: RecordClickArgs): Promise<AffiliateClickRecord>;

  /**
   * List affiliate clicks, most-recent-first. With `owner` set, restricts
   * to that owner's clicks (used by the per-owner admin view). Without,
   * returns the global recent feed (admin clicks page). `limit` defaults
   * to 50 to keep payload bounded.
   *
   * Slice C5 - admin pages call this. Production traffic should NOT call
   * it without a small limit; sorting in-memory is fine, sorting from
   * Postgres uses an index on createdAt.
   */
  listClicks(args?: { owner?: OwnerArgs; limit?: number }): Promise<AffiliateClickRecord[]>;

  // ============== Funnel events (Sprint 17) ==============
  /**
   * Append-only log of client-side funnel events. Always best-effort:
   * callers wrap in try/catch so a store outage never blocks the UI.
   */
  recordEvent(args: RecordEventArgs): Promise<FunnelEventRecord>;

  /**
   * List funnel events, most-recent-first. With `kind` set, restricts
   * to that event kind. With `sessionId` set, restricts to events from
   * a single session (used by Sprint 18's "Pick up where you left off"
   * rail). Default `limit` 5000 keeps payload bounded for admin
   * rollups (the dashboard fetches once per page render).
   */
  listEvents(args?: {
    kind?: FunnelEventKind;
    sessionId?: string;
    limit?: number;
  }): Promise<FunnelEventRecord[]>;

  // ============== Migration ==============
  migrateAnonymousToUser(args: {
    fromSessionId: string;
    toUserId: string;
  }): Promise<MigrationResult>;
}
