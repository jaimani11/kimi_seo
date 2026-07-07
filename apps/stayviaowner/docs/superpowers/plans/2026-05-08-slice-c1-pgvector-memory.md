# Slice C1 Implementation Plan - pgvector Memory

> Executed inline, batched, only pausing for real blockers.

**Goal:** Persistent semantic memory across sessions + devices. The IntentAgent's prompt is enriched with relevant prior preferences ("we always travel in September", "we're vegetarian"); the workspace surfaces a memory hint when retrieval contributes to inference. Mock-safe end-to-end.

**Architecture:** A `MemoryStore` interface owns persistence + retrieval. Two implementations (in-memory default, Postgres+pgvector when DB) and two embedding providers (deterministic bag-of-words default, Anthropic embeddings opt-in). A new `MemoryRecorder` observes turn completion and persists memories per owner; the IntentAgent (via a thin pre-step wrapper) consults `MemoryStore.search` and threads top-K results into the system prompt.

**Tech Stack:** No new deps for the mock path. Postgres path adds `@prisma/client`'s pgvector unsupported-type wrapper for the embedding column (Prisma supports `Unsupported("vector(1024)")` natively). Real-mode embeddings use `@anthropic-ai/sdk`'s embeddings endpoint.

---

## Architectural Tenets (Opus-level)

**1. Memory is owned, not global.** Same owner key as trips: `userId` for authenticated, `sessionId` for anonymous. Migration on sign-in promotes session memory into the user's bucket via the existing migration path (`User.migratedFrom`). Anonymous memory dies with the cookie; authenticated memory survives forever (until the user deletes it).

**2. Retrieval enriches, never replaces, intent inference.** Memories are appended to the system prompt as additional context (a single `<memory>` block); they don't pre-fill any TripIntent fields. The model still does extraction. Reason: memories are signals, not facts - the user can override them anytime ("not this trip - just me, no kids").

**3. The InMemory implementation is real, not stub.** Bag-of-words tokenization + cosine similarity over a bounded ring buffer. Demo gets useful retrieval without DB or embeddings - a freshly-cloned repo plus a single `pnpm dev` should produce visible memory behavior on the second turn.

**4. Embeddings are pluggable + explicit.** `AnthropicEmbedding` only mounts when both `ANTHROPIC_API_KEY` is set AND the explicit opt-in `STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS=1` is set. The default - even with an Anthropic key - stays bag-of-words. Reason: embedding API costs add up; opting in makes it explicit. (Bag-of-words is good enough for the demo prompt sizes.)

**5. Recording is post-completion, idempotent, bounded.** Memories are written from the orchestrator's complete-turn node (after `turn.completed`). Each turn produces at most 3 memory records (rawInput as episodic, structural snapshot of vibe + travelers, optional explicit caveat). Recording failures are logged but never block the turn (same B4/B7 pattern: telemetry never blocks the user).

**6. Retrieval is conservative.** Top-K = 3 by default, with a similarity-score floor (0.45 cosine for embeddings, 0.20 token-overlap for BOW). Below the floor, we skip - don't pollute the prompt with junk. The K + floor live in env-overridable constants for tuning.

**7. The UI surface already exists.** Slice A9 shipped `concierge.memory.hint` as an event. C1 fires it whenever retrieval contributed at least one memory above the floor. The frontend MemoryHintTile renders the hint text. No new UI components.

---

## File Structure

**Create:**
- `src/lib/memory/embedding.ts` - `EmbeddingProvider` interface + `BagOfWordsEmbedding`
- `src/lib/memory/anthropic-embedding.ts` - `AnthropicEmbedding` (lazy-loaded SDK wrapper)
- `src/lib/memory/memory-store.ts` - `MemoryStore` interface + types
- `src/lib/memory/in-memory-memory-store.ts` - process-local impl
- `src/lib/memory/pgvector-memory-store.ts` - Prisma + pgvector impl (gated by feature flag)
- `src/lib/memory/factory.ts` - `getMemoryStore()`, `getEmbeddingProvider()`
- `src/lib/memory/recorder.ts` - `MemoryRecorder.observeTurn()` lifecycle
- `src/lib/memory/retriever.ts` - `MemoryRetriever.searchForTurn()` - wraps the search call, filters by score floor, formats for prompt insertion
- `src/lib/memory/index.ts` - barrel
- `prisma/migrations/<timestamp>_pgvector_memory/migration.sql` - manual SQL migration adding `CREATE EXTENSION IF NOT EXISTS vector` + an embedding column
- `tests/memory-store.test.ts` - contract tests against `InMemoryMemoryStore`
- `tests/memory-recorder.test.ts` - observe-turn → record behavior
- `tests/memory-retriever.test.ts` - score floor, top-K, prompt formatting
- `tests/bag-of-words-embedding.test.ts`

**Modify:**
- `prisma/schema.prisma` - add `embedding` field to `MemoryRecord` (Postgres-only, `Unsupported("vector(1024)")`)
- `src/agents/intent-agent.ts` - accept an optional `memoryRetriever` in the agent context; thread retrieved memories into the user prompt
- `src/core/agent.ts` - extend `AgentContext` with `memoryRetriever?` (optional - keeps existing tests unchanged)
- `src/orchestrator/orchestrator.ts` - wire `MemoryRecorder.observeTurn` into the complete path
- `src/orchestrator/langgraph/nodes.ts` - same wiring in the LangGraph engine's complete node
- `src/orchestrator/engine.ts` - construct + pass memory store/retriever
- `src/lib/env/get-server-features.ts` - surface `memory.kind` ('in-memory' | 'pgvector') and `memory.embedding` ('bag-of-words' | 'anthropic')
- `.env.example` - document the new flags

