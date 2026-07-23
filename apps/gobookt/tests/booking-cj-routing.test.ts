import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBookingComCategoryUrl,
  resolveBookingHotelsSearch,
} from '@lib/affiliate/booking-com-multicategory';
import { activeStaySearchHref } from '@lib/affiliate/active-stay-provider';
import { resolveBookingUrl, describeBookingCjUrl } from '@lib/affiliate/booking-cj-links';
import { isAllowedAffiliateHost } from '@lib/affiliate/allowlist';
import { encodeAffiliateLink, decodeAffiliateLink } from '@lib/affiliate/link-encoder';

/**
 * Revenue guard: NO monetized gobookt CTA may emit a raw booking.com URL —
 * every one must resolve through the central CJ resolver to a CJ-tracked
 * domain, and that URL must survive the /r/[id] host allowlist (or the stay
 * CTAs would 404). Locks in the fix for the untracked `label=`-only leak.
 */

const CJ_DOMAINS = ['anrdoezrs.net', 'dpbolvw.net', 'tkqlhce.com', 'jdoqocy.com', 'kqzyfj.com'];

function hostOf(url: string): string {
  return new URL(url).hostname.toLowerCase();
}
function isCjUrl(url: string): boolean {
  const h = hostOf(url);
  return CJ_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}
function isRawBooking(url: string): boolean {
  const h = hostOf(url);
  return h === 'booking.com' || h.endsWith('.booking.com');
}

/** The five CJ vars the operator configures on the gobookt Vercel project. */
function stubCjEnv(): void {
  vi.stubEnv('BOOKING_AFFILIATE_ENABLED', 'true');
  vi.stubEnv('BOOKING_CJ_EVERGREEN_TEMPLATE', ''); // deterministic: no deep-link template
  vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', 'https://www.anrdoezrs.net/click-101803878-17288985');
  vi.stubEnv('BOOKING_ATTRACTIONS_AFFILIATE_URL', 'https://www.dpbolvw.net/click-101803878-17288984');
  vi.stubEnv('BOOKING_FLIGHTS_AFFILIATE_URL', 'https://www.tkqlhce.com/click-101803878-17288982');
  vi.stubEnv('BOOKING_CARS_AFFILIATE_URL', 'https://www.anrdoezrs.net/click-101803878-17314628');
  vi.stubEnv('NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER', 'booking-com');
}

afterEach(() => vi.unstubAllEnvs());

const SEARCH = {
  destination: 'Rome',
  checkIn: '2026-09-01',
  checkOut: '2026-09-04',
  adults: 2,
  children: 0,
};

