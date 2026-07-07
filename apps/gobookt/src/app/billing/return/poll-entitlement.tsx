'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface EntitlementResponse {
  plan: 'free' | 'premium';
  source: string;
  premiumUntil: string | null;
}

const POLL_INTERVAL_MS = 1000;
const POLL_MAX_MS = 15_000;

/**
 * Client poller. After Stripe Checkout redirects to /billing/return,
 * we poll /api/billing/entitlement until the webhook flips the
 * subscription to premium (or we time out).
 *
 * On success: navigate back to the return path (the trip itinerary
 * page that triggered the upgrade), where the gate now passes.
 * On timeout: show a soft message - the webhook may be delayed
 * (Stripe usually delivers in <1s but retries can stall).
 */
export function PollEntitlement() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get('return') ?? '/';
  const [state, setState] = useState<'polling' | 'premium' | 'timeout' | 'error'>('polling');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function tick(): Promise<void> {
      if (cancelled) return;
      try {
        const resp = await fetch('/api/billing/entitlement', { cache: 'no-store' });
        const data = (await resp.json()) as EntitlementResponse;
        if (cancelled) return;
        if (data.plan === 'premium') {
          setState('premium');
          // Tiny pause so the user sees the success state, then navigate.
          setTimeout(() => router.replace(returnTo), 600);
          return;
        }
        const e = Date.now() - start;
        setElapsed(e);
        if (e >= POLL_MAX_MS) {
          setState('timeout');
          return;
        }
        setTimeout(() => void tick(), POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        console.error('[billing/return] poll failed', err);
        setState('error');
      }
    }
    void tick();
    return () => {
      cancelled = true;
    };
  }, [router, returnTo]);

  const message: string =
    state === 'premium'
      ? 'You’re premium. Heading back to your trip…'
      : state === 'timeout'
        ? 'The webhook is taking longer than usual. Refresh in a moment, or head back - your subscription will catch up.'
        : state === 'error'
          ? 'We couldn’t reach the entitlement check. Try refreshing.'
          : 'Confirming your subscription with Stripe…';

  return (
    <div className="flex flex-col gap-3">
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body)',
          fontStyle: 'italic',
          fontWeight: 300,
          color: 'var(--ink-secondary)',
          lineHeight: 1.55,
        }}
      >
        {message}
      </p>
      {state === 'polling' && (
        <p
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
            color: 'var(--ink-tertiary)',
          }}
        >
          {Math.floor(elapsed / 1000)}s
        </p>
      )}
      {(state === 'timeout' || state === 'error') && (
        <a
          href={returnTo}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--accent-primary)',
            textDecoration: 'underline',
          }}
        >
          Back to your trip
        </a>
      )}
    </div>
  );
}
