import { GYG_PARTNER_ID, buildGygSearchUrl } from '@lib/affiliate/getyourguide';
import { TrackedGygLink } from './tracked-gyg-link';

/**
 * GetYourGuide activities widget — server component that emits the
 * partner-tagged `<div>` GYG's client-side script hydrates. The script
 * itself is loaded once, globally, in `src/app/layout.tsx`; here we
 * only render the placeholder DOM that the script picks up.
 *
 * Two rendering modes on the same component:
 *
 *   1. Successful widget hydration — GYG's script replaces the empty
 *      `<div class="gyg-widget">` with a live carousel of activities.
 *   2. Ad-blocked / no-JS fallback — we ALSO render a plain text
 *      deeplink beside the widget so visitors still have a bookable
 *      path even if the widget never hydrates. Same partner id;
 *      commissions identically.
 *
 * We deliberately give each widget a stable, page-scoped campaign
 * label so the GYG partner dashboard rolls up conversions per section
 * (e.g. "tokyo-best-things-to-do" vs "tokyo-day-trips") — that's the
 * per-page attribution we need to know which sections earn.
 */

export type GygWidgetKind =
  /** Carousel of best-selling activities for a location. */
  | 'city'
  /** Sub-topic themed carousel (food tours, family, day trips…). */
  | 'topic';

export interface GygActivitiesWidgetProps {
  /** Free-text location (matches GYG's search resolver). */
  destination: string;
  /** Section label — becomes the visible H3 above the widget and the
   *  campaign tag on the fallback deeplink. */
  heading: string;
  /** Optional short blurb under the heading. */
  blurb?: string;
  /** Widget flavor. Currently both flavors render the same JSX; when
   *  GYG's script picks up more data-* attributes we'll differentiate. */
  kind?: GygWidgetKind;
  /** Campaign slug — appended as `cmp=` on the fallback deeplink and
   *  passed to GYG via a data-cmp attribute. Kebab-case. */
  campaignSlug: string;
  /** Optional GYG-specific tour category id used by their widget's
   *  `data-gyg-tour-ids` attribute. Left undefined by default so the
   *  widget shows the destination's best-sellers. */
  tourIds?: string;
  /** Optional number of columns for the widget's grid rendering; GYG
   *  reads it as `data-gyg-number-of-items`. */
  numberOfItems?: number;
  /** How the widget is styled by GYG. Defaults to 'horizontal' which
   *  renders as a scrollable card carousel. */
  variant?: 'horizontal' | 'vertical' | 'compact';
}

export function GygActivitiesWidget({
  destination,
  heading,
  blurb,
  campaignSlug,
  tourIds,
  numberOfItems = 6,
  variant = 'horizontal',
}: GygActivitiesWidgetProps) {
  const fallbackHref = buildGygSearchUrl({
    destination,
    campaign: campaignSlug,
    source: 'destination-guide',
    currency: 'USD',
  });

  return (
    <section className="mx-auto max-w-4xl px-6 pt-10">
      <header>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 800,
            margin: 0,
          }}
        >
          Powered by GetYourGuide
        </p>
        <h3
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(1.35rem, 2.2vw, 1.7rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {heading}
        </h3>
        {blurb ? (
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {blurb}
          </p>
        ) : null}
      </header>

      {/* The div below is GetYourGuide's target — their global script
        * (`pa.umd.production.min.js` loaded in RootLayout) finds every
        * `.gyg-widget[data-gyg-partner-id]` element on the page and
        * mounts the widget into it. Keep the class name + partner id
        * attribute stable or the widget will not hydrate. */}
      <div
        className="gyg-widget mt-5"
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-locale-code="en-US"
        data-gyg-currency="USD"
        data-gyg-widget="activities"
        data-gyg-q={destination}
        data-gyg-variant={variant}
        data-gyg-number-of-items={numberOfItems}
        data-gyg-cmp={campaignSlug}
        {...(tourIds ? { 'data-gyg-tour-ids': tourIds } : {})}
        style={{ minHeight: '2rem' }}
      />

      {/* Fallback deeplink — always present. Rendered as a soft
        * "See more on GetYourGuide" strip below the widget so it's
        * useful whether or not the widget hydrates. Ad-blockers that
        * kill the script leave visitors with a real bookable path.
        * Click fires `gyg_cta_click` for our own analytics; GYG's
        * partner dashboard tracks completed bookings on their side. */}
      <TrackedGygLink
        href={fallbackHref}
        campaignSlug={campaignSlug}
        destination={destination}
        className="mt-4 inline-flex items-center gap-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
        }}
      >
        See all {heading.toLowerCase()} on GetYourGuide →
      </TrackedGygLink>
    </section>
  );
}
