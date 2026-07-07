import type { MonitoringEvent, MonitoringSnapshot } from './types';
import type { MonitoringStore, OwnerArgs } from './monitoring-store';

/**
 * Process-local monitoring store. Snapshots keyed by tripId; events
 * keyed by `${ownerKind}:${ownerId}` so list-by-owner is O(events-of-
 * one-owner) without a global scan.
 *
 * HMR-safe via globalThis - same buffer across dev reloads so
 * monitoring state isn't reset every time you touch a file.
 */
export class InMemoryMonitoringStore implements MonitoringStore {
  private readonly snapshots = new Map<string, MonitoringSnapshot>();
  private readonly eventsByOwner = new Map<string, MonitoringEvent[]>();

  async getSnapshot(tripId: string): Promise<MonitoringSnapshot | null> {
    return this.snapshots.get(tripId) ?? null;
  }

  async putSnapshot(snapshot: MonitoringSnapshot): Promise<void> {
    this.snapshots.set(snapshot.tripId, snapshot);
  }

  async recordEvent(event: MonitoringEvent): Promise<void> {
    const key = ownerKey(event);
    const bucket = this.eventsByOwner.get(key) ?? [];
    bucket.push(event);
    this.eventsByOwner.set(key, bucket);
  }

  async listEventsForOwner(
    args: OwnerArgs & { includeAcknowledged?: boolean },
  ): Promise<MonitoringEvent[]> {
    const bucket = this.eventsByOwner.get(ownerKey(args));
    if (!bucket) return [];
    return args.includeAcknowledged ? [...bucket] : bucket.filter((e) => !e.acknowledged);
  }

  async acknowledgeAll(args: OwnerArgs & { tripId: string }): Promise<number> {
    const bucket = this.eventsByOwner.get(ownerKey(args));
    if (!bucket) return 0;
    let flipped = 0;
    for (const e of bucket) {
      if (e.tripId === args.tripId && !e.acknowledged) {
        e.acknowledged = true;
        flipped += 1;
      }
    }
    return flipped;
  }

  /** Test-only - wipe all state. */
  _reset(): void {
    this.snapshots.clear();
    this.eventsByOwner.clear();
  }
}

function ownerKey(args: OwnerArgs): string {
  return `${args.ownerKind}:${args.ownerId}`;
}

// Process-singleton - same store across orchestrator + admin views +
// /api/trips/list. HMR-safe on globalThis.
declare global {
  var __stayscoutMonitoringStore: InMemoryMonitoringStore | undefined;
}

export function getInMemoryMonitoringStore(): InMemoryMonitoringStore {
  if (!globalThis.__stayscoutMonitoringStore) {
    globalThis.__stayscoutMonitoringStore = new InMemoryMonitoringStore();
  }
  return globalThis.__stayscoutMonitoringStore;
}
