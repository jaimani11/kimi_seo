/**
 * Brand configuration — the single file that defines a brand.
 *
 * The platform goal: launching a new travel brand should require
 * exactly one new file conforming to this type (plus a copied app
 * shell). Everything brand-specific that shared packages need —
 * domain, labels, affiliate ids, Pinterest board — flows from here.
 *
 * Fields are added ONLY when a real consumer exists. Config nobody
 * reads is documentation that lies.
 */

export interface BrandAffiliateConfig {
  /** Which providers this brand is allowed to surface. Order matters
   *  for display (first = primary partner). */
  providers: readonly (
    | 'viator'
    | 'getyourguide'
    | 'expedia'
    | 'vrbo'
    | 'booking'
  )[];
  /** Sub-channel label attached to Expedia-family URLs (`label` param)
   *  and used as the `_src` analytics breadcrumb. */
  expediaLabel?: string;
  /** Partnerize camref for Expedia/VRBO commission attribution. */
  expediaCamref?: string;
  /** GetYourGuide partner id (only for brands with GYG enabled). */
  gygPartnerId?: string;
  /** VRBO-issued affiliate shortlink landing URL, if the brand uses
   *  the shortlink pattern instead of Partnerize deep links. */
  vrboShortlink?: string;
}

export interface BrandColors {
  /** Primary UI accent (buttons, links). */
  primary: string;
  /** Secondary accent (CTAs, highlights). */
  secondary: string;
  /** Header/nav background. */
  header: string;
}

export interface BrandConfig {
  /** Stable machine key — matches the apps/<key> directory. */
  key: 'numiworks' | 'gotript' | 'gobookt' | 'stayviaowner' | (string & {});
  /** Display name as it appears in copy ("numiworks"). */
  name: string;
  /** Bare domain, no scheme ("numiworks.com"). */
  domain: string;
  /** Canonical production origin with scheme + www policy applied.
   *  This is the SITE_URL — used for canonicals, sitemap, JSON-LD,
   *  OpenGraph. NEVER fall back to VERCEL_URL in production. */
  siteUrl: string;
  /** One-line positioning used in hero/meta copy. */
  tagline: string;
  /** Legal operating entity — shared parent LLC. Emitted as the
   *  Organization `legalName` in sitewide JSON-LD (truthful: all four
   *  brands are operated by the same company). */
  legalName?: string;
  /** 1–2 sentence brand description. Distinct per brand — emitted as the
   *  Organization/WebSite `description` so Google reads four separate
   *  commercial entities, not domain mirrors. */
  description?: string;
  /** Path (from site root) to the brand's square logo asset, e.g.
   *  `/logo.svg`. Emitted as the Organization `logo` ImageObject. */
  logoPath?: string;
  colors: BrandColors;
  affiliate: BrandAffiliateConfig;
  /** Default Pinterest board id (env PINTEREST_BOARD_ID overrides). */
  pinterestBoardId?: string;
  /** Real, brand-controlled web presences. */
  social?: {
    pinterestUsername?: string;
    /** Absolute URLs of REAL profiles this brand controls (social,
     *  Wikipedia, Crunchbase, …). Emitted verbatim as Organization
     *  `sameAs`. Populate ONLY with profiles that actually exist —
     *  `sameAs` to a dead/nonexistent URL is a negative trust signal,
     *  so the emitter omits `sameAs` entirely while this is empty. */
    sameAs?: readonly string[];
  };
}
