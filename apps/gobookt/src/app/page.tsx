import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { HomeStayHero } from '@/features/site/home-stay-hero';
import { StatsBand } from '@/features/site/stats-band';
import { AgenticHero } from '@/features/site/agentic-hero';
import { RecentlyViewedRail } from '@/features/site/recently-viewed-rail';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import { HowGobooktWorks } from '@/features/site/how-it-works';
import { SeoLinkFooter } from '@/features/site/seo-link-footer';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * Gobookt homepage — multi-category Booking.com affiliate hub.
 *
 * Layout (top → bottom):
 *
 *   SiteHeader              : sticky nav with 5 category links
 *                             (Stays / Flights / Things to do / Cars
 *                             / Cruises) + Destinations + Concierge.
 *   HomeStayHero            : accommodation-first stays search. Picks
 *                             destination + dates + party, hands off to
 *                             Booking.com via /api/go/booking. Flights /
 *                             cars / things-to-do are quiet secondary
 *                             links, not equal tabs. (The 5-tab
 *                             MultiCategoryHero is retained for the
 *                             /flights, /cars, /cruises landing pages.)
 *   StatsBand               : numbered trust strip.
 *   AgenticHero             : AI concierge — frames "plan my whole
 *                             trip" rather than just experiences.
 *   RecentlyViewedRail      : recently-viewed pickup, only renders
 *                             after the visitor has activity.
 *   PopularDestinationsGrid : 12 destination tiles.
 *   HowGobooktWorks         : 3-step trust strip.
 *   SeoLinkFooter           : indexable link footer.
 *   SiteFooter              : minimal legal footer.
 */
// Homepage-specific title/description. Keyword-first for search, brand-
// suffixed for recognition — overrides the generic layout default. The
// self-referencing canonical still comes from the layout (x-pathname).
export const metadata: Metadata = {
  title: 'Hotels, Vacation Rentals & Unique Stays Worldwide | gobookt',
  description:
    'Find hotels, apartments, villas, resorts and vacation rentals across 190+ countries — powered by Booking.com. Free cancellation on most stays.',
  openGraph: {
    title: 'Find a better place to stay — gobookt',
    description:
      'Hotels, apartments, villas, resorts and vacation rentals across 190+ countries. Powered by Booking.com.',
    type: 'website',
    siteName: 'gobookt',
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <HomeStayHero />
      <StatsBand />
      <AgenticHero />
      <RecentlyViewedRail />
      <PopularDestinationsGrid />
      <HowGobooktWorks />
      <SeoLinkFooter />
      <SiteFooter />
    </>
  );
}