describe('gobookt Booking.com CJ routing — no monetized CTA emits a raw booking.com URL', () => {
  const STAYS_DEEPLINK = 'https://www.anrdoezrs.net/click-101803878-17293132?url={TARGET}';

  it('every non-stays category CTA resolves to a CJ domain, not raw booking.com', () => {
    stubCjEnv();
    const categories = ['attractions', 'flights', 'cars'] as const;
    for (const category of categories) {
      const url = buildBookingComCategoryUrl(category, SEARCH);
      expect(isCjUrl(url), `${category} → ${url} must be a CJ-tracked domain`).toBe(true);
      expect(isRawBooking(url), `${category} → ${url} must NOT be raw booking.com`).toBe(false);
    }
  });

  it('hotels search resolves to a CJ deep-link, never the fixed homepage creative', () => {
    stubCjEnv();
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', STAYS_DEEPLINK);
    const r = resolveBookingHotelsSearch(SEARCH);
    expect(r.status).toBe('tracked');
    if (r.status !== 'tracked') return;
    expect(isCjUrl(r.url)).toBe(true);
    expect(r.url).toContain('17293132');
    expect(r.url).not.toContain('17288985');
  });

  it('the stay/property-card path resolves to a CJ deep-link (never the fixed creative)', () => {
    stubCjEnv();
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', STAYS_DEEPLINK);
    const url = activeStaySearchHref({
      destination: 'Rome',
      checkIn: '2026-09-01',
      checkOut: '2026-09-04',
      adults: 2,
    }) as string;
    expect(isCjUrl(url), url).toBe(true);
    expect(isRawBooking(url), url).toBe(false);
    expect(url).not.toContain('17288985');
  });

  it('a resolved CJ URL survives encode → decode (would 404 through /r/[id] if not allowlisted)', () => {
    stubCjEnv();
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', STAYS_DEEPLINK);
    const url = activeStaySearchHref({
      destination: 'Rome',
      checkIn: '2026-09-01',
      checkOut: '2026-09-04',
      adults: 2,
    }) as string;
    expect(isAllowedAffiliateHost(url), `${url} must pass the affiliate allowlist`).toBe(true);
    const id = encodeAffiliateLink({ url, providerId: 'booking-com', stayId: 'stay-x', intent: 'search' });
    const decoded = decodeAffiliateLink(id);
    expect(decoded, 'CJ payload must decode (not be rejected as off-allowlist)').not.toBeNull();
    expect(decoded?.url).toBe(url);
  });

  it('a missing surface creative uses the category-correct target — NEVER another vertical', () => {
    vi.stubEnv('BOOKING_AFFILIATE_ENABLED', 'true');
    vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', 'https://www.anrdoezrs.net/click-101803878-17288985');
    vi.stubEnv('BOOKING_FLIGHTS_AFFILIATE_URL', ''); // intentionally unconfigured
    const flightsTarget = 'https://www.booking.com/flights/index.html?label=gobookt';
    const url = resolveBookingUrl('flights', flightsTarget);
    // Must NOT borrow the stays creative (cross-vertical is what caused the bug).
    expect(url).not.toContain('17288985');
    // Right vertical: falls through to the category-correct booking.com target.
    expect(url).toBe(flightsTarget);
  });

  it('VERTICAL-SAFE: a stays search never selects a flights creative, and vice-versa', () => {
    stubCjEnv();
    const stays = resolveBookingUrl('stays', 'https://www.booking.com/searchresults.html?ss=Tokyo');
    expect(stays, 'stays → stays creative').toContain('17288985');
    expect(stays, 'stays must NOT use the flights creative').not.toContain('17288982');
    expect(stays.toLowerCase(), 'stays must not resolve to a flights link').not.toContain('flights');

    const flights = resolveBookingUrl('flights', 'https://www.booking.com/flights/index.html');
    expect(flights, 'flights → flights creative').toContain('17288982');
    expect(flights, 'flights must NOT use the stays creative').not.toContain('17288985');
  });

  it('a per-vertical deep-link template is scoped to its own surface only', () => {
    stubCjEnv();
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', 'https://www.anrdoezrs.net/click-101803878-99999999?url={TARGET}');
    // stays uses its deep-link template and carries the destination...
    const stays = resolveBookingUrl('stays', 'https://www.booking.com/searchresults.html?ss=Tokyo');
    expect(stays).toContain('99999999');
    expect(decodeURIComponent(stays), 'destination carried through the deep-link').toContain('ss=Tokyo');
    // ...but a stays template must NOT affect flights (still the flights creative).
    const flights = resolveBookingUrl('flights', 'https://www.booking.com/flights/index.html');
    expect(flights).toContain('17288982');
    expect(flights).not.toContain('99999999');
  });

  it('describeBookingCjUrl extracts the CJ domain + creative id for logging', () => {
    const d = describeBookingCjUrl('https://www.anrdoezrs.net/click-101803878-17288985');
    expect(d.tracked).toBe(true);
    expect(d.cjDomain).toBe('anrdoezrs.net');
    expect(d.creativeId).toBe('17288985');

    const raw = describeBookingCjUrl('https://www.booking.com/searchresults.html?ss=Rome');
    expect(raw.tracked).toBe(false);
    expect(raw.creativeId).toBeNull();
  });

  it('with the program disabled, the resolver fails safe to the plain target (dev/unconfigured only)', () => {
    vi.stubEnv('BOOKING_AFFILIATE_ENABLED', '');
    vi.stubEnv('BOOKING_CJ_EVERGREEN_TEMPLATE', '');
    vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', '');
    const target = 'https://www.booking.com/searchresults.html?ss=Rome';
    expect(resolveBookingUrl('stays', target)).toBe(target);
  });
});
