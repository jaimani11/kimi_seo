import { SiteHeader } from '@/features/site/site-header';
import { RentalHero } from '@/features/site/rental-hero';
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
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <RentalHero />
      <PropertyTypeGrid />
      <PopularDestinationsGrid />
      <SeoLinkFooter />
      <SiteFooter />
    </>
  );
}
