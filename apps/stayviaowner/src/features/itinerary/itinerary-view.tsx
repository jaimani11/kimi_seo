import Link from 'next/link';
import type { Itinerary } from '@core/itinerary';
import { ArrowRight } from '@/features/shared/icons';
import { SlotCard } from './slot-card';

interface ItineraryViewProps {
  itinerary: Itinerary;
  destinationName: string;
  heroStayName: string;
  nights: number;
}

/**
 * Server-rendered itinerary view. Three days × ~5 slots each. Voice
 * is the same as the rest of the app (italic Fraunces fragments,
 * Inter labels, geist-mono details).
 */
export function ItineraryView({
  itinerary,
  destinationName,
  heroStayName,
  nights,
}: ItineraryViewProps) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-8 md:py-14">
      <header className="mb-8 flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 self-start"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          <ArrowRight size={11} strokeWidth={2.2} style={{ transform: 'rotate(180deg)' }} />
          Back to workspace
        </Link>
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Day-by-day · {destinationName}
          {nights > 0 ? ` · ${nights} ${nights === 1 ? 'night' : 'nights'}` : ''}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-lg, 3.5rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {heroStayName}
        </h1>
        <p
          className="mt-2 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          {itinerary.summary}
        </p>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.625rem',
            letterSpacing: '0.04em',
            color: 'var(--ink-tertiary)',
          }}
        >
          {itinerary.source === 'curated'
            ? 'Hand-curated · adjust to taste'
            : 'Quickly synthesized · use as a starting frame'}
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {itinerary.days.map((day) => (
          <section key={day.dayNumber}>
            <header className="mb-3 flex items-baseline gap-3">
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-tertiary)',
                }}
              >
                Day {day.dayNumber}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-display-sm)',
                  fontWeight: 400,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {day.theme}
              </h2>
            </header>
            <div className="flex flex-col gap-3">
              {day.slots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12">
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-tertiary)',
            lineHeight: 1.5,
          }}
        >
          Treat it as a frame, not a schedule. The hours that matter most are almost always the ones
          you didn&apos;t plan for.
        </p>
      </footer>
    </main>
  );
}
