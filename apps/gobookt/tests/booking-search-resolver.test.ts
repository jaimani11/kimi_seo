import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveBookingSearchUrl,
  resolveBookingGenericUrl,
  isValidStaysSearchTarget,
  isFixedStaysHomepageCreative,
  normalizeStayParty,
  validateStayDates,
  FIXED_STAYS_HOMEPAGE_CREATIVE_ID,
} from '@lib/affiliate/booking-cj-links';
import {
  resolveBookingHotelsSearch,
  bookingHotelsSearchHref,
} from '@lib/affiliate/booking-com-multicategory';

/**
 * Money-path safety matrix for the Booking.com STAYS search resolver.
 *
 * The load-bearing guarantees under test:
 *   - a SEARCH never resolves to the fixed homepage creative (17288985)
 *   - a SEARCH never resolves to a flights creative / another PID
 *   - destination + dates + guests survive; target encoded exactly once/layer
 *   - default fail_closed; untracked_fallback only when explicitly enabled
 *   - generic CTAs MAY use the fixed creative
 */

const DEEPLINK = 'https://www.anrdoezrs.net/click-101803878-17293132?url={TARGET}';
const FIXED_STAYS = 'https://www.anrdoezrs.net/click-101803878-17288985';
const FLIGHTS_CREATIVE = '17288982';
const GOBOOKT_PID = '101803878';

afterEach(() => vi.unstubAllEnvs());

function stubDeeplink(): void {
  vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', DEEPLINK);
}
function stubFixedOnly(): void {
  vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
  vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', FIXED_STAYS);
  vi.stubEnv('BOOKING_AFFILIATE_ENABLED', 'true');
}
function stubUntrackedFallback(): void {
  vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', '');
  vi.stubEnv('SEARCH_HANDOFF_MODE', 'untracked_fallback');
}

/** The booking.com target the CJ deep-link wraps, decoded exactly once. */
function innerTarget(trackedUrl: string): URL {
  const inner = new URL(trackedUrl).searchParams.get('url');
  expect(inner, 'tracked url must carry a ?url= target').toBeTruthy();
  return new URL(inner as string);
}

const DESTINATIONS = ['Paris', 'New York', 'São Paulo', 'Québec City', 'Tokyo', 'Reykjavík', '東京'];

describe('resolveBookingSearchUrl — core policy', () => {
  const target = 'https://www.booking.com/searchresults.html?ss=Paris&checkin=2026-09-01&checkout=2026-09-05&group_adults=2';

  it('missing destination → unavailable(missing_destination), no url', () => {
    stubDeeplink();
    const r = resolveBookingSearchUrl({ target, destination: '   ', adults: 2 });
    expect(r.status).toBe('unavailable');
    expect(r).toMatchObject({ reason: 'missing_destination' });
    expect('url' in r).toBe(false);
  });

  it('invalid target (homepage) → unavailable(invalid_target)', () => {
    stubDeeplink();
    const r = resolveBookingSearchUrl({ target: 'https://www.booking.com/', destination: 'Paris', adults: 2 });
    expect(r.status).toBe('unavailable');
    expect(r).toMatchObject({ reason: 'invalid_target' });
  });

  it('invalid target (flights host) → unavailable(invalid_target)', () => {
    stubDeeplink();
    const r = resolveBookingSearchUrl({
      target: 'https://flights.booking.com/searchresults.html?ss=Paris',
      destination: 'Paris',
      adults: 2,
    });
    expect(r.status).toBe('unavailable');
  });

  it('deep-link configured → tracked, wraps the destination-correct target', () => {
    stubDeeplink();
    const r = resolveBookingSearchUrl({ target, destination: 'Paris', adults: 2 });
    expect(r.status).toBe('tracked');
    if (r.status !== 'tracked') return;
    expect(r.url).toContain(`click-${GOBOOKT_PID}-17293132`);
    expect(innerTarget(r.url).searchParams.get('ss')).toBe('Paris');
  });

  it('malformed deep-link template (no {TARGET}) → unavailable(invalid_configuration) — never a fixed creative', () => {
    vi.stubEnv('BOOKING_STAYS_CJ_DEEPLINK', 'https://www.anrdoezrs.net/click-101803878-17293132');
    vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', FIXED_STAYS);
    const r = resolveBookingSearchUrl({ target, destination: 'Paris', adults: 2 });
    expect(r.status).toBe('unavailable');
    expect(r).toMatchObject({ reason: 'invalid_configuration' });
  });

  it('no deep-link + default fail_closed → unavailable(deep_link_unavailable), NOT the fixed creative', () => {
    stubFixedOnly(); // fixed creative present, but search must not use it
    const r = resolveBookingSearchUrl({ target, destination: 'Paris', adults: 2 });
    expect(r.status).toBe('unavailable');
    expect(r).toMatchObject({ reason: 'deep_link_unavailable' });
  });

  it('no deep-link + untracked_fallback → untracked, destination-correct target (no CJ, no homepage)', () => {
    stubUntrackedFallback();
    const r = resolveBookingSearchUrl({ target, destination: 'Paris', adults: 2 });
    expect(r.status).toBe('untracked');
    if (r.status !== 'untracked') return;
    expect(r.url).toBe(target);
    expect(r.reason).toBe('deep_link_unavailable');
    expect(r.url).not.toContain('17288985');
  });
});

