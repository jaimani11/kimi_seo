import type { Experience } from '@core/experience';

/**
 * "Picked because: …" chips that distill an experience's strongest
 * selling points into 1–4 short pills.
 *
 * Selection rules, in priority order (so the most decision-relevant
 * chips appear first):
 *
 *   1. Top-rated  (≥4.7 average + ≥100 reviews)        - social proof
 *   2. Bestseller (≥1,500 reviews)                       - momentum
 *   3. Free cancellation                                  - low risk
 *   4. Skip the line                                      - value lift
 *   5. Instant confirmation                               - frictionless
 *   6. Private tour                                       - personalization
 *   7. Likely to sell out                                 - urgency
 *   8. Short (≤2h)  /  Half-day  /  Full-day              - planning fit
 *
 * Affiliate-marketing-grade short. No emoji, no clutter. Designed for
 * card surfaces; for a sticky reserve panel use the longer-form
 * reasons section instead.
 */
export function ReasoningChips({
  experience,
  max = 3,
  tone = 'on-light',
  size = 'sm',
}: {
  experience: Experience;
  max?: number;
  tone?: 'on-light' | 'on-dark';
  size?: 'sm' | 'md';
}) {
  const chips = pickReasoningChips(experience).slice(0, max);
  if (chips.length === 0) return null;

  return (
    <ul
      className="flex flex-wrap gap-1"
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {chips.map((c) => (
        <li
          key={c.id}
          className="inline-flex items-center gap-1"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: size === 'md' ? '0.7rem' : '0.62rem',
            letterSpacing: '0.02em',
            fontWeight: 500,
            padding: size === 'md' ? '0.25rem 0.6rem' : '0.18rem 0.5rem',
            borderRadius: '999px',
            color:
              tone === 'on-dark'
                ? c.urgent
                  ? '#FFC9A0'
                  : 'rgba(237,230,219,0.92)'
                : c.urgent
                  ? '#A04030'
                  : 'var(--ink-secondary)',
            background:
              tone === 'on-dark'
                ? c.urgent
                  ? 'rgba(224, 108, 80, 0.18)'
                  : 'rgba(237,230,219,0.10)'
                : c.urgent
                  ? 'rgba(224, 108, 80, 0.12)'
                  : 'var(--accent-primary-soft, rgba(120,160,140,0.10))',
            border:
              tone === 'on-dark'
                ? '1px solid rgba(237,230,219,0.18)'
                : '1px solid var(--border-subtle)',
            whiteSpace: 'nowrap',
          }}
        >
          {c.label}
        </li>
      ))}
    </ul>
  );
}

interface ReasoningChip {
  id: string;
  label: string;
  /** Urgent chips render in a warmer color (sell-out, last-chance). */
  urgent?: boolean;
}

export function pickReasoningChips(experience: Experience): ReasoningChip[] {
  const chips: ReasoningChip[] = [];
  const { reviews, flags, duration, confirmation } = experience;

  const rating = reviews.averageRating ?? 0;
  if (rating >= 4.7 && reviews.total >= 100) {
    chips.push({ id: 'top-rated', label: `Top-rated · ${rating.toFixed(1)}★` });
  } else if (rating >= 4.5 && reviews.total >= 50) {
    chips.push({ id: 'well-reviewed', label: `${rating.toFixed(1)}★ · ${reviews.total} reviews` });
  }

  if (reviews.total >= 1500) {
    chips.push({ id: 'bestseller', label: 'Bestseller' });
  }

  if (flags.includes('free-cancellation')) {
    chips.push({ id: 'free-cancellation', label: 'Free cancellation' });
  }

  if (flags.includes('skip-the-line')) {
    chips.push({ id: 'skip-the-line', label: 'Skip the line' });
  }

  if (confirmation === 'instant') {
    chips.push({ id: 'instant', label: 'Instant confirmation' });
  }

  if (flags.includes('private-tour')) {
    chips.push({ id: 'private', label: 'Private tour' });
  }

  if (flags.includes('likely-to-sell-out')) {
    chips.push({ id: 'sellout', label: 'Likely to sell out', urgent: true });
  }

  if (flags.includes('special-offer')) {
    chips.push({ id: 'special-offer', label: 'Special offer', urgent: true });
  }

  // Duration band as a final hint - skip if we already filled the
  // chip budget on stronger signals.
  if (chips.length < 3) {
    const minutes =
      duration.kind === 'fixed'
        ? duration.minutes
        : duration.kind === 'range'
          ? duration.fromMinutes
          : null;
    if (minutes !== null && minutes > 0) {
      if (minutes <= 120) chips.push({ id: 'quick', label: 'Short pick · ≤2h' });
      else if (minutes <= 300) chips.push({ id: 'half-day', label: 'Half-day' });
      else if (minutes <= 600) chips.push({ id: 'full-day', label: 'Full-day' });
    }
  }

  if (flags.includes('new-on-platform')) {
    chips.push({ id: 'new', label: 'New on Viator' });
  }

  return chips;
}
