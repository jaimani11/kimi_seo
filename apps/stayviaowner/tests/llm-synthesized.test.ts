import { describe, expect, it } from 'vitest';
import { LLMSynthesizedProvider } from '@/providers/llm-synthesized';
import {
  coerceLlmStayBatch,
  LLMStayBatchSchema,
  mapLLMStayToStay,
  type LLMStay,
} from '@/providers/llm-synthesized/llm-stay';
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
  description:
    'Six tatami rooms above a coffee shop in old Tokyo. Steps from the cemetery park; mornings smell like roasted beans.',
  pricePerNight: 220,
  currency: 'USD',
  amenities: ['Breakfast included', 'Wi-Fi', 'Walking distance to subway'],
  capacity: { sleeps: 2, bedrooms: 1, bathrooms: 1 },
  vibe: ['mid-range', 'walkable', 'foodie', 'avoid-tourist-traps'],
  walkability: 92,
  photoCategory: 'cityscape',
};

const sampleLLMStay2: LLMStay = {
  ...sampleLLMStay,
  slug: 'tokyo-bay-tower',
  name: 'A modern apartment overlooking the bay',
  type: 'apartment',
  pricePerNight: 380,
  vibe: ['mid-range', 'urban', 'fast-paced'],
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

  it('attaches a slug-driven unsplash photo from the category pool', () => {
    const stay = mapLLMStayToStay(sampleLLMStay);
    // Slice E1: photo selection is `(category, slug)` → deterministic
    // pool index. Same slug → same photo.
    expect(stay.photos[0]?.url).toContain(resolvePhotoId('cityscape', sampleLLMStay.slug));
  });

  it('different slugs in the same category get different photos (diversification)', () => {
    const a = mapLLMStayToStay({ ...sampleLLMStay, slug: 'tokyo-quiet-house' });
    const b = mapLLMStayToStay({ ...sampleLLMStay, slug: 'kyoto-machiya' });
    const c = mapLLMStayToStay({ ...sampleLLMStay, slug: 'shibuya-pod' });
    // Pool size is 6 per category; three well-spaced slugs should
    // produce at least two distinct photos (the diversification
    // guarantee). Strict "all three differ" can fail by birthday-
    // paradox; "≥2 distinct" is the meaningful bar.
    const urls = new Set([a.photos[0]?.url, b.photos[0]?.url, c.photos[0]?.url]);
    expect(urls.size).toBeGreaterThanOrEqual(2);
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
    const client = new MockModelClient().respondGenerate(() => ({
      stays: [sampleLLMStay, sampleLLMStay2],
    }));
    const provider = new LLMSynthesizedProvider(client);
    const result = await provider.search(buildQuery(), ctx);
    expect(result.stays.length).toBe(2);
    expect(result.stays[0]?.name).toBe(sampleLLMStay.name);
    expect(result.badges.some((b) => b.kind === 'preview')).toBe(true);
    expect(result.freshness.source).toBe('synthesized');
  });

  it('caches by (destination, vibe, budget) - second call hits cache', async () => {
    let calls = 0;
    const client = new MockModelClient().respondGenerate(() => {
      calls += 1;
      return { stays: [sampleLLMStay, sampleLLMStay2] };
    });
    const provider = new LLMSynthesizedProvider(client);
    await provider.search(buildQuery(), ctx);
    await provider.search(buildQuery(), ctx);
    expect(calls).toBe(1);
  });

  it('returns empty result when no destination given', async () => {
    const client = new MockModelClient();
    const provider = new LLMSynthesizedProvider(client);
    const result = await provider.search(buildQuery({ destinations: [] }), ctx);
    expect(result.stays).toEqual([]);
  });
});

describe('coerceLlmStayBatch - vibe + price tolerance', () => {
  function bareStay(overrides: Partial<LLMStay> & Record<string, unknown> = {}) {
    return {
      ...sampleLLMStay,
      ...overrides,
    };
  }

  it('keeps a luxury Tokyo-shaped batch ($4–8K/night) parseable', () => {
    // Regression for the production bug: model returns Aman/Mandarin/
    // Park Hyatt for "Tokyo for a long weekend" and the entire batch
    // was rejected by the old `pricePerNight.max(3000)`. Now passes.
    const raw = {
      stays: [
        bareStay({ slug: 'aman-tokyo', pricePerNight: 4200 }),
        bareStay({ slug: 'mandarin-tokyo', pricePerNight: 6800 }),
      ],
    };
    const coerced = coerceLlmStayBatch(raw);
    const parsed = LLMStayBatchSchema.safeParse(coerced);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.stays).toHaveLength(2);
      expect(parsed.data.stays[0]?.pricePerNight).toBe(4200);
    }
  });

  it('clamps a hallucinated above-cap price to the ceiling', () => {
    const raw = { stays: [bareStay({ pricePerNight: 999_999 })] };
    const coerced = coerceLlmStayBatch(raw) as { stays: LLMStay[] };
    expect(coerced.stays[0]?.pricePerNight).toBe(25_000);
    expect(LLMStayBatchSchema.safeParse(coerced).success).toBe(false); // batch min 2 - but stay-level parse OK if alone
  });

  it('clamps a below-floor price up to the minimum', () => {
    const raw = {
      stays: [bareStay({ pricePerNight: 12 }), bareStay({ slug: 'b', pricePerNight: 12 })],
    };
    const coerced = coerceLlmStayBatch(raw) as { stays: LLMStay[] };
    expect(coerced.stays[0]?.pricePerNight).toBe(40);
    const parsed = LLMStayBatchSchema.safeParse(coerced);
    expect(parsed.success).toBe(true);
  });

  it('rounds fractional prices to nearest int after clamping', () => {
    const raw = {
      stays: [bareStay({ pricePerNight: 27_500.7 }), bareStay({ slug: 'b', pricePerNight: 199.4 })],
    };
    const coerced = coerceLlmStayBatch(raw) as { stays: LLMStay[] };
    expect(coerced.stays[0]?.pricePerNight).toBe(25_000); // clamped
    expect(coerced.stays[1]?.pricePerNight).toBe(199); // rounded
  });

  it('still filters invalid vibe tags + preserves at least one', () => {
    const raw = {
      stays: [
        bareStay({ vibe: ['countryside', 'lakeside', 'walkable'] as never }),
        bareStay({ slug: 'b', vibe: ['nonsense', 'gibberish'] as never }),
      ],
    };
    const coerced = coerceLlmStayBatch(raw) as { stays: LLMStay[] };
    expect(coerced.stays[0]?.vibe).toEqual(['walkable']);
    expect(coerced.stays[1]?.vibe).toEqual(['cultural']); // placeholder
  });
});