describe('resolveBookingHotelsSearch — destinations survive (integration)', () => {
  it.each(DESTINATIONS)('tracked deep-link preserves ss=%s exactly (single-encoded)', (city) => {
    stubDeeplink();
    const r = resolveBookingHotelsSearch({ destination: city, checkIn: '2026-09-01', checkOut: '2026-09-05', adults: 2 });
    expect(r.status).toBe('tracked');
    if (r.status !== 'tracked') return;
    const inner = innerTarget(r.url);
    expect(inner.hostname).toBe('www.booking.com');
    expect(inner.pathname).toBe('/searchresults.html');
    expect(inner.searchParams.get('ss')).toBe(city); // decodes cleanly → no double-encoding
    expect(r.url).not.toContain('%2525'); // %25 of a %25 == double-encoded
  });

  it('preserves dates + guests through the wrapper', () => {
    stubDeeplink();
    const r = resolveBookingHotelsSearch({
      destination: 'Paris',
      checkIn: '2026-09-01',
      checkOut: '2026-09-05',
      adults: 2,
      children: 1,
      rooms: 2,
    });
    if (r.status !== 'tracked') throw new Error('expected tracked');
    const inner = innerTarget(r.url);
    expect(inner.searchParams.get('checkin')).toBe('2026-09-01');
    expect(inner.searchParams.get('checkout')).toBe('2026-09-05');
    expect(inner.searchParams.get('group_adults')).toBe('2');
    expect(inner.searchParams.get('group_children')).toBe('1');
    expect(inner.searchParams.get('no_rooms')).toBe('2');
  });
});

describe('guest normalization — never group_adults=0', () => {
  it.each([
    [0, '2'],
    [-3, '2'],
    [undefined as unknown as number, '2'],
    [1, '1'],
    [99, '30'],
  ])('adults=%s → group_adults=%s', (adults, expected) => {
    stubUntrackedFallback();
    const r = resolveBookingHotelsSearch({ destination: 'Rome', adults });
    if (r.status === 'unavailable') throw new Error('expected a url');
    const u = new URL(r.url);
    expect(u.searchParams.get('group_adults')).toBe(expected);
    expect(u.searchParams.get('group_adults')).not.toBe('0');
  });

  it('normalizeStayParty clamps children ≥0 and rooms ≥1', () => {
    expect(normalizeStayParty({ adults: 0, children: -2, rooms: 0 })).toEqual({ adults: 2, children: 0, rooms: 1 });
    expect(normalizeStayParty({ adults: 3, children: 2, rooms: 4 })).toEqual({ adults: 3, children: 2, rooms: 4 });
    expect(normalizeStayParty({ adults: 999, children: 99, rooms: 99 })).toEqual({ adults: 30, children: 10, rooms: 30 });
  });
});

describe('date policy', () => {
  it('classifies dates deterministically', () => {
    expect(validateStayDates(undefined, undefined).ok).toBe(true);
    expect(validateStayDates('2026-09-01', '2026-09-05').ok).toBe(true);
    expect(validateStayDates('2026-09-05', '2026-09-01')).toMatchObject({ ok: false, reason: 'reversed' });
    expect(validateStayDates('2026-09-01', '2026-09-01')).toMatchObject({ ok: false, reason: 'same_day' });
    expect(validateStayDates('nonsense', '2026-09-05')).toMatchObject({ ok: false, reason: 'malformed' });
    expect(validateStayDates('2026-09-01', undefined)).toMatchObject({ ok: false, reason: 'malformed' });
  });

  it('hotels search drops invalid dates rather than building a broken search', () => {
    stubUntrackedFallback();
    const r = resolveBookingHotelsSearch({ destination: 'Rome', checkIn: '2026-09-05', checkOut: '2026-09-01', adults: 2 });
    if (r.status === 'unavailable') throw new Error('expected a url');
    const u = new URL(r.url);
    // reversed dates dropped → still a valid destination search, no bad checkin/checkout
    expect(u.searchParams.get('ss')).toBe('Rome');
    expect(u.searchParams.get('checkin')).toBeNull();
  });
});

