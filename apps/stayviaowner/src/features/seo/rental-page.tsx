import Link from 'next/link';
import type { SeoCity } from '@lib/seo/cities';
import type { AccommodationCategory } from '@lib/seo/accommodation-categories';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import {
  type RentalRoute,
  siblingTypeLinks,
  sameTypeCityLinks,
  cityTypeLinks,
} from '@lib/seo/rental-routes';

/**
 * The stayviaowner rental matrix page — one component powers both the
 * per-city hub ("Vacation rentals in {City}") and every category-in-city
 * page ("{Category} in {City}"). Content is data-backed and deterministically
 * varied (no Math.random — that would break static generation) so no two
 * pages read alike and none duplicate gotript's hotel-brand content.
 *
 * Monetization: VRBO primary CTA (whole homes, highest commission) +
 * an "also compare on Expedia" secondary. Both ride stayviaowner's own
 * Partnerize camref via buildExpediaCategoryUrl.
 */

const HERO_BG = 'linear-gradient(135deg, #0f2340 0%, #1c3a63 55%, #37d0a1 220%)';
const MINT = '#37d0a1';

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

// ── content generators ───────────────────────────────────────────────

function typeLabel(route: RentalRoute): string {
  return route.kind === 'type' ? route.category.name : 'Vacation rentals';
}

function heading(route: RentalRoute): string {
  return `${typeLabel(route)} in ${route.city.name}`;
}

function anchorNoun(route: RentalRoute): string {
  return route.kind === 'type' ? route.category.searchAnchor : 'vacation rental';
}

/** Lead paragraph — weaves the type, the city's own one-liner, and region. */
function leadParagraph(route: RentalRoute): string {
  const { city } = route;
  const region = REGION_LABEL[city.region];
  const noun = anchorNoun(route);
  const nounPlural = route.kind === 'type'
    ? route.category.name.toLowerCase()
    : 'whole-home rentals';
  const seed = hashInt(`${route.kind}:${city.slug}:${route.kind === 'type' ? route.category.slug : 'hub'}`);

  const openers = [
    `Rent a ${noun} in ${city.name}, ${city.countryName} and get the whole place to yourself — kitchen, living space, and room to spread out that a hotel room can't match.`,
    `Skip the hotel corridor. Whole-home ${nounPlural} in ${city.name} give you a private front door, a full kitchen, and space for everyone travelling with you.`,
    `${city.name}, ${city.countryName} is one of ${region}'s best-loved stays — and a ${noun} here means more space, more privacy, and better value per person than a block of hotel rooms.`,
    `Booking a ${noun} in ${city.name} puts you in a real neighbourhood, with a kitchen for slow mornings and living space to come back to after a long day out.`,
  ];
  const closers = [
    `Every stay is bookable through VRBO with real photos, verified guest reviews, and free cancellation on most listings.`,
    `Browse VRBO's whole-home inventory for ${city.name}, or compare hotels on Expedia if you'd rather have daily service.`,
    `${city.oneLiner}`,
    `We send you straight to VRBO to check live prices and dates — the price you pay is the same as booking direct.`,
  ];
  return `${pick(openers, seed)} ${pick(closers, seed >> 3)}`;
}

/** Second "why here" paragraph — group value / kitchen / neighbourhood angle. */
function whyParagraph(route: RentalRoute): string {
  const { city } = route;
  const seed = hashInt(`why:${city.slug}:${route.kind === 'type' ? route.category.slug : 'hub'}`);
  const label = typeLabel(route).toLowerCase();
  const options = [
    `For families and groups, a ${label.replace(/s$/, '')} in ${city.name} usually beats separate hotel rooms: you split one nightly rate, cook when you want, and actually share a living room at the end of the day.`,
    `The kitchen is the quiet reason to rent whole-home in ${city.name} — breakfast on your own schedule, a fridge for local-market finds, and dinners in when you don't feel like going out.`,
    `Staying in a ${city.name} neighbourhood rather than a hotel district puts cafés, bakeries and everyday life on your doorstep — the version of ${city.countryName} that locals actually live in.`,
    `Longer stay? Whole-home ${label} in ${city.name} reward it — weekly and monthly rates on VRBO often drop well below the nightly price, with laundry and a full kitchen built in.`,
  ];
  return pick(options, seed);
}

