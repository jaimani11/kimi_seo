import type { EmbeddingProvider } from './embedding';
import { cosineSimilarity } from './embedding';
import type {
  MemoryRecord,
  MemorySearchResult,
  MemoryStore,
  OwnerArgs,
  RecordMemoryArgs,
  RemoveMemoryArgs,
  SearchMemoryArgs,
} from './memory-store';

/**
 * Process-local MemoryStore. Each owner has a bounded ring buffer of
 * memories; eviction is FIFO once the cap is reached.
 *
 * Search is exhaustive O(N) cosine similarity per query - fine for
 * N ≤ 200 (the cap). Larger N would need a vector index; that's the
 * Postgres path's job.
 */

const DEFAULT_PER_OWNER_CAP = 200;
const DEFAULT_TOP_K = 3;
const DEFAULT_SCORE_FLOOR = 0.2;

export class InMemoryMemoryStore implements MemoryStore {
  private readonly buckets = new Map<string, MemoryRecord[]>();
  private readonly cap: number;

  constructor(
    private readonly embedding: EmbeddingProvider,
    opts: { cap?: number } = {},
  ) {
    this.cap = opts.cap ?? DEFAULT_PER_OWNER_CAP;
  }

  async record(args: RecordMemoryArgs): Promise<MemoryRecord> {
    const embedding = await this.embedding.embed(args.content);
    const record: MemoryRecord = {
      id: `mem_${cryptoRandomId()}`,
      ownerKind: args.ownerKind,
      ownerId: args.ownerId,
      kind: args.kind,
      content: args.content,
      ...(args.signalKey ? { signalKey: args.signalKey } : {}),
      ...(args.weight !== undefined ? { weight: args.weight } : {}),
      createdAt: new Date().toISOString(),
      embedding,
    };
    const key = ownerKey(args);
    const bucket = this.buckets.get(key) ?? [];
    bucket.push(record);
    while (bucket.length > this.cap) bucket.shift();
    this.buckets.set(key, bucket);
    return record;
  }

  async search(args: SearchMemoryArgs): Promise<MemorySearchResult[]> {
    const bucket = this.buckets.get(ownerKey(args));
    if (!bucket || bucket.length === 0) return [];
    const queryEmbedding = await this.embedding.embed(args.query);
    const topK = args.topK ?? DEFAULT_TOP_K;
    const floor = args.scoreFloor ?? DEFAULT_SCORE_FLOOR;

    const scored: MemorySearchResult[] = [];
    for (const memory of bucket) {
      const score = cosineSimilarity(queryEmbedding, memory.embedding);
      if (score < floor) continue;
      scored.push({ memory, score });
    }
    // Sort by score desc, then by weight desc (tiebreaker), then by
    // recency desc (newer first).
    scored.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      const wa = a.memory.weight ?? 0.5;
      const wb = b.memory.weight ?? 0.5;
      if (wa !== wb) return wb - wa;
      return Date.parse(b.memory.createdAt) - Date.parse(a.memory.createdAt);
    });
    return scored.slice(0, topK);
  }

  async listForOwner(
    args: OwnerArgs & { kind?: MemoryRecord['kind']; limit?: number },
  ): Promise<MemoryRecord[]> {
    const bucket = this.buckets.get(ownerKey(args));
    if (!bucket || bucket.length === 0) return [];
    const limit = args.limit ?? 50;
    let view = bucket;
    if (args.kind) view = view.filter((m) => m.kind === args.kind);
    // Buckets are insertion-order. Admin wants most-recent-first.
    return [...view].reverse().slice(0, limit);
  }

  async listAllOwners(): Promise<OwnerArgs[]> {
    const owners: OwnerArgs[] = [];
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.length === 0) continue;
      const sep = key.indexOf(':');
      if (sep < 0) continue;
      const ownerKindRaw = key.slice(0, sep);
      const ownerId = key.slice(sep + 1);
      if (ownerKindRaw === 'user' || ownerKindRaw === 'session') {
        owners.push({ ownerKind: ownerKindRaw, ownerId });
      }
    }
    return owners;
  }

  async clearOwner(args: OwnerArgs): Promise<void> {
    this.buckets.delete(ownerKey(args));
  }

  async removeById(args: RemoveMemoryArgs): Promise<boolean> {
    const bucket = this.buckets.get(ownerKey(args));
    if (!bucket) return false;
    const idx = bucket.findIndex((m) => m.id === args.id);
    if (idx < 0) return false;
    bucket.splice(idx, 1);
    return true;
  }

  /** Test-only - wipe everything. */
  _reset(): void {
    this.buckets.clear();
  }

  /** Test/diagnostic - total memories across all owners. */
  size(): number {
    let total = 0;
    for (const bucket of this.buckets.values()) total += bucket.length;
    return total;
  }
}

function ownerKey(args: OwnerArgs): string {
  return `${args.ownerKind}:${args.ownerId}`;
}

function cryptoRandomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
