# Slice B7 Implementation Plan - Langfuse Traces + Cost/Latency Dashboard

> Executed inline, batched, only pausing for real blockers.

**Goal:** Wire the existing `TraceLogger` seam to a real telemetry sink (Langfuse) and a local-first cost/latency dashboard. Per-turn cost + per-agent latency surface for B-late + Slice C admin.

**Architecture:** A `LangfuseTraceLogger` implements the existing `TraceLogger` interface, lazy-loading `langfuse` SDK only when both env keys are set. A `MemoryTelemetryStore` ring-buffers recent turns + agent runs in-process - always on, the dashboard's data source. A `CompositeTraceLogger` stacks both so events go to Langfuse AND the buffer simultaneously. A small `costs.ts` module computes per-model $ from token counts. A `/admin` dashboard server-renders the buffer state - cost-per-turn, latency per-agent, recent failures.

**Tech Stack:** `langfuse` (3.38). No other new deps.

---

## Architectural Tenets (Opus-level)

**1. The TraceLogger interface is invariant.**
Adding cost/latency means new metadata, not a new method. The existing `recordAgentRun(agent, input, output, durationMs, modelMeta?)` already has a `modelMeta` slot - we extend interpretation, not signature. Reason: keeps every agent caller unchanged.

**2. Telemetry sinks are stackable.**
Real telemetry usually wants TWO sinks: a vendor (Langfuse) for archives + dashboards + a local in-memory buffer for the operator's quick "what just happened?" view. `CompositeTraceLogger(...)` composes them. Reason: one interface, multiple destinations, no coupling.

**3. Cost is computed at sink time, not at agent time.**
The agent provides `{ model, tokensIn, tokensOut }`. The sink computes USD via a per-model price table. Reason: prices change; agents shouldn't carry pricing concerns. The price table lives in `src/lib/observability/costs.ts` next to the trace plumbing.

**4. Mock-safe: no Langfuse keys = no Langfuse import.**
The Langfuse SDK is imported dynamically inside the `LangfuseTraceLogger` constructor. Without keys, the singleton returns `NoOpTraceLogger` and the module is never evaluated. Keeps the keyless build path completely off the Langfuse runtime.

**5. The in-memory buffer is bounded.**
Ring buffer of N=200 turns × M=10 agent runs each. Eviction is FIFO. No persistence - it's intentionally process-local; "what happened in the last hour or two" is the use case.

**6. The dashboard is auth-aware but not auth-required.**
With Clerk wired (`getServerFeatures().auth === true`), `/admin` requires sign-in. Without Clerk, anyone hitting `/admin` sees it - the keyless dev mode shouldn't gate dev-loop telemetry behind sign-in machinery. A simple env-flag (`STAYSCOUT_ADMIN_PUBLIC=1`) overrides for staging/preview deploys.

**7. Failure isolation.**
If Langfuse is unreachable or throws, the request flow MUST NOT be affected. `LangfuseTraceLogger` wraps every sink call in try/catch + console.warn. Same pattern as `recordClick` in B4 - telemetry never blocks the user-visible path.

---

## File Structure

**Create:**
- `src/lib/observability/costs.ts` - per-model price table + `computeCostUsd(model, tokensIn, tokensOut)`
- `src/lib/observability/memory-telemetry-store.ts` - ring buffer + read API
- `src/lib/observability/composite-trace-logger.ts` - stacks N TraceLoggers
- `src/lib/observability/langfuse-trace-logger.ts` - Langfuse SDK adapter
- `src/lib/observability/factory.ts` - `getTraceLogger()` reads env, builds the right composite
- `src/app/admin/page.tsx` - server-rendered dashboard
- `src/app/admin/auth-gate.tsx` - auth gate component
- `src/features/admin/turn-row.tsx`, `summary-card.tsx`, `agent-latency-chart.tsx`
- `tests/costs.test.ts`
- `tests/memory-telemetry-store.test.ts`
- `tests/composite-trace-logger.test.ts`

