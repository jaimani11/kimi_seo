# StayScout Slice A2 - Core Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land every contract from spec §3 in `src/core/` - `TripIntent`, `Stay`, `TripProposal`, `Agent<I,O>`, `Provider`, `OrchestratorEvent`, `ModelClient`, `ConciergeRequest`, plus the supporting types (deltas, diffs, mood snapshots, trust annotations, data quality, escalation, etc.). Each domain type that crosses a wire (LLM output, JSONL stream, route-handler request) gets a paired Zod schema for runtime validation. After A2, the type system is the contract everything else conforms to - agents, providers, orchestrator, UI all program against `@core/*`.

**Architecture:** Flat layout under `src/core/`, one file per coherent type cluster. Zod schemas live alongside their types and use `z.infer<>` to keep TS types as the source of truth where shapes are simple, or vice-versa where the schema is more authoritative. No React, no Next, no upward imports - boundary lint already enforces this.

**Tests:** Vitest + a handful of golden cases. Schema tests verify valid examples parse and invalid ones throw. The TripIntent golden cases double as the §8.15 evaluation baseline.

**Tech additions:** `zod`, `vitest`, `@vitest/coverage-v8`.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §3, §6, §8.13–8.16

---

## Slice A2 file structure

```
src/core/
├── index.ts                  [modify] barrel re-exporting all public types
├── ids.ts                    [new] branded ID types (StayId, ProviderId, AgentId, TurnId, ...)
├── trip-intent.ts            [new] TripIntent + sub-types + Zod schema
├── stay.ts                   [new] Stay + sub-types + Zod schema
├── trip-proposal.ts          [new] TripProposal + ReasoningChip
├── reasoning.ts              [new] AdaptationNote, MoodSnapshot
├── intent-delta.ts           [new] IntentDelta, ProposalDiff
├── memory.ts                 [new] MemoryContext, MemoryHint, EscalationPath
├── trust.ts                  [new] TrustAnnotation, DataQuality, ProviderAdvantage, FreshnessInfo
├── agent.ts                  [new] Agent<I,O>, AgentContext, AgentEventEmitter, AgentTraceSummary
├── provider.ts               [new] Provider family (capabilities, query, result, badges, context, filters)
├── orchestrator-event.ts     [new] OrchestratorEvent discriminated union + Zod schema
├── model-client.ts           [new] ModelClient, ModelId, ModelMessage, StreamRequest, StreamChunk
├── concierge-request.ts      [new] ConciergeRequest wire shape + Zod schema
├── temporal.ts               [new] TemporalContext, LocalEvent, WeatherSummary
└── partial.ts                [new] PartialnessReport, ProposalRef

tests/
├── trip-intent.test.ts       [new] Zod schema + golden cases
├── orchestrator-event.test.ts[new] event union schema validation
├── concierge-request.test.ts [new] wire request schema validation
└── eval/
    └── intent-extraction/
        └── golden.json       [new] golden TripIntent inputs for Slice A4 baseline
```

Total: 17 source files in `core/` + 4 test files.

---

## Task 1: Install Zod, Vitest, coverage tooling

- [ ] Install
  ```bash
  pnpm add zod
  pnpm add -D vitest @vitest/coverage-v8
  ```
- [ ] Add `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config';
  import path from 'node:path';

  export default defineConfig({
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
      coverage: { provider: 'v8', reporter: ['text', 'html'] },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@lib': path.resolve(__dirname, 'src/lib'),
      },
    },
  });
  ```
- [ ] Add scripts to `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```
- [ ] Add `.gitkeep`-replacing test smoke: `tests/sanity.test.ts`
  ```ts
  import { describe, expect, it } from 'vitest';
  describe('sanity', () => { it('boots', () => { expect(1 + 1).toBe(2); }); });
  ```
- [ ] Run: `pnpm test` - expect 1 test passing.
- [ ] Add `tests/**` to ESLint? Already covered by the boundary config - leave as-is.
- [ ] Commit: `chore: add Zod, Vitest, and a sanity test`

## Task 2: Branded ID types (`src/core/ids.ts`)

Branded primitives so we can't accidentally mix `StayId` with `ProviderId` at compile time.

- [ ] Create `src/core/ids.ts`:
  ```ts
  // Nominal/branded IDs. We use a tagged union over `string` so the compiler
  // distinguishes IDs of different kinds. Values are still plain strings at runtime.

  declare const __brand: unique symbol;
  type Brand<T, B> = T & { readonly [__brand]: B };

  export type StayId = Brand<string, 'StayId'>;          // `${ProviderId}:${nativeId}`
  export type ProviderId = Brand<string, 'ProviderId'>;
  export type AgentId = Brand<string, 'AgentId'>;        // 'intent' | 'search' | ...
  export type SessionId = Brand<string, 'SessionId'>;
  export type TurnId = Brand<string, 'TurnId'>;
  export type StepId = Brand<string, 'StepId'>;
  export type ProposalId = Brand<string, 'ProposalId'>;

  // Constructor helpers - the only way to mint a branded value at runtime.
  // (We don't validate format here; producers like the orchestrator are
  //  expected to pass shaped strings.)
  export const stayId = (s: string): StayId => s as StayId;
  export const providerId = (s: string): ProviderId => s as ProviderId;
  export const agentId = (s: string): AgentId => s as AgentId;
  export const sessionId = (s: string): SessionId => s as SessionId;
  export const turnId = (s: string): TurnId => s as TurnId;
  export const stepId = (s: string): StepId => s as StepId;
  export const proposalId = (s: string): ProposalId => s as ProposalId;
  ```
- [ ] Lint should pass - no React, no Next.
- [ ] No tests yet - these are pure type aliases.

## Task 3: `TripIntent` + Zod schema + golden tests (`src/core/trip-intent.ts`)

This is the most cross-cutting type. Used by every agent.