**Untouched:** the existing `MemoryHinter` (Slice A9 heuristic) - it stays as a fallback when even retrieval is empty. The `concierge.memory.hint` event format is unchanged.

---

## Tasks

### Task 1: Embedding provider + tests

- [ ] `embedding.ts`: `EmbeddingProvider` interface (`embed(text): Promise<number[]>`) + `dimensions: number` getter. `BagOfWordsEmbedding` implementation: tokenize on whitespace + punctuation, lowercase, hash-map into a 256-dim sparse vector, L2-normalize. Deterministic across runs.
- [ ] Tests (`bag-of-words-embedding.test.ts`): same input → same vector; different inputs → different vectors; cosine similarity is in [-1, 1]; semantically related strings score higher than unrelated ones.
- [ ] Verify: typecheck.

### Task 2: MemoryStore interface + InMemory impl + tests

- [ ] `memory-store.ts`: define `MemoryRecord`, `MemorySearchResult`, `RecordMemoryArgs`, `OwnerArgs`, `MemoryStore` interface (`record`, `search`, `clearOwner` for tests).
- [ ] `in-memory-memory-store.ts`: ring buffer per owner (cap 200), search by cosine similarity over precomputed embeddings, returns top-K above the floor. `EmbeddingProvider` is injected at construction.
- [ ] Tests (`memory-store.test.ts`): empty store returns empty; record + search round-trips; per-owner isolation; ring eviction; top-K + floor honored.
- [ ] Verify: typecheck + tests.

### Task 3: MemoryRecorder

- [ ] `recorder.ts`: `MemoryRecorder.observeTurn({turnId, owner, intent, rawInput})` - produces up to 3 memory records (episodic rawInput, structural intent snapshot, vibe-tag list) and persists via `MemoryStore.record`. Try/catch internally - failures log but don't propagate.
- [ ] Tests (`memory-recorder.test.ts`): observes a turn → expected memory records; idempotent on the same turnId; failure path doesn't throw.
- [ ] Verify: typecheck + tests.

### Task 4: MemoryRetriever + IntentAgent wiring

- [ ] `retriever.ts`: `MemoryRetriever.searchForTurn({rawInput, owner})` - calls `MemoryStore.search`, filters by score floor, returns `RetrievedMemories` (top-K + a single formatted prompt block).
- [ ] Extend `AgentContext` with `memoryRetriever?: MemoryRetriever`.
- [ ] `intent-agent.ts`: when `ctx.memoryRetriever` is present, await the search before the model call. Append the formatted memory block to the user prompt (NOT the system prompt - keeps caching effective). Emit `concierge.memory.hint` via a passthrough callback when retrieval returned memories.
- [ ] Tests (`memory-retriever.test.ts`): floor filtering, top-K, prompt formatting, empty result returns no hint.

### Task 5: Orchestrator wiring (both engines)

- [ ] `engine.ts`: factory builds `MemoryStore`, `MemoryRecorder`, `MemoryRetriever` from env. Passes recorder to orchestrator constructor; passes retriever into `AgentContext` for the IntentAgent step.
- [ ] Hand-rolled `Orchestrator`: call `recorder.observeTurn(...)` in the post-`turn.completed` block (right next to `sessionStore.putTurn`).
- [ ] LangGraph `complete_turn` node: same call, same place.
- [ ] Verify: existing 270 tests still pass (recorder is opt-in via constructor).

### Task 6: pgvector schema migration + Postgres impl (gated)

- [ ] `prisma/schema.prisma`: add `embedding Unsupported("vector(1024)")?` to `MemoryRecord`. Indexes for owner + similarity search added in raw SQL migration.
- [ ] Migration SQL: `CREATE EXTENSION IF NOT EXISTS vector;`, alter table, create ivfflat index on embedding.
- [ ] `pgvector-memory-store.ts`: `MemoryStore` impl. Uses `prisma.$queryRaw` for similarity search (Prisma's typed query builder doesn't support pgvector ops yet).
- [ ] Factory routes to pgvector impl when `getServerFeatures().database` is true AND env var `STAYSCOUT_PGVECTOR=1` (opt-in - pgvector requires the extension to be installed).
- [ ] No automated tests against Postgres in this slice (would need a Docker DB); mark contract tests as gated integration tests for B7-style "RUN_INTEGRATION_TESTS=1" pattern.
- [ ] Verify: typecheck + lint + build (ensures the schema generates).

### Task 7: Anthropic embeddings (opt-in)

- [ ] `anthropic-embedding.ts`: lazy-imports the SDK. Used only when `STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS=1` is set + key is present.
- [ ] Factory routes to `AnthropicEmbedding` only when both conditions hold; else `BagOfWordsEmbedding`.
- [ ] Verify: typecheck + lint + build.

### Task 8: Pipeline + changelog + slice-c1 tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`. Fix anything that flares.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-c1.md`.
- [ ] Tag `slice-c1`. Commit at logical milestones.

---

## What stays unchanged

- `OrchestratorEvent` shape - no new event kinds; the existing `concierge.memory.hint` carries the new richer content.
- LangGraph engine architecture - same nodes, with the recorder hook spliced into `complete_turn`.
- Existing `MemoryHinter` (A9) stays as the heuristic fallback; the new `MemoryRecorder` runs alongside it.
- All Slice A + B tests - none should break.

## Out of C1 scope (deferred)

- Embedding-aware semantic clustering of memories (compaction).
- Memory editing UI (delete a memory, mark a memory as wrong).
- Cross-user memory (collaborative trips).
- Privacy controls beyond the existing trip ownership model.
- Real Anthropic embeddings cost analysis on `/admin` - Slice C5 admin extensions.
