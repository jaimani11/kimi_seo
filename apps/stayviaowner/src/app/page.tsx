import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { RentalHero } from '@/features/site/rental-hero';
import { StatsBand } from '@/features/site/stats-band';
import { PropertyTypeGrid } from '@/features/site/property-type-grid';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import { SeoLinkFooter } from '@/features/site/seo-link-footer';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * StayViaOwner homepage — vacation-rental discovery.
 *
 * Layout (top → bottom):
 *
 *   SiteHeader              : dark-navy nav with 3-column
 *                             RENTALS mega-menu (matches the
 *                             RentByOwner reference).
 *   RentalHero              : full-bleed dark hero + destination
 *                             search that redirects to VRBO / Expedia
 *                             for the picked destination + dates.
 *   PropertyTypeGrid        : 6 cards linking to /villas, /cabins,
 *                             /cottages, /beach-houses, /ski-lodges,
 *                             /lake-houses.
 *   PopularDestinationsGrid : city discovery — reused from gotript.
 *   SeoLinkFooter           : indexable link footer.
 *   SiteFooter              : minimal legal footer.
 */
// Homepage-specific title/description. Keyword-first for search, brand-
// suffixed for recognition — overrides the generic layout default. The
// self-referencing canonical still comes from the layout (x-pathname).
export const metadata: Metadata = {
  title: 'Vacation Rentals by Owner — Villas, Cabins & Cottages | stayviaowner',
  description:
    'Book vacation rentals worldwide — villas, cabins, beach houses, cottages and whole homes. Real-time availability and prices across 190+ countries.',
  openGraph: {
    title: 'Vacation Rentals by Owner — Villas, Cabins & Beach Houses Worldwide',
    description:
      'Whole-home vacation rentals across 190+ countries — villas, cabins, beach houses and cottages with real-time availability and prices.',
    type: 'website',
    siteName: 'stayviaowner',
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <RentalHero />
      <StatsBand />
      <PropertyTypeGrid />
      <PopularDestinationsGrid />
      <SeoLinkFooter />
      <SiteFooter />
    </>
  );
}
