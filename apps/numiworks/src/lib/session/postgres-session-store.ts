import type { PrismaClient } from '@prisma/client';
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

/**
 * Postgres-backed SessionStore - active when DATABASE_URL is set. Uses
 * Prisma client for type-safe queries.
 *
 * Owner model: User.id is the canonical owner key for both authenticated
 * users (Clerk userId) and anonymous sessions ("anon_<uuid>"). For
 * anonymous owners we ensure-create the User row on first save with
 * isAnonymous=true. Migration moves trips from anon User to authenticated
 * User and stamps User.migratedFrom for audit.
 */
export class PostgresSessionStore implements SessionStore {
  constructor(private readonly db: PrismaClient) {}

  // ============== Turns ==============
  // Slice B1: turns are orchestrator-scoped + ephemeral. We don't persist
  // every turn to the DB yet - that's a Slice B2 concern when LangGraph's
  // checkpointer wants graph-state replay. For now, turn lookup falls
  // back to an in-memory map shared across this process.
  private readonly turnCache = new Map<string, TurnRecord>();

  async getTurn(turnId: string): Promise<TurnRecord | null> {
    return this.turnCache.get(turnId) ?? null;
  }

  async putTurn(turn: TurnRecord): Promise<void> {
    this.turnCache.set(turn.turnId, turn);
  }

  // ============== Trips ==============
  async saveTrip(args: SaveTripArgs): Promise<SavedTrip> {
    await this.ensureUser(args.ownerKind, args.ownerId);

    const row = await this.db.trip.upsert({
      where: {
        userId_proposalId: { userId: args.ownerId, proposalId: args.proposalId },
      },
      create: {
        userId: args.ownerId,
        proposalId: args.proposalId,
        proposalSummary: args.proposalSummary as never,
        proposal: args.proposal as never,
        intent: args.intent as never,
        ...(args.conversationId ? { conversationId: args.conversationId } : {}),
      },
      update: {},
    });

    return rowToSavedTrip(row, args.ownerKind);
  }

  async listTrips(args: OwnerArgs): Promise<SavedTrip[]> {
    const rows = await this.db.trip.findMany({
      where: { userId: args.ownerId },
      orderBy: { bookmarkedAt: 'desc' },
    });
    return rows.map((r) => rowToSavedTrip(r, args.ownerKind));
  }

  async getTrip(args: OwnerArgs & { tripId: string }): Promise<SavedTrip | null> {
    const row = await this.db.trip.findFirst({
      where: { id: args.tripId, userId: args.ownerId },
    });
    return row ? rowToSavedTrip(row, args.ownerKind) : null;
  }

  async deleteTrip(args: OwnerArgs & { tripId: string }): Promise<boolean> {
    const result = await this.db.trip.deleteMany({
      where: { id: args.tripId, userId: args.ownerId },
    });
    return result.count > 0;
  }

