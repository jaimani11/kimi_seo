import type { ProviderSearchQuery } from '@core/provider';

/**
 * Stable string representation of a `ProviderSearchQuery` for use as a
 * cache key. Two queries that semantically match the same search must
 * produce identical strings - order-independent for arrays, JSON-safe.
 *
 * Fields explicitly EXCLUDED from the key:
 *   - `compareSet` - affects ranking, not the search universe; same
 *     stays come back regardless.
 *   - `temporalContext` - coarse-grained (season, weekend), invariant
 *     within the cache TTL window.
 *
 * Fields normalized:
 *   - destinations sorted by name then country (a 2-city query and its
 *     reverse should hit the same cache entry).
 *   - amenities + tags sorted alphabetically.
 */
export function canonicalizeQuery(q: ProviderSearchQuery): string {
  const destinations = [...q.destinations]
    .map((d) => ({ kind: d.kind, name: d.name, country: d.country, region: d.region ?? null }))
    .sort((a, b) =>
      a.name === b.name ? a.country.localeCompare(b.country) : a.name.localeCompare(b.name),
    );

  const preferences = q.preferences
    ? {
        amenities: [...(q.preferences.amenities ?? [])].sort(),
        avoid: [...(q.preferences.avoid ?? [])].sort(),
      }
    : null;

  const filters = q.filters
    ? {
        minPricePerNight: q.filters.minPricePerNight ?? null,
        maxPricePerNight: q.filters.maxPricePerNight ?? null,
        requiredAmenities: [...(q.filters.requiredAmenities ?? [])].sort(),
        excludedTypes: [...(q.filters.excludedTypes ?? [])].sort(),
      }
    : null;

  const payload = {
    destinations,
    dates: q.dates,
    travelers: q.travelers,
    budget: q.budget ?? null,
    preferences,
    filters,
    limit: q.limit ?? null,
  };
  return JSON.stringify(payload);
}
