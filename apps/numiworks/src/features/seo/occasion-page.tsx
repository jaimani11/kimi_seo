import Link from 'next/link';
import { type OccasionRoute, siblingOccasions } from '@adored/seo-data';
import { buildVrboSearchUrl } from '@lib/affiliate/vrbo-link';
import { buildViatorStaySearchUrl, getViatorStayLinkConfig } from '@lib/affiliate/viator-stay-link-builder';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * numiworks occasion / celebration page — the homes + experiences angle
 * ("Plan a Bachelorette Party in Nashville"), VRBO for the stay + Viator for
 * the things to do. Discovery-only: indexable + in the sitemap, not linked
 * from nav/homepage. Local to numiworks so the four brands don't duplicate.
 */

const HERO_BG = 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)';

export function occasionHeading(route: OccasionRoute): string {
  return `Plan a ${route.occasion.name} in ${route.city.name}`;
}

export function vrboHref(route: OccasionRoute): string {
  return buildVrboSearchUrl(`${route.city.name}, ${route.city.countryName}`);
}

export function viatorHref(route: OccasionRoute): string {
  return buildViatorStaySearchUrl({ destination: `${route.city.name}, ${route.city.countryName}` }, getViatorStayLinkConfig());
}

function lead(route: OccasionRoute): string {
  const { occasion, city } = route;
  if (occasion.vibe === 'romantic') {
    return `Planning a ${occasion.name.toLowerCase()} in ${city.name}? Book a private whole-home rental on VRBO for the setting, then line up the experiences — a tasting, a sunset sail, a private tour — on Viator. ${occasion.tagline}`;
  }
  return `Planning a ${occasion.name.toLowerCase()} in ${city.name}? Get the group one whole home on VRBO (room for ~${occasion.groupSize}, a kitchen, a place to gather), then book the fun — tours, tastings, activities — on Viator. ${occasion.tagline}`;
}

export function OccasionPage({ route }: { route: OccasionRoute }) {
  const { occasion, city } = route;
  const heading = occasionHeading(route);
  const vrbo = vrboHref(route);
  const viator = viatorHref(route);
  const siblings = siblingOccasions(route);
  const cityFaq = {
    q: `What should we do for a ${occasion.name.toLowerCase()} in ${city.name}?`,
    a: `${city.oneLiner} Book the big-ticket experiences ahead on Viator (they sell out), keep a whole-home rental as your base so the group stays together, and leave room for the spots you'll find on foot.`,
  };
  const faqs = [...occasion.faqs, cityFaq];

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <p style={eyebrowStyle}>{city.countryName} · Homes on VRBO + tours on Viator</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              <span aria-hidden style={{ marginRight: '0.5rem' }}>{occasion.emoji}</span>{heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '48rem', margin: '1rem 0 0' }}>
              {lead(route)}
            </p>
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={vrbo} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                🏡 Group rentals on VRBO →
              </a>
              <a href={viator} target="_blank" rel="sponsored nofollow noopener noreferrer" style={secondaryCtaStyle}>
                🎟️ Things to do on Viator
              </a>
            </div>
            <p className="mt-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0.75rem 0 0' }}>
              Affiliate links · prices may change · the price you pay is the same.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 style={h2Style}>Planning a {occasion.name.toLowerCase()} in {city.name}</h2>
              <p className="mt-4" style={bodyStyle}>
                {occasion.vibe === 'romantic'
                  ? `${city.oneLiner} Rent a place with a view or a private terrace on VRBO, and let Viator handle the experiences worth planning ahead — numiworks' AI concierge can weave the stay and the itinerary into a day-by-day plan.`
                  : `${city.oneLiner} One whole home on VRBO keeps the group together and beats a row of hotel rooms; Viator covers the activities that make the trip. numiworks' AI concierge can plan the whole thing around your dates and group.`}
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
                    <li><Link href="/plan" style={sideLinkStyle}>Plan this trip with AI →</Link></li>
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
      { name: city.name, url: `/destinations/${city.slug}` },
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
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#FBC700', color: '#0A2B45', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(251,199,0,0.6)' };
const secondaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.14)', color: '#fff', fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 700, padding: '0.9rem 1.4rem', borderRadius: '999px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' };
