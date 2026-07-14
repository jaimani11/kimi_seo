import Link from 'next/link';
import type { SeoCity } from '@lib/seo/cities';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import {
  type HotelTypeRoute,
  siblingTypeLinks,
  sameTypeCityLinks,
} from '@lib/seo/hotel-type-routes';

/**
 * gobookt hotel-facet page — one component powers every
 * "{Hotel Type} in {City}" page (spa hotels, adults-only, ski hotels…).
 * The Booking.com angle throughout: guest scores, free cancellation,
 * book-early. Content is data-backed and deterministically varied (no
 * Math.random — that would break static generation) so no two pages
 * read alike and none duplicate the shared hotels-themed matrix.
 *
 * Monetization: a single Booking.com CTA per page via the CJ-tracked
 * /api/go/booking handler (category=hotels → the "stays" surface).
 */

const HERO_BG = 'linear-gradient(135deg, #003b95 0%, #006ce4 100%)';

const REGION_LABEL: Record<SeoCity['region'], string> = {
  asia: 'Asia',
  europe: 'Europe',
  americas: 'the Americas',
  mena: 'the Middle East & North Africa',
  oceania: 'Oceania',
  africa: 'Africa',
};

// ── deterministic variation ──────────────────────────────────────────

function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], seed: number): T {
  const i = ((seed % arr.length) + arr.length) % arr.length;
  return arr[i] as T;
}

// ── content ──────────────────────────────────────────────────────────

export function hotelTypeHeading(route: HotelTypeRoute): string {
  return `${route.type.name} in ${route.city.name}`;
}

/** Booking.com hotel search for the city (CJ-tracked via /api/go/booking). */
export function bookingHref(route: HotelTypeRoute): string {
  const params = new URLSearchParams({
    category: 'hotels',
    destination: `${route.city.name}, ${route.city.countryName}`,
  });
  return `/api/go/booking?${params.toString()}`;
}

function leadParagraph(route: HotelTypeRoute): string {
  const { type, city } = route;
  const region = REGION_LABEL[city.region];
  const seed = hashInt(`lead:${type.slug}:${city.slug}`);
  const openers = [
    `Looking for a ${type.singular} in ${city.name}, ${city.countryName}? ${type.angle}`,
    `A ${type.singular} in ${city.name} is easy to get right once you know what to filter for. ${type.angle}`,
    `${city.name} is one of ${region}'s most-booked stays — and there's a strong choice of ${type.name.toLowerCase()} here. ${type.angle}`,
    `Booking a ${type.singular} in ${city.name}? ${type.angle}`,
  ];
  const closers = [
    `Compare them on Booking.com with real guest scores and free cancellation on most rooms.`,
    `We send you to Booking.com to check live prices and availability — the price you pay is the same as booking direct.`,
    `${city.oneLiner}`,
    `Filter by guest rating on Booking.com, read recent reviews, and book a free-cancellation rate so you can lock the room and still adjust.`,
  ];
  return `${pick(openers, seed)} ${pick(closers, seed >> 3)}`;
}

function whyParagraph(route: HotelTypeRoute): string {
  const { type, city } = route;
  const seed = hashInt(`why:${type.slug}:${city.slug}`);
  const label = type.name.toLowerCase();
  const options = [
    `The trick with ${label} in ${city.name} is to sort by guest score rather than price alone — a slightly higher-rated ${type.singular} usually costs a few dollars more and reads far better in the reviews. On Booking.com you can filter to the exact facilities that matter and see them plotted on a map of ${city.name}.`,
    `Book early for the best ${label} in ${city.name}: the top-rated rooms go first, especially in peak season. A free-cancellation rate lets you hold a great ${type.singular} now and keep an eye out for a better deal without any risk.`,
    `${city.oneLiner} For a ${type.singular} specifically, read the most recent reviews — they're the honest signal on whether the property still delivers, and Booking.com surfaces verified stays only.`,
    `Where you stay shapes the trip as much as the ${type.singular} itself. Use Booking.com's map view to keep ${city.name}'s best areas and transport within reach, then filter for the features that make a ${label.replace(/s$/, '')} worth it.`,
  ];
  return pick(options, seed);
}

/** Feature chips: the facet-specific "what to look for" + Booking staples. */
function featureChips(route: HotelTypeRoute): string[] {
  return [...route.type.lookFor, 'Verified guest reviews', 'Free cancellation on most rooms'].slice(0, 6);
}