describe('encoding survives', () => {
  it.each([
    ["O'Hare Chicago", "O'Hare Chicago"],
    ['Aix & Marseille', 'Aix & Marseille'],
    ['Washington, D.C.', 'Washington, D.C.'],
    ['A/B Town', 'A/B Town'],
    ['São Paulo', 'São Paulo'],
    ['東京', '東京'],
  ])('%s round-trips through the tracked wrapper', (dest) => {
    stubDeeplink();
    const r = resolveBookingHotelsSearch({ destination: dest, adults: 2 });
    if (r.status !== 'tracked') throw new Error('expected tracked');
    expect(innerTarget(r.url).searchParams.get('ss')).toBe(dest);
    expect(r.url).not.toContain('%2525');
  });
});

describe('generic resolver — the fixed creative is allowed here', () => {
  it('returns the fixed stays creative when configured', () => {
    vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', FIXED_STAYS);
    expect(resolveBookingGenericUrl({ vertical: 'stays' })).toBe(FIXED_STAYS);
  });
  it('falls back to a generic booking.com landing when unconfigured', () => {
    vi.stubEnv('BOOKING_STAYS_AFFILIATE_URL', '');
    expect(resolveBookingGenericUrl({ vertical: 'stays' })).toBe('https://www.booking.com/');
  });
});

describe('regression assertions (money-path invariants)', () => {
  it('a search NEVER returns the fixed homepage creative 17288985 — across all config states', () => {
    const target = 'https://www.booking.com/searchresults.html?ss=Paris';
    for (const setup of [stubDeeplink, stubFixedOnly, stubUntrackedFallback, () => {}]) {
      vi.unstubAllEnvs();
      setup();
      const r = resolveBookingSearchUrl({ target, destination: 'Paris', adults: 2 });
      if (r.status !== 'unavailable') {
        expect(r.url, `config ${setup.name}`).not.toContain(FIXED_STAYS_HOMEPAGE_CREATIVE_ID);
      }
    }
  });

  it('a search never touches a flights creative or a non-gobookt PID', () => {
    stubDeeplink();
    const r = resolveBookingHotelsSearch({ destination: 'Tokyo', adults: 2 });
    if (r.status === 'unavailable') throw new Error('expected a url');
    expect(r.url).not.toContain(FLIGHTS_CREATIVE);
    expect(r.url.toLowerCase()).not.toContain('flights.booking.com');
    expect(r.url).toContain(`click-${GOBOOKT_PID}-`);
    // no other brand's PID (gotript/numiworks/stayviaowner share nothing here)
    const pids = [...r.url.matchAll(/click-(\d+)-/g)].map((m) => m[1]);
    expect(pids.every((p) => p === GOBOOKT_PID)).toBe(true);
  });

  it('isFixedStaysHomepageCreative detects the fixed creative, not the deep-link', () => {
    expect(isFixedStaysHomepageCreative(FIXED_STAYS)).toBe(true);
    expect(isFixedStaysHomepageCreative('https://www.anrdoezrs.net/click-101803878-17293132?url=x')).toBe(false);
    expect(isFixedStaysHomepageCreative('https://www.booking.com/searchresults.html?ss=Paris')).toBe(false);
  });

  it('isValidStaysSearchTarget gate', () => {
    expect(isValidStaysSearchTarget('https://www.booking.com/searchresults.html?ss=Paris')).toBe(true);
    expect(isValidStaysSearchTarget('https://www.booking.com/')).toBe(false);
    expect(isValidStaysSearchTarget('https://flights.booking.com/searchresults.html?ss=Paris')).toBe(false);
    expect(isValidStaysSearchTarget('https://evil.example.com/searchresults.html?ss=Paris')).toBe(false);
    expect(isValidStaysSearchTarget('not a url')).toBe(false);
  });

  it('bookingHotelsSearchHref is null in fail_closed with no deep-link (never a fake link)', () => {
    stubFixedOnly();
    expect(bookingHotelsSearchHref({ destination: 'Paris', adults: 2 })).toBeNull();
  });
});
