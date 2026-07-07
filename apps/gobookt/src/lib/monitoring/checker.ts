import type { SavedTrip } from '@lib/session/session-store';
import type { MonitoringEvent, MonitoringEventKind, MonitoringSnapshot } from './types';

/**
 * MonitoringChecker - given a saved trip + last-snapshot, decide
 * whether a material change has happened. Returns at most one event
 * per check (single-badge UX).
 *
 * Two implementations live behind this interface:
 *   - MockMonitoringChecker (this file): deterministic synthetic
 *     events seeded on (tripId, minute-of-now). Always-on for the
 *     keyless dev demo + cheap CI.
 *   - RealMonitoringChecker (C2.x): re-runs `provider.search` with
 *     the trip's intent, diffs against the saved proposal. Lands when
 *     real-provider plumbing is stable.
 */
export interface MonitoringChecker {
  check(args: {
    trip: SavedTrip;
    prevSnapshot: MonitoringSnapshot | null;
    now: number;
  }): Promise<MonitoringEvent | null>;
}

// ============== Mock implementation ==============

interface EventVariant {
  kind: MonitoringEventKind;
  weight: number;
  /** Build the user-facing message + delta given the trip + a 0..1 roll. */
  build: (trip: SavedTrip, roll: number) => { message: string; delta?: number };
}

const VARIANTS: readonly EventVariant[] = [
  {
    kind: 'price-drop',
    weight: 0.45,
    build: (trip, roll) => {
      // -2% to -12%
      const pct = 0.02 + roll * 0.1;
      const delta = -pct;
      const heroName = trip.proposalSummary.heroStayName;
      return {
        delta,
        message: `${heroName} · ↓ ${Math.round(pct * 100)}% since you saved it`,
      };
    },
  },
  {
    kind: 'price-rise',
    weight: 0.15,
    build: (trip, roll) => {
      // +2% to +6%
      const pct = 0.02 + roll * 0.04;
      return {
        delta: pct,
        message: `${trip.proposalSummary.heroStayName} · ↑ ${Math.round(pct * 100)}% - book before it climbs further`,
      };
    },
  },
  {
    kind: 'better-match',
    weight: 0.1,
    build: (trip) => ({
      message: `A new top match for ${trip.proposalSummary.destinationName} just opened`,
    }),
  },
  {
    kind: 'new-alternative',
    weight: 0.05,
    build: (trip) => ({
      message: `New alternative ranked above your saved pick in ${trip.proposalSummary.destinationName}`,
    }),
  },
  {
    kind: 'unavailable',
    weight: 0.05,
    build: (trip) => ({
      message: `${trip.proposalSummary.heroStayName} is briefly unavailable for your dates`,
    }),
  },
];

const NO_EVENT_WEIGHT = 0.2; // remainder; tweak only via VARIANT weights

export class MockMonitoringChecker implements MonitoringChecker {
  async check(args: {
    trip: SavedTrip;
    prevSnapshot: MonitoringSnapshot | null;
    now: number;
  }): Promise<MonitoringEvent | null> {
    // Seed: trip id + current minute. Stable for sub-second retries
    // (idempotent within a minute) without freezing across reloads.
    const minute = Math.floor(args.now / 60_000);
    const seed = fnv1a(`${args.trip.id}:${minute}`);
    const rng = mulberry32(seed);

    const lottery = rng();
    let acc = NO_EVENT_WEIGHT;
    if (lottery < acc) return null; // no event this round
    for (const variant of VARIANTS) {
      acc += variant.weight;
      if (lottery < acc) {
        const built = variant.build(args.trip, rng());
        return {
          id: `mon_${seed.toString(36)}`,
          tripId: args.trip.id,
          ownerKind: args.trip.ownerKind,
          ownerId: args.trip.ownerId,
          kind: variant.kind,
          ...(built.delta !== undefined ? { delta: built.delta } : {}),
          message: built.message,
          createdAt: new Date(args.now).toISOString(),
          acknowledged: false,
        };
      }
    }
    return null;
  }
}

// ============== Internals ==============

/** FNV-1a 32-bit hash. Stable across runs + platforms. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Mulberry32 PRNG - small, deterministic, good enough for demo lottery. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
