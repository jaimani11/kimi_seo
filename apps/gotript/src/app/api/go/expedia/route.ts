import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  buildExpediaCategoryUrl,
  type ExpediaCategory,
} from '@lib/affiliate/expedia-multicategory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: ExpediaCategory[] = [
  'hotels',
  'vacation-rentals',
  'flights',
  'packages',
  'attractions',
  'cars',
  'cruises',
];

/**
 * GET /api/go/expedia
 *
 * Forwarder for the multi-category search hero. Takes the form's
 * (category, destination, dates, party) parameters, builds the
 * affiliate-tagged Expedia URL for the right vertical, and
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
  const category = VALID_CATEGORIES.includes(rawCategory as ExpediaCategory)
    ? (rawCategory as ExpediaCategory)
    : 'hotels';

  const destination = (params.get('destination') ?? '').trim();
  if (!destination) {
    return new Response('Missing destination', { status: 400 });
  }

  const checkIn = params.get('checkIn') ?? undefined;
  const checkOut = params.get('checkOut') ?? undefined;
  const origin = (params.get('origin') ?? '').trim() || undefined;
  const adults = numberOr(params.get('adults'), 2);
  const children = numberOr(params.get('children'), 0);

  const outbound = buildExpediaCategoryUrl(category, {
    destination,
    ...(origin ? { origin } : {}),
    ...(checkIn ? { checkIn } : {}),
    ...(checkOut ? { checkOut } : {}),
    adults,
    children,
  });

  const truncated = outbound.length > 100 ? `${outbound.slice(0, 97)}…` : outbound;
  console.info('[go/booking]', { category, destination, url: truncated });

  return NextResponse.redirect(outbound, 302);
}

function numberOr(raw: string | null, fallback: number): number {
  const n = Number((raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
