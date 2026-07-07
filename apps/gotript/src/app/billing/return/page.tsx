import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@/features/shared/icons';
import { PollEntitlement } from './poll-entitlement';

export const metadata: Metadata = {
  title: 'Confirming your subscription · gotript',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Post-checkout return page. Stripe Checkout redirects here on success.
 *
 * Renders a thin "confirming…" UI that polls /api/billing/entitlement
 * until the webhook flips the subscription. The webhook usually lands
 * within <1s but Stripe retries on any 5xx so we allow up to 15s.
 *
 * Once entitled, navigates back to `?return=<path>` (the trip page
 * that started the flow). The gate now passes, so the user sees the
 * itinerary they came for.
 */
export default function BillingReturnPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12 md:px-8 md:py-16">
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
        <h1
          className="mt-4"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-md, 2.25rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Confirming…
        </h1>
      </header>
      <Suspense
        fallback={
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body)',
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'var(--ink-secondary)',
            }}
          >
            Confirming your subscription with Stripe…
          </p>
        }
      >
        <PollEntitlement />
      </Suspense>
    </main>
  );
}