/** City-specific FAQ layered on top of the facet FAQs, for uniqueness. */
function cityFaq(route: HotelTypeRoute): { q: string; a: string } {
  const { type, city } = route;
  return {
    q: `Which area of ${city.name} is best for a ${type.singular}?`,
    a: `Stay central and well-connected so you're near the things you came for. ${city.oneLiner} On Booking.com, switch to map view to see how each ${type.singular} sits relative to ${city.name}'s main sights and transport, and sort by guest score to shortlist fast.`,
  };
}

function faqsFor(route: HotelTypeRoute): { q: string; a: string }[] {
  return [...route.type.faqs, cityFaq(route)];
}

// ── page ─────────────────────────────────────────────────────────────

export function HotelTypePage({ route }: { route: HotelTypeRoute }) {
  const { type, city } = route;
  const heading = hotelTypeHeading(route);
  const href = bookingHref(route);
  const siblings = siblingTypeLinks(city, type.slug);
  const sameType = sameTypeCityLinks(type, city.slug);
  const faqs = faqsFor(route);

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        {/* Hero */}
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <nav aria-label="Breadcrumb">
              <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)' }}>
                <Crumb href="/" label="Home" />
                <span aria-hidden>/</span>
                <Crumb href={`/hotels-in-${city.slug}`} label={`${city.name} hotels`} />
                <span aria-hidden>/</span>
                <li style={{ color: '#fff', fontWeight: 600 }}>{type.name}</li>
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>
              {city.countryName} · Hotels via Booking.com
            </p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              <span aria-hidden style={{ marginRight: '0.5rem' }}>{type.emoji}</span>{heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '48rem', margin: '1rem 0 0' }}>
              {leadParagraph(route)}
            </p>

            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                Search {city.name} hotels on Booking.com →
              </a>
            </div>
            <p className="mt-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0.75rem 0 0' }}>
              Affiliate link · prices may change · the price you pay is the same.
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 style={h2Style}>Finding the right {type.singular} in {city.name}</h2>
              <p className="mt-4" style={bodyStyle}>{whyParagraph(route)}</p>

              <div className="mt-6" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {featureChips(route).map((f) => (
                  <span key={f} style={chipStyle}>{f}</span>
                ))}
              </div>

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

            {/* Sidebar: internal links */}
            <aside>
              <div style={{ position: 'sticky', top: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                {siblings.length > 0 && (
                  <LinkCard title={`More hotels in ${city.name}`}>
                    {siblings.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>
                          <span aria-hidden style={{ marginRight: '0.5rem' }}>{s.emoji}</span>{s.label}
                        </Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                {sameType.length > 0 && (
                  <LinkCard title={`${type.name} elsewhere`}>
                    {sameType.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>{s.label}</Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                <LinkCard title={`Plan your ${city.name} trip`}>
                  <li><Link href={`/hotels-in-${city.slug}`} style={sideLinkStyle}>All hotels in {city.name}</Link></li>
                  <li><Link href={`/destinations/${city.slug}`} style={sideLinkStyle}>{city.name} travel guide</Link></li>
                </LinkCard>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Crumb({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} style={{ color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }}>{label}</Link>
    </li>
  );
}

function LinkCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: '0.85rem', border: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)', padding: '1.1rem 1.25rem' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-inter)', fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)' }}>{title}</p>
      <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>{children}</ul>
    </div>
  );
}

/** Breadcrumb + FAQ + CollectionPage JSON-LD for the page. */
export function buildHotelTypeJsonLd({ route, canonical }: { route: HotelTypeRoute; canonical: string }): string {
  const { type, city } = route;
  const origin = canonical.replace(/\/hotels\/.*$/, '');
  const items = [
    { name: 'Home', url: '/' },
    { name: `${city.name} hotels`, url: `/hotels-in-${city.slug}` },
    { name: type.name, url: canonical },
  ];
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${origin}${it.url}`,
    })),
  };
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${hotelTypeHeading(route)} · gobookt`,
    description: leadParagraph(route),
    url: canonical,
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqsFor(route).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return JSON.stringify([breadcrumb, collection, faqPage]);
}

// ── styles ───────────────────────────────────────────────────────────

const eyebrowStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontWeight: 700, margin: 0 };
const bodyStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1rem', lineHeight: 1.7, color: 'var(--ink-secondary)', margin: 0 };
const h2Style: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink-primary)', margin: 0 };
const chipStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-secondary)', background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)', borderRadius: '999px', padding: '0.4rem 0.9rem' };
const faqStyle: React.CSSProperties = { borderRadius: '0.6rem', border: '1px solid var(--border-subtle)', padding: '0.95rem 1.15rem', background: 'var(--surface-overlay)' };
const sideLinkStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--ink-secondary)', textDecoration: 'none' };
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#febb02', color: '#003b95', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '0.5rem', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(254,187,2,0.7)' };
