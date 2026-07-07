import type { TripIntent } from '@core/trip-intent';
import type { MemoryStore, OwnerArgs } from './memory-store';

/**
 * Observes completed turns and persists durable memories. Mounted on
 * the orchestrator's complete-turn path; failures are caught + logged
 * so a memory write outage never blocks the user-visible turn flow
 * (same B4/B7 pattern: telemetry-class side effects never block the
 * critical path).
 *
 * Recording strategy: per turn, write up to 3 memories.
 *   1. Episodic: rawInput verbatim (≤ 280 chars) - useful for direct
 *      semantic recall of phrases.
 *   2. Structural: a one-line snapshot of vibe + traveler composition
 *      ("family of 4, walkable, slow") - useful for the intent agent's
 *      enrichment prompt.
 *   3. Optional caveats: the user said "no kids this trip" - recorded
 *      as a structural memory with `signalKey` so search can dedup.
 *
 * Idempotency: a recorder seen the same `turnId` twice no-ops (in-mem
 * via `seenTurnIds`). Re-running a turn ID won't duplicate memories.
 */
export class MemoryRecorder {
  private readonly seenTurnIds = new Set<string>();

  constructor(private readonly store: MemoryStore) {}

  async observeTurn(args: {
    turnId: string;
    owner: OwnerArgs;
    intent: TripIntent;
    rawInput: string;
  }): Promise<void> {
    if (this.seenTurnIds.has(args.turnId)) return;
    this.seenTurnIds.add(args.turnId);

    try {
      // 1. Episodic memory: rawInput truncated.
      const episodicContent = args.rawInput.slice(0, 280).trim();
      if (episodicContent.length > 0) {
        await this.store.record({
          ...args.owner,
          kind: 'episodic',
          content: episodicContent,
          weight: 0.6,
        });
      }

      // 2. Structural memory: a short summary the model can absorb.
      const structuralContent = formatStructuralSnapshot(args.intent);
      if (structuralContent.length > 0) {
        await this.store.record({
          ...args.owner,
          kind: 'structural',
          content: structuralContent,
          signalKey: 'intent-snapshot',
          weight: 0.8,
        });
      }

      // 3. Caveats - explicit one-shot directives the user attached.
      for (const caveat of args.intent.caveats.slice(0, 3)) {
        await this.store.record({
          ...args.owner,
          kind: 'structural',
          content: `caveat: ${caveat.slice(0, 200)}`,
          signalKey: 'caveat',
          weight: 0.7,
        });
      }
    } catch (err) {
      // Never let memory recording break the turn flow.
      console.warn('[memory-recorder] record failed', {
        turnId: args.turnId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

function formatStructuralSnapshot(intent: TripIntent): string {
  const parts: string[] = [];
  const dest = intent.destinations[0];
  if (dest) parts.push(dest.name);
  if (intent.duration.nights > 0) {
    parts.push(`${intent.duration.nights} ${intent.duration.nights === 1 ? 'night' : 'nights'}`);
  }
  if (intent.travelers.groupKind) parts.push(intent.travelers.groupKind);
  const ad = intent.travelers.adults;
  const ch = intent.travelers.children.count;
  if (ad + ch > 0) parts.push(`${ad}A${ch > 0 ? ` + ${ch}C` : ''}`);
  if (intent.vibe.tags.length > 0) parts.push(...intent.vibe.tags.slice(0, 3));
  return parts.join(', ').slice(0, 280);
}
