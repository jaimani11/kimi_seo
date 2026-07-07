import Link from 'next/link';
import { ArrowRight } from '@/features/shared/icons';
import { UpgradeCta } from './upgrade-cta';

interface UpgradeCardProps {
  destinationName: string;
  reason: 'anonymous' | 'free';
  /** Path to come back to after sign-in / checkout completes. */
  returnPath: string;
  /** Path to come back to if the user cancels checkout. */
  cancelPath: string;
}

/**
 * Soft-paywall card. Shown on the itinerary page when the destination
 * falls through to synthesized AND the caller doesn't have premium.
 *
 * Two reasons, two CTAs:
 *   - 'anonymous' → "Sign in to upgrade" (forces auth before checkout).
 *   - 'free'      → "Upgrade to Premium" (direct to Stripe Checkout
 *                    in real mode; in-app mock-checkout in mock mode).
 *
 * Curated Italian destinations bypass the gate entirely - the curated
 * library always renders, no upgrade required. The gate only fires for
 * the synthesized-itinerary path.
 */
export function UpgradeCard({ destinationName, reason, returnPath, cancelPath }: UpgradeCardProps) {
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
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-md, 2.25rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Day-by-day for everywhere - premium.
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
          We hand-write three-day plans for the seven Italian regions we know best - Tuscany,
          Umbria, Amalfi, Rome, Venice, Lake Como, Cinque Terre. Anywhere else needs the model, and
          that&apos;s premium.
        </p>
      </header>

      <section
        className="rounded-lg p-6 md:p-8"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '0.75rem',
          }}
        >
          {reason === 'anonymous'
            ? `Sign in to plan ${destinationName} day-by-day`
            : `Unlock day-by-day plans for ${destinationName}`}
        </h2>
        <p
          className="mb-6 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-sm)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          {reason === 'anonymous'
            ? 'Premium plans are tied to a signed-in account so they survive across devices and browsers. Sign in first, then upgrade.'
            : 'Premium covers everywhere outside the curated library - three days written for your trip from the same editorial frame, refined per destination.'}
        </p>

        <ul
          className="mb-8 flex flex-col gap-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-secondary)',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {[
            'Three-day plans for any destination, generated from your trip intent.',
            'Same editorial voice as our hand-curated Italian regions.',
            'Adjustable - drag, swap, or rewrite slots after the fact.',
            'Cancel anytime; period you paid for is honored.',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span
                style={{
                  display: 'inline-block',
                  width: '0.35rem',
                  height: '0.35rem',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  marginTop: '0.55rem',
                  flexShrink: 0,
                }}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <UpgradeCta
          signInRequired={reason === 'anonymous'}
          returnPath={returnPath}
          cancelPath={cancelPath}
        />

        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
            color: 'var(--ink-tertiary)',
          }}
        >
          {reason === 'free'
            ? 'Stripe handles cards. We never see your number.'
            : 'You can keep browsing curated trips while signed out.'}
        </p>
      </section>

      <footer className="mt-10">
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
          Curated Italy stays free for everyone - Tuscany, Rome, Venice and the others render their
          three days the moment you save the trip.
        </p>
      </footer>
    </main>
  );
}
