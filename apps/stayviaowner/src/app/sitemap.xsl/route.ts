import { SITEMAP_XSL } from '@adored/seo-routing/sitemap';

/** Stylesheet applied by browsers rendering /sitemap.xml for humans. */
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  return new Response(SITEMAP_XSL, {
    headers: { 'Content-Type': 'text/xsl; charset=utf-8' },
  });
}