- [ ] Create `src/core/trip-intent.ts`:
  ```ts
  import { z } from 'zod';

  // ============== VibeTag - closed taxonomy ==============
  // A closed string union so the Intent Agent can't drift into
  // freeform tag soup. Spec §3.1; future enrichment (pace,
  // luxury tolerance, etc.) lands as additional optional fields,
  // not by widening this union.
  export const VibeTagSchema = z.enum([
    'luxury', 'budget', 'mid-range',
    'walkable', 'remote', 'urban',
    'romantic', 'family-friendly', 'group',
    'foodie', 'cultural', 'nature', 'adventure',
    'slow', 'fast-paced',
    'avoid-tourist-traps', 'iconic-landmarks',
    'wellness', 'beach', 'mountains',
  ]);
  export type VibeTag = z.infer<typeof VibeTagSchema>;

  // ============== Destinations ==============
  export const GeoCoordsSchema = z.object({ lat: z.number(), lng: z.number() });
  export type GeoCoords = z.infer<typeof GeoCoordsSchema>;

  export const DestinationSchema = z.object({
    kind: z.enum(['curated', 'synthesized']),
    name: z.string(),
    country: z.string().length(2),     // ISO 3166-1 alpha-2
    region: z.string().optional(),
    coordinates: GeoCoordsSchema.optional(),
  });
  export type Destination = z.infer<typeof DestinationSchema>;

  // ============== TripDates (discriminated) ==============
  export const TripDatesSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('specific'), start: z.string(), end: z.string() }),
    z.object({ kind: z.literal('flexible-month'), month: z.string(), year: z.number().int() }),
    z.object({ kind: z.literal('flexible-season'), season: z.enum(['spring','summer','fall','winter']), year: z.number().int() }),
    z.object({ kind: z.literal('unspecified') }),
  ]);
  export type TripDates = z.infer<typeof TripDatesSchema>;

  // ============== Travelers ==============
  export const TravelerCompositionSchema = z.object({
    adults: z.number().int().min(0),
    children: z.object({
      count: z.number().int().min(0),
      ages: z.array(z.number().int().min(0)).optional(),
    }),
    infants: z.number().int().min(0),
    groupKind: z.enum(['family','couple','friends','solo','business']).optional(),
  });
  export type TravelerComposition = z.infer<typeof TravelerCompositionSchema>;

  // ============== Budget ==============
  export const BudgetFlexibilitySchema = z.enum(['firm', 'flexible', 'open']);
  export type BudgetFlexibility = z.infer<typeof BudgetFlexibilitySchema>;

  export const BudgetIntentSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('total'), amount: z.number(), currency: z.string().length(3), flexibility: BudgetFlexibilitySchema }),
    z.object({ kind: z.literal('per-night'), amount: z.number(), currency: z.string().length(3), flexibility: BudgetFlexibilitySchema }),
    z.object({ kind: z.literal('unspecified') }),
  ]);
  export type BudgetIntent = z.infer<typeof BudgetIntentSchema>;

  // ============== Preferences ==============
  export const TripPreferencesSchema = z.object({
    amenities: z.array(z.string()),
    avoid: z.array(z.string()),
    transportation: z.enum(['walking-priority', 'rental-car', 'public-transit', 'no-preference']).optional(),
    accessibility: z.array(z.string()).optional(),
  });
  export type TripPreferences = z.infer<typeof TripPreferencesSchema>;

  // ============== TripIntent (the umbrella) ==============
  export const TripIntentSchema = z.object({
    destinations: z.array(DestinationSchema),
    dates: TripDatesSchema,
    duration: z.object({ nights: z.number().int().min(0), flexible: z.boolean() }),
    travelers: TravelerCompositionSchema,
    budget: BudgetIntentSchema,
    vibe: z.object({ tags: z.array(VibeTagSchema) }),
    preferences: TripPreferencesSchema,
    caveats: z.array(z.string()),
    rawInput: z.string(),
    confidence: z.record(z.string(), z.number().min(0).max(1)).optional(),
  });
  export type TripIntent = z.infer<typeof TripIntentSchema>;
  ```

- [ ] Create `tests/trip-intent.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { TripIntentSchema } from '@core/trip-intent';

  const validIntent = {
    destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
    dates: { kind: 'flexible-month', month: 'September', year: 2026 },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 2, ages: [9, 12] }, infants: 0, groupKind: 'family' },
    budget: { kind: 'total', amount: 6000, currency: 'USD', flexibility: 'flexible' },
    vibe: { tags: ['walkable', 'family-friendly', 'avoid-tourist-traps'] },
    preferences: { amenities: ['pool', 'breakfast'], avoid: [] },
    caveats: ['gluten-free options helpful'],
    rawInput: 'Italy 7 days, family of 4, walkable, no tourist traps',
    confidence: { destinations: 0.95, vibe: 0.78 },
  };

  describe('TripIntentSchema', () => {
    it('parses a valid intent', () => {
      const parsed = TripIntentSchema.parse(validIntent);
      expect(parsed.destinations[0]?.name).toBe('Tuscany');
    });

    it('rejects invalid country code', () => {
      const bad = { ...validIntent, destinations: [{ kind: 'curated', name: 'Tuscany', country: 'ITA' }] };
      expect(() => TripIntentSchema.parse(bad)).toThrow();
    });

    it('rejects unknown vibe tag', () => {
      const bad = { ...validIntent, vibe: { tags: ['walkable', 'unknown-vibe'] } };
      expect(() => TripIntentSchema.parse(bad)).toThrow();
    });

    it('rejects malformed dates discriminator', () => {
      const bad = { ...validIntent, dates: { kind: 'specific' } };
      expect(() => TripIntentSchema.parse(bad)).toThrow();
    });

    it('confidence is optional', () => {
      const { confidence: _confidence, ...rest } = validIntent;
      expect(() => TripIntentSchema.parse(rest)).not.toThrow();
    });
  });
  ```

