import type { Metadata } from 'next';
import { canonicalUrl } from '@lib/site/origin';
import { SiteHeader } from '@/features/site/site-header';
import { HomeStayHero } from '@/features/site/home-stay-hero';
import { StatsBand } from '@/features/site/stats-band';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import { HowGobooktWorks } from '@/features/site/how-it-works';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * Gobookt homepage — a single-purpose Booking.com stays-discovery hub.
 *
 * Deliberately NOT a multi-category OTA and NOT an AI-concierge planner: the
 * page does one job — help you find a place to stay — and hands off to
 * Booking.com. (The /flights, /cars, /things-to-do vertical pages still exist
 * for direct traffic, but they are not surfaced here.)
 *
 * Layout (top → bottom):
 *
 *   SiteHeader              : sticky nav (Stays / Destinations / About /
 *                             Contact) + Booking.com attribution strip.
 *   HomeStayHero            : accommodation-first stays search. Picks
 *                             destination + dates + party, hands off to
 *                             Booking.com via the tracked stays widget.
 *   StatsBand               : numbered trust strip (Booking.com scale +
 *                             our $0-added-fees model — no self-reported
 *                             ratings).
 *   PopularDestinationsGrid : destination tiles → /hotels-in-{slug}.
 *   HowGobooktWorks         : 3-step trust strip.
 *   SiteFooter              : newsletter + legal + affiliate disclosure.
 */
// Homepage-specific title/description. Keyword-first for search, brand-
// suffixed for recognition — overrides the generic layout default. The
// self-referencing canonical still comes from the layout (x-pathname).
export const metadata: Metadata = {
  title: 'Hotels, Vacation Rentals & Unique Stays Worldwide | gobookt',
  description:
    'Find hotels, apartments, villas, resorts and vacation rentals worldwide — search powered by Booking.com.',
  // Explicit self-canonical WITH trailing slash, matching the sitemap
  // (`${base}/`). Overrides the layout's x-pathname canonical (which was
  // emitting the bare, slash-less origin) so Google sees one consistent URL
  // for the home — removes the residual "duplicate canonical" ambiguity.
  alternates: { canonical: canonicalUrl('/') },
  openGraph: {
    url: canonicalUrl('/'),
    title: 'Find a better place to stay — gobookt',
    description:
      'Hotels, apartments, villas, resorts and vacation rentals worldwide. Powered by Booking.com.',
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
      <PopularDestinationsGrid />
      <HowGobooktWorks />
      <SiteFooter />
    </>
  );
}
