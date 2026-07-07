import { DISCOVERY_SECTIONS } from '@lib/discovery/sections';
import { PropertyCardStandard } from '@/features/cards';

/**
 * Hand-selected editorial rail used on the marketing home page below
 * the workspace fold.
 *
 * Pre-H2 this pulled from `mock-italy/ALL_STAYS` (fabricated Italian
 * villa data). Post-H2 it pulls from the G1 curated discovery
 * sections - same hand-picked editorial energy, but each card now
 * routes to a real Expedia search via `/r/[id]` with affiliate
 * attribution.
 *
 * Source: `DISCOVERY_SECTIONS[0].properties` (the "Trending now"
 * section). Same data as the homepage workspace's first rail; the
 * marketing surface re-uses it so a curator only edits one list.
 */
export function FeaturedStays() {
  const trending = DISCOVERY_SECTIONS[0];
  if (!trending) return null;
  const featured = trending.properties.slice(0, 6);

  return (
    <section
      className="relative w-full"
      style={{
        background:
          'linear-gradient(180deg, var(--surface-raised) 0%, var(--featured-bg) 22%, var(--featured-bg) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-32">
        <div className="mb-12 max-w-2xl">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--featured-ink-secondary)',
            }}
          >
            A taste of the catalog
          </p>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-lg)',
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--featured-ink-primary)',
            }}
          >
            Hand-selected
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--featured-accent)' }}>
              by the concierge.
            </em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <PropertyCardStandard key={property.id} property={property} dense />
          ))}
        </div>
      </div>
    </section>
  );
}
