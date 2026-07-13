import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  buildBookingComCategoryUrl,
  type BookingComCategory,
} from '@lib/affiliate/booking-com-multicategory';
import { describeBookingCjUrl } from '@lib/affiliate/booking-cj-links';
import { isAllowedAffiliateHost } from '@lib/affiliate/allowlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: BookingComCategory[] = [
  'hotels',
  'flights',
  'attractions',
  'cars',
  'cruises',
  'taxis',
];

/**
 * GET /api/go/booking
 *
 * Forwarder for the multi-category search hero. Takes the form's
 * (category, destination, dates, party) parameters, builds the
 * affiliate-tagged Booking.com URL for the right vertical, and
 * 302s the browser there in a new tab.
 *
 * Centralizing the redirect through one endpoint means:
 *   - We can log every outbound search server-side (analytics seam).
 *   - The affiliate id never travels through the client bundle.
 *   - Adding new categories or rotating the affiliate id is a
 *     one-file change here, not across every component.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const params = url.searchParams;

  const rawCategory = (params.get('category') ?? '').trim();
  const category = VALID_CATEGORIES.includes(rawCategory as BookingComCategory)
    ? (rawCategory as BookingComCategory)
    : 'hotels';

  const destination = (params.get('destination') ?? '').trim();
  if (!destination) {
    return new Response('Missing destination', { status: 400 });
  }

  const checkIn = params.get('checkIn') ?? undefined;
  const checkOut = params.get('checkOut') ?? undefined;
  const adults = numberOr(params.get('adults'), 2);
  const children = numberOr(params.get('children'), 0);

  const outbound = buildBookingComCategoryUrl(category, {
    destination,
    ...(checkIn ? { checkIn } : {}),
    ...(checkOut ? { checkOut } : {}),
    adults,
    children,
  });

  // Defense-in-depth open-redirect guard: the resolved URL must be a trusted
  // affiliate host (booking.com or a CJ redirect domain). This can only fail
  // if an operator misconfigures a BOOKING_*_AFFILIATE_URL to a foreign
  // domain — fail closed rather than redirect off-network.
  if (!isAllowedAffiliateHost(outbound)) {
    console.error('[go/booking] resolved URL not on affiliate allowlist — refusing', {
      product: category,
    });
    return new Response('Booking destination unavailable', { status: 502 });
  }

  const desc = describeBookingCjUrl(outbound);
  console.info('[go/booking]', {
    site: 'gobookt',
    provider: 'booking',
    product: category,
    tracked: desc.tracked,
    cjDomain: desc.cjDomain,
    creativeId: desc.creativeId,
    destination,
  });

  return NextResponse.redirect(outbound, 302);
}

function numberOr(raw: string | null, fallback: number): number {
  const n = Number((raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
