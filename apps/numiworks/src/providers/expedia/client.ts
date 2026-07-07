import type { ProviderSearchQuery } from '@core/provider';
import { httpJson } from '../_shared/http';
import { signRapidRequest, type RapidCredentials } from '../_shared/rapid-signature';
import { ExpediaSearchResponseSchema, type ExpediaSearchResponse } from './types';

/**
 * Expedia EPS Rapid Shopping client.
 *
 * Endpoint: `/v3/properties/availability` returns properties + rates
 * for a date window. (`/v3/properties/search` is the raw catalog
 * lookup without availability - we use availability since the
 * concierge always plans against specific or hinted dates.)
 *
 * Auth: HMAC-SHA512 signature over `apiKey + sharedSecret + epochSeconds`,
 * sent in the `Authorization: EAN APIKey=…,Signature=…,timestamp=…`
 * header. Built in `_shared/rapid-signature.ts` so Vrbo can reuse.
 *
 * Rapid also requires:
 *   - `Customer-Ip` - the inbound user's IP. Affiliate attribution
 *     uses this for fraud + loyalty programs.
 *   - `Customer-Session-Id` - opaque per-user session identifier; we
 *     pass our anonymous-session UUID when no Customer-Ip is set.
 *
 * Reference:
 *   https://developers.expediagroup.com/docs/rapid/lodging/shop/property-availability
 *
 * Production: when applying for keys, request access to the
 * "Affiliate Lite" tier first - supports search + availability without
 * the booking endpoints. Booking flow stays redirect-based via the
 * affiliate URL builder in `mapper.ts`.
 */

const RAPID_BASE = 'https://api.ean.com/v3';

/** Re-export so existing call sites importing { ExpediaCredentials }
 *  from this module continue to work; under the hood it's the shared
 *  Rapid credential shape used by Vrbo too. */
export type ExpediaCredentials = RapidCredentials;

export interface ExpediaSearchOptions {
  /** Inbound user's IP for affiliate attribution. Falls back to
   *  `'127.0.0.1'` for dev - production should always set this. */
  customerIp?: string;
  /** Opaque per-user session id (anon-session UUID is fine). */
  customerSessionId?: string;
  /** Filter by Rapid category id. Used by VrboProvider to restrict
   *  to vacation-rental categories within the same Rapid surface. */
  categoryIdsAllowlist?: readonly string[];
}

export async function searchExpedia(
  query: ProviderSearchQuery,
  creds: RapidCredentials,
  signal: AbortSignal,
  opts: ExpediaSearchOptions = {},
): Promise<ExpediaSearchResponse | null> {
  const params = buildQueryParams(query, opts);
  const url = `${RAPID_BASE}/properties/availability?${params.toString()}`;

  const signed = signRapidRequest(creds);
  const headers: Record<string, string> = {
    authorization: signed.authorization,
    accept: 'application/json',
    'accept-encoding': 'gzip',
    'customer-ip': opts.customerIp ?? '127.0.0.1',
    'customer-session-id': opts.customerSessionId ?? 'numiworks-dev',
  };

  const raw = await httpJson<unknown>(url, {
    method: 'GET',
    headers,
    signal,
    providerId: 'expedia',
  });

  if (raw === null) return null;
  const parsed = ExpediaSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      '[expedia/rapid] response failed Zod validation:',
      parsed.error.issues.slice(0, 3),
    );
    return { properties: [] };
  }
  return parsed.data;
}

function buildQueryParams(query: ProviderSearchQuery, opts: ExpediaSearchOptions): URLSearchParams {
  const params = new URLSearchParams();

  // Geographic filter - Rapid accepts `country_code` (alpha-2) +
  // optionally `region_id` for a curated region match. The concierge
  // gives us a country code; deeper filters arrive when we wire
  // Rapid's region taxonomy (E1.x).
  const dest = query.destinations[0];
  if (dest?.country) {
    params.set('country_code', dest.country.toUpperCase());
  }

  // Dates - Rapid wants `checkin` / `checkout` ISO YYYY-MM-DD. The
  // availability endpoint requires both; if the user said "I dunno"
  // we synthesize a window 30 days out for a 5-night stay (matches
  // the booking-draft default in src/agents/booking-agent.ts).
  if (query.dates.kind === 'specific') {
    params.set('checkin', query.dates.start);
    params.set('checkout', query.dates.end);
  } else {
    const today = new Date();
    const checkIn = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + 5 * 24 * 60 * 60 * 1000);
    params.set('checkin', checkIn.toISOString().slice(0, 10));
    params.set('checkout', checkOut.toISOString().slice(0, 10));
  }

  // Occupancy - Rapid accepts `occupancy=A-C[,age]…` (e.g. `2-1[8]` =
  // 2 adults + 1 child age 8). Children ages aren't in our intent;
  // we default to 8 to keep the rate request valid.
  const childCount = Math.max(0, query.travelers.children.count);
  if (childCount > 0) {
    const ages = Array.from({ length: childCount }, () => '8').join(',');
    params.set('occupancy', `${query.travelers.adults}-${childCount}[${ages}]`);
  } else {
    params.set('occupancy', `${query.travelers.adults}`);
  }

  // Currency - preview in USD; production callers can override.
  params.set('currency', 'USD');

  // Optional category filter - used by Vrbo to restrict to
  // vacation-rental categories. Rapid accepts a comma-separated list.
  if (opts.categoryIdsAllowlist && opts.categoryIdsAllowlist.length > 0) {
    params.set('category_ids', opts.categoryIdsAllowlist.join(','));
  }

  // Result cap - Rapid defaults to 250; we want concise results.
  params.set('limit', String(Math.min(query.limit ?? 25, 50)));

  return params;
}
