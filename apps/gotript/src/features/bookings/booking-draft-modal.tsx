'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BookingDraft } from '@core/booking';
import type { SavedTripRow as SavedTripRowData } from '../workspace/hooks/use-saved-trips';
import { useModalA11y } from '../shared/use-modal-a11y';

interface BookingDraftModalProps {
  trip: SavedTripRowData;
  onClose: () => void;
}

type ModalPhase = 'form' | 'review' | 'confirming' | 'done';

/**
 * Two-step approval modal for booking flow.
 *
 *   Step 1 (form): collect traveler details (name, email, guest count).
 *           POST /api/bookings/draft to mint the structured draft.
 *
 *   Step 2 (review): show the full draft (dates, total, cancellation
 *           policy, placeholder-dates warning if applicable). The user
 *           explicitly clicks "Confirm booking" - this is the gate
 *           Slice D enforces for every tier. POST /api/bookings/confirm
 *           with the draft's idempotencyKey.
 *
 * On success → navigate to /bookings/[id]. The idempotencyKey in
 * state means a double-click of "Confirm booking" coalesces to one
 * booking at the provider.
 *
 * Mount/unmount drives state reset - the parent conditionally renders
 * this component, so each open is a fresh instance with form fields
 * cleared. No reset-effect needed.
 */
