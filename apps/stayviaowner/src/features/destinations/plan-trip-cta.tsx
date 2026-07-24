import Link from 'next/link';
import { ArrowRight } from '@/features/shared/icons';
import type { CuratedDestination } from '@lib/curation/destinations';

interface PlanTripCtaProps {
  destination: CuratedDestination;
}

/**
 * Bottom-of-page call-to-action — stayviaowner's WHOLE-HOME angle (villas,
 * cabins, cottages), deliberately NOT gotript's "plan your trip / concierge"
 * clone, so the /destinations page reads as a rental brand and doesn't
 * duplicate the sibling. Sends the visitor to the vacation-rentals search.
 */
export function PlanTripCta({ destination }: PlanTripCtaProps) {
  const href = '/vacation-rentals';

  return (
    <section className="mx-auto max-w-3xl px-6 pt-4 pb-14 md:px-8 md:pb-20">
      <div
        className="rounded-[18px] border p-6 md:p-8"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-emphasis)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Where to stay
        </p>
        <h2
          className="mt-1 mb-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-md, 2rem)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Rent a whole home in {destination.name}
        </h2>
        <p
          className="mb-5 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          Villas, cabins, cottages and beach houses in {destination.name} — book the whole place
          through Vrbo, with room for the group and a kitchen of your own.
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 transition-opacity hover:opacity-90"
          style={{
            background: 'var(--accent-primary)',
            color: '#14171C',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body)',
            fontWeight: 500,
          }}
        >
          Browse whole-home rentals
          <ArrowRight size={16} strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  );
}
