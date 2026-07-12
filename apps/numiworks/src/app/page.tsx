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
 *   StatsBand               : numbered trust strip
 *                             (300K+ · 190+ · 4.6★ · 24/7)
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
  title: 'AI Travel Planner — Tours, Hotels & Vacation Rentals | numiworks',
  description:
    'Plan your trip with AI, then book tours, hotels and vacation rentals in one place. 300,000+ experiences across 190+ countries — live prices, real availability.',
  openGraph: {
    title: 'AI Travel Planner for Tours, Hotels & Vacation Rentals',
    description:
      'Describe your trip in a sentence. numiworks plans it with AI and books tours, hotels and vacation rentals — 300,000+ experiences across 190+ countries.',
    type: 'website',
    siteName: 'numiworks',
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <SearchFormHero />
      <VrboHomepageStrip />
      <StatsBand />
      <AgenticHero />
      <RecentlyViewedRail />
      <BrowseByType />
      <PopularDestinationsGrid />
      <LiveExperienceRails />
      <HowNumiworksWorks />
      <SeoLinkFooter />
      <SiteFooter />
    </>
  );
}
