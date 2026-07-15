import { renderSitemapXml } from '@adored/seo-routing/sitemap';
import { sitemapSectionEntries } from '@lib/site/sitemap-entries';

/**
 * /sitemaps/{section}.xml — one child sitemap (a urlset) per named section.
 * Unknown sections 404. Same human-friendly stylesheet as before.
 */
export const revalidate = 3600;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ section: string }> },
): Promise<Response> {
  const { section } = await ctx.params;
  const name = section.replace(/\.xml$/, '');
  const entries = sitemapSectionEntries(name);
  if (!entries) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(renderSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
