'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelBookingButtonProps {
  bookingId: string;
}

/**
 * Inline "Cancel booking" button on the confirmation page. Owner-gated
 * server-side; this client wrapper just sends the POST + refreshes
 * the page on success.
 *
 * Two-click confirmation pattern: first click flips the button to a
 * "Confirm cancel" state, second click actually fires. Mirrors
 * Slice B3's share/remove pattern for destructive actions.
 */
export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fire(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const resp = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = (await resp.json()) as { booking?: unknown; error?: string; message?: string };
      if (!resp.ok) {
        setError(data.message ?? data.error ?? 'Could not cancel.');
        setPending(false);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel.');
      setPending(false);
    }
  }

  const label = pending
    ? 'Canceling…'
    : confirming
      ? 'Click again to confirm cancel'
      : 'Cancel booking';

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-label={
          confirming ? 'Confirm cancellation. Click again to cancel the booking.' : 'Cancel booking'
        }
        aria-busy={pending}
        onClick={() => {
          if (confirming) {
            void fire();
          } else {
            setConfirming(true);
            // Auto-revert after 4s if the user doesn't click again.
            setTimeout(() => setConfirming(false), 4000);
          }
        }}
        disabled={pending}
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-body-sm)',
          letterSpacing: '0.04em',
          padding: '0.6rem 1rem',
          background: confirming ? 'var(--accent-warning)' : 'transparent',
          color: confirming ? 'var(--surface-base)' : 'var(--ink-secondary)',
          border: `1px solid ${confirming ? 'var(--accent-warning)' : 'var(--border-subtle)'}`,
          borderRadius: '0.4rem',
          cursor: pending ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
          transition: 'background 160ms ease-out, color 160ms ease-out',
        }}
      >
        {label}
      </button>
      {/* Screen-reader announcement for the confirming state - sighted
       *  users see the button text change; AT users get the same signal
       *  via aria-live. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {confirming && !pending ? 'Confirm cancellation. Click again to cancel the booking.' : ''}
      </span>
      {error && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            color: 'var(--accent-warning)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
