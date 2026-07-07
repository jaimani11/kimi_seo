import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs';
import { SEO_CITIES, type SeoCity } from '@lib/seo/cities';
import { buildCitySeoLinks } from '@lib/seo/route-parser';
import { hasDestinationGuide } from '@lib/seo/destination-content';

/**
 * Shared shell for every programmatic SEO page. Wraps the page in
 * SiteHeader, breadcrumbs, the page-specific content (slot), and a
 * "Related pages" rail that auto-cross-links to other valid SEO
 * URLs for the same city — this is the internal-linking density
 * that compounds the long-tail SEO surface.
 */
export function SeoPageShell({
  city,
  breadcrumbs,
  /** The current page slug, so the related rail can skip it. */
  currentSlug,
  children,
}: {
  city: SeoCity;
  breadcrumbs: BreadcrumbItem[];
  currentSlug: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <Breadcrumbs items={breadcrumbs} />
      <main>{children}</main>
      <RelatedSeoLinks city={city} currentSlug={currentSlug} />
      <SiteFooter />
    </>
  );
}

function RelatedSeoLinks({ city, currentSlug }: { city: SeoCity; currentSlug: string }) {
  // Build the full set of SEO links for this city, filtered against
  // the page we're on. The shape mirrors enumerateAllSeoSlugs so every
  // page deep-links to every other valid SEO surface for this city —
  // internal-linking density that compounds long-tail authority.
  const links: { label: string; href: string }[] = [
    ...(hasDestinationGuide(city.slug)
      ? [{ label: `${city.name} travel guide`, href: `/destinations/${city.slug}` }]
      : []),
    ...buildCitySeoLinks(city),
  ].filter((l) => l.href !== `/${currentSlug}` && l.href !== `/destinations/${currentSlug}`);

  // Cross-link to 6 sibling cities in the same region so the link
  // graph clusters geographically.
  const siblings = SEO_CITIES.filter(
    (c) => c.region === city.region && c.slug !== city.slug,
  ).slice(0, 6);

  return (
    <section
      className="border-t"
      style={{
        background: 'var(--surface-raised)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                margin: 0,
                marginBottom: '0.8rem',
              }}
            >
              More for {city.name}
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.45rem 1rem',
              }}
            >
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.85rem',
                      color: 'var(--ink-secondary)',
                      textDecoration: 'none',
                    }}
                    className="hover:text-[color:var(--ink-primary)]"
                  >
                    {l.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {siblings.length > 0 ? (
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  margin: 0,
                  marginBottom: '0.8rem',
                }}
              >
                Nearby destinations
              </h2>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.45rem 1rem',
                }}
              >
                {siblings.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={
                        hasDestinationGuide(c.slug)
                          ? `/destinations/${c.slug}`
                          : `/things-to-do-in-${c.slug}`
                      }
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.85rem',
                        color: 'var(--ink-secondary)',
                        textDecoration: 'none',
                      }}
                      className="hover:text-[color:var(--ink-primary)]"
                    >
                      {c.name}, {c.countryName} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
