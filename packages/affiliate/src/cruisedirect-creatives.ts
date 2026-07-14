/**
 * CruiseDirect CJ creatives — the typed, site-AGNOSTIC catalog.
 *
 * Each entry carries only the CJ creative id + the CJ redirect domain that
 * CJ generated the link on. It deliberately holds NO publisher id (PID): the
 * PID is injected at resolve time from each site's own
 * `CRUISEDIRECT_EVERGREEN_URL` env var (see cruisedirect.ts), so a GoTript
 * build can only ever emit GoTript-PID links and a Numiworks build only
 * Numiworks-PID links — site isolation is structural, not a convention.
 *
 * A CJ click URL is `https://www.<cjDomain>/click-<PID>-<creativeId>`. CJ's
 * redirect domains (anrdoezrs/dpbolvw/tkqlhce/jdoqocy/kqzyfj) are functionally
 * interchangeable for a given advertiser — verified 2026-07-13 by following
 * the redirects: each lands on the matching cruisedirect.com category with the
 * correct site PID in `utm_content`.
 *
 * Do NOT hand-generate banner image URLs from these — the public site uses our
 * own cards/images with the CJ CLICK url as the destination only.
 */

export type CruiseCreativeSlug =
  | 'evergreen'
  | 'virgin'
  | 'caribbean'
  | 'miami'
  | 'regent-seven-seas'
  | 'mediterranean'
  | 'europe'
  | 'hurtigruten-expeditions'
  | 'mediterranean-alt'
  | 'celebrity'
  | 'msc'
  | 'luxury'
  | 'family'
  | 'holland-america'
  | 'carnival'
  | 'disney'
  | 'norwegian'
  | 'honeymoon'
  | 'last-minute'
  | 'new-york'
  | 'river'
  | 'los-angeles';

export interface CruiseCreative {
  /** Stable slug (also the category key the UI + logging use). */
  slug: CruiseCreativeSlug;
  /** CJ creative / link id (the trailing number in click-<PID>-<id>). */
  creativeId: string;
  /** CJ redirect domain this creative was generated on. */
  cjDomain: string;
  /** Human label for cards/nav. No price/availability claims. */
  label: string;
}

/**
 * The 22 CruiseDirect creatives (creative ids + CJ domains as supplied by CJ).
 * ✓ = redirect-verified 2026-07-13 to land on the correct cruisedirect.com
 * destination with the correct site PID.
 */
export const CRUISE_CREATIVES: Record<CruiseCreativeSlug, CruiseCreative> = {
  evergreen: { slug: 'evergreen', creativeId: '15734200', cjDomain: 'tkqlhce.com', label: 'All cruises' }, // ✓ → /
  virgin: { slug: 'virgin', creativeId: '15534638', cjDomain: 'anrdoezrs.net', label: 'Virgin Voyages' }, // ✓ → /cruise-line/virgin-voyages
  caribbean: { slug: 'caribbean', creativeId: '15534704', cjDomain: 'anrdoezrs.net', label: 'Caribbean cruises' }, // ✓ → /destination/caribbean
  miami: { slug: 'miami', creativeId: '15534697', cjDomain: 'tkqlhce.com', label: 'Cruises from Miami' },
  'regent-seven-seas': { slug: 'regent-seven-seas', creativeId: '15535747', cjDomain: 'anrdoezrs.net', label: 'Regent Seven Seas' },
  mediterranean: { slug: 'mediterranean', creativeId: '17007078', cjDomain: 'anrdoezrs.net', label: 'Mediterranean cruises' },
  europe: { slug: 'europe', creativeId: '17052751', cjDomain: 'jdoqocy.com', label: 'Europe cruises' },
  'hurtigruten-expeditions': { slug: 'hurtigruten-expeditions', creativeId: '15535739', cjDomain: 'jdoqocy.com', label: 'Hurtigruten expeditions' },
  'mediterranean-alt': { slug: 'mediterranean-alt', creativeId: '10929173', cjDomain: 'kqzyfj.com', label: 'Mediterranean cruises' },
  celebrity: { slug: 'celebrity', creativeId: '13096784', cjDomain: 'tkqlhce.com', label: 'Celebrity Cruises' },
  msc: { slug: 'msc', creativeId: '15534062', cjDomain: 'tkqlhce.com', label: 'MSC Cruises' },
  luxury: { slug: 'luxury', creativeId: '15533885', cjDomain: 'dpbolvw.net', label: 'Luxury cruises' },
  family: { slug: 'family', creativeId: '15533825', cjDomain: 'anrdoezrs.net', label: 'Family cruises' },
  'holland-america': { slug: 'holland-america', creativeId: '15533830', cjDomain: 'dpbolvw.net', label: 'Holland America Line' },
  carnival: { slug: 'carnival', creativeId: '15533895', cjDomain: 'tkqlhce.com', label: 'Carnival Cruise Line' },
  disney: { slug: 'disney', creativeId: '15534059', cjDomain: 'tkqlhce.com', label: 'Disney Cruise Line' },
  norwegian: { slug: 'norwegian', creativeId: '15534063', cjDomain: 'anrdoezrs.net', label: 'Norwegian Cruise Line' },
  honeymoon: { slug: 'honeymoon', creativeId: '15534052', cjDomain: 'anrdoezrs.net', label: 'Honeymoon cruises' },
  'last-minute': { slug: 'last-minute', creativeId: '10493749', cjDomain: 'anrdoezrs.net', label: 'Last-minute cruises' },
  'new-york': { slug: 'new-york', creativeId: '15533903', cjDomain: 'kqzyfj.com', label: 'Cruises from New York' },
  river: { slug: 'river', creativeId: '15534668', cjDomain: 'dpbolvw.net', label: 'River cruises' },
  'los-angeles': { slug: 'los-angeles', creativeId: '15533835', cjDomain: 'kqzyfj.com', label: 'Cruises from Los Angeles' },
};

/** GoTript — cruises as a visible SECONDARY category. */
export const GOTRIPT_CRUISE_COLLECTIONS: readonly CruiseCreativeSlug[] = [
  'caribbean',
  'mediterranean',
  'family',
  'last-minute',
  'miami',
  'new-york',
  'los-angeles',
];

/** Numiworks — cruises as curated inspiration, below whole-home + AI planning. */
export const NUMIWORKS_CRUISE_COLLECTIONS: readonly CruiseCreativeSlug[] = [
  'mediterranean',
  'luxury',
  'honeymoon',
  'river',
  'hurtigruten-expeditions',
];
