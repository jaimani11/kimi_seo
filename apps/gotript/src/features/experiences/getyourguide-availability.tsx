import { GYG_PARTNER_ID, buildGygActivityUrl } from '@lib/affiliate/getyourguide';
import { TrackedGygLink } from './tracked-gyg-link';

/**
 * GetYourGuide *availability* widget for a specific tour id.
 *
 * Differs from `<GygActivitiesWidget>` — that renders a browse-intent
 * carousel keyed by destination search; this one renders a booking-
 * intent availability calendar for a curated tour ID (e.g. "Tokyo
 * Disney 1-Day Pass" or "Paris Louvre skip-the-line"). Higher CTR
 * because the visitor arrived because of the tour, not the city.
 *
 * Use for placements where we know the tour we want to feature:
 *   - Editorial "Editor's pick" cards
 *   - Content pages targeting a specific tour (e.g. "Skip the Line
 *     Louvre Guide" → embed the Louvre tour availability widget)
 *   - Newsletter picks
 *
 * The empty `<div>` is the target GYG's global loader script
 * (mounted in RootLayout) hydrates into a live availability picker.
 * A fallback `<TrackedGygLink>` sits below so ad-blocked visitors
 * still have a bookable path + the click fires our analytics event.
 */
export interface GygAvailabilityWidgetProps {
  /** GetYourGuide numeric tour id (e.g. 1134591 for Tokyo Disney). */
  tourId: string | number;
  /** Short human title shown above the widget. */
  heading: string;
  /** Campaign slug for per-placement CTR attribution. */
  campaignSlug: string;
  /** Optional locale — defaults to en-US. */
  locale?: string;
  /** Optional currency — defaults to USD. */
  currency?: string;
  /** Optional widget variant — GYG supports 'horizontal' | 'vertical'. */
  variant?: 'horizontal' | 'vertical';
}

export function GygAvailabilityWidget({
  tourId,
  heading,
  campaignSlug,
  locale = 'en-US',
  currency = 'USD',
  variant = 'horizontal',
}: GygAvailabilityWidgetProps) {
  const fallbackHref = buildGygActivityUrl(tourId, {
    campaign: campaignSlug,
    source: 'availability-widget',
  });

  return (
    <section className="mx-auto max-w-4xl px-6 pt-8">
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
        Book this experience · GetYourGuide
      </p>
      <h3
        className="mt-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '1.2rem',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.015em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {heading}
      </h3>

      {/* GYG availability widget — script mounted in RootLayout finds
        * every .gyg-widget[data-gyg-partner-id] element and hydrates
        * the availability calendar / picker into it. */}
      <div
        className="gyg-widget mt-4"
        data-gyg-href="https://widget.getyourguide.com/default/availability.frame"
        data-gyg-tour-id={String(tourId)}
        data-gyg-locale-code={locale}
        data-gyg-currency={currency}
        data-gyg-widget="availability"
        data-gyg-variant={variant}
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-cmp={campaignSlug}
      >
        {/* Fallback content per GYG's spec — visible if script fails
          * to hydrate. Contains the required attribution + a real
          * deeplink so a bookable path exists in every scenario. */}
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          Powered by{' '}
          <a
            target="_blank"
            rel="sponsored noopener noreferrer"
            href="https://www.getyourguide.com/"
            style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
          >
            GetYourGuide
          </a>
        </span>
      </div>

      <TrackedGygLink
        href={fallbackHref}
        campaignSlug={campaignSlug}
        destination={heading}
        className="mt-3 inline-flex items-center gap-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
        }}
      >
        Check dates on GetYourGuide →
      </TrackedGygLink>
    </section>
  );
}
