import Link from 'next/link';
import { type OccasionRoute, siblingOccasions } from '@adored/seo-data';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * stayviaowner occasion / celebration page — the whole-home group-rental angle
 * ("Bachelorette Party Rentals in Nashville"). Group + celebration travel is
 * exactly where whole homes beat hotel-room blocks, so this is a natural fit.
 *
 * Discovery-only: indexable + in the sitemap, but NOT linked from nav/homepage
 * (the party angle shouldn't sit on the family-facing brand surface). Same
 * content to users and crawlers — orphaned by design, found via search.
 */

const HERO_BG = 'linear-gradient(135deg, #0f2340 0%, #1c3a63 55%, #37d0a1 220%)';
const MINT = '#37d0a1';

export function occasionHeading(route: OccasionRoute): string {
  return `${route.occasion.name} Rentals in ${route.city.name}`;
}

/** VRBO whole-home search for the city, sized for the group. */
export function vrboHref(route: OccasionRoute): string {
  return buildExpediaCategoryUrl('vacation-rentals', {
    destination: `${route.city.name}, ${route.city.countryName}`,
    adults: route.occasion.groupSize,
  });
}

function lead(route: OccasionRoute): string {
  const { occasion, city } = route;
  const g = occasion.groupSize;
  if (occasion.vibe === 'romantic') {
    return `Planning a ${occasion.name.toLowerCase()} in ${city.name}? A private whole-home rental gives you the space, the setting and the privacy a hotel room can't — your own place in ${city.name}, ${city.countryName}. ${occasion.tagline}`;
  }
  return `Planning a ${occasion.name.toLowerCase()} in ${city.name}? Rent one whole home for the group — room for ~${g}, a kitchen for getting ready, and a living room to make it a proper celebration. Far better (and often cheaper per person) than a block of hotel rooms. ${occasion.tagline}`;
}

export function OccasionPage({ route }: { route: OccasionRoute }) {
  const { occasion, city } = route;
  const heading = occasionHeading(route);
  const href = vrboHref(route);
  const siblings = siblingOccasions(route);
  const cityFaq = {
    q: `Where should we stay for a ${occasion.name.toLowerCase()} in ${city.name}?`,
    a: `Pick a central, walkable neighbourhood in ${city.name} so you're close to the restaurants and nightlife and can skip the cabs. ${city.oneLiner} Filter VRBO by bedrooms, bathrooms and guest score, and read the house rules before you book.`,
  };
  const faqs = [...occasion.faqs, cityFaq];

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <p style={eyebrowStyle}>{city.countryName} · Whole-home rentals on VRBO</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              <span aria-hidden style={{ marginRight: '0.5rem' }}>{occasion.emoji}</span>{heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '48rem', margin: '1rem 0 0' }}>
              {lead(route)}
            </p>
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                Find {city.name} group rentals on VRBO →
              </a>
            </div>
            <p className="mt-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0.75rem 0 0' }}>
              Affiliate link · prices may change · the price you pay is the same.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 style={h2Style}>Why a whole home for a {occasion.name.toLowerCase()} in {city.name}?</h2>
              <p className="mt-4" style={bodyStyle}>
                {occasion.vibe === 'romantic'
                  ? `A private rental in ${city.name} means the setting is yours — a terrace, a view, a kitchen for a slow morning — with none of the hotel-corridor bustle. ${city.oneLiner} VRBO lists everything from boutique apartments to standout villas here.`
                  : `One house keeps the whole group together in ${city.name}: a kitchen and living room to gather, enough bedrooms and bathrooms, and often a pool or outdoor space. It's the difference between a scattered weekend and a proper ${occasion.name.toLowerCase()}. ${city.oneLiner}`}
              </p>

              <h2 className="mt-10" style={h2Style}>Common questions</h2>
              <div className="mt-5 space-y-3">
                {faqs.map((f) => (
                  <details key={f.q} style={faqStyle}>
                    <summary style={{ fontFamily: 'var(--font-inter)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink-primary)', cursor: 'pointer' }}>{f.q}</summary>
                    <p style={{ margin: '0.7rem 0 0', fontFamily: 'var(--font-inter)', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-secondary)' }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <aside>
              <div style={{ position: 'sticky', top: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                {siblings.length > 0 && (
                  <div style={cardStyle}>
                    <p style={cardHeadingStyle}>More {city.name} getaways</p>
                    <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
                      {siblings.map((s) => (
                        <li key={s.occasion.slug}>
                          <Link href={`/celebrations/${s.occasion.slug}-in-${city.slug}`} style={sideLinkStyle}>
                            <span aria-hidden style={{ marginRight: '0.4rem' }}>{s.occasion.emoji}</span>{s.occasion.name} in {city.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={cardStyle}>
                  <p style={cardHeadingStyle}>Plan your {city.name} trip</p>
                  <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
                    <li><Link href={`/rentals/${city.slug}`} style={sideLinkStyle}>All vacation rentals in {city.name}</Link></li>
                    <li><Link href={`/destinations/${city.slug}`} style={sideLinkStyle}>{city.name} travel guide</Link></li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export function buildOccasionJsonLd({ route, canonical }: { route: OccasionRoute; canonical: string }): string {
  const { occasion, city } = route;
  const origin = canonical.replace(/\/celebrations\/.*$/, '');
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: '/' },
      { name: city.name, url: `/rentals/${city.slug}` },
      { name: occasion.name, url: canonical },
    ].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url.startsWith('http') ? it.url : `${origin}${it.url}` })),
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: occasion.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return JSON.stringify([breadcrumb, faqPage]);
}

const eyebrowStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontWeight: 700, margin: 0 };
const bodyStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1rem', lineHeight: 1.7, color: 'var(--ink-secondary)', margin: 0 };
const h2Style: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink-primary)', margin: 0 };
const faqStyle: React.CSSProperties = { borderRadius: '0.6rem', border: '1px solid var(--border-subtle)', padding: '0.95rem 1.15rem', background: 'var(--surface-overlay)' };
const cardStyle: React.CSSProperties = { borderRadius: '0.85rem', border: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)', padding: '1.1rem 1.25rem' };
const cardHeadingStyle: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-inter)', fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)' };
const sideLinkStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--ink-secondary)', textDecoration: 'none' };
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: MINT, color: '#0a1930', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(55,208,161,0.7)' };
