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

// ───────────────────────────────────────────────────────────────────────────
// Search-vs-generic resolver separation (money-path safety).
//
// `resolveBookingUrl` above is VERTICAL-safe (a stays request can't select a
// flights creative) but it is NOT SEARCH-safe: for a stays *search* its
// preference #2 is the fixed homepage creative, which silently drops the
// destination/dates/guests. That is fine for a generic "Browse Booking.com"
// CTA but wrong for any destination/date/guest/neighborhood/property search.
//
// The two resolvers below make the intent explicit and impossible to confuse:
//   - resolveBookingGenericUrl → generic brand CTA; fixed creative is OK.
//   - resolveBookingSearchUrl  → search intent; NEVER the fixed homepage
//     creative, NEVER flights, NEVER another PID. Preserves the destination-
//     correct target via the CJ deep-link, else FAILS CLOSED (typed
//     `unavailable`) by default — never a misleading homepage redirect.
// ───────────────────────────────────────────────────────────────────────────

/** The fixed (homepage-level) stays creative id. A SEARCH click must never
 *  resolve here — it would drop the destination. Named for the executor guard
 *  + regression tests. The live per-vertical fixed creative is still read from
 *  BOOKING_STAYS_AFFILIATE_URL; this constant is the known default. */
export const FIXED_STAYS_HOMEPAGE_CREATIVE_ID = '17288985';

export type SearchHandoffMode = 'fail_closed' | 'untracked_fallback';

/** Search-handoff failure policy. Default `fail_closed`: when the tracked
 *  deep-link is unavailable a search returns `unavailable` (UI shows a retry
 *  state) rather than any redirect. `untracked_fallback` opts into a
 *  destination-correct BUT untracked redirect (explicit + logged). */
export function searchHandoffMode(): SearchHandoffMode {
  return env('SEARCH_HANDOFF_MODE') === 'untracked_fallback'
    ? 'untracked_fallback'
    : 'fail_closed';
}

export interface BookingSearchInput {
  /** Destination-correct booking.com/searchresults URL (already carries
   *  ss + normalized dates + guests), built by a stays target builder. */
  target: string;
  /** Free-text destination. Required, non-empty. */
  destination: string;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children?: number;
  rooms?: number;
}

export type BookingSearchResolution =
  | { status: 'tracked'; url: string; provider: 'booking'; vertical: 'stays' }
  | {
      status: 'untracked';
      url: string;
      provider: 'booking';
      vertical: 'stays';
      reason: 'deep_link_unavailable';
    }
  | {
      status: 'unavailable';
      provider: 'booking';
      vertical: 'stays';
      reason:
        | 'missing_destination'
        | 'deep_link_unavailable'
        | 'invalid_target'
        | 'invalid_configuration';
    };

/** True only for a booking.com stays *search-results* URL that carries a
 *  destination. Rejects the homepage, non-booking hosts, and flights. */
export function isValidStaysSearchTarget(target: string): boolean {
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  if (host === 'flights.booking.com') return false;
  const onBooking =
    host === 'booking.com' || host === 'www.booking.com' || host.endsWith('.booking.com');
  const isSearchResults = u.pathname.toLowerCase().includes('/searchresults');
  const hasDestination = (u.searchParams.get('ss') ?? '').trim().length > 0;
  return onBooking && isSearchResults && hasDestination;
}

/**
 * Resolve a Booking.com STAYS SEARCH hand-off — money-path safe by
 * construction. It can only ever return: the destination-preserving CJ
 * deep-link (`tracked`), a destination-correct untracked target (`untracked`,
 * and only when SEARCH_HANDOFF_MODE=untracked_fallback), or a typed
 * `unavailable`. It NEVER returns the fixed homepage creative, a flights
 * creative, another PID, or an empty string.
 */
export function resolveBookingSearchUrl(input: BookingSearchInput): BookingSearchResolution {
  const V = { provider: 'booking' as const, vertical: 'stays' as const };
  if (!input.destination || input.destination.trim().length === 0) {
    return { status: 'unavailable', ...V, reason: 'missing_destination' };
  }
  if (!isValidStaysSearchTarget(input.target)) {
    return { status: 'unavailable', ...V, reason: 'invalid_target' };
  }
  const deeplink = env('BOOKING_STAYS_CJ_DEEPLINK');
  if (deeplink) {
    if (!deeplink.includes('{TARGET}')) {
      // Configured but malformed — fail closed. Do NOT fall to a fixed creative.
      return { status: 'unavailable', ...V, reason: 'invalid_configuration' };
    }
    // Encode the target exactly once for the CJ `?url=` layer.
    const url = deeplink.replace('{TARGET}', encodeURIComponent(input.target));
    return { status: 'tracked', url, ...V };
  }
  // Deep-link unavailable. NEVER the fixed homepage creative.
  if (searchHandoffMode() === 'untracked_fallback') {
    return { status: 'untracked', url: input.target, ...V, reason: 'deep_link_unavailable' };
  }
  return { status: 'unavailable', ...V, reason: 'deep_link_unavailable' };
}

