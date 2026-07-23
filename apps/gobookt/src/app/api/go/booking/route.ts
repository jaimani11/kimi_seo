import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  buildBookingComCategoryUrl,
  resolveBookingHotelsSearch,
  type BookingComCategory,
} from '@lib/affiliate/booking-com-multicategory';
import { describeBookingCjUrl, validateStayDates } from '@lib/affiliate/booking-cj-links';
import { isAllowedAffiliateHost } from '@lib/affiliate/allowlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: BookingComCategory[] = [
  'hotels',
  'flights',
  'attractions',
  'cars',
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
  const checkIn = params.get('checkIn') ?? undefined;
  const checkOut = params.get('checkOut') ?? undefined;
  const adults = numberOr(params.get('adults'), 2);
  const children = numberOr(params.get('children'), 0);
  const rooms = numberOr(params.get('rooms'), 1);

  // Structured, secret-free problem envelope the UI can branch on. Never
  // exposes env values or internal config — only a stable machine reason.
  const problem = (reason: string, status: number) =>
    Response.json({ ok: false, provider: 'booking', vertical: category, reason }, { status });

  if (!destination) return problem('missing_destination', 400);

  const logGo = (outbound: string, mode: string) => {
    const desc = describeBookingCjUrl(outbound);
    console.info('[go/booking]', {
      site: 'gobookt',
      provider: 'booking',
      product: category,
      mode,
      tracked: desc.tracked,
      cjDomain: desc.cjDomain,
      creativeId: desc.creativeId,
      destination,
    });
  };

  // HOTELS = search intent → money-path-safe resolver. Fails CLOSED (structured
  // 503/400), never a homepage redirect. Strict date policy applies to stays.
  if (category === 'hotels') {
    const dates = validateStayDates(checkIn, checkOut);
    if (!dates.ok) return problem(`invalid_dates_${dates.reason}`, 400);
    const res = resolveBookingHotelsSearch({
      destination,
      ...(dates.checkIn ? { checkIn: dates.checkIn } : {}),
      ...(dates.checkOut ? { checkOut: dates.checkOut } : {}),
      adults,
      children,
      rooms,
    });
    if (res.status === 'unavailable') {
      // deep_link_unavailable / invalid_configuration → 503 (retryable);
      // missing_destination / invalid_target → 400.
      const retryable = res.reason === 'deep_link_unavailable' || res.reason === 'invalid_configuration';
      return problem(res.reason, retryable ? 503 : 400);
    }
    if (!isAllowedAffiliateHost(res.url)) {
      console.error('[go/booking] resolved URL not on affiliate allowlist — refusing', { product: category });
      return problem('invalid_target', 502);
    }
    logGo(res.url, res.status); // 'tracked' | 'untracked'
    return NextResponse.redirect(res.url, 302);
  }

  // Non-stays verticals (attractions / flights / cars / taxis): existing path.
  const outbound = buildBookingComCategoryUrl(category, {
    destination,
    ...(checkIn ? { checkIn } : {}),
    ...(checkOut ? { checkOut } : {}),
    adults,
    children,
  });
  // Defense-in-depth open-redirect guard: the resolved URL must be a trusted
  // affiliate host (booking.com or a CJ redirect domain). Fail closed rather
  // than redirect off-network.
  if (!isAllowedAffiliateHost(outbound)) {
    console.error('[go/booking] resolved URL not on affiliate allowlist — refusing', { product: category });
    return problem('invalid_target', 502);
  }
  logGo(outbound, 'category');
  return NextResponse.redirect(outbound, 302);
}

function numberOr(raw: string | null, fallback: number): number {
  const n = Number((raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
