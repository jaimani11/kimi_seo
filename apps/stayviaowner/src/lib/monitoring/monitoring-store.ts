import type { MonitoringEvent, MonitoringSnapshot } from './types';

export interface OwnerArgs {
  ownerKind: 'user' | 'session';
  ownerId: string;
}

export interface MonitoringStore {
  /** Last-check snapshot for one trip. Null if never checked. */
  getSnapshot(tripId: string): Promise<MonitoringSnapshot | null>;

  /** Persist a snapshot. Used by the runner after each check. */
  putSnapshot(snapshot: MonitoringSnapshot): Promise<void>;

  /** Append-only event record. */
  recordEvent(event: MonitoringEvent): Promise<void>;

  /** All events for an owner, optionally filtered to unacknowledged. */
  listEventsForOwner(
    args: OwnerArgs & { includeAcknowledged?: boolean },
  ): Promise<MonitoringEvent[]>;

  /** Mark every event for `tripId` (for this owner) as acknowledged.
   *  Idempotent. Returns the number of events flipped. */
  acknowledgeAll(args: OwnerArgs & { tripId: string }): Promise<number>;
}
