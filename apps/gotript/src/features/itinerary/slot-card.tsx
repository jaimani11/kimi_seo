import type { ItinerarySlot } from '@core/itinerary';

const KIND_LABEL: Record<ItinerarySlot['kind'], string> = {
  activity: 'Activity',
  meal: 'Meal',
  transit: 'Transit',
  rest: 'Rest',
};

const HINT_LABEL: Record<ItinerarySlot['startHint'], string> = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late: 'Late',
};

export function SlotCard({ slot }: { slot: ItinerarySlot }) {
  return (
    <article
      className="rounded-[14px] border p-4"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {HINT_LABEL[slot.startHint]} · {KIND_LABEL[slot.kind]}
        </span>
        {slot.durationMinutes ? (
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.625rem',
              color: 'var(--ink-tertiary)',
              letterSpacing: '0.04em',
            }}
          >
            ~{Math.round(slot.durationMinutes / 30) * 0.5}h
          </span>
        ) : null}
      </div>
      <h3
        className="mt-1"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body-lg)',
          fontWeight: 400,
          color: 'var(--ink-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {slot.title}
      </h3>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body-sm)',
          fontStyle: 'italic',
          fontWeight: 300,
          lineHeight: 1.5,
          color: 'var(--ink-secondary)',
        }}
      >
        {slot.detail}
      </p>
      {slot.tags && slot.tags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {slot.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border px-2 py-0.5"
              style={{
                background: 'var(--surface-overlay)',
                borderColor: 'var(--border-subtle)',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.625rem',
                color: 'var(--ink-tertiary)',
                letterSpacing: '0.02em',
              }}
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