export function BookingDraftModal({ trip, onClose }: BookingDraftModalProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<ModalPhase>('form');
  const [primaryName, setPrimaryName] = useState('');
  const [email, setEmail] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ESC, focus trap, autofocus, body scroll lock - all wrapped behind
  // a single hook so future modals (share, cancel-confirm) can adopt
  // the same primitives without re-deriving them.
  const modalRef = useModalA11y(onClose);

  async function handleDraft(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (!primaryName.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    try {
      const resp = await fetch('/api/bookings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedTripId: trip.id,
          traveler: {
            primaryName: primaryName.trim(),
            email: email.trim(),
            guestCount: { adults, children, infants: 0 },
          },
        }),
      });
      const data = (await resp.json()) as {
        draft?: BookingDraft;
        error?: string;
        message?: string;
      };
      if (!resp.ok || !data.draft) {
        if (resp.status === 401) {
          setError('Sign in to book.');
        } else {
          setError(data.message ?? data.error ?? 'Could not draft the booking.');
        }
        return;
      }
      setDraft(data.draft);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not draft the booking.');
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!draft) return;
    setError(null);
    setPhase('confirming');
    try {
      const resp = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: draft.idempotencyKey }),
      });
      const data = (await resp.json()) as {
        booking?: { id: string };
        error?: string;
        message?: string;
      };
      if (!resp.ok || !data.booking) {
        setError(data.message ?? data.error ?? 'Could not confirm the booking.');
        setPhase('review');
        return;
      }
      setPhase('done');
      // Brief pause so the user sees "confirmed", then route.
      setTimeout(() => router.push(`/bookings/${data.booking!.id}`), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm the booking.');
      setPhase('review');
    }
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[16px] border p-6 md:p-8"
        style={{
          background: 'var(--surface-raised)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        <header className="mb-4 flex flex-col gap-1">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            {phase === 'form'
              ? 'Step 1 of 2 · Traveler'
              : phase === 'review'
                ? 'Step 2 of 2 · Confirm'
                : phase === 'confirming'
                  ? 'Confirming…'
                  : 'Confirmed'}
          </p>
          <h2
            id="booking-modal-title"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-sm)',
              fontWeight: 400,
              color: 'var(--ink-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {trip.proposalSummary.heroStayName}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--ink-tertiary)',
            }}
          >
            {trip.proposalSummary.destinationName}
            {trip.proposalSummary.nights > 0
              ? ` · ${trip.proposalSummary.nights} ${trip.proposalSummary.nights === 1 ? 'night' : 'nights'}`
              : ''}
          </p>
        </header>

        {phase === 'form' && (
          <form onSubmit={handleDraft} className="flex flex-col gap-3">
            <Field label="Primary traveler name">
              <input
                type="text"
                name="primary-traveler-name"
                autoComplete="name"
                spellCheck={false}
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                required
                style={fieldStyle}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={fieldStyle}
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Field label="Adults">
                <input
                  type="number"
                  inputMode="numeric"
                  autoComplete="off"
                  min={1}
                  max={20}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Children">
                <input
                  type="number"
                  inputMode="numeric"
                  autoComplete="off"
                  min={0}
                  max={20}
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  style={fieldStyle}
                />
              </Field>
            </div>
            {error && <ErrorBanner text={error} />}
            <div className="mt-2 flex justify-end gap-2">
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">Review draft →</PrimaryButton>
            </div>
          </form>
        )}

        {phase !== 'form' && draft && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md p-4" style={{ background: 'var(--surface-overlay)' }}>
              <DraftLine label="Dates" value={`${draft.checkIn} → ${draft.checkOut}`} />
              <DraftLine label="Nights" value={String(draft.nights)} />
              <DraftLine
                label="Guests"
                value={`${draft.traveler.guestCount.adults} adult${draft.traveler.guestCount.adults === 1 ? '' : 's'}${
                  draft.traveler.guestCount.children > 0
                    ? ` · ${draft.traveler.guestCount.children} child${draft.traveler.guestCount.children === 1 ? '' : 'ren'}`
                    : ''
                }`}
              />
              <DraftLine
                label="Total"
                value={`${draft.total.amount.toLocaleString()} ${draft.total.currency}`}
                emphasis
              />
              <DraftLine label="Cancellation" value={draft.cancellation.description} small />
              {draft.placeholderDates && (
                <p
                  className="mt-3"
                  role="note"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontStyle: 'italic',
                    fontSize: '0.78rem',
                    color: 'var(--accent-warning)',
                    lineHeight: 1.5,
                  }}
                >
                  Heads up - these dates are a stand-in because the saved trip didn&apos;t include
                  specifics. Cancel this draft, edit the trip with exact dates, then come back to
                  book.
                </p>
              )}
            </div>
            {error && <ErrorBanner text={error} />}
            {phase === 'done' ? (
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                  fontSize: 'var(--text-body)',
                  color: 'var(--accent-primary)',
                }}
              >
                ✓ Confirmed. Loading your confirmation…
              </p>
            ) : (
              <div className="flex justify-end gap-2">
                <SecondaryButton type="button" onClick={onClose} disabled={phase === 'confirming'}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={phase === 'confirming'}
                >
                  {phase === 'confirming' ? 'Confirming…' : 'Confirm booking'}
                </PrimaryButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-body-sm)',
  background: 'var(--surface-overlay)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '0.4rem',
  padding: '0.6rem 0.8rem',
  color: 'var(--ink-primary)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function DraftLine({
  label,
  value,
  emphasis = false,
  small = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  small?: boolean;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      <span
        className="text-right"
        style={{
          fontFamily: small ? 'var(--font-fraunces)' : 'var(--font-fraunces)',
          fontStyle: small ? 'italic' : 'normal',
          fontSize: emphasis ? '1.05rem' : small ? '0.78rem' : 'var(--text-body)',
          fontWeight: emphasis ? 500 : 400,
          color: emphasis ? 'var(--accent-primary)' : 'var(--ink-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-body-sm)',
        letterSpacing: '0.04em',
        padding: '0.6rem 1rem',
        background: 'var(--ink-primary)',
        color: 'var(--surface-base)',
        border: 'none',
        borderRadius: '0.4rem',
        cursor: rest.disabled ? 'wait' : 'pointer',
        opacity: rest.disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-body-sm)',
        letterSpacing: '0.04em',
        padding: '0.6rem 1rem',
        background: 'transparent',
        color: 'var(--ink-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.4rem',
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <p
      className="rounded-md px-3 py-2"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.78rem',
        background: 'rgba(255,142,107,0.08)',
        color: 'var(--accent-warning)',
        border: '1px solid var(--accent-warning)',
      }}
    >
      {text}
    </p>
  );
}
