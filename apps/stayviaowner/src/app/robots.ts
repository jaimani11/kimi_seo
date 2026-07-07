import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@lib/site/origin';

function siteUrl(): string {
  // Delegates to the canonical origin resolver - VERCEL_URL must
  // never leak into robots/sitemap/canonical output.
  return getSiteOrigin();
}

/**
 * robots.txt - allow the marketing surface, disallow share-link slugs
 * (unguessable + meant for direct sharing, not crawling) and the API
 * routes (no SEO value, just noise).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/destinations', '/destinations/'],
        disallow: ['/api/', '/t/'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
