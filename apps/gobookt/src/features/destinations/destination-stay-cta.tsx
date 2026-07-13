import { ArrowRight } from '@/features/shared/icons';
import type { CuratedDestination } from '@lib/curation/destinations';
import {
  partnerAriaLabel,
  partnerCtaLabel,
  partnerProvenancePhrase,
} from '@lib/branding/provider-branding';

interface DestinationStayCtaProps {
  destination: CuratedDestination;
  /** Pre-built `/r/[id]` affiliate URL for the partner stay search
   *  at this destination. Built server-side so dates roll forward
   *  daily. The href is provider-routed internally; the partner is
   *  hidden on the surface in neutral/hidden branding mode. */
  stayHref: string;
  /** Provider id behind the href. Determines the branding mode's
   *  CTA label + aria label + disclosure phrasing. */
  providerId: string;
}

/**
 * "Where to stay" section. Until we have live stay inventory, we send
 * the visitor straight to the partner's search with the destination,
 * default dates, and party already filled in.
 *
 * The partner is *named only when branding mode is `explicit`*. In
 * the default neutral mode the CTA reads "Find dates →" and the
 * disclosure refers to "our partner". The underlying URL is still
 * affiliate-tagged and routes through /r/[id]; only the surface
 * language is brand-neutral.
 *
 * Replaces the old mock-italy FeaturedStays grid. We don't show fake
 * stays - we show the affiliate hand-off explicitly. The visitor's
 * trust is more valuable than a denser-looking page.
 */
export function DestinationStayCta({
  destination,
  stayHref,
  providerId,
}: DestinationStayCtaProps) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-2 pb-4 md:px-8 md:pt-6 md:pb-6">
      <div
        className="rounded-[18px] border p-6 md:p-8"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
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
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Search live availability in {destination.name}.
        </h2>
        <p
          className="mt-3 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '0.95rem',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-tertiary)',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          We hand off to {partnerProvenancePhrase(providerId)} for real-time stay inventory. The
          link below carries the partner id automatically; the price you pay is the same.
        </p>

        <a
          href={stayHref}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          aria-label={partnerAriaLabel(providerId, `stays in ${destination.name}`)}
          className="mt-5 inline-flex items-center gap-2 transition-transform hover:translate-x-0.5"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '999px',
            padding: '0.55rem 1rem',
            background: 'var(--accent-primary-soft)',
            textDecoration: 'none',
          }}
        >
          {partnerCtaLabel(providerId, 'find-dates', { arrow: false })}
          <ArrowRight size={12} strokeWidth={2.4} />
        </a>
      </div>
    </section>
  );
}