- [ ] Run `pnpm test`. Expect 6 tests passing.
- [ ] Commit: `feat(core): add TripIntent + sub-types with Zod schema + golden tests`

## Task 4: `Stay` + sub-types + schema (`src/core/stay.ts`)

- [ ] Create `src/core/stay.ts`:
  ```ts
  import { z } from 'zod';
  import { VibeTagSchema } from './trip-intent';
  import type { ProviderId, StayId } from './ids';

  // ============== Stay sub-types ==============
  export const StayLocationSchema = z.object({
    country: z.string().length(2),
    region: z.string().optional(),
    locality: z.string().optional(),
    neighborhood: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  });
  export type StayLocation = z.infer<typeof StayLocationSchema>;

  export const StayPhotoSchema = z.object({
    url: z.string().url(),
    source: z.enum(['unsplash', 'curated', 'expedia', 'vrbo', 'booking', 'other']),
    credit: z.string().optional(),
    license: z.string().optional(),
    alt: z.string(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
  });
  export type StayPhoto = z.infer<typeof StayPhotoSchema>;

  export const StayPricingSchema = z.object({
    pricePerNight: z.object({ amount: z.number(), currency: z.string().length(3) }),
    totalForStay: z.object({ amount: z.number(), currency: z.string().length(3), nights: z.number().int() }).optional(),
    fees: z.object({ cleaning: z.number().optional(), service: z.number().optional() }).optional(),
    cancellation: z.enum(['free', 'partial', 'non-refundable']).optional(),
  });
  export type StayPricing = z.infer<typeof StayPricingSchema>;

  export const AmenitySchema = z.object({
    id: z.string(),
    label: z.string(),
  });
  export type Amenity = z.infer<typeof AmenitySchema>;

  export const StaySignalsSchema = z.object({
    walkability: z.number().min(0).max(100).optional(),
    familyFit: z.number().min(0).max(100).optional(),
    remoteness: z.number().min(0).max(100).optional(),
    noise: z.number().min(0).max(100).optional(),
    tags: z.array(VibeTagSchema),
  });
  export type StaySignals = z.infer<typeof StaySignalsSchema>;

  export const AffiliateAttributionSchema = z.object({
    network: z.string(),
    campaignId: z.string().optional(),
    deepLinkParams: z.record(z.string(), z.string()).optional(),
  });
  export type AffiliateAttribution = z.infer<typeof AffiliateAttributionSchema>;

  export const BookingLinkSchema = z.object({
    url: z.string().url(),
    type: z.enum(['redirect', 'autonomous']),
    attribution: AffiliateAttributionSchema.optional(),
  });
  export type BookingLink = z.infer<typeof BookingLinkSchema>;

  // ============== Stay (the umbrella) ==============
  // Note: id is namespaced as `${providerId}:${nativeId}` (validated softly via regex)
  export const StaySchema = z.object({
    id: z.string().regex(/^[a-z0-9-]+:[A-Za-z0-9-_.]+$/),
    providerId: z.string(),
    name: z.string(),
    type: z.enum(['hotel', 'villa', 'apartment', 'farmhouse', 'agriturismo', 'palazzo', 'guesthouse']),
    location: StayLocationSchema,
    description: z.string(),
    photos: z.array(StayPhotoSchema),
    pricing: StayPricingSchema,
    amenities: z.array(AmenitySchema),
    capacity: z.object({
      sleeps: z.number().int().min(1),
      bedrooms: z.number().int().optional(),
      bathrooms: z.number().int().optional(),
    }),
    rating: z.object({
      score: z.number(),
      reviewCount: z.number().int(),
      source: z.string().optional(),
    }).optional(),
    signals: StaySignalsSchema,
    bookingLink: BookingLinkSchema,
    fetchedAt: z.string(),
  });
  // Branded type for Stay.id at the TS layer (the schema returns a plain string;
  // callers cast via `stayId()` helper from ids.ts when constructing).
  export type Stay = Omit<z.infer<typeof StaySchema>, 'id' | 'providerId'> & {
    id: StayId;
    providerId: ProviderId;
  };
  ```
- [ ] No tests yet for Stay specifically - Zod will be exercised end-to-end when providers ship in A3. Plan adds them in A3.
- [ ] Commit: `feat(core): add Stay shape + Zod schema (provider-canonical)`

## Task 5: `TripProposal` + `ReasoningChip` (`src/core/trip-proposal.ts`)

- [ ] Create `src/core/trip-proposal.ts`:
  ```ts
  import { z } from 'zod';
  import { StaySchema } from './stay';
  import { TripIntentSchema } from './trip-intent';

  export const ReasoningChipSchema = z.object({
    label: z.string(),
    source: z.enum(['intent', 'agent']),
    emphasized: z.boolean().optional(),
    confidence: z.number().min(0).max(1).optional(),
  });
  export type ReasoningChip = z.infer<typeof ReasoningChipSchema>;

  export const AgentTraceSummarySchema = z.object({
    agents: z.array(z.object({
      id: z.string(),
      durationMs: z.number().int(),
      modelMeta: z.object({
        model: z.string(),
        tokensIn: z.number().int(),
        tokensOut: z.number().int(),
        cacheHit: z.boolean().optional(),
      }).optional(),
    })),
    totalDurationMs: z.number().int(),
  });
  export type AgentTraceSummary = z.infer<typeof AgentTraceSummarySchema>;

  export const TripProposalSchema = z.object({
    intent: TripIntentSchema,
    hero: StaySchema,
    alternatives: z.array(StaySchema).max(4),
    reasoning: z.object({
      highlights: z.array(ReasoningChipSchema),
      summary: z.string(),
      totalCost: z.object({ amount: z.number(), currency: z.string().length(3) }).optional(),
    }),
    agentTrace: AgentTraceSummarySchema,
    generatedAt: z.string(),
  });
  // Use the Stay branded TS type, not the schema-inferred string ids
  export type TripProposal = Omit<z.infer<typeof TripProposalSchema>, 'hero' | 'alternatives'> & {
    hero: import('./stay').Stay;
    alternatives: import('./stay').Stay[];
  };
  ```
