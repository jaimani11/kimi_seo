import { renderSitemapIndexXml } from '@adored/seo-routing/sitemap';
import { getSiteOrigin } from '@lib/site/origin';
import { sitemapSectionNames } from '@lib/site/sitemap-entries';

/**
 * /sitemap.xml — a sitemap INDEX referencing the per-section child sitemaps
 * (/sitemaps/{section}.xml). Search Console reports discovery per page-type.
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const base = getSiteOrigin();
  const xml = renderSitemapIndexXml(
    sitemapSectionNames().map((name) => ({ loc: `${base}/sitemaps/${name}.xml` })),
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
