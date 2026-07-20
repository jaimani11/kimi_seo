import { describe, expect, it } from 'vitest';
import {
  buildBookingComCategoryUrl,
  type BookingComCategory,
} from '@lib/affiliate/booking-com-multicategory';
import { auditBrandLinks } from '@adored/affiliate';

/**
 * Per-deploy money-link integrity guard for gobookt.
 *
 * gobookt monetizes via Booking.com through Commission Junction. This asserts
 * every builder output lands on booking.com or a CJ redirect domain and NEVER
 * leaks to VRBO / Expedia / Viator — the exact class of the "gobookt stays CTA
 * → Booking Flights / vrbo" bug. CJ attribution (cjevent) is minted at redirect
 * time, not present in the built URL, so it's a runtime audit — not a build
 * check — hence the host + leak guard here.
 */

const CATEGORIES: BookingComCategory[] = ['hotels', 'attractions', 'flights', 'cars'];
const DESTINATIONS = ['Paris, France', 'Bali, Indonesia', 'Abu Dhabi, UAE'];

function sampleMoneyLinks(): string[] {
  return CATEGORIES.flatMap((category) =>
    DESTINATIONS.map((destination) =>
      buildBookingComCategoryUrl(category, {
        destination,
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        adults: 2,
      }),
    ),
  );
}

describe('gobookt money-link integrity', () => {
  it('every Booking builder output stays on Booking.com / a CJ domain (no cross-brand leak)', () => {
    const urls = sampleMoneyLinks();
    const report = auditBrandLinks('gobookt', urls);
    expect(report.failures).toEqual([]);
    expect(report.ok).toBe(urls.length);
  });

  it('is a live guard — a wrong-partner (vrbo.com) link is flagged as leaked', () => {
    const report = auditBrandLinks('gobookt', ['https://www.vrbo.com/search?destination=Paris']);
    expect(report.byCode.leaked).toBe(1);
  });
});
