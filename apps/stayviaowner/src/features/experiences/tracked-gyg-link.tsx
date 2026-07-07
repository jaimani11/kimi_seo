'use client';

import { track } from '@lib/analytics/client';

/**
 * Client-side wrapper for the GYG fallback deeplink. Fires a
 * `gyg_cta_click` analytics event with the campaign slug + destination
 * before letting the browser navigate.
 *
 * The event flows through the standard analytics client so it lands in:
 *   - Plausible (via `window.plausible`) if configured
 *   - Google Analytics 4 (via `window.gtag`) if configured
 *   - the internal funnel store when the event name is on the allowlist
 *     — we deliberately keep `gyg_cta_click` off the funnel store's
 *     allowlist because per-click rows on 6,000 pages × millions of
 *     views would balloon the store; Plausible/GA4 aggregate on their
 *     side which is what we need for the admin CTR view.
 */
export function TrackedGygLink({
  href,
  campaignSlug,
  destination,
  children,
  className,
  style,
}: {
  href: string;
  campaignSlug: string;
  destination: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      style={style}
      onClick={() => {
        track('gyg_cta_click', {
          campaign: campaignSlug,
          destination,
          surface: 'fallback-link',
        });
      }}
    >
      {children}
    </a>
  );
}
