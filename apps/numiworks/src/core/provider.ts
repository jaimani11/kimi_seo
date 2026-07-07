import { z } from 'zod';
import type { ProviderId } from './ids';
import type { Stay } from './stay';
import type {
  Destination,
  BudgetIntent,
  TravelerComposition,
  TripDates,
  TripPreferences,
} from './trip-intent';
import type { TemporalContext } from './temporal';
import type { FreshnessInfo } from './trust';

// Capabilities are runtime data, so they get a Zod schema too - useful for
// a future ProviderRegistry that validates third-party providers.
export const ProviderCapabilitiesSchema = z.object({
  realtime: z.boolean(),
  affiliateAttribution: z.boolean(),
  supportsAvailability: z.boolean(),
  supportsBooking: z.boolean(),
  regions: z.array(z.string().length(2)).optional(), // ISO 3166 alpha-2
});
export type ProviderCapabilities = z.infer<typeof ProviderCapabilitiesSchema>;

export const ProviderBadgeSchema = z.object({
  // - 'live'           - real-time partner availability (Expedia, Vrbo, Booking.com)
  // - 'preview'        - AI-synthesized listing, no live availability
  // - 'closest-match'  - supplied results don't exactly match query
  // - 'curated'        - hand-picked dataset (mock-italy)
  // - 'wholesaler'     - aggregator surface (Hotelbeds-class)
  kind: z.enum(['live', 'preview', 'closest-match', 'curated', 'wholesaler']),
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
  compareSet?: string[]; // StayId list - ranking-aware comparison seam
  temporalContext?: TemporalContext; // populated by Slice B
}

export interface ProviderSearchResult {
  stays: Stay[];
  badges: ProviderBadge[];
  pagination?: { cursor?: string; hasMore: boolean };
  freshness: FreshnessInfo;
}

export interface ProviderContext {
  readonly signal: AbortSignal;
  readonly secrets: Readonly<Record<string, string>>; // Slice B+: API keys live here
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
