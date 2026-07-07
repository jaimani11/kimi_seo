# Slice B2 Implementation Plan - Orchestrator → LangGraph

> **For agentic workers:** This plan is executed inline, batched, only pausing for real blockers.

**Goal:** Replace the hand-rolled `Orchestrator` with a LangGraph-driven engine, preserving the public `run()` AsyncIterable contract and event stream byte-for-byte (modulo timestamps and ids). Two engines coexist behind a `STAYSCOUT_ORCHESTRATOR` flag during rollout.

**Architecture:** A `LangGraphOrchestrator` class implements the same `run()` shape as the existing `Orchestrator`. Internally, a `StateGraph` drives execution; events are pushed to a typed async queue via a `RunnableConfig`-supplied emitter. The runner exposes the queue as the AsyncIterable. A factory in `@orchestrator/engine` picks between engines based on the flag. Postgres checkpointing comes via `@langchain/langgraph-checkpoint-postgres` when `DATABASE_URL` is set; `MemorySaver` otherwise.

**Tech Stack:** `@langchain/langgraph` (1.3.0), `@langchain/langgraph-checkpoint-postgres` (1.0.1), `@langchain/core` (1.1.45).

---

## Architectural Tenets (Opus-level decisions)

These choices shape every task. Departures need explicit justification.

**1. Two engines coexist during rollout.**
A `STAYSCOUT_ORCHESTRATOR` env flag selects the engine. Default: `hand-rolled`. Opt-in: `langgraph`. Hand-rolled is removed in a later sub-slice once parity is proven against real traffic. Reason: 397 lines of working, tested code being rewritten - risk-management trumps "clean" replacement.

**2. Public API is invariant.**
`Orchestrator.run(req, ctx)` returning `AsyncIterable<OrchestratorEvent>` is the contract. The Next route handler, the singleton, all 16 orchestrator-related tests - none change. Reason: lockable contract = scoped change.

**3. Minimal graph state.**
Channels carry only data needed for branching + checkpointing (request, priorTurn, intent, searchResult, proposal, agentTrace). Events emit via a side-channel queue, not state. Reason: smaller state = smaller checkpoints = faster persist; events flow time-ordered, not batched at node end.

**4. Mock-safe checkpointer.**
`MemorySaver` (LangGraph built-in) when `DATABASE_URL` is unset. `PostgresSaver` from `@langchain/langgraph-checkpoint-postgres` otherwise. Same `BaseCheckpointSaver` interface, same node code. Reason: keyless dev experience preserved; adding `DATABASE_URL` flips persistence on, no other change.

**5. Streaming via emitter, not stream-mode.**
Each node closes over an `emit(event)` callback obtained from `RunnableConfig`. The runner's AsyncIterable yields from the emitter's queue as nodes call it. We do not use LangGraph's `streamMode='updates'` - its event shape doesn't map cleanly to our discriminated union, and node-end batching loses the within-node ordering we rely on (e.g., `step.completed` then `intent.extracted`). Reason: faithful event sequencing, decoupled from LangGraph's emission model.

**6. Stateful concerns isolated per Orchestrator instance.**
`seenSessions`, `seenTurnIds`, `hinterBySession` live on the `LangGraphOrchestrator` instance - not in graph state. Reason: these are runtime invariants that must survive across turns within the same process; they're not part of the graph's data flow.

---

## File Structure

**Create:**
- `src/orchestrator/langgraph/event-queue.ts` - typed AsyncIterable-backed queue for emitter pattern
- `src/orchestrator/langgraph/state.ts` - graph state channel definitions (shared types)
- `src/orchestrator/langgraph/nodes.ts` - node functions (bootstrap, intent, search, compose, refine, mood, memory, complete)
- `src/orchestrator/langgraph/graph.ts` - `buildGraph()` - StateGraph definition + edges
- `src/orchestrator/langgraph/checkpointer.ts` - factory: MemorySaver | PostgresSaver
- `src/orchestrator/langgraph/orchestrator.ts` - `LangGraphOrchestrator` class with same `run()` contract
- `src/orchestrator/langgraph/index.ts` - barrel
- `src/orchestrator/engine.ts` - `getOrchestrator()` factory honoring the env flag
- `tests/langgraph-orchestrator.test.ts` - same scenarios as `orchestrator.test.ts` against the LangGraph engine
- `tests/orchestrator-parity.test.ts` - runs both engines, asserts event-stream equivalence

