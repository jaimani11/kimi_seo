# StayScout Slice A6 - LLM-Synthesized Provider + MoodSnapshotAgent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the empty `LLMSynthesizedProvider` stub with a real Claude-driven generator (4–5 plausible stays for any destination, photo-category mapped to Unsplash, 24h in-memory cache, trademark-safe prompting), and ship the `MoodSnapshotAgent` (curated for known destinations, LLM-generated for unknown - both passing the banned-word lint). Wire the orchestrator to run MoodSnapshot **after** `proposal.ready` so it's pure post-proposal polish - never blocks the materialization moment. After A6, the AI core is feature-complete; A7 builds the UI on top.

**Architecture:** LLM provider becomes a class taking `ModelClient` at construction (instead of a const stub). A new factory `createDefaultProviderRouter(modelClient)` wires the live provider into the orchestrator singleton; tests continue using the existing `routeProvider` const which keeps the stub. `MoodSnapshotAgent` lives in `src/agents/`, conforms to `Agent<{destination}, MoodSnapshot>`, and is invoked by the orchestrator after the proposal step. Mood failures are *always* recoverable - the proposal already shipped.

**Tech additions:** none - Anthropic SDK + Zod + Vitest already in.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §6.2, §7.3, §7.4

---

## Slice A6 file structure

```
src/providers/llm-synthesized/
├── index.ts                  [modify] LLMSynthesizedProvider class + LLMSynthesizedStub
├── prompts.ts                [new] system prompt for generation
├── llm-stay.ts               [new] LLMStay (slim) schema + map to canonical Stay
├── photo-resolver.ts         [new] photo-category → Unsplash ID lookup
└── cache.ts                  [new] in-memory TTL cache keyed by (destination, vibe)

src/providers/index.ts        [modify] add createDefaultProviderRouter(modelClient)

src/agents/
├── mood-snapshot-agent.ts    [new]
├── prompts/
│   └── mood-system.ts        [new]
└── index.ts                  [modify] re-export MoodSnapshotAgent

src/orchestrator/
├── orchestrator.ts           [modify] inject MoodSnapshotAgent + run post-proposal
└── singleton.ts              [modify] wire the real LLM provider via factory

tests/
├── llm-synthesized.test.ts   [new] generator + photo + cache + mapper
├── mood-snapshot-agent.test.ts [new] curated path + LLM path + banned-word retry
├── orchestrator.test.ts      [modify] add mood.snapshot.ready expectation
```

Total: ~10 new files, 3 modified.

---

## Task 1: `LLMStay` slim schema + canonical mapper

The model only generates a slim shape; the mapper fills in `id`, `providerId`, `photos`, `bookingLink`, `fetchedAt`. This is dramatically more reliable than asking the model to produce a full canonical `Stay`.

