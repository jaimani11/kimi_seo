import { renderSitemapXml } from '@adored/seo-routing/sitemap';
import buildSitemapEntries from '@lib/site/sitemap-entries';

/**
 * /sitemap.xml — a single FLAT urlset listing every canonical URL directly.
 *
 * Reverted from the sitemap-index split (which pointed /sitemap.xml at
 * /sitemaps/{section}.xml children). The total URL count is well under the
 * 50,000-per-file limit, so a flat sitemap is valid and gives Google the
 * simplest, most reliable discovery path — no index → child traversal. It also
 * carries the human-friendly XSL stylesheet (renderSitemapXml), so the file is
 * readable in a browser. The /sitemaps/{section}.xml child routes stay live.
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const xml = renderSitemapXml(buildSitemapEntries());
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
