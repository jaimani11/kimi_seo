import { z } from 'zod';
import { VibeTagSchema } from './trip-intent';

/**
 * Slice F1 - Search opportunity payload.
 *
 * Emitted as `search.opportunity.ready` when the orchestrator decides
 * we don't have real or curated inventory for the destination. Instead
 * of synthesizing fake property listings, we surface a set of real
 * affiliate-search URLs prefilled with the user's intent.
 *
 * Active emit: three Viator destination-search slots — top
 * experiences, day trips, and food & cooking — each landing on
 * viator.com with the affiliate pid attached. The user gets bookable
 * Viator inventory in the destination, which is what stayviaowner
 * monetizes.
 *
 * Legacy slot ids ('expedia' / 'vrbo' / 'hotels-com') stay in the
 * enum so persisted historical payloads still validate; new
 * opportunities use the viator-* slot ids.
 *
 * The UI renders this as `<SearchOpportunityBoard>` - distinct from
 * `<TripBoard>` (which renders `proposal.ready` with property cards).
 */

export const OpportunityProviderIdSchema = z.enum([
  // Active Viator slots.
  'viator-top',
  'viator-day-trips',
  'viator-food',
  // Legacy hotel-flavor slots — preserved so persisted historical
  // opportunity payloads validate without a migration.
  'expedia',
  'vrbo',
  'hotels-com',
]);
export type OpportunityProviderId = z.infer<typeof OpportunityProviderIdSchema>;

export const SearchOpportunityProviderSchema = z.object({
  providerId: OpportunityProviderIdSchema,
  /** Human-readable provider name for the chip + button label. */
  displayName: z.string().min(1).max(64),
  /** Real affiliate URL (already affcid-attached when configured).
   *  Routed through `/r/[id]` for click attribution. */
  url: z.string().url(),
  /** Optional one-line hint explaining why this provider is a good
   *  fit for this destination (e.g. "Vrbo is strong here - ski-in
   *  chalets, lots of rentals."). Omitted when the default tagline
   *  suffices. */
  hint: z.string().max(180).optional(),
});
export type SearchOpportunityProvider = z.infer<typeof SearchOpportunityProviderSchema>;

export const SearchOpportunitySchema = z.object({
  destination: z.object({
    name: z.string().min(1).max(120),
    country: z.string().length(2),
    region: z.string().optional(),
  }),
  /** Snapshot of the user's intent at opportunity-build time. Used
   *  for the intent-digest chip ("2 adults · Sep 1–5 · luxury, walkable")
   *  and to re-build URLs when the user refines. */
  intentDigest: z.object({
    vibeTags: z.array(VibeTagSchema),
    checkIn: z.string().min(8), // ISO YYYY-MM-DD
    checkOut: z.string().min(8),
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(20),
  }),
  /** One per provider, in display order. */
  providers: z.array(SearchOpportunityProviderSchema).min(1).max(5),
  /** One-line "feel of the place" editorial copy from the
   *  DestinationFlavorAgent. Optional - the UI degrades gracefully
   *  when absent. */
  flavor: z.string().max(220).optional(),
  /** Hero photo for the destination. Resolved via the destination
   *  photo lookup; falls back to the category pool for unknown
   *  destinations. */
  photoUrl: z.string().url(),
  photoAlt: z.string().min(1).max(180),
  photoCredit: z.string().min(1).max(64),
  fetchedAt: z.string().datetime(),
});
export type SearchOpportunity = z.infer<typeof SearchOpportunitySchema>;
