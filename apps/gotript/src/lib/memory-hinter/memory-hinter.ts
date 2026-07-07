import type { MemoryHint } from '@core/memory';
import type { TripIntent, VibeTag } from '@core/trip-intent';

export interface CompletedTurn {
  intent: TripIntent;
}

/**
 * Session-scoped heuristic detector. Slice A pattern: 3+ turns sharing a
 * vibe tag → fire a hint about that preference. Fires at most once per
 * session - once the orchestrator emits the hint, it should call
 * markFired() so we don't repeat.
 *
 * Slice C replaces this with the real Memory Agent reading from pgvector
 * cross-session. Same MemoryHint output shape; the orchestrator's
 * concierge.memory.hint event wire stays identical.
 */
export class MemoryHinter {
  private observed: CompletedTurn[] = [];
  private fired = false;
  private static MIN_OBSERVATIONS = 3;

  observeTurn(turn: CompletedTurn): void {
    this.observed.push(turn);
  }

  /**
   * Evaluate the observed turns. Returns a hint if the threshold is met
   * AND we haven't fired one yet this session. Otherwise null.
   */
  evaluate(): MemoryHint | null {
    if (this.fired) return null;
    if (this.observed.length < MemoryHinter.MIN_OBSERVATIONS) return null;

    const tally = this.tallyVibeTags();
    const dominant = pickDominant(tally, MemoryHinter.MIN_OBSERVATIONS);
    if (!dominant) return null;

    const message = phraseFor(dominant.tag);
    if (!message) return null;
    return {
      message,
      signalKey: dominant.tag,
      confidence: clamp(dominant.count / this.observed.length, 0, 1),
    };
  }

  markFired(): void {
    this.fired = true;
  }

  reset(): void {
    this.observed = [];
    this.fired = false;
  }

  private tallyVibeTags(): Map<VibeTag, number> {
    const tally = new Map<VibeTag, number>();
    for (const turn of this.observed) {
      const seen = new Set<VibeTag>();
      for (const tag of turn.intent.vibe.tags) {
        if (seen.has(tag)) continue;
        seen.add(tag);
        tally.set(tag, (tally.get(tag) ?? 0) + 1);
      }
    }
    return tally;
  }
}

function pickDominant(
  tally: Map<VibeTag, number>,
  threshold: number,
): { tag: VibeTag; count: number } | null {
  let best: { tag: VibeTag; count: number } | null = null;
  for (const [tag, count] of tally.entries()) {
    if (count < threshold) continue;
    if (!best || count > best.count) best = { tag, count };
  }
  return best;
}

// Restrained phrasings keyed by vibe tag - never anthropomorphic, never
// editorialising. Tags without an entry never fire (better silent than corny).
const PHRASINGS: Partial<Record<VibeTag, string>> = {
  walkable: 'You seem to prefer walkable destinations.',
  'avoid-tourist-traps': 'You consistently steer away from tourist traps.',
  slow: 'You seem to gravitate toward slower-paced trips.',
  luxury: 'You consistently lean toward higher-end stays.',
  'family-friendly': 'Family-friendly seems to be a constant for you.',
  foodie: "Food keeps coming up - you're a foodie traveler.",
  cultural: 'You consistently include cultural depth in your trips.',
  nature: 'Nature settings recur in your trips.',
  beach: 'Beach destinations seem to be a draw.',
  mountains: 'Mountains keep coming up in your travel.',
  remote: 'You consistently choose remote, quieter places.',
  urban: 'You gravitate toward dense urban destinations.',
  wellness: 'Wellness seems to be a recurring priority.',
  romantic: 'Romantic settings keep coming up.',
};

function phraseFor(tag: VibeTag): string | null {
  return PHRASINGS[tag] ?? null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
