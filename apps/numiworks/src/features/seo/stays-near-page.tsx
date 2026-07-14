import Link from 'next/link';
import { type StaysNearPoi, siblingPois } from '@adored/seo-data';
import { buildViatorStaySearchUrl, getViatorStayLinkConfig } from '@lib/affiliate/viator-stay-link-builder';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * numiworks "Where to stay & what to do near {POI}" page — the dual
 * homes+experiences angle of the stays-near matrix. numiworks pairs VRBO
 * whole homes with Viator experiences (its differentiator vs the pure-
 * accommodation siblings), so both CTAs appear. Local to numiworks.
 */

const HERO_BG = 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)';

function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
function pick<T>(arr: readonly T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length] as T;
}

export function poiHeading(poi: StaysNearPoi): string {
  if (poi.kind === 'airport') return `Near ${poi.city.name} Airport: Where to Stay`;
  if (poi.kind === 'city-centre') return `Central ${poi.city.name}: Where to Stay & What to Do`;
  return `${poi.poiName}, ${poi.city.name}: Where to Stay & What to Do`;
}

/** VRBO whole-home link (deep-link-template aware; falls back to the tracked shortlink). */
export function vrboHref(poi: StaysNearPoi): string {
  const target = `https://www.vrbo.com/search/keywords:${encodeURIComponent(poi.searchQuery)}`;
  const template = process.env.NEXT_PUBLIC_VRBO_DEEPLINK_TEMPLATE;
  if (template && template.includes('{TARGET}')) return template.replace('{TARGET}', encodeURIComponent(target));
  return process.env.NEXT_PUBLIC_VRBO_SHORTLINK || 'https://vrbo.com/affiliate/zVJTNin';
}

export function viatorHref(poi: StaysNearPoi): string {
  return buildViatorStaySearchUrl({ destination: poi.searchQuery }, getViatorStayLinkConfig());
}

function lead(poi: StaysNearPoi): string {
  const { city } = poi;
  const seed = hashInt(`numi:${poi.poiSlug}:${city.slug}`);
  if (poi.kind === 'airport') {
    return pick(
      [
        `Arriving or leaving via ${city.name} Airport? Book a whole home nearby for space and an easy transfer, and line up a tour or two on Viator for the hours in between.`,
        `Stays near ${city.name} Airport, ${city.countryName} keep travel days simple — a home of your own on VRBO, plus things to do close by on Viator when you have time to spare.`,
      ],
      seed,
    );
  }
  if (poi.kind === 'city-centre') {
    return pick(
      [
        `Base yourself in central ${city.name}: a whole home puts the sights on your doorstep, and Viator has the tours, tickets and day trips to fill your days. ${city.oneLiner}`,
        `Central ${city.name}, ${city.countryName} is the easiest place to stay AND explore — rent a home on VRBO and book experiences on Viator, all within walking distance.`,
      ],
      seed,
    );
  }
  const blurb = poi.blurb ? ` ${poi.blurb}` : '';
  return pick(
    [
      `${poi.poiName} is a great ${city.name} base for both.${blurb} Rent a whole home near ${poi.poiName} on VRBO, then book tours and experiences nearby on Viator — the trip planned end to end.`,
      `Stay in ${poi.poiName}, ${city.name} and have the neighbourhood to explore.${blurb} VRBO for a home of your own; Viator for the things to do right around the corner.`,
    ],
    seed,
  );
}

function faqs(poi: StaysNearPoi): { q: string; a: string }[] {
  const where = poi.kind === 'airport' ? `near ${poi.city.name} Airport` : poi.kind === 'city-centre' ? `in central ${poi.city.name}` : `in ${poi.poiName}`;
  return [
    {
      q: `What's the best area to stay ${where}?`,
      a: `Staying ${where} keeps you close to the action with a whole home's worth of space. Browse VRBO rentals for the area, and use Viator to see which tours and attractions are within easy reach before you pick your spot.`,
    },
    {
      q: `What is there to do ${where}?`,
      a: `Plenty — Viator lists tours, tickets, food experiences and day trips ${where} and across ${poi.city.name}. Book the big-ticket experiences ahead (they sell out), and leave room for the neighbourhood finds you'll make on foot.`,
    },
  ];
}

export function StaysNearPage({ poi }: { poi: StaysNearPoi }) {
  const { city } = poi;
  const siblings = siblingPois(poi);
  const heading = poiHeading(poi);
  const vrbo = vrboHref(poi);
  const viator = viatorHref(poi);
  const pageFaqs = faqs(poi);

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <nav aria-label="Breadcrumb">
              <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)' }}>
                <li><Link href="/" style={{ color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }}>Home</Link></li>
                <span aria-hidden>/</span>
                <li><Link href={`/destinations/${city.slug}`} style={{ color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }}>{city.name}</Link></li>
                <span aria-hidden>/</span>
                <li style={{ color: '#fff', fontWeight: 600 }}>{poi.poiName}</li>
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>{city.countryName} · Homes on VRBO + tours on Viator</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.9rem, 4.6vw, 3rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.08, margin: 0 }}>
              {heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '46rem', margin: '1rem 0 0' }}>
              {lead(poi)}
            </p>
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={vrbo} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                🏡 Browse homes on VRBO →
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
              <h2 style={h2Style}>Why base yourself {poi.kind === 'airport' ? `near ${city.name} Airport` : poi.kind === 'city-centre' ? `in central ${city.name}` : `in ${poi.poiName}`}?</h2>
              <p className="mt-4" style={bodyStyle}>
                {poi.blurb
                  ? `${poi.blurb} It's a smart base for a mix of downtime and exploring — a whole home from VRBO for space, and Viator's tours and tickets for everything worth seeing nearby.`
                  : `${city.oneLiner} Stay in a whole home for room to breathe, and let Viator handle the experiences — numiworks' AI concierge can weave both into a day-by-day plan.`}
              </p>

              <h2 className="mt-10" style={h2Style}>Common questions</h2>
              <div className="mt-5 space-y-3">
                {pageFaqs.map((f) => (
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
                    <p style={cardHeadingStyle}>More areas in {city.name}</p>
                    <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
                      {siblings.map((s) => (
                        <li key={s.poiSlug}>
                          <Link href={`/stays-near/${s.poiSlug}-in-${city.slug}`} style={sideLinkStyle}>{poiHeading(s)}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={cardStyle}>
                  <p style={cardHeadingStyle}>Plan your {city.name} trip</p>
                  <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
                    <li><Link href={`/destinations/${city.slug}`} style={sideLinkStyle}>{city.name} travel guide</Link></li>
                    <li><Link href="/plan" style={sideLinkStyle}>Plan this trip with AI →</Link></li>
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

export function buildStaysNearJsonLd({ poi, canonical }: { poi: StaysNearPoi; canonical: string }): string {
  const origin = canonical.replace(/\/stays-near\/.*$/, '');
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: '/' },
      { name: poi.city.name, url: `/destinations/${poi.city.slug}` },
      { name: poi.poiName, url: canonical },
    ].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url.startsWith('http') ? it.url : `${origin}${it.url}` })),
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs(poi).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
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