/** Generic Booking.com landing per vertical (untracked) when no fixed creative
 *  is configured. Only used by the GENERIC resolver. */
const GENERIC_BOOKING_LANDING: Record<BookingCjSurface, string> = {
  stays: 'https://www.booking.com/',
  attractions: 'https://www.booking.com/attractions/index.html',
  flights: 'https://flights.booking.com/',
  cars: 'https://www.booking.com/cars/index.html',
};

/** Resolve a GENERIC (no search intent) Booking.com CTA — "Browse
 *  Booking.com". The fixed homepage CJ creative is acceptable here because no
 *  destination intent needs to survive. */
export function resolveBookingGenericUrl(input: { vertical: BookingCjSurface }): string {
  const fixed = bookingCjFixedLink(input.vertical);
  if (fixed) return fixed;
  return GENERIC_BOOKING_LANDING[input.vertical];
}

/** Defense-in-depth for executors: true when `url` is the fixed stays homepage
 *  creative (either the known default id or whatever BOOKING_STAYS_AFFILIATE_URL
 *  points at). A SEARCH-marked click must never forward this. */
export function isFixedStaysHomepageCreative(url: string): boolean {
  const d = describeBookingCjUrl(url);
  if (!d.tracked || !d.creativeId) return false;
  if (d.creativeId === FIXED_STAYS_HOMEPAGE_CREATIVE_ID) return true;
  const fixed = bookingCjFixedLink('stays');
  if (fixed) {
    const fd = describeBookingCjUrl(fixed);
    if (fd.creativeId && fd.creativeId === d.creativeId) return true;
  }
  return false;
}

// ── Search-input normalization (shared by the target builders + /api/go) ────

/** Clamp guest/room counts to valid Booking.com ranges. Guarantees adults ≥ 1
 *  (so a search NEVER emits group_adults=0), children ≥ 0, rooms ≥ 1. */
export function normalizeStayParty(input: {
  adults?: number;
  children?: number;
  rooms?: number;
}): { adults: number; children: number; rooms: number } {
  const asInt = (v: unknown) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : NaN;
  };
  const a = asInt(input.adults);
  const c = asInt(input.children);
  const r = asInt(input.rooms);
  return {
    adults: !Number.isFinite(a) || a < 1 ? 2 : Math.min(a, 30),
    children: !Number.isFinite(c) || c < 0 ? 0 : Math.min(c, 10),
    rooms: !Number.isFinite(r) || r < 1 ? 1 : Math.min(r, 30),
  };
}

export type StayDatesCheck =
  | { ok: true; checkIn?: string; checkOut?: string }
  | { ok: false; reason: 'malformed' | 'reversed' | 'same_day' };

/** Deterministic date policy. No dates = valid (Booking.com shows a picker).
 *  Both dates must be ISO `YYYY-MM-DD`, real, and checkout strictly after
 *  check-in; otherwise the dates are rejected so we never build an invalid
 *  Booking.com search. */
export function validateStayDates(checkIn?: string, checkOut?: string): StayDatesCheck {
  const has = (s?: string) => typeof s === 'string' && s.trim().length > 0;
  if (!has(checkIn) && !has(checkOut)) return { ok: true };
  if (!has(checkIn) || !has(checkOut)) return { ok: false, reason: 'malformed' };
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(checkIn!) || !iso.test(checkOut!)) return { ok: false, reason: 'malformed' };
  const ci = Date.parse(`${checkIn!}T00:00:00Z`);
  const co = Date.parse(`${checkOut!}T00:00:00Z`);
  if (Number.isNaN(ci) || Number.isNaN(co)) return { ok: false, reason: 'malformed' };
  if (co === ci) return { ok: false, reason: 'same_day' };
  if (co < ci) return { ok: false, reason: 'reversed' };
  return { ok: true, checkIn, checkOut };
}
