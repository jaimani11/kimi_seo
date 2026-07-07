/**
 * Normalized Property type used by every card in the discovery rail.
 *
 * This is the seam between the curated demo data we ship today and the
 * Expedia Rapid (or other live-inventory) responses we plan to wire in
 * later. Whatever the source, the cards only ever see this shape:
 *
 *   curated dataset ─┐
 *                    ├── Property ── card components
 *   Rapid response ──┘
 *
 * Keep this shape PRESENTATIONAL: no source-specific fields, no
 * provider-internal ids. The provider mapper is responsible for
 * massaging its native shape into a Property before handing it off.
 *
 * Pricing is intentionally opaque (`fromUsd` is a single number, plus a
 * coarse band) because the per-night display logic varies by section
 * layout. The cards don't want to know whether USD came from a totals
 * computation or a nightly rate; the mapper has already decided.
 */

export type PriceBand = 'aspirational' | 'premium' | 'comfort' | 'value';

export type CancellationPolicy = 'free-flexible' | 'free-limited' | 'non-refundable';

/** ISO-3166-1 alpha-2 country code. */
export type CountryCode = string;

export interface PropertyPhoto {
  /** Unsplash photo id (the part after `/photo-` in the URL). */
  id: string;
  alt: string;
  /** Hex pair used as a graceful fallback when the photo 404s.
   *  Matches the gradient the SafePhoto component uses on error. */
  fallbackGradient: [string, string];
}

export interface PropertyAffiliate {
  /** Which partner handles the booking. Drives both the disclosure
   *  copy ("Search on Expedia") and the click attribution. */
  providerId: 'expedia' | 'vrbo' | 'hotels-com';
  /** Destination string handed to the provider's search-URL builder
   *  (e.g. "Lake Como, Italy", "Maldives"). Often matches
   *  Property.destination but sometimes more specific so the search
   *  lands on the right page (Expedia's resolver is fuzzy; helping it
   *  with country context lifts result quality). */
  searchDestination: string;
  /** Stable identifier for analytics; doesn't have to be unique
   *  across providers. */
  stayId: string;
  /** Default occupancy assumed when the affiliate URL is built. */
  defaultAdults: number;
}

export interface Property {
  /** Stable id for keys + analytics. Curated stays use a slug; live
   *  inventory will use the provider's property id. */
  id: string;
  /** Display name for the stay itself (e.g. "Aman Tokyo", "Villa
   *  Cetinale"). */
  name: string;
  /** City/region label shown under the name. */
  destination: string;
  /** Country code; lets the card render a flag-or-region label and
   *  drives currency display when we localize. */
  country: CountryCode;
  /** Optional neighborhood/area refinement (e.g. "Otemachi",
   *  "Tuscan hills"). */
  neighborhood?: string;
  photo: PropertyPhoto;
  pricing: {
    fromUsd: number;
    band: PriceBand;
    /** Display-only token: "from $640 / night", "from $4,200 / 5 nights".
     *  The mapper picks the cadence that matches the source. */
    unit: 'night' | 'stay';
  };
  rating: {
    /** 0-10, two-decimal precision (matches Expedia/Booking convention). */
    score: number;
    /** Review count - signals trust, not just score. */
    reviews: number;
  };
  /** Short list of standout amenities/feelings to badge on the card.
   *  Order matters: first 2-3 are the ones the card renders. */
  amenities: readonly string[];
  /** Editorial copy: the "why this stay matters" line. Shown as the
   *  italic blurb beneath the price on hero + standard cards. */
  pitch: string;
  /** Tags used by the section-curation logic (also useful for
   *  filtering on destination pages later). */
  tags: {
    /** Who this stay is for. Used by "Romantic escapes",
     *  "Family villas", etc. */
    bestFor: readonly string[];
    /** Aesthetic vibes - "beachfront", "mountain", "design-led".
     *  Used by the trending/hidden-gems logic and by the future
     *  destination-page filter chips. */
    vibes: readonly string[];
    /** Luxury markers - "private-pool", "michelin-on-site",
     *  "butler". Power the "Luxury beach stays" type sections and
     *  the editorial slabs. */
    luxury: readonly string[];
  };
  cancellation: CancellationPolicy;
  affiliate: PropertyAffiliate;
}

/**
 * Discriminated union covering the four layouts the discovery system
 * ships with for G1. Each variant has its own slice of metadata so
 * sections can be richer than "title + items".
 *
 * - `carousel`: horizontal scroll of compact cards, 4-8 items.
 * - `hero-rail`: 1 hero card on the left, 3-4 standard cards on the right.
 * - `grid`: balanced 2-by-3 or 3-by-2 grid of standard cards.
 * - `editorial-slab`: asymmetric 2-up with a copy callout between
 *   them; feels magazine-y.
 */
export type DiscoverySectionLayout =
  | { variant: 'carousel' }
  | { variant: 'hero-rail' }
  | { variant: 'grid' }
  | { variant: 'editorial-slab'; copy: { headline: string; body: string } };

export interface DiscoverySection {
  /** URL-safe slug (also doubles as the React key). */
  slug: string;
  /** Short uppercased eyebrow ("Trending now", "Romantic escapes"). */
  eyebrow: string;
  /** Display title - the editorial sentence shown to the user. */
  title: string;
  /** One-line subtitle/blurb under the title. */
  subtitle: string;
  layout: DiscoverySectionLayout;
  properties: readonly Property[];
}

/**
 * Sanity-check a curated section as it loads. Catches typos in slugs,
 * empty rail data, layout/data mismatches (e.g. a hero-rail needs at
 * least 3 properties for the right-side stack to look right).
 *
 * Throws on failure rather than returning a Result because section
 * data is build-time content; a bad section is a developer bug we
 * want to fail fast on.
 */
export function assertValidSection(section: DiscoverySection): void {
  if (!section.slug) throw new Error('section.slug is required');
  if (!/^[a-z0-9-]+$/.test(section.slug)) {
    throw new Error(`section.slug "${section.slug}" must be lowercase kebab-case`);
  }
  if (section.properties.length === 0) {
    throw new Error(`section "${section.slug}" has no properties`);
  }
  switch (section.layout.variant) {
    case 'carousel':
      if (section.properties.length < 4) {
        throw new Error(`carousel "${section.slug}" needs at least 4 properties`);
      }
      break;
    case 'hero-rail':
      if (section.properties.length < 4) {
        throw new Error(`hero-rail "${section.slug}" needs at least 4 properties`);
      }
      break;
    case 'grid':
      if (section.properties.length < 4 || section.properties.length > 6) {
        throw new Error(`grid "${section.slug}" needs 4-6 properties`);
      }
      break;
    case 'editorial-slab':
      if (section.properties.length !== 2) {
        throw new Error(`editorial-slab "${section.slug}" needs exactly 2 properties`);
      }
      break;
  }
}

/**
 * Build the public-facing photo URL from a Property. Centralizing this
 * keeps every card on the same CDN policy (quality, format) and gives
 * the SafePhoto component one obvious place to swap if we move off
 * Unsplash.
 */
export function propertyPhotoUrl(photo: PropertyPhoto, width: number): string {
  return `https://images.unsplash.com/photo-${photo.id}?w=${width}&q=80&fit=crop&auto=format`;
}
