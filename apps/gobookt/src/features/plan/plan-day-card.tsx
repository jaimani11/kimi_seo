import Image from 'next/image';
import { ArrowRight } from '@/features/shared/icons';
import type { PlanDay, PlanSlot } from '@lib/plan/types';
import {
  formatAverageRating,
  formatPerPerson,
  formatReviewCount,
} from '@/features/experience-cards/format';
import { ReasoningChips } from '@/features/experience-cards/reasoning-chips';
import { partnerCtaLabel } from '@lib/branding/provider-branding';
import { formatExperienceDuration } from '@core/experience';

const TIME_BAND_LABELS: Record<PlanSlot['timeBand'], string> = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function PlanDayCard({ day }: { day: PlanDay }) {
  return (
    <article
      className="relative rounded-2xl border p-6 md:p-8"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <header className="flex flex-wrap items-baseline gap-4 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <p
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Day {day.dayNumber}
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '1.7rem',
            lineHeight: 1.1,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {day.themeLabel}
        </h2>
      </header>

      {day.rationale ? (
        <p
          className="mt-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '0.92rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: '0.6rem 0 0',
          }}
        >
          {day.rationale}
        </p>
      ) : null}

      <ol className="mt-6 flex flex-col gap-5">
        {day.slots.map((slot) => (
          <li key={slot.id} className="grid grid-cols-1 gap-4 md:grid-cols-[7rem_1fr]">
            <div className="flex flex-col">
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                }}
              >
                {TIME_BAND_LABELS[slot.timeBand]}
              </span>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                  maxWidth: '20rem',
                }}
              >
                {slot.brief}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {slot.picks.length === 0 ? (
                <EmptyPickNote />
              ) : (
                slot.picks.map(({ experience, reserveHref }) => {
                  const rating = formatAverageRating(experience.reviews.averageRating);
                  const duration = formatExperienceDuration(experience.duration);
                  const cover = experience.photos[0]?.url ?? null;
                  return (
                    <div
                      key={experience.id}
                      className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-stretch md:gap-4"
                      style={{
                        background: 'var(--surface-base)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      {cover ? (
                        <div
                          className="relative shrink-0 overflow-hidden rounded-lg"
                          style={{ width: '8.5rem', height: '8.5rem', background: '#222' }}
                        >
                          <Image
                            src={cover}
                            alt={experience.title}
                            fill
                            sizes="9rem"
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        </div>
                      ) : null}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.6rem',
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: 'var(--ink-tertiary)',
                            margin: 0,
                          }}
                        >
                          {[duration, rating ? `${rating}★ · ${formatReviewCount(experience.reviews.total)} reviews` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <h3
                          style={{
                            fontFamily: 'var(--font-fraunces)',
                            fontSize: '1rem',
                            fontWeight: 500,
                            lineHeight: 1.2,
                            letterSpacing: '-0.01em',
                            color: 'var(--ink-primary)',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          <a
                            href={`/experiences/${experience.productCode}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {experience.title}
                          </a>
                        </h3>
                        <ReasoningChips experience={experience} max={3} size="sm" />
                        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 pt-1">
                          <span
                            style={{
                              fontFamily: 'var(--font-fraunces)',
                              fontSize: '0.92rem',
                              color: 'var(--ink-primary)',
                            }}
                          >
                            {experience.pricing.fromPerPerson > 0
                              ? `From ${formatPerPerson(experience.pricing.fromPerPerson, experience.pricing.currency)} a person`
                              : 'Quote on request'}
                          </span>
                          <a
                            href={reserveHref}
                            target="_blank"
                            rel="sponsored nofollow noopener noreferrer"
                            data-plan-reserve="1"
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-opacity hover:opacity-90"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              background: 'var(--accent-primary)',
                              color: '#1a1a1a',
                              textDecoration: 'none',
                            }}
                          >
                            {partnerCtaLabel('viator', 'reserve', { arrow: false })}
                            <ArrowRight size={12} strokeWidth={2.4} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function EmptyPickNote() {
  return (
    <p
      className="rounded-xl border border-dashed px-4 py-3"
      style={{
        fontFamily: 'var(--font-fraunces)',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '0.88rem',
        lineHeight: 1.5,
        color: 'var(--ink-tertiary)',
        borderColor: 'var(--border-subtle)',
        background: 'transparent',
        margin: 0,
      }}
    >
      No Viator picks matched this slot — leave it free, or explore the catalog and add something
      yourself.
    </p>
  );
}