- [ ] Create `src/providers/llm-synthesized/llm-stay.ts`:
  ```ts
  import { z } from 'zod';
  import type { Stay } from '@core/stay';
  import { providerId, stayId } from '@core/ids';
  import { VibeTagSchema } from '@core/trip-intent';
  import { unsplashPhoto } from '../_shared/photo';
  import { resolvePhotoId } from './photo-resolver';

  // The slim shape we ask Claude to emit.
  export const PhotoCategorySchema = z.enum([
    'cityscape',
    'beach',
    'mountains',
    'countryside',
    'forest',
    'lakeside',
    'island',
    'historic-architecture',
    'desert',
  ]);
  export type PhotoCategory = z.infer<typeof PhotoCategorySchema>;

  export const LLMStaySchema = z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(2).max(80),
    type: z.enum([
      'hotel',
      'villa',
      'apartment',
      'farmhouse',
      'agriturismo',
      'palazzo',
      'guesthouse',
    ]),
    location: z.object({
      country: z.string().length(2),
      region: z.string().optional(),
      locality: z.string().optional(),
      neighborhood: z.string().optional(),
    }),
    description: z.string().min(40).max(280),
    pricePerNight: z.number().int().min(40).max(3000),
    currency: z.string().length(3),
    amenities: z.array(z.string().min(2)).min(1).max(8),
    capacity: z.object({
      sleeps: z.number().int().min(1).max(16),
      bedrooms: z.number().int().min(1).max(8).optional(),
      bathrooms: z.number().int().min(1).max(8).optional(),
    }),
    vibe: z.array(VibeTagSchema).min(1).max(6),
    walkability: z.number().int().min(0).max(100).optional(),
    familyFit: z.number().int().min(0).max(100).optional(),
    remoteness: z.number().int().min(0).max(100).optional(),
    noise: z.number().int().min(0).max(100).optional(),
    photoCategory: PhotoCategorySchema,
  });
  export type LLMStay = z.infer<typeof LLMStaySchema>;

  export const LLMStayBatchSchema = z.object({
    stays: z.array(LLMStaySchema).min(2).max(6),
  });

  /**
   * Map a slim LLMStay to a fully canonical Stay. We mint the namespaced
   * id, attach a category-matched Unsplash photo, set a placeholder
   * booking redirect, and timestamp the record.
   */
  export function mapLLMStayToStay(llm: LLMStay): Stay {
    const ns = `llm-synthesized:${llm.slug}`;
    const photoId = resolvePhotoId(llm.photoCategory);
    return {
      id: stayId(ns),
      providerId: providerId('llm-synthesized'),
      name: llm.name,
      type: llm.type,
      location: llm.location,
      description: llm.description,
      photos: [
        unsplashPhoto({
          id: photoId,
          alt: `${llm.name} - ${llm.photoCategory}`,
          credit: 'Unsplash',
        }),
      ],
      pricing: {
        pricePerNight: { amount: llm.pricePerNight, currency: llm.currency },
        cancellation: 'free',
      },
      amenities: llm.amenities.map((label, i) => ({
        id: `${llm.slug}-amenity-${i}`,
        label,
      })),
      capacity: {
        sleeps: llm.capacity.sleeps,
        ...(llm.capacity.bedrooms !== undefined ? { bedrooms: llm.capacity.bedrooms } : {}),
        ...(llm.capacity.bathrooms !== undefined ? { bathrooms: llm.capacity.bathrooms } : {}),
      },
      signals: {
        ...(llm.walkability !== undefined ? { walkability: llm.walkability } : {}),
        ...(llm.familyFit !== undefined ? { familyFit: llm.familyFit } : {}),
        ...(llm.remoteness !== undefined ? { remoteness: llm.remoteness } : {}),
        ...(llm.noise !== undefined ? { noise: llm.noise } : {}),
        tags: llm.vibe,
      },
      bookingLink: {
        url: `https://example.com/redirect?provider=llm-synthesized&id=${llm.slug}`,
        type: 'redirect',
      },
      fetchedAt: new Date().toISOString(),
    };
  }
  ```

## Task 2: Photo resolver

A small deterministic map from category → known-good Unsplash photo IDs. Real-photo curation happens via Unsplash API in Slice B.

- [ ] Create `src/providers/llm-synthesized/photo-resolver.ts`:
  ```ts
  import type { PhotoCategory } from './llm-stay';

  // Hand-picked Unsplash photo IDs per category. One per category for
  // Slice A; Slice B's UnsplashSearchClient picks per-stay via keywords.
  const PHOTO_BY_CATEGORY: Record<PhotoCategory, string> = {
    cityscape: '1502602898657-3e91760cbb34',
    beach: '1533104816931-20fa691ff6ca',
    mountains: '1568901346375-23c9450c58cd',
    countryside: '1490642914619-7955a3fd483c',
    forest: '1473496169904-658ba7c44d8a',
    lakeside: '1546412414-e1885259563a',
    island: '1499678329028-101435549a4e',
    'historic-architecture': '1531572753322-ad063cecc140',
    desert: '1567880905822-56f8e06fe630',
  };

  export function resolvePhotoId(category: PhotoCategory): string {
    return PHOTO_BY_CATEGORY[category];
  }
  ```

## Task 3: TTL cache

- [ ] Create `src/providers/llm-synthesized/cache.ts`:
  ```ts
  /**
   * Simple TTL-bounded cache keyed by string. Slice A in-memory; Slice B
   * swaps to Redis via the same shape behind a SessionStore-like interface.
   */
  export class TtlCache<V> {
    private readonly entries = new Map<string, { value: V; expiresAt: number }>();
    constructor(private readonly ttlMs: number) {}

    get(key: string): V | null {
      const entry = this.entries.get(key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        this.entries.delete(key);
        return null;
      }
      return entry.value;
    }

    set(key: string, value: V): void {
      this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }

    clear(): void {
      this.entries.clear();
    }
  }
  ```

## Task 4: Generation prompt

- [ ] Create `src/providers/llm-synthesized/prompts.ts`:
  ```ts
  export const LLM_SYNTHESIZED_SYSTEM_PROMPT = `You generate plausible-looking stays for travel destinations. The user has described a trip; produce 4–5 stays whose vibes match.

Strict rules:
- Avoid invented brand names that could be confused with real properties. Use generic descriptive names like "A small palazzo guesthouse near the Duomo" or "Boutique riad in the medina."
- Use only the closed VibeTag taxonomy listed (no other tags).
- Photos are added separately - choose the best photoCategory for each stay.
- Prices realistic for the destination/category, in EUR / USD / GBP / JPY / etc.
- Slugs in kebab-case, unique within this batch.
- Descriptions: 1–2 sentences, restrained editorial voice. Avoid the words: unforgettable, experience, hidden gem, discover, journey, magical, unique, breathtaking, must-see, bucket-list, enchanting, paradise, oasis, gem.

VibeTag taxonomy (use ONLY these): luxury, budget, mid-range, walkable, remote, urban, romantic, family-friendly, group, foodie, cultural, nature, adventure, slow, fast-paced, avoid-tourist-traps, iconic-landmarks, wellness, beach, mountains.

PhotoCategory taxonomy (use ONLY these): cityscape, beach, mountains, countryside, forest, lakeside, island, historic-architecture, desert.`;

  export function buildLlmStayUserPrompt(args: {
    destination: { name: string; country: string; region?: string };
    vibeTags: readonly string[];
    perNightBudget?: { amount: number; currency: string };
    travelers: { adults: number; children: number };
  }): string {
    const sleeps = args.travelers.adults + args.travelers.children;
    const budgetLine = args.perNightBudget
      ? `Per-night budget hint: roughly ${args.perNightBudget.amount} ${args.perNightBudget.currency}.`
      : 'No specific budget mentioned.';
    const vibeLine = args.vibeTags.length > 0
      ? `Vibe: ${args.vibeTags.join(', ')}.`
      : 'No specific vibe.';
    return `Destination: ${args.destination.name} (${args.destination.country}${args.destination.region ? `, ${args.destination.region}` : ''})
Sleeps: ${sleeps}
${vibeLine}
${budgetLine}

Produce 4–5 stays as a {stays: LLMStay[]} object.`;
  }
  ```

## Task 5: `LLMSynthesizedProvider` class

- [ ] Replace `src/providers/llm-synthesized/index.ts` (rewrite - was a stub):
  ```ts
  import type { ModelClient } from '@core/model-client';
  import type {
    Provider,
    ProviderBadge,
    ProviderContext,
    ProviderSearchQuery,
    ProviderSearchResult,
  } from '@core/provider';
  import { providerId } from '@core/ids';
  import { TtlCache } from './cache';
  import { LLMStayBatchSchema, mapLLMStayToStay } from './llm-stay';
  import {
    LLM_SYNTHESIZED_SYSTEM_PROMPT,
    buildLlmStayUserPrompt,
  } from './prompts';

  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  const MODEL_ID = 'claude-haiku-4-5';

  export class LLMSynthesizedProvider implements Provider {
    readonly id = providerId('llm-synthesized');
    readonly displayName = 'StayScout Preview';
    readonly capabilities = {
      realtime: false,
      affiliateAttribution: false,
      supportsAvailability: false,
      supportsBooking: false,
    };

    private readonly cache = new TtlCache<ProviderSearchResult>(CACHE_TTL_MS);

    constructor(private readonly modelClient: ModelClient) {}

    async search(
      query: ProviderSearchQuery,
      _ctx: ProviderContext,
    ): Promise<ProviderSearchResult> {
      const cacheKey = this.buildCacheKey(query);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const dest = query.destinations[0];
      if (!dest) {
        return this.emptyResult();
      }

      const userPrompt = buildLlmStayUserPrompt({
        destination: dest,
        vibeTags: extractVibeTags(query),
        ...(query.budget?.kind === 'per-night'
          ? {
              perNightBudget: {
                amount: query.budget.amount,
                currency: query.budget.currency,
              },
            }
          : {}),
        travelers: {
          adults: query.travelers.adults,
          children: query.travelers.children.count,
        },
      });

      const batch = await this.modelClient.generate({
        model: MODEL_ID,
        system: LLM_SYNTHESIZED_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        responseSchema: LLMStayBatchSchema,
        cacheKey: 'llm-synthesized-stays-v1',
        maxTokens: 3072,
        temperature: 0.6,
      });

      const stays = batch.stays.map(mapLLMStayToStay);
      const badges: ProviderBadge[] = [{ kind: 'preview', label: 'AI Preview' }];

      const result: ProviderSearchResult = {
        stays,
        badges,
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: CACHE_TTL_MS,
          source: 'synthesized',
        },
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    private buildCacheKey(query: ProviderSearchQuery): string {
      const dest = query.destinations[0];
      const vibe = extractVibeTags(query).slice().sort().join('|');
      const budget =
        query.budget?.kind === 'per-night'
          ? `pn:${query.budget.amount}:${query.budget.currency}`
          : query.budget?.kind === 'total'
            ? `t:${query.budget.amount}:${query.budget.currency}`
            : 'b:any';
      return `${dest?.name ?? 'unknown'}|${vibe}|${budget}`;
    }

    private emptyResult(): ProviderSearchResult {
      return {
        stays: [],
        badges: [{ kind: 'preview', label: 'AI Preview' }],
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: 0,
          source: 'synthesized',
        },
      };
    }
  }

  function extractVibeTags(query: ProviderSearchQuery): readonly string[] {
    // The orchestrator passes intent.vibe.tags through query.preferences in
    // Slice A6+ via the intent's own taxonomy. Currently we don't carry vibe
    // tags on ProviderSearchQuery directly, so we grab amenities/avoids as a
    // weak proxy. This becomes richer when the SearchAgent (Slice B) lands.
    const ams = query.preferences?.amenities ?? [];
    const avoids = query.preferences?.avoid ?? [];
    return [...ams, ...avoids];
  }

  // Stub kept for the default `routeProvider` consumed by tests/orchestrator
  // outside the production singleton - returns empty results without
  // touching a model client.
  export const LLMSynthesizedProviderStub: Provider = {
    id: providerId('llm-synthesized'),
    displayName: 'StayScout Preview',
    capabilities: {
      realtime: false,
      affiliateAttribution: false,
      supportsAvailability: false,
      supportsBooking: false,
    },
    async search(_q, _ctx): Promise<ProviderSearchResult> {
      return {
        stays: [],
        badges: [{ kind: 'preview', label: 'AI Preview (stub)' }],
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: 0,
          source: 'synthesized',
        },
      };
    },
  };
  ```

## Task 6: Provider registry - production factory

The orchestrator's default `routeProvider` (which tests use) keeps the stub. The production singleton creates a real LLM provider with the actual model client.

- [ ] Update `src/providers/index.ts`:
  ```ts
  // Layer: providers
  // Deps: core, lib

  import type { Provider } from '@core/provider';
  import type { ProviderId } from '@core/ids';
  import type { TripIntent } from '@core/trip-intent';
  import type { ModelClient } from '@core/model-client';
  import { MockItalyProvider } from './mock-italy';
  import {
    LLMSynthesizedProvider,
    LLMSynthesizedProviderStub,
  } from './llm-synthesized';

  export const ProviderRegistry: Readonly<Record<string, Provider>> = {
    'mock-italy': MockItalyProvider,
    'llm-synthesized': LLMSynthesizedProviderStub,
  };

  /**
   * Default route - used by tests and any caller that doesn't have a
   * model client. Italy queries hit the curated MockItalyProvider; others
   * hit the empty stub.
   */
  export function routeProvider(intent: TripIntent): Provider {
    const dest = intent.destinations[0];
    if (dest && dest.country === 'IT' && MockItalyProvider.knowsDestination(dest)) {
      return MockItalyProvider;
    }
    return LLMSynthesizedProviderStub;
  }

  /**
   * Production factory - builds a router that uses a real LLM provider.
   * Called from the orchestrator singleton at construction time.
   */
  export function createDefaultProviderRouter(
    modelClient: ModelClient,
  ): (intent: TripIntent) => Provider {
    const llmProvider = new LLMSynthesizedProvider(modelClient);
    return (intent) => {
      const dest = intent.destinations[0];
      if (dest && dest.country === 'IT' && MockItalyProvider.knowsDestination(dest)) {
        return MockItalyProvider;
      }
      return llmProvider;
    };
  }

  export function getProvider(id: ProviderId | string): Provider | null {
    return ProviderRegistry[id] ?? null;
  }

  export { MockItalyProvider } from './mock-italy';
  export {
    LLMSynthesizedProvider,
    LLMSynthesizedProviderStub,
  } from './llm-synthesized';
  ```

## Task 7: `MoodSnapshotAgent`

- [ ] Create `src/agents/prompts/mood-system.ts`:
  ```ts
  export const MOOD_SYSTEM_PROMPT = `You write a single-sentence editorial mood snapshot for a travel destination. Restrained, sensory, present tense. Examples:
- "Golden-hour vineyard dinners and slower mornings."
- "Stone hill towns, deep olive groves, and Sundays that stretch into Mondays."

Strict rules:
- One sentence.
- Sensory and grounded - never abstract sales copy.
- Avoid these words: unforgettable, experience, hidden gem, discover, journey, magical, unique, breathtaking, must-see, bucket-list, enchanting, paradise, oasis, gem.
- Never editorialize ("amazing", "stunning", "wonderful").
- Output the field { text: string }. No prose around it.`;
  ```

- [ ] Create `src/agents/mood-snapshot-agent.ts`:
  ```ts
  import { z } from 'zod';
  import type { Agent, AgentContext } from '@core/agent';
  import { agentId } from '@core/ids';
  import type { Destination } from '@core/trip-intent';
  import type { MoodSnapshot } from '@core/reasoning';
  import { CURATED_MOODS, findDestinationBySlugOrAlias } from '@lib/curation';
  import { lintVoice } from '@lib/curation/voice';
  import { MOOD_SYSTEM_PROMPT } from './prompts/mood-system';

  export interface MoodSnapshotAgentInput {
    destination: Destination;
  }

  const ResponseSchema = z.object({ text: z.string().min(8).max(180) });
  const MOOD_AGENT_ID = agentId('mood');
  const MODEL_ID = 'claude-haiku-4-5';

  /**
   * MoodSnapshotAgent. Curated path for known destinations (zero LLM cost,
   * zero latency). LLM path with anti-cliché lint and a single retry for
   * unknown destinations. Throws on persistent banned-word output so the
   * orchestrator suppresses the snapshot - "better silent than corny."
   */
  export const MoodSnapshotAgent: Agent<MoodSnapshotAgentInput, MoodSnapshot> = {
    id: MOOD_AGENT_ID,
    name: 'Mood Snapshot Agent',
    version: '0.1.0',

    async run(input: MoodSnapshotAgentInput, ctx: AgentContext): Promise<MoodSnapshot> {
      const startedAt = performance.now();
      ctx.emit.progress('Composing the vibe');

      // Curated path
      const curated = findCurated(input.destination);
      if (curated) {
        ctx.traceLogger.recordAgentRun(
          MOOD_AGENT_ID,
          input,
          curated,
          Math.round(performance.now() - startedAt),
        );
        return curated;
      }

      // LLM path
      const userPrompt = `Destination: ${input.destination.name} (${input.destination.country}${input.destination.region ? `, ${input.destination.region}` : ''}).`;

      let attempt = 0;
      let lastErr: unknown;
      while (attempt < 2) {
        attempt += 1;
        try {
          const resp = await ctx.modelClient.generate({
            model: MODEL_ID,
            system: MOOD_SYSTEM_PROMPT + (attempt > 1 ? '\n\nYour previous attempt used a banned word - try again with grounded sensory language.' : ''),
            messages: [{ role: 'user', content: userPrompt }],
            responseSchema: ResponseSchema,
            cacheKey: 'mood-snapshot-v1',
            maxTokens: 256,
            temperature: 0.7,
          });
          const lint = lintVoice(resp.text);
          if (!lint.ok) {
            lastErr = new Error(
              `mood snapshot tripped voice lint: ${lint.matches.map((m) => m.word).join(', ')}`,
            );
            continue;
          }
          const result: MoodSnapshot = {
            destinationName: input.destination.name,
            text: resp.text.trim(),
            source: 'llm',
            confidence: 0.7,
          };
          ctx.traceLogger.recordAgentRun(
            MOOD_AGENT_ID,
            input,
            result,
            Math.round(performance.now() - startedAt),
          );
          return result;
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr ?? new Error('mood snapshot generation failed');
    },
  };

  function findCurated(dest: Destination): MoodSnapshot | null {
    if (dest.country !== 'IT') return null;
    const curated = findDestinationBySlugOrAlias(dest.name);
    if (!curated) return null;
    return CURATED_MOODS[curated.slug] ?? null;
  }
  ```

- [ ] Update `src/agents/index.ts`:
  ```ts
  // Layer: agents
  // Deps: core, lib

  export * from './intent-agent';
  export * from './mood-snapshot-agent';
  ```

## Task 8: Orchestrator - post-proposal mood snapshot

- [ ] Modify `src/orchestrator/orchestrator.ts`:
  - Add `MoodSnapshotAgent` import + constructor option
  - After emitting `concierge.message`, run mood snapshot in a try/catch:
    - On success: emit `agent.step.started`/`completed` for `mood`, then `mood.snapshot.ready`
    - On failure: emit `agent.step.failed { recoverable: true }`, no `mood.snapshot.ready` event, continue to `turn.completed`

  The exact patch:
  ```ts
  // Add to imports:
  import { MoodSnapshotAgent } from '@/agents/mood-snapshot-agent';
  import type { MoodSnapshot } from '@core/reasoning';

  // Add to OrchestratorOptions:
  moodSnapshotAgent?: Agent<{ destination: import('@core/trip-intent').Destination }, MoodSnapshot>;

  // Add to constructor:
  this.moodSnapshotAgent = opts.moodSnapshotAgent ?? MoodSnapshotAgent;

  // After the concierge.message yield and BEFORE the turn.completed yield:
  await this.runMoodSnapshot(req, intent, ctx.signal, agentTrace, (event) => {
    queueMicrotask(() => {});  // (no-op; placeholder)
  });
  // Actually we'll use a generator helper - see below.
  ```

  Implement using a private `async *runMoodSnapshotEvents()` generator that yields the events for the mood step:

  ```ts
  // In the run() generator, after the concierge.message yield:
  yield* this.runMoodSnapshotEvents(req, intent, ctx.signal);

  // ...new private method:
  private async *runMoodSnapshotEvents(
    req: ConciergeRequest,
    intent: TripIntent,
    signal: AbortSignal,
  ): AsyncIterable<OrchestratorEvent> {
    const dest = intent.destinations[0];
    if (!dest) return;

    const moodStepId = stepId(`${req.turnId}-mood`);
    yield {
      kind: 'agent.step.started',
      turnId: req.turnId,
      stepId: moodStepId,
      agentId: 'mood',
      label: 'Composing the vibe',
    };

    const startedAt = performance.now();
    try {
      const agentCtx = this.buildAgentContext(req, signal);
      const snapshot = await this.moodSnapshotAgent.run({ destination: dest }, agentCtx);
      const durationMs = Math.round(performance.now() - startedAt);
      yield {
        kind: 'agent.step.completed',
        turnId: req.turnId,
        stepId: moodStepId,
        durationMs,
      };
      yield {
        kind: 'mood.snapshot.ready',
        turnId: req.turnId,
        destinationName: snapshot.destinationName,
        snapshot,
      };
    } catch (err) {
      yield {
        kind: 'agent.step.failed',
        turnId: req.turnId,
        stepId: moodStepId,
        error: errorMessage(err),
        recoverable: true,
      };
      // Proposal already shipped - continue to turn.completed.
    }
  }
  ```

- [ ] Modify `src/orchestrator/singleton.ts` to use the production router:
  ```ts
  import { Orchestrator } from './orchestrator';
  import { AnthropicModelClient } from '@lib/ai/anthropic-client';
  import { NoOpTraceLogger } from '@lib/observability/trace-logger';
  import { createDefaultProviderRouter } from '@/providers';

  let _instance: Orchestrator | null = null;

  export function getOrchestrator(): Orchestrator {
    if (_instance) return _instance;
    const modelClient = new AnthropicModelClient();
    _instance = new Orchestrator({
      modelClient,
      traceLogger: NoOpTraceLogger,
      providerRouter: createDefaultProviderRouter(modelClient),
    });
    return _instance;
  }

  export function _setOrchestratorForTesting(instance: Orchestrator | null): void {
    _instance = instance;
  }
  ```

## Task 9: Tests

- [ ] Create `tests/llm-synthesized.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { LLMSynthesizedProvider } from '@/providers/llm-synthesized';
  import { mapLLMStayToStay, type LLMStay } from '@/providers/llm-synthesized/llm-stay';
  import { resolvePhotoId } from '@/providers/llm-synthesized/photo-resolver';
  import { TtlCache } from '@/providers/llm-synthesized/cache';
  import { StaySchema } from '@core/stay';
  import type { ProviderContext, ProviderSearchQuery } from '@core/provider';
  import { MockModelClient } from './helpers/mock-model-client';

  const ctx: ProviderContext = { signal: new AbortController().signal, secrets: {} };

  function buildQuery(overrides: Partial<ProviderSearchQuery> = {}): ProviderSearchQuery {
    return {
      destinations: [{ kind: 'synthesized', name: 'Tokyo', country: 'JP' }],
      dates: { kind: 'unspecified' },
      travelers: { adults: 1, children: { count: 0 }, infants: 0 },
      ...overrides,
    };
  }

  const sampleLLMStay: LLMStay = {
    slug: 'tokyo-quiet-house',
    name: 'A small guesthouse in Yanaka',
    type: 'guesthouse',
    location: { country: 'JP', region: 'Kanto', locality: 'Tokyo', neighborhood: 'Yanaka' },
    description: 'Six tatami rooms above a coffee shop in old Tokyo. Steps from the cemetery park; mornings smell like roasted beans.',
    pricePerNight: 220,
    currency: 'USD',
    amenities: ['Breakfast included', 'Wi-Fi', 'Walking distance to subway'],
    capacity: { sleeps: 2, bedrooms: 1, bathrooms: 1 },
    vibe: ['mid-range', 'walkable', 'foodie', 'avoid-tourist-traps'],
    walkability: 92,
    photoCategory: 'cityscape',
  };

  describe('mapLLMStayToStay', () => {
    it('produces a Stay that passes StaySchema', () => {
      const stay = mapLLMStayToStay(sampleLLMStay);
      expect(() => StaySchema.parse(stay)).not.toThrow();
    });

    it('namespaces id as llm-synthesized:<slug>', () => {
      expect(mapLLMStayToStay(sampleLLMStay).id).toBe('llm-synthesized:tokyo-quiet-house');
    });

    it('attaches a category-resolved unsplash photo', () => {
      const stay = mapLLMStayToStay(sampleLLMStay);
      expect(stay.photos[0]?.url).toContain(resolvePhotoId('cityscape'));
    });
  });

  describe('TtlCache', () => {
    it('returns null after expiry', async () => {
      const cache = new TtlCache<number>(1);
      cache.set('k', 7);
      expect(cache.get('k')).toBe(7);
      await new Promise((r) => setTimeout(r, 10));
      expect(cache.get('k')).toBeNull();
    });
  });

  describe('LLMSynthesizedProvider', () => {
    it('returns mapped stays from a successful generation', async () => {
      const client = new MockModelClient().respondGenerate(() => ({ stays: [sampleLLMStay] }));
      const provider = new LLMSynthesizedProvider(client);
      const result = await provider.search(buildQuery(), ctx);
      expect(result.stays.length).toBe(1);
      expect(result.stays[0]?.name).toBe(sampleLLMStay.name);
      expect(result.badges.some((b) => b.kind === 'preview')).toBe(true);
      expect(result.freshness.source).toBe('synthesized');
    });

    it('caches by (destination, vibe, budget) - second call hits cache', async () => {
      let calls = 0;
      const client = new MockModelClient().respondGenerate(() => {
        calls += 1;
        return { stays: [sampleLLMStay] };
      });
      const provider = new LLMSynthesizedProvider(client);
      await provider.search(buildQuery(), ctx);
      await provider.search(buildQuery(), ctx);
      expect(calls).toBe(1);
    });

    it('returns empty result when no destination given', async () => {
      const client = new MockModelClient().respondGenerate(() => ({ stays: [] }));
      const provider = new LLMSynthesizedProvider(client);
      const result = await provider.search(buildQuery({ destinations: [] }), ctx);
      expect(result.stays).toEqual([]);
    });
  });
  ```

- [ ] Create `tests/mood-snapshot-agent.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { MoodSnapshotAgent } from '@/agents/mood-snapshot-agent';
  import { turnId } from '@core/ids';
  import type { AgentContext } from '@core/agent';
  import { MockModelClient } from './helpers/mock-model-client';

  function fakeContext(client: MockModelClient): AgentContext {
    return {
      turnId: turnId('t-test'),
      signal: new AbortController().signal,
      emit: { progress: () => {}, explanation: () => {} },
      modelClient: client,
      traceLogger: { recordEvent: () => {}, recordAgentRun: () => {} },
    };
  }

  describe('MoodSnapshotAgent', () => {
    it('returns curated mood for a known Italian destination (no LLM call)', async () => {
      const client = new MockModelClient(); // no .respondGenerate - would throw if called
      const result = await MoodSnapshotAgent.run(
        { destination: { kind: 'curated', name: 'Tuscany', country: 'IT' } },
        fakeContext(client),
      );
      expect(result.source).toBe('curated');
      expect(result.text).toContain('Golden-hour');
      expect(client.calls.generate.length).toBe(0);
    });

    it('falls back to LLM for an unknown destination', async () => {
      const client = new MockModelClient().respondGenerate(() => ({
        text: 'Cobblestone alleys and neon signs at midnight.',
      }));
      const result = await MoodSnapshotAgent.run(
        { destination: { kind: 'synthesized', name: 'Tokyo', country: 'JP' } },
        fakeContext(client),
      );
      expect(result.source).toBe('llm');
      expect(result.text).toContain('Cobblestone');
      expect(client.calls.generate.length).toBe(1);
    });

    it('retries when LLM emits banned cliché, then succeeds', async () => {
      let attempt = 0;
      const client = new MockModelClient().respondGenerate(() => {
        attempt += 1;
        return attempt === 1
          ? { text: 'A magical hidden gem awaits.' }
          : { text: 'Lemon trees and sea salt at noon.' };
      });
      const result = await MoodSnapshotAgent.run(
        { destination: { kind: 'synthesized', name: 'Sicily', country: 'IT' } },
        fakeContext(client),
      );
      expect(result.text).toContain('Lemon trees');
      expect(client.calls.generate.length).toBe(2);
    });

    it('throws after two banned-word attempts', async () => {
      const client = new MockModelClient().respondGenerate(() => ({
        text: 'A magical journey to discover the unforgettable.',
      }));
      await expect(
        MoodSnapshotAgent.run(
          { destination: { kind: 'synthesized', name: 'Bali', country: 'ID' } },
          fakeContext(client),
        ),
      ).rejects.toThrow();
    });
  });
  ```

- [ ] Update `tests/orchestrator.test.ts`:
  Add a test that the compose sequence now includes `mood.snapshot.ready` after `proposal.ready`. The intent comes back with `Tuscany` (already in curated moods), so no LLM call needed.

  ```ts
  it('emits mood.snapshot.ready after proposal.ready (curated path)', async () => {
    process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    const client = new MockModelClient().respondGenerate(() => intentResponse);
    const orch = new Orchestrator({ modelClient: client });
    const events = await collect(
      orch.run(baseRequest(), { signal: new AbortController().signal }),
    );
    const proposalReadyIdx = events.findIndex((e) => e.kind === 'proposal.ready');
    const moodIdx = events.findIndex((e) => e.kind === 'mood.snapshot.ready');
    expect(moodIdx).toBeGreaterThan(proposalReadyIdx);
  });
  ```

## Task 10: Final pipeline + tag

- [ ] Run:
  ```bash
  pnpm format
  pnpm typecheck
  pnpm lint
  pnpm format:check
  pnpm test
  pnpm build
  ```
- [ ] Tag:
  ```bash
  git tag -a slice-a6 -m "Slice A6 complete: LLMSynthesizedProvider + MoodSnapshotAgent"
  ```
- [ ] After A6 ships, write the Slice A7 plan (Workspace Shell + Chat Sidebar - first UI of the live workspace).
