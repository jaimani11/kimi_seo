import type { IntentDelta } from '@core/intent-delta';
import type { TripIntent } from '@core/trip-intent';

const TRIP_INTENT_KEYS: readonly (keyof TripIntent)[] = [
  'destinations',
  'dates',
  'duration',
  'travelers',
  'budget',
  'vibe',
  'preferences',
  'caveats',
  'rawInput',
  'confidence',
] as const;

/**
 * Structurally diff two TripIntents. Top-level fields only - sub-tree
 * deep-equal is good enough for the UI's "what changed" banner.
 */
export function computeIntentDelta(prior: TripIntent, next: TripIntent): IntentDelta {
  const changed: IntentDelta['changed'] = [];
  for (const key of TRIP_INTENT_KEYS) {
    const before = prior[key];
    const after = next[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changed.push({ key, before, after });
    }
  }
  return { added: {}, changed, removed: [] };
}
