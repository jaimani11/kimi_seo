import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '@/features/shared/icons';
import { getBillingSubsystem } from '@lib/billing';
import { getServerAuth, ownerOf } from '@lib/auth';

export const metadata: Metadata = {
  title: 'Mock checkout · gobookt',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stand-in for Stripe Checkout when the project is in mock mode (no
 * STRIPE_SECRET_KEY/_WEBHOOK_SECRET/_PRICE_ID set).
 *
 * MockBillingProvider already grants premium to every authenticated
 * user, so this page doesn't need to mutate state - it just simulates
 * the redirect cycle so the UI flow is identical to real Stripe:
 *   /trips/.../itinerary → Upgrade → /billing/mock-checkout
 *     → click "Pretend to pay" → /billing/return → trip itinerary.
 *
 * If the project isn't actually in mock mode (someone hit this URL
 * directly while Stripe is configured), redirect them to the workspace
 * - the Stripe flow goes through `/api/billing/checkout` instead.
 */
interface PageProps {
  searchParams: Promise<{ return?: string; cancel?: string }>;
}

export default async function MockCheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const returnUrl = params.return ?? '/';
  const cancelUrl = params.cancel ?? '/';

  const { kind } = getBillingSubsystem();
  if (kind !== 'mock') {
    redirect('/');
  }

  // We don't need the owner for the mock flow, but resolving it keeps
  // the cookie session warm + bounces anonymous users to sign-in.
  const auth = await getServerAuth();
  const owner = ownerOf(auth);
  if (owner.ownerKind === 'session') {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
  }

  async function pretendToPay(): Promise<void> {
    'use server';
    redirect(returnUrl);
  }

  async function pretendToCancel(): Promise<void> {
    'use server';
    redirect(cancelUrl);
  }

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
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          [ mock checkout ]
        </p>
        <h1
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-md, 2.25rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          This is what Stripe Checkout would be.
        </h1>
        <p
          className="mt-3 max-w-lg"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          You don&apos;t have <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>,
          and <code>STRIPE_PRICE_ID</code> set, so the demo is running on the mock billing provider.
          Every authenticated user is already premium - clicking through here just bounces you back
          to your trip.
        </p>
      </header>

      <section
        className="rounded-lg p-6 md:p-8"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <p
          className="mb-6"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          Real-mode setup is a few minutes - see <code>docs/billing.md</code> for the Stripe CLI
          walkthrough. Test cards work end-to-end with <code>4242 4242 4242 4242</code>.
        </p>
        <div className="flex flex-wrap gap-3">
          <form action={pretendToPay}>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                letterSpacing: '0.04em',
                padding: '0.7rem 1.1rem',
                background: 'var(--ink-primary)',
                color: 'var(--surface-base)',
                border: 'none',
                borderRadius: '0.4rem',
                cursor: 'pointer',
              }}
            >
              Pretend to pay
            </button>
          </form>
          <form action={pretendToCancel}>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                letterSpacing: '0.04em',
                padding: '0.7rem 1.1rem',
                background: 'transparent',
                color: 'var(--ink-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.4rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