**Modify:**
- `src/orchestrator/singleton.ts` - delegate to `engine.ts` factory
- `src/lib/env/get-server-features.ts` - surface `orchestratorEngine: 'hand-rolled' | 'langgraph'`
- `package.json` - add deps
- `.env.example` - document `STAYSCOUT_ORCHESTRATOR`

**Untouched:** `orchestrator.ts` (legacy hand-rolled), `intent-delta.ts`, `proposal-builder.ts`, `proposal-diff.ts`, `synthesize-adaptation.ts` - these stay shared between engines.

---

## Tasks

### Task 1: Add deps + event queue + state shape

**Files:**
- Create: `src/orchestrator/langgraph/event-queue.ts`
- Create: `src/orchestrator/langgraph/state.ts`
- Modify: `package.json`

- [ ] Add `@langchain/langgraph`, `@langchain/langgraph-checkpoint-postgres`, `@langchain/core` to deps. Run `pnpm install`. Verify `pnpm build` still works.
- [ ] Build `event-queue.ts`: `createEventQueue<T>()` returns `{ emit(t), close(err?), iterate() }`. `iterate()` is an AsyncIterable that yields until close, then re-throws if err. Backed by a deque of pending values + a deque of pending promise resolvers.
- [ ] Build `state.ts`: define `GraphState` interface with channels for `request`, `priorTurn`, `intent`, `searchResult`, `proposal`, `proposalRef`, `agentTrace`, `terminated`. Plus a non-channel `RuntimeContext` for `signal` + `emit` + `deps`.
- [ ] Verify: `pnpm typecheck` clean.

### Task 2: Graph skeleton + bootstrap + intent + search nodes

**Files:**
- Create: `src/orchestrator/langgraph/nodes.ts`
- Create: `src/orchestrator/langgraph/graph.ts`

