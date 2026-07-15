/**
 * Expedia stay-search link builder.
 *
 * Thin compatibility shim around the new multi-category builder
 * (`expedia-multicategory.ts`). The legacy `active-stay-provider`
 * abstraction calls into this module for hotel-detail and hotel-
 * search hand-offs from the marketplace drawer and live search.
 *
 * For gotript we delegate to the single source of truth so all
 * outbound Expedia URLs share affiliate-id, label, and `_src`
 * handling.
 */

import {
  buildExpediaCategoryUrl,
  getExpediaMultiConfig,
} from './expedia-multicategory';

export interface ExpediaAffiliateConfig {
  affiliateId: string | null;
  /** Compat alias for affiliateId — the admin dashboard reads
   *  `config.cid` historically. Both point to the same value. */
  cid: string | null;
  label: string | null;
  baseUrl: string;
  /** Numeric site id. Kept for back-compat with the admin dashboard
   *  that displays it; defaults to 1 (Expedia.com US). */
  siteId: number;
}

export interface ExpediaSearchInput {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  childAges?: number[];
  rooms?: number;
}

/** Compat alias — some callers historically used a longer name. */
export type DestinationSearchInput = ExpediaSearchInput;

const DEFAULT_BASE_URL = 'https://www.expedia.com';

export function getExpediaAffiliateConfig(): ExpediaAffiliateConfig {
  const cfg = getExpediaMultiConfig();
  const siteIdRaw = (process.env.EXPEDIA_SITE_ID || '1').trim();
  const siteIdNum = Number.parseInt(siteIdRaw, 10);
  return {
    affiliateId: cfg.affiliateId,
    cid: cfg.affiliateId,
    label: cfg.label || null,
    baseUrl: DEFAULT_BASE_URL,
    siteId: Number.isFinite(siteIdNum) && siteIdNum > 0 ? siteIdNum : 1,
  };
}

/**
 * Build an Expedia destination-search URL. Drives the marketplace
 * drawer's "See {destination} on Expedia" CTA + the search-results
 * empty-state carousel CTAs.
 */
export function buildExpediaSearchUrl(input: ExpediaSearchInput): string {
  return buildExpediaCategoryUrl('hotels', {
    destination: input.destination,
    ...(input.checkIn ? { checkIn: input.checkIn } : {}),
    ...(input.checkOut ? { checkOut: input.checkOut } : {}),
    ...(input.adults != null ? { adults: input.adults } : {}),
    ...(input.children != null ? { children: input.children } : {}),
    ...(input.rooms != null ? { rooms: input.rooms } : {}),
  });
}
