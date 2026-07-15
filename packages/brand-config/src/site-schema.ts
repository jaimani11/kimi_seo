import type { BrandConfig } from './types';

/**
 * Sitewide JSON-LD (`Organization` + `WebSite`) for the knowledge graph and
 * the sitelinks search box. Built once here and shared by every app's
 * `siteJsonLd()` so the four brands stay in lockstep and a new brand inherits
 * the enriched schema for free.
 *
 * The `Organization` node is intentionally rich — `legalName`, `logo`,
 * `description`, and (when real) `sameAs` — so Google reads four distinct
 * commercial entities that happen to share a parent LLC, rather than four
 * mirrors of one site. Every value is derived from the brand's own config, so
 * it is correct per-site with no per-app drift.
 *
 * `origin` is the canonical, trailing-slash-free site origin (from each app's
 * `getSiteOrigin()`), kept as a parameter so this package stays free of
 * environment/runtime concerns.
 */
export function buildSiteJsonLd(brand: BrandConfig, origin: string): string {
  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: brand.name,
    url: `${origin}/`,
  };

  if (brand.legalName) organization.legalName = brand.legalName;
  if (brand.description) organization.description = brand.description;

  if (brand.logoPath) {
    const logoUrl = `${origin}${brand.logoPath}`;
    organization.logo = {
      '@type': 'ImageObject',
      '@id': `${origin}/#logo`,
      url: logoUrl,
      contentUrl: logoUrl,
    };
    // Reuse the logo as the entity's primary image (a common, valid pattern).
    organization.image = { '@id': `${origin}/#logo` };
  }

  // Only emit `sameAs` when there are REAL profile URLs — an empty or
  // fabricated sameAs is worse than none (dead links are a negative signal).
  const sameAs = (brand.social?.sameAs ?? []).filter((u) => typeof u === 'string' && u.length > 0);
  if (sameAs.length > 0) organization.sameAs = sameAs;

  const website: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: brand.name,
    url: `${origin}/`,
    publisher: { '@id': `${origin}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  if (brand.description) website.description = brand.description;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  });
}
