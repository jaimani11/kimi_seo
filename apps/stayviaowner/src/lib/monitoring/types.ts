/**
 * Monitoring subsystem types. Saved trips become "watched" - the
 * MonitoringRunner periodically (on-demand from /api/trips/list) asks
 * the MonitoringChecker whether anything material has changed; events
 * accumulate in the store until the user acknowledges them.
 */

export type MonitoringEventKind =
  /** Hero stay's price went down by ≥ 2%. */
  | 'price-drop'
  /** Hero stay's price went up by ≥ 2%. */
  | 'price-rise'
  /** Hero stay no longer available for the original dates/composition. */
  | 'unavailable'
  /** A previously-alternative now ranks better than the saved hero. */
  | 'new-alternative'
  /** A new featured stay opened that matches the saved intent better
   *  than the existing top picks. */
  | 'better-match';

export interface MonitoringEvent {
  id: string;
  tripId: string;
  ownerKind: 'user' | 'session';
  ownerId: string;
  kind: MonitoringEventKind;
  /** For price-drop / price-rise, the fractional delta (negative = drop).
   *  Undefined for non-price events. */
  delta?: number;
  /** User-facing one-liner. Editorial-tone, no banned words. */
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface MonitoringSnapshot {
  tripId: string;
  /** Wall-clock ms when this trip was last checked. */
  lastCheckAt: number;
  /** Wall-clock ms of the most recent event for this trip. Used by the
   *  badge to compute "X minutes ago" without a separate query. */
  lastEventAt?: number;
}
