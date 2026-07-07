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
import { LLMStayBatchSchema, coerceLlmStayBatch, mapLLMStayToStay } from './llm-stay';
import { LLM_SYNTHESIZED_SYSTEM_PROMPT, buildLlmStayUserPrompt } from './prompts';

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

  async search(query: ProviderSearchQuery, _ctx: ProviderContext): Promise<ProviderSearchResult> {
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

    let batch: { stays: ReturnType<typeof mapLLMStayToStay> extends infer _s ? unknown : never };
    try {
      // Resilience: the model occasionally invents vibe tags outside
      // our closed taxonomy or otherwise fumbles the schema. The
      // `coerce` hook filters obvious junk before Zod's strict parse;
      // anything still unfixable falls into the catch below and the
      // provider returns an empty result rather than bubbling
      // turn.failed up to the user.
      batch = (await this.modelClient.generate({
        model: MODEL_ID,
        system: LLM_SYNTHESIZED_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        responseSchema: LLMStayBatchSchema,
        cacheKey: 'llm-synthesized-stays-v1',
        maxTokens: 3072,
        temperature: 0.6,
        coerce: coerceLlmStayBatch,
      })) as never;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      console.warn(
        '[llm-synthesized] model call failed - returning empty result, orchestrator will surface a friendly empty-search message',
        { error: err instanceof Error ? err.message : String(err) },
      );
      return this.emptyResult();
    }

    const stays = (batch as { stays: Parameters<typeof mapLLMStayToStay>[0][] }).stays.map(
      mapLLMStayToStay,
    );
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
  // The Slice A SearchAgent doesn't yet pass vibe tags through the query
  // shape; we use amenities/avoid as a weak proxy. Slice B's SearchAgent
  // populates richer signals.
  const ams = query.preferences?.amenities ?? [];
  const avoids = query.preferences?.avoid ?? [];
  return [...ams, ...avoids];
}

// Stub kept for the default `routeProvider` consumed by tests/orchestrator
// outside the production singleton - returns empty results without touching
// a model client.
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
