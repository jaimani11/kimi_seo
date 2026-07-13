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
      {
        // GoogleOther is Google's *non-search* crawler (product/R&D). It does
        // NOT affect Google Search indexing — that's Googlebot — but it was
        // ~95% of crawl volume (240k+ req/12h), and every hit is a billed
        // edge+function invocation because these pages render dynamically.
        // Blocking it cuts cost dramatically with zero SEO impact.
        userAgent: ['GoogleOther', 'GoogleOther-Image', 'GoogleOther-Video'],
        disallow: ['/'],
      },
      {
        // Third-party SEO/backlink scrapers — no value to us, pure request cost.
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'DataForSeoBot'],
        disallow: ['/'],
      },
      {
        // Search crawlers for markets we don't serve (English/Western travel
        // audience via Viator/Booking/Expedia). Baidu = China, Bytespider =
        // ByteDance/TikTok. High volume, ~zero value here; blocking trims crawl
        // cost without touching Google/Bing/AI-search visibility.
        userAgent: ['Baiduspider', 'Bytespider'],
        disallow: ['/'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
