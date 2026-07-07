import type { MetadataRoute } from 'next';

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
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
