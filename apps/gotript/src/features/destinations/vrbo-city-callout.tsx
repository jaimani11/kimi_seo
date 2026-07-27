import { buildExpediaCategoryUrl } from '@lib/affiliate/expedia-multicategory';
import type { SeoCity } from '@lib/seo/cities';

/**
 * VRBO callout shown at the top of every destination guide page.
 *
 * Every social click, every organic search, every internal link into
 * a destination guide hits this callout — turning 100% of destination-
 * page traffic into VRBO-visible traffic. VRBO commissions are the
 * highest in the Expedia Group family (8-10% vs 3-4% Expedia hotels),
 * so this single component is the highest per-visitor revenue lift on
 * the site.
 *
 * The button routes to VRBO's destination search with our camref
 * attached via `buildExpediaCategoryUrl('vacation-rentals', …)`.
 */
export function VrboCityCallout({ city }: { city: SeoCity }) {
  const vrboUrl = buildExpediaCategoryUrl('vacation-rentals', {
    destination: `${city.name}, ${city.countryName}`,
  });

  return (
    <section className="mx-auto max-w-4xl px-6 pt-6 md:pt-10">
      <a
        href={vrboUrl}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="group block rounded-2xl border-2 transition-transform hover:scale-[1.005]"
        style={{
          background: 'linear-gradient(135deg, #005EA6 0%, #0079C1 100%)',
          borderColor: '#FBC700',
          padding: '1.4rem 1.6rem',
          textDecoration: 'none',
          boxShadow: '0 8px 24px -8px rgba(0,120,193,0.35)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.66rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#FBC700',
                fontWeight: 800,
                margin: 0,
              }}
            >
              Vacation rentals in {city.name} · VRBO
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'clamp(1.05rem, 1.7vw, 1.25rem)',
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: '-0.015em',
                color: '#ffffff',
                margin: 0,
              }}
            >
              Prefer a whole home? Cabins, villas &amp; apartments in {city.name}.
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.86rem',
                lineHeight: 1.45,
                color: 'rgba(255,255,255,0.88)',
                margin: 0,
              }}
            >
              Full kitchens and room for the whole group — whole-home
              rentals on Vrbo.
            </p>
          </div>
          <div
            style={{
              flexShrink: 0,
              background: '#FBC700',
              color: '#0A2B45',
              padding: '0.75rem 1.15rem',
              borderRadius: '999px',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.88rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            See rentals →
          </div>
        </div>
      </a>
    </section>
  );
}
