# StayScout Slice A3 - Mock Italy Provider + Curation Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land the Slice A primary demo path: a deterministic `MockItalyProvider` returning ~30 hand-curated stays across 7 Italian destinations, behind the `Provider` interface from A2. Plus the cross-cutting `lib/curation/` (mood snapshots, banned words, voice templates), `lib/quality/` (taste lint), and provider `_shared/` utilities (canonical mapper, photo helper, timeout decorator, errors). Includes a CI seed-quality lint that fails on Zod schema violations or banned-cliché copy. After A3, agents have realistic data to act on.

**Architecture:** All curated content lives in `src/lib/curation/` (NOT under `providers/`) so agents can read it without breaking layer boundaries - fixed in spec self-review. Provider implementation in `src/providers/mock-italy/`. Routing in `src/providers/index.ts` returns mock-italy when destination is in IT, falls back to a stub `llm-synthesized` provider (full impl in A6). CI seed-quality test ensures the curated dataset stays disciplined as it grows.

**Tech additions:** None - Zod and Vitest already installed.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §5.17, §7

---

## Slice A3 file structure

```
src/lib/
├── curation/
│   ├── index.ts               [new] barrel
│   ├── voice.ts               [new] banned words + concierge microcopy templates
│   ├── moods.ts               [new] MoodSnapshot per Italian destination (curated)
│   └── destinations.ts        [new] Italian destination metadata (Tuscany, Umbria, Amalfi, Rome, Venice, Lake Como, Cinque Terre)
└── quality/
    ├── index.ts               [new] barrel
    └── taste-lint.ts          [new] banned-word + Zod-shape validator (used in CI seed test)

src/providers/
├── index.ts                   [modify] ProviderRegistry + routeProvider()
├── _shared/
│   ├── photo.ts               [new] Unsplash URL builder, attribution, bloom-gradient fallback color
│   ├── timeout.ts             [new] withTimeout(promise, ms) decorator
│   └── errors.ts              [new] ProviderError, ProviderTimeoutError, classification helpers
├── mock-italy/
│   ├── index.ts               [new] MockItalyProvider impl (capabilities + search() + knowsDestination())
│   ├── search.ts              [new] query → matching stays
│   ├── ranking.ts             [new] deterministic signal-weighted score
│   └── data/
│       ├── index.ts           [new] re-exports the curated dataset
│       └── stays/
│           ├── tuscany.ts     [new] 5 stays
│           ├── umbria.ts      [new] 4 stays
│           ├── amalfi.ts      [new] 5 stays
│           ├── rome.ts        [new] 5 stays
│           ├── venice.ts      [new] 4 stays
│           ├── lake-como.ts   [new] 4 stays
│           └── cinque-terre.ts[new] 3 stays
└── llm-synthesized/
    └── index.ts               [new] capabilities + stub search() (real impl in A6)

tests/
├── seed.test.ts               [new] CI seed-quality lint (Zod + banned words + uniqueness)
└── mock-italy.test.ts         [new] provider behavior tests (search, filter, ranking, determinism)
```

Total: ~22 new files. ~30 curated stays.

---

## Task 1: Curation library - voice + banned words

