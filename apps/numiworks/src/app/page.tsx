import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { SearchFormHero } from '@/features/site/search-form-hero';
import { StatsBand } from '@/features/site/stats-band';
import { VrboHomepageStrip } from '@/features/site/vrbo-homepage-strip';
import { AgenticHero } from '@/features/site/agentic-hero';
import { RecentlyViewedRail } from '@/features/site/recently-viewed-rail';
import { BrowseByType } from '@/features/site/browse-by-type';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import { LiveExperienceRails } from '@/features/site/live-experience-rails';
import { HowNumiworksWorks } from '@/features/site/how-it-works';
import { SeoLinkFooter } from '@/features/site/seo-link-footer';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * Homepage — bright affiliate-marketplace shape (rentbyowner.com /
 * varoom.com / hotala.com / bedroomvillas.com family), with the
 * agentic concierge positioned as a featured section in the middle.
 *
 * Layout (top → bottom):
 *
 *   SiteHeader              : sticky nav
 *   SearchFormHero          : photo hero + structured search form
 *                             (destination · check-in · check-out ·
 *                             travelers · Search). Reference-site
 *                             load-bearing surface.
 *   StatsBand               : non-numeric assurance strip (experiences-
 *                             first · plan-then-book · provider handles
 *                             booking · independent affiliate)
 *   AgenticHero             : "AI concierge feature" section — dark
 *                             cinematic photo, streaming agent steps,
 *                             reasoning capsules. Sits as the page's
 *                             tonal anchor in the middle of the
 *                             otherwise-white marketplace.
 *   RecentlyViewedRail      : "Pick up where you left off" rail —
 *                             empty on first visit, populates from
 *                             the funnel event log once the user has
 *                             viewed ≥2 unique experiences this
 *                             session. (Sprint 18)
 *   BrowseByType            : 12-tile photo category grid
 *   PopularDestinationsGrid : 12-city photo grid with prices
 *   LiveExperienceRails     : four live Viator rails
 *   HowNumiworksWorks       : 3-step trust strip
 *   SeoLinkFooter           : wide indexable link footer
 *   SiteFooter              : minimal legal/disclosure footer
 */
// Homepage-specific title/description. Keyword-first for search, brand-
// suffixed for recognition — overrides the generic layout default. The
// self-referencing canonical still comes from the layout (x-pathname).
export const metadata: Metadata = {
  title: 'Vacation Homes, Villas & Whole-Home Rentals + AI Trip Planning | numiworks',
  description:
    'Discover villas, cabins, cottages and beach homes on Vrbo, then use AI to plan the rest of your trip — tours, activities and things to do worldwide.',
  openGraph: {
    title: 'Discover whole homes worth traveling for — numiworks',
    description:
      'Villas, cabins, cottages and beach-home vacation rentals on Vrbo, plus AI trip planning and things to do worldwide.',
    type: 'website',
    siteName: 'numiworks',
  },
};

export default function HomePage() {
  return (
    <>
      {/* numiworks = the EXPERIENCES brand, so the homepage leads with visual
          experience DISCOVERY (the photo-tile "browse by type" grid — the
          load-bearing element on the top-performing experiences sites), not the
          planner/search-first flow gotript uses. StatsBand drops well down so the
          two brands don't share the same "hero → strip → stats" rhythm. Live
          Viator rails stay mid-page (client-fetched, so never the lead). */}
      <SiteHeader />
      <SearchFormHero />
      <BrowseByType />
      <VrboHomepageStrip />
      <AgenticHero />
      <PopularDestinationsGrid />
      <LiveExperienceRails />
      <RecentlyViewedRail />
      <StatsBand />
      <HowNumiworksWorks />
      <SeoLinkFooter />
      <SiteFooter />
    </>
  );
}
