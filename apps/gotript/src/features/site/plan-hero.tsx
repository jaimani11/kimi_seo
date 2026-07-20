import { PlanForm } from '@/features/plan/plan-form';

/**
 * Homepage PLAN hero — gotript's flagship differentiation. The multi-category
 * hero above serves the visitor who already knows what they want; this band
 * serves the one who only has an idea, and turns it into a bookable day-by-day
 * trip via the AI planner (/plan) that hands off to tracked Expedia search.
 *
 * It replaces the retired Viator "concierge" hero with an on-brand, Expedia-
 * powered planning surface — same slot, real job.
 */
export function PlanHero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage:
          'radial-gradient(1200px 520px at 50% -10%, color-mix(in srgb, var(--accent-primary) 15%, transparent) 0%, transparent 62%)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            AI trip planner · Expedia-powered
          </p>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(2rem, 4.4vw, 3.1rem)',
              fontWeight: 400,
              lineHeight: 1.04,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            Don&rsquo;t just search.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              Plan the whole trip.
            </em>
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--ink-secondary)',
              margin: '1rem auto 0',
            }}
          >
            Tell us the place, how many days, and the vibe — get an AI-built,
            day-by-day itinerary in seconds, then book every piece on Expedia in
            one flow.
          </p>
        </header>

        <div className="mt-9">
          <PlanForm />
        </div>

        <p
          className="mt-4 text-center"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.74rem',
            color: 'var(--ink-tertiary)',
            margin: '1rem 0 0',
          }}
        >
          Free · no account · same prices as booking direct.
        </p>
      </div>
    </section>
  );
}
