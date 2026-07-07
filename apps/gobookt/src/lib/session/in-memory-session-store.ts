import type {
  AffiliateClickRecord,
  FunnelEventKind,
  FunnelEventRecord,
  MigrationResult,
  OwnerArgs,
  RecordClickArgs,
  RecordEventArgs,
  SavedTrip,
  SaveTripArgs,
  SessionStore,
  SharedTrip,
  TurnRecord,
} from './session-store';
import { mintShareSlug as generateShareSlug } from './share-slug';

function toSharedTrip(t: SavedTrip): SharedTrip {
  // Mask intent.rawInput - public surface should never echo what the
  // owner typed. Structured trip parameters stay so the recipient sees
  // "7 nights, family of 4" rather than the literal sentence.
  return {
    proposalId: t.proposalId,
    proposalSummary: t.proposalSummary,
    proposal: t.proposal,
    intent: { ...t.intent, rawInput: '' },
    bookmarkedAt: t.bookmarkedAt,
  };
}

/**
 * In-memory SessionStore implementation. Always available; default when
 * DATABASE_URL is unset. State is process-local and lost on restart, but
 * survives page refreshes within a dev-server session - that's enough
 * for the demo flow to feel real.
 */
export class InMemorySessionStore implements SessionStore {
  private readonly turns = new Map<string, TurnRecord>();
  // ownerKey: `${ownerKind}:${ownerId}` → trip-id-keyed map
  private readonly tripsByOwner = new Map<string, Map<string, SavedTrip>>();
  /** Side index for O(1) public-read by share slug. */
  private readonly tripsBySlug = new Map<string, SavedTrip>();
  /** Append-only click log. Process-local. */
  private readonly clicks: AffiliateClickRecord[] = [];
  /** Append-only funnel-event log (Sprint 17). */
  private readonly events: FunnelEventRecord[] = [];

  // ============== Turns ==============
  async getTurn(turnId: string): Promise<TurnRecord | null> {
    return this.turns.get(turnId) ?? null;
  }

  async putTurn(turn: TurnRecord): Promise<void> {
    this.turns.set(turn.turnId, turn);
  }

  // ============== Trips ==============
  async saveTrip(args: SaveTripArgs): Promise<SavedTrip> {
    const ownerKey = ownerKeyOf(args);
    const bucket = this.tripsByOwner.get(ownerKey) ?? new Map<string, SavedTrip>();
    // Idempotency: if a trip already exists for (owner, proposalId),
    // return it instead of duplicating. Mirrors Postgres @@unique.
    for (const existing of bucket.values()) {
      if (existing.proposalId === args.proposalId) return existing;
    }
    const trip: SavedTrip = {
      id: `trip_${cryptoRandomId()}`,
      ownerKind: args.ownerKind,
      ownerId: args.ownerId,
      ...(args.conversationId ? { conversationId: args.conversationId } : {}),
      proposalId: args.proposalId,
      proposalSummary: args.proposalSummary,
      proposal: args.proposal,
      intent: args.intent,
      bookmarkedAt: new Date().toISOString(),
    };
    bucket.set(trip.id, trip);
    this.tripsByOwner.set(ownerKey, bucket);
    return trip;
  }

  async listTrips(args: OwnerArgs): Promise<SavedTrip[]> {
    const bucket = this.tripsByOwner.get(ownerKeyOf(args));
    if (!bucket) return [];
    return Array.from(bucket.values()).sort(
      (a, b) => Date.parse(b.bookmarkedAt) - Date.parse(a.bookmarkedAt),
    );
  }

  async getTrip(args: OwnerArgs & { tripId: string }): Promise<SavedTrip | null> {
    const bucket = this.tripsByOwner.get(ownerKeyOf(args));
    return bucket?.get(args.tripId) ?? null;
  }

  async deleteTrip(args: OwnerArgs & { tripId: string }): Promise<boolean> {
    const bucket = this.tripsByOwner.get(ownerKeyOf(args));
    if (!bucket) return false;
    const trip = bucket.get(args.tripId);
    if (!trip) return false;
    if (trip.shareSlug) this.tripsBySlug.delete(trip.shareSlug);
    return bucket.delete(args.tripId);
  }

  // ============== Share links ==============
  async mintShareSlug(args: OwnerArgs & { tripId: string }): Promise<string | null> {
    const bucket = this.tripsByOwner.get(ownerKeyOf(args));
    const trip = bucket?.get(args.tripId);
    if (!trip) return null;
    if (trip.shareSlug) return trip.shareSlug;
    // Avoid the cosmically-rare collision proactively. 95 bits of
    // entropy means this loop almost never iterates.
    let slug = generateShareSlug();
    while (this.tripsBySlug.has(slug)) slug = generateShareSlug();
    trip.shareSlug = slug;
    this.tripsBySlug.set(slug, trip);
    return slug;
  }

