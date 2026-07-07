import type { MemoryStore, OwnerArgs } from './memory-store';

/**
 * Retrieval shim used by the IntentAgent. Wraps `MemoryStore.search`
 * with:
 *   - score-floor filter (configurable per-deployment)
 *   - top-K cap
 *   - prompt-block formatter ready to splice into the user message
 *
 * Returns `null` when nothing met the floor - the agent threads that
 * straight into "no memory hint to fire" territory.
 */

export interface RetrievedMemoryEntry {
  content: string;
  score: number;
  kind: 'episodic' | 'structural';
}

export interface RetrievedMemories {
  /** Top-K entries above the floor, score-sorted desc. */
  entries: RetrievedMemoryEntry[];
  /** Pre-formatted block for splicing into the user prompt. */
  promptBlock: string;
  /** Best score among the returned entries - used to decide whether
   *  the workspace's `concierge.memory.hint` event fires. */
  topScore: number;
}

export class MemoryRetriever {
  constructor(
    private readonly store: MemoryStore,
    private readonly opts: { topK?: number; scoreFloor?: number } = {},
  ) {}

  async searchForTurn(args: {
    rawInput: string;
    owner: OwnerArgs;
  }): Promise<RetrievedMemories | null> {
    const searchArgs = {
      ...args.owner,
      query: args.rawInput,
      ...(this.opts.topK !== undefined ? { topK: this.opts.topK } : {}),
      ...(this.opts.scoreFloor !== undefined ? { scoreFloor: this.opts.scoreFloor } : {}),
    };
    const results = await this.store.search(searchArgs);
    if (results.length === 0) return null;

    const entries: RetrievedMemoryEntry[] = results.map((r) => ({
      content: r.memory.content,
      score: r.score,
      kind: r.memory.kind,
    }));
    return {
      entries,
      promptBlock: formatPromptBlock(entries),
      topScore: entries[0]?.score ?? 0,
    };
  }
}

/**
 * Format retrieved memories for the user prompt. Lives in the user
 * message (NOT the system prompt) so the per-turn payload doesn't
 * invalidate the cached system block.
 */
function formatPromptBlock(entries: RetrievedMemoryEntry[]): string {
  const lines = entries.map((e) => `- ${e.content}`);
  return [
    '<memory>',
    'Prior signals from this user (use as soft hints, not hard facts - the user can override anytime):',
    ...lines,
    '</memory>',
  ].join('\n');
}
