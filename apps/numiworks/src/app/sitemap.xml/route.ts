import { renderSitemapXml } from '@adored/seo-routing/sitemap';
import buildSitemapEntries from '@lib/site/sitemap-entries';

/**
 * /sitemap.xml — same entries Next's MetadataRoute produced, plus an
 * xml-stylesheet PI so humans opening the URL see a styled table
 * (crawlers parse the XML unchanged).
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const xml = renderSitemapXml(buildSitemapEntries());
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
