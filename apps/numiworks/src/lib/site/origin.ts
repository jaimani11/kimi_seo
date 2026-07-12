import { NUMIWORKS } from '@adored/brand-config';

/**
 * Resolve the canonical origin (scheme + host) for the live site.
 *
 *   - `NEXT_PUBLIC_SITE_URL` env wins when set (per-environment
 *     override, e.g. a staging domain).
 *   - The brand's configured production siteUrl is the default.
 *   - Localhost only in NODE_ENV=development.
 *
 * VERCEL_URL is deliberately NOT consulted: deployment URLs must
 * never leak into canonicals, sitemaps, JSON-LD, or OpenGraph.
 * No trailing slash. Pair with path strings via `${origin}/path`.
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.length > 0) return stripTrailing(explicit);
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return stripTrailing(NUMIWORKS.siteUrl);
}

function stripTrailing(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

/** Build a canonical absolute URL for a path on this site. */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}

/**
 * Sitewide JSON-LD: Organization + WebSite entities for the knowledge graph
 * and the sitelinks search box. Rendered once in the root layout <head>.
 * Built from the brand's own name + canonical origin, so it stays correct
 * per-site and copies verbatim to new ones.
 */
export function siteJsonLd(): string {
  const origin = getSiteOrigin();
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: NUMIWORKS.name,
        url: `${origin}/`,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: NUMIWORKS.name,
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
      },
    ],
  });
}
