'use client';

import { useState } from 'react';

interface UpgradeCtaProps {
  /** When true, button text says "Sign in to upgrade" + behaves accordingly. */
  signInRequired: boolean;
  returnPath: string;
  cancelPath: string;
}

/**
 * Client-side CTA that kicks off a checkout flow.
 *
 * Calls POST /api/billing/checkout, then window.location to the URL
 * the provider returned (real Stripe Checkout in stripe mode, in-app
 * /billing/mock-checkout in mock mode).
 *
 * For anonymous owners (signInRequired=true), redirects to /sign-in
 * with a return-to query - Clerk will land them back here after sign-
 * in, then they can click again to actually start checkout.
 */
export function UpgradeCta({ signInRequired, returnPath, cancelPath }: UpgradeCtaProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    if (signInRequired) {
      // Send them to sign-in with a return path so they bounce back
      // to the same itinerary page after sign-in.
      window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(returnPath)}`);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const origin = window.location.origin;
      const resp = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${origin}/billing/return?return=${encodeURIComponent(returnPath)}`,
          cancelUrl: `${origin}${cancelPath}`,
        }),
      });
      const data = (await resp.json()) as { url?: string; error?: string };
      if (!resp.ok || !data.url) {
        setErr(data.error ?? 'Could not start checkout');
        setLoading(false);
        return;
      }
      window.location.assign(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not start checkout');
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? 'Opening checkout…'
    : signInRequired
      ? 'Sign in to upgrade'
      : 'Upgrade to Premium';

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        aria-busy={loading}
        aria-label={
          signInRequired
            ? 'Sign in to upgrade to premium'
            : 'Upgrade to premium - opens Stripe Checkout in a new step'
        }
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-body-sm)',
          letterSpacing: '0.04em',
          padding: '0.7rem 1.1rem',
          background: 'var(--ink-primary)',
          color: 'var(--surface-base)',
          border: 'none',
          borderRadius: '0.4rem',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 120ms ease',
        }}
      >
        {buttonLabel}
      </button>
      {err && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            color: 'var(--ink-tertiary)',
          }}
        >
          {err}. Try again or refresh the page.
        </p>
      )}
    </div>
  );
}
