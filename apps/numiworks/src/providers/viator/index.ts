import { providerId, type ProviderId } from '@core/ids';
import type {
  ExperienceProvider,
  ExperienceProviderSearchQuery,
  ExperienceProviderSearchResult,
} from '@core/experience-provider';
import type { ProviderBadge, ProviderCapabilities, ProviderContext } from '@core/provider';
import { viatorClientFromEnv } from './client';
import type { ViatorClient } from './client';
import { mapViatorProductToExperience } from './mapper';
import type { ViatorFreetextSearchRequest } from './types';

/**
 * ExperienceProvider implementation backed by Viator's Partner API.
 *
 * Slice H1 surfaces a single endpoint - `/search/freetext` - because
 * it's the natural fit for both the homepage rails (curated theme
 * terms like "luxury yacht charter") and chat result enrichment
 * (the user's prompt routed verbatim).
 *
 * The provider is stateless and HTTPS-only. Errors propagate up to
 * the orchestrator's degradation policy; this provider never returns
 * a fake result on failure - that's the orchestrator's call to make
 * (showing nothing is usually better than showing wrong inventory).
 */

export class ViatorExperienceProvider implements ExperienceProvider {
  readonly id: ProviderId = providerId('viator');
  readonly displayName = 'Viator';
  readonly capabilities: ProviderCapabilities = {
    realtime: true,
    affiliateAttribution: true,
    supportsAvailability: false, // /availability/check is reachable but not wired in H1
    supportsBooking: false, // /bookings/* is reachable but not wired in H1
    regions: undefined, // Viator is global; the orchestrator scopes by destination
  };

  readonly #client: ViatorClient;
  readonly #defaultCurrency: string;
  readonly #defaultLimit: number;

  constructor(client: ViatorClient, options: { defaultCurrency?: string; defaultLimit?: number } = {}) {
    this.#client = client;
    this.#defaultCurrency = options.defaultCurrency ?? 'USD';
    this.#defaultLimit = options.defaultLimit ?? 12;
  }

  async search(
    q: ExperienceProviderSearchQuery,
    ctx: ProviderContext,
  ): Promise<ExperienceProviderSearchResult> {
    const currency = q.currency ?? this.#defaultCurrency;
    const limit = Math.max(1, Math.min(50, q.limit ?? this.#defaultLimit));

    // The discovery rails sometimes prepend the theme to the search
    // term so Viator's relevance ranker emphasizes the editorial slice
    // ("luxury yacht charter" beats "Mediterranean" + tag filter for
    // our purposes). The orchestrator is welcome to pass a fully
    // baked term and skip this.
    const searchTerm = [q.theme, q.searchTerm].filter(Boolean).join(' ').trim() || q.searchTerm;

    const body: ViatorFreetextSearchRequest = {
      searchTerm,
      currency,
      searchTypes: [{ searchType: 'PRODUCTS', pagination: { start: 1, count: limit } }],
    };

    const fetchedAt = new Date().toISOString();
    const response = await this.#client.freetextSearch(body, ctx.signal);
    const raw = response.products?.results ?? [];

    const experiences = raw.map((p) =>
      mapViatorProductToExperience(p, { currency }),
    );

    const badges: ProviderBadge[] = [{ kind: 'live', label: 'Live · Viator' }];

    return {
      experiences,
      badges,
      freshness: {
        fetchedAt,
        dataMaxAgeMs: 60 * 60 * 1000, // Viator content updates daily; 1h client cache.
        source: 'live',
      },
    };
  }
}

/**
 * Build a `ViatorExperienceProvider` from env, returning null when
 * `VIATOR_API_KEY` isn't set. Callers should handle the null case by
 * skipping the live rail rather than throwing - the homepage must
 * still render for unauthenticated visitors and dev environments
 * without keys.
 */
export function viatorProviderFromEnv(): ViatorExperienceProvider | null {
  const client = viatorClientFromEnv();
  if (!client) return null;
  const currency = (process.env.VIATOR_DEFAULT_CURRENCY ?? '').trim() || undefined;
  const options: { defaultCurrency?: string } = {};
  if (currency) options.defaultCurrency = currency;
  return new ViatorExperienceProvider(client, options);
}
