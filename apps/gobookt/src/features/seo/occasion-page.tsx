import Link from 'next/link';
import { type OccasionRoute, siblingOccasions } from '@adored/seo-data';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { BookingStaySearchCard } from '@/features/site/booking-stay-search-card';

/**
 * gobookt occasion / celebration page — the Booking.com hotels angle
 * ("Bachelorette Party Hotels in Nashville"). Discovery-only: indexable + in
 * the sitemap, not linked from nav/homepage. Local to gobookt.
 */

const HERO_BG = 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)';

export function occasionHeading(route: OccasionRoute): string {
  return route.occasion.vibe === 'romantic'
    ? `${route.occasion.name} in ${route.city.name}`
    : `${route.occasion.name} Hotels in ${route.city.name}`;
}

/** Booking.com hotel search for the city + group (CJ-tracked via /api/go/booking). */
export function bookingHref(route: OccasionRoute): string {
  const params = new URLSearchParams({
    category: 'hotels',
    destination: `${route.city.name}, ${route.city.countryName}`,
    adults: String(route.occasion.groupSize),
  });
  return `/api/go/booking?${params.toString()}`;
}

function lead(route: OccasionRoute): string {
  const { occasion, city } = route;
  if (occasion.vibe === 'romantic') {
    return `Planning a ${occasion.name.toLowerCase()} in ${city.name}? Compare hotels on Booking.com — a romantic boutique stay or a suite with a view, whatever makes the trip special. ${occasion.tagline}`;
  }
  return `Planning a ${occasion.name.toLowerCase()} in ${city.name}? Book a block of hotel rooms for the group on Booking.com — real guest reviews and everyone close to the action. ${occasion.tagline}`;
}

export function OccasionPage({ route }: { route: OccasionRoute }) {
  const { occasion, city } = route;
  const heading = occasionHeading(route);
  const siblings = siblingOccasions(route);
  const cityFaq = {
    q: `Where should we stay for a ${occasion.name.toLowerCase()} in ${city.name}?`,
    a: `Choose a central, walkable area of ${city.name} so you're near the restaurants and nightlife. ${city.oneLiner} On Booking.com, filter by guest score, and if you're a group, ask about adjoining rooms or a group rate.`,
  };
  const faqs = [...occasion.faqs, cityFaq];

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <p style={eyebrowStyle}>{city.countryName} · Hotels via Booking.com</p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              <span aria-hidden style={{ marginRight: '0.5rem' }}>{occasion.emoji}</span>{heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '48rem', margin: '1rem 0 0' }}>
              {lead(route)}
            </p>
            <div className="mt-7" style={{ maxWidth: '46rem' }}>
              <BookingStaySearchCard
                cityName={city.name}
                heading={`Search ${city.name} hotels on Booking.com`}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 style={h2Style}>Planning a {occasion.name.toLowerCase()} in {city.name}</h2>
              <p className="mt-4" style={bodyStyle}>
                {occasion.vibe === 'romantic'
                  ? `${city.oneLiner} Pick a hotel with the feature that makes it special — a view, a spa, a great location — and book early for the best rooms. Booking.com's free-cancellation options let you hold the date while plans firm up.`
                  : `${city.oneLiner} For a group, book early so everyone's in the same hotel and ideally on the same floor. Booking.com shows real guest scores and free-cancellation rooms, so you can lock in the block and adjust if the headcount changes.`}
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
                    <li><Link href={`/stays-near/city-centre-in-${city.slug}`} style={sideLinkStyle}>Hotels in central {city.name}</Link></li>
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
