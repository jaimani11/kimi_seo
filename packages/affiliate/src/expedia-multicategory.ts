/**
 * Expedia multi-category affiliate URL builder — brand-parameterized.
 *
 * Expedia's commerce surface is broader than most affiliates — they
 * sell hotels, flights, packages, cars, cruises, and things to do.
 * Brands route every outbound CTA into the right Expedia vertical so
 * commission tracks against the correct partner program.
 *
 * This module is the shared factory: each brand binds its own label
 * + `_src` breadcrumb + default camref via `createExpediaMulticategory`
 * (values come from @adored/brand-config). The URL shapes are
 * identical for every brand.
 *
 * Env (per deployment):
 *   EXPEDIA_AFFILIATE_ID     — `clickref` param; without it URLs work
 *                              but attribution doesn't track.
 *   EXPEDIA_AFFILIATE_LABEL  — overrides the brand's default label.
 *   EXPEDIA_CAMPAIGN_ID      — overrides the brand's default camref.
 */

export type ExpediaCategory =
  | 'hotels'
  | 'vacation-rentals'
  | 'flights'
  | 'cars'
  | 'cruises'
  | 'packages'
  | 'attractions';

export interface ExpediaMultiConfig {
  affiliateId: string | null;
  label: string;
  campaignId: string | null;
}