**Modify:**
- `src/orchestrator/singleton.ts` - wire `getTraceLogger()` instead of `NoOpTraceLogger`
- `src/lib/env/get-server-features.ts` - surface `langfuse` flag (already does); add `adminPublic`
- `.env.example` - document `STAYSCOUT_ADMIN_PUBLIC`
- `src/agents/intent-agent.ts` - pass modelMeta when available (currently misses it)

---

## Tasks

### Task 1: Costs + memory telemetry store

- [ ] `costs.ts`: price table for Claude 4.7 / 4.6 / 4.5 (input + output $/1M tokens). `computeCostUsd(model, tokensIn, tokensOut)` returns USD; unknown model → null (logged once, not per-call).
- [ ] `memory-telemetry-store.ts`:
  - `recordTurnSpan({turnId, sessionId, kind, durationMs, ...})`
  - `recordAgentRun({turnId, agent, model?, tokensIn?, tokensOut?, durationMs, costUsd?, error?})`
  - `getRecentTurns(limit)`, `getSummary()` (aggregates: turns count, avg duration, total cost, top errors)
  - Ring buffer 200 turns × 10 agent runs; eviction FIFO.
- [ ] Tests: cost calculator across all priced models + unknown model; ring buffer eviction; summary aggregates.
- [ ] Verify: typecheck.

### Task 2: Composite + Langfuse loggers + factory

- [ ] `composite-trace-logger.ts`: `CompositeTraceLogger(loggers)` calls each in order. Each call wrapped in try/catch (one sink's failure mustn't block others).
- [ ] `langfuse-trace-logger.ts`: dynamic-import `langfuse`. Constructor takes `{publicKey, secretKey, host?}`. `recordEvent` opens/extends a trace per turnId; `recordAgentRun` adds an `observation` (span) with the model + tokens + cost.
- [ ] `factory.ts`: `getTraceLogger()` - reads env, lazily builds the right composite. Cached per-process.
- [ ] Update `orchestrator/singleton.ts` to wire `getTraceLogger()`.
- [ ] Verify: typecheck + lint. With no Langfuse keys, this should still resolve cleanly without importing the Langfuse SDK.

### Task 3: Intent agent modelMeta + agents passthrough

- [ ] Audit each agent for `modelMeta` plumbing. The intent-agent currently misses it - add when the AnthropicModelClient can report it.
- [ ] If the model client doesn't expose token counts on every call, gate the modelMeta on availability (don't fabricate).
- [ ] Verify: existing tests still pass.

### Task 4: Admin dashboard

- [ ] `src/app/admin/page.tsx` - server component. `await getTraceLogger()` to ensure warmup, then read from the memory telemetry store directly. Renders:
  - Top: 4 stat cards (turns, P50/P95 latency, total cost, error rate)
  - Mid: agent latency chart (small inline SVG/CSS bars; no chart lib)
  - Bottom: recent turns table (turnId, sessionId masked, kind, durationMs, cost, status)
- [ ] Auth gate: when `getServerFeatures().auth` is true AND not `STAYSCOUT_ADMIN_PUBLIC=1`, require an authenticated user. Redirect to `/` otherwise.
- [ ] `summary-card.tsx`, `turn-row.tsx`, `agent-latency-chart.tsx` - small presentational components. Voice + tokens consistent with the rest of the UI.
- [ ] Verify: typecheck + lint. Manually visit `/admin` after running a turn.

### Task 5: Pipeline + changelog + tag

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
- [ ] Write `docs/superpowers/changelogs/2026-05-08-slice-b7.md`.
- [ ] Commit at logical milestones. Tag `slice-b7`.

---

## What stays unchanged

- `TraceLogger` interface - invariant.
- All agent code - only the intent-agent gets a small modelMeta plumbing patch (and only when the model client reports tokens).
- LangGraph engine - sees the new composite logger via the same `traceLogger` field.
- All B1–B6 routes / UI - untouched.

## Out of B7 scope (deferred)

- Per-user cost attribution (B-late).
- Conversion-attributed cost (B7 ↔ B4 click-to-conversion linking) - Slice C.
- OpenTelemetry export. Langfuse is enough for B7's "post-hoc trace inspection" use case.
- Long-term storage. Memory store is process-local; Langfuse handles archival.
- Cost budgets / alerting. Slice C admin.
