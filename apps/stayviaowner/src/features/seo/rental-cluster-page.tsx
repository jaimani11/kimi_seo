import Link from 'next/link';
import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import {
  type ClusterRoute,
  type RentalCluster,
  type ClusterTown,
  clusterHubPath,
  clusterTownPath,
  siblingClusterTowns,
} from '@lib/seo/rental-clusters';

/**
 * Curated niche-cluster page (stayviaowner). One component powers both the
 * cluster HUB ("Cabins with hot tubs") and each TOWN page ("Cabins with hot
 * tubs in Gatlinburg"). VRBO-ONLY monetization (whole-home, category
 * 'vacation-rentals' via the app's Partnerize camref) — deliberately no
 * Booking.com, Expedia-hotel or Viator CTA. Content is hand-written per town
 * in `rental-clusters.ts`, so no two pages read alike.
 */

const HERO_BG = 'linear-gradient(135deg, #0f2340 0%, #1c3a63 55%, #37d0a1 220%)';
const MINT = '#37d0a1';

function vrboHref(destination: string): string {
  return buildExpediaCategoryUrl('vacation-rentals', { destination });
}

export function RentalClusterPage({ route }: { route: ClusterRoute }) {
  return route.kind === 'cluster-town' ? (
    <TownPage cluster={route.cluster} town={route.town} />
  ) : (
    <HubPage cluster={route.cluster} />
  );
}

// ── town page ────────────────────────────────────────────────────────

function TownPage({ cluster, town }: { cluster: RentalCluster; town: ClusterTown }) {
  const heading = `${cluster.name} in ${town.town}`;
  const href = vrboHref(town.vrboDestination);
  const siblings = siblingClusterTowns(cluster, town.townSlug, 10);

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <nav aria-label="Breadcrumb">
              <ol style={crumbListStyle}>
                <Crumb href="/" label="Home" />
                <span aria-hidden>/</span>
                <Crumb href="/vacation-rentals" label="Vacation rentals" />
                <span aria-hidden>/</span>
                <Crumb href={clusterHubPath(cluster)} label={cluster.name} />
                <span aria-hidden>/</span>
                <li style={{ color: '#fff', fontWeight: 600 }}>{town.town}</li>
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>
              {town.town}, {town.state} · Whole-home rentals on VRBO
            </p>
            <h1 className="mt-2" style={h1Style}>
              {cluster.emoji} {heading}
            </h1>
            <p className="mt-4" style={heroLeadStyle}>
              {town.intro}
            </p>

            <div className="mt-7" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={primaryCtaStyle}>
                🏡 Search {cluster.name.toLowerCase()} in {town.town} on VRBO →
              </a>
            </div>
            <p className="mt-3" style={ctaNoteStyle}>
              Whole homes on VRBO · affiliate link · the price you pay is the same.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <FactBlock title="Where to look" body={town.bestAreas} />
              <FactBlock title="When to book" body={town.whenToBook} />
              <FactBlock title="What you'll pay" body={town.priceBand} />

              {town.faqs.length > 0 && (
                <div className="mt-10">
                  <h2 style={h2Style}>Common questions</h2>
                  <div className="mt-5 space-y-3">
                    {town.faqs.map((f) => (
                      <details key={f.q} style={faqStyle}>
                        <summary style={faqSummaryStyle}>{f.q}</summary>
                        <p style={faqAnswerStyle}>{f.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside>
              <div style={{ position: 'sticky', top: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                {siblings.length > 0 && (
                  <LinkCard title={`More ${cluster.name.toLowerCase()}`}>
                    {siblings.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} style={sideLinkStyle}>
                          {s.label}, {s.state}
                        </Link>
                      </li>
                    ))}
                  </LinkCard>
                )}

                <LinkCard title="Browse">
                  <li>
                    <Link href={clusterHubPath(cluster)} style={sideLinkStyle}>
                      All {cluster.name.toLowerCase()}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${cluster.relatedCategorySlug}`} style={sideLinkStyle}>
                      {cluster.relatedCategoryLabel}
                    </Link>
                  </li>
                  <li>
                    <Link href="/vacation-rentals" style={sideLinkStyle}>
                      All vacation rentals
                    </Link>
                  </li>
                </LinkCard>

                <div style={ctaCardStyle}>
                  <p style={ctaCardEyebrowStyle}>{cluster.emoji} On VRBO</p>
                  <p style={ctaCardTitleStyle}>
                    Whole-home {cluster.name.toLowerCase()} in {town.town}
                  </p>
                  <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" style={ctaCardButtonStyle}>
                    See {town.town} homes on VRBO →
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

// ── hub page ─────────────────────────────────────────────────────────

function HubPage({ cluster }: { cluster: RentalCluster }) {
  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
        <section className="relative w-full" style={{ background: HERO_BG, color: '#fff' }}>
          <div className="mx-auto max-w-5xl px-6 pt-14 pb-12 md:pt-16 md:pb-14">
            <nav aria-label="Breadcrumb">
              <ol style={crumbListStyle}>
                <Crumb href="/" label="Home" />
                <span aria-hidden>/</span>
                <Crumb href="/vacation-rentals" label="Vacation rentals" />
                <span aria-hidden>/</span>
                <li style={{ color: '#fff', fontWeight: 600 }}>{cluster.name}</li>
              </ol>
            </nav>

            <p className="mt-6" style={eyebrowStyle}>
              Whole-home rentals on VRBO
            </p>
            <h1 className="mt-2" style={h1Style}>
              {cluster.emoji} {cluster.hub.h1}
            </h1>
            <p className="mt-4" style={heroLeadStyle}>
              {cluster.hub.intro}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 style={h2Style}>Browse by destination</h2>
          <div
            className="mt-6 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {cluster.towns.map((t) => (
              <Link key={t.townSlug} href={clusterTownPath(cluster, t)} style={townCardStyle}>
                <p style={townCardKickerStyle}>
                  {t.town}, {t.state}
                </p>
                <p style={townCardTitleStyle}>
                  {cluster.name} in {t.town}
                </p>
                <p style={townCardMetaStyle}>{t.priceBand}</p>
                <span style={townCardArrowStyle}>View homes →</span>
              </Link>
            ))}
          </div>

          <div className="mt-10" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href={`/${cluster.relatedCategorySlug}`} style={secondaryLinkStyle}>
              {cluster.relatedCategoryLabel} →
            </Link>
            <Link href="/vacation-rentals" style={secondaryLinkStyle}>
              All vacation rentals →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// ── small pieces ─────────────────────────────────────────────────────

function Crumb({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} style={{ color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }}>
        {label}
      </Link>
    </li>
  );
}

function FactBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 first:mt-0">
      <h2 style={h3Style}>{title}</h2>
      <p style={bodyStyle}>{body}</p>
    </div>
  );
}

function LinkCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={linkCardStyle}>
      <p style={linkCardTitleStyle}>{title}</p>
      <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
        {children}
      </ul>
    </div>
  );
}

/** Breadcrumb + CollectionPage (+ FAQPage for town) JSON-LD. */
export function buildClusterJsonLd({
  route,
  canonical,
}: {
  route: ClusterRoute;
  canonical: string;
}): string {
  const origin = canonical.replace(/\/rentals\/.*$/, '');
  const abs = (path: string) => (path.startsWith('http') ? path : `${origin}${path}`);
  const { cluster } = route;

  const crumbs =
    route.kind === 'cluster-town'
      ? [
          { name: 'Home', url: '/' },
          { name: 'Vacation rentals', url: '/vacation-rentals' },
          { name: cluster.name, url: clusterHubPath(cluster) },
          { name: route.town.town, url: canonical },
        ]
      : [
          { name: 'Home', url: '/' },
          { name: 'Vacation rentals', url: '/vacation-rentals' },
          { name: cluster.name, url: canonical },
        ];

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.url),
    })),
  };

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name:
      route.kind === 'cluster-town'
        ? `${cluster.name} in ${route.town.town} · stayviaowner`
        : `${cluster.hub.h1} · stayviaowner`,
    description: route.kind === 'cluster-town' ? route.town.metaDescription : cluster.hub.metaDescription,
    url: canonical,
  };

  const blocks: object[] = [breadcrumb, collection];

  if (route.kind === 'cluster-town' && route.town.faqs.length > 0) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: route.town.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  if (route.kind === 'cluster-hub') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: cluster.towns.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${cluster.name} in ${t.town}`,
        url: abs(clusterTownPath(cluster, t)),
      })),
    });
  }

  return JSON.stringify(blocks);
}

