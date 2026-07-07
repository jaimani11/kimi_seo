import type {
  Provider,
  ProviderBadge,
  ProviderCapabilities,
  ProviderContext,
  ProviderSearchQuery,
  ProviderSearchResult,
} from '@core/provider';
import type { ProviderId } from '@core/ids';
import type { Stay } from '@core/stay';
import { LRUCache } from './cache';
import { canonicalizeQuery } from './canonical-query';
import { CircuitBreaker, CircuitBreakerOpenError } from './circuit-breaker';

/**
 * Shared base class for real (affiliate) providers.
 *
 * Subclasses implement two protected methods:
 *   - `fetchStays(query, ctx)`: hit the upstream API, return raw stays
 *   - `buildBadges(query, stays)`: provider-specific badge labels
 *
 * Everything else - caching, freshness metadata, error wrapping - is
 * inherited. New providers should be tiny: declare endpoint + auth in
 * the subclass, lean on the base for the search() lifecycle.
 *
 * Cache: per-instance LRU keyed on canonical query hash. TTL is
 * subclass-configurable (default 30 minutes - industry norm for hotel
 * meta-search availability).
 */
export interface BaseAffiliateProviderOptions {
  id: ProviderId;
  displayName: string;
  capabilities: ProviderCapabilities;
  /** TTL for cached search results, in ms. Default 30min. */
  cacheTtlMs?: number;
  /** Max cache entries. Default 500. */
  cacheMax?: number;
  /** How old the cached data is allowed to be before badging cached/stale. */
  dataMaxAgeMs?: number;
  /** Circuit breaker - open after N consecutive failures, default 5. */
  circuitThreshold?: number;
  /** Circuit cooldown ms before half-open trial, default 30s. */
  circuitCooldownMs?: number;
}

export abstract class BaseAffiliateProvider implements Provider {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;
  protected readonly cacheTtlMs: number;
  protected readonly dataMaxAgeMs: number;
  protected readonly cache: LRUCache<string, Stay[]>;
  protected readonly breaker: CircuitBreaker;

  constructor(opts: BaseAffiliateProviderOptions) {
    this.id = opts.id;
    this.displayName = opts.displayName;
    this.capabilities = opts.capabilities;
    this.cacheTtlMs = opts.cacheTtlMs ?? 30 * 60 * 1000;
    this.dataMaxAgeMs = opts.dataMaxAgeMs ?? 30 * 60 * 1000;
    this.cache = new LRUCache<string, Stay[]>(opts.cacheMax ?? 500);
    this.breaker = new CircuitBreaker(opts.id as string, {
      ...(opts.circuitThreshold !== undefined ? { threshold: opts.circuitThreshold } : {}),
      ...(opts.circuitCooldownMs !== undefined ? { cooldownMs: opts.circuitCooldownMs } : {}),
    });
  }

  async search(q: ProviderSearchQuery, ctx: ProviderContext): Promise<ProviderSearchResult> {
    const key = canonicalizeQuery(q);
    const cached = this.cache.get(key);
    if (cached) {
      return {
        stays: cached,
        badges: this.buildBadges(q, cached),
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: this.dataMaxAgeMs,
          source: 'cached',
        },
      };
    }

    let stays: Stay[];
    try {
      stays = await this.breaker.run(() => this.fetchStays(q, ctx));
    } catch (err) {
      // Circuit open OR fetchStays threw - return empty so the fanout
      // falls through to other providers. The error already counted
      // toward the breaker's failure threshold (or originated FROM the
      // breaker rejecting fast). Log at warn so operators see it.
      if (err instanceof CircuitBreakerOpenError) {
        console.warn(`[${this.id as string}] circuit open - skipping fetch`);
      } else {
        console.warn(`[${this.id as string}] fetch failed:`, err);
      }
      return {
        stays: [],
        badges: [],
        freshness: {
          fetchedAt: new Date().toISOString(),
          dataMaxAgeMs: this.dataMaxAgeMs,
          source: 'live',
        },
      };
    }
    this.cache.set(key, stays, this.cacheTtlMs);

    return {
      stays,
      badges: this.buildBadges(q, stays),
      freshness: {
        fetchedAt: new Date().toISOString(),
        dataMaxAgeMs: this.dataMaxAgeMs,
        source: 'live',
      },
    };
  }

  /** Subclass: hit the upstream + return mapped Stay[]. */
  protected abstract fetchStays(q: ProviderSearchQuery, ctx: ProviderContext): Promise<Stay[]>;

  /** Subclass: provider-specific badges (e.g. "Live availability"). */
  protected abstract buildBadges(q: ProviderSearchQuery, stays: Stay[]): ProviderBadge[];
}
