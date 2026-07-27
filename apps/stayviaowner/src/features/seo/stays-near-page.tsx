import Link from 'next/link';
import { type StaysNearPoi, siblingPois } from '@adored/seo-data';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * stayviaowner "Vacation rentals near {POI}" page — the VRBO/whole-home
 * angle of the stays-near matrix. Local to this app; the four brands render
 * distinct angles over the shared POI list so they don't duplicate.
 */

const HERO_BG = 'linear-gradient(135deg, #0f2340 0%, #1c3a63 55%, #37d0a1 220%)';
const MINT = '#37d0a1';

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
  if (poi.kind === 'airport') return `Vacation Rentals near ${poi.city.name} Airport`;
  if (poi.kind === 'city-centre') return `Vacation Rentals in Central ${poi.city.name}`;
  return `Vacation Rentals near ${poi.poiName}, ${poi.city.name}`;
}

export function vrboHref(poi: StaysNearPoi): string {
  return buildExpediaCategoryUrl('vacation-rentals', { destination: poi.searchQuery });
}

function lead(poi: StaysNearPoi): string {
  const { city } = poi;
  const seed = hashInt(`svo:${poi.poiSlug}:${city.slug}`);
  if (poi.kind === 'airport') {
    return pick(
      [
        `Need space near ${city.name} Airport for an early flight or a big group? Whole-home rentals here give you a kitchen and separate bedrooms — far more comfortable than a cramped airport hotel.`,
        `Vacation rentals near ${city.name} Airport, ${city.countryName} suit late arrivals and early departures: your own place, room to spread out, and self check-in at many homes on VRBO.`,
      ],
      seed,
    );
  }
  if (poi.kind === 'city-centre') {
    return pick(
      [
        `Rent a whole home in the heart of ${city.name} and live like a local — a kitchen, a living room, and the sights on your doorstep. Browse central ${city.name} vacation rentals on VRBO.`,
        `Central ${city.name}, ${city.countryName} is the most walkable base, and a whole-home rental beats a hotel room for space and value: ${city.oneLiner}`,
      ],
      seed,
    );
  }
  const blurb = poi.blurb ? ` ${poi.blurb}` : '';
  return pick(
    [
      `${poi.poiName} is a favourite ${city.name} neighbourhood to call home for a few nights.${blurb} Browse whole-home vacation rentals near ${poi.poiName} on VRBO — kitchens and space for the group.`,
      `Stay like a local in ${poi.poiName}, ${city.name} — a villa, apartment or house of your own.${blurb} VRBO lists whole-home rentals for the neighbourhood with real photos and guest reviews.`,
    ],
    seed,
  );
}

function faqs(poi: StaysNearPoi): { q: string; a: string }[] {
  const where = poi.kind === 'airport' ? `near ${poi.city.name} Airport` : poi.kind === 'city-centre' ? `in central ${poi.city.name}` : `in ${poi.poiName}`;
  return [
    {
      q: `Is a vacation rental ${where} better than a hotel?`,
      a: `For families, groups or stays of several nights, a whole-home rental ${where} usually wins — you get a kitchen, separate bedrooms and more space for the money. For a quick solo night, a hotel can be simpler. Compare both before booking.`,
    },
    {
      q: `How far ahead should I book a rental ${where}?`,
      a: `The best whole homes ${where} go first for peak dates — book 2–4 months ahead for summer and holidays. VRBO's free-cancellation listings let you lock in a place early and adjust if plans change.`,
    },
  ];
}

export function StaysNearPage({ poi }: { poi: StaysNearPoi }) {
  const { city } = poi;
  const siblings = siblingPois(poi);
  const heading = poiHeading(poi);
  const href = vrboHref(poi);
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
                <li><Link href={`/rentals/${city.slug}`} style={{ color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }}>{city.name}</Link></li>
                <span aria-hidden>/</span>
                <li style={{ color: '#fff', fontWeight: 600 }}>{poi.poiName}</li>
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>{city.countryName} · Whole-home rentals on VRBO</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              {heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '46rem', margin: '1rem 0 0' }}>
              {lead(poi)}
            </p>
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                Search rentals on VRBO →
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
              <h2 style={h2Style}>Why rent a whole home {poi.kind === 'airport' ? `near ${city.name} Airport` : poi.kind === 'city-centre' ? `in central ${city.name}` : `in ${poi.poiName}`}?</h2>
              <p className="mt-4" style={bodyStyle}>
                {poi.blurb
                  ? `${poi.blurb} A whole-home rental here means a kitchen, more space and better value for groups — VRBO lists villas, apartments and houses for the area.`
                  : `${city.oneLiner} A whole-home rental keeps you close to it all with space a hotel room can't match — VRBO's ${city.name} inventory runs from budget apartments to luxury villas.`}
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

export function buildStaysNearJsonLd({ poi, canonical }: { poi: StaysNearPoi; canonical: string }): string {
  const origin = canonical.replace(/\/stays-near\/.*$/, '');
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: '/' },
      { name: poi.city.name, url: `/rentals/${poi.city.slug}` },
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
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: MINT, color: '#0a1930', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(55,208,161,0.7)' };