/** Short, type-aware "what you get" chips. */
function featureChips(route: RentalRoute): string[] {
  const base = ['Full kitchen', 'Private space', 'Room for groups', 'Free cancellation on most stays'];
  if (route.kind !== 'type') return base;
  const extra: Record<string, string[]> = {
    villas: ['Private pool options', 'Optional concierge'],
    'luxury-villas': ['Staff & chef options', 'Private pool'],
    'private-pool-villas': ['Your own pool', 'Sun terraces'],
    'beach-villas': ['Steps from the sand', 'Sea views'],
    'beach-houses': ['Coastal setting', 'Outdoor living'],
    cabins: ['Wood-burning stove', 'Hot tub options'],
    chalets: ['Ski-season access', 'Fireplace'],
    'ski-lodges': ['Near the lifts', 'Boot & ski storage'],
    'lake-houses': ['Waterfront setting', 'Docks & decks'],
    cottages: ['Cosy & characterful', 'Garden space'],
    'pet-friendly-villas': ['Pets welcome', 'Fenced outdoor space'],
    'family-villas': ['Kid-friendly layouts', 'Extra bedrooms'],
    mansions: ['Grand living space', 'Event-ready'],
    penthouses: ['City & skyline views', 'Top-floor privacy'],
    farmhouses: ['Rural quiet', 'Big shared table'],
    glamping: ['Nature up close', 'Comfort in the wild'],
    condos: ['Central & convenient', 'Building amenities'],
  };
  return [...(extra[route.category.slug] ?? []), ...base].slice(0, 6);
}

