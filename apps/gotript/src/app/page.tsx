import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { MultiCategoryHero } from '@/features/site/multi-category-hero';
import { PropertyTypeRail } from '@/features/site/property-type-rail';
import { StatsBand } from '@/features/site/stats-band';
import { AgenticHero } from '@/features/site/agentic-hero';
import { RecentlyViewedRail } from '@/features/site/recently-viewed-rail';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import { HowGotriptWorks } from '@/features/site/how-it-works';
import { SeoLinkFooter } from '@/features/site/seo-link-footer';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * Gotript homepage — multi-category Expedia affiliate hub.
 *
 * Layout (top → bottom):
 *
 *   SiteHeader              : sticky nav with 5 category links
 *                             (Stays / Flights / Things to do / Cars
 *                             / Cruises) + Destinations + Concierge.
 *   MultiCategoryHero       : 5-tab search form. Picks destination +
 *                             dates + party, redirects to Expedia
 *                             for the chosen vertical via /api/go/expedia.
 *   StatsBand               : numbered trust strip.
 *   AgenticHero             : AI concierge — frames "plan my whole
 *                             trip" rather than just experiences.
 *   RecentlyViewedRail      : recently-viewed pickup, only renders
 *                             after the visitor has activity.
 *   PopularDestinationsGrid : 12 destination tiles.
 *   HowGotriptWorks         : 3-step trust strip.
 *   SeoLinkFooter           : indexable link footer.
 *   SiteFooter              : minimal legal footer.
 */
// Homepage-specific title/description. Keyword-first for search, brand-
// suffixed for recognition — overrides the generic layout default. The
// self-referencing canonical still comes from the layout (x-pathname).
export const metadata: Metadata = {
  title: 'Vacation Rentals, Hotels & Things to Do Worldwide | gotript',
  description:
    'Find vacation rentals, whole homes and hotels, plus flights, cars and things to do across 190+ countries. Powered by Expedia.',
  openGraph: {
    title: 'Vacation Rentals, Hotels & Things to Do Worldwide',
    description:
      'Whole homes, villas and hotels plus flights, cars and things to do across 190+ countries. Powered by Expedia.',
    type: 'website',
    siteName: 'gotript',
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <MultiCategoryHero />
      <PropertyTypeRail />
      <StatsBand />
      <AgenticHero />
      <RecentlyViewedRail />
      <PopularDestinationsGrid />
      <HowGotriptWorks />
      <SeoLinkFooter />
      <SiteFooter />
    </>
  );
}