- [ ] Implement `bootstrap` node: idempotency check, session.started (once), priorTurn load, turn.started. If duplicate turnId, set `terminated=true` and emit turn.failed.
- [ ] Implement `intent` node: agent.step.started, run IntentAgent, agent.step.completed, intent.extracted/refined.
- [ ] Implement `search` node: agent.step.started, provider.search, provider.search.completed, agent.step.completed. Empty result → emits concierge.message + sets `terminated=true` (skips compose).
- [ ] `graph.ts`: build a StateGraph with nodes wired bootstrap → intent → search. Conditional edge from search to either `compose_decide` or END based on `terminated`.
- [ ] Verify: `pnpm typecheck` + `pnpm lint` clean. (No tests yet - graph isn't runnable end-to-end.)

### Task 3: Compose/refine branch + concierge

- [ ] Implement `compose_decide` (router): looks at `request.type` + presence of `priorTurn.proposal`, returns `'compose'` or `'refine'`.
- [ ] Implement `compose_emit`: build proposal, build proposalRef, emit shimmering + ready + bookmarkable + concierge.message.
- [ ] Implement `refine_emit`: build proposal, build proposalRef, emit refining + adaptation (if any) + evolved + bookmarkable + concierge.message.
- [ ] Wire conditional edges: `search` → `compose_decide` → `compose_emit | refine_emit` → `mood_or_complete` (next task).
- [ ] Verify: typecheck + lint clean.

### Task 4: Mood + memory + complete + persist

- [ ] Implement `mood` node: agent.step.started, MoodSnapshotAgent.run, step.completed + mood.snapshot.ready. Catches errors, emits step.failed with `recoverable: true`, never terminates.
- [ ] Implement `memory_hint`: hinter.observe + evaluate, emit concierge.memory.hint if any.
- [ ] Implement `complete`: emit turn.completed, persist via sessionStore.putTurn.
- [ ] Wire: compose/refine → mood → memory → complete → END.
- [ ] Verify: typecheck + lint clean.

### Task 5: LangGraphOrchestrator class

**Files:**
- Create: `src/orchestrator/langgraph/orchestrator.ts`
- Create: `src/orchestrator/langgraph/index.ts`

- [ ] `LangGraphOrchestrator` class: constructor takes same `OrchestratorOptions` as legacy. Holds `seenSessions`, `seenTurnIds`, `hinterBySession` Maps.
- [ ] `run(req, ctx)`: builds queue, kicks off `graph.invoke({...initialState}, {configurable: {emit, signal, deps, instance}})`, returns `queue.iterate()`. Awaits invocation in background; on success closes the queue, on error closes with error.
- [ ] Barrel from `index.ts`.
- [ ] Verify: typecheck + lint clean.

### Task 6: Checkpointer + engine factory + flag

**Files:**
- Create: `src/orchestrator/langgraph/checkpointer.ts`
- Create: `src/orchestrator/engine.ts`
- Modify: `src/orchestrator/singleton.ts`, `src/lib/env/get-server-features.ts`, `.env.example`

- [ ] `checkpointer.ts`: `getCheckpointer()` - returns `MemorySaver` when `getServerFeatures().database` is false; `PostgresSaver` when true. Singleton.
- [ ] `engine.ts`: `getOrchestrator()` reads `STAYSCOUT_ORCHESTRATOR` env (default `hand-rolled`). Returns either `Orchestrator` (legacy) or `LangGraphOrchestrator`, both shaped as `{ run(...): AsyncIterable<OrchestratorEvent> }`.
- [ ] Update `singleton.ts` to delegate.
- [ ] Add `orchestratorEngine` field to `getServerFeatures()`.
- [ ] Document `STAYSCOUT_ORCHESTRATOR` in `.env.example`.
- [ ] Verify: typecheck + lint clean.

### Task 7: LangGraph parity tests

**Files:**
- Create: `tests/langgraph-orchestrator.test.ts`
- Create: `tests/orchestrator-parity.test.ts`

- [ ] `langgraph-orchestrator.test.ts`: mirrors the existing `orchestrator.test.ts` (compose, refine, no-stays, idempotency, abort) against `LangGraphOrchestrator`.
- [ ] `orchestrator-parity.test.ts`: runs the same `ConciergeRequest` through both engines, normalizes timestamps + step ids, asserts the resulting event sequences are equivalent.
- [ ] Verify: `pnpm test` - all tests pass (legacy tests + new langgraph tests + parity).

### Task 8: Pipeline + tag

- [ ] Run full pipeline: typecheck, lint, format:check, test, build. Fix any issues.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b2.md` summarizing what shipped, the engine flag matrix, and B3 next.
- [ ] Tag `slice-b2`. Commit at logical milestones throughout.

---

## What stays unchanged

- `Orchestrator` (legacy) class - still exists, still default until flag flips.
- All 119 existing tests pass against legacy.
- All call sites (`/api/concierge` route, singleton, frontend hooks) - unchanged.
- `OrchestratorEvent` type - invariant.
- `proposal-builder`, `proposal-diff`, `synthesize-adaptation`, `intent-delta` - shared utilities.

## Cutover criteria (future sub-slice)

To flip the default to `langgraph`:
- Parity test green for ≥2 weeks against real traffic in dev.
- Zero `[langgraph]` console errors in production logs.
- Postgres checkpointer verified to recover an in-flight turn after pod restart.

Until then, `STAYSCOUT_ORCHESTRATOR=langgraph` is opt-in for testing.
