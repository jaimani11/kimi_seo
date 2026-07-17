import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveBookingUrl } from '@lib/affiliate/booking-cj-links';

// A deep-link TEMPLATE (with the literal {TARGET}) used to unit-test the resolver's
// substitution + priority LOGIC. NOTE: in practice NONE of gobookt's CJ creatives
// honour ?url= — 17293132 (homepage banner) and 17323532 (Advanced Link) BOTH land
// on the Booking.com homepage in a real browser. The live homepage search therefore
// uses Booking's affiliate WIDGET (features/site/booking-widget.tsx), which deep-links
// + tracks via Booking's own SDK. This test still guards the resolver so that IF a
// genuine deep-link creative is ever provisioned, the substitution wiring stays correct.
const STAYS_DEEPLINK = 'https://www.tkqlhce.com/click-101803878-17293132?url={TARGET}';
const STAYS_FIXED = 'https://www.anrdoezrs.net/click-101803878-17288985'; // fixed homepage creative
const FLIGHTS_FIXED = 'https://www.tkqlhce.com/click-101803878-17288982'; // flights creative
const TARGET =
  'https://www.booking.com/searchresults.html?ss=Paris&checkin=2026-07-31&checkout=2026-08-03&group_adults=2';

const KEYS = [
  'BOOKING_STAYS_CJ_DEEPLINK',
  'BOOKING_STAYS_AFFILIATE_URL',
  'BOOKING_FLIGHTS_AFFILIATE_URL',
  'BOOKING_AFFILIATE_ENABLED',
] as const;

describe('gobookt Booking.com stays deep-link resolution (resolveBookingUrl)', () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('with BOOKING_STAYS_CJ_DEEPLINK set: deep-links the Paris target through the stays creative, encoded exactly once', () => {
    process.env.BOOKING_STAYS_CJ_DEEPLINK = STAYS_DEEPLINK;
    const out = resolveBookingUrl('stays', TARGET);
    expect(out).toBe(`https://www.tkqlhce.com/click-101803878-17293132?url=${encodeURIComponent(TARGET)}`);
    // destination + dates survive inside ?url= (decoding exactly once yields the target)
    const inner = decodeURIComponent(new URL(out).searchParams.get('url')!);
    expect(inner).toBe(TARGET);
    expect(inner).toContain('ss=Paris');
    expect(inner).toContain('checkin=2026-07-31');
    expect(inner).toContain('checkout=2026-08-03');
    expect(out).not.toContain('%252'); // encoded once — no double-encoding
  });

  it('the deep-link WINS over the fixed homepage creative when both are set (required priority)', () => {
    process.env.BOOKING_STAYS_CJ_DEEPLINK = STAYS_DEEPLINK;
    process.env.BOOKING_STAYS_AFFILIATE_URL = STAYS_FIXED;
    const out = resolveBookingUrl('stays', TARGET);
    expect(out).toContain('click-101803878-17293132'); // deep-link creative
    expect(out).toContain('?url='); // carries the destination
    expect(out).not.toBe(STAYS_FIXED);
  });

  it('WITHOUT the deep-link var: falls back to the fixed homepage creative — reproduces the current prod bug (destination lost)', () => {
    process.env.BOOKING_STAYS_AFFILIATE_URL = STAYS_FIXED;
    const out = resolveBookingUrl('stays', TARGET);
    expect(out).toBe(STAYS_FIXED); // homepage creative, no ss=Paris — exactly what prod is doing now
  });

  it('a stays request can NEVER select a flights creative (surface isolation)', () => {
    process.env.BOOKING_STAYS_CJ_DEEPLINK = STAYS_DEEPLINK;
    process.env.BOOKING_FLIGHTS_AFFILIATE_URL = FLIGHTS_FIXED;
    const out = resolveBookingUrl('stays', TARGET);
    expect(out).not.toContain('17288982'); // never the flights creative
    expect(out).toContain('17293132'); // the stays creative
  });

  it('GOTCHA: a deep-link value missing the literal {TARGET} is silently IGNORED → falls to the homepage creative', () => {
    // If the Vercel value omits `?url={TARGET}`, the code cannot substitute → uses tier 2.
    process.env.BOOKING_STAYS_CJ_DEEPLINK = 'https://www.tkqlhce.com/click-101803878-17293132';
    process.env.BOOKING_STAYS_AFFILIATE_URL = STAYS_FIXED;
    const out = resolveBookingUrl('stays', TARGET);
    expect(out).toBe(STAYS_FIXED);
  });
});
