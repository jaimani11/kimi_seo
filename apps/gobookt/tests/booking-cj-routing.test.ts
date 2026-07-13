import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBookingComCategoryUrl,
  type BookingComCategory,
} from '@lib/affiliate/booking-com-multicategory';
import { buildActiveStaySearchUrl } from '@lib/affiliate/active-stay-provider';
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
  it('every category CTA (/api/go/booking) resolves to a CJ domain, not raw booking.com', () => {
    stubCjEnv();
    const categories: BookingComCategory[] = ['hotels', 'attractions', 'flights', 'cars'];
    for (const category of categories) {
      const url = buildBookingComCategoryUrl(category, SEARCH);
      expect(isCjUrl(url), `${category} → ${url} must be a CJ-tracked domain`).toBe(true);
      expect(isRawBooking(url), `${category} → ${url} must NOT be raw booking.com`).toBe(false);
    }
  });

  it('the stay/property-card path (active-stay-provider) resolves to a CJ domain', () => {
    stubCjEnv();
    const url = buildActiveStaySearchUrl({
      destination: 'Rome',
      checkIn: '2026-09-01',
      checkOut: '2026-09-04',
      adults: 2,
    });
    expect(isCjUrl(url), url).toBe(true);
    expect(isRawBooking(url), url).toBe(false);
  });

  it('a resolved CJ URL survives encode → decode (would 404 through /r/[id] if not allowlisted)', () => {
    stubCjEnv();
    const url = buildActiveStaySearchUrl({
      destination: 'Rome',
      checkIn: '2026-09-01',
      checkOut: '2026-09-04',
      adults: 2,
    });
    expect(isAllowedAffiliateHost(url), `${url} must pass the affiliate allowlist`).toBe(true);
    const id = encodeAffiliateLink({ url, providerId: 'booking-com', stayId: 'stay-x' });
    const decoded = decodeAffiliateLink(id);
    expect(decoded, 'CJ payload must decode (not be rejected as off-allowlist)').not.toBeNull();
    expect(decoded?.url).toBe(url);
  });

  it('a missing surface creative falls back to the stays CJ creative (never raw) while enabled', () => {
    vi.stubEnv('BOOKING_AFFILIATE_ENABLED', 'true');
    vi.stubEnv('BOOKING_CJ_EVERGREEN_TEMPLATE', '');
    vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', 'https://www.anrdoezrs.net/click-101803878-17288985');
    vi.stubEnv('BOOKING_FLIGHTS_AFFILIATE_URL', ''); // intentionally unconfigured
    const url = resolveBookingUrl('flights', 'https://www.booking.com/flights/index.html?label=gobookt');
    expect(isRawBooking(url), `${url} must not be a raw booking.com fallback`).toBe(false);
    expect(isCjUrl(url), `${url} must be the stays CJ creative`).toBe(true);
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
