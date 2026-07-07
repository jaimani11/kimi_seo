import type { SavedTrip } from '@lib/session/session-store';
import type { MonitoringChecker } from './checker';
import type { MonitoringStore, OwnerArgs } from './monitoring-store';
import type { MonitoringEvent } from './types';

/**
 * Monitoring orchestration boundary. Called on-demand by
 * `/api/trips/list` (pull model). For each saved trip:
 *
 *   1. Read the existing snapshot.
 *   2. Skip if `lastCheckAt` is within the throttle window.
 *   3. Otherwise: call the checker. If it returns an event, persist it.
 *      Always update the snapshot.
 *
 * The result is the full unacknowledged-event list for the owner -
 * not just events generated this call. Reason: the UI badge stays
 * consistent across page reloads even if no new event was generated
 * on this fetch.
 *
 * Per-trip iterations are wrapped in try/catch - a checker failure on
 * one trip never stops the others. Same B4/B7 pattern: monitoring is
 * auxiliary; never block the user-visible response.
 */

export const DEFAULT_INTERVAL_MS = 60_000;

export class MonitoringRunner {
  private readonly intervalMs: number;

  constructor(
    private readonly store: MonitoringStore,
    private readonly checker: MonitoringChecker,
    opts: { intervalMs?: number } = {},
  ) {
    // Env override takes precedence; option is for tests.
    const envOverride = parseEnvInterval();
    this.intervalMs = opts.intervalMs ?? envOverride ?? DEFAULT_INTERVAL_MS;
  }

  /**
   * Run on-demand check across the supplied trips, then return the
   * full unacknowledged-event list (grouped by trip).
   */
  async checkOwner(args: {
    owner: OwnerArgs;
    trips: readonly SavedTrip[];
    now?: number;
  }): Promise<Map<string, MonitoringEvent[]>> {
    const now = args.now ?? Date.now();

    for (const trip of args.trips) {
      // Owner-mismatch defense - caller already filters, but a paranoid
      // guard here prevents cross-owner state pollution if the API
      // ever passes someone else's trip by mistake.
      if (trip.ownerKind !== args.owner.ownerKind || trip.ownerId !== args.owner.ownerId) {
        continue;
      }
      try {
        const prev = await this.store.getSnapshot(trip.id);
        if (prev && now - prev.lastCheckAt < this.intervalMs) {
          continue; // not due
        }
        const event = await this.checker.check({
          trip,
          prevSnapshot: prev,
          now,
        });
        const snapshot = {
          tripId: trip.id,
          lastCheckAt: now,
          ...(event
            ? { lastEventAt: now }
            : prev?.lastEventAt !== undefined
              ? { lastEventAt: prev.lastEventAt }
              : {}),
        };
        await this.store.putSnapshot(snapshot);
        if (event) await this.store.recordEvent(event);
      } catch (err) {
        console.warn('[monitoring] check failed for trip', {
          tripId: trip.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const allUnack = await this.store.listEventsForOwner(args.owner);
    const byTrip = new Map<string, MonitoringEvent[]>();
    for (const e of allUnack) {
      const bucket = byTrip.get(e.tripId) ?? [];
      bucket.push(e);
      byTrip.set(e.tripId, bucket);
    }
    return byTrip;
  }
}

function parseEnvInterval(): number | undefined {
  const v = process.env.STAYSCOUT_MONITORING_INTERVAL_MS;
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
