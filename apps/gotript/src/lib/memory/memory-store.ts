/**
 * Persistence + retrieval boundary for the memory subsystem.
 *
 * Two implementations live behind this interface:
 *   - `InMemoryMemoryStore` - process-local, always available.
 *   - `PgvectorMemoryStore` - Postgres + pgvector when DATABASE_URL is
 *     set + the `vector` extension is enabled.
 *
 * Owner model mirrors trips: `userId` for authenticated users,
 * `sessionId` (anon-prefixed) for anonymous. The migration path that
 * promotes anonymous trips on sign-in (B1) extends to memory in C1.x.
 */

import type { TripIntent } from '@core/trip-intent';

export type MemoryKind =
  /** A single utterance / turn capture. The `content` is a phrase
   *  drawn from rawInput or a short structural snapshot. */
  | 'episodic'
  /** Distilled preferences observed across multiple turns. Slice C1
   *  records these alongside episodic; future compaction (C1.x) merges
   *  episodic → structural. */
  | 'structural';

export interface MemoryRecord {
  id: string;
  ownerKind: 'user' | 'session';
  ownerId: string;
  kind: MemoryKind;
  /** Free-text payload - the model sees this. Keep ≤ 280 chars. */
  content: string;
  /** Optional stable tag for grouping / dedup (e.g. 'family-of-4'). */
  signalKey?: string;
  /** 0..1 - recorder's own confidence in the memory. Search uses it as
   *  a tiebreaker when similarity scores are close. */
  weight?: number;
  /** ISO timestamp. */
  createdAt: string;
  /** Embedding produced at record time. Stored alongside the content
   *  so retrieval doesn't have to re-embed every memory on every
   *  query. */
  embedding: number[];
}

export interface MemorySearchResult {
  memory: MemoryRecord;
  /** Cosine similarity in [-1, 1]. */
  score: number;
}

export interface OwnerArgs {
  ownerKind: 'user' | 'session';
  ownerId: string;
}

export interface RecordMemoryArgs extends OwnerArgs {
  kind: MemoryKind;
  content: string;
  signalKey?: string;
  weight?: number;
  /** Optional intent snapshot - recorder uses it to enrich the
   *  content; not stored as a separate field. */
  intent?: TripIntent;
}

export interface SearchMemoryArgs extends OwnerArgs {
  /** Free-text query. Will be embedded by the store's embedding
   *  provider before similarity search. */
  query: string;
  /** Max number of results to return. Default 3. */
  topK?: number;
  /** Minimum cosine similarity to include a result. Default 0.20 for
   *  the bag-of-words embedding; raise to ~0.45 for Anthropic
   *  embeddings (different distance distributions). */
  scoreFloor?: number;
}

export interface ListForOwnerArgs extends OwnerArgs {
  /** Restrict to records of this kind (admin filter convenience). */
  kind?: MemoryKind;
  /** Cap result size; most-recent-first. Default 50. */
  limit?: number;
}

export interface RemoveMemoryArgs extends OwnerArgs {
  id: string;
}

export interface MemoryStore {
  record(args: RecordMemoryArgs): Promise<MemoryRecord>;
  search(args: SearchMemoryArgs): Promise<MemorySearchResult[]>;
  /**
   * Slice C5 admin - list an owner's memories (most-recent-first), with
   * optional kind filter. Returns all matching records up to `limit`.
   * No similarity ranking; use `search` for that.
   */
  listForOwner(args: ListForOwnerArgs): Promise<MemoryRecord[]>;
  /**
   * Slice C5 admin - distinct owners that have at least one record.
   * Used to render the global "/admin/memories" overview. The Postgres
   * impl (lands in C1.x) returns this from `prisma.memoryRecord.findMany({ distinct: ['userId'] })`
   * - until then, the in-memory impl owns this.
   */
  listAllOwners(): Promise<OwnerArgs[]>;
  /** Test-only - wipe an owner's memories so contract tests stay isolated. */
  clearOwner?(args: OwnerArgs): Promise<void>;
  /**
   * Governance surface — owner-scoped delete of a single memory by id.
   * The owner check (ownerKind + ownerId + id must all match a stored
   * record) prevents one session from deleting another's memories via
   * a crafted API call. Returns true if a record was found + removed.
   */
  removeById?(args: RemoveMemoryArgs): Promise<boolean>;
}