export interface CategorySearchInput {
  destination: string;
  /** Origin city/airport for flight searches. Ignored for other
   *  categories. */
  origin?: string;
  /** ISO YYYY-MM-DD. Optional — when omitted, the partner shows a
   *  date-picker default. */
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

export interface ExpediaBrandBinding {
  /** Default sub-channel label (brand key, e.g. 'gotript'). */
  label: string;
  /** `_src` analytics breadcrumb attached to every URL. */
  src: string;
  /** Fallback Partnerize camref when EXPEDIA_CAMPAIGN_ID is unset —
   *  keeps VRBO attribution alive on missing env config. */
  defaultCamref?: string;
}

export interface ExpediaMulticategory {
  getExpediaMultiConfig: () => ExpediaMultiConfig;
  buildExpediaCategoryUrl: (
    category: ExpediaCategory,
    input: CategorySearchInput,
    config?: ExpediaMultiConfig,
  ) => string;
}

export function createExpediaMulticategory(
  brand: ExpediaBrandBinding,
): ExpediaMulticategory {
  function getExpediaMultiConfig(): ExpediaMultiConfig {
    const aidRaw = (
      process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID ||
      process.env.EXPEDIA_AFFILIATE_ID ||
      ''
    ).trim();
    const labelRaw = (
      process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_LABEL ||
      process.env.EXPEDIA_AFFILIATE_LABEL ||
      brand.label
    ).trim();
    const campaignRaw = (
      process.env.NEXT_PUBLIC_EXPEDIA_CAMPAIGN_ID ||
      process.env.EXPEDIA_CAMPAIGN_ID ||
      ''
    ).trim();
    return {
      affiliateId: aidRaw.length > 0 ? aidRaw : null,
      label: labelRaw.length > 0 ? labelRaw : brand.label,
      campaignId: campaignRaw.length > 0 ? campaignRaw : null,
    };
  }

  function withAffiliate(url: string, config: ExpediaMultiConfig): string {
    const u = new URL(url);
    // `clickref` is the standard partner-tracking key on the Awin/CJ
    // flow; `camref` carries the Expedia campaign id if configured.
    // `_src` is our own analytics breadcrumb (doesn't affect
    // commission).
    if (config.affiliateId) u.searchParams.set('clickref', config.affiliateId);
    if (config.campaignId) u.searchParams.set('camref', config.campaignId);
    u.searchParams.set('label', config.label);
    u.searchParams.set('_src', brand.src);
    return u.toString();
  }

  /**
   * Wrap a plain vrbo.com URL through Partnerize's click tracker.
   *
   * Format: `https://prf.hn/click/camref:<camref>/destination:<encoded>`
   *
   * Partnerize registers the click server-side before forwarding to
   * VRBO — that server-side step is what actually books the
   * commission. Query-param camref on the destination URL is
   * unreliable across the VRBO surface.
   */
  function wrapVrboPartnerize(vrboUrl: string, config: ExpediaMultiConfig): string {
    const camref = (config.campaignId ?? '').trim() || brand.defaultCamref || '';
    if (!camref) return vrboUrl;
    return `https://prf.hn/click/camref:${camref}/destination:${encodeURIComponent(vrboUrl)}`;
  }

  function buildVacationRentalsUrl(
    input: CategorySearchInput,
    config: ExpediaMultiConfig,
  ): string {
    // VRBO is Expedia Group's vacation-rental brand — same Partnerize
    // affiliate account, but VRBO pays the highest commission in the
    // family (8-10% vs 3-4% on Expedia hotels).
    const encoded = encodeURIComponent(input.destination);
    const params = new URLSearchParams();
    if (input.checkIn) params.set('startDate', input.checkIn);
    if (input.checkOut) params.set('endDate', input.checkOut);
    const query = params.toString();
    const suffix = query.length > 0 ? `?${query}` : '';
    return wrapVrboPartnerize(
      `https://www.vrbo.com/search/keywords:${encoded}${suffix}`,
      config,
    );
  }

  function buildHotelsUrl(input: CategorySearchInput, config: ExpediaMultiConfig): string {
    const params = new URLSearchParams();
    params.set('destination', input.destination);
    if (input.checkIn) params.set('startDate', input.checkIn);
    if (input.checkOut) params.set('endDate', input.checkOut);
    params.set('rooms', String(input.rooms ?? 1));
    params.set('adults', String(input.adults ?? 2));
    if (input.children && input.children > 0) {
      params.set('children', String(input.children));
    }
    return withAffiliate(
      `https://www.expedia.com/Hotel-Search?${params.toString()}`,
      config,
    );
  }

  function buildFlightsUrl(input: CategorySearchInput, config: ExpediaMultiConfig): string {
    // Expedia flights use a compact leg encoding. `from` and `to` on
    // each leg are free-text city/airport names — Expedia resolves
    // them to airport codes on their side.
    const from = input.origin ?? '';
    const to = input.destination;
    const params = new URLSearchParams();
    params.set('flight-type', 'on');
    params.set('mode', 'search');
    params.set('trip', 'roundtrip');
    params.set('leg1', `from:${from},to:${to},departure:${input.checkIn ?? ''}TANYT`);
    if (input.checkOut) {
      params.set('leg2', `from:${to},to:${from},departure:${input.checkOut}TANYT`);
    }
    params.set(
      'passengers',
      `adults:${input.adults ?? 1},children:${input.children ?? 0},seniors:0,infantinlap:Y`,
    );
    return withAffiliate(
      `https://www.expedia.com/Flights-Search?${params.toString()}`,
      config,
    );
  }

  function buildCarsUrl(input: CategorySearchInput, config: ExpediaMultiConfig): string {
    const params = new URLSearchParams();
    params.set('locn', input.destination);
    if (input.checkIn) params.set('date1', input.checkIn);
    if (input.checkOut) params.set('date2', input.checkOut);
    return withAffiliate(
      `https://www.expedia.com/Cars?${params.toString()}`,
      config,
    );
  }

  function buildCruisesUrl(_input: CategorySearchInput, config: ExpediaMultiConfig): string {
    // Expedia's Cruises product is still live (unlike Booking.com) —
    // but their search takes destination/region selectors that don't
    // map cleanly to free-text. Land on discovery and let the visitor
    // filter.
    return withAffiliate('https://www.expedia.com/Cruises', config);
  }

  function buildPackagesUrl(input: CategorySearchInput, config: ExpediaMultiConfig): string {
    const params = new URLSearchParams();
    params.set('destination', input.destination);
    if (input.checkIn) params.set('startDate', input.checkIn);
    if (input.checkOut) params.set('endDate', input.checkOut);
    params.set('rooms', String(input.rooms ?? 1));
    params.set('adults', String(input.adults ?? 2));
    if (input.children && input.children > 0) {
      params.set('children', String(input.children));
    }
    return withAffiliate(
      `https://www.expedia.com/Vacation-Packages?${params.toString()}`,
      config,
    );
  }

  function buildAttractionsUrl(input: CategorySearchInput, config: ExpediaMultiConfig): string {
    const params = new URLSearchParams();
    params.set('location', input.destination);
    if (input.checkIn) params.set('startDate', input.checkIn);
    if (input.checkOut) params.set('endDate', input.checkOut);
    return withAffiliate(
      `https://www.expedia.com/things-to-do/search?${params.toString()}`,
      config,
    );
  }

  function buildExpediaCategoryUrl(
    category: ExpediaCategory,
    input: CategorySearchInput,
    config: ExpediaMultiConfig = getExpediaMultiConfig(),
  ): string {
    switch (category) {
      case 'hotels':
        return buildHotelsUrl(input, config);
      case 'vacation-rentals':
        return buildVacationRentalsUrl(input, config);
      case 'flights':
        return buildFlightsUrl(input, config);
      case 'cars':
        return buildCarsUrl(input, config);
      case 'cruises':
        return buildCruisesUrl(input, config);
      case 'packages':
        return buildPackagesUrl(input, config);
      case 'attractions':
        return buildAttractionsUrl(input, config);
    }
  }

  return { getExpediaMultiConfig, buildExpediaCategoryUrl };
}

/**
 * Display label + ordering for the category strip on multi-category
 * home pages. Single source of truth for which Expedia verticals a
 * brand covers and in what order.
 */
export const CATEGORY_META: ReadonlyArray<{
  id: ExpediaCategory;
  label: string;
  description: string;
  iconHint: string;
}> = [
  {
    id: 'hotels',
    label: 'Stays',
    description: 'Hotels, apartments, resorts worldwide.',
    iconHint: 'bed',
  },
  {
    id: 'vacation-rentals',
    label: 'Vacation rentals',
    description: 'Whole homes, cabins, villas, condos — powered by VRBO.',
    iconHint: 'home',
  },
  {
    id: 'flights',
    label: 'Flights',
    description: 'Round-trip + one-way, every major carrier.',
    iconHint: 'plane',
  },
  {
    id: 'packages',
    label: 'Packages',
    description: 'Hotel + flight bundles — save more booking together.',
    iconHint: 'package',
  },
  {
    id: 'attractions',
    label: 'Things to do',
    description: 'Tours, day trips, food walks, tickets.',
    iconHint: 'ticket',
  },
  {
    id: 'cars',
    label: 'Car rentals',
    description: 'Pick-up at airports + city locations.',
    iconHint: 'car',
  },
  {
    id: 'cruises',
    label: 'Cruises',
    description: 'River, ocean, expedition routes.',
    iconHint: 'ship',
  },
];