- [ ] Create `src/lib/curation/voice.ts`:
  ```ts
  // Voice rules - codified taste constraints from spec §5.17 + §8.13.
  // Used by:
  //   * tests/seed.test.ts (fails CI if curated copy violates)
  //   * MoodSnapshotAgent (Slice A6) to validate LLM output before emitting
  //   * Slice B+ taste-governance pipeline

  // Banned cliché list. Restrained over expansive - we add words when we
  // catch them in real outputs, not preemptively.
  export const BANNED_WORDS: readonly string[] = [
    'unforgettable',
    'experience',
    'hidden gem',
    'discover',
    'journey',
    'magical',
    'unique',
    'breathtaking',
    'must-see',
    'bucket-list',
    'enchanting',
    'paradise',
    'oasis',
    'gem',
    'best-kept secret',
  ];

  // Compile to a single case-insensitive regex once.
  const BANNED_REGEX = new RegExp(
    `\\b(${BANNED_WORDS.map((w) => w.replace(/ /g, '\\s+')).join('|')})\\b`,
    'i',
  );

  export interface VoiceLintResult {
    ok: boolean;
    matches: { word: string; index: number }[];
  }

  export function lintVoice(text: string): VoiceLintResult {
    const matches: VoiceLintResult['matches'] = [];
    for (const word of BANNED_WORDS) {
      const re = new RegExp(`\\b${word.replace(/ /g, '\\s+')}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        matches.push({ word, index: m.index });
      }
    }
    return { ok: matches.length === 0, matches };
  }

  export const containsBannedWord = (text: string): boolean => BANNED_REGEX.test(text);
  ```

- [ ] Tiny test for the linter - add a test inside `tests/seed.test.ts` later (Task 9), no separate file.

## Task 2: Curation library - Italian destination metadata

- [ ] Create `src/lib/curation/destinations.ts`:
  ```ts
  // Canonical metadata for the seven Italian destinations covered by
  // the Slice A demo. Used by both MockItalyProvider's destination
  // matcher and the MoodSnapshotAgent (A6) for keying mood data.
  // Slice B's real providers will read aliases for query normalization.

  export interface CuratedDestination {
    slug: string;
    name: string;
    country: 'IT';
    region: string;
    aliases: readonly string[];
    coordinates: { lat: number; lng: number };
  }

  export const ITALIAN_DESTINATIONS: readonly CuratedDestination[] = [
    {
      slug: 'tuscany',
      name: 'Tuscany',
      country: 'IT',
      region: 'Tuscany',
      aliases: ['florence', 'siena', 'chianti', 'val d\'orcia', 'pienza', 'montalcino'],
      coordinates: { lat: 43.7711, lng: 11.2486 },
    },
    {
      slug: 'umbria',
      name: 'Umbria',
      country: 'IT',
      region: 'Umbria',
      aliases: ['perugia', 'assisi', 'orvieto', 'spello', 'todi'],
      coordinates: { lat: 43.0978, lng: 12.5419 },
    },
    {
      slug: 'amalfi',
      name: 'Amalfi Coast',
      country: 'IT',
      region: 'Campania',
      aliases: ['positano', 'ravello', 'capri', 'sorrento', 'amalfi'],
      coordinates: { lat: 40.6340, lng: 14.6027 },
    },
    {
      slug: 'rome',
      name: 'Rome',
      country: 'IT',
      region: 'Lazio',
      aliases: ['roma', 'trastevere', 'monti', 'prati'],
      coordinates: { lat: 41.9028, lng: 12.4964 },
    },
    {
      slug: 'venice',
      name: 'Venice',
      country: 'IT',
      region: 'Veneto',
      aliases: ['venezia', 'cannaregio', 'dorsoduro', 'san marco'],
      coordinates: { lat: 45.4408, lng: 12.3155 },
    },
    {
      slug: 'lake-como',
      name: 'Lake Como',
      country: 'IT',
      region: 'Lombardy',
      aliases: ['como', 'bellagio', 'tremezzo', 'varenna', 'lago di como'],
      coordinates: { lat: 45.9866, lng: 9.2531 },
    },
    {
      slug: 'cinque-terre',
      name: 'Cinque Terre',
      country: 'IT',
      region: 'Liguria',
      aliases: ['monterosso', 'vernazza', 'corniglia', 'manarola', 'riomaggiore'],
      coordinates: { lat: 44.1234, lng: 9.7081 },
    },
  ] as const;

  export function findDestinationBySlugOrAlias(input: string): CuratedDestination | null {
    const needle = input.trim().toLowerCase();
    for (const d of ITALIAN_DESTINATIONS) {
      if (d.slug === needle) return d;
      if (d.name.toLowerCase() === needle) return d;
      if (d.aliases.includes(needle)) return d;
    }
    return null;
  }
  ```

## Task 3: Curation library - mood snapshots

- [ ] Create `src/lib/curation/moods.ts`:
  ```ts
  import type { MoodSnapshot } from '@core/reasoning';

  // Editorial-tone, hand-written. One per destination. Tested in
  // tests/seed.test.ts against the BANNED_WORDS list.

  export const CURATED_MOODS: Readonly<Record<string, MoodSnapshot>> = {
    tuscany: {
      destinationName: 'Tuscany',
      text: 'Golden-hour vineyard dinners and slower mornings. The kind of place that makes you forget you have email.',
      source: 'curated',
      confidence: 1,
    },
    umbria: {
      destinationName: 'Umbria',
      text: 'Stone hill towns, deep olive groves, and Sundays that stretch into Mondays.',
      source: 'curated',
      confidence: 1,
    },
    amalfi: {
      destinationName: 'Amalfi Coast',
      text: 'Lemon groves clinging to cliffs, sea-glass water, and dinners that stretch past midnight.',
      source: 'curated',
      confidence: 1,
    },
    rome: {
      destinationName: 'Rome',
      text: 'Espresso at sunrise, ruins on the walk home, a city that wears its centuries lightly.',
      source: 'curated',
      confidence: 1,
    },
    venice: {
      destinationName: 'Venice',
      text: 'Footsteps echo on stone, gondolas trace shadows, mornings smell like the sea.',
      source: 'curated',
      confidence: 1,
    },
    'lake-como': {
      destinationName: 'Lake Como',
      text: 'Cypress-lined lakeshore, mist on the water at dawn, the slow theatre of mountains and light.',
      source: 'curated',
      confidence: 1,
    },
    'cinque-terre': {
      destinationName: 'Cinque Terre',
      text: 'Pastel houses stitched into cliffs, salt in the air, trains that arrive when they arrive.',
      source: 'curated',
      confidence: 1,
    },
  };

  export function getCuratedMood(slug: string): MoodSnapshot | null {
    return CURATED_MOODS[slug] ?? null;
  }
  ```

## Task 4: Curation library barrel

- [ ] Create `src/lib/curation/index.ts`:
  ```ts
  export * from './voice';
  export * from './destinations';
  export * from './moods';
  ```

## Task 5: Quality library - taste lint helper

- [ ] Create `src/lib/quality/taste-lint.ts`:
  ```ts
  import { lintVoice } from '@lib/curation/voice';

  export interface TasteLintIssue {
    path: string;             // file or schema path where the violation occurred
    field: string;            // 'description' | 'mood.text' | etc.
    word: string;
    sample: string;
  }

  /**
   * Run the banned-word lint over a single field's value. Returns
   * structured issues so the CI seed test can surface them legibly.
   */
  export function lintField(path: string, field: string, value: string): TasteLintIssue[] {
    const result = lintVoice(value);
    return result.matches.map((m) => ({
      path,
      field,
      word: m.word,
      sample: value.slice(Math.max(0, m.index - 20), m.index + m.word.length + 20),
    }));
  }
  ```

- [ ] Create `src/lib/quality/index.ts`:
  ```ts
  export * from './taste-lint';
  ```

## Task 6: Provider shared utilities

- [ ] Create `src/providers/_shared/photo.ts`:
  ```ts
  import type { StayPhoto } from '@core';

  // Unsplash URL helpers. Photos are referenced by stable photo ID; the
  // URL builder applies our standard size/quality params. Real-provider
  // photo sources (expedia, vrbo) plug into the same StayPhoto.source
  // discriminator and route to their own URL builders in Slice B.

  const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';

  export function unsplashPhoto(args: {
    id: string;
    alt: string;
    credit: string;
    width?: number;
    height?: number;
  }): StayPhoto {
    const w = args.width ?? 1600;
    const h = args.height;
    const params = new URLSearchParams({
      w: String(w),
      q: '80',
      fit: 'crop',
      auto: 'format',
      ...(h ? { h: String(h) } : {}),
    });
    return {
      url: `${UNSPLASH_BASE}${args.id}?${params.toString()}`,
      source: 'unsplash',
      credit: args.credit,
      license: 'https://unsplash.com/license',
      alt: args.alt,
      width: w,
      ...(h ? { height: h } : {}),
    };
  }

  // Deterministic gradient color pair for the bloom-fallback when a
  // photo URL fails to load. Hashes the stay slug so each stay gets
  // its own consistent placeholder palette.
  export function fallbackGradient(slug: string): { from: string; to: string } {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
    const palettes: { from: string; to: string }[] = [
      { from: '#6F8170', to: '#2C3A30' }, // tuscan green
      { from: '#B07050', to: '#5C2C1E' }, // terracotta
      { from: '#4A6580', to: '#1F2C3A' }, // dusk blue
      { from: '#C9A574', to: '#704F2D' }, // honey
      { from: '#5C5670', to: '#2A2638' }, // plum dusk
      { from: '#7C8460', to: '#3E4A2B' }, // olive
    ];
    const palette = palettes[hash % palettes.length];
    if (!palette) throw new Error('unreachable');
    return palette;
  }
  ```

- [ ] Create `src/providers/_shared/timeout.ts`:
  ```ts
  /**
   * Race a promise against a timeout. Used by the orchestrator to bound
   * provider.search() calls. Throws ProviderTimeoutError on timeout so
   * the orchestrator's failure-class handler can mark recoverable.
   */
  import { ProviderTimeoutError } from './errors';

  export async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) => {
          timer = setTimeout(
            () => reject(new ProviderTimeoutError(`${label} timed out after ${ms}ms`)),
            ms,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  ```

- [ ] Create `src/providers/_shared/errors.ts`:
  ```ts
  /**
   * Provider error hierarchy. The orchestrator's degradation policy
   * (spec §6.10) reads instanceof on these to classify failure modes.
   */
  export class ProviderError extends Error {
    constructor(
      message: string,
      readonly providerId?: string,
    ) {
      super(message);
      this.name = 'ProviderError';
    }
  }

  export class ProviderTimeoutError extends ProviderError {
    constructor(message: string, providerId?: string) {
      super(message, providerId);
      this.name = 'ProviderTimeoutError';
    }
  }

  export class ProviderEmptyResultError extends ProviderError {
    constructor(message: string, providerId?: string) {
      super(message, providerId);
      this.name = 'ProviderEmptyResultError';
    }
  }
  ```

## Task 7: Curated stay data - write all 30 stays

For each destination file, every stay record conforms to `Stay` from `@core`. The shape per stay is the same; the content differs. We use the Stay schema's fields exactly.

- [ ] Create `src/providers/mock-italy/data/stays/tuscany.ts` with 5 stays: Villa di Geggiano, Palazzo Ravizza, Borgo Sant'Ambrogio, La Bandita Townhouse, Castello di Reschio.
- [ ] Create `src/providers/mock-italy/data/stays/umbria.ts` with 4 stays: Borgo dei Conti, Hotel Vannucci, Locanda del Capitano, Le Tre Vaselle.
- [ ] Create `src/providers/mock-italy/data/stays/amalfi.ts` with 5 stays: Le Sirenuse, Il San Pietro di Positano, Hotel Santa Caterina, Monastero Santa Rosa, Casa Privata.
- [ ] Create `src/providers/mock-italy/data/stays/rome.ts` with 5 stays: J.K. Place Roma, Hotel de Russie, Hotel Eden, Six Senses Rome, Soho House Rome.
- [ ] Create `src/providers/mock-italy/data/stays/venice.ts` with 4 stays: Aman Venice, Cipriani, Gritti Palace, Hotel Danieli.
- [ ] Create `src/providers/mock-italy/data/stays/lake-como.ts` with 4 stays: Villa d'Este, Grand Hotel Tremezzo, Mandarin Oriental Lake Como, Passalacqua.
- [ ] Create `src/providers/mock-italy/data/stays/cinque-terre.ts` with 3 stays: Hotel Porto Roca, La Mala, A Cà du Gigante.

Sample shape (one stay):
```ts
import { stayId, providerId } from '@core/ids';
import { unsplashPhoto } from '../../../_shared/photo';
import type { Stay } from '@core/stay';

export const villaDiGeggiano: Stay = {
  id: stayId('mock-italy:villa-di-geggiano'),
  providerId: providerId('mock-italy'),
  name: 'Villa di Geggiano',
  type: 'villa',
  location: {
    country: 'IT',
    region: 'Tuscany',
    locality: 'Castelnuovo Berardenga',
    neighborhood: '8 minutes from Siena',
    coordinates: { lat: 43.355, lng: 11.469 },
  },
  description:
    "A working vineyard since the 1100s, restored as a small family residence. Six rooms in the main house; the gardens are protected by UNESCO.",
  photos: [
    unsplashPhoto({
      id: '1499678329028-101435549a4e',
      alt: 'Tuscan villa with garden and vineyard',
      credit: 'Photographer (Unsplash)',
    }),
  ],
  pricing: {
    pricePerNight: { amount: 420, currency: 'EUR' },
    cancellation: 'partial',
  },
  amenities: [
    { id: 'pool', label: 'Pool' },
    { id: 'breakfast', label: 'Breakfast included' },
    { id: 'gardens', label: 'Historic gardens' },
    { id: 'wine-tasting', label: 'On-site wine tasting' },
  ],
  capacity: { sleeps: 12, bedrooms: 6, bathrooms: 6 },
  rating: { score: 9.4, reviewCount: 127, source: 'curated' },
  signals: {
    walkability: 35,
    familyFit: 88,
    remoteness: 65,
    noise: 18,
    tags: ['walkable', 'family-friendly', 'slow', 'avoid-tourist-traps'],
  },
  bookingLink: {
    url: 'https://example.com/redirect?provider=mock-italy&id=villa-di-geggiano',
    type: 'redirect',
  },
  fetchedAt: new Date('2026-05-08T00:00:00Z').toISOString(),
};
```

Each file exports an array of its stays as `export const TUSCANY_STAYS: Stay[] = [villa1, villa2, ...]` for ergonomic import.

**Discipline rules** (every stay must satisfy - verified by `tests/seed.test.ts`):
- `id` matches `mock-italy:<kebab-slug>` and is unique across all files
- `description` passes `lintVoice()` (no banned cliché words)
- `pricing.pricePerNight.amount` is realistic for the destination/category (50–2000 EUR)
- At least one photo
- `signals.tags` is a non-empty subset of the closed `VibeTag` taxonomy
- `bookingLink.url` is an `https://` URL

## Task 8: Curated data barrel

- [ ] Create `src/providers/mock-italy/data/index.ts`:
  ```ts
  import type { Stay } from '@core/stay';
  import { TUSCANY_STAYS } from './stays/tuscany';
  import { UMBRIA_STAYS } from './stays/umbria';
  import { AMALFI_STAYS } from './stays/amalfi';
  import { ROME_STAYS } from './stays/rome';
  import { VENICE_STAYS } from './stays/venice';
  import { LAKE_COMO_STAYS } from './stays/lake-como';
  import { CINQUE_TERRE_STAYS } from './stays/cinque-terre';

  export const ALL_STAYS: readonly Stay[] = [
    ...TUSCANY_STAYS,
    ...UMBRIA_STAYS,
    ...AMALFI_STAYS,
    ...ROME_STAYS,
    ...VENICE_STAYS,
    ...LAKE_COMO_STAYS,
    ...CINQUE_TERRE_STAYS,
  ];

  export const STAYS_BY_DESTINATION: Readonly<Record<string, readonly Stay[]>> = {
    tuscany: TUSCANY_STAYS,
    umbria: UMBRIA_STAYS,
    amalfi: AMALFI_STAYS,
    rome: ROME_STAYS,
    venice: VENICE_STAYS,
    'lake-como': LAKE_COMO_STAYS,
    'cinque-terre': CINQUE_TERRE_STAYS,
  };
  ```

## Task 9: Mock Italy ranking

- [ ] Create `src/providers/mock-italy/ranking.ts`:
  ```ts
  import type { Stay } from '@core/stay';
  import type { TripIntent, VibeTag } from '@core/trip-intent';

  /**
   * Deterministic signal-weighted ranking for Slice A. Slice B replaces
   * with a real RankingAgent; the function signature stays
   * `(stays, intent) => Stay[]` so the swap is local.
   *
   * Weights are small integers and intentionally tunable in one place.
   */
  const W_TAG_OVERLAP = 30;
  const W_FAMILY_FIT = 20;
  const W_WALKABILITY = 15;
  const W_BUDGET_FIT = 15;
  const W_CAPACITY_FIT = 10;
  const W_TIER_MATCH = 10;

  export function rankStays(stays: readonly Stay[], intent: TripIntent): Stay[] {
    const scored = stays.map((s) => ({ stay: s, score: scoreStay(s, intent) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.stay);
  }

  function scoreStay(stay: Stay, intent: TripIntent): number {
    const intentTags = new Set<VibeTag>(intent.vibe.tags);
    const overlap = stay.signals.tags.filter((t) => intentTags.has(t)).length;
    let score = overlap * W_TAG_OVERLAP;

    if (intentTags.has('family-friendly') && typeof stay.signals.familyFit === 'number') {
      score += (stay.signals.familyFit / 100) * W_FAMILY_FIT;
    }
    if (intentTags.has('walkable') && typeof stay.signals.walkability === 'number') {
      score += (stay.signals.walkability / 100) * W_WALKABILITY;
    }

    // Budget - Gaussian falloff around the user's per-night budget.
    const budgetPerNight = derivePerNightBudget(intent);
    if (budgetPerNight !== null) {
      const diff = Math.abs(stay.pricing.pricePerNight.amount - budgetPerNight);
      const sigma = budgetPerNight * 0.4 || 100;
      const fit = Math.exp(-(diff * diff) / (2 * sigma * sigma));
      score += fit * W_BUDGET_FIT;
    }

    // Capacity fit
    const totalTravelers =
      intent.travelers.adults + intent.travelers.children.count + intent.travelers.infants;
    if (stay.capacity.sleeps >= totalTravelers) {
      score += W_CAPACITY_FIT;
    }

    // Tier (luxury / budget / mid-range)
    const tierTags: VibeTag[] = ['luxury', 'budget', 'mid-range'];
    const wantedTier = tierTags.find((t) => intentTags.has(t));
    if (wantedTier && stay.signals.tags.includes(wantedTier)) {
      score += W_TIER_MATCH;
    }

    return score;
  }

  function derivePerNightBudget(intent: TripIntent): number | null {
    const b = intent.budget;
    if (b.kind === 'per-night') return b.amount;
    if (b.kind === 'total' && intent.duration.nights > 0) {
      return b.amount / intent.duration.nights;
    }
    return null;
  }
  ```

## Task 10: Mock Italy search

- [ ] Create `src/providers/mock-italy/search.ts`:
  ```ts
  import type { ProviderSearchQuery } from '@core/provider';
  import type { Stay } from '@core/stay';
  import { findDestinationBySlugOrAlias } from '@lib/curation/destinations';
  import { ALL_STAYS, STAYS_BY_DESTINATION } from './data';
  import { rankStays } from './ranking';

  /**
   * Match curated destinations from the query, filter by hard constraints
   * (capacity, budget if specified, dates basic check), and return ranked
   * stays. Deterministic given the same input.
   */
  export function searchMockItaly(
    query: ProviderSearchQuery,
    intent: { vibe: { tags: readonly string[] }; duration: { nights: number }; travelers: { adults: number; children: { count: number }; infants: number }; budget: { kind: string; amount?: number } } | undefined,
  ): { stays: Stay[]; closestMatch: boolean } {
    // 1. Match destinations
    const matched = matchDestinations(query.destinations.map((d) => d.name));
    let candidates = matched.length === 0 ? ALL_STAYS : matched;
    const closestMatch = matched.length === 0 && query.destinations.length > 0;

    // 2. Hard filter - capacity
    const totalTravelers =
      query.travelers.adults + query.travelers.children.count + query.travelers.infants;
    candidates = candidates.filter((s) => s.capacity.sleeps >= totalTravelers);

    // 3. Hard filter - explicit per-night budget cap if specified
    if (query.budget?.kind === 'per-night') {
      const cap = query.budget.amount;
      candidates = candidates.filter((s) => s.pricing.pricePerNight.amount <= cap * 1.4);
    }

    // 4. Soft filter - explicit filters from the query
    if (query.filters?.minPricePerNight !== undefined) {
      const min = query.filters.minPricePerNight;
      candidates = candidates.filter((s) => s.pricing.pricePerNight.amount >= min);
    }
    if (query.filters?.maxPricePerNight !== undefined) {
      const max = query.filters.maxPricePerNight;
      candidates = candidates.filter((s) => s.pricing.pricePerNight.amount <= max);
    }
    if (query.filters?.excludedTypes && query.filters.excludedTypes.length > 0) {
      const excluded = new Set(query.filters.excludedTypes);
      candidates = candidates.filter((s) => !excluded.has(s.type));
    }

    // 5. Rank - derive a TripIntent-shaped object from the query for the
    // ranking function. We carry vibe via the intent passed externally
    // (orchestrator passes the IntentAgent's output). For Slice A4, the
    // orchestrator wires intent through; for now, fall back to query-only.
    const ranked = rankStays(candidates, syntheticIntent(query, intent));

    // 6. Trim
    const limit = query.limit ?? 12;
    return { stays: ranked.slice(0, limit), closestMatch };
  }

  function matchDestinations(inputs: string[]): Stay[] {
    const stays: Stay[] = [];
    const seen = new Set<string>();
    for (const input of inputs) {
      const dest = findDestinationBySlugOrAlias(input);
      if (!dest) continue;
      const slugStays = STAYS_BY_DESTINATION[dest.slug] ?? [];
      for (const s of slugStays) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          stays.push(s);
        }
      }
    }
    return stays;
  }

  // Synthetic intent for Slice A3 - Slice A5 wires the real IntentAgent
  // output. The full TripIntent shape is heavy; we project just the
  // fields rankStays() reads.
  function syntheticIntent(query: ProviderSearchQuery, _intent: unknown): import('@core/trip-intent').TripIntent {
    return {
      destinations: query.destinations,
      dates: query.dates,
      duration: { nights: 7, flexible: true },
      travelers: query.travelers,
      budget: query.budget ?? { kind: 'unspecified' },
      vibe: { tags: [] },
      preferences: query.preferences ?? { amenities: [], avoid: [] },
      caveats: [],
      rawInput: '',
    };
  }
  ```

## Task 11: Mock Italy provider entrypoint

- [ ] Create `src/providers/mock-italy/index.ts`:
  ```ts
  import type { Provider, ProviderContext, ProviderSearchQuery, ProviderSearchResult } from '@core/provider';
  import { providerId } from '@core/ids';
  import type { ProviderBadge } from '@core/provider';
  import { findDestinationBySlugOrAlias } from '@lib/curation/destinations';
  import { searchMockItaly } from './search';

  const PROVIDER_ID = providerId('mock-italy');
  const DEFAULT_LATENCY_MS = 300;

  function getLatencyMs(): number {
    const env = typeof process !== 'undefined' ? process.env.MOCK_PROVIDER_LATENCY_MS : undefined;
    const parsed = env ? Number.parseInt(env, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LATENCY_MS;
  }

  function delay(ms: number, signal: AbortSignal): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  export const MockItalyProvider: Provider & {
    knowsDestination(d: { country: string; name: string }): boolean;
  } = {
    id: PROVIDER_ID,
    displayName: 'StayScout Curated · Italy',
    capabilities: {
      realtime: false,
      affiliateAttribution: false,
      supportsAvailability: false,
      supportsBooking: false,
      regions: ['IT'],
    },

    knowsDestination(d) {
      if (d.country !== 'IT') return false;
      return findDestinationBySlugOrAlias(d.name) !== null;
    },

    async search(query: ProviderSearchQuery, ctx: ProviderContext): Promise<ProviderSearchResult> {
      await delay(getLatencyMs(), ctx.signal);

      const { stays, closestMatch } = searchMockItaly(query, undefined);
      const badges: ProviderBadge[] = [];
      if (closestMatch) {
        badges.push({ kind: 'closest-match', label: 'Closest Italian destination' });
      }
      badges.push({ kind: 'curated', label: 'Hand-curated' });

      return {
        stays,
        badges,
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: 24 * 60 * 60 * 1000, // curated; effectively static
          source: 'cached',
        },
      };
    },
  };
  ```

## Task 12: Stub LLM-synthesized provider

Full impl in Slice A6 (real Claude generation). Slice A3 ships a typed stub so `routeProvider()` can return *something* for non-Italy destinations and the test surface is complete.

- [ ] Create `src/providers/llm-synthesized/index.ts`:
  ```ts
  import type { Provider, ProviderContext, ProviderSearchQuery, ProviderSearchResult } from '@core/provider';
  import { providerId } from '@core/ids';

  /**
   * Stub. Slice A6 wires the real Claude-driven generation + Unsplash
   * keyword photo resolution + 24h LRU cache. Until then, returns an
   * empty result with a 'preview' badge so callers can render the
   * "preview/AI-synthesized" UI affordance correctly.
   */
  export const LLMSynthesizedProvider: Provider = {
    id: providerId('llm-synthesized'),
    displayName: 'StayScout Preview',
    capabilities: {
      realtime: false,
      affiliateAttribution: false,
      supportsAvailability: false,
      supportsBooking: false,
    },

    async search(_query: ProviderSearchQuery, _ctx: ProviderContext): Promise<ProviderSearchResult> {
      return {
        stays: [],
        badges: [{ kind: 'preview', label: 'AI Preview (Slice A6)' }],
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: 0,
          source: 'synthesized',
        },
      };
    },
  };
  ```

## Task 13: Provider barrel + `routeProvider()`

- [ ] Replace `src/providers/index.ts`:
  ```ts
  // Layer: providers
  // Deps: core, lib

  import type { Provider } from '@core/provider';
  import type { ProviderId } from '@core/ids';
  import type { TripIntent } from '@core/trip-intent';
  import { MockItalyProvider } from './mock-italy';
  import { LLMSynthesizedProvider } from './llm-synthesized';

  export const ProviderRegistry: Readonly<Record<string, Provider>> = {
    'mock-italy': MockItalyProvider,
    'llm-synthesized': LLMSynthesizedProvider,
  };

  /**
   * Route an intent to the right provider. Slice A: simple if/else.
   * Slice B replaces with a parallel ProviderRouter that fans out to
   * multiple real providers and merges results - same return type.
   */
  export function routeProvider(intent: TripIntent): Provider {
    const dest = intent.destinations[0];
    if (dest && dest.country === 'IT' && MockItalyProvider.knowsDestination(dest)) {
      return MockItalyProvider;
    }
    return LLMSynthesizedProvider;
  }

  export function getProvider(id: ProviderId | string): Provider | null {
    return ProviderRegistry[id] ?? null;
  }
  ```

## Task 14: CI seed-quality lint test

- [ ] Create `tests/seed.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { ALL_STAYS, STAYS_BY_DESTINATION } from '@/providers/mock-italy/data';
  import { StaySchema } from '@core/stay';
  import { CURATED_MOODS } from '@lib/curation/moods';
  import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';
  import { lintField } from '@lib/quality/taste-lint';

  describe('seed quality - curated stays', () => {
    it('has the expected total count', () => {
      expect(ALL_STAYS.length).toBe(30);
    });

    it('every stay validates against StaySchema', () => {
      for (const s of ALL_STAYS) {
        // Schema strips brand types; that's fine for runtime validation.
        expect(() => StaySchema.parse(s)).not.toThrow();
      }
    });

    it('stay ids are unique and namespaced as mock-italy:<slug>', () => {
      const seen = new Set<string>();
      for (const s of ALL_STAYS) {
        expect(s.id).toMatch(/^mock-italy:[a-z0-9-]+$/);
        expect(seen.has(s.id)).toBe(false);
        seen.add(s.id);
      }
    });

    it('descriptions pass the banned-word lint', () => {
      const issues = ALL_STAYS.flatMap((s) => lintField(s.id, 'description', s.description));
      if (issues.length > 0) {
        const summary = issues.map((i) => `[${i.path}.${i.field}] "${i.word}" near "${i.sample}"`).join('\n');
        throw new Error(`taste-lint failed on ${issues.length} stay(s):\n${summary}`);
      }
    });

    it('every stay has at least one photo with an https URL', () => {
      for (const s of ALL_STAYS) {
        expect(s.photos.length).toBeGreaterThan(0);
        for (const p of s.photos) expect(p.url).toMatch(/^https:\/\//);
      }
    });

    it('prices are in a sane range', () => {
      for (const s of ALL_STAYS) {
        expect(s.pricing.pricePerNight.amount).toBeGreaterThanOrEqual(50);
        expect(s.pricing.pricePerNight.amount).toBeLessThanOrEqual(3000);
      }
    });

    it('every destination has at least one stay', () => {
      for (const dest of ITALIAN_DESTINATIONS) {
        expect((STAYS_BY_DESTINATION[dest.slug] ?? []).length).toBeGreaterThan(0);
      }
    });

    it('every curated mood passes banned-word lint', () => {
      const issues = Object.entries(CURATED_MOODS).flatMap(([slug, m]) => lintField(slug, 'mood.text', m.text));
      if (issues.length > 0) {
        throw new Error(`mood lint failed:\n${issues.map((i) => `[${i.path}] "${i.word}"`).join('\n')}`);
      }
    });

    it('every destination has a curated mood', () => {
      for (const dest of ITALIAN_DESTINATIONS) {
        expect(CURATED_MOODS[dest.slug]).toBeDefined();
      }
    });
  });

  describe('voice lint smoke', () => {
    it('catches an obvious banned word', () => {
      const r = lintField('test', 'desc', 'A magical place - your unforgettable journey starts here.');
      expect(r.length).toBeGreaterThanOrEqual(2);
    });

    it('passes restrained editorial copy', () => {
      const r = lintField('test', 'desc', 'A working vineyard since the 1100s; six rooms above the cellars.');
      expect(r.length).toBe(0);
    });
  });
  ```

## Task 15: Mock Italy provider behavior tests

- [ ] Create `tests/mock-italy.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { MockItalyProvider } from '@/providers/mock-italy';
  import type { ProviderSearchQuery } from '@core/provider';

  const ctx = { signal: new AbortController().signal, secrets: {} };

  function buildQuery(overrides: Partial<ProviderSearchQuery> = {}): ProviderSearchQuery {
    return {
      destinations: [{ kind: 'curated', name: 'Tuscany', country: 'IT' }],
      dates: { kind: 'unspecified' },
      travelers: { adults: 2, children: { count: 0 }, infants: 0 },
      ...overrides,
    };
  }

  describe('MockItalyProvider', () => {
    it('knows curated Italian destinations', () => {
      expect(MockItalyProvider.knowsDestination({ country: 'IT', name: 'Tuscany' })).toBe(true);
      expect(MockItalyProvider.knowsDestination({ country: 'IT', name: 'florence' })).toBe(true);
      expect(MockItalyProvider.knowsDestination({ country: 'JP', name: 'Tokyo' })).toBe(false);
      expect(MockItalyProvider.knowsDestination({ country: 'IT', name: 'Mars Bar' })).toBe(false);
    });

    it('returns Tuscany stays for a Tuscany query', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const result = await MockItalyProvider.search(buildQuery(), ctx);
      expect(result.stays.length).toBeGreaterThan(0);
      for (const s of result.stays) {
        expect(s.location.region).toBe('Tuscany');
      }
    });

    it('emits a curated badge', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const result = await MockItalyProvider.search(buildQuery(), ctx);
      expect(result.badges.some((b) => b.kind === 'curated')).toBe(true);
    });

    it('emits closest-match badge for unknown Italian destinations', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const result = await MockItalyProvider.search(
        buildQuery({ destinations: [{ kind: 'curated', name: 'Mars Bar', country: 'IT' }] }),
        ctx,
      );
      expect(result.badges.some((b) => b.kind === 'closest-match')).toBe(true);
    });

    it('filters by capacity', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const big = buildQuery({ travelers: { adults: 8, children: { count: 0 }, infants: 0 } });
      const result = await MockItalyProvider.search(big, ctx);
      for (const s of result.stays) expect(s.capacity.sleeps).toBeGreaterThanOrEqual(8);
    });

    it('determinism: same query returns same stays in same order', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
      const a = await MockItalyProvider.search(buildQuery(), ctx);
      const b = await MockItalyProvider.search(buildQuery(), ctx);
      expect(a.stays.map((s) => s.id)).toEqual(b.stays.map((s) => s.id));
    });

    it('respects abort signal', async () => {
      process.env.MOCK_PROVIDER_LATENCY_MS = '500';
      const ctrl = new AbortController();
      const p = MockItalyProvider.search(buildQuery(), { signal: ctrl.signal, secrets: {} });
      ctrl.abort();
      await expect(p).rejects.toMatchObject({ name: 'AbortError' });
      process.env.MOCK_PROVIDER_LATENCY_MS = '0';
    });
  });
  ```

## Task 16: Final pipeline + commit + tag

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
  git tag -a slice-a3 -m "Slice A3 complete: MockItalyProvider + curation library + 30 stays + CI seed lint"
  ```
- [ ] After A3 ships, write the Slice A4 plan (ModelClient + IntentAgent).
