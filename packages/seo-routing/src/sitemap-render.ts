/**
 * Human-friendly sitemap rendering.
 *
 * Next's MetadataRoute sitemap emits bare XML, which browsers show as
 * a raw document tree with a "no style information" banner — correct
 * for crawlers, alarming for humans. These helpers let each app serve
 * the SAME entries as XML with an `xml-stylesheet` processing
 * instruction pointing at /sitemap.xsl, so the browser renders a
 * readable table while Google/Bing parse the XML unchanged.
 */

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Render entries as sitemap XML with the stylesheet PI attached. */
export function renderSitemapXml(entries: readonly SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const lastmod = e.lastModified
        ? `\n    <lastmod>${
            e.lastModified instanceof Date
              ? e.lastModified.toISOString()
              : esc(String(e.lastModified))
          }</lastmod>`
        : '';
      const freq = e.changeFrequency
        ? `\n    <changefreq>${e.changeFrequency}</changefreq>`
        : '';
      const prio =
        typeof e.priority === 'number'
          ? `\n    <priority>${e.priority}</priority>`
          : '';
      return `  <url>\n    <loc>${esc(e.url)}</loc>${lastmod}${freq}${prio}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export interface SitemapIndexChild {
  /** Absolute URL of the child sitemap. */
  loc: string;
  /** Only set when grounded in a real content-modification date. */
  lastmod?: string | Date;
}

/**
 * Render a sitemap INDEX that references child sitemaps. No stylesheet PI — an
 * index is a machine artifact; the child urlsets carry the human-friendly
 * stylesheet. Valid per sitemaps.org.
 */
export function renderSitemapIndexXml(children: readonly SitemapIndexChild[]): string {
  const items = children
    .map((c) => {
      const lastmod = c.lastmod
        ? `\n    <lastmod>${
            c.lastmod instanceof Date ? c.lastmod.toISOString() : esc(String(c.lastmod))
          }</lastmod>`
        : '';
      return `  <sitemap>\n    <loc>${esc(c.loc)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

/**
 * The stylesheet browsers apply when a human opens /sitemap.xml.
 * Crawlers ignore it entirely.
 */
export const SITEMAP_XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <title>XML Sitemap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f2340; margin: 0; background: #f6f8fa; }
          header { background: #0f2340; color: #fff; padding: 1.5rem 2rem; }
          header h1 { margin: 0; font-size: 1.35rem; font-weight: 700; }
          header p { margin: 0.35rem 0 0; font-size: 0.85rem; opacity: 0.85; }
          main { max-width: 72rem; margin: 0 auto; padding: 1.5rem 2rem 3rem; }
          table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 0.5rem; overflow: hidden; box-shadow: 0 1px 3px rgba(15,35,64,0.08); }
          th { text-align: left; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; padding: 0.75rem 1rem; border-bottom: 2px solid #e2e8f0; }
          td { padding: 0.55rem 1rem; border-bottom: 1px solid #eef2f6; font-size: 0.85rem; }
          tr:hover td { background: #f0fdf9; }
          a { color: #0b62d6; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .num { color: #94a3b8; font-variant-numeric: tabular-nums; }
        </style>
      </head>
      <body>
        <header>
          <h1>XML Sitemap</h1>
          <p>
            <xsl:value-of select="count(sm:urlset/sm:url)"/> URLs ·
            This file tells search engines which pages to crawl. The
            styled view is for humans; crawlers read the raw XML.
          </p>
        </header>
        <main>
          <table>
            <tr><th>#</th><th>URL</th><th>Last modified</th><th>Change freq</th><th>Priority</th></tr>
            <xsl:for-each select="sm:urlset/sm:url">
              <tr>
                <td class="num"><xsl:value-of select="position()"/></td>
                <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                <td class="num"><xsl:value-of select="substring(sm:lastmod, 1, 10)"/></td>
                <td><xsl:value-of select="sm:changefreq"/></td>
                <td class="num"><xsl:value-of select="sm:priority"/></td>
              </tr>
            </xsl:for-each>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;
