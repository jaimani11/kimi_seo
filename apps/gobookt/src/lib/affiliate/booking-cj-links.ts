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
 * City-specific deep-linking is opt-in PER VERTICAL via a
 * `BOOKING_<SURFACE>_CJ_DEEPLINK` template that contains the literal `{TARGET}`
 * (a CJ "Deep Link" creative that honours `?url=`). Deliberately per-vertical:
 * a single GLOBAL template applied to every category is exactly how a "Search
 * stays" click once landed on a Booking.com flights creative. Without a
 * per-vertical template we fall back to that surface's own fixed creative.
 *
 * gobookt-only. Env (set in Vercel, gobookt project). Each CJ creative below is
 * VERTICAL-SPECIFIC — never point the stays var at a flights creative:
 *   BOOKING_AFFILIATE_ENABLED         'true' to surface Booking.com CTAs
 *   BOOKING_CJ_PUBLISHER_ID           101803878 (attribution id; analytics/label only)
 *   BOOKING_STAYS_AFFILIATE_URL       accommodation creative (e.g. …/click-101803878-17288985)
 *   BOOKING_ATTRACTIONS_AFFILIATE_URL attractions creative
 *   BOOKING_FLIGHTS_AFFILIATE_URL     flights creative (e.g. …-17288982)
 *   BOOKING_CARS_AFFILIATE_URL        car-rental creative
 *   BOOKING_<SURFACE>_CJ_DEEPLINK     optional per-vertical deep-link template with
 *                                     a literal {TARGET}, e.g.
 *                                     BOOKING_STAYS_CJ_DEEPLINK=https://www.anrdoezrs.net/click-101803878-<STAYS-DEEPLINK-CREATIVE>?url={TARGET}
 *                                     (requires a Deep Link creative that honours ?url=).
 *   BOOKING_CJ_EVERGREEN_TEMPLATE     DEPRECATED + IGNORED — was global (all verticals);
 *                                     it caused stays→flights. Delete it. Use the
 *                                     per-vertical BOOKING_<SURFACE>_CJ_DEEPLINK instead.
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

/** Per-vertical deep-link template env var name for a surface. */
function deeplinkTemplateVar(surface: BookingCjSurface): string {
  return `BOOKING_${surface.toUpperCase()}_CJ_DEEPLINK`;
}

/**
 * Resolve the outbound URL for a Booking.com click — VERTICAL-SAFE. A stays
 * request can only ever resolve to a stays creative, a flights request to a
 * flights creative, etc. There is deliberately NO global template and NO
 * cross-vertical fallback: a single global evergreen template applied to every
 * category is exactly how a "Search stays" click once landed on a Booking.com
 * flights creative.
 *
 * Preference order (all scoped to `surface`):
 *   1. `BOOKING_<SURFACE>_CJ_DEEPLINK` — a per-vertical CJ Deep Link template
 *      with a literal {TARGET}; deep-links the exact page AND stays CJ-tracked.
 *   2. `BOOKING_<SURFACE>_AFFILIATE_URL` — the fixed CJ creative for this
 *      vertical; CJ-tracked but homepage-level (won't carry destination/dates).
 *   3. The category-correct `target` booking.com URL — right vertical, but
 *      untracked. Fail-safe for a missing creative; never borrows another
 *      vertical's link.
 *
 * @param surface which vertical to attribute against (null = no CJ creative
 *                maps to this vertical yet, e.g. taxis)
 * @param target  the category-correct booking.com page we'd ideally land on
 */
export function resolveBookingUrl(surface: BookingCjSurface | null, target: string): string {
  if (surface) {
    // 1. Per-vertical deep-link template (opt-in). Scoped to this surface, so a
    //    flights creative can never be selected for a stays search.
    const deeplink = env(deeplinkTemplateVar(surface));
    if (deeplink && deeplink.includes('{TARGET}')) {
      return deeplink.replace('{TARGET}', encodeURIComponent(target));
    }
    // 2. Fixed CJ creative for THIS vertical.
    const fixed = bookingCjFixedLink(surface);
    if (fixed) return fixed;
    // 3. Nothing configured for this vertical — land on the category-correct
    //    booking.com target (right vertical, untracked). NEVER borrow another
    //    vertical's creative.
    console.warn('[booking-cj] no CJ creative configured for surface — using untracked category target', {
      surface,
    });
    return target;
  }
  // No vertical mapping (generic click). A stays creative is the safe default
  // when the program is enabled; otherwise the plain target.
  if (bookingAffiliateEnabled()) {
    const stays = bookingCjFixedLink('stays');
    if (stays) return stays;
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
