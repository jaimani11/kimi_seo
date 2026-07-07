import type { Metadata } from 'next';
import { ITALIAN_DESTINATIONS } from '@lib/curation/destinations';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { DestinationCard } from '@/features/destinations/destination-card';

/**
 * Destinations index. Editorial entry point - lists the curated
 * destinations StayScout has written voice/mood content for. The
 * full inventory (stays + things to do) lives on each detail page
 * and is provider-backed (Viator for experiences; Expedia search
 * CTA for stays until real stay inventory lands).
 *
 * Pre-H2 this page imported `STAYS_BY_DESTINATION` from the mock
 * Italian provider to grab a hero photo per destination. After H2
 * the photo comes from `resolveDestinationPhoto` - same hand-curated
 * photo dataset, but no longer routed through a fake provider.
 *
 * The curation file is still Italy-only for now; broader coverage
 * lands when we curate voice/moods for more destinations. The page
 * keeps the editorial framing rather than pretending we have global
 * destination pages already.
 */

export const metadata: Metadata = {
  title: 'Destinations · stayviaowner',
  description: 'Curated destinations and the places worth knowing in each.',
};

export default function DestinationsIndex() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:px-8 md:py-16">
      <header className="mb-8 md:mb-12">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Curated destinations
        </p>
        <h1
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-lg, 3.5rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          Destinations
        </h1>
        <p
          className="mt-3 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          Places we know well. Each one carries an editorial brief and a live things-to-do rail
          when you tap in.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITALIAN_DESTINATIONS.map((d) => {
          const photo = resolveDestinationPhoto({
            name: d.name,
            country: 'IT',
            region: d.region,
          });
          return (
            <DestinationCard
              key={d.slug}
              destination={d}
              imageUrl={photo.url}
              imageAlt={photo.alt}
            />
          );
        })}
      </div>
    </main>
  );
}
