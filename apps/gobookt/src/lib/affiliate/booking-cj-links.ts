/**
 * Booking.com CJ (Commission Junction) affiliate links — the single
 * source of truth for gobookt's Booking.com outbound URLs.
 *
 * gobookt is approved for Booking.com via CJ (publisher 7991430). CJ
 * tracks through its OWN click-redirect domains (dpbolvw.net,
 * anrdoezrs.net, tkqlhce.com, jdoqocy.com, kqzyfj.com …), NOT via an
 * `aid` param on booking.com URLs. Those creative links are FIXED and
 * homepage-level: you must NOT append destination / date / property
 * params to them — CJ ignores or breaks on extra params.
 *
 * City-specific deep-linking requires a separate CJ "evergreen" link of
 * the form `…/click-PID<id>?url={TARGET}`. When BOOKING_CJ_EVERGREEN_TEMPLATE
 * is set (and contains the literal `{TARGET}`), we deep-link to the
 * specific booking.com page; otherwise we fall back to the fixed
 * homepage creative links below.
 *
 * gobookt-only. Env (set in Vercel, gobookt project):
 *   BOOKING_AFFILIATE_ENABLED         'true' to surface Booking.com CTAs
 *   BOOKING_CJ_PUBLISHER_ID           101803878 (attribution id; analytics/label only)
 *   BOOKING_STAYS_AFFILIATE_URL       accommodation CTA (temp: Getaway Deal creative)
 *   BOOKING_ATTRACTIONS_AFFILIATE_URL attractions CTA
 *   BOOKING_FLIGHTS_AFFILIATE_URL     flights CTA
 *   BOOKING_CARS_AFFILIATE_URL        car-rental CTA (→ booking.com/cars/index.html)
 *   BOOKING_CJ_EVERGREEN_TEMPLATE     optional; e.g.
 *                                     https://www.tkqlhce.com/click-PID123?url={TARGET}
 */

export type BookingCjSurface = 'stays' | 'attractions' | 'flights' | 'cars';

function env(name: string): string | null {
  const v = (process.env[name] ?? '').trim();
  return v.length > 0 ? v : null;
}

/** Whether Booking.com CTAs should be surfaced (master switch). */
export function bookingAffiliateEnabled(): boolean {
  return env('BOOKING_AFFILIATE_ENABLED') === 'true';
}

/** CJ publisher / website id — for analytics + labels only, never mutate links with it. */
export function bookingCjPublisherId(): string | null {
  return env('BOOKING_CJ_PUBLISHER_ID');
}

/** The fixed CJ creative link for a surface, or null when not configured. */
export function bookingCjFixedLink(surface: BookingCjSurface): string | null {
  switch (surface) {
    case 'stays':
      return env('BOOKING_STAYS_AFFILIATE_URL');
    case 'attractions':
      return env('BOOKING_ATTRACTIONS_AFFILIATE_URL');
    case 'flights':
      return env('BOOKING_FLIGHTS_AFFILIATE_URL');
    case 'cars':
      return env('BOOKING_CARS_AFFILIATE_URL');
  }
}

/**
 * Resolve the outbound URL for a Booking.com click, in preference order:
 *
 *   1. Evergreen deep-link to `target` — city-specific AND CJ-tracked (best;
 *      only when BOOKING_CJ_EVERGREEN_TEMPLATE is set).
 *   2. Fixed CJ creative link for the surface — homepage-level but CJ-tracked.
 *   3. The plain `target` booking.com URL — correct page, but NOT tracked.
 *      Pure fail-safe so a missing env var never yields a broken CTA.
 *
 * @param surface which CJ creative to attribute against (null = no CJ
 *                creative exists for this vertical yet, e.g. cars/taxis)
 * @param target  the specific booking.com page we'd ideally land on
 */
export function resolveBookingUrl(surface: BookingCjSurface | null, target: string): string {
  const template = env('BOOKING_CJ_EVERGREEN_TEMPLATE');
  if (template && template.includes('{TARGET}')) {
    return template.replace('{TARGET}', encodeURIComponent(target));
  }
  if (surface) {
    const fixed = bookingCjFixedLink(surface);
    if (fixed) return fixed;
  }
  // No CJ creative for this surface. When the affiliate program is ENABLED we
  // must never emit a raw, untracked booking.com URL — fall back to the stays
  // creative (a CJ-tracked homepage link) so the click still attributes. Only
  // an unconfigured/disabled deployment returns the plain target, as a pure
  // fail-safe so a missing env var never yields a broken CTA in dev.
  if (bookingAffiliateEnabled()) {
    const staysFallback = bookingCjFixedLink('stays');
    if (staysFallback) {
      if (surface !== 'stays') {
        console.warn('[booking-cj] no CJ creative for surface; using stays creative', {
          surface,
        });
      }
      return staysFallback;
    }
  }
  return target;
}

/** CJ click-redirect domains — the tracked outbound hosts (see allowlist). */
const CJ_REDIRECT_DOMAINS = [
  'anrdoezrs.net',
  'dpbolvw.net',
  'tkqlhce.com',
  'jdoqocy.com',
  'kqzyfj.com',
] as const;

/**
 * Classify a resolved outbound Booking.com URL for structured logging:
 * whether it's a CJ-tracked link, which CJ domain, and the creative/link id
 * parsed from the CJ click path (`…/click-<PID>-<CREATIVE>`). Never throws.
 */
export function describeBookingCjUrl(url: string): {
  tracked: boolean;
  cjDomain: string | null;
  creativeId: string | null;
} {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const cjDomain =
      CJ_REDIRECT_DOMAINS.find((d) => host === d || host.endsWith(`.${d}`)) ?? null;
    const m = u.pathname.match(/click-\d+-(\d+)/);
    return {
      tracked: cjDomain !== null,
      cjDomain,
      creativeId: m ? (m[1] ?? null) : null,
    };
  } catch {
    return { tracked: false, cjDomain: null, creativeId: null };
  }
}