/** City-specific FAQs (beyond the shared category FAQs) to lift uniqueness. */
function cityFaqs(route: RentalRoute): { q: string; a: string }[] {
  const { city } = route;
  const label = typeLabel(route).toLowerCase();
  const single = label.replace(/s$/, '');
  const lat = city.coordinates.lat;
  const tropical = Math.abs(lat) < 23.5;
  const north = lat >= 0;
  const bestWindow = tropical
    ? 'the dry season — roughly November to April'
    : north
      ? 'late spring through early autumn (May–September)'
      : 'the southern-hemisphere summer (November–March)';
  return [
    {
      q: `When is the best time to rent a ${single} in ${city.name}?`,
      a: `Demand and prices peak in ${bestWindow}, so book a few months ahead for those dates. Shoulder-season weeks either side are the sweet spot for availability and value on VRBO.`,
    },
    {
      q: `Is a ${single} in ${city.name} better value than a hotel?`,
      a: `For two people on a short trip, a central hotel can be cheaper. For families, groups, or stays of several nights, a whole-home ${single} in ${city.name} usually wins on price per person once you factor in the kitchen and shared living space — compare both before you book.`,
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────

export function RentalPage({ route }: { route: RentalRoute }) {
  const { city } = route;
  const photo = resolveDestinationPhoto({
    name: city.name,
    country: city.countryCode,
    region: city.region,
  });

  const vrboHref = buildExpediaCategoryUrl('vacation-rentals', {
    destination: `${anchorNoun(route)} ${city.name}, ${city.countryName}`,
  });
  const expediaHref = buildExpediaCategoryUrl('hotels', {
    destination: `${city.name}, ${city.countryName}`,
  });

  const faqs =
    route.kind === 'type'
      ? [...cityFaqs(route), ...route.category.faqs]
      : cityFaqs(route);

  const siblings = siblingTypeLinks(city, route.kind === 'type' ? route.category.slug : null);
  const sameType = route.kind === 'type' ? sameTypeCityLinks(route.category, city.slug) : [];
  const hubTypes = route.kind === 'city' ? cityTypeLinks(city) : [];

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
                <Crumb href="/vacation-rentals" label="Vacation rentals" />
                <span aria-hidden>/</span>
                {route.kind === 'type' ? (
                  <>
                    <Crumb href={`/rentals/${city.slug}`} label={city.name} />
                    <span aria-hidden>/</span>
                    <li style={{ color: '#fff', fontWeight: 600 }}>{route.category.name}</li>
                  </>
                ) : (
                  <li style={{ color: '#fff', fontWeight: 600 }}>{city.name}</li>
                )}
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>
              {REGION_LABEL[city.region]} · Whole-home rentals on VRBO
            </p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
              {heading(route)}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '46rem', margin: '1rem 0 0' }}>
              {leadParagraph(route)}
            </p>

            {/* CTAs — VRBO primary, Expedia compare secondary */}
            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={vrboHref} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                🏡 Search {typeLabel(route).toLowerCase()} on VRBO →
              </a>
              <a href={expediaHref} target="_blank" rel="sponsored nofollow noopener noreferrer" style={secondaryCtaStyle}>
                Compare {city.name} hotels on Expedia
              </a>
            </div>
            <p className="mt-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0.75rem 0 0' }}>
              Affiliate links · prices may change · the price you pay is the same.
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <p style={bodyStyle}>{whyParagraph(route)}</p>

              <div className="mt-6" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {featureChips(route).map((f) => (
                  <span key={f} style={chipStyle}>{f}</span>
                ))}
              </div>

              {/* City hub → all property types */}
              {route.kind === 'city' && hubTypes.length > 0 && (
                <div className="mt-10">
                  <h2 style={h2Style}>Browse by home type in {city.name}</h2>
                  <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {hubTypes.map((t) => (
                      <Link key={t.href} href={t.href} style={tileStyle}>
                        <span aria-hidden style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
                        <div>
                          <p style={{ margin: 0, fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink-primary)' }}>{t.label}</p>
                          <p style={{ margin: '0.15rem 0 0', fontFamily: 'var(--font-inter)', fontSize: '0.74rem', color: 'var(--ink-tertiary)' }}>{t.tagline}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {faqs.length > 0 && (
                <div className="mt-10">
                  <h2 style={h2Style}>Common questions</h2>
                  <div className="mt-5 space-y-3">
                    {faqs.map((f) => (
                      <details key={f.q} style={faqStyle}>
                        <summary style={{ fontFamily: 'var(--font-inter)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink-primary)', cursor: 'pointer' }}>{f.q}</summary>
                        <p style={{ margin: '0.7rem 0 0', fontFamily: 'var(--font-inter)', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-secondary)' }}>{f.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: internal links */}
            <aside>
              <div style={{ position: 'sticky', top: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                {siblings.length > 0 && (
                  <LinkCard title={`More whole homes in ${city.name}`}>
                    {siblings.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>
                          <span aria-hidden style={{ marginRight: '0.5rem' }}>{s.emoji}</span>{s.label}
                        </Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                {sameType.length > 0 && route.kind === 'type' && (
                  <LinkCard title={`${route.category.name} elsewhere`}>
                    {sameType.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>{s.label}</Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                <LinkCard title={`Plan your ${city.name} trip`}>
                  <li><Link href={`/rentals/${city.slug}`} style={sideLinkStyle}>All vacation rentals in {city.name}</Link></li>
                  <li><Link href={`/destinations/${city.slug}`} style={sideLinkStyle}>{city.name} travel guide</Link></li>
                  <li><Link href="/vacation-rentals" style={sideLinkStyle}>All vacation rentals</Link></li>
                </LinkCard>

                <div style={{ borderRadius: '0.85rem', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ height: '150px', backgroundImage: `url(${photo.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <a href={vrboHref} target="_blank" rel="sponsored nofollow noopener noreferrer" style={{ display: 'block', padding: '0.9rem 1rem', textAlign: 'center', background: MINT, color: '#0a1930', fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>
                    See {city.name} homes on VRBO →
                  </a>
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
export function buildRentalJsonLd({ route, canonical }: { route: RentalRoute; canonical: string }): string {
  const faqs =
    route.kind === 'type'
      ? [...cityFaqs(route), ...route.category.faqs]
      : cityFaqs(route);
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Vacation rentals', url: '/vacation-rentals' },
    ...(route.kind === 'type'
      ? [
          { name: route.city.name, url: `/rentals/${route.city.slug}` },
          { name: route.category.name, url: canonical },
        ]
      : [{ name: route.city.name, url: canonical }]),
  ];
  const origin = canonical.replace(/\/rentals\/.*$/, '');
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
    name: `${heading(route)} · stayviaowner`,
    description: leadParagraph(route),
    url: canonical,
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
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
const tileStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.85rem 1rem', borderRadius: '0.7rem', border: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)', textDecoration: 'none' };
const faqStyle: React.CSSProperties = { borderRadius: '0.6rem', border: '1px solid var(--border-subtle)', padding: '0.95rem 1.15rem', background: 'var(--surface-overlay)' };
const sideLinkStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--ink-secondary)', textDecoration: 'none' };
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: MINT, color: '#0a1930', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(55,208,161,0.7)' };
const secondaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 600, padding: '0.9rem 1.4rem', borderRadius: '999px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' };
