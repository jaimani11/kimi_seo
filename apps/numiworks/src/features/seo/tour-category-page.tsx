import Link from 'next/link';
import type { SeoCity } from '@lib/seo/cities';
import { buildVrboSearchUrl } from '@lib/affiliate/vrbo-link';
import { buildViatorStaySearchUrl, getViatorStayLinkConfig } from '@lib/affiliate/viator-stay-link-builder';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import {
  type TourCategoryRoute,
  siblingCategoryLinks,
  sameCategoryCityLinks,
} from '@lib/seo/tour-category-routes';

/**
 * numiworks tour-category page — one component powers every
 * "{Category} in {City}" page (cooking classes, boat tours, ski lessons…).
 * Viator is the primary CTA (the experience), VRBO the secondary (a place
 * to stay). Content is data-backed and deterministically varied (no
 * Math.random — that would break static generation) so no two pages read
 * alike and none duplicate the shared themed matrix.
 */

const HERO_BG = 'linear-gradient(135deg, var(--brand-hero-from) 0%, var(--brand-hero-to) 100%)';

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

export function tourCategoryHeading(route: TourCategoryRoute): string {
  return `${route.category.name} in ${route.city.name}`;
}

/** Viator search for "{searchTerm} {city}", e.g. "cooking class Rome". */
export function viatorHref(route: TourCategoryRoute): string {
  return buildViatorStaySearchUrl(
    { destination: `${route.category.searchTerm} ${route.city.name}` },
    getViatorStayLinkConfig(),
  );
}

/** VRBO whole-home search for the city (the "where to stay" secondary). Null when unconfigured. */
export function vrboHref(route: TourCategoryRoute): string | null {
  return buildVrboSearchUrl(`${route.city.name}, ${route.city.countryName}`);
}

function leadParagraph(route: TourCategoryRoute): string {
  const { category, city } = route;
  const region = REGION_LABEL[city.region];
  const seed = hashInt(`lead:${category.slug}:${city.slug}`);
  const openers = [
    `Booking a ${category.singular} in ${city.name}, ${city.countryName}? ${category.angle}`,
    `A ${category.singular} is one of the best things to book ahead in ${city.name}. ${category.angle}`,
    `${city.name} is one of ${region}'s favourite places for this — and ${category.name.toLowerCase()} here are worth planning around. ${category.angle}`,
    `Looking for a ${category.singular} in ${city.name}? ${category.angle}`,
  ];
  const closers = [
    `Browse and book on Viator with free cancellation on most experiences — reserve the good ones early, they sell out.`,
    `We send you to Viator to check live times and prices; the price you pay is the same as booking direct.`,
    `${city.oneLiner}`,
    `Compare options on Viator by rating and duration, and book a free-cancellation slot so you can lock it in and still stay flexible.`,
  ];
  return `${pick(openers, seed)} ${pick(closers, seed >> 3)}`;
}

function whyParagraph(route: TourCategoryRoute): string {
  const { category, city } = route;
  const seed = hashInt(`why:${category.slug}:${city.slug}`);
  const label = category.name.toLowerCase();
  const options = [
    `The best ${label} in ${city.name} book out first, so it pays to reserve ahead — Viator shows live availability and lets you cancel free on most experiences, so there's no reason to leave it to chance on the day.`,
    `Sort by traveller rating rather than price when you compare ${label} in ${city.name}: the top-reviewed operators cost a little more and consistently run a better experience. Recent reviews on Viator are the honest signal.`,
    `${city.oneLiner} A ${category.singular} is a great way to see a side of it you'd miss on your own — and numiworks' AI concierge can slot it into a day-by-day plan around your dates.`,
    `Pair the experience with the right base: keep a whole-home rental in ${city.name} so the group stays together, book the ${category.singular} on Viator, and let numiworks' planner weave the two into one itinerary.`,
  ];
  return pick(options, seed);
}

/** Feature chips: category-specific "what to know" + Viator staples. */
function featureChips(route: TourCategoryRoute): string[] {
  return [...route.category.lookFor, 'Free cancellation on most', 'Reserve now, pay later'].slice(0, 6);
}

/** City-specific FAQ layered on top of the category FAQs, for uniqueness. */
function cityFaq(route: TourCategoryRoute): { q: string; a: string } {
  const { category, city } = route;
  return {
    q: `Where do we stay for a ${category.singular} in ${city.name}?`,
    a: `Stay central so you're close to where the experiences start. ${city.oneLiner} A whole-home rental on VRBO keeps a group together and gives you a kitchen and space to gather; book the ${category.singular} itself on Viator, and numiworks' AI concierge can plan the days around both.`,
  };
}

function faqsFor(route: TourCategoryRoute): { q: string; a: string }[] {
  return [...route.category.faqs, cityFaq(route)];
}

// ── page ─────────────────────────────────────────────────────────────

export function TourCategoryPage({ route }: { route: TourCategoryRoute }) {
  const { category, city } = route;
  const heading = tourCategoryHeading(route);
  const viator = viatorHref(route);
  const vrbo = vrboHref(route);
  const siblings = siblingCategoryLinks(city, category.slug);
  const sameCat = sameCategoryCityLinks(category, city.slug);
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
                <Crumb href={`/things-to-do-in-${city.slug}`} label={`${city.name} things to do`} />
                <span aria-hidden>/</span>
                <li style={{ color: '#fff', fontWeight: 600 }}>{category.name}</li>
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>
              {city.countryName} · Experiences on Viator + homes on VRBO
            </p>
            <h1 className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.06, margin: 0 }}>
              <span aria-hidden style={{ marginRight: '0.5rem' }}>{category.emoji}</span>{heading}
            </h1>
            <p className="mt-4" style={{ fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '48rem', margin: '1rem 0 0' }}>
              {leadParagraph(route)}
            </p>

            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={viator} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                {category.emoji} See {category.name.toLowerCase()} in {city.name} on Viator →
              </a>
              {vrbo && (
                <a href={vrbo} target="_blank" rel="sponsored nofollow noopener noreferrer" style={secondaryCtaStyle}>
                  🏡 Where to stay on VRBO
                </a>
              )}
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
              <h2 style={h2Style}>Booking a {category.singular} in {city.name}</h2>
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
                  <LinkCard title={`More to do in ${city.name}`}>
                    {siblings.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>
                          <span aria-hidden style={{ marginRight: '0.5rem' }}>{s.emoji}</span>{s.label}
                        </Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                {sameCat.length > 0 && (
                  <LinkCard title={`${category.name} elsewhere`}>
                    {sameCat.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>{s.label}</Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                <LinkCard title={`Plan your ${city.name} trip`}>
                  <li><Link href="/plan" style={sideLinkStyle}>Plan this trip with AI →</Link></li>
                  <li><Link href={`/things-to-do-in-${city.slug}`} style={sideLinkStyle}>All things to do in {city.name}</Link></li>
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
export function buildTourCategoryJsonLd({ route, canonical }: { route: TourCategoryRoute; canonical: string }): string {
  const { category, city } = route;
  const origin = canonical.replace(/\/tours\/.*$/, '');
  const items = [
    { name: 'Home', url: '/' },
    { name: `${city.name} things to do`, url: `/things-to-do-in-${city.slug}` },
    { name: category.name, url: canonical },
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
    name: `${tourCategoryHeading(route)} · numiworks`,
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
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#FBC700', color: '#0A2B45', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(251,199,0,0.6)' };
const secondaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.14)', color: '#fff', fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 700, padding: '0.9rem 1.4rem', borderRadius: '999px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' };