// ── styles ───────────────────────────────────────────────────────────

const crumbListStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)' };
const eyebrowStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontWeight: 700, margin: 0 };
const h1Style: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 };
const heroLeadStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', maxWidth: '48rem', margin: '1rem 0 0' };
const ctaNoteStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0.75rem 0 0' };
const bodyStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1rem', lineHeight: 1.7, color: 'var(--ink-secondary)', margin: '0.5rem 0 0' };
const h2Style: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink-primary)', margin: 0 };
const h3Style: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink-primary)', margin: 0 };
const faqStyle: React.CSSProperties = { borderRadius: '0.6rem', border: '1px solid var(--border-subtle)', padding: '0.95rem 1.15rem', background: 'var(--surface-overlay)' };
const faqSummaryStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink-primary)', cursor: 'pointer' };
const faqAnswerStyle: React.CSSProperties = { margin: '0.7rem 0 0', fontFamily: 'var(--font-inter)', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-secondary)' };
const linkCardStyle: React.CSSProperties = { borderRadius: '0.85rem', border: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)', padding: '1.1rem 1.25rem' };
const linkCardTitleStyle: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-inter)', fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)' };
const sideLinkStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--ink-secondary)', textDecoration: 'none' };
const primaryCtaStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: MINT, color: '#0a1930', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, padding: '0.9rem 1.6rem', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 12px 30px -12px rgba(55,208,161,0.7)' };
const ctaCardStyle: React.CSSProperties = { borderRadius: '0.85rem', border: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)', padding: '1.25rem' };
const ctaCardEyebrowStyle: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)' };
const ctaCardTitleStyle: React.CSSProperties = { margin: '0.4rem 0 0.9rem', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink-primary)', lineHeight: 1.35 };
const ctaCardButtonStyle: React.CSSProperties = { display: 'block', textAlign: 'center', background: MINT, color: '#0a1930', fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 700, padding: '0.8rem 1rem', borderRadius: '0.6rem', textDecoration: 'none' };
const townCardStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.15rem 1.25rem', borderRadius: '0.85rem', border: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)', textDecoration: 'none' };
const townCardKickerStyle: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-inter)', fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)' };
const townCardTitleStyle: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-inter)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink-primary)' };
const townCardMetaStyle: React.CSSProperties = { margin: '0.15rem 0 0', fontFamily: 'var(--font-inter)', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--ink-tertiary)' };
const townCardArrowStyle: React.CSSProperties = { marginTop: '0.35rem', fontFamily: 'var(--font-inter)', fontSize: '0.82rem', fontWeight: 700, color: MINT };
const secondaryLinkStyle: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' };
