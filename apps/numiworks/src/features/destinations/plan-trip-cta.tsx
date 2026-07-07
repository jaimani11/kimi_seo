import Link from 'next/link';
import { ArrowRight } from '@/features/shared/icons';
import type { CuratedDestination } from '@lib/curation/destinations';

interface PlanTripCtaProps {
  destination: CuratedDestination;
}

/**
 * Bottom-of-page call-to-action. Lands the visitor in the workspace
 * with a destination-specific prompt seeded - `UrlInit` (B3) consumes
 * `?prompt=` on first paint and clears it from the URL.
 *
 * The prompt mirrors how a user would phrase the search themselves:
 * "{Name}, 7 nights, couple, walkable" - short, structured.
 */
export function PlanTripCta({ destination }: PlanTripCtaProps) {
  const prompt = `${destination.name}, 7 nights, couple, walkable`;
  const href = `/?prompt=${encodeURIComponent(prompt)}`;

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
          Start planning
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
          Plan your trip to {destination.name}
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
          Tell the concierge what you&apos;re after - a few words is enough. Stays materialize, you
          compare, you save what fits.
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
          Open the concierge
          <ArrowRight size={16} strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  );
}