  // ============== Share links ==============
  async mintShareSlug(args: OwnerArgs & { tripId: string }): Promise<string | null> {
    const existing = await this.db.trip.findFirst({
      where: { id: args.tripId, userId: args.ownerId },
      select: { shareSlug: true },
    });
    if (!existing) return null;
    if (existing.shareSlug) return existing.shareSlug;

    // Generate + persist atomically. The @unique constraint on shareSlug
    // makes the cosmically-rare collision retryable; we cap the loop.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slug = generateShareSlug();
      try {
        await this.db.trip.update({
          where: { id: args.tripId },
          data: { shareSlug: slug },
        });
        return slug;
      } catch (err) {
        // Prisma raises P2002 on unique constraint conflict - retry.
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: string }).code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('mintShareSlug: 3 collisions in a row - entropy source unhealthy?');
  }

  async getTripBySlug(slug: string): Promise<SharedTrip | null> {
    const row = await this.db.trip.findUnique({
      where: { shareSlug: slug },
    });
    if (!row) return null;
    const intent = row.intent as SavedTrip['intent'];
    return {
      proposalId: row.proposalId,
      proposalSummary: row.proposalSummary as SavedTrip['proposalSummary'],
      proposal: row.proposal as SavedTrip['proposal'],
      intent: { ...intent, rawInput: '' }, // mask
      bookmarkedAt: row.bookmarkedAt.toISOString(),
    };
  }

  // ============== Affiliate clicks ==============
  async recordClick(args: RecordClickArgs): Promise<AffiliateClickRecord> {
    // Authenticated user → write userId; anonymous → leave userId null
    // (the row still has sessionId, which is the anon owner key).
    // ensureUser keeps Prisma's foreign-key relation healthy when the
    // owner is a User row (covers fresh authenticated users who haven't
    // saved a trip yet).
    if (args.ownerKind === 'user') {
      await this.ensureUser('user', args.ownerId);
    }
    const row = await this.db.affiliateClick.create({
      data: {
        sessionId: args.sessionId,
        ...(args.ownerKind === 'user' ? { userId: args.ownerId } : {}),
        stayId: args.stayId,
        providerId: args.providerId,
        affiliateUrl: args.affiliateUrl,
        ...(args.turnId ? { turnId: args.turnId } : {}),
      },
    });
    return {
      id: row.id,
      ownerKind: args.ownerKind,
      ownerId: args.ownerId,
      sessionId: row.sessionId,
      stayId: row.stayId,
      providerId: row.providerId,
      affiliateUrl: row.affiliateUrl,
      ...(row.turnId ? { turnId: row.turnId } : {}),
      ...(args.conversationId ? { conversationId: args.conversationId } : {}),
      createdAt: row.createdAt.toISOString(),
    };
  }

  // ============== Funnel events (Sprint 17) ==============
  // Same posture as `turnCache` above: events live in an in-memory
  // append-log on this Postgres-backed store too. A Prisma schema
  // for FunnelEvent would land in a follow-up migration sprint; for
  // now both stores share an in-memory ringless log so the admin
  // dashboard works identically in dev + with DATABASE_URL set.
  private readonly events: FunnelEventRecord[] = [];

  async recordEvent(args: RecordEventArgs): Promise<FunnelEventRecord> {
    const event: FunnelEventRecord = {
      id: `evt_${crypto.randomUUID()}`,
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

  async listClicks(
    args: { owner?: OwnerArgs; limit?: number } = {},
  ): Promise<AffiliateClickRecord[]> {
    const limit = args.limit ?? 50;
    const where = args.owner
      ? args.owner.ownerKind === 'user'
        ? { userId: args.owner.ownerId }
        : { sessionId: args.owner.ownerId, userId: null }
      : undefined;
    const rows = await this.db.affiliateClick.findMany({
      ...(where ? { where } : {}),
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      ownerKind: row.userId ? ('user' as const) : ('session' as const),
      ownerId: row.userId ?? row.sessionId,
      sessionId: row.sessionId,
      stayId: row.stayId,
      providerId: row.providerId,
      affiliateUrl: row.affiliateUrl,
      ...(row.turnId ? { turnId: row.turnId } : {}),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  // ============== Migration ==============
  async migrateAnonymousToUser(args: {
    fromSessionId: string;
    toUserId: string;
  }): Promise<MigrationResult> {
    // Already migrated? Check User.migratedFrom on the destination.
    const destUser = await this.db.user.findUnique({
      where: { id: args.toUserId },
    });
    if (destUser?.migratedFrom === args.fromSessionId) {
      return {
        movedUserId: args.toUserId,
        fromSessionId: args.fromSessionId,
        tripsCopied: 0,
        alreadyMigrated: true,
      };
    }

    return this.db.$transaction(async (tx) => {
      // Ensure both User rows exist.
      await tx.user.upsert({
        where: { id: args.toUserId },
        create: {
          id: args.toUserId,
          isAnonymous: false,
          migratedFrom: args.fromSessionId,
        },
        update: { migratedFrom: args.fromSessionId },
      });

      // Move trips. Use updateMany rather than copy so the trip ids stay
      // stable - any client cache (e.g. saved-trips panel) keeps working.
      // The @@unique([userId, proposalId]) constraint prevents collisions
      // - if the destination user already has the same proposalId, the
      // anon trip is dropped.
      const sourceTrips = await tx.trip.findMany({
        where: { userId: args.fromSessionId },
        select: { id: true, proposalId: true },
      });
      let copied = 0;
      for (const t of sourceTrips) {
        const collision = await tx.trip.findUnique({
          where: {
            userId_proposalId: { userId: args.toUserId, proposalId: t.proposalId },
          },
        });
        if (collision) {
          await tx.trip.delete({ where: { id: t.id } });
        } else {
          await tx.trip.update({
            where: { id: t.id },
            data: { userId: args.toUserId },
          });
          copied += 1;
        }
      }

      return {
        movedUserId: args.toUserId,
        fromSessionId: args.fromSessionId,
        tripsCopied: copied,
        alreadyMigrated: false,
      };
    });
  }

  // ============== Helpers ==============
  private async ensureUser(ownerKind: 'user' | 'session', ownerId: string): Promise<void> {
    await this.db.user.upsert({
      where: { id: ownerId },
      create: { id: ownerId, isAnonymous: ownerKind === 'session' },
      update: {},
    });
  }
}

function rowToSavedTrip(
  row: {
    id: string;
    userId: string;
    conversationId: string | null;
    proposalId: string;
    proposalSummary: unknown;
    proposal: unknown;
    intent: unknown;
    shareSlug?: string | null;
    bookmarkedAt: Date;
  },
  ownerKind: 'user' | 'session',
): SavedTrip {
  return {
    id: row.id,
    ownerKind,
    ownerId: row.userId,
    ...(row.conversationId ? { conversationId: row.conversationId } : {}),
    proposalId: row.proposalId,
    proposalSummary: row.proposalSummary as SavedTrip['proposalSummary'],
    proposal: row.proposal as SavedTrip['proposal'],
    intent: row.intent as SavedTrip['intent'],
    ...(row.shareSlug ? { shareSlug: row.shareSlug } : {}),
    bookmarkedAt: row.bookmarkedAt.toISOString(),
  };
}