- [ ] Commit: `feat(core): add TripProposal + ReasoningChip + AgentTraceSummary`

## Task 6: `AdaptationNote` + `MoodSnapshot` (`src/core/reasoning.ts`)

- [ ] Create `src/core/reasoning.ts`:
  ```ts
  import { z } from 'zod';

  export const AdaptationNoteSchema = z.object({
    description: z.string(),         // "Reduced nightlife weighting"
    signal: z.string(),              // "vibrancy"
    direction: z.enum(['up', 'down', 'add', 'remove']),
    weight: z.number().optional(),
    confidence: z.number().min(0).max(1).optional(),
  });
  export type AdaptationNote = z.infer<typeof AdaptationNoteSchema>;

  export const MoodSnapshotSchema = z.object({
    destinationName: z.string(),
    text: z.string(),
    source: z.enum(['curated', 'llm']),
    confidence: z.number().min(0).max(1).optional(),
  });
  export type MoodSnapshot = z.infer<typeof MoodSnapshotSchema>;

  // ExplanationTopic for the agent.explanation seam (Slice B+ uses)
  export const ExplanationTopicSchema = z.enum([
    'inference-summary',
    'ranking-decision',
    'change-rationale',
    'deprioritization',
    'tradeoff',
  ]);
  export type ExplanationTopic = z.infer<typeof ExplanationTopicSchema>;
  ```
- [ ] Commit: `feat(core): add AdaptationNote, MoodSnapshot, ExplanationTopic`

## Task 7: `IntentDelta` + `ProposalDiff` (`src/core/intent-delta.ts`)

- [ ] Create `src/core/intent-delta.ts`:
  ```ts
  import { z } from 'zod';
  import { ReasoningChipSchema } from './trip-proposal';
  import { TripIntentSchema } from './trip-intent';

  // IntentDelta - we keep `changed` permissive (unknowns) since the values
  // can be arbitrary slice types on either side; the structural fact is
  // "this key changed from X to Y".
  export const IntentDeltaSchema = z.object({
    added: TripIntentSchema.partial(),
    changed: z.array(z.object({
      key: z.string(),
      before: z.unknown(),
      after: z.unknown(),
    })),
    removed: z.array(z.string()),
  });
  export type IntentDelta = z.infer<typeof IntentDeltaSchema>;

  export const ProposalDiffSchema = z.object({
    heroChanged: z.object({
      before: z.string(),
      after: z.string(),
    }).nullable(),
    alternativesAdded: z.array(z.string()),
    alternativesRemoved: z.array(z.string()),
    alternativesReordered: z.boolean(),
    reasoningChanged: z.object({
      added: z.array(ReasoningChipSchema),
      removed: z.array(ReasoningChipSchema),
    }),
    totalCostDelta: z.object({
      before: z.number(),
      after: z.number(),
    }).optional(),
  });
  export type ProposalDiff = z.infer<typeof ProposalDiffSchema>;
  ```
- [ ] Commit: `feat(core): add IntentDelta and ProposalDiff (refine flow)`

## Task 8: `MemoryContext` + `MemoryHint` + `EscalationPath` (`src/core/memory.ts`)

- [ ] Create `src/core/memory.ts`:
  ```ts
  import { z } from 'zod';

  // Slice A1-A2 ship only the seam (interface-only). Real Memory Agent / pgvector lands in Slice C.
  export interface MemoryContext {
    recall: (key: string) => Promise<readonly MemoryRecord[]>;
    write: (record: Omit<MemoryRecord, 'id' | 'createdAt'>) => Promise<void>;
  }

  export const MemoryRecordSchema = z.object({
    id: z.string(),
    userId: z.string(),
    kind: z.enum(['episodic', 'structural']),
    content: z.string(),
    signalKey: z.string().optional(),
    weight: z.number().optional(),
    embedding: z.array(z.number()).optional(),  // pgvector float[]
    createdAt: z.string(),
  });
  export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;

  export const MemoryHintSchema = z.object({
    message: z.string(),                      // "You seem to prefer slower, walkable destinations."
    signalKey: z.string(),                    // 'pace' | 'walkability' | 'cuisine'
    confidence: z.number().min(0).max(1),
  });
  export type MemoryHint = z.infer<typeof MemoryHintSchema>;

  // EscalationPath - interface-only stub for Slice C+ human concierge handoff
  export const EscalationPathSchema = z.object({
    kind: z.literal('concierge-handoff'),
    reason: z.string(),
    tier: z.enum(['standard', 'vip', 'enterprise']),
  });
  export type EscalationPath = z.infer<typeof EscalationPathSchema>;
  ```
- [ ] Commit: `feat(core): add MemoryContext + MemoryHint + EscalationPath stubs`

## Task 9: `TrustAnnotation` + `DataQuality` + `ProviderAdvantage` + `FreshnessInfo` (`src/core/trust.ts`)

- [ ] Create `src/core/trust.ts`:
  ```ts
  import { z } from 'zod';

  // Future-additive trust seams (spec §7 + §8.13). Slice A leaves all
  // these empty/optional; Slice B+ populates them from real provider data.

  export const TrustAnnotationSchema = z.object({
    label: z.string(),                                  // "Excellent for families"
    evidence: z.enum(['reviews', 'bookings', 'amenities', 'location', 'curated']),
    confidence: z.number().min(0).max(1),
    sourceCount: z.number().int().optional(),
  });
  export type TrustAnnotation = z.infer<typeof TrustAnnotationSchema>;

  export const DataQualitySchema = z.object({
    completeness: z.number().min(0).max(1),
    reviewQuality: z.enum(['rich', 'sparse', 'unverified']),
    priceConsistency: z.enum(['fresh', 'recent', 'stale']),
    amenityVerification: z.enum(['verified', 'self-reported', 'unknown']),
  });
  export type DataQuality = z.infer<typeof DataQualitySchema>;

  export const ProviderAdvantageSchema = z.object({
    kind: z.enum(['best-price', 'most-flexible-cancellation', 'best-availability', 'best-rating']),
    vsProviderId: z.string().optional(),
    delta: z.string().optional(),                       // "12% cheaper", "3 free-cancel days"
  });
  export type ProviderAdvantage = z.infer<typeof ProviderAdvantageSchema>;

  export const FreshnessInfoSchema = z.object({
    fetchedAt: z.string(),
    dataMaxAgeMs: z.number().int(),
    priceMaxAgeMs: z.number().int().optional(),
    source: z.enum(['live', 'cached', 'synthesized']),
  });
  export type FreshnessInfo = z.infer<typeof FreshnessInfoSchema>;
  ```
