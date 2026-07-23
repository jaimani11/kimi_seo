import Link from 'next/link';
import { type StaysNearPoi, siblingPois } from '@adored/seo-data';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * gotript "Stays near {POI}" page — the Expedia-angle version of the
 * stays-near matrix. gotript is the Expedia multi-vertical brand, so the
 * frame is "stays" (hotels + vacation rentals) and CTAs go to Expedia.
 * Local to gotript so the four brands' stays-near pages don't duplicate.
 */

const HERO_BG = 'linear-gradient(135deg, #3a2140 0%, #4a2c4d 100%)';

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
  if (poi.kind === 'airport') return `Hotels near ${poi.city.name} Airport`;
  if (poi.kind === 'city-centre') return `Where to Stay in Central ${poi.city.name}`;
  return `Stays near ${poi.poiName}, ${poi.city.name}`;
}

export function expediaHref(poi: StaysNearPoi): string {
  return buildExpediaCategoryUrl('hotels', { destination: poi.searchQuery });
}

function lead(poi: StaysNearPoi): string {
  const { city } = poi;
  const seed = hashInt(`gotript:${poi.poiSlug}:${city.slug}`);
  if (poi.kind === 'airport') {
    return pick(
      [
        `Landing in ${city.name}? Book a stay near ${city.name} Airport for a stress-free first or last night — quick transfers and Expedia's hotels + rentals side by side, so you can compare in one place.`,
        `Stays near ${city.name} Airport, ${city.countryName} keep your arrival simple: browse hotels and apartments on Expedia, filter by shuttle and free cancellation, and lock in a rate before you fly.`,
      ],
      seed,
    );
  }
  if (poi.kind === 'city-centre') {
    return pick(
      [
        `The easiest base for a first trip to ${city.name} is right in the middle. Compare central ${city.name} hotels and vacation rentals on Expedia — one search across every stay type.`,
        `Central ${city.name}, ${city.countryName} puts the sights on your doorstep: ${city.oneLiner} Expedia lists hotels, apartments and homes here in one place.`,
      ],
      seed,
    );
  }
  const blurb = poi.blurb ? ` ${poi.blurb}` : '';
  return pick(
    [
      `${poi.poiName} is a favourite place to stay in ${city.name}.${blurb} Compare hotels and vacation rentals near ${poi.poiName} on Expedia — real reviews, live prices, free cancellation on most stays.`,
      `Base yourself in ${poi.poiName}, ${city.name} and wake up where you want to be.${blurb} Expedia shows hotels, apartments and homes for the neighbourhood in a single search.`,
    ],
    seed,
  );
}

function faqs(poi: StaysNearPoi): { q: string; a: string }[] {
  const where = poi.kind === 'airport' ? `near ${poi.city.name} Airport` : poi.kind === 'city-centre' ? `in central ${poi.city.name}` : `in ${poi.poiName}`;
  return [
    {
      q: `Hotel or vacation rental ${where} — which is better?`,
      a: `For 1–2 nights a hotel ${where} is simplest; for longer stays or groups, a vacation rental with a kitchen usually wins on space and value. Expedia lists both side by side so you can compare price and reviews before deciding.`,
    },
    {
      q: `How do I get the best rate ${where}?`,
      a: `Set your dates, sort by guest rating, and check Expedia's member prices and bundle-with-flight deals — they often beat the first listing. Free cancellation on most stays lets you book early and adjust later.`,
    },
  ];
}

export function StaysNearPage({ poi }: { poi: StaysNearPoi }) {
  const { city } = poi;
  const siblings = siblingPois(poi);
  const heading = poiHeading(poi);
  const href = expediaHref(poi);
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

            <p className="mt-6" style={eyebrowStyle}>{city.countryName} · Stays via Expedia</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              {heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '46rem', margin: '1rem 0 0' }}>
              {lead(poi)}
            </p>
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                Search stays on Expedia →
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
              <h2 style={h2Style}>Why stay {poi.kind === 'airport' ? `near ${city.name} Airport` : poi.kind === 'city-centre' ? `in central ${city.name}` : `in ${poi.poiName}`}?</h2>
              <p className="mt-4" style={bodyStyle}>
                {poi.blurb
                  ? `${poi.blurb} It's a convenient base for exploring ${city.name}, and Expedia lists hotels, apartments and vacation homes here in one search.`
                  : `${city.oneLiner} Staying here keeps you close to everything, with Expedia's full range of ${city.name} hotels and rentals — budget to luxury — a click away.`}
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
                    <li><a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={sideLinkStyle}>All {city.name} stays on Expedia →</a></li>
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
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#4a2c4d', color: '#ffffff', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '0.5rem', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(74,44,77,0.5)' };
