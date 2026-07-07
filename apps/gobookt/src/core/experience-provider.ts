import type { ProviderId } from './ids';
import type { ProviderBadge, ProviderCapabilities, ProviderContext } from './provider';
import type { FreshnessInfo } from './trust';
import type { Experience } from './experience';

/**
 * Sibling to `Provider` (which is stay-shaped). Experience providers
 * return tour/activity inventory rather than overnight stays. The
 * orchestrator routes searches to the right provider class based on
 * the user's intent and what surfaces are being populated.
 *
 * Why a sibling rather than widening `Provider`:
 *
 *   - Search queries differ. Stays are anchored on dates + occupancy;
 *     experiences add duration, group size, language, time of day.
 *   - Result cards differ. An experience card needs duration, meeting
 *     point, instant-vs-on-request confirmation - a stay card needs
 *     room count, check-in/check-out.
 *   - The "compareSet" semantics differ. Two stays in the same city
 *     are comparable; two experiences may be from different
 *     categories ("food tour" vs. "boat charter").
 *
 * Capability flags are reused from `Provider.capabilities` - the
 * underlying truth ("realtime?", "supportsAvailability?") is the
 * same concept regardless of content type.
 */

export interface ExperienceProviderSearchQuery {
  /** Free-text term the user typed - the only required field.
   *
   *  Viator's `/search/freetext` consumes this directly; other
   *  providers may use it as a starting point and add more structured
   *  filters via the optional fields below. */
  searchTerm: string;
  /** ISO-4217 currency for prices in both directions. Defaults to
   *  USD; the orchestrator can override based on the user's locale. */
  currency?: string;
  /** ISO-639-1 language tag used for the `Accept-Language` header
   *  on Viator and the equivalent on other providers. Drives
   *  localized titles + descriptions. */
  acceptLanguage?: string;
  /** Optional ISO-3166-1 alpha-2 country code that scopes the search.
   *  Providers that don't natively scope by country may ignore it. */
  country?: string;
  /** Cap on results. Providers can return fewer; cards should not
   *  assume the response is exhaustive. */
  limit?: number;
  /** Used by the rail system to ask for visually-distinct themed
   *  results - "luxury", "family-friendly", "food", etc. Mapped to
   *  the provider's tag/category system by the provider class. */
  theme?: string;
}

export interface ExperienceProviderSearchResult {
  experiences: Experience[];
  badges: ProviderBadge[];
  freshness: FreshnessInfo;
  pagination?: { cursor?: string; hasMore: boolean };
}

export interface ExperienceProvider {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;
  search(
    q: ExperienceProviderSearchQuery,
    ctx: ProviderContext,
  ): Promise<ExperienceProviderSearchResult>;
}
