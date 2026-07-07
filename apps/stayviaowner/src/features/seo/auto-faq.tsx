import type { ViatorProductDetail } from '@/providers/viator/types';
import type { Experience } from '@core/experience';
import { formatExperienceDuration } from '@core/experience';

/**
 * Auto-generated FAQ for an experience detail page. Two outputs:
 *
 *   1. Visible accordion (this component, which renders inline).
 *   2. schema.org FAQPage JSON-LD (emitted by `<AutoFaqJsonLd>`), so
 *      Google can surface the Q&A as a dedicated SERP block.
 *
 * Questions are deterministic — derived from product data, not from
 * an LLM call — so every page loads with the same answers and there's
 * no per-request cost. The trade-off is a smaller answer surface but
 * fully reliable accuracy.
 *
 * The two outputs share the same `buildFaqEntries()` builder so the
 * visible accordion and the JSON-LD never drift apart.
 */

export interface FaqEntry {
  /** Stable id used as the accordion `<details>` key. */
  id: string;
  /** Question — always ends with a "?" */
  question: string;
  /** Answer — plain text, no markdown, ≤500 chars. */
  answer: string;
}

interface BuildFaqArgs {
  product: ViatorProductDetail;
  experience: Experience;
}

export function buildFaqEntries({ product, experience }: BuildFaqArgs): FaqEntry[] {
  const entries: FaqEntry[] = [];

  // Duration
  const durationLabel = formatExperienceDuration(experience.duration);
  if (durationLabel) {
    entries.push({
      id: 'duration',
      question: 'How long does this experience last?',
      answer: `This experience runs for ${durationLabel}. Plan around that — most travelers leave a small buffer either side for transit and a snack.`,
    });
  }

  // Cancellation policy
  const cancellation = product.cancellationPolicy?.description?.trim();
  if (cancellation) {
    entries.push({
      id: 'cancellation',
      question: 'What is the cancellation policy?',
      answer: cancellation.slice(0, 500),
    });
  } else if (experience.flags.includes('free-cancellation')) {
    entries.push({
      id: 'cancellation',
      question: 'Can I cancel for free?',
      answer:
        'Yes — this experience offers free cancellation. Cancel through your Viator booking confirmation for a full refund.',
    });
  }

  // Confirmation timing
  if (experience.confirmation === 'instant') {
    entries.push({
      id: 'confirmation',
      question: 'When will I know if my booking is confirmed?',
      answer:
        'Instant confirmation — you get a confirmed booking the moment you finish on Viator. No waiting on the supplier.',
    });
  } else if (experience.confirmation === 'on-request') {
    entries.push({
      id: 'confirmation',
      question: 'When will I know if my booking is confirmed?',
      answer:
        'This is an on-request booking — the supplier confirms within 24–48 hours of your reservation. You will get an email update from Viator.',
    });
  }

  // Inclusions
  const inclusions = (product.inclusions ?? [])
    .map((i) => i.description?.trim())
    .filter((s): s is string => Boolean(s));
  if (inclusions.length > 0) {
    entries.push({
      id: 'whats-included',
      question: 'What is included in the price?',
      answer: shortJoin(inclusions, 3),
    });
  }

  // Exclusions
  const exclusions = (product.exclusions ?? [])
    .map((e) => e.description?.trim())
    .filter((s): s is string => Boolean(s));
  if (exclusions.length > 0) {
    entries.push({
      id: 'whats-not-included',
      question: 'What is not included?',
      answer: shortJoin(exclusions, 3),
    });
  }

  // Suitability — derived from flags
  if (experience.flags.includes('skip-the-line')) {
    entries.push({
      id: 'skip-the-line',
      question: 'Is skip-the-line access included?',
      answer:
        'Yes — this experience includes skip-the-line access. You will bypass the regular ticket queue and head straight in with your guide.',
    });
  }

  if (experience.flags.includes('private-tour')) {
    entries.push({
      id: 'private',
      question: 'Is this a private tour?',
      answer:
        'Yes — your group will be the only guests on this experience. The guide focuses on you, the pace is yours, and itineraries can flex.',
    });
  }

  // Booking on Viator (affiliate transparency — required for trust)
  entries.push({
    id: 'how-booking-works',
    question: 'How does booking work on this site?',
    answer:
      'Reservations are processed by Viator. We hand you off through an affiliate link — the price you pay is identical to booking direct on viator.com, and a small commission funds this site.',
  });

  return entries;
}

function shortJoin(items: readonly string[], n: number): string {
  const picked = items.slice(0, n);
  if (items.length > n) picked.push(`+${items.length - n} more`);
  return picked.join(' · ');
}

// ============== Visible accordion ==============

export function AutoFaq({ product, experience }: BuildFaqArgs) {
  const entries = buildFaqEntries({ product, experience });
  if (entries.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          margin: 0,
        }}
      >
        Frequently asked
      </h2>
      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.id} className="list-none">
            <details
              className="group rounded-xl border p-4 transition-colors"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <summary
                className="flex cursor-pointer items-center justify-between gap-3"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--ink-primary)',
                  listStyle: 'none',
                }}
              >
                <span>{e.question}</span>
                <span
                  aria-hidden
                  className="grid place-items-center transition-transform group-open:rotate-45"
                  style={{
                    width: '1.15rem',
                    height: '1.15rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--ink-tertiary)',
                    fontSize: '0.7rem',
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </summary>
              <p
                className="mt-3"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontWeight: 300,
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                }}
              >
                {e.answer}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============== FAQPage JSON-LD ==============

export function AutoFaqJsonLd({ product, experience }: BuildFaqArgs) {
  const entries = buildFaqEntries({ product, experience });
  if (entries.length === 0) return null;
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: e.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
      }}
    />
  );
}