- [ ] Commit: `feat(core): add trust + data-quality + provider-advantage + freshness`

## Task 10: `TemporalContext` (`src/core/temporal.ts`)

- [ ] Create `src/core/temporal.ts`:
  ```ts
  import { z } from 'zod';
  import { TripDatesSchema } from './trip-intent';

  // Populated in Slice B by WeatherAgent + EventEnrichmentAgent and passed
  // into ProviderSearchQuery. Slice A providers ignore this.

  export const WeatherSummarySchema = z.object({
    summary: z.string(),                                // "Mild, mid-70s, brief afternoon rain"
    avgTempC: z.number(),
    rainChance: z.number().min(0).max(1).optional(),
    season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
  });
  export type WeatherSummary = z.infer<typeof WeatherSummarySchema>;

  export const LocalEventSchema = z.object({
    name: z.string(),
    kind: z.enum(['festival', 'concert', 'sport', 'cultural', 'holiday', 'closure']),
    startsAt: z.string(),
    endsAt: z.string().optional(),
    location: z.string().optional(),
    impact: z.enum(['positive', 'neutral', 'negative']).optional(),
  });
  export type LocalEvent = z.infer<typeof LocalEventSchema>;

  export const TemporalContextSchema = z.object({
    dates: TripDatesSchema,
    seasonality: z.object({
      month: z.number().int().min(1).max(12),
      season: z.enum(['spring','summer','fall','winter']),
    }).optional(),
    localEvents: z.array(LocalEventSchema).optional(),
    weatherForecast: WeatherSummarySchema.optional(),
  });
  export type TemporalContext = z.infer<typeof TemporalContextSchema>;
  ```
- [ ] Commit: `feat(core): add TemporalContext + WeatherSummary + LocalEvent`

## Task 11: `Agent<I, O>` interface family (`src/core/agent.ts`)

