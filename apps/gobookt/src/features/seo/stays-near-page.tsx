import Link from 'next/link';
import { type StaysNearPoi, siblingPois } from '@adored/seo-data';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

/**
 * gobookt "Hotels near {POI}" page — the Booking.com-angle version of the
 * stays-near matrix (hotala's core SEO play). Booking.com is gobookt's only
 * provider, so every CTA routes through /api/go/booking (CJ-tracked). This
 * is the HOTEL angle; sibling brands render homes/rentals/experiences angles
 * over the same POI list, so the four don't duplicate.
 *
 * Content is data-backed (real neighborhood + city facts) and deterministically
 * varied (no Math.random — would break static generation).
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
  if (poi.kind === 'airport') return `Hotels near ${poi.city.name} Airport`;
  if (poi.kind === 'city-centre') return `Hotels in Central ${poi.city.name}`;
  return `Hotels near ${poi.poiName}, ${poi.city.name}`;
}

/** Booking.com hotel-search CTA for the POI (CJ-tracked via /api/go/booking). */
export function bookingHref(poi: StaysNearPoi): string {
  const params = new URLSearchParams({ category: 'hotels', destination: poi.searchQuery });
  return `/api/go/booking?${params.toString()}`;
}

function lead(poi: StaysNearPoi): string {
  const { city } = poi;
  const seed = hashInt(`gobookt:${poi.poiSlug}:${city.slug}`);
  if (poi.kind === 'airport') {
    return pick(
      [
        `Flying into ${city.name}? Book a hotel near ${city.name} Airport for an easy first or last night — short transfers, early check-outs handled, and shuttle options at many properties.`,
        `Hotels near ${city.name} Airport, ${city.countryName} are built for travellers on the move: quick access to the terminal, 24-hour desks, and rates that beat scrambling for a room on arrival.`,
      ],
      seed,
    );
  }
  if (poi.kind === 'city-centre') {
    return pick(
      [
        `Stay in the middle of it all. Central ${city.name} hotels put the main sights, restaurants and transport on your doorstep — the most walkable base for a first visit.`,
        `Hotels in central ${city.name}, ${city.countryName} keep you close to everything: ${city.oneLiner}`,
      ],
      seed,
    );
  }
  const blurb = poi.blurb ? ` ${poi.blurb}` : '';
  return pick(
    [
      `${poi.poiName} is one of ${city.name}'s most-loved areas to stay.${blurb} Compare hotels near ${poi.poiName} on Booking.com — real guest reviews, live prices and free cancellation on most rooms.`,
      `Book a hotel in ${poi.poiName}, ${city.name} and wake up right where you want to be.${blurb} Browse live Booking.com rates and availability for the neighbourhood.`,
    ],
    seed,
  );
}

function faqs(poi: StaysNearPoi): { q: string; a: string }[] {
  const where = poi.kind === 'airport' ? `near ${poi.city.name} Airport` : poi.kind === 'city-centre' ? `in central ${poi.city.name}` : `in ${poi.poiName}`;
  return [
    {
      q: `Are hotels ${where} expensive?`,
      a: `Prices ${where} span budget to luxury. Booking.com shows live rates across the range with free cancellation on most rooms, so you can compare before you commit — filter by price, guest score and star rating to fit your budget.`,
    },
    {
      q: `How do I find the best hotel deal ${where}?`,
      a: `Set your dates, then sort by "top reviewed" and check the map view to balance price against how close you are. Booking.com's Genius rates and last-minute price drops often beat the first result you see.`,
    },
  ];
}

export function StaysNearPage({ poi }: { poi: StaysNearPoi }) {
  const { city } = poi;
  const siblings = siblingPois(poi);
  const heading = poiHeading(poi);
  const href = bookingHref(poi);
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

            <p className="mt-6" style={eyebrowStyle}>{city.countryName} · Hotels via Booking.com</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              {heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '46rem', margin: '1rem 0 0' }}>
              {lead(poi)}
            </p>
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                Search hotels on Booking.com →
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
                  ? `${poi.blurb} It's an easy base for exploring ${city.name}, and Booking.com lists everything from budget rooms to boutique stays here.`
                  : `${city.oneLiner} A hotel here keeps you close to the action, with Booking.com's full range of ${city.name} stays — budget to luxury — a click away.`}
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
                    <li><a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={sideLinkStyle}>All {city.name} hotels on Booking.com →</a></li>
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

/** Breadcrumb + FAQ JSON-LD. */
export function buildStaysNearJsonLd({ poi, canonical }: { poi: StaysNearPoi; canonical: string }): string {
  const origin = canonical.replace(/\/stays-near\/.*$/, '');
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: '/' },
      { name: poi.city.name, url: `/destinations/${poi.city.slug}` },
      { name: poi.poiName, url: canonical },
    ].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${origin}${it.url}`,
    })),
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs(poi).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
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
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#febb02', color: '#003b95', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '0.5rem', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(254,187,2,0.7)' };