  async getTripBySlug(slug: string): Promise<SharedTrip | null> {
    const trip = this.tripsBySlug.get(slug);
    return trip ? toSharedTrip(trip) : null;
  }

  // ============== Affiliate clicks ==============
  async recordClick(args: RecordClickArgs): Promise<AffiliateClickRecord> {
    const click: AffiliateClickRecord = {
      id: `click_${cryptoRandomId()}`,
      ownerKind: args.ownerKind,
      ownerId: args.ownerId,
      sessionId: args.sessionId,
      stayId: args.stayId,
      providerId: args.providerId,
      affiliateUrl: args.affiliateUrl,
      ...(args.turnId ? { turnId: args.turnId } : {}),
      ...(args.conversationId ? { conversationId: args.conversationId } : {}),
      createdAt: new Date().toISOString(),
    };
    this.clicks.push(click);
    return click;
  }

  /** Test helper - read the click log. */
  _getClicks(): readonly AffiliateClickRecord[] {
    return this.clicks;
  }

  // ============== Funnel events (Sprint 17) ==============
  async recordEvent(args: RecordEventArgs): Promise<FunnelEventRecord> {
    const event: FunnelEventRecord = {
      id: `evt_${cryptoRandomId()}`,
      kind: args.kind,
      ownerKind: args.ownerKind,
      ownerId: args.ownerId,
      sessionId: args.sessionId,
      ...(args.ref ? { ref: args.ref.slice(0, 200) } : {}),
      ...(args.metadata ? { metadata: { ...args.metadata } } : {}),
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async listEvents(
    args: { kind?: FunnelEventKind; sessionId?: string; limit?: number } = {},
  ): Promise<FunnelEventRecord[]> {
    const limit = args.limit ?? 5000;
    let view: FunnelEventRecord[] = [...this.events];
    if (args.kind) view = view.filter((e) => e.kind === args.kind);
    if (args.sessionId) view = view.filter((e) => e.sessionId === args.sessionId);
    view.reverse();
    return view.slice(0, limit);
  }

  /** Test helper — read the event log. */
  _getEvents(): readonly FunnelEventRecord[] {
    return this.events;
  }

  async listClicks(
    args: { owner?: OwnerArgs; limit?: number } = {},
  ): Promise<AffiliateClickRecord[]> {
    const limit = args.limit ?? 50;
    // The internal log is append-order; admin views want most-recent-first.
    // Slice from the end + reverse so we don't sort N items unnecessarily.
    let view: AffiliateClickRecord[];
    if (args.owner) {
      const ownerKind = args.owner.ownerKind;
      const ownerId = args.owner.ownerId;
      view = this.clicks.filter((c) => c.ownerKind === ownerKind && c.ownerId === ownerId);
    } else {
      view = [...this.clicks];
    }
    view.reverse();
    return view.slice(0, limit);
  }

  // ============== Migration ==============
  async migrateAnonymousToUser(args: {
    fromSessionId: string;
    toUserId: string;
  }): Promise<MigrationResult> {
    const fromKey = `session:${args.fromSessionId}`;
    const toKey = `user:${args.toUserId}`;
    const sourceBucket = this.tripsByOwner.get(fromKey);
    if (!sourceBucket || sourceBucket.size === 0) {
      return {
        movedUserId: args.toUserId,
        fromSessionId: args.fromSessionId,
        tripsCopied: 0,
        alreadyMigrated: false,
      };
    }
    const destBucket = this.tripsByOwner.get(toKey) ?? new Map<string, SavedTrip>();
    let copied = 0;
    for (const trip of sourceBucket.values()) {
      // De-dupe on proposalId - already-migrated trips don't get duplicated.
      let existsForDest = false;
      for (const existing of destBucket.values()) {
        if (existing.proposalId === trip.proposalId) {
          existsForDest = true;
          break;
        }
      }
      if (existsForDest) continue;
      const moved: SavedTrip = {
        ...trip,
        ownerKind: 'user',
        ownerId: args.toUserId,
      };
      destBucket.set(moved.id, moved);
      // Refresh slug index → owner change must keep the link working.
      if (moved.shareSlug) this.tripsBySlug.set(moved.shareSlug, moved);
      copied += 1;
    }
    this.tripsByOwner.set(toKey, destBucket);
    // Clear source bucket - anonymous record no longer has trips. We
    // keep the empty bucket for audit-style semantics in Postgres.
    sourceBucket.clear();
    return {
      movedUserId: args.toUserId,
      fromSessionId: args.fromSessionId,
      tripsCopied: copied,
      alreadyMigrated: false,
    };
  }

  /** Test helper - clears all in-memory state. */
  reset(): void {
    this.turns.clear();
    this.tripsByOwner.clear();
    this.tripsBySlug.clear();
    this.clicks.length = 0;
  }
}

function ownerKeyOf(args: OwnerArgs): string {
  return `${args.ownerKind}:${args.ownerId}`;
}

function cryptoRandomId(): string {
  // Edge runtime + Node both expose crypto.randomUUID
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