Pure TS interfaces - no Zod (these aren't wire shapes).

- [ ] Create `src/core/agent.ts`:
  ```ts
  import type { AgentId, StepId, TurnId } from './ids';
  import type { MemoryContext } from './memory';
  import type { ModelClient } from './model-client';

  export interface Agent<I, O> {
    readonly id: AgentId;
    readonly name: string;
    readonly version: string;
    run(input: I, ctx: AgentContext): Promise<O>;
  }

  export interface AgentContext {
    readonly turnId: TurnId;
    readonly signal: AbortSignal;
    readonly emit: AgentEventEmitter;
    readonly modelClient: ModelClient;
    readonly traceLogger: TraceLogger;
    readonly memory?: MemoryContext;       // Slice C populates
  }

  export interface AgentEventEmitter {
    progress(message: string, counter?: { current: number; total: number }): void;
    explanation(topic: string, summary: string, confidence?: number): void;
  }

  export interface TraceLogger {
    recordEvent(event: { kind: string; payload?: unknown }): void;
    recordAgentRun(
      agent: AgentId,
      input: unknown,
      output: unknown,
      durationMs: number,
      modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
    ): void;
  }

  // Shape of a stable agent step descriptor - used by the orchestrator
  // when emitting agent.step.* events.
  export interface AgentStep {
    stepId: StepId;
    agentId: AgentId;
    label: string;
  }
  ```
- [ ] Commit: `feat(core): add Agent + AgentContext + TraceLogger interfaces`

## Task 12: `Provider` family (`src/core/provider.ts`)

- [ ] Create `src/core/provider.ts`:
  ```ts
  import { z } from 'zod';
  import type { ProviderId } from './ids';
  import type { Stay } from './stay';
  import type { Destination, BudgetIntent, TravelerComposition, TripDates, TripPreferences } from './trip-intent';
  import type { TemporalContext } from './temporal';
  import type { FreshnessInfo } from './trust';

  // Capabilities are runtime data, so they get a Zod schema too - useful for
  // a future ProviderRegistry that validates third-party providers.
  export const ProviderCapabilitiesSchema = z.object({
    realtime: z.boolean(),
    affiliateAttribution: z.boolean(),
    supportsAvailability: z.boolean(),
    supportsBooking: z.boolean(),
    regions: z.array(z.string().length(2)).optional(),  // ISO 3166 alpha-2
  });
  export type ProviderCapabilities = z.infer<typeof ProviderCapabilitiesSchema>;

  export const ProviderBadgeSchema = z.object({
    kind: z.enum(['preview', 'closest-match', 'curated', 'wholesaler']),
    label: z.string(),
  });
  export type ProviderBadge = z.infer<typeof ProviderBadgeSchema>;

  export interface ProviderFilters {
    minPricePerNight?: number;
    maxPricePerNight?: number;
    requiredAmenities?: string[];
    excludedTypes?: string[];
  }

  export interface ProviderSearchQuery {
    destinations: Destination[];
    dates: TripDates;
    travelers: TravelerComposition;
    budget?: BudgetIntent;
    preferences?: TripPreferences;
    filters?: ProviderFilters;
    limit?: number;
    compareSet?: string[];                  // StayId list - ranking-aware comparison seam
    temporalContext?: TemporalContext;      // populated by Slice B
  }

  export interface ProviderSearchResult {
    stays: Stay[];
    badges: ProviderBadge[];
    pagination?: { cursor?: string; hasMore: boolean };
    freshness: FreshnessInfo;
  }

  export interface ProviderContext {
    readonly signal: AbortSignal;
    readonly secrets: Readonly<Record<string, string>>;  // Slice B+: API keys live here
  }

  export interface Provider {
    readonly id: ProviderId;
    readonly displayName: string;
    readonly capabilities: ProviderCapabilities;
    search(q: ProviderSearchQuery, ctx: ProviderContext): Promise<ProviderSearchResult>;
    // Slice B+ optional methods (capability-gated):
    // getDetails?(id: StayId): Promise<StayDetails>;
    // getAvailability?(id: StayId, dates: TripDates): Promise<Availability>;
    // book?(id: StayId, params: BookingParams): Promise<BookingConfirmation>;
  }
  ```
- [ ] Commit: `feat(core): add Provider interface family`

## Task 13: `OrchestratorEvent` discriminated union (`src/core/orchestrator-event.ts`)

The wire format. Every event the UI sees flows through this schema.

- [ ] Create `src/core/orchestrator-event.ts`:
  ```ts
  import { z } from 'zod';
  import { TripIntentSchema } from './trip-intent';
  import { TripProposalSchema } from './trip-proposal';
  import { IntentDeltaSchema, ProposalDiffSchema } from './intent-delta';
  import { AdaptationNoteSchema, MoodSnapshotSchema, ExplanationTopicSchema } from './reasoning';
  import { ProviderBadgeSchema } from './provider';
  import { FreshnessInfoSchema } from './trust';

  // Every event carries turnId so the UI can group, dedupe, and ignore
  // events from cancelled turns. session-level events also carry sessionId.

  const SessionStarted = z.object({
    kind: z.literal('session.started'),
    sessionId: z.string(),
    timestamp: z.number(),
  });
  const TurnStarted = z.object({
    kind: z.literal('turn.started'),
    turnId: z.string(),
    type: z.enum(['compose', 'refine']),
    priorTurnId: z.string().optional(),
  });
  const TurnCompleted = z.object({
    kind: z.literal('turn.completed'),
    turnId: z.string(),
    durationMs: z.number().int(),
    partial: z.object({
      missingComponents: z.array(z.enum(['ranking', 'mood', 'provenance', 'reasoning'])),
      degradedComponents: z.array(z.object({ component: z.string(), reason: z.string() })),
    }).optional(),
  });
  const TurnFailed = z.object({
    kind: z.literal('turn.failed'),
    turnId: z.string(),
    error: z.string(),
    recoverable: z.boolean(),
  });

  const AgentStepStarted = z.object({
    kind: z.literal('agent.step.started'),
    turnId: z.string(),
    stepId: z.string(),
    agentId: z.string(),
    label: z.string(),
  });
  const AgentStepProgress = z.object({
    kind: z.literal('agent.step.progress'),
    turnId: z.string(),
    stepId: z.string(),
    message: z.string().optional(),
    counter: z.object({ current: z.number().int(), total: z.number().int() }).optional(),
  });
  const AgentStepCompleted = z.object({
    kind: z.literal('agent.step.completed'),
    turnId: z.string(),
    stepId: z.string(),
    durationMs: z.number().int(),
  });
  const AgentStepFailed = z.object({
    kind: z.literal('agent.step.failed'),
    turnId: z.string(),
    stepId: z.string(),
    error: z.string(),
    recoverable: z.boolean(),
  });

  const AgentExplanation = z.object({
    kind: z.literal('agent.explanation'),
    turnId: z.string(),
    agentId: z.string(),
    topic: ExplanationTopicSchema,
    summary: z.string(),
    confidence: z.number().min(0).max(1).optional(),
  });

  const IntentExtracted = z.object({
    kind: z.literal('intent.extracted'),
    turnId: z.string(),
    intent: TripIntentSchema,
  });
  const IntentRefined = z.object({
    kind: z.literal('intent.refined'),
    turnId: z.string(),
    intent: TripIntentSchema,
    delta: IntentDeltaSchema,
  });

  const ProviderSearchCompleted = z.object({
    kind: z.literal('provider.search.completed'),
    turnId: z.string(),
    providerId: z.string(),
    staysFound: z.number().int(),
    badges: z.array(ProviderBadgeSchema),
    freshness: FreshnessInfoSchema,
  });

  const ProposalRefSchema = z.object({
    turnId: z.string(),
    proposalId: z.string(),
    generatedAt: z.string(),
    summary: z.object({
      destinationName: z.string(),
      nights: z.number().int(),
      heroStayName: z.string(),
    }),
  });
  export type ProposalRef = z.infer<typeof ProposalRefSchema>;

  const ProposalShimmering = z.object({
    kind: z.literal('proposal.shimmering'),
    turnId: z.string(),
    expectedCount: z.number().int(),
  });
  const ProposalRefining = z.object({
    kind: z.literal('proposal.refining'),
    turnId: z.string(),
    priorProposalRef: ProposalRefSchema,
  });
  const ProposalAdaptation = z.object({
    kind: z.literal('proposal.adaptation'),
    turnId: z.string(),
    notes: z.array(AdaptationNoteSchema),
  });
  const ProposalReady = z.object({
    kind: z.literal('proposal.ready'),
    turnId: z.string(),
    proposal: TripProposalSchema,
  });
  const ProposalEvolved = z.object({
    kind: z.literal('proposal.evolved'),
    turnId: z.string(),
    proposal: TripProposalSchema,
    diff: ProposalDiffSchema,
  });
  const ProposalBookmarkable = z.object({
    kind: z.literal('proposal.bookmarkable'),
    turnId: z.string(),
    ref: ProposalRefSchema,
    storage: z.enum(['session', 'persistent']),
  });
  const ProposalProvenanceComputed = z.object({
    kind: z.literal('proposal.provenance.computed'),
    turnId: z.string(),
    provenanceMap: z.record(z.string(), z.array(z.object({
      kind: z.string(),
      vsProviderId: z.string().optional(),
      delta: z.string().optional(),
    }))),
  });

  const ConciergeMessage = z.object({
    kind: z.literal('concierge.message'),
    turnId: z.string(),
    message: z.string(),
    tone: z.enum(['narrate', 'reassure', 'apologize']).optional(),
  });
  const ConciergeMemoryHint = z.object({
    kind: z.literal('concierge.memory.hint'),
    turnId: z.string(),
    message: z.string(),
    signalKey: z.string(),
    confidence: z.number().min(0).max(1),
  });

  const MoodSnapshotReady = z.object({
    kind: z.literal('mood.snapshot.ready'),
    turnId: z.string(),
    destinationName: z.string(),
    snapshot: MoodSnapshotSchema,
  });

  export const OrchestratorEventSchema = z.discriminatedUnion('kind', [
    SessionStarted, TurnStarted, TurnCompleted, TurnFailed,
    AgentStepStarted, AgentStepProgress, AgentStepCompleted, AgentStepFailed,
    AgentExplanation,
    IntentExtracted, IntentRefined,
    ProviderSearchCompleted,
    ProposalShimmering, ProposalRefining, ProposalAdaptation,
    ProposalReady, ProposalEvolved,
    ProposalBookmarkable, ProposalProvenanceComputed,
    ConciergeMessage, ConciergeMemoryHint,
    MoodSnapshotReady,
  ]);
  export type OrchestratorEvent = z.infer<typeof OrchestratorEventSchema>;

  // Convenience kind-indexed helper for client reducers
  export type EventOfKind<K extends OrchestratorEvent['kind']> = Extract<OrchestratorEvent, { kind: K }>;
  ```

- [ ] Create `tests/orchestrator-event.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { OrchestratorEventSchema } from '@core/orchestrator-event';

  describe('OrchestratorEventSchema', () => {
    it('parses agent.step.started', () => {
      const e = { kind: 'agent.step.started', turnId: 't1', stepId: 's1', agentId: 'intent', label: 'Reading your trip' };
      expect(() => OrchestratorEventSchema.parse(e)).not.toThrow();
    });

    it('parses turn.completed with partial report', () => {
      const e = {
        kind: 'turn.completed',
        turnId: 't1',
        durationMs: 2400,
        partial: { missingComponents: ['mood'], degradedComponents: [{ component: 'weather', reason: 'timeout' }] },
      };
      expect(() => OrchestratorEventSchema.parse(e)).not.toThrow();
    });

    it('rejects unknown kind', () => {
      const e = { kind: 'totally.made.up', turnId: 't1' };
      expect(() => OrchestratorEventSchema.parse(e)).toThrow();
    });

    it('rejects agent.step.completed missing durationMs', () => {
      const e = { kind: 'agent.step.completed', turnId: 't1', stepId: 's1' };
      expect(() => OrchestratorEventSchema.parse(e)).toThrow();
    });

    it('parses concierge.memory.hint with confidence', () => {
      const e = { kind: 'concierge.memory.hint', turnId: 't1', message: '...', signalKey: 'pace', confidence: 0.7 };
      expect(() => OrchestratorEventSchema.parse(e)).not.toThrow();
    });
  });
  ```
- [ ] Run `pnpm test` - expect 5 new tests passing.
- [ ] Commit: `feat(core): add OrchestratorEvent discriminated union + schema + tests`

## Task 14: `ModelClient` (`src/core/model-client.ts`)

- [ ] Create `src/core/model-client.ts`:
  ```ts
  import type { ZodSchema } from 'zod';

  export type ModelId =
    | 'claude-haiku-4-5'
    | 'claude-sonnet-4-6'
    | 'claude-opus-4-7'
    | (string & {});                         // future-extensible

  export interface ModelMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }

  export interface GenerateRequest<T> {
    model: ModelId;
    system?: string;
    messages: ModelMessage[];
    responseSchema?: ZodSchema<T>;
    cacheKey?: string;
    maxTokens?: number;
    temperature?: number;
  }

  export interface StreamRequest {
    model: ModelId;
    system?: string;
    messages: ModelMessage[];
    cacheKey?: string;
    maxTokens?: number;
    temperature?: number;
  }

  export type StreamChunk =
    | { kind: 'text'; text: string }
    | { kind: 'finish'; reason: 'end_turn' | 'max_tokens' | 'error'; usage?: ModelUsage };

  export interface ModelUsage {
    inputTokens: number;
    outputTokens: number;
    cacheHitTokens?: number;
  }

  export interface ModelClient {
    generate<T>(req: GenerateRequest<T>): Promise<T>;
    stream(req: StreamRequest): AsyncIterable<StreamChunk>;
  }
  ```
- [ ] Commit: `feat(core): add ModelClient interface (Anthropic-shaped)`

## Task 15: `ConciergeRequest` wire shape (`src/core/concierge-request.ts`)

- [ ] Create `src/core/concierge-request.ts`:
  ```ts
  import { z } from 'zod';

  export const ClientCapabilitiesSchema = z.object({
    supportsAdaptationDelta: z.boolean(),
    supportsMoodSnapshot: z.boolean(),
    supportsMemoryHint: z.boolean(),
  });
  export type ClientCapabilities = z.infer<typeof ClientCapabilitiesSchema>;

  const PriorProposalRefSchema = z.object({
    turnId: z.string(),
    proposalId: z.string(),
    generatedAt: z.string(),
    summary: z.object({
      destinationName: z.string(),
      nights: z.number().int(),
      heroStayName: z.string(),
    }),
  });

  export const ConciergeRequestSchema = z.object({
    sessionId: z.string(),                   // anon_<uuid>
    turnId: z.string(),
    type: z.enum(['compose', 'refine']),
    input: z.object({
      rawInput: z.string().min(1),
      priorProposalRef: PriorProposalRefSchema.optional(),
      compareSet: z.array(z.string()).max(3).optional(),
    }),
    cancelPriorTurn: z.boolean().optional(),
    clientCapabilities: ClientCapabilitiesSchema,
  });
  export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;
  ```

- [ ] Create `tests/concierge-request.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { ConciergeRequestSchema } from '@core/concierge-request';

  describe('ConciergeRequestSchema', () => {
    const valid = {
      sessionId: 'anon_abc',
      turnId: 't1',
      type: 'compose',
      input: { rawInput: 'Italy 7 days family' },
      clientCapabilities: { supportsAdaptationDelta: true, supportsMoodSnapshot: true, supportsMemoryHint: true },
    };

    it('parses a valid compose request', () => {
      expect(() => ConciergeRequestSchema.parse(valid)).not.toThrow();
    });

    it('rejects empty rawInput', () => {
      const bad = { ...valid, input: { rawInput: '' } };
      expect(() => ConciergeRequestSchema.parse(bad)).toThrow();
    });

    it('rejects compareSet over 3 entries', () => {
      const bad = { ...valid, input: { rawInput: 'x', compareSet: ['a', 'b', 'c', 'd'] } };
      expect(() => ConciergeRequestSchema.parse(bad)).toThrow();
    });

    it('parses a refine request with priorProposalRef', () => {
      const refine = {
        ...valid,
        type: 'refine',
        input: {
          rawInput: 'less touristy',
          priorProposalRef: {
            turnId: 't0',
            proposalId: 'p_abc',
            generatedAt: new Date().toISOString(),
            summary: { destinationName: 'Tuscany', nights: 7, heroStayName: 'Villa di Geggiano' },
          },
        },
      };
      expect(() => ConciergeRequestSchema.parse(refine)).not.toThrow();
    });
  });
  ```
- [ ] Run `pnpm test` - expect 4 new tests passing.
- [ ] Commit: `feat(core): add ConciergeRequest wire-format schema + tests`

## Task 16: `PartialnessReport` shared type (`src/core/partial.ts`)

Some types here are already inlined into `OrchestratorEvent` - extract the reusable shape so other layers can import it directly.

- [ ] Create `src/core/partial.ts`:
  ```ts
  import { z } from 'zod';

  export const PartialnessReportSchema = z.object({
    missingComponents: z.array(z.enum(['ranking', 'mood', 'provenance', 'reasoning'])),
    degradedComponents: z.array(z.object({ component: z.string(), reason: z.string() })),
  });
  export type PartialnessReport = z.infer<typeof PartialnessReportSchema>;
  ```
- [ ] Commit: `feat(core): extract PartialnessReport to its own module`

## Task 17: Update `src/core/index.ts` barrel

- [ ] Replace `src/core/index.ts`:
  ```ts
  // Layer: core
  // Deps: zod (only)
  // Provides: types, contracts, discriminated unions, runtime schemas

  export * from './ids';
  export * from './trip-intent';
  export * from './stay';
  export * from './trip-proposal';
  export * from './reasoning';
  export * from './intent-delta';
  export * from './memory';
  export * from './trust';
  export * from './temporal';
  export * from './agent';
  export * from './provider';
  export * from './orchestrator-event';
  export * from './model-client';
  export * from './concierge-request';
  export * from './partial';
  ```
- [ ] Run `pnpm typecheck` - verify no name collisions.
- [ ] Commit: `feat(core): wire barrel exports`

## Task 18: Golden Intent test cases (`tests/eval/intent-extraction/golden.json`)

The §8.15 evaluation baseline - used by Slice A4's IntentAgent and Slice B's RankingEvaluator.

- [ ] Create `tests/eval/intent-extraction/golden.json`:
  ```json
  [
    {
      "input": "Luxury but walkable Italy trip for 7 days. Family of 4. Budget $6k. Avoid tourist traps. Wants amazing food and views.",
      "expected": {
        "destinations": [{ "kind": "curated", "name": "Italy", "country": "IT" }],
        "duration": { "nights": 7, "flexible": false },
        "travelers": { "adults": 2, "children": { "count": 2 }, "infants": 0, "groupKind": "family" },
        "budget": { "kind": "total", "amount": 6000, "currency": "USD", "flexibility": "flexible" },
        "vibeMust": ["luxury", "walkable", "family-friendly", "foodie", "avoid-tourist-traps"]
      }
    },
    {
      "input": "Tokyo for a long weekend, just me, foodie, denser the better.",
      "expected": {
        "destinations": [{ "kind": "synthesized", "name": "Tokyo", "country": "JP" }],
        "duration": { "nights": 3, "flexible": true },
        "travelers": { "adults": 1, "children": { "count": 0 }, "infants": 0, "groupKind": "solo" },
        "vibeMust": ["foodie", "urban"]
      }
    },
    {
      "input": "Patagonia in shoulder season, my partner and I, slow pace, mountain views.",
      "expected": {
        "destinations": [{ "kind": "synthesized", "name": "Patagonia", "country": "AR" }],
        "travelers": { "adults": 2, "children": { "count": 0 }, "infants": 0, "groupKind": "couple" },
        "vibeMust": ["slow", "mountains", "nature"]
      }
    }
  ]
  ```
- [ ] Commit: `feat(eval): add golden TripIntent test cases for Slice A4 baseline`

## Task 19: Final pipeline + tag

- [ ] Run:
  ```bash
  pnpm typecheck
  pnpm lint
  pnpm format:check    # may need pnpm format first to sort new files
  pnpm test
  pnpm build
  ```
- [ ] Tag:
  ```bash
  git tag -a slice-a2 -m "Slice A2 complete: core contracts + Zod schemas + golden tests"
  ```
- [ ] After A2 ships, write the Slice A3 plan (Mock Italy Provider + Curation Library).
