import { ALL_BRANDS } from './brands';

/**
 * A cross-brand "ready to book?" link for a specific city — the funnel from
 * the numiworks intelligence hub out to the booking brands.
 */
export interface CityBookingLink {
  /** Brand key, e.g. 'gobookt'. */
  key: string;
  /** Brand display name, e.g. 'gobookt'. */
  name: string;
  /** Absolute URL to the sibling's city guide (always the canonical www host). */
  href: string;
  /** What this brand books, e.g. 'Hotels'. */
  books: string;
  /** One-line value prop. */
  blurb: string;
  /** Underlying affiliate partner shown for transparency, e.g. 'Booking.com'. */
  partner: string;
}

/**
 * The booking role each brand plays in the network. Deliberately distinct so
 * the three cards don't overlap: hotels (gobookt) vs whole-home rentals
 * (stayviaowner) vs flights/packages (gotript). numiworks is the hub, not a
 * booking destination, so it has no role here. Order = display order.
 *
 * Adding a booking brand (#5…#20)? Add its key + role here; the link is built
 * from its own siteUrl, so nothing else changes.
 */
const BOOKING_ROLES: ReadonlyArray<{
  key: string;
  books: string;
  blurb: string;
  partner: string;
}> = [
  {
    key: 'gobookt',
    books: 'Hotels',
    blurb: 'Compare hotel prices with free cancellation on most stays.',
    partner: 'Booking.com',
  },
  {
    key: 'stayviaowner',
    books: 'Vacation rentals',
    blurb: 'Whole homes, villas, cabins and beach houses by owner.',
    partner: 'VRBO',
  },
  {
    key: 'gotript',
    books: 'Flights & packages',
    blurb: 'Flights, car rentals and hotel + flight bundles in one search.',
    partner: 'Expedia',
  },
];

/**
 * Cross-brand booking links for a city, pointing at each booking brand's
 * `/destinations/{slug}` guide. Cities are shared via `@adored/seo-data`, so
 * the slug resolves on every sibling — these never 404.
 *
 * @param citySlug shared SEO city slug (e.g. 'tokyo')
 * @param opts.exclude brand key to omit (so a site never self-links)
 */
export function cityBookingLinks(
  citySlug: string,
  opts?: { exclude?: string },
): CityBookingLink[] {
  const out: CityBookingLink[] = [];
  for (const role of BOOKING_ROLES) {
    if (role.key === opts?.exclude) continue;
    const brand = ALL_BRANDS.find((b) => b.key === role.key);
    if (!brand) continue;
    out.push({
      key: brand.key,
      name: brand.name,
      href: `${brand.siteUrl}/destinations/${citySlug}`,
      books: role.books,
      blurb: role.blurb,
      partner: role.partner,
    });
  }
  return out;
}
